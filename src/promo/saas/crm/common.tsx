import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import { fit, type View } from '../kit/camera'
import { Painted } from '../kit/painted'
import { soundCue2d, type SoundKind } from '../kit/sound'
import { SHADOW, type Rect } from '../kit/theme'
import { LEADS, LIGHT, leadsLayout } from './twins'

/* ── Звук сцен CRM (владелец 28.09: «каждое действие пространственно озвучено»)
   Приёмы набора (клики, тосты, окна, перевороты, перо…) звучат сами; здесь —
   действия двойников CRM, у которых своего звука нет. Точка — в пикселях
   кадра: у элементов под камерой — через camera.project(). */

/** Разовый звук: кадр сцены, вид, точка кадра, громкость, длительность, с. */
export type Cue2d = readonly [at: number, kind: SoundKind, point: readonly [number, number], gain?: number, seconds?: number]

/** Звуки сцены: каждый — в кадре Math.ceil(at), как у useSoundCue. Звать до
    любого раннего return; список можно собирать в каждом кадре заново. */
export function useCueList(cues: readonly Cue2d[]) {
  const frame = useCurrentFrame()
  useLayoutEffect(() => {
    for (const [at, kind, [x, y], gain, seconds] of cues) if (Math.ceil(at) === frame) soundCue2d(kind, x, y, { gain, seconds })
  })
}

/** Центр прямоугольника мира в кадре (через камеру сцены). */
export const centerOf = (rect: Rect, project?: (x: number, y: number) => [number, number]): [number, number] =>
  project ? project(rect.x + rect.width / 2, rect.y + rect.height / 2) : [rect.x + rect.width / 2, rect.y + rect.height / 2]

/* Общее для сцен CRM после пилота: плавающий экран продукта (вырезка
   интерфейса со скруглением и мягкой тенью) и перевод координат холста
   художника в мир сцены. */

/** Место экрана 1600 × 1030 (Leady, карточка лида, Poczta, Follow-up…) в мире. */
export const SCREEN: Rect = { x: 320, y: 128, width: 1280, height: 1280 * (1030 / 1600) }

/** Прямоугольник холста (логические px художника шириной canvasWidth) → мир,
    если холст стоит в screen. */
export function place(rect: Rect, canvasWidth: number, screen: Rect = SCREEN): Rect {
  const k = screen.width / canvasWidth
  return { x: screen.x + rect.x * k, y: screen.y + rect.y * k, width: rect.width * k, height: rect.height * k }
}

/** Плавающий экран продукта: непрозрачный фон страницы (у художников фон
    полупрозрачный — под стекло 3D), скругление, мягкая большая тень. */
export function Screen({ rect, source, radius = 18, background = LIGHT.bg, children, style }: { rect: Rect; source?: HTMLCanvasElement | null; radius?: number; background?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        borderRadius: radius,
        background,
        boxShadow: `${SHADOW.window}, 0 0 0 1px rgba(15, 23, 42, 0.06)`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {source !== undefined && <Painted source={source} style={{ inset: 0 }} />}
      {children}
    </div>
  )
}

/* ── «Leady»: общий для конца станции 06 и начала 07 ────────────────────── */

/** Где в списке «Leady» (стоящем в list) первая строка — слот Marek Zieliński,
    и вид камеры на верх списка, на котором кончается 06 и начинается 07. */
export function leadsGeometry(list: Rect) {
  const L = leadsLayout()
  const scale = list.width / LEADS.width
  const pad = 8 * L.k
  const row = L.rows[0]!
  const slot: Rect = { x: list.x + (row.x - pad) * scale, y: list.y + row.y * scale, width: (row.width + pad * 2) * scale, height: row.height * scale }
  const top: View = fit({ x: list.x, y: list.y, width: list.width, height: slot.y + slot.height * 4 - list.y }, { max: 1.25 })
  return { scale, pad, slot, top }
}
