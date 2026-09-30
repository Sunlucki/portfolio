import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';

// The Video section's player on touch screens: a film's card opens into it, full screen, with the music stage's
// particles as its play button and its timeline (three/MusicStage.tsx draws them in WebGL; these are the same dots
// in 2D, glowing, added together).

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => x * x * (3 - 2 * x);

// A soft round dot in a colour, bright at its middle: the stage's exp(-r² · 3.5).
const dots = new Map<string, HTMLCanvasElement>();
function dot(r: number, g: number, b: number) {
  const key = `${r},${g},${b}`;
  let sprite = dots.get(key);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const ctx = sprite.getContext('2d')!;
    const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    for (let i = 0; i <= 8; i++) glow.addColorStop(i / 8, `rgba(${r}, ${g}, ${b}, ${Math.exp(-((i / 8) ** 2) * 3.5) * (1 - i / 8)})`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 32);
    dots.set(key, sprite);
  }
  return sprite;
}
// the stage's palette: deep blue, cyan, violet
const PALETTE = [
  [26, 71, 255],
  [51, 140, 255],
  [77, 199, 255],
  [110, 150, 255],
  [140, 92, 255],
] as const;

// A canvas the size of its box, at the screen's pixel density, drawn every frame by `draw` while `running` says so.
function useCanvas(draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => boolean, deps: unknown[]) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d')!;
    let frame = 0;
    const tick = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const [w, h] = [el.clientWidth, el.clientHeight];
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      if (draw(ctx, w, h, now / 1000)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return canvas;
}

// PLAY, as the music floor draws it: a triangle pointing right, a quarter of its points on its edges, in a ring.
const TRIANGLE = [
  [-0.52, 0.72],
  [-0.52, -0.72],
  [1.05, 0],
];
type Grain = { tx: number; ty: number; sx: number; sy: number; delay: number; seed: number; tone: number; size: number };
function grains(count: number): Grain[] {
  return Array.from({ length: count }, (_, i) => {
    let [x, y] = [0, 0];
    if (i < count * 0.28) {
      // the ring
      const a = (i / (count * 0.28)) * Math.PI * 2;
      [x, y] = [Math.cos(a) * 1.55, Math.sin(a) * 1.55];
    } else if (Math.random() < 0.3) {
      const side = Math.floor(Math.random() * 3);
      const [a, b] = [TRIANGLE[side], TRIANGLE[(side + 1) % 3]];
      const k = Math.random();
      [x, y] = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    } else {
      let [a, b] = [Math.random(), Math.random()];
      if (a + b > 1) [a, b] = [1 - a, 1 - b];
      const [p, q, r] = TRIANGLE;
      [x, y] = [p[0] + a * (q[0] - p[0]) + b * (r[0] - p[0]), p[1] + a * (q[1] - p[1]) + b * (r[1] - p[1])];
    }
    const from = Math.random() * Math.PI * 2;
    const far = 2.4 + Math.random() * 1.6;
    return {
      tx: x + (Math.random() - 0.5) * 0.05,
      ty: y + (Math.random() - 0.5) * 0.05,
      sx: Math.cos(from) * far,
      sy: Math.sin(from) * far,
      delay: Math.random(),
      seed: Math.random(),
      tone: Math.min(PALETTE.length - 1, Math.floor(((x + 1.6) / 3.2) * PALETTE.length)),
      size: 0.7 + Math.random() * 0.8,
    };
  });
}

// The play button: particles fly in from all round and gather into PLAY while `on`, breathing, over a soft shade that
// keeps them clear on a bright picture; off, they fly apart and fade. `scale` is the triangle's half-height in pixels.
export function ParticlePlay({ on, scale = 36, className = '' }: { on: boolean; scale?: number; className?: string }) {
  const [points] = useState(() => grains(still ? 180 : 320));
  const state = useRef({ phase: 0, last: 0, on });
  useEffect(() => {
    state.current.on = on;
  }, [on]);
  const canvas = useCanvas(
    (ctx, w, h, time) => {
      const s = state.current;
      const dt = s.last ? Math.min(0.05, time - s.last) : 0;
      s.last = time;
      s.phase = clamp01(s.phase + (s.on ? dt / 0.9 : -dt / 0.5));
      if (still) s.phase = s.on ? 1 : 0;
      const breathe = 1 + 0.035 * Math.sin(time * 2.2);
      const shade = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, scale * 2.6);
      shade.addColorStop(0, `rgba(3, 7, 20, ${0.5 * ease(s.phase)})`);
      shade.addColorStop(1, 'rgba(3, 7, 20, 0)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of points) {
        const k = ease(clamp01((s.phase - p.delay * 0.35) / 0.65));
        if (k <= 0) continue;
        const wobble = Math.sin(time * 1.7 + p.seed * 20) * 0.03;
        const x = w / 2 + (p.sx + (p.tx * breathe - p.sx) * k + wobble) * scale;
        const y = h / 2 + (p.sy + (p.ty * breathe - p.sy) * k + Math.cos(time * 1.3 + p.seed * 17) * 0.03) * scale;
        const [r, g, b] = PALETTE[p.tone];
        const size = (6 + 5 * p.size) * (0.6 + 0.4 * k);
        ctx.globalAlpha = k * (0.7 + 0.3 * Math.sin(time * 3 + p.seed * 9) ** 2);
        ctx.drawImage(dot(r, g, b), x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      return s.on || s.phase > 0;
    },
    [on, points, scale],
  );
  return <canvas ref={canvas} aria-hidden className={`pointer-events-none ${className}`} />;
}

// The timeline: a line of particles across, lit as far as the film has played, the front of the fill glowing, as
// the music stage's rim; touch or drag it to go to that point.
function Timeline({ progress, playing, onSeek }: { progress: () => number; playing: boolean; onSeek: (at: number) => void }) {
  const [seeds] = useState(() => Array.from({ length: 420 }, () => [Math.random(), Math.random()]));
  const canvas = useCanvas(
    (ctx, w, h, time) => {
      const at = clamp01(progress());
      const count = Math.min(seeds.length, Math.round(w / 1.1));
      for (let i = 0; i < count; i++) {
        const a = i / count;
        const [seed, seed2] = seeds[i];
        const lit = clamp01((at - a) * 300);
        const head = at > 0 ? Math.exp(-(((a - at) * 40) ** 2)) : 0;
        const wave = Math.sin(a * 50 + time * 3) * (playing ? 1.6 : 0.5);
        const x = 8 + a * (w - 16);
        const y = h / 2 + (seed - 0.5) * 6 + wave * lit;
        const size = 5 + 4 * lit + 7 * head + seed2 * 2;
        const [r, g, b] = head > 0.3 ? [140, 200, 255] : lit ? [102, 199, 255] : [51, 92, 230];
        ctx.globalAlpha = Math.min(1, (lit ? 1 : 0.4) + 0.6 * head);
        ctx.drawImage(dot(r, g, b), x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      return true;
    },
    [seeds, playing],
  );
  const seek = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    onSeek(clamp01((e.clientX - box.left - 8) / (box.width - 16)));
  };
  return (
    <canvas
      ref={canvas}
      role="slider"
      aria-label={t.music.seek}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress() * 100)}
      className="h-10 w-full touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seek(e);
      }}
      onPointerMove={(e) => e.buttons && seek(e)}
    />
  );
}

// ——— YouTube, for the films there: its player without its controls, driven through its IFrame API ———
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
};
type YTNamespace = { Player: new (el: HTMLElement, options: object) => YTPlayer };
let youtubeApi: Promise<YTNamespace> | null = null;
function loadYouTube() {
  const w = window as unknown as { YT?: YTNamespace & { loaded?: number }; onYouTubeIframeAPIReady?: () => void };
  youtubeApi ??= new Promise((resolve) => {
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.append(script);
  });
  return youtubeApi;
}

export type PhoneFilm = { slug: string; title: string; credit?: string; seconds: number; youtube?: string; poster: string };

// The player: opens out of the film's card (`from`, where the card is) to the full screen and plays the film there,
// with its sound; a tap pauses it (PLAY gathers in the middle) or plays it on; the timeline at the bottom. Closing
// folds it back into the card.
export function PhonePlayer({ film, from, onClose }: { film: PhoneFilm; from: DOMRect; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const tube = useRef<YTPlayer | null>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(!film.youtube); // YouTube: until it plays, a tap goes to its own button
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(film.seconds);

  // open out of the card; the page behind stays put
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      root.style.overflow = overflow;
    };
  }, []);

  // YouTube's films: its player in place, asked to play (if the phone won't let it, its own play button shows,
  // and the first tap goes to it)
  useEffect(() => {
    if (!film.youtube || !holder.current) return;
    let alive = true;
    const place = document.createElement('div');
    holder.current.append(place);
    void loadYouTube().then((YT) => {
      if (!alive) return;
      tube.current = new YT.Player(place, {
        host: 'https://www.youtube-nocookie.com',
        videoId: film.youtube,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0, disablekb: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.playVideo();
            setLength(e.target.getDuration() || film.seconds);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setStarted(true);
            setPlaying(e.data === 1);
            if (e.data === 0) setPlaying(false);
          },
        },
      });
    });
    const poll = window.setInterval(() => tube.current && setTime(tube.current.getCurrentTime?.() ?? 0), 250);
    return () => {
      alive = false;
      window.clearInterval(poll);
      tube.current?.destroy();
      tube.current = null;
    };
  }, [film.youtube, film.seconds]);

  const close = () => {
    video.current?.pause();
    tube.current?.pauseVideo();
    setOpen(false);
    window.setTimeout(onClose, 420);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const toggle = () => {
    if (film.youtube) return playing ? tube.current?.pauseVideo() : tube.current?.playVideo();
    const el = video.current;
    if (el) void (el.paused ? el.play() : el.pause());
  };
  const progress = () => {
    if (film.youtube) return tube.current?.getCurrentTime ? tube.current.getCurrentTime() / (tube.current.getDuration() || length) : 0;
    const el = video.current;
    return el && el.duration ? el.currentTime / el.duration : 0;
  };
  const seek = (at: number) => {
    const to = at * length;
    if (film.youtube) tube.current?.seekTo(to, true);
    else if (video.current) video.current.currentTime = to;
    setTime(to);
  };

  const box = open
    ? { top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0 }
    : { top: from.top, left: from.left, width: from.width, height: from.height, borderRadius: 24 };
  return (
    <div role="dialog" aria-modal="true" aria-label={film.title} className="fixed inset-0 z-[100] touch-none overscroll-contain">
      <div className="absolute inset-0 bg-black transition-opacity duration-300" style={{ opacity: open ? 1 : 0 }} />
      <div
        className="absolute overflow-hidden bg-black transition-[top,left,width,height,border-radius] duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={box}
      >
        {film.youtube ? (
          <div ref={holder} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
        ) : (
          <video
            ref={video}
            src={`/video/${film.slug}.mp4`}
            poster={film.poster}
            autoPlay
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-contain"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setLength(e.currentTarget.duration || film.seconds)}
            onEnded={() => setPlaying(false)}
          />
        )}
        {/* a tap anywhere on the film plays or pauses it */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.buttons.pause : t.buttons.play}
          className="absolute inset-0"
          style={{ pointerEvents: started ? 'auto' : 'none' }}
        />
        <ParticlePlay on={open && started && !playing} scale={44} className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 bg-gradient-to-b from-black/70 to-transparent p-4 pb-10 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0, paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="min-w-0">
            <p className="truncate text-lg font-black uppercase leading-tight text-white">{film.title}</p>
            {film.credit && <p className="mt-0.5 truncate text-xs uppercase tracking-[0.18em] text-[#D7E2EA]/60">{film.credit}</p>}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.buttons.close}
            className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-10 transition-opacity duration-300"
          style={{ opacity: open ? 1 : 0, paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-between px-2 text-xs tabular-nums text-[#D7E2EA]/70">
            <span>{clock(time)}</span>
            <span>{clock(length)}</span>
          </div>
          <Timeline progress={progress} playing={playing} onSeek={seek} />
        </div>
      </div>
    </div>
  );
}
