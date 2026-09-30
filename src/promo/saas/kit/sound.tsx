import { useId, useLayoutEffect, type RefObject } from 'react'
import { getInputProps, getRemotionEnvironment, useCurrentFrame } from 'remotion'

/* Звук 2D-роликов (владелец 28.09: «каждое действие пространственно озвучено»).
   Приёмы набора и сцены продуктов сообщают о действиях (клик, касание, набор,
   тост, переворот, перо…) с точкой на экране. В обычном рендере приёмник
   выключен; в проходе записи (inputProps.record, sound/record.mjs) события уходят
   в лог браузера строкой «SND {json}», звук сводит sound/mix.mjs. Точка — центр
   элемента на экране с учётом камеры и 3D-переходов (getBoundingClientRect),
   слева направо и сверху вниз — как слышит зритель перед экраном.

   Виды звуков — те же, что у 3D (packages/oner/src/sound.ts). */

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

export const sound2d = { enabled: false, absolute: 0 }

/** Ставится в Stage: включает запись по inputProps.record и помнит абсолютный
    кадр ролика (у сцен свой, относительный). */
export function SoundClock() {
  const frame = useCurrentFrame()
  /* В плеере на сайте (@remotion/player) getInputProps бросает исключение, а
     записи звука там не бывает. */
  if (!getRemotionEnvironment().isPlayer && (getInputProps() as { record?: boolean }).record) {
    sound2d.enabled = true
    sound2d.absolute = frame
  }
  return null
}

export interface CueOptions {
  gain?: number
  /** Длительность, с (перо, пролёт, подъём). */
  seconds?: number
}

type Target = RefObject<Element | null> | { x: number; y: number }

function emit(type: 'cue2d' | 'track2d' | 'probe2d', kind: SoundKind, target: Target, extra: Record<string, unknown>) {
  let x: number
  let y: number
  let w = 0
  if ('current' in target) {
    const element = target.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top + rect.height / 2
    w = rect.width
  } else {
    x = target.x
    y = target.y
  }
  console.log(`SND ${JSON.stringify({ type, output: sound2d.absolute, kind, x, y, w, ...extra })}`)
}

/** Разовый звук в кадре сцены at (дробный — в ближайшем следующем кадре).
    target — элемент (ref) или точка на экране в пикселях кадра 1920 × 1080. */
export function useSoundCue(kind: SoundKind, at: number | null | undefined, target: Target, options: CueOptions = {}) {
  const frame = useCurrentFrame()
  useLayoutEffect(() => {
    if (!sound2d.enabled || at === null || at === undefined) return
    if (frame !== Math.ceil(at)) return
    emit('cue2d', kind, target, { ...options })
  })
}

/** Серия разовых звуков (буквы печати, слова заголовка, щелчки счётчика):
    звук в каждом кадре из списка, один на кадр. */
export function useSoundCues(kind: SoundKind, frames: readonly number[], target: Target, options: CueOptions = {}) {
  const frame = useCurrentFrame()
  useLayoutEffect(() => {
    if (!sound2d.enabled) return
    if (!frames.some((at) => Math.ceil(at) === frame)) return
    emit('cue2d', kind, target, { ...options })
  })
}

/** Непрерывный звук движущегося элемента: пока active, точка каждый кадр. */
export function useSoundTrack(id: string, kind: SoundKind, active: boolean, target: Target, options: CueOptions = {}) {
  useLayoutEffect(() => {
    if (!sound2d.enabled || !active) return
    emit('track2d', kind, target, { id, ...options })
  })
}

/** Разовый звук без хука — из обработчика кадра сцены (frame === нужному кадру). */
export function soundCue2d(kind: SoundKind, x: number, y: number, options: CueOptions = {}) {
  if (!sound2d.enabled) return
  console.log(`SND ${JSON.stringify({ type: 'cue2d', output: sound2d.absolute, kind, x, y, w: 0, ...options })}`)
}

export interface ProbeOptions {
  gain?: number
  /** Порог хода за кадр: меньше — стоит (t — 0,004; угол — 0,3°; px — 0,6). */
  eps?: number
  /** Звук длиннее движения во столько раз (шторка: видна половина хода). */
  stretch?: number
  /** Громкость по пройденному пути на экране: короткий перелёт — тише. */
  travel?: boolean
  /** Звучит только рост значения (перо рисует; стирание — тишина). */
  rising?: boolean
  /** Наименьший итоговый ход движения: отскок пружины после перелёта меньше
      и звуком не считается (переворот — 25°, ход 0…1 — 0,15). */
  min?: number
}

/** Проба хода: у приёма, чьё движение задаёт сцена (t, угол, точка), нет кадра
    начала — он каждый кадр сообщает значение хода, а сведение само находит,
    где оно меняется, и ставит звук kind на каждое движение: от начала до конца
    хода, в точке элемента. Нужен один проход записи в одной вкладке (record.mjs),
    чтобы useId элемента был одним на весь ролик. */
export function useSoundProbe(kind: SoundKind, value: number | readonly number[], target: Target, options: ProbeOptions = {}) {
  const id = useId()
  useLayoutEffect(() => {
    if (!sound2d.enabled) return
    emit('probe2d', kind, target, { id, v: typeof value === 'number' ? [value] : value, ...options })
  })
}

/** Камера сцены: вид каждый кадр — сведение даёт воздух наездам и отъездам. */
export function useSoundView(view: { x: number; y: number; zoom: number }) {
  const id = useId()
  useLayoutEffect(() => {
    if (!sound2d.enabled) return
    console.log(`SND ${JSON.stringify({ type: 'view2d', output: sound2d.absolute, id, x: view.x, y: view.y, zoom: view.zoom })}`)
  })
}
