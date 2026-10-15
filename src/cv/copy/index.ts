import { lang, type Lang } from '../../i18n';
import en from './en.ts';
import type { CvText } from './types.ts';

// The CV in the page's language (src/i18n decides which: the path's, or at /cv/ the visitor's).
const COPIES: Record<Exclude<Lang, 'en'>, () => Promise<{ default: CvText }>> = {
  ru: () => import('./ru.ts'),
  uk: () => import('./uk.ts'),
  pl: () => import('./pl.ts'),
  de: () => import('./de.ts'),
  it: () => import('./it.ts'),
  fr: () => import('./fr.ts'),
};

export const c: CvText = lang === 'en' ? en : (await COPIES[lang]()).default;
export type { CvText };
