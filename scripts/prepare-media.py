#!/usr/bin/env python3
"""Builds optimized media for the portfolio from Bogdan's local sources.

Outputs into ../public:
  hero/d/NNN.webp (1920w) and hero/m/NNN.webp (1280w)  — scroll-scrubbed hero frames
  hero/poster.jpg                                       — first frame (LCP / no-JS fallback)
  hero/fg-d/NNN.webp, hero/fg-m/NNN.webp                — first FG_FRAMES frames with the background removed
                                                          (Apple Vision, scripts/cutout.swift) so the headline can sit behind the subject
  work/<name>.webp  (1600w)                             — project card images
  tiles/<name>.webp (840x540 cover)                     — marquee tiles
  about/<name>.webp (560px, alpha)                      — 3D icons
Re-run safe: overwrites outputs.
"""
import os, subprocess, tempfile, glob
from PIL import Image, ImageStat, features

HOME = os.path.expanduser("~")
KB = os.path.join(HOME, "Developer", "Bodgan Nenadović")
PUB = os.path.join(KB, "portfolio", "public")
SITES = os.path.join(KB, "sources", "screens", "sites")
ART = os.environ.get("ARTIMG", "")  # extracted artifact screenshots (scratchpad)
TAXI = os.path.join(HOME, "Developer", "TAXI-BOSS", "showcase", "screenshots")
ICONS = os.path.join(HOME, "Desktop", "Проэкты", "SUNLUCKI", "ASSETS CV")
VIDEO = os.path.join(KB, "LANDING HERO COVER Scroll Video.mp4")
FG_FRAMES = 25  # cutouts cover the part of the scroll where the headline is still visible

assert features.check("webp"), "Pillow without WebP support"

def out(*p):
    path = os.path.join(PUB, *p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path

def to_webp(src, dst, width=None, q=78, cover=None):
    im = Image.open(src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA") else "RGB")
    if cover:  # center-crop to exact size
        tw, th = cover
        r = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        l, t = (im.width - tw) // 2, 0 if im.height > im.width else (im.height - th) // 2
        im = im.crop((l, t, l + tw, t + th))
    elif width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=q, method=6)
    return os.path.getsize(dst)

def hero_frames():
    for stale in sum((glob.glob(out("hero", d, "*.webp")) for d in ("d", "m", "fg-d", "fg-m")), []):
        os.remove(stale)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-v", "error", "-i", VIDEO, "-fps_mode", "passthrough",
                        os.path.join(tmp, "%03d.png")], check=True)
        frames = sorted(glob.glob(os.path.join(tmp, "*.png")))
        # The clip ends in ~15 pure-black frames (inside the pupil); keep only up to the first black one.
        for idx, f in enumerate(frames):
            if ImageStat.Stat(Image.open(f).convert("L").resize((96, 54))).mean[0] < 0.5:
                frames = frames[: idx + 1]
                break
        total = {"d": 0, "m": 0}
        for i, f in enumerate(frames):
            total["d"] += to_webp(f, out("hero", "d", f"{i:03d}.webp"), width=1920, q=70)
            total["m"] += to_webp(f, out("hero", "m", f"{i:03d}.webp"), width=1280, q=70)
            if i == 0:
                Image.open(f).convert("RGB").save(out("hero", "poster.jpg"), quality=82)
        print(f"hero: {len(frames)} frames, d={total['d']/1e6:.1f}MB m={total['m']/1e6:.1f}MB")

        cut = os.path.join(tmp, "cut")
        subprocess.run(["swift", os.path.join(os.path.dirname(__file__), "cutout.swift"), tmp, cut, str(FG_FRAMES)], check=True)
        fg = {"d": 0, "m": 0}
        for i in range(FG_FRAMES):
            f = os.path.join(cut, f"{i:03d}.png")
            fg["d"] += to_webp(f, out("hero", "fg-d", f"{i:03d}.webp"), width=1920, q=80)
            fg["m"] += to_webp(f, out("hero", "fg-m", f"{i:03d}.webp"), width=1280, q=80)
        print(f"hero cutouts: {FG_FRAMES} frames, d={fg['d']/1e6:.1f}MB m={fg['m']/1e6:.1f}MB")
        return len(frames)

WORK = {  # project card images (col1a, col1b, col2 per project)
    "simbia-1": f"{ART}/e16c18a7/11.jpg", "simbia-2": f"{ART}/e16c18a7/25.jpg", "simbia-3": f"{ART}/e16c18a7/01.jpg",
    "b2b-1": f"{SITES}/bp_2.jpg", "b2b-2": f"{SITES}/bp_1.jpg", "b2b-3": f"{SITES}/bp_0.jpg",
    "protectdent-1": f"{SITES}/pd_3.jpg", "protectdent-2": f"{SITES}/pd_2.jpg", "protectdent-3": f"{SITES}/pd_0.jpg",
    "iapply-1": f"{ART}/a9d1ab25/02.jpg", "iapply-2": f"{ART}/a9d1ab25/05.jpg", "iapply-3": f"{ART}/a9d1ab25/01.jpg",
    "taxiboss-1": f"{TAXI}/04-3d-showcase.png", "taxiboss-2": f"{TAXI}/15-dashboard-top.png", "taxiboss-3": f"{SITES}/tb_0.jpg",
    "spin-1": f"{SITES}/sck_1.jpg", "spin-2": f"{SITES}/sc_0.jpg", "spin-3": f"{SITES}/sck_0.jpg",
}
TILES = [  # marquee: row 1 (11) then row 2 (10)
    f"{SITES}/ab_0.jpg", f"{SITES}/xm_0.jpg", f"{ART}/e16c18a7/03.jpg", f"{SITES}/am_0.jpg", f"{SITES}/pd_4.jpg",
    f"{ART}/a9d1ab25/05.jpg", f"{TAXI}/05-benefits.png", f"{SITES}/sck_2.jpg", f"{SITES}/xm_2.jpg",
    f"{ART}/e16c18a7/14.jpg", f"{SITES}/bp_0.jpg",
    f"{SITES}/ab_2.jpg", f"{SITES}/am_1.jpg", f"{SITES}/xm_4.jpg", f"{SITES}/pd_1.jpg", f"{ART}/e16c18a7/21.jpg",
    f"{TAXI}/22-admin-fleet.png", f"{ART}/a9d1ab25/08.jpg", f"{SITES}/xm_1.jpg", f"{ART}/e16c18a7/11.jpg", f"{TAXI}/04-3d-showcase.png",
]
ABOUT = {"star": "ЗВЕЗДА.png", "mask": "Маска.png", "rocket": "Ракета.png", "sphere": "СФЕРА.png", "pointer": "Указатель.png"}

if __name__ == "__main__":
    assert ART and os.path.isdir(ART), "set ARTIMG to the extracted artifact screenshots dir"
    n = hero_frames()
    s = sum(to_webp(p, out("work", f"{k}.webp"), width=1600, q=78) for k, p in WORK.items())
    print(f"work: {len(WORK)} images {s/1e6:.1f}MB")
    s = sum(to_webp(p, out("tiles", f"{i:02d}.webp"), cover=(840, 540), q=74) for i, p in enumerate(TILES))
    print(f"tiles: {len(TILES)} images {s/1e6:.1f}MB")
    s = sum(to_webp(os.path.join(ICONS, f), out("about", f"{k}.webp"), width=560, q=82) for k, f in ABOUT.items())
    print(f"about icons: {len(ABOUT)} {s/1e6:.2f}MB")
    with open(out("hero", "count.txt"), "w") as fh:
        fh.write(str(n))
