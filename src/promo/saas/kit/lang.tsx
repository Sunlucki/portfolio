import { createContext, useContext } from 'react'

/* Язык ролика (владелец 30.09: английские версии для портфолио sunlucki.pl).
   Польский — основной и по умолчанию; английский включается пропом lang у
   Saas<X> (в плеере — inputProps={{ lang: 'en' }}). Текст пишется парой прямо
   на месте: t('Dodaj do leadów', 'Add to leads') — польский кадр не меняется,
   а перевод виден рядом с оригиналом.

   Тайминг от языка не зависит: длительности, посчитанные по тексту
   (readFrames), считать по польскому — главы сайта ведут на те же кадры. */

export type Lang = 'pl' | 'en'

const LangContext = createContext<Lang>('pl')

/** Ставит язык для всего ролика (обёртка в Saas<X>). */
export const LangProvider = LangContext.Provider

export const useLang = (): Lang => useContext(LangContext)

/** Выбор строки вне React (данные сцены, расчёты): pick(lang, pl, en). */
export const pick = (lang: Lang, pl: string, en: string): string => (lang === 'en' ? en : pl)

/** Переводчик компонента: const t = useT(); t('Zapisz', 'Save'). */
export function useT(): (pl: string, en: string) => string {
  const lang = useLang()
  return (pl, en) => (lang === 'en' ? en : pl)
}
