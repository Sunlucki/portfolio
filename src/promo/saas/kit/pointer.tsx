import { useRef } from 'react'
import { useCurrentFrame } from 'remotion'
import { clamp01, easeInOut, easeOut, mix, span } from './motion'
import { useSoundCue, useSoundTrack } from './sound'
import { tint, useAccent } from './theme'

/* Указатели: курсор с кликом для компьютера; касание и свайп — для телефона
   (правило владельца: на телефоне курсора нет). Всё — в координатах кадра:
   сцена переводит точку мира через camera.project(), поэтому курсор не
   растёт на наездах, а стоит на кнопке. */

export interface CursorKey {
  at: number
  x: number
  y: number
}

export interface CursorState {
  x: number
  y: number
  /** 0…1: насколько нажата кнопка. */
  press: number
  opacity: number
}

/** Где курсор в кадре. Между ключами — плавный ход (easeInOut) с лёгкой дугой,
    как у руки. clicks — кадры нажатий. Курсор проявляется за 6 кадров до
    первого ключа и гаснет за 8 кадров после hide. */
export function cursorAt(keys: CursorKey[], frame: number, clicks: number[] = [], hide = Infinity): CursorState {
  const first = keys[0]
  if (!first) return { x: 0, y: 0, press: 0, opacity: 0 }
  let x = first.x
  let y = first.y
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!
    const b = keys[i]!
    if (frame <= a.at) break
    const t = easeInOut(span(frame, a.at, b.at - a.at))
    const bow = Math.sin(Math.PI * t) * 0.06
    x = mix(a.x, b.x, t) + (b.y - a.y) * bow
    y = mix(a.y, b.y, t) - (b.x - a.x) * bow
  }
  const press = clicks.reduce((max, click) => Math.max(max, 1 - Math.abs(frame - click) / 3), 0)
  const opacity = easeOut(span(frame, first.at - 6, 6)) * (1 - span(frame, hide, 8))
  return { x, y, press: clamp01(press), opacity }
}

/** Курсор macOS (увеличен в 1,3 раза, 00-SYSTEM §7.1): чёрная стрелка с белой
    кромкой. Точка (x, y) — кончик стрелки. */
export function Cursor({ x, y, press = 0, opacity = 1, size = 1.3 }: { x: number; y: number; press?: number; opacity?: number; size?: number }) {
  if (opacity <= 0.001) return null
  const scale = size * (1 - 0.14 * press)
  return (
    <svg
      width={30}
      height={36}
      viewBox="-2 -2 30 36"
      style={{
        position: 'absolute',
        left: x - 3,
        top: y - 3,
        transform: `scale(${scale})`,
        transformOrigin: '3px 3px',
        opacity,
        overflow: 'visible',
        filter: 'drop-shadow(0 2px 3px rgba(15, 23, 42, 0.28))',
      }}
    >
      <path d="M1 1 L1 23.5 L6.7 18.3 L10.6 27.2 L14.3 25.6 L10.5 16.9 L18.2 16.9 Z" fill="#111827" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

/** Круг от клика: светлое кольцо с оттенком акцента расходится и гаснет.
    Ставить в точку нажатия (cursorAt(keys, click)), а не за курсором: курсор
    после клика уходит, круг остаётся на кнопке. */
export function Ripple({ x, y, at, size = 34, color }: { x: number; y: number; at: number; size?: number; color?: string }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  /* Звук — из самого круга: сцены ставят круги и в кадре, и в мире под камерой. */
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('click', at, self)
  const t = span(frame, at, 18)
  if (frame < at || t >= 1) return null
  const r = mix(size * 0.25, size, easeOut(t))
  const tone = color ?? accent
  return (
    <div
      ref={self}
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `2.5px solid ${tint(tone, 0.55 * (1 - t))}`,
        background: tint(tone, 0.12 * (1 - t)),
        boxSizing: 'border-box',
      }}
    />
  )
}

/** Касание на телефоне (00-SYSTEM §7.2): круг 44 pt — белый 35% и кольцо
    акцента; при нажатии сжимается до 90%, затем волна до 90 pt гаснет за 12
    кадров. scale — пикселей на точку iOS. */
export function Tap({ x, y, at, scale = 1, color }: { x: number; y: number; at: number; scale?: number; color?: string }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('tap', at, self)
  const tone = color ?? accent
  if (frame < at - 6 || frame > at + 16) return null
  const appear = easeOut(span(frame, at - 6, 5))
  const press = 1 - 0.1 * clamp01(1 - Math.abs(frame - at) / 3)
  const leave = span(frame, at + 4, 10)
  const circle = 44 * scale * press
  const wave = span(frame, at, 12)
  const waveR = mix(22, 45, easeOut(wave)) * scale
  return (
    <>
      <div
        ref={self}
        style={{
          position: 'absolute',
          left: x - circle / 2,
          top: y - circle / 2,
          width: circle,
          height: circle,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.35)',
          border: `${2 * scale}px solid ${tint(tone, 0.9)}`,
          boxSizing: 'border-box',
          opacity: appear * (1 - leave),
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.15)',
        }}
      />
      {frame >= at && wave < 1 && (
        <div
          style={{
            position: 'absolute',
            left: x - waveR,
            top: y - waveR,
            width: waveR * 2,
            height: waveR * 2,
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${tint(tone, 0.6 * (1 - wave))}`,
            boxSizing: 'border-box',
          }}
        />
      )}
    </>
  )
}

/** Свайп на телефоне: круг касания едет от from к to за dur кадров, за ним —
    сужающийся след из 8 отсчётов, след гаснет за 10 кадров. */
export function Swipe({ from, to, at, dur = 14, scale = 1, color }: { from: readonly [number, number]; to: readonly [number, number]; at: number; dur?: number; scale?: number; color?: string }) {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const tone = color ?? accent
  const place = (f: number) => {
    const t = easeInOut(span(f, at, dur))
    return [mix(from[0], to[0], t), mix(from[1], to[1], t)] as const
  }
  const head = place(frame)
  const self = useRef<HTMLDivElement>(null)
  useSoundCue('tap', at, self, { gain: 0.5 })
  useSoundTrack(`swipe-${at}`, 'whoosh', frame >= at && frame <= at + dur, self, { gain: 0.35 })
  if (frame < at - 4 || frame > at + dur + 12) return null
  const leave = span(frame, at + dur, 10)
  const trail = Array.from({ length: 8 }, (_, i) => place(frame - (i + 1) * 1.2))
  const r = 22 * scale
  return (
    <>
      {trail.map(([tx, ty], i) => {
        const k = 1 - (i + 1) / 9
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: tx - r * k,
              top: ty - r * k,
              width: r * 2 * k,
              height: r * 2 * k,
              borderRadius: '50%',
              background: tint(tone, 0.16 * k * (1 - leave)),
            }}
          />
        )
      })}
      <div
        ref={self}
        style={{
          position: 'absolute',
          left: head[0] - r,
          top: head[1] - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.35)',
          border: `${2 * scale}px solid ${tint(tone, 0.9)}`,
          boxSizing: 'border-box',
          opacity: easeOut(span(frame, at - 4, 4)) * (1 - leave),
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.15)',
        }}
      />
    </>
  )
}

/** Курсор по ключам мира с кликами — всё сразу: круги кликов остаются в точке
    нажатия, курсор и круги стоят в координатах кадра (view.project), поэтому
    не растут на наезде. Без view координаты ключей — уже координаты кадра. */
export function CursorPath({
  keys,
  clicks = [],
  hide = Infinity,
  view,
}: {
  keys: CursorKey[]
  clicks?: number[]
  hide?: number
  view?: { project: (x: number, y: number) => [number, number] }
}) {
  const frame = useCurrentFrame()
  const project = view?.project ?? ((x: number, y: number): [number, number] => [x, y])
  const state = cursorAt(keys, frame, clicks, hide)
  const [x, y] = project(state.x, state.y)
  return (
    <>
      {clicks.map((click) => {
        const at = cursorAt(keys, click)
        const [rx, ry] = project(at.x, at.y)
        return <Ripple key={click} x={rx} y={ry} at={click} />
      })}
      <Cursor x={x} y={y} press={state.press} opacity={state.opacity} />
    </>
  )
}
