import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Icon } from '../kit/draw'
import { useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, noise, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Headline } from '../kit/text'
import { FONT, INK, type Point } from '../kit/theme'
import { useSoundCue } from '../kit/sound'
import { Toggle } from '../kit/ui'
import { useSoundPoints } from './fx'
import { Glyph, type GlyphName } from './glyphs'
import { ACCENT, caption } from './twins'

/* 01 · Крючок A (7 долей): «Ogłoszenia. Telefony. Teczki.» — табло (З4):
   каждая буква — барабан из случайных знаков, буквы встают слева направо с
   отскоком; перед словом прорисовывается иконка. Затем строки зачёркивает
   золотая черта (З7), они гаснут до 30% и уходят вверх.

   6–40    строки через 8 кадров: иконка рисуется, буквы крутятся и встают
   50–70   зачёркивание по очереди через 7 кадров, строка гаснет до 30%
   70–92   всё зачёркнуто — читается
   92–110  строки уходят вверх (уход — в хвосте, под следующей сценой) */

/** Строки табло — предложения подписи станции 1 (по-польски это слова,
    по-английски — «Job ads.», «Phone calls.», «Paper folders.»). */
function hookLines(lang: Lang): { text: string; icon: GlyphName }[] {
  const words = caption(1, lang).split(/(?<=\.)\s+/)
  const icons: GlyphName[] = ['megaphone', 'phone', 'folder']
  return words.map((text, i) => ({ text, icon: icons[i] ?? 'megaphone' }))
}

export function HookBoard() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const LINES = hookLines(lang)
  const size = 132
  /* Звук (сценарий: «стрёкот табло, три тика»): буква-барабан встаёт — щелчок в
     её месте, слева направо по строкам; три тика — золотые черты зачёркивания. */
  const board = boardSound(size, LINES)
  useSoundPoints('key', board.clicks, { gain: 0.9 })
  useSoundPoints('tick', board.strikes)
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginLeft: -40 }}>
        {LINES.map((line, i) => {
          const start = 6 + i * 8
          const strike = 50 + i * 7
          const leave = easeIn(span(frame, 92 + i * 2, 12))
          const dim = mix(1, 0.3, easeOut(span(frame, strike + 6, 8)))
          const struck = easeInOut(span(frame, strike, 9))
          return (
            <div key={line.text} style={{ display: 'flex', alignItems: 'center', gap: 44, opacity: 1 - leave, transform: `translateY(${-leave * 60}px)` }}>
              <div style={{ opacity: dim * easeOut(span(frame, start, 6)) }}>
                <Glyph name={line.icon} size={96} stroke={1.5} color={INK} p={easeOut(span(frame, start + 2, 18))} />
              </div>
              <div style={{ position: 'relative', opacity: dim }}>
                <DrumText text={line.text} at={start} size={size} seed={i * 17} />
                {struck > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '-0.04em',
                      right: '-0.06em',
                      top: '52%',
                      height: '0.075em',
                      fontSize: size,
                      borderRadius: 999,
                      background: ACCENT,
                      clipPath: `inset(0 ${(1 - struck) * 100}% 0 0 round 999px)`,
                      transform: 'rotate(-0.8deg)',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/** Где на табло щёлкают буквы и где тикают черты (px кадра): колонка строк стоит
    по центру кадра со сдвигом marginLeft −40, строка — иконка 96, зазор 44 и
    текст; буква встаёт пружиной snap через ~6 кадров после старта. Щелчки
    прорежены до 15 в секунду, как печать. */
function boardSound(size: number, LINES: { text: string }[]): { clicks: { at: number; x: number; y: number }[]; strikes: { at: number; x: number; y: number }[] } {
  const text = (value: string) => textWidth(value, size, 800, -0.045)
  const column = Math.max(...LINES.map((line) => 96 + 44 + text(line.text)))
  const left = 960 - column / 2 - 20 + 96 + 44
  const row = size * 1.12
  const top = 540 - (LINES.length * row + (LINES.length - 1) * 14) / 2
  const all: { at: number; x: number; y: number }[] = []
  const strikes = LINES.map((line, i) => {
    const y = top + i * (row + 14) + row / 2
    Array.from(line.text).forEach((ch, k) => {
      if (ch === ' ') return
      all.push({ at: Math.ceil(6 + i * 8 + k * 1.6 + 6), x: left + text(line.text.slice(0, k)) + text(ch) / 2, y })
    })
    return { at: 50 + i * 7, x: left + text(line.text) / 2, y }
  })
  all.sort((a, b) => a.at - b.at)
  const clicks: { at: number; x: number; y: number }[] = []
  for (const click of all) if (!clicks.length || click.at - clicks[clicks.length - 1]!.at >= 2) clicks.push(click)
  return { clicks, strikes }
}

/* З4 · табло: буква — барабан. Лента из восьми случайных знаков и своей буквы
   прокручивается вниз и встаёт пружиной snap (отскок ~3%); буквы — слева
   направо через 1,6 кадра. Пока лента летит, её размывает по вертикали. */
const GLYPHS = 'ABCDEFGHIJKLMNOPRSTUWZĄĘŁŃÓŚŻabcdefghijklmnoprstuwyząęłńóśż0123456789'
/** В английском ролике на ленте — латиница без польских букв. */
const GLYPHS_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const TURNS = 8

export function DrumText({ text, at, size, seed = 0, weight = 800, color = INK, step = 1.6 }: { text: string; at: number; size: number; seed?: number; weight?: number; color?: string; step?: number }) {
  const frame = useCurrentFrame()
  const glyphs = useLang() === 'en' ? GLYPHS_EN : GLYPHS
  const line = 1.12
  return (
    <span style={{ display: 'inline-flex', fontFamily: FONT, fontSize: size, fontWeight: weight, color, letterSpacing: '-0.045em', lineHeight: line, whiteSpace: 'pre' }}>
      {Array.from(text).map((ch, i) => {
        const start = at + i * step
        const roll = spring(frame, start, SPRINGS.snap)
        const shown = frame >= start - 1
        const speed = Math.abs(spring(frame + 1, start, SPRINGS.snap) - roll) * TURNS
        const strip = [...Array.from({ length: TURNS }, (_, k) => glyphs[Math.floor(noise(seed + i * 13, k) * glyphs.length)] ?? 'A'), ch]
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', height: `${line}em`, clipPath: 'inset(0 -30% 0 -30%)', opacity: shown ? clamp01((frame - start + 2) / 3) : 0 }}>
            <span style={{ visibility: 'hidden' }}>{ch === ' ' ? ' ' : ch}</span>
            {ch !== ' ' && (
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: `translate(-50%, ${-roll * TURNS * line}em)`,
                  filter: speed > 0.35 ? `blur(${Math.min(8, speed * 2.4).toFixed(2)}px)` : undefined,
                }}
              >
                {strip.map((glyph, k) => (
                  <span key={k} style={{ height: `${line}em` }}>
                    {glyph}
                  </span>
                ))}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/* 02 · Крючок B (10 долей): «Kierowcy przychodzą sami.» проявляется из
   размытия (З7), рядом встаёт переключатель и щёлкает во «вкл.» золотом. Ниже —
   путь кандидата по словам (З5): «kalkulator → zgłoszenie → umowa →» и слово,
   которое меняется на лету: Dokumenty → Auto → Na linii (последнее встаёт с
   перелётом и золотой чертой). Слово без пилюли — только текст (правило
   владельца). Уход: строки падают, переключатель сжимается в золотую точку —
   из неё следующая сцена раскрывает экран телефона.

   0–16     первая строка из размытия; 10 — переключатель, 32 — щелчок
   44–70    путь по словам, стрелки прорисовываются
   76, 90, 104  смена слова; 108–120 черта под «Na linii»
   120–138  фраза целиком — читается
   138–150  уход; переключатель → точка */

/** Путь кандидата по словам: три слова пути и слово, которое меняется. */
const WORDS: Record<Lang, { path: string[]; swap: string[] }> = {
  pl: { path: ['kalkulator', 'zgłoszenie', 'umowa'], swap: ['Dokumenty', 'Auto', 'Na linii'] },
  en: { path: ['calculator', 'application', 'contract'], swap: ['Documents', 'Car', 'On the road'] },
}
const SWAP_AT = [76, 90, 104]
const LEAVE = 138

const FIRST = { size: 112, top: 360 }
const TOGGLE = { width: 132, height: 76, gap: 48 }
const SECOND = { size: 64, gap: 26 }

function layout(lang: Lang) {
  const width = textWidth(caption(2, lang), FIRST.size, 800, -0.045)
  const row = width + TOGGLE.gap + TOGGLE.width
  const left = 960 - row / 2
  const toggle: Point = [left + width + TOGGLE.gap + TOGGLE.width / 2, FIRST.top + (FIRST.size * 1.08) / 2 + 4]
  return { left, toggle }
}

/** Где в кадре точка, в которую сжался переключатель (центр ползунка во «вкл.»):
    из неё сцена калькулятора раскрывает экран телефона. */
export function hookDot(lang: Lang = 'pl'): Point {
  const { toggle } = layout(lang)
  return [toggle[0] + 94 - TOGGLE.width / 2, toggle[1]]
}

export function HookPhrase() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const PHRASE = caption(2, lang)
  const { path: PATH_WORDS, swap: SWAP } = WORDS[lang]
  const { left, toggle } = layout(lang)
  const leave = easeIn(span(frame, LEAVE, 10))
  const squeeze = easeInOut(span(frame, LEAVE, 10))
  const dot = hookDot(lang)

  /* Вторая строка: слова пути, стрелки и слово, которое меняется. */
  const wordW = PATH_WORDS.map((word) => textWidth(word, SECOND.size, 700, -0.03))
  const arrow = SECOND.size * 0.72
  const swapW = SWAP.map((word) => textWidth(word, SECOND.size, 800, -0.03))
  const current = SWAP_AT.reduce((last, at, i) => (frame >= at ? i : last), 0)
  const grow = spring(frame, SWAP_AT[current]!, SPRINGS.pop)
  const slot = current === 0 ? swapW[0]! : mix(swapW[current - 1]!, swapW[current]!, grow)
  const rowW = wordW.reduce((sum, w) => sum + w, 0) + 3 * (arrow + SECOND.gap * 2) + swapW[SWAP.length - 1]!
  const rowLeft = 960 - rowW / 2
  const secondTop = FIRST.top + FIRST.size * 1.08 + 44
  let x = rowLeft

  const pieces = PATH_WORDS.map((word, i) => {
    const at = 44 + i * 8
    const wx = x
    x += wordW[i]! + SECOND.gap
    const ax = x
    x += arrow + SECOND.gap
    return { word, at, wx, ax }
  })
  const swapX = x
  const underline = easeInOut(span(frame, 108, 12))

  /* Звук: слово пути встаёт, меняется, «Na linii» встаёт с перелётом и чертой;
     на уходе переключатель сжимается в точку. */
  const swapAt = { x: swapX + slot / 2, y: secondTop + SECOND.size * 0.55 }
  useSoundCue('popIn', SWAP_AT[0], swapAt, { gain: 0.55 })
  useSoundCue('flip', SWAP_AT[1], swapAt, { gain: 0.5 })
  useSoundCue('popIn', SWAP_AT[2], swapAt, { gain: 0.7 })
  useSoundCue('pen', 108, { x: swapAt.x, y: secondTop + SECOND.size * 1.14 }, { gain: 0.8, seconds: 0.4 })
  useSoundCue('popOut', LEAVE, { x: toggle[0], y: toggle[1] }, { gain: 0.5 })

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left, top: FIRST.top, opacity: 1 - leave, transform: `translateY(${leave * 40}px)` }}>
        <Headline text={PHRASE} at={0} size={FIRST.size} mode="focus" />
      </div>
      <div
        style={{
          position: 'absolute',
          left: toggle[0] - TOGGLE.width / 2,
          top: toggle[1] - TOGGLE.height / 2,
          opacity: 1 - easeIn(span(frame, LEAVE + 4, 6)),
          transform: `scale(${mix(1, 0.3, squeeze)})`,
          transformOrigin: `${dot[0] - (toggle[0] - TOGGLE.width / 2)}px ${TOGGLE.height / 2}px`,
        }}
      >
        <Toggle at={10} on={32} />
      </div>
      {/* Путь по словам: слова встают из-под маски, стрелки рисуются. */}
      <div style={{ position: 'absolute', left: 0, top: secondTop, width: 1920, height: SECOND.size * 1.3, opacity: 1 - leave, transform: `translateY(${leave * 40}px)` }}>
        {pieces.map(({ word, at, wx, ax }, i) => (
          <div key={word}>
            <div style={{ position: 'absolute', left: wx, top: 0 }}>
              <Headline text={word} at={at} size={SECOND.size} weight={700} tracking={-0.03} color="#374151" />
            </div>
            <div style={{ position: 'absolute', left: ax, top: SECOND.size * 0.2 }}>
              <Icon name="arrowRight" size={arrow} stroke={2.2} color={ACCENT} p={easeOut(span(frame, at + 5 + i, 12))} />
            </div>
          </div>
        ))}
        <SwapWord frame={frame} x={swapX} width={slot} current={current} underline={underline} words={SWAP} />
      </div>
      {/* Переключатель сжимается в золотую точку — из неё раскроется экран. */}
      {frame >= LEAVE + 2 && (
        <div
          style={{
            position: 'absolute',
            left: dot[0] - 15,
            top: dot[1] - 15,
            width: 30,
            height: 30,
            borderRadius: 15,
            background: `linear-gradient(135deg, #FFBF00, #E68600)`,
            transform: `scale(${easeOut(span(frame, LEAVE + 2, 8))})`,
          }}
        />
      )}
    </AbsoluteFill>
  )
}

/** Слово, которое меняется (З5 без пилюли): старое уходит вверх с размытием,
    новое въезжает снизу; последнее встаёт с перелётом, под ним — золотая черта. */
function SwapWord({ frame, x, width, current, underline, words: SWAP }: { frame: number; x: number; width: number; current: number; underline: number; words: string[] }) {
  const size = SECOND.size
  const at = SWAP_AT[current]!
  const enter = spring(frame, at, current === SWAP.length - 1 ? SPRINGS.pop : SPRINGS.snap)
  const prev = current > 0 ? SWAP[current - 1] : null
  const out = current > 0 ? easeIn(span(frame, at, 6)) : 1
  const visible = frame >= SWAP_AT[0]! - 1
  if (!visible) return null
  const word = (text: string, shift: number, blur: number, opacity: number) => (
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        whiteSpace: 'nowrap',
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.08,
        color: INK,
        transform: `translateY(${shift}%)`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        opacity,
      }}
    >
      {text}
    </span>
  )
  return (
    <div style={{ position: 'absolute', left: x, top: 0, width, height: size * 1.3, clipPath: 'inset(-10% -40% -10% -10%)' }}>
      {prev && out < 1 && word(prev, -out * 110, out * 6, 1 - out)}
      {word(SWAP[current]!, (1 - clamp01(enter)) * 110, (1 - clamp01(enter)) * 6, clamp01(enter * 1.5))}
      {underline > 0 && (
        <span
          style={{
            position: 'absolute',
            left: -2,
            width: width + 4,
            top: size * 1.1,
            height: size * 0.075,
            borderRadius: 999,
            background: ACCENT,
            clipPath: `inset(0 ${(1 - underline) * 100}% 0 0 round 999px)`,
            transform: 'rotate(-0.6deg)',
          }}
        />
      )}
    </div>
  )
}
