import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { clamp01, easeIn, easeInOut, easeOut, glide, readFrames, span } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { useLang, useT } from '../kit/lang'
import { caption, tag } from './data'
import { S, mid, world, xy } from './layout'
import { DeckSwap, ProductToast } from './parts'
import { ProductWindow } from './ProductView'
import { QUOTES, QUOTE_ORDER, QuoteCard, QuotesHeader, quoteButtons } from './screens/Buyer'
import { SiteHeader } from './screens/Store'
import { ScreenWindow } from './Window'

/* 12 · 03 Ceny · Оферта «Wyceny» (26 долей). Страница товара уходит назад
   колодой (П8), вперёд выходит «Wyceny» покупателя. Клик по оферте
   Q-260928-4F2A9C «Gotowa do akceptacji»: она раскрывается, строки встают по
   одной — каталожная цена зачёркнута, рядом цена оферты; итоги и зелёная
   строка «Oszczędzasz 438.00 PLN względem ceny katalogowej.». «Akceptuj» —
   форма доставки уже заполнена, «Potwierdź — 2268.12 PLN» — тост
   «Utworzono zamówienie PD-260928-0014» крупно.

   0–30     колода: товар назад, «Wyceny» вперёд
   30–56    наезд на оферту
   60       клик по оферте; 62–82 раскрытие; 80–100 строки; 104 итоги; 114 экономия
   120–214  выноска 12; 124 — подчёркивание экономии
   214      «Akceptuj»; 216–240 форма, страница прокручивается
   276      «Potwierdź»; 276–290 «Tworzenie zamówienia…»; 292 тост и «Zaakceptowana»
   296–318  камера на тост; держится */

const T0 = { swap: 0, head: 60, open: 62, rows: 80, totals: 104, savings: 114, accept: 214, form: 216, confirm: 276, toast: 292 }
const TOAST_TEXT = `Utworzono zamówienie ${QUOTE_ORDER}`
const TOAST_END = T0.toast + 26 + Math.max(44, readFrames(TOAST_TEXT))
const SCROLL = 170

const btn = quoteButtons()
const HEAD = world({ x: QUOTES.card.x + 16, y: QUOTES.card.y + 16, w: 300, h: 44 })
const CARD_OPEN = world({ x: QUOTES.card.x, y: QUOTES.card.y, w: QUOTES.card.w, h: QUOTES.head + 340 })
/** После раскрытия формы страница прокручена на SCROLL. */
const scrolled = (r: { x: number; y: number; w: number; h: number }) => world({ ...r, y: r.y - SCROLL })
const ACCEPT = world(btn.accept)
const CONFIRM = scrolled(btn.confirm)
const FORM_VIEW = scrolled({ x: QUOTES.card.x, y: btn.totalsY - 20, w: QUOTES.card.w, h: btn.buttonsY + 48 + 3 * 46 + 40 - (btn.totalsY - 20) })
const TOAST_BOX = { x: 1024 - 24 - 360, y: 659 - 24 - 56, w: 360, h: 56 }

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 30, dur: 26, ...fit(CARD_OPEN, { max: 1.45, shift: [0, -40] }) },
  { at: T0.form + 2, dur: 26, ...fit(FORM_VIEW, { max: 1.45 }) },
  { at: T0.toast + 4, dur: 22, ...focus(world(TOAST_BOX), { fill: 0.5 }) },
]

const CURSOR = [
  { at: 40, x: HEAD.x + HEAD.width + 260, y: HEAD.y + 200 },
  { at: T0.head - 4, x: HEAD.x + HEAD.width * 0.5, y: HEAD.y + HEAD.height * 0.5 },
  { at: T0.head + 26, x: HEAD.x + HEAD.width * 1.4, y: HEAD.y + HEAD.height * 3.5 },
  { at: T0.accept - 26, x: ACCEPT.x + ACCEPT.width * 2.6, y: ACCEPT.y + ACCEPT.height * 3 },
  { at: T0.accept - 4, x: ACCEPT.x + ACCEPT.width * 0.5, y: ACCEPT.y + ACCEPT.height * 0.55 },
  { at: T0.confirm - 4, x: CONFIRM.x + CONFIRM.width * 0.45, y: CONFIRM.y + CONFIRM.height * 0.55 },
  { at: T0.confirm + 24, x: CONFIRM.x + CONFIRM.width * 0.9, y: CONFIRM.y + CONFIRM.height * 3 },
]
const CLICKS = [T0.head, T0.accept, T0.confirm]
const OPEN_CAM = viewAt(CAMERA, 150)

export const QUOTE_FRAMES = Math.ceil((TOAST_END + 20) / 15) * 15

export function Quote() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.confirm + 20)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const swap = glide(span(frame, T0.swap, 30))
  const open = easeInOut(span(frame, T0.open, 20))
  const rows = clamp01(span(frame, T0.rows, 8)) + clamp01(span(frame, T0.rows + 8, 8))
  const totals = easeOut(span(frame, T0.totals, 10))
  const savings = easeOut(span(frame, T0.savings, 10))
  const form = easeInOut(span(frame, T0.form, 20))
  const scroll = SCROLL * glide(span(frame, T0.form + 4, 24))
  const accepted = frame >= T0.toast ? 1 : 0
  const press = (at: number) => 1 - 0.05 * clamp01(1 - Math.abs(frame - at) / 3)
  const saveRect = world(btn.savings)
  /* Выноска 12 — на строке экономии, рамка слева, в пустом поле карточки. */
  const anchor = camera.project(saveRect.x - 8, saveRect.y + saveRect.height / 2)
  const box = OPEN_CAM.project(world({ x: QUOTES.card.x + 24, y: btn.totalsY - 14, w: 1, h: 1 }).x, world({ x: 0, y: btn.totalsY - 14, w: 1, h: 1 }).y)
  /* Звук (смена колодой — у DeckSwap; клики, черта, выноска, камера — у
     набора): оферта раскрывается, строки встают, итоги, строка экономии;
     «Akceptuj» — форма раскрывается, страница едет; «Potwierdź» — заказ
     создан (тост), тост уходит. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const toastMid = point(...mid(world(TOAST_BOX)))
  const card = point(...mid(CARD_OPEN))
  useSoundCue('popIn', T0.open, card, { gain: 0.45 })
  useSoundCue('layers', T0.rows, point(...mid(world({ x: QUOTES.card.x, y: QUOTES.card.y + QUOTES.head, w: QUOTES.card.w, h: 80 }))), { gain: 0.5, seconds: 0.4 })
  useSoundCue('popIn', T0.totals, point(...mid(world({ x: QUOTES.card.x, y: btn.totalsY, w: QUOTES.card.w, h: 60 }))), { gain: 0.45 })
  useSoundCue('glint', T0.savings, point(...mid(saveRect)), { gain: 0.5, seconds: 0.5 })
  useSoundCue('air', T0.form + 2, point(...mid(FORM_VIEW)), { gain: 0.4, seconds: 0.7 })
  useSoundCue('success', T0.toast, toastMid, { gain: 0.9 })
  useSoundCue('popOut', TOAST_END + 30, toastMid, { gain: 0.4 })
  const quotes = (
    <ScreenWindow path="/b2b/quotes" overlay={<ProductToast x={TOAST_BOX.x * S} y={TOAST_BOX.y * S} at={T0.toast} until={TOAST_END + 30} text={t(TOAST_TEXT, `Order ${QUOTE_ORDER} created`)} scale={S} />}>
      <g transform={`translate(0 ${-scroll})`}>
        <QuotesHeader />
        <QuoteCard open={open} rows={rows} totals={totals} savings={savings} accepted={accepted} form={form} busy={frame >= T0.confirm && frame < T0.toast} pressAccept={press(T0.accept)} pressConfirm={press(T0.confirm)} />
      </g>
      <SiteHeader />
    </ScreenWindow>
  )
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <DeckSwap t={swap} from={<ProductWindow state={{ from: 1, to: 1, k: 0, typed: '1', yours: 1 }} />} to={quotes} />
        <Scribble rect={{ ...saveRect, y: saveRect.y - scroll * S }} kind="underline" p={easeOut(span(frame, T0.savings + 12, 14)) * (1 - easeIn(span(frame, T0.accept - 6, 8)))} width={2.8} color="#059669" />
      </Camera>
      <Callout anchor={anchor} box={{ x: box[0], y: box[1], width: 560 }} tag={tag(12, lang)} title={caption(12, lang)} at={120} until={204} />
      {CLICKS.map((at) => {
        const p = cursorAt(CURSOR, at)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={at} x={x} y={y} at={at} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

