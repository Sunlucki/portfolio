import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { AppWindow, CHROME } from '../kit/surfaces'
import { FONT, INK, SHADOW, type Rect } from '../kit/theme'
import { ROLL_TITLE, TIMES } from './Overtime'
import { centerOf, pagePt, pageRect, type PageSpot } from './parts'
import { CSV_CARD, CSV_COLUMNS, DESK, IA, PAYROLL, caption, drawCsvCard, drawPayroll, drawPayrollCard, sheet, tag, useLive, useSheets, type PayrollState } from './twins'

/* 16 · 05 Płace · Eksport listy płac (24 доли). Строка «Eksport listy płac»
   из прошлой сцены (П16) летит в заголовок экрана выгрузки администратора, а
   окно проступает вокруг неё. «Ten miesiąc» — даты 01.09–30.09.2026; три
   карточки итогов встают по очереди («Godziny nadliczbowe» — подчёркнута:
   это те самые ×1,5). «Eksport CSV» — из кнопки вылетает карточка файла
   payroll_20260901_20260930.csv с заголовками колонок настоящей выгрузки
   (routes/payroll.ts), строки заполняются. Окно складывается, как крышка
   ноутбука (П13), файл уходит вверх.

   0–30     заголовок летит на место, окно проступает
   70       «Ten miesiąc»; 76–92 подчёркивание дат
   84–110   карточки итогов; 112 — подчёркивание «Godziny nadliczbowe»
   180      «Eksport CSV»; 182–212 файл вылетает, камера к нему ×1,3
   214–258  строки заполняются; 232 — подчёркивание «Overtime»
   236–328  выноска «Miesiąc zamykasz jednym plikiem.»
   334–380  окно складывается (П13), файл уходит вверх — уже под входом телефона */

export const PAYROLL_BEATS = 24

const PAGE: PageSpot = { x: 240, y: 112, k: 1 }
const W = (r: Rect) => pageRect(PAGE, r)
const MONTH = W(PAYROLL.thisMonth)
const CSV_BUTTON = W(PAYROLL.csv)
const CARDS = PAYROLL.cards.map(W)
const CSV_SCALE = 1.5
const CSV: Rect = { x: 960 - (CSV_CARD.width * CSV_SCALE) / 2, y: 560 - (CSV_CARD.height * CSV_SCALE) / 2, width: CSV_CARD.width * CSV_SCALE, height: CSV_CARD.height * CSV_SCALE }
const onCsv = (x: number, y: number): [number, number] => [CSV.x + x * CSV_SCALE, CSV.y + y * CSV_SCALE]

const E = { title: 0, month: 70, cards: 84, csv: 180, fly: 182, rows: 214, fold: 334 }

const VIEW = fit(W({ x: 256, y: 64, width: 1184, height: 300 }), { max: 1.45 })
const CAMERA: CameraKey[] = [
  { at: 0, ...VIEW },
  { at: 150, dur: 24, ...fit(W({ x: 660, y: 64, width: 780, height: 300 }), { max: 1.6 }) },
  { at: E.fly + 4, dur: 26, ...focus(CSV, { fill: 0.56, shift: [-260, 0] }) },
  { at: E.fold - 6, dur: 30, ...HOME },
]

const CURSOR = [
  { at: 40, x: MONTH.x + 260, y: MONTH.y + 200 },
  { at: E.month - 4, x: MONTH.x + MONTH.width * 0.5, y: MONTH.y + MONTH.height * 0.6 },
  { at: 100, x: MONTH.x + 90, y: MONTH.y + 170 },
  { at: 152, x: CSV_BUTTON.x - 60, y: CSV_BUTTON.y + 150 },
  { at: E.csv - 4, x: CSV_BUTTON.x + CSV_BUTTON.width * 0.55, y: CSV_BUTTON.y + CSV_BUTTON.height * 0.6 },
  { at: 206, x: CSV_BUTTON.x + 140, y: CSV_BUTTON.y + 230 },
]
const CLICKS = [E.month, E.csv]

function payrollState(frame: number): PayrollState {
  return {
    range: frame >= E.month + 2,
    cards: false,
    pressed: frame >= E.month - 1 && frame < E.month + 4 ? 'month' : frame >= E.csv - 1 && frame < E.csv + 4 ? 'csv' : 'none',
    title: frame >= 30,
  }
}

export function Payroll() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const rollText = t(ROLL_TITLE.text, ROLL_TITLE.en)
  const twins = useSheets(() => ({ cards: [0, 1, 2].map((i) => sheet(368, 74, 3, (c) => drawPayrollCard(c, i))) }))
  const stateNow = payrollState(frame)
  const page = useLive(DESK.width, DESK.height, 2, (c) => drawPayroll(c, stateNow), JSON.stringify(stateNow))
  const filled = Math.max(0, Math.min(11, Math.floor((frame - E.rows) / 4) + 1))
  const csv = useLive(CSV_CARD.width, CSV_CARD.height, 3, (c) => drawCsvCard(c, filled), filled)

  const camera = viewAt(CAMERA, frame)
  const appear = easeOut(span(frame, 0, 24))
  const fly = easeInOut(span(frame, E.title, 30))
  const titleLanded = easeOut(span(frame, 30, 6))
  const fold = easeIn(span(frame, E.fold, 36))
  const csvOut = easeIn(span(frame, E.fold + 4, 26))
  const csvIn = spring(frame, E.fly, SPRINGS.heavy)
  const veil = easeOut(span(frame, E.fly, 16)) * (1 - easeIn(span(frame, E.fold, 10)))

  /* Заголовок: из места «×1,5» прошлой сцены (px кадра, 64 px) в заголовок
     страницы (24 px в мире — через камеру). Базовая линия Inter при
     line-height 1 — на 0,864 кегля от верха строки. */
  const startWidth = textWidth(rollText, ROLL_TITLE.size, 800, -0.035)
  const from = { x: TIMES.x - startWidth / 2, top: TIMES.y - ROLL_TITLE.size * 0.5 - 2, size: ROLL_TITLE.size }
  const [tx, ty] = camera.project(...pagePt(PAGE, 280, 110))
  const toSize = 24 * camera.zoom
  const to = { x: tx, top: ty - 0.864 * toSize, size: toSize }
  const title = { x: mix(from.x, to.x, fly), top: mix(from.top, to.top, fly), size: mix(from.size, to.size, fly), weight: Math.round(mix(800, 700, fly)) }

  /* Файл вылетает из кнопки «Eksport CSV» вперёд (П4). */
  const [bx, by] = [CSV_BUTTON.x + CSV_BUTTON.width / 2, CSV_BUTTON.y + CSV_BUTTON.height / 2]
  const csvScale = mix(CSV_BUTTON.width / CSV.width, 1, clamp01(csvIn))
  const csvX = mix(bx, CSV.x + CSV.width / 2, clamp01(csvIn))
  const csvY = mix(by, CSV.y + CSV.height / 2, clamp01(csvIn)) - csvOut * 900

  const cursor = cursorAt(CURSOR, frame, CLICKS, 200)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const ripples = CLICKS.map((at) => {
    const point = cursorAt(CURSOR, at)
    return { at, xy: camera.project(point.x, point.y) }
  })

  const columnWidth = (CSV_CARD.width - 40) / CSV_COLUMNS.length
  const overtimeHeader: Rect = { x: onCsv(20 + 5 * columnWidth + 4, 0)[0], y: onCsv(0, 101)[1], width: textWidth('Overtime', 10.5, 700) * CSV_SCALE, height: 13 * CSV_SCALE }
  const fileAnchor = camera.project(...onCsv(330, 36))
  const csvRight = camera.project(CSV.x + CSV.width, 0)[0]

  /* Звук: «Eksport listy płac» летит в заголовок и садится; три карточки
     итогов встают слева направо; файл .csv вылетает из кнопки, строки
     заполняются лесенкой — выгрузка готова; окно складывается, файл уходит
     вверх. Клики — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const csvAt = at(csvX, csvY)
  useSoundTrack('hr2d-title-fly', 'whoosh', frame <= 30, { x: title.x + (startWidth * title.size) / from.size / 2, y: title.top + title.size / 2 }, { gain: 0.5 })
  useSoundCue('thump', 30, { x: to.x + (startWidth * to.size) / from.size / 2, y: to.top + to.size / 2 }, { gain: 0.4 })
  useSoundCue('popIn', E.cards, at(...centerOf(CARDS[0]!)), { gain: 0.45 })
  useSoundCue('popIn', E.cards + 6, at(...centerOf(CARDS[1]!)), { gain: 0.45 })
  useSoundCue('popIn', E.cards + 12, at(...centerOf(CARDS[2]!)), { gain: 0.45 })
  useSoundTrack('hr2d-csv-out', 'whoosh', frame >= E.fly && frame <= E.fly + 24, csvAt, { gain: 0.6 })
  useSoundCue('layers', E.rows, csvAt, { gain: 0.45, seconds: 1.2 })
  useSoundCue('success', E.rows + 42, csvAt, { gain: 0.7 })
  useSoundTrack('hr2d-csv-up', 'whoosh', frame >= E.fold + 4 && frame <= E.fold + 30, csvAt, { gain: 0.45 })
  useSoundCue('thump', E.fold + 34, at(PAGE.x + DESK.width / 2, PAGE.y + DESK.height), { gain: 0.5 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <div style={{ position: 'absolute', left: PAGE.x, top: PAGE.y - CHROME, width: DESK.width, height: DESK.height + CHROME, transformOrigin: '50% 100%', transform: `perspective(2600px) rotateX(${fold * 86}deg) scale(${mix(0.965, 1, appear)})`, opacity: appear * (1 - easeIn(span(frame, E.fold + 24, 10))) }}>
          <AppWindow url="iapply.com.pl/admin/payroll" width={DESK.width} height={DESK.height} style={{ left: 0, top: 0 }}>
            <Painted source={page} style={{ inset: 0 }} />
            {CARDS.map((card, i) => {
              const start = E.cards + i * 6
              const pop = spring(frame, start, SPRINGS.pop)
              if (frame < start) return null
              return (
                <div key={i} style={{ position: 'absolute', left: card.x - PAGE.x, top: card.y - PAGE.y, width: card.width, height: card.height, borderRadius: 12, opacity: clamp01(pop * 1.6), transform: `translateY(${(1 - clamp01(pop)) * -36}px) scale(${mix(0.92, 1, clamp01(pop))})` }}>
                  <Painted source={twins.cards[i] ?? null} style={{ inset: 0 }} />
                </div>
              )
            })}
            <div style={{ position: 'absolute', inset: 0, background: '#f7f8fa', opacity: 0.72 * veil }} />
          </AppWindow>
        </div>
        <Scribble rect={W({ x: 612, y: 196, width: 612, height: 38 })} kind="underline" p={easeOut(span(frame, 78, 14)) * (1 - easeIn(span(frame, 146, 8)))} width={2.6} />
        <Scribble rect={W({ x: 280 + 384 + 68, y: 306, width: textWidth(t('Godziny nadliczbowe', 'Overtime Hours'), 12, 400), height: 14 })} kind="underline" p={easeOut(span(frame, 114, 14)) * (1 - easeIn(span(frame, 170, 8)))} width={2.2} color={IA.orange500} />
        {frame >= E.fly - 1 && (
          <div
            style={{
              position: 'absolute',
              left: csvX - CSV.width / 2,
              top: csvY - CSV.height / 2,
              width: CSV.width,
              height: CSV.height,
              borderRadius: 18 * CSV_SCALE,
              boxShadow: SHADOW.lifted,
              transform: `scale(${csvScale * mix(1, 0.6, csvOut)}) rotate(${(1 - clamp01(csvIn)) * -8}deg)`,
              opacity: clamp01(csvIn * 3) * (1 - csvOut),
            }}
          >
            <Painted source={csv} style={{ inset: 0 }} />
          </div>
        )}
        <Scribble rect={overtimeHeader} kind="underline" p={easeOut(span(frame, 232, 14)) * (1 - easeIn(span(frame, E.fold - 8, 8)))} width={2.4} color={IA.orange500} />
      </Camera>
      {frame < 40 && (
        <div style={{ position: 'absolute', left: title.x, top: title.top, fontFamily: FONT, fontSize: title.size, lineHeight: 1, fontWeight: title.weight, letterSpacing: `${mix(-0.035, 0, fly)}em`, color: INK, whiteSpace: 'nowrap', opacity: 1 - titleLanded }}>{rollText}</div>
      )}
      <Callout anchor={fileAnchor} box={{ x: csvRight + 60, y: fileAnchor[1] - 40, width: 470 }} tag={tag(16, lang)} title={caption(16, lang)} at={236} until={328} />
      {ripples.map(({ at, xy }) => (
        <Ripple key={at} x={xy[0]} y={xy[1]} at={at} />
      ))}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

