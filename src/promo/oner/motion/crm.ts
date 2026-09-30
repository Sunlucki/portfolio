import type { CanvasTexture } from 'three'
import { FONT, avatar, card, chip, paint, round, statusBar, tint, tr, write } from './paint'

/* Двойники экранов SIMBIA CRM для пробы моушн-слоя (06-MOTION, §7). Цвета —
   токены тёмной темы CRM (apps/web/src/styles/tokens.css), надписи — польский
   словарь CRM (apps/web/src/i18n/pl): так, как в продукте. Имена лидов и фирм
   вымышленные, как в демо-данных. Счётчиков-«достижений» здесь нет: цифры —
   часть интерфейса, их не накручиваем (правило владельца).

   Английские надписи (2D-ролик для портфолио) — парой tr('…', '…') из
   английского словаря CRM (apps/web/src/i18n/en). Польские фискальные слова,
   которые словарь оставляет как есть (faktura, kontrahent), в ролике — по-
   английски: его смотрит не бухгалтер. Суммы — по-польски, как в продукте на
   любом языке; даты — локаль en продукта (09/28/26). Текст, от которого зависит
   раскладка, считается при рисовании, а не при загрузке модуля. */

/** Рисуем ли по-английски — для раскладки, которой нужна другая мера. */
const inEnglish = () => tr('pl', 'en') === 'en'

export const CRM = {
  bg: '#0d0d0d',
  card: '#141414',
  hover: '#1c1c1c',
  input: '#111111',
  sidebar: '#0a0a0a',
  teal: '#59b4bd',
  tealDim: 'rgba(89, 180, 189, 0.12)',
  coral: '#ec6a5e',
  coralDim: 'rgba(236, 106, 94, 0.12)',
  green: '#4caf7d',
  greenDim: 'rgba(76, 175, 125, 0.12)',
  amber: '#e8a838',
  amberDim: 'rgba(232, 168, 56, 0.12)',
  blue: '#7aa2f7',
  blueDim: 'rgba(122, 162, 247, 0.14)',
  violet: '#bb9af7',
  violetDim: 'rgba(187, 154, 247, 0.14)',
  border: 'rgba(255, 255, 255, 0.07)',
  borderHover: 'rgba(255, 255, 255, 0.13)',
  text: '#f0f0f0',
  muted: '#888888',
  dim: '#555555',
  /* Liquid Glass (владелец 28.09): фон плавающей панели пропускает матовое стекло
     под собой, плитки на ней — плотнее, чтобы текст читался. Экраны устройств
     (ноутбук, телефон) остаются непрозрачными, как настоящие. */
  glassBg: 'rgba(13, 13, 13, 0.55)',
  glassSidebar: 'rgba(10, 10, 10, 0.35)',
  glassCard: 'rgba(20, 20, 20, 0.7)',
  glassTile: 'rgba(20, 20, 20, 0.82)',
  glassRow: 'rgba(28, 28, 28, 0.86)',
  /* Не токены продукта, а части ролика: белые карточки О4 (реестры, три
     причины), пустые гнёзда, точечная сетка мастеров, погасшие диски дней,
     хром Safari. У каждой темы свои значения (v3.2). */
  paper: 'rgba(238, 240, 243, 0.9)',
  paperEdge: 'rgba(255, 255, 255, 0.75)',
  paperInk: '#0d0d0d',
  paperMuted: '#5b5f66',
  paperAccent: '#2a8f99',
  paperWash: 'rgba(89, 180, 189, 0.16)',
  dots: 'rgba(89, 180, 189, 0.1)',
  slot: 'rgba(255, 255, 255, 0.015)',
  placeholder: 'rgba(255, 255, 255, 0.04)',
  rowTint: 'rgba(255, 255, 255, 0.02)',
  ghost: '#3a3a3a',
  ghostDim: '#333333',
  ghostEdge: 'rgba(255, 255, 255, 0.1)',
  tapped: 'rgba(89, 180, 189, 0.2)',
  safariBar: 'rgba(13, 13, 13, 0.94)',
  safariField: '#2a2a2c',
}

/** Экран, к которому камера подлетает (v3.2): холст вдвое плотнее, иначе
    текст на подлёте мылится (paint, ratio). */
function paintClose(width: number, height: number, draw: Parameters<typeof paint>[2]): CanvasTexture | null {
  return paint(width, height, draw, 2)
}

/* ── Экран входа (крышка ноутбука, 16:10) ─────────────────────────────── */

export const LOGIN = { width: 1600, height: 1000 }
/** Карточка входа и кнопка «Zaloguj się kluczem» на экране, px. Высота — с
    подписью «Aplikacja jest podłączona…» под кнопками, как в LoginPage.tsx. */
export const LOGIN_CARD = { x: 565, y: 230, width: 470, height: 540 }
export const LOGIN_PASSKEY = { x: LOGIN_CARD.x + 26, y: LOGIN_CARD.y + 418, width: 418, height: 50 }

/** empty — карточка уже улетела с экрана (станция 04). */
export type LoginState = 'idle' | 'waiting' | 'done' | 'empty'

/** Иконка lucide по разметке путей (viewBox 24): точный штрих, как в продукте. */
function lucide(context: CanvasRenderingContext2D, paths: string[], x: number, y: number, size: number, color: string, weight = 2) {
  context.save()
  context.translate(x, y)
  context.scale(size / 24, size / 24)
  context.strokeStyle = color
  context.lineWidth = weight
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (const d of paths) context.stroke(new Path2D(d))
  context.restore()
}

/* lucide-react 1.31: fingerprint-pattern (Fingerprint), log-in (LogIn). */
const FINGERPRINT = [
  'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4',
  'M14 13.12c0 2.38 0 6.38-1 8.88',
  'M17.29 21.02c.12-.6.43-2.3.5-3.02',
  'M2 12a10 10 0 0 1 18-6',
  'M2 16h.01',
  'M21.8 16c.2-2 .131-5.354 0-6',
  'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2',
  'M8.65 22c.21-.66.45-1.32.57-2',
  'M9 6.8a6 6 0 0 1 9 5.2v2',
]
const LOG_IN = ['m10 17 5-5-5-5', 'M15 12H3', 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4']

function spinnerGlyph(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  context.save()
  context.strokeStyle = color
  context.lineWidth = size * 0.12
  context.lineCap = 'round'
  context.beginPath()
  context.arc(x + size / 2, y + size / 2, size * 0.38, -Math.PI / 2, Math.PI)
  context.stroke()
  context.restore()
}

function checkGlyph(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  context.strokeStyle = color
  context.lineWidth = size * 0.14
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(x + size * 0.15, y + size * 0.52)
  context.lineTo(x + size * 0.4, y + size * 0.76)
  context.lineTo(x + size * 0.88, y + size * 0.26)
  context.stroke()
}

/** Только карточка входа — её же поднимает м-отрыв со станции 04. Состав и
    кнопки — как в LoginPage.tsx: «Zaloguj się» — основная с иконкой LogIn,
    «Zaloguj się kluczem» — контурная (bg-card, рамка по умолчанию) с иконкой
    Fingerprint; пока ждём ключ — спиннер вместо иконки и кнопка приглушена
    (loading, disabled); внизу — подпись apiNote. Состояние done — только
    ролика: вход подтверждён, кнопка зелёная с галочкой. */
export function drawLoginCard(context: CanvasRenderingContext2D, x: number, y: number, state: LoginState) {
  const { width, height } = LOGIN_CARD
  card(context, x, y, width, height, 14, CRM.card, CRM.border)
  const left = x + 26
  write(context, tr('Logowanie do CRM', 'Sign in to the CRM'), left, y + 54, { size: 23, weight: 620, color: CRM.text })
  write(context, tr('Podaj służbowy e-mail i hasło.', 'Enter your work email and password.'), left, y + 84, { size: 15, weight: 450, color: CRM.muted })
  const field = (label: string, value: string, top: number) => {
    /* Подпись поля — LABEL_CAPS продукта (заглавные, разрядка) и коралловая
       звёздочка обязательного поля (ui/fields.tsx, Field required). */
    const w = caps(context, label, left, top, 1.15)
    write(context, '*', left + w + 2, top, { size: 12.6, weight: 600, color: CRM.coral })
    card(context, left, top + 10, width - 52, 46, 9, CRM.input, CRM.border)
    write(context, value, left + 14, top + 40, { size: 16, weight: 450, color: CRM.text })
  }
  field(tr('E-mail', 'Email'), 'anna@simbia.eu', y + 128)
  field(tr('Hasło', 'Password'), '••••••••••', y + 206)
  const waiting = state === 'waiting'
  /* Пока ждём ключ, форма занята (busy): основная кнопка приглушена. */
  context.globalAlpha = waiting ? 0.5 : 1
  round(context, left, y + 282, width - 52, 48, 10)
  context.fillStyle = CRM.teal
  context.fill()
  context.font = `650 16px "Inter Variable", Inter, sans-serif`
  const submit = tr('Zaloguj się', 'Sign in')
  const submitWidth = context.measureText(submit).width + 26
  lucide(context, LOG_IN, x + width / 2 - submitWidth / 2, y + 297, 18, CRM.bg)
  write(context, submit, x + width / 2 - submitWidth / 2 + 26, y + 313, { size: 16, weight: 650, color: CRM.bg })
  context.globalAlpha = 1
  const dividerY = y + 374
  context.fillStyle = CRM.border
  context.fillRect(left, dividerY, 150, 1.5)
  context.fillRect(x + width - 26 - 150, dividerY, 150, 1.5)
  write(context, tr('albo', 'or'), x + width / 2, dividerY + 5, { size: 12, weight: 600, color: CRM.dim, align: 'center', upper: true, tracking: 1 })
  const passkeyY = y + 418
  const done = state === 'done'
  context.globalAlpha = waiting ? 0.5 : 1
  card(context, left, passkeyY, width - 52, 50, 10, done ? CRM.greenDim : CRM.card, done ? CRM.green : CRM.border)
  const label = waiting ? tr('Czekamy na potwierdzenie…', 'Waiting for confirmation…') : tr('Zaloguj się kluczem', 'Sign in with a passkey')
  const color = done ? CRM.green : CRM.text
  context.font = `600 16px "Inter Variable", Inter, sans-serif`
  const textWidth = context.measureText(label).width
  const iconX = x + width / 2 - (textWidth + 30) / 2
  if (done) checkGlyph(context, iconX, passkeyY + 14, 22, CRM.green)
  else if (waiting) spinnerGlyph(context, iconX, passkeyY + 14, 22, color)
  else lucide(context, FINGERPRINT, iconX, passkeyY + 14, 22, color)
  write(context, label, iconX + 30, passkeyY + 31, { size: 16, weight: 600, color })
  context.globalAlpha = 1
  write(context, tr('Aplikacja jest podłączona do bazy produkcyjnej SIMBIA.', 'The app is connected to the live SIMBIA database.'), left, passkeyY + 50 + 38, { size: 13, weight: 450, color: CRM.muted })
}

export function crmLogin(state: LoginState): CanvasTexture | null {
  return paintClose(LOGIN.width, LOGIN.height, (context, width, height) => {
    context.fillStyle = CRM.teal
    context.fillRect(0, 0, width, height)
    /* Как в LoginPage.tsx: точки — цвет фона (text-bg) на 18 %, рамка пилюли — border-bg/50. */
    context.fillStyle = tint(CRM.bg, 0.18)
    for (let y = 14; y < height; y += 29) {
      for (let x = 14; x < width; x += 29) {
        context.beginPath()
        context.arc(x, y, 2.3, 0, Math.PI * 2)
        context.fill()
      }
    }
    write(context, 'SIMBIA CRM', 56, 84, { size: 23, weight: 900, color: CRM.bg, tracking: 4 })
    context.font = `700 12px "Inter Variable", Inter, sans-serif`
    const chipText = tr('BAZA PRODUKCYJNA', 'LIVE DATABASE')
    context.letterSpacing = '1px'
    const chipWidth = context.measureText(chipText).width + 30
    context.letterSpacing = '0px'
    round(context, width - 56 - chipWidth, 58, chipWidth, 32, 16)
    context.strokeStyle = tint(CRM.bg, 0.5)
    context.lineWidth = 1.5
    context.stroke()
    write(context, chipText, width - 56 - chipWidth / 2, 79, { size: 12, weight: 700, color: CRM.bg, align: 'center', tracking: 1 })
    if (state !== 'empty') drawLoginCard(context, LOGIN_CARD.x, LOGIN_CARD.y, state)
  })
}

/** Карточка входа отдельно — крупная, для плиты на станции 04. */
export function crmLoginCard(state: LoginState): CanvasTexture | null {
  const scale = 2
  return paint(LOGIN_CARD.width * scale, LOGIN_CARD.height * scale, (context) => {
    context.scale(scale, scale)
    drawLoginCard(context, 0, 0, state)
  })
}

/* ── Дашборд (станция 05) ─────────────────────────────────────────────── */

export const DASH = { width: 2048, height: 1323 }
const MAIN = 340
const KPI_TOP = 196
const KPI_HEIGHT = 140
const KPI_GAP = 16
const KPI_WIDTH = (DASH.width - MAIN - 40 - KPI_GAP * 5) / 6

/** Места элементов на экране дашборда, px: сюда они прилетают и встают. */
export const DASH_SLOTS = {
  kpi: Array.from({ length: 6 }, (_, i) => ({ x: MAIN + i * (KPI_WIDTH + KPI_GAP), y: KPI_TOP, width: KPI_WIDTH, height: KPI_HEIGHT })),
  today: { x: MAIN, y: 360, width: 1100, height: 560 },
  todayRows: Array.from({ length: 4 }, (_, i) => ({ x: MAIN + 24, y: 360 + 118 + i * 104, width: 1100 - 48, height: 92 })),
  funnel: { x: MAIN + 1116, y: 360, width: DASH.width - MAIN - 1116 - 40, height: 460 },
}

/** Меню сайдбара: группы и пункты (i18n nav). Функция — подписи на языке рисования. */
const NAV = (): [string, string[]][] => [
  [tr('Przegląd', 'Overview'), [tr('Pulpit', 'Dashboard'), tr('Raporty', 'Reports')]],
  [tr('Sprzedaż', 'Sales'), [tr('Priorytety', 'Priorities'), tr('Leady', 'Leads'), 'Kanban', tr('Oferty', 'Quotes'), tr('Kalendarz', 'Calendar'), tr('Kampanie', 'Campaigns')]],
  [tr('Komunikacja', 'Communication'), [tr('Poczta', 'Mail'), 'Follow-up']],
  [tr('Praca', 'Work'), [tr('Projekty', 'Projects'), tr('Zadania', 'Tasks'), tr('Dokumenty', 'Documents')]],
]

/** Этапы воронки (i18n domain.leadStatus). В данных двойников этап — польский:
    по нему выбирается тон (STAGE); подпись переводится при рисовании. */
const STAGE_EN: Record<string, string> = {
  Nowy: 'New',
  'W kontakcie': 'Contacted',
  Spotkanie: 'Meeting',
  'Oferta wysłana': 'Proposal sent',
  Negocjacje: 'Negotiation',
  Wygrany: 'Won',
  Przegrany: 'Lost',
}
const stageLabel = (stage: string) => tr(stage, STAGE_EN[stage] ?? stage)

/** Источники лида (i18n domain.leadSource) — так же: ключ польский. */
const SOURCE_EN: Record<string, string> = { 'Strona WWW': 'Website', Polecenie: 'Referral', Konferencja: 'Conference', 'Zimny telefon': 'Cold call' }
const sourceLabel = (source: string) => tr(source, SOURCE_EN[source] ?? source)

export function crmDashboardBase(): CanvasTexture | null {
  return paintClose(DASH.width, DASH.height, (context, width, height) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    context.fillStyle = CRM.glassSidebar
    context.fillRect(0, 0, 300, height)
    context.fillStyle = CRM.border
    context.fillRect(300, 0, 1.5, height)
    write(context, 'SIMBIA CRM', 36, 72, { size: 24, weight: 900, color: CRM.teal, tracking: 3 })
    let top = 138
    for (const [group, items] of NAV()) {
      write(context, group, 36, top, { size: 13, weight: 650, color: CRM.dim, upper: true, tracking: 1.5 })
      top += 22
      for (const item of items) {
        const active = item === tr('Pulpit', 'Dashboard')
        if (active) {
          round(context, 20, top - 2, 260, 44, 10)
          context.fillStyle = CRM.tealDim
          context.fill()
        }
        write(context, item, 36, top + 28, { size: 19, weight: active ? 650 : 500, color: active ? CRM.teal : CRM.muted })
        top += 48
      }
      top += 26
    }
    write(context, tr('Cześć, Anna', 'Hello, Anna'), MAIN, 104, { size: 42, weight: 650, color: CRM.text })
    write(context, tr('Dane dla: SIMBIA', 'Data for: SIMBIA'), MAIN, 146, { size: 19, weight: 450, color: CRM.muted })
    round(context, width - 40 - 196, 64, 196, 56, 12)
    context.fillStyle = CRM.teal
    context.fill()
    write(context, tr('+  Nowy lead', '+  New lead'), width - 40 - 98, 100, { size: 19, weight: 650, color: CRM.bg, align: 'center' })
    /* Пустые места под элементы: тонкая рамка, чтобы прилетевшие плитки
       вставали в свои гнёзда. */
    const slot = (s: { x: number; y: number; width: number; height: number }) => card(context, s.x, s.y, s.width, s.height, 14, CRM.slot, CRM.border)
    DASH_SLOTS.kpi.forEach(slot)
    slot(DASH_SLOTS.today)
    slot(DASH_SLOTS.funnel)
    const recent = { x: MAIN, y: 940, width: 1100, height: 360 }
    card(context, recent.x, recent.y, recent.width, recent.height, 14, CRM.glassCard, CRM.border)
    write(context, tr('Ostatnie leady', 'Latest leads'), recent.x + 24, recent.y + 48, { size: 21, weight: 620, color: CRM.text })
    const quick = { x: DASH_SLOTS.funnel.x, y: 836, width: DASH_SLOTS.funnel.width, height: 464 }
    card(context, quick.x, quick.y, quick.width, quick.height, 14, CRM.glassCard, CRM.border)
    write(context, tr('Szybkie działania', 'Quick actions'), quick.x + 24, quick.y + 48, { size: 21, weight: 620, color: CRM.text })
    const actions: [string, string][] = [
      [tr('Lista leadów', 'Lead list'), tr('Wyszukiwanie i filtry', 'Search and filters')],
      ['Kanban', tr('Etapy transakcji', 'Deal stages')],
      [tr('Oferty', 'Quotes'), tr('Oferty handlowe', 'Commercial proposals')],
      ['Follow-up', tr('Sekwencje i odpowiedzi', 'Sequences and replies')],
    ]
    actions.forEach(([label, hint], i) => {
      const y = quick.y + 76 + i * 94
      card(context, quick.x + 20, y, quick.width - 40, 80, 11, CRM.glassRow, CRM.border)
      write(context, label, quick.x + 40, y + 34, { size: 18, weight: 600, color: CRM.text })
      write(context, hint, quick.x + 40, y + 60, { size: 15, weight: 450, color: CRM.muted })
    })
  })
}

/* Цвет — имя токена: значение берётся при рисовании, после setCrmTheme. Строка
   цвета, взятая при загрузке модуля, осталась бы тёмной темой (в светлой «312» и
   «48» были белым по белому). */
const KPI = (): [string, string, string, 'text' | 'coral' | 'green' | 'teal' | 'violet'][] => [
  [tr('Wszystkich leadów', 'Leads in total'), '312', tr('Wygrane 41 · przegrane 23', 'Won 41 · lost 23'), 'text'],
  [tr('Leadów w tym miesiącu', 'Leads this month'), '48', tr('Poprzedni miesiąc: 39', 'Last month: 39'), 'text'],
  [tr('Gorących', 'Hot'), '27', tr('Scoring 70 i więcej', 'Score 70 and above'), 'coral'],
  [tr('Konwersja', 'Conversion'), '18%', tr('Średni cykl transakcji 34 dn.', 'Average deal cycle 34 d'), 'green'],
  ['Pipeline', '1,2 mln zł', tr('Suma aktywnych transakcji', 'Value of active deals'), 'teal'],
  ['MRR', '86 tys. zł', tr('Abonamenty z wygranych transakcji', 'Subscriptions from won deals'), 'violet'],
]

export function crmKpiTile(index: number): CanvasTexture | null {
  const kpi = KPI()
  const [label, value, hint, token] = kpi[index] ?? kpi[0]!
  const color = CRM[token]
  const scale = 2
  return paint(KPI_WIDTH * scale, KPI_HEIGHT * scale, (context) => {
    context.scale(scale, scale)
    card(context, 1, 1, KPI_WIDTH - 2, KPI_HEIGHT - 2, 14, CRM.glassTile, CRM.border)
    write(context, label, 20, 36, { size: 14, weight: 560, color: CRM.muted })
    write(context, value, 20, 86, { size: 34, weight: 700, color, tracking: -0.5 })
    write(context, hint, 20, 118, { size: 12.5, weight: 450, color: CRM.dim })
  })
}

export function crmTodayCard(): CanvasTexture | null {
  const { width, height } = DASH_SLOTS.today
  return paintClose(width, height, (context) => {
    card(context, 1, 1, width - 2, height - 2, 14, CRM.glassTile, CRM.border)
    write(context, tr('Na dziś', 'For today'), 24, 50, { size: 22, weight: 620, color: CRM.text })
    write(context, tr('Kolejność ustala silnik priorytetów', 'The order comes from the priority engine'), 24, 82, { size: 15, weight: 450, color: CRM.muted })
    const segment = { x: width - 24 - 220, y: 30, width: 220, height: 44 }
    card(context, segment.x, segment.y, segment.width, segment.height, 10, CRM.input, CRM.border)
    round(context, segment.x + 4, segment.y + 4, 106, 36, 8)
    context.fillStyle = CRM.hover
    context.fill()
    write(context, tr('Moje', 'Mine'), segment.x + 57, segment.y + 29, { size: 15, weight: 600, color: CRM.text, align: 'center' })
    write(context, tr('Wszystkie', 'All'), segment.x + 165, segment.y + 29, { size: 15, weight: 500, color: CRM.muted, align: 'center' })
  })
}

const TODAY: [string, string, string, string, string, 'coral' | 'amber'][] = [
  ['MZ', 'Marek Zieliński', 'Zieliński Logistyka sp. z o.o.', 'Negocjacje', '92', 'coral'],
  ['KW', 'Katarzyna Wójcik', 'Wójcik Meble S.A.', 'Oferta wysłana', '84', 'coral'],
  ['PK', 'Piotr Kaczmarek', 'Kaczmarek Transport', 'Spotkanie', '76', 'amber'],
  ['AL', 'Agnieszka Lewandowska', 'Lewandowska Studio', 'W kontakcie', '71', 'amber'],
]

export function crmTodayRow(index: number): CanvasTexture | null {
  const [initials, name, company, stage, score, scoreTone] = TODAY[index] ?? TODAY[0]!
  const { width, height } = DASH_SLOTS.todayRows[0]!
  const scale = 2
  return paint(width * scale, height * scale, (context) => {
    context.scale(scale, scale)
    card(context, 1, 1, width - 2, height - 2, 12, CRM.glassRow, CRM.border)
    avatar(context, initials, 18, 18, 56, CRM.teal, CRM.tealDim)
    write(context, name, 92, 42, { size: 19, weight: 620, color: CRM.text })
    write(context, company, 92, 68, { size: 15, weight: 450, color: CRM.muted })
    const stageWidth = chip(context, stageLabel(stage), 560, 28, 14, CRM.blue, CRM.blueDim)
    chip(context, score, 560 + stageWidth + 12, 28, 14, TONES[scoreTone].base, TONES[scoreTone].dim)
    const button = { x: width - 20 - 132, y: 22, width: 132, height: 48 }
    card(context, button.x, button.y, button.width, button.height, 10, CRM.tealDim, TONES.teal.line)
    write(context, tr('Zadzwoń', 'Call'), button.x + button.width / 2, button.y + 31, { size: 16, weight: 650, color: CRM.teal, align: 'center' })
  })
}

export const FUNNEL: [string, number][] = [
  ['Nowy', 1],
  ['W kontakcie', 0.72],
  ['Spotkanie', 0.48],
  ['Oferta wysłana', 0.34],
  ['Negocjacje', 0.21],
  ['Wygrany', 0.13],
]

/** Карточка воронки: подписи и доли. Сами столбики — 3D-плиты, растут отдельно. */
export function crmFunnelCard(): CanvasTexture | null {
  const { width, height } = DASH_SLOTS.funnel
  return paintClose(width, height, (context) => {
    card(context, 1, 1, width - 2, height - 2, 14, CRM.glassTile, CRM.border)
    write(context, tr('Lejek sprzedaży', 'Sales funnel'), 24, 50, { size: 22, weight: 620, color: CRM.text })
    write(context, tr('Udział w stosunku do etapu „Nowy”', 'Share of the New stage'), 24, 82, { size: 14, weight: 450, color: CRM.muted })
    FUNNEL.forEach(([label, share], i) => {
      const y = 132 + i * 54
      write(context, stageLabel(label), 24, y, { size: 15, weight: 520, color: CRM.muted })
      write(context, `${Math.round(share * 100)}%`, width - 24, y, { size: 15, weight: 600, color: CRM.text, align: 'right' })
      round(context, 24, y + 12, width - 48, 12, 6)
      context.fillStyle = CRM.hover
      context.fill()
    })
  })
}

/** Где на карточке воронки лежит дорожка i-го столбика, px. */
export function funnelTrack(index: number) {
  const { width } = DASH_SLOTS.funnel
  return { x: 24, y: 132 + index * 54 + 12, width: width - 48, height: 12 }
}

/* ══ Станции 06–24: набор интерфейса ════════════════════════════════════
   Размеры — в пикселях продукта, умноженных на k (масштаб двойника): в ролике
   экран стоит в пространстве, и мелкий шрифт продукта не прочесть. Цвета
   тонов, радиусы, бейджи, кнопки и полоса оценки — как в apps/web/src/ui. */

export type Tone = 'teal' | 'coral' | 'green' | 'amber' | 'blue' | 'violet' | 'gray'

export const TONES: Record<Tone, { base: string; dim: string; line: string }> = {
  teal: { base: CRM.teal, dim: 'rgba(89, 180, 189, 0.12)', line: 'rgba(89, 180, 189, 0.3)' },
  coral: { base: CRM.coral, dim: 'rgba(236, 106, 94, 0.12)', line: 'rgba(236, 106, 94, 0.35)' },
  green: { base: CRM.green, dim: 'rgba(76, 175, 125, 0.12)', line: 'rgba(76, 175, 125, 0.35)' },
  amber: { base: CRM.amber, dim: 'rgba(232, 168, 56, 0.12)', line: 'rgba(232, 168, 56, 0.35)' },
  blue: { base: CRM.blue, dim: 'rgba(122, 162, 247, 0.14)', line: 'rgba(122, 162, 247, 0.35)' },
  violet: { base: CRM.violet, dim: 'rgba(187, 154, 247, 0.14)', line: 'rgba(187, 154, 247, 0.35)' },
  gray: { base: '#9ca3af', dim: 'rgba(156, 163, 175, 0.12)', line: 'rgba(156, 163, 175, 0.35)' },
}

/* ── Тема двойников: v3.1 — тёмная, v3.2 — светлая ──────────────────────
   Токены светлой темы — apps/web/src/styles/tokens.css, [data-theme='light'].
   Художники читают CRM и TONES в момент рисования, поэтому тему переключаем
   подменой значений до того, как станции нарисуют текстуры (Finish.prepare). */

const CRM_DARK = { ...CRM }
const TONES_DARK = Object.fromEntries(Object.entries(TONES).map(([key, tone]) => [key, { ...tone }])) as typeof TONES

const CRM_LIGHT: typeof CRM = {
  bg: '#f3f4f8',
  card: '#ffffff',
  hover: '#dde0e8',
  input: '#ffffff',
  sidebar: '#f8f9fc',
  teal: '#2a9baa',
  tealDim: 'rgba(42, 155, 170, 0.1)',
  coral: '#d94f44',
  coralDim: 'rgba(217, 79, 68, 0.1)',
  green: '#059669',
  greenDim: 'rgba(5, 150, 105, 0.1)',
  amber: '#d97706',
  amberDim: 'rgba(217, 119, 6, 0.1)',
  blue: '#2563eb',
  blueDim: 'rgba(37, 99, 235, 0.1)',
  violet: '#7c3aed',
  violetDim: 'rgba(124, 58, 237, 0.1)',
  border: 'rgba(0, 0, 0, 0.09)',
  borderHover: 'rgba(0, 0, 0, 0.16)',
  text: '#111827',
  muted: '#4b5563',
  dim: '#6b7280',
  /* Светлое стекло: фон плавающей панели пропускает белое матовое стекло. */
  glassBg: 'rgba(243, 244, 248, 0.62)',
  glassSidebar: 'rgba(248, 249, 252, 0.55)',
  glassCard: 'rgba(255, 255, 255, 0.74)',
  glassTile: 'rgba(255, 255, 255, 0.88)',
  glassRow: 'rgba(250, 250, 252, 0.92)',
  /* Белая карточка на белой студии держится тонкой тёмной кромкой. */
  paper: '#ffffff',
  paperEdge: 'rgba(15, 23, 42, 0.12)',
  paperInk: '#111827',
  paperMuted: '#4b5563',
  paperAccent: '#2a9baa',
  paperWash: 'rgba(42, 155, 170, 0.12)',
  dots: 'rgba(42, 155, 170, 0.12)',
  slot: 'rgba(15, 23, 42, 0.02)',
  placeholder: 'rgba(15, 23, 42, 0.04)',
  rowTint: 'rgba(42, 155, 170, 0.05)',
  ghost: '#c3c7cf',
  ghostDim: '#cfd3d9',
  ghostEdge: 'rgba(15, 23, 42, 0.08)',
  tapped: 'rgba(42, 155, 170, 0.18)',
  safariBar: 'rgba(249, 249, 251, 0.94)',
  safariField: '#e5e6eb',
}

const TONES_LIGHT: typeof TONES = {
  teal: { base: '#2a9baa', dim: 'rgba(42, 155, 170, 0.1)', line: 'rgba(42, 155, 170, 0.35)' },
  coral: { base: '#d94f44', dim: 'rgba(217, 79, 68, 0.1)', line: 'rgba(217, 79, 68, 0.35)' },
  green: { base: '#059669', dim: 'rgba(5, 150, 105, 0.1)', line: 'rgba(5, 150, 105, 0.35)' },
  amber: { base: '#d97706', dim: 'rgba(217, 119, 6, 0.1)', line: 'rgba(217, 119, 6, 0.35)' },
  blue: { base: '#2563eb', dim: 'rgba(37, 99, 235, 0.1)', line: 'rgba(37, 99, 235, 0.35)' },
  violet: { base: '#7c3aed', dim: 'rgba(124, 58, 237, 0.1)', line: 'rgba(124, 58, 237, 0.35)' },
  gray: { base: '#64748b', dim: 'rgba(100, 116, 139, 0.1)', line: 'rgba(100, 116, 139, 0.35)' },
}

/** Токены двойников под тему мира. */
export function setCrmTheme(theme: 'light' | 'dark') {
  Object.assign(CRM, theme === 'light' ? CRM_LIGHT : CRM_DARK)
  const tones = theme === 'light' ? TONES_LIGHT : TONES_DARK
  for (const key of Object.keys(TONES) as Tone[]) Object.assign(TONES[key], tones[key])
}

/** Этапы воронки и их тона (packages/shared/src/domain/labels.ts). */
export const STAGE: Record<string, Tone> = {
  Nowy: 'teal',
  'W kontakcie': 'amber',
  Spotkanie: 'blue',
  'Oferta wysłana': 'violet',
  Negocjacje: 'coral',
  Wygrany: 'green',
  Przegrany: 'gray',
}

/** Цвет оценки: 70+ коралловый, 40+ янтарный, ниже — синий (ScoreBar.tsx). */
export const scoreTone = (score: number): Tone => (score >= 70 ? 'coral' : score >= 40 ? 'amber' : 'blue')

const AVATAR_TONES: Tone[] = ['teal', 'blue', 'violet', 'amber', 'green', 'coral']

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
}

/** Аватар продукта: тон стабилен по имени (ui/Avatar.tsx). */
export function toneAvatar(context: CanvasRenderingContext2D, name: string, x: number, y: number, size: number) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997
  const tone = TONES[AVATAR_TONES[hash % AVATAR_TONES.length] ?? 'teal']
  context.beginPath()
  context.arc(x + size / 2, y + size / 2, size / 2 - 0.5, 0, Math.PI * 2)
  context.fillStyle = tone.dim
  context.fill()
  context.lineWidth = Math.max(1, size / 30)
  context.strokeStyle = tone.line
  context.stroke()
  write(context, initialsOf(name), x + size / 2, y + size * 0.64, { size: size * 0.38, weight: 650, color: tone.base, align: 'center' })
}

/** Бейдж продукта: радиус 5, тон-dim, рамка тона 35%. Возвращает ширину. */
export function badge(context: CanvasRenderingContext2D, text: string, x: number, y: number, tone: Tone, k: number, size: 'md' | 'sm' = 'md'): number {
  const font = (size === 'md' ? 11 : 10) * k
  context.font = `600 ${font}px "Inter Variable", Inter, sans-serif`
  const width = context.measureText(text).width + (size === 'md' ? 14 : 10) * k
  const height = font * 1.45 + (size === 'md' ? 4 : 2) * k
  round(context, x, y, width, height, 5 * k)
  context.fillStyle = TONES[tone].dim
  context.fill()
  context.lineWidth = Math.max(1, k)
  context.strokeStyle = TONES[tone].line
  context.stroke()
  write(context, text, x + width / 2, y + height * 0.7, { size: font, weight: 600, color: TONES[tone].base, align: 'center' })
  return width
}

/** Подпись блока: 11px, заглавные, разрядка .06em, приглушённая. */
export function caps(context: CanvasRenderingContext2D, text: string, x: number, y: number, k: number, color = CRM.muted, align: CanvasTextAlign = 'left') {
  return write(context, text, x, y, { size: 11 * k, weight: 520, color, upper: true, tracking: 0.66 * k, align })
}

/** Полоса оценки: дорожка 6px, заливка тона, число справа. */
export function scoreBar(context: CanvasRenderingContext2D, x: number, y: number, width: number, score: number, k: number, number = true, fill = true) {
  const tone = TONES[scoreTone(score)]
  const track = number ? width - 32 * k : width
  round(context, x, y, track, 6 * k, 3 * k)
  context.fillStyle = CRM.hover
  context.fill()
  if (fill) {
    round(context, x, y, track * (score / 100), 6 * k, 3 * k)
    context.fillStyle = tone.base
    context.fill()
  }
  if (number) write(context, String(score), x + width, y + 6.5 * k, { size: 12 * k, weight: 650, color: tone.base, align: 'right' })
}

export type ButtonKind = 'primary' | 'outline' | 'danger' | 'ghost'

/** Кнопка продукта: 34/28px, радиус 8, полужирная. Возвращает ширину. */
export function button(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  kind: ButtonKind,
  k: number,
  options: { icon?: IconName; width?: number; size?: 'md' | 'sm'; align?: 'left' | 'right' } = {},
): number {
  const sm = options.size === 'sm'
  const height = (sm ? 28 : 34) * k
  const font = (sm ? 12 : 13) * k
  context.font = `600 ${font}px "Inter Variable", Inter, sans-serif`
  const iconSize = (sm ? 14 : 16) * k
  const inner = context.measureText(label).width + (options.icon ? iconSize + 7 * k : 0)
  const width = options.width ?? inner + (sm ? 20 : 28) * k
  const left = options.align === 'right' ? x - width : x
  const fill = kind === 'primary' ? CRM.teal : kind === 'danger' ? TONES.coral.dim : kind === 'outline' ? CRM.card : 'rgba(0,0,0,0)'
  const border = kind === 'primary' ? CRM.teal : kind === 'danger' ? TONES.coral.line : kind === 'outline' ? CRM.borderHover : 'rgba(0,0,0,0)'
  const color = kind === 'primary' ? CRM.bg : kind === 'danger' ? CRM.coral : kind === 'outline' ? CRM.text : CRM.muted
  round(context, left, y, width, height, 8 * k)
  context.fillStyle = fill
  context.fill()
  context.lineWidth = Math.max(1, k)
  context.strokeStyle = border
  context.stroke()
  let cursor = left + (width - inner) / 2
  if (options.icon) {
    icon(context, options.icon, cursor, y + (height - iconSize) / 2, iconSize, color)
    cursor += iconSize + 7 * k
  }
  write(context, label, cursor, y + height / 2 + font * 0.36, { size: font, weight: 600, color })
  return width
}

/** Заголовок блока (SectionTitle): иконка бирюзой, 15px, счётчик, подсказка. */
export function sectionTitle(
  context: CanvasRenderingContext2D,
  name: IconName,
  title: string,
  x: number,
  y: number,
  k: number,
  extra: { count?: string; hint?: string; color?: string } = {},
) {
  icon(context, name, x, y - 14 * k, 16 * k, extra.color ?? CRM.teal)
  const width = write(context, title, x + 24 * k, y, { size: 15 * k, weight: 620, color: CRM.text })
  let right = x + 24 * k + width + 8 * k
  if (extra.count) {
    context.font = `600 ${11 * k}px "Inter Variable", Inter, sans-serif`
    const pill = context.measureText(extra.count).width + 12 * k
    round(context, right, y - 13 * k, pill, 17 * k, 8.5 * k)
    context.fillStyle = CRM.hover
    context.fill()
    write(context, extra.count, right + pill / 2, y - 0.5 * k, { size: 11 * k, weight: 600, color: CRM.muted, align: 'center' })
    right += pill + 8 * k
  }
  if (extra.hint) write(context, extra.hint, x, y + 22 * k, { size: 12 * k, weight: 450, color: CRM.muted })
}

/** Карточка продукта: радиус 12, фон card, тонкая рамка. */
export function panel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, k: number, fill = CRM.card, border = CRM.border) {
  round(context, x, y, width, height, 12 * k)
  context.fillStyle = fill
  context.fill()
  context.lineWidth = Math.max(1, k)
  context.strokeStyle = border
  context.stroke()
}

/* ── Иконки: упрощённые lucide из кода продукта, штрихом ──────────────── */

export type IconName =
  | 'userPlus'
  | 'thumbsDown'
  | 'ban'
  | 'x'
  | 'phone'
  | 'phoneOff'
  | 'phoneMissed'
  | 'phoneCall'
  | 'mail'
  | 'mailX'
  | 'globe'
  | 'target'
  | 'user'
  | 'zap'
  | 'history'
  | 'ghost'
  | 'alarm'
  | 'clock'
  | 'users'
  | 'calendar'
  | 'file'
  | 'fileUp'
  | 'arrowRight'
  | 'check'
  | 'flame'
  | 'search'
  | 'plus'
  | 'more'
  | 'send'
  | 'pen'
  | 'note'
  | 'archive'
  | 'server'
  | 'key'
  | 'languages'
  | 'building'
  | 'map'
  | 'shield'
  | 'sparkles'
  | 'link'
  | 'kanban'
  | 'list'
  | 'wallet'
  | 'download'
  | 'menu'
  | 'home'
  | 'chevron'

export function icon(context: CanvasRenderingContext2D, name: IconName, x: number, y: number, size: number, color: string, weight = 0.09) {
  const s = size
  const c = context
  c.save()
  c.translate(x, y)
  c.strokeStyle = color
  c.fillStyle = color
  c.lineWidth = Math.max(1, s * weight)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const line = (points: [number, number][]) => {
    c.beginPath()
    points.forEach(([px, py], i) => (i === 0 ? c.moveTo(px * s, py * s) : c.lineTo(px * s, py * s)))
    c.stroke()
  }
  const circle = (cx: number, cy: number, r: number, fill = false) => {
    c.beginPath()
    c.arc(cx * s, cy * s, r * s, 0, Math.PI * 2)
    if (fill) c.fill()
    else c.stroke()
  }
  const rect = (rx: number, ry: number, rw: number, rh: number, rr: number) => {
    round(c, rx * s, ry * s, rw * s, rh * s, rr * s)
    c.stroke()
  }
  const handset = () => {
    c.beginPath()
    c.moveTo(0.22 * s, 0.12 * s)
    c.quadraticCurveTo(0.08 * s, 0.14 * s, 0.1 * s, 0.3 * s)
    c.quadraticCurveTo(0.2 * s, 0.72 * s, 0.7 * s, 0.9 * s)
    c.quadraticCurveTo(0.86 * s, 0.92 * s, 0.88 * s, 0.78 * s)
    c.lineTo(0.72 * s, 0.64 * s)
    c.lineTo(0.6 * s, 0.72 * s)
    c.quadraticCurveTo(0.42 * s, 0.62 * s, 0.3 * s, 0.42 * s)
    c.lineTo(0.38 * s, 0.3 * s)
    c.closePath()
    c.stroke()
  }
  switch (name) {
    case 'userPlus':
      circle(0.36, 0.32, 0.17)
      c.beginPath()
      c.arc(0.36 * s, 0.95 * s, 0.33 * s, Math.PI * 1.1, Math.PI * 1.9)
      c.stroke()
      line([[0.8, 0.3], [0.8, 0.62]])
      line([[0.64, 0.46], [0.96, 0.46]])
      break
    case 'user':
      circle(0.5, 0.32, 0.18)
      c.beginPath()
      c.arc(0.5 * s, 0.98 * s, 0.36 * s, Math.PI * 1.12, Math.PI * 1.88)
      c.stroke()
      break
    case 'users':
      circle(0.36, 0.34, 0.15)
      c.beginPath()
      c.arc(0.36 * s, 0.98 * s, 0.3 * s, Math.PI * 1.12, Math.PI * 1.88)
      c.stroke()
      c.beginPath()
      c.arc(0.66 * s, 0.34 * s, 0.13 * s, -Math.PI * 0.5, Math.PI * 0.5)
      c.stroke()
      line([[0.78, 0.66], [0.92, 0.86]])
      break
    case 'thumbsDown':
      rect(0.1, 0.12, 0.18, 0.46, 0.04)
      line([[0.28, 0.14], [0.72, 0.12], [0.88, 0.5], [0.6, 0.54], [0.62, 0.84], [0.5, 0.88], [0.28, 0.56]])
      break
    case 'ban':
      circle(0.5, 0.5, 0.38)
      line([[0.23, 0.23], [0.77, 0.77]])
      break
    case 'x':
      line([[0.22, 0.22], [0.78, 0.78]])
      line([[0.78, 0.22], [0.22, 0.78]])
      break
    case 'phone':
    case 'phoneCall':
      handset()
      if (name === 'phoneCall') {
        c.beginPath()
        c.arc(0.62 * s, 0.38 * s, 0.14 * s, -Math.PI * 0.5, 0)
        c.stroke()
        c.beginPath()
        c.arc(0.62 * s, 0.38 * s, 0.3 * s, -Math.PI * 0.5, 0)
        c.stroke()
      }
      break
    case 'phoneOff':
      handset()
      line([[0.1, 0.1], [0.9, 0.9]])
      break
    case 'phoneMissed':
      handset()
      line([[0.6, 0.12], [0.9, 0.42]])
      line([[0.9, 0.12], [0.6, 0.42]])
      break
    case 'mail':
    case 'mailX':
      rect(0.08, 0.2, 0.84, 0.6, 0.08)
      line([[0.1, 0.26], [0.5, 0.54], [0.9, 0.26]])
      if (name === 'mailX') {
        line([[0.62, 0.62], [0.86, 0.86]])
        line([[0.86, 0.62], [0.62, 0.86]])
      }
      break
    case 'globe':
      circle(0.5, 0.5, 0.4)
      c.beginPath()
      c.ellipse(0.5 * s, 0.5 * s, 0.17 * s, 0.4 * s, 0, 0, Math.PI * 2)
      c.stroke()
      line([[0.1, 0.5], [0.9, 0.5]])
      break
    case 'target':
      circle(0.5, 0.5, 0.4)
      circle(0.5, 0.5, 0.24)
      circle(0.5, 0.5, 0.07, true)
      break
    case 'zap':
      line([[0.56, 0.08], [0.2, 0.56], [0.5, 0.56], [0.44, 0.92], [0.8, 0.44], [0.5, 0.44], [0.56, 0.08]])
      break
    case 'history':
      c.beginPath()
      c.arc(0.52 * s, 0.5 * s, 0.38 * s, Math.PI * 0.95, Math.PI * 2.75)
      c.stroke()
      line([[0.1, 0.36], [0.14, 0.52], [0.3, 0.46]])
      line([[0.52, 0.3], [0.52, 0.52], [0.66, 0.6]])
      break
    case 'ghost':
      c.beginPath()
      c.moveTo(0.2 * s, 0.88 * s)
      c.lineTo(0.2 * s, 0.46 * s)
      c.arc(0.5 * s, 0.46 * s, 0.3 * s, Math.PI, 0)
      c.lineTo(0.8 * s, 0.88 * s)
      c.lineTo(0.68 * s, 0.78 * s)
      c.lineTo(0.56 * s, 0.88 * s)
      c.lineTo(0.44 * s, 0.78 * s)
      c.lineTo(0.32 * s, 0.88 * s)
      c.closePath()
      c.stroke()
      circle(0.4, 0.46, 0.035, true)
      circle(0.6, 0.46, 0.035, true)
      break
    case 'alarm':
    case 'clock':
      circle(0.5, 0.54, 0.34)
      line([[0.5, 0.36], [0.5, 0.56], [0.62, 0.64]])
      if (name === 'alarm') {
        line([[0.12, 0.2], [0.26, 0.08]])
        line([[0.88, 0.2], [0.74, 0.08]])
      }
      break
    case 'calendar':
      rect(0.12, 0.18, 0.76, 0.7, 0.1)
      line([[0.12, 0.4], [0.88, 0.4]])
      line([[0.34, 0.08], [0.34, 0.26]])
      line([[0.66, 0.08], [0.66, 0.26]])
      break
    case 'file':
    case 'fileUp':
      c.beginPath()
      c.moveTo(0.58 * s, 0.08 * s)
      c.lineTo(0.2 * s, 0.08 * s)
      c.lineTo(0.2 * s, 0.92 * s)
      c.lineTo(0.8 * s, 0.92 * s)
      c.lineTo(0.8 * s, 0.3 * s)
      c.closePath()
      c.stroke()
      line([[0.58, 0.08], [0.58, 0.3], [0.8, 0.3]])
      if (name === 'fileUp') {
        line([[0.5, 0.78], [0.5, 0.48]])
        line([[0.38, 0.6], [0.5, 0.48], [0.62, 0.6]])
      } else {
        line([[0.34, 0.54], [0.66, 0.54]])
        line([[0.34, 0.7], [0.58, 0.7]])
      }
      break
    case 'arrowRight':
      line([[0.14, 0.5], [0.84, 0.5]])
      line([[0.56, 0.22], [0.84, 0.5], [0.56, 0.78]])
      break
    case 'chevron':
      line([[0.36, 0.22], [0.64, 0.5], [0.36, 0.78]])
      break
    case 'check':
      line([[0.16, 0.52], [0.4, 0.76], [0.86, 0.26]])
      break
    case 'flame':
      c.beginPath()
      c.moveTo(0.5 * s, 0.92 * s)
      c.quadraticCurveTo(0.18 * s, 0.9 * s, 0.2 * s, 0.6 * s)
      c.quadraticCurveTo(0.24 * s, 0.4 * s, 0.44 * s, 0.1 * s)
      c.quadraticCurveTo(0.5 * s, 0.34 * s, 0.62 * s, 0.4 * s)
      c.quadraticCurveTo(0.68 * s, 0.28 * s, 0.7 * s, 0.24 * s)
      c.quadraticCurveTo(0.84 * s, 0.46 * s, 0.8 * s, 0.64 * s)
      c.quadraticCurveTo(0.78 * s, 0.9 * s, 0.5 * s, 0.92 * s)
      c.stroke()
      break
    case 'search':
      circle(0.44, 0.44, 0.28)
      line([[0.65, 0.65], [0.88, 0.88]])
      break
    case 'plus':
      line([[0.5, 0.16], [0.5, 0.84]])
      line([[0.16, 0.5], [0.84, 0.5]])
      break
    case 'more':
      circle(0.2, 0.5, 0.07, true)
      circle(0.5, 0.5, 0.07, true)
      circle(0.8, 0.5, 0.07, true)
      break
    case 'send':
      line([[0.1, 0.46], [0.9, 0.1], [0.6, 0.9], [0.46, 0.56], [0.1, 0.46]])
      line([[0.46, 0.56], [0.9, 0.1]])
      break
    case 'pen':
      line([[0.2, 0.8], [0.26, 0.6], [0.7, 0.16], [0.86, 0.32], [0.42, 0.76], [0.2, 0.8]])
      break
    case 'note':
      rect(0.14, 0.14, 0.72, 0.72, 0.1)
      line([[0.32, 0.4], [0.68, 0.4]])
      line([[0.32, 0.58], [0.56, 0.58]])
      break
    case 'archive':
      rect(0.1, 0.16, 0.8, 0.2, 0.05)
      line([[0.16, 0.36], [0.16, 0.86], [0.84, 0.86], [0.84, 0.36]])
      line([[0.4, 0.54], [0.6, 0.54]])
      break
    case 'server':
      rect(0.12, 0.12, 0.76, 0.32, 0.08)
      rect(0.12, 0.56, 0.76, 0.32, 0.08)
      circle(0.26, 0.28, 0.04, true)
      circle(0.26, 0.72, 0.04, true)
      break
    case 'key':
      circle(0.3, 0.56, 0.17)
      line([[0.44, 0.46], [0.86, 0.18]])
      line([[0.72, 0.28], [0.8, 0.4]])
      line([[0.62, 0.34], [0.68, 0.44]])
      break
    case 'languages':
      line([[0.1, 0.22], [0.54, 0.22]])
      line([[0.32, 0.12], [0.32, 0.22]])
      c.beginPath()
      c.moveTo(0.44 * s, 0.22 * s)
      c.quadraticCurveTo(0.36 * s, 0.52 * s, 0.12 * s, 0.62 * s)
      c.stroke()
      line([[0.22, 0.36], [0.46, 0.58]])
      line([[0.5, 0.9], [0.7, 0.44], [0.9, 0.9]])
      line([[0.56, 0.76], [0.84, 0.76]])
      break
    case 'building':
      rect(0.2, 0.1, 0.6, 0.8, 0.06)
      for (const py of [0.28, 0.46, 0.64]) {
        line([[0.36, py], [0.4, py]])
        line([[0.6, py], [0.64, py]])
      }
      line([[0.44, 0.9], [0.44, 0.76], [0.56, 0.76], [0.56, 0.9]])
      break
    case 'map':
      c.beginPath()
      c.moveTo(0.5 * s, 0.92 * s)
      c.quadraticCurveTo(0.18 * s, 0.56 * s, 0.2 * s, 0.4 * s)
      c.arc(0.5 * s, 0.4 * s, 0.3 * s, Math.PI, 0)
      c.quadraticCurveTo(0.82 * s, 0.56 * s, 0.5 * s, 0.92 * s)
      c.stroke()
      circle(0.5, 0.4, 0.1)
      break
    case 'shield':
      c.beginPath()
      c.moveTo(0.5 * s, 0.08 * s)
      c.lineTo(0.84 * s, 0.2 * s)
      c.quadraticCurveTo(0.84 * s, 0.72 * s, 0.5 * s, 0.92 * s)
      c.quadraticCurveTo(0.16 * s, 0.72 * s, 0.16 * s, 0.2 * s)
      c.closePath()
      c.stroke()
      line([[0.34, 0.5], [0.46, 0.62], [0.68, 0.38]])
      break
    case 'sparkles':
      c.beginPath()
      c.moveTo(0.42 * s, 0.1 * s)
      c.quadraticCurveTo(0.46 * s, 0.46 * s, 0.8 * s, 0.5 * s)
      c.quadraticCurveTo(0.46 * s, 0.54 * s, 0.42 * s, 0.9 * s)
      c.quadraticCurveTo(0.38 * s, 0.54 * s, 0.06 * s, 0.5 * s)
      c.quadraticCurveTo(0.38 * s, 0.46 * s, 0.42 * s, 0.1 * s)
      c.stroke()
      break
    case 'link':
      rect(0.08, 0.36, 0.46, 0.28, 0.14)
      rect(0.46, 0.36, 0.46, 0.28, 0.14)
      break
    case 'kanban':
      rect(0.12, 0.12, 0.76, 0.76, 0.1)
      line([[0.36, 0.28], [0.36, 0.56]])
      line([[0.5, 0.28], [0.5, 0.72]])
      line([[0.64, 0.28], [0.64, 0.46]])
      break
    case 'list':
      for (const py of [0.26, 0.5, 0.74]) {
        circle(0.16, py, 0.04, true)
        line([[0.3, py], [0.88, py]])
      }
      break
    case 'wallet':
      rect(0.1, 0.22, 0.8, 0.62, 0.1)
      rect(0.6, 0.44, 0.3, 0.2, 0.06)
      break
    case 'download':
      line([[0.5, 0.12], [0.5, 0.64]])
      line([[0.3, 0.46], [0.5, 0.66], [0.7, 0.46]])
      line([[0.14, 0.8], [0.14, 0.88], [0.86, 0.88], [0.86, 0.8]])
      break
    case 'menu':
      line([[0.16, 0.28], [0.84, 0.28]])
      line([[0.16, 0.5], [0.84, 0.5]])
      line([[0.16, 0.72], [0.84, 0.72]])
      break
    case 'home':
      line([[0.12, 0.48], [0.5, 0.14], [0.88, 0.48]])
      line([[0.22, 0.4], [0.22, 0.86], [0.78, 0.86], [0.78, 0.4]])
      break
  }
  c.restore()
}

/** Холст с масштабом: рисуем в «пикселях двойника», текстура — scale× крупнее. */
function sharp(width: number, height: number, scale: number, draw: (context: CanvasRenderingContext2D, width: number, height: number) => void): CanvasTexture | null {
  return paint(width * scale, height * scale, (context) => {
    context.scale(scale, scale)
    draw(context, width, height)
  })
}

/* ── Герой и его данные: вымышленные, как в демо ─────────────────────────
   Marek Zieliński из демо-данных (lead-specs-early.ts, ld-01). Номера
   маскируем или берём с неверной контрольной суммой: такой NIP не может
   принадлежать настоящей фирме. */

export const HERO = {
  name: 'Marek Zieliński',
  position: 'Dyrektor operacyjny',
  company: 'Logistyka Wrocław S.A.',
  phone: '+48 600 000 184',
  email: 'm.zielinski@logistyka.example',
  score: 84,
  owner: 'Anna',
  service: 'iApply Workforce',
  offer: 'SIM/2026/017',
  invoice: 'FV/2026/0001',
  nip: '8943012766',
}

/* ══ 05 → 06 · Пункт меню «Kampanie» ═══════════════════════════════════
   Мостик v3.2: активный пункт бокового меню (как «Pulpit» на пульте) с
   вкладкой «Wyszukiwanie» (i18n/pl/campaigns.ts, tabs.search) отрывается от
   пульта и летит к панели кандидата — камера следит за ним. */

export const SEARCH_PILL = { width: 440, height: 92 }

export function crmSearchPill(): CanvasTexture | null {
  return sharp(SEARCH_PILL.width, SEARCH_PILL.height, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 20)
    context.fillStyle = CRM.card
    context.fill()
    context.fillStyle = TONES.teal.dim
    context.fill()
    context.lineWidth = 1.5
    context.strokeStyle = TONES.teal.line
    context.stroke()
    icon(context, 'search', 24, height / 2 - 15, 30, CRM.teal)
    const w = write(context, 'Kampanie', 68, height / 2 + 10, { size: 28, weight: 650, color: CRM.teal })
    icon(context, 'chevron', 68 + w + 8, height / 2 - 11, 22, CRM.muted)
    write(context, 'Wyszukiwanie', 68 + w + 36, height / 2 + 10, { size: 28, weight: 620, color: CRM.text })
  })
}

/* ══ 06 · Кандидат из реестров ══════════════════════════════════════════ */

/** Боковая панель кандидата («Kampanie → Wyszukiwanie»): 1,2 × 1,03 м. */
export const CANDIDATE = { width: 1200, height: 1030, k: 1.9 }

/** Поля реестров на панели кандидата (i18n outreach.facts.registry). */
const CAND_ROWS = (): [string, string][] => [
  [tr('Nazwa', 'Name'), HERO.company],
  [tr('Forma prawna', 'Legal form'), tr('Spółka akcyjna', 'Joint-stock company')],
  ['NIP', '894 ••• •• ••'],
  ['REGON', '93••••••1'],
  ['KRS', '0000 ••• •••'],
  [tr('Adres', 'Address'), 'Wrocław, dolnośląskie'],
  ['PKD', '52.29.C, 49.41.Z'],
  [tr('Status VAT', 'VAT status'), tr('Czynny', 'Active')],
]
/** Строка статуса VAT — значение зелёным. */
const VAT_ROW = 7

const CAND_PEOPLE = (): [string, string, string][] => [
  ['Ewa Wiśniewska', tr('Prezes Zarządu', 'President of the Board'), tr('Zarząd i prokura (KRS)', 'Management board (KRS)')],
  ['Tomasz Mazur', tr('Prokurent', 'Commercial proxy'), tr('Zarząd i prokura (KRS)', 'Management board (KRS)')],
]

/** Где что лежит на панели кандидата, px холста. */
export function candidateLayout() {
  const k = CANDIDATE.k
  const pad = 16 * k
  const rowH = 19.5 * k
  const top = 56 * k + 30 * k + 48 * k
  const rows = CAND_ROWS().map((_, i) => ({ x: pad + 104 * k, y: top + 30 * k + i * rowH, width: CANDIDATE.width - pad * 2 - 104 * k, height: rowH }))
  const checked = { x: pad, y: top + 30 * k + rows.length * rowH + 2 * k, width: CANDIDATE.width - pad * 2, height: 20 * k }
  const peopleTop = checked.y + checked.height + 12 * k
  const people = CAND_PEOPLE().map((_, i) => ({ x: pad, y: peopleTop + 30 * k + i * 40 * k, width: CANDIDATE.width - pad * 2, height: 38 * k }))
  const fitTop = people[people.length - 1]!.y + 40 * k + 8 * k
  const fit = { x: pad, y: fitTop + 30 * k, width: CANDIDATE.width - pad * 2, height: 26 * k }
  const addButton = { x: pad, y: 56 * k + 30 * k, width: 150 * k, height: 34 * k }
  return { k, pad, top, rows, checked, peopleTop, people, fitTop, fit, addButton }
}

/** Кнопка «Dodaj do leadów» (i18n outreach.card.promote): по английской
    подписи 2D-сцена меряет кнопку — она уже польской. */
export const CANDIDATE_ADD = { pl: 'Dodaj do leadów', en: 'Add to leads' }

/** filled = false — поля ещё пустые («—»); true — данные из реестров. */
export function crmCandidate(filled: boolean): CanvasTexture | null {
  const { width, height } = CANDIDATE
  const L = candidateLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    panel(context, 1, 1, width - 2, height - 2, k, CRM.glassCard, CRM.borderHover)
    write(context, HERO.company, L.pad, 36 * k, { size: 15 * k, weight: 620, color: CRM.text })
    icon(context, 'x', width - L.pad - 16 * k, 22 * k, 16 * k, CRM.muted)
    context.fillStyle = CRM.border
    context.fillRect(0, 54 * k, width, Math.max(1, k))
    const status = write(context, filled ? tr('Sprawdzony', 'Screened') : tr('Znaleziony', 'Found'), L.pad, 56 * k + 20 * k, { size: 12 * k, weight: 500, color: CRM.text })
    write(context, tr('  ·  Czeka na weryfikację', '  ·  Awaiting review'), L.pad + status, 56 * k + 20 * k, { size: 12 * k, weight: 450, color: CRM.dim })
    let bx = L.pad
    bx += button(context, tr(CANDIDATE_ADD.pl, CANDIDATE_ADD.en), bx, L.addButton.y, 'primary', k, { icon: 'userPlus' }) + 8 * k
    bx += button(context, tr('Odrzuć', 'Reject'), bx, L.addButton.y, 'outline', k, { icon: 'thumbsDown' }) + 8 * k
    button(context, tr('Wyklucz na zawsze', 'Never contact again'), bx, L.addButton.y, 'danger', k, { icon: 'ban' })
    const block = (title: string, y: number, first = false) => {
      if (!first) {
        context.fillStyle = CRM.border
        context.fillRect(L.pad, y, width - L.pad * 2, Math.max(1, k))
      }
      caps(context, title, L.pad, y + 22 * k, k)
    }
    block(tr('Z rejestrów', 'From the registries'), L.top, true)
    CAND_ROWS().forEach(([label, value], i) => {
      const row = L.rows[i]!
      const base = row.y + row.height * 0.72
      write(context, label, L.pad, base, { size: 13 * k, weight: 450, color: CRM.dim })
      write(context, filled ? value : '—', row.x, base, { size: 13 * k, weight: filled ? 520 : 450, color: filled ? (i === VAT_ROW ? CRM.green : CRM.text) : CRM.dim })
    })
    write(context, filled ? tr('Sprawdzono w Białej liście 28.09.26, zapytanie Pv4n-7x2q1r.', 'Checked against the Biała lista on 09/28/26, request Pv4n-7x2q1r.') : tr('Nie sprawdzono jeszcze w Białej liście.', 'Not checked against the Biała lista yet.'), L.pad, L.checked.y + 14 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    block(tr('Osoby', 'People'), L.peopleTop)
    if (filled) {
      CAND_PEOPLE().forEach(([name, role, tag], i) => {
        const row = L.people[i]!
        toneAvatar(context, name, row.x, row.y + 4 * k, 30 * k)
        const w1 = write(context, name, row.x + 40 * k, row.y + 16 * k, { size: 13 * k, weight: 560, color: CRM.text })
        const w2 = write(context, ` · ${role}`, row.x + 40 * k + w1, row.y + 16 * k, { size: 13 * k, weight: 450, color: CRM.muted })
        write(context, ` (${tag})`, row.x + 40 * k + w1 + w2, row.y + 16 * k, { size: 11 * k, weight: 450, color: CRM.dim })
        write(context, tr('Strona źródłowa', 'Source page'), row.x + 40 * k, row.y + 33 * k, { size: 12 * k, weight: 450, color: CRM.dim })
      })
    } else {
      write(context, tr('Brak danych o osobach', 'No people on record'), L.pad, L.people[0]!.y + 18 * k, { size: 13 * k, weight: 450, color: CRM.dim })
    }
    block(tr('Dopasowanie', 'Fit'), L.fitTop)
    if (filled) {
      const w = badge(context, tr('Klasa A', 'Grade A'), L.fit.x, L.fit.y + 2 * k, 'coral', k)
      scoreBar(context, L.fit.x + w + 12 * k, L.fit.y + 9 * k, L.fit.width - w - 12 * k, 86, k, true, true)
    } else {
      write(context, tr('Jeszcze nieoceniony', 'Not scored yet'), L.fit.x, L.fit.y + 16 * k, { size: 13 * k, weight: 450, color: CRM.dim })
    }
  })
}

/** Карточки источников (О4, белые): номер, имя реестра, что из него берём. */
export const SOURCES: [string, string, IconName][] = [
  ['Biała lista MF', 'Status VAT', 'shield'],
  ['KRS', 'Zarząd i prokura', 'users'],
  ['REGON', 'Forma prawna i PKD', 'building'],
  ['OpenStreetMap', 'Adres i lokalizacja', 'map'],
]

export function crmSourceCard(index: number): CanvasTexture | null {
  const [name, hint, glyph] = SOURCES[index] ?? SOURCES[0]!
  return sharp(500, 170, 2, (context, width, height) => {
    card(context, 1, 1, width - 2, height - 2, 22, CRM.paper, CRM.paperEdge)
    write(context, String(index + 1).padStart(2, '0'), 26, 44, { size: 20, weight: 700, color: CRM.teal, tracking: 1 })
    round(context, width - 26 - 64, 26, 64, 64, 18)
    context.fillStyle = CRM.paperWash
    context.fill()
    icon(context, glyph, width - 26 - 52, 38, 40, CRM.paperAccent, 0.085)
    write(context, name, 26, height - 58, { size: 34, weight: 750, color: CRM.paperInk, tracking: -0.8 })
    write(context, hint, 26, height - 24, { size: 20, weight: 520, color: CRM.paperMuted })
  })
}

/* ══ 07 · «Leady» и оценка ═══════════════════════════════════════════════ */

/** Экран «Leady»: 1,6 × 1,03 м. Первая строка пустая: в неё влетает Marek. */
export const LEADS = { width: 1600, height: 1030, k: 1.9 }

export const LEAD_ROWS: [string, string, string, number, string][] = [
  [HERO.name, HERO.company, 'Nowy', HERO.score, '45 tys. zł'],
  ['Katarzyna Wójcik', 'Wójcik Meble S.A.', 'Oferta wysłana', 79, '32 tys. zł'],
  ['Piotr Kaczmarek', 'Kaczmarek Transport', 'Spotkanie', 76, '65 tys. zł'],
  ['Agnieszka Lewandowska', 'Lewandowska Studio', 'W kontakcie', 71, '25 tys. zł'],
  ['Tomasz Wójcik', 'Bud-Dom Hurt', 'Nowy', 64, '2,2 tys. zł'],
  ['Joanna Kowalczyk', 'Kowalczyk Logistics', 'Negocjacje', 58, '45 tys. zł'],
  ['Rafał Nowicki', 'Nowicki Agro', 'W kontakcie', 42, '18 tys. zł'],
]

export function leadsLayout() {
  const k = LEADS.k
  const left = 24 * k
  const tableTop = 56 * k + 52 * k + 44 * k
  const headerH = 30 * k
  const rowH = 46 * k
  const rows = LEAD_ROWS.map((_, i) => ({ x: left, y: tableTop + headerH + i * rowH, width: LEADS.width - left * 2, height: rowH }))
  const columns = { lead: left + 12 * k, status: left + 330 * k, score: left + 450 * k, amount: left + 640 * k, owner: left + 700 * k }
  return { k, left, tableTop, headerH, rowH, rows, columns }
}

function leadRow(context: CanvasRenderingContext2D, index: number, x: number, y: number, height: number, k: number, columns: ReturnType<typeof leadsLayout>['columns'], left: number) {
  const [name, company, stage, score, amount] = LEAD_ROWS[index] ?? LEAD_ROWS[0]!
  const dx = x - left
  toneAvatar(context, name, dx + columns.lead, y + (height - 30 * k) / 2, 30 * k)
  write(context, name, dx + columns.lead + 40 * k, y + height / 2 - 2 * k, { size: 13 * k, weight: 560, color: CRM.text })
  write(context, tr(`${company} · Sekwencja: dzień 0`, `${company} · Sequence: day 0`), dx + columns.lead + 40 * k, y + height / 2 + 13 * k, { size: 11 * k, weight: 450, color: CRM.dim })
  badge(context, stageLabel(stage), dx + columns.status, y + height / 2 - 10 * k, STAGE[stage] ?? 'gray', k)
  /* Полоса 110, а не 150: число оценки в конце полосы иначе печаталось поверх
     суммы, выровненной вправо («84» на «45 tys. zł»). */
  scoreBar(context, dx + columns.score, y + height / 2 - 3 * k, 110 * k, score, k)
  write(context, amount, dx + columns.amount, y + height / 2 + 4 * k, { size: 12.5 * k, weight: 560, color: CRM.text, align: 'right' })
  toneAvatar(context, HERO.owner, dx + columns.owner, y + (height - 22 * k) / 2, 22 * k)
  write(context, index === 0 ? HERO.owner : ['Anna', 'Nikita', 'Anna', 'Nikita', 'Anna', 'Nikita'][index - 1] ?? 'Anna', dx + columns.owner + 30 * k, y + height / 2 + 4 * k, { size: 12 * k, weight: 450, color: CRM.muted })
}

export function crmLeadsList(): CanvasTexture | null {
  const { width, height } = LEADS
  const L = leadsLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    write(context, tr('Leady', 'Leads'), L.left, 36 * k, { size: 15 * k, weight: 620, color: CRM.text })
    button(context, tr('Dodaj leada', 'Add lead'), width - L.left, 16 * k, 'primary', k, { icon: 'plus', size: 'sm', align: 'right' })
    context.fillStyle = CRM.border
    context.fillRect(0, 56 * k, width, Math.max(1, k))
    round(context, L.left, 66 * k, 300 * k, 34 * k, 8 * k)
    context.fillStyle = CRM.input
    context.fill()
    context.strokeStyle = CRM.border
    context.lineWidth = k
    context.stroke()
    icon(context, 'search', L.left + 10 * k, 75 * k, 16 * k, CRM.dim)
    write(context, tr('Szukaj (/ albo f)…', 'Search (/ or f)…'), L.left + 34 * k, 88 * k, { size: 13 * k, weight: 450, color: CRM.dim })
    let x = L.left + 316 * k
    for (const label of [tr('Zaznaczanie', 'Selection'), tr('Archiwum', 'Archive'), tr('Eksport CSV', 'Export CSV')]) x += button(context, label, x, 66 * k, 'outline', k) + 8 * k
    /* Вкладки статусов внутри карточки таблицы. */
    panel(context, L.left - 8 * k, L.tableTop - 44 * k, width - (L.left - 8 * k) * 2, height - L.tableTop + 40 * k, k, CRM.glassCard)
    const tabs: [string, string][] = [
      [tr('Wszystkie', 'All'), '48'],
      [stageLabel('Nowy'), '9'],
      [stageLabel('W kontakcie'), '12'],
      [stageLabel('Spotkanie'), '7'],
      [stageLabel('Oferta wysłana'), '6'],
      [stageLabel('Negocjacje'), '4'],
    ]
    let tx = L.left + 6 * k
    tabs.forEach(([label, count], i) => {
      const active = i === 0
      const w = write(context, label, tx, L.tableTop - 18 * k, { size: 13 * k, weight: active ? 600 : 500, color: active ? CRM.text : CRM.muted })
      context.font = `600 ${11 * k}px "Inter Variable", Inter, sans-serif`
      const pw = context.measureText(count).width + 12 * k
      round(context, tx + w + 6 * k, L.tableTop - 31 * k, pw, 17 * k, 8.5 * k)
      context.fillStyle = active ? TONES.teal.dim : CRM.hover
      context.fill()
      write(context, count, tx + w + 6 * k + pw / 2, L.tableTop - 18.5 * k, { size: 11 * k, weight: 600, color: active ? CRM.teal : CRM.muted, align: 'center' })
      if (active) {
        context.fillStyle = CRM.teal
        context.fillRect(tx, L.tableTop - 2 * k, w + pw + 6 * k, 2 * k)
      }
      tx += w + pw + 26 * k
    })
    context.fillStyle = CRM.border
    context.fillRect(L.left - 8 * k, L.tableTop, width - (L.left - 8 * k) * 2, Math.max(1, k))
    const c = L.columns
    const headY = L.tableTop + 20 * k
    caps(context, 'Lead', c.lead, headY, k)
    caps(context, 'Status', c.status, headY, k)
    caps(context, tr('Scoring', 'Score'), c.score, headY, k)
    caps(context, tr('Kwota', 'Amount'), c.amount, headY, k, CRM.muted, 'right')
    caps(context, tr('Opiekun', 'Owner'), c.owner, headY, k)
    L.rows.forEach((row, i) => {
      context.fillStyle = CRM.border
      context.fillRect(row.x - 8 * k, row.y + row.height, row.width + 16 * k, Math.max(1, k))
      if (i === 0) return
      leadRow(context, i, row.x, row.y, row.height, k, c, L.left)
    })
  })
}

/** Строка лида отдельно — летит со станции 06 и встаёт в первую строку. */
export function crmLeadRow(): CanvasTexture | null {
  const L = leadsLayout()
  const row = L.rows[0]!
  const k = L.k
  const pad = 8 * k
  return paint(row.width + pad * 2, row.height, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 10 * k)
    context.fillStyle = CRM.glassRow
    context.fill()
    context.lineWidth = k
    context.strokeStyle = CRM.borderHover
    context.stroke()
    leadRow(context, 0, pad, 0, height, k, L.columns, L.left)
  })
}

/* Карточка лида (станции 07, 08, 10): шапка и блоки как в LeadDetailPage —
   слева «Scoring», «Kontakt», «Sekwencja automatyczna», справа «Historia
   kontaktu». Каждый блок — своя текстура: блоки отрываются и расслаиваются. */

export const LEAD_CARD = { width: 1600, height: 1030, k: 1.75 }

export function leadCardLayout() {
  const k = LEAD_CARD.k
  const pad = 16 * k
  const header = { x: pad, y: pad, width: LEAD_CARD.width - pad * 2, height: 62 * k }
  const colTop = header.y + header.height + 12 * k
  const leftW = 360 * k
  const scoring = { x: pad, y: colTop, width: leftW, height: 132 * k }
  const contact = { x: pad, y: scoring.y + scoring.height + 12 * k, width: leftW, height: 176 * k }
  const sequence = { x: pad, y: contact.y + contact.height + 12 * k, width: leftW, height: LEAD_CARD.height - pad - (contact.y + contact.height + 12 * k) }
  const history = { x: pad + leftW + 14 * k, y: colTop, width: LEAD_CARD.width - pad * 2 - leftW - 14 * k, height: LEAD_CARD.height - pad - colTop }
  return { k, pad, header, scoring, contact, sequence, history }
}

/** Подложка карточки лида: фон, шапка и пустые места под блоки. */
export function crmLeadCardBase(stage = 'W kontakcie'): CanvasTexture | null {
  const { width, height } = LEAD_CARD
  const L = leadCardLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    const h = L.header
    panel(context, h.x, h.y, h.width, h.height, k, CRM.glassCard)
    button(context, tr('Wstecz', 'Back'), h.x + 12 * k, h.y + 17 * k, 'ghost', k, { size: 'sm' })
    toneAvatar(context, HERO.name, h.x + 88 * k, h.y + 13 * k, 36 * k)
    write(context, HERO.name, h.x + 134 * k, h.y + 29 * k, { size: 16 * k, weight: 620, color: CRM.text })
    write(context, `${tr(HERO.position, 'Operations Director')} · ${HERO.company}`, h.x + 134 * k, h.y + 48 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    badge(context, tr('Twój lead', 'Your lead'), h.x + 134 * k + 190 * k, h.y + 17 * k, 'teal', k, 'sm')
    let x = h.x + h.width - 12 * k
    for (const [label, glyph] of [
      [tr('Do archiwum', 'Archive'), 'archive'],
      [tr('Zaplanuj kontakt', 'Schedule a contact'), 'calendar'],
      [tr('Notatka', 'Note'), 'note'],
    ] as [string, IconName][]) {
      x -= button(context, label, x, h.y + 14 * k, 'outline', k, { icon: glyph, align: 'right' }) + 8 * k
    }
    round(context, x - 170 * k, h.y + 14 * k, 170 * k, 34 * k, 8 * k)
    context.fillStyle = CRM.input
    context.fill()
    context.strokeStyle = CRM.borderHover
    context.lineWidth = k
    context.stroke()
    context.beginPath()
    context.arc(x - 154 * k, h.y + 31 * k, 4 * k, 0, Math.PI * 2)
    context.fillStyle = TONES[STAGE[stage] ?? 'gray'].base
    context.fill()
    write(context, stageLabel(stage), x - 144 * k, h.y + 35.5 * k, { size: 13 * k, weight: 520, color: CRM.text })
    icon(context, 'chevron', x - 26 * k, h.y + 24 * k, 14 * k, CRM.muted)
    context.save()
    context.translate(x - 26 * k + 7 * k, h.y + 31 * k)
    context.rotate(Math.PI / 2)
    context.restore()
    for (const slot of [L.scoring, L.contact, L.sequence, L.history]) {
      round(context, slot.x, slot.y, slot.width, slot.height, 12 * k)
      context.fillStyle = CRM.slot
      context.fill()
      context.strokeStyle = CRM.border
      context.lineWidth = k
      context.stroke()
    }
  })
}

/** Блок «Scoring»: число, «na 100», бейдж температуры, полоса, подпись. */
export function drawScoring(context: CanvasRenderingContext2D, width: number, height: number, k: number, bar = true, fill: string = CRM.glassTile) {
  panel(context, 1, 1, width - 2, height - 2, k, fill)
  const pad = 16 * k
  sectionTitle(context, 'target', tr('Scoring', 'Score'), pad, 30 * k, k)
  icon(context, 'pen', width - pad - 16 * k, 16 * k, 15 * k, CRM.muted)
  const w = write(context, String(HERO.score), pad, 84 * k, { size: 34 * k, weight: 650, color: CRM.coral, tracking: -0.5 * k })
  write(context, tr('na 100', 'out of 100'), pad + w + 8 * k, 84 * k, { size: 12 * k, weight: 450, color: CRM.dim })
  context.font = `600 ${11 * k}px "Inter Variable", Inter, sans-serif`
  const hot = tr('Gorący', 'Hot')
  const bw = context.measureText(hot).width + 14 * k
  badge(context, hot, width - pad - bw, 64 * k, 'coral', k)
  scoreBar(context, pad, 98 * k, width - pad * 2, HERO.score, k, false, bar)
  caps(context, tr('Scoring automatyczny', 'Auto score'), pad, height - 12 * k, k, CRM.dim)
}

export function crmScoringBlock(scale = 2, bar = true): CanvasTexture | null {
  const L = leadCardLayout()
  return sharp(L.scoring.width / L.k * 2, L.scoring.height / L.k * 2, scale * L.k / 2, (context, width, height) => drawScoring(context, width, height, 2, bar))
}

/** Где на блоке «Scoring» лежит дорожка полосы, доли блока. */
export const SCORE_TRACK = { x: 16 / 360, y: (98 + 3) / 132, width: 328 / 360 }

export function crmContactBlock(): CanvasTexture | null {
  const k = 2
  /* Плотность 2: блок «Kontakt» в кадре подлётов 07, 08 и 10. */
  return sharp(360 * k, 176 * k, 2, (context, width, height) => {
    panel(context, 1, 1, width - 2, height - 2, k, CRM.glassTile)
    const pad = 14 * k
    sectionTitle(context, 'user', tr('Kontakt', 'Contact'), pad, 28 * k, k)
    button(context, tr('Edytuj', 'Edit'), width - pad, 12 * k, 'ghost', k, { icon: 'pen', size: 'sm', align: 'right' })
    const rows: [IconName, string, string, string][] = [
      ['phone', tr('Telefon', 'Phone'), HERO.phone, tr('Zadzwoń', 'Call')],
      ['mail', tr('E-mail', 'Email'), HERO.email, tr('Napisz', 'Write')],
      ['globe', tr('Strona', 'Website'), 'logistyka.example', tr('Otwórz', 'Open')],
    ]
    rows.forEach(([glyph, label, value, action], i) => {
      const y = 44 * k + i * 42 * k
      round(context, pad, y, width - pad * 2, 36 * k, 10 * k)
      context.fillStyle = CRM.input
      context.fill()
      icon(context, glyph, pad + 10 * k, y + 10 * k, 15 * k, CRM.teal)
      caps(context, label, pad + 34 * k, y + 14 * k, k * 0.85, CRM.dim)
      write(context, value, pad + 34 * k, y + 29 * k, { size: 12.5 * k, weight: 500, color: CRM.text })
      context.font = `600 ${11.5 * k}px "Inter Variable", Inter, sans-serif`
      const aw = context.measureText(action).width + 18 * k
      round(context, width - pad - 8 * k - aw, y + 5 * k, aw, 26 * k, 7 * k)
      context.fillStyle = TONES.teal.dim
      context.fill()
      context.strokeStyle = TONES.teal.line
      context.lineWidth = k
      context.stroke()
      write(context, action, width - pad - 8 * k - aw / 2, y + 22.5 * k, { size: 11.5 * k, weight: 600, color: CRM.teal, align: 'center' })
    })
  })
}

/** Где на блоке «Kontakt» кнопка «Zadzwoń», доли блока. */
export const CALL_BUTTON = { x: (360 - 14 - 8 - 28) / 360, y: (44 + 18) / 176 }

export function crmSequenceBlock(currentDay = 2, stopped = false): CanvasTexture | null {
  const L = leadCardLayout()
  const k = 2
  const h = L.sequence.height / L.k
  /* Плотность 2: блок в кадре подлётов 07 и 08. */
  return sharp(360 * k, h * k, 2, (context, width, height) => {
    panel(context, 1, 1, width - 2, height - 2, k, CRM.glassTile)
    const pad = 14 * k
    sectionTitle(context, 'zap', tr('Sekwencja automatyczna', 'Sequence'), pad, 28 * k, k)
    round(context, width - pad - 36 * k, 14 * k, 36 * k, 20 * k, 10 * k)
    context.fillStyle = stopped ? CRM.hover : CRM.teal
    context.fill()
    context.beginPath()
    context.arc(width - pad - (stopped ? 26 : 10) * k, 24 * k, 7 * k, 0, Math.PI * 2)
    /* Бегунок тумблера — bg-card, как в ui/fields.tsx (Toggle). */
    context.fillStyle = CRM.card
    context.fill()
    caps(context, tr('Skala dni', 'Day scale'), pad, 56 * k, k * 0.9, CRM.dim)
    const days = [0, 2, 4, 7, 14, 30, 60, 180]
    let x = pad
    days.forEach((day) => {
      const label = String(day)
      context.font = `600 ${12 * k}px "Inter Variable", Inter, sans-serif`
      const w = Math.max(32 * k, context.measureText(label).width + 14 * k)
      const current = day === currentDay && !stopped
      const passed = day < currentDay
      round(context, x, 64 * k, w, 28 * k, 12 * k)
      context.fillStyle = current ? TONES.teal.dim : passed ? CRM.hover : 'rgba(0,0,0,0)'
      context.fill()
      context.strokeStyle = current ? TONES.teal.line : CRM.border
      context.lineWidth = k
      context.stroke()
      write(context, label, x + w / 2, 83 * k, { size: 12 * k, weight: current ? 650 : 500, color: current ? CRM.teal : passed ? CRM.muted : CRM.dim, align: 'center' })
      x += w + 5 * k
    })
    write(context, stopped ? tr('Klient odpowiedział — kroki automatyczne zatrzymane.', 'The client replied — the automatic steps are stopped.') : tr(`Teraz dzień ${currentDay}. Następny krok — dzień 4.`, `Day ${currentDay} now. The next step is day 4.`), pad, 112 * k, { size: 12 * k, weight: 450, color: CRM.muted })
  })
}

export type HistoryKind = 'call-ok' | 'call-missed' | 'offer' | 'note' | 'mail-in'

/** Записи истории (i18n domain.callOutcome, activityKind; время — «сколько
    назад · дата», как ActivityTimeline в локали языка). */
const HISTORY_META = (): Record<HistoryKind, { title: string; label: string; tone: Tone; icon: IconName; body?: string; ago: string }> => ({
  'call-ok': { title: tr('Telefon: udało się dodzwonić', 'Call: got through'), label: tr('Rozmowa', 'Call'), tone: 'green', icon: 'phone', ago: tr('teraz · 28.09.26, 10:04', 'now · 09/28/26, 10:04 AM') },
  'call-missed': { title: tr('Telefon: nie udało się dodzwonić', 'Call: no answer'), label: tr('Nieodebrane', 'Missed call'), tone: 'coral', icon: 'phoneMissed', ago: tr('wczoraj · 27.09.26, 16:40', 'yesterday · 09/27/26, 04:40 PM') },
  offer: { title: tr(`Wysłano ofertę ${HERO.offer}`, `Quote ${HERO.offer} sent`), label: tr('E-mail wysłany', 'Email sent'), tone: 'blue', icon: 'mail', body: tr('iApply Workforce: wdrożenie w 3 magazynach', 'iApply Workforce: rollout in 3 warehouses'), ago: tr('teraz · 28.09.26, 11:20', 'now · 09/28/26, 11:20 AM') },
  note: { title: tr('Notatka', 'Note'), label: tr('Notatka', 'Note'), tone: 'amber', icon: 'note', body: tr('Trzy magazyny, 420 pracowników. Karty obchodu na papierze.', 'Three warehouses, 420 workers. Walk-round sheets on paper.'), ago: tr('3 dni temu · 25.09.26, 12:15', '3 days ago · 09/25/26, 12:15 PM') },
  'mail-in': { title: tr(`Re: Oferta ${HERO.offer}`, `Re: Quote ${HERO.offer}`), label: tr('E-mail', 'Email'), tone: 'blue', icon: 'mail', body: tr('Dzień dobry, czy możemy umówić się na krótkie demo?', 'Hello, could we book a short demo?'), ago: tr('teraz · 28.09.26, 12:02', 'now · 09/28/26, 12:02 PM') },
})

/** Запись истории контакта (ActivityTimeline): иконка тона, заголовок, время. */
export function drawHistoryEntry(context: CanvasRenderingContext2D, kind: HistoryKind, x: number, y: number, width: number, k: number, ago?: string) {
  const meta = HISTORY_META()[kind]
  const missed = kind === 'call-missed'
  const height = meta.body ? 70 * k : 54 * k
  round(context, x, y, width, height, 10 * k)
  context.fillStyle = missed ? TONES.coral.dim : CRM.input
  context.fill()
  context.strokeStyle = missed ? TONES.coral.line : CRM.border
  context.lineWidth = k
  context.stroke()
  const tone = TONES[meta.tone]
  context.beginPath()
  context.arc(x + 24 * k, y + 24 * k, 14 * k, 0, Math.PI * 2)
  context.fillStyle = tone.dim
  context.fill()
  icon(context, meta.icon, x + 16 * k, y + 16 * k, 16 * k, tone.base)
  write(context, meta.title, x + 48 * k, y + 22 * k, { size: 13 * k, weight: 560, color: CRM.text })
  write(context, ago ?? meta.ago, x + width - 12 * k, y + 22 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
  let footY = y + 42 * k
  if (meta.body) {
    write(context, meta.body, x + 48 * k, y + 40 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    footY = y + 58 * k
  }
  const w = write(context, meta.label, x + 48 * k, footY, { size: 11 * k, weight: 600, color: tone.base })
  write(context, ` · ${HERO.owner}`, x + 48 * k + w, footY, { size: 11 * k, weight: 450, color: CRM.dim })
  return height
}

export function historyEntryHeight(kind: HistoryKind, k: number): number {
  return HISTORY_META()[kind].body ? 70 * k : 54 * k
}

/** Плашка «Dobry moment na telefon» в блоке истории, логические px блока
    (ActivityTimeline.tsx: px-3 py-2, текст 12 px, строка 18 px). Блок двойника
    уже колонки продукта, и фраза в строку не помещается (обрезалась на «Na
    podstawie 212 po…»): выборка «Na podstawie…» — второй строкой. */
export const HISTORY_BANNER = { y: 70, height: 54, text: 34, line1: 24, line2: 42 }

/** Начало плашки и время (i18n leads.timeline.bestSlot, день — локаль языка):
    по ним 2D-сцена ставит подчёркивание под временем, поэтому обе пары здесь. */
export const HISTORY_BEST_SLOT = {
  pl: { before: 'Dobry moment na telefon: ', time: 'Wt, 10:00' },
  en: { before: 'Good time to call: ', time: 'Tue, 10:00' },
}

/** Блок «Historia kontaktu»: записи сверху вниз; top — место под новую запись.
    Плотность 2: блок — предмет подлётов на станциях 08 и 10. */
export function crmHistoryBlock(entries: HistoryKind[], options: { banner?: boolean; gap?: HistoryKind | null } = {}): CanvasTexture | null {
  const L = leadCardLayout()
  const k = 2
  const w = L.history.width / L.k
  const h = L.history.height / L.k
  return sharp(w * k, h * k, 2, (context, width, height) => {
    panel(context, 1, 1, width - 2, height - 2, k, CRM.glassTile)
    const pad = 16 * k
    sectionTitle(context, 'history', tr('Historia kontaktu', 'Contact history'), pad, 30 * k, k, { count: String(entries.length + 6), hint: tr('Telefony, wiadomości, spotkania i notatki przy leadzie', 'Calls, emails, meetings and notes on the lead') })
    let y = 70 * k
    if (options.banner) {
      const B = HISTORY_BANNER
      round(context, pad, y, width - pad * 2, B.height * k, 10 * k)
      context.fillStyle = TONES.teal.dim
      context.fill()
      context.strokeStyle = TONES.teal.line
      context.lineWidth = k
      context.stroke()
      icon(context, 'clock', pad + 10 * k, y + 11 * k, 16 * k, CRM.teal)
      /* Как в продукте: текст — text-fg, время — полужирным, выборка — text-muted. */
      const x = pad + B.text * k
      const S = HISTORY_BEST_SLOT
      const a = write(context, tr(S.pl.before, S.en.before), x, y + B.line1 * k, { size: 12 * k, weight: 500, color: CRM.text })
      const b = write(context, tr(S.pl.time, S.en.time), x + a, y + B.line1 * k, { size: 12 * k, weight: 700, color: CRM.text })
      write(context, tr(' — skuteczność 64%.', ' — 64% connect rate.'), x + a + b, y + B.line1 * k, { size: 12 * k, weight: 500, color: CRM.text })
      write(context, tr('Na podstawie 212 połączeń zespołu.', 'Based on 212 team calls.'), x, y + B.line2 * k, { size: 12 * k, weight: 450, color: CRM.muted })
      y += (B.height + 12) * k
    }
    if (options.gap) y += historyEntryHeight(options.gap, k) + 8 * k
    for (const kind of entries) {
      y += drawHistoryEntry(context, kind, pad, y, width - pad * 2, k) + 8 * k
      if (y > height - 60 * k) break
    }
  })
}

/** Где начинается первая запись истории, доли блока (с плашкой и без). */
export function historyFirstEntry(banner: boolean) {
  const L = leadCardLayout()
  const h = L.history.height / L.k
  const w = L.history.width / L.k
  return { x: 16 / w, y: (banner ? HISTORY_BANNER.y + HISTORY_BANNER.height + 12 : 70) / h, width: (w - 32) / w }
}

export function crmHistoryEntry(kind: HistoryKind): CanvasTexture | null {
  const L = leadCardLayout()
  const w = L.history.width / L.k - 32
  const k = 2
  const h = historyEntryHeight(kind, 1)
  /* Плотность 2, как у блока истории: запись садится в него под подлётом. */
  return sharp(w * k, h * k, 2, (context, width) => {
    drawHistoryEntry(context, kind, 0.5, 0.5, width - 1, k)
  })
}

/* ══ 09 · «Wymagają uwagi»: веер из четырёх карточек ════════════════════ */

/** en — английская пара (i18n priorities.attention): художник берёт её через tr. */
export const ATTENTION: { label: string; tone: Tone; icon: IconName; name: string; stage: string; score: number; advice: string; en: { label: string; advice: string } }[] = [
  {
    label: 'Trudno się dodzwonić',
    tone: 'amber',
    icon: 'phoneOff',
    name: HERO.name,
    stage: 'W kontakcie',
    score: HERO.score,
    advice: 'Seria 3 nieodebranych połączeń — napisz na Telegramie albo mailem i zaproponuj 15-minutowy slot',
    en: { label: 'Hard to reach', advice: '3 missed calls in a row — write on Telegram or by email and offer a 15-minute slot' },
  },
  {
    label: 'Porzucony',
    tone: 'coral',
    icon: 'ghost',
    name: 'Rafał Nowicki',
    stage: 'W kontakcie',
    score: 42,
    advice: 'Brak kontaktu od 24 dn. — wróć do leada mailem z nowym pretekstem',
    en: { label: 'Abandoned', advice: 'No contact for 24 d — win the lead back with an email and a fresh reason to talk' },
  },
  {
    label: 'Oferta bez odpowiedzi',
    tone: 'violet',
    icon: 'mailX',
    name: 'Katarzyna Wójcik',
    stage: 'Oferta wysłana',
    score: 79,
    advice: 'Oferta wysłana 9 dn. temu — zadzwoń i dopytaj, co budzi wątpliwości w wycenie',
    en: { label: 'Quote with no answer', advice: 'Quote sent 9 d ago — call and ask what questions are left on the estimate' },
  },
  {
    label: 'Przeterminowany kontakt',
    tone: 'coral',
    icon: 'alarm',
    name: 'Piotr Kaczmarek',
    stage: 'Spotkanie',
    score: 76,
    advice: 'Kontakt opóźniony o 2 dn. — skontaktuj się dziś albo przesuń datę w karcie',
    en: { label: 'Contact overdue', advice: 'Contact is 2 d overdue — get in touch today or move the date on the card' },
  },
]

/** Слова по ширине: перенос строк для холста. */
function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function writeWrapped(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, style: { size: number; weight?: number; color: string; lineHeight?: number }): number {
  context.font = `${style.weight ?? 500} ${style.size}px "Inter Variable", Inter, sans-serif`
  const lines = wrapLines(context, text, maxWidth)
  lines.forEach((line, i) => write(context, line, x, y + i * style.size * (style.lineHeight ?? 1.3), { size: style.size, weight: style.weight, color: style.color }))
  return lines.length
}

export const ATTENTION_CARD = { width: 420, height: 600 }

export function crmAttentionCard(index: number, side: 'front' | 'back'): CanvasTexture | null {
  const item = ATTENTION[index] ?? ATTENTION[0]!
  const tone = TONES[item.tone]
  return sharp(ATTENTION_CARD.width, ATTENTION_CARD.height, 1.6, (context, width, height) => {
    const label = tr(item.label, item.en.label)
    round(context, 1, 1, width - 2, height - 2, 22)
    context.fillStyle = CRM.glassCard
    context.fill()
    context.lineWidth = 2
    context.strokeStyle = tone.line
    context.stroke()
    const pad = 28
    if (side === 'front') {
      round(context, pad, pad, 72, 72, 18)
      context.fillStyle = tone.dim
      context.fill()
      icon(context, item.icon, pad + 16, pad + 16, 40, tone.base, 0.1)
      writeWrapped(context, label, pad, 160, width - pad * 2, { size: 36, weight: 650, color: tone.base, lineHeight: 1.15 })
      context.fillStyle = CRM.border
      context.fillRect(pad, 300, width - pad * 2, 2)
      toneAvatar(context, item.name, pad, 330, 56)
      writeWrapped(context, item.name, pad + 72, 356, width - pad * 2 - 72, { size: 27, weight: 620, color: CRM.text, lineHeight: 1.15 })
      const bw = badge(context, stageLabel(item.stage), pad, 420, STAGE[item.stage] ?? 'gray', 2)
      write(context, String(item.score), pad + bw + 14, 448, { size: 24, weight: 650, color: TONES[scoreTone(item.score)].base })
      scoreBar(context, pad, 500, width - pad * 2, item.score, 2, false)
      caps(context, tr('Wymagają uwagi', 'Need attention'), pad, height - 32, 2, CRM.dim)
    } else {
      write(context, label, pad, 64, { size: 24, weight: 650, color: tone.base })
      write(context, item.name, pad, 100, { size: 21, weight: 520, color: CRM.muted })
      context.fillStyle = CRM.border
      context.fillRect(pad, 126, width - pad * 2, 2)
      icon(context, 'sparkles', pad, 154, 34, CRM.teal)
      writeWrapped(context, tr(item.advice, item.en.advice), pad, 234, width - pad * 2, { size: 29, weight: 560, color: CRM.text, lineHeight: 1.32 })
      button(context, tr('Zadzwoń', 'Call'), pad, height - 92, 'primary', 2, { icon: 'phone', size: 'sm' })
    }
  })
}

/* ══ 10 · «Jak poszła rozmowa?» ══════════════════════════════════════════ */

export const CALL_DIALOG = { width: 420, height: 318 }

export function crmCallDialog(): CanvasTexture | null {
  return sharp(CALL_DIALOG.width, CALL_DIALOG.height, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 14)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    write(context, tr('Jak poszła rozmowa?', 'How did the call go?'), 20, 38, { size: 16, weight: 620, color: CRM.text })
    write(context, `${HERO.name} · ${HERO.phone}`, 20, 58, { size: 12, weight: 450, color: CRM.muted })
    icon(context, 'x', width - 36, 22, 14, CRM.muted)
    const options: [Tone, IconName, string, string][] = [
      ['green', 'phoneCall', tr('Dodzwoniłem się', 'Got through'), tr('rozmawialiśmy — zapiszemy kontakt', 'we talked — we’ll log the contact')],
      ['coral', 'phoneMissed', tr('Nie odebrał', 'No answer'), tr('brak kontaktu — trafi do „trudno złapać”', 'no answer — goes to “hard to reach”')],
      ['amber', 'alarm', tr('Oddzwonić później', 'Call back later'), tr('rozmawialiśmy, przypomnimy jutro rano', 'we talked, we’ll remind you tomorrow morning')],
    ]
    options.forEach(([toneName, glyph, label, hint], i) => {
      const tone = TONES[toneName]
      const y = 78 + i * 76
      round(context, 20, y, width - 40, 64, 12)
      context.fillStyle = CRM.card
      context.fill()
      context.strokeStyle = tone.line
      context.lineWidth = 1
      context.stroke()
      context.beginPath()
      context.arc(52, y + 32, 16, 0, Math.PI * 2)
      context.fillStyle = tone.dim
      context.fill()
      icon(context, glyph, 44, y + 24, 16, tone.base)
      write(context, label, 80, y + 29, { size: 14, weight: 560, color: CRM.text })
      write(context, hint, 80, y + 47, { size: 12, weight: 450, color: CRM.muted })
    })
  })
}

/** Где в диалоге кнопка «Dodzwoniłem się», доли диалога. */
export const CALL_OK = { x: 140 / 420, y: (78 + 32) / 318 }

/* ══ 11 · Канбан ═════════════════════════════════════════════════════════ */

export const KANBAN = { width: 2048, height: 1134, k: 1.7 }

const KANBAN_COLUMNS: [string, string[]][] = [
  ['Nowy', ['Tomasz Wójcik', 'Julia Adamska', 'Paweł Wróbel']],
  ['W kontakcie', [HERO.name, 'Agnieszka Lewandowska', 'Rafał Nowicki']],
  ['Spotkanie', ['Piotr Kaczmarek', 'Ewa Kamińska']],
  ['Oferta wysłana', ['Katarzyna Wójcik', 'Michał Zając']],
  ['Negocjacje', ['Joanna Kowalczyk']],
]

const KANBAN_DATA: Record<string, [string, string, number, string]> = {
  [HERO.name]: [HERO.company, 'Strona WWW', HERO.score, '45 tys. zł'],
  'Tomasz Wójcik': ['Bud-Dom Hurt', 'Allegro', 64, '2,2 tys. zł'],
  'Julia Adamska': ['Adamska Kadry', 'LinkedIn', 55, '25 tys. zł'],
  'Paweł Wróbel': ['Wróbel Taxi', 'Polecenie', 38, '12 tys. zł'],
  'Agnieszka Lewandowska': ['Lewandowska Studio', 'Konferencja', 71, '25 tys. zł'],
  'Rafał Nowicki': ['Nowicki Agro', 'Zimny telefon', 42, '18 tys. zł'],
  'Piotr Kaczmarek': ['Kaczmarek Transport', 'Polecenie', 76, '65 tys. zł'],
  'Ewa Kamińska': ['Kamińska Hurt', 'Strona WWW', 61, '32 tys. zł'],
  'Katarzyna Wójcik': ['Wójcik Meble S.A.', 'Konferencja', 79, '32 tys. zł'],
  'Michał Zając': ['Zając Dystrybucja', 'Google Ads', 52, '20 tys. zł'],
  'Joanna Kowalczyk': ['Kowalczyk Logistics', 'Polecenie', 58, '45 tys. zł'],
}

export function kanbanLayout() {
  const k = KANBAN.k
  const pad = 20 * k
  const top = 56 * k + 16 * k
  const gap = 12 * k
  const columnW = (KANBAN.width - pad * 2 - gap * 4) / 5
  const columns = KANBAN_COLUMNS.map((_, i) => ({ x: pad + i * (columnW + gap), y: top, width: columnW, height: KANBAN.height - top - pad }))
  const cardH = 92 * k
  const cardY = (column: number, slot: number) => ({ x: columns[column]!.x + 8 * k, y: top + 44 * k + slot * (cardH + 8 * k), width: columnW - 16 * k, height: cardH })
  return { k, pad, top, columns, cardH, cardY }
}

export function drawKanbanCard(context: CanvasRenderingContext2D, name: string, x: number, y: number, width: number, height: number, k: number) {
  const [company, source, score, amount] = KANBAN_DATA[name] ?? KANBAN_DATA[HERO.name]!
  round(context, x, y, width, height, 12 * k)
  context.fillStyle = CRM.glassRow
  context.fill()
  context.lineWidth = k
  context.strokeStyle = score >= 70 ? TONES.teal.line : CRM.border
  context.stroke()
  const pad = 10 * k
  write(context, name, x + pad, y + 22 * k, { size: 13 * k, weight: 620, color: CRM.text })
  write(context, company, x + pad, y + 38 * k, { size: 11 * k, weight: 450, color: CRM.muted })
  round(context, x + width - pad - 52 * k, y + 10 * k, 24 * k, 24 * k, 7 * k)
  context.fillStyle = TONES.teal.dim
  context.fill()
  icon(context, 'phone', x + width - pad - 47 * k, y + 15 * k, 14 * k, CRM.teal)
  icon(context, 'more', x + width - pad - 22 * k, y + 14 * k, 16 * k, CRM.muted)
  let bx = x + pad
  bx += badge(context, sourceLabel(source), bx, y + 48 * k, 'gray', k, 'sm') + 5 * k
  badge(context, 'iApply Workforce', bx, y + 48 * k, 'blue', k, 'sm')
  scoreBar(context, x + pad, y + 76 * k, 72 * k, score, k, true)
  write(context, amount, x + pad + 84 * k, y + 81 * k, { size: 11 * k, weight: 560, color: CRM.text })
  write(context, name === HERO.name ? HERO.owner : 'Nikita', x + width - pad, y + 81 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
}

/** Канбан без карточки героя (её рисует отдельная плита); after — счётчики
    колонок уже после переноса. */
export function crmKanban(after: boolean): CanvasTexture | null {
  const { width, height } = KANBAN
  const L = kanbanLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    icon(context, 'kanban', L.pad, 20 * k, 16 * k, CRM.teal)
    write(context, 'Kanban', L.pad + 24 * k, 34 * k, { size: 15 * k, weight: 620, color: CRM.text })
    write(context, tr('Przeciągnij kartę do innej kolumny — etap zmieni się od razu, z cofnięciem przy błędzie', 'Drag a card to another column — the stage changes at once and rolls back on error'), L.pad + 96 * k, 34 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    KANBAN_COLUMNS.forEach(([stage, names], i) => {
      const column = L.columns[i]!
      panel(context, column.x, column.y, column.width, column.height, k, CRM.glassCard)
      const tone = TONES[STAGE[stage] ?? 'gray']
      context.beginPath()
      context.arc(column.x + 16 * k, column.y + 22 * k, 3.5 * k, 0, Math.PI * 2)
      context.fillStyle = tone.base
      context.fill()
      const label = write(context, stageLabel(stage), column.x + 26 * k, column.y + 26 * k, { size: 12 * k, weight: 620, color: tone.base })
      let list = names.filter((name) => name !== HERO.name)
      if (after && stage === 'Spotkanie') list = [...list]
      const count = list.length + (stage === 'W kontakcie' && !after ? 1 : 0) + (stage === 'Spotkanie' && after ? 1 : 0)
      const cw = write(context, String(count), column.x + 34 * k + label, column.y + 26 * k, { size: 11 * k, weight: 500, color: CRM.muted })
      const hot = list.filter((name) => (KANBAN_DATA[name]?.[2] ?? 0) >= 70).length + ((stage === 'W kontakcie' && !after) || (stage === 'Spotkanie' && after) ? 1 : 0)
      if (hot) {
        icon(context, 'flame', column.x + 42 * k + label + cw, column.y + 16 * k, 12 * k, CRM.coral)
        write(context, String(hot), column.x + 56 * k + label + cw, column.y + 26 * k, { size: 11 * k, weight: 600, color: CRM.coral })
      }
      context.fillStyle = CRM.border
      context.fillRect(column.x, column.y + 38 * k, column.width, Math.max(1, k))
      /* Карточки: в колонке «W kontakcie» место героя пустое, остальные
         сдвинуты вниз; в «Spotkanie» после переноса герой встаёт в конец. */
      list.forEach((name, slot) => {
        const shift = stage === 'W kontakcie' ? slot + 1 : slot
        const place = L.cardY(i, shift)
        drawKanbanCard(context, name, place.x, place.y, place.width, place.height, k)
      })
    })
  })
}

/** Карточка героя на канбане — отдельная плита, которую тащит курсор. */
export function crmKanbanCard(): CanvasTexture | null {
  const L = kanbanLayout()
  const place = L.cardY(0, 0)
  return sharp(place.width / L.k, place.height / L.k, L.k * 1.4, (context, width, height) => drawKanbanCard(context, HERO.name, 0.5, 0.5, width - 1, height - 1, 1))
}

/** Тост продукта (ui/toast.tsx): 320px, иконка тона, заголовок и описание. */
export function crmToast(title: string, description: string, tone: Tone = 'green'): CanvasTexture | null {
  return sharp(340, 70, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 12)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = TONES[tone].line
    context.stroke()
    context.beginPath()
    context.arc(30, height / 2, 11, 0, Math.PI * 2)
    context.strokeStyle = TONES[tone].base
    context.lineWidth = 2
    context.stroke()
    icon(context, 'check', 23, height / 2 - 7, 14, TONES[tone].base, 0.14)
    write(context, title, 52, 30, { size: 13, weight: 600, color: CRM.text })
    write(context, description, 52, 50, { size: 12, weight: 450, color: CRM.muted })
  })
}

/* ══ 12 · Оферта ═════════════════════════════════════════════════════════ */

export const OFFER = { width: 380, height: 520 }

export function crmOfferCard(status: 'Szkic' | 'Wysłana'): CanvasTexture | null {
  return sharp(OFFER.width, OFFER.height, 2.2, (context, width, height) => {
    panel(context, 1, 1, width - 2, height - 2, 1.4, CRM.glassCard, CRM.borderHover)
    const pad = 18
    badge(context, HERO.service, pad, pad, 'blue', 1.3, 'sm')
    icon(context, 'more', width - pad - 20, pad + 2, 20, CRM.muted)
    context.font = `600 ${13}px "Inter Variable", Inter, sans-serif`
    const statusLabel = status === 'Szkic' ? tr('Szkic', 'Draft') : tr('Wysłana', 'Sent')
    const sw = context.measureText(statusLabel).width + 13
    badge(context, statusLabel, width - pad - 30 - sw, pad, status === 'Szkic' ? 'gray' : 'teal', 1.3, 'sm')
    round(context, pad, 52, width - pad * 2, 104, 12)
    context.fillStyle = CRM.hover
    context.fill()
    context.beginPath()
    context.arc(width / 2, 104, 34, 0, Math.PI * 2)
    context.fillStyle = TONES.blue.dim
    context.fill()
    icon(context, 'clock', width / 2 - 20, 84, 40, CRM.blue)
    write(context, HERO.offer, pad, 184, { size: 12, weight: 500, color: CRM.muted })
    toneAvatar(context, HERO.owner, pad + 112, 171, 18)
    write(context, HERO.owner, pad + 136, 184, { size: 12, weight: 450, color: CRM.muted })
    writeWrapped(context, tr('iApply Workforce: wdrożenie w 3 magazynach', 'iApply Workforce: rollout in 3 warehouses'), pad, 214, width - pad * 2, { size: 16, weight: 620, color: CRM.text, lineHeight: 1.25 })
    write(context, '45 000 zł', pad, 282, { size: 22, weight: 650, color: CRM.text, tracking: -0.3 })
    write(context, tr('MRR 2 900 zł / mies.', 'MRR 2 900 zł / mo'), pad, 306, { size: 13, weight: 500, color: CRM.teal })
    context.fillStyle = CRM.border
    context.fillRect(pad, 326, width - pad * 2, 1)
    const metrics: [IconName, string, string][] = [
      ['clock', tr('Czas realizacji', 'Duration'), tr('8 tyg.', '8 wk')],
      ['users', tr('Zespół', 'Team'), tr('3 os.', '3 people')],
      ['calendar', tr('Ważna do', 'Valid until'), tr('28.10.26', '10/28/26')],
    ]
    metrics.forEach(([glyph, label, value], i) => {
      const x = pad + i * ((width - pad * 2) / 3)
      icon(context, glyph, x, 340, 12, CRM.dim)
      write(context, label, x + 16, 350, { size: 11, weight: 450, color: CRM.dim })
      write(context, value, x, 372, { size: 13, weight: 560, color: CRM.text })
    })
    context.fillStyle = CRM.border
    context.fillRect(pad, 394, width - pad * 2, 1)
    const lw = write(context, 'Lead: ', pad, 424, { size: 13, weight: 450, color: CRM.dim })
    write(context, HERO.name, pad + lw, 424, { size: 13, weight: 560, color: CRM.teal })
    if (status === 'Wysłana') {
      round(context, pad, 446, width - pad * 2, 52, 10)
      context.fillStyle = TONES.teal.dim
      context.fill()
      context.strokeStyle = TONES.teal.line
      context.lineWidth = 1
      context.stroke()
      icon(context, 'send', pad + 14, 461, 20, CRM.teal)
      write(context, tr(`Oferta ${HERO.offer} wysłana`, `Quote ${HERO.offer} sent`), pad + 44, 477, { size: 13, weight: 600, color: CRM.teal })
    } else {
      button(context, tr('Wyślij klientowi', 'Send to the client'), pad, 452, 'outline', 1.2, { icon: 'send', width: width - pad * 2 })
    }
  })
}

/** Где на карточке оферты «⋯», доли карточки. */
export const OFFER_MORE = { x: (380 - 18 - 10) / 380, y: (18 + 12) / 520 }

export function crmOfferMenu(): CanvasTexture | null {
  const send = tr('Wyślij klientowi', 'Send to the client')
  const remove = tr('Usuń', 'Delete')
  const items = [tr('Podgląd', 'Preview'), tr('Edytuj', 'Edit'), send, tr('Oznacz jako przyjętą', 'Mark as accepted'), tr('Oznacz jako odrzuconą', 'Mark as rejected'), tr('Duplikuj', 'Duplicate'), remove]
  return sharp(230, 16 + items.length * 34, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 10)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    items.forEach((item, i) => {
      const y = 8 + i * 34
      if (item === send) {
        round(context, 6, y, width - 12, 32, 7)
        context.fillStyle = TONES.teal.dim
        context.fill()
      }
      write(context, item, 18, y + 21, { size: 13, weight: item === send ? 600 : 450, color: item === remove ? CRM.coral : item === send ? CRM.teal : CRM.text })
    })
  })
}

/** Строка «Wyślij klientowi» в меню, доли меню. */
export const MENU_SEND = { x: 0.35, y: (8 + 2 * 34 + 16) / (16 + 7 * 34) }

/* ══ 13 · Poczta → карточка лида ═════════════════════════════════════════ */

export const MAIL = { width: 1600, height: 1030, k: 1.7 }

export function mailLayout() {
  const k = MAIL.k
  const pad = 20 * k
  const top = 56 * k + 46 * k
  const list = { x: pad, y: top, width: 380 * k, height: MAIL.height - top - pad }
  const thread = { x: pad + 380 * k + 12 * k, y: top, width: MAIL.width - pad * 2 - 392 * k, height: MAIL.height - top - pad }
  const item = (i: number) => ({ x: list.x + 8 * k, y: list.y + 8 * k + i * 76 * k, width: list.width - 16 * k, height: 70 * k })
  const link = { x: thread.x + 16 * k, y: thread.y + 64 * k, width: 150 * k, height: 34 * k }
  const message = { x: thread.x + 16 * k, y: thread.y + 112 * k, width: thread.width - 32 * k, height: 150 * k }
  return { k, pad, top, list, thread, item, link, message }
}

const THREADS = (): [string, string, string, boolean][] => [
  [HERO.name, tr(`Re: Oferta ${HERO.offer}`, `Re: Quote ${HERO.offer}`), tr('teraz', 'now'), true],
  ['Joanna Kowalczyk', tr('Wdrożenie portalu B2B: pytania po demo', 'B2B portal rollout: questions after the demo'), tr('2 godziny temu', '2 hours ago'), false],
  ['Biuro Serwis', tr('Faktura 2026/08/114', 'Invoice 2026/08/114'), tr('wczoraj', 'yesterday'), false],
  ['Piotr Kaczmarek', tr('Termin spotkania w czwartek', 'Meeting on Thursday'), tr('3 dni temu', '3 days ago'), false],
  ['Ewa Kamińska', tr('Cennik hurtowy na IV kwartał', 'Wholesale price list for Q4'), tr('4 dni temu', '4 days ago'), false],
]

function drawMessage(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, k: number) {
  round(context, x, y, width, height, 12 * k)
  context.fillStyle = CRM.glassRow
  context.fill()
  context.fillStyle = TONES.teal.dim
  context.fill()
  context.lineWidth = k
  context.strokeStyle = TONES.teal.line
  context.stroke()
  const pad = 14 * k
  toneAvatar(context, HERO.name, x + pad, y + pad, 30 * k)
  write(context, HERO.name, x + pad + 40 * k, y + pad + 13 * k, { size: 13 * k, weight: 620, color: CRM.text })
  write(context, tr('Przyszło na: anna@simbia.eu', 'Delivered to: anna@simbia.eu'), x + pad + 40 * k, y + pad + 29 * k, { size: 11 * k, weight: 450, color: CRM.muted })
  write(context, tr('28.09.26, 12:02', '09/28/26, 12:02 PM'), x + width - pad, y + pad + 13 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
  writeWrapped(context, tr('Dzień dobry, dziękuję za ofertę. Czy możemy umówić się na krótkie demo w przyszłym tygodniu? Pozdrawiam, Marek Zieliński', 'Hello, thank you for the quote. Could we book a short demo next week? Best regards, Marek Zieliński'), x + pad, y + pad + 62 * k, width - pad * 2, { size: 13 * k, weight: 450, color: CRM.text, lineHeight: 1.45 })
}

/** linked — ветка уже привязана к лиду (строка «Lead: …»). */
export function crmMail(linked: boolean): CanvasTexture | null {
  const { width, height } = MAIL
  const L = mailLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    icon(context, 'mail', L.pad, 20 * k, 16 * k, CRM.teal)
    const tw = write(context, tr('Poczta', 'Mail'), L.pad + 24 * k, 34 * k, { size: 15 * k, weight: 620, color: CRM.text })
    round(context, L.pad + 32 * k + tw, 21 * k, 20 * k, 17 * k, 8.5 * k)
    context.fillStyle = CRM.hover
    context.fill()
    write(context, '3', L.pad + 42 * k + tw, 34 * k, { size: 11 * k, weight: 600, color: CRM.muted, align: 'center' })
    write(context, tr('Korespondencja ze wszystkich dostępnych skrzynek', 'Correspondence across all available mailboxes'), L.pad + 64 * k + tw, 34 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    button(context, tr('Napisz', 'Compose'), width - L.pad, 14 * k, 'primary', k, { icon: 'pen', size: 'sm', align: 'right' })
    button(context, tr('Odśwież', 'Refresh'), width - L.pad - 96 * k, 14 * k, 'outline', k, { size: 'sm', align: 'right' })
    context.fillStyle = CRM.border
    context.fillRect(0, 56 * k, width, Math.max(1, k))
    /* Полоса фильтров: сегмент «Wątki | Rozmówcy | Odebrane | Wysłane» и чипы. */
    const seg = [tr('Wątki', 'Threads'), tr('Rozmówcy', 'By contact'), tr('Odebrane', 'Inbox'), tr('Wysłane', 'Sent')]
    let x = L.pad
    round(context, x, 64 * k, 300 * k, 30 * k, 8 * k)
    context.fillStyle = CRM.card
    context.fill()
    context.strokeStyle = CRM.border
    context.lineWidth = k
    context.stroke()
    seg.forEach((label, i) => {
      const w = 75 * k
      if (i === 0) {
        round(context, x + 3 * k, 67 * k, w - 6 * k, 24 * k, 6 * k)
        context.fillStyle = TONES.teal.dim
        context.fill()
      }
      write(context, label, x + w / 2, 84 * k, { size: 12 * k, weight: 600, color: i === 0 ? CRM.teal : CRM.muted, align: 'center' })
      x += w
    })
    x = L.pad + 312 * k
    for (const chip of [tr('Skrzynka', 'Mailbox'), tr('Nasz adres', 'Our address'), tr('Rozmówca', 'Contact'), tr('Nieprzeczytane', 'Unread')]) {
      context.font = `600 ${12 * k}px "Inter Variable", Inter, sans-serif`
      const w = context.measureText(chip).width + 34 * k
      round(context, x, 64 * k, w, 30 * k, 6 * k)
      context.fillStyle = CRM.hover
      context.fill()
      context.strokeStyle = CRM.border
      context.stroke()
      write(context, chip, x + 12 * k, 84 * k, { size: 12 * k, weight: 600, color: CRM.muted })
      x += w + 8 * k
    }
    panel(context, L.list.x, L.list.y, L.list.width, L.list.height, k, CRM.glassCard)
    THREADS().forEach(([who, subject, ago, unread], i) => {
      const it = L.item(i)
      if (i === 0) {
        round(context, it.x, it.y, it.width, it.height, 10 * k)
        context.fillStyle = TONES.teal.dim
        context.fill()
        context.strokeStyle = TONES.teal.line
        context.lineWidth = k
        context.stroke()
      }
      icon(context, 'arrowRight', it.x + 10 * k, it.y + 11 * k, 13 * k, unread ? CRM.teal : CRM.muted)
      write(context, who, it.x + 30 * k, it.y + 22 * k, { size: 13 * k, weight: unread ? 650 : 500, color: CRM.text })
      write(context, ago, it.x + it.width - 10 * k, it.y + 22 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
      write(context, subject, it.x + 10 * k, it.y + 42 * k, { size: 12 * k, weight: 450, color: CRM.muted })
      let bx = it.x + 10 * k
      if (unread) bx += badge(context, tr('1 nowa', '1 new'), bx, it.y + 50 * k, 'teal', k, 'sm') + 8 * k
      write(context, tr(`${i === 2 ? 3 : 2} wiadomości`, `${i === 2 ? 3 : 2} emails`), bx, it.y + 62 * k, { size: 11 * k, weight: 450, color: CRM.dim })
    })
    const t = L.thread
    panel(context, t.x, t.y, t.width, t.height, k, CRM.glassCard)
    write(context, tr(`Re: Oferta ${HERO.offer}`, `Re: Quote ${HERO.offer}`), t.x + 16 * k, t.y + 30 * k, { size: 15 * k, weight: 620, color: CRM.text })
    write(context, tr(`${HERO.email} · 2 wiadomości`, `${HERO.email} · 2 emails`), t.x + 16 * k, t.y + 50 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    const reply = button(context, tr('Odpowiedz', 'Reply'), t.x + t.width - 16 * k, t.y + 14 * k, 'primary', k, { size: 'sm', align: 'right' })
    /* «Przeczytane» — вплотную к «Odpowiedz»: английская кнопка ответа уже польской. */
    button(context, tr('Przeczytane', 'Mark read'), inEnglish() ? t.x + t.width - 16 * k - reply - 8 * k : t.x + t.width - 110 * k, t.y + 14 * k, 'outline', k, { size: 'sm', align: 'right' })
    if (linked) {
      icon(context, 'user', L.link.x, L.link.y + 9 * k, 16 * k, CRM.teal)
      const lw = write(context, 'Lead: ', L.link.x + 22 * k, L.link.y + 22 * k, { size: 13 * k, weight: 450, color: CRM.muted })
      const nw = write(context, HERO.name, L.link.x + 22 * k + lw, L.link.y + 22 * k, { size: 13 * k, weight: 600, color: CRM.teal })
      button(context, tr('Odłącz', 'Unlink'), L.link.x + 34 * k + lw + nw, L.link.y + 3 * k, 'ghost', k, { size: 'sm' })
    } else {
      const w = button(context, tr('Powiąż z leadem', 'Link to a lead'), L.link.x, L.link.y, 'outline', k, { icon: 'link' })
      button(context, tr('Utwórz leada z wiadomości', 'Create a lead from the email'), L.link.x + w + 8 * k, L.link.y, 'outline', k, { icon: 'userPlus' })
    }
    drawMessage(context, L.message.x, L.message.y, L.message.width, L.message.height, k)
    const out = { x: L.message.x, y: L.message.y + L.message.height + 12 * k, width: L.message.width, height: 64 * k }
    panel(context, out.x, out.y, out.width, out.height, k, CRM.input)
    write(context, tr('My · anna@simbia.eu', 'Us · anna@simbia.eu'), out.x + 14 * k, out.y + 24 * k, { size: 13 * k, weight: 560, color: CRM.text })
    write(context, tr('28.09.26, 11:20', '09/28/26, 11:20 AM'), out.x + out.width - 14 * k, out.y + 24 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
    write(context, tr(`Oferta ${HERO.offer}: iApply Workforce, wdrożenie w 3 magazynach`, `Quote ${HERO.offer}: iApply Workforce, rollout in 3 warehouses`), out.x + 14 * k, out.y + 46 * k, { size: 12 * k, weight: 450, color: CRM.muted })
  })
}

/** Письмо отдельно: отрывается от ветки и летит в карточку лида. */
export function crmMailMessage(): CanvasTexture | null {
  const L = mailLayout()
  return sharp(L.message.width / L.k, L.message.height / L.k, L.k * 1.3, (context, width, height) => drawMessage(context, 0.5, 0.5, width - 1, height - 1, 1))
}

/** Выбор лида: «Powiąż wątek z leadem». */
export function crmLinkPicker(): CanvasTexture | null {
  return sharp(400, 210, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 14)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    write(context, tr('Powiąż wątek z leadem', 'Link the thread to a lead'), 18, 36, { size: 15, weight: 620, color: CRM.text })
    icon(context, 'x', width - 34, 22, 14, CRM.muted)
    round(context, 18, 52, width - 36, 36, 8)
    context.fillStyle = CRM.input
    context.fill()
    context.strokeStyle = TONES.teal.line
    context.stroke()
    icon(context, 'search', 28, 62, 16, CRM.dim)
    write(context, 'Marek', 52, 75, { size: 13, weight: 500, color: CRM.text })
    round(context, 18, 100, width - 36, 52, 10)
    context.fillStyle = TONES.teal.dim
    context.fill()
    toneAvatar(context, HERO.name, 28, 110, 32)
    write(context, HERO.name, 70, 122, { size: 13, weight: 600, color: CRM.text })
    write(context, `${HERO.company} · ${HERO.email}`, 70, 140, { size: 11, weight: 450, color: CRM.muted })
    toneAvatar(context, 'Marek Kowalski', 28, 162, 32)
    write(context, 'Marek Kowalski', 70, 174, { size: 13, weight: 500, color: CRM.muted })
    write(context, 'Kadry Plus · biuro@kadryplus.example', 70, 192, { size: 11, weight: 450, color: CRM.dim })
  })
}

/** Где в диалоге строка «Marek Zieliński», доли диалога. */
export const PICK_HERO = { x: 0.3, y: 126 / 210 }

/** Карточка лида с блоком «Korespondencja»: 720 × 900 px; withNew — письмо уже на месте. */
export const LEAD_MAIL = { width: 720, height: 900, k: 1.5 }

export function leadMailSlot() {
  const k = LEAD_MAIL.k
  return { x: 28 * k, y: 196 * k, width: LEAD_MAIL.width - 56 * k, height: 102 * k }
}

export function crmLeadMail(withNew: boolean): CanvasTexture | null {
  const { width, height, k } = LEAD_MAIL
  return paintClose(width, height, (context) => {
    panel(context, 1, 1, width - 2, height - 2, k, CRM.glassBg, CRM.borderHover)
    const pad = 16 * k
    toneAvatar(context, HERO.name, pad, pad, 32 * k)
    write(context, HERO.name, pad + 42 * k, pad + 14 * k, { size: 15 * k, weight: 620, color: CRM.text })
    write(context, HERO.company, pad + 42 * k, pad + 30 * k, { size: 11.5 * k, weight: 450, color: CRM.muted })
    const box = { x: pad - 4 * k, y: 70 * k, width: width - (pad - 4 * k) * 2, height: height - 70 * k - pad }
    panel(context, box.x, box.y, box.width, box.height, k, CRM.glassCard)
    sectionTitle(context, 'mail', tr('Korespondencja', 'Correspondence'), box.x + 14 * k, box.y + 30 * k, k, { count: withNew ? '3' : '2' })
    writeWrapped(context, tr('Wiadomości powiązane z tym leadem — przychodzące i wysłane', 'Emails linked to this lead — incoming and sent'), box.x + 14 * k, box.y + 54 * k, box.width - 28 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    button(context, tr('Napisz wiadomość', 'Write an email'), box.x + 14 * k, box.y + 76 * k, 'primary', k, { icon: 'pen', size: 'sm' })
    const slot = leadMailSlot()
    let y = slot.y + (withNew ? slot.height + 10 * k : 0)
    if (withNew) {
      round(context, slot.x, slot.y, slot.width, slot.height, 10 * k)
      context.fillStyle = TONES.teal.dim
      context.fill()
      context.strokeStyle = TONES.teal.line
      context.lineWidth = k
      context.stroke()
      write(context, HERO.name, slot.x + 12 * k, slot.y + 22 * k, { size: 13 * k, weight: 620, color: CRM.text })
      write(context, tr('teraz', 'now'), slot.x + slot.width - 12 * k, slot.y + 22 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
      write(context, tr(`Re: Oferta ${HERO.offer}`, `Re: Quote ${HERO.offer}`), slot.x + 12 * k, slot.y + 42 * k, { size: 12 * k, weight: 560, color: CRM.teal })
      writeWrapped(context, tr('Dzień dobry, dziękuję za ofertę. Czy możemy umówić się na krótkie demo?', 'Hello, thank you for the quote. Could we book a short demo?'), slot.x + 12 * k, slot.y + 64 * k, slot.width - 24 * k, { size: 11.5 * k, weight: 450, color: CRM.muted, lineHeight: 1.35 })
    }
    const older: [string, string, string][] = [
      [tr('My · anna@simbia.eu', 'Us · anna@simbia.eu'), tr(`Oferta ${HERO.offer}`, `Quote ${HERO.offer}`), tr('28.09.26, 11:20', '09/28/26, 11:20 AM')],
      [tr('My · anna@simbia.eu', 'Us · anna@simbia.eu'), tr('Dzień dobry, w nawiązaniu do rozmowy', 'Hello, following up on our call'), tr('28.09.26, 10:12', '09/28/26, 10:12 AM')],
    ]
    for (const [who, subject, when] of older) {
      round(context, slot.x, y, slot.width, 64 * k, 10 * k)
      context.fillStyle = CRM.input
      context.fill()
      context.strokeStyle = CRM.border
      context.lineWidth = k
      context.stroke()
      write(context, who, slot.x + 12 * k, y + 24 * k, { size: 12.5 * k, weight: 560, color: CRM.text })
      write(context, when, slot.x + slot.width - 12 * k, y + 24 * k, { size: 11 * k, weight: 450, color: CRM.dim, align: 'right' })
      write(context, subject, slot.x + 12 * k, y + 45 * k, { size: 12 * k, weight: 450, color: CRM.muted })
      y += 74 * k
    }
  })
}

/* ══ 14 · Follow-up: ось последовательности ══════════════════════════════ */

export const FOLLOWUP = { width: 1600, height: 1030, k: 1.75 }

export function crmFollowup(stopped: boolean): CanvasTexture | null {
  const { width, height, k } = FOLLOWUP
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    const pad = 20 * k
    write(context, 'Follow-up', pad, 34 * k, { size: 15 * k, weight: 620, color: CRM.text })
    write(context, tr(`Nowych odpowiedzi: ${stopped ? 1 : 0} · Aktywnych sekwencji: ${stopped ? 13 : 14} · Włączonych kroków: 7 z 8`, `New replies: ${stopped ? 1 : 0} · Active sequences: ${stopped ? 13 : 14} · Steps on: 7 of 8`), pad + 86 * k, 34 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    context.fillStyle = CRM.border
    context.fillRect(0, 56 * k, width, Math.max(1, k))
    /* «Jak działa sekwencja» — пункт про дни, дословно из продукта. */
    const info = { x: pad, y: 70 * k, width: width - pad * 2, height: 62 * k }
    round(context, info.x, info.y, info.width, info.height, 12 * k)
    context.fillStyle = TONES.teal.dim
    context.fill()
    context.strokeStyle = TONES.teal.line
    context.lineWidth = k
    context.stroke()
    write(context, tr('Jak działa sekwencja', 'How the sequence works'), info.x + 14 * k, info.y + 24 * k, { size: 13 * k, weight: 620, color: CRM.teal })
    write(context, tr('Kontakty wychodzą w dniach 0, 2, 4, 7, 14, 30, 60, 180 — licząc od daty zgłoszenia, a nie od ostatniej wiadomości.', 'Touches go out on days 0, 2, 4, 7, 14, 30, 60, 180 — counted from the enquiry date, not from the last email.'), info.x + 14 * k, info.y + 46 * k, { size: 12 * k, weight: 450, color: CRM.text })
    const table = { x: pad, y: info.y + info.height + 14 * k, width: width - pad * 2, height: height - info.y - info.height - 14 * k - pad }
    panel(context, table.x, table.y, table.width, table.height, k, CRM.glassCard)
    sectionTitle(context, 'zap', tr('Zapisy do sekwencji', 'Sequence enrollments'), table.x + 14 * k, table.y + 30 * k, k, { count: '14' })
    const cols = [table.x + 14 * k, table.x + 250 * k, table.x + 370 * k, table.x + 490 * k, table.x + 620 * k]
    const heads = ['Lead', 'Status', tr('Bieżący dzień', 'Current day'), tr('Następny krok', 'Next step'), tr('Ostatnia wysyłka', 'Last sent')]
    heads.forEach((head, i) => caps(context, head, cols[i]!, table.y + 62 * k, k))
    const rows: [string, string, string, string, string, string][] = [
      [HERO.name, HERO.company, stopped ? 'Zatrzymana' : 'Aktywna', '7', stopped ? '—' : tr('dzień 14', 'day 14'), tr('25.09.26', '09/25/26')],
      ['Julia Adamska', 'Adamska Kadry', 'Aktywna', '4', tr('dzień 7', 'day 7'), tr('27.09.26', '09/27/26')],
      ['Rafał Nowicki', 'Nowicki Agro', 'Wstrzymana', '30', '—', tr('02.09.26', '09/02/26')],
      ['Michał Zając', 'Zając Dystrybucja', 'Aktywna', '2', tr('dzień 4', 'day 4'), tr('28.09.26', '09/28/26')],
      ['Tomasz Wójcik', 'Bud-Dom Hurt', 'Zakończona', '180', '—', tr('11.03.26', '03/11/26')],
    ]
    const tones: Record<string, Tone> = { Aktywna: 'green', Wstrzymana: 'amber', Zatrzymana: 'coral', Zakończona: 'gray' }
    /* Статус записи (i18n domain.enrollmentStatus): ключ тона — польский. */
    const statusEn: Record<string, string> = { Aktywna: 'Active', Wstrzymana: 'Paused', Zatrzymana: 'Stopped', Zakończona: 'Completed' }
    rows.forEach(([name, company, status, day, next, last], i) => {
      const y = table.y + 76 * k + i * 56 * k
      context.fillStyle = CRM.border
      context.fillRect(table.x, y, table.width, Math.max(1, k))
      if (i === 0) {
        context.fillStyle = CRM.rowTint
        context.fillRect(table.x, y + k, table.width, 55 * k)
      }
      toneAvatar(context, name, cols[0]!, y + 13 * k, 30 * k)
      write(context, name, cols[0]! + 40 * k, y + 25 * k, { size: 13 * k, weight: 560, color: CRM.text })
      write(context, company, cols[0]! + 40 * k, y + 41 * k, { size: 11 * k, weight: 450, color: CRM.dim })
      badge(context, tr(status, statusEn[status] ?? status), cols[1]!, y + 18 * k, tones[status] ?? 'gray', k)
      write(context, day, cols[2]!, y + 33 * k, { size: 13 * k, weight: 560, color: CRM.text })
      write(context, next, cols[3]!, y + 33 * k, { size: 13 * k, weight: 450, color: CRM.muted })
      write(context, last, cols[4]!, y + 33 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    })
  })
}

/** Строка героя в «Zapisy do sekwencji»: центр, px холста. */
export function followupHeroRow() {
  const k = FOLLOWUP.k
  const pad = 20 * k
  const y = 70 * k + 62 * k + 14 * k + 76 * k
  return { x: pad, y, width: FOLLOWUP.width - pad * 2, height: 56 * k }
}

/** Карточка ответа клиента с анализом (ReplyCard + AiPanel в режиме правил). */
export function crmReplyCard(kind: 'meeting' | 'unsubscribe'): CanvasTexture | null {
  const meeting = kind === 'meeting'
  const who = meeting ? HERO.name : 'Rafał Nowicki'
  return sharp(560, 330, 2.6, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 12)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    const pad = 16
    toneAvatar(context, who, pad, pad, 34)
    const nw = write(context, who, pad + 44, pad + 15, { size: 13, weight: 620, color: CRM.text })
    const intent = meeting ? tr('Prośba o spotkanie', 'Meeting request') : tr('Wypisanie', 'Unsubscribe')
    let bx = pad + 44 + nw + 8
    bx += badge(context, 'Email', bx, pad + 3, 'blue', 1, 'sm') + 5
    bx += badge(context, intent, bx, pad + 3, meeting ? 'violet' : 'coral', 1, 'sm') + 5
    write(context, tr('nowe', 'new'), bx + 2, pad + 14, { size: 11, weight: 600, color: CRM.coral })
    write(context, tr('teraz', 'now'), width - pad, pad + 14, { size: 11, weight: 450, color: CRM.dim, align: 'right' })
    write(context, meeting ? tr('«Dziękuję za ofertę. Czy możemy umówić się na krótkie demo?»', '“Thanks for the quote. Could we book a short demo?”') : tr('«Proszę o wypisanie mnie z listy.»', '“Please take me off your list.”'), pad + 44, pad + 34, { size: 12, weight: 450, color: CRM.muted })
    const box = { x: pad, y: 78, width: width - pad * 2, height: height - 78 - pad }
    round(context, box.x, box.y, box.width, box.height, 12)
    context.fillStyle = CRM.input
    context.fill()
    context.strokeStyle = TONES.teal.line
    context.stroke()
    icon(context, 'sparkles', box.x + 12, box.y + 12, 16, CRM.teal)
    const aw = write(context, tr('Analiza odpowiedzi', 'Reply analysis'), box.x + 34, box.y + 25, { size: 13, weight: 620, color: CRM.text })
    /* Бейдж — сразу за заголовком: английский заголовок короче польского. */
    badge(context, tr('bez AI', 'without AI'), inEnglish() ? box.x + 34 + aw + 6 : box.x + 160, box.y + 12, 'gray', 1, 'sm')
    write(context, tr('Szkic według reguł: rosyjski, polski, angielski', 'A draft by rules: Russian, Polish, English'), box.x + 12, box.y + 46, { size: 11, weight: 450, color: CRM.dim })
    let x = box.x + 12
    x += badge(context, intent, x, box.y + 58, meeting ? 'violet' : 'coral', 1) + 10
    x += write(context, meeting ? tr('Wydźwięk: pozytywny', 'Sentiment: positive') : tr('Wydźwięk: negatywny', 'Sentiment: negative'), x, box.y + 73, { size: 12, weight: 500, color: CRM.text }) + 14
    write(context, tr('Pewność: 75%', 'Confidence: 75%'), x, box.y + 73, { size: 12, weight: 500, color: CRM.text })
    write(context, meeting ? tr('Klient chce się spotkać.', 'The client wants to meet.') : tr('Klient prosi, żeby więcej do niego nie pisać.', 'The client asks not to be written to again.'), box.x + 12, box.y + 100, { size: 12, weight: 450, color: CRM.muted })
    const next = meeting ? tr('Następny krok: Utworzyć zadanie „Spotkanie” i zaproponować dwa terminy.', 'Next step: Create a Meeting task and offer two slots.') : tr('Następny krok: Zatrzymać sekwencję i wypisać leada.', 'Next step: Stop the sequence and unsubscribe the lead.')
    writeWrapped(context, next, box.x + 12, box.y + 122, box.width - 24, { size: 12, weight: 560, color: CRM.text })
    const action = meeting ? tr('Utwórz zadanie „Spotkanie”', 'Create a Meeting task') : tr('Wypisz i zatrzymaj sekwencję', 'Unsubscribe and stop the sequence')
    const main = button(context, action, box.x + box.width - 12, box.y + box.height - 40, 'primary', 1, { size: 'sm', align: 'right' })
    /* «Odrzuć» — левее главной кнопки; английская главная кнопка шире польской. */
    button(context, tr('Odrzuć', 'Dismiss'), box.x + box.width - 12 - (inEnglish() ? main + 8 : meeting ? 196 : 212), box.y + box.height - 40, 'outline', 1, { size: 'sm', align: 'right' })
  })
}

/** Где на карточке ответа главная кнопка, доли карточки. */
export const REPLY_ACTION = { x: (560 - 16 - 12 - 90) / 560, y: (330 - 16 - 40 + 14) / 330 }

/** Диск дня последовательности: номер, у пройденного — галочка. */
export function crmDayDisc(day: number, state: 'future' | 'done' | 'grey'): CanvasTexture | null {
  return paint(256, 256, (context) => {
    context.beginPath()
    context.arc(128, 128, 122, 0, Math.PI * 2)
    context.fillStyle = CRM.glassCard
    context.fill()
    /* Пройденный день — заливка бирюзой поверх карточки (как у активного чипа). */
    if (state === 'done') {
      context.fillStyle = TONES.teal.dim
      context.fill()
      context.fill()
    }
    context.lineWidth = 6
    context.strokeStyle = state === 'grey' ? CRM.ghostEdge : state === 'done' ? CRM.teal : TONES.teal.line
    context.stroke()
    const color = state === 'grey' ? CRM.ghost : state === 'done' ? CRM.teal : CRM.text
    write(context, String(day), 128, state === 'done' ? 118 : 142, { size: day >= 100 ? 84 : 104, weight: 750, color, align: 'center', tracking: -2 })
    write(context, tr('dzień', 'day'), 128, state === 'done' ? 156 : 190, { size: 28, weight: 560, color: state === 'grey' ? CRM.ghostDim : CRM.muted, align: 'center' })
    if (state === 'done') icon(context, 'check', 104, 176, 48, CRM.teal, 0.13)
  })
}

/* ══ 15 · Wypis: подвал письма и ответ ═══════════════════════════════════ */

export function crmMailFooter(): CanvasTexture | null {
  return paintClose(1600, 1030, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 24)
    context.fillStyle = 'rgba(255, 255, 255, 0.92)'
    context.fill()
    const pad = 90
    write(context, tr('Dzień dobry,', 'Hello,'), pad, 130, { size: 40, weight: 450, color: '#1f2328' })
    writeWrapped(context, tr('wracamy z krótkim przypomnieniem o analizie Państwa procesu. 30 minut, bez zobowiązań.', 'Just a quick reminder about the review of your process. 30 minutes, no strings attached.'), pad, 204, width - pad * 2, { size: 40, weight: 450, color: '#1f2328', lineHeight: 1.4 })
    write(context, tr('Pozdrawiam,', 'Best regards,'), pad, 380, { size: 40, weight: 450, color: '#1f2328' })
    write(context, 'Anna, SIMBIA', pad, 436, { size: 40, weight: 600, color: '#1f2328' })
    context.fillStyle = '#dfe3e8'
    context.fillRect(pad, 560, width - pad * 2, 3)
    write(context, 'SIMBIA · Anna · anna@simbia.eu', pad, 650, { size: 38, weight: 450, color: '#6f7887' })
    const lead = tr(UNSUB_FOOTER.pl.lead, UNSUB_FOOTER.en.lead)
    const lw = write(context, lead, pad, 722, { size: 38, weight: 450, color: '#6f7887' })
    const link = tr(UNSUB_FOOTER.pl.link, UNSUB_FOOTER.en.link)
    const kw = write(context, link, pad + lw, 722, { size: 38, weight: 500, color: '#2a9baa' })
    context.fillStyle = '#2a9baa'
    context.fillRect(pad + lw, 732, kw, 3)
    write(context, '.', pad + lw + kw, 722, { size: 38, weight: 450, color: '#6f7887' })
  })
}

/** Где ссылка «Wypisz się…», доли подвала. */
export const UNSUB_LINK = { x: 1070 / 1600, y: 710 / 1030 }

/** Строка отписки в подвале (apps/mailer, sender.ts; английской у рассыльщика
    нет — перевод ролика). Обе пары здесь: по ним 2D-сцена находит ссылку. */
export const UNSUB_FOOTER = {
  pl: { lead: 'Nie chcesz otrzymywać tych wiadomości? ', link: 'Wypisz się jednym kliknięciem' },
  en: { lead: 'Don’t want these emails? ', link: 'Unsubscribe in one click' },
}

/** Оттиск штампа, px: надпись целиком (на 900 px обрезалась до «WYKLUCZ NA ZA»). */
export const STAMP_IMPRINT = { width: 1200, height: 240 }

export function crmStampImprint(): CanvasTexture | null {
  return paint(STAMP_IMPRINT.width, STAMP_IMPRINT.height, (context, width, height) => {
    round(context, 12, 12, width - 24, height - 24, 40)
    context.lineWidth = 14
    context.strokeStyle = CRM.coral
    context.stroke()
    icon(context, 'ban', 58, (height - 120) / 2, 120, CRM.coral, 0.12)
    const text = 'WYKLUCZ NA ZAWSZE'
    const room = width - 214 - 56
    context.font = `800 74px ${FONT}`
    context.letterSpacing = '2px'
    const size = Math.min(74, Math.floor((74 * room) / context.measureText(text).width))
    context.letterSpacing = '0px'
    write(context, text, 214, height / 2 + size * 0.36, { size, weight: 800, color: CRM.coral, tracking: 2 })
  })
}

/* ══ 16 · Мастер фактуры ═════════════════════════════════════════════════ */

export const INVOICE = { width: 1100, height: 1812, k: 2.1 }

export function invoiceLayout() {
  const k = INVOICE.k
  const pad = 22 * k
  const w = INVOICE.width - pad * 2
  const steps = { y: 70 * k }
  const s1 = { x: pad, y: 100 * k, width: w, height: 272 * k }
  const nip = { x: s1.x + 16 * k, y: s1.y + 118 * k, width: 150 * k, height: 34 * k }
  const name = { x: s1.x + 16 * k + 250 * k, y: s1.y + 118 * k, width: w - 32 * k - 250 * k, height: 34 * k }
  const badgeRow = { x: s1.x + 16 * k, y: s1.y + 172 * k, width: w - 32 * k, height: 26 * k }
  const address = { x: s1.x + 16 * k, y: s1.y + 226 * k, width: w - 32 * k, height: 34 * k }
  const s2 = { x: pad, y: s1.y + s1.height + 12 * k, width: w, height: 226 * k }
  const lines = [0, 1].map((i) => ({ x: s2.x + 16 * k, y: s2.y + 80 * k + i * 42 * k, width: w - 32 * k, height: 36 * k }))
  const totals = { x: s2.x + w - 16 * k - 230 * k, y: s2.y + 160 * k, width: 230 * k, height: 60 * k }
  const s3 = { x: pad, y: s2.y + s2.height + 12 * k, width: w, height: INVOICE.height - (s2.y + s2.height + 12 * k) - pad }
  const preview = { x: s3.x + 16 * k, y: s3.y + 62 * k, width: 120 * k, height: 120 * k * 1.414 }
  const issue = { x: s3.x + w - 16 * k, y: s3.y + s3.height - 46 * k, height: 34 * k }
  return { k, pad, steps, s1, nip, name, badgeRow, address, s2, lines, totals, s3, preview, issue }
}

function field(context: CanvasRenderingContext2D, label: string, x: number, y: number, width: number, value: string, k: number, required = false, placeholder = false) {
  const lw = caps(context, label, x, y - 8 * k, k)
  if (required) write(context, '*', x + lw + 4 * k, y - 8 * k, { size: 11 * k, weight: 600, color: CRM.coral })
  round(context, x, y, width, 34 * k, 8 * k)
  context.fillStyle = CRM.input
  context.fill()
  context.lineWidth = k
  context.strokeStyle = CRM.border
  context.stroke()
  if (value) write(context, value, x + 12 * k, y + 22 * k, { size: 13 * k, weight: placeholder ? 450 : 500, color: placeholder ? CRM.dim : CRM.text })
}

/** Мастер «Nowa faktura»: три шага в высокой панели. filled — поля уже с данными. */
export function crmInvoiceWizard(filled: boolean): CanvasTexture | null {
  const { width, height } = INVOICE
  const L = invoiceLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    context.fillStyle = CRM.dots
    for (let y = 13 * k; y < height; y += 26 * k)
      for (let x = 13 * k; x < width; x += 26 * k) {
        context.beginPath()
        context.arc(x, y, 1.4 * k, 0, Math.PI * 2)
        context.fill()
      }
    write(context, 'SIMBIA CRM', L.pad, 34 * k, { size: 13 * k, weight: 900, color: CRM.teal, tracking: 2 * k })
    context.font = `600 ${12 * k}px "Inter Variable", Inter, sans-serif`
    const title = tr('Nowa faktura', 'New invoice')
    const pw = context.measureText(title).width + 24 * k
    round(context, width - L.pad - 30 * k - pw, 16 * k, pw, 26 * k, 13 * k)
    context.fillStyle = CRM.hover
    context.fill()
    write(context, title, width - L.pad - 30 * k - pw / 2, 33.5 * k, { size: 12 * k, weight: 600, color: CRM.text, align: 'center' })
    icon(context, 'x', width - L.pad - 18 * k, 21 * k, 16 * k, CRM.muted)
    const steps = [tr('Kontrahent', 'Buyer'), tr('Pozycje i stawki', 'Items and rates'), tr('Podgląd i wysyłka', 'Preview and send')]
    const stepW = (width - L.pad * 2) / 3
    steps.forEach((label, i) => {
      const x = L.pad + i * stepW
      context.beginPath()
      context.arc(x + 12 * k, L.steps.y, 12 * k, 0, Math.PI * 2)
      context.fillStyle = filled ? CRM.teal : i === 0 ? TONES.teal.dim : CRM.hover
      context.fill()
      if (filled) icon(context, 'check', x + 5 * k, L.steps.y - 7 * k, 14 * k, CRM.bg, 0.14)
      else write(context, String(i + 1), x + 12 * k, L.steps.y + 4.5 * k, { size: 12 * k, weight: 650, color: i === 0 ? CRM.teal : CRM.dim, align: 'center' })
      write(context, label, x + 32 * k, L.steps.y + 5 * k, { size: 12.5 * k, weight: 600, color: filled || i === 0 ? CRM.text : CRM.dim })
    })
    const section = (rect: { x: number; y: number; width: number; height: number }, title: string, hint: string) => {
      panel(context, rect.x, rect.y, rect.width, rect.height, k, CRM.glassCard)
      write(context, title, rect.x + 16 * k, rect.y + 30 * k, { size: 15 * k, weight: 620, color: CRM.text })
      writeWrapped(context, hint, rect.x + 16 * k, rect.y + 50 * k, rect.width - 32 * k, { size: 12 * k, weight: 450, color: CRM.muted, lineHeight: 1.35 })
    }
    section(L.s1, tr('Kontrahent', 'Buyer'), tr('Kto jest nabywcą: dane pobierają się po NIP z oficjalnego rejestru MF.', 'Who the buyer is: details come by NIP (Polish tax ID) from the official register.'))
    const seg = [tr('Nowy', 'New'), tr('Zapisany', 'Saved'), tr('Z CRM', 'From CRM')]
    seg.forEach((label, i) => {
      const x = L.s1.x + 16 * k + i * 84 * k
      round(context, x, L.s1.y + 72 * k, 80 * k, 26 * k, 6 * k)
      context.fillStyle = i === 0 ? TONES.teal.dim : CRM.card
      context.fill()
      context.strokeStyle = CRM.border
      context.lineWidth = k
      context.stroke()
      write(context, label, x + 40 * k, L.s1.y + 89.5 * k, { size: 12 * k, weight: 600, color: i === 0 ? CRM.teal : CRM.muted, align: 'center' })
    })
    field(context, 'NIP', L.nip.x, L.nip.y, L.nip.width, filled ? '' : '1234567890', k, false, !filled)
    write(context, tr('Dziesięć cyfr — dane firmy pobiorą się z rejestru same', 'Ten digits — the company details come from the register on their own'), L.nip.x, L.nip.y + 50 * k, { size: 11 * k, weight: 450, color: CRM.dim })
    button(context, tr('Z rejestru', 'Look up'), L.nip.x + L.nip.width + 8 * k, L.nip.y, 'outline', k, { width: 84 * k })
    field(context, tr('Nazwa', 'Name'), L.name.x, L.name.y, L.name.width, filled ? HERO.company : '', k, true)
    field(context, tr('Adres', 'Address'), L.address.x, L.address.y, L.address.width * 0.62, filled ? 'ul. Magazynowa 12, Wrocław' : '', k)
    field(context, tr('Kraj nabywcy', 'Buyer country'), L.address.x + L.address.width * 0.62 + 12 * k, L.address.y, L.address.width * 0.38 - 12 * k, 'PL', k, false, !filled)
    section(L.s2, tr('Pozycje i stawki', 'Items and rates'), tr('Towary i usługi, stawki VAT, daty i sposób płatności.', 'Goods and services, VAT rates, dates and the payment method.'))
    const heads = [tr('Nazwa towaru lub usługi', 'Goods or service'), tr('Ilość', 'Qty'), tr('Jm.', 'Unit'), tr('Cena netto', 'Net price'), tr('Stawka', 'Rate')]
    const cols = [0, 0.48, 0.58, 0.7, 0.9]
    heads.forEach((head, i) => caps(context, head, L.s2.x + 16 * k + cols[i]! * (L.s2.width - 32 * k), L.s2.y + 72 * k, k * 0.9))
    const lines: [string, string, string, string, string][] = [
      [tr('iApply Workforce: wdrożenie', 'iApply Workforce: rollout'), '1', tr('usł.', 'svc'), '38 000,00', '23%'],
      [tr('Szkolenie zespołu', 'Team training'), '2', tr('godz.', 'hrs'), '3 500,00', '23%'],
    ]
    L.lines.forEach((line, i) => {
      round(context, line.x, line.y, line.width, line.height, 8 * k)
      context.fillStyle = CRM.input
      context.fill()
      context.strokeStyle = CRM.border
      context.lineWidth = k
      context.stroke()
      if (!filled) return
      const values = lines[i]!
      values.forEach((value, c) => write(context, value, line.x + 12 * k + cols[c]! * (line.width - 24 * k), line.y + 23 * k, { size: 12.5 * k, weight: c === 0 ? 560 : 500, color: CRM.text }))
    })
    if (filled) {
      const t = L.totals
      const rows: [string, string][] = [
        [tr('Suma netto', 'Net total'), '45 000,00 zł'],
        ['VAT 23%', '10 350,00 zł'],
      ]
      rows.forEach(([label, value], i) => {
        write(context, label, t.x, t.y + 12 * k + i * 18 * k, { size: 12 * k, weight: 450, color: CRM.muted })
        write(context, value, t.x + t.width, t.y + 12 * k + i * 18 * k, { size: 12 * k, weight: 500, color: CRM.text, align: 'right' })
      })
      context.fillStyle = CRM.border
      context.fillRect(t.x, t.y + 40 * k, t.width, Math.max(1, k))
      write(context, tr('Razem brutto', 'Gross total'), t.x, t.y + 58 * k, { size: 15 * k, weight: 620, color: CRM.text })
      write(context, '55 350,00 zł', t.x + t.width, t.y + 58 * k, { size: 15 * k, weight: 650, color: CRM.text, align: 'right' })
    }
    section(L.s3, tr('Podgląd i wysyłka', 'Preview and send'), tr('Sprawdź dokument — tak zobaczy go kontrahent. Numer nada system.', 'Check the document the buyer will see. The system assigns the number.'))
    caps(context, tr('Tak fakturę zobaczy kontrahent', 'How the buyer sees the invoice'), L.preview.x + L.preview.width + 20 * k, L.preview.y + 14 * k, k)
    button(context, tr('Drukuj / PDF', 'Print / PDF'), L.preview.x + L.preview.width + 20 * k, L.preview.y + 28 * k, 'outline', k, { size: 'sm' })
    writeWrapped(context, tr('E-mail nie podany — faktura zostanie wystawiona bez wysyłki maila.', 'No email given — the invoice will be issued without sending anything.'), L.preview.x + L.preview.width + 20 * k, L.preview.y + 84 * k, L.s3.width - L.preview.width - 70 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    round(context, L.preview.x, L.preview.y, L.preview.width, L.preview.height, 6 * k)
    context.fillStyle = CRM.placeholder
    context.fill()
    context.strokeStyle = CRM.border
    context.stroke()
    button(context, tr('Wystaw fakturę · 55 350,00 zł', 'Issue the invoice · 55 350,00 zł'), L.issue.x, L.issue.y, 'primary', k, { align: 'right' })
    button(context, tr('Wstecz', 'Back'), L.s3.x + 16 * k, L.issue.y, 'outline', k)
  })
}

/** Бейдж Białej listy — отдельной плиткой (выходит из панели). */
export function crmVatBadge(): CanvasTexture | null {
  return sharp(330, 28, 4, (context, width, height) => {
    round(context, 0.5, 0.5, width - 1, height - 1, 6)
    context.fillStyle = CRM.card
    context.fill()
    context.fillStyle = TONES.green.dim
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = TONES.green.line
    context.stroke()
    write(context, tr('VAT: Czynny · Biała lista MF (wl-api.mf.gov.pl)', 'VAT: Active · Biała lista MF (wl-api.mf.gov.pl)'), width / 2, height * 0.68, { size: 12.5, weight: 600, color: CRM.green, align: 'center' })
  })
}

/** Лента «Faktury» для прокрутки насквозь (П14): строки повторяются с периодом холста. */
export function crmInvoiceList(): CanvasTexture | null {
  return paintClose(1100, 1812, (context, width, height) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    const k = 2.1
    const rowH = height / 24
    const names = ['Logistyka Wrocław S.A.', 'Wójcik Meble S.A.', 'Kaczmarek Transport', 'Bud-Dom Hurt', 'Adamska Kadry', 'Nowicki Agro']
    const statuses: [string, Tone][] = [
      [tr('Opłacona', 'Paid'), 'green'],
      [tr('Wysłana', 'Sent'), 'teal'],
      [tr('Wystawiona', 'Issued'), 'blue'],
      [tr('Częściowo opłacona', 'Partly paid'), 'amber'],
    ]
    for (let i = 0; i < 24; i++) {
      const y = i * rowH
      context.fillStyle = CRM.border
      context.fillRect(20 * k, y, width - 40 * k, Math.max(1, k))
      write(context, `FV/2026/0${String(900 - i * 7).padStart(3, '0')}`, 24 * k, y + rowH * 0.45, { size: 12 * k, weight: 500, color: CRM.muted })
      write(context, names[i % names.length]!, 24 * k, y + rowH * 0.8, { size: 13 * k, weight: 560, color: CRM.text })
      const [label, tone] = statuses[i % statuses.length]!
      badge(context, label, width - 250 * k, y + rowH * 0.35, tone, k, 'sm')
      write(context, `${12 + ((i * 37) % 80)} ${String((i * 130) % 1000).padStart(3, '0')},00 zł`, width - 24 * k, y + rowH * 0.62, { size: 13 * k, weight: 560, color: CRM.text, align: 'right' })
    }
  })
}

/* ══ 17 · Wydruk faktury i KSeF ══════════════════════════════════════════ */

export const PRINT = { width: 1000, height: 1414 }

/** Где на листе стоит QR, px холста. */
export const PRINT_QR = { x: 70, y: 1010, size: 250 }

export const KSEF_NUMBER = '1234563218-20260928-7C4E1A-9F02B3-01'

export function crmInvoicePrint(accepted: boolean): CanvasTexture | null {
  return paintClose(PRINT.width, PRINT.height, (context, width, height) => {
    round(context, 0, 0, width, height, 14)
    context.fillStyle = '#ffffff'
    context.fill()
    const ink = '#15171a'
    const soft = '#5b606a'
    /* Печатная форма в продукте всегда польская (для иностранного покупателя —
       двуязычная); в английском ролике подписи английские, даты и суммы — как
       на бланке. */
    write(context, tr('Faktura VAT', 'VAT invoice'), 70, 120, { size: 46, weight: 750, color: ink })
    write(context, tr(`Nr ${HERO.invoice}`, `No. ${HERO.invoice}`), 70, 170, { size: 26, weight: 500, color: soft })
    if (accepted) write(context, tr(`Nr KSeF: ${KSEF_NUMBER}`, `KSeF no.: ${KSEF_NUMBER}`), 70, 208, { size: 20, weight: 500, color: soft })
    write(context, tr('Data wystawienia: 28.09.2026', 'Issue date: 28.09.2026'), width - 70, 120, { size: 20, weight: 450, color: soft, align: 'right' })
    write(context, tr('Data sprzedaży: 28.09.2026', 'Sale date: 28.09.2026'), width - 70, 150, { size: 20, weight: 450, color: soft, align: 'right' })
    const party = (title: string, lines: string[], x: number) => {
      write(context, title, x, 290, { size: 18, weight: 700, color: soft, upper: true, tracking: 1.5 })
      lines.forEach((line, i) => write(context, line, x, 330 + i * 32, { size: 22, weight: i === 0 ? 650 : 450, color: ink }))
    }
    party(tr('Sprzedawca', 'Seller'), ['SIMBIA', 'NIP 123-456-32-18', tr('Polska', 'Poland')], 70)
    party(tr('Nabywca', 'Buyer'), [HERO.company, 'NIP 894-301-27-66', 'ul. Magazynowa 12, Wrocław'], 530)
    context.fillStyle = '#e6e8ec'
    context.fillRect(70, 470, width - 140, 2)
    const heads = [tr('Nazwa', 'Item'), tr('Ilość', 'Qty'), tr('Netto', 'Net'), 'VAT', tr('Brutto', 'Gross')]
    const cols = [70, 470, 620, 720, 930]
    heads.forEach((head, i) => write(context, head, cols[i]!, 510, { size: 18, weight: 700, color: soft, align: i === 0 ? 'left' : 'right' }))
    const rows: string[][] = [
      [tr('iApply Workforce: wdrożenie', 'iApply Workforce: rollout'), '1', '38 000,00', '23%', '46 740,00'],
      [tr('Szkolenie zespołu', 'Team training'), '2', '7 000,00', '23%', '8 610,00'],
    ]
    rows.forEach((row, r) => row.forEach((value, i) => write(context, value, cols[i]!, 560 + r * 44, { size: 21, weight: i === 0 ? 560 : 450, color: ink, align: i === 0 ? 'left' : 'right' })))
    context.fillStyle = '#e6e8ec'
    context.fillRect(530, 660, width - 600, 2)
    write(context, tr('Razem brutto', 'Gross total'), 530, 710, { size: 24, weight: 700, color: ink })
    write(context, '55 350,00 zł', width - 70, 710, { size: 30, weight: 800, color: ink, align: 'right' })
    write(context, tr('Termin płatności: 12.10.2026 · Przelew', 'Due date: 12.10.2026 · Bank transfer'), 530, 750, { size: 18, weight: 450, color: soft })
    /* Блок QR: код растёт кубиками в 3D; здесь — рамка, номер KSeF и ссылка. */
    round(context, PRINT_QR.x - 12, PRINT_QR.y - 12, PRINT_QR.size + 24, PRINT_QR.size + 24, 16)
    context.strokeStyle = '#e6e8ec'
    context.lineWidth = 3
    context.stroke()
    const tx = PRINT_QR.x + PRINT_QR.size + 40
    write(context, accepted ? KSEF_NUMBER.slice(0, 19) : tr('Numer KSeF', 'KSeF number'), tx, PRINT_QR.y + 60, { size: 22, weight: 750, color: accepted ? ink : '#b8bcc4' })
    write(context, accepted ? KSEF_NUMBER.slice(19) : tr('po wysłaniu', 'after sending'), tx, PRINT_QR.y + 92, { size: 22, weight: 750, color: accepted ? ink : '#b8bcc4' })
    write(context, tr('Weryfikacja faktury w KSeF:', 'Verify the invoice in KSeF:'), tx, PRINT_QR.y + 150, { size: 20, weight: 500, color: soft })
    write(context, 'qr.ksef.mf.gov.pl/invoice/…', tx, PRINT_QR.y + 180, { size: 20, weight: 450, color: '#2a9baa' })
  })
}

export type KsefState = 0 | 1 | 2 | 3

const KSEF_LABEL = (): [string, Tone][] => [
  ['—', 'gray'],
  [tr('W kolejce', 'Queued'), 'blue'],
  [tr('Wysłano', 'Sent'), 'amber'],
  [tr('Przyjęto', 'Accepted'), 'green'],
]

export function crmKsefCard(state: KsefState): CanvasTexture | null {
  return sharp(420, 230, 2.6, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 14)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    const pad = 18
    icon(context, 'file', pad, pad, 18, CRM.teal)
    write(context, HERO.invoice, pad + 26, pad + 14, { size: 16, weight: 650, color: CRM.text })
    write(context, HERO.company, pad, pad + 40, { size: 12, weight: 450, color: CRM.muted })
    let x = pad
    x += badge(context, tr('Wystawiona', 'Issued'), x, pad + 54, 'blue', 1.15) + 8
    const labels = KSEF_LABEL()
    const [label, tone] = labels[state] ?? labels[0]!
    if (state > 0) badge(context, `KSeF: ${label}`, x, pad + 54, tone, 1.15)
    write(context, tr('Razem brutto', 'Gross total'), pad, pad + 116, { size: 12, weight: 450, color: CRM.muted })
    write(context, '55 350,00 zł', pad, pad + 140, { size: 20, weight: 650, color: CRM.text })
    if (state === 0) button(context, tr('Wyślij do KSeF', 'Send to KSeF'), width - pad, height - pad - 34, 'outline', 1, { icon: 'send', align: 'right' })
    else if (state === 3) {
      const done = tr('Faktura w KSeF', 'Invoice in KSeF')
      context.font = `600 13px ${FONT}`
      /* Галочка — перед надписью; у польской — на своём месте, как было. */
      icon(context, 'check', inEnglish() ? width - pad - context.measureText(done).width - 26 : width - pad - 120, height - pad - 28, 20, CRM.green, 0.13)
      write(context, done, width - pad, height - pad - 12, { size: 13, weight: 600, color: CRM.green, align: 'right' })
    } else write(context, state === 2 ? tr('Wysłano do MF…', 'Sent to the Ministry of Finance…') : tr('W kolejce do wysyłki…', 'Queued for sending…'), width - pad, height - pad - 12, { size: 13, weight: 500, color: TONES[tone].base, align: 'right' })
  })
}

/** Кнопка «Wyślij do KSeF» на карточке, доли карточки. */
export const KSEF_BUTTON = { x: (420 - 18 - 64) / 420, y: (230 - 18 - 17) / 230 }

export function crmKsefConfirm(): CanvasTexture | null {
  return sharp(420, 200, 2.6, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 14)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1
    context.strokeStyle = CRM.borderHover
    context.stroke()
    write(context, tr('Wysłać do KSeF?', 'Send to KSeF?'), 20, 38, { size: 16, weight: 620, color: CRM.text })
    writeWrapped(context, tr(`${HERO.invoice} pójdzie do KSeF i dostanie numer. Na środowisku produkcyjnym to faktura prawnie wiążąca w systemie MF — nie da się jej stamtąd wycofać, można tylko wystawić korektę.`, `${HERO.invoice} goes to KSeF, the national e-invoicing system, and gets a number. In production it is a legally binding invoice in the Ministry of Finance system — it cannot be recalled, only corrected.`), 20, 66, width - 40, { size: 12, weight: 450, color: CRM.muted, lineHeight: 1.4 })
    button(context, tr('Wyślij', 'Send'), width - 20, height - 50, 'primary', 1, { align: 'right' })
    button(context, tr('Anuluj', 'Cancel'), width - 20 - 82, height - 50, 'outline', 1, { align: 'right' })
  })
}

/** Кнопка «Wyślij» в подтверждении, доли диалога. */
export const KSEF_SEND = { x: (420 - 20 - 32) / 420, y: (200 - 50 + 17) / 200 }

/* ══ 18 · Koszt z pliku → JPK ════════════════════════════════════════════ */

export const EXPENSE = { width: 1600, height: 1030, k: 1.75 }

export function expenseLayout() {
  const k = EXPENSE.k
  const pad = 20 * k
  const zone = { x: pad + 60 * k, y: 118 * k, width: EXPENSE.width - pad * 2 - 120 * k, height: 380 * k }
  const preview = { x: EXPENSE.width - pad - 280 * k, y: 124 * k, width: 250 * k, height: 250 * k * 1.3 }
  const add = { x: EXPENSE.width - pad, y: EXPENSE.height - pad - 34 * k }
  return { k, pad, zone, preview, add }
}

export function crmExpense(step: 0 | 1 | 2): CanvasTexture | null {
  const { width, height } = EXPENSE
  const L = expenseLayout()
  const k = L.k
  return paintClose(width, height, (context) => {
    context.fillStyle = CRM.glassBg
    context.fillRect(0, 0, width, height)
    context.fillStyle = CRM.dots
    for (let y = 13 * k; y < height; y += 26 * k)
      for (let x = 13 * k; x < width; x += 26 * k) {
        context.beginPath()
        context.arc(x, y, 1.4 * k, 0, Math.PI * 2)
        context.fill()
      }
    write(context, 'SIMBIA CRM', L.pad, 34 * k, { size: 13 * k, weight: 900, color: CRM.teal, tracking: 2 * k })
    context.font = `600 ${12 * k}px "Inter Variable", Inter, sans-serif`
    const title = tr('Nowy koszt z pliku', 'New expense from a file')
    const pw = context.measureText(title).width + 24 * k
    round(context, width - L.pad - 30 * k - pw, 16 * k, pw, 26 * k, 13 * k)
    context.fillStyle = CRM.hover
    context.fill()
    write(context, title, width - L.pad - 30 * k - pw / 2, 33.5 * k, { size: 12 * k, weight: 600, color: CRM.text, align: 'center' })
    icon(context, 'x', width - L.pad - 18 * k, 21 * k, 16 * k, CRM.muted)
    const steps = [tr('Wgraj plik', 'Upload'), tr('Odczyt dokumentu', 'Processing'), tr('Sprawdź i dodaj', 'Confirm')]
    steps.forEach((label, i) => {
      const x = L.pad + 60 * k + i * 250 * k
      const done = i < step
      const current = i === step
      context.beginPath()
      context.arc(x + 12 * k, 78 * k, 12 * k, 0, Math.PI * 2)
      context.fillStyle = done ? CRM.teal : current ? TONES.teal.dim : CRM.hover
      context.fill()
      if (done) icon(context, 'check', x + 5 * k, 71 * k, 14 * k, CRM.bg, 0.14)
      else write(context, String(i + 1), x + 12 * k, 82.5 * k, { size: 12 * k, weight: 650, color: current ? CRM.teal : CRM.dim, align: 'center' })
      write(context, label, x + 32 * k, 83 * k, { size: 13 * k, weight: 600, color: done || current ? CRM.text : CRM.dim })
    })
    if (step === 0 || step === 1) {
      const z = L.zone
      context.setLineDash([10 * k, 8 * k])
      round(context, z.x, z.y, z.width, z.height, 16 * k)
      context.lineWidth = 2 * k
      context.strokeStyle = step === 1 ? TONES.teal.line : CRM.borderHover
      context.stroke()
      context.setLineDash([])
      context.beginPath()
      context.arc(z.x + z.width / 2, z.y + 150 * k, 24 * k, 0, Math.PI * 2)
      context.fillStyle = TONES.teal.dim
      context.fill()
      icon(context, 'fileUp', z.x + z.width / 2 - 13 * k, z.y + 137 * k, 26 * k, CRM.teal)
      if (step === 0) {
        write(context, tr('Przeciągnij plik tutaj albo kliknij, żeby wybrać', 'Drag the file here or click to choose'), z.x + z.width / 2, z.y + 210 * k, { size: 15 * k, weight: 600, color: CRM.text, align: 'center' })
        write(context, tr('PDF, JPG lub PNG', 'PDF, JPG or PNG'), z.x + z.width / 2, z.y + 234 * k, { size: 12 * k, weight: 450, color: CRM.muted, align: 'center' })
      } else {
        write(context, tr('Odczyt dokumentu i rozpoznawanie pól…', 'Reading the document and recognising fields…'), z.x + z.width / 2, z.y + 214 * k, { size: 15 * k, weight: 600, color: CRM.text, align: 'center' })
      }
      button(context, tr('Wpisz ręcznie bez pliku', 'Enter manually without a file'), z.x, height - L.pad - 34 * k, 'ghost', k)
      button(context, tr('Dalej', 'Next'), L.add.x, L.add.y, 'primary', k, { align: 'right' })
      return
    }
    write(context, tr('Odczytano z PDF', 'Read from PDF'), L.pad + 60 * k, 126 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    const warn = { x: L.pad + 60 * k, y: 138 * k, width: L.preview.x - L.pad - 80 * k, height: 58 * k }
    round(context, warn.x, warn.y, warn.width, warn.height, 12 * k)
    context.fillStyle = TONES.amber.dim
    context.fill()
    context.strokeStyle = TONES.amber.line
    context.lineWidth = k
    context.stroke()
    caps(context, tr('Do sprawdzenia', 'To check'), warn.x + 14 * k, warn.y + 22 * k, k, CRM.amber)
    write(context, tr('• Faktura w cenach brutto — ceny netto wyliczył system ze stawki VAT', '• Invoice in gross prices — the system worked out net prices from the VAT rate'), warn.x + 14 * k, warn.y + 44 * k, { size: 12 * k, weight: 450, color: CRM.text })
    const col = { x: warn.x, width: warn.width }
    const block = (title: string, y: number, rows: [string, string][]) => {
      write(context, title, col.x, y, { size: 14 * k, weight: 620, color: CRM.text })
      rows.forEach(([label, value], i) => {
        const x = col.x + (i % 2) * (col.width / 2)
        const ry = y + 26 * k + Math.floor(i / 2) * 50 * k
        caps(context, label, x, ry, k * 0.9)
        round(context, x, ry + 7 * k, col.width / 2 - 12 * k, 30 * k, 7 * k)
        context.fillStyle = CRM.input
        context.fill()
        context.strokeStyle = CRM.border
        context.stroke()
        write(context, value, x + 10 * k, ry + 27 * k, { size: 12.5 * k, weight: 500, color: CRM.text })
      })
    }
    block(tr('Sprzedawca', 'Seller'), 232 * k, [
      [tr('Nazwa', 'Name'), 'Kurier Plus sp. z o.o.'],
      ['NIP', '521 ••• •• ••'],
    ])
    block(tr('Dokument', 'Document'), 330 * k, [
      [tr('Numer faktury sprzedawcy', 'Seller’s invoice number'), 'FV/0931/09/2026'],
      [tr('Kategoria kosztu', 'Expense category'), tr('Transport i kurierzy', 'Transport and couriers')],
    ])
    block(tr('Pozycje', 'Lines'), 428 * k, [
      [tr('Nazwa', 'Name'), tr('Przesyłki kurierskie, wrzesień', 'Courier shipments, September')],
      [tr('Brutto z dokumentu', 'Gross per document'), '1 845,00 zł'],
    ])
    caps(context, tr('Dokument', 'Document'), L.preview.x, L.preview.y - 8 * k, k)
    write(context, tr('Plik zostanie dołączony do faktury', 'The file will be attached to the invoice'), L.preview.x, L.preview.y + L.preview.height + 22 * k, { size: 12 * k, weight: 450, color: CRM.muted })
    button(context, tr('Wstecz', 'Back'), col.x, L.add.y, 'ghost', k)
    button(context, tr('Dodaj fakturę', 'Add invoice'), L.add.x, L.add.y, 'primary', k, { align: 'right' })
  })
}

/** Страница PDF поставщика: объёмный файл падает в зону. */
export function crmPdfPage(): CanvasTexture | null {
  return paintClose(700, 990, (context, width, height) => {
    round(context, 0, 0, width, height, 12)
    context.fillStyle = '#ffffff'
    context.fill()
    const ink = '#15171a'
    const soft = '#6a707a'
    write(context, tr('FAKTURA VAT', 'VAT INVOICE'), 50, 90, { size: 36, weight: 800, color: ink })
    write(context, 'FV/0931/09/2026', 50, 130, { size: 22, weight: 500, color: soft })
    write(context, 'Kurier Plus sp. z o.o.', 50, 210, { size: 22, weight: 650, color: ink })
    write(context, 'NIP 521 ••• •• ••', 50, 242, { size: 19, weight: 450, color: soft })
    for (let i = 0; i < 7; i++) {
      round(context, 50, 300 + i * 46, (width - 100) * (i % 3 === 1 ? 0.7 : 1), 14, 7)
      context.fillStyle = '#eceef1'
      context.fill()
    }
    write(context, tr('Do zapłaty: 1 845,00 zł', 'Amount due: 1 845,00 zł'), width - 50, 700, { size: 26, weight: 750, color: ink, align: 'right' })
    round(context, width - 150, 40, 100, 56, 12)
    context.fillStyle = '#e5484d'
    context.fill()
    write(context, 'PDF', width - 100, 78, { size: 26, weight: 800, color: '#ffffff', align: 'center' })
  })
}

export function crmJpkCard(): CanvasTexture | null {
  return sharp(420, 330, 2.6, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 14)
    context.fillStyle = CRM.glassTile
    context.fill()
    context.lineWidth = 1.2
    context.strokeStyle = CRM.borderHover
    context.stroke()
    const pad = 20
    write(context, 'JPK_V7M', pad, pad + 20, { size: 18, weight: 700, color: CRM.text })
    /* По-английски — с пояснением: JPK_V7M — ежемесячная декларация VAT. */
    write(context, tr('2026-09', '2026-09 · monthly VAT return'), pad, pad + 42, { size: 12, weight: 450, color: CRM.muted })
    context.font = `600 11px "Inter Variable", Inter, sans-serif`
    const draft = tr('szkic', 'draft')
    badge(context, draft, width - pad - context.measureText(draft).width - 14, pad + 6, 'gray', 1)
    const rows: [string, string][] = [
      [tr('Sprzedaż netto', 'Net sales'), '45 000,00 zł'],
      [tr('VAT należny', 'Output VAT'), '10 350,00 zł'],
      [tr('Zakup netto', 'Net purchases'), '1 500,00 zł'],
      [tr('VAT naliczony', 'Input VAT'), '345,00 zł'],
    ]
    rows.forEach(([label, value], i) => {
      const y = pad + 80 + i * 30
      write(context, label, pad, y, { size: 13, weight: 450, color: CRM.muted })
      write(context, value, width - pad, y, { size: 13, weight: 560, color: CRM.text, align: 'right' })
    })
    context.fillStyle = CRM.border
    context.fillRect(pad, pad + 186, width - pad * 2, 1)
    write(context, tr('VAT do zapłaty', 'VAT payable'), pad, pad + 214, { size: 14, weight: 620, color: CRM.amber })
    write(context, '10 005,00 zł', width - pad, pad + 214, { size: 14, weight: 650, color: CRM.amber, align: 'right' })
    const xml = button(context, tr('Pobierz XML', 'Download XML'), pad, height - pad - 34, 'outline', 1, { icon: 'download' })
    /* «VAT-UE» — за первой кнопкой: английская шире польской. */
    button(context, 'VAT-UE', inEnglish() ? pad + xml + 12 : pad + 140, height - pad - 34, 'outline', 1)
  })
}

/* ══ 19–20 · Ноутбук и телефон ═══════════════════════════════════════════
   На ноутбуке — те же экраны, что на станциях 05 и 08, сведённые в один
   холст 16:10; на телефоне — веб-CRM в мобильной раскладке (приложение для
   iPhone пока только по-русски, поэтому в ролике — сайт в Safari). */

/** Холст src вписывается в холст 16:10 по высоте, по бокам — фон. */
function fitInto(source: HTMLCanvasElement, width: number, height: number, background: string): CanvasTexture | null {
  return paint(width, height, (context) => {
    context.fillStyle = background
    context.fillRect(0, 0, width, height)
    const scale = Math.min(width / source.width, height / source.height)
    const w = source.width * scale
    const h = source.height * scale
    context.drawImage(source, (width - w) / 2, (height - h) / 2, w, h)
  })
}

function canvasOf(texture: CanvasTexture | null): HTMLCanvasElement | null {
  return texture ? (texture.image as HTMLCanvasElement) : null
}

/** Пульт на экране ноутбука: подложка, плитки, «Na dziś», воронка — одним холстом. */
export function crmLaptopPulpit(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const parts = {
    base: crmDashboardBase(),
    kpi: DASH_SLOTS.kpi.map((_, i) => crmKpiTile(i)),
    today: crmTodayCard(),
    rows: DASH_SLOTS.todayRows.map((_, i) => crmTodayRow(i)),
    funnel: crmFunnelCard(),
  }
  const canvas = document.createElement('canvas')
  canvas.width = DASH.width
  canvas.height = DASH.height
  const context = canvas.getContext('2d')
  const draw = (texture: CanvasTexture | null, slot: { x: number; y: number; width: number; height: number }) => {
    const image = canvasOf(texture)
    if (image && context) context.drawImage(image, slot.x, slot.y, slot.width, slot.height)
  }
  if (context) {
    draw(parts.base, { x: 0, y: 0, width: DASH.width, height: DASH.height })
    DASH_SLOTS.kpi.forEach((slot, i) => draw(parts.kpi[i] ?? null, slot))
    draw(parts.today, DASH_SLOTS.today)
    DASH_SLOTS.todayRows.forEach((slot, i) => draw(parts.rows[i] ?? null, slot))
    draw(parts.funnel, DASH_SLOTS.funnel)
    FUNNEL.forEach(([, share], i) => {
      const track = funnelTrack(i)
      round(context, DASH_SLOTS.funnel.x + track.x, DASH_SLOTS.funnel.y + track.y, track.width * share, track.height, track.height / 2)
      context.fillStyle = i === FUNNEL.length - 1 ? CRM.green : CRM.teal
      context.fill()
    })
  }
  const out = fitInto(canvas, LOGIN.width, LOGIN.height, CRM.bg)
  for (const texture of [parts.base, ...parts.kpi, parts.today, ...parts.rows, parts.funnel]) texture?.dispose()
  return out
}

/** Карточка лида на экране ноутбука — те же блоки, что на станциях 07–10. */
export function crmLaptopLead(): CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const L = leadCardLayout()
  const parts = {
    base: crmLeadCardBase('Spotkanie'),
    scoring: crmScoringBlock(2, true),
    contact: crmContactBlock(),
    sequence: crmSequenceBlock(7, true),
    history: crmHistoryBlock(['mail-in', 'offer', 'call-ok', 'call-missed'], { banner: true }),
  }
  const canvas = document.createElement('canvas')
  canvas.width = LEAD_CARD.width
  canvas.height = LEAD_CARD.height
  const context = canvas.getContext('2d')
  const draw = (texture: CanvasTexture | null, slot: { x: number; y: number; width: number; height: number }) => {
    const image = canvasOf(texture)
    if (image && context) context.drawImage(image, slot.x, slot.y, slot.width, slot.height)
  }
  draw(parts.base, { x: 0, y: 0, width: LEAD_CARD.width, height: LEAD_CARD.height })
  draw(parts.scoring, L.scoring)
  draw(parts.contact, L.contact)
  draw(parts.sequence, L.sequence)
  draw(parts.history, L.history)
  const out = fitInto(canvas, LOGIN.width, LOGIN.height, CRM.bg)
  for (const texture of Object.values(parts)) texture?.dispose()
  return out
}

/* ── Телефон: веб-CRM в Safari, 393 × 852 pt, холст ×2 ─────────────────── */

const PHONE_SCALE = 2
export const PHONE_PX = { width: 393 * PHONE_SCALE, height: 852 * PHONE_SCALE }

export type PhoneScreen = 'pulpit' | 'menu' | 'leads' | 'leadsTap' | 'lead'

/** Где на экране телефона то, по чему касаемся, pt. */
export const PHONE_TAPS = {
  menu: { x: 30, y: 87 },
  leady: { x: 90, y: 316 },
  hero: { x: 196, y: 372 },
}

function phoneChrome(context: CanvasRenderingContext2D, title: string) {
  const s = PHONE_SCALE
  context.fillStyle = CRM.bg
  context.fillRect(0, 0, PHONE_PX.width, PHONE_PX.height)
  statusBar(context, s, CRM.text)
  /* Шапка: меню, раздел, поиск. */
  context.fillStyle = CRM.border
  context.fillRect(0, 115 * s, PHONE_PX.width, s)
  icon(context, 'menu', 18 * s, 75 * s, 24 * s, CRM.text)
  write(context, title, 56 * s, 94 * s, { size: 17 * s, weight: 620, color: CRM.text })
  icon(context, 'search', 350 * s, 76 * s, 22 * s, CRM.muted)
  /* Safari: адресная строка внизу — это сайт. */
  const bar = { x: 16 * s, y: 792 * s, width: 361 * s, height: 44 * s }
  context.fillStyle = CRM.safariBar
  context.fillRect(0, 776 * s, PHONE_PX.width, 76 * s)
  round(context, bar.x, bar.y, bar.width, bar.height, 22 * s)
  context.fillStyle = CRM.safariField
  context.fill()
  write(context, 'aA', bar.x + 18 * s, bar.y + 28 * s, { size: 14 * s, weight: 600, color: CRM.text })
  write(context, 'crm.simbia.eu', bar.x + bar.width / 2, bar.y + 28 * s, { size: 15 * s, weight: 560, color: CRM.text, align: 'center' })
  icon(context, 'history', bar.x + bar.width - 36 * s, bar.y + 12 * s, 20 * s, CRM.muted)
}

function phoneLeadCard(context: CanvasRenderingContext2D, x: number, y: number, width: number, s: number, highlight: boolean, name: string, company: string, stage: string, score: number, amount: string) {
  const h = 158 * s
  round(context, x, y, width, h, 12 * s)
  context.fillStyle = CRM.card
  context.fill()
  if (highlight) {
    context.fillStyle = TONES.teal.dim
    context.fill()
  }
  context.lineWidth = s
  context.strokeStyle = highlight ? CRM.teal : CRM.border
  context.stroke()
  const pad = 14 * s
  toneAvatar(context, name, x + pad, y + pad, 36 * s)
  write(context, name, x + pad + 46 * s, y + pad + 15 * s, { size: 15 * s, weight: 620, color: CRM.text })
  write(context, tr(`${company} · Sekwencja: dzień 7`, `${company} · Sequence: day 7`), x + pad + 46 * s, y + pad + 33 * s, { size: 11.5 * s, weight: 450, color: CRM.dim })
  context.font = `600 ${11 * s}px "Inter Variable", Inter, sans-serif`
  const label = stageLabel(stage)
  const bw = context.measureText(label).width + 14 * s
  badge(context, label, x + width - pad - bw, y + pad + 2 * s, STAGE[stage] ?? 'gray', s)
  write(context, `${HERO.service} · ${sourceLabel('Strona WWW')}`, x + pad, y + 76 * s, { size: 12.5 * s, weight: 450, color: CRM.muted })
  scoreBar(context, x + pad, y + 90 * s, width - pad * 2, score, s)
  write(context, amount, x + pad, y + 134 * s, { size: 13 * s, weight: 600, color: CRM.text })
  write(context, tr('28.09.26', '09/28/26'), x + pad + 96 * s, y + 134 * s, { size: 12 * s, weight: 450, color: CRM.muted })
  toneAvatar(context, HERO.owner, x + pad + 170 * s, y + 118 * s, 22 * s)
  for (const [i, glyph] of (['phone', 'mail'] as IconName[]).entries()) {
    const bx = x + width - pad - 36 * s - i * 44 * s
    round(context, bx, y + 110 * s, 36 * s, 36 * s, 9 * s)
    context.fillStyle = TONES.teal.dim
    context.fill()
    icon(context, glyph, bx + 9 * s, y + 119 * s, 18 * s, CRM.teal)
  }
}

export function crmPhone(screen: PhoneScreen): CanvasTexture | null {
  const s = PHONE_SCALE
  return paintClose(PHONE_PX.width, PHONE_PX.height, (context) => {
    if (screen === 'menu') {
      phoneChrome(context, tr('Pulpit', 'Dashboard'))
      context.fillStyle = CRM.sidebar
      context.fillRect(0, 59 * s, PHONE_PX.width, 717 * s)
      write(context, 'SIMBIA CRM', 20 * s, 96 * s, { size: 17 * s, weight: 900, color: CRM.teal, tracking: 2 * s })
      icon(context, 'x', 350 * s, 80 * s, 20 * s, CRM.muted)
      const groups = NAV()
      let y = 142 * s
      for (const [group, items] of groups) {
        caps(context, group, 20 * s, y, s, CRM.dim)
        y += 14 * s
        for (const item of items) {
          const active = item === tr('Pulpit', 'Dashboard')
          const tapped = item === tr('Leady', 'Leads')
          if (active || tapped) {
            round(context, 12 * s, y, 369 * s, 36 * s, 9 * s)
            context.fillStyle = tapped ? CRM.tapped : TONES.teal.dim
            context.fill()
          }
          write(context, item, 24 * s, y + 24 * s, { size: 15 * s, weight: active || tapped ? 620 : 500, color: active || tapped ? CRM.teal : CRM.muted })
          if (item === tr('Priorytety', 'Priorities')) {
            round(context, 340 * s, y + 9 * s, 26 * s, 18 * s, 9 * s)
            context.fillStyle = TONES.coral.dim
            context.fill()
            write(context, '4', 353 * s, y + 22 * s, { size: 11 * s, weight: 650, color: CRM.coral, align: 'center' })
          }
          y += 38 * s
        }
        y += 14 * s
      }
      return
    }
    if (screen === 'pulpit') {
      phoneChrome(context, tr('Pulpit', 'Dashboard'))
      write(context, tr('Cześć, Anna', 'Hello, Anna'), 20 * s, 160 * s, { size: 26 * s, weight: 650, color: CRM.text })
      write(context, tr('Dane dla: SIMBIA', 'Data for: SIMBIA'), 20 * s, 184 * s, { size: 13 * s, weight: 450, color: CRM.muted })
      const kpi: [string, string, string][] = [
        [tr('Wszystkich leadów', 'Leads in total'), '312', CRM.text],
        [tr('Leadów w tym miesiącu', 'Leads this month'), '48', CRM.text],
        [tr('Gorących', 'Hot'), '27', CRM.coral],
        [tr('Konwersja', 'Conversion'), '18%', CRM.green],
      ]
      kpi.forEach(([label, value, color], i) => {
        const x = 20 * s + (i % 2) * 181 * s
        const y = 204 * s + Math.floor(i / 2) * 92 * s
        panel(context, x, y, 172 * s, 82 * s, s)
        write(context, label, x + 12 * s, y + 24 * s, { size: 11.5 * s, weight: 520, color: CRM.muted })
        write(context, value, x + 12 * s, y + 62 * s, { size: 28 * s, weight: 700, color })
      })
      const card = { x: 20 * s, y: 398 * s, width: 353 * s, height: 360 * s }
      panel(context, card.x, card.y, card.width, card.height, s)
      write(context, tr('Na dziś', 'For today'), card.x + 14 * s, card.y + 30 * s, { size: 17 * s, weight: 620, color: CRM.text })
      write(context, tr('Kolejność ustala silnik priorytetów', 'The order comes from the priority engine'), card.x + 14 * s, card.y + 50 * s, { size: 12 * s, weight: 450, color: CRM.muted })
      const rows: [string, string, string][] = [
        [HERO.name, 'Spotkanie', tr('Spotkanie umówione — potwierdź termin i przygotuj demo', 'Meeting booked — confirm the time and prepare the demo')],
        ['Katarzyna Wójcik', 'Oferta wysłana', tr('Oferta bez odpowiedzi od 9 dn. — dopytaj o decyzję telefonicznie', 'Quote unanswered for 9 d — call and pin down the decision')],
        ['Piotr Kaczmarek', 'Negocjacje', tr('Negocjacje w aktywnej fazie — uzgodnij warunki', 'Negotiation in full swing — agree the terms')],
      ]
      rows.forEach(([name, stage, reason], i) => {
        const y = card.y + 68 * s + i * 96 * s
        round(context, card.x + 10 * s, y, card.width - 20 * s, 88 * s, 10 * s)
        context.fillStyle = CRM.hover
        context.fill()
        toneAvatar(context, name, card.x + 20 * s, y + 12 * s, 32 * s)
        write(context, name, card.x + 62 * s, y + 25 * s, { size: 14 * s, weight: 620, color: CRM.text })
        badge(context, stageLabel(stage), card.x + 62 * s, y + 33 * s, STAGE[stage] ?? 'gray', s, 'sm')
        writeWrapped(context, reason, card.x + 20 * s, y + 66 * s, card.width - 130 * s, { size: 11 * s, weight: 450, color: CRM.muted, lineHeight: 1.3 })
        button(context, tr('Zadzwoń', 'Call'), card.x + card.width - 20 * s, y + 46 * s, 'outline', s, { size: 'sm', align: 'right' })
      })
      return
    }
    if (screen === 'leads' || screen === 'leadsTap') {
      phoneChrome(context, tr('Leady', 'Leads'))
      round(context, 16 * s, 128 * s, 361 * s, 40 * s, 9 * s)
      context.fillStyle = CRM.input
      context.fill()
      context.strokeStyle = CRM.border
      context.lineWidth = s
      context.stroke()
      icon(context, 'search', 28 * s, 139 * s, 18 * s, CRM.dim)
      write(context, tr('Szukaj (/ albo f)…', 'Search (/ or f)…'), 54 * s, 153 * s, { size: 14 * s, weight: 450, color: CRM.dim })
      let x = 16 * s
      const all = tr('Wszystkie', 'All')
      for (const chip of [all, 'HR-Tech', tr('B2B-hurt', 'B2B wholesale'), 'Taxi', 'CRM']) {
        context.font = `600 ${12.5 * s}px "Inter Variable", Inter, sans-serif`
        const w = context.measureText(chip).width + 22 * s
        round(context, x, 180 * s, w, 32 * s, 8 * s)
        context.fillStyle = chip === all ? TONES.teal.dim : CRM.card
        context.fill()
        context.strokeStyle = CRM.border
        context.stroke()
        write(context, chip, x + 11 * s, 201 * s, { size: 12.5 * s, weight: 600, color: chip === all ? CRM.teal : CRM.muted })
        x += w + 6 * s
      }
      const tabs: [string, string][] = [
        [all, '48'],
        [stageLabel('Nowy'), '9'],
        [stageLabel('W kontakcie'), '12'],
        [stageLabel('Spotkanie'), '8'],
      ]
      x = 16 * s
      tabs.forEach(([label, count], i) => {
        const w = write(context, label, x, 246 * s, { size: 13.5 * s, weight: i === 0 ? 620 : 500, color: i === 0 ? CRM.text : CRM.muted })
        context.font = `600 ${11 * s}px "Inter Variable", Inter, sans-serif`
        const pw = context.measureText(count).width + 12 * s
        round(context, x + w + 5 * s, 234 * s, pw, 17 * s, 8.5 * s)
        context.fillStyle = i === 0 ? TONES.teal.dim : CRM.hover
        context.fill()
        write(context, count, x + w + 5 * s + pw / 2, 246.5 * s, { size: 11 * s, weight: 600, color: i === 0 ? CRM.teal : CRM.muted, align: 'center' })
        if (i === 0) {
          context.fillStyle = CRM.teal
          context.fillRect(x, 258 * s, w + pw + 5 * s, 2 * s)
        }
        x += w + pw + 20 * s
      })
      phoneLeadCard(context, 16 * s, 276 * s, 361 * s, s, screen === 'leadsTap', HERO.name, HERO.company, 'Spotkanie', HERO.score, '45 tys. zł')
      phoneLeadCard(context, 16 * s, 446 * s, 361 * s, s, false, 'Katarzyna Wójcik', 'Wójcik Meble S.A.', 'Oferta wysłana', 79, '32 tys. zł')
      phoneLeadCard(context, 16 * s, 616 * s, 361 * s, s, false, 'Piotr Kaczmarek', 'Kaczmarek Transport', 'Negocjacje', 76, '65 tys. zł')
      return
    }
    /* Карточка лида на телефоне: шапка, статус, «Kontakt», «Scoring». */
    phoneChrome(context, tr('Leady', 'Leads'))
    button(context, tr('Wstecz', 'Back'), 12 * s, 128 * s, 'ghost', s, { size: 'sm' })
    icon(context, 'more', 350 * s, 136 * s, 22 * s, CRM.muted)
    toneAvatar(context, HERO.name, 20 * s, 170 * s, 44 * s)
    write(context, HERO.name, 74 * s, 190 * s, { size: 19 * s, weight: 650, color: CRM.text })
    write(context, HERO.company, 74 * s, 210 * s, { size: 12.5 * s, weight: 450, color: CRM.muted })
    badge(context, tr('Twój lead', 'Your lead'), 20 * s, 228 * s, 'teal', s, 'sm')
    round(context, 16 * s, 256 * s, 361 * s, 40 * s, 9 * s)
    context.fillStyle = CRM.input
    context.fill()
    context.strokeStyle = CRM.borderHover
    context.lineWidth = s
    context.stroke()
    context.beginPath()
    context.arc(34 * s, 276 * s, 4 * s, 0, Math.PI * 2)
    context.fillStyle = CRM.blue
    context.fill()
    write(context, stageLabel('Spotkanie'), 46 * s, 281 * s, { size: 14 * s, weight: 520, color: CRM.text })
    const contact = { x: 16 * s, y: 310 * s, width: 361 * s, height: 214 * s }
    panel(context, contact.x, contact.y, contact.width, contact.height, s)
    sectionTitle(context, 'user', tr('Kontakt', 'Contact'), contact.x + 14 * s, contact.y + 30 * s, s)
    const rows: [IconName, string, string, string][] = [
      ['phone', tr('Telefon', 'Phone'), HERO.phone, tr('Zadzwoń', 'Call')],
      ['mail', tr('E-mail', 'Email'), HERO.email, tr('Napisz', 'Write')],
      ['globe', tr('Strona', 'Website'), 'logistyka.example', tr('Otwórz', 'Open')],
    ]
    rows.forEach(([glyph, label, value, action], i) => {
      const y = contact.y + 48 * s + i * 54 * s
      round(context, contact.x + 12 * s, y, contact.width - 24 * s, 48 * s, 10 * s)
      context.fillStyle = CRM.input
      context.fill()
      icon(context, glyph, contact.x + 24 * s, y + 15 * s, 17 * s, CRM.teal)
      caps(context, label, contact.x + 52 * s, y + 19 * s, s * 0.9, CRM.dim)
      write(context, value, contact.x + 52 * s, y + 37 * s, { size: 13 * s, weight: 500, color: CRM.text })
      context.font = `600 ${12 * s}px "Inter Variable", Inter, sans-serif`
      const aw = context.measureText(action).width + 18 * s
      round(context, contact.x + contact.width - 22 * s - aw, y + 10 * s, aw, 28 * s, 7 * s)
      context.fillStyle = TONES.teal.dim
      context.fill()
      write(context, action, contact.x + contact.width - 22 * s - aw / 2, y + 28.5 * s, { size: 12 * s, weight: 600, color: CRM.teal, align: 'center' })
    })
    const scoring = { x: 16 * s, y: 538 * s, width: 361 * s, height: 150 * s }
    context.save()
    context.translate(scoring.x, scoring.y)
    drawScoring(context, scoring.width, scoring.height, s * 0.98)
    context.restore()
  })
}

/** Карточка лида из мобильного списка — она перелетает с ноутбука в телефон. */
export function crmMobileLeadCard(): CanvasTexture | null {
  return sharp(361, 158, 2.4, (context) => phoneLeadCard(context, 0.5, 0.5, 360, 1, true, HERO.name, HERO.company, 'Spotkanie', HERO.score, '45 tys. zł'))
}

/** Пункт меню «Leady», как в мобильном меню (выбранный): мостик 20 → 21 — он
    улетает с телефона к барабану разделов (v3.2). */
export const NAV_PILL = { width: 300, height: 76 }

export function crmNavPill(): CanvasTexture | null {
  return sharp(NAV_PILL.width, NAV_PILL.height, 3, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 18)
    context.fillStyle = CRM.card
    context.fill()
    context.fillStyle = CRM.tapped
    context.fill()
    context.lineWidth = 1.5
    context.strokeStyle = TONES.teal.line
    context.stroke()
    icon(context, 'list', 22, height / 2 - 14, 28, CRM.teal)
    write(context, 'Leady', 64, height / 2 + 10, { size: 28, weight: 650, color: CRM.teal })
  })
}

/* ══ 21 · 19 модулей ═════════════════════════════════════════════════════
   19 пунктов меню веб-CRM без «Instrukcja», «Playbook» и «Ustawienia»
   (app/Sidebar.tsx): это свойство продукта, счётчик разрешён. */

export const MODULES = ['Pulpit', 'Raporty', 'Priorytety', 'Leady', 'Kanban', 'Oferty', 'Kalendarz', 'Kampanie', 'Poczta', 'Follow-up', 'Projekty', 'Zadania', 'Dokumenty', 'Finanse', 'Faktury', 'Koszty', 'Księgi', 'Podatki', 'Kadry']
/** Те же 19 пунктов по-английски (i18n nav.items), в том же порядке. */
export const MODULES_EN = ['Dashboard', 'Reports', 'Priorities', 'Leads', 'Kanban', 'Quotes', 'Calendar', 'Campaigns', 'Mail', 'Follow-up', 'Projects', 'Tasks', 'Documents', 'Finances', 'Invoices', 'Expenses', 'Ledgers', 'Taxes', 'Staff']

/* ══ 22 · Три причины (О4, белые карточки) ═══════════════════════════════ */

/** en — английская пара для 2D-ролика: художник берёт её через tr. */
export const REASONS: { icon: IconName; title: string; text: string; en: { title: string; text: string } }[] = [
  { icon: 'server', title: 'Serwer w Niemczech (EOG)', text: 'Serwer i baza stoją w EOG', en: { title: 'Servers in Germany (EEA)', text: 'Server and database stay in the EEA' } },
  { icon: 'key', title: 'Klucz zamiast hasła', text: 'Klucz mieszka w urządzeniu i potwierdza go Face ID albo Touch ID', en: { title: 'Passkeys, not passwords', text: 'The passkey lives on your device and is confirmed with Face ID or Touch ID' } },
  { icon: 'languages', title: 'języków', text: 'PL · EN · DE · FR · RU', en: { title: 'languages', text: 'PL · EN · DE · FR · RU' } },
]

export const REASON_CARD = { width: 460, height: 300 }
/** Где на третьей карточке стоит число «5», px карточки. */
export const REASON_NUMBER = { x: 28, y: 188, size: 64 }

export function crmReasonCard(index: number): CanvasTexture | null {
  const item = REASONS[index] ?? REASONS[0]!
  return sharp(REASON_CARD.width, REASON_CARD.height, 2, (context, width, height) => {
    round(context, 1, 1, width - 2, height - 2, 26)
    context.fillStyle = CRM.paper
    context.fill()
    context.lineWidth = 1.5
    context.strokeStyle = CRM.paperEdge
    context.stroke()
    const pad = 28
    write(context, String(index + 1).padStart(2, '0'), pad, 50, { size: 22, weight: 700, color: CRM.paperAccent, tracking: 1 })
    round(context, pad, 72, 60, 60, 16)
    context.fillStyle = CRM.paperWash
    context.fill()
    icon(context, item.icon, pad + 12, 84, 36, CRM.paperAccent, 0.09)
    const title = tr(item.title, item.en.title)
    if (index === 2) {
      write(context, title, pad + REASON_NUMBER.size * 0.72, 188, { size: 34, weight: 800, color: CRM.paperInk, tracking: -0.8 })
    } else {
      /* Заголовок — в одну строку: «Serwer w Niemczech (EOG)» на 30 px переносился
         и второй строкой наезжал на подпись. */
      let size = 30
      context.font = `800 ${size}px ${FONT}`
      while (size > 22 && context.measureText(title).width > width - pad * 2) {
        size -= 1
        context.font = `800 ${size}px ${FONT}`
      }
      write(context, title, pad, 186, { size, weight: 800, color: CRM.paperInk })
    }
    writeWrapped(context, tr(item.text, item.en.text), pad, height - 62, width - pad * 2, { size: 17, weight: 500, color: CRM.paperMuted, lineHeight: 1.3 })
  })
}

/* ══ 24 · Финал: кнопка «Umów demo» ══════════════════════════════════════ */

export function crmDemoButton(): CanvasTexture | null {
  return sharp(360, 88, 3, (context, width, height) => {
    round(context, 0.5, 0.5, width - 1, height - 1, height / 2)
    context.fillStyle = CRM.teal
    context.fill()
    write(context, 'Umów demo', width / 2 - 14, height * 0.64, { size: 34, weight: 750, color: CRM.bg, align: 'center', tracking: -0.4 })
    icon(context, 'arrowRight', width / 2 + 92, height / 2 - 15, 30, CRM.bg, 0.12)
  })
}
