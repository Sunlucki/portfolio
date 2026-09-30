import { useLayoutEffect, type ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { soundCue2d, type CueOptions, type SoundKind } from '../kit/sound'
import type { Rect } from '../kit/theme'
import { DESK } from './screen'

/* ── Звук (владелец 28.09: «каждое действие пространственно озвучено») ── */

/** Разовые звуки в своих точках кадра (буквы табло, цифры часов, галочки
    строк): звук точки — в кадре сцены Math.ceil(at), в её месте, px кадра. */
export function useSoundPoints(kind: SoundKind, points: readonly { at: number; x: number; y: number }[], options: CueOptions = {}) {
  const frame = useCurrentFrame()
  useLayoutEffect(() => {
    for (const point of points) if (Math.ceil(point.at) === frame) soundCue2d(kind, point.x, point.y, options)
  })
}

/** Кадры знаков набора (знак k — в start + k · step), прореженные: не чаще
    одного в gap кадров (2 — 15 в секунду, предел для набора). */
export function typingFrames(start: number, step: number, count: number, gap = 2): number[] {
  const out: number[] = []
  let last = -Infinity
  for (let k = 0; k < count; k++) {
    const at = Math.ceil(start + k * step)
    if (at - last < gap) continue
    out.push(at)
    last = at
  }
  return out
}

/* Приёмы ролика TAXI поверх экранов: кусок экрана встаёт пружиной, блик по
   стеклу, вспышка затвора, вход окна панели в 3D (крышка или дверь). */

/** Кусок экрана, который встаёт пружиной pop: чуть снизу и с 90% масштаба. */
export function Pop({ frame, at, rect, children, leave = Infinity }: { frame: number; at: number; rect: Rect; children: ReactNode; leave?: number }) {
  const p = spring(frame, at, SPRINGS.pop)
  const out = easeIn(span(frame, leave, 8))
  if (frame < at - 1 || out >= 1) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: clamp01(p * 1.6) * (1 - out),
        transform: `translateY(${(1 - clamp01(p)) * 14}px) scale(${mix(0.9, 1, p)})`,
      }}
    >
      {children}
    </div>
  )
}

/** Блик по стеклу экрана, когда он загорается: светлая полоса проходит по диагонали. */
export function Sweep({ frame, at, width, height, dur = 22, strength = 0.09 }: { frame: number; at: number; width: number; height: number; dur?: number; strength?: number }) {
  const t = span(frame, at, dur)
  if (t <= 0 || t >= 1) return null
  const x = mix(-0.4, 1.2, easeInOut(t)) * width
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: x - 160,
          top: -height * 0.2,
          width: 320,
          height: height * 1.4,
          transform: 'rotate(18deg)',
          background: `linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,${strength}), rgba(255,255,255,0))`,
        }}
      />
    </div>
  )
}

/** Вспышка затвора камеры телефона: белый кадр гаснет за 10 кадров. */
export function Shutter({ frame, at, width = 393, height = 852 }: { frame: number; at: number; width?: number; height?: number }) {
  const t = span(frame, at, 12)
  if (frame < at || t >= 1) return null
  return <div style={{ position: 'absolute', left: 0, top: 0, width, height, background: '#ffffff', opacity: 0.85 * (1 - easeOut(t)) }} />
}

/** Окно панели входит в 3D: «lid» — поднимается, как крышка ноутбука, вокруг
    нижней кромки; «door» — поворачивается, как дверь, вокруг кромки со стороны
    телефона. t = 0 — закрыто, 1 — лицом к зрителю (на 1 3D снимается). */
export function DeskEnter({ t, kind, children }: { t: number; kind: 'lid' | 'door'; children: ReactNode }) {
  const flat = t >= 0.999
  const origin = kind === 'lid' ? `${DESK.x + DESK.width / 2}px ${DESK.y + DESK.height}px` : `${DESK.x + DESK.width}px ${DESK.y + DESK.height / 2}px`
  const transform = kind === 'lid' ? `rotateX(${-(1 - t) * 78}deg)` : `rotateY(${(1 - t) * 72}deg)`
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, perspective: flat ? undefined : 2600, perspectiveOrigin: origin }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: origin, transform: flat ? undefined : transform, opacity: clamp01(t * 3) }}>
        {children}
      </div>
    </div>
  )
}

/** Вспышка тоном по прямоугольнику: элемент «загорается», когда в него сели данные. */
export function Glow({ frame, at, rect, color, radius = 12, strength = 0.22, dur = 24 }: { frame: number; at: number; rect: Rect; color: string; radius?: number; strength?: number; dur?: number }) {
  const t = span(frame, at, dur)
  if (frame < at || t >= 1) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        borderRadius: radius,
        background: color,
        opacity: strength * Math.sin(Math.PI * t),
        pointerEvents: 'none',
      }}
    />
  )
}
