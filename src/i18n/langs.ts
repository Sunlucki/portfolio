// The site's languages, and where each one's page is: English at /, the others at /ru/, /uk/ and so on. No
// browser in here: the build reads it too (vite.config.ts writes each language's page).
export const LANGS = ['en', 'ru', 'uk', 'pl', 'de', 'it', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
  uk: 'Українська',
  pl: 'Polski',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
};
// for numbers and dates (Intl), and for Open Graph
export const LOCALES: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU', uk: 'uk-UA', pl: 'pl-PL', de: 'de-DE', it: 'it-IT', fr: 'fr-FR' };
export const OG_LOCALES: Record<Lang, string> = { en: 'en_US', ru: 'ru_RU', uk: 'uk_UA', pl: 'pl_PL', de: 'de_DE', it: 'it_IT', fr: 'fr_FR' };
// Kanit has no Cyrillic: Russian and Ukrainian are set in Montserrat.
export const fontOf = (lang: Lang) => (lang === 'ru' || lang === 'uk' ? 'Montserrat' : 'Kanit');
export const MONTSERRAT = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300..900&display=swap';
export const langPath = (to: Lang) => (to === 'en' ? '/' : `/${to}/`);
