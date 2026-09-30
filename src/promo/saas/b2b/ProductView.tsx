import { useId, type ReactNode } from 'react'
import { useLang, useT } from '../kit/lang'
import { clamp01, mix } from '../kit/motion'
import { CHROME } from '../kit/surfaces'
import { SHADOW } from '../kit/theme'
import { Layer, LayerStack } from '../kit/transitions'
import { CARTON, TIERS, YOUR_PRICE, unitPrice, zl } from './data'
import { PAGE, S, WINDOW } from './layout'
import { AddButton, BestPrice, Chips, PRODUCT, PriceCell, ProductBase, Stepper, addTotal } from './screens/Store'
import { L, R, Sheet, T, tw } from './twin'
import { ScreenWindow } from './Window'

/* Страница товара «Karton klapowy 600×400×400 mm 5-warstwowy» по слоям: каркас
   — SVG окна, ячейки цен, чипы, пороги, количество и кнопка — отдельные листы
   поверх (их можно приподнять в стопке слоёв, С). Состояние задаёт сцена:
   количество и переход к нему, своя цена клиента. */

export interface ProductState {
  /** Количество до и после смены, доля смены 0…1. */
  from: number
  to: number
  k: number
  /** Что напечатано в поле количества и горит ли каретка. */
  typed?: string
  caret?: boolean
  /** Своя цена клиента (0…1): ячейка B2B переворачивается в зелёную, пороги —
      в «Masz najlepszą cenę». */
  yours?: number
  /** Наклон стопки (0 — плоско) и подъём слоёв к зрителю (0…1). */
  tilt?: number
  lift?: [number, number, number, number]
  /** Нажатия «−» и «+». */
  press?: [number, number]
}

/** Надпись, которая меняется (м-статус): старая уезжает вверх, новая
    въезжает снизу; видна только в полосе [y − h, y + h/3]. */
export function SlideText({ from, to, k, x, y, s, w = 400, c = L.fg, a = 'start' }: { from: string; to: string; k: number; x: number; y: number; s: number; w?: number; c?: string; a?: 'start' | 'middle' | 'end' }) {
  const id = `b2b-slide-${useId().replace(/:/g, '')}`
  if (from === to || k >= 1 || k <= 0) {
    return (
      <T x={x} y={y} s={s} w={w} c={c} a={a}>
        {k >= 1 ? to : from}
      </T>
    )
  }
  const width = Math.max(tw(from, s, w), tw(to, s, w)) + 8
  const left = a === 'start' ? x - 4 : a === 'middle' ? x - width / 2 : x - width + 4
  const t = clamp01(k)
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={left} y={y - s * 1.05} width={width} height={s * 1.45} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(0 ${-t * s * 1.2})`} opacity={1 - t}>
          <T x={x} y={y} s={s} w={w} c={c} a={a}>
            {from}
          </T>
        </g>
        <g transform={`translate(0 ${(1 - t) * s * 1.2})`} opacity={t}>
          <T x={x} y={y} s={s} w={w} c={c} a={a}>
            {to}
          </T>
        </g>
      </g>
    </g>
  )
}

const earningsOf = (qty: number, yours = false) => Math.round((CARTON.retail - (yours ? YOUR_PRICE : unitPrice(qty))) * qty * 100) / 100
const tierIndex = (qty: number) => {
  let index = -1
  TIERS.forEach((tier, i) => {
    if (qty >= tier.from) index = i
  })
  return index
}

export function ProductWindow({ state, path, overlay, place = WINDOW }: { state: ProductState; path?: string; overlay?: ReactNode; place?: { x: number; y: number } }) {
  const { from, to, k } = state
  const lang = useLang()
  const t = useT()
  const tilt = state.tilt ?? 0
  const lift = state.lift ?? [0, 0, 0, 0]
  const yours = clamp01(state.yours ?? 0)
  const flat = tilt < 0.0005
  const cellRect = (i: number) => PRODUCT.cells[i]!
  /* Подъём слоя (0…1): ячейка выходит к зрителю — крупнее, выше, с тенью. */
  const popStyle = (k: number) => (k > 0.001 ? { transform: `translateY(${-16 * k}px) scale(${1 + 0.1 * k})`, boxShadow: SHADOW.lifted } : {})
  const layer = (rect: { x: number; y: number; w: number; h: number }, depth: number, children: ReactNode, key: string, radius = 16) => (
    <Layer key={key} depth={0} style={{ left: rect.x * S, top: rect.y * S, width: rect.w * S, height: rect.h * S, borderRadius: radius * S, zIndex: depth > 0.001 ? 2 : undefined, ...popStyle(depth) }}>
      <Sheet w={rect.w} h={rect.h} scale={S} style={{ left: 0, top: 0 }}>
        {children}
      </Sheet>
    </Layer>
  )
  const fromTotal = zl(addTotal(from))
  const toTotal = zl(yours > 0.5 ? addTotal(1, true) : addTotal(to))
  const earnFrom = zl(earningsOf(from))
  const earnTo = zl(yours > 0.5 ? earningsOf(1, true) : earningsOf(to))
  const litFrom = tierIndex(from)
  const litTo = tierIndex(to)
  const addLabel = (
    <SlideText from={`${t('Dodaj do koszyka', 'Add to Cart')} — ${fromTotal}`} to={`${t('Dodaj do koszyka', 'Add to Cart')} — ${toTotal}`} k={yours > 0 ? yours : k} x={PRODUCT.add.x + 46} y={PRODUCT.add.y + 27} s={14} w={500} c="#ffffff" />
  )
  return (
    <LayerStack t={tilt} rotateX={48} rotateZ={-24} scale={0.86} perspective={3000} style={{ left: place.x, top: place.y, width: PAGE.width, height: PAGE.height + CHROME }}>
      <ScreenWindow
        path={path ?? (lang === 'en' ? '/product/shipping-box-600x400x400' : '/product/karton-klapowy-600x400x400')}
        clip={flat}
        style={{ left: 0, top: 0 }}
        overlay={
          <>
            {/* Ячейка B2B: при своей цене — переворот по горизонтали в зелёную. */}
            <Layer depth={0} style={{ left: cellRect(0).x * S, top: cellRect(0).y * S, width: cellRect(0).w * S, height: cellRect(0).h * S, perspective: 900, zIndex: lift[0] > 0.001 || (yours > 0 && yours < 1) ? 2 : undefined, ...popStyle(Math.max(lift[0], Math.sin(Math.PI * yours))) }}>
              <div style={{ position: 'absolute', inset: 0, transform: yours > 0 && yours < 1 ? `rotateX(${yours < 0.5 ? yours * 180 : (yours - 1) * 180}deg)` : undefined, borderRadius: 16 * S }}>
                <Sheet w={144} h={110} scale={S} style={{ left: 0, top: 0 }}>
                  <PriceCell kind="b2b" yours={yours >= 0.5} />
                </Sheet>
              </div>
            </Layer>
            {layer(cellRect(1), lift[1], <PriceCell kind="retail" />, 'retail')}
            {layer(
              cellRect(2),
              lift[2],
              <PriceCell kind="earn" qty={yours > 0.5 ? 1 : mix(from, to, k)} yours={yours > 0.5} value={<SlideText from={earnFrom} to={earnTo} k={yours > 0 ? yours : k} x={12} y={76} s={17} w={650} c={L.emeraldText} />} />,
              'earn',
            )}
            <Sheet w={PRODUCT.chips.w} h={PRODUCT.chips.h} scale={S} style={{ left: PRODUCT.chips.x * S, top: PRODUCT.chips.y * S, opacity: 1 - yours }}>
              {to > 1 && k > 0 ? (
                <g>
                  <g opacity={from > 1 ? 1 - k : 0}>{from > 1 && <Chips qty={from} />}</g>
                  <g opacity={k} transform={`translate(0 ${(1 - k) * 8})`}>
                    <Chips qty={to} />
                  </g>
                </g>
              ) : (
                <Chips qty={from} />
              )}
            </Sheet>
            {layer(
              PRODUCT.tiers,
              lift[3],
              <g>
                <g opacity={1 - clamp01(yours * 2.2)}>
                  <TiersLit lit={TIERS.map((_, i) => (i === litTo ? (litFrom === litTo ? 1 : k) : i === litFrom ? 1 - k : 0))} />
                </g>
                {yours > 0.5 && (
                  <g opacity={clamp01(yours * 2 - 1)} transform={`translate(0 ${(1 - clamp01(yours * 2 - 1)) * 12})`}>
                    <BestPrice />
                  </g>
                )}
              </g>,
              'tiers',
            )}
            <Sheet w={1024} h={659} scale={S} style={{ left: 0, top: 0 }}>
              <Stepper press={state.press} qty={<QtyValue text={state.typed ?? String(to)} caret={state.caret ?? false} />} />
              <AddButton label={addLabel} />
            </Sheet>
            {overlay}
          </>
        }
      >
        <ProductBase />
      </ScreenWindow>
    </LayerStack>
  )
}

/** Значение количества по центру степпера и каретка (м-ввод). */
function QtyValue({ text, caret }: { text: string; caret: boolean }) {
  const q = PRODUCT.qty
  const width = tw(text, 16, 600)
  return (
    <g>
      <T x={q.x + q.w / 2} y={q.y + q.h / 2 + 6} s={16} w={600} a="middle">
        {text}
      </T>
      {caret && <rect x={q.x + q.w / 2 + width / 2 + 2} y={q.y + 12} width={1.6} height={20} rx={0.8} fill={L.primary} />}
    </g>
  )
}

/** Пороги с подсветкой по строкам (0…1 у каждой). */
function TiersLit({ lit }: { lit: number[] }) {
  const { w, h } = PRODUCT.tiers
  const t = useT()
  return (
    <g>
      <R x={0} y={0} w={w} h={h} r={16} fill="rgba(250,79,0,0.05)" />
      <R x={0} y={0} w={w} h={h} r={16} stroke="rgba(250,79,0,0.22)" />
      <T x={16} y={26} s={14} w={650}>
        {t('Progi rabatowe ilościowe', 'Bulk discount tiers')}
      </T>
      <T x={w - 16} y={26} s={12} c={L.mutedFg} a="end">
        {t('Więcej w koszyku, niższa cena za sztukę.', 'Order more, pay less per unit.')}
      </T>
      <T x={16} y={46} s={12} w={500} c={L.mutedFg}>
        {t('Rabaty są liczone od kwoty netto.', 'Discounts are calculated from the net amount.')}
      </T>
      {TIERS.map((tier, index) => {
        const y = 60 + index * 32
        const k = clamp01(lit[index] ?? 0)
        return (
          <g key={tier.from}>
            <R x={12} y={y} w={w - 24} h={28} r={12} fill={k > 0 ? `rgba(250,79,0,${0.15 * k})` : L.card} />
            <R x={12} y={y} w={w - 24} h={28} r={12} stroke={`rgba(250,79,0,${0.08 + 0.34 * k})`} />
            <T x={24} y={y + 19} s={14} w={k > 0.5 ? 650 : 400}>
              {t(`Od ${tier.from} szt. — ${tier.percent}% rabatu`, `From ${tier.from} pcs — ${tier.percent}% off`)}
            </T>
            <T x={w - 24} y={y + 19} s={14} w={k > 0.5 ? 650 : 400} a="end">
              {zl(unitPrice(tier.from))}
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** Прямоугольники страницы товара в мире (для камеры и курсора). */
export const PRODUCT_WORLD = {
  cell: (i: number) => ({ x: PAGE.x + PRODUCT.cells[i]!.x * S, y: PAGE.y + PRODUCT.cells[i]!.y * S, width: PRODUCT.cells[i]!.w * S, height: PRODUCT.cells[i]!.h * S }),
  qty: { x: PAGE.x + PRODUCT.qty.x * S, y: PAGE.y + PRODUCT.qty.y * S, width: PRODUCT.qty.w * S, height: PRODUCT.qty.h * S },
  add: { x: PAGE.x + PRODUCT.add.x * S, y: PAGE.y + PRODUCT.add.y * S, width: PRODUCT.add.w * S, height: PRODUCT.add.h * S },
  tiers: { x: PAGE.x + PRODUCT.tiers.x * S, y: PAGE.y + PRODUCT.tiers.y * S, width: PRODUCT.tiers.w * S, height: PRODUCT.tiers.h * S },
  chips: { x: PAGE.x + PRODUCT.chips.x * S, y: PAGE.y + PRODUCT.chips.y * S, width: PRODUCT.chips.w * S, height: PRODUCT.chips.h * S },
  image: { x: PAGE.x + PRODUCT.image.x * S, y: PAGE.y + PRODUCT.image.y * S, width: PRODUCT.image.w * S, height: PRODUCT.image.h * S },
}
