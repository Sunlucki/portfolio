/* Время и движение v4 «SaaS 2D» (storyboard/00-SYSTEM.md, §0 и §4). Всё —
   чистые функции номера кадра: любой кадр воспроизводится точно, состояния
   между кадрами нет. */

export const FPS = 30
/** Доля — 15 кадров (120 ударов в минуту), такт — 4 доли. Склейки — на долях. */
export const BEAT = 15
export const BAR = 60
export const beats = (n: number) => n * BEAT

export const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Доля пройденного отрезка [start, start + length] в кадре frame, 0…1. */
export const span = (frame: number, start: number, length: number) => clamp01((frame - start) / Math.max(1e-6, length))

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeIn = (t: number) => Math.pow(clamp01(t), 3)
export const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
/** «glide» без пружины: разгон и торможение с нулевыми скоростью и ускорением
    на краях (smootherstep). Камера, наезды, перелёты окон. */
export const glide = (t: number) => {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

export interface SpringPreset {
  damping: number
  stiffness: number
  mass: number
}

/** Пружины системы (00-SYSTEM §4), подобраны под перелёт из брифа v4. */
export const SPRINGS = {
  /** Перелёт ~10%, встаёт за ~15 кадров: карточки, слова, значки, точки. */
  pop: { damping: 14, stiffness: 180, mass: 0.8 },
  /** Перелёт ~3%, ~9 кадров: смена статуса, галочка, переключатель. */
  snap: { damping: 26, stiffness: 300, mass: 1 },
  /** Без перелёта, ~22 кадра: панели, выезды, мягкие сдвиги. */
  glide: { damping: 26, stiffness: 120, mass: 1 },
  /** Тяжёлое тело, перелёт ~2%, ~19 кадров: окна в 3D, наклоны, стопка слоёв. */
  heavy: { damping: 18, stiffness: 90, mass: 1.4 },
} satisfies Record<string, SpringPreset>

/** Пружина из покоя: 0 до кадра start, дальше идёт к 1 (с перелётом у pop).
    Аналитическое решение той же системы, что spring() в Remotion, поэтому
    работает и с дробными кадрами, и без накопления шагов. */
export function spring(frame: number, start: number, preset: SpringPreset = SPRINGS.pop): number {
  const t = (frame - start) / FPS
  if (t <= 0) return 0
  const { damping, stiffness, mass } = preset
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (zeta < 1) {
    const w1 = w0 * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(w1 * t) + ((zeta * w0) / w1) * Math.sin(w1 * t))
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  const root = Math.sqrt(zeta * zeta - 1)
  const r1 = -w0 * (zeta - root)
  const r2 = -w0 * (zeta + root)
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}

/** Вход пружиной и уход easeIn: 0 → 1 от enter, 1 → 0 за out кадров от leave.
    Выход всегда быстрее входа (00-SYSTEM §3). */
export function presence(frame: number, enter: number, leave = Infinity, out = 8, preset: SpringPreset = SPRINGS.pop): number {
  return spring(frame, enter, preset) * (1 - easeIn(span(frame, leave, out)))
}

/** Сколько кадров держать текст на экране, чтобы его прочли (владелец 28.09):
    около 1 с на 8 слов и не меньше 1,2 с. Для всплывающих окон и выносок. */
export function readFrames(text: string, minSeconds = 1.2): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.ceil(Math.max(minSeconds, words / 8) * FPS)
}

/** Детерминированный шум 0…1: одинаковый для тех же чисел в любом кадре. */
export function noise(a: number, b = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
