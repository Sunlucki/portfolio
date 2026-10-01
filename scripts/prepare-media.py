#!/usr/bin/env python3
"""Builds optimized media for the portfolio from Bogdan's local sources.

Outputs into ../public:
  hero/d/NNN.webp (1920w) and hero/m/NNN.webp (1280w)  — scroll-scrubbed hero frames
  hero/fg-d/NNN.webp, hero/fg-m/NNN.webp                — first FG_FRAMES frames with the background removed
                                                          (Apple Vision, scripts/cutout.swift) so the headline can sit behind the subject
  work/<name>.webp  (1600w)                             — project card images
  tiles/<name>.webp (840x540 cover)                     — marquee tiles (project covers)
  graphics/<project>/N.webp (1600w)                     — all the pictures of the covers' projects (`graphics` alone:
                                                          python3 scripts/prepare-media.py graphics), sized in src/graphics.json
  about/pointer.webp (560px, alpha)                     — 3D pointer icon (contact section)
  music/NNN.m4a                                         — the music player's playlist (AAC as mastered)
  video/<slug>.mp4, .webp, -frames.webp                 — the Video section's films, posters and hover strips
Re-run safe: overwrites outputs.
"""
import os, sys, subprocess, tempfile, glob, re, json, random, unicodedata
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
# Marquee: branding, print and social media only (the sites are in the WordPress card). Covers from
# #STYLEICON/WEB/ASSETS; where those live in iCloud only, the byte-identical copies in the old styleicon.pl uploads.
COVERS = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "STYLEICON REACT APP", "OLD WORDPRESS SITE",
                      "public_html", "styleicon.pl", "wp-content", "uploads")
WP_ASSETS = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "WEB", "assets")
COVERS_BACKUP = os.path.join(HOME, "Desktop", "Проэкты", "#STYLEICON", "WEB", "WORDPRESS", "BACKUP", "public_html",
                             "styleicon.pl", "wp-content", "uploads")
TILES = [
    f"{COVERS}/2025/05/HYPE.jpg", f"{COVERS}/2025/05/Igor-music-poster.jpg", f"{COVERS}/2025/06/DC-LOGO-Moucup.jpg",
    f"{COVERS}/2025/05/TouchMockup.jpg", f"{COVERS}/2025/05/Da-Vinci-Business-card-NS.png", (f"{WP_ASSETS}/Black Point - T-shirt AM.jpg", (0.25, 0.28, 0.75, 0.81)),
    f"{COVERS}/2025/05/Black-Point-INSTA1.jpg", f"{COVERS}/2025/05/ADAYA.jpg", f"{COVERS}/2025/05/SOUL-NATION.jpg",
    f"{COVERS}/2025/05/Strimat.jpg", f"{COVERS}/2025/05/Profi-Document.jpg", f"{COVERS}/2025/05/Zero-Sladu.jpg",
    f"{WP_ASSETS}/Yana lashes.jpg", f"{COVERS}/2025/05/Stories-Beautyc-1.jpg", f"{COVERS}/2025/05/Black-Point-T-shirt-JV.jpg",
    f"{WP_ASSETS}/Laser BC.jpg", f"{WP_ASSETS}/PD Flayer.jpg", f"{COVERS}/2025/05/ALIBIA-LOGO.jpg",
    f"{COVERS}/2025/05/Time-Relax-Body-1.jpg", f"{WP_ASSETS}/Na Serio Na Zarty.jpg",
    f"{WP_ASSETS}/Igor music BC1.jpg",
]
# The covers' projects, each with all its pictures (the one a cover shows among them), for the project a cover opens:
# from #STYLEICON/WEB/assets, and the old site's case pictures (STYLEICON REACT APP/extracted_projects).
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

def tile(i, p):  # a path, or (path, box) for a closer crop
    src, box = p if isinstance(p, tuple) else (p, None)
    return to_webp(src, out("tiles", f"{i:02d}.webp"), cover=(840, 540), q=74, box=box)

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
]
FRAMES = 10

def videos(only=None):  # only: the slugs to encode again; the rest are just listed
    size, films = 0, []
    for slug, name, title, credit in VIDEOS:
        src = os.path.join(FILMS, name)
        probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                                           "-of", "json", src], capture_output=True, text=True, check=True).stdout)
        w, h = probe["streams"][0]["width"], probe["streams"][0]["height"]
        seconds = float(probe["format"]["duration"])
        fit = "scale='min(1920,iw)':-2" if w >= h else "scale=-2:'min(1920,ih)'"
        film = out("video", f"{slug}.mp4")
        if only is not None and slug not in only and os.path.exists(film):
            films.append({"slug": slug, "title": title, **({"credit": credit} if credit else {}), "width": w, "height": h, "seconds": round(seconds)})
            continue
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

def graphics():
    sizes, total = {}, 0
    for slug, files in GRAPHICS.items():
        sizes[slug] = []
        for i, f in enumerate(files):
            src = os.path.join(CASES, f[1:]) if f.startswith("~") else os.path.join(WP_ASSETS, f)
            dst = out("graphics", slug, f"{i}.webp")
            total += to_webp(src, dst, width=1600, q=78)
            with Image.open(dst) as im:
                sizes[slug].append([im.width, im.height])
    with open(os.path.join(KB, "portfolio", "src", "graphics.json"), "w") as fh:
        json.dump(sizes, fh, separators=(",", ":"))
    return total

if __name__ == "__main__":
    if sys.argv[1:] == ["graphics"]:
        print(f"graphics: {sum(map(len, GRAPHICS.values()))} pictures {graphics()/1e6:.1f}MB")
        sys.exit()
    assert ART and os.path.isdir(ART), "set ARTIMG to the extracted artifact screenshots dir"
    n = hero_frames()
    s = sum(to_webp(p, out("work", f"{k}.webp"), width=1600, q=78) for k, p in WORK.items())
    print(f"work: {len(WORK)} images {s/1e6:.1f}MB")
    s = wp_frames()
    print(f"wordpress slides: {sum(map(len, WP.values()))} images {s/1e6:.1f}MB")
    s = wp_demos()
    print(f"wordpress demo films: {len(WP_DEMOS)} {s/1e6:.1f}MB")
    s = sum(tile(i, p) for i, p in enumerate(TILES))
    print(f"tiles: {len(TILES)} images {s/1e6:.1f}MB")
    print(f"graphics: {sum(map(len, GRAPHICS.values()))} pictures {graphics()/1e6:.1f}MB")
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
