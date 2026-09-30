import { createElement, type CSSProperties, type ReactNode } from 'react'
import { clamp01 } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { FONT } from '../kit/theme'
import { GLYPHS, type GlyphName } from './glyphs'

/* Двойники экранов Портала B2B для v4 «SaaS 2D» — SVG в CSS-пикселях продукта.

   Почему свои, а не художники packages/oner/src/motion/b2b.ts: те рисуют только
   тёмную тему движка (фон #000), а хука B2B_LOOK.prepare('light'), как у CRM,
   HR и TAXI, пока нет. Ролик светлый (владелец 28.09), поэтому экраны собраны
   здесь заново — по той же раскладке, надписям и данным, что у художника
   (его координаты перенесены как есть), но в светлой палитре самого движка:
   Limestone, Pumice, Obsidian и Ember из src/index.css (.landing-theme,
   .site-shell). SVG, а не холст: на наездах камеры текст остаётся резким.

   Нейтральность — как у художника: знак «HURTOWNIA DEMO», товары — упаковка,
   данные фирмы замаскированы, NIP учебный 1234563218. */

/** Светлые токены движка (src/index.css). Limestone — фон страницы, белые
    карточки с тонкой кромкой Obsidian 10% (.site-shell .card-modern), Ember —
    акцент. Тени и неон убраны: Liquid Glass без свечения. */
export const L = {
  /** Limestone, 48 24% 96%. */
  page: '#f7f6f2',
  /** Pumice, 60 5% 88%. */
  pumice: '#e2e2df',
  card: '#ffffff',
  /** .site-shell --muted, 48 12% 92%. */
  muted: '#edece8',
  /** --muted-foreground, 300 4% 38%. */
  mutedFg: '#655d65',
  /** Obsidian, 300 8% 3%. */
  fg: '#070607',
  ink: '#070607',
  border: 'rgba(7, 6, 7, 0.12)',
  borderSoft: 'rgba(7, 6, 7, 0.08)',
  /** Ember, 19 100% 49%. */
  primary: '#fa4f00',
  brand: '#fc5000',
  primarySoft: 'rgba(250, 79, 0, 0.1)',
  primaryLine: 'rgba(250, 79, 0, 0.4)',
  destructive: '#d34545',
  /** Изумруд для светлой карточки (priceVisuals: «a deep emerald reads well on the light card»). */
  emerald: '#059669',
  emeraldText: '#047857',
  emeraldSoft: 'rgba(16, 185, 129, 0.1)',
  emeraldLine: 'rgba(16, 185, 129, 0.4)',
  blue: '#2563eb',
  blueSoft: 'rgba(37, 99, 235, 0.08)',
  blueLine: 'rgba(37, 99, 235, 0.4)',
  amber: '#d97706',
  mail: '#16a34a',
  /** Боковое меню админки: Pumice поверх Limestone. */
  sidebar: '#efeee9',
}

/** Размер экрана продукта, CSS px (как PANEL у художника). */
export const SCREEN = { w: 1024, h: 659 }

/* ── Текст ───────────────────────────────────────────────────────────────── */

/** Ширина надписи в CSS px продукта; tracking — px, как у художника. */
export const tw = (text: string, size: number, weight = 400, tracking = 0, upper = false) =>
  textWidth(upper ? text.toUpperCase() : text, size, weight, size ? tracking / size : 0)

export interface TextProps {
  x: number
  /** Базовая линия (как у холста художника). */
  y: number
  s?: number
  w?: number
  c?: string
  a?: 'start' | 'middle' | 'end'
  /** Разрядка, px. */
  ls?: number
  up?: boolean
  o?: number
  children: string | number
  style?: CSSProperties
}

/** Надпись: x, y — начало базовой линии, как fillText у художника.
    geometricPrecision обязателен: без него Chrome подбирает SVG-тексту шрифт
    под экранный масштаб в момент раскладки и в долгом рендере (одна вкладка,
    камера и слои меняют масштаб) рисует надписи по устаревшему масштабу —
    крупнее и не на месте; кадры в still при этом верные. */
export function T({ x, y, s = 14, w = 400, c = L.fg, a = 'start', ls = 0, up = false, o, children, style }: TextProps) {
  const value = up ? String(children).toUpperCase() : String(children)
  return (
    <text x={x} y={y} fontFamily={FONT} fontSize={s} fontWeight={w} fill={c} textAnchor={a} letterSpacing={ls || undefined} opacity={o} style={{ fontKerning: 'normal', textRendering: 'geometricPrecision', ...style }}>
      {value}
    </text>
  )
}

/** Перенос по словам по ширине width (как wrap у художника). */
export function wrap(text: string, size: number, weight: number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && tw(next, size, weight) > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Абзац с переносом; первая строка — на y. */
export function P({ x, y, s = 14, w = 400, c = L.mutedFg, width, lh, a = 'start', children }: { x: number; y: number; s?: number; w?: number; c?: string; width: number; lh: number; a?: 'start' | 'middle' | 'end'; children: string }) {
  return (
    <>
      {wrap(children, s, w, width).map((line, i) => (
        <T key={i} x={x} y={y + i * lh} s={s} w={w} c={c} a={a}>
          {line}
        </T>
      ))}
    </>
  )
}

/* ── Фигуры ──────────────────────────────────────────────────────────────── */

/** Скруглённый прямоугольник: заливка и (или) кромка внутрь, как fillBox и
    strokeBox у художника. */
export function R({ x, y, w, h, r = 0, fill, stroke, sw = 1, dash, o }: { x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string; sw?: number; dash?: string; o?: number }) {
  const inset = stroke ? sw / 2 : 0
  const radius = Math.max(0, Math.min(r, w / 2, h / 2) - inset)
  return (
    <rect
      x={x + inset}
      y={y + inset}
      width={Math.max(0, w - inset * 2)}
      height={Math.max(0, h - inset * 2)}
      rx={radius}
      ry={radius}
      fill={fill ?? 'none'}
      stroke={stroke}
      strokeWidth={stroke ? sw : undefined}
      strokeDasharray={dash}
      opacity={o}
    />
  )
}

export function Dot({ cx, cy, r, fill, stroke, sw = 1, o }: { cx: number; cy: number; r: number; fill?: string; stroke?: string; sw?: number; o?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill ?? 'none'} stroke={stroke} strokeWidth={stroke ? sw : undefined} opacity={o} />
}

/** Горизонтальная линия-разделитель. */
export const Rule = ({ x, y, w, c = L.border, h = 1 }: { x: number; y: number; w: number; c?: string; h?: number }) => <rect x={x} y={y} width={w} height={h} fill={c} />

/* ── Значки lucide с прорисовкой ─────────────────────────────────────────── */

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - clamp01(p), opacity: p > 0.001 ? 1 : 0 })

/** Значок lucide: (x, y) — левый верхний угол квадрата s (как icon у художника).
    p < 1 — контур прорисовывается, элементы по очереди. */
export function G({ n, x, y, s = 16, c = L.fg, sw = 2, p = 1, stagger = 0.35 }: { n: GlyphName; x: number; y: number; s?: number; c?: string; sw?: number; p?: number; stagger?: number }) {
  const nodes = GLYPHS[n]
  const count = nodes.length
  const window = 1 / (1 + (count - 1) * stagger)
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 24})`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {nodes.map(([tag, attrs], i) => {
        const own = p >= 1 ? 1 : clamp01((p - i * stagger * window) / window)
        return createElement(tag, { key: i, ...attrs, ...(p >= 1 ? {} : dash(own)) })
      })}
    </g>
  )
}

/** Значок lucide в DOM (для накладок вне SVG-экрана). */
export function Glyph({ n, s = 24, c = L.fg, sw = 2, p = 1, style }: { n: GlyphName; s?: number; c?: string; sw?: number; p?: number; style?: CSSProperties }) {
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}>
      <G n={n} x={0} y={0} s={s} c={c} sw={sw} p={p} />
    </svg>
  )
}

/* ── Кнопки, поля, чипы (у продукта все кнопки rounded-full) ─────────────── */

export type Variant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'ink' | 'ghostWhite' | 'white' | 'danger' | 'mail'

export function variantColors(variant: Variant): { bg?: string; fg: string; border?: string } {
  switch (variant) {
    case 'primary':
      return { bg: L.primary, fg: '#ffffff' }
    case 'outline':
      return { bg: L.card, fg: L.fg, border: L.border }
    case 'secondary':
      return { bg: L.muted, fg: L.fg }
    case 'ghost':
      return { fg: L.mutedFg }
    case 'ink':
      return { bg: L.ink, fg: '#ffffff' }
    case 'ghostWhite':
      return { fg: '#ffffff', border: 'rgba(255,255,255,0.55)' }
    case 'white':
      return { bg: '#ffffff', fg: L.primary }
    case 'danger':
      return { bg: L.card, fg: L.destructive, border: L.border }
    case 'mail':
      return { bg: L.mail, fg: '#ffffff' }
  }
}

export interface ButtonOptions {
  icon?: GlyphName
  iconAfter?: GlyphName
  size?: number
  weight?: number
  upper?: boolean
  tracking?: number
  width?: number
  px?: number
  radius?: number
}

/** Ширина кнопки, как её считает художник. */
export function buttonWidth(label: string, o: ButtonOptions = {}): number {
  const size = o.size ?? 14
  const iconSize = Math.round(size * 1.15)
  const text = label ? tw(label, size, o.weight ?? 500, o.tracking ?? 0, o.upper) : 0
  const content = text + (o.icon ? iconSize + (label ? 8 : 0) : 0) + (o.iconAfter ? iconSize + 8 : 0)
  return o.width ?? content + (o.px ?? 16) * 2
}

export function Btn({ label, x, y, h, v, o = {}, fg, bg, iconP = 1 }: { label: string; x: number; y: number; h: number; v: Variant; o?: ButtonOptions; fg?: string; bg?: string; iconP?: number }) {
  const size = o.size ?? 14
  const weight = o.weight ?? 500
  const iconSize = Math.round(size * 1.15)
  const text = label ? tw(label, size, weight, o.tracking ?? 0, o.upper) : 0
  const content = text + (o.icon ? iconSize + (label ? 8 : 0) : 0) + (o.iconAfter ? iconSize + 8 : 0)
  const width = o.width ?? content + (o.px ?? 16) * 2
  const colors = variantColors(v)
  const ink = fg ?? colors.fg
  const radius = o.radius ?? h / 2
  let cursor = x + (width - content) / 2
  const iconX = cursor
  if (o.icon) cursor += iconSize + (label ? 8 : 0)
  return (
    <g>
      {(bg ?? colors.bg) && <R x={x} y={y} w={width} h={h} r={radius} fill={bg ?? colors.bg} />}
      {colors.border && <R x={x} y={y} w={width} h={h} r={radius} stroke={colors.border} />}
      {o.icon && <G n={o.icon} x={iconX} y={y + (h - iconSize) / 2} s={iconSize} c={ink} p={iconP} />}
      {label && (
        <T x={cursor} y={y + h / 2 + size * 0.36} s={size} w={weight} c={ink} ls={o.tracking} up={o.upper}>
          {label}
        </T>
      )}
      {o.iconAfter && <G n={o.iconAfter} x={cursor + text + 8} y={y + (h - iconSize) / 2} s={iconSize} c={ink} />}
    </g>
  )
}

/** Поле ввода (скругление 14 — rounded-2xl продукта). */
export function Inp({ x, y, w, h, value, placeholder = '', r = 14, s = 14, c = L.fg, bg = L.card, border = L.border, px = 12, weight = 400, caret }: { x: number; y: number; w: number; h: number; value?: string | null; placeholder?: string; r?: number; s?: number; c?: string; bg?: string; border?: string; px?: number; weight?: number; caret?: string }) {
  const width = value ? tw(value, s, weight) : 0
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={r} fill={bg} />
      <R x={x} y={y} w={w} h={h} r={r} stroke={border} />
      {value ? (
        <T x={x + px} y={y + h / 2 + s * 0.36} s={s} w={weight} c={c}>
          {value}
        </T>
      ) : placeholder ? (
        <T x={x + px} y={y + h / 2 + s * 0.36} s={s} c={L.mutedFg}>
          {placeholder}
        </T>
      ) : null}
      {caret && <rect x={x + px + width + 2} y={y + h / 2 - s * 0.6} width={1.6} height={s * 1.2} rx={0.8} fill={caret} />}
    </g>
  )
}

export interface TagOptions {
  size?: number
  weight?: number
  color: string
  bg?: string
  border?: string
  px?: number
  h?: number
  upper?: boolean
  tracking?: number
  icon?: GlyphName
}

export function tagWidth(label: string, o: TagOptions): number {
  const size = o.size ?? 12
  const iconSize = o.icon ? size : 0
  return tw(label, size, o.weight ?? 600, o.tracking ?? 0, o.upper) + (o.px ?? 8) * 2 + (iconSize ? iconSize + 4 : 0)
}

/** Чип интерфейса (статус, возраст заявки) — как в продукте. */
export function Tag({ label, x, y, o }: { label: string; x: number; y: number; o: TagOptions }) {
  const size = o.size ?? 12
  const h = o.h ?? size + 8
  const px = o.px ?? 8
  const iconSize = o.icon ? size : 0
  const width = tagWidth(label, o)
  return (
    <g>
      {o.bg && <R x={x} y={y} w={width} h={h} r={h / 2} fill={o.bg} />}
      {o.border && <R x={x} y={y} w={width} h={h} r={h / 2} stroke={o.border} />}
      {o.icon && <G n={o.icon} x={x + px} y={y + (h - iconSize) / 2} s={iconSize} c={o.color} sw={2.2} />}
      <T x={x + px + (iconSize ? iconSize + 4 : 0)} y={y + h / 2 + size * 0.36} s={size} w={o.weight ?? 600} c={o.color} up={o.upper} ls={o.tracking}>
        {label}
      </T>
    </g>
  )
}

/** Замаскированные данные фирмы: скруглённая плашка вместо текста. */
export const Mask = ({ x, y, w, h, c = 'rgba(7, 6, 7, 0.12)' }: { x: number; y: number; w: number; h: number; c?: string }) => <R x={x} y={y} w={w} h={h} r={h / 2} fill={c} />

/** Знак «HURTOWNIA DEMO»: широкие прописные (font-brand продукта). */
export const BRAND = ['HURTOWNIA', 'DEMO'] as const

export function brandWidth(size: number): number {
  const tracking = size * 0.14
  return tw(`${BRAND[0]} `, size, 900, tracking) + tw(BRAND[1], size, 900, tracking)
}

export function Brand({ x, y, s, first, second, a = 'start' }: { x: number; y: number; s: number; first: string; second: string; a?: 'start' | 'middle' | 'end' }) {
  const tracking = s * 0.14
  const one = tw(`${BRAND[0]} `, s, 900, tracking)
  const two = tw(BRAND[1], s, 900, tracking)
  const start = a === 'start' ? x : a === 'middle' ? x - (one + two) / 2 : x - one - two
  return (
    <g>
      <T x={start} y={y} s={s} w={900} c={first} ls={tracking}>{`${BRAND[0]} `}</T>
      <T x={start + one} y={y} s={s} w={900} c={second} ls={tracking}>
        {BRAND[1]}
      </T>
    </g>
  )
}

/* ── Холст экрана в DOM ──────────────────────────────────────────────────── */

/** SVG-лист w × h (CSS px продукта), показанный в масштабе scale. Лист — div:
    его можно поднимать, переворачивать и наклонять в CSS 3D. */
export function Sheet({ w, h, scale = 1, children, style, clip = false }: { w: number; h: number; scale?: number; children?: ReactNode; style?: CSSProperties; clip?: boolean }) {
  return (
    <div style={{ position: 'absolute', width: w * scale, height: h * scale, ...style }}>
      <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: 0, display: 'block', overflow: clip ? 'hidden' : 'visible' }}>
        {children}
      </svg>
    </div>
  )
}
