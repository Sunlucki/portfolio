import type { ReactNode } from 'react'
import { useLang, useT } from '../../kit/lang'
import { clamp01 } from '../../kit/motion'
import { NIP } from '../data'
import { Brand, Btn, Dot, G, L, Mask, P, R, SCREEN, T, buttonWidth, tw } from '../twin'

/* Регистрация контрагента (src/pages/B2BResellerPage.tsx): оранжевый экран
   #fc5000 с белыми точками, знак, круг «закрыть»; шаг 1 — «Rejestracja», белая
   пилюля «PL | NIP» и чёрная «POBIERZ DANE»; шаги 2–4 с цепочкой; экран успеха
   и тетрис ожидания. Раскладка — художника (REG1, regStepLayout, SUCCESS,
   TETRIS), у шага 2 кнопки опущены ниже галочки: у художника они наезжали. */

const W = SCREEN.w
const H = SCREEN.h
const INK = 'rgba(7,6,7,1)'

/** Шаг 1 (REG1 художника). */
export const REG1 = {
  top: 269,
  pill: { x: 224, y: 377, w: 390, h: 60 },
  input: { x: 289, y: 377, w: 313, h: 60 },
  button: { x: 626, y: 377, w: 174, h: 60 },
  status: { x: 224, y: 447, w: 576, h: 30 },
}

/** Фон: оранжевый, точки 18% (radial-gradient 2 px, шаг 26), шапка со знаком. */
export function RegBackground({ dots = 1, header = 1 }: { dots?: number; header?: number }) {
  return (
    <g>
      <defs>
        <pattern id="b2b-reg-dots" x={0} y={0} width={26} height={26} patternUnits="userSpaceOnUse">
          <circle cx={13} cy={13} r={2} fill="#ffffff" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={L.brand} />
      <rect x={0} y={0} width={W} height={H} fill="url(#b2b-reg-dots)" opacity={0.18 * dots} />
      <g opacity={header}>
        <Brand x={56} y={52} s={19} first="#ffffff" second="#ffffff" />
        <Dot cx={W - 76} cy={45} r={19.5} stroke="rgba(255,255,255,0.5)" />
        <G n="x" x={W - 84} y={37} s={16} c="#ffffff" />
      </g>
    </g>
  )
}

/** Кнопка «POBIERZ DANE»: в загрузке — крутится Loader2. */
export function FetchButton({ busy, spin = 0, press = 1 }: { busy: boolean; spin?: number; press?: number }) {
  const t = useT()
  const b = REG1.button
  const label = t('POBIERZ DANE', 'FETCH DATA')
  const width = tw(label, 14, 700, 0.84)
  const content = width + (busy ? 24 : 0)
  const x = b.x + (b.w - content) / 2
  return (
    <g transform={`translate(${b.x + b.w / 2} ${b.y + b.h / 2}) scale(${press}) translate(${-b.x - b.w / 2} ${-b.y - b.h / 2})`}>
      <R x={b.x} y={b.y} w={b.w} h={b.h} r={b.h / 2} fill={L.ink} />
      {busy && (
        <g transform={`rotate(${spin} ${x + 8} ${b.y + b.h / 2})`}>
          <path d={arc(x + 8, b.y + b.h / 2, 7, -0.2 * Math.PI, 1.3 * Math.PI)} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      <T x={x + (busy ? 24 : 0)} y={b.y + b.h / 2 + 5} s={14} w={700} c="#ffffff" ls={0.84}>
        {label}
      </T>
    </g>
  )
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`
}

/** Шаг 1: заголовок, пилюля «PL | NIP», кнопка и строка статуса. typed —
    сколько знаков NIP уже напечатано; show — появление частей (0…1). */
export function RegStep1({ typed, caret, busy, spin, press, status, show = [1, 1, 1] }: { typed: number; caret: boolean; busy: boolean; spin: number; press?: number; status: ReactNode; show?: [number, number, number] }) {
  const p = REG1.pill
  const i = REG1.input
  const value = NIP.slice(0, typed)
  const valueWidth = tw(value, 18, 500, 0.5)
  const pop = (k: number) => ({ opacity: clamp01(k * 1.4), transform: `translate(0px, ${(1 - clamp01(k)) * 18}px)` })
  const t = useT()
  return (
    <g>
      <g style={pop(show[0])}>
        <T x={W / 2} y={REG1.top + 72 * 0.8} s={72} w={900} c="#ffffff" a="middle" ls={-72 * 0.03}>
          {t('Rejestracja', 'Registration')}
        </T>
      </g>
      <g style={pop(show[1])}>
        <R x={p.x} y={p.y} w={p.w} h={p.h} r={p.h / 2} fill="#ffffff" />
        <T x={p.x + 24} y={p.y + 37} s={18} w={700} c="rgba(7,6,7,0.6)">
          PL
        </T>
        <rect x={p.x + 64} y={p.y + 18} width={1} height={24} fill="rgba(7,6,7,0.15)" />
        {value ? (
          <T x={i.x + 16} y={i.y + 37} s={18} w={500} c={INK} ls={0.5}>
            {value}
          </T>
        ) : (
          <T x={i.x + 16} y={i.y + 37} s={18} c="rgba(7,6,7,0.35)">
            {t('NIP powinien zawierać 10 cyfr', 'NIP should contain 10 digits')}
          </T>
        )}
        {caret && <rect x={i.x + 18 + valueWidth} y={i.y + 18} width={2} height={24} rx={1} fill={L.brand} />}
      </g>
      <g style={pop(show[2])}>
        <FetchButton busy={busy} spin={spin} press={press} />
      </g>
      {status}
    </g>
  )
}

/** Строка статуса под пилюлей (белая 80%, по центру). */
export function RegStatus({ text, o = 1, dy = 0, icon }: { text: string; o?: number; dy?: number; icon?: number }) {
  const s = REG1.status
  const width = tw(text, 14, 400)
  const x = W / 2 - width / 2 + (icon !== undefined ? 12 : 0)
  return (
    <g opacity={o} transform={`translate(0 ${dy})`}>
      {icon !== undefined && <G n="circleCheck" x={x - 24} y={s.y + s.h / 2 - 8 + 2} s={16} c="#ffffff" p={icon} />}
      <T x={x} y={s.y + s.h / 2 + 7} s={14} c="rgba(255,255,255,0.85)">
        {text}
      </T>
    </g>
  )
}

/* ── Шаги 2–4 ──────────────────────────────────────────────────────────── */

export const STEPS = ['NIP i weryfikacja', 'Dane firmy', 'Osoba kontaktowa', 'Telefon i e-mail']
const STEPS_EN = ['NIP & verification', 'Company details', 'Contact person', 'Phone & email']

/** Раскладка шага 2: заголовок, подсказка, блок «Dane firmy», галочка, кнопки. */
export const STEP2 = {
  trail: { x: 176, y: 132 },
  title: 214,
  hint: 246,
  block: { x: 176, y: 262, w: 672, h: 230 },
  name: { x: 176, y: 284, w: 672, h: 56 },
  address: { x: 176, y: 380, w: 672, h: 110 },
  check: { x: 176, y: 508 },
  controls: 548,
}

/** Подписи основных кнопок шагов по-английски (b2bReseller.controls движка). */
export const PRIMARY_EN: Record<string, string> = { 'POTWIERDZAM DANE': 'CONFIRM DATA', DALEJ: 'NEXT', 'ZAREJESTRUJ SIĘ': 'REGISTER' }

/** Кнопка шага справа внизу. */
export function primaryRect(label: string, controls: number) {
  const w = buttonWidth(label, { size: 14, weight: 700, tracking: 0.84, px: 32 })
  return { x: 848 - w, y: controls + 18, w, h: 50 }
}

/** Цепочка шагов 1–4 (StepTrail): текущий кружок залит белым. fill — доля
    заливки кружка current (м-прогресс). */
export function RegTrail({ current, x, y, fill = 1 }: { current: number; x: number; y: number; fill?: number }) {
  const lang = useLang()
  let cx = x
  return (
    <g>
      {(lang === 'en' ? STEPS_EN : STEPS).map((label, index) => {
        const active = index + 1 === current
        const done = index + 1 < current
        const circleX = cx + 12
        const textX = cx + 32
        const width = tw(label, 12, 700, 0.96, true)
        cx += 32 + width + 12
        return (
          <g key={label}>
            <Dot cx={circleX} cy={y + 12} r={11.5} fill={done ? 'rgba(255,255,255,0.18)' : undefined} stroke="rgba(255,255,255,0.4)" />
            {active && <Dot cx={circleX} cy={y + 12} r={12 * fill} fill="#ffffff" />}
            <T x={circleX} y={y + 16} s={11} w={700} c={active && fill > 0.5 ? L.brand : 'rgba(255,255,255,0.7)'} a="middle">
              {index + 1}
            </T>
            <T x={textX} y={y + 16.5} s={12} w={700} c={active ? '#ffffff' : 'rgba(255,255,255,0.45)'} up ls={0.96}>
              {label}
            </T>
          </g>
        )
      })}
    </g>
  )
}

/** Метка поля (LABEL продукта): белая 75%, капитель. */
const Label = ({ x, y, children }: { x: number; y: number; children: string }) => (
  <T x={x + 24} y={y + 13} s={13} w={700} c="rgba(255,255,255,0.75)" up ls={1.04}>
    {children}
  </T>
)

/** Блок «Dane firmy»: поля заполняются слева направо (name, address — 0…1),
    данные фирмы замаскированы. Рисуется в координатах блока (0, 0). */
export function CompanyFields({ name = 1, address = 1, caret }: { name?: number; address?: number; caret?: string }) {
  const nameW = 672
  const reveal = (p: number, w: number) => `inset(0 ${(1 - clamp01(p)) * w}px 0 0)`
  const t = useT()
  return (
    <g>
      <Label x={0} y={0}>
        {t('Nazwa firmy *', 'Company name *')}
      </Label>
      <R x={0} y={22} w={nameW} h={56} r={28} fill="#ffffff" />
      <g style={{ clipPath: reveal(name, nameW - 24) }}>
        <Mask x={24} y={22 + 19} w={240} h={18} c="rgba(7,6,7,0.16)" />
        <T x={24 + 250} y={22 + 34} s={17} w={500} c={INK}>
          sp. z o.o.
        </T>
      </g>
      {caret && name > 0 && name < 1 && <rect x={24 + (nameW - 48) * name * 0.55} y={22 + 16} width={2} height={24} rx={1} fill={caret} />}
      <Label x={0} y={96}>
        {t('Adres firmy *', 'Company address *')}
      </Label>
      <R x={0} y={118} w={nameW} h={110} r={28} fill="#ffffff" />
      <g style={{ clipPath: reveal(address, nameW - 24) }}>
        <Mask x={24} y={140} w={300} h={18} c="rgba(7,6,7,0.16)" />
        <T x={24} y={196} s={17} w={500} c={INK}>
          60-001
        </T>
        <Mask x={90} y={183} w={150} h={18} c="rgba(7,6,7,0.16)" />
      </g>
      {caret && address > 0 && address < 1 && <rect x={24 + 300 * address} y={137} width={2} height={24} rx={1} fill={caret} />}
    </g>
  )
}

/** Галочка BrandCheckbox с подписью. checked — доля прорисовки галочки. */
export function BrandCheck({ x, y, text, checked = 0 }: { x: number; y: number; text: string; checked?: number }) {
  return (
    <g>
      <R x={x} y={y} w={22} h={22} r={7} fill={checked > 0 ? '#ffffff' : undefined} />
      <R x={x} y={y} w={22} h={22} r={7} stroke="#ffffff" sw={1.5} />
      {checked > 0 && <G n="check" x={x + 3} y={y + 3} s={16} c={L.brand} sw={3} p={checked} />}
      <P x={x + 34} y={y + 16} s={15} w={500} c="#ffffff" width={560} lh={20}>
        {text}
      </P>
    </g>
  )
}

/** Нижний ряд шага: линия, «WSTECZ» и основная кнопка. */
export function StepControls({ y, primary, press = 1 }: { y: number; primary: string; press?: number }) {
  const t = useT()
  /* primary — польская подпись; на английском кнопка своей ширины. */
  const label = t(primary, PRIMARY_EN[primary] ?? primary)
  const r = primaryRect(label, y)
  return (
    <g>
      <rect x={176} y={y} width={672} height={1} fill="rgba(255,255,255,0.25)" />
      <Btn label={t('WSTECZ', 'BACK')} x={176} y={y + 18} h={50} v="ghostWhite" o={{ icon: 'arrowLeft', size: 14, weight: 700, tracking: 0.84, px: 24 }} />
      <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${press}) translate(${-r.x - r.w / 2} ${-r.y - r.h / 2})`}>
        <Btn label={label} x={r.x} y={r.y} h={50} v="ink" o={{ size: 14, weight: 700, tracking: 0.84, px: 32 }} />
      </g>
    </g>
  )
}

/** Шаг 2 без блока полей (он — отдельный лист, его можно оторвать). */
export function RegStep2Frame({ hint = 1, check = 0, press = 1 }: { hint?: number; check?: number; press?: number }) {
  const t = useT()
  return (
    <g>
      <T x={176} y={STEP2.title} s={36} w={900} c="#ffffff" ls={-1.08}>
        {t('Dane firmy', 'Company details')}
      </T>
      <T x={176} y={STEP2.hint} s={13} w={700} c="rgba(255,255,255,0.7)" up ls={1.04} o={hint}>
        {t('Dane pobrane z rejestru', 'Data fetched from registry')}
      </T>
      <BrandCheck x={STEP2.check.x} y={STEP2.check.y} text={t('Inny adres do wysyłki?', 'Different shipping address?')} checked={check} />
      <StepControls y={STEP2.controls} primary="POTWIERDZAM DANE" press={press} />
    </g>
  )
}

/** Шаг 3: «Osoba kontaktowa». */
export function RegStep3({ typed = 1, press = 1 }: { typed?: number; press?: number }) {
  const y0 = 262
  const t = useT()
  return (
    <g>
      <T x={176} y={STEP2.title} s={36} w={900} c="#ffffff" ls={-1.08}>
        {t('Osoba kontaktowa', 'Contact person')}
      </T>
      <Label x={176} y={y0}>
        {t('Imię osoby kontaktowej *', 'First name *')}
      </Label>
      <R x={176} y={y0 + 22} w={672} h={56} r={28} fill="#ffffff" />
      <T x={200} y={y0 + 56} s={17} w={500} c={INK}>
        {'Anna'.slice(0, Math.round(4 * clamp01(typed * 2)))}
      </T>
      <Label x={176} y={y0 + 96}>
        {t('Nazwisko osoby kontaktowej *', 'Last name *')}
      </Label>
      <R x={176} y={y0 + 118} w={672} h={56} r={28} fill="#ffffff" />
      <g style={{ clipPath: `inset(0 ${(1 - clamp01(typed * 2 - 1)) * 100}% 0 0)` }}>
        <Mask x={200} y={y0 + 137} w={150} h={18} c="rgba(7,6,7,0.16)" />
      </g>
      <StepControls y={STEP2.controls} primary="DALEJ" press={press} />
    </g>
  )
}

/** Шаг 4: «Telefon i e-mail», согласие RODO. */
export function RegStep4({ typed = 1, gdpr = 0, press = 1 }: { typed?: number; gdpr?: number; press?: number }) {
  const y0 = 238
  const reveal = (k: number) => ({ clipPath: `inset(0 ${(1 - clamp01(k)) * 100}% 0 0)` })
  const t = useT()
  return (
    <g>
      <T x={176} y={STEP2.title - 12} s={36} w={900} c="#ffffff" ls={-1.08}>
        {t('Telefon i e-mail', 'Phone & email')}
      </T>
      <Label x={176} y={y0}>
        {t('Telefon *', 'Phone *')}
      </Label>
      <R x={176} y={y0 + 22} w={672} h={56} r={28} fill="#ffffff" />
      <T x={200} y={y0 + 56} s={17} w={600} c={INK}>
        +48
      </T>
      <G n="chevronDown" x={240} y={y0 + 42} s={16} c="rgba(7,6,7,0.5)" />
      <rect x={268} y={y0 + 38} width={1} height={24} fill="rgba(7,6,7,0.15)" />
      <g style={reveal(typed * 3)}>
        <Mask x={284} y={y0 + 41} w={150} h={18} c="rgba(7,6,7,0.16)" />
      </g>
      <Label x={176} y={y0 + 90}>
        {t('Adres e-mail (login) *', 'Email address (login) *')}
      </Label>
      <R x={176} y={y0 + 112} w={672} h={56} r={28} fill="#ffffff" />
      <g style={reveal(typed * 3 - 1)}>
        <Mask x={200} y={y0 + 131} w={230} h={18} c="rgba(7,6,7,0.16)" />
      </g>
      <Label x={176} y={y0 + 180}>
        {t('Hasło *', 'Password *')}
      </Label>
      <R x={176} y={y0 + 202} w={672} h={56} r={28} fill="#ffffff" />
      <T x={200} y={y0 + 236} s={17} w={500} c={INK}>
        {'••••••••••'.slice(0, Math.round(10 * clamp01(typed * 3 - 2)))}
      </T>
      <BrandCheck x={176} y={y0 + 274} text={t('Wyrażam zgodę na przetwarzanie moich danych osobowych (RODO). *', 'I consent to the processing of my personal data (GDPR). *')} checked={gdpr} />
      <StepControls y={STEP2.controls + 16} primary="ZAREJESTRUJ SIĘ" press={press} />
    </g>
  )
}

/* ── Успех и тетрис ─────────────────────────────────────────────────────── */

export const SUCCESS = { circle: { x: 512, y: 172, r: 48 }, title: [284, 332] as const, body: 388, button: { x: 462, y: 492, w: 100, h: 52 } }

/** Экран успеха: белый круг с оранжевой галочкой (м-галочка), заголовок,
    абзац и «DALEJ». fall — части падают (y, поворот, прозрачность). */
export function SuccessPanel({ check, fall = [0, 0, 0, 0], enter = [1, 1, 1, 1], circle = 1, press = 1 }: { check: number; fall?: number[]; enter?: number[]; circle?: number; press?: number }) {
  /* Уход — fallAway продукта: вниз за кромку с поворотом; вход — снизу, pop. */
  const drop = (k: number, turn: number, cx: number, cy: number, e = 1) =>
    k > 0 ? { transform: `translate(0px, ${k * 700}px) rotate(${turn * k}deg)`, transformOrigin: `${cx}px ${cy}px`, opacity: 1 - k * 0.8 } : e < 1 ? { transform: `translate(0px, ${(1 - e) * 22}px)`, opacity: clamp01(e * 1.4) } : undefined
  const c = SUCCESS.circle
  const b = SUCCESS.button
  const lang = useLang()
  const t = useT()
  return (
    <g>
      <g style={drop(fall[0] ?? 0, -20, c.x, c.y)}>
        <g transform={`translate(${c.x} ${c.y}) scale(${circle}) translate(${-c.x} ${-c.y})`}>
          <Dot cx={c.x} cy={c.y} r={c.r} fill="#ffffff" />
          <g transform={`translate(${c.x - 24} ${c.y - 24}) scale(${48 / 52})`}>
            <path d="M14 27.5 L22.5 36 L38 17" fill="none" stroke={L.brand} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(check)} opacity={check > 0.001 ? 1 : 0} />
          </g>
        </g>
      </g>
      <g style={drop(fall[1] ?? 0, -12, W / 2, SUCCESS.title[0], enter[1])}>
        {lang === 'en' ? (
          /* «Check your email» помещается в одну строку — посередине двух польских. */
          <T x={W / 2} y={(SUCCESS.title[0] + SUCCESS.title[1]) / 2} s={48} w={900} c="#ffffff" a="middle" ls={-1.44}>
            Check your email
          </T>
        ) : (
          <>
            <T x={W / 2} y={SUCCESS.title[0]} s={48} w={900} c="#ffffff" a="middle" ls={-1.44}>
              Sprawdź swoją
            </T>
            <T x={W / 2} y={SUCCESS.title[1]} s={48} w={900} c="#ffffff" a="middle" ls={-1.44}>
              skrzynkę e-mail
            </T>
          </>
        )}
      </g>
      <g style={drop(fall[2] ?? 0, -4, W / 2, SUCCESS.body, enter[2])}>
        <P x={W / 2} y={SUCCESS.body} s={17} c="rgba(255,255,255,0.88)" width={500} lh={27} a="middle">
          {t('Wysłaliśmy link weryfikacyjny na adres biuro@••••••.pl. Po potwierdzeniu Twoje zgłoszenie trafi do ręcznej weryfikacji, a nasz zespół poinformuje Cię e-mailem.', 'We sent a verification link to biuro@••••••.pl. After confirmation, your application will move to manual review and our team will notify you by email.')}
        </P>
      </g>
      <g style={drop(fall[3] ?? 0, 4, b.x + b.w / 2, b.y + b.h / 2, enter[3])}>
        <g transform={`translate(${b.x + b.w / 2} ${b.y + b.h / 2}) scale(${press}) translate(${-b.x - b.w / 2} ${-b.y - b.h / 2})`}>
          <Btn label={t('DALEJ', 'NEXT')} x={b.x} y={b.y} h={b.h} v="ink" o={{ size: 14, weight: 700, tracking: 0.84, width: b.w }} />
        </g>
      </g>
    </g>
  )
}

/** Поле тетриса 10 × 20 (WaitingTetris): над полем — строка подсказки и счёт
    (flex justify-between, колонка 360 px), под полем — пульт и ссылка. */
export const TETRIS = { board: { x: 402, y: 112, w: 220, h: 440 }, cell: 22, row: { x: 332, w: 360, y: 96 } }

export function TetrisFrame({ score, show = 1 }: { score: number; show?: number }) {
  const { board, row } = TETRIS
  const pads = ['arrowLeft', 'rotateCw', 'arrowDown', 'arrowRight'] as const
  const padY = board.y + board.h + 16 + 24
  const lang = useLang()
  const t = useT()
  return (
    <g opacity={show} transform={`translate(0 ${(1 - show) * -24})`}>
      {/* Английская подсказка длиннее: кегль 12, чтобы не наехать на счёт справа. */}
      <T x={row.x} y={row.y} s={lang === 'en' ? 12 : 13} w={700} c="rgba(255,255,255,0.8)" up ls={lang === 'en' ? 1.2 : 1.3}>
        {t('Zagraj, my sprawdzamy zgłoszenie', 'Play while we review your application')}
      </T>
      <T x={row.x + row.w} y={row.y} s={13} w={700} c="#ffffff" a="end">
        {score}
      </T>
      <R x={board.x} y={board.y} w={board.w} h={board.h} r={24} fill="rgba(255,255,255,0.12)" />
      {pads.map((name, index) => {
        const cx = board.x + board.w / 2 + (index - 1.5) * 60
        return (
          <g key={name}>
            <Dot cx={cx} cy={padY} r={23.5} stroke="rgba(255,255,255,0.55)" />
            <G n={name} x={cx - 10} y={padY - 10} s={20} c="#ffffff" />
          </g>
        )
      })}
      <T x={W / 2} y={padY + 58} s={14} w={700} c="rgba(255,255,255,0.8)" a="middle" up ls={0.84}>
        {t('Przeglądaj produkty', 'Browse products')}
      </T>
    </g>
  )
}

/** Клетка поля (белая, как block() в WaitingTetris). */
export function Cell({ col, row, alpha = 0.95 }: { col: number; row: number; alpha?: number }) {
  const { board, cell } = TETRIS
  return <rect x={board.x + col * cell + 1.5} y={board.y + row * cell + 1.5} width={cell - 3} height={cell - 3} rx={3} fill={`rgba(255,255,255,${alpha})`} />
}

