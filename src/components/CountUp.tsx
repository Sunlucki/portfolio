import { animate } from 'animejs';
import { useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

// Counts from 0 to `value` with anime.js the first time the number scrolls into view.
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    const counter = { n: 0 };
    const animation = animate(counter, {
      n: value,
      duration: 1600,
      ease: 'outExpo',
      onUpdate: () => {
        el.textContent = `${Math.round(counter.n)}${suffix}`;
      },
    });
    return () => {
      animation.pause();
    };
  }, [inView, value, suffix]);

  return (
    <span ref={ref}>
      {0}
      {suffix}
    </span>
  );
}
