import { CanvasTexture, SRGBColorSpace } from 'three'

/* Рисование интерфейса на холсте — для двойников экранов в роликах (06-MOTION,
   §6). Шрифт — Inter, который страница уже загрузила; если он догрузится
   позже, текстура перерисовывается. Всё скруглено: владелец просил стиль без
   прямых углов. */

export const FONT = '"Inter Variable", Inter, system-ui, sans-serif'

export type Draw = (context: CanvasRenderingContext2D, width: number, height: number) => void

/* Язык надписей двойников (владелец 30.09: английские версии 2D-роликов для
   портфолио). Польский — по умолчанию: 3D-пролёт и сайт язык не меняют.
   Художник пишет надпись парой — tr('Leady', 'Leads'), польский текст остаётся
   на месте. Язык ставит 2D-ролик прямо перед рисованием (setPaintLang), как
   тему; paint() запоминает его для перерисовки, когда догрузится шрифт. */
export type PaintLang = 'pl' | 'en'

let language: PaintLang = 'pl'

export function setPaintLang(lang: PaintLang) {
  language = lang
}

export const tr = (pl: string, en: string): string => (language === 'en' ? en : pl)

/** Текстура из холста. Перерисовывается, когда догрузится Inter. ratio — плотность
    пикселей: экрану, к которому камера подлетает близко, нужен 2, иначе текст мылится;
    художник рисует в тех же логических размерах width × height. */
export function paint(width: number, height: number, draw: Draw, ratio = 1): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const context = canvas.getContext('2d')
  if (!context) return null
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  const lang = language
  const render = () => {
    const previous = language
    language = lang
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    draw(context, canvas.width / ratio, canvas.height / ratio)
    texture.needsUpdate = true
    language = previous
  }
  render()
  if (document.fonts && document.fonts.status !== 'loaded') {
    void document.fonts.ready.then(render)
  }
  return texture
}

/** Цвет #rrggbb с прозрачностью — для полупрозрачных двойников на стекле
    (Liquid Glass): фон и карточки пропускают матовое стекло, текст — нет. */
export function tint(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((ch) => ch + ch).join('') : value.slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function round(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2))
}

export interface TextStyle {
  size: number
  weight?: number
  color: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  /** Разрядка, px. */
  tracking?: number
  upper?: boolean
}

export function write(context: CanvasRenderingContext2D, value: string, x: number, y: number, style: TextStyle): number {
  context.font = `${style.weight ?? 600} ${style.size}px ${FONT}`
  context.fillStyle = style.color
  context.textAlign = style.align ?? 'left'
  context.textBaseline = style.baseline ?? 'alphabetic'
  context.letterSpacing = `${style.tracking ?? 0}px`
  const text = style.upper ? value.toUpperCase() : value
  context.fillText(text, x, y)
  const width = context.measureText(text).width
  context.letterSpacing = '0px'
  return width
}

/** Карточка интерфейса: заливка, тонкая граница, скругление. */
export function card(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  border: string,
) {
  round(context, x, y, width, height, radius)
  context.fillStyle = fill
  context.fill()
  context.lineWidth = Math.max(1, radius / 10)
  context.strokeStyle = border
  context.stroke()
}

/** Чип интерфейса продукта (статус, оценка) — как в коде продукта. */
export function chip(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  fill: string,
): number {
  context.font = `650 ${size}px ${FONT}`
  const width = context.measureText(value).width + size * 1.4
  const height = size * 1.9
  round(context, x, y, width, height, height / 2)
  context.fillStyle = fill
  context.fill()
  write(context, value, x + size * 0.7, y + height * 0.68, { size, weight: 650, color })
  return width
}

/** Инициалы в кружке — аватар. */
export function avatar(context: CanvasRenderingContext2D, initials: string, x: number, y: number, size: number, color: string, fill: string) {
  context.beginPath()
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  context.fillStyle = fill
  context.fill()
  write(context, initials, x + size / 2, y + size * 0.66, { size: size * 0.38, weight: 700, color, align: 'center' })
}

/** Экран iPhone в точках iOS: 393 × 852; контент — от 59 pt (под островком). */
export const IPHONE = { width: 393, height: 852, top: 59 }

/** Строка состояния iOS вокруг островка: время слева, сеть и батарея справа.
    scale — пикселей холста на точку iOS. */
export function statusBar(context: CanvasRenderingContext2D, scale: number, color: string) {
  write(context, '9:41', 51 * scale, 37 * scale, { size: 17 * scale, weight: 650, color, align: 'center' })
  context.fillStyle = color
  const right = 393 * scale
  for (let i = 0; i < 4; i++) {
    const height = (4 + i * 2.6) * scale
    round(context, right - 104 * scale + i * 5 * scale, 37 * scale - height, 3.2 * scale, height, 1 * scale)
    context.fill()
  }
  context.strokeStyle = color
  context.lineWidth = 1.8 * scale
  context.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    context.beginPath()
    context.arc(right - 72 * scale, 37 * scale, (3 + i * 3.4) * scale, -Math.PI * 0.75, -Math.PI * 0.25)
    context.stroke()
  }
  round(context, right - 58 * scale, 26 * scale, 25 * scale, 12 * scale, 3.5 * scale)
  context.globalAlpha = 0.4
  context.stroke()
  context.globalAlpha = 1
  round(context, right - 56 * scale, 28 * scale, 18 * scale, 8 * scale, 2 * scale)
  context.fill()
}
