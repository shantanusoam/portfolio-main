#!/usr/bin/env python3
"""
Packs the generated decal sheets into a small number of runtime atlases —
MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md's "ASSET PROCESSING
PIPELINE" ("runtime atlas: one or two atlases, not many HTTP requests").

Deviates from the spec's suggested `.mjs` script in one way: this is a
Python script, not Node, because packing needs real pixel access
(flood-fill segmentation + bin-packing) and this repo deliberately stays
dependency-light (see .claude/CLAUDE.md's testing section for the same
principle applied elsewhere) — adding an npm image library (sharp/jimp)
for a one-time build step isn't worth it when Python + Pillow, already
used by generate-asset.py/key_and_crop.py, does the job with zero new
dependencies of either kind.

Each source decal *sheet* (terrazzo, constellation, circuit-garden,
resonance-fx, platform-ornaments) contains many individual marks. This
script segments each sheet into its individual connected-alpha components
(pure Python flood fill — no numpy/scipy in this environment) so each mark
becomes its own addressable atlas sprite with its own UV rect, not one
giant sprite per sheet.

Usage: build_visual_atlas.py
"""

import json
import os
from collections import deque
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
SOURCE_DIR = os.path.join(ROOT, "public", "mascot", "generated", "source")
RUNTIME_DIR = os.path.join(ROOT, "public", "mascot", "generated", "runtime")

ALPHA_THRESHOLD = 40
MIN_COMPONENT_AREA = 30
PADDING = 2
ATLAS_MAX_WIDTH = 1024
# Bridges small alpha gaps (e.g. between a mark and its own soft drop
# shadow, or between touching petals) before flood-fill, so a single
# visual mark segments as one sprite instead of fragmenting into pieces —
# purely a connectivity aid; the final crop still uses the original alpha.
DILATE_RADIUS = 3

ATLAS_GROUPS = {
    "mascot-decal-atlas": [
        "terrazzo-decals.png",
        "constellation-decals.png",
        "circuit-garden-decals.png",
    ],
    "resonance-fx-atlas": [
        "resonance-fx.png",
    ],
    "strumrise-ornament-atlas": [
        "string-platform-ornaments.png",
    ],
}


def segment(img: Image.Image, sheet_name: str):
    """
    Pure-Python 4-connected flood fill, run over a *dilated* copy of the
    alpha mask so a mark and its own soft drop shadow (or touching petals
    with a 1-3px anti-aliasing gap between them) are grouped as one
    component instead of fragmenting. The dilation only decides which
    pixels are connected for grouping purposes — the final crop always
    reads back the original, undilated alpha, so sprite edges stay exactly
    as generated.
    """
    w, h = img.size
    alpha = img.getchannel("A")
    binary = alpha.point(lambda p: 255 if p >= ALPHA_THRESHOLD else 0)
    dilated = binary.filter(ImageFilter.MaxFilter(DILATE_RADIUS * 2 + 1))
    dilated_px = dilated.load()

    visited = bytearray(w * h)
    components = []

    for start_y in range(h):
        for start_x in range(w):
            idx = start_y * w + start_x
            if visited[idx] or dilated_px[start_x, start_y] == 0:
                continue

            queue = deque([(start_x, start_y)])
            visited[idx] = 1
            min_x, min_y, max_x, max_y = start_x, start_y, start_x, start_y
            area = 0

            while queue:
                x, y = queue.popleft()
                area += 1
                min_x, max_x = min(min_x, x), max(max_x, x)
                min_y, max_y = min(min_y, y), max(max_y, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        nidx = ny * w + nx
                        if not visited[nidx] and dilated_px[nx, ny] != 0:
                            visited[nidx] = 1
                            queue.append((nx, ny))

            if area >= MIN_COMPONENT_AREA:
                components.append((min_x, min_y, max_x, max_y))

    sprites = []
    for i, (min_x, min_y, max_x, max_y) in enumerate(components):
        box = (
            max(0, min_x - PADDING),
            max(0, min_y - PADDING),
            min(w, max_x + 1 + PADDING),
            min(h, max_y + 1 + PADDING),
        )
        crop = img.crop(box)
        sprites.append(
            {
                "id": f"{sheet_name}-{i}",
                "sourceSheet": sheet_name,
                "image": crop,
            }
        )
    return sprites


def pack(sprites):
    """Simple shelf/row bin-packer — small sprite counts (dozens, not
    thousands) don't need a real maxrects packer."""
    sprites = sorted(sprites, key=lambda s: s["image"].size[1], reverse=True)

    x_cursor = 0
    y_cursor = 0
    row_height = 0
    placements = []

    for sprite in sprites:
        w, h = sprite["image"].size
        if x_cursor + w > ATLAS_MAX_WIDTH and x_cursor > 0:
            x_cursor = 0
            y_cursor += row_height
            row_height = 0
        placements.append((sprite, x_cursor, y_cursor))
        x_cursor += w
        row_height = max(row_height, h)

    atlas_width = ATLAS_MAX_WIDTH
    atlas_height = y_cursor + row_height

    atlas = Image.new("RGBA", (atlas_width, atlas_height))
    meta = []
    for sprite, x, y in placements:
        w, h = sprite["image"].size
        atlas.paste(sprite["image"], (x, y))
        meta.append(
            {
                "id": sprite["id"],
                "sourceSheet": sprite["sourceSheet"],
                "x": x,
                "y": y,
                "width": w,
                "height": h,
            }
        )
    return atlas, meta


def main():
    os.makedirs(RUNTIME_DIR, exist_ok=True)

    for atlas_name, sheet_files in ATLAS_GROUPS.items():
        all_sprites = []
        for sheet_file in sheet_files:
            path = os.path.join(SOURCE_DIR, sheet_file)
            if not os.path.exists(path):
                print(f"WARNING: {path} missing, skipping")
                continue
            img = Image.open(path).convert("RGBA")
            sheet_name = os.path.splitext(sheet_file)[0]
            sprites = segment(img, sheet_name)
            print(f"{sheet_file}: {len(sprites)} sprites segmented")
            all_sprites.extend(sprites)

        if not all_sprites:
            print(f"{atlas_name}: no sprites, skipping atlas")
            continue

        atlas, meta = pack(all_sprites)
        atlas_path = os.path.join(RUNTIME_DIR, f"{atlas_name}.webp")
        json_path = os.path.join(RUNTIME_DIR, f"{atlas_name}.json")
        atlas.save(atlas_path, "WEBP", lossless=True)
        with open(json_path, "w") as f:
            json.dump(
                {
                    "atlasWidth": atlas.size[0],
                    "atlasHeight": atlas.size[1],
                    "sprites": meta,
                },
                f,
                indent=2,
            )
        size_kb = os.path.getsize(atlas_path) / 1024
        print(
            f"{atlas_name}: {atlas.size[0]}x{atlas.size[1]}, "
            f"{len(meta)} sprites, {size_kb:.0f} KB -> {atlas_path}"
        )

    # Velvet microtexture is a single continuous overlay, not sprite-packed.
    microtexture_src = os.path.join(SOURCE_DIR, "velvet-microtexture.png")
    if os.path.exists(microtexture_src):
        img = Image.open(microtexture_src).convert("RGB")
        out_path = os.path.join(RUNTIME_DIR, "velvet-microtexture.webp")
        img.save(out_path, "WEBP", quality=85)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"velvet-microtexture: {img.size} {size_kb:.0f} KB -> {out_path}")


if __name__ == "__main__":
    main()
