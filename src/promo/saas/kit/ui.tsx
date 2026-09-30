import { useRef, type CSSProperties, type ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { Icon } from './draw'
import type { IconName } from './icons'
import { SPRINGS, clamp01, easeIn, easeOut, mix, span, spring } from './motion'
import { useLang } from './lang'
import { useSoundCue } from './sound'
import { FONT, INK, MUTED, SHADOW, tint, useAccent, type Rect } from './theme'

/* Кусочки интерфейса, общие для роликов: переключатель (м-переключатель),
   тост продукта и уведомление iOS. Тексты в них — из словаря продукта. */

/** Переключатель: встаёт с перелётом в кадре at, щёлкает во «вкл.» в кадре on —
    ползунок переезжает, дорожка заливается акцентом (snap). */
export function Toggle({ at = 0, on, size = 1, style }: { at?: number; on: number; size?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('popIn', at, self, { gain: 0.5 })
  useSoundCue('toggle', on, self)
  const appear = spring(frame, at, SPRINGS.pop)
  const flip = spring(frame, on, SPRINGS.snap)
  const width = 132 * size
  const height = 76 * size
  const knob = 60 * size
  const pad = (height - knob) / 2
  const squash = 1 + 0.12 * Math.sin(Math.PI * clamp01(flip))
  return (
    <div
      ref={self}
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: height / 2,
        background: `color-mix(in srgb, ${accent} ${Math.round(clamp01(flip) * 100)}%, #e3e6ec)`,
        boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.12)',
        transform: `scale(${Math.max(0, appear)})`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: pad,
          left: mix(pad, width - pad - knob, flip),
          width: knob * squash,
          height: knob,
          borderRadius: knob / 2,
          background: '#ffffff',
          boxShadow: '0 3px 8px rgba(15, 23, 42, 0.18), 0 1px 2px rgba(15, 23, 42, 0.12)',
        }}
      />
    </div>
  )
}

/** Тост продукта (как ui/toast.tsx CRM): белая карточка, рамка в тон, иконка
    тона с прорисовкой, заголовок и описание. scale — во сколько раз крупнее
    продукта: в ролике 320-пиксельный тост мелок. Въезжает снизу с перелётом. */
export function Toast({
  x,
  y,
  at,
  until = Infinity,
  title,
  description,
  tone = '#059669',
  icon = 'circleCheck',
  scale = 1.7,
}: {
  x: number
  y: number
  at: number
  until?: number
  title: string
  description?: string
  tone?: string
  icon?: IconName
  scale?: number
}) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('toast', at, self)
  useSoundCue('popOut', Number.isFinite(until) ? until : null, self, { gain: 0.5 })
  if (frame < at) return null
  const enter = spring(frame, at, SPRINGS.pop)
  const leave = easeIn(span(frame, until, 8))
  const s = scale
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 320 * s,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10 * s,
        padding: `${10 * s}px ${12 * s}px`,
        borderRadius: 12 * s,
        background: '#ffffff',
        border: `${s}px solid ${tint(tone, 0.35)}`,
        boxShadow: SHADOW.lifted,
        fontFamily: FONT,
        opacity: clamp01(enter * 1.5) * (1 - leave),
        transform: `translateY(${(1 - enter) * 40 + leave * 20}px) scale(${mix(0.94, 1, clamp01(enter))})`,
        transformOrigin: '50% 100%',
      }}
    >
      <Icon name={icon} size={15 * s} color={tone} stroke={2.2} p={easeOut(span(frame, at + 4, 12))} style={{ marginTop: s }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13 * s, fontWeight: 550, color: INK, lineHeight: 1.35 }}>{title}</div>
        {description && <div style={{ marginTop: 2 * s, fontSize: 12 * s, color: MUTED, lineHeight: 1.35 }}>{description}</div>}
      </div>
    </div>
  )
}

/** Уведомление iOS: матовое стекло, значок приложения, имя, «teraz», заголовок
    и текст. Падает сверху с перелётом. Размеры — в точках iOS × scale. */
export function IosNotification({
  x,
  y,
  at,
  until = Infinity,
  app,
  title,
  body,
  time,
  glyph = 'bell',
  scale = 1,
}: {
  x: number
  y: number
  at: number
  until?: number
  app: string
  title: string
  body: string
  time?: string
  glyph?: IconName
  scale?: number
}) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('notify', at, self)
  useSoundCue('popOut', Number.isFinite(until) ? until : null, self, { gain: 0.4 })
  if (frame < at) return null
  const enter = spring(frame, at, SPRINGS.pop)
  const leave = easeIn(span(frame, until, 8))
  const s = scale
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 361 * s,
        boxSizing: 'border-box',
        padding: `${12 * s}px ${14 * s}px`,
        borderRadius: 24 * s,
        background: 'rgba(250, 250, 252, 0.72)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 30px rgba(15, 23, 42, 0.16)',
        fontFamily: FONT,
        color: INK,
        display: 'flex',
        gap: 10 * s,
        opacity: clamp01(enter * 1.5) * (1 - leave),
        transform: `translateY(${(1 - enter) * -60 * s - leave * 30 * s}px) scale(${mix(0.92, 1, clamp01(enter))})`,
        transformOrigin: '50% 0%',
      }}
    >
      <div style={{ width: 38 * s, height: 38 * s, flexShrink: 0, borderRadius: 9 * s, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={glyph} size={22 * s} color="#ffffff" stroke={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 * s, color: MUTED, fontWeight: 500 }}>
          <span>{app}</span>
          <span>{time ?? (lang === 'en' ? 'now' : 'teraz')}</span>
        </div>
        <div style={{ fontSize: 15 * s, fontWeight: 650, marginTop: 1 * s, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 15 * s, fontWeight: 400, lineHeight: 1.3 }}>{body}</div>
      </div>
    </div>
  )
}

/** Всплывающее окно продукта (диалог, меню, лист, форма): встаёт с перелётом
    из точки origin (доли окна: [1, 0] — из правого верхнего угла, как меню у
    «⋯»), уходит быстрее. rect — место в том слое, где окно лежит (обычно в мире
    под камерой: камера наезжает на него через focus(rect)). radius — радиус
    нарисованного окна, чтобы тень легла по его краю. */
export function PopIn({
  rect,
  at,
  until = Infinity,
  origin = [0.5, 0.5],
  radius = 14,
  background,
  children,
}: {
  rect: Rect
  at: number
  until?: number
  origin?: readonly [number, number]
  radius?: number
  /** Непрозрачная подложка: у стеклянных двойников фон полупрозрачный. */
  background?: string
  children: ReactNode
}) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('popIn', at, self)
  useSoundCue('popOut', Number.isFinite(until) ? until : null, self)
  if (frame < at) return null
  const enter = spring(frame, at, SPRINGS.pop)
  const leave = easeIn(span(frame, until, 8))
  if (leave >= 1) return null
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
        background,
        boxShadow: SHADOW.lifted,
        transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`,
        transform: `scale(${mix(0.86, 1, enter) * (1 - 0.06 * leave)})`,
        opacity: clamp01(enter * 1.6) * (1 - leave),
      }}
    >
      {children}
    </div>
  )
}

/** Штамп (м-печать): падает на карточку с высоты — крупнее и повёрнутый — и
    встаёт с ударом; оттиск в тон (скруглённая рамка, иконка, текст капителью).
    rect — место оттиска в слое карточки; at — кадр начала падения (удар через
    12 кадров); impact(frame) ниже помогает сцене встряхнуть карточку. */
export function Stamp({ rect, at, text, icon = 'ban', color = '#d94f44', angle = -7 }: { rect: Rect; at: number; text: string; icon?: IconName; color?: string; angle?: number }) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  /* Удар — через 12 кадров после начала падения. */
  useSoundCue('stamp', at + 12, self)
  if (frame < at) return null
  const t = easeIn(span(frame, at, 12))
  const size = rect.height * 0.42
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.4,
        border: `${rect.height * 0.055}px solid ${color}`,
        borderRadius: rect.height * 0.2,
        color,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 850,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        opacity: Math.min(1, t * 2) * 0.92,
        transform: `scale(${mix(1.7, 1, t)}) rotate(${mix(angle * 2, angle, t)}deg)`,
        mixBlendMode: 'multiply',
      }}
    >
      <Icon name={icon} size={size * 1.15} color={color} stroke={2.6} />
      {text}
    </div>
  )
}

/** Удар штампа: 0…1 затухающая тряска после кадра at + 12 (сдвиг по x, px). */
export function impact(frame: number, at: number, amount = 7): number {
  const f = frame - at - 12
  return f < 0 ? 0 : Math.sin(f * 2.6) * amount * Math.max(0, 1 - f / 8)
}
