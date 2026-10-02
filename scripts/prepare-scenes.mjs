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
import { Box3, BufferAttribute, BufferGeometry, Vector3 } from 'three';
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
// knowledge base), a stand-up pouch with no material nor UVs, the same mesh three times over, standing as he made it
// (its full, rounded foot down: his call). One of them, split into its front and back (by which way its faces look,
// and its foot along its middle), is given the print (ŻELKI ELIXIR/OKLADKA.png, and OKLADKA V2.png the same way:
// scripts/prepare-media.py scenes) as the supplier's die line lays it out (OPAKOWANIA (żelki)/0-Overview.pdf): a
// sheet 360 by 160 mm, the front's panel (150 mm, its top at the sheet's left edge), the foot (60 mm, folded in), then
// the back's panel, its top at the right edge, the pouch's 160 mm running up and down the sheet. The model is in
// millimetres too (160 across), so across the print goes on at its size; down a side it runs from the top (the top's
// 9.5 mm seal left off) over the face and round the foot to its middle, the panel's own foot on the pouch's bottom
// edge: the model stands lower than the pouch (129 mm), so the print is pressed down by a twelfth to show all of it.
const SHEET = 360; // mm
const PANEL = 150;
const SEAL = 9.5;
function glbMesh(file, mesh = 0) {
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
  const primitive = json.meshes[mesh].primitives[0];
  return { position: read(primitive.attributes.POSITION), normal: read(primitive.attributes.NORMAL), index: Uint32Array.from(read(primitive.indices)) };
}
const raw = glbMesh(join(KB, 'sources', 'scenes', 'cherry-cola.glb'));
const p = raw.position;
const [lo, hi] = [[Infinity, Infinity], [-Infinity, -Infinity]];
for (let i = 0; i < p.length; i += 3)
  for (let k = 0; k < 2; k++) [lo[k], hi[k]] = [Math.min(lo[k], p[i + k]), Math.max(hi[k], p[i + k])];
const width = hi[0] - lo[0];
const press = (PANEL - SEAL) / (hi[1] - lo[1]); // (mm of print to a mm down the model)
// the foot (its rounding begins about 6 mm up): its front and back edges at each millimetre across
const foot = lo[1] + 6;
const edges = Array.from({ length: Math.ceil(width) + 1 }, () => [-Infinity, Infinity]);
for (let i = 0; i < p.length; i += 3) {
  if (p[i + 1] >= foot) continue;
  const edge = edges[Math.round(p[i] - lo[0])];
  [edge[0], edge[1]] = [Math.max(edge[0], p[i + 2]), Math.min(edge[1], p[i + 2])];
}
edges.forEach((edge, i) => {
  if (edge[0] > -Infinity) return; // (a millimetre with no vertex: from the nearest on either side)
  let [a, b] = [i, i];
  while (edges[a][0] === -Infinity) a--;
  while (edges[b][0] === -Infinity) b++;
  edges[i] = edges[a].map((v, j) => v + ((edges[b][j] - v) * (i - a)) / (b - a));
});
const edgeAt = (x) => edges[Math.round(x - lo[0])];
const side = (front) => {
  const map = new Map();
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  for (let t = 0; t < raw.index.length; t += 3) {
    const [a, b, c] = [raw.index[t], raw.index[t + 1], raw.index[t + 2]];
    // which side a face is on: on the foot, which side of its middle; elsewhere, which way it looks (its normal's z)
    const [cx, cy, cz] = [0, 1, 2].map((k) => (p[a * 3 + k] + p[b * 3 + k] + p[c * 3 + k]) / 3);
    const [ux, uy, vx, vy] = [p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[c * 3] - p[a * 3], p[c * 3 + 1] - p[a * 3 + 1]];
    const [ahead, behind] = edgeAt(cx);
    if ((cy < foot ? cz > (ahead + behind) / 2 : ux * vy - uy * vx >= 0) !== front) continue;
    for (const v of [a, b, c]) {
      if (!map.has(v)) {
        map.set(v, position.length / 3);
        const [x, y, z] = [p[v * 3], p[v * 3 + 1], p[v * 3 + 2]];
        position.push(x, y, z);
        normal.push(raw.normal[v * 3], raw.normal[v * 3 + 1], raw.normal[v * 3 + 2]);
        // how far down from the top, over the face and round the foot
        const [forth, back] = edgeAt(x);
        const down = hi[1] - y + (y < foot ? Math.max(0, front ? forth - z : z - back) : 0);
        const along = (SEAL + down * press) / SHEET;
        uv.push(front ? along : 1 - along, (x - lo[0]) / width);
      }
      index.push(map.get(v));
    }
  }
  return { name: front ? 'front' : 'back', position: Float32Array.from(position), normal: Float32Array.from(normal), uv: Float32Array.from(uv), index: Uint32Array.from(index) };
};
const pouch = [side(true), side(false)];
writeFileSync(join(OUT, 'gummies.bin'), pack(pouch, boxOf(pouch)));

// HYPE's wristband on a hand (2026-10-02, his call): the left hand of his Spline scene «Лампочка с руками» (the bulb
// between two reaching hands, the manifesto's idea: sources/3d in the knowledge base), its nails apart, in millimetres
// (its wrist 60 mm across), upright, the back of the hand towards us (across its palm, the way its nails look), its open
// wrist closed;
// and round the wrist the band as printed (250 by 19 mm), a loop a little loose (182 mm round), its tab (the print's left
// end, with the glue) laid over its blank tail, the middle of its print on the back of the wrist. public/scenes/hand.bin:
// the hand, the nails, the band (its print's UVs) and its white inside.
const MM = 65; // mm to a unit of his scene
const BAND = { long: 250, wide: 19, round: 182, over: 0.4, ramp: 8, middle: 104, up: 2.5 }; // mm: its size, its loop, how far its tab lies off the tail (and over how much it comes down to the wrist), its print's middle, its middle above the open wrist's
const idea = join(KB, 'sources', '3d', 'Лампочка с руками.glb');
const welded = ({ position, index }) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setIndex(new BufferAttribute(index, 1));
  return mergeVertices(geometry, 1e-4);
};
const skin = welded(glbMesh(idea, 11));
const rawNails = glbMesh(idea, 12);
const nails = welded(rawNails);
// the open wrist: the longest loop of edges with a triangle on one side only, run the way its triangles run
const corners = skin.getIndex().array;
const sides = (t) => [[corners[t], corners[t + 1]], [corners[t + 1], corners[t + 2]], [corners[t + 2], corners[t]]];
const uses = new Map();
for (let t = 0; t < corners.length; t += 3) for (const [a, b] of sides(t)) uses.set(Math.min(a, b) + ',' + Math.max(a, b), (uses.get(Math.min(a, b) + ',' + Math.max(a, b)) ?? 0) + 1);
const onward = new Map();
for (let t = 0; t < corners.length; t += 3) for (const [a, b] of sides(t)) if (uses.get(Math.min(a, b) + ',' + Math.max(a, b)) === 1) onward.set(a, b);
const loops = [];
const done = new Set();
for (const start of onward.keys()) {
  const loop = [];
  for (let v = start; v !== undefined && !done.has(v); v = onward.get(v)) {
    done.add(v);
    loop.push(v);
  }
  loops.push(loop);
}
const opening = loops.sort((a, b) => b.length - a.length)[0];
const skinAt = skin.getAttribute('position');
const point = (v) => new Vector3().fromBufferAttribute(skinAt, v);
const middleOf = (vs) => vs.reduce((sum, v) => sum.add(point(v)), new Vector3()).divideScalar(vs.length);
const wristMiddle = middleOf(opening);
// closed: a fan from its middle, each triangle running against the loop's edge it closes
const capped = [...corners];
const cap = skinAt.count;
for (let k = 0; k < opening.length; k++) capped.push(opening[(k + 1) % opening.length], opening[k], cap);
// the hand's frame: up from the open wrist to the hand's middle; towards us across the palm (the way the hand is thinnest
// round that, its spread's least), on the side its nails look to; across
const handMiddle = middleOf([...Array(skinAt.count).keys()]);
const up = handMiddle.clone().sub(wristMiddle).normalize();
const e1 = new Vector3(1, 0, 0).addScaledVector(up, -up.x).normalize();
const e2 = new Vector3().crossVectors(up, e1);
let [saa, sab, sbb] = [0, 0, 0];
for (let v = 0; v < skinAt.count; v++) {
  const d = point(v).sub(handMiddle);
  const [a, b] = [d.dot(e1), d.dot(e2)];
  [saa, sab, sbb] = [saa + a * a, sab + a * b, sbb + b * b];
}
const least = 0.5 * Math.atan2(2 * sab, saa - sbb) + Math.PI / 2;
const front = e1.clone().multiplyScalar(Math.cos(least)).addScaledVector(e2, Math.sin(least));
const look = new Vector3();
for (let i = 0; i < rawNails.normal.length; i += 3) look.add(new Vector3(rawNails.normal[i], rawNails.normal[i + 1], rawNails.normal[i + 2]));
if (front.dot(look) < 0) front.negate();
const across = new Vector3().crossVectors(up, front);
const origin = wristMiddle.clone().addScaledVector(up, BAND.up / MM);
const framed = (points) => {
  const out = new Float32Array(points.length);
  for (let i = 0; i < points.length; i += 3) {
    const d = new Vector3(points[i], points[i + 1], points[i + 2]).sub(origin);
    out.set([d.dot(across) * MM, d.dot(up) * MM, d.dot(front) * MM], i);
  }
  return out;
};
const solid = (name, position, index) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setIndex(new BufferAttribute(Uint32Array.from(index), 1));
  geometry.computeVertexNormals();
  return attributes(name, geometry, false);
};
const hand = solid('hand', framed([...skinAt.array, ...wristMiddle.toArray()]), capped);
const nailParts = solid('nails', framed(nails.getAttribute('position').array), nails.getIndex().array);
// the band's loop: the wrist within its width, seen along the arm (x across, z towards us), its outline (counterclockwise)
// let out all round (a circle's width further at its corners) till it is the loop's length
const ring = [];
for (let i = 0; i < hand.position.length; i += 3) if (Math.abs(hand.position[i + 1]) <= BAND.wide / 2) ring.push([hand.position[i], hand.position[i + 2]]);
const turn = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const sorted = ring.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [lower, upper] = [[], []];
for (const q of sorted) {
  while (lower.length > 1 && turn(lower.at(-2), lower.at(-1), q) <= 0) lower.pop();
  lower.push(q);
}
for (const q of [...sorted].reverse()) {
  while (upper.length > 1 && turn(upper.at(-2), upper.at(-1), q) <= 0) upper.pop();
  upper.push(q);
}
const outline = [...lower.slice(0, -1), ...upper.slice(0, -1)];
const lengthOf = (path) => path.reduce((sum, q, k) => sum + Math.hypot(q[0] - path[(k + 1) % path.length][0], q[1] - path[(k + 1) % path.length][1]), 0);
const out = Math.max(1, (BAND.round - lengthOf(outline)) / (2 * Math.PI));
const loose = [];
for (let k = 0; k < 4096; k++) {
  const a = (k / 4096) * 2 * Math.PI;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  const far = outline.reduce((best, q) => (q[0] * c + q[1] * s > best[0] * c + best[1] * s ? q : best));
  loose.push([far[0] + out * c, far[1] + out * s]);
}
const round = lengthOf(loose);
// a point on it so far along (mm, counterclockwise from its first point), and which way is out there
const at = (along) => {
  along = ((along % round) + round) % round;
  for (let k = 0; ; k++) {
    const [p, q] = [loose[k], loose[(k + 1) % loose.length]];
    const step = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (along <= step || k === loose.length - 1) {
      const f = step ? along / step : 0;
      return { x: p[0] + (q[0] - p[0]) * f, z: p[1] + (q[1] - p[1]) * f, nx: (q[1] - p[1]) / (step || 1), nz: -(q[0] - p[0]) / (step || 1) };
    }
    along -= step;
  }
};
// the back of the wrist: the loop's point furthest towards us; the print runs clockwise from there (to our right), its
// middle there
let [frontAlong, best] = [0, -Infinity];
for (let a = 0, s = 0; s < loose.length; s++) {
  const [p, q] = [loose[s], loose[(s + 1) % loose.length]];
  if (p[1] > best) [best, frontAlong] = [p[1], a];
  a += Math.hypot(q[0] - p[0], q[1] - p[1]);
}
const strip = (inside) => {
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  const columns = [];
  // (the tab's end over the tail, coming down to the wrist where the tail ends under it)
  for (let s = 0; s <= BAND.long; s += 0.5) columns.push([s, BAND.over * Math.min(1, Math.max(0, (BAND.long - round - s) / BAND.ramp))]);
  for (const [s, lift] of columns) {
    const p = at(frontAlong - (s - BAND.middle));
    const off = lift - (inside ? 0.15 : 0);
    for (const y of [-BAND.wide / 2, BAND.wide / 2]) {
      position.push(p.x + p.nx * off, y, p.z + p.nz * off);
      normal.push(inside ? -p.nx : p.nx, 0, inside ? -p.nz : p.nz);
      uv.push(s / BAND.long, y > 0 ? 1 : 0);
    }
  }
  for (let c = 0; c + 1 < columns.length; c++) {
    const [b0, t0, b1, t1] = [c * 2, c * 2 + 1, c * 2 + 2, c * 2 + 3];
    // (facing out: its outer side's normal; the inside facing in)
    const [a, b] = [new Vector3().fromArray(position, b0 * 3), new Vector3().fromArray(position, b1 * 3)];
    const face = new Vector3().subVectors(b, a).cross(new Vector3(0, 1, 0));
    const outwards = face.dot(new Vector3(normal[b0 * 3], 0, normal[b0 * 3 + 2])) > 0;
    index.push(...(outwards ? [b0, b1, t0, t0, b1, t1] : [b0, t0, b1, t0, t1, b1]));
  }
  return { name: inside ? 'inside' : 'band', position: Float32Array.from(position), normal: Float32Array.from(normal), ...(!inside && { uv: Float32Array.from(uv) }), index: Uint32Array.from(index) };
};
const worn = [hand, nailParts, strip(false), strip(true)];
writeFileSync(join(OUT, 'hand.bin'), pack(worn, boxOf(worn)));
console.log(`hand: its open wrist ${opening.length} edges (its other holes, the nails': ${loops.slice(1).filter((l) => l.length).map((l) => l.length).join(' ')}), the wrist ${lengthOf(outline).toFixed(0)} mm round, the loop ${round.toFixed(0)} mm (let out ${out.toFixed(1)} mm)`);

for (const [name, parts] of [['elixir', bottle], ['poucher', can], ['gummies', pouch], ['hand', worn]])
  console.log(name, parts.map((p) => `${p.name} ${p.position.length / 3}v ${p.index.length / 3}t`).join(', '));
