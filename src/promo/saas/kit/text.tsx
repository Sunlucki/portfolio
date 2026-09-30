import { useRef, type CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { DrawPath } from './draw'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from './motion'
import { useSoundCue, useSoundCues } from './sound'
import { FONT, INK, useAccent } from './theme'

/* Типографика ролика: кинетический заголовок, печать с кареткой и счётчик.
   Шрифт — Inter Variable, заголовки 800 с трекингом −0,045 em (00-SYSTEM §2). */

export interface HeadlineProps {
  text: string
  /** Кадр начала входа. */
  at?: number
  size?: number
  weight?: number
  color?: string
  /** Трекинг, em. */
  tracking?: number
  /** Кадров между словами. */
  stagger?: number
  /** rise — слова встают из-под маски с поворотом (З2); focus — фраза
      проявляется из размытия, трекинг сходится (З7). */
  mode?: 'rise' | 'focus'
  /** Черта акцента под словом (номер слова с 0) — рисуется от кадра at. */
  underline?: { word: number; at: number; color?: string }
  /** Зачёркивание всей строки от кадра at; затем строка гаснет до dim. */
  strike?: { at: number; color?: string; dim?: number }
  /** Кадр ухода: слова падают обратно под маску, быстрее входа. */
  exit?: number
  style?: CSSProperties
}

/** Кинетический заголовок: слова встают из-под маски с перелётом (pop), черта
    акцента прорисовывается под ключевым словом, зачёркивание — поверх. */
export function Headline({
  text,
  at = 0,
  size = 120,
  weight = 800,
  color = INK,
  tracking = -0.045,
  stagger = 3,
  mode = 'rise',
  underline,
  strike,
  exit = Infinity,
  style,
}: HeadlineProps) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const words = text.split(/\s+/)
  const self = useRef<HTMLDivElement>(null)
  /* Слова встают — мягкий хлопок на каждое; фраза из размытия — вздох воздуха;
     черта и зачёркивание — перо; уход — короткий воздух. */
  /* Хлопок не на каждое слово: при шаге 3 кадра это 10 в секунду. Звучит
     каждое k-е слово — не чаще раза в 5 кадров (6 в секунду). */
  const every = Math.max(1, Math.ceil(5 / Math.max(1, stagger)))
  useSoundCues('popIn', mode === 'rise' ? words.map((_, i) => at + i * stagger).filter((_, i) => i % every === 0) : [], self, { gain: 0.45 })
  useSoundCue('air', mode === 'focus' ? at : null, self, { seconds: 0.6 })
  useSoundCue('pen', underline?.at, self, { seconds: 0.4 })
  useSoundCue('pen', strike?.at, self, { seconds: 0.3 })
  useSoundCue('air', Number.isFinite(exit) ? exit : null, self, { gain: 0.5, seconds: 0.4 })
  const focus = easeOut(span(frame, at, 16))
  const struck = strike ? easeInOut(span(frame, strike.at, 8)) : 0
  const dim = strike ? mix(1, strike.dim ?? 0.3, easeOut(span(frame, strike.at + 6, 8))) : 1
  return (
    <div
      ref={self}
      style={{
        position: 'relative',
        display: 'inline-block',
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.08,
        letterSpacing: mode === 'focus' ? `${mix(0.2, tracking, focus)}em` : `${tracking}em`,
        color,
        whiteSpace: 'nowrap',
        opacity: (mode === 'focus' ? focus : 1) * dim,
        filter: mode === 'focus' && focus < 1 ? `blur(${16 * (1 - focus)}px)` : undefined,
        ...style,
      }}
    >
      {words.map((word, i) => {
        const rise = mode === 'rise' ? spring(frame, at + i * stagger, SPRINGS.pop) : 1
        const fall = easeIn(span(frame, exit + i * 2, 9))
        const shift = (1 - rise) * 105 + fall * 105
        const line = underline && underline.word === i ? easeInOut(span(frame, underline.at, 12)) : 0
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', marginRight: i < words.length - 1 ? '0.24em' : 0 }}>
            <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', padding: '0.06em 0.04em 0.16em', margin: '-0.06em -0.04em -0.16em' }}>
              <span
                style={{
                  display: 'inline-block',
                  transform: `perspective(800px) translateY(${shift}%) rotateX(${mode === 'rise' ? (1 - clamp01(rise)) * 55 : 0}deg)`,
                  transformOrigin: '50% 100%',
                  opacity: clamp01(rise * 1.6) * (1 - fall),
                }}
              >
                {word}
              </span>
            </span>
            {line > 0 && (
              <span
                style={{
                  position: 'absolute',
                  left: '-0.02em',
                  right: '-0.02em',
                  bottom: '-0.1em',
                  height: '0.075em',
                  borderRadius: 999,
                  background: underline?.color ?? accent,
                  clipPath: `inset(0 ${(1 - line) * 100}% 0 0 round 999px)`,
                  transform: 'rotate(-0.6deg)',
                }}
              />
            )}
          </span>
        )
      })}
      {struck > 0 && (
        <span
          style={{
            position: 'absolute',
            left: '-0.04em',
            right: '-0.06em',
            top: '53%',
            height: '0.07em',
            borderRadius: 999,
            background: strike?.color ?? color,
            clipPath: `inset(0 ${(1 - struck) * 100}% 0 0 round 999px)`,
            transform: 'rotate(-0.8deg)',
          }}
        />
      )}
    </div>
  )
}

/** Печать (м-ввод): знак за знаком, speed кадров на знак, мигающая каретка.
    Каретка горит, пока идёт печать, и мигает раз в секунду после. */
export function Typing({
  text,
  at = 0,
  speed = 2,
  caret = true,
  caretColor,
  style,
}: {
  text: string
  at?: number
  speed?: number
  caret?: boolean
  caretColor?: string
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const self = useRef<HTMLSpanElement>(null)
  /* Клавиша на каждый знак: знак i появляется в кадре at + i · speed. */
  useSoundCues('key', Array.from(text, (_, i) => at + i * speed), self)
  const count = Math.max(0, Math.min(text.length, Math.floor((frame - at) / speed) + 1))
  const typing = frame >= at && count < text.length
  const on = frame >= at && (typing || Math.floor((frame - at - text.length * speed) / 15) % 2 === 0)
  return (
    <span ref={self} style={{ whiteSpace: 'pre', ...style }}>
      {frame >= at ? text.slice(0, count) : ''}
      {caret && (
        <span
          style={{
            display: 'inline-block',
            width: '0.08em',
            minWidth: 2,
            height: '1.1em',
            marginLeft: '0.04em',
            verticalAlign: '-0.18em',
            borderRadius: 2,
            background: caretColor ?? accent,
            opacity: on ? 1 : 0,
          }}
        />
      )}
    </span>
  )
}

/** Счётчик-барабан (м-счёт) — только для функций продукта («19 modułów»,
    «7 języków»), не для демо-данных (правило владельца). Разряды катятся, как
    в механическом счётчике: младший крутится, старший переходит, когда
    младший проходит девятку. */
export function Counter({
  from = 0,
  to,
  at = 0,
  duration = 36,
  digits,
  size = 120,
  weight = 800,
  color = INK,
  style,
}: {
  from?: number
  to: number
  at?: number
  duration?: number
  /** Сколько разрядов показать (с ведущими нулями). */
  digits?: number
  size?: number
  weight?: number
  color?: string
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLSpanElement>(null)
  /* Разгон сразу, торможение к последней цифре — без перелёта: счётчик не
     проскакивает число и не возвращается. */
  const valueAt = (f: number) => mix(from, to, 1 - Math.pow(1 - span(f, at, duration), 3))
  const value = valueAt(frame)
  /* Щелчок барабана, когда младший разряд переходит на новую цифру, — не чаще
     раза в 2 кадра (15 в секунду, как печать): на разгоне цифры меняются
     каждый кадр. Смена между проверками даёт один щелчок. */
  const even = (frame - Math.round(at)) % 2 === 0
  useSoundCue('tick', even && Math.floor(value) !== Math.floor(valueAt(frame - 2)) ? frame : null, self)
  const places = digits ?? String(Math.max(Math.abs(from), Math.abs(to))).length
  const lineHeight = 1.1
  return (
    <span ref={self} style={{ display: 'inline-flex', fontFamily: FONT, fontSize: size, fontWeight: weight, color, lineHeight, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', ...style }}>
      {Array.from({ length: places }, (_, i) => {
        const k = places - 1 - i
        const unit = Math.pow(10, k)
        const whole = Math.floor(value / unit)
        const carry = k === 0 ? value - Math.floor(value) : clamp01((value % unit) - (unit - 1))
        const position = (((whole + carry) % 10) + 10) % 10
        return (
          <span key={i} style={{ display: 'inline-block', height: `${lineHeight}em`, overflow: 'hidden' }}>
            <span style={{ display: 'flex', flexDirection: 'column', transform: `translateY(${-position * lineHeight}em)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit, j) => (
                <span key={j} style={{ height: `${lineHeight}em` }}>
                  {digit}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/** Прорисованное подчёркивание-маркер под произвольным блоком (в его слое). */
export function Marker({ x, y, width, p, color, thickness = 6 }: { x: number; y: number; width: number; p: number; color?: string; thickness?: number }) {
  const accent = useAccent()
  return <DrawPath d={`M ${x} ${y + 2} Q ${x + width / 2} ${y - 4}, ${x + width} ${y}`} p={p} color={color ?? accent} width={thickness} />
}
