import { setPaintLang, type PaintLang } from '../../oner/motion/paint'
import { LANGS, setTaxiTheme } from '../../oner/motion/taxi'
import { TAXI_FLIGHT } from '../../oner/paths/taxi'

/* Двойники TAXI BOSS для v4 — художники из packages/oner/src/motion/taxi.ts
   (те же, что в 3D-пролёте). Надписи и цвета там сверены с кодом продукта
   (~/Developer/TAXI-BOSS: src/index.css, src/lib/i18n.ts, components/admin,
   ios/Driver), люди вымышленные. Светлой темы у продукта нет: экраны остаются
   тёмными, как настоящий интерфейс, а светлые — сцена и наш текст.

   Тему мира художников (setTaxiTheme = TAXI_LOOK.prepare) и язык надписей
   (setPaintLang) переключаем прямо перед каждым рисованием: это общее
   состояние модуля, его меняют и 3D-ролики, и соседний плеер другого языка. */

export * from '../../oner/motion/taxi'

export const prepareTaxi = (lang: PaintLang = 'pl') => {
  setTaxiTheme('light')
  setPaintLang(lang)
}

/** Золото продукта (#FFBF00 → #E68600): на тёмных экранах — выделения пером. */
export const GOLD = '#FFBF00'
export const GOLD_END = '#E68600'
/** Золото нашего текста на белой бумаге — на тон глубже: #FFBF00 на белом не
    читается (то же, что INK.gold светлой студии 3D). Акцент ролика. */
export const ACCENT = '#CF8A00'

/** Первый экран лендинга по-английски (hero.* продукта) — для английского ролика. */
export const LANDING_EN = LANGS.find((lang) => lang.code === 'en')!

/* ── Подписи станций: те же, что у выносок 3D (packages/oner/src/paths/taxi.ts) ── */

function station(n: number) {
  const found = TAXI_FLIGHT.stations.find((item) => item.n === n)
  if (!found) throw new Error(`Нет станции ${n} в пути TAXI`)
  return found
}

/** Подпись станции n на языке ролика (по умолчанию польская). */
export const caption = (n: number, lang: PaintLang = 'pl') => (lang === 'en' ? station(n).caption?.en : station(n).caption?.pl) ?? ''

/** Главы по-английски: в пути только польские названия. */
const CHAPTER_EN: Record<string, string> = {
  '01 Kandydat': '01 Candidate',
  '02 Rejestracja': '02 Registration',
  '03 Dokumenty': '03 Documents',
  '04 Umowa': '04 Contract',
  '05 Flota': '05 Fleet',
  '06 Mobile': '06 Mobile',
  Dlaczego: 'Why',
  Finał: 'Finale',
}

/** Метка выноски «NN · Глава», как в 3D. */
export const tag = (n: number, lang: PaintLang = 'pl') => {
  const chapter = station(n).chapter
  const shown = lang === 'en' ? CHAPTER_EN[chapter] ?? chapter : chapter
  return shown ? `${String(n).padStart(2, '0')} · ${shown}` : String(n).padStart(2, '0')
}
