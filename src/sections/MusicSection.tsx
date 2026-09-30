import { LayoutGroup, motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SectionTitle } from '../components/SectionTitle';
import { MUSIC } from '../content';
import { t } from '../i18n';
import { phoneLayout } from '../three/flow';

const MusicStage = lazy(() => import('../three/MusicStage'));
const source = (i: number) => `/music/${String(i).padStart(3, '0')}.m4a`;
const spectrum = (i: number) => `/music/${String(i).padStart(3, '0')}.bands`; // scripts/prepare-bands.mjs
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const TRACKS = MUSIC.tracks;

// Without WebGL the stage just isn't drawn; the player works the same.
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Music: a player for Bogdan's playlist. On the left his stage, which is the player (three/MusicStage): he stands
 * on a round floor of blue particles, its rim the progress, its middle the play or pause button, moved by the music. On the right the tracks, as cards
 * like the projects' only smaller (Playlist); on phones a short column of them right under the stage (PhoneList). The music plays straight from an <audio> element, so it keeps playing
 * while the page scrolls on and while a phone's screen is locked (sound run through Web Audio stops there), the lock
 * screen showing the track and its controls; the stage moves to the track's spectrum, worked out beforehand.
 */
export function MusicSection() {
  const audio = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [bands, setBands] = useState<{ track: number; data: Uint8Array } | null>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [warm, setWarm] = useState(false); // the stage loads as the section comes near
  const [active, setActive] = useState(false); // and draws only while it's on screen
  const [phone, setPhone] = useState(phoneLayout); // phones: the playlist as a short column (PhoneList)
  useEffect(() => {
    const fit = () => setPhone(phoneLayout());
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ahead = new IntersectionObserver(([entry]) => entry.isIntersecting && setWarm(true), { rootMargin: '100% 0px' });
    const around = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    ahead.observe(el);
    around.observe(el);
    return () => {
      ahead.disconnect();
      around.disconnect();
    };
  }, []);

  // the playing track's spectrum, for the stage
  useEffect(() => {
    if (!started) return;
    let alive = true;
    fetch(spectrum(current))
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((data) => alive && data && setBands({ track: current, data: new Uint8Array(data) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [current, started]);
  const clock = useCallback(() => audio.current?.currentTime ?? 0, []);

  const play = (i: number) => {
    const el = audio.current;
    if (!el) return;
    // music, like a player's (Safari: it plays on with the screen locked and the ringer off)
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    setStarted(true);
    if (i !== current || !el.getAttribute('src')) {
      el.src = source(i);
      setCurrent(i);
      setTime(0);
    }
    void el.play();
  };
  const step = (by: number) => play((current + by + TRACKS.length) % TRACKS.length);
  const toggle = () => (playing ? audio.current?.pause() : play(current));
  // to a point in the track that plays (starting it if it hasn't), once it knows its length
  const seek = (to: number) => {
    const el = audio.current;
    if (!el) return;
    if (!el.getAttribute('src')) play(current);
    const go = () => {
      el.currentTime = to;
      setTime(to);
    };
    if (el.readyState >= 1) go();
    else el.addEventListener('loadedmetadata', go, { once: true });
  };

  // the lock screen and the media keys
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const track = TRACKS[current];
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist ?? MUSIC.artist, album: MUSIC.album });
  }, [current]);
  const handlers = useRef({ play, step });
  useEffect(() => {
    handlers.current = { play, step };
  });
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    session.setActionHandler('play', () => audio.current && handlers.current.play(Number(audio.current.dataset.track ?? 0)));
    session.setActionHandler('pause', () => audio.current?.pause());
    session.setActionHandler('previoustrack', () => handlers.current.step(-1));
    session.setActionHandler('nexttrack', () => handlers.current.step(1));
  }, []);

  const track = TRACKS[current];

  return (
    <section id="music" className="px-4 pb-24 pt-16 sm:px-6 md:px-10 md:pt-24">
      <SectionTitle text={t.music.title} className="mb-4 md:mb-6" />

      <div className="mx-auto mt-6 grid max-w-6xl grid-cols-1 items-center gap-4 md:mt-10 md:grid-cols-[1.3fr_1fr] md:gap-10">
        <div className="min-w-0">
          {/* (its floor built by the particles from the Video section: three/FlowScene.tsx) */}
          <div ref={stage} data-flow="music" className="relative aspect-[4/5] sm:aspect-[5/4] md:aspect-auto md:h-[520px]">
            {warm && (
              <Quiet>
                <Suspense fallback={null}>
                  <div className="absolute inset-0 [animation:fade-in_1s_ease-out]">
                    <MusicStage bands={bands?.track === current ? bands.data : null} clock={clock} playing={playing} active={active} progress={time / track.seconds} onToggle={toggle} onSeek={(at) => seek(at * track.seconds)} />
                  </div>
                </Suspense>
              </Quiet>
            )}
            <div className="pointer-events-none absolute left-0 top-0">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#D7E2EA]/50">{playing ? t.music.nowPlaying : MUSIC.album}</p>
              <p className="mt-1 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">{track.title}</p>
              <p className="mt-1 text-sm text-[#D7E2EA]/60">{track.artist ?? MUSIC.artist}</p>
            </div>
          </div>

          {/* the stage is the player: its twins for the keyboard and screen readers */}
          <div className="sr-only">
            <button type="button" onClick={toggle}>
              {playing ? t.buttons.pause : t.buttons.play}
            </button>
            <button type="button" onClick={() => step(-1)}>
              {t.music.previous}
            </button>
            <button type="button" onClick={() => step(1)}>
              {t.music.next}
            </button>
            <input type="range" min={0} max={track.seconds} step={1} value={Math.min(time, track.seconds)} onChange={(e) => seek(Number(e.target.value))} aria-label={t.music.seek} />
          </div>
          <p className="mt-3 flex justify-center gap-6 text-sm text-[#D7E2EA]/60 md:mt-4">
            {MUSIC.links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="underline-offset-4 transition-colors hover:text-white hover:underline">
                {link.label}
              </a>
            ))}
          </p>
        </div>

        {phone ? (
          <PhoneList current={current} playing={playing} time={time} onPick={(k) => (k === current ? toggle() : play(k))} />
        ) : (
          <Playlist current={current} playing={playing} time={time} onPick={(k) => (k === current ? toggle() : play(k))} />
        )}
      </div>

      <audio
        ref={audio}
        preload="none"
        data-track={current}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => step(1)}
      />
    </section>
  );
}

// The playlist: cards folded to a strip, the one at the list's middle (or under the pointer) open, the one that
// plays lit. An open card grows as much up as down, its neighbours making way on both sides, so the middle holds
// still as the list scrolls; every change springs, with a bounce.
const STRIP = 56;
const OPEN = 112;
const GAP = 10;
const PITCH = STRIP + GAP;
const GROW = OPEN - STRIP;
const SPRING = { type: 'spring', bounce: 0.42, duration: 0.6 } as const;
// The list fades into the page at its top and bottom: a shade in the page's colour over it, which the card that is
// on stays above (a mask would fade it too).
function Shade() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[18%] bg-gradient-to-b from-[#0C0C0C] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[18%] bg-gradient-to-t from-[#0C0C0C] to-transparent" />
    </>
  );
}

type PlaylistProps = { current: number; playing: boolean; time: number; onPick: (k: number) => void };

function Playlist({ current, playing, time, onPick }: PlaylistProps) {
  const list = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(520);
  const [middle, setMiddle] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const settle = useRef(0);
  const open = hover ?? middle;
  const pad = height / 2 - STRIP / 2; // room above the first card and below the last, so each can reach the middle

  // the card at the middle, as the list scrolls; when it stops, it settles with that card right in the middle
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setMiddle(Math.min(TRACKS.length - 1, Math.max(0, Math.round(el.scrollTop / PITCH))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        const to = Math.round(el.scrollTop / PITCH) * PITCH;
        if (Math.abs(to - el.scrollTop) > 1) el.scrollTo({ top: to, behavior: 'smooth' });
      }, 140);
    };
    const size = new ResizeObserver(() => setHeight(el.clientHeight));
    size.observe(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      size.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(settle.current);
    };
  }, []);

  // the track that plays comes to the middle
  useEffect(() => {
    list.current?.scrollTo({ top: current * PITCH, behavior: 'smooth' });
  }, [current]);

  return (
    <div className="relative h-[440px] md:h-[520px]">
      <div
        ref={list}
        role="list"
        aria-label={t.music.playlist}
        className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseLeave={() => setHover(null)}
      >
        <div className="relative" style={{ height: pad * 2 + (TRACKS.length - 1) * PITCH + STRIP }}>
          {TRACKS.map((track, k) => {
            const on = k === current;
            const isOpen = k === open;
            // the open card grows as much up as down; the cards above move up by half of it, those below down
            const y = pad + k * PITCH + (k > open ? GROW / 2 : -GROW / 2);
            return (
              <motion.div
                key={track.title}
                role="listitem"
                className={`absolute inset-x-0 top-0 ${on ? 'z-[2]' : ''}`}
                initial={false}
                animate={{ y, height: isOpen ? OPEN : STRIP }}
                transition={SPRING}
                onMouseEnter={() => setHover(k)}
              >
                <TrackCard track={track} k={k} on={on} open={isOpen} playing={playing} time={time} onPick={onPick} onFocus={() => setHover(k)} onBlur={() => setHover(null)} />
              </motion.div>
            );
          })}
        </div>
      </div>
      <Shade />
    </div>
  );
}

// A track's card: its number, title and length and PLAY (or PAUSE, if it plays); open, its artist and album under
// them and, if it is the one on, how far it has played.
// `morph`: it changes place and size by morphing (the phone list's), its rows moved rather than stretched.
type CardProps = { track: (typeof TRACKS)[number]; k: number; on: boolean; open: boolean; playing: boolean; time: number; onPick: (k: number) => void; onFocus?: () => void; onBlur?: () => void; morph?: boolean };

function TrackCard({ track, k, on, open, playing, time, onPick, onFocus, onBlur, morph = false }: CardProps) {
  return (
    <motion.button
      type="button"
      layout={morph}
      transition={SPRING}
      onClick={() => onPick(k)}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-current={on ? 'true' : undefined}
      style={{ borderRadius: 22 }}
      className={`flex h-full w-full flex-col overflow-hidden border-2 bg-[#0C0C0C] px-4 text-left transition-[border-color,box-shadow] duration-300 sm:px-5 ${
        on ? 'border-[#5B9BFF] shadow-[0_0_28px_rgba(91,155,255,0.35)]' : open ? 'border-[#D7E2EA]' : 'border-[#D7E2EA]/25'
      }`}
    >
      <motion.span layout={morph ? 'position' : false} transition={SPRING} className="flex w-full shrink-0 items-center gap-3" style={{ height: STRIP - 4 }}>
        <span className="hero-heading w-9 shrink-0 text-[26px] font-black leading-none">{String(k + 1).padStart(2, '0')}</span>
        <span className={`min-w-0 flex-1 truncate text-sm font-medium uppercase tracking-wide ${on || open ? 'text-white' : 'text-[#D7E2EA]/70'}`}>{track.title}</span>
        <span className="shrink-0 text-xs tabular-nums text-[#D7E2EA]/50">{clock(track.seconds)}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${on ? 'bg-[#5B9BFF] text-white' : 'bg-white/10 text-[#D7E2EA]'}`}>
          {on && playing ? <Pause className="h-3 w-3" fill="currentColor" /> : <Play className="h-3 w-3 translate-x-px" fill="currentColor" />}
        </span>
      </motion.span>
      <motion.span
        layout={morph ? 'position' : false}
        className="flex w-full items-center gap-3 pl-12 text-[11px] uppercase tracking-[0.2em] text-[#D7E2EA]/45"
        initial={false}
        animate={{ opacity: open ? 1 : 0, y: open ? 0 : -6 }}
        transition={SPRING}
      >
        {track.artist ?? MUSIC.artist} · {MUSIC.album}
        {on && (
          <span className="ml-auto h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-[#5B9BFF]" style={{ width: `${Math.min(100, (time / track.seconds) * 100)}%` }} />
          </span>
        )}
      </motion.span>
    </motion.button>
  );
}

// Phones: the playlist as a short column right under the stage, scrolling within: the card that is on pinned over
// its top and the others running in under it, three in view (the fourth peeking in), shaded where they go under
// and at the bottom; its first eight tracks, or all of them when asked (or once one past the eighth is on). Scrolled
// to its end, the page scrolls on (no trap). A track picked morphs up into the pinned place with a bounce, and the
// one that was there back into its own.
const FIRST = 8;
const PEEK = 22;
const UNDER = OPEN + GAP; // the pinned card and the gap under it

function PhoneList({ current, playing, time, onPick }: PlaylistProps) {
  const [all, setAll] = useState(false);
  const count = all || current >= FIRST ? TRACKS.length : FIRST;
  const others = Array.from({ length: count }, (_, k) => k).filter((k) => k !== current);
  return (
    <div>
      <LayoutGroup id="tracks">
        <div className="relative" style={{ height: OPEN + 3 * PITCH + PEEK }}>
          <motion.div
            layoutScroll
            role="list"
            aria-label={t.music.playlist}
            className="flex h-full flex-col gap-2.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ paddingTop: UNDER }}
          >
            {others.map((k) => (
              <motion.div key={TRACKS[k].title} layoutId={`track-${k}`} layout transition={SPRING} role="listitem" className="shrink-0" style={{ height: STRIP }}>
                <TrackCard track={TRACKS[k]} k={k} on={false} open={false} playing={playing} time={time} onPick={onPick} morph />
              </motion.div>
            ))}
          </motion.div>
          {/* where the tracks go under the pinned card: the page's colour, then a shade; and a shade at the bottom */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-[#0C0C0C]" style={{ height: UNDER - GAP / 2 }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[1] h-10 bg-gradient-to-b from-[#0C0C0C] to-transparent" style={{ top: UNDER - GAP / 2 }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[18%] bg-gradient-to-t from-[#0C0C0C] to-transparent" />
          <motion.div key={TRACKS[current].title} layoutId={`track-${current}`} layout transition={SPRING} className="absolute inset-x-0 top-0 z-[2]" style={{ height: OPEN }}>
            <TrackCard track={TRACKS[current]} k={current} on open playing={playing} time={time} onPick={onPick} morph />
          </motion.div>
        </div>
      </LayoutGroup>
      {current < FIRST && (
        <button
          type="button"
          onClick={() => setAll((shown) => !shown)}
          aria-expanded={all}
          className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-[#D7E2EA]/30 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-[#D7E2EA]/80 transition-colors hover:border-[#D7E2EA]/70 hover:text-white"
        >
          {all ? t.music.fewer : t.music.all}
          {!all && <span className="tabular-nums text-[#D7E2EA]/45">{TRACKS.length}</span>}
        </button>
      )}
    </div>
  );
}
