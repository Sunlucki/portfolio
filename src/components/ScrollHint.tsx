import { Pointer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { FONT } from '../i18n';

const SWIPES = 3;
const SWIPE_MS = 1300;
const [W, H] = [300, 96]; // the word's canvas, CSS px
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
// the contact button's purples (its magenta and violet), a little lighter so they read on the dark
const INK = ['#E23BD6', '#9A4DFF'];

/**
 * A hint to scroll, for touch screens: in the middle of the hero a finger swipes up three times, and under it the word
 * (`word`) gathers out of particles and breaks up upwards with every swipe, as if swept along; then it goes
 * (`onDone`). Both in the contact button's purples; a soft shade behind keeps them clear of the picture under them.
 */
export function ScrollHint({ word, onDone }: { word: string; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const finger = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const hand = finger.current;
    if (!el || !hand) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    [el.width, el.height] = [W * dpr, H * dpr];
    const ctx = el.getContext('2d')!;
    // the word, set on a canvas of its own and read back as points (every other pixel), each with its randoms
    const sheet = document.createElement('canvas');
    [sheet.width, sheet.height] = [W, H];
    const type = sheet.getContext('2d', { willReadFrequently: true })!;
    type.font = `800 ${Math.round(H * 0.46)}px ${FONT}, sans-serif`;
    type.textAlign = 'center';
    type.textBaseline = 'middle';
    type.fillStyle = '#fff';
    type.fillText(word.toUpperCase(), W / 2, H / 2, W - 16);
    const data = type.getImageData(0, 0, W, H).data;
    const points: number[][] = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) points.push([x, y, Math.random(), Math.random(), Math.random()]);
    const ink = ctx.createLinearGradient(0, 0, W, 0);
    ink.addColorStop(0.15, INK[0]);
    ink.addColorStop(0.85, INK[1]);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      if (t >= SWIPES * SWIPE_MS) return onDone();
      const k = (t % SWIPE_MS) / SWIPE_MS; // through this swipe
      // the finger: comes in low, swipes up and fades as it goes
      const lift = ease(clamp01((k - 0.3) / 0.4));
      hand.style.transform = `translateY(${(26 - 84 * lift).toFixed(1)}px)`;
      hand.style.opacity = (clamp01(k / 0.15) * (1 - clamp01((k - 0.62) / 0.14))).toFixed(3);
      // the word: gathers out of the air, then goes up with the swipe, breaking up
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ink;
      for (const [x, y, a, b, c] of points) {
        const gathered = ease(clamp01((k - a * 0.16) / 0.3));
        const swept = ease(clamp01((k - 0.42 - b * 0.18) / 0.34));
        const alpha = gathered * (1 - swept);
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x + (1 - gathered) * (a - 0.5) * 140 + swept * (c - 0.5) * 70, y + (1 - gathered) * (b - 0.5) * 90 - swept * (36 + 70 * c), 1.7, 1.7);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [word, onDone]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 grid place-items-center [animation:fade-in_0.4s_ease-out]">
      <div className="flex flex-col items-center rounded-full px-10 py-6" style={{ background: 'radial-gradient(closest-side, rgb(4 11 28 / 0.62), rgb(4 11 28 / 0))' }}>
        <span ref={finger} className="opacity-0" style={{ filter: 'drop-shadow(0 0 12px rgb(182 0 168 / 0.75))' }}>
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="scroll-hint-ink" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={INK[0]} />
                <stop offset="1" stopColor={INK[1]} />
              </linearGradient>
            </defs>
          </svg>
          <Pointer className="h-14 w-14" color="url(#scroll-hint-ink)" strokeWidth={2.2} />
        </span>
        <canvas ref={canvas} className="mt-3" style={{ width: W, height: H }} />
      </div>
    </div>
  );
}
