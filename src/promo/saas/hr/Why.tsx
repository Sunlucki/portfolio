import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { DrawPath } from '../kit/draw'
import type { IconName } from '../kit/icons'
import { pick, useLang, useT, type Lang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, mix, span, spring } from '../kit/motion'
import { useSoundCue, useSoundTrack } from '../kit/sound'
import { Counter } from '../kit/text'
import { FONT, INK, MUTED, SHADOW, useAccent } from '../kit/theme'
import { Glyph, Paper } from './parts'
import { IA, caption } from './twins'

/* 19–20 · Dlaczego (24 доли). Шторка-предмет (П12): светлая спинка телефона
   проносится у самой камеры справа налево и открывает счётчики — только
   свойства продукта: 4 języki (PL · UA · RU · EN), 3 role (Admin ·
   Koordynator · Pracownik), ×1,5 nadgodziny. Затем счётчики уходят вверх,
   падают три карточки причин с наклоном: номер, иконка контуром, заголовок —
   подпись станции 20, строка пояснения (как у карточек 3D); галочки по
   очереди, под рядом прорисовывается линия.

   0–18     шторка; 8, 18, 28 — счётчики (барабан 36 кадров)
   60–128   счётчики читаются
   128–150  счётчики уходят вверх
   140–166  карточки падают через 8 кадров; 166–196 иконки и галочки
   196–240  линия под рядом; 240–342 карточки читаются; 342–358 уходят вверх */

export const WHY_BEATS = 24

/** Шторка: светлая спинка iPhone, крупнее кадра, проходит справа налево. */
const SHUTTER = { width: 2300, height: 4600, from: 2100, to: -2500, dur: 20 }
export const shutterX = (frame: number) => mix(SHUTTER.from, SHUTTER.to, easeInOut(span(frame, 0, SHUTTER.dur)))

const COUNTERS: { value: number; label: string; sub: string; en: { label: string; sub: string }; icon: IconName }[] = [
  { value: 4, label: 'języki', sub: 'PL · UA · RU · EN', en: { label: 'languages', sub: 'PL · UA · RU · EN' }, icon: 'languages' },
  { value: 3, label: 'role', sub: 'Admin · Koordynator · Pracownik', en: { label: 'roles', sub: 'Admin · Coordinator · Worker' }, icon: 'users' },
  { value: 15, label: 'nadgodziny', sub: 'powyżej 8 godzin', en: { label: 'overtime', sub: 'over 8 hours' }, icon: 'clock' },
]

/** Английская строка без «вдовы»: последнее слово не уходит на строку одно. */
const keepLast = (text: string) => text.replace(/ (?=\S+$)/, '\u00a0')

/** Три причины: заголовки — подпись станции 20, пояснения — свои на каждом языке. */
function reasons(lang: Lang): { title: string; text: string; icon: IconName }[] {
  const titles = caption(20, lang).split(' · ')
  const texts =
    lang === 'en'
      ? ['On-premise: PESEL (Polish\u00a0ID) and schedules stay with you.', 'The server rejects scans from outside the site.', 'We train your coordinator and oversee the launch.']
      : ['Instalacja on-premise: PESEL i grafiki zostają u Ciebie.', 'Skan spoza obiektu serwer odrzuca.', 'Szkolimy koordynatora i pilnujemy startu.']
  const icons: IconName[] = ['server', 'qrCode', 'users']
  return titles.map((title, i) => ({
    title: lang === 'en' ? keepLast(title) : title,
    text: lang === 'en' ? keepLast(texts[i] ?? '') : (texts[i] ?? ''),
    icon: icons[i] ?? 'check',
  }))
}

const E = { counters: 8, away: 128, cards: 140, checks: 172, line: 196, exit: 342 }
const CARD = { width: 566, height: 500, gap: 26, top: 240 }

export function Why() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const t = useT()
  const sx = shutterX(frame)
  /* Всё, что правее шторки, — уже новая сцена: бумага закрывает уходящую. */
  const revealFrom = Math.max(0, sx + SHUTTER.width)
  const away = easeInOut(span(frame, E.away, 22))
  const exit = easeIn(span(frame, E.exit, 16))
  const rowLeft = 960 - (CARD.width * 3 + CARD.gap * 2) / 2

  /* Звук: шторка-предмет проносится у камеры справа налево; счётчики уходят
     вверх; карточки причин падают слева направо, галочки — по очереди, точки
     на линии; всё уходит вверх. Цифры и линию озвучивают приёмы. */
  const cardX = (i: number) => rowLeft + i * (CARD.width + CARD.gap)
  const lineY = CARD.top + CARD.height + 56
  const reach = (i: number) => E.line + ((cardX(i) + CARD.width / 2 - rowLeft) / (CARD.width * 3 + CARD.gap * 2)) * 40
  useSoundTrack('hr2d-shutter', 'whoosh', frame < SHUTTER.dur, { x: sx + SHUTTER.width / 2, y: 540 }, { gain: 1 })
  useSoundCue('air', E.away, { x: 960, y: 420 }, { gain: 0.5, seconds: 0.6 })
  useSoundCue('popIn', E.cards, { x: cardX(0) + CARD.width / 2, y: CARD.top + CARD.height / 2 }, { gain: 0.55 })
  useSoundCue('popIn', E.cards + 8, { x: cardX(1) + CARD.width / 2, y: CARD.top + CARD.height / 2 }, { gain: 0.55 })
  useSoundCue('popIn', E.cards + 16, { x: cardX(2) + CARD.width / 2, y: CARD.top + CARD.height / 2 }, { gain: 0.55 })
  useSoundCue('tick', E.checks, { x: cardX(0) + 73, y: CARD.top + CARD.height - 67 }, { gain: 0.6 })
  useSoundCue('tick', E.checks + 8, { x: cardX(1) + 73, y: CARD.top + CARD.height - 67 }, { gain: 0.6 })
  useSoundCue('tick', E.checks + 16, { x: cardX(2) + 73, y: CARD.top + CARD.height - 67 }, { gain: 0.6 })
  useSoundCue('tick', reach(0), { x: cardX(0) + CARD.width / 2, y: lineY }, { gain: 0.35 })
  useSoundCue('tick', reach(1), { x: cardX(1) + CARD.width / 2, y: lineY }, { gain: 0.35 })
  useSoundCue('tick', reach(2), { x: cardX(2) + CARD.width / 2, y: lineY }, { gain: 0.35 })
  useSoundCue('air', E.exit, { x: 960, y: 480 }, { gain: 0.5, seconds: 0.6 })

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <AbsoluteFill style={{ clipPath: frame < SHUTTER.dur ? `inset(0 0 0 ${revealFrom}px)` : undefined, opacity: 1 - exit, transform: `translateY(${-exit * 140}px)` }}>
        <Paper opacity={1 - easeOut(span(frame, 40, 20))} />
        {/* 19 · счётчики свойств продукта */}
        {frame < E.away + 26 &&
          COUNTERS.map((item, i) => {
            const at = E.counters + i * 10
            const rise = spring(frame, at + 6, SPRINGS.pop)
            const x = 480 + i * 480
            return (
              <div key={item.label} style={{ position: 'absolute', left: x - 300, top: 250, width: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - away, transform: `translateY(${-away * 160}px) scale(${mix(1, 0.8, away)})` }}>
                <Glyph name={item.icon} size={72} color={accent} stroke={1.6} p={easeOut(span(frame, at, 20))} />
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', color: INK }}>
                  {item.value === 15 ? (
                    <>
                      <span style={{ fontSize: 230, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, opacity: easeOut(span(frame, at, 8)) }}>×</span>
                      <Counter from={0} to={1} at={at} duration={30} size={230} />
                      <span style={{ fontSize: 230, fontWeight: 800, lineHeight: 1.1, opacity: easeOut(span(frame, at + 10, 8)) }}>{t(',', '.')}</span>
                      <Counter from={0} to={5} at={at + 6} duration={36} size={230} />
                    </>
                  ) : (
                    <Counter from={0} to={item.value} at={at} duration={36} size={230} />
                  )}
                </div>
                <div style={{ overflow: 'hidden', paddingBottom: 6 }}>
                  <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', color: INK, transform: `translateY(${(1 - clamp01(rise)) * 100}%)`, opacity: clamp01(rise * 1.5) }}>{pick(lang, item.label, item.en.label)}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 30, fontWeight: 600, color: MUTED, opacity: easeOut(span(frame, at + 16, 12)) }}>{pick(lang, item.sub, item.en.sub)}</div>
              </div>
            )
          })}
        {/* 20 · три причины */}
        {reasons(lang).map((reason, i) => {
          const start = E.cards + i * 8
          if (frame < start) return null
          const fall = spring(frame, start, SPRINGS.pop)
          const x = rowLeft + i * (CARD.width + CARD.gap)
          const check = easeOut(span(frame, E.checks + i * 8, 14))
          return (
            <div key={reason.title} style={{ position: 'absolute', left: x, top: CARD.top, width: CARD.width, height: CARD.height, perspective: 1800 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxSizing: 'border-box',
                  padding: '44px 48px',
                  borderRadius: 30,
                  background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)',
                  boxShadow: `inset 0 0 0 1px rgba(15, 23, 42, 0.06), ${SHADOW.card}`,
                  transform: `translateY(${(1 - clamp01(fall)) * -300}px) rotateX(${(1 - fall) * 70}deg) rotateZ(${(1 - clamp01(fall)) * (i - 1) * -6}deg)`,
                  transformOrigin: '50% 0%',
                  opacity: clamp01(fall * 2),
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 38, fontWeight: 800, color: accent, letterSpacing: '0.06em', fontVariantNumeric: 'tabular-nums' }}>{String(i + 1).padStart(2, '0')}</div>
                  <Glyph name={reason.icon} size={88} color={IA.primary400} stroke={1.5} p={easeOut(span(frame, start + 10, 22))} />
                </div>
                <div style={{ marginTop: 34, fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: INK }}>{reason.title}</div>
                <div style={{ marginTop: 20, fontSize: 28, fontWeight: 500, lineHeight: 1.35, color: MUTED }}>{reason.text}</div>
                <div style={{ position: 'absolute', left: 48, bottom: 42 }}>
                  <Glyph name="circleCheckBig" size={50} color={IA.green600} stroke={2} p={check} />
                </div>
              </div>
            </div>
          )
        })}
        {frame >= E.line && <DrawPath d={`M ${rowLeft} ${CARD.top + CARD.height + 56} L ${rowLeft + CARD.width * 3 + CARD.gap * 2} ${CARD.top + CARD.height + 56}`} p={easeInOut(span(frame, E.line, 40))} color={accent} width={4} />}
        {frame >= E.line &&
          [0, 1, 2].map((i) => {
            const x = rowLeft + i * (CARD.width + CARD.gap) + CARD.width / 2
            const reached = span(frame, E.line + ((x - rowLeft) / (CARD.width * 3 + CARD.gap * 2)) * 40, 1)
            const pop = spring(frame, E.line + ((x - rowLeft) / (CARD.width * 3 + CARD.gap * 2)) * 40, SPRINGS.pop)
            return reached > 0 ? <div key={i} style={{ position: 'absolute', left: x - 9, top: CARD.top + CARD.height + 47, width: 18, height: 18, borderRadius: 9, background: '#ffffff', border: `4px solid ${accent}`, boxSizing: 'border-box', transform: `scale(${pop})` }} /> : null
          })}
      </AbsoluteFill>
      {/* Шторка-предмет: светлая спинка телефона с блоком камер. */}
      {frame < SHUTTER.dur + 1 && (
        <div
          style={{
            position: 'absolute',
            left: sx,
            top: 540 - SHUTTER.height / 2,
            width: SHUTTER.width,
            height: SHUTTER.height,
            borderRadius: 360,
            background: 'linear-gradient(115deg, #f4f5f7 0%, #d9dce2 40%, #eef0f3 70%, #c9cdd4 100%)',
            boxShadow: 'inset 0 0 0 18px rgba(255, 255, 255, 0.6), 0 60px 160px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div style={{ position: 'absolute', left: 160, top: SHUTTER.height / 2 - 1300, width: 900, height: 900, borderRadius: 230, background: 'linear-gradient(135deg, #e3e5ea, #cfd3d9)', boxShadow: 'inset 0 0 0 10px rgba(255, 255, 255, 0.5), 0 20px 60px rgba(15, 23, 42, 0.12)' }}>
            {[
              [110, 110],
              [110, 480],
              [480, 300],
            ].map(([cx, cy], i) => (
              <div key={i} style={{ position: 'absolute', left: cx, top: cy, width: 300, height: 300, borderRadius: 150, background: 'radial-gradient(circle at 40% 35%, #3a3f4a 0%, #16181d 55%, #0b0c0f 100%)', boxShadow: 'inset 0 0 0 22px #b9bec6, 0 8px 20px rgba(15, 23, 42, 0.25)' }} />
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}
