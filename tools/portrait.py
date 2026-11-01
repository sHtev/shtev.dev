"""Turn a head-and-shoulders photo on a plain background into ASCII art for the about page.

Usage: python portrait.py <photo> [--cols 120] [--out ../site/src/assets/portrait.txt]
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

RAMP = " .:-=+*#%@"  # dark -> bright; the site draws bright characters on black
CELL_ASPECT = 0.4  # VT323 cells are 0.4 wide per 1.0 tall at line-height 1
FLOOD_TOLERANCE = 18  # higher values bite into the head and cheek
CROP = (0.22, 0.80)  # horizontal crop to the head and shoulders, as fractions of width
MARK = (255, 0, 255)


def background_mask(rgb: Image.Image) -> Image.Image:
    """Flood-fill the flat background in from the top and side edges (not the bottom: shirt)."""
    w, h = rgb.size
    work = rgb.copy()
    seeds = [(x, 0) for x in range(0, w, 20)]
    seeds += [(0, y) for y in range(0, h - 60, 20)] + [(w - 1, y) for y in range(0, h - 60, 20)]
    for seed in seeds:
        if work.getpixel(seed) != MARK:
            ImageDraw.floodfill(work, seed, MARK, thresh=FLOOD_TOLERANCE)
    mask = Image.new("L", (w, h))
    mask.putdata([255 if px == MARK else 0 for px in work.get_flattened_data()])
    return mask.filter(ImageFilter.MedianFilter(5))


def ascii_portrait(photo: Image.Image, cols: int = 120) -> list[str]:
    rgb = photo.convert("RGB")
    grey = ImageOps.autocontrast(rgb.convert("L"), cutoff=1)
    grey = ImageEnhance.Contrast(grey).enhance(1.3)
    grey.paste(0, mask=background_mask(rgb))

    w, h = grey.size
    grey = grey.crop((int(w * CROP[0]), 0, int(w * CROP[1]), h))
    rows = int(grey.height / grey.width * cols * CELL_ASPECT)
    small = grey.resize((cols, rows), Image.LANCZOS)

    return [
        "".join(RAMP[small.getpixel((x, y)) * (len(RAMP) - 1) // 255] for x in range(cols)).rstrip()
        for y in range(rows)
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("photo", type=Path)
    parser.add_argument("--cols", type=int, default=120)
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "../site/src/assets/portrait.txt")
    args = parser.parse_args()
    lines = ascii_portrait(Image.open(args.photo), args.cols)
    args.out.write_text("\n".join(lines) + "\n")
    print(f"{args.out}: {args.cols} x {len(lines)}")


if __name__ == "__main__":
    main()
