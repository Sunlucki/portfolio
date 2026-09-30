import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Billboard, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * The music player's stage, which is the player: Bogdan in his headphones stands still on a round floor, its rim a
 * line of blue particles that fills as the track plays (click it to seek). The floor is the button: while nothing
 * plays its particles lie as PLAY's triangle round his feet; press it and they fly out to fill the whole floor,
 * which is the spectrum, read from the middle out: the bass under his feet, the mids round him, the highs at the rim,
 * each ring of particles rising with its band, only upward, and coloured by it. With the pointer over the floor the
 * button lights up: the triangle, or PAUSE's two bars (him between them) drawn in the floor. It turns a little with
 * the pointer; he holds still, the photo shown as it is.
 */

const BANDS = 48; // the spectrum laid out from the floor's middle to its rim, 35 Hz to 16 kHz in octave fractions
const BANDS_FPS = 30; // the track's spectrum, worked out beforehand: this many rows of BANDS a second (scripts/prepare-bands.mjs)
const RIM = 1.9; // the floor's radius, where the progress runs
const FIGURE_HEIGHT = 2.1;
const FIGURE_ASPECT = 501 / 1400; // public/about/listening.webp
// The ground point between his feet in the cut-out (40.1 % across, 7.4 % up from the bottom), where the photo
// turns to the camera and the floor's middle lies, so the bass is right under him.
const FEET = [0.401, 0.074] as const;
const FOV = 32;
const ELEVATION = 0.5; // the camera, above him as the photo was taken
const DISTANCE = 8;
const SQUASH = 0.57; // how much the floor shortens, seen from there: the button is drawn taller to read upright
const FLAT = 0.3; // the particles' cloud, flattened into the floor
const SHELLS = 30; // half the particles sit on shells, rings of the spectrum

const floorVertex = /* glsl */ `
  attribute vec3 aPlay; // where it lies in PLAY's triangle
  attribute vec2 aData; // radius on the floor (0 middle to 1 rim), a random number; position: its direction
  uniform sampler2D uSpectrum; // low to high
  uniform float uMorph; // 0 the triangle (nothing plays), 1 the whole floor
  uniform float uHover; // the pointer over the floor
  uniform float uTurn; // the floor's turn with the pointer
  uniform float uTime;
  uniform float uEnergy;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 palette(float t) {
    vec3 deep = vec3(0.1, 0.28, 1.0), cyan = vec3(0.3, 0.78, 1.0), violet = vec3(0.55, 0.36, 1.0);
    return t < 0.5 ? mix(deep, cyan, t / 0.5) : mix(cyan, violet, (t - 0.5) / 0.5);
  }
  // how far inside a triangle (counter-clockwise) or a bar a point is, as seen: > 0 inside
  float edge(vec2 p, vec2 a, vec2 b) {
    vec2 e = b - a;
    return dot(p - a, normalize(vec2(-e.y, e.x)));
  }
  float bar(vec2 p, float u0, float u1) {
    return min(min(p.x - u0, u1 - p.x), 0.72 - abs(p.y));
  }

  void main() {
    vec3 dir = position;
    float r0 = aData.x, seed = aData.y;
    float t = uTime * (0.3 + 0.8 * uEnergy);
    vec3 drift = vec3(sin(t + seed * 6.28 + dir.y * 3.0), cos(t * 0.8 + seed * 9.1 + dir.z * 3.0), sin(t * 0.9 + seed * 4.3 + dir.x * 3.0));

    // the floor is the spectrum, read from the middle out: the bass under his feet, the mids round him, the highs
    // at the rim (the bass given more of the floor); each ring rises with its band, only upward
    float level = texture2D(uSpectrum, vec2(0.01 + 0.98 * pow(r0, 1.4), 0.5)).r;
    float reach = ${RIM * 0.9} * (0.1 + 0.9 * r0);
    vec3 onFloor = dir * reach;
    onFloor.xz += drift.xz * (0.015 + 0.05 * uEnergy) * r0;
    onFloor.y = abs(dir.y) * reach * ${FLAT} * 0.5 + 0.5 * level * (0.55 + 0.45 * seed);

    // in the triangle: breathing with the same spectrum, gently
    float ri = clamp(length(aPlay.xz) / ${RIM}, 0.0, 1.0);
    float levelHere = texture2D(uSpectrum, vec2(0.01 + 0.98 * pow(ri, 1.4), 0.5)).r;
    vec3 inIcon = aPlay + vec3(0.0, 0.12 * levelHere, 0.0) + drift * 0.012;

    // from one to the other, each particle in its own time, over an arc
    float m = clamp((uMorph - seed * 0.4) / 0.6, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    vec3 p = mix(inIcon, onFloor, m);
    p.y += sin(3.14159 * m) * (0.25 + 0.5 * seed);
    float c = cos(uTurn), s = sin(uTurn);
    p.xz = mat2(c, s, -s, c) * p.xz;

    // with the pointer over the floor the button lights up: the whole triangle, or PAUSE drawn in the floor
    vec2 seen = vec2(p.x, -p.z * ${SQUASH});
    float inPause = smoothstep(0.0, 0.03, max(bar(seen, -0.78, -0.3), bar(seen, 0.3, 0.78)));
    float button = mix(1.0, inPause, m) * uHover;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float glow = mix(1.2 * levelHere, 1.6 * level, m);
    float r = mix(ri, r0, m); // the colour says the frequency: deep blue bass, cyan mids, violet highs
    gl_PointSize = (0.02 + 0.022 * min(glow, 1.5) + 0.008 * button) * uPixel / -mv.z;
    vColor = mix(palette(clamp(0.08 + 0.88 * r, 0.0, 1.0)) * (0.55 + 0.6 * min(glow, 1.3)), vec3(0.55, 0.85, 1.0), 0.45 * button);
    vAlpha = mix(0.34 + 0.4 * min(glow, 1.0), (0.2 + 0.45 * min(glow, 1.0)) * (1.0 - 0.25 * r0 * r0), m) + 0.28 * button;
  }
`;

// The rim: a line of particles round the floor, lit from the far side clockwise as far as the track has played.
const rimVertex = /* glsl */ `
  attribute vec2 aData; // where round the rim (0 to 1, from the far side, clockwise from above), a random number
  uniform float uProgress;
  uniform float uHover;
  uniform float uEnergy;
  uniform float uTime;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = aData.x, seed = aData.y;
    float lit = clamp((uProgress - a) * 300.0, 0.0, 1.0);
    float head = uProgress > 0.0 ? exp(-pow((a - uProgress) * 70.0, 2.0)) : 0.0; // the front of the fill glows
    float r = ${RIM} + (seed - 0.5) * 0.07 + 0.04 * uEnergy * sin(a * 50.0 + uTime * 3.0);
    vec3 p = vec3(sin(a * 6.28318) * r, (fract(seed * 7.3) - 0.5) * 0.04, -cos(a * 6.28318) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.032 + 0.026 * lit + 0.03 * head) * uPixel / -mv.z;
    vColor = mix(vec3(0.2, 0.36, 0.9), vec3(0.4, 0.78, 1.0), lit) * (1.0 + 0.5 * uEnergy * lit) + vec3(0.35, 0.65, 1.0) * head;
    vAlpha = mix(0.34 + 0.25 * uHover, 1.0, lit) + 0.6 * head;
  }
`;

const dotFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r = dot(p, p);
    if (r > 1.0) discard;
    gl_FragColor = vec4(vColor, vAlpha * exp(-r * 3.5));
  }
`;

// PLAY: a triangle pointing right, drawn as seen (u across, v up the screen), its centroid at his feet
const PLAY_AT = [
  [-0.52, 0.72],
  [-0.52, -0.72],
  [1.05, 0],
];
// a point in it, laid on the floor: a quarter of them on its edges, so it reads crisp
function inPlay(): [number, number, number] {
  let u: number;
  let v: number;
  const [p, q, r] = PLAY_AT;
  if (Math.random() < 0.25) {
    const side = Math.floor(Math.random() * 3);
    const [a, b] = [PLAY_AT[side], PLAY_AT[(side + 1) % 3]];
    const t = Math.random();
    [u, v] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  } else {
    let a = Math.random();
    let b = Math.random();
    if (a + b > 1) [a, b] = [1 - a, 1 - b];
    [u, v] = [p[0] + a * (q[0] - p[0]) + b * (r[0] - p[0]), p[1] + a * (q[1] - p[1]) + b * (r[1] - p[1])];
  }
  return [u + (Math.random() - 0.5) * 0.02, Math.abs(Math.random() - 0.5) * 0.05, -v / SQUASH + (Math.random() - 0.5) * 0.03];
}

// Directions evenly over the sphere; half the radii on shells, the rest leaning outward; and each a place in PLAY.
function cloud(count: number) {
  const direction = new Float32Array(count * 3);
  const data = new Float32Array(count * 2);
  const play = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    play.set(inPlay(), i * 3);
    const y = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - y * y);
    direction.set([s * Math.cos(a), y, s * Math.sin(a)], i * 3);
    const shell = (Math.floor(Math.random() * SHELLS) + 0.5 + (Math.random() - 0.5) * 0.15) / SHELLS;
    data.set([Math.random() < 0.5 ? shell : Math.pow(Math.random(), 0.6), Math.random()], i * 2);
  }
  return new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(direction, 3))
    .setAttribute('aData', new THREE.BufferAttribute(data, 2))
    .setAttribute('aPlay', new THREE.BufferAttribute(play, 3));
}

function rim(count: number) {
  const data = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) data.set([i / count, Math.random()], i * 2);
  // three wants positions; the shader places the points itself
  return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)).setAttribute('aData', new THREE.BufferAttribute(data, 2));
}

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

type StageProps = {
  bands: Uint8Array | null; // the track's spectrum (BANDS_FPS rows of BANDS a second)
  clock: () => number; // where the track is, in seconds
  playing: boolean;
  progress: number;
  onToggle: () => void;
  onSeek: (at: number) => void;
};

function Stage({ bands, clock, playing, progress, onToggle, onSeek }: StageProps) {
  const { camera, size, viewport } = useThree();
  const figure = useTexture('/about/listening.webp');
  const parts = useMemo(() => {
    const spectrum = new Float32Array(BANDS);
    // eight bits a band: float textures can't be filtered on many phones (no OES_texture_float_linear)
    const bytes = new Uint8Array(BANDS);
    const spectrumTexture = new THREE.DataTexture(bytes, BANDS, 1, THREE.RedFormat, THREE.UnsignedByteType);
    spectrumTexture.magFilter = spectrumTexture.minFilter = THREE.LinearFilter;
    spectrumTexture.needsUpdate = true;
    const shared = { uTime: { value: 0 }, uEnergy: { value: 0 }, uPixel: { value: 1 } };
    const floor = new THREE.ShaderMaterial({
      vertexShader: floorVertex,
      fragmentShader: dotFragment,
      uniforms: { ...shared, uSpectrum: { value: spectrumTexture }, uMorph: { value: 0 }, uHover: { value: 0 }, uTurn: { value: 0 } },
      ...additive,
    });
    const line = new THREE.ShaderMaterial({ vertexShader: rimVertex, fragmentShader: dotFragment, uniforms: { ...shared, uProgress: { value: 0 }, uHover: { value: 0 } }, ...additive });
    const small = window.innerWidth < 768;
    return { spectrum, bytes, spectrumTexture, shared, floor, line, floorGeometry: cloud(small ? 10_000 : 18_000), rimGeometry: rim(small ? 900 : 1_400) };
  }, []);
  useEffect(
    () => () => {
      for (const thing of [parts.spectrumTexture, parts.floor, parts.line, parts.floorGeometry, parts.rimGeometry]) thing.dispose();
    },
    [parts],
  );
  useEffect(() => {
    figure.colorSpace = THREE.SRGBColorSpace;
    figure.anisotropy = 8;
    figure.needsUpdate = true;
  }, [figure]);
  // dots are sized in world units: pixels per unit at unit depth
  useEffect(() => {
    parts.shared.uPixel.value = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
  }, [parts, size.height, viewport.dpr]);
  // the camera looks down at him from where the photo was taken, and stays there: he holds still
  useEffect(() => {
    camera.position.set(0, 0.95 + Math.sin(ELEVATION) * DISTANCE, Math.cos(ELEVATION) * DISTANCE);
    camera.lookAt(0, 0.9, 0);
  }, [camera]);

  const run = useRef({ time: 0, energy: 0, over: 'none' as 'none' | 'floor' | 'rim' });

  useFrame(({ pointer }, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = run.current;
    s.time += dt;
    const { spectrum } = parts;

    // the spectrum where the track is (its bands' rows either side of the moment, mixed), falling back slower than
    // it rises
    let all = 0;
    const row = clock() * BANDS_FPS;
    const at = Math.floor(row);
    if (bands && playing && (at + 1) * BANDS < bands.length) {
      const w = row - at;
      for (let b = 0; b < BANDS; b++) {
        const v = (bands[at * BANDS + b] * (1 - w) + bands[(at + 1) * BANDS + b] * w) / 255;
        spectrum[b] = v > spectrum[b] ? spectrum[b] + (v - spectrum[b]) * 0.6 : Math.max(v, spectrum[b] - 1.5 * dt);
        all += v / BANDS;
      }
    } else {
      // no music: a slow swell running out from his feet
      for (let b = 0; b < BANDS; b++) spectrum[b] += (0.07 + 0.06 * Math.sin(b * 0.3 - s.time * 1.2) - spectrum[b]) * Math.min(1, dt * 3);
      all = 0.04;
    }
    s.energy += (all * 1.6 - s.energy) * Math.min(1, dt * 2.5);
    for (let b = 0; b < BANDS; b++) parts.bytes[b] = Math.round(Math.min(1, spectrum[b]) * 255);
    parts.spectrumTexture.needsUpdate = true;
    parts.shared.uTime.value = s.time;
    parts.shared.uEnergy.value = Math.min(1, s.energy);

    // the button: PLAY or PAUSE, lit with the pointer over the floor; the rim fills as the track plays and
    // brightens under the pointer; the floor turns a little about his feet with the pointer
    const u = parts.floor.uniforms;
    const ease = (value: { value: number }, to: number, rate: number) => (value.value += (to - value.value) * Math.min(1, dt * rate));
    ease(u.uMorph, playing ? 1 : 0, 3);
    ease(u.uHover, s.over === 'floor' ? 1 : 0, 6);
    ease(u.uTurn, pointer.x * 0.35, 2.5);
    ease(parts.line.uniforms.uProgress, progress, 6);
    ease(parts.line.uniforms.uHover, s.over === 'rim' ? 1 : 0, 8);
  });

  // the floor is the button, its rim the progress: where the pointer is on it says which
  const onRim = (e: ThreeEvent<PointerEvent | MouseEvent>) => Math.hypot(e.point.x, e.point.z) > RIM - 0.32;
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!onRim(e)) return onToggle();
    const turn = Math.atan2(e.point.x, -e.point.z) / (Math.PI * 2);
    onSeek(turn < 0 ? turn + 1 : turn);
  };
  const point = (e: ThreeEvent<PointerEvent>) => {
    run.current.over = onRim(e) ? 'rim' : 'floor';
    document.body.style.cursor = 'pointer';
  };
  const leave = () => {
    run.current.over = 'none';
    document.body.style.cursor = '';
  };

  return (
    <>
      {/* he hides what's behind him; what's in front of his feet glows over them */}
      <Billboard>
        <mesh position={[(0.5 - FEET[0]) * FIGURE_HEIGHT * FIGURE_ASPECT, (0.5 - FEET[1]) * FIGURE_HEIGHT, 0]}>
          <planeGeometry args={[FIGURE_HEIGHT * FIGURE_ASPECT, FIGURE_HEIGHT]} />
          <meshBasicMaterial map={figure} transparent alphaTest={0.5} toneMapped={false} />
        </mesh>
      </Billboard>
      <points geometry={parts.floorGeometry} material={parts.floor} frustumCulled={false} renderOrder={1} />
      <points geometry={parts.rimGeometry} material={parts.line} frustumCulled={false} renderOrder={1} />
      <mesh rotation-x={-Math.PI / 2} onClick={click} onPointerMove={point} onPointerOut={leave}>
        <circleGeometry args={[RIM + 0.3, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

type MusicStageProps = StageProps & { active: boolean };

export default function MusicStage({ active, ...stage }: MusicStageProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, 4.8, 7], fov: FOV }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <Stage {...stage} />
    </Canvas>
  );
}
