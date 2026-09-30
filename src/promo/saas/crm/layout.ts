import { CHROME } from '../kit/surfaces'
import type { Rect } from '../kit/theme'

/* Общая раскладка пилота CRM в координатах мира (кадр 1920 × 1080 при
   zoom = 1). Окно браузера одно и то же у входа и у пульта: вход сменяется
   пультом внутри того же окна, как в продукте. */

/** Страница в окне (без строки браузера), 16:10 — как экран входа 1600 × 1000. */
export const PAGE: Rect = { x: 240, y: 66 + CHROME, width: 1440, height: 900 }

/** Верхний левый угол окна (со строкой браузера). */
export const WINDOW = { x: PAGE.x, y: PAGE.y - CHROME }

export const HOST = 'crm.simbia.eu'

/** Прямоугольник в px холста → в px страницы при масштабе scale. */
export function scaled(rect: Rect, scale: number, dx = 0, dy = 0): Rect {
  return { x: dx + rect.x * scale, y: dy + rect.y * scale, width: rect.width * scale, height: rect.height * scale }
}

/** Прямоугольник страницы → мир. */
export const onPage = (rect: Rect): Rect => ({ ...rect, x: PAGE.x + rect.x, y: PAGE.y + rect.y })
