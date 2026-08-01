from __future__ import annotations

import json
import shutil
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont, ImageStat


PDF = Path(r"E:\gYM\Complete_Gym_Equipment_Handbook_Revised.pdf")
OUT = Path(r"E:\gYM\.handbook_qa\rendered")
PAGES = OUT / "pages"
SHEETS = OUT / "sheets"
DPI = 110


def label_font(size: int = 24):
    try:
        return ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", size)
    except OSError:
        return ImageFont.load_default()


def ink_fraction(image: Image.Image) -> float:
    gray = image.convert("L")
    histogram = gray.histogram()
    dark = sum(histogram[:245])
    return dark / (image.width * image.height)


def edge_fraction(image: Image.Image, strip: int = 8) -> float:
    gray = image.convert("L")
    edges = [
        gray.crop((0, 0, gray.width, strip)),
        gray.crop((0, gray.height - strip, gray.width, gray.height)),
        gray.crop((0, 0, strip, gray.height)),
        gray.crop((gray.width - strip, 0, gray.width, gray.height)),
    ]
    dark = 0
    pixels = 0
    for edge in edges:
        hist = edge.histogram()
        dark += sum(hist[:235])
        pixels += edge.width * edge.height
    return dark / pixels


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    PAGES.mkdir(parents=True)
    SHEETS.mkdir(parents=True)

    doc = fitz.open(PDF)
    scale = DPI / 72
    rendered: list[Path] = []
    metrics: list[dict] = []
    for index, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        path = PAGES / f"page_{index:03d}.png"
        pix.save(path)
        rendered.append(path)
        with Image.open(path) as image:
            metrics.append({
                "page": index,
                "ink_fraction": round(ink_fraction(image), 6),
                "edge_fraction": round(edge_fraction(image), 6),
                "width": image.width,
                "height": image.height,
            })

    sheet_paths: list[Path] = []
    font = label_font()
    gap = 28
    label_h = 36
    for sheet_no, offset in enumerate(range(0, len(rendered), 4), 1):
        items = rendered[offset:offset + 4]
        sample = Image.open(items[0])
        page_w, page_h = sample.size
        sample.close()
        sheet = Image.new("RGB", (page_w * 2 + gap * 3, (page_h + label_h) * 2 + gap * 3), "#B8C0C7")
        draw = ImageDraw.Draw(sheet)
        for slot, path in enumerate(items):
            row, col = divmod(slot, 2)
            x = gap + col * (page_w + gap)
            y = gap + row * (page_h + label_h + gap)
            page_no = offset + slot + 1
            draw.rectangle((x, y, x + page_w, y + label_h), fill="#10171D")
            draw.text((x + 12, y + 4), f"PAGE {page_no}", font=font, fill="white")
            with Image.open(path) as image:
                sheet.paste(image, (x, y + label_h))
        out = SHEETS / f"sheet_{sheet_no:02d}_pages_{offset + 1:03d}-{offset + len(items):03d}.jpg"
        sheet.save(out, quality=88, optimize=True)
        sheet_paths.append(out)

    report = {
        "pdf": str(PDF),
        "page_count": len(rendered),
        "sheet_count": len(sheet_paths),
        "blank_page_candidates": [m["page"] for m in metrics if m["ink_fraction"] < 0.004],
        "edge_contact_candidates": [m["page"] for m in metrics if m["edge_fraction"] > 0.002],
        "metrics": metrics,
    }
    (OUT / "render_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "metrics"}, indent=2))


if __name__ == "__main__":
    main()
