import type { CanvasTexture } from 'three'
import { FONT, IPHONE, paint, round, statusBar, tint, write } from './paint'

/* Двойники экранов Портала B2B для моушн-слоя (06-MOTION, §6; сценарий 03-B2B).
   Цвета — токены тёмной темы движка (MIND LOGISTIC, src/index.css: фон #000,
   карточки hsl(0 0% 5%), акцент hsl(19 100% 49%), регистрация — #fc5000 с белыми
   точками), раскладка и надписи — из его экранов и польского словаря
   (src/i18n/locales/pl.ts, экранные COPY, server/src/services/email.ts и
   telegramAdmin.ts). Иконки — контуры lucide-react, как в продукте.

   Ролик нейтральный: движок держит боевой магазин, поэтому вместо его знака —
   «HURTOWNIA DEMO», товары — упаковка со склада (картон, скотч, стретч),
   данные фирмы-покупателя замаскированы, NIP — учебный 123-456-32-18. Суммы —
   часть интерфейса: их не накручиваем (правило владельца), они просто стоят. */

export const ML = {
  bg: '#000000',
  card: '#0d0d0d',
  muted: '#1a1a1a',
  mutedFg: '#a6a6a6',
  border: '#262626',
  primary: '#fa4f00',
  brand: '#fc5000',
  ink: '#070607',
  fg: '#ffffff',
  success: '#8cba5e',
  warning: '#f59f0a',
  destructive: '#d34545',
  emerald: '#10b981',
  emeraldLight: '#34d399',
  emeraldDark: '#059669',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  amber: '#f59e0b',
  main: '#080808',
  mail: '#16a34a',
}

/** Нейтральный знак вместо марки боевого магазина. */
export const BRAND = ['HURTOWNIA', 'DEMO'] as const

/* Liquid Glass (правка владельца 28.09): фон листов и карточки полупрозрачные —
   сквозь них видно матовое стекло плиты; текст и значки непрозрачные. Экраны
   устройств (ноутбук, телефоны) и накладки, которые закрывают запечённое под
   ними или сменяют друг друга шторкой, остаются плотными. */
const SHEET_ALPHA = 0.66
const CARD_ALPHA = 0.8
const sheetFill = (hex: string) => tint(hex, SHEET_ALPHA)
const cardFill = (hex: string) => tint(hex, CARD_ALPHA)

/** Размеры листов в CSS-пикселях и во сколько раз холст крупнее. */
export const PANEL = { w: 1024, h: 659, k: 1.25 }
export const LAPTOP_UI = { w: 800, h: 500, k: 1.5 }
export const EMAIL_UI = { w: 520, h: 676, k: 2 }
export const SETTINGS_UI = { w: 400, h: 267, k: 3 }
export const CREDIT_UI = { w: 600, h: 400, k: 2 }
export const QUOTE_UI = { w: 480, h: 360, k: 2 }
export const PHONE_UI = { w: 393, h: 852, k: 1.5 }

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type Ctx = CanvasRenderingContext2D

/** Контуры иконок lucide-react 0.462 (как в продукте): по элементу SVG на строку. */
const ICONS = {
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2Z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  cart: ['M7 21a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M18 21a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12'],
  clock: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 6L12 12L16 14'],
  package: ['M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z', 'M12 22V12', 'm3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7', 'm7.5 4.27 9 5.15'],
  truck: ['M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2', 'M15 18H9', 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14', 'M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
  arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
  arrowLeft: ['m12 19-7-7 7-7', 'M19 12H5'],
  search: ['M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0', 'm21 21-4.3-4.3'],
  shieldCheck: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'],
  building: ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z', 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2', 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],
  creditCard: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2Z', 'M2 10L22 10'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  menu: ['M4 12L20 12', 'M4 6L20 6', 'M4 18L20 18'],
  home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  store: ['m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7', 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4', 'M2 7h20', 'M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7'],
  info: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 16v-4', 'M12 8h.01'],
  message: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M8 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0'],
  sliders: ['M21 4L14 4', 'M10 4L3 4', 'M21 12L12 12', 'M8 12L3 12', 'M21 20L16 20', 'M12 20L3 20', 'M14 2L14 6', 'M8 10L8 14', 'M16 18L16 22'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8L12 3L7 8', 'M12 3L12 15'],
  clipboard: ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1Z', 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M12 11h4', 'M12 16h4', 'M8 11h.01', 'M8 16h.01'],
  fileText: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
  handshake: ['m11 17 2 2a1 1 0 1 0 3-3', 'm14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4', 'm21 3 1 11h-2', 'M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3', 'M3 4h8'],
  radio: ['M4.9 19.1C1 15.2 1 8.8 4.9 4.9', 'M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5', 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0', 'M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5', 'M19.1 4.9C23 8.8 23 15.1 19.1 19'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  dashboard: ['M4 3h5a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1Z', 'M15 3h5a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1Z', 'M15 12h5a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1Z', 'M4 16h5a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1Z'],
  settings: ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'],
  globe: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  tag: ['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0'],
  layers: ['m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'],
  target: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'M6 12a6 6 0 1 0 12 0a6 6 0 1 0 -12 0', 'M10 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
  chart: ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  folderTree: ['M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z', 'M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z', 'M3 5a2 2 0 0 0 2 2h3', 'M3 3v13a2 2 0 0 0 2 2h3'],
  badgeCheck: ['M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z', 'm9 12 2 2 4-4'],
  percent: ['M19 5L5 19', 'M4 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0', 'M15 17.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0'],
  calendar: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z', 'M3 10h18', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01', 'M16 18h.01'],
  mail: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2Z', 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
  key: ['M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z', 'M16 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0'],
  logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17L21 12L16 7', 'M21 12L9 12'],
  panelLeft: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z', 'M9 3v18', 'm16 15-3-3 3-3'],
  layoutList: ['M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z', 'M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z', 'M14 4h7', 'M14 9h7', 'M14 15h7', 'M14 20h7'],
  layoutGrid: ['M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z', 'M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z', 'M15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z', 'M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1Z'],
  arrowUpDown: ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
  save: ['M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7', 'M7 3v4a1 1 0 0 0 1 1h7'],
  refresh: ['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10L12 15L17 10', 'M12 15L12 3'],
  checkCircle: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'm9 12 2 2 4-4'],
  xCircle: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0', 'm15 9-6 6', 'm9 9 6 6'],
  loader: ['M21 12a9 9 0 1 1-6.219-8.56'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  eye: ['M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'],
  rotateCcw: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  squareCheck: ['M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5', 'm9 11 3 3L22 4'],
  userPlus: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M19 8L19 14', 'M22 11L16 11'],
  kanban: ['M6 5v11', 'M12 5v6', 'M18 5v14'],
  gift: ['M4 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1Z', 'M12 8v13', 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7', 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5'],
  arrowDown: ['M12 5v14', 'm19 12-7 7-7-7'],
  filter: ['M22 3L2 3L10 12.46L10 19L14 21L14 12.46L22 3Z'],
  sparkles: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z', 'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', 'M10 11L10 17', 'M14 11L14 17'],
  pencil: ['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z', 'm15 5 4 4'],
  calendarClock: ['M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5', 'M16 2v4', 'M8 2v4', 'M3 10h5', 'M17.5 17.5 16 16.3V14', 'M10 16a6 6 0 1 0 12 0a6 6 0 1 0 -12 0'],
} satisfies Record<string, string[]>

export type IconName = keyof typeof ICONS

const PLN = typeof Intl !== 'undefined' ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null
/** Цена, как её пишет витрина (Intl pl-PL): «9,49 zł». */
export const zl = (value: number) => (PLN ? PLN.format(value) : `${value.toFixed(2)} zł`)
/** Цена, как её пишут админка и оферты: «2268.12 PLN». */
export const pln = (value: number) => `${value.toFixed(2)} PLN`

/* ── Холст в CSS-пикселях ─────────────────────────────────────────────── */

/** Плотность холстов. v3.2: в роликах камера подлетает к экранам и попапам
    вплотную, при плотности 1 текст мылится — там 2. На лендинге подлётов нет,
    а текстур вчетверо больше по памяти — там 1. Задаёт отделка до отрисовки
    станций (B2B_LOOK.prepare: светлая студия — ролики, тёмная — лендинг). */
let sharp = 1

export function setSheetDensity(ratio: number) {
  sharp = ratio
}

function sheet(width: number, height: number, k: number, draw: (c: Ctx) => void, ratio = sharp): CanvasTexture | null {
  return paint(
    width * k,
    height * k,
    (context) => {
      context.save()
      context.scale(k, k)
      draw(context)
      context.restore()
    },
    ratio,
  )
}

/** Рисование живой текстуры в CSS-пикселях — для LiveTexture в отделке. */
export type LiveDraw = (c: Ctx, width: number, height: number) => void

interface TextOptions {
  align?: CanvasTextAlign
  tracking?: number
  upper?: boolean
  baseline?: CanvasTextBaseline
}

function txt(c: Ctx, value: string, x: number, y: number, size: number, weight: number, color: string, options: TextOptions = {}): number {
  return write(c, value, x, y, { size, weight, color, align: options.align, tracking: options.tracking, upper: options.upper, baseline: options.baseline })
}

function measure(c: Ctx, value: string, size: number, weight: number, tracking = 0, upper = false): number {
  c.font = `${weight} ${size}px ${FONT}`
  c.letterSpacing = `${tracking}px`
  const width = c.measureText(upper ? value.toUpperCase() : value).width
  c.letterSpacing = '0px'
  return width
}

function wrap(c: Ctx, value: string, size: number, weight: number, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(c, next, size, weight) > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Абзац с переносом; возвращает высоту. */
function para(c: Ctx, value: string, x: number, y: number, size: number, weight: number, color: string, width: number, lineHeight: number, align: CanvasTextAlign = 'left'): number {
  const lines = wrap(c, value, size, weight, width)
  lines.forEach((line, index) => txt(c, line, x, y + index * lineHeight, size, weight, color, { align }))
  return lines.length * lineHeight
}

function fillBox(c: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  round(c, x, y, w, h, r)
  c.fillStyle = color
  c.fill()
}

function strokeBox(c: Ctx, x: number, y: number, w: number, h: number, r: number, color: string, width = 1, dash?: number[]) {
  round(c, x + width / 2, y + width / 2, w - width, h - width, r)
  c.lineWidth = width
  c.strokeStyle = color
  if (dash) c.setLineDash(dash)
  c.stroke()
  if (dash) c.setLineDash([])
}

function circle(c: Ctx, x: number, y: number, r: number, fill?: string, stroke?: string, width = 1) {
  c.beginPath()
  c.arc(x, y, r, 0, Math.PI * 2)
  if (fill) {
    c.fillStyle = fill
    c.fill()
  }
  if (stroke) {
    c.lineWidth = width
    c.strokeStyle = stroke
    c.stroke()
  }
}

/** Контур lucide: (x, y) — левый верхний угол квадрата size. */
export function icon(c: Ctx, name: IconName, x: number, y: number, size: number, color: string, width = 2) {
  c.save()
  c.translate(x, y)
  c.scale(size / 24, size / 24)
  c.lineWidth = width
  c.strokeStyle = color
  c.lineCap = 'round'
  c.lineJoin = 'round'
  for (const d of ICONS[name]) c.stroke(new Path2D(d))
  c.restore()
}

/** Текст с неоновым свечением (neonText продукта). */
function glowText(c: Ctx, value: string, x: number, y: number, size: number, weight: number, color: string, blur: number, align: CanvasTextAlign = 'left') {
  c.save()
  c.shadowColor = color
  c.shadowBlur = blur
  txt(c, value, x, y, size, weight, color, { align })
  c.restore()
  txt(c, value, x, y, size, weight, color, { align })
}

type Variant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'ink' | 'ghostWhite' | 'white' | 'danger' | 'mail'

interface ButtonOptions {
  icon?: IconName
  iconAfter?: IconName
  size?: number
  weight?: number
  upper?: boolean
  tracking?: number
  width?: number
  px?: number
  radius?: number
}

function buttonColors(variant: Variant): { bg?: string; fg: string; border?: string } {
  switch (variant) {
    case 'primary':
      return { bg: ML.primary, fg: '#ffffff' }
    case 'outline':
      return { bg: ML.bg, fg: ML.fg, border: ML.border }
    case 'secondary':
      return { bg: ML.muted, fg: ML.fg }
    case 'ghost':
      return { fg: ML.mutedFg }
    case 'ink':
      return { bg: ML.ink, fg: '#ffffff' }
    case 'ghostWhite':
      return { fg: '#ffffff', border: 'rgba(255,255,255,0.55)' }
    case 'white':
      return { bg: '#ffffff', fg: ML.primary }
    case 'danger':
      return { bg: ML.bg, fg: ML.destructive, border: ML.border }
    case 'mail':
      return { bg: ML.mail, fg: '#ffffff' }
  }
}

/** Кнопка-пилюля (у продукта все кнопки rounded-full). Возвращает ширину. */
function button(c: Ctx, label: string, x: number, y: number, h: number, variant: Variant, options: ButtonOptions = {}): number {
  const size = options.size ?? 14
  const weight = options.weight ?? 500
  const px = options.px ?? 16
  const iconSize = Math.round(size * 1.15)
  const gap = 8
  const textWidth = label ? measure(c, label, size, weight, options.tracking ?? 0, options.upper) : 0
  const content = textWidth + (options.icon ? iconSize + (label ? gap : 0) : 0) + (options.iconAfter ? iconSize + gap : 0)
  const width = options.width ?? content + px * 2
  const colors = buttonColors(variant)
  const radius = options.radius ?? h / 2
  if (colors.bg) fillBox(c, x, y, width, h, radius, colors.bg)
  if (colors.border) strokeBox(c, x, y, width, h, radius, colors.border, 1)
  let cursor = x + (width - content) / 2
  if (options.icon) {
    icon(c, options.icon, cursor, y + (h - iconSize) / 2, iconSize, colors.fg)
    cursor += iconSize + (label ? gap : 0)
  }
  if (label) txt(c, label, cursor, y + h / 2 + size * 0.36, size, weight, colors.fg, { tracking: options.tracking, upper: options.upper })
  if (options.iconAfter) icon(c, options.iconAfter, cursor + textWidth + gap, y + (h - iconSize) / 2, iconSize, colors.fg)
  return width
}

interface InputOptions {
  radius?: number
  size?: number
  color?: string
  bg?: string
  border?: string
  px?: number
  weight?: number
}

function input(c: Ctx, x: number, y: number, w: number, h: number, value: string | null, placeholder = '', options: InputOptions = {}) {
  const radius = options.radius ?? 14
  fillBox(c, x, y, w, h, radius, options.bg ?? ML.bg)
  strokeBox(c, x, y, w, h, radius, options.border ?? ML.border, 1)
  const size = options.size ?? 14
  const px = options.px ?? 12
  if (value) txt(c, value, x + px, y + h / 2 + size * 0.36, size, options.weight ?? 400, options.color ?? ML.fg)
  else if (placeholder) txt(c, placeholder, x + px, y + h / 2 + size * 0.36, size, 400, ML.mutedFg)
}

interface TagOptions {
  size?: number
  weight?: number
  color: string
  bg?: string
  border?: string
  px?: number
  h?: number
  upper?: boolean
  tracking?: number
  icon?: IconName
}

/** Чип интерфейса (статус, возраст заявки) — как в коде продукта. */
function tag(c: Ctx, label: string, x: number, y: number, options: TagOptions): number {
  const size = options.size ?? 12
  const weight = options.weight ?? 600
  const px = options.px ?? 8
  const h = options.h ?? size + 8
  const iconSize = options.icon ? size : 0
  const width = measure(c, label, size, weight, options.tracking ?? 0, options.upper) + px * 2 + (iconSize ? iconSize + 4 : 0)
  if (options.bg) fillBox(c, x, y, width, h, h / 2, options.bg)
  if (options.border) strokeBox(c, x, y, width, h, h / 2, options.border, 1)
  if (options.icon) icon(c, options.icon, x + px, y + (h - iconSize) / 2, iconSize, options.color, 2.2)
  txt(c, label, x + px + (iconSize ? iconSize + 4 : 0), y + h / 2 + size * 0.36, size, weight, options.color, { upper: options.upper, tracking: options.tracking })
  return width
}

/** Замаскированные данные фирмы: скруглённая плашка вместо текста. */
function mask(c: Ctx, x: number, y: number, w: number, h: number, color = 'rgba(255,255,255,0.16)') {
  fillBox(c, x, y, w, h, h / 2, color)
}

/** Знак-строка «HURTOWNIA DEMO»: широкие прописные, как font-brand продукта. */
function brandMark(c: Ctx, x: number, baseline: number, size: number, first: string, second: string, align: CanvasTextAlign = 'left'): number {
  const tracking = size * 0.14
  const a = measure(c, `${BRAND[0]} `, size, 900, tracking)
  const b = measure(c, BRAND[1], size, 900, tracking)
  const start = align === 'left' ? x : align === 'center' ? x - (a + b) / 2 : x - a - b
  txt(c, `${BRAND[0]} `, start, baseline, size, 900, first, { tracking })
  txt(c, BRAND[1], start + a, baseline, size, 900, second, { tracking })
  return a + b
}

/** Картон на фото товара: плоский рисунок коробки (миниатюры, телефон). */
function boxPicture(c: Ctx, x: number, y: number, w: number, h: number, background = ML.card) {
  fillBox(c, x, y, w, h, Math.min(w, h) * 0.18, background)
  const s = Math.min(w, h)
  const cx = x + w / 2
  const cy = y + h / 2 + s * 0.04
  const bw = s * 0.62
  const bh = s * 0.36
  const top = s * 0.14
  c.fillStyle = '#9b7144'
  c.beginPath()
  c.moveTo(cx - bw / 2, cy - bh / 2)
  c.lineTo(cx - bw / 2 + top, cy - bh / 2 - top * 0.8)
  c.lineTo(cx + bw / 2 + top, cy - bh / 2 - top * 0.8)
  c.lineTo(cx + bw / 2, cy - bh / 2)
  c.closePath()
  c.fill()
  fillBox(c, cx - bw / 2, cy - bh / 2, bw, bh, s * 0.02, '#b1834f')
  c.fillStyle = '#8d6539'
  c.beginPath()
  c.moveTo(cx + bw / 2, cy - bh / 2)
  c.lineTo(cx + bw / 2 + top, cy - bh / 2 - top * 0.8)
  c.lineTo(cx + bw / 2 + top, cy + bh / 2 - top * 0.8)
  c.lineTo(cx + bw / 2, cy + bh / 2)
  c.closePath()
  c.fill()
  c.fillStyle = 'rgba(202,164,108,0.9)'
  c.fillRect(cx - s * 0.02, cy - bh / 2, s * 0.04, bh * 0.35)
  c.beginPath()
  c.moveTo(cx - s * 0.02, cy - bh / 2)
  c.lineTo(cx - s * 0.02 + top, cy - bh / 2 - top * 0.8)
  c.lineTo(cx + s * 0.02 + top, cy - bh / 2 - top * 0.8)
  c.lineTo(cx + s * 0.02, cy - bh / 2)
  c.closePath()
  c.fill()
}

/** Небольшие рисунки других товаров для миниатюр списка. */
function goodsPicture(c: Ctx, kind: Good['picture'], x: number, y: number, s: number) {
  fillBox(c, x, y, s, s, s * 0.18, ML.card)
  const cx = x + s / 2
  const cy = y + s / 2
  if (kind === 'box' || kind === 'smallBox') {
    boxPicture(c, x, y, s, s)
    return
  }
  if (kind === 'tape') {
    circle(c, cx, cy, s * 0.3, '#8f6a3d')
    circle(c, cx, cy, s * 0.13, ML.card)
    circle(c, cx, cy, s * 0.3, undefined, '#b88c55', s * 0.05)
    return
  }
  if (kind === 'film') {
    fillBox(c, cx - s * 0.16, cy - s * 0.3, s * 0.32, s * 0.6, s * 0.08, '#cfd8e0')
    fillBox(c, cx - s * 0.05, cy - s * 0.36, s * 0.1, s * 0.72, s * 0.04, '#7c8a96')
    return
  }
  fillBox(c, cx - s * 0.26, cy - s * 0.2, s * 0.52, s * 0.44, s * 0.08, '#c8b08a')
  for (let i = 0; i < 4; i++) fillBox(c, cx - s * 0.2 + i * s * 0.1, cy - s * 0.12, s * 0.06, s * 0.28, s * 0.03, '#a88e66')
}

/* ── Товары нейтрального демо-каталога ───────────────────────────────── */

export interface Good {
  sku: string
  name: string
  net: number
  retail: number
  picture: 'box' | 'smallBox' | 'tape' | 'film' | 'filler'
}

export const GOODS: Good[] = [
  { sku: 'TSM-4866-BR', name: 'Taśma pakowa 48 mm × 66 m brązowa', net: 3.2, retail: 4.49, picture: 'tape' },
  { sku: 'FST-2315', name: 'Folia stretch 23 µm 1,5 kg', net: 18.9, retail: 26.99, picture: 'film' },
  { sku: 'KRT-6044-5W', name: 'Karton klapowy 600×400×400 mm 5-warstwowy', net: 9.49, retail: 14.6, picture: 'box' },
  { sku: 'WPP-05', name: 'Wypełniacz papierowy 5 kg', net: 24.5, retail: 32, picture: 'filler' },
  { sku: 'KRT-3215-3W', name: 'Karton klapowy 300×200×150 mm 3-warstwowy', net: 1.85, retail: 2.99, picture: 'smallBox' },
]

export const CARTON = GOODS[2]!

const marginOf = (good: Good) => Math.round(((good.retail - good.net) / good.retail) * 10000) / 100
const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(2)}%`

/** Порядок строк: «Polecane» и после «Marża ↓». */
export const SORT_BEFORE = [0, 1, 2, 3, 4]
export const SORT_AFTER = GOODS.map((good, index) => ({ index, margin: marginOf(good) }))
  .sort((a, b) => b.margin - a.margin)
  .map((item) => item.index)

/* ═══ Регистрация (оранжевый экран с белыми точками) ═════════════════════ */

function regBackground(c: Ctx, w: number, h: number, pad: number, alpha = SHEET_ALPHA) {
  c.fillStyle = tint(ML.brand, alpha)
  c.fillRect(0, 0, w, h)
  c.fillStyle = 'rgba(255,255,255,0.18)'
  for (let y = 13; y < h; y += 26) {
    for (let x = 13; x < w; x += 26) {
      c.beginPath()
      c.arc(x, y, 2, 0, Math.PI * 2)
      c.fill()
    }
  }
  brandMark(c, pad, 52, 19, '#ffffff', '#ffffff')
  circle(c, w - pad - 20, 45, 19.5, undefined, 'rgba(255,255,255,0.5)', 1)
  icon(c, 'x', w - pad - 28, 37, 16, '#ffffff')
}

/** Раскладка шага 1 (NIP) на листе w × h. */
export function regStep1Layout(w: number, h: number, heading: number) {
  const block = heading * 0.95 + 40 + 60 + 16 + 24
  const top = Math.round((88 + h) / 2 - block / 2)
  const rowTop = Math.round(top + heading * 0.95 + 40)
  const x0 = (w - 576) / 2
  return {
    top,
    heading,
    pill: { x: x0, y: rowTop, w: 390, h: 60 },
    input: { x: x0 + 65, y: rowTop, w: 390 - 65 - 12, h: 60 },
    button: { x: x0 + 402, y: rowTop, w: 174, h: 60 },
    status: { x: x0, y: rowTop + 70, w: 576, h: 30 },
  }
}

export const REG1 = regStep1Layout(PANEL.w, PANEL.h, 72)

function regStep1Draw(c: Ctx, w: number, h: number, heading: number, withInput: boolean) {
  const layout = regStep1Layout(w, h, heading)
  txt(c, 'Rejestracja', w / 2, layout.top + heading * 0.8, heading, 900, '#ffffff', { align: 'center', tracking: -heading * 0.03 })
  const pill = layout.pill
  fillBox(c, pill.x, pill.y, pill.w, pill.h, pill.h / 2, '#ffffff')
  txt(c, 'PL', pill.x + 24, pill.y + 37, 18, 700, 'rgba(7,6,7,0.6)')
  c.fillStyle = 'rgba(7,6,7,0.15)'
  c.fillRect(pill.x + 64, pill.y + 18, 1, 24)
  if (withInput) drawNip(c, null, layout.input)
  drawRegButton(c, false, layout.button)
}

/** Поле NIP: плейсхолдер или напечатанные цифры (м-ввод). */
function drawNip(c: Ctx, value: string | null, rect: Rect) {
  fillBox(c, rect.x, rect.y, rect.w, rect.h, 0, '#ffffff')
  if (value) {
    const width = txt(c, value, rect.x + 16, rect.y + 37, 18, 500, ML.ink, { tracking: 0.5 })
    c.fillStyle = ML.brand
    c.fillRect(rect.x + 18 + width, rect.y + 18, 2, 24)
  } else txt(c, 'NIP powinien zawierać 10 cyfr', rect.x + 16, rect.y + 37, 18, 400, 'rgba(7,6,7,0.35)')
}

function drawRegButton(c: Ctx, busy: boolean, rect: Rect) {
  fillBox(c, rect.x, rect.y, rect.w, rect.h, rect.h / 2, ML.ink)
  const label = 'POBIERZ DANE'
  const width = measure(c, label, 14, 700, 0.84)
  const content = width + (busy ? 24 : 0)
  let x = rect.x + (rect.w - content) / 2
  if (busy) {
    c.save()
    c.strokeStyle = '#ffffff'
    c.lineWidth = 2
    c.lineCap = 'round'
    c.beginPath()
    c.arc(x + 8, rect.y + rect.h / 2, 7, -Math.PI * 0.2, Math.PI * 1.3)
    c.stroke()
    c.restore()
    x += 24
  }
  txt(c, label, x, rect.y + rect.h / 2 + 5, 14, 700, '#ffffff', { tracking: 0.84 })
}

export const drawNipLive = (value: string | null): LiveDraw => (c, width, height) => drawNip(c, value, { x: 0, y: 0, w: width, h: height })
export const drawRegButtonLive = (busy: boolean): LiveDraw => (c, width, height) => drawRegButton(c, busy, { x: 0, y: 0, w: width, h: height })
export const drawRegStatus = (text: string): LiveDraw => (c, width, height) => {
  if (text) txt(c, text, width / 2, height / 2 + 5, 14, 400, 'rgba(255,255,255,0.8)', { align: 'center' })
}

/** Лист регистрации для ноутбука: пустое поле NIP, всё запечено. */
export function regLaptop(): CanvasTexture | null {
  const { w, h, k } = LAPTOP_UI
  return sheet(w, h, k, (c) => {
    regBackground(c, w, h, 40, 1)
    regStep1Draw(c, w, h, 60, true)
  })
}

/** Панель регистрации целиком в первом кадре (пустое поле NIP) — лицо экрана,
    который вылетает из ноутбука: к посадке он совпадает с панелью станции 04. */
export function regPanel(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    regBackground(c, PANEL.w, PANEL.h, 56)
    regStep1Draw(c, PANEL.w, PANEL.h, 72, true)
  })
}

/** Фон панели регистрации: оранжевый, точки, шапка. Шаги — отдельными слоями. */
export function regBase(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => regBackground(c, PANEL.w, PANEL.h, 56))
}

/** Слой шага 1 без текста поля и кнопки: они — живые накладки. */
export function regStep1(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    txt(c, 'Rejestracja', PANEL.w / 2, REG1.top + 72 * 0.8, 72, 900, '#ffffff', { align: 'center', tracking: -72 * 0.03 })
    const pill = REG1.pill
    fillBox(c, pill.x, pill.y, pill.w, pill.h, pill.h / 2, '#ffffff')
    txt(c, 'PL', pill.x + 24, pill.y + 37, 18, 700, 'rgba(7,6,7,0.6)')
    c.fillStyle = 'rgba(7,6,7,0.15)'
    c.fillRect(pill.x + 64, pill.y + 18, 1, 24)
  })
}

const STEPS = ['NIP i weryfikacja', 'Dane firmy', 'Osoba kontaktowa', 'Telefon i e-mail']

/** Цепочка шагов 1–4: текущий кружок залит белым (как StepTrail продукта). */
export const drawTrail = (current: number): LiveDraw => (c) => {
  let x = 0
  STEPS.forEach((label, index) => {
    const active = index + 1 === current
    const done = index + 1 < current
    if (active) circle(c, x + 12, 12, 12, '#ffffff')
    else circle(c, x + 12, 12, 11.5, done ? 'rgba(255,255,255,0.18)' : undefined, 'rgba(255,255,255,0.4)', 1)
    txt(c, String(index + 1), x + 12, 16, 11, 700, active ? ML.brand : 'rgba(255,255,255,0.7)', { align: 'center' })
    const width = txt(c, label, x + 32, 16.5, 12, 700, active ? '#ffffff' : 'rgba(255,255,255,0.45)', { upper: true, tracking: 0.96 })
    x += 32 + width + 12
  })
}

export const TRAIL: Rect = { x: 176, y: 0, w: 672, h: 24 }

interface StepLayout {
  top: number
  trail: Rect
  title: number
  /** Блок «Dane firmy» (шаг 2): метки, поле и адрес — его отрывает м-отрыв. */
  block: Rect
  controls: number
}

/** Раскладка шагов 2–4 — одна на рисунок и на отделку. */
export function regStepLayout(step: 2 | 3 | 4): StepLayout {
  const heights = { 2: 470, 3: 330, 4: 480 }
  const top = Math.round(96 + (PANEL.h - 96 - heights[step]) / 2)
  const title = top + 24 + 24
  const blockTop = step === 2 ? title + 40 + 14 + 18 + 14 : title + 40 + 18
  const block = { x: 176, y: blockTop, w: 672, h: step === 2 ? 250 : step === 3 ? 180 : 300 }
  return { top, trail: { ...TRAIL, y: top }, title, block, controls: top + heights[step] - 60 }
}

function label(c: Ctx, value: string, x: number, y: number) {
  txt(c, value, x + 24, y + 13, 13, 700, 'rgba(255,255,255,0.75)', { upper: true, tracking: 1.04 })
}

function whiteField(c: Ctx, x: number, y: number, w: number, h: number, maskWidth: number | null, text?: string, radius?: number) {
  fillBox(c, x, y, w, h, radius ?? h / 2, '#ffffff')
  if (text) txt(c, text, x + 24, y + h / 2 + 6, 17, 500, ML.ink)
  if (maskWidth) mask(c, x + 24 + (text ? measure(c, text, 17, 500) + 8 : 0), y + h / 2 - 9, maskWidth, 18, 'rgba(7,6,7,0.16)')
}

function checkboxRow(c: Ctx, x: number, y: number, text: string, checked: boolean) {
  fillBox(c, x, y, 22, 22, 7, checked ? '#ffffff' : 'rgba(255,255,255,0)')
  strokeBox(c, x, y, 22, 22, 7, '#ffffff', 1.5)
  if (checked) icon(c, 'check', x + 3, y + 3, 16, ML.brand, 3)
  para(c, text, x + 34, y + 16, 15, 500, '#ffffff', 560, 20)
}

function stepControls(c: Ctx, y: number, primary: string) {
  c.fillStyle = 'rgba(255,255,255,0.25)'
  c.fillRect(176, y, 672, 1)
  button(c, 'WSTECZ', 176, y + 18, 50, 'ghostWhite', { icon: 'arrowLeft', size: 14, weight: 700, tracking: 0.84, px: 24 })
  const width = measure(c, primary, 14, 700, 0.84) + 64
  button(c, primary, 848 - width, y + 18, 50, 'ink', { size: 14, weight: 700, tracking: 0.84, px: 32 })
}

/** Поля блока «Dane firmy» — и на экране, и на лицевой стороне плиты фирмы. */
function companyFields(c: Ctx, x: number, y: number) {
  label(c, 'Nazwa firmy *', x, y)
  whiteField(c, x, y + 22, 672, 56, 240, undefined)
  txt(c, 'sp. z o.o.', x + 24 + 250, y + 22 + 34, 17, 500, ML.ink)
  label(c, 'Adres firmy *', x, y + 96)
  fillBox(c, x, y + 118, 672, 110, 28, '#ffffff')
  mask(c, x + 24, y + 140, 300, 18, 'rgba(7,6,7,0.16)')
  txt(c, '60-001', x + 24, y + 196, 17, 500, ML.ink)
  mask(c, x + 90, y + 183, 150, 18, 'rgba(7,6,7,0.16)')
}

/** Слой шага 2, 3 или 4 (без цепочки: она — живая накладка). */
export function regStep(step: 2 | 3 | 4): CanvasTexture | null {
  const layout = regStepLayout(step)
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    const x = 176
    const t = layout.title
    if (step === 2) {
      txt(c, 'Dane firmy', x, t + 34, 36, 900, '#ffffff', { tracking: -1.08 })
      txt(c, 'Dane pobrane z rejestru', x, t + 40 + 14 + 14, 13, 700, 'rgba(255,255,255,0.7)', { upper: true, tracking: 1.04 })
      companyFields(c, x, layout.block.y)
      checkboxRow(c, x, layout.block.y + layout.block.h + 12, 'Inny adres do wysyłki?', false)
      stepControls(c, layout.controls - 8, 'POTWIERDZAM DANE')
    } else if (step === 3) {
      txt(c, 'Osoba kontaktowa', x, t + 34, 36, 900, '#ffffff', { tracking: -1.08 })
      label(c, 'Imię osoby kontaktowej *', x, layout.block.y)
      whiteField(c, x, layout.block.y + 22, 672, 56, null, 'Anna')
      label(c, 'Nazwisko osoby kontaktowej *', x, layout.block.y + 96)
      whiteField(c, x, layout.block.y + 118, 672, 56, 150)
      stepControls(c, layout.controls - 8, 'DALEJ')
    } else {
      txt(c, 'Telefon i e-mail', x, t + 34, 36, 900, '#ffffff', { tracking: -1.08 })
      const y0 = layout.block.y
      label(c, 'Telefon *', x, y0)
      fillBox(c, x, y0 + 22, 672, 56, 28, '#ffffff')
      txt(c, '+48', x + 24, y0 + 56, 17, 600, ML.ink)
      icon(c, 'chevronDown', x + 64, y0 + 42, 16, 'rgba(7,6,7,0.5)')
      c.fillStyle = 'rgba(7,6,7,0.15)'
      c.fillRect(x + 92, y0 + 38, 1, 24)
      mask(c, x + 108, y0 + 41, 150, 18, 'rgba(7,6,7,0.16)')
      label(c, 'Adres e-mail (login) *', x, y0 + 90)
      whiteField(c, x, y0 + 112, 672, 56, 230)
      label(c, 'Hasło *', x, y0 + 180)
      whiteField(c, x, y0 + 202, 672, 56, null, '••••••••••')
      checkboxRow(c, x, y0 + 274, 'Wyrażam zgodę na przetwarzanie moich danych osobowych (RODO). *', true)
      stepControls(c, layout.controls + 4, 'ZAREJESTRUJ SIĘ')
    }
  })
}

/** Где на листе основная кнопка шага (справа внизу): «POTWIERDZAM DANE»,
    «DALEJ», «ZAREJESTRUJ SIĘ» — для курсора и диска успеха. */
export function regPrimaryRect(step: 2 | 3 | 4): Rect {
  const layout = regStepLayout(step)
  const width = { 2: 214, 3: 118, 4: 206 }[step]
  const y = step === 4 ? layout.controls + 4 + 18 : layout.controls - 8 + 18
  return { x: 848 - width, y, w: width, h: 50 }
}

/** Лицевая сторона плиты фирмы: тот же блок, что на экране, на оранжевом. */
export function regCompanyFront(): CanvasTexture | null {
  const w = 700
  const h = 262
  return sheet(w, h, 1.5, (c) => {
    fillBox(c, 0, 0, w, h, 24, cardFill(ML.brand))
    companyFields(c, 14, 14)
  })
}

/** Оборот плиты — заявка фирмы-покупателя в тёмной теме: её же ждёт админка. */
export function companyCard(): CanvasTexture | null {
  const w = 700
  const h = 262
  return sheet(w, h, 1.5, (c) => {
    fillBox(c, 0, 0, w, h, 24, cardFill(ML.card))
    strokeBox(c, 0, 0, w, h, 24, ML.border, 1.5)
    icon(c, 'building', 28, 28, 28, ML.primary)
    mask(c, 72, 30, 220, 24)
    txt(c, 'sp. z o.o.', 302, 50, 22, 700, ML.fg)
    txt(c, 'NIP: 1234563218', 28, 104, 18, 500, ML.mutedFg)
    txt(c, 'Adres:', 28, 140, 18, 500, ML.mutedFg)
    mask(c, 92, 126, 210, 18)
    txt(c, '60-001', 314, 140, 18, 500, ML.mutedFg)
    txt(c, 'Biała lista MF · VAT czynny', 28, 176, 18, 500, ML.success)
    fillBox(c, 28, 204, 644, 1.5, 0, ML.border)
    txt(c, 'Kontrahent B2B', 28, 238, 16, 600, ML.mutedFg, { upper: true, tracking: 1.2 })
  })
}

/* ── Экран успеха и тетрис ───────────────────────────────────────────── */

/** Центр белого круга успеха на листе — в него садится диск. */
export const SUCCESS = { circle: { x: 512, y: 190, r: 48 }, title: { x: 212, y: 262, w: 600, h: 112 }, body: { x: 288, y: 386, w: 448, h: 120 }, button: { x: 462, y: 520, w: 100, h: 52 } }

export function successTitle(): CanvasTexture | null {
  const { w, h } = SUCCESS.title
  return sheet(w, h, 2, (c) => {
    txt(c, 'Sprawdź swoją', w / 2, 46, 48, 900, '#ffffff', { align: 'center', tracking: -1.44 })
    txt(c, 'skrzynkę e-mail', w / 2, 94, 48, 900, '#ffffff', { align: 'center', tracking: -1.44 })
  })
}

export function successBody(): CanvasTexture | null {
  const { w, h } = SUCCESS.body
  return sheet(w, h, 2, (c) => {
    para(
      c,
      'Wysłaliśmy link weryfikacyjny na adres biuro@••••••.pl. Po potwierdzeniu Twoje zgłoszenie trafi do ręcznej weryfikacji, a nasz zespół poinformuje Cię e-mailem.',
      w / 2,
      24,
      17,
      400,
      'rgba(255,255,255,0.85)',
      w,
      27,
      'center',
    )
  })
}

export function successButton(): CanvasTexture | null {
  const { w, h } = SUCCESS.button
  return sheet(w, h, 2, (c) => {
    button(c, 'DALEJ', 0, 0, h, 'ink', { size: 14, weight: 700, tracking: 0.84, width: w })
  })
}

/** Поле тетриса 10 × 20: на листе — плитка поля, пульт и ссылка. */
export const TETRIS = { board: { x: 412, y: 150, w: 200, h: 400 }, cell: 20 }

export function tetrisLayer(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    const { board } = TETRIS
    txt(c, 'Zagraj, my sprawdzamy zgłoszenie', board.x - 60, board.y - 16, 13, 700, 'rgba(255,255,255,0.8)', { upper: true, tracking: 1.3 })
    txt(c, '0', board.x + board.w + 60, board.y - 16, 13, 700, '#ffffff', { align: 'right' })
    fillBox(c, board.x, board.y, board.w, board.h, 24, 'rgba(255,255,255,0.12)')
    const pads: IconName[] = ['arrowLeft', 'rotateCcw', 'arrowDown', 'arrowRight']
    pads.forEach((name, index) => {
      const cx = board.x + board.w / 2 + (index - 1.5) * 60
      circle(c, cx, board.y + board.h + 44, 23.5, undefined, 'rgba(255,255,255,0.55)', 1)
      icon(c, name, cx - 10, board.y + board.h + 34, 20, '#ffffff')
    })
    txt(c, 'Przeglądaj produkty', PANEL.w / 2, board.y + board.h + 100, 14, 700, 'rgba(255,255,255,0.8)', { align: 'center', upper: true, tracking: 0.84 })
  })
}

/* ═══ Админка: боковое меню ══════════════════════════════════════════════ */

const NAV: [string, [IconName, string][]][] = [
  ['Przegląd', [['dashboard', 'Panel główny'], ['target', 'Priorytety'], ['chart', 'Statystyki']]],
  ['Katalog', [['package', 'Produkty'], ['folderTree', 'Kategorie'], ['badgeCheck', 'Marki']]],
  ['Sprzedaż', [['cart', 'Zamówienia'], ['fileText', 'Faktury'], ['creditCard', 'Kredyty'], ['percent', 'Rabaty']]],
  ['CRM', [['userPlus', 'Leady'], ['kanban', 'Kanban'], ['message', 'Czaty'], ['calendar', 'Kalendarz']]],
  ['B2B i marketing', [['handshake', 'Kontrahenci B2B'], ['mail', 'Kampanie e-mail'], ['fileText', 'Szablony']]],
  ['System', [['users', 'Użytkownicy'], ['radio', 'Kanały sprzedaży'], ['settings', 'Integracje'], ['globe', 'Ustawienia strony'], ['key', 'Moje konto i klucze']]],
]

const SIDEBAR = 256

/** Боковое меню админки; groups — какие группы видны (меню прокручено). */
function adminFrame(c: Ctx, w: number, h: number, active: string, groups: number[]) {
  c.fillStyle = sheetFill(ML.main)
  c.fillRect(0, 0, w, h)
  c.fillStyle = tint(ML.card, 0.5)
  c.fillRect(0, 0, SIDEBAR, h)
  c.fillStyle = ML.border
  c.fillRect(SIDEBAR, 0, 1, h)
  brandMark(c, 24, 46, 14, '#ffffff', ML.primary)
  txt(c, 'Panel administracyjny', 24, 68, 12, 400, ML.mutedFg)
  icon(c, 'panelLeft', SIDEBAR - 44, 30, 16, ML.mutedFg)
  let y = 100
  for (const index of groups) {
    const [title, items] = NAV[index]!
    txt(c, title, 40, y + 12, 11.5, 600, ML.mutedFg, { upper: true, tracking: 0.6 })
    y += 22
    for (const [glyph, name] of items) {
      const on = name === active
      if (on) {
        c.save()
        c.shadowColor = 'rgba(250,79,0,0.5)'
        c.shadowBlur = 12
        fillBox(c, 24, y, SIDEBAR - 48, 38, 14, 'rgba(250,79,0,0.1)')
        c.restore()
        fillBox(c, 24, y, SIDEBAR - 48, 38, 14, 'rgba(250,79,0,0.1)')
      }
      icon(c, glyph, 40, y + 11, 16, on ? ML.primary : ML.mutedFg)
      txt(c, name, 68, y + 24, 14, 500, on ? ML.primary : ML.mutedFg)
      y += 42
    }
    y += 18
    if (y > h - 60) break
  }
}

/* ═══ Kontrahenci B2B: заявка и одобрение (станция 06) ══════════════════ */

export const ADMIN_MAIN = { x: SIDEBAR + 32, w: PANEL.w - SIDEBAR - 64 }
/** Где на листе встаёт карточка заявки (гнездо для плиты фирмы). */
export const APPLICATION: Rect = { x: ADMIN_MAIN.x, y: 156, w: ADMIN_MAIN.w, h: 222 }

export function adminB2B(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    adminFrame(c, PANEL.w, PANEL.h, 'Kontrahenci B2B', [0, 2, 4, 5])
    const x = ADMIN_MAIN.x
    const width = txt(c, 'Wnioski o współpracę', x, 52, 19, 700, ML.fg)
    tag(c, '1', x + width + 8, 38, { color: ML.primary, bg: 'rgba(250,79,0,0.15)', size: 12, h: 20 })
    txt(c, 'Ręczna weryfikacja wniosków resellerów i kontrahentów.', x, 76, 14, 400, ML.mutedFg)
    input(c, x, 96, 250, 40, null, 'Szukaj firmy, e-maila lub NIP (/ lub f)…', { size: 13 })
    icon(c, 'search', x + 10, 110, 14, ML.mutedFg)
    let bx = x + 262
    bx += button(c, 'Zaznacz', bx, 96, 40, 'outline', { icon: 'squareCheck' }) + 8
    fillBox(c, bx, 96, 176, 40, 14, ML.bg)
    strokeBox(c, bx, 96, 176, 40, 14, ML.border)
    txt(c, 'Oczekuje na decyzję', bx + 12, 121, 13, 400, ML.fg)
    icon(c, 'chevronDown', bx + 150, 108, 16, ML.mutedFg)
    bx += 184
    button(c, 'Odśwież', bx, 96, 40, 'outline', { icon: 'refresh' })
    /* Гнездо под карточку: плита фирмы прилетает сюда. */
    strokeBox(c, APPLICATION.x, APPLICATION.y, APPLICATION.w, APPLICATION.h, 16, 'rgba(255,255,255,0.12)', 1.5, [6, 6])
    /* Ниже — реестр контрахентов, как AdminUsersPage b2bOnly. */
    const ry = APPLICATION.y + APPLICATION.h + 28
    txt(c, 'Kontrahenci B2B', x, ry, 17, 700, ML.fg)
    fillBox(c, x, ry + 14, ADMIN_MAIN.w, 196, 16, cardFill(ML.card))
    strokeBox(c, x, ry + 14, ADMIN_MAIN.w, 196, 16, ML.border)
    const cols = ['Firma', 'NIP', 'Status', 'Zamówienia']
    cols.forEach((name, index) => txt(c, name, x + 20 + index * 170, ry + 44, 12, 600, ML.mutedFg, { upper: true, tracking: 0.6 }))
    for (let row = 0; row < 3; row++) {
      const yy = ry + 58 + row * 46
      fillBox(c, x + 12, yy, ADMIN_MAIN.w - 24, 1, 0, ML.border)
      mask(c, x + 20, yy + 18, 110 - row * 12, 14)
      mask(c, x + 190, yy + 18, 90, 14)
      tag(c, 'Zatwierdzony', x + 360, yy + 13, { color: ML.mutedFg, bg: ML.muted, size: 12, h: 22 })
      txt(c, String([14, 6, 3][row]), x + 530, yy + 30, 14, 500, ML.fg)
    }
  })
}

/** Карточка заявки: до решения и после «Zatwierdź». */
export function applicationCard(approved: boolean): CanvasTexture | null {
  const { w, h } = APPLICATION
  return sheet(w, h, PANEL.k * 1.3, (c) => {
    fillBox(c, 0, 0, w, h, 16, ML.card)
    strokeBox(c, 0, 0, w, h, 16, approved ? 'rgba(140,186,94,0.5)' : ML.border, 1)
    const x = 20
    mask(c, x, 22, 150, 16)
    const nameWidth = txt(c, 'sp. z o.o.', x + 158, 35, 16, 600, ML.fg)
    const statusX = x + 158 + nameWidth + 10
    const statusWidth = tag(c, approved ? 'Zatwierdzony' : 'Oczekuje na decyzję', statusX, 20, { color: ML.mutedFg, bg: ML.muted, size: 12, h: 22 })
    if (!approved) tag(c, 'dziś', statusX + statusWidth + 8, 20, { color: ML.emeraldLight, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', size: 12, weight: 700, h: 22, icon: 'clock' })
    const line = (y: number, parts: (string | number)[]) => {
      let cx = x
      for (const part of parts) {
        if (typeof part === 'number') {
          mask(c, cx, y - 11, part, 13)
          cx += part + 6
        } else cx += txt(c, part, cx, y, 14, 400, ML.mutedFg) + 6
      }
    }
    line(66, ['Anna', 70, '·', 110, '·', 'PL'])
    line(90, ['NIP: 1234563218 · Strona WWW: —'])
    line(114, ['Adres:', 130, '60-001', 70])
    line(138, ['Kanały: —'])
    line(162, ['Wolumen: — · Zamówienia: 0'])
    /* Кнопки не влезают рядом с данными — flex-wrap продукта переносит их вниз. */
    const right = w - 20
    const row = 172
    if (approved) {
      const bw = button(c, 'Zapisz minimum', 0, -100, 40, 'outline', { icon: 'save' })
      const dw = button(c, 'Odrzuć', 0, -100, 40, 'danger', { icon: 'xCircle' })
      input(c, 20, row, right - bw - dw - 16 - 20, 40, null, 'Globalna min. ilość', { size: 13 })
      button(c, 'Zapisz minimum', right - bw - dw - 8, row, 40, 'outline', { icon: 'save' })
      button(c, 'Odrzuć', right - dw, row, 40, 'danger', { icon: 'xCircle' })
    } else {
      const aw = button(c, 'Zatwierdź', 0, -100, 40, 'primary', { icon: 'checkCircle' })
      const dw = button(c, 'Odrzuć', 0, -100, 40, 'danger', { icon: 'xCircle' })
      input(c, 20, row, right - aw - dw - 16 - 20, 40, null, 'Globalna min. ilość', { size: 13 })
      button(c, 'Zatwierdź', right - aw - dw - 8, row, 40, 'primary', { icon: 'checkCircle' })
      button(c, 'Odrzuć', right - dw, row, 40, 'danger', { icon: 'xCircle' })
    }
  })
}

/** Где на карточке кнопка «Zatwierdź» (для курсора), в долях карточки. */
export function approveButtonCenter(): [number, number] {
  const w = APPLICATION.w
  const aw = 121
  const dw = 101
  return [(w - 20 - aw - dw - 8 + aw / 2) / w, 192 / APPLICATION.h]
}

/** Тост sonner: тёмная плашка с зелёной галочкой. */
export function toast(text: string, width = 360): CanvasTexture | null {
  const h = 56
  return sheet(width, h, 2.4, (c) => {
    /* Тост плотный, как в продукте (sonner): под ним — содержимое панели. */
    fillBox(c, 0, 0, width, h, 14, ML.card)
    strokeBox(c, 0, 0, width, h, 14, ML.border, 1)
    icon(c, 'checkCircle', 18, 18, 20, ML.emeraldLight)
    txt(c, text, 50, 34, 14, 500, ML.fg)
  })
}

/* ═══ Письмо «Konto B2B zatwierdzone» (станция 07) ══════════════════════ */

export const EMAIL_CTA: Rect = { x: 110, y: 392, w: 300, h: 56 }

export function approvalEmail(): CanvasTexture | null {
  const { w, h, k } = EMAIL_UI
  return sheet(w, h, k, (c) => {
    fillBox(c, 0, 0, w, h, 22, tint('#ffffff', 0.88))
    c.save()
    round(c, 0, 0, w, h, 22)
    c.clip()
    const gradient = c.createLinearGradient(0, 0, w, 130)
    gradient.addColorStop(0, ML.mail)
    gradient.addColorStop(1, '#34c168')
    c.fillStyle = gradient
    c.fillRect(0, 0, w, 130)
    c.restore()
    brandMark(c, w / 2, 70, 24, '#ffffff', '#ffffff', 'center')
    txt(c, 'Profesjonalne zaopatrzenie hurtowe', w / 2, 98, 13, 400, 'rgba(255,255,255,0.9)', { align: 'center' })
    txt(c, 'Konto B2B zatwierdzone', w / 2, 188, 24, 700, ML.mail, { align: 'center' })
    txt(c, 'Cześć Anna,', 30, 236, 16, 400, '#333333')
    para(c, 'Twoje konto kontrahenta B2B zostało zatwierdzone. Możesz zalogować się i korzystać z dedykowanych cen hurtowych.', 30, 272, 16, 400, '#333333', w - 60, 26)
    drawMailCta(c, EMAIL_CTA)
    fillBox(c, 30, 500, w - 60, 1, 0, '#eeeeee')
    txt(c, 'Z poważaniem,', 30, 534, 16, 400, '#555555')
    txt(c, 'Zespół Hurtownia Demo', 30, 560, 16, 400, '#555555')
    /* Карточка обрезана выше подвала с реквизитами. */
  })
}

function drawMailCta(c: Ctx, rect: Rect) {
  c.save()
  c.shadowColor = 'rgba(22,163,74,0.25)'
  c.shadowBlur = 15
  c.shadowOffsetY = 4
  const gradient = c.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h)
  gradient.addColorStop(0, ML.mail)
  gradient.addColorStop(1, '#34c168')
  round(c, rect.x, rect.y, rect.w, rect.h, 30)
  c.fillStyle = gradient
  c.fill()
  c.restore()
  txt(c, 'Otwórz panel B2B →', rect.x + rect.w / 2, rect.y + rect.h / 2 + 6, 16, 600, '#ffffff', { align: 'center' })
}

/** Кнопка письма отдельно — она вырастает в дверь. */
export function mailButton(): CanvasTexture | null {
  const rect = EMAIL_CTA
  return sheet(rect.w + 20, rect.h + 20, 2.5, (c) => drawMailCta(c, { x: 10, y: 10, w: rect.w, h: rect.h }))
}

/* ═══ Витрина: шапка сайта ══════════════════════════════════════════════ */

function siteHeader(c: Ctx, w: number, pad = 56, alpha = 1) {
  c.fillStyle = tint('#000000', alpha)
  c.fillRect(0, 0, w, 64)
  let x = pad + brandMark(c, pad, 39, 14, ML.primary, ML.primary) + 44
  for (const [name, on] of [
    ['Sklep', true],
    ['O nas', false],
    ['Kontakt', false],
  ] as const) {
    x += txt(c, name, x, 38, 15, 700, on ? ML.primary : ML.fg, { tracking: 0.3 }) + 28
  }
  const icons: IconName[] = ['search', 'heart', 'user', 'cart']
  icons.forEach((name, index) => icon(c, name, w - pad - 20 - (icons.length - 1 - index) * 40, 22, 20, ML.fg))
  circle(c, w - pad - 2, 22, 8, ML.primary)
  txt(c, '4', w - pad - 2, 26, 9, 700, '#ffffff', { align: 'center' })
  c.fillStyle = ML.border
  c.fillRect(0, 63, w, 1)
}

/* ── Витрина «Sklep» списком (станция 09) ────────────────────────────── */

export const SHOP = {
  banner: { x: 40, y: 82, w: 672, h: 44 } as Rect,
  toolbar: { x: 40, y: 148, w: 944, h: 64 } as Rect,
  sort: { x: 690, y: 160, w: 170, h: 40 } as Rect,
  list: { x: 40, y: 232, w: 944, h: 460 } as Rect,
  row: (slot: number): Rect => ({ x: 48, y: 276 + slot * 92, w: 928, h: 88 }),
}

const COLS = { product: 16, b2b: 302, retail: 443, earn: 589, qty: 760 }

export function shopBase(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    c.fillStyle = sheetFill(ML.bg)
    c.fillRect(0, 0, PANEL.w, PANEL.h)
    siteHeader(c, PANEL.w, 40, 0.5)
    const t = SHOP.toolbar
    fillBox(c, t.x, t.y, t.w, t.h, 16, cardFill(ML.card))
    button(c, 'Pokaż filtry', t.x + 12, t.y + 12, 40, 'secondary', { icon: 'panelLeft' })
    txt(c, 'Znaleziono 36 produktów', t.x + 160, t.y + 37, 14, 400, ML.mutedFg)
    tag(c, 'Twoje zniżki', t.x + 420, t.y + 12, { color: ML.fg, bg: ML.muted, size: 14, h: 40, px: 16, icon: 'tag' })
    fillBox(c, t.x + t.w - 132, t.y + 10, 120, 44, 22, ML.bg)
    const views: IconName[] = ['layoutList', 'layoutGrid', 'package']
    views.forEach((name, index) => {
      const cx = t.x + t.w - 128 + index * 38
      if (index === 0) fillBox(c, cx, t.y + 14, 36, 36, 18, ML.fg)
      icon(c, name, cx + 10, t.y + 24, 16, index === 0 ? ML.bg : ML.fg)
    })
    const l = SHOP.list
    fillBox(c, l.x, l.y, l.w, l.h, 28, cardFill(ML.card))
    fillBox(c, l.x + 8, l.y + 8, l.w - 16, 40, 16, 'rgba(255,255,255,0.04)')
    const heads: [string, number][] = [
      ['Produkt', COLS.product],
      ['Cena bazowa B2B (netto)', COLS.b2b],
      ['Sugerowana cena detaliczna', COLS.retail],
      ['Twój potencjalny zarobek', COLS.earn],
    ]
    heads.forEach(([name, x]) => {
      const lines = wrap(c, name.toUpperCase(), 11, 600, x === COLS.product ? 260 : 125)
      lines.forEach((line, index) => txt(c, line, l.x + 8 + x, l.y + 25 + index * 12 - (lines.length - 1) * 6, 11, 600, ML.mutedFg, { tracking: 0.2 }))
    })
    txt(c, 'ILOŚĆ / KOSZYK', l.x + 8 + 912, l.y + 32, 11, 600, ML.mutedFg, { align: 'right', tracking: 0.2 })
  })
}

export function shopBanner(): CanvasTexture | null {
  const { w, h } = SHOP.banner
  return sheet(w, h, 2, (c) => {
    fillBox(c, 0, 0, w, h, 16, ML.primary)
    txt(c, 'Dynamiczne ceny B2B są aktywne dla Twojego konta.', 16, 27, 14, 500, '#ffffff')
    const width = measure(c, '-12%', 14, 600) + 24
    fillBox(c, w - 16 - width, 9, width, 26, 13, ML.fg)
    txt(c, '-12%', w - 16 - width / 2, 27, 14, 600, ML.bg, { align: 'center' })
  })
}

/** Сортировка: оранжевая пилюля с «Polecane» или «Marża ↓». */
export const drawSort = (value: string): LiveDraw => (c, width, height) => {
  fillBox(c, 0, 0, width, height, height / 2, ML.brand)
  icon(c, 'arrowUpDown', 14, (height - 16) / 2, 16, 'rgba(255,255,255,0.9)')
  txt(c, value, 40, height / 2 + 5, 14, 600, '#ffffff')
  icon(c, 'chevronDown', width - 30, (height - 16) / 2, 16, 'rgba(255,255,255,0.9)')
}

const SORT_OPTIONS = ['Polecane', 'Najnowsze', 'Popularność', 'Cena ↑', 'Cena ↓', 'Marża ↓', 'Marża ↑', 'Zarobek ↓']

/** Список сортировки — выходит из панели плитой. */
export function sortMenu(): CanvasTexture | null {
  const w = 200
  const h = 12 + SORT_OPTIONS.length * 36
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 16, ML.card)
    strokeBox(c, 0, 0, w, h, 16, ML.border)
    SORT_OPTIONS.forEach((name, index) => {
      const y = 6 + index * 36
      const on = name === 'Marża ↓'
      if (on) fillBox(c, 6, y, w - 12, 34, 12, 'rgba(250,79,0,0.15)')
      txt(c, name, 18, y + 22, 14, on ? 600 : 400, on ? ML.primary : ML.fg)
      if (on) icon(c, 'check', w - 34, y + 9, 16, ML.primary)
    })
  })
}

/** Строка товара в списке (grid продукта, режим «list»). */
export function shopRow(good: Good): CanvasTexture | null {
  const { w, h } = SHOP.row(0)
  return sheet(w, h, PANEL.k * 1.2, (c) => {
    fillBox(c, 0, 0, w, h, 16, ML.bg)
    goodsPicture(c, good.picture, COLS.product, 12, 64)
    const lines = wrap(c, good.name, 14, 600, 185)
    lines.slice(0, 2).forEach((line, index) => txt(c, line, COLS.product + 76, 38 + index * 20 + (lines.length > 1 ? 0 : 10), 14, 600, ML.fg))
    glowText(c, zl(good.net), COLS.b2b, 50, 16, 700, ML.brand, 12)
    txt(c, zl(good.retail), COLS.retail, 50, 14, 600, ML.fg)
    glowText(c, zl(Math.round((good.retail - good.net) * 100) / 100), COLS.earn, 42, 14, 600, ML.emeraldLight, 8)
    txt(c, `Marża: ${percent(marginOf(good))}`, COLS.earn, 64, 12, 400, ML.mutedFg)
    const qx = COLS.qty
    fillBox(c, qx, 26, 108, 36, 18, ML.bg)
    strokeBox(c, qx, 26, 108, 36, 18, ML.border)
    icon(c, 'minus', qx + 12, 37, 14, ML.fg)
    txt(c, '1', qx + 54, 49, 14, 600, ML.fg, { align: 'center' })
    icon(c, 'plus', qx + 82, 37, 14, ML.fg)
    circle(c, qx + 134, 44, 18, ML.primary)
    icon(c, 'cart', qx + 125, 35, 18, '#ffffff')
  })
}

/* ── Страница товара (станции 10–11) ─────────────────────────────────── */

export const PRODUCT = {
  image: { x: 32, y: 128, w: 456, h: 456 } as Rect,
  cells: [0, 1, 2].map((index) => ({ x: 536 + index * 152, y: 214, w: 144, h: 110 })) as Rect[],
  chips: { x: 536, y: 336, w: 456, h: 28 } as Rect,
  tiers: { x: 536, y: 376, w: 456, h: 160 } as Rect,
  qty: { x: 541, y: 552, w: 40, h: 34 } as Rect,
  add: { x: 666, y: 548, w: 270, h: 44 } as Rect,
}

export const TIERS = [
  { from: 10, percent: 5 },
  { from: 50, percent: 10 },
  { from: 200, percent: 15 },
]

/** Цена за штуку при количестве qty — как getDiscountedUnitPrice. */
export function unitPrice(qty: number, base = CARTON.net): number {
  let pct = 0
  for (const tier of TIERS) if (qty >= tier.from) pct = tier.percent
  return Math.round(base * (1 - pct / 100) * 100) / 100
}

export function productBase(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, drawProductBase)
}

function drawProductBase(c: Ctx) {
  {
    c.fillStyle = sheetFill(ML.bg)
    c.fillRect(0, 0, PANEL.w, PANEL.h)
    siteHeader(c, PANEL.w, 32, 0.5)
    button(c, 'Wstecz', 24, 78, 34, 'ghost', { icon: 'arrowLeft', size: 13 })
    const img = PRODUCT.image
    fillBox(c, img.x, img.y, img.w, img.h, 28, cardFill(ML.card))
    const glow = c.createRadialGradient(img.x + img.w / 2, img.y + img.h * 0.62, 10, img.x + img.w / 2, img.y + img.h * 0.62, img.w * 0.6)
    glow.addColorStop(0, 'rgba(255,255,255,0.07)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = glow
    fillBox(c, img.x, img.y, img.w, img.h, 28, 'rgba(0,0,0,0)')
    c.fillStyle = glow
    c.fillRect(img.x, img.y, img.w, img.h)
    c.fillStyle = 'rgba(255,255,255,0.05)'
    c.beginPath()
    c.ellipse(img.x + img.w / 2, img.y + img.h * 0.78, img.w * 0.32, 18, 0, 0, Math.PI * 2)
    c.fill()
    txt(c, 'Karton klapowy 600×400×400 mm', 536, 160, 29, 700, ML.fg, { tracking: -0.4 })
    txt(c, '5-warstwowy', 536, 196, 29, 700, ML.fg, { tracking: -0.4 })
    fillBox(c, 536, 548, 128, 44, 22, ML.bg)
    strokeBox(c, 536, 548, 128, 44, 22, ML.border)
    icon(c, 'minus', 548, 562, 16, ML.fg)
    icon(c, 'plus', 636, 562, 16, ML.fg)
    fillBox(c, 944, 548, 48, 44, 22, ML.bg)
    strokeBox(c, 944, 548, 48, 44, 22, ML.border)
    icon(c, 'heart', 958, 560, 20, ML.fg)
  }
}

function neonCell(c: Ctx, w: number, h: number, colour: string, bgAlpha: number, strength: number) {
  c.save()
  c.shadowColor = colour
  c.shadowBlur = 26 * strength
  fillBox(c, 6, 6, w - 12, h - 12, 16, `${colour}${Math.round(bgAlpha * 255).toString(16).padStart(2, '0')}`)
  c.restore()
  fillBox(c, 6, 6, w - 12, h - 12, 16, ML.bg)
  fillBox(c, 6, 6, w - 12, h - 12, 16, `${colour}${Math.round(bgAlpha * 255).toString(16).padStart(2, '0')}`)
  strokeBox(c, 6, 6, w - 12, h - 12, 16, `${colour}${Math.round(Math.min(1, strength * 140 / 255) * 255).toString(16).padStart(2, '0')}`, 1)
}

/** Три неоновые ячейки цены: оранжевая (B2B), синяя (розница), зелёная (заработок). */
export function priceCell(kind: 'b2b' | 'retail' | 'yours'): CanvasTexture | null {
  return sheet(CELL.w, CELL.h, 2.6, (c) => drawPriceCell(c, kind))
}

const CELL = { w: 156, h: 122 }

function drawPriceCell(c: Ctx, kind: 'b2b' | 'retail' | 'yours') {
  const w = CELL.w
  const h = CELL.h
  {
    const x = 18
    if (kind === 'retail') {
      neonCell(c, w, h, ML.blue, 0.12, 1)
      txt(c, 'SUGEROWANA', x, 34, 14, 700, ML.fg)
      txt(c, 'CENA DETALICZNA', x, 51, 14, 700, ML.fg)
      txt(c, '(BRUTTO)', x, 69, 11, 400, ML.mutedFg)
      glowText(c, zl(CARTON.retail), x, 98, 18, 600, ML.blueLight, 12)
      return
    }
    const yours = kind === 'yours'
    neonCell(c, w, h, yours ? ML.emerald : ML.brand, 0.12, 1)
    txt(c, 'CENA BAZOWA', x, 34, 14, 700, ML.fg)
    txt(c, 'B2B', x, 51, 14, 700, ML.fg)
    txt(c, '(NETTO / VAT 23%)', x, 69, 11, 400, ML.mutedFg)
    if (yours) {
      txt(c, zl(CARTON.net), x, 84, 11, 400, ML.mutedFg)
      c.fillStyle = ML.mutedFg
      c.fillRect(x, 80, measure(c, zl(CARTON.net), 11, 400), 1)
      glowText(c, zl(YOUR_PRICE), x, 106, 20, 700, ML.emerald, 10)
      txt(c, 'TWOJA CENA', x + measure(c, zl(YOUR_PRICE), 20, 700) + 8, 105, 9.5, 600, ML.emerald, { tracking: 0.5 })
    } else glowText(c, zl(CARTON.net), x, 98, 18, 700, ML.brand, 12)
  }
}

export const YOUR_PRICE = 7.9

/** Ячейка заработка — живая: сумма и свечение растут с количеством. */
export const drawEarnings = (qty: number, yours: boolean): LiveDraw => (c, w, h) => {
  const purchase = yours ? YOUR_PRICE : unitPrice(qty)
  const earnings = Math.round((CARTON.retail - purchase) * qty * 100) / 100
  const margin = Math.round(((CARTON.retail - purchase) / CARTON.retail) * 10000) / 100
  const intensity = Math.min(1, Math.max(0, (qty - 1) / 50))
  neonCell(c, w, h, ML.emerald, 0.08 + intensity * 0.4, 1 + intensity * 0.5)
  txt(c, 'Twój zarobek', 18, 34, 14, 700, ML.fg)
  txt(c, '(POTENCJALNY)', 18, 52, 11, 400, ML.mutedFg)
  const mix = Math.round(intensity * 100)
  const colour = `color-mix(in srgb, ${ML.emeraldLight}, #ecfff6 ${mix}%)`
  c.save()
  c.shadowColor = `rgba(16,185,129,${0.35 + intensity * 0.65})`
  c.shadowBlur = 4 + intensity * 16
  txt(c, zl(earnings), 18, 82, 17, 600, colour)
  c.restore()
  txt(c, zl(earnings), 18, 82, 17, 600, colour)
  tag(c, `MARŻA ${percent(margin)}`, 17, 90, { color: ML.emerald, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', size: 9.5, weight: 700, h: 18, px: 7, tracking: 0.4 })
}

/** Ряд чипов под ценами: ступень ilościowa и наличие. */
export const drawChips = (qty: number): LiveDraw => (c) => {
  let x = 0
  const tier = [...TIERS].reverse().find((item) => qty >= item.from)
  if (tier) {
    x += tag(c, `Rabat ilościowy: −${tier.percent}% (od ${tier.from} szt.)`, x, 0, { color: ML.emeraldLight, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.4)', size: 12, h: 26, icon: 'layers' })
    x += 8
    x += txt(c, `${zl(CARTON.net)} → ${zl(unitPrice(qty))}`, x, 18, 12, 500, ML.emeraldLight) + 10
  }
  tag(c, '480 szt. dostępne', x, 0, { color: ML.mutedFg, bg: 'rgba(26,26,26,0.6)', border: ML.border, size: 12, h: 26, icon: 'package' })
}

/** Блок порогов: активная строка подсвечена (ring primary/40). */
export const drawTiers = (qty: number): LiveDraw => (c, w, h) => {
  fillBox(c, 0, 0, w, h, 16, 'rgba(250,79,0,0.05)')
  strokeBox(c, 0, 0, w, h, 16, 'rgba(250,79,0,0.2)')
  txt(c, 'Progi rabatowe ilościowe', 16, 26, 14, 600, ML.fg)
  txt(c, 'Więcej w koszyku, niższa cena za sztukę.', w - 16, 26, 12, 400, ML.mutedFg, { align: 'right' })
  txt(c, 'Rabaty są liczone od kwoty netto.', 16, 46, 12, 500, ML.mutedFg)
  TIERS.forEach((tier, index) => {
    const y = 60 + index * 32
    const next = TIERS[index + 1]
    const on = qty >= tier.from && (!next || qty < next.from)
    fillBox(c, 12, y, w - 24, 28, 12, on ? 'rgba(250,79,0,0.15)' : 'rgba(0,0,0,0.6)')
    if (on) strokeBox(c, 12, y, w - 24, 28, 12, 'rgba(250,79,0,0.4)')
    txt(c, `Od ${tier.from} szt. — ${tier.percent}% rabatu`, 24, y + 19, 14, on ? 600 : 400, on ? ML.fg : 'rgba(255,255,255,0.9)')
    txt(c, zl(unitPrice(tier.from)), w - 24, y + 19, 14, on ? 600 : 400, ML.fg, { align: 'right' })
  })
}

/** «Masz najlepszą cenę» вместо порогов — у своей цены клиента их нет. */
export function bestPrice(): CanvasTexture | null {
  const { w, h } = PRODUCT.tiers
  return sheet(w, h, PANEL.k * 1.4, (c) => {
    fillBox(c, 0, 0, w, 56, 16, 'rgba(16,185,129,0.07)')
    strokeBox(c, 0, 0, w, 56, 16, 'rgba(16,185,129,0.3)')
    txt(c, 'Masz najlepszą cenę', 16, 34, 14, 600, ML.emerald)
  })
}

export const drawQty = (qty: number): LiveDraw => (c, w, h) => {
  txt(c, String(qty), w / 2, h / 2 + 6, 16, 600, ML.fg, { align: 'center' })
}

export const drawAddButton = (qty: number, yours: boolean): LiveDraw => (c, w, h) => {
  const total = Math.round((yours ? YOUR_PRICE : unitPrice(qty)) * qty * 100) / 100
  c.save()
  c.shadowColor = 'rgba(204,102,51,0.4)'
  c.shadowBlur = 30
  fillBox(c, 0, 0, w, h, h / 2, ML.primary)
  c.restore()
  fillBox(c, 0, 0, w, h, h / 2, ML.primary)
  const label = `Dodaj do koszyka — ${zl(total)}`
  const width = measure(c, label, 15, 500) + 28
  icon(c, 'cart', (w - width) / 2, h / 2 - 10, 20, '#ffffff')
  txt(c, label, (w - width) / 2 + 28, h / 2 + 5, 15, 500, '#ffffff')
}

/** Страница товара целиком — для панели, которая перелетает через ленту. */
export function productComposite(yours: boolean): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    drawProductBase(c)
    const kinds: ('b2b' | 'retail' | 'yours')[] = [yours ? 'yours' : 'b2b', 'retail']
    kinds.forEach((kind, index) => {
      const r = PRODUCT.cells[index]!
      c.save()
      c.translate(r.x - 6, r.y - 6)
      c.scale((r.w + 12) / CELL.w, (r.h + 12) / CELL.h)
      drawPriceCell(c, kind)
      c.restore()
    })
    const e = PRODUCT.cells[2]!
    c.save()
    c.translate(e.x - 6, e.y - 6)
    drawEarnings(1, yours)(c, e.w + 12, e.h + 12)
    c.restore()
    c.save()
    c.translate(PRODUCT.chips.x, PRODUCT.chips.y)
    drawChips(1)(c, PRODUCT.chips.w, PRODUCT.chips.h)
    c.restore()
    const t = PRODUCT.tiers
    c.save()
    c.translate(t.x, t.y)
    if (yours) {
      fillBox(c, 0, 0, t.w, 56, 16, 'rgba(16,185,129,0.07)')
      strokeBox(c, 0, 0, t.w, 56, 16, 'rgba(16,185,129,0.3)')
      txt(c, 'Masz najlepszą cenę', 16, 34, 14, 600, ML.emerald)
    } else drawTiers(1)(c, t.w, t.h)
    c.restore()
    c.save()
    c.translate(PRODUCT.qty.x, PRODUCT.qty.y)
    drawQty(1)(c, PRODUCT.qty.w, PRODUCT.qty.h)
    c.restore()
    c.save()
    c.translate(PRODUCT.add.x, PRODUCT.add.y)
    drawAddButton(1, yours)(c, PRODUCT.add.w, PRODUCT.add.h)
    c.restore()
  })
}

/* ── Редактор товара: своя цена клиента (станция 11) ─────────────────── */

export const EDITOR = {
  section: { x: ADMIN_MAIN.x, y: 108, w: ADMIN_MAIN.w, h: 520 } as Rect,
  table: { x: ADMIN_MAIN.x + 24, y: 214, w: ADMIN_MAIN.w - 48, h: 92 } as Rect,
  search: { x: ADMIN_MAIN.x + 36, y: 372, w: ADMIN_MAIN.w - 72, h: 40 } as Rect,
  row: { x: ADMIN_MAIN.x + 36, y: 424, w: ADMIN_MAIN.w - 72, h: 64 } as Rect,
}

export function editorBase(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, drawEditorBase)
}

function drawEditorBase(c: Ctx) {
  {
    adminFrame(c, PANEL.w, PANEL.h, 'Produkty', [0, 1, 2, 4])
    const x = ADMIN_MAIN.x
    icon(c, 'arrowLeft', x, 30, 16, ML.mutedFg)
    txt(c, 'Produkty', x + 24, 44, 14, 500, ML.mutedFg)
    txt(c, 'Karton klapowy 600×400×400 mm 5-warstwowy', x, 84, 22, 700, ML.fg, { tracking: -0.2 })
    const s = EDITOR.section
    fillBox(c, s.x, s.y, s.w, s.h, 16, cardFill(ML.card))
    strokeBox(c, s.x, s.y, s.w, s.h, 16, ML.border)
    icon(c, 'percent', s.x + 24, s.y + 24, 20, ML.primary)
    txt(c, 'Zniżki', s.x + 54, s.y + 41, 18, 600, ML.fg)
    txt(c, 'Indywidualne zniżki B2B na użytkownika', s.x + 24, s.y + 78, 15, 600, ML.fg)
    txt(c, 'Cena tylko dla wskazanego kontrahenta, na ten produkt.', s.x + 24, s.y + 98, 12, 400, ML.mutedFg)
    const box = { x: s.x + 24, y: 318, w: s.w - 48, h: 186 }
    strokeBox(c, box.x, box.y, box.w, box.h, 16, ML.border, 1.5, [5, 5])
    icon(c, 'userPlus', box.x + 12, box.y + 14, 16, ML.primary)
    txt(c, 'Dodaj zniżkę dla kontrahenta', box.x + 36, box.y + 27, 14, 500, ML.fg)
    icon(c, 'search', EDITOR.search.x + 10, EDITOR.search.y + 13, 14, ML.mutedFg)
    para(c, 'Zniżka indywidualna zastępuje cenę i nie łączy się z progami ilościowymi — tak samo działała we wcześniejszym sklepie. Ma pierwszeństwo przed cennikiem firmowym, ceną segmentu i zniżką ogólną.', s.x + 24, s.y + s.h - 40, 11, 400, ML.mutedFg, s.w - 48, 15)
  }
}

/** Редактор целиком (пустая таблица, пустой поиск) — лицо перелетающей панели. */
export function editorComposite(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    drawEditorBase(c)
    const t = EDITOR.table
    txt(c, 'Brak zniżek indywidualnych. Ten produkt jest wyceniany dla wszystkich według cennika.', t.x, t.y + 24, 14, 400, ML.mutedFg)
    c.save()
    c.translate(EDITOR.search.x, EDITOR.search.y)
    drawSearch('')(c, EDITOR.search.w, EDITOR.search.h)
    c.restore()
  })
}

/** Таблица своих цен: пустая или со строкой фирмы. */
export function editorTable(added: boolean): CanvasTexture | null {
  const { w, h } = EDITOR.table
  return sheet(w, h, PANEL.k * 1.3, (c) => {
    if (!added) {
      txt(c, 'Brak zniżek indywidualnych. Ten produkt jest wyceniany dla wszystkich według cennika.', 0, 24, 14, 400, ML.mutedFg)
      return
    }
    const cols = [0, 250, 400, 520]
    ;['Kontrahent', 'Rodzaj', 'Wartość', 'Cena netto'].forEach((name, index) => txt(c, name, cols[index]! + 4, 16, 12, 500, ML.mutedFg))
    fillBox(c, 0, 28, w, 52, 14, 'rgba(0,0,0,0.6)')
    strokeBox(c, 0, 28, w, 52, 14, ML.border)
    mask(c, 14, 40, 130, 13)
    txt(c, 'sp. z o.o.', 152, 52, 14, 500, ML.fg)
    mask(c, 14, 60, 110, 10, 'rgba(255,255,255,0.1)')
    txt(c, 'Cena stała', cols[1]! + 4, 60, 14, 400, ML.mutedFg)
    txt(c, YOUR_PRICE.toFixed(2), cols[2]! + 4, 60, 14, 400, ML.fg)
    txt(c, `${YOUR_PRICE.toFixed(2)} zł`, cols[3]! + 4, 60, 14, 600, ML.fg)
    icon(c, 'pencil', w - 70, 46, 16, ML.mutedFg)
    icon(c, 'trash', w - 36, 46, 16, ML.mutedFg)
  })
}

export const drawSearch = (value: string): LiveDraw => (c, w, h) => {
  fillBox(c, 0, 0, w, h, 14, ML.bg)
  strokeBox(c, 0, 0, w, h, 14, value ? ML.primary : ML.border)
  icon(c, 'search', 10, 13, 14, ML.mutedFg)
  if (value) {
    const width = txt(c, value, 32, 25, 14, 400, ML.fg)
    c.fillStyle = ML.fg
    c.fillRect(34 + width, 12, 1.5, 16)
  } else txt(c, 'Nazwa firmy, imię lub e-mail', 32, 25, 14, 400, ML.mutedFg)
}

/** Подсказки поиска: выходят плитой на 8 см. */
export function candidates(): CanvasTexture | null {
  const w = EDITOR.search.w
  const h = 150
  return sheet(w, h, PANEL.k * 1.3, (c) => {
    fillBox(c, 0, 0, w, h, 14, ML.card)
    strokeBox(c, 0, 0, w, h, 14, ML.border)
    for (let i = 0; i < 3; i++) {
      const y = 8 + i * 46
      if (i === 0) fillBox(c, 6, y, w - 12, 42, 10, ML.muted)
      mask(c, 16, y + 10, [150, 120, 170][i]!, 12)
      txt(c, 'sp. z o.o.', 16 + [150, 120, 170][i]! + 8, y + 22, 14, 500, ML.fg)
      mask(c, 16, y + 28, 100, 9, 'rgba(255,255,255,0.1)')
      txt(c, '· B2B_RESELLER', 122, y + 36, 12, 400, ML.mutedFg)
    }
  })
}

/** Строка «Rodzaj / Wartość / Dodaj» после выбора фирмы. */
export const drawDiscountRow = (value: string): LiveDraw => (c, w) => {
  txt(c, 'Rodzaj', 0, 12, 12, 500, ML.fg)
  const typeW = w * 0.52
  fillBox(c, 0, 20, typeW, 40, 14, ML.bg)
  strokeBox(c, 0, 20, typeW, 40, 14, ML.border)
  txt(c, 'Cena stała (zł)', 12, 45, 14, 400, ML.fg)
  icon(c, 'chevronDown', typeW - 28, 32, 16, ML.mutedFg)
  txt(c, 'Wartość', typeW + 10, 12, 12, 500, ML.fg)
  const valueW = w * 0.28
  fillBox(c, typeW + 10, 20, valueW, 40, 14, ML.bg)
  strokeBox(c, typeW + 10, 20, valueW, 40, 14, value ? ML.primary : ML.border)
  txt(c, value, typeW + 22, 45, 14, 400, ML.fg)
  button(c, 'Dodaj', w - (w - typeW - valueW - 20), 20, 40, 'primary', { icon: 'plus', width: w - typeW - valueW - 20 })
}

/* ═══ Возрастной вход 18+ и карточка настроек (станция 08) ═════════════ */

export function ageGateModal(): CanvasTexture | null {
  const w = 448
  const h = 470
  return sheet(w, h, 2, (c) => {
    fillBox(c, 0, 0, w, h, 40, cardFill(ML.card))
    circle(c, w / 2, 72, 40, ML.primary)
    txt(c, '18+', w / 2, 81, 24, 700, '#ffffff', { align: 'center' })
    txt(c, 'Produkty z ograniczeniem wiekowym', w / 2, 158, 22, 600, ML.fg, { align: 'center' })
    para(c, 'Ta strona zawiera produkty przeznaczone wyłącznie dla osób pełnoletnich, które ukończyły 18 lat.', w / 2, 196, 15, 400, ML.mutedFg, w - 64, 23, 'center')
    txt(c, 'Czy masz ukończone 18 lat?', w / 2, 272, 14, 600, ML.fg, { align: 'center' })
    button(c, 'Tak, mam co najmniej 18 lat', 32, 294, 42, 'primary', { width: w - 64 })
    button(c, 'Nie, opuść stronę', 32, 346, 42, 'outline', { width: w - 64 })
    const link = 'Informacje prawne i pliki cookie'
    const lw = txt(c, link, w / 2 - 8, 426, 12, 400, 'rgba(166,166,166,0.7)', { align: 'center' })
    c.strokeStyle = 'rgba(166,166,166,0.5)'
    c.setLineDash([3, 3])
    c.beginPath()
    c.moveTo(w / 2 - 8 - lw / 2, 431)
    c.lineTo(w / 2 - 8 + lw / 2, 431)
    c.stroke()
    c.setLineDash([])
    icon(c, 'chevronDown', w / 2 - 8 + lw / 2 + 4, 416, 14, 'rgba(166,166,166,0.7)')
  })
}

/** Где на окне кнопка «Tak» — в долях окна (для круга касания). */
export const AGE_YES: [number, number] = [0.5, (294 + 21) / 470]

export const SETTINGS_SWITCH = { x: 336, y: 108, w: 44, h: 24 }

/** Карточка «Produkty z ograniczeniem wiekowym» без строки описания раздела:
    она перечисляет CBD, а ролик нейтральный. Переключатель — живая накладка;
    switchOn — запечь включённым (оборот плиты, которая улетает окном 18+). */
export function ageSettingsCard(switchOn = false): CanvasTexture | null {
  const { w, h, k } = SETTINGS_UI
  return sheet(w, h, k, (c) => {
    if (switchOn) {
      c.save()
      c.translate(SETTINGS_SWITCH.x, SETTINGS_SWITCH.y)
      drawSwitch(1)(c, SETTINGS_SWITCH.w, SETTINGS_SWITCH.h)
      c.restore()
    }
    fillBox(c, 0, 0, w, h, 16, cardFill(ML.card))
    strokeBox(c, 0, 0, w, h, 16, ML.border)
    fillBox(c, 20, 20, 40, 40, 14, 'rgba(250,79,0,0.1)')
    icon(c, 'shieldCheck', 30, 30, 20, ML.primary)
    txt(c, 'Produkty z ograniczeniem', 72, 36, 17, 600, ML.fg)
    txt(c, 'wiekowym', 72, 57, 17, 600, ML.fg)
    txt(c, 'Bramka wieku 18+', 20, 104, 14, 500, ML.fg)
    para(c, 'Klient potwierdza, że ma ukończone 18 lat, zanim zobaczy sklep. Wyłączona — sklep otwiera się od razu, a zgodę na analitykę zbiera baner cookies.', 20, 124, 11.5, 400, ML.mutedFg, 296, 16)
    fillBox(c, 20, 196, w - 40, 1, 0, ML.border)
    button(c, 'Zapisz ustawienie', 20, 212, 38, 'primary', { icon: 'save', size: 13 })
  })
}

export const drawSwitch = (on: number): LiveDraw => (c, w, h) => {
  const color = on > 0.5 ? ML.primary : ML.border
  fillBox(c, 0, 0, w, h, h / 2, color)
  circle(c, h / 2 + (w - h) * on, h / 2, h / 2 - 2, ML.bg)
}

/* ═══ Оферта «Wyceny» (станция 12) ══════════════════════════════════════ */

export const QUOTE_ROWS = [
  { name: 'Karton klapowy 600×400…', qty: 200, list: 9.49, quoted: 7.6 },
  { name: 'Taśma pakowa 48 mm…', qty: 120, list: 3.2, quoted: 2.7 },
]

export const QUOTE = {
  rows: [0, 1].map((index) => ({ x: 16, y: 132 + index * 34, w: 448, h: 32 })) as Rect[],
  totals: { x: 16, y: 208, w: 448, h: 96 } as Rect,
  accept: { x: 16, y: 312, w: 104, h: 34 } as Rect,
}

export function quoteCard(): CanvasTexture | null {
  const { w, h, k } = QUOTE_UI
  return sheet(w, h, k, (c) => {
    fillBox(c, 0, 0, w, h, 16, cardFill(ML.card))
    strokeBox(c, 0, 0, w, h, 16, ML.border)
    fillBox(c, 16, 16, 40, 40, 14, 'rgba(250,79,0,0.1)')
    icon(c, 'fileText', 26, 26, 20, ML.primary)
    txt(c, 'Q-260928-4F2A9C', 68, 34, 15, 500, ML.fg)
    const status = txt(c, 'Gotowa do akceptacji', 68, 54, 13, 500, ML.primary)
    txt(c, ' · ważna do 2026-10-12', 68 + status, 54, 13, 400, ML.mutedFg)
    txt(c, '2268.12 PLN', w - 40, 44, 15, 600, ML.fg, { align: 'right' })
    icon(c, 'chevronDown', w - 34, 34, 16, ML.mutedFg)
    fillBox(c, 0, 72, w, 1, 0, ML.border)
    const cols = [16, 234, 314, 390, 464]
    ;['Pozycja', 'Ilość', 'Katalogowa', 'Wyceniona', 'Razem'].forEach((name, index) => txt(c, name, cols[index]!, 104, 11.5, 500, ML.mutedFg, { align: index ? 'right' : 'left' }))
    fillBox(c, 16, 114, w - 32, 1, 0, ML.border)
  })
}

export function quoteRow(index: number): CanvasTexture | null {
  const row = QUOTE_ROWS[index] ?? QUOTE_ROWS[0]!
  const { w, h } = QUOTE.rows[0]!
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 8, ML.card)
    txt(c, row.name, 0, 21, 12.5, 400, ML.fg)
    txt(c, String(row.qty), 218, 21, 12.5, 400, ML.fg, { align: 'right' })
    const list = row.list.toFixed(2)
    const listW = txt(c, list, 298, 21, 12.5, 400, ML.mutedFg, { align: 'right' })
    c.fillStyle = ML.mutedFg
    c.fillRect(298 - listW, 17, listW, 1)
    txt(c, row.quoted.toFixed(2), 374, 21, 12.5, 400, ML.fg, { align: 'right' })
    txt(c, (row.quoted * row.qty).toFixed(2), 448, 21, 12.5, 400, ML.fg, { align: 'right' })
    fillBox(c, 0, h - 1, w, 1, 0, 'rgba(38,38,38,0.5)')
  })
}

export function quoteTotals(): CanvasTexture | null {
  const { w, h } = QUOTE.totals
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 8, ML.card)
    const left = w - 264
    const row = (y: number, a: string, b: string, bold = false) => {
      txt(c, a, left, y, 12.5, bold ? 600 : 400, bold ? ML.fg : ML.mutedFg)
      txt(c, b, w, y, 12.5, bold ? 600 : 400, ML.fg, { align: 'right' })
    }
    row(14, 'Suma częściowa', '1844.00 PLN')
    row(34, 'Podatek (23%)', '424.12 PLN')
    fillBox(c, left, 42, 264, 1, 0, ML.border)
    row(60, 'Razem', '2268.12 PLN', true)
    txt(c, 'Oszczędzasz 438.00 PLN względem ceny katalogowej.', w, 84, 11, 400, ML.emeraldDark, { align: 'right' })
  })
}

export function quoteButtons(): CanvasTexture | null {
  const w = 448
  const h = 42
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, 1, 0, ML.border)
    const a = button(c, 'Akceptuj', 0, 8, 34, 'primary', { icon: 'check', size: 13 })
    button(c, 'Odrzuć', a + 8, 8, 34, 'outline', { icon: 'x', size: 13 })
  })
}

/* ═══ Szybkie zamówienie (станция 13) ════════════════════════════════════ */

export const QUICK = {
  /** Высота страницы: вид прокручивается вниз, к «Wynik». */
  page: 1010,
  paste: { x: 88 + 24, y: 318, w: 848 - 48, h: 96 } as Rect,
  check: { x: 112, y: 470, w: 236, h: 40 } as Rect,
  result: { x: 88, y: 548, w: 848, h: 360 } as Rect,
  row: (index: number): Rect => ({ x: 112, y: 648 + index * 38, w: 800, h: 36 }),
  add: { x: 700, y: 848, w: 212, h: 40 } as Rect,
}

export const QUICK_LINES = [
  { sku: 'KRT-6044-5W', name: 'Karton klapowy 600×400×400 mm 5-warstwowy', qty: 50, unit: 8.54 },
  { sku: 'TSM-4866-BR', name: 'Taśma pakowa 48 mm × 66 m brązowa', qty: 36, unit: 3.2 },
  { sku: 'FST-2315', name: 'Folia stretch 23 µm 1,5 kg', qty: 12, unit: 18.9 },
  { sku: 'WPP-05', name: 'Wypełniacz papierowy 5 kg', qty: 6, unit: 24.5 },
]

export function quickPage(): CanvasTexture | null {
  return sheet(PANEL.w, QUICK.page, PANEL.k * 0.9, (c) => {
    c.fillStyle = sheetFill(ML.bg)
    c.fillRect(0, 0, PANEL.w, QUICK.page)
    const x = 88
    button(c, 'Wstecz', x - 8, 76, 36, 'ghost', { icon: 'arrowLeft' })
    fillBox(c, x, 124, 44, 44, 14, 'rgba(250,79,0,0.1)')
    icon(c, 'clipboard', x + 12, 136, 20, ML.primary)
    txt(c, 'Szybkie zamówienie', x + 56, 144, 24, 600, ML.fg)
    txt(c, 'Wpisz kody SKU i ilości albo wklej dane z arkusza. Ceny są Twoje.', x + 56, 165, 14, 400, ML.mutedFg)
    fillBox(c, x, 188, 848, 340, 12, cardFill(ML.card))
    strokeBox(c, x, 188, 848, 340, 12, ML.border)
    input(c, x + 24, 212, 680, 40, null, 'SKU')
    input(c, x + 712, 212, 112, 40, '1')
    button(c, 'Dodaj wiersz', x + 24, 260, 34, 'outline', { size: 13 })
    fillBox(c, x + 24, 312, 800, 1, 0, ML.border)
    txt(c, 'Lub wklej z arkusza kalkulacyjnego', x + 24, 340, 14, 500, ML.fg)
    const p = QUICK.paste
    fillBox(c, p.x, p.y + 32, p.w, p.h, 14, ML.bg)
    strokeBox(c, p.x, p.y + 32, p.w, p.h, 14, ML.border)
    button(c, 'Wczytaj wklejone wiersze', x + 24, 466 - 0, 34, 'outline', { icon: 'upload', size: 13 })
  })
}

/** Кусок таблицы (лист) — стеклянный, с сеткой ячеек и строками «SKU,ilość». */
export function spreadsheet(): CanvasTexture | null {
  const w = 420
  const h = 250
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 18, 'rgba(236,240,244,0.92)')
    fillBox(c, 0, 0, w, 40, 18, 'rgba(210,218,226,0.95)')
    c.fillStyle = 'rgba(40,50,60,0.25)'
    for (let x = 44; x < w; x += 188) c.fillRect(x, 0, 1, h)
    for (let y = 40; y < h; y += 42) c.fillRect(0, y, w, 1)
    txt(c, 'A', 118, 27, 14, 700, '#44505c', { align: 'center' })
    txt(c, 'B', 326, 27, 14, 700, '#44505c', { align: 'center' })
    txt(c, 'SKU', 56, 68, 15, 700, '#1c232b')
    txt(c, 'ilość', 244, 68, 15, 700, '#1c232b')
    QUICK_LINES.forEach((line, index) => {
      const y = 110 + index * 42
      txt(c, String(index + 2), 22, y, 12, 600, '#6b7682', { align: 'center' })
      txt(c, line.sku, 56, y, 15, 500, '#1c232b')
      txt(c, String(line.qty), 244, y, 15, 500, '#1c232b')
    })
    txt(c, '1', 22, 68, 12, 600, '#6b7682', { align: 'center' })
  })
}

export const QUICK_PASTE: Rect = { x: 112, y: 350, w: 800, h: 96 }

/** Текст вставки в поле (пустой — с плейсхолдером). */
export const drawPaste = (filled: boolean): LiveDraw => (c, w, h) => {
  fillBox(c, 0, 0, w, h, 14, ML.bg)
  strokeBox(c, 0, 0, w, h, 14, filled ? ML.primary : ML.border)
  const lines = filled ? QUICK_LINES.map((line) => `${line.sku},${line.qty}`) : ['SKU-001,10', 'SKU-002,5']
  lines.forEach((line, index) => txt(c, line, 12, 22 + index * 20, 13, 400, filled ? ML.fg : ML.mutedFg))
}

export const drawCheckButton = (busy: boolean): LiveDraw => (c, w, h) => {
  button(c, busy ? 'Sprawdzanie…' : 'Sprawdź dostępność i cenę', 0, 0, h, 'primary', { width: w, icon: busy ? 'loader' : undefined })
}

/** Карточка «Wynik» без строк: строки встают отдельно (м-список). */
export function quickResult(): CanvasTexture | null {
  const r = QUICK.result
  return sheet(r.w, r.h, PANEL.k * 1.1, (c) => {
    fillBox(c, 0, 0, r.w, r.h, 12, ML.card)
    strokeBox(c, 0, 0, r.w, r.h, 12, ML.border)
    txt(c, 'Wynik', 24, 44, 16, 600, ML.fg)
    const cols = [24, 160, 590, 690, 824]
    ;['SKU', 'Produkt', 'Ilość', 'Cena jedn.', 'Razem'].forEach((name, index) => txt(c, name, cols[index]!, 84, 13, 500, ML.mutedFg, { align: index > 1 ? 'right' : 'left' }))
    fillBox(c, 24, 94, r.w - 48, 1, 0, ML.border)
    fillBox(c, 24, 268, r.w - 48, 1, 0, ML.border)
    txt(c, 'Suma częściowa (bez podatku i dostawy)', 24, 296, 14, 400, ML.mutedFg)
    txt(c, '916.00', 24, 322, 18, 600, ML.fg)
  })
}

export function quickRow(index: number): CanvasTexture | null {
  const line = QUICK_LINES[index] ?? QUICK_LINES[0]!
  const { w, h } = QUICK.row(0)
  return sheet(w, h, PANEL.k * 1.2, (c) => {
    fillBox(c, 0, 0, w, h, 8, ML.card)
    txt(c, line.sku, 0, 23, 12, 500, ML.fg)
    txt(c, line.name, 136, 23, 14, 400, ML.fg)
    txt(c, String(line.qty), 566, 23, 14, 400, ML.fg, { align: 'right' })
    txt(c, line.unit.toFixed(2), 666, 23, 14, 400, ML.fg, { align: 'right' })
    txt(c, (line.unit * line.qty).toFixed(2), 800, 23, 14, 400, ML.fg, { align: 'right' })
    fillBox(c, 0, h - 1, w, 1, 0, 'rgba(38,38,38,0.5)')
  })
}

export function quickAdd(): CanvasTexture | null {
  const { w, h } = QUICK.add
  return sheet(w, h, 2.4, (c) => {
    button(c, 'Dodaj wszystko do koszyka', 0, 0, h, 'primary', { icon: 'cart', width: w })
  })
}

/** Шапка сайта отдельно: при прокрутке страницы она стоит. */
export function siteHeaderStrip(pad = 40): CanvasTexture | null {
  return sheet(PANEL.w, 64, PANEL.k, (c) => siteHeader(c, PANEL.w, pad))
}

/* ═══ Оформление заказа (станция 14) ════════════════════════════════════ */

export const CHECKOUT = {
  page: 1120,
  b2b: { x: 32, y: 196, w: 620, h: 250 } as Rect,
  checkbox: { x: 56, y: 222, w: 18, h: 18 } as Rect,
  delivery: { x: 32, y: 470, w: 620, h: 250 } as Rect,
  payment: { x: 32, y: 744, w: 620, h: 190 } as Rect,
  credit: { x: 56, y: 810, w: 572, h: 76 } as Rect,
  summary: { x: 684, y: 196, w: 308, h: 560 } as Rect,
  place: { x: 708, y: 646, w: 260, h: 44 } as Rect,
}

export const ORDER = { number: 'PD-260928-0015', gross: 1139.58, credit: { used: 13619.58, limit: 20000 } }

function section(c: Ctx, rect: Rect, title: string, glyph: IconName) {
  fillBox(c, rect.x, rect.y, rect.w, rect.h, 12, cardFill(ML.card))
  strokeBox(c, rect.x, rect.y, rect.w, rect.h, 12, ML.border)
  icon(c, glyph, rect.x + 24, rect.y + 24, 20, ML.primary)
  txt(c, title, rect.x + 54, rect.y + 41, 18, 600, ML.fg)
}

export function checkoutPage(): CanvasTexture | null {
  return sheet(PANEL.w, CHECKOUT.page, PANEL.k * 0.9, (c) => {
    c.fillStyle = sheetFill(ML.bg)
    c.fillRect(0, 0, PANEL.w, CHECKOUT.page)
    txt(c, 'Kasa', 32, 116, 36, 700, ML.fg, { tracking: -0.5 })
    txt(c, 'Dane kontaktowe · Anna', 32, 150, 14, 400, ML.mutedFg)
    mask(c, 200, 139, 120, 13)
    const b = CHECKOUT.b2b
    fillBox(c, b.x, b.y, b.w, b.h, 12, cardFill(ML.card))
    strokeBox(c, b.x, b.y, b.w, b.h, 12, ML.border)
    txt(c, 'Zamawiam jako firma (B2B)', b.x + 54, b.y + 42, 15, 500, ML.fg)
    fillBox(c, b.x + 24, b.y + 70, b.w - 48, 1, 0, ML.border)
    icon(c, 'building', b.x + 24, b.y + 90, 20, ML.primary)
    txt(c, 'Dane firmy', b.x + 54, b.y + 106, 15, 500, ML.fg)
    const field = (x: number, y: number, w: number, name: string, value: string | null, maskW = 0) => {
      txt(c, name, x, y, 14, 500, ML.fg)
      fillBox(c, x, y + 10, w, 40, 14, ML.bg)
      strokeBox(c, x, y + 10, w, 40, 14, ML.border)
      if (value) txt(c, value, x + 12, y + 35, 14, 400, ML.fg)
      if (maskW) mask(c, x + 12 + (value ? measure(c, value, 14, 400) + 8 : 0), y + 23, maskW, 13)
    }
    field(b.x + 24, b.y + 140, 276, 'Nazwa firmy *', null, 130)
    field(b.x + 320, b.y + 140, 276, 'NIP *', '1234563218')
    field(b.x + 24, b.y + 206, 572, 'Adres firmy *', null, 200)
    const d = CHECKOUT.delivery
    section(c, d, 'Sposób dostawy', 'truck')
    txt(c, 'Kraj dostawy: Polska · Wysyłamy wyłącznie na terenie Polski.', d.x + 24, d.y + 78, 13, 400, ML.mutedFg)
    const methods: [string, string, boolean][] = [
      ['InPost Paczkomat 24/7', '11,99 zł', false],
      ['InPost Kurier Standard', '12,90 zł', true],
    ]
    methods.forEach(([name, price, on], index) => {
      const x = d.x + 24 + index * 294
      const y = d.y + 100
      fillBox(c, x, y, 278, 92, 12, on ? 'rgba(250,79,0,0.05)' : ML.card)
      strokeBox(c, x, y, 278, 92, 12, on ? ML.primary : ML.border)
      circle(c, x + 24, y + 28, 8, on ? ML.primary : ML.bg, on ? ML.primary : ML.border, 1.5)
      if (on) circle(c, x + 24, y + 28, 3, '#ffffff')
      txt(c, name, x + 44, y + 33, 14, 500, ML.fg)
      txt(c, price, x + 262, y + 33, 14, 600, ML.fg, { align: 'right' })
      txt(c, 'Za darmo od 1500,00 zł', x + 44, y + 58, 12, 400, ML.mutedFg)
    })
    const p = CHECKOUT.payment
    section(c, p, 'Sposób płatności', 'creditCard')
    fillBox(c, p.x + 24, p.y + 146, p.w - 48, 1, 0, ML.border)
    txt(c, 'Płatności online w tym sklepie wyłączone dla kont B2B.', p.x + 24, p.y + 172, 12, 400, ML.mutedFg)
    const s = CHECKOUT.summary
    fillBox(c, s.x, s.y, s.w, s.h, 12, ML.card)
    strokeBox(c, s.x, s.y, s.w, s.h, 12, ML.border)
    txt(c, 'Podsumowanie zamówienia', s.x + 24, s.y + 40, 17, 600, ML.fg)
    QUICK_LINES.forEach((line, index) => {
      const y = s.y + 64 + index * 44
      goodsPicture(c, (['box', 'tape', 'film', 'filler'] as const)[index]!, s.x + 24, y, 36)
      const short = line.name.length > 24 ? `${line.name.slice(0, 23)}…` : line.name
      txt(c, short, s.x + 70, y + 15, 12, 500, ML.fg)
      txt(c, `Szt. ${line.qty}`, s.x + 70, y + 31, 11, 400, ML.mutedFg)
      txt(c, zl(line.unit * line.qty), s.x + s.w - 24, y + 22, 12, 500, ML.fg, { align: 'right' })
    })
    const row = (y: number, a: string, b: string) => {
      txt(c, a, s.x + 24, y, 13, 400, ML.mutedFg)
      txt(c, b, s.x + s.w - 24, y, 13, 400, ML.fg, { align: 'right' })
    }
    row(s.y + 262, 'Suma częściowa', zl(916))
    row(s.y + 286, 'Wysyłka · InPost Kurier Standard', zl(12.9))
    row(s.y + 310, 'VAT', zl(210.68))
    fillBox(c, s.x + 24, s.y + 326, s.w - 48, 1, 0, ML.border)
    txt(c, 'Razem', s.x + 24, s.y + 356, 18, 600, ML.fg)
    txt(c, zl(ORDER.gross), s.x + s.w - 24, s.y + 356, 18, 700, ML.primary, { align: 'right' })
    fillBox(c, s.x + 24, s.y + 374, s.w - 48, 66, 16, 'rgba(16,185,129,0.07)')
    strokeBox(c, s.x + 24, s.y + 374, s.w - 48, 66, 16, 'rgba(16,185,129,0.25)')
    txt(c, 'Twój potencjalny zarobek', s.x + 40, s.y + 398, 12, 600, ML.fg)
    txt(c, zl(412.36), s.x + s.w - 40, s.y + 399, 15, 700, ML.emerald, { align: 'right' })
    txt(c, 'Przy sprzedaży w cenie detalicznej —', s.x + 40, s.y + 418, 10.5, 400, ML.mutedFg)
    txt(c, 'marża 31%', s.x + 40, s.y + 432, 10.5, 400, ML.mutedFg)
    para(c, 'Składając zamówienie, akceptujesz nasze Warunki korzystania z usługi i Politykę prywatności.', s.x + s.w / 2, s.y + 522, 11, 400, ML.mutedFg, s.w - 48, 15, 'center')
  })
}

/** Галочка «Zamawiam jako firma (B2B)» рисуется (м-галочка). */
export const drawCheckbox = (progress: number): LiveDraw => (c, w, h) => {
  const on = progress > 0
  fillBox(c, 0, 0, w, h, 6, on ? ML.primary : ML.bg)
  strokeBox(c, 0, 0, w, h, 6, ML.primary, 1.2)
  if (!on) return
  c.save()
  c.strokeStyle = '#ffffff'
  c.lineWidth = 2
  c.lineCap = 'round'
  c.lineJoin = 'round'
  const path = new Path2D(`M${w * 0.22} ${h * 0.52} L${w * 0.42} ${h * 0.72} L${w * 0.8} ${h * 0.3}`)
  c.setLineDash([w * 1.2, w * 1.2])
  c.lineDashOffset = w * 1.2 * (1 - progress)
  c.stroke(path)
  c.restore()
}

/** Вариант «Kredyt kupiecki»: выбран, или посерел («Przekroczony limit»). */
export function creditOption(exceeded: boolean): CanvasTexture | null {
  const { w, h } = CHECKOUT.credit
  return sheet(w, h, 2.2, (c) => {
    fillBox(c, 0, 0, w, h, 16, exceeded ? 'rgba(26,26,26,0.5)' : 'rgba(250,79,0,0.1)')
    c.globalAlpha = exceeded ? 0.5 : 1
    circle(c, 24, h / 2, 8, exceeded ? ML.bg : ML.primary, exceeded ? ML.border : ML.primary, 1.5)
    if (!exceeded) circle(c, 24, h / 2, 3, '#ffffff')
    txt(c, 'Kredyt kupiecki', 48, 32, 15, 500, ML.fg)
    txt(c, `Zapłać w ciągu 30 dni. Limit: ${zl(exceeded ? ORDER.credit.limit - ORDER.credit.used : ORDER.credit.limit)}`, 48, 54, 13, 400, ML.mutedFg)
    c.globalAlpha = 1
    if (exceeded) txt(c, 'Przekroczony limit', w - 20, h / 2 + 5, 12, 500, ML.destructive, { align: 'right' })
  })
}

export function placeOrderButton(): CanvasTexture | null {
  const { w, h } = CHECKOUT.place
  return sheet(w, h, 2.4, (c) => {
    c.save()
    c.shadowColor = 'rgba(204,102,51,0.4)'
    c.shadowBlur = 24
    fillBox(c, 0, 0, w, h, h / 2, ML.primary)
    c.restore()
    fillBox(c, 0, 0, w, h, h / 2, ML.primary)
    txt(c, 'Złóż zamówienie', w / 2, h / 2 + 5, 15, 500, '#ffffff', { align: 'center' })
  })
}

/** Страница после заказа — встаёт за световой шторкой. */
export function orderThanks(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    c.fillStyle = ML.bg
    c.fillRect(0, 0, PANEL.w, PANEL.h)
    siteHeader(c, PANEL.w, 40)
    circle(c, PANEL.w / 2, 190, 44, 'rgba(140,186,94,0.15)')
    icon(c, 'checkCircle', PANEL.w / 2 - 24, 166, 48, ML.success, 2)
    txt(c, 'Dziękujemy za zamówienie!', PANEL.w / 2, 290, 38, 700, ML.fg, { align: 'center', tracking: -0.6 })
    txt(c, 'Twoje zamówienie zostało pomyślnie złożone.', PANEL.w / 2, 328, 17, 400, ML.mutedFg, { align: 'center' })
    fillBox(c, 312, 360, 400, 120, 16, ML.card)
    strokeBox(c, 312, 360, 400, 120, 16, ML.border)
    txt(c, 'Numer zamówienia', 336, 394, 13, 400, ML.mutedFg)
    txt(c, ORDER.number, 336, 422, 20, 700, ML.fg)
    txt(c, 'Płatność: Kredyt kupiecki · 30 dni', 336, 456, 13, 400, ML.mutedFg)
    button(c, 'Zobacz status zamówienia', 312, 510, 44, 'primary', { width: 250 })
    button(c, 'Kontynuuj zakupy', 572, 510, 44, 'outline', { width: 140 })
  })
}

/* ═══ Kredyty (станция 15) ══════════════════════════════════════════════ */

export const CREDIT_BAR: Rect = { x: 40, y: 186, w: 520, h: 8 }

export function creditCard(): CanvasTexture | null {
  const { w, h, k } = CREDIT_UI
  return sheet(w, h, k, (c) => {
    fillBox(c, 0, 0, w, h, 18, cardFill(ML.main))
    strokeBox(c, 0, 0, w, h, 18, ML.border)
    txt(c, 'Kredyty', 24, 44, 24, 700, ML.fg)
    txt(c, 'Limity, wykorzystanie i terminy płatności (kredyt kupiecki) klientów B2B.', 24, 70, 13, 400, ML.mutedFg)
    const x = 24
    const y = 92
    fillBox(c, x, y, w - 48, h - y - 20, 14, tint(ML.card, 0.6))
    strokeBox(c, x, y, w - 48, h - y - 20, 14, 'rgba(140,186,94,0.5)')
    mask(c, x + 16, y + 18, 150, 15)
    txt(c, 'sp. z o.o.', x + 174, y + 31, 15, 600, ML.fg)
    mask(c, x + 16, y + 42, 130, 11, 'rgba(255,255,255,0.1)')
    tag(c, 'Bez zaległości', w - x - 16 - 110, y + 16, { color: ML.success, bg: 'rgba(140,186,94,0.15)', size: 10, weight: 500, upper: true, tracking: 0.6, h: 20 })
    txt(c, 'Wykorzystano', x + 16, y + 84, 12, 400, ML.mutedFg)
    const total = ` / ${pln(ORDER.credit.limit)}`
    const tw = measure(c, total, 12, 400)
    txt(c, total, w - x - 16, y + 84, 12, 400, ML.mutedFg, { align: 'right' })
    txt(c, pln(ORDER.credit.used), w - x - 16 - tw, y + 84, 12, 600, ML.fg, { align: 'right' })
    fillBox(c, CREDIT_BAR.x, CREDIT_BAR.y, CREDIT_BAR.w, CREDIT_BAR.h, 4, ML.muted)
    const used = Math.round((ORDER.credit.used / ORDER.credit.limit) * 100)
    txt(c, `${used}% limitu`, x + 16, y + 124, 11, 400, ML.mutedFg)
    txt(c, `Dostępne: ${pln(ORDER.credit.limit - ORDER.credit.used)}`, w - x - 16, y + 124, 11, 400, ML.mutedFg, { align: 'right' })
    const tiles: [string, string][] = [
      ['Termin', '30 dni'],
      ['Następna płatność', '2026-10-28'],
    ]
    tiles.forEach(([name, value], index) => {
      const tx = x + 16 + index * ((w - 2 * x - 40) / 2 + 8)
      const tw2 = (w - 2 * x - 40) / 2
      fillBox(c, tx, y + 142, tw2, 66, 16, 'rgba(26,26,26,0.4)')
      txt(c, name, tx + 12, y + 164, 10, 400, ML.mutedFg, { upper: true, tracking: 0.3 })
      txt(c, value, tx + 12, y + 190, 15, 600, ML.fg)
    })
    txt(c, 'Za 30 dni · 1 otwartych zamówień', x + 16, y + 238, 12, 400, ML.mutedFg)
    icon(c, 'calendarClock', x + 16, y + 226, 14, ML.mutedFg)
  })
}

/* ═══ Mapowanie statusów (станция 16) ═══════════════════════════════════ */

export const STATUS_FLOW = ['Nowe zamówienie', 'W realizacji', 'Przekazane do magazynu', 'Kompletowanie', 'Pakowanie', 'Przekazane kurierowi']
export const BL_STATUSES = ['Nowe zamówienia', 'W realizacji', 'Do magazynu', 'Kompletacja', 'Pakowanie', 'Wysłane']

export const MAPPING = {
  card: { x: ADMIN_MAIN.x, y: 116, w: ADMIN_MAIN.w, h: 500 } as Rect,
  row: (index: number): Rect => ({ x: ADMIN_MAIN.x + 20, y: 226 + index * 46, w: ADMIN_MAIN.w - 40, h: 40 }),
}

export function mappingPage(): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    adminFrame(c, PANEL.w, PANEL.h, 'Integracje', [0, 2, 5])
    const x = ADMIN_MAIN.x
    txt(c, 'Integracja Baselinker', x, 52, 22, 700, ML.fg)
    txt(c, 'Skonfiguruj synchronizację zamówień, produktów i stanów magazynowych z Baselinker', x, 78, 13, 400, ML.mutedFg)
    const card = MAPPING.card
    fillBox(c, card.x, card.y, card.w, card.h, 16, cardFill(ML.card))
    txt(c, 'Mapowanie statusów', card.x + 20, card.y + 36, 18, 600, ML.fg)
    txt(c, 'Zmiana statusu zamówienia u nas ustawia wybrany status w BaseLinkerze. Puste = nie wysyłamy.', card.x + 20, card.y + 58, 12, 400, ML.mutedFg)
    txt(c, 'Nasz status', card.x + 20, card.y + 96, 12, 500, ML.mutedFg)
    txt(c, 'Status w BaseLinkerze', card.x + card.w / 2 + 6, card.y + 96, 12, 500, ML.mutedFg)
    STATUS_FLOW.forEach((name, index) => {
      const r = MAPPING.row(index)
      txt(c, name, r.x, r.y + 25, 14, 500, ML.fg)
      const sx = card.x + card.w / 2 + 6
      fillBox(c, sx, r.y + 2, card.w / 2 - 26, 36, 14, ML.bg)
      strokeBox(c, sx, r.y + 2, card.w / 2 - 26, 36, 14, ML.border)
      txt(c, BL_STATUSES[index]!, sx + 12, r.y + 25, 13, 400, ML.fg)
      icon(c, 'chevronDown', sx + card.w / 2 - 56, r.y + 12, 16, ML.mutedFg)
    })
    button(c, 'Zapisz mapowanie', card.x + 20, card.y + card.h - 56, 36, 'primary', { icon: 'save', size: 13 })
  })
}

/** Карточка заказа над коробкой: номер и статус (м-статус). */
export const drawOrderCard = (status: string): LiveDraw => (c, w, h) => {
  fillBox(c, 0, 0, w, h, 16, ML.card)
  strokeBox(c, 0, 0, w, h, 16, ML.border)
  icon(c, 'package', 16, 16, 20, ML.primary)
  txt(c, `Zamówienie ${ORDER.number}`, 46, 32, 15, 600, ML.fg)
  txt(c, `${QUICK_LINES.length} pozycje · ${zl(ORDER.gross)}`, 16, 58, 12, 400, ML.mutedFg)
  tag(c, status, 16, 70, { color: ML.primary, bg: 'rgba(250,79,0,0.12)', border: 'rgba(250,79,0,0.35)', size: 12, h: 24 })
}

/* ═══ Заказ и InPost ShipX (станция 17) ═════════════════════════════════ */

export const SHIPX = {
  dialog: { x: 300, y: 36, w: 660, h: 600 } as Rect,
  block: { x: 324, y: 440, w: 612, h: 124 } as Rect,
  create: { x: 530, y: 506, w: 190, h: 40 } as Rect,
  gauge: { x: 344, y: 506, w: 176, h: 40 } as Rect,
  label: { x: 540, y: 506, w: 150, h: 40 } as Rect,
}

export function orderDialog(created: boolean): CanvasTexture | null {
  return sheet(PANEL.w, PANEL.h, PANEL.k, (c) => {
    adminFrame(c, PANEL.w, PANEL.h, 'Zamówienia', [0, 2, 5])
    c.fillStyle = 'rgba(0,0,0,0.72)'
    c.fillRect(0, 0, PANEL.w, PANEL.h)
    const d = SHIPX.dialog
    fillBox(c, d.x, d.y, d.w, d.h, 24, ML.card)
    strokeBox(c, d.x, d.y, d.w, d.h, 24, ML.border)
    const x = d.x + 24
    txt(c, `Zamówienie ${ORDER.number}`, x, d.y + 44, 20, 700, ML.fg)
    tag(c, 'Pakowanie', x, d.y + 58, { color: ML.primary, bg: 'rgba(250,79,0,0.12)', size: 12, h: 22 })
    icon(c, 'x', d.x + d.w - 40, d.y + 22, 18, ML.mutedFg)
    fillBox(c, x, d.y + 94, 298, 112, 16, 'rgba(26,26,26,0.5)')
    txt(c, 'Klient', x + 12, d.y + 116, 12, 500, ML.mutedFg)
    mask(c, x + 12, d.y + 128, 120, 13)
    mask(c, x + 12, d.y + 150, 160, 11, 'rgba(255,255,255,0.1)')
    tag(c, 'Płatność: Kredyt kupiecki', x + 12, d.y + 172, { color: ML.primary, bg: 'rgba(250,79,0,0.1)', size: 12, h: 22 })
    fillBox(c, x + 314, d.y + 94, 298, 112, 16, 'rgba(26,26,26,0.5)')
    txt(c, 'Adres dostawy', x + 326, d.y + 116, 12, 500, ML.mutedFg)
    mask(c, x + 326, d.y + 128, 110, 13)
    mask(c, x + 326, d.y + 150, 150, 13)
    txt(c, '60-001 · PL', x + 326, d.y + 188, 13, 500, ML.fg)
    fillBox(c, x, d.y + 222, 612, 170, 16, ML.card)
    strokeBox(c, x, d.y + 222, 612, 170, 16, ML.border)
    fillBox(c, x, d.y + 222, 612, 30, 16, 'rgba(26,26,26,0.5)')
    ;['Produkt', 'Ilość', 'Cena', 'Suma'].forEach((name, index) => txt(c, name, x + [12, 380, 480, 600][index]!, d.y + 242, 12, 500, ML.fg, { align: index === 0 ? 'left' : index === 1 ? 'center' : 'right' }))
    QUICK_LINES.forEach((line, index) => {
      const y = d.y + 272 + index * 30
      fillBox(c, x, y - 18, 612, 1, 0, ML.border)
      const short = line.name.length > 40 ? `${line.name.slice(0, 39)}…` : line.name
      txt(c, short, x + 12, y + 2, 13, 400, ML.fg)
      txt(c, String(line.qty), x + 380, y + 2, 13, 400, ML.fg, { align: 'center' })
      txt(c, `${line.unit.toFixed(2)} PLN`, x + 480, y + 2, 13, 400, ML.fg, { align: 'right' })
      txt(c, `${(line.unit * line.qty).toFixed(2)} PLN`, x + 600, y + 2, 13, 600, ML.fg, { align: 'right' })
    })
    const b = SHIPX.block
    fillBox(c, b.x, b.y, b.w, b.h, 24, ML.bg)
    strokeBox(c, b.x, b.y, b.w, b.h, 24, ML.border)
    icon(c, 'package', b.x + 20, b.y + 18, 16, ML.fg)
    txt(c, 'InPost ShipX', b.x + 44, b.y + 31, 14, 600, ML.fg)
    txt(c, created ? 'InPost Kurier Standard · confirmed' : 'InPost Kurier Standard', b.x + 20, b.y + 52, 12, 400, ML.mutedFg)
    if (created) {
      button(c, 'Odśwież', b.x + 20, b.y + 70, 40, 'secondary', { icon: 'refresh' })
      button(c, 'Etykieta A6', SHIPX.label.x, b.y + 70, 40, 'secondary', { icon: 'download' })
      button(c, 'Anuluj', SHIPX.label.x + 164, b.y + 70, 40, 'ghost', { icon: 'x' })
    }
  })
}

/** Выбор габарита и кнопка «Utwórz przesyłkę» — живые (до создания). */
export const drawShipControls = (gauge: string, visible: boolean): LiveDraw => (c, w, h) => {
  if (!visible) return
  fillBox(c, 0, 0, 176, h, h / 2, ML.card)
  strokeBox(c, 0, 0, 176, h, h / 2, ML.border)
  txt(c, gauge, 16, h / 2 + 5, 14, 500, ML.fg)
  icon(c, 'chevronDown', 146, (h - 16) / 2, 16, ML.mutedFg)
  button(c, 'Utwórz przesyłkę', 186, 0, h, 'primary', { icon: 'package', width: w - 186 })
}

export function gaugeMenu(): CanvasTexture | null {
  const w = 176
  const h = 124
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 16, ML.card)
    strokeBox(c, 0, 0, w, h, 16, ML.border)
    ;['Gabaryt A', 'Gabaryt B', 'Gabaryt C'].forEach((name, index) => {
      const y = 6 + index * 38
      if (index === 1) fillBox(c, 6, y, w - 12, 36, 12, 'rgba(250,79,0,0.15)')
      txt(c, name, 16, y + 23, 14, index === 1 ? 600 : 400, index === 1 ? ML.primary : ML.fg)
      if (index === 1) icon(c, 'check', w - 32, y + 10, 16, ML.primary)
    })
  })
}

/** Этикетка InPost A6 (альбомная): отправитель, получатель — замаскированы. */
export function shippingLabel(): CanvasTexture | null {
  const w = 296
  const h = 210
  return sheet(w, h, 3, (c) => {
    fillBox(c, 0, 0, w, h, 6, '#fbfbf8')
    txt(c, 'InPost', 14, 26, 18, 800, '#111111')
    txt(c, 'Kurier Standard · A', w - 14, 24, 11, 600, '#111111', { align: 'right' })
    c.fillStyle = '#111111'
    c.fillRect(14, 34, w - 28, 1.2)
    txt(c, 'NADAWCA', 14, 52, 8, 700, '#555555', { tracking: 0.5 })
    fillBox(c, 14, 57, 110, 7, 3, 'rgba(0,0,0,0.25)')
    fillBox(c, 14, 68, 80, 7, 3, 'rgba(0,0,0,0.25)')
    txt(c, 'ODBIORCA', 150, 52, 8, 700, '#555555', { tracking: 0.5 })
    fillBox(c, 150, 57, 120, 8, 3, 'rgba(0,0,0,0.3)')
    fillBox(c, 150, 69, 96, 8, 3, 'rgba(0,0,0,0.3)')
    txt(c, '60-001', 150, 92, 12, 700, '#111111')
    const seed = [3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 1, 3, 2, 1]
    let bx = 18
    let dark = true
    for (const width of seed) {
      if (dark) {
        c.fillStyle = '#111111'
        c.fillRect(bx, 104, width * 1.6, 70)
      }
      bx += width * 1.6 + (dark ? 0 : 0)
      dark = !dark
      if (bx > w - 18) break
    }
    txt(c, '6200 1234 5678 9012 3456 78', w / 2, 192, 11, 600, '#111111', { align: 'center', tracking: 0.8 })
  })
}

/* ═══ Каналы продаж (станция 18) ═════════════════════════════════════════ */

export const CHANNELS = ['Allegro', 'WooCommerce', 'Empik', 'Shoper', 'Shopify', 'Erli']

export function channelCard(name: string): CanvasTexture | null {
  const w = 260
  const h = 96
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 18, cardFill(ML.card))
    strokeBox(c, 0, 0, w, h, 18, ML.border)
    fillBox(c, 16, 18, 36, 36, 12, 'rgba(250,79,0,0.1)')
    icon(c, 'radio', 24, 26, 20, ML.primary)
    txt(c, name, 64, 42, 19, 700, ML.fg)
    circle(c, 22, 74, 4, ML.success)
    txt(c, 'Włączony', 32, 78, 12, 500, ML.success)
    txt(c, 'Stany · Oferty · Zamówienia', w - 16, 78, 11, 400, ML.mutedFg, { align: 'right' })
  })
}

/** Плитка с остатком, которая катится по ветке. */
export function stockTile(value: number): CanvasTexture | null {
  const w = 120
  const h = 44
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 14, cardFill(ML.card))
    strokeBox(c, 0, 0, w, h, 14, 'rgba(250,79,0,0.45)')
    icon(c, 'package', 12, 12, 18, ML.primary)
    txt(c, `${value} szt.`, 40, 28, 15, 700, ML.fg)
  })
}

/** Заголовок экрана «Kanały sprzedaży» над узлом. Строку «…bez BaseLinkera» не
    берём: рядом подпись 16 «…do magazynu i BaseLinkera» (вопрос 7). Висит в
    воздухе без подложки, поэтому в светлой студии (light) — графитом. */
export function channelsTitle(light = false): CanvasTexture | null {
  const w = 520
  const h = 70
  const ok = light ? ML.emeraldDark : ML.success
  return sheet(w, h, 2.4, (c) => {
    txt(c, 'Kanały sprzedaży', w / 2, 34, 26, 700, light ? '#0d0d0d' : ML.fg, { align: 'center' })
    circle(c, w / 2 - 58, 56, 4, ok)
    txt(c, 'Silnik włączony', w / 2 - 48, 61, 14, 500, ok)
  })
}

/* ═══ Телефон покупателя: сайт в iPhone (станция 19) ═════════════════════ */

export type PhoneScreen = 'shop' | 'menu' | 'filters' | 'product' | 'checkout'

function phoneChrome(c: Ctx, w: number, h: number) {
  const bar = { x: 16, y: h - 58, w: w - 32, h: 44 }
  fillBox(c, bar.x, bar.y, bar.w, bar.h, 22, 'rgba(38,38,40,0.94)')
  txt(c, 'AA', bar.x + 18, bar.y + 28, 14, 600, ML.fg)
  icon(c, 'lock', bar.x + bar.w / 2 - 62, bar.y + 15, 12, ML.mutedFg)
  txt(c, 'hurtownia.demo', bar.x + bar.w / 2 + 6, bar.y + 27, 15, 500, ML.fg, { align: 'center' })
  icon(c, 'refresh', bar.x + bar.w - 34, bar.y + 13, 18, ML.fg)
}

function phoneHeader(c: Ctx, w: number) {
  const top = IPHONE.top
  c.fillStyle = '#000000'
  c.fillRect(0, 0, w, top + 56)
  circle(c, 40, top + 26, 14, ML.primary)
  txt(c, 'H', 40, top + 31, 14, 900, '#ffffff', { align: 'center' })
  icon(c, 'cart', w - 92, top + 16, 20, ML.fg)
  circle(c, w - 70, top + 14, 7, ML.primary)
  txt(c, '4', w - 70, top + 18, 9, 700, '#ffffff', { align: 'center' })
  icon(c, 'menu', w - 48, top + 14, 24, ML.fg)
}

export function phoneBuyer(screen: PhoneScreen): CanvasTexture | null {
  const { w, h, k } = PHONE_UI
  return sheet(w, h, k, (c) => {
    c.fillStyle = ML.bg
    c.fillRect(0, 0, w, h)
    const top = IPHONE.top
    if (screen === 'menu') {
      icon(c, 'x', w - 48, top + 14, 24, ML.fg)
      const items: [IconName, string, boolean][] = [
        ['home', 'Strona główna', false],
        ['store', 'Sklep', true],
        ['info', 'O nas', false],
        ['message', 'Kontakt', false],
      ]
      let y = top + 72
      for (const [glyph, name, on] of items) {
        const hh = on ? 176 : 108
        if (on) fillBox(c, 24, y, w - 48, hh, 24, ML.primary)
        else strokeBox(c, 24, y, w - 48, hh, 24, 'rgba(255,255,255,0.25)', 1, [2, 4])
        icon(c, glyph, 44, y + hh / 2 - 12, 24, '#ffffff')
        txt(c, name, 88, y + hh / 2 + 9, 24, 900, '#ffffff', { tracking: -0.4 })
        circle(c, w - 52, y + hh / 2, 5, '#ffffff')
        y += hh + 8
      }
      button(c, 'Ulubione', 24, y + 12, 48, 'ghostWhite', { icon: 'heart', width: (w - 60) / 2, weight: 700 })
      button(c, 'Konto', 36 + (w - 60) / 2, y + 12, 48, 'ghostWhite', { icon: 'user', width: (w - 60) / 2, weight: 700 })
      txt(c, '© 2026 Hurtownia Demo', 24, y + 92, 12, 400, 'rgba(255,255,255,0.55)')
    } else if (screen === 'filters') {
      c.fillStyle = ML.card
      c.fillRect(0, 0, w, h)
      txt(c, 'FILTRY', 24, top + 36, 16, 600, ML.fg)
      icon(c, 'x', w - 48, top + 20, 22, ML.fg)
      txt(c, 'KATEGORIE', 24, top + 96, 12, 600, ML.mutedFg)
      const cats: [string, number][] = [
        ['Wszystkie produkty', 36],
        ['Kartony', 12],
        ['Taśmy', 8],
        ['Folie', 6],
        ['Wypełniacze', 5],
        ['Koperty', 5],
      ]
      cats.forEach(([name, count], index) => {
        const y = top + 110 + index * 46
        if (index === 0) fillBox(c, 20, y, w - 40, 40, 14, ML.primary)
        txt(c, name, 34, y + 26, 15, index === 0 ? 600 : 400, index === 0 ? '#ffffff' : ML.fg)
        txt(c, String(count), w - 34, y + 26, 12, 400, index === 0 ? 'rgba(255,255,255,0.7)' : ML.mutedFg, { align: 'right' })
      })
      txt(c, 'CENA', 24, top + 408, 12, 600, ML.mutedFg)
      input(c, 20, top + 422, (w - 48) / 2, 40, null, 'Od 1', { radius: 14 })
      input(c, 28 + (w - 48) / 2, top + 422, (w - 48) / 2, 40, null, 'Do 32', { radius: 14 })
      ;['Tylko dostępne', 'Tylko bestsellery'].forEach((name, index) => {
        const y = top + 486 + index * 40
        fillBox(c, 24, y, 16, 16, 5, index === 0 ? ML.primary : 'rgba(255,255,255,0.1)')
        if (index === 0) icon(c, 'check', 26, y + 2, 12, '#ffffff', 3)
        txt(c, name, 52, y + 13, 15, 400, ML.fg)
      })
      fillBox(c, 0, h - 150, w, 90, 0, ML.card)
      button(c, 'Pokaż produkty (36)', 20, h - 136, 48, 'primary', { width: w - 40, size: 15 })
    } else if (screen === 'product') {
      phoneHeader(c, w)
      button(c, 'Wstecz', 12, top + 64, 34, 'ghost', { icon: 'arrowLeft', size: 13 })
      boxPicture(c, 20, top + 104, w - 40, 250)
      txt(c, 'Karton klapowy 600×400×400', 20, top + 386, 21, 700, ML.fg)
      txt(c, 'mm 5-warstwowy', 20, top + 412, 21, 700, ML.fg)
      const cells: [string, string, string, string][] = [
        ['CENA BAZOWA B2B', '(NETTO / VAT 23%)', zl(unitPrice(50)), ML.brand],
        ['SUGEROWANA CENA DETALICZNA', '(BRUTTO)', zl(CARTON.retail), ML.blue],
        ['Twój zarobek', '(POTENCJALNY)', zl(303), ML.emerald],
      ]
      cells.forEach(([name, note, value, colour], index) => {
        const y = top + 430 + index * 66
        fillBox(c, 20, y, w - 40, 58, 16, `${colour}1f`)
        strokeBox(c, 20, y, w - 40, 58, 16, `${colour}8c`)
        txt(c, name, 34, y + 24, 13, 700, ML.fg)
        txt(c, note, 34, y + 42, 10, 400, ML.mutedFg)
        glowText(c, value, w - 34, y + 36, 17, 700, index === 1 ? ML.blueLight : index === 2 ? ML.emeraldLight : ML.brand, 10, 'right')
      })
      fillBox(c, 20, top + 640, 120, 44, 22, ML.bg)
      strokeBox(c, 20, top + 640, 120, 44, 22, ML.border)
      txt(c, '50', 80, top + 668, 16, 600, ML.fg, { align: 'center' })
      icon(c, 'minus', 32, top + 654, 16, ML.fg)
      icon(c, 'plus', 112, top + 654, 16, ML.fg)
      button(c, `Dodaj — ${zl(427)}`, 150, top + 640, 44, 'primary', { width: w - 170, icon: 'cart', size: 14 })
    } else if (screen === 'checkout') {
      phoneHeader(c, w)
      txt(c, 'Kasa', 20, top + 104, 30, 700, ML.fg)
      const card = (y: number, hh: number) => {
        fillBox(c, 16, y, w - 32, hh, 12, ML.card)
        strokeBox(c, 16, y, w - 32, hh, 12, ML.border)
      }
      card(top + 124, 90)
      fillBox(c, 36, top + 146, 18, 18, 6, ML.primary)
      icon(c, 'check', 38, top + 148, 14, '#ffffff', 3)
      txt(c, 'Zamawiam jako firma (B2B)', 66, top + 160, 14, 500, ML.fg)
      txt(c, 'NIP 1234563218 ·', 36, top + 192, 13, 400, ML.mutedFg)
      mask(c, 150, top + 181, 110, 12)
      card(top + 226, 110)
      icon(c, 'truck', 36, top + 244, 18, ML.primary)
      txt(c, 'Sposób dostawy', 62, top + 258, 15, 600, ML.fg)
      fillBox(c, 32, top + 272, w - 64, 50, 12, 'rgba(250,79,0,0.05)')
      strokeBox(c, 32, top + 272, w - 64, 50, 12, ML.primary)
      txt(c, 'InPost Kurier Standard', 48, top + 302, 13, 500, ML.fg)
      txt(c, '12,90 zł', w - 48, top + 302, 13, 600, ML.fg, { align: 'right' })
      card(top + 348, 110)
      icon(c, 'creditCard', 36, top + 366, 18, ML.primary)
      txt(c, 'Sposób płatności', 62, top + 380, 15, 600, ML.fg)
      fillBox(c, 32, top + 394, w - 64, 50, 16, 'rgba(250,79,0,0.1)')
      txt(c, 'Kredyt kupiecki', 48, top + 416, 13, 500, ML.fg)
      txt(c, 'Zapłać w ciągu 30 dni.', 48, top + 434, 11, 400, ML.mutedFg)
      c.fillStyle = 'rgba(13,13,13,0.95)'
      c.fillRect(0, h - 190, w, 132)
      c.fillStyle = ML.border
      c.fillRect(0, h - 190, w, 1)
      txt(c, 'Razem', 16, h - 158, 14, 400, ML.mutedFg)
      txt(c, zl(ORDER.gross), w - 16, h - 156, 18, 700, ML.primary, { align: 'right' })
    } else {
      phoneHeader(c, w)
      txt(c, 'Sklep', 20, top + 110, 36, 700, ML.fg)
      txt(c, 'Przeglądaj naszą pełną ofertę', 20, top + 136, 14, 400, ML.mutedFg)
      fillBox(c, 16, top + 152, w - 32, 56, 16, ML.primary)
      para(c, 'Dynamiczne ceny B2B są aktywne dla Twojego konta.', 30, top + 176, 13, 500, '#ffffff', w - 120, 17)
      fillBox(c, w - 80, top + 166, 52, 26, 13, ML.fg)
      txt(c, '-12%', w - 54, top + 184, 13, 600, ML.bg, { align: 'center' })
      button(c, 'Filtry', 16, top + 222, 44, 'secondary', { width: w - 32, icon: 'filter' })
      GOODS.slice(0, 4).forEach((good, index) => {
        const r = phoneCardRect(index)
        goodCard(c, good, r.x, r.y, r.w)
      })
    }
    phoneChrome(c, w, h)
    statusBar(c, 1, screen === 'filters' ? ML.fg : ML.fg)
  })
}

/** Карточка товара витрины в телефоне (сетка 2 × 2). */
function goodCard(c: Ctx, good: Good, x: number, y: number, cardW: number) {
  fillBox(c, x, y, cardW, 238, 28, ML.card)
  goodsPicture(c, good.picture, x, y, cardW)
  const lines = wrap(c, good.name, 13, 600, cardW - 24)
  lines.slice(0, 2).forEach((line, li) => txt(c, line, x + 12, y + cardW + 20 + li * 17, 13, 600, ML.fg))
  glowText(c, zl(good.net), x + 12, y + cardW + 58, 14, 700, ML.brand, 8)
}

/** Место карточки index в сетке витрины телефона, pt. */
export function phoneCardRect(index: number): Rect {
  const w = (PHONE_UI.w - 44) / 2
  return { x: 16 + (index % 2) * (w + 12), y: IPHONE.top + 280 + Math.floor(index / 2) * 250, w, h: 238 }
}

/** Та же карточка отдельно: она прилетает с узла «Magazyn» и садится на своё
    место в витрине телефона (18 → 19). */
export function phoneGoodCard(index: number): CanvasTexture | null {
  const good = GOODS[index] ?? GOODS[0]!
  const r = phoneCardRect(index)
  return sheet(r.w, r.h, 3, (c) => goodCard(c, good, 0, 0, r.w))
}

/** Где на экране телефона (pt) касания каждого шага. */
export const PHONE_TAPS = {
  menu: [345, 83],
  shop: [196, 330],
  filters: [196, 730],
  product: [270, 720],
}

/** Липкая кнопка «Złóż zamówienie» с замком — пульсирует, её не нажимают. */
export function phonePlaceOrder(): CanvasTexture | null {
  const w = 361
  const h = 50
  return sheet(w, h, 3, (c) => {
    fillBox(c, 0, 0, w, h, h / 2, ML.primary)
    const label = 'Złóż zamówienie'
    const width = measure(c, label, 16, 500) + 26
    icon(c, 'lock', (w - width) / 2, 15, 17, '#ffffff')
    txt(c, label, (w - width) / 2 + 26, 31, 16, 500, '#ffffff')
  })
}

/* ═══ Телефон продавца: уведомления бота (станция 20) ═════════════════════ */

/** 0 — пустой чат: под плитой первого уведомления, пока она приподнята над экраном. */
export type ChatStage = 0 | 1 | 2 | 3 | 4

const CHAT_BG = '#0b0b0d'
const BUBBLE = '#1d1d21'
const KEY = '#2a2a30'

function bubble(c: Ctx, x: number, y: number, w: number, lines: [string, number, string][], keys: string[][]): number {
  const lineH = 19
  const textH = lines.length * lineH + 20
  fillBox(c, x, y, w, textH, 18, BUBBLE)
  lines.forEach(([value, weight, color], index) => txt(c, value, x + 14, y + 26 + index * lineH, 13, weight, color))
  let ky = y + textH + 4
  for (const row of keys) {
    const kw = (w - 4 * (row.length - 1)) / row.length
    row.forEach((key, index) => {
      fillBox(c, x + index * (kw + 4), ky, kw, 34, 10, KEY)
      txt(c, key, x + index * (kw + 4) + kw / 2, ky + 22, 13, 500, ML.fg, { align: 'center' })
    })
    ky += 38
  }
  return ky - y
}

/** Первое уведомление: новая заявка B2B с кнопками «Aktywuj / Odrzuć». */
function chatFirst(c: Ctx, x: number, y: number, w: number): number {
  return bubble(
    c,
    x,
    y,
    w,
    [
      ['🤝 Nowe zgłoszenie B2B kontrahenta', 700, ML.fg],
      ['Firma: ••••••••• sp. z o.o.', 400, ML.fg],
      ['NIP/VAT: 1234563218 · Kraj: PL', 400, ML.fg],
      ['Status: oczekuje na ręczną weryfikację.', 400, ML.mutedFg],
    ],
    [['✅ Aktywuj', '❌ Odrzuć'], ['Otwórz w adminie']],
  )
}

export const CHAT = { first: { x: 16, y: 150, w: 330 } }

export function sellerChat(stage: ChatStage): CanvasTexture | null {
  const { w, h, k } = PHONE_UI
  return sheet(w, h, k, (c) => {
    c.fillStyle = CHAT_BG
    c.fillRect(0, 0, w, h)
    const top = IPHONE.top
    c.fillStyle = '#131316'
    c.fillRect(0, 0, w, top + 60)
    icon(c, 'arrowLeft', 14, top + 18, 22, ML.primary)
    circle(c, 66, top + 29, 19, ML.primary)
    txt(c, 'H', 66, top + 35, 16, 800, '#ffffff', { align: 'center' })
    txt(c, 'Powiadomienia sklepu', 94, top + 26, 15, 600, ML.fg)
    txt(c, 'bot', 94, top + 45, 12, 400, ML.mutedFg)
    let y = CHAT.first.y
    if (stage >= 1) y += (stage === 1 ? chatFirst(c, CHAT.first.x, y, CHAT.first.w) : chatFirst(c, CHAT.first.x, y, CHAT.first.w)) + 14
    if (stage >= 2) {
      y +=
        bubble(
          c,
          16,
          y,
          330,
          [
            [`🛒 ZAMÓWIENIE ${ORDER.number}`, 700, ML.fg],
            ['📊 Status: ⏳ Oczekujące', 400, ML.fg],
            ['💳 Płatność: Oczekuje', 400, ML.fg],
            [`📦 Produkty (4) · 💰 Suma: ${ORDER.gross.toFixed(2)} zł`, 400, ML.fg],
          ],
          [['🚚 Wyślij zamówienie'], ['📋 Otwórz w panelu admina']],
        ) + 14
    }
    if (stage >= 3) {
      y +=
        bubble(
          c,
          16,
          y,
          300,
          [
            [`🚚 Wysyłka zamówienia ${ORDER.number}`, 700, ML.fg],
            ['Wpisz numer przesyłki (tracking number):', 400, ML.mutedFg],
          ],
          [],
        ) + 10
    }
    if (stage >= 4) {
      const mw = 250
      fillBox(c, w - 16 - mw, y, mw, 40, 18, '#9a3a0c')
      txt(c, '620012345678901234567', w - 30, y + 26, 13, 500, '#ffffff', { align: 'right' })
      y += 52
      bubble(
        c,
        16,
        y,
        320,
        [
          [`✅ Zamówienie ${ORDER.number}`, 700, ML.fg],
          ['oznaczone jako WYSŁANE.', 400, ML.fg],
          ['📦 Tracking: 620012345678901234567', 400, ML.mutedFg],
        ],
        [],
      )
    }
    fillBox(c, 12, h - 108, w - 24, 44, 22, '#1a1a1e')
    txt(c, 'Wiadomość', 30, h - 80, 15, 400, ML.mutedFg)
    icon(c, 'arrowRight', w - 50, h - 96, 20, ML.mutedFg)
    statusBar(c, 1, ML.fg)
  })
}

/** Первое уведомление отдельно — оно выходит плитой на 8 см. */
export function chatFirstBubble(): CanvasTexture | null {
  const w = 330
  const h = 186
  return sheet(w, h, 3, (c) => {
    chatFirst(c, 0, 0, w)
  })
}

/** Набор номера посылки в поле ввода (м-ввод). */
export const drawChatInput = (value: string): LiveDraw => (c, w, h) => {
  fillBox(c, 0, 0, w, h, h / 2, '#1a1a1e')
  if (value) {
    const width = txt(c, value, 18, h / 2 + 5, 15, 400, ML.fg)
    c.fillStyle = ML.primary
    c.fillRect(20 + width, h / 2 - 9, 2, 18)
  } else txt(c, 'Wiadomość', 18, h / 2 + 5, 15, 400, ML.mutedFg)
  icon(c, 'arrowRight', w - 38, (h - 20) / 2, 20, value ? ML.primary : ML.mutedFg)
}

/* ═══ Витрина на экране ноутбука (финал) ═════════════════════════════════ */

export function laptopShop(): CanvasTexture | null {
  const { w, h, k } = LAPTOP_UI
  return sheet(w, h, k, (c) => {
    c.fillStyle = ML.bg
    c.fillRect(0, 0, w, h)
    siteHeader(c, w, 32)
    txt(c, 'Sklep', 32, 116, 36, 700, ML.fg)
    fillBox(c, 32, 136, 520, 38, 14, ML.primary)
    txt(c, 'Dynamiczne ceny B2B są aktywne dla Twojego konta.', 46, 160, 13, 500, '#ffffff')
    const cardW = (w - 64 - 36) / 4
    GOODS.slice(0, 4).forEach((good, index) => {
      const x = 32 + index * (cardW + 12)
      const y = 192
      fillBox(c, x, y, cardW, 280, 24, ML.card)
      goodsPicture(c, good.picture, x, y, cardW)
      const lines = wrap(c, good.name, 12, 600, cardW - 20)
      lines.slice(0, 2).forEach((line, li) => txt(c, line, x + 10, y + cardW + 18 + li * 15, 12, 600, ML.fg))
      fillBox(c, x + 8, y + cardW + 50, cardW - 16, 40, 12, 'rgba(252,80,0,0.12)')
      strokeBox(c, x + 8, y + cardW + 50, cardW - 16, 40, 12, 'rgba(252,80,0,0.55)')
      glowText(c, zl(good.net), x + 16, y + cardW + 76, 13, 700, ML.brand, 8)
    })
  })
}

/* ═══ Финал и «Dlaczego» ════════════════════════════════════════════════ */

/** Карточка функции (О4): номер, контур-иконка, заголовок 2–4 слова. Карточка
    наша, не экран движка: в светлой студии (light) — белое стекло и графит. */
export function featureCard(index: number, light = false): CanvasTexture | null {
  const items: [string, IconName, string, string][] = [
    ['01', 'building', 'Rejestracja po NIP', 'Dane firmy z Białej listy MF i VIES'],
    ['02', 'tag', 'Ceny i progi dla każdego kontrahenta', 'Własna cena, progi ilościowe, oferty'],
    ['03', 'creditCard', 'Kredyt kupiecki z limitem', 'Termin płatności pilnuje się sam'],
  ]
  const [number, glyph, title, line] = items[index] ?? items[0]!
  const w = 420
  const h = 290
  return sheet(w, h, 2.4, (c) => {
    fillBox(c, 0, 0, w, h, 26, light ? 'rgba(255,255,255,0.72)' : cardFill('#121214'))
    strokeBox(c, 0, 0, w, h, 26, light ? 'rgba(13,13,13,0.08)' : 'rgba(255,255,255,0.09)', 1.5)
    txt(c, number, 30, 62, 40, 800, ML.brand, { tracking: -1 })
    icon(c, glyph, w - 78, 28, 44, light ? 'rgba(13,13,13,0.8)' : 'rgba(255,255,255,0.85)', 1.6)
    const lines = wrap(c, title, 30, 800, w - 60)
    lines.forEach((value, li) => txt(c, value, 30, 150 + li * 34 - (lines.length - 1) * 17, 30, 800, light ? '#0d0d0d' : ML.fg, { tracking: -0.6 }))
    txt(c, line, 30, 236, 16, 500, light ? '#5f6168' : ML.mutedFg)
  })
}

/** Кнопка финала «Umów rozmowę» — наша, оранжевая пилюля. */
export function ctaButton(): CanvasTexture | null {
  const w = 340
  const h = 76
  return sheet(w, h, 2.6, (c) => {
    fillBox(c, 0, 0, w, h, h / 2, ML.brand)
    txt(c, 'Umów rozmowę', w / 2 - 12, h / 2 + 9, 26, 700, '#ffffff', { align: 'center', tracking: -0.3 })
    icon(c, 'arrowRight', w / 2 + measure(c, 'Umów rozmowę', 26, 700) / 2 + 2, h / 2 - 12, 24, '#ffffff', 2.5)
  })
}
