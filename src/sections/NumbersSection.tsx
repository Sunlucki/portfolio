import { useEffect, useRef, useState } from 'react';
import { ScatterText } from '../components/ScatterText';
import { SpeedNumber } from '../components/SpeedNumber';
import { NUMBERS, NUMBERS_CAPTION, NUMBERS_TITLE } from '../content';
import { LOCALE } from '../i18n';

// The numbers on see-through cards in rows that slide slowly in alternating directions as the page scrolls, as the
// Graphics section's covers once did (his call, 2026-10-01: the drum that turned through them one by one made the
// block long): two rows on screens, three on phones, each card's number racing up to its value as soon as its row
// comes into view, so no zeros show (and again the next time). A soft glow behind the rows, for the glass to show;
// their ends fade into the page.
const dealt = (count: number) =>
  Array.from({ length: count }, (_, row) => NUMBERS.map((n, i) => ({ ...n, i })).filter(({ i }) => Math.floor((i * count) / NUMBERS.length) === row));
const ROWS = { wide: dealt(2), phone: dealt(3) };
const PHONE = '(max-width: 767px)';
const SPEED = 0.15; // pixels of slide per pixel of scroll
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // (then the rows stand still)
const FADE = 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)';

export function NumbersSection() {
  const section = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  const [seen, setSeen] = useState<boolean[]>([]);
  const rows = phone ? ROWS.phone : ROWS.wide;

  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const change = () => setPhone(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  // the rows' slide, from where the section is on the screen
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const offset = still ? 0 : (window.scrollY - top + window.innerHeight) * SPEED;
      rowRefs.current.forEach((row, i) => {
        // (a row holds three copies of its cards; it starts one copy to the left, so both its ends stay filled)
        if (row) row.style.transform = `translate3d(${(i % 2 ? -1 : 1) * (offset - 120) - row.scrollWidth / 3}px, 0, 0)`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phone]);

  // a row's numbers race as it comes into view
  useEffect(() => {
    const observer = new IntersectionObserver((entries) =>
      setSeen((was) => {
        const next = [...was];
        for (const entry of entries) next[rowRefs.current.indexOf(entry.target as HTMLDivElement)] = entry.isIntersecting;
        return next;
      }),
    );
    rowRefs.current.slice(0, rows.length).forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, [rows]);

  return (
    <section ref={section} id="numbers" className="overflow-hidden py-24 text-center md:py-32">
      <div className="px-5 sm:px-8 md:px-10">
        <ScatterText text={NUMBERS_TITLE} className="text-balance text-[clamp(2.4rem,7vw,6rem)] font-black leading-[0.95]" letterClassName="hero-heading" />
        <p className="mx-auto mt-4 max-w-[640px] font-light italic leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.2rem)' }}>
          {NUMBERS_CAPTION}
        </p>
      </div>
      <ul className="sr-only">
        {NUMBERS.map((n) => (
          <li key={n.label}>
            {n.value.toLocaleString(LOCALE)}
            {n.suffix} {n.label}
          </li>
        ))}
      </ul>
      <div aria-hidden className="relative mt-12 md:mt-16">
        <div className="pointer-events-none absolute inset-x-0 -inset-y-10" style={{ background: 'radial-gradient(60% 55% at 50% 50%, rgb(127 176 255 / 0.13), transparent 75%)' }} />
        <div className="relative flex flex-col gap-3" style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
          {rows.map((cards, r) => (
            <div
              key={`${phone}-${r}`}
              ref={(el) => {
                rowRefs.current[r] = el;
              }}
              className="flex w-max gap-3"
              style={{ willChange: 'transform' }}
            >
              {[...cards, ...cards, ...cards].map((n, k) => (
                <div
                  key={k}
                  className="flex w-[232px] shrink-0 flex-col items-start justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-6 py-6 text-left shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-md sm:w-[300px] md:w-[380px] md:px-8 md:py-8"
                >
                  <div className="font-black leading-none text-[#D7E2EA]" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)' }}>
                    <SpeedNumber value={n.value} suffix={n.suffix} run={!!seen[r]} />
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#D7E2EA]/60 sm:text-xs">{n.label}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
