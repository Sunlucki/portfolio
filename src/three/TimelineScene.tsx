import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Noise } from '@react-three/postprocessing';
import { BlendFunction, type ChromaticAberrationEffect, type NoiseEffect } from 'postprocessing';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import heroPupil from '../heroPupil.json';

/**
 * Career timeline as one cloud of particles. Every stage — year, title, a line under it — is spelled
 * out by the same particles, which flow from one stage to the next as the page scrolls: they lift
 * off, swirl through depth towards the lens and settle into the next scene. Outlines carry most of
 * the particles and flicker like current (after React Bits' Electric Logo), a light pulse sweeps the
 * letters, and dust streams past to carry the flight. Bloom, grain and a chromatic aberration that
 * follows the scroll speed and the morph do the lens work. All motion runs on the GPU.
 */

export type TimelineBridge = {
  section: HTMLElement;
  hero: HTMLElement | null; // carries the frame the hero shows (data-frame)
  video: HTMLCanvasElement | null; // the hero's video canvas, to find the pupil on screen
  counter: HTMLElement | null;
};

export type TimelineStage = { year: string; title: string; line: string };

type Props = {
  active: boolean;
  stages: TimelineStage[];
  bridge: RefObject<TimelineBridge | null>;
};

const small = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COUNT = small ? 26000 : 64000;
const DUST = small ? 1400 : 4000;
const BG = '#000000'; // the layer is screen-blended: black is see-through (over the hero, then the page)
const FOV = 42;
const DISTANCE = 16; // camera → formation plane
const AMBIENT = 0.1; // share of particles that stay a loose cloud around the words
const IRIS_INNER = 0.12; // iris pupil radius, in world heights at the formation plane
const IRIS_FROM = 57; // hero frame at which the particle iris starts to form over the real one
const IRIS_FULL = 61;
const worldTall = () => 2 * DISTANCE * Math.tan(((FOV / 2) * Math.PI) / 180); // world height seen at the plane

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

// The materials are built here rather than as JSX props: R3F copies a `uniforms` prop into the material,
// and these uniforms must stay the very objects the rig updates every frame.
function useSprites(vertexShader: string, uniforms: Uniforms) {
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

// ——— scenes: text → points ———

// Hilbert index of (x, y) on a 1024 grid; sorting every scene's points by it pairs particles with
// nearby places in the next scene, so the cloud flows instead of criss-crossing.
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

// Orders `count` points (xyz) along the Hilbert curve of their x/y, within bounds of ±half.
function hilbertSort(points: Float32Array, count: number, half: number) {
  const keys = new Float64Array(count);
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    const x = Math.min(1023, Math.max(0, Math.round(((points[i * 3] / half + 1) / 2) * 1023)));
    const y = Math.min(1023, Math.max(0, Math.round(((points[i * 3 + 1] / half + 1) / 2) * 1023)));
    keys[i] = hilbert(x, y) + Math.random() * 0.5;
    order[i] = i;
  }
  order.sort((a, b) => keys[a] - keys[b]);
  const sorted = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) sorted.set(points.subarray(order[i] * 3, order[i] * 3 + 3), i * 3);
  return sorted;
}

// The scroll arrives from the hero's close-up of the pupil, so the particles start as an iris: fibres
// radiating around a dark pupil, which then opens into the first year.
function iris(worldHeight: number) {
  const out = new Float32Array(COUNT * 3);
  const inner = worldHeight * IRIS_INNER;
  const outer = worldHeight * 0.36;
  for (let i = 0; i < COUNT; i++) {
    const fibre = Math.floor(Math.random() * 180);
    const a = (fibre / 180) * Math.PI * 2 + gaussian() * 0.006 + Math.sin(fibre * 7.3) * 0.02;
    const r = inner + (outer - inner) * Math.pow(Math.random(), 0.8);
    out.set([Math.cos(a) * r, Math.sin(a) * r, gaussian() * 0.15], i * 3);
  }
  return hilbertSort(out, COUNT, outer * 1.2);
}

// A loose nebula: where the particles leave to at the end.
function nebula(half: number) {
  const out = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = half * (0.25 + 0.75 * Math.cbrt(Math.random()));
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    out.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a) * 0.6, r * Math.cos(b) * 0.8], i * 3);
  }
  return hilbertSort(out, COUNT, half);
}

// Lays a stage out on a canvas the shape of the viewport and turns its ink into particle targets:
// outlines get most of them (the electric look), the rest fill the strokes or drift around.
function scenePoints(stage: TimelineStage, aspect: number, worldHeight: number) {
  const H = 1000;
  const W = Math.round(H * aspect);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const portrait = aspect < 1;
  const fit = (text: string, weight: number, size: number, maxWidth: number) => {
    ctx.font = `${weight} ${size}px Kanit, sans-serif`;
    const width = ctx.measureText(text).width;
    if (width > maxWidth) ctx.font = `${weight} ${Math.floor((size * maxWidth) / width)}px Kanit, sans-serif`;
  };
  // Phones: long titles go on two lines, split where the halves are most even.
  const lines = (text: string, weight: number, size: number) => {
    ctx.font = `${weight} ${size}px Kanit, sans-serif`;
    if (!portrait || ctx.measureText(text).width <= W * 0.9 || !text.includes(' ')) return [text];
    const words = text.split(' ');
    let best = [text];
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const diff = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = [a, b];
      }
    }
    return best;
  };
  fit(stage.year, 900, portrait ? 300 : 330, W * 0.86);
  ctx.fillText(stage.year, W / 2, portrait ? H * 0.34 : H * 0.4);
  const titleSize = portrait ? 92 : 84;
  const title = lines(stage.title.toUpperCase(), 600, titleSize);
  const titleTop = portrait ? H * 0.58 : H * 0.69;
  title.forEach((line, i) => {
    fit(line, 600, titleSize, W * 0.9);
    ctx.fillText(line, W / 2, titleTop + i * titleSize * 1.05);
  });
  fit(stage.line.toUpperCase(), 500, portrait ? 50 : 44, W * 0.88);
  ctx.fillText(stage.line.toUpperCase(), W / 2, portrait ? titleTop + title.length * titleSize * 1.05 + 30 : H * 0.8);

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
  const scale = worldHeight / H;
  const out = new Float32Array(COUNT * 3);
  const inText = Math.round(COUNT * (1 - AMBIENT));
  for (let i = 0; i < COUNT; i++) {
    if (i < inText) {
      const pool = i % 20 < 12 || !fill.length ? edges : fill;
      const k = Math.floor(Math.random() * (pool.length / 2)) * 2;
      out.set([(pool[k] + Math.random() - W / 2) * scale, -(pool[k + 1] + Math.random() - H / 2) * scale, gaussian() * 0.08], i * 3);
    } else {
      out.set([gaussian() * W * scale * 0.34, gaussian() * worldHeight * 0.3, gaussian() * 2.5], i * 3);
    }
  }
  return hilbertSort(out, COUNT, Math.max(W, H) * scale * 0.6);
}

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
};
type Morph = { pair: number };
type Lens = {
  aberration: RefObject<ChromaticAberrationEffect | null>;
  noise: RefObject<NoiseEffect | null>;
};

// ——— the cloud ———
function Cloud({ stages, uniforms, morph }: { stages: TimelineStage[]; uniforms: Uniforms; morph: RefObject<Morph> }) {
  const size = useThree((state) => state.size);
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => alive && setFonts(true);
    const load = document.fonts ? Promise.all(['900', '600', '500'].map((w) => document.fonts.load(`${w} 100px Kanit`))) : Promise.resolve();
    load.then(done, done);
    return () => {
      alive = false;
    };
  }, []);

  const worldHeight = 2 * DISTANCE * Math.tan(((FOV / 2) * Math.PI) / 180) * 0.92;
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 1;
  // Scenes are laid out once per orientation: iris → stages → nebula.
  const scenes = useMemo(() => {
    if (!fonts) return null;
    const half = worldHeight * Math.max(1, aspect) * 0.7;
    return [iris(worldHeight), ...stages.map((stage) => scenePoints(stage, aspect, worldHeight)), nebula(half * 1.4)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonts, stages, portrait]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute('aFrom', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    const rand = new Float32Array(COUNT * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Swap the pair of scenes the particles travel between when the scroll crosses into another one.
  const pair = useRef(-1);
  useEffect(() => {
    pair.current = -1; // re-upload after a re-layout
  }, [scenes]);
  useFrame(() => {
    const m = morph.current;
    if (!scenes || !m) return;
    const j = Math.min(scenes.length - 2, m.pair);
    if (j === pair.current) return;
    pair.current = j;
    const from = geometry.getAttribute('aFrom') as THREE.BufferAttribute;
    const to = geometry.getAttribute('aTo') as THREE.BufferAttribute;
    (from.array as Float32Array).set(scenes[j]);
    (to.array as Float32Array).set(scenes[j + 1]);
    from.needsUpdate = true;
    to.needsUpdate = true;
  });

  const vertexShader = /* glsl */ `
    uniform float uTime, uMorph, uFade, uPixel, uSpeed, uIrisOn, uIrisScale;
    uniform vec2 uIrisCenter;
    attribute vec3 aFrom;
    attribute vec3 aTo;
    attribute vec4 aRand;
    varying vec3 vColor;
    varying float vAlpha;
    ${NOISE_GLSL}
    void main() {
      float m = smoothstep(aRand.x * 0.4, 0.6 + aRand.x * 0.4, uMorph); // particle by particle
      float flight = sin(3.14159265 * m);
      vec3 from = aFrom;
      from.xy = mix(from.xy, uIrisCenter + from.xy * uIrisScale, uIrisOn); // the iris sits on the real pupil
      vec3 p = mix(from, aTo, m * m * (3.0 - 2.0 * m));
      vec3 q = p * 0.16 + vec3(0.0, 0.0, uTime * 0.15);
      vec3 curl = vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0));
      p += curl * flight * (1.6 + aRand.y * 1.8);
      p.z += flight * (1.0 + aRand.y * 5.0); // swirl out towards the lens
      // settled: a fine crackle along the outlines
      p.xy += vec2(snoise(vec3(aRand.zw * 60.0, uTime * 2.3)), snoise(vec3(aRand.wz * 60.0, uTime * 2.3 + 7.0))) * 0.018 * (1.0 - flight);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (0.9 + aRand.z * 1.3) * uPixel * 34.0 / max(-mv.z, 1.0);
      float flicker = 0.55 + 0.45 * smoothstep(-0.3, 0.8, snoise(vec3(aRand.xy * 30.0, uTime * 3.0)));
      float sweep = exp(-pow(p.x * 0.18 - mod(uTime * 0.45, 8.0) + 4.0, 2.0) * 5.0); // a pulse running through the letters
      vAlpha = uFade * flicker * (0.5 + 0.5 * aRand.w) * (1.0 + sweep * 1.8) * (1.0 - 0.35 * flight);
      float hue = 0.5 + 0.5 * sin(p.x * 0.25 + p.y * 0.18 + uTime * 0.6 + aRand.y * 2.0);
      vec3 blue = vec3(0.12, 0.38, 1.0);
      vec3 cyan = vec3(0.45, 0.95, 1.0);
      vec3 violet = vec3(0.62, 0.42, 1.0);
      vColor = mix(mix(blue, cyan, hue), violet, smoothstep(0.7, 1.0, aRand.y) * 0.8);
      vColor = mix(vColor, vec3(1.0), sweep * 0.6 + (1.0 - flight) * 0.15);
    }
  `;
  const material = useSprites(vertexShader, uniforms);
  if (!scenes) return null;
  return <points geometry={geometry} material={material} frustumCulled={false} />;
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

// ——— scroll → morph, camera and lens ———
function Rig({
  uniforms,
  count,
  bridge,
  lens,
  morph,
}: {
  uniforms: Uniforms;
  count: number;
  bridge: RefObject<TimelineBridge | null>;
  lens: Lens;
  morph: RefObject<Morph>;
}) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const canvas = useThree((state) => state.gl.domElement);
  const state = useRef({ p: 0, v: 0, aimX: 0, aimY: 0, x: 0, y: 0 });

  useEffect(() => {
    if (small || still) return;
    const onMove = (e: PointerEvent) => {
      state.current.aimX = (e.clientX / window.innerWidth) * 2 - 1;
      state.current.aimY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    const b = bridge.current;
    if (!b || !morph.current) return;
    const dt = Math.min(0.05, delta);
    const st = state.current;
    const vh = window.innerHeight;
    const rect = b.section.getBoundingClientRect();
    const hero = b.hero?.getBoundingClientRect();
    // The section starts on top of the hero's last part: `frame` is what the hero shows, `after` the share
    // of the scroll since the hero ended (0 → 1 over the stages).
    const frame = Number(b.hero?.dataset.frame ?? 82);
    const heroDone = !hero || hero.bottom <= vh + 1;
    const after = hero ? Math.min(1, Math.max(0, (vh - hero.bottom) / Math.max(1, rect.bottom - hero.bottom))) : 0;
    const prev = st.p;
    st.p += (after - st.p) * (1 - Math.exp(-dt * 6));
    st.v += ((st.p - prev) / dt - st.v) * (1 - Math.exp(-dt * 10));
    const speed = heroDone ? Math.min(1, (Math.abs(st.v) * (count + 1)) / 3) : 0;

    // iris → stage 1 → … → stage n → nebula: every segment holds its scene first, then morphs
    const x = st.p * (count + 1);
    const pair = Math.min(count, Math.floor(x));
    const f = x - pair;
    const t = pair === 0 ? smooth(0, 0.8, f) : smooth(0.36, 0.95, f); // out of the pupil straight away
    morph.current.pair = pair;
    uniforms.uMorph.value = t;
    uniforms.uIrisOn.value = pair === 0 ? 1 : 0;
    const flight = Math.sin(Math.PI * t);

    // While the hero plays, lay the iris exactly over the pupil in the video (centre and radius per frame,
    // scripts/estimate-motion.py), through the video's cover fit and its depth transform.
    if (!heroDone && b.video) {
      const rows = heroPupil.frames;
      const at = Math.min(rows.length - 1, Math.max(0, frame - heroPupil.first));
      const i = Math.min(rows.length - 2, Math.floor(at));
      const k = at - i;
      const [cx, cy, r] = rows[i].map((v, j) => v + (rows[i + 1][j] - v) * k);
      const W = b.video.clientWidth;
      const H = b.video.clientHeight;
      const drawW = Math.max(W, (H * 16) / 9);
      const drawH = (drawW * 9) / 16;
      const box = b.video.getBoundingClientRect();
      const zoom = box.width / Math.max(1, W);
      const px = box.left + ((W - drawW) / 2 + cx * drawW) * zoom;
      const py = box.top + ((H - drawH) / 2 + cy * drawH) * zoom;
      const view = canvas.getBoundingClientRect();
      const perPx = worldTall() / Math.max(1, view.height);
      uniforms.uIrisCenter.value.set((px - view.left - view.width / 2) * perPx, -(py - view.top - view.height / 2) * perPx);
      uniforms.uIrisScale.value = (r * drawH * zoom * perPx) / (worldTall() * 0.92 * IRIS_INNER);
    }

    uniforms.uTime.value += still ? dt * 0.2 : dt;
    uniforms.uSpeed.value = speed;
    uniforms.uTravel.value = st.p * 260;
    const fade = smooth(IRIS_FROM, IRIS_FULL, frame) * (1 - smooth(0.965, 1, st.p));
    uniforms.uFade.value = fade;
    uniforms.uDust.value = smooth(0, 0.03, st.p);

    // camera: still while it has to match the video; afterwards a slow push during each morph, a lean with
    // the pointer and a kick of FOV while travelling
    st.x += ((heroDone ? st.aimX : 0) - st.x) * (1 - Math.exp(-dt * 3));
    st.y += ((heroDone ? st.aimY : 0) - st.y) * (1 - Math.exp(-dt * 3));
    const yaw = st.x * 0.16;
    const pitch = -st.y * 0.1;
    const distance = DISTANCE - flight * 1.5;
    camera.position.set(Math.sin(yaw) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance);
    camera.lookAt(0, 0, 0);
    const fov = FOV + speed * 10 + flight * 4;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // lens: aberration with the scroll speed and the morph; grain once the hero is gone
    const ca = still ? 0.0008 : 0.0008 + speed * 0.01 + flight * 0.006;
    lens.aberration.current?.offset.set(ca, ca * 0.6);
    if (lens.noise.current) lens.noise.current.blendMode.opacity.value = 0.45 * fade * uniforms.uDust.value;

    // counter
    if (b.counter) {
      b.counter.style.opacity = String(uniforms.uDust.value * (1 - smooth(0.965, 1, st.p)));
      const index = Math.min(count - 1, Math.max(0, Math.round(x) - 1));
      if (b.counter.dataset.index !== String(index)) {
        b.counter.dataset.index = String(index);
        b.counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
      }
    }
  });
  return null;
}

function Scene({ stages, bridge }: { stages: TimelineStage[]; bridge: RefObject<TimelineBridge | null> }) {
  const dpr = useThree((state) => state.viewport.dpr);
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
    }),
    [],
  );
  uniforms.uPixel.value = dpr;
  const morph = useRef<Morph>({ pair: 0 });
  const lens: Lens = {
    aberration: useRef<ChromaticAberrationEffect>(null),
    noise: useRef<NoiseEffect>(null),
  };
  const offset = useMemo(() => new THREE.Vector2(0.0008, 0.0005), []);
  return (
    <>
      <color attach="background" args={[BG]} />
      <Dust uniforms={uniforms} />
      <Cloud stages={stages} uniforms={uniforms} morph={morph} />
      <Rig uniforms={uniforms} count={stages.length} bridge={bridge} lens={lens} morph={morph} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.1} luminanceSmoothing={0.3} levels={small ? 5 : 7} radius={0.72} />
        <ChromaticAberration ref={lens.aberration} offset={offset} radialModulation modulationOffset={0.1} />
        <Noise ref={lens.noise} premultiply blendFunction={BlendFunction.SCREEN} opacity={0} />
      </EffectComposer>
    </>
  );
}

export default function TimelineScene({ active, stages, bridge }: Props) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={small ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 0, DISTANCE], fov: FOV, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Scene stages={stages} bridge={bridge} />
    </Canvas>
  );
}
