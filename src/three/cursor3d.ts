import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * A 3D cursor for mouse users: an extruded arrow in thin-film iridescent chrome (like the pointer in
 * the brand kit). Its tip is the hotspot, drawn exactly where the system cursor would be. It banks
 * with the movement; near anything clickable it grows, turns to point at it and spins, so buttons
 * are easy to find. The canvas is small and travels with the pointer, so the page pays for a 180 px
 * square, not a full-screen layer.
 */

const SIZE = 180; // CSS px, the canvas that follows the pointer
const REACH = 120; // px from a control at which the cursor starts to react
const CLICKABLE = 'a[href], button, [role="button"], summary, label, input, select, textarea';

export function mountCursor() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    pointerEvents: 'none',
    zIndex: '2147483647',
    willChange: 'transform',
    visibility: 'hidden',
  });
  document.body.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(SIZE, SIZE, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  // White key plus coloured rims, for the holographic edges of the brand-kit pointer.
  const lights: [string, number, [number, number, number]][] = [
    ['#ffffff', 1.4, [-160, 220, 300]],
    ['#ff4fd8', 4.5, [-300, -60, 60]],
    ['#3ee8ff', 4.5, [300, 80, 60]],
    ['#ffb23e', 3, [60, -300, 40]],
  ];
  for (const [color, intensity, position] of lights) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }

  // 1 unit = 1 CSS px on the z = 0 plane; the canvas centre is the hotspot.
  const fov = 30;
  const camera = new THREE.PerspectiveCamera(fov, 1, 1, 2000);
  camera.position.z = SIZE / 2 / Math.tan(((fov / 2) * Math.PI) / 180);

  // Navigation-style arrow pointing up, tip at the origin.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(12.5, -31);
  shape.quadraticCurveTo(13, -33, 11, -32.2);
  shape.lineTo(0, -24.5);
  shape.lineTo(-11, -32.2);
  shape.quadraticCurveTo(-13, -33, -12.5, -31);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 5,
    bevelEnabled: true,
    bevelThickness: 2.6,
    bevelSize: 1.8,
    bevelSegments: 6,
    curveSegments: 6,
  });
  geometry.translate(0, 1.5, -2.5); // keep the bevelled tip on the hotspot, centre the thickness
  const material = new THREE.MeshPhysicalMaterial({
    color: '#3a2ad8',
    metalness: 0.85,
    roughness: 0.16,
    iridescence: 1,
    iridescenceIOR: 2.2,
    iridescenceThicknessRange: [120, 1100],
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
  });
  const arrow = new THREE.Mesh(geometry, material);
  const pivot = new THREE.Group(); // rotates and scales around the tip
  pivot.add(arrow);
  scene.add(pivot);

  const style = document.createElement('style');
  style.textContent = 'html.cursor-3d, html.cursor-3d * { cursor: none !important; }';
  document.head.appendChild(style);

  const pointer = { x: -999, y: -999, vx: 0, vy: 0, inside: false, down: false };
  const pose = { scale: 1, aim: 0, spin: 0, tiltX: 0, tiltY: 0, press: 1 };
  const REST = 0.52; // like a system cursor: tilted up and to the left
  let targets: Element[] = [];
  let targetsAt = 0;
  let raf = 0;
  let last = performance.now();

  // Nearest clickable element: distance to its box and the direction to its centre.
  const nearest = () => {
    const now = performance.now();
    if (now - targetsAt > 800) {
      targets = [...document.querySelectorAll(CLICKABLE)];
      targetsAt = now;
    }
    let best = Infinity;
    let angle = 0;
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom < -REACH || r.top > innerHeight + REACH) continue;
      const dx = Math.max(r.left - pointer.x, 0, pointer.x - r.right);
      const dy = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d < best) {
        best = d;
        angle = Math.atan2(-(r.top + r.height / 2 - pointer.y), r.left + r.width / 2 - pointer.x);
      }
    }
    return { distance: best, angle };
  };

  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { distance, angle } = nearest();
    const near = Math.max(0, 1 - distance / REACH) ** 2; // 0 far away … 1 on the control
    const k = (rate: number) => 1 - Math.exp(-dt * rate);

    pose.scale += (1 + near * 0.75 - pose.scale) * k(10);
    pose.press += ((pointer.down ? 0.82 : 1) - pose.press) * k(18);
    // point at the control while approaching (the arrow is modelled pointing up: +π/2); on it, and far
    // from everything, rest like a system cursor so the label stays readable
    const want = near > 0.02 && distance > 0 ? angle - Math.PI / 2 : REST;
    let diff = want - pose.aim;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    pose.aim += diff * k(4 + near * 8);
    // spin around its own axis while close, settle flat when leaving
    if (near > 0.02) pose.spin += dt * (2 + near * 7);
    else pose.spin += (Math.round(pose.spin / (Math.PI * 2)) * Math.PI * 2 - pose.spin) * k(6);
    pose.tiltX += (Math.max(-0.7, Math.min(0.7, pointer.vy * 0.004)) - pose.tiltX) * k(8);
    pose.tiltY += (Math.max(-0.7, Math.min(0.7, pointer.vx * 0.004)) - pose.tiltY) * k(8);
    pointer.vx *= 1 - k(12);
    pointer.vy *= 1 - k(12);

    pivot.rotation.set(pose.tiltX, pose.tiltY, pose.aim, 'ZXY');
    arrow.rotation.y = pose.spin;
    pivot.scale.setScalar(pose.scale * pose.press);
    renderer.render(scene, camera);

    const moving =
      near > 0.02 || Math.abs(diff) > 0.002 || Math.abs(pointer.vx) + Math.abs(pointer.vy) > 1 || Math.abs(pose.scale - 1) > 0.002 || Math.abs(pose.press - 1) > 0.002;
    const spinning = Math.abs(pose.spin % (Math.PI * 2)) > 0.002;
    if (pointer.inside && (moving || spinning)) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (pointer.x > -999) {
      pointer.vx += e.clientX - pointer.x;
      pointer.vy += e.clientY - pointer.y;
    }
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    canvas.style.transform = `translate3d(${pointer.x - SIZE / 2}px, ${pointer.y - SIZE / 2}px, 0)`;
    if (!pointer.inside) {
      pointer.inside = true;
      canvas.style.visibility = 'visible';
      document.documentElement.classList.add('cursor-3d');
    }
    wake();
  };
  const onLeave = (e: PointerEvent) => {
    if (e.relatedTarget) return;
    pointer.inside = false;
    canvas.style.visibility = 'hidden';
  };
  const onDown = () => {
    pointer.down = true;
    wake();
  };
  const onUp = () => {
    pointer.down = false;
    wake();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', wake, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', wake);
    document.documentElement.classList.remove('cursor-3d');
    style.remove();
    geometry.dispose();
    material.dispose();
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
