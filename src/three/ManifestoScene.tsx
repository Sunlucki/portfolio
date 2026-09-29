import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlendFunction, Effect, type ChromaticAberrationEffect, type NoiseEffect } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { PHRASES, phraseRuns, type Run } from '../content';
import heroPupil from '../heroPupil.json';
import { coverCrop } from '../components/coverCrop';
import { PORTRAIT, handoff, handoffLength } from './aboutStage';
import { landMask } from './earth';
import { KeepSize } from './KeepSize';

/**
 * The manifesto after the hero: one cloud of particles that takes a shape for every phrase (the Earth, a
 * gear, a circuit brain, a question mark and an eye that follows the cursor), with the phrase itself
 * written in particles underneath. It starts as an iris gathering over the hero's pupil, which winds
 * into a spiral and collapses into the planet. The shapes flow into each other as the page scrolls: particles lift
 * off, swirl through depth towards the lens and settle into the next one. Points sit mostly on outlines
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
const SHAPES = PHRASES.length; // Earth, gear, brain, question mark, eye; then the portrait
const S = 4; // floats per point: x, y, z and the part of its shape
// Parts of a shape that move or shine on their own (read by the vertex shader).
const PART = { loose: 0, iris: 1, lid: 2, line: 3, white: 4, glint: 5, portrait: 6, land: 10, coast: 11, ocean: 12, air: 13 };
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

// Brain with circuits — Lucide "brain-circuit" (ISC, lucide.dev), 24-unit paths.
const BRAIN = [
  'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z',
  'M9 13a4.5 4.5 0 0 0 3-4',
  'M6.003 5.125A3 3 0 0 0 6.401 6.5',
  'M3.477 10.896a4 4 0 0 1 .585-.396',
  'M6 18a4 4 0 0 1-1.967-.516',
  'M12 13h4',
  'M12 18h6a2 2 0 0 1 2 2v1',
  'M12 8h8',
  'M16 8V5a2 2 0 0 1 2-2',
];
const BRAIN_NODES = [
  [16, 13],
  [18, 3],
  [20, 21],
  [20, 8],
];

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

// Orders the points along the Hilbert curve of (u, v) in [0, 1]²: by default their x/y within ±half.
function hilbertSort(points: Float32Array, half: number, uv?: (i: number) => [number, number]) {
  const keys = new Float64Array(COUNT);
  const order = new Uint32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const [u, v] = uv ? uv(i) : [(points[i * S] / half + 1) / 2, (points[i * S + 1] / half + 1) / 2];
    const x = Math.min(1023, Math.max(0, Math.round(u * 1023)));
    const y = Math.min(1023, Math.max(0, Math.round(v * 1023)));
    keys[i] = hilbert(x, y) + Math.random() * 0.5;
    order[i] = i;
  }
  order.sort((a, b) => keys[a] - keys[b]);
  const sorted = new Float32Array(COUNT * S);
  for (let i = 0; i < COUNT; i++) sorted.set(points.subarray(order[i] * S, order[i] * S + S), i * S);
  return sorted;
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

// "In our world anything is possible": the Earth. Continents in dense points with their coasts traced
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

// "The best tools": a 3D gear — 12 teeth on both faces, the flanks between them, the bore and a hub.
function gear(radius: number, lift: number) {
  const teeth = 12;
  const inner = radius * 0.8;
  const depth = radius * 0.3;
  const profile = (u: number) => (u < 0.08 ? inner + ((radius - inner) * u) / 0.08 : u < 0.42 ? radius : u < 0.5 ? radius - ((radius - inner) * (u - 0.42)) / 0.08 : inner);
  const steps = teeth * 64;
  const outline: number[] = [];
  const lengths = [0];
  for (let j = 0; j <= steps; j++) {
    const phi = (j / steps) * Math.PI * 2;
    const r = profile(((phi / (Math.PI * 2)) * teeth) % 1);
    outline.push(Math.cos(phi) * r, Math.sin(phi) * r);
    if (j) lengths.push(lengths[j - 1] + Math.hypot(outline[j * 2] - outline[j * 2 - 2], outline[j * 2 + 1] - outline[j * 2 - 1]));
  }
  const total = lengths[steps];
  const along = () => {
    const target = Math.random() * total;
    let lo = 0;
    let hi = steps;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return [outline[lo * 2], outline[lo * 2 + 1]];
  };
  const out = new Float32Array(COUNT * S);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < solid; i++) {
    const kind = Math.random();
    let x: number;
    let y: number;
    let z: number;
    if (kind < 0.58) {
      [x, y] = along();
      z = (Math.random() < 0.5 ? -0.5 : 0.5) * depth;
    } else if (kind < 0.74) {
      [x, y] = along();
      z = (Math.random() - 0.5) * depth;
    } else {
      const ring = kind < 0.9 ? radius * 0.3 : radius * 0.5;
      const a = Math.random() * Math.PI * 2;
      [x, y] = [Math.cos(a) * ring, Math.sin(a) * ring];
      z = (Math.random() < 0.5 ? -0.5 : 0.5) * depth;
    }
    out.set([x, y + lift, z, PART.loose], i * S);
  }
  ambient(out, radius * 2.2, lift);
  return hilbertSort(out, radius * 2);
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

// A drawing on a square canvas, `size` world units across, turned into points.
function drawn(draw: (ctx: CanvasRenderingContext2D, side: number) => void, size: number, lift: number, depth: number) {
  const side = 900;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  draw(ctx, side);
  const solid = Math.round(COUNT * (1 - AMBIENT));
  const ink = inkPoints(ctx, side, side, solid);
  const scale = size / side;
  const out = new Float32Array(COUNT * S);
  for (let i = 0; i < solid; i++) {
    out.set([(ink[i * 2] - side / 2) * scale, -(ink[i * 2 + 1] - side / 2) * scale + lift, gaussian() * depth, PART.loose], i * S);
  }
  ambient(out, size, lift);
  return hilbertSort(out, size);
}

// "The age of AI": the circuit brain.
const brain = (size: number, lift: number) =>
  drawn(
    (ctx, side) => {
      ctx.scale(side / 24, side / 24);
      ctx.strokeStyle = ctx.fillStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.lineCap = ctx.lineJoin = 'round';
      for (const d of BRAIN) ctx.stroke(new Path2D(d));
      for (const [x, y] of BRAIN_NODES) {
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    size,
    lift,
    0.18,
  );

// "Only why": a question mark in Kanit Black.
const question = (size: number, lift: number) =>
  drawn(
    (ctx, side) => {
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(side * 0.95)}px Kanit, sans-serif`;
      ctx.fillText('?', side / 2, side / 2);
    },
    size,
    lift,
    0.14,
  );

type EyeFrame = { x: number; y: number; w: number; h: number }; // centre and half extents of the opening

// "Let's get to know each other": an eye that looks back. Lids, a crease and a dusting of white; an
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

// Turning speed (radians per second) of the shapes that spin — the Earth, the gear; the rest face the viewer.
const SPIN = [0, 0.22, 0.3, 0, 0, 0, 0];

// ——— the cloud ———
function Cloud({ uniforms, morph, bridge, onReady }: { uniforms: Uniforms; morph: RefObject<Morph>; bridge: RefObject<ManifestoBridge | null>; onReady: () => void }) {
  const size = useThree((state) => state.size);
  const [photo, setPhoto] = useState<{ image: HTMLImageElement | null } | null>(null);
  useEffect(() => {
    let alive = true;
    const image = new Image();
    image.src = PORTRAIT.image;
    const fonts = document.fonts ? document.fonts.load('900 100px Kanit') : Promise.resolve();
    Promise.all([image.decode(), fonts]).then(
      () => alive && setPhoto({ image }),
      () => alive && setPhoto({ image: null }),
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
    if (!photo) return null;
    const fit = Math.min(1, aspect * 1.1);
    const lift = worldHeight * (portrait ? 0.17 : 0.12);
    const s = worldHeight * fit;
    const w = s * (portrait ? 0.44 : 0.32);
    const eye = { x: 0, y: lift + worldHeight * (portrait ? 0.02 : 0.06), w, h: w * 0.42 };
    return {
      eye,
      earth: [0, lift, 0, s * 0.3],
      shapes: [
        iris(worldHeight),
        earth(s * 0.3, lift),
        gear(s * 0.27, lift),
        brain(s * 0.54, lift),
        question(s * 0.54, lift),
        eyeShape(eye),
        portraitShape(photo.image, coverCrop(stageAspect, PORTRAIT.aspect, PORTRAIT.focus)),
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, portrait, stageAspect]);
  useEffect(() => {
    if (!layout) return;
    uniforms.uEye.value.set(layout.eye.x, layout.eye.y, layout.eye.w, layout.eye.h);
    uniforms.uEarth.value.fromArray(layout.earth);
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
    uniforms.uSpinFrom.value = SPIN[j] * uniforms.uTime.value;
    uniforms.uSpinTo.value = SPIN[j + 1] * uniforms.uTime.value;
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
    uniform float uBlink, uAboutOn, uPlaneZ, uAboutDot, uIrisOuter, uGather, uTwist;
    uniform vec2 uIrisCenter, uGaze;
    uniform vec4 uEye, uEarth, uCrop;
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
    // A point of the portrait: where the About stage shows it, on this camera's formation plane.
    vec3 about(vec3 p) {
      vec4 clip = uAbout * vec4(p, 1.0);
      vec4 world = uUnproject * vec4(clip.xy / clip.w, uPlaneZ, 1.0);
      return world.xyz / world.w;
    }
    void main() {
      float m = smoothstep(aRand.x * 0.4, 0.6 + aRand.x * 0.4, uMorph); // particle by particle
      float flight = sin(3.14159265 * m);
      float e = m * m * (3.0 - 2.0 * m);
      float seenFrom = 1.0;
      float seenTo = 1.0;
      vec3 from = eye(aFrom, seenFrom);
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
      vec3 to = uAboutOn > 0.5 ? about(aTo.xyz) : spin(eye(aTo, seenTo), uSpinTo);
      float landed = e * uAboutOn; // settled on the portrait: steady, fine dots
      vec3 p = mix(from, to, e);
      // out of the spiral the particles keep circling on their way into the planet
      vec2 hub = mix(uIrisCenter, uEarth.xy, e);
      p.xy = mix(p.xy, hub + turn(p.xy - hub, e * (1.0 - e) * 3.0), uIrisOn);
      vec3 q = p * 0.16 + vec3(0.0, 0.0, uTime * 0.15);
      vec3 curl = vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0));
      p += curl * flight * (1.6 + aRand.y * 1.8) * (1.0 - 0.6 * uIrisOn);
      p.z += flight * (1.0 + aRand.y * 5.0); // swirl out towards the lens
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
      vAlpha = uFade * mix(1.0, light, gw) * mix(flicker, 0.95, max(landed, gw)) * (0.5 + 0.5 * aRand.w) * (1.0 + sweep * 1.8) * (1.0 - 0.35 * flight) * mix(seenFrom, seenTo, e) * shine;
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
      float settled = 1.0 - flight;
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
    const lines: { words: { runs: Run[]; width: number }[]; width: number }[] = [];
    for (const runs of words.filter((word) => word.length)) {
      const wordWidth = runs.reduce((sum, run) => {
        ctx.font = font(run.mark);
        return sum + ctx.measureText(run.text).width;
      }, 0);
      const line = lines[lines.length - 1];
      if (line && line.width + space + wordWidth <= measure) {
        line.words.push({ runs, width: wordWidth });
        line.width += space + wordWidth;
      } else lines.push({ words: [{ runs, width: wordWidth }], width: wordWidth });
    }
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
  uniform float uShow[${SHAPES}];
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

    // iris → Earth → gear → brain → ? → eye: every segment holds its shape first, then morphs; the iris
    // winds into a spiral first. Then the eye → the portrait, with the hand-over.
    let pair: number;
    let t: number;
    // The galaxy winds up while the camera flies into the eye (hero frames), then draws to the middle of
    // the screen past the hero and collapses into the Earth.
    const twist = smooth(IRIS_FULL + 1, 80, frame);
    let pull = 0;
    if (st.x < SHAPES) {
      pair = Math.floor(st.x);
      const f = st.x - pair;
      if (pair === 0) {
        pull = heroDone ? smooth(0, 0.45, f) : 0;
        t = smooth(0.3, 0.95, f);
      } else t = smooth(0.36, 0.95, f);
    } else {
      pair = SHAPES;
      t = smooth(0, 0.8, st.h);
    }
    morph.current.pair = pair;
    uniforms.uMorph.value = t;
    uniforms.uTwist.value = twist;
    uniforms.uIrisOn.value = pair === 0 ? 1 : 0;
    uniforms.uAboutOn.value = pair === SHAPES ? 1 : 0;
    const flight = Math.sin(Math.PI * t);
    const reveal = pair === SHAPES ? smooth(0.76, 0.98, st.h) : 0; // the portrait fades in over the landed particles…
    const leave = pair === SHAPES ? smooth(0.84, 1, st.h) : 0; // …and they fade out

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
    const fit = (Math.min(0.42, 0.48 * (view.width / Math.max(1, view.height))) * worldTall()) / uniforms.uIrisOuter.value;
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
    if (pair === SHAPES && stage) {
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
    if (pair === SHAPES && h >= 1 && leave > 0.999) b.idle(true);

    // lens: aberration with the scroll speed and the morph; grain once the hero is gone
    const ca = still ? 0.0008 : 0.0008 + speed * 0.01 + flight * 0.006;
    lens.aberration.current?.offset.set(ca, ca * 0.6);
    if (lens.noise.current) lens.noise.current.blendMode.opacity.value = 0.45 * fade * uniforms.uDust.value;

    // The eye looks at the cursor (and around on its own once the cursor rests) and blinks now and then.
    if (pair >= SHAPES - 1) {
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

    // Phrases move with their shapes: a phrase gathers while its shape forms (pair i, the second half of
    // the morph, when the particles land) and breaks up as it leaves (pair i + 1, the first half).
    for (let i = 0; i < SHAPES; i++) show[i] = pair === i ? smooth(0.45, 1, t) : pair === i + 1 ? 1 - smooth(0, 0.55, t) : 0;
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
