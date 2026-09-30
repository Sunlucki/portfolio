import type { CanvasTexture } from 'three'
import { LAPTOP_SCREEN, PHONE_SCREEN } from './objects'
import { FONT, paint, round, tint, tr } from './paint'

/* Двойники экранов iApply для моушн-слоя (02-IAPPLY, 06-MOTION §6). Цвета —
   токены продукта: Tailwind-палитра веб-клиента (WEB APP/client/tailwind.config.js,
   primary #3A3086) и Theme/SPGPalette iOS-приложения (IOS APP/SPGGroup/Core/
   Design/Theme.swift, Shared/SPGPalette.swift). Надписи — польский словарь
   веба (client/src/i18n/translations.ts) и iOS (Shared/L10n.swift), раскладка —
   из страниц и SwiftUI-экранов. Веб iApply светлый, как в продукте; вход, центр
   QR и боковое меню админа тёмные — как в коде. Родное приложение берёт
   системные цвета: в тёмной студии (v3.1) его экраны — в тёмном оформлении iOS,
   в светлой (v3.2) — в светлом (setHrTheme).

   Люди и фирмы вымышленные, как в демо-базе: работник Jan Kowalski, ставка
   31,50 zł/godz., координатор Marta Zielińska, объект Hub Wrocław — Fulfillment.
   Цифры в интерфейсе — часть экрана, их не накручиваем (правило владельца). */

/* ── Токены ───────────────────────────────────────────────────────────── */

export const IA = {
  primary: '#3A3086',
  primary400: '#6f5eb8',
  primary600: '#302772',
  primary50: '#f0eef9',
  primary5: 'rgba(58, 48, 134, 0.05)',
  primary10: 'rgba(58, 48, 134, 0.10)',
  primary15: 'rgba(58, 48, 134, 0.15)',
  primary20: 'rgba(58, 48, 134, 0.20)',
  primary30: 'rgba(58, 48, 134, 0.30)',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  sidebar: '#111827',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow400: '#facc15',
  yellow500: '#eab308',
  yellow600: '#ca8a04',
  yellow700: '#a16207',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  orange100: '#ffedd5',
  orange500: '#f97316',
  orange600: '#ea580c',
  orange700: '#c2410c',
  purple100: '#f3e8ff',
  purple700: '#7e22ce',
  indigo100: '#e0e7ff',
  indigo600: '#4f46e5',
  toastText: '#363636',
  toastGreen: '#61d345',
}

/** Оформление iOS: системные цвета + Theme приложения. По умолчанию — тёмное
    (v3.1); светлое (v3.2) ставит setHrTheme. */
export const IOS = {
  bg: '#000000',
  card: '#1c1c1e',
  card2: '#2c2c2e',
  fill: '#767680',
  segment: '#636366',
  separator: 'rgba(84, 84, 88, 0.6)',
  label: '#ffffff',
  secondary: 'rgba(235, 235, 245, 0.6)',
  tertiary: 'rgba(235, 235, 245, 0.3)',
  bar: 'rgba(22, 22, 24, 0.96)',
  blue: '#0a84ff',
  primary: '#3A3086',
  /** Акцент на тёмном: #6F5EB8. В светлом оформлении продукт красит те же места
      в #3A3086 (tint приложения, SPGPalette.primary) — поэтому токен становится им. */
  primaryLight: '#6F5EB8',
  success: '#21a86b',
  warning: '#f2a629',
  danger: '#db4049',
  /** systemBackground: подложка Live Activity и виджета. */
  system: '#000000',
  /** Волосная линия над панелью вкладок. */
  hairline: 'rgba(255, 255, 255, 0.12)',
  /** Невыбранная вкладка. */
  idle: 'rgba(235, 235, 245, 0.55)',
  /** Дорожка сегментированного переключателя и тень выбранного сегмента. */
  track: 'rgba(118, 118, 128, 0.24)',
  segmentShadow: 'rgba(0, 0, 0, 0.3)',
  /** Баннер уведомления. */
  banner: '#26262a',
  /** systemGreen. */
  green: '#30d158',
}

/* ── Тема двойников: v3.1 — тёмная, v3.2 — светлая ──────────────────────
   Веб iApply светлый и тёмного варианта не имеет: в client/src нет ни одного
   dark:-класса, darkMode: 'class' в tailwind.config.js не включается; тёмные в
   коде только вход, «Centrum kontroli QR» (QRControl.tsx, bg-gray-900) и меню
   администратора (bg-sidebar) — такими и остаются. Родное приложение берёт
   системные цвета и тему не навязывает (IOS APP/SPGGroup/Core/Design/Theme.swift:
   screenBackground = systemGroupedBackground, cardBackground =
   secondarySystemGroupedBackground; tint — Theme.primary в SPGGroupApp.swift),
   Live Activity и виджет лежат на systemBackground и красят таймер в
   SPGPalette.primary (SPGWidgets/ShiftLiveActivity.swift, ShiftWidget.swift),
   круг геозоны — primary 15 % с обводкой primary 60 % (Features/Shared/
   ShiftViews.swift). Светлая студия берёт светлое оформление iOS. Художники
   читают IOS в момент рисования, поэтому тему переключаем подменой значений до
   того, как станции нарисуют текстуры (Finish.prepare). */

const IOS_DARK = { ...IOS }

const IOS_LIGHT: typeof IOS = {
  bg: '#f2f2f7',
  card: '#ffffff',
  card2: '#f2f2f7',
  fill: '#787880',
  segment: '#ffffff',
  separator: 'rgba(60, 60, 67, 0.29)',
  label: '#000000',
  secondary: 'rgba(60, 60, 67, 0.6)',
  tertiary: 'rgba(60, 60, 67, 0.3)',
  bar: 'rgba(249, 249, 249, 0.94)',
  blue: '#007aff',
  primary: '#3A3086',
  primaryLight: '#3A3086',
  success: '#21a86b',
  warning: '#f2a629',
  danger: '#db4049',
  system: '#ffffff',
  hairline: 'rgba(0, 0, 0, 0.12)',
  idle: '#999999',
  track: 'rgba(118, 118, 128, 0.12)',
  segmentShadow: 'rgba(0, 0, 0, 0.12)',
  banner: '#f4f4f6',
  green: '#34c759',
}

/** Светлая студия (v3.2): художники двойников и отделки берут светлые токены. */
let lightWorld = false

/** Токены двойников под тему мира. */
export function setHrTheme(theme: 'light' | 'dark') {
  lightWorld = theme === 'light'
  Object.assign(IOS, lightWorld ? IOS_LIGHT : IOS_DARK)
}

export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

/* ── Liquid Glass (владелец, 28.09: «этот неон очень удешевляет, давай
   лучше сделаем LIQUID GLASS»): у плавающих панелей и плиток фон и карточки
   полупрозрачные — сквозь них видно матовое стекло; текст, иконки, кнопки и
   чипы продукта — плотные. Экраны устройств (ноутбук, телефон) — дисплеи, а не
   стекло: у них всё непрозрачно. Режим задаёт тот, кто рисует плитку:
   glass(() => draw…()). */

const surface = { page: 1, card: 1 }

/** Нарисовать двойник для стеклянной плитки: фон ~0,66, карточки ~0,82. */
export function glass<T>(draw: () => T, page = 0.66, card = 0.82): T {
  const before = { ...surface }
  surface.page = page
  surface.card = card
  try {
    return draw()
  } finally {
    surface.page = before.page
    surface.card = before.card
  }
}

function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color
  if (color.startsWith('#')) return tint(color, alpha)
  const match = color.match(/^rgba?\(([^)]+)\)$/)
  if (!match) return color
  const [r, g, b, a = '1'] = match[1]!.split(',').map((part) => part.trim())
  return `rgba(${r}, ${g}, ${b}, ${Number(a) * alpha})`
}

/** То же для художника, которого холст зовёт повторно: paint() перерисовывает
    после загрузки шрифтов уже без обёртки glass(), поэтому режим включается
    на каждый вызов. */
export function glassy<A extends unknown[]>(draw: (...args: A) => void, page = 0.66, card = 0.82): (...args: A) => void {
  return (...args: A) => glass(() => draw(...args), page, card)
}

/** Тёмная ли заливка (яркость sRGB ниже 0,35). */
function isDark(color: string): boolean {
  const hex = color.match(/^#([0-9a-f]{6})/i)
  const rgb = hex
    ? [0, 2, 4].map((at) => parseInt(hex[1]!.slice(at, at + 2), 16))
    : (color.match(/^rgba?\(([^)]+)\)$/)?.[1]?.split(',').slice(0, 3).map(Number) ?? [255, 255, 255])
  const [r = 255, g = 255, b = 255] = rgb
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.35
}

/* В светлой студии плитка — белое матовое стекло: тёмная страница продукта
   («Centrum kontroli QR», меню администратора) на ~0,66 превращалась на нём в
   серую муть. Тёмные поверхности там почти непрозрачны, светлые остаются
   стеклом. */
const denseOnLight = (color: string, alpha: number) => (lightWorld && alpha < 1 && isDark(color) ? Math.max(alpha, 0.96) : alpha)

/** Фон страницы или крупной поверхности (сайдбар, тёмная страница). */
export const pageFill = (color: string) => withAlpha(color, denseOnLight(color, surface.page))
/** Фон карточки, шапки, модального окна. */
export const cardFill = (color: string) => withAlpha(color, denseOnLight(color, surface.card))

/* ── Текст и формы ────────────────────────────────────────────────────── */

export interface Ink {
  size: number
  weight?: number
  color: string
  align?: CanvasTextAlign
  font?: string
  /** Разрядка, px. */
  tracking?: number
  upper?: boolean
  /** Шире — обрезаем с многоточием, как truncate в вебе. */
  max?: number
}

function fontOf(ink: Ink): string {
  return `${ink.weight ?? 400} ${ink.size}px ${ink.font ?? FONT}`
}

export function measure(context: CanvasRenderingContext2D, value: string, ink: Ink): number {
  context.font = fontOf(ink)
  context.letterSpacing = `${ink.tracking ?? 0}px`
  const width = context.measureText(ink.upper ? value.toUpperCase() : value).width
  context.letterSpacing = '0px'
  return width
}

/** Строка текста; возвращает ширину. */
export function tx(context: CanvasRenderingContext2D, value: string, x: number, y: number, ink: Ink): number {
  context.font = fontOf(ink)
  context.fillStyle = ink.color
  context.textAlign = ink.align ?? 'left'
  context.textBaseline = 'alphabetic'
  context.letterSpacing = `${ink.tracking ?? 0}px`
  let text = ink.upper ? value.toUpperCase() : value
  if (ink.max && context.measureText(text).width > ink.max) {
    while (text.length > 1 && context.measureText(`${text}…`).width > ink.max) text = text.slice(0, -1)
    text = `${text.trimEnd()}…`
  }
  context.fillText(text, x, y)
  const width = context.measureText(text).width
  context.letterSpacing = '0px'
  return width
}

/** Перенос по словам в ширину; возвращает число строк. */
export function wrapTx(context: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, lineHeight: number, ink: Ink): number {
  context.font = fontOf(ink)
  const lines: string[] = []
  let line = ''
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && context.measureText(next).width > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  lines.forEach((text, index) => tx(context, text, x, y + index * lineHeight, ink))
  return lines.length
}

export function fillRound(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  round(context, x, y, width, height, radius)
  context.fillStyle = color
  context.fill()
}

export function strokeRound(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string, line = 1) {
  round(context, x + line / 2, y + line / 2, width - line, height - line, Math.max(0, radius - line / 2))
  context.strokeStyle = color
  context.lineWidth = line
  context.stroke()
}

/** Тень под элементом: рисует fn с тенью, потом без неё. */
export function withShadow(context: CanvasRenderingContext2D, blur: number, offsetY: number, color: string, fn: () => void) {
  context.save()
  context.shadowColor = color
  context.shadowBlur = blur
  context.shadowOffsetY = offsetY
  fn()
  context.restore()
}

/** .card веб-клиента: белая, rounded-xl, мягкая тень, граница gray-100. */
export function webCard(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 12, fill: string = IA.white, border: string = IA.gray100) {
  withShadow(context, 10, 2, 'rgba(0, 0, 0, 0.06)', () => fillRound(context, x, y, width, height, radius, cardFill(fill)))
  strokeRound(context, x, y, width, height, radius, border, 1)
}

/** .input-field: rounded-lg, граница gray-200, фокус — граница и кольцо primary. */
export function input(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, value: string, placeholder: string, focus = false, size = 14) {
  if (focus) fillRound(context, x - 2, y - 2, width + 4, height + 4, 10, IA.primary20)
  fillRound(context, x, y, width, height, 8, IA.white)
  strokeRound(context, x, y, width, height, 8, focus ? IA.primary : IA.gray200, 1)
  const baseline = y + height / 2 + size * 0.36
  if (value) tx(context, value, x + 16, baseline, { size, color: IA.gray900, max: width - 28 })
  else tx(context, placeholder, x + 16, baseline, { size, color: IA.gray400, max: width - 28 })
}

/** Каретка ввода (м-ввод). */
export function caret(context: CanvasRenderingContext2D, x: number, y: number, height: number, color: string = IA.gray900) {
  context.fillStyle = color
  context.fillRect(x, y, 1.5, height)
}

/** .btn-primary: primary, белый полужирный, тень shadow-primary/30. */
export function primaryButton(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, options: { radius?: number; size?: number; icon?: IconName; color?: string; shadow?: boolean } = {}) {
  const radius = options.radius ?? 8
  const fill = options.color ?? IA.primary
  if (options.shadow !== false) withShadow(context, 8, 4, 'rgba(58, 48, 134, 0.3)', () => fillRound(context, x, y, width, height, radius, fill))
  else fillRound(context, x, y, width, height, radius, fill)
  const size = options.size ?? 14
  const labelWidth = measure(context, label, { size, weight: 600, color: IA.white })
  const iconSize = size * 1.15
  const total = labelWidth + (options.icon ? iconSize + 6 : 0)
  let left = x + width / 2 - total / 2
  if (options.icon) {
    lucide(context, options.icon, left, y + height / 2 - iconSize / 2, iconSize, IA.white, 2)
    left += iconSize + 6
  }
  tx(context, label, left, y + height / 2 + size * 0.36, { size, weight: 600, color: IA.white })
}

/** .btn-secondary: белая, граница gray-200, gray-700. */
export function secondaryButton(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, label: string, options: { size?: number; icon?: IconName; fill?: string; border?: string; color?: string } = {}) {
  fillRound(context, x, y, width, height, 8, options.fill ?? IA.white)
  strokeRound(context, x, y, width, height, 8, options.border ?? IA.gray200, 1)
  const size = options.size ?? 14
  const color = options.color ?? IA.gray700
  const labelWidth = measure(context, label, { size, weight: 500, color })
  const iconSize = size
  const total = labelWidth + (options.icon ? iconSize + 6 : 0)
  let left = x + width / 2 - total / 2
  if (options.icon) {
    lucide(context, options.icon, left, y + height / 2 - iconSize / 2, iconSize, color, 2)
    left += iconSize + 6
  }
  tx(context, label, left, y + height / 2 + size * 0.36, { size, weight: 500, color })
}

/** Бейдж статуса продукта (rounded-full) — как в коде страницы. */
export function badge(context: CanvasRenderingContext2D, label: string, x: number, y: number, fill: string, color: string, size = 10, weight = 600, padX = 8, height?: number): number {
  const width = measure(context, label, { size, weight, color }) + padX * 2
  const h = height ?? size + 8
  fillRound(context, x, y, width, h, h / 2, fill)
  tx(context, label, x + padX, y + h / 2 + size * 0.36, { size, weight, color })
  return width
}

/** Инициалы в кружке. */
export function initials(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, fill: string, color: string, gradient?: [string, string]) {
  context.beginPath()
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  if (gradient) {
    const g = context.createLinearGradient(x, y, x + size, y + size)
    g.addColorStop(0, gradient[0])
    g.addColorStop(1, gradient[1])
    context.fillStyle = g
  } else context.fillStyle = fill
  context.fill()
  tx(context, value, x + size / 2, y + size / 2 + size * 0.13, { size: size * 0.36, weight: 700, color, align: 'center' })
}

/* ── Иконки: lucide-react веб-клиента (контур 24 × 24, толщина 2) ───── */

const c = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`

const LUCIDE = {
  mapPin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', c(12, 10, 3)],
  navigation: ['M3 11 22 2 13 21 11 13 3 11z'],
  clock: [c(12, 12, 10), 'M12 6v6l4 2'],
  play: ['M6 3 20 12 6 21 6 3z'],
  phoneOff: ['M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91', 'M22 2 2 22'],
  qr: [rect(3, 3, 5, 5, 1), rect(16, 3, 5, 5, 1), rect(3, 16, 5, 5, 1), 'M21 16h-3a2 2 0 0 0-2 2v3', 'M21 21v.01', 'M12 7v3a2 2 0 0 1-2 2H7', 'M3 12h.01', 'M12 3h.01', 'M12 16v.01', 'M16 12h1', 'M21 12v.01', 'M12 21v-1'],
  bell: ['M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'],
  message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  calendarDays: ['M8 2v4', 'M16 2v4', rect(3, 4, 18, 18, 2), 'M3 10h18', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01'],
  calendar: ['M8 2v4', 'M16 2v4', rect(3, 4, 18, 18, 2), 'M3 10h18'],
  bag: ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'],
  clipboard: [rect(8, 2, 8, 4, 1), 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M12 11h4', 'M12 16h4', 'M8 11h.01', 'M8 16h.01'],
  search: [c(11, 11, 8), 'm21 21-4.3-4.3'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  plus: ['M5 12h14', 'M12 5v14'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', c(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  userCog: ['M2 21a8 8 0 0 1 10.434-7.62', c(10, 8, 5), c(18, 18, 3), 'm19.5 14.3-.4.9', 'm16.9 20.8-.4.9', 'm21.7 19.5-.9-.4', 'm15.2 16.9-.9-.4', 'm21.7 16.5-.9.4', 'm15.2 19.1-.9.4', 'm19.5 21.7-.4-.9', 'm16.9 15.2-.4-.9'],
  dashboard: [rect(3, 3, 7, 9, 1), rect(14, 3, 7, 5, 1), rect(14, 12, 7, 9, 1), rect(3, 16, 7, 5, 1)],
  creditCard: [rect(2, 5, 20, 14, 2), 'M2 10h20'],
  fileChart: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M8 18v-2', 'M12 18v-4', 'M16 18v-6'],
  settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', c(12, 12, 3)],
  building: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronLeft: ['m15 18-6-6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  hourglass: ['M5 22h14', 'M5 2h14', 'M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22', 'M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2'],
  hand: ['M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4', 'M14 11V9a2 2 0 1 0-4 0v2', 'M10 10.5V5a2 2 0 1 0-4 0v9', 'm7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5'],
  check: ['M20 6 9 17l-5-5'],
  checkCircle: ['M21.801 10A10 10 0 1 1 17 3.335', 'm9 11 3 3L22 4'],
  userCheck: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', c(9, 7, 4), 'm16 11 2 2 4-4'],
  userX: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', c(9, 7, 4), 'm17 8 5 5', 'm22 8-5 5'],
  gift: [rect(3, 8, 18, 4, 1), 'M12 8v13', 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7', 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5'],
  send: ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'm21.854 2.147-10.94 10.939'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  trendingUp: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  dollar: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  grip: [c(9, 12, 1), c(9, 5, 1), c(9, 19, 1), c(15, 12, 1), c(15, 5, 1), c(15, 19, 1)],
  logIn: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'm10 17 5-5-5-5', 'M15 12H3'],
  eye: ['M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0', c(12, 12, 3)],
  arrowLeft: ['m12 19-7-7 7-7', 'M19 12H5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  edit: ['M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  bus: ['M8 6v6', 'M15 6v6', 'M2 12h19.6', 'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3', c(7, 18, 2), 'M9 18h5', c(16, 18, 2)],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', c(12, 7, 4)],
  penLine: ['M12 20h9', 'M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z'],
  refresh: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
  printer: ['M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6', rect(6, 14, 12, 8, 1)],
  rotateCcw: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  fileText: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'],
  logOut: ['m16 17 5-5-5-5', 'M21 12H9', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'],
}

export type IconName = keyof typeof LUCIDE

const paths = new Map<string, Path2D[]>()

/** Иконка lucide: x, y — левый верхний угол, size — сторона. */
export function lucide(context: CanvasRenderingContext2D, name: IconName, x: number, y: number, size: number, color: string, stroke = 2) {
  let list = paths.get(name)
  if (!list) {
    list = LUCIDE[name].map((d) => new Path2D(d))
    paths.set(name, list)
  }
  context.save()
  context.translate(x, y)
  context.scale(size / 24, size / 24)
  context.strokeStyle = color
  context.lineWidth = stroke
  context.lineCap = 'round'
  context.lineJoin = 'round'
  for (const path of list) context.stroke(path)
  context.restore()
}

/* ── Глифы SF Symbols для экранов iOS (упрощённо, тем же приёмом) ───── */

export type Glyph =
  | 'checkCircleFill'
  | 'clockFill'
  | 'building'
  | 'mappin'
  | 'wave'
  | 'viewfinder'
  | 'keyboard'
  | 'radiowaves'
  | 'chartBar'
  | 'houseFill'
  | 'qrViewfinder'
  | 'calendar'
  | 'bubbles'
  | 'person'
  | 'gridFill'
  | 'qrcode'
  | 'bell'
  | 'chevronDown'
  | 'chevronLeft'
  | 'flashlight'
  | 'camera'
  | 'lock'
  | 'person2'
  | 'hourglass'

/** Глиф iOS: x, y — центр, size — высота. */
export function glyph(context: CanvasRenderingContext2D, name: Glyph, x: number, y: number, size: number, color: string, background = IOS.bg) {
  const s = size / 24
  context.save()
  context.translate(x, y)
  context.scale(s, s)
  context.fillStyle = color
  context.strokeStyle = color
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 2.2
  const disc = (r: number) => {
    context.beginPath()
    context.arc(0, 0, r, 0, Math.PI * 2)
    context.fill()
  }
  switch (name) {
    case 'checkCircleFill':
      disc(11)
      context.strokeStyle = background
      context.lineWidth = 2.6
      context.beginPath()
      context.moveTo(-5, 0.5)
      context.lineTo(-1.5, 4)
      context.lineTo(5.5, -4)
      context.stroke()
      break
    case 'clockFill':
      disc(11)
      context.strokeStyle = background
      context.lineWidth = 2.2
      context.beginPath()
      context.moveTo(0, -6.5)
      context.lineTo(0, 0)
      context.lineTo(4.5, 3)
      context.stroke()
      break
    case 'building':
      round(context, -10, -8, 9, 18, 1.5)
      context.fill()
      round(context, 1, -11, 10, 21, 1.5)
      context.fill()
      context.fillStyle = background
      for (const [bx, by] of [[4, -7], [7.5, -7], [4, -2], [7.5, -2], [4, 3], [7.5, 3], [-7, -4], [-4, -4], [-7, 1], [-4, 1]] as [number, number][]) context.fillRect(bx - 1, by, 2, 2.6)
      break
    case 'mappin':
      context.beginPath()
      context.arc(0, -5, 5.5, 0, Math.PI * 2)
      context.fill()
      context.fillRect(-1, -1, 2, 9)
      context.lineWidth = 1.6
      context.beginPath()
      context.ellipse(0, 8, 8, 2.6, 0, 0, Math.PI * 2)
      context.stroke()
      break
    case 'wave':
      disc(11.5)
      context.strokeStyle = background
      context.lineWidth = 2.2
      for (const r of [3.5, 7, 10.5]) {
        context.beginPath()
        context.arc(-5, 0, r, -0.75, 0.75)
        context.stroke()
      }
      break
    case 'viewfinder': {
      context.lineWidth = 2.2
      const corner = (sx: number, sy: number) => {
        context.beginPath()
        context.moveTo(sx * 10, sy * 4)
        context.lineTo(sx * 10, sy * 8)
        context.arcTo(sx * 10, sy * 10, sx * 8, sy * 10, 2)
        context.lineTo(sx * 4, sy * 10)
        context.stroke()
      }
      corner(-1, -1)
      corner(1, -1)
      corner(-1, 1)
      corner(1, 1)
      break
    }
    case 'qrViewfinder':
      glyph(context, 'viewfinder', 0, 0, 24, color, background)
      context.fillRect(-5.5, -5.5, 4.5, 4.5)
      context.fillRect(1, -5.5, 4.5, 4.5)
      context.fillRect(-5.5, 1, 4.5, 4.5)
      context.fillRect(2, 2, 2.5, 2.5)
      break
    case 'keyboard':
      context.lineWidth = 1.8
      round(context, -11, -7, 22, 14, 2.5)
      context.stroke()
      for (let row = 0; row < 2; row++) for (let col = 0; col < 5; col++) context.fillRect(-8 + col * 3.8, -4 + row * 3.6, 1.8, 1.8)
      context.fillRect(-5, 3.4, 10, 1.8)
      break
    case 'radiowaves':
      disc(2.6)
      context.lineWidth = 1.9
      for (const [r, a] of [[6, 0.8], [10, 0.7]] as [number, number][]) {
        context.beginPath()
        context.arc(0, 0, r, -a, a)
        context.stroke()
        context.beginPath()
        context.arc(0, 0, r, Math.PI - a, Math.PI + a)
        context.stroke()
      }
      break
    case 'chartBar':
      round(context, -10, 1, 5, 9, 1)
      context.fill()
      round(context, -2.5, -4, 5, 14, 1)
      context.fill()
      round(context, 5, -9, 5, 19, 1)
      context.fill()
      break
    case 'houseFill':
      context.beginPath()
      context.moveTo(0, -11)
      context.lineTo(11, -1)
      context.lineTo(8, -1)
      context.lineTo(8, 10)
      context.lineTo(3, 10)
      context.lineTo(3, 3)
      context.lineTo(-3, 3)
      context.lineTo(-3, 10)
      context.lineTo(-8, 10)
      context.lineTo(-8, -1)
      context.lineTo(-11, -1)
      context.closePath()
      context.fill()
      break
    case 'calendar':
      context.lineWidth = 1.9
      round(context, -10, -8, 20, 18, 3)
      context.stroke()
      context.fillRect(-10, -8, 20, 5)
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) context.fillRect(-7 + col * 4.2, 0 + row * 4, 2.2, 2.2)
      break
    case 'bubbles':
      round(context, -11, -9, 15, 11, 4)
      context.fill()
      context.globalAlpha = 0.85
      round(context, -3, -3, 14, 11, 4)
      context.fill()
      context.globalAlpha = 1
      break
    case 'person':
      context.lineWidth = 1.9
      context.beginPath()
      context.arc(0, 0, 10.5, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.arc(0, -3, 3.8, 0, Math.PI * 2)
      context.fill()
      context.beginPath()
      context.arc(0, 9, 7, Math.PI * 1.15, Math.PI * 1.85)
      context.fill()
      break
    case 'gridFill':
      for (const [gx, gy] of [[-10, -10], [1, -10], [-10, 1], [1, 1]] as [number, number][]) {
        round(context, gx, gy, 9, 9, 2.4)
        context.fill()
      }
      break
    case 'qrcode':
      for (const [qx, qy] of [[-10, -10], [2, -10], [-10, 2]] as [number, number][]) {
        context.lineWidth = 2
        round(context, qx + 1, qy + 1, 7, 7, 1.5)
        context.stroke()
        context.fillRect(qx + 3, qy + 3, 3, 3)
      }
      context.fillRect(3, 3, 3, 3)
      context.fillRect(7, 7, 3, 3)
      break
    case 'bell':
      context.beginPath()
      context.moveTo(-8, 5)
      context.quadraticCurveTo(-6, 3, -6, -2)
      context.arc(0, -2, 6, Math.PI, 0)
      context.quadraticCurveTo(6, 3, 8, 5)
      context.closePath()
      context.fill()
      context.beginPath()
      context.arc(0, 7, 2.4, 0, Math.PI)
      context.fill()
      break
    case 'chevronDown':
      context.lineWidth = 2.6
      context.beginPath()
      context.moveTo(-6, -3)
      context.lineTo(0, 3)
      context.lineTo(6, -3)
      context.stroke()
      break
    case 'chevronLeft':
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(4, -9)
      context.lineTo(-5, 0)
      context.lineTo(4, 9)
      context.stroke()
      break
    case 'flashlight':
      round(context, -4, -10, 8, 20, 3)
      context.fill()
      break
    case 'camera':
      round(context, -10, -6, 20, 15, 3.5)
      context.fill()
      context.fillStyle = background
      context.beginPath()
      context.arc(0, 1.5, 4, 0, Math.PI * 2)
      context.fill()
      break
    case 'lock':
      round(context, -8, -2, 16, 12, 2.5)
      context.fill()
      context.lineWidth = 2.4
      context.beginPath()
      context.arc(0, -3, 5, Math.PI, 0)
      context.stroke()
      break
    case 'person2':
      context.beginPath()
      context.arc(-4, -4, 4, 0, Math.PI * 2)
      context.arc(6, -2, 3.2, 0, Math.PI * 2)
      context.fill()
      round(context, -11, 2, 14, 8, 4)
      context.fill()
      round(context, 1, 3, 10, 6, 3)
      context.fill()
      break
    case 'hourglass':
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(-7, -10)
      context.lineTo(7, -10)
      context.moveTo(-7, 10)
      context.lineTo(7, 10)
      context.moveTo(-6, -10)
      context.quadraticCurveTo(-6, -2, 0, 0)
      context.quadraticCurveTo(6, 2, 6, 10)
      context.moveTo(6, -10)
      context.quadraticCurveTo(6, -2, 0, 0)
      context.quadraticCurveTo(-6, 2, -6, 10)
      context.stroke()
      break
  }
  context.restore()
}

/* ── iPhone: холст экрана в точках iOS ───────────────────────────────── */

/** Экран iPhone 393 × 852 pt; холст — 3 px на точку (1179 × 2556): камера
    v3.2 подлетает к телефонам на полметра, на 2 px текст мылился. */
export const PT = { width: 393, height: 852, scale: 3 }

/** Точка экрана (pt) → оси экрана телефона, м (центр в нуле). */
export function pt(x: number, y: number): [number, number] {
  return [(x / PT.width - 0.5) * PHONE_SCREEN.width, (0.5 - y / PT.height) * PHONE_SCREEN.height]
}

/** Размер в точках → метры экрана телефона. */
export const ptSize = (value: number) => (value / PT.width) * PHONE_SCREEN.width

/** Строка состояния iOS со своим часом: у каждой станции — время дня на оси. */
export function iosStatus(context: CanvasRenderingContext2D, time: string, color: string) {
  tx(context, time, 54, 38, { size: 17, weight: 600, color, align: 'center' })
  context.fillStyle = color
  const right = 393
  for (let i = 0; i < 4; i++) {
    const height = 4 + i * 2.6
    round(context, right - 104 + i * 5, 37 - height, 3.2, height, 1)
    context.fill()
  }
  context.strokeStyle = color
  context.lineWidth = 1.8
  context.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    context.beginPath()
    context.arc(right - 72, 37, 3 + i * 3.4, -Math.PI * 0.75, -Math.PI * 0.25)
    context.stroke()
  }
  context.globalAlpha = 0.4
  round(context, right - 58, 26, 25, 12, 3.5)
  context.stroke()
  context.globalAlpha = 1
  round(context, right - 56, 28, 18, 8, 2)
  context.fill()
}

/** Островок: у плит-экранов (они лежат поверх корпуса) он рисуется в текстуре. */
export function island(context: CanvasRenderingContext2D, width = 104) {
  fillRound(context, 393 / 2 - width / 2, 17.5, width, 31, 15.5, '#000000')
}

/** Полоска «домой» внизу экрана. */
export function homeIndicator(context: CanvasRenderingContext2D, color: string) {
  fillRound(context, 393 / 2 - 67, 838, 134, 5, 2.5, color)
}

/** Сайт в Safari: тонкая адресная строка внизу (у записей сайта она есть, у
    приложения — нет). Оформление Safari — системное: в светлой студии светлое,
    даже над тёмной страницей входа. */
export function safariBar(context: CanvasRenderingContext2D, dark = !lightWorld) {
  context.fillStyle = dark ? 'rgba(28, 28, 30, 0.97)' : 'rgba(249, 249, 249, 0.97)'
  context.fillRect(0, 766, 393, 86)
  context.fillStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  context.fillRect(0, 766, 393, 0.6)
  fillRound(context, 14, 774, 365, 38, 12, dark ? '#3a3a3c' : '#e3e3e8')
  const text = dark ? '#ffffff' : '#000000'
  tx(context, 'AA', 32, 799, { size: 15, weight: 600, color: text })
  tx(context, 'iapply.com.pl', 196, 799, { size: 15, weight: 500, color: text, align: 'center' })
  lucide(context, 'refresh', 346, 783, 18, text, 2)
  homeIndicator(context, dark ? '#ffffff' : '#000000')
}

/** Холст экрана телефона в точках. */
export function phoneScreen(draw: (context: CanvasRenderingContext2D) => void): CanvasTexture | null {
  return paint(PT.width * PT.scale, PT.height * PT.scale, (context) => {
    context.scale(PT.scale, PT.scale)
    draw(context)
  })
}

/** Рисование экрана телефона на готовом холсте (живые текстуры). */
export function onPhoneCanvas(context: CanvasRenderingContext2D, draw: (context: CanvasRenderingContext2D) => void) {
  context.save()
  context.scale(PT.scale, PT.scale)
  draw(context)
  context.restore()
}

/* ── Веб-приложение работника (WorkerLayout) ─────────────────────────── */

export type Lang = 'PL' | 'UA' | 'RU' | 'EN'

/** Словарь веба — ключи, которые видны на главной работника (translations.ts). */
export const DICT: Record<Lang, Record<string, string>> = {
  PL: {
    worker: 'Pracownik',
    goodMorning: 'Dzień dobry 👋',
    workplace: 'Miejsce pracy',
    getDirections: 'Nawiguj',
    status: 'Status',
    away: 'Niedostępny',
    goOnCall: 'Włącz dyżur',
    nextShift: 'Następna zmiana',
    published: 'Opublikowana',
    scanQR: 'Zeskanuj QR, aby się zalogować',
    tapToOpen: 'Dotknij, aby otworzyć skaner',
    hoursThisMonth: 'Godziny w tym miesiącu',
    daysWorked: 'Przepracowane dni',
    earned: 'Zarobek w tym miesiącu',
    home: 'Główna',
    shifts: 'Zmiany',
    market: 'Giełda',
    tasks: 'Zadania',
    chat: 'Czat',
    date: 'niedziela, 27 wrz 2026',
  },
  UA: {
    worker: 'Працівник',
    goodMorning: 'Доброго ранку 👋',
    workplace: 'Робоче місце',
    getDirections: 'Прокласти маршрут',
    status: 'Статус',
    away: 'Відсутній',
    goOnCall: "На зв'язок",
    nextShift: 'Наступна зміна',
    published: 'Опубліковано',
    scanQR: 'Скануйте QR для входу',
    tapToOpen: 'Натисніть, щоб відкрити сканер',
    hoursThisMonth: 'Годин у цьому місяці',
    daysWorked: 'Відпрацьовані дні',
    earned: 'Зароблено за місяць',
    home: 'Головна',
    shifts: 'Зміни',
    market: 'Біржа',
    tasks: 'Завдання',
    chat: 'Чат',
    date: 'неділя, 27 вер. 2026',
  },
  RU: {
    worker: 'Работник',
    goodMorning: 'Доброе утро 👋',
    workplace: 'Рабочее место',
    getDirections: 'Маршрут',
    status: 'Статус',
    away: 'Отсутствует',
    goOnCall: 'На связь',
    nextShift: 'Следующая смена',
    published: 'Опубликована',
    scanQR: 'Сканируйте QR для входа',
    tapToOpen: 'Нажмите, чтобы открыть сканер',
    hoursThisMonth: 'Часов в этом месяце',
    daysWorked: 'Отработано дней',
    earned: 'Заработано за месяц',
    home: 'Главная',
    shifts: 'Смены',
    market: 'Биржа',
    tasks: 'Задания',
    chat: 'Чат',
    date: 'воскресенье, 27 сент. 2026',
  },
  EN: {
    worker: 'Worker',
    goodMorning: 'Good morning 👋',
    workplace: 'Workplace',
    getDirections: 'Get Directions',
    status: 'Status',
    away: 'Away',
    goOnCall: 'Go On Call',
    nextShift: 'Next Shift',
    published: 'Published',
    scanQR: 'Scan QR to Clock In',
    tapToOpen: 'Tap to open scanner',
    hoursThisMonth: 'Hours This Month',
    daysWorked: 'Days Worked',
    earned: 'Earned this month',
    home: 'Home',
    shifts: 'Shifts',
    market: 'Market',
    tasks: 'Tasks',
    chat: 'Chat',
    date: 'Sunday, 27 Sep 2026',
  },
}

export const JAN = { first: 'Jan', last: 'Kowalski', initials: 'JK', email: 'jan.kowalski@przyklad.pl', rate: '31,50' }
export const SITE = { name: 'Hub Wrocław — Fulfillment', address: 'ul. Logistyczna 12, Wrocław', client: 'Hub Wrocław' }
export const MARTA = { name: 'Marta Zielińska', initials: 'MZ' }

/* Английские двойники (2D-ролики для портфолио, setPaintLang): надписи парой
   tr(pl, en) — английский из словаря продукта (EN в translations.ts,
   L10n.swift). Язык страниц работника без явного языка — тот же. Даты веба
   в английском — date-fns en-US с теми же шаблонами («27 Sep 2026»). */
const english = () => tr('pl', 'en') === 'en'
const paintLang = (): Lang => (english() ? 'EN' : 'PL')
const MONTHS_EN: [string, string][] = [
  ['wrz', 'Sep'],
  ['paź', 'Oct'],
]
/** Дата с польским сокращением месяца — в языке двойника. */
const date = (value: string) => tr(value, MONTHS_EN.reduce((text, [pl, en]) => text.replaceAll(pl, en), value))

/** Шапка WorkerLayout: роль, имя, аватар; под ней — страница. */
export function workerHeader(context: CanvasRenderingContext2D, lang: Lang = paintLang()) {
  context.fillStyle = IA.white
  context.fillRect(0, 54, 393, 64)
  context.fillStyle = IA.gray100
  context.fillRect(0, 117.5, 393, 1)
  tx(context, DICT[lang].worker!, 196.5, 81, { size: 10, weight: 700, color: IA.primary, align: 'center', upper: true, tracking: 0.6 })
  tx(context, `${JAN.first} ${JAN.last}`, 196.5, 99, { size: 14, weight: 600, color: IA.gray900, align: 'center' })
  withShadow(context, 6, 3, 'rgba(0,0,0,0.12)', () => initials(context, JAN.initials, 337, 66, 40, IA.primary, IA.white, [IA.primary, IA.blue700]))
}

export type WorkerTab = 'home' | 'shifts' | 'market' | 'tasks' | 'chat'

/** Нижняя навигация работника (над адресной строкой Safari). */
export function workerNav(context: CanvasRenderingContext2D, active: WorkerTab, lang: Lang = paintLang()) {
  context.fillStyle = IA.white
  context.fillRect(0, 706, 393, 60)
  context.fillStyle = IA.gray100
  context.fillRect(0, 706, 393, 1)
  const items: [WorkerTab, IconName][] = [
    ['home', 'home'],
    ['shifts', 'calendarDays'],
    ['market', 'bag'],
    ['tasks', 'clipboard'],
    ['chat', 'message'],
  ]
  items.forEach(([key, icon], index) => {
    const x = 393 * ((index + 0.5) / items.length)
    const color = key === active ? IA.primary : IA.gray400
    lucide(context, icon, x - 10, 716, 20, color, 2)
    tx(context, DICT[lang][key]!, x, 752, { size: 10, weight: 500, color, align: 'center' })
  })
}

/** Страница веба в Safari: белая строка состояния, шапка, навигация, адрес. */
export function workerPage(context: CanvasRenderingContext2D, time: string, tab: WorkerTab, body: (context: CanvasRenderingContext2D) => void, lang: Lang = paintLang()) {
  context.fillStyle = IA.gray50
  context.fillRect(0, 0, 393, 852)
  context.save()
  context.beginPath()
  context.rect(0, 118, 393, 588)
  context.clip()
  body(context)
  context.restore()
  context.fillStyle = IA.white
  context.fillRect(0, 0, 393, 54)
  iosStatus(context, time, '#000000')
  workerHeader(context, lang)
  workerNav(context, tab, lang)
  safariBar(context)
  island(context)
}

/** Тост react-hot-toast: белый, зелёный кружок с галочкой. Возвращает ширину. */
export function hotToast(context: CanvasRenderingContext2D, centerX: number, y: number, label: string, size = 15, kind: 'success' | 'error' = 'success'): number {
  const textWidth = measure(context, label, { size, weight: 400, color: IA.toastText })
  const width = Math.min(350, textWidth + 20 + 20 + 20)
  const height = size * 1.3 + 16 + 8
  const x = centerX - width / 2
  withShadow(context, 10, 3, 'rgba(0,0,0,0.12)', () => fillRound(context, x, y, width, height, 8, IA.white))
  const iconX = x + 10 + 10
  const iconY = y + height / 2
  context.beginPath()
  context.arc(iconX, iconY, 10, 0, Math.PI * 2)
  context.fillStyle = kind === 'success' ? IA.toastGreen : '#ff4b4b'
  context.fill()
  context.strokeStyle = IA.white
  context.lineWidth = 2
  context.lineCap = 'round'
  context.beginPath()
  if (kind === 'success') {
    context.moveTo(iconX - 4, iconY + 0.5)
    context.lineTo(iconX - 1, iconY + 3.5)
    context.lineTo(iconX + 4.5, iconY - 3)
  } else {
    context.moveTo(iconX - 4, iconY - 4)
    context.lineTo(iconX + 4, iconY + 4)
    context.moveTo(iconX + 4, iconY - 4)
    context.lineTo(iconX - 4, iconY + 4)
  }
  context.stroke()
  tx(context, label, iconX + 20, iconY + size * 0.36, { size, weight: 400, color: IA.toastText, max: width - 50 })
  return width
}

/** Тост отдельной плиткой (выходит над стеклом): холст — ровно тост, тень и
    толщину даёт сама плитка. */
export function toastTile(label: string, size = 15, scale = 3): { texture: CanvasTexture | null; width: number; height: number } {
  let textWidth = 0
  if (typeof document !== 'undefined') {
    const probe = document.createElement('canvas').getContext('2d')
    if (probe) textWidth = measure(probe, label, { size, color: IA.toastText })
  }
  const width = Math.min(350, textWidth + 60)
  const height = size * 1.3 + 24
  /* Режим стекла — на момент создания: перерисовка после шрифтов идёт позже. */
  const fill = cardFill(IA.white)
  const texture = paint(width * scale, height * scale, (context) => {
    context.scale(scale, scale)
    fillRound(context, 0, 0, width, height, 8, fill)
    const iconX = 20
    const iconY = height / 2
    context.beginPath()
    context.arc(iconX, iconY, 10, 0, Math.PI * 2)
    context.fillStyle = IA.toastGreen
    context.fill()
    context.strokeStyle = IA.white
    context.lineWidth = 2
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(iconX - 4, iconY + 0.5)
    context.lineTo(iconX - 1, iconY + 3.5)
    context.lineTo(iconX + 4.5, iconY - 3)
    context.stroke()
    tx(context, label, iconX + 20, iconY + size * 0.36, { size, weight: 400, color: IA.toastText, max: width - 50 })
  })
  return { texture, width, height }
}

/* ── Логотип iApply.pl (BrandLogo) ───────────────────────────────────── */

export function brandLogo(context: CanvasRenderingContext2D, x: number, baseline: number, size: number, color: string, align: 'left' | 'center' = 'left', dot: string = IA.primary) {
  const main: Ink = { size, weight: 800, color, tracking: -size * 0.025 }
  const iWidth = measure(context, 'i', main)
  const applyWidth = measure(context, 'Apply', main)
  const plWidth = measure(context, '.pl', { size: size * 0.6, weight: 700, color })
  const total = iWidth + applyWidth + plWidth + size * 0.05
  let left = align === 'center' ? x - total / 2 : x
  tx(context, 'i', left, baseline, { ...main, color: dot })
  left += iWidth
  tx(context, 'Apply', left, baseline, main)
  left += applyWidth + size * 0.05
  context.globalAlpha = 0.7
  tx(context, '.pl', left, baseline, { size: size * 0.6, weight: 700, color })
  context.globalAlpha = 1
}

/* ── Станция 04: вход (LoginPage) ────────────────────────────────────── */

export interface LoginState {
  email: string
  password: number
  focus: 'email' | 'password' | null
  pressed: boolean
  loading: boolean
  toast: boolean
  caret: boolean
}

/** Где поле Email и кнопка «Zaloguj się» на экране входа, pt. */
export const LOGIN_PT = {
  email: { x: 48, y: 377, width: 297, height: 42 },
  button: { x: 48, y: 541, width: 297, height: 48 },
}

export function drawLogin(context: CanvasRenderingContext2D, state: LoginState) {
  const gradient = context.createLinearGradient(0, 0, 393, 852)
  gradient.addColorStop(0, IA.gray900)
  gradient.addColorStop(0.5, IA.gray800)
  gradient.addColorStop(1, IA.gray900)
  context.fillStyle = gradient
  context.fillRect(0, 0, 393, 852)
  iosStatus(context, '06:05', '#ffffff')
  brandLogo(context, 196.5, 258, 48, IA.white, 'center')
  /* Карточка формы: max-w-md, p-8, space-y-5. */
  const card = { x: 16, y: 306, width: 361, height: 315 }
  webCard(context, card.x, card.y, card.width, card.height, 12)
  const left = card.x + 32
  tx(context, 'Email', left, card.y + 32 + 14, { size: 14, weight: 500, color: IA.gray700 })
  const email = LOGIN_PT.email
  input(context, email.x, email.y, email.width, email.height, state.email, tr('ty@przyklad.pl', 'you@example.com'), state.focus === 'email', 15)
  if (state.focus === 'email' && state.caret) caret(context, email.x + 16 + (state.email ? measure(context, state.email, { size: 15, color: IA.gray900 }) + 1 : 0), email.y + 11, 20)
  tx(context, tr('Hasło', 'Password'), left, email.y + email.height + 20 + 14, { size: 14, weight: 500, color: IA.gray700 })
  const pass = { x: email.x, y: email.y + email.height + 20 + 20 + 6, width: email.width, height: 42 }
  input(context, pass.x, pass.y, pass.width, pass.height, state.password > 0 ? '•'.repeat(state.password) : '', '••••••••', state.focus === 'password', 15)
  lucide(context, 'eye', pass.x + pass.width - 30, pass.y + 12, 18, IA.gray400, 2)
  const button = LOGIN_PT.button
  if (state.loading) {
    withShadow(context, 8, 4, 'rgba(58, 48, 134, 0.3)', () => fillRound(context, button.x, button.y, button.width, button.height, 8, IA.primary))
    context.globalAlpha = 0.5
    fillRound(context, button.x, button.y, button.width, button.height, 8, IA.white)
    context.globalAlpha = 1
    fillRound(context, button.x, button.y, button.width, button.height, 8, IA.primary)
    context.strokeStyle = IA.white
    context.lineWidth = 2
    context.beginPath()
    context.arc(button.x + button.width / 2, button.y + button.height / 2, 9, 0.2, Math.PI * 1.1)
    context.stroke()
  } else primaryButton(context, button.x, button.y, button.width, button.height, tr('Zaloguj się', 'Sign In'), { size: 16, icon: 'logIn', color: state.pressed ? IA.primary600 : IA.primary })
  if (state.toast) hotToast(context, 196.5, 64, tr('Witamy z powrotem!', 'Welcome back!'), 15)
  safariBar(context)
  island(context)
}

/* ── Станция 05: главная работника на четырёх языках ─────────────────── */

/** Где на главной большая кнопка скана, pt. */
export const HOME_PT = { scan: { x: 20, y: 472, width: 353, height: 192 } }

export function drawWorkerHome(context: CanvasRenderingContext2D, lang: Lang, time = '06:06') {
  const t = DICT[lang]
  workerPage(
    context,
    time,
    'home',
    (ctx) => {
      /* Шапка страницы: приветствие и имя, справа — чат и колокольчик. */
      ctx.fillStyle = IA.white
      ctx.fillRect(0, 118, 393, 80)
      ctx.fillStyle = IA.gray100
      ctx.fillRect(0, 197, 393, 1)
      tx(ctx, t.goodMorning!, 20, 149, { size: 14, color: IA.gray500 })
      tx(ctx, `${JAN.first} ${JAN.last}`, 20, 176, { size: 18, weight: 700, color: IA.gray900 })
      lucide(ctx, 'message', 305, 148, 20, IA.gray400)
      lucide(ctx, 'bell', 345, 148, 20, IA.gray400)
      /* Место работы и статус. */
      const top = 214
      const colWidth = (353 - 12) / 2
      webCard(ctx, 20, top, colWidth, 126)
      fillRound(ctx, 32, top + 12, 32, 32, 8, IA.primary10)
      lucide(ctx, 'mapPin', 40, top + 20, 16, IA.primary)
      tx(ctx, t.workplace!, 72, top + 32, { size: 10, weight: 600, color: IA.gray400, upper: true, tracking: 0.5, max: colWidth - 64 })
      tx(ctx, SITE.name, 32, top + 66, { size: 14, weight: 700, color: IA.gray900, max: colWidth - 24 })
      tx(ctx, SITE.address, 32, top + 84, { size: 12, color: IA.gray500, max: colWidth - 24 })
      lucide(ctx, 'navigation', 32, top + 99, 12, IA.primary)
      tx(ctx, t.getDirections!, 48, top + 109, { size: 12, weight: 500, color: IA.primary })
      const right = 20 + colWidth + 12
      webCard(ctx, right, top, colWidth, 126)
      fillRound(ctx, right + 12, top + 12, 32, 32, 8, IA.gray100)
      lucide(ctx, 'phoneOff', right + 20, top + 20, 16, IA.gray400)
      tx(ctx, t.status!, right + 52, top + 32, { size: 10, weight: 600, color: IA.gray400, upper: true, tracking: 0.5 })
      tx(ctx, t.away!, right + 12, top + 66, { size: 14, weight: 700, color: IA.gray500 })
      fillRound(ctx, right + 12, top + 78, colWidth - 24, 28, 8, IA.blue100)
      tx(ctx, t.goOnCall!, right + colWidth / 2, top + 96, { size: 12, weight: 500, color: IA.blue600, align: 'center' })
      /* Следующая смена. */
      const next = top + 126 + 16
      webCard(ctx, 20, next, 353, 100)
      tx(ctx, t.nextShift!, 36, next + 30, { size: 13, weight: 600, color: IA.gray500, upper: true, tracking: 0.6, max: 220 })
      const published = measure(ctx, t.published!, { size: 12, weight: 500, color: IA.blue600 }) + 20
      badge(ctx, t.published!, 373 - 16 - published, next + 16, IA.blue50, IA.blue600, 12, 500, 10, 22)
      fillRound(ctx, 36, next + 46, 40, 40, 8, IA.primary10)
      lucide(ctx, 'clock', 46, next + 56, 20, IA.primary)
      tx(ctx, '07:00 — 15:00', 88, next + 63, { size: 16, weight: 600, color: IA.gray900 })
      tx(ctx, t.date!, 88, next + 83, { size: 14, color: IA.gray500, max: 270 })
      /* Большая кнопка скана. */
      const scan = HOME_PT.scan
      withShadow(ctx, 18, 8, 'rgba(58, 48, 134, 0.3)', () => fillRound(ctx, scan.x, scan.y, scan.width, scan.height, 16, IA.primary))
      strokeRound(ctx, 196.5 - 40, scan.y + 24, 80, 80, 16, 'rgba(255,255,255,0.3)', 2)
      lucide(ctx, 'qr', 196.5 - 20, scan.y + 44, 40, IA.white, 1.5)
      tx(ctx, t.scanQR!, 196.5, scan.y + 138, { size: 18, weight: 700, color: IA.white, align: 'center', max: 330 })
      tx(ctx, t.tapToOpen!, 196.5, scan.y + 162, { size: 14, color: 'rgba(255,255,255,0.7)', align: 'center', max: 330 })
      /* Статистика — под навигацией, видна верхушка. */
      const stats = scan.y + scan.height + 16
      webCard(ctx, 20, stats, colWidth, 96)
      lucide(ctx, 'clock', 36, stats + 16, 16, IA.gray400)
      tx(ctx, t.hoursThisMonth!, 58, stats + 29, { size: 12, weight: 500, color: IA.gray500, max: colWidth - 50 })
      tx(ctx, '142h', 36, stats + 62, { size: 24, weight: 700, color: IA.gray900 })
      webCard(ctx, right, stats, colWidth, 96)
      lucide(ctx, 'dollar', right + 16, stats + 16, 16, IA.gray400)
      tx(ctx, t.earned!, right + 38, stats + 29, { size: 12, weight: 500, color: IA.gray500, max: colWidth - 50 })
      tx(ctx, '4473,00 zł', right + 16, stats + 62, { size: 24, weight: 700, color: IA.gray900 })
    },
    lang,
  )
}

/* ── Админ: оболочка (AdminLayout) ───────────────────────────────────── */

/** Экран ноутбука: веб админа в окне 1440 × 900, холст 2400 × 1500 (v3.2:
    подлёты камеры к экрану). */
export const DESK = { width: 1440, height: 900, scale: 2400 / 1440 }

/** Точка экрана админа (px окна) → оси экрана ноутбука, м. */
export function desk(x: number, y: number): [number, number] {
  return [(x / DESK.width - 0.5) * LAPTOP_SCREEN.width, (0.5 - y / DESK.height) * LAPTOP_SCREEN.height]
}

export const deskSize = (value: number) => (value / DESK.width) * LAPTOP_SCREEN.width

/** Пункты меню: иконка, польский, английский (nav.* словаря). */
const ADMIN_NAV: [IconName, string, string][] = [
  ['dashboard', 'Panel', 'Dashboard'],
  ['calendarDays', 'Grafik', 'Schedule'],
  ['userCog', 'Koordynatorzy', 'Coordinators'],
  ['users', 'Pracownicy', 'Workers'],
  ['building', 'Obiekty', 'Work Sites'],
  ['creditCard', 'Płace', 'Payroll'],
  ['fileChart', 'Raporty', 'Reports'],
  ['message', 'Czat', 'Chat'],
  ['settings', 'Ustawienia', 'Settings'],
]

/** active — польское имя пункта. */
export function adminShell(context: CanvasRenderingContext2D, active: string, height = 900) {
  /* Фон — только правее меню: на стекле два полупрозрачных слоя высветлили бы меню. */
  context.fillStyle = pageFill(IA.gray50)
  context.fillRect(256, 0, 1440 - 256, height)
  /* Боковое меню: bg-sidebar, логотип, пункты, языки, пользователь. */
  context.fillStyle = pageFill(IA.sidebar)
  context.fillRect(0, 0, 256, height)
  brandLogo(context, 24, 49, 24, IA.white)
  context.fillStyle = IA.gray800
  context.fillRect(0, 80, 256, 1)
  ADMIN_NAV.forEach(([icon, label, en], index) => {
    const y = 96 + index * 44
    const on = label === active
    if (on) withShadow(context, 6, 3, 'rgba(58,48,134,0.25)', () => fillRound(context, 12, y, 232, 40, 8, IA.primary))
    lucide(context, icon, 24, y + 10, 20, on ? IA.white : IA.gray400)
    tx(context, tr(label, en), 56, y + 25, { size: 14, weight: 500, color: on ? IA.white : IA.gray400 })
  })
  const langs = ['EN', 'PL', 'UA', 'RU']
  const current = tr('PL', 'EN')
  const langTop = height - 118
  context.fillStyle = IA.gray800
  context.fillRect(0, langTop - 12, 256, 1)
  langs.forEach((lang, index) => {
    const x = 12 + index * 58
    fillRound(context, x, langTop, 54, 24, 4, lang === current ? IA.primary : IA.gray700)
    tx(context, lang, x + 27, langTop + 16, { size: 12, weight: 500, color: lang === current ? IA.white : IA.gray300, align: 'center' })
  })
  context.fillStyle = IA.gray800
  context.fillRect(0, height - 70, 256, 1)
  initials(context, 'EK', 16, height - 53, 36, 'rgba(58,48,134,0.2)', IA.primary400)
  tx(context, 'Ewa Kamińska', 64, height - 38, { size: 14, weight: 500, color: IA.white })
  tx(context, 'Admin', 64, height - 21, { size: 12, color: IA.gray500 })
  lucide(context, 'logOut', 222, height - 44, 18, IA.gray500)
  /* Шапка: колокольчик и аватар. */
  context.fillStyle = cardFill(IA.white)
  context.fillRect(256, 0, 1184, 64)
  context.fillStyle = IA.gray200
  context.fillRect(256, 63, 1184, 1)
  lucide(context, 'bell', 1356, 22, 20, IA.gray400)
  initials(context, 'EK', 1392, 16, 32, IA.primary10, IA.primary)
}

/* ── Станция 03: «Zarządzanie pracownikami» и форма нового работника ── */

interface Person {
  name: string
  initials: string
  email: string
  phone?: string
  role: 'Admin' | 'Koordynator' | 'Pracownik'
  lang: string
  created: string
}

const PEOPLE: Person[] = [
  { name: 'Ewa Kamińska', initials: 'EK', email: 'ewa.kaminska@przyklad.pl', phone: '+48 601 204 318', role: 'Admin', lang: 'PL', created: '02 wrz 2026' },
  { name: 'Marta Zielińska', initials: 'MZ', email: 'marta.zielinska@przyklad.pl', phone: '+48 512 330 876', role: 'Koordynator', lang: 'PL', created: '03 wrz 2026' },
  { name: 'Olena Kovalenko', initials: 'OK', email: 'olena.kovalenko@przyklad.pl', phone: '+48 733 118 402', role: 'Pracownik', lang: 'UA', created: '05 wrz 2026' },
  { name: 'Piotr Nowak', initials: 'PN', email: 'piotr.nowak@przyklad.pl', role: 'Pracownik', lang: 'PL', created: '05 wrz 2026' },
  { name: 'Dmytro Bondarenko', initials: 'DB', email: 'dmytro.bondarenko@przyklad.pl', phone: '+48 690 552 017', role: 'Pracownik', lang: 'UA', created: '08 wrz 2026' },
  { name: 'Aleksandra Wójcik', initials: 'AW', email: 'aleksandra.wojcik@przyklad.pl', role: 'Pracownik', lang: 'PL', created: '10 wrz 2026' },
  { name: 'Siarhei Kazlou', initials: 'SK', email: 'siarhei.kazlou@przyklad.pl', phone: '+48 577 902 664', role: 'Pracownik', lang: 'RU', created: '14 wrz 2026' },
  { name: 'Tomasz Lewandowski', initials: 'TL', email: 'tomasz.lewandowski@przyklad.pl', role: 'Pracownik', lang: 'PL', created: '19 wrz 2026' },
]

const ROLE_BADGE: Record<Person['role'], [string, string]> = {
  Admin: [IA.purple100, IA.purple700],
  Koordynator: [IA.blue100, IA.blue700],
  Pracownik: [IA.green100, IA.green700],
}

/** Роль в языке двойника (workers.admin / coordinator / worker). */
const ROLE_EN: Record<Person['role'], string> = { Admin: 'Admin', Koordynator: 'Coordinator', Pracownik: 'Worker' }
const role = (value: Person['role']) => tr(value, ROLE_EN[value])

/** Кнопка «Dodaj użytkownika» на странице, px окна. */
export const WORKERS_ADD = { x: 1238, y: 94, width: 178, height: 40 }
/** Первая строка таблицы — сюда встаёт новый работник, px окна. */
export const WORKERS_ROW = { x: 280, y: 318, width: 1136, height: 58 }

function personRow(context: CanvasRenderingContext2D, person: Person, y: number, fresh = false) {
  if (fresh) {
    context.fillStyle = 'rgba(58, 48, 134, 0.04)'
    context.fillRect(281, y, 1134, 58)
  }
  initials(context, person.initials, 296, y + 13, 32, IA.primary10, IA.primary)
  tx(context, person.name, 340, y + 34, { size: 14, weight: 500, color: IA.gray900 })
  tx(context, person.email, 520, y + (person.phone ? 27 : 34), { size: 14, color: IA.gray600 })
  if (person.phone) tx(context, person.phone, 520, y + 44, { size: 12, color: IA.gray400 })
  const [fill, color] = ROLE_BADGE[person.role]
  badge(context, role(person.role), 800, y + 20, fill, color, 10, 600, 8, 18)
  tx(context, person.lang, 940, y + 34, { size: 14, color: IA.gray600 })
  tx(context, date(person.created), 1040, y + 34, { size: 14, color: IA.gray400 })
  lucide(context, 'edit', 1340, y + 22, 14, IA.gray400)
  lucide(context, 'trash', 1370, y + 22, 14, IA.gray400)
}

export function drawWorkersPage(context: CanvasRenderingContext2D, withJan: boolean) {
  adminShell(context, 'Pracownicy')
  tx(context, tr('Zarządzanie pracownikami', 'Workers Management'), 280, 110, { size: 24, weight: 700, color: IA.gray900 })
  tx(context, tr('Zarządzanie wszystkimi użytkownikami systemu', 'Manage all system users'), 280, 132, { size: 14, color: IA.gray500 })
  const add = WORKERS_ADD
  primaryButton(context, add.x, add.y, add.width, add.height, tr('Dodaj użytkownika', 'Add User'), { icon: 'plus' })
  /* Фильтр. */
  webCard(context, 280, 160, 1136, 74)
  fillRound(context, 296, 176, 996, 42, 8, IA.white)
  strokeRound(context, 296, 176, 996, 42, 8, IA.gray200)
  lucide(context, 'search', 308, 189, 16, IA.gray400)
  tx(context, tr('Szukaj po nazwisku lub emailu...', 'Search by name or email...'), 332, 202, { size: 14, color: IA.gray400 })
  secondaryButton(context, 1304, 176, 96, 42, tr('Szukaj', 'Search'), { icon: 'filter' })
  /* Таблица. */
  const rows = withJan ? [{ name: `${JAN.first} ${JAN.last}`, initials: JAN.initials, email: JAN.email, role: 'Pracownik', lang: 'PL', created: '27 wrz 2026' } as Person, ...PEOPLE] : PEOPLE
  const shown = rows.slice(0, 8)
  const tableHeight = 44 + shown.length * 58 + 46
  webCard(context, 280, 250, 1136, tableHeight)
  context.save()
  round(context, 280, 250, 1136, tableHeight, 12)
  context.clip()
  context.fillStyle = IA.gray50
  context.fillRect(280, 250, 1136, 44)
  context.fillStyle = IA.gray100
  context.fillRect(280, 293, 1136, 1)
  const head = [tr('Użytkownik', 'User'), tr('Kontakt', 'Contacts'), tr('Rola', 'Role'), tr('Język', 'Language'), tr('Utworzono', 'Created')]
  const cols = [296, 520, 800, 940, 1040]
  head.forEach((label, index) => tx(context, label, cols[index]!, 277, { size: 12, weight: 500, color: IA.gray500 }))
  shown.forEach((person, index) => {
    const y = 294 + index * 58
    if (index > 0) {
      context.fillStyle = IA.gray50
      context.fillRect(280, y, 1136, 1)
    }
    personRow(context, person, y, withJan && index === 0)
  })
  const footer = 294 + shown.length * 58
  context.fillStyle = IA.gray100
  context.fillRect(280, footer, 1136, 1)
  tx(context, tr('Strona 1 / 2', 'Page 1 / 2'), 296, footer + 28, { size: 12, color: IA.gray500 })
  lucide(context, 'chevronLeft', 1362, footer + 15, 16, IA.gray400)
  lucide(context, 'chevronRight', 1390, footer + 15, 16, IA.gray400)
  context.restore()
}

/** Форма «Dodaj nowego użytkownika» (модальное окно, max-w-md), px. */
export const USER_FORM = { width: 448, height: 470 }
/** Кнопка «Utwórz użytkownika» на форме, px. */
export const USER_FORM_SUBMIT = { x: 230, y: 404, width: 194, height: 42 }

export interface UserFormState {
  first: string
  last: string
  email: string
  password: number
  rate: string
  focus: 'first' | 'last' | 'email' | 'password' | 'rate' | null
  pressed: boolean
  done: number
  caret: boolean
}

export function drawUserForm(context: CanvasRenderingContext2D, state: UserFormState) {
  fillRound(context, 0, 0, 448, 470, 16, cardFill(IA.white))
  tx(context, tr('Dodaj nowego użytkownika', 'Add New User'), 24, 50, { size: 18, weight: 700, color: IA.gray900 })
  const field = (x: number, y: number, width: number, value: string, placeholder: string, focused: boolean) => {
    input(context, x, y, width, 42, value, placeholder, focused)
    if (focused && state.caret) caret(context, x + 16 + (value ? measure(context, value, { size: 14, color: IA.gray900 }) + 1 : 0), y + 11, 20)
  }
  field(24, 68, 194, state.first, tr('Imię', 'First Name'), state.focus === 'first')
  field(230, 68, 194, state.last, tr('Nazwisko', 'Last Name'), state.focus === 'last')
  field(24, 122, 400, state.email, 'Email', state.focus === 'email')
  field(24, 176, 400, state.password > 0 ? '•'.repeat(state.password) : '', tr('Hasło', 'Password'), state.focus === 'password')
  field(24, 230, 400, '', tr('Telefon (opcjonalnie)', 'Phone (optional)'), false)
  field(24, 284, 400, state.rate, tr('Stawka godzinowa, PLN (opcjonalnie)', 'Hourly rate, PLN (optional)'), state.focus === 'rate')
  for (const [x, label] of [[24, role('Pracownik')], [230, tr('Polski', 'Polish')]] as [number, string][]) {
    input(context, x, 338, 194, 42, label, '', false)
    lucide(context, 'chevronDown', x + 166, 350, 16, IA.gray500)
  }
  secondaryButton(context, 24, 404, 194, 42, tr('Anuluj', 'Cancel'))
  const submit = USER_FORM_SUBMIT
  if (state.done > 0) {
    fillRound(context, submit.x, submit.y, submit.width, submit.height, 8, IA.green600)
    context.strokeStyle = IA.white
    context.lineWidth = 2.6
    context.lineCap = 'round'
    context.lineJoin = 'round'
    const cx = submit.x + submit.width / 2
    const cy = submit.y + submit.height / 2
    const points: [number, number][] = [
      [cx - 9, cy],
      [cx - 3, cy + 6],
      [cx + 10, cy - 7],
    ]
    const length = Math.max(0, Math.min(1, state.done))
    context.beginPath()
    context.moveTo(points[0]![0], points[0]![1])
    if (length < 0.4) {
      const t = length / 0.4
      context.lineTo(points[0]![0] + (points[1]![0] - points[0]![0]) * t, points[0]![1] + (points[1]![1] - points[0]![1]) * t)
    } else {
      const t = (length - 0.4) / 0.6
      context.lineTo(points[1]![0], points[1]![1])
      context.lineTo(points[1]![0] + (points[2]![0] - points[1]![0]) * t, points[1]![1] + (points[2]![1] - points[1]![1]) * t)
    }
    context.stroke()
  } else primaryButton(context, submit.x, submit.y, submit.width, submit.height, tr('Utwórz użytkownika', 'Create User'), { color: state.pressed ? IA.primary600 : IA.primary })
}

/** Строка нового работника — во что сжимается форма и что летит в телефон. */
export const USER_ROW = { width: 460, height: 64 }

export function drawUserRow(context: CanvasRenderingContext2D) {
  webCard(context, 2, 2, 456, 60, 12)
  initials(context, JAN.initials, 16, 16, 32, IA.primary10, IA.primary)
  tx(context, `${JAN.first} ${JAN.last}`, 58, 30, { size: 14, weight: 600, color: IA.gray900 })
  tx(context, JAN.email, 58, 48, { size: 12, color: IA.gray500 })
  badge(context, role('Pracownik'), 330, 23, IA.green100, IA.green700, 11, 600, 9, 20)
  tx(context, 'PL', 428, 37, { size: 13, color: IA.gray600 })
}

/* ── Общие холсты ─────────────────────────────────────────────────────── */

/** Холст в логических пикселях со своим масштабом. */
export function canvasOf(width: number, height: number, scale: number, draw: (context: CanvasRenderingContext2D) => void): CanvasTexture | null {
  return paint(width * scale, height * scale, (context) => {
    context.scale(scale, scale)
    draw(context)
  })
}

export function deskScreen(draw: (context: CanvasRenderingContext2D) => void): CanvasTexture | null {
  return canvasOf(DESK.width, DESK.height, DESK.scale, draw)
}

/* ── Координатор: оболочка на компьютере (CoordinatorLayout, lg+) ───── */

/** Панель станции (1,6 × 1,03 м): веб координатора в окне 1024 × 659, холст
    3200 px (v3.2: подлёты камеры к панели). */
export const PANEL = { width: 1024, height: 659, scale: 3200 / 1024 }

/** Пункты меню: иконка, польский, английский (nav.* словаря). */
const COORD_NAV: [IconName, string, string][] = [
  ['dashboard', 'Panel', 'Dashboard'],
  ['calendarDays', 'Grafik', 'Schedule'],
  ['qr', 'Kontrola QR', 'QR Control'],
  ['users', 'Personel', 'Staff'],
  ['clipboard', 'Zadania', 'Tasks'],
  ['message', 'Czat', 'Chat'],
  ['user', 'Profil', 'Profile'],
]

/** Белое боковое меню координатора: профиль, пункты, выход. active — польское имя пункта. */
export function coordShell(context: CanvasRenderingContext2D, active: string, height = PANEL.height) {
  context.fillStyle = cardFill(IA.white)
  context.fillRect(0, 0, 256, height)
  context.fillStyle = IA.gray100
  context.fillRect(255, 0, 1, height)
  withShadow(context, 6, 3, 'rgba(0,0,0,0.12)', () => initials(context, MARTA.initials, 20, 20, 40, IA.primary, IA.white, [IA.primary, IA.blue700]))
  tx(context, tr('Koordynator', 'Coordinator'), 72, 35, { size: 10, weight: 700, color: IA.primary, upper: true, tracking: 0.6 })
  tx(context, MARTA.name, 72, 53, { size: 14, weight: 600, color: IA.gray900 })
  context.fillStyle = IA.gray100
  context.fillRect(0, 80, 256, 1)
  COORD_NAV.forEach(([icon, label, en], index) => {
    const y = 96 + index * 44
    const on = label === active
    if (on) fillRound(context, 12, y, 232, 40, 12, IA.primary10)
    lucide(context, icon, 24, y + 10, 20, on ? IA.primary : IA.gray600)
    tx(context, tr(label, en), 56, y + 25, { size: 14, weight: 500, color: on ? IA.primary : IA.gray600 })
  })
  context.fillStyle = IA.gray100
  context.fillRect(0, height - 66, 256, 1)
  lucide(context, 'logOut', 24, height - 43, 20, IA.red500)
  tx(context, tr('Wyloguj się', 'Log Out'), 56, height - 28, { size: 14, weight: 500, color: IA.red500 })
}

export function panelScreen(draw: (context: CanvasRenderingContext2D) => void): CanvasTexture | null {
  return canvasOf(PANEL.width, PANEL.height, PANEL.scale, draw)
}

/* ── QR-код: узор модулей (не настоящий код, но честный вид) ─────────── */

const QR_SIZE = 25

function qrModules(seed: number): boolean[] {
  let a = seed >>> 0
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const cells: boolean[] = []
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]] as [number, number][]) {
      const dx = x - fx
      const dy = y - fy
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3))
        return ring === 2 ? 0 : 1
      }
    }
    return -1
  }
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const f = finder(x, y)
      if (f >= 0) cells.push(f === 1)
      else if (y === 6) cells.push(x % 2 === 0)
      else if (x === 6) cells.push(y % 2 === 0)
      else if (x >= 16 && x <= 20 && y >= 16 && y <= 20) cells.push(Math.max(Math.abs(x - 18), Math.abs(y - 18)) !== 1)
      else cells.push(random() < 0.47)
    }
  }
  return cells
}

const QR_CELLS = qrModules(0x7a11)

/** QR с тихой зоной: чёрные модули на белом, скруглённые углы (rounded-xl). */
export function drawQr(context: CanvasRenderingContext2D, x: number, y: number, size: number, radius = 12, dark = '#000000') {
  fillRound(context, x, y, size, size, radius, IA.white)
  const cell = size / (QR_SIZE + 4)
  context.fillStyle = dark
  QR_CELLS.forEach((on, index) => {
    if (!on) return
    const cx = index % QR_SIZE
    const cy = Math.floor(index / QR_SIZE)
    context.fillRect(x + (cx + 2) * cell, y + (cy + 2) * cell, cell + 0.4, cell + 0.4)
  })
}

/* ── Станция 06: «Centrum kontroli QR» (координатор, тёмная страница) ── */

export interface QrPanelState {
  hours: string
  focus: boolean
  pressed: boolean
  generated: boolean
  /** QR ушёл с панели (м-отрыв): на его месте пусто. */
  lifted: boolean
  /** Сколько секунд осталось. */
  left: number
}

/** Рамка QR с уголками на панели, px окна. */
export const QR_SLOT = { x: 256 + (768 - 304) / 2, y: 134, width: 304, height: 304 }
export const QR_HOURS = { x: 0, y: 0, width: 0, height: 44 }
export const QR_GENERATE = { x: 276, y: 575, width: 728, height: 48 }

function countdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export function drawQrPanel(context: CanvasRenderingContext2D, state: QrPanelState) {
  coordShell(context, 'Kontrola QR')
  const left = 256
  const width = 768
  context.fillStyle = pageFill(IA.gray900)
  context.fillRect(left, 0, width, PANEL.height)
  tx(context, tr('Centrum kontroli QR', 'QR Control Center'), left + 20, 42, { size: 18, weight: 700, color: IA.white })
  fillRound(context, left + 20, 58, width - 40, 38, 8, IA.gray800)
  strokeRound(context, left + 20, 58, width - 40, 38, 8, IA.gray700)
  tx(context, 'Hub Wrocław — Fulfillment', left + 32, 82, { size: 14, color: IA.white })
  lucide(context, 'chevronDown', left + width - 44, 70, 14, IA.gray400)
  context.fillStyle = IA.gray800
  context.fillRect(left, 110, width, 1)
  const center = left + width / 2
  if (!state.generated) {
    fillRound(context, center - 48, 150, 96, 96, 16, IA.gray800)
    lucide(context, 'shield', center - 20, 178, 40, IA.gray600)
    tx(context, tr('Brak aktywnych kodów QR', 'No active QR codes'), center, 282, { size: 20, weight: 700, color: IA.white, align: 'center' })
    tx(context, tr('Wygeneruj nowy kod QR do rejestracji pracowników', 'Generate a new QR code for worker check-in'), center, 306, { size: 14, color: IA.gray500, align: 'center' })
    /* Czas trwania kodu QR: tygodnie, dni, godziny. */
    const box = { x: left + 20, y: 330, width: width - 40, height: 150 }
    fillRound(context, box.x, box.y, box.width, box.height, 12, cardFill(IA.gray800))
    /* Иконка — на том же расстоянии от подписи: английская подпись короче польской. */
    const duration = tr('Czas trwania kodu QR', 'QR Code Duration')
    const durationInk: Ink = { size: 12, weight: 600, color: IA.gray400, upper: true, tracking: 0.6, align: 'center' }
    const shorter = english() ? (measure(context, 'Czas trwania kodu QR', durationInk) - measure(context, duration, durationInk)) / 2 : 0
    lucide(context, 'clock', center - 104 + shorter, 347, 12, IA.gray400)
    tx(context, duration, center + 8, 357, durationInk)
    const colWidth = (box.width - 32 - 24) / 3
    const values = ['0', '0', state.hours]
    ;[tr('Tygodnie', 'Weeks'), tr('Dni', 'Days'), tr('Godziny', 'Hours')].forEach((label, index) => {
      const x = box.x + 16 + index * (colWidth + 12)
      tx(context, label, x + colWidth / 2, 386, { size: 10, color: IA.gray500, upper: true, align: 'center' })
      const focused = index === 2 && state.focus
      if (focused) fillRound(context, x - 2, 394, colWidth + 4, 48, 10, 'rgba(58, 48, 134, 0.5)')
      fillRound(context, x, 396, colWidth, 44, 8, IA.gray700)
      strokeRound(context, x, 396, colWidth, 44, 8, IA.gray600)
      tx(context, values[index]!, x + colWidth / 2, 425, { size: 18, weight: 700, color: IA.white, align: 'center' })
    })
    tx(context, tr(`Razem: ${state.hours}h`, `Total: ${state.hours}h`), center, 464, { size: 12, weight: 500, color: IA.primary400, align: 'center' })
    const button = QR_GENERATE
    primaryButton(context, button.x, button.y - 70, button.width, button.height, tr('Generuj QR', 'Generate QR'), { size: 15, color: state.pressed ? IA.primary600 : IA.primary })
    /* Предупреждение о привязке к GPS. */
    const warn = { x: left + 20, y: 572, width: width - 40, height: 58 }
    fillRound(context, warn.x, warn.y, warn.width, warn.height, 12, 'rgba(113, 63, 18, 0.2)')
    strokeRound(context, warn.x, warn.y, warn.width, warn.height, 12, 'rgba(133, 77, 14, 0.3)')
    /* Английский текст встаёт в одну строку — она по центру плашки. */
    const warnInk: Ink = { size: 12, color: 'rgba(254, 240, 138, 0.7)' }
    const oneLine = english() && measure(context, gpsWarning(), warnInk) <= warn.width - 50 ? 8.5 : 0
    lucide(context, 'shield', warn.x + 12, warn.y + 14 + oneLine, 14, 'rgba(254, 240, 138, 0.7)')
    wrapTx(context, gpsWarning(), warn.x + 34, warn.y + 25 + oneLine, warn.width - 50, 17, warnInk)
    return
  }
  /* Код создан: QR в уголках, отсчёт, действия. */
  const slot = QR_SLOT
  context.strokeStyle = IA.primary400
  context.lineWidth = 2.5
  context.lineCap = 'round'
  const corner = (x: number, y: number, sx: number, sy: number) => {
    context.beginPath()
    context.moveTo(x + sx * 32, y)
    context.lineTo(x, y)
    context.lineTo(x, y + sy * 32)
    context.stroke()
  }
  corner(slot.x, slot.y, 1, 1)
  corner(slot.x + slot.width, slot.y, -1, 1)
  corner(slot.x, slot.y + slot.height, 1, -1)
  corner(slot.x + slot.width, slot.y + slot.height, -1, -1)
  if (!state.lifted) drawQr(context, slot.x + 24, slot.y + 24, 256, 12)
  else fillRound(context, slot.x + 24, slot.y + 24, 256, 256, 12, 'rgba(255,255,255,0.04)')
  const label = tr('Wygasa:', 'Expires:')
  const time = countdown(state.left)
  const labelWidth = measure(context, label, { size: 14, color: IA.gray400 })
  const timeWidth = measure(context, time, { size: 24, weight: 700, color: IA.primary400, font: MONO })
  const rowX = center - (16 + 8 + labelWidth + 8 + timeWidth) / 2
  lucide(context, 'shield', rowX, 464, 16, IA.primary400)
  tx(context, label, rowX + 24, 477, { size: 14, color: IA.gray400 })
  tx(context, time, rowX + 24 + labelWidth + 8, 481, { size: 24, weight: 700, color: IA.primary400, font: MONO })
  tx(context, 'Hub Wrocław — Fulfillment — ul. Logistyczna 12, Wrocław', center, 506, { size: 12, color: IA.gray500, align: 'center' })
  primaryButton(context, left + 20, 538, width - 40, 48, tr('Unieważnij i wygeneruj nowy kod', 'Invalidate & Generate New Code'), { size: 15, icon: 'refresh' })
  fillRound(context, left + 20, 598, width - 40, 48, 8, IA.gray800)
  strokeRound(context, left + 20, 598, width - 40, 48, 8, IA.gray700)
  lucide(context, 'printer', center - 52, 614, 16, IA.white)
  tx(context, tr('Drukuj PDF', 'Print PDF'), center - 28, 627, { size: 15, weight: 500, color: IA.white })
}

/** Текст о привязке кода к GPS (qrControl.gpsWarning). */
const gpsWarning = () =>
  tr(
    'Ten kod QR jest powiązany ze współrzędnymi GPS. Pracownicy muszą znajdować się w wyznaczonym promieniu, aby się zarejestrować.',
    'This QR code is tied to GPS coordinates. Workers must be within the designated radius to check in.',
  )

/** Жёлтая плашка о GPS — плиткой (м-отрыв со станции 06). */
export const GPS_NOTE = { width: 380, height: 78 }

export function drawGpsNote(context: CanvasRenderingContext2D) {
  fillRound(context, 0, 0, GPS_NOTE.width, GPS_NOTE.height, 12, cardFill('#2a2213'))
  strokeRound(context, 0, 0, GPS_NOTE.width, GPS_NOTE.height, 12, 'rgba(202, 138, 4, 0.45)', 1.5)
  lucide(context, 'shield', 14, 14, 16, 'rgba(254, 240, 138, 0.8)')
  wrapTx(context, gpsWarning(), 40, 26, GPS_NOTE.width - 54, 17, { size: 12.5, color: 'rgba(254, 240, 138, 0.85)' })
}

/* ── iOS: общие части экранов родного приложения (оформление — по теме) ── */

export function iosNavTitle(context: CanvasRenderingContext2D, title: string, back?: string) {
  tx(context, title, 196.5, 86, { size: 17, weight: 600, color: IOS.label, align: 'center' })
  if (back) {
    glyph(context, 'chevronLeft', 20, 80, 18, IOS.primary)
    tx(context, back, 32, 86, { size: 17, color: IOS.primary })
  }
}

export function iosLargeTitle(context: CanvasRenderingContext2D, title: string) {
  tx(context, title, 16, 140, { size: 34, weight: 700, color: IOS.label, tracking: 0.2 })
}

/** Панель вкладок iOS, selected — индекс. Вкладка — глиф, польская подпись и,
    если есть, английская (L10n.swift). */
export function iosTabBar(context: CanvasRenderingContext2D, items: [Glyph, string, string?][], selected: number) {
  context.fillStyle = IOS.bar
  context.fillRect(0, 769, 393, 83)
  context.fillStyle = IOS.hairline
  context.fillRect(0, 769, 393, 0.6)
  items.forEach(([icon, label, en], index) => {
    const x = 393 * ((index + 0.5) / items.length)
    const color = index === selected ? IOS.primaryLight : IOS.idle
    glyph(context, icon, x, 792, 22, color, IOS.bar)
    tx(context, tr(label, en ?? label), x, 818, { size: 10, weight: 500, color, align: 'center' })
  })
  homeIndicator(context, IOS.label)
}

export const WORKER_TABS: [Glyph, string, string][] = [
  ['houseFill', 'Start', 'Home'],
  ['qrViewfinder', 'Skanuj', 'Scan'],
  ['calendar', 'Zmiany', 'Shifts'],
  ['bubbles', 'Czat', 'Chat'],
  ['person', 'Profil', 'Profile'],
]

export const COORD_TABS: [Glyph, string, string][] = [
  ['gridFill', 'Pulpit', 'Dashboard'],
  ['calendar', 'Grafik', 'Schedule'],
  ['qrcode', 'Kod QR', 'QR code'],
  ['bubbles', 'Czat', 'Chat'],
  ['person', 'Profil', 'Profile'],
]

/** Карточка iOS (Theme.cardBackground, скругление 16). */
export function iosCard(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  fillRound(context, x, y, width, height, 16, IOS.card)
}

/** Сегментированный переключатель iOS. */
export function iosSegments(context: CanvasRenderingContext2D, x: number, y: number, width: number, labels: string[], selected: number, size = 13) {
  fillRound(context, x, y, width, 32, 9, IOS.track)
  const segment = width / labels.length
  withShadow(context, 6, 2, IOS.segmentShadow, () => fillRound(context, x + 2 + selected * segment, y + 2, segment - 4, 28, 7, IOS.segment))
  labels.forEach((label, index) => {
    tx(context, label, x + segment * (index + 0.5), y + 21, { size, weight: index === selected ? 600 : 500, color: IOS.label, align: 'center', max: segment - 8 })
  })
}

/** Крутилка ProgressView. */
export function spinner(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, phase = 0) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + phase
    context.globalAlpha = 0.25 + 0.75 * (((i + Math.floor(phase * 4)) % 8) / 8)
    context.strokeStyle = color
    context.lineWidth = radius * 0.22
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5)
    context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    context.stroke()
  }
  context.globalAlpha = 1
}

/* ── Станция 07: «Skanuj kod QR» (ScanView.swift) ─────────────────────── */

export type ScanStage = 'scanning' | 'code' | 'locating' | 'sending' | 'success'

/** Рамка прицела на экране сканера, pt. */
export const SCAN_FRAME = { x: 196.5 - 110, y: 176 + 160 - 110, width: 220, height: 220 }

export function drawScanner(context: CanvasRenderingContext2D, stage: ScanStage, phase: number) {
  context.fillStyle = IOS.bg
  context.fillRect(0, 0, 393, 852)
  iosStatus(context, '07:00', IOS.label)
  iosNavTitle(context, tr('Skanuj kod QR', 'Scan QR code'))
  glyph(context, 'keyboard', 366, 80, 22, IOS.primaryLight)
  tx(context, tr('Wybierz akcję', 'Choose action'), 16, 124, { size: 12, weight: 600, color: IOS.secondary })
  iosSegments(context, 16, 134, 361, [tr('Wejście', 'Clock in'), tr('Wyjście', 'Clock out'), tr('Początek przerwy', 'Break start'), tr('Koniec przerwy', 'Break end')], 0, 12)
  /* Камера: чёрный кадр с намёком на объект, рамка прицела. */
  const view = { x: 16, y: 182, width: 361, height: 320 }
  context.save()
  round(context, view.x, view.y, view.width, view.height, 16)
  context.clip()
  const gradient = context.createLinearGradient(0, view.y, 0, view.y + view.height)
  gradient.addColorStop(0, '#15161a')
  gradient.addColorStop(1, '#08080a')
  context.fillStyle = gradient
  context.fillRect(view.x, view.y, view.width, view.height)
  if (stage !== 'scanning') {
    /* Код на листке у wejścia: попал в прицел. */
    context.globalAlpha = stage === 'code' ? 1 : 0.55
    fillRound(context, 196.5 - 96, view.y + 64, 192, 192, 10, '#d9d9dc')
    drawQr(context, 196.5 - 84, view.y + 76, 168, 8, '#111111')
    context.globalAlpha = 1
  }
  context.restore()
  const frame = SCAN_FRAME
  context.globalAlpha = stage === 'scanning' || stage === 'code' ? 0.95 : 0.2
  withShadow(context, 8, 0, 'rgba(0,0,0,0.6)', () => strokeRound(context, frame.x, frame.y + 6, frame.width, frame.height, 20, '#ffffff', 3))
  context.globalAlpha = 1
  /* Статус под камерой. */
  const top = 530
  if (stage === 'scanning' || stage === 'code') {
    glyph(context, 'viewfinder', 58, top + 10, 16, IOS.secondary)
    wrapTx(context, tr('Skieruj aparat na kod QR na obiekcie', 'Point the camera at the QR code on site'), 72, top + 16, 280, 20, { size: 15, color: IOS.secondary })
  } else if (stage === 'locating' || stage === 'sending') {
    spinner(context, 196.5, top + 14, 11, IOS.secondary, phase)
    tx(context, stage === 'locating' ? tr('Ustalanie lokalizacji…', 'Getting location…') : tr('Wysyłanie…', 'Sending…'), 196.5, top + 52, { size: 15, color: IOS.secondary, align: 'center' })
  } else {
    iosCard(context, 16, top - 14, 361, 184)
    glyph(context, 'checkCircleFill', 196.5, top + 28, 40, IOS.success, IOS.card)
    tx(context, tr('Zarejestrowano wejście', 'Clocked in'), 196.5, top + 84, { size: 17, weight: 600, color: IOS.label, align: 'center' })
    fillRound(context, 32, top + 104, 329, 50, 14, IOS.primary)
    tx(context, tr('Skanuj ponownie', 'Scan again'), 196.5, top + 135, { size: 17, weight: 600, color: '#ffffff', align: 'center' })
  }
  iosTabBar(context, WORKER_TABS, 1)
}

/* ── Станция 07: карта «Szczegóły zmiany» (ShiftViews.swift, mapCard) ── */

export const MAP_CARD = { width: 300, height: 250 }

/** Карта с геозоной (MapCircle 200 m) и точкой телефона; inside 0…1 — где
    точка: снаружи круга → внутри. green — круг вспыхнул зелёным. */
export function drawMapCard(context: CanvasRenderingContext2D, inside: number, green: boolean) {
  fillRound(context, 0, 0, MAP_CARD.width, MAP_CARD.height, 18, cardFill(IOS.card))
  tx(context, tr('Szczegóły zmiany', 'Shift details'), 16, 28, { size: 15, weight: 600, color: IOS.label })
  tx(context, SITE.name, 16, 47, { size: 12, color: IOS.secondary })
  const map = { x: 10, y: 60, width: 280, height: 180 }
  context.save()
  round(context, map.x, map.y, map.width, map.height, 14)
  context.clip()
  /* Кварталы и улицы — условная схема карты в оформлении iOS (Apple Maps:
     тёмная ночью, светлая днём). */
  context.fillStyle = lightWorld ? '#eeece7' : '#242426'
  context.fillRect(map.x, map.y, map.width, map.height)
  context.fillStyle = lightWorld ? '#e1ded6' : '#2d2d30'
  for (let i = 0; i < 16; i++) {
    const bx = map.x + ((i * 53) % 280) - 10
    const by = map.y + Math.floor(i / 4) * 48 - 8
    round(context, bx, by, 38 + (i % 3) * 8, 34, 4)
    context.fill()
  }
  context.strokeStyle = lightWorld ? '#ffffff' : '#3d3d42'
  context.lineCap = 'round'
  for (const [x1, y1, x2, y2, w] of [
    [map.x - 10, map.y + 42, map.x + 290, map.y + 70, 7],
    [map.x + 60, map.y - 10, map.x + 120, map.y + 190, 6],
    [map.x + 190, map.y - 10, map.x + 230, map.y + 190, 5],
    [map.x - 10, map.y + 140, map.x + 290, map.y + 122, 5],
  ] as [number, number, number, number, number][]) {
    context.lineWidth = w
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
  }
  /* Геозона: круг primary 15 % с обводкой primary 60 % (ShiftViews.swift); на
     тёмной карте заливка гуще и обводка светлее, иначе круг пропадает. */
  const cx = map.x + 150
  const cy = map.y + 92
  const r = 62
  context.beginPath()
  context.arc(cx, cy, r, 0, Math.PI * 2)
  context.fillStyle = green ? (lightWorld ? 'rgba(33, 168, 107, 0.18)' : 'rgba(33, 168, 107, 0.22)') : lightWorld ? 'rgba(58, 48, 134, 0.15)' : 'rgba(58, 48, 134, 0.3)'
  context.fill()
  context.lineWidth = 2
  context.strokeStyle = green ? IOS.success : lightWorld ? 'rgba(58, 48, 134, 0.6)' : IOS.primaryLight
  context.stroke()
  /* Маркер объекта. */
  context.fillStyle = IOS.primary
  context.beginPath()
  context.arc(cx, cy - 16, 13, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.moveTo(cx - 6, cy - 7)
  context.lineTo(cx, cy)
  context.lineTo(cx + 6, cy - 7)
  context.fill()
  glyph(context, 'building', cx, cy - 16, 13, '#ffffff', IOS.primary)
  tx(context, 'Hub Wrocław', cx, cy + 16, { size: 10, weight: 600, color: IOS.label, align: 'center' })
  /* Точка телефона: снаружи круга → внутрь. */
  const px = mix(map.x + 262, cx + 30, inside)
  const py = mix(map.y + 156, cy + 30, inside)
  context.beginPath()
  context.arc(px, py, 16, 0, Math.PI * 2)
  context.fillStyle = 'rgba(10, 132, 255, 0.2)'
  context.fill()
  context.beginPath()
  context.arc(px, py, 7, 0, Math.PI * 2)
  context.fillStyle = '#ffffff'
  context.fill()
  context.beginPath()
  context.arc(px, py, 5, 0, Math.PI * 2)
  context.fillStyle = IOS.blue
  context.fill()
  context.restore()
  tx(context, '200 m', map.x + map.width - 12, map.y + map.height - 12, { size: 11, weight: 600, color: IOS.secondary, align: 'right' })
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

/* ── Станция 08 и 22: экран блокировки с Live Activity ───────────────── */

/** Live Activity на экране блокировки (ShiftLiveActivity.swift), pt. */
export const LIVE_ACTIVITY = { x: 12, y: 610, width: 369, height: 96 }

/** «Jesteś w pracy» — L10n.atWorkNow: Live Activity и виджет. */
const atWork = () => tr('Jesteś w pracy', 'You are on the clock')

function clockText(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Обои экрана блокировки и домашнего экрана — окружение телефона, а не
    интерфейс продукта: в тёмной студии тёмно-фиолетовые, в светлой — градиент
    в цвет iApply, на нём читаются и белые часы, и белая Live Activity. */
function wallpaper(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, 0, 852)
  if (lightWorld) {
    gradient.addColorStop(0, '#9489dc')
    gradient.addColorStop(0.55, '#6b5cc2')
    gradient.addColorStop(1, '#3d3392')
  } else {
    gradient.addColorStop(0, '#1a1538')
    gradient.addColorStop(0.55, '#0d0b1c')
    gradient.addColorStop(1, '#050507')
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, 393, 852)
  const glow = context.createRadialGradient(290, 250, 10, 290, 250, 320)
  const tone = lightWorld ? '255, 255, 255' : '111, 94, 184'
  glow.addColorStop(0, `rgba(${tone}, ${lightWorld ? 0.22 : 0.35})`)
  glow.addColorStop(1, `rgba(${tone}, 0)`)
  context.fillStyle = glow
  context.fillRect(0, 0, 393, 852)
}

export function drawLockScreen(context: CanvasRenderingContext2D, options: { time: string; date: string; elapsed: number; until: string; island: boolean }) {
  wallpaper(context)
  iosStatus(context, '', '#ffffff')
  glyph(context, 'lock', 196.5, 78, 14, 'rgba(255,255,255,0.85)')
  tx(context, options.date, 196.5, 124, { size: 20, weight: 600, color: 'rgba(255,255,255,0.8)', align: 'center' })
  tx(context, options.time, 196.5, 224, { size: 104, weight: 700, color: 'rgba(255,255,255,0.92)', align: 'center', tracking: -3 })
  /* Live Activity: «Jesteś w pracy», объект, адрес; справа — таймер и «do …».
     Подложка — systemBackground (activityBackgroundTint). */
  const la = LIVE_ACTIVITY
  fillRound(context, la.x, la.y, la.width, la.height, 24, lightWorld ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.82)')
  glyph(context, 'checkCircleFill', la.x + 24, la.y + 27, 13, IOS.success, IOS.system)
  tx(context, atWork(), la.x + 36, la.y + 32, { size: 12, weight: 600, color: IOS.success })
  tx(context, SITE.name, la.x + 16, la.y + 56, { size: 17, weight: 600, color: IOS.label, max: 220 })
  glyph(context, 'mappin', la.x + 22, la.y + 75, 10, IOS.secondary, IOS.system)
  tx(context, SITE.address, la.x + 32, la.y + 79, { size: 11, color: IOS.secondary, max: 200 })
  tx(context, clockText(options.elapsed), la.x + la.width - 16, la.y + 50, { size: 24, weight: 700, color: IOS.primaryLight, align: 'right', font: MONO })
  tx(context, tr(`do ${options.until}`, `until ${options.until}`), la.x + la.width - 16, la.y + 70, { size: 11, color: IOS.secondary, align: 'right' })
  /* Латарка и камера, полоска «домой». */
  for (const [x, icon] of [[62, 'flashlight'], [331, 'camera']] as [number, Glyph][]) {
    context.beginPath()
    context.arc(x, 782, 25, 0, Math.PI * 2)
    context.fillStyle = lightWorld ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.14)'
    context.fill()
    glyph(context, icon, x, 782, 20, '#ffffff', lightWorld ? '#5a4db4' : '#3a3550')
  }
  homeIndicator(context, '#ffffff')
  /* Dynamic Island с компактной активностью: часы и тот же таймер. Островок
     всегда чёрный, текст на нём белый. */
  if (options.island) {
    fillRound(context, 196.5 - 118, 17.5, 236, 33, 16.5, '#000000')
    glyph(context, 'clockFill', 196.5 - 100, 34, 16, IOS.success, '#000000')
    tx(context, clockText(options.elapsed), 196.5 + 104, 39, { size: 13, weight: 600, color: '#ffffff', align: 'right', font: MONO })
  } else island(context)
}

/* ── Станция 09: «Giełda zmian» (ShiftMarket, сайт) ───────────────────── */

/** Где на экране окно списка смен (прокручивается), pt. */
export const MARKET_LIST = { x: 0, y: 238, width: 393, height: 468 }
/** Высота всего списка, pt. */
export const MARKET_LIST_HEIGHT = 900

export function drawMarketBase(context: CanvasRenderingContext2D, time = '08:45') {
  workerPage(context, time, 'market', (ctx) => {
    ctx.fillStyle = IA.white
    ctx.fillRect(0, 118, 393, 120)
    ctx.fillStyle = IA.gray100
    ctx.fillRect(0, 237, 393, 1)
    tx(ctx, tr('Giełda zmian', 'Shift Market'), 20, 150, { size: 18, weight: 700, color: IA.gray900 })
    tx(ctx, tr('Dostępne zmiany do podjęcia', 'Available shifts you can claim'), 20, 172, { size: 14, color: IA.gray500 })
    let x = 20
    ;[tr('Wszystkie', 'All'), tr('Logistyka', 'Logistics'), tr('Montaż', 'Assembly'), tr('Kontrola jakości', 'QC')].forEach((label, index) => {
      const width = measure(ctx, label, { size: 14, weight: 500, color: IA.white }) + 32
      fillRound(ctx, x, 190, width, 32, 16, index === 0 ? IA.primary : IA.gray100)
      tx(ctx, label, x + 16, 211, { size: 14, weight: 500, color: index === 0 ? IA.white : IA.gray600 })
      x += width + 8
    })
  })
}

interface MarketShift {
  site: string
  address: string
  time: string
  date: string
  taken: string
  hero?: boolean
}

const MARKET: MarketShift[] = [
  { site: 'Magazyn Bielany — Kompletacja', address: 'ul. Kępińska 4, Bielany Wrocławskie', time: '06:00 — 14:00', date: '28 wrz', taken: '4/6' },
  { site: SITE.name, address: SITE.address, time: '14:00 — 22:00', date: '27 wrz', taken: '2/3', hero: true },
  { site: 'Centrum Dystrybucji Oleśnica', address: 'ul. Kopernika 21, Oleśnica', time: '22:00 — 06:00', date: '28 wrz', taken: '1/4' },
  { site: 'Magazyn Bielany — Kompletacja', address: 'ul. Kępińska 4, Bielany Wrocławskie', time: '14:00 — 22:00', date: '29 wrz', taken: '0/5' },
]

/** Карточка смены на бирже: тёмная шапка с объектом, время, дата, занятость. */
export const MARKET_CARD = { width: 353, height: 196 }

export function drawMarketCard(context: CanvasRenderingContext2D, x: number, y: number, shift: MarketShift, button: boolean) {
  webCard(context, x, y, MARKET_CARD.width, MARKET_CARD.height)
  context.save()
  round(context, x, y, MARKET_CARD.width, MARKET_CARD.height, 12)
  context.clip()
  const head = context.createLinearGradient(x, 0, x + MARKET_CARD.width, 0)
  head.addColorStop(0, IA.gray700)
  head.addColorStop(1, IA.gray800)
  context.fillStyle = head
  context.fillRect(x, y, MARKET_CARD.width, 96)
  const shade = context.createLinearGradient(0, y + 96, 0, y)
  shade.addColorStop(0, 'rgba(0,0,0,0.5)')
  shade.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = shade
  context.fillRect(x, y, MARKET_CARD.width, 96)
  context.restore()
  tx(context, shift.site, x + 16, y + 70, { size: 14, weight: 700, color: IA.white, max: MARKET_CARD.width - 32 })
  lucide(context, 'mapPin', x + 16, y + 77, 10, IA.gray300)
  tx(context, shift.address, x + 30, y + 86, { size: 12, color: IA.gray300, max: MARKET_CARD.width - 46 })
  lucide(context, 'clock', x + 16, y + 118, 14, IA.gray600)
  tx(context, shift.time, x + 36, y + 130, { size: 14, color: IA.gray600 })
  tx(context, date(shift.date), x + MARKET_CARD.width - 16, y + 130, { size: 12, color: IA.gray500, align: 'right' })
  tx(context, tr(`${shift.taken} przypisanych pracowników`, `${shift.taken} workers assigned`), x + 16, y + 170, { size: 12, color: IA.gray500 })
  if (button) drawClaimButton(context, x + MARKET_CARD.width - 16 - CLAIM.width, y + 146, 'claim')
}

/** Кнопка заявки на карточке смены, pt: её состояние меняется поверх экрана. */
export const CLAIM = { width: 128, height: 38 }
export type ClaimState = 'claim' | 'processing' | 'pending' | 'assigned'

export function drawClaimButton(context: CanvasRenderingContext2D, x: number, y: number, state: ClaimState) {
  if (state === 'claim') {
    withShadow(context, 8, 4, 'rgba(58, 48, 134, 0.3)', () => fillRound(context, x + 22, y, CLAIM.width - 22, CLAIM.height, 8, IA.primary))
    lucide(context, 'hand', x + 40, y + 12, 14, IA.white)
    tx(context, tr('Podejmij', 'Claim'), x + 60, y + 24, { size: 14, weight: 600, color: IA.white })
    return
  }
  if (state === 'assigned') {
    const assigned = tr('Już przypisany', 'Already assigned')
    const width = measure(context, assigned, { size: 14, weight: 500, color: IA.green600 }) + 32
    fillRound(context, x + CLAIM.width - width, y, width, CLAIM.height, 12, IA.green50)
    tx(context, assigned, x + CLAIM.width - width + 16, y + 24, { size: 14, weight: 500, color: IA.green600 })
    return
  }
  const label = state === 'processing' ? tr('Przetwarzanie...', 'Processing...') : tr('Oczekuje na zatwierdzenie', 'Awaiting approval')
  const color = state === 'processing' ? IA.yellow700 : IA.yellow600
  const width = measure(context, label, { size: 13, weight: 500, color }) + 32 + 20
  fillRound(context, x + CLAIM.width - width, y, width, CLAIM.height, 12, IA.yellow50)
  if (state === 'processing') {
    context.strokeStyle = IA.yellow600
    context.lineWidth = 2
    context.beginPath()
    context.arc(x + CLAIM.width - width + 20, y + 19, 6, 0.4, Math.PI * 1.7)
    context.stroke()
  } else lucide(context, 'hourglass', x + CLAIM.width - width + 13, y + 12, 14, color)
  tx(context, label, x + CLAIM.width - width + 34, y + 24, { size: 13, weight: 500, color })
}

/** Длинный список смен (для прокрутки). */
export function drawMarketList(context: CanvasRenderingContext2D) {
  context.fillStyle = IA.gray50
  context.fillRect(0, 0, 393, MARKET_LIST_HEIGHT)
  MARKET.forEach((shift, index) => drawMarketCard(context, 20, 16 + index * (MARKET_CARD.height + 12), shift, !shift.hero))
  const hero = MARKET[1]!
  drawMarketCard(context, 20, 16 + 1 * (MARKET_CARD.height + 12), hero, false)
}

/** Где в списке карточка Hub Wrocław 14:00 — 22:00 (у неё кнопка — отдельно), pt списка. */
export const MARKET_HERO = { x: 20, y: 16 + MARKET_CARD.height + 12 }

export function drawMarketHeroCard(context: CanvasRenderingContext2D) {
  drawMarketCard(context, 0, 0, MARKET[1]!, false)
}

/* ── Станция 10 и 13: пульт координатора (CoordinatorDashboard) ──────── */

export interface CoordState {
  /** Строка Яна в «Oczekujące zgłoszenia» есть. */
  claim: boolean
  /** Подсказка «Zatwierdź» у зелёной кнопки. */
  tooltip: boolean
  /** Кнопка нажата. */
  pressed: boolean
  /** Сколько на объекте (для «Przegląd dnia»). */
  active: number
  /** Без полосы присутствия: её рисует 3D (м-прогресс). */
  bar: boolean
}

/** Зелёная кнопка «Zatwierdź» у строки Яна, px окна панели. */
export const APPROVE = { x: 256 + 20 + 728 - 12 - 32 - 6 - 32, y: 0, width: 32, height: 32 }
/** Полоса присутствия «Przegląd dnia», px окна панели. */
export const ATTENDANCE_BAR = { x: 256 + 36, y: 222, width: 696, height: 10 }

export function drawCoordDashboard(context: CanvasRenderingContext2D, state: CoordState) {
  context.fillStyle = pageFill(IA.gray50)
  context.fillRect(0, 0, PANEL.width, PANEL.height)
  coordShell(context, 'Panel')
  const left = 256
  const width = 768
  context.fillStyle = cardFill(IA.white)
  context.fillRect(left, 0, width, 120)
  context.fillStyle = IA.gray100
  context.fillRect(left, 119, width, 1)
  tx(context, tr('Panel', 'Dashboard'), left + 20, 36, { size: 14, color: IA.gray500 })
  tx(context, tr('Panel koordynatora', 'Coordinator Dashboard'), left + 20, 60, { size: 18, weight: 700, color: IA.gray900 })
  lucide(context, 'bell', left + width - 48, 28, 20, IA.gray400)
  input(context, left + 20, 72, width - 40, 38, 'Hub Wrocław — Fulfillment', '', false)
  lucide(context, 'chevronDown', left + width - 56, 83, 16, IA.gray400)
  /* Przegląd dnia: Aktywni, X / Y, полоса, % wskaźnik obecności. */
  const card = { x: left + 20, y: 136, width: width - 40, height: 122 }
  webCard(context, card.x, card.y, card.width, card.height)
  tx(context, tr('Przegląd dnia', "Today's Overview"), card.x + 16, card.y + 28, { size: 14, weight: 600, color: IA.gray900 })
  const active = tr('Aktywni', 'Active')
  const badgeWidth = measure(context, active, { size: 12, weight: 500, color: IA.green700 }) + 20
  badge(context, active, card.x + card.width - 16 - badgeWidth, card.y + 14, IA.green100, IA.green700, 12, 500, 10, 22)
  const total = 18
  tx(context, String(state.active), card.x + 16, card.y + 78, { size: 36, weight: 800, color: IA.gray900 })
  const activeWidth = measure(context, String(state.active), { size: 36, weight: 800, color: IA.gray900 })
  tx(context, `/ ${total}`, card.x + 16 + activeWidth + 10, card.y + 76, { size: 18, color: IA.gray400 })
  fillRound(context, ATTENDANCE_BAR.x, ATTENDANCE_BAR.y, ATTENDANCE_BAR.width, ATTENDANCE_BAR.height, 5, IA.gray100)
  const percent = Math.round((state.active / total) * 100)
  if (state.bar) fillRound(context, ATTENDANCE_BAR.x, ATTENDANCE_BAR.y, (ATTENDANCE_BAR.width * percent) / 100, ATTENDANCE_BAR.height, 5, IA.primary)
  tx(context, tr(`${percent}% wskaźnik obecności`, `${percent}% attendance rate`), card.x + 16, card.y + 114, { size: 12, color: IA.gray500 })
  /* Краткая статистика. */
  const stats = card.y + card.height + 16
  const half = (card.width - 12) / 2
  webCard(context, card.x, stats, half, 92)
  lucide(context, 'users', card.x + 16, stats + 16, 18, IA.primary)
  tx(context, String(state.active), card.x + 16, stats + 62, { size: 24, weight: 700, color: IA.gray900 })
  tx(context, tr('Aktywni pracownicy', 'Active Workers'), card.x + 16, stats + 80, { size: 12, color: IA.gray500 })
  webCard(context, card.x + half + 12, stats, half, 92)
  lucide(context, 'clock', card.x + half + 28, stats + 16, 18, IA.orange500)
  tx(context, '3', card.x + half + 28, stats + 62, { size: 24, weight: 700, color: IA.gray900 })
  tx(context, tr('Łączna liczba zmian', 'Total Shifts'), card.x + half + 28, stats + 80, { size: 12, color: IA.gray500 })
  /* Oczekujące zgłoszenia. */
  let y = stats + 92 + 20
  tx(context, tr('Oczekujące zgłoszenia', 'Pending Claims'), card.x, y + 14, { size: 16, weight: 600, color: IA.gray900 })
  y += 28
  const claims: [string, string, boolean][] = [
    ...(state.claim ? ([[`${JAN.first} ${JAN.last}`, `${SITE.name} · 14:00–22:00`, true]] as [string, string, boolean][]) : []),
    ['Olena Kovalenko', 'Magazyn Bielany — Kompletacja · 06:00–14:00', false],
  ]
  claims.forEach(([name, line, hero], index) => {
    const rowY = y + index * 70
    webCard(context, card.x, rowY, card.width, 62)
    context.save()
    round(context, card.x, rowY, card.width, 62, 12)
    context.clip()
    context.fillStyle = IA.yellow400
    context.fillRect(card.x, rowY, 4, 62)
    context.restore()
    context.beginPath()
    context.arc(card.x + 34, rowY + 31, 18, 0, Math.PI * 2)
    context.fillStyle = IA.yellow100
    context.fill()
    lucide(context, 'userCheck', card.x + 26, rowY + 23, 16, IA.yellow600)
    tx(context, name, card.x + 64, rowY + 27, { size: 14, weight: 500, color: IA.gray900 })
    tx(context, line, card.x + 64, rowY + 46, { size: 12, color: IA.gray500 })
    const buttonsX = card.x + card.width - 12 - 32 - 6 - 32
    fillRound(context, buttonsX, rowY + 15, 32, 32, 8, hero && state.pressed ? IA.green200 : IA.green100)
    lucide(context, 'checkCircle', buttonsX + 9, rowY + 24, 14, IA.green600)
    fillRound(context, buttonsX + 38, rowY + 15, 32, 32, 8, IA.red100)
    lucide(context, 'userX', buttonsX + 47, rowY + 24, 14, IA.red600)
    if (hero && state.tooltip) {
      /* Системная подсказка title="Zatwierdź". */
      const tip = { x: buttonsX - 30, y: rowY + 52, width: 78, height: 24 }
      withShadow(context, 6, 2, 'rgba(0,0,0,0.2)', () => fillRound(context, tip.x, tip.y, tip.width, tip.height, 4, '#f7f7f7'))
      strokeRound(context, tip.x, tip.y, tip.width, tip.height, 4, 'rgba(0,0,0,0.15)')
      tx(context, tr('Zatwierdź', 'Approve'), tip.x + tip.width / 2, tip.y + 16, { size: 12, color: IA.gray800, align: 'center' })
    }
  })
}

/** Где строка Яна в «Oczekujące zgłoszenia» на панели, px окна. */
export const CLAIM_ROW = { x: 256 + 20, y: 136 + 122 + 16 + 92 + 20 + 28, width: 728, height: 62 }

/* ── Станция 11: «Moje zmiany» → «Nadchodzące» (WorkerShifts, сайт) ──── */

export function drawMyShifts(context: CanvasRenderingContext2D, time = '09:00') {
  workerPage(context, time, 'shifts', (ctx) => {
    ctx.fillStyle = IA.white
    ctx.fillRect(0, 118, 393, 104)
    ctx.fillStyle = IA.gray100
    ctx.fillRect(0, 221, 393, 1)
    tx(ctx, tr('Moje zmiany', 'My Shifts'), 20, 150, { size: 18, weight: 700, color: IA.gray900 })
    const upcomingLabel = tr('Nadchodzące', 'Upcoming')
    const upcoming = measure(ctx, upcomingLabel, { size: 14, weight: 500, color: IA.white }) + 32
    fillRound(ctx, 20, 168, upcoming, 32, 16, IA.primary)
    tx(ctx, upcomingLabel, 36, 189, { size: 14, weight: 500, color: IA.white })
    fillRound(ctx, 28 + upcoming, 168, 82, 32, 16, IA.gray100)
    tx(ctx, tr('Historia', 'History'), 44 + upcoming, 189, { size: 14, weight: 500, color: IA.gray600 })
    const assigned = tr('Przypisana', 'Assigned')
    const shifts: [string, string, string, string, string, string, boolean][] = [
      ['27', date('wrz'), SITE.name, SITE.client, '14:00 — 22:00', assigned, true],
      ['28', date('wrz'), SITE.name, SITE.client, '07:00 — 15:00', assigned, false],
      ['30', date('wrz'), 'Magazyn Bielany — Kompletacja', 'Bielany Log', '06:00 — 14:00', assigned, false],
    ]
    shifts.forEach(([day, month, site, client, time, status, fresh], index) => {
      const y = 238 + index * 124
      webCard(ctx, 20, y, 353, 108, 12, fresh ? '#fbfaff' : IA.white, fresh ? IA.primary20 : IA.gray100)
      fillRound(ctx, 36, y + 16, 40, 40, 8, IA.primary10)
      tx(ctx, day, 56, y + 36, { size: 13, weight: 700, color: IA.primary, align: 'center' })
      tx(ctx, month, 56, y + 50, { size: 9, color: 'rgba(58,48,134,0.7)', align: 'center', upper: true })
      tx(ctx, site, 88, y + 33, { size: 14, weight: 600, color: IA.gray900, max: 190 })
      tx(ctx, client, 88, y + 51, { size: 12, color: IA.gray500 })
      const statusWidth = measure(ctx, status, { size: 10, weight: 500, color: IA.yellow700 }) + 20
      badge(ctx, status, 357 - statusWidth, y + 18, IA.yellow100, '#854d0e', 10, 500, 10, 20)
      lucide(ctx, 'clock', 36, y + 78, 12, IA.gray500)
      tx(ctx, time, 52, y + 88, { size: 12, color: IA.gray500 })
      lucide(ctx, 'mapPin', 160, y + 78, 12, IA.gray500)
      tx(ctx, SITE.address, 176, y + 88, { size: 12, color: IA.gray500, max: 150 })
    })
  })
}

/** Баннер iOS: напоминание за час до смены (PushCenter.swift: заголовок
    «Najbliższa zmiana», текст «объект · время»). */
export const BANNER = { width: 369, height: 78 }

export function drawBanner(context: CanvasRenderingContext2D) {
  fillRound(context, 0, 0, BANNER.width, BANNER.height, 24, cardFill(IOS.banner))
  const icon = context.createLinearGradient(14, 14, 52, 52)
  icon.addColorStop(0, IOS.primaryLight)
  icon.addColorStop(1, IOS.primary)
  round(context, 14, 17, 40, 40, 10)
  context.fillStyle = icon
  context.fill()
  glyph(context, 'clockFill', 34, 37, 22, '#ffffff', IOS.primary)
  tx(context, 'Najbliższa zmiana', 66, 34, { size: 15, weight: 600, color: IOS.label })
  tx(context, 'teraz', BANNER.width - 16, 34, { size: 13, color: IOS.secondary, align: 'right' })
  tx(context, `${SITE.name} · 14:00`, 66, 55, { size: 15, color: IOS.label, max: 285 })
}

/* ── Станция 12: «Widok grafiku» (AdminSchedule, неделя 28 wrz – 04 paź) ─ */

/** Панель 2,8 × 1,8 м: окно админа 1440 × 926, холст 3000 px. */
export const WIDE = { width: 1440, height: 926, scale: 3000 / 1440 }

/** День недели (date-fns EEE: pl и en-US) и число. */
const DAYS: [string, string, string][] = [
  ['pon.', 'Mon', '28'],
  ['wt.', 'Tue', '29'],
  ['śr.', 'Wed', '30'],
  ['czw.', 'Thu', '01'],
  ['pt.', 'Fri', '02'],
  ['sob.', 'Sat', '03'],
  ['niedz.', 'Sun', '04'],
]

interface Block {
  day: number
  time: string
  taken: number
  need: number
  names: string[]
  project?: string
}

const BLOCKS: Block[] = [
  { day: 0, time: '14:00–22:00', taken: 3, need: 3, names: ['Olena K.', 'Dmytro B.', 'Siarhei K.'] },
  { day: 1, time: '07:00–15:00', taken: 3, need: 3, names: ['Jan K.', 'Olena K.', 'Piotr N.'] },
  { day: 1, time: '14:00–22:00', taken: 1, need: 3, names: ['Tomasz L.'] },
  { day: 2, time: '07:00–15:00', taken: 2, need: 3, names: ['Aleksandra W.', 'Piotr N.'] },
  { day: 3, time: '06:00–14:00', taken: 3, need: 3, names: ['Jan K.', 'Dmytro B.', 'Olena K.'] },
  { day: 4, time: '07:00–15:00', taken: 3, need: 3, names: ['Jan K.', 'Piotr N.', 'Siarhei K.'] },
  { day: 4, time: '22:00–06:00', taken: 1, need: 2, names: ['Dmytro B.'] },
  { day: 5, time: '08:00–16:00', taken: 2, need: 2, names: ['Tomasz L.', 'Aleksandra W.'] },
]

/** Геометрия недели: где колонки и блок «07:00–15:00» понедельника, px окна. */
const GRID = { x: 592, y: 250, width: 800, height: 600 }
const COLUMN = GRID.width / 7
export const TARGET_BLOCK = { x: GRID.x + 4, y: GRID.y + 30 + 18 + 4, width: COLUMN - 8, height: 96 }
/** Строка «Jan Kowalski» в «Pula zasobów», px окна. */
export const POOL_JAN = { x: 292, y: 238, width: 264, height: 46 }

export type ScheduleDrop = 'before' | 'hover' | 'dropped'

function occupancy(taken: number, need: number): [string, string, string] {
  const ratio = taken / need
  if (ratio >= 1) return [IA.green500, 'rgba(240, 253, 244, 0.5)', IA.green600]
  if (ratio >= 0.5) return [IA.yellow500, 'rgba(254, 252, 232, 0.5)', IA.yellow500]
  return [IA.red500, 'rgba(254, 242, 242, 0.5)', IA.red500]
}

/** Блок смены в колонке дня (border-l 3px, цвет — по заполненности). */
export function drawShiftBlock(context: CanvasRenderingContext2D, x: number, y: number, width: number, block: Block, drop: 'none' | 'hover' = 'none') {
  const [edge, fill, ratioColor] = occupancy(block.taken, block.need)
  const height = 22 + block.names.length * 18 + (block.taken < block.need ? 16 : 0) + (drop === 'hover' ? 30 : 0)
  if (drop === 'hover') fillRound(context, x - 3, y - 3, width + 6, height + 6, 9, 'rgba(58, 48, 134, 0.25)')
  fillRound(context, x, y, width, height, 6, cardFill(IA.white))
  fillRound(context, x, y, width, height, 6, fill)
  context.save()
  round(context, x, y, width, height, 6)
  context.clip()
  context.fillStyle = edge
  context.fillRect(x, y, 3, height)
  context.restore()
  context.beginPath()
  context.arc(x + 11, y + 13, 3, 0, Math.PI * 2)
  context.fillStyle = IA.green500
  context.fill()
  tx(context, block.time, x + 18, y + 17, { size: 10, weight: 600, color: IA.gray700 })
  tx(context, `${block.taken}/${block.need}`, x + width - 6, y + 17, { size: 9, weight: 700, color: ratioColor, align: 'right' })
  block.names.forEach((name, index) => {
    const rowY = y + 24 + index * 18
    initials(context, name[0]!, x + 8, rowY, 16, IA.primary10, IA.primary)
    tx(context, name, x + 30, rowY + 12, { size: 10, weight: 500, color: IA.gray700, max: width - 36 })
  })
  let bottom = y + 24 + block.names.length * 18
  if (block.taken < block.need) {
    tx(context, tr(`+${block.need - block.taken} potrzebnych`, `+${block.need - block.taken} needed`), x + 8, bottom + 9, { size: 8, color: IA.gray400 })
    bottom += 16
  }
  if (drop === 'hover') {
    context.setLineDash([4, 3])
    strokeRound(context, x + 5, bottom + 2, width - 10, 22, 4, 'rgba(58, 48, 134, 0.45)', 1)
    context.setLineDash([])
    tx(context, tr('Upuść pracownika tutaj', 'Drop worker here'), x + width / 2, bottom + 17, { size: 8, color: 'rgba(58, 48, 134, 0.7)', align: 'center' })
  }
  return height
}

export function heroBlock(drop: ScheduleDrop): Block {
  return drop === 'dropped'
    ? { day: 0, time: '07:00–15:00', taken: 3, need: 3, names: ['Olena K.', 'Piotr N.', 'Jan K.'] }
    : { day: 0, time: '07:00–15:00', taken: 2, need: 3, names: ['Olena K.', 'Piotr N.'] }
}

export function drawSchedule(context: CanvasRenderingContext2D, drop: ScheduleDrop, lifted = false) {
  adminShell(context, 'Grafik', WIDE.height)
  /* Pula zasobów: колонка работников слева, узкая — её не приближаем. */
  context.fillStyle = cardFill(IA.white)
  context.fillRect(280, 88, 288, WIDE.height - 112)
  context.fillStyle = IA.gray200
  context.fillRect(567, 88, 1, WIDE.height - 112)
  lucide(context, 'users', 296, 106, 16, IA.primary)
  tx(context, tr('Pula zasobów', 'Resource Pool'), 320, 119, { size: 14, weight: 700, color: IA.gray900 })
  tx(context, tr('8 pracowników', '8 workers'), 296, 138, { size: 12, color: IA.gray400 })
  context.fillStyle = IA.gray100
  context.fillRect(280, 152, 288, 1)
  fillRound(context, 292, 162, 264, 30, 8, IA.white)
  strokeRound(context, 292, 162, 264, 30, 8, IA.gray200)
  lucide(context, 'search', 302, 170, 14, IA.gray400)
  tx(context, tr('Szukaj pracowników...', 'Search workers...'), 324, 181, { size: 12, color: IA.gray400 })
  const pool: [string, string, number, boolean][] = [
    ['Olena Kovalenko', 'OK', 148, true],
    [`${JAN.first} ${JAN.last}`, JAN.initials, 142, true],
    ['Piotr Nowak', 'PN', 136, false],
    ['Dmytro Bondarenko', 'DB', 151, true],
    ['Aleksandra Wójcik', 'AW', 104, true],
    ['Siarhei Kazlou', 'SK', 128, false],
    ['Tomasz Lewandowski', 'TL', 72, true],
  ]
  pool.forEach(([name, short, hours, onCall], index) => {
    const y = 204 + index * 50
    const jan = index === 1
    fillRound(context, 292, y - 12 + 46 - 46, 264, 46, 8, jan && drop !== 'before' ? IA.primary5 : IA.gray50)
    lucide(context, 'grip', 298, y + 3, 12, IA.gray300)
    initials(context, short, 316, y + 1, 28, IA.primary10, IA.primary)
    tx(context, name, 352, y + 12, { size: 12, weight: 500, color: IA.gray800 })
    context.beginPath()
    context.arc(355, y + 26, 3, 0, Math.PI * 2)
    context.fillStyle = onCall ? IA.green500 : IA.gray300
    context.fill()
    const percent = hours / 160
    const color = percent < 0.5 ? IA.red500 : percent < 0.8 ? IA.yellow500 : IA.green600
    tx(context, `${hours}h / 160h`, 364, y + 29, { size: 9, weight: 500, color })
  })
  context.fillStyle = IA.gray100
  context.fillRect(280, WIDE.height - 84, 288, 1)
  tx(context, tr('Godziny miesięczne', 'Monthly hours'), 292, WIDE.height - 62, { size: 9, weight: 600, color: IA.gray400, upper: true, tracking: 0.4 })
  tx(context, '● <50%', 292, WIDE.height - 44, { size: 9, color: IA.red500 })
  tx(context, '● 50-80%', 340, WIDE.height - 44, { size: 9, color: IA.yellow500 })
  tx(context, '● >80%', 402, WIDE.height - 44, { size: 9, color: IA.green600 })
  /* Шапка недели: заголовок, счётчики, управление. */
  tx(context, tr('Widok grafiku', 'Schedule View'), 592, 122, { size: 20, weight: 700, color: IA.gray900 })
  tx(context, tr('Tygodniowy przegląd zmian we wszystkich projektach', 'Weekly shift overview across all projects'), 592, 142, { size: 12, color: IA.gray500 })
  const under = drop === 'dropped' ? 2 : 3
  let chipX = 1392
  const chips: [IconName, string, string, string, string][] = [
    ['alert', String(under), tr('Niewystarczająco', 'Understaffed'), IA.red50, IA.red600],
    ['users', drop === 'dropped' ? '21/24' : '20/24', '', IA.gray50, IA.gray700],
    ['calendar', '9', tr('zmian', 'shifts'), IA.gray50, IA.gray700],
  ]
  for (const [icon, value, label, fill, color] of chips) {
    const width = 36 + measure(context, value, { size: 12, weight: 500, color }) + (label ? measure(context, label, { size: 12, color }) + 6 : 0)
    chipX -= width
    fillRound(context, chipX, 112, width, 28, 8, fill)
    lucide(context, icon, chipX + 10, 120, 12, color === IA.red600 ? IA.red500 : IA.gray400)
    tx(context, value, chipX + 28, 131, { size: 12, weight: 500, color })
    if (label) tx(context, label, chipX + 34 + measure(context, value, { size: 12, weight: 500, color }), 131, { size: 12, color: color === IA.red600 ? IA.red400 : IA.gray400 })
    chipX -= 12
  }
  webCard(context, 592, 162, 800, 64)
  input(context, 604, 173, 240, 42, tr('Wszystkie projekty', 'All Projects'), '')
  lucide(context, 'chevronDown', 820, 187, 14, IA.gray400)
  lucide(context, 'chevronLeft', 900, 185, 18, IA.gray600)
  /* «Today» шире «Dziś»: левее, чтобы до дат остался тот же зазор. */
  tx(context, tr('Dziś', 'Today'), english() ? 929 : 940, 200, { size: 14, weight: 500, color: IA.primary })
  tx(context, date('28 wrz — 04 paź 2026'), 1062, 200, { size: 14, weight: 600, color: IA.gray700, align: 'center' })
  lucide(context, 'chevronRight', 1150, 185, 18, IA.gray600)
  primaryButton(context, 1216, 175, 164, 38, tr('Utwórz zmianę', 'Create Shift'), { size: 13, icon: 'plus' })
  /* Неделя: 7 колонок, между ними — линии gray-200. */
  fillRound(context, GRID.x, GRID.y, GRID.width, GRID.height, 12, cardFill(IA.gray200))
  context.save()
  round(context, GRID.x, GRID.y, GRID.width, GRID.height, 12)
  context.clip()
  DAYS.forEach(([pl, en, day], index) => {
    const name = tr(pl, en)
    const x = GRID.x + index * COLUMN + (index > 0 ? 0.5 : 0)
    const width = COLUMN - (index > 0 ? 0.5 : 0) - 0.5
    context.clearRect(x, GRID.y, width, GRID.height)
    context.fillStyle = cardFill(IA.white)
    context.fillRect(x, GRID.y, width, GRID.height)
    context.fillStyle = index === 0 ? IA.primary5 : 'rgba(249, 250, 251, 0.8)'
    context.fillRect(x, GRID.y, width, 30)
    context.fillStyle = IA.gray100
    context.fillRect(x, GRID.y + 30, width, 1)
    tx(context, name, x + 8, GRID.y + 20, { size: 10, color: IA.gray400, upper: true })
    tx(context, day, x + 12 + measure(context, name, { size: 10, color: IA.gray400, upper: true }), GRID.y + 21, { size: 14, weight: 700, color: index === 0 ? IA.primary : IA.gray900 })
    tx(context, 'Hub Wrocław', x + 6, GRID.y + 44, { size: 8, weight: 600, color: IA.gray400, upper: true })
  })
  const tops = new Map<number, number>()
  const place = (block: Block, drawBlock: boolean) => {
    const x = GRID.x + block.day * COLUMN + 4
    const top = tops.get(block.day) ?? GRID.y + 52
    const height = drawBlock ? drawShiftBlock(context, x, top, COLUMN - 8, block) : 22 + block.names.length * 18 + (block.taken < block.need ? 16 : 0)
    tops.set(block.day, top + height + 6)
  }
  const hero = heroBlock(drop)
  if (!lifted) {
    const x = GRID.x + 4
    drawShiftBlock(context, x, GRID.y + 52, COLUMN - 8, hero, drop === 'hover' ? 'hover' : 'none')
  } else {
    fillRound(context, GRID.x + 4, GRID.y + 52, COLUMN - 8, 76, 6, 'rgba(0,0,0,0.04)')
  }
  tops.set(0, GRID.y + 52 + (22 + hero.names.length * 18 + (hero.taken < hero.need ? 16 : 0) + (drop === 'hover' && !lifted ? 30 : 0)) + 6)
  for (const block of BLOCKS) place(block, true)
  context.restore()
  /* Легенда под сеткой. */
  const legend: [string, string][] = [
    [IA.yellow500, tr('Wersja robocza', 'Draft')],
    [IA.green500, tr('Opublikowano', 'Published')],
    [IA.blue500, tr('W trakcie', 'In Progress')],
    [IA.gray400, tr('Zakończono', 'Completed')],
    [IA.red400, tr('Anulowano', 'Cancelled')],
  ]
  let lx = 592
  for (const [color, label] of legend) {
    context.beginPath()
    context.arc(lx + 4, GRID.y + GRID.height + 26, 4, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()
    lx += 14 + tx(context, label, lx + 14, GRID.y + GRID.height + 30, { size: 12, color: IA.gray500 }) + 18
  }
}

/** Блок понедельника отдельно — он отрывается от панели и падает на пол. */
export const BLOCK_TILE = { width: 110, height: 90 }

export function drawBlockTile(context: CanvasRenderingContext2D) {
  drawShiftBlock(context, 0, 0, BLOCK_TILE.width, heroBlock('dropped'))
}

/* ── Станция 13: iPhone D координатора, «Obecność na żywo» (iOS) ──────── */

export const ATTENDANCE: [string, number][] = [
  [`${JAN.first} ${JAN.last}`, 4 * 3600 + 29 * 60 + 12],
  ['Olena Kovalenko', 4 * 3600 + 31 * 60 + 40],
  ['Piotr Nowak', 4 * 3600 + 27 * 60 + 5],
  ['Dmytro Bondarenko', 3 * 3600 + 58 * 60 + 51],
  ['Aleksandra Wójcik', 2 * 3600 + 12 * 60 + 33],
]

/** Строки «Obecność na żywo» на экране, pt: сюда встают слои строк. */
export const LIVE_ROWS = { x: 16, y: 212, width: 361, row: 44 }

function stopwatch(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function drawLiveRow(context: CanvasRenderingContext2D, x: number, y: number, width: number, name: string, seconds: number, highlight: boolean) {
  if (highlight) fillRound(context, x - 6, y - 4, width + 12, 40, 10, lightWorld ? 'rgba(58, 48, 134, 0.12)' : 'rgba(111, 94, 184, 0.28)')
  context.beginPath()
  context.arc(x + 4, y + 16, 4, 0, Math.PI * 2)
  context.fillStyle = IOS.success
  context.fill()
  tx(context, name, x + 18, y + 21, { size: 15, color: IOS.label })
  tx(context, stopwatch(seconds), x + width, y + 21, { size: 12, color: IOS.secondary, align: 'right', font: MONO })
}

export function drawCoordPhone(context: CanvasRenderingContext2D, offset: number, rowsOnScreen: boolean) {
  context.fillStyle = IOS.bg
  context.fillRect(0, 0, 393, 852)
  iosStatus(context, '11:30', IOS.label)
  island(context)
  /* Панель навигации: выбор объекта слева, колокольчик справа, большой заголовок. */
  tx(context, 'Hub Wrocław', 16, 86, { size: 17, color: IOS.primaryLight })
  glyph(context, 'chevronDown', 122, 81, 12, IOS.primaryLight)
  glyph(context, 'bell', 370, 80, 20, IOS.primaryLight)
  iosLargeTitle(context, tr('Pulpit', 'Dashboard'))
  /* Obecność na żywo. */
  iosCard(context, 16, 160, 361, 42 + ATTENDANCE.length * LIVE_ROWS.row + 8)
  glyph(context, 'radiowaves', 40, 184, 16, IOS.label)
  tx(context, tr('Obecność na żywo', 'Live attendance'), 56, 189, { size: 15, weight: 600, color: IOS.label })
  tx(context, String(ATTENDANCE.length + 7), 361, 190, { size: 20, weight: 700, color: IOS.success, align: 'right' })
  if (rowsOnScreen) {
    ATTENDANCE.forEach(([name, seconds], index) => drawLiveRow(context, 32, LIVE_ROWS.y + index * LIVE_ROWS.row, 329, name, seconds + offset, false))
  }
  /* Dzisiejsze zmiany. */
  const top = 160 + 42 + ATTENDANCE.length * LIVE_ROWS.row + 24
  iosCard(context, 16, top, 361, 150)
  tx(context, tr('Dzisiejsze zmiany', "Today's shifts"), 32, top + 30, { size: 15, weight: 600, color: IOS.label })
  const shifts: [string, string][] = [
    ['07:00 – 15:00', '12 / 12'],
    ['14:00 – 22:00', '3 / 3'],
  ]
  shifts.forEach(([time, filled], index) => {
    const y = top + 50 + index * 48
    glyph(context, 'clockFill', 44, y + 14, 16, IOS.primaryLight, IOS.card)
    tx(context, time, 62, y + 19, { size: 15, color: IOS.label })
    tx(context, filled, 361, y + 19, { size: 13, color: IOS.secondary, align: 'right' })
    context.fillStyle = IOS.separator
    context.fillRect(32, y + 40, 329, 0.6)
  })
  iosTabBar(context, COORD_TABS, 0)
}

/* ── Станция 14: «Nowe zadanie» и приёмка (CoordinatorTasks, модалки) ── */

export const TASK_CARD = { width: 440, height: 520 }
export type TaskCardState = 'form' | 'sent' | 'accept' | 'done'

export interface TaskFormState {
  title: string
  focus: boolean
  pressed: boolean
  quantity: string
  confirm: boolean
  stage: TaskCardState
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ACCEPTED'
}

export const TASK_TITLE = 'Mycie posadzki, strefa B'
/** Название задания в английском двойнике: печатается за то же время, что польское. */
export const TASK_TITLE_EN = 'Floor cleaning, zone B'
const taskTitle = () => tr(TASK_TITLE, TASK_TITLE_EN)
/** Кнопки на карточке, px. */
export const TASK_SUBMIT = { x: 24, y: 452, width: 392, height: 46 }
export const TASK_ACCEPT = { x: 24, y: 300, width: 392, height: 46 }

/** Статус задания (taskStatus.*): польский, английский, фон, цвет. */
const TASK_STATUS: Record<TaskFormState['status'], [string, string, string, string]> = {
  PENDING: ['Do zrobienia', 'To do', IA.gray100, IA.gray600],
  IN_PROGRESS: ['W trakcie', 'In progress', IA.blue100, IA.blue700],
  COMPLETED: ['Zgłoszone', 'Submitted', IA.orange100, IA.orange700],
  ACCEPTED: ['Przyjęte', 'Accepted', IA.green100, IA.green700],
}

export function drawTaskCard(context: CanvasRenderingContext2D, state: TaskFormState) {
  const { width, height } = TASK_CARD
  fillRound(context, 0, 0, width, height, 16, cardFill(IA.white))
  if (state.stage === 'form') {
    tx(context, tr('Nowe zadanie', 'New task'), 24, 40, { size: 16, weight: 600, color: IA.gray900 })
    lucide(context, 'x', width - 44, 22, 20, IA.gray400)
    context.fillStyle = IA.gray100
    context.fillRect(0, 60, width, 1)
    input(context, 24, 80, width - 48, 44, state.title, tr('Co trzeba zrobić', 'What needs to be done'), state.focus)
    fillRound(context, 24, 136, width - 48, 64, 8, IA.white)
    strokeRound(context, 24, 136, width - 48, 64, 8, IA.gray200)
    tx(context, tr('Szczegóły (opcjonalnie)', 'Details (optional)'), 40, 162, { size: 14, color: IA.gray400 })
    input(context, 24, 212, width - 48, 44, `${JAN.first} ${JAN.last}`, tr('Wykonawca — wybierz pracownika', 'Assignee — select worker'))
    lucide(context, 'chevronDown', width - 52, 226, 16, IA.gray500)
    const half = (width - 48 - 12) / 2
    input(context, 24, 268, half, 44, 'Hub Wrocław — Fulfil…', '')
    input(context, 36 + half, 268, half, 44, tr('Średni', 'Medium'), '')
    context.fillStyle = IA.gray100
    context.fillRect(24, 324, width - 48, 1)
    tx(context, tr('Premia', 'Bonus'), 24, 348, { size: 12, weight: 600, color: IA.gray500, upper: true, tracking: 0.6 })
    const option = (width - 48 - 16) / 3
    ;[tr('Bez premii', 'No bonus'), tr('Kwota stała', 'Fixed sum'), tr('Za jednostkę', 'Per unit')].forEach((label, index) => {
      const x = 24 + index * (option + 8)
      const on = index === 2
      fillRound(context, x, 360, option, 38, 12, on ? IA.primary5 : IA.white)
      strokeRound(context, x, 360, option, 38, 12, on ? IA.primary : IA.gray200, 2)
      tx(context, label, x + option / 2, 384, { size: 12, weight: 600, color: on ? IA.primary : IA.gray500, align: 'center' })
    })
    input(context, 24, 408, half, 36, '12,00', tr('Stawka, PLN', 'Rate, PLN'), false, 14)
    input(context, 36 + half, 408, half, 36, 'm²', tr('Jednostka (m², szt.)', 'Unit (m², pcs)'), false, 14)
    const submit = TASK_SUBMIT
    primaryButton(context, submit.x, submit.y + 4, submit.width, submit.height - 4, tr('Zleć zadanie', 'Assign task'), { size: 15, color: state.pressed ? IA.primary600 : IA.primary })
    return
  }
  if (state.stage === 'accept') {
    tx(context, tr('Odbierz', 'Accept'), 24, 40, { size: 16, weight: 600, color: IA.gray900 })
    lucide(context, 'x', width - 44, 22, 20, IA.gray400)
    context.fillStyle = IA.gray100
    context.fillRect(0, 60, width, 1)
    tx(context, taskTitle(), 24, 96, { size: 15, weight: 500, color: IA.gray900 })
    tx(context, tr('Potwierdź faktyczny obmiar (12,00 zł / m²)', 'Confirm the actual volume (12,00 zł / m²)'), 24, 128, { size: 13, color: IA.gray500 })
    input(context, 24, 144, width - 48, 46, state.quantity, 'm²', state.quantity.length < 2, 16)
    if (state.quantity) {
      tx(context, tr('Premia wyniesie', 'Bonus will be'), 24, 228, { size: 15, color: IA.gray600 })
      tx(context, '360,00 zł', 24 + measure(context, tr('Premia wyniesie ', 'Bonus will be '), { size: 15, color: IA.gray600 }), 228, { size: 15, weight: 700, color: IA.green700 })
    }
    const accept = TASK_ACCEPT
    primaryButton(context, accept.x, accept.y, accept.width, accept.height, tr('Potwierdź odbiór', 'Confirm acceptance'), { size: 15, color: state.confirm ? IA.primary600 : IA.primary })
    return
  }
  /* Лента заданий координатора: одно задание, статус меняется. */
  tx(context, tr('Zadania', 'Tasks'), 24, 44, { size: 18, weight: 700, color: IA.gray900 })
  primaryButton(context, width - 24 - 168, 18, 168, 38, tr('Nowe zadanie', 'New task'), { size: 13, icon: 'plus' })
  context.fillStyle = IA.gray100
  context.fillRect(0, 72, width, 1)
  const card = { x: 20, y: 92, width: width - 40, height: state.status === 'COMPLETED' ? 150 : 104 }
  webCard(context, card.x, card.y, card.width, card.height)
  tx(context, taskTitle(), card.x + 16, card.y + 30, { size: 14, weight: 600, color: IA.gray900 })
  tx(context, `${JAN.first} ${JAN.last} · ${SITE.name}`, card.x + 16, card.y + 50, { size: 12, color: IA.gray500, max: card.width - 130 })
  const [pl, en, fill, color] = TASK_STATUS[state.status]
  const label = tr(pl, en)
  const labelWidth = measure(context, label, { size: 10, weight: 600, color }) + 16
  badge(context, label, card.x + card.width - 16 - labelWidth, card.y + 16, fill, color, 10, 600, 8, 22)
  lucide(context, 'gift', card.x + 16, card.y + 70, 14, state.status === 'ACCEPTED' ? IA.green600 : IA.gray400)
  if (state.status === 'ACCEPTED') {
    tx(context, '360,00 zł', card.x + 38, card.y + 82, { size: 14, weight: 600, color: IA.green700 })
    tx(context, ' · 30 m²', card.x + 38 + measure(context, '360,00 zł', { size: 14, weight: 600, color: IA.green700 }), card.y + 82, { size: 14, color: IA.gray500 })
  } else tx(context, '12,00 zł / m²', card.x + 38, card.y + 82, { size: 14, color: IA.gray600 })
  if (state.status === 'COMPLETED') {
    const half = card.width - 32 - 12 - 110
    fillRound(context, card.x + 16, card.y + 100, half, 38, 12, IA.green600)
    lucide(context, 'check', card.x + 16 + half / 2 - 40, card.y + 111, 16, IA.white)
    tx(context, tr('Odbierz', 'Accept'), card.x + 16 + half / 2 - 18, card.y + 124, { size: 14, weight: 600, color: IA.white })
    fillRound(context, card.x + 28 + half, card.y + 100, 110, 38, 12, IA.white)
    strokeRound(context, card.x + 28 + half, card.y + 100, 110, 38, 12, IA.red200)
    lucide(context, 'rotateCcw', card.x + 44 + half, card.y + 111, 15, IA.red600)
    tx(context, tr('Zwróć', 'Return'), card.x + 66 + half, card.y + 124, { size: 14, weight: 600, color: IA.red600 })
  }
}

/** Штамп-тост: «Praca odebrana · 360,00 zł». */
export const STAMP = { width: 300, height: 64 }

export function drawStamp(context: CanvasRenderingContext2D) {
  fillRound(context, 0, 0, STAMP.width, STAMP.height, 12, cardFill(IA.white))
  strokeRound(context, 0, 0, STAMP.width, STAMP.height, 12, IA.green200, 2)
  context.beginPath()
  context.arc(34, 32, 14, 0, Math.PI * 2)
  context.fillStyle = IA.toastGreen
  context.fill()
  context.strokeStyle = IA.white
  context.lineWidth = 2.6
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(27, 32)
  context.lineTo(32, 37)
  context.lineTo(41, 27)
  context.stroke()
  tx(context, tr('Praca odebrana', 'Work accepted'), 60, 38, { size: 17, weight: 600, color: IA.toastText })
  tx(context, '360,00 zł', STAMP.width - 18, 38, { size: 17, weight: 700, color: IA.green700, align: 'right' })
}

/* ── Станция 14: телефон Яна — «Zadania» (WorkerTasks, сайт) ─────────── */

/** Кнопка задания на экране телефона, pt. */
export const WORKER_TASK_BUTTON = { x: 36, y: 318, width: 321, height: 42 }

export function drawWorkerTasks(context: CanvasRenderingContext2D, status: TaskFormState['status'] | 'none') {
  workerPage(context, '13:08', 'tasks', (ctx) => {
    ctx.fillStyle = IA.white
    ctx.fillRect(0, 118, 393, 62)
    ctx.fillStyle = IA.gray100
    ctx.fillRect(0, 179, 393, 1)
    tx(ctx, tr('Zadania', 'Tasks'), 20, 156, { size: 18, weight: 700, color: IA.gray900 })
    let y = 196
    if (status === 'ACCEPTED') {
      webCard(ctx, 20, y, 353, 72, 12, IA.green50, IA.green200)
      fillRound(ctx, 36, y + 16, 40, 40, 12, IA.green100)
      lucide(ctx, 'gift', 47, y + 27, 18, IA.green600)
      tx(ctx, tr('Zarobione premie', 'Bonuses earned'), 88, y + 32, { size: 12, color: IA.gray500 })
      tx(ctx, '360,00 zł', 88, y + 56, { size: 20, weight: 700, color: IA.gray900 })
      y += 88
    }
    if (status === 'none') {
      lucide(ctx, 'clipboard', 176, 330, 40, IA.gray400, 1.6)
      tx(ctx, tr('Brak zadań', 'No tasks yet'), 196.5, 396, { size: 14, color: IA.gray400, align: 'center' })
      return
    }
    const height = status === 'ACCEPTED' ? 112 : status === 'COMPLETED' ? 150 : 176
    webCard(ctx, 20, y, 353, height)
    tx(ctx, taskTitle(), 36, y + 30, { size: 14, weight: 600, color: IA.gray900 })
    tx(ctx, SITE.name, 36, y + 48, { size: 12, color: IA.gray500 })
    const [pl, en, fill, color] = TASK_STATUS[status]
    const label = tr(pl, en)
    const labelWidth = measure(ctx, label, { size: 10, weight: 600, color }) + 16
    badge(ctx, label, 357 - labelWidth, y + 16, fill, color, 10, 600, 8, 22)
    tx(ctx, tr('Posadzka po nocnej zmianie, bez regałów.', 'Floor after the night shift, racks excluded.'), 36, y + 74, { size: 12, color: IA.gray500 })
    lucide(ctx, 'gift', 36, y + 90, 14, status === 'ACCEPTED' ? IA.green600 : IA.gray400)
    if (status === 'ACCEPTED') {
      tx(ctx, '360,00 zł', 58, y + 102, { size: 14, weight: 600, color: IA.green700 })
      tx(ctx, ' · 30 m²', 58 + measure(ctx, '360,00 zł', { size: 14, weight: 600, color: IA.green700 }), y + 102, { size: 14, color: IA.gray500 })
      return
    }
    tx(ctx, tr('Premia: 12,00 zł / m²', 'Bonus: 12,00 zł / m²'), 58, y + 102, { size: 14, color: IA.gray600 })
    const button = WORKER_TASK_BUTTON
    /* Иконка и подпись кнопки: в польском — места из макета; английские подписи
       другой длины — их пара встаёт по центру кнопки. */
    const labelled = (icon: IconName, iconOffset: number, text: string) => {
      const center = button.x + button.width / 2
      const ink: Ink = { size: 14, weight: 600, color: IA.white, align: 'center' }
      const width = measure(ctx, text, ink)
      const iconX = english() ? center - (16 + 8 + width) / 2 : center + iconOffset
      lucide(ctx, icon, iconX, button.y + 13, 16, IA.white)
      tx(ctx, text, english() ? iconX + 24 + width / 2 : center + 10, button.y + 26, ink)
    }
    if (status === 'PENDING') {
      fillRound(ctx, button.x, button.y, button.width, button.height, 12, IA.primary)
      labelled('play', -66, tr('Rozpocznij pracę', 'Start work'))
    } else if (status === 'IN_PROGRESS') {
      fillRound(ctx, button.x, button.y, button.width, button.height, 12, IA.green600)
      labelled('check', -70, tr('Zgłoś do odbioru', 'Submit for acceptance'))
    } else {
      lucide(ctx, 'clock', 36, y + 122, 13, IA.orange600)
      tx(ctx, tr('Czeka na odbiór', 'Waiting for acceptance'), 56, y + 133, { size: 12, color: IA.orange600 })
    }
  })
}

/* ── Станция 16: «Eksport listy płac» (PayrollExport, админ) ──────────── */

const PAYROLL_ROWS: [string, number, string, string, string, string, string][] = [
  [`${JAN.first} ${JAN.last}`, 19, '152.0', '6.5', '158.5', '31,50 zł', '5095,13 zł'],
  ['Olena Kovalenko', 20, '160.0', '4.0', '164.0', '29,00 zł', '4814,00 zł'],
  ['Piotr Nowak', 18, '144.0', '0.0', '144.0', '30,00 zł', '4320,00 zł'],
  ['Dmytro Bondarenko', 21, '168.0', '12.0', '180.0', '29,00 zł', '5394,00 zł'],
  ['Aleksandra Wójcik', 17, '136.0', '2.0', '138.0', '31,50 zł', '4378,50 zł'],
]

/** Кнопки и карточки итогов, px окна. */
export const PAYROLL = {
  title: { x: 280, y: 88, width: 360, height: 36 },
  thisMonth: { x: 1236, y: 196, width: 94, height: 38 },
  csv: { x: 1276, y: 92, width: 140, height: 40 },
  cards: [0, 1, 2].map((index) => ({ x: 280 + index * (368 + 16), y: 262, width: 368, height: 74 })),
}

export interface PayrollState {
  /** Выбран «Ten miesiąc»: даты заполнены. */
  range: boolean
  /** Карточки итогов на экране (иначе их рисует 3D, м-список). */
  cards: boolean
  pressed: 'none' | 'month' | 'csv'
  /** Заголовок страницы: пустой, пока не сядет прилетевшая плита. */
  title: boolean
}

export function drawPayroll(context: CanvasRenderingContext2D, state: PayrollState) {
  adminShell(context, 'Płace')
  if (state.title) tx(context, tr('Eksport listy płac', 'Payroll Export'), 280, 110, { size: 24, weight: 700, color: IA.gray900 })
  tx(context, tr('Eksportuj karty czasu pracy do systemu płacowego', 'Export timesheets for payroll processing'), 280, 132, { size: 14, color: IA.gray500 })
  const csv = PAYROLL.csv
  primaryButton(context, csv.x, csv.y, csv.width, csv.height, tr('Eksport CSV', 'Export CSV'), { icon: 'download', color: state.pressed === 'csv' ? IA.primary600 : IA.primary })
  webCard(context, 280, 160, 1136, 86)
  const fields: [string, string, number, number][] = [
    [tr('Projekt', 'Project'), SITE.name, 296, 300],
    [tr('Od', 'From'), state.range ? '01.09.2026' : '27.09.2026', 612, 300],
    [tr('Do', 'To'), state.range ? '30.09.2026' : '27.09.2026', 924, 300],
  ]
  for (const [label, value, x, width] of fields) {
    tx(context, label, x, 190, { size: 12, weight: 500, color: IA.gray500 })
    input(context, x, 196, width, 38, value, '')
  }
  lucide(context, 'chevronDown', 568, 208, 14, IA.gray400)
  const month = PAYROLL.thisMonth
  secondaryButton(context, month.x, month.y, month.width, month.height, tr('Ten miesiąc', 'This Month'), { size: 12, fill: state.pressed === 'month' ? IA.gray100 : IA.white })
  secondaryButton(context, month.x + month.width + 4, month.y, 118 - 36, month.height, tr('Poprzedni', 'Last Month'), { size: 12 })
  if (state.cards) drawPayrollCards(context)
  /* Таблица: колонка «Pracownik» (в коде исправлено с «pracowników»). */
  const table = { x: 280, y: 354, width: 1136 }
  webCard(context, table.x, table.y, table.width, 48 + 40 + PAYROLL_ROWS.length * 46 + 46)
  tx(context, tr('Szczegóły kart czasu pracy', 'Timesheet Details'), table.x + 16, table.y + 30, { size: 16, weight: 600, color: IA.gray900 })
  tx(context, tr(`${PAYROLL_ROWS.length} pracowników`, `${PAYROLL_ROWS.length} workers`), table.x + table.width - 16, table.y + 30, { size: 12, color: IA.gray400, align: 'right' })
  context.fillStyle = IA.gray50
  context.fillRect(table.x + 1, table.y + 48, table.width - 2, 40)
  const cols = [table.x + 16, table.x + 300, table.x + 440, table.x + 590, table.x + 760, table.x + 900, table.x + table.width - 16]
  ;[
    tr('Pracownik', 'Worker'),
    tr('Dni robocze', 'Days Worked'),
    tr('Regularne (godz.)', 'Regular (h)'),
    tr('Nadgodziny (godz.)', 'Overtime (h)'),
    tr('Razem (godz.)', 'Total (h)'),
    tr('Stawka', 'Rate'),
    tr('Wynagrodzenie', 'Pay'),
  ].forEach((label, index) =>
    tx(context, label, cols[index]!, table.y + 73, { size: 12, weight: 500, color: IA.gray500, align: index === 6 ? 'right' : 'left' }),
  )
  PAYROLL_ROWS.forEach((row, index) => {
    const y = table.y + 88 + index * 46
    context.fillStyle = IA.gray50
    context.fillRect(table.x + 1, y, table.width - 2, 1)
    const [name, days, regular, over, total, rate, pay] = row
    tx(context, name, cols[0]!, y + 29, { size: 14, weight: 500, color: IA.gray900 })
    tx(context, String(days), cols[1]!, y + 29, { size: 14, color: IA.gray600 })
    tx(context, regular, cols[2]!, y + 29, { size: 14, color: IA.gray600 })
    tx(context, over, cols[3]!, y + 29, { size: 14, weight: over === '0.0' ? 400 : 500, color: over === '0.0' ? IA.gray400 : IA.orange600 })
    tx(context, total, cols[4]!, y + 29, { size: 14, weight: 700, color: IA.gray900 })
    tx(context, rate, cols[5]!, y + 29, { size: 14, color: IA.gray600 })
    tx(context, pay, cols[6]!, y + 29, { size: 14, weight: 700, color: IA.gray900, align: 'right' })
  })
}

/** Итоги: иконка, фон, цвет, сумма, подпись польская и английская (payroll.*). */
const PAYROLL_CARDS: [IconName, string, string, string, string, string][] = [
  ['clock', IA.blue100, IA.blue600, '760.0h', 'Godziny regularne', 'Regular Hours'],
  ['trendingUp', IA.orange100, IA.orange600, '24.5h', 'Godziny nadliczbowe', 'Overtime Hours'],
  ['dollar', IA.green100, IA.green600, '24 001,63 zł', 'Razem do wypłaty', 'Total pay'],
]

export function drawPayrollCard(context: CanvasRenderingContext2D, index: number, x = 0, y = 0) {
  const [icon, fill, color, value, label, en] = PAYROLL_CARDS[index] ?? PAYROLL_CARDS[0]!
  webCard(context, x, y, 368, 74)
  fillRound(context, x + 16, y + 17, 40, 40, 12, fill)
  lucide(context, icon, x + 27, y + 28, 18, color)
  tx(context, value, x + 68, y + 36, { size: 20, weight: 700, color: IA.gray900 })
  tx(context, tr(label, en), x + 68, y + 56, { size: 12, color: IA.gray500 })
}

function drawPayrollCards(context: CanvasRenderingContext2D) {
  PAYROLL.cards.forEach((card, index) => drawPayrollCard(context, index, card.x, card.y))
}

/** Карточка файла .csv с настоящими заголовками выгрузки (routes/payroll.ts). */
export const CSV_CARD = { width: 560, height: 360 }
export const CSV_COLUMNS = ['Worker ID', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Overtime', 'Pay (PLN)']

/** filled — сколько пустых строк уже влетело (без цифр). */
export function drawCsvCard(context: CanvasRenderingContext2D, filled: number) {
  const { width, height } = CSV_CARD
  fillRound(context, 0, 0, width, height, 18, cardFill(IA.white))
  fillRound(context, 20, 20, 44, 52, 8, IA.green600)
  tx(context, 'CSV', 42, 52, { size: 13, weight: 800, color: IA.white, align: 'center' })
  tx(context, 'payroll_20260901_20260930.csv', 78, 42, { size: 16, weight: 600, color: IA.gray900 })
  tx(context, 'Hub Wrocław — Fulfillment · 01.09–30.09.2026', 78, 64, { size: 12, color: IA.gray500 })
  context.fillStyle = IA.gray100
  context.fillRect(20, 88, width - 40, 1)
  const colWidth = (width - 40) / CSV_COLUMNS.length
  CSV_COLUMNS.forEach((label, index) => tx(context, label, 20 + index * colWidth + 4, 112, { size: 10.5, weight: 700, color: IA.gray700, max: colWidth - 6 }))
  context.fillStyle = IA.gray200
  context.fillRect(20, 122, width - 40, 1)
  for (let row = 0; row < 11; row++) {
    const y = 134 + row * 20
    const on = row < filled
    CSV_COLUMNS.forEach((_, index) => {
      fillRound(context, 20 + index * colWidth + 4, y, colWidth * (0.55 + ((row * 7 + index * 3) % 5) * 0.07), 8, 4, on ? (index === 5 ? 'rgba(249, 115, 22, 0.35)' : 'rgba(58, 48, 134, 0.18)') : IA.gray100)
    })
  }
}

/* ── Станция 17: «Wiadomości» → «Zgłoś nieobecność» (WorkerChat, AbsenceForm) ─ */

/** Карточка «Zgłoś nieobecność» на экране сообщений, pt. */
export const ABSENCE_CARD = { x: 20, y: 196, width: 353, height: 72 }

export function drawMessages(context: CanvasRenderingContext2D) {
  workerPage(context, '18:15', 'chat', (ctx) => {
    ctx.fillStyle = IA.white
    ctx.fillRect(0, 118, 393, 62)
    ctx.fillStyle = IA.gray100
    ctx.fillRect(0, 179, 393, 1)
    tx(ctx, tr('Wiadomości', 'Messages'), 20, 156, { size: 18, weight: 700, color: IA.gray900 })
    const card = ABSENCE_CARD
    webCard(ctx, card.x, card.y, card.width, card.height, 12, '#f5f4fb', 'rgba(58, 48, 134, 0.2)')
    ctx.beginPath()
    ctx.arc(card.x + 36, card.y + 36, 20, 0, Math.PI * 2)
    ctx.fillStyle = IA.primary10
    ctx.fill()
    lucide(ctx, 'send', card.x + 27, card.y + 27, 18, IA.primary)
    tx(ctx, tr('Zgłoś nieobecność', 'Report Absence'), card.x + 68, card.y + 32, { size: 14, weight: 600, color: IA.gray900 })
    tx(ctx, tr('Wyślij wiadomość szablonową lub własną', 'Send predefined or custom message'), card.x + 68, card.y + 51, { size: 12, color: IA.gray500, max: 270 })
    const rows: [string, string, string, string, number][] = [
      [MARTA.initials, MARTA.name, tr('Dziękuję, do jutra!', 'Thanks, see you tomorrow!'), '17:52', 0],
      ['EK', 'Ewa Kamińska', tr('Grafik na październik jest już w aplikacji.', 'The October schedule is now in the app.'), '15:10', 1],
    ]
    rows.forEach(([short, name, last, time, unread], index) => {
      const y = 280 + index * 76
      webCard(ctx, 20, y, 353, 68)
      initials(ctx, short, 32, y + 12, 44, IA.primary10, IA.primary)
      tx(ctx, name, 88, y + 30, { size: 14, weight: 600, color: IA.gray900 })
      tx(ctx, time, 361, y + 30, { size: 12, color: IA.gray400, align: 'right' })
      tx(ctx, last, 88, y + 51, { size: 14, color: IA.gray500, max: unread ? 240 : 265 })
      if (unread) {
        ctx.beginPath()
        ctx.arc(351, y + 46, 10, 0, Math.PI * 2)
        ctx.fillStyle = IA.primary
        ctx.fill()
        tx(ctx, String(unread), 351, y + 50, { size: 10, weight: 600, color: IA.white, align: 'center' })
      }
    })
  })
}

/** Три причины отсутствия — отдельно: список выходит плиткой. */
export const ABSENCE_OPTIONS = { x: 20, y: 212, width: 353, height: 268 }

export function drawAbsenceOptions(context: CanvasRenderingContext2D, selected: boolean) {
  const reasons: [IconName, string, string][] = [
    ['bus', tr('Problem z transportem', 'Transport problem'), tr('Nie mogę dotrzeć na miejsce pracy', 'I cannot get to the workplace')],
    ['user', tr('Sprawy osobiste', 'Personal matters'), tr('Powody osobiste uniemożliwiają mi przyjście', 'Personal reasons prevent me from coming')],
    ['penLine', tr('Inne (wpisz)', 'Other (type in)'), tr('Inny powód — opisz poniżej', 'Another reason — describe below')],
  ]
  reasons.forEach(([icon, label, hint], index) => {
    const y = index * 92
    const on = selected && index === 0
    fillRound(context, 0, y, ABSENCE_OPTIONS.width, 80, 16, cardFill(on ? '#f5f4fb' : IA.white))
    strokeRound(context, 0, y, ABSENCE_OPTIONS.width, 80, 16, on ? IA.primary : IA.gray200, 2)
    context.beginPath()
    context.arc(38, y + 38, 22, 0, Math.PI * 2)
    context.fillStyle = on ? IA.primary15 : IA.gray100
    context.fill()
    lucide(context, icon, 28, y + 28, 20, on ? IA.primary : IA.gray500)
    tx(context, label, 76, y + 34, { size: 14, weight: 600, color: on ? IA.primary : IA.gray900 })
    tx(context, hint, 76, y + 54, { size: 12, color: IA.gray500, max: 260 })
  })
}

export type AbsenceStage = 'form' | 'selected' | 'sending' | 'done'
/** Кнопка «Wyślij zgłoszenie», pt. */
export const ABSENCE_SEND = { x: 20, y: 496, width: 353, height: 52 }

export function drawAbsence(context: CanvasRenderingContext2D, stage: AbsenceStage, options = true) {
  workerPage(context, '18:16', 'chat', (ctx) => {
    if (stage === 'done') {
      ctx.fillStyle = IA.gray50
      ctx.fillRect(0, 118, 393, 588)
      ctx.beginPath()
      ctx.arc(196.5, 330, 32, 0, Math.PI * 2)
      ctx.fillStyle = IA.green100
      ctx.fill()
      lucide(ctx, 'checkCircle', 180.5, 314, 32, IA.green600)
      tx(ctx, tr('Nieobecność zgłoszona', 'Absence reported'), 196.5, 400, { size: 20, weight: 700, color: IA.gray900, align: 'center' })
      tx(ctx, tr('Twój koordynator został powiadomiony', 'Your coordinator has been notified'), 196.5, 426, { size: 14, color: IA.gray500, align: 'center' })
      fillRound(ctx, 102, 460, 189, 46, 12, IA.primary)
      tx(ctx, tr('Wróć do wiadomości', 'Back to messages'), 196.5, 488, { size: 14, weight: 600, color: IA.white, align: 'center' })
      return
    }
    ctx.fillStyle = IA.white
    ctx.fillRect(0, 118, 393, 62)
    ctx.fillStyle = IA.gray100
    ctx.fillRect(0, 179, 393, 1)
    lucide(ctx, 'arrowLeft', 20, 139, 20, IA.gray600)
    tx(ctx, tr('Zgłoś nieobecność', 'Report Absence'), 52, 156, { size: 18, weight: 700, color: IA.gray900 })
    tx(ctx, tr('Wybierz powód nieobecności:', 'Select the reason for your absence:'), 20, 204, { size: 14, color: IA.gray500 })
    if (options) {
      ctx.save()
      ctx.translate(ABSENCE_OPTIONS.x, ABSENCE_OPTIONS.y)
      drawAbsenceOptions(ctx, stage !== 'form')
      ctx.restore()
    }
    const send = ABSENCE_SEND
    const ready = stage !== 'form'
    fillRound(ctx, send.x, send.y, send.width, send.height, 16, ready ? IA.primary : IA.gray200)
    if (stage === 'sending') {
      ctx.strokeStyle = IA.white
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(196.5, send.y + 26, 10, 0.3, Math.PI * 1.6)
      ctx.stroke()
    } else {
      lucide(ctx, 'send', 128, send.y + 18, 16, ready ? IA.white : IA.gray400)
      tx(ctx, tr('Wyślij zgłoszenie', 'Send notification'), 152, send.y + 31, { size: 14, weight: 600, color: ready ? IA.white : IA.gray400 })
    }
  })
}

/* ── Станция 18: «Karta NFC» (NfcCheckInView.swift, телефон бригадира) ── */

export type NfcStage = 'ready' | 'done'

export function drawNfc(context: CanvasRenderingContext2D, stage: NfcStage) {
  context.fillStyle = IOS.bg
  context.fillRect(0, 0, 393, 852)
  iosStatus(context, '19:15', IOS.label)
  island(context)
  iosNavTitle(context, tr('Karta NFC', 'NFC card'), tr('Kod QR', 'QR code'))
  iosSegments(context, 16, 112, 361, [tr('Wejście', 'Clock in'), tr('Wyjście', 'Clock out')], 0, 13)
  iosCard(context, 16, 160, 361, 250)
  glyph(context, 'wave', 196.5, 222, 52, IOS.primaryLight, IOS.card)
  tx(context, tr('Przyłóż kartę do telefonu', 'Hold the card to the phone'), 196.5, 290, { size: 17, weight: 600, color: IOS.label, align: 'center' })
  tx(context, tr('Dla pracowników bez smartfona', 'For workers without a smartphone'), 196.5, 314, { size: 12, color: IOS.secondary, align: 'center' })
  fillRound(context, 36, 336, 321, 50, 12, IOS.primary)
  tx(context, tr('Odczytaj kartę', 'Read card'), 196.5, 367, { size: 17, weight: 600, color: '#ffffff', align: 'center' })
  if (stage === 'done') {
    iosCard(context, 16, 426, 361, 76)
    glyph(context, 'checkCircleFill', 50, 464, 30, IOS.green, IOS.card)
    tx(context, 'Siarhei Kazlou', 78, 458, { size: 17, weight: 600, color: IOS.label })
    tx(context, tr('Wejście zarejestrowane', 'Clock-in registered'), 78, 480, { size: 15, color: IOS.secondary })
  }
  iosTabBar(context, COORD_TABS, 2)
}

/** Карта NFC: белая, чип и волны (для 3D-плитки). */
export function drawNfcCard(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#fbfbfd')
  gradient.addColorStop(1, '#e8e8ef')
  round(context, 0, 0, width, height, height * 0.1)
  context.fillStyle = gradient
  context.fill()
  fillRound(context, width * 0.1, height * 0.3, width * 0.16, height * 0.26, height * 0.04, '#d4b56a')
  brandLogo(context, width * 0.1, height * 0.2, height * 0.12, IA.gray900)
  context.strokeStyle = IA.gray500
  context.lineWidth = height * 0.025
  context.lineCap = 'round'
  for (let i = 1; i <= 3; i++) {
    context.beginPath()
    context.arc(width * 0.78, height * 0.42, height * 0.06 * i, -0.8, 0.8)
    context.stroke()
  }
  tx(context, 'Siarhei Kazlou', width * 0.1, height * 0.82, { size: height * 0.09, weight: 600, color: IA.gray700 })
}

/* ── Станция 18: домашний экран с виджетом «Jesteś w pracy» (ShiftWidget) ─ */

export const WIDGET = { x: 20, y: 72, width: 353, height: 164 }

export function drawWidget(context: CanvasRenderingContext2D, elapsed: number, x = 0, y = 0) {
  /* Подложка — systemBackground (containerBackground виджета). */
  const base = lightWorld ? '#ffffff' : '#101012'
  fillRound(context, x, y, WIDGET.width, WIDGET.height, 22, cardFill(base))
  glyph(context, 'checkCircleFill', x + 26, y + 30, 13, IOS.success, base)
  tx(context, atWork(), x + 38, y + 35, { size: 13, weight: 600, color: IOS.success })
  tx(context, clockText(elapsed), x + 18, y + 84, { size: 38, weight: 700, color: IOS.primaryLight, font: MONO })
  tx(context, SITE.name, x + 18, y + 108, { size: 12, color: IOS.secondary })
  glyph(context, 'chartBar', x + 26, y + 140, 11, IOS.secondary, base)
  tx(context, tr('96 godz.', '96 h'), x + 38, y + 144, { size: 12, weight: 500, color: IOS.secondary })
}

export function drawHomeScreen(context: CanvasRenderingContext2D) {
  if (lightWorld) wallpaper(context)
  else {
    const gradient = context.createLinearGradient(0, 0, 393, 852)
    gradient.addColorStop(0, '#1d1a33')
    gradient.addColorStop(0.6, '#0e0d18')
    gradient.addColorStop(1, '#07070b')
    context.fillStyle = gradient
    context.fillRect(0, 0, 393, 852)
  }
  iosStatus(context, '19:15', '#ffffff')
  island(context)
  /* Сетка иконок: абстрактные приложения, без чужих знаков; в светлой студии —
     светлые матовые плашки на фиолетовых обоях. */
  const colors = lightWorld
    ? ['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.26)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.22)']
    : ['#2c2c34', '#33313f', '#2a2f3a', '#3a2f36', '#2f3a33', '#35323d', '#2b3040', '#3b3530']
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 28 + col * 92
      const y = 268 + row * 100
      fillRound(context, x, y, 62, 62, 15, colors[(row * 4 + col) % colors.length]!)
      fillRound(context, x + 18, y + 72, 26, 5, 2.5, 'rgba(255,255,255,0.22)')
    }
  }
  fillRound(context, 16, 736, 361, 88, 30, lightWorld ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)')
  for (let col = 0; col < 4; col++) fillRound(context, 34 + col * 88, 749, 62, 62, 15, colors[(col + 3) % colors.length]!)
  homeIndicator(context, '#ffffff')
}

/* ── Станция 20: три карточки функций (О4) ────────────────────────────── */

export const FEATURE = { width: 460, height: 520 }

export function drawFeatureCard(context: CanvasRenderingContext2D, number: string, title: string, text: string, icon: 'server' | 'qrpin' | 'guide') {
  const { width, height } = FEATURE
  /* Наша карточка, не экран продукта: в светлой студии — белое матовое стекло с
     тёмным текстом, акцент — номер и иконка. */
  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, cardFill(lightWorld ? '#ffffff' : '#17161f'))
  gradient.addColorStop(1, cardFill(lightWorld ? '#f6f6fa' : '#101014'))
  round(context, 0, 0, width, height, 34)
  context.fillStyle = gradient
  context.fill()
  strokeRound(context, 0, 0, width, height, 34, lightWorld ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.14)', 2)
  tx(context, number, 40, 84, { size: 40, weight: 800, color: lightWorld ? IA.primary400 : IOS.primaryLight, tracking: -1 })
  /* Иконка контуром. */
  context.save()
  context.translate(width - 40 - 96, 36)
  context.strokeStyle = lightWorld ? IA.primary400 : '#d9d4ff'
  context.lineWidth = 5
  context.lineCap = 'round'
  context.lineJoin = 'round'
  if (icon === 'server') {
    for (let i = 0; i < 3; i++) {
      round(context, 6, 6 + i * 30, 84, 24, 8)
      context.stroke()
      context.beginPath()
      context.arc(24, 18 + i * 30, 3, 0, Math.PI * 2)
      context.stroke()
    }
  } else if (icon === 'qrpin') {
    for (const [qx, qy] of [[6, 6], [46, 6], [6, 46]] as [number, number][]) {
      round(context, qx, qy, 30, 30, 6)
      context.stroke()
    }
    context.beginPath()
    context.moveTo(70, 94)
    context.bezierCurveTo(52, 74, 52, 56, 70, 52)
    context.bezierCurveTo(88, 56, 88, 74, 70, 94)
    context.stroke()
    context.beginPath()
    context.arc(70, 66, 6, 0, Math.PI * 2)
    context.stroke()
  } else {
    context.beginPath()
    context.arc(34, 30, 16, 0, Math.PI * 2)
    context.stroke()
    context.beginPath()
    context.moveTo(8, 90)
    context.bezierCurveTo(8, 62, 60, 62, 60, 90)
    context.stroke()
    context.beginPath()
    context.moveTo(62, 50)
    context.lineTo(74, 62)
    context.lineTo(94, 38)
    context.stroke()
  }
  context.restore()
  wrapTx(context, title, 40, 250, width - 80, 50, { size: 42, weight: 800, color: lightWorld ? '#0d0d0d' : '#f4f3fb', tracking: -1 })
  wrapTx(context, text, 40, 410, width - 80, 34, { size: 26, weight: 500, color: lightWorld ? '#5f5f66' : 'rgba(235, 235, 245, 0.62)' })
}

/* ── Станция 22: знак и адрес ─────────────────────────────────────────── */

export const SIGN = { width: 900, height: 420 }

export function drawSign(context: CanvasRenderingContext2D) {
  /* «i» — фиолетовая. На тёмном фоне мира #3A3086 из шапки продукта теряется —
     там светлая пара #6F5EB8; в светлой студии знак тёмный, «i» — #3A3086, как
     в BrandLogo продукта. */
  brandLogo(context, 0, 170, 170, lightWorld ? '#0d0d0d' : '#ffffff', 'left', lightWorld ? IA.primary : IA.primary400)
  tx(context, 'Ewidencja czasu pracy bez przepisywania', 6, 262, { size: 40, weight: 500, color: lightWorld ? '#5f5f66' : 'rgba(235, 235, 245, 0.72)' })
  tx(context, 'iapply.com.pl', 6, 352, { size: 60, weight: 700, color: lightWorld ? '#0d0d0d' : '#ffffff', tracking: -1 })
}

export const CTA = { width: 520, height: 120 }

export function drawCta(context: CanvasRenderingContext2D) {
  const gradient = context.createLinearGradient(0, 0, CTA.width, CTA.height)
  gradient.addColorStop(0, '#4a3fa3')
  gradient.addColorStop(1, IA.primary)
  round(context, 0, 0, CTA.width, CTA.height, 28)
  context.fillStyle = gradient
  context.fill()
  tx(context, 'Umów rozmowę', CTA.width / 2, 76, { size: 48, weight: 700, color: '#ffffff', align: 'center', tracking: -0.5 })
}
