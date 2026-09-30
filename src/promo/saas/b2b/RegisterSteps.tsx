import { AbsoluteFill, interpolateColors, useCurrentFrame } from 'remotion'
import { Camera, fit, viewAt, type CameraKey } from '../kit/camera'
import { SPRINGS, clamp01, easeIn, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { SHADOW } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { useLang } from '../kit/lang'
import { S, at, mid, world, xy } from './layout'
import { STEP_END_VIEW } from './RegisterNip'
import { APPLICATION, ApplicationCard } from './screens/Admin'
import { CompanyFields, PRIMARY_EN, RegBackground, RegStep2Frame, RegStep3, RegStep4, RegTrail, STEP2, SUCCESS, primaryRect } from './screens/Registration'
import { L, Sheet } from './twin'
import { ScreenWindow } from './Window'

/* 04 · 01 Rejestracja · Шаги 2–4 и отправка (16 долей). Блок «Dane firmy»
   отрывается от страницы оранжевой плитой (м-отрыв), переворачивается — на
   обороте заявка контрагента, какой её увидит продавец, — и улетает вправо: в
   сцене 06 она влетит слева в панель «Kontrahenci B2B». «POTWIERDZAM DANE»,
   шаги 3 и 4 проходят быстро (контакт, телефон, e-mail, RODO), «ZAREJESTRUJ
   SIĘ» — кнопка становится белым диском экрана успеха (П1).

   0–10     камера стоит на шаге 2 (как в конце прошлой сцены)
   10–34    блок полей отрывается плитой, тень растёт
   30–56    плита переворачивается: заявка «Oczekuje na decyzję»
   56–84    плита улетает вправо за кадр
   60–84    камера отъезжает на весь шаг с кнопками
   96       клик «POTWIERDZAM DANE»; 98–116 шаг 3, «Anna» печатается
   128      «DALEJ»; 130–148 шаг 4, поля заполняются; 168 — галочка RODO
   188      «ZAREJESTRUJ SIĘ»; 190–204 крутится Loader2
   204–236  кнопка растёт в белый диск и садится в круг успеха */

const T0 = { lift: 10, flip: 30, fly: 56, confirm: 96, step3: 98, next: 128, step4: 130, gdpr: 168, submit: 188, disc: 204 }

/** Плита «Dane firmy»: оранжевая подложка вокруг полей (поля — с отступом 14). */
const PLATE = { x: STEP2.block.x - 14, y: STEP2.block.y - 14, w: 704, h: 258 }
const PLATE_WORLD = world(PLATE)

const WHOLE = world({ x: 176, y: 120, w: 672, h: 520 })

const CAMERA: CameraKey[] = [
  { at: 0, ...STEP_END_VIEW },
  { at: 60, dur: 26, ...fit(WHOLE, { max: 1.2, shift: [0, 0] }) },
]

const confirmRect = world(primaryRect('POTWIERDZAM DANE', STEP2.controls))
const nextRect = world(primaryRect('DALEJ', STEP2.controls))
const submitRect = world(primaryRect('ZAREJESTRUJ SIĘ', STEP2.controls + 16))
const gdprRect = world({ x: 176, y: 238 + 274, w: 22, h: 22 })
const c = (r: { x: number; y: number; width: number; height: number }, fx = 0.55, fy = 0.55) => ({ x: r.x + r.width * fx, y: r.y + r.height * fy })

const CURSOR = [
  { at: 70, x: confirmRect.x + confirmRect.width + 160, y: confirmRect.y + 220 },
  { at: T0.confirm - 4, ...c(confirmRect) },
  { at: T0.next - 4, ...c(nextRect) },
  { at: T0.gdpr - 4, ...c(gdprRect, 0.5, 0.5) },
  { at: T0.submit - 4, ...c(submitRect) },
  { at: T0.submit + 26, x: submitRect.x + submitRect.width + 120, y: submitRect.y + 200 },
]
const CLICKS = [T0.confirm, T0.next, T0.gdpr, T0.submit]

export function RegisterSteps() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.submit + 22)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const press = (at: number) => 1 - 0.05 * clamp01(1 - Math.abs(frame - at) / 3)

  /* Плита: отрыв, переворот, отлёт. */
  const lift = spring(frame, T0.lift, SPRINGS.heavy)
  const turn = spring(frame, T0.flip, SPRINGS.heavy)
  const fly = easeIn(span(frame, T0.fly, 28))
  const plateScale = mix(1, 1.05, clamp01(lift)) * mix(1, 0.7, fly)

  /* Страница: шаг 2 → 3 → 4 (сдвиг и проявление). */
  /* Шаги сменяются по очереди: старый уходит влево за 8 кадров, новый
     въезжает справа — без наложения двух форм. */
  const out2 = easeIn(span(frame, T0.step3 - 2, 8))
  const in3 = glide(span(frame, T0.step3 + 5, 14))
  const out3 = easeIn(span(frame, T0.step4 - 2, 8))
  const in4 = glide(span(frame, T0.step4 + 5, 14))
  const to3 = in3
  const to4 = in4
  const disc = glide(span(frame, T0.disc, 30))
  const busy = frame >= T0.submit && frame < T0.disc

  /* Диск: из кнопки «ZAREJESTRUJ SIĘ» в круг успеха (П1); у английской
     «REGISTER» своя ширина — диск берёт её. */
  const from = primaryRect(lang === 'en' ? PRIMARY_EN['ZAREJESTRUJ SIĘ']! : 'ZAREJESTRUJ SIĘ', STEP2.controls + 16)
  const circle = SUCCESS.circle
  const dx = mix(from.x, circle.x - circle.r, disc)
  const dy = mix(from.y, circle.y - circle.r, disc)
  const dw = mix(from.w, circle.r * 2, disc)
  const dh = mix(from.h, circle.r * 2, disc)

  /* Звук (клики, переворот плиты — у набора): плита «Dane firmy» отрывается и
     улетает вправо; шаги 3 и 4 печатаются (не чаще ~15 знаков в секунду),
     галочка RODO; кнопка летит белым диском в круг успеха. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const onPage = (x: number, y: number) => point(...at(x, y))
  const plateMid = mid(PLATE_WORLD)
  useSoundCue('popIn', T0.lift, point(...plateMid), { gain: 0.6 })
  useSoundTrack('b2b-plate-fly', 'whoosh', frame >= T0.fly && frame <= T0.fly + 24, point(plateMid[0] + fly * 1500, plateMid[1] - fly * 260 - clamp01(lift) * 16), { gain: 0.6 })
  useSoundCues('key', [107, 109, 111, 113], onPage(240, 312))
  useSoundCues('key', [115, 117, 119, 121], onPage(275, 408))
  useSoundCues('key', [139, 141, 143, 145], onPage(359, 288))
  useSoundCues('key', [147, 149, 151, 153], onPage(315, 378))
  useSoundCues('key', [155, 157, 159, 161], onPage(250, 468))
  useSoundCue('tick', T0.gdpr + 2, point(...mid(gdprRect)), { gain: 0.6 })
  useSoundTrack('b2b-disc', 'whoosh', frame > T0.disc && frame < T0.disc + 30, onPage(dx + dw / 2, dy + dh / 2), { gain: 0.6 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow
          path="/b2b/resellers"
          page={L.brand}
          overlay={
            <>
              {/* Поля шага 2 на странице (копия оторвалась плитой). */}
              {out2 < 1 && (
                <Sheet w={672} h={230} scale={S} style={{ left: (STEP2.block.x - out2 * 70) * S, top: STEP2.block.y * S, opacity: 1 - out2 }}>
                  <CompanyFields />
                </Sheet>
              )}
            </>
          }
        >
          <RegBackground />
          <g style={{ opacity: 1 - disc * 1.4 }}>
            <RegTrail current={to4 > 0.5 ? 4 : to3 > 0.5 ? 3 : 2} x={STEP2.trail.x} y={STEP2.trail.y} fill={to4 > 0.5 ? easeOut(span(frame, T0.step4 + 8, 10)) : to3 > 0.5 ? easeOut(span(frame, T0.step3 + 8, 10)) : 1} />
            {out2 < 1 && (
              <g style={{ opacity: 1 - out2, transform: `translate(${-out2 * 70}px, 0px)` }}>
                <RegStep2Frame press={press(T0.confirm)} />
              </g>
            )}
            {in3 > 0 && out3 < 1 && (
              <g style={{ opacity: in3 * (1 - out3), transform: `translate(${(1 - in3) * 90 - out3 * 70}px, 0px)` }}>
                <RegStep3 typed={span(frame, T0.step3 + 8, 16)} press={press(T0.next)} />
              </g>
            )}
            {in4 > 0 && (
              <g style={{ opacity: in4, transform: `translate(${(1 - in4) * 90}px, 0px)` }}>
                <RegStep4 typed={span(frame, T0.step4 + 8, 24)} gdpr={easeOut(span(frame, T0.gdpr, 8))} press={frame < T0.disc ? press(T0.submit) : 1} />
              </g>
            )}
          </g>
          {/* Кнопка отправки становится белым диском экрана успеха. */}
          {frame >= T0.disc && (
            <g>
              <rect x={dx} y={dy} width={dw} height={dh} rx={Math.min(dw, dh) / 2} fill={interpolateColors(disc, [0, 0.5, 1], [L.ink, '#ffffff', '#ffffff'])} />
            </g>
          )}
          {busy && (
            <g transform={`rotate(${(frame - T0.submit) * 14} ${from.x + 28} ${from.y + 25})`}>
              <circle cx={from.x + 28} cy={from.y + 25} r={7} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="30 14" strokeLinecap="round" />
            </g>
          )}
        </ScreenWindow>
        {frame >= T0.lift - 1 && fly < 1 && (
          <Flip
            angle={180 * turn}
            perspective={1800}
            style={{
              left: PLATE_WORLD.x,
              top: PLATE_WORLD.y,
              width: PLATE_WORLD.width,
              height: PLATE_WORLD.height,
              transform: `translate(${fly * 1500}px, ${-fly * 260 - clamp01(lift) * 16}px) scale(${plateScale}) rotate(${fly * 8}deg)`,
              opacity: 1 - easeIn(span(frame, T0.fly + 18, 10)),
            }}
            front={
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24 * S, background: L.brand, boxShadow: lift > 0.02 ? SHADOW.lifted : undefined }}>
                <Sheet w={672} h={230} scale={S} style={{ left: 14 * S, top: 14 * S }}>
                  <CompanyFields />
                </Sheet>
              </div>
            }
            back={
              <div style={{ position: 'absolute', left: 0, top: ((PLATE.h - APPLICATION.h) / 2) * S, width: APPLICATION.w * S, height: APPLICATION.h * S, borderRadius: 16 * S, boxShadow: SHADOW.lifted }}>
                <Sheet w={APPLICATION.w} h={APPLICATION.h} scale={S} style={{ left: 0, top: 0 }}>
                  <ApplicationCard />
                </Sheet>
              </div>
            }
          />
        )}
      </Camera>
      {CLICKS.map((at) => {
        const point = cursorAt(CURSOR, at)
        const [x, y] = camera.project(point.x, point.y)
        return <Ripple key={at} x={x} y={y} at={at} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

