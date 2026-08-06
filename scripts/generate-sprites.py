#!/usr/bin/env python3
"""
One-off asset generator for the Cluckstorm arcade shooter.

Calls the Gemini image-generation API to produce new original sprites
(no copyrighted characters), then chroma-keys the solid magenta backdrop
to transparency locally with Pillow and normalizes each sprite onto a
256x256 canvas to match the existing shmup-sprites atlas cell size.

Usage:
  GEMINI_API_KEY=xxxx python3 scripts/generate-sprites.py

The key is read from the environment only. It is never written to disk
and must not be committed anywhere.
"""

import base64
from collections import deque
import json
import os
import sys
import time
import urllib.request
import urllib.error

from PIL import Image

API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = "gemini-2.5-flash-image"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

OUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "easter-egg",
    "generated",
    "shmup-sprites-v2",
)
RAW_CACHE_DIR = os.environ.get("SPRITE_RAW_CACHE", "/tmp/cluckstorm-sprite-raw-cache")

STYLE = (
    "chunky retro-arcade vector game sprite, thick clean black outlines, "
    "bright saturated flat colors, single centered subject, strict orthographic "
    "top-down view with the camera directly overhead for a vertical shoot-em-up, "
    "no side view, no front view, no three-quarter view, dynamic funny expression, chibi "
    "proportions, no text, no watermark, no signature, no logos, "
    "solid flat magenta background #ff00ff filling every corner for chroma keying"
)

SPRITES = [
    (
        "player-courier-topdown",
        "A sleek compact player courier spaceship seen directly from above, "
        "perfect bilateral symmetry, pointed nose facing the TOP edge, twin "
        "orange engines at the bottom, wide readable wings, "
        + STYLE,
    ),
    (
        "missile-projectile-topdown",
        "A single compact homing missile projectile seen directly from above, "
        "pointed nose facing the TOP edge, tiny fins, orange exhaust at bottom, "
        "large enough silhouette to read at 24 pixels, "
        + STYLE,
    ),
    (
        "laser-bolt-topdown",
        "A single narrow cyan laser bolt projectile aligned vertically, energy "
        "tip facing the TOP edge and emitter trail at bottom, no diagonal angle, "
        "large readable silhouette, "
        + STYLE,
    ),
    (
        "bomb-projectile-topdown",
        "A single round sci-fi nova bomb projectile seen directly from above, "
        "radial red-orange warning lights, tiny rear stabilizer toward the "
        "BOTTOM edge, large readable silhouette, "
        + STYLE,
    ),
    (
        "grunt-bird-topdown",
        "A basic one-eyed alien space-chicken fighter seen directly from above, "
        "beak and nose facing the BOTTOM edge toward the player, small swept "
        "wings and twin purple thrusters at the top, "
        + STYLE,
    ),
    (
        "shooter-bird-topdown",
        "An armed alien space-chicken gunship seen directly from above, beak "
        "facing the BOTTOM edge toward the player, symmetrical wing cannons "
        "aimed downward, bubble helmet visible from overhead, "
        + STYLE,
    ),
    (
        "armored-bird-topdown",
        "A heavy armored alien space-chicken tank craft seen directly from "
        "above, beak facing the BOTTOM edge toward the player, broad symmetric "
        "purple armor plates and shoulder cannons, "
        + STYLE,
    ),
    (
        "ufo-bird-topdown",
        "A worried alien space-chicken piloting a round purple flying saucer "
        "seen directly from above, craft aligned vertically with its attack "
        "side facing the BOTTOM edge, perfectly centered circular silhouette, "
        + STYLE,
    ),
    (
        "popcorn-asteroid-topdown",
        "A funny cracked popcorn asteroid hazard seen directly from above, "
        "round tumbling rock with a tiny angry chick emerging from the center, "
        "radially readable silhouette, "
        + STYLE,
    ),
    (
        "healer-support-bird",
        "A pudgy round alien space-chicken combat medic wearing a tiny red-cross "
        "backpack with a glowing healing-beam antenna, worried-but-determined "
        "expression, one wing giving a thumbs-up, "
        + STYLE,
    ),
    (
        "splitter-bird",
        "A goofy alien space-chicken stuffed inside an oversized inflatable "
        "bubble-suit that looks ready to pop into pieces, cross-eyed, seams "
        "and pressure-valve details on the suit, "
        + STYLE,
    ),
    (
        "splitterling",
        "A tiny angry baby chick fragment with stubby wings and a single "
        "tuft of feather on its head, mid-tumble, tiny fists raised, "
        + STYLE,
    ),
    (
        "elite-bird",
        "A decorated veteran alien space-chicken commando wearing a tattered "
        "cape, aviator sunglasses, and a chest full of bottle-cap medals, "
        "smug confident smirk, "
        + STYLE,
    ),
    (
        "kamikaze-diver-bird",
        "A wild-eyed alien space-chicken strapped into a rickety scrap-metal "
        "rocket harness with sparking fuses, diving headfirst pose, feathers "
        "streaming backward, unhinged grin, "
        + STYLE,
    ),
    (
        "boss-admiral-drumstick",
        "A colossal armored drumstick-shaped battle-mech boss with thick "
        "riveted plating, a single glowing angry eye in the center, small "
        "stubby rocket thrusters, imposing silhouette for a boss fight, "
        + STYLE,
    ),
    (
        "boss-omelette-engine",
        "A hulking cracked golden egg-shaped mechanical engine boss with "
        "rotating armor shield plates, glowing molten yolk cracks, industrial "
        "pipes and rivets, ominous mechanical face, "
        + STYLE,
    ),
    (
        "miniboss-sergeant-yolk",
        "A pompous golden-armored alien space-chicken officer riding a small "
        "saucer platform, monocle, curled mustache, one wing raised giving "
        "orders, medals everywhere, "
        + STYLE,
    ),
    (
        "powerup-timewarp-icon",
        "A swirly glowing hourglass-clock gem power-up icon with spiral "
        "clock hands and cyan time-warp energy trails curling around it, "
        + STYLE,
    ),
    (
        "powerup-nova-icon",
        "A radiant golden-magenta supernova starburst energy orb power-up "
        "icon with sharp light rays bursting outward, "
        + STYLE,
    ),
]

CANVAS = 256
PADDING_RATIO = 0.10
CLASSIC_SPRITE_NAMES = [
    "healer-support-bird",
    "splitter-bird",
    "splitterling",
    "elite-bird",
    "kamikaze-diver-bird",
    "boss-admiral-drumstick",
    "boss-omelette-engine",
    "miniboss-sergeant-yolk",
]


def call_gemini(prompt: str) -> bytes:
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"]},
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        ENDPOINT,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
        },
        method="POST",
    )

    last_error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            parts = payload["candidates"][0]["content"]["parts"]
            for part in parts:
                inline = part.get("inlineData")
                if inline and inline.get("data"):
                    return base64.b64decode(inline["data"])
            raise RuntimeError(f"No inline image data in response: {payload}")
        except urllib.error.HTTPError as exc:
            last_error = exc
            detail = exc.read().decode("utf-8", "ignore")
            if exc.code in (429, 500, 503) and attempt < 2:
                time.sleep(2 + attempt * 3)
                continue
            raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < 2:
                time.sleep(2 + attempt * 3)
                continue
            raise
    raise last_error  # pragma: no cover


def is_background(r: int, g: int, b: int):
    """Returns alpha (0-255) for a magenta/hot-pink screen pixel, or None if not bg-like.

    The model doesn't render a pure #ff00ff; it comes back as a rose/hot-pink
    family (e.g. 250,4,129) with R clearly dominant, B moderate, and G
    suppressed. Character colors (yellows, oranges, blues, blacks, whites)
    don't share that R-high/B-moderate/G-low combination, so we key on it
    directly rather than distance-to-pure-magenta.
    """
    if not (r > 150 and (r - b) > 25 and (r - g) > 55 and (b - g) > -25):
        return None
    lo, hi = 15, 130
    if g <= lo:
        return 0
    if g >= hi:
        return None
    return int((g - lo) / (hi - lo) * 255)


def chroma_key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    pixels = im.load()
    width, height = im.size
    corner_samples = []
    sample_size = max(4, min(width, height) // 32)
    for y in list(range(sample_size)) + list(range(height - sample_size, height)):
        for x in list(range(sample_size)) + list(range(width - sample_size, width)):
            corner_samples.append(pixels[x, y][:3])
    bg = tuple(
        sorted(sample[channel] for sample in corner_samples)[len(corner_samples) // 2]
        for channel in range(3)
    )

    def close_to_background(x: int, y: int) -> bool:
        r, g, b, _ = pixels[x, y]
        distance = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
        return distance < 105 or is_background(r, g, b) == 0

    queue = deque()
    visited = set()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not close_to_background(x, y):
            continue
        visited.add((x, y))
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    return im


def normalize(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = max(w, h)
    pad = int(side * PADDING_RATIO)
    square = side + pad * 2
    canvas = Image.new("RGBA", (square, square), (0, 0, 0, 0))
    canvas.paste(im, ((square - w) // 2, (square - h) // 2), im)
    return canvas.resize((CANVAS, CANVAS), Image.LANCZOS)


def main():
    if os.environ.get("IMPORT_CLASSIC_SPRITES") == "1":
        os.makedirs(OUT_DIR, exist_ok=True)
        for name in CLASSIC_SPRITE_NAMES:
            raw_path = os.path.join(RAW_CACHE_DIR, f"{name}.png")
            out_path = os.path.join(OUT_DIR, f"classic-{name}.png")
            if not os.path.exists(raw_path):
                print(f"Missing classic cache: {raw_path}", file=sys.stderr)
                sys.exit(1)
            with open(raw_path, "rb") as f:
                im = Image.open(__import__("io").BytesIO(f.read()))
                normalize(chroma_key(im)).save(out_path, optimize=True)
                print(f"saved {out_path}")
        return

    if not API_KEY:
        print("GEMINI_API_KEY is not set in the environment.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(RAW_CACHE_DIR, exist_ok=True)
    manifest = {}

    for name, prompt in SPRITES:
        out_path = os.path.join(OUT_DIR, f"{name}.png")
        raw_path = os.path.join(RAW_CACHE_DIR, f"{name}.png")
        print(f"-> {name}...")
        try:
            if os.path.exists(raw_path):
                print("   using cached raw generation")
                with open(raw_path, "rb") as f:
                    raw = f.read()
            else:
                raw = call_gemini(prompt)
                with open(raw_path, "wb") as f:
                    f.write(raw)
            im = Image.open(__import__("io").BytesIO(raw))
            im = chroma_key(im)
            im = normalize(im)
            im.save(out_path, optimize=True)
            manifest[name] = f"/easter-egg/generated/shmup-sprites-v2/{name}.png"
            print(f"   saved {out_path} ({os.path.getsize(out_path)} bytes)")
        except Exception as exc:  # noqa: BLE001
            print(f"   FAILED: {exc}", file=sys.stderr)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nWrote {len(manifest)}/{len(SPRITES)} sprites. Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
