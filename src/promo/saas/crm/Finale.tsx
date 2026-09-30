import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Camera, HOME, viewAt, type CameraKey } from '../kit/camera'
import { Icon } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SimbiaMark } from '../kit/mark'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { Painted, canvasOf, textWidth } from '../kit/painted'
import { CursorPath } from '../kit/pointer'
import { Label } from '../kit/surfaces'
import { Counter, Headline } from '../kit/text'
import { FONT, INK, MUTED, SHADOW, tint, useAccent } from '../kit/theme'
import { Sweep } from '../kit/transitions'
import { useCueList, type Cue2d } from './common'
import { SWEEP_HALF } from './Mobile'
import { MODULES, MODULES_EN, REASONS, REASON_CARD, REASON_NUMBER, caption, crmReasonCard, useCrmTwins } from './twins'

/* 21–24 · Dlaczego и финал. Счётчик разделов 01 → 19 (это число функций
   продукта — счётчик разрешён), под ним мелькают сами разделы; три причины
   на карточках, на третьей катится «5» языков. «Pokażemy go na żywo.» —
   камера ныряет в просвет «o»; за ней — знак SIMBIA, адрес и «Umów demo». */

/* ── 21 · 19 modułów ─────────────────────────────────────────────────────
   0–10    вторая половина шторки П12 со станции 20: корпус телефона уходит
           влево и открывает кадр
   0–14    метка «Dlaczego»
   12–78   счётчик 01 → 19 (м-счёт), под ним — разделы по порядку меню
   78–100  «modułów» встаёт; разделы сменяются фразой «Jedna baza.»
   100–198 держится; 198–210 всё уходит вверх и растворяется — к карточкам */

export const MODULES_BEATS = 14
const COUNT = { at: 12, dur: 66 }

export function WhyModules() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const out = easeIn(span(frame, MODULES_BEATS * 15 - 12, 11))
  const [, second] = splitCaption(caption(21, lang))
  const t = span(frame, COUNT.at, COUNT.dur)
  const value = mix(1, MODULES.length, 1 - Math.pow(1 - t, 3))
  const names = lang === 'en' ? MODULES_EN : MODULES
  const module = names[Math.min(names.length - 1, Math.max(0, Math.round(value) - 1))]!
  const namesOut = easeIn(span(frame, 86, 10))
  /* Цифры счётчика — табличные: ширина разряда как у «0». */
  const numberWidth = textWidth('00', 300, 800, -0.03)
  const label = lang === 'en' ? 'modules' : 'modułów'
  const labelWidth = textWidth(label, 110, 800, -0.04)
  const total = numberWidth + 44 + labelWidth
  const left = 960 - total / 2
  /* Звук: всё уходит вверх к карточкам. Счётчик, слова, черта и шторка
     звучат сами. */
  useCueList([[MODULES_BEATS * 15 - 12, 'air', [960, 540], 0.4, 0.4]])
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, transform: out > 0 ? `translateY(${-60 * out}px)` : undefined }}>
      <Label caps size={22} color={accent} style={{ position: 'absolute', left, top: 250, opacity: easeOut(span(frame, 0, 14)), letterSpacing: '0.24em' }}>
        {lang === 'en' ? 'Why' : 'Dlaczego'}
      </Label>
      <div style={{ position: 'absolute', left, top: 300 }}>
        <Counter from={1} to={MODULES.length} at={COUNT.at} duration={COUNT.dur} digits={2} size={300} weight={800} />
      </div>
      <div style={{ position: 'absolute', left: left + numberWidth + 44, top: 300 + 300 * 1.1 - 110 * 1.16 - 30 }}>
        <Headline text={label} at={COUNT.at + COUNT.dur - 4} size={110} />
      </div>
      <div style={{ position: 'absolute', left, top: 690, height: 80, fontFamily: FONT, fontSize: 52, fontWeight: 650, color: MUTED, letterSpacing: '-0.02em', opacity: (frame >= COUNT.at ? 1 : 0) * (1 - namesOut), whiteSpace: 'nowrap' }}>
        {module}
      </div>
      <div style={{ position: 'absolute', left, top: 680 }}>
        <Headline text={second ?? ''} at={92} size={80} weight={750} color={INK} underline={{ word: 1, at: 108 }} />
      </div>
      </div>
      <Sweep t={0.5 + 0.5 * span(frame, 0, SWEEP_HALF)} />
    </AbsoluteFill>
  )
}

/** «19 modułów. Jedna baza.» → [«19 modułów.», «Jedna baza.»]. */
function splitCaption(text: string): [string, string | undefined] {
  const cut = text.indexOf('.') + 1
  return cut > 0 ? [text.slice(0, cut).trim(), text.slice(cut).trim()] : [text, undefined]
}

/* ── 22 · Три причины ────────────────────────────────────────────────────
   0–40    три карточки падают сверху с наклоном через 8 кадров (pop)
   40–70   галочки по очереди (м-галочка); на третьей катится «5» (языки)
   70–226  держится: Serwer w Niemczech (EOG), Klucz zamiast hasła, 5 języków
   222–238 карточки по очереди уходят вниз и растворяются — к фразе 23 */

export const REASONS_BEATS = 16
const RS = 1.25
const CARD_W = REASON_CARD.width * RS
const CARD_H = REASON_CARD.height * RS
const GAP = 34
const ROW_LEFT = (1920 - (CARD_W * 3 + GAP * 2)) / 2

export function WhyReasons() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const cards = useCrmTwins(() => REASONS.map((_, i) => canvasOf(crmReasonCard(i))))
  /* Звук: карточки падают и встают; галочки прорисовываются (перо — не щелчок:
     рядом катится счётчик «5»); карточки уходят вниз. */
  const cardX = (i: number) => ROW_LEFT + i * (CARD_W + GAP)
  useCueList([
    ...[0, 1, 2].map((i): Cue2d => [4 + i * 8 + 5, 'thump', [cardX(i) + CARD_W / 2, 540], 0.6]),
    ...[0, 1, 2].map((i): Cue2d => [44 + i * 9, 'pen', [cardX(i) + CARD_W - 26 * RS - 22, 540 - CARD_H / 2 + 26 * RS + 22], 0.35, 0.45]),
    [REASONS_BEATS * 15 - 18, 'air', [960, 560], 0.4, 0.5],
  ])
  return (
    <AbsoluteFill>
      {cards.map((source, i) => {
        const at = 4 + i * 8
        const fall = spring(frame, at, SPRINGS.pop)
        const tilt = [-4, 1.5, 4][i]! * (1 - clamp01(fall)) + [-1.5, 0.5, 1.5][i]!
        const check = easeOut(span(frame, 44 + i * 9, 14))
        const out = easeIn(span(frame, REASONS_BEATS * 15 - 18 + i * 3, 10))
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ROW_LEFT + i * (CARD_W + GAP),
              top: 540 - CARD_H / 2,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 26 * RS,
              boxShadow: SHADOW.lifted,
              opacity: clamp01(fall * 2) * (1 - out),
              transform: `translateY(${(1 - fall) * -700 + out * 160}px) rotate(${tilt + out * [-3, 1, 3][i]!}deg)`,
            }}
          >
            <Painted source={source} style={{ inset: 0 }} />
            {i === 2 && (
              <div style={{ position: 'absolute', left: REASON_NUMBER.x * RS - 2, top: (REASON_NUMBER.y - REASON_NUMBER.size * 0.84) * RS }}>
                <Counter from={0} to={5} at={48} duration={26} digits={1} size={REASON_NUMBER.size * RS * 0.98} weight={800} color={INK} />
              </div>
            )}
            <div style={{ position: 'absolute', right: 26 * RS, top: 26 * RS, opacity: check > 0 ? 1 : 0 }}>
              <Icon name="circleCheck" size={44} color={accent} stroke={2} p={check} />
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/* ── 23 · «Pokażemy go na żywo.» ─────────────────────────────────────────
   0–16    фраза открывается шторкой слева направо (З6)
   16–36   по буквам проходит полоса света
   36–110  держится
   110–150 камера ныряет в просвет «o» в слове «go» (П10): за буквой — финал */

const FINAL_SIZE = 150
const DIVE = { at: 112, dur: 40 }
/** Слово, в «o» которого ныряет камера: «go» (оно — сам продукт); в английской
    фразе — «to», у её середины. */
const DIVE_WORD = { pl: 'go', en: 'to' }

export function FinalPhrase() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const FINAL_TEXT = caption(23, lang)
  const tracking = -0.045
  const full = textWidth(FINAL_TEXT, FINAL_SIZE, 800, tracking)
  /* Английская фраза длиннее польской: кегль — чтобы она встала в кадр с полями. */
  const size = lang === 'en' ? Math.min(FINAL_SIZE, (FINAL_SIZE * 1640) / full) : FINAL_SIZE
  const width = lang === 'en' ? textWidth(FINAL_TEXT, size, 800, tracking) : full
  const left = 960 - width / 2
  const baseline = 540 + size * 0.36
  /* Центр просвета «o» в «go»: по ширине текста до неё. Разрядка у холста
     прибавляется к ширине знака, поэтому центр — половина знака без неё;
     по высоте — середина строчных (x-height Inter ≈ 0,546 em). */
  const before = textWidth(FINAL_TEXT.slice(0, FINAL_TEXT.indexOf(`${DIVE_WORD[lang]} `) + 1), size, 800, tracking)
  const oWidth = textWidth('o', size, 800, tracking)
  const o = { x: left + before + (oWidth - tracking * size) / 2, y: baseline - size * 0.273 }
  const keys: CameraKey[] = [
    { at: 0, ...HOME },
    /* Меньший кегль — тот же просвет «o» на весь кадр в конце нырка. */
    { at: DIVE.at, dur: DIVE.dur, x: o.x, y: o.y, zoom: (70 * FINAL_SIZE) / size, ease: easeIn },
  ]
  const camera = viewAt(keys, frame)
  const reveal = easeInOut(span(frame, 0, 18))
  const sweep = span(frame, 16, 22)
  /* В конце нырка буквы растворяются: кадр — светлый просвет «o», за ним финал. */
  const dissolve = easeIn(span(frame, DIVE.at + 22, 16))
  /* Верх строки так, чтобы базовая линия глифов пришлась на baseline:
     при line-height 1,2 она на 0,964 кегля от верха. */
  const style = { position: 'absolute' as const, left, top: baseline - size * 0.964, fontFamily: FONT, fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.2, whiteSpace: 'nowrap' as const }
  /* Звук: шторка открывает фразу, по буквам идёт полоса света. Нырок — воздух
     камеры. */
  useCueList([
    [0, 'air', [960, 540], 0.5, 0.6],
    [16, 'glint', [960, 540], 0.45, 0.75],
  ])
  return (
    <AbsoluteFill>
      <Camera view={camera}>
        <div style={{ ...style, color: INK, clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% 0)`, opacity: 1 - dissolve }}>{FINAL_TEXT}</div>
        {sweep > 0 && sweep < 1 && (
          <div
            style={{
              ...style,
              color: 'transparent',
              backgroundImage: `linear-gradient(100deg, transparent ${mix(-30, 130, sweep) - 12}%, rgba(255, 255, 255, 0.85) ${mix(-30, 130, sweep)}%, transparent ${mix(-30, 130, sweep) + 12}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            {FINAL_TEXT}
          </div>
        )}
      </Camera>
    </AbsoluteFill>
  )
}

/* ── 24 · Знак SIMBIA, адрес, «Umów demo» ────────────────────────────────
   0–40    контур бесконечности прорисовывается, в нём проявляется знак
   30–60   «SIMBIA CRM»; 50–80 — «Od leada do JPK.»
   70–100  crm.simbia.eu и кнопка «Umów demo»
   130–156 курсор к кнопке, 156 — клик
   156–300 держится */

const DEMO_CLICK = 156

export function FinalMark() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const t = useT()
  const button = { x: 960 - 190, y: 800, width: 380, height: 92 }
  const buttonIn = spring(frame, 76, SPRINGS.pop)
  const press = Math.max(0, 1 - Math.abs(frame - DEMO_CLICK) / 3)
  const wave = span(frame, DEMO_CLICK, 30)
  /* Звук: адрес и кнопка встают; после клика по кнопке расходится кольцо.
     Знак, слова и клик звучат сами. */
  const buttonAt: [number, number] = [button.x + button.width / 2, button.y + button.height / 2]
  useCueList([
    [70, 'popIn', [960, 690], 0.45],
    [76, 'popIn', buttonAt, 0.7],
    [DEMO_CLICK + 1, 'glint', buttonAt, 0.45, 0.8],
  ])
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 960 - 330, top: 150 }}>
        <SimbiaMark width={660} at={0} draw={34} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 438, display: 'flex', justifyContent: 'center' }}>
        <Headline text="SIMBIA CRM" at={30} size={96} weight={800} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 572, display: 'flex', justifyContent: 'center' }}>
        <Headline text={caption(24, lang)} at={52} size={52} weight={650} color={MUTED} tracking={-0.03} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 668, textAlign: 'center', fontFamily: FONT, fontSize: 40, fontWeight: 650, color: accent, letterSpacing: '-0.01em', opacity: easeOut(span(frame, 70, 14)), transform: `translateY(${(1 - easeOut(span(frame, 70, 14))) * 16}px)` }}>
        crm.simbia.eu
      </div>
      <div
        style={{
          position: 'absolute',
          left: button.x,
          top: button.y,
          width: button.width,
          height: button.height,
          borderRadius: 24,
          background: accent,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          fontFamily: FONT,
          fontSize: 36,
          fontWeight: 750,
          letterSpacing: '-0.01em',
          boxShadow: `0 14px 34px ${tint(accent, 0.28)}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
          opacity: clamp01(buttonIn * 1.6),
          transform: `scale(${mix(0.86, 1, clamp01(buttonIn)) * (1 - 0.04 * press)})`,
        }}
      >
        {t('Umów demo', 'Book a demo')}
        <Icon name="arrowRight" size={34} color="#ffffff" stroke={2.6} />
      </div>
      {wave > 0 && wave < 1 && <div style={{ position: 'absolute', left: button.x - 40 * wave, top: button.y - 40 * wave, width: button.width + 80 * wave, height: button.height + 80 * wave, borderRadius: 24 + 40 * wave, border: `2px solid ${tint(accent, 0.45 * (1 - wave))}` }} />}
      <CursorPath
        keys={[
          { at: 128, x: button.x + button.width + 180, y: button.y + 190 },
          { at: 152, x: button.x + button.width * 0.62, y: button.y + button.height * 0.58 },
          { at: 190, x: button.x + button.width * 0.7, y: button.y + button.height * 1.9 },
        ]}
        clicks={[DEMO_CLICK]}
        hide={200}
      />
    </AbsoluteFill>
  )
}
