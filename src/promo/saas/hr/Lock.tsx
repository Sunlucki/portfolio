import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted } from '../kit/painted'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { Handset, SCREEN, centerOf, phoneRect, type PhoneSpot } from './parts'
import { IOS, LIVE_ACTIVITY, MONO, caption, drawLockScreen, tag, useLive } from './twins'

/* 08 · 02 Wejście · Czas pracy na ekranie blokady (17 долей). Телефон, что
   погас после отметки, просыпается на экране блокировки: Live Activity
   «Jesteś w pracy», объект, таймер от отметки и «do 15:00» (ShiftLiveActivity).
   Камера подъезжает к Live Activity — таймер идёт, — затем к островку: он
   раскрывается в компактную активность со значком часов и тем же таймером.

   0–14     экран просыпается
   14–40    наезд на Live Activity ×3,2; 44–150 выноска, 52 — подчёркивание
   150–176  к островку; 150–168 островок раскрывается
   176–226  таймер в островке
   226–255  отъезд к телефону целиком — дальше стопка экранов (П8) */

export const LOCK_BEATS = 17

const PHONE: PhoneSpot = { x: 960 - SCREEN.width / 2, y: 540 - SCREEN.height / 2, scale: 1 }
const LA = phoneRect(PHONE, LIVE_ACTIVITY)
const ISLAND = phoneRect(PHONE, { x: 196.5 - 118, y: 17.5, width: 236, height: 33 })
const TIMER = phoneRect(PHONE, { x: LIVE_ACTIVITY.x + LIVE_ACTIVITY.width - 16 - 96, y: LIVE_ACTIVITY.y + 30, width: 96, height: 24 })

const E = { wake: 0, island: 150, back: 226 }

/** Секунд на таймере: отметка в 07:00, сейчас 07:05:12, дальше — от кадра. */
export const lockElapsed = (frame: number) => 5 * 60 + 12 + Math.floor(frame / 30)

export const lockState = (frame: number, lang: Lang) => ({ time: '07:05', date: pick(lang, 'niedziela, 27 września', 'Sunday, 27 September'), elapsed: lockElapsed(frame), until: '15:00', island: false })

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 14, dur: 26, ...focus(LA, { fill: 0.6, shift: [-230, 40] }) },
  { at: E.island, dur: 26, ...focus(ISLAND, { fill: 0.42, shift: [0, -230] }) },
  { at: E.back, dur: 28, x: 960, y: 540, zoom: 1 },
]

const clock = (seconds: number) => `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export function Lock() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const state = lockState(frame, lang)
  const screen = useLive(SCREEN.width, SCREEN.height, 3.5, (c) => drawLockScreen(c, state), JSON.stringify(state))
  const camera = viewAt(CAMERA, frame)
  const wake = easeOut(span(frame, E.wake, 14))
  /* Островок раскрывается к таймеру и сворачивается на отъезде: на стыке со
     стопкой экранов (следующая сцена) он снова обычный. */
  const open = spring(frame, E.island, SPRINGS.glide) * (1 - glide(span(frame, E.back + 4, 14)))
  const islandWidth = mix(104, 236, clamp01(open))
  const content = easeOut(span(frame, E.island + 8, 10)) * (1 - easeIn(span(frame, E.back + 2, 6)))

  const timerAnchor = camera.project(TIMER.x + TIMER.width * 0.35, TIMER.y + TIMER.height * 0.5)
  const boxX = camera.project(LA.x + LA.width, 0)[0] + 60

  /* Звук: экран просыпается с Live Activity «Jesteś w pracy» (уведомление);
     таймер тихо отщёлкивает секунды; островок раскрывается и сворачивается. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  useSoundCue('notify', 4, at(...centerOf(LA)), { gain: 0.7 })
  useSoundCues('tick', [60, 90, 120], at(...centerOf(TIMER)), { gain: 0.3 })
  useSoundCue('popIn', E.island, at(...centerOf(ISLAND)), { gain: 0.6 })
  useSoundCues('tick', [180, 210], at(...centerOf(ISLAND)), { gain: 0.3 })
  useSoundCue('popOut', E.back + 4, at(...centerOf(ISLAND)), { gain: 0.4 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Handset spot={PHONE}>
          <Painted source={screen} style={{ inset: 0 }} />
          {/* Островок раскрывается в компактную Live Activity: значок часов и
              тот же таймер (ShiftLiveActivity, compactLeading / compactTrailing). */}
          {open > 0.001 && (
            <div style={{ position: 'absolute', left: SCREEN.width / 2 - islandWidth / 2, top: 17.5, width: islandWidth, height: 33, borderRadius: 16.5, background: '#000000' }}>
              <div style={{ position: 'absolute', left: 8, top: 8.5, opacity: content }}>
                <svg width={16} height={16} viewBox="-12 -12 24 24">
                  <circle r={11} fill={IOS.success} />
                  <path d="M0 -6.5 L0 0 L4.5 3" fill="none" stroke="#000000" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ position: 'absolute', right: 14, top: 8, fontFamily: MONO, fontSize: 13, fontWeight: 600, color: '#ffffff', opacity: content, lineHeight: '17px' }}>{clock(state.elapsed)}</div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: '#000000', opacity: 1 - wake }} />
        </Handset>
        <Scribble rect={TIMER} kind="underline" p={easeOut(span(frame, 52, 16)) * (1 - easeIn(span(frame, E.island - 6, 8)))} width={2.4} />
        {/* Островок — обводкой, когда раскрылся: подпись станции уже прочитана. */}
        <Scribble rect={{ x: ISLAND.x + (ISLAND.width - islandWidth) / 2, y: ISLAND.y, width: islandWidth, height: ISLAND.height }} p={easeOut(span(frame, E.island + 22, 16)) * (1 - easeIn(span(frame, E.back, 8)))} pad={[10, 7]} seed={8} width={1.6} />
      </Camera>
      <Callout anchor={timerAnchor} box={{ x: boxX, y: timerAnchor[1] - 250, width: 450 }} tag={tag(8, lang)} title={caption(8, lang)} at={44} until={150} />
    </AbsoluteFill>
  )
}
