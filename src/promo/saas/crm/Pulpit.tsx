import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, viewAt, type CameraKey } from '../kit/camera'
import { Bar } from '../kit/chart'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, canvasOf, textWidth } from '../kit/painted'
import { AppWindow, CHROME } from '../kit/surfaces'
import { SHADOW, type Rect } from '../kit/theme'
import { Layer, LayerStack, Swing } from '../kit/transitions'
import { centerOf, useCueList } from './common'
import { HOST, PAGE, WINDOW, onPage, scaled } from './layout'
import { DASH, DASH_SLOTS, FUNNEL, LIGHT, caption, crmDashboardBase, crmFunnelCard, crmKpiTile, crmTodayCard, crmTodayRow, funnelTrack, tag, useCrmTwins } from './twins'

/* 05 · 01 Start · Pulpit (15 долей, 435–659). В том же окне собирается
   пульт: окно уходит в изометрию, плитки и карточки опускаются на свои места
   стопкой слоёв (С), окно возвращается лицом. Камера подъезжает к «Na dziś»,
   остальное гаснет, а строки перестраиваются по оценке — «Kolejność ustala
   silnik priorytetów». Уход — поворотом карусели влево.

   0–22     окно наклоняется в изометрию; 40–70 — обратно лицом
   10–40    плитки показателей, «Na dziś» со строками и воронка опускаются
   50–66    столбики воронки растут (м-график)
   76–104   наезд на «Na dziś» ×1,65 (64% ширины кадра); 100–112 — остальное
            гаснет, карточка приподнимается
   110–140  строки перестраиваются по оценке; 112 — подчёркивание подсказки
   120–205  выноска «Pulpit mówi, od czego zacząć dzień.»
   215–245  уход каруселью влево — вместе со входом кандидата справа */

/** Пульт 2048 × 1323 вписан в страницу по высоте. */
const DS = PAGE.height / DASH.height
const TODAY = scaled(DASH_SLOTS.today, DS)
const FUNNEL_SLOT = scaled(DASH_SLOTS.funnel, DS)
const ROW_SLOTS = DASH_SLOTS.todayRows.map((slot) => scaled(slot, DS))
/** Где строка i стоит до перестройки: движок ещё не расставил их по оценке. */
const FIRST_SLOT = [2, 0, 3, 1]
const SORT = 110
const TODAY_WORLD = onPage(TODAY)

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 76, dur: 28, ...fit(TODAY_WORLD, { max: 1.65, shift: [-300, 10] }) },
]

export function Pulpit() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const twins = useCrmTwins(() => ({
    base: canvasOf(crmDashboardBase()),
    kpi: DASH_SLOTS.kpi.map((_, i) => canvasOf(crmKpiTile(i))),
    today: canvasOf(crmTodayCard()),
    rows: DASH_SLOTS.todayRows.map((_, i) => canvasOf(crmTodayRow(i))),
    funnel: canvasOf(crmFunnelCard()),
  }))
  const camera = viewAt(CAMERA, frame)
  const tilt = glide(span(frame, 0, 22)) - glide(span(frame, 40, 30))
  const veil = easeOut(span(frame, 100, 12))
  const lift = spring(frame, 100, SPRINGS.glide)
  const leave = glide(span(frame, 215, 30))

  const hint = t('Kolejność ustala silnik priorytetów', 'The order comes from the priority engine')
  const hintRect: Rect = { x: TODAY.x + 24 * DS, y: TODAY.y + 71 * DS, width: textWidth(hint, 15, 450) * DS, height: 11 * DS }

  /* Точка — на «Zadzwoń» первой строки: с этого звонка и начинается день;
     рамка — справа от карточки «Na dziś», над погашенной воронкой. */
  const row0 = rowRect(0, frame)
  const anchor = camera.project(PAGE.x + row0.x + row0.width * 0.93, PAGE.y + row0.y + row0.height / 2)
  const boxX = camera.project(TODAY_WORLD.x + TODAY_WORLD.width, 0)[0] + 44

  /* Звук: блоки пульта падают на места (наклон окна — у LayerStack, столбики —
     у Bar); «Na dziś» приподнимается, строки перестраиваются по оценке. */
  useCueList([
    [14, 'layers', [960, 540], 0.5, 1.2],
    [100, 'popIn', centerOf(TODAY_WORLD, camera.project), 0.5],
    [SORT, 'whoosh', centerOf(TODAY_WORLD, camera.project), 0.45, 0.6],
  ])

  return (
    <AbsoluteFill>
      <Swing t={-leave}>
        <Camera view={camera}>
          <LayerStack t={tilt} rotateX={46} rotateZ={-22} scale={0.9} style={{ left: WINDOW.x, top: WINDOW.y, width: PAGE.width, height: PAGE.height + CHROME }}>
            <AppWindow url={`${HOST}/dashboard`} width={PAGE.width} height={PAGE.height} clip={tilt < 0.0005} style={{ left: 0, top: 0 }}>
              <Painted source={twins.base} style={{ left: 0, top: 0, width: DASH.width * DS, height: PAGE.height, opacity: easeOut(span(frame, 0, 8)) }} />
              {DASH_SLOTS.kpi.map((slot, i) => (
                <Falling key={i} frame={frame} start={10 + i * 2} rect={scaled(slot, DS)} tilt={tilt}>
                  <Painted source={twins.kpi[i] ?? null} style={{ inset: 0 }} />
                </Falling>
              ))}
              <Falling frame={frame} start={20} rect={FUNNEL_SLOT} tilt={tilt}>
                <Painted source={twins.funnel} style={{ inset: 0 }} />
                {FUNNEL.map(([, share], i) => (
                  <Bar key={i} rect={scaled(funnelTrack(i), DS)} value={share} at={50 + i * 3} color={i === FUNNEL.length - 1 ? LIGHT.green : LIGHT.teal} />
                ))}
              </Falling>
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: LIGHT.bg, opacity: veil * 0.62 }} />
              <Falling frame={frame} start={16} rect={TODAY} tilt={tilt} lift={lift} zIndex={2}>
                <Painted source={twins.today} style={{ inset: 0 }} />
              </Falling>
              {DASH_SLOTS.todayRows.map((_, i) => {
                const rect = rowRect(i, frame)
                const moving = Math.max(0, Math.sin(Math.PI * spring(frame, SORT + sortDelay(i), SPRINGS.glide)))
                const up = (FIRST_SLOT[i] ?? i) > i
                return (
                  <Falling key={i} frame={frame} start={24 + FIRST_SLOT[i]! * 3} rect={rect} tilt={tilt} depth={3} lift={moving} grow={0.025} zIndex={up ? 4 : 3}>
                    <Painted source={twins.rows[i] ?? null} style={{ inset: 0 }} />
                  </Falling>
                )
              })}
              <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
                <Scribble rect={hintRect} kind="underline" p={easeOut(span(frame, SORT + 2, 14))} width={2.6} />
              </div>
            </AppWindow>
          </LayerStack>
        </Camera>
        <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 30, width: 500 }} tag={tag(5, lang)} title={caption(5, lang)} at={120} until={205} />
      </Swing>
    </AbsoluteFill>
  )
}

/** Строки уходят со своих мест не разом: первой всплывает самая важная. */
const sortDelay = (i: number) => [0, 4, 8, 6][i] ?? 0

/** Где строка i в кадре: до перестройки — на первом месте, потом — на своём. */
function rowRect(i: number, frame: number): Rect {
  const from = ROW_SLOTS[FIRST_SLOT[i] ?? i]!
  const to = ROW_SLOTS[i]!
  const move = spring(frame, SORT + sortDelay(i), SPRINGS.glide)
  return { ...to, y: mix(from.y, to.y, move) }
}

/* Блок пульта в стопке слоёв (<Layer>): падает сверху (с высоты 420 px над
   страницей) на своё место с перелётом, проявляясь. lift — блок приподнят над
   гаснущим пультом (тень больше, чуть крупнее). Пока окно плоское (tilt = 0),
   3D нет: порядок слоёв решает zIndex. */
function Falling({
  frame,
  start,
  rect,
  tilt,
  depth = 2,
  lift = 0,
  grow = 0.012,
  zIndex,
  children,
}: {
  frame: number
  start: number
  rect: Rect
  tilt: number
  depth?: number
  lift?: number
  grow?: number
  zIndex?: number
  children: ReactNode
}) {
  const fall = spring(frame, start, SPRINGS.pop)
  return (
    <Layer
      depth={tilt > 0.0005 ? depth + 420 * (1 - fall) : 0}
      scale={1 + grow * lift}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex,
        opacity: easeOut(span(frame, start - 2, 7)),
        borderRadius: 10,
        boxShadow: lift > 0.01 ? SHADOW.lifted : SHADOW.card,
      }}
    >
      {children}
    </Layer>
  )
}
