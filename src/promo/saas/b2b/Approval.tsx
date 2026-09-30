import { AbsoluteFill, interpolateColors, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble, bezierPoint, flowCurve } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundProbe, useSoundTrack } from '../kit/sound'
import { SHADOW, type Point, type Rect } from '../kit/theme'
import { Flip, Swing } from '../kit/transitions'
import { useLang, useT } from '../kit/lang'
import { caption, tag } from './data'
import { PAGE, S, mid, world, xy } from './layout'
import { Bead, ProductToast } from './parts'
import { APPLICATION, ApplicationCard, B2BRequestsPage, approveRect } from './screens/Admin'
import { ApprovalEmail, EMAIL, MAIL_GREEN } from './screens/Email'
import { L, Sheet, tagWidth, tw } from './twin'
import { ScreenWindow } from './Window'

/* 06–07 · 02 Weryfikacja · Одобрение и письмо (34 доли). Панель продавца
   «Kontrahenci B2B» въезжает каруселью справа. Заявка, улетевшая из
   регистрации, влетает слева и садится в пустое гнездо «Wnioski o
   współpracę». Камера на карточке: NIP, адрес, «dziś». Клик «Zatwierdź» —
   статус перекатывается в «Zatwierdzony», тост продукта крупно. Зелёная
   бусина уходит к покупателю — камера за ней — и загорается письмо «Konto B2B
   zatwierdzone». Письмо читается, клик «Otwórz panel B2B →»: кнопка
   раскрывается во весь кадр (П1) — за ней витрина.

   0–26     панель въезжает каруселью (heavy)
   22–58    заявка влетает слева в гнездо, камера тянется за ней
   58–84    наезд на заявку ×1,5; 88 — обводка «dziś», 96 — подчёркивание NIP
   98–190   выноска 06
   150–180  курсор к «Zatwierdź», 180 — клик; 182–196 статус «Zatwierdzony»
   190      тост «Kontrahent B2B zatwierdzony»; 198–220 камера на тост ×0,5 кадра
   220–264  тост читается
   264–290  камера к карточке; 292–330 бусина к письму, камера за ней
   326–346  письмо встаёт ребром → лицом; 334–362 камера на письмо
   362–456  письмо читается; 380–466 выноска 07
   440–466  курсор к кнопке, 466 — клик; 468–498 кнопка раскрывается в кадр */

const T0 = { plate: 22, land: 58, click: 180, toast: 190, bead: 292, mail: 326, cta: 466, portal: 468 }
const TOAST_TEXT = 'Kontrahent B2B zatwierdzony'
const TOAST_HOLD = 220 + Math.max(44, readFrames(TOAST_TEXT))

const SLOT: Rect = world(APPLICATION)
const APPROVE = (() => {
  const r = approveRect()
  return { x: SLOT.x + r.x * S, y: SLOT.y + r.y * S, width: r.w * S, height: r.h * S }
})()

/** Где заявка в кадре f: влетает слева по дуге, с поворотом. */
function plateAt(f: number) {
  const t = glide(span(f, T0.plate, T0.land - T0.plate))
  return {
    x: mix(-1150, SLOT.x, t),
    y: mix(SLOT.y + 120, SLOT.y, t) - Math.sin(Math.PI * t) * 70,
    rotate: mix(-7, 0, t),
    scale: mix(0.86, 1, t),
  }
}
const plateCenter = (f: number): Point => {
  const p = plateAt(f)
  return [p.x + SLOT.width / 2, p.y + SLOT.height / 2]
}

/** Тост sonner — внизу справа страницы (CSS px продукта → мир). */
const TOAST_BOX = { x: 1024 - 24 - 360, y: 659 - 24 - 56, w: 360, h: 56 }
const TOAST_WORLD = world(TOAST_BOX)

/** Письмо — справа от окна, в 1,3 раза крупнее экрана продукта. */
const MAIL_SCALE = 1.3
const MAIL: Rect = { x: 1930, y: 150, width: EMAIL.w * MAIL_SCALE, height: EMAIL.h * MAIL_SCALE }
const MAIL_READ: Rect = { x: MAIL.x, y: MAIL.y, width: MAIL.width, height: (EMAIL.cta.y + EMAIL.cta.h + 24) * MAIL_SCALE }
const CTA: Rect = { x: MAIL.x + EMAIL.cta.x * MAIL_SCALE, y: MAIL.y + EMAIL.cta.y * MAIL_SCALE, width: EMAIL.cta.w * MAIL_SCALE, height: EMAIL.cta.h * MAIL_SCALE }

/** Статус «Zatwierdzony» на карточке (CSS px карточки) → мир. */
const STATUS_X = 20 + 158 + tw('sp. z o.o.', 16, 600) + 10
const STATUS: Point = [SLOT.x + (STATUS_X + tagWidth('Zatwierdzony', { color: '', size: 12 })) * S, SLOT.y + 31 * S]
const BEAD_PATH = flowCurve(STATUS, [MAIL.x + 40, MAIL.y + 90 * MAIL_SCALE], 0.5)
const beadAt = (f: number): Point => bezierPoint(BEAD_PATH, glide(span(f, T0.bead, 38)))

const CARD_VIEW = fit({ x: SLOT.x, y: PAGE.y + 36 * S, width: SLOT.width, height: SLOT.y + SLOT.height - (PAGE.y + 36 * S) }, { max: 1.45, shift: [0, -90] })

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: T0.plate - 2, dur: 20, follow: follow((f) => { const [x, y] = plateCenter(f); return [mix(x, SLOT.x + SLOT.width / 2, 0.5), mix(y, SLOT.y + SLOT.height / 2, 0.5)] }, { zoom: 1.1, lag: 6 }) },
  { at: T0.land, dur: 26, ...CARD_VIEW },
  { at: T0.toast + 8, dur: 22, ...focus(TOAST_WORLD, { fill: 0.5 }) },
  { at: TOAST_HOLD, dur: 24, ...fit(SLOT, { max: 1.3, shift: [0, -40] }) },
  { at: T0.bead - 4, dur: 18, follow: follow(beadAt, { zoom: 1.2, lag: 6 }) },
  { at: T0.mail + 8, dur: 28, ...focus(MAIL_READ, { fill: 0.56, tall: 0.86, shift: [-330, 0] }) },
]

const CURSOR_A = [
  { at: 150, x: APPROVE.x + APPROVE.width + 220, y: APPROVE.y + 190 },
  { at: T0.click - 4, x: APPROVE.x + APPROVE.width * 0.5, y: APPROVE.y + APPROVE.height * 0.6 },
  { at: T0.click + 24, x: APPROVE.x + APPROVE.width * 1.2, y: APPROVE.y + APPROVE.height * 2.6 },
]
const CURSOR_B = [
  { at: T0.cta - 30, x: CTA.x + CTA.width + 200, y: CTA.y + 180 },
  { at: T0.cta - 4, x: CTA.x + CTA.width * 0.55, y: CTA.y + CTA.height * 0.6 },
]
const CLICK_A = cursorAt(CURSOR_A, T0.click)
const CLICK_B = cursorAt(CURSOR_B, T0.cta)

export const APPROVAL_FRAMES = T0.portal + 42

export function Approval() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const camera = viewAt(CAMERA, frame)
  const enter = spring(frame, 0, SPRINGS.heavy)
  const cursor = frame < T0.cta - 40 ? cursorAt(CURSOR_A, frame, [T0.click], T0.click + 20) : cursorAt(CURSOR_B, frame, [T0.cta])
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const lifted = 1 - easeOut(span(frame, T0.land, 10))
  const plate = plateAt(frame)
  const decided = easeInOut(span(frame, T0.click + 2, 12))
  const press = 1 - 0.05 * clamp01(1 - Math.abs(frame - T0.click) / 3)
  /* Английский чип «Approved» короче польского: бусина стартует от его края
     (камера идёт за польским путём — в конце они совпадают). */
  const statusEn: Point = [SLOT.x + (20 + 158 + tw('sp. z o.o.', 16, 600) + 10 + tagWidth('Approved', { color: '', size: 12 })) * S, STATUS[1]]
  const bead = lang === 'en' ? bezierPoint(flowCurve(statusEn, BEAD_PATH.d, 0.5), glide(span(frame, T0.bead, 38))) : beadAt(frame)
  const mail = spring(frame, T0.mail, SPRINGS.pop)
  const ctaPress = 1 - 0.05 * clamp01(1 - Math.abs(frame - T0.cta) / 3)
  const portal = glide(span(frame, T0.portal, 30))

  /* Выноска 06 — на кнопке «Zatwierdź» (решение человека), рамка под
     карточкой слева от кнопки. */
  const anchor06 = camera.project(APPROVE.x + APPROVE.width * 0.18, APPROVE.y + APPROVE.height * 0.5)
  /* Выноска 07 — на кнопке письма, рамка справа от письма. */
  const anchor07 = camera.project(CTA.x + CTA.width * 0.92, CTA.y + CTA.height * 0.5)
  const mailCam = viewAt(CAMERA, 420)
  const box07 = mailCam.project(MAIL.x + MAIL.width, MAIL.y)

  /* Портал: кнопка письма — во весь кадр, зелёный → Limestone. */
  const [px, py] = camera.project(CTA.x, CTA.y)
  const from = { x: px, y: py, width: CTA.width * camera.zoom, height: CTA.height * camera.zoom }

  /* Звук (карусель, клики, обводки, письмо ребром → лицом, выноски — у
     набора): заявка влетает и садится в гнездо; «Zatwierdź» → статус
     «Zatwierdzony» — одобрено (тост выходит тут же, отдельного звука ему нет:
     одно действие — один звук), тост уходит; бусина летит к письму; кнопка
     письма раскрывается во весь кадр. */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const toastMid = point(PAGE.x + (TOAST_BOX.x + TOAST_BOX.w / 2) * S, PAGE.y + (TOAST_BOX.y + TOAST_BOX.h / 2) * S)
  useSoundTrack('b2b-application', 'whoosh', frame >= T0.plate && frame <= T0.land, point(...plateCenter(frame)), { gain: 0.6 })
  useSoundCue('thump', T0.land, point(...mid(SLOT)), { gain: 0.6 })
  useSoundCue('success', T0.click + 6, point(...STATUS), { gain: 0.9 })
  useSoundCue('popOut', TOAST_HOLD + 30, toastMid, { gain: 0.4 })
  useSoundTrack('b2b-approval-bead', 'whoosh', frame >= T0.bead && frame <= T0.bead + 38, point(...bead), { gain: 0.55 })
  useSoundProbe('whoosh', portal, { x: mix(from.x + from.width / 2, 960, portal), y: mix(from.y + from.height / 2, 540, portal) }, { eps: 0.004, gain: 0.7 })

  return (
    <AbsoluteFill>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          <ScreenWindow
            path="/admin/b2b-resellers"
            overlay={<ProductToast x={TOAST_BOX.x * S} y={TOAST_BOX.y * S} at={T0.toast} until={TOAST_HOLD + 30} text={t(TOAST_TEXT, 'B2B counterparty approved')} scale={S} />}
          >
            <B2BRequestsPage count={frame < T0.click + 8 ? 1 : 0} slot={1 - easeOut(span(frame, T0.land - 4, 8))} />
          </ScreenWindow>
          {frame >= T0.plate && (
            <div
              style={{
                position: 'absolute',
                left: plate.x,
                top: plate.y,
                width: SLOT.width,
                height: SLOT.height,
                borderRadius: 16 * S,
                boxShadow: lifted > 0.02 ? SHADOW.lifted : undefined,
                transform: `rotate(${plate.rotate}deg) scale(${plate.scale})`,
              }}
            >
              <Sheet w={APPLICATION.w} h={APPLICATION.h} scale={S} style={{ left: 0, top: 0 }}>
                <ApplicationCard decided={decided} press={press} />
              </Sheet>
            </div>
          )}
          <Scribble rect={world({ x: APPLICATION.x + STATUS_X + tagWidth(t('Oczekuje na decyzję', 'Awaiting decision'), { color: '', size: 12 }) + 8, y: APPLICATION.y + 20, w: tagWidth(t('dziś', 'today'), { color: '', size: 12, weight: 700, icon: 'clock' }), h: 22 })} p={easeOut(span(frame, 88, 16)) * (1 - easeIn(span(frame, T0.click, 8)))} pad={[10, 6]} seed={4} width={2.6} />
          <Scribble rect={world({ x: APPLICATION.x + 20, y: APPLICATION.y + 90 - 13, w: tw(t('NIP: 1234563218', 'VAT: 1234563218'), 14, 400), h: 16 })} kind="underline" p={easeOut(span(frame, 100, 14)) * (1 - easeIn(span(frame, T0.click, 8)))} width={2.6} />
          {frame >= T0.bead - 2 && frame < T0.bead + 40 && <Bead x={bead[0]} y={bead[1]} color={L.emerald} />}
          {frame >= T0.mail - 2 && (
            <Flip
              angle={90 * (1 - mail)}
              perspective={2000}
              style={{ left: MAIL.x, top: MAIL.y, width: MAIL.width, height: MAIL.height }}
              front={
                <div style={{ position: 'absolute', inset: 0, borderRadius: 22 * MAIL_SCALE, boxShadow: SHADOW.window }}>
                  <Sheet w={EMAIL.w} h={EMAIL.h} scale={MAIL_SCALE} style={{ left: 0, top: 0 }}>
                    <ApprovalEmail press={ctaPress} />
                  </Sheet>
                </div>
              }
            />
          )}
        </Camera>
        {/* У английской рамка выше на 50: польская в две строки кончается около
            1030 — ниже 990, которые сайт не обрезает. Ширина 540 — чтобы «a»
            ушло на вторую строку к «person.». */}
        <Callout anchor={anchor06} box={lang === 'en' ? { x: anchor06[0] - 640, y: anchor06[1] + 60, width: 540 } : { x: anchor06[0] - 640, y: anchor06[1] + 110, width: 580 }} tag={tag(6, lang)} title={caption(6, lang)} at={98} until={186} />
        <Callout anchor={anchor07} box={{ x: box07[0] + 56, y: anchor07[1] - 150, width: 470 }} tag={tag(7, lang)} title={caption(7, lang)} at={380} until={446} />
      </Swing>
      {[
        [CLICK_A, T0.click],
        [CLICK_B, T0.cta],
      ].map(([point, at]) => {
        const p = point as { x: number; y: number }
        const [x, y] = camera.project(p.x, p.y)
        return <Ripple key={at as number} x={x} y={y} at={at as number} color={at === T0.cta ? MAIL_GREEN : undefined} />
      })}
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
      {portal > 0 && (
        <div
          style={{
            position: 'absolute',
            left: mix(from.x, 0, portal),
            top: mix(from.y, 0, portal),
            width: mix(from.width, 1920, portal),
            height: mix(from.height, 1080, portal),
            borderRadius: mix(30 * camera.zoom * MAIL_SCALE, 0, portal),
            background: interpolateColors(portal, [0, 0.55, 1], [MAIL_GREEN, '#8fd3a6', L.page]),
          }}
        />
      )}
    </AbsoluteFill>
  )
}

