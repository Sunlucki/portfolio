import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Briefcase, Globe2, MapPin } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { LangLinks, LangSwitch } from '../components/LangSwitch';
import { SectionTitle } from '../components/SectionTitle';
import { SpeedNumber } from '../components/SpeedNumber';
import { FolderShelf } from '../sections/StackSection';
import MicroSlats from '../vendor/react-bits/MicroSlats';
import TechText from '../vendor/react-bits/TechText';
import { FONT, LOCALE, fill, lang, langPath, type Lang } from '../i18n';
import * as cv from './data.ts';
import { c, type CvText } from './copy';

// The CV's address in each language, beside the landing's: /cv/, /ru/cv/ and so on.
const cvPath = (to: Lang) => `${langPath(to)}cv/`;
const PDF = '/cv/Bogdan_Nenadovic_CV.pdf';
const ATS = '/cv/Bogdan_Nenadovic_CV_ATS.pdf';
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const two = (i: number) => String(i + 1).padStart(2, '0');
const month = (ym: string) => new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' }).format(new Date(`${ym}-15T12:00:00Z`));
const span = ({ start, end }: { start: string; end: string | null }) =>
  end === start ? `${month(start)} (${c.ui.oneMonth})` : `${month(start)} – ${end ? month(end) : c.ui.present}`;
const HEADLINE = { fontFamily: FONT, fontWeight: 900, fontSize: 400, color: '#BBCCD7', accentColor: '#7FB0FF' } as const;

// A text with its figures in bold (not years) and hyphenated words kept whole.
const FIGURE = /(?<![\p{L}\p{N}.\-/])(?<!KSeF |v|SDK |Next\.js |Socket\.IO v|AES-)(\d(?:[\d,.   ]*\d)?(?:K|\+|%)?)(?![\p{L}\p{N}])/gu;
function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(FIGURE)) {
    const i = m.index ?? 0;
    if (i > at) out.push(text.slice(at, i));
    out.push(/^(19|20)\d\d$/.test(m[0]) ? m[0] : <b key={i} className="n">{m[0]}</b>);
    at = i + m[0].length;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}
// A point with its subject (up to its first colon) in bold.
function Point({ text }: { text: string }) {
  const i = text.indexOf(': ');
  if (i <= 0 || i > 90) return <Rich text={text} />;
  return (
    <>
      <b className="k">
        <Rich text={text.slice(0, i).trimEnd()} />:
      </b>{' '}
      <Rich text={text.slice(i + 2)} />
    </>
  );
}

// A cell that folds: the body is always in the page (search engines and CV readers see it), and slides open and shut.
function Fold({ head, children, className = '', open, onToggle }: { head: ReactNode; children: ReactNode; className?: string; open?: boolean; onToggle?: (open: boolean) => void }) {
  const box = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const slide = (to: boolean) => {
    const d = box.current;
    const b = body.current;
    if (!d || !b) return;
    if (still) return void (d.open = to);
    if (to) d.open = true;
    const h = b.scrollHeight;
    b.animate(to ? [{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }] : [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], {
      duration: 380,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    }).onfinish = () => {
      if (!to) d.open = false;
    };
  };
  useEffect(() => {
    if (open !== undefined && box.current && box.current.open !== open) slide(open);
  }, [open]);
  return (
    <details ref={box} className={`acc ${className}`}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          const to = !box.current?.open;
          slide(to);
          onToggle?.(to);
        }}
      >
        {head}
        <span className="chev" aria-hidden />
      </summary>
      <div ref={body} className="acc-body">
        {children}
      </div>
    </details>
  );
}

// once an element has come into view
function useSeen<T extends Element>(margin = '0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, seen] as const;
}

function Title({ text, sub, light = false, children }: { text: string; sub?: string; light?: boolean; children?: ReactNode }) {
  return (
    <div className="mb-8 md:mb-12">
      <SectionTitle text={text} light={light} />
      {(sub || children) && (
        <FadeIn delay={0.1} className="mx-auto -mt-1 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-center">
          {sub && <p className={`text-xs uppercase tracking-[0.16em] ${light ? 'text-[#0C0C0C]/55' : 'text-[#D7E2EA]/60'}`}>{sub}</p>}
          {children}
        </FadeIn>
      )}
    </div>
  );
}

const IDS = ['summary', 'delivery', 'experience', 'projects', 'fit', 'skills', 'education'] as const;

function TopBar() {
  const [on, setOn] = useState('');
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setOn(e.target.id)), { rootMargin: '-40% 0px -55% 0px' });
    IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
  }, []);
  useEffect(() => {
    const a = nav.current?.querySelector<HTMLAnchorElement>('a.on');
    if (a && nav.current) nav.current.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' });
  }, [on]);
  return (
    <div className="sticky top-0 z-30 border-b border-[#D7E2EA]/10 bg-[#0C0C0C]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center gap-3 px-4 sm:px-6">
        <a href={langPath(lang)} className="font-black tracking-wider text-[#BBCCD7]" title={c.ui.site}>
          BN
        </a>
        <nav ref={nav} aria-label={c.ui.sections} className="secnav flex flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          {IDS.map((id) => (
            <a key={id} href={`#${id}`} className={on === id ? 'on' : ''}>
              {id === 'education' ? c.ui.education : c.ui.nav[id]}
            </a>
          ))}
        </nav>
        <LangSwitch href={cvPath} className="text-sm font-medium uppercase tracking-wider" />
        <a href={PDF} download className="pill small hidden sm:inline-flex">
          PDF
        </a>
      </div>
    </div>
  );
}

function Head() {
  const [slats, setSlats] = useState(true);
  const who = useRef<HTMLDivElement>(null);
  const [statsRef, statsSeen] = useSeen<HTMLDivElement>('-10% 0px');
  useEffect(() => {
    const el = who.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSlats(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const updated = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${cv.UPDATED}T12:00:00Z`));
  return (
    <header id="top" className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6 md:pt-10">
      <FadeIn as="p" className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#D7E2EA]/60">
        <span>{c.ui.cv}</span>
        <span>{c.location}</span>
        <span className="hidden sm:inline">{fill(c.ui.updated, { date: updated })}</span>
      </FadeIn>
      <h1 className="sr-only">
        {cv.person.name}, {c.headline}
      </h1>
      <FadeIn y={40} delay={0.05}>
        <div aria-hidden className="hidden h-[min(9.6vw,118px)] sm:block">
          <TechText text={cv.person.name.toUpperCase()} {...HEADLINE} />
        </div>
        <div aria-hidden className="sm:hidden">
          <div className="h-[19vw]">
            <TechText text={cv.person.name.split(' ')[0].toUpperCase()} {...HEADLINE} />
          </div>
          <div className="-mt-[3vw] h-[19vw]">
            <TechText text={cv.person.name.split(' ')[1].toUpperCase()} {...HEADLINE} />
          </div>
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-3.5 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <FadeIn delay={0.1} className="order-2 md:order-1">
          <div ref={who} className="tile who flex h-full flex-col justify-between gap-6 !p-6 sm:!p-8">
            <div aria-hidden className="pointer-events-auto absolute inset-0 [mask-image:radial-gradient(ellipse_85%_110%_at_100%_0%,#000_20%,transparent_80%)]">
              <MicroSlats color="#1261D6" glintColor="#B7D3FF" backgroundColor="#040B1C" cursorStrength={0.8} paused={!slats || still} />
            </div>
            <div className="relative">
              <p className="text-[clamp(1.1rem,2.1vw,1.5rem)] font-semibold uppercase leading-tight tracking-[0.06em] text-white">{c.headline}</p>
              <p className="mt-1.5 text-[#7FB0FF]">{c.focus}</p>
            </div>
            <ul className="facts relative grid gap-2 text-[0.94rem]">
              <li className="flex gap-2.5">
                <Briefcase aria-hidden />
                <span>{c.terms}</span>
              </li>
              <li className="flex gap-2.5">
                <Globe2 aria-hidden />
                <span>{c.languages.map(([l, level]) => `${l} ${level}`).join(' · ')}</span>
              </li>
              <li className="flex gap-2.5 sm:hidden">
                <MapPin aria-hidden />
                <span>{c.location}</span>
              </li>
            </ul>
            <div className="relative flex flex-wrap gap-2">
              <a className="pill" href={`mailto:${cv.person.email}`}>
                {cv.person.email}
              </a>
              {cv.person.links.map((l) => (
                <a key={l.url} className="pill" href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              ))}
            </div>
            <div className="relative flex flex-wrap items-center gap-3">
              <Magnet padding={80}>
                <ContactButton label={c.ui.download} href={PDF} />
              </Magnet>
              <a className="pill small" href={ATS} download>
                {c.ui.ats}
              </a>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.18} className="order-1 md:order-2">
          <div className="tile group relative aspect-square overflow-hidden !p-0 md:aspect-auto md:h-full md:min-h-[360px]">
            <img src="/cv/portrait.jpg" width={500} height={500} alt={c.ui.portraitAlt} className="absolute inset-0 h-full w-full object-cover object-[center_22%] transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            <span className="badge absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 rounded-full bg-[#0C0C0C]/70 px-3 py-1.5 text-[0.74rem] uppercase tracking-[0.1em] backdrop-blur-md">
              {c.ui.openToWork}
            </span>
          </div>
        </FadeIn>
      </div>

      <div ref={statsRef} className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
        {c.numbers.map((n, i) => {
          const m = n.value.match(/^(\d+)(.*)$/);
          return (
            <FadeIn key={i} delay={i * 0.06} className="tile stat flex flex-col gap-2.5 !p-5">
              <span className="value grad text-[clamp(1.6rem,2.6vw,2.3rem)]">
                {/* a sign (+, %) runs with the number; words after it ("of 127") are set small */}
                {m ? <SpeedNumber value={+m[1]} suffix={/^\s/.test(m[2]) ? '' : m[2]} run={statsSeen} format={String} /> : n.value}
                {m && /^\s/.test(m[2]) && <small className="text-[0.55em] font-semibold">{m[2]}</small>}
              </span>
              <span className="text-[0.84rem] leading-snug text-[#D7E2EA]/65">
                <Rich text={n.label} />
              </span>
            </FadeIn>
          );
        })}
      </div>
    </header>
  );
}

function Summary() {
  return (
    <section id="summary" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6">
      <Title text={c.ui.nav.summary} />
      <div className="grid gap-3.5 lg:grid-cols-12">
        <FadeIn className="tile lg:col-span-12" style={{ background: 'radial-gradient(120% 140% at 85% 0%, rgb(18 97 214 / 0.42), transparent 60%), #040B1C', borderColor: 'rgb(127 176 255 / 0.3)' }}>
          <p className="max-w-[32ch] text-[clamp(1.35rem,2.8vw,2.2rem)] font-medium leading-tight text-white">
            <Rich text={c.summary.lead} />
          </p>
        </FadeIn>
        <FadeIn className="tile lg:col-span-7">
          <span className="label">{c.ui.builtIn2026}</span>
          <h3>
            <Rich text={c.summary.builtIntro} />
          </h3>
          <ul className="mt-3 grid gap-2.5">
            {c.summary.built.map((x, i) => (
              <li key={i} className="grid grid-cols-[30px_1fr] gap-1.5">
                <span className="font-extrabold text-[#7FB0FF]">{two(i)}</span>
                <span>
                  <Rich text={x} />
                </span>
              </li>
            ))}
          </ul>
        </FadeIn>
        <FadeIn delay={0.08} className="tile lg:col-span-5">
          <span className="label">{c.ui.howIDeliver}</span>
          <p>
            <Point text={c.summary.delivery} />
          </p>
          <span className="label mt-5">{c.ui.beforeEngineering}</span>
          <p>
            <Rich text={c.summary.background} />
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

function Delivery() {
  return (
    <div className="sheet mt-24 rounded-t-[40px] bg-white pb-16 pt-20 text-[#0C0C0C] sm:rounded-t-[50px] md:rounded-[60px] md:pt-28">
      <section id="delivery" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 sm:px-6">
        <Title text={c.ui.nav.delivery} sub={c.ui.subs.delivery} light />
        <ol className="rows grid md:grid-cols-2 md:gap-x-14">
          {c.sdlc.map((st, i) => (
            <FadeIn as="li" key={i} delay={(i % 2) * 0.08} className="flex items-start gap-4 py-6 sm:gap-6 md:py-7">
              <span className="num shrink-0 text-[clamp(2.6rem,6vw,5.2rem)]">{two(i)}</span>
              <div>
                <h3 className="text-[clamp(1rem,1.6vw,1.3rem)] font-medium uppercase tracking-[0.02em]">{st.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-[#0C0C0C]/70">
                  <Rich text={st.text} />
                </p>
              </div>
            </FadeIn>
          ))}
        </ol>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <FadeIn className="tile !border-dashed !border-[#0C0C0C]/20 !bg-none !bg-transparent text-[#1d2026] md:col-span-2">
            <span className="label !text-[#0C0C0C]/50">{c.ui.tools}</span>
            <p>
              <Rich text={c.tools} />
            </p>
          </FadeIn>
          {c.aiSystems.map((a, i) => (
            <FadeIn key={i} delay={(i % 2) * 0.08} className="tile !border-0 !bg-[#F2F4F7] !bg-none text-[#1d2026]">
              <span className="label !text-[#0C0C0C]/50">{c.ui.aiSystem}</span>
              <p>
                <Point text={a} />
              </p>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}

// oldest first, down to now: by when each began, then by when it ended (the roles still going last)
const JOBS = cv.experience.map((j, i) => ({ ...j, ...c.experience[i] })).sort((a, b) => a.start.localeCompare(b.start) || (a.end ?? '9999').localeCompare(b.end ?? '9999'));

function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6">
      <Title text={c.ui.nav.experience} sub={c.ui.subs.experience} />
      <ol className="timeline grid gap-3.5">
        {JOBS.map((j) => (
          <FadeIn as="li" key={j.start + j.org} className={`job ${j.end ? '' : 'now'}`}>
            <p className="when text-[0.8rem] uppercase tracking-[0.1em] text-[#D7E2EA]/60">
              <b className="mr-2 text-[1.1rem] font-black tracking-normal text-[#BBCCD7] sm:mr-0 sm:block sm:text-[1.6rem] sm:leading-tight">{j.start.slice(0, 4)}</b>
              {span(j)}
            </p>
            <div className="tile">
              <h3>{j.role}</h3>
              <p className="mb-2 mt-0.5 text-[0.92rem] text-[#D7E2EA]/65">
                {j.url ? (
                  <a href={j.url} target="_blank" rel="noreferrer" className="text-[#7FB0FF]">
                    {j.org}
                  </a>
                ) : (
                  j.org
                )}
                {j.place ? ` · ${j.place}` : ''}
              </p>
              <p className="max-w-[75ch] text-[0.96rem]">
                <Rich text={j.text} />
              </p>
            </div>
          </FadeIn>
        ))}
      </ol>
    </section>
  );
}

// Projects: two rows of their mockups sliding in opposite directions as the page scrolls (the landing's first marquee),
// and the way to the landing, where each one is shown in full.
// (mockups only: the sites on their devices, then the branding and print work as the landing's covers)
const ROWS = [
  ['alibia-0', 'arab-0', 'architect-0', 'blackpoint-0', 'casada-0', 'kreem-0', 'lizard-0', 'magicpatron-0', 'namiclean-0', 'blackpoint-2'].map((name) => `/work/wp-${name}.webp`),
  [1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 19, 20].map((i) => `/tiles/${String(i).padStart(2, '0')}.webp?v=13`),
];
const TILE = 'h-[120px] w-[192px] shrink-0 rounded-2xl sm:h-[160px] sm:w-[256px] md:h-[200px] md:w-[320px]';

function Projects() {
  const section = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = section.current;
      if (!el) return;
      const offset = (window.scrollY - (el.getBoundingClientRect().top + window.scrollY) + window.innerHeight) * 0.3;
      // each row holds three copies of its screens and starts one copy to the left, so both edges stay filled
      rows.current.forEach((row, i) => row && (row.style.transform = `translate3d(${(i ? -1 : 1) * (offset - 200) - row.scrollWidth / 3}px, 0, 0)`));
    };
    const schedule = () => void (raf ||= requestAnimationFrame(update));
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <section id="projects" ref={section} className="scroll-mt-20 pt-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Title text={c.ui.nav.projects} />
      </div>
      <a href={`${langPath(lang)}#projects`} className="flex flex-col gap-3 overflow-hidden py-2" aria-label={c.ui.projectsLink}>
        {ROWS.map((row, i) => (
          <div key={i} ref={(el) => void (rows.current[i] = el)} className="flex w-max gap-3" style={{ willChange: 'transform' }}>
            {[...row, ...row, ...row].map((src, k) => (
              <img key={k} src={src} alt="" loading="lazy" decoding="async" width={320} height={200} className={`${TILE} object-cover`} />
            ))}
          </div>
        ))}
      </a>
      <FadeIn className="mt-10 flex justify-center px-4">
        <Magnet padding={80}>
          <a href={`${langPath(lang)}#projects`} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-[#D7E2EA] px-8 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10 sm:px-10 sm:py-3.5 sm:text-base">
            {c.ui.projectsLink}
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </a>
        </Magnet>
      </FadeIn>
    </section>
  );
}

function Fit() {
  const [all, setAll] = useState<boolean | undefined>(undefined);
  const [open, setOpen] = useState(() => c.fit.map(() => false));
  const anyClosed = open.some((o) => !o);
  return (
    <section id="fit" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6">
      <Title text={c.ui.nav.fit} sub={c.ui.subs.fit}>
        <button
          type="button"
          className="pill small"
          onClick={() => {
            const to = anyClosed;
            setAll(to);
            setOpen(open.map(() => to));
          }}
        >
          {anyClosed ? c.ui.openAll : c.ui.closeAll}
        </button>
      </Title>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {c.fit.map((f, i) => (
          <FadeIn key={i} delay={(i % 2) * 0.08}>
            <Fold
              className="tile fitcell"
              open={all === undefined ? undefined : open[i]}
              onToggle={(to) => setOpen((was) => was.map((o, k) => (k === i ? to : o)))}
              head={
                <>
                  <span className="w-[1.6em] text-2xl font-black leading-none text-[#7FB0FF]">{two(i)}</span>
                  <span className="font-semibold leading-snug text-white">
                    {f.ask}
                    <span className="mt-1 block text-[0.7rem] font-normal uppercase tracking-[0.14em] text-[#D7E2EA]/60">{open[i] ? c.ui.whatShowsIt : c.ui.showEvidence}</span>
                  </span>
                </>
              }
            >
              <p className="px-5 pb-5 text-[0.95rem] sm:pl-[calc(20px+2.4rem+14px)]">
                <Rich text={f.evidence} />
              </p>
            </Fold>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// The diploma as a blue card in 3D, its edge holographic, tilting after the pointer; round it, the languages I speak
// on an orbit, the ones behind it passing behind it.
const CODES = ['EN', 'PL', 'UA', 'RU'];
function Diploma() {
  const card = useRef<HTMLDivElement>(null);
  const e = cv.education[0];
  const tilt = (x: number, y: number) => {
    const el = card.current;
    if (!el || still) return;
    el.style.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 18).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(50 + x * 60).toFixed(1)}%`);
  };
  return (
    <div
      className="diploma-stage"
      onPointerMove={(ev) => {
        const r = ev.currentTarget.getBoundingClientRect();
        tilt((ev.clientX - r.left) / r.width - 0.5, (ev.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => tilt(0, 0)}
    >
      <div className="diploma-world">
        <div ref={card} className="diploma">
          <div className="diploma-face">
            <svg viewBox="0 0 24 24" aria-hidden className="h-9 w-9 text-white/90">
              <path fill="currentColor" d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-6.82 9.18v4L12 20l6.82-3.82v-4L12 16l-6.82-3.82Z" />
            </svg>
            <span className="label !mb-0 !text-white/70">{c.ui.education}</span>
            <p className="mt-auto text-[0.8rem] uppercase tracking-[0.14em] text-white/70">{e.school}</p>
            <p className="text-[1.35rem] font-bold leading-tight text-white">{c.education[0].degree}</p>
            <p className="text-[0.92rem] leading-snug text-white/90">{c.education[0].field}</p>
            <p className="mt-1 font-semibold tabular-nums text-[#B7D3FF]">
              {e.start}–{e.end}
            </p>
          </div>
        </div>
        <div className="orbit" aria-hidden>
          {c.languages.map(([name, level], i) => (
            <span key={name} className="moon" style={{ ['--i' as string]: i, ['--n' as string]: c.languages.length }}>
              <span className="moon-face">
                <b>{CODES[i]}</b>
                <small>{level}</small>
              </span>
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">
        {c.ui.languages}: {c.languages.map(([l, level]) => `${l} ${level}`).join(', ')}
      </p>
    </div>
  );
}

// The skills in eight folders, as the landing's stack: the CV's five groups (data.ts), the first two and the
// third split by what they are; [group, items' indices in it] for each.
const FOLDERS: [string | keyof CvText['ui']['folders'], number, number[]][] = [
  ['', 0, [0, 1, 2, 3, 4, 5, 6]],
  ['llm', 0, [7, 8, 9, 10, 11, 12]],
  ['', 1, [0, 1, 2, 3, 7]],
  ['integrations', 1, [4, 5, 6]],
  ['frontend', 2, [0, 2, 3, 9]],
  ['backend', 2, [1, 4, 5, 6, 7, 8]],
  ['', 3, [0, 1, 2, 3, 4, 5, 6]],
  ['', 4, [0, 1, 2, 3, 4, 5, 6]],
];

function Skills() {
  const folders = FOLDERS.map(([own, g, items]) => {
    const group = c.skills[g];
    const picked = items.map((i) => group.items[i]);
    return { name: own ? c.ui.folders[own as keyof CvText['ui']['folders']] : group.group, items: picked, sub: fill(c.ui.toolsCount, { n: picked.length }) };
  });
  return (
    <section id="skills" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6">
      <Title text={c.ui.nav.skills} sub={c.ui.subs.skills} />
      <FolderShelf folders={folders} />
      <ul className="sr-only">
        {c.skills.map((g) => (
          <li key={g.group}>
            {g.group}: {g.items.join(', ')}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Education() {
  return (
    <section id="education" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pt-24 sm:px-6">
      <Title text={c.ui.education} />
      <FadeIn>
        <Diploma />
      </FadeIn>
    </section>
  );
}

function Footer() {
  const updated = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${cv.UPDATED}T12:00:00Z`));
  const [before, rest] = c.ui.alsoAs.split('{txt}');
  const [mid, rest2] = rest.split('{json}');
  const [and, after] = rest2.split('{pdf}');
  return (
    <footer className="mx-auto mt-24 max-w-[1200px] px-4 pb-12 sm:px-6">
      <div className="border-t border-[#D7E2EA]/15 pt-6 text-[0.85rem] text-[#D7E2EA]/60 [&_a]:underline-offset-2 hover:[&_a]:underline">
        <p>
          {fill(c.ui.updated, { date: updated })} ·{' '}
          <a href={langPath(lang)} className="text-[#D7E2EA]">
            sunlucki.pl
          </a>{' '}
          · {before}
          <a href="/cv/cv.txt">{c.ui.plainText}</a>
          {mid}
          <a href="/cv/resume.json">{c.ui.jsonResume}</a>
          {and}
          <a href={ATS}>{c.ui.onePdf}</a>
          {after}
        </p>
        <div className="mt-4">
          <LangLinks href={cvPath} />
        </div>
        <p className="mt-4 text-[0.74rem]">{cv.consent}</p>
      </div>
    </footer>
  );
}

export function CvPage() {
  useEffect(() => {
    document.title = c.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.meta.description);
    // tiles lit where the pointer is
    const glow = (e: PointerEvent) => {
      const tile = (e.target as Element).closest?.('.cv .tile') as HTMLElement | null;
      if (!tile) return;
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    addEventListener('pointermove', glow, { passive: true });
    return () => removeEventListener('pointermove', glow);
  }, []);
  return (
    <div className="cv min-h-screen overflow-x-clip bg-[#0C0C0C] text-[#D7E2EA]" data-cv-ready>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#0C0C0C]">
        {c.ui.nav.summary}
      </a>
      <TopBar />
      <Head />
      <main id="main">
        <Summary />
        <Delivery />
        <Experience />
        <Projects />
        <Fit />
        <Skills />
        <Education />
      </main>
      <Footer />
    </div>
  );
}
