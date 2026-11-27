"""Draw one pad of one recorded frame as a 12 x 32 grid: each cell shows its reading and is coloured by it.

    python3 doc/_src/tools/tactile_svg.py [frame] [pad] [sample]

Reads a viewer sample (default doc/assets/data/isaac-aloha.{json,bin}, the same data as the 3D viewer on Tactile
representation) and writes doc/assets/img/tactile-map.svg. Each cell shows its reading; the colours run up to the
pad's strongest reading. Standard library only.
"""
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "doc/assets/data" / (sys.argv[3] if len(sys.argv) > 3 else "isaac-aloha")
OUT = ROOT / "doc/assets/img/tactile-map.svg"
ROWS, COLS = 12, 32

frame = int(sys.argv[1]) if len(sys.argv) > 1 else 30
pad = int(sys.argv[2]) if len(sys.argv) > 2 else 0

meta = json.loads(DATA.with_suffix(".json").read_text())
buf = DATA.with_suffix(".bin").read_bytes()
F, P, T = meta["frames"], meta["nPc"], meta["nTac"]
off = F * P * 3 * 2 + F * T * 3 * 2
readings = buf[off:off + F * T]
base = frame * T + pad * ROWS * COLS
# stored column by column: point i is (row i % ROWS, column i // ROWS)
grid = [[readings[base + c * ROWS + r] / 255 for c in range(COLS)] for r in range(ROWS)]
peak = max(max(row) for row in grid) or 1.0

# viridis, 9 stops
VIR = [(68, 1, 84), (71, 44, 122), (59, 81, 139), (44, 113, 142), (33, 144, 141),
       (39, 173, 129), (92, 200, 99), (170, 220, 50), (253, 231, 37)]


def colour(v):
    x = max(0.0, min(1.0, v)) * (len(VIR) - 1)
    i = min(int(x), len(VIR) - 2)
    f = x - i
    a, b = VIR[i], VIR[i + 1]
    return tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3))


CW, CH, LX, TY = 22, 20, 26, 22          # cell size, left and top margins (axis labels)
W, H = LX + COLS * CW + 2, TY + ROWS * CH + 2
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
       f'font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" role="img" '
       f'aria-label="A 12 by 32 grid of tactile readings; the pressed taxels form a diagonal line">']
out.append('<g font-size="8" fill="#8a94a6" text-anchor="middle">')
for c in range(0, COLS, 4):
    out.append(f'<text x="{LX + c * CW + CW / 2}" y="{TY - 8}">{c}</text>')
out.append(f'<text x="{LX - 13}" y="{TY - 8}" text-anchor="middle">r\\c</text>')
for r in range(ROWS):
    out.append(f'<text x="{LX - 12}" y="{TY + r * CH + CH / 2 + 3}">{r}</text>')
out.append("</g>")
out.append(f'<g font-size="8.5" text-anchor="middle">')
for r in range(ROWS):
    for c in range(COLS):
        v = grid[r][c]
        rgb = colour(v / peak)
        x, y = LX + c * CW, TY + r * CH
        out.append(f'<rect x="{x}" y="{y}" width="{CW - 1}" height="{CH - 1}" rx="2" fill="rgb{rgb}"/>')
        txt = "0" if v < 0.005 else ("1" if v > 0.995 else f"{v:.2f}"[1:])
        lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
        fill = "#1b1530" if lum > 140 else ("#ffffff" if v >= 0.005 else "#a99bc4")
        out.append(f'<text x="{x + (CW - 1) / 2}" y="{y + CH / 2 + 2.5}" fill="{fill}">{txt}</text>')
out.append("</g></svg>")
OUT.write_text("\n".join(out) + "\n")
print(OUT.relative_to(ROOT), f"frame {frame}, pad {pad}, {sum(v > 0.005 for row in grid for v in row)} taxels pressed")
