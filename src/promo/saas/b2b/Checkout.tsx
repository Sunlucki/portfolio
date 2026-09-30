import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, cover, fit, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { useLang } from '../kit/lang'
import { SHADOW, type Rect } from '../kit/theme'
import { NIP, caption, tag } from './data'
import { PAGE, S, mid, world, xy } from './layout'
import { B2BCheck, CHECKOUT, CheckoutPage, CreditOption, PlaceOrder, ThanksPage } from './screens/Buyer'
import { SiteHeader } from './screens/Store'
import { Sheet, tw } from './twin'
import { ScreenWindow } from './Window'

/* 14 · 04 Zamówienie · Оформление «Kasa» (31 доля). Корзина раскрылась
   светлым кадром — это «Kasa»: камера отъезжает. Галочка «Zamawiam jako firma
   (B2B)» рисуется, раскрываются «Dane firmy» с NIP. Прокрутка к «Sposób
   dostawy» — «InPost Kurier Standard», «Za darmo od 1500,00 zł»; к «Sposób
   płatności» — «Kredyt kupiecki: Zapłać w ciągu 30 dni. Limit: 20 000,00 zł»:
   вариант выбран и приподнимается над страницей (м-отрыв) — так и висит.
   Справа итог и «Twój potencjalny zarobek»; клик «Złóż zamówienie» — за
   висящим блоком страница сменяется на «Dziękujemy za zamówienie!».

   0–30     отъезд со светлого кадра, «Kasa» проявляется
   30–56    наезд на блок B2B; 76 — клик по галочке; 80–96 «Dane firmy»
   100–140  данные фирмы читаются, NIP подчёркнут (104)
   140–172  прокрутка к доставке; 176 — обводка «InPost Kurier Standard»
   206–238  прокрутка к оплате; 244 — выбор «Kredyt kupiecki», 252 — отрыв
   250–340  выноска 14
   330–350  камера к итогу; 344 — обводка заработка; 372 — «Złóż zamówienie»
   376–400  «Przetwarzanie…» → «Dziękujemy za zamówienie!» за висящим блоком */

const T0 = { check: 76, company: 80, scroll1: 140, scroll2: 206, credit: 244, lift: 252, place: 372, thanks: 382 }
const S1 = 272
const S2 = 426

/** Прямоугольник страницы с учётом прокрутки sc → мир. */
const at = (r: { x: number; y: number; w: number; h: number }, sc: number) => world({ ...r, y: r.y - sc })
const B2B = at(CHECKOUT.b2b, 0)
const CHECKBOX = at(CHECKOUT.checkbox, 0)
const DELIVERY = at(CHECKOUT.delivery, S1)
const PAYMENT = at(CHECKOUT.payment, S2)
const CREDIT = at(CHECKOUT.credit, S2)
const SUMMARY = at({ x: CHECKOUT.summary.x, y: CHECKOUT.summary.y + 250, w: CHECKOUT.summary.w, h: 310 }, S2)
const PLACE = at(CHECKOUT.place, S2)
const KURIER = at({ x: CHECKOUT.delivery.x + 24 + 294, y: CHECKOUT.delivery.y + 100, w: 278, h: 86 }, S1)

/** Висящий блок «Kredyt kupiecki» в мире — на него смотрит следующая сцена. */
export const CREDIT_BLOCK: Rect = CREDIT
export const CREDIT_LIFT = { scale: 1.06, y: -22 }

const CAMERA: CameraKey[] = [
  { at: 0, ...cover(PAGE) },
  { at: 0, dur: 30, ...HOME },
  { at: 30, dur: 26, ...fit(B2B, { max: 1.55, shift: [-160, 0] }) },
  { at: T0.scroll1, dur: 30, ...fit(DELIVERY, { max: 1.6, shift: [-160, 0] }) },
  { at: T0.scroll2, dur: 30, ...fit(PAYMENT, { max: 1.45, shift: [-300, 0] }) },
  { at: 330, dur: 24, ...fit({ x: PAYMENT.x, y: SUMMARY.y, width: SUMMARY.x + SUMMARY.width - PAYMENT.x, height: PAYMENT.y + PAYMENT.height - SUMMARY.y }, { max: 1.35 }) },
]

const CURSOR = [
  { at: 58, x: CHECKBOX.x + 260, y: CHECKBOX.y + 170 },
  { at: T0.check - 4, x: CHECKBOX.x + CHECKBOX.width * 0.5, y: CHECKBOX.y + CHECKBOX.height * 0.55 },
  { at: T0.check + 24, x: CHECKBOX.x + 160, y: CHECKBOX.y + 150 },
  { at: T0.credit - 22, x: CREDIT.x + CREDIT.width * 0.5, y: CREDIT.y + CREDIT.height + 140 },
  { at: T0.credit - 4, x: CREDIT.x + 34 * S, y: CREDIT.y + CREDIT.height * 0.5 },
  { at: T0.credit + 26, x: CREDIT.x + 120 * S, y: CREDIT.y + CREDIT.height * 1.9 },
  { at: T0.place - 22, x: PLACE.x + PLACE.width * 0.3, y: PLACE.y + PLACE.height * 2.8 },
  { at: T0.place - 4, x: PLACE.x + PLACE.width * 0.5, y: PLACE.y + PLACE.height * 0.55 },
  { at: T0.place + 24, x: PLACE.x + PLACE.width * 0.8, y: PLACE.y + PLACE.height * 3 },
]
const CLICKS = [T0.check, T0.credit, T0.place]
const PAY_CAM = viewAt(CAMERA, 290)

/** Вид камеры в конце сцены: с него начинается сцена «Kredyty». */
export const CHECKOUT_END = CAMERA[CAMERA.length - 1]!

export const CHECKOUT_FRAMES = 420

export function Checkout() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.place + 20)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const show = easeOut(span(frame, 6, 12))
  const check = easeOut(span(frame, T0.check, 8))
  const company = easeInOut(span(frame, T0.company, 16))
  const scroll = S1 * glide(span(frame, T0.scroll1, 32)) + (S2 - S1) * glide(span(frame, T0.scroll2, 32))
  const selected = spring(frame, T0.credit, SPRINGS.snap)
  const lift = spring(frame, T0.lift, SPRINGS.heavy)
  const press = (t: number) => 1 - 0.05 * clamp01(1 - Math.abs(frame - t) / 3)
  const thanks = easeInOut(span(frame, T0.thanks, 18))
  const credit = { x: CHECKOUT.credit.x * S, y: (CHECKOUT.credit.y - scroll) * S }
  /* Выноска 14 — на висящем «Kredyt kupiecki», рамка справа. */
  const anchor = camera.project(CREDIT.x + CREDIT.width * 0.62, CREDIT.y + CREDIT.height * 0.72 + CREDIT_LIFT.y * lift)
  const boxX = PAY_CAM.project(CREDIT.x + CREDIT.width, 0)[0] + 60
  const nip = at({ x: CHECKOUT.b2b.x + 320 + 12, y: CHECKOUT.b2b.y + 140 + 26, w: tw(NIP, 14, 400), h: 14 }, 0)
  const earn = at({ x: CHECKOUT.summary.x + 24, y: CHECKOUT.summary.y + 374, w: CHECKOUT.summary.w - 48, h: 66 }, S2)
  /* Звук (клики, обводки, выноска, камера — у набора): галочка «Zamawiam jako
     firma (B2B)», раскрываются «Dane firmy»; страница едет к доставке и к
     оплате; «Kredyt kupiecki» выбран и приподнимается; «Złóż zamówienie» →
     «Dziękujemy za zamówienie!». */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  useSoundCue('tick', T0.check + 3, point(...mid(CHECKBOX)), { gain: 0.6 })
  useSoundCue('popIn', T0.company + 6, point(...mid(B2B)), { gain: 0.45 })
  useSoundCues('air', [T0.scroll1, T0.scroll2], point(PAGE.x + PAGE.width / 2, PAGE.y + PAGE.height / 2), { gain: 0.35, seconds: 1 })
  useSoundCue('tick', T0.credit + 2, point(CREDIT.x + 34 * S, CREDIT.y + CREDIT.height / 2), { gain: 0.6 })
  useSoundCue('popIn', T0.lift, point(...mid(CREDIT)), { gain: 0.55 })
  useSoundCue('success', T0.thanks + 4, point(PAGE.x + PAGE.width / 2, PAGE.y + PAGE.height * 0.4), { gain: 0.9 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow
          path="/checkout"
          overlay={
            <>
              {/* «Kredyt kupiecki»: выбран, затем приподнят и висит над страницей. */}
              <div
                style={{
                  position: 'absolute',
                  left: credit.x,
                  top: credit.y,
                  width: CHECKOUT.credit.w * S,
                  height: CHECKOUT.credit.h * S,
                  borderRadius: 16 * S,
                  zIndex: 3,
                  transform: `translateY(${CREDIT_LIFT.y * lift}px) scale(${1 + (CREDIT_LIFT.scale - 1) * lift})`,
                  boxShadow: lift > 0.01 ? SHADOW.lifted : undefined,
                  background: lift > 0.01 ? '#ffffff' : undefined,
                }}
              >
                <Sheet w={CHECKOUT.credit.w} h={CHECKOUT.credit.h} scale={S} style={{ left: 0, top: 0 }}>
                  <CreditOption selected={selected} />
                </Sheet>
              </div>
            </>
          }
        >
          <g opacity={show}>
            <g transform={`translate(0 ${-scroll})`} opacity={1 - thanks}>
              <CheckoutPage company={company} />
              <B2BCheck p={check} />
              <PlaceOrder press={press(T0.place)} busy={frame >= T0.place && frame < T0.thanks} />
            </g>
            <SiteHeader pad={32} />
          </g>
          {thanks > 0 && (
            <g opacity={thanks} transform={`translate(0 ${(1 - thanks) * 40})`}>
              <ThanksPage check={easeOut(span(frame, T0.thanks + 8, 16))} />
            </g>
          )}
        </ScreenWindow>
        <Scribble rect={nip} kind="underline" p={easeOut(span(frame, 104, 14)) * (1 - easeIn(span(frame, T0.scroll1 - 4, 8)))} width={2.8} />
        <Scribble rect={KURIER} p={easeOut(span(frame, 176, 16)) * (1 - easeIn(span(frame, T0.scroll2 - 4, 8)))} pad={[14, 10]} seed={10} width={2.8} />
        <Scribble rect={earn} p={easeOut(span(frame, 344, 16)) * (1 - easeIn(span(frame, T0.place - 6, 8)))} pad={[12, 8]} seed={11} width={2.8} color="#059669" />
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] + 30, width: 440 }} tag={tag(14, lang)} title={caption(14, lang)} at={262} until={330} />
      {CLICKS.map((t) => {
        const p = cursorAt(CURSOR, t)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={t} x={x} y={y} at={t} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
