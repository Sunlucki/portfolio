import { useEffect, useRef, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { fill, t } from '../i18n';
import { COVER_OF, GRAPHICS, TILES } from '../content';
import { GraphicsProject, type Opening } from './GraphicsProject';

// Rows dealt like cards so neighbouring covers differ: four, and eight on phones (a row shows only its first two
// covers there, so more rows show more of the work).
const dealt = (count: number) => Array.from({ length: count }, (_, row) => TILES.map((tile, i) => ({ ...tile, i })).filter(({ i }) => i % count === row));
const ROWS = { wide: dealt(4), phone: dealt(8) };
const PHONE = '(max-width: 767px)';
const SPEED = 0.15; // pixels of slide per pixel of scroll
// The first and last rows fade into the page at the top and bottom, so they sit in it like a backdrop: shaded in
// the page's colour, not see-through (the particles pass behind the covers, and must not show through them).
const SHADE = ['linear-gradient(to bottom, rgb(12 12 12 / 0.85), rgb(12 12 12 / 0) 75%)', 'linear-gradient(to top, rgb(12 12 12 / 0.85), rgb(12 12 12 / 0) 75%)'];
const TILE = 'h-[120px] w-[187px] shrink-0 rounded-2xl sm:h-[160px] sm:w-[249px] md:h-[190px] md:w-[296px]';

// Graphics: branding, print and social media covers in rows that slide slowly in alternating directions as the
// page scrolls. A cover opens its project (GraphicsProject).
export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [opening, setOpening] = useState<Opening | null>(null);
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  const rows = phone ? ROWS.phone : ROWS.wide;

  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const change = () => setPhone(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      if (!section) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const offset = (window.scrollY - sectionTop + window.innerHeight) * SPEED;
      rowRefs.current.forEach((row, i) => {
        // Rows hold three copies of their tiles; start one copy to the left so both edges stay filled.
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

  return (
    <section id="graphics" ref={sectionRef} data-flow="graphics" className="pt-16 md:pt-24">
      <SectionTitle text={t.graphics.title} className="mb-2 px-4 sm:px-6 md:mb-4 md:px-10" />
      <div className="flex flex-col gap-3 overflow-hidden py-10 md:py-16">
        {rows.map((tiles, i) => (
          <div
            key={i}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="flex w-max gap-3"
            style={{ willChange: 'transform' }}
          >
            {[...tiles, ...tiles, ...tiles].map((tile, k) => {
              const edge = i === 0 ? SHADE[0] : i === rows.length - 1 ? SHADE[1] : null;
              const [slug, picture] = COVER_OF[tile.i];
              const copy = k >= tiles.length; // (the row's other two copies, for the slide)
              return (
                <button
                  key={k}
                  type="button"
                  aria-label={fill(t.graphics.open, { name: GRAPHICS[slug].name })}
                  aria-hidden={copy || undefined}
                  tabIndex={copy ? -1 : undefined}
                  onClick={(e) => setOpening({ slug, picture, cover: e.currentTarget, src: tile.src })}
                  className={`relative block overflow-hidden ${TILE}`}
                >
                  <img src={tile.src} alt={copy ? '' : tile.alt} loading="lazy" decoding="async" width={296} height={190} className={`${TILE} object-cover`} />
                  {edge && <span aria-hidden className="absolute inset-0 rounded-2xl" style={{ background: edge }} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {opening && <GraphicsProject opening={opening} onClose={() => setOpening(null)} />}
    </section>
  );
}
