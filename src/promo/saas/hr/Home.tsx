import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeOut, glide, span, spring } from '../kit/motion'
import { Painted } from '../kit/painted'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { FONT, MUTED, SHADOW, useAccent } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { Handset, SCREEN, centerOf, phonePt, phoneRect, type PhoneSpot } from './parts'
import { caption, drawWorkerHome, sheet, tag, useSheets, type Lang } from './twins'

/* 05 · 01 Start · Главная на языке работника (18 долей). Тот же телефон, что
   в конце входа: главная работника «Dzień dobry 👋 Jan Kowalski». Камера
   подъезжает к верхней половине экрана, экран отрывается от корпуса (м-отрыв)
   и трижды переворачивается как карточка (П15): PL → UA → RU → EN — та же
   главная на украинском, русском и английском (словарь translations.ts). Слева
   сменяется код языка и его имя из переключателя языка продукта. Уход —
   каруселью влево (П7), справа въезжает центр QR.

   0–30     наезд на верх экрана ×2,1
   34–46    экран отрывается от корпуса
   50, 110, 170  перевороты (по 18 кадров, pop), между ними — чтение
   60–236   выноска «Ekran w języku pracownika.»
   232–250  экран ложится обратно
   270–300  уход каруселью влево (в хвосте сцены, под входом центра QR) */

export const HOME_BEATS = 18

/** Телефон — там же в кадре, где его оставила сцена входа (центр кадра, ×1). */
const PHONE: PhoneSpot = { x: 960 - SCREEN.width / 2, y: 540 - SCREEN.height / 2, scale: 1 }
const SCREEN_RECT = phoneRect(PHONE, { x: 0, y: 0, ...SCREEN })

const LANGS: { code: Lang; name: string }[] = [
  { code: 'PL', name: 'Polski' },
  { code: 'UA', name: 'Українська' },
  { code: 'RU', name: 'Русский' },
  { code: 'EN', name: 'English' },
]
const FLIPS = [50, 110, 170]
const LIFT = 34
const SETTLE = 232
export const HOME_LEAVE = 270

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 4, dur: 30, ...fit(phoneRect(PHONE, { x: 0, y: 56, width: SCREEN.width, height: 412 }), { max: 2.1 }) },
]

export function Home() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const accent = useAccent()
  const twins = useSheets(() => ({ faces: LANGS.map(({ code }) => sheet(SCREEN.width, SCREEN.height, 3, (c) => drawWorkerHome(c, code, '06:06'))) }))
  const camera = viewAt(CAMERA, frame)
  const lift = spring(frame, LIFT, SPRINGS.glide) * (1 - glide(span(frame, SETTLE, 18)))
  const turns = FLIPS.map((at) => spring(frame, at, SPRINGS.pop))
  const angle = 180 * turns.reduce((sum, t) => sum + t, 0)
  const face = Math.max(0, Math.min(LANGS.length - 1, Math.floor((angle + 90) / 180)))
  const local = angle - 180 * face
  const leave = glide(span(frame, HOME_LEAVE, 30))

  /* Код языка: сменяется, когда экран проходит ребро (барабан вверх). */
  const code = (i: number) => {
    const at = i === 0 ? -Infinity : (FLIPS[i - 1] ?? 0) + 5
    const next = i + 1 < LANGS.length ? (FLIPS[i] ?? Infinity) + 5 : Infinity
    const enter = i === 0 ? easeOut(span(frame, 24, 12)) : spring(frame, at, SPRINGS.pop)
    const exit = easeIn(span(frame, next, 7))
    return { enter, exit }
  }
  const greeting = camera.project(...phonePt(PHONE, 150, 150))
  const boxX = camera.project(SCREEN_RECT.x + SCREEN_RECT.width, 0)[0] + 56
  const labelRight = camera.project(SCREEN_RECT.x, 0)[0] - 90

  /* Звук: экран отрывается от корпуса; три переворота PL → UA → RU → EN, код
     языка слева щёлкает на каждом; экран ложится обратно. */
  const [sx, sy] = camera.project(...centerOf(SCREEN_RECT))
  const label = { x: labelRight - 110, y: 420 }
  useSoundCue('popIn', 24, label, { gain: 0.45 })
  useSoundCue('air', LIFT, { x: sx, y: sy }, { gain: 0.4, seconds: 0.5 })
  useSoundCues('flip', FLIPS, { x: sx, y: sy }, { gain: 0.8 })
  useSoundCues('tick', FLIPS.map((at) => at + 5), label, { gain: 0.45 })
  useSoundCue('thump', SETTLE + 14, { x: sx, y: sy }, { gain: 0.35 })

  return (
    <AbsoluteFill>
      <Swing t={-leave}>
        <Camera view={camera}>
          <Handset spot={PHONE}>
            {/* Один холст — в одном месте: пока экран-плита оторвана, в корпусе
                пусто (чёрный экран), холст живёт в плите. */}
            {lift <= 0.02 && <Painted source={twins.faces[face] ?? null} style={{ inset: 0 }} />}
          </Handset>
          {/* Экран-плита: отрывается от корпуса и переворачивается. */}
          {lift > 0.02 && (
            <div style={{ position: 'absolute', left: SCREEN_RECT.x, top: SCREEN_RECT.y, width: SCREEN_RECT.width, height: SCREEN_RECT.height, perspective: 2400 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 52,
                  overflow: 'hidden',
                  transform: `scale(${1 + 0.04 * lift}) rotateY(${local}deg)`,
                  boxShadow: `${SHADOW.lifted}`,
                  background: '#ffffff',
                }}
              >
                <Painted source={twins.faces[face] ?? null} style={{ inset: 0 }} />
              </div>
            </div>
          )}
          <Scribble rect={phoneRect(PHONE, { x: 16, y: 128, width: 196, height: 60 })} p={easeOut(span(frame, 62, 16)) * (1 - easeIn(span(frame, SETTLE, 8))) * (1 - Math.max(...turns.map((t) => Math.sin(Math.PI * clamp01(t)))))} pad={[16, 12]} seed={4} width={2.4} />
        </Camera>
        {/* Код и имя языка — слева от телефона, в кадре. */}
        <div style={{ position: 'absolute', right: 1920 - labelRight, top: 330, textAlign: 'right', fontFamily: FONT }}>
          {LANGS.map((lang, i) => {
            const { enter, exit } = code(i)
            if (enter <= 0.001 || exit >= 0.999) return null
            return (
              <div key={lang.code} style={{ position: 'absolute', right: 0, top: 0, whiteSpace: 'nowrap' }}>
                <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
                  <div style={{ fontSize: 170, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: accent, transform: `translateY(${(1 - clamp01(enter)) * 100 - exit * 100}%)`, opacity: clamp01(enter * 1.4) * (1 - exit) }}>{lang.code}</div>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ marginTop: 6, fontSize: 40, fontWeight: 650, letterSpacing: '-0.015em', color: MUTED, transform: `translateY(${(1 - clamp01(enter)) * 100 - exit * 100}%)`, opacity: clamp01(enter * 1.4) * (1 - exit) }}>{lang.name}</div>
                </div>
              </div>
            )
          })}
        </div>
        <Callout anchor={greeting} box={lang === 'en' ? { x: boxX - 20, y: greeting[1] + 60, width: 470 } : { x: boxX, y: greeting[1] + 60, width: 430 }} tag={tag(5, lang)} title={caption(5, lang)} at={62} until={236} />
      </Swing>
    </AbsoluteFill>
  )
}
