import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { continueRender, delayRender } from 'remotion'
import type { Rect } from './theme'

/* Мост к двойникам экранов из packages/oner (motion/crm.ts и соседи): их
   художники рисуют интерфейс на 2D-холсте и отдают three CanvasTexture, у
   которой .image — сам холст. Здесь холст встаёт в DOM нужного размера.

   Холст не ждёт веб-шрифт: без загруженного Inter двойник вышел бы системным
   шрифтом. Поэтому всё, что рисует двойники, живёт внутри <FontGate>, а
   художников зовут в useMemo уже внутри него. */

/** Польские буквы лежат в подмножестве latin-ext: грузим их явно. */
export const FONT_SAMPLE = 'AaBbCcŻżŹźĆćŃńĄąŚśŁłĘęÓó 0123456789 …„”•·–— %zł'

/** Держит кадр (delayRender), пока Inter не загружен; дети монтируются после. */
export function FontGate({ text = FONT_SAMPLE, children }: { text?: string; children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const handle = useRef<number | null>(null)
  useEffect(() => {
    const current = delayRender('Inter для двойников и надписей')
    handle.current = current
    let alive = true
    Promise.all([document.fonts.load(`450 32px "Inter Variable"`, text), document.fonts.load(`800 32px "Inter Variable"`, text)]).then(() => {
      if (alive) setReady(true)
      else continueRender(current)
    })
    return () => {
      alive = false
    }
  }, [text])
  /* Отпускаем кадр после того, как дети смонтированы и холсты встали в DOM:
     эффекты детей отрабатывают раньше эффекта родителя. */
  useEffect(() => {
    if (!ready || handle.current === null) return
    continueRender(handle.current)
    handle.current = null
  }, [ready])
  return ready ? <>{children}</> : null
}

/** Холст из CanvasTexture художника (или null, если рисовать не на чем). */
export function canvasOf(texture: { image: unknown } | null | undefined): HTMLCanvasElement | null {
  const image = texture?.image
  return typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement ? image : null
}

/** Холст в DOM: растягивается на размер блока (style задаёт место и размер).
    Без crop встаёт сам холст — один холст можно поставить только в одно место.
    С crop — копия куска холста (пиксели те же): для вырезок и проявлений.
    crop — в логических px художника; ratio — сколько пикселей холста в одном
    логическом (paint(…, ratio) и paintClose дают 2; см. ratioOf). */
export function Painted({ source, crop, ratio = 1, style }: { source: HTMLCanvasElement | null; crop?: Rect; ratio?: number; style?: CSSProperties }) {
  const host = useRef<HTMLDivElement>(null)
  const cx = crop?.x
  const cy = crop?.y
  const cw = crop?.width
  const ch = crop?.height
  useLayoutEffect(() => {
    const node = host.current
    if (!node || !source) return
    let canvas = source
    if (cx !== undefined && cy !== undefined && cw !== undefined && ch !== undefined) {
      canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(cw * ratio))
      canvas.height = Math.max(1, Math.round(ch * ratio))
      canvas.getContext('2d')?.drawImage(source, cx * ratio, cy * ratio, cw * ratio, ch * ratio, 0, 0, canvas.width, canvas.height)
    }
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    node.appendChild(canvas)
    return () => {
      if (canvas.parentNode === node) node.removeChild(canvas)
    }
  }, [source, cx, cy, cw, ch, ratio])
  return <div ref={host} style={{ position: 'absolute', ...style }} />
}

/** Плотность холста художника: пикселей холста на логический px (1, 2, …).
    logicalWidth — ширина, в которой художник рисует (DASH.width, LEADS.width…). */
export function ratioOf(canvas: HTMLCanvasElement | null, logicalWidth: number): number {
  return canvas ? canvas.width / logicalWidth : 1
}

/* Ширина надписи для раскладки без замеров DOM: тот же Inter на холсте. */
let measureContext: CanvasRenderingContext2D | null = null

export function textWidth(text: string, size: number, weight = 600, trackingEm = 0): number {
  if (typeof document === 'undefined') return text.length * size * 0.55
  measureContext ??= document.createElement('canvas').getContext('2d')
  const context = measureContext
  if (!context) return text.length * size * 0.55
  context.font = `${weight} ${size}px "Inter Variable", Inter, sans-serif`
  context.letterSpacing = `${trackingEm * size}px`
  const width = context.measureText(text).width
  context.letterSpacing = '0px'
  return width
}
