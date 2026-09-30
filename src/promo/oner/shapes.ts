import { BufferAttribute, ExtrudeGeometry, Shape, ShapeGeometry, Vector2, Vector3, type BufferGeometry, type WebGLProgramParametersWithUniforms } from 'three'

/* Закруглённый стиль (владелец, 28.09: «без прямых углов»): у панелей,
   экранов, подсветки и порталов скруглены углы, у плит — фаска. Геометрии
   одного размера общие: мир строит их один раз. */

/** Радиус угла панели, м: десятая часть меньшей стороны, от 2,5 до 9 см. */
export function cornerRadius(width: number, height: number): number {
  return Math.min(0.09, Math.max(0.025, Math.min(width, height) * 0.1))
}

function roundedShape(width: number, height: number, radius: number): Shape {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const x = -width / 2
  const y = -height / 2
  const shape = new Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(x + width, y + height - r)
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false)
  shape.lineTo(x + r, y + height)
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(x, y + r)
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

const cache = new Map<string, BufferGeometry>()

function cached(key: string, build: () => BufferGeometry): BufferGeometry {
  let geometry = cache.get(key)
  if (!geometry) {
    geometry = build()
    cache.set(key, geometry)
  }
  return geometry
}

/** Плоскость со скруглёнными углами; UV — на весь прямоугольник, как у
    planeGeometry, поэтому текстура экрана ложится так же. */
export function roundedPlane(width: number, height: number, radius: number): BufferGeometry {
  return cached(`plane|${width}|${height}|${radius}`, () => {
    const geometry = new ShapeGeometry(roundedShape(width, height, radius), 10)
    const position = geometry.getAttribute('position')
    const uv = new Float32Array(position.count * 2)
    for (let i = 0; i < position.count; i++) {
      uv[i * 2] = position.getX(i) / width + 0.5
      uv[i * 2 + 1] = position.getY(i) / height + 0.5
    }
    geometry.setAttribute('uv', new BufferAttribute(uv, 2))
    return geometry
  })
}

/** Плита со скруглёнными углами и фаской; внешний размер — ровно width × height
    × depth, центр — в нуле. */
export function roundedSlab(width: number, height: number, depth: number, radius: number): BufferGeometry {
  return cached(`slab|${width}|${height}|${depth}|${radius}`, () => {
    const bevel = Math.min(0.006, depth / 3)
    const geometry = new ExtrudeGeometry(roundedShape(width - bevel * 2, height - bevel * 2, Math.max(0, radius - bevel)), {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 10,
    })
    geometry.translate(0, 0, -(depth - bevel * 2) / 2)
    geometry.computeVertexNormals()
    smoothEdges(geometry)
    return geometry
  })
}

/* Фаска и торец со сглаженными нормалями, лицо и тыл — плоские. Грани фаски на
   экране тоньше пикселя; с плоскими нормалями соседние грани блестят по-разному,
   и светлая кромка стекла рвалась в пунктир, который в движении бежит по краю. */
function smoothEdges(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const key = (i: number) => `${position.getX(i).toFixed(5)}|${position.getY(i).toFixed(5)}|${position.getZ(i).toFixed(5)}`
  /* Сумма разных нормалей граней в каждой точке: у квадрата грани два
     треугольника, и одна грань не должна считаться дважды. */
  const sums = new Map<string, { sum: Vector3; seen: Set<string> }>()
  for (let i = 0; i < position.count; i++) {
    const k = key(i)
    const entry = sums.get(k) ?? { sum: new Vector3(), seen: new Set<string>() }
    sums.set(k, entry)
    const n = `${normal.getX(i).toFixed(3)}|${normal.getY(i).toFixed(3)}|${normal.getZ(i).toFixed(3)}`
    if (entry.seen.has(n)) continue
    entry.seen.add(n)
    entry.sum.x += normal.getX(i)
    entry.sum.y += normal.getY(i)
    entry.sum.z += normal.getZ(i)
  }
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(normal.getZ(i)) > 0.9999) continue
    const sum = sums.get(key(i))!.sum
    const length = sum.length()
    if (length > 1e-6) normal.setXYZ(i, sum.x / length, sum.y / length, sum.z / length)
  }
  normal.needsUpdate = true
}

/* Скругление экрана шейдером — для экрана портала: при влёте углы
   распрямляются, и к подмене мира портал заполняет кадр целиком. Маска
   работает только в углах: прямые края остаются краями геометрии и
   сглаживаются как обычно. */
export interface RoundedMask {
  radius: { value: number }
  onBeforeCompile: (shader: WebGLProgramParametersWithUniforms) => void
  customProgramCacheKey: () => string
}

export function roundedMask(width: number, height: number, radius: number): RoundedMask {
  const size = { value: new Vector2(width, height) }
  const round = { value: radius }
  return {
    radius: round,
    customProgramCacheKey: () => 'oner-rounded-mask',
    onBeforeCompile: (shader) => {
      shader.uniforms.uRoundSize = size
      shader.uniforms.uRoundRadius = round
      shader.vertexShader = `varying vec2 vRoundUv;\n${shader.vertexShader}`.replace(
        '#include <uv_vertex>',
        '#include <uv_vertex>\n  vRoundUv = uv;',
      )
      shader.fragmentShader = `uniform vec2 uRoundSize;\nuniform float uRoundRadius;\nvarying vec2 vRoundUv;\n${shader.fragmentShader}`.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
  {
    vec2 p = (vRoundUv - 0.5) * uRoundSize;
    vec2 q = abs(p) - (uRoundSize * 0.5 - uRoundRadius);
    if (uRoundRadius > 0.0001 && q.x > 0.0 && q.y > 0.0) {
      float d = length(q) - uRoundRadius;
      float aa = fwidth(d);
      float coverage = 1.0 - smoothstep(-aa, aa, d);
      if (coverage <= 0.0) discard;
      diffuseColor.a *= coverage;
    }
  }`,
      )
    },
  }
}
