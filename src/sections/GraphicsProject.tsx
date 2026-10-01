import { X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SceneCanvas } from '../components/SceneCanvas';
import { GRAPHICS, SCENE_OF, type GraphicsSlug } from '../content';
import { LOCALE, t } from '../i18n';

const OPEN_MS = 460;
const CLOSE_MS = 360;
const COVER_RADIUS = 16; // the covers' rounding (rounded-2xl)
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeIn = (x: number) => x ** 3;
const month = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
// ['2024-05'] → "May 2024"; from–to when it ran longer
const when = ([from, to]: [string, string?]) => {
  if (!from) return '';
  const say = (ym: string) => month.format(new Date(`${ym}-15T12:00:00`)).replace(/\s[гр]\.$/, ''); // (without «г.», «р.» after the year)
  return to && to !== from ? `${say(from)} – ${say(to)}` : say(from);
};
type Box = { left: number; top: number; width: number; height: number; radius: number };

export type Opening = { slug: GraphicsSlug; picture: number; cover: HTMLElement; src: string }; // (src: the cover's own picture; picture -1: its 3D scene)

/**
 * A cover's project (the Graphics section). Its picture flies from the cover up to the top of the screen, growing to
 * the screen's width (on wide screens, to the middle column) and from the cover's crop to the whole picture; the page
 * behind blurs, and under the picture come the project's name and when it was, who it was for, what was wrong and what
 * was done, then its other pictures. Closed (the cross, Esc, a tap beside it), the picture flies back into the cover.
 * A 3D cover (SCENE_OF) flies up as it was when tapped and goes on live up there, turned by dragging, all the
 * project's pictures under it.
 */
export function GraphicsProject({ opening, onClose }: { opening: Opening; onClose: () => void }) {
  const project = GRAPHICS[opening.slug];
  const scene = opening.picture < 0 ? SCENE_OF[opening.slug] : undefined;
  const hero = scene ? null : project.pictures[opening.picture];
  const rest = project.pictures.filter((_, i) => i !== opening.picture);
  const slot = useRef<HTMLDivElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const under = useRef<HTMLImageElement>(null);
  const full = useRef<HTMLImageElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const [landed, setLanded] = useState(false);
  const leaving = useRef(false);

  const coverBox = (): Box => {
    const r = opening.cover.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, radius: COVER_RADIUS };
  };
  const slotBox = (): Box | null => {
    const el = slot.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 };
  };
  const put = (b: Box) => {
    const el = flyer.current;
    if (!el) return;
    Object.assign(el.style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px`, borderRadius: `${b.radius}px` });
  };
  // the picture from box a to box b, the page and its veil coming in (or going)
  const fly = (a: Box, b: Box, back: boolean, done: () => void) => {
    const ms = back ? CLOSE_MS : OPEN_MS;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const e = back ? easeIn(k) : easeOut(k);
      const mix = (p: number, q: number) => p + (q - p) * e;
      put({ left: mix(a.left, b.left), top: mix(a.top, b.top), width: mix(a.width, b.width), height: mix(a.height, b.height), radius: mix(a.radius, b.radius) });
      if (veil.current) veil.current.style.opacity = String(back ? 1 - e : e);
      // (the cover's crop under the whole picture, which comes in over it on the way up and goes on the way back)
      if (full.current) full.current.style.opacity = String(back ? Math.max(0, 1 - e * 2) : Math.min(1, Math.max(0, e * 2 - 0.2)));
      if (page.current) page.current.style.opacity = String(back ? Math.max(0, 1 - e * 2) : Math.max(0, e * 2 - 1));
      if (k < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  };

  // open: the page stays put behind, the picture flies up into its place
  useLayoutEffect(() => {
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const to = slotBox();
    if (to && flyer.current) {
      put(coverBox());
      flyer.current.style.visibility = 'visible';
      fly(coverBox(), to, false, () => {
        setLanded(true);
        closer.current?.focus({ preventScroll: true });
      });
    }
    return () => {
      html.style.overflow = overflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // landed: the picture is the one in the page (it scrolls with it), once it's in
  const settle = () => {
    if (flyer.current && !leaving.current) flyer.current.style.visibility = 'hidden';
  };

  const close = () => {
    if (leaving.current) return;
    leaving.current = true;
    page.current?.scrollTo({ top: 0, behavior: 'instant' });
    // (the scene flies back as it is now)
    const live = slot.current?.querySelector<HTMLCanvasElement>('canvas[data-drawn]');
    if (live && under.current) under.current.src = live.toDataURL('image/jpeg', 0.92);
    const from = slotBox();
    if (!from || !flyer.current) return onClose();
    put(from);
    flyer.current.style.visibility = 'visible';
    setLanded(false);
    fly(from, coverBox(), true, onClose);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const parts = [
    [t.graphics.client, project.client],
    [t.graphics.problem, project.problem],
    [t.graphics.solution, project.solution],
  ].filter(([, text]) => text);
  const aspect = hero ? hero.width / hero.height : 840 / 540; // (a scene: the covers' shape)
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={project.name} className="fixed inset-0 z-[90]">
      <div ref={veil} className="absolute inset-0 opacity-0" style={{ background: 'rgb(6 8 14 / 0.62)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }} />
      <div ref={page} className="absolute inset-0 overflow-y-auto overscroll-contain opacity-0" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="mx-auto w-full md:max-w-[min(1100px,88vw)] md:pt-16" onClick={(e) => e.target === e.currentTarget && close()}>
          {/* (as wide as the column, unless that makes it taller than most of the screen) */}
          <div ref={slot} className="mx-auto w-full overflow-hidden md:rounded-3xl" style={{ aspectRatio: aspect, maxWidth: `calc(72svh * ${aspect.toFixed(4)})` }}>
            {landed &&
              (hero ? (
                <img src={hero.src} alt={project.name} className="h-full w-full object-cover" ref={(el) => {
                  if (el?.complete) settle();
                }} onLoad={settle} />
              ) : (
                scene && <SceneCanvas scene={scene} top onReady={settle} className="h-full w-full cursor-grab active:cursor-grabbing" />
              ))}
          </div>
          <div className="px-5 pb-16 pt-7 sm:px-8 md:px-0 md:pt-10">
            <h2 className="text-3xl font-semibold uppercase tracking-wide text-white sm:text-4xl">{project.name}</h2>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[#D7E2EA]/55">{[project.kind, when(project.when)].filter(Boolean).join(' · ')}</p>
            {parts.length > 0 && (
              <dl className="mt-8 grid gap-6 md:grid-cols-3 md:gap-10">
                {parts.map(([label, text]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-[0.25em] text-[#D7E2EA]/45">{label}</dt>
                    <dd className="mt-2 text-base font-light leading-relaxed text-[#D7E2EA]/90">{text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {rest.length > 0 && (
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {rest.map((p) => (
                  <img key={p.src} src={p.src} alt="" loading="lazy" decoding="async" width={p.width} height={p.height} className="h-auto w-full rounded-2xl bg-white/5" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* the picture in flight (the cover's crop growing into the whole picture, nothing jumps) */}
      <div ref={flyer} aria-hidden className="pointer-events-none fixed left-0 top-0 overflow-hidden" style={{ visibility: 'hidden' }}>
        <img ref={under} src={opening.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {hero && <img ref={full} src={hero.src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />}
      </div>
      <button
        ref={closer}
        type="button"
        onClick={close}
        aria-label={t.buttons.close}
        className="absolute right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <X className="h-5 w-5" />
      </button>
    </div>,
    document.body,
  );
}
