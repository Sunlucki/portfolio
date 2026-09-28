#!/usr/bin/env python3
"""Camera motion between neighbouring hero frames, for motion-compensated morphing.

The clip is a dolly into the eye, so frame i+1 is frame i zoomed about a point: p' = s·(p − c) + c.
For every pair this fits an affine warp with OpenCV's ECC and reduces it to that zoom (s, cx, cy),
c normalised to the frame. The hero draws both frames scaled towards each other while cross-fading,
so in-between scroll positions look like real in-between frames instead of a double exposure.

Needs: pip install opencv-python-headless numpy
Reads public/hero/d/NNN.webp (scripts/prepare-media.py), writes src/heroMotion.json.
"""
import glob, json, os
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = sorted(glob.glob(os.path.join(HERE, "..", "public", "hero", "d", "*.webp")))
OUT = os.path.join(HERE, "..", "src", "heroMotion.json")
W, H = 480, 270

def gray(path):
    im = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    return cv2.resize(im, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255

def zoom(a, b):
    warp = np.eye(2, 3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-7)
    _, warp = cv2.findTransformECC(a, b, warp, cv2.MOTION_AFFINE, criteria, None, 5)
    A, t = warp[:, :2].astype(np.float64), warp[:, 2].astype(np.float64)
    s = (A[0, 0] + A[1, 1]) / 2
    # Closest pure zoom over the frame (matching the affine at the centre), then its fixed point:
    # p' = s·p + T  =>  c = T / (1 − s).
    T = (A - s * np.eye(2)) @ np.array([W / 2, H / 2]) + t
    cx, cy = T / (1 - s)
    return [round(float(s), 4), round(float(cx) / W, 4), round(float(cy) / H, 4)]

motion, previous = [], gray(FRAMES[0])
for path in FRAMES[1:]:
    current = gray(path)
    try:
        step = zoom(previous, current)
    except cv2.error:  # the last frames are almost black (inside the pupil): keep the previous zoom
        step = motion[-1]
    motion.append(step)
    previous = current

with open(OUT, "w") as f:
    json.dump(motion, f, separators=(",", ":"))
print(f"{len(motion)} pairs → {os.path.relpath(OUT)}; zoom {min(m[0] for m in motion)}–{max(m[0] for m in motion)}")
