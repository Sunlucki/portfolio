import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlendFunction, Effect, type ChromaticAberrationEffect, type NoiseEffect } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { PHRASES, PHRASE_SHAPES, SHAPE_SCROLL, phraseRuns, type Run } from '../content';
import heroPupil from '../heroPupil.json';
import { coverCrop } from '../components/coverCrop';
import { PORTRAIT, handoff, handoffLength } from './aboutStage';
import { landMask } from './earth';
import { KeepSize } from './KeepSize';

/**
 * The manifesto after the hero: one cloud of particles that takes a shape for every phrase (a galaxy, the
 * Earth, the Earth lit where people live, a beating heart, a bulb the hands reach for and don't quite touch,
 * a brain with signals running through it, a laptop, and an eye that follows the cursor), with the phrase
 * itself written in particles underneath. It starts as an iris gathering over the hero's pupil, which winds
 * into a galaxy, holds the first phrase and collapses into the planet. The shapes flow into each other as the page scrolls: particles lift
 * off, swirl through depth towards the lens and settle into the next one; only into the laptop the camera
 * dives, through its keys, down to its chip, whose brain then turns into the letters AI. Points sit mostly on outlines
 * and flicker like current (after React Bits' Electric Logo), a light pulse sweeps across, dust streams
 * past. Bloom, grain and a chromatic aberration that follows the scroll speed and the morph do the lens
 * work. All motion runs on the GPU.
 *
 * At the end the About section slides over this one and the eye breaks up into Bogdan's portrait: the
 * particles land where the About stage is about to show the photo (aboutStage.ts), drawing it like a
 * halftone, and the portrait fades in over them.
 */

export type ManifestoBridge = {
  section: HTMLElement;
  hero: HTMLElement | null; // carries the frame the hero shows (data-frame)
  video: HTMLCanvasElement | null; // the hero's video canvas, to find the pupil on screen
  about: HTMLElement | null; // the About section, which slides over the end of this one…
  stage: HTMLElement | null; // …and its stage, where the particles assemble the portrait
  track: number; // length of the phrases' scroll, in shapes (the last phrase holds a little longer)
  idle: (idle: boolean) => void; // the portrait has taken over: this one can stop rendering
};

type Props = {
  active: boolean;
  bridge: RefObject<ManifestoBridge | null>;
};

const small = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COUNT = small ? 26000 : 64000;
const DUST = small ? 1400 : 4000;
const FOV = 42;
const DISTANCE = 16; // camera → formation plane
const AMBIENT = 0.1; // share of particles that drift loosely around each shape
const IRIS_INNER = 0.12; // iris pupil radius, in world heights at the formation plane
const IRIS_FROM = 55; // hero frames over which the particle iris gathers over the real one
const IRIS_FULL = 64;
// The phrase each shape carries, from the galaxy (the iris, wound up) to the eye: the Earth, its lights, heart,
// idea, brain, laptop, the chip with a brain and the chip with AI (both under one phrase); then the portrait.
const PHRASE_OF = PHRASE_SHAPES.flatMap((n, k) => Array<number>(n).fill(k));
const STAGE = SHAPE_SCROLL; // scroll from each shape to the next, in shapes
const STAGES = STAGE.length; // pairs of shapes before the hand-over
const TRACK = STAGE.reduce((sum, n) => sum + n);
const DIVE = 6; // the pair the camera dives through: into the laptop, down to its chip
const S = 4; // floats per point: x, y, z and the part of its shape
// Parts of a shape that move or shine on their own (read by the vertex shader).
// A part's id is a whole number; its fraction (below 0.5) can carry data: a spark's run, a model's shade.
const PART = {
  loose: 0, iris: 1, lid: 2, line: 3, white: 4, glint: 5, portrait: 6,
  land: 10, coast: 11, ocean: 12, air: 13, city: 14, heart: 15, cortex: 16, signal: 17, shell: 18, key: 19, screen: 20, code: 21,
  hand: 22, nail: 23, glass: 24, base: 25, bolt: 26, caret: 27, board: 28, trace: 29, metal: 30, pad: 31, neon: 32, sparkU: 33, sparkV: 34,
};
const IDEA_PARTS = [PART.hand, PART.nail, PART.glass, PART.base, PART.bolt]; // as scripts/prepare-models.py tags them
const LAPTOP_TILT = 1.0; // radians the laptop's deck leans back from facing the viewer: it is seen from 33° above
const CHIP_TILT = 0.82; // the chip's board, seen more from above: diving in, the camera pitches down
const YAW = -0.32; // both turned a little
const NIGHT = 0.25; // added to the Earth's parts once its lights are on: the land dims to night
const LOWER_LID = 0.78; // depth of the lower lid against the height of the upper one
const IRIS_SIZE = 1.08; // iris radius in half heights of the eye: the lids cut it, like a real one's
// The layer lies over the hero and the page. Rather than a CSS screen blend (costly to composite, in Safari
// above all), the canvas is transparent and this last pass gives every pixel the alpha of its brightest
// channel (in the sRGB it is encoded to next): as premultiplied colour it then adds up like a screen
// blend, and black stays see-through.
class ScreenAlpha extends Effect {
  constructor() {
    super(
      'ScreenAlpha',
      /* glsl */ `
        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
          vec3 c = clamp(inputColor.rgb, 0.0, 1.0);
          outputColor = vec4(c, pow(max(max(c.r, c.g), c.b), 1.0 / 2.2));
        }
      `,
      { blendFunction: BlendFunction.SRC },
    );
  }
}

const worldTall = () => 2 * DISTANCE * Math.tan(((FOV / 2) * Math.PI) / 180); // world height seen at the plane
const vec3 = (v: number[]) => `vec3(${v.map((n) => n.toFixed(4)).join(', ')})`; // a GLSL literal

// 3D simplex noise from github.com/ashima/webgl-noise — Copyright (C) 2011 Ashima Arts, Ian McEwan.
// Distributed under the MIT License.
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

// Soft round sprite with a hot core; colour is added (additive blending).
const SPRITE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

type Uniforms = {
  uTime: { value: number };
  uMorph: { value: number };
  uFade: { value: number };
  uPixel: { value: number };
  uSpeed: { value: number };
  uTravel: { value: number };
  uDust: { value: number };
  uIrisOn: { value: number };
  uIrisCenter: { value: THREE.Vector2 };
  uIrisScale: { value: number };
  uIrisOuter: { value: number }; // outer radius of the iris shape
  uGather: { value: number }; // 0 → 1: the iris gathers out of a loose swirl
  uTwist: { value: number }; // 0 → 1: it winds into a spiral
  uEarth: { value: THREE.Vector4 }; // centre and radius of the Earth
  uHeart: { value: THREE.Vector4 }; // centre of the heart (it beats about it) and its height
  uBulb: { value: THREE.Vector4 }; // centre and radius of the idea's bulb
  uBrain: { value: THREE.Vector4 }; // centre of the brain and its length
  uChip: { value: THREE.Vector4 }; // centre of the chip and half its board
  uDive: { value: THREE.Vector4 }; // where the chip sits in the laptop, and how many times nearer the camera gets
  uDiveOn: { value: number }; // the camera is diving into the laptop
  uSpinFrom: { value: number };
  uSpinTo: { value: number };
  uEye: { value: THREE.Vector4 }; // centre and half extents of the eye's opening
  uGaze: { value: THREE.Vector2 }; // where its iris looks, in world units
  uBlink: { value: number };
  uAboutOn: { value: number }; // the particles are headed for the portrait
  uAbout: { value: THREE.Matrix4 }; // the photo's uv → this canvas's clip space, through the stage's framing
  uCrop: { value: THREE.Vector4 }; // the part of the photo the stage shows: offset and size, in uv
  uUnproject: { value: THREE.Matrix4 }; // this canvas's clip space → world
  uPlaneZ: { value: number }; // depth of the formation plane in clip space
  uAboutDot: { value: number }; // size of the portrait's dots, in pixels
};
type Morph = { pair: number };
type Lens = {
  aberration: RefObject<ChromaticAberrationEffect | null>;
  noise: RefObject<NoiseEffect | null>;
};

// The materials are built here rather than as JSX props: R3F copies a `uniforms` prop into the material,
// and these uniforms must stay the very objects the rig updates every frame.
function useSprites(vertexShader: string, uniforms: Record<string, THREE.IUniform>) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: SPRITE_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [vertexShader, uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

// ——— shapes → points ———

// Hilbert index of (x, y) on a 1024 grid; sorting every shape's points by it pairs particles with
// nearby places in the next shape, so the cloud flows instead of criss-crossing.
function hilbert(x: number, y: number) {
  let d = 0;
  for (let s = 512; s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      [x, y] = [y, x];
    }
  }
  return d;
}

const gaussian = () => {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// The order of the points along the Hilbert curve of (u, v) in [0, 1]²: by default their x/y within ±half.
function hilbertOrder(points: Float32Array, half: number, uv?: (i: number) => [number, number]) {
  const keys = new Float64Array(COUNT);
  const order = new Uint32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const [u, v] = uv ? uv(i) : [(points[i * S] / half + 1) / 2, (points[i * S + 1] / half + 1) / 2];
    const x = Math.min(1023, Math.max(0, Math.round(u * 1023)));
    const y = Math.min(1023, Math.max(0, Math.round(v * 1023)));
    keys[i] = hilbert(x, y) + Math.random() * 0.5;
    order[i] = i;
  }
  return order.sort((a, b) => keys[a] - keys[b]);
}

function permute(points: Float32Array, order: Uint32Array) {
  const sorted = new Float32Array(COUNT * S);
  for (let i = 0; i < COUNT; i++) sorted.set(points.subarray(order[i] * S, order[i] * S + S), i * S);
  return sorted;
}

const hilbertSort = (points: Float32Array, half: number, uv?: (i: number) => [number, number]) => permute(points, hilbertOrder(points, half, uv));

// Picks items at random, each as likely as its weight.
function weighted<T>(items: T[], weight: (item: T) => number) {
  const cdf: number[] = [];
  let total = 0;
  for (const item of items) cdf.push((total += weight(item)));
  return () => {
    const r = Math.random() * total;
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return items[lo];
  };
}

// A random point on the outline of a rectangle of half sizes hx × hy, its corners rounded by r, about 0.
function outline(hx: number, hy: number, r: number): [number, number] {
  const [sx, sy] = [hx - r, hy - r];
  const quarter = (Math.PI / 2) * r;
  const d = Math.random() * 4 * (sx + sy + quarter);
  if (d < 4 * sx) return [(d % (2 * sx)) - sx, d < 2 * sx ? hy : -hy]; // the top and bottom edges
  const e = d - 4 * sx;
  if (e < 4 * sy) return [e < 2 * sy ? hx : -hx, (e % (2 * sy)) - sy]; // the sides
  const c = (e - 4 * sy) / quarter; // round the corners: top right, top left, bottom left, bottom right
  const k = Math.min(3, Math.floor(c));
  return [(k === 0 || k === 3 ? sx : -sx) + Math.cos(c * (Math.PI / 2)) * r, (k < 2 ? sy : -sy) + Math.sin(c * (Math.PI / 2)) * r];
}

// A point on a board (the laptop's deck, the chip's board): u across it, v up it, w off its surface. Turned by
// YAW, leaning back by `tilt`, `h` world units a unit.
function onBoard(u: number, v: number, w: number, tilt: number, h: number): [number, number, number] {
  const a = u * Math.cos(YAW) - v * Math.sin(YAW);
  const b = u * Math.sin(YAW) + v * Math.cos(YAW);
  return [a * h, (b * Math.cos(tilt) + w * Math.sin(tilt)) * h, (-b * Math.sin(tilt) + w * Math.cos(tilt)) * h];
}

// Fills the last AMBIENT share of `out` with particles drifting loosely around a shape of `size`.
function ambient(out: Float32Array, size: number, lift: number) {
  for (let i = Math.round(COUNT * (1 - AMBIENT)); i < COUNT; i++) {
    out.set([gaussian() * size * 0.6, gaussian() * size * 0.45 + lift, gaussian() * size * 0.3, PART.loose], i * S);
  }
}

// The scroll arrives from the hero's close-up of the pupil, so the particles start as an iris: fibres
// radiating around a dark pupil, laid over the real one while the video still plays.
function iris(worldHeight: number) {
  const out = new Float32Array(COUNT * S);
  const inner = worldHeight * IRIS_INNER;
  const outer = worldHeight * 0.36;
  for (let i = 0; i < COUNT; i++) {
    const fibre = Math.floor(Math.random() * 180);
    const a = (fibre / 180) * Math.PI * 2 + gaussian() * 0.006 + Math.sin(fibre * 7.3) * 0.02;
    const r = inner + (outer - inner) * Math.pow(Math.random(), 0.8);
    out.set([Math.cos(a) * r, Math.sin(a) * r, gaussian() * 0.15, PART.loose], i * S);
  }
  return hilbertSort(out, outer * 1.2);
}

// "On a planet of dreams, our shared home": the Earth. Continents in dense points with their coasts traced
// brighter, the oceans a sparse blue dust, a thin atmosphere round the rim (coastlines: earth.ts).
function earth(radius: number, lift: number) {
  const W = 720;
  const H = W / 2;
  const land = landMask(W);
  const coast = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (land[i] && !(land[i - W] && land[i + W] && land[y * W + ((x + 1) % W)] && land[y * W + ((x + W - 1) % W)])) coast[i] = 1;
    }
  }
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < solid; i++) {
    const share = i / solid;
    const part = share < 0.5 ? PART.land : share < 0.66 ? PART.coast : share < 0.92 ? PART.ocean : PART.air;
    let lat = 0;
    let lon = 0;
    for (let tries = 0; tries < 400; tries++) {
      lat = Math.asin(Math.random() * 2 - 1); // uniform over the sphere
      lon = (Math.random() * 2 - 1) * Math.PI;
      const cell = Math.min(H - 1, Math.floor((0.5 - lat / Math.PI) * H)) * W + Math.min(W - 1, Math.floor((lon / (2 * Math.PI) + 0.5) * W));
      if (part === PART.land ? land[cell] : part === PART.coast ? coast[cell] : part === PART.ocean ? !land[cell] : true) break;
    }
    const r = radius * (part === PART.air ? 1.03 + Math.random() * 0.03 : 1 + gaussian() * 0.004);
    out.set([Math.cos(lat) * Math.sin(lon) * r, Math.sin(lat) * r + lift, Math.cos(lat) * Math.cos(lon) * r, part], i * S);
  }
  ambient(out, radius * 2.2, lift);
  return hilbertSort(out, radius * 2);
}

// "Our hearts beat in every corner of the world": the same Earth at night, its loose dust and air gathered into red points where people
// live, scattered by the Earth's lights at night (NASA Black Marble, scripts/prepare-lights.py). Every other
// point keeps its index and place, so only the lights move, while the land dims (NIGHT).
function earthLights(globe: Float32Array, lights: ImageData | null, radius: number, lift: number) {
  const out = globe.slice();
  for (let i = 0; i < COUNT; i++) if (out[i * S + 3] >= PART.land && out[i * S + 3] <= PART.air) out[i * S + 3] += NIGHT;
  const W = lights?.width ?? 0;
  const H = lights?.height ?? 0;
  const cdf = new Float32Array(W * H);
  let total = 0;
  for (let i = 0; i < W * H; i++) {
    total += Math.pow(lights!.data[i * 4] / 255, 1.5);
    cdf[i] = total;
  }
  const want = Math.round(COUNT * 0.14);
  let placed = 0;
  for (const kind of [PART.loose, PART.air + NIGHT]) {
    for (let i = 0; i < COUNT && placed < want; i++) {
      if (out[i * S + 3] !== kind) continue;
      let lat = Math.asin(Math.random() * 2 - 1);
      let lon = (Math.random() * 2 - 1) * Math.PI;
      if (total) {
        const r = Math.random() * total;
        let lo = 0;
        let hi = cdf.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cdf[mid] < r) lo = mid + 1;
          else hi = mid;
        }
        lon = (((lo % W) + Math.random()) / W - 0.5) * Math.PI * 2;
        lat = (0.5 - (Math.floor(lo / W) + Math.random()) / H) * Math.PI;
      }
      const r = radius * 1.006;
      out.set([Math.cos(lat) * Math.sin(lon) * r, Math.sin(lat) * r + lift, Math.cos(lat) * Math.cos(lon) * r, PART.city], i * S);
      placed++;
    }
  }
  return out;
}

// A point of a baked model (scripts/prepare-models.py: 4 bytes a point, x y z over -1..1 and the texture's
// brightness there), at `half` world units per unit, with a little `jitter` so reused points don't stack.
function modelPoint(points: Uint8Array, half: number, lift: number, jitter: number): [number, number, number, number] {
  const k = Math.floor(Math.random() * (points.length / 4)) * 4;
  const at = (j: number) => (points[k + j] / 127.5 - 1 + gaussian() * jitter) * half;
  return [at(0), at(1) + lift, at(2), points[k + 3] / 255];
}

// "And inside, our hearts are warmed by dreams": a human heart, gathered from the lights, beating (the vertex shader). Baked from "Realistic Human Heart" by neshallads (CC BY 4.0); its fat light, the muscle deep red.
// The shade rides in the part's fraction. `size` is its height.
function heartShape(points: Uint8Array | null, size: number, lift: number) {
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < solid; i++) {
    const [x, y, z, shade] = points ? modelPoint(points, size / 2, lift, 0.005) : [gaussian() * size * 0.2, gaussian() * size * 0.25 + lift, gaussian() * size * 0.15, 0.5];
    out.set([x, y, z, PART.heart + 0.4 * shade], i * S);
  }
  ambient(out, size * 1.2, lift);
  return hilbertSort(out, size);
}

// "Some of those dreams become ideas": a bulb between two hands that reach for it and don't quite touch
// it, after the Creation of Adam. Bogdan's Spline scene, baked with each point tagged by its part (hand, nail,
// glass, base, the bolt inside). The bolt glows: the dream, lit. `size` is the scene's width.
function ideaShape(points: Uint8Array | null, size: number, lift: number) {
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < solid; i++) {
    if (!points) {
      out.set([gaussian() * size * 0.2, gaussian() * size * 0.2 + lift, gaussian() * size * 0.05, PART.glass], i * S);
      continue;
    }
    const [x, y, z, tag] = modelPoint(points, size / 2, lift, 0.003);
    out.set([x, y, z, IDEA_PARTS[Math.round(tag * 255)] ?? PART.hand], i * S);
  }
  ambient(out, size * 0.9, lift);
  return hilbertSort(out, size * 0.7);
}

// The centre and radius of the idea's bulb, for the glass's rim light.
function bulbOf(points: Uint8Array | null, size: number, lift: number) {
  if (!points) return [0, lift, 0, size * 0.15];
  let [x, y, z, n] = [0, 0, 0, 0];
  for (let k = 0; k < points.length; k += 4) {
    if (points[k + 3] !== 2) continue;
    x += points[k] / 127.5 - 1;
    y += points[k + 1] / 127.5 - 1;
    z += points[k + 2] / 127.5 - 1;
    n++;
  }
  [x, y, z] = [x / n, y / n, z / n];
  let r = 0;
  for (let k = 0; k < points.length; k += 4) {
    if (points[k + 3] === 2) r += Math.hypot(points[k] / 127.5 - 1 - x, points[k + 1] / 127.5 - 1 - y, points[k + 2] / 127.5 - 1 - z);
  }
  return [(x * size) / 2, (y * size) / 2 + lift, (z * size) / 2, ((r / n) * size) / 2];
}

// "And we look for a way to make them real": a human brain, front to the right, its gyri light and the sulci
// left dark; inside, red sparks, the signals, which the vertex shader sends along short paths. Baked from
// "Low-Poly Human Brain Model" by moaazzizo123 (CC BY 4.0). `size` is its length, front to back.
function brainShape(points: Uint8Array | null, size: number, lift: number) {
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < solid; i++) {
    const [x, y, z, shade] = points ? modelPoint(points, size / 2, lift, 0.002) : [gaussian() * size * 0.25, gaussian() * size * 0.18 + lift, gaussian() * size * 0.2, 0.5];
    if (i < solid * 0.92) out.set([x, y, z, PART.cortex + 0.4 * shade], i * S);
    else {
      const deep = 0.25 + Math.random() * 0.6; // signals, well inside
      out.set([x * deep, (y - lift) * deep + lift, z * deep, PART.signal], i * S);
    }
  }
  ambient(out, size * 1.1, lift);
  return hilbertSort(out, size * 0.8);
}

// The code on the laptop's screen, drawn as bars in its colours.
const CODE = [
  '// every tool starts as a dream',
  'const dream = listen(you);',
  'const idea = shape(dream);',
  '',
  'export async function build(idea) {',
  '  const tools = [design, code, ai];',
  '  for (const tool of tools) {',
  '    idea = await tool(idea);',
  '  }',
  '  return ship(idea);',
  '}',
  '',
  'build(idea).then(launch);',
];
// The laptop's keys, row by row from the back: where the row sits front to back, its keys' height and their
// widths in keys.
const KEYBOARD: [number, number, number[]][] = [
  [0.612, 0.028, [1.25, ...Array<number>(12).fill(1), 1.25]],
  [0.566, 0.05, [...Array<number>(13).fill(1), 1.5]],
  [0.508, 0.05, [1.5, ...Array<number>(13).fill(1)]],
  [0.45, 0.05, [1.8, ...Array<number>(11).fill(1), 1.7]],
  [0.392, 0.05, [2.3, ...Array<number>(10).fill(1), 2.2]],
  [0.334, 0.05, [1, 1, 1.25, 1.25, 5, 1.25, 1.25, 1, 1, 1.5]],
];

// "I use a computer to bring dreams to life": a laptop, open and turned a little. Its shell and
// keys in steel, code on its screen in its colours (the fraction of a point's part picks one: plain, keyword,
// call, comment) and a red caret blinking at its end, the dream being built. The camera then dives into it
// (the vertex shader's dive()), down to the chip under its keys. Returns the points and where that chip sits.
// `size` is its width; its parts are laid out in widths.
function laptopShape(size: number, lift: number) {
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  const DEPTH = 0.68; // the deck, front to back
  const LID = 0.64;
  const [lv, lw] = [-Math.cos(1.92), Math.sin(1.92)]; // up the lid from the hinge: open 110°
  const PITCH = 0.058; // a key's
  const keys: [number, number, number, number][] = []; // centre and half sizes
  for (const [v, tall, widths] of KEYBOARD) {
    let u = -0.42;
    for (const w of widths) {
      keys.push([u + (w * PITCH) / 2, v, (w * PITCH - 0.016) / 2, (tall - 0.007) / 2]);
      u += w * PITCH;
    }
  }
  // On the screen, as bars (centre, half length, tone): the files in a column, then the code token by token.
  const LINE = 0.037;
  const CHAR = 0.0155;
  const TOP = 0.545;
  const bars: [number, number, number, number][] = [];
  for (let i = 0; i < 11; i++) {
    const half = 0.02 + Math.random() * 0.03;
    bars.push([-0.44 + (i % 3 ? 0.012 : 0) + half, TOP - i * LINE, half, 3]);
  }
  CODE.forEach((text, line) => {
    for (const m of text.matchAll(/(\/\/.*)|\b(const|export|async|function|for|of|await|return)\b|(\w+)(?=\()|(\w+)|([^\s\w]+)/g)) {
      bars.push([-0.26 + (m.index + m[0].length / 2) * CHAR, TOP - line * LINE, (m[0].length * CHAR) / 2 - 0.002, m[1] ? 3 : m[2] ? 1 : m[3] ? 2 : 0]);
    }
  });
  const caret = [-0.26 + CODE[CODE.length - 1].length * CHAR + 0.006, TOP - (CODE.length - 1) * LINE];
  const key = weighted(keys, ([, , hx, hy]) => hx * hy);
  const bar = weighted(bars, ([, , half]) => half);
  const inside = (hx: number, hy: number) => [(Math.random() * 2 - 1) * hx, (Math.random() * 2 - 1) * hy];
  const local: number[] = [];
  const add = (u: number, v: number, w: number, part: number) => local.push(u, v, w, part);
  // on the lid: x across, y up from the hinge, `off` out of its face towards the viewer
  const onLid = (x: number, y: number, part: number, off = 0.003) => add(x, DEPTH + y * lv - off * lw, y * lw + off * lv, part);
  for (let i = 0; i < solid; i++) {
    const k = i / solid;
    if (k < 0.05) {
      // the deck's top edge
      const [x, y] = outline(0.5, DEPTH / 2, 0.035);
      add(x, DEPTH / 2 + y, 0, PART.shell);
    } else if (k < 0.07) {
      // its bottom edge, at the front and the sides
      let [x, y] = outline(0.5, DEPTH / 2, 0.035);
      while (y > DEPTH * 0.3) [x, y] = outline(0.5, DEPTH / 2, 0.035);
      add(x, DEPTH / 2 + y, -0.028, PART.shell);
    } else if (k < 0.33) {
      // the keys: their edges, and their tops a little fainter
      const [u, v, hx, hy] = key();
      const [x, y] = Math.random() < 0.65 ? outline(hx, hy, 0.006) : inside(hx * 0.85, hy * 0.85);
      add(u + x, v + y, 0.004, PART.key);
    } else if (k < 0.355) {
      // the trackpad
      const [x, y] = outline(0.17, 0.1, 0.02);
      add(x, 0.15 + y, 0.001, PART.shell);
    } else if (k < 0.415) {
      // the lid's edge
      const [x, y] = outline(0.5, LID / 2, 0.03);
      onLid(x, LID / 2 + y, PART.shell, 0);
    } else if (k < 0.43) {
      // the screen's edge, the line under its title bar and the one beside the files
      const r = Math.random();
      if (r < 0.6) {
        const [x, y] = outline(0.47, 0.289, 0.008);
        onLid(x, 0.324 + y, PART.screen + 0.4);
      } else if (r < 0.8) onLid((Math.random() * 2 - 1) * 0.47, 0.578, PART.screen + 0.3);
      else onLid(-0.3, 0.04 + Math.random() * 0.535, PART.screen + 0.3);
    } else if (k < 0.52) {
      // the screen's glow
      const [x, y] = inside(0.47, 0.289);
      onLid(x, 0.324 + y, PART.screen + 0.1);
    } else if (k < 0.526) {
      // three dots in the title bar
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.0055;
      onLid(-0.448 + Math.floor(Math.random() * 3) * 0.017 + Math.cos(a) * r, 0.595 + Math.sin(a) * r, PART.code + 0.3);
    } else if (k < 0.99) {
      // the files and the code
      const [x, y, half, tone] = bar();
      onLid(x + (Math.random() * 2 - 1) * half, y + (Math.random() * 2 - 1) * 0.0075, PART.code + 0.1 * tone);
    } else {
      const [x, y] = inside(0.0035, 0.013);
      onLid(caret[0] + x, caret[1] + y, PART.caret, 0.004);
    }
  }
  // Laid out about the middle of its deck, turned and leaning back, then centred on the stage.
  const placed = (u: number, v: number, w: number) => onBoard(u, v - DEPTH / 2, w, LAPTOP_TILT, size);
  const box = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < solid; i++) {
    const p = placed(local[i * 4], local[i * 4 + 1], local[i * 4 + 2]);
    for (let j = 0; j < 3; j++) {
      box[j * 2] = Math.min(box[j * 2], p[j]);
      box[j * 2 + 1] = Math.max(box[j * 2 + 1], p[j]);
    }
    out.set([...p, local[i * 4 + 3]], i * S);
  }
  const centre = [(box[0] + box[1]) / 2, (box[2] + box[3]) / 2 - lift, (box[4] + box[5]) / 2];
  for (let i = 0; i < solid; i++) for (let j = 0; j < 3; j++) out[i * S + j] -= centre[j];
  ambient(out, size * 1.1, lift);
  return { points: hilbertSort(out, size * 0.8), chip: placed(0, 0.47, -0.012).map((x, j) => x - centre[j]) };
}

// Picks `count` ink pixels of a canvas: outlines get most of them (the electric look), the rest fill
// the strokes. Returns canvas-pixel coordinates.
function inkPoints(ctx: CanvasRenderingContext2D, W: number, H: number, count: number) {
  const data = ctx.getImageData(0, 0, W, H).data;
  const inked = (x: number, y: number) => data[(y * W + x) * 4 + 3] > 127;
  const edges: number[] = [];
  const fill: number[] = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!inked(x, y)) continue;
      if (!inked(x - 1, y) || !inked(x + 1, y) || !inked(x, y - 1) || !inked(x, y + 1)) edges.push(x, y);
      else if ((x + y) % 2 === 0) fill.push(x, y);
    }
  }
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const pool = i % 20 < 12 || !fill.length ? edges : fill;
    const k = Math.floor(Math.random() * (pool.length / 2)) * 2;
    out[i * 2] = pool[k] + Math.random();
    out[i * 2 + 1] = pool[k + 1] + Math.random();
  }
  return out;
}

// A drawing on a square canvas turned into `count` points, in units of half its side (y up), ordered along the
// Hilbert curve, so the points of two drawings pair up with nearby ones.
function drawnPoints(draw: (ctx: CanvasRenderingContext2D, side: number) => void, count: number) {
  const side = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  draw(ctx, side);
  const ink = inkPoints(ctx, side, side, count);
  const grid = (t: number) => Math.min(1023, Math.max(0, Math.round(t * 1023)));
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = [ink[i * 2] / side, 1 - ink[i * 2 + 1] / side];
    return { at: [x * 2 - 1, y * 2 - 1], key: hilbert(grid(x), grid(y)) };
  })
    .sort((a, b) => a.key - b.key)
    .map((point) => point.at);
}

// The brain on the chip, drawn as a circuit: two hemispheres seen from above, their outer edges scalloped into
// lobes, the left one folded, the right one wired with traces out of the midline to nodes, and a lead out of
// the bottom. On a square canvas, in units of half its side, y up.
function brainCircuit(ctx: CanvasRenderingContext2D, side: number) {
  const k = side / 2;
  const at = (x: number, y: number): [number, number] => [k + x * k, k - y * k];
  const line = (points: number[][]) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(...at(x, y)) : ctx.moveTo(...at(x, y))));
    ctx.stroke();
  };
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = side * 0.026;
  ctx.lineCap = ctx.lineJoin = 'round';
  const [BUMPS, W, H, MID, TOP] = [6, 0.64, 0.7, 0.05, 0.1];
  const rim = (phi: number, s: number) => {
    const a = Math.PI / 2 + phi * Math.PI;
    const r = 1 + 0.085 * Math.abs(Math.sin(phi * BUMPS * Math.PI));
    return [s * (MID - W * Math.cos(a) * r), TOP + H * Math.sin(a) * r];
  };
  for (const s of [-1, 1]) line([...Array.from({ length: 241 }, (_, i) => rim(i / 240, s)), [s * MID, TOP - H], [s * MID, TOP + H]]);
  // the left: a fold in from every cusp between its lobes, and two long ones through the middle
  for (let j = 1; j < BUMPS; j++) {
    const [x, y] = rim(j / BUMPS, -1);
    const len = Math.hypot(-MID - x, TOP - y);
    const [dx, dy] = [(-MID - x) / len, (TOP - y) / len];
    const [reach, bend] = j % 2 ? [0.2, 0.06] : [0.3, -0.06];
    ctx.beginPath();
    ctx.moveTo(...at(x, y));
    ctx.quadraticCurveTo(...at(x + dx * reach * 0.5 - dy * bend, y + dy * reach * 0.5 + dx * bend), ...at(x + dx * reach, y + dy * reach));
    ctx.stroke();
  }
  for (const [a, b, c, d] of [
    [[-0.2, 0.42], [-0.34, 0.3], [-0.18, 0.18], [-0.3, 0.06]],
    [[-0.16, -0.12], [-0.3, -0.2], [-0.2, -0.34], [-0.34, -0.42]],
  ]) {
    ctx.beginPath();
    ctx.moveTo(...at(a[0], a[1]));
    ctx.bezierCurveTo(...at(b[0], b[1]), ...at(c[0], c[1]), ...at(d[0], d[1]));
    ctx.stroke();
  }
  // the right: traces out of the midline, bent at 45°, each ending in a node; the lead out of the bottom
  const traces = [
    [[MID, 0.5], [0.22, 0.5], [0.34, 0.62]],
    [[MID, 0.26], [0.36, 0.26]],
    [[MID, 0.02], [0.2, 0.02], [0.34, 0.16], [0.52, 0.16]],
    [[MID, -0.22], [0.3, -0.22], [0.42, -0.1]],
    [[MID, -0.44], [0.24, -0.44], [0.34, -0.34]],
    [[0, TOP - H], [0, -0.72], [0.2, -0.92], [0.46, -0.92]],
  ];
  traces.forEach(line);
  for (const trace of traces) {
    const [x, y] = trace[trace.length - 1];
    ctx.beginPath();
    ctx.arc(...at(x, y), 0.055 * k, 0, Math.PI * 2);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out'; // hollow, over whatever it lands on
    ctx.fill();
    ctx.restore();
    ctx.stroke();
  }
}

// The letters AI, in Kanit ExtraBold.
function letterAI(ctx: CanvasRenderingContext2D, side: number) {
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(side * 0.62)}px Kanit, sans-serif`;
  ctx.fillText('AI', side / 2, side * 0.53);
}

// "I've put my most advanced tool inside it": the laptop's chip, close up, after the renders Bogdan picked. A die with the brain
// on it in cyan neon, drawn as a circuit, pins all round, on a substrate webbed with magenta traces with white
// pads at its corners, on a board whose cyan traces fade into the dark; red sparks, ideas, run in along them.
// Returns the chip twice, point for point: with the brain, and with the brain turned into the letters AI, so
// only those points move between the two. `size` is the board's width; its parts are laid out in half widths.
function chipShapes(size: number, lift: number) {
  const h = size / 2;
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  const at = (u: number, v: number, w: number) => {
    const [x, y, z] = onBoard(u, v, w, CHIP_TILT, h);
    return [x, y + lift, z];
  };
  const put = (i: number, u: number, v: number, w: number, part: number) => out.set([...at(u, v, w), part], i * S);
  const DIE = 0.3; // the chip: half its side,
  const TOP = 0.11; // its top
  const FOOT = 0.075; // and its foot
  const SUB = 0.5; // the substrate under it: half its side
  const DECK = 0.05; // and its top
  const PINS = 24; // a side
  // a point by one of the four sides: `along` it, `off` the middle
  const side = (k: number, along: number, off: number): [number, number] => (k === 0 ? [off, along] : k === 1 ? [-off, along] : k === 2 ? [along, off] : [along, -off]);
  const glow = (u: number, v: number) => 1 - smooth(0.5, 1.2, Math.max(Math.abs(u), Math.abs(v))); // the board fades out
  // the board's traces: out from the substrate's sides, then a turn along them, to a via
  const traces: { k: number; along: number; run: number; turn: number }[] = [];
  for (let k = 0; k < 4; k++) {
    for (let j = 0; j < 13; j++) {
      const turn = Math.random() < 0.25 ? 0 : (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.3);
      traces.push({ k, along: (((j + 0.5) / 13) * 2 - 1) * (SUB - 0.08), run: 0.1 + Math.random() * 0.5, turn });
    }
  }
  const trace = weighted(traces, (t) => t.run + Math.abs(t.turn));
  // components about the board: centre and half sizes
  const parts: [number, number, number, number][] = [];
  while (parts.length < 18) {
    const [u, v] = [(Math.random() * 2 - 1) * 1.15, (Math.random() * 2 - 1) * 1.15];
    if (Math.max(Math.abs(u), Math.abs(v)) > SUB + 0.2) parts.push([u, v, 0.03 + Math.random() * 0.08, 0.02 + Math.random() * 0.05]);
  }
  const component = weighted(parts, ([, , a, b]) => a + b);
  const neon = Math.round(solid * 0.15);
  const brain = drawnPoints(brainCircuit, neon);
  const letters = drawnPoints(letterAI, neon);
  const ICON = DIE * 0.86;
  for (let i = 0; i < solid; i++) {
    const k = i / solid;
    if (i < neon) put(i, brain[i][0] * ICON, brain[i][1] * ICON, TOP + 0.004, PART.neon);
    else if (k < 0.19) {
      // the die's edge
      const [u, v] = outline(DIE, DIE, 0.02);
      put(i, u, v, TOP, PART.metal + 0.4);
    } else if (k < 0.21) {
      // its top, a faint dust
      put(i, (Math.random() * 2 - 1) * DIE, (Math.random() * 2 - 1) * DIE, TOP, PART.metal + 0.04);
    } else if (k < 0.23) {
      // its foot and its corners
      if (Math.random() < 0.6) {
        const [u, v] = outline(DIE, DIE, 0.02);
        put(i, u, v, FOOT, PART.metal + 0.2);
      } else put(i, (Math.random() < 0.5 ? -1 : 1) * DIE, (Math.random() < 0.5 ? -1 : 1) * DIE, FOOT + Math.random() * (TOP - FOOT), PART.metal + 0.2);
    } else if (k < 0.31) {
      // pins all round, bent down to the substrate
      const along = (((Math.floor(Math.random() * PINS) + 0.5) / PINS) * 2 - 1) * DIE * 0.9 + (Math.random() - 0.5) * 0.008;
      const t = Math.random();
      const [u, v] = side(Math.floor(Math.random() * 4), along, DIE + t * 0.05);
      put(i, u, v, FOOT + 0.012 - (FOOT + 0.012 - DECK) * smooth(0.2, 0.7, t), PART.metal + 0.32);
    } else if (k < 0.43) {
      // the substrate's web: traces fanning out from the pins to its edge
      const lane = ((Math.floor(Math.random() * 30) + 0.5) / 30) * 2 - 1;
      const t = Math.random();
      const [u, v] = side(Math.floor(Math.random() * 4), lane * (DIE * 0.9 + t * (SUB - 0.03 - DIE * 0.9)), DIE + 0.06 + t * (SUB - DIE - 0.075));
      put(i, u, v, DECK, PART.trace + 0.2);
    } else if (k < 0.47) {
      // its top edge and corners
      if (Math.random() < 0.8) {
        const [u, v] = outline(SUB, SUB, 0.015);
        put(i, u, v, DECK, PART.trace + 0.32);
      } else put(i, (Math.random() < 0.5 ? -1 : 1) * SUB, (Math.random() < 0.5 ? -1 : 1) * SUB, Math.random() * DECK, PART.trace + 0.32);
    } else if (k < 0.51) {
      // the glow at its foot
      const [u, v] = outline(SUB + 0.006, SUB + 0.006, 0.02);
      put(i, u, v, 0.002, PART.trace + 0.4);
    } else if (k < 0.58) {
      // white pads, out from under its corners, pointed
      const [su, sv] = [Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1];
      let [u, v] = [0, 0];
      while (Math.max(Math.abs(u), Math.abs(v)) < SUB) {
        const a = SUB * Math.SQRT2 - 0.06 + Math.random() * 0.22; // along the diagonal
        const b = (Math.random() * 2 - 1) * 0.09 * Math.min(1, (SUB * Math.SQRT2 + 0.16 - a) / 0.07); // across it
        [u, v] = [((a - b) * su) / Math.SQRT2, ((a + b) * sv) / Math.SQRT2];
      }
      put(i, u, v, 0.015, PART.pad);
    } else if (k < 0.86) {
      // the board's traces
      const { k: s, along, run, turn } = trace();
      const d = Math.random() * (run + Math.abs(turn));
      const [u, v] = d < run ? side(s, along, SUB + d) : side(s, along + Math.sign(turn) * (d - run), SUB + run);
      put(i, u, v, 0, PART.board + 0.4 * glow(u, v));
    } else if (k < 0.91) {
      // components: outlined, a few lines across
      const [cu, cv, a, b] = component();
      const [u, v] = Math.random() < 0.7 ? outline(a, b, 0.004) : [(Math.random() * 2 - 1) * a, b * (Math.floor(Math.random() * 3) - 1) * 0.5];
      put(i, cu + u, cv + v, 0, PART.board + 0.3 * glow(cu, cv));
    } else if (k < 0.94) {
      // vias, at the traces' ends
      const { k: s, along, run, turn } = traces[Math.floor(Math.random() * traces.length)];
      const [u, v] = side(s, along + turn, SUB + run);
      const a = Math.random() * Math.PI * 2;
      put(i, u + Math.cos(a) * 0.016, v + Math.sin(a) * 0.016, 0, PART.board + 0.4 * glow(u, v));
    } else {
      // sparks, from a trace's turn in to the substrate (the run's length rides in the part's fraction)
      const { k: s, along, run } = traces[Math.floor(Math.random() * traces.length)];
      const [u, v] = side(s, along, SUB + run);
      put(i, u, v, 0.008, (s < 2 ? PART.sparkU : PART.sparkV) + 0.45 * run);
    }
  }
  ambient(out, size * 0.6, lift);
  // the same chip with the letters AI where the brain was
  const ai = out.slice();
  for (let i = 0; i < neon; i++) ai.set(at(letters[i][0] * ICON, letters[i][1] * ICON, TOP + 0.004), i * S);
  const order = hilbertOrder(out, size * 0.6);
  return [permute(out, order), permute(ai, order)];
}

type EyeFrame = { x: number; y: number; w: number; h: number }; // centre and half extents of the opening

// "Tell me about your dream": an eye that looks back. Lids, a crease and a dusting of white; an
// iris of fibres and rings round the pupil, with a catch light. The vertex shader turns the iris after
// the cursor, hides it behind the lids and brings the upper lid down to blink.
function eyeShape(e: EyeFrame) {
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  const iris = e.h * IRIS_SIZE;
  const pupil = iris * 0.42;
  const upper = (x: number) => e.h * (1 - (x / e.w) ** 2); // the shader's lid()
  for (let i = 0; i < solid; i++) {
    const k = Math.random();
    let x: number;
    let y: number;
    let part = PART.iris;
    if (k < 0.48) {
      // fibres radiating from the pupil
      const fibre = Math.floor(Math.random() * 160);
      const a = (fibre / 160) * Math.PI * 2 + gaussian() * 0.008 + Math.sin(fibre * 5.3) * 0.025;
      const r = pupil + (iris - pupil) * Math.pow(Math.random(), 0.85);
      [x, y] = [Math.cos(a) * r, Math.sin(a) * r];
    } else if (k < 0.66) {
      // rings: the pupil's rim, the wavy collarette and the iris's outer edge
      const a = Math.random() * Math.PI * 2;
      const ring = Math.random();
      const r = (ring < 0.45 ? pupil : ring < 0.7 ? (pupil + (iris - pupil) * 0.36) * (1 + Math.sin(a * 13) * 0.035) : iris) * (1 + gaussian() * 0.012);
      [x, y] = [Math.cos(a) * r, Math.sin(a) * r];
    } else if (k < 0.68) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * pupil * 0.3;
      [x, y] = [pupil * 0.5 + Math.cos(a) * r, pupil * 0.55 + Math.sin(a) * r];
      part = PART.glint;
    } else if (k < 0.82) {
      x = (Math.random() * 2 - 1) * e.w;
      y = upper(x) + gaussian() * e.h * 0.014;
      part = PART.lid;
    } else if (k < 0.91) {
      x = (Math.random() * 2 - 1) * e.w;
      y = -LOWER_LID * upper(x) + gaussian() * e.h * 0.014;
      part = PART.line;
    } else if (k < 0.95) {
      // the crease above the upper lid
      const reach = e.w * 0.8;
      x = (Math.random() * 2 - 1) * reach;
      y = upper(x) + e.h * 0.34 * (1 - (x / reach) ** 2) + gaussian() * e.h * 0.012;
      part = PART.line;
    } else {
      // the white, around the iris
      do {
        x = (Math.random() * 2 - 1) * e.w;
        y = (Math.random() * (1 + LOWER_LID) - LOWER_LID) * upper(x);
      } while (Math.hypot(x, y) < iris);
      part = PART.white;
    }
    out.set([e.x + x, e.y + y, gaussian() * 0.05, part], i * S);
  }
  ambient(out, e.w * 1.6, e.y);
  return hilbertSort(out, e.w * 1.2);
}

// The portrait (aboutStage.ts) as the stage frames it (`crop`, in the photo's uv, v up): points scattered
// over the photo by its brightness, so they draw it like a halftone. They stay in the photo's uv: the vertex
// shader carries them onto the stage. Sorted by where the stage shows them, so they pair with nearby places
// in the eye.
function portraitShape(image: HTMLImageElement | null, crop: number[]) {
  const W = 384;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  if (image) ctx.drawImage(image, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const [x0, y0, w, h] = crop;
  const cdf = new Float32Array(W * H);
  let total = 0;
  for (let i = 0; i < W * H; i++) {
    const u = ((i % W) + 0.5) / W;
    const v = 1 - (Math.floor(i / W) + 0.5) / H;
    const light = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
    if (u >= x0 && u <= x0 + w && v >= y0 && v <= y0 + h) total += Math.pow(Math.max(0, light - 0.05), 1.4);
    cdf[i] = total;
  }
  const out = new Float32Array(COUNT * S);
  for (let n = 0; n < COUNT; n++) {
    if (!total) {
      out.set([x0 + Math.random() * w, y0 + Math.random() * h, 0, PART.portrait], n * S); // no photo: an even veil
      continue;
    }
    const r = Math.random() * total;
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    out.set([((lo % W) + Math.random()) / W, 1 - (Math.floor(lo / W) + Math.random()) / H, 0, PART.portrait], n * S);
  }
  return hilbertSort(out, 1, (i) => [(out[i * S] - x0) / w, (out[i * S + 1] - y0) / h]);
}

// How each shape turns over time: the Earth (lit and unlit alike) spins; the heart, the brain, the idea, the
// laptop and its chip sway (the laptop and the chip alike, as the camera dives from one into the other), so
// they are never seen edge on; the rest face the viewer.
const SPIN = [0, 0.22, 0.22, 0, 0, 0, 0, 0, 0, 0, 0]; // radians per second
const SWAY = [0, 0, 0, 0.5, 0.35, 0.55, 0.2, 0.2, 0.2, 0, 0]; // radians either way
const turn = (shape: number, time: number) => SPIN[shape] * time + SWAY[shape] * Math.sin(time * 0.35);
const LIGHTS = '/manifesto/lights.webp'; // the Earth at night (scripts/prepare-lights.py)
const HEART = '/manifesto/heart.bin'; // baked models (scripts/prepare-models.py)
const BRAIN = '/manifesto/brain.bin';
const IDEA = '/manifesto/idea.bin';

// ——— the cloud ———
function Cloud({ uniforms, morph, bridge, onReady }: { uniforms: Uniforms; morph: RefObject<Morph>; bridge: RefObject<ManifestoBridge | null>; onReady: () => void }) {
  const size = useThree((state) => state.size);
  // The photo the manifesto ends in, the Earth's lights at night and the baked heart, idea and brain; each is
  // null if it failed to load.
  const [media, setMedia] = useState<{
    photo: HTMLImageElement | null;
    lights: ImageData | null;
    heart: Uint8Array | null;
    idea: Uint8Array | null;
    brain: Uint8Array | null;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = (src: string) => {
      const image = new Image();
      image.src = src;
      return image.decode().then(
        () => image,
        () => null,
      );
    };
    const pixels = (image: HTMLImageElement | null) => {
      if (!image) return null;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    const bytes = (src: string) =>
      fetch(src)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(src))))
        .then(
          (buffer) => new Uint8Array(buffer),
          () => null,
        );
    const fonts = document.fonts ? document.fonts.load('800 100px Kanit').catch(() => {}) : Promise.resolve();
    Promise.all([load(PORTRAIT.image), load(LIGHTS), bytes(HEART), bytes(IDEA), bytes(BRAIN), fonts]).then(
      ([photo, lights, heart, idea, brain]) => alive && setMedia({ photo, lights: pixels(lights), heart, idea, brain }),
    );
    return () => {
      alive = false;
    };
  }, []);

  const worldHeight = worldTall() * 0.92;
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1;
  // The portrait is sampled as the About stage frames it (in steps, so small resizes keep the layout).
  const stage = bridge.current?.stage?.getBoundingClientRect();
  const stageAspect = stage && stage.height > 0 ? Math.round((stage.width / stage.height) * 20) / 20 : portrait ? 0.8 : 0.6;
  // Laid out once per orientation. On phones the shapes sit higher, above the phrase, and narrower.
  const layout = useMemo(() => {
    if (!media) return null;
    const fit = Math.min(1, aspect * 1.1);
    const lift = worldHeight * (portrait ? 0.17 : 0.12);
    const s = worldHeight * fit;
    const w = s * (portrait ? 0.44 : 0.32);
    const eye = { x: 0, y: lift + worldHeight * (portrait ? 0.02 : 0.06), w, h: w * 0.42 };
    const up = lift + s * 0.035; // the Earth a little higher, its rim clear of its phrases' three lines
    const globe = earth(s * 0.3, up);
    // the laptop and its chip a little higher, clear of the phrase; on phones, where the phrase is far below,
    // larger instead, so the brain on the chip reads
    const chipLift = lift + (portrait ? 0 : s * 0.07);
    const chipSize = s * (portrait ? 1 : 0.72);
    const laptop = laptopShape(s * (portrait ? 0.66 : 0.5), chipLift);
    const [chipBrain, chipAI] = chipShapes(chipSize, chipLift);
    return {
      eye,
      earth: [0, up, 0, s * 0.3],
      heart: [0, lift, 0, s * 0.62],
      bulb: bulbOf(media.idea, s * 0.7, lift),
      brain: [0, lift, 0, s * 0.66],
      chip: [0, chipLift, 0, chipSize / 2], // half the board
      dive: [...laptop.chip, 10], // where the chip sits in the laptop, and how many times nearer the camera gets
      shapes: [
        iris(worldHeight),
        globe,
        earthLights(globe, media.lights, s * 0.3, up),
        heartShape(media.heart, s * 0.62, lift),
        ideaShape(media.idea, s * 0.7, lift),
        brainShape(media.brain, s * 0.66, lift),
        laptop.points,
        chipBrain,
        chipAI,
        eyeShape(eye),
        portraitShape(media.photo, coverCrop(stageAspect, PORTRAIT.aspect, PORTRAIT.focus)),
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, portrait, stageAspect]);
  useEffect(() => {
    if (!layout) return;
    uniforms.uEye.value.set(layout.eye.x, layout.eye.y, layout.eye.w, layout.eye.h);
    uniforms.uEarth.value.fromArray(layout.earth);
    uniforms.uHeart.value.fromArray(layout.heart);
    uniforms.uBulb.value.fromArray(layout.bulb);
    uniforms.uBrain.value.fromArray(layout.brain);
    uniforms.uChip.value.fromArray(layout.chip);
    uniforms.uDive.value.fromArray(layout.dive);
    onReady();
  }, [layout, uniforms, onReady]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute('aFrom', new THREE.BufferAttribute(new Float32Array(COUNT * S), S));
    geo.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(COUNT * S), S));
    const rand = new Float32Array(COUNT * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Swap the pair of shapes the particles travel between when the scroll crosses into another one.
  const pair = useRef(-1);
  useEffect(() => {
    pair.current = -1; // re-upload after a re-layout
  }, [layout]);
  useFrame(() => {
    const m = morph.current;
    if (!layout || !m) return;
    const { shapes } = layout;
    const j = Math.min(shapes.length - 2, m.pair);
    uniforms.uSpinFrom.value = turn(j, uniforms.uTime.value);
    uniforms.uSpinTo.value = turn(j + 1, uniforms.uTime.value);
    if (j === pair.current) return;
    pair.current = j;
    const from = geometry.getAttribute('aFrom') as THREE.BufferAttribute;
    const to = geometry.getAttribute('aTo') as THREE.BufferAttribute;
    (from.array as Float32Array).set(shapes[j]);
    (to.array as Float32Array).set(shapes[j + 1]);
    from.needsUpdate = true;
    to.needsUpdate = true;
  });

  const vertexShader = /* glsl */ `
    uniform float uTime, uMorph, uFade, uPixel, uSpeed, uIrisOn, uIrisScale, uSpinFrom, uSpinTo;
    uniform float uBlink, uAboutOn, uPlaneZ, uAboutDot, uIrisOuter, uGather, uTwist, uDiveOn;
    uniform vec2 uIrisCenter, uGaze;
    uniform vec4 uEye, uEarth, uCrop, uHeart, uBulb, uBrain, uChip, uDive;
    uniform mat4 uAbout, uUnproject;
    attribute vec4 aFrom;
    attribute vec4 aTo;
    attribute vec4 aRand;
    varying vec3 vColor;
    varying float vAlpha;
    ${NOISE_GLSL}
    vec3 spin(vec3 p, float a) {
      float c = cos(a);
      float s = sin(a);
      return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    }
    vec3 pitch(vec3 p, float a) {
      float c = cos(a);
      float s = sin(a);
      return vec3(p.x, c * p.y + s * p.z, -s * p.y + c * p.z);
    }
    float part(float w, float value) {
      return 1.0 - step(0.5, abs(w - value));
    }
    vec2 turn(vec2 p, float a) {
      float c = cos(a);
      float s = sin(a);
      return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    }
    // height of the eye's upper lid above its centre line: parabolic, closed at the corners
    float lid(float x) {
      float u = clamp((x - uEye.x) / uEye.z, -1.0, 1.0);
      return uEye.w * (1.0 - u * u);
    }
    // The eye's moving parts: the iris and its glint look where the gaze goes and slip behind the lids
    // (seen drops to 0), the upper lid comes down to blink.
    vec3 eye(vec4 a, inout float seen) {
      vec3 p = a.xyz;
      if (part(a.w, ${PART.iris}.0) + part(a.w, ${PART.glint}.0) > 0.5) {
        p.xy += uGaze;
        float y = p.y - uEye.y;
        float low = -${LOWER_LID} * lid(p.x);
        float top = mix(lid(p.x), low, uBlink);
        float soft = uEye.w * 0.05;
        seen = smoothstep(-soft, soft, top - y) * smoothstep(-soft, soft, y - low);
      } else if (part(a.w, ${PART.lid}.0) > 0.5) {
        p.y = mix(p.y, uEye.y - ${LOWER_LID} * lid(p.x), uBlink);
      }
      return p;
    }
    // the heart's beat: two knocks, a little over once a second
    float heartbeat() {
      float t = fract(uTime * 1.1);
      return exp(-pow((t - 0.1) / 0.045, 2.0)) + 0.6 * exp(-pow((t - 0.3) / 0.055, 2.0));
    }
    // the texture's brightness a baked model's point carries in its part's fraction
    float shadeOf(vec4 a) {
      return clamp((a.w - floor(a.w + 0.5)) / 0.4, 0.0, 1.0);
    }
    // where a spark is on its run, 0 → 1, over and over
    float run(float speed, float offset) {
      return fract(uTime * speed + offset);
    }
    // The living shapes: the heart beats, the brain's signals flit along short paths, the chip's sparks run
    // in along their traces (a run's length is in the part's fraction).
    vec3 alive(vec4 a, vec3 p) {
      if (part(a.w, ${PART.heart}.0) > 0.5) return uHeart.xyz + (p - uHeart.xyz) * (1.0 + 0.06 * heartbeat());
      if (part(a.w, ${PART.signal}.0) > 0.5) {
        vec3 dir = normalize(vec3(aRand.y, aRand.w, aRand.x) - 0.5 + 0.001);
        return p + dir * (run(0.4 + 0.5 * aRand.z, aRand.w * 5.0) - 0.5) * uBrain.w * 0.16;
      }
      float u = part(a.w, ${PART.sparkU}.0);
      if (u + part(a.w, ${PART.sparkV}.0) > 0.5) {
        vec3 axis = u > 0.5 ? ${vec3(onBoard(1, 0, 0, CHIP_TILT, 1))} : ${vec3(onBoard(0, 1, 0, CHIP_TILT, 1))};
        float reach = (a.w - floor(a.w + 0.5)) / 0.45 * uChip.w;
        return p - axis * sign(dot(p - uChip.xyz, axis)) * run(0.22 + 0.3 * aRand.w, aRand.z * 3.0) * reach;
      }
      return p;
    }
    // The dive into the laptop, as d runs 0 → 1: the scene grows uDive.w times about the chip's place under its
    // keys, which moves to the chip's own place, while the view pitches down to the chip's tilt; a camera flying
    // in. The chip's points (chip = 1) start in there, that many times smaller.
    vec3 dive(vec3 p, float d, float chip) {
      vec3 centre = mix(uDive.xyz, uChip.xyz, smoothstep(0.0, 0.75, d));
      float lean = ${(CHIP_TILT - LAPTOP_TILT).toFixed(4)} * (smoothstep(0.05, 0.9, d) - chip);
      return centre + pitch(p - mix(uDive.xyz, uChip.xyz, chip), lean) * pow(uDive.w, d - chip);
    }
    // a code token's colour, by the tone in its part's fraction: plain, keyword, call, comment
    vec3 syntax(vec4 a) {
      float tone = floor((a.w - floor(a.w + 0.5)) * 10.0 + 0.5);
      return tone < 0.5 ? vec3(0.86, 0.9, 1.0) : tone < 1.5 ? vec3(0.68, 0.5, 1.0) : tone < 2.5 ? vec3(0.4, 0.92, 1.0) : vec3(0.42, 0.5, 0.72);
    }
    // A point of the portrait: where the About stage shows it, on this camera's formation plane.
    vec3 about(vec3 p) {
      vec4 clip = uAbout * vec4(p, 1.0);
      vec4 world = uUnproject * vec4(clip.xy / clip.w, uPlaneZ, 1.0);
      return world.xyz / world.w;
    }
    void main() {
      float m = smoothstep(aRand.x * 0.4, 0.6 + aRand.x * 0.4, uMorph); // particle by particle
      // Diving into the laptop, every point is the laptop's until it leaves the view (off the screen or past
      // the lens) or, nearer the chip, dissolves on the way in; then it is the chip's, fading in.
      vec3 dived = vec3(0.0);
      float diving = 1.0;
      float grown = 1.0; // how big the chip is yet
      if (uDiveOn > 0.5) {
        vec3 l = spin(dive(aFrom.xyz, uMorph, 0.0), uSpinTo);
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(l, 1.0);
        float edge = max(abs(clip.x), abs(clip.y)) / max(clip.w, 0.01);
        float gone = max(max(smoothstep(1.0, 1.6, edge), 1.0 - smoothstep(2.0, 6.0, clip.w)), smoothstep(0.42, 0.55, uMorph - aRand.w * 0.3));
        m = step(0.5, gone);
        diving = abs(2.0 * gone - 1.0);
        grown = pow(uDive.w, uMorph - 1.0);
        dived = m > 0.5 ? spin(dive(alive(aTo, aTo.xyz), uMorph, 1.0), uSpinTo) : l;
      }
      float flight = sin(3.14159265 * m);
      float e = m * m * (3.0 - 2.0 * m);
      float seenFrom = 1.0;
      float seenTo = 1.0;
      vec3 from = alive(aFrom, eye(aFrom, seenFrom));
      float rr = 1.0; // radius in the galaxy, 0 at its core
      vec2 local = vec2(0.0); // place in the galaxy, in iris radii (for its clumps and lanes)
      float halo = 0.0;
      if (uIrisOn > 0.5) {
        // The iris gathers out of a wider, fainter swirl as the camera nears the pupil. As the camera flies
        // in it becomes a galaxy: the pupil closes into a dense core and the fibres wind into arms, the
        // inner ones turning further than the outer ones. Noise bends the arms unevenly and scatters the
        // stars off the fibres, so it looks grown rather than drawn.
        float r = length(from.xy) / uIrisOuter;
        float th = atan(from.y, from.x);
        float core = pow(clamp((r - ${IRIS_INNER / 0.36}) / ${1 - IRIS_INNER / 0.36}, 0.0, 1.0), 1.6);
        rr = mix(r, core, uTwist);
        float loose = 1.0 - uGather;
        float bend = snoise(vec3(rr * 2.6, cos(th) * 1.3, sin(th) * 1.3 + 4.0));
        // the core, the attractor, turns faster than the arms and draws the stars round it into a whirl
        float whirl = uTwist * uTime * 1.2 * (1.0 - smoothstep(0.05, 0.35, rr));
        float angle = loose * (1.2 + aRand.z * 1.5) + uTwist * (1.2 + 2.0 / (rr + 0.25) + uTime * 0.35 + 0.5 * bend + (aRand.y - 0.5) * 0.4) + whirl;
        float radius = rr * (1.0 + uTwist * ((aRand.z - 0.5) * 0.18 + 0.08 * bend));
        from.xy = turn(normalize(from.xy) * radius * uIrisOuter * (1.0 + loose * (0.6 + aRand.y)), angle);
        // a sparse halo of stars round the disc
        halo = step(0.93, fract(aRand.w * 57.3 + aRand.z * 11.9)) * uTwist;
        from.xy = mix(from.xy, turn(vec2(0.2 + 0.95 * aRand.y, 0.0), aRand.z * 6.2831853 + uTime * 0.08) * uIrisOuter, halo);
        from.z += (aRand.x - 0.5) * uIrisOuter * (0.08 * uTwist + 0.5 * halo); // a little thickness
        local = from.xy / uIrisOuter;
      }
      from = spin(from, uSpinFrom);
      from.xy = mix(from.xy, uIrisCenter + from.xy * uIrisScale, uIrisOn); // the iris sits on the real pupil
      vec3 to = uAboutOn > 0.5 ? about(aTo.xyz) : spin(alive(aTo, eye(aTo, seenTo)), uSpinTo);
      float landed = e * uAboutOn; // settled on the portrait: steady, fine dots
      vec3 p = mix(from, to, e);
      if (uDiveOn > 0.5) p = dived;
      // out of the spiral the particles keep circling on their way into the planet
      vec2 hub = mix(uIrisCenter, uEarth.xy, e);
      p.xy = mix(p.xy, hub + turn(p.xy - hub, e * (1.0 - e) * 3.0), uIrisOn);
      // particles with nowhere to go (the Earth, as its lights come on) stay put instead of swirling
      float travel = smoothstep(0.0, 0.03 * uEarth.w, distance(aFrom.xyz, aTo.xyz));
      // the chip's brain turns into the letters on the chip itself, swirling only a little
      float swirl = travel * (1.0 - 0.75 * part(aFrom.w, ${PART.neon}.0) * part(aTo.w, ${PART.neon}.0));
      vec3 q = p * 0.16 + vec3(0.0, 0.0, uTime * 0.15);
      vec3 curl = vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0));
      p += curl * flight * swirl * (1.6 + aRand.y * 1.8) * (1.0 - 0.6 * uIrisOn);
      p.z += flight * swirl * (1.0 + aRand.y * 5.0); // swirl out towards the lens
      // settled: a fine crackle along the outlines
      p.xy += vec2(snoise(vec3(aRand.zw * 60.0, uTime * 2.3)), snoise(vec3(aRand.wz * 60.0, uTime * 2.3 + 7.0))) * 0.018 * (1.0 - flight) * (1.0 - landed);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      // on the portrait: halftone dots; those the stage crops off fade out as they land, and like the stage
      // they fade towards its sides and its bottom
      vec2 framed = (aTo.xy - uCrop.xy) / uCrop.zw;
      float inside = step(0.0, framed.x) * step(framed.x, 1.0) * step(0.0, framed.y) * step(framed.y, 1.0);
      inside *= clamp(framed.x / ${PORTRAIT.feather.side.toFixed(3)}, 0.0, 1.0) * clamp((1.0 - framed.x) / ${PORTRAIT.feather.side.toFixed(3)}, 0.0, 1.0);
      inside *= clamp(framed.y / ${(1 - PORTRAIT.feather.bottom).toFixed(3)}, 0.0, 1.0);
      gl_PointSize = mix((0.9 + aRand.z * 1.3) * 34.0 / max(-mv.z, 1.0), uAboutDot * (0.85 + aRand.z * 0.3), landed) * uPixel;
      float flicker = 0.55 + 0.45 * smoothstep(-0.3, 0.8, snoise(vec3(aRand.xy * 30.0, uTime * 3.0)));
      float sweep = exp(-pow(p.x * 0.18 - mod(uTime * 0.45, 8.0) + 4.0, 2.0) * 5.0) * (1.0 - landed); // a pulse running across
      // the eye's white is a faint dust
      float white = mix(part(aFrom.w, ${PART.white}.0), part(aTo.w, ${PART.white}.0), e);
      float shine = mix(1.0, inside, landed) * (1.0 - 0.55 * white);
      float gw = uTwist * (1.0 - e) * uIrisOn; // how much of a galaxy this particle shows
      float glowCore = 1.0 - smoothstep(0.0, 0.3, rr);
      float light = 1.0;
      if (gw > 0.001) {
        // three arms (sectors of the iris wound up), uneven: wandering edges, one fainter than the others,
        // clumps of stars and dark lanes of dust along them
        float th0 = atan(aFrom.y, aFrom.x);
        float wander = snoise(vec3(cos(th0) * 1.7, sin(th0) * 1.7, rr * 3.0 + 9.0));
        float arms = pow(0.5 + 0.5 * cos(3.0 * th0 + 1.4 * wander), 2.2) * (0.72 + 0.28 * cos(th0 + 1.0));
        float clumps = smoothstep(-0.2, 0.9, snoise(vec3(local * 4.5, 17.0)));
        float lanes = smoothstep(0.3, 0.75, snoise(vec3(local * 7.0, 29.0)));
        light = (0.1 + 1.8 * arms) * (0.55 + 0.9 * clumps) * (1.0 - 0.6 * lanes * (1.0 - glowCore)) * (1.0 + 2.0 * glowCore);
        light = mix(light, 0.35, halo);
      }
      vAlpha = uFade * mix(1.0, light, gw) * mix(flicker, 0.95, max(landed, gw)) * (0.5 + 0.5 * aRand.w) * (1.0 + sweep * 1.8) * (1.0 - 0.35 * flight * travel) * mix(seenFrom, seenTo, e) * shine;
      float hue = 0.5 + 0.5 * sin(p.x * 0.25 + p.y * 0.18 + uTime * 0.6 + aRand.y * 2.0);
      vec3 blue = vec3(0.12, 0.38, 1.0);
      vec3 cyan = vec3(0.45, 0.95, 1.0);
      vec3 violet = vec3(0.62, 0.42, 1.0);
      vColor = mix(mix(blue, cyan, hue), violet, smoothstep(0.7, 1.0, aRand.y) * 0.8);
      // the iris: bright cyan round the pupil, deep blue at its edge; the catch light white
      float irisPart = mix(part(aFrom.w, ${PART.iris}.0), part(aTo.w, ${PART.iris}.0), e) * (1.0 - flight);
      float r = length(p.xy - uEye.xy - uGaze) / (uEye.w * ${IRIS_SIZE});
      vColor = mix(vColor, mix(vec3(0.55, 0.97, 1.0), vec3(0.25, 0.35, 1.0), smoothstep(0.35, 1.0, r)), irisPart * 0.7);
      float glint = mix(part(aFrom.w, ${PART.glint}.0), part(aTo.w, ${PART.glint}.0), e);
      vColor = mix(vColor, vec3(1.0), min(1.0, sweep * 0.6 + (1.0 - flight) * 0.15 + glint * 0.8));
      vColor = mix(vColor, vec3(1.0, 0.9, 0.76), glowCore * gw * 0.75); // the core glows warm
      // the Earth: green-teal continents with bright coasts, deep blue oceans, a pale rim of air; its far
      // side fades, so the continents behind don't show through the ones in front
      float settled = 1.0 - flight * travel; // points that stay put keep their colours
      float land = mix(part(aFrom.w, ${PART.land}.0), part(aTo.w, ${PART.land}.0), e) * settled;
      float coast = mix(part(aFrom.w, ${PART.coast}.0), part(aTo.w, ${PART.coast}.0), e) * settled;
      float ocean = mix(part(aFrom.w, ${PART.ocean}.0), part(aTo.w, ${PART.ocean}.0), e) * settled;
      float air = mix(part(aFrom.w, ${PART.air}.0), part(aTo.w, ${PART.air}.0), e) * settled;
      float facing = dot(normalize(p - uEarth.xyz), normalize(cameraPosition - uEarth.xyz));
      vAlpha *= mix(1.0, smoothstep(-0.2, 0.3, facing), land + coast + ocean);
      vAlpha *= mix(1.0, 0.35 + smoothstep(0.55, 0.0, abs(facing)), air) * (1.0 - 0.45 * ocean - 0.4 * air);
      vColor = mix(vColor, vec3(0.3, 0.95, 0.62), land * 0.85);
      vColor = mix(vColor, vec3(0.78, 1.0, 0.9), coast * 0.85);
      vColor = mix(vColor, vec3(0.08, 0.32, 1.0), ocean * 0.9);
      vColor = mix(vColor, vec3(0.55, 0.8, 1.0), air);
      // at night (once the lights are on) the land and the sea dim to a deep blue
      float night = mix(step(${NIGHT - 0.05}, aFrom.w - floor(aFrom.w + 0.5)), step(${NIGHT - 0.05}, aTo.w - floor(aTo.w + 0.5)), e) * (land + coast + ocean + air);
      vAlpha *= mix(1.0, 0.42, night);
      vColor = mix(vColor, vColor * vec3(0.3, 0.45, 0.95), night * 0.7);
      // the Earth's lights: red, pulsing each to its own beat; its far side fades like the land's
      float city = mix(part(aFrom.w, ${PART.city}.0), part(aTo.w, ${PART.city}.0), e) * settled;
      float pulse = 0.5 + 0.5 * sin(uTime * (1.6 + aRand.y * 1.2) + aRand.x * 6.2831853);
      vAlpha *= mix(1.0, smoothstep(-0.2, 0.3, facing) * (0.8 + 1.1 * pulse), city);
      gl_PointSize *= mix(1.0, 1.3 + 1.1 * pulse, city);
      vColor = mix(vColor, vec3(1.0, 0.14, 0.2), city);
      // the models' shading: their texture's brightness where each point sits
      float shade = mix(shadeOf(aFrom), shadeOf(aTo), e);
      // the heart: deep red muscle, pale fat, brighter on the beat; its far side dim, so it reads solid
      float heart = mix(part(aFrom.w, ${PART.heart}.0), part(aTo.w, ${PART.heart}.0), e) * settled;
      float heartFacing = dot(normalize(p - uHeart.xyz), normalize(cameraPosition - uHeart.xyz));
      vAlpha *= mix(1.0, (0.75 + 0.6 * heartbeat()) * (0.35 + 0.65 * smoothstep(-0.4, 0.4, heartFacing)) * (0.6 + 0.8 * shade), heart);
      vColor = mix(vColor, mix(vec3(0.95, 0.07, 0.14), vec3(1.0, 0.6, 0.62), smoothstep(0.35, 0.75, shade)), heart);
      // the idea: violet hands, pale nails, the bulb's glass bright at its rim like glass, a dark metal base and
      // the bolt inside glowing gold, pulsing
      float hand = mix(part(aFrom.w, ${PART.hand}.0), part(aTo.w, ${PART.hand}.0), e) * settled;
      float nail = mix(part(aFrom.w, ${PART.nail}.0), part(aTo.w, ${PART.nail}.0), e) * settled;
      float glass = mix(part(aFrom.w, ${PART.glass}.0), part(aTo.w, ${PART.glass}.0), e) * settled;
      float base = mix(part(aFrom.w, ${PART.base}.0), part(aTo.w, ${PART.base}.0), e) * settled;
      float bolt = mix(part(aFrom.w, ${PART.bolt}.0), part(aTo.w, ${PART.bolt}.0), e) * settled;
      float rim = 1.0 - abs(dot(normalize(p - uBulb.xyz), normalize(cameraPosition - uBulb.xyz)));
      float glow = 0.75 + 0.35 * sin(uTime * 2.2);
      vColor = mix(vColor, vec3(0.56, 0.4, 1.0), hand * 0.85);
      vColor = mix(vColor, vec3(0.92, 0.95, 1.0), nail);
      vColor = mix(vColor, vec3(0.72, 0.9, 1.0), glass);
      vColor = mix(vColor, vec3(0.4, 0.43, 0.56), base);
      vAlpha *= mix(1.0, 0.4, base); // dark metal, not a light
      vColor = mix(vColor, vec3(1.0, 0.72, 0.3), bolt);
      vAlpha *= mix(1.0, 0.2 + 1.1 * rim * rim, glass);
      vAlpha *= mix(1.0, 1.05 * glow, bolt);
      gl_PointSize *= mix(1.0, 1.2, bolt);
      // the brain: cool white folds, its far side dim so the near folds read; its signals faint red sparks,
      // fading in and out along their paths
      float cortex = mix(part(aFrom.w, ${PART.cortex}.0), part(aTo.w, ${PART.cortex}.0), e) * settled;
      float signal = mix(part(aFrom.w, ${PART.signal}.0), part(aTo.w, ${PART.signal}.0), e) * settled;
      float brainFacing = dot(normalize(p - uBrain.xyz), normalize(cameraPosition - uBrain.xyz));
      vAlpha *= mix(1.0, (0.08 + 0.92 * smoothstep(-0.1, 0.5, brainFacing)) * (0.55 + 0.7 * shade), cortex);
      gl_PointSize *= mix(1.0, 0.85, cortex); // finer dots, so the folds read
      vColor = mix(vColor, vec3(0.7, 0.8, 1.0), cortex * 0.75);
      vColor = mix(vColor, vec3(1.0, 0.28, 0.34), signal);
      vAlpha *= mix(1.0, 0.8 * sin(3.14159265 * run(0.4 + 0.5 * aRand.z, aRand.w * 5.0)), signal);
      // the laptop: a steel shell and keys, the screen's glow, code in its colours and a red caret, blinking
      float shell = mix(part(aFrom.w, ${PART.shell}.0), part(aTo.w, ${PART.shell}.0), e) * settled;
      float key = mix(part(aFrom.w, ${PART.key}.0), part(aTo.w, ${PART.key}.0), e) * settled;
      float screen = mix(part(aFrom.w, ${PART.screen}.0), part(aTo.w, ${PART.screen}.0), e) * settled;
      float code = mix(part(aFrom.w, ${PART.code}.0), part(aTo.w, ${PART.code}.0), e) * settled;
      float caret = mix(part(aFrom.w, ${PART.caret}.0), part(aTo.w, ${PART.caret}.0), e) * settled;
      vColor = mix(vColor, vec3(0.78, 0.86, 1.0), shell);
      vColor = mix(vColor, vec3(0.45, 0.6, 1.0), key);
      vAlpha *= mix(1.0, 0.55, key);
      vColor = mix(vColor, vec3(0.2, 0.36, 1.0), screen);
      vAlpha *= mix(1.0, 0.15 + 0.85 * shade, screen);
      vColor = mix(vColor, mix(syntax(aFrom), syntax(aTo), e), code);
      vColor = mix(vColor, vec3(1.0, 0.24, 0.32), caret);
      vAlpha *= mix(1.0, 0.2 + 1.3 * step(0.5, fract(uTime * 1.1)), caret);
      // the chip: the board's cyan traces fading into the dark, magenta ones on the substrate, steel pins and
      // die, white pads, the brain (then AI) in cyan neon, and the sparks red, running in
      float board = mix(part(aFrom.w, ${PART.board}.0), part(aTo.w, ${PART.board}.0), e) * settled;
      float trace = mix(part(aFrom.w, ${PART.trace}.0), part(aTo.w, ${PART.trace}.0), e) * settled;
      float metal = mix(part(aFrom.w, ${PART.metal}.0), part(aTo.w, ${PART.metal}.0), e) * settled;
      float pad = mix(part(aFrom.w, ${PART.pad}.0), part(aTo.w, ${PART.pad}.0), e) * settled;
      float neon = mix(part(aFrom.w, ${PART.neon}.0), part(aTo.w, ${PART.neon}.0), e);
      float spark = mix(part(aFrom.w, ${PART.sparkU}.0) + part(aFrom.w, ${PART.sparkV}.0), part(aTo.w, ${PART.sparkU}.0) + part(aTo.w, ${PART.sparkV}.0), e) * settled;
      vColor = mix(vColor, vec3(0.22, 0.88, 0.95), board);
      vAlpha *= mix(1.0, 0.1 + 0.8 * shade, board);
      vColor = mix(vColor, vec3(1.0, 0.32, 0.86), trace);
      vAlpha *= mix(1.0, 0.3 + 0.9 * shade, trace);
      vColor = mix(vColor, vec3(0.8, 0.85, 0.96), metal);
      vAlpha *= mix(1.0, 0.2 + 0.8 * shade, metal);
      vColor = mix(vColor, vec3(1.0), pad);
      vColor = mix(vColor, vec3(0.42, 0.96, 1.0), neon);
      vAlpha *= mix(1.0, 1.3, neon);
      float sp = run(0.22 + 0.3 * aRand.w, aRand.z * 3.0);
      vColor = mix(vColor, vec3(1.0, 0.26, 0.42), spark);
      vAlpha *= mix(1.0, 1.6 * smoothstep(0.0, 0.1, sp) * (1.0 - smoothstep(0.8, 1.0, sp)), spark);
      gl_PointSize *= mix(1.0, 1.3, spark);
      // diving: the laptop's points fade out, the chip's in, fine and faint while it is far
      vAlpha *= diving * mix(1.0, pow(grown, 0.6), m * uDiveOn);
      gl_PointSize *= mix(1.0, max(0.4, sqrt(grown)), m * uDiveOn);
      // the portrait's colour: the photo's pale white in a cool light
      vColor = mix(vColor, vec3(0.86, 0.9, 0.97), landed * 0.9);
    }
  `;
  const material = useSprites(vertexShader, uniforms);
  if (!layout) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

// ——— the phrases, written in particles ———

// Samples every phrase as particles, laid out like centred type above the bottom of the screen: plain
// words in Kanit SemiBold, highlights in ExtraBold. Returns the geometry (home positions in clip space,
// phrase, style, reading order) and the particle size in pixels.
function writeWords(width: number, height: number) {
  const narrow = width < 768;
  const fontSize = Math.min(70.4, Math.max(30.4, width * 0.052));
  const lead = fontSize * 1.08;
  const measure = Math.min(width - 48, fontSize * 10.8);
  const bottom = height * (narrow ? 0.91 : 0.89);
  const step = narrow ? 1.5 : 2.1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const font = (mark: Run['mark']) => `${mark === 'hi' ? 800 : 600} ${fontSize}px Kanit, sans-serif`;
  const ink = { plain: '#f00', hi: '#0f0', off: '#00f' }; // one channel per style, read back below
  const home: number[] = [];
  const info: number[] = [];
  PHRASES.forEach((phrase, k) => {
    // words as runs: a highlight can end mid-word, before its punctuation
    const words: Run[][] = [[]];
    for (const run of phraseRuns(phrase)) {
      for (const piece of run.text.split(/( )/)) {
        if (piece === ' ') words.push([]);
        else if (piece) words[words.length - 1].push({ text: piece, mark: run.mark });
      }
    }
    ctx.font = font('plain');
    const space = ctx.measureText(' ').width;
    const sized = words
      .filter((word) => word.length)
      .map((runs) => ({
        runs,
        width: runs.reduce((sum, run) => {
          ctx.font = font(run.mark);
          return sum + ctx.measureText(run.text).width;
        }, 0),
      }));
    const wrap = (limit: number) => {
      const lines: { words: typeof sized; width: number }[] = [];
      for (const word of sized) {
        const line = lines[lines.length - 1];
        if (line && line.width + space + word.width <= limit) {
          line.words.push(word);
          line.width += space + word.width;
        } else lines.push({ words: [word], width: word.width });
      }
      return lines;
    };
    // balanced, like CSS text-wrap: balance: the narrowest measure that still takes as few lines, so no word
    // is left alone on the last one
    const count = wrap(measure).length;
    let [lo, hi] = [0, measure];
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (wrap(mid).length > count) lo = mid;
      else hi = mid;
    }
    const lines = wrap(hi);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const top = bottom - lines.length * lead;
    lines.forEach((line, i) => {
      let x = (width - line.width) / 2;
      const baseline = top + i * lead + fontSize * 0.8;
      for (const word of line.words) {
        for (const run of word.runs) {
          ctx.font = font(run.mark);
          ctx.fillStyle = ink[run.mark];
          ctx.fillText(run.text, x, baseline);
          const runWidth = ctx.measureText(run.text).width;
          if (run.mark === 'off') {
            ctx.fillStyle = '#ff0'; // the strike, over its word
            ctx.fillRect(x - fontSize * 0.06, baseline - fontSize * 0.3, runWidth + fontSize * 0.12, Math.max(2, fontSize * 0.075));
          }
          x += runWidth;
        }
        x += space;
      }
    });
    const y0 = Math.max(0, Math.floor(top - fontSize * 0.2));
    const y1 = Math.min(canvas.height, Math.ceil(bottom + fontSize * 0.35));
    const data = ctx.getImageData(0, y0, canvas.width, y1 - y0).data;
    for (let y = y0; y < y1; y += step) {
      for (let x = 0; x < width; x += step) {
        const sx = x + Math.random() * step;
        const sy = y + Math.random() * step;
        if (sx >= canvas.width || sy >= y1) continue;
        const i = ((Math.floor(sy) - y0) * canvas.width + Math.floor(sx)) * 4;
        if (data[i + 3] < 128) continue;
        const style = data[i] > 127 && data[i + 1] > 127 ? 3 : data[i + 1] > 127 ? 1 : data[i + 2] > 127 ? 2 : 0;
        const row = Math.min(lines.length - 1, Math.max(0, Math.floor((sy - top) / lead)));
        const left = (width - lines[row].width) / 2;
        home.push((sx / width) * 2 - 1, 1 - (sy / height) * 2, 0);
        info.push(k, style, (row + Math.min(1, Math.max(0, (sx - left) / lines[row].width))) / lines.length);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(home, 3));
  geometry.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  const seed = new Float32Array((home.length / 3) * 4);
  for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  return { geometry, dot: step * 1.45 };
}

// Written straight in clip space, so the type stays put while the camera leans and kicks.
const WORDS_VERTEX = /* glsl */ `
  uniform float uTime, uPixel, uDot, uLoose;
  uniform float uShow[${PHRASES.length}];
  uniform vec2 uView;
  attribute vec3 aInfo; // phrase, style (0 plain, 1 highlight, 2 struck word, 3 its strike), reading order
  attribute vec4 aSeed;
  varying vec3 vColor;
  varying float vAlpha;
  ${NOISE_GLSL}
  void main() {
    float show = uShow[int(aInfo.x + 0.5)];
    float hi = 1.0 - step(0.5, abs(aInfo.y - 1.0));
    float dim = 1.0 - step(0.5, abs(aInfo.y - 2.0));
    float strike = 1.0 - step(0.5, abs(aInfo.y - 3.0));
    // the words land in reading order, highlights last and the strike after its word (all by show = 1)
    float start = aInfo.z * 0.36 + aSeed.x * 0.1 + hi * 0.14 + strike * 0.2;
    float m = smoothstep(start, start + 0.3, show);
    float e = m * m * (3.0 - 2.0 * m);
    vec2 home = position.xy * 0.5 * uView; // pixels from the centre
    float a = aSeed.y * 6.2831853;
    vec2 loose = home + (vec2(cos(a), sin(a)) * (30.0 + aSeed.z * 170.0) - vec2(0.0, 40.0 + aSeed.w * 110.0)) * uLoose;
    vec3 q = vec3(home * 0.004, uTime * 0.3 + aSeed.x * 4.0);
    loose += vec2(snoise(q), snoise(q + 13.0)) * 80.0 * uLoose;
    vec2 p = mix(loose, home, e);
    p += vec2(snoise(vec3(aSeed.zw * 40.0, uTime * 1.3)), snoise(vec3(aSeed.wz * 40.0, uTime * 1.3 + 4.0))) * 0.35; // shimmer
    gl_Position = vec4(p / (0.5 * uView), 0.0, 1.0);
    gl_PointSize = uDot * uPixel * (0.85 + aSeed.w * 0.4) * (1.0 + hi * 0.2) * mix(2.2, 1.0, e);
    // plain words cool white; highlights run cyan → violet → pink across the screen, a glint passing
    float x = home.x / uView.x + 0.5;
    vec3 accent = mix(mix(vec3(0.3, 0.88, 1.0), vec3(0.6, 0.45, 1.0), smoothstep(0.15, 0.55, x)), vec3(1.0, 0.4, 0.78), smoothstep(0.55, 0.9, x));
    float glint = exp(-pow(x * 3.0 - mod(uTime * 0.55, 4.5) + 0.8, 2.0) * 9.0);
    vColor = mix(vec3(0.9, 0.94, 1.0), accent, hi);
    vColor = mix(vColor, vec3(0.62, 0.68, 0.82), dim);
    vColor = mix(vColor, vec3(1.0, 0.36, 0.72), strike); // crossed out in pink
    vColor += vec3(0.7) * glint * hi;
    float flicker = 0.85 + 0.15 * snoise(vec3(aSeed.xy * 20.0, uTime * 2.0));
    vAlpha = smoothstep(0.0, 0.5, m) * flicker * mix(1.0, 0.7, dim);
  }
`;

function Words({ uniforms, show, onReady }: { uniforms: Uniforms; show: number[]; onReady: () => void }) {
  const size = useThree((state) => state.size);
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([document.fonts?.load('600 64px Kanit'), document.fonts?.load('800 64px Kanit')]).finally(() => alive && setFonts(true));
    return () => {
      alive = false;
    };
  }, []);
  const words = useMemo(() => (fonts ? writeWords(size.width, size.height) : null), [fonts, size.width, size.height]);
  useEffect(() => () => words?.geometry.dispose(), [words]);
  const own = useMemo(
    () => ({
      uTime: uniforms.uTime,
      uPixel: uniforms.uPixel,
      uShow: { value: show },
      uView: { value: new THREE.Vector2(1, 1) },
      uDot: { value: 2 },
      uLoose: { value: still ? 0.15 : 1 },
    }),
    [uniforms, show],
  );
  useEffect(() => {
    if (!words) return;
    own.uView.value.set(size.width, size.height);
    own.uDot.value = words.dot;
    onReady();
  }, [words, own, size.width, size.height, onReady]);
  const material = useSprites(WORDS_VERTEX, own);
  if (!words) return null;
  return <points geometry={words.geometry} material={material} frustumCulled={false} renderOrder={1} />;
}

// ——— dust streaming past: the flight ———
function Dust({ uniforms }: { uniforms: Uniforms }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
    const seed = new Float32Array(DUST * 4);
    for (let i = 0; i < DUST; i++) seed.set([(Math.random() - 0.5) * 70, (Math.random() - 0.5) * 40, Math.random() * 120, Math.random()], i * 4);
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const vertexShader = /* glsl */ `
    uniform float uTime, uFade, uPixel, uTravel, uDust;
    attribute vec4 aSeed;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float z = mod(aSeed.z + uTravel + uTime * 0.8, 120.0) - 100.0; // flies towards the lens
      vec3 p = vec3(aSeed.x, aSeed.y, z);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (0.8 + aSeed.w * 1.8) * uPixel * 30.0 / max(-mv.z, 1.0);
      vAlpha = uFade * uDust * (0.2 + 0.5 * aSeed.w) * smoothstep(-100.0, -70.0, z) * (1.0 - smoothstep(8.0, 16.0, z));
      vColor = mix(vec3(0.35, 0.5, 0.95), vec3(1.0), aSeed.w);
    }
  `;
  const material = useSprites(vertexShader, uniforms);
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ——— scroll → morph, camera, lens, phrases and the hand-over ———
function Rig({ uniforms, show, bridge, lens, morph }: { uniforms: Uniforms; show: number[]; bridge: RefObject<ManifestoBridge | null>; lens: Lens; morph: RefObject<Morph> }) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const canvas = useThree((state) => state.gl.domElement);
  const state = useRef({ started: false, x: 0, h: 0, v: 0, scroll: -1, leanX: 0, leanY: 0, px: -1, py: -1, moved: -1e9, gx: 0, gy: 0, blink: -1, nextBlink: 3, reveal: -1, irisX: 0, irisY: 0, irisScale: 1 });
  const tools = useMemo(() => ({ frame: new THREE.Matrix4(), fit: new THREE.Matrix4(), v: new THREE.Vector3() }), []);

  useEffect(() => {
    const st = state.current;
    const onPointer = (e: PointerEvent) => {
      st.px = e.clientX;
      st.py = e.clientY;
      st.moved = performance.now();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    const stage = bridge.current?.stage;
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      // give the portrait back its motion and its opacity
      handoff.reveal = 1;
      stage?.style.removeProperty('--reveal');
    };
  }, [bridge]);

  useFrame((_, delta) => {
    const b = bridge.current;
    if (!b || !morph.current) return;
    const dt = Math.min(0.05, delta);
    const st = state.current;
    const vh = window.innerHeight;
    const view = canvas.getBoundingClientRect();
    const rect = b.section.getBoundingClientRect();
    const hero = b.hero?.getBoundingClientRect();
    const frame = Number(b.hero?.dataset.frame ?? 82);
    const heroDone = !hero || hero.bottom <= vh + 1;

    // The About section slides over the end of this one: `h` runs 0 → 1 from its top entering the
    // viewport until its stage is centred, while the particles assemble the portrait on the stage.
    const about = b.about?.getBoundingClientRect();
    const stage = b.stage?.getBoundingClientRect();
    const ch = document.documentElement.clientHeight;
    const handover = about && stage ? handoffLength(about, stage, ch) : 0;
    const h = about && handover ? clamp01((ch - about.top) / handover) : 0;
    // `x` counts shapes along the phrases' scroll: from the hero's end until the About section arrives.
    // (Measured against the viewport's stable height, so a phone's collapsing toolbar doesn't shift it.)
    const track = Math.max(1, rect.bottom - (hero ? hero.bottom : rect.top) - handover);
    const x = hero ? Math.max(0, ((ch - hero.bottom) / track) * b.track) : 0;
    // Eased towards the scroll; on the first frame and after a pause (the section was off screen or asleep)
    // it jumps there instead of racing through every shape in between.
    const snap = !st.started || delta > 0.25;
    const k = snap ? 1 : 1 - Math.exp(-dt * 6);
    st.started = true;
    st.x += (x - st.x) * k;
    st.h += (h - st.h) * k;
    // Scroll speed (for the lens kick and the aberration) from the eased scroll, not the raw one: a mouse
    // wheel moves the page in steps, and their raw speed would pump the camera in and out with every notch.
    const scrolled = st.scroll;
    st.scroll = snap ? window.scrollY : st.scroll + (window.scrollY - st.scroll) * k;
    st.v = snap ? 0 : st.v + ((st.scroll - scrolled) / dt - st.v) * (1 - Math.exp(-dt * 4));
    const speed = heroDone ? Math.min(1, Math.abs(st.v) / (2.1 * vh)) : 0;

    // galaxy → Earth → its lights → heart → idea → brain → laptop → its chip → AI → eye: every segment holds its
    // shape first, then morphs; into the laptop's chip the camera dives. Then the eye → the portrait, with the
    // hand-over.
    let pair: number;
    let t: number;
    // The galaxy winds up while the camera flies into the eye (hero frames), then draws to the middle of
    // the screen past the hero and collapses into the Earth.
    const twist = smooth(IRIS_FULL + 1, 80, frame);
    let pull = 0;
    let first = 1; // the galaxy's phrase, gathering as the galaxy settles
    if (st.x < TRACK) {
      pair = 0;
      let f = st.x;
      while (pair < STAGES - 1 && f >= STAGE[pair]) f -= STAGE[pair++];
      f = Math.min(1, f / STAGE[pair]);
      if (pair === 0) {
        // past the hero the galaxy draws to the middle of the screen, holds its phrase a while and collapses
        // into the Earth
        pull = heroDone ? smooth(0, 0.25, f) : 0;
        first = heroDone ? smooth(0.08, 0.4, f) : 0;
        t = smooth(0.62, 0.97, f);
      } else t = smooth(0.36, 0.95, f);
    } else {
      pair = STAGES;
      t = smooth(0, 0.8, st.h);
    }
    morph.current.pair = pair;
    uniforms.uMorph.value = t;
    uniforms.uTwist.value = twist;
    uniforms.uIrisOn.value = pair === 0 ? 1 : 0;
    uniforms.uAboutOn.value = pair === STAGES ? 1 : 0;
    uniforms.uDiveOn.value = pair === DIVE ? 1 : 0;
    const flight = Math.sin(Math.PI * t);
    const reveal = pair === STAGES ? smooth(0.76, 0.98, st.h) : 0; // the portrait fades in over the landed particles…
    const leave = pair === STAGES ? smooth(0.84, 1, st.h) : 0; // …and they fade out

    // While the hero plays, lay the iris exactly over the pupil in the video (centre and radius per frame,
    // scripts/estimate-motion.py), through the video's cover fit and its depth transform.
    if (!heroDone && b.video) {
      const rows = heroPupil.frames;
      const at = Math.min(rows.length - 1, Math.max(0, frame - heroPupil.first));
      const i = Math.min(rows.length - 2, Math.floor(at));
      const f = at - i;
      const [cx, cy, r] = rows[i].map((v, j) => v + (rows[i + 1][j] - v) * f);
      const W = b.video.clientWidth;
      const H = b.video.clientHeight;
      const drawW = Math.max(W, (H * 16) / 9);
      const drawH = (drawW * 9) / 16;
      const box = b.video.getBoundingClientRect();
      const zoom = box.width / Math.max(1, W);
      const px = box.left + ((W - drawW) / 2 + cx * drawW) * zoom;
      const py = box.top + ((H - drawH) / 2 + cy * drawH) * zoom;
      const perPx = worldTall() / Math.max(1, view.height);
      st.irisX = (px - view.left - view.width / 2) * perPx;
      st.irisY = -(py - view.top - view.height / 2) * perPx;
      st.irisScale = (r * drawH * zoom * perPx) / (worldTall() * 0.92 * IRIS_INNER);
    }
    // Past the hero the spiral draws in from the pupil's last place and size to the middle of the screen,
    // where the Earth forms, small enough to be seen whole.
    const fit = (Math.min(0.37, 0.42 * (view.width / Math.max(1, view.height))) * worldTall()) / uniforms.uIrisOuter.value;
    const earthAt = uniforms.uEarth.value;
    uniforms.uIrisCenter.value.set(st.irisX + (earthAt.x - st.irisX) * pull, st.irisY + (earthAt.y - st.irisY) * pull);
    uniforms.uIrisScale.value = st.irisScale + (fit - st.irisScale) * pull;

    uniforms.uTime.value += still ? dt * 0.2 : dt;
    uniforms.uSpeed.value = speed;
    uniforms.uTravel.value = (st.x + st.h) * 43;
    const gather = smooth(IRIS_FROM, IRIS_FULL, frame);
    uniforms.uGather.value = gather;
    const fade = gather * (1 - leave);
    uniforms.uFade.value = fade;
    uniforms.uDust.value = smooth(0, 0.18, st.x) * (1 - smooth(0.1, 0.7, st.h));

    // camera: still while it has to match the video; afterwards a slow push during each morph, a lean with
    // the pointer and a kick of FOV while travelling
    const lean = heroDone && !small && !still && st.px >= 0;
    st.leanX += ((lean ? (st.px / window.innerWidth) * 2 - 1 : 0) - st.leanX) * (1 - Math.exp(-dt * 3));
    st.leanY += ((lean ? (st.py / vh) * 2 - 1 : 0) - st.leanY) * (1 - Math.exp(-dt * 3));
    const yaw = st.leanX * 0.16;
    const pitch = -st.leanY * 0.1;
    const distance = DISTANCE - flight * 1.5;
    camera.position.set(Math.sin(yaw) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance);
    camera.lookAt(0, 0, 0);
    const fov = FOV + speed * 6 + flight * 4;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // The hand-over: the portrait's points go from the photo's uv through the stage's framing (the crop
    // DepthImage shows) onto the stage's rectangle on screen, and back into this world on the formation plane.
    if (pair === STAGES && stage) {
      const [fx, fy, fw, fh] = coverCrop(stage.width / Math.max(1, stage.height), PORTRAIT.aspect, PORTRAIT.focus);
      tools.frame.set(
        2 / fw, 0, 0, -1 - (2 * fx) / fw,
        0, 2 / fh, 0, -1 - (2 * fy) / fh,
        0, 0, 1, 0,
        0, 0, 0, 1,
      );
      tools.fit.set(
        stage.width / view.width, 0, 0, ((stage.left + stage.width / 2 - view.left) / view.width) * 2 - 1,
        0, stage.height / view.height, 0, 1 - ((stage.top + stage.height / 2 - view.top) / view.height) * 2,
        0, 0, 1, 0,
        0, 0, 0, 1,
      );
      uniforms.uAbout.value.multiplyMatrices(tools.fit, tools.frame);
      uniforms.uCrop.value.set(fx, fy, fw, fh);
      uniforms.uUnproject.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
      uniforms.uPlaneZ.value = tools.v.set(0, 0, 0).project(camera).z;
      // dots about the size that tiles the stage with all the particles
      uniforms.uAboutDot.value = Math.min(3.5, Math.max(1.5, Math.sqrt((stage.width * stage.height) / COUNT) * 1.6));
    }
    if (b.stage && reveal !== st.reveal && (Math.abs(reveal - st.reveal) > 0.001 || reveal === 0 || reveal === 1)) {
      st.reveal = reveal;
      b.stage.style.setProperty('--reveal', reveal.toFixed(3));
      handoff.reveal = reveal;
    }
    // Done: the portrait has taken over and the particles are gone; sleep until the page scrolls back.
    if (pair === STAGES && h >= 1 && leave > 0.999) b.idle(true);

    // lens: aberration with the scroll speed and the morph; grain once the hero is gone
    const ca = still ? 0.0008 : 0.0008 + speed * 0.01 + flight * 0.006;
    lens.aberration.current?.offset.set(ca, ca * 0.6);
    if (lens.noise.current) lens.noise.current.blendMode.opacity.value = 0.45 * fade * uniforms.uDust.value;

    // The eye looks at the cursor (and around on its own once the cursor rests) and blinks now and then.
    if (pair >= STAGES - 1) {
      const eye = uniforms.uEye.value;
      tools.v.set(eye.x, eye.y, 0).project(camera);
      const ex = view.left + ((tools.v.x + 1) / 2) * view.width;
      const ey = view.top + ((1 - tools.v.y) / 2) * view.height;
      let gx = 0;
      let gy = 0;
      if (performance.now() - st.moved < 2500) {
        gx = (st.px - ex) / (view.width * 0.3);
        gy = (st.py - ey) / (view.height * 0.3);
      } else if (!still) {
        const time = uniforms.uTime.value;
        gx = Math.sin(time * 0.45) * 0.7 + Math.sin(time * 1.7) * 0.15;
        gy = Math.sin(time * 0.7 + 1.3) * 0.45;
      }
      const len = Math.hypot(gx, gy);
      if (len > 1) {
        gx /= len;
        gy /= len;
      }
      const follow = 1 - Math.exp(-dt * 8);
      st.gx += (gx - st.gx) * follow;
      st.gy += (gy - st.gy) * follow;
      uniforms.uGaze.value.set(st.gx * (eye.z - eye.w * IRIS_SIZE) * 0.8, -st.gy * eye.w * 0.3);
      if (!still) {
        st.nextBlink -= dt;
        if (st.nextBlink <= 0) {
          st.blink = 0;
          st.nextBlink = 2.5 + Math.random() * 4;
        }
        if (st.blink >= 0) st.blink = st.blink + dt > 0.26 ? -1 : st.blink + dt;
        uniforms.uBlink.value = st.blink < 0 ? 0 : st.blink < 0.08 ? st.blink / 0.08 : 1 - (st.blink - 0.08) / 0.18;
      }
    }

    // Phrases move with their shapes: a phrase gathers while its first shape forms (the second half of the
    // morph, when the particles land; the galaxy's as it settles), holds over the next ones it carries and breaks
    // up as its last one leaves (the first half).
    const leaving = PHRASE_OF[pair];
    const coming = pair < STAGES ? PHRASE_OF[pair + 1] : -1;
    for (let i = 0; i < show.length; i++) show[i] = i === leaving ? (i === coming ? 1 : 1 - smooth(0, 0.55, t)) * first : i === coming ? smooth(0.45, 1, t) : 0;
  }, -1); // before the cloud, which uploads the pair of shapes this frame shows
  return null;
}

// Once every part is in the scene, compiles its shaders in the background (KHR_parallel_shader_compile)
// before the first frame, so the scene can mount early (while the hero plays) without stalling the page.
function Warmup({ onWarm }: { onWarm: () => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    let alive = true;
    const done = () => alive && onWarm();
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}

function Scene({ bridge, onWarm }: { bridge: RefObject<ManifestoBridge | null>; onWarm: () => void }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const [cloudIn, setCloudIn] = useState(false);
  const [wordsIn, setWordsIn] = useState(false);
  const cloudReady = useCallback(() => setCloudIn(true), []);
  const wordsReady = useCallback(() => setWordsIn(true), []);
  const uniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uFade: { value: 0 },
      uPixel: { value: 1 },
      uSpeed: { value: 0 },
      uTravel: { value: 0 },
      uDust: { value: 0 },
      uIrisOn: { value: 1 },
      uIrisCenter: { value: new THREE.Vector2() },
      uIrisScale: { value: 1 },
      uIrisOuter: { value: worldTall() * 0.92 * 0.36 },
      uGather: { value: 0 },
      uTwist: { value: 0 },
      uEarth: { value: new THREE.Vector4(0, 0, 0, 1) },
      uHeart: { value: new THREE.Vector4(0, 0, 0, 1) },
      uBulb: { value: new THREE.Vector4(0, 0, 0, 1) },
      uBrain: { value: new THREE.Vector4(0, 0, 0, 1) },
      uChip: { value: new THREE.Vector4(0, 0, 0, 1) },
      uDive: { value: new THREE.Vector4(0, 0, 0, 1) },
      uDiveOn: { value: 0 },
      uSpinFrom: { value: 0 },
      uSpinTo: { value: 0 },
      uEye: { value: new THREE.Vector4(0, 0, 1, 0.4) },
      uGaze: { value: new THREE.Vector2() },
      uBlink: { value: 0 },
      uAboutOn: { value: 0 },
      uAbout: { value: new THREE.Matrix4() },
      uCrop: { value: new THREE.Vector4(0, 0, 1, 1) },
      uUnproject: { value: new THREE.Matrix4() },
      uPlaneZ: { value: 0 },
      uAboutDot: { value: 1.5 },
    }),
    [],
  );
  uniforms.uPixel.value = dpr;
  const show = useMemo(() => PHRASES.map(() => 0), []);
  const morph = useRef<Morph>({ pair: 0 });
  const lens: Lens = {
    aberration: useRef<ChromaticAberrationEffect>(null),
    noise: useRef<NoiseEffect>(null),
  };
  const offset = useMemo(() => new THREE.Vector2(0.0008, 0.0005), []);
  const screenAlpha = useMemo(() => new ScreenAlpha(), []);
  return (
    <>
      <Dust uniforms={uniforms} />
      <Cloud uniforms={uniforms} morph={morph} bridge={bridge} onReady={cloudReady} />
      <Words uniforms={uniforms} show={show} onReady={wordsReady} />
      {cloudIn && wordsIn && <Warmup onWarm={onWarm} />}
      <Rig uniforms={uniforms} show={show} bridge={bridge} lens={lens} morph={morph} />
      <KeepSize />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.1} luminanceSmoothing={0.3} levels={small ? 5 : 7} radius={0.72} />
        <ChromaticAberration ref={lens.aberration} offset={offset} radialModulation modulationOffset={0.1} />
        <Noise ref={lens.noise} premultiply blendFunction={BlendFunction.SCREEN} opacity={0} />
        <primitive object={screenAlpha} />
      </EffectComposer>
    </>
  );
}

export default function ManifestoScene({ active, bridge }: Props) {
  // No frames until the shaders are compiled (Warmup).
  const [warm, setWarm] = useState(false);
  const warmed = useCallback(() => setWarm(true), []);
  return (
    <Canvas
      frameloop={active && warm ? 'always' : 'never'}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, DISTANCE], fov: FOV, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Scene bridge={bridge} onWarm={warmed} />
    </Canvas>
  );
}
