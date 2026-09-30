import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, cover, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, Scribble } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { FONT, INK, SHADOW, type Point, type Rect } from '../kit/theme'
import { OVERVIEW } from './Auto'
import { Glow, typingFrames, useSoundPoints } from './fx'
import { inFrame } from './geometry'
import { Glyph } from './glyphs'
import { DESK, Desk, Live, TaxiPhone, deskRect, onDesk } from './screen'
import {
  ACCENT,
  CARS,
  CAR_CARD,
  CHIPS,
  GOLD,
  NOTICE,
  SERVICE,
  SERVICE_FORM,
  SERVICE_NOTE,
  SERVICE_SUBMIT,
  TB,
  bellRect,
  caption,
  carSlot,
  drawCabinetCar,
  drawCarCard,
  box,
  icon,
  rgba,
  drawDriverInfo,
  drawFleet,
  drawLeads,
  drawNotifications,
  drawServiceForm,
  drawServiceHistory,
  drawServiceRow,
  tag,
  text,
} from './twins'

/* 15–17 · 05 Flota (46 долей). Панель прокручивается насквозь (П14) в
   «Flota»: сводка и карточки машин. Камера садится на Toyota Corolla — чипы
   сроков «Ubezpieczenie» и «Przegląd» (меньше 30 дней) поднимаются над
   карточкой слоями (3D). Чип «Przegląd» срывается и становится часами
   «08:59», барабаны щёлкают в «09:00» (З4), от часов к колокольчику панели
   бежит связь — золотой значок «1», выпадает «Powiadomienia» (крупно). Нырок
   в уведомление (К5) — окно машины, «Serwis»: «Dodaj wpis serwisowy» крупно,
   поля заполняются, новая запись встаёт в историю.

   0–20     общий план → панель; 14 — клик «Flota» в меню
   18–44    прокрутка насквозь с размытием по вертикали (П14)
   44–70    «Flota»: карточки машин; 70–96 — наезд на Corolla
   96–120   чипы поднимаются над карточкой, покачиваются; обводки
   100–186  выноска «Ubezpieczenia i przeglądy pod kontrolą.»
   186–212  чип «Przegląd» летит вверх (камера следует) и становится часами
   218–232  08:59 → 09:00, барабаны слева направо
   236–256  связь от часов к колокольчику; 256 — значок «1»
   262–350  «Powiadomienia» крупно; выноска 16
   352–372  нырок в уведомление; 372–398 — окно машины, «Serwis»
   420      «Dodaj»; 426–540 форма крупно: вид, описание, стоимость, пробег
   544      «Dodaj»; 550 — запись встаёт; 560–690 выноска 17 */

export const FLOTA_BEATS = 46

const T = {
  menu: 14,
  scroll: 18,
  fleet: 44,
  card: 70,
  chips: 96,
  chip: 186,
  clock: 206,
  tick: 218,
  link: 236,
  badge: 256,
  notice: 262,
  dive: 352,
  service: 372,
  add: 420,
  form: 426,
  kind: 456,
  desc: 462,
  cost: 506,
  submit: 544,
  entry: 550,
}
const END = FLOTA_BEATS * 15

/* ── Прокрутка насквозь (П14): полоса экранов в области содержимого ── */

const CONTENT = { x: 256, width: DESK.width - 256 }
const STRIP = [
  (ctx: CanvasRenderingContext2D) => drawDriverInfo(ctx, DESK.width, DESK.height, true),
  (ctx: CanvasRenderingContext2D) => drawLeads(ctx, DESK.width, DESK.height, true),
  (ctx: CanvasRenderingContext2D) => drawFleet(ctx, DESK.width, DESK.height, true),
]
const scrollAt = (frame: number) => easeInOut(span(frame, T.scroll, 26)) * (STRIP.length - 1) * DESK.height

/** Правка художника «Flota»: у Corolli чип «Przegląd» (x 198, ширина 132)
    выходит за карточку шириной 309 и залезает на соседнюю. В продукте
    карточка с overflow-hidden его обрезает — здесь так же: промежуток между
    карточками закрашивается фоном, соседняя карточка рисуется заново. */
function drawFleetFixed(ctx: CanvasRenderingContext2D, bell: number) {
  drawFleet(ctx, DESK.width, DESK.height, true, bell)
  const a = carSlot(1)
  const b = carSlot(2)
  ctx.fillStyle = TB.bg
  ctx.fillRect(a.x + a.width + 0.5, a.y, b.x - a.x - a.width - 1, a.height)
  ctx.save()
  ctx.translate(b.x, b.y)
  drawCarCard(ctx, CARS[2]!)
  ctx.restore()
}

/* ── Чипы Corolli и часы ── */

/** Надпись чипа сроков на языке ролика. */
const chipLabel = (i: number, lang: Lang) => pick(lang, CHIPS[i]!.label, CHIPS[i]!.labelEn)

/** Ширина чипа по его надписи, как в продукте (px-2, иконка 14, зазор, текст
    12 px): у художника CHIPS уже надписи — «Ubezpieczenie 15.10.2026» и
    «Przegląd 3.10.2026» обрезаны справа. */
const chipWidth = (i: number, lang: Lang) => Math.ceil(28 + textWidth(chipLabel(i, lang), 12, 400) + 9)

function drawChipFit(ctx: CanvasRenderingContext2D, i: number, lang: Lang) {
  const chip = CHIPS[i]!
  const width = chipWidth(i, lang)
  box(ctx, 0.5, 0.5, width - 1, chip.height - 1, 12, '#140c0c', rgba(chip.tone, 0.3))
  box(ctx, 0.5, 0.5, width - 1, chip.height - 1, 12, rgba(chip.tone, 0.1))
  icon(ctx, 'triangle-alert', 8, 6, 14, chip.ink)
  text(ctx, chipLabel(i, lang), 28, 17.5, { size: 12, weight: 400, color: chip.ink })
}

const COROLLA = carSlot(1)
const COROLLA_WORLD = deskRect(COROLLA)
const chipRest = (i: number, lang: Lang): Rect => deskRect({ x: COROLLA.x + CHIPS[i]!.x, y: COROLLA.y + CHIPS[i]!.y, width: chipWidth(i, lang), height: CHIPS[i]!.height })
const chipUp = (i: number, lang: Lang): Rect => {
  /* Поднятые чипы: на своём месте у низа карточки, крупнее на 10% и чуть выше
     (слой ближе к зрителю), рядом друг с другом по центру карточки. */
  const scale = 1.1
  const w = chipWidth(i, lang) * scale
  const h = CHIPS[i]!.height * scale
  const both = (chipWidth(0, lang) + chipWidth(1, lang)) * scale + 10
  const left = COROLLA_WORLD.x + COROLLA_WORLD.width / 2 - both / 2
  const x = i === 0 ? left : left + chipWidth(0, lang) * scale + 10
  return { x, y: COROLLA_WORLD.y + CHIPS[i]!.y - 5 - (h - CHIPS[i]!.height) / 2, width: w, height: h }
}

/** Часы над правым краем панели — туда улетает чип «Przegląd». */
const CLOCK = { x: DESK.x + DESK.width - 260, y: DESK.y - 150 }
const BELL = bellRect(DESK.width)
const BELL_WORLD = deskRect(BELL)
const NOTICE_RECT: Rect = { x: BELL.x + BELL.width - NOTICE.width, y: BELL.y + BELL.height + 8, width: NOTICE.width, height: NOTICE.height }
const NOTICE_WORLD = deskRect(NOTICE_RECT)

function chipFlight(frame: number, lang: Lang) {
  const t = glide(span(frame, T.chip, T.clock - T.chip + 6))
  const from = chipUp(1, lang)
  const x = mix(from.x + from.width / 2, CLOCK.x, t)
  const y = mix(from.y + from.height / 2, CLOCK.y, t) - Math.sin(Math.PI * t) * 60
  return { x, y, t, scale: mix(1, 1.5, easeIn(t)) }
}

/* ── Окно машины и форма записи ── */

const DIALOG = deskRect(SERVICE.dialog)
const FORM: Rect = deskRect({ x: (DESK.width - SERVICE_FORM.width) / 2, y: (DESK.height - SERVICE_FORM.height) / 2, width: SERVICE_FORM.width, height: SERVICE_FORM.height })
const HISTORY = deskRect({ x: SERVICE.firstRow.x, y: SERVICE.firstRow.y - 36, width: SERVICE.firstRow.width, height: SERVICE.firstRow.height * 3 + 36 + 24 })
const DESCRIPTION = SERVICE_NOTE.pl

/** Описание печатается по знаку раз в 1,2 кадра (по-польски). Английское —
    другой длины: печатается в том же темпе долей и кончается на том же кадре. */
function formFill(frame: number, lang: Lang): { filled: number; typed: string; done: boolean } {
  const count = frame < T.desc ? 0 : Math.min(DESCRIPTION.length, Math.floor((frame - T.desc) / 1.2) + 1)
  const full = pick(lang, DESCRIPTION, SERVICE_NOTE.en)
  const typed = full.slice(0, lang === 'en' ? Math.floor((count * full.length) / DESCRIPTION.length) : count)
  const filled = frame >= T.cost ? 3 : frame >= T.kind ? 1 : 0
  return { filled, typed, done: count >= DESCRIPTION.length }
}

/* ── Камера ── */

const DESK_VIEW = fit({ x: DESK.x, y: DESK.y - 46, width: DESK.width, height: DESK.height + 46 }, { margin: 60, max: 1.4 })
const CARDS_VIEW = fit(deskRect({ x: 288, y: 250, width: 960, height: 250 }), { max: 1.8, margin: 60 })
const COROLLA_VIEW = fit({ x: COROLLA_WORLD.x - 20, y: COROLLA_WORLD.y - 110, width: COROLLA_WORLD.width + 40, height: COROLLA_WORLD.height + 120 }, { max: 2.6, shift: [-280, -110], margin: 60 })
const CLOCK_VIEW = fit({ x: CLOCK.x - 250, y: CLOCK.y - 110, width: BELL_WORLD.x + 60 - (CLOCK.x - 250), height: BELL_WORLD.y + 60 - (CLOCK.y - 110) }, { max: 2.2, margin: 70 })

/** Вид на историю сервиса в конце главы — с него начинается «Mobile». */
export const HISTORY_VIEW = fit(HISTORY, { max: 2.15, shift: [-290, 0], margin: 60 })

/** Камера главы: за чипом «Przegląd» она следит по его ширине — чип по-английски
    другой, поэтому ключи — на каждый язык. */
const cameraKeys = (lang: Lang): CameraKey[] => [
  { at: 0, ...OVERVIEW },
  { at: 2, dur: 20, ...DESK_VIEW },
  { at: T.fleet - 2, dur: 24, ...CARDS_VIEW },
  { at: T.card, dur: 26, ...COROLLA_VIEW },
  { at: T.chip + 2, dur: 14, follow: follow((f) => [chipFlight(f, lang).x, chipFlight(f, lang).y], { zoom: (f) => mix(2.4, 1.9, glide(span(f, T.chip, 24))), lag: 5 }) },
  { at: T.clock + 4, dur: 24, ...CLOCK_VIEW },
  { at: T.notice + 2, dur: 24, ...focus(NOTICE_WORLD, { fill: 0.5, shift: [-300, 60] }) },
  { at: T.dive, dur: 20, ease: easeIn, ...cover({ x: NOTICE_WORLD.x + 10, y: NOTICE_WORLD.y + 40, width: NOTICE_WORLD.width - 20, height: 100 }) },
  { at: T.dive + 22, dur: 1, ...fit(DIALOG, { max: 3.4, margin: 0 }) },
  { at: T.dive + 24, dur: 30, ...fit(DIALOG, { max: 1.62, margin: 60 }) },
  { at: T.form + 2, dur: 24, ...focus(FORM, { fill: 0.5, tall: 0.88 }) },
  { at: T.entry + 4, dur: 26, ...HISTORY_VIEW },
]
const CAMERA: Record<Lang, CameraKey[]> = { pl: cameraKeys('pl'), en: cameraKeys('en') }

const CURSOR_KEYS = (() => {
  const [mx, my] = onDesk(128, 101 + 3 * 48 + 22)
  const [ax, ay] = onDesk(SERVICE.add.x + SERVICE.add.width / 2, SERVICE.add.y + SERVICE.add.height / 2)
  const [sx, sy] = [FORM.x + SERVICE_SUBMIT[0], FORM.y + SERVICE_SUBMIT[1]]
  return [
    { at: 0, x: mx + 180, y: my + 140 },
    { at: 12, x: mx, y: my },
    { at: 30, x: mx + 60, y: my + 120 },
    { at: 392, x: ax - 200, y: ay + 160 },
    { at: 416, x: ax, y: ay },
    { at: 436, x: ax + 60, y: ay + 150 },
    { at: 520, x: sx + 140, y: sy + 80 },
    { at: 540, x: sx, y: sy },
    { at: 556, x: sx + 80, y: sy + 110 },
  ]
})()
const CLICKS = [T.menu, T.add, T.submit]

export function Flota() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA[lang], frame)
  const scroll = scrollAt(frame)
  const speed = Math.abs(scrollAt(frame + 1) - scroll)
  const scrolling = frame >= T.scroll && frame < T.scroll + 27
  const chipsUp = spring(frame, T.chips, SPRINGS.glide)
  const tilt = easeInOut(span(frame, T.chips - 4, 16)) * (1 - easeInOut(span(frame, T.chip - 6, 16)))
  const sway = Math.sin((frame - T.chips) / 9) * 2.2 * chipsUp
  const chip = chipFlight(frame, lang)
  const bell = frame >= T.badge ? 1 : 0
  const badge = spring(frame, T.badge, SPRINGS.pop)
  const noticeIn = frame < T.dive + 22 ? spring(frame, T.notice, SPRINGS.pop) : 0
  const service = frame >= T.dive + 22
  const diveFlash = easeIn(span(frame, T.dive + 12, 10)) * (1 - easeOut(span(frame, T.dive + 22, 14)))
  const formIn = spring(frame, T.form, SPRINGS.pop) * (1 - easeIn(span(frame, T.submit + 2, 8)))
  const fill = formFill(frame, lang)
  const entry = frame >= T.entry
  const entryIn = spring(frame, T.entry, SPRINGS.pop)
  const dim = service ? 0.5 * easeOut(span(frame, T.form, 8)) * (1 - easeIn(span(frame, T.submit + 2, 8))) : 0
  const link = easeInOut(span(frame, T.link, 20))
  const layout = useMemo(() => {
    const bellCenter: Point = [BELL_WORLD.x + BELL_WORLD.width / 2, BELL_WORLD.y + BELL_WORLD.height / 2]
    return {
      bellCenter,
      clockFrom: [CLOCK.x + 190, CLOCK.y + 10] as Point,
      noticeText: deskRect({ x: NOTICE_RECT.x + 44, y: NOTICE_RECT.y + 60, width: textWidth(pick(lang, '🔧 Przegląd pojazdu', '🔧 Vehicle inspection'), 14, 500) + 4, height: 18 }),
    }
  }, [lang])
  const cursorWorld = cursorAt(CURSOR_KEYS, frame, CLICKS, 570)
  const cursorShown = frame < 40 || (frame >= 388 && frame < 580)
  const [cx, cy] = camera.project(cursorWorld.x, cursorWorld.y)
  const clicks = CLICKS.map((at) => {
    const p = cursorAt(CURSOR_KEYS, at)
    return { at, point: camera.project(p.x, p.y) }
  })

  /* Выноски. */
  const review = chipUp(1, lang)
  const chipsAt = camera.project(review.x + review.width + 8, review.y + review.height / 2)
  const corollaView = viewAt(CAMERA[lang], T.chips + 20)
  const corollaRight = corollaView.project(COROLLA_WORLD.x + COROLLA_WORLD.width + 20, 0)[0]
  const noticeAt = camera.project(layout.noticeText.x + layout.noticeText.width * 0.6, layout.noticeText.y + 9)
  const noticeView = viewAt(CAMERA[lang], T.notice + 30)
  const noticeRight = noticeView.project(NOTICE_WORLD.x + NOTICE_WORLD.width, 0)[0]
  const rowAt = camera.project(onDesk(SERVICE.firstRow.x + 200, SERVICE.firstRow.y + 30)[0], onDesk(0, SERVICE.firstRow.y + 30)[1])
  const historyView = viewAt(CAMERA[lang], T.entry + 40)
  const historyRight = historyView.project(HISTORY.x + HISTORY.width, 0)[0]

  /* Звук: панель проносится насквозь (П14); чипы сроков поднимаются; чип летит
     вверх и становится часами — иконка рисуется, цифры 8 → 9, 5 → 0, 9 → 0
     щёлкают, черта; значок «1» на колокольчике, «Powiadomienia»; форма записи:
     вид работ, описание печатается, стоимость и пробег; запись встаёт. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const center = (r: Rect) => at(r.x + r.width / 2, r.y + r.height / 2)
  const clockText = CLOCK.x - 250 + 96 + 26
  const clockY = CLOCK.y - 118 * 0.62 + (118 * 1.1) / 2
  useSoundTrack('taxi2d-scroll', 'whoosh', scrolling, at(DESK.x + CONTENT.x + CONTENT.width / 2, DESK.y + DESK.height / 2), { gain: 0.6 })
  useSoundCue('popIn', T.chips, at((chipUp(0, lang).x + review.x + review.width) / 2, chipUp(0, lang).y + chipUp(0, lang).height / 2), { gain: 0.7 })
  useSoundTrack('taxi2d-chip-flight', 'whoosh', frame > T.chip && frame <= T.clock + 6, at(chip.x, chip.y), { gain: 0.55 })
  useSoundCue('popIn', T.clock - 2, at(clockText + 120, clockY), { gain: 0.6 })
  useSoundCue('pen', T.clock, at(CLOCK.x - 250 + 48, clockY), { gain: 0.7, seconds: 0.6 })
  useSoundPoints(
    'tick',
    [1, 3, 4].map((i) => ({ at: T.tick + (4 - i) * 2 + 5, ...at(clockText + textWidth('09:00'.slice(0, i), 118, 800, -0.02) + textWidth('09:00'[i]!, 118, 800, -0.02) / 2, clockY) })),
    { gain: 0.7 },
  )
  useSoundCue('pen', T.tick + 14, at(clockText + textWidth('09:00', 118, 800, -0.02) / 2, clockY + 70), { gain: 0.8, seconds: 0.4 })
  useSoundCue('notify', T.badge, at(...layout.bellCenter), { gain: 0.75 })
  useSoundCue('popIn', T.notice, center(NOTICE_WORLD), { gain: 0.7 })
  useSoundCue('popIn', T.form, center(FORM), { gain: 0.8 })
  useSoundCue('tick', T.kind, at(FORM.x + 160, FORM.y + 120), { gain: 0.5 })
  useSoundCues('key', typingFrames(T.desc, 1.2, DESCRIPTION.length), at(FORM.x + 150, FORM.y + 188), { gain: 0.55 })
  useSoundCue('tick', T.cost, at(FORM.x + 160, FORM.y + 290), { gain: 0.5 })
  useSoundCue('success', T.entry, at(...onDesk(SERVICE.firstRow.x + SERVICE.firstRow.width / 2, SERVICE.firstRow.y + SERVICE.firstRow.height / 2)), { gain: 0.8 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <TaxiPhone>
          <Live width={393} height={852} ratio={2} draw={(ctx) => drawCabinetCar(ctx, true)} />
        </TaxiPhone>

        <Desk>
          {!service ? (
            <Live key="fleet" width={DESK.width} height={DESK.height} ratio={2.4} state={frame < T.scroll ? 'info' : `fleet${bell}`} draw={(ctx) => (frame < T.scroll ? drawDriverInfo(ctx, DESK.width, DESK.height, true) : drawFleetFixed(ctx, bell))} />
          ) : (
            <Live key="service" width={DESK.width} height={DESK.height} ratio={2.4} state={String(entry)} draw={(ctx) => drawServiceHistory(ctx, DESK.width, DESK.height, entry)} />
          )}
          {/* П14: область содержимого проносится насквозь, с размытием по вертикали. */}
          {scrolling && (
            <div style={{ position: 'absolute', left: CONTENT.x, top: 0, width: CONTENT.width, height: DESK.height, overflow: 'hidden', background: TB.bg }}>
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <filter id="taxi-vblur" x="0" y="-10%" width="100%" height="120%">
                  <feGaussianBlur stdDeviation={`0 ${Math.min(26, speed * 0.28).toFixed(2)}`} />
                </filter>
              </svg>
              <div style={{ position: 'absolute', left: 0, top: -scroll, width: CONTENT.width, height: DESK.height * STRIP.length, filter: speed > 2 ? 'url(#taxi-vblur)' : undefined }}>
                {STRIP.map((draw, i) => (
                  <Live
                    key={i}
                    width={CONTENT.width}
                    height={DESK.height}
                    ratio={1.2}
                    draw={(ctx) => {
                      ctx.translate(-CONTENT.x, 0)
                      draw(ctx)
                    }}
                    style={{ top: i * DESK.height }}
                  />
                ))}
              </div>
            </div>
          )}
          {/* Corolla: чипы поднимаются слоями над наклонённой карточкой. */}
          {frame >= T.chips - 6 && !service && <div style={{ position: 'absolute', left: COROLLA.x - 2, top: COROLLA.y - 2, width: CAR_CARD.width + 4, height: CAR_CARD.height + 4, borderRadius: 13, background: TB.bg, border: '1px solid rgba(255, 255, 255, 0.05)', boxSizing: 'border-box' }} />}
          {frame >= T.chips - 6 && !service && (
            <div style={{ position: 'absolute', left: COROLLA.x, top: COROLLA.y, width: CAR_CARD.width, height: CAR_CARD.height, transformOrigin: '50% 100%', transform: tilt > 0.001 ? `perspective(1200px) rotateX(${tilt * 16}deg)` : undefined, borderRadius: 12, boxShadow: tilt > 0.01 ? SHADOW.card : undefined }}>
              <Live width={CAR_CARD.width} height={CAR_CARD.height} ratio={3.2} draw={(ctx) => drawCarCard(ctx, CARS[1]!, false)} />
            </div>
          )}
          <Glow frame={frame} at={T.fleet} rect={COROLLA} color={GOLD} strength={0.14} />
          {/* Колокольчик: золотой значок «1» выскакивает. */}
          {frame >= T.badge && !service && (
            <div style={{ position: 'absolute', left: BELL.x + 34 - 13, top: BELL.y + 2 - 13, width: 26, height: 26, borderRadius: 13, background: GOLD, transform: `scale(${Math.max(0, badge) * 1.0})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: TB.bg }}>
              1
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim }} />
          {service && (
            <>
              <Glow frame={frame} at={T.entry} rect={SERVICE.firstRow} color={GOLD} strength={0.24} dur={30} />
              {entry && (
                <div style={{ position: 'absolute', left: SERVICE.firstRow.x, top: SERVICE.firstRow.y, width: SERVICE.firstRow.width, height: SERVICE.firstRow.height, borderRadius: 12, overflow: 'hidden', opacity: clamp01(entryIn * 1.6), transform: `translateY(${(1 - clamp01(entryIn)) * -16}px) scale(${mix(0.96, 1, entryIn)})`, boxShadow: entryIn < 0.98 ? SHADOW.card : undefined }}>
                  <Live width={SERVICE.firstRow.width} height={SERVICE.firstRow.height} ratio={3.2} draw={drawServiceRow} />
                </div>
              )}
              <Scribble rect={{ x: SERVICE.firstRow.x, y: SERVICE.firstRow.y, width: SERVICE.firstRow.width, height: SERVICE.firstRow.height }} color={GOLD} width={2.4} pad={[12, 8]} seed={4} p={easeOut(span(frame, T.entry + 30, 16))} />
            </>
          )}
        </Desk>

        {/* Поднятые чипы сроков (3D-слои): тень, покачивание, обводки. */}
        {frame >= T.chips - 2 && frame < T.clock + 10 &&
          [0, 1].map((i) => {
            const rest = chipRest(i, lang)
            const up = chipUp(i, lang)
            const flying = i === 1 && frame >= T.chip
            const r = flying ? { x: chip.x - up.width / 2, y: chip.y - up.height / 2, width: up.width, height: up.height } : { x: mix(rest.x, up.x, chipsUp), y: mix(rest.y, up.y, chipsUp), width: mix(rest.width, up.width, chipsUp), height: mix(rest.height, up.height, chipsUp) }
            const fade = flying ? 1 - easeIn(span(frame, T.clock - 8, 8)) : i === 0 ? 1 - easeIn(span(frame, T.chip + 4, 10)) : 1
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: r.x,
                  top: r.y,
                  width: r.width,
                  height: r.height,
                  borderRadius: 12 * (r.height / CHIPS[i]!.height),
                  boxShadow: `0 ${10 * chipsUp}px ${24 * chipsUp}px rgba(15, 23, 42, ${0.28 * chipsUp})`,
                  opacity: fade,
                  transform: `rotate(${(i === 0 ? -1 : 1) * sway}deg) scale(${flying ? chip.scale : 1})`,
                }}
              >
                <Live width={chipWidth(i, lang)} height={CHIPS[i]!.height} ratio={6} draw={(ctx) => drawChipFit(ctx, i, lang)} style={{ transformOrigin: '0 0', transform: `scale(${r.width / chipWidth(i, lang)}, ${r.height / CHIPS[i]!.height})` }} />
              </div>
            )
          })}
        {[0, 1].map((i) => (
          <Scribble key={i} rect={chipUp(i, lang)} color={ACCENT} width={2.2} pad={[10, 7]} seed={i + 11} p={easeOut(span(frame, T.chips + 18 + i * 8, 14)) * (1 - easeIn(span(frame, T.chip - 4, 6)))} />
        ))}

        {/* Часы: 08:59 → 09:00, барабаны слева направо (З4). */}
        {frame >= T.clock - 6 && frame < T.dive && <Clock frame={frame} />}
        {frame >= T.link && frame < T.dive && (
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - easeIn(span(frame, T.notice + 40, 14)) }}>
            <Connector from={layout.clockFrom} to={[layout.bellCenter[0], layout.bellCenter[1] - 26]} bend={0.6} p={link} frame={frame} flowing={1 - easeOut(span(frame, T.notice + 20, 20))} color={ACCENT} />
          </div>
        )}

        {/* «Powiadomienia» выпадает под колокольчиком. */}
        {noticeIn > 0.002 && (
          <div
            style={{
              position: 'absolute',
              left: NOTICE_WORLD.x,
              top: NOTICE_WORLD.y,
              width: NOTICE_WORLD.width,
              height: NOTICE_WORLD.height,
              borderRadius: 24,
              boxShadow: SHADOW.lifted,
              opacity: clamp01(noticeIn * 1.6),
              transformOrigin: '90% 0%',
              transform: `translateY(${(1 - clamp01(noticeIn)) * -18}px) scale(${mix(0.9, 1, clamp01(noticeIn))})`,
            }}
          >
            <Live width={NOTICE.width} height={NOTICE.height} ratio={5} draw={drawNotifications} />
          </div>
        )}

        {/* Форма «Dodaj wpis serwisowy»: вид работ, описание печатается, стоимость и пробег. */}
        {formIn > 0.002 && (
          <div
            style={{
              position: 'absolute',
              left: FORM.x,
              top: FORM.y,
              width: FORM.width,
              height: FORM.height,
              borderRadius: 24,
              boxShadow: SHADOW.lifted,
              opacity: clamp01(formIn * 1.6),
              transform: formIn < 0.999 ? `perspective(1600px) rotateX(${(1 - clamp01(formIn)) * 14}deg) scale(${mix(0.94, 1, formIn)})` : undefined,
            }}
          >
            <Live
              width={SERVICE_FORM.width}
              height={SERVICE_FORM.height}
              ratio={3.4}
              state={`${fill.filled}|${fill.typed}|${Math.floor(frame / 8) % 2}`}
              draw={(ctx) => {
                drawServiceForm(ctx, Math.min(fill.filled, 1))
                if (fill.typed) {
                  const width = text(ctx, fill.typed, 38, 194, { size: 14, weight: 400, color: TB.text })
                  if (!fill.done && Math.floor(frame / 8) % 2 === 0) {
                    ctx.fillStyle = TB.gold
                    ctx.fillRect(39 + width, 180, 1.6, 18)
                  }
                }
                if (fill.filled >= 3) {
                  text(ctx, '350', 38, 294, { size: 14, weight: 400, color: TB.text })
                  text(ctx, '15000', 246, 294, { size: 14, weight: 400, color: TB.text })
                }
              }}
            />
          </div>
        )}
      </Camera>

      {/* Нырок (К5): строка уведомления заполняет кадр — и становится окном машины. */}
      {diveFlash > 0.002 && <div style={{ position: 'absolute', inset: 0, background: '#15171b', opacity: diveFlash }} />}
      {cursorShown &&
        clicks.map(({ at, point }) => (
          <Ripple key={at} x={point[0]} y={point[1]} at={at} />
        ))}
      {cursorShown && <Cursor x={cx} y={cy} press={cursorWorld.press} opacity={cursorWorld.opacity * (frame < 40 ? 1 - span(frame, 30, 8) : 1)} />}

      {/* Рамка «15 · Flota» у низа кадра: в английском ролике (плеер сайта срезает
          до 8% сверху и снизу) она поднята так, чтобы низ рамки остался выше 990. */}
      <Callout anchor={chipsAt} box={{ x: inFrame(corollaRight + 90, 520), y: Math.min(chipsAt[1] + 110, lang === 'en' ? 800 : 1080 - 230), width: 520 }} tag={tag(15, lang)} title={caption(15, lang)} at={T.chips + 12} until={T.chip - 6} />
      <Callout anchor={noticeAt} box={{ x: inFrame(noticeRight + 60, 560), y: noticeAt[1] + 70, width: 560 }} tag={tag(16, lang)} title={caption(16, lang)} at={T.notice + 14} until={T.dive - 6} />
      {/* Время чтения — по польской подписи: тайминг от языка не зависит. */}
      <Callout anchor={rowAt} box={{ x: inFrame(historyRight + 60, 520), y: rowAt[1] - 220, width: 520 }} tag={tag(17, lang)} title={caption(17, lang)} at={T.entry + 20} until={Math.min(END - 24, T.entry + 20 + readFrames(caption(17)) + 90)} />
    </AbsoluteFill>
  )
}

/** Часы из чипа «Przegląd» (наш декор, не экран продукта): иконка будильника
    рисуется контуром, цифры 08:59 встают барабанами, потом 8 → 9, 5 → 0,
    9 → 0 перекатываются слева направо (З4). */
function Clock({ frame }: { frame: number }) {
  const appear = spring(frame, T.clock - 2, SPRINGS.pop) * (1 - easeIn(span(frame, T.dive - 10, 8)))
  const size = 118
  const from = '08:59'
  const to = '09:00'
  return (
    <div
      style={{
        position: 'absolute',
        left: CLOCK.x - 250,
        top: CLOCK.y - size * 0.62,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        opacity: clamp01(appear * 1.6),
        transform: `scale(${mix(0.86, 1, clamp01(appear))})`,
        transformOrigin: '70% 50%',
      }}
    >
      <Glyph name="alarmClock" size={96} stroke={1.6} color={INK} p={easeOut(span(frame, T.clock, 18))} />
      <div style={{ position: 'relative', display: 'flex', fontFamily: FONT, fontSize: size, fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {Array.from(to).map((ch, i) => {
          const old = from[i]!
          const roll = old === ch ? 1 : spring(frame, T.tick + (4 - i) * 2, SPRINGS.snap)
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', height: '1.1em', overflow: 'hidden' }}>
              <span style={{ visibility: 'hidden' }}>{ch}</span>
              <span style={{ position: 'absolute', left: 0, top: 0, display: 'flex', flexDirection: 'column', transform: `translateY(${-clamp01(roll) * 1.1}em)` }}>
                <span style={{ height: '1.1em' }}>{old}</span>
                <span style={{ height: '1.1em' }}>{ch}</span>
              </span>
            </span>
          )
        })}
        <span
          style={{
            position: 'absolute',
            left: -4,
            right: -6,
            bottom: -10,
            height: 9,
            borderRadius: 999,
            background: ACCENT,
            clipPath: `inset(0 ${(1 - easeInOut(span(frame, T.tick + 14, 12))) * 100}% 0 0 round 999px)`,
            transform: 'rotate(-0.6deg)',
          }}
        />
      </div>
    </div>
  )
}

export { END as FLOTA_END }
