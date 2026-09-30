import { useEffect, useRef, useState } from 'react';
import { LANGS, LANG_NAMES, lang, langPath, pick, t } from '../i18n';

// The language menu in the hero's nav: the page's language, which opens a list of them all, each a link to its page
// (picked, it is remembered for the next visit to /).
export function LangSwitch({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  return (
    <div ref={box} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={`${t.language}: ${LANG_NAMES[lang]}`}
        className={`-my-3 py-3 text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 ${className}`}
      >
        {lang.toUpperCase()}
      </button>
      <ul
        className={`absolute right-0 top-full z-10 mt-2 min-w-[170px] rounded-2xl border border-white/10 bg-[#111215]/95 p-1.5 text-left shadow-2xl backdrop-blur-md transition-[opacity,transform] duration-200 ${
          open ? 'visible opacity-100' : 'invisible -translate-y-1 opacity-0'
        }`}
      >
        {LANGS.map((to) => (
          <li key={to}>
            <a
              href={langPath(to)}
              hrefLang={to}
              lang={to}
              onClick={() => pick(to)}
              aria-current={to === lang ? 'page' : undefined}
              className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm transition-colors ${
                to === lang ? 'bg-white/10 text-white' : 'text-[#D7E2EA]/75 hover:bg-white/5 hover:text-white'
              }`}
            >
              {LANG_NAMES[to]}
              <span className="text-xs uppercase tracking-widest text-[#D7E2EA]/40">{to}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The same links in a row, for the footer (and for search engines, which follow them to each language's page).
export function LangLinks() {
  return (
    <nav aria-label={t.language} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
      {LANGS.map((to) => (
        <a
          key={to}
          href={langPath(to)}
          hrefLang={to}
          lang={to}
          onClick={() => pick(to)}
          aria-current={to === lang ? 'page' : undefined}
          className={`-my-2 py-2 transition-colors ${to === lang ? 'text-[#D7E2EA]' : 'hover:text-[#D7E2EA]'}`}
        >
          {LANG_NAMES[to]}
        </a>
      ))}
    </nav>
  );
}
