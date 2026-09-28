#!/usr/bin/env python3
"""Assets for the volumetric About scene.

  public/about/floating.webp  — Bogdan lifted out of the "floating above the phone" render
                                (Apple Vision instance mask, person only; the phone is rebuilt in 3D)
  public/about/scene.webp     — the original render, shown until the 3D scene is ready (or without WebGL)
  public/models/iphone.glb    — iPhone 17 Pro Max model recoloured from Cosmic Orange to Deep Blue, meshopt-compressed
                                (CC-BY-4.0, "iPhone 17 Pro Max" by MajdyModels on Sketchfab — credited on the site)
"""
import json, os, struct, subprocess, tempfile
from PIL import Image

HOME = os.path.expanduser("~")
KB = os.path.join(HOME, "Developer", "Bodgan Nenadović")
PUB = os.path.join(KB, "portfolio", "public")
RENDER = os.path.join(KB, "hf_20260219_223206_3d2a25c4-2001-403f-b893-439c84ceed45.jpeg")
MODEL = os.path.join(HOME, "Downloads", "PD 3D SEt", "3D FILES", "iphone_17_pro_max.glb")
HERE = os.path.dirname(os.path.abspath(__file__))

INSTANCES_SWIFT = r'''
import CoreImage
import Foundation
import Vision
let a = CommandLine.arguments
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: a[1]))
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let observation = request.results?.first else { exit(2) }
let context = CIContext()
for instance in observation.allInstances {
    let masked = try observation.generateMaskedImage(ofInstances: IndexSet(integer: instance), from: handler, croppedToInstancesExtent: false)
    try context.writePNGRepresentation(of: CIImage(cvPixelBuffer: masked), to: URL(fileURLWithPath: a[2] + "/\(instance).png"),
                                       format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
}
'''

def person_cutout():
    with tempfile.TemporaryDirectory() as tmp:
        script = os.path.join(tmp, "instances.swift")
        open(script, "w").write(INSTANCES_SWIFT)
        subprocess.run(["swift", script, RENDER, tmp], check=True)
        # Two instances: the person (upper half of the frame) and the phone (lower). Keep the one
        # whose opaque area sits highest.
        best = None
        for f in sorted(p for p in os.listdir(tmp) if p.endswith(".png")):
            im = Image.open(os.path.join(tmp, f)).convert("RGBA")
            box = im.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
            if box and (best is None or box[1] < best[1][1]):
                best = (im, box)
        im, (l, t, r, b) = best
        pad = 24
        im = im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))
        if im.height > 1400:
            im = im.resize((round(im.width * 1400 / im.height), 1400), Image.LANCZOS)
        dst = os.path.join(PUB, "about", "floating.webp")
        im.save(dst, "WEBP", quality=86, method=6)
        print(f"floating.webp {im.size} {os.path.getsize(dst)/1e3:.0f}KB")

def poster():
    dst = os.path.join(PUB, "about", "scene.webp")
    Image.open(RENDER).convert("RGB").resize((1200, 1200), Image.LANCZOS).save(dst, "WEBP", quality=80, method=6)
    print(f"scene.webp {os.path.getsize(dst)/1e3:.0f}KB")

# Orange parts of the model (frame, back, camera plateau) → Deep Blue, in linear RGB.
DEEP_BLUE = [0.0194, 0.0319, 0.0685, 1.0]
RECOLOR = {"basecolor.001", "metalframe.002", "Material.005", "backpanel.001"}

def recolored_glb(path):
    data = open(MODEL, "rb").read()
    json_len = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20:20 + json_len])
    for material in gltf["materials"]:
        if material.get("name") in RECOLOR:
            material["pbrMetallicRoughness"]["baseColorFactor"] = DEEP_BLUE
    chunk = json.dumps(gltf, separators=(",", ":")).encode()
    chunk += b" " * (-len(chunk) % 4)
    rest = data[20 + json_len:]
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(chunk) + len(rest)))
        f.write(struct.pack("<I4s", len(chunk), b"JSON") + chunk + rest)

def phone_model():
    dst = os.path.join(PUB, "models", "iphone.glb")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "iphone.glb")
        recolored_glb(src)
        subprocess.run(["npx", "--yes", "@gltf-transform/cli", "optimize", src, dst, "--compress", "meshopt",
                        "--texture-compress", "webp", "--simplify", "false"], check=True, cwd=HERE, stdout=subprocess.DEVNULL)
    print(f"iphone.glb {os.path.getsize(dst)/1e3:.0f}KB (from {os.path.getsize(MODEL)/1e3:.0f}KB)")

if __name__ == "__main__":
    person_cutout()
    poster()
    phone_model()
