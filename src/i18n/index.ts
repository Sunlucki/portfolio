import en, { type Copy } from './en.ts';
import { LANGS, LOCALES, MONTSERRAT, fontOf, type Lang } from './langs';

export { LANGS, LANG_NAMES, langPath, type Lang } from './langs';

// The page's language. At /ru/, /uk/ and so on it is that one (each language has its page, for search engines:
// vite.config.ts writes them). At / it is the visitor's: the one they picked last (the language menu remembers
// it), or else the first of their device's languages the site speaks, or else English.
const COPIES: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Copy }>> = {
  ru: () => import('./ru'),
  uk: () => import('./uk'),
  pl: () => import('./pl'),
  de: () => import('./de'),
  it: () => import('./it'),
  fr: () => import('./fr'),
};
const KEY = 'lang';
const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang);

function detect(): Lang {
  const first = location.pathname.split('/')[1];
  if (isLang(first)) return first;
  try {
    const picked = localStorage.getItem(KEY);
    if (isLang(picked)) return picked;
  } catch {
    // storage blocked: go by the device
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

// Remembers the visitor's pick, for their next visit to /.
export function pick(to: Lang) {
  try {
    localStorage.setItem(KEY, to);
  } catch {
    // not remembered: / goes by the device
  }
}

export const lang: Lang = detect();
export const LOCALE = LOCALES[lang];
export const FONT = fontOf(lang);
export const t: Copy = lang === 'en' ? en : (await COPIES[lang]()).default;

// Fills a text's {braces}.
export const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (all, key: string) => String(values[key] ?? all));

// The page in the language it shows (at / it may not be the one its HTML was written in).
document.documentElement.lang = lang;
document.documentElement.style.setProperty('--font', FONT);
document.title = t.meta.title;
document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
if (FONT === 'Montserrat' && !document.querySelector(`link[href="${MONTSERRAT}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MONTSERRAT;
  document.head.append(link);
}
