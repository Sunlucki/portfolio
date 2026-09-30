import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Connector, Icon, QrCode } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, readFrames, span, spring } from '../kit/motion'
import { Painted, canvasOf, ratioOf } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { FONT, INK, MUTED, SHADOW, lerpRect, tint, useAccent, type Rect } from '../kit/theme'
import { Deck, Lift, Swing } from '../kit/transitions'
import { PopIn, Toast } from '../kit/ui'
import { useSoundCues } from '../kit/sound'
import { SCREEN, Screen, centerOf, place, useCueList, type Cue2d } from './common'
import {
  EXPENSE,
  INVOICE,
  KSEF_BUTTON,
  KSEF_SEND,
  LIGHT,
  PRINT,
  PRINT_QR,
  caption,
  crmExpense,
  crmInvoiceList,
  crmInvoicePrint,
  crmInvoiceWizard,
  crmJpkCard,
  crmKsefCard,
  crmKsefConfirm,
  crmPdfPage,
  crmVatBadge,
  expenseLayout,
  invoiceLayout,
  tag,
  useCrmTwins,
} from './twins'

/* 16–18 · 05 Dokumenty · Фактура, KSeF, расходы и JPK. Лента фактур
   прокручивается насквозь (П14) до мастера «Nowa faktura»: в поле NIP
   печатается номер — данные приходят из Białej listy MF сами. Фактура
   уходит в KSeF, на печатной форме встаёт QR. Расход из PDF: файл падает в
   зону, поля читаются сами; цепочка Lead → … → JPK_V7M. */

const IL = invoiceLayout()
const WIZ: Rect = { x: 510, y: 60, width: 900, height: 900 * (INVOICE.height / INVOICE.width) }
const onWiz = (rect: Rect) => place(rect, INVOICE.width, WIZ)
const S1 = onWiz(IL.s1)
const S2 = onWiz(IL.s2)
const S3 = onWiz(IL.s3)
const NIP = onWiz(IL.nip)
const BADGE_ROW = onWiz(IL.badgeRow)
const PREVIEW = onWiz(IL.preview)
const TOAST_SCALE = 1.4

/* ── 16 · Мастер фактуры ─────────────────────────────────────────────────
   0–26    лента «Faktury» прокручивается насквозь с размытием (П14)
   22–32   полоса света — на месте ленты мастер «Nowa faktura»
   32–58   наезд на «Kontrahent»
   60–88   в поле NIP печатается номер (м-ввод)
   74–100  слева влетает карточка «Biała lista MF», линия к полю NIP
   100–128 «Nazwa», «Adres» заполняются; бейдж «VAT: Czynny · Biała lista MF»
           выходит из формы
   130–150 камера на бейдж (крупно); 150–232 выноска
   236–262 «Pozycje i stawki»: строки и суммы встают
   272–298 «Podgląd i wysyłka»; 304 — клик «Wystaw fakturę · 55 350,00 zł»
   308–364 тост «FV/2026/0001 wystawiona» крупно
   366–396 превью A4 растёт в печатную форму и уходит к KSeF */

const TYPE_AT = 60
const NIP_TEXT = '894-301-27-66'
const WL_CARD: Rect = { x: 110, y: NIP.y - 30, width: 330, height: 110 }
const FILL = [
  { rect: IL.name, start: 104 },
  { rect: IL.address, start: 112 },
  { rect: { ...IL.address, x: IL.address.x + IL.address.width * 0.62 + 12 * IL.k, width: IL.address.width * 0.38 - 12 * IL.k }, start: 118 },
  { rect: IL.lines[0]!, start: 238 },
  { rect: IL.lines[1]!, start: 246 },
  { rect: IL.totals, start: 254 },
]
const BADGE: Rect = { x: BADGE_ROW.x, y: BADGE_ROW.y + 2, width: BADGE_ROW.height * 0.9 * (330 / 28), height: BADGE_ROW.height * 0.9 }
/** Бейдж встаёт на своём месте (строка под NIP), чуть крупнее, с тенью. */
const BADGE_LIFT: Rect = { x: BADGE.x - BADGE.width * 0.04, y: BADGE.y - BADGE.height * 0.04, width: BADGE.width * 1.08, height: BADGE.height * 1.08 }
const ISSUE_CLICK = 304
const ISSUE: { x: number; y: number } = (() => {
  const k = WIZ.width / INVOICE.width
  return { x: WIZ.x + (IL.issue.x - 130 * IL.k) * k, y: WIZ.y + (IL.issue.y + IL.issue.height / 2) * k }
})()
const TOAST_16: Rect = { x: S3.x + S3.width - 320 * TOAST_SCALE, y: S3.y + S3.height + 30, width: 320 * TOAST_SCALE, height: 64 }
const TOAST_16_TEXT = 'FV/2026/0001 wystawiona'
const TOAST_16_HOLD = 308 + 22 + readFrames(TOAST_16_TEXT)
/** Печатная форма фактуры: сюда растёт превью, отсюда начинается станция 17. */
export const PRINT_RECT: Rect = { x: 1000, y: 64, width: 680, height: 680 * (PRINT.height / PRINT.width) }
const GROW = { start: TOAST_16_HOLD + 2, dur: 30 }

const CAMERA_16: CameraKey[] = [
  { at: 0, ...fit(WIZ, { margin: 40 }) },
  { at: 32, dur: 26, ...fit({ ...S1, x: S1.x - 330, width: S1.width + 330 }, { max: 1.6 }) },
  { at: 128, dur: 22, ...focus(BADGE_LIFT, { fill: 0.5, shift: [-250, 0] }) },
  { at: 234, dur: 26, ...fit(S2, { max: 1.6 }) },
  { at: 272, dur: 26, ...fit(S3, { max: 1.6 }) },
  { at: 310, dur: 22, ...focus(TOAST_16, { fill: 0.45 }) },
  { at: GROW.start, dur: GROW.dur, ...fit(PRINT_RECT, { margin: 50 }) },
]

export const INVOICE_END_VIEW = fit(PRINT_RECT, { margin: 50 })

export function InvoiceWizard() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const t = useT()
  const tex = useCrmTwins(() => ({
    list: canvasOf(crmInvoiceList()),
    empty: canvasOf(crmInvoiceWizard(false)),
    full: canvasOf(crmInvoiceWizard(true)),
    badge: canvasOf(crmVatBadge()),
    print: canvasOf(crmInvoicePrint(false)),
  }))
  const camera = viewAt(CAMERA_16, frame)
  const ratio = ratioOf(tex.full, INVOICE.width)
  /* П14: лента прокручивается насквозь и тормозит; полоса света — мастер. */
  const scroll = easeOut(span(frame, 0, 26))
  const blur = 14 * (1 - easeOut(span(frame, 4, 20)))
  const sweep = span(frame, 20, 14)
  const wizardIn = frame >= 26
  const typed = Math.max(0, Math.min(NIP_TEXT.length, Math.floor((frame - TYPE_AT) / 2) + 1))
  const wl = spring(frame, 74, SPRINGS.pop)
  const badgeUp = spring(frame, 122, SPRINGS.pop)
  const grow = glide(span(frame, GROW.start, GROW.dur))
  const sheet = lerpRect(PREVIEW, PRINT_RECT, grow)
  const k = WIZ.width / INVOICE.width
  const [ax, ay] = camera.project(BADGE_LIFT.x + BADGE_LIFT.width * 0.9, BADGE_LIFT.y + BADGE_LIFT.height * 0.5)

  /* Звук: полоса света открывает мастер; NIP печатается (клавиша на знак);
     карточка Białej listy влетает; поля и суммы встают; бейдж «VAT: Czynny» —
     данные подтверждены; превью растёт в печатную форму. Прокрутку насквозь
     озвучивает уход станции 15; линия, бейдж, клик, тост и выноска звучат сами. */
  useCueList([
    [20, 'glint', centerOf(WIZ, camera.project), 0.4, 0.5],
    [74, 'whoosh', centerOf(WL_CARD, camera.project), 0.45, 0.4],
    ...FILL.map(({ rect, start }): Cue2d => [start, 'tick', centerOf(onWiz(rect), camera.project), 0.45]),
    [124, 'success', centerOf(BADGE, camera.project), 0.8],
    [GROW.start, 'whoosh', centerOf(PRINT_RECT, camera.project), 0.5, 1],
  ])
  const [nipX, nipY] = centerOf(NIP, camera.project)
  useSoundCues('key', Array.from(NIP_TEXT, (_, i) => TYPE_AT + i * 2), { x: nipX, y: nipY }, { gain: 0.8 })

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <Screen rect={WIZ} radius={20}>
          {!wizardIn && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: -WIZ.height * (1 - scroll), height: WIZ.height * 2, filter: `blur(${blur * 0.25}px)` }}>
              <Painted source={tex.list} style={{ left: 0, top: 0, width: WIZ.width, height: WIZ.height }} />
              <Painted source={tex.list} crop={{ x: 0, y: 0, width: INVOICE.width, height: INVOICE.height }} ratio={ratioOf(tex.list, INVOICE.width)} style={{ left: 0, top: WIZ.height, width: WIZ.width, height: WIZ.height }} />
            </div>
          )}
          {wizardIn && <Painted source={tex.empty} style={{ inset: 0 }} />}
          {wizardIn &&
            FILL.map(({ rect, start }, i) => {
              if (frame < start) return null
              const p = easeInOut(span(frame, start, 10))
              return (
                <div key={i} style={{ position: 'absolute', left: rect.x * k, top: rect.y * k, width: rect.width * k, height: rect.height * k, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, background: LIGHT.card }}>
                  <Painted source={tex.full} crop={rect} ratio={ratio} style={{ inset: 0 }} />
                </div>
              )
            })}
          {/* NIP: поле в фокусе, номер печатается. */}
          {wizardIn && frame >= TYPE_AT - 4 && (
            <div style={{ position: 'absolute', left: (IL.nip.x) * k, top: (IL.nip.y) * k, width: IL.nip.width * k, height: 34 * IL.k * k, borderRadius: 8 * IL.k * k, boxShadow: `0 0 0 ${2.5}px ${tint(accent, 0.5)}`, display: 'flex', alignItems: 'center', paddingLeft: 12 * IL.k * k, fontFamily: FONT, fontSize: 13 * IL.k * k, fontWeight: 500, color: INK, background: LIGHT.card, boxSizing: 'border-box' }}>
              {NIP_TEXT.slice(0, frame >= TYPE_AT ? typed : 0)}
              <span style={{ width: 2, height: '52%', marginLeft: 2, background: accent, opacity: typed < NIP_TEXT.length || Math.floor(frame / 15) % 2 === 0 ? 1 : 0 }} />
            </div>
          )}
          {sweep > 0 && sweep < 1 && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(170deg, transparent ${mix(-30, 130, sweep) - 20}%, rgba(255, 255, 255, 0.95) ${mix(-30, 130, sweep)}%, transparent ${mix(-30, 130, sweep) + 20}%)` }} />}
        </Screen>
        {/* «Biała lista MF»: карточка источника, линия к полю NIP. */}
        {frame >= 74 && (
          <>
            <Connector from={[WL_CARD.x + WL_CARD.width, WL_CARD.y + WL_CARD.height / 2]} to={[NIP.x - 4, NIP.y + NIP.height / 2]} p={easeInOut(span(frame, 84, 14))} frame={frame} flowing={1 - span(frame, 130, 14)} />
            <SourceCard rect={WL_CARD} t={wl} icon="shieldCheck" name="Biała lista MF" hint={t('Status VAT', 'VAT whitelist status')} />
          </>
        )}
        {frame >= 120 && (
          <Lift from={BADGE} to={BADGE_LIFT} t={badgeUp * (1 - glide(span(frame, 226, 16)))} radius={8}>
            <Painted source={tex.badge} style={{ inset: 0 }} />
          </Lift>
        )}
        <Toast x={TOAST_16.x} y={TOAST_16.y} at={308} until={TOAST_16_HOLD + 4} title={t(TOAST_16_TEXT, 'Invoice FV/2026/0001 issued')} tone={LIGHT.green} scale={TOAST_SCALE} />
        {frame >= GROW.start && (
          <div style={{ position: 'absolute', left: sheet.x, top: sheet.y, width: sheet.width, height: sheet.height, borderRadius: 12, boxShadow: SHADOW.lifted, background: '#fff' }}>
            <Painted source={tex.print} style={{ inset: 0, opacity: easeOut(span(frame, GROW.start, 12)) }} />
          </div>
        )}
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 282, x: ISSUE.x + 140, y: ISSUE.y + 120 },
          { at: 300, x: ISSUE.x, y: ISSUE.y },
          { at: 322, x: ISSUE.x + 60, y: ISSUE.y + 150 },
        ]}
        clicks={[ISSUE_CLICK]}
        hide={316}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 90, y: ay + 110, width: 540 }} tag={tag(16, lang)} title={caption(16, lang)} at={150} until={228} />
    </AbsoluteFill>
  )
}

/** Карточка источника данных (наша, как на станции 06): номер, имя, что даёт. */
function SourceCard({ rect, t, icon, name, hint }: { rect: Rect; t: number; icon: IconName; name: string; hint: string }) {
  const accent = useAccent()
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: 'border-box',
        padding: '16px 20px',
        borderRadius: 22,
        background: 'rgba(255, 255, 255, 0.92)',
        boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.card}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: FONT,
        opacity: clamp01(t * 1.5),
        transform: `translateX(${(1 - t) * -200}px) scale(${mix(0.9, 1, clamp01(t))})`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 27, fontWeight: 750, color: INK, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ marginTop: 4, fontSize: 17, fontWeight: 500, color: MUTED, whiteSpace: 'nowrap' }}>{hint}</div>
      </div>
      <div style={{ width: 56, height: 56, borderRadius: 17, background: tint(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={30} color={accent} stroke={1.8} p={clamp01(t)} />
      </div>
    </div>
  )
}

/* ── 17 · KSeF: «Przyjęto», QR ──────────────────────────────────────────
   0–12    печатная форма на месте (из станции 16)
   12–36   из-за формы выезжает карточка фактуры с «Wyślij do KSeF»
   38–62   камера на карточку; 78 — клик «Wyślij do KSeF»
   80–224  «Wysłać do KSeF?» крупно, читается; 224 — клик «Wyślij»
   232–286 статус «W kolejce» → «Wysłano» → «Przyjęto», импульс к форме
   290–330 на форме — номер KSeF, QR встаёт модулями по спирали
   312–394 выноска «Faktura w KSeF z kodem QR.» */

const KSEF_CARD: Rect = { x: 170, y: 330, width: 420 * 1.45, height: 230 * 1.45 }
const KSEF_CLICK = 78
const CONFIRM: Rect = { x: KSEF_CARD.x - 10, y: KSEF_CARD.y - 40, width: 420 * 1.55, height: 200 * 1.55 }
const SEND_CLICK = 224
const STATUS_AT = [234, 252, 270]
const PRINT_SCALE = PRINT_RECT.width / PRINT.width
const QR: Rect = { x: PRINT_RECT.x + PRINT_QR.x * PRINT_SCALE, y: PRINT_RECT.y + PRINT_QR.y * PRINT_SCALE, width: PRINT_QR.size * PRINT_SCALE, height: PRINT_QR.size * PRINT_SCALE }
const QR_AREA: Rect = { x: QR.x - 30, y: PRINT_RECT.y + (170 / PRINT.height) * PRINT_RECT.height, width: PRINT_RECT.width - (QR.x - PRINT_RECT.x) + 20, height: QR.y + QR.height + 40 - (PRINT_RECT.y + (170 / PRINT.height) * PRINT_RECT.height) }

const CAMERA_17: CameraKey[] = [
  { at: 0, ...INVOICE_END_VIEW },
  { at: 30, dur: 26, ...fit({ x: KSEF_CARD.x - 40, y: PRINT_RECT.y, width: PRINT_RECT.x + PRINT_RECT.width - KSEF_CARD.x + 80, height: PRINT_RECT.height }, { margin: 40 }) },
  { at: 60, dur: 22, ...focus(KSEF_CARD, { fill: 0.45 }) },
  { at: 84, dur: 22, ...focus(CONFIRM, { fill: 0.5 }) },
  { at: SEND_CLICK + 4, dur: 24, ...focus(KSEF_CARD, { fill: 0.45 }) },
  { at: 284, dur: 26, ...fit(QR_AREA, { max: 1.5, shift: [-160, 0] }) },
]

export function KsefSend() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const tex = useCrmTwins(() => ({
    print: canvasOf(crmInvoicePrint(false)),
    accepted: canvasOf(crmInvoicePrint(true)),
    cards: ([0, 1, 2, 3] as const).map((state) => canvasOf(crmKsefCard(state))),
    confirm: canvasOf(crmKsefConfirm()),
  }))
  const camera = viewAt(CAMERA_17, frame)
  const slide = spring(frame, 12, SPRINGS.pop)
  const state = frame >= STATUS_AT[2]! ? 3 : frame >= STATUS_AT[1]! ? 2 : frame >= STATUS_AT[0]! ? 1 : 0
  const pulse = span(frame, STATUS_AT[0]!, 50)
  const accepted = frame >= 292
  const cardRect: Rect = { ...KSEF_CARD, x: mix(PRINT_RECT.x + 40, KSEF_CARD.x, clamp01(slide)) + (slide - clamp01(slide)) * 60 }
  const button = { x: KSEF_CARD.x + KSEF_BUTTON.x * KSEF_CARD.width, y: KSEF_CARD.y + KSEF_BUTTON.y * KSEF_CARD.height }
  const send = { x: CONFIRM.x + KSEF_SEND.x * CONFIRM.width, y: CONFIRM.y + KSEF_SEND.y * CONFIRM.height }
  const [ax, ay] = camera.project(QR.x + QR.width * 0.9, QR.y + QR.height * 0.12)

  /* Звук: карточка выезжает из-за формы; «W kolejce» → «Wysłano» → «Przyjęto»;
     на форме — номер KSeF. Клики, плита, импульс и QR звучат сами. */
  const card = centerOf(KSEF_CARD, camera.project)
  useCueList([
    [12, 'popIn', card, 0.55],
    [STATUS_AT[0]!, 'tick', card, 0.5],
    [STATUS_AT[1]!, 'tick', card, 0.5],
    [STATUS_AT[2]!, 'success', card, 0.85],
    [292, 'glint', camera.project(PRINT_RECT.x + PRINT_RECT.width / 2, PRINT_RECT.y + PRINT_RECT.height * 0.2), 0.4, 0.6],
  ])

  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <div style={{ position: 'absolute', left: cardRect.x, top: cardRect.y, width: cardRect.width, height: cardRect.height, borderRadius: 18, boxShadow: SHADOW.lifted, opacity: frame < 12 ? 0 : 1 }}>
          <Painted source={tex.cards[state] ?? null} style={{ inset: 0 }} />
        </div>
        <div style={{ position: 'absolute', left: PRINT_RECT.x, top: PRINT_RECT.y, width: PRINT_RECT.width, height: PRINT_RECT.height, borderRadius: 12, boxShadow: SHADOW.lifted, background: '#fff' }}>
          <Painted source={tex.print} style={{ inset: 0 }} />
          <Painted source={tex.accepted} style={{ inset: 0, opacity: easeOut(span(frame, 292, 10)) }} />
          {accepted && <div style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: `0 0 0 ${3 * Math.sin(Math.PI * clamp01(span(frame, 292, 22)))}px ${tint(LIGHT.green, 0.45)}` }} />}
        </div>
        {/* Импульс: фактура уходит в MF и возвращается с номером. */}
        {pulse > 0 && pulse < 1 && (
          <Connector from={[KSEF_CARD.x + KSEF_CARD.width, KSEF_CARD.y + KSEF_CARD.height * 0.4]} to={[PRINT_RECT.x, PRINT_RECT.y + PRINT_RECT.height * 0.16]} p={easeInOut(span(frame, STATUS_AT[0]!, 16))} frame={frame} flowing={1 - span(frame, STATUS_AT[2]! + 10, 14)} period={24} />
        )}
        <QrCode x={QR.x} y={QR.y} size={QR.width} at={296} dur={24} color="#15171a" />
        <PopIn rect={CONFIRM} background={LIGHT.card} at={KSEF_CLICK + 2} until={SEND_CLICK + 2} radius={14 * 1.55}>
          <Painted source={tex.confirm} style={{ inset: 0 }} />
        </PopIn>
      </Camera>
      <CursorPath
        view={camera}
        keys={[
          { at: 60, x: button.x + 120, y: button.y + 150 },
          { at: 76, x: button.x, y: button.y },
          { at: 200, x: send.x + 110, y: send.y + 110 },
          { at: 220, x: send.x, y: send.y },
          { at: 240, x: send.x + 80, y: send.y + 170 },
        ]}
        clicks={[KSEF_CLICK, SEND_CLICK]}
        hide={236}
      />
      <Callout anchor={[ax, ay]} box={{ x: ax + 120, y: ay - 220, width: lang === 'en' ? 610 : 520 }} tag={tag(17, lang)} title={caption(17, lang)} at={312} until={394} />
    </AbsoluteFill>
  )
}

/* ── 18 · Koszt z pliku → JPK_V7M ───────────────────────────────────────
   0–24    мастер «Nowy koszt z pliku» въезжает каруселью
   24–54   сверху падает PDF поставщика и ложится в зону
   54–96   «Odczyt dokumentu i rozpoznawanie pól…»: по PDF идёт сканер
   96–118  «Sprawdź i dodaj»: PDF уходит в превью, поля заполнены
   118–176 камера на поля, читается; 196 — клик «Dodaj fakturę»
   200–260 тост «Faktura FV/0931/09/2026 dodana i zaksięgowana» крупно
   262–330 цепочка Lead → Oferta → Faktura → Księgowanie → JPK_V7M (камера
           следует за её концом); на последнем узле — карточка «JPK_V7M»
   330–412 выноска «Koszty z PDF. JPK_V7M jednym plikiem.»
   459–485 уход в колоду (П8), снизу въезжают ноутбук и телефон станции 19.
           В раскадровке здесь П13 (ноутбук закрывается, камера облетает его) —
           облёт камерой в 2D-версии запрещён, поэтому колода, как у 10 → 11 */

export const EXPENSE_BEATS = 31

const EL = expenseLayout()
const ZONE = place(EL.zone, EXPENSE.width)
const PREVIEW_18 = place(EL.preview, EXPENSE.width)
/** PDF ложится в левую часть зоны: подпись «Odczyt dokumentu…» по центру видна. */
const PDF_IN_ZONE: Rect = (() => {
  const height = ZONE.height * 0.86
  const width = height * (700 / 990)
  return { x: ZONE.x + ZONE.width * 0.07, y: ZONE.y + (ZONE.height - height) / 2, width, height }
})()
const PDF_PREVIEW: Rect = (() => {
  const width = PREVIEW_18.width
  const height = width * (990 / 700)
  return { x: PREVIEW_18.x, y: PREVIEW_18.y, width, height: Math.min(height, PREVIEW_18.height) }
})()
const FIELDS: Rect = place({ x: EL.pad + 60 * EL.k, y: 110 * EL.k, width: EL.preview.x - EL.pad - 80 * EL.k, height: 430 * EL.k }, EXPENSE.width)
const ADD_CLICK = 196
const ADD_AT = place({ x: EL.add.x - 60 * EL.k, y: EL.add.y + 17 * EL.k, width: 1, height: 1 }, EXPENSE.width)
const TOAST_18: Rect = { x: SCREEN.x + SCREEN.width - 28 - 360 * TOAST_SCALE, y: SCREEN.y + SCREEN.height - 28 - 64, width: 360 * TOAST_SCALE, height: 64 }
const TOAST_18_TEXT = 'Faktura FV/0931/09/2026 dodana i zaksięgowana'
const TOAST_18_HOLD = 200 + 22 + readFrames(TOAST_18_TEXT)
const CHAIN: { label: string; en: string; icon: IconName }[] = [
  { label: 'Lead', en: 'Lead', icon: 'userPlus' },
  { label: 'Oferta', en: 'Quote', icon: 'fileText' },
  { label: 'Faktura', en: 'Invoice', icon: 'receipt' },
  { label: 'Księgowanie', en: 'Accounting', icon: 'listChecks' },
]
const NODE = { width: 300, height: 110 }
const CHAIN_Y = 1400
const NODES: Rect[] = CHAIN.map((_, i) => ({ x: 300 + i * 390, y: CHAIN_Y - NODE.height / 2 + (i % 2 === 0 ? -40 : 40), width: NODE.width, height: NODE.height }))
const JPK: Rect = { x: 300 + 4 * 390, y: CHAIN_Y - (330 * 1.5) / 2, width: 420 * 1.5, height: 330 * 1.5 }
const CHAIN_START = TOAST_18_HOLD + 2
const NODE_AT = (i: number) => CHAIN_START + 10 + i * 14
const JPK_AT = NODE_AT(4)

const CAMERA_18: CameraKey[] = [
  { at: 0, ...fit(SCREEN, { max: 1.1, margin: 70 }) },
  { at: 104, dur: 24, ...fit(FIELDS, { max: 1.55, shift: [60, 0] }) },
  { at: 180, dur: 18, ...fit(SCREEN, { max: 1.1, margin: 70 }) },
  { at: 202, dur: 22, ...focus(TOAST_18, { fill: 0.5 }) },
  { at: CHAIN_START, dur: 20, follow: follow((f) => { const i = Math.min(4, Math.max(0, (f - CHAIN_START - 10) / 14)); return [mix(NODES[0]!.x + 150, JPK.x + JPK.width / 2, i / 4) - 200, CHAIN_Y] }, { zoom: 1.05, lag: 10 }) },
  { at: JPK_AT + 10, dur: 26, ...fit({ x: NODES[2]!.x, y: JPK.y - 20, width: JPK.x + JPK.width - NODES[2]!.x, height: JPK.height + 40 }, { max: 1.3, margin: 80 }) },
]

export function ExpenseJpk() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const t = useT()
  const tex = useCrmTwins(() => ({
    steps: ([0, 1, 2] as const).map((step) => canvasOf(crmExpense(step))),
    pdf: canvasOf(crmPdfPage()),
    jpk: canvasOf(crmJpkCard()),
  }))
  const camera = viewAt(CAMERA_18, frame)
  const enter = spring(frame, 0, SPRINGS.heavy)
  const drop = easeIn(span(frame, 24, 22))
  const landed = frame >= 46
  const step = frame >= 96 ? 2 : frame >= 50 ? 1 : 0
  const scan = span(frame, 56, 36)
  const toPreview = glide(span(frame, 96, 20))
  const pdfRect = frame < 46 ? { ...PDF_IN_ZONE, y: mix(-900, PDF_IN_ZONE.y, drop) } : lerpRect(PDF_IN_ZONE, PDF_PREVIEW, toPreview)
  const zoneFlash = Math.sin(Math.PI * clamp01(span(frame, 46, 14)))
  const add = { x: ADD_AT.x, y: ADD_AT.y }
  const [ax, ay] = camera.project(JPK.x + JPK.width * 0.1, JPK.y + JPK.height * 0.12)
  const leave = glide(span(frame, EXPENSE_BEATS * 15 - 6, 26))

  /* Звук: PDF падает в зону; сканер; поля прочитаны; узлы цепочки
     выскакивают; JPK_V7M готов. Карусель, клик, тост, линии и выноска звучат
     сами. */
  useCueList([
    [30, 'whoosh', camera.project(PDF_IN_ZONE.x + PDF_IN_ZONE.width / 2, PDF_IN_ZONE.y - 200), 0.4, 0.55],
    [46, 'thump', centerOf(PDF_IN_ZONE, camera.project), 0.85],
    [56, 'glint', centerOf(PDF_IN_ZONE, camera.project), 0.4, 1.2],
    [96, 'layers', centerOf(FIELDS, camera.project), 0.45, 0.8],
    ...NODES.map((rect, i): Cue2d => [NODE_AT(i), 'popIn', centerOf(rect, camera.project), 0.45]),
    [JPK_AT, 'success', centerOf(JPK, camera.project), 0.85],
  ])

  return (
    <AbsoluteFill>
      <Deck t={leave}>
      <Swing t={1 - enter}>
        <Camera view={camera}>
          <Screen rect={SCREEN} source={tex.steps[step] ?? null}>
            <div style={{ position: 'absolute', left: ZONE.x - SCREEN.x, top: ZONE.y - SCREEN.y, width: ZONE.width, height: ZONE.height, borderRadius: 28, boxShadow: `0 0 0 ${4 * zoneFlash}px ${tint(accent, 0.45 * zoneFlash)}` }} />
          </Screen>
          {frame >= 22 && frame < 118 && (
            <div style={{ position: 'absolute', left: pdfRect.x, top: pdfRect.y, width: pdfRect.width, height: pdfRect.height, borderRadius: 10, boxShadow: SHADOW.lifted, transform: `rotate(${(1 - drop) * -8 + (landed ? 0 : 0)}deg)`, overflow: 'hidden' }}>
              <Painted source={tex.pdf} style={{ inset: 0 }} />
              {scan > 0 && scan < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 60, marginTop: -60, background: `linear-gradient(180deg, transparent, ${tint(accent, 0.32)})`, borderBottom: `3px solid ${tint(accent, 0.8)}` }} />}
            </div>
          )}
          <Toast x={TOAST_18.x} y={TOAST_18.y} at={200} until={TOAST_18_HOLD + 4} title={t(TOAST_18_TEXT, 'FV/0931/09/2026 added and booked')} tone={LIGHT.green} scale={TOAST_SCALE} />
          {/* Цепочка: от лида до JPK — одна база, ничего не переписывается. */}
          {NODES.map((rect, i) => {
            const at = NODE_AT(i)
            const pop = spring(frame, at, SPRINGS.pop)
            const next = i < NODES.length - 1 ? NODES[i + 1]! : JPK
            return (
              <div key={i}>
                <Connector from={[rect.x + rect.width, rect.y + rect.height / 2]} to={[next.x, i < NODES.length - 1 ? next.y + next.height / 2 : CHAIN_Y]} p={easeInOut(span(frame, at + 6, 12))} frame={frame} flowing={1} period={30} />
                <ChainNode rect={rect} t={pop} icon={CHAIN[i]!.icon} label={t(CHAIN[i]!.label, CHAIN[i]!.en)} />
              </div>
            )
          })}
          {frame >= JPK_AT && (
            <div style={{ position: 'absolute', left: JPK.x, top: JPK.y, width: JPK.width, height: JPK.height, borderRadius: 20, boxShadow: SHADOW.lifted, opacity: clamp01(spring(frame, JPK_AT, SPRINGS.pop) * 1.5), transform: `scale(${mix(0.86, 1, clamp01(spring(frame, JPK_AT, SPRINGS.pop)))})` }}>
              <Painted source={tex.jpk} style={{ inset: 0 }} />
            </div>
          )}
        </Camera>
        <CursorPath
          view={camera}
          keys={[
            { at: 178, x: add.x + 150, y: add.y - 160 },
            { at: 194, x: add.x, y: add.y },
            { at: 214, x: add.x + 70, y: add.y + 150 },
          ]}
          clicks={[ADD_CLICK]}
          hide={208}
        />
        <Callout anchor={[ax, ay]} box={{ x: ax - 60 - 600, y: ay - 70, width: 600 }} tag={tag(18, lang)} title={caption(18, lang)} at={JPK_AT + 36} until={JPK_AT + 118} />
      </Swing>
      </Deck>
    </AbsoluteFill>
  )
}

/** Узел цепочки — наш: иконка контуром и имя раздела. */
function ChainNode({ rect, t, icon, label }: { rect: Rect; t: number; icon: IconName; label: string }) {
  const accent = useAccent()
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: 'border-box',
        padding: '0 26px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.94)',
        boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.card}`,
        fontFamily: FONT,
        opacity: clamp01(t * 1.5),
        transform: `scale(${mix(0.8, 1, clamp01(t))}) translateY(${(1 - clamp01(t)) * 30}px)`,
      }}
    >
      <div style={{ width: 60, height: 60, borderRadius: 18, background: tint(accent, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={32} color={accent} stroke={1.8} p={clamp01(t)} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 750, color: INK, letterSpacing: '-0.02em' }}>{label}</div>
    </div>
  )
}
