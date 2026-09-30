import { Pause, Play, X } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { t } from '../i18n';

// The Video section's feed on phones, like TikTok's or Reels': one film at a time on the whole screen, with its
// sound; swipe up for the next, down for the one before. The films lie in a column the height of the screen: the
// finger drags it, the next film's picture coming in under the one that plays, and let go far enough (or flicked)
// it snaps on to it, else back. Tap to pause or play; the play buttons and the timeline, a line of particles like the
// music player's, are red. The feed is over when the last film has played or is swiped past: it closes as if
// closed, saying so (`onClose`'s `end`).

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const RED = '#FF2D55';
const SNAP_MS = 320; // a film sliding into place
const CAPTION_BOTTOM = 'calc(max(0.75rem, env(safe-area-inset-bottom)) + 3.4rem)'; // (over the controls)

export type FeedFilm = { slug: string; title: string; credit?: string; width: number; height: number; seconds: number; youtube?: string; poster: string };
export type FeedHandle = { start: () => void };

// Tall films fill the screen; wide ones fit its width.
const covers = (film: FeedFilm) => film.height > film.width;

// ——— YouTube's films: its player without its controls, through its IFrame API ———
type YTPlayer = { playVideo(): void; pauseVideo(): void; seekTo(s: number, ahead: boolean): void; getCurrentTime(): number; getDuration(): number; destroy(): void };
type YTNamespace = { Player: new (el: HTMLElement, options: object) => YTPlayer };
let youtubeApi: Promise<YTNamespace> | null = null;
function loadYouTube() {
  const w = window as unknown as { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };
  youtubeApi ??= new Promise((resolve) => {
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.append(script);
  });
  return youtubeApi;
}

// ——— the timeline: a line of red particles, lit as far as the film has played; touched or dragged, it seeks ———
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
function Timeline({ progress, playing, open, onSeek }: { progress: () => number; playing: boolean; open: boolean; onSeek: (at: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ progress, playing });
  useEffect(() => {
    live.current = { progress, playing };
  });
  useEffect(() => {
    const el = canvas.current;
    if (!el || !open) return; // (drawn only while the feed is open)
    const ctx = el.getContext('2d')!;
    const seeds = Array.from({ length: 420 }, () => [Math.random(), Math.random()]);
    let frame = 0;
    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const [w, h] = [el.clientWidth, el.clientHeight];
      if (el.width !== Math.round(w * dpr)) [el.width, el.height] = [Math.round(w * dpr), Math.round(h * dpr)];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const at = clamp01(live.current.progress());
      const count = Math.min(seeds.length, Math.round(w / 1.1));
      const time = now / 1000;
      for (let i = 0; i < count; i++) {
        const a = i / count;
        const [seed, seed2] = seeds[i];
        const lit = clamp01((at - a) * 300);
        const head = at > 0 ? Math.exp(-(((a - at) * 40) ** 2)) : 0;
        const wave = Math.sin(a * 50 + time * 3) * (live.current.playing ? 1.6 : 0.5);
        const size = 5 + 4 * lit + 7 * head + seed2 * 2;
        const [r, g, b] = head > 0.3 ? [255, 160, 175] : lit ? [255, 45, 85] : [150, 30, 55];
        ctx.globalAlpha = Math.min(1, (lit ? 1 : 0.45) + 0.6 * head);
        ctx.drawImage(dot(r, g, b), 8 + a * (w - 16) - size / 2, h / 2 + (seed - 0.5) * 6 + wave * lit - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [open]);
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
      data-control
      className="h-10 min-w-0 flex-1 touch-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        seek(e);
      }}
      onPointerMove={(e) => e.buttons && seek(e)}
    />
  );
}

// A film's title and who it's for, at the foot of its page in the column, over a shade.
function Caption({ film }: { film: FeedFilm }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 px-4" style={{ bottom: CAPTION_BOTTOM }}>
        <p className="truncate text-lg font-black uppercase leading-tight text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">{film.title}</p>
        {film.credit && <p className="mt-0.5 truncate text-xs uppercase tracking-[0.18em] text-white/70">{film.credit}</p>}
      </div>
    </>
  );
}

// A film's page in the column: its picture, as the player will show it, and its caption. The page of the film that
// plays lies over the player: its picture shows till the player shows the film (`cover`), then fades.
function Page({ film, at, cover }: { film: FeedFilm; at: number; cover: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 h-full" style={{ top: `${at * 100}%` }}>
      <img
        src={film.poster}
        alt=""
        decoding="async"
        className={`absolute inset-0 h-full w-full ${covers(film) ? 'object-cover' : 'object-contain'}`}
        style={{ opacity: cover ? 1 : 0, transition: cover ? 'none' : 'opacity 200ms' }}
      />
      <Caption film={film} />
    </div>
  );
}

// The feed. It is in the page (hidden) as soon as the Video section comes near, so `start` can play the first film
// in the very tap on PLAY (phones let a page play sound only in a tap; after that, the same player may play on);
// `open` shows it. It sits right in the body, over everything (the sections round it keep their own layers).
export const VideoFeed = forwardRef<FeedHandle, { films: FeedFilm[]; open: boolean; onClose: (end: boolean) => void }>(function VideoFeed({ films, open, onClose }, ref) {
  const video = useRef<HTMLVideoElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const tube = useRef<YTPlayer | null>(null);
  const swipe = useRef({ y: 0, at: 0, moved: false, offset: 0, speed: 0, last: 0, lastAt: 0, anim: 0, busy: false });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(true); // YouTube: until it plays, a tap goes to its own button
  const [moving, setMoving] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(films[0].seconds);
  const [swiped, setSwiped] = useState(false);
  const [framed, setFramed] = useState(false); // the player shows the film (till then its poster covers it)
  const film = films[index];
  const last = index === films.length - 1;
  const over = useRef(() => {}); // the last film has played: the feed is over

  const source = (f: FeedFilm) => `/video/${f.slug}.mp4`;
  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        const el = video.current;
        if (!el || films[index].youtube) return;
        if (el.getAttribute('src') !== source(films[index])) el.src = source(films[index]);
        el.currentTime = 0;
        void el.play().catch(() => {});
      },
    }),
    [films, index],
  );

  // open: the page stays put behind; closed: the film stops
  useEffect(() => {
    if (!open) {
      video.current?.pause();
      tube.current?.pauseVideo();
      return;
    }
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    document.querySelectorAll('#music audio').forEach((audio) => (audio as HTMLAudioElement).pause());
    return () => {
      html.style.overflow = overflow;
    };
  }, [open]);

  // YouTube's films: its player in place (asked to play; if the phone won't, its own button shows)
  useEffect(() => {
    if (!open || !film.youtube || !holder.current) return;
    let alive = true;
    setStarted(false);
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
            if (e.data === 0) over.current(); // (ended)
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
      place.remove();
    };
  }, [open, film.youtube, film.seconds]);

  // the column, where the finger (or a snap) has it: 0 the film that plays, a screen's height up the next
  const place = (offset: number) => {
    swipe.current.offset = offset;
    if (column.current) column.current.style.transform = offset ? `translate3d(0, ${offset.toFixed(1)}px, 0)` : '';
  };
  // slides to `to` (a screen up the next film, down the one before, 0 back), then `done`
  const slide = (to: number, done: () => void) => {
    const s = swipe.current;
    const from = s.offset;
    const start = performance.now();
    const ms = SNAP_MS * Math.min(1, Math.max(0.45, Math.abs(to - from) / window.innerHeight));
    cancelAnimationFrame(s.anim);
    s.busy = true;
    const step = (now: number) => {
      const k = clamp01((now - start) / ms);
      place(from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) s.anim = requestAnimationFrame(step);
      else {
        s.busy = false;
        done();
      }
    };
    s.anim = requestAnimationFrame(step);
  };
  // on to film `to`: it slides in, then it plays (the player is the one the tap on PLAY started, so it may)
  const turnTo = (to: number) => {
    const next = films[to];
    if (!next) return;
    setMoving(true);
    slide((to > index ? -1 : 1) * window.innerHeight, () => {
      flushSync(() => {
        setIndex(to);
        setTime(0);
        setLength(next.seconds);
        setSwiped(true);
        setMoving(false);
        setFramed(false);
      });
      place(0);
      const el = video.current;
      if (!next.youtube && el) {
        el.src = source(next);
        void el.play().catch(() => {});
      } else el?.pause();
    });
  };

  const onDown = (e: React.PointerEvent) => {
    const s = swipe.current;
    if ((e.target as HTMLElement).closest('[data-control]') || s.busy) return;
    s.y = s.last = e.clientY;
    s.at = s.lastAt = performance.now();
    s.moved = false;
    s.speed = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = swipe.current;
    if ((!e.buttons && e.pointerType === 'mouse') || s.busy || !s.at) return;
    const dy = e.clientY - s.y;
    if (!s.moved && Math.abs(dy) > 8) {
      s.moved = true;
      setMoving(true);
    }
    if (!s.moved) return;
    const now = performance.now();
    s.speed = (e.clientY - s.last) / Math.max(1, now - s.lastAt);
    [s.last, s.lastAt] = [e.clientY, now];
    // past the first film or the last, it gives only a little
    const edge = (dy > 0 && !films[index - 1]) || (dy < 0 && !films[index + 1]);
    place(edge ? dy * 0.3 : dy);
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s.at) return;
    s.at = 0;
    if (!s.moved) {
      if (!(e.target as HTMLElement).closest('[data-control]') && started) toggle();
      return;
    }
    const dy = e.clientY - s.y;
    const way = dy < 0 ? 1 : -1;
    const far = Math.abs(dy) > window.innerHeight * 0.18 || Math.abs(s.speed) > 0.45;
    if (far && films[index + way]) return turnTo(index + way);
    if (far && way === 1 && last) close(true); // up past the last film: the feed is over
    slide(0, () => setMoving(false));
  };

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
  const close = (end = false) => {
    video.current?.pause();
    tube.current?.pauseVideo();
    onClose(end);
    if (!end) return;
    // over: from the first film again, next time
    setIndex(0);
    setTime(0);
    setLength(films[0].seconds);
  };
  useEffect(() => {
    over.current = () => last && close(true);
  });
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !swipe.current.busy) turnTo(index + (e.key === 'ArrowDown' ? 1 : -1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] touch-none select-none overflow-hidden overscroll-contain bg-black transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none invisible opacity-0'}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* the column: the player, where the film that plays is (always the same player), and the pages of the film before,
          that one and the one after (a page keeps its picture as it moves on to be the one that plays: no blink) */}
      <div ref={column} className="absolute inset-0" style={{ willChange: 'transform' }}>
        <div className="absolute inset-0">
          <video
            ref={video}
            playsInline
            preload="metadata"
            poster={film.youtube ? undefined : film.poster}
            className={`absolute inset-0 h-full w-full ${covers(film) ? 'object-cover' : 'object-contain'} ${film.youtube ? 'hidden' : ''}`}
            loop={!last}
            onEnded={() => over.current()}
            onPlay={() => setPlaying(true)}
            onPlaying={() => setFramed(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setLength(e.currentTarget.duration || film.seconds)}
          />
          {/* (YouTube's player the picture's size, so its own title and logo sit on the picture, not on the feed's) */}
          {film.youtube && (
            <div
              ref={holder}
              className="absolute inset-x-0 top-1/2 max-h-full -translate-y-1/2 [&>iframe]:h-full [&>iframe]:w-full"
              style={{ aspectRatio: `${film.width} / ${film.height}`, pointerEvents: started ? 'none' : 'auto' }}
            />
          )}
        </div>
        {[-1, 0, 1].map((at) => {
          const page = films[index + at];
          return page && <Page key={page.slug} film={page} at={at} cover={at !== 0 || (!page.youtube && !framed)} />;
        })}
      </div>

      {/* paused: PLAY in the middle, red */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          className="grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_0_40px_rgba(255,45,85,0.55)] transition-[opacity,transform] duration-300"
          style={{ background: RED, opacity: open && started && !playing && !moving ? 1 : 0, transform: open && started && !playing && !moving ? 'scale(1)' : 'scale(0.6)' }}
        >
          <Play className="h-8 w-8 translate-x-0.5" fill="currentColor" />
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-8" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <span className="text-xs tabular-nums tracking-widest text-white/70">
          {index + 1} / {films.length}
        </span>
        <button
          type="button"
          data-control
          onClick={() => close()}
          aria-label={t.buttons.close}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        {!swiped && (
          <p className="absolute inset-x-0 text-center text-[11px] uppercase tracking-[0.25em] text-white/60 [animation:fade-in_0.6s_ease-out]" style={{ bottom: `calc(${CAPTION_BOTTOM} + 3.2rem)` }}>
            {t.video.swipe}
          </p>
        )}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            data-control
            onClick={toggle}
            aria-label={playing ? t.buttons.pause : t.buttons.play}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
            style={{ background: RED }}
          >
            {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 translate-x-px" fill="currentColor" />}
          </button>
          <Timeline progress={progress} playing={playing} open={open} onSeek={seek} />
          <span className="shrink-0 text-xs tabular-nums text-white/70">
            {clock(time)} / {clock(length)}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
});
