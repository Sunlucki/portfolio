import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatedText } from '../components/AnimatedText';
import { ContactButton } from '../components/Buttons';
import { CountUp } from '../components/CountUp';
import { SectionTitle } from '../components/SectionTitle';
import { ABOUT_TEXT, STATS } from '../content';

// three.js and friends load only when the section gets close.
const AboutScene = lazy(() => import('../three/AboutScene'));

// Without WebGL the scene throws — the poster underneath simply stays.
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Feathered edges (two gradients intersected), so the canvas melts into the page.
const FEATHER = 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent), linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)';

export function AboutSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false); // mount the scene once the stage gets close…
  const [active, setActive] = useState(false); // …and render frames only while it is around the viewport
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '100% 0px' }, // early: the manifesto hands over to this scene
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    // Slides over the end of the manifesto, whose particles assemble the stage's scene (ManifestoSection).
    <section id="about" className="relative overflow-hidden px-5 py-24 sm:px-8 md:px-10 md:py-32" style={{ marginTop: 'calc(-1 * var(--handoff, 0px))' }}>
      <SectionTitle text="About me" className="mx-auto max-w-6xl" />

      <div className="mx-auto mt-2 grid max-w-7xl items-center gap-6 md:mt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-4">
        <div
          ref={stageRef}
          data-about-stage
          className="relative -mx-5 aspect-[4/5] sm:-mx-8 sm:aspect-square md:mx-0 lg:aspect-auto lg:h-[min(88vh,820px)]"
          style={{ maskImage: FEATHER, maskComposite: 'intersect', WebkitMaskImage: FEATHER, WebkitMaskComposite: 'source-in', opacity: 'var(--reveal, 1)' }}
        >
          <img
            src="/about/scene.webp"
            alt="Bogdan Nenadović floating above a glowing iPhone"
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
          />
          {near && (
            <SceneBoundary>
              <Suspense fallback={null}>
                <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
                  <AboutScene active={active} onReady={onReady} />
                </div>
              </Suspense>
            </SceneBoundary>
          )}
        </div>

        <div className="flex flex-col items-center gap-10 sm:gap-12 lg:items-start lg:pr-4">
          <AnimatedText
            text={ABOUT_TEXT}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA] lg:text-left"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
          <ul className="grid w-full max-w-[560px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <li key={s.label} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <span className="hero-heading text-4xl font-black leading-none md:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </span>
                <span className="mt-2 text-xs uppercase leading-snug tracking-wider text-[#D7E2EA]/60">{s.label}</span>
              </li>
            ))}
          </ul>
          <ContactButton />
        </div>
      </div>
    </section>
  );
}
