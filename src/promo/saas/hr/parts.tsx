import { createElement, useRef, type CSSProperties, type ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { ICONS, type IconName, type IconNode } from '../kit/icons'
import { SPRINGS, clamp01, easeIn, easeOut, mix, span, spring } from '../kit/motion'
import { useSoundCue } from '../kit/sound'
import { FONT, SHADOW, type Point, type Rect } from '../kit/theme'
import { HR_ICONS, type HrIconName } from './icons'

/** Кадры клавиш печати (м-ввод) для typed(text, frame, start, speed) и
    dots(…): знак k виден с кадра ceil(start + k · speed); клавиша на каждый
    знак, но не чаще раза в gap кадров (≤ 15 в секунду). */
export function keyFrames(start: number, count: number, speed: number, gap = 2): number[] {
  const out: number[] = []
  for (let k = 0; k < count; k++) {
    const at = Math.ceil(start + k * speed - 1e-6)
    const last = out[out.length - 1]
    if (last === undefined || at - last >= gap) out.push(at)
  }
  return out
}

/* Общие детали ролика iApply: корпус телефона под двойники, геометрия экранов
   в мире, тост продукта (react-hot-toast), системная подсказка, иконки. */

/** Бумага сцены без дрейфующих пятен — непрозрачный фон для раскрытия кругом
    (П3): под кругом не должна просвечивать уходящая сцена. Тот же градиент и
    та же сетка точек, что у <Stage>. */
export function Paper({ opacity = 1 }: { opacity?: number }) {
  if (opacity <= 0.001) return null
  return (
    <div style={{ position: 'absolute', inset: 0, opacity, background: 'linear-gradient(180deg, #f8f9fb 0%, #f3f4f8 62%, #eceef3 100%)' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(17, 24, 39, 0.085) 1.4px, transparent 1.9px)',
          backgroundSize: '30px 30px',
          backgroundPosition: '15px 15px',
          maskImage: 'radial-gradient(ellipse 72% 68% at 50% 46%, black 25%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 72% 68% at 50% 46%, black 25%, transparent 100%)',
        }}
      />
    </div>
  )
}

/* ── Геометрия: экран телефона и страница окна в координатах мира ─────── */

/** Экран телефона в мире: левый верхний угол экрана и пикселей мира на точку iOS. */
export interface PhoneSpot {
  x: number
  y: number
  scale: number
}

export const SCREEN = { width: 393, height: 852 }
/** Корпус вокруг экрана (ободок + рамка), точек iOS. */
export const PHONE_PAD = 15.5

export const phonePt = (p: PhoneSpot, x: number, y: number): [number, number] => [p.x + x * p.scale, p.y + y * p.scale]
export const phoneRect = (p: PhoneSpot, r: Rect): Rect => ({ x: p.x + r.x * p.scale, y: p.y + r.y * p.scale, width: r.width * p.scale, height: r.height * p.scale })
export const phoneScreen = (p: PhoneSpot): Rect => phoneRect(p, { x: 0, y: 0, ...SCREEN })
export const phoneBody = (p: PhoneSpot): Rect => phoneRect(p, { x: -PHONE_PAD, y: -PHONE_PAD, width: SCREEN.width + PHONE_PAD * 2, height: SCREEN.height + PHONE_PAD * 2 })

/** Страница окна в мире: левый верхний угол страницы (под строкой браузера) и
    пикселей мира на логический пиксель художника. */
export interface PageSpot {
  x: number
  y: number
  k: number
}

export const pagePt = (p: PageSpot, x: number, y: number): [number, number] => [p.x + x * p.k, p.y + y * p.k]
export const pageRect = (p: PageSpot, r: Rect): Rect => ({ x: p.x + r.x * p.k, y: p.y + r.y * p.k, width: r.width * p.k, height: r.height * p.k })

export const centerOf = (r: Rect): [number, number] => [r.x + r.width / 2, r.y + r.height / 2]
export const grow = (r: Rect, dx: number, dy = dx): Rect => ({ x: r.x - dx, y: r.y - dy, width: r.width + dx * 2, height: r.height + dy * 2 })
export const union = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }
}

/** Точка на дуге перелёта: по прямой от from к to и вверх на lift в середине. */
export function arcPoint(from: Point, to: Point, t: number, lift: number): [number, number] {
  return [mix(from[0], to[0], t), mix(from[1], to[1], t) - Math.sin(Math.PI * clamp01(t)) * lift]
}

/* ── Корпус iPhone для двойников ──────────────────────────────────────────
   Тот же ободок, что у <Phone> набора, но без строки состояния, островка и
   полоски «домой» поверх экрана: художники iApply рисуют их сами, со своим
   часом дня (06:05 на входе, 07:00 на скане, 18:15 в сообщениях). */

export function Handset({ spot, children, style, screen = '#000000' }: { spot: PhoneSpot; children?: ReactNode; style?: CSSProperties; screen?: string }) {
  const s = spot.scale
  const body = phoneBody(spot)
  const rim = 3.5 * s
  const bezel = 12 * s
  return (
    <div
      style={{
        position: 'absolute',
        left: body.x,
        top: body.y,
        width: body.width,
        height: body.height,
        borderRadius: 68 * s,
        padding: rim,
        boxSizing: 'border-box',
        background: 'linear-gradient(145deg, #eef0f3 0%, #c9cdd4 45%, #e7e9ed 100%)',
        boxShadow: `${SHADOW.window}, inset 0 0 0 1px rgba(255, 255, 255, 0.7)`,
        ...style,
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 64.5 * s, background: '#0b0c0f', padding: bezel, boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', width: SCREEN.width * s, height: SCREEN.height * s, borderRadius: 52 * s, overflow: 'hidden', background: screen }}>{children}</div>
      </div>
    </div>
  )
}

/* ── Тост продукта: react-hot-toast с настройками iApply ──────────────────
   WEB APP/client/src/App.tsx: <Toaster position="top-center" toastOptions={{
   style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }}>;
   остальное — стили react-hot-toast по умолчанию: белый, #363636, тень
   0 3px 10px / 0 3px 3px, max-width 350, значок — зелёный круг #61d345, в нём
   галочка. Вход — сверху с масштаба 0,6, как у библиотеки. */

export function HotToast({
  x,
  y,
  at,
  until = Infinity,
  label,
  scale = 1,
  kind = 'success',
  width,
}: {
  /** Центр тоста по горизонтали, px слоя. */
  x: number
  /** Верх тоста, px слоя. */
  y: number
  at: number
  until?: number
  label: string
  /** Пикселей слоя на CSS-пиксель продукта. */
  scale?: number
  kind?: 'success' | 'error'
  /** Ширина, px продукта (иначе по тексту, не шире 350). */
  width?: number
}) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  /* Звук: тост встал — два колокольчика; ушёл — тихий хлопок вниз. */
  useSoundCue('toast', at, self, { gain: 0.9 })
  useSoundCue('popOut', Number.isFinite(until) ? until : null, self, { gain: 0.5 })
  if (frame < at - 1 || frame > until + 12) return null
  const enter = spring(frame, at, SPRINGS.glide)
  const leave = easeIn(span(frame, until, 10))
  const s = scale
  const circle = spring(frame, at + 3, SPRINGS.pop)
  const check = easeOut(span(frame, at + 7, 8))
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, ${(1 - enter) * -120 * s - leave * 40 * s}px) scale(${mix(0.6, 1, clamp01(enter))})`,
        transformOrigin: '50% 0%',
        opacity: mix(0.5, 1, clamp01(enter)) * (1 - leave),
        width: width !== undefined ? width * s : undefined,
        maxWidth: 350 * s,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        padding: `${12 * s}px ${16 * s}px`,
        borderRadius: 12 * s,
        background: '#ffffff',
        color: '#363636',
        lineHeight: 1.3,
        fontFamily: FONT,
        fontSize: 14 * s,
        boxShadow: `0 ${3 * s}px ${10 * s}px rgba(0, 0, 0, 0.1), 0 ${3 * s}px ${3 * s}px rgba(0, 0, 0, 0.05)`,
        whiteSpace: width !== undefined ? 'normal' : 'nowrap',
      }}
    >
      <svg width={20 * s} height={20 * s} viewBox="0 0 20 20" style={{ flexShrink: 0, overflow: 'visible' }}>
        <circle cx={10} cy={10} r={10 * Math.max(0, circle)} fill={kind === 'success' ? '#61d345' : '#ff4b4b'} />
        {kind === 'success' ? (
          <path d="M5.8 10.4 L8.7 13.2 L14.4 7" fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - check} opacity={check > 0 ? 1 : 0} />
        ) : (
          <path d="M6.5 6.5 L13.5 13.5 M13.5 6.5 L6.5 13.5" fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" opacity={check} />
        )}
      </svg>
      <div style={{ margin: `${4 * s}px ${10 * s}px`, flex: '1 1 auto', textAlign: 'center' }}>{label}</div>
    </div>
  )
}

/** Системная подсказка браузера (title=«Zatwierdź» у кнопки без подписи): светлая
    плашка macOS, 12 px. x, y — левый верх, px слоя. */
export function SystemTip({ x, y, at, until = Infinity, label, scale = 1 }: { x: number; y: number; at: number; until?: number; label: string; scale?: number }) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  /* Звук: подсказка всплыла у кнопки. */
  useSoundCue('popIn', at, self, { gain: 0.5 })
  if (frame < at || frame > until + 8) return null
  const s = scale
  const show = easeOut(span(frame, at, 5)) * (1 - easeIn(span(frame, until, 6)))
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        padding: `${3 * s}px ${7 * s}px`,
        borderRadius: 5 * s,
        background: '#f7f7f7',
        border: `${s}px solid rgba(0, 0, 0, 0.15)`,
        boxShadow: `0 ${2 * s}px ${6 * s}px rgba(0, 0, 0, 0.18)`,
        fontFamily: FONT,
        fontSize: 12 * s,
        color: '#1f2937',
        whiteSpace: 'nowrap',
        opacity: show,
      }}
    >
      {label}
    </div>
  )
}

/* ── Иконки: набор + свои (icons.ts), прорисовка контуром ─────────────── */

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - clamp01(p), opacity: p > 0.001 ? 1 : 0 })

/** Иконка lucide с прорисовкой — как <Icon> набора, но знает и иконки ролика. */
export function Glyph({
  name,
  size = 24,
  color = 'currentColor',
  stroke = 2,
  p = 1,
  stagger = 0.35,
  style,
}: {
  name: HrIconName | IconName
  size?: number
  color?: string
  stroke?: number
  p?: number
  stagger?: number
  style?: CSSProperties
}) {
  const nodes: IconNode = (HR_ICONS as Record<string, IconNode>)[name] ?? (ICONS as Record<string, IconNode>)[name] ?? []
  const n = nodes.length
  const window = 1 / (1 + Math.max(0, n - 1) * stagger)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}>
      {nodes.map(([tag, attrs], i) => {
        const own = p >= 1 ? 1 : clamp01((p - i * stagger * window) / window)
        return createElement(tag, { key: i, ...attrs, ...(p >= 1 ? {} : dash(own)) })
      })}
    </svg>
  )
}

/* ── Смена состояния (м-статус): старое уезжает вверх, новое въезжает снизу ── */

export function Swap({ t, from, to, rect, style }: { t: number; from: ReactNode; to: ReactNode; rect: Rect; style?: CSSProperties }) {
  const k = clamp01(t)
  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height, overflow: 'hidden', ...style }}>
      {k < 1 && <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-k * 100}%)`, opacity: 1 - k }}>{from}</div>}
      {k > 0 && <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - k) * 100}%)`, opacity: k }}>{to}</div>}
    </div>
  )
}

/** Круговая волна (NFC, геозона, «живой» пульс): кольца расходятся от точки. */
export function Pulse({ x, y, at, radius, color, rings = 3, period = 24, width = 2, until = Infinity }: { x: number; y: number; at: number; radius: number; color: string; rings?: number; period?: number; width?: number; until?: number }) {
  const frame = useCurrentFrame()
  if (frame < at || frame > until + period) return null
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
      {Array.from({ length: rings }, (_, i) => {
        const local = frame - at - (i * period) / rings
        if (local < 0) return null
        const cycle = (local % period) / period
        if (frame - (local % period) > until) return null
        return <circle key={i} cx={x} cy={y} r={radius * (0.25 + 0.75 * easeOut(cycle))} fill="none" stroke={color} strokeWidth={width} opacity={(1 - cycle) * 0.7} />
      })}
    </svg>
  )
}
