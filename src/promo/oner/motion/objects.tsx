import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  Quaternion,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type Texture,
} from 'three'
import { SCREEN_BLEND } from '../focus'
import { useWorldTheme } from '../worldTheme'
import { soundCue } from '../sound'
import { roundedPlane, roundedSlab } from '../shapes'
import { mergeGeometries } from './merge'
import { card, tint, write } from './paint'

/* Процедурные модели моушн-слоя (06-MOTION, §2): всё строится кодом из
   скруглённых примитивов, без скачанных файлов. Движение задаёт владелец
   модели — через функции кадра. */

/* ── Liquid Glass ─────────────────────────────────────────────────────── */

/* Владелец, 28.09: «неон удешевляет, давай Liquid Glass». Поверхности — матовое
   стекло: пропускает и размывает то, что за ним (transmission), фаска ловит свет
   студии (карта окружения мира) — светлая кромка по краю вместо цветного
   ореола; лёгкий дымчатый тон в толще. */
export function glassMaterial({
  tint: color = '#1b1d23',
  roughness = 0.3,
  thickness = 0.22,
  distance = 0.45,
}: {
  /** Цвет толщи стекла. */
  tint?: string
  /** Матовость: 0 — прозрачное, 0,3 — заметно размывает. */
  roughness?: number
  thickness?: number
  /** Чем меньше, тем гуще цвет толщи. */
  distance?: number
} = {}): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness,
    transmission: 1,
    thickness,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    specularIntensity: 1,
    attenuationColor: new Color(color),
    attenuationDistance: distance,
    transparent: true,
  })
}

/** Тон толщи стекла под тему мира: тёмные тона v3.1 в светлой студии (v3.2)
    становятся белым матовым стеклом, светлые и цветные остаются как есть. */
export function glassTone(tone: string, theme: 'light' | 'dark'): string {
  if (theme !== 'light') return tone
  const color = new Color(tone)
  const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
  return luma < 0.12 ? '#eef1f6' : tone
}

/* ── Стеклянная карточка ──────────────────────────────────────────────── */

export function GlassCard({
  width,
  height,
  radius,
  texture,
  depth = 0.014,
  body,
}: {
  width: number
  height: number
  radius: number
  texture: Texture | null
  depth?: number
  /** Цвет толщи стекла. */
  body?: string
}) {
  /* Тон толщи по умолчанию — от темы мира: в светлой студии стекло белое. */
  const theme = useWorldTheme()
  const tone = glassTone(body ?? '#1b1d23', theme)
  const glass = useMemo(() => glassMaterial({ tint: tone }), [tone])
  useEffect(() => () => glass.dispose(), [glass])
  return (
    <>
      <mesh geometry={roundedSlab(width, height, depth, radius)} material={glass} />
      {texture && (
        <mesh geometry={roundedPlane(width - 0.006, height - 0.006, Math.max(0.002, radius - 0.003))} position={[0, 0, depth / 2 + 0.0008]}>
          <meshBasicMaterial map={texture} toneMapped={false} transparent alphaTest={0.01} {...SCREEN_BLEND} />
        </mesh>
      )}
    </>
  )
}

/* ── MacBook ──────────────────────────────────────────────────────────── */

const LID = { width: 1.36, height: 0.9, depth: 0.02 }
const BASE = { width: 1.36, depth: 0.94, height: 0.036 }
/** Экран 16:10 на крышке, м; центр экрана — на 1 см выше центра крышки. */
export const LAPTOP_SCREEN = { width: 1.26, height: 0.79, lift: 0.01 }
/** Угол открытой крышки: на 8° назад от вертикали. */
const OPEN = -0.14
const SCREEN_Y = LID.height / 2 + LAPTOP_SCREEN.lift
/* Петля стоит так, чтобы центр открытого экрана был в нуле: станция 03 и её
   выноска смотрят на экран. */
const HINGE: [number, number, number] = [0, -SCREEN_Y * Math.cos(OPEN), -SCREEN_Y * Math.sin(OPEN)]

function keyboardMatrices(): Matrix4[] {
  const key = { width: 0.075, depth: 0.07, gap: 0.012 }
  const columns = 14
  const total = columns * key.width + (columns - 1) * key.gap
  const matrices: Matrix4[] = []
  const flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2)
  const place = (column: number, row: number, span = 1) => {
    const width = span * key.width + (span - 1) * key.gap
    const x = -total / 2 + column * (key.width + key.gap) + width / 2
    const z = 0.07 + row * (key.depth + key.gap) + key.depth / 2
    matrices.push(new Matrix4().compose(new Vector3(x, 0.003, z), flat, new Vector3(width / key.width, 1, 1)))
  }
  for (let row = 0; row < 4; row++) for (let column = 0; column < columns; column++) place(column, row)
  for (const column of [0, 1, 2, 3]) place(column, 4)
  place(4, 4, 6)
  for (const column of [10, 11, 12, 13]) place(column, 4)
  return matrices
}

export function Laptop({
  frame,
  open,
  power,
  screen,
  children,
}: {
  frame: RefObject<number>
  /** Открытие крышки 0…1 по кадру. */
  open: (frame: number) => number
  /** Яркость экрана 0…1 по кадру. */
  power: (frame: number) => number
  /** Что на экране в этом кадре. */
  screen: (frame: number) => Texture | null
  /** Что лежит на экране поверх картинки (курсор, круги): оси экрана, центр — в нуле. */
  children?: ReactNode
}) {
  const lid = useRef<Group>(null)
  const display = useRef<Mesh>(null)
  const keys = useRef<InstancedMesh>(null)
  /* В светлой студии — серебристый корпус (как MacBook «Silver»), в тёмной —
     графит. */
  const light = useWorldTheme() === 'light'
  const materials = useMemo(
    () => ({
      body: new MeshStandardMaterial({ color: light ? '#c9ccd2' : '#2c2e33', roughness: light ? 0.3 : 0.36, metalness: light ? 0.55 : 0.35 }),
      keys: new MeshStandardMaterial({ color: light ? '#2a2c30' : '#141518', roughness: 0.62, metalness: 0.05 }),
      pad: new MeshStandardMaterial({ color: light ? '#b9bcc3' : '#25272b', roughness: 0.26, metalness: 0.2 }),
      bezel: new MeshBasicMaterial({ color: '#050506' }),
      screen: new MeshBasicMaterial({ color: '#000000', toneMapped: false, ...SCREEN_BLEND }),
    }),
    [light],
  )
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  const keyGeometry = useMemo(() => roundedSlab(0.075, 0.07, 0.006, 0.013), [])
  const matrices = useMemo(keyboardMatrices, [])
  useEffect(() => {
    const mesh = keys.current
    if (!mesh) return
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.instanceMatrix.needsUpdate = true
  }, [matrices])

  useFrame(() => {
    const f = frame.current ?? 0
    if (lid.current) lid.current.rotation.x = Math.PI / 2 - 0.02 + (OPEN - Math.PI / 2 + 0.02) * open(f)
    const material = materials.screen
    const texture = screen(f)
    if (material.map !== texture) {
      material.map = texture
      material.needsUpdate = true
    }
    material.color.setScalar(Math.max(0, Math.min(1, power(f))))
  })

  return (
    <group position={HINGE}>
      <mesh geometry={roundedSlab(BASE.width, BASE.depth, BASE.height, 0.05)} rotation={[-Math.PI / 2, 0, 0]} position={[0, -BASE.height / 2, BASE.depth / 2]} material={materials.body} />
      <instancedMesh ref={keys} args={[keyGeometry, materials.keys, matrices.length]} />
      <mesh geometry={roundedPlane(0.46, 0.29, 0.03)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0008, 0.7]} material={materials.pad} />
      <group ref={lid}>
        <mesh geometry={roundedSlab(LID.width, LID.height, LID.depth, 0.05)} position={[0, LID.height / 2, -LID.depth / 2]} material={materials.body} />
        <mesh geometry={roundedPlane(LID.width - 0.02, LID.height - 0.02, 0.045)} position={[0, LID.height / 2, 0.0005]} material={materials.bezel} />
        <mesh ref={display} geometry={roundedPlane(LAPTOP_SCREEN.width, LAPTOP_SCREEN.height, 0.014)} position={[0, SCREEN_Y, 0.001]} material={materials.screen} />
        <group position={[0, SCREEN_Y, 0.003]}>{children}</group>
      </group>
    </group>
  )
}

/* ── Курсор и круг клика (м-клик: только компьютер) ───────────────────── */

function arrowShape(scale: number): Shape {
  const points: [number, number][] = [
    [0, 0],
    [0, -0.74],
    [0.19, -0.56],
    [0.33, -0.86],
    [0.45, -0.8],
    [0.31, -0.51],
    [0.54, -0.51],
  ]
  const shape = new Shape()
  points.forEach(([x, y], index) => (index === 0 ? shape.moveTo(x * scale, y * scale) : shape.lineTo(x * scale, y * scale)))
  shape.closePath()
  return shape
}

export function Cursor({
  frame,
  place,
  size = 0.075,
}: {
  frame: RefObject<number>
  /** Где курсор и насколько нажат (0…1) в этом кадре; null — скрыт. */
  place: (frame: number) => { x: number; y: number; press: number } | null
  size?: number
}) {
  const group = useRef<Group>(null)
  const geometries = useMemo(() => {
    const outline = new ShapeGeometry(arrowShape(size * 1.14))
    outline.translate(-size * 0.05, size * 0.06, 0)
    return { fill: new ShapeGeometry(arrowShape(size)), outline }
  }, [size])
  useEffect(() => () => Object.values(geometries).forEach((geometry) => geometry.dispose()), [geometries])
  useFrame(() => {
    const state = place(frame.current ?? 0)
    const node = group.current
    if (!node) return
    node.visible = state !== null
    if (!state) return
    node.position.set(state.x, state.y, 0.004)
    node.scale.setScalar(1 - 0.16 * state.press)
  })
  return (
    <group ref={group}>
      <mesh geometry={geometries.outline} position={[0, 0, -0.0005]}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh geometry={geometries.fill}>
        <meshBasicMaterial color="#0a0a0a" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Круг, расходящийся от нажатия: м-клик на компьютере, м-тап на телефоне. */
export function Ripple({
  frame,
  at,
  start,
  color,
  radius = 0.09,
}: {
  frame: RefObject<number>
  at: [number, number]
  start: number
  color: string
  radius?: number
}) {
  const mesh = useRef<Mesh>(null)
  /* Liquid Glass: круг нажатия — светлый, как касание стекла на iOS; цвет
     элемента — лишь оттенок. */
  const material = useMemo(
    () => new MeshBasicMaterial({ color: new Color(color).lerp(new Color('#ffffff'), 0.65), transparent: true, toneMapped: false, depthWrite: false }),
    [color],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame(() => {
    const t = (((frame.current ?? 0) - start) / 16)
    const node = mesh.current
    if (!node) return
    /* Звук: маленький круг — касание телефона (стекло), крупный — клик мыши. */
    soundCue(start, radius < 0.035 ? 'tap' : 'click', node, { gain: 0.55 })
    node.visible = t > 0 && t < 1
    node.scale.setScalar(0.25 + 1.2 * (1 - Math.pow(1 - Math.max(0, t), 3)))
    material.opacity = 0.5 * (1 - Math.max(0, Math.min(1, t)))
  })
  return (
    <mesh ref={mesh} position={[at[0], at[1], 0.002]} material={material}>
      <ringGeometry args={[radius * 0.78, radius, 48]} />
    </mesh>
  )
}

/* ── Ключ (вход по passkey) ───────────────────────────────────────────── */

function keyGeometry(): BufferGeometry {
  const bow = new Shape()
  bow.absarc(0, 0, 0.075, 0, Math.PI * 2, false)
  const hole = new Path()
  hole.absarc(0, 0, 0.032, 0, Math.PI * 2, true)
  bow.holes.push(hole)
  const rect = (x: number, y: number, width: number, height: number, radius: number) => {
    const shape = new Shape()
    shape.moveTo(x + radius, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    shape.lineTo(x + radius, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - radius)
    shape.lineTo(x, y + radius)
    shape.quadraticCurveTo(x, y, x + radius, y)
    return shape
  }
  const options = { depth: 0.016, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 24 }
  const parts = [
    new ExtrudeGeometry(bow, options),
    new ExtrudeGeometry(rect(0.06, -0.019, 0.24, 0.038, 0.012), options),
    new ExtrudeGeometry(rect(0.2, -0.075, 0.034, 0.06, 0.01), options),
    new ExtrudeGeometry(rect(0.25, -0.064, 0.034, 0.05, 0.01), options),
  ]
  const merged = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  merged.center()
  merged.computeVertexNormals()
  return merged
}

export function KeyModel({ color }: { color: string }) {
  const geometry = useMemo(keyGeometry, [])
  /* Ключ из цветного стекла: цвет продукта — в толще, а не свечением. */
  const material = useMemo(() => glassMaterial({ tint: color, roughness: 0.12, thickness: 0.06, distance: 0.05 }), [color])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  return <mesh geometry={geometry} material={material} />
}

/* ── Блик по стеклу ───────────────────────────────────────────────────── */

const SWEEP_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const SWEEP_FRAGMENT = /* glsl */ `
uniform float uPosition;
uniform float uStrength;
uniform float uAspect;
varying vec2 vUv;
void main() {
  float x = vUv.x + (vUv.y - 0.5) * 0.45 / uAspect;
  float band = exp(-pow((x - uPosition) / 0.035, 2.0));
  float glint = exp(-pow((x - uPosition - 0.07) / 0.008, 2.0));
  gl_FragColor = vec4(vec3(1.0), (band * 0.09 + glint * 0.3) * uStrength);
}`

/** Полоса света проходит по стеклу слева направо за duration кадров. */
export function LightSweep({
  frame,
  width,
  height,
  radius,
  start,
  duration = 20,
}: {
  frame: RefObject<number>
  width: number
  height: number
  radius: number
  start: number
  duration?: number
}) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SWEEP_VERTEX,
        fragmentShader: SWEEP_FRAGMENT,
        uniforms: { uPosition: { value: -1 }, uStrength: { value: 0 }, uAspect: { value: width / height } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [width, height],
  )
  useEffect(() => () => material.dispose(), [material])
  const sweep = useRef<Mesh>(null)
  useFrame(() => {
    const t = ((frame.current ?? 0) - start) / duration
    soundCue(start, 'glint', sweep.current, { gain: 0.3, seconds: duration / 18 })
    material.uniforms.uPosition!.value = -0.35 + 1.7 * t
    material.uniforms.uStrength!.value = t > 0 && t < 1 ? 1 : 0
  })
  return <mesh ref={sweep} geometry={roundedPlane(width, height, radius)} material={material} />
}

/* ── Пятно света на полу под главным объектом станции ─────────────────── */

const POOL_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float glow = pow(1.0 - smoothstep(0.0, 1.0, r), 2.2);
  gl_FragColor = vec4(uColor * glow * uStrength, 1.0);
}`

/** Мягкое пятно цвета продукта на полу; floor — высота пола в осях станции. */
export function FloorGlow({
  frame,
  color,
  floor,
  size = 4.5,
  strength = 0.32,
  on,
}: {
  frame: RefObject<number>
  color: string
  floor: number
  size?: number
  strength?: number
  /** Сила 0…1 по кадру. */
  on: (frame: number) => number
}) {
  /* На светлом полу аддитивное пятно не видно — в светлой студии его нет. */
  const light = useWorldTheme() === 'light'
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SWEEP_VERTEX,
        fragmentShader: POOL_FRAGMENT,
        /* Liquid Glass: свет под предметом почти белый — отблеск студии, а не
           цветное пятно. */
        uniforms: { uColor: { value: new Color(color).lerp(new Color('#ffffff'), 0.75) }, uStrength: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [color],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame(() => {
    material.uniforms.uStrength!.value = 0.45 * strength * Math.max(0, Math.min(1, on(frame.current ?? 0)))
  })
  if (light) return null
  return (
    <mesh position={[0, floor + 0.004, 0.2]} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}

/* ── iPhone ───────────────────────────────────────────────────────────── */

/** Корпус — размер станции-телефона из путей (PHONE 0,36 × 0,74 м). */
const PHONE_BODY = { width: 0.36, height: 0.74, depth: 0.032, radius: 0.056 }
/** Экран 393 × 852 pt в тех же пропорциях; центр — в центре корпуса. */
export const PHONE_SCREEN = { width: 0.332, height: 0.72, radius: 0.046 }

export function Phone({
  frame,
  screen,
  power = () => 1,
  children,
  body = '#23252a',
}: {
  frame: RefObject<number>
  /** Что на экране в этом кадре. */
  screen: (frame: number) => Texture | null
  /** Яркость экрана 0…1 по кадру. */
  power?: (frame: number) => number
  /** Что лежит на экране поверх картинки (касания): оси экрана, центр — в нуле. */
  children?: ReactNode
  body?: string
}) {
  const materials = useMemo(
    () => ({
      body: new MeshStandardMaterial({ color: body, roughness: 0.32, metalness: 0.45 }),
      bezel: new MeshBasicMaterial({ color: '#050506' }),
      screen: new MeshBasicMaterial({ color: '#000000', toneMapped: false, ...SCREEN_BLEND }),
      island: new MeshBasicMaterial({ color: '#000000' }),
    }),
    [body],
  )
  useEffect(() => () => Object.values(materials).forEach((material) => material.dispose()), [materials])
  useFrame(() => {
    const f = frame.current ?? 0
    const material = materials.screen
    const texture = screen(f)
    if (material.map !== texture) {
      material.map = texture
      material.needsUpdate = true
    }
    material.color.setScalar(Math.max(0, Math.min(1, power(f))))
  })
  const front = PHONE_BODY.depth / 2
  return (
    <group>
      <mesh geometry={roundedSlab(PHONE_BODY.width, PHONE_BODY.height, PHONE_BODY.depth, PHONE_BODY.radius)} material={materials.body} />
      <mesh geometry={roundedPlane(PHONE_BODY.width - 0.012, PHONE_BODY.height - 0.012, PHONE_BODY.radius - 0.006)} position={[0, 0, front + 0.0004]} material={materials.bezel} />
      <mesh geometry={roundedPlane(PHONE_SCREEN.width, PHONE_SCREEN.height, PHONE_SCREEN.radius)} position={[0, 0, front + 0.0008]} material={materials.screen} />
      <mesh geometry={roundedPlane(0.088, 0.026, 0.013)} position={[0, PHONE_SCREEN.height / 2 - 0.028, front + 0.0012]} material={materials.island} />
      {[
        [-1, 0.16, 0.06],
        [-1, 0.07, 0.06],
        [1, 0.1, 0.1],
      ].map(([side, y, length], index) => (
        <mesh key={index} geometry={roundedSlab(0.006, length!, 0.012, 0.003)} position={[side! * (PHONE_BODY.width / 2 + 0.002), y!, 0]} material={materials.body} />
      ))}
      <group position={[0, 0, front + 0.0016]}>{children}</group>
    </group>
  )
}

/** Точка экрана iPhone (pt) → оси экрана телефона (м, центр в нуле). */
export function onPhone(x: number, y: number): [number, number] {
  return [(x / 393 - 0.5) * PHONE_SCREEN.width, (0.5 - y / 852) * PHONE_SCREEN.height]
}

/* ── Счётчик: только свойства продукта (правило владельца) ─────────────── */

/** Число накручивается от 0 до value за duration кадров; подпись — под ним.
    Только функции и свойства продукта: «19 modułów», «4 języki» — не демо-цифры. */
export function CountUp({
  frame,
  value,
  start,
  label,
  color,
  duration = 26,
  format = (count: number) => String(Math.round(count)),
  width = 0.9,
  height = 0.52,
}: {
  frame: RefObject<number>
  value: number
  start: number
  label: string
  color: string
  duration?: number
  format?: (count: number) => string
  width?: number
  height?: number
}) {
  const state = useRef({ shown: '' })
  const canvas = useMemo(() => {
    if (typeof document === 'undefined') return null
    const element = document.createElement('canvas')
    element.width = Math.round(width * 800)
    element.height = Math.round(height * 800)
    return element
  }, [width, height])
  const texture = useMemo(() => {
    if (!canvas) return null
    const made = new CanvasTexture(canvas)
    made.colorSpace = SRGBColorSpace
    made.anisotropy = 8
    return made
  }, [canvas])
  useEffect(() => () => texture?.dispose(), [texture])
  useFrame(() => {
    if (!canvas || !texture) return
    const t = Math.max(0, Math.min(1, ((frame.current ?? 0) - start) / duration))
    const eased = 1 - Math.pow(1 - t, 4)
    const shown = format(value * eased)
    if (shown === state.current.shown) return
    state.current.shown = shown
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    card(context, 2, 2, canvas.width - 4, canvas.height - 4, canvas.height * 0.12, tint('#141414', 0.72), 'rgba(255,255,255,0.1)')
    write(context, shown, canvas.width / 2, canvas.height * 0.58, { size: canvas.height * 0.42, weight: 800, color, align: 'center', tracking: -2 })
    write(context, label, canvas.width / 2, canvas.height * 0.82, { size: canvas.height * 0.1, weight: 560, color: '#888888', align: 'center' })
    texture.needsUpdate = true
  })
  return <GlassCard width={width} height={height} radius={Math.min(width, height) * 0.12} texture={texture} />
}
