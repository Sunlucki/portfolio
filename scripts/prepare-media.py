#!/usr/bin/env python3
"""Builds optimized media for the portfolio from Bogdan's local sources.

Outputs into ../public:
  hero/d/NNN.webp (1920w) and hero/m/NNN.webp (1280w)  — scroll-scrubbed hero frames
  hero/fg-d/NNN.webp, hero/fg-m/NNN.webp                — first FG_FRAMES frames with the background removed
                                                          (Apple Vision, scripts/cutout.swift) so the headline can sit behind the subject
  work/<name>.webp  (1600w)                             — project card images
  tiles/<name>.webp (840x540 cover)                     — marquee tiles (project covers)
  graphics/<project>/N.webp (1600w)                     — all the pictures of the covers' projects (`graphics` alone:
                                                          python3 scripts/prepare-media.py graphics [project...]), sized in
                                                          src/graphics.json
  about/pointer.webp (560px, alpha)                     — 3D pointer icon (contact section)
  music/NNN.m4a                                         — the music player's playlist (AAC as mastered)
  scenes/*.webp                                         — the 3D covers' labels and backdrop (`scenes` alone; their models:
                                                          scripts/prepare-scenes.mjs)
  scenes/print/*.webp                                   — the printed things' sides, for their 3D views (`prints` alone, the
                                                          files in the archive downloaded from iCloud first)
  video/<slug>.mp4, .webp, -frames.webp                 — the Video section's films, posters and hover strips (some
                                                          films alone: python3 scripts/prepare-media.py videos <slug>...)
Re-run safe: overwrites outputs.
"""
import os, sys, math, subprocess, tempfile, glob, re, json, random, shutil, unicodedata
from PIL import Image, ImageChops, ImageFilter, ImageStat, features

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

def to_webp(src, dst, width=None, q=78, cover=None, box=None):
    im = Image.open(src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA") else "RGB")
    if box:  # a part of the source first, as fractions (left, top, right, bottom)
        im = im.crop(tuple(round(v * s) for v, s in zip(box, (im.width, im.height) * 2)))
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

def raster(src):  # a picture's path, or (a PDF's or an .ai's path, page): that page, 2400 px on its long side
    if not isinstance(src, tuple):
        return src
    path, page = src
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-scale-to", "2400", "-f", str(page), "-l", str(page), "-singlefile", "-png", path, os.path.join(tmp, "page")], check=True)
    return os.path.join(tmp, "page.png")

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
        print(f"hero: {len(frames)} frames, d={total['d']/1e6:.1f}MB m={total['m']/1e6:.1f}MB")

        cut = os.path.join(tmp, "cut")
        subprocess.run(["swift", os.path.join(os.path.dirname(__file__), "cutout.swift"), tmp, cut, str(FG_FRAMES)], check=True)
        fg = {"d": 0, "m": 0}
        for i in range(FG_FRAMES):
            # Vision lifts the person and laptop but treats the armchair as background. The wall is a
            # uniform cyan-blue (hue 200–204°) while the chair, even its lit top, sits at 206° and above and
            # is more saturated, so a hue/saturation key recovers it; the union keeps him seated once the
            # wall is replaced by the animated backdrop.
            frame = Image.open(os.path.join(tmp, f"{i + 1:03d}.png")).convert("RGB")
            h, s, _ = frame.convert("HSV").split()
            chair = ImageChops.multiply(h.point(lambda x: 255 if 146 <= x <= 175 else 0), s.point(lambda x: 255 if x >= 215 else 0))
            chair = chair.filter(ImageFilter.MedianFilter(9)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
            person = Image.open(os.path.join(cut, f"{i:03d}.png")).convert("RGBA").split()[3]
            f = os.path.join(cut, f"{i:03d}-full.png")
            Image.merge("RGBA", (*frame.split(), ImageChops.lighter(person, chair))).save(f)
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
# The B2B card's stores (2026-10-01): each its own site's icon (its 512 px favicon), 256 px, transparency kept
STORES = {name: os.path.join(HOME, "Developer", folder, "public", "favicon-512.png")
          for name, folder in (("protectdent", "PROTECTDENT"), ("xylimelts", "XYLIMELTS"), ("mind-logistic", "MIND LOGISTIC"))}
# The Graphics section's covers: branding, print and social media only (the sites are in the WordPress card). Covers
# from #STYLEICON/WEB/ASSETS; where those live in iCloud only, the byte-identical copies in the old styleicon.pl uploads.
COVERS = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "STYLEICON REACT APP", "OLD WORDPRESS SITE",
                      "public_html", "styleicon.pl", "wp-content", "uploads")
WP_ASSETS = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "WEB", "assets")
COVERS_BACKUP = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "WEB", "WORDPRESS", "BACKUP", "public_html",
                             "styleicon.pl", "wp-content", "uploads")
ARCHIVE = os.path.join(HOME, "Desktop", "Проэкты", "АРХИВ")  # the past clients' folders
ML = os.path.join(HOME, "Desktop", "Проэкты", "АКТИВНЫЕ", "MIND LOGIISTIC")  # Mind Logistic's folder (its name so spelt)
MLSITE = os.path.join(HOME, "Developer", "MIND LOGISTIC", "src", "landing-assets")  # and its site's (his code)
ELIXIRS = ["BLUBERRY COOKIES", "LEMON HAZE", "STRAWBERRY OG", "ZEN", "ZKITTLEZ OG"]  # the 3D bottle's labels, the site's order
POUCHERS = ["BLUEBERRY", "SWEET RASPBERRY", "BUBBLE GUM", "CITRUS"]  # the 3D can's flavours
SCENES = os.path.join(KB, "sources", "scenes")  # stills of the 3D covers, the covers' pictures till they draw
TILES = [  # on the section's rings, eight a ring, in this order (the first ring the first eight)
    # Mind Logistic first (2026-10-01): its logo (his pick, in place of its sticker on a laptop), the Elixir bottle's, the
    # Poucher can's and the gummies' pouch's 3D scenes (stills of them, under the live scene)
    f"{ML}/LOGO:BRANDING/BRANDING SHOWREEL/Image/SHOWREEL.jpg",
    f"{SCENES}/elixir.png", f"{SCENES}/poucher.png", f"{SCENES}/gummies.png",
    f"{COVERS}/2025/05/HYPE.jpg", f"{COVERS}/2025/05/Igor-music-poster.jpg", f"{COVERS}/2025/06/DC-LOGO-Moucup.jpg",
    f"{COVERS}/2025/05/TouchMockup.jpg", f"{COVERS}/2025/05/Da-Vinci-Business-card-NS.png", (f"{WP_ASSETS}/Black Point - T-shirt AM.jpg", (0.25, 0.28, 0.75, 0.81)),
    # (2026-10-01, his archive's other clients on the second ring: CHANG's wrapped trailer, Lizard Moving's cards,
    # Currywurst Po Polsku's logo (its menu's cover), Perfumeria Outlet's logo (his picks); KREEM's logo, Magic Patron's sticker and
    # Slovianka's cards among the rest, a project's second covers last)
    f"{WP_ASSETS}/CHANG.jpg", f"{ARCHIVE}/LIZARD MOVING/Visit Card/Mockup.png",
    f"{COVERS}/2025/05/ADAYA.jpg", f"{COVERS}/2025/05/SOUL-NATION.jpg",
    ((f"{ARCHIVE}/CURRYWURST/DO WYSYŁKI/Curry wurst MENU.pdf", 1), (0, 0.26, 1, 0.71)), ("fit", f"{ARCHIVE}/PARFUMES/ASSETS/LOGO/BRANDING/LOGO PNG.png", (22, 22, 24)),
    f"{COVERS}/2025/05/ALIBIA-LOGO.jpg", f"{WP_ASSETS}/Yana lashes.jpg", f"{COVERS}/2025/05/Strimat.jpg", f"{WP_ASSETS}/Laser BC.jpg",
    f"{COVERS}/2025/05/Black-Point-INSTA1.jpg", (f"{ARCHIVE}/KREEM/Oferta KREEM PATISSIERE.pdf", 1),
    f"{COVERS}/2025/05/Black-Point-T-shirt-JV.jpg", f"{ARCHIVE}/Magic Patrone/Typografia/Sticker Mockup.png",
    f"{COVERS}/2025/05/Time-Relax-Body-1.jpg", f"{COVERS}/2025/05/Zero-Sladu.jpg", f"{WP_ASSETS}/Na Serio Na Zarty.jpg",
    f"{COVERS}/2025/05/Stories-Beautyc-1.jpg", f"{ARCHIVE}/SLOVIANKA/85x55_business_card_mockup_01.png", f"{COVERS}/2025/05/Profi-Document.jpg",
    f"{WP_ASSETS}/PD Flayer.jpg", f"{WP_ASSETS}/Igor music BC1.jpg",
]
# The covers' projects, each with all its pictures (the one a cover shows among them), for the project a cover opens:
# from #STYLEICON/WEB/assets, the old site's case pictures (STYLEICON REACT APP/extracted_projects, "~"), or a
# project's own folder (a full path).
CASES = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "STYLEICON REACT APP", "extracted_projects")
GRAPHICS = {
    "hype": ["HYPE.jpg"],
    "ihor": ["Igor music poster.jpg", "Igor music BC1.jpg", "Igor music BC2.jpg"],
    "dc-consulting": ["DC LOGO Moucup.jpg", "~dc-consulting/DC-Moucup-3-scaled.webp", "~dc-consulting/VOUCHER-MOCKUP-scaled.webp"],
    "touch-coffee": ["TouchMockup.jpg"],
    "da-vinci": ["Da Vinci.jpg", "Da Vinci - Business card NS.png", "Da Vinci - Flyer.jpg", "Da Vinci - Instructions.jpg"],
    "black-point": ["Black Point.jpg", "Black Point - Branding.png", "Black Point - INSTA1.jpg", "Black Point - INSTA2.jpg", "Black Point - INSTA3.jpg",
                    "Black Point - T-shirt AM.jpg", "Black Point - T-shirt IS.jpg", "Black Point - T-shirt JV.jpg", "Black Point - T-shirt LB.jpg",
                    "Black Point - T-shirt RL.jpg", "Black Point - T-shirt SB.jpg", "Black Point - T-shirt VT.jpg", "Black Point - WEB.png",
                    "Black Point - WEB2.jpg", "Black Point - WEB3.jpg"],
    "adaya": ["ADAYA.jpg"],
    "soul-nation": ["SOUL NATION.jpg"],
    "strimat": ["Strimat.jpg"],
    "profi-dokument": ["Profi Document.jpg", "PD Flayer.jpg", "PD Flayer2.jpg"],  # (PD: Profi Dokument)
    "zero-sladu": ["Zero Śladu.jpg"],
    "yana-lashes": ["Yana lashes.jpg"],
    "stories-beauty": ["Stories Beautyc.jpg"],  # (Stories Beauty.png: the same picture)
    "depilacja": ["Laser BC.jpg"],
    "alibia": ["ALIBIA.jpg", "ALIBIA - LOGO.jpg", "ALIBIA - FLYER.jpg", "Alibia - Web 1.jpg", "ALIBIA WEB REEL.png"],
    "time-relax-body": ["Time Relax Body.jpg"],
    "na-serio-na-zarty": ["Na Serio Na Zarty.jpg"],
    # Mind Logistic (2026-10-01): its brand (stickers, the logo on things), the Elixir drinks' bottles (the 2025
    # labels' renders, the 2026 labels flat, the posts and key visuals), the Poucher cans (renders and the four
    # flavours' lids, from its site) and the Elixir gummies' pouch; the bottles and the cans open on their 3D scenes
    "mind-logistic": [f"{ML}/LOGO:BRANDING/BRANDING SHOWREEL/Image/SHOWREEL.jpg"]  # (its logo first, his call)
                     + [f"{ML}/TYPOHRAPHY/STICKER/MOCKUP/{n}.  Sticker Laptop Mockup.png" for n in ("01", "02")]
                     + [f"{ML}/LOGO:BRANDING/BRANDING SHOWREEL/Image/{f}" for f in ("T-Shirt-Mockup-Dusk-Series — копия.jpg",
                        "Cap-Mockup-Dusk-Series.jpg", "Business-Card-Mockup-Dusk-Series.jpg", "Tote-Bag-Mockup-Dusk-Series — копия.jpg",
                        "Binder-Box-Mockup-Dusk-Series.jpg")],  # (its Elixir bottles' picture left out, his call)
    "elixir": [f"{ML}/ELIXIR BUTELKI/2025/PREV/{f}-3840x2160.png" for f in ("Elixir Expo@1", "PACKING PREV@1", "PACKING PREV@2", "PACKING PREV@3")]
              + [f"{ML}/ELIXIR OPAKOWANIE/2026/PNG/{f}.png" for f in ("BLUBERRY COOKIES", "ZEN")]
              + [f"{ML}/ELIXIR BUTELKI/2026 NEW/ML ISNAGRAM/{f} /1350.png" for f in ("BLUEBERRY COOKIES", "LEMON HAZE", "STRAWBERRY", "ZKITTLEZ")]
              + [f"{ML}/ELIXIR BUTELKI/2026/ART/{f}.png" for f in ("BLUEBERRY", "LEMON HAZE", "STRAWBERRY", "ZEN", "ZKITTLEZ")],
    "poucher": [f"{MLSITE}/POUCHER/CITRUS/Poucher-Citrus-{f}.png" for f in ("Pouch", "Open", "Produktowe")]
               + [f"{MLSITE}/POUCHER/{f}/{f} TOP.jpg" for f in POUCHERS],
    "elixir-gummies": [f"{ML}/ŻELKI ELIXIR/OKLADKA.png"],
    # (2026-10-01, his archive's other clients, their print in 3D over these: CHANG's wrapped trailer, its 3D prototype,
    # the two menus, the logo and the menus' pictures made with AI; Currywurst Po Polsku's logo (on its menu's cover),
    # menu for its screens and stories; Lizard Moving's cards, phone case and logo; Magic Patron's sticker; Slovianka's
    # cards (its logo concepts left out, his call); KREEM's logo (its offer's first page) and offer; Perfumeria Outlet's
    # logo, its chatbot's avatar, its reviews' badge, an ad.
    # A PDF's or an .ai's page: (file, page))
    "chang": ["CHANG.jpg", "CHANG - Prototyp.jpg", "CHANG - MENU.png", (f"{ARCHIVE}/CHANG/AI/Chang Logo.ai", 1), "CHANG - Tasty AI.png"],
    "currywurst": [(f"{ARCHIVE}/CURRYWURST/DO WYSYŁKI/Curry wurst MENU.pdf", 1)]
                  + [f"{ARCHIVE}/CURRYWURST/PNG/{f}" for f in ("MENU_.png", "INSTA - KIEŁBASY.jpg", "INSTA - SOSY.jpg")],
    "lizard-moving": [f"{ARCHIVE}/LIZARD MOVING/Visit Card/Mockup.png", f"{ARCHIVE}/LIZARD MOVING/IPHONE CASE/Lizard Moving Case Mockup.png",
                      (f"{ARCHIVE}/LIZARD MOVING/PDF/LIZARD MOVING COMPLETE TO PRINT.pdf", 3), (f"{ARCHIVE}/LIZARD MOVING/PDF/lizard moving LOGO PACK.pdf", 4),
                      (f"{ARCHIVE}/LIZARD MOVING/PDF/LIZARD MOVING COMPLETE TO PRINT.pdf", 1)],
    "magic-patron": [f"{ARCHIVE}/Magic Patrone/Typografia/{f}" for f in ("Sticker Mockup.png", "Mockup.png")],
    "slovianka": [f"{ARCHIVE}/SLOVIANKA/85x55_business_card_mockup_01.png"],
    "kreem": [(f"{ARCHIVE}/KREEM/Oferta KREEM PATISSIERE.pdf", n) for n in (1, 2, 3, 6, 13, 14)],
    # (Perfumeria Outlet in gold, his call: every gold version of its logo, its chatbot's avatar and its manager's
    # picture, its reviews' badge, then its gold ad; the green-screen ones left out)
    "perfumeria-outlet": [f"{ARCHIVE}/PARFUMES/ASSETS/LOGO/BRANDING/{f}.png" for f in ("LOGO PNG", "LOGO копия 5", "LOGO копия 6", "LOGO копия 4",
                          "BOT копия 5", "BOT копия 6", "BOT копия 4", "MANAGER копия 5", "MANAGER копия 6", "MANAGER копия 4", "OPINIE")]
                         + [f"{ARCHIVE}/PARFUMES/ASSETS/IMAGE ADS/15.02.2026/K1.jpg"],
}
ABOUT = {"pointer": "Указатель.png"}
# The WordPress sites' slideshow: for each site, Bogdan's mockups of it (#STYLEICON/WEB/assets, "m") and pages of
# it (PORTFOLIO IMAGES, "p"), which scroll on a MacBook's screen in the slide. A page is kept to its top (2.4
# times as tall as wide), 1280 wide; a PDF is drawn first by Quick Look.
WP_PAGES = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "STYLEICON REACT APP", "PORTFOLIO IMAGES")
WP = {
    "kreem": [("m", "KREEM.jpg"), ("p", "KREEM/Kreem Main Page.png"), ("p", "KREEM/Torty - kreem.pl.jpeg")],
    "blackpoint": [("m", "Black Point - WEB2.jpg"), ("p", "BLACK POINT/Black Point.jpeg"), ("m", "Black Point - WEB3.jpg")],
    "lizard": [("m", "Lizard Moving .jpg"), ("p", "LIZZARD MOVING/Lizzard Moving Main Page.png")],
    "namiclean": [("m", "NAMI CLEAN.jpg"), ("p", "Nami Clean/NamiClean.png")],
    "casada": [("m", "Casada.jpg"), ("p", "CASADA/MAIN PAGE.png"), ("p", "CASADA/PRODUCT PAGE.jpg")],
    "magicpatron": [("m", "Magic Patrone.jpg"), ("p", "MAGIC PATRONE/Magic Patrone Home Page.png"), ("p", "MAGIC PATRONE/Magic Patrone Producr Page.png")],
    "alibia": [("m", "Alibia - Web 1.jpg"), ("p", "ALIBIA/ALIBIA - MAIN PAGE.png"), ("p", "ALIBIA/ALIBIA - SHOP.png")],
    "arab": [("m", "ARAB30.jpg"), ("p", "ARAB 30/Arab 30 Main page.pdf"), ("p", "ARAB 30/Shop.png"), ("p", "ARAB 30/Product.png")],
    "architect": [("m", "Architect Vision.jpg"), ("p", "ARCHITECT VISION/MAIN PAGE.jpeg")],
    "enveloper": [("p", "ENVELPER/MAIN PAGE.png"), ("p", "ENVELPER/CATEGORIES PAGE.png")],
    "fencing": [("p", "FENCING/MAIN PAGE.png")],
    "medicus": [("p", "MEDICUS/Main Page.jpeg")],
    "hairhub": [("p", "HAIR HUB/Hair-Hub.pl | Twoje marzenie o gęstych włosach zaczyna się tutaj.pdf")],
}

def wp_frame(kind, name, dst):
    if kind == "m":
        return to_webp(os.path.join(WP_ASSETS, name), dst, width=1600, q=78)
    src = os.path.join(WP_PAGES, name)
    if src.endswith(".pdf"):  # Quick Look draws its first page, the long side 12000 px at most
        tmp = tempfile.mkdtemp()
        subprocess.run(["qlmanage", "-t", "-s", "12000", "-o", tmp, src], check=True, capture_output=True)
        src = os.path.join(tmp, os.path.basename(src) + ".png")
    im = Image.open(src).convert("RGB")
    im = im.crop((0, 0, im.width, min(im.height, round(im.width * 2.4))))
    im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=74, method=6)
    return os.path.getsize(dst)

def wp_frames():
    return sum(wp_frame(kind, name, out("work", f"wp-{site}-{i}.webp")) for site, frames in WP.items() for i, (kind, name) in enumerate(frames))

# The sites' demo films (two phones scrolling the mobile site, 15 s): muted, 1600 wide, with their first frame as
# the poster.
WP_DEMOS = {
    "lizard": "LIZZARD MOVING/LIzard Moving Mobile Promo.m4v",
    "magicpatron": "MAGIC PATRONE/Magic Patrone Mobile Demo.m4v",
    "alibia": "ALIBIA/ALIBIA PL.m4v",
}

def wp_demos():
    size = 0
    for site, name in WP_DEMOS.items():
        film = out("work", f"wp-{site}-demo.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(WP_PAGES, name), "-an", "-vf", "scale=1600:-2,fps=30",
                        "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", film], check=True)
        poster = os.path.join(tempfile.mkdtemp(), "poster.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", film, "-frames:v", "1", poster], check=True)
        Image.open(poster).convert("RGB").save(out("work", f"wp-{site}-demo.webp"), "WEBP", quality=76, method=6)
        size += os.path.getsize(film)
    return size

def tile(i, p):  # a path or a (PDF, page), or (either, box) for a closer crop, or ("fit", path, colour): all of it, on that colour
    if isinstance(p, tuple) and p[0] == "fit":  # (a logo cut out, its round words cut off by a crop)
        _, src, colour = p
        im = Image.open(src).convert("RGBA")
        im.thumbnail((840, 500), Image.LANCZOS)
        card = Image.new("RGBA", (840, 540), (*colour, 255))
        card.alpha_composite(im, ((840 - im.width) // 2, (540 - im.height) // 2))
        dst = out("tiles", f"{i:02d}.webp")
        card.convert("RGB").save(dst, "WEBP", quality=74, method=6)
        return os.path.getsize(dst)
    src, box = p if isinstance(p, tuple) and isinstance(p[1], tuple) else (p, None)
    return to_webp(raster(src), out("tiles", f"{i:02d}.webp"), cover=(840, 540), q=74, box=box)

# The music player's playlist (2026-09-30), from Bogdan's Music library: first fifteen tracks in his order, then
# the rest of his LUCKI BEATS album mixed, the short HYPE beats spread out between the full tracks (a fixed seed,
# so the order holds from build to build). Titles in English and without "Beat" (his call); versions of one track
# kept once. AAC masters are copied as they are (no re-encode), only moved to stream from the first byte and
# stripped of their tags and artwork; WAV and MP3 become AAC at 256 kbps. Writes music/NNN.m4a and src/music.json
# (title, seconds, artist) in the same order.
MUSIC_LIB = os.path.join(HOME, "Music", "Music", "Media.localized", "Music", "SUNLUCKI")
BEATS = os.path.join(MUSIC_LIB, "LUCKI BEATS")
FIRST = [  # his order
    "HEXAGON", "LiBERTY", "lillil", "SOUL NATION", "Tatto_O", "VALENTINE", "Karma", "VERSAL", "JULI", "WWE",
    "Looney Tunes Long", "Some Flex", "META", "Egypt", "Romul",
]
ELSEWHERE = {  # tracks outside the album's folder
    "Gen I US": os.path.join(MUSIC_LIB, "STYLEICON", "Gen I US.m4a"),
    "What a Logic (A version)": os.path.join(HOME, "Desktop", "Музыка", "OLD SOUND", "What a Logic (A version).m4a"),
}
SKIP = {
    "GENESIS", "PALACE REMASTER", "VERSAL RAW WERSION", "HYPE HOP (140 - BPM GMIN) 1",  # other versions of a track
    "Gen I US",  # the album's WAV of it; the AAC is in STYLEICON
    "Скрудж Манда (125) B min",  # the title is crude; left out
}
TITLES = {  # English, and no "Beat"
    "Федералы Beat": "Federals", "Bang Bang (Делай Молча) BEAT": "Bang Bang (Do It Quietly)",
    "БРОКЕРСКИЕ ДЖИНСЫ (БИТ)": "Broker Jeans", "Луна (BEAT)": "Moon", "Резонанс": "Resonance",
    "#GAME OVER..._": "#GAME OVER...?", "HYPE D&B  - 170 Fmin": "HYPE D&B - 170 Fmin",
    "THE FLASH - ANT.MIGHT & SUNLUCKI MASHUP (REMASTER)": "THE FLASH (MASHUP REMASTER)",
    "CYBINA SUNLUCKI BEAT": "CYBINA", "Abonent (GreenGo - Type Beat)": "Abonent (GreenGo Type)",
    "ASTRAL (120 D#min) + Master": "ASTRAL (120 D#min)", "Strannik (MASTER)": "Strannik",
}
ARTISTS = {"THE FLASH - ANT.MIGHT & SUNLUCKI MASHUP (REMASTER)": "ANT.MIGHT & SUNLUCKI", "What a Logic (A version)": "SUNLUCKI & ANT MIGHT"}

def title(name):
    if name in TITLES:
        return TITLES[name]
    t = re.sub(r"\s*\((?:NEW )?BEAT\)|\s*-?\s*\bBeat\b|\s*\bBEAT\b", "", name, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", t).strip(" -")

def playlist():
    files = {unicodedata.normalize("NFC", os.path.splitext(f)[0]): os.path.join(BEATS, f) for f in os.listdir(BEATS)}
    files = {n: path for n, path in files.items() if n not in SKIP} | ELSEWHERE
    rest = sorted((n for n in files if n not in FIRST), key=str.casefold)
    beats = [n for n in rest if n.startswith("HYPE")]
    tracks = [n for n in rest if not n.startswith("HYPE")]
    shuffle = random.Random(139)
    shuffle.shuffle(beats)
    shuffle.shuffle(tracks)
    mixed, due = [], 0.0
    for name in tracks:  # a beat every few tracks
        mixed.append(name)
        due += len(beats) / len(tracks)
        while due >= 1 and beats:
            mixed.append(beats.pop())
            due -= 1
    return [(n, files[n]) for n in FIRST + mixed + beats]

def music():
    for old in glob.glob(out("music", "*.m4a")):
        os.remove(old)
    size, tracks = 0, []
    for i, (name, src) in enumerate(playlist()):
        track = out("music", f"{i:03d}.m4a")
        aac = src.endswith(".m4a")
        audio = ["-c", "copy"] if aac else ["-c:a", "aac_at", "-b:a", "256k"]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:a:0", *audio, "-map_metadata", "-1",
                        "-movflags", "+faststart", track], check=True)
        seconds = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", track],
                                       capture_output=True, text=True, check=True).stdout)
        tracks.append({"title": title(name), "seconds": round(seconds), **({"artist": ARTISTS[name]} if name in ARTISTS else {})})
        size += os.path.getsize(track)
    with open(os.path.join(KB, "portfolio", "src", "music.json"), "w") as fh:
        json.dump(tracks, fh, ensure_ascii=False, indent=1)
    return size, len(tracks)

# The Video section (2026-09-30): Bogdan's films in his order, from ~/Desktop/Видео. Each becomes an H.264 film
# for the full screen (1080p, 30 fps and 5 Mbit/s at most, AAC), a poster, and a strip of ten frames the tile flips
# through on hover; writes video/<slug>.mp4, .webp, -frames.webp and src/videos.json (slug, title, credit, size,
# seconds). Titles in English, without the file's version marks.
FILMS = os.path.join(HOME, "Desktop", "Видео")
REELS = "VIDEO PORTFOLIO/BARBERSHOP/INSTAGRAM : TIK TOK "  # the folder's name ends in a space
VIDEOS = [  # slug, source, title, credit
    ("who-am-i", os.path.join(KB, "WHO AM I? - 4K.mov"), "Who Am I?", "AI film"),
    ("promo", "VIDEO PORTFOLIO/BARBERSHOP/YOUTUBE/PROMO 4K.mp4", "Promo", "Black Point barbershop"),
    ("dima-space", "VIDEO PORTFOLIO/Profi Document/DIMA SPACE .m4v", "Dima Space", "Profi Dokument"),
    ("hype-hop", "MASTIV/HYPE HOP - MASTIV.m4v", "HYPE HOP", "MASTIV"),
    ("grzyb", "SOBUSSH/GRZYB.m4v", "GRZYB", "SOBUSHH × SUNLUCKI"),
    ("hype-party", "VIDEO PORTFOLIO/Party/HYPE PARTY.M4V", "HYPE Party", ""),
    ("ant-interview", "VIDEO PORTFOLIO/BARBERSHOP/YOUTUBE/ANT INTERVIEW READY.m4v", "Ant Interview", "Black Point barbershop"),
    ("vlad-interview", "VIDEO PORTFOLIO/BARBERSHOP/YOUTUBE/VLAD INTERVIEW.mov", "Vlad Interview", "Black Point barbershop"),
    ("loma", "КАЖАН/LOMA.m4v", "LOMA", "KJ"),
    ("chase-1090", "VIDEO PORTFOLIO/Погоня 1090.mp4", "Chase 1090", ""),
    ("industrial", "ADRIAN/INDUSTRIAL A.D.I. EPISODE 1.m4v", "INDUSTRIAL A.D.I.", "Episode 1"),
    ("eyes-in-the-night", "Очі У Ночі/Очі у ночі - HD 1080p.mov", "Eyes in the Night", ""),
    # the barbershop's reels
    ("adrian-the-barber", f"{REELS}/Adrian The Barber.MOV", "Adrian the Barber", "Black Point barbershop"),
    ("choose-your-style", f"{REELS}/Choose Your Style.MOV", "Choose Your Style", "Black Point barbershop"),
    ("juli-the-barber", f"{REELS}/Juli The barber.MOV", "Juli the Barber", "Black Point barbershop"),
    ("rodi-m3", f"{REELS}/RODI \u041c3.mov", "RODI M3", "Black Point barbershop"),
    ("skater-cut", f"{REELS}/Scater Cut.mov", "Skater Cut", "Black Point barbershop"),
    ("vlad-the-barber", f"{REELS}/Vlad The barber.MOV", "Vlad the Barber", "Black Point barbershop"),
    ("valentines-day", f"{REELS}/WALENTYNKI LONG.mov", "Valentine’s Day", "Black Point barbershop"),
    # the clients' films (2026-10-01), from their projects' folders
    ("protectdent", os.path.join(HOME, "Developer", "PROTECTDENT", "public", "hero-video.mp4"), "PROTECTDENT", "Website hero film"),
    ("xylimelts", os.path.join(HOME, "Developer", "XYLIMELTS", "ASSETS", "MY ASSETS", "VIDEO", "INSTRUKCJA VERTICAL.mov"), "XyliMelts", "How to use"),
    ("currywurst", f"{ARCHIVE}/CURRYWURST/PROMO FILM/CURRYWURST PROMO UPSCALE.mp4", "Currywurst", "Promo film"),
    ("mind-logistic", f"{ML}/LOGO:BRANDING/BRANDING SHOWREEL/Video/# MIND LOGISTIC BRANDING SHOWREEL.mov", "Mind Logistic", "Branding showreel"),
    ("tesla", f"{ARCHIVE}/TESLA SERVICE/TESLA SERVICE EDIT.mov", "Tesla Service", "Promo film"),
    ("dreams-come-true", f"{ARCHIVE}/Наращивание волос/ADS/SPELNIENIE MARZEN.m4v", "Dreams Come True", "Hair Hub"),
    ("magic", f"{ARCHIVE}/Magic Patrone/MAGIC V3.mp4", "Magic", "Magic Patron"),
    ("yellow", f"{ARCHIVE}/KREEM/Yellow.mov", "Yellow", "KREEM"),
]
FRAMES = 10

def videos(only=None):  # only: the slugs to encode again; the rest keep their films, and their sizes from videos.json
    known = {}
    if only is not None:
        with open(os.path.join(KB, "portfolio", "src", "videos.json")) as fh:
            known = {film["slug"]: film for film in json.load(fh)}
    size, films = 0, []
    for slug, name, title, credit in VIDEOS:
        film = out("video", f"{slug}.mp4")
        if slug in known and slug not in only and os.path.exists(film):  # (its source, maybe only in iCloud, left alone)
            films.append({"slug": slug, "title": title, **({"credit": credit} if credit else {}), **{k: known[slug][k] for k in ("width", "height", "seconds")}})
            continue
        src = os.path.join(FILMS, name)
        probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                                           "-of", "json", src], capture_output=True, text=True, check=True).stdout)
        w, h = probe["streams"][0]["width"], probe["streams"][0]["height"]
        seconds = float(probe["format"]["duration"])
        fit = "scale='min(1920,iw)':-2" if w >= h else "scale=-2:'min(1920,ih)'"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?", "-vf", f"{fit},fps='min(30,source_fps)'",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-maxrate", "5M", "-bufsize", "10M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
                        "-movflags", "+faststart", film], check=True)
        size += os.path.getsize(film)
        tmp = tempfile.mkdtemp()
        grab = lambda t, path, width: subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", film, "-frames:v", "1",
                                                     "-vf", f"scale={width}:-2", path], check=True)
        # the poster: of five moments, the brightest and most contrasted
        def score(path):
            stat = ImageStat.Stat(Image.open(path).convert("L"))
            return stat.mean[0] + stat.stddev[0]
        shots = []
        for k, at in enumerate((0.15, 0.3, 0.45, 0.6, 0.75)):
            shots.append(os.path.join(tmp, f"poster{k}.png"))
            grab(seconds * at, shots[-1], 800)
        Image.open(max(shots, key=score)).convert("RGB").save(out("video", f"{slug}.webp"), "WEBP", quality=78, method=6)
        frames = []
        for k in range(FRAMES):
            path = os.path.join(tmp, f"{k}.png")
            grab(seconds * (k + 0.5) / FRAMES, path, 400)
            frames.append(Image.open(path).convert("RGB"))
        strip = Image.new("RGB", (sum(f.width for f in frames), frames[0].height))
        for k, f in enumerate(frames):
            strip.paste(f, (k * frames[0].width, 0))
        strip.save(out("video", f"{slug}-frames.webp"), "WEBP", quality=70, method=6)
        films.append({"slug": slug, "title": title, **({"credit": credit} if credit else {}), "width": w, "height": h, "seconds": round(seconds)})
        print(f"  {slug}: {w}x{h} {seconds:.0f}s {os.path.getsize(film)/1e6:.1f}MB", flush=True)
    with open(os.path.join(KB, "portfolio", "src", "videos.json"), "w") as fh:
        json.dump(films, fh, ensure_ascii=False, indent=1)
    return size

# The Mobile Apps section's screens: iOS Simulator captures with demo data (1206 x 2622, 2026-09-30), kept in the
# knowledge base; 640 wide on the 3D iPhone. work/app-<app>-N.webp follows MOBILE_APPS in src/content.ts.
APP_SCREENS_DIR = os.path.join(SITES, "..", "apps")
APP_SCREENS = {
    "iapply": ["01-home.png", "02-qr-code.png", "03-shift-market.png", "04-coordinator-dashboard.png"],
    "taxi": ["01-dashboard.png", "02-earnings.png", "03-documents.png", "05-schedule.png"],
    "cashflow": ["01-overview.png", "02-debt-payoff.png", "03-spending-by-category.png", "04-debt-and-savings-status.png"],
}

def app_screens():
    return sum(to_webp(os.path.join(APP_SCREENS_DIR, app, name), out("work", f"app-{app}-{i}.webp"), width=640, q=85)
               for app, names in APP_SCREENS.items() for i, name in enumerate(names))

# Bogdan in his headphones, cut out (his "I AM.png", 2026-09-30): the music stage's figure, trimmed to the
# figure and 1400 px tall, the transparency kept.
LISTENING = os.path.join(HOME, "Downloads", "I AM.png")

def listening():
    im = Image.open(LISTENING).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
    im = im.resize((round(im.width * 1400 / im.height), 1400), Image.LANCZOS)
    dst = out("about", "listening.webp")
    im.save(dst, "WEBP", quality=86, method=6)
    return os.path.getsize(dst)

# The Graphics covers that are 3D scenes (src/three/miniScenes.ts, 2026-10-01), Mind Logistic's site's own: the
# Elixir bottle's five labels (768 wide) and the galaxy behind it, the Poucher can's four flavours' lid, side and
# bottom labels.
def scenes():
    size = to_webp(os.path.join(MLSITE, "Backgrounds", "galaxy.jpeg"), out("scenes", "galaxy.webp"), width=1024, q=72)
    for i, name in enumerate(ELIXIRS):
        size += to_webp(os.path.join(MLSITE, "ELIXIR", f"{name}.webp"), out("scenes", f"elixir-{i}.webp"), width=768, q=78)
    for i, name in enumerate(POUCHERS):
        for part, width in (("TOP", 512), ("SIDE", 1024), ("BOTTOM", 512)):
            size += to_webp(os.path.join(MLSITE, "POUCHER", name, f"{name} {part}.jpg"), out("scenes", f"poucher-{i}-{part.lower()}.webp"), width=width, q=80)
    for path in sorted(glob.glob(os.path.join(MLSITE, "flavour-particles", "*.webp"))):  # the fruits round the bottle, as they are
        shutil.copyfile(path, out("scenes", "fruit-" + os.path.basename(path)))
        size += os.path.getsize(path)
    # the gummies' Cherry Cola pouch (2026-10-01): its print for its model (ŻELKI ELIXIR/OKLADKA.png, its front and back
    # halves; scripts/prepare-scenes.mjs), and round it two cherries and a cola gummy, cut out of that print with Apple
    # Vision (scripts/cutout.swift, kept in the knowledge base's sources/scenes)
    im = Image.open(os.path.join(ML, "ŻELKI ELIXIR", "OKLADKA.png")).convert("RGB")
    im.resize((2560, round(im.height * 2560 / im.width)), Image.LANCZOS).save(out("scenes", "gummies.webp"), "WEBP", quality=82, method=6)
    size += os.path.getsize(out("scenes", "gummies.webp"))
    for n in (1, 2, 3):
        size += to_webp(os.path.join(SCENES, f"cherry-cola-fruit-{n}.png"), out("scenes", f"fruit-cherry-{n}.webp"), width=256, q=82)
    return size

# Two Graphics projects open on their logo's animation (2026-10-01), looping and muted, as a 3D project opens on its
# scene: Mind Logistic's ribbon tying itself into ML (its branding showreel's clip) and Black Point's glitching
# barbershop logo (the landscape cut of the clip on its site). H.264 without sound, 1280 px and 30 fps at most, a poster;
# what they are goes to src/logoFilms.json.
LOGO_FILMS = {
    "mind-logistic": os.path.join(ML, "LOGO:BRANDING", "BRANDING SHOWREEL", "Video", "Logo.mp4"),
    "black-point": os.path.join(WP_ASSETS, "Video", "BP LOGO S.m4v"),  # (iCloud: `brctl download` it first)
}

def logo_films():
    size, films = 0, {}
    for slug, src in LOGO_FILMS.items():
        film = out("graphics", slug, "logo.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-an", "-vf", "scale='min(1280,iw)':-2,fps='min(30,source_fps)'",
                        "-c:v", "libx264", "-crf", "22", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", film], check=True)
        probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                           "-of", "json", film], capture_output=True, text=True, check=True).stdout)["streams"][0]
        poster = os.path.join(tempfile.mkdtemp(), "poster.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", film, "-frames:v", "1", poster], check=True)
        Image.open(poster).convert("RGB").save(out("graphics", slug, "logo.webp"), "WEBP", quality=80, method=6)
        films[slug] = {"src": f"/graphics/{slug}/logo.mp4", "poster": f"/graphics/{slug}/logo.webp", "width": probe["width"], "height": probe["height"]}
        size += os.path.getsize(film) + os.path.getsize(out("graphics", slug, "logo.webp"))
    with open(os.path.join(KB, "portfolio", "src", "logoFilms.json"), "w") as fh:
        json.dump(films, fh, indent=1)
    return size

# The Graphics projects' printed things in 3D (2026-10-01, src/three/miniScenes.ts): each side as printed, from its file
# in the archive (a PDF's or an .ai's page at 300 dpi, a big one's at 4000 px on its long side, a PSD's part, or its own
# export), the bleed trimmed, 1600 px on its long side (a deck's cards 1024: all its cards load together); a side
# hot-stamped (Da Vinci's roses card: silver foil over the roses) also gets its gloss map (its green, the roughness
# three.js reads: the paper's 0.75, the foil's 0.2; its blue the metal, where the foil is). Sizes in millimetres and
# what each thing is go to src/prints.json. The archive lives in iCloud: `brctl download` the files first. A side: a
# file, (file, page), (file, (left, top, right, bottom) as fractions), ("foil", art, stamp): the stamp's shapes in
# silver foil over the art, or ("gold", art, foil[, colour]): the art as printed and its gold foil's layer (dark on
# white), metal where it is (and laid in that colour over the art, where the art shows the foil otherwise), ("holo",
# art, foil): the same with holographic foil, silver and its colours running as it turns, ("gloss", art, varnish): its
# spot varnish's layer, glossy where it is, ("unnamed", side, box): a side with a private person's name on it (a
# graduate's, on Black Point's diploma) taken off, or ("round", side): a round sticker (Magic Patron's), its circle cut
# out of its page, on a disc. A deck (Da Vinci's five Tarot cards, HYPE's badges, a set of stickers, banners or
# posters): its fronts (the last on top), one back for all. A sheet folded across its middle (Black Point's voucher):
# ("fold", outside, inside) for its front, no back. A side laid out across a thing that stands upright is turned a
# quarter anticlockwise (Time Relax Body's card, and Da Vinci's roses card, its files on their side), one laid out
# upright for a thing that lies across a quarter clockwise (Soul Nation's voucher's word).
DVR = "Da Vinci Tatoo/PNG/Roses/DAVINCI TATTOO BUISINESS CARD_"
BPW = "BLACK POINT/Графика/Wizytówka/"
PRINTS = {  # project: [(what, front, back or None, (width, height) mm, bleed mm[, more: {"corner": its corners' radius, mm}])]
    # (Profi Dokument's business card, as printed in 01.2025, gold-foiled: its PDF's pages 3 and 4 the foil layers of
    # pages 1 and 2, its title on the back among them, so the foil is laid in gold over the art (white there). Its
    # Front.jpg and Back.jpg are an early version of its flyer, not a card: left out, his word)
    "profi-dokument": [("card", ("gold", ("Нотариальные услуги/ProfiDokument Wizytowki.pdf", 1), ("Нотариальные услуги/ProfiDokument Wizytowki.pdf", 3), (201, 164, 92)),
                        ("gold", ("Нотариальные услуги/ProfiDokument Wizytowki.pdf", 2), ("Нотариальные услуги/ProfiDokument Wizytowki.pdf", 4), (201, 164, 92)), (90, 50), 3),
                       ("flyer", "Нотариальные услуги/Флаер/FRONT.png", "Нотариальные услуги/Флаер/BACK.png", (180, 90), 2),
                       ("sign", ("Нотариальные услуги/TablicaA4.pdf", 1), None, (300, 210), 0)],
    "yana-lashes": [("card", ("Yana Lashes/PDF/Busines Card.pdf", 1), ("Yana Lashes/PDF/Busines Card.pdf", 2), (90, 50), 2)],
    "zero-sladu": [("card", ("ZERO ŚLADU/WIZYTÓWKA/ZERO ŚLADU WIZYTÓWKA.pdf", 1), ("ZERO ŚLADU/WIZYTÓWKA/ZERO ŚLADU WIZYTÓWKA.pdf", 2), (90, 50), 0)],
    "time-relax-body": [("card", ("TIme Relax Body/biznes_karta_85x54mm.pdf", 1), ("TIme Relax Body/biznes_karta_85x54mm.pdf", 2), (54, 85), 2)],
    "ihor": [("card", ("gold", ("IGOR MUSIC/Igor Poperechny.pdf", 1), ("IGOR MUSIC/Igor Poperechny.pdf", 3)),
              ("gold", ("IGOR MUSIC/Igor Poperechny.pdf", 2), ("IGOR MUSIC/Igor Poperechny.pdf", 4)), (90, 50), 2),
             ("banner", ("IGOR MUSIC/Igor Poperechny BANER.pdf", 1), None, (700, 1200), 0)],
    "dc-consulting": [("voucher", "DC CONSULTING/VOUCHER/JPG/AWERS.jpg", "DC CONSULTING/VOUCHER/JPG/REWERS.jpg", (210, 148), 0)],
    # (HYPE's event badges, A6's proportions, one back for all, and its wristband, 250 by 19 mm: the PDF's 33 pt round it
    # cut off)
    "hype": [("badges", [f"HYPE/BAGE/{n}.png" for n in ("FACE CONTROL", "STAFF", "ARTIST", "VIP")], "HYPE/BAGE/BACK.png", (105, 148), 0),
             ("wristband", ("HYPE/Браслеты /OPASKA HYPE.pdf", 1), None, (250, 19), 11.64)],
    # (2026-10-01, more of his print: each project's cards, flyers, vouchers and stickers in the archive)
    # (its card's back: the logo in holographic foil on a black panel; its voucher folded in two, an invitation written in
    # white marker inside)
    "black-point": [("card", (BPW + "BARBERSHOP WIZYTOWKA 2025.pdf", 1), ("holo", (BPW + "BARBERSHOP WIZYTOWKA 2025.pdf", 2), (BPW + "BARBERSHOP WIZYTOWKA 2025.pdf", 3)), (90, 50), 2),
                    ("voucher", ("fold", (BPW + "VOUCHER.pdf", 1), (BPW + "VOUCHER.pdf", 2)), None, (297, 210), 2),
                    ("sticker", BPW + "STICK.png", None, (100, 200), 0),
                    ("certificate", ("unnamed", "BLACK POINT/Графика/Dyplom.png", (1600, 6930, 4400, 7380)), None, (508, 762), 0)],
    "strimat": [("card", "STRIMAT/Визитка/PNG/AWERS.png", "STRIMAT/Визитка/PNG/REWERS.png", (90, 50), 0)],
    "depilacja": [("flyer", "Depilacja/Флаер/Flyer.png", None, (210, 297), 3),
                  ("voucher", "Depilacja/BON PODARUNKOWY.png", None, (210, 100), 5)],
    "touch-coffee": [("flyer", ("Touch Coffe/Baner + Ulotka V2.pdf", 3), ("Touch Coffe/Baner + Ulotka V2.pdf", 4), (210, 297), 0),
                     ("banners", [("Touch Coffe/Baner + Ulotka V2.pdf", n) for n in (5, 2, 1)], None, (550, 700), 0)],
    "na-serio-na-zarty": [("flyer", ("Na Serio Na Zarty/naserio FLAYER.pdf", 1), ("Na Serio Na Zarty/naserio FLAYER.pdf", 2), (148, 210), 1)],
    "soul-nation": [("voucher", "SOUL NATION/VOUCHER.psd", None, (171, 100), 0)],
    "mind-logistic": [("flyer", (os.path.join(ML, "TYPOHRAPHY", "ELIXIR ULOTKA.pdf"), 1), (os.path.join(ML, "TYPOHRAPHY", "ELIXIR ULOTKA REVERS.pdf"), 1), (148, 210), 0),
                      ("stickers", [os.path.join(ML, "TYPOHRAPHY", "STICKER", "PNG", "NEW PACK 3", f"MIND LIGISTIC STICKER-0{n}.png") for n in (5, 4, 3, 2, 1)], None, (100, 100), 0),
                      ("posters", [os.path.join(ML, "TYPOHRAPHY", "MysteryboxA3", f"A3{n}.png") for n in (3, 2, 1)], None, (297, 420), 0)],
    # (Alibia's print is its stickers alone: it had no business card, his word)
    "alibia": [("stickers", [("Alibia/STICKERS.pdf", n) for n in (19, 15, 10, 9, 8, 5, 4, 1)], None, (80, 80), 0)],  # (eight of its twenty)
    # (2026-10-01, his archive's other clients: CHANG's trailer wrap (a side, 3 by 2.3 m), its two menu boards and its
    # sticker (2.4 by 1.4 m), what its PDFs have round them cut off (33 pt, the sticker's 100 mm); Currywurst Po
    # Polsku's stickers for its food boxes; Lizard Moving's card; Magic Patron's thank-you insert (its front alone: its
    # back's how-to, sniffing the powder, left out, his call) and its round sticker; Perfumeria Outlet's order insert, in
    # its two versions)
    "chang": [("wrap", ("CHANG/PDF/Przyczepa 3 Poprawki (Zestaw Graficzny).pdf", 1), None, (3000, 2300), 11.64),
              ("menus", [("CHANG/PDF/CHANG MENU V2.pdf", n) for n in (2, 1)], None, (400, 800), 11.64),
              ("sticker", ("CHANG/AI/Наклейка.ai", 1), None, (2400, 1400), 100)],
    "currywurst": [("stickers", [(f"CURRYWURST/NAKLEJKA/{n}.pdf", 1) for n in ("NAKLEJKA GOOGLE", "NAKLEJKA CW + Dodatki", "NAKLEJKA CURRYWURST")], None, (110, 80), 0)],
    "lizard-moving": [("card", ("LIZARD MOVING/Visit Card/Lizzard Moving Buisiness Card Edit 3.pdf", 1), ("LIZARD MOVING/Visit Card/Lizzard Moving Buisiness Card Edit 3.pdf", 2), (90, 50), 11.64, {"corner": 5})],  # (its corners cut round, his word)
    "magic-patron": [("insert", ("Magic Patrone/Typografia/A5 Druk Poprawki.pdf", 1), None, (148, 210), 0),
                     ("sticker", ("round", ("Magic Patrone/Typografia/Sticker.pdf", 1)), None, (100, 100), 0)],
    "perfumeria-outlet": [("inserts", [f"PARFUMES/ASSETS/IMAGE ADS/17.03.2026/{n}.png" for n in ("DRUK", "DRUK2")], None, (297, 210), 0)],
    "da-vinci": [("deck", [(f"Da Vinci Tatoo/PDF/Визитки /DV Tatoo - BC {n}.pdf", 1) for n in range(1, 6)], ("Da Vinci Tatoo/PDF/Визитки /DV Tatoo - BC 1.pdf", 2), (50, 90), 0),
                 ("card", ("foil", DVR + "Awers.png", DVR + "Awers Hotstamping.png"), ("foil", DVR + "Rewers.png", DVR + "Rewers Hotstamping.png"), (50, 90), 3),  # (upright: its files lie on their side)
                 ("flyer", ("Da Vinci Tatoo/PDF/Флаер/DA-VINCI - ФЛАЕР.pdf", 1), ("Da Vinci Tatoo/PDF/Флаер/DA-VINCI - ФЛАЕР.pdf", 2), (105, 148), 0),
                 ("guide", ("Da Vinci Tatoo/PDF/Инструкция/DA-VINCI - ИНСТРУКЦИЯ.pdf", 1), ("Da Vinci Tatoo/PDF/Инструкция/DA-VINCI - ИНСТРУКЦИЯ.pdf", 2), (210, 148), 0)],
}

def unnamed(im, box):  # the dark letters in box (left, top, right, bottom px) filled from the nearest pixels without them
    # along the background's lines, their slant measured in each strip (the diploma's lines curve)
    part = im.crop(box)
    grey = part.convert("L")
    hole = grey.point(lambda v: 255 if v < 110 else 0).filter(ImageFilter.MaxFilter(7))
    top, bottom = hole.getbbox()[1], hole.getbbox()[3]
    clear = Image.new("L", (part.width, top + part.height - bottom))  # (the lines over and under the letters)
    clear.paste(grey.crop((0, 0, part.width, top)), (0, 0))
    clear.paste(grey.crop((0, bottom, part.width, part.height)), (0, top))
    shift = lambda deg, step: (round(step * math.cos(math.radians(deg))), -round(step * math.sin(math.radians(deg))))
    out = part.copy()
    for x in range(0, part.width, 280):
        patch = clear.crop((x, 0, x + 280, clear.height))
        miss = lambda deg: ImageStat.Stat(ImageChops.difference(patch, ImageChops.offset(patch, *(-v for v in shift(deg, 14)))).crop((20, 20, patch.width - 20, patch.height - 20))).mean[0]
        deg = min(range(20, 90), key=miss)
        left = Image.new("L", part.size, 0)
        left.paste(hole.crop((x, 0, x + 280, part.height)), (x, 0))
        for step in range(1, part.height):
            for sign in (1, -1):
                dx, dy = shift(deg, sign * step)
                take = ImageChops.multiply(left, ImageChops.offset(ImageChops.invert(hole), -dx, -dy))
                out.paste(ImageChops.offset(part, -dx, -dy), mask=take)
                left = ImageChops.subtract(left, take)
            if not left.getbbox():
                break
    im = im.copy()
    im.paste(out, box[:2])
    return im

def side(spec, mm=(90, 50)):  # a side of a printed thing, as a picture, and its gloss map if it has one
    if isinstance(spec, tuple) and spec[0] == "gloss":  # spot varnish: the art as printed, its varnish layer dark on white
        art, coat = side(spec[1])[0], side(spec[2])[0].convert("L").point(lambda v: 255 - v)
        gloss = Image.merge("RGB", (Image.new("L", art.size, 0), coat.point(lambda a: 191 - round(a / 255 * 171)), Image.new("L", art.size, 0)))
        return art, gloss
    if isinstance(spec, tuple) and spec[0] == "gold":  # gold foil: the art as printed, its foil layer dark on white
        art, foil = side(spec[1])[0], side(spec[2])[0].convert("L").point(lambda v: 255 - v)
        if len(spec) > 3:  # (the foil laid in its colour over the art, where the art shows it otherwise)
            art = Image.composite(Image.new("RGB", art.size, spec[3]), art, foil)
        # (green the roughness: the paper's 0.75 to the foil's 0.2; blue the metalness: the foil's)
        gloss = Image.merge("RGB", (Image.new("L", art.size, 0), foil.point(lambda a: 191 - round(a / 255 * 140)), foil))
        return art, gloss
    if isinstance(spec, tuple) and spec[0] == "holo":  # holographic foil: the art as printed, silver where its foil layer
        # (dark on white) is, the foil's gloss as gold's and its red where the film its colours come from is
        art, foil = side(spec[1])[0], side(spec[2])[0].convert("L").point(lambda v: 255 - v)
        art = Image.composite(Image.new("RGB", art.size, (206, 206, 212)), art, foil)
        return art, Image.merge("RGB", (foil, foil.point(lambda a: 191 - round(a / 255 * 150)), foil))
    if isinstance(spec, tuple) and spec[0] == "unnamed":
        return unnamed(side(spec[1], mm)[0], spec[2]), None
    if isinstance(spec, tuple) and spec[0] == "round":  # a round sticker: its circle, cut out of its white page
        im = side(spec[1], mm)[0]
        im = im.crop(ImageChops.difference(im, Image.new("RGB", im.size, "white")).getbbox())
        disc = Image.new("RGB", (max(im.size),) * 2, "white")
        disc.paste(im, ((disc.width - im.width) // 2, (disc.height - im.height) // 2))
        return disc, None
    if isinstance(spec, tuple) and spec[0] == "foil":
        art = Image.open(os.path.join(ARCHIVE, spec[1])).convert("RGBA")
        stamp = Image.open(os.path.join(ARCHIVE, spec[2])).convert("RGBA").getchannel("A")
        under = Image.new("RGBA", art.size, (10, 10, 10, 255))  # (the card itself is black: its export lets it show through)
        under.alpha_composite(art)
        under.paste((206, 206, 212, 255), mask=stamp)  # (silver foil: metal where it is, a little rough)
        gloss = Image.merge("RGB", (Image.new("L", art.size, 0), stamp.point(lambda a: 191 - round(a / 255 * 140)), stamp))
        return under.convert("RGB"), gloss
    path, part = (spec, None) if isinstance(spec, str) else spec
    path = os.path.join(ARCHIVE, path)
    if path.endswith((".pdf", ".ai")):
        tmp = tempfile.mkdtemp()
        dpi = min(300, round(4000 / (max(mm) / 25.4)))  # (a banner's page at 300 dpi would be 117 million pixels)
        subprocess.run(["pdftoppm", "-r", str(dpi), "-f", str(part), "-l", str(part), "-singlefile", "-png", path, os.path.join(tmp, "page")], check=True)
        return Image.open(os.path.join(tmp, "page.png")).convert("RGB"), None
    im = Image.open(path)
    if im.mode == "RGBA":  # (on white, as printed)
        im = Image.alpha_composite(Image.new("RGBA", im.size, "white"), im)
    im = im.convert("RGB")
    if isinstance(part, tuple):
        im = im.crop(tuple(round(v * s) for v, s in zip(part, im.size * 2)))
    return im, None

# DC Consulting's folder, folded (2026-10-01): its sheet as printed (BOLD NO GUIDE: page 1 outside, 2 inside, 3 the
# white layer, hot-stamped in gold on the outside), and its die line from the version with the guides (33 pt more
# round it): the cut outline (the grey band's inner edge, its curves sampled) split along the folds (the green
# double creases, taken at their middles) into the glue flap, the back cover (with the pocket and the flap on it), the
# front cover and the pocket, in points on the printed page.
FOLDER = "DC CONSULTING/FOLDER /AI/"

def folder():
    art = os.path.join(ARCHIVE, FOLDER, "Folder DC Consulting (BOLD) NO GUIDE.pdf")
    pages = []
    for page in (1, 2, 3):
        tmp = tempfile.mkdtemp()
        subprocess.run(["pdftoppm", "-r", "150", "-f", str(page), "-l", str(page), "-singlefile", "-png", art, os.path.join(tmp, "page")], check=True)
        pages.append(Image.open(os.path.join(tmp, "page.png")).convert("RGB"))
    outside, inside, white = pages
    foil = white.convert("L").point(lambda v: 255 - v)  # (its shapes, dark on the white page)
    gold = Image.new("RGB", outside.size, (201, 164, 92))
    outside = Image.composite(gold, outside, foil)
    gloss = Image.merge("RGB", (Image.new("L", outside.size, 0), foil.point(lambda a: 178 - round(a / 255 * 122)), foil))
    sides = {}
    for name, im in (("outside", outside), ("outsideGloss", gloss), ("inside", inside)):
        im.thumbnail((2400, 2400), Image.LANCZOS)
        dst = out("scenes", "print", f"dc-consulting-folder-{name}.webp")
        im.save(dst, "WEBP", quality=84, method=6)
        sides[name] = f"/scenes/print/dc-consulting-folder-{name}.webp"
    # the die line
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftocairo", "-svg", "-f", "1", "-l", "1", os.path.join(ARCHIVE, FOLDER, "Folder DC Consulting.pdf"), os.path.join(tmp, "die.svg")], check=True)
    svg = open(os.path.join(tmp, "die.svg")).read()
    band = max((p for p in re.findall(r"<path\b[^>]*>", svg) if 'fill="rgb(77.6474%' in p), key=len)  # (the others: the holes' dots)
    d = re.search(r' d="([^"]+)"', band).group(1)
    cut = d[d.index("Z") + 1:]  # (its second outline, the cut itself)
    tokens = re.findall(r"[MLCZ]|-?\d+\.?\d*", cut)
    outline, i, at = [], 0, None
    while i < len(tokens):
        t = tokens[i]
        if t in "ML":
            at = (float(tokens[i + 1]), float(tokens[i + 2])); outline.append(at); i += 3
        elif t == "C":
            c1, c2, end = [(float(tokens[i + k]), float(tokens[i + k + 1])) for k in (1, 3, 5)]
            for n in range(1, 9):  # (each curve as eight straight bits)
                u = n / 8
                outline.append(tuple((1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u ** 2 * c + u ** 3 * e for a, b, c, e in zip(at, c1, c2, end)))
            at = end; i += 7
        else:
            i += 1
    folds = {}
    for p in re.findall(r"<path\b[^>]*>", svg):
        if 'stroke="rgb(0%, 58.824158%, 25.489807%)"' not in p:
            continue
        m = [float(v) for v in re.search(r'transform="matrix\(([^)]+)\)"', p).group(1).split(",")]
        x0, y0, x1, y1 = [float(v) for v in re.findall(r"-?\d+\.?\d*", re.search(r' d="([^"]+)"', p).group(1))]
        ends = [(m[0] * x + m[4], m[3] * y + m[5]) for x, y in ((x0, y0), (x1, y1))]
        if abs(ends[0][0] - ends[1][0]) < 1:
            folds.setdefault("x", []).append(ends[0][0])
        else:
            folds.setdefault("y", []).append(ends[0][1])
    xs, ys = sorted(folds["x"]), sorted(folds["y"])
    glue, spine, pocket = (xs[0] + xs[1]) / 2, (xs[2] + xs[3]) / 2, (ys[0] + ys[1]) / 2

    def clip(poly, x0, x1, y0, y1):  # (Sutherland and Hodgman's, against a box)
        for inside_, cross in ((lambda p: p[0] >= x0, lambda a, b: (x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0]))),
                               (lambda p: p[0] <= x1, lambda a, b: (x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0]))),
                               (lambda p: p[1] >= y0, lambda a, b: (a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0)),
                               (lambda p: p[1] <= y1, lambda a, b: (a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1))):
            kept = []
            for k, cur in enumerate(poly):
                prev = poly[k - 1]
                if inside_(cur):
                    if not inside_(prev):
                        kept.append(cross(prev, cur))
                    kept.append(cur)
                elif inside_(prev):
                    kept.append(cross(prev, cur))
            poly = kept
        return [[round(x - 33, 2), round(y - 33, 2)] for x, y in poly]  # (on the printed page)

    big = 1e5
    panels = {"glue": clip(outline, -big, glue, -big, big), "back": clip(outline, glue, spine, -big, pocket),
              "front": clip(outline, spine, big, -big, big), "pocket": clip(outline, glue, spine, pocket, big)}
    w, h = 1383.31, 1068.66  # (the printed page, in points)
    return {"kind": "folder", "w": round(w * 0.35278, 1), "h": round(h * 0.35278, 1), "page": [w, h], **sides,
            "folds": {"glue": round(glue - 33, 2), "spine": round(spine - 33, 2), "pocket": round(pocket - 33, 2)}, "panels": panels}

def folded(spec, mm, bleed):  # a sheet folded across its middle, from its outside's and inside's pages as printed (Black
    # Point's voucher: laid out across, its words along its short side, so turned a quarter clockwise to read upright):
    # its front cover (the outside's lower half), its back cover as the card turned round shows it (the upper half,
    # upside down), and its inside's halves, the cover's (the upper one, over the hinge when it's open) and the back's
    w, h = mm
    pages = []
    for page in spec[1:]:
        im = side(page, mm)[0]
        bx, by = round(im.width * bleed / (w + 2 * bleed)), round(im.height * bleed / (h + 2 * bleed))
        pages.append(im.crop((bx, by, im.width - bx, im.height - by)).transpose(Image.Transpose.ROTATE_270))
    outside, inside = pages
    upper = lambda im: im.crop((0, 0, im.width, im.height // 2))
    lower = lambda im: im.crop((0, im.height - im.height // 2, im.width, im.height))
    return {"front": lower(outside), "back": upper(outside).transpose(Image.Transpose.ROTATE_180), "inner0": upper(inside), "inner1": lower(inside)}

def prints(only=None):  # only: the projects to make again; the rest keep their sides, and their entries in prints.json
    path = os.path.join(KB, "portfolio", "src", "prints.json")
    sheets = {}
    if only is not None:
        with open(path) as fh:
            sheets = json.load(fh)
    for old in glob.glob(out("scenes", "print", "*.webp")):
        if only is None or os.path.basename(old).startswith(tuple(f"{slug}-" for slug in only)):
            os.remove(old)
    size = 0
    for slug, things in PRINTS.items():
        if only is not None and slug not in only:
            continue
        sheets[slug] = []
        for i, (kind, front, back, (w, h), bleed, *more) in enumerate(things):
            sheet = {"kind": kind, "w": w, "h": h, **(more[0] if more else {})}
            if isinstance(front, tuple) and front[0] == "fold":
                sheet.update(w=h, h=w / 2)  # (shut, and turned upright)
                for face, im in folded(front, (w, h), bleed).items():
                    im.thumbnail((1600, 1600), Image.LANCZOS)
                    im.save(out("scenes", "print", f"{slug}-{i}-{face}.webp"), "WEBP", quality=85, method=6)
                    size += os.path.getsize(out("scenes", "print", f"{slug}-{i}-{face}.webp"))
                    sheet[face] = f"/scenes/print/{slug}-{i}-{face}.webp"
                sheet["inner"] = [sheet.pop("inner0"), sheet.pop("inner1")]
                sheets[slug].append(sheet)
                continue
            faces = [(f"front{n}", spec) for n, spec in enumerate(front)] if isinstance(front, list) else [("front", front)]
            foils = [spec[0] for _, spec in faces + [("back", back)] if isinstance(spec, tuple)]
            if "gold" in foils or "holo" in foils or "foil" in foils:
                sheet["metal"] = True  # (its gloss maps carry the foil's metal)
            if "holo" in foils:
                sheet["holo"] = True  # (and their red the holographic film)
            if "round" in foils:
                sheet["round"] = True  # (a disc, its picture the circle in it)
            for face, spec in faces + [("back", back)]:
                if spec is None:
                    continue
                for k, im in enumerate(side(spec, (w, h))):
                    if im is None:
                        continue
                    if w < h and im.width > im.height:  # (upright, from a layout across)
                        im = im.transpose(Image.Transpose.ROTATE_90)
                    elif w > h and im.width < im.height:  # (across, from a layout upright: Soul Nation's voucher)
                        im = im.transpose(Image.Transpose.ROTATE_270)
                    if bleed:  # the bleed, as a share of the side with it
                        bx, by = round(im.width * bleed / (w + 2 * bleed)), round(im.height * bleed / (h + 2 * bleed))
                        im = im.crop((bx, by, im.width - bx, im.height - by))
                    im.thumbnail((1024, 1024) if isinstance(front, list) else (1600, 1600), Image.LANCZOS)
                    name = f"{slug}-{i}-{face}{['', '-gloss'][k]}.webp"
                    im.save(out("scenes", "print", name), "WEBP", quality=85, method=6)
                    size += os.path.getsize(out("scenes", "print", name))
                    sheet[face + ["", "Gloss"][k]] = f"/scenes/print/{name}"
            if isinstance(front, list):  # (a deck's fronts, in order)
                sheet["fronts"] = [sheet.pop(f"front{n}") for n in range(len(front))]
            sheets[slug].append(sheet)
    if only is None or "dc-consulting" in only:
        sheets["dc-consulting"].insert(0, folder())
    with open(path, "w") as fh:
        json.dump({slug: sheets[slug] for slug in PRINTS}, fh, ensure_ascii=False, indent=1)
    return size

def graphics(only=None):  # only: the projects to make again; the rest keep their pictures, and their sizes from graphics.json
    known = {}
    if only is not None:
        with open(os.path.join(KB, "portfolio", "src", "graphics.json")) as fh:
            known = json.load(fh)
    sizes, total = {}, 0
    for slug, files in GRAPHICS.items():
        if slug in known and slug not in only:
            sizes[slug] = known[slug]
            continue
        sizes[slug] = []
        for i, f in enumerate(files):
            src = raster(f) if isinstance(f, tuple) else os.path.join(CASES, f[1:]) if f.startswith("~") else os.path.join(WP_ASSETS, f)
            dst = out("graphics", slug, f"{i}.webp")
            total += to_webp(src, dst, width=1600, q=78)
            with Image.open(dst) as im:
                sizes[slug].append([im.width, im.height])
    with open(os.path.join(KB, "portfolio", "src", "graphics.json"), "w") as fh:
        json.dump(sizes, fh, separators=(",", ":"))
    return total

if __name__ == "__main__":
    if sys.argv[1:2] == ["graphics"]:  # graphics [project...]: all the projects' pictures, or those projects' alone
        only = set(sys.argv[2:]) or None
        print(f"graphics: {sum(len(GRAPHICS[s]) for s in only or GRAPHICS)} pictures {graphics(only)/1e6:.1f}MB")
        sys.exit()
    if sys.argv[1:] == ["scenes"]:
        print(f"scenes' pictures: {scenes()/1e3:.0f}KB")
        sys.exit()
    if sys.argv[1:2] == ["tiles"]:  # tiles [index...]: all the covers, or those alone
        only = {int(a) for a in sys.argv[2:]} or None
        print(f"tiles: {sum(tile(i, p) for i, p in enumerate(TILES) if only is None or i in only)/1e6:.1f}MB")
        sys.exit()
    if sys.argv[1:] == ["logos"]:
        print(f"logo films: {logo_films()/1e6:.1f}MB")
        sys.exit()
    if sys.argv[1:2] == ["prints"]:  # prints [project...]: all the printed things, or those projects' alone
        print(f"printed things' sides: {prints(set(sys.argv[2:]) or None)/1e3:.0f}KB")
        sys.exit()
    if sys.argv[1:2] == ["videos"]:  # videos <slug>...: those films again, the others kept as they are
        print(f"videos: {', '.join(sys.argv[2:])} {videos(set(sys.argv[2:]))/1e6:.1f}MB")
        sys.exit()
    assert ART and os.path.isdir(ART), "set ARTIMG to the extracted artifact screenshots dir"
    n = hero_frames()
    s = sum(to_webp(p, out("work", f"{k}.webp"), width=1600, q=78) for k, p in WORK.items())
    print(f"work: {len(WORK)} images {s/1e6:.1f}MB")
    s = sum(to_webp(p, out("work", f"store-{k}.webp"), width=256, q=85) for k, p in STORES.items())
    print(f"store icons: {len(STORES)} {s/1e3:.0f}KB")
    s = wp_frames()
    print(f"wordpress slides: {sum(map(len, WP.values()))} images {s/1e6:.1f}MB")
    s = wp_demos()
    print(f"wordpress demo films: {len(WP_DEMOS)} {s/1e6:.1f}MB")
    s = sum(tile(i, p) for i, p in enumerate(TILES))
    print(f"tiles: {len(TILES)} images {s/1e6:.1f}MB")
    print(f"graphics: {sum(map(len, GRAPHICS.values()))} pictures {graphics()/1e6:.1f}MB")
    print(f"scenes' pictures: {scenes()/1e3:.0f}KB")
    s = sum(to_webp(os.path.join(ICONS, f), out("about", f"{k}.webp"), width=560, q=82) for k, f in ABOUT.items())
    print(f"about icons: {len(ABOUT)} {s/1e6:.2f}MB")
    s, n = music()
    print(f"music: {n} tracks {s/1e6:.1f}MB")
    print(f"music stage figure: {listening()/1e3:.0f}KB")
    s = app_screens()
    print(f"app screens: {sum(map(len, APP_SCREENS.values()))} {s/1e6:.1f}MB")
    s = videos()
    print(f"videos: {len(VIDEOS)} {s/1e6:.1f}MB")
    with open(out("hero", "count.txt"), "w") as fh:
        fh.write(str(n))
