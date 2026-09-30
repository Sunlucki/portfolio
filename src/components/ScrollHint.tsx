import { Pointer } from 'lucide-react';
import { useEffect, useRef } from 'react';

const SWIPES = 3;
const SWIPE_MS = 1700;
const [BOX_W, BOX_H] = [120, 250]; // the hint's box, CSS px: the finger's path runs up it
const [W, H] = [84, 176]; // the word's canvas, in the box's middle
const WORD_TOP = (BOX_H - H) / 2;
const [TIP_FROM, TIP_TO] = [BOX_H - 14, 18]; // where the fingertip is at the swipe's start and end
const FINGER = 56; // the finger's icon, px; its tip is at TIP of it
const TIP = [0.33, 0.08];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2);
// the contact button's purples (its magenta and violet), a little lighter so they read on the dark
const INK = ['#E23BD6', '#9A4DFF'];

/**
 * A hint to scroll, for touch screens, low in the middle of the hero: a finger comes in turned to the left, presses,
 * swipes up (speeding up and slowing, on a slight arc, turning up with the swipe as a hand does), lets go, three times; and each time the word
 * (`word`, in the same hand as About's "Why?") is written behind its tip in particles, upwards, then breaks up and
 * blows away up the screen. Then it goes (`onDone`). All in the contact button's purples, over a soft shade.
 */
export function ScrollHint({ word, onDone }: { word: string; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const finger = useRef<HTMLSpanElement>(null);
  const ripple = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const hand = finger.current;
    const ring = ripple.current;
    if (!el || !hand || !ring) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    [el.width, el.height] = [W * dpr, H * dpr];
    const ctx = el.getContext('2d')!;
    let frame = 0;
    let alive = true;
    const size = Math.round(W * 0.62);
    // the word in Caveat (once it is in), up the canvas from its foot, read back as points with their randoms
    void document.fonts.load(`700 ${size}px Caveat`, word).catch(() => {}).then(() => {
      if (!alive) return;
      const sheet = document.createElement('canvas');
      [sheet.width, sheet.height] = [W, H];
      const type = sheet.getContext('2d', { willReadFrequently: true })!;
      type.translate(W / 2, H / 2);
      type.rotate(-Math.PI / 2);
      type.font = `700 ${size}px Caveat, cursive`;
      type.textAlign = 'center';
      type.textBaseline = 'middle';
      type.fillStyle = '#fff';
      type.fillText(word, 0, 0, H - 8);
      const data = type.getImageData(0, 0, W, H).data;
      const points: number[][] = [];
      for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 110) points.push([x, y, Math.random(), Math.random(), Math.random()]);
      const ink = ctx.createLinearGradient(0, H, 0, 0);
      ink.addColorStop(0, INK[0]);
      ink.addColorStop(1, INK[1]);
      const start = performance.now();
      const tick = (now: number) => {
        const t = now - start;
        if (t >= SWIPES * SWIPE_MS) return onDone();
        const k = (t % SWIPE_MS) / SWIPE_MS; // through this swipe
        // the hand: in (hovering, a little larger), down onto the glass, up the screen, off it
        const inAt = clamp01(k / 0.14);
        const press = ease(clamp01((k - 0.12) / 0.1));
        const swipe = easeInOut(clamp01((k - 0.24) / 0.46));
        const off = ease(clamp01((k - 0.7) / 0.14));
        const tipY = TIP_FROM + 16 * (1 - press) + (TIP_TO - TIP_FROM) * swipe - 14 * off;
        const tipX = BOX_W / 2 + 7 * Math.sin(Math.PI * swipe) - 3 * (1 - inAt);
        const scale = 1.08 - 0.14 * press + 0.12 * off;
        // (turned 45° to the left while it comes in; pressing and swiping, it turns up with the swipe, a little past)
        const turn = -45 + 8 * press + 44 * swipe + 6 * off;
        hand.style.transform = `translate(${(tipX - FINGER * TIP[0]).toFixed(1)}px, ${(tipY - FINGER * TIP[1]).toFixed(1)}px) rotate(${turn.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        hand.style.opacity = (inAt * (1 - off)).toFixed(3);
        // where it touches: a ring going out
        const touch = clamp01((k - 0.2) / 0.2);
        ring.style.transform = `translate(${BOX_W / 2 - 14}px, ${TIP_FROM - 14}px) scale(${(0.3 + 1.1 * touch).toFixed(3)})`;
        ring.style.opacity = (touch > 0 ? 0.7 * (1 - touch) : 0).toFixed(3);
        // the word: each point comes as the tip has gone up past it, then all of it blows away up the screen
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = ink;
        const tip = tipY - WORD_TOP; // the tip, in the canvas
        for (const [x, y, a, b, c] of points) {
          const written = clamp01((y - tip) / 22) * clamp01(swipe * 8);
          const away = ease(clamp01((k - 0.76 - b * 0.1) / 0.2));
          const alpha = written * (1 - away);
          if (alpha < 0.02) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x + (1 - written) * (a - 0.5) * 10 + away * (c - 0.5) * 50, y - away * (30 + 60 * c), 1.8, 1.8);
        }
        ctx.globalAlpha = 1;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [word, onDone]);
  return (
    // (its foot, with the finger's, clear of the tagline and the button under it, however tall the screen)
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[235px] z-40 flex justify-center [animation:fade-in_0.4s_ease-out]">
      <div className="relative" style={{ width: BOX_W, height: BOX_H, background: 'radial-gradient(closest-side, rgb(4 11 28 / 0.6), rgb(4 11 28 / 0))' }}>
        <canvas ref={canvas} className="absolute left-1/2 -translate-x-1/2" style={{ top: WORD_TOP, width: W, height: H }} />
        <span ref={ripple} className="absolute left-0 top-0 h-7 w-7 rounded-full border-2 opacity-0" style={{ borderColor: INK[0] }} />
        <span ref={finger} className="absolute left-0 top-0 origin-[33%_8%] opacity-0" style={{ filter: 'drop-shadow(0 0 12px rgb(182 0 168 / 0.75))' }}>
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="scroll-hint-ink" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={INK[0]} />
                <stop offset="1" stopColor={INK[1]} />
              </linearGradient>
            </defs>
          </svg>
          <Pointer style={{ width: FINGER, height: FINGER }} color="url(#scroll-hint-ink)" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
