import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { TIMELINE } from '../content';
import type { TimelineBridge, TimelineStage } from '../three/TimelineScene';

const loadScene = () => import('../three/TimelineScene');
const TimelineScene = lazy(loadScene);
const STAGES: TimelineStage[] = TIMELINE.map(({ label, title, line }) => ({ year: label, title, line }));
const STAGE_VH = 62; // scroll length per stage
// The section starts on top of the hero's last 29% (from frame 58, as the camera nears the pupil) so the
// particle iris can form over the real one: 29% of the hero's 120vh / 190vh of scroll.
const OVERLAP = '-mt-[135.2vh] [--overlap:35.2vh] md:-mt-[155.7vh] md:[--overlap:55.7vh]';

// Without WebGL the scene throws; the stages are then shown as a plain list.
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * As the hero's camera nears the eye, a particle iris forms over the real one; the camera flies into the
 * pupil and out into a cloud of particles that spells out the career, stage by stage
 * (three/TimelineScene.tsx). The layer is screen-blended, so its black is see-through over the hero.
 */
export function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const bridge = useRef<TimelineBridge | null>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    bridge.current = {
      section,
      hero: document.getElementById('top'),
      video: document.querySelector<HTMLCanvasElement>('canvas[data-hero-video]'),
      counter: counterRef.current,
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(section);
    // The scene is the next thing on the page: fetch it as soon as the browser is idle.
    const idle = window.requestIdleCallback?.(() => void loadScene()) ?? window.setTimeout(() => void loadScene(), 1500);
    return () => {
      observer.disconnect();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  const list = (
    <ol className={failed ? 'mx-auto flex max-w-2xl flex-col gap-10' : 'sr-only'}>
      {TIMELINE.map((stage) => (
        <li key={stage.label} className={failed ? 'border-l border-[#4f8dff]/40 pl-6' : undefined}>
          <p className={failed ? 'text-5xl font-black leading-none text-[#eaf2ff]' : undefined}>{stage.label}</p>
          <p className={failed ? 'mt-3 text-xl font-semibold uppercase text-white' : undefined}>{stage.title}</p>
          <p className={failed ? 'mt-2 leading-relaxed text-[#D7E2EA]/75' : undefined}>{stage.text}</p>
        </li>
      ))}
    </ol>
  );

  if (failed) {
    return (
      <section id="journey" aria-label="Career timeline" className="bg-[#0C0C0C] px-5 py-24 sm:px-8 md:px-10">
        {list}
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="journey"
      aria-label="Career timeline"
      className={`relative ${OVERLAP}`}
      style={{ height: `calc(var(--overlap) + ${(TIMELINE.length + 1) * STAGE_VH}vh + 100svh)` }}
    >
      <div className="pointer-events-none sticky top-0 h-svh w-full overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        {near && (
          <SceneBoundary onError={onError}>
            <Suspense fallback={null}>
              <TimelineScene active={active} stages={STAGES} bridge={bridge} />
            </Suspense>
          </SceneBoundary>
        )}
        <p
          ref={counterRef}
          aria-hidden
          className="absolute right-5 top-5 z-10 text-xs uppercase tabular-nums tracking-[0.3em] text-[#D7E2EA]/60 opacity-0 md:right-10 md:top-8"
        >
          01 / {String(TIMELINE.length).padStart(2, '0')}
        </p>
      </div>
      {list}
    </section>
  );
}
