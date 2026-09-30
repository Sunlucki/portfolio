import { createElement, useMemo, useRef, type CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { ICONS, type IconName, type IconNode } from './icons'
import { SPRINGS, clamp01, noise, spring } from './motion'
import { useSoundCue, useSoundProbe } from './sound'
import { INK, tint, useAccent, type Point, type Rect } from './theme'

/* Прорисовка контуром (SVG): иконки, линии-связи, выделения от руки. Доля
   прорисовки p (0…1) задаёт сцена — обычно easeOut(span(frame, …)). Контур
   рисуется через pathLength = 1 и stroke-dashoffset: длину пути мерить не
   нужно, приём одинаков для path, circle, rect, line и polyline. */

const dash = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - clamp01(p), opacity: p > 0.001 ? 1 : 0 })

/** Иконка lucide (штрих, 24 × 24). p < 1 — контур прорисовывается, элементы
    иконки — по очереди с нахлёстом stagger (доля их общей длины). */
export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  stroke = 2,
  p = 1,
  stagger = 0.35,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  stroke?: number
  p?: number
  stagger?: number
  style?: CSSProperties
}) {
  const nodes: IconNode = ICONS[name]
  const n = nodes.length
  const window = 1 / (1 + (n - 1) * stagger)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}
    >
      {nodes.map(([tag, attrs], i) => {
        const own = p >= 1 ? 1 : clamp01((p - i * stagger * window) / window)
        /* Точки-заливки (глазок ключа) проявляются, когда до них дошёл контур. */
        if (attrs.fill === 'currentColor') return createElement(tag, { key: i, ...attrs, fill: color, stroke: 'none', opacity: own > 0.6 ? 1 : 0 })
        return createElement(tag, { key: i, ...attrs, ...(p >= 1 ? {} : dash(own)) })
      })}
    </svg>
  )
}

/** Путь SVG с прорисовкой. Координаты — в том слое, где лежит путь. */
export function DrawPath({ d, p = 1, color = INK, width = 2, opacity = 1 }: { d: string; p?: number; color?: string; width?: number; opacity?: number }) {
  /* Перо, пока контур прорисовывается (выделения, черты, связи). */
  const self = useRef<SVGPathElement>(null)
  useSoundProbe('pen', p, self, { eps: 0.003, rising: true, min: 0.05 })
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
      <path ref={self} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={opacity} {...dash(p)} />
    </svg>
  )
}

/* ── Связи: кривая Безье с бегущими точками ─────────────────────────────── */

export interface Bezier {
  a: Point
  b: Point
  c: Point
  d: Point
}

/** Кривая от from к to, выходит и входит горизонтально: поток данных между
    карточками. bend — доля горизонтального расстояния на касательные. */
export function flowCurve(from: Point, to: Point, bend = 0.5): Bezier {
  const dx = (to[0] - from[0]) * bend
  return { a: from, b: [from[0] + dx, from[1]], c: [to[0] - dx, to[1]], d: to }
}

export function bezierPoint({ a, b, c, d }: Bezier, t: number): [number, number] {
  const u = 1 - t
  const k0 = u * u * u
  const k1 = 3 * u * u * t
  const k2 = 3 * u * t * t
  const k3 = t * t * t
  return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]]
}

export const bezierPath = ({ a, b, c, d }: Bezier) => `M ${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`

/** Линия-связь (П11): прорисовывается от from к to (p), по ней бегут светлые
    бусины — данные идут к цели (flow — кадр сцены; бусины идут, пока flowing).
    На концах — порты: белые кружки с кромкой акцента. Стекло, не неон. */
export function Connector({
  from,
  to,
  p = 1,
  frame,
  flowing = 1,
  beads = 3,
  period = 36,
  bend = 0.5,
  color,
}: {
  from: Point
  to: Point
  p?: number
  /** Кадр сцены — для бега бусин. */
  frame: number
  /** 0…1: видимость бусин (гасите, когда данные дошли). */
  flowing?: number
  beads?: number
  /** Кадров на пробег одной бусины. */
  period?: number
  bend?: number
  color?: string
}) {
  const accent = useAccent()
  const tone = color ?? accent
  const curve = flowCurve(from, to, bend)
  const d = bezierPath(curve)
  const endIn = clamp01((p - 0.92) / 0.08)
  const self = useRef<SVGPathElement>(null)
  useSoundProbe('pen', p, self, { eps: 0.003, gain: 0.8, rising: true, min: 0.05 })
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
      <path ref={self} d={d} fill="none" stroke={tint(tone, 0.12)} strokeWidth={9} strokeLinecap="round" {...dash(p)} />
      <path d={d} fill="none" stroke={tint(tone, 0.7)} strokeWidth={2.2} strokeLinecap="round" {...dash(p)} />
      {flowing > 0.001 &&
        Array.from({ length: beads }, (_, i) => {
          const t = (((frame / period + i / beads) % 1) + 1) % 1
          if (t > p) return null
          const [x, y] = bezierPoint(curve, t)
          const edge = Math.min(1, t / 0.08, (1 - t) / 0.08)
          return <circle key={i} cx={x} cy={y} r={4.2} fill="#ffffff" stroke={tint(tone, 0.85)} strokeWidth={1.6} opacity={flowing * edge} />
        })}
      <circle cx={from[0]} cy={from[1]} r={5} fill="#ffffff" stroke={tone} strokeWidth={2} opacity={p > 0.001 ? 1 : 0} />
      <circle cx={to[0]} cy={to[1]} r={5 * endIn} fill="#ffffff" stroke={tone} strokeWidth={2} opacity={endIn} />
    </svg>
  )
}

/* ── Выделение от руки: обводка или подчёркивание ───────────────────────── */

/** Путь обводки вокруг rect: скруглённый овал (суперэллипс), который
    обнимает элемент почти как рамка, — углы элемента внутри, а линия не
    залезает на соседние строки. Чуть больше полного оборота, с лёгкой
    неровностью руки (детерминированной по seed). pad — зазор, px: число или
    [по горизонтали, по вертикали] (в плотном интерфейсе по вертикали места мало). */
export function scribblePath(rect: Rect, pad: number | readonly [number, number] = 12, seed = 1): string {
  const [padX, padY] = typeof pad === 'number' ? [pad * 1.6, pad] : pad
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  /* Суперэллипс степени 8: на диагонали он проходит на 0,917 полуоси, поэтому
     полуоси — с запасом, чтобы угол элемента остался внутри. */
  const n = 8
  const a = Math.max(rect.width / 2 / 0.917, rect.width / 2 + padX)
  const b = Math.max(rect.height / 2 / 0.917, rect.height / 2 + padY)
  const start = 2.25 + noise(seed, 7) * 0.3
  const turn = Math.PI * 2 * 1.07
  const steps = 72
  const bend = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n)
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = start + turn * t
    const wobble = 1 + 0.012 * Math.sin(angle * 3 + seed) + 0.02 * t
    const x = cx + bend(Math.cos(angle)) * a * wobble
    const y = cy + bend(Math.sin(angle)) * b * wobble
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
  }
  return d
}

/** Подчёркивание под rect: чуть изогнутое, как маркером. */
export function underlinePath(rect: Rect, drop = 8): string {
  const y = rect.y + rect.height + drop
  const x0 = rect.x - 4
  const x1 = rect.x + rect.width + 6
  return `M ${x0} ${y + 1} Q ${(x0 + x1) / 2} ${y - 5}, ${x1} ${y - 2}`
}

/** Выделение от руки вокруг элемента интерфейса (м-выделение). Живёт в том же
    слое, что и элемент (обычно под камерой): едет и масштабируется вместе с ним. */
export function Scribble({
  rect,
  p,
  kind = 'circle',
  color,
  width = 3,
  pad = 12,
  seed = 1,
}: {
  rect: Rect
  p: number
  kind?: 'circle' | 'underline'
  color?: string
  width?: number
  pad?: number | readonly [number, number]
  seed?: number
}) {
  const accent = useAccent()
  return <DrawPath d={kind === 'circle' ? scribblePath(rect, pad, seed) : underlinePath(rect)} p={p} color={color ?? accent} width={width} />
}

/* ── QR и самолётик ──────────────────────────────────────────────────────── */

/** QR-подобный узор 25 × 25: три искателя, линии синхронизации, случайные
    модули. Это не настоящий код — его нельзя прочесть телефоном. */
export function qrPattern(seed = 0x9e37): boolean[][] {
  const size = 25
  let state = seed >>> 0
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => random() < 0.47))
  const finder = (top: number, left: number) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const row = grid[top + y]
        if (!row || left + x < 0 || left + x >= size) continue
        const edge = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        row[left + x] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (edge || core)
      }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)
  for (let i = 8; i < size - 8; i++) {
    grid[6]![i] = i % 2 === 0
    grid[i]![6] = i % 2 === 0
  }
  return grid
}

/** QR на листе: модули выскакивают по спирали от центра к краю за dur кадров
    от кадра at (пружина pop), скруглённые. x, y, size — в слое листа. */
export function QrCode({ x, y, size, at, dur = 20, color = INK, seed }: { x: number; y: number; size: number; at: number; dur?: number; color?: string; seed?: number }) {
  const frame = useCurrentFrame()
  const self = useRef<SVGSVGElement>(null)
  /* Модули выскакивают россыпью — серия мягких щелчков на весь ход. */
  useSoundCue('layers', at, self, { seconds: dur / 30 + 0.3 })
  const cells = useMemo(() => {
    const grid = qrPattern(seed)
    const n = grid.length
    const list: { x: number; y: number; delay: number }[] = []
    grid.forEach((row, gy) =>
      row.forEach((on, gx) => {
        if (!on) return
        const dx = gx - (n - 1) / 2
        const dy = gy - (n - 1) / 2
        const angle = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)
        const radius = Math.hypot(dx, dy) / (n * 0.71)
        list.push({ x: gx, y: gy, delay: radius * 0.85 + angle * 0.15 })
      }),
    )
    return { list, n }
  }, [seed])
  const cell = size / cells.n
  return (
    <svg ref={self} style={{ position: 'absolute', left: x, top: y, width: size, height: size, overflow: 'visible' }} viewBox={`0 0 ${size} ${size}`}>
      {cells.list.map((item, i) => {
        const s = Math.max(0, spring(frame, at + item.delay * dur, SPRINGS.pop))
        if (s <= 0.001) return null
        const w = cell * 0.9 * s
        return <rect key={i} x={item.x * cell + (cell - w) / 2} y={item.y * cell + (cell - w) / 2} width={w} height={w} rx={w * 0.28} fill={color} />
      })}
    </svg>
  )
}

/** Бумажный самолётик (письмо ушло): носом вправо, angle — поворот в градусах,
    size — размах, px. fold 0…1 — лист складывается из плоского в самолётик. */
export function PaperPlane({ x, y, size = 120, angle = 0, fold = 1, opacity = 1, color = '#ffffff' }: { x: number; y: number; size?: number; angle?: number; fold?: number; opacity?: number; color?: string }) {
  const f = clamp01(fold)
  const self = useRef<SVGSVGElement>(null)
  /* Самолётик летит — свист по пути; складывается — шорох бумаги (переворот). */
  useSoundProbe('whoosh', [x, y], self, { eps: 0.6, travel: true, min: 30 })
  useSoundProbe('flip', f, self, { eps: 0.01, gain: 0.6, min: 0.3 })
  /* Плоский лист (fold = 0) — прямоугольник; сложенный — два крыла и киль. */
  const lerp = (a: readonly [number, number], b: readonly [number, number]) => `${a[0] + (b[0] - a[0]) * f},${a[1] + (b[1] - a[1]) * f}`
  const top = [lerp([-50, -34], [60, 0]), lerp([50, -34], [-46, -34]), lerp([50, 0], [-18, 4])].join(' ')
  const bottom = [lerp([-50, 34], [60, 0]), lerp([50, 34], [-40, 30]), lerp([50, 0], [-18, 4])].join(' ')
  const keel = [lerp([-50, 0], [60, 0]), lerp([50, 0], [-18, 4]), lerp([50, 0], [-30, 16])].join(' ')
  return (
    <svg
      ref={self}
      viewBox="-64 -48 128 96"
      style={{ position: 'absolute', left: x - size / 2, top: y - (size * 0.75) / 2, width: size, height: size * 0.75, overflow: 'visible', transform: `rotate(${angle}deg)`, opacity, filter: 'drop-shadow(0 6px 10px rgba(15, 23, 42, 0.18))' }}
    >
      <polygon points={bottom} fill="#e3e7ec" stroke="rgba(15, 23, 42, 0.18)" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points={keel} fill="#cfd5dc" stroke="rgba(15, 23, 42, 0.18)" strokeWidth={1.2} strokeLinejoin="round" />
      <polygon points={top} fill={color} stroke="rgba(15, 23, 42, 0.2)" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  )
}
