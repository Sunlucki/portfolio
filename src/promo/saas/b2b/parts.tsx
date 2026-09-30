import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { SPRINGS, clamp01, easeIn, easeOut, mix, span, spring } from '../kit/motion'
import { useSoundProbe } from '../kit/sound'
import { FONT, INK, MUTED, SHADOW, tint, useAccent } from '../kit/theme'
import { Glyph, L } from './twin'
import type { GlyphName } from './glyphs'

/* Общие детали сцен: бусина данных, наша карточка (стекло), тост продукта
   (sonner, светлый), всплывающий лист. Всё — в координатах мира (под камерой). */

/** Бусина данных, которая летит по линии-связи: белая, с кромкой акцента и
    мягким кольцом. Без свечения. */
export function Bead({ x, y, color, size = 18, opacity = 1 }: { x: number; y: number; color?: string; size?: number; opacity?: number }) {
  const accent = useAccent()
  const tone = color ?? accent
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        background: '#ffffff',
        border: `${size / 6}px solid ${tone}`,
        boxSizing: 'border-box',
        boxShadow: `0 0 0 ${size / 3}px ${tint(tone, 0.14)}, 0 2px 6px rgba(15, 23, 42, 0.2)`,
        opacity,
      }}
    />
  )
}

/** Наша карточка (00-SYSTEM §6, «карточка функции»): светлое стекло, скругление
    26, двойная тень. Не экран продукта — поэтому в стиле ролика. */
export function GlassCard({ rect, children, style, radius = 26 }: { rect: { x: number; y: number; width: number; height: number }; children?: ReactNode; style?: CSSProperties; radius?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: 'border-box',
        borderRadius: radius,
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.card}`,
        fontFamily: FONT,
        color: INK,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Плитка значка карточки: мягкий тон акцента, значок рисуется контуром. */
export function IconTile({ name, p, size = 58, color, tone }: { name: GlyphName; p: number; size?: number; color?: string; tone?: string }) {
  const accent = useAccent()
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.31, background: tint(tone ?? color ?? accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Glyph n={name} s={size * 0.55} c={color ?? accent} sw={1.8} p={p} />
    </div>
  )
}

/** Тост продукта (sonner), светлый: белая плашка, кромка, значок и текст.
    scale — во сколько раз крупнее продукта. Встаёт снизу с перелётом. */
export function ProductToast({ x, y, at, until = Infinity, text, icon = 'circleCheck', tone = L.emerald, scale = 1, width = 360 }: { x: number; y: number; at: number; until?: number; text: string; icon?: GlyphName; tone?: string; scale?: number; width?: number }) {
  const frame = useCurrentFrame()
  if (frame < at) return null
  const enter = spring(frame, at, SPRINGS.pop)
  const leave = easeIn(span(frame, until, 8))
  const s = scale
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width * s,
        height: 56 * s,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 12 * s,
        padding: `0 ${18 * s}px`,
        borderRadius: 14 * s,
        background: '#ffffff',
        border: `${s}px solid ${L.border}`,
        boxShadow: SHADOW.lifted,
        fontFamily: FONT,
        opacity: clamp01(enter * 1.5) * (1 - leave),
        transform: `translateY(${(1 - enter) * 30 * s + leave * 14 * s}px) scale(${mix(0.94, 1, clamp01(enter))})`,
        transformOrigin: '50% 100%',
      }}
    >
      <Glyph n={icon} s={20 * s} c={tone} p={easeOut(span(frame, at + 3, 12))} />
      <span style={{ fontSize: 14 * s, fontWeight: 500, color: L.fg, whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

/** Текст сцены в две строки: метка и крупная строка (для наших карточек). */
export function CardText({ label, title, hint, size = 30 }: { label?: string; title: string; hint?: string; size?: number }) {
  const accent = useAccent()
  return (
    <div style={{ minWidth: 0 }}>
      {label && <div style={{ fontSize: 15, fontWeight: 700, color: accent, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>{label}</div>}
      <div style={{ marginTop: label ? 6 : 0, fontSize: size, fontWeight: 750, color: INK, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>{title}</div>
      {hint && <div style={{ marginTop: 2, fontSize: 17, fontWeight: 500, color: MUTED, whiteSpace: 'nowrap' }}>{hint}</div>}
    </div>
  )
}

/** Затемнение страницы под всплывающим окном (как overlay диалога продукта). */
export const Scrim = ({ o, color = 'rgba(7, 6, 7, 0.28)' }: { o: number; color?: string }) => (o > 0.001 ? <div style={{ position: 'absolute', inset: 0, background: color, opacity: o }} /> : null)

/** Смена страниц колодой (П8): старая отходит назад — меньше, выше, с
    наклоном и тенью; новая поднимается снизу поверх неё, сразу плотная.
    t — доля смены 0…1. Обе — в координатах мира, как окно. */
export function DeckSwap({ t, from, to }: { t: number; from: ReactNode; to: ReactNode }) {
  const k = clamp01(t)
  /* Звук: смена страниц колодой — вздох воздуха, как у Deck набора. */
  useSoundProbe('air', k, { x: 960, y: 430 }, { eps: 0.004 })
  if (k <= 0) return <>{from}</>
  if (k >= 1) return <>{to}</>
  const out = clamp01(k * 1.3)
  const into = clamp01((k - 0.12) / 0.88)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `perspective(2600px) translateY(${-60 * out}px) rotateX(${10 * out}deg) scale(${mix(1, 0.82, out)})`, transformOrigin: '50% 30%', opacity: 1 - out * 0.55, filter: `brightness(${1 - 0.08 * out})` }}>{from}</div>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - into) * 1100}px) scale(${mix(0.94, 1, into)})`, transformOrigin: '50% 0%', opacity: clamp01(into * 6) }}>{to}</div>
    </>
  )
}
