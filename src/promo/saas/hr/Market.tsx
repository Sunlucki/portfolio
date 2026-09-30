import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Cursor, Ripple, Swipe, Tap, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { AppWindow, CHROME } from '../kit/surfaces'
import { FONT, SHADOW, tint, type Rect } from '../kit/theme'
import { Flip } from '../kit/transitions'
import { Glyph, Handset, HotToast, Pulse, SCREEN, Swap, SystemTip, arcPoint, centerOf, pagePt, pageRect, phonePt, phoneRect, type PageSpot, type PhoneSpot } from './parts'
import { lockState } from './Lock'
import {
  BANNER,
  CLAIM,
  CLAIM_ROW,
  IA,
  IOS,
  MARKET_CARD,
  MARKET_LIST,
  MARKET_LIST_HEIGHT,
  PANEL,
  caption,
  drawClaimButton,
  drawCoordDashboard,
  drawLockScreen,
  drawMarketBase,
  drawMarketHeroCard,
  drawMarketList,
  drawMyShifts,
  sheet,
  tag,
  useLive,
  useSheets,
  type ClaimState,
  type CoordState,
} from './twins'

/* 09–11 · 03 Giełda (51 доля). Экран блокировки уходит назад в стопку (П8),
   вперёд выезжает «Giełda zmian» (сайт в Safari). Свайп по списку, касание
   «Podejmij» у смены Hub Wrocław 14:00 — 22:00: «Przetwarzanie...» →
   «Oczekuje na zatwierdzenie» (м-статус), тост «Zgłoszenie wysłane!» крупно.
   Заявка летит дугой в пульт координатора справа (П6) — камера за ней — и
   встаёт строкой в «Oczekujące zgłoszenia». Курсор у зелёной кнопки без
   подписи: подсказка «Zatwierdź», клик, тост «Zgłoszenie zatwierdzone».
   Зелёный импульс летит обратно в телефон — «Już przypisany». Экран
   переворачивается в «Moje zmiany» (П15), сверху падает напоминание iOS
   «Najbliższa zmiana».

   0–26     стопка: экран блокировки назад, биржа вперёд
   26–52    к списку ×1,55; 56 — свайп; 90 — «Podejmij»; 92–108 «Przetwarzanie...»
   108      «Oczekuje na zatwierdzenie»; 112–176 тост крупно
   176–200  к карточке смены; 200–292 выноска «Wolne zmiany biorą sami.»
   300–350  заявка летит в пульт, камера за ней; 350 — строка Jana
   364–392  курсор к кнопке; 392–438 подсказка «Zatwierdź» крупно
   440      клик; 442 — тост «Zgłoszenie zatwierdzone»; 458–542 выноска
   532–552  строка зеленеет и уходит
   548–588  импульс летит в телефон, камера за ним; 588 — «Już przypisany»
   632–650  переворот в «Moje zmiany»
   662      напоминание iOS; 680–760 выноска
   765–783  прокрутка насквозь вверх (П14) — в хвосте сцены, под въездом графика */

export const MARKET_BEATS = 51
/** Прокрутка насквозь — в хвосте сцены, пока снизу въезжает график. */
export const MARKET_LEAVE = MARKET_BEATS * 15

const PHONE: PhoneSpot = { x: 960 - SCREEN.width / 2, y: 540 - SCREEN.height / 2, scale: 1 }
const K = 1440 / PANEL.width
const PAGE: PageSpot = { x: 2000, y: 99, k: K }
const PAGE_H = Math.round(PANEL.height * K)

const E = {
  deck: 0,
  swipe: 56,
  tap: 90,
  pending: 108,
  toast: 112,
  fly: 300,
  flyDur: 50,
  tip: 392,
  approve: 440,
  approved: 532,
  pulse: 548,
  pulseDur: 40,
  flip: 632,
  banner: 662,
}

/** Список прокручен на 150 pt: смена Hub Wrocław 14:00 — 22:00 — в середине экрана. */
const SCROLL = 150
const scrollAt = (frame: number) => SCROLL * easeOut(span(frame, E.swipe + 3, 24))
/** Карточка смены и кнопка заявки на экране (после прокрутки), pt. */
const HERO = { x: 20, y: MARKET_LIST.y + 224 - SCROLL, width: MARKET_CARD.width, height: MARKET_CARD.height }
const BUTTON_LIST = { x: 229, y: 370 }
const BUTTON_AT = { x: 229 + 75, y: MARKET_LIST.y + 370 - SCROLL + 19 }
/** Холст кнопки: шире самой кнопки — статус «Oczekuje…» растёт влево. */
const BTN = { width: 250, height: 56, dx: 114, dy: 6 }

const HERO_WORLD = phoneRect(PHONE, HERO)
const TOAST_W = 330
const TOAST: Rect = phoneRect(PHONE, { x: SCREEN.width / 2 - TOAST_W / 2, y: 64, width: TOAST_W, height: 84 })

/** Пульт: строка Jana в «Oczekujące zgłoszenia», зелёная кнопка, подсказка. */
const ROW = pageRect(PAGE, CLAIM_ROW)
const APPROVE = pageRect(PAGE, { x: 922, y: CLAIM_ROW.y + 15, width: 32, height: 32 })
const TIP = pagePt(PAGE, 892, CLAIM_ROW.y + 52)
const CLAIMS = pageRect(PAGE, { x: 266, y: 380, width: 748, height: 176 })
const ZOOM_REGION = pageRect(PAGE, { x: 640, y: 404, width: 370, height: 100 })
const TOAST2_W = 240
const TOAST2: Rect = { x: pagePt(PAGE, 512, 0)[0] - (TOAST2_W * K) / 2, y: pagePt(PAGE, 0, 16)[1], width: TOAST2_W * K, height: 50 * K }
const REGION = { x: 266, y: 404, width: 748, height: 150 }

const BANNER_AT = { x: 12, y: 56 }
const BANNER_RECT = phoneRect(PHONE, { ...BANNER_AT, ...BANNER })

function cardAt(frame: number) {
  const t = glide(span(frame, E.fly, E.flyDur))
  const [x, y] = arcPoint(centerOf(HERO_WORLD), centerOf(ROW), t, 200)
  return { x, y, t, scale: mix(1.06, 0.6, t) }
}

const PULSE_FROM = centerOf(APPROVE)
const PULSE_TO = phonePt(PHONE, BUTTON_AT.x, BUTTON_AT.y)
function pulseAt(frame: number) {
  const t = glide(span(frame, E.pulse, E.pulseDur))
  const [x, y] = arcPoint(PULSE_FROM, PULSE_TO, t, 180)
  return { x, y, t }
}

const CAMERA: CameraKey[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 26, dur: 26, ...fit(phoneRect(PHONE, { x: 0, y: 118, width: SCREEN.width, height: 588 }), { max: 1.55 }) },
  { at: E.toast, dur: 20, ...focus(TOAST, { fill: 0.5 }) },
  { at: 176, dur: 24, ...fit(HERO_WORLD, { max: 2.2, shift: [-250, 0] }) },
  { at: E.fly - 4, dur: 16, follow: follow((f) => [cardAt(f).x, cardAt(f).y], { zoom: (f) => mix(1.35, 0.92, Math.sin(Math.PI * cardAt(f).t)), lag: 6 }) },
  { at: E.fly + E.flyDur + 2, dur: 24, ...fit(CLAIMS, { max: 1.7 }) },
  { at: E.tip - 14, dur: 22, ...focus(ZOOM_REGION, { fill: 0.62 }) },
  { at: E.approve + 2, dur: 20, ...focus(TOAST2, { fill: 0.5, shift: [-300, 0] }) },
  { at: E.pulse - 4, dur: 16, follow: follow((f) => [pulseAt(f).x, pulseAt(f).y], { zoom: (f) => mix(1.3, 0.92, Math.sin(Math.PI * pulseAt(f).t)), lag: 6 }) },
  { at: E.pulse + E.pulseDur + 2, dur: 22, ...fit(HERO_WORLD, { max: 2.2 }) },
  { at: E.flip + 18, dur: 22, x: 960, y: 540, zoom: 1.15 },
  { at: E.banner - 2, dur: 20, ...focus(BANNER_RECT, { fill: 0.56, shift: [-250, 0] }) },
]

const CURSOR = [
  { at: 364, x: APPROVE.x + 260, y: APPROVE.y + 240 },
  { at: E.tip - 4, x: APPROVE.x + APPROVE.width * 0.55, y: APPROVE.y + APPROVE.height * 0.6 },
  { at: E.approve + 24, x: APPROVE.x + 200, y: APPROVE.y + 260 },
]
const CLICK = cursorAt(CURSOR, E.approve)

function claimState(frame: number): ClaimState {
  if (frame < E.tap + 2) return 'claim'
  if (frame < E.pending) return 'processing'
  if (frame < E.pulse + E.pulseDur) return 'pending'
  return 'assigned'
}

function coordState(frame: number): CoordState {
  return { claim: frame >= E.fly + E.flyDur - 2 && frame < E.approved + 20, tooltip: false, pressed: frame >= E.approve - 1 && frame < E.approve + 5, active: 12, bar: true }
}

export function Market() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const twins = useSheets(() => {
    const button = (state: ClaimState) => sheet(BTN.width, BTN.height, 4, (c) => drawClaimButton(c, BTN.dx, BTN.dy, state))
    return {
      lock: sheet(SCREEN.width, SCREEN.height, 3, (c) => drawLockScreen(c, lockState(255, lang))),
      base: sheet(SCREEN.width, SCREEN.height, 3, (c) => drawMarketBase(c, '08:45')),
      list: sheet(SCREEN.width, MARKET_LIST_HEIGHT, 3, drawMarketList),
      buttons: { claim: button('claim'), processing: button('processing'), pending: button('pending'), assigned: button('assigned') } as Record<ClaimState, HTMLCanvasElement | null>,
      flying: sheet(MARKET_CARD.width, MARKET_CARD.height, 3, (c) => {
        drawMarketHeroCard(c)
        drawClaimButton(c, MARKET_CARD.width - 16 - CLAIM.width, 146, 'pending')
      }),
      shifts: sheet(SCREEN.width, SCREEN.height, 3, (c) => drawMyShifts(c, '09:00')),
    }
  })
  const coordNow = coordState(frame)
  const dashboard = useLive(PANEL.width, PANEL.height, 2.6, (c) => drawCoordDashboard(c, coordNow), JSON.stringify(coordNow))
  const region = useLive(PANEL.width, PANEL.height, 5.5, (c) => drawCoordDashboard(c, coordNow), JSON.stringify(coordNow), REGION)

  const camera = viewAt(CAMERA, frame)
  const deck = easeInOut(span(frame, E.deck, 26))
  const scroll = scrollAt(frame)
  const state = claimState(frame)
  const card = cardAt(frame)
  const pulse = pulseAt(frame)
  const flip = spring(frame, E.flip, SPRINGS.pop)
  const leave = easeIn(span(frame, MARKET_LEAVE, 18))

  const cursor = cursorAt(CURSOR, frame, [E.approve], E.approve + 18)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [kx, ky] = camera.project(CLICK.x, CLICK.y)

  /* Кнопка заявки: смена состояния — м-статус (старое вверх, новое снизу). */
  const swapPending = easeInOut(span(frame, E.pending, 10))
  const swapAssigned = easeInOut(span(frame, E.pulse + E.pulseDur, 10))
  const buttonFace = (s: ClaimState) => <Painted source={twins.buttons[s]} style={{ inset: 0, opacity: s === 'processing' ? 0.72 + 0.28 * Math.sin(frame * 0.5) : 1 }} />
  const press = frame >= E.tap && frame < E.tap + 6 ? 1 - 0.06 * Math.sin((Math.PI * (frame - E.tap)) / 6) : 1
  const buttonRect: Rect = { x: BUTTON_LIST.x - BTN.dx, y: BUTTON_LIST.y - BTN.dy, width: BTN.width, height: BTN.height }
  const buttonNode =
    state === 'claim' || state === 'processing' ? (
      <div style={{ position: 'absolute', left: buttonRect.x, top: buttonRect.y, width: buttonRect.width, height: buttonRect.height, transform: `scale(${press})`, transformOrigin: '80% 50%' }}>{buttonFace(state)}</div>
    ) : frame < E.pulse + E.pulseDur ? (
      <Swap t={swapPending} rect={buttonRect} from={buttonFace('processing')} to={buttonFace('pending')} />
    ) : (
      <Swap t={swapAssigned} rect={buttonRect} from={buttonFace('pending')} to={buttonFace('assigned')} />
    )

  const marketFace = (
    <div style={{ position: 'absolute', inset: 0, background: IA.gray50 }}>
      <Painted source={twins.base} style={{ inset: 0 }} />
      <div style={{ position: 'absolute', left: 0, top: MARKET_LIST.y, width: SCREEN.width, height: MARKET_LIST.height, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: -scroll, width: SCREEN.width, height: MARKET_LIST_HEIGHT }}>
          <Painted source={twins.list} style={{ inset: 0 }} />
          {buttonNode}
        </div>
      </div>
    </div>
  )

  const approvedFlash = Math.sin(Math.PI * clamp01(span(frame, E.approved, 24)))
  const rowGone = easeIn(span(frame, E.approved + 14, 8))

  /* Звук: экран блокировки уходит в стопку, биржа выезжает; кнопка —
     «Oczekuje na zatwierdzenie» (статус); заявка летит в пульт и садится
     строкой; строка одобрена и уходит; зелёный импульс летит обратно —
     «Już przypisany» (успех); напоминание iOS. Касания, клики, переворот,
     подсказка и тосты — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const buttonAt = at(...phonePt(PHONE, BUTTON_AT.x, BUTTON_AT.y))
  useSoundCue('air', E.deck, at(...centerOf(phoneRect(PHONE, { x: 0, y: 0, ...SCREEN }))), { gain: 0.5, seconds: 0.8 })
  useSoundCue('toggle', E.pending, buttonAt, { gain: 0.7 })
  useSoundTrack('hr2d-claim-fly', 'whoosh', frame >= E.fly && frame <= E.fly + E.flyDur, at(card.x, card.y), { gain: 0.6 })
  useSoundCue('thump', E.fly + E.flyDur - 2, at(...centerOf(ROW)), { gain: 0.6 })
  useSoundCue('popOut', E.approved + 14, at(...centerOf(ROW)), { gain: 0.45 })
  useSoundTrack('hr2d-approve-pulse', 'whoosh', frame >= E.pulse && frame <= E.pulse + E.pulseDur, at(pulse.x, pulse.y), { gain: 0.55 })
  useSoundCue('success', E.pulse + E.pulseDur, buttonAt, { gain: 0.9 })
  useSoundCue('notify', E.banner, at(...centerOf(BANNER_RECT)), { gain: 0.9 })

  const pendingAnchor = camera.project(...phonePt(PHONE, BUTTON_AT.x - 40, BUTTON_AT.y))
  /* Обводка статуса: английская плашка «Awaiting approval» короче польской —
     рамка сжимается к ней, отступы те же. */
  const pillShort = lang === 'en' ? textWidth('Oczekuje na zatwierdzenie', 13, 500) - textWidth('Awaiting approval', 13, 500) : 0
  const heroRight = camera.project(HERO_WORLD.x + HERO_WORLD.width, 0)[0]
  const toast2Anchor = camera.project(TOAST2.x + TOAST2.width - 20, TOAST2.y + TOAST2.height / 2)
  const bannerAnchor = camera.project(BANNER_RECT.x + BANNER_RECT.width * 0.8, BANNER_RECT.y + BANNER_RECT.height * 0.6)

  return (
    <AbsoluteFill style={{ transform: `translateY(${-leave * 1250}px)`, filter: leave > 0.01 ? `blur(${leave * 14}px)` : undefined }}>
      <Camera view={camera}>
        <AppWindow url="iapply.com.pl/coordinator" width={1440} height={PAGE_H} style={{ left: PAGE.x, top: PAGE.y - CHROME }}>
          <Painted source={dashboard} style={{ inset: 0 }} />
          <div style={{ position: 'absolute', left: REGION.x * K, top: REGION.y * K, width: REGION.width * K, height: REGION.height * K }}>
            <Painted source={region} style={{ inset: 0 }} />
          </div>
          <div style={{ position: 'absolute', left: ROW.x - PAGE.x, top: ROW.y - PAGE.y, width: ROW.width, height: ROW.height, borderRadius: 12 * K, background: tint(IA.green500, 0.22 * approvedFlash), opacity: 1 - rowGone }} />
        </AppWindow>
        <HotToast x={pagePt(PAGE, 512, 0)[0]} y={TOAST2.y} at={E.approve + 2} until={E.pulse + 4} label={t('Zgłoszenie zatwierdzone', 'Claim approved')} scale={K} />
        <Handset spot={PHONE} screen={IA.gray50}>
          {frame >= 26 && (
            <Flip
              angle={180 * flip}
              perspective={2200}
              style={{ inset: 0 }}
              front={marketFace}
              back={<Painted source={twins.shifts} style={{ inset: 0 }} />}
            />
          )}
          <HotToast x={SCREEN.width / 2} y={64} at={E.toast} until={180} label={t('Zgłoszenie wysłane! Oczekiwanie na zatwierdzenie.', 'Claim sent! Awaiting coordinator approval.')} width={TOAST_W} />
          <Banner at={E.banner} until={800} />
        </Handset>
        {/* П8: экран блокировки уходит назад в стопку, биржа выезжает вперёд. */}
        {frame < 26 && (
          <>
            <div style={{ position: 'absolute', left: PHONE.x, top: PHONE.y, width: SCREEN.width, height: SCREEN.height, borderRadius: 52, overflow: 'hidden', transform: `translateY(${-deck * 170}px) scale(${mix(1, 0.72, deck)})`, opacity: 1 - easeIn(span(frame, 8, 16)), boxShadow: deck > 0.02 ? SHADOW.lifted : undefined }}>
              <Painted source={twins.lock} style={{ inset: 0 }} />
              <div style={{ position: 'absolute', inset: 0, background: '#0b0c0f', opacity: 0.35 * deck }} />
            </div>
            <div style={{ position: 'absolute', left: PHONE.x, top: PHONE.y, width: SCREEN.width, height: SCREEN.height, borderRadius: 52, overflow: 'hidden', transform: `translateY(${(1 - deck) * 420}px) scale(${mix(1.08, 1, deck)})`, opacity: easeOut(span(frame, 2, 10)), boxShadow: SHADOW.lifted }}>
              {marketFace}
            </div>
          </>
        )}
        <Swipe from={phonePt(PHONE, 196, 640)} to={phonePt(PHONE, 196, 470)} at={E.swipe} dur={16} scale={PHONE.scale} />
        <Tap x={phonePt(PHONE, BUTTON_AT.x, BUTTON_AT.y)[0]} y={phonePt(PHONE, BUTTON_AT.x, BUTTON_AT.y)[1]} at={E.tap} scale={PHONE.scale} />
        <Scribble rect={phoneRect(PHONE, { x: 110 + pillShort, y: BUTTON_AT.y - 21, width: 250 - pillShort, height: 42 })} p={easeOut(span(frame, 196, 16)) * (1 - easeIn(span(frame, E.fly - 6, 8)))} pad={[12, 8]} seed={9} width={2.4} />
        {/* Заявка летит в пульт. */}
        {frame >= E.fly - 2 && frame < E.fly + E.flyDur + 6 && (
          <div
            style={{
              position: 'absolute',
              left: card.x - HERO_WORLD.width / 2,
              top: card.y - HERO_WORLD.height / 2,
              width: HERO_WORLD.width,
              height: HERO_WORLD.height,
              borderRadius: 12,
              boxShadow: SHADOW.lifted,
              transform: `scale(${card.scale}) rotate(${Math.sin(Math.PI * card.t) * 4}deg)`,
              opacity: easeOut(span(frame, E.fly - 2, 6)) * (1 - easeIn(span(frame, E.fly + E.flyDur - 4, 10))),
            }}
          >
            <Painted source={twins.flying} style={{ inset: 0 }} />
          </div>
        )}
        <SystemTip x={TIP[0]} y={TIP[1]} at={E.tip} until={E.approve - 2} label={t('Zatwierdź', 'Approve')} scale={K} />
        {/* Импульс одобрения летит обратно в телефон. */}
        {frame >= E.pulse && frame < E.pulse + E.pulseDur + 4 && (
          <div
            style={{
              position: 'absolute',
              left: pulse.x - 30,
              top: pulse.y - 30,
              width: 60,
              height: 60,
              borderRadius: 30,
              background: IA.green600,
              boxShadow: `0 0 0 10px ${tint(IA.green500, 0.16)}, ${SHADOW.card}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${mix(0.6, 1, spring(frame, E.pulse, SPRINGS.pop)) * (1 - easeIn(span(frame, E.pulse + E.pulseDur - 2, 6)))})`,
            }}
          >
            <Glyph name="check" size={32} color="#ffffff" stroke={3} />
          </div>
        )}
        <Pulse x={PULSE_TO[0]} y={PULSE_TO[1]} at={E.pulse + E.pulseDur} until={E.pulse + E.pulseDur + 30} radius={70} color={tint(IA.green500, 0.8)} rings={2} period={24} width={2.4} />
      </Camera>
      <Callout anchor={pendingAnchor} box={{ x: heroRight + 60, y: pendingAnchor[1] - 260, width: 470 }} tag={tag(9, lang)} title={caption(9, lang)} at={200} until={292} />
      <Callout anchor={toast2Anchor} box={{ x: toast2Anchor[0] + 120, y: toast2Anchor[1] + 90, width: 520 }} tag={tag(10, lang)} title={caption(10, lang)} at={E.approve + 18} until={E.approved + 10} />
      <Callout anchor={bannerAnchor} box={{ x: bannerAnchor[0] + 140, y: bannerAnchor[1] + 110, width: 480 }} tag={tag(11, lang)} title={caption(11, lang)} at={E.banner + 18} until={760} />
      <Ripple x={kx} y={ky} at={E.approve} />
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

/* Баннер iOS «Najbliższa zmiana» — напоминание за час до смены (PushCenter.swift:
   заголовок «Najbliższa zmiana», текст «объект · время»), как в художнике
   drawBanner, но живым стеклом (Liquid Glass): падает сверху с перелётом.
   Без имени приложения: родное приложение пока подписано маркой агентства. */
function Banner({ at, until }: { at: number; until: number }) {
  const frame = useCurrentFrame()
  const t = useT()
  if (frame < at) return null
  const enter = spring(frame, at, SPRINGS.pop)
  const leave = easeIn(span(frame, until, 8))
  return (
    <div
      style={{
        position: 'absolute',
        left: BANNER_AT.x,
        top: BANNER_AT.y,
        width: BANNER.width,
        height: BANNER.height,
        boxSizing: 'border-box',
        padding: '0 16px 0 14px',
        borderRadius: 24,
        background: 'rgba(246, 246, 249, 0.8)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 30px rgba(15, 23, 42, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT,
        color: IOS.label,
        opacity: clamp01(enter * 1.5) * (1 - leave),
        transform: `translateY(${(1 - enter) * -120 - leave * 40}px) scale(${mix(0.92, 1, clamp01(enter))})`,
        transformOrigin: '50% 0%',
      }}
    >
      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: `linear-gradient(135deg, ${IA.primary400}, ${IA.primary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={22} height={22} viewBox="-12 -12 24 24">
          <circle r={11} fill="#ffffff" />
          <path d="M0 -6.5 L0 0 L4.5 3" fill="none" stroke={IA.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t('Najbliższa zmiana', 'Next shift')}</span>
          <span style={{ fontSize: 13, color: IOS.secondary }}>{t('teraz', 'now')}</span>
        </div>
        <div style={{ fontSize: 15, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Hub Wrocław — Fulfillment · 14:00</div>
      </div>
    </div>
  )
}
