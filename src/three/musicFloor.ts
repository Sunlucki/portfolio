import type { Camera } from 'three';

/**
 * The Music stage's floor and the camera that sees it (three/MusicStage.tsx), shared with the particle scene behind
 * the sections (three/FlowScene.tsx), whose particles build the floor's rim and PLAY as the Music section comes up:
 * they land where the stage draws them.
 */

export const RIM = 1.9; // the floor's radius, where the progress runs
export const SQUASH = 0.57; // how much the floor shortens, seen from the camera: the button is drawn taller to read upright
export const FOV = 32;
const ELEVATION = 0.5; // the camera, above him as the photo was taken
const DISTANCE = 8;

// The camera looks down at him from where the photo was taken, and stays there: he holds still.
export function placeCamera(camera: Camera) {
  camera.position.set(0, 0.95 + Math.sin(ELEVATION) * DISTANCE, Math.cos(ELEVATION) * DISTANCE);
  camera.lookAt(0, 0.9, 0);
}

// PLAY: a triangle pointing right, drawn as seen (u across, v up the screen), its centroid at his feet
const PLAY_AT = [
  [-0.52, 0.72],
  [-0.52, -0.72],
  [1.05, 0],
];
// a point in it, laid on the floor: a quarter of them on its edges, so it reads crisp
export function inPlay(): [number, number, number] {
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
