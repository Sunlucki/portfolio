import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n';
import { DOT, INK, Tail } from './SwipeEgg';

// Messi, the cat from the office game, and the pixel me, in one strip (the game's frames and new ones drawn from its
// art): each frame's x, width and height in it, then its anchor: the cat's middle, or the middle of my head, over the bottom
const SHEET = '/egg/cat.png';
const FRAMES = {
  sit: [0, 20, 25, 10, 24],
  blink: [21, 20, 25, 10, 24],
  crouch: [42, 32, 22, 16, 21],
  push: [75, 32, 31, 16, 30],
  air: [108, 46, 25, 23, 24],
  land: [155, 29, 31, 14, 30],
  stand: [185, 51, 104, 25, 103],
  wink: [237, 51, 104, 25, 103],
  front: [289, 51, 109, 25, 108],
  ask: [341, 55, 104, 24, 103],
  search: [397, 54, 96, 22, 95],
  hold: [452, 51, 121, 25, 120],
} as const;
type Frame = keyof typeof FRAMES;
type Scene = 'leap' | 'owner';
const SHUT_MS = 380; // a folder closing: its notes back in
const PEEK = 68; // how much of me shows over a folder's edge, his pixels (my head and shoulders)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);
const pop = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2; // out, a little past and back
const pause = (c: string) => /[.,!?…]/.test(c);

/**
 * The Stack's Easter egg, a nod to Schrödinger. Close the first folder (a tap, a click) and once its notes are back in,
 * Messi, the cat from the office game, peeks out of it and leaps into the second. Close that one and the pixel me peeks
 * out, looks about, then at you: have you seen my cat? Seen: OK, see you. Not seen: I dive into the folder and come
 * back up with him in my hands: here's my cat, his name is Messi. Only on the visitor's own clicks, once a visit.
 */
export function CatEgg() {
  const [scene, setScene] = useState<Scene | null>(null);
  const next = useRef<Scene | 'done'>('leap');
  useEffect(() => {
    const stack = document.getElementById('stack');
    if (!stack) return;
    const clicked = (e: MouseEvent) => {
      const want = next.current;
      if (!e.isTrusted || want === 'done' || !(e.target instanceof Element)) return;
      const folder = e.target.closest('.folder-float__trigger')?.closest('.folder-float');
      if (!folder || [...stack.querySelectorAll('.folder-float')].indexOf(folder) !== (want === 'leap' ? 0 : 1)) return;
      // (once the folder has taken the click: only if it closed)
      requestAnimationFrame(() => {
        if (folder.hasAttribute('data-open') || next.current !== want) return;
        next.current = 'done'; // (till this one is over)
        setScene(want);
      });
    };
    stack.addEventListener('click', clicked);
    return () => stack.removeEventListener('click', clicked);
  }, []);
  const done = useCallback(() => {
    next.current = scene === 'leap' ? 'owner' : 'done';
    setScene(null);
  }, [scene]);
  return scene && createPortal(<Play scene={scene} onDone={done} />, document.body);
}

function Play({ scene, onDone }: { scene: Scene; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const shown = useRef<HTMLSpanElement>(null);
  const unsaid = useRef<HTMLSpanElement>(null);
  const answers = useRef<HTMLDivElement>(null);
  const answer = useRef<'yes' | 'no' | null>(null);

  useEffect(() => {
    const folders = [...document.querySelectorAll<HTMLElement>('#stack .folder-float')];
    const el = canvas.current;
    if (folders.length < 2 || !el) return onDone();
    const ctx = el.getContext('2d')!;
    const sheet = new Image();
    sheet.src = SHEET;
    let dpr = 1;
    let W = 0;
    let H = 0;
    let P = 2; // device px to a pixel of ours
    let px = 1; // CSS px to one
    const size = () => {
      dpr = Math.min(3, window.devicePixelRatio || 1);
      [W, H] = [Math.round(el.clientWidth * dpr), Math.round(el.clientHeight * dpr)];
      [el.width, el.height] = [W, H];
      ctx.imageSmoothingEnabled = false;
      P = Math.max(2, Math.round(2 * dpr)); // (two CSS px)
      px = P / dpr;
    };
    size();
    window.addEventListener('resize', size);

    // a folder's front as it is now (the page, or the row of folders, may have moved): what's below its edge is inside
    type Box = { cx: number; top: number; left: number; right: number };
    const box = (i: number): Box => {
      const r = folders[i].querySelector('.folder-float__front')!.getBoundingClientRect();
      return { cx: (r.left + r.right) / 2, top: r.top, left: r.left, right: r.right };
    };
    // frame f with its anchor at (x, y), CSS px; what's inside the folders `hide` unseen
    const draw = (f: Frame, x: number, y: number, hide: Box[], flip = false) => {
      if (!sheet.complete || !sheet.naturalWidth) return;
      const [fx, w, h, ax, ay] = FRAMES[f];
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      for (const b of hide) ctx.rect(b.left * dpr, b.top * dpr, (b.right - b.left) * dpr, H);
      ctx.clip('evenodd');
      ctx.translate(Math.round(x * dpr), Math.round(y * dpr));
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(sheet, fx, 0, w, h, -ax * P, -(ay + 1) * P, w * P, h * P);
      ctx.restore();
    };
    // where frame f's anchor goes for `n` of its pixels (from its top) to show over folder b's edge
    const rise = (f: Frame, b: Box, n: number) => b.top + (FRAMES[f][4] + 1 - n) * px;
    const wiggle = (i: number) =>
      folders[i].querySelector('.folder-float__folder')?.animate(
        [{ transform: 'none' }, { transform: 'translateY(-5px) rotate(-2.5deg)' }, { transform: 'translateY(1px) rotate(2deg)' }, { transform: 'none' }],
        { duration: 420, easing: 'ease-out' },
      );

    // the bubble: over my head (`top`, CSS px) at folder b, typing `text` since `from`
    let text = '';
    let from = 0;
    const words = (next: string, now: number) => {
      text = next;
      from = now;
    };
    const typed = (now: number) => {
      const chars = Array.from(text);
      let n = 0;
      for (let at = 0; n < chars.length && at <= now - from; n++) at += pause(chars[n]) ? 200 : 34;
      if (shown.current) shown.current.textContent = chars.slice(0, n).join('');
      if (unsaid.current) unsaid.current.textContent = chars.slice(n).join('');
      return { n, all: n >= chars.length, talking: n > 0 && n < chars.length && !pause(chars[n - 1]) };
    };
    const place = (b: Box, top: number, k: number) => {
      const node = bubble.current;
      if (!node) return;
      const left = Math.min(window.innerWidth - node.offsetWidth - 12, Math.max(12, b.cx - node.offsetWidth / 2));
      node.style.opacity = k > 0.01 ? '1' : '0';
      node.style.pointerEvents = k > 0.5 ? 'auto' : 'none';
      node.style.transformOrigin = `${(b.cx - left).toFixed(0)}px 100%`;
      node.style.transform = `translate(${left.toFixed(1)}px, ${(top - node.offsetHeight - 4 * DOT - 4).toFixed(1)}px) scale(${Math.max(0, k).toFixed(3)})`;
      const tail = node.querySelector<SVGElement>('svg');
      if (tail) tail.style.left = `${(b.cx - left).toFixed(0)}px`;
    };

    const lines = t.cat;

    // ---- the cat: out of the first folder, a look round, over into the second
    let landed = false;
    const leap = (ms: number) => {
      const [a, b] = [box(0), box(1)];
      const at = ms - SHUT_MS; // (since the folder's click)
      if (at < 0) return false;
      if (at < 1300) {
        const n = 19 * pop(clamp01(at / 400));
        draw(at > 800 && at < 950 ? 'blink' : 'sit', a.cx, rise('sit', a, n), [a, b]);
      } else if (at < 1550) draw('crouch', a.cx, rise('crouch', a, 20), [a, b]);
      else if (at < 2250) {
        const k = (at - 1550) / 700;
        const [y0, y1] = [rise('crouch', a, 20), b.top + 36 * px];
        const arc = 60 + 0.3 * Math.abs(b.cx - a.cx);
        draw(k < 0.18 ? 'push' : k < 0.8 ? 'air' : 'land', a.cx + (b.cx - a.cx) * k, y0 + (y1 - y0) * k - arc * 4 * k * (1 - k), [a, b], b.cx < a.cx);
      } else if (!landed) {
        landed = true;
        wiggle(1);
        // (on phones, the row of folders brings the second one to the middle: it opens, as if he'd knocked it)
        const slide = folders[1].closest('.snap-center');
        const row = slide?.parentElement;
        if (slide && row) {
          const [s, r] = [slide.getBoundingClientRect(), row.getBoundingClientRect()];
          row.scrollBy({ left: s.left + s.width / 2 - (r.left + r.width / 2), behavior: 'smooth' });
        }
      }
      return at > 2700;
    };

    // ---- me: out of the second folder, a look round, the question; then goodbye, or down for him and up with him
    let phase: 'shut' | 'rise' | 'look' | 'ask' | 'bye' | 'dive' | 'search' | 'found' | 'sink' = 'shut';
    let since = 0;
    let peeked = PEEK; // how much of me showed, sinking from there
    let sinkFrame: Frame = 'front';
    let shaken = false;
    const go = (p: typeof phase, now: number) => {
      phase = p;
      since = now;
    };
    const owner = (ms: number) => {
      const b = box(1);
      const at = ms - since;
      let frame: Frame = 'front';
      let n = PEEK;
      let flip = false;
      let k = 0; // the bubble
      if (phase === 'shut') {
        if (ms > SHUT_MS) go('rise', ms);
        return false;
      }
      if (phase === 'rise') {
        frame = 'stand';
        n = PEEK * pop(clamp01(at / 520));
        if (at > 620) go('look', ms);
      } else if (phase === 'look') {
        [frame, flip] = at < 550 ? ['search', false] : at < 1100 ? ['search', true] : at < 1350 ? ['stand', false] : ['front', false];
        if (at > 1650) {
          go('ask', ms);
          words(lines.ask, ms + 220);
        }
      } else if (phase === 'ask' || phase === 'bye') {
        k = pop(clamp01(at / 240));
        const said = typed(ms);
        frame = said.talking && Math.floor(ms / 150) % 2 ? 'ask' : 'front';
        if (phase === 'ask') {
          // (no answer for long: as if seen)
          const picked = answer.current ?? (at > 25000 ? 'yes' : null);
          if (answers.current) answers.current.style.display = said.all && !picked ? 'flex' : 'none';
          if (picked === 'yes') {
            go('bye', ms - 240); // (the bubble already out)
            words(lines.bye, ms);
          } else if (picked === 'no') go('dive', ms);
        } else if (said.all && ms - from > Array.from(text).length * 34 + 1600) {
          [peeked, sinkFrame] = [PEEK, 'front'];
          go('sink', ms);
        }
      } else if (phase === 'dive') {
        frame = 'stand';
        n = PEEK * (1 - ease(clamp01(at / 320)));
        k = 1 - clamp01(at / 160);
        if (at > 320) {
          go('search', ms);
          wiggle(1);
        }
      } else if (phase === 'search') {
        n = 0;
        if (at > 500 && !shaken) {
          shaken = true;
          wiggle(1);
        }
        if (at > 1000) {
          go('found', ms);
          words(lines.found, ms + 700);
        }
      } else if (phase === 'found') {
        frame = 'hold';
        n = 100 * pop(clamp01(at / 520));
        k = at > 600 ? pop(clamp01((at - 600) / 240)) : 0;
        const said = typed(ms);
        if (said.all && ms - from > Array.from(text).length * 34 + 2800) {
          [peeked, sinkFrame] = [100, 'hold'];
          go('sink', ms);
        }
      } else if (phase === 'sink') {
        frame = sinkFrame;
        n = peeked * (1 - ease(clamp01(at / 480)));
        k = 1 - clamp01(at / 180);
        if (at > 520) return true;
      }
      if (n > 2) draw(frame, b.cx, rise(frame, b, n), [b], flip);
      place(b, b.top - n * px, k);
      return false;
    };

    // the second folder stays shut while I'm in it: no hover, no taps, not even the row of folders' own
    const held = scene === 'owner' ? folders[1] : null;
    const shut = (e: Event) => e.stopPropagation();
    if (held) {
      held.style.pointerEvents = 'none';
      held.addEventListener('click', shut, true);
    }

    const start = performance.now();
    let raf = 0;
    let over = false;
    const tick = (now: number) => {
      const ms = now - start;
      ctx.clearRect(0, 0, W, H);
      const end = scene === 'leap' ? leap(ms) : owner(ms);
      if (end && !over) {
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
      if (held) {
        held.style.pointerEvents = '';
        held.removeEventListener('click', shut, true);
      }
    };
  }, [scene, onDone]);

  const pick = (to: 'yes' | 'no') => () => {
    answer.current = to;
    if (answers.current) answers.current.style.display = 'none';
  };
  const edge = (d: number) => ({ boxShadow: `0 -${d}px ${INK}, 0 ${d}px ${INK}, -${d}px 0 ${INK}, ${d}px 0 ${INK}` });
  return (
    <>
      <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />
      {scene === 'owner' && (
        <div ref={bubble} className="fixed left-0 top-0 z-[71] opacity-0">
          <div className="relative w-max max-w-[min(300px,calc(100vw-40px))] bg-white px-4 py-3 text-[17px] font-semibold leading-snug text-[#111014]" style={edge(DOT)}>
            <span role="status">
              <span ref={shown} />
              <span ref={unsaid} className="invisible" />
            </span>
            <div ref={answers} className="mt-3 hidden gap-3">
              <button type="button" onClick={pick('no')} className="bg-white px-3 py-1.5 text-[15px] text-[#111014] hover:bg-[#111014] hover:text-white active:bg-[#111014] active:text-white" style={edge(2)}>
                {t.cat.no}
              </button>
              <button type="button" onClick={pick('yes')} className="bg-white px-3 py-1.5 text-[15px] text-[#111014] hover:bg-[#111014] hover:text-white active:bg-[#111014] active:text-white" style={edge(2)}>
                {t.cat.yes}
              </button>
            </div>
            <Tail side="down" />
          </div>
        </div>
      )}
    </>
  );
}
