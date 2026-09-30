import { useId } from 'react'
import { useCurrentFrame } from 'remotion'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, noise, span, spring } from './motion'
import { bezierPoint, type Bezier } from './draw'
import { useSoundCue } from './sound'
import { FONT, INK, useAccent, type Point } from './theme'

/* Выноска 2D — та же, что в 3D-пролёте (packages/oner/src/callout.tsx): точка
   на элементе, плавная линия и скруглённая рамка матового стекла, внутри —
   метка «NN · Глава» и заголовок. Рамка — единственная разрешённая рамка
   вокруг нашего текста (правило владельца), бейджей нет.

   Вход (от кадра at): точка вспыхивает, линия прорисовывается со светлой
   головкой, от места встречи кромка рамки обегает периметр, за ней проступает
   стекло; метка расшифровывается знак за знаком, растёт черта, заголовок
   встаёт по словам из-под маски. Уход (от кадра until) быстрее: текст уезжает
   вверх, кромка сматывается, линия втягивается в точку.

   Всё — в координатах кадра: anchor — экранная точка элемента (из
   camera.project), рамка стоит в box. Линия приходит в верхний угол рамки со
   стороны точки, поэтому рамку ставят сбоку от точки, а не над ней. */

export interface CalloutProps {
  /** Точка на элементе, px кадра. */
  anchor: Point
  /** Верхний левый угол рамки и её ширина, px кадра. */
  box: { x: number; y: number; width: number }
  /** «05 · 01 Start». */
  tag: string
  title: string
  at: number
  until: number
  /** Кегль заголовка, px. */
  size?: number
}

const RADIUS = 20
const GLYPHS = 'ABCDEFGHIJKLMNOPRSTUWXYZ0123456789'

/** Метка расшифровывается: несошедшиеся знаки — шум, одинаковый в том же кадре. */
function decode(text: string, frame: number, start: number): string {
  if (frame < start) return ''
  const step = Math.min(0.6, 10 / Math.max(1, text.length))
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    const settled = frame >= start + 3 + i * step
    out += settled || ch === ' ' || ch === '·' ? ch : GLYPHS[Math.floor(noise(Math.floor(frame / 2), i) * GLYPHS.length)]
  }
  return out
}

export function Callout({ anchor, box, tag, title, at, until, size = 36 }: CalloutProps) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const rim = `rim-${useId().replace(/:/g, '')}`
  /* Как у выноски 3D: перо — линия от точки к рамке, блик — кромка и стекло. */
  useSoundCue('pen', at + 2, { x: (anchor[0] + box.x + box.width / 2) / 2, y: (anchor[1] + box.y) / 2 }, { seconds: 0.4 })
  useSoundCue('glint', at + 12, { x: box.x + box.width / 2, y: box.y + 70 })
  if (frame < at - 1 || frame > until + 24) return null

  const left = anchor[0] < box.x + box.width / 2
  const end: Point = [left ? box.x + RADIUS : box.x + box.width - RADIUS, box.y]
  /* Линия: из точки сначала вдоль вертикали, затем плавно в горизонталь к углу
     рамки — продолжается её верхней кромкой. */
  const curve: Bezier = {
    a: anchor,
    b: [anchor[0], anchor[1] + (end[1] - anchor[1]) * 0.62],
    c: [anchor[0] + (end[0] - anchor[0]) * 0.45, end[1]],
    d: end,
  }
  const d = `M ${curve.a[0]} ${curve.a[1]} C ${curve.b[0]} ${curve.b[1]}, ${curve.c[0]} ${curve.c[1]}, ${curve.d[0]} ${curve.d[1]}`

  const dot = spring(frame, at, SPRINGS.pop) * (1 - easeIn(span(frame, until + 12, 8)))
  const draw = easeInOut(span(frame, at + 2, 12)) * (1 - easeInOut(span(frame, until + 6, 10)))
  const drawing = draw > 0.02 && draw < 0.98 && frame < until
  const head = bezierPoint(curve, draw)
  const ping = ((((frame - (at + 6)) % 36) + 36) % 36) / 36
  const pingOn = frame >= at + 6 && frame < until
  const edge = easeInOut(span(frame, at + 12, 12)) * (1 - easeInOut(span(frame, until, 9)))
  const glass = easeOut(span(frame, at + 15, 12)) * (1 - easeIn(span(frame, until - 2, 8)))
  const tagOut = easeIn(span(frame, until - 4, 7))
  const rule = easeOut(span(frame, at + 16, 10)) * (1 - easeIn(span(frame, until - 4, 8)))
  const words = title.split(/\s+/)

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
        <path d={d} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={1.6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={draw > 0.001 ? 1 : 0} />
        {pingOn && <circle cx={anchor[0]} cy={anchor[1]} r={9 + 18 * easeOut(ping)} fill="none" stroke={INK} strokeOpacity={0.32 * (1 - ping)} strokeWidth={1.4} />}
        <circle cx={anchor[0]} cy={anchor[1]} r={7.5 * Math.max(0, dot)} fill={INK} stroke="#ffffff" strokeWidth={3} />
        {drawing && <circle cx={head[0]} cy={head[1]} r={4.5} fill="#ffffff" stroke={INK} strokeOpacity={0.6} strokeWidth={1.4} />}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.width,
          boxSizing: 'border-box',
          padding: '22px 28px 26px',
          fontFamily: FONT,
          color: INK,
          textAlign: left ? 'left' : 'right',
        }}
      >
        {/* Матовое стекло: размывает то, что за рамкой (Liquid Glass), светлая
            кромка сверху, мягкая тень. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: RADIUS,
            background: 'rgba(255, 255, 255, 0.64)',
            backdropFilter: 'blur(24px) saturate(165%)',
            WebkitBackdropFilter: 'blur(24px) saturate(165%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
            opacity: glass,
          }}
        />
        {/* Кромка — продолжение линии: rect SVG начинается сразу за скруглением
            левого верхнего угла и идёт по часовой; для точки справа — зеркально. */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible', transform: left ? undefined : 'scaleX(-1)' }}>
          <defs>
            <linearGradient id={rim} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={INK} stopOpacity={0.2} />
              <stop offset="1" stopColor={INK} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            stroke={`url(#${rim})`}
            strokeWidth={1.4}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - edge}
            opacity={edge > 0.001 ? 1 : 0}
          />
        </svg>
        <div
          style={{
            position: 'relative',
            minHeight: 20,
            color: accent,
            fontSize: 15,
            lineHeight: '20px',
            fontWeight: 650,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            opacity: 1 - tagOut,
            transform: `translateY(${-tagOut * 14}px)`,
          }}
        >
          {decode(tag, frame, at + 12)}
        </div>
        <div
          style={{
            position: 'relative',
            width: 76,
            height: 2,
            margin: left ? '12px 0 14px' : '12px 0 14px auto',
            borderRadius: 2,
            background: `linear-gradient(${left ? 90 : 270}deg, ${accent}, transparent)`,
            transformOrigin: left ? 'left center' : 'right center',
            transform: `scaleX(${rule})`,
          }}
        />
        <div style={{ position: 'relative', fontSize: size, lineHeight: 1.16, fontWeight: 750, letterSpacing: '-0.025em' }}>
          {words.map((word, i) => {
            const rise = spring(frame, at + 16 + Math.min(i, 10) * 1.4, SPRINGS.pop)
            const leave = easeIn(span(frame, until - 6 + i * 0.6, 7))
            return (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: '0.08em', marginRight: '0.26em' }}>
                <span style={{ display: 'inline-block', transform: `translateY(${(1 - rise) * 105 - leave * 60}%)`, opacity: clamp01(rise * 1.5) * (1 - leave) }}>{word}</span>
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}
