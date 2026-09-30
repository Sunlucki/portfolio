import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { useSoundCue } from '../kit/sound'
import { DIM, FONT, INK, MUTED, SHADOW, tint } from '../kit/theme'
import { Pulse } from './parts'
import { IA, caption, tag } from './twins'

/* 15 · 05 Płace · Nadgodziny ×1,5 (17 долей). Наша карточка (не экран
   продукта): день Jana 07:00–17:00 на шкале часов. Полоса заполняется слева;
   на отметке 8 h — пунктир, после него полоса становится оранжевой (цвет
   сверхурочных в «Eksport listy płac»), над оранжевым куском выскакивает
   «×1,5». Под кусками — столбцы выгрузки: «Regularne (godz.)» 8.0 и
   «Nadgodziny (godz.)» 2.0. Правило из кода: больше 480 минут в день —
   сверхурочные с коэффициентом 1,5.

   Карточка входит ребром (П15) — продолжение переворота карточки задания.
   В конце «×1,5» прокручивается в «Eksport listy płac» (П16): эта строка
   летит в заголовок следующей сцены.

   0–22     карточка встаёт из ребра; 18–46 шкала и пунктир 8 h
   40–110   полоса 07:00 → 15:00; 110 — отметка 8 h вспыхивает
   110–150  оранжевый хвост 15:00 → 17:00; 146 — «×1,5», 160 — обводка
   150–234  выноска «Powyżej 8 godzin: nadgodziny ×1,5. Automatycznie.»
   236–255  «×1,5» → «Eksport listy płac», карточка гаснет */

export const OVERTIME_BEATS = 17

const CARD = { x: 160, y: 150, width: 1600, height: 580 }
const S0 = CARD.x + 110
const S1 = CARD.x + CARD.width - 110
const HOURS = 10
const PX = (S1 - S0) / HOURS
const X8 = S0 + 8 * PX
const BAR = { y: CARD.y + 300, height: 56 }
const E = { flip: 0, fill: 40, eight: 110, tail: 150, times: 146, roll: 236 }

/** «×1,5» над оранжевым куском: центр, кегль. Сюда же встаёт «Eksport listy
    płac» — строка, которая летит в заголовок экрана выгрузки. */
export const TIMES = { x: (X8 + S1) / 2 + 28, y: BAR.y - 104, size: 150 }
export const ROLL_TITLE = { text: 'Eksport listy płac', en: 'Payroll Export', size: 64 }

const clock = (hour: number) => `${String(7 + hour).padStart(2, '0')}:00`

/** Кадры, в которые головка полосы проходит час шкалы — тик часов для звука.
    Без 8 h (там щелчок сверхурочных) и 10 h (там же выскакивает «×1,5»). */
const HOUR_TICKS: { at: number; x: number }[] = (() => {
  const head = (f: number) => regularAt(f) * 8 + overtimeAt(f) * 2
  const out: { at: number; x: number }[] = []
  for (const hour of [1, 2, 3, 4, 5, 6, 7, 9]) {
    for (let f = E.fill; f <= E.tail; f++) {
      if (head(f) >= hour - 1e-6) {
        out.push({ at: f, x: S0 + hour * PX })
        break
      }
    }
  }
  return out
})()
function regularAt(frame: number) {
  return glide(span(frame, E.fill, E.eight - E.fill))
}
function overtimeAt(frame: number) {
  return easeInOut(span(frame, E.eight, E.tail - E.eight))
}

export function Overtime() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const timesText = t('×1,5', '×1.5')
  const rollText = t(ROLL_TITLE.text, ROLL_TITLE.en)
  const flip = spring(frame, E.flip, SPRINGS.heavy)
  const regular = glide(span(frame, E.fill, E.eight - E.fill))
  const overtime = easeInOut(span(frame, E.eight, E.tail - E.eight))
  const head = S0 + regular * 8 * PX + overtime * 2 * PX
  const times = spring(frame, E.times, SPRINGS.pop)
  const roll = easeInOut(span(frame, E.roll, 14))
  const cardOut = easeIn(span(frame, E.roll + 2, 14))
  const flash = Math.sin(Math.PI * clamp01(span(frame, E.eight, 18)))
  const labels = (at: number) => spring(frame, at, SPRINGS.pop)
  const timesWidth = textWidth(timesText, TIMES.size, 800, -0.03)
  const titleWidth = textWidth(rollText, ROLL_TITLE.size, 800, -0.035)

  /* Звук: карточка встаёт из ребра; шкала часов проступает, «8 h»; головка
     полосы отщёлкивает часы; на 8 h — щелчок: дальше сверхурочные; итоги,
     «×1,5» выскакивает и барабаном уходит в «Eksport listy płac». */
  const barMid = BAR.y + BAR.height / 2
  useSoundCue('flip', E.flip + 2, { x: 960, y: CARD.y + CARD.height / 2 }, { gain: 0.6 })
  useSoundCue('layers', 18, { x: 960, y: BAR.y + BAR.height + 40 }, { gain: 0.35, seconds: 0.6 })
  useSoundCue('popIn', 32, { x: X8 - 60, y: BAR.y - 52 }, { gain: 0.45 })
  for (const tick of HOUR_TICKS) useSoundCue('tick', tick.at, { x: tick.x, y: barMid }, { gain: 0.45 })
  useSoundCue('toggle', E.eight, { x: X8, y: barMid }, { gain: 0.7 })
  useSoundCue('popIn', 118, { x: S0 + 150, y: BAR.y + BAR.height + 110 }, { gain: 0.4 })
  useSoundCue('popIn', E.times, { x: TIMES.x, y: TIMES.y }, { gain: 0.9 })
  useSoundCue('flip', E.roll, { x: TIMES.x, y: TIMES.y }, { gain: 0.6 })

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.width, height: CARD.height, perspective: 2600, opacity: 1 - cardOut }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 34,
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)',
            boxShadow: `inset 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.lifted}`,
            transform: `rotateY(${(1 - flip) * -90}deg) scale(${mix(1, 0.97, cardOut)})`,
          }}
        >
          {/* Кто и где: как в строке пульта координатора. */}
          <div style={{ position: 'absolute', left: 64, top: 56, display: 'flex', alignItems: 'center', gap: 22, opacity: easeOut(span(frame, 14, 10)) }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, background: `linear-gradient(135deg, ${IA.primary}, ${IA.blue700})`, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700 }}>JK</div>
            <div>
              <div style={{ fontSize: 38, fontWeight: 750, color: INK, letterSpacing: '-0.02em' }}>Jan Kowalski</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: MUTED, marginTop: 4 }}>{t('Hub Wrocław · 27.09', 'Hub Wrocław · 27 Sep')}</div>
            </div>
          </div>
          {/* Шкала часов. */}
          {Array.from({ length: HOURS + 1 }, (_, i) => {
            const x = S0 + i * PX - CARD.x
            const show = easeOut(span(frame, 18 + i * 2, 8))
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: BAR.y - CARD.y + BAR.height + 16, opacity: show }}>
                <div style={{ position: 'absolute', left: -1.5, top: 0, width: 3, height: 12, borderRadius: 2, background: 'rgba(15, 23, 42, 0.18)' }} />
                <div style={{ position: 'absolute', left: -60, top: 22, width: 120, textAlign: 'center', fontSize: 24, fontWeight: 600, color: DIM, fontVariantNumeric: 'tabular-nums' }}>{clock(i)}</div>
              </div>
            )
          })}
          <div style={{ position: 'absolute', left: S0 - CARD.x, top: BAR.y - CARD.y, width: S1 - S0, height: BAR.height, borderRadius: BAR.height / 2, background: IA.gray100, opacity: easeOut(span(frame, 16, 10)) }} />
          {frame >= E.fill && (
            <div style={{ position: 'absolute', left: S0 - CARD.x, top: BAR.y - CARD.y, width: Math.max(BAR.height, Math.min(head, X8) - S0), height: BAR.height, borderRadius: BAR.height / 2, background: IA.primary }} />
          )}
          {head > X8 + 1 && (
            <div style={{ position: 'absolute', left: X8 - CARD.x - BAR.height / 2, top: BAR.y - CARD.y, width: head - X8 + BAR.height / 2, height: BAR.height, borderRadius: `0 ${BAR.height / 2}px ${BAR.height / 2}px 0`, background: IA.orange500 }} />
          )}
          {/* Отметка 8 h: пунктир от подписи до шкалы. */}
          <svg style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible' }}>
            <line x1={X8 - CARD.x} y1={BAR.y - CARD.y - 96} x2={X8 - CARD.x} y2={BAR.y - CARD.y + BAR.height + 14} stroke={INK} strokeOpacity={0.55} strokeWidth={3} strokeDasharray="7 8" strokeLinecap="round" opacity={easeOut(span(frame, 30, 12))} />
          </svg>
          <div style={{ position: 'absolute', right: CARD.x + CARD.width - X8 + 18, top: BAR.y - CARD.y - 76, fontSize: 48, fontWeight: 800, color: INK, letterSpacing: '-0.02em', opacity: easeOut(span(frame, 32, 10)), transform: `scale(${1 + 0.16 * flash})`, transformOrigin: '100% 50%' }}>8 h</div>
          {/* Столбцы выгрузки под кусками полосы. */}
          <SegmentLabel x={S0 - CARD.x} y={BAR.y - CARD.y + BAR.height + 92} label={t('Regularne (godz.)', 'Regular (h)')} value="8.0" color={INK} p={labels(118)} />
          <SegmentLabel x={X8 - CARD.x + 24} y={BAR.y - CARD.y + BAR.height + 92} label={t('Nadgodziny (godz.)', 'Overtime (h)')} value="2.0" color={IA.orange600} p={labels(152)} />
        </div>
      </div>
      {/* Головка полосы: белая точка с кромкой цвета куска. */}
      {frame >= E.fill && cardOut < 0.5 && (
        <div style={{ position: 'absolute', left: head - 22, top: BAR.y + BAR.height / 2 - 22, width: 44, height: 44, borderRadius: 22, background: '#ffffff', border: `6px solid ${head > X8 + 1 ? IA.orange500 : IA.primary}`, boxSizing: 'border-box', boxShadow: SHADOW.card, opacity: 1 - easeIn(span(frame, E.tail + 4, 8)) }} />
      )}
      <Pulse x={X8} y={BAR.y + BAR.height / 2} at={E.eight} until={E.eight + 20} radius={80} color={tint(IA.orange500, 0.8)} rings={2} period={20} width={3} />
      {/* «×1,5» → «Eksport listy płac» (П16): барабан вверх. */}
      <div style={{ position: 'absolute', left: TIMES.x - 400, top: TIMES.y - TIMES.size * 0.6, width: 800, height: TIMES.size * 1.2, overflow: 'hidden', textAlign: 'center' }}>
        <div
          style={{
            position: 'absolute',
            left: 400 - timesWidth / 2,
            top: 0,
            fontSize: TIMES.size,
            lineHeight: 1.2,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: IA.orange600,
            whiteSpace: 'nowrap',
            opacity: clamp01(times * 1.5) * (1 - roll),
            transform: `translateY(${(1 - clamp01(times)) * 60 - roll * 100}%) scale(${mix(0.7, 1, clamp01(times))})`,
            filter: roll > 0.02 && roll < 0.98 ? `blur(${Math.sin(Math.PI * roll) * 6}px)` : undefined,
          }}
        >
          {timesText}
        </div>
        {roll > 0 && (
          <div style={{ position: 'absolute', left: 400 - titleWidth / 2, top: (TIMES.size * 1.2 - ROLL_TITLE.size * 1.2) / 2, fontSize: ROLL_TITLE.size, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.035em', color: INK, whiteSpace: 'nowrap', transform: `translateY(${(1 - roll) * 140}%)`, filter: roll < 0.98 ? `blur(${Math.sin(Math.PI * roll) * 6}px)` : undefined }}>
            {rollText}
          </div>
        )}
      </div>
      <Scribble rect={{ x: TIMES.x - timesWidth / 2, y: TIMES.y - TIMES.size * 0.42, width: timesWidth, height: TIMES.size * 0.84 }} p={easeOut(span(frame, 160, 18)) * (1 - easeIn(span(frame, E.roll - 6, 8)))} pad={[22, 14]} seed={15} width={3} color={IA.orange500} />
      <Callout anchor={[X8, BAR.y + BAR.height + 14]} box={{ x: X8 - 760, y: CARD.y + CARD.height + 34, width: 660 }} tag={tag(15, lang)} title={caption(15, lang)} at={150} until={234} />
    </AbsoluteFill>
  )
}

function SegmentLabel({ x, y, label, value, color, p }: { x: number; y: number; label: string; value: string; color: string; p: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'baseline', gap: 14, opacity: clamp01(p * 1.4), transform: `translateY(${(1 - clamp01(p)) * 16}px)` }}>
      <span style={{ fontSize: 26, fontWeight: 600, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 46, fontWeight: 800, color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}
