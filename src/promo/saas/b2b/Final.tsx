import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Icon } from '../kit/draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { Headline } from '../kit/text'
import { FONT, INK, MUTED, tint, useAccent } from '../kit/theme'
import { Stage } from '../kit/surfaces'
import { Iris } from '../kit/transitions'
import { useLang, type Lang } from '../kit/lang'
import { caption } from './data'

/* 23 · Finał · «Omówmy Twoją hurtownię.» (8 долей). Строки открываются косой
   шторкой слева направо (З6), по буквам проходит светлый блик, под
   «hurtownię.» рисуется черта акцента. */

const SIZE = 150
const [LINE1, LINE2] = (() => {
  const words = caption(23).split(/\s+/)
  return [words[0]!, words.slice(1).join(' ')]
})()
const TOP = 290
/** Центр «o» в «Omówmy» — отсюда кругом раскрывается знак. */
export const O_POINT: [number, number] = [960 - textWidth(LINE1, SIZE, 800, -0.045) / 2 + textWidth('O', SIZE, 800, -0.045) / 2, TOP + SIZE * 0.62]

/* Английская фраза «Let's talk about your wholesale.» режется «три слова /
   остальное» (польский разрез «первое слово / остальное» дал бы вторую строку
   шире кадра), знак раскрывается из «o» в «about». Считается при отрисовке:
   шрифт уже загружен. Польские LINE1, LINE2, O_POINT не трогаем. */
function linesOf(lang: Lang): [string, string] {
  if (lang !== 'en') return [LINE1, LINE2]
  const words = caption(23, 'en').split(/\s+/)
  return [words.slice(0, 3).join(' '), words.slice(3).join(' ')]
}

function oPointOf(lang: Lang): [number, number] {
  if (lang !== 'en') return O_POINT
  const [line1] = linesOf('en')
  const index = line1.lastIndexOf('o')
  const left = 960 - textWidth(line1, SIZE, 800, -0.045) / 2
  /* Строчная «o» ниже заглавной: центр — на середине высоты строчных. */
  return [left + textWidth(line1.slice(0, index), SIZE, 800, -0.045) + textWidth('o', SIZE, 800, -0.045) / 2, TOP + SIZE * 0.71]
}

export const FINAL_LINE_FRAMES = 120

export function FinalHeadline() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const [LINE1, LINE2] = linesOf(lang)
  const O_POINT = oPointOf(lang)
  /* Звук: строки открываются шторкой, по буквам идёт блик, под «hurtownię.»
     рисуется черта; из «o» — подъём к знаку SIMBIA (блик знака — в сцене 24). */
  const width2 = textWidth(LINE2, SIZE, 800, -0.045)
  const last = textWidth(LINE2.split(' ').pop()!, SIZE, 800, -0.045)
  useSoundCue('popIn', 4, { x: 960, y: TOP + SIZE * 0.54 }, { gain: 0.7 })
  useSoundCue('popIn', 12, { x: 960, y: TOP + SIZE * 1.1 + SIZE * 0.54 }, { gain: 0.7 })
  useSoundCue('glint', 30, { x: 960, y: TOP + SIZE * 1.1 }, { gain: 0.6, seconds: 0.9 })
  useSoundCue('pen', 44, { x: 960 + width2 / 2 - last / 2, y: TOP + SIZE * 1.1 + SIZE * 1.06 }, { gain: 0.5, seconds: 14 / 30 })
  useSoundCue('riser', 92, { x: O_POINT[0], y: O_POINT[1] }, { gain: 0.6, seconds: 1.2 })
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {[LINE1, LINE2].map((line, i) => {
        const open = easeInOut(span(frame, 4 + i * 8, 18))
        const sheen = span(frame, 30 + i * 6, 26)
        const width = textWidth(line, SIZE, 800, -0.045)
        const style = { fontSize: SIZE, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.08, whiteSpace: 'nowrap' as const }
        return (
          <div key={line} style={{ position: 'absolute', left: 960 - width / 2, top: TOP + i * SIZE * 1.1, clipPath: `polygon(0 0, ${open * 115}% 0, ${open * 115 - 15}% 100%, 0 100%)` }}>
            <div style={{ ...style, color: INK }}>{line}</div>
            {/* Светлый блик по буквам: та же строка, залитая бегущей полосой. */}
            <div
              style={{
                ...style,
                position: 'absolute',
                left: 0,
                top: 0,
                color: 'transparent',
                backgroundImage: 'linear-gradient(105deg, transparent 0%, transparent 42%, rgba(255,255,255,0.75) 50%, transparent 58%, transparent 100%)',
                backgroundSize: '300% 100%',
                backgroundPosition: `${mix(100, -10, sheen)}% 0`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                opacity: sheen > 0 && sheen < 1 ? 1 : 0,
              }}
            >
              {line}
            </div>
            {i === 1 && (
              <div style={{ position: 'absolute', left: width - textWidth(LINE2.split(' ').pop()!, SIZE, 800, -0.045), right: 0, bottom: SIZE * 0.02, height: SIZE * 0.07, borderRadius: 999, background: accent, clipPath: `inset(0 ${(1 - easeInOut(span(frame, 44, 14))) * 100}% 0 0 round 999px)`, transform: 'rotate(-0.6deg)' }} />
            )}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* 24 · Finał · Знак и адрес (11 долей). Из «o» кругом раскрывается финал:
   знак SIMBIA, «Portal B2B dla hurtu», simbia.eu и кнопка «Umów rozmowę».
   Курсор нажимает кнопку, от неё расходятся тонкие светлые кольца. */

export const FINAL_FRAMES = 165

export function FinalSign() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const iris = easeInOut(span(frame, 0, 26))
  const button = spring(frame, 46, SPRINGS.pop)
  const label = lang === 'en' ? 'Book a call' : 'Umów rozmowę'
  const bw = textWidth(label, 34, 750, -0.01) + 60 + 44
  const bx = 960 - bw / 2
  const by = 760
  const click = 102
  const cursor = cursorAt(
    [
      { at: 72, x: bx + bw + 240, y: by + 220 },
      { at: click - 4, x: bx + bw * 0.62, y: by + 44 },
      { at: click + 30, x: bx + bw * 0.75, y: by + 120 },
    ],
    frame,
    [click],
  )
  const press = 1 - 0.05 * clamp01(1 - Math.abs(frame - click) / 3)
  /* Звук (круг из «o», «SIMBIA», «simbia.eu» с чертой, клик — у набора):
     знак встал — блик (подъём начат в сцене 23); строка «Portal B2B dla
     hurtu» и кнопка встают; от нажатой кнопки расходятся кольца. */
  useSoundCue('glint', 14, { x: 960, y: 350 }, { gain: 0.7, seconds: 1 })
  useSoundCue('popIn', 26, { x: 960, y: 500 }, { gain: 0.45 })
  useSoundCue('popIn', 46, { x: 960, y: by + 44 }, { gain: 0.6 })
  useSoundCue('air', click + 2, { x: bx + bw * 0.62, y: by + 44 }, { gain: 0.45, seconds: 1.2 })
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Iris at={oPointOf(lang)} t={iris}>
        <Stage>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center' }}>
            <Headline text="SIMBIA" at={10} size={190} weight={800} tracking={-0.04} />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontSize: 54, fontWeight: 650, letterSpacing: '-0.02em', color: MUTED, opacity: easeOut(span(frame, 26, 14)), transform: `translateY(${(1 - easeOut(span(frame, 26, 14))) * 16}px)` }}>{caption(24, lang)}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 575, textAlign: 'center' }}>
            <Headline text="simbia.eu" at={36} size={64} weight={750} tracking={-0.02} underline={{ word: 0, at: 58 }} />
          </div>
          {/* Кольца от кнопки после клика — тонкие, светлые (без свечения). */}
          {[0, 1, 2].map((i) => {
            const t = span(frame, click + 2 + i * 8, 40)
            if (t <= 0 || t >= 1) return null
            const r = mix(60, 420, easeOut(t))
            return <div key={i} style={{ position: 'absolute', left: 960 - r * 2.2, top: by + 44 - r, width: r * 4.4, height: r * 2, borderRadius: '50%', border: `2px solid ${tint(accent, 0.35 * (1 - t))}` }} />
          })}
          <div
            style={{
              position: 'absolute',
              left: bx,
              top: by,
              width: bw,
              height: 88,
              borderRadius: 44,
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              color: '#ffffff',
              fontSize: 34,
              fontWeight: 750,
              letterSpacing: '-0.01em',
              opacity: clamp01(button * 1.5),
              transform: `scale(${mix(0.85, 1, clamp01(button)) * press})`,
              boxShadow: '0 14px 34px rgba(252, 80, 0, 0.22)',
            }}
          >
            {label}
            <Icon name="arrowRight" size={34} color="#ffffff" stroke={2.6} p={easeOut(span(frame, 52, 14))} />
          </div>
          <Ripple x={bx + bw * 0.62} y={by + 44} at={click} color="#ffffff" size={46} />
          <Cursor x={cursor.x} y={cursor.y} press={cursor.press} opacity={cursor.opacity * (1 - easeIn(span(frame, 150, 10)))} />
        </Stage>
      </Iris>
    </AbsoluteFill>
  )
}

