import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { fill, t } from '../i18n';
import { COVER_OF, GRAPHICS, TILES } from '../content';
import { flow, PERSPECTIVE } from '../three/flow';
import { GraphicsProject, type Opening } from './GraphicsProject';

// The covers on rings of eight, in order (the first ring the first eight), after louisraille.fr's work section (his
// call, 2026-10-01): each ring a cylinder of cards turning round its axis, the vortex of particles inside them
// (three/FlowScene.tsx). The section stays on the screen while the page scrolls on, the rings rising through it one
// after another, each turning once round as it crosses the screen, so every cover comes to the front. A ring turns by
// hand too: dragged or swiped sideways (a finger on phones, the mouse, a trackpad's two fingers or a sideways wheel in
// a window of any width), or by the thin arrows at its sides on screens. Let go, it settles on a cover (a short swipe
// moves it on by one). Drawn twice with the same turns: the rings' back halves (their covers seen from behind, darker)
// under the particles' canvas, their front halves over it, so the vortex is inside them. Each cover is turned and
// pushed out on its own: a ring turned edge-on as a whole could not be clicked (the browser finds nothing in a layer it
// sees edge-on). Pointed at, a cover grows with a bounce and says what a click does (index.css); clicked, it opens its
// project (GraphicsProject).
const PER_RING = 8;
const STEP = 360 / PER_RING;
const RINGS = Array.from({ length: Math.ceil(TILES.length / PER_RING) }, (_, r) =>
  TILES.map((tile, i) => ({ ...tile, i })).slice(r * PER_RING, (r + 1) * PER_RING),
);
const START = RINGS.map((_, i) => i * 67.5); // (the rings' turns apart, so their covers don't line up)
const RISE = 0.5; // screens the rings rise for a screen of scrolling (the section stays on the screen as long as that takes)
const SPACE = 0.12; // screens between a ring's covers and the next ring's (his call: they were too far apart)
const COVER = 540 / 840; // the covers' height to width
const SWIPE = 24; // px: a swipe this long moves a ring on by a cover, however short of half a cover it is
const UNDER = 84; // px: on a narrow screen, how far under the heading the first ring's front cover comes at first
const WHEEL_END = 160; // ms without a sideways wheel event: the trackpad's swipe is over

// the rings' size for a screen: their radius (a third of a wide screen, most of a phone's), the covers on them (an
// eighth of the circle each, a little apart), how far apart they rise (a front cover's height on the screen and a
// little), the perspective (the particles' camera's), where the arrows stand (midway between the screen's edge and the
// ring's), on a screen taller than wide how far above the middle the first ring starts, so it comes up right under the
// heading (his call: the gap there was too big), and how many screens of scrolling the section stays for
type Layout = { width: number; radius: number; card: number; height: number; gap: number; perspective: number; phone: boolean; arrow: number; lead: number; pin: number };
function layoutFor(vw: number, vh: number): Layout {
  const phone = vw < 768;
  const radius = phone ? 0.64 * vw : Math.min(440, Math.max(220, 0.3 * vw));
  const card = 2 * radius * Math.tan(Math.PI / PER_RING) * 0.9;
  const perspective = PERSPECTIVE * vh;
  const seen = (card * COVER * perspective) / (perspective - radius); // (a front cover's height on the screen)
  const gap = seen + SPACE * vh;
  const lead = vh > vw ? Math.max(0, vh / 2 - seen / 2 - UNDER) : 0;
  return {
    width: vw,
    radius,
    card,
    height: card * COVER,
    gap,
    perspective,
    phone,
    arrow: Math.max(40, (vw / 2 - radius * 1.08) / 2),
    lead,
    pin: ((RINGS.length - 1) * gap + lead) / (RISE * vh),
  };
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const turned = (angle: number, radius: number) => `rotateY(${angle.toFixed(2)}deg) translateZ(${radius.toFixed(1)}px)`;

// a long thin arrow, pointing right (or left)
function LongArrow({ left = false }: { left?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 64 14"
      className={`h-3.5 w-16 ${left ? '-scale-x-100' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 7h61M56 1.5 62 7l-6 5.5" />
    </svg>
  );
}

export function GraphicsSection() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lifts = useRef<(HTMLDivElement | null)[]>([]); // each ring's, raised: its front, its back, its arrows
  const faces = useRef<(HTMLElement | null)[]>([]); // each cover's, turned: its front, its back
  const [layout, setLayout] = useState(() => layoutFor(window.innerWidth, window.innerHeight));
  const [opening, setOpening] = useState<Opening | null>(null);
  // the rings' turns by hand (eased to their targets), the angles they stand at, and where on the stage they are (their
  // middles, px from its top)
  const hand = useRef({ now: RINGS.map(() => 0), to: RINGS.map(() => 0), angle: RINGS.map(() => 0), at: RINGS.map(() => 0) });
  // a turn by hand going on: a drag (a finger's swipe on phones) or a trackpad's sideways swipe, on which ring, from
  // what angle
  const drag = useRef<{ id: number; x: number; y: number; ring: number; from: number; now: number; sideways: boolean | null } | null>(null);
  const wheel = useRef<{ ring: number; from: number; dx: number; timer: number } | null>(null);
  const dragged = useRef(false);

  // the layout, from the stage's own size (the screen's height without the browser's bars)
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const sized = new ResizeObserver(() => setLayout(layoutFor(el.clientWidth, el.clientHeight)));
    sized.observe(el);
    return () => sized.disconnect();
  }, []);
  useEffect(() => {
    flow.rings.radius = layout.radius;
  }, [layout.radius]);

  // every frame while the section is near the screen: where the rings stand and how far they have turned
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const facing = TILES.map(() => true);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const box = el.getBoundingClientRect();
      const vh = stage.current?.clientHeight || window.innerHeight;
      const top = stage.current?.getBoundingClientRect().top ?? 0;
      const progress = clamp01(-box.top / Math.max(1, box.height - vh));
      const seen = (layout.height * layout.perspective) / (layout.perspective - layout.radius); // (a front cover's height on the screen)
      const h = hand.current;
      const ease = 1 - Math.exp(-dt * 9);
      RINGS.forEach((cards, i) => {
        const y = (i - (RINGS.length - 1) * progress) * layout.gap - layout.lead * (1 - progress);
        h.at[i] = vh / 2 + y;
        const through = (vh + seen / 2 - (top + vh / 2 + y)) / (vh + seen); // (0 below the screen, 1 above it)
        const held = (drag.current?.sideways && drag.current.ring === i) || wheel.current?.ring === i;
        if (!held) h.now[i] += (h.to[i] - h.now[i]) * ease;
        const angle = (h.angle[i] = START[i] - 360 * through + h.now[i]);
        const lift = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        for (let n = 0; n < 3; n++) {
          const raised = lifts.current[i * 3 + n];
          if (raised) raised.style.transform = lift;
        }
        cards.forEach((tile, k) => {
          const turn = turned(angle + STEP * k, layout.radius);
          for (let n = 0; n < 2; n++) {
            const face = faces.current[tile.i * 2 + n];
            if (face) face.style.transform = turn;
          }
          // (only the covers facing the screen can be pointed at: the ones turned away, hidden, would take clicks
          // through the gaps)
          const on = Math.cos(((angle + STEP * k) * Math.PI) / 180) > 0.3;
          if (on === facing[tile.i]) return;
          facing[tile.i] = on;
          const cover = faces.current[tile.i * 2];
          if (cover) cover.style.pointerEvents = on ? '' : 'none';
        });
      });
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(raf);
        if (entry.isIntersecting) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      },
      { rootMargin: '50% 0px' },
    );
    near.observe(el);
    return () => {
      near.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [layout]);

  // the ring nearest a height on the stage
  const nearest = (y: number) => hand.current.at.reduce((best, at, i, all) => (Math.abs(at - y) < Math.abs(all[best] - y) ? i : best), 0);
  const onStage = (clientY: number) => clientY - (stage.current?.getBoundingClientRect().top ?? 0);
  // a ring turned on by covers (by: +1 the one on the left to the front, -1 the one on the right), from where it is
  // turning to
  const settle = (ring: number, by: number) => {
    const h = hand.current;
    const angle = h.angle[ring] + h.to[ring] - h.now[ring];
    h.to[ring] += (Math.round(angle / STEP) + by) * STEP - angle;
  };
  // a turn by hand let go: on to the cover it was turned nearest to, or, swiped less than half a cover, on by one
  const release = (ring: number, from: number, dx: number) => {
    const h = hand.current;
    let by = Math.round((h.angle[ring] - from) / STEP);
    if (by === 0 && Math.abs(dx) > SWIPE) by = Math.sign(dx);
    h.to[ring] += (Math.round(from / STEP) + by) * STEP - h.angle[ring];
  };
  // a cover focused from the keyboard turns to the front
  const bringFront = (ring: number, k: number) => {
    const h = hand.current;
    h.to[ring] = h.now[ring] - wrap180(h.angle[ring] + STEP * k);
  };

  // dragged sideways (a finger's swipe on phones), the ring under it turns with it; up and down the page scrolls
  const down = (e: PointerEvent) => {
    if (drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const ring = nearest(onStage(e.clientY));
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, ring, from: hand.current.angle[ring], now: hand.current.now[ring], sideways: null };
    dragged.current = false;
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const [dx, dy] = [e.clientX - d.x, e.clientY - d.y];
    if (d.sideways === null) {
      if (Math.hypot(dx, dy) < 8) return;
      d.sideways = Math.abs(dx) > Math.abs(dy);
      if (d.sideways) {
        dragged.current = true;
        stage.current?.setPointerCapture(e.pointerId);
      }
    }
    if (!d.sideways) return;
    const h = hand.current;
    h.now[d.ring] = h.to[d.ring] = d.now + (dx / layout.card) * STEP;
  };
  const up = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.sideways) release(d.ring, d.from, e.clientX - d.x);
  };

  // a trackpad's sideways swipe (or a sideways wheel), in a window of any width: the ring under the pointer turns with
  // it, and settles once it is over
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const swipe = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); // (not the browser's back and forward)
      const h = hand.current;
      let w = wheel.current;
      if (!w) {
        const ring = nearest(onStage(e.clientY));
        w = wheel.current = { ring, from: h.angle[ring], dx: 0, timer: 0 };
      }
      w.dx -= e.deltaX;
      h.now[w.ring] = h.to[w.ring] = h.now[w.ring] - (e.deltaX / layout.card) * STEP;
      window.clearTimeout(w.timer);
      const done = w;
      w.timer = window.setTimeout(() => {
        wheel.current = null;
        release(done.ring, done.from, done.dx);
      }, WHEEL_END);
    };
    el.addEventListener('wheel', swipe, { passive: false });
    return () => el.removeEventListener('wheel', swipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const ring = (cards: (typeof RINGS)[number], i: number, front: boolean) => (
    <div
      key={i}
      ref={(el) => {
        lifts.current[i * 3 + (front ? 0 : 1)] = el;
      }}
      className="absolute left-1/2 top-1/2"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {cards.map((tile, k) => {
        const place = {
          width: layout.card,
          height: layout.height,
          left: -layout.card / 2,
          top: -layout.height / 2,
          transform: turned(START[i] + STEP * k, layout.radius),
        };
        const face = (el: HTMLElement | null) => {
          faces.current[tile.i * 2 + (front ? 0 : 1)] = el;
        };
        if (!front)
          return (
            <div key={k} ref={face} className="absolute overflow-hidden rounded-2xl" style={place}>
              <img src={tile.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover brightness-[0.45]" />
            </div>
          );
        const [slug, picture] = COVER_OF[tile.i];
        const hidden = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as const;
        return (
          <button
            key={k}
            ref={face}
            type="button"
            aria-label={fill(t.graphics.open, { name: GRAPHICS[slug].name })}
            onFocus={() => bringFront(i, k)}
            onClick={(e) => setOpening({ slug, picture, cover: e.currentTarget, src: tile.src })}
            className="cover absolute outline-none"
            style={{ ...place, ...hidden }}
          >
            <span className="cover-face absolute inset-0 overflow-hidden rounded-2xl ring-1 ring-white/10" style={hidden}>
              <img src={tile.src} alt={tile.alt} loading="lazy" decoding="async" draggable={false} width={840} height={540} className="h-full w-full object-cover" />
              <span aria-hidden className="cover-label absolute inset-0 grid place-items-center bg-black/35">
                <span className="flex items-center gap-1.5 rounded-full border border-white/80 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                  {t.graphics.view}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
  // screens: each ring's arrows, at its sides, raised with it
  const arrows = (i: number) => (
    <div
      key={`arrows-${i}`}
      ref={(el) => {
        lifts.current[i * 3 + 2] = el;
      }}
      className="pointer-events-none absolute inset-x-0 top-1/2"
      style={{ willChange: 'transform' }}
    >
      {([1, -1] as const).map((by) => (
        <button
          key={by}
          type="button"
          onClick={() => settle(i, by)}
          aria-label={by > 0 ? t.graphics.ringLeft : t.graphics.ringRight}
          className="group pointer-events-auto absolute top-0 grid h-12 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center text-[#D7E2EA]/50 transition-colors duration-300 hover:text-white"
          style={{ left: by > 0 ? layout.arrow : layout.width - layout.arrow }}
        >
          <span className={`transition-transform duration-300 ${by > 0 ? 'group-hover:-translate-x-1.5' : 'group-hover:translate-x-1.5'}`}>
            <LongArrow left={by > 0} />
          </span>
        </button>
      ))}
    </div>
  );

  const perspective = `${layout.perspective.toFixed(0)}px`;
  return (
    <section id="graphics" data-flow="graphics" className="pt-16 md:pt-24">
      <div className="text-shade">
        <SectionTitle text={t.graphics.title} className="mb-2 px-4 sm:px-6 md:mb-4 md:px-10" />
      </div>
      <div ref={track} style={{ height: `calc(${(1 + layout.pin).toFixed(3)} * 100svh)` }}>
        {/* under the particles: the rings' back halves (the stage pulled up over them, not they under it: a negative
            margin at their foot would keep them stuck on the screen a screen longer than the stage) */}
        <div aria-hidden className="pointer-events-none sticky top-0 -z-20 h-svh overflow-hidden" style={{ perspective }}>
          {RINGS.map((cards, i) => ring(cards, i, false))}
        </div>
        {/* over them: their front halves, the covers that open their projects */}
        <div
          ref={stage}
          className="sticky top-0 -mt-[100svh] h-svh select-none overflow-hidden"
          style={{ perspective, touchAction: 'pan-y' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onClickCapture={(e) => {
            if (!dragged.current) return;
            dragged.current = false;
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {RINGS.map((cards, i) => ring(cards, i, true))}
          {!layout.phone && RINGS.map((_, i) => arrows(i))}
        </div>
      </div>
      {opening && <GraphicsProject opening={opening} onClose={() => setOpening(null)} />}
    </section>
  );
}
