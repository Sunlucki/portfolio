import { useEffect, useRef } from 'react';
import { animate, createTimeline, onScroll } from 'animejs';
import { FadeIn } from '../components/FadeIn';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { HERO_FRAMES, HERO_TAGLINE, NAV, PERSON } from '../content';

const frameSrc = (set: 'd' | 'm', i: number) => `/hero/${set}/${String(i).padStart(3, '0')}.webp`;

// Load order: first frame, then every 8th frame (coarse scrubbing works early), then the rest.
const LOAD_ORDER = [
  ...Array.from({ length: HERO_FRAMES }, (_, i) => i).filter((i) => i % 8 === 0),
  ...Array.from({ length: HERO_FRAMES }, (_, i) => i).filter((i) => i % 8 !== 0),
];

/**
 * Scroll-scrubbed hero: the section is taller than the viewport and pins a canvas that plays
 * the "camera flies into the eye" clip frame by frame, synced to scroll with anime.js.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hintDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!section || !canvas || !ctx || !copyRef.current || !shadeRef.current || !blackoutRef.current || !hintRef.current || !hintDotRef.current) return;

    const set = window.matchMedia('(max-width: 767px)').matches ? 'm' : 'd';
    const frames: HTMLImageElement[] = [];
    const ready: boolean[] = new Array(HERO_FRAMES).fill(false);
    let current = 0;
    let raf = 0;

    const nearestReady = (i: number) => {
      for (let d = 0; d < HERO_FRAMES; d++) {
        if (i - d >= 0 && ready[i - d]) return i - d;
        if (i + d < HERO_FRAMES && ready[i + d]) return i + d;
      }
      return -1;
    };

    const paint = () => {
      raf = 0;
      const i = nearestReady(current);
      if (i < 0) return;
      const img = frames[i];
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    const requestPaint = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      requestPaint();
    };

    for (const i of LOAD_ORDER) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        ready[i] = true;
        requestPaint();
      };
      img.src = frameSrc(set, i);
      frames[i] = img;
    }

    resize();
    window.addEventListener('resize', resize);

    const playhead = { frame: 0 };
    const observer = onScroll({ target: section, enter: 'top top', leave: 'bottom bottom', sync: 0.5 });
    const timeline = createTimeline({
      autoplay: observer,
      onUpdate: () => {
        current = Math.round(playhead.frame);
        requestPaint();
      },
    });
    timeline
      .add(playhead, { frame: [0, HERO_FRAMES - 1], duration: 1000, ease: 'linear' }, 0)
      .add(copyRef.current, { opacity: [1, 0], y: [0, -120], duration: 260, ease: 'inQuad' }, 0)
      .add(hintRef.current, { opacity: [1, 0], duration: 100, ease: 'linear' }, 0)
      .add(shadeRef.current, { opacity: [1, 0], duration: 420, ease: 'linear' }, 0)
      .add(blackoutRef.current, { opacity: [0, 1], duration: 140, ease: 'linear' }, 860);

    const hint = animate(hintDotRef.current, { y: [0, 26], opacity: [1, 0], duration: 1600, ease: 'inOutSine', loop: true });

    return () => {
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
      frames.forEach((img) => (img.onload = null));
      hint.revert();
      timeline.revert();
      observer.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="top" aria-label="Intro" className="relative h-[220vh] md:h-[290vh]">
      <div className="sticky top-0 flex h-svh w-full flex-col overflow-hidden">
        <img src="/hero/poster.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
        <div
          ref={shadeRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0C0C0C]/85 via-[#0C0C0C]/25 to-[#0C0C0C]/90"
        />
        <div ref={blackoutRef} aria-hidden className="pointer-events-none absolute inset-0 bg-[#0C0C0C] opacity-0" />

        <div ref={copyRef} className="relative z-10 flex h-full flex-col">
          <FadeIn as="nav" y={-20} aria-label="Main" className="flex justify-between px-6 pt-6 md:px-10 md:pt-8">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium uppercase tracking-wider text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 md:text-lg lg:text-[1.4rem]"
              >
                {item.label}
              </a>
            ))}
          </FadeIn>

          <div className="overflow-hidden">
            <FadeIn
              as="h1"
              delay={0.15}
              y={40}
              className="hero-heading mt-6 w-full whitespace-nowrap text-center text-[11.6vw] font-black uppercase leading-none tracking-tight sm:mt-4 sm:text-[12.4vw] md:-mt-5 md:text-[13.2vw] lg:text-[14.2vw]"
            >
              Hi, i’m {PERSON.firstName}
            </FadeIn>
          </div>

          <div className="mt-auto flex items-end justify-between gap-6 px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
            <FadeIn
              as="p"
              delay={0.35}
              y={20}
              className="max-w-[160px] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[220px] md:max-w-[260px]"
              style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)' }}
            >
              {HERO_TAGLINE}
            </FadeIn>
            <FadeIn delay={0.5} y={20}>
              <Magnet padding={80} strength={4}>
                <ContactButton />
              </Magnet>
            </FadeIn>
          </div>
        </div>

        <div
          ref={hintRef}
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/70">Scroll</span>
          <span className="relative block h-8 w-px overflow-hidden bg-[#D7E2EA]/20">
            <span ref={hintDotRef} className="absolute left-0 top-0 block h-2 w-px bg-[#D7E2EA]" />
          </span>
        </div>
      </div>
    </section>
  );
}
