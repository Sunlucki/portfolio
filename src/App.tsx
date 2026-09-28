import { lazy, Suspense, useEffect } from 'react';
import { HeroSection } from './sections/HeroSection';
import { TimelineSection } from './sections/TimelineSection';
import { MarqueeSection } from './sections/MarqueeSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { ContactSection } from './sections/ContactSection';

// Far below the fold and brings matter-js along, so it stays out of the first bundle.
const StackSection = lazy(() => import('./sections/StackSection').then((m) => ({ default: m.StackSection })));

// The 3D cursor (three/cursor3d.ts) for mouse users; touch screens and reduced motion keep the system one.
function Cursor3D() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let unmount: (() => void) | undefined;
    let cancelled = false;
    import('./three/cursor3d').then(({ mountCursor }) => {
      if (!cancelled) unmount = mountCursor();
    });
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <main className="bg-[#0C0C0C]" style={{ overflowX: 'clip' }}>
      <Cursor3D />
      <HeroSection />
      <TimelineSection />
      <MarqueeSection />
      <AboutSection />
      <Suspense fallback={null}>
        <StackSection />
      </Suspense>
      <ServicesSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  );
}
