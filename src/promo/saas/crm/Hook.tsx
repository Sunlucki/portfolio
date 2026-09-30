import { useRef } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Icon } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { useLang, type Lang } from '../kit/lang'
import { easeIn, easeOut, mix, span } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { useSoundCue } from '../kit/sound'
import { Headline } from '../kit/text'
import { INK, useAccent } from '../kit/theme'
import { Iris } from '../kit/transitions'
import { Toggle } from '../kit/ui'
import { caption } from './twins'

/* 01 · Крючок A (6 долей, 0–89): «Arkusz. Skrzynka. Notatki.» — три
   старых инструмента встают столбиком, перед каждым контуром рисуется
   иконка; затем каждое слово зачёркивается и гаснет, строки уходят вверх.

   6–36    строки встают из-под маски через 8 кадров, иконки прорисовываются
   40–66   зачёркивание по очереди через 9 кадров, строка гаснет до 30%
   66–84   все три зачёркнуты — читаются
   80–94   строки уходят вверх (уход в хвосте сцены, под следующей) */

/** Три строки крючка: слово подписи 1 и иконка старого инструмента. */
function hookLines(lang: Lang): { text: string; icon: IconName }[] {
  const words = caption(1, lang).split(/\s+/)
  const icons: IconName[] = ['sheet', 'inbox', 'stickyNote']
  return words.map((text, i) => ({ text, icon: icons[i] ?? 'sheet' }))
}

export function HookWords() {
  const frame = useCurrentFrame()
  const LINES = hookLines(useLang())
  /* Звук: перед словом контуром рисуется иконка — перо; строки уходят вверх —
     воздух. Слова и зачёркивания звучат сами (Headline). */
  const iconRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  useSoundCue('pen', 8, iconRefs[0]!, { gain: 0.35, seconds: 0.5 })
  useSoundCue('pen', 16, iconRefs[1]!, { gain: 0.35, seconds: 0.5 })
  useSoundCue('pen', 24, iconRefs[2]!, { gain: 0.35, seconds: 0.5 })
  useSoundCue('air', 80, { x: 960, y: 540 }, { gain: 0.4, seconds: 0.45 })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginLeft: -40 }}>
        {LINES.map((line, i) => {
          const start = 6 + i * 8
          const strike = 40 + i * 9
          const leave = easeIn(span(frame, 80 + i * 2, 10))
          const dim = mix(1, 0.3, easeOut(span(frame, strike + 6, 8)))
          return (
            <div key={line.text} style={{ display: 'flex', alignItems: 'center', gap: 44, opacity: 1 - leave, transform: `translateY(${-leave * 46}px)` }}>
              <div ref={iconRefs[i]} style={{ opacity: dim * easeOut(span(frame, start, 6)) }}>
                <Icon name={line.icon} size={96} stroke={1.5} color={INK} p={easeOut(span(frame, start + 2, 16))} />
              </div>
              <Headline text={line.text} at={start} size={132} strike={{ at: strike, dim: 0.3 }} />
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* 02 · Крючок B (7 долей, 90–194): «Jeden system.» проявляется из размытия
   (З7), рядом встаёт переключатель и на доле щёлкает во «вкл.», ниже —
   «Od leada do JPK.» по словам с чертой акцента под «JPK.». Затем из
   переключателя кругом разливается бирюза — это фон страницы входа (П3).

   0–16    «Jeden system.» из размытия, трекинг сходится
   8       переключатель встаёт; 30 — щелчок (доля)
   40–56   вторая строка по словам; 56–68 черта под «JPK.»
   68–88   фраза целиком — читается
   88–105  круг бирюзы из переключателя на весь кадр */

/** «Jeden system. Od leada do JPK.» → две строки по первой точке. */
function splitPhrase(phrase: string): [string, string] {
  const cut = phrase.indexOf('.') + 1
  return [phrase.slice(0, cut).trim(), phrase.slice(cut).trim()]
}

export const FLOOD_START = 88

export function HookPhrase() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const [FIRST, SECOND] = splitPhrase(caption(2, useLang()))
  const size = 150
  const width = textWidth(FIRST, size, 800, -0.045)
  const gap = 52
  const toggle = { width: 132, height: 76 }
  const row = width + gap + toggle.width
  const left = 960 - row / 2
  const top = 380
  const second = { top: top + size * 1.08 + 30, size: 78 }
  const toggleAt: [number, number] = [left + width + gap + toggle.width / 2, top + (size * 1.08) / 2 + 4]
  const flood = Math.pow(span(frame, FLOOD_START, 17), 2)
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left, top }}>
        <Headline text={FIRST} at={0} size={size} mode="focus" />
      </div>
      <div style={{ position: 'absolute', left: toggleAt[0] - toggle.width / 2, top: toggleAt[1] - toggle.height / 2 }}>
        <Toggle at={8} on={30} />
      </div>
      <div style={{ position: 'absolute', left: left + 4, top: second.top }}>
        <Headline text={SECOND} at={40} size={second.size} weight={700} tracking={-0.035} stagger={4} underline={{ word: SECOND.split(/\s+/).length - 1, at: 56 }} />
      </div>
      <Iris at={toggleAt} t={flood} color={accent} start={38} />
    </AbsoluteFill>
  )
}
