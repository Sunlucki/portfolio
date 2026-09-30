import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { glide, mix, span } from './motion'
import { useSoundView } from './sound'
import { H, W, type Rect } from './theme'

/* 2D-камера сцены: наезды на место действия («поближе к каждому дашборду»,
   владелец 28.09) без пролёта по миру. Сцена раскладывается в «мире» —
   координатах кадра 1920 × 1080 при zoom = 1, камера показывает его кусок.

   Вид — точка мира в центре кадра и масштаб. Между ключами масштаб идёт по
   логарифму (наезд ×2 и ×4 ощущаются одинаково ровными), а точка, к которой
   едем, плывёт по экрану к центру по прямой: наезд целится в цель и не
   раскачивается. На отъезде так же держится точка, от которой уходим. */

export interface View {
  /** Точка мира в центре кадра. */
  x: number
  y: number
  zoom: number
}

/** Ключ камеры: с кадра at за dur кадров камера едет к виду (x, y, zoom) —
    или к предмету, за которым следует (follow: вид в каждом кадре, см. follow()). */
export type CameraKey = {
  /** Кадр, с которого камера едет к этому виду. */
  at: number
  /** Длина переезда, кадров (по умолчанию 26). */
  dur?: number
  ease?: (t: number) => number
} & (View | { follow: (frame: number) => View })

/** Вид ключа в кадре: у следящего ключа он движется вместе с предметом. */
const targetOf = (key: CameraKey, frame: number): View => ('follow' in key ? key.follow(frame) : key)

export interface CameraState extends View {
  /** CSS transform слоя мира (transform-origin: 0 0). */
  transform: string
  /** Точка мира → точка кадра: куда ставить выноски, курсор и тосты. */
  project: (x: number, y: number) => [number, number]
}

const CX = W / 2
const CY = H / 2

/** Состояние камеры в кадре frame. Первый ключ — вид с начала сцены. */
export function viewAt(keys: CameraKey[], frame: number): CameraState {
  const view = solve(keys, frame, keys.length - 1)
  const tx = view.sx - view.fx * view.zoom
  const ty = view.sy - view.fy * view.zoom
  return {
    x: view.fx + (CX - view.sx) / view.zoom,
    y: view.fy + (CY - view.sy) / view.zoom,
    zoom: view.zoom,
    transform: `translate(${tx}px, ${ty}px) scale(${view.zoom})`,
    project: (x, y) => [tx + x * view.zoom, ty + y * view.zoom],
  }
}

/** Вид как «точка мира (fx, fy) стоит в точке кадра (sx, sy) при zoom». */
interface Pinned {
  fx: number
  fy: number
  sx: number
  sy: number
  zoom: number
}

function solve(keys: CameraKey[], frame: number, last: number): Pinned {
  const first: CameraKey = keys[0] ?? { at: 0, ...HOME }
  let index = 0
  for (let i = 1; i <= last; i++) if ((keys[i]?.at ?? Infinity) <= frame) index = i
  const key = keys[index] ?? first
  const target = targetOf(key, frame)
  if (index === 0) return { fx: target.x, fy: target.y, sx: CX, sy: CY, zoom: target.zoom }
  /* Откуда едем — из того, где камера была в момент старта ключа: ключи могут
     начинаться до конца предыдущего переезда, и скачка не будет. */
  const from = solve(keys, key.at, index - 1)
  const fromView = { x: from.fx + (CX - from.sx) / from.zoom, y: from.fy + (CY - from.sy) / from.zoom, zoom: from.zoom }
  const t = (key.ease ?? glide)(span(frame, key.at, key.dur ?? 26))
  const zoom = fromView.zoom * Math.pow(target.zoom / fromView.zoom, t)
  if (target.zoom >= fromView.zoom) {
    /* Наезд: цель плывёт по экрану от своего места к центру. */
    const sx = CX + (target.x - fromView.x) * fromView.zoom
    const sy = CY + (target.y - fromView.y) * fromView.zoom
    return { fx: target.x, fy: target.y, sx: mix(sx, CX, t), sy: mix(sy, CY, t), zoom }
  }
  /* Отъезд: точка, от которой уходим, плывёт из центра на своё новое место. */
  const ex = CX + (fromView.x - target.x) * target.zoom
  const ey = CY + (fromView.y - target.y) * target.zoom
  return { fx: fromView.x, fy: fromView.y, sx: mix(CX, ex, t), sy: mix(CY, ey, t), zoom }
}

/** Слой мира под камерой. Всё, что должно ехать вместе с интерфейсом, — внутри;
    выноски, курсор и тосты — снаружи, в координатах кадра (через project). */
export function Camera({ view, children }: { view: CameraState; children: ReactNode }) {
  useSoundView(view)
  return <AbsoluteFill style={{ transform: view.transform, transformOrigin: '0 0' }}>{children}</AbsoluteFill>
}

/** Вид, в котором rect целиком в кадре с полями margin. shift — сдвиг центра
    rect в кадре, px: освободить место под выноску. max — предел наезда. */
export function fit(rect: Rect, { margin = 90, shift = [0, 0], max = 3 }: { margin?: number; shift?: readonly [number, number]; max?: number } = {}): View {
  const zoom = Math.min(max, (W - margin * 2) / rect.width, (H - margin * 2) / rect.height)
  return { x: rect.x + rect.width / 2 - shift[0] / zoom, y: rect.y + rect.height / 2 - shift[1] / zoom, zoom }
}

/** Вид на всплывающее окно (диалог, тост, меню, форма, подсказка): его ширина —
    доля fill кадра (владелец 28.09: 50–70%, чтобы текст читался в 1080p), но
    высота — не больше доли tall. shift — сдвиг центра окна в кадре, px (место
    под выноску). Держать такой вид — не меньше readFrames(текст окна). */
export function focus(rect: Rect, { fill = 0.6, tall = 0.86, shift = [0, 0] }: { fill?: number; tall?: number; shift?: readonly [number, number] } = {}): View {
  const zoom = Math.min((W * fill) / rect.width, (H * tall) / rect.height)
  return { x: rect.x + rect.width / 2 - shift[0] / zoom, y: rect.y + rect.height / 2 - shift[1] / zoom, zoom }
}

/** Камера за предметом, который летит с экрана на экран (строка из списка,
    карточка с ноутбука в телефон, данные из реестра в лид): центр кадра — на
    предмете, чуть позади него (среднее за lag кадров, как у оператора), так
    что предмет крупный и в центре, а фон едет. position — где предмет в мире
    в кадре frame; zoom — число или функция кадра (отъехать в середине пути).
    Использование: { at, dur, follow: follow(position, { zoom: 1.3 }) }. */
export function follow(
  position: (frame: number) => readonly [number, number],
  { zoom = 1, lag = 8, offset = [0, 0] }: { zoom?: number | ((frame: number) => number); lag?: number; offset?: readonly [number, number] } = {},
): (frame: number) => View {
  const samples = Math.max(1, Math.round(lag))
  return (frame) => {
    let x = 0
    let y = 0
    for (let i = 0; i < samples; i++) {
      const [px, py] = position(frame - i)
      x += px
      y += py
    }
    return { x: x / samples + offset[0], y: y / samples + offset[1], zoom: typeof zoom === 'function' ? zoom(frame) : zoom }
  }
}

/** Вид, в котором rect закрывает весь кадр: нырок в элемент. */
export function cover(rect: Rect): View {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, zoom: Math.max(W / rect.width, H / rect.height) }
}

export const HOME: View = { x: CX, y: CY, zoom: 1 }
