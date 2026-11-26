from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "assets" / "incoming"
OUT = ROOT / "assets" / "img"
NAVY = (7, 17, 37)
ORANGE = (255, 102, 0)
CYAN = (70, 206, 255)

OUT.mkdir(parents=True, exist_ok=True)


def clean(path):
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    return image.convert("RGBA")


def save_below(image, path, limit_kb, fmt="WEBP", start=84):
    for quality in range(start, 39, -5):
        image.save(path, fmt, quality=quality, method=6)
        if path.stat().st_size <= limit_kb * 1024:
            return path.stat().st_size
    return path.stat().st_size


def resized(image, width):
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def process_photo(name, stem, limit_kb=100):
    image = clean(INCOMING / name)
    for width in (480, 960, 1600):
        out = OUT / f"{stem}-{width}.webp"
        size = save_below(resized(image, width), out, limit_kb)
        print(f"{out.name}: {size // 1024} KB")


def process_logo():
    logo = clean(INCOMING / "ocatech-logo.png")
    for width in (480, 960):
        out = OUT / f"logo-{width}.webp"
        save_below(resized(logo, width), out, 100, start=90)
        print(f"{out.name}: {out.stat().st_size // 1024} KB")
    for size, filename in ((32, "favicon-32.png"), (180, "apple-touch-icon.png"), (192, "favicon-192.png"), (512, "favicon-512.png")):
        canvas = Image.new("RGBA", (size, size), NAVY + (255,))
        mark = resized(logo, round(size * 0.82))
        canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
        canvas.convert("RGB").save(OUT / filename, "PNG", optimize=True)
        print(f"{filename}: {(OUT / filename).stat().st_size // 1024} KB")


def gradient(width, height):
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)
    for y in range(height):
        t = y / max(1, height - 1)
        colour = tuple(round(NAVY[i] * (1 - t) + (11, 27, 56)[i] * t) for i in range(3))
        draw.line((0, y, width, y), fill=colour)
    return image


def share_card():
    card = gradient(1200, 630)
    draw = ImageDraw.Draw(card)
    draw.rectangle((0, 0, 1200, 10), fill=ORANGE)
    draw.rectangle((0, 620, 1200, 630), fill=CYAN)
    logo = clean(INCOMING / "ocatech-logo.png")
    logo.thumbnail((560, 330), Image.Resampling.LANCZOS)
    card.paste(logo, ((1200 - logo.width) // 2, 120), logo)
    card.save(OUT / "share-card.png", "PNG", optimize=True)
    print(f"share-card.png: {(OUT / 'share-card.png').stat().st_size // 1024} KB")


def video_poster():
    poster = gradient(1280, 720)
    draw = ImageDraw.Draw(poster)
    draw.rectangle((0, 0, 1280, 8), fill=ORANGE)
    draw.rectangle((0, 712, 1280, 720), fill=CYAN)
    logo = clean(INCOMING / "ocatech-logo.png")
    logo.thumbnail((420, 260), Image.Resampling.LANCZOS)
    poster.paste(logo, ((1280 - logo.width) // 2, (720 - logo.height) // 2), logo)
    poster.save(OUT / "video-poster.webp", "WEBP", quality=82, method=6)
    print(f"video-poster.webp: {(OUT / 'video-poster.webp').stat().st_size // 1024} KB")


process_logo()
process_photo("training-lab.png", "training-lab", 100)
process_photo("training.png", "training", 100)
process_photo("digital-skill-training-instructor guide.png", "instructor-guide", 100)
share_card()
video_poster()
