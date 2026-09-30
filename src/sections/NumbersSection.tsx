import { useEffect, useRef, useState } from 'react';
import { ScatterText } from '../components/ScatterText';
import { SpeedNumber } from '../components/SpeedNumber';
import { NUMBERS, NUMBERS_CAPTION, NUMBERS_TITLE } from '../content';
import { LOCALE } from '../i18n';

const GAP = 38; // degrees between the numbers on the drum
const TURN_VH = 55; // scroll per number
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The numbers: a drum that turns as the page scrolls (after React Bits Pro's 3D Text Reveal), a number on
 * every face. The stage sticks while the section scrolls past; the drum's angle follows the scroll, eased.
 * As a number comes round to the front it races up to its value (SpeedNumber); a number that goes back down
 * below resets, so it races again next time. Above
 * the drum, a heading whose letters scatter from the cursor.
 */
export function NumbersSection() {
  const section = useRef<HTMLElement>(null);
  const faces = useRef<(HTMLDivElement | null)[]>([]);
  const [ran, setRan] = useState(() => NUMBERS.map(() => still));

  useEffect(() => {
    const el = section.current;
    if (!el || still) return;
    let frame = 0;
    let angle = -Infinity;
    let drawn = ''; // the drum as last laid out, to skip frames where it rests
    let last = performance.now();
    const flags = NUMBERS.map(() => false);
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - vh)));
      // the first number comes up from below to the front, the last goes on up past it
      const target = -0.6 * GAP + p * (NUMBERS.length - 1 + 1.2) * GAP;
      angle = angle === -Infinity ? target : angle + (target - angle) * (1 - Math.exp(-dt * 9));
      const radius = Math.min(vh * 0.42, 460);
      const pose = `${angle.toFixed(2)} ${radius.toFixed(0)}`;
      frame = requestAnimationFrame(tick);
      if (pose === drawn) return;
      const first = !drawn; // landing mid-section: the numbers already passed show their values
      drawn = pose;
      let changed = false;
      faces.current.forEach((face, i) => {
        if (!face) return;
        const tilt = angle - i * GAP; // below the front while it's coming, above once it has passed
        const seen = Math.max(0, 1 - (Math.abs(tilt) / (GAP * 1.9)) ** 1.5);
        // on the drum's rim, turned about its axis, which lies a radius behind the front
        face.style.transform = `translate(-50%, -50%) translateZ(${(-radius).toFixed(0)}px) rotateX(${tilt.toFixed(2)}deg) translateZ(${radius.toFixed(0)}px)`;
        face.style.opacity = seen.toFixed(3);
        face.style.visibility = seen > 0 ? 'visible' : 'hidden';
        const run = tilt < -GAP * 0.9 ? false : tilt > -GAP * 0.4 && (first || tilt < GAP * 0.4) ? true : flags[i];
        if (run !== flags[i]) {
          flags[i] = run;
          changed = true;
        }
      });
      if (changed) setRan([...flags]);
    };
    // turn only while the section is on screen
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const face = (n: (typeof NUMBERS)[number], i: number) => (
    <>
      <div className="font-black leading-none" style={{ fontSize: 'clamp(3.6rem, 15vw, 9rem)' }}>
        <SpeedNumber value={n.value} suffix={n.suffix} run={ran[i]} />
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/60 sm:text-sm">{n.label}</p>
    </>
  );

  if (still) {
    return (
      <section id="numbers" className="px-5 py-24 text-center sm:px-8 md:px-10 md:py-32">
        <ScatterText text={NUMBERS_TITLE} className="text-balance text-[clamp(2.4rem,7vw,6rem)] font-black leading-[0.95]" letterClassName="hero-heading" />
        <p className="mt-4 font-light italic text-[#D7E2EA]/80">{NUMBERS_CAPTION}</p>
        <ul className="mt-16 flex flex-col items-center gap-16">
          {NUMBERS.map((n, i) => (
            <li key={n.label} className="flex flex-col items-center">
              {face(n, i)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={section} id="numbers" className="relative" style={{ height: `calc(100svh + ${NUMBERS.length * TURN_VH}vh)` }}>
      <div className="sticky top-0 flex h-svh flex-col items-center overflow-hidden px-5 pt-[11vh] text-center sm:px-8 md:px-10">
        <ScatterText text={NUMBERS_TITLE} className="text-balance text-[clamp(2.4rem,7vw,6rem)] font-black leading-[0.95]" letterClassName="hero-heading" />
        <p className="mt-4 max-w-[640px] font-light italic leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.2rem)' }}>
          {NUMBERS_CAPTION}
        </p>
        <ul className="sr-only">
          {NUMBERS.map((n) => (
            <li key={n.label}>
              {n.value.toLocaleString(LOCALE)}
              {n.suffix} {n.label}
            </li>
          ))}
        </ul>
        {/* the drum: its axis across the stage, the front face at the stage's depth */}
        <div aria-hidden className="relative w-full flex-1" style={{ perspective: 1100 }}>
          <div className="absolute left-1/2 top-[48%]" style={{ transformStyle: 'preserve-3d' }}>
            {NUMBERS.map((n, i) => (
              <div
                key={n.label}
                ref={(el) => {
                  faces.current[i] = el;
                }}
                className="absolute left-0 top-0 flex w-[92vw] max-w-[900px] flex-col items-center"
                style={{ backfaceVisibility: 'hidden', visibility: 'hidden' }}
              >
                {face(n, i)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
