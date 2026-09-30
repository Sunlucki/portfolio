import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, viewAt, type CameraKey } from '../kit/camera'
import { useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { textWidth } from '../kit/painted'
import { Cursor, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { AppWindow, Phone } from '../kit/surfaces'
import { FONT, INK, type Point } from '../kit/theme'
import { Live } from './screen'
import { GOLD, TB, caption, drawCallButton, drawFleet, drawLogo, drawNativePanel, tag } from './twins'

/* 22–23 · Finał (19 долей). «Porozmawiajmy o Twojej flocie.» открывается
   диагональной шторкой, по буквам проходит золотая полоса света (З6). Камера
   ныряет в просвет отдельного слова «o» (П10): внутри буквы уже виден знак
   TAXI BOSS — металлическое золото, адрес taxiboss.pl и кнопка
   «Porozmawiajmy»; по бокам встают панель владельца и приложение водителя.
   Курсор нажимает кнопку, от неё расходятся кольца.

   0–26 / 10–36  шторка по строкам; 40–64 — полоса света
   64–100   фраза стоит — читается
   100–124  нырок в «o»: зум ×70, внутри буквы — финальный кадр
   124–150  знак, адрес и кнопка встают; по бокам — панель и телефон
   150–240  выноска «Porozmawiajmy» (подпись станции 23, вопрос владельцу)
   176–204  курсор к кнопке; 204 — клик, кольца
   204–285  финальный кадр держится */

export const FINAL_BEATS = 19

const T = { line1: 0, line2: 10, sweep: 40, dive: 100, lockup: 124, devices: 128, callout: 150, click: 204 }
const DIVE = 24

const SIZE = 150
const TRACK = -0.045

/** Строки фразы и номер буквы «o» во второй строке, в которую ныряет камера:
    по-польски — отдельное слово «o» в начале строки («o Twojej flocie.»),
    по-английски — «o» в «about» («about your fleet.»). */
function phrase(lang: Lang): { lines: string[]; dive: number } {
  const text = caption(22, lang)
  const cut = text.indexOf(lang === 'en' ? ' about ' : ' o ')
  return { lines: [text.slice(0, cut), text.slice(cut + 1)], dive: lang === 'en' ? 2 : 0 }
}

/** Раскладка заголовка в кадре: базовые линии строк и центр буквы «o». */
function headline(lang: Lang) {
  const { lines, dive } = phrase(lang)
  const widths = lines.map((line) => textWidth(line, SIZE, 800, TRACK))
  const top = 330
  const baselines = [top + SIZE * 0.92, top + SIZE * 0.92 + SIZE * 1.1]
  const lefts = widths.map((w) => 960 - w / 2)
  /* Левый край буквы «o»: у польской — край строки, у английской — после «ab». */
  const start = dive ? lefts[1]! + textWidth(lines[1]!.slice(0, dive), SIZE, 800, TRACK) : lefts[1]!
  const canvas = document.createElement('canvas').getContext('2d')
  let center: Point = [start + SIZE * 0.29, baselines[1]! - SIZE * 0.27]
  if (canvas) {
    canvas.font = `800 ${SIZE}px "Inter Variable", Inter, sans-serif`
    const m = canvas.measureText('o')
    center = [start + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, baselines[1]! - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2]
  }
  return { lines, widths, baselines, lefts, center }
}

/* ── Финальный кадр ── */

const LOGO = { width: 1240, height: 240, y: 206 }
const BUTTON = { width: 460, height: 104, x: 960 - 230, y: 628 }
const DESK_SMALL = { scale: 0.36, x: 70, y: 575 }
const PHONE_SMALL = { scale: 0.5, x: 1640, y: 520 }

const CURSOR_KEYS = [
  { at: 176, x: 1320, y: 930 },
  { at: 200, x: BUTTON.x + BUTTON.width * 0.62, y: BUTTON.y + BUTTON.height * 0.58 },
  { at: 236, x: BUTTON.x + BUTTON.width * 0.7, y: BUTTON.y + BUTTON.height * 0.66 },
]

export function Final() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const layout = useMemo(() => headline(lang), [lang])
  const LINES = layout.lines
  const camera = viewAt(
    [
      { at: 0, ...HOME },
      { at: T.dive, dur: DIVE, ease: (t: number) => t * t * t, x: layout.center[0], y: layout.center[1], zoom: 70 },
      { at: T.dive + DIVE, dur: 1, ...HOME },
    ] satisfies CameraKey[],
    frame,
  )
  const diving = frame >= T.dive && frame < T.dive + DIVE
  const gone = frame >= T.dive + DIVE
  const [ox, oy] = camera.project(layout.center[0], layout.center[1])
  const hole = SIZE * 0.1 * camera.zoom
  const sweep = easeInOut(span(frame, T.sweep, 24))
  const cursor = cursorAt(CURSOR_KEYS, frame, [T.click], 250)

  /* Звук: шторка открывает фразу, золотая полоса света по буквам; нырок в «o» —
     подъём к знаку, знак — блик; кнопка встаёт; клик «Porozmawiajmy» — успех. */
  const phrase = { x: 960, y: (layout.baselines[0]! + layout.baselines[1]!) / 2 - SIZE * 0.35 }
  const button = { x: BUTTON.x + BUTTON.width / 2, y: BUTTON.y + BUTTON.height / 2 }
  const press = cursorAt(CURSOR_KEYS, T.click)
  useSoundCue('air', T.line1, phrase, { gain: 0.5, seconds: 1.2 })
  useSoundCue('glint', T.sweep, phrase, { gain: 0.5, seconds: 0.8 })
  useSoundCue('riser', T.dive, { x: layout.center[0], y: layout.center[1] }, { gain: 0.8, seconds: DIVE / 30 })
  useSoundCue('glint', T.dive + DIVE, { x: 960, y: LOGO.y + LOGO.height / 2 }, { gain: 0.8, seconds: 1 })
  useSoundCue('popIn', T.lockup + 6, button, { gain: 0.6 })
  useSoundCue('click', T.click, { x: press.x, y: press.y }, { gain: 0.9 })
  useSoundCue('success', T.click + 4, button, { gain: 0.8 })

  return (
    <AbsoluteFill>
      {/* Финальный кадр: виден в просвете «o» во время нырка, потом — целиком. */}
      {frame >= T.dive && (
        <AbsoluteFill style={{ clipPath: gone ? undefined : `circle(${hole}px at ${ox}px ${oy}px)` }}>
          <Lockup frame={frame} cursor={cursor} />
        </AbsoluteFill>
      )}

      {!gone && (
        <Camera view={camera}>
          <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            <defs>
              {LINES.map((_, i) => {
                /* Диагональная шторка: край со скосом идёт слева направо. */
                const p = easeInOut(span(frame, i === 0 ? T.line1 : T.line2, 26))
                const left = layout.lefts[i]! - 40
                const right = left + layout.widths[i]! + 120
                const x = mix(left - 90, right, p)
                const y0 = layout.baselines[i]! - SIZE
                const y1 = layout.baselines[i]! + SIZE * 0.3
                return (
                  <clipPath key={i} id={`taxi-curtain-${i}`}>
                    <polygon points={`${left - 200},${y0} ${x + 60},${y0} ${x - 30},${y1} ${left - 200},${y1}`} />
                  </clipPath>
                )
              })}
              <linearGradient id="taxi-sheen" gradientUnits="userSpaceOnUse" x1={mix(-600, 2400, sweep)} y1={0} x2={mix(-600, 2400, sweep) + 420} y2={140}>
                <stop offset="0" stopColor={GOLD} stopOpacity={0} />
                <stop offset="0.5" stopColor="#E9AE12" stopOpacity={0.95} />
                <stop offset="1" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            {LINES.map((line, i) => (
              <g key={i} clipPath={`url(#taxi-curtain-${i})`}>
                <text x={layout.lefts[i]} y={layout.baselines[i]} fontFamily={FONT} fontSize={SIZE} fontWeight={800} letterSpacing={`${TRACK}em`} fill={INK}>
                  {line}
                </text>
                {sweep > 0 && sweep < 1 && (
                  <text x={layout.lefts[i]} y={layout.baselines[i]} fontFamily={FONT} fontSize={SIZE} fontWeight={800} letterSpacing={`${TRACK}em`} fill="url(#taxi-sheen)">
                    {line}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </Camera>
      )}
      {/* Короткая вспышка бумаги, когда просвет буквы заполнил кадр. */}
      {diving && <AbsoluteFill style={{ background: '#f5f6f9', opacity: easeIn(span(frame, T.dive + DIVE - 5, 5)) * 0.6 }} />}

      <Callout anchor={[BUTTON.x + BUTTON.width - 36, BUTTON.y + BUTTON.height / 2]} box={{ x: BUTTON.x + BUTTON.width + 60, y: BUTTON.y - 200, width: 350 }} tag={tag(23, lang)} title={caption(23, lang)} at={T.callout} until={FINAL_BEATS * 15 - 30} />
      <Cursor x={cursor.x} y={cursor.y} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}

/** Финальный кадр: знак TAXI BOSS (металлическое золото художника), адрес,
    кнопка «Porozmawiajmy» (.btn-primary продукта), по бокам — панель и телефон. */
function Lockup({ frame, cursor }: { frame: number; cursor: { press: number } }) {
  const logo = spring(frame, T.dive + 6, SPRINGS.heavy)
  const address = spring(frame, T.lockup, SPRINGS.pop)
  const button = spring(frame, T.lockup + 6, SPRINGS.pop)
  const desk = spring(frame, T.devices, SPRINGS.heavy)
  const phone = spring(frame, T.devices + 6, SPRINGS.heavy)
  const pressed = Math.round(clamp01(cursor.press) * 10) / 10
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 960 - LOGO.width / 2, top: LOGO.y, width: LOGO.width, height: LOGO.height, transform: `scale(${mix(0.86, 1, clamp01(logo))})`, opacity: clamp01(logo * 1.4) }}>
        <Live width={LOGO.width} height={LOGO.height} ratio={2} draw={(ctx) => drawLogo(ctx, LOGO.width, LOGO.height, 'front')} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: 494, textAlign: 'center', fontFamily: FONT, fontSize: 56, fontWeight: 650, letterSpacing: '-0.02em', color: INK, opacity: clamp01(address * 1.5), transform: `translateY(${(1 - clamp01(address)) * 24}px)` }}>
        taxiboss.pl
      </div>
      <div style={{ position: 'absolute', left: BUTTON.x, top: BUTTON.y, width: BUTTON.width, height: BUTTON.height, borderRadius: BUTTON.height * 0.28, boxShadow: '0 18px 44px rgba(207, 138, 0, 0.28), 0 4px 10px rgba(15, 23, 42, 0.12)', transform: `scale(${Math.max(0, button) * (1 - 0.04 * clamp01(cursor.press))})`, opacity: clamp01(button * 1.5) }}>
        <Live width={BUTTON.width} height={BUTTON.height} ratio={2.5} state={pressed} draw={(ctx) => drawCallButton(ctx, BUTTON.width, BUTTON.height, pressed)} />
      </div>
      <Rings frame={frame} at={T.click} />
      {/* Панель владельца и приложение водителя встают по бокам (3D, как двери). */}
      <div style={{ position: 'absolute', left: DESK_SMALL.x, top: DESK_SMALL.y, width: 1280 * DESK_SMALL.scale, perspective: 1600, opacity: clamp01(desk * 2) }}>
        <div style={{ transformOrigin: '0% 50%', transform: `rotateY(${(1 - clamp01(desk)) * 60}deg)` }}>
          <div style={{ position: 'relative', width: 1280, height: 846, transform: `scale(${DESK_SMALL.scale})`, transformOrigin: '0 0' }}>
            <AppWindow url="taxiboss.pl/admin" width={1280} height={800} page={TB.bg} style={{ left: 0, top: 0 }}>
              <Live width={1280} height={800} ratio={0.8} draw={(ctx) => drawFleet(ctx, 1280, 800, true)} />
            </AppWindow>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: PHONE_SMALL.x, top: PHONE_SMALL.y, perspective: 1600, opacity: clamp01(phone * 2) }}>
        <div style={{ transformOrigin: '100% 50%', transform: `rotateY(${(1 - clamp01(phone)) * -60}deg)` }}>
          <Phone scale={PHONE_SMALL.scale} dark screen={TB.bg} style={{ left: 0, top: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 852, transform: `scale(${PHONE_SMALL.scale})`, transformOrigin: '0 0' }}>
              <Live width={393} height={852} ratio={1.2} draw={drawNativePanel} />
              <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 54, background: TB.bg }} />
            </div>
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  )
}

/** Кольца от нажатой кнопки: светлые, с золотой кромкой, расходятся и гаснут. */
function Rings({ frame, at }: { frame: number; at: number }) {
  return (
    <>
      {[0, 10].map((delay) => {
        const t = span(frame, at + delay, 34)
        if (frame < at + delay || t >= 1) return null
        const w = mix(BUTTON.width, BUTTON.width + 520, easeOut(t))
        const h = mix(BUTTON.height, BUTTON.height + 360, easeOut(t))
        return (
          <div
            key={delay}
            style={{
              position: 'absolute',
              left: 960 - w / 2,
              top: BUTTON.y + BUTTON.height / 2 - h / 2,
              width: w,
              height: h,
              borderRadius: Math.min(w, h) / 2,
              border: `3px solid rgba(207, 138, 0, ${0.55 * (1 - t)})`,
              boxSizing: 'border-box',
            }}
          />
        )
      })}
    </>
  )
}

