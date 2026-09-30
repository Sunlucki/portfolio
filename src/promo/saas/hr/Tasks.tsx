import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { DrawPath, Scribble } from '../kit/draw'
import { pick, useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Cursor, Ripple, Tap, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Handset, Pulse, SCREEN, arcPoint, centerOf, keyFrames, phoneBody, phonePt, phoneRect, union, type PhoneSpot } from './parts'
import { IA, STAMP, TASK_ACCEPT, TASK_CARD, TASK_SUBMIT, TASK_TITLE, TASK_TITLE_EN, WORKER_TASK_BUTTON, caption, drawStamp, drawTaskCard, drawWorkerTasks, sheet, tag, useLive, useSheets, type TaskFormState } from './twins'

/* 14 · 05 Płace · Premia za akord (41 доля). Линия от строки Jana (П11)
   входит слева и обводит карточку «Nowe zadanie» координатора — карточка
   проступает внутри. Печатается «Mycie posadzki, strefa B», выделены «Za
   jednostkę» и 12,00 / m²; «Zleć zadanie» — карточка переворачивается в
   список заданий (П15). Задание летит в телефон Jana (П6), камера за ним:
   «Rozpocznij pracę» → «Zgłoś do odbioru» (касания, м-статус). Обратно к
   координатору: «Odbierz» — оборот карточки: «Potwierdź faktyczny obmiar»,
   30 m², «Premia wyniesie 360,00 zł»; «Potwierdź odbiór» — штамп «Praca
   odebrana · 360,00 zł» (м-печать). У Jana — «Zarobione premie 360,00 zł».
   Карточка и телефон уходят ребром (П15) — дальше шкала сверхурочных.

   0–26     линия обводит карточку; 22–34 карточка проступает
   36–84    ввод названия; 90–120 обводка «Za jednostkę», подчёркивание 12,00
   130      клик «Zleć zadanie»; 134–152 переворот в список
   160–206  задание летит в телефон, камера за ним; телефон встаёт
   240      «Rozpocznij pracę»; 272 — «Zgłoś do odbioru» (камера стоит)
   306–346  отметка летит обратно, камера за ней: «Zgłoszone», «Odbierz»
   380      клик «Odbierz»; 382–400 переворот: приёмка
   408      30 m²; 414–426 «Premia wyniesie 360,00 zł»; 428 — подчёркивание
   422–490  выноска «Premie za akord liczą się same.»
   496      «Potwierdź odbiór»; 500 — штамп; 520–556 крупно
   556–588  отъезд: карточка и телефон; 568 — «Zarobione premie»
   599–615  уход ребром */

export const TASKS_BEATS = 41

/** Карточка координатора в мире: ×1,4 от логических 440 × 520. */
const CS = 1.4
const CARD: Rect = { x: 330, y: 540 - (TASK_CARD.height * CS) / 2, width: TASK_CARD.width * CS, height: TASK_CARD.height * CS }
const onCard = (x: number, y: number): [number, number] => [CARD.x + x * CS, CARD.y + y * CS]
const cardRect = (r: Rect): Rect => ({ x: CARD.x + r.x * CS, y: CARD.y + r.y * CS, width: r.width * CS, height: r.height * CS })
const PHONE: PhoneSpot = { x: 1250, y: 114, scale: 1 }

const E = {
  line: 0,
  type: 36,
  submit: 130,
  flip1: 134,
  fly: 160,
  flyDur: 46,
  start: 240,
  report: 272,
  back: 306,
  backDur: 40,
  accept: 380,
  flip2: 382,
  quantity: 408,
  premia: 414,
  confirm: 496,
  stamp: 500,
  wide: 556,
  paid: 568,
  out: 599,
}

/** Запись задания в списке координатора (карточка, стадия 'sent'), px карточки. */
const ENTRY: Rect = { x: 20, y: 92, width: 400, height: 104 }
/** Карточка задания на телефоне Jana, pt. */
const PHONE_TASK: Rect = { x: 20, y: 196, width: 353, height: 176 }
const FLY_FROM = centerOf(cardRect(ENTRY))
const FLY_TO = centerOf(phoneRect(PHONE, { x: PHONE_TASK.x, y: PHONE_TASK.y, width: PHONE_TASK.width, height: ENTRY.height * (PHONE_TASK.width / ENTRY.width) }))

function chipAt(frame: number) {
  const t = glide(span(frame, E.fly, E.flyDur))
  const [x, y] = arcPoint(FLY_FROM, FLY_TO, t, 160)
  return { x, y, t, scale: mix(CS, PHONE_TASK.width / ENTRY.width, t) }
}

const BACK_FROM = phonePt(PHONE, 330, PHONE_TASK.y + 27)
const BACK_TO = onCard(ENTRY.x + ENTRY.width - 50, ENTRY.y + 27)
function backAt(frame: number) {
  const t = glide(span(frame, E.back, E.backDur))
  const [x, y] = arcPoint(BACK_FROM, BACK_TO, t, 150)
  return { x, y, t }
}

const STAMP_RECT: Rect = { x: CARD.x + CARD.width / 2 - (STAMP.width * CS) / 2, y: CARD.y + 392 * CS, width: STAMP.width * CS, height: STAMP.height * CS }

const CAMERA: CameraKey[] = [
  { at: 0, ...focus(CARD, { fill: 0.45 }) },
  { at: E.fly - 4, dur: 16, follow: follow((f) => [chipAt(f).x, chipAt(f).y], { zoom: (f) => mix(1.25, 0.95, Math.sin(Math.PI * chipAt(f).t)), lag: 6 }) },
  { at: E.fly + E.flyDur + 2, dur: 22, ...fit(phoneRect(PHONE, { x: 0, y: 150, width: SCREEN.width, height: 250 }), { max: 2.4 }) },
  { at: E.back - 4, dur: 16, follow: follow((f) => [backAt(f).x, backAt(f).y], { zoom: (f) => mix(1.3, 0.95, Math.sin(Math.PI * backAt(f).t)), lag: 6 }) },
  { at: E.back + E.backDur + 2, dur: 24, ...focus(CARD, { fill: 0.45, shift: [-260, 0] }) },
  { at: E.stamp, dur: 20, ...focus(STAMP_RECT, { fill: 0.5 }) },
  { at: E.wide, dur: 30, ...fit(union(CARD, phoneBody(PHONE)), { margin: 70 }) },
]

const CURSOR = [
  { at: 108, x: TASK_SUBMIT.x + 480, y: TASK_SUBMIT.y + 150 },
  { at: E.submit - 4, x: TASK_SUBMIT.x + TASK_SUBMIT.width * 0.55, y: TASK_SUBMIT.y + TASK_SUBMIT.height * 0.6 },
  { at: 150, x: TASK_SUBMIT.x + 460, y: TASK_SUBMIT.y + 170 },
  /* «Odbierz» на записи списка (стадия COMPLETED): кнопка слева внизу. */
  { at: E.accept - 26, x: 460, y: 330 },
  { at: E.accept - 4, x: 36 + 246 * 0.5, y: 192 + 22 },
  { at: E.accept + 28, x: 400, y: 330 },
  { at: E.confirm - 22, x: 470, y: 420 },
  { at: E.confirm - 4, x: TASK_ACCEPT.x + TASK_ACCEPT.width * 0.55, y: TASK_ACCEPT.y + TASK_ACCEPT.height * 0.6 },
  { at: E.confirm + 24, x: TASK_ACCEPT.x + 470, y: TASK_ACCEPT.y + 190 },
].map((key) => ({ at: key.at, x: onCard(key.x, key.y)[0], y: onCard(key.x, key.y)[1] }))
const CLICKS = [E.submit, E.accept, E.confirm]

/* Доля 1e-9 — чтобы дробный шаг английской печати не терял знак на границе
   кадра; польский шаг 2 даёт половинки, им она не мешает. */
const typed = (text: string, frame: number, start: number, speed: number) => (frame < start ? '' : text.slice(0, Math.min(text.length, Math.floor((frame - start) / speed + 1e-9) + 1)))
/** Название задания печатается по 2 кадра на знак; английское — чаще, чтобы
    последний знак встал в тот же кадр, что польский. */
const TITLE = {
  pl: { text: TASK_TITLE, speed: 2 },
  en: { text: TASK_TITLE_EN, speed: (2 * (TASK_TITLE.length - 1)) / (TASK_TITLE_EN.length - 1) },
}
/** Клавиши печати названия задания — тот же старт и скорость, что у cardState. */
const TITLE_KEYS = { pl: keyFrames(E.type, TITLE.pl.text.length, TITLE.pl.speed), en: keyFrames(E.type, TITLE.en.text.length, TITLE.en.speed) }

function cardState(frame: number, face: number, lang: Lang): TaskFormState {
  const status: TaskFormState['status'] = frame < E.back + E.backDur - 4 ? 'PENDING' : 'COMPLETED'
  const title = TITLE[lang]
  if (face === 0) return { title: typed(title.text, frame, E.type, title.speed), focus: frame >= 24 && frame < 110, pressed: frame >= E.submit - 1 && frame < E.submit + 3, quantity: '', confirm: false, stage: 'form', status: 'PENDING' }
  if (face === 1) return { title: title.text, focus: false, pressed: false, quantity: '', confirm: false, stage: 'sent', status }
  return { title: title.text, focus: false, pressed: false, quantity: frame < E.quantity ? '' : '30', confirm: frame >= E.confirm - 1 && frame < E.confirm + 3, stage: 'accept', status: 'COMPLETED' }
}

function phoneStatus(frame: number): TaskFormState['status'] | 'none' {
  if (frame < E.fly + E.flyDur - 2) return 'none'
  if (frame < E.start + 2) return 'PENDING'
  if (frame < E.report + 2) return 'IN_PROGRESS'
  if (frame < E.paid) return 'COMPLETED'
  return 'ACCEPTED'
}

export function Tasks() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const twins = useSheets(() => ({
    entry: sheet(TASK_CARD.width, TASK_CARD.height, 3, (c) => drawTaskCard(c, { title: pick(lang, TASK_TITLE, TASK_TITLE_EN), focus: false, pressed: false, quantity: '', confirm: false, stage: 'sent', status: 'PENDING' }), ENTRY),
    stamp: sheet(STAMP.width, STAMP.height, 4, drawStamp),
  }))
  const turns = [spring(frame, E.flip1, SPRINGS.pop), spring(frame, E.flip2, SPRINGS.pop)]
  const angle = 180 * (turns[0]! + turns[1]!)
  const face = Math.max(0, Math.min(2, Math.floor((angle + 90) / 180)))
  const local = angle - 180 * face
  const stateNow = cardState(frame, face, lang)
  const card = useLive(TASK_CARD.width, TASK_CARD.height, 3, (c) => drawTaskCard(c, stateNow), JSON.stringify(stateNow))
  const statusNow = phoneStatus(frame)
  const phone = useLive(SCREEN.width, SCREEN.height, 3, (c) => drawWorkerTasks(c, statusNow), statusNow)

  const camera = viewAt(CAMERA, frame)
  const line = mix(0.16, 1, easeOut(span(frame, E.line, 28)))
  const cardIn = easeOut(span(frame, 20, 14))
  const chip = chipAt(frame)
  const back = backAt(frame)
  const rise = spring(frame, E.fly - 10, SPRINGS.heavy)
  const stamp = spring(frame, E.stamp, SPRINGS.snap)
  const hit = frame >= E.stamp && frame < E.stamp + 10 ? Math.sin((frame - E.stamp) * 1.9) * 5 * (1 - (frame - E.stamp) / 10) : 0
  const out = easeIn(span(frame, E.out, 16))
  const phoneOut = easeIn(span(frame, E.out + 4, 14))

  const cursor = cursorAt(CURSOR, frame, CLICKS, E.confirm + 26)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const ripples = CLICKS.map((at) => {
    const point = cursorAt(CURSOR, at)
    return { at, xy: camera.project(point.x, point.y) }
  })

  /* П11: линия входит слева (с того места, где ушла из прошлой сцены) и
     обходит карточку скруглённой рамкой. */
  const r = 16 * CS
  const [lx, ly] = camera.project(0, 0)
  const left = (0 - lx) / camera.zoom
  const top = (0 - ly) / camera.zoom
  const entryY = top + 540 / camera.zoom
  const framePath = `M ${left - 20} ${entryY} C ${left + 160 / camera.zoom} ${entryY}, ${CARD.x - 160} ${CARD.y + CARD.height + 40}, ${CARD.x + r} ${CARD.y + CARD.height} L ${CARD.x + CARD.width - r} ${CARD.y + CARD.height} Q ${CARD.x + CARD.width} ${CARD.y + CARD.height}, ${CARD.x + CARD.width} ${CARD.y + CARD.height - r} L ${CARD.x + CARD.width} ${CARD.y + r} Q ${CARD.x + CARD.width} ${CARD.y}, ${CARD.x + CARD.width - r} ${CARD.y} L ${CARD.x + r} ${CARD.y} Q ${CARD.x} ${CARD.y}, ${CARD.x} ${CARD.y + r} L ${CARD.x} ${CARD.y + CARD.height - r} Q ${CARD.x} ${CARD.y + CARD.height}, ${CARD.x + r} ${CARD.y + CARD.height}`

  /* «Premia wyniesie 360,00 zł» проявляется слева направо, сумма — подчёркнута. */
  const premiaLabel = textWidth(t('Premia wyniesie ', 'Bonus will be '), 15, 400)
  const sum: Rect = cardRect({ x: 24 + premiaLabel, y: 214, width: textWidth('360,00 zł', 15, 700), height: 18 })
  const reveal = easeInOut(span(frame, E.premia, 12))
  const sumAnchor = camera.project(sum.x + sum.width * 0.6, sum.y + sum.height / 2)
  const cardRight = camera.project(CARD.x + CARD.width, 0)[0]

  /* Звук: карточка проступает в рамке линии; название печатается; «Zleć
     zadanie» — карточка переворачивается, задание летит в телефон (телефон
     встаёт), приходит в список; «Rozpocznij pracę» — работа пошла, «Zgłoś do
     odbioru» — статус; отметка летит обратно; «Odbierz» — переворот к
     приёмке, обмер 30, «Premia wyniesie 360,00 zł» — блик; штамп и успех; у
     Jana — «Zarobione premie»; всё уходит ребром. Клики и касания — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const cardAt = at(...centerOf(CARD))
  const phoneTaskAt = at(...FLY_TO)
  const phoneButtonAt = at(...phonePt(PHONE, WORKER_TASK_BUTTON.x + WORKER_TASK_BUTTON.width / 2, WORKER_TASK_BUTTON.y + 21))
  useSoundCue('popIn', 22, cardAt, { gain: 0.5 })
  useSoundCues('key', TITLE_KEYS[lang], at(...onCard(220, 132)))
  useSoundCues('flip', [E.flip1, E.flip2], cardAt, { gain: 0.8 })
  useSoundCue('whoosh', E.fly - 10, at(PHONE.x + SCREEN.width / 2, PHONE.y + SCREEN.height / 2 + (1 - rise) * 700), { gain: 0.45, seconds: 0.6 })
  useSoundTrack('hr2d-task-fly', 'whoosh', frame >= E.fly && frame <= E.fly + E.flyDur, at(chip.x, chip.y), { gain: 0.6 })
  useSoundCue('popIn', E.fly + E.flyDur - 2, phoneTaskAt, { gain: 0.6 })
  useSoundCue('toggle', E.start + 2, phoneButtonAt, { gain: 0.7 })
  useSoundCue('tick', E.report + 2, phoneButtonAt, { gain: 0.5 })
  useSoundTrack('hr2d-task-back', 'whoosh', frame >= E.back && frame <= E.back + E.backDur, at(back.x, back.y), { gain: 0.55 })
  useSoundCue('popIn', E.back + E.backDur, at(...BACK_TO), { gain: 0.5 })
  useSoundCues('key', [E.quantity, E.quantity + 2], at(...onCard(220, 180)), { gain: 0.85 })
  useSoundCue('glint', E.premia, at(...centerOf(sum)), { gain: 0.5, seconds: 0.5 })
  useSoundCue('stamp', E.stamp + 1, at(...centerOf(STAMP_RECT)), { gain: 1 })
  useSoundCue('success', E.stamp + 8, at(...centerOf(STAMP_RECT)), { gain: 0.7 })
  useSoundCue('toast', E.paid, phoneTaskAt, { gain: 0.6 })
  useSoundCue('air', E.out, { x: 960, y: 540 }, { gain: 0.5, seconds: 0.6 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {frame < 44 && <DrawPath d={framePath} p={line} color={IA.primary} width={3.2} opacity={1 - easeIn(span(frame, 30, 12))} />}
        {/* Карточка координатора: переворачивается (П15) — форма, список, приёмка. */}
        <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.width, height: CARD.height, perspective: 2600, transform: `translateX(${hit}px)`, opacity: cardIn * (1 - easeIn(span(frame, E.out + 12, 6))) }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 16 * CS, overflow: 'hidden', background: '#ffffff', boxShadow: SHADOW.lifted, transform: `rotateY(${local + out * 90}deg)` }}>
            <Painted source={card} style={{ inset: 0 }} />
            {face === 2 && frame >= E.quantity && reveal < 1 && (
              <div style={{ position: 'absolute', left: 20 * CS + reveal * 400 * CS, top: 208 * CS, width: 400 * CS, height: 30 * CS, background: '#ffffff' }} />
            )}
          </div>
          {/* Штамп «Praca odebrana · 360,00 zł» падает на карточку (м-печать). */}
          {frame >= E.stamp && (
            <div
              style={{
                position: 'absolute',
                left: STAMP_RECT.x - CARD.x,
                top: STAMP_RECT.y - CARD.y,
                width: STAMP_RECT.width,
                height: STAMP_RECT.height,
                borderRadius: 12 * CS,
                boxShadow: SHADOW.lifted,
                transform: `scale(${mix(1.45, 1, stamp)}) rotate(${mix(-6, -2, clamp01(stamp))}deg)`,
                opacity: clamp01(stamp * 2) * (1 - out),
              }}
            >
              <Painted source={twins.stamp} style={{ inset: 0 }} />
            </div>
          )}
        </div>
        <Scribble rect={cardRect({ x: 24 + ((440 - 48 - 16) / 3 + 8) * 2, y: 360, width: (440 - 48 - 16) / 3, height: 38 })} p={easeOut(span(frame, 90, 16)) * (1 - easeIn(span(frame, E.submit - 4, 8)))} pad={[12, 8]} seed={14} width={2.4} />
        <Scribble rect={cardRect({ x: 24, y: 410, width: 392, height: 32 })} kind="underline" p={easeOut(span(frame, 104, 14)) * (1 - easeIn(span(frame, E.submit - 4, 8)))} width={2.4} />
        <Scribble rect={sum} kind="underline" p={easeOut(span(frame, E.premia + 14, 12)) * (1 - easeIn(span(frame, E.confirm - 6, 8)))} width={2.6} />
        {/* Задание летит в телефон Jana. */}
        {frame >= E.fly - 2 && frame < E.fly + E.flyDur + 6 && (
          <div
            style={{
              position: 'absolute',
              left: chip.x - ENTRY.width / 2,
              top: chip.y - ENTRY.height / 2,
              width: ENTRY.width,
              height: ENTRY.height,
              transform: `scale(${chip.scale}) rotate(${Math.sin(Math.PI * chip.t) * 5}deg)`,
              borderRadius: 12,
              boxShadow: SHADOW.lifted,
              opacity: easeOut(span(frame, E.fly - 2, 6)) * (1 - easeIn(span(frame, E.fly + E.flyDur - 4, 10))),
            }}
          >
            <Painted source={twins.entry} style={{ inset: 0 }} />
          </div>
        )}
        {/* Отметка «Zgłoszone» летит обратно к координатору. */}
        {frame >= E.back && frame < E.back + E.backDur + 4 && (
          <div
            style={{
              position: 'absolute',
              left: back.x - 26,
              top: back.y - 26,
              width: 52,
              height: 52,
              borderRadius: 26,
              background: IA.orange500,
              boxShadow: `0 0 0 9px ${tint(IA.orange500, 0.16)}, ${SHADOW.card}`,
              transform: `scale(${mix(0.6, 1, spring(frame, E.back, SPRINGS.pop)) * (1 - easeIn(span(frame, E.back + E.backDur - 2, 6)))})`,
            }}
          />
        )}
        <Pulse x={BACK_TO[0]} y={BACK_TO[1]} at={E.back + E.backDur} until={E.back + E.backDur + 26} radius={60} color={tint(IA.orange500, 0.8)} rings={2} period={22} width={2.4} />
        <Handset spot={PHONE} screen={IA.gray50} style={{ transform: `perspective(2400px) translateY(${(1 - rise) * 700}px) rotateY(${phoneOut * 90}deg)`, opacity: frame < E.fly - 10 ? 0 : 1 }}>
          <Painted source={phone} style={{ inset: 0 }} />
          <div style={{ position: 'absolute', left: PHONE_TASK.x, top: PHONE_TASK.y, width: PHONE_TASK.width, height: 112, borderRadius: 12, background: tint(IA.green500, 0.18 * Math.sin(Math.PI * clamp01(span(frame, E.paid, 24)))) }} />
        </Handset>
        <Tap x={phonePt(PHONE, WORKER_TASK_BUTTON.x + WORKER_TASK_BUTTON.width / 2, WORKER_TASK_BUTTON.y + 21)[0]} y={phonePt(PHONE, 0, WORKER_TASK_BUTTON.y + 21)[1]} at={E.start} scale={PHONE.scale} />
        <Tap x={phonePt(PHONE, WORKER_TASK_BUTTON.x + WORKER_TASK_BUTTON.width / 2, WORKER_TASK_BUTTON.y + 21)[0]} y={phonePt(PHONE, 0, WORKER_TASK_BUTTON.y + 21)[1]} at={E.report} scale={PHONE.scale} />
      </Camera>
      <Callout anchor={sumAnchor} box={{ x: cardRight + 60, y: sumAnchor[1] - 250, width: 480 }} tag={tag(14, lang)} title={caption(14, lang)} at={E.premia + 8} until={E.confirm - 6} />
      {ripples.map(({ at, xy }) => (
        <Ripple key={at} x={xy[0]} y={xy[1]} at={at} />
      ))}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
