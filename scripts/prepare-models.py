#!/usr/bin/env python3
"""The manifesto's heart, idea and brain as light point sets (src/three/ManifestoScene.tsx), baked from models:

  public/manifesto/heart.bin — "Realistic Human Heart" by neshallads (Sketchfab, CC BY 4.0)
  public/manifesto/brain.bin — "Low-Poly Human Brain Model" by moaazzizo123 (Sketchfab, CC BY 4.0)
  public/manifesto/idea.bin  — Bogdan's Spline scene "Лампочка с руками": a bulb between two reaching hands

The heart's and the brain's folds, vessels and fat live in their base colour texture, not in the geometry, so
points are scattered over each surface by area and kept by the texture's brightness: light gyri dense, dark
sulci and vessels sparse. The idea has no textures; its points carry the part they sit on instead (hand, nail,
glass, base, the bolt inside), each part getting a fixed share. Each point is 4 bytes: x, y, z quantised over
-1..1 (the model's longest side), then its brightness or its part. The models (4 to 8 MB) never reach the site.
"""
import io, json, os, struct
import numpy as np
from PIL import Image

KB = os.path.join(os.path.expanduser("~"), "Developer", "Bodgan Nenadović")
SRC = os.path.join(KB, "sources", "3d")
OUT = os.path.join(KB, "portfolio", "public", "manifesto")
POINTS = 20000
COMP = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
SIZE = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def read(path):
    data = open(path, "rb").read()
    doc, binary, off = None, None, 12
    while off < len(data):
        length, kind = struct.unpack_from("<I4s", data, off)
        chunk = data[off + 8 : off + 8 + length]
        if kind == b"JSON":
            doc = json.loads(chunk)
        elif kind == b"BIN\x00":
            binary = chunk
        off += 8 + length
    return doc, binary


def accessor(doc, binary, i):
    a = doc["accessors"][i]
    view = doc["bufferViews"][a["bufferView"]]
    dtype, n = np.dtype(COMP[a["componentType"]]), SIZE[a["type"]]
    start = view.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = view.get("byteStride", 0) or dtype.itemsize * n
    raw = np.frombuffer(binary, np.uint8, stride * (a["count"] - 1) + dtype.itemsize * n, start)
    rows = np.lib.stride_tricks.as_strided(raw, (a["count"], dtype.itemsize * n), (stride, 1)).copy()
    return rows.view(dtype).reshape(a["count"], n)


def node_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"], float).reshape(4, 4).T
    x, y, z, w = node.get("rotation", [0, 0, 0, 1])
    r = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    m = np.eye(4)
    m[:3, :3] = r * np.array(node.get("scale", [1, 1, 1]), float)
    m[:3, 3] = node.get("translation", [0, 0, 0])
    return m


def parts(path, part_of):
    """World-space triangles by part: `part_of(node name, lowest corner, highest corner)` names each mesh's part,
    or None to skip it."""
    doc, binary = read(path)
    out = {}

    def walk(i, parent):
        node = doc["nodes"][i]
        m = parent @ node_matrix(node)
        for prim in doc["meshes"][node["mesh"]]["primitives"] if "mesh" in node else []:
            pos = accessor(doc, binary, prim["attributes"]["POSITION"]).astype(float) @ m[:3, :3].T + m[:3, 3]
            part = part_of(node.get("name", "").strip(), pos.min(0), pos.max(0))
            if part is not None:
                idx = accessor(doc, binary, prim["indices"]).ravel() if "indices" in prim else np.arange(len(pos))
                out.setdefault(part, []).append(pos[idx.reshape(-1, 3)])
        for c in node.get("children", []):
            walk(c, m)

    for root in doc["scenes"][doc.get("scene", 0)]["nodes"]:
        walk(root, np.eye(4))
    return {part: np.concatenate(tris) for part, tris in out.items()}


def scatter(tris, n, rng):
    """`n` points over triangles, by area."""
    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    k = rng.choice(len(tris), n, p=area / area.sum())
    u, v = rng.random(n), rng.random(n)
    flip = u + v > 1
    u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    return a[k] + (b[k] - a[k]) * u[:, None] + (c[k] - a[k]) * v[:, None]


def quantise(p, tag):
    p = p - (p.min(0) + p.max(0)) / 2
    p = p / np.abs(p).max()
    q = np.round((p + 1) * 127.5).clip(0, 255).astype(np.uint8)
    return np.column_stack([q, tag]).astype(np.uint8)


def mesh(path):
    """World-space triangles, their UVs and the base colour texture's luminance."""
    doc, binary = read(path)
    tris, uvs = [], []

    def walk(i, parent):
        node = doc["nodes"][i]
        m = parent @ node_matrix(node)
        for prim in doc["meshes"][node["mesh"]]["primitives"] if "mesh" in node else []:
            pos = accessor(doc, binary, prim["attributes"]["POSITION"]).astype(float) @ m[:3, :3].T + m[:3, 3]
            uv = accessor(doc, binary, prim["attributes"]["TEXCOORD_0"]).astype(float)
            idx = accessor(doc, binary, prim["indices"]).ravel().reshape(-1, 3)
            tris.append(pos[idx])
            uvs.append(uv[idx])
        for c in node.get("children", []):
            walk(c, m)

    for root in doc["scenes"][doc.get("scene", 0)]["nodes"]:
        walk(root, np.eye(4))
    image = doc["images"][doc["textures"][doc["materials"][0]["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"]]
    view = doc["bufferViews"][image["bufferView"]]
    texture = Image.open(io.BytesIO(binary[view.get("byteOffset", 0) : view.get("byteOffset", 0) + view["byteLength"]]))
    luma = np.asarray(texture.convert("L"), float) / 255
    return np.concatenate(tris), np.concatenate(uvs), luma


def bake(name, keep, rng):
    tris, uvs, luma = mesh(os.path.join(SRC, name))
    a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    points, shades = [], []
    while sum(len(p) for p in points) < POINTS:
        k = rng.choice(len(tris), 200000, p=area / area.sum())
        u, v = rng.random(len(k)), rng.random(len(k))
        flip = u + v > 1
        u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
        p = a[k] + (b[k] - a[k]) * u[:, None] + (c[k] - a[k]) * v[:, None]
        t = uvs[k, 0] + (uvs[k, 1] - uvs[k, 0]) * u[:, None] + (uvs[k, 2] - uvs[k, 0]) * v[:, None]
        h, w = luma.shape
        shade = luma[np.clip((t[:, 1] % 1) * h, 0, h - 1).astype(int), np.clip((t[:, 0] % 1) * w, 0, w - 1).astype(int)]
        chosen = rng.random(len(k)) < keep(shade)
        points.append(p[chosen])
        shades.append(shade[chosen])
    p = np.concatenate(points)[:POINTS]
    shade = np.concatenate(shades)[:POINTS]
    return quantise(p, np.round(np.clip(shade, 0, 1) * 255).astype(np.uint8))


# The idea's parts (as ManifestoScene reads them) and their shares of the points.
IDEA = {"hand": (0, 0.48), "nail": (1, 0.04), "glass": (2, 0.3), "base": (3, 0.06), "bolt": (4, 0.12)}


def idea_part(name, lo, hi):
    if (hi - lo).max() > 20:  # the scene's backdrop sphere
        return None
    if name.startswith("Рука"):
        return "hand"
    if name.startswith("Ногти"):
        return "nail"
    if name == "Sphere":  # the bulb's outer glass (Sphere 2, just inside it, is left out)
        return "glass"
    if name.startswith("Cylinder") or name.startswith("Helix"):
        return "base"
    if name.startswith("Cube"):  # the bolt in the middle of the bulb; the stem below it belongs to the base
        return "bolt" if (lo[1] + hi[1]) / 2 > -0.2 else "base"
    return None  # the hidden text


def bake_idea(rng):
    tris = parts(os.path.join(SRC, "Лампочка с руками.glb"), idea_part)
    points, tags = [], []
    for part, (tag, share) in IDEA.items():
        n = round(POINTS * share)
        points.append(scatter(tris[part], n, rng))
        tags.append(np.full(n, tag, np.uint8))
    return quantise(np.concatenate(points), np.concatenate(tags))


if __name__ == "__main__":
    rng = np.random.default_rng(7)
    os.makedirs(OUT, exist_ok=True)
    jobs = {
        # muscle dark, fat light, vessels darker still: keep the muscle, favour the fat
        "heart.bin": ("realistic_human_heart.glb", lambda s: 0.35 + 0.65 * np.clip((s - 0.1) / 0.5, 0, 1)),
        # gyri light, sulci and vessels dark: the folds come out as gaps
        "brain.bin": ("low-poly_human_brain_model.glb", lambda s: np.clip((s - 0.35) / 0.35, 0, 1) ** 2.2),
    }
    baked = {out: bake(src, keep, rng) for out, (src, keep) in jobs.items()}
    baked["idea.bin"] = bake_idea(rng)
    for out, data in baked.items():
        with open(os.path.join(OUT, out), "wb") as fh:
            fh.write(data.tobytes())
        print(out, len(data), "points,", os.path.getsize(os.path.join(OUT, out)) // 1024, "KB")
