import * as THREE from 'three';

/**
 * The Graphics covers that are live 3D scenes: Mind Logistic's site's own (Bogdan's, ~/Developer/MIND LOGISTIC:
 * LowPolyBottle3D.tsx and Poucher3DViewer.tsx), its Elixir bottle turning through its five labels over a galaxy and
 * its Poucher can through its four in a lightning storm, ported as they are. One WebGL renderer, off the page, draws
 * them for every canvas that shows one (a cover's copies in the marquee, the open project's top): each scene once a
 * frame, copied into its canvases, and only while one is on screen; while a project is open, its scene alone (the
 * covers behind are blurred). The models and pictures: scripts/prepare-scenes.mjs, prepare-media.py scenes.
 */
export type SceneName = 'elixir' | 'poucher';
type View = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; name: SceneName; top: boolean; shown: boolean; drawn: boolean; onReady?: () => void };
type Live = { scene: THREE.Scene; camera: THREE.PerspectiveCamera; clear: number; toneMapping: THREE.ToneMapping; step: (dt: number) => void; size?: (w: number, h: number) => void };

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX = 1600; // a canvas's widest, in pixels
const views = new Set<View>();
const live = new Map<SceneName, Live | null>(); // null while it loads
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
    (name === 'elixir' ? elixir() : poucher()).then((scene) => {
      live.set(name, scene);
      wake();
    }, () => {}); // (the cover keeps its still)
  }
  const letGo = top ? turns[name].hold(canvas) : () => {};
  wake();
  return () => {
    views.delete(view);
    watch?.unobserve(canvas);
    letGo();
  };
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
  for (const name of ['elixir', 'poucher'] as const) {
    const scene = live.get(name);
    const mine = drawing.filter((view) => view.name === name && !(still && view.drawn));
    if (!scene || !mine.length) continue;
    const gl = context();
    if (!gl) return;
    going = true;
    scene.step(still ? 0 : dt);
    gl.toneMapping = scene.toneMapping;
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
const turns: Record<SceneName, Turn> = { elixir: new Turn(), poucher: new Turn() };

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
// over a galaxy that fades out from its middle and turns slowly, two layers of motes in the flavour's colour.
const ELIXIRS = ['#a855f7', '#fc5000', '#ef4444', '#ff8a4c', '#38bdf8']; // Blueberry Cookies, Lemon Haze, Strawberry OG, Zen, Zkittlez OG

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
          swapped = true;
        }
        if (k >= 1) changing = null;
      }
      pivot.position.y = Math.sin(time * 1.5) * 0.12 + y;
      pivot.scale.setScalar(scale);
      const turn = turns.elixir.update(dt);
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
      const turn = turns.poucher.update(dt);
      pivot.rotation.set(turn.x, turn.y, tilt);
    },
  };
}
