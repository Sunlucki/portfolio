import { BufferAttribute, BufferGeometry } from 'three'

/* Склейка неиндексированных геометрий (ExtrudeGeometry) в одну: подряд
   позиции, нормали и UV. Своя — чтобы не тянуть three/examples: в сборке
   роликов пути внутри three подменяются. */
export function mergeGeometries(parts: BufferGeometry[]): BufferGeometry {
  const merged = new BufferGeometry()
  for (const name of ['position', 'normal', 'uv']) {
    const sources = parts.map((part) => (part.index ? part.toNonIndexed() : part).getAttribute(name))
    if (sources.some((source) => !source)) continue
    const itemSize = sources[0]!.itemSize
    const total = sources.reduce((sum, source) => sum + source!.count * itemSize, 0)
    const array = new Float32Array(total)
    let offset = 0
    for (const source of sources) {
      array.set(source!.array as ArrayLike<number>, offset)
      offset += source!.count * itemSize
    }
    merged.setAttribute(name, new BufferAttribute(array, itemSize))
  }
  return merged
}
