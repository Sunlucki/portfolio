#!/usr/bin/env python3
"""The F-22 in the Graphics section (src/three/RaptorScene.tsx, 2026-10-06, Bogdan's call): "F22 Raptor" by Aleksander
Kähler (Sketchfab, CC BY 4.0), the one of his two downloads with a rig, kept in the knowledge base as
sources/3d/f22_raptor.glb, made small for the site as public/models/raptor.glb:

- the pose 2.5 s into its animation baked in: its landing gear up, the bays' doors shut;
- left out: its ground, its rig (the Maya controls, no meshes), its lights, and what is inside with the gear up (the
  nose leg with its lights, the main wheels, the hinges: 31,000 of its 35,000 vertices), and the animation itself;
- its control surfaces (the four flaperons, the two stabilators, the two rudders) given their hinge in their extras:
  an axis and a point on it, in their parent's space, so that turning one about it by a positive angle swings its
  trailing edge down (the rudders': to the left, +x, as the pilot sits). The animation swings the flaperons and the
  stabilators, so their hinges come from two of its poses (the one rigid turn between them); the rudders it leaves
  still, so theirs come from their shape: along their front edge.

The model's frame: nose +z, up +y, left wing +x. Run with a Python that has numpy (/usr/bin/python3).
"""
import json, os, struct
import numpy as np

KB = os.path.join(os.path.expanduser("~"), "Developer", "Bodgan Nenadović")
SRC = os.path.join(KB, "sources", "3d", "f22_raptor.glb")
OUT = os.path.join(KB, "portfolio", "public", "models", "raptor.glb")
UP_AT = 2.5  # s into the animation: the gear up
DROP = {"Ground", "F22_Raptor_Rig", "bottom1", "mirrorCutPlane1", "Right_Point_Light", "Left_Point_Light", "emitter1", "emitter2",
        "particle1", "Front_Landing_Gear", "Left_Landing_Gear_Wheel", "Right_Landing_Gear_Wheel", "Left_Hinge", "Right_Hinge"}
SURFACES = {"Left_Inner_Flap": ("flap", "L"), "Left_Outer_Flap": ("flap", "L"), "Right_Inner_Flap": ("flap", "R"), "Right_Outer_Flap": ("flap", "R"),
            "Left_Elevator": ("elevator", "L"), "Right_Elevator": ("elevator", "R"), "Left_Yaw": ("rudder", "L"), "Right_Yaw": ("rudder", "R")}
COMP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
SIZE = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read(path):
    data = open(path, "rb").read()
    doc, blob, off = None, None, 12
    while off < len(data):
        length, kind = struct.unpack_from("<I4s", data, off)
        chunk = data[off + 8:off + 8 + length]
        doc, blob = (json.loads(chunk), blob) if kind == b"JSON" else (doc, chunk)
        off += 8 + length
    return doc, blob


doc, blob = read(SRC)
nodes = doc["nodes"]
name = lambda i: (nodes[i].get("name") or "").replace("F22_model1:", "")


def accessor(i):
    a = doc["accessors"][i]
    v = doc["bufferViews"][a["bufferView"]]
    n = a["count"] * SIZE[a["type"]]
    out = np.frombuffer(blob, COMP[a["componentType"]], n, v.get("byteOffset", 0) + a.get("byteOffset", 0)).astype(float)
    return out.reshape(a["count"], SIZE[a["type"]])


def quat_matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def trs(node):
    if "matrix" in node:
        return np.array(node["matrix"]).reshape(4, 4).T
    m = np.eye(4)
    m[:3, :3] = quat_matrix(node.get("rotation", [0, 0, 0, 1])) * np.array(node.get("scale", [1, 1, 1]))
    m[:3, 3] = node.get("translation", [0, 0, 0])
    return m


# the animation, sampled (all its samplers are linear): a node's own transform at a time
anim = doc["animations"][0]
tracks = {}
for ch in anim["channels"]:
    s = anim["samplers"][ch["sampler"]]
    tracks.setdefault(ch["target"]["node"], {})[ch["target"]["path"]] = (accessor(s["input"]).ravel(), accessor(s["output"]))


def sample(times, values, t, path):
    k = int(np.clip(np.searchsorted(times, t) - 1, 0, len(times) - 2))
    f = float(np.clip((t - times[k]) / (times[k + 1] - times[k]), 0, 1))
    a, b = values[k], values[k + 1]
    if path != "rotation":
        return a + (b - a) * f
    if a @ b < 0:
        b = -b
    q = a + (b - a) * f  # (keys a few degrees apart: a normalised lerp is a slerp here)
    return q / np.linalg.norm(q)


def posed(i, t):
    node = dict(nodes[i])
    for path, (times, values) in tracks.get(i, {}).items():
        node[path] = list(sample(times, values, t, path))
    return node


# the pose with the gear up, baked in; the control surfaces as they rest
for i in tracks:
    if name(i) not in SURFACES:
        nodes[i] = {k: v for k, v in posed(i, UP_AT).items() if k != "matrix"} if "matrix" not in nodes[i] else nodes[i]

parent = {c: i for i, n in enumerate(nodes) for c in n.get("children", [])}


def world(i):
    m = trs(nodes[i])
    while i in parent:
        i = parent[i]
        m = trs(nodes[i]) @ m
    return m


def mesh_points(i):  # a node's vertices with its subtree's, in the node's own space
    out = []
    def walk(j, m):
        node = nodes[j]
        if "mesh" in node:
            for p in doc["meshes"][node["mesh"]]["primitives"]:
                v = accessor(p["attributes"]["POSITION"])
                out.append(v @ m[:3, :3].T + m[:3, 3])
        for c in node.get("children", []):
            walk(c, m @ trs(nodes[c]))
    walk(i, np.eye(4))
    return np.concatenate(out)


def axis_angle(r):
    angle = np.arccos(np.clip((np.trace(r) - 1) / 2, -1, 1))
    axis = np.array([r[2, 1] - r[1, 2], r[0, 2] - r[2, 0], r[1, 0] - r[0, 1]])
    return axis / max(np.linalg.norm(axis), 1e-12), angle


def turned(points, axis, pivot, angle):  # points turned about a line
    k = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    r = np.eye(3) + np.sin(angle) * k + (1 - np.cos(angle)) * k @ k
    return (points - pivot) @ r.T + pivot


def rotation_quat(r):  # a rotation matrix's quaternion (x, y, z, w)
    w = np.sqrt(max(0.0, 1 + r[0, 0] + r[1, 1] + r[2, 2])) / 2
    if w > 1e-6:
        return [(r[2, 1] - r[1, 2]) / (4 * w), (r[0, 2] - r[2, 0]) / (4 * w), (r[1, 0] - r[0, 1]) / (4 * w), w]
    k = int(np.argmax(np.diag(r)))
    a, b, c = k, (k + 1) % 3, (k + 2) % 3
    q = [0.0, 0.0, 0.0, 0.0]
    q[a] = np.sqrt(max(0.0, 1 + r[a, a] - r[b, b] - r[c, c])) / 2
    q[b] = (r[b, a] + r[a, b]) / (4 * q[a])
    q[c] = (r[c, a] + r[a, c]) / (4 * q[a])
    q[3] = (r[c, b] - r[b, c]) / (4 * q[a])
    return q


# a control surface: its topmost node of that name, and the nodes of that name under it down to its mesh (the
# animation moves one or two of them); its whole own transform at a time is theirs together, in the top one's parent
hinges = {}
for top, n in enumerate(nodes):
    surface = name(top)
    if surface not in SURFACES or (top in parent and name(parent[top]) == surface):
        continue
    kind, side = SURFACES[surface]
    chain = [top]
    while len(nodes[chain[-1]].get("children", [])) == 1 and name(nodes[chain[-1]]["children"][0]) == surface:
        chain.append(nodes[chain[-1]]["children"][0])
    whole = lambda t: np.linalg.multi_dot([trs(posed(c, t)) for c in chain] + [np.eye(4)])
    rest = np.linalg.multi_dot([trs(nodes[c]) for c in chain] + [np.eye(4)])
    points = mesh_points(chain[-1]) @ rest[:3, :3].T + rest[:3, 3]  # (in the top one's parent's space, at rest)
    times = sorted({float(t) for c in chain for path in tracks.get(c, {}).values() for t in path[0]})
    poses = [whole(t) for t in times]
    turns = [axis_angle(p[:3, :3] @ rest[:3, :3].T)[1] if times else 0 for p in poses]
    if kind != "rudder" and np.degrees(max(turns, default=0)) > 1:
        # the neutral pose: the animation's pose nearest the one it rests in; the hinge: the rigid turn from there to
        # the pose furthest from it
        a = int(np.argmin(turns))
        neutral = poses[a]
        far = [axis_angle(p[:3, :3] @ neutral[:3, :3].T)[1] for p in poses]
        b = int(np.argmax(far))
        d = poses[b] @ np.linalg.inv(neutral)
        axis, _ = axis_angle(d[:3, :3])
        pivot = np.linalg.lstsq(np.eye(3) - d[:3, :3], d[:3, 3], rcond=None)[0]
        points = mesh_points(chain[-1]) @ neutral[:3, :3].T + neutral[:3, 3]
        print(f"{surface:18s} chain {len(chain)}: rest {np.degrees(turns[a]):.1f}° off the nearest pose (at {times[a]:.2f} s), turns {np.degrees(max(far)):.1f}° in the animation")
    else:
        # along its front edge: its long way (the span), through the points furthest forward
        neutral = rest
        forward = np.linalg.solve(world(parent[top])[:3, :3], [0, 0, 1])
        forward /= np.linalg.norm(forward)
        axis = np.linalg.svd(points - points.mean(0), full_matrices=False)[2][0]
        reach = points @ forward
        pivot = points[reach > reach.max() - 0.08 * np.ptp(reach)].mean(0)
    # which way is down (the rudders: left), in the model's frame: the trailing edge (the point furthest from the
    # hinge) turned a little
    off = points - pivot
    edge = points[np.argmax(np.linalg.norm(off - np.outer(off @ axis, axis), axis=1))]
    to_world = world(parent[top])
    goes = to_world[:3, :3] @ (turned(edge[None], axis, pivot, 0.2)[0] - edge)
    if (goes[1] > 0) if kind != "rudder" else (goes[0] < 0):
        axis = -axis
    # the top node holds the whole neutral transform, the rest of the chain none
    nodes[top] = {k: v for k, v in nodes[top].items() if k not in ("matrix", "translation", "rotation", "scale")}
    nodes[top]["translation"] = [float(v) for v in neutral[:3, 3]]
    nodes[top]["rotation"] = [float(v) for v in rotation_quat(neutral[:3, :3])]
    for c in chain[1:]:
        nodes[c] = {k: v for k, v in nodes[c].items() if k not in ("matrix", "translation", "rotation", "scale")}
    hinges[top] = {"kind": kind, "side": side, "axis": [round(float(v), 6) for v in axis], "pivot": [round(float(v), 6) for v in pivot]}
    print(f"{surface:18s} {kind:8s} {side} axis {np.round(axis, 3)} pivot {np.round(pivot, 3)}")
for i, h in hinges.items():
    nodes[i]["extras"] = {"hinge": h}

# what stays: the scene's nodes without the dropped ones; then only the meshes, materials, textures, images and data they use
keep = set()
def walk(i):
    if name(i) in DROP:
        return
    keep.add(i)
    for c in nodes[i].get("children", []):
        walk(c)
for root in doc["scenes"][doc.get("scene", 0)]["nodes"]:
    walk(root)
order = sorted(keep)
renode = {old: new for new, old in enumerate(order)}
new_nodes = []
for old in order:
    node = dict(nodes[old])
    node["children"] = [renode[c] for c in node.get("children", []) if c in keep]
    if not node["children"]:
        node.pop("children")
    new_nodes.append(node)
meshes = sorted({n["mesh"] for n in new_nodes if "mesh" in n})
remesh = {old: new for new, old in enumerate(meshes)}
for node in new_nodes:
    if "mesh" in node:
        node["mesh"] = remesh[node["mesh"]]
new_meshes = [doc["meshes"][m] for m in meshes]
materials = sorted({p["material"] for m in new_meshes for p in m["primitives"] if "material" in p})
rematerial = {old: new for new, old in enumerate(materials)}
textures = sorted({info["index"] for m in materials for info in [doc["materials"][m].get("pbrMetallicRoughness", {}).get("baseColorTexture")] if info})
retexture = {old: new for new, old in enumerate(textures)}
new_materials = []
for m in materials:
    material = json.loads(json.dumps(doc["materials"][m]))
    info = material.get("pbrMetallicRoughness", {}).get("baseColorTexture")
    if info:
        info["index"] = retexture[info["index"]]
    new_materials.append(material)
images = sorted({doc["textures"][t]["source"] for t in textures})
reimage = {old: new for new, old in enumerate(images)}
new_textures = [{**doc["textures"][t], "source": reimage[doc["textures"][t]["source"]]} for t in textures]

# the data: each accessor and image the kept meshes and images use, packed again
packed, views, accessors, reaccess = bytearray(), [], [], {}
def put(raw, target=None):
    packed.extend(b"\0" * (-len(packed) % 4))
    views.append({"buffer": 0, "byteOffset": len(packed), "byteLength": len(raw), **({"target": target} if target else {})})
    packed.extend(raw)
    return len(views) - 1
def copy_accessor(i):
    if i in reaccess:
        return reaccess[i]
    a = dict(doc["accessors"][i])
    v = doc["bufferViews"][a["bufferView"]]
    size = SIZE[a["type"]] * np.dtype(COMP[a["componentType"]]).itemsize
    start = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = v.get("byteStride", size)
    raw = b"".join(blob[start + k * stride:start + k * stride + size] for k in range(a["count"])) if stride != size else blob[start:start + a["count"] * size]
    a["bufferView"] = put(raw, 34963 if a["type"] == "SCALAR" and a["componentType"] in (5123, 5125) else 34962)
    a.pop("byteOffset", None)
    accessors.append(a)
    reaccess[i] = len(accessors) - 1
    return reaccess[i]
for mesh in new_meshes:
    for p in mesh["primitives"]:
        p["attributes"] = {k: copy_accessor(v) for k, v in p["attributes"].items()}
        if "indices" in p:
            p["indices"] = copy_accessor(p["indices"])
        if "material" in p:
            p["material"] = rematerial[p["material"]]
new_images = []
for old in images:
    image = dict(doc["images"][old])
    v = doc["bufferViews"][image["bufferView"]]
    image["bufferView"] = put(blob[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]])
    new_images.append(image)
packed.extend(b"\0" * (-len(packed) % 4))
out = {
    "asset": {**doc["asset"], "generator": "scripts/prepare-raptor.py, from " + doc["asset"].get("generator", "")},
    "scene": 0,
    "scenes": [{"nodes": [renode[r] for r in doc["scenes"][doc.get("scene", 0)]["nodes"] if r in keep]}],
    "nodes": new_nodes, "meshes": new_meshes, "materials": new_materials, "textures": new_textures, "images": new_images,
    "samplers": doc.get("samplers", []), "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(packed)}],
}
if "extensionsUsed" in doc:
    out["extensionsUsed"] = doc["extensionsUsed"]
text = json.dumps(out, separators=(",", ":")).encode()
text += b" " * (-len(text) % 4)
glb = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(text) + 8 + len(packed)) + struct.pack("<I", len(text)) + b"JSON" + text
glb += struct.pack("<I", len(packed)) + b"BIN\0" + bytes(packed)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "wb").write(glb)
count = sum(accessors[p["attributes"]["POSITION"]]["count"] for m in new_meshes for p in m["primitives"])
print(f"raptor.glb: {len(glb) / 1e3:.0f} KB, {len(new_nodes)} nodes, {len(new_meshes)} meshes, {count} vertices, {len(new_images)} image(s), {len(hinges)} hinges")
