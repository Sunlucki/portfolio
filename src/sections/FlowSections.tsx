import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { flow, type FlowLayer } from '../three/flow';

const FlowScene = lazy(() => import('../three/FlowScene'));

// Without WebGL there is no phone and no particles; the sections stay as they are.
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
 * The Mobile Apps, Graphics, Video and Music sections over one particle scene (three/FlowScene.tsx): a canvas the size
 * of the screen, stuck to it behind them for as long as they are on it (sticky, taking no room: the sections start at
 * its top), so the iPhone built in the Apps section can break up, drift behind the Graphics covers, build the Video
 * section's films and then the Music stage's floor. Loaded as they come near; drawn only while they are on screen (and
 * not under the Video feed).
 * On phones, PLAY tapped, it comes over the page for the phone to fly into the screen.
 */
export function FlowSections({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [layer, setLayer] = useState<FlowLayer>('page');
  useEffect(() => {
    flow.layer = setLayer;
    return () => {
      flow.layer = null;
    };
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ahead = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '100% 0px' });
    const around = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    ahead.observe(el);
    around.observe(el);
    return () => {
      ahead.disconnect();
      around.disconnect();
    };
  }, []);
  const over = layer !== 'page'; // over the page and the sections round it, on the whole screen (under the feed)
  return (
    <div ref={box} className={`relative isolate ${over ? 'z-[95]' : ''}`}>
      <div aria-hidden className={`pointer-events-none w-full ${over ? 'fixed inset-0 z-10' : 'sticky top-0 -z-10 -mb-[100svh] h-svh'}`}>
        {near && (
          <Quiet>
            <Suspense fallback={null}>
              <FlowScene active={active && layer !== 'feed'} />
            </Suspense>
          </Quiet>
        )}
      </div>
      {children}
    </div>
  );
}
