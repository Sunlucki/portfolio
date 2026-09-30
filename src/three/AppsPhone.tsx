import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/**
 * The Mobile Apps section's iPhone: the contact section's iPhone 17 Pro Max (MajdyModels, CC BY 4.0) standing
 * in its window, swaying a little, with an app's screens on its display. A new screen pushes in from the
 * right, as in iOS; a new app turns the phone round, and its first screen is on when the display comes back.
 */

const FOV = 28;
const HEIGHT = 2; // the phone, scaled to this height
const PUSH_S = 0.55;
const TURN_S = 1.3;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Screenshots as they are (no colour conversion, no tone mapping): the display is a light source.
const fragmentShader = /* glsl */ `
  uniform sampler2D tFrom;
  uniform sampler2D tTo;
  uniform float uPush;
  varying vec2 vUv;
  void main() {
    vec2 uv = 1.0 - fract(vUv); // the model's screen UVs run the other way round, a whole tile off (glTF repeats)
    float m = uPush * uPush * (3.0 - 2.0 * uPush);
    vec3 color = uv.x > 1.0 - m
      ? texture2D(tTo, vec2(uv.x - (1.0 - m), uv.y)).rgb
      : texture2D(tFrom, vec2(uv.x + 0.3 * m, uv.y)).rgb * (1.0 - 0.45 * m);
    gl_FragColor = vec4(color, 1.0);
  }
`;

type PhoneProps = { images: string[]; shown: number; app: number; still: boolean };

function Phone({ images, shown, app, still }: PhoneProps) {
  const { scene } = useGLTF('/models/iphone.glb', false, true);
  const textures = useTexture(images);
  const { pointer } = useThree();
  const group = useRef<THREE.Group>(null);

  const screen = useMemo(
    () =>
      new THREE.ShaderMaterial({ vertexShader, fragmentShader, side: THREE.DoubleSide, uniforms: { tFrom: { value: null }, tTo: { value: null }, uPush: { value: 1 } } }),
    [],
  );
  useEffect(() => () => screen.dispose(), [screen]);
  useEffect(() => {
    for (const texture of textures) {
      texture.flipY = false; // glTF's UV convention
      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
  }, [textures]);

  // the model, its display given the screens, scaled to HEIGHT and centred, facing the camera
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh && (mesh.material as THREE.Material).name.startsWith('screen')) mesh.material = screen;
    });
    root.rotation.y = Math.PI / 2; // authored with the screen facing −X
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const s = HEIGHT / size.y;
    root.scale.setScalar(s);
    root.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-s));
    return root;
  }, [scene, screen]);

  // what's on the display, and the move that's under way
  const run = useRef({ time: 0, shown: -1, app: -1, push: 1, turn: 1, spin: 0 });
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const r = run.current;
    const u = screen.uniforms;
    r.time += dt;
    if (r.shown < 0) {
      // first frame: the screen on, nothing moving
      u.tFrom.value = u.tTo.value = textures[shown];
      Object.assign(r, { shown, app });
    } else if (app !== r.app) {
      r.app = app;
      r.turn = 0; // a new app: turn round, the screen swapped while it faces away
    } else if (shown !== r.shown && r.turn >= 1) {
      u.tFrom.value = textures[r.shown];
      u.tTo.value = textures[shown];
      r.shown = shown;
      r.push = still ? 1 : 0;
    }
    if (r.turn < 1) {
      r.turn = still ? 1 : Math.min(1, r.turn + dt / TURN_S);
      if (r.turn >= 0.5 && r.shown !== shown) {
        u.tFrom.value = u.tTo.value = textures[shown];
        r.shown = shown;
        r.push = 1;
      }
    }
    r.push = Math.min(1, r.push + dt / PUSH_S);
    u.uPush.value = r.push;

    const g = group.current;
    if (!g) return;
    const eased = r.turn * r.turn * (3 - 2 * r.turn);
    const sway = still ? 0 : Math.sin(r.time * 0.6) * 0.22;
    g.rotation.y = sway + eased * Math.PI * 2 + pointer.x * 0.25;
    g.rotation.x = still ? 0 : Math.sin(r.time * 0.45) * 0.05 - pointer.y * 0.12;
    g.position.y = still ? 0 : Math.sin(r.time * 0.8) * 0.04;
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

type AppsPhoneProps = { images: string[]; shown: number; app: number; active: boolean; still: boolean };

export default function AppsPhone({ images, shown, app, active, still }: AppsPhoneProps) {
  // the phone fills most of the window's height
  const distance = HEIGHT / 2 / Math.tan(THREE.MathUtils.degToRad(FOV) / 2) / 0.82;
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, 0, distance], fov: FOV }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <ambientLight intensity={0.35} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 3, 2]} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#cfe0ff" position={[-4, 0.5, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffd9b3" position={[4, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>
      <Phone images={images} shown={shown} app={app} still={still} />
    </Canvas>
  );
}
