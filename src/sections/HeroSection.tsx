import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, createTimeline, onScroll } from 'animejs';
import { FadeIn } from '../components/FadeIn';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { ScrollHint } from '../components/ScrollHint';
import { LangSwitch } from '../components/LangSwitch';
import MicroSlats from '../vendor/react-bits/MicroSlats';
import TechText from '../vendor/react-bits/TechText';
import { HERO_FG_FRAMES, HERO_FRAMES, HERO_TAGLINE, NAV } from '../content';
import { FONT, fill, t } from '../i18n';
import heroMotion from '../heroMotion.json';
import { createHeroVeil } from './heroVeil';

type Layer = 'bg' | 'fg';
const FRAMES_VERSION = 2; // bump when the frames are regenerated: nginx caches /hero/ for 30 days
// Per pair of frames: the camera's zoom s about the normalised point (cx, cy) — scripts/estimate-motion.py.
const HERO_MOTION = heroMotion as Array<[number, number, number]>;
const frameSrc = (layer: Layer, mobile: boolean, i: number) =>
  `/hero/${layer === 'fg' ? 'fg-' : ''}${mobile ? 'm' : 'd'}/${String(i).padStart(3, '0')}.webp?v=${FRAMES_VERSION}`;

// The opening shows the cut-out over the animated backdrop, so cut-outs load first; then every
// 8th video frame (coarse scrubbing works early) and finally the rest.
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const LOAD_ORDER: Array<[Layer, number]> = [
  ['fg', 0],
  ['bg', 0],
  ...range(HERO_FG_FRAMES).slice(1).map((i): [Layer, number] => ['fg', i]),
  ...range(HERO_FRAMES).filter((i) => i > 0 && i % 8 === 0).map((i): [Layer, number] => ['bg', i]),
  ...range(HERO_FRAMES).filter((i) => i % 8 !== 0).map((i): [Layer, number] => ['bg', i]),
];

// On narrow phones the links shrink a little to fit side by side (Montserrat, set for Cyrillic, runs wider than
// Kanit: smaller still, and closer).
const NAV_TEXT = `${
  FONT === 'Montserrat' ? 'text-[clamp(10px,3.1vw,0.75rem)] tracking-normal sm:text-sm sm:tracking-wider' : 'text-[clamp(11px,3.6vw,0.875rem)] tracking-wider'
} whitespace-nowrap font-medium uppercase md:text-lg lg:text-[1.4rem]`;
const HEADROOM = 0.12; // phones: share of the screen above the subject at the very top of the page
const LOOSE_UNTIL = 0.12; // phones: scroll progress at which the framing is back to full cover
const HOODIE_BLUE = '#1261d6'; // sampled from the hoodie
const IDLE_MS = 3000; // touch screens: nothing touched or scrolled this long on the hero, and it hints (above)
const HEADLINE = { fontFamily: FONT, fontWeight: 900, fontSize: 400, color: '#BBCCD7', accentColor: '#7FB0FF' } as const;

/**
 * Scroll-scrubbed hero, back to front:
 *   Micro Slats backdrop (React Bits, hoodie blue) → the video frames (fade in as the camera moves in)
 *   → Tech Text headline → the frames with the background removed, so the headline sits behind Bogdan.
 * Between two frames the camera's zoom is interpolated while they cross-fade, so scrubbing feels continuous.
 * The cut-out is shown through Dither Veil (heroVeil.ts): a 1-bit print the pointer burns through, with
 * chromatic aberration around the silhouette.
 * One anime.js timeline drives everything from the scroll position; the camera ends inside the pupil.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const slatsRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hintDotRef = useRef<HTMLSpanElement>(null);
  const [slatsPaused, setSlatsPaused] = useState(false);
  // touch screens: a finger shows to swipe (ScrollHint) as the page opens, and again whenever the hero has been idle
  // for IDLE_MS (the print back)
  const [hinting, setHinting] = useState(false);
  const nudge = useRef({ next: 0, on: false });
  const hintDone = useCallback(() => {
    nudge.current = { next: performance.now() + IDLE_MS, on: false };
    setHinting(false);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const slats = slatsRef.current;
    const bgCanvas = bgRef.current;
    const fgCanvas = fgRef.current;
    const bg = bgCanvas?.getContext('2d');
    // The cut-out is composited off screen, then drawn through the Dither Veil shader onto fgCanvas.
    const fgSource = document.createElement('canvas');
    const fg = fgSource.getContext('2d');
    const heading = headingRef.current;
    const tilt = tiltRef.current;
    const copy = copyRef.current;
    const shade = shadeRef.current;
    const blackout = blackoutRef.current;
    const hintEl = hintRef.current;
    const hintDot = hintDotRef.current;
    if (!section || !slats || !bgCanvas || !fgCanvas || !bg || !fg || !heading || !tilt || !copy || !shade || !blackout || !hintEl || !hintDot) return;

    const mobile = window.matchMedia('(max-width: 767px)').matches; // lighter 1280 px frame set
    const phone = window.matchMedia('(max-width: 639px)').matches; // two-line headline → loosened framing
    const frames: Record<Layer, HTMLImageElement[]> = { bg: [], fg: [] };
    const ready: Record<Layer, boolean[]> = { bg: new Array(HERO_FRAMES).fill(false), fg: new Array(HERO_FG_FRAMES).fill(false) };
    let position = 0; // fractional frame index
    let progress = 0;
    let slatsOff = false;
    let raf = 0;
    let velocity = 0; // scroll speed, progress per second
    const veil = createHeroVeil(fgCanvas, fgSource);
    let sourceChanged = true;

    // Desktop: centred cover. Phones: the first frames are drawn a bit smaller and bottom-anchored,
    // leaving headroom (filled by the backdrop) for the two-line headline.
    const place = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      let scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      if (phone) {
        const loose = (canvas.height * (1 - HEADROOM)) / img.naturalHeight;
        const k = 1 - (1 - Math.min(1, progress / LOOSE_UNTIL)) ** 3;
        scale = loose + (scale - loose) * k;
      }
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      return [(canvas.width - w) / 2, phone ? canvas.height - h : (canvas.height - h) / 2, w, h] as const;
    };

    // Draws the frame at `position`. Between frames i and i+1 the camera's zoom is interpolated: frame i
    // grows towards the next framing while i+1 fades in over it from its smaller size, so in-between
    // positions look like real in-between frames rather than a double exposure. Frame i always covers
    // the canvas, which keeps the edges filled while i+1 is still smaller than the screen.
    const drawLayer = (layer: Layer, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, count: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const base = Math.floor(position);
      if (layer === 'fg' && base >= count) return;
      let i = Math.min(base, count - 1);
      while (i >= 0 && !ready[layer][i]) i--;
      if (i < 0) return;
      const [x, y, w, h] = place(canvas, frames[layer][i]);
      const t = i === base ? position - base : 0;
      if (t === 0 || i + 1 >= HERO_FRAMES) {
        ctx.drawImage(frames[layer][i], x, y, w, h);
        return;
      }
      const [s, cx, cy] = HERO_MOTION[i];
      const ox = x + cx * w;
      const oy = y + cy * h;
      const zoomed = (k: number) => [ox + (x - ox) * k, oy + (y - oy) * k, w * k, h * k] as const;
      ctx.drawImage(frames[layer][i], ...zoomed(s ** t));
      if (i + 1 < count && ready[layer][i + 1]) {
        ctx.globalAlpha = t;
        ctx.drawImage(frames[layer][i + 1], ...zoomed(s ** (t - 1)));
        ctx.globalAlpha = 1;
      }
    };

    // Asks the browser to decode the frames around the playhead ahead of drawing them: Safari otherwise
    // decodes a 1920 px frame on the spot when it is first drawn, in the middle of a scroll frame.
    const decodedAt: Record<Layer, number[]> = { bg: [], fg: [] };
    const predecode = (layer: Layer, count: number) => {
      const now = performance.now();
      for (let i = Math.max(0, Math.floor(position) - 1); i <= Math.min(count - 1, Math.floor(position) + 4); i++) {
        if (!ready[layer][i] || now - (decodedAt[layer][i] ?? -Infinity) < 2000) continue;
        decodedAt[layer][i] = now;
        frames[layer][i].decode().catch(() => {});
      }
    };

    // Each layer is drawn only while it can be seen: the video fades in from 8% of the scroll, the
    // cut-out is gone after 27%.
    const paint = () => {
      raf = 0;
      if (progress > 0.07) {
        drawLayer('bg', bg, bgCanvas, HERO_FRAMES);
        predecode('bg', HERO_FRAMES);
      }
      if (progress < 0.28) {
        drawLayer('fg', fg, fgSource, HERO_FG_FRAMES);
        predecode('fg', HERO_FG_FRAMES);
        sourceChanged = true;
        wakeVeil();
      }
    };
    const requestPaint = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const resize = () => {
      // No sharper than the frames themselves (1920 or 1280 px wide, 16:9, drawn to cover): beyond that
      // the canvas only adds pixels to fill. On a phone that is a quarter of the pixels at 2x.
      const frameW = mobile ? 1280 : 1920;
      const native = 1 / Math.max(bgCanvas.clientWidth / frameW, bgCanvas.clientHeight / ((frameW * 9) / 16));
      const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, native));
      bgCanvas.width = Math.round(bgCanvas.clientWidth * dpr);
      bgCanvas.height = Math.round(bgCanvas.clientHeight * dpr);
      const veilDpr = Math.min(window.devicePixelRatio || 1, 1.5); // the print is coarse anyway
      // The photo under the print only shows where the pointer burns through: 1x is plenty, and it is
      // uploaded to the GPU on every frame change.
      fgSource.width = Math.round(fgCanvas.clientWidth);
      fgSource.height = Math.round(fgCanvas.clientHeight);
      veil.resize(fgCanvas.clientWidth, fgCanvas.clientHeight, veilDpr);
      requestPaint();
    };

    for (const [layer, i] of LOAD_ORDER) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        ready[layer][i] = true;
        requestPaint();
      };
      img.src = frameSrc(layer, mobile, i);
      frames[layer][i] = img;
    }

    // Sized from the canvas's own box whenever it changes. Safari can run this before the page's styles
    // apply, while the canvases are still 300 × 150: sized once, the hero stayed stretched and blurred.
    const sizes = new ResizeObserver(resize);
    sizes.observe(bgCanvas);

    const playhead = { frame: 0 };
    section.dataset.frame = '0'; // (at the start until the scroll moves it: the manifesto's iris waits for it)
    const observer = onScroll({ target: section, enter: 'top top', leave: 'bottom bottom', sync: 0.4 });
    let lastUpdate = performance.now();
    const timeline = createTimeline({
      autoplay: observer,
      onUpdate: () => {
        const now = performance.now();
        const next = playhead.frame / (HERO_FRAMES - 1);
        velocity = (next - progress) / Math.max(0.008, (now - lastUpdate) / 1000);
        lastUpdate = now;
        position = playhead.frame;
        progress = next;
        section.dataset.frame = position.toFixed(3); // read by the career timeline to meet the pupil
        // The WebGL backdrop is fully covered after the first third — let it sleep.
        const off = progress > 0.3;
        if (off !== slatsOff) {
          slatsOff = off;
          setSlatsPaused(off);
        }
        requestPaint();
      },
    });
    timeline
      .add(playhead, { frame: [0, HERO_FRAMES - 1], duration: 1000, ease: 'linear' }, 0)
      .add(bgCanvas, { opacity: [0, 1], duration: 120, ease: 'inOutSine' }, 80)
      .add(heading, { opacity: [1, 0], y: [0, -80], duration: 240, ease: 'inQuad' }, 0)
      .add(fgCanvas, { opacity: [1, 0], duration: 50, ease: 'linear' }, 220)
      .add(copy, { opacity: [1, 0], y: [0, -120], duration: 260, ease: 'inQuad' }, 0)
      .add(hintEl, { opacity: [1, 0], duration: 100, ease: 'linear' }, 0)
      .add(shade, { opacity: [1, 0], duration: 420, ease: 'linear' }, 0)
      .add(blackout, { opacity: [0, 1], duration: 140, ease: 'linear' }, 860);

    const hint = animate(hintDot, { y: [0, 26], opacity: [1, 0], duration: 1600, ease: 'inOutSine', loop: true });

    // Mouse depth in three planes: backdrop (far, barely moves) → headline (middle, tilts) →
    // subject and video (near). Video and cut-out always move together, so the subject never doubles.
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
      const dx = -pos.x * 18;
      const dy = -pos.y * 11;
      slats.style.transform = `translate3d(${dx * 0.3}px, ${dy * 0.3}px, 0) scale(1.03)`;
      tilt.style.transform = `translate3d(${dx * 0.6}px, ${dy * 0.6}px, 0) rotateY(${pos.x * 6}deg) rotateX(${-pos.y * 4}deg)`;
      const near = `translate3d(${dx}px, ${dy}px, 0) scale(1.06)`;
      bgCanvas.style.transform = near;
      fgCanvas.style.transform = near;
    };
    const visibility = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    if (depth) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onPointerLeave);
      visibility.observe(section);
      tick();
    }

    // Dither Veil loop: burns the pointer's trail into the print (or, when the pointer has been idle for
    // a while, a slow wandering spot over the figure) and redraws while anything moves. Touch screens have no
    // pointer to follow: the print shows from the start, with the finger hint; a touch or a swipe shows the photo
    // whole (the print dissolving into it), and after IDLE_MS with nothing touched or scrolled the print knits back
    // and the hint plays again.
    const wander = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = window.matchMedia('(hover: none)').matches;
    const pointer = { x: 0, y: 0, at: -Infinity };
    const whole = { from: -Infinity, until: -Infinity }; // touch screens: the photo shown whole
    let veilRaf = 0;
    let veilLast = 0;
    const onVeilPointer = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = performance.now();
      wakeVeil();
    };
    const onVeilTouch = () => {
      const now = performance.now();
      nudge.current.next = now + IDLE_MS;
      if (nudge.current.on) {
        nudge.current.on = false;
        setHinting(false);
      }
      if (progress >= 0.3) return; // (the figure is gone by then)
      if (now > whole.until) whole.from = now;
      whole.until = now + IDLE_MS;
      wakeVeil();
    };
    const veilTick = (now: number) => {
      veilRaf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - veilLast) / 1000));
      veilLast = now;
      const rect = fgCanvas.getBoundingClientRect(); // includes the depth transform
      const w = fgCanvas.clientWidth;
      const h = fgCanvas.clientHeight;
      let spot: { x: number; y: number } | null = null;
      if (touch) {
        // (no spot: the whole print dissolves)
      } else if (now - pointer.at < 2500) {
        spot = { x: ((pointer.x - rect.left) * w) / rect.width, y: ((pointer.y - rect.top) * h) / rect.height };
      } else if (wander) {
        const t = now / 1000;
        spot = { x: w * (0.5 + 0.22 * Math.sin(t * 0.47)), y: h * (0.5 + 0.2 * Math.sin(t * 0.31 + 1.3)) };
      }
      let lit = veil.step(dt, spot);
      if (touch && now < whole.until) {
        veil.flood(wander ? (now - whole.from) / 350 : 1);
        lit = true;
      }
      velocity *= 0.9;
      veil.render(sourceChanged, 3 + Math.min(12, Math.abs(velocity) * 40));
      sourceChanged = false;
      const shown = progress < 0.3 && inView;
      if (shown && (lit || spot)) veilRaf = requestAnimationFrame(veilTick);
    };
    function wakeVeil() {
      if (veilRaf) return;
      veilLast = performance.now();
      veilRaf = requestAnimationFrame(veilTick);
    }
    let idle = 0;
    if (touch) {
      window.addEventListener('pointerdown', onVeilTouch, { passive: true });
      window.addEventListener('scroll', onVeilTouch, { passive: true });
      // the print from the start, and the hint over it at once
      nudge.current = { next: performance.now(), on: false };
      wakeVeil();
      if (wander) {
        idle = window.setInterval(() => {
          const h = nudge.current;
          if (h.on || performance.now() < h.next || progress > 0.08 || !inView) return;
          h.on = true;
          setHinting(true);
        }, 200);
      }
    } else {
      window.addEventListener('pointermove', onVeilPointer, { passive: true });
      window.addEventListener('pointerdown', onVeilPointer, { passive: true });
    }
    if (!depth) visibility.observe(section);

    return () => {
      sizes.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointermove', onVeilPointer);
      window.removeEventListener('pointerdown', onVeilPointer);
      window.removeEventListener('pointerdown', onVeilTouch);
      window.removeEventListener('scroll', onVeilTouch);
      window.clearInterval(idle);
      visibility.disconnect();
      if (depthRaf) cancelAnimationFrame(depthRaf);
      if (veilRaf) cancelAnimationFrame(veilRaf);
      if (raf) cancelAnimationFrame(raf);
      veil.destroy();
      for (const layer of ['bg', 'fg'] as const) frames[layer].forEach((img) => (img.onload = null));
      hint.revert();
      timeline.revert();
      observer.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="top" aria-label={t.hero.label} className="relative h-[220vh] md:h-[290vh]">
      {/* (nothing to select: on iOS a finger held on the photo selected the whole hero) */}
      <div className="sticky top-0 h-svh w-full select-none overflow-hidden bg-[#040B1C]">
        {/* 1 · animated backdrop */}
        <div ref={slatsRef} aria-hidden className="absolute inset-0" style={{ willChange: 'transform' }}>
          <MicroSlats color={HOODIE_BLUE} glintColor="#B7D3FF" backgroundColor="#040B1C" cursorStrength={0.8} paused={slatsPaused} />
        </div>

        {/* 2 · the video, revealed as the camera moves in */}
        <canvas ref={bgRef} data-hero-video aria-hidden className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-0" />

        {/* 3 · headline (Tech Text, interactive), behind the subject */}
        <div ref={headingRef} className="absolute inset-x-0 top-0 z-10" style={{ perspective: '1000px' }}>
          <div ref={tiltRef} style={{ willChange: 'transform' }}>
            <div aria-hidden className={`invisible px-6 pt-6 md:px-10 md:pt-8 ${NAV_TEXT}`}>
              {t.nav.about}
            </div>
            <h1 className="sr-only">{fill(t.hero.heading, { name: t.name, role: t.role })}</h1>
            <FadeIn delay={0.15} y={40} className="mt-3 sm:mt-0 md:-mt-8">
              <div aria-hidden className="hidden h-[17.5vw] sm:block">
                <TechText text={`${t.hero.hello} ${t.hero.name}`} {...HEADLINE} />
              </div>
              <div aria-hidden className="sm:hidden">
                <div className="h-[26vw]">
                  <TechText text={t.hero.hello} {...HEADLINE} />
                </div>
                <div className="-mt-[7vw] h-[26vw]">
                  <TechText text={t.hero.name} {...HEADLINE} />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* 4 · the same frames with the background removed */}
        <canvas ref={fgRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full" />

        {/* Legibility gradients above every layer, so subject and backdrop are shaded alike */}
        <div ref={shadeRef} aria-hidden className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0C0C0C]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 hidden h-[42%] bg-gradient-to-t from-[#0C0C0C]/90 via-[#0C0C0C]/40 to-transparent sm:block" />
          {/* phones: darker, under the tagline and the button */}
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,#0C0C0C_0%,rgb(12_12_12/0.88)_42%,rgb(12_12_12/0)_100%)] sm:hidden" />
        </div>

        <div ref={copyRef} className="pointer-events-none relative z-40 flex h-full flex-col">
          <FadeIn as="nav" y={-20} aria-label={t.nav.main} className="pointer-events-auto flex justify-between gap-x-3 px-6 pt-6 md:px-10 md:pt-8">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className={`-my-3 py-3 text-[#D7E2EA] transition-opacity duration-200 hover:opacity-70 ${NAV_TEXT}`}>
                {item.label}
              </a>
            ))}
            <LangSwitch className={NAV_TEXT} />
          </FadeIn>

          {/* phones: the tagline centred, the button under it; wider: side by side */}
          <div className="mt-auto flex flex-col items-center gap-6 px-6 pb-8 text-center sm:flex-row sm:items-end sm:justify-between sm:pb-8 sm:text-left md:px-10 md:pb-10">
            <FadeIn
              as="p"
              delay={0.35}
              y={20}
              className="max-w-[320px] text-balance font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[220px] sm:text-wrap md:max-w-[260px]"
              style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1.5rem)' }}
            >
              {HERO_TAGLINE}
            </FadeIn>
            <FadeIn delay={0.5} y={20} className="pointer-events-auto">
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
          <span className="text-xs uppercase tracking-[0.3em] text-[#D7E2EA]/70">{t.hero.scroll}</span>
          <span className="relative block h-8 w-px overflow-hidden bg-[#D7E2EA]/20">
            <span ref={hintDotRef} className="absolute left-0 top-0 block h-2 w-px bg-[#D7E2EA]" />
          </span>
        </div>

        {hinting && <ScrollHint word={t.hero.swipe} onDone={hintDone} />}

        <div ref={blackoutRef} aria-hidden className="pointer-events-none absolute inset-0 z-50 bg-[#0C0C0C] opacity-0" />
      </div>
    </section>
  );
}
