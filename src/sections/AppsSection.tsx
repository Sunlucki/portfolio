import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { MOBILE_APPS } from '../content';

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
 * next app, the phone turning round to it. While the section is on screen it turns them itself; a pill for each
 * app jumps to it, and beside the phone the app's name and its screens, each a jump to it.
 */
export function AppsSection() {
  const { apps } = MOBILE_APPS;
  const shots = useMemo(() => apps.flatMap((app, a) => app.screens.map((screen) => ({ ...screen, app: a }))), [apps]);
  const images = useMemo(() => shots.map((shot) => shot.image), [shots]);
  const stage = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [warm, setWarm] = useState(false); // the phone loads as the section comes near
  const [active, setActive] = useState(false); // and turns only while it's on screen

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
    if (!active || still) return;
    const next = window.setTimeout(() => setAt((i) => (i + 1) % shots.length), SCREEN_MS);
    return () => window.clearTimeout(next);
  }, [active, at, shots]);

  const { app } = shots[at];
  const current = apps[app];
  const first = shots.findIndex((shot) => shot.app === app);

  return (
    <section id="apps" className="bg-[#0C0C0C] px-4 pb-16 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text="Mobile Apps" className="mb-4 md:mb-6" />
      <p className="mx-auto max-w-[640px] text-center font-light italic leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.2rem)' }}>
        {MOBILE_APPS.caption}
      </p>

      <div className="mx-auto mt-10 grid max-w-6xl items-center gap-6 md:mt-14 md:grid-cols-[1fr_1.2fr] md:gap-10">
        <div className="order-2 md:order-1">
          <nav aria-label="Apps" className="flex flex-wrap gap-2">
            {apps.map((one, i) => (
              <button
                key={one.label}
                type="button"
                onClick={() => setAt(shots.findIndex((shot) => shot.app === i))}
                aria-current={i === app ? 'true' : undefined}
                className={`rounded-full border-2 px-5 py-2 text-xs font-medium uppercase tracking-widest transition-colors sm:text-sm ${
                  i === app ? 'border-[#D7E2EA] bg-[#D7E2EA] text-[#0C0C0C]' : 'border-[#D7E2EA]/30 text-[#D7E2EA]/70 hover:border-[#D7E2EA]/70 hover:text-white'
                }`}
              >
                {one.label}
              </button>
            ))}
          </nav>
          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[#D7E2EA]/50">{current.tagline}</p>
          <p className="hero-heading mt-2 font-black leading-none" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.6rem)' }}>
            {current.label}
          </p>
          <ol className="mt-6 space-y-1">
            {current.screens.map((screen, k) => (
              <li key={screen.image}>
                <button
                  type="button"
                  onClick={() => setAt(first + k)}
                  aria-current={first + k === at ? 'true' : undefined}
                  className={`flex items-center gap-3 py-1 text-left transition-colors ${first + k === at ? 'text-white' : 'text-[#D7E2EA]/45 hover:text-[#D7E2EA]/80'}`}
                >
                  <span className="w-6 text-xs tabular-nums">{String(k + 1).padStart(2, '0')}</span>
                  {screen.caption}
                </button>
              </li>
            ))}
          </ol>
          <ul className="mt-8 flex flex-wrap gap-2">
            {MOBILE_APPS.stack.map((tool) => (
              <li key={tool} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-[#D7E2EA]/70">
                {tool}
              </li>
            ))}
          </ul>
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
