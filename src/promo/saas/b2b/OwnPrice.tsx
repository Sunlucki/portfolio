import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, readFrames, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { CHROME } from '../kit/surfaces'
import { Flip } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { caption, tag } from './data'
import { PAGE, S, WINDOW, mid, union, world, xy } from './layout'
import { ProductToast } from './parts'
import { PRODUCT_WORLD, ProductWindow } from './ProductView'
import { CANDIDATES, Candidates, DiscountRow, EDITOR, EditorPage, EditorSearch, EditorTable } from './screens/Admin'
import { tw } from './twin'
import { ScreenWindow } from './Window'

/* 11 · 03 Ceny · Своя цена клиента (33 доли). Страница товара
   переворачивается, как лист (П15): на обороте — редактор этого же товара у
   продавца, раздел «Zniżki» → «Indywidualne zniżki B2B na użytkownika».
   Поиск фирмы «Hurt» — подсказки крупно, выбор; «Cena stała (zł)», 7.90,
   «Dodaj» — тост «Zniżka zapisana» крупно, в таблице — строка фирмы.
   Лист переворачивается обратно — витрина покупателя: ячейка B2B
   переворачивается зелёной «Twoja cena 7,90 zł», старая цена зачёркнута,
   пороги сменяются на «Masz najlepszą cenę».

   0–30     переворот витрины в редактор
   30–56    наезд на «Zniżki»
   60–76    курсор к поиску, 76 — клик; 80–92 «Hurt» печатается
   96       подсказки встают; держатся (readFrames)
   140      клик по фирме; 144–156 строка «Rodzaj / Wartość / Dodaj»
   162      клик в «Wartość»; 166–178 «7.90»; 190 — «Dodaj»
   192      тост «Zniżka zapisana»; 198–220 камера на тост; держится
   258–282  камера к таблице: строка фирмы, «7.90 zł» подчёркнута
   300–334  отъезд и переворот обратно к витрине
   334–360  наезд на колонку цен; 364–384 ячейка → «Twoja cena»
   384–480  выноска 11 */

const T0 = { search: 76, typing: 80, open: 96, pick: 140, value: 162, typing2: 166, add: 190, toast: 192, table: 258, back: 300, column: 334, yours: 364 }
const TOAST_TEXT = 'Zniżka zapisana'
const TOAST_END = T0.toast + 28 + Math.max(36, readFrames(TOAST_TEXT))

const SEARCH = world(EDITOR.search)
const MENU_BOX = { x: EDITOR.search.x, y: EDITOR.search.y + EDITOR.search.h + 6, w: CANDIDATES.w, h: CANDIDATES.h }
const FIRST = world({ x: MENU_BOX.x + 6, y: MENU_BOX.y + 8, w: MENU_BOX.w - 12, h: 42 })
const ROW = world(EDITOR.row)
const VALUE = { x: ROW.x + (EDITOR.row.w * 0.52 + 10) * S, y: ROW.y + 20 * S, width: EDITOR.row.w * 0.28 * S, height: 40 * S }
const ADD = { x: ROW.x + (EDITOR.row.w - (EDITOR.row.w * 0.2 - 20)) * S, y: ROW.y + 20 * S, width: (EDITOR.row.w * 0.2 - 20) * S, height: 40 * S }
const SECTION_VIEW = world({ x: EDITOR.section.x, y: 186, w: EDITOR.section.w, h: 400 })
const TABLE = world(EDITOR.table)
const TOAST_BOX = { x: 1024 - 24 - 360, y: 659 - 24 - 56, w: 360, h: 56 }
const TOAST_WORLD = world(TOAST_BOX)
const TITLE = { x: PAGE.x + 536 * S, y: PAGE.y + 128 * S, width: 456 * S, height: 80 * S }
const COLUMN = union(TITLE, PRODUCT_WORLD.cell(0), PRODUCT_WORLD.cell(2), PRODUCT_WORLD.tiers, PRODUCT_WORLD.add)

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 30, dur: 26, ...fit(SECTION_VIEW, { max: 1.5 }) },
  { at: T0.toast + 6, dur: 22, ...focus(TOAST_WORLD, { fill: 0.5 }) },
  { at: TOAST_END, dur: 24, ...fit(union(TABLE, world({ x: EDITOR.section.x, y: EDITOR.section.y, w: EDITOR.section.w, h: 60 })), { max: 1.55 }) },
  { at: T0.back - 10, dur: 22, ...HOME },
  { at: T0.column, dur: 26, ...fit(COLUMN, { max: 1.5, margin: 70, shift: [-250, 0] }) },
  { at: 472, dur: 22, ...HOME },
]

const CURSOR = [
  { at: 58, x: SEARCH.x + SEARCH.width * 0.7, y: SEARCH.y + 220 },
  { at: T0.search - 4, x: SEARCH.x + SEARCH.width * 0.3, y: SEARCH.y + SEARCH.height * 0.55 },
  { at: T0.open + 16, x: SEARCH.x + SEARCH.width * 0.45, y: SEARCH.y + SEARCH.height * 1.6 },
  { at: T0.pick - 4, x: FIRST.x + FIRST.width * 0.3, y: FIRST.y + FIRST.height * 0.55 },
  { at: T0.value - 4, x: VALUE.x + VALUE.width * 0.5, y: VALUE.y + VALUE.height * 0.55 },
  { at: T0.add - 4, x: ADD.x + ADD.width * 0.5, y: ADD.y + ADD.height * 0.55 },
  { at: T0.add + 24, x: ADD.x + ADD.width * 1.2, y: ADD.y + ADD.height * 3 },
]
const CLICKS = [T0.search, T0.pick, T0.value, T0.add]
const COL_CAM = viewAt(CAMERA, 420)

export const OWN_PRICE_FRAMES = 495

export function OwnPrice() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS, T0.add + 20)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const turn = spring(frame, 0, SPRINGS.heavy) * 180 + spring(frame, T0.back, SPRINGS.heavy) * 180
  /* Запрос в поиске фирмы: польское «Hurt» (начало названия) английский зритель
     прочтёт как слово «hurt» — у английского ищем по имени «Anna» (тоже 4 знака,
     печать та же). */
  const query = (lang === 'en' ? 'Anna' : 'Hurt').slice(0, frame < T0.typing ? 0 : Math.min(4, Math.floor((frame - T0.typing) / 3) + 1))
  const value = '7.90'.slice(0, frame < T0.typing2 ? 0 : Math.min(4, Math.floor((frame - T0.typing2) / 3) + 1))
  const menu = frame < T0.pick ? spring(frame, T0.open, SPRINGS.pop) : 1 - easeIn(span(frame, T0.pick + 2, 8))
  const row = frame < T0.add + 4 ? easeOut(span(frame, T0.pick + 4, 12)) : 1 - easeIn(span(frame, T0.add + 4, 10))
  const added = easeOut(span(frame, T0.add + 6, 12))
  const press = 1 - 0.05 * clamp01(1 - Math.abs(frame - T0.add) / 3)
  const yours = easeInOut(span(frame, T0.yours, 20))
  const green = PRODUCT_WORLD.cell(0)
  /* Выноска 11 — на зелёной ячейке «Twoja cena», рамка справа от колонки. */
  const anchor = camera.project(green.x + green.width * 0.9, green.y + green.height * 0.82)
  const boxX = COL_CAM.project(COLUMN.x + COLUMN.width, 0)[0] + 50
  const place = { x: 0, y: 0 }
  const editorDecided = frame >= T0.add + 6
  /* Звук (перевороты листа, клики, черты, выноска, камера — у набора): «Hurt»
     печатается, подсказки выходят списком; строка скидки встаёт, «7.90»
     печатается; «Zniżka zapisana» — тост и его уход; ячейка B2B
     переворачивается зелёной «Twoja cena». */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const toastMid = point(...mid(TOAST_WORLD))
  const greenMid = point(...mid(green))
  useSoundCues('key', [0, 1, 2, 3].map((k) => T0.typing + k * 3), point(SEARCH.x + SEARCH.width * 0.3, SEARCH.y + SEARCH.height / 2), { gain: 0.9 })
  useSoundCue('popIn', T0.open, point(...mid(world(MENU_BOX))), { gain: 0.6 })
  useSoundCue('popIn', T0.pick + 5, point(...mid(ROW)), { gain: 0.5 })
  useSoundCues('key', [0, 1, 2, 3].map((k) => T0.typing2 + k * 3), point(...mid(VALUE)), { gain: 0.9 })
  useSoundCue('toast', T0.toast, toastMid, { gain: 0.8 })
  useSoundCue('popOut', TOAST_END + 10, toastMid, { gain: 0.4 })
  useSoundCue('flip', T0.yours, greenMid, { gain: 0.6 })
  useSoundCue('glint', T0.yours + 12, greenMid, { gain: 0.5, seconds: 0.6 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Flip
          angle={turn}
          perspective={3600}
          style={{ left: WINDOW.x, top: WINDOW.y, width: PAGE.width, height: PAGE.height + CHROME }}
          front={<ProductWindow place={place} state={frame < T0.back ? { from: 10, to: 50, k: 1, typed: '50' } : { from: 1, to: 1, k: 0, typed: '1', yours }} />}
          back={
            <ScreenWindow
              path="/admin/products/krt-6044-5w"
              style={{ left: 0, top: 0 }}
              overlay={<ProductToast x={TOAST_BOX.x * S} y={TOAST_BOX.y * S} at={T0.toast} until={TOAST_END + 10} text={t(TOAST_TEXT, 'Discount saved')} scale={S} />}
            >
              <EditorPage />
              <g transform={`translate(${EDITOR.table.x} ${EDITOR.table.y})`}>
                <EditorTable added={editorDecided ? added : 0} />
              </g>
              <g transform={`translate(${EDITOR.search.x} ${EDITOR.search.y})`}>
                <EditorSearch value={frame < T0.add + 6 ? query : ''} focus={frame >= T0.search && frame < T0.pick} />
              </g>
              {row > 0.001 && (
                <g transform={`translate(${EDITOR.row.x} ${EDITOR.row.y + (1 - row) * 10})`} opacity={row}>
                  <DiscountRow value={value} focus={frame >= T0.value && frame < T0.add} press={press} />
                </g>
              )}
              {menu > 0.001 && (
                <g opacity={clamp01(menu * 1.4)} transform={`translate(${MENU_BOX.x} ${MENU_BOX.y + (1 - clamp01(menu)) * -8})`}>
                  <Candidates hover={frame >= T0.open + 20 ? 0 : -1} />
                </g>
              )}
            </ScreenWindow>
          }
        />
        <Scribble rect={{ x: TABLE.x + 524 * S, y: TABLE.y + 46 * S, width: tw('7.90 zł', 14, 650) * S, height: 16 * S }} kind="underline" p={easeOut(span(frame, TOAST_END + 26, 14)) * (1 - easeIn(span(frame, T0.back - 12, 8)))} width={3} />
        <Scribble rect={green} p={easeOut(span(frame, T0.yours + 22, 16)) * (1 - easeIn(span(frame, 470, 8)))} pad={[16, 10]} seed={8} width={3} />
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 40, width: 470 }} tag={tag(11, lang)} title={caption(11, lang)} at={384} until={470} />
      {CLICKS.map((at) => {
        const p = cursorAt(CURSOR, at)
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={at} x={x} y={y} at={at} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

