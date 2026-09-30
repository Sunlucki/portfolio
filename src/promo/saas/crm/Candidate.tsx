import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, Icon, Scribble, bezierPoint, flowCurve } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { Painted, canvasOf, ratioOf, textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { FONT, INK, MUTED, SHADOW, tint, useAccent, type Point, type Rect } from '../kit/theme'
import { Flip, Swing } from '../kit/transitions'
import { Toast } from '../kit/ui'
import { useSoundTrack } from '../kit/sound'
import { SCREEN, centerOf, leadsGeometry, useCueList, type Cue2d } from './common'
import { CANDIDATE, CANDIDATE_ADD, LIGHT, SOURCES, candidateLayout, caption, crmCandidate, crmLeadRow, crmLeadsList, tag, useCrmTwins } from './twins'

/* 06 · 02 Leady · Кандидат из реестров → лид (29 долей, 660–1094).
   Справа — боковая панель кандидата («Kampanie → Wyszukiwanie»), слева
   встают четыре карточки источников. Камера садится на первую карточку и
   летит за данными по линии-связи до поля панели; остальные линии приносят
   свои поля, из KRS приходит правление. «Dodaj do leadów» — тост продукта
   крупно; затем кандидат становится строкой лида, и камера летит за ней в
   список «Leady», где строка встаёт на первое место.

   0–28     панель входит каруселью справа (под уходящим пультом), общий план ×1,3
   20–56    карточки источников встают ребром → лицом (П15), иконки рисуются
   46–60    камера на первой карточке (REGON) ×1,5
   60–94    данные летят по линии к «Forma prawna», камера следует за ними
   94–124   поля заполняются с кареткой (м-ввод); 100–130 — отъезд к данным ×1,5
   132–142  правление из KRS (м-аватары); 142 — обводка; 146–220 — выноска
   164      «Dopasowanie»: «Klasa A» и полоса
   228–252  камера к кнопке; 240 — обводка; 260 — клик «Dodaj do leadów»
   266–328  тост «Kandydat dodany do leadów» крупно (52% ширины), держится,
            пока читается (readFrames)
   332–376  кандидат сжимается в строку лида, строка летит в «Leady», камера
            следует за ней; 376 — строка встала первой и вспыхнула
   376–435  список «Leady» крупно, Marek Zieliński первым */

/** Панель кандидата в мире. */
const PANEL: Rect = { x: 780, y: 214, width: 760, height: 760 * (CANDIDATE.height / CANDIDATE.width) }
const CS = PANEL.width / CANDIDATE.width
const L = candidateLayout()
const k = L.k

/** Точка холста панели → мир. */
const onPanel = (px: number, py: number): Point => [PANEL.x + px * CS, PANEL.y + py * CS]
const panelRect = (rect: Rect): Rect => ({ x: PANEL.x + rect.x * CS, y: PANEL.y + rect.y * CS, width: rect.width * CS, height: rect.height * CS })

const ICON_OF: Record<string, IconName> = { shield: 'shieldCheck', users: 'users', building: 'building2', map: 'mapPin' }

/** Карточки источников по-английски (в порядке SOURCES художника): имена
    реестров остаются, подпись — что из реестра берём. */
const SOURCES_EN: [string, string][] = [
  ['Biała lista MF', 'VAT whitelist status'],
  ['KRS', 'Board and proxies'],
  ['REGON', 'Legal form and PKD'],
  ['OpenStreetMap', 'Address and location'],
]

/* Источники сверху вниз — в порядке своих полей на панели, чтобы линии не
   перекрещивались: REGON → «Forma prawna», OpenStreetMap → «Adres»,
   Biała lista MF → «Status VAT», KRS → «Osoby». */
const SOURCE_ROWS = [
  { source: 2, target: L.rows[1]!, draw: 50 },
  { source: 3, target: L.rows[5]!, draw: 70 },
  { source: 0, target: L.rows[7]!, draw: 76 },
  { source: 1, target: L.people[0]!, draw: 82 },
]
const CARD = { x: 150, width: 380, height: 118, gap: 22 }
const CARD_TOP = 540 - (SOURCE_ROWS.length * CARD.height + (SOURCE_ROWS.length - 1) * CARD.gap) / 2
const cardRect = (i: number): Rect => ({ x: CARD.x, y: CARD_TOP + i * (CARD.height + CARD.gap), width: CARD.width, height: CARD.height })
const CURVES = SOURCE_ROWS.map(({ target }, i) => {
  const card = cardRect(i)
  const to = onPanel(0, target.y + target.height / 2)
  return flowCurve([card.x + card.width, card.y + card.height / 2], [to[0] - 1, to[1]])
})

/** Данные первого источника: бусина летит по линии от карточки к полю. */
const BEAD = { start: 60, dur: 34 }
const beadAt = (frame: number): Point => bezierPoint(CURVES[0]!, glide(span(frame, BEAD.start, BEAD.dur)))

/** Что проявляется на панели и когда: статус, поля реестров, строка проверки,
    правление из KRS, класс. people — выскакивают, остальное — печатью. */
const ROW_START = [100, 94, 103, 106, 109, 112, 115, 118]
const REVEALS: { rect: Rect; start: number; pop?: boolean; caret?: boolean }[] = [
  { rect: { x: L.pad, y: 60 * k, width: CANDIDATE.width - L.pad * 2, height: 22 * k }, start: 96 },
  ...L.rows.map((rect, i) => ({ rect, start: ROW_START[i] ?? 100, caret: true })),
  { rect: L.checked, start: 124 },
  ...L.people.map((rect, i) => ({ rect, start: 132 + i * 6, pop: true })),
  { rect: L.fit, start: 164 },
]

const ADD_BUTTON: Rect = panelRect(L.addButton)
/** Кнопка «Dodaj do leadów» по-английски уже польской: обводка и курсор — по её
    ширине (как button() художника: текст 13k, иконка 16k + 7k, поля 28k). */
const addRect = (lang: Lang): Rect => (lang === 'en' ? { ...ADD_BUTTON, width: (textWidth(CANDIDATE_ADD.en, 13 * k, 600) + 51 * k) * CS } : ADD_BUTTON)
const BOARD: Rect = panelRect({ x: L.people[0]!.x, y: L.people[0]!.y, width: 470 * k, height: L.people[1]!.y + L.people[1]!.height - L.people[0]!.y })
const CLICK = 260

/** Тост продукта — крупно (×1,7), у правого нижнего края панели. Время на
    чтение — по польскому тексту в обоих языках (главы сайта). */
const TOAST_TITLE = 'Kandydat dodany do leadów'
const TOAST = { at: 266, scale: 1.7 }
const TOAST_RECT: Rect = { x: PANEL.x + PANEL.width - 320 * TOAST.scale, y: PANEL.y + PANEL.height + 28, width: 320 * TOAST.scale, height: 66 }
const TOAST_HOLD = 292 + readFrames(TOAST_TITLE)

/* ── «Leady»: список справа от панели, строка лида летит в первую строку ── */

/** Список стоит справа от панели; слот строки и конечный вид камеры — общие со
    станцией 07 (leadsGeometry): она начинается с того же кадра. */
const LIST: Rect = { x: 2140, y: 160, width: SCREEN.width, height: SCREEN.height }
const LEADS_AT = leadsGeometry(LIST)
const ROW_SLOT: Rect = LEADS_AT.slot
const FLY = { start: TOAST_HOLD + 4, dur: 44 }
const LANDED = FLY.start + FLY.dur
/** Откуда строка стартует — из центра панели, по ширине панели. */
const ROW_FROM = { x: PANEL.x + PANEL.width / 2, y: PANEL.y + PANEL.height * 0.42, scale: (PANEL.width + 40) / ROW_SLOT.width }

function rowAt(frame: number): { x: number; y: number; scale: number } {
  const t = glide(span(frame, FLY.start, FLY.dur))
  const to = { x: ROW_SLOT.x + ROW_SLOT.width / 2, y: ROW_SLOT.y + ROW_SLOT.height / 2 }
  return { x: mix(ROW_FROM.x, to.x, t), y: mix(ROW_FROM.y, to.y, t) - Math.sin(Math.PI * t) * 90, scale: mix(ROW_FROM.scale, 1, t) }
}

/** Общий план: источники и панель целиком, крупно (без полей по краям). */
const OVERVIEW = fit({ x: CARD.x, y: PANEL.y, width: PANEL.x + PANEL.width - CARD.x, height: PANEL.height }, { margin: 60 })

const CAMERA: CameraKey[] = [
  { at: 0, ...OVERVIEW },
  { at: 46, dur: 22, ...focus(cardRect(0), { fill: 0.3 }) },
  { at: 60, dur: 16, follow: follow(beadAt, { zoom: 1.5, lag: 6 }) },
  { at: 100, dur: 30, ...fit(panelRect({ x: 0, y: L.top, width: CANDIDATE.width, height: L.people[1]!.y + L.people[1]!.height - L.top }), { max: 1.5, shift: [-250, 0] }) },
  { at: 228, dur: 24, ...fit(panelRect({ x: 0, y: 0, width: CANDIDATE.width, height: L.checked.y }), { max: 1.6, shift: [-230, 40] }) },
  { at: 270, dur: 22, ...focus(TOAST_RECT, { fill: 0.52 }) },
  { at: FLY.start - 4, dur: 18, follow: follow((f) => [rowAt(f).x, rowAt(f).y], { zoom: (f) => mix(1.4, 1.12, glide(span(f, FLY.start, FLY.dur))), lag: 5 }) },
  { at: LANDED - 6, dur: 24, ...LEADS_AT.top },
]

const cursorKeys = (add: Rect) => [
  { at: 232, x: add.x + add.width + 200, y: add.y + 240 },
  { at: 256, x: add.x + add.width * 0.55, y: add.y + add.height * 0.55 },
  { at: 278, x: add.x + add.width * 0.7, y: add.y + add.height * 1.8 },
]

/** Где стоит выноска: по виду камеры после отъезда к данным (он не меняется,
    пока выноска на экране). */
const CALLOUT_VIEW = viewAt(CAMERA, 146)
const CALLOUT_BOX = { x: CALLOUT_VIEW.project(PANEL.x + PANEL.width, 0)[0] + 56, width: 540 }

export function Candidate() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const t = useT()
  const ADD = addRect(lang)
  const CURSOR = cursorKeys(ADD)
  /** Где курсор нажал: круг от клика остаётся на кнопке, курсор уходит. */
  const CLICK_AT = cursorAt(CURSOR, CLICK)
  const twins = useCrmTwins(() => ({
    empty: canvasOf(crmCandidate(false)),
    full: canvasOf(crmCandidate(true)),
    list: canvasOf(crmLeadsList()),
    row: canvasOf(crmLeadRow()),
  }))
  const camera = viewAt(CAMERA, frame)
  const enter = spring(frame, 0, SPRINGS.heavy)
  const cursor = cursorAt(CURSOR, frame, [CLICK], 274)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [clickX, clickY] = camera.project(CLICK_AT.x, CLICK_AT.y)
  const anchor = camera.project(BOARD.x + BOARD.width * 0.62, BOARD.y + BOARD.height * 0.28)
  const flowing = 1 - easeOut(span(frame, 150, 20))
  const bead = beadAt(frame)
  const beadOn = frame >= BEAD.start - 2 && frame < BEAD.start + BEAD.dur + 2
  const collapse = easeInOut(span(frame, FLY.start - 6, 16))
  const row = rowAt(frame)
  const landed = span(frame, LANDED, 22)

  /* Звук: бусина данных летит по линии (камера за ней); поля реестров
     печатаются кареткой — клавиша на строку; статус, проверка и класс —
     щелчок; правление из KRS выскакивает; строка лида летит в «Leady» и
     садится. Карточки, линии, клик, тост и выноска звучат сами. */
  useCueList([
    ...REVEALS.map(({ rect, start, pop, caret }): Cue2d => [start, pop ? 'popIn' : caret ? 'key' : 'tick', centerOf(panelRect(rect), camera.project), pop ? 0.5 : caret ? 0.55 : 0.45]),
    [LANDED, 'thump', centerOf(ROW_SLOT, camera.project), 0.6],
  ])
  const [beadX, beadY] = camera.project(bead[0], bead[1])
  useSoundTrack('crm-bead', 'whoosh', frame > BEAD.start && frame < BEAD.start + BEAD.dur, { x: beadX, y: beadY }, { gain: 0.5 })
  const [rowX, rowY] = camera.project(row.x, row.y)
  useSoundTrack('crm-row-06', 'whoosh', frame > FLY.start && frame < LANDED, { x: rowX, y: rowY }, { gain: 0.6 })

  return (
    <AbsoluteFill>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          {CURVES.map((curve, i) => (
            <Connector key={i} from={curve.a} to={curve.d} bend={0.5} p={easeInOut(span(frame, SOURCE_ROWS[i]!.draw, 16))} frame={frame} flowing={i === 0 ? flowing * span(frame, BEAD.start + BEAD.dur, 6) : flowing} />
          ))}
          {beadOn && <div style={{ position: 'absolute', left: bead[0] - 9, top: bead[1] - 9, width: 18, height: 18, borderRadius: 9, background: '#ffffff', border: `3px solid ${accent}`, boxSizing: 'border-box', boxShadow: `0 0 0 6px ${tint(accent, 0.14)}, 0 2px 6px rgba(15, 23, 42, 0.2)` }} />}
          {SOURCE_ROWS.map(({ source }, i) => (
            <SourceCard key={i} index={i} source={source} frame={frame} />
          ))}
          <div
            style={{
              position: 'absolute',
              left: PANEL.x,
              top: PANEL.y,
              width: PANEL.width,
              height: PANEL.height,
              borderRadius: 12 * k * CS,
              background: LIGHT.card,
              boxShadow: SHADOW.window,
              opacity: 1 - 0.75 * collapse,
              transform: `scale(${1 - 0.08 * collapse})`,
            }}
          >
            <Painted source={twins.empty} style={{ inset: 0 }} />
            {REVEALS.map(({ rect, start, pop, caret }, i) => {
              if (frame < start) return null
              const p = pop ? spring(frame, start, SPRINGS.pop) : easeInOut(span(frame, start, 9))
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: rect.x * CS,
                    top: rect.y * CS,
                    width: rect.width * CS,
                    height: rect.height * CS,
                    background: LIGHT.card,
                    clipPath: pop ? undefined : `inset(0 ${(1 - clamp01(p)) * 100}% 0 0)`,
                    opacity: pop ? clamp01(p * 1.4) : 1,
                    transform: pop ? `translateX(${(1 - p) * -18}px) scale(${mix(0.94, 1, p)})` : undefined,
                    transformOrigin: 'left center',
                  }}
                >
                  <Painted source={twins.full} crop={rect} ratio={ratioOf(twins.full, CANDIDATE.width)} style={{ inset: 0 }} />
                  {caret && p < 1 && <div style={{ position: 'absolute', left: `${p * 100}%`, top: '22%', width: 2, height: '56%', borderRadius: 1, background: accent }} />}
                </div>
              )
            })}
          </div>
          <Scribble rect={BOARD} p={easeOut(span(frame, 142, 18)) * (1 - easeIn(span(frame, 222, 10)))} pad={[28, 7]} seed={3} width={2.6} />
          <Scribble rect={ADD} p={easeOut(span(frame, 240, 14)) * (1 - easeIn(span(frame, 290, 10)))} pad={[12, 8]} seed={5} width={2.6} />
          <div style={{ position: 'absolute', left: TOAST_RECT.x, top: TOAST_RECT.y }}>
            <Toast x={0} y={0} at={TOAST.at} until={TOAST_HOLD} title={t(TOAST_TITLE, 'Prospect added to leads')} tone={LIGHT.green} scale={TOAST.scale} />
          </div>
          {/* «Leady»: строка Marek Zieliński прилетает на первое место. */}
          <div style={{ position: 'absolute', left: LIST.x, top: LIST.y, width: LIST.width, height: LIST.height, borderRadius: 18, background: LIGHT.bg, boxShadow: SHADOW.window, overflow: 'hidden', opacity: easeOut(span(frame, FLY.start - 12, 16)) }}>
            <Painted source={twins.list} style={{ inset: 0 }} />
          </div>
          {frame >= FLY.start - 6 && (
            <div
              style={{
                position: 'absolute',
                left: row.x - ROW_SLOT.width / 2,
                top: row.y - ROW_SLOT.height / 2,
                width: ROW_SLOT.width,
                height: ROW_SLOT.height,
                borderRadius: 10,
                background: LIGHT.card,
                transform: `scale(${row.scale})`,
                opacity: easeOut(span(frame, FLY.start - 6, 8)),
                boxShadow: `${landed > 0 ? '' : `${SHADOW.lifted}, `}0 0 0 ${2 * (1 - landed)}px ${tint(accent, 0.55 * (1 - landed))}`,
              }}
            >
              <Painted source={twins.row} style={{ inset: 0 }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: tint(accent, 0.16 * Math.sin(Math.PI * clamp01(landed))) }} />
            </div>
          )}
        </Camera>
        <Callout anchor={anchor} box={{ x: CALLOUT_BOX.x, y: anchor[1] - 170, width: CALLOUT_BOX.width }} tag={tag(6, lang)} title={caption(6, lang)} at={146} until={220} />
      </Swing>
      <Ripple x={clickX} y={clickY} at={CLICK} />
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

/* Карточка источника — наша, в стиле ролика (00-SYSTEM §6, «карточка
   функции»): белая, номер в углу, иконка контуром, имя реестра и что из него
   берём. Встаёт ребром → лицом с перелётом (П15). */
function SourceCard({ index, source, frame }: { index: number; source: number; frame: number }) {
  const accent = useAccent()
  const lang = useLang()
  const [namePl, hintPl, glyph] = SOURCES[source] ?? SOURCES[0]!
  const [name, hint] = lang === 'en' ? (SOURCES_EN[source] ?? SOURCES_EN[0]!) : [namePl, hintPl]
  const start = 20 + index * 6
  const turn = spring(frame, start, SPRINGS.pop)
  const rect = cardRect(index)
  return (
    <Flip
      angle={90 * (1 - turn)}
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height, opacity: frame < start ? 0 : 1 }}
      front={
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxSizing: 'border-box',
            padding: '18px 22px',
            borderRadius: 22,
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.card}`,
            fontFamily: FONT,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: accent, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</div>
            <div style={{ marginTop: 6, fontSize: 29, fontWeight: 750, color: INK, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ marginTop: 2, fontSize: 17, fontWeight: 500, color: MUTED, whiteSpace: 'nowrap' }}>{hint}</div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: tint(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={ICON_OF[glyph] ?? 'sparkles'} size={32} color={accent} stroke={1.8} p={easeOut(span(frame, start + 4, 16))} />
          </div>
        </div>
      }
    />
  )
}
