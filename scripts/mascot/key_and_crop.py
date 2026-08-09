#!/usr/bin/env python3
"""
Keys out a flat chroma-key background (sampled from the image's own
corners, not a hardcoded colour) and crops to the opaque content's bounding
box. Used to turn Gemini-generated "flat solid background" decal sheets
into real transparent-alpha PNGs, since the model does not reliably emit
alpha channels directly (it draws literal RGB pixels, including a fake
checkerboard when asked for "transparent") — see
docs/mascot/GENERATED_ASSET_MANIFEST.md.

Usage: key_and_crop.py <input.png> <output.png> [padding_px]
"""

import sys
from PIL import Image


def key_and_crop(src_path: str, dst_path: str, padding: int = 12) -> None:
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    pixels = img.load()

    corner_samples = [
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
        (w // 2, 2), (2, h // 2), (w - 3, h // 2), (w // 2, h - 3),
    ]
    bg_r = sum(pixels[x, y][0] for x, y in corner_samples) / len(corner_samples)
    bg_g = sum(pixels[x, y][1] for x, y in corner_samples) / len(corner_samples)
    bg_b = sum(pixels[x, y][2] for x, y in corner_samples) / len(corner_samples)

    # Distance-based soft matte: fully transparent near the sampled
    # background colour, fully opaque past a threshold, linear falloff
    # between for clean anti-aliased decal edges (no hard cutout ring).
    inner = 28.0
    outer = 70.0

    out = Image.new("RGBA", (w, h))
    out_px = out.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0

    for y in range(h):
        for x in range(w):
            r, g, b = pixels[x, y]
            dist = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
            if dist <= inner:
                alpha = 0
            elif dist >= outer:
                alpha = 255
            else:
                alpha = int(255 * (dist - inner) / (outer - inner))
            out_px[x, y] = (r, g, b, alpha)
            if alpha > 8:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x <= min_x or max_y <= min_y:
        print("WARNING: no non-background content detected; saving uncropped")
        out.save(dst_path)
        return

    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(w, max_x + padding)
    max_y = min(h, max_y + padding)

    cropped = out.crop((min_x, min_y, max_x, max_y))
    cropped.save(dst_path)
    print(
        f"sampled bg=({bg_r:.0f},{bg_g:.0f},{bg_b:.0f}) "
        f"cropped {w}x{h} -> {cropped.size[0]}x{cropped.size[1]} -> {dst_path}"
    )


def main():
    if len(sys.argv) < 3:
        print("usage: key_and_crop.py <input.png> <output.png> [padding_px]")
        sys.exit(1)
    padding = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    key_and_crop(sys.argv[1], sys.argv[2], padding)


if __name__ == "__main__":
    main()
