import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { SectionTitle } from '../components/SectionTitle';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { LangLinks } from '../components/LangSwitch';
import { afterLoad } from '../afterLoad';
import { PERSON } from '../content';
import { fill, t } from '../i18n';

// three.js and friends: loaded and mounted when the browser is idle after load (see below).
const PhoneScene = lazy(() => import('../three/PhoneScene'));

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

// the footer's credits, around the names and links
const C = t.contact.credits;
const [open, close] = C.quotes;

const LINKS = [
  { label: 'LinkedIn', href: PERSON.linkedin },
  { label: 'GitHub', href: PERSON.github },
];

export function ContactSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false); // mount the scene well ahead of the stage…
  const [active, setActive] = useState(false); // …and animate it only while it is around the viewport
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // Setting the scene up is a long task: do it when the browser is idle after load, or at the latest
    // 1.2 s after the page comes within three screens of it, so it never lands in the middle of a scroll.
    const mount = () => setNear(true);
    const early = afterLoad(mount, 5000);
    let fallback = 0;
    const ahead = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fallback) fallback = window.setTimeout(mount, 1200);
      },
      { rootMargin: '300% 0px' },
    );
    const around = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '10% 0px' });
    ahead.observe(stage);
    around.observe(stage);
    return () => {
      ahead.disconnect();
      around.disconnect();
      early();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section id="contact" className="relative overflow-hidden px-5 pb-10 pt-24 sm:px-8 md:px-10 md:pt-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        <SectionTitle text={t.contact.title} className="w-full" />
        {/* The phone: let's call. */}
        <div
          ref={stageRef}
          className="relative aspect-[4/5] w-screen max-w-[560px] sm:w-full"
          style={{ maskImage: FEATHER, maskComposite: 'intersect', WebkitMaskImage: FEATHER, WebkitMaskComposite: 'source-in' }}
        >
          <img
            src="/about/scene.webp"
            alt={t.contact.sceneAlt}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
          />
          {near && (
            <SceneBoundary>
              <Suspense fallback={null}>
                <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
                  <PhoneScene active={active} onReady={onReady} />
                </div>
              </Suspense>
            </SceneBoundary>
          )}
        </div>
        <FadeIn
          as="p"
          delay={0.15}
          className="max-w-[640px] font-light leading-relaxed text-[#D7E2EA]"
          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)' }}
        >
          {fill(t.contact.pitch, { location: PERSON.location })}
        </FadeIn>
        <FadeIn delay={0.3}>
          <Magnet padding={100}>
            <ContactButton label={t.buttons.email} href={`mailto:${PERSON.email}`} />
          </Magnet>
        </FadeIn>
        <FadeIn delay={0.4} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm uppercase tracking-widest text-[#D7E2EA] md:text-base">
          <a href={`mailto:${PERSON.email}`} className="-my-3 inline-flex items-center gap-2 py-3 transition-opacity hover:opacity-70">
            <Mail aria-hidden className="h-4 w-4" />
            {PERSON.email}
          </a>
          {LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="-my-3 inline-flex items-center gap-1 py-3 transition-opacity hover:opacity-70">
              {link.label}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </a>
          ))}
        </FadeIn>
      </div>

      <footer className="relative mx-auto mt-24 max-w-6xl border-t border-[#D7E2EA]/15 pt-6 text-xs uppercase tracking-wider text-[#D7E2EA]/55">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {PERSON.name}
          </span>
          <span>{t.contact.b2b}</span>
        </div>
        <div className="mt-4 text-[#D7E2EA]/55">
          <LangLinks />
        </div>
        <p className="mt-4 text-center text-xs normal-case leading-relaxed tracking-normal text-[#D7E2EA]/55 sm:text-left [&_a]:py-2 [&_a]:underline-offset-2 hover:[&_a]:underline">
          {C.models} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: {open}
          <a href="https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d">iPhone 17 Pro Max</a>
          {close} {C.by} <a href="https://sketchfab.com/MG990">MajdyModels</a>, {C.recoloured}; {open}
          <a href="https://sketchfab.com/3d-models/f22-raptor-e765eb495f0546d7a94fcf48db53ee3b">F22 Raptor</a>
          {close} {C.by} <a href="https://sketchfab.com/alexkahler">Aleksander Kähler</a>, {C.simplified}; {open}
          <a href="https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089">Realistic Human Heart</a>
          {close} {C.by} <a href="https://sketchfab.com/neshallads">neshallads</a> {C.and} {open}
          <a href="https://sketchfab.com/3d-models/low-poly-human-brain-model-781330cf8c6e40508f0de62e2fef8dec">Low-Poly Human Brain Model</a>
          {close} {C.by} <a href="https://sketchfab.com/moaazzizo123">moaazzizo123</a>, {C.particles}. {C.earth} {C.bits}{' '}
          <a href="https://reactbits.dev">React Bits</a>.
        </p>
      </footer>
    </section>
  );
}
