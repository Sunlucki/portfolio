import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { DrawPath, PaperPlane, bezierPoint, type Bezier } from '../kit/draw'
import { useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { Painted, canvasOf, ratioOf, textWidth } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { FONT, INK, MUTED, SHADOW, grow, lerpRect, tint, useAccent, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { PopIn, Stamp, Toast, impact } from '../kit/ui'
import { useSoundTrack } from '../kit/sound'
import { SCREEN, Screen, centerOf, place, useCueList, type Cue2d } from './common'
import {
  FOLLOWUP,
  LEAD_MAIL,
  LIGHT,
  MAIL,
  PICK_HERO,
  REPLY_ACTION,
  UNSUB_FOOTER,
  UNSUB_LINK,
  caption,
  crmDayDisc,
  crmFollowup,
  crmLeadMail,
  crmLinkPicker,
  crmMail,
  crmMailFooter,
  crmMailMessage,
  crmReplyCard,
  followupHeroRow,
  leadMailSlot,
  mailLayout,
  tag,
  useCrmTwins,
} from './twins'

/* 13–15 · 04 Kontakt · Poczta, Follow-up, wypis. Самолётик оферты влетает в
   «Poczta» и становится веткой; ветка привязывается к лиду, письмо улетает в
   «Korespondencja» карточки лида. Из письма выстреливает ось
   последовательности 0 → 180 дней; ответ клиента её останавливает. Подвал
   письма: «Wypisz się jednym kliknięciem» — ответ «Wypisanie» — штамп. */

const ML = mailLayout()
const THREAD = place(ML.thread, MAIL.width)
const ITEM0 = place(ML.item(0), MAIL.width)
const LINK = place(ML.link, MAIL.width)
const MESSAGE = place(ML.message, MAIL.width)
const TOAST_SCALE = 1.4

/** Карточка лида с «Korespondencja» — справа от «Poczta», в мире сцены. */
const LEAD_MAIL_RECT: Rect = { x: 1700, y: 200, width: 560, height: 560 * (LEAD_MAIL.height / LEAD_MAIL.width) }
const MAIL_SLOT: Rect = place(leadMailSlot(), LEAD_MAIL.width, LEAD_MAIL_RECT)

/* ── 13 · Poczta → карточка лида ─────────────────────────────────────────
   0–42    самолётик влетает слева и ныряет в ветку «Re: Oferta …», камера
           следует за ним; ветка вспыхивает
   46–70   камера на ветку; 70–88 курсор к «Powiąż z leadem», 88 — клик
   90–166  «Powiąż wątek z leadem» крупно, курсор — Marek Zieliński, 166 — клик
   168–228 ветка привязана («Lead: Marek Zieliński»), тост крупно
   236–290 письмо отрывается и летит в «Korespondencja» (камера за ним)
   300–380 карточка лида крупно; выноска «Poczta przypięta do klienta.» */

const PLANE = { from: [-220, 470] as const, dur: 42 }
const LINK_CLICK = 88
const PICKER: Rect = { x: LINK.x, y: LINK.y + LINK.height + 14, width: 400 * 1.25, height: 210 * 1.25 }
const PICK_CLICK = 166
const TOAST_13: Rect = { x: SCREEN.x + SCREEN.width - 28 - 320 * TOAST_SCALE, y: SCREEN.y + SCREEN.height - 28 - 64, width: 320 * TOAST_SCALE, height: 64 }
const TOAST_13_TEXT = 'Wątek powiązany z leadem'
const TOAST_13_HOLD = 170 + 22 + readFrames(TOAST_13_TEXT)
const FLY = { start: TOAST_13_HOLD + 8, dur: 50 }
const LANDED = FLY.start + FLY.dur

function planeAt(frame: number) {
  const t = glide(span(frame, 0, PLANE.dur))
  const to = [ITEM0.x + ITEM0.width * 0.5, ITEM0.y + ITEM0.height * 0.5] as const
  return { x: mix(PLANE.from[0], to[0], t), y: mix(PLANE.from[1], to[1], t) - Math.sin(Math.PI * t) * 80, t }
}

/** Письмо летит из ветки в слот «Korespondencja» по дуге. */
function letterAt(frame: number): Rect {
  const t = glide(span(frame, FLY.start, FLY.dur))
  const rect = lerpRect(MESSAGE, MAIL_SLOT, t)
  return { ...rect, y: rect.y - Math.sin(Math.PI * t) * 140 }
}

const CAMERA_13: CameraKey[] = [
  { at: 0, follow: follow((f) => [planeAt(f).x + 200, planeAt(f).y], { zoom: 1.1, lag: 8 }) },
  { at: PLANE.dur - 4, dur: 26, ...fit(THREAD, { max: 1.45, margin: 80 }) },
  { at: 94, dur: 22, ...focus(PICKER, { fill: 0.45 }) },
  { at: 172, dur: 22, ...focus(TOAST_13, { fill: 0.45 }) },
  { at: FLY.start - 4, dur: 18, follow: follow((f) => { const r = letterAt(f); return [r.x + r.width / 2, r.y + r.height / 2] }, { zoom: 1.05, lag: 10 }) },
  { at: LANDED - 4, dur: 26, ...fit(LEAD_MAIL_RECT, { max: 1.5, shift: [-240, 0] }) },
]

export const MAIL_END_VIEW = fit(LEAD_MAIL_RECT, { max: 1.5, shift: [-240, 0] })

export function MailLink() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const tex = useCrmTwins(() => ({
    mail: canvasOf(crmMail(false)),
    linked: canvasOf(crmMail(true)),
    picker: canvasOf(crmLinkPicker()),
    message: canvasOf(crmMailMessage()),
    lead: canvasOf(crmLeadMail(false)),
    leadNew: canvasOf(crmLeadMail(true)),
  }))
  const camera = viewAt(CAMERA_13, frame)
  const plane = planeAt(frame)
  const flash = Math.sin(Math.PI * clamp01(span(frame, PLANE.dur - 4, 20)))
  const letter = letterAt(frame)
  const flying = frame >= FLY.start - 6 && frame < LANDED + 2
  const landed = frame >= LANDED
  const landFlash = Math.sin(Math.PI * clamp01(span(frame, LANDED, 24)))
  const link = { x: LINK.x + LINK.width * 0.5, y: LINK.y + LINK.height * 0.55 }
  const pick = { x: PICKER.x + PICK_HERO.x * PICKER.width, y: PICKER.y + PICK_HERO.y * PICKER.height }
  const [ax, ay] = camera.project(MAIL_SLOT.x + MAIL_SLOT.width * 0.92, MAIL_SLOT.y + MAIL_SLOT.height * 0.22)

  /* Звук: самолётик нырнул в ветку — новое письмо; письмо летит в
     «Korespondencja» (камера за ним) и ложится. Самолётик, клики, выбор лида
     и тост звучат сами. */
  useCueList([
    [PLANE.dur - 2, 'notify', centerOf(ITEM0, camera.project), 0.75],
    [LANDED, 'thump', centerOf(MAIL_SLOT, camera.project), 0.6],
  ])
  const [letterX, letterY] = centerOf(letter, camera.project)
  useSoundTrack('crm-letter', 'whoosh', frame > FLY.start && frame < LANDED, { x: letterX, y: letterY }, { gain: 0.55 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Screen rect={SCREEN} source={frame >= PICK_CLICK + 2 ? tex.linked : tex.mail}>
          <div style={{ position: 'absolute', left: ITEM0.x - SCREEN.x - 3, top: ITEM0.y - SCREEN.y - 3, width: ITEM0.width + 6, height: ITEM0.height + 6, borderRadius: 12, boxShadow: `0 0 0 ${3 * flash}px ${tint(LIGHT.teal, 0.5 * flash)}` }} />
          {/* Письмо, которое улетает: на его месте в ветке — пусто. */}
          {frame >= FLY.start - 6 && <div style={{ position: 'absolute', left: MESSAGE.x - SCREEN.x, top: MESSAGE.y - SCREEN.y, width: MESSAGE.width, height: MESSAGE.height, borderRadius: 10, background: LIGHT.card, opacity: 0.7 }} />}
        </Screen>
        <Screen rect={LEAD_MAIL_RECT} source={landed ? tex.leadNew : tex.lead} radius={16} />
        {landed && <div style={{ position: 'absolute', left: MAIL_SLOT.x - 4, top: MAIL_SLOT.y - 4, width: MAIL_SLOT.width + 8, height: MAIL_SLOT.height + 8, borderRadius: 14, boxShadow: `0 0 0 ${3 * landFlash}px ${tint(LIGHT.teal, 0.5 * landFlash)}` }} />}
        {flying && (
          <div style={{ position: 'absolute', left: letter.x, top: letter.y, width: letter.width, height: letter.height, borderRadius: 12, boxShadow: SHADOW.lifted, background: LIGHT.card }}>
            <Painted source={tex.message} style={{ inset: 0 }} />
          </div>
        )}
        <PopIn rect={PICKER} background={LIGHT.card} at={LINK_CLICK + 2} until={PICK_CLICK + 2} origin={[0.1, 0]} radius={14 * 1.25}>
          <Painted source={tex.picker} style={{ inset: 0 }} />
        </PopIn>
        <Toast x={TOAST_13.x} y={TOAST_13.y} at={170} until={TOAST_13_HOLD + 4} title={t(TOAST_13_TEXT, 'The thread is linked to the lead')} tone={LIGHT.green} scale={TOAST_SCALE} />
        {plane.t < 1 && <PaperPlane x={plane.x} y={plane.y} size={mix(170, 70, plane.t)} angle={mix(-8, 18, plane.t)} opacity={1 - span(frame, PLANE.dur - 8, 8)} />}
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 70, x: link.x + 160, y: link.y + 200 },
          { at: 86, x: link.x, y: link.y },
          { at: 144, x: pick.x + 120, y: pick.y + 90 },
          { at: 162, x: pick.x, y: pick.y },
          { at: 184, x: pick.x + 90, y: pick.y + 200 },
        ]}
        clicks={[LINK_CLICK, PICK_CLICK]}
        hide={178}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 120, y: ay - 40, width: 520 }} tag={tag(13, lang)} title={caption(13, lang)} at={LANDED + 16} until={LANDED + 90} />
    </AbsoluteFill>
  )
}

export const MAIL_SCENE_BEATS = Math.ceil((LANDED + 112) / 15)

/* ── 14 · Follow-up: ось последовательности 0 → 180 ─────────────────────
   0–12    карточка лида, как в конце станции 13
   12–76   из нового письма выстреливает линия — ось; камера следует за её
           концом, диски дней выскакивают, когда до них доходит линия
   76–100  камера на всю ось; 100–130 дни 0 · 2 · 4 · 7 пройдены (галочки)
   136–160 ответ клиента «Prośba o spotkanie» поднимается над осью, крупно
   160–260 читается; 262–290 дальние диски сереют волной
   278–302 наезд на строку лида в «Zapisy do sekwencji»: 306 — «Aktywna» →
           «Zatrzymana»; 318–400 выноска */

const DAYS = [0, 2, 4, 7, 14, 30, 60, 180]
const AXIS_Y = 690
const DISC = 118
const DAY_X = DAYS.map((_, i) => 2440 + i * 236)
const LINE: Bezier = { a: [MAIL_SLOT.x + MAIL_SLOT.width - 12, MAIL_SLOT.y + MAIL_SLOT.height * 0.5], b: [MAIL_SLOT.x + MAIL_SLOT.width + 220, MAIL_SLOT.y + MAIL_SLOT.height * 0.5], c: [2180, AXIS_Y], d: [DAY_X[DAYS.length - 1]! + 120, AXIS_Y] }
const DRAW = { start: 12, dur: 64 }
/** Где голова линии в кадре f (доля пути и точка). */
const headAt = (frame: number) => {
  const t = easeInOut(span(frame, DRAW.start, DRAW.dur))
  return { t, point: bezierPoint(LINE, t) }
}
/** Кадр, когда голова линии проходит x (для выскакивания дисков). */
function passFrame(x: number): number {
  for (let f = DRAW.start; f <= DRAW.start + DRAW.dur; f++) if (headAt(f).point[0] >= x) return f
  return DRAW.start + DRAW.dur
}
const DAY_POP = DAY_X.map((x) => passFrame(x - DISC / 2))
const DAY_DONE = [100, 108, 116, 124]
const REPLY: Rect = { x: (DAY_X[3]! + DAY_X[4]!) / 2 - (560 * 1.6) / 2, y: AXIS_Y - 110 - 330 * 1.6, width: 560 * 1.6, height: 330 * 1.6 }
const GREY_AT = 262
const AXIS_VIEW = fit({ x: DAY_X[0]! - 170, y: AXIS_Y - 420, width: DAY_X[7]! - DAY_X[0]! + 340, height: 660 }, { max: 1.2 })
const HERO_ROW = followupHeroRow()
const STATUS: Rect = { x: DAY_X[3]! - 40, y: AXIS_Y + 150, width: 900, height: 900 * (HERO_ROW.height / HERO_ROW.width) }

const STATUS_AT = 300

const CAMERA_14: CameraKey[] = [
  { at: 0, ...MAIL_END_VIEW },
  { at: DRAW.start + 6, dur: 20, follow: follow((f) => { const p = headAt(f).point; return [p[0] - 120, p[1] - 60] }, { zoom: 1.05, lag: 12 }) },
  { at: DRAW.start + DRAW.dur, dur: 24, ...AXIS_VIEW },
  { at: 132, dur: 24, ...focus(REPLY, { fill: 0.55 }) },
  { at: 258, dur: 26, ...AXIS_VIEW },
  { at: STATUS_AT - 22, dur: 24, ...focus(STATUS, { fill: 0.64, shift: [-120, 60] }) },
]

export function FollowupAxis() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const accent = useAccent()
  const tex = useCrmTwins(() => ({
    lead: canvasOf(crmLeadMail(true)),
    discs: DAYS.map((day) => ({ future: canvasOf(crmDayDisc(day, 'future')), done: canvasOf(crmDayDisc(day, 'done')), grey: canvasOf(crmDayDisc(day, 'grey')) })),
    reply: canvasOf(crmReplyCard('meeting')),
    table: canvasOf(crmFollowup(false)),
    stopped: canvasOf(crmFollowup(true)),
  }))
  const camera = viewAt(CAMERA_14, frame)
  const head = headAt(frame)
  const replyIn = spring(frame, 134, SPRINGS.pop)
  const statusIn = easeOut(span(frame, 240, 14))
  const stop = easeInOut(span(frame, STATUS_AT + 6, 10))
  const heroRow = HERO_ROW
  const ratio = ratioOf(tex.table, FOLLOWUP.width)
  const [ax, ay] = camera.project(STATUS.x + STATUS.width * 0.37, STATUS.y + STATUS.height * 0.5)

  /* Звук: диски дней выскакивают лесенкой за концом линии, день 180 — вдали;
     пройденные дни — щелчок галочки; ответ клиента — новое письмо; строка
     лида встаёт; дальние диски сереют; «Aktywna» → «Zatrzymana». Линия и
     выноска звучат сами. */
  useCueList([
    [DAY_POP[0]!, 'layers', camera.project(DAY_X[2]!, AXIS_Y), 0.55, 1.4],
    [DAY_POP[7]!, 'popIn', camera.project(DAY_X[7]!, AXIS_Y), 0.55],
    ...DAY_DONE.map((at, i): Cue2d => [at, 'tick', camera.project(DAY_X[i]!, AXIS_Y), 0.5]),
    [134, 'notify', centerOf(REPLY, camera.project), 0.85],
    [238, 'popIn', centerOf(STATUS, camera.project), 0.5],
    ...[4, 5, 6, 7].map((i): Cue2d => [GREY_AT + (i - 4) * 5, 'tick', camera.project(DAY_X[i]!, AXIS_Y), 0.35]),
    [STATUS_AT + 6, 'toggle', [ax, ay], 0.75],
  ])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Screen rect={LEAD_MAIL_RECT} source={tex.lead} radius={16} />
        <DrawPath d={`M ${LINE.a[0]} ${LINE.a[1]} C ${LINE.b[0]} ${LINE.b[1]}, ${LINE.c[0]} ${LINE.c[1]}, ${LINE.d[0]} ${LINE.d[1]}`} p={head.t} color={tint(accent, 0.75)} width={5} />
        <div style={{ position: 'absolute', left: DAY_X[0]! - DISC / 2, top: AXIS_Y - DISC / 2 - 130, whiteSpace: 'nowrap', fontFamily: FONT, fontSize: 40, fontWeight: 700, color: INK, letterSpacing: '-0.02em', opacity: easeOut(span(frame, DAY_POP[0]!, 12)) }}>{t('Plan sekwencji', 'Sequence plan')}</div>
        {DAYS.map((day, i) => {
          const pop = spring(frame, DAY_POP[i]!, SPRINGS.pop)
          const done = i < 4 && frame >= DAY_DONE[i]!
          const grey = i >= 4 && frame >= GREY_AT + (i - 4) * 5
          const source = done ? tex.discs[i]!.done : grey ? tex.discs[i]!.grey : tex.discs[i]!.future
          const tick = i < 4 ? spring(frame, DAY_DONE[i]!, SPRINGS.snap) : 0
          return (
            <div key={day} style={{ position: 'absolute', left: DAY_X[i]! - DISC / 2, top: AXIS_Y - DISC / 2, width: DISC, height: DISC, borderRadius: '50%', transform: `scale(${Math.max(0, pop) * (1 + 0.08 * Math.sin(Math.PI * clamp01(tick)))})`, boxShadow: SHADOW.card }}>
              <Painted source={source} style={{ inset: 0 }} />
            </div>
          )
        })}
        {([
          [0, t('Pierwszy kontakt w dniu zgłoszenia', 'First touch on the enquiry day')],
          [7, t('Reaktywacja po pół roku', 'Reactivation after six months')],
        ] as const).map(([i, text]) => (
          <div key={i} style={{ position: 'absolute', left: DAY_X[i]! - (i === 0 ? DISC / 2 : 300), width: 360, top: AXIS_Y + DISC / 2 + 22, fontFamily: FONT, fontSize: 24, fontWeight: 520, color: MUTED, textAlign: i === 0 ? 'left' : 'right', lineHeight: 1.3, opacity: easeOut(span(frame, DAY_POP[i]! + 6, 12)) }}>
            {text}
          </div>
        ))}
        {/* Ответ клиента поднимается из оси между 7 и 14 днём. */}
        {frame >= 134 && (
          <div style={{ position: 'absolute', left: REPLY.x, top: REPLY.y, width: REPLY.width, height: REPLY.height, borderRadius: 18, boxShadow: SHADOW.lifted, opacity: clamp01(replyIn * 1.5), transform: `translateY(${(1 - replyIn) * 120}px) scale(${mix(0.9, 1, clamp01(replyIn))})`, transformOrigin: '50% 100%' }}>
            <Painted source={tex.reply} style={{ inset: 0 }} />
          </div>
        )}
        {/* Строка лида в «Zapisy do sekwencji»: «Aktywna» → «Zatrzymana». */}
        {frame >= 238 && (
          <div style={{ position: 'absolute', left: STATUS.x, top: STATUS.y, width: STATUS.width, height: STATUS.height, borderRadius: 14, overflow: 'hidden', background: LIGHT.card, boxShadow: SHADOW.card, opacity: statusIn, transform: `translateY(${(1 - statusIn) * 24}px)` }}>
            <Painted source={tex.table} crop={heroRow} ratio={ratio} style={{ inset: 0, opacity: 1 - stop }} />
            <Painted source={tex.stopped} crop={heroRow} ratio={ratio} style={{ inset: 0, opacity: stop }} />
          </div>
        )}
      </Camera>
      <Callout anchor={[ax, ay]} box={{ x: ax + 140, y: ay - 280, width: lang === 'en' ? 630 : 600 }} tag={tag(14, lang)} title={caption(14, lang)} at={STATUS_AT + 18} until={STATUS_AT + 100} />
    </AbsoluteFill>
  )
}

/* ── 15 · Wypis: подвал письма → ответ «Wypisanie» → штамп ───────────────
   0–26    письмо встаёт (переворот из горизонтали)
   26–54   наезд на подвал: «Wypisz się jednym kliknięciem»; 66 — клик
   68–96   письмо переворачивается через горизонталь (П15): на обороте —
           ответ «Wypisanie» с анализом, крупно
   96–196  читается; 206 — клик «Wypisz i zatrzymaj sekwencję»
   212–230 штамп «Wyklucz na zawsze» падает сверху (м-печать), удар
   232–310 выноска «Wypis jednym kliknięciem. Na zawsze.»
   321–330 уход — прокрутка насквозь (П14): кадр срывается вниз с размытием,
           склейка в движении — станция 16 продолжает ту же прокрутку лентой
           фактур (там ~118 px за кадр вниз, здесь к склейке столько же) */

export const UNSUB_BEATS = 22

const FOOTER = SCREEN
const UNSUB_LINE: Rect = { x: FOOTER.x + (90 / 1600) * FOOTER.width, y: FOOTER.y + (690 / 1030) * FOOTER.height, width: (1350 / 1600) * FOOTER.width, height: (50 / 1030) * FOOTER.height }
const UNSUB_CLICK = 66
const FLIP_AT = 70
const REPLY_15: Rect = { ...grow({ x: 960 - 280, y: 540 - 165, width: 560, height: 330 }, 1.7) }
const ACTION_CLICK = 206
const STAMP_AT = 214
const STAMP_BOX: Rect = { x: REPLY_15.x + REPLY_15.width * 0.16, y: REPLY_15.y + REPLY_15.height * 0.3, width: REPLY_15.width * 0.68, height: REPLY_15.width * 0.68 * (260 / 900) }
/** Надпись штампа — кнопка «Wyklucz na zawsze» (i18n outreach.card.suppress). */
const STAMP_TEXT = { pl: 'Wyklucz na zawsze', en: 'Never contact again' }
/** По-английски надпись длиннее: оттиск шире и ниже, с тем же центром, чтобы
    она встала в рамку (у штампа набора кегль 0,42 высоты, иконка 1,15 кегля,
    зазор 0,4 кегля, рамка 0,055 высоты). */
function stampRect(lang: Lang): Rect {
  if (lang !== 'en') return STAMP_BOX
  const text = textWidth(STAMP_TEXT.en.toUpperCase(), 100, 850, 0.04) / 100
  const width = REPLY_15.width * 0.84
  const height = Math.min(STAMP_BOX.height, width / (0.42 * (1.55 + text) + 0.36))
  return { x: STAMP_BOX.x + STAMP_BOX.width / 2 - width / 2, y: STAMP_BOX.y + STAMP_BOX.height / 2 - height / 2, width, height }
}
/** Ссылка «Wypisz się…» в подвале, доли: по-английски — по ширине английской строки. */
const unsubLink = (lang: Lang) =>
  lang === 'en' ? { x: (90 + textWidth(UNSUB_FOOTER.en.lead, 38, 450) + textWidth(UNSUB_FOOTER.en.link, 38, 500) / 2) / 1600, y: UNSUB_LINK.y } : UNSUB_LINK

const CAMERA_15: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 26, dur: 28, ...focus(UNSUB_LINE, { fill: 0.86 }) },
  { at: FLIP_AT, dur: 26, ...focus(REPLY_15, { fill: 0.55 }) },
]

export function Unsubscribe() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const STAMP = stampRect(lang)
  const tex = useCrmTwins(() => ({ footer: canvasOf(crmMailFooter()), reply: canvasOf(crmReplyCard('unsubscribe')) }))
  const camera = viewAt(CAMERA_15, frame)
  const rise = spring(frame, 0, SPRINGS.heavy)
  const turn = glide(span(frame, FLIP_AT, 26))
  const hit = frame >= STAMP_AT + 12
  const shake = impact(frame, STAMP_AT)
  const ring = span(frame, STAMP_AT + 12, 18)
  const link = { x: FOOTER.x + unsubLink(lang).x * FOOTER.width, y: FOOTER.y + (712 / 1030) * FOOTER.height }
  const action = { x: REPLY_15.x + REPLY_ACTION.x * REPLY_15.width, y: REPLY_15.y + REPLY_ACTION.y * REPLY_15.height }
  /* Английский оттиск шире: точка — там же, где у польского (иначе рамка уходит за кадр). */
  const [ax, ay] = camera.project(STAMP.x + STAMP.width * (lang === 'en' ? 0.82 : 0.9), STAMP.y + STAMP.height * 0.5)
  const whip = easeIn(span(frame, UNSUB_BEATS * 15 - 9, 9))

  /* Звук: кадр срывается вниз — прокрутка насквозь, её продолжает лента фактур
     станции 16 (один звук на весь ход). Переворот, клики и штамп звучат сами. */
  useCueList([[UNSUB_BEATS * 15 - 9, 'whoosh', [960, 540], 0.6, 1.1]])

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, transform: whip > 0 ? `translateY(${whip * 450}px)` : undefined, filter: whip > 0 ? `blur(${whip * 4}px)` : undefined }}>
      <Camera view={camera}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${shake}px)` }}>
          <Flip
            axis="x"
            angle={-90 * (1 - rise) + 180 * turn}
            perspective={2400}
            style={{ left: FOOTER.x, top: FOOTER.y, width: FOOTER.width, height: FOOTER.height }}
            front={
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, boxShadow: SHADOW.window, overflow: 'hidden' }}>
                <Painted source={tex.footer} style={{ inset: 0 }} />
              </div>
            }
            back={
              <div style={{ position: 'absolute', left: REPLY_15.x - FOOTER.x, top: REPLY_15.y - FOOTER.y, width: REPLY_15.width, height: REPLY_15.height, borderRadius: 18, boxShadow: SHADOW.lifted }}>
                <Painted source={tex.reply} style={{ inset: 0 }} />
              </div>
            }
          />
          <Stamp rect={STAMP} at={STAMP_AT} text={STAMP_TEXT[lang]} color={LIGHT.coral} />
          {hit && ring < 1 && <div style={{ position: 'absolute', left: STAMP.x + STAMP.width / 2 - 60 - 380 * ring, top: STAMP.y + STAMP.height / 2 - 60 - 380 * ring, width: 120 + 760 * ring, height: 120 + 760 * ring, borderRadius: '50%', border: `3px solid ${tint(LIGHT.coral, 0.4 * (1 - ring))}` }} />}
        </div>
      </Camera>
      </div>
      <CursorPath
        view={camera}
        keys={[
          { at: 48, x: link.x + 160, y: link.y + 110 },
          { at: 64, x: link.x, y: link.y },
          { at: 186, x: action.x + 120, y: action.y + 120 },
          { at: 204, x: action.x, y: action.y },
        ]}
        clicks={[UNSUB_CLICK, ACTION_CLICK]}
        hide={212}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 90, y: ay + 150, width: lang === 'en' ? 480 : 560 }} tag={tag(15, lang)} title={caption(15, lang)} at={STAMP_AT + 20} until={STAMP_AT + 96} />
    </AbsoluteFill>
  )
}
