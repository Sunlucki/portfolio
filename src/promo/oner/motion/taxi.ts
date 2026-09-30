import type { CanvasTexture } from 'three'
import { paint, statusBar, tr } from './paint'

/* Двойники экранов TAXI BOSS для моушн-слоя (06-MOTION, §6; сценарий
   storyboard/v3/04-TAXI.md). Цвета — токены тёмной темы продукта
   (~/Developer/TAXI-BOSS/src/index.css; у iOS-приложения водителя те же, в
   ios/Shared/Core/Design/Tokens.swift), надписи — польский словарь продукта
   (src/lib/i18n.ts, ios/Driver/Resources/Localizable.xcstrings), раскладка — по
   компонентам: лендинг и калькулятор (HeroSection, EarningsCalculatorNew),
   регистрация и кабинет водителя (Register, Dashboard, Documents, TelegramSync,
   PasskeyManager), панель владельца (components/admin/*, NotificationBell),
   приложение водителя (ios/Driver/Features/*), договор
   (backend/src/services/contract.service.ts), утреннее уведомление
   (backend/src/services/cron.service.ts). Иконки — пути Lucide 0.462, как в
   продукте; символы SF в приложении водителя заменены ближайшими Lucide.

   Телефон — в точках iOS (393 × 852), компьютер — в пикселях CSS; холст
   масштабирует сам. Люди и номера вымышленные, машины — из демо-парка продукта
   (backend/prisma/seed.ts). Цифры в интерфейсе — часть экрана: их не накручиваем
   (правило владельца). */

/* ── Токены ───────────────────────────────────────────────────────────── */

export const TB = {
  bg: '#080A0C',
  card: '#101318',
  popover: '#0C0E12',
  secondary: '#181D25',
  muted: '#21242C',
  border: '#252B37',
  input: '#1F242E',
  text: '#FAFAFA',
  dim: '#8F96A3',
  gold: '#FFBF00',
  goldEnd: '#E68600',
  accent: '#FFC61A',
  blue4: '#60A5FA',
  blue5: '#3B82F6',
  sky5: '#0EA5E9',
  green4: '#4ADE80',
  green5: '#22C55E',
  purple4: '#C084FC',
  purple5: '#A855F7',
  orange4: '#FB923C',
  orange5: '#F97316',
  yellow4: '#FACC15',
  yellow5: '#EAB308',
  red4: '#F87171',
  red5: '#EF4444',
  gray4: '#9CA3AF',
  gray5: '#6B7280',
  emerald4: '#34D399',
  /* iOS: Tokens.swift */
  iosAmber: '#FABF24',
  iosRed: '#F77070',
  iosInfo: '#61A6FA',
}

/** Герой ролика и его данные — вымышленные; машина — Toyota Corolla из демо-парка. */
export const HERO = {
  name: 'Oleksandr Bondar',
  first: 'Oleksandr',
  initials: 'OB',
  phone: '+48 512 345 678',
  email: 'o.bondar@mail.pl',
  telegram: '@oleksandr_b',
  car: 'Toyota Corolla',
  year: '2023',
  plate: 'WA 67890',
  rent: '850',
  contract: 'RNT-20260928-K7QZ',
  date: '28.09.2026',
  reason: 'skan jest nieczytelny, prześlij całą stronę w kolorze',
  /* Английская версия 2D-ролика: та же причина по подсказке продукта
     (applications.rejectDoc.reasonPlaceholder, en). */
  reasonEn: 'the scan is illegible, please upload the full page in colour',
}

/** Английская ли сейчас надпись двойника (setPaintLang 2D-ролика). */
const english = () => tr('pl', 'en') === 'en'

/* ── Рисование ────────────────────────────────────────────────────────── */

const FAMILY = {
  inter: '"Inter Variable", Inter, system-ui, sans-serif',
  /* Приложение водителя — системный шрифт iOS. */
  sf: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Inter Variable", sans-serif',
  mono: '"SF Mono", ui-monospace, Menlo, monospace',
}

export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export interface Style {
  size: number
  weight?: number
  color: string | CanvasGradient
  align?: CanvasTextAlign
  font?: keyof typeof FAMILY
  tracking?: number
  upper?: boolean
}

function setFont(ctx: CanvasRenderingContext2D, s: Omit<Style, 'color'>) {
  ctx.font = `${s.weight ?? 500} ${s.size}px ${FAMILY[s.font ?? 'inter']}`
  ctx.letterSpacing = `${s.tracking ?? 0}px`
}

export function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, s: Style): number {
  setFont(ctx, s)
  ctx.fillStyle = s.color
  ctx.textAlign = s.align ?? 'left'
  ctx.textBaseline = 'alphabetic'
  const shown = s.upper ? value.toUpperCase() : value
  ctx.fillText(shown, x, y)
  const width = ctx.measureText(shown).width
  ctx.letterSpacing = '0px'
  return width
}

export function measure(ctx: CanvasRenderingContext2D, value: string, s: Omit<Style, 'color'>): number {
  setFont(ctx, s)
  const width = ctx.measureText(s.upper ? value.toUpperCase() : value).width
  ctx.letterSpacing = '0px'
  return width
}

function wrap(ctx: CanvasRenderingContext2D, value: string, max: number, s: Omit<Style, 'color'>): string[] {
  const out: string[] = []
  let line = ''
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(ctx, next, s) > max) {
      out.push(line)
      line = word
    } else line = next
  }
  if (line) out.push(line)
  return out
}

/** Абзац с переносом по словам; возвращает число строк. */
export function para(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, max: number, lineHeight: number, s: Style): number {
  const lines = wrap(ctx, value, max, s)
  lines.forEach((line, i) => text(ctx, line, x, y + i * lineHeight, s))
  return lines.length
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)))
}

export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string | CanvasGradient | null,
  stroke?: string | null,
  lineWidth = 1,
) {
  rr(ctx, x, y, w, h, r)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

/** Масштаб холста: тень и размытие холст меряет в своих пикселях. */
function pixel(ctx: CanvasRenderingContext2D): number {
  return ctx.getTransform().a
}

/** Золото продукта: linear-gradient(135deg, #FFBF00, #E68600). */
function goldFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, TB.gold)
  g.addColorStop(1, TB.goldEnd)
  return g
}

/** .metallic-text продукта: золото с бликами и мягкий золотой ореол. */
export function metallic(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, s: Omit<Style, 'color'>) {
  const w = measure(ctx, value, s)
  const left = s.align === 'center' ? x - w / 2 : s.align === 'right' ? x - w : x
  const g = ctx.createLinearGradient(left, y - s.size, left + w, y + s.size * 0.4)
  g.addColorStop(0, '#FFD966')
  g.addColorStop(0.25, TB.gold)
  g.addColorStop(0.5, TB.goldEnd)
  g.addColorStop(0.75, TB.accent)
  g.addColorStop(1, '#FFD966')
  ctx.save()
  ctx.shadowColor = 'rgba(255, 191, 0, 0.3)'
  ctx.shadowBlur = 10 * pixel(ctx)
  ctx.shadowOffsetY = 2 * pixel(ctx)
  text(ctx, value, x, y, { ...s, color: g })
  ctx.restore()
}

/** Золото надписи в мире: в тёмной студии — .metallic-text продукта, в светлой —
    то же металлическое золото на тон глубже и без ореола, иначе светлые блики
    градиента сливаются с белым фоном. */
export function worldGold(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, s: Omit<Style, 'color'>) {
  if (worldTheme !== 'light') {
    metallic(ctx, value, x, y, s)
    return
  }
  const w = measure(ctx, value, s)
  const left = s.align === 'center' ? x - w / 2 : s.align === 'right' ? x - w : x
  const g = ctx.createLinearGradient(left, y - s.size, left + w, y + s.size * 0.4)
  g.addColorStop(0, '#E9AE12')
  g.addColorStop(0.3, '#D99500')
  g.addColorStop(0.55, '#B97200')
  g.addColorStop(0.8, '#D99A0A')
  g.addColorStop(1, '#C98400')
  text(ctx, value, x, y, { ...s, color: g })
}

/* Иконки Lucide 0.462 (ISC) — те же, что в продукте. Путь SVG в сетке 24 × 24,
   элементы через «|»: у каждого своя Path2D, иначе относительные «m» съедут. */
const ICON: Record<string, string> = {
  'clock': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|M12 6L12 12L16 14',
  'calendar': 'M8 2v4|M16 2v4|M5 4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4Z|M3 10h18',
  'user': 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2|M8 7A4 4 0 1 0 16 7A4 4 0 1 0 8 7Z',
  'phone': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  'trending-up': 'M22 7L13.5 15.5L8.5 10.5L2 17|M16 7L22 7L22 13',
  'sparkles': 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z|M20 3v4|M22 5h-4|M4 17v2|M5 18H3',
  'zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-down': 'm6 9 6 6 6-6',
  'check': 'M20 6 9 17l-5-5',
  'log-in': 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4|M10 17L15 12L10 7|M15 12L3 12',
  'menu': 'M4 12L20 12|M4 6L20 6|M4 18L20 18',
  'globe': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20|M2 12h20',
  'lock': 'M5 11H19A2 2 0 0 1 21 13V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V13A2 2 0 0 1 5 11Z|M7 11V7a5 5 0 0 1 10 0v4',
  'briefcase': 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16|M4 6H20A2 2 0 0 1 22 8V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V8A2 2 0 0 1 4 6Z',
  'car': 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2|M5 17A2 2 0 1 0 9 17A2 2 0 1 0 5 17Z|M9 17h6|M15 17A2 2 0 1 0 19 17A2 2 0 1 0 15 17Z',
  'handshake': 'm11 17 2 2a1 1 0 1 0 3-3|m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4|m21 3 1 11h-2|M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3|M3 4h8',
  'mail': 'M4 4H20A2 2 0 0 1 22 6V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4Z|m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7',
  'send': 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z|m21.854 2.147-10.94 10.939',
  'circle-check-big': 'M21.801 10A10 10 0 1 1 17 3.335|m9 11 3 3L22 4',
  'arrow-left': 'm12 19-7-7 7-7|M19 12H5',
  'message-circle': 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
  'circle-alert': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|M12 8L12 12|M12 16L12.01 16',
  'key-round': 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z|M16 7.5A0.5 0.5 0 1 0 17 7.5A0.5 0.5 0 1 0 16 7.5Z',
  'shield-check': 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z|m9 12 2 2 4-4',
  'bell': 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.94 1.94 0 0 0 3.4 0',
  'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17L21 12L16 7|M21 12L9 12',
  'dollar-sign': 'M12 2L12 22|M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  'triangle-alert': 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3|M12 9v4|M12 17h.01',
  'brain': 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z|M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z|M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4|M17.599 6.5a3 3 0 0 0 .399-1.375|M6.003 5.125A3 3 0 0 0 6.401 6.5|M3.477 10.896a4 4 0 0 1 .585-.396|M19.938 10.5a4 4 0 0 1 .585.396|M6 18a4 4 0 0 1-1.967-.516|M19.967 17.484A4 4 0 0 1 18 18',
  'heart': 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  'shield': 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  'upload': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8L12 3L7 8|M12 3L12 15',
  'camera': 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z|M9 13A3 3 0 1 0 15 13A3 3 0 1 0 9 13Z',
  'image': 'M5 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3Z|M7 9A2 2 0 1 0 11 9A2 2 0 1 0 7 9Z|m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  'file-text': 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z|M14 2v4a2 2 0 0 0 2 2h4|M10 9H8|M16 13H8|M16 17H8',
  'x': 'M18 6 6 18|m6 6 12 12',
  'loader-circle': 'M21 12a9 9 0 1 1-6.219-8.56',
  'chart-column': 'M3 3v16a2 2 0 0 0 2 2h16|M18 17V9|M13 17V5|M8 17v-3',
  'clipboard-list': 'M9 2H15A1 1 0 0 1 16 3V5A1 1 0 0 1 15 6H9A1 1 0 0 1 8 5V3A1 1 0 0 1 9 2Z|M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M12 11h4|M12 16h4|M8 11h.01|M8 16h.01',
  'users': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M5 7A4 4 0 1 0 13 7A4 4 0 1 0 5 7Z|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  'settings': 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z|M9 12A3 3 0 1 0 15 12A3 3 0 1 0 9 12Z',
  'refresh-cw': 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8|M21 3v5h-5|M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16|M8 16H3v5',
  'house': 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8|M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'user-plus': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M5 7A4 4 0 1 0 13 7A4 4 0 1 0 5 7Z|M19 8L19 14|M22 11L16 11',
  'megaphone': 'm3 11 18-5v12L3 14v-3z|M11.6 16.8a3 3 0 1 1-5.8-1.6',
  'search': 'M3 11A8 8 0 1 0 19 11A8 8 0 1 0 3 11Z|m21 21-4.3-4.3',
  'calculator': 'M6 2H18A2 2 0 0 1 20 4V20A2 2 0 0 1 18 22H6A2 2 0 0 1 4 20V4A2 2 0 0 1 6 2Z|M8 6L16 6|M16 14L16 18|M16 10h.01|M12 10h.01|M8 10h.01|M12 14h.01|M8 14h.01|M12 18h.01|M8 18h.01',
  'eye': 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0|M9 12A3 3 0 1 0 15 12A3 3 0 1 0 9 12Z',
  'check-check': 'M18 6 7 17l-5-5|m22 10-7.5 7.5L13 16',
  'info': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|M12 16v-4|M12 8h.01',
  'circle-x': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|m15 9-6 6|m9 9 6 6',
  'link-2': 'M9 17H7A5 5 0 0 1 7 7h2|M15 7h2a5 5 0 1 1 0 10h-2|M8 12L16 12',
  'unlink': 'm18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71|m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71|M8 2L8 5|M2 8L5 8|M16 19L16 22|M19 16L22 16',
  'wrench': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  'plus': 'M5 12h14|M12 5v14',
  'fuel': 'M3 22L15 22|M4 9L14 9|M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18|M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5',
  'settings-2': 'M20 7h-9|M14 17H5|M14 17A3 3 0 1 0 20 17A3 3 0 1 0 14 17Z|M4 7A3 3 0 1 0 10 7A3 3 0 1 0 4 7Z',
  'star': 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  'banknote': 'M4 6H20A2 2 0 0 1 22 8V16A2 2 0 0 1 20 18H4A2 2 0 0 1 2 16V8A2 2 0 0 1 4 6Z|M10 12A2 2 0 1 0 14 12A2 2 0 1 0 10 12Z|M6 12h.01|M18 12h.01',
  'circle-check': 'M2 12A10 10 0 1 0 22 12A10 10 0 1 0 2 12Z|m9 12 2 2 4-4',
}

const PATHS = new Map<string, Path2D[]>()

export type IconName = keyof typeof ICON

/** Иконка в квадрате size с левым верхним углом (x, y); штрих 2 в сетке 24. */
export function icon(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number, color: string, lineWidth = 2) {
  let paths = PATHS.get(name)
  if (!paths) {
    paths = (ICON[name] ?? '').split('|').map((d) => new Path2D(d))
    PATHS.set(name, paths)
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 24, size / 24)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const path of paths) ctx.stroke(path)
  ctx.restore()
}

/** Пилюля статуса панели (types.ts): фон цвета/20, рамка /30, текст -400. */
export function pill(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  tone: string,
  ink: string,
  options: { size?: number; padX?: number; height?: number; border?: boolean; align?: 'left' | 'right' } = {},
): number {
  const size = options.size ?? 12
  const padX = options.padX ?? 10
  const height = options.height ?? 22
  const w = measure(ctx, label, { size, weight: 500 }) + padX * 2
  const left = options.align === 'right' ? x - w : x
  box(ctx, left, y, w, height, height / 2, rgba(tone, 0.2), options.border === false ? null : rgba(tone, 0.3))
  text(ctx, label, left + padX, y + height / 2 + size * 0.36, { size, weight: 500, color: ink })
  return w
}

/** Пилюля статуса приложения водителя (Components.swift): капсула цвета 15%, обводка 35%. */
export function iosPill(ctx: CanvasRenderingContext2D, label: string, right: number, y: number, tint: string): number {
  const w = measure(ctx, label, { size: 12, weight: 600, font: 'sf' }) + 20
  box(ctx, right - w, y, w, 22, 11, rgba(tint, 0.15), rgba(tint, 0.35))
  text(ctx, label, right - w / 2, y + 15.5, { size: 12, weight: 600, color: tint, align: 'center', font: 'sf' })
  return w
}

/** Галочка, прорисованная на долю t (м-галочка). */
export function checkStroke(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, t: number, lineWidth = 2.4) {
  if (t <= 0) return
  const path = [
    [x + size * 0.18, y + size * 0.52],
    [x + size * 0.42, y + size * 0.76],
    [x + size * 0.84, y + size * 0.28],
  ] as const
  const a = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1])
  const b = Math.hypot(path[2][0] - path[1][0], path[2][1] - path[1][1])
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([(a + b) * Math.min(1, t), a + b])
  ctx.beginPath()
  ctx.moveTo(path[0][0], path[0][1])
  ctx.lineTo(path[1][0], path[1][1])
  ctx.lineTo(path[2][0], path[2][1])
  ctx.stroke()
  ctx.restore()
}

/* Liquid Glass (владелец, 28.09): двойник на стеклянной плите пропускает
   матовое стекло — тёмные поверхности интерфейса (фон, карточки, поля)
   полупрозрачны, текст, иконки и цветные элементы остаются плотными. Цвета те
   же, что в продукте; меняется только прозрачность тёмного. Экраны настоящих
   устройств (телефон, ноутбук) остаются непрозрачными. */

/** Плотность тёмных поверхностей: плавающая панель и карточка на стекле. */
export const GLASS = { panel: 0.64, card: 0.8 }

/* v3.2, светлая студия (владелец 28.09: «для SaaS белый лучше»). Светлой темы у
   TAXI BOSS нет: в src/index.css и :root, и .dark — тёмные токены («dark-first
   theme»), у приложения водителя — те же (ios/Shared/Core/Design/Tokens.swift).
   Поэтому экраны и плиты интерфейса остаются тёмными, как у настоящего продукта, а
   светлеет только мир вокруг них. На белом стекле полупрозрачный тёмный двойник
   стал бы серым — в светлой студии двойники непрозрачны, как экран дисплея.
   Надписи в мире (главы, адрес, языки, счётчики) — тёмные, золото надписей —
   глубже продуктового: #FFBF00 на белом не читается. */
export type TaxiTheme = 'light' | 'dark'
let worldTheme: TaxiTheme = 'dark'

/** Цвета надписей в мире (не в интерфейсе продукта) под тему студии. */
export const INK = { text: TB.text, muted: TB.dim, gold: TB.gold }

/** Плотность холстов двойников: в v3.2 камера подлетает к экранам на 0,5 м, и при
    прежней плотности текст мылился. Множитель к scale каждой текстуры. */
export const DENSITY = { value: 1 }

export function setTaxiTheme(theme: TaxiTheme) {
  worldTheme = theme
  const light = theme === 'light'
  DENSITY.value = light ? 1.5 : 1
  GLASS.panel = light ? 1 : 0.64
  GLASS.card = light ? 1 : 0.8
  INK.text = light ? '#15171B' : TB.text
  INK.muted = light ? '#5F636B' : TB.dim
  INK.gold = light ? '#CF8A00' : TB.gold
}

export function taxiTheme(): TaxiTheme {
  return worldTheme
}

export function glassify(ctx: CanvasRenderingContext2D, alpha: number) {
  const { width, height } = ctx.canvas
  if (!width || !height || alpha >= 1) return
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!
    if (a === 0) continue
    const light = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!
    const t = Math.min(1, Math.max(0, (light - 48) / 44))
    const keep = alpha + (1 - alpha) * t * t * (3 - 2 * t)
    data[i + 3] = Math.round(a * keep)
  }
  ctx.putImageData(image, 0, 0)
}

/** Текстура из холста в единицах макета: scale — пикселей холста на единицу;
    glass — плотность тёмных поверхностей (двойник на стекле). */
export function canvasTexture(width: number, height: number, scale: number, draw: (ctx: CanvasRenderingContext2D) => void, glass?: number): CanvasTexture | null {
  const k = scale * DENSITY.value
  return paint(width * k, height * k, (ctx) => {
    ctx.save()
    ctx.scale(k, k)
    draw(ctx)
    ctx.restore()
    if (glass !== undefined) glassify(ctx, glass)
  })
}

/* ── Телефон: строка состояния, Safari, панель вкладок iOS ────────────── */

/** Пикселей холста на точку iOS: экран 393 × 852 → 786 × 1704. */
export const PX = 2
export const SCREEN = { width: 393, height: 852 }
/** Верх страницы сайта — под строкой состояния; низ — над адресной строкой. */
export const WEB_TOP = 54
export const WEB_BOTTOM = 800

/** Тонкая адресная строка Safari внизу (iOS 26): по ней видно, что это сайт. */
export function safariBar(ctx: CanvasRenderingContext2D, url = 'taxiboss.pl') {
  box(ctx, 14, 805, 365, 38, 19, 'rgba(34, 38, 46, 0.97)', 'rgba(255, 255, 255, 0.08)')
  icon(ctx, 'chevron-left', 26, 816, 16, TB.dim, 2.2)
  const w = measure(ctx, url, { size: 14, weight: 600 })
  const left = 196.5 - (w + 16) / 2
  icon(ctx, 'lock', left, 817.5, 11, TB.dim, 2.6)
  text(ctx, url, left + 16, 829, { size: 14, weight: 600, color: TB.text })
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(352 + i * 6, 824, 1.6, 0, Math.PI * 2)
    ctx.fillStyle = TB.dim
    ctx.fill()
  }
}

export function webChrome(ctx: CanvasRenderingContext2D, url?: string) {
  /* Страница уходит под строку состояния: над ней — фон страницы. */
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, WEB_TOP)
  statusBar(ctx, 1, TB.text)
  safariBar(ctx, url)
}

/** Вкладки приложения водителя (RootView.swift): плавающая стеклянная капсула iOS 26. */
export const TABS: [string, string, string][] = [
  ['house', 'Start', 'Home'],
  ['calendar', 'Grafik', 'Schedule'],
  ['file-text', 'Dokumenty', 'Documents'],
  ['trending-up', 'Zarobki', 'Earnings'],
  ['user', 'Profil', 'Profile'],
]
export const TAB_BAR = { x: 20, y: 772, width: 353, height: 60 }

export function tabCenter(index: number): [number, number] {
  const cell = TAB_BAR.width / TABS.length
  return [TAB_BAR.x + cell * (index + 0.5), TAB_BAR.y + TAB_BAR.height / 2]
}

export function iosTabBar(ctx: CanvasRenderingContext2D, active: number) {
  const { x, y, width, height } = TAB_BAR
  box(ctx, x, y, width, height, height / 2, 'rgba(33, 37, 45, 0.94)', 'rgba(255, 255, 255, 0.09)')
  const cell = width / TABS.length
  TABS.forEach(([name, label, en], i) => {
    const cx = x + cell * (i + 0.5)
    const on = i === active
    if (on) box(ctx, cx - cell / 2 + 3, y + 4, cell - 6, height - 8, (height - 8) / 2, 'rgba(255, 255, 255, 0.08)')
    icon(ctx, name, cx - 11, y + 10, 22, on ? TB.gold : TB.text, 2)
    text(ctx, tr(label, en), cx, y + 47, { size: 10, weight: 600, color: on ? TB.gold : TB.text, align: 'center', font: 'sf' })
  })
  box(ctx, 129, 840, 135, 5, 2.5, 'rgba(255, 255, 255, 0.85)')
}

/** Большой заголовок экрана приложения (NavigationStack, .large). */
function iosLargeTitle(ctx: CanvasRenderingContext2D, title: string) {
  text(ctx, title, 16, 134, { size: 34, weight: 700, color: TB.text, font: 'sf', tracking: 0.3 })
}

/** Карточка приложения (GlassCard): #101318, обводка #252B37, радиус 16. */
function iosCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  box(ctx, x, y, w, h, 16, TB.card, TB.border)
}

/* ── Лендинг: шапка, первый экран, калькулятор ────────────────────────── */

export interface Lang {
  code: string
  name: string
  flag: string
  title: string
  rate: string
  sub: string
  desc: string
  cta: string
  stats: [string, string, string]
  rtl?: boolean
}

/** Первый экран на семи языках сайта (i18n.ts, hero.* и hero.stats). */
export const LANGS: Lang[] = [
  {
    code: 'pl', name: 'Polski', flag: '🇵🇱', title: 'Zarabiaj Do', rate: '80 PLN/godz', sub: 'Jako Kierowca TAXI BOSS',
    desc: 'Dołącz do najszybciej rozwijającej się floty taxi w Poznaniu. Wysokie zarobki, elastyczny grafik, pełne wsparcie.',
    cta: 'Zacznij Zarabiać', stats: ['PLN/godz', 'PLN/mies.', 'Wsparcie'],
  },
  {
    code: 'en', name: 'English', flag: '🇬🇧', title: 'Earn Up To', rate: '80 PLN/hour', sub: 'As a TAXI BOSS Driver',
    desc: 'Join the fastest-growing taxi fleet in Poznań. Premium earnings, flexible schedule, full support.',
    cta: 'Start Earning', stats: ['PLN/hour', 'PLN/month', 'Support'],
  },
  {
    code: 'ru', name: 'Русский', flag: '🇷🇺', title: 'Зарабатывай До', rate: '80 PLN/час', sub: 'Как Водитель TAXI BOSS',
    desc: 'Присоединяйтесь к самому быстрорастущему таксопарку в Познани. Высокий заработок, гибкий график, полная поддержка.',
    cta: 'Начать Зарабатывать', stats: ['PLN/час', 'PLN/мес.', 'Поддержка'],
  },
  {
    code: 'uk', name: 'Українська', flag: '🇺🇦', title: 'Заробляй До', rate: '80 PLN/год', sub: 'Як Водій TAXI BOSS',
    desc: 'Приєднуйтесь до таксопарку, що найшвидше розвивається в Познані. Високий заробіток, гнучкий графік, повна підтримка.',
    cta: 'Почати Заробляти', stats: ['PLN/год', 'PLN/міс.', 'Підтримка'],
  },
  {
    code: 'ro', name: 'Română', flag: '🇲🇩', title: 'Câștigă Până La', rate: '80 PLN/oră', sub: 'Ca Șofer TAXI BOSS',
    desc: 'Alătură-te celei mai rapid crescătoare flote de taxi din Poznań.',
    cta: 'Începe să Câștigi', stats: ['PLN/oră', 'PLN/lună', 'Asistență'],
  },
  {
    code: 'ar', name: 'العربية', flag: '🇸🇦', title: 'اكسب حتى', rate: '80 PLN/ساعة', sub: 'كسائق TAXI BOSS',
    desc: 'انضم إلى أسرع أسطول تاكسي نمواً في بوزنان.', cta: 'ابدأ الربح الآن', stats: ['PLN/ساعة', 'PLN/شهر', 'الدعم'], rtl: true,
  },
  {
    code: 'ka', name: 'ქართული', flag: '🇬🇪', title: 'იშოვნე', rate: '80 PLN/საათში', sub: 'როგორც TAXI BOSS მძღოლი',
    desc: 'შემოუერთდი პოზნანის ყველაზე სწრაფად განვითარებულ ტაქსი ფლოტს.', cta: 'დაიწყე შოვნა', stats: ['PLN/საათში', 'PLN/თვეში', 'მხარდაჭერა'],
  },
]

/** Шапка сайта (Header.tsx): фиксирована; после прокрутки — стекло. */
export function landingHeader(ctx: CanvasRenderingContext2D, scrolled: boolean, lang: Lang = LANGS[0]!) {
  const top = WEB_TOP + (scrolled ? 12 : 20)
  if (scrolled) {
    const g = ctx.createLinearGradient(16, top, 377, top + 68)
    g.addColorStop(0, 'rgba(41, 48, 61, 0.82)')
    g.addColorStop(1, 'rgba(20, 24, 31, 0.82)')
    box(ctx, 16, top, 361, 68, 24, g, 'rgba(61, 71, 92, 0.3)')
  }
  const mid = top + 34
  const rtl = Boolean(lang.rtl)
  metallic(ctx, 'TAXI BOSS', rtl ? 353 : 40, mid + 8.5, { size: 23, weight: 800, tracking: -0.3, align: rtl ? 'right' : 'left' })
  /* Справа налево: язык, вход, меню; в арабском ряд зеркалится. */
  const slots: [number, number][] = rtl ? [[40, 40], [96, 40], [152, 46]] : [[313, 40], [257, 40], [195, 46]]
  const [menu, login, language] = slots as [[number, number], [number, number], [number, number]]
  box(ctx, menu[0], mid - 20, menu[1], 40, 16, 'rgba(24, 29, 37, 0.5)')
  icon(ctx, 'menu', menu[0] + 10, mid - 10, 20, TB.text)
  box(ctx, login[0], mid - 20, login[1], 40, 16, 'rgba(24, 29, 37, 0.5)')
  icon(ctx, 'log-in', login[0] + 10, mid - 10, 20, TB.dim)
  box(ctx, language[0], mid - 22, language[1], 44, 16, 'rgba(24, 29, 37, 0.5)')
  text(ctx, lang.flag, language[0] + language[1] / 2, mid + 6.5, { size: 18, color: TB.text, align: 'center' })
}

/** Фон первого экрана: золотое свечение и два пятна (HeroSection.tsx). */
function heroGlow(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 2400)
  const glow = (x: number, y: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255, 191, 0, ${a})`)
    g.addColorStop(1, 'rgba(255, 191, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  glow(196, WEB_TOP + 330 - offset, 330, 0.05)
  glow(190, WEB_TOP + 250 - offset, 210, 0.1)
  glow(167, WEB_TOP + 540 - offset, 140, 0.06)
}

/** Первый экран: заголовок, подзаголовок, описание, три цифры, кнопка. y — верх секции. */
function heroContent(ctx: CanvasRenderingContext2D, top: number, lang: Lang) {
  const c = 196.5
  text(ctx, lang.title, c, top + 115, { size: 36, weight: 700, color: TB.text, align: 'center', tracking: -0.5 })
  metallic(ctx, lang.rate, c, top + 160, { size: 36, weight: 700, align: 'center', tracking: -0.5 })
  text(ctx, lang.sub, c, top + 207, { size: 20, weight: 600, color: 'rgba(250, 250, 250, 0.8)', align: 'center' })
  para(ctx, lang.desc, c, top + 258, 345, 28, { size: 17, weight: 400, color: TB.dim, align: 'center' })
  const values = ['55-80', '10k+', '24/7']
  const widths = values.map((value, i) => Math.max(measure(ctx, value, { size: 24, weight: 700 }), measure(ctx, lang.stats[i]!, { size: 14, weight: 400 })))
  const total = widths.reduce((sum, w) => sum + w, 0) + 32 * 2
  let x = c - total / 2
  values.forEach((value, i) => {
    const w = widths[i]!
    metallic(ctx, value, x + w / 2, top + 370, { size: 24, weight: 700, align: 'center' })
    text(ctx, lang.stats[i]!, x + w / 2, top + 393, { size: 14, weight: 400, color: TB.dim, align: 'center' })
    x += w + 32
  })
  const label = lang.cta
  const lw = measure(ctx, label, { size: 16, weight: 600 })
  const bw = lw + 28 + 64
  ctx.save()
  ctx.shadowColor = 'rgba(255, 191, 0, 0.3)'
  ctx.shadowBlur = 40 * pixel(ctx)
  ctx.shadowOffsetY = 10 * pixel(ctx)
  box(ctx, c - bw / 2, top + 430, bw, 56, 12, goldFill(ctx, c - bw / 2, top + 430, bw, 56))
  ctx.restore()
  icon(ctx, 'zap', c - bw / 2 + 32, top + 448, 20, TB.bg)
  text(ctx, label, c - bw / 2 + 60, top + 463.5, { size: 16, weight: 600, color: TB.bg })
}

/* Калькулятор (EarningsCalculatorNew.tsx): карточка liquid-glass под первым
   экраном; шаги 1–2 — кнопки, 3 — контакты, 4 — расчёт, 5 — результат. */

/** Верх карточки калькулятора на странице, в точках от верха страницы. */
export const CALC_TOP = 518
/** Прокрутка страницы: калькулятор целиком (шаги 1–4) и результат. */
export const SCROLL = { calc: 200, result: 462 }

export type CalcState =
  | { step: 1; value: number }
  | { step: 2; value: number }
  | { step: 3; name: string; phone: string }
  | { step: 4 }
  | { step: 5 }

/** Кнопки выбора: верх ряда от верха карточки и левые края ячеек. */
export function calcOption(step: 1 | 2, index: number): { x: number; y: number; size: number } {
  return { x: 40 + index * 64.25, y: step === 1 ? 124 : 96, size: 56 }
}

/** Главная кнопка шага (Dalej / Kontynuuj) — от верха карточки. */
export function calcButton(step: 1 | 2 | 3): { x: number; y: number; width: number; height: number } {
  if (step === 1) return { x: 40, y: 260, width: 313, height: 56 }
  if (step === 2) return { x: 138, y: 232, width: 215, height: 56 }
  return { x: 138, y: 424, width: 215, height: 56 }
}

function liquidGlass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 32) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#161A20')
  g.addColorStop(1, '#0B0E11')
  box(ctx, x, y, w, h, r, g, 'rgba(71, 83, 107, 0.4)')
  const sheen = ctx.createLinearGradient(x, y, x + w * 0.5, y + h * 0.5)
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.07)')
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  box(ctx, x, y, w, h, r, sheen)
}

/** Шапка шага: плитка с иконкой и центрированный заголовок с подписью. */
function calcHeader(ctx: CanvasRenderingContext2D, top: number, name: string, title: string, subtitle: string): number {
  box(ctx, 40, top + 24, 48, 48, 12, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, name, 52, top + 36, 24, TB.gold)
  const lines = wrap(ctx, title, 253, { size: 18, weight: 600 })
  lines.forEach((line, i) => text(ctx, line, 226.5, top + 44 + i * 28, { size: 18, weight: 600, color: TB.text, align: 'center' }))
  const subtitleTop = top + 44 + lines.length * 28 - 6
  const subLines = para(ctx, subtitle, 226.5, subtitleTop, 253, 20, { size: 14, weight: 400, color: TB.dim, align: 'center' })
  return Math.max(48, lines.length * 28 + subLines * 20) + 24
}

function goldButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, glyph: string | null, glyphAfter = true, opacity = 1) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.shadowColor = 'rgba(255, 191, 0, 0.3)'
  ctx.shadowBlur = 30 * pixel(ctx)
  ctx.shadowOffsetY = 8 * pixel(ctx)
  box(ctx, x, y, w, h, 12, goldFill(ctx, x, y, w, h))
  ctx.restore()
  ctx.save()
  ctx.globalAlpha = opacity
  const lw = measure(ctx, label, { size: 16, weight: 600 })
  const total = lw + (glyph ? 28 : 0)
  let left = x + w / 2 - total / 2
  if (glyph && !glyphAfter) {
    icon(ctx, glyph, left, y + h / 2 - 10, 20, TB.bg)
    left += 28
  }
  text(ctx, label, left, y + h / 2 + 5.5, { size: 16, weight: 600, color: TB.bg })
  if (glyph && glyphAfter) icon(ctx, glyph, left + lw + 8, y + h / 2 - 10, 20, TB.bg)
  ctx.restore()
}

function backButton(ctx: CanvasRenderingContext2D, x: number, y: number) {
  box(ctx, x, y, 86, 56, 12, 'rgba(31, 36, 46, 0.8)', 'rgba(61, 71, 92, 0.5)')
  icon(ctx, 'chevron-left', x + 33, y + 18, 20, TB.text)
}

function progressDots(ctx: CanvasRenderingContext2D, y: number, active: number) {
  let x = 196.5 - (32 + 8 + 8 + 8 + 8) / 2
  for (let i = 0; i < 3; i++) {
    const w = i === active ? 32 : 8
    box(ctx, x, y, w, 8, 4, i === active ? TB.gold : TB.secondary)
    x += w + 8
  }
}

/** Поле формы: подпись над полем, иконка слева, текст или подсказка. */
function field(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, glyph: string, value: string, placeholder: string, options: { center?: boolean; caret?: boolean; focus?: boolean } = {}) {
  text(ctx, label, options.center ? x + w / 2 : x, y + 15, { size: 14, weight: 500, color: TB.text, align: options.center ? 'center' : 'left' })
  const top = y + 28
  box(ctx, x, top, w, 58, 12, 'rgba(24, 29, 37, 0.5)', options.focus ? TB.gold : TB.border, options.focus ? 1.5 : 1)
  if (options.focus) box(ctx, x - 2, top - 2, w + 4, 62, 14, null, 'rgba(255, 191, 0, 0.2)', 2)
  icon(ctx, glyph, x + 16, top + 19, 20, TB.dim)
  const shown = value || placeholder
  const width = text(ctx, shown, x + 48, top + 35, { size: 16, weight: 400, color: value ? TB.text : TB.dim })
  if (options.caret) box(ctx, x + 48 + (value ? width : 0) + 1.5, top + 18, 1.6, 22, 0.8, TB.gold)
}

/** Карточка калькулятора в состоянии state; top — её верх на экране. Возвращает высоту. */
export function calcCard(ctx: CanvasRenderingContext2D, top: number, state: CalcState, caret = false): number {
  const heights = { 1: 372, 2: 344, 3: 544, 4: 300, 5: 684 }
  const h = heights[state.step]
  liquidGlass(ctx, 16, top, 361, h)
  if (state.step === 1 || state.step === 2) {
    const one = state.step === 1
    calcHeader(
      ctx,
      top,
      one ? 'clock' : 'calendar',
      one ? tr('Ile godzin dziennie możesz jeździć?', 'How many hours per day can you drive?') : tr('Ile dni w tygodniu?', 'How many days per week?'),
      one ? tr('Wybierz swoją dzienną dostępność', 'Select your daily availability') : tr('Wybierz dni pracy', 'Choose your working days'),
    )
    const values = one ? [4, 6, 8, 10, 12] : [3, 4, 5, 6, 7]
    values.forEach((value, i) => {
      const o = calcOption(state.step as 1 | 2, i)
      const on = value === state.value
      if (on) {
        ctx.save()
        ctx.shadowColor = 'rgba(255, 191, 0, 0.3)'
        ctx.shadowBlur = 40 * pixel(ctx)
        box(ctx, o.x, top + o.y, o.size, o.size, 12, TB.gold)
        ctx.restore()
      } else box(ctx, o.x, top + o.y, o.size, o.size, 12, 'rgba(24, 29, 37, 0.5)')
      text(ctx, String(value), o.x + o.size / 2, top + o.y + 34, { size: 16, weight: 600, color: on ? TB.bg : TB.text, align: 'center' })
    })
    const hoursWord = state.value === 4 ? 'godziny' : 'godzin'
    const helper = one ? tr(`${state.value} ${hoursWord} dziennie`, `${state.value} hours per day`) : tr(`${state.value} dni w tygodniu`, `${state.value} days per week`)
    const helperY = (one ? 124 : 96) + 56 + 32 + 18
    text(ctx, helper, 196.5, top + helperY, { size: 16, weight: 400, color: TB.dim, align: 'center' })
    const b = calcButton(state.step)
    if (!one) backButton(ctx, 40, top + b.y)
    goldButton(ctx, b.x, top + b.y, b.width, b.height, tr('Dalej', 'Next'), 'chevron-right')
    progressDots(ctx, top + b.y + 80, state.step - 1)
  } else if (state.step === 3) {
    const head = calcHeader(ctx, top, 'user', tr('Wprowadź Swoje Dane Kontaktowe', 'Enter Your Contact Information'), tr('Potrzebujemy Twoich danych aby pokazać spersonalizowane zarobki', 'We need your details to show personalized earnings'))
    const y = top + 24 + head
    field(ctx, 40, y, 313, tr('Imię i Nazwisko', 'Full Name'), 'user', state.name, tr('Wprowadź imię i nazwisko', 'Enter your full name'), { center: true, caret: caret && !state.phone, focus: !state.phone })
    field(ctx, 40, y + 102, 313, tr('Numer Telefonu', 'Phone Number'), 'phone', state.phone, '+48 XXX XXX XXX', { center: true, caret: caret && Boolean(state.phone), focus: Boolean(state.phone) })
    const b = calcButton(3)
    backButton(ctx, 40, top + b.y)
    const ready = state.name.length > 0 && state.phone.replace(/\s/g, '').length >= 9
    goldButton(ctx, b.x, top + b.y, b.width, b.height, tr('Kontynuuj', 'Continue'), 'trending-up', true, ready ? 1 : 0.5)
    progressDots(ctx, top + b.y + 80, 2)
  } else if (state.step === 4) {
    /* Золотой шар расчёта — отдельной 3D-моделью поверх экрана; здесь его место. */
    text(ctx, tr('Obliczanie Twojego Potencjału...', 'Calculating Your Potential...'), 196.5, top + 48 + 96 + 24 + 21, { size: 20, weight: 700, color: TB.text, align: 'center' })
    para(ctx, tr('Analizujemy najlepsze możliwości zarobkowe dla Ciebie', 'Analyzing the best earning opportunities for you'), 196.5, top + 48 + 96 + 24 + 28 + 8 + 18, 300, 24, { size: 16, weight: 400, color: TB.dim, align: 'center' })
  } else {
    calcHeader(ctx, top, 'trending-up', tr('Twoje Potencjalne Zarobki', 'Your Potential Earnings'), tr(`Wyliczenie indywidualne dla: ${HERO.name}`, `Personalized calculation for ${HERO.name}`))
    const toggleY = top + RESULT.toggle
    box(ctx, 40, toggleY, 313, 48, 12, 'rgba(24, 29, 37, 0.5)')
    box(ctx, 198.5, toggleY + 4, 150.5, 40, 16, TB.gold)
    text(ctx, tr('Tygodniowo', 'Weekly'), 40 + 4 + 75, toggleY + 29, { size: 14, weight: 500, color: TB.dim, align: 'center' })
    text(ctx, tr('Miesięcznie', 'Monthly'), 198.5 + 75, toggleY + 29, { size: 14, weight: 500, color: TB.bg, align: 'center' })
  }
  return h
}

/** Результат: где что стоит от верха карточки (плитки и благодарность — 3D-плиты). */
export const RESULT = {
  toggle: 124,
  tiles: { y: 196, height: 128, left: 40, right: 204.5, width: 148.5 },
  disclaimer: 348,
  thanks: { x: 40, y: 404, width: 313, height: 256 },
}

/** Плитка результата: «Średnie zarobki» или золотая «Maksymalny potencjał» (10 ч × 6 дн., в месяц). */
export function drawResultTile(ctx: CanvasRenderingContext2D, max: boolean) {
  const { width, height } = RESULT.tiles
  if (max) {
    box(ctx, 0, 0, width, height, 12, goldFill(ctx, 0, 0, width, height))
    icon(ctx, 'sparkles', width - 30, 12, 16, 'rgba(8, 10, 12, 0.5)')
    para(ctx, tr('Maksymalny potencjał', 'Maximum Potential'), width / 2, 30, 110, 20, { size: 14, weight: 400, color: 'rgba(8, 10, 12, 0.8)', align: 'center' })
    text(ctx, tr('20 784', '20,784'), width / 2, 94, { size: 24, weight: 700, color: TB.bg, align: 'center' })
    text(ctx, 'PLN', width / 2, 114, { size: 14, weight: 400, color: 'rgba(8, 10, 12, 0.8)', align: 'center' })
  } else {
    box(ctx, 0, 0, width, height, 12, '#13171d')
    text(ctx, tr('Średnie zarobki', 'Average Earnings'), width / 2, 36, { size: 14, weight: 400, color: TB.dim, align: 'center' })
    text(ctx, tr('14 289', '14,289'), width / 2, 84, { size: 24, weight: 700, color: TB.text, align: 'center' })
    text(ctx, 'PLN', width / 2, 106, { size: 14, weight: 400, color: TB.gold, align: 'center' })
  }
}

export function drawDisclaimer(ctx: CanvasRenderingContext2D) {
  para(ctx, tr('Wyliczenie na podstawie Twoich parametrów: 10 godz./dzień, 6 dni w tygodniu', 'Calculation based on your parameters: 10\u00A0h/day, 6\u00A0days per week'), 156.5, 14, 300, 16, { size: 12, weight: 400, color: TB.dim, align: 'center' })
}

/** «Dziękujemy» — карточка, которая отрывается от телефона и летит в панель. */
export function drawThanks(ctx: CanvasRenderingContext2D, check = 1) {
  const { width, height } = RESULT.thanks
  box(ctx, 0, 0, width, height, 12, '#15130b', 'rgba(255, 191, 0, 0.2)')
  box(ctx, 0, 0, width, height, 12, 'rgba(255, 191, 0, 0.08)')
  checkStroke(ctx, width / 2 - 16, 16, 32, TB.gold, check, 2.6)
  text(ctx, tr(`Dziękujemy, ${HERO.name}!`, `Thank you, ${HERO.name}!`), width / 2, 82, { size: 18, weight: 600, color: TB.gold, align: 'center' })
  para(ctx, tr(`Nasz menedżer skontaktuje się z Tobą pod numerem ${HERO.phone}, aby omówić szczegóły współpracy.`, `Our manager will contact you at ${HERO.phone.replace(/ /g, '\u00A0')} to discuss cooperation details.`), width / 2, 110, 281, 20, { size: 14, weight: 400, color: TB.dim, align: 'center' })
  const label = tr('Zacznij Zarabiać', 'Start Earning Now')
  /* Английская надпись длиннее: кнопка растёт по ней, поля те же (24 и 52). */
  const bw = english() ? Math.max(211, 52 + measure(ctx, label, { size: 16, weight: 600 }) + 24) : 211
  box(ctx, width / 2 - bw / 2, height - 64, bw, 48, 16, TB.gold)
  icon(ctx, 'zap', width / 2 - bw / 2 + 24, height - 50, 20, TB.bg)
  text(ctx, label, width / 2 - bw / 2 + 52, height - 34.5, { size: 16, weight: 600, color: TB.bg })
}

/** Экран лендинга: страница с прокруткой scroll, шапка и хром Safari. */
export function drawLanding(ctx: CanvasRenderingContext2D, options: { lang?: Lang; scroll?: number; calc?: CalcState; caret?: boolean; chrome?: boolean } = {}) {
  const lang = options.lang ?? LANGS[0]!
  const scroll = options.scroll ?? 0
  heroGlow(ctx, scroll)
  /* dir="rtl" у арабского: текст по центру остаётся, ряды зеркалятся — здесь это шапка. */
  heroContent(ctx, WEB_TOP - scroll, lang)
  calcCard(ctx, WEB_TOP + CALC_TOP - scroll, options.calc ?? { step: 1, value: 8 }, options.caret)
  if (options.chrome !== false) {
    landingHeader(ctx, scroll > 50, lang)
    webChrome(ctx)
  }
}

/* ── Регистрация водителя (Register.tsx) ──────────────────────────────── */

/** Шапка страницы регистрации: знак, заголовок, «4 prostych krokach». */
function registerHeader(ctx: CanvasRenderingContext2D, chosen: boolean) {
  metallic(ctx, 'TAXI BOSS', 196.5, WEB_TOP + 78, { size: 30, weight: 800, align: 'center', tracking: -0.4 })
  text(ctx, tr('Rejestracja Kierowcy', 'Driver Registration'), 196.5, WEB_TOP + 124, { size: 24, weight: 700, color: TB.text, align: 'center' })
  text(ctx, tr('Dołącz do TAXI BOSS w 4 prostych krokach', 'Join TAXI BOSS in 4 simple steps'), 196.5, WEB_TOP + 158, { size: 15.5, weight: 400, color: TB.dim, align: 'center' })
  if (!chosen) return
  /* Выбранная форма сотрудничества — чип продукта над карточкой. */
  const label = tr('Wynajem pojazdu', 'Vehicle Rental')
  const w = measure(ctx, label, { size: 14, weight: 500 }) + 24 + 20
  box(ctx, 196.5 - w / 2, WEB_TOP + 176, w, 28, 14, 'rgba(255, 191, 0, 0.1)', 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'car', 196.5 - w / 2 + 12, WEB_TOP + 182, 16, TB.gold)
  text(ctx, label, 196.5 - w / 2 + 32, WEB_TOP + 195, { size: 14, weight: 500, color: TB.text })
}

/** Верх карточки шага на экране регистрации. */
export const REGISTER_CARD = WEB_TOP + 236

export interface ContactState {
  name: string
  email: string
  phone: string
  /** Какое поле в фокусе: 0 — имя, 1 — почта, 2 — телефон, −1 — ни одно. */
  focus: number
  /** Цифры, которые маска только что дописала сама (подсветка маски). */
  mask?: boolean
  busy?: boolean
}

/** Где кнопка «Utwórz Konto» на экране. */
export const CREATE_BUTTON = { x: 156, y: REGISTER_CARD + 410, width: 197, height: 56 }

/** Шаг «Dane Kontaktowe»: пароля нет вовсе (Register.tsx шлёт случайный сам). */
export function drawRegisterContact(ctx: CanvasRenderingContext2D, state: ContactState) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  registerHeader(ctx, true)
  const top = REGISTER_CARD
  liquidGlass(ctx, 16, top, 361, 490)
  box(ctx, 40, top + 24, 48, 48, 12, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'user', 52, top + 36, 24, TB.gold)
  text(ctx, tr('Dane Kontaktowe', 'Contact Information'), 100, top + 44, { size: 18, weight: 600, color: TB.text })
  text(ctx, tr('Jak możemy się z Tobą skontaktować?', 'How can we reach you?'), 100, top + 66, { size: 14, weight: 400, color: TB.dim })
  const y = top + 96
  field(ctx, 40, y, 313, tr('Imię i Nazwisko', 'Full Name'), 'user', state.name, tr('Wprowadź imię i nazwisko', 'Enter your full name'), { caret: state.focus === 0, focus: state.focus === 0 })
  field(ctx, 40, y + 102, 313, tr('Adres Email', 'Email Address'), 'mail', state.email, tr('twoj.email@example.com', 'your.email@example.com'), { caret: state.focus === 1, focus: state.focus === 1 })
  field(ctx, 40, y + 204, 313, tr('Numer Telefonu', 'Phone Number'), 'phone', state.phone, '+48 XXX XXX XXX', { caret: state.focus === 2, focus: state.focus === 2 })
  if (state.mask && state.phone) {
    /* Маска: «+48 » и пробелы между тройками встают сами — подсвечены. */
    const base = { size: 16, weight: 400 }
    const prefix = measure(ctx, '+48 ', base)
    box(ctx, 88 - 3, y + 204 + 28 + 17, prefix + 2, 24, 6, 'rgba(255, 191, 0, 0.16)')
  }
  box(ctx, 40, top + 414, 104, 48, 12, 'rgba(24, 29, 37, 0.5)', TB.border)
  icon(ctx, 'arrow-left', 56, top + 428, 20, TB.text)
  text(ctx, tr('Wstecz', 'Back'), 84, top + 443, { size: 16, weight: 500, color: TB.text })
  const ready = Boolean(state.name && state.email && state.phone.length >= 15)
  if (state.busy) {
    ctx.save()
    box(ctx, CREATE_BUTTON.x, CREATE_BUTTON.y, CREATE_BUTTON.width, CREATE_BUTTON.height, 12, goldFill(ctx, CREATE_BUTTON.x, CREATE_BUTTON.y, CREATE_BUTTON.width, CREATE_BUTTON.height))
    icon(ctx, 'loader-circle', CREATE_BUTTON.x + 22, CREATE_BUTTON.y + 18, 20, TB.bg)
    text(ctx, tr('Tworzenie konta...', 'Creating account...'), CREATE_BUTTON.x + 50, CREATE_BUTTON.y + 33.5, { size: 16, weight: 600, color: TB.bg })
    ctx.restore()
  } else goldButton(ctx, CREATE_BUTTON.x, CREATE_BUTTON.y, CREATE_BUTTON.width, CREATE_BUTTON.height, tr('Utwórz Konto', 'Create Account'), 'zap', false, ready ? 1 : 0.5)
  webChrome(ctx)
}

/** Строка выбора (радиус 12, рамка 2): иконка в плитке, заголовок, пояснение, шеврон. */
function optionRow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, glyph: string, tone: string, title: string, desc: string): number {
  const titleLines = wrap(ctx, title, w - 136, { size: 18, weight: 600 })
  const descLines = wrap(ctx, desc, w - 136, { size: 14, weight: 400 })
  const h = Math.max(104, 24 + titleLines.length * 26 + 6 + descLines.length * 20 + 20)
  box(ctx, x, y, w, h, 12, 'rgba(24, 29, 37, 0.3)', TB.border, 2)
  box(ctx, x + 24, y + 24, 56, 56, 12, rgba(tone, 0.2))
  icon(ctx, glyph, x + 38, y + 38, 28, tone)
  titleLines.forEach((line, i) => text(ctx, line, x + 96, y + 44 + i * 26, { size: 18, weight: 600, color: TB.text }))
  descLines.forEach((line, i) => text(ctx, line, x + 96, y + 44 + titleLines.length * 26 + 2 + i * 20, { size: 14, weight: 400, color: TB.dim }))
  icon(ctx, 'chevron-right', x + w - 36, y + h / 2 - 10, 20, TB.dim)
  return h
}

/** Прокрутка экрана «Konto Utworzone!»: обе строки выбора над адресной строкой. */
export const CREATED_SCROLL = 120

/** «Konto Utworzone!» и выбор способа подтверждения; возвращает верх строки Telegram на экране. */
export function drawAccountCreated(ctx: CanvasRenderingContext2D, pop = 1, scroll = CREATED_SCROLL): number {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  ctx.save()
  ctx.translate(0, -scroll)
  registerHeader(ctx, true)
  const top = REGISTER_CARD
  liquidGlass(ctx, 16, top, 361, 560)
  const r = 40 * pop
  ctx.beginPath()
  ctx.arc(196.5, top + 64, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 191, 0, 0.2)'
  ctx.fill()
  if (pop > 0.3) icon(ctx, 'circle-check-big', 176.5, top + 44, 40, TB.gold, 2.2)
  text(ctx, tr('Konto Utworzone!', 'Account Created!'), 196.5, top + 146, { size: 24, weight: 700, color: TB.text, align: 'center' })
  text(ctx, tr('Wybierz sposób weryfikacji konta', 'Choose how to verify your account'), 196.5, top + 174, { size: 16, weight: 400, color: TB.dim, align: 'center' })
  const first = optionRow(ctx, 40, top + 198, 313, 'mail', TB.blue5, tr('Weryfikuj przez Email', 'Verify via Email'), tr(`Wyślemy link weryfikacyjny na adres ${HERO.email}`, `We'll send a verification link to ${HERO.email}`))
  optionRow(ctx, 40, top + 198 + first + 12, 313, 'send', TB.sky5, tr('Weryfikuj przez Telegram', 'Verify via Telegram'), tr('Szybka weryfikacja przez naszego bota Telegram', 'Quick verification through our Telegram bot'))
  ctx.restore()
  webChrome(ctx)
  return top + 198 + first + 12 - scroll
}

/* ── Кабинет водителя (Dashboard.tsx, TelegramSync, PasskeyManager) ───── */

/** Шапка кабинета: знак, колокольчик, язык, аватар, выход. */
function cabinetHeader(ctx: CanvasRenderingContext2D) {
  box(ctx, -2, WEB_TOP, 397, 69, 0, 'rgba(16, 19, 24, 0.9)')
  box(ctx, -2, WEB_TOP + 68, 397, 1, 0, TB.border)
  metallic(ctx, 'TAXI BOSS', 16, WEB_TOP + 43, { size: 23, weight: 800, tracking: -0.3 })
  const buttons: [string, number][] = [['bell', 209], ['globe', 253], ['user', 297], ['log-out', 341]]
  for (const [glyph, x] of buttons) {
    if (glyph === 'user') {
      ctx.beginPath()
      ctx.arc(x + 18, WEB_TOP + 34.5, 18, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 191, 0, 0.2)'
      ctx.fill()
      icon(ctx, 'user', x + 8, WEB_TOP + 24.5, 20, TB.gold)
    } else {
      box(ctx, x, WEB_TOP + 16.5, 36, 36, 16, 'rgba(24, 29, 37, 0.5)')
      icon(ctx, glyph, x + 8, WEB_TOP + 24.5, 20, TB.dim)
    }
  }
}

/** Карточки кабинета на экране: они же отрываются плитами (м-отрыв). */
export const CABINET = {
  telegram: { x: 16, y: WEB_TOP + 101, width: 361, height: 78 },
  passkey: { x: 16, y: WEB_TOP + 179, width: 361, height: 82 },
}

/** Плашка Telegram (TelegramSync.tsx): не связан — оранжевая, связан — синяя. */
export function drawTelegramCard(ctx: CanvasRenderingContext2D, linked: boolean) {
  const { width: w, height: h } = CABINET.telegram
  const tone = linked ? TB.blue5 : TB.orange5
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, rgba(tone, 0.1))
  g.addColorStop(1, rgba(linked ? '#06B6D4' : TB.yellow5, 0.1))
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, '#0d1014')
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, g, rgba(tone, 0.2))
  box(ctx, 16, 19, 40, 40, 12, rgba(tone, 0.2))
  icon(ctx, 'message-circle', 26, 29, 20, linked ? TB.blue4 : TB.orange4)
  text(ctx, 'Telegram', 68, 34, { size: 16, weight: 600, color: TB.text })
  icon(ctx, linked ? 'circle-check-big' : 'circle-alert', 68, 43, 14, linked ? TB.green4 : TB.orange4)
  text(ctx, linked ? tr(`Połączono: ${HERO.telegram}`, `Connected: ${HERO.telegram}`) : tr('Niepołączono', 'Not connected'), 87, 55, { size: 14, weight: 400, color: TB.dim })
  const label = linked ? tr('Aktywny', 'Active') : tr('Połącz', 'Connect')
  const pw = measure(ctx, label, { size: 12, weight: 500 }) + 24
  box(ctx, w - 44 - pw, 27, pw, 24, 12, rgba(linked ? TB.green5 : TB.orange5, 0.2))
  text(ctx, label, w - 44 - pw / 2, 43, { size: 12, weight: 500, color: linked ? TB.green4 : TB.orange4, align: 'center' })
  icon(ctx, 'chevron-down', w - 36, 29, 20, TB.dim)
}

/** «Klucze dostępu» (PasskeyManager.tsx): один ключ, вход без пароля. */
export function drawPasskeyCard(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = CABINET.passkey
  liquidGlass(ctx, 0.5, 0.5, w - 1, h - 1, 24)
  box(ctx, 20, 21, 40, 40, 12, 'rgba(255, 191, 0, 0.15)')
  icon(ctx, 'key-round', 30, 31, 20, TB.gold)
  text(ctx, tr('Klucze dostępu', 'Passkeys'), 72, 37, { size: 16, weight: 500, color: TB.text })
  text(ctx, tr('1 klucz — logowanie bez hasła', '1 key — sign in without a password'), 72, 57, { size: 12, weight: 400, color: TB.dim })
  icon(ctx, 'shield-check', w - 66, 33, 16, TB.green4)
  icon(ctx, 'chevron-down', w - 40, 31, 20, TB.dim)
}

/** Кабинет водителя; slots — нарисовать ли на месте плашки Telegram и ключей сами карточки. */
export function drawCabinet(ctx: CanvasRenderingContext2D, options: { linked?: boolean; slots?: boolean } = {}) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  if (options.slots) {
    ctx.save()
    ctx.translate(CABINET.telegram.x, CABINET.telegram.y)
    drawTelegramCard(ctx, Boolean(options.linked))
    ctx.restore()
    ctx.save()
    ctx.translate(CABINET.passkey.x, CABINET.passkey.y)
    drawPasskeyCard(ctx)
    ctx.restore()
  } else {
    box(ctx, 16, CABINET.telegram.y, 361, 160, 24, 'rgba(255, 255, 255, 0.015)', 'rgba(255, 255, 255, 0.04)')
  }
  const alertTop = WEB_TOP + 285
  box(ctx, 16, alertTop, 361, 396, 24, 'rgba(234, 179, 8, 0.1)', 'rgba(234, 179, 8, 0.3)')
  box(ctx, 40, alertTop + 24, 48, 48, 12, 'rgba(234, 179, 8, 0.2)')
  icon(ctx, 'triangle-alert', 52, alertTop + 36, 24, TB.yellow5)
  let y = alertTop + 42
  y += para(ctx, tr('Wymagane przesłanie dokumentów', 'Documents upload required'), 104, y, 250, 22, { size: 17, weight: 600, color: TB.text }) * 22 + 4
  y += para(ctx, tr('Aby rozpocząć pracę, musisz przejść obowiązkowe testy i przesłać dokumenty. Bez nich nie będziesz mógł otrzymywać zamówień.', 'To start working, you need to pass mandatory tests and upload documents. Without them you cannot receive orders.'), 104, y, 250, 20, { size: 14, weight: 400, color: TB.dim }) * 20 + 6
  para(ctx, tr('Brakuje: Test Psychologiczny, Zaświadczenie Lekarskie, Zaświadczenie o Niekaralności', 'Missing: Psychological Test, Medical Certificate, Criminal Record Certificate'), 104, y, 250, 20, { size: 14, weight: 500, color: TB.yellow5 })
  goldButton(ctx, 40, alertTop + 256, 313, 52, tr('Prześlij dokumenty', 'Upload documents'), null)
  box(ctx, 40, alertTop + 318, 313, 52, 12, 'rgba(31, 36, 46, 0.8)', 'rgba(61, 71, 92, 0.5)')
  text(ctx, tr('Przypomnij później', 'Remind later'), 196.5, alertTop + 349, { size: 16, weight: 600, color: TB.text, align: 'center' })
  liquidGlass(ctx, 16, alertTop + 420, 361, 174, 32)
  box(ctx, 40, alertTop + 444, 48, 48, 12, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'dollar-sign', 52, alertTop + 456, 24, TB.gold)
  text(ctx, tr('TEN TYDZIEŃ', 'THIS WEEK'), 353, alertTop + 466, { size: 12, weight: 500, color: TB.dim, align: 'right', tracking: 0.6 })
  cabinetHeader(ctx)
  webChrome(ctx)
}

/** Кабинет, пролистанный до машины: «Twój samochód», сюда садится карточка машины. */
export const CABINET_CAR = { x: 40, y: WEB_TOP + 150, width: 313, height: 112 }

export function drawCarCardInner(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = CABINET_CAR
  box(ctx, 0, 0, w, h, 12, '#12161b', 'rgba(255, 255, 255, 0.05)')
  box(ctx, 16, 16, 40, 40, 16, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'car', 26, 26, 20, TB.gold)
  text(ctx, HERO.car, 68, 32, { size: 16, weight: 500, color: TB.text })
  text(ctx, `${HERO.plate} • ${HERO.year}`, 68, 50, { size: 12, weight: 400, color: TB.dim })
  box(ctx, 16, 68, w - 32, 1, 0, TB.border)
  text(ctx, tr('Najem tygodniowy', 'Weekly rent'), 16, 94, { size: 14, weight: 400, color: TB.dim })
  text(ctx, `${HERO.rent} PLN`, w - 16, 94, { size: 14, weight: 600, color: TB.text, align: 'right' })
}

export function drawCabinetCar(ctx: CanvasRenderingContext2D, withCar: boolean) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  const top = WEB_TOP + 90
  liquidGlass(ctx, 16, top, 361, 470, 32)
  text(ctx, tr('Twój samochód', 'Your car'), 40, top + 38, { size: 18, weight: 600, color: TB.text })
  if (withCar) {
    ctx.save()
    ctx.translate(CABINET_CAR.x, CABINET_CAR.y)
    drawCarCardInner(ctx)
    ctx.restore()
  } else {
    box(ctx, CABINET_CAR.x, CABINET_CAR.y, CABINET_CAR.width, CABINET_CAR.height, 12, 'rgba(255, 255, 255, 0.015)', 'rgba(255, 255, 255, 0.05)')
    text(ctx, tr('Nie przypisano jeszcze pojazdu', 'No vehicle assigned yet'), 196.5, CABINET_CAR.y + 62, { size: 14, weight: 400, color: TB.dim, align: 'center' })
  }
  const tiles: [string, string][] = [[tr('Kursy łącznie', 'Total rides'), '0'], [tr('Łącznie PLN', 'Total PLN'), '0'], [tr('Godziny łącznie', 'Total hours'), '0h'], [tr('Ocena', 'Rating'), '⭐ 5.0']]
  tiles.forEach(([label, value], i) => {
    const x = 40 + (i % 2) * 160
    const y = top + 206 + Math.floor(i / 2) * 76
    box(ctx, x, y, 153, 66, 12, 'rgba(24, 29, 37, 0.3)')
    text(ctx, value, x + 16, y + 30, { size: 20, weight: 700, color: TB.text })
    text(ctx, label, x + 16, y + 52, { size: 12, weight: 400, color: TB.dim })
  })
  text(ctx, tr('Profil Kierowcy', 'Driver Profile'), 40, top + 386, { size: 16, weight: 600, color: TB.text })
  const rows: [string, string][] = [
    [tr('Przesyłanie Dokumentów', 'Documents Upload'), tr('Przesłano', 'Uploaded')],
    [tr('Oczekuje na Weryfikację', 'Pending Verification'), tr('Zweryfikowany', 'Verified')],
  ]
  rows.forEach(([label, state], i) => {
    const y = top + 412 + i * 26
    text(ctx, label, 40, y, { size: 14, weight: 400, color: TB.dim })
    const w = measure(ctx, state, { size: 12, weight: 500 })
    icon(ctx, 'check', 353 - w - 18, y - 11, 14, TB.green4, 2.4)
    text(ctx, state, 353, y, { size: 12, weight: 500, color: TB.green4, align: 'right' })
  })
  cabinetHeader(ctx)
  webChrome(ctx)
}

/* ── Документы на сайте (Documents.tsx) ───────────────────────────────── */

export const DOCS = [
  { glyph: 'brain', title: 'Test Psychologiczny', desc: 'Zaświadczenie o przejściu testu psychologicznego', titleEn: 'Psychological Test', descEn: 'Certificate of psychological test completion' },
  { glyph: 'heart', title: 'Zaświadczenie Lekarskie', desc: 'Zaświadczenie o stanie zdrowia od lekarza', titleEn: 'Medical Certificate', descEn: 'Health certificate from a doctor' },
  { glyph: 'shield', title: 'Zaświadczenie o Niekaralności', desc: 'Zaświadczenie z policji o niekaralności', titleEn: 'Criminal Record Certificate', descEn: 'Police certificate of no criminal record' },
]

/** Карточка документа на экране (radius 24, рамка 2). */
export function docCardRect(index: number) {
  return { x: 16, y: WEB_TOP + 150 + index * 122, width: 361, height: 106 }
}

/** Лист «Sposób przesyłania» — выходит из экрана отдельной плитой. */
export const UPLOAD_SHEET = { x: 16, y: 421, width: 361, height: 363 }

/** Одна карточка документа: 0 — нет, 1 — загружается, 2 — загружен. */
export function drawDocCard(ctx: CanvasRenderingContext2D, index: number, state: 0 | 1 | 2) {
  const doc = DOCS[index]!
  const { width: w, height: h } = docCardRect(index)
  const done = state === 2
  const busy = state === 1
  box(ctx, 1, 1, w - 2, h - 2, 24, done ? '#0b1a10' : busy ? '#14120a' : '#0c0f12', done ? 'rgba(34, 197, 94, 0.4)' : busy ? 'rgba(255, 191, 0, 0.3)' : TB.border, 2)
  box(ctx, 20, 25, 56, 56, 16, done ? 'rgba(34, 197, 94, 0.2)' : busy ? 'rgba(255, 191, 0, 0.12)' : 'rgba(24, 29, 37, 0.5)')
  icon(ctx, done ? 'circle-check-big' : busy ? 'loader-circle' : doc.glyph, 36, 41, 24, done ? TB.green4 : busy ? TB.gold : TB.dim)
  const titleLines = wrap(ctx, tr(doc.title, doc.titleEn), 200, { size: 16, weight: 600 })
  /* Английская карточка с заголовком в две строки: интерлиньяж плотнее, иначе
     вторая строка описания ложится на нижнюю кромку карточки. */
  const tight = english() && titleLines.length > 1
  const lead = tight ? 20 : 22
  titleLines.forEach((line, i) => text(ctx, line, 92, 44 + i * lead, { size: 16, weight: 600, color: done ? TB.green4 : TB.text }))
  const line = done ? `${['psycho_test', 'medical_cert', 'criminal_record'][index]}.jpg` : busy ? tr('Przesyłanie...', 'Uploading...') : tr(doc.desc, doc.descEn)
  para(ctx, line, 92, 44 + titleLines.length * lead, done || busy ? 260 : 200, tight ? 16 : 18, { size: 13, weight: 400, color: TB.dim })
  if (!done && !busy) {
    box(ctx, w - 60, 33, 40, 40, 12, 'rgba(255, 191, 0, 0.2)')
    icon(ctx, 'upload', w - 50, 43, 20, TB.gold)
  }
}

/** Страница документов: count — сколько загружено, busy — какой грузится (−1 — никакой). */
export function drawDocuments(ctx: CanvasRenderingContext2D, count: number, busy = -1, cards = true) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  box(ctx, -2, WEB_TOP, 397, 69, 0, 'rgba(16, 19, 24, 0.9)')
  box(ctx, -2, WEB_TOP + 68, 397, 1, 0, TB.border)
  box(ctx, 16, WEB_TOP + 16.5, 36, 36, 16, 'rgba(24, 29, 37, 0.5)')
  icon(ctx, 'arrow-left', 24, WEB_TOP + 24.5, 20, TB.text)
  text(ctx, tr('Dokumenty', 'Documents'), 64, WEB_TOP + 32, { size: 18, weight: 600, color: TB.text })
  text(ctx, tr('Prześlij wymagane dokumenty, aby zacząć pracę', 'Upload required documents to start working'), 64, WEB_TOP + 50, { size: 12, weight: 400, color: TB.dim })
  const top = WEB_TOP + 96
  text(ctx, tr(`Przesłano ${count} z 3`, `Uploaded ${count} of 3`), 16, top + 14, { size: 14, weight: 400, color: TB.dim })
  if (count >= 3) {
    const w = text(ctx, tr('Wszystkie dokumenty przesłane', 'All documents uploaded'), 377, top + 14, { size: 14, weight: 500, color: TB.green4, align: 'right' })
    icon(ctx, 'circle-check-big', 377 - w - 20, top + 1, 15, TB.green4, 2.4)
  }
  box(ctx, 16, top + 26, 361, 8, 4, 'rgba(24, 29, 37, 0.5)')
  if (count > 0) {
    const fill = (361 * count) / 3
    const g = ctx.createLinearGradient(16, 0, 16 + fill, 0)
    g.addColorStop(0, TB.gold)
    g.addColorStop(1, TB.green5)
    box(ctx, 16, top + 26, fill, 8, 4, g)
  }
  DOCS.forEach((_, i) => {
    const r = docCardRect(i)
    if (!cards) {
      box(ctx, r.x, r.y, r.width, r.height, 24, 'rgba(255, 255, 255, 0.012)', 'rgba(255, 255, 255, 0.04)')
      return
    }
    ctx.save()
    ctx.translate(r.x, r.y)
    drawDocCard(ctx, i, i < count ? 2 : i === busy ? 1 : 0)
    ctx.restore()
  })
  box(ctx, 106.5, WEB_TOP + 530, 180, 48, 12, 'rgba(31, 36, 46, 0.8)', 'rgba(61, 71, 92, 0.5)')
  text(ctx, tr('Powrót do panelu', 'Back to dashboard'), 196.5, WEB_TOP + 559, { size: 15, weight: 600, color: TB.text, align: 'center' })
  webChrome(ctx)
}

/** Строки листа «Sposób przesyłania»: верх каждой от верха листа. */
export const SHEET_ROWS = [72, 164, 256]

export function drawUploadSheet(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = UPLOAD_SHEET
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  text(ctx, tr('Sposób przesyłania', 'Upload method'), 20, 36, { size: 16, weight: 600, color: TB.text })
  icon(ctx, 'x', w - 40, 20, 20, TB.dim)
  box(ctx, 0, 56, w, 1, 0, TB.border)
  const rows: [string, string, string, string][] = [
    ['camera', TB.blue4, tr('Zrób zdjęcie', 'Take photo'), tr('Sfotografuj dokument aparatem', 'Take a photo of the document with camera')],
    ['image', TB.green4, tr('Wybierz z galerii', 'Select from gallery'), tr('Wybierz obraz lub plik PDF', 'Select an image or PDF file')],
    ['file-text', TB.gold, tr('Prześlij plik', 'Upload file'), tr('PDF, JPG, PNG (do 10 MB)', 'PDF, JPG, PNG (up to 10 MB)')],
  ]
  rows.forEach(([glyph, tone, title, desc], i) => {
    const y = SHEET_ROWS[i]!
    box(ctx, 16, y, w - 32, 80, 12, 'rgba(24, 29, 37, 0.3)')
    box(ctx, 32, y + 16, 48, 48, 12, rgba(tone, 0.2))
    icon(ctx, glyph, 44, y + 28, 24, tone)
    text(ctx, title, 96, y + 36, { size: 16, weight: 500, color: TB.text })
    /* Английская подпись длиннее: кегль ужимается, чтобы строка вошла в плашку. */
    const size = english() ? Math.min(14, (14 * (w - 32 - 96)) / measure(ctx, desc, { size: 14, weight: 400 })) : 14
    text(ctx, desc, 96, y + 56, { size, weight: 400, color: TB.dim })
  })
}

/* ── Панель владельца (components/admin/*) ─────────────────────────────── */

/** Щит у дороги 1,6 × 1,03 м — это экран 1280 × 824 CSS; ноутбук — 1280 × 800. */
export const DESK = { width: 1280, height: 824 }
export const LAPTOP_CSS = { width: 1280, height: 800 }

type Section = 'Marketing' | 'Zgłoszenia' | 'Kierowcy' | 'Flota'

/** Разделы меню: иконка, подпись (она же ключ раздела), цвет, английская подпись. */
const NAV: [string, Section | string, string, string][] = [
  ['chart-column', 'Marketing', TB.blue4, 'Marketing'],
  ['clipboard-list', 'Zgłoszenia', TB.yellow4, 'Applications'],
  ['users', 'Kierowcy', TB.green4, 'Drivers'],
  ['car', 'Flota', TB.purple4, 'Fleet'],
  ['dollar-sign', 'Finanse', TB.emerald4, 'Finance'],
  ['file-text', 'Dokumenty', TB.orange4, 'Documents'],
  ['settings', 'Ustawienia', TB.gray4, 'Settings'],
]

/** Где колокольчик панели (правый верх) — туда падает «Powiadomienia». */
export function bellRect(width: number) {
  return { x: width - 24 - 36 - 8 - 36, y: 14, width: 36, height: 36 }
}

/** Каркас панели: боковое меню, верхняя полоса с разделом, колокольчик. */
function adminShell(ctx: CanvasRenderingContext2D, W: number, H: number, active: Section, options: { pending?: number; bell?: number } = {}) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, W, H)
  box(ctx, 0, 0, 256, H, 0, '#0E1116')
  box(ctx, 255, 0, 1, H, 0, TB.border)
  box(ctx, 20, 22, 40, 40, 12, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'car', 28, 30, 24, TB.gold)
  text(ctx, 'TAXI BOSS', 72, 40, { size: 18, weight: 700, color: TB.text })
  text(ctx, tr('Panel administratora', 'Admin Panel'), 72, 58, { size: 12, weight: 400, color: TB.dim })
  box(ctx, 0, 85, 256, 1, 0, TB.border)
  NAV.forEach(([glyph, label, tone, en], i) => {
    const y = 101 + i * 48
    const on = label === active
    if (on) box(ctx, 12, y, 232, 44, 12, 'rgba(255, 191, 0, 0.15)', 'rgba(255, 191, 0, 0.2)')
    icon(ctx, glyph, 28, y + 12, 20, on ? TB.gold : tone)
    text(ctx, tr(label, en), 60, y + 27, { size: 14, weight: 500, color: on ? TB.gold : TB.dim })
    if (label === 'Zgłoszenia' && options.pending) {
      const value = String(options.pending)
      const w = measure(ctx, value, { size: 12, weight: 700 }) + 16
      box(ctx, 232 - w, y + 12, w, 20, 10, 'rgba(234, 179, 8, 0.2)')
      text(ctx, value, 232 - w / 2, y + 26, { size: 12, weight: 700, color: TB.yellow4, align: 'center' })
    }
  })
  box(ctx, 0, H - 161, 256, 1, 0, TB.border)
  const footer: [string, string, string][] = [['refresh-cw', tr('Odśwież', 'Refresh'), TB.dim], ['house', tr('Do strony', 'To website'), TB.dim], ['log-out', tr('Wyloguj', 'Log out'), TB.red4]]
  footer.forEach(([glyph, label, tone], i) => {
    const y = H - 148 + i * 48
    icon(ctx, glyph, 28, y + 12, 16, tone)
    text(ctx, label, 54, y + 25, { size: 14, weight: 400, color: tone })
  })
  box(ctx, 256, 0, W - 256, 64, 0, '#0C0F12')
  box(ctx, 256, 63, W - 256, 1, 0, TB.border)
  const item = NAV.find(([, label]) => label === active)
  if (item) {
    icon(ctx, item[0], 280, 22, 20, item[2])
    text(ctx, tr(active, item[3]), 310, 39, { size: 18, weight: 600, color: TB.text })
  }
  const bell = bellRect(W)
  icon(ctx, 'refresh-cw', W - 24 - 28, 22, 20, TB.dim)
  box(ctx, bell.x, bell.y, 36, 36, 16, 'rgba(24, 29, 37, 0.5)')
  icon(ctx, 'bell', bell.x + 8, bell.y + 8, 20, TB.dim)
  if (options.bell) {
    ctx.beginPath()
    ctx.arc(bell.x + 34, bell.y + 2, 10, 0, Math.PI * 2)
    ctx.fillStyle = TB.gold
    ctx.fill()
    text(ctx, String(options.bell), bell.x + 34, bell.y + 5.5, { size: 10, weight: 700, color: TB.bg, align: 'center' })
  }
  if (options.pending) {
    const x = bell.x - 44
    box(ctx, x, 14, 36, 36, 16, null)
    icon(ctx, 'clipboard-list', x + 8, 22, 20, TB.dim)
    ctx.beginPath()
    ctx.arc(x + 34, 12, 10, 0, Math.PI * 2)
    ctx.fillStyle = TB.yellow5
    ctx.fill()
    text(ctx, String(options.pending), x + 34, 15.5, { size: 10, weight: 700, color: '#000000', align: 'center' })
  }
}

/** Плитка сводки: иконка в скруглённом квадрате, число, подпись. */
function statTile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, glyph: string, tone: string, ink: string, value: string, label: string) {
  box(ctx, x, y, w, 82, 12, '#0C0F12', TB.border)
  box(ctx, x + 16, y + 21, 40, 40, 16, rgba(tone, 0.2))
  icon(ctx, glyph, x + 26, y + 31, 20, ink)
  text(ctx, value, x + 68, y + 42, { size: 24, weight: 700, color: TB.text })
  text(ctx, label, x + 68, y + 61, { size: 12, weight: 400, color: TB.dim })
}

function searchBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, placeholder: string) {
  box(ctx, x, y, w, 46, 12, '#101419', TB.border)
  icon(ctx, 'search', x + 12, y + 13, 20, TB.dim)
  text(ctx, placeholder, x + 42, y + 28, { size: 14, weight: 400, color: TB.gray4 })
}

function selectBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, value: string, h = 46) {
  box(ctx, x, y, w, h, 12, '#101419', TB.border)
  text(ctx, value, x + 14, y + h / 2 + 5, { size: 14, weight: 400, color: TB.text })
  icon(ctx, 'chevron-down', x + w - 30, y + h / 2 - 9, 18, TB.dim)
}

function avatarCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, initials: string, tone: string, ink: string) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = rgba(tone, 0.2)
  ctx.fill()
  text(ctx, initials, cx, cy + r * 0.3, { size: r * 0.8, weight: 600, color: ink, align: 'center' })
}

/* Marketing → Leady (MarketingSection.tsx): новый лид из калькулятора —
   первая строка таблицы; статус уже переведён («Nowy»). */

export interface Lead {
  name: string
  initials: string
  phone: string
  email?: string
  source: [string, string]
  status: [string, string, string]
  date: string
  /** Источник и статус по-английски (admin.leads.source.*, admin.leads.status.*). */
  en?: { source: string; status: string }
}

export const LEADS: Lead[] = [
  { name: HERO.name, initials: HERO.initials, phone: HERO.phone, source: ['calculator', 'Kalkulator'], status: ['Nowy', TB.blue5, TB.blue4], date: HERO.date, en: { source: 'Calculator', status: 'New' } },
  { name: 'Andrii Melnyk', initials: 'AM', phone: '+48 600 100 301', email: 'a.melnyk@mail.pl', source: ['users', 'Polecenie'], status: ['Kontakt', TB.yellow5, TB.yellow4], date: '27.09.2026', en: { source: 'Referral', status: 'Contacted' } },
  { name: 'Nino Beridze', initials: 'NB', phone: '+48 600 100 302', email: 'nino.b@mail.pl', source: ['send', 'Telegram'], status: ['Zakwalifikowany', TB.purple5, TB.purple4], date: '26.09.2026', en: { source: 'Telegram', status: 'Qualified' } },
  { name: 'Ion Rusu', initials: 'IR', phone: '+48 600 100 303', email: 'ion.rusu@mail.pl', source: ['globe', 'Strona WWW'], status: ['Zatwierdzony', TB.green5, TB.green4], date: '25.09.2026', en: { source: 'Website', status: 'Converted' } },
  { name: 'Marek Wójcik', initials: 'MW', phone: '+48 600 100 304', email: 'marek.w@mail.pl', source: ['calculator', 'Kalkulator'], status: ['Negocjacje', TB.orange5, TB.orange4], date: '24.09.2026', en: { source: 'Calculator', status: 'Negotiating' } },
]

const LEAD_COLUMNS = [16, 186, 386, 516, 646, 776]
/** Таблица лидов: верх первой строки и её размер (CSS). Строка — плита, которая садится сюда. */
export const LEAD_ROW = { x: 288, y: 388, width: 960, height: 76 }

/** Строка таблицы лидов в своих осях (0…960 × 0…76). */
export function drawLeadRow(ctx: CanvasRenderingContext2D, lead: Lead, fill = '#0C0F12') {
  const h = LEAD_ROW.height
  box(ctx, 0, 0, LEAD_ROW.width, h, 0, fill)
  avatarCircle(ctx, LEAD_COLUMNS[0]! + 20, h / 2, 20, lead.initials, TB.gold, TB.gold)
  text(ctx, lead.name, LEAD_COLUMNS[0]! + 52, h / 2 + 5.5, { size: 16, weight: 500, color: TB.text })
  const contactY = lead.email ? h / 2 - 3 : h / 2 + 5
  icon(ctx, 'phone', LEAD_COLUMNS[1]!, contactY - 12, 16, TB.dim)
  text(ctx, lead.phone, LEAD_COLUMNS[1]! + 24, contactY, { size: 14, weight: 400, color: TB.text })
  if (lead.email) {
    icon(ctx, 'mail', LEAD_COLUMNS[1]!, contactY + 8, 16, TB.dim)
    text(ctx, lead.email, LEAD_COLUMNS[1]! + 24, contactY + 20, { size: 14, weight: 400, color: TB.dim })
  }
  icon(ctx, lead.source[0], LEAD_COLUMNS[2]!, h / 2 - 8, 16, TB.dim)
  text(ctx, tr(lead.source[1], lead.en?.source ?? lead.source[1]), LEAD_COLUMNS[2]! + 24, h / 2 + 5, { size: 14, weight: 400, color: TB.text })
  pill(ctx, tr(lead.status[0], lead.en?.status ?? lead.status[0]), LEAD_COLUMNS[3]!, h / 2 - 13, lead.status[1], lead.status[2], { padX: 12, height: 26 })
  text(ctx, lead.date, LEAD_COLUMNS[4]!, h / 2 + 5, { size: 14, weight: 400, color: TB.dim })
  const actions: [string, string][] = lead.status[0] === 'Nowy' ? [['eye', TB.dim], ['phone', TB.blue4]] : lead.status[0] === 'Zatwierdzony' ? [['eye', TB.dim]] : [['eye', TB.dim], ['check', TB.green4], ['x', TB.red4]]
  actions.forEach(([glyph, tone], i) => icon(ctx, glyph, LEAD_COLUMNS[5]! + i * 36 + 8, h / 2 - 8, 16, tone))
}

/** Marketing → Leady; first — нарисовать ли первую строку (иначе там гнездо под плиту). */
export function drawLeads(ctx: CanvasRenderingContext2D, W: number, H: number, first: boolean) {
  adminShell(ctx, W, H, 'Marketing', { pending: 1, bell: 1 })
  let x = 288
  const tabs: [string, string, boolean][] = [['user-plus', tr('Leady', 'Leads'), true], ['megaphone', tr('Wysyłki', 'Broadcasts'), false], ['chart-column', tr('Analityka & Raportowanie', 'Analytics'), false]]
  tabs.forEach(([glyph, label, on]) => {
    const lw = measure(ctx, label, { size: 16, weight: 500 })
    const w = 32 + 24 + lw + (on ? 40 : 0)
    box(ctx, x, 96, w, 40, 16, on ? TB.gold : 'rgba(24, 29, 37, 0.5)')
    icon(ctx, glyph, x + 16, 108, 16, on ? TB.bg : TB.dim)
    text(ctx, label, x + 40, 122, { size: 16, weight: 500, color: on ? TB.bg : TB.dim })
    if (on) {
      box(ctx, x + 48 + lw, 106, 28, 20, 10, 'rgba(8, 10, 12, 0.2)')
      text(ctx, '12', x + 62 + lw, 120, { size: 12, weight: 500, color: TB.bg, align: 'center' })
    }
    x += w + 16
  })
  const tiles: [string, string, string, string, string][] = [
    ['users', TB.blue5, TB.blue4, '12', tr('Łącznie', 'Total')],
    ['user-plus', TB.blue5, TB.blue4, '3', tr('Nowy', 'New')],
    ['clock', TB.yellow5, TB.yellow4, '5', tr('W trakcie', 'In Progress')],
    ['circle-check-big', TB.green5, TB.green4, '3', tr('Zatwierdzony', 'Converted')],
    ['circle-x', TB.red5, TB.red4, '1', tr('Odrzucony', 'Lost')],
  ]
  const tw = (960 - 64) / 5
  tiles.forEach(([glyph, tone, ink, value, label], i) => statTile(ctx, 288 + i * (tw + 16), 160, tw, glyph, tone, ink, value, label))
  searchBox(ctx, 288, 266, 760, tr('Szukaj leadów...', 'Search...'))
  selectBox(ctx, 1064, 266, 184, tr('Wszystkie statusy', 'All statuses'))
  const tableH = H - 336 - 24
  box(ctx, 288, 336, 960, tableH, 12, '#0C0F12', TB.border)
  ctx.save()
  rr(ctx, 288, 336, 960, tableH, 12)
  ctx.clip()
  box(ctx, 288, 336, 960, 52, 0, '#12161C')
  ;[tr('Imię', 'Name'), tr('Kontakt', 'Contact'), tr('Źródło', 'Source'), 'Status', tr('Data', 'Date'), tr('Akcje', 'Actions')].forEach((label, i) => text(ctx, label, 288 + LEAD_COLUMNS[i]!, 367, { size: 14, weight: 500, color: TB.dim }))
  LEADS.forEach((lead, i) => {
    const y = LEAD_ROW.y + i * LEAD_ROW.height
    if (i > 0 || first) {
      ctx.save()
      ctx.translate(288, y)
      drawLeadRow(ctx, lead)
      ctx.restore()
    }
    box(ctx, 288, y, 960, 1, 0, TB.border)
  })
  ctx.restore()
}

/* Zgłoszenia (ApplicationsSection.tsx): карточка кандидата раскрыта, три
   документа; ✓ и ✗ — у каждого. */

/** 0 — «Do weryfikacji», 1 — «Zatwierdzony», 2 — «Odrzucony». */
export type Review = 0 | 1 | 2

const REVIEW_DOCS: [string, string, string][] = [
  ['brain', 'Badanie psychologiczne', 'Psych test'],
  ['heart', 'Zaświadczenie lekarskie', 'Medical certificate'],
  ['shield', 'Zaświadczenie o niekaralności', 'Criminal record certificate'],
]

/** Строка документа i: прямоугольник и центры кнопок ✓ и ✗ (CSS). */
export function reviewRow(index: number) {
  const y = 446 + index * 66
  return { x: 308, y, width: 920, height: 58, check: [1182, y + 29] as [number, number], cross: [1214, y + 29] as [number, number] }
}

/** Карточка кандидата: сюда влетают три документа (м-возврат). */
export const APPLICANT = { x: 288, y: 172, width: 960, height: 612 }

export function drawApplications(ctx: CanvasRenderingContext2D, W: number, H: number, states: [Review, Review, Review]) {
  adminShell(ctx, W, H, 'Zgłoszenia', { pending: 1, bell: 1 })
  text(ctx, tr('Zgłoszenia rejestracyjne', 'Registration applications'), 288, 122, { size: 20, weight: 700, color: TB.text })
  text(ctx, tr('Oczekuje na rozpatrzenie: 1', 'Awaiting review: 1'), 288, 146, { size: 14, weight: 400, color: TB.dim })
  searchBox(ctx, 992, 100, 256, tr('Szukaj...', 'Search...'))
  const c = APPLICANT
  box(ctx, c.x, c.y, c.width, c.height, 12, '#0C0F12', TB.border)
  ctx.beginPath()
  ctx.arc(c.x + 44, c.y + 44, 24, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.2)'
  ctx.fill()
  icon(ctx, 'clock', c.x + 32, c.y + 32, 24, TB.yellow4)
  const nw = text(ctx, HERO.name, c.x + 84, c.y + 38, { size: 16, weight: 600, color: TB.text })
  const pw = pill(ctx, tr('Oczekuje', 'Pending'), c.x + 96 + nw, c.y + 24, TB.yellow5, TB.yellow4, { height: 20, padX: 8 })
  box(ctx, c.x + 104 + nw + pw, c.y + 24, 52, 20, 10, 'rgba(255, 191, 0, 0.2)', 'rgba(255, 191, 0, 0.3)')
  text(ctx, tr('Najem', 'Rental'), c.x + 130 + nw + pw, c.y + 38, { size: 12, weight: 500, color: TB.gold, align: 'center' })
  const meta: [string, string][] = [['phone', HERO.phone], ['mail', HERO.email], ['clock', HERO.date]]
  let mx = c.x + 84
  meta.forEach(([glyph, value]) => {
    icon(ctx, glyph, mx, c.y + 52, 14, TB.dim)
    mx += 20 + text(ctx, value, mx + 20, c.y + 64, { size: 14, weight: 400, color: TB.dim }) + 16
  })
  const chipW = 132
  box(ctx, c.x + c.width - 56 - chipW, c.y + 30, chipW, 28, 16, 'rgba(34, 197, 94, 0.2)')
  icon(ctx, 'file-text', c.x + c.width - 56 - chipW + 12, c.y + 37, 14, TB.green4)
  text(ctx, tr('Dokumenty OK', 'Documents OK'), c.x + c.width - 56 - chipW + 32, c.y + 48.5, { size: 12, weight: 500, color: TB.green4 })
  icon(ctx, 'chevron-down', c.x + c.width - 40, c.y + 34, 20, TB.dim)
  box(ctx, c.x + 20, c.y + 90, c.width - 40, 1, 0, TB.border)
  const tiles: [string, string][] = [
    [tr('PESEL', 'PESEL (Polish ID number)'), '•••••••••45'],
    [tr('Obywatelstwo', 'Citizenship'), tr('Ukraina', 'Ukraine')],
    [tr('Miasto', 'City'), 'Poznań'],
    [tr('Adres', 'Address'), 'ul. Głogowska 5'],
    [tr('Kod pocztowy', 'Postal code'), '60-001'],
    ['Bank', 'PKO BP'],
    ['IBAN', 'PL61 •••• 1234'],
  ]
  tiles.forEach(([label, value], i) => {
    const x = c.x + 20 + (i % 4) * 232
    const y = c.y + 106 + Math.floor(i / 4) * 64
    box(ctx, x, y, 220, 56, 12, '#11151a')
    text(ctx, label, x + 12, y + 22, { size: 12, weight: 400, color: TB.dim })
    text(ctx, value, x + 12, y + 42, { size: 14, weight: 400, color: TB.text })
  })
  text(ctx, tr('Dokumenty', 'Documents'), c.x + 20, c.y + 256, { size: 14, weight: 600, color: TB.text })
  states.forEach((state, i) => {
    const r = reviewRow(i)
    box(ctx, r.x, r.y, r.width, r.height, 12, '#0F1216')
    const [glyph, label, en] = REVIEW_DOCS[i]!
    icon(ctx, glyph, r.x + 16, r.y + 13, 16, TB.text)
    text(ctx, tr(label, en), r.x + 44, r.y + 26, { size: 14, weight: 500, color: TB.text })
    text(ctx, HERO.date, r.x + 44, r.y + 44, { size: 12, weight: 400, color: TB.dim })
    const [label2, tone, ink] = state === 1 ? [tr('Zatwierdzony', 'Approved'), TB.green5, TB.green4] : state === 2 ? [tr('Odrzucony', 'Rejected'), TB.red5, TB.red4] : [tr('Do weryfikacji', 'Pending review'), TB.yellow5, TB.yellow4]
    pill(ctx, label2, r.check[0] - 64, r.y + 18, tone, ink, { align: 'right', border: false })
    icon(ctx, 'eye', r.check[0] - 50, r.y + 21, 16, TB.dim)
    if (state !== 1) icon(ctx, 'check', r.check[0] - 8, r.y + 21, 16, TB.green4, 2.4)
    if (state !== 2) icon(ctx, 'x', r.cross[0] - 8, r.y + 21, 16, TB.red4, 2.4)
  })
  let y = reviewRow(2).y + 58 + 10
  if (states[2] === 2) {
    box(ctx, c.x + 20, y, c.width - 40, 34, 16, 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.3)')
    icon(ctx, 'triangle-alert', c.x + 32, y + 10, 14, TB.red4)
    const lw = text(ctx, tr('Powód odrzucenia: ', 'Reason for rejection: '), c.x + 54, y + 22, { size: 13, weight: 400, color: TB.dim })
    text(ctx, tr(HERO.reason, HERO.reasonEn), c.x + 54 + lw, y + 22, { size: 13, weight: 400, color: TB.red4 })
    y += 44
  }
  const checks: [string, boolean][] = [
    [tr('Badanie psychologiczne', 'Psych test'), states[0] !== 2],
    [tr('Zaświadczenie lekarskie', 'Medical certificate'), states[1] !== 2],
    [tr('Niekaralność', 'No criminal record'), states[2] !== 2],
  ]
  checks.forEach(([label, ok], i) => {
    const x = c.x + 20 + i * 312
    box(ctx, x, y, 300, 36, 12, ok ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)')
    icon(ctx, ok ? 'circle-check-big' : 'circle-x', x + 12, y + 10, 16, ok ? TB.green4 : TB.red4)
    text(ctx, label, x + 36, y + 23, { size: 13, weight: 400, color: ok ? TB.green4 : TB.red4 })
  })
  y += 52
  box(ctx, c.x + 20, y, 452, 44, 12, 'rgba(34, 197, 94, 0.2)')
  icon(ctx, 'check', c.x + 20 + 226 - 50, y + 13, 18, TB.green4, 2.2)
  text(ctx, tr('Zatwierdź', 'Approve'), c.x + 20 + 226 - 26, y + 27, { size: 14, weight: 500, color: TB.green4 })
  box(ctx, c.x + 488, y, 452, 44, 12, 'rgba(239, 68, 68, 0.2)')
  icon(ctx, 'x', c.x + 488 + 226 - 40, y + 13, 18, TB.red4, 2.2)
  text(ctx, tr('Odrzuć', 'Reject'), c.x + 488 + 226 - 16, y + 27, { size: 14, weight: 500, color: TB.red4 })
}

/** Окно «Odrzuć dokument» — выходит из щита плитой на 10 см. */
export const REJECT_DIALOG = { width: 512, height: 372 }

export function drawRejectDialog(ctx: CanvasRenderingContext2D, typed: string, caret: boolean) {
  const { width: w, height: h } = REJECT_DIALOG
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  icon(ctx, 'triangle-alert', 24, 26, 20, TB.red4)
  text(ctx, tr('Odrzuć dokument', 'Reject document'), 52, 42, { size: 18, weight: 700, color: TB.text })
  icon(ctx, 'x', w - 44, 24, 20, TB.dim)
  box(ctx, 24, 66, w - 48, 74, 12, '#12161C')
  text(ctx, tr('Zaświadczenie o niekaralności', 'Criminal record certificate'), 40, 92, { size: 14, weight: 500, color: TB.text })
  para(ctx, tr('Kierowca zobaczy ten powód, więc napisz, co jest nie tak i co przesłać zamiast tego.', 'The driver sees this reason, so say what is wrong and what to send instead.'), 40, 112, w - 80, 16, { size: 12, weight: 400, color: TB.dim })
  text(ctx, tr('Powód odrzucenia *', 'Reason for rejection *'), 24, 168, { size: 12, weight: 400, color: TB.dim })
  box(ctx, 24, 178, w - 48, 106, 12, '#12161C', typed ? TB.gold : TB.border, typed ? 1.5 : 1)
  if (typed) {
    const lines = wrap(ctx, typed, w - 80, { size: 14, weight: 400 })
    lines.forEach((line, i) => text(ctx, line, 40, 204 + i * 20, { size: 14, weight: 400, color: TB.text }))
    if (caret) {
      const last = lines[lines.length - 1] ?? ''
      const lw = measure(ctx, last, { size: 14, weight: 400 })
      box(ctx, 41 + lw, 190 + (lines.length - 1) * 20, 1.6, 18, 0.8, TB.gold)
    }
  } else {
    /* Подсказка продукта; английская длиннее поля — переносится по словам. */
    const hint = tr('np. skan jest nieczytelny — prześlij całą stronę w kolorze', 'e.g. the scan is illegible — please upload the full page in colour')
    if (english()) para(ctx, hint, 40, 204, w - 80, 20, { size: 14, weight: 400, color: TB.gray4 })
    else text(ctx, hint, 40, 204, { size: 14, weight: 400, color: TB.gray4 })
  }
  ctx.save()
  ctx.globalAlpha = typed ? 1 : 0.5
  box(ctx, 24, 300, w - 48, 46, 12, 'rgba(239, 68, 68, 0.2)')
  icon(ctx, 'x', w / 2 - 70, 314, 18, TB.red4, 2.2)
  text(ctx, tr('Odrzuć dokument', 'Reject document'), w / 2 - 44, 328, { size: 14, weight: 500, color: TB.red4 })
  ctx.restore()
}

/** Где на окне кнопка «Odrzuć dokument» — по ней щёлкает курсор. */
export const REJECT_BUTTON: [number, number] = [256, 323]

/* Kierowcy → окно водителя (DriversSection.tsx): вкладки «Informacje» и «Umowy». */

/** Окно водителя поверх затемнённой страницы: 768 CSS, у верха экрана. */
export const DRIVER_DIALOG = { x: 256, y: 44, width: 768, height: 400 }
/** Кнопка «Utwórz umowę» и строка договора, CSS. */
export const CONTRACT_BUTTON = { x: 856, y: 250, width: 144, height: 36 }
export const CONTRACT_ROW = { x: 280, y: 302, width: 720, height: 76 }
/** «Przypisz samochód» (пунктир) и синий блок машины после выбора, CSS. */
export const ASSIGN_BUTTON = { x: 280, y: 488, width: 720, height: 56 }
export const CAR_BOX = { x: 280, y: 480, width: 720, height: 72 }

function driversPage(ctx: CanvasRenderingContext2D, W: number, H: number) {
  adminShell(ctx, W, H, 'Kierowcy', { pending: 1, bell: 1 })
  const tiles: [string, string, string, string, string][] = [
    ['users', TB.blue5, TB.blue4, '7', tr('Łącznie', 'Total')],
    ['circle-check-big', TB.green5, TB.green4, '4', tr('Aktywni', 'Active')],
    ['clock', TB.yellow5, TB.yellow4, '2', tr('Oczekujący', 'Pending')],
    ['circle-x', TB.red5, TB.red4, '1', tr('Nieaktywni', 'Inactive')],
  ]
  tiles.forEach(([glyph, tone, ink, value, label], i) => statTile(ctx, 288 + i * 244, 96, 228, glyph, tone, ink, value, label))
  searchBox(ctx, 288, 202, 760, tr('Szukaj kierowców...', 'Search drivers...'))
  selectBox(ctx, 1064, 202, 184, tr('Wszystkie statusy', 'All statuses'))
  const names = ['Andrii Melnyk', 'Ion Rusu', HERO.name, 'Nino Beridze', 'Marek Wójcik', 'Piotr Lis']
  names.forEach((name, i) => {
    const x = 288 + (i % 3) * 325
    const y = 272 + Math.floor(i / 3) * 224
    box(ctx, x, y, 309, 208, 12, '#0C0F12', TB.border)
    avatarCircle(ctx, x + 44, y + 44, 24, name.split(' ').map((part) => part[0]).join(''), TB.green5, TB.green4)
    text(ctx, name, x + 80, y + 40, { size: 16, weight: 600, color: TB.text })
  })
  box(ctx, 0, 0, W, H, 0, 'rgba(0, 0, 0, 0.6)')
}

function dialogHeader(ctx: CanvasRenderingContext2D, tab: 'Informacje' | 'Umowy', height: number) {
  const d = DRIVER_DIALOG
  box(ctx, d.x, d.y, d.width, height, 24, TB.card, TB.border)
  avatarCircle(ctx, d.x + 56, d.y + 56, 32, HERO.initials, TB.yellow5, TB.yellow4)
  text(ctx, HERO.name, d.x + 104, d.y + 50, { size: 20, weight: 700, color: TB.text })
  const pw = pill(ctx, tr('Oczekuje', 'Pending'), d.x + 104, d.y + 62, TB.yellow5, TB.yellow4, { padX: 12, height: 24 })
  box(ctx, d.x + 112 + pw, d.y + 62, 64, 24, 12, 'rgba(255, 191, 0, 0.2)', 'rgba(255, 191, 0, 0.3)')
  text(ctx, tr('Najem', 'Rental'), d.x + 144 + pw, d.y + 78, { size: 12, weight: 500, color: TB.gold, align: 'center' })
  box(ctx, d.x + 184 + pw, d.y + 62, 52, 24, 12, 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.3)')
  icon(ctx, 'send', d.x + 194 + pw, d.y + 68, 12, TB.blue4)
  text(ctx, 'TG', d.x + 211 + pw, d.y + 78, { size: 12, weight: 500, color: TB.blue4 })
  text(ctx, HERO.telegram, d.x + 104, d.y + 106, { size: 13, weight: 400, color: TB.blue4 })
  icon(ctx, 'x', d.x + d.width - 44, d.y + 24, 20, TB.dim)
  box(ctx, d.x, d.y + 172, d.width, 1, 0, TB.border)
  const tabs: [string, string, string][] = [['users', 'Informacje', 'Information'], ['dollar-sign', 'Zarobki', 'Earnings'], ['file-text', 'Dokumenty', 'Documents'], ['briefcase', 'Umowy', 'Contracts']]
  let x = d.x + 16
  tabs.forEach(([glyph, key, en]) => {
    const on = key === tab
    const label = tr(key, en)
    const lw = measure(ctx, label, { size: 14, weight: 500 })
    icon(ctx, glyph, x + 16, d.y + 142, 16, on ? TB.gold : TB.dim)
    text(ctx, label, x + 40, d.y + 155, { size: 14, weight: 500, color: on ? TB.gold : TB.dim })
    if (on) box(ctx, x, d.y + 170, lw + 56, 2, 1, TB.gold)
    x += lw + 56
  })
}

/** «Umowy»: заголовок, «Utwórz umowę», строка договора (если создан). */
export function drawDriverContracts(ctx: CanvasRenderingContext2D, W: number, H: number, contract: boolean) {
  driversPage(ctx, W, H)
  dialogHeader(ctx, 'Umowy', DRIVER_DIALOG.height)
  const d = DRIVER_DIALOG
  text(ctx, tr('Umowy kierowcy', 'Driver contracts'), d.x + 24, d.y + 228, { size: 16, weight: 600, color: TB.text })
  const b = CONTRACT_BUTTON
  const label = tr('Utwórz umowę', 'Create contract')
  /* Английская надпись длиннее кнопки: кнопка растёт влево, правый край на месте. */
  const bw = english() ? Math.max(b.width, 38 + measure(ctx, label, { size: 14, weight: 500 }) + 14) : b.width
  const bx = b.x + b.width - bw
  box(ctx, bx, b.y, bw, b.height, 16, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'file-text', bx + 14, b.y + 10, 16, TB.gold)
  text(ctx, label, bx + 38, b.y + 23, { size: 14, weight: 500, color: TB.gold })
  if (contract) {
    ctx.save()
    ctx.translate(CONTRACT_ROW.x, CONTRACT_ROW.y)
    drawContractRow(ctx)
    ctx.restore()
  } else text(ctx, tr('Brak umów', 'No contracts'), d.x + d.width / 2, CONTRACT_ROW.y + 44, { size: 14, weight: 400, color: TB.dim, align: 'center' })
}

/** Строка договора: шаблон, «Czeka na podpis», номер RNT, дата, «Pobierz PDF». */
export function drawContractRow(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = CONTRACT_ROW
  box(ctx, 0, 0, w, h, 12, '#13171d')
  const tw = text(ctx, tr('Umowa najmu pojazdu', 'Vehicle rental agreement'), 16, 30, { size: 15, weight: 500, color: TB.text })
  pill(ctx, tr('Czeka na podpis', 'Awaiting signature'), 28 + tw, 14, TB.yellow5, TB.yellow4, { border: false, height: 22 })
  const nw = text(ctx, HERO.contract, 16, 56, { size: 13, weight: 500, color: TB.dim, font: 'mono' })
  const dw = text(ctx, `  ·  ${HERO.date}  ·  `, 16 + nw, 56, { size: 13, weight: 400, color: TB.dim })
  text(ctx, tr('Pobierz PDF', 'Download PDF'), 16 + nw + dw, 56, { size: 13, weight: 500, color: TB.gold })
  void h
}

/** «Informacje»: плитки данных, «Samochód» — пунктирная кнопка или синий блок машины. */
export function drawDriverInfo(ctx: CanvasRenderingContext2D, W: number, H: number, car: boolean) {
  driversPage(ctx, W, H)
  const d = DRIVER_DIALOG
  dialogHeader(ctx, 'Informacje', 668)
  const tiles: [string, string][] = [
    [tr('Telefon', 'Phone'), HERO.phone], ['Email', HERO.email], [tr('PESEL', 'PESEL (Polish ID number)'), '•••••••••45'],
    [tr('Obywatelstwo', 'Citizenship'), tr('Ukraina', 'Ukraine')], [tr('Miasto', 'City'), 'Poznań'], [tr('Adres', 'Address'), 'ul. Głogowska 5'],
    [tr('Kod pocztowy', 'Postal code'), '60-001'], ['Bank', 'PKO BP'], ['IBAN', 'PL61 •••• 1234'],
  ]
  tiles.forEach(([label, value], i) => {
    const x = d.x + 24 + (i % 3) * 244
    const y = d.y + 196 + Math.floor(i / 3) * 70
    box(ctx, x, y, 232, 60, 12, '#13171d')
    text(ctx, label, x + 12, y + 24, { size: 12, weight: 400, color: TB.dim })
    text(ctx, value, x + 12, y + 45, { size: 14, weight: 400, color: TB.text })
  })
  icon(ctx, 'car', d.x + 24, 452, 16, TB.text)
  text(ctx, tr('Samochód', 'Vehicle'), d.x + 48, 465, { size: 15, weight: 600, color: TB.text })
  if (car) {
    ctx.save()
    ctx.translate(CAR_BOX.x, CAR_BOX.y)
    drawAssignedCar(ctx)
    ctx.restore()
  } else {
    const b = ASSIGN_BUTTON
    box(ctx, b.x, b.y, b.width, b.height, 12, '#13171d')
    ctx.save()
    ctx.setLineDash([6, 5])
    box(ctx, b.x, b.y, b.width, b.height, 12, null, '#3a4252', 1.5)
    ctx.restore()
    const label = tr('Przypisz samochód', 'Assign vehicle')
    /* Иконка и надпись — по центру кнопки; английская надпись короче польской. */
    const shift = english() ? (measure(ctx, 'Przypisz samochód', { size: 15, weight: 500 }) - measure(ctx, label, { size: 15, weight: 500 })) / 2 : 0
    icon(ctx, 'link-2', b.x + b.width / 2 - 78 + shift, b.y + 18, 20, TB.dim)
    text(ctx, label, b.x + b.width / 2 - 50 + shift, b.y + 33, { size: 15, weight: 500, color: TB.dim })
  }
  text(ctx, tr('Zarządzanie statusem', 'Status management'), d.x + 24, 600, { size: 15, weight: 600, color: TB.text })
  const actions: [string, string, string][] = [[tr('Aktywuj', 'Activate'), TB.green5, TB.green4], [tr('Zablokuj', 'Suspend'), TB.orange5, TB.orange4], [tr('Dezaktywuj', 'Deactivate'), TB.gray5, TB.gray4]]
  let x = d.x + 24
  actions.forEach(([label, tone, ink]) => {
    const w = measure(ctx, label, { size: 14, weight: 500 }) + 32
    box(ctx, x, 618, w, 36, 16, rgba(tone, 0.2))
    text(ctx, label, x + 16, 641, { size: 14, weight: 500, color: ink })
    x += w + 8
  })
}

/** Синий блок закреплённой машины: «Najem: … PLN/tydz.» и «Odepnij». */
export function drawAssignedCar(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = CAR_BOX
  box(ctx, 0.5, 0.5, w - 1, h - 1, 12, '#0f1622', 'rgba(59, 130, 246, 0.3)')
  box(ctx, 0.5, 0.5, w - 1, h - 1, 12, 'rgba(59, 130, 246, 0.08)')
  text(ctx, `${HERO.car} (${HERO.plate})`, 16, 30, { size: 16, weight: 600, color: TB.text })
  text(ctx, tr(`Najem: ${HERO.rent} PLN/tydz.`, `Rent: ${HERO.rent} PLN/week`), 16, 52, { size: 14, weight: 400, color: TB.dim })
  box(ctx, w - 124, h / 2 - 18, 108, 36, 16, 'rgba(239, 68, 68, 0.2)')
  icon(ctx, 'unlink', w - 110, h / 2 - 8, 16, TB.red4)
  text(ctx, tr('Odepnij', 'Unassign'), w - 88, h / 2 + 5, { size: 14, weight: 500, color: TB.red4 })
}

/** Окно выбора машины — выходит из щита плитой и возвращается. */
export const ASSIGN_MODAL = { width: 448, height: 196 }
export const ASSIGN_OPTION = { x: 24, y: 96, width: 400, height: 72 }

export function drawAssignModal(ctx: CanvasRenderingContext2D, hover: boolean) {
  const { width: w, height: h } = ASSIGN_MODAL
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  text(ctx, tr('Przypisz samochód', 'Assign vehicle'), 24, 40, { size: 18, weight: 700, color: TB.text })
  icon(ctx, 'x', w - 44, 22, 20, TB.dim)
  const kw = text(ctx, tr('Kierowca: ', 'Driver: '), 24, 72, { size: 14, weight: 400, color: TB.dim })
  text(ctx, HERO.name, 24 + kw, 72, { size: 14, weight: 600, color: TB.text })
  const o = ASSIGN_OPTION
  box(ctx, o.x, o.y, o.width, o.height, 12, hover ? 'rgba(255, 191, 0, 0.08)' : '#13171d', hover ? 'rgba(255, 191, 0, 0.35)' : TB.border)
  box(ctx, o.x + 14, o.y + 16, 40, 40, 12, 'rgba(59, 130, 246, 0.2)')
  icon(ctx, 'car', o.x + 24, o.y + 26, 20, TB.blue4)
  text(ctx, `${HERO.car} (${HERO.year})`, o.x + 68, o.y + 32, { size: 15, weight: 500, color: TB.text })
  text(ctx, `${HERO.plate} • hybrid`, o.x + 68, o.y + 52, { size: 12, weight: 400, color: TB.dim })
  text(ctx, tr(`${HERO.rent} PLN/tydz.`, `${HERO.rent} PLN/week`), o.x + o.width - 16, o.y + 42, { size: 15, weight: 700, color: TB.gold, align: 'right' })
  void h
}

/* Flota (FleetSection.tsx): сводка, поиск, карточки машин со сроками. */

export interface Car {
  name: string
  year: string
  plate: string
  status: [string, string, string]
  fuel: string
  km: string
  rent: string
  driver: string
  deadlines?: boolean
  /** Статус и пробег по-английски (fleet.status.*, пробег — toLocaleString). */
  en?: { status: string; km: string }
}

export const CARS: Car[] = [
  { name: 'Skoda Octavia', year: '2021', plate: 'WA 11111', status: ['W użyciu', TB.purple5, TB.purple4], fuel: 'diesel', km: '78 000 km', rent: '700', driver: 'Andrii Melnyk', en: { status: 'In use', km: '78,000 km' } },
  { name: HERO.car, year: HERO.year, plate: HERO.plate, status: ['Przypisany', TB.blue5, TB.blue4], fuel: 'hybrid', km: '15 000 km', rent: HERO.rent, driver: HERO.name, deadlines: true, en: { status: 'Assigned', km: '15,000 km' } },
  { name: 'Toyota Prius', year: '2022', plate: 'WA 12345', status: ['W użyciu', TB.purple5, TB.purple4], fuel: 'hybrid', km: '45 000 km', rent: '800', driver: 'Ion Rusu', en: { status: 'In use', km: '45,000 km' } },
]

/** Карточка машины (CSS 309 × 214) и её место в сетке «Floty». */
export const CAR_CARD = { width: 309, height: 214 }
export function carSlot(index: number) {
  return { x: 288 + index * 325, y: 272, width: CAR_CARD.width, height: CAR_CARD.height }
}
/** Чипы сроков на карточке Corolli, от её угла (CSS). Ширина — по надписи, как в
    продукте (px-2, иконка 14, gap-1, text-xs, рамка): ряд flex gap-2 без переноса,
    поэтому второй чип выходит за карточку — её overflow-hidden его обрезает. */
export const CHIPS = [
  { x: 20, y: 176, width: 187, height: 26, label: 'Ubezpieczenie 15.10.2026', labelEn: 'Insurance 15.10.2026', tone: TB.red5, ink: TB.red4 },
  { x: 215, y: 176, width: 153, height: 26, label: 'Przegląd 3.10.2026', labelEn: 'Inspection 3.10.2026', tone: TB.orange5, ink: TB.orange4 },
]

export function drawChip(ctx: CanvasRenderingContext2D, index: number, label?: string) {
  const chip = CHIPS[index]!
  box(ctx, 0.5, 0.5, chip.width - 1, chip.height - 1, 12, '#140c0c', rgba(chip.tone, 0.3))
  box(ctx, 0.5, 0.5, chip.width - 1, chip.height - 1, 12, rgba(chip.tone, 0.1))
  icon(ctx, 'triangle-alert', 8, 6, 14, chip.ink)
  text(ctx, label ?? tr(chip.label, chip.labelEn), 28, 17.5, { size: 12, weight: 400, color: chip.ink })
}

export function drawCarCard(ctx: CanvasRenderingContext2D, car: Car, chips = true) {
  const { width: w, height: h } = CAR_CARD
  /* overflow-hidden карточки: второй чип сроков обрезается её краем. */
  ctx.save()
  rr(ctx, 0, 0, w, h, 12)
  ctx.clip()
  box(ctx, 0.5, 0.5, w - 1, h - 1, 12, '#0C0F12', TB.border)
  const tone = car.status[0] === 'Dostępny' ? TB.green5 : TB.blue5
  box(ctx, 20, 20, 48, 48, 12, rgba(tone, 0.2))
  icon(ctx, 'car', 32, 32, 24, car.status[0] === 'Dostępny' ? TB.green4 : TB.blue4)
  text(ctx, car.name, 80, 40, { size: 16, weight: 600, color: TB.text })
  text(ctx, `${car.year} • ${car.plate}`, 80, 60, { size: 14, weight: 400, color: TB.dim })
  pill(ctx, tr(car.status[0], car.en?.status ?? car.status[0]), w - 20, 20, car.status[1], car.status[2], { align: 'right', height: 22 })
  const grid: [string, string, string][] = [
    ['fuel', car.fuel, TB.dim],
    ['settings-2', 'automatic', TB.dim],
    ['chart-column', tr(car.km, car.en?.km ?? car.km), TB.dim],
    ['dollar-sign', tr(`${car.rent} PLN/tydz.`, `${car.rent} PLN/week`), TB.gold],
  ]
  grid.forEach(([glyph, value, tone2], i) => {
    const x = 20 + (i % 2) * 140
    const y = 88 + Math.floor(i / 2) * 26
    icon(ctx, glyph, x, y, 16, tone2 === TB.gold ? TB.gold : TB.dim)
    text(ctx, value, x + 24, y + 13, { size: 14, weight: tone2 === TB.gold ? 600 : 400, color: tone2 === TB.gold ? TB.gold : TB.text })
  })
  box(ctx, 20, 142, w - 40, 26, 16, 'rgba(59, 130, 246, 0.1)')
  icon(ctx, 'user', 30, 147, 16, TB.blue4)
  text(ctx, car.driver, 54, 160, { size: 13, weight: 400, color: TB.text })
  if (car.deadlines && chips) {
    CHIPS.forEach((chip, i) => {
      ctx.save()
      ctx.translate(chip.x, chip.y)
      drawChip(ctx, i)
      ctx.restore()
    })
  }
  ctx.restore()
}

/** Flota; cards — рисовать ли карточки на местах (иначе пустые гнёзда под плиты). */
export function drawFleet(ctx: CanvasRenderingContext2D, W: number, H: number, cards: boolean, bell = 0) {
  adminShell(ctx, W, H, 'Flota', { pending: 0, bell })
  const tiles: [string, string, string, string, string][] = [
    ['car', TB.blue5, TB.blue4, '3', tr('Łącznie', 'Total')],
    ['circle-check-big', TB.green5, TB.green4, '0', tr('Dostępne', 'Available')],
    ['user', TB.purple5, TB.purple4, '3', tr('Przypisane', 'Assigned')],
    ['wrench', TB.orange5, TB.orange4, '0', tr('W serwisie', 'In maintenance')],
  ]
  tiles.forEach(([glyph, tone, ink, value, label], i) => statTile(ctx, 288 + i * 244, 96, 228, glyph, tone, ink, value, label))
  searchBox(ctx, 288, 202, 610, tr('Szukaj pojazdów...', 'Search vehicles...'))
  selectBox(ctx, 914, 202, 170, tr('Wszystkie statusy', 'All statuses'))
  box(ctx, 1100, 202, 148, 46, 12, TB.gold)
  icon(ctx, 'plus', 1116, 215, 20, TB.bg)
  text(ctx, tr('Dodaj pojazd', 'Add vehicle'), 1142, 230, { size: 14, weight: 600, color: TB.bg })
  CARS.forEach((car, i) => {
    const s = carSlot(i)
    if (cards) {
      ctx.save()
      ctx.translate(s.x, s.y)
      drawCarCard(ctx, car)
      ctx.restore()
    } else box(ctx, s.x, s.y, s.width, s.height, 12, 'rgba(255, 255, 255, 0.012)', 'rgba(255, 255, 255, 0.05)')
  })
}

/* Окно машины → «Serwis» (FleetSection.tsx): история и новая запись. */

export const SERVICE = {
  dialog: { x: 304, y: 56, width: 672, height: 560 },
  add: { x: 876, y: 272, width: 76, height: 36 },
  firstRow: { x: 328, y: 324, width: 624, height: 92 },
}

function serviceRow(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, date: string, desc: string, meta: string) {
  const { width: w, height: h } = SERVICE.firstRow
  box(ctx, x, y, w, h, 12, '#13171d')
  pill(ctx, kind, x + 16, y + 14, TB.orange5, TB.orange4, { border: false, height: 22 })
  text(ctx, date, x + w - 16, y + 30, { size: 13, weight: 400, color: TB.dim, align: 'right' })
  text(ctx, desc, x + 16, y + 58, { size: 14, weight: 400, color: TB.text })
  text(ctx, meta, x + 16, y + 78, { size: 12, weight: 400, color: TB.dim })
  void h
}

/** Описание новой записи сервиса — его печатает форма «Dodaj wpis serwisowy». */
export const SERVICE_NOTE = { pl: 'Przegląd okresowy przed terminem', en: 'Periodic inspection before the due date' }

export function drawServiceRow(ctx: CanvasRenderingContext2D) {
  serviceRow(ctx, 0, 0, 'GENERAL SERVICE', HERO.date, tr(SERVICE_NOTE.pl, SERVICE_NOTE.en), tr('Koszt: 350.00 PLN · Przebieg: 15 000 km · Wykonał: Auto-Serwis Poznań', 'Cost: 350.00 PLN · Mileage: 15,000 km · Performed by: Auto-Serwis Poznań'))
}

/** Flota с открытым окном Corolli на вкладке «Serwis»; entry — новая запись уже в истории. */
export function drawServiceHistory(ctx: CanvasRenderingContext2D, W: number, H: number, entry: boolean) {
  drawFleet(ctx, W, H, true)
  box(ctx, 0, 0, W, H, 0, 'rgba(0, 0, 0, 0.6)')
  const d = SERVICE.dialog
  box(ctx, d.x, d.y, d.width, d.height, 24, TB.card, TB.border)
  text(ctx, `${HERO.car} (${HERO.year})`, d.x + 24, d.y + 46, { size: 20, weight: 700, color: TB.text })
  const pw = measure(ctx, HERO.plate, { size: 12, weight: 500, font: 'mono' }) + 20
  box(ctx, d.x + 24, d.y + 60, pw, 24, 12, '#12161C')
  text(ctx, HERO.plate, d.x + 34, d.y + 76, { size: 12, weight: 500, color: TB.text, font: 'mono' })
  pill(ctx, tr('Przypisany', 'Assigned'), d.x + 32 + pw, d.y + 61, TB.blue5, TB.blue4, { height: 22 })
  icon(ctx, 'x', d.x + d.width - 44, d.y + 24, 20, TB.dim)
  box(ctx, d.x, d.y + 150, d.width, 1, 0, TB.border)
  let x = d.x + 16
  ;(
    [
      ['Szczegóły', 'Details'],
      ['Serwis', 'Maintenance'],
      ['Finanse', 'Financials'],
    ] as const
  ).forEach(([key, en]) => {
    const on = key === 'Serwis'
    const label = tr(key, en)
    const lw = measure(ctx, label, { size: 14, weight: 500 })
    text(ctx, label, x + 16, d.y + 133, { size: 14, weight: 500, color: on ? TB.gold : TB.dim })
    if (on) box(ctx, x, d.y + 148, lw + 32, 2, 1, TB.gold)
    x += lw + 32
  })
  text(ctx, tr('Historia serwisowa', 'Service history'), d.x + 24, d.y + 242, { size: 16, weight: 600, color: TB.text })
  const a = SERVICE.add
  box(ctx, a.x, a.y, a.width, a.height, 16, 'rgba(255, 191, 0, 0.2)')
  icon(ctx, 'plus', a.x + 12, a.y + 10, 16, TB.gold)
  text(ctx, tr('Dodaj', 'Add'), a.x + 34, a.y + 23, { size: 14, weight: 500, color: TB.gold })
  const r = SERVICE.firstRow
  const offset = entry ? r.height + 12 : 0
  if (entry) {
    ctx.save()
    ctx.translate(r.x, r.y)
    drawServiceRow(ctx)
    ctx.restore()
  }
  serviceRow(ctx, r.x, r.y + offset, 'OIL CHANGE', '12.06.2026', tr('Wymiana oleju i filtrów', 'Oil and filter change'), tr('Koszt: 289.99 PLN · Przebieg: 9 800 km · Wykonał: Auto-Serwis Poznań', 'Cost: 289.99 PLN · Mileage: 9,800 km · Performed by: Auto-Serwis Poznań'))
  serviceRow(ctx, r.x, r.y + offset + r.height + 12, 'TIRE CHANGE', '14.04.2026', tr('Opony letnie', 'Summer tires'), tr('Koszt: 180.00 PLN · Przebieg: 6 200 km', 'Cost: 180.00 PLN · Mileage: 6,200 km'))
}

/** «Dodaj wpis serwisowy» — плита с формой; rodzaj prac — «Przegląd ogólny». */
export const SERVICE_FORM = { width: 448, height: 388 }
export const SERVICE_SUBMIT: [number, number] = [224, 350]

export function drawServiceForm(ctx: CanvasRenderingContext2D, filled: number) {
  const { width: w, height: h } = SERVICE_FORM
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  text(ctx, tr('Dodaj wpis serwisowy', 'Add service record'), 24, 42, { size: 18, weight: 700, color: TB.text })
  icon(ctx, 'x', w - 44, 24, 20, TB.dim)
  text(ctx, tr('Rodzaj prac', 'Work type'), 24, 80, { size: 12, weight: 400, color: TB.dim })
  selectBox(ctx, 24, 90, w - 48, filled > 0 ? tr('Przegląd ogólny', 'General service') : tr('Wymiana oleju', 'Oil change'), 42)
  text(ctx, tr('Opis', 'Description'), 24, 158, { size: 12, weight: 400, color: TB.dim })
  box(ctx, 24, 168, w - 48, 64, 12, '#101419', TB.border)
  if (filled > 1) text(ctx, tr(SERVICE_NOTE.pl, SERVICE_NOTE.en), 38, 194, { size: 14, weight: 400, color: TB.text })
  text(ctx, tr('Koszt PLN', 'Cost PLN'), 24, 258, { size: 12, weight: 400, color: TB.dim })
  text(ctx, tr('Przebieg km', 'Mileage km'), 232, 258, { size: 12, weight: 400, color: TB.dim })
  box(ctx, 24, 268, 192, 42, 12, '#101419', TB.border)
  box(ctx, 232, 268, 192, 42, 12, '#101419', TB.border)
  if (filled > 2) {
    text(ctx, '350', 38, 294, { size: 14, weight: 400, color: TB.text })
    text(ctx, '15000', 246, 294, { size: 14, weight: 400, color: TB.text })
  }
  box(ctx, 24, 326, w - 48, 44, 12, TB.gold)
  icon(ctx, 'wrench', w / 2 - 36, 338, 18, TB.bg)
  text(ctx, tr('Dodaj', 'Add'), w / 2 - 10, 353, { size: 14, weight: 600, color: TB.bg })
  void h
}

/** Колокольчик панели крупно: кнопка 36 × 36 и золотой значок с числом. */
export function drawBell(ctx: CanvasRenderingContext2D, count: number) {
  box(ctx, 4, 8, 36, 36, 16, '#12161C', TB.border)
  icon(ctx, 'bell', 12, 16, 20, TB.text)
  if (count > 0) {
    ctx.beginPath()
    ctx.arc(38, 10, 9, 0, Math.PI * 2)
    ctx.fillStyle = TB.gold
    ctx.fill()
    text(ctx, String(count), 38, 13.5, { size: 10, weight: 700, color: TB.bg, align: 'center' })
  }
}

/** «Powiadomienia» (NotificationBell.tsx): одна непрочитанная — утренняя проверка (cron.service.ts). */
export const NOTICE = { width: 320, height: 146 }

export function drawNotifications(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = NOTICE
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  text(ctx, tr('Powiadomienia', 'Notifications'), 16, 30, { size: 14, weight: 600, color: TB.text })
  const mark = tr('Oznacz jako przeczytane', 'Mark all read')
  const lw = measure(ctx, mark, { size: 12, weight: 400 })
  icon(ctx, 'check-check', w - 16 - lw - 18, 18, 14, TB.gold)
  text(ctx, mark, w - 16, 30, { size: 12, weight: 400, color: TB.gold, align: 'right' })
  box(ctx, 0, 46, w, 1, 0, TB.border)
  box(ctx, 1, 47, w - 2, h - 48, 0, 'rgba(255, 191, 0, 0.05)')
  icon(ctx, 'triangle-alert', 16, 62, 16, TB.yellow5)
  /* Утреннее уведомление cron.service.ts — в продукте только по-польски; английский — перевод. */
  text(ctx, tr('🔧 Przegląd pojazdu', '🔧 Vehicle inspection'), 44, 74, { size: 14, weight: 500, color: TB.text })
  para(ctx, tr(`Pojazd ${HERO.car} (${HERO.plate}) wymaga uwagi.`, `Vehicle ${HERO.car} (${HERO.plate}) needs attention.`), 44, 94, 240, 16, { size: 12, weight: 400, color: TB.dim })
  text(ctx, tr('teraz', 'now'), 44, 128, { size: 11, weight: 400, color: 'rgba(143, 150, 163, 0.7)' })
  ctx.beginPath()
  ctx.arc(w - 20, 70, 4, 0, Math.PI * 2)
  ctx.fillStyle = TB.gold
  ctx.fill()
}

/* ── Приложение водителя, iOS (ios/Driver/Features/*) ─────────────────── */

/** Статус документа в приложении (Components.swift): их всего три. */
export type NativeDoc = 'approved' | 'pending' | 'rejected'

const NATIVE_DOCS: [string, string, string][] = [
  ['brain', 'Badanie psychologiczne', 'Psychological test'],
  ['heart', 'Orzeczenie lekarskie', 'Medical certificate'],
  ['shield-check', 'Zaświadczenie o niekaralności', 'Criminal record certificate'],
]
const NATIVE_TONE: Record<NativeDoc, [string, string, string]> = {
  approved: ['Zatwierdzony', TB.green4, 'Approved'],
  pending: ['W weryfikacji', TB.iosAmber, 'In review'],
  rejected: ['Odrzucony', TB.iosRed, 'Rejected'],
}

/** Строка документа i в «Dokumenty»: карточка и (у отклонённого) рамка причины. */
export function nativeDocRow(index: number) {
  const y = 244 + index * 136
  return { x: 16, y, width: 361, height: index === 2 ? 188 : 128, reason: { x: 32, y: y + 70, width: 329, height: 52 }, upload: { x: 32, y: y + (index === 2 ? 132 : 72), width: 329, height: 40 } }
}

/** Причина отказа в приложении: красная рамка без подписи (DocumentsView.swift). */
export function drawReasonBox(ctx: CanvasRenderingContext2D, withText = true) {
  const r = nativeDocRow(2).reason
  box(ctx, 0, 0, r.width, r.height, 8, '#1d1214')
  box(ctx, 0, 0, r.width, r.height, 8, 'rgba(247, 112, 112, 0.1)')
  if (withText) para(ctx, tr(HERO.reason, HERO.reasonEn), 8, 21, r.width - 16, 17, { size: 13, weight: 400, color: TB.iosRed, font: 'sf' })
}

/** «Dokumenty» в приложении: два одобрены, третий — third; reason: 0 — нет,
    1 — рамка причины (пустая, причина ещё летит), 2 — с текстом. */
export function drawNativeDocs(ctx: CanvasRenderingContext2D, third: NativeDoc, reason: 0 | 1 | 2) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  statusBar(ctx, 1, TB.text)
  iosLargeTitle(ctx, tr('Dokumenty', 'Documents'))
  text(ctx, tr('Wymagane', 'Required'), 16, 176, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  para(ctx, tr('Biuro nie aktywuje Cię, dopóki te trzy dokumenty nie zostaną zatwierdzone.', 'The office cannot activate you until these three are approved.'), 16, 198, 361, 17, { size: 13, weight: 400, color: TB.dim, font: 'sf' })
  NATIVE_DOCS.forEach(([glyph, title, titleEn], i) => {
    const state: NativeDoc = i < 2 ? 'approved' : third
    const r = nativeDocRow(i)
    const withReason = i === 2 && reason > 0
    iosCard(ctx, r.x, r.y, r.width, withReason ? 188 : 128)
    const [label, tint, labelEn] = NATIVE_TONE[state]
    icon(ctx, glyph, 32, r.y + 16, 22, tint)
    text(ctx, tr(title, titleEn), 64, r.y + 33, { size: 15, weight: 500, color: TB.text, font: 'sf' })
    iosPill(ctx, tr(label, labelEn), 361, r.y + 16, tint)
    text(ctx, tr('Przesłano 28 wrz 2026', 'Uploaded Sep 28, 2026'), 64, r.y + 54, { size: 12, weight: 400, color: TB.dim, font: 'sf' })
    if (withReason) {
      ctx.save()
      ctx.translate(r.reason.x, r.reason.y)
      drawReasonBox(ctx, reason === 2)
      ctx.restore()
    }
    const u = r.upload
    const top = withReason ? u.y : r.y + 72
    box(ctx, u.x, top, u.width, 40, 16, TB.secondary, TB.border)
    const upload = tr('Prześlij nowy', 'Replace')
    /* Иконка и надпись — по центру кнопки; английская надпись короче. */
    const shift = english() ? (measure(ctx, 'Prześlij nowy', { size: 15, weight: 500, font: 'sf' }) - measure(ctx, upload, { size: 15, weight: 500, font: 'sf' })) / 2 : 0
    icon(ctx, 'upload', 196.5 - 52 + shift, top + 12, 16, TB.text)
    text(ctx, upload, 196.5 - 30 + shift, top + 25, { size: 15, weight: 500, color: TB.text, font: 'sf' })
  })
  iosTabBar(ctx, 2)
}

/** Карточка договора в «Umowy» и кнопка «Podpisz», в точках. */
export const NATIVE_CONTRACT = { x: 16, y: 112, width: 361, height: 124, sign: { x: 200, y: 176, width: 161, height: 44 } }

/** Карточка договора в своих осях (0…361 × 0…124, подписанная — 140). */
export function drawNativeContractCard(ctx: CanvasRenderingContext2D, signed: boolean) {
  const c = NATIVE_CONTRACT
  iosCard(ctx, 0.5, 0.5, c.width - 1, (signed ? 140 : c.height) - 1)
  text(ctx, HERO.contract, 16, 30, { size: 15, weight: 600, color: TB.text, font: 'mono' })
  text(ctx, tr('Od 1 paź 2026', 'From Oct 1, 2026'), 16, 49, { size: 12, weight: 400, color: TB.dim, font: 'sf' })
  if (signed) {
    iosPill(ctx, tr('Podpisana', 'Signed'), c.width - 16, 16, TB.green4)
    icon(ctx, 'circle-check', 16, 62, 14, TB.green4, 2.4)
    text(ctx, tr('Podpisano 28 wrz 2026', 'Signed Sep 28, 2026'), 35, 74, { size: 12, weight: 500, color: TB.green4, font: 'sf' })
    box(ctx, 16, 88, 329, 40, 16, TB.secondary, TB.border)
    text(ctx, tr('Czytaj', 'Read'), 180.5, 113, { size: 15, weight: 500, color: TB.text, font: 'sf', align: 'center' })
  } else {
    iosPill(ctx, tr('Czeka na Twój podpis', 'Awaiting your signature'), c.width - 16, 16, TB.iosAmber)
    const sy = c.sign.y - c.y
    box(ctx, 16, sy, 160, 44, 16, TB.secondary, TB.border)
    text(ctx, tr('Czytaj', 'Read'), 96, sy + 27, { size: 15, weight: 500, color: TB.text, font: 'sf', align: 'center' })
    const sx = c.sign.x - c.x
    box(ctx, sx, sy, c.sign.width, c.sign.height, 16, goldFill(ctx, sx, sy, c.sign.width, c.sign.height))
    text(ctx, tr('Podpisz', 'Sign'), sx + c.sign.width / 2, sy + 27, { size: 17, weight: 600, color: TB.bg, font: 'sf', align: 'center' })
  }
}

export function drawNativeContracts(ctx: CanvasRenderingContext2D, signed: boolean, card = true) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  statusBar(ctx, 1, TB.text)
  icon(ctx, 'chevron-left', 10, 70, 22, TB.gold, 2.6)
  text(ctx, tr('Panel', 'Dashboard'), 32, 87, { size: 17, weight: 400, color: TB.gold, font: 'sf' })
  text(ctx, tr('Umowy', 'Contracts'), 196.5, 87, { size: 17, weight: 600, color: TB.text, font: 'sf', align: 'center' })
  const c = NATIVE_CONTRACT
  if (card) {
    ctx.save()
    ctx.translate(c.x, c.y)
    drawNativeContractCard(ctx, signed)
    ctx.restore()
  } else box(ctx, c.x, c.y, c.width, 140, 16, 'rgba(255, 255, 255, 0.012)', 'rgba(255, 255, 255, 0.04)')
  iosTabBar(ctx, 0)
}

/** Лист «Podpis»: белое поле 220 pt, «Wyczyść» и «Podpisz umowę» (ContractsView.swift). */
export const SIGN_SHEET = { width: 393, height: 520 }
export const SIGN_FIELD = { x: 16, y: 116, width: 361, height: 220 }
export const SIGN_SUBMIT = { x: 200, y: 356, width: 177, height: 48 }

export function drawSignSheet(ctx: CanvasRenderingContext2D, ready: boolean) {
  const { width: w, height: h } = SIGN_SHEET
  box(ctx, 0.5, 0.5, w - 1, h - 1, 28, TB.popover, TB.border)
  text(ctx, tr('Anuluj', 'Cancel'), 16, 40, { size: 17, weight: 400, color: TB.gold, font: 'sf' })
  text(ctx, tr('Podpis', 'Signature'), w / 2, 40, { size: 17, weight: 600, color: TB.text, font: 'sf', align: 'center' })
  para(ctx, tr(`Podpisz się palcem w polu poniżej. To jest prawnie Twój podpis na umowie ${HERO.contract}.`, `Sign with your finger in the box below. This is legally your signature on contract ${HERO.contract}.`), 16, 76, w - 32, 18, { size: 13, weight: 400, color: TB.dim, font: 'sf' })
  const f = SIGN_FIELD
  box(ctx, f.x, f.y, f.width, f.height, 16, '#FFFFFF', TB.border)
  box(ctx, 16, SIGN_SUBMIT.y, 176, 48, 16, TB.secondary, TB.border)
  text(ctx, tr('Wyczyść', 'Clear'), 104, SIGN_SUBMIT.y + 30, { size: 15, weight: 500, color: TB.text, font: 'sf', align: 'center' })
  ctx.save()
  ctx.globalAlpha = ready ? 1 : 0.5
  const s = SIGN_SUBMIT
  box(ctx, s.x, s.y, s.width, s.height, 16, goldFill(ctx, s.x, s.y, s.width, s.height))
  text(ctx, tr('Podpisz umowę', 'Sign contract'), s.x + s.width / 2, s.y + 30, { size: 17, weight: 600, color: TB.bg, font: 'sf', align: 'center' })
  ctx.restore()
  void h
}

/** Уведомление в приложении: «🎉 Profil zweryfikowany» (notification.service.ts), падает сверху. */
export const VERIFIED = { width: 361, height: 88 }

export function drawVerified(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = VERIFIED
  box(ctx, 0.5, 0.5, w - 1, h - 1, 20, '#141a16', 'rgba(74, 222, 128, 0.35)')
  box(ctx, 0.5, 0.5, w - 1, h - 1, 20, 'rgba(255, 191, 0, 0.05)')
  icon(ctx, 'circle-check', 16, 18, 24, TB.green4, 2.2)
  /* notification.service.ts — в продукте только по-польски; английский — перевод. */
  text(ctx, tr('🎉 Profil zweryfikowany', '🎉 Profile verified'), 52, 34, { size: 15, weight: 600, color: TB.text, font: 'sf' })
  para(ctx, tr('Wszystkie wymagane dokumenty zostały zatwierdzone — Twój profil jest zweryfikowany.', 'All required documents have been approved. Your profile is verified.'), 52, 54, w - 80, 16, { size: 12.5, weight: 400, color: TB.dim, font: 'sf' })
  ctx.beginPath()
  ctx.arc(w - 18, 28, 4, 0, Math.PI * 2)
  ctx.fillStyle = TB.gold
  ctx.fill()
  void h
}

function statTileIOS(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, glyph: string, tint: string, value: string, label: string) {
  box(ctx, x, y, w, 104, 16, rgba(tint, 0.08), rgba(tint, 0.25))
  icon(ctx, glyph, x + w / 2 - 11, y + 16, 22, tint)
  text(ctx, value, x + w / 2, y + 68, { size: 22, weight: 700, color: TB.text, font: 'sf', align: 'center' })
  text(ctx, label, x + w / 2, y + 88, { size: 11, weight: 400, color: TB.dim, font: 'sf', align: 'center' })
}

/** Карточка «Twój samochód» на «Panel» — в v3.2 в неё садится запись сервиса с MacBook. */
export const NATIVE_CAR = { x: 16, y: 520, width: 361, height: 80 }

export function drawNativeCarCard(ctx: CanvasRenderingContext2D) {
  iosCard(ctx, 0, 0, NATIVE_CAR.width, NATIVE_CAR.height)
  text(ctx, tr('Twój samochód', 'Your car'), 16, 28, { size: 13, weight: 600, color: TB.dim, font: 'sf' })
  icon(ctx, 'car', 16, 38, 26, TB.gold)
  text(ctx, `${HERO.car} ${HERO.year}`, 54, 52, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  text(ctx, HERO.plate, 54, 70, { size: 13, weight: 400, color: TB.dim, font: 'mono' })
  /* Деньги в приложении — по локали телефона (Money.formattedRounded): en — «PLN 850». */
  text(ctx, tr(`${HERO.rent} zł`, `PLN ${HERO.rent}`), 345, 52, { size: 17, weight: 600, color: TB.gold, font: 'sf', align: 'right' })
  text(ctx, tr('tygodniowo', 'per week'), 345, 70, { size: 12, weight: 400, color: TB.dim, font: 'sf', align: 'right' })
}

/** «Panel» (вкладка Start): «Cześć, Oleksandr», статус, плитки, машина. */
export function drawNativePanel(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  statusBar(ctx, 1, TB.text)
  box(ctx, 337, 56, 40, 40, 20, 'rgba(33, 37, 45, 0.9)', 'rgba(255, 255, 255, 0.08)')
  icon(ctx, 'bell', 347, 66, 20, TB.text)
  iosLargeTitle(ctx, tr('Panel', 'Dashboard'))
  text(ctx, tr(`Cześć, ${HERO.first}`, `Hello, ${HERO.first}`), 16, 178, { size: 22, weight: 700, color: TB.text, font: 'sf' })
  text(ctx, tr('poniedziałek, 28 września', 'Monday, September 28'), 16, 200, { size: 15, weight: 400, color: TB.dim, font: 'sf' })
  iosCard(ctx, 16, 216, 361, 56)
  text(ctx, tr('Twój status', 'Your status'), 32, 250, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  iosPill(ctx, tr('Aktywny', 'Active'), 361, 233, TB.green4)
  statTileIOS(ctx, 16, 288, 176.5, 'banknote', TB.green4, tr('1 240 zł', 'PLN 1,240'), tr('Ten tydzień', 'This week'))
  statTileIOS(ctx, 200.5, 288, 176.5, 'car', TB.iosInfo, '38', tr('Kursy w tym tygodniu', 'Rides this week'))
  statTileIOS(ctx, 16, 400, 176.5, 'calendar', TB.gold, tr('1 240 zł', 'PLN 1,240'), tr('Ten miesiąc', 'This month'))
  statTileIOS(ctx, 200.5, 400, 176.5, 'star', TB.iosAmber, '5.0', tr('Ocena', 'Rating'))
  ctx.save()
  ctx.translate(NATIVE_CAR.x, NATIVE_CAR.y)
  drawNativeCarCard(ctx)
  ctx.restore()
  iosCard(ctx, 16, 616, 361, 140)
  text(ctx, tr('Na skróty', 'Quick actions'), 32, 644, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  const rows: [string, string, string][] = [
    ['message-circle', tr('Zapytaj asystenta', 'Ask the assistant'), tr('Pytania o najem, dokumenty i grafik', 'Questions about rent, documents, shifts')],
    ['file-text', tr('Twoje umowy', 'Your contracts'), tr('Przeczytaj i podpisz umowę najmu', 'Read and sign your rental agreement')],
  ]
  rows.forEach(([glyph, title, sub], i) => {
    const y = 664 + i * 46
    icon(ctx, glyph, 32, y + 4, 22, TB.gold)
    text(ctx, title, 66, y + 14, { size: 15, weight: 500, color: TB.text, font: 'sf' })
    text(ctx, sub, 66, y + 31, { size: 12, weight: 400, color: TB.dim, font: 'sf' })
    icon(ctx, 'chevron-right', 343, y + 8, 16, TB.dim)
  })
  iosTabBar(ctx, 0)
}

/** «Grafik»: сентябрь 2026, с 21-го — дни аренды машины. */
export function drawNativeSchedule(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  statusBar(ctx, 1, TB.text)
  iosLargeTitle(ctx, tr('Grafik', 'Schedule'))
  icon(ctx, 'chevron-left', 24, 162, 20, TB.gold, 2.4)
  icon(ctx, 'chevron-right', 349, 162, 20, TB.gold, 2.4)
  text(ctx, tr('Wrzesień 2026', 'September 2026'), 196.5, 178, { size: 17, weight: 600, color: TB.text, font: 'sf', align: 'center' })
  const cell = (361 - 24) / 7
  /* Первый день недели — понедельник (ScheduleView.swift), буквы — по локали. */
  const weekdays = english() ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['P', 'W', 'Ś', 'C', 'P', 'S', 'N']
  weekdays.forEach((d, i) => text(ctx, d, 16 + i * (cell + 4) + cell / 2, 208, { size: 11, weight: 600, color: TB.dim, font: 'sf', align: 'center' }))
  for (let day = 1; day <= 30; day++) {
    /* 1 сентября 2026 — вторник: первый день во второй колонке. */
    const col = day % 7
    const row = Math.floor(day / 7)
    const x = 16 + col * (cell + 4)
    const y = 218 + row * 50
    const weekend = col >= 5
    const rental = day >= 21
    const fill = rental ? rgba(TB.gold, 0.85) : weekend ? 'rgba(156, 163, 175, 0.5)' : rgba(TB.green4, 0.85)
    box(ctx, x, y, cell, 46, 10, fill, day === 28 ? TB.gold : null, 2)
    const ink = rental || !weekend ? TB.bg : TB.text
    text(ctx, String(day), x + cell / 2, y + 22, { size: 15, weight: day === 28 ? 700 : 500, color: ink, font: 'sf', align: 'center' })
    icon(ctx, rental ? 'key-round' : weekend ? 'clock' : 'car', x + cell / 2 - 5, y + 28, 10, ink, 2.6)
  }
  const legend: [string, string][] = [
    [rgba(TB.green4, 0.85), tr('Praca', 'Working')],
    ['rgba(156, 163, 175, 0.5)', tr('Wolne', 'Day off')],
    [rgba(TB.gold, 0.85), tr('Najem', 'Rental period')],
    [rgba(TB.iosInfo, 0.85), tr('Zmiana dzielona', 'Shared shift')],
  ]
  /* Английская легенда длиннее: если ряд не входит в экран (16…377), зазор ужимается. */
  const labels = () => legend.reduce((sum, [, label]) => sum + measure(ctx, label, { size: 12, weight: 400, font: 'sf' }), 0)
  const gap = english() ? Math.min(14, (377 - 16 - 12 - labels()) / 3 - 14) : 14
  let lx = 16
  legend.forEach(([tone, label]) => {
    ctx.beginPath()
    ctx.arc(lx + 4, 488, 4, 0, Math.PI * 2)
    ctx.fillStyle = tone
    ctx.fill()
    lx += 14 + text(ctx, label, lx + 12, 492, { size: 12, weight: 400, color: TB.dim, font: 'sf' }) + gap
  })
  iosCard(ctx, 16, 510, 361, 88)
  icon(ctx, 'key-round', 32, 526, 20, TB.gold)
  text(ctx, tr('Najem', 'Rental'), 62, 542, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  text(ctx, `${HERO.car} · ${HERO.plate}`, 32, 566, { size: 15, weight: 400, color: TB.text, font: 'sf' })
  text(ctx, tr('Zarezerwowane do 30 września', 'Booked until September 30'), 32, 586, { size: 13, weight: 400, color: TB.dim, font: 'sf' })
  iosCard(ctx, 16, 610, 361, 104)
  text(ctx, tr('poniedziałek, 28 września', 'Monday, September 28'), 32, 640, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  text(ctx, tr('Najem · cały dzień', 'Rental period · all day'), 32, 662, { size: 15, weight: 400, color: TB.dim, font: 'sf' })
  box(ctx, 32, 674, 329, 30, 12, TB.secondary, TB.border)
  text(ctx, tr('Zmień ten dzień', 'Change this day'), 196.5, 694, { size: 14, weight: 500, color: TB.text, font: 'sf', align: 'center' })
  iosTabBar(ctx, 1)
}

/** «Zarobki»: tydzień, cztery plitki, słupki dni (Swift Charts, złoto). */
export function drawNativeEarnings(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = TB.bg
  ctx.fillRect(0, 0, 393, 852)
  statusBar(ctx, 1, TB.text)
  iosLargeTitle(ctx, tr('Zarobki', 'Earnings'))
  box(ctx, 16, 154, 361, 34, 10, TB.muted)
  box(ctx, 16 + 120.3 + 2, 156, 116.3, 30, 8, '#3a3f4a')
  ;[tr('Dzień', 'Day'), tr('Tydzień', 'Week'), tr('Miesiąc', 'Month')].forEach((label, i) => text(ctx, label, 16 + 60.2 + i * 120.3, 176, { size: 13, weight: i === 1 ? 600 : 500, color: TB.text, font: 'sf', align: 'center' }))
  statTileIOS(ctx, 16, 204, 176.5, 'banknote', TB.green4, tr('1 240 zł', 'PLN 1,240'), tr('Łącznie', 'Total'))
  statTileIOS(ctx, 200.5, 204, 176.5, 'car', TB.iosInfo, '38', tr('Kursy', 'Rides'))
  statTileIOS(ctx, 16, 316, 176.5, 'clock', TB.gold, '16 h', tr('Godziny', 'Hours'))
  statTileIOS(ctx, 200.5, 316, 176.5, 'trending-up', TB.iosAmber, tr('77 zł', 'PLN 77'), tr('Na godzinę', 'Per hour'))
  iosCard(ctx, 16, 436, 361, 250)
  text(ctx, tr('Według dni', 'By day'), 32, 464, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  const bars = [0, 0, 0, 0, 0.62, 1, 0.84]
  const days = english() ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.']
  for (let i = 0; i < 4; i++) box(ctx, 32, 486 + i * 42, 329, 1, 0, TB.border)
  bars.forEach((v, i) => {
    const x = 40 + i * 46
    if (v > 0) {
      const h = 150 * v
      const g = ctx.createLinearGradient(0, 640 - h, 0, 640)
      g.addColorStop(0, TB.gold)
      g.addColorStop(1, TB.goldEnd)
      box(ctx, x, 640 - h, 30, h, 4, g)
    }
    text(ctx, days[i]!, x + 15, 664, { size: 11, weight: 400, color: TB.dim, font: 'sf', align: 'center' })
  })
  iosCard(ctx, 16, 700, 361, 60)
  text(ctx, tr('Szczegóły', 'Breakdown'), 32, 736, { size: 17, weight: 600, color: TB.text, font: 'sf' })
  iosTabBar(ctx, 3)
}

/* ── Договор, карточки веера, плиты «Dlaczego», знак и надписи ─────────── */

/** Первая страница PDF договора (contract.service.ts, pdfkit, A4 595 × 842 pt).
    Сумму аренды не показываем: шаблон печатает её как «700 PLN PLN». */
export const A4 = { width: 595, height: 842 }

export function drawContract(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, A4.width, A4.height)
  text(ctx, 'TAXI BOSS Sp. z o.o.', 60, 40, { size: 10, weight: 400, color: '#888888' })
  text(ctx, HERO.contract, 535, 40, { size: 10, weight: 400, color: '#888888', align: 'right' })
  box(ctx, 60, 50, 475, 0.8, 0, '#cccccc')
  /* Английская версия — английская половина двуязычного шаблона продукта
     (contract.service.ts: typeLabels.en, titleTranslation, contentTranslation). */
  text(ctx, tr('UMOWA NAJMU POJAZDU', 'VEHICLE RENTAL AGREEMENT'), 297.5, 96, { size: 18, weight: 500, color: '#1a1a1a', align: 'center', tracking: 0.3 })
  text(ctx, tr(`Nr / No: ${HERO.contract}`, `No: ${HERO.contract}`), 297.5, 114, { size: 9, weight: 400, color: '#999999', align: 'center' })
  text(ctx, tr(`Data / Date: ${HERO.date}`, `Date: ${HERO.date}`), 297.5, 130, { size: 10, weight: 400, color: '#666666', align: 'center' })
  const body = { size: 10, weight: 400, color: '#333333' }
  let y = 168
  const section = (title: string, lines: string[]) => {
    text(ctx, title, 60, y, { size: 12, weight: 700, color: '#1a1a1a' })
    y += 18
    for (const line of lines) y += para(ctx, line, 60, y, 475, 14, body) * 14 + 3
    y += 12
  }
  section(tr('§1 Strony umowy', '§1 Parties'), [
    tr(
      `Umowa najmu zawarta w dniu ${HERO.date} pomiędzy: 1. TAXI BOSS Sp. z o.o., z siedzibą: Warszawa, ul. Przykładowa 1, NIP: 0000000000, zwanym dalej „Wynajmującym”, 2. ${HERO.name}, PESEL: •••••••••45, zamieszkały/a: Poznań, zwanym dalej „Najemcą”.`,
      `Rental agreement concluded on ${HERO.date} between: 1. TAXI BOSS Sp. z o.o., registered at: Warszawa, ul. Przykładowa 1, NIP: 0000000000, hereinafter “Lessor”, 2. ${HERO.name}, PESEL: •••••••••45, residing at: Poznań, hereinafter “Lessee”.`,
    ),
  ])
  section(tr('§2 Przedmiot najmu', '§2 Subject of rental'), [
    tr(`Marka/Model: ${HERO.car}`, `Make/Model: ${HERO.car}`),
    tr(`Rok produkcji: ${HERO.year}`, `Year: ${HERO.year}`),
    tr(`Nr rejestracyjny: ${HERO.plate}`, `License plate: ${HERO.plate}`),
    'VIN: •••••••••••••4821',
  ])
  /* §3 и §4 — строки параграфов без текста: суммы в кадре нет. */
  for (const title of [tr('§3 Czynsz najmu', '§3 Rental fee'), tr('§4 Obowiązki Najemcy', '§4 Lessee obligations')]) {
    text(ctx, title, 60, y, { size: 12, weight: 700, color: '#1a1a1a' })
    y += 12
    for (let i = 0; i < 4; i++) {
      box(ctx, 60, y, i === 3 ? 280 : 475, 5, 2.5, '#e3e3e3')
      y += 13
    }
    y += 14
  }
  y = 690
  box(ctx, 60, y, 475, 0.8, 0, '#cccccc')
  const sign = (x: number, role: string, name: string) => {
    text(ctx, role, x, y + 24, { size: 10, weight: 700, color: '#1a1a1a' })
    text(ctx, name, x, y + 38, { size: 9, weight: 400, color: '#666666' })
    box(ctx, x, y + 88, 160, 0.6, 0, '#aaaaaa')
    text(ctx, tr('Podpis / Signature', 'Signature'), x, y + 100, { size: 8, weight: 400, color: '#999999' })
  }
  sign(60, tr('Wynajmujący / Lessor:', 'Lessor:'), 'TAXI BOSS Sp. z o.o.')
  sign(340, tr('Najemca / Lessee:', 'Lessee:'), HERO.name)
  text(ctx, tr(`Strona 1 z 2 | ${HERO.contract}`, `Page 1 of 2 | ${HERO.contract}`), 297.5, 806, { size: 8, weight: 400, color: '#bbbbbb', align: 'center' })
}

/** Карточка «Rejestracja Kierowcy» — шапка регистрации (Register.tsx): v3.2 — она
    летит от панели «Leady» к вееру форм сотрудничества. */
export const INVITE = { width: 350, height: 156 }

export function drawRegisterInvite(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = INVITE
  box(ctx, 0.5, 0.5, w - 1, h - 1, 24, TB.card, TB.border)
  metallic(ctx, 'TAXI BOSS', w / 2, 54, { size: 30, weight: 800, align: 'center', tracking: -0.4 })
  text(ctx, 'Rejestracja Kierowcy', w / 2, 98, { size: 23, weight: 700, color: TB.text, align: 'center' })
  text(ctx, 'Dołącz do TAXI BOSS w 4 prostych krokach', w / 2, 128, { size: 14.5, weight: 400, color: TB.dim, align: 'center' })
}

/** Три формы сотрудничества (Register.tsx, шаг 0) — карточки веера над дорогой. */
export const COOP = [
  {
    glyph: 'briefcase', title: 'Zatrudnienie', tone: TB.blue5, ink: TB.blue4, desc: 'Umowa o pracę. Stabilne wynagrodzenie, świadczenia socjalne i ubezpieczenie.', ticks: ['Stabilny dochód', 'Ubezpieczenie'],
    en: { title: 'Employment', desc: 'Full employment contract. Stable salary, social benefits, and insurance.', ticks: ['Stable income', 'Insurance'] },
  },
  {
    glyph: 'car', title: 'Wynajem pojazdu', tone: TB.green5, ink: TB.green4, desc: 'Wynajmij pojazd i jedź samodzielnie. Elastyczny grafik, tygodniowa opłata.', ticks: ['Elastyczność', 'Własny grafik'],
    en: { title: 'Vehicle Rental', desc: 'Rent a vehicle and drive independently. Flexible schedule, weekly payment.', ticks: ['Flexibility', 'Own schedule'] },
  },
  {
    glyph: 'handshake', title: 'Partnerstwo', tone: TB.purple5, ink: TB.purple4, desc: 'Model podziału przychodów. Przyjdź ze swoim autem lub korzystaj z naszego.', ticks: ['Wysokie zarobki', 'Podział przychodów'],
    en: { title: 'Partnership', desc: 'Revenue sharing model. Bring your own car or use ours. Maximum earnings potential.', ticks: ['High earnings', 'Revenue split'] },
  },
]
/** Карточка веера — 350 × 500 CSS (0,7 × 1,0 м). */
export const COOP_CARD = { width: 350, height: 500 }

/** Карточка формы; ticks — сколько галочек уже поставлено (дробная часть — прорисовка). */
export function drawCoopCard(ctx: CanvasRenderingContext2D, index: number, ticks: number) {
  const c = COOP[index]!
  const { width: w, height: h } = COOP_CARD
  box(ctx, 1, 1, w - 2, h - 2, 24, '#0C0E12')
  const g = ctx.createLinearGradient(0, 0, w, 0)
  g.addColorStop(0, rgba(c.tone, 0.2))
  g.addColorStop(1, rgba(c.tone, 0.1))
  box(ctx, 1, 1, w - 2, h - 2, 24, g, rgba(c.tone, 0.3), 2)
  box(ctx, 28, 28, 64, 64, 14, rgba(c.tone, 0.3))
  icon(ctx, c.glyph, 44, 44, 32, c.ink)
  icon(ctx, 'chevron-right', w - 52, 44, 28, TB.dim)
  text(ctx, tr(c.title, c.en.title), 28, 140, { size: 26, weight: 600, color: TB.text, tracking: -0.3 })
  para(ctx, tr(c.desc, c.en.desc), 28, 178, w - 56, 25, { size: 17, weight: 400, color: TB.dim })
  c.ticks.forEach((pl, i) => {
    const label = tr(pl, c.en.ticks[i]!)
    const t = Math.max(0, Math.min(1, ticks - i))
    const y = 330 + i * 52
    box(ctx, 28, y, w - 56, 40, 14, rgba(c.tone, 0.1 * Math.min(1, t * 2)))
    checkStroke(ctx, 38, y + 8, 24, c.ink, t, 2.6)
    ctx.save()
    ctx.globalAlpha = Math.min(1, t * 2)
    text(ctx, label, 72, y + 27, { size: 17, weight: 500, color: c.ink })
    ctx.restore()
  })
}

/** Три причины «Dlaczego» (О4): плита, крупный заголовок. Номер и галочка — отдельные слои. */
export const REASONS = ['Płacisz za kierowcę na linii', 'Start bez wdrożenia', 'Terminy pilnują się same']
export const REASON_CARD = { width: 1000, height: 580 }

export function drawReasonCard(ctx: CanvasRenderingContext2D, index: number) {
  const { width: w, height: h } = REASON_CARD
  /* Карточка причины — наш текст, а не экран продукта: в светлой студии это
     белое матовое стекло с тёмным заголовком, как выноска. */
  if (worldTheme === 'light') {
    box(ctx, 3, 3, w - 6, h - 6, 60, 'rgba(255, 255, 255, 0.72)', 'rgba(207, 138, 0, 0.35)', 3)
    para(ctx, REASONS[index]!, 64, 340, w - 128, 92, { size: 82, weight: 800, color: INK.text, tracking: -2.8 })
    return
  }
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#171b22')
  g.addColorStop(1, '#0d1014')
  box(ctx, 3, 3, w - 6, h - 6, 60, g, 'rgba(255, 191, 0, 0.28)', 3)
  para(ctx, REASONS[index]!, 64, 340, w - 128, 92, { size: 82, weight: 800, color: TB.text, tracking: -2.8 })
}

export function drawReasonNumber(ctx: CanvasRenderingContext2D, index: number) {
  worldGold(ctx, String(index + 1).padStart(2, '0'), 0, 150, { size: 160, weight: 800, tracking: -6 })
}

/** Золотой кружок с галочкой — ставится на карточку причины. */
export function drawCheckBadge(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.arc(64, 64, 60, 0, Math.PI * 2)
  ctx.fillStyle = goldFill(ctx, 4, 4, 120, 120)
  ctx.fill()
  checkStroke(ctx, 24, 24, 80, TB.bg, 1, 10)
}

/** Надпись знака «TAXI BOSS»: металлическое золото продукта или тёмный торец слоя. */
export function drawLogo(ctx: CanvasRenderingContext2D, width: number, height: number, face: 'front' | 'side') {
  const s = { size: height * 0.72, weight: 800, tracking: -height * 0.02, align: 'center' as const }
  if (face === 'front') worldGold(ctx, 'TAXI BOSS', width / 2, height * 0.76, s)
  else text(ctx, 'TAXI BOSS', width / 2, height * 0.76, { ...s, color: worldTheme === 'light' ? '#7a4d00' : '#8a5a00' })
}

/** Кнопка «Porozmawiajmy» — в стиле .btn-primary продукта. */
export function drawCallButton(ctx: CanvasRenderingContext2D, width: number, height: number, pressed = 0) {
  box(ctx, 0, 0, width, height, height * 0.28, goldFill(ctx, 0, 0, width, height))
  const sheen = ctx.createLinearGradient(0, 0, width * 0.6, height)
  sheen.addColorStop(0, `rgba(255, 255, 255, ${0.22 - 0.12 * pressed})`)
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  box(ctx, 0, 0, width, height, height * 0.28, sheen)
  text(ctx, tr('Porozmawiajmy', "Let's talk"), width / 2, height * 0.64, { size: height * 0.42, weight: 650, color: TB.bg, align: 'center' })
}

/** Простая надпись без подложки: адрес под знаком, имя языка, табличка главы. */
export function drawLabel(ctx: CanvasRenderingContext2D, value: string, width: number, height: number, options: { color?: string; weight?: number; accent?: string; align?: CanvasTextAlign } = {}) {
  const size = height * 0.72
  const align = options.align ?? 'center'
  const x = align === 'center' ? width / 2 : align === 'left' ? 0 : width
  ctx.save()
  /* Тень отделяет светлую надпись от тёмной студии; тёмной надписи на белом она
     не нужна — дала бы грязный ореол. */
  if (worldTheme !== 'light') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = size * 0.2
  }
  const color = options.color ?? INK.text
  if (options.accent) {
    const [first, ...rest] = value.split(' ')
    const lead = `${first} `
    const total = measure(ctx, value, { size, weight: options.weight ?? 700 })
    const left = align === 'center' ? x - total / 2 : align === 'left' ? x : x - total
    const lw = text(ctx, lead, left, height * 0.78, { size, weight: 800, color: options.accent })
    text(ctx, rest.join(' '), left + lw, height * 0.78, { size, weight: options.weight ?? 700, color })
  } else text(ctx, value, x, height * 0.78, { size, weight: options.weight ?? 700, color, align })
  ctx.restore()
}

/** Плоская линейная иконка машины сверху — место на парковке (сценарий: машин в объёме нет). */
export function drawParkingCar(ctx: CanvasRenderingContext2D, width: number, height: number) {
  /* На светлом бетоне — графитовый контур: золото на 30% там не видно. */
  ctx.strokeStyle = worldTheme === 'light' ? 'rgba(70, 76, 86, 0.75)' : 'rgba(255, 191, 0, 0.9)'
  ctx.lineWidth = width * 0.02
  ctx.lineJoin = 'round'
  const w = width * 0.8
  const h = height * 0.86
  const x = (width - w) / 2
  const y = (height - h) / 2
  rr(ctx, x, y, w, h, w * 0.32)
  ctx.stroke()
  rr(ctx, x + w * 0.14, y + h * 0.2, w * 0.72, h * 0.18, w * 0.12)
  ctx.stroke()
  rr(ctx, x + w * 0.16, y + h * 0.66, w * 0.68, h * 0.12, w * 0.1)
  ctx.stroke()
}

/** Полоса цифр 0–9 вокруг барабана счётчика (О8): цифры повёрнуты под ось барабана. */
export function drawDrumStrip(ctx: CanvasRenderingContext2D, width: number, height: number) {
  /* Светлая студия: белый барабан с тёмными цифрами, как счётчик из алюминия. */
  const light = worldTheme === 'light'
  const g = ctx.createLinearGradient(0, 0, 0, height)
  g.addColorStop(0, light ? '#e4e7ec' : '#0d1014')
  g.addColorStop(0.5, light ? '#fbfbfc' : '#1a1f27')
  g.addColorStop(1, light ? '#e4e7ec' : '#0d1014')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, height)
  const cell = width / 10
  for (let digit = 0; digit < 10; digit++) {
    ctx.save()
    ctx.translate(cell * (digit + 0.5), height / 2)
    ctx.rotate(Math.PI / 2)
    text(ctx, String(digit), 0, height * 0.155, { size: height * 0.43, weight: 800, color: light ? INK.text : TB.text, align: 'center' })
    ctx.restore()
    box(ctx, cell * digit, 0, 1.5, height, 0, light ? 'rgba(20, 24, 30, 0.06)' : 'rgba(255, 255, 255, 0.05)')
  }
}

/** Ячейки табло-флаппера: строки символов, ячейка — тёмная плитка с линией разреза. */
export function drawFlaps(ctx: CanvasRenderingContext2D, rows: string[], cols: number, cellW: number, cellH: number, gap: number, left: number, top: number, rowGap: number, flipping: (row: number, col: number) => number) {
  rows.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const x = left + c * (cellW + gap)
      const y = top + r * (cellH + rowGap)
      const ch = row[c] ?? ' '
      box(ctx, x, y, cellW, cellH, cellW * 0.14, '#16181c', 'rgba(255, 255, 255, 0.05)')
      const flip = flipping(r, c)
      if (ch !== ' ') {
        ctx.save()
        rr(ctx, x, y, cellW, cellH, cellW * 0.14)
        ctx.clip()
        text(ctx, ch, x + cellW / 2, y + cellH * 0.77, { size: cellH * 0.78, weight: 800, color: flip > 0 ? '#cfd3da' : '#f4f4f4', align: 'center' })
        ctx.restore()
      }
      /* Половинка флаппера в полёте — тёмная шторка сверху. */
      if (flip > 0) box(ctx, x, y, cellW, cellH * 0.5 * flip, cellW * 0.12, 'rgba(10, 11, 13, 0.85)')
      box(ctx, x, y + cellH * 0.5 - 1, cellW, 2, 0, 'rgba(0, 0, 0, 0.75)')
    }
  })
}
