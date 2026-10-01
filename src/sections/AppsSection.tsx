import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { MOBILE_APPS, type PhoneApp } from '../content';
import { flow } from '../three/flow';

const SCREEN_MS = 3400; // how long an app's screen shows on the iPhone
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// the web projects' cards, which these are drawn after
const RADIUS = 'rounded-[40px] sm:rounded-[50px]';

/**
 * Mobile Apps: Bogdan's native iOS apps on a 3D iPhone, each through its screens, then the next app, the phone
 * turning round to it. The phone is drawn by the particle scene behind the section (three/FlowScene.tsx, which
 * builds it out of particles here and takes them on to the Video section): this section gives it its place (the
 * stage, [data-flow="apps"]) and what is on its screen (flow.phone). While the section is on screen it turns the
 * screens itself. Beside the phone the apps are a deck of cards like the web projects', the shown one's on top with
 * its screens, each a jump to it: drag the top card aside (or use the arrows) and it goes under the deck, and the
 * phone turns to the next app.
 */
export function AppsSection() {
  const { apps } = MOBILE_APPS;
  const shots = useMemo(() => apps.flatMap((app, a) => app.screens.map((screen) => ({ ...screen, app: a }))), [apps]);
  const stage = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [active, setActive] = useState(false); // the screens turn only while the section is on screen
  const [held, setHeld] = useState(false); // a card in hand: the screens wait

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const around = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    around.observe(el);
    return () => around.disconnect();
  }, []);
  useEffect(() => {
    if (!active || held || still) return;
    const next = window.setTimeout(() => setAt((i) => (i + 1) % shots.length), SCREEN_MS);
    return () => window.clearTimeout(next);
  }, [active, held, at, shots]);

  const { app } = shots[at];
  const current = apps[app];
  const first = shots.findIndex((shot) => shot.app === app);
  const turnTo = (i: number) => setAt(shots.findIndex((shot) => shot.app === (i + apps.length) % apps.length));
  // what the phone shows, for the scene
  useEffect(() => {
    flow.phone = { images: shots.map((shot) => shot.image), shown: at, app };
  }, [shots, at, app]);

  return (
    <section id="apps" className="px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <div className="text-shade">
        <SectionTitle text={MOBILE_APPS.title} className="mb-4 md:mb-6" />
        <p className="mx-auto max-w-[640px] text-center font-light italic leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.2rem)' }}>
          {MOBILE_APPS.caption}
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl items-center gap-6 md:mt-14 md:grid-cols-[1fr_1.2fr] md:gap-10">
        <div className="order-2 md:order-1">
          <div className="grid pb-8 [&>*]:[grid-area:1/1]">
            {apps.map((one, i) => (
              <Card
                key={one.label}
                app={one}
                index={i}
                depth={(i - app + apps.length) % apps.length}
                count={apps.length}
                shown={i === app ? at - first : -1}
                onScreen={(k) => setAt(first + k)}
                onFlip={(way) => turnTo(app + way)}
                onHold={setHeld}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => turnTo(app - 1)}
              aria-label={MOBILE_APPS.previous}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#D7E2EA]/25 text-[#D7E2EA]/75 transition-colors hover:border-[#D7E2EA]/70 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => turnTo(app + 1)}
              aria-label={MOBILE_APPS.next}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#D7E2EA]/25 text-[#D7E2EA]/75 transition-colors hover:border-[#D7E2EA]/70 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="ml-1 text-xs uppercase tracking-[0.2em] text-[#D7E2EA]/40">{MOBILE_APPS.drag}</span>
          </div>
        </div>

        {/* the phone's place: the scene behind draws it here */}
        <div ref={stage} data-flow="apps" className="relative order-1 aspect-[4/5] md:order-2 md:aspect-auto md:h-[640px]">
          <p className="sr-only" aria-live="polite">
            {current.label}: {shots[at].alt}
          </p>
        </div>
      </div>
    </section>
  );
}

// A card of the deck, drawn like the web projects' cards: its number, the app's tagline and name, and its screens
// (the one on the phone lit). `depth` is its place in the deck, 0 on top: the cards under it peek out below, turned
// a little. The top card can be dragged aside; let go far enough (or flung) and it flips (`onFlip`, -1 back, 1 on)
// and slides under the deck; otherwise it springs back. Turned by the phone (or the arrows), the top card swings out
// and under all the same.
function Card({ app, index, depth, count, shown, onScreen, onFlip, onHold }: {
  app: PhoneApp;
  index: number;
  depth: number;
  count: number;
  shown: number; // the screen on the phone, if this app is on it (-1 if not)
  onScreen: (k: number) => void;
  onFlip: (way: number) => void;
  onHold: (held: boolean) => void;
}) {
  const x = useMotionValue(0);
  const tilt = useTransform(x, [-320, 320], [-12, 12]);
  const top = depth === 0;
  const was = useRef(depth);
  const flung = useRef(false);
  useEffect(() => {
    if (was.current === 0 && depth !== 0 && !flung.current && !still) void animate(x, [0, -200, 0], { duration: 0.7, times: [0, 0.45, 1], ease: 'easeInOut' });
    was.current = depth;
    flung.current = false;
  }, [depth, x]);

  return (
    <motion.div
      initial={false}
      animate={{ y: depth * 22, scale: 1 - depth * 0.05, rotate: depth === 0 ? 0 : depth % 2 ? 2.5 : -2.5, opacity: depth < 3 ? 1 : 0, filter: `brightness(${1 - depth * 0.3})` }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      style={{ zIndex: count - depth, transformOrigin: '50% 0%' }}
      inert={!top}
      aria-hidden={!top}
    >
      <motion.article
        drag={top ? 'x' : false}
        dragSnapToOrigin
        dragElastic={0.85}
        onDragStart={() => onHold(true)}
        onDragEnd={(_, info) => {
          onHold(false);
          const swing = info.offset.x + info.velocity.x * 0.25;
          if (Math.abs(swing) < 120) return;
          flung.current = true;
          onFlip(swing < 0 ? 1 : -1);
        }}
        style={{ x, rotate: tilt, touchAction: 'pan-y' }}
        className={`relative border-2 border-[#D7E2EA] bg-[#0C0C0C] p-6 sm:p-8 ${RADIUS} ${top ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <span className="hero-heading shrink-0 select-none font-black leading-none" style={{ fontSize: 'clamp(3rem, 7vw, 96px)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-[#D7E2EA]/60 sm:text-sm">{app.tagline}</p>
            <h3 className="select-none font-medium uppercase leading-tight text-[#D7E2EA]" style={{ fontSize: 'clamp(1.25rem, 2.6vw, 2.4rem)' }}>
              {app.label}
            </h3>
          </div>
        </div>
        <ol className="mt-6 flex flex-wrap gap-2">
          {app.screens.map((screen, k) => (
            <li key={screen.image}>
              <button
                type="button"
                onClick={() => onScreen(k)}
                aria-current={k === shown ? 'true' : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  k === shown ? 'bg-[#D7E2EA] text-[#0C0C0C]' : 'border border-[#D7E2EA]/30 text-[#D7E2EA]/70 hover:border-[#D7E2EA]/70 hover:text-white'
                }`}
              >
                {screen.caption}
              </button>
            </li>
          ))}
        </ol>
      </motion.article>
    </motion.div>
  );
}
