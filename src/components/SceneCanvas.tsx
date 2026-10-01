import { useEffect, useRef } from 'react';
import type { SceneName } from '../three/miniScenes';

// A live 3D cover (src/three/miniScenes.ts, loaded with the first): a canvas the shared renderer draws its scene into
// while it is on screen, marked data-drawn once it has; `top`, the open project's, turned by dragging.
export function SceneCanvas({ scene, top = false, onReady, className = '' }: { scene: SceneName; top?: boolean; onReady?: () => void; className?: string }) {
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
  return <canvas ref={canvas} aria-hidden className={className} />;
}
