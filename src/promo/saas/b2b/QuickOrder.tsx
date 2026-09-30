import { AbsoluteFill, interpolateColors, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundProbe, useSoundTrack } from '../kit/sound'
import { FONT, SHADOW, type Point, type Rect } from '../kit/theme'
import { Iris } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { QUICK_LINES, caption, tag } from './data'
import { PAGE, S, mid, world, xy } from './layout'
import { ProductToast } from './parts'
import { CheckButton, QUICK_W, QUICK_X, QuickPage, QuickResult, quickAddRect, quickLayout } from './screens/Buyer'
import { SiteHeader } from './screens/Store'
import { L } from './twin'
import { ScreenWindow } from './Window'

/* 13 · 04 Zamówienie · Заказ из таблицы (28 долей). «Szybkie zamówienie»
   раскрывается кругом из тоста оферты (П3). Кусок таблицы — наш лист с
   сеткой A/B и строками «SKU | ilość» — влетает слева, камера за ним; лист
   тонет в поле «Lub wklej z arkusza kalkulacyjnego», строки проступают.
   «Wczytaj wklejone wiersze»: вставка уходит в строки SKU (applyPaste), сразу
   «Sprawdzanie…», страница прокручивается к «Wynik» — строки встают по одной.
   «Dodaj wszystko do koszyka» — тост «Dodano 4 pozycji do koszyka» крупно,
   клик по корзине в шапке — корзина раскрывается в кадр (П1): оформление.

   0–24     круг из тоста открывает страницу
   24–50    наезд на карточку вставки
   42–84    лист таблицы летит слева к полю, камера за ним
   84–100   лист тонет в поле, строки вставки проступают
   100–134  вставка читается
   134      «Wczytaj wklejone wiersze»; 136–156 строки SKU растут, поле пустеет
   150–166  «Sprawdzanie…»; 152–184 прокрутка к «Wynik», камера на него
   170–198  строки «Wynik» по одной; 202 — сумма; 206–300 выноска 13
   300      «Dodaj wszystko do koszyka»; 304 тост; 306–328 камера на тост
   364–384  камера к корзине в шапке; 392 — клик; 394–422 корзина в кадр */

const T0 = { sheet: 42, sink: 84, load: 134, check: 150, scroll: 152, rows: 170, total: 202, add: 300, toast: 304, cart: 392, portal: 394 }
const TOAST_TEXT = `Dodano ${QUICK_LINES.length} pozycji do koszyka`
const TOAST_END = T0.toast + 24 + Math.max(36, readFrames(TOAST_TEXT))
const SCROLL = quickLayout(1).result - 150

const Q0 = quickLayout(0)
const Q1 = quickLayout(1)
const PASTE = world({ x: QUICK_X + 24, y: Q0.paste, w: 800, h: 96 })
const CARD0 = world({ x: QUICK_X, y: 188, w: QUICK_W, h: Q0.cardH })
const LOAD = world({ x: QUICK_X + 24, y: Q0.load, w: 220, h: 34 })
/** «Wynik» после прокрутки: в мире он выше на SCROLL. */
const RESULT = world({ x: QUICK_X, y: Q1.result - SCROLL, w: QUICK_W, h: 350 })
const ADD = world({ ...quickAddRect(Q1.result - SCROLL) })
const TOAST_BOX = { x: 1024 - 24 - 360, y: 659 - 24 - 56, w: 360, h: 56 }
const CART = world({ x: 1024 - 40 - 20 - 6, y: 16, w: 32, h: 32 })

/** Лист таблицы в мире: 470 × 290, летит слева к полю вставки. */
const SHEET = { w: 470, h: 290 }
function sheetAt(f: number) {
  const t = glide(span(f, T0.sheet, T0.sink - T0.sheet))
  const sink = easeIn(span(f, T0.sink, 16))
  const tx = PASTE.x + PASTE.width / 2
  const ty = PASTE.y + PASTE.height / 2
  return {
    x: mix(-700, tx, t),
    y: mix(ty + 180, ty, t) - Math.sin(Math.PI * t) * 120,
    rotate: mix(-9, 0, t),
    scale: mix(1, 0.35, sink),
    opacity: 1 - sink,
  }
}
const sheetCenter = (f: number): Point => {
  const s = sheetAt(f)
  return [s.x, s.y]
}

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 24, dur: 26, ...fit(CARD0, { max: 1.35 }) },
  { at: T0.sheet + 2, dur: 18, follow: follow((f) => { const [x, y] = sheetCenter(f); return [mix(x, PASTE.x + PASTE.width / 2, 0.45), mix(y, PASTE.y + PASTE.height / 2, 0.45)] }, { zoom: 1.2, lag: 6 }) },
  { at: T0.sink - 4, dur: 22, ...fit(union2(CARD0, PASTE), { max: 1.35 }) },
  { at: T0.scroll + 2, dur: 30, ...fit(RESULT, { max: 1.4, shift: [0, -40] }) },
  { at: T0.toast + 2, dur: 22, ...focus(world(TOAST_BOX), { fill: 0.5 }) },
  { at: TOAST_END, dur: 22, ...fit(world({ x: 1024 - 320, y: 0, w: 320, h: 64 }), { max: 2.2 }) },
]

function union2(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }
}

const CURSOR = [
  { at: 110, x: LOAD.x + LOAD.width + 240, y: LOAD.y + 170 },
  { at: T0.load - 4, x: LOAD.x + LOAD.width * 0.45, y: LOAD.y + LOAD.height * 0.55 },
  { at: T0.load + 26, x: LOAD.x + LOAD.width * 1.4, y: LOAD.y + LOAD.height * 4 },
  { at: T0.add - 26, x: ADD.x - 160, y: ADD.y + 160 },
  { at: T0.add - 4, x: ADD.x + ADD.width * 0.5, y: ADD.y + ADD.height * 0.55 },
  { at: TOAST_END + 4, x: ADD.x + ADD.width * 0.6, y: ADD.y + ADD.height * 2 },
  { at: T0.cart - 4, x: CART.x + CART.width * 0.5, y: CART.y + CART.height * 0.55 },
]
const CLICKS = [T0.load, T0.add, T0.cart]
const RESULT_CAM = viewAt(CAMERA, 250)

export const QUICK_FRAMES = Math.ceil((T0.portal + 30) / 15) * 15

export function QuickOrder() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, CLICKS)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const iris = easeInOut(span(frame, 0, 24))
  const sheet = sheetAt(frame)
  const filled = easeOut(span(frame, T0.sink + 2, 16))
  const g = easeInOut(span(frame, T0.load + 2, 20))
  const cleared = easeOut(span(frame, T0.load + 2, 10))
  const busy = frame >= T0.check && frame < T0.rows - 4
  const scroll = SCROLL * glide(span(frame, T0.scroll, 32))
  const q = quickLayout(g)
  const rows = clamp01(span(frame, T0.rows, 7)) + clamp01(span(frame, T0.rows + 7, 7)) + clamp01(span(frame, T0.rows + 14, 7)) + clamp01(span(frame, T0.rows + 21, 7))
  const total = easeOut(span(frame, T0.total, 10))
  const press = (at: number) => 1 - 0.05 * clamp01(1 - Math.abs(frame - at) / 3)
  const portal = glide(span(frame, T0.portal, 28))
  /* Выноска 13 — на сумме «916.00» (корзина готова), рамка под карточкой. */
  const anchor = camera.project(RESULT.x + (24 + 64) * S, RESULT.y + 316 * S)
  const cardBottom = RESULT_CAM.project(0, RESULT.y + RESULT.height)[1]
  const [px, py] = camera.project(CART.x + CART.width / 2, CART.y + CART.height / 2)
  const cartR = 18 * camera.zoom * S
  /* Звук (круг из тоста, клики, обводка, выноска, камера — у набора): лист
     таблицы летит к полю и тонет в нём — строки вставки встают; «Wczytaj» —
     строки SKU растут; строки «Wynik» — по одной, сумма; «Dodaj wszystko do
     koszyka» — тост и его уход; корзина раскрывается во весь кадр. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const toastMid = point(...mid(world(TOAST_BOX)))
  useSoundTrack('b2b-spreadsheet', 'whoosh', frame >= T0.sheet && frame <= T0.sink, point(...sheetCenter(frame)), { gain: 0.6 })
  useSoundCue('popIn', T0.sink + 4, point(...mid(PASTE)), { gain: 0.7 })
  useSoundCue('layers', T0.load + 2, point(...mid(world({ x: QUICK_X + 24, y: 212, w: 800, h: 184 }))), { gain: 0.5, seconds: 0.6 })
  /* «Wynik» ещё едет вверх прокруткой — точка по живой прокрутке. */
  const resultY = PAGE.y + (q.result - scroll) * S
  QUICK_LINES.forEach((_, i) => useSoundCue('popIn', T0.rows + i * 7, point(RESULT.x + (QUICK_W / 2) * S, resultY + (117 + i * 38) * S), { gain: 0.45 }))
  useSoundCue('popIn', T0.total, point(RESULT.x + (24 + 64) * S, resultY + 316 * S), { gain: 0.45 })
  useSoundCue('toast', T0.toast, toastMid, { gain: 0.8 })
  useSoundCue('popOut', TOAST_END + 10, toastMid, { gain: 0.4 })
  useSoundProbe('whoosh', portal, { x: mix(px, 960, portal), y: mix(py, 540, portal) }, { eps: 0.004, gain: 0.7 })
  return (
    <AbsoluteFill>
      <Iris at={[555, 540]} t={iris}>
        <AbsoluteFill style={{ background: 'transparent' }}>
          <Camera view={camera}>
            <ScreenWindow path="/b2b/quick-order" overlay={<ProductToast x={TOAST_BOX.x * S} y={TOAST_BOX.y * S} at={T0.toast} until={TOAST_END + 10} text={t(TOAST_TEXT, `Added ${QUICK_LINES.length} line(s) to the cart`)} scale={S} />}>
              <g transform={`translate(0 ${-scroll})`}>
                <QuickPage g={g} filled={filled} cleared={cleared} pressLoad={press(T0.load)} />
                <CheckButton y={q.check} busy={busy} spin={(frame - T0.check) * 14} />
                {frame >= T0.rows - 6 && <QuickResult y={q.result} rows={rows} total={total} show={easeOut(span(frame, T0.rows - 6, 10))} pressAdd={press(T0.add)} />}
              </g>
              <SiteHeader cart={frame < T0.toast ? 4 : 8} />
            </ScreenWindow>
            {frame >= T0.sheet - 1 && sheet.opacity > 0.01 && <SpreadsheetCard x={sheet.x} y={sheet.y} rotate={sheet.rotate} scale={sheet.scale} opacity={sheet.opacity} />}
            <Scribble rect={{ x: PASTE.x + 10 * S, y: PASTE.y + 8 * S, width: 120 * S, height: 82 * S }} p={easeOut(span(frame, T0.sink + 20, 16)) * (1 - easeIn(span(frame, T0.load - 4, 8)))} pad={[16, 8]} seed={9} width={2.8} />
          </Camera>
          {/* Польская рамка под карточкой уходит ниже 990 (сайт обрезает низ
              кадра): у английской она справа от суммы, на пустом низе карточки. */}
          <Callout anchor={anchor} box={lang === 'en' ? { x: anchor[0] + 340, y: anchor[1] - 20, width: 580 } : { x: anchor[0] + 170, y: cardBottom + 26, width: 600 }} tag={tag(13, lang)} title={caption(13, lang)} at={206} until={292} />
          {CLICKS.map((at) => {
            const p = cursorAt(CURSOR, at)
            const [x, y] = camera.project(p.x, p.y)
            return <Ripple key={at} x={x} y={y} at={at} />
          })}
          <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity * (1 - portal)} />
        </AbsoluteFill>
      </Iris>
      {portal > 0 && (
        <div
          style={{
            position: 'absolute',
            left: mix(px - cartR, 0, portal),
            top: mix(py - cartR, 0, portal),
            width: mix(cartR * 2, 1920, portal),
            height: mix(cartR * 2, 1080, portal),
            borderRadius: mix(cartR, 0, portal),
            background: interpolateColors(portal, [0, 0.5, 1], [L.primary, '#fbd0bb', L.page]),
          }}
        />
      )}
    </AbsoluteFill>
  )
}

/** Кусок таблицы (наш, не продукт): светлое стекло, сетка ячеек, столбцы A/B,
    номера строк, «SKU» и «ilość», четыре строки заказа. */
function SpreadsheetCard({ x, y, rotate, scale, opacity }: { x: number; y: number; rotate: number; scale: number; opacity: number }) {
  const rowH = 44
  const t = useT()
  return (
    <div
      style={{
        position: 'absolute',
        left: x - SHEET.w / 2,
        top: y - SHEET.h / 2,
        width: SHEET.w,
        height: SHEET.h,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(250, 251, 253, 0.94)',
        boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15, 23, 42, 0.08), ${SHADOW.lifted}`,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', height: 40, background: 'rgba(226, 232, 240, 0.9)', borderBottom: '1px solid rgba(15,23,42,0.12)', fontSize: 16, fontWeight: 700, color: '#475569' }}>
        <div style={{ width: 48 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(15,23,42,0.12)' }}>A</div>
        <div style={{ width: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(15,23,42,0.12)' }}>B</div>
      </div>
      {[['SKU', t('ilość', 'qty')], ...QUICK_LINES.map((line) => [line.sku, String(line.qty)])].map(([a, b], i) => (
        <div key={i} style={{ display: 'flex', height: rowH, borderBottom: '1px solid rgba(15,23,42,0.08)', fontSize: 19, color: '#0f172a', fontWeight: i === 0 ? 700 : 500 }}>
          <div style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b', fontWeight: 600, background: 'rgba(226,232,240,0.5)' }}>{i + 1}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', borderLeft: '1px solid rgba(15,23,42,0.08)', fontVariantNumeric: 'tabular-nums' }}>{a}</div>
          <div style={{ width: 150, display: 'flex', alignItems: 'center', padding: '0 16px', borderLeft: '1px solid rgba(15,23,42,0.08)', fontVariantNumeric: 'tabular-nums' }}>{b}</div>
        </div>
      ))}
    </div>
  )
}

