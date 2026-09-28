#!/usr/bin/env python3
"""Camera motion between neighbouring hero frames, for motion-compensated morphing.

The clip is a dolly into the eye, so frame i+1 is frame i zoomed about a point: p' = s·(p − c) + c.
For every pair this fits an affine warp with OpenCV's ECC and reduces it to that zoom (s, cx, cy),
c normalised to the frame. The hero draws both frames scaled towards each other while cross-fading,
so in-between scroll positions look like real in-between frames instead of a double exposure.

It also measures the pupil in the last frames (centre and radius, src/heroPupil.json), so the career
timeline can draw its particle iris right over the real one as the camera flies into the eye.

Needs: pip install opencv-python-headless numpy
Reads public/hero/d/NNN.webp (scripts/prepare-media.py), writes src/heroMotion.json and src/heroPupil.json.
"""
import glob, json, os
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = sorted(glob.glob(os.path.join(HERE, "..", "public", "hero", "d", "*.webp")))
OUT = os.path.join(HERE, "..", "src", "heroMotion.json")
PUPIL_OUT = os.path.join(HERE, "..", "src", "heroPupil.json")
PUPIL_FIRST = 56  # the pupil is well framed from here on
PUPIL_RELIABLE = 71  # after this it runs off the frame: continue with the camera zoom
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

def pupil(path):
    """The pupil: the roundest dark blob near the middle (cx, cy in frame width/height, r in heights)."""
    im = cv2.imread(path)
    h, w = im.shape[:2]
    dark = (cv2.cvtColor(im, cv2.COLOR_BGR2HSV)[:, :, 2] < 32).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    n, _, stats, cents = cv2.connectedComponentsWithStats(dark, 8)
    best = None
    for k in range(1, n):
        x, y, bw, bh, area = stats[k]
        cx, cy = cents[k]
        if area < 150 or abs(cx - w / 2) > w * 0.2 or abs(cy - h / 2) > h * 0.3:
            continue
        if 0.75 < bw / bh < 1.33 and 0.6 < area / (bw * bh) < 0.9 and (best is None or area > best[0]):
            best = (area, cx / w, cy / h, max(bw, bh) / 2 / h)
    return best[1:]

rows, radius = [], 0.0
for i in range(PUPIL_FIRST, len(FRAMES)):
    if i <= PUPIL_RELIABLE:
        cx, cy, radius = pupil(FRAMES[i])
    else:
        cx, cy = 0.5, 0.5
        radius *= motion[i - 1][0]
    rows.append([round(float(cx), 4), round(float(cy), 4), round(float(radius), 4)])
with open(PUPIL_OUT, "w") as f:
    json.dump({"first": PUPIL_FIRST, "frames": rows}, f, separators=(",", ":"))
print(f"pupil in frames {PUPIL_FIRST}–{len(FRAMES) - 1} → {os.path.relpath(PUPIL_OUT)}")
