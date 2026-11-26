"""Turn a photo that was cut out onto pure black into a transparent cut-out (pure PIL).

    python3 doc/_src/tools/cutout_black.py in.webp out.webp [threshold]

Only black that touches the image border becomes transparent (flood fill from the edges), so black parts inside the
subject, such as chips and pin headers, stay. Background = pixels whose brightest channel is <= threshold (default 2:
the cut-outs here have a background of exactly 0, and a looser threshold leaks into black plastic that touches the
outline, such as the Nano's pin header). The outline is then smoothed, which removes the 1-2 px spikes the strict
threshold leaves where compression lifted the background slightly above 0.
The edge: pin-holes are closed, specks dropped, the rim trimmed by two pixels and feathered, and the rim's colour
divided by its alpha. The original edge was blended against black, so this lifts it back instead of leaving a dark
halo on a light page.
"""
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
T = int(sys.argv[3]) if len(sys.argv) > 3 else 2

im = Image.open(src).convert("RGB")
w, h = im.size
r, g, b = im.split()
brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
cand = brightest.point(lambda v: 255 if v <= T else 0)

pad = Image.new("L", (w + 2, h + 2), 255)                      # a frame of "black" joins every border region
pad.paste(cand, (1, 1))
ImageDraw.floodfill(pad, (0, 0), 128)
fg = pad.crop((1, 1, w + 1, h + 1)).point(lambda v: 0 if v == 128 else 255)

fg = fg.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))    # close pin-holes
fg = fg.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))    # drop specks
fg = fg.filter(ImageFilter.GaussianBlur(2)).point(lambda v: 255 if v >= 128 else 0)   # smooth the outline: no spikes
fg = fg.filter(ImageFilter.MinFilter(5))                                     # trim the black-blended rim (2 px)
alpha = fg.filter(ImageFilter.GaussianBlur(1.0))

px, ap = im.load(), alpha.load()
for y in range(h):
    for x in range(w):
        a = ap[x, y]
        if 0 < a < 250:                                           # un-premultiply the feathered rim (bg was black)
            k = min(255.0 / max(a, 1), 2.5)
            c = px[x, y]
            px[x, y] = (min(255, int(c[0] * k)), min(255, int(c[1] * k)), min(255, int(c[2] * k)))
out = im.copy()
out.putalpha(alpha)
bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()     # crop to the subject plus a small margin
if bbox:
    m = 8
    out = out.crop((max(0, bbox[0] - m), max(0, bbox[1] - m), min(w, bbox[2] + m), min(h, bbox[3] + m)))
out.save(dst, quality=90, method=6)
print("wrote", dst, out.size)
