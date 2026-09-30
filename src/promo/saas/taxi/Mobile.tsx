import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { pick, useLang, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, span, spring } from '../kit/motion'
import { FONT_SAMPLE, FontGate, textWidth } from '../kit/painted'
import { Tap } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { FONT, INK, MUTED } from '../kit/theme'
import { OVERVIEW } from './Auto'
import { HISTORY_VIEW } from './Flota'
import { DeskEnter, useSoundPoints } from './fx'
import { inFrame } from './geometry'
import { DESK, Desk, Live, PHONE, TaxiPhone, onPhone, phoneRect } from './screen'
import {
  GOLD,
  HERO,
  LANGS,
  SERVICE,
  TB,
  box,
  caption,
  drawLanding,
  drawNativeEarnings,
  drawNativePanel,
  drawNativeSchedule,
  drawServiceHistory,
  tabCenter,
  tag,
} from './twins'

/* 18–19 · 06 Mobile (30 долей). Окно панели закрывается, как крышка
   ноутбука (П13), — остаётся телефон водителя: родное приложение, «Cześć,
   Oleksandr». Касания вкладок: «Grafik» — сентябрь, дни аренды машины;
   «Zarobki» — столбики дней растут. Приложение уходит в колоду (П8), вперёд
   выезжает лендинг: заголовок меняется на лету на семи языках (З5), арабский
   переворачивает вёрстку справа налево. Имя языка — простым текстом слева.

   0–30     крышка закрывается; камера — общий план → телефон
   30–84    «Panel» крупно, черта под «Cześć, Oleksandr»; 80–190 выноска 18
   110      «Grafik»: календарь проявляется по неделям
   170      «Zarobki»: столбики дней растут
   236–260  колода: приложение назад, лендинг вперёд
   262–420  семь языков по 18 кадров, арабский — 36; выноска 19 */

export const MOBILE_BEATS = 30

const T = {
  lid: 2,
  phone: 30,
  panel: 58,
  grafik: 110,
  zarobki: 170,
  deck: 236,
  langs: 262,
}
const END = MOBILE_BEATS * 15

/** Смена языков: pl → en → ru → uk → ro → ar (дольше, справа налево) → ka → pl.
    В английском ролике смена начинается и кончается английским: en → pl → ru →
    uk → ro → ar → ka → en; доли и шаги те же, счёт «N / 7» — по месту в смене. */
const ORDER: Record<Lang, number[]> = { pl: [0, 1, 2, 3, 4, 5, 6, 0], en: [1, 0, 2, 3, 4, 5, 6, 1] }
const HOLD = [18, 18, 18, 18, 18, 36, 20, 30]
const LANG_AT = HOLD.reduce<number[]>((acc, _, i) => [...acc, (acc[i - 1] ?? T.langs) + (i === 0 ? 0 : HOLD[i - 1]!)], [])

function langAt(frame: number): number {
  let current = 0
  LANG_AT.forEach((at, i) => {
    if (frame >= at) current = i
  })
  return current
}

/** Столбики «Według dni» растут (м-график): поверх нарисованного — те же линии
    сетки и столбики на долю p каждого (по очереди). */
const BARS = [0, 0, 0, 0, 0.62, 1, 0.84]
function patchBars(ctx: CanvasRenderingContext2D, grow: (i: number) => number) {
  ctx.fillStyle = TB.card
  ctx.fillRect(22, 478, 349, 164)
  for (let i = 0; i < 4; i++) box(ctx, 32, 486 + i * 42, 329, 1, 0, TB.border)
  BARS.forEach((v, i) => {
    const h = 150 * v * grow(i)
    if (h < 0.5) return
    const g = ctx.createLinearGradient(0, 640 - h, 0, 640)
    g.addColorStop(0, TB.gold)
    g.addColorStop(1, TB.goldEnd)
    box(ctx, 40 + i * 46, 640 - h, 30, h, 4, g)
  })
}
const barGrow = (frame: number, i: number) => spring(frame, T.zarobki + 14 + i * 3, SPRINGS.pop)

/* ── Камера ── */

const PANEL_VIEW = fit(phoneRect({ x: 16, y: 140, width: 361, height: 470 }), { max: 1.9, shift: [-280, 0], margin: 60 })
const HERO_VIEW = fit(phoneRect({ x: 16, y: 64, width: 361, height: 300 }), { max: 2.25, margin: 60 })

const CAMERA: CameraKey[] = [
  { at: 0, ...HISTORY_VIEW },
  { at: T.lid, dur: 24, ...OVERVIEW },
  { at: T.phone, dur: 28, x: PHONE.cx, y: PHONE.cy, zoom: 1.06 },
  { at: T.panel, dur: 26, ...PANEL_VIEW },
  { at: T.deck - 4, dur: 22, x: PHONE.cx, y: PHONE.cy, zoom: 1.06 },
  { at: T.langs, dur: 24, ...HERO_VIEW },
]

const LANG_TEXT = FONT_SAMPLE + LANGS.map((lang) => `${lang.title} ${lang.rate} ${lang.sub} ${lang.desc} ${lang.cta} ${lang.stats.join(' ')} ${lang.name}`).join(' ')

export function Mobile() {
  return (
    <FontGate text={LANG_TEXT}>
      <MobileScene />
    </FontGate>
  )
}

function MobileScene() {
  const frame = useCurrentFrame()
  /* Язык ролика; lang ниже — язык лендинга, который меняется на лету. */
  const language = useLang()
  const camera = viewAt(CAMERA, frame)
  const lid = 1 - easeInOut(span(frame, T.lid, 26))
  const tab = frame >= T.zarobki ? 2 : frame >= T.grafik ? 1 : 0
  const tabSwitch = easeOut(span(frame, tab === 2 ? T.zarobki : T.grafik, 8))
  const rows = easeInOut(span(frame, T.grafik + 4, 20))
  const growKey = BARS.map((_, i) => Math.round(clamp01(barGrow(frame, i)) * 40)).join('.')
  const deck = easeInOut(span(frame, T.deck, 18))
  const come = spring(frame, T.deck + 8, SPRINGS.glide)
  const langIndex = langAt(frame)
  const lang = LANGS[ORDER[language][langIndex]!]!
  const layout = useMemo(() => ({ hello: { x: 16, y: 178 - 17, width: textWidth(pick(language, `Cześć, ${HERO.first}`, `Hello, ${HERO.first}`), 22, 700), height: 17 } }), [language])

  const helloAt = camera.project(...onPhone(16 + layout.hello.width * 0.8, 170))
  const panelView = viewAt(CAMERA, T.panel + 30)
  const phoneRight = panelView.project(...onPhone(393, 0))[0]
  const titleAt = camera.project(...onPhone(196.5 + 60, 169 - 12))
  const heroView = viewAt(CAMERA, T.langs + 30)
  const heroRight = heroView.project(...onPhone(393, 0))[0]
  const heroLeft = heroView.project(...onPhone(0, 0))[0]
  const [, titleY] = heroView.project(...onPhone(0, 150))

  /* П12: в конце главы телефон проносится мимо камеры — вверх, крупнее, в размытии. */
  const pass = easeIn(span(frame, END, 16))

  /* Звук: окно панели закрывается крышкой (П13); календарь «Grafik» проявляется
     по неделям; столбики «Zarobki» растут; колода; заголовок меняется на каждом
     языке; телефон проносится мимо камеры вверх (П12). */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  const phoneAt = (x: number, y: number) => at(...onPhone(x, y))
  const phone = phoneAt(196.5, 426)
  useSoundCue('air', T.lid, at(DESK.x + DESK.width / 2, DESK.y + DESK.height / 2), { gain: 0.5, seconds: 0.85 })
  useSoundCue('layers', T.grafik + 4, phoneAt(196.5, 216 + 128), { gain: 0.4, seconds: 0.6 })
  useSoundPoints(
    'tick',
    [4, 5, 6].map((i) => ({ at: T.zarobki + 14 + i * 3, ...phoneAt(40 + i * 46 + 15, 640 - 75 * BARS[i]!) })),
    { gain: 0.45 },
  )
  useSoundCue('air', T.deck, phone, { gain: 0.5, seconds: 0.8 })
  useSoundCues('flip', LANG_AT.slice(1), phoneAt(196.5, 169), { gain: 0.45 })
  useSoundTrack('taxi2d-phone-pass', 'whoosh', frame >= END && frame <= END + 16, { x: phone.x, y: 540 + (phone.y - 540) * (1 + 0.9 * pass) - 900 * pass }, { gain: 0.8 })

  return (
    <AbsoluteFill style={pass > 0 ? { transform: `translateY(${-pass * 900}px) scale(${1 + pass * 0.9})`, filter: `blur(${(pass * 10).toFixed(2)}px)`, opacity: 1 - easeIn(span(frame, END + 8, 8)) } : undefined}>
      <Camera view={camera}>
        {/* П13: окно панели закрывается, как крышка ноутбука. */}
        {lid > 0.001 && (
          <DeskEnter t={lid} kind="lid">
            <Desk>
              <Live width={1280} height={800} ratio={2.4} draw={(ctx) => drawServiceHistory(ctx, 1280, 800, true)} />
              <Scribble rect={{ x: SERVICE.firstRow.x, y: SERVICE.firstRow.y, width: SERVICE.firstRow.width, height: SERVICE.firstRow.height }} color={GOLD} width={2.4} pad={[12, 8]} seed={4} p={1 - easeIn(span(frame, 0, 10))} />
            </Desk>
          </DeskEnter>
        )}

        <TaxiPhone
          overlay={
            <>
              <Tap x={tabCenter(1)[0]} y={tabCenter(1)[1]} at={T.grafik} />
              <Tap x={tabCenter(3)[0]} y={tabCenter(3)[1]} at={T.zarobki} />
              <Scribble rect={layout.hello} kind="underline" color={GOLD} width={2.4} p={easeOut(span(frame, T.panel + 14, 12)) * (1 - easeIn(span(frame, T.grafik - 4, 6)))} />
              <Scribble rect={{ x: 16, y: 510, width: 361, height: 88 }} color={GOLD} width={2.2} pad={[10, 6]} seed={7} p={easeOut(span(frame, T.grafik + 24, 14)) * (1 - easeIn(span(frame, T.zarobki - 4, 6)))} />
            </>
          }
        >
          {frame < T.deck + 26 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 393,
                height: 852,
                borderRadius: 44 * deck,
                overflow: 'hidden',
                transformOrigin: '50% 0%',
                transform: deck > 0.001 ? `perspective(1400px) translateY(${deck * 36}px) rotateX(${deck * 16}deg) scale(${1 - 0.3 * deck})` : undefined,
                opacity: 1 - 0.6 * deck,
              }}
            >
              <Live width={393} height={852} ratio={3} draw={drawNativePanel} style={{ opacity: tab === 0 ? 1 : 1 - tabSwitch }} />
              {tab >= 1 && (
                <div style={{ position: 'absolute', inset: 0, opacity: tab === 1 ? tabSwitch : 1 - (tab === 2 ? tabSwitch : 0), transform: tab === 1 ? `translateX(${(1 - tabSwitch) * 18}px)` : undefined }}>
                  <Live width={393} height={852} ratio={3} draw={drawNativeSchedule} />
                  {/* Календарь проявляется по неделям сверху вниз. */}
                  <div style={{ position: 'absolute', left: 12, top: 216 + rows * 256, width: 369, height: (1 - rows) * 256, background: TB.bg }} />
                </div>
              )}
              {tab === 2 && (
                <div style={{ position: 'absolute', inset: 0, opacity: tabSwitch, transform: `translateX(${(1 - tabSwitch) * 18}px)` }}>
                  <Live width={393} height={852} ratio={3} state={growKey} draw={(ctx) => {
                    drawNativeEarnings(ctx)
                    patchBars(ctx, (i) => clamp01(barGrow(frame, i)))
                  }} />
                </div>
              )}
            </div>
          )}
          {frame >= T.deck + 6 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 393,
                height: 852,
                borderRadius: 44 * (1 - clamp01(come)),
                overflow: 'hidden',
                boxShadow: come < 0.98 ? '0 -20px 60px rgba(0,0,0,0.6)' : undefined,
                transform: come < 0.999 ? `translateY(${(1 - come) * 700}px) scale(${0.8 + 0.2 * clamp01(come)})` : undefined,
              }}
            >
              <Live width={393} height={852} ratio={3} state={lang.code} draw={(ctx) => drawLanding(ctx, { lang, scroll: 0 })} />
              <LangFlash frame={frame} at={LANG_AT[langIndex]!} />
            </div>
          )}
        </TaxiPhone>
      </Camera>

      {/* Имя языка — наш текст, простой, слева от телефона; меняется вместе с заголовком. */}
      {frame >= T.langs && <LangName frame={frame} index={langIndex} order={ORDER[language]} right={heroLeft - 70} y={titleY} />}

      <Callout anchor={helloAt} box={{ x: inFrame(phoneRight + 70, 500), y: helloAt[1] - 40, width: 500 }} tag={tag(18, language)} title={caption(18, language)} at={T.panel + 20} until={T.deck - 16} />
      <Callout anchor={titleAt} box={{ x: inFrame(heroRight + 60, 500), y: titleAt[1] + 60, width: 500 }} tag={tag(19, language)} title={caption(19, language)} at={T.langs + 30} until={END - 24} />
    </AbsoluteFill>
  )
}

/** Блик по заголовку в момент смены языка. */
function LangFlash({ frame, at }: { frame: number; at: number }) {
  const t = span(frame, at, 10)
  if (frame < at || t >= 1) return null
  return <div style={{ position: 'absolute', left: 0, top: 100, width: 393, height: 140, background: 'linear-gradient(180deg, rgba(255,191,0,0), rgba(255,191,0,0.12), rgba(255,191,0,0))', opacity: 1 - t }} />
}

/** Имя языка (З5 без пилюли): старое уходит вверх, новое въезжает снизу. */
function LangName({ frame, index, order, right, y }: { frame: number; index: number; order: number[]; right: number; y: number }) {
  const at = LANG_AT[index]!
  const enter = spring(frame, at, SPRINGS.snap)
  const prev = index > 0 ? LANGS[order[index - 1]!]!.name : null
  const name = LANGS[order[index]!]!.name
  const out = easeIn(span(frame, at, 6))
  const size = 58
  const count = `${order.indexOf(order[index]!) + 1} / 7`
  const style = (shift: number, opacity: number) => ({
    position: 'absolute' as const,
    right: 0,
    top: 0,
    whiteSpace: 'nowrap' as const,
    fontFamily: FONT,
    fontSize: size,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: INK,
    lineHeight: 1.15,
    transform: `translateY(${shift}%)`,
    opacity,
  })
  return (
    <div style={{ position: 'absolute', left: right - 700, top: y - size * 0.9, width: 700, height: size * 2.2, clipPath: 'inset(-10% -10% -10% -10%)' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, width: 700, height: size * 1.25, overflow: 'hidden' }}>
        {prev && out < 1 && <div style={style(-out * 110, 1 - out)}>{prev}</div>}
        <div style={style((1 - clamp01(enter)) * 110, clamp01(enter * 1.5))}>{name}</div>
      </div>
      <div style={{ position: 'absolute', right: 2, top: size * 1.32, fontFamily: FONT, fontSize: 26, fontWeight: 600, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
    </div>
  )
}

