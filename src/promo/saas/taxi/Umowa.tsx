import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, Scribble, bezierPoint, flowCurve } from '../kit/draw'
import { pick, useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, Ripple, Tap, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { SHADOW, type Point, type Rect } from '../kit/theme'
import { DOKUMENTY_NOTICE, DOKUMENTY_VIEW } from './Dokumenty'
import { Glow, Pop, Sweep } from './fx'
import { inFrame } from './geometry'
import { DESK, Desk, Live, TaxiPhone, deskRect, onDesk, onPhone, phoneRect } from './screen'
import {
  A4,
  CONTRACT_BUTTON,
  CONTRACT_ROW,
  DRIVER_DIALOG,
  GOLD,
  NATIVE_CONTRACT,
  SIGN_FIELD,
  SIGN_SHEET,
  SIGN_SUBMIT,
  TB,
  VERIFIED,
  caption,
  drawCheckBadge,
  drawContract,
  drawContractRow,
  drawDriverContracts,
  drawNativeContractCard,
  drawNativeContracts,
  drawNativeDocs,
  drawSignSheet,
  drawVerified,
  tag,
} from './twins'

/* 12–13 · 04 Umowa · Договор и подпись (39 долей). От уведомления «Profil
   zweryfikowany» к окну водителя в панели тянется линия-связь (П11), камера
   летит за её концом; конец обходит окно по периметру. «Utwórz umowę» —
   строка договора встаёт, из неё выходит лист PDF (П4) и встаёт перед
   камерой крупно: шапка, «UMOWA NAJMU POJAZDU», номер, дата, параграфы,
   подписи сторон. Лист уменьшается и летит в телефон — камера следует; в
   приложении водителя «Umowy»: «Podpisz» → лист «Podpis», палец выводит
   подпись в белом поле, «Podpisz umowę» — штамп, «Podpisana».

   0–40     связь от уведомления к окну водителя (камера за её концом)
   40–62    конец обходит окно по периметру
   80       «Utwórz umowę»; 84 — строка договора встаёт (pop)
   108–140  лист PDF выходит из строки и встаёт крупно (П4)
   140–196  шапка листа; 196–222 — вниз к подписям; 222–262 — держим
   262–290  лист поворачивается и уменьшается; 290–348 — полёт в телефон
   348–372  «Umowy»: карточка «Czeka na Twój podpis»; 384 «Podpisz»
   388–499  лист «Podpis» крупно (≥ readFrames); 429–481 — палец выводит подпись
   495      «Podpisz umowę»; 503 штамп, «Podpisana»
   511–585  «Podpisana» и строка «Podpisano…» крупно */

export const UMOWA_BEATS = 39

const T = {
  link: 2,
  trace: 40,
  click: 80,
  row: 84,
  sheet: 108,
  top: 140,
  down: 196,
  shrink: 262,
  flight: 290,
  land: 348,
  sign: 384,
  sheetUp: 388,
  ink: 429,
  inkEnd: 481,
  submit: 495,
  stamp: 503,
}

/* ── Связь от уведомления к окну водителя ── */

const NOTICE_WORLD = phoneRect(DOKUMENTY_NOTICE)
const DIALOG_WORLD = deskRect({ x: DRIVER_DIALOG.x, y: DRIVER_DIALOG.y, width: DRIVER_DIALOG.width, height: DRIVER_DIALOG.height })
const LINK_FROM: Point = [NOTICE_WORLD.x - 4, NOTICE_WORLD.y + NOTICE_WORLD.height / 2]
const LINK_TO: Point = [DIALOG_WORLD.x + DIALOG_WORLD.width + 4, DIALOG_WORLD.y + DIALOG_WORLD.height * 0.42]
const LINK = flowCurve(LINK_FROM, LINK_TO, 0.55)
const linkP = (frame: number) => easeInOut(span(frame, T.link, T.trace - T.link))

/* ── Лист PDF ── */

const ROW_WORLD = deskRect(CONTRACT_ROW)
/** Лист встаёт крупно над окном водителя: A4 в масштабе 1, центр — над окном. */
const PAPER: Rect = { x: DIALOG_WORLD.x + DIALOG_WORLD.width / 2 - A4.width / 2, y: DESK.y + DESK.height / 2 - A4.height / 2 + 10, width: A4.width, height: A4.height }
const CARD_SLOT: Rect = phoneRect({ x: NATIVE_CONTRACT.x, y: NATIVE_CONTRACT.y, width: NATIVE_CONTRACT.width, height: NATIVE_CONTRACT.height })

function paper(frame: number) {
  const out = spring(frame, T.sheet, SPRINGS.heavy)
  const shrink = easeInOut(span(frame, T.shrink, 26))
  const t = glide(span(frame, T.flight, T.land - T.flight))
  /* Из строки договора → крупный лист → меньше и с поворотом → карточка в телефоне. */
  const small = { width: A4.width * 0.62, height: A4.height * 0.62 }
  const cx0 = mix(ROW_WORLD.x + ROW_WORLD.width / 2, PAPER.x + PAPER.width / 2, clamp01(out))
  const cy0 = mix(ROW_WORLD.y + ROW_WORLD.height / 2, PAPER.y + PAPER.height / 2, clamp01(out))
  const w0 = mix(ROW_WORLD.width * 0.4, PAPER.width, out)
  const h0 = mix(ROW_WORLD.height * 1.6, PAPER.height, out)
  const w1 = mix(w0, small.width, shrink)
  const h1 = mix(h0, small.height, shrink)
  const morph = easeInOut(span(frame, T.flight + 30, 18))
  const width = mix(w1, CARD_SLOT.width, morph)
  const height = mix(h1, CARD_SLOT.height, morph)
  const x = mix(cx0, CARD_SLOT.x + CARD_SLOT.width / 2, t)
  const y = mix(cy0, CARD_SLOT.y + CARD_SLOT.height / 2, t) - Math.sin(Math.PI * t) * 140
  const turn = (1 - clamp01(out)) * 28 + Math.sin(Math.PI * shrink) * 12 - 10 * shrink * (1 - morph)
  return { x, y, width, height, out, shrink, morph, turn, t }
}

/* ── Подпись пальцем: росчерк «O. Bondar» в белом поле (pt поля 361 × 220) ── */

const INK = [
  'M 40 138 C 28 100, 72 70, 96 94 C 118 116, 90 152, 60 143 C 38 136, 56 104, 90 112 C 108 117, 116 128, 124 138',
  'C 132 112, 140 86, 152 68 C 160 58, 172 70, 163 88 C 157 100, 146 104, 150 108 C 178 104, 186 126, 166 139 C 152 147, 138 142, 146 132',
  'C 160 118, 176 124, 186 128 C 198 134, 206 118, 198 110 C 188 104, 184 124, 198 132 C 214 140, 220 116, 228 108',
  'C 230 124, 232 132, 238 136 C 246 118, 256 110, 264 116 C 270 124, 264 136, 272 138 C 284 140, 292 100, 298 84',
  'C 302 104, 300 128, 308 136 C 316 142, 322 122, 328 118 C 336 128, 338 136, 348 130',
].join(' ')
const FLOURISH = 'M 58 176 C 140 160, 240 166, 332 156'

export function Umowa() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const samples = useMemo(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const sample = (d: string, n: number) => {
      svg.setAttribute('d', d)
      const length = svg.getTotalLength()
      return Array.from({ length: n + 1 }, (_, i) => {
        const p = svg.getPointAtLength((length * i) / n)
        return [p.x, p.y] as Point
      })
    }
    return { ink: sample(INK, 240), flourish: sample(FLOURISH, 60) }
  }, [])
  const layout = useMemo(() => {
    /* Пилюля «Podpisana» (iosPill: текст 12 pt + 20) у правого края карточки. */
    const signed = textWidth(pick(lang, 'Podpisana', 'Signed'), 12, 600) + 20
    return { signed: { x: NATIVE_CONTRACT.x + NATIVE_CONTRACT.width - 16 - signed, y: NATIVE_CONTRACT.y + 16, width: signed, height: 22 } }
  }, [lang])

  const pp = paper(frame)
  const head = bezierPoint(LINK, linkP(frame))
  const camera = viewAt(CAMERA, frame)
  const trace = easeInOut(span(frame, T.trace, 22)) * (1 - easeIn(span(frame, T.trace + 40, 14)))
  const rowIn = spring(frame, T.row, SPRINGS.pop)
  const sheetIn = spring(frame, T.sheetUp, SPRINGS.glide) * (1 - easeIn(span(frame, T.submit + 4, 10)))
  const inkP = easeInOut(span(frame, T.ink, T.inkEnd - T.ink))
  const flourishP = easeInOut(span(frame, T.inkEnd + 2, 8))
  const signed = frame >= T.stamp
  const stamp = spring(frame, T.stamp, SPRINGS.pop)
  const shake = frame >= T.stamp + 2 && frame < T.stamp + 8 ? Math.sin((frame - T.stamp) * 2.6) * 3 * (1 - (frame - T.stamp - 2) / 6) : 0
  const cursorWorld = cursorAt(CURSOR_KEYS, frame, [T.click], 104)
  const [cx, cy] = camera.project(cursorWorld.x, cursorWorld.y)
  const clickAt = cursorAt(CURSOR_KEYS, T.click)
  const [rx, ry] = camera.project(clickAt.x, clickAt.y)
  const nativeCard = frame >= T.land

  /* Палец: где сейчас голова росчерка (в pt экрана) и след за ней. */
  const fieldTop = 852 - SIGN_SHEET.height
  const inkHead = (p: number): Point => {
    const pts = p <= 1 && frame < T.inkEnd + 2 ? samples.ink : samples.flourish
    const k = frame < T.inkEnd + 2 ? p : flourishP
    const pt = pts[Math.min(pts.length - 1, Math.round(k * (pts.length - 1)))]!
    return [SIGN_FIELD.x + pt[0], fieldTop + SIGN_FIELD.y + pt[1]]
  }
  const finger = inkHead(inkP)
  const fingerOn = frame >= T.ink - 3 && frame <= T.inkEnd + 12

  /* Выноски. */
  const buttonAt = camera.project(...onDesk(CONTRACT_BUTTON.x + CONTRACT_BUTTON.width * 0.5, CONTRACT_BUTTON.y + CONTRACT_BUTTON.height))
  const dialogView = viewAt(CAMERA, T.click + 20)
  const dialogRight = dialogView.project(DIALOG_WORLD.x + DIALOG_WORLD.width, 0)[0]
  const fieldAt = camera.project(...onPhone(SIGN_FIELD.x + 250, fieldTop + SIGN_FIELD.y + 170))
  const signView = viewAt(CAMERA, T.ink + 10)
  const sheetRight = signView.project(...onPhone(393, 0))[0]

  /* Звук: конец связи обводит окно водителя (перо), блик по панели; строка
     договора встаёт; лист PDF выходит из строки, уменьшается с поворотом и летит в
     телефон; карточка
     садится в «Umowy»; лист «Podpis»; палец выводит подпись — перо за пальцем;
     штамп. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  useSoundCue('pen', T.trace, at(DIALOG_WORLD.x + DIALOG_WORLD.width / 2, DIALOG_WORLD.y + DIALOG_WORLD.height / 2), { gain: 1, seconds: 0.75 })
  useSoundCue('glint', T.trace + 4, at(DESK.x + DESK.width / 2, DESK.y + DESK.height / 2), { gain: 0.3, seconds: 0.7 })
  useSoundCue('popIn', T.row, at(ROW_WORLD.x + ROW_WORLD.width / 2, ROW_WORLD.y + ROW_WORLD.height / 2), { gain: 0.6 })
  useSoundTrack('taxi2d-contract-out', 'whoosh', frame >= T.sheet && frame <= T.sheet + 18, at(pp.x, pp.y), { gain: 0.5 })
  useSoundCue('air', T.shrink, at(pp.x, pp.y), { gain: 0.35, seconds: 0.8 })
  useSoundTrack('taxi2d-contract-flight', 'whoosh', frame > T.flight && frame <= T.land, at(pp.x, pp.y), { gain: 0.6 })
  useSoundCue('thump', T.land, at(CARD_SLOT.x + CARD_SLOT.width / 2, CARD_SLOT.y + CARD_SLOT.height / 2), { gain: 0.55 })
  useSoundCue('popIn', T.sheetUp + 7, at(...onPhone(196.5, fieldTop + 40)), { gain: 0.6 })
  useSoundTrack('taxi2d-signature', 'pen', frame >= T.ink && frame <= T.inkEnd + 10, at(...onPhone(...finger)), { gain: 0.9 })
  useSoundCue('stamp', T.stamp + 2, at(...onPhone(NATIVE_CONTRACT.x + NATIVE_CONTRACT.width - 60, NATIVE_CONTRACT.y + 80)), { gain: 1 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {/* Панель: окно водителя, вкладка «Umowy». */}
        <Desk>
          <Live width={DESK.width} height={DESK.height} ratio={2.4} draw={(ctx) => drawDriverContracts(ctx, DESK.width, DESK.height, false)} />
          <Pop frame={frame} at={T.row} rect={CONTRACT_ROW}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', boxShadow: rowIn < 1.2 ? SHADOW.card : undefined }}>
              <Live width={CONTRACT_ROW.width} height={CONTRACT_ROW.height} ratio={3} draw={drawContractRow} />
            </div>
          </Pop>
          <Glow frame={frame} at={T.row + 6} rect={CONTRACT_ROW} color={GOLD} strength={0.2} />
          <Sweep frame={frame} at={T.trace + 4} width={DESK.width} height={DESK.height} />
        </Desk>
        {/* П11: связь от уведомления, её конец обходит окно водителя. */}
        {frame < T.trace + 60 && (
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - easeIn(span(frame, T.trace + 40, 16)) }}>
            <Connector from={LINK.a} to={LINK.d} bend={0.55} p={linkP(frame)} frame={frame} flowing={1 - easeOut(span(frame, T.trace + 20, 20))} color="#CF8A00" />
          </div>
        )}
        <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none' }}>
          <rect
            x={DIALOG_WORLD.x - 6}
            y={DIALOG_WORLD.y - 6}
            width={DIALOG_WORLD.width + 12}
            height={DIALOG_WORLD.height + 12}
            rx={28}
            fill="none"
            stroke={GOLD}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - clamp01(trace)}
            opacity={trace > 0.002 ? 1 : 0}
          />
        </svg>

        {/* Телефон: уведомление «Profil zweryfikowany» → «Umowy» → лист «Podpis». */}
        <TaxiPhone
          style={{ transform: `translateX(${shake}px)` }}
          overlay={
            <>
              {frame < T.flight && (
                <div style={{ position: 'absolute', left: DOKUMENTY_NOTICE.x, top: DOKUMENTY_NOTICE.y, width: VERIFIED.width, height: VERIFIED.height, borderRadius: 20, boxShadow: '0 12px 30px rgba(0,0,0,0.45)', opacity: 1 - easeIn(span(frame, T.trace + 30, 12)) }}>
                  <Live width={VERIFIED.width} height={VERIFIED.height} ratio={4.5} draw={drawVerified} />
                </div>
              )}
              {nativeCard && (
                <div style={{ position: 'absolute', left: NATIVE_CONTRACT.x, top: NATIVE_CONTRACT.y, width: NATIVE_CONTRACT.width, height: signed ? 140 : NATIVE_CONTRACT.height, borderRadius: 16, overflow: 'hidden' }}>
                  <Live width={NATIVE_CONTRACT.width} height={signed ? 140 : NATIVE_CONTRACT.height} ratio={4} state={String(signed)} draw={(ctx) => drawNativeContractCard(ctx, signed)} />
                </div>
              )}
              <Glow frame={frame} at={T.stamp + 2} rect={{ x: NATIVE_CONTRACT.x, y: NATIVE_CONTRACT.y, width: NATIVE_CONTRACT.width, height: 140 }} color={TB.green4} radius={16} strength={0.2} dur={30} />
              {/* Лист «Podpis» выезжает снизу; палец выводит подпись. */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 852, background: '#000', opacity: 0.5 * sheetIn }} />
              {sheetIn > 0.002 && (
                <div style={{ position: 'absolute', left: 0, top: fieldTop + (1 - sheetIn) * 540, width: SIGN_SHEET.width, height: SIGN_SHEET.height, borderRadius: 28, boxShadow: '0 -12px 40px rgba(0,0,0,0.5)' }}>
                  <Live width={SIGN_SHEET.width} height={SIGN_SHEET.height} ratio={3.4} state={String(frame >= T.inkEnd)} draw={(ctx) => drawSignSheet(ctx, frame >= T.inkEnd)} />
                  <svg style={{ position: 'absolute', left: SIGN_FIELD.x, top: SIGN_FIELD.y, width: SIGN_FIELD.width, height: SIGN_FIELD.height, overflow: 'visible' }}>
                    <path d={INK} fill="none" stroke="#12141a" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - inkP} opacity={inkP > 0.001 ? 1 : 0} />
                    <path d={FLOURISH} fill="none" stroke="#12141a" strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - flourishP} opacity={flourishP > 0.001 ? 1 : 0} />
                  </svg>
                </div>
              )}
              {fingerOn && <Finger frame={frame} at={finger} trail={[1, 2, 3, 4, 5, 6].map((k) => inkHead(easeInOut(span(frame - k * 1.3, T.ink, T.inkEnd - T.ink))))} />}
              <Tap x={NATIVE_CONTRACT.sign.x + NATIVE_CONTRACT.sign.width / 2} y={NATIVE_CONTRACT.sign.y + NATIVE_CONTRACT.sign.height / 2} at={T.sign} />
              <Tap x={SIGN_SUBMIT.x + SIGN_SUBMIT.width / 2} y={fieldTop + SIGN_SUBMIT.y + SIGN_SUBMIT.height / 2} at={T.submit} />
              {/* Штамп (м-печать): золотой знак с галочкой падает с 150% и встаёт. */}
              {frame >= T.stamp && frame < T.stamp + 60 && (
                <div
                  style={{
                    position: 'absolute',
                    left: NATIVE_CONTRACT.x + NATIVE_CONTRACT.width - 96,
                    top: NATIVE_CONTRACT.y + 44,
                    width: 72,
                    height: 72,
                    transform: `scale(${mix(1.6, 1, clamp01(stamp))}) rotate(${mix(-24, -8, clamp01(stamp))}deg)`,
                    opacity: clamp01(stamp * 2) * (1 - easeIn(span(frame, T.stamp + 44, 14))),
                  }}
                >
                  <Live width={128} height={128} ratio={1.4} draw={drawCheckBadge} style={{ transform: 'scale(0.5625)', transformOrigin: '0 0' }} />
                </div>
              )}
              <Scribble rect={layout.signed} color={TB.green4} width={2} pad={[10, 6]} seed={2} p={easeOut(span(frame, T.stamp + 30, 14))} />
            </>
          }
        >
          {frame < T.link + 60 ? (
            <Live key="docs" width={393} height={852} ratio={3} draw={(ctx) => drawNativeDocs(ctx, 'approved', 0)} />
          ) : (
            <Live key="umowy" width={393} height={852} ratio={3} draw={(ctx) => drawNativeContracts(ctx, false, false)} />
          )}
        </TaxiPhone>

        {/* Лист PDF: выходит из строки договора, встаёт крупно, летит в телефон. */}
        {frame >= T.sheet && frame < T.land + 2 && (
          <div
            style={{
              position: 'absolute',
              left: pp.x - pp.width / 2,
              top: pp.y - pp.height / 2,
              width: pp.width,
              height: pp.height,
              borderRadius: mix(4, 16, pp.morph),
              overflow: 'hidden',
              boxShadow: SHADOW.lifted,
              transform: Math.abs(pp.turn) > 0.05 ? `perspective(1800px) rotateY(${pp.turn}deg)` : undefined,
              opacity: clamp01(pp.out * 3),
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, width: A4.width, height: A4.height, transformOrigin: '0 0', transform: `scale(${pp.width / A4.width}, ${pp.height / A4.height})`, opacity: 1 - pp.morph }}>
              <Live width={A4.width} height={A4.height} ratio={2.6} draw={drawContract} />
            </div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: NATIVE_CONTRACT.width, height: NATIVE_CONTRACT.height, transformOrigin: '0 0', transform: `scale(${pp.width / NATIVE_CONTRACT.width}, ${pp.height / NATIVE_CONTRACT.height})`, opacity: pp.morph }}>
              <Live width={NATIVE_CONTRACT.width} height={NATIVE_CONTRACT.height} ratio={3} draw={(ctx) => drawNativeContractCard(ctx, false)} />
            </div>
          </div>
        )}
        {frame < T.trace + 4 && (
          <div style={{ position: 'absolute', left: head[0] - 9, top: head[1] - 9, width: 18, height: 18, borderRadius: 9, background: '#ffffff', border: `3px solid #CF8A00`, boxSizing: 'border-box', boxShadow: '0 0 0 6px rgba(207, 138, 0, 0.14), 0 2px 6px rgba(15, 23, 42, 0.2)', opacity: linkP(frame) > 0.01 ? 1 : 0 }} />
        )}
      </Camera>

      <Ripple x={rx} y={ry} at={T.click} />
      <Cursor x={cx} y={cy} press={cursorWorld.press} opacity={cursorWorld.opacity} />

      <Callout anchor={buttonAt} box={{ x: inFrame(dialogRight + 60, 540), y: buttonAt[1] - 240, width: 540 }} tag={tag(12, lang)} title={caption(12, lang)} at={T.row + 6} until={T.shrink - 6} />
      <Callout anchor={fieldAt} box={{ x: inFrame(sheetRight + 70, 520), y: fieldAt[1] - 250, width: 520 }} tag={tag(13, lang)} title={caption(13, lang)} at={T.ink + 12} until={T.submit - 2} />
    </AbsoluteFill>
  )
}

/** Палец на телефоне (без курсора): круг касания ведёт линию, за ним — тающий след. */
function Finger({ frame, at, trail }: { frame: number; at: Point; trail: Point[] }) {
  const appear = easeOut(span(frame, T.ink - 3, 4)) * (1 - easeIn(span(frame, T.inkEnd + 6, 6)))
  const r = 20
  return (
    <>
      {trail.map(([x, y], i) => {
        const k = 1 - (i + 1) / (trail.length + 1)
        return <div key={i} style={{ position: 'absolute', left: x - r * k, top: y - r * k, width: r * 2 * k, height: r * 2 * k, borderRadius: '50%', background: `rgba(207, 138, 0, ${0.14 * k * appear})` }} />
      })}
      <div
        style={{
          position: 'absolute',
          left: at[0] - r,
          top: at[1] - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.35)',
          border: '2px solid rgba(207, 138, 0, 0.9)',
          boxSizing: 'border-box',
          opacity: appear,
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.15)',
        }}
      />
    </>
  )
}

/* ── Камера и курсор ── */

const SIGNED_VIEW = fit(phoneRect({ x: 16, y: 60, width: 361, height: 220 }), { max: 2.5, shift: [-260, 0], margin: 70 })

const CAMERA: CameraKey[] = [
  { at: 0, ...DOKUMENTY_VIEW },
  { at: T.link, dur: 16, follow: follow((f) => bezierPoint(LINK, linkP(f)), { zoom: (f) => mix(1.9, 1.15, glide(span(f, T.link, 30))), lag: 5 }) },
  { at: T.trace - 4, dur: 26, ...fit(DIALOG_WORLD, { max: 1.62, shift: [-300, 20], margin: 60 }) },
  { at: T.sheet + 6, dur: 30, ...fit({ x: PAPER.x, y: PAPER.y, width: PAPER.width, height: 450 }, { max: 2.1, margin: 50 }) },
  { at: T.down, dur: 26, ...fit({ x: PAPER.x, y: PAPER.y + 560, width: PAPER.width, height: 282 }, { max: 2.1, margin: 50 }) },
  { at: T.shrink, dur: 22, ...fit(PAPER, { max: 1.1, margin: 60 }) },
  { at: T.flight + 2, dur: 16, follow: follow((f) => [paper(f).x, paper(f).y], { zoom: (f) => mix(1.1, 1.3, glide(span(f, T.flight, 58))), lag: 6 }) },
  { at: T.land - 6, dur: 26, ...fit(phoneRect({ x: 16, y: 60, width: 361, height: 220 }), { max: 2.5, margin: 70 }) },
  { at: T.sheetUp + 2, dur: 24, ...focus(phoneRect({ x: 0, y: 852 - SIGN_SHEET.height, width: SIGN_SHEET.width, height: SIGN_SHEET.height }), { fill: 0.55, tall: 0.9, shift: [-280, 0] }) },
  { at: T.submit + 2, dur: 20, ...SIGNED_VIEW },
]

const CURSOR_KEYS = (() => {
  const [bx, by] = onDesk(CONTRACT_BUTTON.x + CONTRACT_BUTTON.width * 0.5, CONTRACT_BUTTON.y + CONTRACT_BUTTON.height * 0.55)
  return [
    { at: 52, x: bx - 220, y: by + 170 },
    { at: 76, x: bx, y: by },
    { at: 100, x: bx + 60, y: by + 120 },
  ]
})()

/** Вид камеры на конце главы — с него начинается «Auto». */
export const UMOWA_VIEW = SIGNED_VIEW
export const UMOWA_END_CARD = CARD_SLOT
