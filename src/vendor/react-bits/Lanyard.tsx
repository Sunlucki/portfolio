/*
 * Lanyard — after React Bits' Lanyard (https://reactbits.dev/components/lanyard), adapted for HYPE's event badges
 * (2026-10-01, Bogdan's call): its badge model without its own picture (public/models/badge.glb, from
 * scripts/prepare-media.py badge), the badges drawn on it (their fronts in turn, one back for all), the strap's picture
 * given, framed for the Graphics project's landscape slot, a tap turning in the next badge (and by itself every few
 * seconds), touch scrolling held off only while the badge is dragged.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0:
 * permission is granted to use, copy, modify, merge, publish and distribute the Software as part of
 * an application, website or product; the components themselves may not be sold, sublicensed or
 * redistributed on their own. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 * Full license: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, type RapierRigidBody, type RigidBodyProps } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const MODEL = '/models/badge.glb';
// The card's faces in its model's UV map: its front on the left half, its back on the right (measured from the
// model), and the card's width to its height there (0.716 by 1): a side's middle at those proportions is stretched
// over its face's place, so it comes out unstretched on the card.
const FRONT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK = { x: 0.5, y: 0, w: 0.5, h: 0.757 };
const FACE = 0.7164;
const ATLAS = 1536;
const NEXT_S = 6; // seconds a badge hangs before the next one turns in by itself
const FOV = 20;
const TILE = 4; // the strap's picture's width to its height: a tile is that many times as long as the strap is wide
const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LINE: [ConstructorParameters<typeof MeshLineMaterial>[0]] = [{ resolution: new THREE.Vector2(1000, 1000) }]; // (the strap's material, made once)

type LanyardProps = { fronts: string[]; back: string; strap: string; onReady?: () => void };

export default function Lanyard({ fronts, back, strap, onReady }: LanyardProps) {
  const [phone] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  // touch: the page scrolls through it (pan-y), except while the badge is held
  const holding = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const hold = (e: TouchEvent) => holding.current && e.cancelable && e.preventDefault();
    el.addEventListener('touchmove', hold, { passive: false });
    return () => el.removeEventListener('touchmove', hold);
  }, []);
  return (
    <div ref={wrap} className="h-full w-full" style={{ touchAction: 'pan-y' }}>
      <Canvas camera={{ position: [0, -0.25, 13], fov: FOV }} dpr={[1, phone ? 1.5 : 2]} onCreated={({ gl }) => gl.setClearColor(0x0b0b0e, 1)}>
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics gravity={[0, -40, 0]} timeStep={phone ? 1 / 30 : 1 / 60}>
            <Band phone={phone} fronts={fronts} back={back} strap={strap} onReady={onReady} onHold={(on) => (holding.current = on)} />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            {/* (React Bits' 10 here washed the dark badges out white as they turned towards it, its reflection over all of them) */}
            <Lightformer intensity={2.5} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}

type Body = RapierRigidBody & { lerped?: THREE.Vector3 };

function Band({
  phone,
  fronts,
  back,
  strap,
  onReady,
  onHold,
  maxSpeed = 50,
  minSpeed = 0,
}: LanyardProps & { phone: boolean; onHold: (on: boolean) => void; maxSpeed?: number; minSpeed?: number }) {
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null!);
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<Body>(null!);
  const j2 = useRef<Body>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const [vec, ang, rot, dir] = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], []);
  const segment: RigidBodyProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const lerped = (body: Body) => (body.lerped ??= new THREE.Vector3().copy(body.translation()));
  const resolution: [number, number] = phone ? [1000, 2000] : [1000, 1000]; // (the strap's, React Bits')

  const { nodes, materials } = useGLTF(MODEL) as unknown as { nodes: Record<string, THREE.Mesh>; materials: Record<string, THREE.MeshStandardMaterial> };
  const strapMap = useTexture(strap, (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
  });
  const sides = useTexture([...fronts, back]);
  // the card's picture: the badge shown on its front, the back on its back
  const atlas = useMemo(() => {
    const canvas = Object.assign(document.createElement('canvas'), { width: ATLAS, height: ATLAS });
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false; // (glTF's UVs)
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    const draw = (image: CanvasImageSource & { width: number; height: number }, at: typeof FRONT) => {
      const g = canvas.getContext('2d')!;
      const [w, h] = image.width / image.height > FACE ? [image.height * FACE, image.height] : [image.width, image.width / FACE];
      g.fillStyle = '#0b0b0b';
      g.fillRect(at.x * ATLAS, at.y * ATLAS, at.w * ATLAS, at.h * ATLAS);
      g.drawImage(image, (image.width - w) / 2, (image.height - h) / 2, w, h, at.x * ATLAS, at.y * ATLAS, at.w * ATLAS, at.h * ATLAS);
      texture.needsUpdate = true;
    };
    const image = (n: number) => sides[n].image as CanvasImageSource & { width: number; height: number };
    canvas.getContext('2d')!.fillStyle = '#0b0b0b';
    canvas.getContext('2d')!.fillRect(0, 0, ATLAS, ATLAS);
    draw(image(fronts.length), BACK);
    draw(image(0), FRONT);
    return { texture, show: (n: number) => draw(image(n), FRONT) };
  }, [sides, fronts.length]);
  useEffect(() => () => atlas.texture.dispose(), [atlas]);

  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], false, 'chordal'));
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const press = useRef<{ x: number; y: number; t: number } | null>(null);
  // the badge shown, the next one turning in (a spin, swapped as the card shows its edge), when it last changed
  const shown = useRef(0);
  const turn = useRef<{ to: number; kick: boolean; since: number } | null>(null);
  const last = useRef(0);
  const frames = useRef(0);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  const clock = useThree((state) => state.clock);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    if (frames.current === 0) last.current = time; // (the first badge hangs its while from when it shows, however long the rest took to load)
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const at = lerped(ref.current);
        const distance = Math.max(0.1, Math.min(1, at.distanceTo(ref.current.translation())));
        at.lerp(ref.current.translation(), delta * (minSpeed + distance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(lerped(j2.current));
      curve.points[2].copy(lerped(j1.current));
      curve.points[3].copy(fixed.current.translation());
      const points = curve.getPoints(phone ? 16 : 32);
      band.current.geometry.setPoints(points);
      // as many tiles of its picture along the strap as keep the logo's proportions (his call: it was squashed): meshline
      // makes a strap hanging upright tan(fov / 2) wide for each of the canvas's width to its height, over the
      // resolution's width to its height
      let length = 0;
      for (let k = 1; k < points.length; k++) length += points[k].distanceTo(points[k - 1]);
      const wide = (Math.tan((FOV / 2) * (Math.PI / 180)) * (state.size.width / state.size.height) * resolution[1]) / resolution[0];
      band.current.material.repeat.set(-length / (TILE * wide), 1);
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
    // the next badge: a spin, and the card's picture swapped as it shows its edge (or soon anyway)
    const next = turn.current;
    if (next && card.current) {
      // (once the card hangs free again: let go, it is a dynamic body from the next step)
      if (next.kick && !dragged && card.current.isDynamic()) {
        card.current.wakeUp();
        card.current.setAngvel({ x: 0, y: 16, z: 0 }, true); // (on to 150°, its edge at 0.12 s, back to its front)
        next.kick = false;
      }
      const q = card.current.rotation();
      if (1 - 2 * (q.x * q.x + q.y * q.y) < 0.1 || time - next.since > 1.5) {
        atlas.show(next.to);
        shown.current = next.to;
        turn.current = null;
        last.current = time;
      }
    } else if (!still && !dragged && time - last.current > NEXT_S) turn.current = { to: (shown.current + 1) % fronts.length, kick: true, since: time };
    if (++frames.current === 2) onReady?.();
  });

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segment} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segment} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segment} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segment} type="dynamic">
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segment} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              (e.target as unknown as Element).setPointerCapture(e.pointerId);
              onHold(true);
              last.current = clock.elapsedTime;
              press.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now() };
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
            onPointerUp={(e: ThreeEvent<PointerEvent>) => {
              (e.target as unknown as Element).releasePointerCapture(e.pointerId);
              onHold(false);
              drag(false);
              const p = press.current;
              press.current = null;
              // a tap, not a drag: the next badge
              if (p && !turn.current && Math.hypot(e.nativeEvent.clientX - p.x, e.nativeEvent.clientY - p.y) < 6 && performance.now() - p.t < 350)
                turn.current = { to: (shown.current + 1) % fronts.length, kick: true, since: clock.elapsedTime };
            }}
            onPointerCancel={() => {
              onHold(false);
              press.current = null;
              drag(false);
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              {/* (a laminated card, not a metal one: React Bits' 0.8 metal washed the badges out white as they turned to its lights) */}
              <meshPhysicalMaterial map={atlas.texture} clearcoat={phone ? 0 : 1} clearcoatRoughness={0.15} roughness={0.6} metalness={0.2} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial args={LINE} color="white" depthTest={false} resolution={resolution} useMap={1} map={strapMap} lineWidth={1} />
      </mesh>
    </>
  );
}
