#!/usr/bin/env python3
"""
Remove image backgrounds and write transparent PNGs.

Best quality path:
  pip install -r requirements-background.txt
  python3 tools/remove_background.py aboutus --recursive --method rembg --in-place

Dependency-light path:
  python3 tools/remove_background.py aboutus --recursive --method edge --in-place

The default "auto" method uses rembg when available and falls back to the
Pillow-only edge method for flat or near-flat backgrounds.
"""

from __future__ import annotations

import argparse
import importlib.util
import io
import math
import shutil
import sys
from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image, ImageFilter


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def clamp(value: float, floor: int = 0, ceiling: int = 255) -> int:
    return max(floor, min(ceiling, int(round(value))))


def parse_hex_color(value: str) -> tuple[int, int, int]:
    raw = value.strip().lstrip("#")
    if len(raw) != 6:
        raise argparse.ArgumentTypeError("Use a 6-digit hex color, for example #f2f2f2.")

    try:
        return tuple(int(raw[index : index + 2], 16) for index in (0, 2, 4))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Use a valid hex color, for example #f2f2f2.") from exc


def has_rembg() -> bool:
    return importlib.util.find_spec("rembg") is not None


def collect_images(paths: list[Path], recursive: bool) -> list[Path]:
    images: list[Path] = []

    for path in paths:
        if path.is_dir():
            iterator = path.rglob("*") if recursive else path.glob("*")
            images.extend(
                candidate
                for candidate in iterator
                if candidate.is_file() and candidate.suffix.lower() in IMAGE_EXTENSIONS
            )
        elif path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            images.append(path)
        else:
            print(f"Skipping unsupported path: {path}", file=sys.stderr)

    return sorted(dict.fromkeys(images))


def output_path_for(input_path: Path, args: argparse.Namespace) -> Path:
    if args.in_place:
        return input_path if input_path.suffix.lower() == ".png" else input_path.with_suffix(".png")

    output_dir = Path(args.output_dir) if args.output_dir else input_path.parent
    return output_dir / f"{input_path.stem}{args.suffix}.png"


def backup_original(input_path: Path, args: argparse.Namespace) -> Path | None:
    if not args.in_place or args.no_backup:
        return None

    backup_root = Path(args.backup_dir)
    try:
        relative_input = input_path.resolve().relative_to(Path.cwd().resolve())
    except ValueError:
        relative_input = Path(input_path.name)

    backup_path = backup_root / relative_input
    backup_path.parent.mkdir(parents=True, exist_ok=True)

    if not backup_path.exists():
        shutil.copy2(input_path, backup_path)

    return backup_path


def estimate_background_color(image: Image.Image, sample_width: int | None = None) -> tuple[int, int, int]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    border = sample_width or max(2, min(24, min(width, height) // 30))
    step = max(1, min(width, height) // 512)

    pixels = rgba.load()
    reds: list[int] = []
    greens: list[int] = []
    blues: list[int] = []

    def add_pixel(x: int, y: int) -> None:
        red, green, blue, alpha = pixels[x, y]
        if alpha > 16:
            reds.append(red)
            greens.append(green)
            blues.append(blue)

    for y in range(0, height, step):
        for x in range(0, min(border, width), step):
            add_pixel(x, y)
        for x in range(max(0, width - border), width, step):
            add_pixel(x, y)

    for x in range(0, width, step):
        for y in range(0, min(border, height), step):
            add_pixel(x, y)
        for y in range(max(0, height - border), height, step):
            add_pixel(x, y)

    if not reds:
        return (255, 255, 255)

    return (int(median(reds)), int(median(greens)), int(median(blues)))


def color_distance(red: int, green: int, blue: int, background: tuple[int, int, int]) -> float:
    bg_red, bg_green, bg_blue = background
    return math.sqrt((red - bg_red) ** 2 + (green - bg_green) ** 2 + (blue - bg_blue) ** 2)


def connected_background_mask(
    image: Image.Image,
    background: tuple[int, int, int],
    high_threshold: float,
) -> bytearray:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    total = width * height
    candidates = bytearray(total)
    connected = bytearray(total)

    for y in range(height):
        row_offset = y * width
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha <= 16 or color_distance(red, green, blue, background) <= high_threshold:
                candidates[row_offset + x] = 1

    queue: deque[tuple[int, int]] = deque()

    def maybe_add(x: int, y: int) -> None:
        index = y * width + x
        if candidates[index] and not connected[index]:
            connected[index] = 1
            queue.append((x, y))

    for x in range(width):
        maybe_add(x, 0)
        maybe_add(x, height - 1)
    for y in range(height):
        maybe_add(0, y)
        maybe_add(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            maybe_add(x - 1, y)
        if x + 1 < width:
            maybe_add(x + 1, y)
        if y > 0:
            maybe_add(x, y - 1)
        if y + 1 < height:
            maybe_add(x, y + 1)

    return connected


def decontaminate_edge_colors(
    image: Image.Image,
    alpha: Image.Image,
    background: tuple[int, int, int],
) -> Image.Image:
    rgba = image.convert("RGBA")
    bg_red, bg_green, bg_blue = background
    source = rgba.tobytes()
    alpha_bytes = alpha.tobytes()
    cleaned = bytearray(len(source))

    for offset, new_alpha in zip(range(0, len(source), 4), alpha_bytes):
        red = source[offset]
        green = source[offset + 1]
        blue = source[offset + 2]

        if new_alpha == 0:
            cleaned[offset : offset + 4] = bytes((red, green, blue, 0))
        elif new_alpha == 255:
            cleaned[offset : offset + 4] = bytes((red, green, blue, 255))
        else:
            alpha_fraction = new_alpha / 255
            cleaned[offset : offset + 4] = bytes(
                (
                    clamp((red - bg_red * (1 - alpha_fraction)) / alpha_fraction),
                    clamp((green - bg_green * (1 - alpha_fraction)) / alpha_fraction),
                    clamp((blue - bg_blue * (1 - alpha_fraction)) / alpha_fraction),
                    new_alpha,
                )
            )

    return Image.frombytes("RGBA", rgba.size, bytes(cleaned))


def snap_alpha(alpha: Image.Image, transparent_cutoff: int, opaque_cutoff: int) -> Image.Image:
    if transparent_cutoff <= 0 and opaque_cutoff >= 255:
        return alpha

    snapped = bytearray(alpha.tobytes())
    for index, value in enumerate(snapped):
        if value <= transparent_cutoff:
            snapped[index] = 0
        elif value >= opaque_cutoff:
            snapped[index] = 255

    return Image.frombytes("L", alpha.size, bytes(snapped))


def remove_with_edge_method(image: Image.Image, args: argparse.Namespace) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    background = args.bg_color or estimate_background_color(rgba, args.sample_width)
    connected = connected_background_mask(rgba, background, args.high)
    pixels = rgba.load()
    alpha_values = bytearray(width * height)
    ramp = max(args.high - args.low, 1)

    for y in range(height):
        row_offset = y * width
        for x in range(width):
            index = row_offset + x
            red, green, blue, old_alpha = pixels[x, y]

            if not connected[index]:
                alpha_values[index] = old_alpha
                continue

            distance = color_distance(red, green, blue, background)
            if distance <= args.low:
                alpha_values[index] = 0
            else:
                alpha_values[index] = min(old_alpha, clamp((distance - args.low) / ramp * 255))

    alpha = Image.frombytes("L", (width, height), bytes(alpha_values))

    if args.erode > 0:
        alpha = alpha.filter(ImageFilter.MinFilter(args.erode * 2 + 1))
    if args.feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(args.feather))
    alpha = snap_alpha(alpha, args.transparent_cutoff, args.opaque_cutoff)

    if args.keep_edge_colors:
        result = rgba.copy()
        result.putalpha(alpha)
        return result

    return decontaminate_edge_colors(rgba, alpha, background)


def remove_with_rembg(image_path: Path, args: argparse.Namespace) -> Image.Image:
    try:
        from rembg import new_session, remove
    except ImportError as exc:
        raise RuntimeError(
            "rembg is not installed. Run `pip install -r requirements-background.txt` "
            "or use `--method edge` for the Pillow-only fallback."
        ) from exc

    session = new_session(args.model)
    with image_path.open("rb") as input_file:
        result = remove(
            input_file.read(),
            session=session,
            alpha_matting=not args.no_alpha_matting,
            alpha_matting_foreground_threshold=args.matting_foreground,
            alpha_matting_background_threshold=args.matting_background,
            alpha_matting_erode_size=args.matting_erode,
            post_process_mask=args.post_process_mask,
        )

    return Image.open(io.BytesIO(result)).convert("RGBA")


def trim_transparency(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if not box:
        return image

    left, upper, right, lower = box
    left = max(0, left - padding)
    upper = max(0, upper - padding)
    right = min(image.width, right + padding)
    lower = min(image.height, lower + padding)
    return image.crop((left, upper, right, lower))


def process_image(input_path: Path, args: argparse.Namespace, use_rembg: bool) -> tuple[Path, str]:
    output_path = output_path_for(input_path, args)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as image:
        rgba = image.convert("RGBA")
        if not args.force and rgba.getchannel("A").getextrema()[0] < 255:
            result = rgba
            status = "kept existing transparency"
        elif use_rembg:
            result = remove_with_rembg(input_path, args)
            status = "removed with rembg"
        else:
            result = remove_with_edge_method(rgba, args)
            status = "removed with edge fallback"

    if args.trim:
        result = trim_transparency(result, args.padding)

    backup_original(input_path, args)
    result.save(output_path, "PNG", optimize=True)
    return output_path, status


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Remove image backgrounds and output transparent PNGs.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("inputs", nargs="+", type=Path, help="Image files or directories to process.")
    parser.add_argument("-r", "--recursive", action="store_true", help="Scan input directories recursively.")
    parser.add_argument(
        "--method",
        choices=("auto", "rembg", "edge"),
        default="auto",
        help="Background removal method.",
    )
    parser.add_argument("--output-dir", help="Directory for generated PNGs when not using --in-place.")
    parser.add_argument("--suffix", default="-transparent", help="Filename suffix when not using --in-place.")
    parser.add_argument("--in-place", action="store_true", help="Overwrite PNG inputs with transparent PNGs.")
    parser.add_argument("--no-backup", action="store_true", help="Do not copy originals before --in-place writes.")
    parser.add_argument(
        "--backup-dir",
        default="_original-backgrounds",
        help="Directory where originals are copied before --in-place writes.",
    )
    parser.add_argument("--force", action="store_true", help="Process images even if they already have transparency.")
    parser.add_argument("--trim", action="store_true", help="Crop to the non-transparent bounds after processing.")
    parser.add_argument("--padding", type=int, default=12, help="Transparent padding kept around trimmed images.")

    rembg_group = parser.add_argument_group("rembg options")
    rembg_group.add_argument("--model", default="u2net", help="rembg model name.")
    rembg_group.add_argument("--no-alpha-matting", action="store_true", help="Disable rembg alpha matting.")
    rembg_group.add_argument("--matting-foreground", type=int, default=240, help="rembg foreground threshold.")
    rembg_group.add_argument("--matting-background", type=int, default=10, help="rembg background threshold.")
    rembg_group.add_argument("--matting-erode", type=int, default=10, help="rembg alpha matting erode size.")
    rembg_group.add_argument("--post-process-mask", action="store_true", help="Ask rembg to post-process the mask.")

    edge_group = parser.add_argument_group("edge fallback options")
    edge_group.add_argument(
        "--bg-color",
        type=parse_hex_color,
        help="Override the estimated background color, for example #f2f2f2.",
    )
    edge_group.add_argument("--sample-width", type=int, help="Border width used to estimate background color.")
    edge_group.add_argument("--low", type=float, default=10.0, help="Distance considered fully transparent.")
    edge_group.add_argument("--high", type=float, default=24.0, help="Distance considered fully foreground.")
    edge_group.add_argument("--feather", type=float, default=0.45, help="Soft edge radius in pixels.")
    edge_group.add_argument("--erode", type=int, default=0, help="Pixels to eat into the foreground to remove halos.")
    edge_group.add_argument(
        "--transparent-cutoff",
        type=int,
        default=3,
        help="Alpha values at or below this are snapped to fully transparent.",
    )
    edge_group.add_argument(
        "--opaque-cutoff",
        type=int,
        default=252,
        help="Alpha values at or above this are snapped to fully opaque.",
    )
    edge_group.add_argument("--keep-edge-colors", action="store_true", help="Disable background color decontamination.")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.low >= args.high:
        parser.error("--low must be less than --high.")
    if not 0 <= args.transparent_cutoff <= 255:
        parser.error("--transparent-cutoff must be between 0 and 255.")
    if not 0 <= args.opaque_cutoff <= 255:
        parser.error("--opaque-cutoff must be between 0 and 255.")
    if args.transparent_cutoff >= args.opaque_cutoff:
        parser.error("--transparent-cutoff must be less than --opaque-cutoff.")

    images = collect_images(args.inputs, args.recursive)
    if not images:
        print("No supported images found.", file=sys.stderr)
        return 1

    use_rembg = args.method == "rembg" or (args.method == "auto" and has_rembg())
    if args.method == "rembg" and not has_rembg():
        print(
            "rembg is not installed. Run `pip install -r requirements-background.txt` "
            "or retry with `--method edge`.",
            file=sys.stderr,
        )
        return 1

    if args.method == "auto" and not use_rembg:
        print("rembg not found; using Pillow-only edge fallback.", file=sys.stderr)

    for image_path in images:
        try:
            output_path, status = process_image(image_path, args, use_rembg)
        except Exception as exc:  # noqa: BLE001 - keep batch processing usable from CLI.
            print(f"Failed: {image_path} ({exc})", file=sys.stderr)
            continue

        print(f"{status}: {image_path} -> {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
