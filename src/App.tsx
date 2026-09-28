import { lazy, Suspense } from 'react';
import { HeroSection } from './sections/HeroSection';
import { MarqueeSection } from './sections/MarqueeSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { ContactSection } from './sections/ContactSection';

// Far below the fold and brings matter-js along, so it stays out of the first bundle.
const StackSection = lazy(() => import('./sections/StackSection').then((m) => ({ default: m.StackSection })));

export default function App() {
  return (
    <main className="bg-[#0C0C0C]" style={{ overflowX: 'clip' }}>
      <HeroSection />
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
