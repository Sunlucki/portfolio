import { useRef } from 'react'
import { Img, useCurrentFrame } from 'remotion'
import markUrl from './assets/simbia-mark.png'
import { easeInOut, easeOut, span } from './motion'
import { useSoundCue } from './sound'

/* Знак SIMBIA — лента-бесконечность (assets/Branding, вариант ALUMINIUM на
   прозрачном фоне). Общий для финалов всех четырёх роликов: контур
   бесконечности прорисовывается серебряной линией, затем в неё проявляется
   сам знак. */

/** Соотношение сторон картинки знака (обрезана по ленте). */
export const MARK_RATIO = 1232 / 491

/** Лемниската Бернулли по ширине знака: путь SVG в px блока width × height. */
function lemniscate(width: number, height: number, steps = 160): string {
  const a = width * 0.43
  const cx = width / 2
  const cy = height / 2
  const stretch = (height * 0.62) / (a * 0.707)
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 + Math.PI / 2
    const s = Math.sin(t)
    const c = Math.cos(t)
    const k = 1 + s * s
    const x = cx + (a * c) / k
    const y = cy + ((a * s * c) / k) * stretch
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `
  }
  return d
}

/** Знак SIMBIA шириной width: контур рисуется от кадра at (за draw кадров),
    знак проявляется поверх с кадра at + draw − 6. */
export function SimbiaMark({ width, at = 0, draw = 30 }: { width: number; at?: number; draw?: number }) {
  const frame = useCurrentFrame()
  const self = useRef<HTMLDivElement>(null)
  /* Контур знака — нарастающий подъём, проявление знака — долгий блик. */
  useSoundCue('riser', at, self, { seconds: (draw - 6) / 30 + 0.15 })
  useSoundCue('glint', at + draw - 6, self, { seconds: 1.3 })
  const height = width / MARK_RATIO
  const line = easeInOut(span(frame, at, draw))
  const reveal = easeOut(span(frame, at + draw - 6, 16))
  return (
    <div ref={self} style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - reveal * 0.9 }}>
        <defs>
          <linearGradient id="simbia-mark-silver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9aa1ab" />
            <stop offset="0.5" stopColor="#e9ecef" />
            <stop offset="1" stopColor="#5d636d" />
          </linearGradient>
        </defs>
        <path
          d={lemniscate(width, height)}
          fill="none"
          stroke="url(#simbia-mark-silver)"
          strokeWidth={height * 0.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - line}
          opacity={line > 0.001 ? 1 : 0}
        />
      </svg>
      <Img src={markUrl} style={{ position: 'absolute', inset: 0, width, height, opacity: reveal, transform: `scale(${0.97 + 0.03 * reveal})` }} />
    </div>
  )
}
