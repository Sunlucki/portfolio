import { useMemo } from 'react'
import { setCrmTheme } from '../../oner/motion/crm'
import { setPaintLang } from '../../oner/motion/paint'
import { CRM_FLIGHT } from '../../oner/paths/crm'
import { useLang, type Lang } from '../kit/lang'

/* Двойники CRM для v4 — художники из packages/oner/src/motion/crm.ts (те же,
   что в 3D-пролёте), в светлой теме CRM. Надписи и цвета там сверены с
   apps/web/src (компоненты и польский словарь i18n/pl), имена вымышленные. */

export * from '../../oner/motion/crm'

/** Холсты двойников: художники переключаются на светлые токены CRM и на язык
    ролика прямо перед рисованием (тема и язык — общее состояние модуля, его
    меняют и 3D-ролики, и соседний плеер на другом языке). Звать только внутри
    <FontGate>: холст не ждёт шрифт. */
export function useCrmTwins<T>(make: () => T): T {
  const lang = useLang()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    setCrmTheme('light')
    setPaintLang(lang)
    try {
      return make()
    } finally {
      /* 3D-пролёт и сайт язык не ставят и ждут польский. */
      setPaintLang('pl')
    }
  }, [lang])
}

/** Токены светлой темы CRM (apps/web/src/styles/tokens.css, [data-theme='light'])
    для DOM-деталей поверх холстов: кнопки, полосы, строки. */
export const LIGHT = {
  bg: '#f3f4f8',
  card: '#ffffff',
  hover: '#dde0e8',
  teal: '#2a9baa',
  coral: '#d94f44',
  green: '#059669',
  amber: '#d97706',
  blue: '#2563eb',
  violet: '#7c3aed',
  border: 'rgba(0, 0, 0, 0.09)',
  borderHover: 'rgba(0, 0, 0, 0.16)',
  text: '#111827',
  muted: '#4b5563',
  dim: '#6b7280',
}

/* ── Подписи станций: те же, что у выносок 3D (packages/oner/src/paths/crm.ts) ── */

function station(n: number) {
  const found = CRM_FLIGHT.stations.find((item) => item.n === n)
  if (!found) throw new Error(`Нет станции ${n} в пути CRM`)
  return found
}

/** Подпись станции n на языке ролика. */
export const caption = (n: number, lang: Lang) => (lang === 'en' ? station(n).caption?.en : station(n).caption?.pl) ?? ''

/** Главы ролика по-английски: названия наши, а не пункты меню продукта. */
const CHAPTER_EN: Record<string, string> = {
  '01 Start': '01 Start',
  '02 Leady': '02 Leads',
  '03 Sprzedaż': '03 Sales',
  '04 Kontakt': '04 Contact',
  '05 Dokumenty': '05 Documents',
  '06 Mobile': '06 Mobile',
  Dlaczego: 'Why',
  Finał: 'Finale',
}

/** Метка выноски «NN · Глава», как в 3D. */
export const tag = (n: number, lang: Lang) => {
  const chapter = station(n).chapter
  return `${String(n).padStart(2, '0')} · ${lang === 'en' ? (CHAPTER_EN[chapter] ?? chapter) : chapter}`
}
