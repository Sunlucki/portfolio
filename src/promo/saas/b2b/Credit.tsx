import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { DrawPath, Scribble, bezierPath, bezierPoint, type Bezier } from '../kit/draw'
import { SPRINGS, clamp01, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { useSoundCue, useSoundProbe, useSoundTrack } from '../kit/sound'
import { SHADOW, tint, type Point, type Rect } from '../kit/theme'
import { Swing } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { CHECKOUT_END, CREDIT_BLOCK, CREDIT_LIFT } from './Checkout'
import { caption, tag, zl } from './data'
import { S, mid, xy } from './layout'
import { CREDIT, CreditCard } from './screens/Admin'
import { CHECKOUT, CreditOption, ThanksPage } from './screens/Buyer'
import { G, L, R, Sheet, T, tw } from './twin'
import { ScreenWindow } from './Window'

/* 15 · 04 Zamówienie · Кредитный лимит (22 доли). Висящий блок «Kredyt
   kupiecki» срывается со страницы благодарности и летит вправо, к продавцу;
   камера за ним. В полёте он переворачивается (П15) и становится карточкой
   «Kredyty»: полоса «Wykorzystano 13619.58 PLN / 20000.00 PLN» наливается до
   68% (м-прогресс), «Dostępne: 6380.42 PLN». Ниже — оплата следующего заказа
   «Razem 7 240,00 zł»: по линии от «Dostępne» бегут бусины и упираются в
   запрет — «Kredyt kupiecki» сереет, «Przekroczony limit». Заказ сверх
   лимита не проходит.

   0–12     блок висит, как в конце «Kasa»
   12–52    блок летит вправо и переворачивается в «Kredyty», камера за ним
   52–76    наезд на карточку; 78–100 полоса наливается; 100 — строки
   112      подчёркивание «Dostępne»; 150–176 камера вниз к оплате
   160–176  оплата следующего заказа встаёт; 180–214 бусины бегут по линии
   214      упор: запрет рисуется, вариант сереет, «Przekroczony limit»
   222–310  выноска 15 */

const T0 = { fly: 12, land: 52, fill: 78, open: 100, down: 150, next: 160, flow: 180, stop: 214 }

const CARD_SCALE = 1.3
const CARD: Rect = { x: 2020, y: 190, width: CREDIT.w * CARD_SCALE, height: CREDIT.h * CARD_SCALE }
const MINI = { w: 620, h: 196 }
const MINI_RECT: Rect = { x: CARD.x - 13, y: CARD.y + CARD.height + 90, width: MINI.w * CARD_SCALE, height: MINI.h * CARD_SCALE }
const OPTION = { x: 24, y: 96 }
const OPTION_RECT: Rect = { x: MINI_RECT.x + OPTION.x * CARD_SCALE, y: MINI_RECT.y + OPTION.y * CARD_SCALE, width: CHECKOUT.credit.w * CARD_SCALE, height: CHECKOUT.credit.h * CARD_SCALE }

/** Блок в начале — как висел в «Kasa» (с подъёмом). */
const FROM = (() => {
  const b = CREDIT_BLOCK
  const s = CREDIT_LIFT.scale
  return { x: b.x - (b.width * (s - 1)) / 2, y: b.y + CREDIT_LIFT.y - (b.height * (s - 1)) / 2, width: b.width * s, height: b.height * s }
})()

function blockAt(f: number): Rect & { turn: number } {
  const t = glide(span(f, T0.fly, T0.land - T0.fly))
  const arc = Math.sin(Math.PI * t) * 90
  return {
    x: mix(FROM.x, CARD.x, t),
    y: mix(FROM.y, CARD.y, t) - arc,
    width: mix(FROM.width, CARD.width, t),
    height: mix(FROM.height, CARD.height, t),
    turn: 180 * easeInOut(span(f, T0.fly + 6, T0.land - T0.fly - 6)),
  }
}
const blockCenter = (f: number): Point => {
  const b = blockAt(f)
  return [b.x + b.width / 2, b.y + b.height / 2]
}

/** Где на карточке «Dostępne» (CSS px карточки) → мир. */
const AVAILABLE: Point = [CARD.x + (CREDIT.w - 40) * CARD_SCALE, CARD.y + (92 + 120) * CARD_SCALE]
const FLOW: Bezier = {
  a: [AVAILABLE[0] + 16, AVAILABLE[1]],
  b: [AVAILABLE[0] + 190, AVAILABLE[1] + 60],
  c: [OPTION_RECT.x + OPTION_RECT.width + 230, OPTION_RECT.y + OPTION_RECT.height / 2 - 70],
  d: [OPTION_RECT.x + OPTION_RECT.width + 84, OPTION_RECT.y + OPTION_RECT.height / 2],
}

const CAMERA: CameraKey[] = [
  { ...CHECKOUT_END, at: 0 },
  { at: T0.fly - 2, dur: 20, follow: follow(blockCenter, { zoom: 1.05, lag: 6 }) },
  { at: T0.land - 4, dur: 26, ...focus(CARD, { fill: 0.64, shift: [-60, 0] }) },
  { at: T0.down, dur: 28, ...fit({ x: MINI_RECT.x, y: CARD.y + CARD.height * 0.5, width: MINI_RECT.width + 300, height: MINI_RECT.y + MINI_RECT.height - (CARD.y + CARD.height * 0.5) }, { max: 1.25, shift: [-230, 0] }) },
]
const LOW_CAM = viewAt(CAMERA, 260)

export const CREDIT_FRAMES = 330

export function Credit() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const available = t('Dostępne: 6380.42 PLN', 'Available: 6380.42 PLN')
  const camera = viewAt(CAMERA, frame)
  const block = blockAt(frame)
  const used = spring(frame, T0.fill, SPRINGS.glide)
  const open = easeOut(span(frame, T0.open, 12))
  const mini = spring(frame, T0.next, SPRINGS.pop)
  const draw = easeInOut(span(frame, T0.next + 8, 18))
  const stop = easeOut(span(frame, T0.stop, 10))
  const exceeded = easeInOut(span(frame, T0.stop + 4, 10))
  const [bx, by] = bezierPoint(FLOW, 1)
  const leave = glide(span(frame, CREDIT_FRAMES - 8, 30))
  /* Выноска 15 — на запрете у «Przekroczony limit», рамка справа от него. */
  const anchor = camera.project(bx + 2, by + 26)
  const box = LOW_CAM.project(bx + 110, by - 120)
  /* Звук (линия, черта, выноска, камера, уход каруселью — у набора): блок
     летит к продавцу и переворачивается, встаёт карточкой «Kredyty»; полоса
     лимита наливается, строки под ней; оплата следующего заказа встаёт;
     бусины бегут по линии и упираются в запрет — «Przekroczony limit»:
     блокировка (тихий всплеск и глухой удар). */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const flying = point(...blockCenter(frame))
  const stopAt = point(bx, by)
  useSoundTrack('b2b-credit-block', 'whoosh', frame >= T0.fly && frame <= T0.land, flying, { gain: 0.55 })
  useSoundProbe('flip', block.turn, flying, { eps: 0.3, gain: 0.6 })
  useSoundCue('thump', T0.land, point(...mid(CARD)), { gain: 0.5 })
  useSoundCue('tick', T0.fill + 2, point(CARD.x + (CREDIT.bar.x + CREDIT.bar.w / 2) * CARD_SCALE, CARD.y + (CREDIT.bar.y + 4) * CARD_SCALE), { gain: 0.5 })
  useSoundCue('popIn', T0.open, point(CARD.x + CARD.width / 2, CARD.y + CARD.height * 0.72), { gain: 0.45 })
  useSoundCue('popIn', T0.next, point(...mid(MINI_RECT)), { gain: 0.6 })
  useSoundTrack('b2b-credit-beads', 'whoosh', frame >= T0.flow && frame <= T0.flow + 26, point(...bezierPoint(FLOW, Math.min(0.9, easeInOut(span(frame, T0.flow, 30))))), { gain: 0.4 })
  useSoundCue('popIn', T0.stop, stopAt, { gain: 0.4 })
  useSoundCue('thump', T0.stop + 1, stopAt, { gain: 0.7 })
  return (
    <AbsoluteFill>
      <Swing t={-leave}>
      <Camera view={camera}>
        <ScreenWindow path="/order-confirmation/PD-260928-0015">
          <ThanksPage />
        </ScreenWindow>
        {/* Блок «Kredyt kupiecki» → карточка «Kredyty» (переворот в полёте). */}
        <div style={{ position: 'absolute', left: block.x, top: block.y, width: block.width, height: block.height, perspective: 2400 }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${block.turn}deg)` }}>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 16 * S, background: '#ffffff', boxShadow: SHADOW.lifted, overflow: 'hidden' }}>
              <Sheet w={CHECKOUT.credit.w} h={CHECKOUT.credit.h} scale={block.width / CHECKOUT.credit.w} style={{ left: 0, top: (block.height - CHECKOUT.credit.h * (block.width / CHECKOUT.credit.w)) / 2 }}>
                <CreditOption />
              </Sheet>
            </div>
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 18 * CARD_SCALE, boxShadow: frame < T0.land + 10 ? SHADOW.lifted : SHADOW.window, overflow: 'hidden' }}>
              <Sheet w={CREDIT.w} h={CREDIT.h} scale={block.width / CREDIT.w} style={{ left: 0, top: 0 }}>
                <CreditCard used={used} open={open} />
              </Sheet>
            </div>
          </div>
        </div>
        <Scribble rect={{ x: AVAILABLE[0] - tw(available, 11, 600) * CARD_SCALE, y: AVAILABLE[1] - 11 * CARD_SCALE, width: tw(available, 11, 600) * CARD_SCALE, height: 13 * CARD_SCALE }} kind="underline" p={easeOut(span(frame, 112, 14))} width={2.8} />
        {/* Оплата следующего заказа: «Razem 7 240,00 zł» и «Kredyt kupiecki». */}
        {frame >= T0.next && (
          <div style={{ position: 'absolute', left: MINI_RECT.x, top: MINI_RECT.y, width: MINI_RECT.width, height: MINI_RECT.height, opacity: clamp01(mini * 1.4), transform: `translateY(${(1 - clamp01(mini)) * 30}px)`, borderRadius: 12 * CARD_SCALE, boxShadow: SHADOW.window }}>
            <Sheet w={MINI.w} h={MINI.h} scale={CARD_SCALE} style={{ left: 0, top: 0 }}>
              <NextPayment exceeded={exceeded} />
            </Sheet>
          </div>
        )}
        {frame >= T0.next + 8 && (
          <>
            <DrawPath d={bezierPath(FLOW)} p={draw} color={tint(L.primary, 0.7)} width={2.4} />
            <DrawPath d={bezierPath(FLOW)} p={draw} color={tint(L.primary, 0.12)} width={9} />
            {Array.from({ length: 4 }, (_, i) => {
              /* Бусины идут к оплате и встают у запрета: дальше не проходят. */
              const t0 = T0.flow + i * 7
              const t = Math.min(0.9 - i * 0.05, easeInOut(span(frame, t0, 30)))
              if (frame < t0) return null
              const [x, y] = bezierPoint(FLOW, t)
              return <div key={i} style={{ position: 'absolute', left: x - 8, top: y - 8, width: 16, height: 16, borderRadius: 8, background: '#ffffff', border: `2.6px solid ${L.primary}`, boxSizing: 'border-box', opacity: 1 - 0.5 * stop }} />
            })}
            {stop > 0 && (
              <div style={{ position: 'absolute', left: bx - 28, top: by - 28, opacity: stop, transform: `scale(${mix(0.6, 1, stop)})` }}>
                <svg width={56} height={56} viewBox="0 0 56 56" style={{ overflow: 'visible' }}>
                  <circle cx={28} cy={28} r={26} fill="#ffffff" />
                  <G n="ban" x={6} y={6} s={44} c={L.destructive} sw={2.2} p={easeOut(span(frame, T0.stop, 14))} />
                </svg>
              </div>
            )}
          </>
        )}
      </Camera>
      <Callout anchor={anchor} box={{ x: box[0], y: box[1], width: 400 }} tag={tag(15, lang)} title={caption(15, lang)} at={T0.stop + 8} until={T0.stop + 100} />
      </Swing>
    </AbsoluteFill>
  )
}

/** Оплата следующего заказа (фрагмент «Kasa»): итог больше доступного
    остатка — «Kredyt kupiecki» сереет, «Przekroczony limit». */
function NextPayment({ exceeded }: { exceeded: number }) {
  const total = zl(7240)
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={MINI.w} h={MINI.h} r={12} fill={L.card} />
      <R x={0} y={0} w={MINI.w} h={MINI.h} r={12} stroke={L.border} />
      <G n="creditCard" x={24} y={24} s={20} c={L.primary} />
      <T x={54} y={41} s={18} w={650}>
        {t('Sposób płatności', 'Payment method')}
      </T>
      <T x={MINI.w - 24} y={41} s={14} c={L.mutedFg} a="end">
        {`${t('Razem', 'Total')} ${total}`}
      </T>
      <rect x={24} y={62} width={MINI.w - 48} height={1} fill={L.border} />
      <g transform={`translate(${OPTION.x} ${OPTION.y})`}>
        <CreditOption exceeded={exceeded} selected={1 - exceeded} limit={zl(6380.42)} />
      </g>
    </g>
  )
}
