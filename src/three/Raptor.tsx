import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';

/**
 * The F-22 diving down the Graphics section (2026-10-06, Bogdan's call): "F22 Raptor" by Aleksander Kähler (Sketchfab,
 * CC BY 4.0), its gear up and its control surfaces' hinges found by scripts/prepare-raptor.py. A canvas of its own over
 * the rings (clicks go through it to the covers): nose down, its top towards us, the rings rising past it. It turns its
 * nose towards the pointer (a finger on phones), banking into the turn and drifting a little after it, and its control
 * surfaces move as a fly-by-wire jet's do for that: the flaperons apart to roll, the stabilators together to pitch and
 * apart to help the roll, the rudders together to yaw. Left alone, it weaves gently, so they keep moving.
 */

const MODEL = '/models/raptor.glb';
const FOV = 30;
const DISTANCE = 20;
const TALL = 2 * DISTANCE * Math.tan(((FOV / 2) * Math.PI) / 180); // the view's height where the jet flies
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IDLE_S = 2.5; // seconds without the pointer moving before the jet goes back to weaving by itself

type Hinge = { kind: 'flap' | 'elevator' | 'rudder'; side: 'L' | 'R'; axis: number[]; pivot: number[] };
type Pointer = { x: number; y: number; at: number };

// the model's frame: nose +z, up +y, left wing +x. Nose down the screen, its top towards us: turned a quarter about x.
const DIVE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

function Raptor({ pointer, phone }: { pointer: RefObject<Pointer>; phone: boolean }) {
  const { scene } = useGLTF(MODEL, false, false);
  const jet = useRef<THREE.Group>(null!);
  // the jet centred and scaled to its length on the screen, and its control surfaces: each one's rest, its hinge
  const { model, surfaces } = useMemo(() => {
    const jet = scene.clone(true); // (its own copy: the loader's is shared)
    jet.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(jet);
    const size = box.getSize(new THREE.Vector3());
    const scale = ((phone ? 0.34 : 0.4) * TALL) / size.z;
    const model = new THREE.Group();
    jet.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-1);
    model.add(jet);
    model.scale.setScalar(scale);
    const surfaces: { node: THREE.Object3D; hinge: Hinge; rest: THREE.Matrix4; to: THREE.Matrix4; back: THREE.Matrix4 }[] = [];
    jet.traverse((node) => {
      const hinge = node.userData.hinge as Hinge | undefined;
      if (!hinge) return;
      node.updateMatrix();
      node.matrixAutoUpdate = false;
      const [x, y, z] = hinge.pivot;
      surfaces.push({ node, hinge, rest: node.matrix.clone(), to: new THREE.Matrix4().makeTranslation(x, y, z), back: new THREE.Matrix4().makeTranslation(-x, -y, -z) });
    });
    return { model, surfaces };
  }, [scene, phone]);

  // its attitude (radians: yaw about its up, pitch about its wings, roll about its length) and where it is, eased
  const state = useRef({ yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, time: 0 });
  const tools = useMemo(() => ({ q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), axis: new THREE.Vector3(), turn: new THREE.Matrix4() }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    s.time += still ? 0 : dt;
    const p = pointer.current;
    // the pointer's pull: full while it moves, gone a while after it stops
    const pull = still ? 0 : Math.max(0, 1 - Math.max(0, performance.now() - p.at - IDLE_S * 1000) / 1500);
    const t = s.time;
    const weave = still ? 0 : 1 - pull * 0.7;
    // where it wants to be: its nose towards the pointer across the screen (yaw), banked into that turn (a turn to our
    // right is to its left: its left wing is on our right), its nose a little towards us or away with the pointer's
    // height (pitch), and a little way after the pointer
    const want = {
      yaw: pull * p.x * 0.42 + weave * Math.sin(t * 0.55) * 0.16,
      roll: -(pull * p.x * 0.75 + weave * Math.sin(t * 0.55 + 0.6) * 0.35),
      pitch: pull * p.y * 0.22 + weave * Math.sin(t * 0.8) * 0.06,
      x: pull * p.x * 0.14 * TALL,
      y: -pull * p.y * 0.05 * TALL + (still ? 0 : Math.sin(t * 1.1) * 0.012 * TALL),
    };
    const ease = still ? 1 : 1 - Math.exp(-dt * 2.4);
    // what the stick asks for, before the jet has got there: how far each turn still has to go
    const ask = { yaw: want.yaw - s.yaw, roll: want.roll - s.roll, pitch: want.pitch - s.pitch };
    s.yaw += ask.yaw * ease;
    s.roll += ask.roll * ease;
    s.pitch += ask.pitch * ease;
    s.x += (want.x - s.x) * ease;
    s.y += (want.y - s.y) * ease;
    const g = jet.current;
    tools.q.setFromEuler(tools.e.set(s.pitch, s.yaw, s.roll));
    g.quaternion.copy(DIVE).multiply(tools.q);
    g.position.set(s.x, s.y, 0);

    // the control surfaces (positive: the trailing edge down, the rudders' to its left), clamped to their travel
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const roll = clamp(ask.roll * 1.6, 1); // (+1: rolling right, its right wing going down)
    const pitch = clamp(ask.pitch * 2.4, 1); // (+1: its nose going down)
    const yaw = clamp(ask.yaw * 2.2, 1); // (+1: its nose going left)
    const deg = Math.PI / 180;
    for (const { node, hinge, rest, to, back } of surfaces) {
      const side = hinge.side === 'L' ? 1 : -1;
      const angle =
        hinge.kind === 'flap' ? side * roll * 24 * deg : hinge.kind === 'elevator' ? (pitch * 16 + side * roll * 9) * deg : yaw * 22 * deg;
      tools.turn.makeRotationAxis(tools.axis.fromArray(hinge.axis), angle);
      node.matrix.copy(to).multiply(tools.turn).multiply(back).multiply(rest);
    }
  });

  return (
    <group ref={jet}>
      <primitive object={model} />
    </group>
  );
}

export default function RaptorScene({ active }: { active: boolean }) {
  const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const box = useRef<HTMLDivElement>(null);
  // the pointer (or a finger) over the screen: -1 to 1 from the canvas's middle, and when it last moved
  const pointer = useRef<Pointer>({ x: 0, y: 0, at: -Infinity });
  useEffect(() => {
    const at = (clientX: number, clientY: number) => {
      const r = box.current?.getBoundingClientRect();
      if (!r || r.width === 0) return;
      pointer.current = {
        x: Math.max(-1, Math.min(1, ((clientX - r.left) / r.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((clientY - r.top) / r.height) * 2 - 1)),
        at: performance.now(),
      };
    };
    const move = (e: PointerEvent) => at(e.clientX, e.clientY);
    const touch = (e: TouchEvent) => e.touches[0] && at(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('touchmove', touch, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('touchmove', touch);
    };
  }, []);
  return (
    <div ref={box} className="h-full w-full">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, phone ? 1.5 : 1.75]}
        camera={{ position: [0, 0, DISTANCE], fov: FOV, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 10]} intensity={2.2} />
        <directionalLight position={[-6, -3, -4]} intensity={1.4} color="#9db4ff" />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={1.4} color="#ffffff" position={[0, 3, 2]} scale={[6, 1.2, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#cfe0ff" position={[-4, 0.5, 1]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffd9b3" position={[4, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
        </Environment>
        <Raptor pointer={pointer} phone={phone} />
      </Canvas>
    </div>
  );
}
