import { useEffect, useRef } from 'react';

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FACE = 36; // degrees between a wheel's digits: ten round it
const RADIUS = 0.5 / Math.tan(((FACE / 2) * Math.PI) / 180); // in the digits' height (em, set solid): a face each

/**
 * A number on drums, like a counter's: each digit a wheel of 0 to 9 round an axis across that, when `run` comes on,
 * spins a few turns and settles on its digit, the wheels stopping one after another from the left (the later ones
 * spinning longer); the rest of the text (separators, the unit) stands still. The digits either side of the front
 * one show faintly above and below it, turning away. It spins again each time `run` comes back on.
 */
export function DrumNumber({ text, run }: { text: string; run: boolean }) {
  let wheel = 0;
  return (
    <span className="inline-flex tabular-nums" style={{ transform: 'skewX(-9deg)' }}>
      {[...text].map((char, i) =>
        /\d/.test(char) ? (
          <Wheel key={i} digit={Number(char)} run={run || still} order={wheel++} />
        ) : (
          <span key={i} className="hero-heading whitespace-pre">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

// Each face is turned on its own, about the wheel's axis a radius behind the front (so the front digit stands where
// the text does), and fades as it turns away: no shared 3D space, which Safari flattens under some styles.
function Wheel({ digit, run, order }: { digit: number; run: boolean; order: number }) {
  const faces = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const target = run ? (still ? 0 : 2 + order) * 360 + digit * FACE : 0;
    const turnTo = (angle: number) =>
      faces.current.forEach((face, d) => {
        if (!face) return;
        const tilt = ((((d * FACE - angle) % 360) + 540) % 360) - 180; // -180 to 180, 0 in front
        face.style.opacity = Math.abs(tilt) < 85 ? (Math.cos((tilt * Math.PI) / 180) ** 8).toFixed(3) : '0';
        face.style.transform = `perspective(8em) translateZ(${-RADIUS}em) rotateX(${tilt.toFixed(2)}deg) translateZ(${RADIUS}em)`;
      });
    if (!run || still) return turnTo(target);
    const [duration, delay] = [1500 + order * 300, order * 80];
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start - delay) / duration));
      turnTo(target * (1 - (1 - k) ** 4));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    turnTo(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, digit, order]);
  return (
    <span className="relative inline-block">
      <span className="invisible">0</span>
      {Array.from({ length: 10 }, (_, d) => (
        <span
          key={d}
          ref={(el) => {
            faces.current[d] = el;
          }}
          className="hero-heading absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0 }}
        >
          {d}
        </span>
      ))}
    </span>
  );
}
