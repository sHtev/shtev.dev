from PIL import Image, ImageDraw

from portrait import ascii_portrait

BACKGROUND = (106, 187, 217)  # the flat studio blue of the source photo


def synthetic_photo() -> Image.Image:
    img = Image.new("RGB", (400, 290), BACKGROUND)
    ImageDraw.Draw(img).ellipse((140, 40, 260, 250), fill=(235, 215, 200))  # light, like a face
    return img


def test_dimensions():
    lines = ascii_portrait(synthetic_photo(), cols=120)
    # crop keeps 58% of the width; rows scale by the 0.4 VT323 cell aspect
    assert len(lines) == int(290 / (400 * 0.58) * 120 * 0.4)
    assert max(len(line) for line in lines) <= 120


def test_background_removed():
    lines = ascii_portrait(synthetic_photo(), cols=120)
    assert all(line.strip() == "" for line in lines[:3])
    assert all(line[:10].strip() == "" for line in lines)


def test_subject_drawn():
    lines = ascii_portrait(synthetic_photo(), cols=120)
    assert any(line.strip() for line in lines[20:40])
