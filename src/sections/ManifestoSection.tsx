import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PHRASES, phraseRuns, phraseText } from '../content';
import { handoffLength } from '../three/aboutStage';
import type { ManifestoBridge } from '../three/ManifestoScene';

const loadScene = () => import('../three/ManifestoScene');
const ManifestoScene = lazy(loadScene);
const PHRASE_VH = 70; // scroll length per shape
const HOLD_VH = 45; // the last phrase, over the eye, stays a little longer
const TRACK_VH = PHRASES.length * PHRASE_VH + HOLD_VH;
// The section starts on top of the hero's last 29% (from frame 58, as the camera nears the pupil) so the
// particle iris can form over the real one: 29% of the hero's 120vh / 190vh of scroll.
const OVERLAP = '-mt-[135.2vh] [--overlap:35.2vh] md:-mt-[155.7vh] md:[--overlap:55.7vh]';

// Without WebGL the scene throws; the phrases are then shown as plain text.
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

// Where the About stage is centred: the hand-over is done (aboutStage.ts).
function handedOver() {
  const about = document.getElementById('about');
  const stage = about?.querySelector('[data-about-stage]');
  if (!about || !stage) return true;
  const vh = document.documentElement.clientHeight;
  const section = about.getBoundingClientRect();
  return vh - section.top >= handoffLength(section, stage.getBoundingClientRect(), vh);
}

/**
 * As the hero's camera nears the eye, a particle iris forms over the real one; the camera flies into the
 * pupil and out into a cloud that takes a shape for every phrase, with the phrase written in particles
 * underneath (three/ManifestoScene.tsx). At the end the About section slides over this one (by
 * --handoff, which this section grows by, so nothing below moves) and the particles assemble its scene.
 * The layer is screen-blended, so its black is see-through over the hero.
 */
export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bridge = useRef<ManifestoBridge | null>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [idle, setIdle] = useState(false);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const about = document.getElementById('about');
    bridge.current = {
      section,
      hero: document.getElementById('top'),
      video: document.querySelector<HTMLCanvasElement>('canvas[data-hero-video]'),
      about,
      stage: about?.querySelector<HTMLElement>('[data-about-stage]') ?? null,
      track: TRACK_VH / PHRASE_VH,
      idle: setIdle,
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
    const idleFetch = window.requestIdleCallback?.(() => void loadScene()) ?? window.setTimeout(() => void loadScene(), 1500);
    return () => {
      observer.disconnect();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleFetch);
      else window.clearTimeout(idleFetch);
    };
  }, []);

  // The hand-over's scroll length, from the About section's layout. Its link lands where it ends.
  useEffect(() => {
    const about = document.getElementById('about');
    const stage = about?.querySelector('[data-about-stage]');
    if (failed || !about || !stage) return;
    const root = document.documentElement;
    const measure = () => {
      const length = handoffLength(about.getBoundingClientRect(), stage.getBoundingClientRect(), root.clientHeight);
      root.style.setProperty('--handoff', `${Math.round(length)}px`);
      about.style.scrollMarginTop = `${Math.round(root.clientHeight - length)}px`;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(about);
    window.addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--handoff');
      about.style.scrollMarginTop = '';
    };
  }, [failed]);

  // Asleep once the About scene has taken over; wake up when the page scrolls back into the hand-over.
  useEffect(() => {
    if (!idle) return;
    const onScroll = () => !handedOver() && setIdle(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [idle]);

  if (failed) {
    return (
      <section id="manifesto" aria-label="Manifesto" className="bg-[#0C0C0C] px-5 py-24 sm:px-8 md:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-12 text-center">
          {PHRASES.map((phrase) => (
            <p key={phrase} className="font-semibold leading-tight text-[#eef4ff]" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.6rem)' }}>
              {phraseRuns(phrase).map((run, k) =>
                run.mark === 'plain' ? (
                  run.text
                ) : (
                  <span key={k} className={run.mark === 'hi' ? 'font-extrabold text-[#7fc8ff]' : 'text-[#eef4ff]/50 line-through decoration-[#ff66c4]'}>
                    {run.text}
                  </span>
                ),
              )}
            </p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      aria-label="Manifesto"
      className={`relative ${OVERLAP}`}
      style={{ height: `calc(var(--overlap) + ${TRACK_VH}vh + var(--handoff, 0px) + 100svh)` }}
    >
      <div className="pointer-events-none sticky top-0 h-svh w-full overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        {near && (
          <SceneBoundary onError={onError}>
            <Suspense fallback={null}>
              <ManifestoScene active={active && !idle} bridge={bridge} />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="sr-only">
        {PHRASES.map((phrase) => (
          <p key={phrase}>{phraseText(phrase)}</p>
        ))}
      </div>
    </section>
  );
}
