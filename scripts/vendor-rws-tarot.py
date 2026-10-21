#!/usr/bin/env python3
"""Vendor the 1909 public-domain Rider-Waite-Smith 78 card art locally.

Source: https://github.com/mixvlad/TarotCards/tree/840b84d012c6b74dc1634fa2d00d1b21f5b28093/tarot/rider-waite/720px
Original artist: Pamela Colman Smith (1909).
This changes artwork delivery only; the LUNEA card identities/RNG stay untouched.
"""
from io import BytesIO
from pathlib import Path
import time
from urllib.request import Request, urlopen
from PIL import Image, ImageOps

UPSTREAM = "https://raw.githubusercontent.com/mixvlad/TarotCards/840b84d012c6b74dc1634fa2d00d1b21f5b28093/tarot/rider-waite/720px"
DESTINATION = Path(__file__).resolve().parents[1] / "assets" / "rws"
MAJORS = (
    "Fool", "Magician", "High_Priestess", "Empress", "Emperor", "Hierophant",
    "Lovers", "Chariot", "Strength", "Hermit", "Wheel_of_Fortune", "Justice",
    "Hanged_Man", "Death", "Temperance", "Devil", "Tower", "Star", "Moon",
    "Sun", "Judgement", "World"
)
SUITS = ("Wands", "Cups", "Swords", "Pents")
CARDS = [f"{n:02d}_{name}.jpg" for n, name in enumerate(MAJORS)] + [
    f"{suit}{n:02d}.jpg" for suit in SUITS for n in range(1, 15)
]
assert len(CARDS) == len(set(CARDS)) == 78


def download(filename):
    url = f"{UPSTREAM}/{filename}"
    for attempt in range(4):
        try:
            request = Request(url, headers={"User-Agent": "LUNEA-RWS-Art-Vendor/1.0"})
            with urlopen(request, timeout=40) as response:
                if response.status != 200:
                    raise RuntimeError(f"{filename}: HTTP {response.status}")
                raw = response.read()
            with Image.open(BytesIO(raw)) as decoded:
                image = ImageOps.exif_transpose(decoded).convert("RGB")
                if min(image.size) < 250:
                    raise ValueError(f"Unexpected artwork size: {filename} {image.size}")
                image.thumbnail((360, 750), Image.Resampling.LANCZOS)
                image.save(DESTINATION / filename, format="JPEG", quality=85,
                           optimize=True, progressive=True, subsampling=0)
            return
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)


def main():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for index, filename in enumerate(CARDS, 1):
        target = DESTINATION / filename
        if not target.exists():
            download(filename)
        with Image.open(target) as image:
            image.verify()
        print(f"{index:02d}/78 {filename} ({target.stat().st_size} bytes)", flush=True)
    files = sorted(DESTINATION.glob("*.jpg"))
    if len(files) != 78:
        raise RuntimeError(f"Expected exactly 78 local cards, found {len(files)}")
    print(f"PASS: all 78 images available locally ({sum(p.stat().st_size for p in files)} bytes)")


if __name__ == "__main__":
    main()
