import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Bar } from '../kit/chart'
import { DrawPath, Scribble, bezierPath, bezierPoint, type Bezier } from '../kit/draw'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { AppWindow, CHROME } from '../kit/surfaces'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Layer, LayerStack } from '../kit/transitions'
import { Handset, HotToast, Pulse, SCREEN, centerOf, pagePt, pageRect, phonePt, phoneRect, type PageSpot, type PhoneSpot } from './parts'
import { ATTENDANCE, ATTENDANCE_BAR, IA, IOS, LIVE_ROWS, PANEL, TARGET_BLOCK, WIDE, caption, drawCoordDashboard, drawCoordPhone, drawSchedule, sheet, tag, useLive, useSheets, type ScheduleDrop } from './twins'

/* 12–13 · 04 Grafik (47 долей). График администратора въезжает снизу
   прокруткой насквозь (П14). Обводка у красного «Niewystarczająco»: на смену
   не хватает людей. Наезд на «Pula zasobów» и понедельник: курсор берёт
   Jana и тащит на блок 07:00–15:00 (2/3) — блок раскрывает «Upuść pracownika
   tutaj», камера — вплотную. Отпускание: 3/3, граница зеленеет, «Niewystarczająco»
   3 → 2, тост «Jan Kowalski → 07:00 28.09» крупно.

   Затем график расслаивается (П9): окно уходит в изометрию, слои графика
   поднимаются и улетают, на их место падают слои пульта координатора,
   окно встаёт лицом. «Przegląd dnia»: полоса присутствия растёт (м-прогресс).
   Перед окном встаёт телефон координатора: «Obecność na żywo» — у каждого
   свой секундомер. От строки Jana рисуется линия вправо (П11) — в карточку
   задания следующей сцены.

   0–20     въезд снизу с размытием; 20–46 к шапке, 36–54 обводка «Niewystarczająco»
   64–90    наезд ×2,2 на пул и понедельник; 102 — захват; 102–148 перенос
   140      блок раскрывается; 144–168 вплотную ×4,6; 168–204 — читается
   204      отпускание: 3/3; 212–240 обводка «3/3»
   240–266  отъезд; 246 — «Niewystarczająco» 2; 250 — тост; 270–372 выноска
   384–478  расслоение и сборка пульта (П9)
   478–512  полоса присутствия; 486–520 — «Przegląd dnia» крупно
   512–540  телефон координатора встаёт; 536–560 — к «Obecność na żywo»
   560–650  секундомеры идут; 574–660 выноска
   660–705  линия от строки Jana уходит вправо (П11) */

export const SCHEDULE_BEATS = 47

const PAGE: PageSpot = { x: 240, y: 100, k: 1 }
const PAGE_H = WIDE.height
const K = 1440 / PANEL.width
const DASH: PageSpot = { x: PAGE.x, y: PAGE.y, k: K }
const PHONE: PhoneSpot = { x: 1330, y: 118, scale: 1 }

/** Строка Jana в «Pula zasobów» (как её рисует художник: y 242, 264 × 46). */
const POOL_JAN: Rect = { x: 292, y: 242, width: 264, height: 46 }
const BLOCK: Rect = { x: TARGET_BLOCK.x, y: TARGET_BLOCK.y, width: TARGET_BLOCK.width, height: 104 }
const CHIP: Rect = { x: 1238, y: 112, width: 154, height: 28 }
const RATIO: Rect = { x: BLOCK.x + BLOCK.width - 26, y: BLOCK.y + 7, width: 22, height: 12 }
const REGION = { x: 280, y: 150, width: 470, height: 330 }
/** Шапка страницы под тостом: камера подъезжает к тосту ×3,8 — холсту нужна плотность. */
const TOP_REGION = { x: 430, y: 0, width: 580, height: 250 }

const E = {
  enter: 0,
  grab: 102,
  drag: 148,
  hover: 140,
  drop: 204,
  toast: 250,
  layers: 384,
  bar: 478,
  phone: 512,
  line: 660,
}

const W = (r: Rect) => pageRect(PAGE, r)
/** Курсор взял строку Jana у верхнего края, над аватаром: призрак висит справа
    снизу от курсора (смещение GRAB), как картинка перетаскивания в Chrome —
    полупрозрачный и чуть наклонён вниз, чтобы не закрывать подсказку блока. */
const GRAB = { x: 34, y: 2 }
const GRAB_FROM = pagePt(PAGE, POOL_JAN.x + GRAB.x, POOL_JAN.y + GRAB.y)
/** Отпускание — у нижнего края раскрытого блока: подсказка над призраком видна. */
const DROP_AT = pagePt(PAGE, BLOCK.x + BLOCK.width / 2 - 14, BLOCK.y + 101)

/** Где курсор с призраком строки Jana (px мира) в кадре frame. */
function ghostAt(frame: number): { x: number; y: number; lift: number } {
  const t = easeInOut(span(frame, E.grab + 4, E.drag - E.grab - 4))
  const lift = spring(frame, E.grab, SPRINGS.snap) * (1 - easeIn(span(frame, E.drop, 8)))
  const [fx, fy] = GRAB_FROM
  const [tx, ty] = DROP_AT
  const x = mix(fx, tx, t) + Math.sin(Math.PI * t) * 10
  const y = mix(fy, ty, t) - Math.sin(Math.PI * t) * 60
  return { x, y, lift }
}

const TOAST_W = 250
const TOAST: Rect = { x: pagePt(PAGE, 720, 0)[0] - TOAST_W / 2, y: pagePt(PAGE, 0, 16)[1], width: TOAST_W, height: 50 }
const DAY_CARD = pageRect(DASH, { x: 276, y: 136, width: 728, height: 122 })
const LIVE_CARD = phoneRect(PHONE, { x: 16, y: 160, width: 361, height: 42 + ATTENDANCE.length * LIVE_ROWS.row + 8 })
const JAN_ROW = phoneRect(PHONE, { x: 32, y: LIVE_ROWS.y - 4, width: 329, height: 40 })

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 20, dur: 26, ...fit(W({ x: 592, y: 96, width: 800, height: 150 }), { max: 1.8 }) },
  { at: 64, dur: 26, ...fit(W({ x: 284, y: 160, width: 440, height: 290 }), { max: 2.2 }) },
  { at: E.hover + 4, dur: 24, ...focus(W({ x: BLOCK.x - 8, y: BLOCK.y - 8, width: 216, height: 164 }), { fill: 0.5 }) },
  { at: 240, dur: 26, ...fit(W({ x: 592, y: 0, width: 800, height: 380 }), { max: 1.6 }) },
  { at: E.toast, dur: 20, ...focus(TOAST, { fill: 0.5, shift: [-300, 0] }) },
  { at: E.layers - 6, dur: 30, ...HOME },
  { at: E.bar - 8, dur: 26, ...focus(DAY_CARD, { fill: 0.64 }) },
  { at: E.phone + 22, dur: 26, ...focus(LIVE_CARD, { fill: 0.5, shift: [-230, 0] }) },
  { at: E.line + 8, dur: 18, follow: follow((f) => bezierPoint(LINE, lineProgress(f)), { zoom: 1.5, lag: 8 }) },
]

const CURSOR = [
  { at: 82, x: GRAB_FROM[0] + 240, y: GRAB_FROM[1] + 190 },
  { at: 98, x: GRAB_FROM[0], y: GRAB_FROM[1] },
  { at: E.grab + 4, x: GRAB_FROM[0], y: GRAB_FROM[1] },
  { at: E.drag, x: DROP_AT[0], y: DROP_AT[1] },
  { at: E.drop, x: DROP_AT[0], y: DROP_AT[1] },
  { at: 236, x: DROP_AT[0] + 120, y: DROP_AT[1] + 160 },
]

/* П11: линия от секундомера Jana уходит вправо, камера — за её концом; в
   следующей сцене линия входит слева и обводит карточку задания. */
const LINE_FROM = phonePt(PHONE, 377, LIVE_ROWS.y + 16)
const LINE: Bezier = { a: LINE_FROM, b: [LINE_FROM[0] + 320, LINE_FROM[1]], c: [LINE_FROM[0] + 520, LINE_FROM[1] + 190], d: [LINE_FROM[0] + 1500, LINE_FROM[1] + 170] }
const lineProgress = (frame: number) => {
  const t = span(frame, E.line, 45)
  return t * t * (1.6 - 0.6 * t)
}

const dropState = (frame: number): ScheduleDrop => (frame < E.hover ? 'before' : frame < E.drop ? 'hover' : 'dropped')

/* Слои для расслоения (П9), px логических окон: график и пульт. */
const SCHEDULE_LAYERS: Rect[] = [
  { x: 0, y: 0, width: 256, height: WIDE.height },
  { x: 256, y: 0, width: 1184, height: 64 },
  { x: 280, y: 88, width: 288, height: WIDE.height - 112 },
  { x: 592, y: 100, width: 800, height: 128 },
  { x: 592, y: 250, width: 800, height: 646 },
]
const DASH_LAYERS: Rect[] = [
  { x: 0, y: 0, width: 256, height: PANEL.height },
  { x: 256, y: 0, width: 768, height: 120 },
  { x: 276, y: 136, width: 728, height: 122 },
  { x: 276, y: 274, width: 728, height: 92 },
  { x: 276, y: 380, width: 728, height: 279 },
]

export function Schedule() {
  const frame = useCurrentFrame()
  const lang = useLang()
  /* Обводка чипа «Niewystarczająco»: английский «Understaffed» короче — чип
     уже, его правый край на месте (чипы выстроены справа налево). */
  const chipShort = lang === 'en' ? textWidth('Niewystarczająco', 12, 400) - textWidth('Understaffed', 12, 400) : 0
  const chip: Rect = { ...CHIP, x: CHIP.x + chipShort, width: CHIP.width - chipShort }
  const twins = useSheets(() => ({
    dropped: sheet(WIDE.width, WIDE.height, 2, (c) => drawSchedule(c, 'dropped')),
    ghost: sheet(WIDE.width, WIDE.height, 5, (c) => drawSchedule(c, 'hover'), POOL_JAN),
    dash: sheet(PANEL.width, PANEL.height, 2.6, (c) => drawCoordDashboard(c, { claim: false, tooltip: false, pressed: false, active: 12, bar: false })),
  }))
  const drop = dropState(frame)
  const schedule = useLive(WIDE.width, WIDE.height, 2, (c) => drawSchedule(c, drop), drop)
  const close = useLive(WIDE.width, WIDE.height, 5, (c) => drawSchedule(c, drop), drop, REGION)
  const top = useLive(WIDE.width, WIDE.height, 4.4, (c) => drawSchedule(c, drop), drop, TOP_REGION)
  const seconds = Math.floor(Math.max(0, frame - E.phone) / 30)
  const phone = useLive(SCREEN.width, SCREEN.height, 3.4, (c) => drawCoordPhone(c, seconds, true), seconds)

  const camera = viewAt(CAMERA, frame)
  const enter = easeOut(span(frame, E.enter, 22))
  const ghost = ghostAt(frame)
  const cursor = cursorAt(CURSOR, frame, [E.grab, E.drop], 232)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [dx, dy] = camera.project(...DROP_AT)
  const flash = Math.sin(Math.PI * clamp01(span(frame, E.drop, 22)))

  /* П9: наклон окна, слои графика улетают, слои пульта падают. */
  const T0 = E.layers
  const tilt = glide(span(frame, T0, 24)) - glide(span(frame, T0 + 64, 30))
  const layered = frame >= T0 && frame < T0 + 96
  const dashboard = frame >= T0 + 26
  const rise = spring(frame, E.phone, SPRINGS.heavy)
  const barAt = E.bar + 6

  /* П11: линия от секундомера Jana вправо, за край кадра. */
  const lineFrom = LINE.a
  const linePath = bezierPath(LINE)

  /* Звук: график въезжает снизу прокруткой насквозь; курсор берёт Jana из
     пула (нажатие) и тащит; блок раскрывает «Upuść pracownika tutaj»; Jan
     ложится в блок (удар); слои графика улетают, слои пульта садятся; телефон
     координатора встаёт, живые точки загораются, секундомеры щёлкают.
     Отпускание, тост, наклон стопки, полоса и линия — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const janAt = at(JAN_ROW.x + JAN_ROW.width / 2, JAN_ROW.y + JAN_ROW.height / 2)
  useSoundTrack('hr2d-grafik-enter', 'whoosh', frame >= 0 && frame <= 22, { x: 960, y: 540 + (1 - enter) * 1100 }, { gain: 0.8 })
  useSoundCue('click', E.grab, at(...GRAB_FROM), { gain: 0.6 })
  useSoundTrack('hr2d-grafik-drag', 'whoosh', frame > E.grab + 4 && frame < E.drag, at(ghost.x, ghost.y), { gain: 0.4 })
  useSoundCue('popIn', E.hover, at(...centerOf(W(BLOCK))), { gain: 0.55 })
  useSoundCue('thump', E.drop, at(...DROP_AT), { gain: 0.6 })
  useSoundCue('whoosh', T0 + 8, { x: 960, y: 480 }, { gain: 0.5, seconds: 0.6 })
  useSoundCue('thump', T0 + 40, { x: 960, y: 560 }, { gain: 0.5 })
  useSoundCue('whoosh', E.phone, at(PHONE.x + SCREEN.width / 2, PHONE.y + SCREEN.height / 2 + (1 - rise) * 700), { gain: 0.45, seconds: 0.6 })
  useSoundCue('layers', 548, janAt, { gain: 0.4, seconds: 0.8 })
  useSoundCues('tick', [572, 602, 632], janAt, { gain: 0.3 })

  const toastAnchor = camera.project(TOAST.x + TOAST.width - 10, TOAST.y + TOAST.height / 2)
  const liveAnchor = camera.project(...phonePt(PHONE, 330, LIVE_ROWS.y + 16))
  const liveBoxX = camera.project(LIVE_CARD.x + LIVE_CARD.width, 0)[0] + 60

  const layer = (depth: number, rect: Rect, k: number, source: HTMLCanvasElement | null, scale: number, opacity: number, key: number): ReactNode => (
    <Layer key={key} depth={tilt > 0.0005 ? depth : 0} style={{ left: rect.x * k, top: rect.y * k, width: rect.width * k, height: rect.height * k, opacity, boxShadow: depth > 6 && tilt > 0.02 ? SHADOW.card : undefined, borderRadius: 10 }}>
      <Painted source={source} crop={{ x: rect.x * scale, y: rect.y * scale, width: rect.width * scale, height: rect.height * scale }} style={{ inset: 0 }} />
    </Layer>
  )

  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - enter) * 1100}px)`, filter: enter < 0.99 ? `blur(${(1 - enter) * 14}px)` : undefined }}>
      <Camera view={camera}>
        <LayerStack t={tilt} rotateX={46} rotateZ={-22} scale={0.86} style={{ left: PAGE.x, top: PAGE.y - CHROME, width: 1440, height: PAGE_H + CHROME }}>
          <AppWindow url={dashboard ? 'iapply.com.pl/coordinator' : 'iapply.com.pl/admin/schedule'} width={1440} height={PAGE_H} clip={tilt < 0.0005} style={{ left: 0, top: 0 }} page={IA.gray50}>
            {!layered && !dashboard && (
              <>
                <Painted source={schedule} style={{ inset: 0 }} />
                <div style={{ position: 'absolute', left: REGION.x, top: REGION.y, width: REGION.width, height: REGION.height }}>
                  <Painted source={close} style={{ inset: 0 }} />
                </div>
                <div style={{ position: 'absolute', left: TOP_REGION.x, top: TOP_REGION.y, width: TOP_REGION.width, height: TOP_REGION.height }}>
                  <Painted source={top} style={{ inset: 0 }} />
                </div>
                <div style={{ position: 'absolute', left: BLOCK.x - 3, top: BLOCK.y - 3, width: BLOCK.width + 6, height: 82, borderRadius: 9, background: tint(IA.green500, 0.3 * flash) }} />
              </>
            )}
            {layered &&
              SCHEDULE_LAYERS.map((rect, i) => {
                const lift = easeIn(span(frame, T0 + 8 + i * 3, 18))
                return layer(2 + lift * 560, rect, 1, twins.dropped, 2, 1 - lift, i)
              })}
            {layered &&
              DASH_LAYERS.map((rect, i) => {
                const start = T0 + 28 + i * 3
                const fall = spring(frame, start, SPRINGS.pop)
                return layer(2 + 440 * (1 - fall), rect, K, twins.dash, 2.6, easeOut(span(frame, start - 2, 7)), 10 + i)
              })}
            {!layered && dashboard && <Painted source={twins.dash} style={{ inset: 0 }} />}
            {dashboard && frame >= barAt - 1 && (
              <Bar rect={{ x: ATTENDANCE_BAR.x * K, y: ATTENDANCE_BAR.y * K, width: ATTENDANCE_BAR.width * K, height: ATTENDANCE_BAR.height * K }} value={12 / 18} at={barAt} color={IA.primary} />
            )}
            {dashboard && <div style={{ position: 'absolute', left: ATTENDANCE_BAR.x * K, top: ATTENDANCE_BAR.y * K - 6, width: ATTENDANCE_BAR.width * K * (12 / 18), height: ATTENDANCE_BAR.height * K + 12, borderRadius: 12, background: tint(IA.primary400, 0.35 * Math.sin(Math.PI * clamp01(span(frame, barAt + 14, 16)))) }} />}
          </AppWindow>
        </LayerStack>
        <Scribble rect={W(chip)} p={easeOut(span(frame, 36, 18)) * (1 - easeIn(span(frame, 66, 8)))} pad={[14, 9]} seed={11} width={2.4} />
        <Scribble rect={W(chip)} p={easeOut(span(frame, 252, 16)) * (1 - easeIn(span(frame, E.layers - 10, 8)))} pad={[14, 9]} seed={12} width={2.4} />
        <Scribble rect={W(RATIO)} p={easeOut(span(frame, E.drop + 8, 14)) * (1 - easeIn(span(frame, 240, 8)))} pad={[8, 6]} seed={13} width={1.6} />
        {/* Призрак строки Jana: поднят, за курсором, над колонками. */}
        {frame >= E.grab && frame < E.drop + 8 && (
          <div
            style={{
              position: 'absolute',
              left: ghost.x - GRAB.x,
              top: ghost.y - GRAB.y,
              width: POOL_JAN.width,
              height: POOL_JAN.height,
              borderRadius: 8,
              background: '#ffffff',
              boxShadow: SHADOW.lifted,
              transform: `rotate(${2 * ghost.lift}deg) scale(${mix(1, 1.05, ghost.lift) * mix(1, 0.4, easeIn(span(frame, E.drop, 8)))})`,
              transformOrigin: `${GRAB.x}px ${GRAB.y}px`,
              opacity: 0.84 * (1 - easeIn(span(frame, E.drop + 2, 6))),
            }}
          >
            <Painted source={twins.ghost} style={{ inset: 0 }} />
          </div>
        )}
        <HotToast x={pagePt(PAGE, 720, 0)[0]} y={TOAST.y} at={E.toast} until={E.layers - 12} label="Jan Kowalski → 07:00 28.09" />
        <Handset spot={PHONE} screen={IOS.bg} style={{ transform: `translateY(${(1 - rise) * 700}px)`, opacity: frame < E.phone ? 0 : 1 }}>
          <Painted source={phone} style={{ inset: 0 }} />
          <div style={{ position: 'absolute', left: JAN_ROW.x - PHONE.x, top: JAN_ROW.y - PHONE.y, width: JAN_ROW.width, height: JAN_ROW.height, borderRadius: 10, background: tint(IA.primary, 0.1 * easeOut(span(frame, 560, 12))) }} />
        </Handset>
        {frame >= 548 &&
          ATTENDANCE.map((_, i) => {
            const [px, py] = phonePt(PHONE, 36, LIVE_ROWS.y + i * LIVE_ROWS.row + 16)
            return <Pulse key={i} x={px} y={py} at={548 + i * 5} until={E.line + 20} radius={16} color={tint(IOS.success, 0.9)} rings={2} period={40} width={1.4} />
          })}
        {frame >= E.line && <DrawPath d={linePath} p={lineProgress(frame)} color={IA.primary} width={3} />}
        {frame >= E.line && frame < E.line + 44 && <Pulse x={lineFrom[0]} y={lineFrom[1]} at={E.line} until={E.line + 20} radius={22} color={tint(IA.primary, 0.8)} rings={1} period={24} width={2} />}
      </Camera>
      <Callout anchor={toastAnchor} box={{ x: toastAnchor[0] + 110, y: toastAnchor[1] + 90, width: lang === 'en' ? 610 : 500 }} tag={tag(12, lang)} title={caption(12, lang)} at={270} until={372} />
      <Callout anchor={liveAnchor} box={{ x: liveBoxX, y: liveAnchor[1] - 260, width: 470 }} tag={tag(13, lang)} title={caption(13, lang)} at={574} until={660} />
      <Ripple x={dx} y={dy} at={E.drop} />
      <Cursor x={cx} y={cy} press={frame >= E.grab && frame < E.drop ? 0.7 : cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
