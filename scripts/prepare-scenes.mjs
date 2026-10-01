// The Graphics covers that are 3D scenes (src/three/miniScenes.ts): Mind Logistic's site's own Elixir bottle and
// Poucher can (~/Developer/MIND LOGISTIC/src/landing-assets, Bogdan's), made small for this site. The bottle's
// meshes as the site makes them on load (welded, normals smoothed); the can's labels whole and its black body
// (100,000 triangles, most of the 7.7 MB the model is as text) simplified by meshoptimizer, as far as it can go
// without moving a vertex more than a thousandth of the part's size. Each becomes public/scenes/<name>.bin: the length of
// a JSON head (the meshes in the model's order: name, vertices, triangles, their UVs' range if they have any; and
// the box positions are quantised over), the head, then for each mesh, each part starting on 4 bytes: positions
// (16 bits a coordinate, over the box), normals (8 bits a coordinate), UVs (16 bits, over their range) and the
// triangles (16-bit indices, or 32 past 65,535 vertices). The labels' pictures: scripts/prepare-media.py scenes.
// Usage: node scripts/prepare-scenes.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Box3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const ASSETS = join(homedir(), 'Developer', 'MIND LOGISTIC', 'src', 'landing-assets');
const OUT = 'public/scenes';
const ERROR = 0.001; // of the model's size, the most a simplified vertex may move

const meshes = (file) => {
  const found = [];
  new OBJLoader().parse(readFileSync(join(ASSETS, file), 'utf8')).traverse((child) => child.isMesh && found.push(child));
  return found;
};

// the black body's parts: welded without their UVs (they have no texture), then simplified
async function simplify(geometry) {
  geometry.deleteAttribute('uv');
  geometry = mergeVertices(geometry, 1e-6);
  await MeshoptSimplifier.ready;
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const positions = new Float32Array(position.array);
  const normals = new Float32Array(normal.array);
  const index = new Uint32Array(geometry.getIndex().array);
  // (the error is meshoptimizer's: a fraction of the part's size; the normals weigh in, so the shading holds)
  const [kept] = MeshoptSimplifier.simplifyWithAttributes(index, positions, 3, normals, 3, [0.5, 0.5, 0.5], null, 3, ERROR);
  const [remap, unique] = MeshoptSimplifier.compactMesh(kept);
  const pick = (array, size) => {
    const out = new Float32Array(unique * size);
    remap.forEach((to, from) => to !== 0xffffffff && out.set(array.subarray(from * size, from * size + size), to * size));
    return out;
  };
  return { position: pick(positions, 3), normal: pick(normals, 3), index: kept };
}

function pack(parts, box) {
  const [x0, y0, z0] = box.min.toArray();
  const [x1, y1, z1] = box.max.toArray();
  const size = [x1 - x0, y1 - y0, z1 - z0];
  const head = { box: [x0, y0, z0, x1, y1, z1], meshes: [] };
  const blobs = [];
  for (const { name, position, normal, uv, index } of parts) {
    const count = position.length / 3;
    const q = new Uint16Array(count * 3);
    for (let i = 0; i < q.length; i++) q[i] = Math.round(((position[i] - [x0, y0, z0][i % 3]) / size[i % 3]) * 65535);
    const n = new Int8Array(count * 3);
    for (let i = 0; i < count; i++) {
      const len = Math.hypot(normal[i * 3], normal[i * 3 + 1], normal[i * 3 + 2]) || 1;
      for (let k = 0; k < 3; k++) n[i * 3 + k] = Math.round((normal[i * 3 + k] / len) * 127);
    }
    let range = null;
    if (uv) {
      let [u0, v0, u1, v1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i = 0; i < count; i++) {
        [u0, u1] = [Math.min(u0, uv[i * 2]), Math.max(u1, uv[i * 2])];
        [v0, v1] = [Math.min(v0, uv[i * 2 + 1]), Math.max(v1, uv[i * 2 + 1])];
      }
      range = [u0, v0, u1, v1];
      const t = new Uint16Array(count * 2);
      for (let i = 0; i < count; i++) {
        t[i * 2] = Math.round(((uv[i * 2] - u0) / (u1 - u0 || 1)) * 65535);
        t[i * 2 + 1] = Math.round(((uv[i * 2 + 1] - v0) / (v1 - v0 || 1)) * 65535);
      }
      blobs.push(q, n, t);
    } else blobs.push(q, n);
    blobs.push(count > 65535 ? Uint32Array.from(index) : Uint16Array.from(index));
    head.meshes.push({ name, vertices: count, triangles: index.length / 3, ...(range && { uv: range }) });
  }
  const json = Buffer.from(JSON.stringify(head));
  const chunks = [Buffer.from(new Uint32Array([json.length]).buffer), json];
  let at = 4 + json.length;
  for (const blob of blobs) {
    const pad = (4 - (at % 4)) % 4;
    chunks.push(Buffer.alloc(pad), Buffer.from(blob.buffer, blob.byteOffset, blob.byteLength));
    at += pad + blob.byteLength;
  }
  return Buffer.concat(chunks);
}

const indexOf = (geometry) => (geometry.getIndex() ? Uint32Array.from(geometry.getIndex().array) : Uint32Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i));
const attributes = (name, geometry, uv = true) => ({
  name,
  position: geometry.getAttribute('position').array,
  normal: geometry.getAttribute('normal').array,
  ...(uv && geometry.getAttribute('uv') && { uv: geometry.getAttribute('uv').array }),
  index: indexOf(geometry),
});
const boxOf = (parts) => {
  const box = new Box3();
  for (const { position } of parts) for (let i = 0; i < position.length; i += 3) box.expandByPoint({ x: position[i], y: position[i + 1], z: position[i + 2] });
  return box;
};

mkdirSync(OUT, { recursive: true });

// the bottle, as the site has it once loaded: welded within 0.0001 and its normals smoothed
const bottle = meshes('ELIXIR/LowPolyBottle.obj').map((mesh) => {
  const geometry = mergeVertices(mesh.geometry, 1e-4);
  geometry.computeVertexNormals();
  return attributes(mesh.name, geometry);
});
writeFileSync(join(OUT, 'elixir.bin'), pack(bottle, boxOf(bottle)));

// the can: its labels whole, its body simplified
const can = [];
for (const mesh of meshes('POUCHER/POUCHER V2.obj')) {
  if (/label/i.test(mesh.name)) can.push(attributes(mesh.name, mergeVertices(mesh.geometry, 1e-7)));
  else can.push({ name: mesh.name, ...(await simplify(mesh.geometry)) });
}
writeFileSync(join(OUT, 'poucher.bin'), pack(can, boxOf(can)));

for (const [name, parts] of [['elixir', bottle], ['poucher', can]])
  console.log(name, parts.map((p) => `${p.name} ${p.position.length / 3}v ${p.index.length / 3}t`).join(', '));
