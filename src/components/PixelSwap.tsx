import { useEffect, useRef } from 'react';

type Picture = { src: string; width: number; height: number };

// Pictures in one place, one at a time (Black Point's T-shirts), each changing into the next as its pixels shift: bands
// of rows of square cells slide sideways by whole cells, furthest at the middle of the change, and each cell turns into
// the next picture at its own moment. A change every few seconds while it is on screen, or at once on a tap; with
// reduced motion only on a tap, and outright.
const ACROSS = 40; // cells across
const CHANGE = 900; // ms
const EVERY = 3200; // ms from one change to the next
const SHIFT = 6; // cells a band slides at most

export function PixelSwap({ pictures, label, className = '' }: { pictures: Picture[]; label: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const tap = useRef(() => {});
  const srcs = pictures.map((p) => p.src).join(' ');
  useEffect(() => {
    const el = canvas.current!;
    const g = el.getContext('2d')!;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const images = srcs.split(' ').map((src) => Object.assign(new Image(), { src }));
    const loaded = (i: number) => images[i].complete && images[i].naturalWidth > 0;
    // (a picture drawn at the canvas's size, so each cell is a plain copy)
    const flat = (i: number) => {
      const c = Object.assign(document.createElement('canvas'), { width: el.width, height: el.height });
      c.getContext('2d')!.drawImage(images[i], 0, 0, c.width, c.height);
      return c;
    };
    let shown = 0;
    let change: { to: number; at: number; bands: number[]; turns: number[]; from: HTMLCanvasElement; into: HTMLCanvasElement } | null = null;
    let seen = false;
    let frame = 0;
    let timer = 0;
    const draw = (now: number) => {
      const [w, h] = [el.width, el.height];
      if (!w || !loaded(shown)) return;
      if (!change) {
        g.drawImage(images[shown], 0, 0, w, h);
        return;
      }
      const p = Math.min(1, (now - change.at) / CHANGE);
      const cell = w / ACROSS;
      const strength = Math.sin(Math.PI * p);
      for (let r = 0; r * cell < h; r++) {
        const y = r * cell;
        const tall = Math.min(cell, h - y);
        const slide = Math.round(change.bands[r] * strength * SHIFT); // (whole cells)
        for (let c = 0; c < ACROSS; c++) {
          const from = (((c - slide) % ACROSS) + ACROSS) % ACROSS;
          g.drawImage(p > change.turns[r * ACROSS + c] ? change.into : change.from, from * cell, y, cell, tall, c * cell, y, cell + 1, tall);
        }
      }
      if (p >= 1) {
        shown = change.to;
        change = null;
        draw(now);
        wait();
      }
    };
    const go = () => {
      window.clearTimeout(timer);
      if (change || images.length < 2) return;
      const to = (shown + 1) % images.length;
      if (!loaded(shown) || !loaded(to)) {
        timer = window.setTimeout(go, 400);
        return;
      }
      if (still) {
        shown = to;
        draw(performance.now());
        return;
      }
      const rows = Math.ceil(el.height / (el.width / ACROSS));
      const bands: number[] = [];
      while (bands.length < rows) {
        const slide = Math.random() < 0.4 ? 0 : Math.random() * 2 - 1;
        for (let n = 1 + Math.floor(Math.random() * 4); n > 0; n--) bands.push(slide);
      }
      const turns = Array.from({ length: rows * ACROSS }, () => 0.25 + Math.random() * 0.5);
      change = { to, at: performance.now(), bands, turns, from: flat(shown), into: flat(to) };
      const tick = (now: number) => {
        draw(now);
        frame = change ? requestAnimationFrame(tick) : 0;
      };
      frame = requestAnimationFrame(tick);
    };
    const wait = () => {
      window.clearTimeout(timer);
      if (seen && !still) timer = window.setTimeout(go, EVERY);
    };
    tap.current = go;
    images[0].onload = () => draw(performance.now());
    const sized = new ResizeObserver(() => {
      const width = Math.min(1600, Math.round(el.clientWidth * Math.min(2, devicePixelRatio || 1)));
      if (!width || width === el.width) return;
      el.width = width;
      el.height = Math.round(el.clientHeight * (width / el.clientWidth));
      if (change) {
        [shown, change] = [change.to, null]; // (its cells were cut for the old size)
        wait();
      }
      draw(performance.now());
    });
    sized.observe(el);
    const view = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      if (seen && !change) wait();
      if (!seen) window.clearTimeout(timer);
    });
    view.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      sized.disconnect();
      view.disconnect();
    };
  }, [srcs]);
  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      onClick={() => tap.current()}
      className={className}
      style={{ aspectRatio: `${pictures[0].width} / ${pictures[0].height}` }}
    />
  );
}
