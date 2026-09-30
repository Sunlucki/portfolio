import { useId, type ReactNode } from 'react'
import { useLang, useT } from '../../kit/lang'
import { clamp01, mix } from '../../kit/motion'
import { NIP, blStatusName, goodName, statusName } from '../data'
import type { GlyphName } from '../glyphs'
import { Brand, Btn, G, Inp, L, Mask, P, R, Rule, SCREEN, T, Tag, buttonWidth, tagWidth, tw } from '../twin'

/* Админка движка (src/components/admin/AdminLayout.tsx) в светлой палитре:
   боковое меню групп, Limestone-фон, белые карточки. Раскладка — художника
   (adminFrame, adminB2B, applicationCard). */

const W = SCREEN.w
const H = SCREEN.h
export const SIDEBAR = 256
export const MAIN = { x: SIDEBAR + 32, w: W - SIDEBAR - 64 }

const NAV: [string, [GlyphName, string][]][] = [
  ['Przegląd', [['layoutDashboard', 'Panel główny'], ['target', 'Priorytety'], ['chartColumn', 'Statystyki']]],
  ['Katalog', [['package', 'Produkty'], ['folderTree', 'Kategorie'], ['badgeCheck', 'Marki']]],
  ['Sprzedaż', [['shoppingCart', 'Zamówienia'], ['fileText', 'Faktury'], ['creditCard', 'Kredyty'], ['percent', 'Rabaty']]],
  ['CRM', [['userPlus', 'Leady'], ['kanban', 'Kanban'], ['messageCircle', 'Czaty'], ['calendar', 'Kalendarz']]],
  ['B2B i marketing', [['handshake', 'Kontrahenci B2B'], ['mail', 'Kampanie e-mail'], ['fileText', 'Szablony']]],
  ['System', [['users', 'Użytkownicy'], ['radio', 'Kanały sprzedaży'], ['settings', 'Integracje'], ['globe', 'Ustawienia strony'], ['key', 'Moje konto i klucze']]],
]

/** Меню по-английски (admin.layout и пункты меню движка, en.ts). */
const NAV_EN: Record<string, string> = {
  Przegląd: 'Overview',
  'Panel główny': 'Dashboard',
  Priorytety: 'Priorities',
  Statystyki: 'Statistics',
  Katalog: 'Catalog',
  Produkty: 'Products',
  Kategorie: 'Categories',
  Marki: 'Brands',
  Sprzedaż: 'Sales',
  Zamówienia: 'Orders',
  Faktury: 'Invoices',
  Kredyty: 'Credits',
  Rabaty: 'Discounts',
  Leady: 'Leads',
  Czaty: 'Chats',
  Kalendarz: 'Booked calls',
  'B2B i marketing': 'B2B & marketing',
  'Kontrahenci B2B': 'B2B resellers',
  'Kampanie e-mail': 'Email campaigns',
  Szablony: 'Templates',
  Użytkownicy: 'Users',
  'Kanały sprzedaży': 'Sales channels',
  Integracje: 'Integrations',
  'Ustawienia strony': 'Site Settings',
  'Moje konto i klucze': 'My account & keys',
}

/** Каркас админки: фон, боковое меню (видны группы groups), активный пункт. */
export function AdminFrame({ active, groups }: { active: string; groups: number[] }) {
  const lang = useLang()
  const t = useT()
  const nav = (name: string) => (lang === 'en' ? (NAV_EN[name] ?? name) : name)
  let y = 100
  const items: ReactNode[] = []
  for (const index of groups) {
    const [title, entries] = NAV[index]!
    items.push(
      <T key={`g${index}`} x={40} y={y + 12} s={11.5} w={600} c={L.mutedFg} up ls={0.6}>
        {nav(title)}
      </T>,
    )
    y += 22
    for (const [glyph, name] of entries) {
      const on = name === active
      items.push(
        <g key={name}>
          {on && <R x={24} y={y} w={SIDEBAR - 48} h={38} r={14} fill={L.primarySoft} />}
          <G n={glyph} x={40} y={y + 11} s={16} c={on ? L.primary : L.mutedFg} />
          <T x={68} y={y + 24} s={14} w={on ? 600 : 500} c={on ? L.primary : L.fg} o={on ? 1 : 0.78}>
            {nav(name)}
          </T>
        </g>,
      )
      y += 42
    }
    y += 18
    if (y > H - 60) break
  }
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={L.page} />
      <rect x={0} y={0} width={SIDEBAR} height={H} fill={L.sidebar} />
      <rect x={SIDEBAR} y={0} width={1} height={H} fill={L.border} />
      <Brand x={24} y={46} s={14} first={L.fg} second={L.primary} />
      <T x={24} y={68} s={12} c={L.mutedFg}>
        {t('Panel administracyjny', 'Admin Panel')}
      </T>
      <G n="panelLeft" x={SIDEBAR - 44} y={30} s={16} c={L.mutedFg} />
      {items}
    </g>
  )
}

/* ── Kontrahenci B2B: заявка и одобрение (станция 06) ──────────────────── */

export const APPLICATION = { x: MAIN.x, y: 156, w: MAIN.w, h: 222 }

export function B2BRequestsPage({ count = 1, slot = 1 }: { count?: number; slot?: number }) {
  const t = useT()
  const x = MAIN.x
  const heading = t('Wnioski o współpracę', 'Partnership applications')
  const title = tw(heading, 19, 700)
  let bx = x + 262
  const select = t('Zaznacz', 'Select')
  const zaznacz = buttonWidth(select, { icon: 'squareCheck' })
  const ry = APPLICATION.y + APPLICATION.h + 28
  return (
    <g>
      <AdminFrame active="Kontrahenci B2B" groups={[0, 2, 4, 5]} />
      <T x={x} y={52} s={19} w={700}>
        {heading}
      </T>
      {count > 0 && <Tag label={String(count)} x={x + title + 8} y={36} o={{ color: L.primary, bg: 'rgba(250,79,0,0.14)', size: 12, h: 20 }} />}
      <T x={x} y={76} s={14} c={L.mutedFg}>
        {t('Ręczna weryfikacja wniosków resellerów i kontrahentów.', 'Manual review for reseller/counterparty applications.')}
      </T>
      <Inp x={x} y={96} w={250} h={40} placeholder={t('Szukaj firmy, e-maila lub NIP (/ lub f)…', 'Search company, e-mail or VAT (/ or f)…')} s={13} px={32} />
      <G n="search" x={x + 11} y={109} s={14} c={L.mutedFg} />
      <Btn label={select} x={bx} y={96} h={40} v="outline" o={{ icon: 'squareCheck' }} />
      {(() => {
        bx += zaznacz + 8
        const sx = bx
        bx += 184
        return (
          <g>
            <R x={sx} y={96} w={176} h={40} r={14} fill={L.card} />
            <R x={sx} y={96} w={176} h={40} r={14} stroke={L.border} />
            <T x={sx + 12} y={121} s={13}>
              {t('Oczekuje na decyzję', 'Awaiting decision')}
            </T>
            <G n="chevronDown" x={sx + 150} y={108} s={16} c={L.mutedFg} />
            <Btn label={t('Odśwież', 'Refresh')} x={bx} y={96} h={40} v="outline" o={{ icon: 'refreshCw' }} />
          </g>
        )
      })()}
      <R x={APPLICATION.x} y={APPLICATION.y} w={APPLICATION.w} h={APPLICATION.h} r={16} stroke="rgba(7,6,7,0.18)" sw={1.5} dash="6 6" o={slot} />
      <T x={x} y={ry} s={17} w={700}>
        {t('Kontrahenci B2B', 'B2B Counterparties')}
      </T>
      <R x={x} y={ry + 14} w={MAIN.w} h={196} r={16} fill={L.card} />
      <R x={x} y={ry + 14} w={MAIN.w} h={196} r={16} stroke={L.border} />
      {[t('Firma', 'Company'), t('NIP', 'VAT'), 'Status', t('Zamówienia', 'Orders')].map((name, index) => (
        <T key={name} x={x + 20 + index * 170} y={ry + 44} s={12} w={600} c={L.mutedFg} up ls={0.6}>
          {name}
        </T>
      ))}
      {[0, 1, 2].map((row) => {
        const yy = ry + 58 + row * 46
        return (
          <g key={row}>
            <Rule x={x + 12} y={yy} w={MAIN.w - 24} />
            <Mask x={x + 20} y={yy + 18} w={110 - row * 12} h={14} />
            <Mask x={x + 190} y={yy + 18} w={90} h={14} />
            <Tag label={t('Zatwierdzony', 'Approved')} x={x + 360} y={yy + 13} o={{ color: L.mutedFg, bg: L.muted, size: 12, h: 22 }} />
            <T x={x + 530} y={yy + 30} s={14} w={500}>
              {[14, 6, 3][row]!}
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** Карточка заявки в координатах карточки (0, 0 — её угол). decided — доля
    смены статуса (м-статус): 0 — «Oczekuje na decyzję», 1 — «Zatwierdzony». */
export function ApplicationCard({ decided = 0, press = 1 }: { decided?: number; press?: number }) {
  const clip = `b2b-status-${useId().replace(/:/g, '')}`
  const t = useT()
  const { w, h } = APPLICATION
  const x = 20
  const nameW = tw('sp. z o.o.', 16, 600)
  const statusX = x + 158 + nameW + 10
  const old = t('Oczekuje na decyzję', 'Awaiting decision')
  const next = t('Zatwierdzony', 'Approved')
  const statusW = mix(tagWidth(old, { color: '', size: 12 }), tagWidth(next, { color: '', size: 12 }), clamp01(decided))
  const line = (y: number, parts: (string | number)[]) => {
    let cx = x
    return parts.map((part, i) => {
      if (typeof part === 'number') {
        const el = <Mask key={i} x={cx} y={y - 11} w={part} h={13} />
        cx += part + 6
        return el
      }
      const el = (
        <T key={i} x={cx} y={y} s={14} c={L.mutedFg}>
          {part}
        </T>
      )
      cx += tw(part, 14, 400) + 6
      return el
    })
  }
  const right = w - 20
  const row = 172
  const approveLabel = t('Zatwierdź', 'Approve')
  const rejectLabel = t('Odrzuć', 'Reject')
  const saveLabel = t('Zapisz minimum', 'Save minimum')
  const approve = buttonWidth(approveLabel, { icon: 'circleCheck' })
  const reject = buttonWidth(rejectLabel, { icon: 'circleX' })
  const save = buttonWidth(saveLabel, { icon: 'save' })
  const k = clamp01(decided)
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={k > 0.5 ? L.emeraldLine : L.border} />
      <Mask x={x} y={22} w={150} h={16} />
      <T x={x + 158} y={35} s={16} w={600}>
        sp. z o.o.
      </T>
      <R x={statusX} y={20} w={statusW} h={22} r={11} fill={k > 0.5 ? L.emeraldSoft : L.muted} />
      <defs>
        <clipPath id={clip}>
          <rect x={statusX} y={20} width={statusW} height={22} rx={11} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <g transform={`translate(0 ${-k * 22})`} opacity={1 - k}>
          <T x={statusX + 8} y={20 + 11 + 4.3} s={12} w={600} c={L.mutedFg}>
            {old}
          </T>
        </g>
        <g transform={`translate(0 ${(1 - k) * 22})`} opacity={k}>
          <T x={statusX + 8} y={20 + 11 + 4.3} s={12} w={600} c={L.emeraldText}>
            {next}
          </T>
        </g>
      </g>
      <g opacity={1 - k}>
        <Tag label={t('dziś', 'today')} x={statusX + statusW + 8} y={20} o={{ color: L.emerald, bg: L.emeraldSoft, border: L.emeraldLine, size: 12, weight: 700, h: 22, icon: 'clock' }} />
      </g>
      {line(66, ['Anna', 70, '·', 110, '·', 'PL'])}
      {line(90, [t(`NIP: ${NIP} · Strona WWW: —`, `VAT: ${NIP} · Website: —`)])}
      {line(114, [t('Adres:', 'Address:'), 130, '60-001', 70])}
      {line(138, [t('Kanały: —', 'Channels: —')])}
      {line(162, [t('Wolumen: — · Zamówienia: 0', 'Volume: — · Orders: 0')])}
      {k < 0.5 ? (
        <g>
          <Inp x={20} y={row} w={right - approve - reject - 16 - 20} h={40} placeholder={t('Globalna min. ilość', 'Global min qty')} s={13} />
          <g transform={`translate(${right - approve - reject - 8 + approve / 2} ${row + 20}) scale(${press}) translate(${-(right - approve - reject - 8 + approve / 2)} ${-(row + 20)})`}>
            <Btn label={approveLabel} x={right - approve - reject - 8} y={row} h={40} v="primary" o={{ icon: 'circleCheck' }} />
          </g>
          <Btn label={rejectLabel} x={right - reject} y={row} h={40} v="danger" o={{ icon: 'circleX' }} />
        </g>
      ) : (
        <g>
          <Inp x={20} y={row} w={right - save - reject - 16 - 20} h={40} placeholder={t('Globalna min. ilość', 'Global min qty')} s={13} />
          <Btn label={saveLabel} x={right - save - reject - 8} y={row} h={40} v="outline" o={{ icon: 'save' }} />
          <Btn label={rejectLabel} x={right - reject} y={row} h={40} v="danger" o={{ icon: 'circleX' }} />
        </g>
      )}
    </g>
  )
}

/** Где на карточке заявки кнопка «Zatwierdź» (CSS px карточки). */
export function approveRect() {
  const right = APPLICATION.w - 20
  const approve = buttonWidth('Zatwierdź', { icon: 'circleCheck' })
  const reject = buttonWidth('Odrzuć', { icon: 'circleX' })
  return { x: right - approve - reject - 8, y: 172, w: approve, h: 40 }
}

/* ── Ustawienia → Witryna: «Produkty z ograniczeniem wiekowym» (станция 08) ── */

export const SETTINGS = { w: 400, h: 267, toggle: { x: 336, y: 108, w: 44, h: 24 } }

/** Переключатель продукта (Switch): on — доля включения 0…1. */
export function Switch({ x, y, w = 44, h = 24, on }: { x: number; y: number; w?: number; h?: number; on: number }) {
  const k = clamp01(on)
  const r = h / 2 - 2
  return (
    <g>
      <R x={x} y={y} w={w} h={h} r={h / 2} fill={k > 0.5 ? L.primary : 'rgba(7,6,7,0.18)'} />
      <circle cx={x + h / 2 + (w - h) * k} cy={y + h / 2} r={r} fill="#ffffff" />
    </g>
  )
}

/** Карточка настроек без строки описания раздела (она перечисляет CBD, а
    ролик нейтральный). Переключатель — отдельно (on). */
export function AgeSettingsCard({ on }: { on: number }) {
  const { w, h, toggle } = SETTINGS
  const lang = useLang()
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={L.border} />
      <R x={20} y={20} w={40} h={40} r={14} fill={L.primarySoft} />
      <G n="shieldCheck" x={30} y={30} s={20} c={L.primary} />
      {lang === 'en' ? (
        /* «Age-restricted products» — одна строка, по центру плитки значка. */
        <T x={72} y={46} s={17} w={650}>
          Age-restricted products
        </T>
      ) : (
        <>
          <T x={72} y={36} s={17} w={650}>
            Produkty z ograniczeniem
          </T>
          <T x={72} y={57} s={17} w={650}>
            wiekowym
          </T>
        </>
      )}
      <T x={20} y={104} s={14} w={550}>
        {t('Bramka wieku 18+', '18+ age gate')}
      </T>
      <Switch x={toggle.x} y={toggle.y - 16} w={toggle.w} h={toggle.h} on={on} />
      <PWrap x={20} y={124} width={296}>
        {t('Klient potwierdza, że ma ukończone 18 lat, zanim zobaczy sklep. Wyłączona — sklep otwiera się od razu, a zgodę na analitykę zbiera baner cookies.', 'Visitors confirm they are 18 or older before they see the shop. When off, the shop opens straight away and the cookie banner collects analytics consent.')}
      </PWrap>
      <Rule x={20} y={196} w={w - 40} />
      <Btn label={t('Zapisz ustawienie', 'Save setting')} x={20} y={212} h={38} v="primary" o={{ icon: 'save', size: 13 }} />
    </g>
  )
}

const PWrap = ({ x, y, width, children }: { x: number; y: number; width: number; children: string }) => (
  <P x={x} y={y} s={11.5} c={L.mutedFg} width={width} lh={16}>
    {children}
  </P>
)

/* ── Редактор товара → «Zniżki» (станция 11) ───────────────────────────── */

export const EDITOR = {
  section: { x: MAIN.x, y: 108, w: MAIN.w, h: 520 },
  table: { x: MAIN.x + 24, y: 214, w: MAIN.w - 48, h: 92 },
  box: { x: MAIN.x + 24, y: 318, w: MAIN.w - 48, h: 186 },
  search: { x: MAIN.x + 36, y: 372, w: MAIN.w - 72, h: 40 },
  row: { x: MAIN.x + 36, y: 424, w: MAIN.w - 72, h: 64 },
}

/** Редактор товара без таблицы, поиска и строки (они живые). */
export function EditorPage() {
  const x = MAIN.x
  const s = EDITOR.section
  const b = EDITOR.box
  const lang = useLang()
  const t = useT()
  return (
    <g>
      <AdminFrame active="Produkty" groups={[0, 1, 2, 4]} />
      <G n="arrowLeft" x={x} y={30} s={16} c={L.mutedFg} />
      <T x={x + 24} y={44} s={14} w={500} c={L.mutedFg}>
        {t('Produkty', 'Products')}
      </T>
      <T x={x} y={84} s={22} w={700} ls={-0.2}>
        {goodName('Karton klapowy 600×400×400 mm 5-warstwowy', lang)}
      </T>
      <R x={s.x} y={s.y} w={s.w} h={s.h} r={16} fill={L.card} />
      <R x={s.x} y={s.y} w={s.w} h={s.h} r={16} stroke={L.border} />
      <G n="percent" x={s.x + 24} y={s.y + 24} s={20} c={L.primary} />
      <T x={s.x + 54} y={s.y + 41} s={18} w={650}>
        {t('Zniżki', 'Discounts')}
      </T>
      <T x={s.x + 24} y={s.y + 78} s={15} w={650}>
        {t('Indywidualne zniżki B2B na użytkownika', 'Individual per-user B2B discounts')}
      </T>
      <T x={s.x + 24} y={s.y + 98} s={12} c={L.mutedFg}>
        {t('Cena tylko dla wskazanego kontrahenta, na ten produkt.', 'A price for one specific B2B customer, on this product only.')}
      </T>
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={16} stroke="rgba(7,6,7,0.2)" sw={1.5} dash="5 5" />
      <G n="userPlus" x={b.x + 12} y={b.y + 14} s={16} c={L.primary} />
      <T x={b.x + 36} y={b.y + 27} s={14} w={500}>
        {t('Dodaj zniżkę dla kontrahenta', 'Add a discount for a counterparty')}
      </T>
      <P x={s.x + 24} y={s.y + s.h - 40} s={11} c={L.mutedFg} width={s.w - 48} lh={15}>
        {t('Zniżka indywidualna zastępuje cenę i nie łączy się z progami ilościowymi — tak samo działała we wcześniejszym sklepie. Ma pierwszeństwo przed cennikiem firmowym, ceną segmentu i zniżką ogólną.', 'An individual discount replaces the price and does not combine with the quantity tiers — the same way it worked in the previous shop. It takes precedence over the company price list, the segment price and the global discount.')}
      </P>
    </g>
  )
}

/** Таблица своих цен: пусто или строка фирмы (в координатах таблицы). */
export function EditorTable({ added }: { added: number }) {
  const { w } = EDITOR.table
  const cols = [0, 250, 400, 520]
  const t = useT()
  if (added <= 0)
    return (
      <T x={0} y={24} s={14} c={L.mutedFg}>
        {t('Brak zniżek indywidualnych. Ten produkt jest wyceniany dla wszystkich według cennika.', 'No individual discounts. This product is priced from the price list for everyone.')}
      </T>
    )
  return (
    <g opacity={added}>
      {[t('Kontrahent', 'Counterparty'), t('Rodzaj', 'Type'), t('Wartość', 'Value'), t('Cena netto', 'Net price')].map((name, index) => (
        <T key={name} x={cols[index]! + 4} y={16} s={12} w={500} c={L.mutedFg}>
          {name}
        </T>
      ))}
      <R x={0} y={28} w={w} h={52} r={14} fill="rgba(16,185,129,0.06)" />
      <R x={0} y={28} w={w} h={52} r={14} stroke={L.emeraldLine} />
      <Mask x={14} y={40} w={130} h={13} />
      <T x={152} y={52} s={14} w={500}>
        sp. z o.o.
      </T>
      <Mask x={14} y={60} w={110} h={10} c="rgba(7,6,7,0.08)" />
      <T x={cols[1]! + 4} y={60} s={14} c={L.mutedFg}>
        {t('Cena stała', 'Fixed price')}
      </T>
      <T x={cols[2]! + 4} y={60} s={14}>
        7.90
      </T>
      <T x={cols[3]! + 4} y={60} s={14} w={650}>
        7.90 zł
      </T>
      <G n="pencil" x={w - 70} y={46} s={16} c={L.mutedFg} />
      <G n="trash2" x={w - 36} y={46} s={16} c={L.mutedFg} />
    </g>
  )
}

/** Поле поиска фирмы (в координатах поля). */
export function EditorSearch({ value, focus }: { value: string; focus: boolean }) {
  const { w, h } = EDITOR.search
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={14} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={14} stroke={focus ? L.primary : L.border} sw={focus ? 1.5 : 1} />
      <G n="search" x={10} y={13} s={14} c={L.mutedFg} />
      {value ? (
        <T x={32} y={25} s={14}>
          {value}
        </T>
      ) : (
        <T x={32} y={25} s={14} c={L.mutedFg}>
          {t('Nazwa firmy, imię lub e-mail', 'Company name, first name or e-mail')}
        </T>
      )}
      {focus && <rect x={34 + (value ? tw(value, 14, 400) : 0)} y={12} width={1.5} height={16} fill={L.fg} />}
    </g>
  )
}

export const CANDIDATES = { w: EDITOR.search.w, h: 150 }

/** Подсказки поиска: три фирмы, первая подсвечена (hover). */
export function Candidates({ hover = 0 }: { hover?: number }) {
  const { w, h } = CANDIDATES
  const widths = [150, 120, 170]
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={14} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={14} stroke={L.border} />
      {widths.map((mw, i) => {
        const y = 8 + i * 46
        return (
          <g key={i}>
            {i === hover && <R x={6} y={y} w={w - 12} h={42} r={10} fill={L.muted} />}
            <Mask x={16} y={y + 10} w={mw} h={12} />
            <T x={16 + mw + 8} y={y + 22} s={14} w={500}>
              sp. z o.o.
            </T>
            <Mask x={16} y={y + 28} w={100} h={9} c="rgba(7,6,7,0.08)" />
            <T x={122} y={y + 36} s={12} c={L.mutedFg}>
              · B2B_RESELLER
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** Строка «Rodzaj / Wartość / Dodaj» после выбора фирмы (в координатах строки). */
export function DiscountRow({ value, focus, press = 1 }: { value: string; focus: boolean; press?: number }) {
  const w = EDITOR.row.w
  const typeW = w * 0.52
  const valueW = w * 0.28
  const addW = w - typeW - valueW - 20
  const t = useT()
  return (
    <g>
      <T x={0} y={12} s={12} w={500}>
        {t('Rodzaj', 'Type')}
      </T>
      <R x={0} y={20} w={typeW} h={40} r={14} fill={L.card} />
      <R x={0} y={20} w={typeW} h={40} r={14} stroke={L.border} />
      <T x={12} y={45} s={14}>
        {t('Cena stała (zł)', 'Fixed price (PLN)')}
      </T>
      <G n="chevronDown" x={typeW - 28} y={32} s={16} c={L.mutedFg} />
      <T x={typeW + 10} y={12} s={12} w={500}>
        {t('Wartość', 'Value')}
      </T>
      <R x={typeW + 10} y={20} w={valueW} h={40} r={14} fill={L.card} />
      <R x={typeW + 10} y={20} w={valueW} h={40} r={14} stroke={focus ? L.primary : L.border} sw={focus ? 1.5 : 1} />
      <T x={typeW + 22} y={45} s={14}>
        {value}
      </T>
      {focus && <rect x={typeW + 24 + tw(value, 14, 400)} y={32} width={1.5} height={16} fill={L.fg} />}
      <g transform={`translate(${w - addW / 2} 40) scale(${press}) translate(${-(w - addW / 2)} -40)`}>
        <Btn label={t('Dodaj', 'Add')} x={w - addW} y={20} h={40} v="primary" o={{ icon: 'plus', width: addW }} />
      </g>
    </g>
  )
}

/* ── Kredyty (станция 15) ─────────────────────────────────────────────── */

export const CREDIT = { w: 600, h: 400, bar: { x: 40, y: 186, w: 520, h: 8 } }

/** Карточка «Kredyty» (AdminTradeCreditPage): used — доля заполнения полосы
    (0…1 от 68%), open — строки под полосой. */
export function CreditCard({ used, open = 1 }: { used: number; open?: number }) {
  const { w, h } = CREDIT
  const x = 24
  const y = 92
  const limit = 20000
  const spent = 13619.58
  const share = spent / limit
  const total = ` / ${limit.toFixed(2)} PLN`
  const tw2 = (w - 2 * x - 40) / 2
  const t = useT()
  const noArrears = t('Bez zaległości', 'No arrears')
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={18} fill={L.page} />
      <R x={0} y={0} w={w} h={h} r={18} stroke={L.border} />
      <T x={24} y={44} s={24} w={700}>
        {t('Kredyty', 'Credits')}
      </T>
      <T x={24} y={70} s={13} c={L.mutedFg}>
        {t('Limity, wykorzystanie i terminy płatności (kredyt kupiecki) klientów B2B.', 'Limits, utilisation and payment terms (trade credit) of B2B customers.')}
      </T>
      <R x={x} y={y} w={w - 48} h={h - y - 20} r={14} fill={L.card} />
      <R x={x} y={y} w={w - 48} h={h - y - 20} r={14} stroke={L.emeraldLine} />
      <Mask x={x + 16} y={y + 18} w={150} h={15} />
      <T x={x + 174} y={y + 31} s={15} w={650}>
        sp. z o.o.
      </T>
      <Mask x={x + 16} y={y + 42} w={130} h={11} c="rgba(7,6,7,0.08)" />
      <Tag label={noArrears} x={w - x - 16 - tagWidth(noArrears, { color: '', size: 10, weight: 600, upper: true, tracking: 0.6 })} y={y + 16} o={{ color: L.emeraldText, bg: L.emeraldSoft, size: 10, weight: 600, upper: true, tracking: 0.6, h: 20 }} />
      <T x={x + 16} y={y + 84} s={12} c={L.mutedFg}>
        {t('Wykorzystano', 'Used')}
      </T>
      <T x={w - x - 16} y={y + 84} s={12} c={L.mutedFg} a="end">
        {total}
      </T>
      <T x={w - x - 16 - tw(total, 12, 400)} y={y + 84} s={12} w={650} a="end">
        {`${spent.toFixed(2)} PLN`}
      </T>
      <R x={CREDIT.bar.x} y={CREDIT.bar.y} w={CREDIT.bar.w} h={CREDIT.bar.h} r={4} fill={L.muted} />
      <R x={CREDIT.bar.x} y={CREDIT.bar.y} w={Math.max(CREDIT.bar.h, CREDIT.bar.w * share * clamp01(used))} h={CREDIT.bar.h} r={4} fill={L.primary} o={used > 0 ? 1 : 0} />
      <g opacity={open}>
        <T x={x + 16} y={y + 124} s={11} c={L.mutedFg}>
          {t(`${Math.round(share * 100)}% limitu`, `${Math.round(share * 100)}% of limit`)}
        </T>
        <T x={w - x - 16} y={y + 124} s={11} w={600} c={L.fg} a="end">
          {t(`Dostępne: ${(limit - spent).toFixed(2)} PLN`, `Available: ${(limit - spent).toFixed(2)} PLN`)}
        </T>
        {[
          [t('Termin', 'Term'), t('30 dni', '30 days')],
          [t('Następna płatność', 'Next payment'), '2026-10-28'],
        ].map(([name, value], index) => {
          const tx = x + 16 + index * (tw2 + 8)
          return (
            <g key={name}>
              <R x={tx} y={y + 142} w={tw2} h={66} r={16} fill={L.muted} />
              <T x={tx + 12} y={y + 164} s={10} c={L.mutedFg} up ls={0.3}>
                {name}
              </T>
              <T x={tx + 12} y={y + 190} s={15} w={650}>
                {value}
              </T>
            </g>
          )
        })}
        <G n="calendarClock" x={x + 16} y={y + 226} s={14} c={L.mutedFg} />
        <T x={x + 36} y={y + 238} s={12} c={L.mutedFg}>
          {t('Za 30 dni · 1 otwartych zamówień', 'In 30 days · 1 open orders')}
        </T>
      </g>
    </g>
  )
}

/* ── Свёрнутое меню админки (w-20): знак «HD» и значки ─────────────────── */

export const RAIL = 80
export const RAIL_MAIN = { x: RAIL + 32, w: W - RAIL - 64 }

export function AdminRail({ active }: { active: GlyphName }) {
  const icons: GlyphName[] = ['layoutDashboard', 'target', 'chartColumn', 'package', 'shoppingCart', 'fileText', 'creditCard', 'userPlus', 'handshake', 'users', 'radio', 'settings', 'globe']
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={L.page} />
      <rect x={0} y={0} width={RAIL} height={H} fill={L.sidebar} />
      <rect x={RAIL} y={0} width={1} height={H} fill={L.border} />
      <T x={RAIL / 2} y={44} s={15} w={900} c={L.primary} a="middle" ls={1.5}>
        HD
      </T>
      <G n="panelLeft" x={RAIL / 2 - 8} y={60} s={16} c={L.mutedFg} />
      {icons.map((name, i) => {
        const y = 100 + i * 42
        const on = name === active
        return (
          <g key={name}>
            {on && <R x={16} y={y} w={RAIL - 32} h={36} r={12} fill={L.primarySoft} />}
            <G n={name} x={RAIL / 2 - 8} y={y + 10} s={16} c={on ? L.primary : L.mutedFg} />
          </g>
        )
      })}
    </g>
  )
}

/* ── Integracja Baselinker → Mapowanie statusów (станция 16) ────────────── */

export const MAP = {
  order: { x: RAIL_MAIN.x, y: 116, w: 300, h: 128 },
  card: { x: RAIL_MAIN.x + 324, y: 116, w: RAIL_MAIN.w - 324, h: 500 },
  row: (i: number) => ({ x: RAIL_MAIN.x + 344, y: 226 + i * 46, w: RAIL_MAIN.w - 364, h: 40 }),
}
export const BL_COL = MAP.card.x + 268

/** Страница маппинга без карточки заказа (она живая). lit — подсветка строк
    (0…1 у каждой), sent — отметка «отправлено» в строке. */
export function MappingPage({ lit, statuses, bl }: { lit: number[]; statuses: string[]; bl: string[] }) {
  const c = MAP.card
  const lang = useLang()
  const t = useT()
  return (
    <g>
      <AdminRail active="settings" />
      <T x={RAIL_MAIN.x} y={52} s={22} w={700}>
        {t('Integracja Baselinker', 'Baselinker integration')}
      </T>
      <T x={RAIL_MAIN.x} y={78} s={13} c={L.mutedFg}>
        {t('Skonfiguruj synchronizację zamówień, produktów i stanów magazynowych z Baselinker', 'Configure order, product and stock synchronisation with Baselinker')}
      </T>
      <R x={c.x} y={c.y} w={c.w} h={c.h} r={16} fill={L.card} />
      <R x={c.x} y={c.y} w={c.w} h={c.h} r={16} stroke={L.border} />
      <T x={c.x + 20} y={c.y + 36} s={18} w={650}>
        {t('Mapowanie statusów', 'Status mapping')}
      </T>
      <P x={c.x + 20} y={c.y + 58} s={12} c={L.mutedFg} width={c.w - 40} lh={16}>
        {t('Zmiana statusu zamówienia u nas ustawia wybrany status w BaseLinkerze. Puste = nie wysyłamy.', 'Changing an order status here sets the chosen status in BaseLinker. Blank means nothing is sent.')}
      </P>
      <T x={c.x + 20} y={c.y + 104} s={12} w={550} c={L.mutedFg}>
        {t('Nasz status', 'Our status')}
      </T>
      <T x={BL_COL} y={c.y + 104} s={12} w={550} c={L.mutedFg}>
        {t('Status w BaseLinkerze', 'BaseLinker status')}
      </T>
      {statuses.map((name, i) => {
        const r = MAP.row(i)
        const k = clamp01(lit[i] ?? 0)
        return (
          <g key={name}>
            {k > 0 && <R x={r.x - 10} y={r.y - 2} w={r.w + 20} h={r.h + 4} r={14} fill={`rgba(250,79,0,${0.08 * k})`} />}
            <T x={r.x} y={r.y + 25} s={14} w={k > 0.5 ? 650 : 500}>
              {statusName(name, lang)}
            </T>
            <G n="arrowRight" x={BL_COL - 34} y={r.y + 12} s={16} c={k > 0.1 ? L.primary : 'rgba(7,6,7,0.25)'} sw={2.2} />
            <R x={BL_COL} y={r.y + 2} w={c.x + c.w - 20 - BL_COL} h={36} r={12} fill={L.card} />
            <R x={BL_COL} y={r.y + 2} w={c.x + c.w - 20 - BL_COL} h={36} r={12} stroke={k > 0.1 ? `rgba(250,79,0,${0.3 + 0.5 * k})` : L.border} sw={k > 0.1 ? 1.5 : 1} />
            <T x={BL_COL + 12} y={r.y + 25} s={13}>
              {blStatusName(bl[i]!, lang)}
            </T>
            <G n="chevronDown" x={c.x + c.w - 20 - 28} y={r.y + 12} s={16} c={L.mutedFg} />
          </g>
        )
      })}
      <Btn label={t('Zapisz mapowanie', 'Save mapping')} x={c.x + 20} y={c.y + c.h - 56} h={36} v="primary" o={{ icon: 'save', size: 13 }} />
    </g>
  )
}

/** Карточка заказа (в координатах карточки 300 × 128): номер, сумма, статус.
    from, to — польские статусы (данные), показываются на языке ролика. */
export function OrderCard({ from: fromPl, to: toPl, k }: { from: string; to: string; k: number }) {
  const { w, h } = MAP.order
  const lang = useLang()
  const tr = useT()
  const from = statusName(fromPl, lang)
  const to = statusName(toPl, lang)
  const t = clamp01(k)
  const widthOf = (label: string) => tagWidth(label, { color: '', size: 12 })
  const chipW = mix(widthOf(from), widthOf(to), t)
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={L.border} />
      <G n="package" x={16} y={18} s={20} c={L.primary} />
      <T x={46} y={34} s={15} w={650}>
        {tr('Zamówienie PD-260928-0015', 'Order PD-260928-0015')}
      </T>
      <T x={16} y={62} s={12} c={L.mutedFg}>
        {tr('4 pozycje · 1139,58 zł · Kredyt kupiecki', '4 items · 1139,58 zł · Trade credit')}
      </T>
      <R x={16} y={80} w={chipW} h={26} r={13} fill="rgba(250,79,0,0.12)" />
      <R x={16} y={80} w={chipW} h={26} r={13} stroke="rgba(250,79,0,0.35)" />
      <defs>
        <clipPath id="b2b-order-chip">
          <rect x={16} y={80} width={chipW} height={26} rx={13} />
        </clipPath>
      </defs>
      <g clipPath="url(#b2b-order-chip)">
        <g transform={`translate(0 ${-t * 22})`} opacity={1 - t}>
          <T x={24} y={97.5} s={12} w={600} c={L.primary}>
            {from}
          </T>
        </g>
        <g transform={`translate(0 ${(1 - t) * 22})`} opacity={t}>
          <T x={24} y={97.5} s={12} w={600} c={L.primary}>
            {to}
          </T>
        </g>
      </g>
    </g>
  )
}

/* ── Zamówienia + okno zamówienia z InPost ShipX (станция 17) ──────────── */

/** Список заказов под окном (фон, приглушён затемнением). */
export function OrdersPage() {
  const x = RAIL_MAIN.x
  const lang = useLang()
  const t = useT()
  const statuses = ['Pakowanie', 'Nowe zamówienie', 'Przekazane kurierowi', 'W realizacji', 'Kompletowanie', 'Dostarczone'].map((name) => statusName(name, lang))
  return (
    <g>
      <AdminRail active="shoppingCart" />
      <T x={x} y={52} s={22} w={700}>
        {t('Zamówienia', 'Orders')}
      </T>
      <T x={x} y={78} s={13} c={L.mutedFg}>
        {t('Wszystkie zamówienia sklepu i kontrahentów B2B.', 'All shop and B2B counterparty orders.')}
      </T>
      <R x={x} y={100} w={RAIL_MAIN.w} h={520} r={16} fill={L.card} />
      <R x={x} y={100} w={RAIL_MAIN.w} h={520} r={16} stroke={L.border} />
      {[t('Numer', 'Number'), t('Klient', 'Customer'), 'Status', t('Kwota', 'Amount')].map((name, i) => (
        <T key={name} x={x + 20 + i * 210} y={132} s={12} w={600} c={L.mutedFg} up ls={0.6}>
          {name}
        </T>
      ))}
      {statuses.map((status, row) => {
        const y = 146 + row * 76
        return (
          <g key={row}>
            <Rule x={x + 12} y={y} w={RAIL_MAIN.w - 24} />
            <T x={x + 20} y={y + 42} s={14} w={600}>
              {`PD-260928-00${String(15 - row).padStart(2, '0')}`}
            </T>
            <Mask x={x + 230} y={y + 30} w={140 - row * 8} h={14} />
            <Tag label={status} x={x + 440} y={y + 25} o={{ color: L.primary, bg: 'rgba(250,79,0,0.1)', size: 12, h: 24 }} />
            <T x={x + 650} y={y + 42} s={14} w={500}>
              {['1139,58 zł', '842,10 zł', '2268,12 zł', '316,40 zł', '1204,00 zł', '97,30 zł'][row]!}
            </T>
          </g>
        )
      })}
    </g>
  )
}

export const DIALOG = { x: 182, y: 26, w: 660, h: 574 }
const DX = DIALOG.x + 24
export const SHIP = { block: { x: DX, y: DIALOG.y + 426, w: 612, h: 128 }, gauge: { x: DX + 20, y: DIALOG.y + 426 + 70, w: 176, h: 40 }, create: { x: DX + 206, y: DIALOG.y + 426 + 70, w: 386, h: 40 }, label: { x: DX + 150, y: DIALOG.y + 426 + 70, w: 150, h: 40 } }

/** Окно заказа: клиент, адрес, позиции и блок «InPost ShipX». created —
    отправка создана (кнопки «Odśwież», «Etykieta A6», «Anuluj»). */
export function OrderDialog({ gauge: gaugePl, created, pressCreate = 1, pressLabel = 1 }: { gauge: string; created: number; pressCreate?: number; pressLabel?: number }) {
  const d = DIALOG
  const x = DX
  const b = SHIP.block
  const c = clamp01(created)
  const lang = useLang()
  const t = useT()
  /* gauge — польский габарит (данные), показывается на языке ролика. */
  const gauge = gaugeName(gaugePl, lang)
  return (
    <g>
      <R x={d.x} y={d.y} w={d.w} h={d.h} r={24} fill={L.card} />
      <R x={d.x} y={d.y} w={d.w} h={d.h} r={24} stroke={L.border} />
      <T x={x} y={d.y + 44} s={20} w={700}>
        {t('Zamówienie PD-260928-0015', 'Order PD-260928-0015')}
      </T>
      <Tag label={statusName('Pakowanie', lang)} x={x} y={d.y + 58} o={{ color: L.primary, bg: 'rgba(250,79,0,0.12)', size: 12, h: 22 }} />
      <G n="x" x={d.x + d.w - 40} y={d.y + 22} s={18} c={L.mutedFg} />
      <R x={x} y={d.y + 94} w={298} h={112} r={16} fill={L.muted} />
      <T x={x + 12} y={d.y + 116} s={12} w={500} c={L.mutedFg}>
        {t('Klient', 'Customer')}
      </T>
      <Mask x={x + 12} y={d.y + 128} w={120} h={13} />
      <Mask x={x + 12} y={d.y + 150} w={160} h={11} c="rgba(7,6,7,0.08)" />
      <Tag label={t('Płatność: Kredyt kupiecki', 'Payment: Trade credit')} x={x + 12} y={d.y + 172} o={{ color: L.primary, bg: 'rgba(250,79,0,0.1)', size: 12, h: 22 }} />
      <R x={x + 314} y={d.y + 94} w={298} h={112} r={16} fill={L.muted} />
      <T x={x + 326} y={d.y + 116} s={12} w={500} c={L.mutedFg}>
        {t('Adres dostawy', 'Shipping address')}
      </T>
      <Mask x={x + 326} y={d.y + 128} w={110} h={13} />
      <Mask x={x + 326} y={d.y + 150} w={150} h={13} />
      <T x={x + 326} y={d.y + 188} s={13} w={550}>
        60-001 · PL
      </T>
      <R x={x} y={d.y + 222} w={612} h={184} r={16} fill={L.card} />
      <R x={x} y={d.y + 222} w={612} h={184} r={16} stroke={L.border} />
      <R x={x} y={d.y + 222} w={612} h={32} r={16} fill={L.muted} />
      {[t('Produkt', 'Product'), t('Ilość', 'Quantity'), t('Cena', 'Price'), t('Suma', 'Total')].map((name, index) => (
        <T key={name} x={x + [12, 380, 480, 600][index]!} y={d.y + 243} s={12} w={550} a={index === 0 ? 'start' : index === 1 ? 'middle' : 'end'}>
          {name}
        </T>
      ))}
      {[
        ['Karton klapowy 600×400×400 mm 5-warstwowy', 50, 8.54],
        ['Taśma pakowa 48 mm × 66 m brązowa', 36, 3.2],
        ['Folia stretch 23 µm 1,5 kg', 12, 18.9],
        ['Wypełniacz papierowy 5 kg', 6, 24.5],
      ].map(([name, qty, unit], index) => {
        const y = d.y + 276 + index * 34
        return (
          <g key={index}>
            <Rule x={x} y={y - 18} w={612} c={L.borderSoft} />
            <T x={x + 12} y={y + 2} s={13}>
              {goodName(name as string, lang)}
            </T>
            <T x={x + 380} y={y + 2} s={13} a="middle">
              {qty as number}
            </T>
            <T x={x + 480} y={y + 2} s={13} a="end">
              {`${(unit as number).toFixed(2)} PLN`}
            </T>
            <T x={x + 600} y={y + 2} s={13} w={650} a="end">
              {`${((unit as number) * (qty as number)).toFixed(2)} PLN`}
            </T>
          </g>
        )
      })}
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={24} fill={L.page} />
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={24} stroke={c > 0.5 ? L.emeraldLine : L.border} />
      <G n="package" x={b.x + 20} y={b.y + 18} s={16} />
      <T x={b.x + 44} y={b.y + 31} s={14} w={650}>
        InPost ShipX
      </T>
      <T x={b.x + 20} y={b.y + 54} s={12} c={L.mutedFg}>
        {c > 0.5 ? `InPost Kurier Standard · ${gauge} · confirmed` : 'InPost Kurier Standard'}
      </T>
      {c < 0.5 ? (
        <g opacity={1 - c * 2}>
          <R x={SHIP.gauge.x} y={SHIP.gauge.y} w={SHIP.gauge.w} h={40} r={20} fill={L.card} />
          <R x={SHIP.gauge.x} y={SHIP.gauge.y} w={SHIP.gauge.w} h={40} r={20} stroke={L.border} />
          <T x={SHIP.gauge.x + 16} y={SHIP.gauge.y + 25} s={14} w={500}>
            {gauge}
          </T>
          <G n="chevronDown" x={SHIP.gauge.x + 146} y={SHIP.gauge.y + 12} s={16} c={L.mutedFg} />
          <g transform={`translate(${SHIP.create.x + SHIP.create.w / 2} ${SHIP.create.y + 20}) scale(${pressCreate}) translate(${-(SHIP.create.x + SHIP.create.w / 2)} ${-(SHIP.create.y + 20)})`}>
            <Btn label={t('Utwórz przesyłkę', 'Create shipment')} x={SHIP.create.x} y={SHIP.create.y} h={40} v="primary" o={{ icon: 'package', width: SHIP.create.w }} />
          </g>
        </g>
      ) : (
        <g opacity={c * 2 - 1}>
          <Btn label={t('Odśwież', 'Refresh')} x={b.x + 20} y={b.y + 70} h={40} v="secondary" o={{ icon: 'refreshCw' }} />
          <g transform={`translate(${SHIP.label.x + 65} ${SHIP.label.y + 20}) scale(${pressLabel}) translate(${-(SHIP.label.x + 65)} ${-(SHIP.label.y + 20)})`}>
            <Btn label={t('Etykieta A6', 'A6 label')} x={SHIP.label.x} y={b.y + 70} h={40} v="secondary" o={{ icon: 'download' }} />
          </g>
          <Btn label={t('Anuluj', 'Cancel')} x={SHIP.label.x + 164} y={b.y + 70} h={40} v="ghost" o={{ icon: 'x' }} />
        </g>
      )}
    </g>
  )
}

export const GAUGES = ['Gabaryt A', 'Gabaryt B', 'Gabaryt C']
const GAUGES_EN = ['Size A (small)', 'Size B (medium)', 'Size C (large)']
/** Габарит на языке ролика (admin.ordersPage.parcelSize* из en.ts движка). */
const gaugeName = (gauge: string, lang: 'pl' | 'en') => (lang === 'en' ? (GAUGES_EN[GAUGES.indexOf(gauge)] ?? gauge) : gauge)
export const GAUGE_MENU = { w: 176, h: 124 }

export function GaugeMenu({ hover, picked }: { hover: number; picked: number }) {
  const { w, h } = GAUGE_MENU
  const lang = useLang()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill={L.card} />
      <R x={0} y={0} w={w} h={h} r={16} stroke={L.border} />
      {GAUGES.map((name, index) => {
        const y = 6 + index * 38
        const on = index === picked
        return (
          <g key={name}>
            {(on || index === hover) && <R x={6} y={y} w={w - 12} h={36} r={12} fill={on ? 'rgba(250,79,0,0.14)' : L.muted} />}
            <T x={16} y={y + 23} s={14} w={on ? 650 : 400} c={on ? L.primary : L.fg}>
              {gaugeName(name, lang)}
            </T>
            {on && <G n="check" x={w - 32} y={y + 10} s={16} c={L.primary} />}
          </g>
        )
      })}
    </g>
  )
}

/** Этикетка InPost A6 (296 × 210): отправитель и получатель замаскированы,
    штрихкод прорисовывается слева направо (bars 0…1). */
export function ShippingLabel({ gauge, bars }: { gauge: string; bars: number }) {
  const w = 296
  const h = 210
  const t = useT()
  const seed = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 1, 3, 2, 1]
  /* Штрихкод — во всю ширину этикетки (у художника занимал её половину). */
  const unit = (w - 36) / seed.reduce((sum, width) => sum + width, 0)
  let bx = 18
  let dark = true
  const rects: ReactNode[] = []
  seed.forEach((width, i) => {
    if (dark && (bx - 18) / (w - 36) <= clamp01(bars)) rects.push(<rect key={i} x={bx} y={104} width={width * unit} height={70} fill="#111111" />)
    bx += width * unit
    dark = !dark
  })
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={6} fill="#fbfbf8" />
      <T x={14} y={26} s={18} w={800} c="#111111">
        InPost
      </T>
      <T x={w - 14} y={24} s={11} w={600} c="#111111" a="end">
        {`Kurier Standard · ${gauge.replace('Gabaryt ', '')}`}
      </T>
      <rect x={14} y={34} width={w - 28} height={1.2} fill="#111111" />
      <T x={14} y={52} s={8} w={700} c="#555555" ls={0.5}>
        {t('NADAWCA', 'SENDER')}
      </T>
      <R x={14} y={57} w={110} h={7} r={3} fill="rgba(0,0,0,0.25)" />
      <R x={14} y={68} w={80} h={7} r={3} fill="rgba(0,0,0,0.25)" />
      <T x={150} y={52} s={8} w={700} c="#555555" ls={0.5}>
        {t('ODBIORCA', 'RECIPIENT')}
      </T>
      <R x={150} y={57} w={120} h={8} r={3} fill="rgba(0,0,0,0.3)" />
      <R x={150} y={69} w={96} h={8} r={3} fill="rgba(0,0,0,0.3)" />
      <T x={150} y={92} s={12} w={700} c="#111111">
        60-001
      </T>
      {rects}
      <T x={w / 2} y={192} s={11} w={600} c="#111111" a="middle" ls={0.8} o={clamp01(bars * 2 - 1)}>
        6200 1234 5678 9012 3456 78
      </T>
    </g>
  )
}
