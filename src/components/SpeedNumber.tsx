import { useEffect, useRef } from 'react';
import { LOCALE } from '../i18n';

type SpeedNumberProps = { value: number; suffix?: string; run: boolean; className?: string; format?: (n: number) => string };

const DURATION = 2200;
const TRAILS = 3;
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const grouped = (n: number) => n.toLocaleString(LOCALE);

// A number that races up to its value when `run` turns on and smears with its speed (after React Bits Pro's
// Speeding Text): it blurs and stretches, copies of it trail behind, and it settles sharp. A value under 10
// spins its digit through two laps first, so it races too. It starts over when `run` goes off and on again.
// `format` writes it (by default with thousands separators).
export function SpeedNumber({ value, suffix = '', run, className = '', format = grouped }: SpeedNumberProps) {
  const main = useRef<HTMLSpanElement>(null);
  const trails = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const show = (n: number, speed: number) => {
      const text = format(n);
      const done = speed === 0 && n === value;
      const smear = Math.min(1, speed);
      if (main.current) {
        main.current.textContent = done ? text + suffix : text;
        main.current.style.filter = smear > 0.02 ? `blur(${(smear * 7).toFixed(1)}px)` : '';
        main.current.style.transform = `scaleX(${(1 + smear * 0.18).toFixed(3)})`;
      }
      trails.current.forEach((trail, j) => {
        if (!trail) return;
        trail.textContent = text;
        trail.style.opacity = (smear * (0.5 - j * 0.14)).toFixed(3);
        trail.style.transform = `translateX(${(-smear * (j + 1) * 22).toFixed(1)}px)`;
      });
    };
    if (!run || still) {
      show(still ? value : 0, 0);
      return;
    }
    const laps = value < 10 ? 20 : 0;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) ** 4;
      const n = Math.floor(eased * (value + laps));
      show(laps ? n % 10 : n, t < 1 ? (4 * (1 - t) ** 3) / 1.6 : 0);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, value, suffix, format]);

  return (
    <span className={`relative inline-block tabular-nums ${className}`} style={{ transform: 'skewX(-9deg)' }}>
      {Array.from({ length: TRAILS }, (_, j) => (
        <span
          key={j}
          ref={(el) => {
            trails.current[j] = el;
          }}
          aria-hidden
          className="absolute left-0 top-0 whitespace-nowrap text-[#9DB4FF]"
          style={{ opacity: 0, filter: `blur(${4 + j * 3}px)` }}
        />
      ))}
      <span ref={main} className="hero-heading relative inline-block origin-right whitespace-nowrap" />
    </span>
  );
}
