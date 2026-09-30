import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SectionTitle } from '../components/SectionTitle';
import { LiveProjectButton } from '../components/Buttons';
import { PROJECTS, type Project, type Slide } from '../content';
import { fill, t } from '../i18n';

const RADIUS = 'rounded-[40px] sm:rounded-[50px] md:rounded-[60px]';
// The products' promos (src/promo): Remotion and four films, loaded as the section comes near.
const loadPromo = () => import('../promo/Promo');
const Promo = lazy(loadPromo);
// The gallery's height, which a promo's or a slideshow's window takes whole
const GALLERY = 'calc(clamp(130px, 16vw, 230px) + clamp(160px, 22vw, 340px) + 16px)';
const MOCKUP_MS = 3200; // how long a site's mockup shows, a page scrolls, a demo film plays
const PAGE_MS = 8000;
const FILM_MS = 15000;
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sticky cards that stack on top of each other; earlier cards shrink slightly as later ones arrive. The card on
// top plays its product's promo, if it has one; the others show their screenshots, so only one plays at a time.
export function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [top, setTop] = useState(-1);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      const box = containerRef.current?.getBoundingClientRect();
      let on = -1;
      // the last card to have come up over half the screen, while the section is on screen
      if (box && box.top < vh && box.bottom > vh * 0.3) cards.current.forEach((card, i) => card && card.getBoundingClientRect().top < vh * 0.45 && (on = i));
      setTop(on);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // fetch the promos a screen or two ahead
    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && loadPromo(), { rootMargin: '150% 0px' });
    if (containerRef.current) near.observe(containerRef.current);
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      near.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      id="projects"
      className={`relative z-10 -mt-10 bg-[#0C0C0C] px-4 pb-24 pt-20 sm:-mt-12 sm:px-6 md:-mt-14 md:px-10 md:pt-28 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]`}
    >
      <SectionTitle text={t.projects.title} className="mb-8 md:mb-12" />
      <div ref={containerRef} className="relative">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.name}
            project={project}
            index={i}
            progress={scrollYProgress}
            range={[i / PROJECTS.length, 1]}
            targetScale={1 - (PROJECTS.length - 1 - i) * 0.03}
            playing={top === i}
            cardRef={(el) => {
              cards.current[i] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}

type CardProps = {
  project: Project;
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  playing: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
};

function ProjectCard({ project, index, progress, range, targetScale, playing, cardRef }: CardProps) {
  const scale = useTransform(progress, range, [1, targetScale]);
  const { promo } = project;

  return (
    <div ref={cardRef} className="sticky top-24 flex h-[85vh] items-start justify-center md:top-32">
      <motion.article
        style={{ scale, top: index * 28 }}
        className={`relative w-full max-w-6xl origin-top border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:p-6 md:p-8 ${RADIUS}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 px-2 sm:mb-6 md:mb-8">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <span className="hero-heading shrink-0 font-black leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 110px)' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-[#D7E2EA]/60 sm:text-sm">{project.category}</p>
              <h3 className="font-medium uppercase leading-tight text-[#D7E2EA]" style={{ fontSize: 'clamp(1.25rem, 2.6vw, 2.4rem)' }}>
                {project.name}
              </h3>
              <p className="mt-1 hidden max-w-xl text-sm font-light leading-snug text-[#D7E2EA]/70 sm:block md:text-base">
                {project.description}
              </p>
            </div>
          </div>
          {project.live ? (
            <LiveProjectButton href={project.live} label={project.liveLabel} />
          ) : project.slides ? null : (
            <span className="rounded-full border-2 border-[#D7E2EA]/30 px-8 py-3 text-sm uppercase tracking-widest text-[#D7E2EA]/50 sm:px-10 sm:py-3.5">
              {t.projects.caseStudy}
            </span>
          )}
        </div>

        {project.slides ? (
          <div className={`relative aspect-video w-full overflow-hidden md:aspect-auto md:h-[var(--gallery)] ${RADIUS}`} style={{ ['--gallery' as string]: GALLERY }}>
            <Slides slides={project.slides} playing={playing} />
          </div>
        ) : promo ? (
          // one wide window for the promo (16:9), its screenshot until it plays
          <div
            className={`relative aspect-video w-full overflow-hidden md:aspect-auto md:h-[var(--gallery)] ${RADIUS}`}
            style={{ ['--gallery' as string]: GALLERY }}
            role="region"
            aria-label={fill(t.projects.demo, { name: project.name })}
          >
            <img src={project.images[2]} alt={project.alts[2]} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-left-top" />
            {playing && (
              <Suspense fallback={null}>
                {/* over the screenshot, on the promo's own paper, so its margins melt into the stage */}
                <div className="absolute inset-0 animate-[fade-in_0.6s_ease-out] bg-[linear-gradient(180deg,#f8f9fb,#f3f4f8_62%,#eceef3)]">
                  <Promo id={promo.id} chapters={promo.chapters} />
                </div>
              </Suspense>
            )}
          </div>
        ) : (
          <div className="flex gap-3 sm:gap-4">
            <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
              <img
                src={project.images[0]}
                alt={project.alts[0]}
                loading="lazy"
                className={`w-full object-cover object-top ${RADIUS}`}
                style={{ height: 'clamp(130px, 16vw, 230px)' }}
              />
              <img
                src={project.images[1]}
                alt={project.alts[1]}
                loading="lazy"
                className={`w-full object-cover object-top ${RADIUS}`}
                style={{ height: 'clamp(160px, 22vw, 340px)' }}
              />
            </div>
            <div className="w-[60%]">
              <img src={project.images[2]} alt={project.alts[2]} loading="lazy" className={`h-full w-full object-cover object-left-top ${RADIUS}`} />
            </div>
          </div>
        )}
      </motion.article>
    </div>
  );
}

// The sites of a card, one after another, each through its frames: a mockup eases in a little closer, a page
// scrolls down from its top on a MacBook's screen, a demo film plays; then the next site. The card on top turns them itself, a pill for each site jumps to
// it, and a site still live gets a link. Only the frame shown, the one before (fading out) and the next (loading)
// are in the page.
function Slides({ slides, playing }: { slides: Slide[]; playing: boolean }) {
  const frames = useMemo(() => slides.flatMap((slide, site) => slide.frames.map((frame) => ({ ...frame, site }))), [slides]);
  const [at, setAt] = useState(0);
  const hold = (i: number) => (frames[i].video ? FILM_MS : frames[i].page ? PAGE_MS : MOCKUP_MS);
  useEffect(() => {
    if (!playing || still) return;
    const next = window.setTimeout(() => setAt((i) => (i + 1) % frames.length), frames[at].video ? FILM_MS : frames[at].page ? PAGE_MS : MOCKUP_MS);
    return () => window.clearTimeout(next);
  }, [playing, at, frames]);
  const site = frames[at].site;
  const url = slides[site].url;
  const near = [(at + frames.length - 1) % frames.length, at, (at + 1) % frames.length];

  // a frame as it shows: mockups and films across the window, pages on the MacBook's screen
  const frame = (i: number) => {
    const shot = frames[i];
    const on = i === at;
    const moving = on && playing && !still;
    if (shot.video) return <Film key={shot.video} frame={shot} on={on} playing={moving} />;
    return (
      <img
        key={shot.image}
        src={shot.image}
        alt={shot.alt}
        aria-hidden={!on}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: on ? 1 : 0,
          objectPosition: shot.page ? `center ${moving ? 100 : 0}%` : (shot.focus ?? 'center'),
          transform: !shot.page && moving ? 'scale(1.05)' : 'scale(1)',
          transition: `opacity 900ms ease, transform ${hold(i) + 900}ms ease-out, object-position ${moving ? hold(i) : 0}ms ease-in-out`,
        }}
      />
    );
  };

  return (
    <div className="absolute inset-0 bg-[#0C0C0C]">
      {near.filter((i) => !frames[i].page).map(frame)}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_65%,rgba(120,140,255,0.14),transparent_62%)] transition-opacity duration-[900ms]"
        style={{ opacity: frames[at].page ? 1 : 0 }}
      >
        <MacBook>{near.filter((i) => frames[i].page).map(frame)}</MacBook>
      </div>
      <nav aria-label={t.projects.sites} className="absolute inset-x-0 top-0 flex gap-2 overflow-x-auto bg-gradient-to-b from-black/45 to-transparent p-3 sm:p-4 [scrollbar-width:none]">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => setAt(frames.findIndex((frame) => frame.site === i))}
            aria-current={i === site ? 'true' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors sm:px-4 sm:text-sm ${
              i === site ? 'bg-white text-[#0C0C0C]' : 'bg-black/45 text-white hover:bg-black/65'
            }`}
          >
            {slide.label}
          </button>
        ))}
      </nav>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/65 sm:bottom-4 sm:right-4 sm:text-sm"
        >
          {new URL(url).hostname}
          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

// A site's demo film in the slideshow: from its start each time its frame comes up, paused otherwise.
function Film({ frame, on, playing }: { frame: Slide['frames'][number]; on: boolean; playing: boolean }) {
  const film = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = film.current;
    if (!video) return;
    if (!playing) video.pause();
    else {
      video.currentTime = 0;
      video.play().catch(() => {}); // no autoplay here: the poster stays
    }
  }, [playing]);
  return (
    <video
      ref={film}
      src={frame.video}
      poster={frame.image}
      muted
      playsInline
      preload="auto"
      aria-label={frame.alt}
      aria-hidden={!on}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity: on ? 1 : 0, transition: 'opacity 900ms ease' }}
    />
  );
}

// A MacBook seen from the front, drawn in CSS (it scales with the window): a black glass lid with a notch and an
// aluminium edge, the screen inside it, and the base's lip below with its thumb notch.
function MacBook({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-[6%] top-[15%] flex items-center justify-center">
      <div className="relative h-full" style={{ aspectRatio: '1.72' }}>
        <div className="absolute left-[6%] top-0 h-[94%] w-[88%] rounded-[2.4%/3.6%] bg-[#0d0d10] shadow-[inset_0_0_0_1.5px_#55575e,0_24px_60px_rgba(0,0,0,0.55)]">
          <div className="absolute inset-[3.4%_2.4%_4.6%] overflow-hidden rounded-[0.6%] bg-black">{children}</div>
          <div className="absolute left-1/2 top-[3.4%] h-[3%] w-[9%] -translate-x-1/2 rounded-b-[5px] bg-[#0d0d10]" />
        </div>
        <div className="absolute bottom-0 left-0 h-[6%] w-full rounded-b-[45%_100%] rounded-t-[2px] bg-gradient-to-b from-[#e6e7eb] via-[#b7b9bf] to-[#6f7178]">
          <div className="absolute left-1/2 top-0 h-[42%] w-[13%] -translate-x-1/2 rounded-b-[6px] bg-gradient-to-b from-[#8a8c93] to-[#a9abb1]" />
        </div>
      </div>
    </div>
  );
}
