#!/usr/bin/env python3
"""Assets for the About section's portrait with depth and light (src/components/DepthImage.tsx); the
manifesto's particles assemble it too (src/three/ManifestoScene.tsx).

  public/about/portrait.webp           — "LUCKI EPOS": the low-angle portrait in the hoodie (1536x1024)
  public/about/portrait-depth.webp     — 768x512, three maps in one:
      R  depth for the parallax (white near): the head and the dark around it flattened to FOCUS, so the face
         moves as one piece instead of its features sliding against each other; the rest smoothed so the hoodie
         does not swim or tear at the edges
      GB the surface normal's x and y (v up), from the original depth map smoothed, for the pointer light
  public/about/portrait-specular.webp  — 768x512, where the light glints: the skin of the head and neck
"""
import os
import numpy as np
from PIL import Image

KB = os.path.join(os.path.expanduser("~"), "Developer", "Bodgan Nenadović")
OUT = os.path.join(KB, "portfolio", "public", "about")
SIZE = (768, 512)
FOCUS = 0.5  # the head's depth; DepthImage's STILL keeps it still
HEAD = ((0.43, 0.36), (0.19, 0.25))  # ellipse around the head and neck: centre and radii, share of the photo
FEATHER = 0.25  # of the radii; the blend stays clear of the arc above the head
RELIEF = 0.25  # depth 0..1 spans this share of the photo's height, for the normals
SKIN = ((0.43, 0.38), (0.19, 0.27))  # where glints may appear


def blur(a, sigma):
    """Separable Gaussian in floats, edges clamped."""
    r = int(np.ceil(sigma * 3))
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma * sigma))
    k /= k.sum()
    for axis in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r, r)
        b = np.pad(a, pad, mode="edge")
        a = sum(k[i] * np.take(b, range(i, i + a.shape[axis]), axis=axis) for i in range(2 * r + 1))
    return a


def ellipse(shape, centre, radii, feather):
    h, w = shape
    x, y = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    t = np.clip((1 + feather - np.hypot((x - centre[0]) / radii[0], (y - centre[1]) / radii[1])) / feather, 0, 1)
    return t * t * (3 - 2 * t)


def to_byte(a):
    return np.round(np.clip(a, 0, 1) * 255).astype(np.uint8)


def depth_maps():
    raw = Image.open(os.path.join(KB, "LUCKI EPOS DEPTH.png")).convert("L").resize(SIZE, Image.LANCZOS)
    d = np.asarray(raw, dtype=float) / 255
    # parallax: smoothed, head flattened, then softened once more
    head = ellipse(d.shape, *HEAD, FEATHER)
    parallax = blur(blur(d, 8) * (1 - head) + FOCUS * head, 3)
    # light: normals of the smoothed original relief (texel = 1/512 of the height; rows run down)
    s = blur(d, 4) * RELIEF * d.shape[0]
    gx = np.gradient(s, axis=1)
    gy = np.gradient(s, axis=0)
    n = np.dstack([-gx, gy, np.ones_like(s)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return np.dstack([parallax, n[..., 0] * 0.5 + 0.5, n[..., 1] * 0.5 + 0.5])


def specular_map():
    photo = Image.open(os.path.join(KB, "LUCKI EPOS.png")).convert("L").resize(SIZE, Image.LANCZOS)
    lum = blur(np.asarray(photo, dtype=float) / 255, 3)  # the beard is dark on average, its bright hairs don't count
    t = np.clip((lum - 0.18) / 0.3, 0, 1)
    return ellipse(lum.shape, *SKIN, 0.2) * t * t * (3 - 2 * t)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    Image.open(os.path.join(KB, "LUCKI EPOS.png")).convert("RGB").save(os.path.join(OUT, "portrait.webp"), quality=82, method=6)
    Image.fromarray(to_byte(depth_maps())).save(os.path.join(OUT, "portrait-depth.webp"), lossless=True)
    Image.fromarray(to_byte(specular_map())).save(os.path.join(OUT, "portrait-specular.webp"), lossless=True)
    for name in ("portrait.webp", "portrait-depth.webp", "portrait-specular.webp"):
        print(name, os.path.getsize(os.path.join(OUT, name)) // 1024, "KB")
