import { useRef, type CSSProperties, type ReactNode } from 'react'
import { interpolateColors } from 'remotion'
import { clamp01, mix } from './motion'
import { useSoundProbe, useSoundTrack } from './sound'
import { H, SHADOW, W, lerpRect, type Point, type Rect } from './theme'

/* 3D-переходы элементов (CSS 3D) — без пролёта камеры: переворот карточки,
   наклон окна в перспективе, стопка слоёв по глубине, портал из кнопки и
   раскрытие кругом. Прогресс (t, angle) задаёт сцена — обычно пружиной из
   motion.ts, поэтому всё точно по кадру. */

/** Переворот карточки (П15): angle — угол по вертикальной оси, градусы. 0 —
    лицо, 180 — оборот (back). Для входа ребром: angle от 90 к 0 без back. */
export function Flip({
  angle,
  front,
  back,
  perspective = 1400,
  axis = 'y',
  style,
}: {
  angle: number
  front: ReactNode
  back?: ReactNode
  perspective?: number
  axis?: 'x' | 'y'
  style?: CSSProperties
}) {
  const rotate = axis === 'y' ? 'rotateY' : 'rotateX'
  const face: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }
  const self = useRef<HTMLDivElement>(null)
  useSoundProbe('flip', angle, self, { eps: 0.3, min: 25 })
  return (
    <div ref={self} style={{ position: 'absolute', perspective, ...style }}>
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `${rotate}(${angle}deg)` }}>
        <div style={face}>{front}</div>
        {back && <div style={{ ...face, transform: `${rotate}(180deg)` }}>{back}</div>}
      </div>
    </div>
  )
}

/** Карусель (наклон в перспективе): t = 0 — на месте лицом к зрителю, t = 1 —
    ушло вправо и повёрнуто от зрителя, t = −1 — влево. Вход справа: t 1 → 0,
    уход влево: t 0 → −1. Работает на целом кадре сцены или на окне. */
export function Swing({
  t,
  distance = 1100,
  angle = 38,
  depth = 420,
  perspective = 2200,
  children,
  style,
}: {
  t: number
  distance?: number
  angle?: number
  depth?: number
  perspective?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const away = Math.min(1, Math.abs(t))
  const self = useRef<HTMLDivElement>(null)
  useSoundProbe('whoosh', t, self, { eps: 0.004, gain: 0.8, min: 0.15 })
  if (away >= 0.999) return null
  /* На месте 3D снимается: текст и холсты остаются пиксельно чёткими. */
  const still = away < 0.0005
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        inset: 0,
        transform: still ? undefined : `perspective(${perspective}px) translateX(${t * distance}px) translateZ(${-away * depth}px) rotateY(${t * angle}deg)`,
        transformOrigin: '50% 50%',
        opacity: 1 - Math.pow(away, 2.2),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Стопка слоёв (С, П9): t = 0 — плоско, вид спереди; t = 1 — изометрия, слои
    (<Layer depth>) стоят над основанием на своей высоте. На t = 0 3D снимается
    целиком: текст и холсты остаются пиксельно чёткими. */
export function LayerStack({
  t,
  rotateX = 50,
  rotateZ = -26,
  scale = 0.8,
  perspective = 2600,
  children,
  style,
}: {
  t: number
  rotateX?: number
  rotateZ?: number
  scale?: number
  perspective?: number
  children: ReactNode
  style?: CSSProperties
}) {
  const flat = Math.abs(t) < 0.0005
  const self = useRef<HTMLDivElement>(null)
  useSoundProbe('layers', t, self, { eps: 0.004, min: 0.15 })
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        transformStyle: flat ? undefined : 'preserve-3d',
        transform: flat ? undefined : `perspective(${perspective}px) rotateX(${t * rotateX}deg) rotateZ(${t * rotateZ}deg) scale(${mix(1, scale, t)})`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Слой стопки: поднят над основанием на depth px (внутри LayerStack), scale —
    свой масштаб слоя (приподнятая карточка). На depth = 0 3D не включается:
    в плоском окне порядок слоёв решает zIndex. */
export function Layer({ depth, scale = 1, children, style }: { depth: number; scale?: number; children?: ReactNode; style?: CSSProperties }) {
  const raised = Math.abs(depth) > 0.01
  const scaled = Math.abs(scale - 1) > 0.0001 ? ` scale(${scale})` : ''
  return (
    <div style={{ position: 'absolute', transformStyle: raised ? 'preserve-3d' : undefined, transform: raised ? `translateZ(${depth}px)${scaled}` : scaled || undefined, ...style }}>
      {children}
    </div>
  )
}

/** Портал (П1): нажатая кнопка растёт из своего прямоугольника в to (весь
    кадр, окно), меняя скругление и цвет, и становится фоном следующей сцены. */
export function Portal({ from, to, t, color, toColor, radius = [10, 0] }: { from: Rect; to: Rect; t: number; color: string; toColor?: string; radius?: readonly [number, number] }) {
  const self = useRef<HTMLDivElement>(null)
  useSoundProbe('whoosh', t, self, { eps: 0.004, gain: 0.7, min: 0.15 })
  if (t <= 0) return null
  const k = clamp01(t)
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: mix(from.x, to.x, k),
        top: mix(from.y, to.y, k),
        width: mix(from.width, to.width, k),
        height: mix(from.height, to.height, k),
        borderRadius: mix(radius[0], radius[1], k),
        background: toColor ? interpolateColors(k, [0, 1], [color, toColor]) : color,
      }}
    />
  )
}

/** Раскрытие кругом (П3) из точки at: t = 0 — точка, t = 1 — весь кадр. С
    children — круг открывает их (маска), без — заливает кадр цветом color. */
export function Iris({ at, t, color, children, start = 0 }: { at: Point; t: number; color?: string; children?: ReactNode; start?: number }) {
  const far = Math.max(Math.hypot(at[0], at[1]), Math.hypot(W - at[0], at[1]), Math.hypot(at[0], H - at[1]), Math.hypot(W - at[0], H - at[1]))
  const r = mix(start, far + 4, clamp01(t))
  useSoundProbe('air', t, { x: at[0], y: at[1] }, { eps: 0.004, min: 0.15 })
  if (children) {
    return <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${r}px at ${at[0]}px ${at[1]}px)` }}>{children}</div>
  }
  if (t <= 0) return null
  return <div style={{ position: 'absolute', left: at[0] - r, top: at[1] - r, width: r * 2, height: r * 2, borderRadius: '50%', background: color }} />
}

/** Элемент между двумя местами (м-отрыв П4, возврат П5): t = 0 — в from,
    t = 1 — в to (обычно крупнее и ближе к камере). Тень растёт с подъёмом.
    Дети заполняют блок (inset 0): у from и to должно быть одно соотношение
    сторон. t можно дать больше 1 — перелёт пружины. */
export function Lift({ from, to, t, radius = 12, children, style }: { from: Rect; to: Rect; t: number; radius?: number; children: ReactNode; style?: CSSProperties }) {
  const rect = lerpRect(from, to, t)
  const up = clamp01(t)
  const self = useRef<HTMLDivElement>(null)
  useSoundProbe('whoosh', t, self, { eps: 0.004, travel: true, min: 0.15 })
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        borderRadius: radius,
        boxShadow: up > 0.02 ? SHADOW.lifted : SHADOW.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Шторка-предмет (П12): тёмная скруглённая плоскость — корпус телефона с
    титановой кромкой — проносится у самой камеры справа налево и открывает
    следующий кадр. t 0 → 1, ход ровный; около t = 0,5 кадр закрыт целиком —
    здесь склейка: уходящая сцена в последних dur кадрах даёт
    t = 0,5 · span(frame, длина − dur, dur), входящая в первых —
    t = 0,5 + 0,5 · span(frame, 0, dur). */
export function Sweep({ t, angle = -7 }: { t: number; angle?: number }) {
  /* Чуть шире кадра: целиком он закрыт лишь пару кадров вокруг склейки. */
  const width = W * 1.15
  const height = H * 1.7
  const x = mix(W + 80, -width - 80, t)
  /* Ход делят две сцены (уходящая до 0,5, входящая после): у дорожки общее
     имя, сведение режет её по паузам. Звук — у самой камеры, справа налево. */
  useSoundTrack('sweep', 'whoosh', t > 0 && t < 1, { x: x + width / 2, y: H / 2 }, { gain: 1.2 })
  if (t <= 0 || t >= 1) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: (H - height) / 2,
        width,
        height,
        borderRadius: 240,
        padding: 26,
        boxSizing: 'border-box',
        background: 'linear-gradient(145deg, #eef0f3 0%, #c9cdd4 45%, #e7e9ed 100%)',
        boxShadow: '0 40px 120px rgba(15, 23, 42, 0.35)',
        transform: `rotate(${angle}deg)`,
        /* Размытие кромок — как смаз движения: плоскость идёт ~250 px за кадр. */
        filter: 'blur(6px)',
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 214, background: 'linear-gradient(115deg, #2a2e37 0%, #0e1015 36%, #1d2028 58%, #0b0c0f 100%)' }} />
    </div>
  )
}

/** Колода (П8): t = 0 — экран на месте; t от 0 к 1 — уходит в колоду:
    уменьшается, отъезжает вверх и назад, притухает; t от 0 к −1 — ещё не
    пришёл: лежит под кадром и въезжает снизу с наклоном. Уход прежней сцены —
    t 0 → 1, вход новой — t −1 → 0, одновременно. */
export function Deck({ t, children, style }: { t: number; children: ReactNode; style?: CSSProperties }) {
  /* Уходящий и входящий экраны движутся вместе: сведение сливает два звука
     одного вида, начатые в одни кадры, в один. */
  useSoundProbe('air', t, { x: W / 2, y: H * 0.4 }, { eps: 0.004, min: 0.15 })
  if (t <= -0.999 || t >= 0.999) return null
  const still = Math.abs(t) < 0.0005
  const back = Math.max(0, t)
  const ahead = Math.max(0, -t)
  const transform = still
    ? undefined
    : `perspective(2400px) translateY(${-back * 90 + ahead * H * 0.95}px) translateZ(${-back * 420}px) rotateX(${back * 8 - ahead * 14}deg)`
  return (
    <div style={{ position: 'absolute', inset: 0, transform, transformOrigin: '50% 30%', opacity: 1 - back * 0.85, ...style }}>
      {children}
    </div>
  )
}
