import { CHROME } from '../kit/surfaces'
import type { Rect } from '../kit/theme'
import { SCREEN } from './twin'

/* Раскладка ролика в координатах мира (кадр 1920 × 1080 при zoom = 1). Окно
   браузера — одно на весь ролик: экраны движка сменяют друг друга в нём, как
   страницы. Экран продукта — 1024 × 659 CSS px (раскладка художника),
   в окне он растянут в S = 1,406 раза: текст 14 px продукта — 19,7 px кадра,
   на наезде ×1,6 — 31 px. */

export const S = 1440 / SCREEN.w

/** Страница в окне (без строки браузера). */
export const PAGE: Rect = { x: 240, y: 100, width: 1440, height: SCREEN.h * S }

/** Верхний левый угол окна (со строкой браузера). */
export const WINDOW = { x: PAGE.x, y: PAGE.y - CHROME }

/** Прямоугольник экрана продукта (CSS px) → мир. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const world = (r: Box, page: Rect = PAGE, scale = S): Rect => ({ x: page.x + r.x * scale, y: page.y + r.y * scale, width: r.w * scale, height: r.h * scale })

/** Точка экрана продукта → мир. */
export const at = (x: number, y: number, page: Rect = PAGE, scale = S): [number, number] => [page.x + x * scale, page.y + y * scale]

/** Rect мира → центр. */
export const mid = (r: Rect): [number, number] => [r.x + r.width / 2, r.y + r.height / 2]

/** Точка кадра для звука (kit/sound): [x, y] → { x, y } — обычно от
    camera.project(), чтобы звук шёл оттуда, где предмет на экране. */
export const xy = ([x, y]: readonly [number, number]) => ({ x, y })

/** Объединение прямоугольников мира. */
export function union(...rects: Rect[]): Rect {
  const x0 = Math.min(...rects.map((r) => r.x))
  const y0 = Math.min(...rects.map((r) => r.y))
  const x1 = Math.max(...rects.map((r) => r.x + r.width))
  const y1 = Math.max(...rects.map((r) => r.y + r.height))
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/** Прямоугольник с полями pad (мир). */
export const grow = (r: Rect, px: number, py = px): Rect => ({ x: r.x - px, y: r.y - py, width: r.width + px * 2, height: r.height + py * 2 })
