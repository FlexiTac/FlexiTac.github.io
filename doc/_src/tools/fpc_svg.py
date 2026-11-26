"""Draw the FlexiTac-V2 FPCs as SVG for the docs (Order parts page), in Learn FlexiTac's look.

    python3 doc/_src/tools/fpc_svg.py [DATA_DIR]

DATA_DIR holds Learn FlexiTac's shared geometry (fpc_top.json, fpc_bot.json and their *_silk.json), traced from the
V2 Gerbers (EasyEDA Pro export of 2026-03-02). Default: ~/learn_flexitac/flexitac-anatomy/shared/data.
Writes doc/assets/img/v2-fpc-top.svg and v2-fpc-bottom.svg: the copper side, Gerber frame (x right, y up), on a
transparent background so the drawings sit on the page in both themes.

The colours are Learn's (learn-flexitac/src/widgets/assemble3d/models.ts):
- polyimide #df8401, outline #6b2a03;
- fan-out traces under the coverlay #cf6503;
- exposed electrodes and gold fingers in an ENIG gradient #a48e62 -> #ebdfbf -> #cdb98c;
- silkscreen #f4efe2.
The slots between the electrodes and the tail's window are drawn as holes.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "assets", "img"))
DATA = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/learn_flexitac/flexitac-anatomy/shared/data")

PI, PI_EDGE, CU, SILK = "#df8401", "#6b2a03", "#cf6503", "#f4efe2"
ENIG = ("#a48e62", "#ebdfbf", "#cdb98c")
MARGIN = 0.6                                     # mm around the board


def f(v):
    return ("%.3f" % v).rstrip("0").rstrip(".")


def ring(pts):
    """A closed polygon in SVG coordinates (y flipped)."""
    return "M" + " L".join("%s %s" % (f(x), f(-y)) for x, y in pts) + " Z"


def rect(r):
    return ring([(r["x0"], r["y0"]), (r["x1"], r["y0"]), (r["x1"], r["y1"]), (r["x0"], r["y1"])])


def draw(which, title, out_name):
    d = json.load(open(os.path.join(DATA, "fpc_%s.json" % which)))
    silk = json.load(open(os.path.join(DATA, "fpc_%s_silk.json" % which)))
    x0, y0, x1, y1 = d["outline"]["bbox"]
    vx, vy, vw, vh = x0 - MARGIN, -y1 - MARGIN, (x1 - x0) + 2 * MARGIN, (y1 - y0) + 2 * MARGIN
    holes = [ring(w["pts"]) for w in d["windows"]] + [rect(r) for r in d.get("slots", {}).get("rects", [])]
    board = ring(d["outline"]["pts"]) + "".join(holes)
    traces = "".join('<polyline points="%s"/>' % " ".join("%s,%s" % (f(x), f(-y)) for x, y in t["pts"])
                     for t in d["fanout"]["traces"])
    tw = d["fanout"]["traces"][0]["width"] * 1.1                     # Learn draws them 10% wider
    pads = "".join('<path d="%s"/>' % rect(r) for r in d["electrodes"]["rects"] + d["fingers"]["rects"])
    silk_d = "".join(ring(r["pts"]) for r in silk["regions"])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(vx)} {f(vy)} {f(vw)} {f(vh)}" width="{f(vw * 10)}" height="{f(vh * 10)}" role="img" aria-labelledby="t">
<title id="t">{title}</title>
<defs><linearGradient id="enig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{ENIG[0]}"/><stop offset=".5" stop-color="{ENIG[1]}"/><stop offset="1" stop-color="{ENIG[2]}"/></linearGradient></defs>
<path d="{board}" fill="{PI}" fill-rule="evenodd" stroke="{PI_EDGE}" stroke-width="0.18" stroke-linejoin="round"/>
<g fill="none" stroke="{CU}" stroke-width="{f(tw)}" stroke-linecap="round" stroke-linejoin="round">{traces}</g>
<g fill="url(#enig)">{pads}</g>
<path d="{silk_d}" fill="{SILK}" fill-rule="evenodd"/>
</svg>
'''
    path = os.path.join(OUT, out_name)
    open(path, "w").write(svg)
    print("wrote", path, len(svg) // 1024, "KB")


draw("top", "Top FPC of the FlexiTac-V2 sensor, copper side", "v2-fpc-top.svg")
draw("bot", "Bottom FPC of the FlexiTac-V2 sensor, copper side", "v2-fpc-bottom.svg")
