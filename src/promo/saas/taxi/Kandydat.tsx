import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Swipe, Tap } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { SHADOW, tint, type Point, type Rect } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { calcHead, inFrame } from './geometry'
import { DeskEnter, Pop, Sweep, typingFrames } from './fx'
import { Glyph } from './glyphs'
import { hookDot } from './Hook'
import { DESK, Desk, Live, PHONE, PHONE_SCREEN, TaxiPhone, deskRect, onPhone, phoneRect } from './screen'
import {
  CALC_TOP,
  GOLD,
  HERO,
  LANDING_EN,
  LEADS,
  LEAD_ROW,
  RESULT,
  SCROLL,
  TB,
  WEB_TOP,
  calcButton,
  calcOption,
  caption,
  drawDisclaimer,
  drawLanding,
  drawLeadRow,
  drawLeads,
  drawResultTile,
  drawThanks,
  tag,
  type CalcState,
} from './twins'

/* 03–05 · 01 Kandydat (48 долей). Точка из крючка раскрывается в экран
   iPhone: лендинг «Zarabiaj Do / 80 PLN/godz». Свайп вверх — калькулятор:
   10 часов, 6 дней, «Dalej» растёт на весь экран (П1) и становится формой;
   имя и номер печатаются, «Kontynuuj» — золотой шар считает, результат
   встаёт плитками, «Dziękujemy» ставит галочку. Карточка отрывается от экрана
   (м-отрыв) и летит через кадр в панель владельца — камера следует за ней;
   окно панели открывается, как крышка, карточка становится первой строкой
   «Leady».

   0–28      точка → экран телефона, корпус встаёт в 3D
   30–60     наезд на первый экран; 50 — черта под «80 PLN/godz»
   66–86     свайп, страница едет к калькулятору; 84–112 — наезд ×2,1
   112 «10», 142 «Dalej», 168 «6», 194 «Dalej» → П1 (196–210)
   118–200   выноска «Kalkulator zarobków zbiera kandydatów całą dobę.»
   204–300   форма: имя (226–258), номер (262–286), черта под номером
   306       «Kontynuuj»; 310–368 золотой шар, «Obliczanie…»
   370–444   результат: плитки (378, 382), оговорка, обводка итога
   444–530   «Dziękujemy, Oleksandr Bondar!» — галочка, читается
   530–546   карточка отрывается, экран темнеет на 20%
   546–604   полёт в панель (камера следует), 548–580 — окно открывается
   604–720   строка встала первой, вспышка; «Kalkulator» обведён;
             выноска «Zgłoszenie od razu w panelu floty.» */

export const KANDYDAT_BEATS = 48
const KANDYDAT_END = KANDYDAT_BEATS * 15

const T = {
  hero: 30,
  rate: 48,
  swipe: 66,
  scroll: 68,
  calcCam: 84,
  hours: 112,
  next1: 142,
  days: 168,
  next2: 194,
  formCam: 204,
  name: 226,
  phone: 262,
  go: 306,
  results: 370,
  tiles: 378,
  ring: 398,
  thanks: 446,
  lift: 530,
  flight: 546,
  land: 604,
  source: 622,
}

const FLIGHT = { start: T.flight, dur: T.land - T.flight }
/** Форма контактов — при этой прокрутке целиком над адресной строкой (как в 3D). */
const SCROLL_FORM = 330
const calcTop = (scroll: number) => WEB_TOP + CALC_TOP - scroll

/** Где стоит страница (прокрутка) и в каком состоянии калькулятор. */
function page(frame: number): { scroll: number; calc: CalcState; caret: boolean } {
  const blink = Math.floor(frame / 8) % 2 === 0
  if (frame < T.scroll) return { scroll: 0, calc: { step: 1, value: 8 }, caret: false }
  if (frame < T.next1 + 1) {
    const scroll = Math.round(SCROLL.calc * easeInOut(span(frame, T.scroll, 18)) * 2) / 2
    return { scroll, calc: { step: 1, value: frame >= T.hours + 1 ? 10 : 8 }, caret: false }
  }
  if (frame < T.next2 + 12) return { scroll: SCROLL.calc, calc: { step: 2, value: frame >= T.days + 1 ? 6 : 5 }, caret: false }
  if (frame < T.go + 2) {
    const name = HERO.name.slice(0, Math.max(0, Math.min(HERO.name.length, Math.floor((frame - T.name) / 2) + 1)))
    const phone = HERO.phone.slice(0, Math.max(0, Math.min(HERO.phone.length, Math.floor((frame - T.phone) / 1.6) + 1)))
    return { scroll: SCROLL_FORM, calc: { step: 3, name: frame >= T.name ? name : '', phone: frame >= T.phone ? phone : '' }, caret: blink }
  }
  if (frame < T.results) return { scroll: SCROLL_FORM, calc: { step: 4 }, caret: false }
  return { scroll: SCROLL.result, calc: { step: 5 }, caret: false }
}

/* ── Где что на экране (pt) ── */

const TOP_CALC = calcTop(SCROLL.calc)
const TOP_FORM = calcTop(SCROLL_FORM)
const TOP_RESULT = calcTop(SCROLL.result)
const option = (step: 1 | 2, i: number): Point => [calcOption(step, i).x + 28, TOP_CALC + calcOption(step, i).y + 28]
const HOURS_AT = option(1, 3)
const DAYS_AT = option(2, 3)
const NEXT1 = calcButton(1)
const NEXT2 = calcButton(2)
const GO = calcButton(3)
const NEXT1_AT: Point = [NEXT1.x + NEXT1.width / 2, TOP_CALC + NEXT1.y + NEXT1.height / 2]
const NEXT2_RECT: Rect = { x: NEXT2.x, y: TOP_CALC + NEXT2.y, width: NEXT2.width, height: NEXT2.height }
const GO_AT: Point = [GO.x + GO.width / 2, TOP_FORM + GO.y + GO.height / 2]
const TILE_Y = TOP_RESULT + RESULT.tiles.y
const THANKS: Rect = { x: RESULT.thanks.x, y: TOP_RESULT + RESULT.thanks.y, width: RESULT.thanks.width, height: RESULT.thanks.height }
/** Базовая линия номера в форме: шапка шага, поле имени (102 pt), подпись (28) и
    текст поля (35) — как calcCard в motion/taxi.ts (шапка — на языке ролика). */
function phoneField(lang: Lang): Rect {
  const head = calcHead(
    pick(lang, 'Wprowadź Swoje Dane Kontaktowe', 'Enter Your Contact Information'),
    pick(lang, 'Potrzebujemy Twoich danych aby pokazać spersonalizowane zarobki', 'We need your details to show personalized earnings'),
  )
  const baseline = TOP_FORM + 24 + head + 102 + 28 + 35
  return { x: 88, y: baseline - 13, width: textWidth(HERO.phone, 16, 400), height: 13 }
}

/** «80 PLN/godz» первого экрана: металлическое золото 36 pt по центру, базовая линия 214. */
function rateLine(lang: Lang): Rect {
  const width = textWidth(pick(lang, '80 PLN/godz', LANDING_EN.rate), 36, 700, -0.5 / 36)
  return { x: 196.5 - width / 2, y: 214 - 26, width, height: 26 }
}
/** Золотой шар расчёта: 96 pt, центр — py-12 + 48 от верха карточки. */
const ORB: Point = [196.5, TOP_FORM + 96]

/* ── Полёт карточки «Dziękujemy» в первую строку «Leady» ── */

const ROW: Rect = deskRect(LEAD_ROW)
const THANKS_WORLD = phoneRect(THANKS)
const FROM: Point = [THANKS_WORLD.x + THANKS_WORLD.width / 2, THANKS_WORLD.y + THANKS_WORLD.height / 2]
const TO: Point = [ROW.x + ROW.width / 2, ROW.y + ROW.height / 2]

function flyer(frame: number) {
  const t = glide(span(frame, FLIGHT.start, FLIGHT.dur))
  /* Дуга: карточка поднимается над кадром и садится в строку. */
  const x = mix(FROM[0], TO[0], t)
  const y = mix(FROM[1], TO[1], t) - Math.sin(Math.PI * t) * 150
  const morph = easeInOut(span(frame, FLIGHT.start + FLIGHT.dur * 0.3, FLIGHT.dur * 0.45))
  const width = mix(THANKS_WORLD.width, ROW.width, morph)
  const height = mix(THANKS_WORLD.height, ROW.height, morph)
  const lift = easeOut(span(frame, T.lift, 12))
  const scale = 1 + 0.06 * lift * (1 - t)
  return { x, y, width, height, morph, t, scale, lift }
}

/* ── Камера ── */

const HERO_VIEW = { x: 960, y: onPhone(0, 300)[1], zoom: 1.55 }
const CALC_RECT = phoneRect({ x: 16, y: TOP_CALC, width: 361, height: 372 })
const FORM_RECT = phoneRect({ x: 16, y: TOP_FORM, width: 361, height: 544 })
const LOAD_RECT = phoneRect({ x: 16, y: TOP_FORM, width: 361, height: 300 })
const RESULT_RECT = phoneRect({ x: 16, y: TOP_RESULT, width: 361, height: RESULT.disclaimer + 44 })
const TABLE_RECT = deskRect({ x: LEAD_ROW.x, y: 336, width: 650, height: 52 + LEAD_ROW.height * 2.4 })

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: T.hero, dur: 30, ...HERO_VIEW },
  { at: T.calcCam, dur: 28, ...fit(CALC_RECT, { max: 2.1, shift: [-290, 0], margin: 70 }) },
  { at: T.formCam, dur: 26, ...fit(FORM_RECT, { max: 1.72, margin: 70 }) },
  { at: T.go + 2, dur: 22, ...fit(LOAD_RECT, { max: 2.3, margin: 70 }) },
  { at: T.results + 2, dur: 26, ...fit(RESULT_RECT, { max: 2.25, margin: 70 }) },
  { at: T.thanks + 2, dur: 26, ...fit(phoneRect(THANKS), { max: 2.5, shift: [0, 10], margin: 70 }) },
  { at: T.lift - 6, dur: 20, ...fit(phoneRect(THANKS), { max: 1.9, margin: 70 }) },
  { at: T.flight + 2, dur: 18, follow: follow((f) => [flyer(f).x, flyer(f).y], { zoom: (f) => mix(1.7, 1.05, glide(span(f, FLIGHT.start, FLIGHT.dur))), lag: 6 }) },
  { at: T.land - 4, dur: 28, ...fit(TABLE_RECT, { max: 1.9, shift: [-310, 40], margin: 60 }) },
]

export function Kandydat() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const state = page(frame)
  const fly = flyer(frame)
  const marks = useMemo(() => ({ rate: rateLine(lang), phone: phoneField(lang) }), [lang])
  const leave = glide(span(frame, KANDYDAT_END, 26))

  /* Экран: точка → экран (портал), корпус встаёт в 3D, лендинг проявляется. */
  const dot = hookDot(lang)
  const open = glide(span(frame, 0, 15))
  const body = spring(frame, 0, SPRINGS.heavy)
  const power = easeOut(span(frame, 15, 10))

  /* П1 внутри экрана: «Dalej» растёт на весь экран и становится формой. */
  const grow = easeInOut(span(frame, T.next2 + 2, 12))
  const growFade = 1 - easeIn(span(frame, T.next2 + 13, 9))

  const dim = 0.2 * easeOut(span(frame, T.lift, 10)) * (frame < T.flight + 20 ? 1 : 1 - easeIn(span(frame, T.flight + 20, 12)))
  const deskOpen = spring(frame, T.flight + 2, SPRINGS.heavy)
  const deskPower = easeOut(span(frame, T.flight + 18, 14))
  const landed = span(frame, T.land, 24)

  const [hx, hy] = camera.project(...onPhone(...HOURS_AT))
  const calloutView = viewAt(CAMERA, T.hours + 10)
  const calcRight = calloutView.project(CALC_RECT.x + CALC_RECT.width, CALC_RECT.y)[0]
  const sourceRect: Rect = deskRect({ x: LEAD_ROW.x + 386 - 8, y: LEAD_ROW.y + 22, width: 118, height: 32 })
  const leadAnchor = camera.project(sourceRect.x + sourceRect.width + 14, sourceRect.y + 2)
  const leadView = viewAt(CAMERA, T.source + 20)
  const leadBox = leadView.project(TABLE_RECT.x + TABLE_RECT.width, TABLE_RECT.y)

  /* Звук: точка раскрывается в экран (портал) и корпус встаёт; «Dalej» растёт
     (П1); имя и номер печатаются; шар расчёта, плитки, «Dziękujemy» с
     галочкой; карточка отрывается и летит в «Leady», окно панели открывается
     крышкой, блик, строка садится. Точки мира — через камеру. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const phoneAt = (x: number, y: number) => at(...onPhone(x, y))
  const deskCenter = at(DESK.x + DESK.width / 2, DESK.y + DESK.height / 2)
  useSoundTrack('taxi2d-portal', 'whoosh', frame >= 0 && frame <= 15, { x: mix(dot[0], PHONE.cx, open), y: mix(dot[1], PHONE.cy, open) }, { gain: 0.6 })
  useSoundCue('thump', 16, at(PHONE.cx, PHONE.cy), { gain: 0.45 })
  useSoundCue('whoosh', T.next2 + 2, phoneAt(196.5, 426), { gain: 0.5, seconds: 0.45 })
  useSoundCues('key', typingFrames(T.name, 2, HERO.name.length), phoneAt(149, marks.phone.y - 96), { gain: 0.6 })
  useSoundCues('key', typingFrames(T.phone, 1.6, HERO.phone.length), phoneAt(149, marks.phone.y + 6), { gain: 0.6 })
  useSoundCue('popIn', T.go + 4, phoneAt(...ORB), { gain: 0.5 })
  useSoundCue('popOut', T.results - 4, phoneAt(...ORB), { gain: 0.4 })
  useSoundCue('popIn', T.tiles, phoneAt(196.5, TILE_Y + RESULT.tiles.height / 2), { gain: 0.8 })
  useSoundCue('success', T.thanks + 11, at(FROM[0], THANKS_WORLD.y + 70), { gain: 0.85 })
  useSoundCue('pen', T.thanks + 7, at(FROM[0], THANKS_WORLD.y + 40), { gain: 0.8, seconds: 0.33 })
  useSoundCue('air', T.lift, at(...FROM), { gain: 0.3, seconds: 0.45 })
  useSoundTrack('taxi2d-thanks-flight', 'whoosh', frame > T.flight && frame <= T.land, at(fly.x, fly.y), { gain: 0.6 })
  useSoundCue('air', T.flight + 2, deskCenter, { gain: 0.5, seconds: 0.8 })
  useSoundCue('glint', T.flight + 26, deskCenter, { gain: 0.35, seconds: 0.7 })
  useSoundCue('thump', T.land, at(...TO), { gain: 0.7 })

  return (
    <AbsoluteFill>
      <Swing t={-leave}>
      <Camera view={camera}>
        {/* Панель владельца: окно открывается, как крышка ноутбука, когда к нему летит карточка. */}
        {frame >= T.flight - 2 && (
          <DeskEnter t={deskOpen} kind="lid">
            <Desk>
              <Live width={DESK.width} height={DESK.height} ratio={2.4} draw={(ctx) => drawLeads(ctx, DESK.width, DESK.height, false)} style={{ opacity: deskPower }} />
              <Sweep frame={frame} at={T.flight + 26} width={DESK.width} height={DESK.height} />
            </Desk>
          </DeskEnter>
        )}

        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, perspective: 2200, perspectiveOrigin: `${PHONE.cx}px ${PHONE.cy}px` }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: `${PHONE.cx}px ${PHONE.cy}px`,
              transform: body < 0.999 ? `rotateY(${(1 - body) * -18}deg)` : undefined,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: frame < 30 ? easeOut(span(frame, 13, 7)) : 1 }}>
            <TaxiPhone
              overlay={
                <>
                  {/* Оверлеи результата — плитки и оговорка встают пружиной (pop). */}
                  {frame >= T.tiles && (
                    <>
                      <Pop frame={frame} at={T.tiles} rect={{ x: RESULT.tiles.left, y: TILE_Y, width: RESULT.tiles.width, height: RESULT.tiles.height }}>
                        <Live width={RESULT.tiles.width} height={RESULT.tiles.height} ratio={4} draw={(ctx) => drawResultTile(ctx, false)} />
                      </Pop>
                      <Pop frame={frame} at={T.tiles + 4} rect={{ x: RESULT.tiles.right, y: TILE_Y, width: RESULT.tiles.width, height: RESULT.tiles.height }}>
                        <Live width={RESULT.tiles.width} height={RESULT.tiles.height} ratio={4} draw={(ctx) => drawResultTile(ctx, true)} />
                      </Pop>
                      <Pop frame={frame} at={T.tiles + 9} rect={{ x: 40, y: TOP_RESULT + RESULT.disclaimer, width: 313, height: 34 }}>
                        <Live width={313} height={34} ratio={4} draw={drawDisclaimer} />
                      </Pop>
                    </>
                  )}
                  {/* П1: нажатая «Dalej» растёт на весь экран. */}
                  {frame > T.next2 + 1 && growFade > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: mix(NEXT2_RECT.x, 0, grow),
                        top: mix(NEXT2_RECT.y, 0, grow),
                        width: mix(NEXT2_RECT.width, 393, grow),
                        height: mix(NEXT2_RECT.height, 852, grow),
                        borderRadius: mix(12, 0, grow),
                        background: `linear-gradient(135deg, ${GOLD}, #E68600)`,
                        opacity: growFade,
                      }}
                    />
                  )}
                  {frame >= T.go + 2 && frame < T.results + 4 && <Orb frame={frame} at={T.go + 4} leave={T.results - 4} />}
                  <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim }} />
                  <Swipe from={[214, 650]} to={[214, 420]} at={T.swipe} dur={16} />
                  <Tap x={HOURS_AT[0]} y={HOURS_AT[1]} at={T.hours} />
                  <Tap x={NEXT1_AT[0]} y={NEXT1_AT[1]} at={T.next1} />
                  <Tap x={DAYS_AT[0]} y={DAYS_AT[1]} at={T.days} />
                  <Tap x={NEXT2_RECT.x + NEXT2_RECT.width / 2} y={NEXT2_RECT.y + NEXT2_RECT.height / 2} at={T.next2} />
                  <Tap x={GO_AT[0]} y={GO_AT[1]} at={T.go} />
                  {/* Выделения пером: «80 PLN/godz», «10», номер, итог. */}
                  <Scribble rect={marks.rate} kind="underline" color={GOLD} width={2.4} p={easeOut(span(frame, T.rate, 12)) * (1 - easeIn(span(frame, T.swipe, 6)))} />
                  <Scribble rect={{ x: HOURS_AT[0] - 28, y: HOURS_AT[1] - 28, width: 56, height: 56 }} color={GOLD} width={2.2} pad={[9, 6]} seed={3} p={easeOut(span(frame, T.hours + 2, 12)) * (1 - easeIn(span(frame, T.next1 - 2, 6)))} />
                  <Scribble rect={marks.phone} kind="underline" color={GOLD} width={2.2} p={easeOut(span(frame, T.phone + 26, 10)) * (1 - easeIn(span(frame, T.go - 2, 5)))} />
                  <Scribble
                    rect={{ x: RESULT.tiles.right, y: TILE_Y, width: RESULT.tiles.width, height: RESULT.tiles.height }}
                    color={GOLD}
                    width={2.2}
                    pad={[12, 9]}
                    seed={5}
                    p={easeOut(span(frame, T.ring, 14)) * (1 - easeIn(span(frame, T.thanks - 4, 6)))}
                  />
                </>
              }
            >
              <Live width={393} height={852} ratio={3} state={JSON.stringify(state)} draw={(ctx) => drawLanding(ctx, lang === 'en' ? { ...state, lang: LANDING_EN } : state)} style={{ opacity: power }} />
            </TaxiPhone>
            </div>
            {/* Портал: точка из крючка летит в центр и растёт в экран телефона —
                золото гаснет в тёмный фон продукта, вокруг проступает корпус. */}
            {frame < 28 && (
              <div
                style={{
                  position: 'absolute',
                  left: mix(dot[0] - 15, PHONE_SCREEN.x, open),
                  top: mix(dot[1] - 15, PHONE_SCREEN.y, open),
                  width: mix(30, PHONE_SCREEN.width, open),
                  height: mix(30, PHONE_SCREEN.height, open),
                  borderRadius: mix(15, 52, open),
                  background: `linear-gradient(135deg, ${GOLD}, #E68600)`,
                  overflow: 'hidden',
                  opacity: 1 - easeIn(span(frame, 16, 5)),
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: TB.bg, opacity: easeInOut(span(frame, 10, 5)) }} />
              </div>
            )}
          </div>
        </div>

        {/* «Dziękujemy» — карточка поверх экрана; отрывается и летит в «Leady». */}
        {frame >= T.thanks && (
          <ThanksFlyer frame={frame} fly={fly} landed={landed} />
        )}
        {/* «Kalkulator» в строке лида. */}
        <Scribble rect={sourceRect} color={GOLD} width={2.4} pad={[12, 6]} seed={9} p={easeOut(span(frame, T.source, 14))} />
      </Camera>

      <Callout anchor={[hx, hy]} box={{ x: inFrame(calcRight + 70, 560), y: hy - 230, width: 560 }} tag={tag(3, lang)} title={caption(3, lang)} at={T.hours + 6} until={T.next2 - 4} />
      {/* Время чтения — по польской подписи: тайминг от языка не зависит. */}
      <Callout anchor={leadAnchor} box={{ x: inFrame(leadBox[0] + 60, 500), y: leadAnchor[1] - 230, width: 500 }} tag={tag(5, lang)} title={caption(5, lang)} at={T.source + 8} until={Math.max(T.source + 8 + readFrames(caption(5)) + 40, KANDYDAT_END - 6)} />
      </Swing>
    </AbsoluteFill>
  )
}

/** Карточка «Dziękujemy»: встаёт на экране (pop, галочка рисуется), отрывается
    с тенью и летит дугой, по пути сжимается в строку лида (две грани
    переливаются друг в друга), садится и вспыхивает золотом. */
function ThanksFlyer({ frame, fly, landed }: { frame: number; fly: ReturnType<typeof flyer>; landed: number }) {
  const enter = spring(frame, T.thanks, SPRINGS.pop)
  const check = Math.round(8 * clamp01((frame - (T.thanks + 6)) / 10))
  const flash = Math.sin(Math.PI * clamp01(landed))
  const shadow = fly.lift > 0.01 && landed <= 0 ? SHADOW.lifted : 'none'
  return (
    <div
      style={{
        position: 'absolute',
        left: fly.x - fly.width / 2,
        top: fly.y - fly.height / 2,
        width: fly.width,
        height: fly.height,
        borderRadius: mix(12, 2, fly.morph),
        transform: `scale(${fly.scale * mix(0.92, 1, clamp01(enter))}) translateY(${(1 - clamp01(enter)) * 18}px)`,
        opacity: clamp01(enter * 1.6),
        boxShadow: shadow,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: THANKS.width, height: THANKS.height, transformOrigin: '0 0', transform: `scale(${fly.width / THANKS.width}, ${fly.height / THANKS.height})`, opacity: 1 - fly.morph }}>
        <Live width={THANKS.width} height={THANKS.height} ratio={3.2} state={check} draw={(ctx) => drawThanks(ctx, check / 8)} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: LEAD_ROW.width, height: LEAD_ROW.height, transformOrigin: '0 0', transform: `scale(${fly.width / LEAD_ROW.width}, ${fly.height / LEAD_ROW.height})`, opacity: fly.morph }}>
        <Live width={LEAD_ROW.width} height={LEAD_ROW.height} ratio={3} draw={(ctx) => drawLeadRow(ctx, LEADS[0]!)} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: tint(GOLD, 0.18 * flash) }} />
    </div>
  )
}

/** Шар расчёта (EarningsCalculatorNew, шаг 4): круг 96 pt с золотым градиентом
    и значком Sparkles; крутится и дышит (scale 1 → 1,2 → 1 за 2 с). */
function Orb({ frame, at, leave }: { frame: number; at: number; leave: number }) {
  const t = (frame - at) / 60
  const pulse = 1 + 0.2 * Math.sin(Math.PI * (((t % 1) + 1) % 1)) ** 2
  const appear = spring(frame, at, SPRINGS.pop) * (1 - easeIn(span(frame, leave, 6)))
  const size = 96
  return (
    <div
      style={{
        position: 'absolute',
        left: ORB[0] - size / 2,
        top: ORB[1] - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        background: `linear-gradient(90deg, ${GOLD}, #FACC15, ${GOLD})`,
        transform: `scale(${Math.max(0, appear) * pulse}) rotate(${t * 360}deg)`,
        opacity: clamp01(appear * 1.5),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Glyph name="sparkles" size={48} color={TB.bg} stroke={2} p={easeOut(span(frame, at + 3, 16))} />
    </div>
  )
}
