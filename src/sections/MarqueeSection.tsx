import { useEffect, useRef } from 'react';
import { TILES } from '../content';

// Four rows, dealt like cards so neighbouring covers differ.
const ROWS = [0, 1, 2, 3].map((row) => TILES.filter((_, i) => i % 4 === row));
const SPEED = 0.15; // pixels of slide per pixel of scroll
// Fades the rows out at the top and bottom, so they sit in the page like a backdrop.
const FADE = 'linear-gradient(to bottom, transparent, #000 22%, #000 78%, transparent)';

// The smaller projects as a backdrop above "Let's talk": rows of covers that slide slowly in
// alternating directions as the page scrolls.
export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

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
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Selected work"
      className="overflow-hidden bg-[#0C0C0C] py-10 md:py-16"
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <div className="flex flex-col gap-3 opacity-60">
        {ROWS.map((tiles, i) => (
          <div
            key={i}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="flex w-max gap-3"
            style={{ willChange: 'transform' }}
          >
            {[...tiles, ...tiles, ...tiles].map((t, k) => (
              <img
                key={k}
                src={t.src}
                alt={k < tiles.length ? t.alt : ''}
                aria-hidden={k >= tiles.length || undefined}
                loading="lazy"
                decoding="async"
                width={296}
                height={190}
                className="h-[120px] w-[187px] shrink-0 rounded-2xl object-cover sm:h-[160px] sm:w-[249px] md:h-[190px] md:w-[296px]"
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
