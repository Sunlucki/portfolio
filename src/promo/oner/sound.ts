import { Vector3, type Object3D } from 'three'

/* Звуковая дорожка роликов (владелец 28.09: «каждое действие пространственно
   озвучено, каждый элемент и каждый пролёт»). Мир и отделка сообщают о событиях
   (касание, клик, пролёт, попап, перо…) с точкой в мире. В обычном рендере и на
   сайте приёмник выключен и ничего не делается; в проходе записи ролика
   (Remotion, imageFormat none) события уходят в лог браузера строкой «SND {json}»,
   а звук по ним сводит sound/ (Node).

   Время — кадры мира. Ролик идёт со своим темпом (pace), поэтому событие с кадром
   мира f звучит в том кадре ролика, где мир проходит f: окно (from, to] — кадры
   мира прошлого и текущего кадра ролика. */

export type SoundKind =
  | 'tap'
  | 'click'
  | 'key'
  | 'popIn'
  | 'popOut'
  | 'toast'
  | 'success'
  | 'notify'
  | 'whoosh'
  | 'air'
  | 'flip'
  | 'pen'
  | 'tick'
  | 'thump'
  | 'stamp'
  | 'glint'
  | 'layers'
  | 'toggle'
  | 'riser'

export const soundRecorder = {
  enabled: false,
  /** Кадр ролика. */
  output: 0,
  /** Окно кадров мира этого кадра ролика: (from, to]. */
  from: -1,
  to: 0,
}

const point = new Vector3()

function write(event: Record<string, unknown>) {
  console.log(`SND ${JSON.stringify({ output: soundRecorder.output, ...event })}`)
}

function where(at: Object3D | Vector3 | [number, number, number] | null | undefined): [number, number, number] | null {
  if (!at) return null
  if (Array.isArray(at)) return at
  if ((at as Vector3).isVector3) return [(at as Vector3).x, (at as Vector3).y, (at as Vector3).z]
  ;(at as Object3D).getWorldPosition(point)
  return [point.x, point.y, point.z]
}

/** Доля кадра ролика, на которой мир проходит кадр frame (0…1), или null. */
function within(frame: number): number | null {
  const { from, to } = soundRecorder
  if (!(frame > from && frame <= to)) return null
  return to > from ? (frame - from) / (to - from) : 1
}

export interface CueOptions {
  gain?: number
  seed?: number
  /** Длительность звука, с (для пера, пролёта, подъёма). */
  seconds?: number
}

/** Разовое событие: звучит, когда мир проходит кадр frame. at — предмет или точка
    в мире. Звать из useFrame каждый кадр — лишних вызовов нет, окно одно. */
export function soundCue(frame: number, kind: SoundKind, at: Object3D | Vector3 | [number, number, number] | null | undefined, options: CueOptions = {}) {
  if (!soundRecorder.enabled) return
  const offset = within(frame)
  if (offset === null) return
  const position = where(at)
  if (!position) return
  write({ type: 'cue', kind, offset, at: position, ...options })
}

/** Непрерывный звук, привязанный к движущемуся предмету (пролёт, перо по
    линии): пока active, каждый кадр пишет точку; начало и конец — по первой и
    последней точке дорожки id. */
export function soundTrack(id: string, kind: SoundKind, active: boolean, at: Object3D | Vector3 | [number, number, number] | null | undefined, options: CueOptions = {}) {
  if (!soundRecorder.enabled || !active) return
  const position = where(at)
  if (!position) return
  write({ type: 'track', id, kind, at: position, ...options })
}

/** Поза камеры кадра ролика: слушатель. */
export function soundListener(eye: Vector3, target: Vector3, fov: number, speed: number) {
  if (!soundRecorder.enabled) return
  write({ type: 'camera', eye: [eye.x, eye.y, eye.z], target: [target.x, target.y, target.z], fov, speed })
}
