import { useRef } from 'react'
import { useCurrentFrame } from 'remotion'
import { SPRINGS, clamp01, span, spring } from './motion'
import { useSoundCue } from './sound'
import { useAccent, type Point, type Rect } from './theme'

/* Графики рисуем сами (как ui/charts.tsx в CRM): полоса растёт пружиной,
   линия прорисовывается слева направо, точки выскакивают, когда линия до них
   дошла (м-график). */

/** Полоса в дорожке rect: растёт до доли value от кадра at (pop, с перелётом).
    horizontal — слева направо, иначе снизу вверх. */
export function Bar({ rect, value, at, color, horizontal = true, radius }: { rect: Rect; value: number; at: number; color?: string; horizontal?: boolean; radius?: number }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('tick', at, self, { gain: 0.8 })
  const grow = Math.max(0, spring(frame, at, SPRINGS.pop)) * value
  const r = radius ?? Math.min(rect.width, rect.height) / 2
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: rect.x,
        top: horizontal ? rect.y : rect.y + rect.height * (1 - grow),
        width: horizontal ? rect.width * grow : rect.width,
        height: horizontal ? rect.height : rect.height * grow,
        borderRadius: r,
        background: color ?? accent,
        opacity: frame >= at ? 1 : 0,
      }}
    />
  )
}

/** Линия графика по точкам (в px слоя): прорисовка от кадра at за dur кадров,
    под линией — мягкая заливка, точки выскакивают по очереди. */
export function LineDraw({ points, at, dur = 30, color, width = 3, dots = true, fill = true }: { points: Point[]; at: number; dur?: number; color?: string; width?: number; dots?: boolean; fill?: boolean }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const tone = color ?? accent
  const p = span(frame, at, dur)
  const line = useRef<SVGPathElement>(null)
  useSoundCue('pen', at, line, { seconds: dur / 30 })
  if (points.length < 2) return null
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const bottom = Math.max(...points.map(([, y]) => y)) + 40
  const first = points[0]!
  const last = points[points.length - 1]!
  const reach = first[0] + (last[0] - first[0]) * p
  const id = `fill-${Math.round(first[0])}-${Math.round(first[1])}`
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={tone} stopOpacity={0.16} />
              <stop offset="1" stopColor={tone} stopOpacity={0} />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <rect x={first[0] - 10} y={-10000} width={Math.max(0, reach - first[0] + 10)} height={20000} />
            </clipPath>
          </defs>
          <path d={`${d} L ${last[0]} ${bottom} L ${first[0]} ${bottom} Z`} fill={`url(#${id})`} clipPath={`url(#${id}-clip)`} />
        </>
      )}
      <path ref={line} d={d} fill="none" stroke={tone} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={p > 0 ? 1 : 0} />
      {dots &&
        points.map(([x, y], i) => {
          const pass = at + dur * clamp01((x - first[0]) / Math.max(1, last[0] - first[0]))
          const pop = Math.max(0, spring(frame, pass, SPRINGS.pop))
          return <circle key={i} cx={x} cy={y} r={width * 1.9 * pop} fill="#ffffff" stroke={tone} strokeWidth={width * 0.8} opacity={pop > 0 ? 1 : 0} />
        })}
    </svg>
  )
}
