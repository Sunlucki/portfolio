import { Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { SpeedNumber } from '../components/SpeedNumber';
import { VIDEO_ORDER, VIDEO_UNDER, VIDEO_VIEWS, YOUTUBE_FILMS } from '../content';
import { LOCALE, fill, t } from '../i18n';
import { ParticlePlay, PhonePlayer } from './VideoPlayer';
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
// touch screens (no hover): their own player (VideoPlayer.tsx), and PLAY on the film in the middle of the screen
const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Video: Bogdan's films in a masonry grid (three columns, two on tablets, one on phones), each at its own shape,
 * wide and tall ones taking turns, dealt to the shortest column so the order still reads across (or kept right under
 * another, where he asked). A film shows its poster; hovered, it loads a strip of ten of its frames (one small image; YouTube's
 * three stills for the music videos there) and flips through them. Clicked, it plays on the full screen with its
 * sound (YouTube's player for those), and the music player stops. On touch screens the film in the middle of the
 * screen shows PLAY in particles, and a tap opens the card into the section's own player (VideoPlayer.tsx).
 */
export function VideoSection() {
  const [columns, setColumns] = useState(3);
  const [open, setOpen] = useState<number | null>(null);
  const [phone, setPhone] = useState<{ i: number; from: DOMRect } | null>(null);
  const [middle, setMiddle] = useState(-1); // touch screens: the film nearest the middle of the screen
  const theater = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => setColumns(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
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

  // touch screens: which film is nearest the middle of the screen, as the page scrolls
  useEffect(() => {
    const el = grid.current;
    if (!touch || !el) return;
    let frame = 0;
    const find = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = -1;
      let near = Infinity;
      el.querySelectorAll<HTMLElement>('[data-film]').forEach((tile) => {
        const box = tile.getBoundingClientRect();
        const off = box.bottom < 0 || box.top > window.innerHeight ? Infinity : Math.abs((box.top + box.bottom) / 2 - mid);
        if (off < near) [near, best] = [off, Number(tile.dataset.film)];
      });
      setMiddle(best);
    };
    const onScroll = () => (frame ||= requestAnimationFrame(find));
    const around = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener('scroll', onScroll);
        setMiddle(-1);
      }
    });
    around.observe(el);
    return () => {
      around.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const show = (i: number, from: DOMRect) => {
    document.querySelectorAll('audio').forEach((audio) => audio.pause());
    if (touch) return setPhone({ i, from });
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
    <section id="video" className="bg-[#0C0C0C] px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text={t.video.title} className="mb-4 md:mb-6" />
      <Views />
      <div ref={grid} className="mx-auto flex max-w-6xl items-start gap-3 sm:gap-4">
        {stacks.map((stack, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            {stack.map((i) => (
              <Tile key={FILMS[i].slug} film={FILMS[i]} index={i} active={i === middle && !phone} onOpen={(from) => show(i, from)} />
            ))}
          </div>
        ))}
      </div>
      {phone && (
        <PhonePlayer
          film={{ ...FILMS[phone.i], credit: FILMS[phone.i].credit && credited(FILMS[phone.i].credit!), poster: poster(FILMS[phone.i]) }}
          from={phone.from}
          onClose={() => setPhone(null)}
        />
      )}

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
      </div>
    </section>
  );
}

// A film in the grid: its poster, its frames flipping while the pointer is on it (loaded the first time), its name.
// Touch screens can't hover: there the film in the middle of the screen (`active`) shows PLAY, in particles.
function Tile({ film, index, active, onOpen }: { film: Film; index: number; active: boolean; onOpen: (from: DOMRect) => void }) {
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
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
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
      {touch && <ParticlePlay on={active} className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2" />}
    </button>
  );
}

// The views of his videos on each platform, in a row under the title: each with its icon, fading in and racing
// up to its count as the row comes into view (like the numbers), again each time it does.
function Views() {
  const row = useRef<HTMLUListElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setRun(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <ul ref={row} className="mb-8 flex items-start justify-center gap-x-5 sm:items-center sm:gap-x-8 md:mb-12 md:gap-x-14">
      {VIDEO_VIEWS.map(({ platform, views: count }, i) => (
        <li
          key={platform}
          className="flex flex-col items-center gap-1.5 transition-[opacity,transform] duration-700 sm:flex-row sm:gap-3"
          style={{ opacity: run || still ? 1 : 0, transform: run || still ? 'none' : 'translateY(12px)', transitionDelay: `${i * 120}ms` }}
        >
          <span className="sr-only">
            {fill(t.video.viewsOn, { n: millions(count), platform })}
          </span>
          {/* on phones the icon over the count, so the three fit side by side in any language's numbers */}
          <span aria-hidden className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-3">
            <Platform name={platform} />
            <span className="whitespace-nowrap text-xl font-black leading-none sm:text-2xl md:text-3xl">
              <SpeedNumber value={count} suffix="+" run={run} format={millions} />
            </span>
          </span>
          <span aria-hidden className="text-[10px] uppercase tracking-[0.2em] text-[#D7E2EA]/60 sm:text-xs">
            {platform}
          </span>
        </li>
      ))}
    </ul>
  );
}

// A platform's icon, small, in the text's colour.
function Platform({ name }: { name: (typeof VIDEO_VIEWS)[number]['platform'] }) {
  const icon = 'h-6 w-6 shrink-0 text-[#D7E2EA]/85';
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
