import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { MOBILE_APPS, type PhoneApp } from '../content';

const AppsPhone = lazy(() => import('../three/AppsPhone'));
const SCREEN_MS = 3400; // how long an app's screen shows on the iPhone
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Without WebGL the phone just isn't drawn; the names and screens stay.
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Mobile Apps: Bogdan's native iOS apps on a 3D iPhone (three/AppsPhone), each through its screens, then the
 * next app, the phone turning round to it. While the section is on screen it turns them itself. Beside the phone
 * the apps are a deck of cards, the shown one's on top with its name and its screens, each a jump to it: drag the
 * top card aside (or use the arrows) and it goes under the deck, and the phone turns to the next app.
 */
export function AppsSection() {
  const { apps } = MOBILE_APPS;
  const shots = useMemo(() => apps.flatMap((app, a) => app.screens.map((screen) => ({ ...screen, app: a }))), [apps]);
  const images = useMemo(() => shots.map((shot) => shot.image), [shots]);
  const stage = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [warm, setWarm] = useState(false); // the phone loads as the section comes near
  const [active, setActive] = useState(false); // and turns only while it's on screen
  const [held, setHeld] = useState(false); // a card in hand: the screens wait

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ahead = new IntersectionObserver(([entry]) => entry.isIntersecting && setWarm(true), { rootMargin: '100% 0px' });
    const around = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    ahead.observe(el);
    around.observe(el);
    return () => {
      ahead.disconnect();
      around.disconnect();
    };
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

  return (
    <section id="apps" className="bg-[#0C0C0C] px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text={MOBILE_APPS.title} className="mb-4 md:mb-6" />
      <p className="mx-auto max-w-[640px] text-center font-light italic leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.2rem)' }}>
        {MOBILE_APPS.caption}
      </p>

      <div className="mx-auto mt-10 grid max-w-6xl items-center gap-6 md:mt-14 md:grid-cols-[1fr_1.2fr] md:gap-10">
        <div className="order-2 md:order-1">
          <div className="grid pb-8 [&>*]:[grid-area:1/1]">
            {apps.map((one, i) => (
              <Card
                key={one.label}
                app={one}
                depth={(i - app + apps.length) % apps.length}
                count={apps.length}
                shown={i === app ? at - first : -1}
                stack={MOBILE_APPS.stack}
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

        <div ref={stage} className="relative order-1 aspect-[4/5] md:order-2 md:aspect-auto md:h-[640px]">
          {/* the app's colour glowing behind the phone */}
          <div
            className="absolute inset-0 transition-[background] duration-1000"
            style={{ background: `radial-gradient(ellipse 42% 48% at 50% 52%, ${current.tint}3d, transparent 72%)` }}
          />
          {warm && (
            <Quiet>
              <Suspense fallback={null}>
                <div className="absolute inset-0 animate-[fade-in_0.8s_ease-out]">
                  <AppsPhone images={images} shown={at} app={app} active={active} still={still} />
                </div>
              </Suspense>
            </Quiet>
          )}
          <p className="sr-only" aria-live="polite">
            {current.label}: {shots[at].alt}
          </p>
        </div>
      </div>
    </section>
  );
}

// A card of the deck: the app's tagline, its name, its screens (the one on the phone lit) and what it's built with,
// in the app's colour.
// `depth` is its place in the deck, 0 on top: the cards under it peek out below, turned a little. The top card can
// be dragged aside; let go far enough (or flung) and it flips (`onFlip`, -1 back, 1 on) and slides under the deck;
// otherwise it springs back. Turned by the phone (or the arrows), the top card swings out and under all the same.
function Card({ app, depth, count, shown, stack, onScreen, onFlip, onHold }: {
  app: PhoneApp;
  depth: number;
  count: number;
  shown: number; // the screen on the phone, if this app is on it (-1 if not)
  stack: string[];
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
      <motion.div
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
        style={{ x, rotate: tilt, touchAction: 'pan-y', background: `linear-gradient(155deg, ${app.tint}33 0%, transparent 55%), #131418` }}
        className={`relative overflow-hidden rounded-[28px] border border-white/[0.12] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] sm:p-8 ${top ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${app.tint}40` }} />
        <p className="relative text-xs uppercase tracking-[0.25em] text-[#D7E2EA]/55">{app.tagline}</p>
        <p className="hero-heading relative mt-2 select-none font-black leading-none" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.6rem)' }}>
          {app.label}
        </p>
        <ol className="relative mt-6 space-y-1">
          {app.screens.map((screen, k) => (
            <li key={screen.image}>
              <button
                type="button"
                onClick={() => onScreen(k)}
                aria-current={k === shown ? 'true' : undefined}
                className={`flex items-center gap-3 py-1 text-left transition-colors ${k === shown ? 'text-white' : 'text-[#D7E2EA]/45 hover:text-[#D7E2EA]/80'}`}
              >
                <span className="w-6 text-xs tabular-nums" style={k === shown ? { color: app.tint } : undefined}>
                  {String(k + 1).padStart(2, '0')}
                </span>
                {screen.caption}
              </button>
            </li>
          ))}
        </ol>
        <ul className="relative mt-6 flex flex-wrap gap-2">
          {stack.map((tool) => (
            <li key={tool} className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-[#D7E2EA]/70">
              {tool}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
