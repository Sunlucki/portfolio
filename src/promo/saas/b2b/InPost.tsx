import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundProbe, useSoundTrack } from '../kit/sound'
import { SHADOW, type Point, type Rect } from '../kit/theme'
import { useLang } from '../kit/lang'
import { BL_STATUSES, STATUS_FLOW, caption, tag } from './data'
import { S, mid, world, xy } from './layout'
import { MAPPING_ORDER } from './Mapping'
import { DIALOG, GAUGES, GAUGE_MENU, GaugeMenu, MAP, MappingPage, OrderCard, OrderDialog, OrdersPage, SHIP, ShippingLabel } from './screens/Admin'
import { Sheet } from './twin'
import { ScreenWindow } from './Window'

/* 17 · 05 Realizacja · Etykieta InPost (24 доли). Карточка заказа
   раскрывается в окно заказа (П4), за ним — список «Zamówienia» под
   затемнением. Окно крупно: клиент, адрес, позиции. Наезд на блок «InPost
   ShipX»: выбор габарита — список крупно, «Gabaryt B»; «Utwórz przesyłkę» —
   «· confirmed»; «Etykieta A6» — бумажная этикетка вылетает из окна, камера
   за ней; этикетка садится крупно, штрихкод прорисовывается, номер посылки.

   0–26     карточка заказа растёт в окно заказа, фон — «Zamówienia»
   26–52    окно целиком; держится (позиции, адрес)
   92–116   наезд на «InPost ShipX»
   124      клик по габариту; 126 — список (pop), камера на него
   152      «Gabaryt B»; 158–176 обратно к блоку
   188      «Utwórz przesyłkę»; 190–202 блок «confirmed»
   214      «Etykieta A6»; 216–250 этикетка летит, камера за ней
   250–276  этикетка крупно; 256–292 штрихкод; 262–352 выноска 17 */

const T0 = { grow: 0, ship: 92, gauge: 124, pick: 152, create: 188, created: 190, label: 214, fly: 216, land: 250, bars: 256 }

const DIALOG_W = world(DIALOG)
const BLOCK = world(SHIP.block)
const GAUGE = world(SHIP.gauge)
const CREATE = world(SHIP.create)
const LABEL_BTN = world({ ...SHIP.label, y: SHIP.block.y + 70 })
const MENU_BOX = { x: SHIP.gauge.x, y: SHIP.gauge.y - GAUGE_MENU.h - 6, w: GAUGE_MENU.w, h: GAUGE_MENU.h }
const MENU = world(MENU_BOX)
const itemAt = (i: number): Point => [MENU.x + MENU.width * 0.4, MENU.y + (6 + i * 38 + 18) * S]

const LABEL_SCALE = 2.4
const LABEL: Rect = { x: 1980, y: 250, width: 296 * LABEL_SCALE, height: 210 * LABEL_SCALE }
function labelAt(f: number) {
  const t = glide(span(f, T0.fly, T0.land - T0.fly))
  const fromX = LABEL_BTN.x + LABEL_BTN.width / 2
  const fromY = LABEL_BTN.y + LABEL_BTN.height / 2
  const toX = LABEL.x + LABEL.width / 2
  const toY = LABEL.y + LABEL.height / 2
  return { x: mix(fromX, toX, t), y: mix(fromY, toY, t) - Math.sin(Math.PI * t) * 160, scale: mix(0.12, 1, t), rotate: mix(-14, -2.5, t) + Math.sin(Math.PI * t) * 6 }
}

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 26, dur: 26, ...fit(DIALOG_W, { max: 1.2, margin: 40 }) },
  { at: T0.ship, dur: 24, ...fit(BLOCK, { max: 1.55, shift: [0, 60] }) },
  { at: T0.gauge + 2, dur: 22, ...focus({ x: MENU.x - 40, y: MENU.y - 20, width: MENU.width + 440, height: MENU.height + GAUGE.height + 60 }, { fill: 0.62, tall: 0.8 }) },
  { at: T0.pick + 6, dur: 22, ...fit(BLOCK, { max: 1.55, shift: [0, 60] }) },
  { at: T0.fly - 2, dur: 16, follow: follow((f) => { const l = labelAt(f); return [l.x, l.y] }, { zoom: 1.1, lag: 6 }) },
  { at: T0.land - 4, dur: 26, ...focus(LABEL, { fill: 0.52, shift: [-220, 0] }) },
]

const CURSOR = [
  { at: T0.gauge - 24, x: GAUGE.x + GAUGE.width + 200, y: GAUGE.y + 150 },
  { at: T0.gauge - 4, x: GAUGE.x + GAUGE.width * 0.5, y: GAUGE.y + GAUGE.height * 0.55 },
  { at: T0.pick - 12, x: itemAt(0)[0], y: itemAt(0)[1] },
  { at: T0.pick - 4, x: itemAt(1)[0], y: itemAt(1)[1] },
  { at: T0.create - 4, x: CREATE.x + CREATE.width * 0.5, y: CREATE.y + CREATE.height * 0.55 },
  { at: T0.label - 4, x: LABEL_BTN.x + LABEL_BTN.width * 0.5, y: LABEL_BTN.y + LABEL_BTN.height * 0.55 },
  { at: T0.label + 22, x: LABEL_BTN.x + LABEL_BTN.width * 0.9, y: LABEL_BTN.y + LABEL_BTN.height * 3 },
]
const CLICKS = [T0.gauge, T0.pick, T0.create, T0.label]
const LABEL_CAM = viewAt(CAMERA, 320)

export const INPOST_FRAMES = 360

export function InPost() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.label + 18)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  /* Карточка заказа растёт в окно заказа. */
  const grow = glide(span(frame, T0.grow, 26))
  const from = MAPPING_ORDER
  const card = { x: mix(from.x, DIALOG_W.x, grow), y: mix(from.y, DIALOG_W.y, grow), width: mix(from.width, DIALOG_W.width, grow), height: mix(from.height, DIALOG_W.height, grow) }
  const scrim = easeOut(span(frame, 4, 18))
  const menu = frame < T0.pick ? spring(frame, T0.gauge + 2, SPRINGS.pop) : 1 - easeIn(span(frame, T0.pick + 2, 8))
  const hover = frame < T0.pick - 12 ? -1 : frame < T0.pick - 4 ? 0 : 1
  const gauge = frame >= T0.pick ? GAUGES[1]! : GAUGES[0]!
  const created = easeInOut(span(frame, T0.created, 12))
  const press = (t: number) => 1 - 0.05 * clamp01(1 - Math.abs(frame - t) / 3)
  const label = labelAt(frame)
  const bars = easeInOut(span(frame, T0.bars, 36))
  /* Выноска 17 — на штрихкоде, рамка справа от этикетки. */
  const anchor = camera.project(LABEL.x + LABEL.width * 0.82, LABEL.y + LABEL.height * 0.62)
  const boxX = LABEL_CAM.project(LABEL.x + LABEL.width, 0)[0] + 60
  /* Звук (клики, выноска, камера — у набора): карточка заказа раскрывается в
     окно; список габаритов выходит и закрывается; «Utwórz przesyłkę» —
     посылка создана; «Etykieta A6» — лист отрывается, летит (камера за ним) и
     встаёт крупно, штрихкод прорисовывается. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const labelMid = point(label.x, label.y)
  useSoundProbe('whoosh', grow, point(...mid(card)), { eps: 0.004, gain: 0.6 })
  useSoundCue('popIn', T0.gauge + 2, point(...mid(MENU)), { gain: 0.6 })
  useSoundCue('popOut', T0.pick + 2, point(...mid(MENU)), { gain: 0.4 })
  useSoundCue('success', T0.created + 2, point(...mid(BLOCK)), { gain: 0.8 })
  useSoundCue('flip', T0.fly, point(...mid(LABEL_BTN)), { gain: 0.55 })
  useSoundTrack('b2b-label-2d', 'whoosh', frame >= T0.fly && frame <= T0.land, labelMid, { gain: 0.5 })
  useSoundCue('thump', T0.land, labelMid, { gain: 0.5 })
  useSoundCue('pen', T0.bars, labelMid, { gain: 0.5, seconds: 1.2 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow path={grow < 0.5 ? '/admin/integrations' : '/admin/orders'}>
          <g opacity={1 - grow}>
            <MappingPage lit={STATUS_FLOW.map((_, i) => (i === STATUS_FLOW.length - 1 ? 1 : 0.35))} statuses={STATUS_FLOW} bl={BL_STATUSES} />
          </g>
          <g opacity={grow} style={{ filter: scrim > 0.01 ? `blur(${(3 * scrim).toFixed(2)}px)` : undefined }}>
            <OrdersPage />
          </g>
          <rect x={0} y={0} width={1024} height={659} fill="rgba(7,6,7,0.4)" opacity={scrim} />
        </ScreenWindow>
        <div style={{ position: 'absolute', left: card.x, top: card.y, width: card.width, height: card.height, borderRadius: mix(16, 24, grow) * S, background: '#ffffff', boxShadow: SHADOW.lifted, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - clamp01(grow * 2) }}>
            <Sheet w={MAP.order.w} h={MAP.order.h} scale={card.width / MAP.order.w} style={{ left: 0, top: 0 }}>
              <OrderCard from={STATUS_FLOW[4]!} to={STATUS_FLOW[5]!} k={1} />
            </Sheet>
          </div>
          <div style={{ position: 'absolute', inset: 0, opacity: clamp01(grow * 2 - 1) }}>
            <Sheet w={DIALOG.w} h={DIALOG.h} scale={card.width / DIALOG.w} style={{ left: 0, top: 0 }}>
              <g transform={`translate(${-DIALOG.x} ${-DIALOG.y})`}>
                <OrderDialog gauge={gauge} created={created} pressCreate={press(T0.create)} pressLabel={press(T0.label)} />
              </g>
            </Sheet>
          </div>
        </div>
        {menu > 0.001 && (
          <div style={{ position: 'absolute', left: MENU.x, top: MENU.y, width: MENU.width, height: MENU.height, borderRadius: 16 * S, boxShadow: SHADOW.lifted, opacity: clamp01(menu * 1.4), transform: `translateY(${(1 - clamp01(menu)) * 10}px) scale(${mix(0.95, 1, clamp01(menu))})`, transformOrigin: '50% 100%' }}>
            <Sheet w={GAUGE_MENU.w} h={GAUGE_MENU.h} scale={S} style={{ left: 0, top: 0 }}>
              <GaugeMenu hover={hover} picked={frame >= T0.pick ? 1 : 0} />
            </Sheet>
          </div>
        )}
        {frame >= T0.fly && (
          <div style={{ position: 'absolute', left: label.x - LABEL.width / 2, top: label.y - LABEL.height / 2, width: LABEL.width, height: LABEL.height, transform: `rotate(${label.rotate}deg) scale(${label.scale})`, borderRadius: 6 * LABEL_SCALE, boxShadow: SHADOW.lifted }}>
            <Sheet w={296} h={210} scale={LABEL_SCALE} style={{ left: 0, top: 0 }}>
              <ShippingLabel gauge={GAUGES[1]!} bars={bars} />
            </Sheet>
          </div>
        )}
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 60, width: 440 }} tag={tag(17, lang)} title={caption(17, lang)} at={262} until={346} />
      {CLICKS.map((t) => {
        const p = cursorAt(CURSOR, t)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={t} x={x} y={y} at={t} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
