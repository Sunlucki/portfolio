import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatedText } from '../components/AnimatedText';
import { ContactButton } from '../components/Buttons';
import { DepthImage } from '../components/DepthImage';
import { SectionTitle } from '../components/SectionTitle';
import { ABOUT_HELLO, ABOUT_TEXT, NAME_STORY, phraseRuns } from '../content';
import { t } from '../i18n';
import { PORTRAIT, handoff } from '../three/aboutStage';

// The sides feather into the page and the hoodie fades out at the bottom, into the text that follows.
const { side, bottom } = PORTRAIT.feather;
const FEATHER = `linear-gradient(to right, transparent, #000 ${side * 100}%, #000 ${100 - side * 100}%, transparent), linear-gradient(to bottom, #000 ${bottom * 100}%, transparent)`;
// Highlights in the handle's story, in order: the Sun in gold, luck in violet.
const GLOW = ['bg-gradient-to-r from-[#FFD57A] to-[#FF9F43]', 'bg-gradient-to-r from-[#A08CFF] to-[#FF6FB5]'];
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The handle's letters in the story's colours: SUN from gold to orange, LUCKI from violet to pink, a letter at
// a time (a gradient clipped to each letter would break up as the letters fly).
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(', ')})`;
const HANDLE = [...ABOUT_HELLO.handle].map((_, i) =>
  i < 3 ? mix([255, 213, 122], [255, 159, 67], i / 2) : mix([160, 140, 255], [255, 111, 181], (i - 3) / 4),
);

/**
 * The About text: one paragraph that opens with a hello and the handle. Once the reveal has filled the handle in, a
 * hand-drawn arrow is drawn down to it and "Why?" is written beside the arrow in violet (wiped out again if the page
 * goes back up); clicking the handle scatters every letter out from it, and the handle's story comes up in their
 * place until "Got it" gathers the letters back.
 */
function Story() {
  const box = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const flights = useRef<{ letter: HTMLElement; away: string; delay: number }[]>([]);
  const [open, setOpen] = useState(false);

  const show = () => {
    const from = handle.current?.getBoundingClientRect();
    if (open || !box.current || !from) return;
    setOpen(true);
    if (still) return;
    const [cx, cy] = [from.left + from.width / 2, from.top + from.height / 2];
    // out from the handle, the nearest first, turning and shrinking as they fade
    flights.current = [...box.current.querySelectorAll<HTMLElement>('[data-char]')].map((letter) => {
      const r = letter.getBoundingClientRect();
      const [dx, dy] = [r.left + r.width / 2 - cx, r.top + r.height / 2 - cy];
      const d = Math.hypot(dx, dy) || 1;
      const push = 70 + Math.random() * 200;
      const away = `translate(${((dx / d) * push + (Math.random() - 0.5) * 60).toFixed(1)}px, ${((dy / d) * push + (Math.random() - 0.5) * 60).toFixed(1)}px) rotate(${((Math.random() - 0.5) * 540).toFixed(0)}deg) scale(${(0.5 + Math.random() * 0.7).toFixed(2)})`;
      const delay = d * 0.5;
      letter.animate([{ transform: 'none' }, { transform: away, opacity: 0 }], {
        duration: 650 + Math.random() * 350,
        delay,
        easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
        fill: 'forwards',
      });
      return { letter, away, delay };
    });
  };

  const hide = useCallback(() => {
    setOpen(false);
    // back into place, from the handle outwards, landing with a little bounce
    for (const { letter, away, delay } of flights.current) {
      letter.getAnimations().forEach((flight) => flight.cancel());
      letter.animate([{ transform: away, opacity: 0 }, { transform: 'none' }], {
        duration: 900,
        delay: 150 + delay * 0.35,
        easing: 'cubic-bezier(0.34, 1.35, 0.64, 1)',
        fill: 'backwards',
      });
    }
    flights.current = [];
    handle.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => close.current?.focus({ preventScroll: true }), 500);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, hide]);

  return (
    // the text and the story in one grid cell, so the block is as tall as the taller of the two
    <div ref={box} className="relative grid w-full max-w-[640px]">
      <div className="transition-opacity duration-500 [grid-area:1/1]" style={still && open ? { opacity: 0 } : undefined}>
        {/* one paragraph, the handle in its colours; "Why?" is written over the line above it */}
        <AnimatedText
          text={`${ABOUT_HELLO.text} ${ABOUT_HELLO.handle}. ${ABOUT_TEXT}`}
          className="font-medium leading-relaxed text-[#D7E2EA]"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          highlight={{
            text: ABOUT_HELLO.handle,
            colors: HANDLE,
            render: (letters, filled) => (
              <button
                ref={handle}
                type="button"
                onClick={show}
                aria-expanded={open}
                aria-controls="handle-story"
                className="group relative inline"
              >
                <Why drawn={filled && !open} />
                <span className="sr-only">{ABOUT_HELLO.handle}</span>
                {letters}
              </button>
            ),
          }}
        />
      </div>
      {/* the handle's story, where the letters were */}
      <div
        id="handle-story"
        role="region"
        aria-label={NAME_STORY.question}
        className="flex flex-col items-center justify-center transition-[opacity,transform,visibility] duration-500 [grid-area:1/1]"
        style={{
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transform: open ? 'none' : 'scale(0.96)',
          transitionDelay: open ? '250ms' : '0ms',
        }}
      >
        <h3 className="hero-heading text-3xl font-black leading-none tracking-wide md:text-5xl">{NAME_STORY.question}</h3>
        <p className="mt-6 leading-relaxed text-[#D7E2EA]/80" style={{ fontSize: 'clamp(1rem, 1.7vw, 1.2rem)' }}>
          {phraseRuns(NAME_STORY.text).map((run, i, runs) =>
            run.mark === 'hi' ? (
              <span key={i} className={`bg-clip-text font-semibold text-transparent ${GLOW[runs.slice(0, i).filter((r) => r.mark === 'hi').length % GLOW.length]}`}>
                {run.text}
              </span>
            ) : (
              run.text
            ),
          )}
        </p>
        <p className="mt-6 font-light italic leading-relaxed text-[#D7E2EA]" style={{ fontSize: 'clamp(1rem, 1.6vw, 1.15rem)' }}>
          {NAME_STORY.philosophy}
        </p>
        <button
          ref={close}
          type="button"
          onClick={hide}
          className="mt-8 rounded-full border border-white/25 px-8 py-2.5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/5 sm:text-sm"
        >
          {ABOUT_HELLO.close}
        </button>
      </div>
    </div>
  );
}

// Over the handle, written by hand: "Why?" above the line over it, then an arrow drawn from the word down through
// that line to the handle, a stroke at a time (the word wiped in from the left with room round its letters so none is
// cut, the arrow's line, its head); `drawn` false wipes it all out at once. It is part of the handle's button: a tap
// on it opens the story as a tap on the handle does.
const INK = '#B38BFF';
function Why({ drawn: show }: { drawn: boolean }) {
  const stroke = (delay: number, ms: number) => ({
    strokeDasharray: 1,
    strokeDashoffset: show ? 0 : 1,
    transition: show && !still ? `stroke-dashoffset ${ms}ms cubic-bezier(0.5, 0, 0.3, 1) ${delay}ms` : 'none',
  });
  return (
    <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -rotate-3 cursor-pointer" style={{ bottom: 'calc(100% + 1.3em)', pointerEvents: show ? 'auto' : 'none' }}>
      <span
        className="block whitespace-nowrap text-[1.6em] font-bold leading-none"
        style={{
          color: INK,
          fontFamily: 'Caveat, cursive',
          textShadow: '0 0 6px #0C0C0C, 0 0 12px #0C0C0C',
          clipPath: show ? 'inset(-0.5em -0.5em -0.5em -0.5em)' : 'inset(-0.5em 100% -0.5em -0.5em)',
          transition: show && !still ? 'clip-path 600ms cubic-bezier(0.45, 0, 0.3, 1)' : 'none',
        }}
      >
        {ABOUT_HELLO.hint}
      </span>
      {/* from under the word's start, down through the line above the handle, to it */}
      <svg viewBox="0 0 30 50" className="absolute left-[4%] top-full h-[1.95em] w-[1em] overflow-visible" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 3px #0C0C0C)' }}>
        <path pathLength={1} d="M20 3 C 8 12, 6 24, 13 34 C 15 38, 15 42, 14 47" style={stroke(620, 420)} />
        <path pathLength={1} d="M8 40 L 14 48 L 21 41" style={stroke(1000, 200)} />
      </svg>
    </span>
  );
}

export function AboutSection() {
  return (
    // Slides over the end of the manifesto, whose particles assemble the portrait on the stage (ManifestoSection).
    <section
      id="about"
      className="relative isolate overflow-hidden px-5 py-24 sm:px-8 md:px-10 md:py-32"
      style={{ marginTop: 'calc(-1 * var(--handoff, 0px))' }}
    >
      <SectionTitle text={t.about.title} className="mx-auto max-w-6xl" />

      {/* The portrait, full width. It is pulled up under the title, whose letters sit on the photo's dark top,
          so the head (its crown 16% down the photo) starts just below them; phones get a taller crop. */}
      <div
        data-about-stage
        className="relative -z-10 -mx-5 mt-[calc(8px_-_20vw)] aspect-[4/5] sm:-mx-8 sm:mt-[calc(8px_-_10.67vw)] sm:aspect-[3/2] md:-mx-10"
        style={{ maskImage: FEATHER, maskComposite: 'intersect', WebkitMaskImage: FEATHER, WebkitMaskComposite: 'source-in', opacity: 'var(--reveal, 1)' }}
      >
        <img
          src={PORTRAIT.image}
          alt={t.about.portraitAlt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${PORTRAIT.focus[0] * 100}% ${PORTRAIT.focus[1] * 100}%` }}
        />
        <DepthImage
          image={PORTRAIT.image}
          depthMap={PORTRAIT.depth}
          specularMap={PORTRAIT.specular}
          focus={PORTRAIT.focus}
          hold={handoff}
          background="#0C0C0C"
          className="absolute inset-0"
        />
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center gap-10 text-center sm:mt-12">
        <Story />
        <ContactButton />
      </div>
    </section>
  );
}
