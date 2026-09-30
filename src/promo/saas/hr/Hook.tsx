import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Connector } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { easeIn, easeInOut, easeOut, mix, span, spring, SPRINGS, clamp01 } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { useSoundCue } from '../kit/sound'
import { Headline } from '../kit/text'
import { INK, MUTED, useAccent } from '../kit/theme'
import { Toggle } from '../kit/ui'
import type { HrIconName } from './icons'
import type { IconName } from '../kit/icons'
import { Glyph } from './parts'
import { caption } from './twins'

/* 01 · Крючок A (8 долей): «Kartki. Podpisy. Przepisywanie.» — три старых
   способа учёта встают столбиком, перед каждым контуром рисуется иконка
   (планшет с листами, подпись, клавиатура — перепечатка); затем каждое слово
   зачёркивается и гаснет, строки уходят вверх.

   6–42     строки встают через 9 кадров, иконки прорисовываются
   54–84    зачёркивание по очереди через 10 кадров, строка гаснет до 30%
   84–100   все три зачёркнуты — читаются
   100–118  строки уходят вверх (уход в хвосте сцены, под следующей) */

const ICONS: HrIconName[] = ['clipboardList', 'signature', 'keyboard']

export function HookWords() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const words = caption(1, lang).split(/\s+/)
  /* Звук: зачёркнутые строки уходят вверх — короткий воздух (вход слов и
     зачёркивание озвучивает <Headline>). */
  useSoundCue('air', 100, { x: 920, y: 540 }, { gain: 0.35, seconds: 0.5 })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: -40 }}>
        {words.map((word, i) => {
          const start = 6 + i * 9
          const strike = 54 + i * 10
          const leave = easeIn(span(frame, 100 + i * 2, 10))
          const dim = mix(1, 0.3, easeOut(span(frame, strike + 6, 8)))
          return (
            <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 44, opacity: 1 - leave, transform: `translateY(${-leave * 46}px)` }}>
              <div style={{ opacity: dim * easeOut(span(frame, start, 6)) }}>
                <Glyph name={ICONS[i] ?? 'clipboardList'} size={96} stroke={1.5} color={INK} p={easeOut(span(frame, start + 2, 18))} />
              </div>
              <Headline text={word} at={start} size={132} strike={{ at: strike, dim: 0.3 }} />
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/* 02 · Крючок B (10 долей): «Godziny liczą / się same.» проявляется из
   размытия (З7), рядом со второй строкой встаёт переключатель и на доле
   щёлкает во «вкл.». Ниже рисуется путь часов — QR → GPS → Grafik →
   Nadgodziny → Płace: иконки контуром, между ними линии с бегущими точками
   (данные идут сами). Из переключателя кругом раскрывается следующая сцена
   (П3) — её рисует сама сцена «Start» (Iris с детьми).

   0–22     строки из размытия; 14 — переключатель встаёт, 36 — щелчок
   44–92    узлы пути по очереди через 10 кадров, линии между ними
   92–150   фраза и путь — читаются, бусины бегут */

const FLOW: { label: string; en: string; icon: HrIconName | IconName }[] = [
  { label: 'QR', en: 'QR', icon: 'qrCode' },
  { label: 'GPS', en: 'GPS', icon: 'mapPin' },
  { label: 'Grafik', en: 'Schedule', icon: 'calendarDays' },
  { label: 'Nadgodziny', en: 'Overtime', icon: 'timer' },
  { label: 'Płace', en: 'Payroll', icon: 'banknote' },
]

const SIZE = 150
const TOGGLE = { width: 132, height: 76, gap: 48 }
const LINE_TOP = 250

/** Где переключатель крючка, px кадра: из него раскрывается сцена «Start».
    Считать в рендере (после <FontGate>): ширина строки — по загруженному Inter. */
export function hookToggle(lang: Lang): [number, number] {
  const [, second] = hookLines(lang)
  const width = textWidth(second, SIZE, 800, -0.045)
  const first = textWidth(hookLines(lang)[0], SIZE, 800, -0.045)
  const left = 960 - Math.max(first, width + TOGGLE.gap + TOGGLE.width) / 2
  return [left + width + TOGGLE.gap + TOGGLE.width / 2, LINE_TOP + SIZE * 1.08 + (SIZE * 1.08) / 2 + 6]
}

/** Фраза в две строки. Английская «Hours that count / themselves.» режется
    перед последним словом: строки ровнее, и вторая с переключателем не шире кадра. */
function hookLines(lang: Lang): [string, string] {
  const words = caption(2, lang).split(/\s+/)
  const cut = lang === 'en' ? words.length - 1 : Math.ceil(words.length / 2)
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

export function HookPhrase() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const [first, second] = hookLines(lang)
  const firstWidth = textWidth(first, SIZE, 800, -0.045)
  const secondWidth = textWidth(second, SIZE, 800, -0.045)
  const left = 960 - Math.max(firstWidth, secondWidth + TOGGLE.gap + TOGGLE.width) / 2
  const [tx, ty] = hookToggle(lang)
  const rowY = 700
  const step = 300
  const nodeX = (i: number) => 960 + (i - (FLOW.length - 1) / 2) * step
  /* Звук: узлы пути встают слева направо (линии между ними — перо <Connector>),
     последний, «Płace», — громче. */
  useSoundCue('popIn', 46, { x: nodeX(0), y: rowY }, { gain: 0.45 })
  useSoundCue('popIn', 56, { x: nodeX(1), y: rowY }, { gain: 0.45 })
  useSoundCue('popIn', 66, { x: nodeX(2), y: rowY }, { gain: 0.45 })
  useSoundCue('popIn', 76, { x: nodeX(3), y: rowY }, { gain: 0.45 })
  useSoundCue('popIn', 86, { x: nodeX(4), y: rowY }, { gain: 0.65 })
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left, top: LINE_TOP }}>
        <Headline text={first} at={0} size={SIZE} mode="focus" />
      </div>
      <div style={{ position: 'absolute', left, top: LINE_TOP + SIZE * 1.08 }}>
        <Headline text={second} at={6} size={SIZE} mode="focus" />
      </div>
      <div style={{ position: 'absolute', left: tx - TOGGLE.width / 2, top: ty - TOGGLE.height / 2 }}>
        <Toggle at={14} on={36} />
      </div>
      {FLOW.slice(0, -1).map((_, i) => (
        <Connector key={i} from={[nodeX(i) + 52, rowY]} to={[nodeX(i + 1) - 52, rowY]} p={easeInOut(span(frame, 50 + i * 10, 12))} frame={frame} beads={2} period={30} />
      ))}
      {FLOW.map((node, i) => {
        const start = 44 + i * 10
        const rise = spring(frame, start + 2, SPRINGS.pop)
        const last = i === FLOW.length - 1
        return (
          <div key={node.label} style={{ position: 'absolute', left: nodeX(i) - 140, top: rowY - 36, width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Glyph name={node.icon} size={72} stroke={1.6} color={last ? accent : INK} p={easeOut(span(frame, start, 18))} />
            <div style={{ marginTop: 22, overflow: 'hidden', paddingBottom: 6 }}>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: last ? accent : MUTED, transform: `translateY(${(1 - clamp01(rise)) * 100}%)`, opacity: clamp01(rise * 1.5) }}>{pick(lang, node.label, node.en)}</div>
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
