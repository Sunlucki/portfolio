import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { DrawPath, Icon } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { Headline } from '../kit/text'
import { FONT, INK, useAccent } from '../kit/theme'
import { Iris } from '../kit/transitions'
import { useLang } from '../kit/lang'
import { Toggle } from '../kit/ui'
import { caption } from './data'

/* 01 · Крючок A (11 долей): «Zamówienie przez …» — справа крутится барабан
   слов: mail → telefon → arkusz → SMS, перед каждым словом контуром рисуется
   его значок. Барабан раскрывается столбиком из четырёх каналов, каждый
   зачёркивается и гаснет: так заказы приходят сегодня.

   0–18     «Zamówienie przez» встаёт по словам
   16–88    барабан: слово каждые 18 кадров (0,6 с — успевает прочитаться)
   92–112   барабан раскрывается столбиком (glide)
   114–138  зачёркивание по очереди через 7 кадров, строка гаснет до 30%
   138–156  столбик читается целиком
   156–170  всё уходит вверх (в хвосте, под следующей сценой) */

const SIZE = 104
const WORDS: { text: string; en: string; icon: IconName }[] = [
  { text: 'mail.', en: 'email.', icon: 'mail' },
  { text: 'telefon.', en: 'phone.', icon: 'phone' },
  { text: 'arkusz.', en: 'spreadsheet.', icon: 'sheet' },
  { text: 'SMS.', en: 'SMS.', icon: 'messageSquare' },
]
const ROLL = { start: 16, step: 18 }
const UNFOLD = 92
const STRIKE = { start: 114, step: 7 }
const LEAVE = 156

export function HookChannels() {
  const frame = useCurrentFrame()
  const lang = useLang()
  /* Слова барабана на языке ролика (у английского — из caption(1).en). */
  const word = (w: (typeof WORDS)[number]) => (lang === 'en' ? w.en : w.text)
  const lead = caption(1, lang).split(/\s+/).slice(0, 2).join(' ')
  const leadWidth = textWidth(lead, SIZE, 800, -0.045)
  const iconSize = SIZE * 0.78
  const wordWidth = Math.max(...WORDS.map((w) => textWidth(word(w), SIZE, 800, -0.045)))
  const gap = 40
  const total = leadWidth + gap + iconSize + 26 + wordWidth
  const left = 960 - total / 2
  const lineH = SIZE * 1.08
  const top = 540 - lineH / 2
  const rowH = SIZE * 1.12
  const slotX = left + leadWidth + gap
  const unfold = spring(frame, UNFOLD, SPRINGS.glide)
  const leave = easeIn(span(frame, LEAVE, 12))
  /* Звук (слова строки встают у Headline): барабан щёлкает на каждом слове,
     раскрывается столбиком, слова зачёркиваются пером по очереди, всё уходит
     вверх. */
  const drum = { x: slotX + (iconSize + 26 + wordWidth) / 2, y: top + lineH / 2 }
  useSoundCues('tick', WORDS.map((_, i) => ROLL.start + i * ROLL.step), drum, { gain: 0.8 })
  useSoundCue('layers', UNFOLD, drum, { gain: 0.55, seconds: 0.6 })
  WORDS.forEach((w, i) =>
    useSoundCue('pen', STRIKE.start + i * STRIKE.step, { x: slotX + iconSize + 26 + textWidth(word(w), SIZE, 800, -0.045) / 2, y: top + (i - (WORDS.length - 1) / 2) * rowH + lineH / 2 }, { gain: 0.8, seconds: 8 / 30 }),
  )
  useSoundCue('air', LEAVE, { x: 960, y: 540 }, { gain: 0.5, seconds: 0.5 })
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: 'absolute', left, top, opacity: mix(1, 0.3, easeOut(span(frame, STRIKE.start + 30, 12))) * (1 - leave), transform: `translateY(${-leave * 50}px)` }}>
        <Headline text={lead} at={0} size={SIZE} />
      </div>
      {WORDS.map((item, i) => {
        /* Барабан: слово въезжает снизу и уезжает вверх; последнее остаётся. */
        const enter = frame >= UNFOLD ? 1 : spring(frame, ROLL.start + i * ROLL.step, SPRINGS.snap)
        const exit = i < WORDS.length - 1 && frame < UNFOLD ? spring(frame, ROLL.start + (i + 1) * ROLL.step, SPRINGS.snap) : 0
        const rolling = (1 - clamp01(enter)) * 1 - exit
        /* Раскрытие: слово едет из барабана на свою строку столбика. */
        const row = (i - (WORDS.length - 1) / 2) * rowH
        const shownInRoll = frame < UNFOLD ? clamp01(enter) * (1 - clamp01(exit)) : 1
        const fromRoll = i === WORDS.length - 1 ? 1 : 0
        const unfoldOpacity = frame < UNFOLD ? shownInRoll : mix(fromRoll, 1, clamp01(unfold * 1.6))
        const y = frame < UNFOLD ? rolling * lineH * 0.9 : mix(0, row, unfold)
        const blur = frame < UNFOLD ? Math.abs(rolling) * 8 : 0
        const strike = STRIKE.start + i * STRIKE.step
        const struck = easeInOut(span(frame, strike, 8))
        const dim = mix(1, 0.3, easeOut(span(frame, strike + 6, 8)))
        const iconP = frame < UNFOLD ? easeOut(span(frame, ROLL.start + i * ROLL.step + 2, 14)) : 1
        const out = easeIn(span(frame, LEAVE + i * 2, 12))
        if (unfoldOpacity <= 0.001) return null
        return (
          <div
            key={item.text}
            style={{
              position: 'absolute',
              left: slotX,
              top: top + y,
              height: lineH,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              opacity: unfoldOpacity * dim * (1 - out),
              filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              transform: `translateY(${-out * 60}px)`,
              /* Барабан режет слово по высоте строки, пока крутится. */
              clipPath: frame < UNFOLD ? `inset(${Math.max(0, -y)}px 0 ${Math.max(0, y)}px 0)` : undefined,
            }}
          >
            <Icon name={item.icon} size={iconSize} stroke={1.5} color={INK} p={iconP} />
            <span style={{ position: 'relative', fontSize: SIZE, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.08, color: INK, whiteSpace: 'nowrap' }}>
              {word(item)}
              {struck > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    left: '-0.04em',
                    right: '-0.06em',
                    top: '53%',
                    height: '0.07em',
                    borderRadius: 999,
                    background: INK,
                    clipPath: `inset(0 ${(1 - struck) * 100}% 0 0 round 999px)`,
                    transform: 'rotate(-0.8deg)',
                  }}
                />
              )}
            </span>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* 02 · Крючок B (9 долей): «Hurt zamawia sam.» проявляется из размытия,
   рядом щёлкает переключатель; ниже по словам встаёт путь заказа «NIP → cena →
   koszyk → InPost», стрелки между словами рисуются контуром, под «InPost» —
   черта акцента. Затем из переключателя кругом разливается оранжевый — это
   фон страницы регистрации.

   0–16     «Hurt zamawia sam.» из размытия; 8 — переключатель; 30 — щелчок
   40–80    путь заказа по словам через 10 кадров, стрелки рисуются
   84–96    черта под «InPost»
   96–116   фраза читается целиком
   116–135  оранжевый круг из переключателя на весь кадр */

const CHAIN = ['NIP', 'cena', 'koszyk', 'InPost']
const CHAIN_EN = ['NIP', 'price', 'cart', 'InPost']
export const FLOOD = { start: 116, dur: 19 }

export function HookPhrase() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const phrase = caption(2, lang)
  /* «Wholesale that orders itself.» длиннее польской фразы: кегль меньше,
     чтобы строка с переключателем осталась в кадре. */
  const size = lang === 'en' ? 116 : 150
  const chain = lang === 'en' ? CHAIN_EN : CHAIN
  const width = textWidth(phrase, size, 800, -0.045)
  const gap = 52
  const toggle = { width: 132, height: 76 }
  const row = width + gap + toggle.width
  const left = 960 - row / 2
  /* Меньший кегль — блок фразы и пути опускается, чтобы стоять по центру, как польский. */
  const top = lang === 'en' ? 348 : 330
  const toggleAt: [number, number] = [left + width + gap + toggle.width / 2, top + (size * 1.08) / 2 + 4]
  /* Путь заказа: слова и стрелки между ними. */
  const chainSize = 72
  const arrow = 74
  const arrowGap = 26
  const widths = chain.map((w) => textWidth(w, chainSize, 700, -0.03))
  const chainTop = top + size * 1.08 + 46
  let x = left + 4
  const items = chain.map((word, i) => {
    const item = { word, x, width: widths[i]!, at: 40 + i * 10 }
    x += widths[i]! + arrowGap * 2 + arrow
    return item
  })
  const flood = Math.pow(span(frame, FLOOD.start, FLOOD.dur), 2)
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <div style={{ position: 'absolute', left, top }}>
        <Headline text={phrase} at={0} size={size} mode="focus" />
      </div>
      <div style={{ position: 'absolute', left: toggleAt[0] - toggle.width / 2, top: toggleAt[1] - toggle.height / 2 }}>
        <Toggle at={8} on={30} />
      </div>
      {items.map((item, i) => (
        <div key={item.word} style={{ position: 'absolute', left: item.x, top: chainTop }}>
          <Headline text={item.word} at={item.at} size={chainSize} weight={700} tracking={-0.03} underline={i === CHAIN.length - 1 ? { word: 0, at: 84 } : undefined} />
        </div>
      ))}
      {items.slice(0, -1).map((item, i) => {
        const ax = item.x + item.width + arrowGap
        const ay = chainTop + chainSize * 0.58
        const p = easeInOut(span(frame, item.at + 6, 12))
        return (
          <div key={i} style={{ position: 'absolute', left: ax, top: ay }}>
            <DrawPath d={`M 0 0 L ${arrow} 0 M ${arrow - 16} -15 L ${arrow} 0 L ${arrow - 16} 15`} p={p} color={i === CHAIN.length - 2 ? accent : INK} width={5} />
          </div>
        )
      })}
      <Iris at={toggleAt} t={flood} color={accent} start={38} />
    </AbsoluteFill>
  )
}
