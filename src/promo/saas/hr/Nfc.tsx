import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { Painted } from '../kit/painted'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { Handset, Pulse, SCREEN, centerOf, phonePt, phoneRect, type PhoneSpot } from './parts'
import { IA, IOS, WIDGET, caption, drawHomeScreen, drawNfc, drawNfcCard, drawWidget, sheet, tag, useLive, useSheets } from './twins'

/* 18 · 06 Zawsze pod ręką · Karta NFC i widżet (22 доли). Слева — телефон
   бригадира, «Karta NFC»: «Przyłóż kartę do telefonu» (NfcCheckInView). Белая
   карта подлетает к телефону — волна, телефон вздрагивает, «Siarhei Kazlou ·
   Wejście zarejestrowane» — крупно. Справа — домашний экран с виджетом
   «Jesteś w pracy»: виджет отходит плиткой (П4), таймер идёт. Дальше —
   шторка-предмет (П12): её рисует следующая сцена, поверх этой.

   0–30     вход каруселью справа; 30–54 наезд на экран NFC
   52–88    карта подлетает; 88 — касание: волна, «Wejście zarejestrowane»
   100–124  к строке результата ×2,6; 124–214 выноска «Bez smartfona? Karta NFC.»
   214–240  к правому телефону; 240–264 виджет отходит ×1,3; 264–330 таймер */

export const NFC_BEATS = 22

const LEFT: PhoneSpot = { x: 340, y: 114, scale: 1 }
const RIGHT: PhoneSpot = { x: 1190, y: 114, scale: 1 }
const E = { card: 52, touch: 88, result: 100, right: 214, widget: 240 }

const NFC_CARD = { width: 340, height: 214 }
const RESULT = phoneRect(LEFT, { x: 16, y: 426, width: 361, height: 76 })
const WIDGET_REST = phoneRect(RIGHT, WIDGET)
const WIDGET_LIFT = 1.3
const WIDGET_UP: Rect = { x: WIDGET_REST.x - (WIDGET_REST.width * (WIDGET_LIFT - 1)) / 2, y: WIDGET_REST.y + 60, width: WIDGET_REST.width * WIDGET_LIFT, height: WIDGET_REST.height * WIDGET_LIFT }
const TOUCH = phonePt(LEFT, 250, 150)

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 30, dur: 24, ...fit(phoneRect(LEFT, { x: 0, y: 40, width: SCREEN.width, height: 480 }), { max: 1.9 }) },
  { at: E.result, dur: 24, ...focus(RESULT, { fill: 0.5, shift: [-260, 0] }) },
  { at: E.right, dur: 26, ...fit(phoneRect(RIGHT, { x: 0, y: 0, ...SCREEN }), { max: 1.1 }) },
  { at: E.widget + 2, dur: 24, ...focus(WIDGET_UP, { fill: 0.5 }) },
]

/** Таймер виджета: вечерняя смена с 14:00, на экране 19:15. */
const widgetElapsed = (frame: number) => 5 * 3600 + 15 * 60 + 4 + Math.floor(frame / 30)

export function Nfc() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const twins = useSheets(() => ({
    card: sheet(NFC_CARD.width, NFC_CARD.height, 3, (c) => drawNfcCard(c, NFC_CARD.width, NFC_CARD.height)),
    home: sheet(SCREEN.width, SCREEN.height, 3, drawHomeScreen),
  }))
  const stage = frame < E.touch ? 'ready' : 'done'
  const nfc = useLive(SCREEN.width, SCREEN.height, 3, (c) => drawNfc(c, stage), stage)
  const elapsed = widgetElapsed(frame)
  const widget = useLive(WIDGET.width, WIDGET.height, 4, (c) => drawWidget(c, elapsed), elapsed)

  const camera = viewAt(CAMERA, frame)
  const enter = spring(frame, 0, SPRINGS.heavy)
  const fly = easeOut(span(frame, E.card, E.touch - E.card))
  const away = easeInOut(span(frame, E.touch + 10, 22))
  const shake = frame >= E.touch && frame < E.touch + 10 ? Math.sin((frame - E.touch) * 2.2) * 5 * (1 - (frame - E.touch) / 10) : 0
  const result = spring(frame, E.touch + 2, SPRINGS.pop)
  const lift = spring(frame, E.widget, SPRINGS.heavy)

  /* Карта: снизу слева к верху телефона, с наклоном; после касания — назад. */
  const cardFrom: [number, number] = [LEFT.x - 380, 1180]
  const cardAt: [number, number] = [TOUCH[0] - 40, TOUCH[1] - 30]
  const cardX = mix(mix(cardFrom[0], cardAt[0], fly), cardFrom[0] - 200, away)
  const cardY = mix(mix(cardFrom[1], cardAt[1], fly), cardFrom[1] + 200, away)
  const cardScale = 1.25

  const resultAnchor = camera.project(...phonePt(LEFT, 250, 470))
  const resultRight = camera.project(RESULT.x + RESULT.width, 0)[0]
  const widgetRect: Rect = { x: mix(WIDGET_REST.x, WIDGET_UP.x, lift), y: mix(WIDGET_REST.y, WIDGET_UP.y, lift), width: mix(WIDGET_REST.width, WIDGET_UP.width, lift), height: mix(WIDGET_REST.height, WIDGET_UP.height, lift) }

  /* Звук: белая карта подлетает; касание NFC — блик считывания, «Wejście
     zarejestrowane» — успех; виджет «Jesteś w pracy» отходит плиткой, таймер
     щёлкает секундами. Вход и камера — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const widgetAt = at(...centerOf(widgetRect))
  useSoundTrack('hr2d-nfc-card', 'whoosh', frame >= E.card && frame <= E.touch, at(cardX, cardY), { gain: 0.5 })
  useSoundCue('glint', E.touch, at(...TOUCH), { gain: 0.7, seconds: 0.5 })
  useSoundCue('success', E.touch + 3, at(...centerOf(RESULT)), { gain: 0.9 })
  useSoundCue('whoosh', E.widget, widgetAt, { gain: 0.45, seconds: 0.4 })
  useSoundCues('tick', [270, 300], widgetAt, { gain: 0.3 })

  return (
    <AbsoluteFill>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          <Handset spot={LEFT} screen={IOS.bg} style={{ transform: `translateX(${shake}px)` }}>
            <Painted source={nfc} style={{ inset: 0 }} />
            {frame >= E.touch && (
              <div style={{ position: 'absolute', left: 16, top: 426, width: 361, height: 76, borderRadius: 16, boxShadow: `0 0 0 ${4 * (1 - clamp01(result))}px ${tint(IOS.success, 0.5)}`, transform: `scale(${mix(0.94, 1, clamp01(result))})`, opacity: clamp01(result * 1.4) }} />
            )}
          </Handset>
          <Handset spot={RIGHT} screen="#3d3392">
            <Painted source={twins.home} style={{ inset: 0 }} />
            {lift < 0.02 && (
              <div style={{ position: 'absolute', left: WIDGET.x, top: WIDGET.y, width: WIDGET.width, height: WIDGET.height }}>
                <Painted source={widget} style={{ inset: 0 }} />
              </div>
            )}
          </Handset>
          {lift >= 0.02 && (
            <div style={{ position: 'absolute', left: widgetRect.x, top: widgetRect.y, width: widgetRect.width, height: widgetRect.height, borderRadius: 22 * WIDGET_LIFT, boxShadow: SHADOW.lifted }}>
              <Painted source={widget} style={{ inset: 0 }} />
            </div>
          )}
          <Pulse x={TOUCH[0]} y={TOUCH[1]} at={E.touch} until={E.touch + 36} radius={170} color={tint(IA.primary400, 0.9)} rings={3} period={24} width={3} />
          {frame >= E.card - 1 && away < 1 && (
            <div style={{ position: 'absolute', left: cardX - (NFC_CARD.width * cardScale) / 2, top: cardY - (NFC_CARD.height * cardScale) / 2, width: NFC_CARD.width * cardScale, height: NFC_CARD.height * cardScale, borderRadius: 21 * cardScale, boxShadow: SHADOW.lifted, transform: `rotate(${mix(-24, -12, fly)}deg)`, opacity: easeOut(span(frame, E.card - 1, 6)) * (1 - easeIn(span(frame, E.touch + 20, 12))) }}>
              <Painted source={twins.card} style={{ inset: 0 }} />
            </div>
          )}
          <Scribble rect={phoneRect(LEFT, { x: 78, y: 444, width: 220, height: 44 })} p={easeOut(span(frame, 132, 16)) * (1 - easeIn(span(frame, E.right - 4, 8)))} pad={[16, 10]} seed={18} width={2.2} />
        </Camera>
        <Callout anchor={resultAnchor} box={{ x: resultRight + 60, y: resultAnchor[1] - 250, width: lang === 'en' ? 400 : 440 }} tag={tag(18, lang)} title={caption(18, lang)} at={124} until={212} />
      </Swing>
    </AbsoluteFill>
  )
}
