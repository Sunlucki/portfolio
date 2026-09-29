import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Billboard, Environment, Float, Lightformer, MeshReflectorMaterial, Sparkles, useGLTF, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CAMERA_ELEVATION,
  CAMERA_FOV,
  CAMERA_TARGET,
  FIGURE_ASPECT,
  FIGURE_BASE,
  FIGURE_HEIGHT,
  FIGURE_ROWS,
  PHONE_SCALE,
  PHONE_YAW,
  SCREEN_LENGTH,
  SCREEN_WIDTH,
  SCREEN_Y,
  cameraDistance,
  ditherPrint,
  handoff,
} from './aboutStage';
import { KeepSize } from './KeepSize';

/**
 * Volumetric About scene: an iPhone lying on a wet floor, its screen throwing a column of light up to
 * Bogdan, who floats above it. The figure is printed as a 1-bit dither that the cursor burns through
 * to full colour (after React Bits' Dither Veil). iPhone 17 Pro Max model: MajdyModels (Sketchfab, CC BY 4.0).
 */

const BG = '#0C0C0C';
const TARGET = new THREE.Vector3(...CAMERA_TARGET);
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function AboutScene({ active, onReady }: { active: boolean; onReady: () => void }) {
  // No frame until the shaders are compiled (see Ready), then one frame, then frames while in view.
  const [warm, setWarm] = useState(false);
  const warmed = useCallback(() => {
    setWarm(true);
    onReady();
  }, [onReady]);
  return (
    <Canvas
      frameloop={!warm ? 'never' : active ? 'always' : 'demand'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.6, 7.2], fov: CAMERA_FOV }}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 7, 15]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0.7, 0]} intensity={4} distance={5} decay={2} color="#cfe4ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={0.8} color="#dcecff" position={[0, 4, 1]} scale={[5, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#6fa8ff" position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 1, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#9cc4ff" position={[4, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[3, 1, 1]} />
      </Environment>

      <group rotation-y={PHONE_YAW}>
        <Phone />
        <LightVolume />
        <FloorGlow />
      </group>
      <Sparkles count={60} scale={[2.4, 2.2, 1.6]} position={[0, 1.3, 0]} size={2} speed={still ? 0 : 0.3} opacity={0.5} color="#d8e9ff" />
      <Figure />
      <Floor />
      <CameraRig />
      <Ready onReady={warmed} />
      <KeepSize />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.9} luminanceSmoothing={0.1} levels={6} radius={0.7} />
      </EffectComposer>
    </Canvas>
  );
}

useGLTF.preload('/models/iphone.glb', false, true);
useTexture.preload('/about/floating.webp');

// Mounted in the same suspense tree as the model and the textures, so it fires once everything is in.
// It compiles the scene's shaders in the background (KHR_parallel_shader_compile) before the first frame,
// so mounting the scene doesn't stall the page mid-scroll.
function Ready({ onReady }: { onReady: () => void }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    let alive = true;
    const done = () => alive && onReady();
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
};

// Lock screen as in the render: glowing white, the @sunlucki handle, quick actions.
function useScreenTexture() {
  const texture = useMemo(() => {
    const W = 600;
    const H = 1290;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY = false; // glTF UV convention
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; // the screen's UVs rely on glTF's default REPEAT sampler
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const draw = () => {
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(-1, 0, 0, -1, W, H); // the screen's UVs run bottom-to-top: draw rotated by 180°
      const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, H * 0.72);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(1, '#cddff4');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1b2533'; // the Dynamic Island itself is part of the model
      ctx.textBaseline = 'middle';
      ctx.font = '600 30px Kanit, sans-serif';
      ctx.fillText('9:41', 58, 58);
      roundRect(ctx, W - 108, 46, 50, 24, 7); // battery
      ctx.textAlign = 'center';
      ctx.font = '500 32px Kanit, sans-serif';
      ctx.fillText('@ S U N L U C K I', W / 2, 136);
      ctx.fillStyle = 'rgba(27, 37, 51, 0.16)';
      for (const x of [104, W - 104]) {
        ctx.beginPath();
        ctx.arc(x, H - 136, 46, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#1b2533';
      roundRect(ctx, 98, H - 156, 12, 34, 4); // flashlight
      roundRect(ctx, W - 124, H - 150, 40, 28, 6); // camera
      roundRect(ctx, W / 2 - 115, H - 34, 230, 10, 5); // home indicator
      tex.needsUpdate = true;
    };
    draw();
    // Redraw once Kanit is in, unless it already is: every redraw re-uploads the whole screen texture.
    if (document.fonts && !document.fonts.check('600 30px Kanit')) document.fonts.load('600 30px Kanit').then(draw, () => {});
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Phone() {
  const { scene } = useGLTF('/models/iphone.glb', false, true);
  const screen = useScreenTexture();
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh && (mesh.material as THREE.Material).name.startsWith('screen')) {
        // Over-bright and un-tonemapped, so the bloom pass turns the display into a light source.
        mesh.material = new THREE.MeshBasicMaterial({ map: screen, color: new THREE.Color(1.3, 1.3, 1.3), toneMapped: false, side: THREE.DoubleSide });
      }
    });
    return root;
  }, [scene, screen]);
  // Authored upright with the screen facing −X: lay it on its back, then centre the screen on the origin.
  const s = PHONE_SCALE;
  return <primitive object={model} rotation-z={-Math.PI / 2} position={[-0.0227 * s, 0.0514 * s, 0.123 * s]} scale={s} />;
}

const VOLUME = new THREE.Vector3(SCREEN_LENGTH * 1.3, 2.6, SCREEN_WIDTH * 1.6);

const volumeVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vEye;
  void main() {
    vPos = position;
    vEye = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Ray-marched light rising from the screen: dense right above it, spreading and fading with height.
const volumeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec2 uScreen;
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vEye;
  float roundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float density(vec3 p) {
    float h = p.y + 0.5;
    float edge = roundRect(p.xz, uScreen * (1.0 + 0.15 * h), 0.05);
    float body = 1.0 - smoothstep(-0.05, 0.06 + 0.12 * h, edge);
    float haze = 0.8 + 0.2 * sin(p.y * 11.0 - uTime * 0.9 + sin(p.x * 6.0 + uTime * 0.4) * 1.6);
    return body * exp(-h * 6.0) * haze;
  }
  void main() {
    vec3 ro = vEye;
    vec3 rd = normalize(vPos - vEye);
    vec3 inv = 1.0 / rd;
    vec3 a = (-0.5 - ro) * inv;
    vec3 b = (0.5 - ro) * inv;
    vec3 lo = min(a, b);
    vec3 hi = max(a, b);
    float near = max(max(lo.x, lo.y), max(lo.z, 0.0));
    float far = min(min(hi.x, hi.y), hi.z);
    if (far <= near) discard;
    float step = (far - near) / 24.0;
    float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float sum = 0.0;
    for (int i = 0; i < 24; i++) sum += density(ro + rd * (near + (float(i) + jitter) * step));
    gl_FragColor = vec4(uColor * sum * step, 1.0);
  }
`;

function LightVolume() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#cfe4ff') },
      uScreen: { value: new THREE.Vector2(SCREEN_LENGTH / 2 / VOLUME.x, SCREEN_WIDTH / 2 / VOLUME.z) },
      uTime: { value: 0 },
    }),
    [],
  );
  // R3F copies a `uniforms` prop into the material, so the animated value is set on the material itself.
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (!still && material.current) material.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh position={[0, SCREEN_Y + 0.005 + VOLUME.y / 2, 0]} scale={VOLUME} renderOrder={2}>
      <boxGeometry />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={volumeVertex}
        fragmentShader={volumeFragment}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Light spilling onto the floor around the phone.
function FloorGlow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'blur(28px)';
    ctx.fillStyle = 'rgba(190, 215, 255, 0.5)';
    ctx.beginPath();
    ctx.roundRect(96, 64, 320, 128, 40);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]}>
      <planeGeometry args={[SCREEN_LENGTH * 1.6, SCREEN_WIDTH * 1.6 * 1.6]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[40, 40]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[300, 90]}
        mixBlur={1}
        mixStrength={14}
        mirror={0.7}
        roughness={0.8}
        metalness={0.35}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#07080a"
      />
    </mesh>
  );
}

// The figure's 1-bit print (aboutStage.ts), in texture space so the dots stay on the body while it floats.
function ditherTexture(image: HTMLImageElement, rows: number) {
  const { canvas, cols } = ditherPrint(image, rows);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return { texture, cols, rows };
}

const TRAIL_W = 64;
const TRAIL_H = Math.round(TRAIL_W / FIGURE_ASPECT);
const REVEAL_RADIUS = 0.2; // share of the figure's height
const LINGER = 1.1; // seconds for a burnt-through cell to knit back

const figureVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const figureFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uDither;
  uniform sampler2D uTrail;
  uniform vec2 uCells;
  uniform vec3 uInk;
  uniform vec3 uPaper;
  uniform vec3 uRim;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec4 photo = texture2D(uMap, vUv);
    vec4 print = texture2D(uDither, vUv);
    float trail = texture2D(uTrail, vUv).r;
    // Each cell flips at its own threshold, so the veil burns open and knits back cell by cell.
    float threshold = 0.16 + 0.78 * hash(floor(vUv * uCells)); // ≥ the rim band, so idle cells stay clean
    float shown = step(threshold, trail);
    float rim = step(threshold - 0.12, trail) - shown;
    vec3 color = mix(mix(uInk, uPaper, print.r), uRim, rim * print.a);
    color = mix(color, photo.rgb, shown);
    float alpha = mix(print.a, photo.a, shown);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function Figure() {
  const photo = useTexture('/about/floating.webp');
  photo.colorSpace = THREE.SRGBColorSpace;
  const print = useMemo(() => ditherTexture(photo.image as HTMLImageElement, FIGURE_ROWS), [photo]);
  const trail = useMemo(() => {
    const texture = new THREE.DataTexture(new Uint8Array(TRAIL_W * TRAIL_H), TRAIL_W, TRAIL_H, THREE.RedFormat);
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(
    () => () => {
      print.texture.dispose();
      trail.dispose();
    },
    [print, trail],
  );

  const uniforms = useMemo(
    () => ({
      uMap: { value: photo },
      uDither: { value: print.texture },
      uTrail: { value: trail },
      uCells: { value: new THREE.Vector2(print.cols, print.rows) },
      uInk: { value: new THREE.Color('#070b14') },
      uPaper: { value: new THREE.Color('#c4d8f5') },
      uRim: { value: new THREE.Color('#4f8dff') },
    }),
    [photo, print, trail],
  );

  const pointer = useRef<{ uv: THREE.Vector2 | null; last: THREE.Vector2 | null }>({ uv: null, last: null });

  // The trail map: burn a soft line from the previous pointer position to the current one, fade the rest.
  useFrame((_, dt) => {
    const cells = trail.image.data as Uint8Array;
    const fade = Math.ceil((255 * dt) / LINGER);
    let changed = false;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]) {
        cells[i] = Math.max(0, cells[i] - fade);
        changed = true;
      }
    }
    const { uv, last } = pointer.current;
    if (uv) {
      const from = last ?? uv;
      const r = REVEAL_RADIUS * TRAIL_H;
      const ax = from.x * TRAIL_W;
      const ay = from.y * TRAIL_H;
      const bx = uv.x * TRAIL_W;
      const by = uv.y * TRAIL_H;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      for (let y = Math.max(0, Math.floor(Math.min(ay, by) - r)); y < Math.min(TRAIL_H, Math.ceil(Math.max(ay, by) + r)); y++) {
        for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - r)); x < Math.min(TRAIL_W, Math.ceil(Math.max(ax, bx) + r)); x++) {
          const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len2));
          const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
          const v = Math.round(255 * Math.min(1, Math.max(0, (r - d) / (r * 0.45))));
          if (v > cells[y * TRAIL_W + x]) cells[y * TRAIL_W + x] = v;
        }
      }
      pointer.current.last = uv.clone();
      changed = true;
    }
    if (changed) trail.needsUpdate = true;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.uv) pointer.current.uv = e.uv.clone();
  };
  const onLeave = () => {
    pointer.current.uv = null;
    pointer.current.last = null;
  };

  const height = FIGURE_HEIGHT;
  return (
    <Float speed={still ? 0 : 1.2} rotationIntensity={0.04} floatIntensity={0.3} floatingRange={[-0.05, 0.05]}>
      <Billboard position={[FIGURE_BASE[0], FIGURE_BASE[1] + height / 2, FIGURE_BASE[2]]}>
        <mesh onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={onLeave} renderOrder={1}>
          <planeGeometry args={[height * FIGURE_ASPECT, height]} />
          <shaderMaterial uniforms={uniforms} vertexShader={figureVertex} fragmentShader={figureFragment} transparent depthWrite={false} />
        </mesh>
      </Billboard>
    </Float>
  );
}

// Orbits the camera a few degrees with the pointer (anywhere on the page) and sways gently on its own,
// so the depth of the scene reads even on touch screens. While the manifesto's particles assemble the
// scene it holds the resting pose they are aimed through (aboutStage.ts), and eases out of it after.
function CameraRig() {
  const { gl, size } = useThree();
  const aim = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const free = useRef(handoff.reveal);
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const clamp = (v: number) => Math.max(-1.2, Math.min(1.2, v));
      aim.current.x = clamp((e.clientX - rect.left - rect.width / 2) / (rect.width / 2));
      aim.current.y = clamp((rect.top + rect.height / 2 - e.clientY) / (rect.height / 2));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [gl]);
  const distance = cameraDistance(size.width / size.height);
  useFrame(({ camera, clock }, dt) => {
    const k = 1 - Math.pow(0.04, dt);
    pos.current.x += (aim.current.x - pos.current.x) * k;
    pos.current.y += (aim.current.y - pos.current.y) * k;
    free.current += ((handoff.reveal >= 0.999 ? 1 : 0) - free.current) * (1 - Math.pow(0.02, dt));
    const sway = still ? 0 : Math.sin(clock.elapsedTime * 0.3) * 0.07;
    const azimuth = (pos.current.x * 0.18 + sway) * free.current;
    const elevation = CAMERA_ELEVATION + pos.current.y * 0.06 * free.current;
    camera.position.set(
      TARGET.x + distance * Math.cos(elevation) * Math.sin(azimuth),
      TARGET.y + distance * Math.sin(elevation),
      TARGET.z + distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(TARGET);
  });
  return null;
}
