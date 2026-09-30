import type { ComponentType } from 'react'
import { Sequence } from 'remotion'
import { BEAT } from './motion'

/* Сцены на сетке долей (00-SYSTEM §0: доля 15 кадров, склейка — на доле).
   Длина сцены задаётся в долях, её кадр 0 всегда стоит на доле. Следующая
   сцена входит поверх предыдущей ровно на своей доле; предыдущая ещё tail
   кадров живёт под ней и доигрывает уход — так переход делят две сцены, а
   склейка остаётся на сетке. Внутри сцены useCurrentFrame() — свой кадр. */

export interface SceneSpec {
  id: string
  /** Длина в долях: 6 = 90 кадров = 3 с. */
  beats: number
  /** Сколько кадров сцена ещё видна под следующей (уход, 3D-переход). */
  tail?: number
  component: ComponentType
}

export interface PlannedScene extends SceneSpec {
  /** Первый кадр сцены в ролике (на доле). */
  from: number
  /** Кадр, на котором встаёт следующая сцена. */
  to: number
}

/** Раскладывает сцены встык по сетке, начиная с кадра start. */
export function schedule(specs: SceneSpec[], start = 0): PlannedScene[] {
  let from = start
  return specs.map((spec) => {
    const planned = { ...spec, from, to: from + spec.beats * BEAT }
    from = planned.to
    return planned
  })
}

/** Сцены в ролике: более поздняя лежит поверх более ранней. */
export function Scenes({ plan }: { plan: PlannedScene[] }) {
  return (
    <>
      {plan.map((scene) => (
        <Sequence key={scene.id} name={scene.id} from={scene.from} durationInFrames={scene.to - scene.from + (scene.tail ?? 0)}>
          <scene.component />
        </Sequence>
      ))}
    </>
  )
}
