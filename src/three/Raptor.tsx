import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';

/**
 * The F-22 diving down the middle of the Graphics section's vortex (2026-10-06, Bogdan's calls): "F22 Raptor" by
 * Aleksander Kähler (Sketchfab, CC BY 4.0), its gear up and its control surfaces' hinges found by
 * scripts/prepare-raptor.py. Drawn in the particle scene (three/FlowScene.tsx), which places it: on the vortex's axis,
 * inside the rings, the particles round it before and behind it, nose down, its top towards us; in from the top as the
 * vortex gathers, out at the foot as the particles leave for the films, a whole turn round its own length on the way
 * in and another on the way out. As the page scrolls it keeps turning round its length clockwise (seen from its tail:
 * the vortex's way round), a turn for a screen; the pointer (a finger on phones) turns it further either way, a whole
 * turn across the screen. Not its nose: that stays down. Its control surfaces move as a fly-by-wire jet's do for the
 * turn: the flaperons apart, the stabilators apart to help them, the rudders a little against it. Left alone, it rocks
 * gently to and fro, so they keep moving.
 */

const MODEL = '/models/raptor.glb?v=2'; // (?v: up by one each time the model is made again: browsers keep the one they have)
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IDLE_S = 2.5; // seconds without the pointer moving before the jet goes back to rocking by itself

type Hinge = { kind: 'flap' | 'elevator' | 'rudder'; side: 'L' | 'R'; axis: number[]; pivot: number[] };
// where the scene wants it: how far in (0 above the screen, 1 in place) and out (1 gone below), its length (world
// units) and how far it falls in and out
export type RaptorPlace = { into: number; out: number; length: number; fall: number };

// the model's frame: nose +z, up +y, left wing +x. Nose down the screen, its top towards us: turned a quarter about x.
const DIVE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

export function Raptor({ place }: { place: RefObject<RaptorPlace> }) {
  const { scene } = useGLTF(MODEL, false, false);
  const jet = useRef<THREE.Group>(null!);
  // the jet centred, a unit long, and its control surfaces: each one's rest, its hinge
  const { model, surfaces } = useMemo(() => {
    const copy = scene.clone(true); // (its own copy: the loader's is shared)
    copy.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(copy);
    const model = new THREE.Group();
    copy.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-1);
    model.add(copy);
    model.scale.setScalar(1 / box.getSize(new THREE.Vector3()).z);
    const surfaces: { node: THREE.Object3D; hinge: Hinge; rest: THREE.Matrix4; to: THREE.Matrix4; back: THREE.Matrix4 }[] = [];
    copy.traverse((node) => {
      const hinge = node.userData.hinge as Hinge | undefined;
      if (!hinge) return;
      node.updateMatrix();
      node.matrixAutoUpdate = false;
      const [x, y, z] = hinge.pivot;
      surfaces.push({ node, hinge, rest: node.matrix.clone(), to: new THREE.Matrix4().makeTranslation(x, y, z), back: new THREE.Matrix4().makeTranslation(-x, -y, -z) });
    });
    return { model, surfaces };
  }, [scene]);

  // the pointer (or a finger) across the screen, -1 to 1, and when it last moved
  const pointer = useRef({ x: 0, at: -Infinity });
  useEffect(() => {
    const at = (x: number) => (pointer.current = { x: Math.max(-1, Math.min(1, (x / window.innerWidth) * 2 - 1)), at: performance.now() });
    const move = (e: PointerEvent) => at(e.clientX);
    const touch = (e: TouchEvent) => e.touches[0] && at(e.touches[0].clientX);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('touchmove', touch, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('touchmove', touch);
    };
  }, []);

  // its turn round its own length (radians), eased, and its time
  const state = useRef({ roll: 0, time: 0 });
  // its own light, still while it turns (the scene's is the phone's), only while it is there
  const key = useRef<THREE.DirectionalLight>(null!);
  const rim = useRef<THREE.DirectionalLight>(null!);
  const tools = useMemo(() => ({ q: new THREE.Quaternion(), z: new THREE.Vector3(0, 0, 1), axis: new THREE.Vector3(), turn: new THREE.Matrix4() }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    const g = jet.current;
    const where = place.current;
    g.visible = where.into > 0.001 && where.out < 0.999;
    key.current.intensity = g.visible ? 2 : 0;
    rim.current.intensity = g.visible ? 1.2 : 0;
    // its turn round its length: clockwise (seen from its tail, positive) with the page's scroll, a whole turn coming in
    // and another going out, and the pointer's: full while it moves, gone a while after it stops, a whole turn across
    // the screen
    const turns = still ? 0 : (window.scrollY / window.innerHeight - (1 - where.into) + where.out) * Math.PI * 2;
    const pull = still ? 0 : Math.max(0, 1 - Math.max(0, performance.now() - pointer.current.at - IDLE_S * 1000) / 1500);
    const want = turns + pull * pointer.current.x * Math.PI + (still ? 0 : (1 - pull) * Math.sin(s.time * 0.6) * 0.5);
    if (!g.visible) {
      s.roll = want; // (kept up with while away, so it doesn't spin round to catch up as it comes)
      return;
    }
    s.time += still ? 0 : dt;
    const ask = want - s.roll; // (how far the turn still has to go: what the stick asks for)
    s.roll += ask * (still ? 1 : 1 - Math.exp(-dt * 2.6));
    g.quaternion.copy(DIVE).multiply(tools.q.setFromAxisAngle(tools.z, s.roll));
    g.position.set(0, (1 - where.into) * where.fall - where.out * where.fall + (still ? 0 : Math.sin(s.time * 1.1) * 0.012 * where.length), 0);
    g.scale.setScalar(where.length);

    // the control surfaces (positive: the trailing edge down; the rudders', to its left), as the turn asks
    const roll = Math.max(-1, Math.min(1, ask * 1.2)); // (+1: rolling right, its right wing going down)
    const deg = Math.PI / 180;
    for (const { node, hinge, rest, to, back } of surfaces) {
      const side = hinge.side === 'L' ? 1 : -1;
      const angle = hinge.kind === 'flap' ? side * roll * 26 * deg : hinge.kind === 'elevator' ? side * roll * 10 * deg : -roll * 8 * deg;
      tools.turn.makeRotationAxis(tools.axis.fromArray(hinge.axis), angle);
      node.matrix.copy(to).multiply(tools.turn).multiply(back).multiply(rest);
    }
  });

  return (
    <>
      <directionalLight ref={key} position={[3, 5, 9]} intensity={0} />
      <directionalLight ref={rim} position={[-5, -2, -4]} intensity={0} color="#9db4ff" />
      <group ref={jet} visible={false}>
        <primitive object={model} />
      </group>
    </>
  );
}
