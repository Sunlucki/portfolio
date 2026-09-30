import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Scribble } from '../kit/draw'
import { pick, useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { Painted, textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues } from '../kit/sound'
import { FONT, INK, MUTED } from '../kit/theme'
import { Handset, SCREEN, phonePt, type PhoneSpot } from './parts'
import { IA, LIVE_ACTIVITY, caption, drawLockScreen, useLive } from './twins'

/* 21–22 · Finał (22 доли). «Pierwszy miesiąc / prowadzimy razem.» открывается
   диагональной шторкой, по буквам проходит полоса света (З6). Камера влетает
   в просвет «o» в «prowadzimy» (П10): внутри буквы уже виден финальный кадр.
   Финал: телефон с экраном блокировки утра 28.09 — Live Activity «Jesteś w
   pracy», таймер идёт; справа знак iApply.pl (буква «i» фиолетовая, как в
   BrandLogo продукта), «Ewidencja czasu pracy bez przepisywania»,
   iapply.com.pl и кнопка с подписью станции 22 «Umów rozmowę» — курсор
   нажимает её, кадр держится.

   0–24     строки шторкой; 26–58 полоса света
   58–100   фраза читается
   100–128  влёт в «o»: круг раскрывает финал
   134–170  знак, строка, адрес; 168 — кнопка
   198–224  курсор к кнопке; 228 — клик; 228–330 кадр держится */

export const FINALE_BEATS = 22

const SIZE = 150
const LINE_H = 1.08
const TRACK = -0.045
const E = { line1: 0, line2: 8, band: 26, dive: 100, diveDur: 28, sign: 128, cta: 168, click: 228 }

const PHONE: PhoneSpot = { x: 370, y: 540 - SCREEN.height / 2, scale: 1 }
const COLUMN = { x: 960 }
const CTA = { x: COLUMN.x, y: 690, width: 560, height: 128 }

function lines(lang: Lang): [string, string] {
  const words = caption(21, lang).split(/\s+/)
  const cut = Math.ceil(words.length / 2)
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
}

const CURSOR = [
  { at: 196, x: CTA.x + CTA.width + 260, y: CTA.y + 300 },
  { at: E.click - 4, x: CTA.x + CTA.width * 0.62, y: CTA.y + CTA.height * 0.6 },
  { at: 300, x: CTA.x + CTA.width * 0.62 + 30, y: CTA.y + CTA.height * 0.6 + 40 },
]
const CLICK = cursorAt(CURSOR, E.click)

export function Finale() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const [first, second] = lines(lang)
  const w1 = textWidth(first, SIZE, 800, TRACK)
  const w2 = textWidth(second, SIZE, 800, TRACK)
  const top = 540 - SIZE * LINE_H
  const x1 = 960 - w1 / 2
  const x2 = 960 - w2 / 2

  /* Просвет «o» в «prowadzimy»: центр буквы и радиус её внутреннего круга. */
  const oIndex = second.indexOf('o')
  const before = textWidth(second.slice(0, oIndex), SIZE, 800, TRACK)
  const oWidth = textWidth('o', SIZE, 800, 0)
  const ox = x2 + before + oWidth / 2
  const oy = top + SIZE * LINE_H + SIZE * 0.904 - SIZE * 0.27
  const hole = SIZE * 0.14

  const dive = span(frame, E.dive, E.diveDur)
  const zoom = Math.pow(80, dive * dive)
  const revealR = hole * zoom
  const headlineGone = frame >= E.dive + E.diveDur

  const reveal = (at: number) => easeInOut(span(frame, at, 18))
  const band = span(frame, E.band, 32)
  const state = { time: '07:01', date: pick(lang, 'poniedziałek, 28 września', 'Monday, 28 September'), elapsed: 64 + Math.max(0, Math.floor((frame - E.sign) / 30)), until: '15:00', island: false }
  const lock = useLive(SCREEN.width, SCREEN.height, 3, (c) => drawLockScreen(c, state), JSON.stringify(state))

  const cursor = cursorAt(CURSOR, frame, [E.click], 320)
  const press = 1 - 0.04 * clamp01(1 - Math.abs(frame - E.click) / 4)

  const line = (text: string, x: number, y: number, at: number) => {
    const p = reveal(at)
    const width = textWidth(text, SIZE, 800, TRACK) + 40
    const height = SIZE * LINE_H + 20
    const edge = p * (width + height)
    const clip = `polygon(-20px -10px, ${edge - 20}px -10px, ${edge - height - 20}px ${height}px, -20px ${height}px)`
    const style = { fontSize: SIZE, fontWeight: 800, letterSpacing: `${TRACK}em`, lineHeight: LINE_H, whiteSpace: 'nowrap' as const }
    return (
      <div style={{ position: 'absolute', left: x, top: y, clipPath: clip }}>
        <div style={{ ...style, color: INK }}>{text}</div>
        <div
          style={{
            ...style,
            position: 'absolute',
            left: 0,
            top: 0,
            color: 'transparent',
            backgroundImage: 'linear-gradient(100deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.62) 50%, rgba(255,255,255,0) 58%)',
            backgroundSize: '260% 100%',
            backgroundPosition: `${mix(130, -30, band)}% 0`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {text}
        </div>
      </div>
    )
  }

  const rise = (at: number) => spring(frame, at, SPRINGS.pop)
  const riseStyle = (at: number) => ({ transform: `translateY(${(1 - clamp01(rise(at))) * 100}%)`, opacity: clamp01(rise(at) * 1.5) })
  const cta = spring(frame, E.cta, SPRINGS.pop)

  /* Звук: строки открываются шторкой, по буквам — полоса света; влёт в «o» —
     подъём в блик знака iApply.pl; адрес; кнопка «Umów rozmowę» встаёт, после
     клика — блик; таймер Live Activity на телефоне идёт. Клик — у приёма. */
  const ctaAt = { x: CTA.x + CTA.width / 2, y: CTA.y + CTA.height / 2 }
  useSoundCue('air', E.line1, { x: 960, y: 540 }, { gain: 0.5, seconds: 0.9 })
  useSoundCue('glint', E.band, { x: 960, y: 540 }, { gain: 0.7, seconds: 1.1 })
  useSoundCue('riser', E.dive, { x: ox, y: oy }, { gain: 0.9, seconds: (E.sign + 6 - E.dive) / 30 })
  useSoundCue('glint', E.sign + 6, { x: COLUMN.x + 260, y: 335 }, { gain: 0.8, seconds: 1 })
  useSoundCue('popIn', E.sign + 24, { x: COLUMN.x + 220, y: 563 }, { gain: 0.45 })
  useSoundCue('popIn', E.cta, ctaAt, { gain: 0.9 })
  useSoundCue('glint', E.click + 4, ctaAt, { gain: 0.5, seconds: 0.6 })
  const [timerX, timerY] = phonePt(PHONE, LIVE_ACTIVITY.x + LIVE_ACTIVITY.width - 64, LIVE_ACTIVITY.y + 42)
  useSoundCues('tick', [158, 188, 218, 248, 278, 308], { x: timerX, y: timerY }, { gain: 0.25 })

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* 22 · финальный кадр — виден сквозь «o», затем целиком. */}
      {frame >= E.dive && (
        <AbsoluteFill style={{ clipPath: headlineGone ? undefined : `circle(${revealR}px at ${ox}px ${oy}px)` }}>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f8f9fb 0%, #f3f4f8 62%, #eceef3 100%)', opacity: headlineGone ? 0 : 1 }} />
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${mix(1.25, 1, easeOut(span(frame, E.dive, E.diveDur + 20)))})`, transformOrigin: `${ox}px ${oy}px` }}>
            <Handset spot={PHONE}>
              <Painted source={lock} style={{ inset: 0 }} />
            </Handset>
            <div style={{ position: 'absolute', left: COLUMN.x, top: 250 }}>
              <div style={{ overflow: 'hidden', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', ...riseStyle(E.sign + 6) }}>
                  <span style={{ fontSize: 170, fontWeight: 800, letterSpacing: '-0.025em', color: IA.primary, lineHeight: 1 }}>i</span>
                  <span style={{ fontSize: 170, fontWeight: 800, letterSpacing: '-0.025em', color: INK, lineHeight: 1 }}>Apply</span>
                  <span style={{ fontSize: 102, fontWeight: 700, color: INK, opacity: 0.7, marginLeft: 8, lineHeight: 1 }}>.pl</span>
                </div>
              </div>
              <div style={{ overflow: 'hidden', marginTop: 26 }}>
                <div style={{ fontSize: 42, fontWeight: 500, color: MUTED, letterSpacing: '-0.01em', ...riseStyle(E.sign + 16) }}>{t('Ewidencja czasu pracy bez przepisywania', 'Time tracking without re-typing')}</div>
              </div>
              <div style={{ overflow: 'hidden', marginTop: 12 }}>
                <div style={{ fontSize: 66, fontWeight: 700, color: INK, letterSpacing: '-0.02em', ...riseStyle(E.sign + 24) }}>iapply.com.pl</div>
              </div>
            </div>
            {frame >= E.cta && (
              <div
                style={{
                  position: 'absolute',
                  left: CTA.x,
                  top: CTA.y,
                  width: CTA.width,
                  height: CTA.height,
                  borderRadius: 30,
                  background: `linear-gradient(135deg, #4a3fa3 0%, ${IA.primary} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 18px 40px rgba(58, 48, 134, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 50,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  transform: `scale(${mix(0.7, 1, clamp01(cta)) * press})`,
                  opacity: clamp01(cta * 1.6),
                }}
              >
                {caption(22, lang)}
              </div>
            )}
          </div>
          {/* После клика — адрес подчёркнут от руки: его и запоминают. */}
          <Scribble rect={{ x: COLUMN.x, y: 530, width: textWidth('iapply.com.pl', 66, 700, -0.02), height: 62 }} kind="underline" p={easeOut(span(frame, E.click + 14, 18))} width={4} />
          <Ripple x={CLICK.x} y={CLICK.y} at={E.click} size={60} />
          <Cursor x={cursor.x} y={cursor.y} press={cursor.press} opacity={cursor.opacity} />
        </AbsoluteFill>
      )}
      {/* 21 · заголовок: шторка, полоса света, влёт в «o». */}
      {!headlineGone && (
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${ox}px ${oy}px`, opacity: 1 - easeIn(span(frame, E.dive + E.diveDur - 6, 6)) }}>
          {line(first, x1, top, E.line1)}
          {line(second, x2, top + SIZE * LINE_H, E.line2)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
