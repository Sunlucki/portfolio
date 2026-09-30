import type { ReactNode } from 'react'
import { useLang, useT } from '../../kit/lang'
import { clamp01 } from '../../kit/motion'
import { CARTON, TIERS, YOUR_PRICE, goodName, marginOf, percent, unitPrice, zl, type Good } from '../data'
import type { GlyphName } from '../glyphs'
import { Brand, Btn, Dot, G, L, P, R, SCREEN, T, Tag, brandWidth, tagWidth, tw, wrap } from '../twin'

/* Витрина движка (Layout → .site-shell): шапка со знаком и меню, «Sklep»
   списком с тремя колонками цен, страница товара с ячейками цен, порогами и
   количеством, окно 18+. Светлая палитра (twin.tsx), без неона: ячейки цен —
   тон цвета и кромка. Раскладка и надписи — художника (siteHeader, SHOP,
   shopRow, PRODUCT, priceCell, drawTiers, ageGateModal). */

const W = SCREEN.w

/* ── Шапка ─────────────────────────────────────────────────────────────── */

const LINKS_EN: Record<string, string> = { Sklep: 'Shop', 'O nas': 'About Us', Kontakt: 'Contact' }

export function SiteHeader({ pad = 40, cart = 4, active = 'Sklep' }: { pad?: number; cart?: number; active?: string }) {
  const lang = useLang()
  let x = pad + brandWidth(14) + 22
  const divider = x
  x += 22
  const links = ['Sklep', 'O nas', 'Kontakt'].map((name) => {
    const label = lang === 'en' ? LINKS_EN[name]! : name
    const el = (
      <T key={name} x={x} y={38} s={15} w={700} c={name === active ? L.primary : L.fg} ls={0.3}>
        {label}
      </T>
    )
    x += tw(label, 15, 700, 0.3) + 28
    return el
  })
  const icons: GlyphName[] = ['search', 'heart', 'user', 'shoppingCart']
  return (
    <g>
      <rect x={0} y={0} width={W} height={64} fill="rgba(255,255,255,0.86)" />
      <rect x={0} y={63} width={W} height={1} fill={L.border} />
      <Brand x={pad} y={39} s={14} first={L.primary} second={L.primary} />
      <line x1={divider} y1={22} x2={divider} y2={42} stroke="rgba(7,6,7,0.3)" strokeDasharray="2 3" />
      {links}
      {icons.map((name, index) => (
        <G key={name} n={name} x={W - pad - 20 - (icons.length - 1 - index) * 40} y={22} s={20} c={L.fg} />
      ))}
      {cart > 0 && (
        <g>
          <Dot cx={W - pad - 2} cy={22} r={8} fill={L.primary} />
          <T x={W - pad - 2} y={25.5} s={9} w={700} c="#ffffff" a="middle">
            {cart}
          </T>
        </g>
      )}
    </g>
  )
}

/* ── Рисунки товаров ───────────────────────────────────────────────────── */

/** Картон: плоский рисунок коробки (как boxPicture художника). */
export function BoxPicture({ x, y, w, h, bg = '#f1efe9', r }: { x: number; y: number; w: number; h: number; bg?: string; r?: number }) {
  const s = Math.min(w, h)
  const cx = x + w / 2
  const cy = y + h / 2 + s * 0.04
  const bw = s * 0.62
  const bh = s * 0.36
  const top = s * 0.14
  const lx = cx - bw / 2
  const ty = cy - bh / 2
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={r ?? s * 0.18} fill={bg} />
      <ellipse cx={cx + top * 0.4} cy={cy + bh / 2 + s * 0.04} rx={bw * 0.62} ry={s * 0.035} fill="rgba(7,6,7,0.08)" />
      <path d={`M ${lx} ${ty} L ${lx + top} ${ty - top * 0.8} L ${lx + bw + top} ${ty - top * 0.8} L ${lx + bw} ${ty} Z`} fill="#c29260" />
      <rect x={lx} y={ty} width={bw} height={bh} rx={s * 0.02} fill="#b1834f" />
      <path d={`M ${lx + bw} ${ty} L ${lx + bw + top} ${ty - top * 0.8} L ${lx + bw + top} ${ty + bh - top * 0.8} L ${lx + bw} ${ty + bh} Z`} fill="#8d6539" />
      <rect x={cx - s * 0.02} y={ty} width={s * 0.04} height={bh * 0.35} fill="rgba(222,190,140,0.95)" />
      <path d={`M ${cx - s * 0.02} ${ty} L ${cx - s * 0.02 + top} ${ty - top * 0.8} L ${cx + s * 0.02 + top} ${ty - top * 0.8} L ${cx + s * 0.02} ${ty} Z`} fill="rgba(222,190,140,0.95)" />
    </g>
  )
}

/** Миниатюра товара списка (goodsPicture художника). */
export function GoodsPicture({ kind, x, y, s }: { kind: Good['picture']; x: number; y: number; s: number }) {
  const cx = x + s / 2
  const cy = y + s / 2
  if (kind === 'box' || kind === 'smallBox') return <BoxPicture x={x} y={y} w={s} h={s} />
  return (
    <g>
      <R x={x} y={y} w={s} h={s} r={s * 0.18} fill="#f1efe9" />
      {kind === 'tape' && (
        <g>
          <circle cx={cx} cy={cy} r={s * 0.3} fill="#8f6a3d" />
          <circle cx={cx} cy={cy} r={s * 0.13} fill="#f1efe9" />
          <circle cx={cx} cy={cy} r={s * 0.3} fill="none" stroke="#b88c55" strokeWidth={s * 0.05} />
        </g>
      )}
      {kind === 'film' && (
        <g>
          <rect x={cx - s * 0.16} y={cy - s * 0.3} width={s * 0.32} height={s * 0.6} rx={s * 0.08} fill="#d3dbe2" />
          <rect x={cx - s * 0.05} y={cy - s * 0.36} width={s * 0.1} height={s * 0.72} rx={s * 0.04} fill="#7c8a96" />
        </g>
      )}
      {kind === 'filler' && (
        <g>
          <rect x={cx - s * 0.26} y={cy - s * 0.2} width={s * 0.52} height={s * 0.44} rx={s * 0.08} fill="#c8b08a" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={cx - s * 0.2 + i * s * 0.1} y={cy - s * 0.12} width={s * 0.06} height={s * 0.28} rx={s * 0.03} fill="#a88e66" />
          ))}
        </g>
      )}
    </g>
  )
}

/* ── «Sklep» списком (станция 09) ──────────────────────────────────────── */

export const SHOP = {
  banner: { x: 40, y: 82, w: 672, h: 44 },
  toolbar: { x: 40, y: 148, w: 944, h: 64 },
  sort: { x: 690, y: 160, w: 170, h: 40 },
  list: { x: 40, y: 232, w: 944, h: 460 },
  row: (slot: number) => ({ x: 48, y: 276 + slot * 92, w: 928, h: 88 }),
}

export const COLS = { product: 16, b2b: 302, retail: 443, earn: 589, qty: 760 }

/** Баннер оптовых цен. */
export function ShopBanner() {
  const { x, y, w, h } = SHOP.banner
  const chip = tw('-12%', 14, 600) + 24
  const t = useT()
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={16} fill={L.primary} />
      <T x={x + 16} y={y + 27} s={14} w={500} c="#ffffff">
        {t('Dynamiczne ceny B2B są aktywne dla Twojego konta.', 'B2B dynamic pricing is active for your account.')}
      </T>
      <R x={x + w - 16 - chip} y={y + 9} w={chip} h={26} r={13} fill="#ffffff" />
      <T x={x + w - 16 - chip / 2} y={y + 27} s={14} w={600} c={L.fg} a="middle">
        -12%
      </T>
    </g>
  )
}

/** Пилюля сортировки: оранжевая, «Polecane» или «Marża ↓». */
export function SortPill({ value }: { value: string }) {
  const { x, y, w, h } = SHOP.sort
  const lang = useLang()
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={h / 2} fill={L.brand} />
      <G n="arrowUpDown" x={x + 14} y={y + (h - 16) / 2} s={16} c="rgba(255,255,255,0.9)" />
      <T x={x + 40} y={y + h / 2 + 5} s={14} w={600} c="#ffffff">
        {sortName(value, lang)}
      </T>
      <G n="chevronDown" x={x + w - 30} y={y + (h - 16) / 2} s={16} c="rgba(255,255,255,0.9)" />
    </g>
  )
}

/** Страница «Sklep» без строк товаров (они — отдельные листы). */
export function ShopPage({ sort, banner }: { sort: string; banner?: ReactNode }) {
  const t = SHOP.toolbar
  const l = SHOP.list
  const tr = useT()
  const heads: [string, number][] = [
    [tr('Produkt', 'Product'), COLS.product],
    [tr('Cena bazowa B2B (netto)', 'B2B base price (net)'), COLS.b2b],
    [tr('Sugerowana cena detaliczna', 'Suggested retail price'), COLS.retail],
    [tr('Twój potencjalny zarobek', 'Your potential earnings'), COLS.earn],
  ]
  return (
    <g>
      <rect x={0} y={0} width={W} height={SCREEN.h} fill={L.page} />
      <SiteHeader />
      {banner ?? <ShopBanner />}
      <R x={t.x} y={t.y} w={t.w} h={t.h} r={16} fill={L.card} />
      <R x={t.x} y={t.y} w={t.w} h={t.h} r={16} stroke={L.borderSoft} />
      <Btn label={tr('Pokaż filtry', 'Show filters')} x={t.x + 12} y={t.y + 12} h={40} v="secondary" o={{ icon: 'panelLeft' }} />
      <T x={t.x + 160} y={t.y + 37} s={14} c={L.mutedFg}>
        {tr('Znaleziono 36 produktów', 'Found 36 products')}
      </T>
      <Tag label={tr('Twoje zniżki', 'Your discounts')} x={t.x + 400} y={t.y + 12} o={{ color: L.fg, bg: L.muted, size: 14, h: 40, px: 16, icon: 'tag' }} />
      <SortPill value={sort} />
      <R x={t.x + t.w - 132} y={t.y + 10} w={120} h={44} r={22} fill={L.muted} />
      {(['layoutList', 'layoutGrid', 'package'] as const).map((name, index) => {
        const cx = t.x + t.w - 128 + index * 38
        return (
          <g key={name}>
            {index === 0 && <R x={cx} y={t.y + 14} w={36} h={36} r={18} fill={L.fg} />}
            <G n={name} x={cx + 10} y={t.y + 24} s={16} c={index === 0 ? '#ffffff' : L.fg} />
          </g>
        )
      })}
      <R x={l.x} y={l.y} w={l.w} h={l.h} r={28} fill={L.card} />
      <R x={l.x} y={l.y} w={l.w} h={l.h} r={28} stroke={L.borderSoft} />
      <R x={l.x + 8} y={l.y + 8} w={l.w - 16} h={40} r={16} fill={L.muted} />
      {heads.map(([name, x]) => {
        const lines = wrap(name.toUpperCase(), 11, 600, x === COLS.product ? 260 : 125)
        return lines.map((line, index) => (
          <T key={`${name}${index}`} x={l.x + 8 + x} y={l.y + 31 + index * 12 - (lines.length - 1) * 6} s={11} w={600} c={L.mutedFg} ls={0.2}>
            {line}
          </T>
        ))
      })}
      <T x={l.x + 8 + 912} y={l.y + 32} s={11} w={600} c={L.mutedFg} a="end" ls={0.2}>
        {tr('ILOŚĆ / KOSZYK', 'QUANTITY / CART')}
      </T>
    </g>
  )
}

/** Строка товара (grid продукта, режим «list») — в координатах строки. */
export function ShopRow({ good, lit = 0 }: { good: Good; lit?: number }) {
  const { w, h } = SHOP.row(0)
  const lang = useLang()
  const t = useT()
  const lines = wrap(goodName(good.name, lang), 14, 600, 185)
  const earnings = Math.round((good.retail - good.net) * 100) / 100
  const qx = COLS.qty
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      {lit > 0 && <R x={0} y={0} w={w} h={h} r={16} fill={`rgba(250,79,0,${0.06 * lit})`} />}
      <GoodsPicture kind={good.picture} x={COLS.product} y={12} s={64} />
      {lines.slice(0, 2).map((line, index) => (
        <T key={index} x={COLS.product + 76} y={38 + index * 20 + (lines.length > 1 ? 0 : 10)} s={14} w={600}>
          {line}
        </T>
      ))}
      <T x={COLS.b2b} y={50} s={16} w={700} c={L.primary}>
        {zl(good.net)}
      </T>
      <T x={COLS.retail} y={50} s={14} w={600}>
        {zl(good.retail)}
      </T>
      <T x={COLS.earn} y={42} s={14} w={650} c={L.emeraldText}>
        {zl(earnings)}
      </T>
      <T x={COLS.earn} y={64} s={12} c={L.mutedFg}>
        {`${t('Marża', 'Margin')}: ${percent(marginOf(good.net, good.retail))}`}
      </T>
      <R x={qx} y={26} w={108} h={36} r={18} fill={L.card} />
      <R x={qx} y={26} w={108} h={36} r={18} stroke={L.border} />
      <G n="minus" x={qx + 12} y={37} s={14} />
      <T x={qx + 54} y={49} s={14} w={600} a="middle">
        1
      </T>
      <G n="plus" x={qx + 82} y={37} s={14} />
      <Dot cx={qx + 134} cy={44} r={18} fill={L.primary} />
      <G n="shoppingCart" x={qx + 125} y={35} s={18} c="#ffffff" />
    </g>
  )
}

export const SORT_OPTIONS = ['Polecane', 'Najnowsze', 'Popularność', 'Cena ↑', 'Cena ↓', 'Marża ↓', 'Marża ↑', 'Zarobek ↓']
/** Сортировка по-английски (FILTER_COPY.en витрины движка). */
const SORT_OPTIONS_EN = ['Featured', 'Newest', 'Popularity', 'Price ↑', 'Price ↓', 'Margin ↓', 'Margin ↑', 'Earnings ↓']
const sortName = (value: string, lang: 'pl' | 'en') => (lang === 'en' ? (SORT_OPTIONS_EN[SORT_OPTIONS.indexOf(value)] ?? value) : value)
export const SORT_MENU = { w: 200, h: 12 + SORT_OPTIONS.length * 36 }

/** Список сортировки (выпадает под пилюлей). hover — какая строка подсвечена. */
export function SortMenu({ hover = -1, picked = -1 }: { hover?: number; picked?: number }) {
  const { w, h } = SORT_MENU
  const lang = useLang()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={L.border} />
      {SORT_OPTIONS.map((name, index) => {
        const y = 6 + index * 36
        const on = index === picked
        const hot = index === hover
        return (
          <g key={name}>
            {(on || hot) && <R x={6} y={y} w={w - 12} h={34} r={12} fill={on ? 'rgba(250,79,0,0.14)' : L.muted} />}
            <T x={18} y={y + 22} s={14} w={on ? 600 : 400} c={on ? L.primary : L.fg}>
              {sortName(name, lang)}
            </T>
            {on && <G n="check" x={w - 34} y={y + 9} s={16} c={L.primary} />}
          </g>
        )
      })}
    </g>
  )
}

/* ── Страница товара (станции 10–11) ───────────────────────────────────── */

export const PRODUCT = {
  image: { x: 32, y: 128, w: 456, h: 456 },
  cells: [0, 1, 2].map((index) => ({ x: 536 + index * 152, y: 214, w: 144, h: 110 })),
  chips: { x: 536, y: 336, w: 456, h: 28 },
  tiers: { x: 536, y: 376, w: 456, h: 160 },
  qty: { x: 536, y: 548, w: 128, h: 44 },
  add: { x: 676, y: 548, w: 260, h: 44 },
  like: { x: 944, y: 548, w: 48, h: 44 },
}

/** Каркас страницы товара: шапка, «Wstecz», фото картона, название, степпер. */
export function ProductBase() {
  const img = PRODUCT.image
  const t = useT()
  return (
    <g>
      <rect x={0} y={0} width={W} height={SCREEN.h} fill={L.page} />
      <SiteHeader pad={32} />
      <Btn label={t('Wstecz', 'Back')} x={24} y={78} h={34} v="ghost" o={{ icon: 'arrowLeft', size: 13 }} />
      <BoxPicture x={img.x} y={img.y} w={img.w} h={img.h} r={28} />
      <T x={536} y={160} s={27} w={700} ls={-0.4}>
        {t('Karton klapowy 600×400×400 mm', 'Shipping box 600×400×400 mm')}
      </T>
      <T x={536} y={194} s={27} w={700} ls={-0.4}>
        {t('5-warstwowy', '5-ply')}
      </T>
      <R x={PRODUCT.like.x} y={PRODUCT.like.y} w={48} h={44} r={22} fill={L.card} />
      <R x={PRODUCT.like.x} y={PRODUCT.like.y} w={48} h={44} r={22} stroke={L.border} />
      <G n="heart" x={PRODUCT.like.x + 14} y={PRODUCT.like.y + 12} s={20} />
    </g>
  )
}

export type CellKind = 'b2b' | 'retail' | 'yours' | 'earn'

const TONES = {
  b2b: { color: L.primary, bg: 'rgba(250,79,0,0.07)', line: 'rgba(250,79,0,0.45)' },
  retail: { color: L.blue, bg: L.blueSoft, line: L.blueLine },
  yours: { color: L.emerald, bg: 'rgba(16,185,129,0.08)', line: L.emeraldLine },
  earn: { color: L.emerald, bg: 'rgba(16,185,129,0.08)', line: L.emeraldLine },
}

/** Ячейка цены (neonPanel продукта без свечения): тон, кромка, значение цветом.
    Координаты — ячейки (144 × 110). qty — для заработка. */
export function PriceCell({ kind, qty = 1, yours = false, value }: { kind: CellKind; qty?: number; yours?: boolean; value?: ReactNode }) {
  const w = 144
  const h = 110
  const x = 12
  const tone = TONES[kind]
  const t = useT()
  if (kind === 'earn') {
    const purchase = yours ? YOUR_PRICE : unitPrice(qty)
    const earnings = Math.round((CARTON.retail - purchase) * qty * 100) / 100
    const margin = Math.round(((CARTON.retail - purchase) / CARTON.retail) * 10000) / 100
    const intensity = clamp01((qty - 1) / 50)
    const label = `${t('MARŻA', 'MARGIN')} ${percent(margin)}`
    return (
      <g>
        <R x={0} y={0} w={w} h={h} r={16} fill={`rgba(16,185,129,${0.07 + intensity * 0.12})`} />
        <R x={0} y={0} w={w} h={h} r={16} stroke={`rgba(16,185,129,${0.4 + intensity * 0.35})`} />
        <T x={x} y={28} s={14} w={700}>
          {t('Twój zarobek', 'Your earnings')}
        </T>
        <T x={x} y={46} s={11} c={L.mutedFg}>
          {t('(POTENCJALNY)', '(POTENTIAL)')}
        </T>
        {value ?? (
          <T x={x} y={76} s={17} w={650} c={L.emeraldText}>
            {zl(earnings)}
          </T>
        )}
        <Tag label={label} x={x - 1} y={84} o={{ color: L.emeraldText, bg: L.emeraldSoft, border: L.emeraldLine, size: 9.5, weight: 700, h: 18, px: 7, tracking: 0.4 }} />
      </g>
    )
  }
  if (kind === 'retail') {
    return (
      <g>
        <R x={0} y={0} w={w} h={h} r={16} fill={tone.bg} />
        <R x={0} y={0} w={w} h={h} r={16} stroke={tone.line} />
        <T x={x} y={28} s={13} w={700}>
          {t('SUGEROWANA', 'SUGGESTED')}
        </T>
        <T x={x} y={44} s={13} w={700}>
          {t('CENA DETALICZNA', 'RETAIL PRICE')}
        </T>
        <T x={x} y={63} s={11} c={L.mutedFg}>
          {t('(BRUTTO)', '(GROSS)')}
        </T>
        <T x={x} y={92} s={18} w={650} c={L.blue}>
          {zl(CARTON.retail)}
        </T>
      </g>
    )
  }
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={yours ? TONES.yours.bg : tone.bg} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={yours ? TONES.yours.line : tone.line} />
      <T x={x} y={28} s={14} w={700}>
        {t('CENA BAZOWA', 'B2B BASE')}
      </T>
      <T x={x} y={45} s={14} w={700}>
        {t('B2B', 'PRICE')}
      </T>
      <T x={x} y={63} s={11} c={L.mutedFg}>
        {t('(NETTO / VAT 23%)', '(NET / VAT 23%)')}
      </T>
      {yours ? (
        <g>
          <T x={x} y={78} s={11} c={L.mutedFg}>
            {zl(CARTON.net)}
          </T>
          <rect x={x} y={74} width={tw(zl(CARTON.net), 11, 400)} height={1} fill={L.mutedFg} />
          <T x={x} y={99} s={19} w={700} c={L.emerald}>
            {zl(YOUR_PRICE)}
          </T>
          <T x={x + tw(zl(YOUR_PRICE), 19, 700) + 6} y={98} s={8.5} w={650} c={L.emerald} ls={0.4}>
            {t('TWOJA CENA', 'YOUR PRICE')}
          </T>
        </g>
      ) : (
        value ?? (
          <T x={x} y={92} s={18} w={700} c={L.primary}>
            {zl(CARTON.net)}
          </T>
        )
      )}
    </g>
  )
}

/** Подпись чипа скидки за порог (shop.bulkTiersActive движка). У английской
    «Bulk discount applied: …» без «applied»: иначе чип наличия за ней не
    помещается в строку страницы. */
export const chipLabel = (tier: { from: number; percent: number }, t: (pl: string, en: string) => string) =>
  t(`Rabat ilościowy: −${tier.percent}% (od ${tier.from} szt.)`, `Bulk discount: −${tier.percent}% (from ${tier.from} pcs)`)

/** Ряд чипов под ценами: ступень ilościowa и наличие. */
export function Chips({ qty, show = 1 }: { qty: number; show?: number }) {
  const tier = [...TIERS].reverse().find((item) => qty >= item.from)
  const t = useT()
  let x = 0
  const parts: ReactNode[] = []
  if (tier) {
    const label = chipLabel(tier, t)
    const o = { color: L.emeraldText, bg: L.emeraldSoft, border: L.emeraldLine, size: 12, h: 26, icon: 'layers' as const }
    parts.push(
      <g key="tier" opacity={show}>
        <Tag label={label} x={0} y={0} o={o} />
        <T x={tagWidth(label, o) + 8} y={18} s={12} w={600} c={L.emeraldText}>
          {`${zl(CARTON.net)} → ${zl(unitPrice(qty))}`}
        </T>
      </g>,
    )
    x += tagWidth(label, o) + 8 + tw(`${zl(CARTON.net)} → ${zl(unitPrice(qty))}`, 12, 600) + 10
  }
  const stock = t('480 szt. dostępne', '480 in stock')
  parts.push(<Tag key="stock" label={stock} x={x} y={0} o={{ color: L.mutedFg, bg: L.muted, border: L.borderSoft, size: 12, h: 26, icon: 'package' }} />)
  return <g>{parts}</g>
}

/** Блок порогов: активная строка подсвечена (ring primary/40). glow — доля
    подсветки строки (0…1). */
export function Tiers({ qty, glow = 1 }: { qty: number; glow?: number }) {
  const { w, h } = PRODUCT.tiers
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill="rgba(250,79,0,0.05)" />
      <R x={0} y={0} w={w} h={h} r={16} stroke="rgba(250,79,0,0.22)" />
      <T x={16} y={26} s={14} w={650}>
        {t('Progi rabatowe ilościowe', 'Bulk discount tiers')}
      </T>
      <T x={w - 16} y={26} s={12} c={L.mutedFg} a="end">
        {t('Więcej w koszyku, niższa cena za sztukę.', 'Order more, pay less per unit.')}
      </T>
      <T x={16} y={46} s={12} w={500} c={L.mutedFg}>
        {t('Rabaty są liczone od kwoty netto.', 'Discounts are calculated from the net amount.')}
      </T>
      {TIERS.map((tier, index) => {
        const y = 60 + index * 32
        const next = TIERS[index + 1]
        const on = qty >= tier.from && (!next || qty < next.from)
        const k = on ? glow : 0
        return (
          <g key={tier.from}>
            <R x={12} y={y} w={w - 24} h={28} r={12} fill={on ? `rgba(250,79,0,${0.14 * k})` : L.card} />
            <R x={12} y={y} w={w - 24} h={28} r={12} stroke={on ? `rgba(250,79,0,${0.12 + 0.3 * k})` : L.borderSoft} />
            <T x={24} y={y + 19} s={14} w={on ? 650 : 400}>
              {t(`Od ${tier.from} szt. — ${tier.percent}% rabatu`, `From ${tier.from} pcs — ${tier.percent}% off`)}
            </T>
            <T x={w - 24} y={y + 19} s={14} w={on ? 650 : 400} a="end">
              {zl(unitPrice(tier.from))}
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** «Masz najlepszą cenę» вместо порогов (у своей цены клиента их нет). */
export function BestPrice() {
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={PRODUCT.tiers.w} h={56} r={16} fill="rgba(16,185,129,0.07)" />
      <R x={0} y={0} w={PRODUCT.tiers.w} h={56} r={16} stroke="rgba(16,185,129,0.3)" />
      <G n="badgeCheck" x={16} y={18} s={20} c={L.emerald} />
      <T x={46} y={34} s={14} w={650} c={L.emeraldText}>
        {t('Masz najlepszą cenę', 'You have the best price')}
      </T>
    </g>
  )
}

/** Степпер количества: значение qty. */
export function Stepper({ qty, press = [1, 1] }: { qty: ReactNode; press?: [number, number] }) {
  const q = PRODUCT.qty
  return (
    <g>
      <R x={q.x} y={q.y} w={q.w} h={q.h} r={q.h / 2} fill={L.card} />
      <R x={q.x} y={q.y} w={q.w} h={q.h} r={q.h / 2} stroke={L.border} />
      <g transform={`translate(${q.x + 20} ${q.y + 22}) scale(${press[0]}) translate(${-(q.x + 20)} ${-(q.y + 22)})`}>
        <G n="minus" x={q.x + 12} y={q.y + 14} s={16} />
      </g>
      <g transform={`translate(${q.x + q.w - 20} ${q.y + 22}) scale(${press[1]}) translate(${-(q.x + q.w - 20)} ${-(q.y + 22)})`}>
        <G n="plus" x={q.x + q.w - 28} y={q.y + 14} s={16} />
      </g>
      {qty}
    </g>
  )
}

/** Кнопка «Dodaj do koszyka — {kwota}». */
export function AddButton({ label }: { label: ReactNode }) {
  const a = PRODUCT.add
  return (
    <g>
      <R x={a.x} y={a.y} w={a.w} h={a.h} r={a.h / 2} fill={L.primary} />
      <G n="shoppingCart" x={a.x + 18} y={a.y + 12} s={20} c="#ffffff" />
      {label}
    </g>
  )
}

/** Сумма на кнопке для количества qty. */
export const addTotal = (qty: number, yours = false) => Math.round((yours ? YOUR_PRICE : unitPrice(qty)) * qty * 100) / 100

/* ── Окно 18+ (ProfessionalGateModal) ──────────────────────────────────── */

export const AGE = { w: 448, h: 470, yes: { x: 32, y: 294, w: 384, h: 42 } }

export function AgeGateModal({ press = 1 }: { press?: number }) {
  const { w, h } = AGE
  const y = AGE.yes
  const t = useT()
  const legal = t('Informacje prawne i pliki cookie', 'Legal notice and cookies')
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={40} fill={L.card} />
      <Dot cx={w / 2} cy={72} r={40} fill={L.primary} />
      <T x={w / 2} y={81} s={24} w={700} c="#ffffff" a="middle">
        18+
      </T>
      <T x={w / 2} y={158} s={22} w={650} a="middle">
        {t('Produkty z ograniczeniem wiekowym', 'Age-restricted products')}
      </T>
      <P x={w / 2} y={196} s={15} c={L.mutedFg} width={w - 64} lh={23} a="middle">
        {t('Ta strona zawiera produkty przeznaczone wyłącznie dla osób pełnoletnich, które ukończyły 18 lat.', 'This website contains products intended only for adults aged 18 and over.')}
      </P>
      <T x={w / 2} y={272} s={14} w={650} a="middle">
        {t('Czy masz ukończone 18 lat?', 'Are you at least 18 years old?')}
      </T>
      <g transform={`translate(${y.x + y.w / 2} ${y.y + y.h / 2}) scale(${press}) translate(${-(y.x + y.w / 2)} ${-(y.y + y.h / 2)})`}>
        <Btn label={t('Tak, mam co najmniej 18 lat', 'Yes, I am 18 or older')} x={y.x} y={y.y} h={y.h} v="primary" o={{ width: y.w }} />
      </g>
      <Btn label={t('Nie, opuść stronę', 'No, leave the website')} x={32} y={346} h={42} v="outline" o={{ width: w - 64 }} />
      <T x={w / 2 - 8} y={426} s={12} c="rgba(101,93,101,0.8)" a="middle">
        {legal}
      </T>
      <line x1={w / 2 - 8 - tw(legal, 12, 400) / 2} y1={431} x2={w / 2 - 8 + tw(legal, 12, 400) / 2} y2={431} stroke="rgba(101,93,101,0.5)" strokeDasharray="3 3" />
      <G n="chevronDown" x={w / 2 - 8 + tw(legal, 12, 400) / 2 + 4} y={416} s={14} c="rgba(101,93,101,0.7)" />
    </g>
  )
}

