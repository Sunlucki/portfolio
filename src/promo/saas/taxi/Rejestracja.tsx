import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Tap } from '../kit/pointer'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { SHADOW, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { typingFrames, useSoundPoints } from './fx'
import { inFrame, measureWith, wrapLines } from './geometry'
import { Live, PHONE, PHONE_SCREEN, TaxiPhone, phoneRect } from './screen'
import {
  CABINET,
  COOP,
  COOP_CARD,
  CREATE_BUTTON,
  CREATED_SCROLL,
  GOLD,
  HERO,
  REGISTER_CARD,
  TB,
  caption,
  drawAccountCreated,
  drawCabinet,
  drawCoopCard,
  drawPasskeyCard,
  drawRegisterContact,
  drawTelegramCard,
  prepareTaxi,
  tag,
  type ContactState,
} from './twins'

/* 06–08 · 02 Rejestracja (44 доли). Три формы сотрудничества встают веером
   (карточки выходят ребром и поворачиваются лицом, П15), галочки ставятся по
   очереди. Камера подъезжает к «Wynajem pojazdu», касание — две другие
   карточки уходят ребром, выбранная растёт в экран iPhone (П1): регистрация.
   Имя, e-mail и номер печатаются (маска «+48 » встаёт сама), «Utwórz Konto» —
   «Konto Utworzone!». Касание «Weryfikuj przez Telegram» раскрывается кругом
   (П3) в кабинет водителя: плашка Telegram переворачивается из «Niepołączono»
   в «Połączono» (м-статус), ниже — «Klucze dostępu».

   0–28     карточки встают через 5 кадров; 22–48 — галочки
   28–100   три карточки целиком — читаются
   100–126  наезд на «Wynajem pojazdu», остальные гаснут; 110–200 выноска
   150      касание; 176–192 крайние уходят ребром
   180–210  выбранная растёт в экран телефона, корпус проступает
   214–340  форма: имя 244, e-mail 280, номер 306 (маска), черта под номером
   358      «Utwórz Konto» → «Tworzenie konta...»; 380 «Konto Utworzone!»
   392–480  выноска «Konto w minutę. Bez hasła.»
   488      «Weryfikuj przez Telegram» → круг раскрывает кабинет (490–512)
   548      «Połącz»; 552–568 плашка переворачивается в «Połączono»
   560–660  выноска «Logowanie przez Telegram albo klucz dostępu.» */

export const REJESTRACJA_BEATS = 44

const T = {
  ticks: 22,
  zoom: 100,
  callout: 110,
  tap: 150,
  away: 176,
  grow: 180,
  formCam: 214,
  name: 244,
  email: 280,
  phone: 306,
  create: 358,
  created: 380,
  telegram: 488,
  reveal: 490,
  cardsCam: 512,
  connect: 548,
  flip: 552,
}

/** Кабинет водителя после связи Telegram — с этого кадра начинается глава
    «Dokumenty» (склейка встык). */
export const CABINET_CARDS: Rect = phoneRect({ x: 16, y: CABINET.telegram.y, width: 361, height: CABINET.passkey.y + CABINET.passkey.height - CABINET.telegram.y })
export const CABINET_VIEW = fit(CABINET_CARDS, { max: 2.5, shift: [-290, 0], margin: 70 })

/* ── Веер форм сотрудничества ── */

const FAN = [
  { cx: 568, cy: 578, turn: -6 },
  { cx: 960, cy: 552, turn: 0 },
  { cx: 1352, cy: 578, turn: 6 },
]
const fanRect = (i: number): Rect => ({ x: FAN[i]!.cx - COOP_CARD.width / 2, y: FAN[i]!.cy - COOP_CARD.height / 2, width: COOP_CARD.width, height: COOP_CARD.height })
const CHOSEN = fanRect(1)

function ticks(frame: number, i: number): number {
  const start = T.ticks + i * 4
  return clamp01((frame - start) / 7) + clamp01((frame - (start + 11)) / 7)
}

/* ── Форма «Dane Kontaktowe» ── */

const DIGITS = '512345678'
function masked(count: number): string {
  if (count <= 0) return ''
  const d = DIGITS.slice(0, count)
  return `+48 ${[d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join(' ')}`
}

function contact(frame: number): ContactState {
  const typed = (at: number, length: number, speed: number) => Math.max(0, Math.min(length, Math.floor((frame - at) / speed) + 1))
  const name = frame >= T.name ? HERO.name.slice(0, typed(T.name, HERO.name.length, 2)) : ''
  const email = frame >= T.email ? HERO.email.slice(0, typed(T.email, HERO.email.length, 1.4)) : ''
  const digits = frame >= T.phone ? typed(T.phone, DIGITS.length, 2.6) : 0
  const focus = frame < T.email ? 0 : frame < T.phone ? 1 : frame < T.create - 4 ? 2 : -1
  return { name, email, phone: masked(digits), focus, mask: digits > 0 && frame < T.create, busy: frame >= T.create + 2 && frame < T.created }
}

/* ── Камера ── */

const FORM_RECT = phoneRect({ x: 16, y: REGISTER_CARD, width: 361, height: 490 })
const CREATED_RECT = phoneRect({ x: 16, y: REGISTER_CARD - CREATED_SCROLL, width: 361, height: 430 })

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 560, zoom: 1.02 },
  { at: 20, dur: 40, x: 960, y: 560, zoom: 1.1 },
  { at: T.zoom, dur: 26, ...fit(CHOSEN, { max: 1.6, shift: [-300, 0], margin: 60 }) },
  { at: T.grow, dur: 30, x: PHONE.cx, y: PHONE.cy, zoom: 1.02 },
  { at: T.formCam, dur: 26, ...fit(FORM_RECT, { max: 1.76, margin: 70 }) },
  { at: T.created + 2, dur: 26, ...fit(CREATED_RECT, { max: 1.95, shift: [-280, 0], margin: 70 }) },
  { at: T.cardsCam, dur: 26, ...CABINET_VIEW },
]

export function Rejestracja() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const layout = useMemo(() => {
    /* Замер художником — в языке ролика: строки выбора переносятся по-разному. */
    const telegramTop = measureWith((ctx) => {
      prepareTaxi(lang)
      return drawAccountCreated(ctx, 1)
    })
    const lines = (text: string, size: number, weight: number) => wrapLines(text, 313 - 136, size, weight).length
    const rowHeight = Math.max(
      104,
      24 + lines(pick(lang, 'Weryfikuj przez Telegram', 'Verify via Telegram'), 18, 600) * 26 + 6 + lines(pick(lang, 'Szybka weryfikacja przez naszego bota Telegram', 'Quick verification through our Telegram bot'), 14, 400) * 20 + 20,
    )
    return {
      telegram: { x: 196.5, y: telegramTop + rowHeight / 2 },
      linked: { x: 16 + 87, y: CABINET.telegram.y + 55 - 11, width: textWidth(pick(lang, `Połączono: ${HERO.telegram}`, `Connected: ${HERO.telegram}`), 14, 400), height: 11 },
      passkey: { x: 16 + 72, y: CABINET.passkey.y + 22, width: textWidth(pick(lang, '1 klucz — logowanie bez hasła', '1 key — sign in without a password'), 12, 400), height: 40 },
      title: { x: CHOSEN.x + 28, y: CHOSEN.y + 116, width: textWidth(pick(lang, COOP[1]!.title, COOP[1]!.en.title), 26, 600, -0.3 / 26), height: 30 },
      phone: { x: 88, y: 590 + 28 + 35 - 13, width: textWidth('+48 512 345 678', 16, 400), height: 13 },
    }
  }, [lang])

  const form = contact(frame)
  const morph = glide(span(frame, T.grow, 30))
  const phoneIn = easeOut(span(frame, T.grow + 10, 12))
  const createdPop = clamp01(spring(frame, T.created, SPRINGS.pop))
  const reveal = easeInOut(span(frame, T.reveal, 22))
  const flip = spring(frame, T.flip, SPRINGS.pop)
  const lift = Math.sin(Math.PI * clamp01(span(frame, T.flip - 2, 22)))

  /* Выноски: точка — на элементе, рамка — справа от телефона. */
  const titleAt = camera.project(layout.title.x + layout.title.width * 0.5, layout.title.y + layout.title.height / 2)
  const fanView = viewAt(CAMERA, T.callout + 20)
  const fanRight = fanView.project(CHOSEN.x + CHOSEN.width, 0)[0]
  const createdAt = camera.project(...phonePoint(196.5, REGISTER_CARD - CREATED_SCROLL + 138))
  const createdView = viewAt(CAMERA, T.created + 40)
  const phoneRight = createdView.project(PHONE_SCREEN.x + PHONE_SCREEN.width, 0)[0]
  const linkedAt = camera.project(...phonePoint(layout.linked.x + layout.linked.width * 0.55, layout.linked.y + 4))
  const cabinetView = viewAt(CAMERA, T.connect)
  const cardsRight = cabinetView.project(CABINET_CARDS.x + CABINET_CARDS.width, 0)[0]

  /* Звук: галочки на карточках веера по очереди; выбранная карточка растёт в
     экран телефона; имя, e-mail и номер печатаются; «Konto Utworzone!»; круг
     касания раскрывает кабинет (П3). */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const field = (y: number) => at(...phonePoint(149, y))
  useSoundPoints(
    'tick',
    [0, 1, 2].flatMap((i) => [T.ticks + i * 4, T.ticks + 11 + i * 4].map((f) => ({ at: f, ...at(FAN[i]!.cx, FAN[i]!.cy - 30) }))),
    { gain: 0.4 },
  )
  useSoundCue('air', T.grow, at(PHONE.cx, PHONE.cy), { gain: 0.5, seconds: 0.9 })
  useSoundCues('key', typingFrames(T.name, 2, HERO.name.length), field(436), { gain: 0.6 })
  useSoundCues('key', typingFrames(T.email, 1.4, HERO.email.length), field(538), { gain: 0.6 })
  useSoundCues('key', typingFrames(T.phone, 2.6, DIGITS.length), field(640), { gain: 0.6 })
  useSoundCue('success', T.created + 1, { x: createdAt[0], y: createdAt[1] }, { gain: 0.9 })
  useSoundCue('air', T.reveal, at(...phonePoint(layout.telegram.x, layout.telegram.y)), { gain: 0.5, seconds: 0.7 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {/* Веер: карточки встают ребром → лицом; выбранная растёт в экран телефона. */}
        {frame < T.grow + 30 &&
          [0, 2, 1].map((i) => {
            const rect = fanRect(i)
            const rise = spring(frame, 4 + i * 5, SPRINGS.pop)
            const chosen = i === 1
            const away = chosen ? 0 : easeIn(span(frame, T.away, 16))
            const dim = chosen ? 1 : mix(1, 0.42, easeInOut(span(frame, T.zoom, 20)))
            const pressed = chosen ? 1 - 0.035 * Math.sin(Math.PI * span(frame, T.tap - 1, 8)) : 1
            const box = chosen && frame >= T.grow ? { x: mix(rect.x, PHONE_SCREEN.x, morph), y: mix(rect.y, PHONE_SCREEN.y, morph), width: mix(rect.width, PHONE_SCREEN.width, morph), height: mix(rect.height, PHONE_SCREEN.height, morph) } : rect
            const turn = FAN[i]!.turn * (1 - (chosen ? morph : 0))
            return (
              <Flip
                key={i}
                angle={90 * (1 - Math.min(1, rise)) + (i - 1) * 90 * away}
                style={{
                  left: box.x,
                  top: box.y + (1 - Math.min(1, rise)) * 160 + away * 90,
                  width: box.width,
                  height: box.height,
                  opacity: frame < 4 + i * 5 ? 0 : dim * (1 - away),
                  transform: `rotate(${turn}deg) scale(${pressed})`,
                }}
                front={
                  <div style={{ position: 'absolute', inset: 0, borderRadius: mix(24, 52, chosen ? morph : 0), overflow: 'hidden', boxShadow: SHADOW.card, background: '#0C0E12' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: COOP_CARD.width, height: COOP_CARD.height, opacity: 1 - (chosen ? easeIn(span(frame, T.grow + 4, 14)) : 0) }}>
                      <Live width={COOP_CARD.width} height={COOP_CARD.height} ratio={3} state={Math.round(ticks(frame, i) * 10)} draw={(ctx) => drawCoopCard(ctx, i, ticks(frame, i))} />
                    </div>
                  </div>
                }
              />
            )
          })}
        {frame >= T.tap - 6 && frame < T.grow && <Tap x={CHOSEN.x + CHOSEN.width / 2} y={CHOSEN.y + 350} at={T.tap} scale={1.3} />}
        <Scribble rect={layout.title} color={GOLD} width={2.6} pad={[16, 10]} seed={4} p={easeOut(span(frame, T.tap + 2, 14)) * (1 - easeIn(span(frame, T.away - 2, 6)))} />

        {/* Телефон: регистрация → «Konto Utworzone!» → кабинет (круг касания, П3). */}
        {frame >= T.grow + 10 && (
          <div style={{ position: 'absolute', inset: 0, opacity: phoneIn }}>
            <TaxiPhone
              overlay={
                <>
                  <Tap x={CREATE_BUTTON.x + CREATE_BUTTON.width / 2} y={CREATE_BUTTON.y + CREATE_BUTTON.height / 2} at={T.create} />
                  <Tap x={layout.telegram.x} y={layout.telegram.y} at={T.telegram} />
                  <Tap x={16 + 361 - 44 - 32} y={CABINET.telegram.y + 39} at={T.connect} />
                  <Scribble rect={layout.phone} kind="underline" color={GOLD} width={2.2} p={easeOut(span(frame, T.phone + 30, 10)) * (1 - easeIn(span(frame, T.create - 4, 5)))} />
                  <Scribble rect={layout.linked} kind="underline" color={GOLD} width={2} p={easeOut(span(frame, T.flip + 20, 12))} />
                  <Scribble rect={layout.passkey} color={GOLD} width={2} pad={[12, 5]} seed={6} p={easeOut(span(frame, T.flip + 40, 14))} />
                </>
              }
            >
              {frame < T.reveal + 24 && (
                <>
                  {frame < T.created ? (
                    <Live key="register" width={393} height={852} ratio={3} state={JSON.stringify(form)} draw={(ctx) => drawRegisterContact(ctx, form)} />
                  ) : (
                    <Live key="created" width={393} height={852} ratio={3} state={Math.round(createdPop * 20)} draw={(ctx) => drawAccountCreated(ctx, createdPop)} />
                  )}
                </>
              )}
              {frame >= T.reveal && (
                <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${mix(22, 980, reveal)}px at ${layout.telegram.x}px ${layout.telegram.y}px)` }}>
                  <Live width={393} height={852} ratio={3} draw={(ctx) => drawCabinet(ctx, { slots: false })} />
                  <div style={{ position: 'absolute', left: CABINET.passkey.x, top: CABINET.passkey.y, width: CABINET.passkey.width, height: CABINET.passkey.height }}>
                    <Live width={CABINET.passkey.width} height={CABINET.passkey.height} ratio={4} draw={drawPasskeyCard} />
                  </div>
                  <Flip
                    axis="x"
                    angle={180 * flip}
                    perspective={900}
                    style={{ left: CABINET.telegram.x, top: CABINET.telegram.y, width: CABINET.telegram.width, height: CABINET.telegram.height, transform: `scale(${1 + 0.06 * lift})` }}
                    front={<Live width={CABINET.telegram.width} height={CABINET.telegram.height} ratio={4} draw={(ctx) => drawTelegramCard(ctx, false)} />}
                    back={<Live width={CABINET.telegram.width} height={CABINET.telegram.height} ratio={4} draw={(ctx) => drawTelegramCard(ctx, true)} />}
                  />
                </div>
              )}
            </TaxiPhone>
          </div>
        )}
        {/* Выбранная карточка, выросшая в экран, гаснет в страницу регистрации. */}
        {frame >= T.grow && frame < T.grow + 34 && (
          <div
            style={{
              position: 'absolute',
              left: mix(CHOSEN.x, PHONE_SCREEN.x, morph),
              top: mix(CHOSEN.y, PHONE_SCREEN.y, morph),
              width: mix(CHOSEN.width, PHONE_SCREEN.width, morph),
              height: mix(CHOSEN.height, PHONE_SCREEN.height, morph),
              borderRadius: mix(24, 52, morph),
              background: TB.bg,
              opacity: easeIn(span(frame, T.grow + 6, 8)) * (1 - easeIn(span(frame, T.grow + 15, 10))),
            }}
          />
        )}
      </Camera>

      <Callout anchor={titleAt} box={{ x: inFrame(fanRight + 60, 520), y: titleAt[1] - 40, width: 520 }} tag={tag(6, lang)} title={caption(6, lang)} at={T.callout} until={T.away - 4} />
      <Callout anchor={createdAt} box={{ x: inFrame(phoneRight + 70, 520), y: createdAt[1] - 190, width: 520 }} tag={tag(7, lang)} title={caption(7, lang)} at={T.created + 14} until={T.telegram - 6} />
      <Callout
        anchor={linkedAt}
        box={{ x: inFrame(cardsRight + 70, 540), y: linkedAt[1] - 230, width: 540 }}
        tag={tag(8, lang)}
        title={caption(8, lang)}
        at={T.flip + 10}
        until={REJESTRACJA_BEATS * 15 - 24}
      />
    </AbsoluteFill>
  )
}

function phonePoint(x: number, y: number): [number, number] {
  const r = phoneRect({ x, y, width: 0, height: 0 })
  return [r.x, r.y]
}
