import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, cover, fit, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { useLang, useT } from '../kit/lang'
import { CARTON, TIERS, caption, tag, unitPrice, zl } from './data'
import { mid, union, xy } from './layout'
import { PRODUCT_WORLD, ProductWindow, type ProductState } from './ProductView'
import { chipLabel } from './screens/Store'
import { tagWidth, tw } from './twin'

/* 10 · 03 Ceny · Пороги количества (24 доли). Нырок из миниатюры картона
   выходит на страницу товара: камера отъезжает с фото. Три ячейки цен — «Cena
   bazowa B2B», «Sugerowana cena detaliczna», «Twój zarobek». Курсор в поле
   количества: 10 — вспыхивает порог «Od 10 szt.», встаёт чип «Rabat
   ilościowy: −5%», заработок и сумма на кнопке сменяются; 50 — порог «Od 50
   szt.», −10%. Страница уходит в изометрию: ячейки и пороги приподнимаются
   слоями (С), затем всё ложится обратно.

   0–36     отъезд с фото на страницу
   40–66    наезд на колонку цен ×1,36 (место под выноску справа)
   76–96    курсор к полю количества, 96 — клик; 102 — «10»
   102–118  порог 10, чип, заработок, кнопка; 150 — обводка чипа
   168      выделение и печать «50»: 172 «5», 176 «50»; 176–192 смена
   116–236  выноска 10
   246–300  три ячейки цен по очереди выходят к зрителю (м-отрыв), парят
            и ложатся обратно; 316–342 отъезд на страницу целиком */

const T0 = { click: 96, ten: 102, select: 168, fifty: 176, stack: 246, flat: 300 }

const TITLE = { x: 240 + 536 * 1.40625, y: 100 + 128 * 1.40625, width: 456 * 1.40625, height: 80 * 1.40625 }
const COLUMN = union(TITLE, PRODUCT_WORLD.cell(0), PRODUCT_WORLD.cell(2), PRODUCT_WORLD.tiers, PRODUCT_WORLD.qty, PRODUCT_WORLD.add)
const QTY = PRODUCT_WORLD.qty

const CAMERA: CameraKey[] = [
  { at: 0, ...cover(PRODUCT_WORLD.image) },
  { at: 0, dur: 36, ...HOME },
  { at: 40, dur: 26, ...fit(COLUMN, { max: 1.5, margin: 70, shift: [-250, 0] }) },
  { at: T0.flat + 16, dur: 26, ...HOME },
]

const CURSOR = [
  { at: 76, x: QTY.x + QTY.width + 260, y: QTY.y + 190 },
  { at: T0.click - 4, x: QTY.x + QTY.width * 0.55, y: QTY.y + QTY.height * 0.55 },
  { at: T0.click + 24, x: QTY.x + QTY.width * 0.9, y: QTY.y + QTY.height * 1.9 },
  { at: T0.select - 10, x: QTY.x + QTY.width * 0.6, y: QTY.y + QTY.height * 0.6 },
  { at: T0.select + 30, x: QTY.x + QTY.width * 1.1, y: QTY.y + QTY.height * 2.2 },
]
const COL_CAM = viewAt(CAMERA, 160)

export const PRODUCT_FRAMES = Math.ceil((T0.flat + 44) / 15) * 15

export function Product() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, [T0.click, T0.select], T0.select + 24)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  /* Количество: 1 → 10 → 50, у каждой смены своя доля. */
  const ten = easeInOut(span(frame, T0.ten, 14))
  const fifty = easeInOut(span(frame, T0.fifty, 14))
  const state: ProductState = frame < T0.fifty ? { from: 1, to: 10, k: ten } : { from: 10, to: 50, k: fifty }
  state.typed = frame < T0.ten ? '1' : frame < T0.select + 4 ? '10' : frame < T0.fifty ? '5' : '50'
  state.caret = frame >= T0.click && frame < T0.fifty + 40 && Math.floor((frame - T0.click) / 12) % 2 === 0
  const rise = (delay: number) => clamp01(spring(frame, T0.stack + delay, SPRINGS.heavy)) * (1 - glide(span(frame, T0.flat - 6 + delay / 2, 20)))
  state.lift = [rise(0), rise(6), rise(12), 0]
  const tiersRow = PRODUCT_WORLD.tiers
  /* Выноска 10 — на активной строке порогов, рамка справа от колонки. */
  const rowY = tiersRow.y + (frame < T0.fifty ? 60 : 92) * 1.40625 + 14 * 1.40625
  const anchor = camera.project(tiersRow.x + tiersRow.width - 20, rowY)
  const boxX = COL_CAM.project(COLUMN.x + COLUMN.width, 0)[0] + 50
  const chip = PRODUCT_WORLD.chips
  /* Черта под чипом скидки: у польского ширины подобраны (300 и 316), у
     английского — по самому чипу и ценам за ним (как их ставит Chips). */
  const chipLine = (qty: number, pl: number) => {
    if (lang === 'pl') return pl
    const tier = [...TIERS].reverse().find((item) => qty >= item.from)!
    const o = { color: '', size: 12, icon: 'layers' as const }
    return tagWidth(chipLabel(tier, t), o) + 8 + tw(`${zl(CARTON.net)} → ${zl(unitPrice(qty))}`, 12, 600)
  }
  /* Звук (клики, черты, выноска, камера — у набора): «10» и «50» печатаются;
     на каждом пороге встаёт чип скидки (цены и сумма катятся под ним); три
     ячейки цен выходят к зрителю и ложатся обратно. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const qty = point(...mid(QTY))
  const chips = point(chip.x + 150 * 1.40625, chip.y + chip.height / 2)
  const cells = point(...mid(union(PRODUCT_WORLD.cell(0), PRODUCT_WORLD.cell(2))))
  useSoundCues('key', [T0.ten, T0.select + 4, T0.fifty], qty, { gain: 0.9 })
  useSoundCues('popIn', [T0.ten + 3, T0.fifty + 3], chips, { gain: 0.5 })
  useSoundCue('layers', T0.stack, cells, { gain: 0.5, seconds: 0.6 })
  useSoundCue('popOut', T0.flat - 4, cells, { gain: 0.45 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ProductWindow state={state} />
        <Scribble rect={{ x: chip.x, y: chip.y, width: chipLine(10, 300) * 1.40625, height: chip.height }} kind="underline" p={easeOut(span(frame, T0.ten + 30, 14)) * (1 - easeIn(span(frame, T0.select, 8)))} width={2.8} />
        <Scribble rect={{ x: chip.x, y: chip.y, width: chipLine(50, 316) * 1.40625, height: chip.height }} kind="underline" p={easeOut(span(frame, T0.fifty + 26, 14)) * (1 - easeIn(span(frame, 246, 8)))} width={2.8} seed={3} />
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 70, width: 480 }} tag={tag(10, lang)} title={caption(10, lang)} at={116} until={236} />
      {[T0.click, T0.select].map((at) => {
        const p = cursorAt(CURSOR, at)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={at} x={x} y={y} at={at} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
