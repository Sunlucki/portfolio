import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, glide, mix, span, spring } from '../kit/motion'
import { Painted, canvasOf } from '../kit/painted'
import { Tap } from '../kit/pointer'
import { IPHONE, LAPTOP_RATIO, Laptop, Phone } from '../kit/surfaces'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Deck, Sweep } from '../kit/transitions'
import { useSoundTrack } from '../kit/sound'
import { centerOf, useCueList } from './common'
import { LIGHT, PHONE_TAPS, caption, crmLaptopLead, crmLaptopPulpit, crmMobileLeadCard, crmPhone, tag, useCrmTwins } from './twins'

/* 19–20 · 06 Mobile · Тот же CRM в телефоне; с ноутбука — в карман. Рядом
   с ноутбуком поднимается iPhone: веб-CRM в Safari — пульт, меню, «Leady»,
   карточка лида (касания без курсора). Затем карточка лида отрывается от
   экрана ноутбука и перелетает в телефон — камера следует за ней. */

const LAPTOP = { x: 70, y: 190, screen: 1060 }
const BEZEL = LAPTOP.screen * 0.022
const LAPTOP_SCREEN: Rect = (() => {
  const lid = LAPTOP.screen + BEZEL * 2
  const base = lid * 1.14
  return { x: LAPTOP.x + (base - lid) / 2 + BEZEL, y: LAPTOP.y + BEZEL, width: LAPTOP.screen, height: LAPTOP.screen * LAPTOP_RATIO }
})()
const PHONE_SCALE = 0.98
const PHONE_FRAME = { bezel: 12 * PHONE_SCALE, rim: 3.5 * PHONE_SCALE }
const PHONE_AT = { x: 1400, y: 96 }
const PHONE_SCREEN: Rect = { x: PHONE_AT.x + PHONE_FRAME.bezel + PHONE_FRAME.rim, y: PHONE_AT.y + PHONE_FRAME.bezel + PHONE_FRAME.rim, width: IPHONE.width * PHONE_SCALE, height: IPHONE.height * PHONE_SCALE }
const PHONE_RECT: Rect = { x: PHONE_AT.x, y: PHONE_AT.y, width: PHONE_SCREEN.width + (PHONE_FRAME.bezel + PHONE_FRAME.rim) * 2, height: PHONE_SCREEN.height + (PHONE_FRAME.bezel + PHONE_FRAME.rim) * 2 }
/** Точка экрана телефона (pt iOS) → мир. */
const onPhone = (x: number, y: number): [number, number] => [PHONE_SCREEN.x + x * PHONE_SCALE, PHONE_SCREEN.y + y * PHONE_SCALE]
const DEVICES_VIEW = fit({ x: LAPTOP.x, y: PHONE_AT.y, width: PHONE_RECT.x + PHONE_RECT.width - LAPTOP.x, height: PHONE_RECT.height }, { margin: 50 })
const PHONE_VIEW = focus(PHONE_RECT, { fill: 0.4, tall: 0.94, shift: [220, 0] })

type Screen = 'pulpit' | 'menu' | 'leads' | 'leadsTap' | 'lead'

/** Экран телефона со сменой: новое состояние въезжает (меню — слева, карточка —
    справа, как push в iOS), остальное — растворяется. */
function PhoneScreens({ frame, sources, steps }: { frame: number; sources: Record<Screen, HTMLCanvasElement | null>; steps: { at: number; screen: Screen }[] }) {
  let current = steps[0]!
  let previous: (typeof steps)[number] | null = null
  for (const step of steps) {
    if (frame >= step.at) {
      previous = step === current ? previous : current
      current = step
    }
  }
  const t = glide(span(frame, current.at, 12))
  const from = current.screen === 'menu' ? -1 : current.screen === 'lead' ? 1 : 0
  return (
    <>
      {previous && t < 1 && <Painted source={sources[previous.screen]} style={{ inset: 0, transform: from !== 0 ? `translateX(${-from * 30 * t}%)` : undefined }} />}
      <Painted source={sources[current.screen]} style={{ inset: 0, opacity: from === 0 ? (previous ? t : 1) : 1, transform: from !== 0 && previous ? `translateX(${from * 100 * (1 - t)}%)` : undefined, boxShadow: from !== 0 && t < 1 ? '-20px 0 40px rgba(15, 23, 42, 0.18)' : undefined }} />
    </>
  )
}

/* ── 19 · Тот же CRM в телефоне ──────────────────────────────────────────
   0–26    ноутбук (на экране — пульт) въезжает снизу — колода (П8), станция 18
           уходит в неё
   18–50   рядом с ноутбуком поднимается iPhone
   40–66   камера на телефон
   72      касание «≡» — меню; 112 — «Leady»; 152 — Marek Zieliński
   162     карточка лида въезжает справа
   172–260 выноска «Ten sam CRM w telefonie.» */

const TAPS_19 = [
  { at: 72, point: PHONE_TAPS.menu, screen: 'menu' as Screen },
  { at: 112, point: PHONE_TAPS.leady, screen: 'leads' as Screen },
  { at: 152, point: PHONE_TAPS.hero, screen: 'leadsTap' as Screen },
]

const CAMERA_19: CameraKey[] = [
  { at: 0, ...DEVICES_VIEW },
  { at: 40, dur: 26, ...PHONE_VIEW },
]

export function MobileSame() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const tex = useCrmTwins(() => ({
    laptop: canvasOf(crmLaptopPulpit()),
    screens: { pulpit: canvasOf(crmPhone('pulpit')), menu: canvasOf(crmPhone('menu')), leads: canvasOf(crmPhone('leads')), leadsTap: canvasOf(crmPhone('leadsTap')), lead: canvasOf(crmPhone('lead')) },
  }))
  const camera = viewAt(CAMERA_19, frame)
  const enter = glide(span(frame, 0, 26))
  const rise = spring(frame, 18, SPRINGS.heavy)
  const steps = [{ at: 0, screen: 'pulpit' as Screen }, ...TAPS_19.map((tap) => ({ at: tap.at + 2, screen: tap.screen })), { at: 162, screen: 'lead' as Screen }]
  const [ax, ay] = camera.project(...onPhone(24, 190))

  /* Звук: телефон поднимается рядом с ноутбуком; меню и карточка лида въезжают
     (push в iOS). Касания, колода и выноска звучат сами. */
  useCueList([
    [18, 'whoosh', centerOf(PHONE_RECT, camera.project), 0.5, 0.7],
    [TAPS_19[0]!.at + 2, 'whoosh', centerOf(PHONE_SCREEN, camera.project), 0.3, 0.35],
    [162, 'whoosh', centerOf(PHONE_SCREEN, camera.project), 0.3, 0.35],
  ])

  return (
    <AbsoluteFill>
      <Deck t={enter - 1}>
      <Camera view={camera}>
        <Laptop width={LAPTOP.screen} style={{ left: LAPTOP.x, top: LAPTOP.y }}>
          <Painted source={tex.laptop} style={{ inset: 0 }} />
        </Laptop>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${(1 - rise) * 900}px)`, opacity: clamp01(rise * 2) }}>
          <Phone scale={PHONE_SCALE} screen={LIGHT.bg} statusBar={false} style={{ left: PHONE_AT.x, top: PHONE_AT.y }}>
            <PhoneScreens frame={frame} sources={tex.screens} steps={steps} />
          </Phone>
        </div>
        {TAPS_19.map((tap) => {
          const [x, y] = onPhone(tap.point.x, tap.point.y)
          return <Tap key={tap.at} x={x} y={y} at={tap.at} scale={PHONE_SCALE} />
        })}
      </Camera>
      </Deck>
      <Callout anchor={[ax, ay]} box={{ x: ax - 90 - (lang === 'en' ? 600 : 560), y: ay - 60, width: lang === 'en' ? 600 : 560 }} tag={tag(19, lang)} title={caption(19, lang)} at={176} until={262} />
    </AbsoluteFill>
  )
}

/* ── 20 · С ноутбука — в карман ──────────────────────────────────────────
   0–26    оба устройства: на ноутбуке пульт сменяется карточкой лида; телефон —
           «назад» к «Leady» (карточка со станции 19 уезжает вправо)
   26–44   карточка Marek Zieliński отрывается от экрана ноутбука
   44–104  летит дугой в телефон (камера следует за ней), садится с отскоком
   108–122 на телефоне открывается карточка лида
   124–206 выноска «Na biurku i w kieszeni.»
   230–240 уход — шторка-предмет (П12): корпус телефона проносится у камеры,
           склейка под ним; вторую половину хода доигрывает станция 21 */

export const HANDOFF_BEATS = 16
/** Кадров на половину хода шторки П12 (вторая половина — в станции 21). */
export const SWEEP_HALF = 10

const CARD_PT = { x: 16, y: 276, width: 361, height: 158 }
const CARD_FROM: Rect = { x: LAPTOP_SCREEN.x + LAPTOP_SCREEN.width * 0.3, y: LAPTOP_SCREEN.y + LAPTOP_SCREEN.height * 0.16, width: LAPTOP_SCREEN.width * 0.4, height: LAPTOP_SCREEN.width * 0.4 * (158 / 361) }
const CARD_TO: Rect = { x: PHONE_SCREEN.x + CARD_PT.x * PHONE_SCALE, y: PHONE_SCREEN.y + CARD_PT.y * PHONE_SCALE, width: CARD_PT.width * PHONE_SCALE, height: CARD_PT.height * PHONE_SCALE }
const FLY = { start: 44, dur: 56 }
const LAND = FLY.start + FLY.dur

function cardAt(frame: number): Rect {
  const lift = glide(span(frame, 26, 18))
  const t = glide(span(frame, FLY.start, FLY.dur))
  const up = { ...CARD_FROM, y: CARD_FROM.y - 60 * lift }
  const x = mix(up.x, CARD_TO.x, t)
  const y = mix(up.y, CARD_TO.y, t) - Math.sin(Math.PI * t) * 220
  const width = mix(up.width * (1 + 0.1 * lift), CARD_TO.width, t)
  return { x, y, width, height: width * (158 / 361) }
}

const CAMERA_20: CameraKey[] = [
  { at: 0, ...PHONE_VIEW },
  { at: 4, dur: 24, ...DEVICES_VIEW },
  { at: FLY.start - 4, dur: 18, follow: follow((f) => { const r = cardAt(f); return [r.x + r.width / 2, r.y + r.height / 2] }, { zoom: 1.2, lag: 10 }) },
  { at: LAND, dur: 26, ...PHONE_VIEW },
]

export function MobileHandoff() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const tex = useCrmTwins(() => ({
    laptop: canvasOf(crmLaptopLead()),
    pulpit: canvasOf(crmLaptopPulpit()),
    card: canvasOf(crmMobileLeadCard()),
    leads: canvasOf(crmPhone('leads')),
    lead: canvasOf(crmPhone('lead')),
    leadBack: canvasOf(crmPhone('lead')),
  }))
  const camera = viewAt(CAMERA_20, frame)
  const back = glide(span(frame, 4, 16))
  const card = cardAt(frame)
  const flying = frame >= 26 && frame < LAND + 16
  const bounce = frame >= LAND ? 1 + 0.06 * Math.sin(Math.PI * clamp01(span(frame, LAND, 10))) : 1
  const open = glide(span(frame, LAND + 8, 16))
  const lift = glide(span(frame, 26, 18))
  const [ax, ay] = camera.project(CARD_TO.x + CARD_TO.width * 0.06, CARD_TO.y + CARD_TO.height * 0.4)

  /* Звук: телефон — «назад» к списку; карточка отрывается от ноутбука, летит
     (камера за ней), садится в телефон и раскрывается — лид в телефоне.
     Выноска и шторка звучат сами. */
  const phone = centerOf(PHONE_SCREEN, camera.project)
  useCueList([
    [4, 'whoosh', phone, 0.3, 0.4],
    [26, 'popIn', centerOf(CARD_FROM, camera.project), 0.6],
    [LAND, 'thump', centerOf(CARD_TO, camera.project), 0.6],
    [LAND + 8, 'notify', phone, 0.7],
  ])
  const [flyX, flyY] = centerOf(card, camera.project)
  useSoundTrack('crm-handoff-2d', 'whoosh', frame > FLY.start && frame < LAND, { x: flyX, y: flyY }, { gain: 0.6 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Laptop width={LAPTOP.screen} style={{ left: LAPTOP.x, top: LAPTOP.y }}>
          <Painted source={tex.laptop} style={{ inset: 0 }} />
          {/* На ноутбуке со станции 19 — пульт: он сменяется карточкой лида,
              пока телефон уходит «назад». */}
          {back < 1 && <Painted source={tex.pulpit} style={{ inset: 0, opacity: 1 - back }} />}
        </Laptop>
        <Phone scale={PHONE_SCALE} screen={LIGHT.bg} statusBar={false} style={{ left: PHONE_AT.x, top: PHONE_AT.y }}>
          <Painted source={tex.leads} style={{ inset: 0 }} />
          {/* Со станции 19 на телефоне открыта карточка — «назад» к списку, как в iOS.
              Едет только страница: строка состояния и адресная строка Safari
              (снизу 76 pt, как у painter'а телефона) стоят на месте. */}
          {back < 1 && (
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${IPHONE.top * PHONE_SCALE}px 0 ${76 * PHONE_SCALE}px 0)` }}>
              <Painted source={tex.leadBack} style={{ inset: 0, transform: `translateX(${back * 100}%)`, boxShadow: '-20px 0 40px rgba(15, 23, 42, 0.18)' }} />
            </div>
          )}
          {/* Карточка раскрывается в экран лида: маска от карточки к экрану. */}
          {open > 0 && (
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${mix(CARD_PT.y, 0, open) * PHONE_SCALE}px ${mix(IPHONE.width - CARD_PT.x - CARD_PT.width, 0, open) * PHONE_SCALE}px ${mix(IPHONE.height - CARD_PT.y - CARD_PT.height, 0, open) * PHONE_SCALE}px ${mix(CARD_PT.x, 0, open) * PHONE_SCALE}px round 16px)` }}>
              <Painted source={tex.lead} style={{ inset: 0 }} />
            </div>
          )}
        </Phone>
        {flying && open < 0.5 && (
          <div style={{ position: 'absolute', left: card.x, top: card.y, width: card.width, height: card.height, borderRadius: 14, background: LIGHT.card, boxShadow: `${SHADOW.lifted}, 0 0 0 2px ${tint(LIGHT.teal, 0.35 * lift)}`, transform: `scale(${bounce})` }}>
            <Painted source={tex.card} style={{ inset: 0 }} />
          </div>
        )}
      </Camera>
      <Callout anchor={[ax, ay]} box={{ x: ax - 90 - (lang === 'en' ? 630 : 540), y: ay - 60, width: lang === 'en' ? 630 : 540 }} tag={tag(20, lang)} title={caption(20, lang)} at={LAND + 24} until={LAND + 106} />
      <Sweep t={0.5 * span(frame, HANDOFF_BEATS * 15 - SWEEP_HALF, SWEEP_HALF)} />
    </AbsoluteFill>
  )
}

