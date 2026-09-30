import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import type { ReactNode } from 'react'
import { SPRINGS, clamp01, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Tap } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundProbe, useSoundTrack } from '../kit/sound'
import { Phone } from '../kit/surfaces'
import { type Point, type Rect } from '../kit/theme'
import { IosNotification } from '../kit/ui'
import { useLang, useT } from '../kit/lang'
import { NIP, ORDER, caption, tag } from './data'
import { xy } from './layout'
import { Bead } from './parts'
import { Bubble, ChatHeader, ChatInput, CHAT_BG, FILTER_SHEET_TOP, OutBubble, PH, PW, PhoneCheckout, PhoneFilters, PhoneMenu, PhoneProduct, PhoneShop, SafariBar, TOP, bubbleHeight, phoneCardRect, type BubbleLine } from './screens/Phone'
import { L } from './twin'

/* 19–20 · 06 Mobile · Витрина в телефоне и бот продавца (74 доли). iPhone
   покупателя поднимается в кадр — это сайт (адресная строка Safari внизу).
   Касания без курсора: меню на весь экран → «Sklep»; «Filtry» — лист снизу
   крупно, «Pokaż produkty (36)»; картон → три ячейки цен, 50 шт., «Dodaj —
   427,00 zł» → «Kasa» с липкой панелью «Razem» и пульсирующей «Złóż
   zamówienie». Бусина летит к телефону продавца, камера за ней: уведомление
   iOS крупно, касание — бот в Telegramie: «🤝 Nowe zgłoszenie B2B
   kontrahenta», «✅ Aktywuj» (галочка); заказ «🛒 ZAMÓWIENIE …», «🚚 Wyślij
   zamówienie», номер посылки печатается, «✅ … oznaczone jako WYSŁANE.».

   Покупатель: 0–30 телефон встаёт; 64 меню; 132 «Sklep»; 172 «Filtry»;
   286 «Pokaż produkty»; 324 картон; 424 «Dodaj»; 470–570 пульс, выноска 19.
   Продавец: 572–612 бусина к телефону; 614 уведомление, камера на него;
   692 касание — чат; 806 «Aktywuj»; 836 заказ; 904 «Wyślij»; 930–972 номер;
   978 отправка; 994 «WYSŁANE»; 1000–1090 выноска 20. */

const SCALE = 1.12
const BEZEL = (12 + 3.5) * SCALE
const OUTER = { w: PW * SCALE + BEZEL * 2, h: PH * SCALE + BEZEL * 2 }
const A = { x: 760 - OUTER.w / 2, y: 540 - OUTER.h / 2 }
const B = { x: 2250 - OUTER.w / 2, y: 540 - OUTER.h / 2 }
/** Точка экрана (pt) телефона → мир. */
const onA = (x: number, y: number): Point => [A.x + BEZEL + x * SCALE, A.y + BEZEL + y * SCALE]
const onB = (x: number, y: number): Point => [B.x + BEZEL + x * SCALE, B.y + BEZEL + y * SCALE]
const rectA = (x: number, y: number, w: number, h: number): Rect => ({ x: onA(x, y)[0], y: onA(x, y)[1], width: w * SCALE, height: h * SCALE })
const rectB = (x: number, y: number, w: number, h: number): Rect => ({ x: onB(x, y)[0], y: onB(x, y)[1], width: w * SCALE, height: h * SCALE })

const T0 = {
  rise: 0,
  menu: 64,
  shop: 132,
  filters: 172,
  show: 286,
  card: 324,
  add: 424,
  pulse: 470,
  bead: 572,
  notify: 614,
  open: 692,
  activate: 806,
  order: 836,
  ship: 904,
  type: 930,
  send: 978,
  done: 994,
}

const CARD2 = phoneCardRect(2)
const TAPS_A: [number, number, number][] = [
  [T0.menu, PW - 36, TOP + 26],
  [T0.shop, PW / 2, TOP + 72 + 108 + 8 + 88],
  [T0.filters, PW / 2, TOP + 244],
  [T0.show, PW / 2, PH - 107],
  [T0.card, CARD2.x + CARD2.w / 2, CARD2.y + CARD2.h / 2],
  [T0.add, 150 + (PW - 170) / 2, TOP + 662],
]

/* Сообщения бота (telegramAdmin.ts): заявка B2B, заказ, отправка. */
const B1: BubbleLine[] = [
  { text: '🤝 Nowe zgłoszenie B2B kontrahenta', bold: true },
  { text: 'Firma:', mask: 150 },
  { text: 'Osoba: Anna', mask: 90 },
  { text: 'Email:', mask: 160 },
  { text: `NIP/VAT: ${NIP}` },
  { text: 'Kraj: PL' },
  { text: 'Adres:', mask: 170 },
  { text: 'Status: oczekuje na ręczną weryfikację.', muted: true },
]
const B1_KEYS = [['✅ Aktywuj', '❌ Odrzuć'], ['Otwórz w adminie']]
const B2: BubbleLine[] = [
  { text: `🛒 ZAMÓWIENIE ${ORDER.number}`, bold: true },
  { text: '📊 Status: ⏳ Oczekujące' },
  { text: '💳 Płatność: Oczekuje' },
  { text: '👤 Klient:', mask: 140 },
  { text: '📦 Produkty (4)' },
  { text: `💰 Suma: ${ORDER.gross.toFixed(2)} zł PLN`, bold: true },
]
const B2_KEYS = [['🚚 Wyślij zamówienie'], ['📋 Otwórz w panelu admina']]
const B3: BubbleLine[] = [
  { text: `🚚 Wysyłka zamówienia ${ORDER.number}`, bold: true },
  { text: 'Wpisz numer przesyłki (tracking number):', muted: true },
]
const TRACKING = '620012345678901234567'
const B4: BubbleLine[] = [
  { text: `✅ Zamówienie ${ORDER.number}`, bold: true },
  { text: 'oznaczone jako WYSŁANE.' },
  { text: `📦 Tracking: ${TRACKING}`, muted: true },
]

/* Бот продавца по-английски: у движка он только польский, перевод свой — те
   же строки и кнопки, столько же строк (раскладка чата считается по B1…B4). */
const B1_EN: BubbleLine[] = [
  { text: '🤝 New B2B counterparty application', bold: true },
  { text: 'Company:', mask: 150 },
  { text: 'Contact: Anna', mask: 90 },
  { text: 'Email:', mask: 160 },
  { text: `NIP/VAT: ${NIP}` },
  { text: 'Country: PL' },
  { text: 'Address:', mask: 170 },
  { text: 'Status: awaiting manual review.', muted: true },
]
const B1_KEYS_EN = [['✅ Activate', '❌ Reject'], ['Open in admin']]
const B2_EN: BubbleLine[] = [
  { text: `🛒 ORDER ${ORDER.number}`, bold: true },
  { text: '📊 Status: ⏳ Pending' },
  { text: '💳 Payment: Pending' },
  { text: '👤 Customer:', mask: 140 },
  { text: '📦 Products (4)' },
  { text: `💰 Total: ${ORDER.gross.toFixed(2)} PLN`, bold: true },
]
const B2_KEYS_EN = [['🚚 Ship order'], ['📋 Open in admin panel']]
const B3_EN: BubbleLine[] = [
  { text: `🚚 Shipping order ${ORDER.number}`, bold: true },
  { text: 'Enter the tracking number:', muted: true },
]
const B4_EN: BubbleLine[] = [
  { text: `✅ Order ${ORDER.number}`, bold: true },
  { text: 'marked as SHIPPED.' },
  { text: `📦 Tracking: ${TRACKING}`, muted: true },
]

/** Где лежат пузыри чата (pt) при числе сообщений n: новые — внизу, над полем. */
function chatLayout(count: number) {
  const bottom = PH - 122
  const items = [
    { h: bubbleHeight(B1, B1_KEYS), w: 340 },
    { h: bubbleHeight(B2, B2_KEYS), w: 330 },
    { h: bubbleHeight(B3, []), w: 318 },
    { h: 40, w: 230 },
    { h: bubbleHeight(B4, []), w: 318 },
  ].slice(0, count)
  const ys: number[] = []
  let y = bottom
  for (let i = items.length - 1; i >= 0; i--) {
    y -= items[i]!.h
    ys[i] = y
    y -= 12
  }
  return { ys, items }
}

const BEAD_PATH = (f: number): Point => {
  const t = glide(span(f, T0.bead, 40))
  const [ax, ay] = onA(PW / 2, PH - 107)
  const [bx, by] = onB(PW / 2, 60)
  return [mix(ax, bx, t), mix(ay, by, t) - Math.sin(Math.PI * t) * 220]
}

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 30, dur: 26, ...fit(rectA(0, 0, PW, 430), { max: 1.9 }) },
  { at: T0.menu + 18, dur: 22, ...fit(rectA(0, 100, PW, 540), { max: 1.6 }) },
  { at: T0.shop + 16, dur: 22, ...fit(rectA(0, 140, PW, 340), { max: 1.9 }) },
  { at: T0.filters + 16, dur: 24, ...focus(rectA(0, FILTER_SHEET_TOP, PW, 420), { fill: 0.5, tall: 0.86 }) },
  { at: 262, dur: 22, ...fit(rectA(0, 520, PW, 300), { max: 1.9 }) },
  { at: T0.show + 16, dur: 22, ...fit(rectA(0, 320, PW, 470), { max: 1.8 }) },
  { at: T0.card + 20, dur: 24, ...fit(rectA(0, 360, PW, 340), { max: 1.9, shift: [-260, 0] }) },
  { at: T0.add + 20, dur: 24, ...fit(rectA(0, 330, PW, 522), { max: 1.6, shift: [-280, 0] }) },
  { at: T0.bead - 4, dur: 18, follow: follow(BEAD_PATH, { zoom: 1.15, lag: 6 }) },
  { at: T0.notify + 2, dur: 24, ...focus(rectB(16, 58, 361, 90), { fill: 0.55 }) },
  { at: T0.open + 8, dur: 26, ...fit(rectB(0, 440, PW, 300), { max: 1.9, shift: [-240, 0] }) },
  { at: T0.order + 4, dur: 26, ...fit(rectB(0, 300, PW, 440), { max: 1.7, shift: [-240, 0] }) },
  { at: T0.ship + 10, dur: 26, ...fit(rectB(0, 400, PW, 400), { max: 1.8, shift: [-240, 0] }) },
  { at: T0.done + 4, dur: 26, ...fit(rectB(0, 430, PW, 350), { max: 1.8, shift: [-260, 0] }) },
]
const CHECK_CAM = viewAt(CAMERA, 520)
const DONE_CAM = viewAt(CAMERA, 1040)

export const MOBILE_FRAMES = 1110

export function Mobile() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const en = lang === 'en'
  const camera = viewAt(CAMERA, frame)
  const rise = spring(frame, T0.rise, SPRINGS.heavy)
  /* Экраны покупателя: наложения въезжают справа, лист фильтров — снизу. */
  const menu = easeInOut(span(frame, T0.menu + 2, 16)) * (1 - easeInOut(span(frame, T0.shop + 2, 16)))
  const sheet = easeInOut(span(frame, T0.filters + 2, 20)) * (1 - easeInOut(span(frame, T0.show + 2, 16)))
  const product = easeInOut(span(frame, T0.card + 2, 18))
  const checkout = easeInOut(span(frame, T0.add + 2, 18))
  const breathe = frame < T0.pulse ? 0 : 0.5 - 0.5 * Math.cos(((frame - T0.pulse) / 30) * Math.PI * 2)
  const bead = BEAD_PATH(frame)
  /* Продавец: уведомление, чат. */
  const count = frame < T0.open ? 0 : frame < T0.order ? 1 : frame < T0.ship + 6 ? 2 : frame < T0.send + 2 ? 3 : frame < T0.done ? 4 : 5
  const layout = chatLayout(Math.max(1, count))
  const typed = TRACKING.slice(0, frame < T0.type ? 0 : Math.min(TRACKING.length, Math.floor((frame - T0.type) / 2) + 1))
  const [ax, ay] = camera.project(...onA(PW / 2 + 120, PH - 107))
  const checkBox = CHECK_CAM.project(...onA(PW, PH - 190))
  const [dx, dy] = camera.project(...onB(300, layout.ys[4] !== undefined ? layout.ys[4]! + 40 : 600))
  const doneBox = DONE_CAM.project(...onB(PW, 500))
  /* Звук (касания, уведомление iOS, выноски, камера — у набора). Покупатель:
     телефон встаёт; меню и лист фильтров выходят поверх витрины и уходят,
     товар и «Kasa» — смена страницы. Бусина летит к телефону продавца.
     Продавец: «✅ Aktywuj» — активировано; новый заказ от бота; бот просит
     номер посылки, номер печатается; отправка; «WYSŁANE». */
  const point = (p: Point) => xy(camera.project(...p))
  const screenA = point(onA(PW / 2, PH / 2))
  const chatY = (i: number) => (layout.ys[i] ?? PH / 2) + scrollOf(i, frame)
  useSoundProbe('whoosh', clamp01(rise), point(onA(PW / 2, PH / 2 + ((1 - clamp01(rise)) * 1100) / SCALE)), { eps: 0.004, gain: 0.6 })
  useSoundCue('popIn', T0.menu + 3, screenA, { gain: 0.5 })
  useSoundCue('popOut', T0.shop + 3, screenA, { gain: 0.4 })
  useSoundCue('popIn', T0.filters + 4, point(onA(PW / 2, FILTER_SHEET_TOP + 150)), { gain: 0.5 })
  useSoundCue('popOut', T0.show + 3, point(onA(PW / 2, FILTER_SHEET_TOP + 150)), { gain: 0.4 })
  useSoundCues('air', [T0.card + 3, T0.add + 3], screenA, { gain: 0.35, seconds: 0.5 })
  useSoundTrack('b2b-phone-bead', 'whoosh', frame >= T0.bead && frame <= T0.bead + 40, point(bead), { gain: 0.6 })
  useSoundCue('success', T0.activate + 4, point(onB(16 + (340 - 4) / 4, chatY(0) + B1.length * 19 + 20 + 4 + 17)), { gain: 0.8 })
  useSoundCue('notify', T0.order, point(onB(16 + 165, chatY(1) + 60)), { gain: 0.7 })
  useSoundCue('popIn', T0.ship + 6, point(onB(16 + 160, chatY(2) + 30)), { gain: 0.5 })
  useSoundCues('key', Array.from(TRACKING, (_, i) => T0.type + i * 2), point(onB(PW / 2, PH - 86)), { gain: 0.7 })
  useSoundCue('whoosh', T0.send + 2, point(onB(PW - 16 - 115, chatY(3) + 20)), { gain: 0.45, seconds: 0.35 })
  useSoundCue('success', T0.done, point(onB(16 + 160, chatY(4) + 40)), { gain: 0.8 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Phone scale={SCALE} style={{ left: A.x, top: A.y, transform: `translateY(${(1 - clamp01(rise)) * 1100}px)` }} screen={L.page}>
          <svg width={PW * SCALE} height={PH * SCALE} viewBox={`0 0 ${PW} ${PH}`} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs>
              <clipPath id="b2b-phone-a">
                <rect x={0} y={0} width={PW} height={PH} />
              </clipPath>
            </defs>
            <g clipPath="url(#b2b-phone-a)">
              <PhoneShop />
              {menu > 0.001 && (
                <g transform={`translate(${(1 - menu) * PW} 0)`}>
                  <PhoneMenu />
                </g>
              )}
              {sheet > 0.001 && (
                <g>
                  <rect x={0} y={0} width={PW} height={PH} fill="rgba(7,6,7,0.35)" opacity={sheet} />
                  <g transform={`translate(0 ${(1 - sheet) * (PH - FILTER_SHEET_TOP + 40)})`}>
                    <PhoneFilters />
                  </g>
                </g>
              )}
              {product > 0.001 && (
                <g transform={`translate(${(1 - product) * PW} 0)`}>
                  <PhoneProduct />
                </g>
              )}
              {checkout > 0.001 && (
                <g transform={`translate(${(1 - checkout) * PW} 0)`}>
                  <PhoneCheckout breathe={breathe} />
                </g>
              )}
              <SafariBar />
            </g>
          </svg>
          {TAPS_A.map(([at, x, y]) => (
            <Tap key={at} x={x * SCALE} y={y * SCALE} at={at} scale={SCALE} />
          ))}
        </Phone>
        <Phone scale={SCALE} style={{ left: B.x, top: B.y }} screen={CHAT_BG}>
          <svg width={PW * SCALE} height={PH * SCALE} viewBox={`0 0 ${PW} ${PH}`} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs>
              <clipPath id="b2b-phone-b">
                <rect x={0} y={TOP + 60} width={PW} height={PH - TOP - 60} />
              </clipPath>
            </defs>
            <rect x={0} y={0} width={PW} height={PH} fill={CHAT_BG} />
            <g clipPath="url(#b2b-phone-b)">
              {count >= 1 && <ChatBubble i={0} layout={layout} frame={frame} at={T0.open}>{(x, y) => <Bubble x={x} y={y} w={340} lines={en ? B1_EN : B1} keys={en ? B1_KEYS_EN : B1_KEYS} pressed={frame >= T0.activate ? 0 : -1} check={easeOut(span(frame, T0.activate + 2, 12))} />}</ChatBubble>}
              {count >= 2 && <ChatBubble i={1} layout={layout} frame={frame} at={T0.order}>{(x, y) => <Bubble x={x} y={y} w={330} lines={en ? B2_EN : B2} keys={en ? B2_KEYS_EN : B2_KEYS} pressed={frame >= T0.ship ? 0 : -1} check={easeOut(span(frame, T0.ship + 2, 12))} />}</ChatBubble>}
              {count >= 3 && <ChatBubble i={2} layout={layout} frame={frame} at={T0.ship + 6}>{(x, y) => <Bubble x={x} y={y} w={318} lines={en ? B3_EN : B3} />}</ChatBubble>}
              {count >= 4 && <ChatBubble i={3} layout={layout} frame={frame} at={T0.send + 2} out>{(_x, y) => <OutBubble x={PW - 16 - 230} y={y} w={230} text={TRACKING} />}</ChatBubble>}
              {count >= 5 && <ChatBubble i={4} layout={layout} frame={frame} at={T0.done}>{(x, y) => <Bubble x={x} y={y} w={318} lines={en ? B4_EN : B4} />}</ChatBubble>}
            </g>
            <ChatHeader />
            <ChatInput value={frame >= T0.send ? '' : typed} caret={frame >= T0.type - 6 && frame < T0.send} />
          </svg>
          <IosNotification x={16 * SCALE} y={58 * SCALE} at={T0.notify} until={T0.open + 2} app="Telegram" title={t('Powiadomienia sklepu', 'Store notifications')} body={t('🤝 Nowe zgłoszenie B2B kontrahenta', '🤝 New B2B counterparty application')} glyph="send" scale={SCALE} />
          {[
            [T0.open, PW / 2, 100],
            [T0.activate, 16 + (340 - 4) / 4, layout.ys[0] !== undefined ? layout.ys[0]! + B1.length * 19 + 20 + 4 + 17 : 0],
            [T0.ship, 16 + 330 / 2, (layout.ys[1] ?? 0) + B2.length * 19 + 20 + 4 + 17],
            [T0.send, PW - 38, PH - 86],
          ].map(([at, x, y]) => (
            <Tap key={at} x={x! * SCALE} y={y! * SCALE} at={at!} scale={SCALE} />
          ))}
        </Phone>
        {frame >= T0.bead - 2 && frame < T0.bead + 42 && <Bead x={bead[0]} y={bead[1]} size={22} />}
      </Camera>
      <Callout anchor={[ax, ay]} box={{ x: checkBox[0] + 60, y: ay - 60, width: 500 }} tag={tag(19, lang)} title={caption(19, lang)} at={T0.pulse + 10} until={T0.bead - 6} />
      <Callout anchor={[dx, dy]} box={{ x: doneBox[0] + 60, y: dy - 60, width: 520 }} tag={tag(20, lang)} title={caption(20, lang)} at={T0.done + 14} until={T0.done + 104} />
    </AbsoluteFill>
  )
}

/** Пузырь чата на своём месте: встаёт снизу (pop), потом едет вверх, когда
    приходят новые. */
function ChatBubble({ i, layout, frame, at, out = false, children }: { i: number; layout: ReturnType<typeof chatLayout>; frame: number; at: number; out?: boolean; children: (x: number, y: number) => ReactNode }) {
  const y = layout.ys[i] ?? 0
  const k = spring(frame, at, SPRINGS.pop)
  /* Сдвиг вверх при новых сообщениях — плавно (glide), а не скачком. */
  const shift = scrollOf(i, frame)
  return (
    <g opacity={clamp01(k * 1.5)} transform={`translate(${out ? (1 - clamp01(k)) * 30 : (1 - clamp01(k)) * -20} ${(1 - clamp01(k)) * 24 + shift})`}>
      {children(16, y)}
    </g>
  )
}

/** Плавная прокрутка чата: разница позиции пузыря до и после прихода нового. */
function scrollOf(i: number, frame: number): number {
  const arrivals = [T0.open, T0.order, T0.ship + 6, T0.send + 2, T0.done]
  let shift = 0
  for (let n = i + 1; n < arrivals.length; n++) {
    const at = arrivals[n]!
    if (frame < at) break
    const before = chatLayout(n).ys[i] ?? 0
    const after = chatLayout(n + 1).ys[i] ?? 0
    shift += (before - after) * (1 - easeInOut(span(frame, at, 14)))
  }
  return shift
}

