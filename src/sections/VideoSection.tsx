import { Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SectionTitle } from '../components/SectionTitle';
import { VIDEO_ORDER, VIDEO_UNDER, VIDEO_VIEWS, YOUTUBE_FILMS } from '../content';
import { LOCALE, fill, t } from '../i18n';
import { flow, phoneLayout } from '../three/flow';
import { VideoFeed, type FeedHandle } from './VideoFeed';
import films from '../videos.json';

// Bogdan's films (scripts/prepare-media.py writes their list, the films, their posters and their strips of frames)
// and the videos on YouTube, in his order.
type Film = { slug: string; title: string; credit?: string; width: number; height: number; seconds: number; youtube?: string; views?: number };
const rank = (film: Film) => (VIDEO_ORDER.includes(film.slug) ? VIDEO_ORDER.indexOf(film.slug) : VIDEO_ORDER.length);
// In his order, but wide and tall films taking turns from the start, while there are tall ones; a film he wants
// under another comes right after it.
const FILMS: Film[] = (() => {
  const ordered = [...(films as Film[]), ...YOUTUBE_FILMS].map((film, i) => ({ film, i })).sort((a, b) => rank(a.film) - rank(b.film) || a.i - b.i).map(({ film }) => film);
  const free = ordered.filter((film) => !VIDEO_UNDER[film.slug]);
  const wide = free.filter((film) => film.width >= film.height);
  const tall = free.filter((film) => film.width < film.height);
  const turns: Film[] = [];
  while (wide.length || tall.length) {
    if (wide.length) turns.push(wide.shift()!);
    if (tall.length) turns.push(tall.shift()!);
  }
  for (const film of ordered.filter((film) => VIDEO_UNDER[film.slug])) turns.splice(turns.findIndex((f) => f.slug === VIDEO_UNDER[film.slug]) + 1, 0, film);
  return turns;
})();
const FRAMES = 10; // in a film's strip
const poster = (film: Film) => (film.youtube ? `https://i.ytimg.com/vi/${film.youtube}/maxresdefault.jpg` : `/video/${film.slug}.webp`);
// the frames a hovered film flips through: its strip of ten, or YouTube's three stills of it
const stills = (film: Film) => (film.youtube ? [1, 2, 3].map((k) => `https://i.ytimg.com/vi/${film.youtube}/hq${k}.jpg`) : [`/video/${film.slug}-frames.webp`]);
// counts the short way, as the visitor's language writes them (1.3M, 1,3 млн, 1,3 Mio.)
const compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
const views = (n: number) => fill(t.video.views, { n: compact.format(n) });
const millions = (tenths: number) => compact.format(tenths * 100_000); // VIDEO_VIEWS' counts
// a film's credit in the visitor's language, where it is words rather than names
const credited = (credit: string) => t.video.credits[credit] ?? credit;
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// touch screens (no hover): no frames flipping
const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// The page glides down to `to` (slower than the browser's own smooth scroll, so the particles can be seen on their
// way), unless a finger or the wheel takes over; then `done`.
function glide(to: number, done: () => void, ms = 1800) {
  const from = window.scrollY;
  const t0 = performance.now();
  let stopped = still;
  const stop = () => (stopped = true);
  window.addEventListener('touchstart', stop, { once: true, passive: true });
  window.addEventListener('wheel', stop, { once: true, passive: true });
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    if (!stopped) window.scrollTo({ top: from + (to - from) * (k < 0.5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2), behavior: 'instant' });
    if (k < 1 && !stopped) requestAnimationFrame(step);
    else {
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
      done();
    }
  };
  if (!still) return requestAnimationFrame(step);
  window.scrollTo({ top: to, behavior: 'instant' });
  done();
}

/**
 * Video: Bogdan's films in a masonry grid (three columns, two on tablets, one on phones), each at its own shape,
 * wide and tall ones taking turns, dealt to the shortest column so the order still reads across (or kept right under
 * another, where he asked). A film shows its poster; hovered, it loads a strip of ten of its frames (one small image; YouTube's
 * three stills for the music videos there) and flips through them. Clicked, it plays on the full screen with its
 * sound (YouTube's player for those), and the music player stops. Its first films are built out of the particles
 * the Apps section's iPhone breaks into (three/FlowScene.tsx). Phones get no grid: those particles build the iPhone
 * again here, the first film's picture on its screen, and PLAY floats out over it, pulsing; tapped, the camera flies
 * into the screen and the films open in a feed like TikTok's (VideoFeed.tsx).
 */
export function VideoSection() {
  const [columns, setColumns] = useState(3);
  const [open, setOpen] = useState<number | null>(null);
  const [phone, setPhone] = useState(phoneLayout);
  const [feed, setFeed] = useState(false);
  const [flying, setFlying] = useState(false);
  const [gliding, setGliding] = useState(false); // the feed over, on to the Music section
  const theater = useRef<HTMLDivElement>(null);
  const feeder = useRef<FeedHandle>(null);
  const fallback = useRef(0);

  useEffect(() => {
    const fit = () => {
      setColumns(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
      setPhone(phoneLayout());
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const stacks = useMemo(() => {
    const heights = Array.from({ length: columns }, () => 0);
    const stacked: number[][] = heights.map(() => []);
    FILMS.forEach((film, i) => {
      // into the shortest column, or right under the film it's to follow
      const under = stacked.findIndex((stack) => stack.at(-1) !== undefined && FILMS[stack.at(-1)!].slug === VIDEO_UNDER[film.slug]);
      const c = under >= 0 ? under : heights.indexOf(Math.min(...heights));
      stacked[c].push(i);
      heights[c] += film.height / film.width;
    });
    return stacked;
  }, [columns]);

  // phones: the films on the iPhone's screen, as a grid running up without end (there are many); PLAY flies the
  // camera into it and opens the feed, whose first film starts in the tap itself (so it plays with its sound)
  useEffect(() => {
    flow.posters = FILMS.map(poster);
  }, []);
  const play = () => {
    if (flying || gliding) return;
    feeder.current?.start();
    if (still) return setFeed(true); // no flying
    setFlying(true);
    flow.flown = () => setFeed(true);
    flow.fly = performance.now();
    fallback.current = window.setTimeout(() => setFeed(true), 1400); // no scene to fly (no WebGL): open all the same
  };
  // closed, the feed flies back into the phone; the feed over, the page goes on to the Music section (the phone
  // breaking up to build its floor)
  const closeFeed = (end: boolean) => {
    window.clearTimeout(fallback.current);
    setFeed(false);
    flow.flown = null;
    const done = () => {
      window.clearTimeout(fallback.current);
      setFlying(false);
      flow.fly = flow.back = 0;
      flow.landed = null;
      const music = document.getElementById('music');
      if (!end || !music) return;
      setGliding(true);
      glide(music.getBoundingClientRect().top + window.scrollY, () => setGliding(false));
    };
    if (!flow.fly) return done(); // (it didn't fly in)
    flow.back = performance.now();
    flow.landed = done;
    fallback.current = window.setTimeout(done, 1400); // no scene to fly (no WebGL): back all the same
  };
  // the scene: over the page while the phone flies, resting under the feed
  useEffect(() => {
    flow.layer?.(feed ? 'feed' : flying ? 'fly' : 'page');
  }, [feed, flying]);

  const show = (i: number) => {
    document.querySelectorAll('audio').forEach((audio) => audio.pause());
    setOpen(i);
    theater.current?.requestFullscreen?.().catch(() => {}); // where it can't (iPhone), the theatre fills the window
  };
  const close = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setOpen(null);
  };
  // leaving the full screen (Esc, the system's own control) closes the film too
  useEffect(() => {
    const left = () => !document.fullscreenElement && setOpen(null);
    document.addEventListener('fullscreenchange', left);
    return () => document.removeEventListener('fullscreenchange', left);
  }, []);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  const film = open === null ? null : FILMS[open];

  return (
    <section id="video" className="px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text={t.video.title} className="mb-4 md:mb-6" />
      <Views />
      {phone ? (
        <>
          {/* the iPhone's place (the scene behind builds it) and PLAY in the middle of its screen: the scene draws it in
              particles, standing out in front of the phone (data-drawn), and this is where it is tapped; without the
              scene, the button itself, red. Tapped, it bursts towards the camera as the camera flies in. */}
          <div data-flow="phone" data-ready="1" className="group relative mx-auto aspect-[4/5] w-full max-w-[440px]">
            <button
              type="button"
              onClick={play}
              aria-label={fill(t.video.play, { title: FILMS[0].title })}
              className="pointer-events-none absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 scale-50 place-items-center rounded-full bg-[#FF2D55] text-white opacity-0 shadow-[0_0_40px_rgba(255,45,85,0.6)] outline-offset-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white group-data-[ready=1]:pointer-events-auto group-data-[ready=1]:scale-100 group-data-[ready=1]:opacity-100 group-data-[drawn=1]:bg-transparent group-data-[drawn=1]:shadow-none"
              style={flying || gliding ? { opacity: 0, transform: 'translate(-50%, -50%) scale(1.8)', transitionDuration: '300ms', pointerEvents: 'none' } : undefined}
            >
              <span className="absolute inset-0 rounded-full group-data-[drawn=1]:hidden group-data-[ready=1]:animate-[play-ring_1.6s_ease-out_infinite]" />
              <Play className="h-8 w-8 translate-x-0.5 group-data-[drawn=1]:hidden group-data-[ready=1]:animate-[play-pulse_1.6s_ease-in-out_infinite]" fill="currentColor" />
            </button>
          </div>
          <p className="mt-2 text-balance text-center text-xs uppercase tracking-[0.18em] text-[#D7E2EA]/60">{t.video.tap}</p>
          <VideoFeed
            ref={feeder}
            open={feed}
            onClose={closeFeed}
            films={FILMS.map((f) => ({ ...f, credit: f.credit && credited(f.credit), poster: poster(f) }))}
          />
        </>
      ) : (
        <div data-flow="films" className="mx-auto flex max-w-6xl items-start gap-3 sm:gap-4">
          {stacks.map((stack, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
              {stack.map((i) => (
                <Tile key={FILMS[i].slug} film={FILMS[i]} index={i} onOpen={() => show(i)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* in the body, over everything (the sections round this one keep their own layers) */}
      {createPortal(
        <div
          ref={theater}
          role="dialog"
          aria-modal="true"
          aria-label={film ? film.title : undefined}
          aria-hidden={!film}
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 ${film ? 'opacity-100' : 'pointer-events-none invisible opacity-0'}`}
        >
          {film?.youtube ? (
            <iframe
              key={film.slug}
              src={`https://www.youtube-nocookie.com/embed/${film.youtube}?autoplay=1&rel=0&playsinline=1`}
              title={film.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            film && <video key={film.slug} src={`/video/${film.slug}.mp4`} poster={poster(film)} controls autoPlay playsInline className="h-full w-full object-contain" />
          )}
          <button
            type="button"
            onClick={close}
            aria-label={t.buttons.close}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>,
        document.body,
      )}
    </section>
  );
}

// A film in the grid: its poster, its frames flipping while the pointer is on it (loaded the first time), its name.
function Tile({ film, index, onOpen }: { film: Film; index: number; onOpen: () => void }) {
  const [strip, setStrip] = useState(false); // the strip asked for
  const [frame, setFrame] = useState(-1); // -1: the poster
  const count = film.youtube ? 3 : FRAMES;
  const flip = useRef(0);
  const over = useRef(false);
  const ready = useRef<Promise<void> | null>(null);

  const enter = () => {
    over.current = true;
    setStrip(true);
    ready.current ??= Promise.all(
      stills(film).map(
        (src) =>
          new Promise<void>((done) => {
            const image = new Image();
            image.onload = image.onerror = () => done();
            image.src = src;
          }),
      ),
    ).then(() => {});
    void ready.current.then(() => {
      if (!over.current || flip.current) return; // left before it loaded, or already flipping
      setFrame(0);
      flip.current = window.setInterval(() => setFrame((k) => (k + 1) % count), film.youtube ? 600 : 280);
    });
  };
  const leave = () => {
    over.current = false;
    window.clearInterval(flip.current);
    flip.current = 0;
    setFrame(-1);
  };
  useEffect(() => () => window.clearInterval(flip.current), []);
  const hover = touch ? {} : { onMouseEnter: enter, onMouseLeave: leave, onFocus: enter, onBlur: leave };

  return (
    <button
      type="button"
      data-film={index}
      onClick={onOpen}
      {...hover}
      aria-label={`${fill(t.video.play, { title: film.title })}${film.credit ? `, ${credited(film.credit)}` : ''}`}
      className="group relative block w-full overflow-hidden rounded-[24px] bg-white/[0.04] text-left"
      style={{ aspectRatio: `${film.width} / ${film.height}` }}
    >
      <img src={poster(film)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      {strip &&
        (film.youtube ? (
          // YouTube's stills are 4:3 with the picture letterboxed: covering the tile crops the bars away
          <img aria-hidden alt="" src={stills(film)[Math.max(0, frame)]} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style={{ opacity: frame < 0 ? 0 : 1 }} />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-no-repeat transition-opacity duration-300"
            style={{
              backgroundImage: `url(${stills(film)[0]})`,
              backgroundSize: `${FRAMES * 100}% 100%`,
              backgroundPosition: `${(Math.max(0, frame) / (FRAMES - 1)) * 100}% 0`,
              opacity: frame < 0 ? 0 : 1,
            }}
          />
        ))}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-16 sm:p-5 sm:pt-20">
        <div className="min-w-0">
          <p className="truncate text-lg font-black uppercase leading-tight text-white sm:text-xl">{film.title}</p>
          <p className="mt-0.5 truncate text-xs uppercase tracking-[0.18em] text-[#D7E2EA]/60">
            {film.credit ? `${credited(film.credit)} · ` : ''}
            {film.views ? `${views(film.views)} · ` : ''}
            {clock(film.seconds)}
          </p>
        </div>
        {!touch && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0C0C0C] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Play className="h-4 w-4 translate-x-px" fill="currentColor" />
          </span>
        )}
      </div>
    </button>
  );
}

// The views of his videos on each platform, in one thin line under the title: each its icon and its count (and,
// where there is room, the platform's name).
function Views() {
  return (
    <ul className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-10 md:mb-12">
      {VIDEO_VIEWS.map(({ platform, views: count }) => (
        <li key={platform} className="flex items-center gap-2 whitespace-nowrap">
          <span className="sr-only">{fill(t.video.viewsOn, { n: millions(count), platform })}</span>
          <Platform name={platform} />
          <span aria-hidden className="text-sm font-light tabular-nums tracking-wide text-[#D7E2EA]">
            {millions(count)}+
          </span>
          <span aria-hidden className="hidden text-[11px] uppercase tracking-[0.2em] text-[#D7E2EA]/45 sm:inline">
            {platform}
          </span>
        </li>
      ))}
    </ul>
  );
}

// A platform's icon, small, in the text's colour.
function Platform({ name }: { name: (typeof VIDEO_VIEWS)[number]['platform'] }) {
  const icon = 'h-4 w-4 shrink-0 text-[#D7E2EA]/70';
  if (name === 'YouTube') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={icon}>
        <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15.1V8.9l5.4 3.1Z" />
      </svg>
    );
  }
  if (name === 'TikTok') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={icon}>
        <path d="M16.8 2.5c.3 2.4 1.7 3.9 4.2 4.1v2.9c-1.5.1-2.8-.4-4.2-1.3v6.1c0 3.9-3 6.2-6.1 6.2a6 6 0 0 1-6-6.1c0-3.6 3.1-6.3 6.8-5.7v3.1c-1.6-.4-3.7.5-3.7 2.6 0 1.6 1.2 2.8 2.8 2.8 1.8 0 2.9-1.2 2.9-3.1V2.5Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={icon}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
