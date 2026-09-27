import { useEffect, useRef } from 'react';
import { animate, createTimeline, onScroll } from 'animejs';
import { FadeIn } from '../components/FadeIn';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { HERO_FG_FRAMES, HERO_FRAMES, HERO_TAGLINE, NAV, PERSON } from '../content';

type Layer = 'bg' | 'fg';
const frameSrc = (layer: Layer, mobile: boolean, i: number) =>
  `/hero/${layer === 'fg' ? 'fg-' : ''}${mobile ? 'm' : 'd'}/${String(i).padStart(3, '0')}.webp`;

// Request order: the opening frame of both layers first, then every 8th background frame
// (coarse scrubbing works early), the cut-outs, and finally the remaining background frames.
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const LOAD_ORDER: Array<[Layer, number]> = [
  ['bg', 0],
  ['fg', 0],
  ...range(HERO_FRAMES).filter((i) => i > 0 && i % 8 === 0).map((i): [Layer, number] => ['bg', i]),
  ...range(HERO_FG_FRAMES).slice(1).map((i): [Layer, number] => ['fg', i]),
  ...range(HERO_FRAMES).filter((i) => i % 8 !== 0).map((i): [Layer, number] => ['bg', i]),
];

const NAV_TEXT = 'text-sm font-medium uppercase tracking-wider md:text-lg lg:text-[1.4rem]';
const HEADROOM = 0.12; // phones: share of the screen above the subject at the very top of the page
const LOOSE_UNTIL = 0.12; // phones: scroll progress at which the framing is back to full cover

/**
 * Scroll-scrubbed hero in three layers: the full video frame, the headline, and the same frame
 * with its background removed — so the headline sits behind Bogdan. Everything is synced to
 * scroll by one anime.js timeline; the camera ends inside the pupil.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hintDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const bgCanvas = bgRef.current;
    const fgCanvas = fgRef.current;
    const bg = bgCanvas?.getContext('2d');
    const fg = fgCanvas?.getContext('2d');
    const heading = headingRef.current;
    const copy = copyRef.current;
    const shade = shadeRef.current;
    const blackout = blackoutRef.current;
    const hintEl = hintRef.current;
    const hintDot = hintDotRef.current;
    const poster = posterRef.current;
    const tilt = tiltRef.current;
    if (!section || !bgCanvas || !fgCanvas || !bg || !fg || !heading || !copy || !shade || !blackout || !hintEl || !hintDot || !poster || !tilt) return;

    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const frames: Record<Layer, HTMLImageElement[]> = { bg: [], fg: [] };
    const ready: Record<Layer, boolean[]> = { bg: new Array(HERO_FRAMES).fill(false), fg: new Array(HERO_FG_FRAMES).fill(false) };
    let current = 0;
    let progress = 0;
    let raf = 0;
    let wall = '';

    // Desktop: centred cover. Phones: the first frames are drawn a bit smaller and bottom-anchored,
    // leaving headroom for the two-line headline; the framing reaches full cover by LOOSE_UNTIL.
    const place = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      let scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      if (mobile) {
        const loose = (canvas.height * (1 - HEADROOM)) / img.naturalHeight;
        const k = 1 - (1 - Math.min(1, progress / LOOSE_UNTIL)) ** 3;
        scale = loose + (scale - loose) * k;
      }
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      return { x: (canvas.width - w) / 2, y: mobile ? canvas.height - h : (canvas.height - h) / 2, w, h };
    };

    // Average colour of the backdrop's top rows, used to extend the wall above a loosened frame.
    const sampleWall = (img: HTMLImageElement) => {
      const probe = document.createElement('canvas').getContext('2d');
      if (!probe) return;
      probe.drawImage(img, 0, 0, img.naturalWidth, 6, 0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      wall = `${r}, ${g}, ${b}`;
    };

    const paint = () => {
      raf = 0;
      // Closest loaded frame at or before `current`; never jump ahead (the poster equals frame 0).
      let i = current;
      while (i >= 0 && !ready.bg[i]) i--;
      if (i < 0) return;
      const box = place(bgCanvas, frames.bg[i]);
      if (box.y > 0 && wall) {
        const seam = Math.min(box.y, 60 * (bgCanvas.height / bgCanvas.clientHeight));
        bg.fillStyle = `rgb(${wall})`;
        bg.fillRect(0, 0, bgCanvas.width, box.y + 1);
        bg.drawImage(frames.bg[i], box.x, box.y, box.w, box.h);
        const fade = bg.createLinearGradient(0, box.y, 0, box.y + seam);
        fade.addColorStop(0, `rgba(${wall}, 1)`);
        fade.addColorStop(1, `rgba(${wall}, 0)`);
        bg.fillStyle = fade;
        bg.fillRect(0, box.y, bgCanvas.width, seam);
      } else {
        bg.drawImage(frames.bg[i], box.x, box.y, box.w, box.h);
      }
      // The cut-out must match the background frame exactly, otherwise leave the layer empty.
      fg.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
      if (i < HERO_FG_FRAMES && ready.fg[i]) fg.drawImage(frames.fg[i], box.x, box.y, box.w, box.h);
    };
    const requestPaint = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const canvas of [bgCanvas, fgCanvas]) {
        canvas.width = Math.round(canvas.clientWidth * dpr);
        canvas.height = Math.round(canvas.clientHeight * dpr);
      }
      requestPaint();
    };

    for (const [layer, i] of LOAD_ORDER) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        ready[layer][i] = true;
        if (layer === 'bg' && i === 0 && mobile) sampleWall(img);
        requestPaint();
      };
      img.src = frameSrc(layer, mobile, i);
      frames[layer][i] = img;
    }

    resize();
    window.addEventListener('resize', resize);

    const playhead = { frame: 0 };
    const observer = onScroll({ target: section, enter: 'top top', leave: 'bottom bottom', sync: 0.5 });
    const timeline = createTimeline({
      autoplay: observer,
      onUpdate: () => {
        current = Math.round(playhead.frame);
        progress = playhead.frame / (HERO_FRAMES - 1);
        requestPaint();
      },
    });
    timeline
      .add(playhead, { frame: [0, HERO_FRAMES - 1], duration: 1000, ease: 'linear' }, 0)
      .add(heading, { opacity: [1, 0], y: [0, -80], duration: 240, ease: 'inQuad' }, 0)
      .add(copy, { opacity: [1, 0], y: [0, -120], duration: 260, ease: 'inQuad' }, 0)
      .add(hintEl, { opacity: [1, 0], duration: 100, ease: 'linear' }, 0)
      .add(shade, { opacity: [1, 0], duration: 420, ease: 'linear' }, 0)
      .add(blackout, { opacity: [0, 1], duration: 140, ease: 'linear' }, 860);

    const hint = animate(hintDot, { y: [0, 26], opacity: [1, 0], duration: 1600, ease: 'inOutSine', loop: true });

    // Mouse depth: the scene (video + cut-out, moved together so the subject never doubles) drifts
    // against the cursor; the headline drifts less and tilts, so it reads as sitting behind Bogdan.
    const depth = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const aim = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let depthRaf = 0;
    let inView = true;
    const onPointer = (e: PointerEvent) => {
      aim.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onPointerLeave = () => {
      aim.x = 0;
      aim.y = 0;
    };
    const tick = () => {
      depthRaf = requestAnimationFrame(tick);
      if (!inView) return;
      pos.x += (aim.x - pos.x) * 0.06;
      pos.y += (aim.y - pos.y) * 0.06;
      const dx = -pos.x * 16;
      const dy = -pos.y * 10;
      const scene = `translate3d(${dx}px, ${dy}px, 0) scale(1.06)`;
      poster.style.transform = scene;
      bgCanvas.style.transform = scene;
      fgCanvas.style.transform = scene;
      tilt.style.transform = `translate3d(${dx * 0.45}px, ${dy * 0.45}px, 0) rotateY(${pos.x * 6}deg) rotateX(${-pos.y * 4}deg)`;
    };
    const visibility = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    if (depth) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onPointerLeave);
      visibility.observe(section);
      tick();
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      visibility.disconnect();
      if (depthRaf) cancelAnimationFrame(depthRaf);
      if (raf) cancelAnimationFrame(raf);
      for (const layer of ['bg', 'fg'] as const) frames[layer].forEach((img) => (img.onload = null));
      hint.revert();
      timeline.revert();
      observer.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="top" aria-label="Intro" className="relative h-[220vh] md:h-[290vh]">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* 1 · full video frame */}
        <img ref={posterRef} src="/hero/poster.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={bgRef} aria-hidden className="absolute inset-0 h-full w-full" />

        {/* 2 · headline, behind the subject. An invisible copy of the nav keeps the template spacing. */}
        <div ref={headingRef} className="pointer-events-none absolute inset-x-0 top-0 z-10" style={{ perspective: '1000px' }}>
          <div ref={tiltRef} style={{ willChange: 'transform' }}>
            <div aria-hidden className={`invisible px-6 pt-6 md:px-10 md:pt-8 ${NAV_TEXT}`}>
              About
            </div>
            <div className="overflow-hidden">
              <FadeIn
                as="h1"
                delay={0.15}
                y={40}
                className="hero-heading mt-6 w-full whitespace-nowrap text-center text-[19vw] font-black uppercase leading-[0.88] tracking-tight sm:mt-4 sm:text-[12.4vw] sm:leading-none md:-mt-5 md:text-[13.2vw] lg:text-[14.2vw]"
              >
                Hi, i’m <br className="sm:hidden" />
                {PERSON.firstName}
              </FadeIn>
            </div>
          </div>
        </div>

        {/* 3 · the same frame with the background removed */}
        <canvas ref={fgRef} aria-hidden className="absolute inset-0 z-20 h-full w-full" />

        {/* Legibility gradients above every layer, so subject and background are shaded alike */}
        <div ref={shadeRef} aria-hidden className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0C0C0C]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#0C0C0C]/90 via-[#0C0C0C]/40 to-transparent" />
        </div>

        <div ref={copyRef} className="relative z-40 flex h-full flex-col">
          <FadeIn as="nav" y={-20} aria-label="Main" className="flex justify-between px-6 pt-6 md:px-10 md:pt-8">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className={`text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 ${NAV_TEXT}`}>
                {item.label}
              </a>
            ))}
          </FadeIn>

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
          className="pointer-events-none absolute bottom-8 left-1/2 z-40 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/70">Scroll</span>
          <span className="relative block h-8 w-px overflow-hidden bg-[#D7E2EA]/20">
            <span ref={hintDotRef} className="absolute left-0 top-0 block h-2 w-px bg-[#D7E2EA]" />
          </span>
        </div>

        <div ref={blackoutRef} aria-hidden className="pointer-events-none absolute inset-0 z-50 bg-[#0C0C0C] opacity-0" />
      </div>
    </section>
  );
}
