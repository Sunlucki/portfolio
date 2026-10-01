import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import printsJson from '../prints.json';

/**
 * The Graphics covers that are live 3D scenes: Mind Logistic's site's own (Bogdan's, ~/Developer/MIND LOGISTIC:
 * LowPolyBottle3D.tsx and Poucher3DViewer.tsx), its Elixir bottle turning through its five labels over a galaxy and
 * its Poucher can through its four in a lightning storm, ported as they are. Their covers are stills of them (no 3D in
 * the rows, Bogdan's call); a cover's project opens on its scene. One WebGL renderer, off the page, draws a scene once
 * a frame into the canvases that show it, only while one is on screen (the open project's top first, if there are
 * others). The models and pictures: scripts/prepare-scenes.mjs, prepare-media.py scenes. And the printed things of the
 * other projects (business cards, flyers, a voucher, a guide: `print:<project>`, below), to be turned over and looked at.
 */
export type SceneName = 'elixir' | 'poucher' | `print:${string}`;
type View = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; name: SceneName; top: boolean; shown: boolean; drawn: boolean; onReady?: () => void };
type Live = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clear: number;
  toneMapping: THREE.ToneMapping;
  exposure?: number;
  step: (dt: number) => void;
  size?: (w: number, h: number) => void;
  prepare?: (gl: THREE.WebGLRenderer) => void; // once, before it is first drawn
};

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX = 1600; // a canvas's widest, in pixels
const views = new Set<View>();
const live = new Map<SceneName, Live | null>(); // null while it loads
const prepared = new Set<SceneName>();
const picks = new Map<SceneName, number>(); // the thing a printed things' scene shows
let renderer: THREE.WebGLRenderer | null | undefined;
let frame = 0;
let last = 0;

const watch =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) => {
          for (const entry of entries) for (const view of views) if (view.canvas === entry.target) view.shown = entry.isIntersecting;
          wake();
        },
        { rootMargin: '80px' },
      );

/** Draws scene `name` into `canvas` while it is on screen; `top`: the open project's, turned by dragging. */
export function show(canvas: HTMLCanvasElement, name: SceneName, { top = false, onReady }: { top?: boolean; onReady?: () => void } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const view: View = { canvas, ctx, name, top, shown: !watch, drawn: false, onReady };
  views.add(view);
  watch?.observe(canvas);
  if (!live.has(name)) {
    live.set(name, null);
    (name === 'elixir' ? elixir() : name === 'poucher' ? poucher() : sheets(name)).then((scene) => {
      live.set(name, scene);
      wake();
    }, () => {}); // (the cover keeps its still)
  }
  const letGo = top ? turnOf(name).hold(canvas) : () => {};
  wake();
  return () => {
    views.delete(view);
    watch?.unobserve(canvas);
    letGo();
  };
}

/** Shows thing `index` of a printed things' scene (it turns over to it). */
export function pick(name: SceneName, index: number) {
  picks.set(name, index);
  for (const view of views) if (view.name === name) view.drawn = false; // (drawn again, if motion is reduced)
  wake();
}

function wake() {
  if (!frame && typeof window !== 'undefined') frame = requestAnimationFrame(tick);
}

function context() {
  if (renderer !== undefined) return renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); // (the canvases' own pixels)
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMappingExposure = 1.2;
  } catch {
    renderer = null;
  }
  return renderer;
}

// a canvas's pixels: its size on the page, at the screen's density (twice at most, MAX wide at most)
function fit(canvas: HTMLCanvasElement) {
  const density = Math.min(window.devicePixelRatio || 1, 2, MAX / Math.max(1, canvas.clientWidth));
  const w = Math.max(1, Math.round(canvas.clientWidth * density));
  const h = Math.max(1, Math.round(canvas.clientHeight * density));
  if (canvas.width !== w || canvas.height !== h) Object.assign(canvas, { width: w, height: h });
  return [w, h] as const;
}

function tick(now: number) {
  frame = 0;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  const shown = [...views].filter((view) => view.shown && view.canvas.isConnected && view.canvas.clientWidth > 0);
  const tops = shown.filter((view) => view.top);
  const drawing = tops.length ? tops : shown;
  let going = false;
  for (const name of new Set(drawing.map((view) => view.name))) {
    const scene = live.get(name);
    const mine = drawing.filter((view) => view.name === name && !(still && view.drawn));
    if (!scene || !mine.length) continue;
    const gl = context();
    if (!gl) return;
    going = true;
    if (!prepared.has(name)) {
      prepared.add(name);
      scene.prepare?.(gl);
    }
    scene.step(still ? 0 : dt);
    gl.toneMapping = scene.toneMapping;
    gl.toneMappingExposure = scene.exposure ?? 1;
    gl.setClearColor(scene.clear, 1);
    let drawn = '';
    for (const view of mine) {
      const [w, h] = fit(view.canvas);
      if (drawn !== `${w}x${h}`) {
        // once for each size its canvases have (its covers share one)
        const size = gl.getSize(new THREE.Vector2());
        if (size.x !== w || size.y !== h) gl.setSize(w, h, false);
        scene.camera.aspect = w / h;
        scene.camera.updateProjectionMatrix();
        scene.size?.(w, h);
        gl.render(scene.scene, scene.camera);
        drawn = `${w}x${h}`;
      }
      view.ctx.drawImage(gl.domElement, 0, 0, w, h);
      if (!view.drawn) {
        view.drawn = true;
        view.onReady?.();
      }
    }
  }
  if (going && !still) wake();
  else last = 0;
}

// Left alone, a model sweeps back and forth through 45° either way; dragged, it follows the finger (the sweep held),
// and three seconds after it lets go eases back to where the sweep left off, which then goes on: no jump either way.
class Turn {
  private sweep = 0;
  private x = 0;
  private y = 0;
  private held = false;
  private since: number | null = null;
  update(dt: number) {
    if (this.held) {
      // (the sweep waits)
    } else if (this.since !== null) {
      this.since += dt;
      if (this.since >= 3) {
        this.x += (0 - this.x) * 0.05;
        this.y += (0 - this.y) * 0.05;
        if (Math.abs(this.x) < 1e-3 && Math.abs(this.y) < 1e-3) {
          this.x = this.y = 0;
          this.since = null;
        }
      }
    } else this.sweep += dt;
    return { x: this.x, y: Math.sin(this.sweep * 0.55) * (Math.PI / 4) + this.y };
  }
  hold(el: HTMLElement) {
    let pointer: number | null = null;
    let [lastX, lastY] = [0, 0];
    el.style.touchAction = 'pan-y'; // (the page still scrolls up and down through it)
    const down = (e: PointerEvent) => {
      if (pointer !== null) return;
      pointer = e.pointerId;
      this.held = true;
      this.since = null;
      [lastX, lastY] = [e.clientX, e.clientY];
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const r = el.getBoundingClientRect();
      this.y += ((e.clientX - lastX) / r.width) * Math.PI;
      this.x = Math.max(-0.6, Math.min(0.6, this.x + ((e.clientY - lastY) / r.height) * (Math.PI / 2)));
      [lastX, lastY] = [e.clientX, e.clientY];
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      this.held = false;
      this.since = 0;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      this.held = false;
    };
  }
}
// A printed thing: it shows its front, and every few seconds turns over to its back and on round again; dragged
// sideways it turns with the finger (tilting a little with it), and let go it settles on the nearer side. `round()`
// turns it on past the next edge-on, where a thing can be swapped unseen, and `swapped()` brings the next one on
// round from there to its front, never past its back. `auto` off, it stays on the side it is on; `sway` on (a thing
// with no back), it only turns a little either way, back to its front; a touch that doesn't drag counts in `taps`.
const SWAY = 0.4; // how far a thing with no back turns
class Flip {
  private angle = 0;
  private target = 0;
  private tilt = 0;
  private held = false;
  private since = 0;
  auto = true;
  sway = false;
  taps = 0;
  get holding() {
    return this.held;
  }
  update(dt: number) {
    if (!this.held) {
      this.since += dt;
      if (this.since > 4.5 && this.auto && !this.sway) {
        this.target += Math.PI;
        this.since = 0;
      }
      const k = 1 - Math.exp(-dt * 2.6);
      this.angle += (this.target - this.angle) * k;
      this.tilt += (0 - this.tilt) * k;
    }
    return { x: this.tilt, y: this.angle };
  }
  round() {
    this.target = (Math.floor(this.angle / Math.PI - 0.5) + 2) * Math.PI;
    this.since = -1; // (and a while on its front then)
  }
  // swapped as it shows edge-on (its angle and `offset`, the scene's own sway on it): on from that edge's other side,
  // so the front comes round, to the front
  swapped(offset: number) {
    const shown = this.angle + offset;
    const edge = (Math.round(shown / Math.PI - 0.5) + 0.5) * Math.PI;
    let to = edge + Math.abs(shown - edge);
    if (Math.cos(to) < 0) to -= Math.PI;
    this.angle = to - offset;
    this.target = Math.ceil(this.angle / (2 * Math.PI)) * 2 * Math.PI;
  }
  hold(el: HTMLElement) {
    let pointer: number | null = null;
    let [lastX, lastY] = [0, 0];
    let start = { x: 0, y: 0, t: 0 };
    el.style.touchAction = 'pan-y';
    const down = (e: PointerEvent) => {
      if (pointer !== null) return;
      pointer = e.pointerId;
      this.held = true;
      [lastX, lastY] = [e.clientX, e.clientY];
      start = { x: e.clientX, y: e.clientY, t: performance.now() };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const r = el.getBoundingClientRect();
      this.angle += ((e.clientX - lastX) / r.width) * Math.PI * 1.4;
      if (this.sway) {
        const front = Math.round(this.angle / (2 * Math.PI)) * 2 * Math.PI;
        this.angle = Math.max(front - SWAY, Math.min(front + SWAY, this.angle));
      }
      this.tilt = Math.max(-0.5, Math.min(0.5, this.tilt + ((e.clientY - lastY) / r.height) * (Math.PI / 2)));
      this.target = this.angle;
      [lastX, lastY] = [e.clientX, e.clientY];
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      this.held = false;
      this.target = this.sway ? Math.round(this.angle / (2 * Math.PI)) * 2 * Math.PI : Math.round(this.angle / Math.PI) * Math.PI;
      this.since = 0;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8 && performance.now() - start.t < 500) this.taps++;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      this.held = false;
    };
  }
}
const turns = new Map<SceneName, Turn | Flip>();
const turnOf = <T extends Turn | Flip>(name: SceneName) => {
  if (!turns.has(name)) turns.set(name, name.startsWith('print:') ? new Flip() : new Turn());
  return turns.get(name) as T;
};

// A model of scripts/prepare-scenes.mjs: its meshes, in order, each with its geometry
async function model(url: string) {
  const buffer = await (await fetch(url)).arrayBuffer();
  const length = new DataView(buffer).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, length))) as {
    box: number[];
    meshes: { name: string; vertices: number; triangles: number; uv?: number[] }[];
  };
  const low = head.box.slice(0, 3);
  const span = [0, 1, 2].map((k) => head.box[k + 3] - head.box[k]);
  let at = 4 + length;
  const next = (bytes: number) => {
    at += (4 - (at % 4)) % 4;
    const from = at;
    at += bytes;
    return from;
  };
  return head.meshes.map((mesh) => {
    const q = new Uint16Array(buffer, next(mesh.vertices * 6), mesh.vertices * 3);
    const position = Float32Array.from(q, (v, i) => low[i % 3] + (v / 65535) * span[i % 3]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buffer, next(mesh.vertices * 3), mesh.vertices * 3), 3, true));
    if (mesh.uv) {
      const [u0, v0, u1, v1] = mesh.uv;
      const t = new Uint16Array(buffer, next(mesh.vertices * 4), mesh.vertices * 2);
      geometry.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from(t, (v, i) => (i % 2 ? v0 + (v / 65535) * (v1 - v0) : u0 + (v / 65535) * (u1 - u0))), 2));
    }
    const wide = mesh.vertices > 65535;
    const index = wide ? new Uint32Array(buffer, next(mesh.triangles * 12), mesh.triangles * 3) : new Uint16Array(buffer, next(mesh.triangles * 6), mesh.triangles * 3);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));
    return { name: mesh.name, geometry };
  });
}

// a picture for a texture, and when it has come (its .image is there from then on)
const loader = new THREE.TextureLoader();
const picture = (url: string, wrap = false) => {
  let texture!: THREE.Texture;
  const ready = new Promise((done) => (texture = loader.load(url, done, undefined, done)));
  texture.colorSpace = THREE.SRGBColorSpace;
  if (wrap) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return Object.assign(texture, { ready });
};

// The bottle's hop, pop and spring tilt when it changes flavour (0.4 s), its label swapped at the top of it
const HOP = 0.4;
const hop = (k: number) => ({ y: Math.sin(k * Math.PI) * 0.35, scale: 1 + Math.sin(k * Math.PI) * 0.15, tilt: Math.sin(k * Math.PI * 2) * 0.18 });

// The Elixir bottle (LowPolyBottle3D.tsx): amber body, its label (one of five, every five seconds), a violet accent;
// over a galaxy that fades out from its middle and turns slowly, two layers of motes in the flavour's colour, and the
// flavour's fruits round it (FRUITS below).
const ELIXIRS = ['#a855f7', '#fc5000', '#ef4444', '#ff8a4c', '#38bdf8']; // Blueberry Cookies, Lemon Haze, Strawberry OG, Zen, Zkittlez OG

// Each flavour's fruits, Mind Logistic's own (FlavourParticles.tsx on its site, public/scenes/fruit-*.webp): nine round
// the bottle and behind it, bobbing; on a change of flavour the old ones fall in to the bottle and the new ones fly out
// of it. Zen has none there either. Laid out the same way every time for a flavour (seeded by its name).
const FRUITS: [string, number][] = [['blueberry', 3], ['lemon', 3], ['strawberry', 4], ['', 0], ['zkittlez', 5]];
const FRUIT = { count: 9, fly: 0.7, fade: 0.45 };
const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

async function elixir(): Promise<Live> {
  const labels = ELIXIRS.map((_, i) => picture(`/scenes/elixir-${i}.webp`, true));
  const galaxyImage = new Image();
  galaxyImage.src = '/scenes/galaxy.webp';
  const [parts] = await Promise.all([model('/scenes/elixir.bin'), labels[0].ready, galaxyImage.decode()]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 7);
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const main = new THREE.DirectionalLight(0xffffff, 2.5);
  main.position.set(5, 8, 5);
  main.castShadow = true;
  scene.add(main);
  for (const [color, power, reach, x, y, z] of [
    [0xfc5000, 3.5, 20, -4, -2, 4],
    [0x5e38f5, 4.0, 20, 4, 5, -3],
    [0xffffff, 2.0, 15, 0, 6, 2],
  ]) {
    const light = new THREE.PointLight(color, power, reach);
    light.position.set(x, y, z);
    scene.add(light);
  }

  // the galaxy, solid in the middle and gone well before the plane's edge
  const size = 1024;
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
  const g = canvas.getContext('2d')!;
  const cover = Math.max(size / galaxyImage.width, size / galaxyImage.height);
  g.drawImage(galaxyImage, (size - galaxyImage.width * cover) / 2, (size - galaxyImage.height * cover) / 2, galaxyImage.width * cover, galaxyImage.height * cover);
  const fade = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, a] of [[0, 1], [0.18, 0.95], [0.34, 0.6], [0.46, 0.22], [0.55, 0]]) fade.addColorStop(at, `rgba(0,0,0,${a})`);
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = fade;
  g.fillRect(0, 0, size, size);
  const galaxyTexture = new THREE.CanvasTexture(canvas);
  galaxyTexture.colorSpace = THREE.SRGBColorSpace;
  const galaxy = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: galaxyTexture, transparent: true, depthWrite: false }));
  galaxy.position.set(0, 0, -6.5);
  scene.add(galaxy);

  // the motes: a soft round sprite, near ones bigger and quicker
  const dot = Object.assign(document.createElement('canvas'), { width: 64, height: 64 });
  const d = dot.getContext('2d')!;
  const glow = d.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [at, a] of [[0, 1], [0.35, 0.75], [0.7, 0.25], [1, 0]]) glow.addColorStop(at, `rgba(255,255,255,${a})`);
  d.fillStyle = glow;
  d.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(dot);
  const motes = (count: number, spread: number, near: number, deep: number, size: number, opacity: number) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) positions.set([(Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, near - Math.random() * deep], i * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ size, map: sprite, color: ELIXIRS[0], transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const group = new THREE.Group().add(new THREE.Points(geometry, material));
    scene.add(group);
    return { group, material };
  };
  const near = motes(160, 8.5, -0.6, 1.2, 0.3, 0.9);
  const far = motes(130, 10, -2, 3.5, 0.16, 0.75);
  const tint = new THREE.Color(ELIXIRS[0]);
  const tinted = new THREE.Color(ELIXIRS[0]);

  // the bottle: its meshes in turn amber body, label, violet accent
  const label = new THREE.MeshStandardMaterial({ map: labels[0], roughness: 0.25, metalness: 0.1 });
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xffa41f, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }),
    label,
    new THREE.MeshStandardMaterial({ color: 0x5e38f5, roughness: 0.25, metalness: 0.4 }),
  ];
  const bottle = new THREE.Group();
  parts.forEach(({ geometry }, i) => {
    const mesh = new THREE.Mesh(geometry, materials[i % 3]);
    mesh.castShadow = mesh.receiveShadow = true;
    bottle.add(mesh);
  });
  const box = new THREE.Box3().setFromObject(bottle);
  const extent = box.getSize(new THREE.Vector3());
  bottle.position.sub(box.getCenter(new THREE.Vector3())); // (as the site places it)
  bottle.rotation.y = Math.PI;
  bottle.scale.setScalar(4 / Math.max(extent.x, extent.y, extent.z));
  const pivot = new THREE.Group().add(bottle);
  scene.add(pivot);

  // the fruits: a set for a flavour, made when it first shows
  type Fruit = { sprite: THREE.Sprite; x: number; y: number; size: number; turn: number; delay: number; drift: number; period: number };
  const fruitSets = new Map<number, { group: THREE.Group; fruits: Fruit[] } | null>();
  const fruitsOf = (flavour: number) => {
    if (!fruitSets.has(flavour)) {
      const [name, pictures] = FRUITS[flavour];
      if (!pictures) fruitSets.set(flavour, null);
      else {
        const rand = seeded(name);
        const group = new THREE.Group();
        const fruits = Array.from({ length: FRUIT.count }, (_, i): Fruit => {
          // round the bottle by angle, the ring's radius jittered, bigger ones nearer
          const angle = ((i + rand() * 0.6) / FRUIT.count) * Math.PI * 2;
          const radius = 2.3 + rand() * 1.4;
          const size = 0.55 + rand() * 0.75;
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: picture(`/scenes/fruit-${name}-${(i % pictures) + 1}.webp`), transparent: true, depthWrite: false, opacity: 0 }));
          sprite.position.z = -1.5 + ((size - 0.55) / 0.75) * 0.9;
          group.add(sprite);
          return { sprite, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.85, size, turn: rand() * Math.PI * 2, delay: rand() * 0.25, drift: 0.05 + rand() * 0.08, period: 4 + rand() * 5 };
        });
        scene.add(group);
        fruitSets.set(flavour, { group, fruits });
      }
    }
    return fruitSets.get(flavour)!;
  };
  const fruitIn = { flavour: 0, at: -10 }; // the first ones already out (as on the cover's still)
  let fruitOut: { flavour: number; at: number } | null = null;
  fruitsOf(0);
  const placeFruits = (flavour: number, at: number, coming: boolean) => {
    const set = fruitsOf(flavour);
    if (!set) return true;
    let done = true;
    for (const f of set.fruits) {
      const k = Math.min(1, Math.max(0, (time - at - f.delay) / FRUIT.fly));
      const e = 1 - (1 - k) ** 4;
      const out = coming ? e : 1 - e; // (how far out from the bottle)
      const image = f.sprite.material.map?.image as { width: number; height: number } | undefined;
      const aspect = image ? image.width / image.height : 1;
      const scale = f.size * (0.2 + 0.8 * out);
      f.sprite.scale.set(scale * aspect, scale, 1);
      f.sprite.position.x = f.x * out;
      f.sprite.position.y = f.y * out + Math.sin(((time + f.delay * 7) / f.period) * Math.PI * 2) * f.drift;
      f.sprite.material.rotation = f.turn * (coming ? e : 1);
      f.sprite.material.opacity = coming ? Math.min(1, Math.max(0, (time - at - f.delay) / FRUIT.fade)) * (image ? 1 : 0) : 1 - k;
      if (k < 1) done = false;
    }
    set.group.visible = coming || !done;
    return done;
  };

  let time = 0;
  let shown = 0; // the label on
  let wanted = 0;
  let changing: number | null = null; // when its change began
  let swapped = false;
  return {
    scene,
    camera,
    clear: 0x070609,
    toneMapping: THREE.NoToneMapping,
    step(dt) {
      time += dt;
      // a flavour every five seconds (only to one whose label has come)
      const due = Math.floor(time / 5) % ELIXIRS.length;
      if (due !== wanted && labels[due].image) wanted = due;
      galaxy.rotation.z = time * 0.04;
      far.group.rotation.z = time * 0.1;
      far.group.rotation.y = Math.cos(time * 0.15) * 0.12;
      near.group.rotation.z = time * 0.22;
      near.group.rotation.y = Math.sin(time * 0.3) * 0.2;
      tinted.lerp(tint, 0.06);
      near.material.color.copy(tinted);
      far.material.color.copy(tinted);
      if (changing === null && wanted !== shown) {
        changing = time;
        swapped = false;
      }
      let { y, scale, tilt } = hop(0);
      if (changing !== null) {
        const k = Math.min((time - changing) / HOP, 1);
        ({ y, scale, tilt } = hop(k));
        if (k >= 0.5 && !swapped) {
          shown = wanted;
          label.map = labels[shown];
          label.needsUpdate = true;
          tint.set(ELIXIRS[shown]);
          fruitOut = { ...fruitIn };
          Object.assign(fruitIn, { flavour: shown, at: time });
          swapped = true;
        }
        if (k >= 1) changing = null;
      }
      pivot.position.y = Math.sin(time * 1.5) * 0.12 + y;
      pivot.scale.setScalar(scale);
      placeFruits(fruitIn.flavour, fruitIn.at, true);
      if (fruitOut && placeFruits(fruitOut.flavour, fruitOut.at, false)) fruitOut = null;
      const turn = turnOf<Turn>('elixir').update(dt);
      pivot.rotation.set(turn.x, turn.y, tilt);
    },
  };
}

// The Poucher can (Poucher3DViewer.tsx): matte black, its lid, side and bottom labels one of four flavours (every
// five seconds, a bolt crawling over them burning the next in), leaning back, over a lightning storm in the
// flavour's hue.
const POUCHERS = [
  { hue: 275, badge: 0xaa39fb }, // Blueberry
  { hue: 337, badge: 0xdb1f66 }, // Sweet Raspberry
  { hue: 300, badge: 0xdf1ade }, // Bubble Gum
  { hue: 85, badge: 0xa0f12b }, // Citrus
];
const NOISE = /* glsl */ `
float mlHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float mlNoise(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float a = mlHash(ip);
  float b = mlHash(ip + vec2(1.0, 0.0));
  float c = mlHash(ip + vec2(0.0, 1.0));
  float d = mlHash(ip + vec2(1.0, 1.0));
  vec2 t = smoothstep(0.0, 1.0, fp);
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}
`;
// the bolt over the labels, as raw light after everything else
const ARC_HEAD = /* glsl */ `
uniform float uArc;
uniform float uTime;
uniform vec3 uArcColor;
${NOISE}
float mlFbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * mlNoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;
const ARC_BODY = /* glsl */ `
if (uArc >= 0.0) {
  float envelope = sin(uArc * 3.1415926);
  float sweep = mix(-0.35, 1.35, uArc);
  float jag = (mlFbm(vec2(vMapUv.x * 7.0, uTime * 9.0)) - 0.5) * 0.30;
  float dist = abs(vMapUv.y - sweep + jag);
  float glow = smoothstep(0.38, 0.0, dist);
  float core = smoothstep(0.05, 0.0, dist);
  float branchJag = (mlFbm(vec2(vMapUv.x * 13.0 + 5.0, uTime * 12.0)) - 0.5) * 0.44;
  float branch = smoothstep(0.14, 0.0, abs(vMapUv.y - sweep + branchJag));
  vec3 bolt = uArcColor * (glow * 1.25 + branch * 0.8) + vec3(1.0) * core;
  gl_FragColor.rgb += bolt * envelope * 1.7 + uArcColor * envelope * 0.22;
}
`;
// the storm (Lightning.tsx), drawn over the background: screen-blended at 0.8 there, added here
const STORM = /* glsl */ `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHue;
${NOISE.replace(/mlHash/g, 'hash12').replace(/mlNoise/g, 'noise')}
vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}
float hash11(float p) {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
mat2 rotate2d(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat2(c, -s, s, c);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 10; ++i) {
    value += amplitude * noise(p);
    p *= rotate2d(0.45);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv = 2.0 * uv - 1.0;
  uv.x *= iResolution.x / iResolution.y;
  uv += 2.0 * fbm(uv * 1.4 + 0.8 * iTime * 1.2) - 1.0;
  float dist = abs(uv.x);
  vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
  vec3 col = baseColor * (mix(0.0, 0.07, hash11(iTime * 1.2)) / dist) * 2.2;
  gl_FragColor = vec4(min(col, vec3(1.0)) * 0.8, 1.0);
}
`;

async function poucher(): Promise<Live> {
  const labels = POUCHERS.map((_, i) => ({ top: picture(`/scenes/poucher-${i}-top.webp`), side: picture(`/scenes/poucher-${i}-side.webp`), bottom: picture(`/scenes/poucher-${i}-bottom.webp`) }));
  const [parts] = await Promise.all([model('/scenes/poucher.bin'), ...Object.values(labels[0]).map((label) => label.ready)]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(0, 0, 30);
  const storm = new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: STORM,
    uniforms: { iResolution: { value: new THREE.Vector2(1, 1) }, iTime: { value: 0 }, uHue: { value: POUCHERS[0].hue } },
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), storm);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const main = new THREE.DirectionalLight(0xffffff, 2.5);
  main.position.set(10, 20, 15);
  scene.add(main);
  const fill = new THREE.PointLight(POUCHERS[0].badge, 4.5, 30);
  fill.position.set(-15, 5, 15);
  scene.add(fill);
  for (const [color, power, reach, x, y, z] of [
    [0xa855f7, 3.5, 30, 15, -10, -10],
    [0xffffff, 2.0, 20, 0, 20, 5],
  ]) {
    const light = new THREE.PointLight(color, power, reach);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const arcs: Record<string, THREE.IUniform>[] = [];
  const labelled = (map: THREE.Texture, roughness: number) => {
    const material = new THREE.MeshStandardMaterial({ map, roughness, metalness: 0.1, side: THREE.DoubleSide });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, { uArc: { value: -1 }, uTime: { value: 0 }, uArcColor: { value: new THREE.Color(0xffffff) } });
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `${ARC_HEAD}\nvoid main() {`).replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${ARC_BODY}`);
      arcs.push(shader.uniforms);
    };
    return material;
  };
  const on = { top: labelled(labels[0].top, 0.3), side: labelled(labels[0].side, 0.35), bottom: labelled(labels[0].bottom, 0.3) };
  const body = new THREE.MeshStandardMaterial({ color: 0x121215, roughness: 0.85, metalness: 0.05 });
  const can = new THREE.Group();
  for (const { name, geometry } of parts) {
    const kind = /label_top/i.test(name) ? 'top' : /label_side/i.test(name) ? 'side' : /label_bottom/i.test(name) ? 'bottom' : null;
    const mesh = new THREE.Mesh(geometry, kind ? on[kind] : body);
    if (kind === 'top') mesh.position.z += 0.0002; // (the lid pokes just over the label)
    can.add(mesh);
  }
  const box = new THREE.Box3().setFromObject(can);
  const extent = box.getSize(new THREE.Vector3());
  can.position.sub(box.getCenter(new THREE.Vector3()));
  const wrapper = new THREE.Group().add(can);
  wrapper.scale.setScalar(16.8 / Math.max(extent.x, extent.y, extent.z));
  wrapper.rotation.set(-Math.PI / 9, 0, -0.1); // leaning back, so the lid shows
  const pivot = new THREE.Group().add(wrapper);
  scene.add(pivot);

  let time = 0;
  let shown = 0;
  let changing: number | null = null;
  let swapped = false;
  return {
    scene,
    camera,
    clear: 0x070607,
    toneMapping: THREE.ACESFilmicToneMapping,
    size: (w, h) => storm.uniforms.iResolution.value.set(w, h),
    step(dt) {
      time += dt;
      const due = Math.floor(time / 5) % POUCHERS.length;
      if (changing === null && due !== shown && labels[due].top.image && labels[due].side.image && labels[due].bottom.image) {
        changing = time;
        swapped = false;
        for (const u of arcs) (u.uArcColor.value as THREE.Color).setHex(POUCHERS[due].badge);
      }
      let { y, scale, tilt } = hop(0);
      let arc = -1;
      if (changing !== null) {
        const k = Math.min((time - changing) / HOP, 1);
        ({ y, scale, tilt } = hop(k));
        if (k >= 0.5 && !swapped) {
          shown = due;
          for (const part of ['top', 'side', 'bottom'] as const) {
            on[part].map = labels[shown][part];
            on[part].needsUpdate = true;
          }
          fill.color.setHex(POUCHERS[shown].badge);
          storm.uniforms.uHue.value = POUCHERS[shown].hue;
          swapped = true;
        }
        if (k >= 1) changing = null;
        else arc = k;
      }
      for (const u of arcs) {
        u.uArc.value = arc;
        u.uTime.value = time;
      }
      storm.uniforms.iTime.value = time;
      pivot.position.y = Math.sin(time * 1.5) * 0.12 + y;
      pivot.scale.setScalar(scale);
      const turn = turnOf<Turn>('poucher').update(dt);
      pivot.rotation.set(turn.x, turn.y, tilt);
    },
  };
}

// The printed things (src/prints.json, scripts/prepare-media.py prints): each a sheet of its real proportions, its
// edge a little thicker than paper so it reads, both its sides printed on it, a hot-stamped side glossy where it is
// stamped, a holographic foil (Black Point's card's logo) running through colours as it turns; lit like a product shot
// (a room's reflections and a key light), floating over its soft shadow. A thing printed on one side only sways a
// little and never shows its blank back. Picked, the next thing comes in turning, swapped while edge-on, so the swap
// can't be seen, and comes round to its front. A card folded in two (Black Point's voucher) is two leaves hinged along
// its top, shut, then its cover opening up over the hinge to show its inside (and shut again; a tap opens or shuts
// it). A deck (Da Vinci's Tarot cards, HYPE's badges, a set of stickers, banners or posters) lies stacked face up, and
// shuffles when tapped (and by itself every few seconds): it splits in two halves, which riffle back together card by
// card in a new order, so a new card comes up on top. A folder (DC Consulting's) is folded from its own die line: its
// pocket and glue flap turned in on the back cover, its front cover on the spine, closed, then opening to show its
// inside (and on, and back; a tap opens or closes it).
type Sheet = {
  kind: string;
  w: number;
  h: number;
  front?: string;
  fronts?: string[];
  back?: string;
  frontGloss?: string;
  backGloss?: string;
  frontBump?: string; // (blind embossing: the paper's height)
  backBump?: string;
  metal?: boolean; // (its gloss maps' blue is metal: gold foil)
  holo?: boolean; // (and their red holographic: the foil's colours)
  inner?: string[]; // a folded card's inside: the cover's, the back's
  // a folder's
  page?: number[];
  outside?: string;
  outsideGloss?: string;
  inside?: string;
  folds?: { glue: number; spine: number; pocket: number };
  panels?: Record<'glue' | 'back' | 'front' | 'pocket', number[][]>;
};
const PRINTS = printsJson as Record<string, Sheet[]>;
const SHUFFLE = { split: 0.35, gap: 0.08, deal: 0.32 }; // seconds: the halves part, each card's turn after the last, its way in
const EMBOSS = 8; // how high a blind-embossed mark stands (its bump map's scale)

// a soft round spot, white at its middle (a shadow when drawn dark, a glow when light)
function spot(alpha: number) {
  const c = Object.assign(document.createElement('canvas'), { width: 128, height: 128 });
  const g = c.getContext('2d')!;
  const fade = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  fade.addColorStop(0, `rgba(255,255,255,${alpha})`);
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
// holographic foil's film: its thickness (the green, where three.js reads it) in wavy bands across it, so its colours run
// in stripes that shift as it turns
function film() {
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
  const g = c.getContext('2d')!;
  const bands = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) bands.data.set([0, Math.round(127.5 + 127.5 * Math.sin((x + y) * 0.06 + Math.sin(y * 0.045) * 2.2)), 0, 255], (y * 256 + x) * 4);
  g.putImageData(bands, 0, 0);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

async function sheets(name: SceneName): Promise<Live> {
  const things = PRINTS[name.slice('print:'.length)];
  const sides = things.map((thing) => ({
    fronts: (thing.fronts ?? [thing.front ?? thing.outside!]).map((url) => picture(url)),
    back: thing.back ?? thing.inside ? picture((thing.back ?? thing.inside)!) : null,
    frontGloss: thing.frontGloss ?? thing.outsideGloss ? picture((thing.frontGloss ?? thing.outsideGloss)!) : null,
    backGloss: thing.backGloss ? picture(thing.backGloss) : null,
    frontBump: thing.frontBump ? picture(thing.frontBump) : null,
    backBump: thing.backBump ? picture(thing.backBump) : null,
    inner: (thing.inner ?? []).map((url) => picture(url)),
    metal: !!thing.metal,
    holo: !!thing.holo,
  }));
  for (const side of sides) for (const data of [side.frontGloss, side.backGloss, side.frontBump, side.backBump]) if (data) data.colorSpace = THREE.NoColorSpace; // (data, not colour)
  const maps = (i: number) => [...sides[i].fronts, sides[i].back, sides[i].frontGloss, sides[i].backGloss, sides[i].frontBump, sides[i].backBump, ...sides[i].inner];
  const ready = (i: number) => maps(i).every((texture) => !texture || texture.image);
  await Promise.all(maps(0).map((texture) => texture?.ready));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.25, 13);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(-5, 2, -6);
  scene.add(rim);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: spot(0.09), transparent: true, depthWrite: false, toneMapped: false }));
  glow.position.z = -6;
  scene.add(glow);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: spot(1), color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const edge = new THREE.MeshStandardMaterial({ color: 0xeceae4, roughness: 0.9 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  // (a blank side: the paper; a gloss map's green is the roughness, and on a thing with metal its blue the metal; on a
  // holographic one its red the foil's thin film, the colours)
  const thickness = film();
  const paper = (map: THREE.Texture | null, gloss: THREE.Texture | null, metal = false, bump: THREE.Texture | null = null, holo = false) =>
    holo && gloss
      ? new THREE.MeshPhysicalMaterial({
          map,
          roughnessMap: gloss,
          roughness: 1,
          metalnessMap: gloss,
          metalness: 1,
          iridescence: 1,
          iridescenceMap: gloss,
          iridescenceIOR: 1.8,
          iridescenceThicknessMap: thickness,
          iridescenceThicknessRange: [150, 900],
        })
      : new THREE.MeshStandardMaterial({
          map,
          color: map ? 0xffffff : 0xf4f2ec,
          roughnessMap: gloss,
          roughness: gloss ? 1 : 0.62,
          ...(metal && gloss ? { metalnessMap: gloss, metalness: 1 } : {}),
          ...(bump ? { bumpMap: bump, bumpScale: EMBOSS } : {}),
        });
  const pivot = new THREE.Group();
  scene.add(pivot);
  // each thing's sheets: one, or a deck's cards, or a folder, or a folded card (built as the thing first shows)
  const built: THREE.Object3D[][] = [];
  // (a thing that opens: how far it is open and wants to be, since when; `pose` sets it so far open and says how wide it
  // shows then, and how far it reaches below the shut thing's foot, for its shadow)
  type Opens = { open: number; target: number; since: number; pose: (open: number) => { wide: number; low: number } };
  const folders: Opens[] = [];
  let folder: Opens | null = null; // the shown thing's, if it opens
  const fold = (thing: Sheet, i: number) => {
    // its pieces on the page, in points, from the spine (x) and the covers' middle (y), as big as the view takes open
    const f = thing.folds!;
    const panels = thing.panels!;
    const page = thing.page!;
    const ys = panels.back.map(([, y]) => y);
    const top = Math.min(...ys);
    const middle = (top + f.pocket) / 2;
    const right = Math.max(...panels.front.map(([x]) => x));
    const k = Math.min(7.8 / (right - f.glue), 5 / (f.pocket - top));
    const t = 0.012; // (a board's thickness, apart)
    const side = sides[i];
    const outside = new THREE.MeshStandardMaterial({ map: side.fronts[0], roughnessMap: side.frontGloss, metalnessMap: side.frontGloss, roughness: 1, metalness: 1 });
    const inside = new THREE.MeshStandardMaterial({ map: side.back, roughness: 0.6, side: THREE.BackSide });
    // a piece, from its hinge at (hx, hy): its outside (+z) and its inside (the page mirrored), the print on each
    const piece = (poly: number[][], hx: number, hy: number) => {
      const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2((x - hx) * k, -(y - hy) * k)));
      const geometry = new THREE.ShapeGeometry(shape);
      const at = geometry.getAttribute('position');
      const uv = (mirror: boolean) =>
        new THREE.BufferAttribute(
          Float32Array.from({ length: at.count * 2 }, (_, n) => {
            const v = n >> 1;
            const x = at.getX(v) / k + hx;
            const y = -at.getY(v) / k + hy;
            return n % 2 ? 1 - y / page[1] : mirror ? 1 - x / page[0] : x / page[0];
          }),
          2,
        );
      const outer = geometry.clone();
      outer.setAttribute('uv', uv(false));
      geometry.setAttribute('uv', uv(true));
      return new THREE.Group().add(new THREE.Mesh(outer, outside), new THREE.Mesh(geometry, inside));
    };
    const back = piece(panels.back, f.spine, middle);
    const pocket = piece(panels.pocket, f.spine, f.pocket);
    pocket.position.set(0, -(f.pocket - middle) * k, -t);
    pocket.rotation.x = Math.PI; // (turned in, onto the back cover)
    const glue = piece(panels.glue, f.glue, middle);
    glue.position.set((f.glue - f.spine) * k, 0, -2 * t);
    glue.rotation.y = -Math.PI; // (over the pocket's edge)
    back.add(pocket, glue);
    const front = piece(panels.front, f.spine, middle);
    const root = new THREE.Group().add(back, front);
    root.rotation.y = Math.PI; // (closed, its front cover towards us)
    const wide = (f.spine - f.glue) * k; // (its back cover's)
    folders[i] = {
      open: 0,
      target: 0,
      since: 0,
      pose: (open) => {
        front.rotation.y = Math.PI * (1 - open * 0.93);
        front.position.z = -0.036 * (1 - open); // (over the pocket and the flap when shut)
        root.position.x = -(wide / 2) * (1 - open); // (shut: the back cover in the middle)
        return { wide: 0.5 + open / 2, low: 0 };
      },
    };
    return [root];
  };
  // a card folded in two: its back leaf, its inside towards us, and its cover hinged on it along the top, in front
  const card = (i: number) => {
    const side = sides[i];
    const { w, h, t } = size;
    const leaf = (front: THREE.Texture | null, back: THREE.Texture | null) => {
      const matte = (map: THREE.Texture | null) => Object.assign(paper(map, null), { roughness: 0.85 }); // (uncoated)
      const mesh = new THREE.Mesh(box, [edge, edge, edge, edge, matte(front), matte(back)]);
      mesh.scale.set(w, h, t);
      return mesh;
    };
    const turned = side.inner[0].clone(); // (the cover's inside, seen over the hinge: upside down as it comes)
    turned.center.set(0.5, 0.5);
    turned.rotation = Math.PI;
    const cover = leaf(side.fronts[0], turned);
    cover.position.y = -h / 2;
    const hinge = new THREE.Group().add(cover);
    hinge.position.set(0, h / 2, t);
    const root = new THREE.Group().add(leaf(side.inner[1], side.back), hinge);
    folders[i] = {
      open: 0,
      target: 0,
      since: 0,
      pose: (open) => {
        hinge.rotation.x = -Math.PI * 0.93 * open; // (its foot coming up towards us and over)
        const s = 1.6 - 0.6 * open; // (shut, as big as a thing on its own; stepping back as it opens)
        root.scale.setScalar(s);
        root.position.y = (-s * h * open) / 2; // (open: the hinge in the middle)
        return { wide: s, low: (s * h * (1 + open)) / 2 - h / 2 };
      },
    };
    return [root];
  };
  let size = { w: 1, h: 1, t: 0.04 };
  let shown: THREE.Object3D[] = [];
  let cards: THREE.Mesh[] = []; // the shown thing's
  let order: number[] = []; // a deck's cards from the bottom up
  let lie: { x: number; y: number; r: number }[] = []; // each card's little offset in the stack
  let shuffle: { at: number; next: number[] } | null = null;
  let nextShuffle = 5;
  const scatter = () => cards.map(() => ({ x: (Math.random() - 0.5) * 0.06, y: (Math.random() - 0.5) * 0.06, r: (Math.random() - 0.5) * 0.05 }));
  const show = (i: number) => {
    const thing = things[i];
    const side = sides[i];
    // as big as the view takes, at its proportions (a folded card open: two leaves tall); its thickness 0.4 mm on cards,
    // 0.25 on bigger things, 3 on a sign (a board), drawn thicker
    const k = Math.min(7.8 / thing.w, thing.inner ? 5.6 / (2 * thing.h) : 5 / thing.h);
    const mm = thing.kind === 'sign' ? 3 : Math.max(thing.w, thing.h) <= 100 ? 0.4 : 0.25;
    size = { w: thing.w * k, h: thing.h * k, t: Math.max(0.04, mm * k * 1.6) };
    if (!built[i])
      built[i] =
        thing.kind === 'folder'
          ? fold(thing, i)
          : thing.inner
            ? card(i)
            : side.fronts.map((map) => {
                const mesh = new THREE.Mesh(box, [
                  edge,
                  edge,
                  edge,
                  edge,
                  paper(map, side.frontGloss, side.metal, side.frontBump, side.holo),
                  paper(side.back, side.backGloss, side.metal, side.backBump, side.holo),
                ]);
                mesh.scale.set(size.w, size.h, size.t);
                return mesh;
              });
    pivot.remove(...shown);
    shown = built[i];
    pivot.add(...shown);
    cards = folders[i] ? [] : (shown as THREE.Mesh[]);
    folder = folders[i] ?? null;
    if (folder) Object.assign(folder, { open: 0, target: 0, since: 0 }); // (shut, to begin with)
    order = cards.map((_, n) => n);
    lie = scatter();
    shuffle = null;
    turnOf<Flip>(name).auto = cards.length === 1; // (a deck stays face up, a folder or a folded card opens instead)
    turnOf<Flip>(name).sway = !side.back; // (nothing printed on its back)
  };
  show(0);
  const flip = turnOf<Flip>(name);
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - (1 - x) ** 3);
  // the z of stack place p, the stack centred
  const zOf = (p: number) => (p - (cards.length - 1) / 2) * size.t * 1.3;
  let time = 0;
  let wanted = 0;
  let swapping = false;
  let facing = 1; // (how much its front faced us last time)
  return {
    scene,
    camera,
    clear: 0x0b0b0e,
    toneMapping: THREE.NeutralToneMapping,
    prepare(gl) {
      const pmrem = new THREE.PMREMGenerator(gl);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.75;
      pmrem.dispose();
    },
    step(dt) {
      time += dt;
      const asked = picks.get(name) ?? 0;
      if (asked !== wanted && ready(asked)) {
        wanted = asked;
        if (still) show(wanted);
        else {
          flip.round();
          swapping = true;
        }
      }
      let turn = flip.update(dt);
      const sway = Math.sin(time * 0.7) * 0.12; // (the scene's own, on the turn)
      // swapped while edge-on as it shows (or just past it), then on round to the new one's front; while held, at once
      const faces = Math.cos(turn.y + sway);
      if (swapping && (Math.abs(faces) < 0.12 || faces * facing < 0 || flip.holding)) {
        show(wanted);
        swapping = false;
        if (!flip.holding) flip.swapped(sway);
        turn = flip.update(0);
      }
      facing = faces;
      // a deck shuffles when tapped, and by itself now and then
      const n = cards.length;
      if (n > 1 && !shuffle && !still && (flip.taps > 0 || time > nextShuffle)) {
        const next = [...order];
        do for (let a = n - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [next[a], next[b]] = [next[b], next[a]]; }
        while (next[n - 1] === order[n - 1]); // (a new card on top)
        shuffle = { at: time, next };
        nextShuffle = time + 7;
      }
      if (shuffle) {
        const s = time - shuffle.at;
        const parted = ease(s / SHUFFLE.split);
        for (let q = 0; q < n; q++) {
          const c = shuffle.next[q]; // the card that ends at place q
          const p = order.indexOf(c); // where it was
          const half = p < n / 2 ? -1 : 1;
          const dealt = ease((s - SHUFFLE.split - q * SHUFFLE.gap) / SHUFFLE.deal);
          const card = cards[c];
          // from its place out to its half, then in to its new place, over the cards dealt before it
          const x = lie[c].x + half * size.w * 0.6 * parted;
          card.position.set(x + (lie[c].x - x) * dealt, lie[c].y, zOf(p) + (zOf(q) - zOf(p)) * dealt + Math.sin(dealt * Math.PI) * size.t * 6 + parted * (1 - dealt) * 0.1);
          card.rotation.set(0, 0, lie[c].r + half * 0.14 * parted * (1 - dealt));
        }
        if (s > SHUFFLE.split + (n - 1) * SHUFFLE.gap + SHUFFLE.deal) {
          order = shuffle.next;
          shuffle = null;
        }
      } else
        order.forEach((c, p) => {
          cards[c].position.set(lie[c].x, lie[c].y, zOf(p));
          cards[c].rotation.set(0, 0, lie[c].r);
        });
      // a folder or a folded card opens and shuts, by itself (shut 3 s, open 4 s) or when tapped
      let [wide, low] = [1, 0];
      if (folder) {
        folder.since += dt;
        if (flip.taps > 0 || folder.since > (folder.target ? 4 : 3)) {
          folder.target = 1 - folder.target;
          folder.since = 0;
        }
        folder.open += (folder.target - folder.open) * (1 - Math.exp(-dt * (still ? 99 : 2.2)));
        ({ wide, low } = folder.pose(folder.open));
      }
      flip.taps = 0;
      pivot.rotation.set(turn.x - 0.06 + Math.sin(time * 0.5) * 0.04, turn.y + sway, 0);
      pivot.position.y = Math.sin(time * 1.2) * 0.06;
      // the shadow under it, as wide as it shows from above
      shadow.position.set(0, -size.h / 2 - low - 0.45, 0);
      shadow.scale.set(size.w * wide * Math.max(0.12, Math.abs(Math.cos(pivot.rotation.y))) * 1.15 + 0.4, 1.1, 1);
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.5 - pivot.position.y * 0.8;
    },
  };
}
