import { B2B_FLIGHT } from '../../oner/paths/b2b'
import type { Lang } from '../kit/lang'

/* Данные ролика — те же, что у двойников 3D-пролёта (packages/oner/src/motion/
   b2b.ts): нейтральный демо-каталог упаковки, пороги, оферта, заказ, статусы,
   каналы. Берём их оттуда только для чтения, чтобы 3D и 2D показывали одно и то
   же; экраны рисуем свои, светлые (twin.tsx). */

export {
  BL_STATUSES,
  CARTON,
  CHANNELS,
  GOODS,
  ORDER,
  QUICK_LINES,
  QUOTE_ROWS,
  SORT_AFTER,
  STATUS_FLOW,
  TIERS,
  YOUR_PRICE,
  pln,
  unitPrice,
  zl,
  type Good,
} from '../../oner/motion/b2b'

/** Учебный NIP с верной контрольной суммой (фирма в кадре замаскирована). */
export const NIP = '1234563218'

/** Адрес демо-витрины — как в адресной строке телефона у 3D-двойника. */
export const HOST = 'hurtownia.demo'

/** Акцент ролика — оранжевый движка (#fc5000, Ember). */
export const ORANGE = '#fc5000'

/* ── Подписи станций: те же, что у выносок 3D (packages/oner/src/paths/b2b.ts) ── */

function station(n: number) {
  const found = B2B_FLIGHT.stations.find((item) => item.n === n)
  if (!found) throw new Error(`Нет станции ${n} в пути B2B`)
  return found
}

/** Подпись станции n: польская или английская (caption.en из paths/b2b.ts). */
export const caption = (n: number, lang: Lang = 'pl') => (lang === 'en' ? station(n).caption?.en : station(n).caption?.pl) ?? ''

/** Главы по-английски: в paths/b2b.ts главы только польские. */
const CHAPTERS_EN: Record<string, string> = {
  '01 Rejestracja': '01 Registration',
  '02 Weryfikacja': '02 Verification',
  '03 Ceny': '03 Pricing',
  '04 Zamówienie': '04 Ordering',
  '05 Realizacja': '05 Fulfilment',
  '06 Mobile': '06 Mobile',
  Dlaczego: 'Why',
  'Finał': 'Finale',
}

/** Метка выноски «NN · Глава», как в 3D. */
export const tag = (n: number, lang: Lang = 'pl') => {
  const chapter = station(n).chapter
  return `${String(n).padStart(2, '0')} · ${lang === 'en' ? (CHAPTERS_EN[chapter] ?? chapter) : chapter}`
}

/* ── Английские имена данных движка (товары, статусы): сами данные — в
   motion/b2b.ts, польские; здесь только перевод для ролика lang = 'en'. ── */

/** Товары демо-каталога по-английски. Запятая у ленты и плёнки — чтобы перенос
    в узкой карточке телефона шёл по ней, а не рвал «48 mm» и «1.5 kg». */
const GOODS_EN: Record<string, string> = {
  'Taśma pakowa 48 mm × 66 m brązowa': 'Brown packing tape, 48 mm × 66 m',
  'Folia stretch 23 µm 1,5 kg': 'Stretch film 23 µm, 1.5 kg',
  'Karton klapowy 600×400×400 mm 5-warstwowy': 'Shipping box 600×400×400 mm 5-ply',
  'Wypełniacz papierowy 5 kg': 'Paper void fill 5 kg',
  'Karton klapowy 300×200×150 mm 3-warstwowy': 'Shipping box 300×200×150 mm 3-ply',
}

/** Название товара на языке ролика (name — польское из данных). */
export const goodName = (name: string, lang: Lang) => (lang === 'en' ? (GOODS_EN[name] ?? name) : name)

/** Статусы заказа движка (admin.ordersPage.status* из en.ts движка). */
const STATUS_EN: Record<string, string> = {
  'Nowe zamówienie': 'New order',
  'W realizacji': 'Processing',
  'Przekazane do magazynu': 'Handed over to warehouse',
  Kompletowanie: 'Picking',
  Pakowanie: 'Packing',
  'Przekazane kurierowi': 'Handed over to courier',
  Dostarczone: 'Delivered',
}

export const statusName = (name: string, lang: Lang) => (lang === 'en' ? (STATUS_EN[name] ?? name) : name)

/** Статусы в BaseLinkerze продавца — свои у каждого аккаунта; английский аккаунт. */
const BL_STATUS_EN: Record<string, string> = {
  'Nowe zamówienia': 'New orders',
  'W realizacji': 'In progress',
  'Do magazynu': 'To warehouse',
  Kompletacja: 'Picking',
  Pakowanie: 'Packing',
  Wysłane: 'Shipped',
}

export const blStatusName = (name: string, lang: Lang) => (lang === 'en' ? (BL_STATUS_EN[name] ?? name) : name)

/** Маржа товара в процентах, как marginOf у художника. */
export const marginOf = (net: number, retail: number) => Math.round(((retail - net) / retail) * 10000) / 100

/** «35.1%» → как percent у художника: целые без дробной части. */
export const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(2)}%`
