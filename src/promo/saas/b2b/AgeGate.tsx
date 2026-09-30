import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, cover, focus, viewAt, type CameraKey } from '../kit/camera'
import { DrawPath, Scribble } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, readFrames, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { Headline } from '../kit/text'
import { INK, SHADOW } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { GOODS, caption, tag } from './data'
import { PAGE, S, mid, world, xy } from './layout'
import { AgeSettingsCard, SETTINGS } from './screens/Admin'
import { AGE, AgeGateModal, SHOP, ShopPage, ShopRow } from './screens/Store'
import { Sheet } from './twin'
import { ScreenWindow } from './Window'

/* 08 · 02 Weryfikacja · Bramka 18+ · opcjonalnie (24 доли). Кнопка письма
   раскрылась светлым кадром — это витрина: камера отъезжает, страница встаёт
   в окно, над ней — окно 18+ (ProfessionalGateModal). Наезд, окно читается,
   клик «Tak». Окно переворачивается (П15): на обороте — карточка настроек
   продавца «Produkty z ograniczeniem wiekowym». Переключатель щёлкает
   вкл → выкл → вкл, рядом рисуется «opcjonalnie». Карточка уходит, витрина
   светлеет — дальше она без окна 18+.

   0–30     отъезд со светлого кадра, витрина проявляется (6–18)
   16–30    затемнение; 24 — окно 18+ встаёт (pop)
   30–56    наезд на окно (46% ширины, по высоте)
   56–…     окно читается (readFrames), клик «Tak»
   +4…+30   переворот в карточку настроек; наезд на неё
   +34, +60 переключатель выкл → вкл; «opcjonalnie» и стрелка
   +50…+150 выноска 08; +160…+186 карточка уходит, витрина светлеет */

const MODAL_TEXT = 'Produkty z ograniczeniem wiekowym. Ta strona zawiera produkty przeznaczone wyłącznie dla osób pełnoletnich, które ukończyły 18 lat. Czy masz ukończone 18 lat?'
const T0 = { modal: 24, read: 56, click: 0, flip: 0, off: 0, on: 0, gone: 0 }
T0.click = T0.read + readFrames(MODAL_TEXT) + 6
T0.flip = T0.click + 4
T0.off = T0.flip + 40
T0.on = T0.off + 26
T0.gone = T0.on + 96

/** Окно 18+ — по центру страницы (CSS px продукта). */
const MODAL = { x: (1024 - AGE.w) / 2, y: (659 - AGE.h) / 2, w: AGE.w, h: AGE.h }
const MODAL_WORLD = world(MODAL)
/** Карточка настроек на обороте — во всю ширину окна 18+. */
const SET_SCALE = (AGE.w / SETTINGS.w) * S
const SET_H = SETTINGS.h * SET_SCALE
const SET_WORLD = { x: MODAL_WORLD.x, y: MODAL_WORLD.y + (MODAL_WORLD.height - SET_H) / 2, width: MODAL_WORLD.width, height: SET_H }
const YES = world({ x: MODAL.x + AGE.yes.x, y: MODAL.y + AGE.yes.y, w: AGE.yes.w, h: AGE.yes.h })
const TOGGLE = { x: SET_WORLD.x + SETTINGS.toggle.x * SET_SCALE, y: SET_WORLD.y + (SETTINGS.toggle.y - 16) * SET_SCALE, width: SETTINGS.toggle.w * SET_SCALE, height: SETTINGS.toggle.h * SET_SCALE }

const CAMERA: CameraKey[] = [
  { at: 0, ...cover(PAGE) },
  { at: 0, dur: 30, ...HOME },
  { at: 30, dur: 26, ...focus(MODAL_WORLD, { fill: 0.5, tall: 0.86 }) },
  { at: T0.flip + 18, dur: 24, ...focus(SET_WORLD, { fill: 0.5, shift: [-300, 0] }) },
  { at: T0.gone, dur: 30, ...HOME },
]

const CURSOR = [
  { at: T0.click - 28, x: YES.x + YES.width + 200, y: YES.y + 170 },
  { at: T0.click - 4, x: YES.x + YES.width * 0.55, y: YES.y + YES.height * 0.6 },
  { at: T0.click + 22, x: YES.x + YES.width * 0.9, y: YES.y + YES.height * 3 },
]
const CLICK_AT = cursorAt(CURSOR, T0.click)
const SET_CAM = viewAt(CAMERA, T0.on)

export const AGE_FRAMES = Math.ceil((T0.gone + 34) / 15) * 15

export function AgeGate() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const show = easeOut(span(frame, 6, 12))
  const scrim = easeOut(span(frame, 16, 12)) * (1 - easeInOut(span(frame, T0.gone, 24)))
  const modal = spring(frame, T0.modal, SPRINGS.pop)
  const turn = spring(frame, T0.flip, SPRINGS.heavy)
  const leave = easeIn(span(frame, T0.gone, 12))
  const on = frame < T0.off ? 1 : frame < T0.on ? 1 - spring(frame, T0.off, SPRINGS.snap) : spring(frame, T0.on, SPRINGS.snap)
  const press = 1 - 0.05 * clamp01(1 - Math.abs(frame - T0.click) / 3)
  const cursor = cursorAt(CURSOR, frame, [T0.click], T0.click + 18)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [rx, ry] = camera.project(CLICK_AT.x, CLICK_AT.y)
  const [tx, ty] = SET_CAM.project(TOGGLE.x + TOGGLE.width, TOGGLE.y + TOGGLE.height / 2)
  const [ax, ay] = camera.project(TOGGLE.x + TOGGLE.width / 2, TOGGLE.y + TOGGLE.height / 2)
  const word = easeOut(span(frame, T0.off + 8, 14)) * (1 - easeIn(span(frame, T0.gone - 6, 10)))
  /* Звук (клик «Tak», переворот, обводка, «opcjonalnie», стрелка, выноска и
     камера — у набора): окно 18+ встаёт над витриной; переключатель щёлкает
     «выкл» и снова «вкл», рядом встаёт «opcjonalnie»; карточка уходит,
     витрина светлеет. */
  const modalMid = xy(camera.project(...mid(MODAL_WORLD)))
  useSoundCue('popIn', T0.modal, modalMid, { gain: 0.8 })
  useSoundCue('toggle', T0.off, { x: ax, y: ay }, { gain: 0.7 })
  useSoundCue('toggle', T0.on, { x: ax, y: ay }, { gain: 0.85 })
  useSoundCue('air', T0.gone, modalMid, { gain: 0.5, seconds: 0.6 })
  /* «opcjonalnie» встаёт на следующем кадре после своего at — Headline
     монтируется, когда слово уже видно, и свой хлопок пропускает. */
  useSoundCue('popIn', T0.off + 9, { x: tx + 150 + 170, y: ty - 150 + 35 }, { gain: 0.45 })
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <ScreenWindow path="/shop">
          <g opacity={show} style={{ filter: scrim > 0.01 ? `blur(${(4 * scrim).toFixed(2)}px)` : undefined }}>
            <ShopPage sort="Polecane" />
            {GOODS.map((good, i) => {
              const r = SHOP.row(i)
              return (
                <g key={good.sku} transform={`translate(${r.x} ${r.y})`}>
                  <ShopRow good={good} />
                </g>
              )
            })}
          </g>
          <rect x={0} y={0} width={1024} height={659} fill="rgba(7,6,7,0.42)" opacity={scrim} />
        </ScreenWindow>
        {frame >= T0.modal && leave < 1 && (
          <Flip
            angle={180 * turn}
            perspective={2200}
            style={{
              left: MODAL_WORLD.x,
              top: MODAL_WORLD.y,
              width: MODAL_WORLD.width,
              height: MODAL_WORLD.height,
              opacity: clamp01(modal * 1.4) * (1 - leave),
              transform: `translateY(${(1 - clamp01(modal)) * 30 - leave * 60}px) scale(${mix(0.92, 1, clamp01(modal)) * mix(1, 0.9, leave)})`,
            }}
            front={
              <div style={{ position: 'absolute', inset: 0, borderRadius: 40 * S, boxShadow: SHADOW.lifted }}>
                <Sheet w={AGE.w} h={AGE.h} scale={S} style={{ left: 0, top: 0 }}>
                  <AgeGateModal press={press} />
                </Sheet>
              </div>
            }
            back={
              <div style={{ position: 'absolute', left: 0, top: SET_WORLD.y - MODAL_WORLD.y, width: SET_WORLD.width, height: SET_WORLD.height, borderRadius: 16 * SET_SCALE, boxShadow: SHADOW.lifted }}>
                <Sheet w={SETTINGS.w} h={SETTINGS.h} scale={SET_SCALE} style={{ left: 0, top: 0 }}>
                  <AgeSettingsCard on={on} />
                </Sheet>
              </div>
            }
          />
        )}
        <Scribble rect={TOGGLE} p={easeOut(span(frame, T0.off - 6, 16)) * (1 - easeIn(span(frame, T0.gone - 8, 10)))} pad={[18, 12]} seed={6} width={3} />
      </Camera>
      {/* «opcjonalnie» — простой текст сбоку от переключателя, стрелка к нему. */}
      {word > 0 && (
        <>
          <div style={{ position: 'absolute', left: tx + 150, top: ty - 150, opacity: word }}>
            <Headline text={t('opcjonalnie', 'optional')} at={T0.off + 8} size={58} weight={750} tracking={-0.03} color={INK} exit={T0.gone - 6} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, opacity: word }}>
            <DrawPath d={`M ${tx + 140} ${ty - 96} Q ${tx + 80} ${ty - 70}, ${ax + 60} ${ay - 18}`} p={easeInOut(span(frame, T0.off + 16, 14))} color={INK} width={3} />
            <DrawPath d={`M ${ax + 60} ${ay - 18} l 18 -2 M ${ax + 60} ${ay - 18} l 8 -16`} p={easeInOut(span(frame, T0.off + 28, 6))} color={INK} width={3} />
          </div>
        </>
      )}
      <Callout anchor={[ax, ay + 30]} box={{ x: tx + 140, y: ty + 60, width: 560 }} tag={tag(8, lang)} title={caption(8, lang)} at={T0.off + 30} until={T0.gone - 10} />
      <Ripple x={rx} y={ry} at={T0.click} />
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

