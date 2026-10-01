// The Graphics covers that are 3D scenes (src/three/miniScenes.ts): Mind Logistic's site's own Elixir bottle and
// Poucher can (~/Developer/MIND LOGISTIC/src/landing-assets, Bogdan's), made small for this site, and the Elixir
// gummies' Cherry Cola pouch (his model, below). The bottle's
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
const KB = join(homedir(), 'Developer', 'Bodgan Nenadović');
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

// The gummies' Cherry Cola pouch (2026-10-01): his model, made in Spline (sources/scenes/cherry-cola.glb in the
// knowledge base), a pillow pouch with no material nor UVs, the same mesh three times over: one of them, its faces
// split into its front and back by which way they face, each given the pouch's print by a flat projection from the
// front (ŻELKI ELIXIR/OKLADKA.png, scripts/prepare-media.py scenes: a sheet folded at the pouch's foot, its left half
// the front and its right half the back, both lying on their side, their feet at the fold; the halves' long edges
// trimmed a little, so the print keeps its proportions on the pouch's face), and stood up a quarter turn clockwise.
const ART = [4252 / 2, 1890]; // (the print's halves, px)
function glbMesh(file) {
  const data = readFileSync(file);
  const jsonLength = data.readUInt32LE(12);
  const json = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
  const bin = 20 + jsonLength + 8;
  const read = (i) => {
    const accessor = json.accessors[i];
    const view = json.bufferViews[accessor.bufferView];
    const Type = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[accessor.componentType];
    const count = accessor.count * { SCALAR: 1, VEC2: 2, VEC3: 3 }[accessor.type];
    const from = bin + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const bytes = data.subarray(from, from + count * Type.BYTES_PER_ELEMENT);
    return new Type(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  };
  const primitive = json.meshes[0].primitives[0];
  return { position: read(primitive.attributes.POSITION), normal: read(primitive.attributes.NORMAL), index: Uint32Array.from(read(primitive.indices)) };
}
const raw = glbMesh(join(KB, 'sources', 'scenes', 'cherry-cola.glb'));
const [lo, hi] = [[Infinity, Infinity], [-Infinity, -Infinity]];
for (let i = 0; i < raw.position.length; i += 3)
  for (let k = 0; k < 2; k++) [lo[k], hi[k]] = [Math.min(lo[k], raw.position[i + k]), Math.max(hi[k], raw.position[i + k])];
const [width, height] = [hi[0] - lo[0], hi[1] - lo[1]];
const trim = (1 - ART[0] / ART[1] / (width / height)) / 2; // (of the halves' height, at each long edge)
const side = (front) => {
  const map = new Map();
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  const p = raw.position;
  for (let t = 0; t < raw.index.length; t += 3) {
    const [a, b, c] = [raw.index[t], raw.index[t + 1], raw.index[t + 2]];
    // (which way the face looks: its normal's z, from its corners)
    const [ux, uy, vx, vy] = [p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[c * 3] - p[a * 3], p[c * 3 + 1] - p[a * 3 + 1]];
    if (ux * vy - uy * vx >= 0 !== front) continue;
    for (const v of [a, b, c]) {
      if (!map.has(v)) {
        map.set(v, position.length / 3);
        const [x, y, z] = [p[v * 3], p[v * 3 + 1], p[v * 3 + 2]];
        const [nx, ny, nz] = [raw.normal[v * 3], raw.normal[v * 3 + 1], raw.normal[v * 3 + 2]];
        position.push(y, -x, z); // (stood up: a quarter turn clockwise)
        normal.push(ny, -nx, nz);
        const across = (x - lo[0]) / width;
        uv.push(front ? across / 2 : 0.5 + (1 - across) / 2, trim + (1 - 2 * trim) * ((y - lo[1]) / height));
      }
      index.push(map.get(v));
    }
  }
  return { name: front ? 'front' : 'back', position: Float32Array.from(position), normal: Float32Array.from(normal), uv: Float32Array.from(uv), index: Uint32Array.from(index) };
};
const pouch = [side(true), side(false)];
writeFileSync(join(OUT, 'gummies.bin'), pack(pouch, boxOf(pouch)));

for (const [name, parts] of [['elixir', bottle], ['poucher', can], ['gummies', pouch]])
  console.log(name, parts.map((p) => `${p.name} ${p.position.length / 3}v ${p.index.length / 3}t`).join(', '));
