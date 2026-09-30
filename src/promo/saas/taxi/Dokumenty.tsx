import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, Ripple, Tap, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { SHADOW, tint, type Point, type Rect } from '../kit/theme'
import { DeskEnter, Glow, Shutter, Sweep, typingFrames, useSoundPoints } from './fx'
import { inFrame } from './geometry'
import { Glyph } from './glyphs'
import { CABINET_VIEW } from './Rejestracja'
import { DESK, Desk, Live, PHONE, TaxiPhone, deskRect, onDesk, onPhone, phoneRect } from './screen'
import {
  CABINET,
  GOLD,
  HERO,
  REJECT_BUTTON,
  REJECT_DIALOG,
  SHEET_ROWS,
  TB,
  UPLOAD_SHEET,
  VERIFIED,
  WEB_TOP,
  box,
  caption,
  docCardRect,
  drawApplications,
  drawCabinet,
  drawDocCard,
  drawDocuments,
  drawNativeDocs,
  drawReasonBox,
  drawRejectDialog,
  drawUploadSheet,
  drawVerified,
  nativeDocRow,
  reviewRow,
  tag,
  type NativeDoc,
  type Review,
} from './twins'

/* 09–11 · 03 Dokumenty (57 долей). Кабинет уходит в колоду (П8), из неё
   выезжает «Dokumenty». Касание «Test Psychologiczny» — снизу лист «Sposób
   przesyłania» (крупно, читается); «Zrób zdjęcie», вспышка, карточки
   зеленеют по одной, полоса «Przesłano … z 3» растёт золотом в зелёный.
   Три документа отрываются от экрана и летят веером в панель владельца —
   камера следует за ними; окно поворачивается, как дверь. «Zgłoszenia»: ✓, ✓,
   ✗ — окно «Odrzuć dokument», причина печатается. Окно сжимается в рамку
   причины и летит обратно в телефон (родное приложение): «Odrzucony» с
   причиной → «Prześlij nowy» → «W weryfikacji» → «Zatwierdzony»; сверху падает
   «🎉 Profil zweryfikowany».

   0–34     колода: кабинет уходит назад, «Dokumenty» выезжает вперёд
   36–60    наезд на «Dokumenty»; 56 — касание «Test Psychologiczny»
   60–171   лист «Sposób przesyłania» крупно (≥ readFrames); выноска 09
   165      «Zrób zdjęcie», вспышка; 187/201/215 — документы загружены
   219–237  «Wszystkie dokumenty przesłane», полоса вспыхивает
   265–277  карточки отрываются; 277–335 — полёт в панель (камера следует)
   337–365  «Zgłoszenia»: строки загораются; 387 ✓, 407 ✓, 429 ✗
   433–581  «Odrzuć dokument» крупно, 463–515 — причина печатается; выноска 10
   581      «Odrzuć dokument»; 585–595 окно → рамка причины; 595–651 — полёт
   651      причина садится в карточку «Odrzucony»; 697 «Prześlij nowy»
   705      «W weryfikacji»; 737 «Zatwierdzony»
   751–855  «🎉 Profil zweryfikowany» крупно; выноска 11 */

export const DOKUMENTY_BEATS = 57

const T = {
  deck: 4,
  docsCam: 36,
  tapDoc: 56,
  sheet: 60,
  photo: 165,
  done: [187, 201, 215],
  all: 219,
  lift: 265,
  flight: 277,
  land: 335,
  review: 339,
  checks: [387, 407],
  cross: 429,
  dialog: 433,
  typing: 463,
  reject: 581,
  shrink: 585,
  back: 595,
  backLand: 651,
  retake: 697,
  pending: 705,
  approved: 737,
  notice: 751,
}
const END = DOKUMENTY_BEATS * 15

/* ── Телефон: колода, «Dokumenty», лист, загрузка ── */

const SHEET: Rect = { x: UPLOAD_SHEET.x, y: UPLOAD_SHEET.y, width: UPLOAD_SHEET.width, height: UPLOAD_SHEET.height }
const DOC_UPLOAD: Point = [16 + 361 - 40, docCardRect(0).y + 53]
const PHOTO_ROW: Point = [196.5, SHEET.y + SHEET_ROWS[0]! + 40]

function docsState(frame: number): { count: number; busy: number } {
  let count = 0
  let busy = -1
  T.done.forEach((at, i) => {
    if (frame >= at) count = i + 1
    else if (frame >= at - 12 && busy < 0) busy = i
  })
  return { count, busy }
}

/** Полоса «Przesłano … z 3» растёт плавно (м-прогресс): поверх нарисованной
    художником полосы — та же дорожка и заливка золото → зелёный на долю p. */
function patchProgress(ctx: CanvasRenderingContext2D, p: number) {
  const top = WEB_TOP + 96
  ctx.fillStyle = TB.bg
  ctx.fillRect(12, top + 22, 369, 16)
  box(ctx, 16, top + 26, 361, 8, 4, 'rgba(24, 29, 37, 0.5)')
  if (p <= 0.002) return
  const fill = 361 * p
  const g = ctx.createLinearGradient(16, 0, 16 + fill, 0)
  g.addColorStop(0, TB.gold)
  g.addColorStop(1, TB.green5)
  box(ctx, 16, top + 26, fill, 8, 4, g)
}

const progress = (frame: number) => T.done.reduce((sum, at) => sum + easeInOut(span(frame, at - 6, 10)) / 3, 0)

/* ── Полёт трёх документов в «Zgłoszenia» ── */

const DOC_WORLD = [0, 1, 2].map((i) => phoneRect(docCardRect(i)))
const ROW_WORLD = [0, 1, 2].map((i) => deskRect(reviewRow(i)))

function docFlight(frame: number, i: number) {
  const start = T.flight + i * 4
  const t = glide(span(frame, start, T.land - T.flight - 8))
  const from = DOC_WORLD[i]!
  const to = ROW_WORLD[i]!
  const lift = easeOut(span(frame, T.lift + i * 2, 10))
  const fan = (i - 1) * 7 * Math.sin(Math.PI * t)
  const morph = easeInOut(span(frame, start + 22, 22))
  const width = mix(from.width, to.width, morph)
  const height = mix(from.height, to.height, morph)
  const x = mix(from.x + from.width / 2, to.x + to.width / 2, t)
  const y = mix(from.y + from.height / 2, to.y + to.height / 2, t) - Math.sin(Math.PI * t) * (170 + (1 - i) * 40)
  return { x, y, width, height, t, lift, fan, morph }
}

/* ── Окно причины и её полёт в приложение ── */

const DIALOG: Rect = deskRect({ x: (DESK.width - REJECT_DIALOG.width) / 2, y: (DESK.height - REJECT_DIALOG.height) / 2, width: REJECT_DIALOG.width, height: REJECT_DIALOG.height })
const REASON_SLOT: Rect = phoneRect(nativeDocRow(2).reason)

function reasonFlight(frame: number) {
  const shrink = easeInOut(span(frame, T.shrink, 12))
  const t = glide(span(frame, T.back, T.backLand - T.back))
  const width = mix(DIALOG.width, REASON_SLOT.width, shrink)
  const height = mix(DIALOG.height, REASON_SLOT.height, shrink)
  const x = mix(DIALOG.x + DIALOG.width / 2, REASON_SLOT.x + REASON_SLOT.width / 2, t)
  const y = mix(DIALOG.y + DIALOG.height / 2, REASON_SLOT.y + REASON_SLOT.height / 2, t) - Math.sin(Math.PI * t) * 160
  return { x, y, width, height, shrink, t }
}

function nativeState(frame: number): { third: NativeDoc; reason: 0 | 1 | 2 } {
  if (frame < T.backLand) return { third: 'rejected', reason: 1 }
  if (frame < T.pending) return { third: 'rejected', reason: 2 }
  if (frame < T.approved) return { third: 'pending', reason: 2 }
  return { third: 'approved', reason: 0 }
}

/* ── Камера ── */

const NOTICE: Rect = { x: 16, y: 62, width: VERIFIED.width, height: VERIFIED.height }
const ROWS_RECT = deskRect({ x: 300, y: 390, width: 944, height: 262 })
const NOTICE_VIEW = focus(phoneRect(NOTICE), { fill: 0.5, shift: [-260, 90] })

const CAMERA: CameraKey[] = [
  { at: 0, ...CABINET_VIEW },
  { at: T.deck - 2, dur: 26, x: PHONE.cx, y: PHONE.cy, zoom: 1.08 },
  { at: T.docsCam, dur: 24, ...fit(phoneRect({ x: 16, y: 100, width: 361, height: 360 }), { max: 2.2, margin: 70 }) },
  { at: T.sheet + 2, dur: 24, ...focus(phoneRect(SHEET), { fill: 0.5, shift: [-270, 0] }) },
  { at: T.photo + 10, dur: 26, ...fit(phoneRect({ x: 16, y: 140, width: 361, height: 440 }), { max: 2.05, margin: 70 }) },
  { at: T.lift - 4, dur: 18, ...fit(phoneRect({ x: 16, y: 190, width: 361, height: 380 }), { max: 1.75, margin: 70 }) },
  { at: T.flight + 4, dur: 18, follow: follow((f) => [docFlight(f, 1).x, docFlight(f, 1).y], { zoom: (f) => mix(1.6, 1.05, glide(span(f, T.flight, 50))), lag: 6 }) },
  { at: T.land - 6, dur: 28, ...fit(ROWS_RECT, { max: 1.85, margin: 60 }) },
  { at: T.dialog + 2, dur: 24, ...focus(DIALOG, { fill: 0.52, shift: [-270, 0] }) },
  { at: T.back + 2, dur: 16, follow: follow((f) => [reasonFlight(f).x, reasonFlight(f).y], { zoom: (f) => mix(1.9, 1.3, glide(span(f, T.back, 56))), lag: 6 }) },
  { at: T.backLand - 6, dur: 26, ...fit(phoneRect({ x: 16, y: 372, width: 361, height: 340 }), { max: 2.35, margin: 70 }) },
  { at: T.notice + 2, dur: 24, ...NOTICE_VIEW },
]

const CURSOR_KEYS = (() => {
  const at = (p: readonly [number, number]) => onDesk(p[0], p[1])
  const rows = [0, 1, 2].map((i) => reviewRow(i))
  const [c0x, c0y] = at(rows[0]!.check)
  const [c1x, c1y] = at(rows[1]!.check)
  const [x2x, x2y] = at(rows[2]!.cross)
  const [bx, by] = onDesk(DIALOG.x - DESK.x + REJECT_BUTTON[0], DIALOG.y - DESK.y + REJECT_BUTTON[1])
  return [
    { at: 359, x: c0x - 260, y: c0y + 150 },
    { at: 383, x: c0x, y: c0y },
    { at: 403, x: c1x, y: c1y },
    { at: 425, x: x2x, y: x2y },
    { at: 455, x: x2x + 60, y: x2y + 140 },
    { at: 555, x: bx + 120, y: by + 90 },
    { at: 577, x: bx, y: by },
    { at: 595, x: bx + 90, y: by + 130 },
  ]
})()
const CLICKS = [T.checks[0]!, T.checks[1]!, T.cross, T.reject]

/** Причина отказа печатается по знаку в кадр (1 знак = 1 кадр по-польски).
    Английская — другой длины: темп тот же в долях, печать кончается на том же
    кадре, что польская (T.typing + длина польской − 1). */
function typedReason(frame: number, lang: Lang): string {
  const count = Math.max(0, Math.min(HERO.reason.length, frame - T.typing + 1))
  if (lang !== 'en') return HERO.reason.slice(0, count)
  return HERO.reasonEn.slice(0, Math.floor((count * HERO.reasonEn.length) / HERO.reason.length))
}

export function Dokumenty() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const layout = useMemo(() => {
    const all = textWidth(pick(lang, 'Wszystkie dokumenty przesłane', 'All documents uploaded'), 14, 500)
    return {
      linked: { x: 16 + 87, y: CABINET.telegram.y + 55 - 11, width: textWidth(pick(lang, `Połączono: ${HERO.telegram}`, `Connected: ${HERO.telegram}`), 14, 400), height: 11 },
      passkey: { x: 16 + 72, y: CABINET.passkey.y + 22, width: textWidth(pick(lang, '1 klucz — logowanie bez hasła', '1 key — sign in without a password'), 12, 400), height: 40 },
      all: { x: 377 - all, y: WEB_TOP + 96 + 3, width: all, height: 13 },
    }
  }, [lang])

  /* Колода (П8): кабинет уменьшается и уходит назад, «Dokumenty» выезжает снизу. */
  const deck = easeInOut(span(frame, T.deck, 18))
  const come = spring(frame, T.deck + 8, SPRINGS.glide)
  const docs = docsState(frame)
  const p = progress(frame)
  const sheetIn = spring(frame, T.sheet, SPRINGS.glide) * (1 - easeIn(span(frame, T.photo + 6, 10)))
  const lifted = frame >= T.lift
  const reviews: [Review, Review, Review] = [frame >= T.checks[0]! + 1 ? 1 : 0, frame >= T.checks[1]! + 1 ? 1 : 0, frame >= T.reject + 1 ? 2 : 0]
  const dialogIn = spring(frame, T.dialog, SPRINGS.pop)
  const typed = typedReason(frame, lang)
  const caret = frame >= T.typing && Math.floor(frame / 8) % 2 === 0 && frame < T.reject
  const reason = reasonFlight(frame)
  const native = nativeState(frame)
  const noticeIn = spring(frame, T.notice, SPRINGS.pop)
  const deskIn = spring(frame, T.flight + 4, SPRINGS.heavy)
  const dimDesk = 0.55 * easeOut(span(frame, T.dialog, 8)) * (1 - easeIn(span(frame, T.shrink, 10)))
  const cursorWorld = cursorAt(CURSOR_KEYS, frame, CLICKS, 599)
  const [cx, cy] = camera.project(cursorWorld.x, cursorWorld.y)
  const clicks = CLICKS.map((at) => {
    const point = cursorAt(CURSOR_KEYS, at)
    return { at, point: camera.project(point.x, point.y) }
  })

  /* Выноски. */
  const photoAt = camera.project(...onPhone(PHOTO_ROW[0] + 60, PHOTO_ROW[1]))
  const sheetView = viewAt(CAMERA, T.sheet + 40)
  const sheetRight = sheetView.project(phoneRect(SHEET).x + SHEET.width, 0)[0]
  const fieldAt = camera.project(DIALOG.x + 300, DIALOG.y + 232)
  const dialogView = viewAt(CAMERA, T.dialog + 40)
  const dialogRight = dialogView.project(DIALOG.x + DIALOG.width, 0)[0]
  const noticeAt = camera.project(...onPhone(NOTICE.x + 190, NOTICE.y + 30))
  const noticeView = viewAt(CAMERA, T.notice + 40)
  const noticeRight = noticeView.project(phoneRect(NOTICE).x + NOTICE.width, 0)[0]

  /* Звук: колода; лист «Sposób przesyłania»; затвор; документы 1 и 2 из 3, «Wszystkie
     dokumenty przesłane»; документы отрываются и летят в панель, окно
     поворачивается дверью, блик, документы садятся; галочки ✓ ✓; окно «Odrzuć
     dokument», причина печатается, отказ; причина летит в приложение и садится;
     снимок, «W weryfikacji», «Zatwierdzony», уведомление «Profil zweryfikowany»
     (падает с 751, но в кадр входит с подъёмом камеры к ~763 — звук тогда). */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const phoneAt = (x: number, y: number) => at(...onPhone(x, y))
  const deskCenter = at(DESK.x + DESK.width / 2, DESK.y + DESK.height / 2)
  const dialogCenter = at(DIALOG.x + DIALOG.width / 2, DIALOG.y + DIALOG.height / 2)
  const status = phoneAt(311, nativeDocRow(2).y + 28)
  useSoundCue('air', T.deck, phoneAt(196.5, 426), { gain: 0.5, seconds: 0.8 })
  useSoundCue('popIn', T.sheet + 7, phoneAt(196.5, SHEET.y + 40), { gain: 0.6 })
  useSoundCue('glint', T.photo + 2, phoneAt(196.5, 426), { gain: 0.45, seconds: 0.4 })
  useSoundCue('tick', T.done[0], phoneAt(196.5, docCardRect(0).y + 53), { gain: 0.5 })
  useSoundCue('tick', T.done[1], phoneAt(196.5, docCardRect(1).y + 53), { gain: 0.5 })
  useSoundCue('success', T.done[2], phoneAt(layout.all.x + layout.all.width / 2, layout.all.y + 6), { gain: 0.85 })
  useSoundCue('layers', T.lift, phoneAt(196.5, docCardRect(1).y + 53), { gain: 0.45, seconds: 0.5 })
  const flyer = docFlight(frame, 1)
  useSoundTrack('taxi2d-docs-flight', 'whoosh', frame > T.flight && frame <= T.land - 4, at(flyer.x, flyer.y), { gain: 0.6 })
  useSoundCue('air', T.flight + 4, deskCenter, { gain: 0.5, seconds: 0.8 })
  useSoundCue('glint', T.flight + 24, deskCenter, { gain: 0.35, seconds: 0.7 })
  useSoundCue('thump', T.land - 4, at(ROW_WORLD[1]!.x + ROW_WORLD[1]!.width / 2, ROW_WORLD[1]!.y + ROW_WORLD[1]!.height / 2), { gain: 0.6 })
  useSoundPoints('tick', T.checks.map((f, i) => ({ at: f + 2, ...at(...onDesk(...reviewRow(i).check)) })), { gain: 0.45 })
  useSoundCue('popIn', T.dialog, dialogCenter, { gain: 0.8 })
  useSoundCues('key', typingFrames(T.typing, 1, HERO.reason.length), { x: fieldAt[0], y: fieldAt[1] }, { gain: 0.55 })
  useSoundCue('thump', T.reject + 1, dialogCenter, { gain: 0.5 })
  useSoundTrack('taxi2d-reason-flight', 'whoosh', frame > T.back && frame <= T.backLand, at(reason.x, reason.y), { gain: 0.6 })
  useSoundCue('thump', T.backLand, at(REASON_SLOT.x + REASON_SLOT.width / 2, REASON_SLOT.y + REASON_SLOT.height / 2), { gain: 0.6 })
  useSoundCue('glint', T.retake + 2, phoneAt(196.5, 426), { gain: 0.4, seconds: 0.4 })
  useSoundCue('tick', T.pending, status, { gain: 0.5 })
  useSoundCue('success', T.approved, status, { gain: 0.8 })
  useSoundCue('notify', T.notice + 12, phoneAt(NOTICE.x + NOTICE.width / 2, NOTICE.y + NOTICE.height / 2), { gain: 0.9 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        {/* Панель владельца: окно поворачивается к зрителю, как дверь. */}
        {frame >= T.flight && (
          <DeskEnter t={deskIn} kind="door">
            <Desk>
              <Live width={DESK.width} height={DESK.height} ratio={2.4} state={reviews.join('')} draw={(ctx) => drawApplications(ctx, DESK.width, DESK.height, reviews)} />
              <Sweep frame={frame} at={T.flight + 24} width={DESK.width} height={DESK.height} />
              {[0, 1, 2].map((i) => (
                <Glow key={i} frame={frame} at={T.land - 6 + i * 4} rect={reviewRow(i)} color={TB.gold} strength={0.2} />
              ))}
              {T.checks.map((at, i) => (
                <CheckMark key={i} frame={frame} at={at} x={reviewRow(i).check[0]} y={reviewRow(i).check[1]} />
              ))}
              <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dimDesk }} />
            </Desk>
          </DeskEnter>
        )}

        {/* Окно «Odrzuć dokument»: выходит с перелётом, потом сжимается в рамку причины и летит. */}
        {frame >= T.dialog && frame < T.backLand + 2 && (
          <div
            style={{
              position: 'absolute',
              left: reason.x - reason.width / 2,
              top: reason.y - reason.height / 2,
              width: reason.width,
              height: reason.height,
              borderRadius: mix(24, 8, reason.shrink),
              overflow: 'hidden',
              boxShadow: SHADOW.lifted,
              opacity: clamp01(dialogIn * 1.6),
              transform: `perspective(1600px) rotateX(${(1 - clamp01(dialogIn)) * 14}deg) scale(${mix(0.94, 1, clamp01(dialogIn))})`,
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, width: REJECT_DIALOG.width, height: REJECT_DIALOG.height, transformOrigin: '0 0', transform: `scale(${reason.width / REJECT_DIALOG.width}, ${reason.height / REJECT_DIALOG.height})`, opacity: 1 - reason.shrink }}>
              <Live width={REJECT_DIALOG.width} height={REJECT_DIALOG.height} ratio={3.2} state={`${typed}|${caret}`} draw={(ctx) => drawRejectDialog(ctx, typed, caret)} />
            </div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: REASON_SLOT.width, height: REASON_SLOT.height, transformOrigin: '0 0', transform: `scale(${reason.width / REASON_SLOT.width}, ${reason.height / REASON_SLOT.height})`, opacity: reason.shrink }}>
              <Live width={REASON_SLOT.width} height={REASON_SLOT.height} ratio={4} draw={(ctx) => drawReasonBox(ctx, true)} />
            </div>
          </div>
        )}

        <TaxiPhone
          overlay={
            <>
              {/* Лист «Sposób przesyłania» выезжает снизу, экран за ним темнеет. */}
              <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 852, background: '#000', opacity: 0.45 * sheetIn }} />
              {sheetIn > 0.002 && (
                <div style={{ position: 'absolute', left: SHEET.x, top: SHEET.y + (1 - sheetIn) * 420, width: SHEET.width, height: SHEET.height, borderRadius: 24, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
                  <Live width={SHEET.width} height={SHEET.height} ratio={3.2} draw={drawUploadSheet} />
                </div>
              )}
              <Shutter frame={frame} at={T.photo + 2} />
              <Shutter frame={frame} at={T.retake + 2} />
              {/* Приложение: причина садится и загорается, «Zatwierdzony» — зелёной волной. */}
              <Glow frame={frame} at={T.backLand} rect={nativeDocRow(2).reason} color="#F77070" radius={8} strength={0.3} />
              <Glow frame={frame} at={T.approved} rect={{ ...nativeDocRow(2), height: 128 }} color={TB.green4} radius={16} strength={0.22} dur={28} />
              {frame >= T.notice && (
                <div
                  style={{
                    position: 'absolute',
                    left: NOTICE.x,
                    top: NOTICE.y,
                    width: NOTICE.width,
                    height: NOTICE.height,
                    borderRadius: 20,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                    opacity: clamp01(noticeIn * 1.6),
                    transform: `translateY(${(1 - clamp01(noticeIn)) * -120}px) scale(${mix(0.92, 1, clamp01(noticeIn))})`,
                  }}
                >
                  <Live width={VERIFIED.width} height={VERIFIED.height} ratio={4.5} draw={drawVerified} />
                </div>
              )}
              <Tap x={DOC_UPLOAD[0]} y={DOC_UPLOAD[1]} at={T.tapDoc} />
              <Tap x={PHOTO_ROW[0]} y={PHOTO_ROW[1]} at={T.photo} />
              <Tap x={196.5} y={nativeDocRow(2).upload.y + 20} at={T.retake} />
              <Scribble rect={layout.linked} kind="underline" color={GOLD} width={2} p={1 - easeIn(span(frame, 0, 8))} />
              <Scribble rect={layout.passkey} color={GOLD} width={2} pad={[12, 5]} seed={6} p={1 - easeIn(span(frame, 0, 8))} />
              <Scribble rect={layout.all} kind="underline" color={TB.green4} width={2} p={easeOut(span(frame, T.all + 4, 12)) * (1 - easeIn(span(frame, T.lift - 4, 6)))} />
              <Scribble rect={{ x: 32, y: nativeDocRow(2).y + 12, width: 329, height: 30 }} color={TB.green4} width={2} pad={[10, 6]} seed={8} p={easeOut(span(frame, T.approved + 4, 14)) * (1 - easeIn(span(frame, T.notice + 6, 6)))} />
            </>
          }
        >
          {frame < T.land + 10 ? (
            <>
              {/* Колода: кабинет уменьшается, скругляется и уходит назад и вверх. */}
              {frame < T.deck + 26 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 393,
                    height: 852,
                    borderRadius: mix(0, 44, deck),
                    overflow: 'hidden',
                    transformOrigin: '50% 0%',
                    transform: `perspective(1400px) translateY(${deck * 36}px) rotateX(${deck * 16}deg) scale(${mix(1, 0.7, deck)})`,
                    opacity: 1 - 0.6 * deck,
                  }}
                >
                  <Live width={393} height={852} ratio={3} draw={(ctx) => drawCabinet(ctx, { linked: true, slots: true })} />
                </div>
              )}
              {frame >= T.deck + 6 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 393,
                    height: 852,
                    borderRadius: mix(44, 0, clamp01(come)),
                    overflow: 'hidden',
                    boxShadow: come < 0.98 ? '0 -20px 60px rgba(0,0,0,0.6)' : undefined,
                    transform: come < 0.999 ? `translateY(${(1 - come) * 700}px) scale(${mix(0.8, 1, clamp01(come))})` : undefined,
                  }}
                >
                  <Live width={393} height={852} ratio={3} state={`${docs.count}|${docs.busy}|${lifted}|${Math.round(p * 60)}`} draw={(ctx) => {
                    drawDocuments(ctx, docs.count, docs.busy, !lifted)
                    patchProgress(ctx, p)
                  }} />
                </div>
              )}
            </>
          ) : (
            <Live width={393} height={852} ratio={3} state={JSON.stringify(native)} draw={(ctx) => drawNativeDocs(ctx, native.third, native.reason)} />
          )}
        </TaxiPhone>

        {/* Три документа: отрываются от экрана и летят веером в строки «Zgłoszenia». */}
        {lifted &&
          frame < T.land + 8 &&
          [0, 1, 2].map((i) => {
            const fly = docFlight(frame, i)
            const fade = 1 - easeIn(span(frame, T.land - 8 + i * 2, 12))
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: fly.x - fly.width / 2,
                  top: fly.y - fly.height / 2,
                  width: fly.width,
                  height: fly.height,
                  borderRadius: 24,
                  overflow: 'hidden',
                  boxShadow: SHADOW.lifted,
                  opacity: fade,
                  transform: `rotate(${fly.fan}deg) scale(${1 + 0.05 * fly.lift * (1 - fly.t)})`,
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, width: 361, height: 106, transformOrigin: '0 0', transform: `scale(${fly.width / 361}, ${fly.height / 106})` }}>
                  <Live width={361} height={106} ratio={3} draw={(ctx) => drawDocCard(ctx, i, 2)} />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: tint(TB.green4, 0.12 * fly.morph) }} />
              </div>
            )
          })}
      </Camera>

      {clicks.map(({ at, point }) => (
        <Ripple key={at} x={point[0]} y={point[1]} at={at} />
      ))}
      <Cursor x={cx} y={cy} press={cursorWorld.press} opacity={cursorWorld.opacity} />

      <Callout anchor={photoAt} box={{ x: inFrame(sheetRight + 70, 500), y: photoAt[1] - 210, width: 500 }} tag={tag(9, lang)} title={caption(9, lang)} at={T.sheet + 26} until={T.photo - 2} />
      <Callout anchor={fieldAt} box={{ x: inFrame(dialogRight + 60, 560), y: fieldAt[1] - 250, width: 560 }} tag={tag(10, lang)} title={caption(10, lang)} at={T.typing + 10} until={T.reject - 6} />
      <Callout
        anchor={noticeAt}
        box={{ x: inFrame(noticeRight + 60, 560), y: noticeAt[1] + 90, width: 560 }}
        tag={tag(11, lang)}
        title={caption(11, lang)}
        at={T.notice + 16}
        until={END - 24}
      />
    </AbsoluteFill>
  )
}

/** Галочка у строки после клика ✓ (м-галочка): зелёный круг прорисовывается и гаснет. */
function CheckMark({ frame, at, x, y }: { frame: number; at: number; x: number; y: number }) {
  if (frame < at || frame > at + 40) return null
  const p = easeOut(span(frame, at + 1, 10))
  const out = easeIn(span(frame, at + 28, 12))
  return (
    <div style={{ position: 'absolute', left: x - 22, top: y - 60, opacity: 1 - out, transform: `translateY(${(1 - p) * 8}px)` }}>
      <Glyph name="circleCheck" size={44} color={TB.green4} stroke={2.2} p={p} />
    </div>
  )
}

/** Уведомление «Profil zweryfikowany» на экране (pt) — от него глава «Umowa» тянет связь. */
export const DOKUMENTY_NOTICE = NOTICE
export const DOKUMENTY_VIEW = NOTICE_VIEW
