import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { AppWindow, CHROME } from '../kit/surfaces'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { Handset, HotToast, Pulse, SCREEN, arcPoint, centerOf, pagePt, pageRect, phonePt, phoneRect, union, type PageSpot, type PhoneSpot } from './parts'
import { GPS_NOTE, IOS, MAP_CARD, PANEL, caption, drawGpsNote, drawMapCard, drawQr, drawQrPanel, drawScanner, sheet, tag, useLive, useSheets, type QrPanelState, type ScanStage } from './twins'

/* 06–07 · 02 Wejście · Kod QR → skan → geostrefa (53 доли). Центр QR
   координатора въезжает каруселью справа. Курсор ставит «GODZINY» 8 (Razem:
   8h), «Generuj QR» — тост «Kod QR wygenerowany» крупно, в уголках встаёт код,
   «Wygasa:» бежит. Код отрывается от страницы (П4), рядом встаёт жёлтая
   плашка о привязке к GPS — камера держит её, пока читается. Код летит дугой
   в сканер телефона (П6), камера за ним; уголки защёлкиваются, «Ustalanie
   lokalizacji…», из телефона выходит карта «Szczegóły zmiany»: точка телефона
   въезжает в круг геозоны 200 m, круг зеленеет. «Zarejestrowano wejście» —
   крупно. Телефон гаснет: следующая сцена — экран блокировки.

   0–30     вход каруселью; 30–60 наезд к «Czas trwania kodu QR»
   70       клик в «GODZINY»; 78 — «8»; 84 — подчёркивание «Razem: 8h»
   110      клик «Generuj QR»; 112 — код и тост; 132–174 тост крупно
   174–198  к коду и «Wygasa:»; 188–302 выноска «Kod na obiekt. Wygasa sam.»
   304–328  код отрывается ×1,45; 314 — плашка GPS; 334–410 читается
   410–458  код летит в сканер, камера за ним; телефон встаёт
   458      уголки защёлкиваются; 470–518 «Ustalanie lokalizacji…»
   518–544  карта выходит из телефона; 544–584 точка въезжает в круг
   584      круг зеленеет, волна; 558–656 выноска «Odbicie tylko na obiekcie»
   658–682  карта возвращается; 668 — «Zarejestrowano wejście», 684–762 крупно
   762–795  отъезд к телефону, экран гаснет */

export const QR_BEATS = 53

const K = 1440 / PANEL.width
const PAGE: PageSpot = { x: 240, y: 99, k: K }
const PAGE_H = Math.round(PANEL.height * K)
const PHONE: PhoneSpot = { x: 2330, y: 114, scale: 1 }
const P = (x: number, y: number) => pagePt(PAGE, x, y)

const HOURS = pageRect(PAGE, { x: 764, y: 396, width: 224, height: 44 })
const GENERATE = pageRect(PAGE, { x: 276, y: 505, width: 728, height: 48 })
const RAZEM = pageRect(PAGE, { x: 596, y: 452, width: 88, height: 16 })
const COUNTDOWN = pageRect(PAGE, { x: 548, y: 458, width: 186, height: 30 })
const QR_REST = pageRect(PAGE, { x: 512, y: 158, width: 256, height: 256 })
const TOAST_W = 214
const TOAST: Rect = { x: P(512, 0)[0] - (TOAST_W * K) / 2, y: P(0, 16)[1], width: TOAST_W * K, height: 52 * K }

const E = {
  enter: 0,
  click: 70,
  type: 78,
  generate: 110,
  toast: 112,
  lift: 304,
  note: 314,
  fly: 410,
  flyDur: 48,
  locate: 470,
  map: 518,
  inside: 544,
  green: 584,
  back: 658,
  success: 668,
  sleep: 778,
}

/** Код, вышедший вперёд: крупнее ×1,45 на своём месте, плашка GPS — под ним. */
const LIFT = 1.45
const QR_UP: Rect = (() => {
  const [cx, cy] = centerOf(QR_REST)
  const size = QR_REST.width * LIFT
  return { x: cx - size / 2, y: cy - size / 2 - 40, width: size, height: size }
})()
const NOTE_W = 720
const NOTE: Rect = { x: centerOf(QR_UP)[0] - NOTE_W / 2, y: QR_UP.y + QR_UP.height + 34, width: NOTE_W, height: NOTE_W * (GPS_NOTE.height / GPS_NOTE.width) }

/** Код в сканере: на листке в кадре камеры (drawScanner, стадия «code»). */
const QR_SCAN = phoneRect(PHONE, { x: 112.5, y: 258, width: 168, height: 168 })

function qrAt(frame: number) {
  const t = glide(span(frame, E.fly, E.flyDur))
  const [x, y] = arcPoint(centerOf(QR_UP), centerOf(QR_SCAN), t, 150)
  return { x, y, t, size: mix(QR_UP.width, QR_SCAN.width, t) }
}

/** Карта «Szczegóły zmiany» слева от телефона, ×1,9. */
const MAP_SCALE = 1.9
const MAP: Rect = { x: PHONE.x - 70 - MAP_CARD.width * MAP_SCALE, y: 540 - (MAP_CARD.height * MAP_SCALE) / 2, width: MAP_CARD.width * MAP_SCALE, height: MAP_CARD.height * MAP_SCALE }
const onMap = (x: number, y: number): [number, number] => [MAP.x + x * MAP_SCALE, MAP.y + y * MAP_SCALE]
const CIRCLE = onMap(160, 152)
const SUCCESS = phoneRect(PHONE, { x: 16, y: 516, width: 361, height: 184 })
const PHONE_CENTER = centerOf(phoneRect(PHONE, { x: 0, y: 0, ...SCREEN }))

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 30, dur: 30, ...fit(pageRect(PAGE, { x: 276, y: 322, width: 728, height: 236 }), { max: 1.7 }) },
  { at: E.toast, dur: 20, ...focus(TOAST, { fill: 0.5 }) },
  { at: 174, dur: 24, ...fit(pageRect(PAGE, { x: 440, y: 120, width: 400, height: 395 }), { max: 1.6, shift: [-280, 0] }) },
  { at: E.lift + 6, dur: 24, ...focus(union(QR_UP, NOTE), { fill: 0.5, tall: 0.88 }) },
  { at: E.fly - 4, dur: 18, follow: follow((f) => [qrAt(f).x, qrAt(f).y], { zoom: (f) => mix(1.25, 0.95, Math.sin(Math.PI * qrAt(f).t)), lag: 6 }) },
  { at: E.fly + E.flyDur + 2, dur: 22, ...fit(phoneRect(PHONE, { x: 0, y: 96, width: SCREEN.width, height: 470 }), { max: 1.95 }) },
  { at: E.map + 4, dur: 24, ...focus(MAP, { fill: 0.5, shift: [210, 0] }) },
  { at: E.back + 4, dur: 26, ...focus(SUCCESS, { fill: 0.48 }) },
  { at: 762, dur: 28, x: PHONE_CENTER[0], y: PHONE_CENTER[1], zoom: 1 },
]

/** Вид камеры на коде и «Wygasa:» (он стоит, пока видна выноска станции 6). */
const QR_VIEW = viewAt(CAMERA, 200)

const CURSOR = [
  { at: 42, x: HOURS.x + HOURS.width + 260, y: HOURS.y + 230 },
  { at: 66, x: HOURS.x + HOURS.width * 0.52, y: HOURS.y + HOURS.height * 0.55 },
  { at: 90, x: HOURS.x + HOURS.width * 0.6, y: HOURS.y + HOURS.height * 0.7 },
  { at: 106, x: GENERATE.x + GENERATE.width * 0.52, y: GENERATE.y + GENERATE.height * 0.55 },
  { at: 132, x: GENERATE.x + GENERATE.width * 0.7, y: GENERATE.y + 260 },
]
const CLICK_HOURS = cursorAt(CURSOR, E.click)
const CLICK_GENERATE = cursorAt(CURSOR, E.generate)

/** Сколько секунд осталось коду: 8 h, отсчёт — от кадра создания. */
const secondsLeft = (frame: number) => 8 * 3600 - Math.max(0, Math.floor((frame - E.toast) / 30))

function panelState(f: number): QrPanelState {
  return {
    hours: f < E.type ? '1' : '8',
    focus: f >= E.click && f < E.generate - 6,
    pressed: f >= E.generate - 2 && f < E.generate + 2,
    generated: f >= E.toast,
    lifted: f >= E.lift,
    left: secondsLeft(f),
  }
}

function scanStage(f: number): ScanStage {
  if (f < E.fly + E.flyDur) return 'scanning'
  if (f < E.locate) return 'code'
  if (f < E.success) return 'locating'
  return 'success'
}

export function Qr() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const twins = useSheets(() => ({
    qr: sheet(256, 256, 4, (c) => drawQr(c, 0, 0, 256, 12)),
    note: sheet(GPS_NOTE.width, GPS_NOTE.height, 4, drawGpsNote),
  }))
  const panelNow = panelState(frame)
  const panel = useLive(PANEL.width, PANEL.height, 3, (c) => drawQrPanel(c, panelNow), JSON.stringify(panelNow))
  const stage = scanStage(frame)
  const phase = stage === 'locating' ? frame * 0.35 : 0
  const scanner = useLive(SCREEN.width, SCREEN.height, 3, (c) => drawScanner(c, stage, phase), `${stage}:${phase.toFixed(2)}`)
  const inside = easeInOut(span(frame, E.inside, 40))
  const green = frame >= E.green
  const map = useLive(MAP_CARD.width, MAP_CARD.height, 4, (c) => drawMapCard(c, inside, green), `${inside.toFixed(3)}:${green}`)

  const camera = viewAt(CAMERA, frame)
  const enter = spring(frame, E.enter, SPRINGS.heavy)
  const cursor = cursorAt(CURSOR, frame, [E.click, E.generate], 128)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [hx, hy] = camera.project(CLICK_HOURS.x, CLICK_HOURS.y)
  const [gx, gy] = camera.project(CLICK_GENERATE.x, CLICK_GENERATE.y)

  const lift = spring(frame, E.lift, SPRINGS.heavy)
  const veil = easeOut(span(frame, E.lift, 16)) * (1 - easeIn(span(frame, E.fly + 10, 20)))
  const qr = qrAt(frame)
  const flying = frame >= E.fly
  const qrShown = frame >= E.lift && frame < E.fly + E.flyDur
  const qrRect: Rect = flying ? { x: qr.x - qr.size / 2, y: qr.y - qr.size / 2, width: qr.size, height: qr.size } : { x: mix(QR_REST.x, QR_UP.x, lift), y: mix(QR_REST.y, QR_UP.y, lift), width: mix(QR_REST.width, QR_UP.width, lift), height: mix(QR_REST.height, QR_UP.height, lift) }
  const note = spring(frame, E.note, SPRINGS.pop)
  const noteOut = easeIn(span(frame, E.fly, 12))
  const windowOut = easeInOut(span(frame, E.fly + 20, 26))
  const rise = spring(frame, E.fly - 14, SPRINGS.heavy)
  const snap = spring(frame, E.fly + E.flyDur, SPRINGS.snap)
  const shake = frame >= E.fly + E.flyDur && frame < E.fly + E.flyDur + 8 ? Math.sin((frame - E.fly - E.flyDur) * 2.4) * 4 * (1 - (frame - E.fly - E.flyDur) / 8) : 0
  const mapIn = spring(frame, E.map, SPRINGS.heavy) * (1 - glide(span(frame, E.back, 22)))
  const sleep = easeIn(span(frame, E.sleep, 16))

  /* Карта выходит из экрана телефона: из середины экрана в свою рамку. */
  const [scx, scy] = centerOf(phoneRect(PHONE, { x: 16, y: 182, width: 361, height: 320 }))
  const [mcx, mcy] = centerOf(MAP)
  const mapScale = mix(0.32, 1, mapIn)
  const mapX = mix(scx, mcx, mapIn)
  const mapY = mix(scy, mcy, mapIn)

  /* Звук: в «GODZINY» набрана 8; блик нового кода; «Wygasa:» отщёлкивает
     секунды; код отрывается, всплывает плашка о GPS; код летит в сканер,
     телефон встаёт; рамка прицела защёлкивается, код распознан; карта выходит,
     круг зеленеет («пинг» геозоны), карта уходит; «Zarejestrowano wejście» —
     успех; экран гаснет. Клики и тост — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const qrCenter = at(qrRect.x + qrRect.width / 2, qrRect.y + qrRect.height / 2)
  const phoneAt = at(PHONE_CENTER[0], PHONE_CENTER[1] + (1 - rise) * 640)
  useSoundCue('key', E.type, at(...centerOf(HOURS)), { gain: 0.9 })
  useSoundCue('glint', E.toast + 6, at(...centerOf(QR_REST)), { gain: 0.4, seconds: 0.5 })
  useSoundCues('tick', [202, 232, 262, 292], at(...centerOf(COUNTDOWN)), { gain: 0.3 })
  useSoundCue('whoosh', E.lift, qrCenter, { gain: 0.5, seconds: 0.5 })
  useSoundCue('popIn', E.note, at(...centerOf(NOTE)), { gain: 0.7 })
  useSoundCue('popOut', E.fly, at(...centerOf(NOTE)), { gain: 0.4 })
  useSoundCue('whoosh', E.fly - 14, phoneAt, { gain: 0.45, seconds: 0.6 })
  useSoundTrack('hr2d-qr-fly', 'whoosh', frame >= E.fly && frame <= E.fly + E.flyDur, qrCenter, { gain: 0.6 })
  useSoundCue('toggle', E.fly + E.flyDur, at(...centerOf(QR_SCAN)), { gain: 0.5 })
  useSoundCue('glint', E.fly + E.flyDur + 3, at(...centerOf(QR_SCAN)), { gain: 0.6, seconds: 0.5 })
  useSoundCue('popIn', E.map, at(mapX, mapY), { gain: 0.8 })
  /* Точка телефона на карте въезжает в круг (как у drawMapCard: 272; 216 → 190; 182). */
  useSoundTrack('hr2d-map-dot', 'whoosh', frame > E.inside && frame < E.inside + 40, at(...onMap(mix(272, 190, inside), mix(216, 182, inside))), { gain: 0.3 })
  useSoundCue('glint', E.green, at(...CIRCLE), { gain: 0.8, seconds: 0.6 })
  useSoundCue('popOut', E.back, at(mapX, mapY), { gain: 0.4 })
  useSoundCue('success', E.success, at(...centerOf(SUCCESS)), { gain: 0.9 })
  useSoundCue('popOut', E.sleep, phoneAt, { gain: 0.3 })

  const countdownAnchor = camera.project(COUNTDOWN.x + COUNTDOWN.width * 0.8, COUNTDOWN.y + COUNTDOWN.height * 0.5)
  /* Рамка — на бумаге справа от окна (тёмная страница делала стекло серым),
     на уровне отсчёта: линия идёт вправо, не пересекая код. */
  const windowRight = QR_VIEW.project(PAGE.x + 1440, 0)[0]
  const countdownY = QR_VIEW.project(0, COUNTDOWN.y + COUNTDOWN.height * 0.5)[1]
  /* Английская подпись станции 6 — в три строки: рамка выше, чтобы низ не
     ушёл за полосу, которую срезает сайт (y ≤ 990). */
  const countdownBoxY = countdownY - 44 - (lang === 'en' ? 100 : 0)
  const circleAnchor = camera.project(CIRCLE[0], CIRCLE[1])

  return (
    <AbsoluteFill>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          <AppWindow url="iapply.com.pl/coordinator/qr" width={1440} height={PAGE_H} style={{ left: PAGE.x, top: PAGE.y - CHROME, opacity: 1 - windowOut }}>
            <Painted source={panel} style={{ inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: '#f7f8fa', opacity: 0.84 * veil }} />
          </AppWindow>
          <Scribble rect={RAZEM} kind="underline" p={easeOut(span(frame, 84, 14)) * (1 - easeIn(span(frame, E.generate, 6)))} width={2.6} />
          <Scribble rect={COUNTDOWN} kind="underline" p={easeOut(span(frame, 200, 16)) * (1 - easeIn(span(frame, E.lift, 8)))} width={2.8} />
          <HotToast x={P(512, 0)[0]} y={TOAST.y} at={E.toast} until={184} label={t('Kod QR wygenerowany', 'QR code generated')} scale={K} />
          {frame >= E.note && frame < E.fly + 14 && (
            <div
              style={{
                position: 'absolute',
                left: NOTE.x,
                top: NOTE.y,
                width: NOTE.width,
                height: NOTE.height,
                borderRadius: 12 * (NOTE.width / GPS_NOTE.width),
                boxShadow: SHADOW.lifted,
                opacity: clamp01(note * 1.4) * (1 - noteOut),
                transform: `translateY(${(1 - note) * 60 + noteOut * 40}px) scale(${mix(0.9, 1, clamp01(note))})`,
              }}
            >
              <Painted source={twins.note} style={{ inset: 0 }} />
            </div>
          )}
          {qrShown && (
            <div style={{ position: 'absolute', left: qrRect.x, top: qrRect.y, width: qrRect.width, height: qrRect.height, perspective: 1600 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 12 * (qrRect.width / 256), overflow: 'hidden', boxShadow: SHADOW.lifted, transform: `rotateX(${(1 - clamp01(lift)) * 14}deg) rotateZ(${flying ? Math.sin(Math.PI * qr.t) * -8 : 0}deg)` }}>
                <Painted source={twins.qr} style={{ inset: 0 }} />
              </div>
            </div>
          )}
          <Handset spot={PHONE} style={{ transform: `translate(${shake}px, ${(1 - rise) * 640}px)`, opacity: frame < E.fly - 14 ? 0 : 1 }} screen={IOS.bg}>
            <Painted source={scanner} style={{ inset: 0 }} />
            {/* Рамка прицела защёлкивается на коде. */}
            {frame >= E.fly + E.flyDur - 2 && frame < E.locate + 6 && (
              <div style={{ position: 'absolute', left: 86.5, top: 232, width: 220, height: 220, borderRadius: 20, border: '3px solid #ffffff', boxSizing: 'border-box', transform: `scale(${mix(1.14, 1, snap)})`, opacity: 1 - easeIn(span(frame, E.locate, 6)) }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: '#000000', opacity: sleep }} />
          </Handset>
          {mapIn > 0.002 && (
            <div
              style={{
                position: 'absolute',
                left: mapX - MAP.width / 2,
                top: mapY - MAP.height / 2,
                width: MAP.width,
                height: MAP.height,
                borderRadius: 18 * MAP_SCALE,
                overflow: 'hidden',
                boxShadow: SHADOW.lifted,
                transform: `scale(${mapScale})`,
                opacity: clamp01(mapIn * 3),
              }}
            >
              <Painted source={map} style={{ inset: 0 }} />
            </div>
          )}
          {mapIn > 0.98 && <Pulse x={CIRCLE[0]} y={CIRCLE[1]} at={E.green} until={E.back - 4} radius={62 * MAP_SCALE * 1.5} color={tint(IOS.success, 0.9)} rings={3} period={30} width={3} />}
          <Scribble rect={{ x: onMap(246, 218)[0], y: onMap(246, 218)[1], width: 34 * MAP_SCALE, height: 14 * MAP_SCALE }} p={easeOut(span(frame, E.green + 8, 14)) * (1 - easeIn(span(frame, E.back - 6, 8)))} pad={[10, 8]} seed={6} width={2.6} />
          {frame >= E.success && <Pulse x={phonePt(PHONE, 196.5, 558)[0]} y={phonePt(PHONE, 196.5, 558)[1]} at={E.success} until={E.success + 40} radius={56} color={tint(IOS.success, 0.8)} rings={2} period={26} width={2.4} />}
        </Camera>
        <Callout anchor={countdownAnchor} box={{ x: windowRight + 36, y: countdownBoxY, width: 330 }} tag={tag(6, lang)} title={caption(6, lang)} at={188} until={302} />
        <Callout anchor={circleAnchor} box={{ x: 56, y: circleAnchor[1] - 250, width: lang === 'en' ? 610 : 560 }} tag={tag(7, lang)} title={caption(7, lang)} at={558} until={656} />
        <Ripple x={hx} y={hy} at={E.click} />
        <Ripple x={gx} y={gy} at={E.generate} />
        <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
      </Swing>
    </AbsoluteFill>
  )
}

/** Где телефон в последнем виде сцены: экран блокировки встаёт на то же место. */
export const QR_PHONE_CENTER = PHONE_CENTER
