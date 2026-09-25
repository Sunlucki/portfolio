import { useEffect, useRef, type RefObject } from 'react';
import { TILES } from '../content';

const ROW_1 = TILES.slice(0, 11);
const ROW_2 = TILES.slice(11);

// Two rows of project screens that slide in opposite directions as the page scrolls.
export function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const section = sectionRef.current;
      const row1 = row1Ref.current;
      const row2 = row2Ref.current;
      if (!section || !row1 || !row2) return;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3;
      // Rows hold three copies of their tiles; start one copy to the left so both edges stay filled.
      row1.style.transform = `translate3d(${offset - 200 - row1.scrollWidth / 3}px, 0, 0)`;
      row2.style.transform = `translate3d(${-(offset - 200) - row2.scrollWidth / 3}px, 0, 0)`;
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
    <section ref={sectionRef} aria-label="Selected screens" className="overflow-hidden bg-[#0C0C0C] pb-10 pt-24 sm:pt-32 md:pt-40">
      <div className="flex flex-col gap-3">
        <Row rowRef={row1Ref} tiles={ROW_1} />
        <Row rowRef={row2Ref} tiles={ROW_2} />
      </div>
    </section>
  );
}

function Row({ tiles, rowRef }: { tiles: typeof TILES; rowRef: RefObject<HTMLDivElement | null> }) {
  const tripled = [...tiles, ...tiles, ...tiles];
  return (
    <div ref={rowRef} className="flex w-max gap-3" style={{ willChange: 'transform' }}>
      {tripled.map((t, i) => (
        <img
          key={i}
          src={t.src}
          alt={i < tiles.length ? t.alt : ''}
          aria-hidden={i >= tiles.length || undefined}
          loading="lazy"
          decoding="async"
          width={420}
          height={270}
          className="h-[190px] w-[296px] shrink-0 rounded-2xl object-cover sm:h-[270px] sm:w-[420px]"
        />
      ))}
    </div>
  );
}
