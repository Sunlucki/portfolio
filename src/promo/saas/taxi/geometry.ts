import { textWidth } from '../kit/painted'
import { W } from '../kit/theme'

/* Раскладка экранов, которую художники считают сами (перенос строк, высота
   шапки шага), — чтобы касания, выделения и выноски попадали в элементы.
   Перенос — тот же жадный алгоритм, что wrap() в motion/taxi.ts, шрифт тот же
   (Inter), поэтому строки совпадают с нарисованными. */

/** Сколько строк займёт текст при переносе по словам в ширину max. */
export function wrapLines(value: string, max: number, size: number, weight: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && textWidth(next, size, weight) > max) {
      out.push(line)
      line = word
    } else line = next
  }
  if (line) out.push(line)
  return out
}

/** Высота шапки шага калькулятора (calcHeader в motion/taxi.ts). */
export function calcHead(title: string, subtitle: string): number {
  const lines = wrapLines(title, 253, 18, 600).length
  const sub = wrapLines(subtitle, 253, 14, 400).length
  return Math.max(48, lines * 28 + sub * 20) + 24
}

/** Выполнить художника на черновом холсте и взять то, что он вернул (например,
    верх строки на экране). Звать внутри <FontGate>: переносу нужен шрифт. */
export function measureWith<T>(paint: (ctx: CanvasRenderingContext2D) => T): T {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Нет 2D-контекста для замера')
  return paint(ctx)
}

/** Рамка выноски в кадре: не заходит за край (поля 40 px). */
export function inFrame(x: number, width: number, margin = 40): number {
  return Math.max(margin, Math.min(x, W - width - margin))
}
