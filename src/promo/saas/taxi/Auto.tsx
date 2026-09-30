import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { SHADOW, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { Glow } from './fx'
import { inFrame } from './geometry'
import { DESK, Desk, Live, PHONE, TaxiPhone, deskRect, onDesk, onPhone, phoneRect } from './screen'
import { UMOWA_END_CARD, UMOWA_VIEW } from './Umowa'
import {
  ASSIGN_BUTTON,
  ASSIGN_MODAL,
  ASSIGN_OPTION,
  CABINET_CAR,
  CAR_BOX,
  DRIVER_DIALOG,
  GOLD,
  HERO,
  NATIVE_CONTRACT,
  TB,
  caption,
  drawAssignModal,
  drawAssignedCar,
  drawCabinetCar,
  drawCarCardInner,
  drawDriverInfo,
  drawNativeContractCard,
  drawNativeContracts,
  tag,
} from './twins'

/* 14 · 04 Umowa · Машина (32 доли). Подписанная карточка договора отрывается
   от экрана и переворачивается в воздухе (П15): на обороте — окно водителя
   «Informacje» из панели; она летит туда и садится (камера следует).
   «Przypisz samochód» — окно выбора крупно, Toyota Corolla; в окне водителя
   встаёт синий блок «Najem: 850 PLN/tydz.». Блок отрывается и летит в
   кабинет водителя на телефоне: «Twój samochód» — та же машина. Под конец —
   общий план: панель владельца и телефон водителя видят одно и то же.

   0–12     карточка отрывается (м-отрыв), экран темнеет
   12–34    переворот (П15); 16–76 — полёт в панель, камера следует
   76–104   окно «Informacje», «Samochód»; 112 — «Przypisz samochód»
   116–198  окно выбора крупно; 176 — наведение; 198 — Toyota Corolla
   200–250  синий блок встаёт, обводка «Najem»
   256–270  блок отрывается; 270–330 — полёт в кабинет телефона
   330–420  «Twój samochód» крупно; выноска 14
   420–480  общий план: панель и телефон */

export const AUTO_BEATS = 32

const T = {
  lift: 0,
  flip: 12,
  flight: 16,
  land: 76,
  assign: 112,
  modal: 116,
  hover: 176,
  pick: 198,
  car: 200,
  carLift: 256,
  carFlight: 270,
  carLand: 330,
  overview: 420,
}
const END = AUTO_BEATS * 15

/* ── Переворот и полёт в окно водителя ── */

const SIGNED: Rect = { ...UMOWA_END_CARD, height: 140 * PHONE.s }
/** Оборот карточки — верх окна водителя «Informacje» (шапка и первый ряд плиток). */
const BACK: Rect = { x: DRIVER_DIALOG.x, y: DRIVER_DIALOG.y, width: DRIVER_DIALOG.width, height: 298 }
const BACK_WORLD = deskRect(BACK)

function cardFlight(frame: number) {
  const lift = easeOut(span(frame, T.lift, 12))
  const flip = spring(frame, T.flip, SPRINGS.heavy)
  const t = glide(span(frame, T.flight, T.land - T.flight))
  const grow = easeInOut(span(frame, T.flight + 18, 36))
  const width = mix(SIGNED.width, BACK_WORLD.width, grow)
  const height = mix(SIGNED.height, BACK_WORLD.height, grow)
  const x = mix(SIGNED.x + SIGNED.width / 2, BACK_WORLD.x + BACK_WORLD.width / 2, t)
  const y = mix(SIGNED.y + SIGNED.height / 2, BACK_WORLD.y + BACK_WORLD.height / 2, t) - Math.sin(Math.PI * t) * 150
  return { x, y, width, height, lift, flip, t }
}

/* ── Блок машины → кабинет водителя ── */

const CAR_WORLD = deskRect(CAR_BOX)
const CABINET_SLOT = phoneRect(CABINET_CAR)

function carFlight(frame: number) {
  const lift = easeOut(span(frame, T.carLift, 12))
  const t = glide(span(frame, T.carFlight, T.carLand - T.carFlight))
  const morph = easeInOut(span(frame, T.carFlight + 16, 30))
  const width = mix(CAR_WORLD.width, CABINET_SLOT.width, morph)
  const height = mix(CAR_WORLD.height, CABINET_SLOT.height, morph)
  const x = mix(CAR_WORLD.x + CAR_WORLD.width / 2, CABINET_SLOT.x + CABINET_SLOT.width / 2, t)
  const y = mix(CAR_WORLD.y + CAR_WORLD.height / 2, CABINET_SLOT.y + CABINET_SLOT.height / 2, t) - Math.sin(Math.PI * t) * 150
  return { x, y, width, height, lift, t, morph }
}

const MODAL: Rect = deskRect({ x: (DESK.width - ASSIGN_MODAL.width) / 2, y: (DESK.height - ASSIGN_MODAL.height) / 2, width: ASSIGN_MODAL.width, height: ASSIGN_MODAL.height })

/* ── Камера ── */

const INFO_VIEW = fit(deskRect({ x: DRIVER_DIALOG.x, y: 380, width: DRIVER_DIALOG.width, height: 250 }), { max: 2, margin: 60 })
const CAR_VIEW = fit(deskRect({ x: DRIVER_DIALOG.x, y: 430, width: DRIVER_DIALOG.width, height: 150 }), { max: 2.05, margin: 60 })
const CABINET_VIEW = fit(phoneRect({ x: 16, y: 136, width: 361, height: 200 }), { max: 2.45, shift: [-280, 0], margin: 70 })
/** Общий план: панель владельца и телефон водителя рядом. */
export const OVERVIEW = fit({ x: DESK.x - 20, y: DESK.y - 80, width: PHONE.cx + 240 - DESK.x, height: DESK.height + 160 }, { margin: 70 })

const CAMERA: CameraKey[] = [
  { at: 0, ...UMOWA_VIEW },
  { at: T.flight + 2, dur: 16, follow: follow((f) => [cardFlight(f).x, cardFlight(f).y], { zoom: (f) => mix(2, 1.15, glide(span(f, T.flight, 50))), lag: 6 }) },
  { at: T.land - 6, dur: 28, ...INFO_VIEW },
  { at: T.modal + 2, dur: 24, ...focus(MODAL, { fill: 0.55, shift: [0, 0] }) },
  { at: T.pick + 6, dur: 24, ...CAR_VIEW },
  { at: T.carFlight + 2, dur: 16, follow: follow((f) => [carFlight(f).x, carFlight(f).y], { zoom: (f) => mix(1.9, 1.4, glide(span(f, T.carFlight, 60))), lag: 6 }) },
  { at: T.carLand - 6, dur: 26, ...CABINET_VIEW },
  { at: T.overview, dur: 40, ...OVERVIEW },
]

const CURSOR_KEYS = (() => {
  const [ax, ay] = onDesk(ASSIGN_BUTTON.x + ASSIGN_BUTTON.width / 2, ASSIGN_BUTTON.y + ASSIGN_BUTTON.height / 2)
  const option = { x: MODAL.x + ASSIGN_OPTION.x + ASSIGN_OPTION.width * 0.4, y: MODAL.y + ASSIGN_OPTION.y + ASSIGN_OPTION.height / 2 }
  return [
    { at: 86, x: ax + 240, y: ay + 150 },
    { at: 108, x: ax, y: ay },
    { at: 150, x: ax + 30, y: ay + 90 },
    { at: 176, x: option.x, y: option.y },
    { at: 196, x: option.x + 6, y: option.y + 2 },
    { at: 220, x: option.x + 90, y: option.y + 140 },
  ]
})()
const CLICKS = [T.assign, T.pick]

export function Auto() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const layout = useMemo(() => {
    const signed = textWidth(pick(lang, 'Podpisana', 'Signed'), 12, 600) + 20
    return {
      rent: deskRect({ x: CAR_BOX.x + 16, y: CAR_BOX.y + 52 - 12, width: textWidth(pick(lang, `Najem: ${HERO.rent} PLN/tydz.`, `Rent: ${HERO.rent} PLN/week`), 14, 400), height: 12 }),
      weekly: { x: CABINET_CAR.x + 16, y: CABINET_CAR.y + 94 - 12, width: CABINET_CAR.width - 32, height: 12 },
      /* Обводка «Podpisana» из главы «Umowa» — гаснет, пока карточка отрывается. */
      signed: { x: NATIVE_CONTRACT.x + NATIVE_CONTRACT.width - 16 - signed, y: NATIVE_CONTRACT.y + 16, width: signed, height: 22 },
    }
  }, [lang])
  const card = cardFlight(frame)
  const car = carFlight(frame)
  const modalIn = spring(frame, T.modal, SPRINGS.pop) * (1 - easeIn(span(frame, T.pick + 2, 8)))
  const assigned = frame >= T.car
  const dim = 0.5 * easeOut(span(frame, T.modal, 8)) * (1 - easeIn(span(frame, T.pick + 2, 8)))
  const phoneDim = 0.2 * easeOut(span(frame, T.lift, 10)) * (1 - easeIn(span(frame, T.flight + 20, 12)))
  const cursorWorld = cursorAt(CURSOR_KEYS, frame, CLICKS, 226)
  const [cx, cy] = camera.project(cursorWorld.x, cursorWorld.y)
  const clicks = CLICKS.map((at) => {
    const p = cursorAt(CURSOR_KEYS, at)
    return { at, point: camera.project(p.x, p.y) }
  })
  const landedCar = frame >= T.carLand

  const cabinetAt = camera.project(...onPhone(CABINET_CAR.x + CABINET_CAR.width * 0.62, CABINET_CAR.y + 30))
  const cabinetView = viewAt(CAMERA, T.carLand + 30)
  const phoneRight = cabinetView.project(...onPhone(393, 0))[0]

  /* Звук: карточка отрывается, летит с переворотом в окно водителя и садится;
     окно выбора, наведение на Corolla, машина закреплена; блок машины отрывается,
     летит в кабинет телефона и садится. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const center = (r: Rect) => at(r.x + r.width / 2, r.y + r.height / 2)
  const option = CURSOR_KEYS[3]!
  useSoundCue('air', T.lift, center(SIGNED), { gain: 0.3, seconds: 0.45 })
  useSoundTrack('taxi2d-signed-flight', 'whoosh', frame > T.flight && frame <= T.land, at(card.x, card.y), { gain: 0.6 })
  useSoundCue('thump', T.land, center(BACK_WORLD), { gain: 0.6 })
  useSoundCue('popIn', T.modal, center(MODAL), { gain: 0.8 })
  useSoundCue('tick', T.hover, at(option.x, option.y), { gain: 0.3 })
  useSoundCue('success', T.car + 1, center(CAR_WORLD), { gain: 0.8 })
  useSoundCue('air', T.carLift, center(CAR_WORLD), { gain: 0.3, seconds: 0.45 })
  useSoundTrack('taxi2d-car-flight', 'whoosh', frame > T.carFlight && frame <= T.carLand, at(car.x, car.y), { gain: 0.6 })
  useSoundCue('thump', T.carLand, center(CABINET_SLOT), { gain: 0.6 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Desk>
          <Live width={DESK.width} height={DESK.height} ratio={2.4} state={String(assigned)} draw={(ctx) => drawDriverInfo(ctx, DESK.width, DESK.height, assigned)} />
          <Glow frame={frame} at={T.land - 4} rect={BACK} color={GOLD} radius={24} strength={0.14} />
          <Glow frame={frame} at={T.car} rect={CAR_BOX} color={TB.blue4} strength={0.26} />
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim }} />
          <Scribble rect={{ ...layout.rent, x: layout.rent.x - DESK.x, y: layout.rent.y - DESK.y }} kind="underline" color={GOLD} width={2.2} p={easeOut(span(frame, T.car + 26, 12)) * (1 - easeIn(span(frame, T.carLift - 2, 6)))} />
        </Desk>

        {/* Окно «Przypisz samochód»: выходит с перелётом над затемнённой панелью. */}
        {modalIn > 0.002 && (
          <div
            style={{
              position: 'absolute',
              left: MODAL.x,
              top: MODAL.y,
              width: MODAL.width,
              height: MODAL.height,
              borderRadius: 24,
              boxShadow: SHADOW.lifted,
              opacity: clamp01(modalIn * 1.6),
              transform: `perspective(1600px) rotateX(${(1 - clamp01(modalIn)) * 14}deg) scale(${mix(0.94, 1, modalIn)})`,
            }}
          >
            <Live width={ASSIGN_MODAL.width} height={ASSIGN_MODAL.height} ratio={4} state={String(frame >= T.hover)} draw={(ctx) => drawAssignModal(ctx, frame >= T.hover)} />
          </div>
        )}

        <TaxiPhone
          overlay={
            <>
              <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: phoneDim }} />
              <Scribble rect={layout.signed} color={TB.green4} width={2} pad={[10, 6]} seed={2} p={1 - easeIn(span(frame, 0, 8))} />
              {landedCar && (
                <div style={{ position: 'absolute', left: CABINET_CAR.x, top: CABINET_CAR.y, width: CABINET_CAR.width, height: CABINET_CAR.height }}>
                  <Live width={CABINET_CAR.width} height={CABINET_CAR.height} ratio={4} draw={drawCarCardInner} />
                </div>
              )}
              <Glow frame={frame} at={T.carLand} rect={CABINET_CAR} color={GOLD} strength={0.22} />
              <Scribble rect={layout.weekly} kind="underline" color={GOLD} width={2} p={easeOut(span(frame, T.carLand + 30, 12)) * (1 - easeIn(span(frame, T.overview, 10)))} />
            </>
          }
        >
          {frame < T.land + 20 ? (
            <Live key="umowy" width={393} height={852} ratio={3} draw={(ctx) => drawNativeContracts(ctx, true, false)} />
          ) : (
            <Live key="cabinet" width={393} height={852} ratio={3} draw={(ctx) => drawCabinetCar(ctx, false)} />
          )}
        </TaxiPhone>

        {/* Подписанная карточка: переворот (П15) — на обороте окно водителя, полёт в панель. */}
        {frame < T.land + 4 && (
          <Flip
            angle={180 * card.flip}
            perspective={1600}
            style={{
              left: card.x - card.width / 2,
              top: card.y - card.height / 2,
              width: card.width,
              height: card.height,
              transform: `scale(${1 + 0.05 * card.lift * (1 - card.t)})`,
              opacity: 1 - easeIn(span(frame, T.land, 4)),
            }}
            front={
              <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', boxShadow: SHADOW.lifted }}>
                <Live width={NATIVE_CONTRACT.width} height={140} ratio={3.5} draw={(ctx) => drawNativeContractCard(ctx, true)} style={{ transformOrigin: '0 0', transform: `scale(${card.width / NATIVE_CONTRACT.width}, ${card.height / 140})` }} />
              </div>
            }
            back={
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', boxShadow: SHADOW.lifted, background: TB.card }}>
                <Live
                  width={BACK.width}
                  height={BACK.height}
                  ratio={2.4}
                  draw={(ctx) => {
                    ctx.translate(-BACK.x, -BACK.y)
                    drawDriverInfo(ctx, DESK.width, DESK.height, false)
                  }}
                  style={{ transformOrigin: '0 0', transform: `scale(${card.width / BACK.width}, ${card.height / BACK.height})` }}
                />
              </div>
            }
          />
        )}

        {/* Блок машины: отрывается и летит в «Twój samochód» на телефоне. */}
        {frame >= T.carLift && frame < T.carLand + 2 && (
          <div
            style={{
              position: 'absolute',
              left: car.x - car.width / 2,
              top: car.y - car.height / 2,
              width: car.width,
              height: car.height,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: SHADOW.lifted,
              transform: `scale(${1 + 0.05 * car.lift * (1 - car.t)})`,
            }}
          >
            <Live width={CAR_BOX.width} height={CAR_BOX.height} ratio={3} draw={drawAssignedCar} style={{ transformOrigin: '0 0', transform: `scale(${car.width / CAR_BOX.width}, ${car.height / CAR_BOX.height})`, opacity: 1 - car.morph }} />
            <Live width={CABINET_CAR.width} height={CABINET_CAR.height} ratio={3.5} draw={drawCarCardInner} style={{ transformOrigin: '0 0', transform: `scale(${car.width / CABINET_CAR.width}, ${car.height / CABINET_CAR.height})`, opacity: car.morph }} />
          </div>
        )}
      </Camera>

      {clicks.map(({ at, point }) => (
        <Ripple key={at} x={point[0]} y={point[1]} at={at} />
      ))}
      <Cursor x={cx} y={cy} press={cursorWorld.press} opacity={cursorWorld.opacity} />
      <Callout anchor={cabinetAt} box={{ x: inFrame(phoneRight + 70, 540), y: cabinetAt[1] - 240, width: 540 }} tag={tag(14, lang)} title={caption(14, lang)} at={T.carLand + 14} until={T.overview + 20} />
    </AbsoluteFill>
  )
}

export const AUTO_END = END
