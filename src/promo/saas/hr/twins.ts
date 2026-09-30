import { useMemo, useRef } from 'react'
import { setPaintLang, tr } from '../../oner/motion/paint'
import { HR_FLIGHT } from '../../oner/paths/hr'
import { useLang, type Lang as VideoLang } from '../kit/lang'
import type { Rect } from '../kit/theme'

/* Двойники iApply для v4 — художники из packages/oner/src/motion/hr.ts (те же,
   что в 3D-пролёте), в светлой теме: веб iApply светлый, как продукт; вход,
   «Centrum kontroli QR» и меню администратора тёмные, как в коде; родные
   экраны iOS — в светлом оформлении системы. Надписи сверены с
   WEB APP/client/src/i18n/translations.ts и IOS APP/Shared/L10n.swift, люди и
   объект вымышленные (Jan Kowalski, Marta Zielińska, Hub Wrocław — Fulfillment).

   Художники hr.ts рисуют в готовый контекст (drawXxx(context, …)), поэтому
   холсты здесь свои, без three: sheet() — неподвижный, useLive() — тот же
   холст перерисовывается, когда меняется состояние экрана (печать, таймер).

   Язык двойников — язык ролика (useLang): его ставим прямо перед каждым
   рисованием, как тему, и возвращаем прежний после — на странице могут стоять
   два плеера на разных языках, а 3D-мир остаётся польским. */

export * from '../../oner/motion/hr'
import { setHrTheme } from '../../oner/motion/hr'

/** Светлая тема двойников — прямо перед рисованием: тема — общее состояние
    модуля hr.ts, её же переключают 3D-ролики (Finish.prepare). Только тема
    художника hr.ts: 2D не тянет 3D-мир (@simbia/oner) — так он собирается и
    на сайте портфолио. */
const light = () => setHrTheme('light')

type Draw = (context: CanvasRenderingContext2D) => void

/** Язык холстов, которые сейчас создаёт useSheets (только на время его make). */
let sheetLang: VideoLang = 'pl'

/** Холст художника: логический размер width × height, плотность scale. region —
    нарисовать только этот кусок (для наездов: кусок крупнее всего экрана).
    Язык — того useSheets, внутри которого холст создаётся. */
export function sheet(width: number, height: number, scale: number, draw: Draw, region?: Rect): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const r = region ?? { x: 0, y: 0, width, height }
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(r.width * scale))
  canvas.height = Math.max(1, Math.round(r.height * scale))
  paintInto(canvas, scale, draw, r, sheetLang)
  return canvas
}

function paintInto(canvas: HTMLCanvasElement, scale: number, draw: Draw, r: Rect, lang: VideoLang) {
  const context = canvas.getContext('2d')
  if (!context) return
  light()
  const previous: VideoLang = tr('pl', 'en') === 'en' ? 'en' : 'pl'
  setPaintLang(lang)
  try {
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(scale, 0, 0, scale, -r.x * scale, -r.y * scale)
    draw(context)
    context.setTransform(1, 0, 0, 1, 0, 0)
  } finally {
    setPaintLang(previous)
  }
}

/** Холсты сцены: создаются один раз на язык ролика, внутри <FontGate> (шрифт
    уже загружен). sheet() внутри make рисует на языке ролика. */
export function useSheets<T>(make: () => T): T {
  const lang = useLang()
  return useMemo(() => {
    const before = sheetLang
    sheetLang = lang
    try {
      return make()
    } finally {
      sheetLang = before
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])
}

/** Живой холст: один и тот же, перерисовывается, когда меняется key (состояние
    экрана) или язык ролика. Рисование — в рендере: кадр зависит только от key,
    поэтому любой кадр воспроизводится точно и в любом порядке. */
export function useLive(width: number, height: number, scale: number, draw: Draw, key: string | number, region?: Rect): HTMLCanvasElement | null {
  const lang = useLang()
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const drawn = useRef<string | null>(null)
  if (typeof document === 'undefined') return null
  const r = region ?? { x: 0, y: 0, width, height }
  if (!canvas.current) {
    canvas.current = document.createElement('canvas')
    canvas.current.width = Math.max(1, Math.round(r.width * scale))
    canvas.current.height = Math.max(1, Math.round(r.height * scale))
  }
  const state = `${lang}|${key}`
  if (drawn.current !== state) {
    paintInto(canvas.current, scale, draw, r, lang)
    drawn.current = state
  }
  return canvas.current
}

/* ── Подписи станций: те же, что у выносок 3D (packages/oner/src/paths/hr.ts) ── */

function station(n: number) {
  const found = HR_FLIGHT.stations.find((item) => item.n === n)
  if (!found) throw new Error(`Нет станции ${n} в пути iApply`)
  return found
}

/** Подпись станции n на языке ролика. */
export const caption = (n: number, lang: VideoLang) => (lang === 'en' ? station(n).caption?.en : station(n).caption?.pl) ?? ''

/** Главы пути по-английски: в paths/hr.ts у глав только польские имена. */
const CHAPTERS_EN: Record<string, string> = {
  '01 Start': '01 Start',
  '02 Wejście': '02 Clock-in',
  '03 Giełda': '03 Shift market',
  '04 Grafik': '04 Schedule',
  '05 Płace': '05 Payroll',
  '06 Zawsze pod ręką': '06 Always at hand',
  Dlaczego: 'Why',
  Finał: 'Finale',
}

/** Метка выноски «NN · Глава», как в 3D. */
export const tag = (n: number, lang: VideoLang) => {
  const chapter = station(n).chapter
  return `${String(n).padStart(2, '0')} · ${lang === 'en' ? (CHAPTERS_EN[chapter] ?? chapter) : chapter}`
}
