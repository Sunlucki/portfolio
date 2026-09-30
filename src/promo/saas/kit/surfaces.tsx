import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import { SoundClock } from './sound'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Icon } from './draw'
import { CARD, DIM, FONT, INK, LINE, MUTED, PAPER, SHADOW, tint, useAccent } from './theme'

/* Поверхности сцены: светлая «бумага», окно браузера и 2D-iPhone. */

/** Фон ролика: мягкий градиент бумаги, едва заметная сетка точек, гаснущая к
    краям, и два очень мягких пятна — акцент продукта и холодный серый. Пятна
    медленно дрейфуют, чтобы стоящий кадр не был мёртвым. Без ореолов: у пятен
    прозрачность не выше 0,1. */
/** Stage внутри Stage (фон финала B2B): часы звука ставит только внешний —
    внутренний видит кадр своей сцены, и звуки финала легли бы в начало ролика. */
const Nested = createContext(false)

export function Stage({ children }: { children?: ReactNode }) {
  const nested = useContext(Nested)
  const frame = useCurrentFrame()
  const accent = useAccent()
  const drift = (speed: number, phase: number, amount: number) => Math.sin(frame * speed + phase) * amount
  return (
    <Nested.Provider value={true}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, #f8f9fb 0%, ${PAPER} 62%, #eceef3 100%)`, fontFamily: FONT, color: INK, overflow: 'hidden' }}>
        {/* Текст SVG — геометрически точный: при полном рендере Chrome переиспользует
            вкладку, и размер текста, посчитанный под прошлое увеличение камеры,
            иногда оставался — текст выходил в 1,5 раза крупнее и не на месте
            (нашёл агент B2B, 28.09). */}
        <style>{'svg text { text-rendering: geometricPrecision; }'}</style>
        {!nested && <SoundClock />}
        <div
          style={{
            position: 'absolute',
            width: 1500,
            height: 1500,
            left: -520 + drift(0.011, 0, 40),
            top: -820 + drift(0.009, 1.3, 30),
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${tint(accent, 0.1)}, ${tint(accent, 0)})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 1600,
            height: 1600,
            right: -640 + drift(0.008, 2.1, 40),
            bottom: -900 + drift(0.012, 0.4, 30),
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0))',
          }}
        />
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(rgba(17, 24, 39, 0.085) 1.4px, transparent 1.9px)',
            backgroundSize: '30px 30px',
            backgroundPosition: '15px 15px',
            maskImage: 'radial-gradient(ellipse 72% 68% at 50% 46%, black 25%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 72% 68% at 50% 46%, black 25%, transparent 100%)',
          }}
        />
        {children}
      </AbsoluteFill>
    </Nested.Provider>
  )
}

/** Высота строки браузера, px. */
export const CHROME = 46

/** Окно браузера в светлой теме: скругление 16, мягкая большая тень, строка с
    адресом. width × height — размер страницы (без строки). Страница — children,
    в координатах страницы.

    clip = false — страница не обрезается по окну: нужно для CSS-3D внутри
    (overflow: hidden сплющивает preserve-3d). Тогда нижние углы скругляет фон
    страницы, а содержимое само держится в её границах. */
export function AppWindow({
  url,
  width,
  height,
  children,
  clip = true,
  page = PAPER,
  style,
}: {
  url: string
  width: number
  height: number
  children?: ReactNode
  clip?: boolean
  /** Фон страницы под содержимым. */
  page?: string
  style?: CSSProperties
}) {
  const radius = 16
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height: height + CHROME,
        borderRadius: radius,
        boxShadow: `${SHADOW.window}, 0 0 0 1px rgba(15, 23, 42, 0.07)`,
        background: page,
        overflow: clip ? 'hidden' : 'visible',
        transformStyle: clip ? undefined : 'preserve-3d',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: CHROME,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #fdfdfe 0%, #f6f7f9 100%)',
          borderBottom: `1px solid ${LINE}`,
          borderRadius: `${radius}px ${radius}px 0 0`,
          fontFamily: FONT,
        }}
      >
        <div style={{ position: 'absolute', left: 20, top: CHROME / 2 - 6, display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: '#dcdfe5', boxShadow: 'inset 0 0 0 1px rgba(15, 23, 42, 0.06)' }} />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 30,
            padding: '0 18px',
            minWidth: 360,
            justifyContent: 'center',
            borderRadius: 9,
            background: 'rgba(15, 23, 42, 0.045)',
            color: MUTED,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '-0.005em',
          }}
        >
          <Icon name="lock" size={13} color={DIM} stroke={2.4} />
          {url}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          width,
          height,
          overflow: clip ? 'hidden' : 'visible',
          borderRadius: `0 0 ${radius}px ${radius}px`,
          transformStyle: clip ? undefined : 'preserve-3d',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Экран iPhone в точках iOS: 393 × 852, приложение — ниже 59 pt (под островком). */
export const IPHONE = { width: 393, height: 852, top: 59 }

/** 2D-iPhone: светлый титановый ободок, чёрная рамка, Dynamic Island, строка
    состояния iOS и полоска «домой». Экран — children, в точках iOS × scale.
    Курсора на телефоне нет: только касания и свайпы (<Tap>, <Swipe>). */
export function Phone({
  scale = 1,
  time = '9:41',
  dark = false,
  screen = CARD,
  statusBar = true,
  children,
  style,
}: {
  scale?: number
  time?: string
  /** Светлые значки строки состояния — для тёмного экрана. */
  dark?: boolean
  screen?: string
  /** false — строку состояния рисует сам экран (двойник с iOS-шапкой). */
  statusBar?: boolean
  children?: ReactNode
  style?: CSSProperties
}) {
  const bezel = 12 * scale
  const rim = 3.5 * scale
  const width = IPHONE.width * scale
  const height = IPHONE.height * scale
  const ink = dark ? '#ffffff' : INK
  return (
    <div
      style={{
        position: 'absolute',
        width: width + (bezel + rim) * 2,
        height: height + (bezel + rim) * 2,
        borderRadius: 68 * scale,
        padding: rim,
        boxSizing: 'border-box',
        background: 'linear-gradient(145deg, #eef0f3 0%, #c9cdd4 45%, #e7e9ed 100%)',
        boxShadow: `${SHADOW.window}, inset 0 0 0 1px rgba(255, 255, 255, 0.7)`,
        ...style,
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 64.5 * scale, background: '#0b0c0f', padding: bezel, boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', width, height, borderRadius: 52 * scale, overflow: 'hidden', background: screen }}>
          {children}
          <svg width={width} height={IPHONE.top * scale} viewBox={`0 0 ${IPHONE.width} ${IPHONE.top}`} style={{ position: 'absolute', left: 0, top: 0 }}>
            <rect x={IPHONE.width / 2 - 63} y={11} width={126} height={37} rx={18.5} fill="#000" />
            {statusBar && (
              <>
                <text x={51} y={38} textAnchor="middle" fontFamily={FONT} fontSize={17} fontWeight={650} fill={ink}>
                  {time}
                </text>
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={289 + i * 5} y={33 - (4 + i * 2.6)} width={3.2} height={4 + i * 2.6} rx={1} fill={ink} />
                ))}
                <g fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round">
                  {[0, 1, 2].map((i) => (
                    <path key={i} d={arc(321, 34, 3 + i * 3.4)} />
                  ))}
                </g>
                <rect x={335} y={23} width={25} height={12} rx={3.5} fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth={1.2} />
                <rect x={337} y={25} width={18} height={8} rx={2} fill={ink} />
                <rect x={361.5} y={27} width={1.6} height={4} rx={0.8} fill={ink} fillOpacity={0.4} />
              </>
            )}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 8 * scale,
              width: 134 * scale,
              height: 5 * scale,
              marginLeft: -67 * scale,
              borderRadius: 3 * scale,
              background: ink,
              opacity: 0.85,
            }}
          />
        </div>
      </div>
    </div>
  )
}

/** Дуга значка Wi-Fi: четверть окружности вверх из точки (x, y). */
function arc(x: number, y: number, r: number): string {
  const a = -Math.PI * 0.75
  const b = -Math.PI * 0.25
  return `M ${x + r * Math.cos(a)} ${y + r * Math.sin(a)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(b)} ${y + r * Math.sin(b)}`
}

/** Экран ноутбука 16:10 (в точках экрана, как холсты художников 1600 × 1000). */
export const LAPTOP_RATIO = 10 / 16

/** 2D-ноутбук (MacBook) для сцен «на столе»: экран 16:10 в чёрной рамке с
    камерой, светлое основание с выемкой. width — ширина экрана, px; экран —
    children, в px экрана (width × width·10/16). */
export function Laptop({ width = 1100, children, style }: { width?: number; children?: ReactNode; style?: CSSProperties }) {
  const screen = { width, height: width * LAPTOP_RATIO }
  const bezel = width * 0.022
  const lid = { width: screen.width + bezel * 2, height: screen.height + bezel * 2 }
  const base = { width: lid.width * 1.14, height: width * 0.034 }
  return (
    <div style={{ position: 'absolute', width: base.width, height: lid.height + base.height, ...style }}>
      <div
        style={{
          position: 'absolute',
          left: (base.width - lid.width) / 2,
          top: 0,
          width: lid.width,
          height: lid.height,
          boxSizing: 'border-box',
          padding: bezel,
          borderRadius: bezel * 1.6,
          background: '#0c0d10',
          boxShadow: `inset 0 0 0 ${Math.max(1, width * 0.002)}px #3a3d44, ${SHADOW.window}`,
        }}
      >
        <div style={{ position: 'relative', width: screen.width, height: screen.height, borderRadius: bezel * 0.5, overflow: 'hidden', background: PAPER }}>{children}</div>
        <div style={{ position: 'absolute', left: '50%', top: bezel * 0.32, width: bezel * 0.36, height: bezel * 0.36, marginLeft: -bezel * 0.18, borderRadius: '50%', background: '#1d2026' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: lid.height - 1,
          width: base.width,
          height: base.height,
          borderRadius: `${base.height * 0.3}px ${base.height * 0.3}px ${base.height}px ${base.height}px`,
          background: 'linear-gradient(180deg, #eef0f3 0%, #cfd3da 55%, #b9bec6 100%)',
          boxShadow: '0 18px 30px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div style={{ position: 'absolute', left: '50%', top: 0, width: base.width * 0.14, height: base.height * 0.34, marginLeft: -base.width * 0.07, borderRadius: `0 0 ${base.height}px ${base.height}px`, background: '#c3c8cf' }} />
      </div>
    </div>
  )
}

/** Сырой текст сцены: подпись, метка. Без плашек и рамок (правило владельца). */
export function Label({ children, size = 15, color = MUTED, weight = 600, caps = false, style }: { children: ReactNode; size?: number; color?: string; weight?: number; caps?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: caps ? '0.16em' : '-0.01em',
        textTransform: caps ? 'uppercase' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
