#!/usr/bin/env python3
"""The Earth at night for the manifesto (src/three/ManifestoScene.tsx): where people live, as light.

  public/manifesto/lights.webp — 720x360 equirectangular (longitude -180..180 left to right, latitude 90..-90
                                 top to bottom), brightness = city lights. The manifesto scatters its pulsing
                                 red points over the Earth by it.

Source: NASA Earth Observatory, "Earth at Night (Black Marble) 2016", Suomi NPP VIIRS (public domain):
https://earthobservatory.nasa.gov/features/NightLights
"""
import io, os, urllib.request
import numpy as np
from PIL import Image

URL = "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "manifesto", "lights.webp")
FLOOR = 60  # the dark land and sea under the lights, in the 3600x1800 colour map

if __name__ == "__main__":
    with urllib.request.urlopen(URL) as response:
        night = np.asarray(Image.open(io.BytesIO(response.read())).convert("L"), dtype=float)
    # 5x5 blocks → 720x360, keeping each block's brightest light so small towns survive
    blocks = night.reshape(360, 5, 720, 5).max(axis=(1, 3))
    light = np.clip((blocks - FLOOR) / (255 - FLOOR), 0, 1)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    Image.fromarray(np.round(light * 255).astype(np.uint8)).save(OUT, lossless=True)
    print(os.path.relpath(OUT), os.path.getsize(OUT) // 1024, "KB,", f"{(light > 0).mean():.1%} of cells lit")
