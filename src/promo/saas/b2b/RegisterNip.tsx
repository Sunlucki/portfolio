import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, cover, fit, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, Scribble, bezierPoint, flowCurve } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { INK, MUTED, type Point, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { NIP, caption, tag } from './data'
import { PAGE, at, mid, world, xy } from './layout'
import { Bead, GlassCard, IconTile } from './parts'
import { CompanyFields, REG1, RegBackground, RegStatus, RegStep1, RegStep2Frame, RegTrail, STEP2 } from './screens/Registration'
import { L, Sheet, tw } from './twin'
import { ScreenWindow } from './Window'

/* 03–04 · 01 Rejestracja · NIP → Biała lista MF (30 долей). Оранжевый круг из
   крючка оказывается страницей регистрации: камера отъезжает, и она встаёт в
   окно браузера. Наезд на пилюлю NIP: номер печатается, клик «POBIERZ DANE».
   Номер уходит бусиной по линии в Białą listę MF — камера летит за ней,
   реестр подтверждает «Czynny», бусина возвращается с данными. «Dane zostały
   pobrane.», экран переходит к шагу «Dane firmy», поля заполняются сами.

   0–32     отъезд с оранжевого кадра: страница встаёт в окно; 2–16 точки
   8–22     «Rejestracja», пилюля и кнопка встают (pop)
   34–60    наезд на строку NIP ×1,55
   62–89    NIP печатается (3 кадра на знак); 64–175 выноска 03
   92–114   курсор к кнопке, 114 — клик; «Pobieranie danych...»
   118–136  линия к реестру; 126–160 бусина летит, камера за ней
   160–222  реестр крупно: NIP печатается, «Czynny» (176), обводка (186)
   222–256  бусина с данными обратно, камера за ней
   258–305  «Dane zostały pobrane. Sprawdź je i potwierdź.» — читается
   305–335  переход к шагу 2, цепочка шагов, камера на блок «Dane firmy»
   336–368  «Nazwa firmy», «Adres firmy» заполняются (м-ввод)
   346–440  выноска 04; 450 — склейка (камера стоит) */

const T0 = { typing: 62, cursor: 92, click: 114, send: 126, arrive: 160, back: 222, home: 256, fetched: 258, step: 305, fill: 336 }
const FLY = 34

/** Строка NIP с заголовком и статусом (мир). */
const ROW = world({ x: REG1.pill.x, y: REG1.top, w: 576, h: REG1.status.y + REG1.status.h - REG1.top })
const BUTTON = world(REG1.button)
const INPUT = world(REG1.input)
const STATUS = world(REG1.status)

/** Карточка реестра справа от окна. */
const CARD: Rect = { x: 1790, y: 430, width: 470, height: 236 }
const CURVE = flowCurve([BUTTON.x + BUTTON.width, BUTTON.y + BUTTON.height / 2], [CARD.x, CARD.y + CARD.height / 2], 0.55)
const RETURN = flowCurve([CARD.x, CARD.y + CARD.height / 2], [STATUS.x + STATUS.width / 2, STATUS.y + STATUS.height / 2], 0.55)
const outAt = (f: number): Point => bezierPoint(CURVE, glide(span(f, T0.send, FLY)))
const backAt = (f: number): Point => bezierPoint(RETURN, glide(span(f, T0.back, FLY)))

/** Шаг 2 крупно: цепочка, заголовок и поля. */
const STEP_VIEW = world({ x: 176, y: STEP2.trail.y, w: 672, h: STEP2.block.y + STEP2.block.h - STEP2.trail.y })

const CAMERA: CameraKey[] = [
  { at: 0, ...cover(PAGE) },
  { at: 0, dur: 32, ...HOME },
  { at: 34, dur: 26, ...fit(ROW, { max: 1.55, shift: [0, -80] }) },
  { at: T0.send - 4, dur: 18, follow: follow(outAt, { zoom: 1.3, lag: 6 }) },
  { at: T0.arrive - 6, dur: 22, ...fit(CARD, { max: 2.2, shift: [0, -20] }) },
  { at: T0.back - 2, dur: 16, follow: follow(backAt, { zoom: 1.3, lag: 6 }) },
  { at: T0.home - 8, dur: 24, ...fit(ROW, { max: 1.55, shift: [0, -80] }) },
  { at: T0.step, dur: 30, ...fit(STEP_VIEW, { max: 1.35, shift: [-270, -62] }) },
]

const CURSOR = [
  { at: T0.cursor, x: BUTTON.x + BUTTON.width + 180, y: BUTTON.y + 260 },
  { at: T0.click - 4, x: BUTTON.x + BUTTON.width * 0.55, y: BUTTON.y + BUTTON.height * 0.6 },
  { at: T0.click + 26, x: BUTTON.x + BUTTON.width * 0.9, y: BUTTON.y + BUTTON.height * 2.2 },
]
const CLICK_AT = cursorAt(CURSOR, T0.click)

/** Вид камеры, при котором стоит выноска 04 (он не меняется, пока она видна). */
const STEP_CAM = viewAt(CAMERA, 400)

export function RegisterNip() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const count = frame < T0.typing ? 0 : Math.min(NIP.length, Math.floor((frame - T0.typing) / 3) + 1)
  const busy = frame >= T0.click && frame < T0.home
  const press = 1 - 0.04 * clamp01(1 - Math.abs(frame - T0.click) / 3)
  const show: [number, number, number] = [spring(frame, 8, SPRINGS.pop), spring(frame, 14, SPRINGS.pop), spring(frame, 20, SPRINGS.pop)]
  /* Переход к шагу 2: шаг 1 уходит влево, шаг 2 въезжает справа. */
  const swap = glide(span(frame, T0.step, 24))
  const cursor = cursorAt(CURSOR, frame, [T0.click], T0.click + 22)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [rx, ry] = camera.project(CLICK_AT.x, CLICK_AT.y)
  const flowing = frame < T0.back ? 1 : 1 - easeOut(span(frame, T0.back, 12))
  const out = outAt(frame)
  const back = backAt(frame)
  const card = spring(frame, T0.send - 6, SPRINGS.pop)
  const nameFill = easeInOut(span(frame, T0.fill, 16))
  const addressFill = easeInOut(span(frame, T0.fill + 14, 18))
  const status =
    frame >= T0.fetched ? (
      <RegStatus text={t('Dane zostały pobrane. Sprawdź je i potwierdź.', 'Data has been fetched. Please review and confirm.')} icon={easeOut(span(frame, T0.fetched, 12))} o={easeOut(span(frame, T0.fetched, 8))} dy={(1 - easeOut(span(frame, T0.fetched, 10))) * 8} />
    ) : busy ? (
      <RegStatus text={t('Pobieranie danych...', 'Fetching data...')} o={easeOut(span(frame, T0.click + 2, 8))} />
    ) : null

  /* Звук (клики, линия к реестру, переворот карточки, выноски и камера — у
     набора): строка NIP встаёт, NIP печатается, бусина летит в реестр, там
     NIP печатается и встаёт «Czynny», бусина с данными — обратно; «Dane
     zostały pobrane.»; смена шага, кружок шага 2; поля фирмы заполняются. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  useSoundCue('layers', 8, point(...mid(ROW)), { gain: 0.5, seconds: 0.5 })
  useSoundCues('key', Array.from(NIP, (_, i) => T0.typing + i * 3), point(...mid(INPUT)))
  useSoundTrack('b2b-nip-out', 'whoosh', frame >= T0.send && frame <= T0.arrive, point(...out), { gain: 0.6 })
  useSoundCues('key', Array.from(NIP, (_, i) => T0.arrive + i * 2), point(CARD.x + CARD.width - 130, CARD.y + 150))
  useSoundCue('success', T0.arrive + 16, point(CARD.x + CARD.width - 90, CARD.y + 196), { gain: 0.6 })
  useSoundTrack('b2b-nip-back', 'whoosh', frame >= T0.back && frame <= T0.home, point(...back), { gain: 0.6 })
  useSoundCue('toast', T0.fetched, point(...mid(STATUS)), { gain: 0.7 })
  useSoundCue('air', T0.step, point(PAGE.x + PAGE.width / 2, PAGE.y + PAGE.height / 2), { gain: 0.45, seconds: 0.8 })
  useSoundCue('tick', T0.step + 12, point(...at(362, STEP2.trail.y + 12)), { gain: 0.5 })
  useSoundCues('key', Array.from({ length: 8 }, (_, k) => T0.fill + k * 2), point(...at(STEP2.block.x + 336, STEP2.block.y + 50)))
  useSoundCues('key', Array.from({ length: 8 }, (_, k) => T0.fill + 16 + k * 2), point(...at(STEP2.block.x + 180, STEP2.block.y + 158)))

  /* Выноска 03 — на поле NIP, рамка под строкой справа. */
  const anchor03 = camera.project(INPUT.x + INPUT.width * 0.2, INPUT.y + INPUT.height * 0.72)
  /* Выноска 04 — на поле «Nazwa firmy», рамка справа от блока. */
  const name = world({ x: STEP2.block.x, y: STEP2.name.y, w: 672, h: 56 })
  const anchor04 = camera.project(name.x + name.width * 0.86, name.y + name.height * 0.5)
  const box04 = STEP_CAM.project(STEP_VIEW.x + STEP_VIEW.width, 0)[0] + 56

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow
          path="/b2b/resellers"
          page={L.brand}
          overlay={
            /* Блок «Dane firmy» шага 2 — отдельный лист (в следующей сцене
               он отрывается от страницы). */
            frame >= T0.step ? (
              <Sheet w={672} h={230} scale={PAGE.width / 1024} style={{ left: (STEP2.block.x + (1 - swap) * 90) * (PAGE.width / 1024), top: STEP2.block.y * (PAGE.width / 1024), opacity: swap }}>
                <CompanyFields name={nameFill} address={addressFill} caret={L.brand} />
              </Sheet>
            ) : null
          }
        >
          <RegBackground dots={easeOut(span(frame, 2, 14))} header={easeOut(span(frame, 6, 12))} />
          {swap < 1 && (
            <g style={{ opacity: 1 - swap, transform: `translate(${-swap * 90}px, 0px)` }}>
              <RegStep1 typed={count} caret={frame >= T0.typing - 4 && frame < T0.click && (frame < T0.typing + 30 || Math.floor(frame / 8) % 2 === 0)} busy={busy} spin={(frame - T0.click) * 14} press={press} status={status} show={show} />
            </g>
          )}
          {swap > 0 && (
            <g style={{ opacity: swap, transform: `translate(${(1 - swap) * 90}px, 0px)` }}>
              <RegTrail current={2} x={STEP2.trail.x} y={STEP2.trail.y} fill={easeOut(span(frame, T0.step + 12, 12))} />
              <RegStep2Frame hint={easeOut(span(frame, T0.fill - 6, 10))} />
            </g>
          )}
        </ScreenWindow>
        {frame >= T0.send - 12 && frame < T0.home + 30 && (
          <Connector from={CURVE.a} to={CURVE.d} bend={0.55} p={easeInOut(span(frame, T0.send - 10, 18)) * (1 - easeIn(span(frame, T0.home + 6, 20)))} frame={frame} flowing={frame < T0.send ? 0 : flowing * 0.6} />
        )}
        {frame >= T0.send - 8 && frame < T0.home + 26 && (
          <Flip
            angle={90 * (1 - card) + 90 * easeIn(span(frame, T0.home + 6, 16))}
            style={{ left: CARD.x, top: CARD.y, width: CARD.width, height: CARD.height }}
            front={<Registry frame={frame} />}
          />
        )}
        {frame >= T0.send - 2 && frame < T0.arrive + 4 && <Bead x={out[0]} y={out[1]} />}
        {frame >= T0.back - 2 && frame < T0.home + 2 && <Bead x={back[0]} y={back[1]} color={L.emerald} />}
        <Scribble rect={world({ x: 176, y: STEP2.hint - 12, w: tw(t('Dane pobrane z rejestru', 'Data fetched from registry'), 13, 700, 1.04, true), h: 14 })} kind="underline" p={easeOut(span(frame, T0.fill + 20, 14))} width={3} color="#ffffff" />
      </Camera>
      <Callout anchor={anchor03} box={{ x: anchor03[0] - 520, y: anchor03[1] + 190, width: 560 }} tag={tag(3, lang)} title={caption(3, lang)} at={64} until={172} />
      <Callout anchor={anchor04} box={{ x: box04, y: anchor04[1] - 40, width: 480 }} tag={tag(4, lang)} title={caption(4, lang)} at={346} until={418} />
      <Ripple x={rx} y={ry} at={T0.click} />
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

/** Карточка Białej listy MF (наша, стекло): NIP печатается, когда долетела
    бусина; статус «Czynny» встаёт с перелётом, вокруг — обводка. */
function Registry({ frame }: { frame: number }) {
  const t = useT()
  const count = frame < T0.arrive ? 0 : Math.min(NIP.length, Math.floor((frame - T0.arrive) / 2) + 1)
  const ok = spring(frame, T0.arrive + 16, SPRINGS.pop)
  return (
    <GlassCard rect={{ x: 0, y: 0, width: CARD.width, height: CARD.height }} style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <IconTile name="shieldCheck" p={easeOut(span(frame, T0.send, 18))} />
        <div>
          <div style={{ fontSize: 30, fontWeight: 750, letterSpacing: '-0.025em', color: INK }}>Biała lista MF</div>
          <div style={{ marginTop: 2, fontSize: 17, fontWeight: 500, color: MUTED }}>{t('Wykaz podatników VAT', 'Ministry of Finance VAT whitelist')}</div>
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(15,23,42,0.08)', margin: '20px 0 16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 19, color: MUTED, fontWeight: 500 }}>
        <span>NIP</span>
        <span style={{ fontSize: 22, fontWeight: 650, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{NIP.slice(0, count) || '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 19, color: MUTED, fontWeight: 500 }}>
        <span>{t('Status VAT', 'VAT status')}</span>
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, fontSize: 22, fontWeight: 650, color: L.emeraldText, opacity: clamp01(ok * 1.5), transform: `translateY(${(1 - clamp01(ok)) * 10}px) scale(${mix(0.9, 1, clamp01(ok))})`, transformOrigin: 'right center' }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: L.emerald }} />
          {t('Czynny', 'Active')}
        </span>
      </div>
    </GlassCard>
  )
}

/** Вид камеры в конце сцены: с него начинается следующая. */
export const STEP_END_VIEW = fit(STEP_VIEW, { max: 1.35, shift: [-270, -62] })
