import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Bar } from '../kit/chart'
import { Connector, Scribble } from '../kit/draw'
import { useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, canvasOf, textWidth } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { FONT, INK, PAPER, grow, lerpRect, tint, useAccent, type Rect } from '../kit/theme'
import { Layer, LayerStack, Lift } from '../kit/transitions'
import { SCREEN, Screen, centerOf, leadsGeometry, place, useCueList } from './common'
import {
  ATTENTION_CARD,
  HERO,
  HISTORY_BANNER,
  HISTORY_BEST_SLOT,
  LEAD_CARD,
  LIGHT,
  SCORE_TRACK,
  caption,
  crmAttentionCard,
  crmContactBlock,
  crmHistoryBlock,
  crmLeadCardBase,
  crmLeadRow,
  crmLeadsList,
  crmScoringBlock,
  crmSequenceBlock,
  historyFirstEntry,
  leadCardLayout,
  tag,
  useCrmTwins,
} from './twins'

/* 07–08 · 02 Leady · Карточка лида. Строка Marek Zieliński, только что
   вставшая в «Leady», открывается в карточку лида; блок «Scoring» выходит
   вперёд, и видно, из чего складывается оценка. Затем карточка расслаивается
   на блоки (С) — всё о клиенте, — а в «Historia kontaktu» — лучшее время для
   звонка. Карточка сжимается в плитку приоритета — первую карту станции 09. */

const L = leadCardLayout()
const LEAD = { base: place({ x: 0, y: 0, width: LEAD_CARD.width, height: LEAD_CARD.height }, LEAD_CARD.width) }
const BLOCKS = {
  scoring: place(L.scoring, LEAD_CARD.width),
  contact: place(L.contact, LEAD_CARD.width),
  sequence: place(L.sequence, LEAD_CARD.width),
  history: place(L.history, LEAD_CARD.width),
}
const LEADS_AT = leadsGeometry(SCREEN)

/** Холсты карточки лида: подложка и четыре блока. */
function useLeadCard(stage: string, day: number, history: Parameters<typeof crmHistoryBlock>[0], banner: boolean) {
  return useCrmTwins(() => ({
    base: canvasOf(crmLeadCardBase(stage)),
    scoring: canvasOf(crmScoringBlock(2, false)),
    scoringFull: canvasOf(crmScoringBlock(2, true)),
    contact: canvasOf(crmContactBlock()),
    sequence: canvasOf(crmSequenceBlock(day)),
    history: canvasOf(crmHistoryBlock(history, { banner })),
  }))
}

/* ── 07 · «Leady» → карточка лида → «Scoring» ─────────────────────────────
   0–36    список, курсор к строке Marek Zieliński (подсветка), 36 — клик
   38–64   строка раскрывается в карточку лида (П3), камера — на карточку
   76–100  блок «Scoring» выходит вперёд (м-отрыв), карточка за ним гаснет
   96–112  полоса оценки растёт (м-график), 104 — обводка «84 na 100»
   112–150 пять слов, из чего складывается оценка, линии текут в блок
   122–200 выноска «Scoring 0–100 liczy się sam.»
   200–226 блок возвращается, камера — на карточку целиком */

const CLICK_ROW = 36
const OPEN = 38
const LIFT_AT = 76
const BACK_AT = 200

/** Поднятый блок «Scoring»: в 1,6 раза крупнее, левее центра. */
const SCORE_LIFTED: Rect = (() => {
  const b = BLOCKS.scoring
  const width = b.width * 1.6
  const height = b.height * 1.6
  return { x: 760 - width / 2, y: 508 - height / 2, width, height }
})()

const WORDS = ['źródło', 'budżet', 'termin', 'decydent', 'aktywność']
/** Те же пять слов по-английски (i18n: Source, Budget, Timeline, Decision maker). */
const WORDS_EN = ['source', 'budget', 'timeline', 'decision maker', 'activity']

const CAMERA_07: CameraKey[] = [
  { at: 0, ...LEADS_AT.top },
  { at: OPEN + 2, dur: 26, ...fit(LEAD.base, { max: 1.1, margin: 70 }) },
  { at: LIFT_AT, dur: 26, ...focus(SCORE_LIFTED, { fill: 0.48, shift: [-330, 0] }) },
  { at: BACK_AT, dur: 26, ...fit(LEAD.base, { max: 1.1, margin: 70 }) },
]

export function LeadScoring() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const list = useCrmTwins(() => ({ canvas: canvasOf(crmLeadsList()), row: canvasOf(crmLeadRow()) }))
  const card = useLeadCard('Nowy', 0, ['note'], false)
  const camera = viewAt(CAMERA_07, frame)

  /* П3: карточка открывается из прямоугольника строки — маска от строки ко
     всей карточке. */
  const open = glide(span(frame, OPEN, 24))
  const slot = LEADS_AT.slot
  const inset = {
    top: (slot.y - SCREEN.y) * (1 - open),
    right: (SCREEN.x + SCREEN.width - slot.x - slot.width) * (1 - open),
    bottom: (SCREEN.y + SCREEN.height - slot.y - slot.height) * (1 - open),
    left: (slot.x - SCREEN.x) * (1 - open),
  }
  const hover = easeOut(span(frame, 24, 8)) * (1 - span(frame, OPEN + 6, 6))

  const lift = spring(frame, LIFT_AT, SPRINGS.heavy) * (1 - glide(span(frame, BACK_AT, 24)))
  const veil = clamp01(lift) * 0.6

  /* Поднятый блок в кадре: слова и линии — в координатах кадра, справа от него. */
  const block = lerpRect(BLOCKS.scoring, SCORE_LIFTED, lift)
  const [bx, by] = camera.project(block.x, block.y)
  const [bx2, by2] = camera.project(block.x + block.width, block.y + block.height)
  const words = (lang === 'en' ? WORDS_EN : WORDS).map((word, i) => {
    const start = 112 + i * 7
    const shown = easeOut(span(frame, start, 12)) * (1 - easeIn(span(frame, BACK_AT - 8 + i, 10)))
    const y = mix(by, by2, 0.08 + i * 0.21)
    const float = Math.sin((frame + i * 17) * 0.06) * 3
    return { word, start, shown, x: bx2 + 190, y: y + float, target: [bx2 + 4, mix(by, by2, 0.3 + i * 0.1)] as [number, number] }
  })
  const anchor: [number, number] = [mix(bx, bx2, 0.86), mix(by, by2, 0.3)]

  /* Звук: строка раскрывается в карточку лида (П3). Клик, отрыв «Scoring»,
     полоса, обводка и линии слов звучат сами. */
  useCueList([[OPEN, 'popIn', centerOf(slot, camera.project), 0.65]])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Screen rect={SCREEN} source={list.canvas}>
          <Painted source={list.row} style={{ left: slot.x - SCREEN.x, top: slot.y - SCREEN.y, width: slot.width, height: slot.height }} />
          <div style={{ position: 'absolute', left: slot.x - SCREEN.x, top: slot.y - SCREEN.y, width: slot.width, height: slot.height, borderRadius: 10, background: tint(accent, 0.08), boxShadow: `inset 0 0 0 1.5px ${tint(accent, 0.45)}`, opacity: hover }} />
        </Screen>
        {frame >= OPEN && (
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${inset.top + SCREEN.y}px ${1920 - SCREEN.x - SCREEN.width + inset.right}px ${1080 - SCREEN.y - SCREEN.height + inset.bottom}px ${inset.left + SCREEN.x}px round 12px)` }}>
            <LeadCardScreen card={card} opacity={easeOut(span(frame, OPEN, 10))} hideScoring={lift > 0.001} scored={frame >= BACK_AT} />
          </div>
        )}
        <div style={{ position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height, borderRadius: 18, background: PAPER, opacity: veil }} />
        {lift > 0.001 && (
          <Lift from={BLOCKS.scoring} to={SCORE_LIFTED} t={lift} radius={16}>
            <Painted source={card.scoring} style={{ inset: 0 }} />
            <Bar rect={{ x: SCORE_TRACK.x * block.width, y: (SCORE_TRACK.y - 0.0227) * block.height, width: SCORE_TRACK.width * block.width, height: 0.0455 * block.height }} value={HERO.score / 100} at={96} color={LIGHT.coral} />
            {/* Обводка «84 na 100»; английское «out of 100» длиннее — рамка шире. */}
            <Scribble rect={{ x: 0.035 * block.width, y: 0.38 * block.height, width: (lang === 'en' ? 0.36 : 0.3) * block.width, height: 0.24 * block.height }} p={easeOut(span(frame, 104, 16)) * (1 - easeIn(span(frame, BACK_AT - 10, 8)))} color={LIGHT.coral} pad={[10, 6]} seed={2} width={3} />
          </Lift>
        )}
      </Camera>
      {words.map(({ word, start, shown, x, y, target }) => (
        <div key={word}>
          <Connector from={[x - 16, y]} to={target} p={easeInOut(span(frame, start + 2, 14)) * (1 - easeIn(span(frame, BACK_AT - 10, 8)))} frame={frame} flowing={shown} period={40} bend={0.55} />
          <div style={{ position: 'absolute', left: x, top: y - 24, fontFamily: FONT, fontSize: 38, fontWeight: 650, letterSpacing: '-0.02em', color: INK, opacity: shown, transform: `translateY(${(1 - shown) * 16}px)` }}>{word}</div>
        </div>
      ))}
      <CursorPath
        view={camera}
        keys={[
          { at: 8, x: slot.x + slot.width * 0.7, y: slot.y + 170 },
          { at: 30, x: slot.x + slot.width * 0.16, y: slot.y + slot.height * 0.55 },
          { at: 48, x: slot.x + slot.width * 0.2, y: slot.y + slot.height * 2.2 },
        ]}
        clicks={[CLICK_ROW]}
        hide={44}
      />
      <Callout anchor={anchor} box={{ x: anchor[0] + 230, y: 130, width: lang === 'en' ? 650 : 560 }} tag={tag(7, lang)} title={caption(7, lang)} at={122} until={BACK_AT - 4} />
    </AbsoluteFill>
  )
}

/** Карточка лида на экране: подложка и четыре блока на своих местах.
    scored — полоса оценки уже заполнена. */
function LeadCardScreen({ card, opacity = 1, hideScoring = false, scored = true }: { card: ReturnType<typeof useLeadCard>; opacity?: number; hideScoring?: boolean; scored?: boolean }) {
  return (
    <Screen rect={SCREEN} source={card.base} style={{ opacity }}>
      {(['scoring', 'contact', 'sequence', 'history'] as const).map((name) => {
        const rect = BLOCKS[name]
        if (name === 'scoring' && hideScoring) return null
        const source = name === 'scoring' ? (scored ? card.scoringFull : card.scoring) : card[name]
        return <Painted key={name} source={source} style={{ left: rect.x - SCREEN.x, top: rect.y - SCREEN.y, width: rect.width, height: rect.height }} />
      })}
    </Screen>
  )
}

/* ── 08 · Карточка лида расслаивается: всё о клиенте ─────────────────────
   0–34    окно уходит в изометрию, блоки поднимаются слоями (С); за это время
           в карточке проходит несколько дней: «W kontakcie», история звонков
   34–78   слои висят: «Scoring», «Kontakt», «Sekwencja», «Historia kontaktu»
   78–108  слои опускаются, карточка лицом
   110–138 наезд на плашку «Dobry moment na telefon» (62% ширины кадра)
   118–134 подчёркивание «Wt, 10:00»; 124–204 — выноска
   208–240 карточка сжимается в плитку приоритета (первая карта станции 09) */

const DEPTH = { scoring: 60, contact: 110, sequence: 160, history: 90 }
/** Плашка «Dobry moment na telefon» в блоке «Historia kontaktu»: над первой
    записью, две строки (HISTORY_BANNER художника, логические px блока). */
const HISTORY_UNITS = { width: L.history.width / L.k, height: L.history.height / L.k }
const BANNER: Rect = (() => {
  const first = historyFirstEntry(true)
  const b = BLOCKS.history
  return { x: b.x + first.x * b.width, y: b.y + (HISTORY_BANNER.y / HISTORY_UNITS.height) * b.height, width: first.width * b.width, height: (HISTORY_BANNER.height / HISTORY_UNITS.height) * b.height }
})()

/** Где в плашке «Wt, 10:00» — для подчёркивания, в px блока истории. */
function bannerTime(rect: Rect, lang: Lang): Rect {
  /* Блок рисуется в единицах ×2 (k = 2): плашка с отступом 16k, текст — с
     HISTORY_BANNER.text·k, первая строка — на базовой линии line1·k, кегль 12k. */
  const unit = rect.width / (HISTORY_UNITS.width * 2)
  const slot = HISTORY_BEST_SLOT[lang]
  const before = textWidth(slot.before, 24, 500)
  const time = textWidth(slot.time, 24, 700)
  const x = (16 * 2 + HISTORY_BANNER.text * 2 + before) * unit
  const y = ((HISTORY_BANNER.y + HISTORY_BANNER.line1) * 2 - 30) * unit
  return { x, y, width: time * unit, height: 30 * unit }
}
/** Первая карта веера станции 09 — сюда сжимается карточка. */
export const FAN_CARD = { width: 360, height: 360 * (ATTENTION_CARD.height / ATTENTION_CARD.width) }
export const FAN: { rect: Rect; rotate: number }[] = [0, 1, 2, 3].map((i) => {
  const gap = 36
  const total = FAN_CARD.width * 4 + gap * 3
  const x = (1920 - total) / 2 + i * (FAN_CARD.width + gap)
  const lift = i === 0 || i === 3 ? 22 : 0
  return { rect: { x, y: 540 - FAN_CARD.height / 2 + lift, width: FAN_CARD.width, height: FAN_CARD.height }, rotate: [-5, -1.7, 1.7, 5][i]! }
})

/** Наезд на плашку: в кадре — её начало до «64%.» крупно, край блока — за
    кадром; «Na podstawie 212 połączeń zespołu.» — второй строкой, в кадре. */
const BANNER_READ: Rect = { ...BANNER, width: BANNER.width * 0.74 }

const CAMERA_08: CameraKey[] = [
  { at: 0, ...fit(LEAD.base, { max: 1.1, margin: 70 }) },
  { at: 4, dur: 30, x: 960, y: 590, zoom: 1.12 },
  { at: 80, dur: 28, ...fit(LEAD.base, { max: 1.1, margin: 70 }) },
  { at: 110, dur: 28, ...focus(BANNER_READ, { fill: 0.72, shift: [0, 210] }) },
  { at: 206, dur: 26, ...HOME },
]

export function LeadLayers() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const before = useLeadCard('Nowy', 0, ['note'], false)
  const after = useLeadCard('W kontakcie', 2, ['call-missed', 'call-missed', 'note'], true)
  const tile = useCrmTwins(() => canvasOf(crmAttentionCard(0, 'front')))
  const camera = viewAt(CAMERA_08, frame)
  const tilt = glide(span(frame, 0, 30)) - glide(span(frame, 78, 30))
  const days = easeInOut(span(frame, 16, 10))
  const card = days < 0.5 ? before : after
  const shrink = glide(span(frame, 208, 30))
  const tileIn = easeInOut(span(frame, 214, 16))
  const target = FAN[0]!.rect
  const box = lerpRect(LEAD.base, grow(target, 1), shrink)
  /* Плитка приоритета — со своими пропорциями, по центру сжимающейся карточки. */
  const tileWidth = Math.min(box.width, box.height * (FAN_CARD.width / FAN_CARD.height))
  const tileBox: Rect = { x: box.x + (box.width - tileWidth) / 2, y: box.y + (box.height - tileWidth * (FAN_CARD.height / FAN_CARD.width)) / 2, width: tileWidth, height: tileWidth * (FAN_CARD.height / FAN_CARD.width) }
  const [ax, ay] = camera.project(BANNER.x + BANNER.width * 0.03, BANNER.y + BANNER.height / 2)

  /* Звук: в карточке проходят дни («W kontakcie», звонки в истории) — щелчок
     статуса; карточка сжимается в плитку приоритета и встаёт. Слои —
     у LayerStack. */
  useCueList([
    [21, 'tick', centerOf(LEAD.base, camera.project), 0.45],
    [208, 'whoosh', centerOf(box, camera.project), 0.4, 0.9],
    [236, 'thump', centerOf(target, camera.project), 0.45],
  ])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {shrink < 1 && (
          <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.width, height: box.height, opacity: 1 - tileIn }}>
            <LayerStack t={tilt} rotateX={38} rotateZ={-18} scale={0.9} style={{ left: 0, top: 0, width: box.width, height: box.height }}>
              <div style={{ position: 'absolute', inset: 0, transform: `scale(${box.width / LEAD.base.width})`, transformOrigin: '0 0', transformStyle: tilt > 0.0005 ? 'preserve-3d' : undefined }}>
                <Layer depth={0} style={{ left: 0, top: 0, width: LEAD.base.width, height: LEAD.base.height, borderRadius: 18, overflow: 'hidden', background: LIGHT.bg, boxShadow: '0 44px 96px rgba(15, 23, 42, 0.13)' }}>
                  <Painted source={card.base} style={{ inset: 0 }} />
                </Layer>
                {(['scoring', 'contact', 'sequence', 'history'] as const).map((name, i) => {
                  const rect = BLOCKS[name]
                  const rise = spring(frame, 4 + i * 4, SPRINGS.heavy) * (1 - glide(span(frame, 78 + i * 2, 26)))
                  return (
                    <Layer key={name} depth={tilt > 0.0005 ? DEPTH[name] * rise + 1 : 0} style={{ left: rect.x - SCREEN.x, top: rect.y - SCREEN.y, width: rect.width, height: rect.height, borderRadius: 14, boxShadow: `0 ${6 + 30 * rise}px ${16 + 50 * rise}px rgba(15, 23, 42, ${0.08 + 0.1 * rise})` }}>
                      <Painted source={name === 'scoring' ? card.scoringFull : card[name]} style={{ inset: 0 }} />
                      {name === 'history' && card === after && <Scribble rect={bannerTime(rect, lang)} kind="underline" p={easeOut(span(frame, 118, 14)) * (1 - easeIn(span(frame, 200, 8)))} width={2.4} />}
                    </Layer>
                  )
                })}
              </div>
            </LayerStack>
          </div>
        )}
        {frame >= 214 && (
          <div style={{ position: 'absolute', left: tileBox.x, top: tileBox.y, width: tileBox.width, height: tileBox.height, opacity: tileIn, transform: `rotate(${FAN[0]!.rotate * shrink}deg)`, borderRadius: 22 * (tileBox.width / FAN_CARD.width), boxShadow: '0 26px 52px rgba(15, 23, 42, 0.12)' }}>
            <Painted source={tile} style={{ inset: 0 }} />
          </div>
        )}
      </Camera>
      <Callout anchor={[ax, ay]} box={{ x: ax + 90, y: 96, width: 640 }} tag={tag(8, lang)} title={caption(8, lang)} at={124} until={204} />
    </AbsoluteFill>
  )
}

export { LeadCardScreen, useLeadCard }
