import { Play, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { VIDEO_ORDER, VIDEO_UNDER, VIDEO_VIEWS, YOUTUBE_FILMS } from '../content';
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
const views = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M views` : `${Math.round(n / 1000)}K views`);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Video: Bogdan's films in a masonry grid (three columns, two on tablets, one on phones), each at its own shape,
 * wide and tall ones taking turns, dealt to the shortest column so the order still reads across (or kept right under
 * another, where he asked). A film shows its poster; hovered, it loads a strip of ten of its frames (one small image; YouTube's
 * three stills for the music videos there) and flips through them. Clicked, it plays on the full screen with its
 * sound (YouTube's player for those), and the music player stops.
 */
export function VideoSection() {
  const [columns, setColumns] = useState(3);
  const [open, setOpen] = useState<number | null>(null);
  const theater = useRef<HTMLDivElement>(null);

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
    <section id="video" className="bg-[#0C0C0C] px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text="Video" className="mb-4 md:mb-6" />
      <p className="mb-8 text-center text-xs uppercase tracking-[0.25em] text-[#D7E2EA]/60 md:mb-12">{VIDEO_VIEWS}</p>
      <div className="mx-auto flex max-w-6xl items-start gap-3 sm:gap-4">
        {stacks.map((stack, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            {stack.map((i) => (
              <Tile key={FILMS[i].slug} film={FILMS[i]} onOpen={() => show(i)} />
            ))}
          </div>
        ))}
      </div>

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
          aria-label="Close"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

// A film in the grid: its poster, its frames flipping while the pointer is on it (loaded the first time), its name.
function Tile({ film, onOpen }: { film: Film; onOpen: () => void }) {
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

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label={`Play ${film.title}${film.credit ? `, ${film.credit}` : ''}`}
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
            {film.credit ? `${film.credit} · ` : ''}
            {film.views ? `${views(film.views)} · ` : ''}
            {clock(film.seconds)}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0C0C0C] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Play className="h-4 w-4 translate-x-px" fill="currentColor" />
        </span>
      </div>
    </button>
  );
}
