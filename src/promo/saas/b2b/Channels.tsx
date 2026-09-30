import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, viewAt, type CameraKey } from '../kit/camera'
import { Connector, bezierPoint, flowCurve } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { FONT, INK, MUTED, SHADOW, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { CHANNELS, caption, tag } from './data'
import { GlassCard, IconTile } from './parts'
import { ShippingLabel } from './screens/Admin'
import { Glyph, L, Sheet } from './twin'

/* 18 · 05 Realizacja · Каналы продаж (18 долей). Этикетка из прошлой сцены
   складывается в посылку и падает в узел «Magazyn» по центру. Вокруг по
   очереди встают карточки каналов (текстом, без логотипов): Allegro,
   WooCommerce, Empik, Shoper, Shopify, Erli — «Włączony», «Stany · Oferty ·
   Zamówienia». Линии от склада к каждому каналу рисуются, по ним катятся
   плитки остатка «480 szt.» — один склад, одни остатки везде. Над узлом —
   «Kanały sprzedaży» и «Silnik włączony».

   0–26     этикетка сжимается в посылку и летит в узел
   14–30    узел встаёт; 22 — заголовок
   30–66    карточки каналов ребром → лицом через 6 кадров
   40–80    линии рисуются; 70–230 плитки остатка бегут к каналам
   120–220  выноска 18 */

const HUB: Rect = { x: 960 - 170, y: 560 - 92, width: 340, height: 184 }
const CARD = { w: 400, h: 150 }
const SIDE = [
  { x: 110, y: 250 },
  { x: 110, y: 465 },
  { x: 110, y: 680 },
  { x: 1410, y: 250 },
  { x: 1410, y: 465 },
  { x: 1410, y: 680 },
]
const cardRect = (i: number): Rect => ({ x: SIDE[i]!.x, y: SIDE[i]!.y, width: CARD.w, height: CARD.h })
const LEFT = (i: number) => i < 3
const curveOf = (i: number) => {
  const c = cardRect(i)
  return LEFT(i)
    ? flowCurve([HUB.x, HUB.y + HUB.height / 2], [c.x + c.width, c.y + c.height / 2], 0.5)
    : flowCurve([HUB.x + HUB.width, HUB.y + HUB.height / 2], [c.x, c.y + c.height / 2], 0.5)
}

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1.08 },
  { at: 0, dur: 30, ...HOME },
  { at: 40, dur: 200, ease: (t: number) => t, x: 960, y: 560, zoom: 1.06 },
]

/** Этикетка в конце сцены InPost: центр в кадре, ширина, наклон. */
const LABEL_START = { x: 740, y: 540, width: 998, rotate: -2.5 }

export const CHANNELS_FRAMES = 255

export function Channels() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const tr = useT()
  const camera = viewAt(CAMERA, frame)
  const fold = glide(span(frame, 0, 26))
  const hub = spring(frame, 14, SPRINGS.pop)
  const title = easeOut(span(frame, 22, 14))
  const [hx, hy] = camera.project(HUB.x + HUB.width / 2, HUB.y + 70)
  /* Выноска 18 — на узле «Magazyn», рамка справа внизу. */
  const anchor = camera.project(HUB.x + HUB.width * 0.5, HUB.y + HUB.height - 20)
  /* Уход: композиция отступает и гаснет (под встающим телефоном). */
  const exit = easeIn(span(frame, CHANNELS_FRAMES - 4, 18))
  /* Звук (карточки каналов ребром → лицом, линии, выноска, камера — у
     набора): этикетка складывается в посылку и летит в узел, узел встаёт,
     посылка падает в него; по линиям текут плитки остатков (две волны). */
  useSoundTrack('b2b-parcel', 'whoosh', frame >= 0 && frame <= 24, { x: mix(LABEL_START.x, hx, fold), y: mix(LABEL_START.y, hy, fold) }, { gain: 0.55 })
  useSoundCue('popIn', 14, { x: hx, y: hy }, { gain: 0.6 })
  useSoundCue('thump', 24, { x: hx, y: hy }, { gain: 0.55 })
  useSoundCues('air', [70, 140], { x: 960, y: 560 }, { gain: 0.35, seconds: 1.2 })
  return (
    <AbsoluteFill style={{ opacity: 1 - exit, transform: `scale(${mix(1, 0.92, exit)})` }}>
      <Camera view={camera}>
        {/* Заголовок экрана «Kanały sprzedaży» и «Silnik włączony» над узлом. */}
        <div style={{ position: 'absolute', left: 960 - 400, top: 110, width: 800, textAlign: 'center', fontFamily: FONT, opacity: title, transform: `translateY(${(1 - title) * 14}px)` }}>
          <div style={{ fontSize: 44, fontWeight: 750, letterSpacing: '-0.02em', color: INK }}>{tr('Kanały sprzedaży', 'Sales channels')}</div>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 600, color: L.emeraldText }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: L.emerald }} />
            {tr('Silnik włączony', 'Engine on')}
          </div>
        </div>
        {CHANNELS.map((name, i) => {
          const curve = curveOf(i)
          return <Connector key={name} from={curve.a} to={curve.d} p={easeInOut(span(frame, 40 + i * 5, 18))} frame={frame + i * 6} flowing={easeOut(span(frame, 56 + i * 5, 12))} period={42} beads={2} />
        })}
        {CHANNELS.map((name, i) => {
          /* Плитки остатка «480 szt.» — по одной на канал, волнами. */
          const tiles = [0, 1].map((wave) => {
            const start = 70 + i * 9 + wave * 70
            const t = easeInOut(span(frame, start, 40))
            if (frame < start || t >= 1) return null
            const [x, y] = bezierPoint(curveOf(i), t)
            const o = Math.min(1, t / 0.12, (1 - t) / 0.12)
            return (
              <div key={wave} style={{ position: 'absolute', left: x - 64, top: y - 23, width: 128, height: 46, borderRadius: 14, background: '#ffffff', boxShadow: `0 0 0 1px rgba(250,79,0,0.4), ${SHADOW.card}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', boxSizing: 'border-box', fontFamily: FONT, opacity: o }}>
                <Glyph n="package" s={20} c={L.primary} />
                <span style={{ fontSize: 17, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{tr('480 szt.', '480 pcs')}</span>
              </div>
            )
          })
          return <div key={name}>{tiles}</div>
        })}
        {CHANNELS.map((name, i) => {
          const start = 30 + i * 6
          const turn = spring(frame, start, SPRINGS.pop)
          const r = cardRect(i)
          return (
            <Flip
              key={name}
              angle={90 * (1 - turn)}
              style={{ left: r.x, top: r.y, width: r.width, height: r.height, opacity: frame < start ? 0 : 1 }}
              front={
                <GlassCard rect={{ x: 0, y: 0, width: r.width, height: r.height }} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <IconTile name="radio" p={easeOut(span(frame, start + 4, 16))} size={52} />
                    <div style={{ fontSize: 30, fontWeight: 750, letterSpacing: '-0.02em' }}>{name}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 17 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: L.emeraldText, fontWeight: 600 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 5, background: L.emerald }} />
                      {tr('Włączony', 'Enabled')}
                    </span>
                    <span style={{ color: MUTED, fontWeight: 500 }}>{tr('Stany · Oferty · Zamówienia', 'Stock · Offers · Orders')}</span>
                  </div>
                </GlassCard>
              }
            />
          )
        })}
        <div style={{ position: 'absolute', left: HUB.x, top: HUB.y, width: HUB.width, height: HUB.height, opacity: clamp01(hub * 1.4), transform: `scale(${mix(0.85, 1, clamp01(hub))})` }}>
          <GlassCard rect={{ x: 0, y: 0, width: HUB.width, height: HUB.height }} radius={30} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1.5px rgba(250,79,0,0.35), ${SHADOW.lifted}` }}>
            <IconTile name="warehouse" p={easeOut(span(frame, 18, 22))} size={70} />
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>{tr('Magazyn', 'Warehouse')}</div>
          </GlassCard>
        </div>
      </Camera>
      {/* Этикетка прошлой сцены складывается и падает в узел. */}
      {fold < 1 && (
        <div
          style={{
            position: 'absolute',
            left: mix(LABEL_START.x, hx, fold) - LABEL_START.width / 2,
            top: mix(LABEL_START.y, hy, fold) - (LABEL_START.width * 210) / 296 / 2,
            width: LABEL_START.width,
            height: (LABEL_START.width * 210) / 296,
            transform: `rotate(${mix(LABEL_START.rotate, 12, fold)}deg) scale(${mix(1, 0.06, fold)})`,
            opacity: 1 - easeIn(span(frame, 16, 10)),
            borderRadius: 14,
            boxShadow: SHADOW.lifted,
          }}
        >
          <Sheet w={296} h={210} scale={LABEL_START.width / 296} style={{ left: 0, top: 0 }}>
            <ShippingLabel gauge="Gabaryt B" bars={1} />
          </Sheet>
        </div>
      )}
      {/* Английская подпись в одну строку (рамка шире): в две строки рамка
          опускалась ниже 990 — сайт обрезает низ кадра. */}
      <Callout anchor={anchor} box={{ x: anchor[0] - 250, y: anchor[1] + 190, width: lang === 'en' ? 620 : 560 }} tag={tag(18, lang)} title={caption(18, lang)} at={120} until={222} />
    </AbsoluteFill>
  )
}

