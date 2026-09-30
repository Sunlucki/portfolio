import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, cover, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeOut, mix, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { useLang, useT } from '../kit/lang'
import { GOODS, SORT_AFTER, caption, marginOf, percent, tag } from './data'
import { S, mid, union, world, xy } from './layout'
import { COLS, SHOP, SORT_MENU, SORT_OPTIONS, ShopPage, ShopRow, SortMenu } from './screens/Store'
import { tw } from './twin'
import { ScreenWindow } from './Window'

/* 09 · 02 Weryfikacja · Витрина с оптовыми ценами (29 долей). Витрина без
   окна 18+. Наезд на баннер «Dynamiczne ceny B2B są aktywne dla Twojego
   konta.» и «-12%»; отъезд на список: три колонки цен и «Twój potencjalny
   zarobek». Клик по сортировке — список крупно, курсор идёт вниз до «Marża ↓».
   Строки перестраиваются: каждая приподнимается и перелетает на своё место.
   Сверху — картон 300 и картон 600 с наибольшей маржой. Нырок в миниатюру
   картона (П2) — за ней страница товара.

   6–32     наезд на баннер ×1,8; 34 — черта, 44 — обводка «-12%»; держится
   96–122   список: цены и колонка заработка (обводка заголовка 124)
   150–170  курсор к сортировке, 170 — клик; список встаёт (pop)
   176–200  наезд на список (по высоте); 206–246 курсор вниз, 246 — «Marża ↓»
   250–276  отъезд на список; 262–312 строки перестраиваются
   316      обводка «Marża» верхней строки; 296–396 выноска 09
   402–432  нырок в миниатюру картона */

const T0 = { banner: 6, list: 96, cursor: 150, open: 170, pick: 246, sort: 262, dive: 402 }

const BANNER = world(SHOP.banner)
/** Список без колонки количества: товар, три цены и маржа. */
const LIST = world({ x: SHOP.list.x, y: SHOP.list.y, w: 760, h: 412 })
const PILL = world(SHOP.sort)
const MENU_BOX = { x: SHOP.sort.x - 15, y: SHOP.sort.y + SHOP.sort.h + 6, w: SORT_MENU.w, h: SORT_MENU.h }
const MENU = world(MENU_BOX)
const PICK = SORT_OPTIONS.indexOf('Marża ↓')
const itemAt = (i: number) => world({ x: MENU_BOX.x + 6, y: MENU_BOX.y + 6 + i * 36, w: SORT_MENU.w - 12, h: 34 })

/** Где стоит товар good до и после сортировки (номер строки). */
const BEFORE = GOODS.map((_, i) => i)
const slotOf = (good: number, sorted: boolean) => (sorted ? SORT_AFTER.indexOf(good) : BEFORE.indexOf(good))
/** Строки уходят не разом: первой всплывает самая маржинальная. */
const delayOf = (good: number) => [10, 6, 3, 13, 0][good] ?? 0

const CARTON_SLOT = SHOP.row(SORT_AFTER.indexOf(2))
const THUMB = world({ x: CARTON_SLOT.x + COLS.product, y: CARTON_SLOT.y + 12, w: 64, h: 64 })

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: T0.banner, dur: 26, ...fit(BANNER, { max: 1.8, shift: [0, 60] }) },
  { at: T0.list, dur: 26, ...fit(LIST, { max: 1.3 }) },
  { at: T0.open + 4, dur: 24, ...focus(union(PILL, MENU), { fill: 0.45, tall: 0.86, shift: [-240, 0] }) },
  { at: T0.pick + 4, dur: 26, ...fit(LIST, { max: 1.3, shift: [-230, 0] }) },
  { at: T0.dive, dur: 30, ...cover(THUMB) },
]

const CURSOR = [
  { at: T0.cursor, x: PILL.x + PILL.width + 260, y: PILL.y + 260 },
  { at: T0.open - 4, x: PILL.x + PILL.width * 0.45, y: PILL.y + PILL.height * 0.55 },
  { at: T0.open + 30, x: itemAt(0).x + itemAt(0).width * 0.5, y: itemAt(0).y + itemAt(0).height * 0.5 },
  { at: T0.pick - 4, x: itemAt(PICK).x + itemAt(PICK).width * 0.42, y: itemAt(PICK).y + itemAt(PICK).height * 0.55 },
  { at: T0.pick + 26, x: itemAt(PICK).x + itemAt(PICK).width * 1.5, y: itemAt(PICK).y + 240 },
]
const CLICKS = [T0.open, T0.pick]
const LIST_CAM = viewAt(CAMERA, 340)

export const SHOP_FRAMES = Math.ceil((T0.dive + 30) / 15) * 15

export function Shop() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.pick + 22)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const menu = frame < T0.pick + 2 ? spring(frame, T0.open, SPRINGS.pop) : 1 - easeIn(span(frame, T0.pick + 2, 8))
  const hover = frame < T0.open + 26 ? -1 : Math.max(0, Math.min(PICK, Math.round((cursor.y - itemAt(0).y - 17 * S) / (36 * S))))
  const sorted = frame >= T0.pick + 4
  const topRow = world(SHOP.row(0))
  const margin = { x: topRow.x + COLS.earn * S, y: topRow.y + 52 * S, width: tw(`${t('Marża', 'Margin')}: ${percent(marginOf(GOODS[4]!.net, GOODS[4]!.retail))}`, 12, 400) * S, height: 14 * S }
  /* Выноска 09 — на «Marża» верхней строки, рамка справа от списка. */
  const anchor = camera.project(margin.x + margin.width, margin.y + margin.height / 2)
  const boxX = LIST_CAM.project(LIST.x + LIST.width, 0)[0] + 40
  /* Звук (клики, обводки, выноска, наезды и нырок — у набора): список
     сортировки выходит и закрывается после «Marża ↓»; строки перестраиваются
     одним каскадом; строка картона загорается перед нырком. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  useSoundCue('popIn', T0.open + 1, point(...mid(MENU)), { gain: 0.6 })
  useSoundCue('popOut', T0.pick + 2, point(...mid(MENU)), { gain: 0.4 })
  useSoundCue('layers', T0.sort, point(...mid(LIST)), { gain: 0.55, seconds: 0.8 })
  useSoundCue('glint', T0.dive - 20, point(...mid(world(CARTON_SLOT))), { gain: 0.4, seconds: 0.5 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow path="/shop">
          <defs>
            <filter id="b2b-lift" x="-10%" y="-40%" width="120%" height="200%">
              <feDropShadow dx={0} dy={10} stdDeviation={12} floodColor="#0f172a" floodOpacity={0.16} />
            </filter>
          </defs>
          <ShopPage sort={sorted ? 'Marża ↓' : 'Polecane'} />
          {GOODS.map((good, i) => {
            const from = SHOP.row(slotOf(i, false))
            const to = SHOP.row(slotOf(i, true))
            const move = spring(frame, T0.sort + delayOf(i), SPRINGS.glide)
            const lift = Math.max(0, Math.sin(Math.PI * clamp01(move)))
            const y = mix(from.y, to.y, move)
            const s = 1 + 0.02 * lift
            const moving = from.y !== to.y && lift > 0.02
            return { good, i, y, s, lift, moving }
          })
            .sort((a, b) => Number(a.moving) - Number(b.moving))
            .map(({ good, i, y, s, lift, moving }) => (
              <g key={good.sku} transform={`translate(${48 + 464} ${y + 44}) scale(${s}) translate(${-464} ${-44})`} filter={moving ? 'url(#b2b-lift)' : undefined}>
                <ShopRow good={good} lit={i === 2 ? easeOut(span(frame, T0.dive - 20, 10)) : lift * 0.6} />
              </g>
            ))}
          {menu > 0.001 && (
            <g opacity={clamp01(menu * 1.4)} transform={`translate(${MENU_BOX.x + MENU_BOX.w / 2} ${MENU_BOX.y}) scale(${mix(0.94, 1, clamp01(menu))}) translate(${-(MENU_BOX.x + MENU_BOX.w / 2)} ${-MENU_BOX.y})`}>
              <g transform={`translate(${MENU_BOX.x} ${MENU_BOX.y})`} filter="url(#b2b-lift)">
                <SortMenu hover={hover} picked={frame >= T0.pick ? PICK : 0} />
              </g>
            </g>
          )}
        </ScreenWindow>
        <Scribble rect={{ x: BANNER.x + 16 * S, y: BANNER.y + 14 * S, width: tw(t('Dynamiczne ceny B2B są aktywne dla Twojego konta.', 'B2B dynamic pricing is active for your account.'), 14, 500) * S, height: 16 * S }} kind="underline" p={easeOut(span(frame, 36, 14)) * (1 - easeIn(span(frame, T0.list, 8)))} width={3} color="#ffffff" />
        <Scribble rect={{ x: BANNER.x + BANNER.width - (16 + tw('-12%', 14, 600) + 24) * S, y: BANNER.y + 9 * S, width: (tw('-12%', 14, 600) + 24) * S, height: 26 * S }} p={easeOut(span(frame, 46, 16)) * (1 - easeIn(span(frame, T0.list, 8)))} pad={[12, 8]} seed={2} width={3} color="#ffffff" />
        <Scribble rect={world({ x: SHOP.list.x + 8 + COLS.earn, y: SHOP.list.y + 17, w: 132, h: 26 })} p={easeOut(span(frame, T0.list + 28, 16)) * (1 - easeIn(span(frame, T0.open - 10, 8)))} pad={[14, 8]} seed={7} width={2.8} />
        <Scribble rect={margin} kind="underline" p={easeOut(span(frame, T0.sort + 54, 14)) * (1 - easeIn(span(frame, T0.dive - 10, 8)))} width={2.8} />
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] + 40, width: 440 }} tag={tag(9, lang)} title={caption(9, lang)} at={T0.sort + 36} until={T0.dive - 12} />
      {CLICKS.map((at) => {
        const p = cursorAt(CURSOR, at)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={at} x={x} y={y} at={at} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
