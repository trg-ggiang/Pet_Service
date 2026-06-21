from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(r"D:\Pet_Sevice\tmp\docx-render")
page_paths = sorted(root.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[1]))
pages = [Image.open(path).convert("RGB") for path in page_paths]
thumb_size = (595, 842)

for sheet_idx in range((len(pages) + 3) // 4):
    canvas = Image.new("RGB", (1220, 1734), "#707070")
    draw = ImageDraw.Draw(canvas)
    for local_idx, page in enumerate(pages[sheet_idx * 4 : sheet_idx * 4 + 4]):
        thumb = ImageOps.contain(page, thumb_size)
        x = 10 + (local_idx % 2) * 605
        y = 25 + (local_idx // 2) * 855
        canvas.paste(thumb, (x, y))
        draw.text((x + 8, y - 18), f"Page {sheet_idx * 4 + local_idx + 1}", fill="white")
    canvas.save(root / f"contact-{sheet_idx + 1}.png")
