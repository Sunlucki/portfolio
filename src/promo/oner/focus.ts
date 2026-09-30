import {
  Color,
  CustomBlending,
  DepthTexture,
  HalfFloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Vector2,
  OneFactor,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
  WebGLRenderTarget,
  ZeroFactor,
  type Object3D,
  type PerspectiveCamera,
  type WebGLRenderer,
} from 'three'

/* Глубина резкости (владелец, 28.09: «ближайшие объекты в фокусе, задний план
   размыт диафрагмой»). Фокус — точка, куда смотрит камера, то есть станция.
   Резкая зона — FOCUS_RANGE вокруг неё; за ней и перед ней пятно растёт, как у
   объектива, пропорционально |d − f| / d. При дальнем фокусе (отъезд над миром)
   пятно слабеет как 1/f — у настоящей оптики так же, иначе весь путь сверху
   превратился бы в миниатюру.

   Три прохода после кадра с глубиной: половинное разрешение с глубиной в альфе;
   размытие по диску (64 точки по золотому углу; точка отдаёт цвет центру, только
   если её пятно до него дотягивается — так резкая станция не растекается по
   фону); сведение: где пятно меньше пикселя, остаётся резкий кадр.

   В сведении же — хроматическая аберрация на переходах (владелец, 28.09):
   красный и синий каналы расходятся от центра кадра к краям, пока камера летит;
   на станции её нет. Силу даёт мир — по скорости камеры.

   Свечение (bloom) берёт только насыщенные цвета; белый текст не светится. С
   переходом на Liquid Glass (владелец, 28.09) мир его не включает (сила 0 — проход
   пропускается): насыщенный акцент светился неоном. Экраны
   интерфейса не светятся вовсе (screenMaterial: пишут в альфу кадра ноль, а
   свечение берёт цвет с весом альфы) — иначе бирюзовый экран CRM расплывался
   ореолом. Два размытия, узкое и широкое, на 1/4 и 1/8 разрешения. Зерно и
   виньетка — для ролика: на сайте кадр остаётся чистым. */

/** Экран интерфейса: цвет смешивается как обычно, а альфу кадра экран гасит
    своей непрозрачностью — свечение его не берёт. Свойства — для материала
    three (в JSX — разворотом). */
export const SCREEN_BLEND = {
  blending: CustomBlending,
  blendSrc: SrcAlphaFactor,
  blendDst: OneMinusSrcAlphaFactor,
  blendSrcAlpha: ZeroFactor,
  blendDstAlpha: OneMinusSrcAlphaFactor,
} as const

/** Резкая зона вокруг точки фокуса, м. */
export const FOCUS_RANGE = 0.8
/** Во сколько раз быстрее пятно растёт за резкой зоной. */
const APERTURE = 1.4
/** Фокус, на котором пятно такое, как задано; дальше — слабее. */
const REFERENCE_FOCUS = 3
/** Наибольший радиус пятна — доля высоты кадра. */
const MAX_BLUR = 0.02
/** Сдвиг каналов в углу кадра при полной скорости — доля кадра. */
const ABERRATION = 0.009

/** Эффекты сведения, 0…1 каждый; seed — номер кадра для зерна. */
export interface PostEffects {
  aberration?: number
  bloom?: number
  grain?: number
  vignette?: number
  seed?: number
  /** Сколько кадров со сдвигом на долю пикселя усреднить в один (ролик). */
  samples?: number
  /** Множитель резкой зоны: на подлёте к элементу и в слежении она шире, чтобы
      весь контентный элемент был резким, а размыт только фон. */
  range?: number
}

/* Сдвиги кадра при сглаживании, пикселей: повёрнутая решётка поверх 4× MSAA —
   16 разных точек на пиксель. Светлая кромка стекла на силуэте тоньше пикселя, и
   4 выборок мало: она рвалась в пунктир, а в движении пунктир бежит по краю. */
const JITTER: [number, number][] = [
  [-0.125, -0.375],
  [0.375, -0.125],
  [0.125, 0.375],
  [-0.375, 0.125],
]

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/* Слагаемое суммы кадров со сдвигом: цвет и альфа (маска экранов для свечения). */
const ADD = /* glsl */ `
uniform sampler2D tInput;
uniform float weight;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tInput, vUv) * weight;
}`

const BLUR_OF = /* glsl */ `
uniform float focus;
uniform float range;
uniform float aperture;
uniform float reference;
float blurOf(float z) {
  float off = max(0.0, abs(z - focus) - 0.5 * range);
  return clamp(aperture * off / max(z, 0.001) * reference / focus, 0.0, 1.0);
}`

const PREFILTER = /* glsl */ `
#include <packing>
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
varying vec2 vUv;
void main() {
  float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, cameraNear, cameraFar);
  gl_FragColor = vec4(texture2D(tColor, vUv).rgb, z);
}`

/* Яркая часть кадра для свечения: 4 выборки с полного кадра, цвет с весом
   альфы (у экранов она ноль), вес — по насыщенности и яркости. Белый и серый
   (текст, панели) не светятся. */
const BRIGHT = /* glsl */ `
uniform sampler2D tSharp;
uniform vec2 texel;
varying vec2 vUv;
vec3 take(vec2 offset) {
  vec4 c = texture2D(tSharp, vUv + offset * texel);
  return c.rgb * c.a;
}
void main() {
  vec3 c = 0.25 * (take(vec2(-1.0, -1.0)) + take(vec2(1.0, -1.0)) + take(vec2(-1.0, 1.0)) + take(vec2(1.0, 1.0)));
  float peak = max(c.r, max(c.g, c.b));
  float low = min(c.r, min(c.g, c.b));
  float saturation = peak > 1e-4 ? (peak - low) / peak : 0.0;
  float weight = smoothstep(0.2, 0.55, saturation) * smoothstep(0.03, 0.2, peak);
  gl_FragColor = vec4(c * weight, 1.0);
}`

/* Гаусс 9 отсчётов за 5 выборок с линейной фильтрацией, по одной оси. */
const SPREAD = /* glsl */ `
uniform sampler2D tInput;
uniform vec2 stride;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tInput, vUv).rgb * 0.2270270270;
  c += texture2D(tInput, vUv + stride * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tInput, vUv - stride * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tInput, vUv + stride * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tInput, vUv - stride * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`

const GATHER = /* glsl */ `
${BLUR_OF}
uniform sampler2D tHalf;
uniform vec2 texel;
uniform float maxRadius;
varying vec2 vUv;
#define SAMPLES 64
const float GOLDEN_ANGLE = 2.39996323;
void main() {
  vec4 center = texture2D(tHalf, vUv);
  float centerSize = blurOf(center.a) * maxRadius;
  vec3 color = center.rgb;
  float total = 1.0;
  for (int i = 1; i < SAMPLES; i++) {
    float radius = maxRadius * sqrt(float(i) / float(SAMPLES));
    float angle = float(i) * GOLDEN_ANGLE;
    vec4 tap = texture2D(tHalf, vUv + vec2(cos(angle), sin(angle)) * radius * texel);
    float size = blurOf(tap.a) * maxRadius;
    /* Фон за резким предметом не заползает на него. */
    if (tap.a > center.a) size = min(size, centerSize * 2.0);
    color += mix(color / total, tap.rgb, smoothstep(radius - 0.5, radius + 0.5, size));
    total += 1.0;
  }
  gl_FragColor = vec4(color / total, 1.0);
}`

const COMPOSITE = /* glsl */ `
#include <packing>
${BLUR_OF}
uniform sampler2D tColor;
uniform sampler2D tBlur;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
uniform float maxRadius;
uniform float aberration;
uniform sampler2D tBloomNear;
uniform sampler2D tBloomFar;
uniform float bloom;
uniform float vignette;
uniform float grain;
uniform float seed;
uniform vec2 pixel;
varying vec2 vUv;
vec3 split(sampler2D map, vec2 shift) {
  return vec3(texture2D(map, vUv + shift).r, texture2D(map, vUv).g, texture2D(map, vUv - shift).b);
}
float sizeAt(vec2 uv) {
  return blurOf(-perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar)) * maxRadius;
}
void main() {
  /* Резкость пикселя — по самому резкому из соседей 3 × 3. На краю резкого
     предмета глубина MSAA берёт одну выборку из четырёх, и светлая кромка стекла
     на силуэте рвалась в пунктир: часть её пикселей уходила в размытый фон. */
  float size = sizeAt(vUv);
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      size = min(size, sizeAt(vUv + vec2(float(x), float(y)) * pixel));
    }
  }
  vec2 shift = (vUv - 0.5) * aberration;
  vec3 sharp = split(tColor, shift);
  vec3 blurred = split(tBlur, shift);
  vec3 color = mix(sharp, blurred, smoothstep(0.5, 2.0, size));
  color += (split(tBloomNear, shift) * 0.9 + split(tBloomFar, shift) * 1.3) * bloom;
  float edge = length((vUv - 0.5) * vec2(1.0, 0.8));
  color *= 1.0 - vignette * 0.42 * smoothstep(0.25, 0.75, edge);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  float noise = fract(sin(dot(gl_FragCoord.xy + vec2(seed * 17.0, seed * 41.0), vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor.rgb += (noise - 0.5) * grain * 0.032;
}`

function lens() {
  return {
    focus: { value: REFERENCE_FOCUS },
    range: { value: FOCUS_RANGE },
    aperture: { value: APERTURE },
    reference: { value: REFERENCE_FOCUS },
  }
}

export class FocusBlur {
  /* Кадр — 8 бит в sRGB: вдвое легче half float и без ступенек в тёмном. */
  private sharp = new WebGLRenderTarget(1, 1, {
    colorSpace: SRGBColorSpace,
    samples: 4,
    depthTexture: new DepthTexture(1, 1),
  })
  private half = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  })
  private blurred = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false })
  /* Сумма кадров со сдвигом — в линейном цвете, half float. */
  private accum = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false })
  private add = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: ADD,
    uniforms: { tInput: { value: null }, weight: { value: 1 } },
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
    depthTest: false,
    depthWrite: false,
  })
  private clearColor = new Color()
  /* Свечение: узкое на 1/4 разрешения, широкое на 1/8; по два буфера на
     разделённое размытие. */
  private near = [0, 1].map(() => new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false }))
  private far = [0, 1].map(() => new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false }))
  private bright = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: BRIGHT,
    uniforms: { tSharp: { value: null }, texel: { value: new Vector2() } },
  })
  private spread = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: SPREAD,
    uniforms: { tInput: { value: null }, stride: { value: new Vector2() } },
  })
  private prefilter = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: PREFILTER,
    uniforms: { tColor: { value: null }, tDepth: { value: null }, cameraNear: { value: 0.1 }, cameraFar: { value: 260 } },
  })
  private gather = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: GATHER,
    uniforms: { ...lens(), tHalf: { value: null }, texel: { value: new Vector2() }, maxRadius: { value: 1 } },
  })
  private composite = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: COMPOSITE,
    uniforms: {
      ...lens(),
      tColor: { value: null },
      tBlur: { value: null },
      tDepth: { value: null },
      cameraNear: { value: 0.1 },
      cameraFar: { value: 260 },
      maxRadius: { value: 1 },
      aberration: { value: 0 },
      tBloomNear: { value: null },
      tBloomFar: { value: null },
      bloom: { value: 0 },
      vignette: { value: 0 },
      grain: { value: 0 },
      seed: { value: 0 },
      pixel: { value: new Vector2(1, 1) },
    },
  })
  private quad = new Mesh(new PlaneGeometry(2, 2), this.prefilter)
  private screen = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private size = new Vector2()

  constructor() {
    this.quad.frustumCulled = false
  }

  /** Рисует сцену с размытием в target (null — экран). focus — расстояние от
      камеры до точки фокуса вдоль взгляда, м; effects — аберрация, свечение,
      виньетка и зерно. */
  render(
    gl: WebGLRenderer,
    scene: Object3D,
    camera: PerspectiveCamera,
    target: WebGLRenderTarget | null,
    focus: number,
    effects: PostEffects = {},
  ) {
    if (target) this.size.set(target.width, target.height)
    else gl.getDrawingBufferSize(this.size)
    const width = Math.max(1, Math.round(this.size.x))
    const height = Math.max(1, Math.round(this.size.y))
    const halfWidth = Math.max(1, Math.ceil(width / 2))
    const halfHeight = Math.max(1, Math.ceil(height / 2))
    const nearWidth = Math.max(1, Math.ceil(width / 4))
    const nearHeight = Math.max(1, Math.ceil(height / 4))
    const farWidth = Math.max(1, Math.ceil(width / 8))
    const farHeight = Math.max(1, Math.ceil(height / 8))
    if (this.sharp.width !== width || this.sharp.height !== height) {
      this.sharp.setSize(width, height)
      this.accum.setSize(width, height)
      this.half.setSize(halfWidth, halfHeight)
      this.blurred.setSize(halfWidth, halfHeight)
      for (const buffer of this.near) buffer.setSize(nearWidth, nearHeight)
      for (const buffer of this.far) buffer.setSize(farWidth, farHeight)
    }
    const bloom = Math.max(0, effects.bloom ?? 0)
    const samples = Math.max(1, Math.min(JITTER.length, Math.round(effects.samples ?? 1)))
    const color = samples > 1 ? this.accum.texture : this.sharp.texture

    const distance = Math.max(0.1, focus)
    this.prefilter.uniforms.tColor!.value = color
    this.prefilter.uniforms.tDepth!.value = this.sharp.depthTexture
    this.prefilter.uniforms.cameraNear!.value = camera.near
    this.prefilter.uniforms.cameraFar!.value = camera.far
    this.gather.uniforms.tHalf!.value = this.half.texture
    this.gather.uniforms.texel!.value.set(1 / halfWidth, 1 / halfHeight)
    this.gather.uniforms.maxRadius!.value = MAX_BLUR * halfHeight
    this.gather.uniforms.focus!.value = distance
    this.gather.uniforms.range!.value = FOCUS_RANGE * (effects.range ?? 1)
    this.composite.uniforms.tColor!.value = color
    this.composite.uniforms.tBlur!.value = this.blurred.texture
    this.composite.uniforms.tDepth!.value = this.sharp.depthTexture
    this.composite.uniforms.cameraNear!.value = camera.near
    this.composite.uniforms.cameraFar!.value = camera.far
    this.composite.uniforms.maxRadius!.value = MAX_BLUR * height
    this.composite.uniforms.focus!.value = distance
    this.composite.uniforms.range!.value = FOCUS_RANGE * (effects.range ?? 1)
    this.composite.uniforms.aberration!.value = ABERRATION * Math.min(1, Math.max(0, effects.aberration ?? 0))
    this.composite.uniforms.tBloomNear!.value = this.near[0]!.texture
    this.composite.uniforms.tBloomFar!.value = this.far[0]!.texture
    this.composite.uniforms.bloom!.value = bloom
    this.composite.uniforms.vignette!.value = effects.vignette ?? 0
    this.composite.uniforms.grain!.value = effects.grain ?? 0
    this.composite.uniforms.seed!.value = (effects.seed ?? 0) % 1000
    this.composite.uniforms.pixel!.value.set(1 / width, 1 / height)

    const previous = gl.getRenderTarget()
    const autoClear = gl.autoClear
    gl.autoClear = true
    if (samples === 1) {
      gl.setRenderTarget(this.sharp)
      gl.render(scene, camera)
    } else {
      /* Сглаживание ролика: кадр рисуется со сдвигами на долю пикселя и
         усредняется. Глубина — от последнего кадра (сдвиг меньше пикселя). */
      gl.getClearColor(this.clearColor)
      const clearAlpha = gl.getClearAlpha()
      gl.setClearColor(0x000000, 0)
      gl.setRenderTarget(this.accum)
      gl.clear()
      gl.setClearColor(this.clearColor, clearAlpha)
      this.add.uniforms.tInput!.value = this.sharp.texture
      this.add.uniforms.weight!.value = 1 / samples
      for (let i = 0; i < samples; i++) {
        const [x, y] = JITTER[i]!
        camera.setViewOffset(width, height, x, y, width, height)
        gl.autoClear = true
        gl.setRenderTarget(this.sharp)
        gl.render(scene, camera)
        gl.autoClear = false
        this.pass(gl, this.add, this.accum)
      }
      camera.clearViewOffset()
      gl.autoClear = true
    }
    this.pass(gl, this.prefilter, this.half)
    this.pass(gl, this.gather, this.blurred)
    if (bloom > 0) {
      const [nearA, nearB] = this.near as [WebGLRenderTarget, WebGLRenderTarget]
      const [farA, farB] = this.far as [WebGLRenderTarget, WebGLRenderTarget]
      this.bright.uniforms.tSharp!.value = color
      this.bright.uniforms.texel!.value.set(1 / width, 1 / height)
      this.pass(gl, this.bright, nearA)
      this.blurPass(gl, nearA, nearB, 1 / nearWidth, 0)
      this.blurPass(gl, nearB, nearA, 0, 1 / nearHeight)
      this.blurPass(gl, nearA, farB, 1 / farWidth, 0)
      this.blurPass(gl, farB, farA, 0, 1 / farHeight)
    }
    this.pass(gl, this.composite, target)
    gl.setRenderTarget(previous)
    gl.autoClear = autoClear
  }

  private blurPass(gl: WebGLRenderer, input: WebGLRenderTarget, output: WebGLRenderTarget, x: number, y: number) {
    this.spread.uniforms.tInput!.value = input.texture
    this.spread.uniforms.stride!.value.set(x, y)
    this.pass(gl, this.spread, output)
  }

  private pass(gl: WebGLRenderer, material: ShaderMaterial, target: WebGLRenderTarget | null) {
    this.quad.material = material
    gl.setRenderTarget(target)
    gl.render(this.quad, this.screen)
  }

  dispose() {
    this.sharp.depthTexture?.dispose()
    this.sharp.dispose()
    this.accum.dispose()
    this.add.dispose()
    this.half.dispose()
    this.blurred.dispose()
    for (const buffer of [...this.near, ...this.far]) buffer.dispose()
    this.bright.dispose()
    this.spread.dispose()
    this.prefilter.dispose()
    this.gather.dispose()
    this.composite.dispose()
    this.quad.geometry.dispose()
  }
}
