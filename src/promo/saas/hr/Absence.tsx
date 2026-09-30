import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Tap } from '../kit/pointer'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { SHADOW, type Rect } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { Glyph, Handset, SCREEN, centerOf, phonePt, phoneRect, type PhoneSpot } from './parts'
import { ABSENCE_CARD, ABSENCE_OPTIONS, ABSENCE_SEND, IA, caption, drawAbsence, drawAbsenceOptions, drawMessages, sheet, tag, useLive, useSheets, type AbsenceStage } from './twins'

/* 17 · 06 Zawsze pod ręką · Nieobecność w trzech dotknięciach (22 доли).
   Телефон встаёт, пока окно выгрузки складывается. «Wiadomości» (сайт в
   Safari): касание 1 — «Zgłoś nieobecność», экран формы въезжает справа, как
   в браузере. Список причин отрывается от экрана (П4) и встаёт крупно —
   читается; касание 2 — «Problem z transportem». Список возвращается,
   касание 3 — «Wyślij zgłoszenie»: «Nieobecność zgłoszona / Twój koordynator
   został powiadomiony», галочка прорисовывается. Из телефона вылетает конверт
   — к координатору, за кадр. Уход — каруселью влево.

   0–26     телефон встаёт; 26–50 наезд на «Wiadomości»
   56       касание 1; 58–76 форма въезжает
   78–104   список причин отрывается ×1,6; 100–196 — читается
   156      касание 2 — «Problem z transportem»
   196–220  список возвращается; 232 — касание 3; 234–248 отправка
   248      «Nieobecność zgłoszona»; 270–330 крупно; 268 — конверт
   270–328  выноска «Nieobecność zgłoszona w trzech dotknięciach.»
   330–360  уход каруселью влево */

export const ABSENCE_BEATS = 22

const PHONE: PhoneSpot = { x: 960 - SCREEN.width / 2, y: 540 - SCREEN.height / 2, scale: 1 }
const E = { rise: 0, tap1: 56, push: 58, lift: 78, tap2: 156, back: 196, tap3: 232, done: 248, envelope: 268, leave: 330 }

const TILE_SCALE = 1.6
const TILE_REST = phoneRect(PHONE, ABSENCE_OPTIONS)
const TILE_UP: Rect = { x: PHONE.x - 40 - ABSENCE_OPTIONS.width * TILE_SCALE, y: 540 - (ABSENCE_OPTIONS.height * TILE_SCALE) / 2, width: ABSENCE_OPTIONS.width * TILE_SCALE, height: ABSENCE_OPTIONS.height * TILE_SCALE }
const DONE_BLOCK = phoneRect(PHONE, { x: 40, y: 286, width: 313, height: 234 })

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 26, dur: 24, ...fit(phoneRect(PHONE, { x: 0, y: 118, width: SCREEN.width, height: 330 }), { max: 2.2 }) },
  { at: E.lift + 2, dur: 26, ...focus(TILE_UP, { fill: 0.5, shift: [120, 0] }) },
  { at: E.back, dur: 24, ...fit(phoneRect(PHONE, { x: 0, y: 150, width: SCREEN.width, height: 430 }), { max: 2 }) },
  { at: E.done, dur: 22, ...focus(DONE_BLOCK, { fill: 0.4, shift: [-250, 0] }) },
]

function absenceStage(frame: number): AbsenceStage {
  if (frame < E.tap2 + 2) return 'form'
  if (frame < E.tap3 + 2) return 'selected'
  return 'sending'
}

export function Absence() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const twins = useSheets(() => ({
    messages: sheet(SCREEN.width, SCREEN.height, 3, drawMessages),
    done: sheet(SCREEN.width, SCREEN.height, 3, (c) => drawAbsence(c, 'done')),
  }))
  const stage = absenceStage(frame)
  const form = useLive(SCREEN.width, SCREEN.height, 3, (c) => drawAbsence(c, stage, false), stage)
  const selected = frame >= E.tap2 + 2
  const tile = useLive(ABSENCE_OPTIONS.width, ABSENCE_OPTIONS.height, 4, (c) => drawAbsenceOptions(c, selected), String(selected))

  const camera = viewAt(CAMERA, frame)
  const rise = spring(frame, E.rise, SPRINGS.heavy)
  const push = easeInOut(span(frame, E.push, 18))
  const lift = spring(frame, E.lift, SPRINGS.heavy) * (1 - glide(span(frame, E.back, 22)))
  const done = easeOut(span(frame, E.done, 5))
  const check = easeOut(span(frame, E.done + 4, 16))
  const leave = glide(span(frame, E.leave, 30))

  const tileRect: Rect = { x: mix(TILE_REST.x, TILE_UP.x, lift), y: mix(TILE_REST.y, TILE_UP.y, lift), width: mix(TILE_REST.width, TILE_UP.width, lift), height: mix(TILE_REST.height, TILE_UP.height, lift) }
  const tileShown = frame >= E.lift - 1 && frame < E.back + 24
  /* Касание 2 — по первой причине на крупном списке. */
  const [t2x, t2y] = [TILE_UP.x + 150 * TILE_SCALE, TILE_UP.y + 40 * TILE_SCALE]

  /* Конверт: вылетает из телефона вверх-вправо, за кадр (к координатору). */
  const env = easeIn(span(frame, E.envelope, 34))
  const envFrom = phonePt(PHONE, 196.5, 330)
  const envX = envFrom[0] + env * 900
  const envY = envFrom[1] - Math.sin(env * Math.PI * 0.5) * 700

  /* Точка — на конце строки «Nieobecność zgłoszona»; английская строка короче. */
  const doneX = lang === 'en' ? 196.5 + textWidth('Absence reported', 20, 700) / 2 - 11 : 300
  const doneAnchor = camera.project(...phonePt(PHONE, doneX, 392))
  const doneRight = camera.project(DONE_BLOCK.x + DONE_BLOCK.width, 0)[0]

  /* Звук: телефон встаёт; форма въезжает справа, как в браузере; список
     причин отрывается от экрана и возвращается; «Nieobecność zgłoszona» —
     успех; конверт улетает к координатору. Касания и уход — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  useSoundCue('whoosh', E.rise, at(960, 540 + (1 - rise) * 760), { gain: 0.5, seconds: 0.6 })
  useSoundCue('air', E.push, at(960, 540), { gain: 0.35, seconds: 0.5 })
  useSoundCue('popIn', E.lift, at(...centerOf(tileRect)), { gain: 0.7 })
  useSoundCue('popOut', E.back, at(...centerOf(tileRect)), { gain: 0.4 })
  useSoundCue('success', E.done, at(...centerOf(DONE_BLOCK)), { gain: 0.9 })
  useSoundTrack('hr2d-envelope', 'whoosh', frame >= E.envelope && env < 1, at(envX, envY), { gain: 0.6 })

  return (
    <AbsoluteFill>
      <Swing t={-leave}>
        <Camera view={camera}>
          <Handset spot={PHONE} screen={IA.gray50} style={{ transform: `translateY(${(1 - rise) * 760}px)` }}>
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-push * 30}%)` }}>
              <Painted source={twins.messages} style={{ inset: 0 }} />
            </div>
            {frame >= E.push && (
              <div style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - push) * 100}%)`, boxShadow: '-12px 0 30px rgba(15, 23, 42, 0.12)' }}>
                <Painted source={form} style={{ inset: 0 }} />
                {!tileShown && (
                  <div style={{ position: 'absolute', left: ABSENCE_OPTIONS.x, top: ABSENCE_OPTIONS.y, width: ABSENCE_OPTIONS.width, height: ABSENCE_OPTIONS.height }}>
                    <Painted source={tile} style={{ inset: 0 }} />
                  </div>
                )}
              </div>
            )}
            {frame >= E.done && (
              <div style={{ position: 'absolute', inset: 0, opacity: done }}>
                <Painted source={twins.done} style={{ inset: 0 }} />
                {/* Галочка прорисовывается поверх нарисованной (м-галочка). */}
                <div style={{ position: 'absolute', left: 196.5 - 32, top: 330 - 32, width: 64, height: 64, borderRadius: 32, background: IA.green100, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.6, 1, spring(frame, E.done, SPRINGS.pop))})` }}>
                  <Glyph name="circleCheckBig" size={34} color={IA.green600} stroke={2} p={check} />
                </div>
              </div>
            )}
          </Handset>
          {tileShown && (
            <div style={{ position: 'absolute', left: tileRect.x, top: tileRect.y, width: tileRect.width, height: tileRect.height, filter: lift > 0.02 ? 'drop-shadow(0 24px 40px rgba(15, 23, 42, 0.18))' : undefined }}>
              <Painted source={tile} style={{ inset: 0 }} />
            </div>
          )}
          <Tap x={phonePt(PHONE, 196.5, ABSENCE_CARD.y + ABSENCE_CARD.height / 2)[0]} y={phonePt(PHONE, 196.5, ABSENCE_CARD.y + ABSENCE_CARD.height / 2)[1]} at={E.tap1} scale={PHONE.scale} />
          <Tap x={t2x} y={t2y} at={E.tap2} scale={PHONE.scale * TILE_SCALE} />
          <Tap x={phonePt(PHONE, 196.5, ABSENCE_SEND.y + ABSENCE_SEND.height / 2)[0]} y={phonePt(PHONE, 196.5, ABSENCE_SEND.y + ABSENCE_SEND.height / 2)[1]} at={E.tap3} scale={PHONE.scale} />
          {frame >= E.envelope && env < 1 && (
            <div style={{ position: 'absolute', left: envX - 44, top: envY - 32, width: 88, height: 64, borderRadius: 14, background: '#ffffff', boxShadow: SHADOW.lifted, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${-12 * env}deg) scale(${mix(0.7, 1.1, clamp01(env * 3))})`, opacity: clamp01((1 - env) * 4) }}>
              <Glyph name="mail" size={40} color={IA.primary} stroke={1.8} p={easeOut(span(frame, E.envelope, 12))} />
            </div>
          )}
        </Camera>
        <Callout anchor={doneAnchor} box={{ x: doneRight + 70, y: doneAnchor[1] - 250, width: 480 }} tag={tag(17, lang)} title={caption(17, lang)} at={270} until={328} />
      </Swing>
    </AbsoluteFill>
  )
}
