import type { ReactNode } from 'react'
import { useLang, useT } from '../../kit/lang'
import { clamp01 } from '../../kit/motion'
import { CARTON, GOODS, NIP, ORDER, goodName, zl } from '../data'
import type { GlyphName } from '../glyphs'
import { Btn, Dot, G, L, Mask, P, R, T, tw, wrap } from '../twin'
import { BoxPicture, GoodsPicture } from './Store'

/* Витрина в iPhone (сайт, не приложение: адресная строка Safari внизу) и
   уведомления бота продавца. Экран 393 × 852 pt, приложение — ниже 59 pt.
   Светлая палитра движка; пузыри бота — нейтральные, тексты — из
   server/src/services/telegramAdmin.ts и telegram.ts. */

export const PW = 393
export const PH = 852
export const TOP = 59

/** Шапка витрины: «H» в круге, корзина со счётчиком, меню. */
export function PhoneHeader({ cart = 4 }: { cart?: number }) {
  return (
    <g>
      <rect x={0} y={0} width={PW} height={TOP + 56} fill="rgba(247,246,242,0.96)" />
      <rect x={0} y={TOP + 55} width={PW} height={1} fill={L.borderSoft} />
      <Dot cx={40} cy={TOP + 26} r={14} fill={L.primary} />
      <T x={40} y={TOP + 31} s={14} w={900} c="#ffffff" a="middle">
        H
      </T>
      <G n="shoppingCart" x={PW - 92} y={TOP + 16} s={20} />
      <Dot cx={PW - 70} cy={TOP + 14} r={7} fill={L.primary} />
      <T x={PW - 70} y={TOP + 18} s={9} w={700} c="#ffffff" a="middle">
        {cart}
      </T>
      <G n="menu" x={PW - 48} y={TOP + 14} s={24} />
    </g>
  )
}

/** Адресная строка Safari внизу: это сайт. */
export function SafariBar() {
  const bar = { x: 16, y: PH - 58, w: PW - 32, h: 44 }
  return (
    <g>
      <R x={bar.x} y={bar.y} w={bar.w} h={bar.h} r={22} fill="rgba(255,255,255,0.92)" />
      <R x={bar.x} y={bar.y} w={bar.w} h={bar.h} r={22} stroke={L.borderSoft} />
      <T x={bar.x + 18} y={bar.y + 28} s={14} w={600}>
        AA
      </T>
      <G n="lock" x={bar.x + bar.w / 2 - 72} y={bar.y + 15} s={12} c={L.mutedFg} />
      <T x={bar.x + bar.w / 2 + 6} y={bar.y + 27} s={15} w={500} a="middle">
        hurtownia.demo
      </T>
      <G n="refreshCw" x={bar.x + bar.w - 34} y={bar.y + 13} s={18} />
    </g>
  )
}

export const phoneCardRect = (index: number) => {
  const w = (PW - 44) / 2
  return { x: 16 + (index % 2) * (w + 12), y: TOP + 280 + Math.floor(index / 2) * 250, w, h: 238 }
}

/** «Sklep» w telefonie: баннер оптовых цен, «Filtry», сетка 2 × 2. */
export function PhoneShop() {
  const lang = useLang()
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={PW} height={PH} fill={L.page} />
      <PhoneHeader />
      <T x={20} y={TOP + 110} s={36} w={700}>
        {t('Sklep', 'Shop')}
      </T>
      <T x={20} y={TOP + 136} s={14} c={L.mutedFg}>
        {t('Przeglądaj naszą pełną ofertę', 'Browse our complete range')}
      </T>
      <R x={16} y={TOP + 152} w={PW - 32} h={56} r={16} fill={L.primary} />
      <P x={30} y={TOP + 176} s={13} w={500} c="#ffffff" width={PW - 120} lh={17}>
        {t('Dynamiczne ceny B2B są aktywne dla Twojego konta.', 'B2B dynamic pricing is active for your account.')}
      </P>
      <R x={PW - 80} y={TOP + 167} w={52} h={26} r={13} fill="#ffffff" />
      <T x={PW - 54} y={TOP + 185} s={13} w={650} a="middle">
        -12%
      </T>
      <Btn label={t('Filtry', 'Filters')} x={16} y={TOP + 222} h={44} v="secondary" o={{ icon: 'funnel', width: PW - 32 }} />
      {GOODS.slice(0, 4).map((good, index) => {
        const r = phoneCardRect(index)
        const lines = wrap(goodName(good.name, lang), 13, 600, r.w - 24)
        return (
          <g key={good.sku}>
            <R x={r.x} y={r.y} w={r.w} h={r.h} r={24} fill={L.card} />
            <R x={r.x} y={r.y} w={r.w} h={r.h} r={24} stroke={L.borderSoft} />
            <GoodsPicture kind={good.picture} x={r.x + 8} y={r.y + 8} s={r.w - 16} />
            {lines.slice(0, 2).map((line, li) => (
              <T key={li} x={r.x + 12} y={r.y + r.w + 14 + li * 17} s={13} w={600}>
                {line}
              </T>
            ))}
            <T x={r.x + 12} y={r.y + r.w + 52} s={14} w={700} c={L.primary}>
              {zl(good.net)}
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** Меню на весь экран: карточки разделов, «Sklep» залит оранжевым. */
export function PhoneMenu() {
  const t = useT()
  const items: [GlyphName, string, boolean][] = [
    ['house', t('Strona główna', 'Home'), false],
    ['store', t('Sklep', 'Shop'), true],
    ['info', t('O nas', 'About Us'), false],
    ['messageCircle', t('Kontakt', 'Contact'), false],
  ]
  let y = TOP + 72
  const cards: ReactNode[] = []
  for (const [glyph, name, on] of items) {
    const hh = on ? 176 : 108
    cards.push(
      <g key={name}>
        {on ? <R x={24} y={y} w={PW - 48} h={hh} r={24} fill={L.primary} /> : <R x={24} y={y} w={PW - 48} h={hh} r={24} stroke="rgba(7,6,7,0.28)" dash="2 4" />}
        <G n={glyph} x={44} y={y + hh / 2 - 12} s={24} c={on ? '#ffffff' : L.fg} />
        <T x={88} y={y + hh / 2 + 9} s={24} w={900} c={on ? '#ffffff' : L.fg} ls={-0.4}>
          {name}
        </T>
        <Dot cx={PW - 52} cy={y + hh / 2} r={5} fill={on ? '#ffffff' : L.fg} />
      </g>,
    )
    y += hh + 8
  }
  return (
    <g>
      <rect x={0} y={0} width={PW} height={PH} fill={L.page} />
      <G n="x" x={PW - 48} y={TOP + 14} s={24} />
      {cards}
      <Btn label={t('Ulubione', 'Wishlist')} x={24} y={y + 12} h={48} v="outline" o={{ icon: 'heart', width: (PW - 60) / 2, weight: 700 }} />
      <Btn label={t('Konto', 'Account')} x={36 + (PW - 60) / 2} y={y + 12} h={48} v="outline" o={{ icon: 'user', width: (PW - 60) / 2, weight: 700 }} />
      <T x={24} y={y + 92} s={12} c={L.mutedFg}>
        © 2026 Hurtownia Demo
      </T>
    </g>
  )
}

/** Фильтры — лист снизу. top — где верх листа (pt). */
export const FILTER_SHEET_TOP = 150
export function PhoneFilters() {
  const t = FILTER_SHEET_TOP
  const tr = useT()
  const cats: [string, number][] = [
    [tr('Wszystkie produkty', 'All products'), 36],
    [tr('Kartony', 'Boxes'), 12],
    [tr('Taśmy', 'Tapes'), 8],
    [tr('Folie', 'Films'), 6],
    [tr('Wypełniacze', 'Void fill'), 5],
    [tr('Koperty', 'Envelopes'), 5],
  ]
  return (
    <g>
      <R x={0} y={t} w={PW} h={PH - t + 40} r={32} fill={L.card} />
      <R x={PW / 2 - 20} y={t + 8} w={40} h={5} r={2.5} fill="rgba(7,6,7,0.18)" />
      <T x={24} y={t + 44} s={16} w={650} ls={0.6}>
        {tr('FILTRY', 'FILTERS')}
      </T>
      <G n="x" x={PW - 48} y={t + 28} s={22} />
      <T x={24} y={t + 88} s={12} w={650} c={L.mutedFg} ls={0.5}>
        {tr('KATEGORIE', 'CATEGORIES')}
      </T>
      {cats.map(([name, count], index) => {
        const y = t + 100 + index * 44
        return (
          <g key={name}>
            {index === 0 && <R x={16} y={y} w={PW - 32} h={40} r={14} fill={L.primary} />}
            <T x={30} y={y + 26} s={15} w={index === 0 ? 650 : 400} c={index === 0 ? '#ffffff' : L.fg}>
              {name}
            </T>
            <T x={PW - 30} y={y + 26} s={12} c={index === 0 ? 'rgba(255,255,255,0.8)' : L.mutedFg} a="end">
              {count}
            </T>
          </g>
        )
      })}
      <T x={24} y={t + 390} s={12} w={650} c={L.mutedFg} ls={0.5}>
        {tr('CENA', 'PRICE')}
      </T>
      <R x={16} y={t + 402} w={(PW - 44) / 2} h={40} r={14} fill={L.card} />
      <R x={16} y={t + 402} w={(PW - 44) / 2} h={40} r={14} stroke={L.border} />
      <T x={30} y={t + 427} s={14} c={L.mutedFg}>
        {tr('Od 1', 'Min 1')}
      </T>
      <R x={28 + (PW - 44) / 2} y={t + 402} w={(PW - 44) / 2} h={40} r={14} fill={L.card} />
      <R x={28 + (PW - 44) / 2} y={t + 402} w={(PW - 44) / 2} h={40} r={14} stroke={L.border} />
      <T x={42 + (PW - 44) / 2} y={t + 427} s={14} c={L.mutedFg}>
        {tr('Do 32', 'Max 32')}
      </T>
      {[tr('Tylko dostępne', 'In stock only'), tr('Tylko bestsellery', 'Bestsellers only')].map((name, index) => {
        const y = t + 462 + index * 36
        return (
          <g key={name}>
            <R x={20} y={y} w={18} h={18} r={5} fill={index === 0 ? L.primary : L.muted} />
            {index === 0 && <G n="check" x={22} y={y + 2} s={14} c="#ffffff" sw={3} />}
            <T x={48} y={y + 14} s={15}>
              {name}
            </T>
          </g>
        )
      })}
      <Btn label={tr('Pokaż produkty (36)', 'Show products (36)')} x={20} y={PH - 132} h={50} v="primary" o={{ width: PW - 40, size: 15 }} />
    </g>
  )
}

/** Товар в телефоне: картон, три ячейки цен, 50 шт., «Dodaj — 427,00 zł». */
export function PhoneProduct() {
  const t = useT()
  const cells: [string, string, string, string, string][] = [
    [t('CENA BAZOWA B2B', 'B2B BASE PRICE'), t('(NETTO / VAT 23%)', '(NET / VAT 23%)'), zl(8.54), L.primary, 'rgba(250,79,0,0.07)'],
    [t('SUGEROWANA CENA DETALICZNA', 'SUGGESTED RETAIL PRICE'), t('(BRUTTO)', '(GROSS)'), zl(CARTON.retail), L.blue, L.blueSoft],
    [t('Twój zarobek', 'Your earnings'), t('(POTENCJALNY)', '(POTENTIAL)'), zl(303), L.emerald, 'rgba(16,185,129,0.08)'],
  ]
  return (
    <g>
      <rect x={0} y={0} width={PW} height={PH} fill={L.page} />
      <PhoneHeader />
      <Btn label={t('Wstecz', 'Back')} x={12} y={TOP + 64} h={34} v="ghost" o={{ icon: 'arrowLeft', size: 13 }} />
      <BoxPicture x={20} y={TOP + 104} w={PW - 40} h={250} r={24} />
      <T x={20} y={TOP + 386} s={21} w={700}>
        {t('Karton klapowy 600×400×400', 'Shipping box 600×400×400')}
      </T>
      <T x={20} y={TOP + 412} s={21} w={700}>
        {t('mm 5-warstwowy', 'mm 5-ply')}
      </T>
      {cells.map(([name, note, value, color, bg], index) => {
        const y = TOP + 430 + index * 66
        return (
          <g key={name}>
            <R x={20} y={y} w={PW - 40} h={58} r={16} fill={bg} />
            <R x={20} y={y} w={PW - 40} h={58} r={16} stroke={`${color}66`} />
            <T x={34} y={y + 24} s={13} w={700}>
              {name}
            </T>
            <T x={34} y={y + 42} s={10} c={L.mutedFg}>
              {note}
            </T>
            <T x={PW - 34} y={y + 36} s={17} w={700} c={color} a="end">
              {value}
            </T>
          </g>
        )
      })}
      <R x={20} y={TOP + 640} w={120} h={44} r={22} fill={L.card} />
      <R x={20} y={TOP + 640} w={120} h={44} r={22} stroke={L.border} />
      <G n="minus" x={32} y={TOP + 654} s={16} />
      <T x={80} y={TOP + 668} s={16} w={650} a="middle">
        50
      </T>
      <G n="plus" x={112} y={TOP + 654} s={16} />
      <Btn label={`${t('Dodaj', 'Add')} — ${zl(427)}`} x={150} y={TOP + 640} h={44} v="primary" o={{ width: PW - 170, icon: 'shoppingCart', size: 14 }} />
    </g>
  )
}

/** «Kasa» w telefonie: B2B, dostawa, płatność; внизу липкая панель «Razem» и
    «Złóż zamówienie» с замком. breathe — пульс кнопки (0…1). */
export function PhoneCheckout({ breathe = 0 }: { breathe?: number }) {
  const card = (y: number, h: number) => (
    <g>
      <R x={16} y={y} w={PW - 32} h={h} r={14} fill={L.card} />
      <R x={16} y={y} w={PW - 32} h={h} r={14} stroke={L.border} />
    </g>
  )
  const k = clamp01(breathe)
  const button = { x: 16, y: PH - 132, w: PW - 32, h: 50 }
  const t = useT()
  const label = t('Złóż zamówienie', 'Place Order')
  const lw = tw(label, 16, 500) + 26
  return (
    <g>
      <rect x={0} y={0} width={PW} height={PH} fill={L.page} />
      <PhoneHeader />
      <T x={20} y={TOP + 104} s={30} w={700}>
        {t('Kasa', 'Checkout')}
      </T>
      {card(TOP + 124, 90)}
      <R x={36} y={TOP + 146} w={18} h={18} r={6} fill={L.primary} />
      <G n="check" x={38} y={TOP + 148} s={14} c="#ffffff" sw={3} />
      <T x={66} y={TOP + 160} s={14} w={550}>
        {t('Zamawiam jako firma (B2B)', "I'm ordering for a company (B2B)")}
      </T>
      <T x={36} y={TOP + 192} s={13} c={L.mutedFg}>
        {`NIP ${NIP} ·`}
      </T>
      <Mask x={36 + tw(`NIP ${NIP} ·`, 13, 400) + 8} y={TOP + 181} w={110} h={12} />
      {card(TOP + 226, 110)}
      <G n="truck" x={36} y={TOP + 244} s={18} c={L.primary} />
      <T x={62} y={TOP + 258} s={15} w={650}>
        {t('Sposób dostawy', 'Delivery method')}
      </T>
      <R x={32} y={TOP + 272} w={PW - 64} h={50} r={12} fill="rgba(250,79,0,0.05)" />
      <R x={32} y={TOP + 272} w={PW - 64} h={50} r={12} stroke={L.primary} sw={1.4} />
      <T x={48} y={TOP + 302} s={13} w={550}>
        InPost Kurier Standard
      </T>
      <T x={PW - 48} y={TOP + 302} s={13} w={650} a="end">
        12,90 zł
      </T>
      {card(TOP + 348, 110)}
      <G n="creditCard" x={36} y={TOP + 366} s={18} c={L.primary} />
      <T x={62} y={TOP + 380} s={15} w={650}>
        {t('Sposób płatności', 'Payment method')}
      </T>
      <R x={32} y={TOP + 394} w={PW - 64} h={50} r={16} fill="rgba(250,79,0,0.1)" />
      <T x={48} y={TOP + 416} s={13} w={550}>
        {t('Kredyt kupiecki', 'Trade credit')}
      </T>
      <T x={48} y={TOP + 434} s={11} c={L.mutedFg}>
        {t('Zapłać w ciągu 30 dni.', 'Pay within 30 days.')}
      </T>
      <rect x={0} y={PH - 190} width={PW} height={132} fill="rgba(255,255,255,0.97)" />
      <rect x={0} y={PH - 190} width={PW} height={1} fill={L.border} />
      <T x={16} y={PH - 158} s={14} c={L.mutedFg}>
        {t('Razem', 'Total')}
      </T>
      <T x={PW - 16} y={PH - 156} s={18} w={700} c={L.primary} a="end">
        {zl(ORDER.gross)}
      </T>
      <g transform={`translate(${PW / 2} ${button.y + button.h / 2}) scale(${1 + 0.035 * k}) translate(${-PW / 2} ${-(button.y + button.h / 2)})`}>
        <R x={button.x - 6 * k} y={button.y - 6 * k} w={button.w + 12 * k} h={button.h + 12 * k} r={(button.h + 12 * k) / 2} fill={`rgba(250,79,0,${0.16 * k})`} />
        <R x={button.x} y={button.y} w={button.w} h={button.h} r={button.h / 2} fill={L.primary} />
        <G n="lock" x={(PW - lw) / 2} y={button.y + 15} s={17} c="#ffffff" />
        <T x={(PW - lw) / 2 + 26} y={button.y + 31} s={16} w={500} c="#ffffff">
          {label}
        </T>
      </g>
    </g>
  )
}

/* ── Бот продавца (станция 20) ─────────────────────────────────────────── */

export const CHAT_BG = '#eef0f4'

export function ChatHeader() {
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={PW} height={TOP + 60} fill="rgba(250,250,252,0.97)" />
      <rect x={0} y={TOP + 59} width={PW} height={1} fill={L.borderSoft} />
      <G n="arrowLeft" x={14} y={TOP + 18} s={22} c={L.primary} />
      <Dot cx={66} cy={TOP + 29} r={19} fill={L.primary} />
      <T x={66} y={TOP + 35} s={16} w={800} c="#ffffff" a="middle">
        H
      </T>
      <T x={94} y={TOP + 26} s={15} w={650}>
        {t('Powiadomienia sklepu', 'Store notifications')}
      </T>
      <T x={94} y={TOP + 45} s={12} c={L.mutedFg}>
        bot
      </T>
    </g>
  )
}

export interface BubbleLine {
  text: string
  bold?: boolean
  muted?: boolean
  /** Замаскированный кусок после текста (ширина, pt). */
  mask?: number
}

/** Пузырь бота с кнопками под ним; возвращает высоту через layout. */
export function bubbleHeight(lines: BubbleLine[], keys: string[][]) {
  return lines.length * 19 + 20 + (keys.length ? 4 + keys.length * 38 : 0)
}

export function Bubble({ x, y, w, lines, keys = [], pressed = -1, check = 0 }: { x: number; y: number; w: number; lines: BubbleLine[]; keys?: string[][]; pressed?: number; check?: number }) {
  const textH = lines.length * 19 + 20
  let index = 0
  return (
    <g>
      <R x={x} y={y} w={w} h={textH} r={18} fill="#ffffff" />
      {lines.map((line, i) => (
        <g key={i}>
          <T x={x + 14} y={y + 26 + i * 19} s={13} w={line.bold ? 700 : 400} c={line.muted ? L.mutedFg : L.fg}>
            {line.text}
          </T>
          {line.mask && <Mask x={x + 14 + tw(line.text, 13, line.bold ? 700 : 400) + 4} y={y + 16 + i * 19} w={line.mask} h={11} />}
        </g>
      ))}
      {keys.map((row, ri) => {
        const kw = (w - 4 * (row.length - 1)) / row.length
        const ky = y + textH + 4 + ri * 38
        return row.map((key, ki) => {
          const id = index++
          const on = id === pressed
          return (
            <g key={`${ri}-${ki}`}>
              <R x={x + ki * (kw + 4)} y={ky} w={kw} h={34} r={10} fill={on ? `rgba(16,185,129,${0.12 + 0.1 * check})` : 'rgba(255,255,255,0.7)'} />
              <R x={x + ki * (kw + 4)} y={ky} w={kw} h={34} r={10} stroke={on ? L.emeraldLine : 'rgba(7,6,7,0.08)'} />
              <T x={x + ki * (kw + 4) + kw / 2} y={ky + 22} s={13} w={550} a="middle">
                {key}
              </T>
              {on && check > 0 && <G n="check" x={x + ki * (kw + 4) + kw - 26} y={ky + 9} s={16} c={L.emerald} sw={2.6} p={check} />}
            </g>
          )
        })
      })}
    </g>
  )
}

/** Исходящее сообщение (номер посылки). */
export function OutBubble({ x, y, w, text }: { x: number; y: number; w: number; text: string }) {
  return (
    <g>
      <R x={x} y={y} w={w} h={40} r={18} fill="#fde3d6" />
      <T x={x + w - 14} y={y + 26} s={13} w={500} a="end">
        {text}
      </T>
    </g>
  )
}

/** Поле ввода внизу чата: пусто — «Wiadomość», иначе печатается номер. */
export function ChatInput({ value, caret }: { value: string; caret: boolean }) {
  const x = 12
  const y = PH - 108
  const w = PW - 24
  const h = 44
  const width = value ? tw(value, 15, 400) : 0
  const t = useT()
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={22} fill="#ffffff" />
      <R x={x} y={y} w={w} h={h} r={22} stroke={value ? L.primaryLine : L.borderSoft} />
      {value ? (
        <T x={x + 18} y={y + 27} s={15}>
          {value}
        </T>
      ) : (
        <T x={x + 18} y={y + 27} s={15} c={L.mutedFg}>
          {t('Wiadomość', 'Message')}
        </T>
      )}
      {caret && <rect x={x + 20 + width} y={y + 13} width={2} height={18} rx={1} fill={L.primary} />}
      <G n="send" x={x + w - 38} y={y + 12} s={20} c={value ? L.primary : L.mutedFg} />
    </g>
  )
}
