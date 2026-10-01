import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { MOBILE_APPS } from '../content';
import { flow, phoneLayout, PERSPECTIVE } from './flow';
import { FOV as MUSIC_FOV, RIM, inPlay, placeCamera } from './musicFloor';
import { NOISE_GLSL } from './noise';

/**
 * The particle scene behind the Mobile Apps, Graphics and Video sections (sections/FlowSections.tsx holds it, a
 * canvas stuck to the screen behind them). In the Apps section the iPhone (the contact section's iPhone 17 Pro Max,
 * MajdyModels, CC BY 4.0) gathers out of particles strewn round its place and becomes the model, as the About
 * portrait does out of the manifesto's; it stands there swaying, the apps' screens on its display, a new one pushing
 * in from the right, a new app turning it round. Scrolled on, it breaks up again: its particles swirl up the middle
 * of the screen as a vortex inside the Graphics section's rings of covers (the rings' back halves drawn under this
 * canvas, their front halves over it), and land on the Video section's first films, which then show (their cards'
 * opacity, set here). On phones the Video section shows no grid: the particles build the iPhone again there, the
 * films on its screen as a grid, PLAY in particles standing out in front of it; tapped, the phone flies at the camera
 * until its screen fills the view, its picture splitting into red, green and blue, and the section's feed opens;
 * closed, the feed flies back into the phone. Scrolled on to the Music section, the particles leave the films (or
 * the phone, which breaks up) and build its stage's floor, the rim and PLAY round Bogdan's feet, landing where the
 * stage (three/MusicStage.tsx) draws them, and the stage's own floor shows (flow.music.built).
 * Everything is driven by the scroll (where the sections are on the screen, read every frame), eased.
 */

const small = phoneLayout();
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEIGHT = 2; // the phone, scaled to this height
const FOV = 30;
const DISTANCE = 20;
const TALL = DISTANCE / PERSPECTIVE; // world height seen at the page's plane (flow.ts: the rings share the camera's view)
const COUNT = small ? 7000 : 14000;
const CARDS = 9; // at most this many films are built of particles: the first ones, in view as the grid comes up
const PUSH_S = 0.55;
const TURN_S = 1.3;
const FLY_MS = 950;
const SCREENS = MOBILE_APPS.apps.flatMap((app) => app.screens.map((screen) => screen.image));

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// The display: a screenshot as it is (the display is a light source), laid across the display's face by where each
// point of it is (its UVs are shifted, with a seam); a new one pushes in from the right. Or (uGrid, the Video
// section's phone) the films' grid under a status bar, running up without end. `uSplit` pulls its red and blue
// apart (the camera flying into it), `uOpacity` fades it with the phone.
const screenVertex = /* glsl */ `
  varying vec2 vFace;
  void main() {
    vFace = position.yz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const screenFragment = /* glsl */ `
  uniform sampler2D tFrom;
  uniform sampler2D tTo;
  uniform float uPush;
  uniform float uSplit;
  uniform float uOpacity;
  uniform vec4 uBox; // the display's face: its corner and size
  uniform float uGrid, uScroll, uGridScale, uGridTop; // the grid: on, how far it has run, its scale, the status bar
  varying vec2 vFace;
  vec3 split(sampler2D t, vec2 uv) {
    vec2 off = (uv - 0.5) * uSplit;
    return vec3(texture2D(t, uv + off).r, texture2D(t, uv).g, texture2D(t, uv - off).b);
  }
  void main() {
    vec2 uv = 1.0 - (vFace - uBox.xy) / uBox.zw;
    if (uGrid > 0.5) {
      vec3 films = uv.y < uGridTop ? vec3(0.0) : split(tFrom, vec2(uv.x, fract((uv.y - uGridTop) * uGridScale + uScroll)));
      gl_FragColor = vec4(films, uOpacity);
      return;
    }
    float m = uPush * uPush * (3.0 - 2.0 * uPush);
    vec3 color = uv.x > 1.0 - m ? split(tTo, vec2(uv.x - (1.0 - m), uv.y)) : split(tFrom, vec2(uv.x + 0.3 * m, uv.y)) * (1.0 - 0.45 * m);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

// The particles: each has a place on the phone (aPhone, in its model's units; w: 1 on its display), one in the
// vortex, on desktops one on a film's card (aTile: which, and where on it) and one on the Music stage's floor
// (aMusic). Where it is: strewn round the phone, gathered on it (uAssemble), in the vortex (uLeave), on its card or
// on phones on the phone again (uLand), on the Music stage's floor (uOnward); each particle in its own time,
// swirling on the way.
const particleVertex = /* glsl */ `
  uniform mat4 uPhoneA; // the phone in the Apps section, as it stands now
  uniform mat4 uPhoneB; // phones: the phone in the Video section
  uniform float uAssemble, uLeave, uLand, uTime, uPixel, uSeenA, uSeenB, uCards, uMobile;
  uniform float uOnward, uBuilt, uMorph; // on to the Music stage's floor; the floor shown; its button (0 PLAY, 1 all of it)
  uniform mat4 uMusicView; // the Music stage's camera (and its floor's turn): from the floor to its canvas
  uniform vec4 uStage; // the Music stage's canvas on the page's plane: left, bottom, width, height
  uniform vec4 uCloud; // the vortex: its radius at the top, its height, how far it has risen, how far it has turned
  uniform vec4 uTiles[${CARDS}]; // the films' cards on the page's plane: left, bottom, width, height
  attribute vec4 aPhone;
  attribute vec4 aRand;
  attribute vec3 aTile;
  attribute vec4 aMusic; // its place in the Music stage's PLAY (w: 1 on the floor's rim instead)
  varying vec3 vColor;
  varying float vAlpha;
  ${NOISE_GLSL}
  float own(float u, float delay) {
    float k = clamp((u - delay * 0.45) / 0.55, 0.0, 1.0);
    return k * k * (3.0 - 2.0 * k);
  }
  void main() {
    vec3 onA = (uPhoneA * vec4(aPhone.xyz, 1.0)).xyz;
    vec3 onB = (uPhoneB * vec4(aPhone.xyz, 1.0)).xyz;
    vec3 middle = (uPhoneA * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 away = normalize(aRand.xyz - 0.5 + 1e-4);
    vec3 strewn = middle + away * vec3(1.8, 1.2, 1.0) * (3.0 + 5.0 * aRand.w);
    // the vortex: a tunnel up the middle of the screen, as wide at its foot as at its head (his call), inside the
    // Graphics section's rings; its particles rise as the page scrolls on and turn round its axis, faster nearer it,
    // most of them in five spiral arms on its wall, the rest strewn inside
    float up = fract(aRand.y + uCloud.z * (0.5 + 0.8 * aRand.w));
    bool onArm = aRand.x < 0.65;
    float across = onArm ? 0.6 + 0.4 * aRand.z : sqrt(aRand.z);
    float radius = uCloud.x * across;
    float angle = (onArm ? floor(fract(aRand.x * 7.13) * 5.0) * 1.25664 + (aRand.w - 0.5) * 0.55 : aRand.w * 6.28318) + up * 4.0 + uCloud.w * (1.0 + 1.5 * (1.0 - across));
    vec3 cloud = vec3(cos(angle) * radius, (up - 0.5) * uCloud.y, sin(angle) * radius);
    vec3 wind = vec3(aRand.xy * 4.0, uTime * 0.08);
    cloud += vec3(snoise(wind), snoise(wind + 7.0), snoise(wind + 13.0)) * 0.1 * uCloud.x;
    vec4 card = uTiles[int(aTile.x + 0.5)];
    vec3 onCard = vec3(card.x + aTile.y * card.z, card.y + aTile.z * card.w, 0.0);
    vec3 end = mix(onCard, onB, uMobile);
    // on the Music stage's floor (on its rim, in PLAY or, as the music plays, anywhere on it), where its camera
    // sees it, laid on the page's plane where its canvas is
    float along = aRand.z * 6.28318;
    float spread = aRand.x * 6.28318;
    vec3 floorAt = aMusic.w > 0.5 ? vec3(sin(along), 0.0, -cos(along)) * ${RIM.toFixed(2)} : mix(aMusic.xyz, vec3(cos(spread), 0.0, sin(spread)) * sqrt(aRand.y) * ${(RIM * 0.9).toFixed(3)}, uMorph);
    vec4 seen = uMusicView * vec4(floorAt, 1.0);
    vec3 onMusic = vec3(uStage.xy + (seen.xy / max(seen.w, 1e-3) * 0.5 + 0.5) * uStage.zw, 0.0);

    float a = own(uAssemble, aRand.x);
    float l = own(uLeave, aRand.y);
    float d = own(uLand, aRand.z);
    float o = own(uOnward, fract(aRand.x + aRand.w));
    vec3 p = mix(strewn, onA, a);
    p = mix(p, cloud, l);
    p = mix(p, end, d);
    p = mix(p, onMusic, o);
    float travel = sin(3.14159 * a) + sin(3.14159 * l) + sin(3.14159 * d) + sin(3.14159 * o);
    vec3 q = p * 0.3 + vec3(0.0, 0.0, uTime * 0.15);
    p += vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0)) * 0.45 * travel;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.05 + 0.06 * aRand.w) * (1.0 + 0.4 * aPhone.w * (1.0 - l)) * (1.0 - 0.45 * o) * uPixel / -mv.z;
    // seen where the phone or the cards don't show yet, the vortex fading at its ends
    float edge = smoothstep(0.0, 0.12, up) * (1.0 - smoothstep(0.88, 1.0, up));
    float atA = a * (1.0 - l);
    float atCloud = l * (1.0 - d);
    float flicker = 0.8 + 0.2 * sin(uTime * (1.5 + 2.0 * aRand.w) + aRand.x * 40.0);
    // (leaving the films or the phone they show again; on the floor, they give way to it)
    vAlpha = smoothstep(0.0, 0.3, uAssemble) * (1.0 - uSeenA * atA) * mix(1.0, edge, atCloud) * (1.0 - mix(uCards, uSeenB, uMobile) * d * (1.0 - o)) * (1.0 - uBuilt * o) * flicker * (0.7 + 0.5 * aRand.w);
    vColor = mix(mix(mix(vec3(0.42, 0.62, 1.0), vec3(0.72, 0.92, 1.0), aRand.w), vec3(0.95, 0.98, 1.0), 0.6 * aPhone.w * (1.0 - l)), vec3(0.3, 0.7, 1.0), 0.5 * o);
  }
`;
const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    a = a * a * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(min(vColor, vec3(1.5)), min(a, 1.5));
  }
`;

// Points over the phone's surfaces, as many on each part as its area takes (its display's marked), in the model's
// units; for the films' cards, which one and where on it (a third of them on its edges, so each reads crisp); and
// their places on the Music stage's floor.
function sample(root: THREE.Object3D, screen: THREE.Mesh | null, cards: number[]) {
  root.updateMatrixWorld(true);
  const meshes: { mesh: THREE.Mesh; area: number }[] = [];
  const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.getIndex();
    const count = index ? index.count : position.count;
    let area = 0;
    for (let i = 0; i < count; i += 3) {
      const [i0, i1, i2] = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
      a.fromBufferAttribute(position, i0).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(position, i1).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(position, i2).applyMatrix4(mesh.matrixWorld);
      area += b.sub(a).cross(c.sub(a)).length() / 2;
    }
    meshes.push({ mesh, area });
  });
  const total = meshes.reduce((sum, m) => sum + m.area, 0);
  const phone = new Float32Array(COUNT * 4);
  const point = new THREE.Vector3();
  let i = 0;
  for (const { mesh, area } of meshes) {
    const share = Math.round((area / total) * COUNT);
    const sampler = new MeshSurfaceSampler(mesh).build();
    for (let k = 0; k < share && i < COUNT; k++, i++) {
      sampler.sample(point);
      point.applyMatrix4(mesh.matrixWorld);
      phone.set([point.x, point.y, point.z, mesh === screen ? 1 : 0], i * 4);
    }
  }
  // (the shares, rounded, may leave a few over: copies of points already placed)
  for (const filled = Math.max(1, i); i < COUNT; i++) {
    const j = Math.floor(Math.random() * filled);
    phone.copyWithin(i * 4, j * 4, j * 4 + 4);
  }
  const rand = new Float32Array(COUNT * 4).map(() => Math.random());
  const tile = new Float32Array(COUNT * 3);
  const weight = cards.reduce((sum, w) => sum + w, 0) || 1;
  for (let k = 0; k < COUNT; k++) {
    let pick = Math.random() * weight;
    let which = 0;
    while (which < cards.length - 1 && pick > cards[which]) pick -= cards[which++];
    let [u, v] = [Math.random(), Math.random()];
    if (Math.random() < 0.33) {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) v = 0;
      else if (side === 1) v = 1;
      else if (side === 2) u = 0;
      else u = 1;
    }
    tile.set([which, u, v], k * 3);
  }
  // on the Music stage's floor: a fifth on its rim, the rest in PLAY
  const music = new Float32Array(COUNT * 4);
  for (let k = 0; k < COUNT; k++) music.set(Math.random() < 0.2 ? [0, 0, 0, 1] : [...inPlay(), 0], k * 4);
  const geometry = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    .setAttribute('aPhone', new THREE.BufferAttribute(phone, 4))
    .setAttribute('aRand', new THREE.BufferAttribute(rand, 4))
    .setAttribute('aTile', new THREE.BufferAttribute(tile, 3))
    .setAttribute('aMusic', new THREE.BufferAttribute(music, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  return geometry;
}

// The phone in silver, as the iPhone 17 Pro comes in it: a light aluminium unibody and white glass on its back (the
// model is the contact scene's, in Deep Blue). Its palette's blue swatches (4 texels wide, gltf-transform's) turn
// silver where they are rough and white where glossy (the back's glass), less metallic so they read light against
// the dark round them; the photo on its camera plateau turns grey. The textures are copies: the contact scene keeps
// its own.
const SILVER = [214, 216, 219];
const WHITE = [240, 240, 238];
function texels(texture: THREE.Texture) {
  const { width, height } = texture.image as { width: number; height: number };
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [width, height];
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(texture.image as CanvasImageSource, 0, 0);
  return { canvas, ctx, image: ctx.getImageData(0, 0, width, height) };
}
function copied(from: THREE.Texture, { canvas, ctx, image }: ReturnType<typeof texels>) {
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = from.flipY;
  texture.colorSpace = from.colorSpace;
  texture.magFilter = from.magFilter;
  texture.minFilter = from.minFilter;
  texture.wrapS = from.wrapS;
  texture.wrapT = from.wrapT;
  texture.generateMipmaps = from.generateMipmaps;
  texture.channel = from.channel;
  return texture;
}
function silvered(materials: THREE.MeshStandardMaterial[]) {
  const done = new Map<THREE.Texture, { map: THREE.Texture; mr: THREE.Texture | null }>();
  for (const material of materials) {
    const { map, metalnessMap } = material;
    if (!map?.image) continue;
    let paint = done.get(map);
    if (!paint) {
      const base = texels(map);
      const { data, width, height } = base.image;
      if (metalnessMap?.image && material.name.startsWith('Palette')) {
        const mr = texels(metalnessMap);
        for (let x0 = 0; x0 + 1 < width; x0 += 4) {
          const at = (Math.min(1, height - 1) * width + x0 + 1) * 4;
          if (!(data[at + 2] > data[at] + 15 && data[at] < 100)) continue; // the blue swatches only
          const glossy = mr.image.data[at + 1] < 90; // (green: roughness)
          for (let y = 0; y < height; y++) {
            for (let x = x0; x < Math.min(width, x0 + 4); x++) {
              const k = (y * width + x) * 4;
              data.set(glossy ? WHITE : SILVER, k);
              mr.image.data[k + 1] = glossy ? 60 : 110;
              mr.image.data[k + 2] = glossy ? 10 : 60;
            }
          }
        }
        paint = { map: copied(map, base), mr: copied(metalnessMap, mr) };
      } else {
        for (let k = 0; k < data.length; k += 4) data.fill(Math.min(255, (data[k] * 0.3 + data[k + 1] * 0.59 + data[k + 2] * 0.11) * 1.12 + 10), k, k + 3);
        paint = { map: copied(map, base), mr: null };
      }
      done.set(map, paint);
    }
    material.map = paint.map;
    if (paint.mr) material.metalnessMap = material.roughnessMap = paint.mr;
    material.envMapIntensity = 2.4; // (white reads grey in the scene's dim light)
  }
}

// ——— phones: the Video section's phone ———
// On its screen the films as a grid, like a profile's: three across, each 9:16, under its status bar, running up
// without end (the screen's shader scrolls it: GRID_ROW_S a row). Drawn as their pictures come in: rows only, so it
// tiles.
const GRID_WIDTH = 600;
const GRID_GAP = 4;
const GRID_CELL = [(GRID_WIDTH - GRID_GAP * 2) / 3, ((GRID_WIDTH - GRID_GAP * 2) / 3) * (16 / 9)];
const GRID_TOP = 0.075; // the status bar, in the screen's height
const GRID_ROW_S = 2.4;
function filmGrid(sources: string[]) {
  const rows = Math.ceil(sources.length / 3);
  const pitch = GRID_CELL[1] + GRID_GAP;
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [GRID_WIDTH, Math.round(rows * pitch)];
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false; // (as the screens are)
  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = false; // (it wraps in the shader: no seams)
  texture.minFilter = THREE.LinearFilter;
  const [w, h] = GRID_CELL;
  sources.forEach((src, i) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const [iw, ih] = [image.naturalWidth, image.naturalHeight];
      const scale = Math.max(w / iw, h / ih); // (cover: its middle)
      const [sw, sh] = [w / scale, h / scale];
      ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, (i % 3) * (w + GRID_GAP), Math.floor(i / 3) * pitch, w, h);
      texture.needsUpdate = true;
    };
    image.src = src;
  });
  return { texture, height: canvas.height, row: pitch / canvas.height };
}

// PLAY in particles, standing out in front of its screen: a red disc and PLAY's white triangle in it (in the disc's
// radii), and a ring round it that runs out as it beats. It gathers with the phone, beats, and, tapped, bursts at the
// camera as the camera flies in.
const PLAY_RADIUS = 0.2; // in the phone's units (its height 2): across, about half its screen
const PLAY_FRONT = 0.3; // how far in front of the screen it stands
const playVertex = /* glsl */ `
  attribute vec3 aShape; // where in the button, in its radii; z: 0 the disc, 1 the triangle, 2 the ring
  attribute vec4 aRand;
  uniform float uGather, uBurst, uShow, uTime, uPixel, uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float k = clamp((uGather - aRand.x * 0.45) / 0.55, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    float ring = step(1.5, aShape.z);
    float beat = 1.0 + 0.06 * sin(uTime * 3.927); // every 1.6 s
    float run = fract(uTime / 1.6 + aRand.y * 0.1); // the ring, running out
    vec2 at = aShape.xy * ${PLAY_RADIUS.toFixed(2)} * beat * (1.0 + 0.6 * run * ring);
    vec3 home = vec3(at, 0.01 * step(0.5, aShape.z) * (1.0 - ring));
    vec3 strewn = vec3(at * 3.0 + (aRand.zw - 0.5) * 2.4, (aRand.y - 0.5) * 1.6);
    vec3 p = mix(strewn, home, k);
    p.xy *= 1.0 + 2.0 * uBurst;
    p.z += uBurst * (0.6 + 1.8 * aRand.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.016 + 0.008 * aRand.w) * uScale * uPixel / -mv.z;
    vColor = aShape.z > 0.5 && aShape.z < 1.5 ? vec3(1.0) : vec3(1.0, 0.176, 0.333) * (0.9 + 0.25 * aRand.w);
    vAlpha = uShow * smoothstep(0.0, 0.6, k) * (1.0 - uBurst) * mix(1.0, 0.75 * (1.0 - run), ring);
  }
`;
const playFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = (1.0 - smoothstep(0.3, 0.5, length(gl_PointCoord - 0.5))) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;
function playShape() {
  const [disc, ring, triangle] = [1900, 220, 460];
  const count = disc + ring + triangle;
  const shape = new Float32Array(count * 3);
  let i = 0;
  for (let k = 0; k < disc; k++, i++) {
    const a = Math.random() * Math.PI * 2;
    const r = k < disc * 0.15 ? 1 : Math.sqrt(Math.random()); // (some on its edge, so it reads crisp)
    shape.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3);
  }
  for (let k = 0; k < ring; k++, i++) {
    const a = Math.random() * Math.PI * 2;
    shape.set([Math.cos(a), Math.sin(a), 2], i * 3);
  }
  // the triangle last, so it is drawn over the disc: pointing right, its middle a little right of the disc's
  const [p, q, t] = [[-0.3, 0.44], [-0.3, -0.44], [0.54, 0]];
  for (let k = 0; k < triangle; k++, i++) {
    let [a, b] = [Math.random(), Math.random()];
    if (a + b > 1) [a, b] = [1 - a, 1 - b];
    shape.set([p[0] + a * (q[0] - p[0]) + b * (t[0] - p[0]), p[1] + a * (q[1] - p[1]) + b * (t[1] - p[1]), 1], i * 3);
  }
  const geometry = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    .setAttribute('aShape', new THREE.BufferAttribute(shape, 3))
    .setAttribute('aRand', new THREE.BufferAttribute(new Float32Array(count * 4).map(() => Math.random()), 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  return geometry;
}

// The first films of the grid (the ones in view as it comes up), for the particles to build.
function firstFilms() {
  const grid = document.querySelector<HTMLElement>('[data-flow="films"]');
  if (!grid) return [];
  const top = grid.getBoundingClientRect().top;
  return [...grid.querySelectorAll<HTMLElement>('[data-film]')]
    .map((el) => ({ el, box: el.getBoundingClientRect() }))
    .filter(({ box }) => box.top - top < window.innerHeight * 0.95)
    .sort((x, y) => x.box.top - y.box.top || x.box.left - y.box.left)
    .slice(0, CARDS)
    .map(({ el }) => el);
}

function Scene() {
  const { gl, size, viewport } = useThree();
  const { scene } = useGLTF('/models/iphone.glb', false, true);
  const shots = useTexture(SCREENS);
  const group = useRef<THREE.Group>(null);
  const films = useMemo(() => (small ? [] : firstFilms()), []);

  const screen = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: screenVertex,
        fragmentShader: screenFragment,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          tFrom: { value: null },
          tTo: { value: null },
          uPush: { value: 1 },
          uSplit: { value: 0 },
          uOpacity: { value: 0 },
          uBox: { value: new THREE.Vector4(0, 0, 1, 1) },
          uGrid: { value: 0 },
          uScroll: { value: 0 },
          uGridScale: { value: 1 },
          uGridTop: { value: GRID_TOP },
        },
      }),
    [],
  );
  useEffect(() => () => screen.dispose(), [screen]);
  useEffect(() => {
    for (const texture of shots) {
      texture.flipY = false; // glTF's UV convention
      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
  }, [shots]);

  // the model, its display given the screens (across its face), scaled to HEIGHT and centred, facing the camera;
  // its other materials fade with it; the display's size, for flying into it
  const model = useMemo(() => {
    const root = scene.clone(true);
    const face = new THREE.Box3();
    const faded: THREE.Material[] = [];
    let display: THREE.Mesh | null = null;
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if ((mesh.material as THREE.Material).name.startsWith('screen')) {
        mesh.material = screen;
        mesh.geometry.computeBoundingBox();
        face.union(mesh.geometry.boundingBox!);
        display = mesh;
      } else {
        const material = (mesh.material as THREE.Material).clone();
        material.transparent = true;
        mesh.material = material;
        faded.push(material);
      }
    });
    silvered(faded.filter((m): m is THREE.MeshStandardMaterial => (m as THREE.MeshStandardMaterial).isMeshStandardMaterial === true));
    screen.uniforms.uBox.value.set(face.min.y, face.min.z, face.max.y - face.min.y, face.max.z - face.min.z);
    root.rotation.y = Math.PI / 2; // authored with the screen facing −X
    const box = new THREE.Box3().setFromObject(root);
    const s = HEIGHT / box.getSize(new THREE.Vector3()).y;
    root.scale.setScalar(s);
    root.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-s));
    root.updateMatrixWorld(true);
    const glass = display ? new THREE.Box3().setFromObject(display) : new THREE.Box3(new THREE.Vector3(-0.45, -0.95, 0), new THREE.Vector3(0.45, 0.95, 0));
    // black behind the display: what the model leaves see-through there (the Dynamic Island's glass) shows the
    // phone's inside, not the page, as it flies over the page
    const inside = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
    faded.push(inside);
    const backing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), inside);
    backing.scale.set(glass.max.x - glass.min.x, glass.max.y - glass.min.y, 1).multiplyScalar(0.96);
    backing.position.set((glass.min.x + glass.max.x) / 2, (glass.min.y + glass.max.y) / 2, glass.min.z - 0.01);
    backing.renderOrder = -1; // drawn before the glass in front of it (all of the phone is see-through, to fade)
    return { root, backing, faded, display: display as THREE.Mesh | null, glass: { centre: glass.getCenter(new THREE.Vector3()), size: glass.getSize(new THREE.Vector3()) } };
  }, [scene, screen]);

  const geometry = useMemo(() => sample(model.root, model.display, films.map((el) => el.offsetWidth * el.offsetHeight)), [model, films]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uPhoneA: { value: new THREE.Matrix4() },
          uPhoneB: { value: new THREE.Matrix4() },
          uAssemble: { value: 0 },
          uLeave: { value: 0 },
          uLand: { value: 0 },
          uTime: { value: 0 },
          uPixel: { value: 1 },
          uSeenA: { value: 0 },
          uSeenB: { value: 0 },
          uCards: { value: 0 },
          uMobile: { value: small ? 1 : 0 },
          uOnward: { value: 0 },
          uBuilt: { value: 0 },
          uMorph: { value: 0 },
          uMusicView: { value: new THREE.Matrix4() },
          uStage: { value: new THREE.Vector4(0, 0, 1, 1) },
          uCloud: { value: new THREE.Vector4() },
          uTiles: { value: Array.from({ length: CARDS }, () => new THREE.Vector4()) },
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  // phones: PLAY, in particles
  const play = useMemo(
    () =>
      small && !still
        ? {
            geometry: playShape(),
            material: new THREE.ShaderMaterial({
              vertexShader: playVertex,
              fragmentShader: playFragment,
              transparent: true,
              depthWrite: false,
              uniforms: { uGather: { value: 0 }, uBurst: { value: 0 }, uShow: { value: 0 }, uTime: { value: 0 }, uPixel: { value: 1 }, uScale: { value: 1 } },
            }),
          }
        : null,
    [],
  );
  useEffect(
    () => () => {
      play?.geometry.dispose();
      play?.material.dispose();
    },
    [play],
  );
  useEffect(() => {
    const pixel = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    material.uniforms.uPixel.value = pixel;
    if (play) play.material.uniforms.uPixel.value = pixel;
  }, [material, play, size.height, viewport.dpr]);

  // the pointer, for the phone's lean (the canvas lets it through to the page)
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  // phones: the films, as a grid, for the Video section's phone's screen
  const grid = useRef<ReturnType<typeof filmGrid> | null>(null);
  useEffect(() => () => grid.current?.texture.dispose(), []);
  const run = useRef({ time: 0, shown: -1, app: -1, push: 1, turn: 1, assemble: 0, leave: 0, land: 0, onward: 0, play: 0, flown: false, landed: false, cards: -1, ready: '' });
  const tools = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      full: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      v: new THREE.Vector3(),
      // the fly's two ends, taken apart
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      qa: new THREE.Quaternion(),
      qb: new THREE.Quaternion(),
      sa: new THREE.Vector3(),
      sb: new THREE.Vector3(),
      turn: new THREE.Matrix4(),
    }),
    [],
  );
  // the Music stage's camera, as it stands there
  const musicCamera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(MUSIC_FOV, 1, 0.1, 1000);
    placeCamera(camera);
    camera.updateMatrixWorld();
    return camera;
  }, []);
  const dots = useRef<THREE.Points>(null);
  const places = useRef<{ apps: HTMLElement | null; phone: HTMLElement | null; graphics: HTMLElement | null; films: HTMLElement | null; music: HTMLElement | null }>({ apps: null, phone: null, graphics: null, films: null, music: null });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const r = run.current;
    const u = material.uniforms;
    r.time += still ? 0 : dt;
    u.uTime.value = r.time;
    const found = places.current;
    found.apps ??= document.querySelector('[data-flow="apps"]');
    found.phone ??= document.querySelector('[data-flow="phone"]');
    found.films ??= document.querySelector('[data-flow="films"]');
    found.music ??= document.querySelector('[data-flow="music"]');
    if (!found.apps) return;

    // the page's plane: world units per pixel, and a point of the screen on it
    const canvas = gl.domElement.getBoundingClientRect();
    const perPx = TALL / Math.max(1, canvas.height);
    const onPlane = (x: number, y: number) => [(x - canvas.left - canvas.width / 2) * perPx, -(y - canvas.top - canvas.height / 2) * perPx] as const;
    const vh = window.innerHeight;

    // where the sections are: the phone gathers as its stage comes up to the middle, breaks up as it goes on up,
    // and the particles land as the films (or the Video section's phone) come up
    const a = found.apps.getBoundingClientRect();
    const assemble = clamp01((vh - a.top) / ((vh + a.height) / 2));
    const leave = clamp01((vh * 0.25 - (a.top + a.height / 2)) / (vh * 0.8));
    const end = small ? found.phone : found.films;
    const e = end?.getBoundingClientRect();
    const land = !e ? 0 : small ? clamp01((vh - e.top) / ((vh + e.height) / 2)) : clamp01((vh - e.top) / (vh * 0.75));
    const ease = still ? 1 : 1 - Math.exp(-dt * 5);
    r.assemble += (assemble - r.assemble) * ease;
    r.leave += (leave - r.leave) * ease;
    r.land += (land - r.land) * ease;
    u.uAssemble.value = r.assemble;
    u.uLeave.value = r.leave;
    u.uLand.value = r.land;
    // the vortex: inside the rings (their radius on the screen, a third of its width till they tell it), turning by
    // itself and further as the page scrolls on
    const rings = flow.rings.radius || canvas.width * 0.3;
    u.uCloud.value.set(rings * 0.62 * perPx, TALL * 1.15, (window.scrollY / vh) * 0.3, r.time * 0.5 + (window.scrollY / vh) * 1.6);

    // on to the Music section: the particles leave the phone (phones: once it is on its way up the screen) or the
    // films as its stage comes up, and build the stage's floor, done as it reaches the middle of the screen; then
    // the stage's own floor shows
    const m = found.music?.getBoundingClientRect();
    let onward = 0;
    if (m && m.height > 0) {
      if (small && e) {
        const from = e.top + e.height / 2;
        onward = clamp01((vh * 0.35 - from) / Math.max(vh * 0.3, m.top + m.height / 2 - from - vh * 0.2));
      } else onward = clamp01((vh - m.top) / (vh * 0.45 + m.height / 2));
      const [left, bottom] = onPlane(m.left, m.bottom);
      u.uStage.value.set(left, bottom, m.width * perPx, m.height * perPx);
      musicCamera.aspect = m.width / m.height;
      musicCamera.updateProjectionMatrix();
      u.uMusicView.value.multiplyMatrices(musicCamera.projectionMatrix, musicCamera.matrixWorldInverse).multiply(tools.turn.makeRotationY(-flow.music.turn));
      u.uMorph.value = flow.music.morph;
    }
    r.onward += (onward - r.onward) * ease;
    u.uOnward.value = r.onward;
    const built = still ? 1 : smooth(0.82, 1, r.onward);
    u.uBuilt.value = built;
    flow.music.built = built;

    // the phone: in the Apps section, or on phones in the Video section once the particles land there
    const atB = small && r.land > 0.5 && !!e;
    // (with reduced motion no particles: the phone just stands where it is)
    const seenA = still ? 1 : smooth(0.8, 1, r.assemble) * (1 - smooth(0, 0.15, r.leave));
    const seenB = small ? (still ? 1 : smooth(0.8, 1, r.land) * (1 - smooth(0, 0.15, r.onward))) : 0;
    u.uSeenA.value = seenA;
    u.uSeenB.value = seenB;
    const place = (box: DOMRect) => {
      const [x, y] = onPlane(box.left + box.width / 2, box.top + box.height / 2);
      return { x, y, s: (0.82 * box.height * perPx) / HEIGHT };
    };
    const sway = still ? 0 : Math.sin(r.time * 0.6) * 0.22;
    const pose = (at: { x: number; y: number; s: number }, turn: number, out: THREE.Matrix4) => {
      tools.e.set(still ? 0 : Math.sin(r.time * 0.45) * 0.05 - pointer.current.y * 0.12, sway + turn * Math.PI * 2 + pointer.current.x * 0.25, 0);
      tools.q.setFromEuler(tools.e);
      return out.compose(tools.p.set(at.x, at.y + (still ? 0 : Math.sin(r.time * 0.8) * 0.04 * at.s), 0), tools.q, tools.s.setScalar(at.s));
    };
    const turned = r.turn * r.turn * (3 - 2 * r.turn);
    pose(place(a), turned, u.uPhoneA.value);
    if (e && small) pose(place(e), 0, u.uPhoneB.value);

    // PLAY tapped (phones): the phone flies at the camera, face on, until its display fills the view, its picture
    // splitting apart; then the feed opens. The feed closed, it flies back from there.
    const now = performance.now();
    const back = flow.back > 0 ? clamp01((now - flow.back) / FLY_MS) : 0;
    const flying = small && !!e && (flow.fly > 0 || flow.back > 0);
    const fly = !flying ? 0 : flow.back > 0 ? 1 - back : clamp01((now - flow.fly) / FLY_MS);
    const g = group.current;
    if (g) {
      const shown = atB ? seenB : seenA;
      g.visible = shown > 0.01 || flying;
      if (atB) {
        tools.matrix.copy(u.uPhoneB.value);
        if (flying) {
          const k = fly * fly * (3 - 2 * fly);
          const s = (TALL / model.glass.size.y) * 1.02;
          tools.full.compose(tools.v.copy(model.glass.centre).multiplyScalar(-s), tools.q.identity(), tools.s.setScalar(s));
          // between its place and full screen, by its parts: move and scale, and turn face on
          const { from, to, qa, qb, sa, sb } = tools;
          tools.matrix.decompose(from, qa, sa);
          tools.full.decompose(to, qb, sb);
          tools.matrix.compose(from.lerp(to, k), qa.slerp(qb, k), sa.lerp(sb, k));
          screen.uniforms.uSplit.value = 0.06 * fly * fly;
          if (!flow.back && fly >= 1 && !r.flown) {
            r.flown = true;
            flow.flown?.();
          }
          if (flow.back && back >= 1 && !r.landed) {
            r.landed = true;
            flow.landed?.();
          }
        } else {
          screen.uniforms.uSplit.value = 0;
          r.flown = r.landed = false;
        }
        tools.matrix.decompose(g.position, g.quaternion, g.scale);
      } else {
        u.uPhoneA.value.decompose(g.position, g.quaternion, g.scale);
        screen.uniforms.uSplit.value = 0;
      }
      const opacity = flying ? 1 : shown;
      screen.uniforms.uOpacity.value = opacity;
      for (const m of model.faded) {
        m.opacity = opacity;
        m.depthWrite = opacity > 0.98;
      }
      // PLAY gathers with the phone in the Video section; tapped, it bursts at the camera; while the feed flies
      // back it is gone, and it gathers again once the phone is back
      if (play) {
        const pu = play.material.uniforms;
        const gather = atB && !flow.back ? smooth(0.55, 1, r.land) * (1 - smooth(0, 0.15, r.onward)) : 0;
        if (flow.back) r.play = 0;
        else if (!flow.fly) r.play += (gather - r.play) * Math.min(1, dt * 4);
        pu.uGather.value = r.play;
        pu.uBurst.value = flow.fly && !flow.back ? clamp01((now - flow.fly) / 420) : 0;
        pu.uShow.value = atB ? 1 : 0;
        pu.uTime.value = r.time;
        pu.uScale.value = g.scale.x;
      }
    }

    // what's on the display: the apps' screens in the Apps section, the films as a grid in the Video section, running
    // up as it plays on
    const s = screen.uniforms;
    if (atB) {
      if (!grid.current && flow.posters.length) grid.current = filmGrid(flow.posters);
      const films = grid.current;
      s.uGrid.value = films ? 1 : 0;
      if (films) {
        s.tFrom.value = s.tTo.value = films.texture;
        s.uGridScale.value = GRID_WIDTH / (model.glass.size.x / model.glass.size.y) / films.height; // (the screen's height, in the grid's)
        s.uScroll.value = (r.time / GRID_ROW_S) * films.row;
      }
      s.uPush.value = 1;
      r.shown = -1;
      r.app = -1;
    } else {
      s.uGrid.value = 0;
      const { shown, app } = flow.phone;
      if (r.shown < 0) {
        s.tFrom.value = s.tTo.value = shots[shown];
        Object.assign(r, { shown, app });
      } else if (app !== r.app) {
        r.app = app;
        r.turn = 0; // a new app: turn round, the screen swapped while it faces away
      } else if (shown !== r.shown && r.turn >= 1) {
        s.tFrom.value = shots[r.shown];
        s.tTo.value = shots[shown];
        r.shown = shown;
        r.push = still ? 1 : 0;
      }
      if (r.turn < 1) {
        r.turn = still ? 1 : Math.min(1, r.turn + dt / TURN_S);
        if (r.turn >= 0.5 && r.shown !== shown) {
          s.tFrom.value = s.tTo.value = shots[shown];
          r.shown = shown;
          r.push = 1;
        }
      }
      r.push = Math.min(1, r.push + dt / PUSH_S);
      s.uPush.value = r.push;
    }

    // desktops: the films' cards, where they are, and showing once the particles have built them
    if (!small && films.length) {
      films.forEach((el, k) => {
        const box = el.getBoundingClientRect();
        const [x, y] = onPlane(box.left, box.bottom);
        u.uTiles.value[k].set(x, y, box.width * perPx, box.height * perPx);
      });
      const cards = still ? 1 : smooth(0.82, 1, r.land);
      u.uCards.value = cards;
      if (Math.abs(cards - r.cards) > 0.01 || (cards === 1 && r.cards !== 1) || (cards === 0 && r.cards !== 0)) {
        r.cards = cards;
        for (const el of films) el.style.opacity = cards.toFixed(3);
      }
    }
    // phones: PLAY can be tapped once it has gathered there (the section's button, drawn here: data-drawn)
    if (small && e && end) {
      const ready = (play ? r.play > 0.8 : seenB > 0.9) ? '1' : '0';
      if (ready !== r.ready) end.dataset.ready = r.ready = ready;
      if (play && end.dataset.drawn !== '1') end.dataset.drawn = '1';
    }
    // none of the particles shows while they all rest in what they built (the films or the phone, the floor)
    if (dots.current) dots.current.visible = !(r.onward > 0.999 && built > 0.999) && !(r.onward < 0.001 && r.land > 0.999 && (small ? seenB : u.uCards.value) > 0.999);
  });

  // off the page: the films' cards show again
  useEffect(
    () => () => {
      for (const el of films) el.style.opacity = '';
    },
    [films],
  );

  return (
    <>
      <group ref={group} visible={false}>
        <primitive object={model.root} />
        <primitive object={model.backing} />
        {play && (
          <points
            geometry={play.geometry}
            material={play.material}
            position={[model.glass.centre.x, model.glass.centre.y, model.glass.centre.z + model.glass.size.z / 2 + PLAY_FRONT]}
            frustumCulled={false}
            renderOrder={2}
          />
        )}
      </group>
      {!still && <points ref={dots} geometry={geometry} material={material} frustumCulled={false} />}
    </>
  );
}

export default function FlowScene({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, DISTANCE], fov: FOV, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.35} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 3, 2]} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#cfe0ff" position={[-4, 0.5, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffd9b3" position={[4, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>
      <Scene />
    </Canvas>
  );
}
