import { useLang, useT } from '../../kit/lang'
import { clamp01 } from '../../kit/motion'
import { NIP, ORDER, QUICK_LINES, QUOTE_ROWS, goodName, pln, zl } from '../data'
import { Btn, Dot, G, Inp, L, Mask, P, R, Rule, SCREEN, T, buttonWidth, tw } from '../twin'
import { GoodsPicture, SiteHeader } from './Store'

/* Страницы покупателя B2B: «Wyceny» (QuotesPage), «Szybkie zamówienie»
   (QuickOrderPage), «Kasa» (CheckoutPage) и «Dziękujemy za zamówienie!».
   Светлая палитра, раскладка и надписи — по коду продукта и художнику. */

const W = SCREEN.w

/* ── Wyceny (станция 12) ───────────────────────────────────────────────── */

export const QUOTES = {
  card: { x: 64, y: 164, w: 896 },
  head: 76,
  cols: { item: 80, qty: 560, list: 680, quoted: 800, total: 944 },
}

export const QUOTE_NUMBER = 'Q-260928-4F2A9C'
export const QUOTE_TOTAL = 2268.12
export const QUOTE_ORDER = 'PD-260928-0014'

/** Шапка страницы «Wyceny»: значок, заголовок, подзаголовок. */
export function QuotesHeader() {
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={W} height={SCREEN.h + 400} fill={L.page} />
      <SiteHeader />
      <R x={64} y={96} w={44} h={44} r={10} fill={L.primarySoft} />
      <G n="fileText" x={76} y={108} s={20} c={L.primary} />
      <T x={120} y={116} s={24} w={650}>
        {t('Wyceny', 'Quotes')}
      </T>
      <T x={120} y={138} s={14} c={L.mutedFg}>
        {t('Wynegocjowane ceny dla Twoich zapytań.', 'Negotiated pricing on your requests.')}
      </T>
    </g>
  )
}

/** Карточка оферты: open — доля раскрытия (0…1), rows — сколько строк
    встало (дробное — строка встаёт), totals, savings — доли; accepted — статус
    «Zaakceptowana». form — доля формы «Gdzie mamy to wysłać?». */
export function QuoteCard({ open, rows, totals, savings, accepted = 0, form = 0, busy = false, pressAccept = 1, pressConfirm = 1 }: { open: number; rows: number; totals: number; savings: number; accepted?: number; form?: number; busy?: boolean; pressAccept?: number; pressConfirm?: number }) {
  const { x, y, w } = QUOTES.card
  const c = QUOTES.cols
  const bodyH = 340 + form * 186
  const h = QUOTES.head + bodyH * clamp01(open)
  const lang = useLang()
  const t = useT()
  const status = accepted > 0.5 ? t('Zaakceptowana', 'Accepted') : t('Gotowa do akceptacji', 'Ready to accept')
  const statusW = tw(status, 14, 500)
  const by = y + QUOTES.head
  const rowY = (i: number) => by + 16 + 36 + i * 37
  const totalsY = by + 16 + 36 + 2 * 37 + 20
  const buttonsY = totalsY + 110
  return (
    <g>
      <defs>
        <clipPath id="b2b-quote-clip">
          <rect x={x} y={y} width={w} height={h} rx={12} />
        </clipPath>
      </defs>
      <R x={x} y={y} w={w} h={h} r={12} fill={L.card} />
      <R x={x} y={y} w={w} h={h} r={12} stroke={L.border} />
      <T x={x + 16} y={y + 32} s={16} w={500}>
        {QUOTE_NUMBER}
      </T>
      <T x={x + 16} y={y + 56} s={14} w={500} c={accepted > 0.5 ? L.emerald : L.primary}>
        {status}
      </T>
      {accepted <= 0.5 && (
        <T x={x + 16 + statusW + 8} y={y + 56} s={14} c={L.mutedFg}>
          {t('· ważna do 2026-10-12', '· valid until 2026-10-12')}
        </T>
      )}
      <T x={x + w - 44} y={y + 44} s={16} w={650} a="end">
        {pln(QUOTE_TOTAL)}
      </T>
      <g transform={`rotate(${90 * clamp01(open)} ${x + w - 24} ${y + 38})`}>
        <G n="chevronRight" x={x + w - 32} y={y + 30} s={16} c={L.mutedFg} />
      </g>
      <g clipPath="url(#b2b-quote-clip)">
        <Rule x={x} y={by} w={w} />
        {[
          [t('Pozycja', 'Item'), c.item, 'start'],
          [t('Ilość', 'Qty'), c.qty, 'end'],
          [t('Katalogowa', 'List'), c.list, 'end'],
          [t('Wyceniona', 'Quoted'), c.quoted, 'end'],
          [t('Razem', 'Total'), c.total, 'end'],
        ].map(([name, cx, a]) => (
          <T key={name as string} x={cx as number} y={by + 16 + 22} s={14} w={500} c={L.mutedFg} a={a as 'start' | 'end'}>
            {name as string}
          </T>
        ))}
        <Rule x={x + 16} y={by + 16 + 36} w={w - 32} />
        {QUOTE_ROWS.map((row, i) => {
          const k = clamp01(rows - i)
          if (k <= 0) return null
          const ry = rowY(i)
          const name = goodName(i === 0 ? 'Karton klapowy 600×400×400 mm 5-warstwowy' : 'Taśma pakowa 48 mm × 66 m brązowa', lang)
          const list = row.list.toFixed(2)
          return (
            <g key={i} opacity={k} transform={`translate(${(1 - k) * -14} 0)`}>
              <T x={c.item} y={ry + 24} s={14}>
                {name}
              </T>
              <T x={c.qty} y={ry + 24} s={14} a="end">
                {row.qty}
              </T>
              <T x={c.list} y={ry + 24} s={14} c={L.mutedFg} a="end">
                {list}
              </T>
              <rect x={c.list - tw(list, 14, 400)} y={ry + 19} width={tw(list, 14, 400)} height={1} fill={L.mutedFg} />
              <T x={c.quoted} y={ry + 24} s={14} a="end">
                {row.quoted.toFixed(2)}
              </T>
              <T x={c.total} y={ry + 24} s={14} a="end">
                {(row.quoted * row.qty).toFixed(2)}
              </T>
              {i === 0 && <Rule x={x + 16} y={ry + 37} w={w - 32} c={L.borderSoft} />}
            </g>
          )
        })}
        <g opacity={totals}>
          {[
            [t('Suma częściowa', 'Subtotal'), pln(1844)],
            [t('Podatek (23%)', 'Tax (23%)'), pln(424.12)],
          ].map(([label, value], i) => (
            <g key={label}>
              <T x={c.total - 320} y={totalsY + i * 22} s={14} c={L.mutedFg}>
                {label}
              </T>
              <T x={c.total} y={totalsY + i * 22} s={14} a="end">
                {value}
              </T>
            </g>
          ))}
          <Rule x={c.total - 320} y={totalsY + 32} w={320} />
          <T x={c.total - 320} y={totalsY + 52} s={14} w={650} c={L.mutedFg}>
            {t('Razem', 'Total')}
          </T>
          <T x={c.total} y={totalsY + 52} s={14} w={650} a="end">
            {pln(QUOTE_TOTAL)}
          </T>
        </g>
        <g opacity={savings}>
          <T x={c.total - 320} y={totalsY + 76} s={12} w={500} c={L.emerald}>
            {t('Oszczędzasz 438.00 PLN względem ceny katalogowej.', 'You save 438.00 PLN against list price.')}
          </T>
        </g>
        <g opacity={totals}>
          <Rule x={x + 16} y={buttonsY} w={w - 32} />
          {form < 0.5 ? (
            <g>
              <g transform={`translate(${x + 16 + 50} ${buttonsY + 34}) scale(${pressAccept}) translate(${-(x + 16 + 50)} ${-(buttonsY + 34)})`}>
                <Btn label={t('Akceptuj', 'Accept')} x={x + 16} y={buttonsY + 16} h={36} v="primary" o={{ icon: 'check', size: 14, radius: 10 }} />
              </g>
              <Btn label={t('Odrzuć', 'Decline')} x={x + 16 + buttonWidth(t('Akceptuj', 'Accept'), { icon: 'check', size: 14 }) + 8} y={buttonsY + 16} h={36} v="outline" o={{ icon: 'x', size: 14, radius: 10 }} />
            </g>
          ) : (
            <g opacity={clamp01(form * 2 - 1)}>
              <T x={x + 16} y={buttonsY + 34} s={14} w={500}>
                {t('Gdzie mamy to wysłać?', 'Where should this ship?')}
              </T>
              {[0, 1, 2].map((r) =>
                [0, 1].map((col) => {
                  const fx = x + 16 + col * ((w - 44) / 2 + 12)
                  const fy = buttonsY + 48 + r * 46
                  const fw = (w - 44) / 2
                  const labels = [
                    [t('Imię i nazwisko odbiorcy', 'Recipient name'), t('Ulica i numer', 'Street address')],
                    [t('Miasto', 'City'), t('Kod pocztowy', 'Postal code')],
                    [t('Kraj (2 litery)', 'Country (2 letters)'), t('Telefon (opcjonalnie)', 'Phone (optional)')],
                  ]
                  const filled = r < 2 || col === 0
                  return (
                    <g key={`${r}-${col}`}>
                      <Inp x={fx} y={fy} w={fw} h={38} r={10} placeholder={filled ? '' : labels[r]![col]!} />
                      {filled && (r === 2 ? <T x={fx + 12} y={fy + 24} s={14}>PL</T> : r === 1 && col === 1 ? <T x={fx + 12} y={fy + 24} s={14}>60-001</T> : <Mask x={fx + 12} y={fy + 13} w={[140, 170, 110, 0][r * 2 + col] ?? 120} h={12} />)}
                    </g>
                  )
                }),
              )}
              <g transform={`translate(${x + 16 + 110} ${buttonsY + 48 + 3 * 46 + 18}) scale(${pressConfirm}) translate(${-(x + 16 + 110)} ${-(buttonsY + 48 + 3 * 46 + 18)})`}>
                <Btn label={busy ? t('Tworzenie zamówienia…', 'Creating order…') : `${t('Potwierdź', 'Confirm')} — ${pln(QUOTE_TOTAL)}`} x={x + 16} y={buttonsY + 48 + 3 * 46} h={36} v="primary" o={{ size: 14, radius: 10 }} />
              </g>
              <Btn label={t('Anuluj', 'Cancel')} x={x + 16 + 250} y={buttonsY + 48 + 3 * 46} h={36} v="ghost" o={{ size: 14, radius: 10 }} />
            </g>
          )}
        </g>
      </g>
    </g>
  )
}

/** Где на странице кнопки оферты (CSS px). */
export function quoteButtons() {
  const { x, y } = QUOTES.card
  const by = y + QUOTES.head
  const totalsY = by + 16 + 36 + 2 * 37 + 20
  const buttonsY = totalsY + 110
  return {
    accept: { x: x + 16, y: buttonsY + 16, w: 100, h: 36 },
    confirm: { x: x + 16, y: buttonsY + 48 + 3 * 46, w: 230, h: 36 },
    savings: { x: QUOTES.cols.total - 320, y: totalsY + 64, w: 300, h: 16 },
    totalsY,
    buttonsY,
  }
}

/* ── Szybkie zamówienie (станция 13) ───────────────────────────────────── */

/** Раскладка страницы при доле g роста строк SKU (1 → 4 после «Wczytaj
    wklejone wiersze»: applyPaste кладёт вставку в строки и сразу проверяет). */
export function quickLayout(g: number) {
  const rowsH = 40 + clamp01(g) * 144
  const addRow = 212 + rowsH + 12
  const border = addRow + 34 + 16
  const label = border + 28
  const paste = border + 42
  const load = paste + 96 + 12
  const cardH = load + 34 + 24 - 188
  const check = 188 + cardH + 20
  const result = check + 40 + 24
  return { rowsH, addRow, border, label, paste, load, cardH, check, result, resultH: 350, page: result + 350 + 40 }
}

export const QUICK_X = 88
export const QUICK_W = 848

/** Страница «Szybkie zamówienie» без кнопки проверки и «Wynik» (они живые).
    g — рост строк, filled — доля вставленного текста, cleared — поле очищено. */
export function QuickPage({ g = 0, filled = 0, cleared = 0, pressLoad = 1 }: { g?: number; filled?: number; cleared?: number; pressLoad?: number }) {
  const x = QUICK_X
  const q = quickLayout(g)
  const lines = QUICK_LINES.map((line) => `${line.sku},${line.qty}`)
  const loaded = g > 0
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={W} height={q.page + 400} fill={L.page} />
      <Btn label={t('Wstecz', 'Back')} x={x - 8} y={76} h={36} v="ghost" o={{ icon: 'arrowLeft' }} />
      <R x={x} y={124} w={44} h={44} r={10} fill={L.primarySoft} />
      <G n="clipboardList" x={x + 12} y={136} s={20} c={L.primary} />
      <T x={x + 56} y={144} s={24} w={650}>
        {t('Szybkie zamówienie', 'Quick order')}
      </T>
      <T x={x + 56} y={165} s={14} c={L.mutedFg}>
        {t('Wpisz kody SKU i ilości albo wklej dane z arkusza. Ceny są Twoje.', 'Enter SKUs and quantities, or paste a spreadsheet. Prices shown are yours.')}
      </T>
      <R x={x} y={188} w={QUICK_W} h={q.cardH} r={12} fill={L.card} />
      <R x={x} y={188} w={QUICK_W} h={q.cardH} r={12} stroke={L.border} />
      {QUICK_LINES.map((line, i) => {
        const k = i === 0 ? 1 : clamp01(g * 3 - (i - 1))
        if (k <= 0) return null
        const y = 212 + i * 48
        return (
          <g key={line.sku} opacity={k} transform={`translate(0 ${(1 - k) * -10})`}>
            <Inp x={x + 24} y={y} w={680} h={40} r={10} value={loaded ? line.sku : null} placeholder="SKU" />
            <Inp x={x + 712} y={y} w={112} h={40} r={10} value={loaded ? String(line.qty) : '1'} />
          </g>
        )
      })}
      <Btn label={t('Dodaj wiersz', 'Add row')} x={x + 24} y={q.addRow} h={34} v="outline" o={{ size: 13, radius: 10 }} />
      <Rule x={x + 24} y={q.border} w={800} />
      <T x={x + 24} y={q.label} s={14} w={500}>
        {t('Lub wklej z arkusza kalkulacyjnego', 'Or paste from a spreadsheet')}
      </T>
      <R x={x + 24} y={q.paste} w={800} h={96} r={10} fill={L.card} />
      <R x={x + 24} y={q.paste} w={800} h={96} r={10} stroke={filled > 0 && cleared < 1 ? L.primary : L.border} sw={filled > 0 && cleared < 1 ? 1.5 : 1} />
      {filled > 0 && cleared < 1
        ? lines.map((line, i) => (
            <g key={line} opacity={clamp01(filled * lines.length - i) * (1 - cleared)}>
              <T x={x + 36} y={q.paste + 22 + i * 20} s={13}>
                {line}
              </T>
            </g>
          ))
        : ['SKU-001,10', 'SKU-002,5'].map((line, i) => (
            <T key={line} x={x + 36} y={q.paste + 22 + i * 20} s={13} c={L.mutedFg}>
              {line}
            </T>
          ))}
      <g transform={`translate(${x + 24 + 110} ${q.load + 17}) scale(${pressLoad}) translate(${-(x + 24 + 110)} ${-(q.load + 17)})`}>
        <Btn label={t('Wczytaj wklejone wiersze', 'Load pasted rows')} x={x + 24} y={q.load} h={34} v="outline" o={{ icon: 'upload', size: 13, radius: 10 }} />
      </g>
    </g>
  )
}

/** Кнопка «Sprawdź dostępność i cenę» (в загрузке — «Sprawdzanie…»). */
export function CheckButton({ y, busy, spin = 0 }: { y: number; busy: boolean; spin?: number }) {
  const w = busy ? 150 : 214
  const x = QUICK_X
  const t = useT()
  return (
    <g>
      <R x={x} y={y} w={w} h={40} r={10} fill={L.primary} o={busy ? 0.6 : 1} />
      {busy && (
        <g transform={`rotate(${spin} ${x + 24} ${y + 20})`}>
          <circle cx={x + 24} cy={y + 20} r={7} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="30 14" strokeLinecap="round" />
        </g>
      )}
      <T x={x + (busy ? 40 : w / 2)} y={y + 25} s={14} w={500} c="#ffffff" a={busy ? 'start' : 'middle'}>
        {busy ? t('Sprawdzanie…', 'Checking…') : t('Sprawdź dostępność i cenę', 'Check availability & price')}
      </T>
    </g>
  )
}

/** Карточка «Wynik»: rows — сколько строк встало (дробное — встаёт). */
export function QuickResult({ y, rows, total, show = 1, pressAdd = 1 }: { y: number; rows: number; total: number; show?: number; pressAdd?: number }) {
  const x = QUICK_X
  const w = QUICK_W
  const cols = [x + 24, x + 160, x + 590, x + 690, x + 824]
  const add = quickAddRect(y)
  const lang = useLang()
  const t = useT()
  return (
    <g opacity={show} transform={`translate(0 ${(1 - show) * 16})`}>
      <R x={x} y={y} w={w} h={350} r={12} fill={L.card} />
      <R x={x} y={y} w={w} h={350} r={12} stroke={L.border} />
      <T x={x + 24} y={y + 44} s={16} w={650}>
        {t('Wynik', 'Result')}
      </T>
      {['SKU', t('Produkt', 'Product'), t('Ilość', 'Qty'), t('Cena jedn.', 'Unit'), t('Razem', 'Total')].map((name, index) => (
        <T key={name} x={cols[index]!} y={y + 84} s={13} w={500} c={L.mutedFg} a={index > 1 ? 'end' : 'start'}>
          {name}
        </T>
      ))}
      <Rule x={x + 24} y={y + 94} w={w - 48} />
      {QUICK_LINES.map((line, i) => {
        const k = clamp01(rows - i)
        if (k <= 0) return null
        const ry = y + 98 + i * 38
        return (
          <g key={line.sku} opacity={k} transform={`translate(${(1 - k) * -16} 0)`}>
            <T x={cols[0]!} y={ry + 23} s={12} w={500}>
              {line.sku}
            </T>
            <T x={cols[1]!} y={ry + 23} s={14}>
              {goodName(line.name, lang)}
            </T>
            <T x={cols[2]!} y={ry + 23} s={14} a="end">
              {line.qty}
            </T>
            <T x={cols[3]!} y={ry + 23} s={14} a="end">
              {line.unit.toFixed(2)}
            </T>
            <T x={cols[4]!} y={ry + 23} s={14} a="end">
              {(line.unit * line.qty).toFixed(2)}
            </T>
            <Rule x={x + 24} y={ry + 35} w={w - 48} c={L.borderSoft} />
          </g>
        )
      })}
      <g opacity={total}>
        <Rule x={x + 24} y={y + 268} w={w - 48} />
        <T x={x + 24} y={y + 296} s={14} c={L.mutedFg}>
          {t('Suma częściowa (bez podatku i dostawy)', 'Subtotal (excl. tax and shipping)')}
        </T>
        <T x={x + 24} y={y + 322} s={18} w={650}>
          916.00
        </T>
        <g transform={`translate(${add.x + add.w / 2} ${add.y + add.h / 2}) scale(${pressAdd}) translate(${-(add.x + add.w / 2)} ${-(add.y + add.h / 2)})`}>
          <Btn label={t('Dodaj wszystko do koszyka', 'Add all to cart')} x={add.x} y={add.y} h={add.h} v="primary" o={{ icon: 'shoppingCart', width: add.w, size: 14, radius: 10 }} />
        </g>
      </g>
    </g>
  )
}

export const quickAddRect = (y: number) => ({ x: QUICK_X + QUICK_W - 24 - 250, y: y + 286, w: 250, h: 40 })

/* ── Kasa (станция 14) ─────────────────────────────────────────────────── */

export const CHECKOUT = {
  page: 1100,
  b2b: { x: 32, y: 196, w: 620, h: 276 },
  checkbox: { x: 56, y: 222, w: 20, h: 20 },
  delivery: { x: 32, y: 494, w: 620, h: 210 },
  payment: { x: 32, y: 726, w: 620, h: 200 },
  credit: { x: 56, y: 792, w: 572, h: 76 },
  summary: { x: 684, y: 196, w: 308, h: 560 },
  place: { x: 708, y: 646, w: 260, h: 44 },
}

function Section({ rect, title, glyph }: { rect: { x: number; y: number; w: number; h: number }; title: string; glyph: 'truck' | 'creditCard' }) {
  return (
    <g>
      <R x={rect.x} y={rect.y} w={rect.w} h={rect.h} r={12} fill={L.card} />
      <R x={rect.x} y={rect.y} w={rect.w} h={rect.h} r={12} stroke={L.border} />
      <G n={glyph} x={rect.x + 24} y={rect.y + 24} s={20} c={L.primary} />
      <T x={rect.x + 54} y={rect.y + 41} s={18} w={650}>
        {title}
      </T>
    </g>
  )
}

/** Страница «Kasa» без галочки B2B, варианта «Kredyt kupiecki» и кнопки
    (они живые). company — доля раскрытия «Dane firmy». */
export function CheckoutPage({ company = 1 }: { company?: number }) {
  const b = CHECKOUT.b2b
  const d = CHECKOUT.delivery
  const p = CHECKOUT.payment
  const s = CHECKOUT.summary
  const lang = useLang()
  const t = useT()
  const field = (x: number, y: number, w: number, name: string, value: string | null, maskW = 0) => (
    <g>
      <T x={x} y={y} s={14} w={500}>
        {name}
      </T>
      <R x={x} y={y + 10} w={w} h={40} r={14} fill={L.card} />
      <R x={x} y={y + 10} w={w} h={40} r={14} stroke={L.border} />
      {value && (
        <T x={x + 12} y={y + 35} s={14}>
          {value}
        </T>
      )}
      {maskW > 0 && <Mask x={x + 12 + (value ? tw(value, 14, 400) + 8 : 0)} y={y + 23} w={maskW} h={13} />}
    </g>
  )
  const methods: [string, string, boolean][] = [
    ['InPost Paczkomat 24/7', '11,99 zł', false],
    ['InPost Kurier Standard', '12,90 zł', true],
  ]
  return (
    <g>
      <rect x={0} y={0} width={W} height={CHECKOUT.page} fill={L.page} />
      <SiteHeader pad={32} />
      <T x={32} y={124} s={36} w={700} ls={-0.5}>
        {t('Kasa', 'Checkout')}
      </T>
      <T x={32} y={158} s={14} c={L.mutedFg}>
        {t('Dane kontaktowe · Anna', 'Contact Information · Anna')}
      </T>
      <Mask x={lang === 'en' ? 32 + tw('Contact Information · Anna', 14, 400) + 8 : 200} y={147} w={120} h={13} />
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={12} fill={L.card} />
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={12} stroke={L.border} />
      <T x={b.x + 58} y={b.y + 42} s={15} w={550}>
        {t('Zamawiam jako firma (B2B)', "I'm ordering for a company (B2B)")}
      </T>
      <g opacity={company} transform={`translate(0 ${(1 - company) * -8})`}>
        <Rule x={b.x + 24} y={b.y + 70} w={b.w - 48} />
        <G n="building2" x={b.x + 24} y={b.y + 90} s={20} c={L.primary} />
        <T x={b.x + 54} y={b.y + 106} s={15} w={550}>
          {t('Dane firmy', 'Company Details')}
        </T>
        {field(b.x + 24, b.y + 140, 276, t('Nazwa firmy *', 'Company Name *'), null, 130)}
        {field(b.x + 320, b.y + 140, 276, t('NIP *', 'Tax ID / VAT *'), NIP)}
        {field(b.x + 24, b.y + 206, 572, t('Adres firmy *', 'Company Address *'), null, 200)}
      </g>
      <Section rect={d} title={t('Sposób dostawy', 'Delivery method')} glyph="truck" />
      <T x={d.x + 24} y={d.y + 78} s={13} c={L.mutedFg}>
        {t('Kraj dostawy: Polska · Wysyłamy wyłącznie na terenie Polski.', 'Delivery country: Poland · We currently ship within Poland only.')}
      </T>
      {methods.map(([name, price, on], index) => {
        const x = d.x + 24 + index * 294
        const y = d.y + 100
        return (
          <g key={name}>
            <R x={x} y={y} w={278} h={86} r={12} fill={on ? 'rgba(250,79,0,0.05)' : L.card} />
            <R x={x} y={y} w={278} h={86} r={12} stroke={on ? L.primary : L.border} sw={on ? 1.5 : 1} />
            <Dot cx={x + 24} cy={y + 28} r={8} fill={on ? L.primary : L.card} stroke={on ? L.primary : L.border} sw={1.5} />
            {on && <Dot cx={x + 24} cy={y + 28} r={3} fill="#ffffff" />}
            <T x={x + 44} y={y + 33} s={14} w={550}>
              {name}
            </T>
            <T x={x + 262} y={y + 33} s={14} w={650} a="end">
              {price}
            </T>
            <T x={x + 44} y={y + 58} s={12} c={L.mutedFg}>
              {t('Za darmo od 1500,00 zł', 'Free over 1500,00 zł')}
            </T>
          </g>
        )
      })}
      <Section rect={p} title={t('Sposób płatności', 'Payment method')} glyph="creditCard" />
      <Rule x={p.x + 24} y={p.y + 162} w={p.w - 48} />
      <T x={p.x + 24} y={p.y + 186} s={12} c={L.mutedFg}>
        {t('Płatności online w tym sklepie wyłączone dla kont B2B.', 'Online payments are turned off for B2B accounts in this shop.')}
      </T>
      <R x={s.x} y={s.y} w={s.w} h={s.h} r={12} fill={L.card} />
      <R x={s.x} y={s.y} w={s.w} h={s.h} r={12} stroke={L.border} />
      <T x={s.x + 24} y={s.y + 40} s={17} w={650}>
        {t('Podsumowanie zamówienia', 'Order Summary')}
      </T>
      {QUICK_LINES.map((line, index) => {
        const y = s.y + 64 + index * 44
        const name = goodName(line.name, lang)
        const cut = name.slice(0, 23)
        const short = name.length > 24 ? `${lang === 'en' ? cut.trimEnd() : cut}…` : name
        return (
          <g key={line.sku}>
            <GoodsPicture kind={(['box', 'tape', 'film', 'filler'] as const)[index]!} x={s.x + 24} y={y} s={36} />
            <T x={s.x + 70} y={y + 15} s={12} w={550}>
              {short}
            </T>
            <T x={s.x + 70} y={y + 31} s={11} c={L.mutedFg}>
              {`${t('Szt.', 'Qty')} ${line.qty}`}
            </T>
            <T x={s.x + s.w - 24} y={y + 22} s={12} w={550} a="end">
              {zl(line.unit * line.qty)}
            </T>
          </g>
        )
      })}
      {[
        [t('Suma częściowa', 'Subtotal'), zl(916)],
        [t('Wysyłka · InPost Kurier Standard', 'Shipping · InPost Kurier Standard'), zl(12.9)],
        ['VAT', zl(210.68)],
      ].map(([a, value], i) => (
        <g key={a}>
          <T x={s.x + 24} y={s.y + 262 + i * 24} s={13} c={L.mutedFg}>
            {a}
          </T>
          <T x={s.x + s.w - 24} y={s.y + 262 + i * 24} s={13} a="end">
            {value}
          </T>
        </g>
      ))}
      <Rule x={s.x + 24} y={s.y + 326} w={s.w - 48} />
      <T x={s.x + 24} y={s.y + 356} s={18} w={650}>
        {t('Razem', 'Total')}
      </T>
      <T x={s.x + s.w - 24} y={s.y + 356} s={18} w={700} c={L.primary} a="end">
        {zl(ORDER.gross)}
      </T>
      <R x={s.x + 24} y={s.y + 374} w={s.w - 48} h={66} r={16} fill="rgba(16,185,129,0.07)" />
      <R x={s.x + 24} y={s.y + 374} w={s.w - 48} h={66} r={16} stroke="rgba(16,185,129,0.28)" />
      <T x={s.x + 40} y={s.y + 398} s={12} w={650}>
        {t('Twój potencjalny zarobek', 'Your potential earnings')}
      </T>
      <T x={s.x + s.w - 40} y={s.y + 399} s={15} w={700} c={L.emerald} a="end">
        {zl(412.36)}
      </T>
      <T x={s.x + 40} y={s.y + 418} s={10.5} c={L.mutedFg}>
        {t('Przy sprzedaży w cenie detalicznej —', 'Selling at retail price —')}
      </T>
      <T x={s.x + 40} y={s.y + 432} s={10.5} c={L.mutedFg}>
        {t('marża 31%', '31% margin')}
      </T>
      <P x={s.x + s.w / 2} y={s.y + 522} s={11} c={L.mutedFg} width={s.w - 48} lh={15} a="middle">
        {t('Składając zamówienie, akceptujesz nasze Warunki korzystania z usługi i Politykę prywatności.', 'By placing your order, you agree to our Terms of Service and Privacy Policy.')}
      </P>
    </g>
  )
}

/** Галочка «Zamawiam jako firma (B2B)» (м-галочка). */
export function B2BCheck({ p }: { p: number }) {
  const c = CHECKOUT.checkbox
  const on = p > 0
  return (
    <g>
      <R x={c.x} y={c.y} w={c.w} h={c.h} r={6} fill={on ? L.primary : L.card} />
      <R x={c.x} y={c.y} w={c.w} h={c.h} r={6} stroke={L.primary} sw={1.3} />
      {on && <path d={`M${c.x + c.w * 0.22} ${c.y + c.h * 0.52} L${c.x + c.w * 0.42} ${c.y + c.h * 0.72} L${c.x + c.w * 0.8} ${c.y + c.h * 0.3}`} fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(p)} />}
    </g>
  )
}

/** Вариант «Kredyt kupiecki» (в координатах варианта 572 × 76): выбран или
    посерел с «Przekroczony limit» (exceeded — доля). */
export function CreditOption({ exceeded = 0, selected = 1, limit }: { exceeded?: number; selected?: number; limit?: string }) {
  const w = CHECKOUT.credit.w
  const h = CHECKOUT.credit.h
  const k = clamp01(exceeded)
  const dim = 1 - 0.5 * k
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={k > 0.5 ? 'rgba(7,6,7,0.04)' : `rgba(250,79,0,${0.1 * selected})`} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={k > 0.5 ? L.border : `rgba(250,79,0,${0.5 * selected})`} />
      <g opacity={dim}>
        <Dot cx={24} cy={h / 2} r={8} fill={selected > 0.5 && k < 0.5 ? L.primary : L.card} stroke={selected > 0.5 && k < 0.5 ? L.primary : L.border} sw={1.5} />
        {selected > 0.5 && k < 0.5 && <Dot cx={24} cy={h / 2} r={3} fill="#ffffff" />}
        <T x={48} y={32} s={15} w={550}>
          {t('Kredyt kupiecki', 'Trade credit')}
        </T>
        <T x={48} y={54} s={13} c={L.mutedFg}>
          {`${t('Zapłać w ciągu 30 dni. Limit:', 'Pay within 30 days. Limit:')} ${limit ?? zl(ORDER.credit.limit)}`}
        </T>
      </g>
      {k > 0 && (
        <g opacity={k}>
          <T x={w - 20} y={h / 2 + 5} s={13} w={600} c={L.destructive} a="end">
            {t('Przekroczony limit', 'Limit exceeded')}
          </T>
        </g>
      )}
    </g>
  )
}

/** «Złóż zamówienie». */
export function PlaceOrder({ press = 1, busy = false }: { press?: number; busy?: boolean }) {
  const r = CHECKOUT.place
  const t = useT()
  return (
    <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${press}) translate(${-(r.x + r.w / 2)} ${-(r.y + r.h / 2)})`}>
      <R x={r.x} y={r.y} w={r.w} h={r.h} r={r.h / 2} fill={L.primary} />
      <T x={r.x + r.w / 2} y={r.y + r.h / 2 + 5} s={15} w={500} c="#ffffff" a="middle">
        {busy ? t('Przetwarzanie…', 'Processing…') : t('Złóż zamówienie', 'Place Order')}
      </T>
    </g>
  )
}

/** «Dziękujemy za zamówienie!» (OrderConfirmationPage). */
export function ThanksPage({ check = 1 }: { check?: number }) {
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={W} height={SCREEN.h} fill={L.page} />
      <SiteHeader />
      <Dot cx={W / 2} cy={190} r={44} fill="rgba(16,185,129,0.12)" />
      <G n="circleCheck" x={W / 2 - 24} y={166} s={48} c={L.emerald} sw={2} p={check} />
      <T x={W / 2} y={290} s={38} w={700} a="middle" ls={-0.6}>
        {t('Dziękujemy za zamówienie!', 'Thank You for Your Order!')}
      </T>
      <T x={W / 2} y={328} s={17} c={L.mutedFg} a="middle">
        {t('Twoje zamówienie zostało pomyślnie złożone.', 'Your order has been successfully placed.')}
      </T>
      <R x={312} y={360} w={400} h={120} r={16} fill={L.card} />
      <R x={312} y={360} w={400} h={120} r={16} stroke={L.border} />
      <T x={336} y={394} s={13} c={L.mutedFg}>
        {t('Numer zamówienia', 'Order Number')}
      </T>
      <T x={336} y={422} s={20} w={700}>
        {ORDER.number}
      </T>
      <T x={336} y={456} s={13} c={L.mutedFg}>
        {t('Płatność: Kredyt kupiecki · 30 dni', 'Payment: Trade credit · 30 days')}
      </T>
      <Btn label={t('Zobacz status zamówienia', 'View Order Status')} x={312} y={510} h={44} v="primary" o={{ width: 250 }} />
      <Btn label={t('Kontynuuj zakupy', 'Continue Shopping')} x={572} y={510} h={44} v="outline" o={{ width: 140 }} />
    </g>
  )
}

