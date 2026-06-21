from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(r"D:\Pet_Sevice\tmp\good-design-source")
paths = sorted(root.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[1]))
pages = [Image.open(p).convert("RGB") for p in paths]
thumb = (510, 660)
for sheet_idx in range((len(pages) + 5) // 6):
    canvas = Image.new("RGB", (1560, 1370), "#707070")
    draw = ImageDraw.Draw(canvas)
    for local, page in enumerate(pages[sheet_idx * 6 : sheet_idx * 6 + 6]):
        im = ImageOps.contain(page, thumb)
        x = 10 + (local % 3) * 515
        y = 30 + (local // 3) * 675
        canvas.paste(im, (x, y))
        draw.text((x + 5, y - 18), f"Page {sheet_idx * 6 + local + 1}", fill="white")
    canvas.save(root / f"contact-{sheet_idx + 1}.png")
