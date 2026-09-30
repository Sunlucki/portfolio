import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, PaperPlane } from '../kit/draw'
import { pick, useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { Painted, canvasOf } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Deck, Flip } from '../kit/transitions'
import { PopIn, Toast } from '../kit/ui'
import { useSoundTrack } from '../kit/sound'
import { Screen, centerOf, useCueList } from './common'
import { KANBAN, LIGHT, MENU_SEND, OFFER, OFFER_MORE, caption, crmHistoryEntry, crmKanban, crmKanbanCard, crmOfferCard, crmOfferMenu, kanbanLayout, tag, useCrmTwins } from './twins'

/* 11–12 · 03 Sprzedaż · Канбан и оферта. Канбан въезжает колодой; курсор
   тащит карточку Marek Zieliński из «W kontakcie» в «Spotkanie», камера
   следует за ней; тост продукта крупно. Затем карточка переворачивается в
   оферту: «⋯» → «Wyślij klientowi», «Szkic» → «Wysłana», запись в истории
   лида — и лист складывается в самолётик, который летит к «Poczta». */

const KL = kanbanLayout()
const KS = 0.78
const BOARD: Rect = { x: (1920 - KANBAN.width * KS) / 2, y: (1080 - KANBAN.height * KS) / 2, width: KANBAN.width * KS, height: KANBAN.height * KS }
const onBoard = (rect: Rect): Rect => ({ x: BOARD.x + rect.x * KS, y: BOARD.y + rect.y * KS, width: rect.width * KS, height: rect.height * KS })
const FROM_CARD = onBoard(KL.cardY(1, 0))
const TO_CARD = onBoard(KL.cardY(2, 2))
const COLUMN_TO = onBoard(KL.columns[2]!)
const COLUMNS_VIEW = fit({ x: onBoard(KL.columns[1]!).x - 10, y: FROM_CARD.y - 70, width: COLUMN_TO.x + COLUMN_TO.width - onBoard(KL.columns[1]!).x + 20, height: TO_CARD.y + TO_CARD.height - FROM_CARD.y + 110 }, { max: 1.7 })

/* ── 11 · Канбан: лид переезжает в «Spotkanie» ──────────────────────────
   0–26    канбан въезжает снизу колодой (П8), прежний экран уходит в неё
   26–56   наезд на «W kontakcie» и «Spotkanie» ×1,7
   56–70   курсор к карточке Marek Zieliński, 72 — взял
   72–132  карточка парит за курсором с наклоном 6°, камера следует за ней;
           колонка-приёмник — бирюзовая рамка
   132     посадка (snap), счётчики колонок меняются
   140–200 тост «Marek Zieliński → „Spotkanie”» крупно
   200–226 камера на «Spotkanie» левее центра; 214–290 — выноска */

const GRAB = 72
const DROP = 132
const TOAST_SCALE = 1.4
const TOAST_11: Rect = { x: BOARD.x + BOARD.width - 28 - 320 * TOAST_SCALE, y: BOARD.y + BOARD.height - 28 - 82, width: 320 * TOAST_SCALE, height: 82 }
const TOAST_11_TEXT = { title: 'Marek Zieliński → „Spotkanie”', description: 'Etap „W kontakcie” zmieniony' }
/** Тот же тост по-английски (i18n kanban.toast); время на чтение — по польскому. */
const TOAST_11_EN = { title: 'Marek Zieliński → “Meeting”', description: 'Moved from “Contacted”' }
const TOAST_11_HOLD = 142 + 22 + readFrames(`${TOAST_11_TEXT.title} ${TOAST_11_TEXT.description}`)

/** После тоста — «Spotkanie» левее центра: справа место под выноску. */
const SPOTKANIE_VIEW = fit({ x: COLUMN_TO.x - 10, y: FROM_CARD.y - 70, width: COLUMN_TO.width + 20, height: TO_CARD.y + TO_CARD.height - FROM_CARD.y + 110 }, { max: 1.7, shift: [-330, 0] })

/** Где карточка в кадре f: на месте, на весу за курсором, на новом месте. */
function dragged(frame: number): { rect: Rect; lift: number } {
  const t = glide(span(frame, GRAB, DROP - GRAB))
  const arc = Math.sin(Math.PI * t) * -46
  const rect: Rect = { ...FROM_CARD, x: mix(FROM_CARD.x, TO_CARD.x, t), y: mix(FROM_CARD.y, TO_CARD.y, t) + arc }
  const lift = spring(frame, GRAB, SPRINGS.snap) * (1 - spring(frame, DROP, SPRINGS.snap))
  return { rect, lift }
}

const CAMERA_11: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 26, dur: 30, ...COLUMNS_VIEW },
  { at: GRAB, dur: 16, follow: follow((f) => { const r = dragged(f).rect; return [r.x + r.width / 2, r.y + r.height / 2] }, { zoom: COLUMNS_VIEW.zoom, lag: 10 }) },
  { at: 142, dur: 22, ...focus(TOAST_11, { fill: 0.45 }) },
  { at: TOAST_11_HOLD, dur: 26, ...SPOTKANIE_VIEW },
]

export function KanbanDrag() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const toast = lang === 'en' ? TOAST_11_EN : TOAST_11_TEXT
  const tex = useCrmTwins(() => ({ before: canvasOf(crmKanban(false)), after: canvasOf(crmKanban(true)), card: canvasOf(crmKanbanCard()) }))
  const camera = viewAt(CAMERA_11, frame)
  const enter = glide(span(frame, 0, 26))
  const { rect, lift } = dragged(frame)
  const hover = easeOut(span(frame, 96, 10)) * (1 - easeIn(span(frame, DROP + 2, 8)))
  const settled = frame >= DROP
  const [ax, ay] = camera.project(TO_CARD.x + TO_CARD.width * 0.88, TO_CARD.y + TO_CARD.height * 0.2)
  const grab = { x: FROM_CARD.x + FROM_CARD.width * 0.42, y: FROM_CARD.y + FROM_CARD.height * 0.42 }
  const cursorKeys = [
    { at: 52, x: grab.x + 150, y: grab.y + 170 },
    { at: 70, x: grab.x, y: grab.y },
    ...Array.from({ length: 7 }, (_, i) => {
      const f = GRAB + ((DROP - GRAB) * (i + 1)) / 7
      const r = dragged(f).rect
      return { at: f, x: r.x + FROM_CARD.width * 0.42, y: r.y + FROM_CARD.height * 0.42 }
    }),
    { at: DROP + 20, x: TO_CARD.x + TO_CARD.width * 0.7, y: TO_CARD.y + TO_CARD.height * 1.6 },
  ]
  /* Звук: карточку несут (пролёт за ней) и роняют в «Spotkanie». Взятие,
     колода, тост и выноска звучат сами. */
  const [cardX, cardY] = camera.project(rect.x + rect.width / 2, rect.y + rect.height / 2)
  useSoundTrack('crm-kanban-2d', 'whoosh', frame > GRAB && frame < DROP, { x: cardX, y: cardY }, { gain: 0.5 })
  useCueList([[DROP, 'thump', centerOf(TO_CARD, camera.project), 0.85]])

  return (
    <AbsoluteFill>
      <Deck t={enter - 1}>
        <Camera view={camera}>
          <Screen rect={BOARD} source={settled ? tex.after : tex.before} radius={18} />
          {/* Колонка-приёмник: бирюзовая рамка, пока над ней карточка. */}
          <div style={{ position: 'absolute', left: COLUMN_TO.x - 4, top: COLUMN_TO.y - 4, width: COLUMN_TO.width + 8, height: COLUMN_TO.height + 8, borderRadius: 14, boxShadow: `inset 0 0 0 2px ${tint(LIGHT.teal, 0.6)}`, background: tint(LIGHT.teal, 0.05), opacity: hover }} />
          {/* Тень на старом месте, пока карточка в пути. */}
          {frame >= GRAB && !settled && (
            <div style={{ position: 'absolute', left: FROM_CARD.x, top: FROM_CARD.y, width: FROM_CARD.width, height: FROM_CARD.height, opacity: 0.35, borderRadius: 12 }}>
              <Painted source={tex.card} style={{ inset: 0 }} />
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderRadius: 12,
              transform: `rotate(${6 * lift}deg) scale(${1 + 0.05 * lift})`,
              boxShadow: lift > 0.02 ? SHADOW.lifted : SHADOW.card,
              opacity: frame < 10 ? 0 : 1,
            }}
          >
            <Painted source={tex.card} style={{ inset: 0 }} />
          </div>
          <Toast x={TOAST_11.x} y={TOAST_11.y} at={140} until={TOAST_11_HOLD + 4} title={toast.title} description={toast.description} tone={LIGHT.green} scale={TOAST_SCALE} />
        </Camera>
        <CursorPath view={camera} keys={cursorKeys} clicks={[GRAB]} hide={DROP + 14} />
        <Callout anchor={[ax, ay]} box={{ x: ax + 170, y: ay - 60, width: lang === 'en' ? 550 : 560 }} tag={tag(11, lang)} title={caption(11, lang)} at={TOAST_11_HOLD + 22} until={TOAST_11_HOLD + 96} />
      </Deck>
    </AbsoluteFill>
  )
}

export const KANBAN_END = { view: SPOTKANIE_VIEW, card: TO_CARD, board: BOARD }

/* ── 12 · Оферта: «Szkic» → «Wysłana» ────────────────────────────────────
   0–40    карточка Marek Zieliński отрывается от канбана и переворачивается —
           на обороте оферта SIM/2026/017 («Szkic»), канбан уходит
   60–82   курсор к «⋯», 82 — клик; меню встаёт, камера — на меню
   146     «Wyślij klientowi»: меню уходит, по оферте — полоса света,
           «Szkic» → «Wysłana»
   160–222 тост «Oferta SIM/2026/017 wysłana» крупно
   226–300 запись «Wysłano ofertę …» в истории лида, линия от оферты
   236–300 выноска «Oferta wysłana i zapisana w historii klienta.»
   296–330 лист выходит из оферты и складывается в самолётик */

const OS = 1.72
const OFFER_RECT: Rect = { x: 520 - (OFFER.width * OS) / 2, y: 540 - (OFFER.height * OS) / 2, width: OFFER.width * OS, height: OFFER.height * OS }
const MORE_CLICK = 82
const MENU_SCALE = 1.3
const MENU_ITEMS = 7
const MENU_RECT: Rect = (() => {
  const width = 230 * MENU_SCALE
  const height = (16 + MENU_ITEMS * 34) * MENU_SCALE
  return { x: OFFER_RECT.x + OFFER_RECT.width - 16 - width, y: OFFER_RECT.y + OFFER_MORE.y * OFFER_RECT.height + 26, width, height }
})()
const SEND_CLICK = 146
const TOAST_12: Rect = { x: OFFER_RECT.x + OFFER_RECT.width + 70, y: OFFER_RECT.y + OFFER_RECT.height - 120, width: 320 * TOAST_SCALE, height: 82 }
const TOAST_12_TEXT = 'Oferta SIM/2026/017 wysłana'
const TOAST_12_HOLD = 162 + 22 + readFrames(TOAST_12_TEXT)
const ENTRY_RECT: Rect = { x: OFFER_RECT.x + OFFER_RECT.width + 130, y: OFFER_RECT.y + 190, width: 820, height: 820 * (70 / 476) }
const PLANE_AT = 300

const CAMERA_12: CameraKey[] = [
  { at: 0, ...SPOTKANIE_VIEW },
  { at: 6, dur: 34, ...HOME },
  { at: 88, dur: 22, ...focus(MENU_RECT, { fill: 0.3, shift: [-120, 0] }) },
  { at: SEND_CLICK + 4, dur: 24, ...HOME },
  { at: 162, dur: 22, ...focus(TOAST_12, { fill: 0.45 }) },
  { at: TOAST_12_HOLD, dur: 26, ...HOME },
]

export function OfferSend() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const tex = useCrmTwins(() => ({
    board: canvasOf(crmKanban(true)),
    card: canvasOf(crmKanbanCard()),
    draft: canvasOf(crmOfferCard('Szkic')),
    sent: canvasOf(crmOfferCard('Wysłana')),
    menu: canvasOf(crmOfferMenu()),
    entry: canvasOf(crmHistoryEntry('offer')),
  }))
  const camera = viewAt(CAMERA_12, frame)
  /* Отрыв и переворот: коробка растёт от карточки канбана к оферте, у каждой
     стороны — свои пропорции. */
  const t = glide(span(frame, 8, 34))
  const box: Rect = { x: mix(TO_CARD.x, OFFER_RECT.x, t), y: mix(TO_CARD.y, OFFER_RECT.y, t), width: mix(TO_CARD.width, OFFER_RECT.width, t), height: mix(TO_CARD.height, OFFER_RECT.height, t) }
  const angle = 180 * spring(frame, 10, SPRINGS.snap)
  const sent = frame >= SEND_CLICK + 6
  const sweep = span(frame, SEND_CLICK + 4, 14)
  const entryIn = spring(frame, 226, SPRINGS.pop)
  const fold = easeInOut(span(frame, PLANE_AT, 20))
  const fly = glide(span(frame, PLANE_AT + 18, 30))
  const plane = { x: mix(OFFER_RECT.x + OFFER_RECT.width * 0.5, 2300, fly), y: mix(OFFER_RECT.y + OFFER_RECT.height * 0.45, 360, fly) - Math.sin(Math.PI * fly) * 120 }
  const more = { x: OFFER_RECT.x + OFFER_MORE.x * OFFER_RECT.width, y: OFFER_RECT.y + OFFER_MORE.y * OFFER_RECT.height }
  const send = { x: MENU_RECT.x + MENU_SEND.x * MENU_RECT.width, y: MENU_RECT.y + MENU_SEND.y * MENU_RECT.height }
  const [ax, ay] = camera.project(ENTRY_RECT.x + 40, ENTRY_RECT.y + ENTRY_RECT.height * 0.45)
  /* Звук: полоса света — «Szkic» → «Wysłana»; запись встаёт в истории лида.
     Переворот, меню, клики, тост, линия и самолётик звучат сами. */
  useCueList([
    [SEND_CLICK + 4, 'glint', centerOf(OFFER_RECT, camera.project), 0.4, 0.5],
    [226, 'popIn', centerOf(ENTRY_RECT, camera.project), 0.55],
  ])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Screen rect={BOARD} source={tex.board} radius={18} style={{ opacity: 1 - easeInOut(span(frame, 8, 26)) }} />
        <Flip
          angle={angle}
          style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
          front={<Face source={tex.card} aspect={TO_CARD.width / TO_CARD.height} box={box} radius={12} />}
          back={<Face source={sent ? tex.sent : tex.draft} aspect={OFFER.width / OFFER.height} box={box} radius={16} sweep={sweep} />}
        />
        <Connector from={[OFFER_RECT.x + OFFER_RECT.width - 6, OFFER_RECT.y + OFFER_RECT.height * 0.86]} to={[ENTRY_RECT.x - 6, ENTRY_RECT.y + ENTRY_RECT.height / 2]} p={easeInOut(span(frame, 218, 14))} frame={frame} flowing={1 - span(frame, 280, 16)} />
        {frame >= 226 && (
          <div style={{ position: 'absolute', left: ENTRY_RECT.x, top: ENTRY_RECT.y, width: ENTRY_RECT.width, height: ENTRY_RECT.width * (tex.entry ? tex.entry.height / tex.entry.width : 0.15), borderRadius: 14, background: '#fff', boxShadow: SHADOW.card, opacity: clamp01(entryIn * 1.5), transform: `translateX(${(1 - entryIn) * 40}px)` }}>
            <Painted source={tex.entry} style={{ inset: 0 }} />
          </div>
        )}
        <PopIn rect={MENU_RECT} background={LIGHT.card} at={MORE_CLICK + 2} until={SEND_CLICK + 2} origin={[1, 0]} radius={10 * MENU_SCALE}>
          <Painted source={tex.menu} style={{ inset: 0 }} />
        </PopIn>
        <Toast x={TOAST_12.x} y={TOAST_12.y} at={160} until={TOAST_12_HOLD + 4} title={pick(lang, TOAST_12_TEXT, 'Quote SIM/2026/017 sent')} tone={LIGHT.green} scale={TOAST_SCALE} />
        {frame >= PLANE_AT && <PaperPlane x={plane.x} y={plane.y} size={mix(260, 150, fly)} angle={mix(0, -12, fly)} fold={fold} opacity={1 - span(frame, PLANE_AT + 40, 8)} />}
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 60, x: more.x + 60, y: more.y + 230 },
          { at: 80, x: more.x, y: more.y },
          { at: 124, x: send.x + 40, y: send.y - 60 },
          { at: 142, x: send.x, y: send.y },
          { at: 170, x: send.x + 80, y: send.y + 180 },
        ]}
        clicks={[MORE_CLICK, SEND_CLICK]}
        hide={SEND_CLICK + 10}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 60, y: ay + 110, width: lang === 'en' ? 690 : 620 }} tag={tag(12, lang)} title={caption(12, lang)} at={236} until={300} />
    </AbsoluteFill>
  )
}

/** Сторона переворота со своими пропорциями по центру коробки; sweep — полоса
    света по стороне (П8). */
function Face({ source, aspect, box, radius, sweep = 0 }: { source: HTMLCanvasElement | null; aspect: number; box: Rect; radius: number; sweep?: number }) {
  const width = Math.min(box.width, box.height * aspect)
  const height = width / aspect
  return (
    <div style={{ position: 'absolute', left: (box.width - width) / 2, top: (box.height - height) / 2, width, height, borderRadius: radius, overflow: 'hidden', background: '#fff', boxShadow: SHADOW.lifted }}>
      <Painted source={source} style={{ inset: 0 }} />
      {sweep > 0 && sweep < 1 && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${mix(-40, 120, sweep) - 18}%, rgba(255, 255, 255, 0.85) ${mix(-40, 120, sweep)}%, transparent ${mix(-40, 120, sweep) + 18}%)` }} />}
    </div>
  )
}

export const OFFER_END = { plane: { x: 2300, y: 360 } }
