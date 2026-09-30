import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeOut, span, spring } from '../kit/motion'
import { useSoundCue } from '../kit/sound'
import { Counter, Headline } from '../kit/text'
import { FONT, INK } from '../kit/theme'
import { useSoundPoints } from './fx'
import { Glyph, type GlyphName } from './glyphs'
import { ACCENT, REASONS, caption } from './twins'

/* 20–21 · Dlaczego (19 долей). Наш текст на светлой бумаге, без рамок.
   Сначала три счётчика функций продукта (м-счёт — только функции, не
   демо-цифры): 7 języków · 3 formy współpracy · 4 kroki — над каждым иконка
   рисуется контуром, цифра прокатывается барабаном, слова встают из-под маски.
   Затем три причины строками: номер, иконка, слова встают, золотая галочка
   прорисовывается.

   0–16     телефон проносится мимо камеры (хвост главы Mobile, П12)
   6/20/34  счётчики: иконка, барабан 0 → N, слова
   60–118   строка стоит целиком — читается
   116–130  счётчики уходят вверх
   126–166  строки причин въезжают через 10 кадров; 172/180/188 — галочки
   188–278  строки стоят — читаются; 278–292 — уход под финал (хвост) */

export const DLACZEGO_BEATS = 19

/** Числа и слова — из подписи станции 20: «7 języków · 3 formy współpracy · 4 kroki»
    (по-английски — «7 languages · 3 ways to work · 4 steps»). */
const counts = (lang: Lang) =>
  caption(20, lang)
    .split('·')
    .map((part) => part.trim())
    .map((part) => {
      const [number, ...words] = part.split(/\s+/)
      return { value: Number(number), words: words.join(' ') }
    })

/** Три причины: польские — у художника (REASONS), английские — из подписи станции 21. */
const reasons = (lang: Lang) => (lang === 'en' ? caption(21, 'en').split(' · ') : REASONS)
const COUNT_ICONS: GlyphName[] = ['languages', 'handshake', 'listChecks']
const REASON_ICONS: GlyphName[] = ['userCheck', 'rocket', 'calendarClock']

const T = { counts: 6, leave: 116, cards: 126, checks: 172, out: 278 }

export function Dlaczego() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const COUNTS = counts(lang)
  const leave = easeIn(span(frame, T.leave, 14))
  const out = easeIn(span(frame, T.out, 14))
  /* Звук: счётчики уходят вверх; золотые галочки причин прорисовываются по
     очереди (счётчики, слова и строки звучат сами — Counter и Headline). */
  useSoundCue('air', T.leave, { x: 960, y: 450 }, { gain: 0.4, seconds: 0.5 })
  useSoundPoints('tick', [0, 1, 2].map((i) => ({ at: T.checks + i * 8, x: 290 + 1340 - 32, y: 300 + i * 170 + 65 })), { gain: 0.55 })
  return (
    <AbsoluteFill>
      {/* Счётчики функций. */}
      {frame < T.leave + 16 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - leave, transform: `translateY(${-leave * 140}px)` }}>
          {COUNTS.map((count, i) => {
            const at = T.counts + i * 14
            const x = 960 + (i - 1) * 520
            const appear = spring(frame, at, SPRINGS.pop)
            return (
              <div key={i} style={{ position: 'absolute', left: x - 250, top: 250, width: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: clamp01(appear * 2) }}>
                <Glyph name={COUNT_ICONS[i]!} size={84} stroke={1.5} color={ACCENT} p={easeOut(span(frame, at, 20))} />
                <div style={{ marginTop: 18 }}>
                  <Counter from={0} to={count.value} at={at + 2} duration={34} size={236} weight={800} color={INK} />
                </div>
                <div style={{ marginTop: 6 }}>
                  <Headline text={count.words} at={at + 12} size={50} weight={700} tracking={-0.03} />
                </div>
              </div>
            )
          })}
          {/* Точки-разделители строки «·» рисуются между счётчиками. */}
          {[0, 1].map((i) => (
            <div key={i} style={{ position: 'absolute', left: 960 + (i - 0.5) * 520 - 7, top: 520, width: 14, height: 14, borderRadius: 7, background: ACCENT, transform: `scale(${Math.max(0, spring(frame, T.counts + 24 + i * 6, SPRINGS.pop))})` }} />
          ))}
        </div>
      )}

      {/* Три причины: строки въезжают по очереди, галочки прорисовываются. */}
      {frame >= T.cards - 2 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, transform: `translateY(${out * -80}px)` }}>
          {reasons(lang).map((title, i) => (
            <ReasonLine key={i} index={i} title={title} frame={frame} />
          ))}
        </div>
      )}
    </AbsoluteFill>
  )
}

/** Причина — простой текст (правило владельца: единственная рамка вокруг
    нашего текста — выноска): номер золотом, иконка рисуется контуром, строка
    встаёт по словам, справа прорисовывается золотая галочка. Строка въезжает
    сверху с поворотом по X (3D) и встаёт с перелётом. */
function ReasonLine({ index, title, frame }: { index: number; title: string; frame: number }) {
  const at = T.cards + index * 10
  const drop = spring(frame, at, SPRINGS.pop)
  const top = 300 + index * 170
  const check = easeOut(span(frame, T.checks + index * 8, 12))
  return (
    <div
      style={{
        position: 'absolute',
        left: 290,
        top,
        width: 1340,
        height: 130,
        display: 'flex',
        alignItems: 'center',
        gap: 40,
        fontFamily: FONT,
        opacity: clamp01(drop * 2),
        transformOrigin: '50% 0%',
        transform: `perspective(1400px) translateY(${(1 - Math.min(1, drop)) * -90}px) rotateX(${(1 - clamp01(drop)) * -50}deg)`,
      }}
    >
      <div style={{ width: 64, flexShrink: 0, fontSize: 30, fontWeight: 750, color: ACCENT, letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>{String(index + 1).padStart(2, '0')}</div>
      <Glyph name={REASON_ICONS[index]!} size={76} color={ACCENT} stroke={1.6} p={easeOut(span(frame, at + 4, 18))} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Headline text={title} at={at + 4} size={76} weight={800} tracking={-0.04} stagger={3} />
      </div>
      <Glyph name="circleCheck" size={64} color={ACCENT} stroke={2} p={check} style={{ flexShrink: 0 }} />
    </div>
  )
}
