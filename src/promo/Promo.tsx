import '@fontsource-variable/inter';
import { Player, type CallbackListener, type PlayerRef } from '@remotion/player';
import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react';
import type { Chapter } from '../content';
import type { Lang } from './saas/kit/lang';
import { B2B_SCENES, SAAS_B2B_FRAMES, SaasB2B } from './saas/b2b/SaasB2B';
import { CRM_SCENES, SAAS_CRM_FRAMES, SaasCRM } from './saas/crm/SaasCRM';
import { HR_SCENES, SAAS_HR_FRAMES, SaasHR } from './saas/hr/SaasHR';
import { SAAS_TAXI_FRAMES, SaasTAXI, TAXI_SCENES } from './saas/taxi/SaasTAXI';
import { t } from '../i18n';

// The products' 2D promos (SIMBIA repo, promo/wideo-2d at 2ba662f: Claude outputs/promo-remotion/src/saas), 1920 × 1080
// at 30 fps, played in English: each a pure function of the frame, so any frame shows at once and seeking is exact.
const PROMOS: Record<string, { component: ComponentType<{ lang?: Lang }>; frames: number; scenes: { id: string; from: number }[] }> = {
  crm: { component: SaasCRM, frames: SAAS_CRM_FRAMES, scenes: CRM_SCENES },
  hr: { component: SaasHR, frames: SAAS_HR_FRAMES, scenes: HR_SCENES },
  b2b: { component: SaasB2B, frames: SAAS_B2B_FRAMES, scenes: B2B_SCENES },
  taxi: { component: SaasTAXI, frames: SAAS_TAXI_FRAMES, scenes: TAXI_SCENES },
};

// Where each promo was when its card went under, to go on from there when it comes back on top.
const left = new Map<string, number>();

type PromoProps = { id: string; chapters: Chapter[] };

/**
 * A product's promo, played live in its project's window: Remotion's player, muted and looping (reduced motion:
 * paused until asked), filling the window's width (the top and bottom may crop), with a chapter for each
 * scenario that jumps there, the one playing lit; below, a play/pause button and the progress, which seeks.
 */
export default function Promo({ id, chapters }: PromoProps) {
  const player = useRef<PlayerRef>(null);
  const { component, frames, scenes } = PROMOS[id];
  const marks = useMemo(
    () => chapters.flatMap((chapter) => scenes.filter((scene) => scene.id === chapter.scene).map((scene) => ({ label: chapter.label, from: scene.from }))),
    [chapters, scenes],
  );
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const progress = useRef<HTMLDivElement>(null);
  const still = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const update: CallbackListener<'frameupdate'> = (e) => {
      left.set(id, e.detail.frame);
      setCurrent(marks.findLastIndex((mark) => mark.from <= e.detail.frame));
      if (progress.current) progress.current.style.transform = `scaleX(${(e.detail.frame / (frames - 1)).toFixed(4)})`;
    };
    const play = () => setPlaying(true);
    const pause = () => setPlaying(false);
    p.addEventListener('frameupdate', update);
    p.addEventListener('play', play);
    p.addEventListener('pause', pause);
    setPlaying(p.isPlaying());
    return () => {
      p.removeEventListener('frameupdate', update);
      p.removeEventListener('play', play);
      p.removeEventListener('pause', pause);
    };
  }, [id, marks, frames]);

  const jump = (from: number) => {
    player.current?.seekTo(from);
    player.current?.play();
  };
  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget.getBoundingClientRect();
    jump(Math.round(((e.clientX - bar.left) / bar.width) * (frames - 1)));
  };

  return (
    // a size container, so the film can cover it whatever its shape
    <div className="absolute inset-0 overflow-hidden [container-type:size]">
      <Player
        ref={player}
        component={component}
        inputProps={{ lang: 'en' }}
        durationInFrames={frames}
        fps={30}
        compositionWidth={1920}
        compositionHeight={1080}
        initialFrame={left.get(id) ?? 0}
        autoPlay={!still}
        loop
        initiallyMuted
        style={{ position: 'absolute', left: '50%', top: '50%', width: 'max(100cqw, 100cqh * 16 / 9)', aspectRatio: '16 / 9', transform: 'translate(-50%, -50%)' }}
      />
      <nav aria-label={t.projects.scenarios} className="absolute inset-x-0 top-0 flex gap-2 overflow-x-auto bg-gradient-to-b from-black/45 to-transparent p-3 sm:p-4 [scrollbar-width:none]">
        {marks.map((mark, i) => (
          <button
            key={mark.label}
            type="button"
            onClick={() => jump(mark.from)}
            aria-current={i === current ? 'step' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors sm:px-4 sm:text-sm ${
              i === current ? 'bg-white text-[#0C0C0C]' : 'bg-black/45 text-white hover:bg-black/65'
            }`}
          >
            {mark.label}
          </button>
        ))}
      </nav>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/45 to-transparent px-4 pb-3 pt-8 sm:px-6 sm:pb-4">
        <button
          type="button"
          onClick={() => player.current?.toggle()}
          aria-label={playing ? t.buttons.pause : t.buttons.play}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/65"
        >
          {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" />}
        </button>
        <div aria-hidden onClick={seek} className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/30 backdrop-blur-md">
          <div ref={progress} className="absolute inset-0 origin-left bg-white" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}
