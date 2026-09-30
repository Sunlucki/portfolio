import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Icon } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { SPRINGS, clamp01, easeIn, easeOut, span, spring } from '../kit/motion'
import { useSoundCue } from '../kit/sound'
import { Counter } from '../kit/text'
import { useLang } from '../kit/lang'
import { FONT, INK, MUTED, SHADOW, useAccent } from '../kit/theme'
import { CHANNELS } from './data'
import { Glyph } from './twin'
import type { GlyphName } from './glyphs'

/* 21 · Dlaczego · Счётчики функций (14 долей). Три барабана встают по
   очереди — 7, 6, 2 — это функции движка, не демо-цифры: 7 bramek płatności,
   6 kanałów sprzedaży, 2 rejestry (weryfikacja NIP). Над каждым контуром
   рисуется значок, под ним по одному проступают названия.

   0–40     первый: значок, барабан до 7, названия шлюзов
   20–60    второй: 6 каналов; 40–80 третий: 2 реестра
   80–196   всё читается; 196–210 уход (в хвосте) */

const COLUMNS: { value: number; label: string; en: string; icon: IconName; names: string[] }[] = [
  { value: 7, label: 'bramek płatności', en: 'payment gateways', icon: 'wallet', names: ['Przelewy24', 'Autopay', 'Paynow', 'Revolut', 'Stripe', 'PayU', 'Tpay (+ BLIK)'] },
  { value: 6, label: 'kanałów sprzedaży', en: 'sales channels', icon: 'globe', names: CHANNELS },
  { value: 2, label: 'rejestry', en: 'registries', icon: 'shieldCheck', names: ['Biała lista MF', 'VIES'] },
]

export const WHY_FRAMES = 210

export function WhyCounters() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const leave = easeIn(span(frame, WHY_FRAMES - 8, 14))
  const width = 520
  const gap = 60
  const left = 960 - (COLUMNS.length * width + (COLUMNS.length - 1) * gap) / 2
  /* Звук (цифры барабана щёлкают у Counter): колонка встаёт, значок
     рисуется. */
  COLUMNS.forEach((_, i) => useSoundCue('popIn', 6 + i * 20, { x: left + i * (width + gap) + width / 2, y: 330 }, { gain: 0.5 }))
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: 1 - leave, transform: `translateY(${-leave * 40}px)` }}>
      {COLUMNS.map((column, i) => {
        const at = 6 + i * 20
        const x = left + i * (width + gap)
        const rise = spring(frame, at, SPRINGS.pop)
        return (
          <div key={column.label} style={{ position: 'absolute', left: x, top: 250, width, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ opacity: easeOut(span(frame, at - 2, 8)) }}>
              <Icon name={column.icon} size={78} stroke={1.5} color={accent} p={easeOut(span(frame, at, 22))} />
            </div>
            <div style={{ marginTop: 18, opacity: clamp01(rise * 1.4), transform: `translateY(${(1 - clamp01(rise)) * 30}px)` }}>
              <Counter from={0} to={column.value} at={at + 4} duration={30} size={210} weight={800} />
            </div>
            <div style={{ marginTop: 4, fontSize: 44, fontWeight: 750, letterSpacing: '-0.025em', color: INK, opacity: easeOut(span(frame, at + 16, 12)) }}>{lang === 'en' ? column.en : column.label}</div>
            <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 18px', width: 480, fontSize: 25, fontWeight: 550, color: MUTED }}>
              {column.names.map((name, n) => {
                const k = easeOut(span(frame, at + 22 + n * 5, 10))
                return (
                  <span key={name} style={{ opacity: k, transform: `translateY(${(1 - k) * 10}px)`, whiteSpace: 'nowrap' }}>
                    {name}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* 22 · Dlaczego · Три причины (12 долей). Три карточки функций (наши, стекло)
   падают сверху с наклоном через 8 кадров и встают в ряд; значки рисуются,
   затем по очереди — галочки. */

const REASONS: { n: string; icon: GlyphName; title: string; line: string; en: { title: string; line: string } }[] = [
  { n: '01', icon: 'building2', title: 'Rejestracja po NIP', line: 'Dane firmy z\u00a0Białej listy MF i\u00a0VIES', en: { title: 'Sign-up by NIP', line: 'Data from Biała lista MF and VIES' } },
  { n: '02', icon: 'tag', title: 'Ceny i\u00a0progi dla każdego kontrahenta', line: 'Własna cena, progi ilościowe, oferty', en: { title: 'Prices and tiers per\u00a0buyer', line: 'Own price, volume tiers, quotes' } },
  { n: '03', icon: 'creditCard', title: 'Kredyt kupiecki z\u00a0limitem', line: 'Termin płatności pilnuje się sam', en: { title: 'Trade credit with limits', line: 'Payment terms enforce themselves' } },
]

export const REASONS_FRAMES = 180

export function WhyReasons() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const w = 500
  const h = 360
  const gap = 44
  const left = 960 - (REASONS.length * w + (REASONS.length - 1) * gap) / 2
  const leave = easeIn(span(frame, REASONS_FRAMES - 6, 12))
  /* Звук: карточка падает и встаёт (тяжёлая пружина доходит до места за
     ~15,7 кадра), галочки — по очереди. */
  REASONS.forEach((_, i) => {
    useSoundCue('thump', 1 + i * 7 + 15.7, { x: left + i * (w + gap) + w / 2, y: 360 + h / 2 }, { gain: 0.6 })
    useSoundCue('tick', 60 + i * 12 + 3, { x: left + i * (w + gap) + 51, y: 360 + h - 49 }, { gain: 0.6 })
  })
  return (
    <AbsoluteFill style={{ fontFamily: FONT, opacity: 1 - leave }}>
      {REASONS.map((reason, i) => {
        const at = 1 + i * 7
        const drop = spring(frame, at, SPRINGS.heavy)
        const tilt = [-3, 2, -2][i]!
        const check = easeOut(span(frame, 60 + i * 12, 12))
        return (
          <div
            key={reason.n}
            style={{
              position: 'absolute',
              left: left + i * (w + gap),
              top: 360,
              width: w,
              height: h,
              boxSizing: 'border-box',
              padding: '34px 36px',
              borderRadius: 30,
              background: 'rgba(255,255,255,0.82)',
              boxShadow: `inset 0 1px 0 #ffffff, 0 0 0 1px rgba(15,23,42,0.06), ${SHADOW.lifted}`,
              transform: `translateY(${(1 - drop) * -700}px) rotate(${tilt * (1 - clamp01(drop)) * 3 + tilt}deg)`,
              opacity: frame < at ? 0 : 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', color: accent }}>{reason.n}</div>
              <Glyph n={reason.icon} s={54} c={INK} sw={1.6} p={easeOut(span(frame, at + 10, 22))} />
            </div>
            <div style={{ marginTop: 'auto', fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', color: INK, lineHeight: 1.1 }}>{lang === 'en' ? reason.en.title : reason.title}</div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 500, color: MUTED }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, background: `rgba(5,150,105,${0.14 * check})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Glyph n="check" s={18} c="#059669" sw={3} p={check} />
              </span>
              {lang === 'en' ? reason.en.line : reason.line}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

