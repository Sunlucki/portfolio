import { useEffect, useRef } from 'react';
import type { SceneName } from '../three/miniScenes';

// A live 3D cover (src/three/miniScenes.ts, loaded with the first): a canvas the shared renderer draws its scene into
// while it is on screen, marked data-drawn once it has; `top`, the open project's, turned by dragging; `thing`, which
// of a printed things' scene's things it shows.
export function SceneCanvas({ scene, top = false, thing = 0, onReady, className = '' }: { scene: SceneName; top?: boolean; thing?: number; onReady?: () => void; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(onReady);
  useEffect(() => {
    ready.current = onReady;
  });
  useEffect(() => {
    let alive = true;
    let off = () => {};
    void import('../three/miniScenes').then(({ show }) => {
      const el = canvas.current;
      if (!alive || !el) return;
      off = show(el, scene, {
        top,
        onReady: () => {
          el.dataset.drawn = '';
          ready.current?.();
        },
      });
    });
    return () => {
      alive = false;
      off();
    };
  }, [scene, top]);
  useEffect(() => {
    void import('../three/miniScenes').then(({ pick }) => pick(scene, thing));
  }, [scene, thing]);
  return <canvas ref={canvas} aria-hidden className={className} />;
}
