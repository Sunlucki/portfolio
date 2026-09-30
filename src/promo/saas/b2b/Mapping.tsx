import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, viewAt, type CameraKey } from '../kit/camera'
import { DrawPath, bezierPath, bezierPoint, flowCurve } from '../kit/draw'
import { SPRINGS, easeInOut, easeOut, glide, span, spring } from '../kit/motion'
import { useSoundCue } from '../kit/sound'
import { tint, type Point } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { useLang } from '../kit/lang'
import { BL_STATUSES, STATUS_FLOW, caption, tag } from './data'
import { S, union, world, xy } from './layout'
import { Bead } from './parts'
import { MAP, MappingPage, OrderCard } from './screens/Admin'
import { L, Sheet } from './twin'
import { ScreenWindow } from './Window'

/* 16 · 05 Realizacja · Путь заказа и BaseLinker (21 доля). Панель продавца
   въезжает каруселью. Слева — карточка заказа PD-260928-0015, справа —
   «Integracja Baselinker → Mapowanie statusów». Статус заказа перекатывается
   (м-статус): «Nowe zamówienie» → «W realizacji» → «Przekazane do magazynu» →
   «Kompletowanie» → «Pakowanie» → «Przekazane kurierowi»; на каждой смене
   бусина бежит от карточки к своей строке, строка и стрелка к статусу
   BaseLinkera загораются. Обратной синхронизации в коде нет — бусины бегут
   только к BaseLinkerowi.

   0–26     карусель справа (heavy)
   26–52    наезд на карточку заказа и маппинг
   60 + 30i статус i: смена чипа 10 кадров, бусина к строке 14 кадров
   150–250  выноска 16; 272–300 отъезд к окну целиком */

export const STEP = 30
const START = 60
const at = (i: number) => START + i * STEP

const ORDER = world(MAP.order)
const CARD = world(MAP.card)
const VIEW = union(ORDER, CARD)
const rowY = (i: number) => world(MAP.row(i)).y + world(MAP.row(i)).height / 2
const CHIP: Point = [ORDER.x + ORDER.width - 12 * S, ORDER.y + 93 * S]
const curveTo = (i: number) => flowCurve(CHIP, [world(MAP.row(i)).x - 14 * S, rowY(i)], 0.55)

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 26, dur: 26, ...fit(VIEW, { max: 1.35 }) },
  { at: 272, dur: 26, ...HOME },
]
const VIEW_CAM = viewAt(CAMERA, 200)

export const MAPPING_FRAMES = 300

export function Mapping() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const enter = spring(frame, 0, SPRINGS.heavy)
  const step = Math.max(0, Math.min(STATUS_FLOW.length - 1, Math.floor((frame - START) / STEP)))
  const started = frame >= START
  const k = started ? easeInOut(span(frame, at(step), 10)) : 0
  const from = step > 0 ? STATUS_FLOW[step - 1]! : STATUS_FLOW[0]!
  const to = STATUS_FLOW[step]!
  const lit = STATUS_FLOW.map((_, i) => {
    const arrive = at(i) + 14
    if (frame < arrive) return 0
    const on = spring(frame, arrive, SPRINGS.snap)
    const off = i < STATUS_FLOW.length - 1 ? 0.65 * easeOut(span(frame, at(i + 1) + 14, 10)) : 0
    return Math.min(1, on) * (1 - off)
  })
  /* Выноска 16 — на статусе BaseLinkera текущей строки, рамка под карточкой
     заказа (слева пусто). */
  const anchorRow = Math.min(step, 4)
  const anchor = camera.project(world(MAP.row(anchorRow)).x - 14 * S, rowY(anchorRow))
  const box = VIEW_CAM.project(ORDER.x, ORDER.y + ORDER.height + 60 * S)
  /* Звук (карусель, линии к строкам, выноска, камера — у набора): статус
     заказа перекатывается на каждом шаге (у первого — уже стоит), строка
     маппинга и стрелка к BaseLinkerowi загораются, когда дошла бусина. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  STATUS_FLOW.forEach((_, i) => {
    useSoundCue('tick', i > 0 ? at(i) : null, point(...CHIP), { gain: 0.6 })
    useSoundCue('glint', at(i) + 14, point(world(MAP.row(i)).x + world(MAP.row(i)).width / 2, rowY(i)), { gain: 0.35, seconds: 0.4 })
  })
  return (
    <AbsoluteFill>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          <ScreenWindow path="/admin/integrations">
            <MappingPage lit={lit} statuses={STATUS_FLOW} bl={BL_STATUSES} />
          </ScreenWindow>
          <div style={{ position: 'absolute', left: ORDER.x, top: ORDER.y, width: ORDER.width, height: ORDER.height, borderRadius: 16 * S, boxShadow: '0 10px 30px rgba(15,23,42,0.1)' }}>
            <Sheet w={MAP.order.w} h={MAP.order.h} scale={S} style={{ left: 0, top: 0 }}>
              <OrderCard from={from} to={to} k={step === 0 ? 1 : k} />
            </Sheet>
          </div>
          {STATUS_FLOW.map((_, i) => {
            if (frame < at(i)) return null
            const curve = curveTo(i)
            const t = glide(span(frame, at(i) + 2, 14))
            const [x, y] = bezierPoint(curve, t)
            const fade = 1 - easeOut(span(frame, at(i) + 16, 12))
            return (
              <div key={i}>
                <div style={{ opacity: fade * 0.9 + 0.1 * (i === step ? 1 : 0) }}>
                  <DrawPath d={bezierPath(curve)} p={easeOut(span(frame, at(i), 12))} color={tint(L.primary, 0.55)} width={2.2} opacity={fade} />
                </div>
                {t < 1 && <Bead x={x} y={y} />}
              </div>
            )
          })}
        </Camera>
        <Callout anchor={anchor} box={{ x: box[0], y: box[1], width: 480 }} tag={tag(16, lang)} title={caption(16, lang)} at={150} until={250} />
      </Swing>
    </AbsoluteFill>
  )
}

/** Карточка заказа в мире — с неё начинается сцена InPost. */
export const MAPPING_ORDER = ORDER
