import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, easeIn, easeInOut, easeOut, glide, readFrames, span, spring } from '../kit/motion'
import { Painted, canvasOf, textWidth } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { tint, type Rect } from '../kit/theme'
import { Deck, Flip, Portal } from '../kit/transitions'
import { PopIn, Toast } from '../kit/ui'
import { SCREEN, Screen, centerOf, place, useCueList } from './common'
import { FAN, FAN_CARD } from './LeadCard'
import {
  ATTENTION,
  CALL_DIALOG,
  CALL_OK,
  LEAD_CARD,
  LIGHT,
  caption,
  crmAttentionCard,
  crmCallDialog,
  crmContactBlock,
  crmHistoryBlock,
  crmHistoryEntry,
  crmLeadCardBase,
  crmScoringBlock,
  crmSequenceBlock,
  historyFirstEntry,
  leadCardLayout,
  tag,
  useCrmTwins,
} from './twins'

/* 09–10 · 03 Sprzedaż · Priorytety и звонок. Плитка приоритета становится
   первой картой веера «Wymagają uwagi»; карты переворачиваются — на обороте
   совет движка приоритетов. «Zadzwoń» на карте раскрывается порталом в
   карточку лида: «Jak poszła rozmowa?» — «Dodzwoniłem się» — запись встаёт
   в «Historia kontaktu». */

const L = leadCardLayout()
const BLOCKS = {
  scoring: place(L.scoring, LEAD_CARD.width),
  contact: place(L.contact, LEAD_CARD.width),
  sequence: place(L.sequence, LEAD_CARD.width),
  history: place(L.history, LEAD_CARD.width),
}
const CARD_VIEW = fit(SCREEN, { max: 1.1, margin: 70 })

/* ── 09 · «Wymagają uwagi» ────────────────────────────────────────────────
   0–30    ещё три карты поднимаются снизу веером (pop)
   36–96   карты переворачиваются по очереди через 14 кадров (П15): на
           обороте — совет движка
   100–130 наезд на первую карту (она выпрямляется, остальные отступают) —
           совет Marek Zieliński крупно
   120–212 выноска «Priorytety: kto utknął i co zrobić.»
   214–236 курсор к «Zadzwoń» на карте, 236 — клик
   238–266 «Zadzwoń» раскрывается порталом в карточку лида (П1) */

const FLIP_AT = (i: number) => 36 + i * 14
const CALL_CLICK = 236
/** Кнопка «Zadzwoń» на обороте карты (холст 420 × 600): доли карты. */
const CALL_ON_CARD = { x: 28 / 420, y: 508 / 600, width: 180 / 420, height: 56 / 600 }
const FAN0 = FAN[0]!.rect
const CALL_RECT: Rect = { x: FAN0.x + CALL_ON_CARD.x * FAN0.width, y: FAN0.y + CALL_ON_CARD.y * FAN0.height, width: CALL_ON_CARD.width * FAN0.width, height: CALL_ON_CARD.height * FAN0.height }
/** По-английски кнопка «Call» уже: портал растёт из неё самой (ширина — как
    у button() художника: подпись 24 px, иконка 28 + 14, поля 40, холст 420). */
const callRect = (lang: Lang): Rect => (lang === 'en' ? { ...CALL_RECT, width: ((textWidth('Call', 24, 600) + 82) / 420) * FAN0.width } : CALL_RECT)

const CAMERA_09: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 100, dur: 30, ...focus(FAN0, { fill: 0.34, shift: [-250, 0] }) },
  { at: 236, dur: 30, ...CARD_VIEW },
]

export function PriorityFan() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const call = callRect(lang)
  const cards = useCrmTwins(() => ATTENTION.map((_, i) => ({ front: canvasOf(crmAttentionCard(i, 'front')), back: canvasOf(crmAttentionCard(i, 'back')) })))
  const camera = viewAt(CAMERA_09, frame)
  const portal = glide(span(frame, CALL_CLICK + 2, 28))
  const away = easeInOut(span(frame, CALL_CLICK + 4, 18))
  /* Карта, на которую наезжает камера, выпрямляется. */
  const straight = 1 - glide(span(frame, 100, 30))
  /* Остальные карты отступают и гаснут: место под выноску. */
  const back = glide(span(frame, 100, 28))
  const [ax, ay] = camera.project(FAN0.x + FAN0.width * 0.64, FAN0.y + FAN0.height * 0.1)

  /* Звук: ещё три карты поднимаются снизу веером. Перевороты, клик и портал
     звучат сами. */
  useCueList([[10, 'layers', centerOf(FAN[2]!.rect, camera.project), 0.5, 0.6]])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {FAN.map(({ rect, rotate }, i) => {
          const rise = i === 0 ? 1 : spring(frame, 4 + i * 6, SPRINGS.pop)
          const turn = spring(frame, FLIP_AT(i), SPRINGS.snap)
          const card = cards[i]!
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                transform: `translateX(${i === 0 ? 0 : back * 240}px) translateY(${(1 - rise) * 720 + (i === 0 ? 0 : away * 60)}px) rotate(${rotate * (i === 0 ? straight : 1)}deg) scale(${i === 0 ? 1 : 1 - 0.08 * back})`,
                opacity: (i === 0 ? 1 : Math.min(1, rise * 1.5) * (1 - 0.72 * back)) * (i === 0 ? 1 : 1 - away),
              }}
            >
              <Flip
                angle={180 * turn}
                style={{ left: 0, top: 0, width: rect.width, height: rect.height }}
                front={<Face source={card.front} />}
                back={<Face source={card.back} pressed={i === 0 ? pressOf(frame) : 0} />}
              />
            </div>
          )
        })}
        {/* П1: «Zadzwoń» растёт в карточку лида — её фон и есть следующая сцена. */}
        <Portal from={call} to={SCREEN} t={portal} color={LIGHT.teal} toColor={LIGHT.bg} radius={[14, 18]} />
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 214, x: call.x + call.width + 120, y: call.y + 130 },
          { at: 232, x: call.x + call.width * 0.55, y: call.y + call.height * 0.55 },
        ]}
        clicks={[CALL_CLICK]}
        hide={CALL_CLICK + 6}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 250, y: ay - 40, width: 600 }} tag={tag(9, lang)} title={caption(9, lang)} at={120} until={212} />
    </AbsoluteFill>
  )
}

/** Нажатие кнопки на обороте карты: карта чуть проседает. */
const pressOf = (frame: number) => Math.max(0, 1 - Math.abs(frame - CALL_CLICK) / 3)

function Face({ source, pressed = 0 }: { source: HTMLCanvasElement | null; pressed?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 22 * (FAN_CARD.width / 420), boxShadow: '0 22px 48px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)', background: '#ffffff', transform: `scale(${1 - 0.01 * pressed})` }}>
      <Painted source={source} style={{ inset: 0 }} />
    </div>
  )
}

/* ── 10 · «Jak poszła rozmowa?» ──────────────────────────────────────────
   0–10    карточка лида (портал со станции 09 раскрылся)
   10–36   диалог «Jak poszła rozmowa?» встаёт, камера — на него (50% кадра)
   36–126  читается; 100–122 курсор к «Dodzwoniłem się», 126 — клик
   132     диалог уходит, тост «Rozmowa zapisana» — камера на тост
   192–218 камера к «Historia kontaktu»; 212 — новая запись встаёт сверху
   222–290 выноска «Wynik rozmowy od razu zmienia scoring i priorytety.» */

const DIALOG: Rect = (() => {
  const scale = 1.35
  const width = CALL_DIALOG.width * scale
  const height = CALL_DIALOG.height * scale
  return { x: 960 - width / 2, y: 540 - height / 2, width, height }
})()
const OK_CLICK = 126
/** Длина сцены 10 (21 доля): с её конца карточка уходит в колоду. */
export const CALL_LENGTH = 21 * 15
const TOAST_SCALE = 1.4
const TOAST_RECT: Rect = { x: SCREEN.x + SCREEN.width - 28 - 320 * TOAST_SCALE, y: SCREEN.y + SCREEN.height - 28 - 82, width: 320 * TOAST_SCALE, height: 82 }
const TOAST_AT = 134
const TOAST_HOLD = TOAST_AT + 22 + readFrames('Rozmowa zapisana Marek Zieliński')
const ENTRY = (() => {
  const first = historyFirstEntry(true)
  const b = BLOCKS.history
  return { x: b.x + first.x * b.width, y: b.y + first.y * b.height, width: first.width * b.width }
})()

const CAMERA_10: CameraKey[] = [
  { at: 0, ...CARD_VIEW },
  { at: 12, dur: 24, ...focus(DIALOG, { fill: 0.5 }) },
  { at: TOAST_AT + 2, dur: 22, ...focus(TOAST_RECT, { fill: 0.45 }) },
  { at: TOAST_HOLD, dur: 26, ...fit(BLOCKS.history, { max: 1.45, shift: [190, 0] }) },
]

export function PriorityCall() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const card = useCrmTwins(() => ({
    base: canvasOf(crmLeadCardBase('W kontakcie')),
    scoring: canvasOf(crmScoringBlock(2, true)),
    contact: canvasOf(crmContactBlock()),
    sequence: canvasOf(crmSequenceBlock(2)),
    history: canvasOf(crmHistoryBlock(['call-missed', 'call-missed', 'note'], { banner: true })),
    historyGap: canvasOf(crmHistoryBlock(['call-missed', 'call-missed', 'note'], { banner: true, gap: 'call-ok' })),
    entry: canvasOf(crmHistoryEntry('call-ok')),
    dialog: canvasOf(crmCallDialog()),
  }))
  const camera = viewAt(CAMERA_10, frame)
  const entryAt = TOAST_HOLD + 20
  const entryIn = spring(frame, entryAt, SPRINGS.pop)
  const flash = Math.sin(Math.PI * Math.min(1, span(frame, entryAt + 6, 26)))
  const entryHeight = (ENTRY.width / (card.entry ? card.entry.width : 1)) * (card.entry ? card.entry.height : 0)
  const [ax, ay] = camera.project(ENTRY.x + ENTRY.width * 0.05, ENTRY.y + entryHeight * 0.42)
  const ok = { x: DIALOG.x + CALL_OK.x * DIALOG.width + 70, y: DIALOG.y + CALL_OK.y * DIALOG.height }
  /* Звук: новая запись встаёт в «Historia kontaktu». Диалог, клик и тост
     звучат сами. */
  useCueList([[entryAt, 'popIn', camera.project(ENTRY.x + ENTRY.width / 2, ENTRY.y + entryHeight / 2), 0.6]])

  /* Уход — в колоду (П8): карточка лида отступает, снизу въезжает канбан. */
  const leave = glide(span(frame, CALL_LENGTH - 6, 26))

  return (
    <AbsoluteFill>
      <Deck t={leave}>
      <Camera view={camera}>
        <Screen rect={SCREEN} source={card.base}>
          {(['scoring', 'contact', 'sequence', 'history'] as const).map((name) => {
            const rect = BLOCKS[name]
            const source = name === 'history' && frame >= entryAt - 2 ? card.historyGap : card[name]
            return <Painted key={name} source={source} style={{ left: rect.x - SCREEN.x, top: rect.y - SCREEN.y, width: rect.width, height: rect.height }} />
          })}
          {/* Подложка модалки, как в продукте (--overlay), только светлее: кадр остаётся светлым. */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.22)', opacity: easeOut(span(frame, 10, 12)) * (1 - easeIn(span(frame, OK_CLICK + 6, 10))) }} />
        </Screen>
        {frame >= entryAt - 2 && (
          <div
            style={{
              position: 'absolute',
              left: ENTRY.x,
              top: ENTRY.y,
              width: ENTRY.width,
              height: entryHeight,
              opacity: Math.min(1, entryIn * 1.5),
              transform: `translateX(${(1 - entryIn) * 60}px)`,
              borderRadius: 12,
              boxShadow: `0 0 0 ${2 * flash}px ${tint(LIGHT.green, 0.45 * flash)}, 0 ${10 * flash}px ${24 * flash}px rgba(15, 23, 42, ${0.1 * flash})`,
            }}
          >
            <Painted source={card.entry} style={{ inset: 0 }} />
          </div>
        )}
        <PopIn rect={DIALOG} background={LIGHT.card} at={10} until={OK_CLICK + 6} radius={14 * 1.35}>
          <Painted source={card.dialog} style={{ inset: 0 }} />
        </PopIn>
        <Toast x={TOAST_RECT.x} y={TOAST_RECT.y} at={TOAST_AT} until={TOAST_HOLD + 4} title={t('Rozmowa zapisana', 'Call saved')} description="Marek Zieliński" tone={LIGHT.green} scale={TOAST_SCALE} />
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 98, x: ok.x + 260, y: ok.y + 190 },
          { at: 122, x: ok.x, y: ok.y },
          { at: 144, x: ok.x + 40, y: ok.y + 160 },
        ]}
        clicks={[OK_CLICK]}
        hide={140}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax - 64 - 580, y: ay + 40, width: 580 }} tag={tag(10, lang)} title={caption(10, lang)} at={entryAt + 10} until={entryAt + 80} />
      </Deck>
    </AbsoluteFill>
  )
}
