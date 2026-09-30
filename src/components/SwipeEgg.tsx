import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import { ContactButton } from './Buttons';

const FAST = 4; // px per ms, over SPAN: a swipe flinging the page this fast is rushing it
const SPAN = 120;
const COAST_MS = 1500; // once the finger is off, the page coasting on still counts as its swipe's
// the pixel me: the game's frames (x20/pixel-office) and new poses drawn from them, in one strip; each frame's x, width
// and height in it, then its anchor: the middle of the head, over the soles
const SHEET = '/egg/guy.png';
const FRAMES = {
  stand: [0, 51, 104, 25, 103],
  blink: [52, 51, 104, 25, 103],
  walk0: [104, 51, 104, 26, 103],
  walk1: [156, 49, 104, 24, 103],
  walk2: [206, 50, 104, 25, 103],
  walk3: [257, 49, 104, 24, 103],
  talk: [307, 51, 104, 25, 103],
  plead: [359, 56, 105, 25, 104],
  wave0: [416, 59, 104, 33, 103],
  wave1: [476, 60, 104, 34, 103],
  angry0: [537, 51, 106, 25, 105],
  angry1: [589, 51, 103, 25, 102],
  charge0: [641, 66, 109, 32, 108],
  charge1: [708, 69, 110, 34, 109],
  push: [778, 80, 117, 39, 116],
} as const;
type Frame = keyof typeof FRAMES;
const WALK: Frame[] = ['walk0', 'walk1', 'walk2', 'walk3'];
const TALL = 104; // his height standing, art px
const INK = '#111014'; // his outline, and the bubbles'
// the fireball's colours, from its heart out
const FIRE = [
  [255, 250, 222],
  [255, 226, 105],
  [255, 172, 48],
  [255, 108, 32],
  [228, 56, 30],
  [140, 28, 18],
];
// the screen breaking up: bands of the page gone wrong
const GLITCH = ['invert(1)', 'hue-rotate(90deg) saturate(4)', 'contrast(3) brightness(1.4)', 'hue-rotate(-110deg) saturate(3)'];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const pop = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2; // out, a little past and back
const rand = (a: number, b: number) => a + Math.random() * (b - a);
// scrolls at once, whatever the page's smooth scrolling
const jump = (go: () => void) => {
  const html = document.documentElement;
  const smooth = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  go();
  html.style.scrollBehavior = smooth;
};

/**
 * An Easter egg for touch screens: rush down the page (fling it faster than FAST) and the pixel me from the game steps
 * in. The 1st and 2nd time the page stops and blurs, he walks in and asks, in a speech bubble, to go slowly; then the
 * blur goes and the page is as it was. The 3rd he peeks in from the left, fuming. The 4th he throws a fireball that
 * smashes the screen, it glitches to black, and all that is left is who he is and the contact button.
 */
export function SwipeEgg() {
  const [stage, setStage] = useState<number | null>(null);
  const [last, setLast] = useState(false);
  const busy = useRef(false);
  const held = useRef<string | null>(null); // the page's own overflow, while it is held still
  const hold = useCallback((on: boolean) => {
    const html = document.documentElement;
    if (on && held.current === null) {
      held.current = html.style.overflow;
      html.style.overflow = 'hidden';
      jump(() => window.scrollTo(0, window.scrollY)); // (and the fling stops)
    } else if (!on && held.current !== null) {
      html.style.overflow = held.current;
      held.current = null;
    }
  }, []);

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    new Image().src = SHEET;
    // the bubbles' pixel font: only the letters of their words
    if (!document.querySelector('link[data-egg]')) {
      const letters = [...new Set([...t.egg.slow, ...t.egg.together])].filter((c) => c.codePointAt(0)! < 0x10000).join('');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=Tiny5&text=${encodeURIComponent(letters)}&display=swap`;
      link.dataset.egg = '';
      document.head.append(link);
    }
    let count = 0;
    let touching = false;
    let moved = false; // this touch moved the page (a tap, or a swipe in the video feed, doesn't)
    let coast = 0;
    let marks: number[] = []; // when, and where the page was: the last SPAN of the swipe
    const down = () => {
      touching = true;
      moved = false;
      marks = [];
    };
    const up = () => {
      touching = false;
      coast = moved ? performance.now() + COAST_MS : 0;
    };
    const scrolled = () => {
      const now = performance.now();
      if (touching) moved = true;
      else if (now > coast) return;
      if (busy.current || count > 3) return;
      marks.push(now, window.scrollY);
      while (now - marks[0] > SPAN) marks.splice(0, 2);
      const span = now - marks[0];
      if (span < SPAN / 2 || Math.abs(window.scrollY - marks[1]) / span < FAST) return;
      busy.current = true;
      coast = 0;
      marks = [];
      if (count !== 2) hold(true); // (the 3rd only peeks in)
      setStage(count++);
    };
    const passive = { passive: true };
    window.addEventListener('touchstart', down, passive);
    window.addEventListener('touchend', up, passive);
    window.addEventListener('touchcancel', up, passive);
    window.addEventListener('scroll', scrolled, passive);
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
      window.removeEventListener('scroll', scrolled);
    };
  }, [hold]);

  const leave = useCallback(() => hold(false), [hold]);
  const done = useCallback(() => {
    if (stage === 3) setLast(true); // (and busy for good: that was the last of him)
    else busy.current = false;
    setStage(null);
  }, [stage]);
  return (
    <>
      {stage !== null && createPortal(<Scene key={stage} stage={stage} onLeave={leave} onDone={done} />, document.body)}
      {last && createPortal(<Finale onRelease={leave} onClose={() => setLast(false)} />, document.body)}
    </>
  );
}

// a speech bubble's tail, pixel by pixel ('o' outline, 'w' white): under the bubble pointing down, or at its left
const TAILS = {
  down: ['owwwwwwo', '.owwwwo.', '..owwo..', '...oo...'],
  left: ['...o', '..ow', '.oww', 'owww', '.oww', '..ow', '...o'],
};
const DOT = 3; // the bubbles' pixel, CSS px

function Tail({ side }: { side: keyof typeof TAILS }) {
  const rows = TAILS[side];
  return (
    <svg
      aria-hidden
      width={rows[0].length * DOT}
      height={rows.length * DOT}
      shapeRendering="crispEdges"
      className="absolute"
      style={side === 'down' ? { left: '50%', top: '100%', transform: 'translateX(-50%)' } : { right: '100%', top: '50%', transform: 'translateY(-50%)' }}
    >
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x} ${y}`} x={x * DOT} y={y * DOT} width={DOT} height={DOT} fill={c === 'o' ? INK : '#fff'} />)),
      )}
    </svg>
  );
}

type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; c: number[] };
type Shard = { x: number; y: number; vx: number; vy: number; turn: number; spin: number; pts: number[] };

// One visit of his: stage 0 and 1 talk, 2 peeks in, 3 throws the fireball. The timeline runs on its own clock, drawing
// him (and the fire, the cracks) on a canvas over the page and moving the bubble; `onLeave` as he goes (the page
// can move again), `onDone` once he's gone.
function Scene({ stage, onLeave, onDone }: { stage: number; onLeave: () => void; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const shown = useRef<HTMLSpanElement>(null);
  const unsaid = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const more = useRef<SVGSVGElement>(null);
  const bands = useRef<HTMLDivElement>(null);
  const tap = useRef(() => {});
  const peek = stage === 2;
  const text = peek ? '🤬' : stage === 3 ? '' : stage === 0 ? t.egg.slow : t.egg.together;

  useEffect(() => {
    const start = performance.now();
    const el = canvas.current!;
    const ctx = el.getContext('2d')!;
    const sheet = new Image();
    sheet.src = SHEET;
    let dpr = 1;
    let W = 0;
    let H = 0;
    let P = 2; // device px to his pixel
    const size = () => {
      dpr = Math.min(3, window.devicePixelRatio || 1);
      // (its own box, not the window's: with Safari's bars in and out the two differ, and he'd be squashed)
      [W, H] = [Math.round(el.clientWidth * dpr), Math.round(el.clientHeight * dpr)];
      [el.width, el.height] = [W, H];
      ctx.imageSmoothingEnabled = false;
      P = Math.max(2, Math.round((H * 0.32) / TALL)); // about a third of the screen tall, in whole device pixels
    };
    size();
    window.addEventListener('resize', size);

    // him: frame `f` with its anchor at (x, y), device px, turned by `rot` about it
    const draw = (f: Frame, x: number, y: number, rot = 0, flip = false) => {
      if (!sheet.complete || !sheet.naturalWidth) return;
      const [fx, w, h, ax, ay] = FRAMES[f];
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (rot) ctx.rotate(rot);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(sheet, fx, 0, w, h, -ax * P, -(ay + 1) * P, w * P, h * P);
      ctx.restore();
    };
    // walking in from off the left to the middle, 150 to 1150 ms, bobbing a pixel a step (as in the game)
    const FROM = () => -40 * P;
    const walkIn = (ms: number) => {
      const k = clamp01((ms - 150) / 1000);
      const x = FROM() + (W / 2 - FROM()) * (1 - (1 - k) ** 1.5);
      return { x, f: k < 1 ? WALK[Math.floor(ms / 110) % 4] : ('stand' as Frame), bob: k < 1 ? (Math.floor(ms / 110) % 2) * P : 0 };
    };
    const feet = () => H - Math.round(22 * dpr);

    // the bubble at (x, y) CSS px, its origin (the tail) there, scaled by k
    const place = (x: number, y: number, k: number) => {
      const b = bubble.current;
      if (!b) return;
      b.style.opacity = k > 0.01 ? '1' : '0';
      b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${Math.max(0, k).toFixed(3)})`;
    };
    // the words: typed one by one (pausing on stops and smiles), the rest kept in place so no line moves
    const chars = Array.from(text);
    const at: number[] = [];
    let gap = 0;
    for (const c of chars) {
      at.push(gap);
      gap += /[.,!?…]/.test(c) ? 220 : c.codePointAt(0)! > 0xffff ? 320 : 32;
    }
    const say = (n: number) => {
      if (shown.current) shown.current.textContent = chars.slice(0, n).join('');
      if (unsaid.current) unsaid.current.textContent = chars.slice(n).join('');
    };
    say(peek ? chars.length : 0);

    // ---- stages 0 and 1: he walks in over the blur, (waves,) says it, blinks while it's read, walks off
    const BUBBLE = stage === 0 ? 1500 : 1250;
    let typedAt = -1;
    let skip = false;
    let leaveAt = Infinity;
    let gone = false;
    const talk = (ms: number) => {
      const going = ms - leaveAt;
      if (veil.current) veil.current.style.opacity = String(going > 0 ? 1 - clamp01((going - 150) / 450) : clamp01(ms / 350));
      const typing = ms - BUBBLE - 200;
      const n = skip ? chars.length : at.filter((a) => a <= typing).length;
      if (typing >= 0) say(n);
      if (n === chars.length && typedAt < 0) {
        typedAt = ms;
        leaveAt = ms + 1200 + 22 * chars.length; // time to read it
      }
      if (more.current) more.current.style.opacity = typedAt >= 0 && going < 0 && Math.floor((ms - typedAt) / 400) % 2 === 0 ? '1' : '0';
      let { x, f, bob } = walkIn(ms);
      let flip = false;
      if (ms >= 1150) {
        if (stage === 0 && ms < 2300) f = Math.floor((ms - 1150) / 160) % 2 ? 'wave1' : 'wave0';
        else if (typedAt < 0 && typing >= 0) {
          const pause = n > 0 && /[.,!?…]/.test(chars[n - 1]);
          f = stage === 1 ? 'plead' : !pause && Math.floor(ms / 120) % 2 ? 'talk' : 'stand';
        } else f = (ms - Math.max(typedAt, 1150)) % 2400 > 2260 ? 'blink' : 'stand';
      }
      if (going > 0) {
        if (!gone) {
          gone = true;
          onLeave();
        }
        const k = clamp01(going / 750);
        x = W / 2 + (FROM() - W / 2) * k ** 1.3;
        f = WALK[Math.floor(ms / 100) % 4];
        bob = (Math.floor(ms / 100) % 2) * P;
        flip = true;
      }
      draw(f, x, feet() - bob, 0, flip);
      // the bubble over his head, its tail on him
      const b = bubble.current;
      if (b) {
        const k = pop(clamp01((ms - BUBBLE) / 260)) * (going > 0 ? 1 - ease(clamp01(going / 160)) : 1);
        const top = (feet() - TALL * P) / dpr - 2;
        place(W / 2 / dpr - b.offsetWidth / 2, top - b.offsetHeight - 4 * DOT - 4, k);
      }
      return going > 800;
    };
    tap.current = () => {
      const ms = performance.now() - start;
      if (stage > 1 || ms < BUBBLE) return;
      if (typedAt < 0) skip = true;
      else if (ms < leaveAt) leaveAt = ms;
    };

    // ---- stage 2: he leans in from behind the left edge, fuming, and back
    const peeking = (ms: number) => {
      const out = ease(clamp01((ms - 2000) / 320));
      const k = pop(clamp01(ms / 420)) * (1 - out);
      const shake = k > 0.9 ? 1 : 0;
      const rot = 0.62 * k + shake * Math.sin(ms * 0.07) * 0.025;
      const x = -62 * P + 32 * P * k + shake * (Math.floor(ms / 50) % 2) * P;
      const y = H * 0.72;
      draw(Math.floor(ms / 140) % 2 ? 'angry1' : 'angry0', x, y, rot);
      // the bubble right of his head (80 px up from his soles, turned with him)
      const b = bubble.current;
      if (b) {
        const hx = x + Math.sin(rot) * 80 * P;
        const hy = y - Math.cos(rot) * 80 * P;
        place(hx / dpr + 32 * P / dpr, hy / dpr - b.offsetHeight / 2, pop(clamp01((ms - 320) / 260)) * (1 - out));
      }
      return ms > 2400;
    };

    // ---- stage 3: he walks in, fumes, gathers a fireball between his hands and throws it at the screen
    const fire = document.createElement('canvas');
    const ball = (x: number, y: number, r: number, zoom: number, ms: number) => {
      // pixel fire, r of his pixels across its middle, drawn `zoom` times his pixel: coming at you it gets chunkier
      const R = Math.ceil(r * 1.45) + 1;
      const n = R * 2 + 1;
      [fire.width, fire.height] = [n, n];
      const f = fire.getContext('2d')!;
      const img = f.createImageData(n, n);
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const dx = i - R;
          const dy = j - R;
          const a = Math.atan2(dy, dx);
          const lick = 1 + 0.2 * Math.sin(a * 5 + ms * 0.013) + 0.13 * Math.sin(a * 9 - ms * 0.021) + 0.3 * Math.max(0, -dy / R) * (0.6 + 0.4 * Math.sin(dx * 1.7 + ms * 0.03));
          const k = Math.hypot(dx, dy) / (r * lick);
          if (k > 1) continue;
          const c = FIRE[Math.min(5, Math.floor(k * 4.6 + 0.6 * Math.sin(i * 12.9898 + j * 78.233 + Math.floor(ms / 60)) ** 2))];
          img.data.set([c[0], c[1], c[2], 255], (j * n + i) * 4);
        }
      f.putImageData(img, 0, 0);
      const s = P * zoom;
      glow(x, y, r * s * 2.4, 0.45);
      ctx.drawImage(fire, 0, 0, n, n, Math.round(x - (R + 0.5) * s), Math.round(y - (R + 0.5) * s), n * s, n * s);
    };
    const glow = (x: number, y: number, radius: number, alpha: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(255,170,60,${alpha})`);
      g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = 'source-over';
    };
    const sparks: Spark[] = [];
    const spark = (x: number, y: number, speed: number, up: number, life: number, size: number) => {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * speed * dpr;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * dpr, age: 0, life, size, c: FIRE[Math.floor(rand(0, 5))] });
    };
    // the glass: cracks out from where it hit and rings across them, a hole, shards falling
    let cracks: { pts: number[]; from: number }[] = [];
    let hole: number[] = [];
    let reach = 1;
    const shards: Shard[] = [];
    const shatter = (ix: number, iy: number) => {
      reach = Math.hypot(Math.max(ix, W - ix), Math.max(iy, H - iy));
      const rays: number[][] = [];
      const N = 15;
      for (let i = 0; i < N; i++) {
        let a = ((i + rand(0, 0.6)) / N) * Math.PI * 2;
        let [x, y, d] = [ix, iy, 0];
        const pts = [x, y];
        while (d < reach) {
          const step = rand(22, 75) * dpr;
          a += rand(-0.22, 0.22);
          [x, y, d] = [x + Math.cos(a) * step, y + Math.sin(a) * step, d + step];
          pts.push(x, y);
        }
        rays.push(pts);
        cracks.push({ pts, from: 0 });
      }
      const along = (pts: number[], dist: number) => {
        for (let i = 2, d = 0; i < pts.length; i += 2) {
          const step = Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
          if (d + step >= dist) {
            const k = (dist - d) / step;
            return [pts[i - 2] + (pts[i] - pts[i - 2]) * k, pts[i - 1] + (pts[i + 1] - pts[i - 1]) * k];
          }
          d += step;
        }
        return pts.slice(-2);
      };
      for (const r of [0.06, 0.13, 0.24, 0.4, 0.62].map((k) => k * reach))
        for (let i = 0; i < N; i++) {
          if (Math.random() < 0.3) continue;
          const [p, q] = [along(rays[i], r * rand(0.85, 1.15)), along(rays[(i + 1) % N], r * rand(0.85, 1.15))];
          cracks.push({ pts: [p[0], p[1], (p[0] + q[0]) / 2 + rand(-12, 12) * dpr, (p[1] + q[1]) / 2 + rand(-12, 12) * dpr, q[0], q[1]], from: r });
        }
      hole = Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + rand(-0.2, 0.2);
        const r = rand(14, 30) * dpr;
        return [ix + Math.cos(a) * r, iy + Math.sin(a) * r];
      }).flat();
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = rand(0.12, 0.6) * dpr;
        const s = rand(6, 18) * dpr;
        shards.push({ x: ix, y: iy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.25 * dpr, turn: 0, spin: rand(-0.02, 0.02), pts: [0, -s, s * rand(0.4, 0.9), s * rand(0.2, 0.8), -s * rand(0.4, 0.9), s * rand(0.3, 0.7)] });
      }
      for (let i = 0; i < 90; i++) spark(ix, iy, 1.4, 0, rand(300, 750), P * rand(1, 3.5));
    };
    const strokeCracks = (grown: number, dx: number, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const c of cracks) {
        if (c.from > grown) continue;
        ctx.moveTo(c.pts[0] + dx, c.pts[1]);
        for (let i = 2, d = c.from; i < c.pts.length && d < grown; i += 2) {
          d += Math.hypot(c.pts[i] - c.pts[i - 2], c.pts[i + 1] - c.pts[i - 1]);
          ctx.lineTo(c.pts[i] + dx, c.pts[i + 1]);
        }
      }
      ctx.stroke();
    };
    const HIT = 2950;
    const strips = Array.from({ length: 20 }, (_, i) => i).sort(() => Math.random() - 0.5);
    let glitch = { at: -1, split: 0, slices: [] as number[][] };
    let prev = 0;
    const throwing = (ms: number, dt: number) => {
      if (veil.current) veil.current.style.opacity = String(clamp01(ms / 350));
      const cx = W / 2;
      let { x, f, bob } = walkIn(ms);
      let hands = [1, -34]; // where the fire is, from his anchor, his pixels
      if (ms >= 1150 && ms < 1500) {
        f = Math.floor(ms / 140) % 2 ? 'angry1' : 'angry0';
        x = cx + (Math.floor(ms / 50) % 2) * P;
      } else if (ms >= 1500 && ms < 2500) {
        f = Math.floor(ms / 80) % 2 ? 'charge1' : 'charge0';
        x = cx + (ms > 2100 ? (Math.floor(ms / 40) % 2) * P : 0);
      } else if (ms >= 2500) {
        f = 'push';
        hands = [1, -60];
      }
      draw(f, x, feet() - bob);
      // gathering it, between his hands
      if (ms >= 1500 && ms < 2500) {
        const r = 2 + 7 * ease(clamp01((ms - 1500) / 900));
        const [fx, fy] = [x + hands[0] * P, feet() + hands[1] * P];
        ball(fx, fy, r, 1, ms);
        if (Math.random() < 0.5) spark(fx + rand(-r, r) * P, fy, 0.05, 0.12, rand(300, 600), P);
      }
      // thrown: from between his palms at the screen, speeding up, getting bigger
      const [ix, iy] = [W / 2, H * 0.42];
      if (ms >= 2500 && ms < HIT) {
        const k = clamp01((ms - 2500) / (HIT - 2500)) ** 2.2;
        const [sx, sy] = [cx + hands[0] * P, feet() + hands[1] * P];
        const zoom = 1 + ((0.62 * Math.min(W, H)) / (9 * P) - 1) * k;
        const [bx, by] = [sx + (ix - sx) * k, sy + (iy - sy) * k];
        ball(bx, by, 9, zoom, ms);
        for (let i = 0; i < 3; i++) spark(bx + rand(-9, 9) * P * zoom * 0.5, by + rand(-9, 9) * P * zoom * 0.5, 0.25, 0, rand(200, 400), P * zoom * 0.35);
      }
      if (ms >= HIT && !cracks.length) shatter(ix, iy);
      // the sparks, and the glass
      for (const s of sparks) {
        s.age += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.0009 * dpr * dt;
        const k = 1 - s.age / s.life;
        if (k <= 0) continue;
        ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${k.toFixed(2)})`;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.ceil(s.size * k), Math.ceil(s.size * k));
      }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].age > sparks[i].life) sparks.splice(i, 1);
      if (ms >= HIT) {
        const since = ms - HIT;
        if (flash.current) flash.current.style.opacity = String(Math.max(0, 0.85 - since / 260));
        const shake = 16 * (1 - clamp01(since / 600));
        el.style.transform = shake > 0 ? `translate(${rand(-shake, shake).toFixed(1)}px, ${rand(-shake, shake).toFixed(1)}px)` : '';
        const grown = ease(clamp01(since / 220)) * reach;
        // glitching: every 70 ms the picture tears somewhere else
        const wrong = ms > HIT + 200;
        if (wrong && ms - glitch.at > 70) {
          glitch = {
            at: ms,
            split: rand(2, 10) * dpr,
            slices: Array.from({ length: Math.floor(rand(3, 7)) }, () => [rand(0, H), rand(4, 60) * dpr, rand(-60, 60) * dpr]),
          };
          for (const b of Array.from(bands.current?.children ?? []) as HTMLElement[]) {
            const on = Math.random() < 0.55;
            b.style.display = on ? 'block' : 'none';
            if (!on) continue;
            b.style.top = `${rand(0, 100).toFixed(1)}%`;
            b.style.height = `${rand(4, 56).toFixed(0)}px`;
            b.style.transform = `translateX(${rand(-30, 30).toFixed(0)}px)`;
          }
        }
        ctx.beginPath();
        for (let i = 0; i < hole.length; i += 2) ctx.lineTo(hole[i], hole[i + 1]);
        ctx.closePath();
        ctx.fillStyle = 'rgba(8,8,12,0.9)';
        ctx.fill();
        strokeCracks(grown, 0, 'rgba(0,0,0,0.5)', 3.2 * dpr);
        strokeCracks(grown, 0, 'rgba(240,248,255,0.92)', 1.2 * dpr);
        if (wrong) {
          ctx.globalCompositeOperation = 'lighter';
          strokeCracks(grown, -glitch.split, 'rgba(255,40,80,0.8)', 1.4 * dpr);
          strokeCracks(grown, glitch.split, 'rgba(0,230,255,0.8)', 1.4 * dpr);
          ctx.globalCompositeOperation = 'source-over';
        }
        for (const s of shards) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 0.0016 * dpr * dt;
          s.turn += s.spin * dt;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.turn);
          ctx.beginPath();
          ctx.moveTo(s.pts[0], s.pts[1]);
          ctx.lineTo(s.pts[2], s.pts[3]);
          ctx.lineTo(s.pts[4], s.pts[5]);
          ctx.closePath();
          ctx.fillStyle = 'rgba(210,230,255,0.25)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)';
          ctx.lineWidth = dpr;
          ctx.stroke();
          ctx.restore();
        }
        if (wrong) {
          // torn: bands of it shifted sideways, snow here and there
          for (const [y, h, dx] of glitch.slices) ctx.drawImage(el, 0, y, W, h, dx, y, W, h);
          for (let i = 0; i < 160; i++) {
            ctx.fillStyle = `rgba(255,255,255,${rand(0.1, 0.6).toFixed(2)})`;
            ctx.fillRect(rand(0, W), rand(0, H), rand(1, 4) * dpr, dpr);
          }
          // and the screen dies, band by band
          const dead = Math.floor(strips.length * clamp01((ms - 3350) / 450));
          ctx.fillStyle = '#000';
          for (const s of strips.slice(0, dead)) ctx.fillRect(0, (s * H) / strips.length, W, H / strips.length + 1);
        }
      }
      return ms > 3820;
    };

    let raf = 0;
    let over = false;
    const tick = (now: number) => {
      const ms = now - start;
      const dt = Math.min(50, now - (prev || now));
      prev = now;
      ctx.clearRect(0, 0, W, H);
      const done = peek ? peeking(ms) : stage === 3 ? throwing(ms, dt) : talk(ms);
      if (done && !over) {
        over = true;
        onDone();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }, [stage, peek, text, onLeave, onDone]);

  return (
    <div className={`fixed inset-0 z-[200] select-none overflow-hidden ${peek ? 'pointer-events-none' : 'touch-none'}`} onClick={() => tap.current()}>
      {!peek && (
        <div
          ref={veil}
          className="absolute inset-0 opacity-0"
          style={{
            background: stage === 3 ? 'rgb(4 6 14 / 0.55)' : 'rgb(4 6 14 / 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />
      )}
      {stage === 3 && (
        <div ref={bands} aria-hidden className="absolute inset-0">
          {GLITCH.map((filter) => (
            <div key={filter} className="absolute inset-x-0 hidden" style={{ backdropFilter: filter, WebkitBackdropFilter: filter }} />
          ))}
        </div>
      )}
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
      {text && (
        <div ref={bubble} role="status" className="absolute left-0 top-0 opacity-0" style={{ transformOrigin: peek ? '0 50%' : '50% 100%' }}>
          <div
            className={`relative bg-white text-[#111014] ${peek ? 'px-2 py-1 text-5xl leading-none' : 'w-max max-w-[min(340px,calc(100vw-40px))] px-4 py-3 text-xl leading-[1.3]'}`}
            style={{ fontFamily: 'Tiny5, var(--font), sans-serif', boxShadow: `0 -${DOT}px ${INK}, 0 ${DOT}px ${INK}, -${DOT}px 0 ${INK}, ${DOT}px 0 ${INK}` }}
          >
            <span className="sr-only">{text}</span>
            <span aria-hidden>
              <span ref={shown} />
              <span ref={unsaid} className="invisible" />
            </span>
            {!peek && (
              <svg ref={more} aria-hidden width={10} height={6} shapeRendering="crispEdges" className="absolute bottom-1.5 right-2 opacity-0">
                <path d="M0 0h10v2H8v2H6v2H4V4H2V2H0z" fill={INK} />
              </svg>
            )}
            <Tail side={peek ? 'left' : 'down'} />
          </div>
        </div>
      )}
      {stage === 3 && <div ref={flash} className="absolute inset-0 bg-white opacity-0" />}
    </div>
  );
}

// What the fireball leaves: black, who he is, the contact button (to the contact section) and a way back to the page.
function Finale({ onRelease, onClose }: { onRelease: () => void; onClose: () => void }) {
  const [out, setOut] = useState(false);
  const close = (contact: boolean) => (e: MouseEvent) => {
    e.preventDefault();
    onRelease();
    if (contact) jump(() => document.getElementById('contact')?.scrollIntoView());
    setOut(true);
    window.setTimeout(onClose, 500);
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.egg.name}
      className={`fixed inset-0 z-[210] flex touch-none flex-col items-center justify-center gap-10 bg-black px-8 text-center transition-opacity duration-500 ${out ? 'opacity-0' : ''}`}
    >
      <p className="egg-glitch max-w-xl text-balance text-3xl font-medium leading-tight text-[#D7E2EA] sm:text-5xl">
        {t.egg.name.split(/(\S+-\S+)/).map((part, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part))}
      </p>
      <div className="[animation:fade-in_0.6s_ease-out_1.1s_both]" onClick={close(true)}>
        <ContactButton />
      </div>
      <button type="button" onClick={close(false)} className="text-sm tracking-wide text-[#D7E2EA]/45 [animation:fade-in_0.6s_ease-out_1.9s_both]">
        {t.egg.back}
      </button>
    </div>
  );
}
