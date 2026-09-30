import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { MOBILE_APPS } from '../content';
import { flow, phoneLayout } from './flow';
import { NOISE_GLSL } from './noise';

/**
 * The particle scene behind the Mobile Apps, Graphics and Video sections (sections/FlowSections.tsx holds it, a
 * canvas stuck to the screen behind them). In the Apps section the iPhone (the contact section's iPhone 17 Pro Max,
 * MajdyModels, CC BY 4.0) gathers out of particles strewn round its place and becomes the model, as the About
 * portrait does out of the manifesto's; it stands there swaying, the apps' screens on its display, a new one pushing
 * in from the right, a new app turning it round. Scrolled on, it breaks up again: its particles drift up behind the
 * Graphics covers as a slow cloud, and land on the Video section's first films, which then show (their cards'
 * opacity, set here). On phones the Video section shows no grid: the particles build the iPhone again there, the
 * first film's picture on its screen, and PLAY floats over it (the section's); tapped, the phone flies at the camera
 * until its screen fills the view, its picture splitting into red, green and blue, and the section's feed opens.
 * Everything is driven by the scroll (where the sections are on the screen, read every frame), eased.
 */

const small = phoneLayout();
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEIGHT = 2; // the phone, scaled to this height
const FOV = 30;
const DISTANCE = 20;
const TALL = 2 * DISTANCE * Math.tan(THREE.MathUtils.degToRad(FOV / 2)); // world height seen at the page's plane
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
// point of it is (its UVs are shifted, with a seam); a new one pushes in from the right. `uSplit` pulls its red and
// blue apart (the camera flying into it), `uOpacity` fades it with the phone.
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
  varying vec2 vFace;
  vec3 split(sampler2D t, vec2 uv) {
    vec2 off = (uv - 0.5) * uSplit;
    return vec3(texture2D(t, uv + off).r, texture2D(t, uv).g, texture2D(t, uv - off).b);
  }
  void main() {
    vec2 uv = 1.0 - (vFace - uBox.xy) / uBox.zw;
    float m = uPush * uPush * (3.0 - 2.0 * uPush);
    vec3 color = uv.x > 1.0 - m ? split(tTo, vec2(uv.x - (1.0 - m), uv.y)) : split(tFrom, vec2(uv.x + 0.3 * m, uv.y)) * (1.0 - 0.45 * m);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

// The particles: each has a place on the phone (aPhone, in its model's units; w: 1 on its display), one in the
// cloud and, on desktops, one on a film's card (aTile: which, and where on it). Where it is: strewn round the phone,
// gathered on it (uAssemble), in the cloud (uLeave), on its card or on phones on the phone again (uLand); each
// particle in its own time, swirling on the way.
const particleVertex = /* glsl */ `
  uniform mat4 uPhoneA; // the phone in the Apps section, as it stands now
  uniform mat4 uPhoneB; // phones: the phone in the Video section
  uniform float uAssemble, uLeave, uLand, uTime, uPixel, uSeenA, uSeenB, uCards, uMobile;
  uniform vec4 uCloud; // its width and height, how far it has drifted
  uniform vec4 uTiles[${CARDS}]; // the films' cards on the page's plane: left, bottom, width, height
  attribute vec4 aPhone;
  attribute vec4 aRand;
  attribute vec3 aTile;
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
    // the cloud: over the whole screen, a little behind the page, drifting up as the page scrolls on
    float up = fract(aRand.y + uCloud.z * (0.5 + 0.8 * aRand.w));
    vec3 cloud = vec3((aRand.x - 0.5) * uCloud.x, (up - 0.5) * uCloud.y, -1.0 - 6.0 * aRand.z);
    vec3 wind = vec3(aRand.xy * 4.0, uTime * 0.08);
    cloud.xy += vec2(snoise(wind), snoise(wind + 7.0)) * 0.8;
    vec4 card = uTiles[int(aTile.x + 0.5)];
    vec3 onCard = vec3(card.x + aTile.y * card.z, card.y + aTile.z * card.w, 0.0);
    vec3 end = mix(onCard, onB, uMobile);

    float a = own(uAssemble, aRand.x);
    float l = own(uLeave, aRand.y);
    float d = own(uLand, aRand.z);
    vec3 p = mix(strewn, onA, a);
    p = mix(p, cloud, l);
    p = mix(p, end, d);
    float travel = sin(3.14159 * a) + sin(3.14159 * l) + sin(3.14159 * d);
    vec3 q = p * 0.3 + vec3(0.0, 0.0, uTime * 0.15);
    p += vec3(snoise(q), snoise(q + 17.0), snoise(q + 31.0)) * 0.45 * travel;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.05 + 0.06 * aRand.w) * (1.0 + 0.4 * aPhone.w * (1.0 - l)) * uPixel / -mv.z;
    // seen where the phone or the cards don't show yet, the cloud fading at its edges
    float edge = smoothstep(0.0, 0.12, up) * (1.0 - smoothstep(0.88, 1.0, up));
    float atA = a * (1.0 - l);
    float atCloud = l * (1.0 - d);
    float flicker = 0.8 + 0.2 * sin(uTime * (1.5 + 2.0 * aRand.w) + aRand.x * 40.0);
    vAlpha = smoothstep(0.0, 0.3, uAssemble) * (1.0 - uSeenA * atA) * mix(1.0, edge, atCloud) * (1.0 - mix(uCards, uSeenB, uMobile) * d) * flicker * (0.7 + 0.5 * aRand.w);
    vColor = mix(mix(vec3(0.42, 0.62, 1.0), vec3(0.72, 0.92, 1.0), aRand.w), vec3(0.95, 0.98, 1.0), 0.6 * aPhone.w * (1.0 - l));
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
// units; and for the films' cards, which one and where on it (a third of them on its edges, so each reads crisp).
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
  const geometry = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    .setAttribute('aPhone', new THREE.BufferAttribute(phone, 4))
    .setAttribute('aRand', new THREE.BufferAttribute(rand, 4))
    .setAttribute('aTile', new THREE.BufferAttribute(tile, 3));
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
        uniforms: { tFrom: { value: null }, tTo: { value: null }, uPush: { value: 1 }, uSplit: { value: 0 }, uOpacity: { value: 0 }, uBox: { value: new THREE.Vector4(0, 0, 1, 1) } },
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
    screen.uniforms.uBox.value.set(face.min.y, face.min.z, face.max.y - face.min.y, face.max.z - face.min.z);
    root.rotation.y = Math.PI / 2; // authored with the screen facing −X
    const box = new THREE.Box3().setFromObject(root);
    const s = HEIGHT / box.getSize(new THREE.Vector3()).y;
    root.scale.setScalar(s);
    root.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-s));
    root.updateMatrixWorld(true);
    const glass = display ? new THREE.Box3().setFromObject(display) : new THREE.Box3(new THREE.Vector3(-0.45, -0.95, 0), new THREE.Vector3(0.45, 0.95, 0));
    return { root, faded, display: display as THREE.Mesh | null, glass: { centre: glass.getCenter(new THREE.Vector3()), size: glass.getSize(new THREE.Vector3()) } };
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
          uCloud: { value: new THREE.Vector4() },
          uTiles: { value: Array.from({ length: CARDS }, () => new THREE.Vector4()) },
        },
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.uniforms.uPixel.value = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
  }, [material, size.height, viewport.dpr]);

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

  // the first film's picture, for the Video section's phone
  const poster = useRef<{ src: string; texture: THREE.Texture | null }>({ src: '', texture: null });
  const run = useRef({ time: 0, shown: -1, app: -1, push: 1, turn: 1, assemble: 0, leave: 0, land: 0, flown: false, cards: -1, ready: '' });
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
    }),
    [],
  );
  const places = useRef<{ apps: HTMLElement | null; phone: HTMLElement | null; graphics: HTMLElement | null; films: HTMLElement | null }>({ apps: null, phone: null, graphics: null, films: null });

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
    const leave = clamp01((vh * 0.4 - (a.top + a.height / 2)) / (vh * 0.8));
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
    u.uCloud.value.set(TALL * (canvas.width / Math.max(1, canvas.height)) * 1.15, TALL * 1.2, (window.scrollY / vh) * 0.3, 0);

    // the phone: in the Apps section, or on phones in the Video section once the particles land there
    const atB = small && r.land > 0.5 && !!e;
    // (with reduced motion no particles: the phone just stands where it is)
    const seenA = still ? 1 : smooth(0.8, 1, r.assemble) * (1 - smooth(0, 0.15, r.leave));
    const seenB = small ? (still ? 1 : smooth(0.8, 1, r.land)) : 0;
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
    // splitting apart; then the feed opens
    const flying = small && flow.fly > 0 && !!e;
    const fly = flying ? clamp01((performance.now() - flow.fly) / FLY_MS) : 0;
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
          if (fly >= 1 && !r.flown) {
            r.flown = true;
            flow.flown?.();
          }
        } else {
          screen.uniforms.uSplit.value = 0;
          r.flown = false;
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
    }

    // what's on the display: the apps' screens in the Apps section, the first film's picture in the Video section
    const s = screen.uniforms;
    if (atB) {
      if (flow.poster && poster.current.src !== flow.poster) {
        poster.current.src = flow.poster;
        new THREE.TextureLoader().load(flow.poster, (texture) => {
          texture.flipY = false;
          texture.colorSpace = THREE.NoColorSpace;
          poster.current.texture = texture;
        });
      }
      if (poster.current.texture) s.tFrom.value = s.tTo.value = poster.current.texture;
      s.uPush.value = 1;
      r.shown = -1;
      r.app = -1;
    } else {
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
    // phones: PLAY floats over the phone once it has gathered there
    if (small && e && end) {
      const ready = seenB > 0.9 ? '1' : '0';
      if (ready !== r.ready) end.dataset.ready = r.ready = ready;
    }
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
      </group>
      {!still && <points geometry={geometry} material={material} frustumCulled={false} />}
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
