# The original FlexiTac sensor (FlexiTac V2, 12 x 32 taxels at 2 mm)

The Library's showcase shows the original, hand-designed FlexiTac sensor
pad beside the sensors FlexiTac-Gen generates.  Its two FPCs were laid out
by hand in EasyEDA Pro; nothing in this folder was made by the generator's
engine, and none of it is a FlexiTac-Gen build (no build id, no Gerber ZIP
of ours).  The files are served from this folder so the app stays offline
and keeps its Content Security Policy (`default-src 'self'`).

## The design and its licence

- The design: the FlexiTac hardware, "FlexiTac: An Open-Source, Scalable
  Tactile Solution for Robotic Systems" by Binghao Huang and Yunzhu Li,
  Columbia University (`https://flexitac.github.io`, the hardware
  repository `https://github.com/FlexiTac/FlexiTac`).
- The licence: the hardware repository's `readme.md` (at its commit
  `cc62b7c2995a54153ff3174a5d25e5bf7313392c`, read on 2026-11-12) states:
  "FlexiTac © 2026 by Columbia University is licensed under CC BY-NC 4.0.
  To view a copy of this license, visit
  https://creativecommons.org/licenses/by-nc/4.0/".  The files of this
  folder that are derived from that design (the table below) are therefore
  **not** under this repository's Apache-2.0 licence: they are
  Creative Commons Attribution-NonCommercial 4.0 International material of
  Columbia University, used here with attribution, changed as the table
  says.
- The source: the two Gerber ZIPs that the public hardware tutorial links,
  "FlexiTac Hardware Fabrication Guide"
  (`https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/`,
  its table "PCB Related Files"): `Gerber_Top_FPC_2026-03-02.zip` (SHA-256
  `496c348c6fc236b03d23ba3f84d6a2c70ae3e66efba570a7889a990db171b621`) and
  `Gerber_Bottom_FPC_2026-03-02.zip` (SHA-256
  `a2e0da2e0e36dc194c09db6e6f207d0508f7f3e9634666cdfa4ab48846397f6a`),
  EasyEDA Pro v3.2.91 exports of 2026-03-02.  The ZIPs themselves are not in
  this repository; order the boards from the tutorial's own files.

## Files

| File | Source | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `geometry.json` | the two Gerber ZIPs above (their outline, top copper, top solder mask and stiffener layers) | CC BY-NC 4.0, Columbia University (FlexiTac, Binghao Huang and Yunzhu Li) | modified: the two FPCs' outlines, slots, window, electrodes, traces, gold fingers, coverlay openings and stiffeners read into one JSON document by `tools/flexitac_v2.py` (the FlexiTac-Gen project, 2026); the silkscreen, the drill and document layers and the order files are left out | `f472ddc1ad3a5ca2002a556feac38af4bf642a0f954eadbcca329c64ac226b81` |
| `art.json.gz` | `geometry.json` above | CC BY-NC 4.0, Columbia University (FlexiTac, Binghao Huang and Yunzhu Li) | modified: the two FPCs drawn from `geometry.json` by FlexiTac-Gen's own SVG writer and its page's Photo look (`tools/browser/flexitac_v2_art.py`, the FlexiTac-Gen project, 2026): each board's copper and polyimide side as SVG documents with its outline (of the stiffeners only the 0.2 mm ones under the gold ends are drawn), a `flexitac-library-art/v1` document (`docs/LIBRARY_VIEW.md`), gzip | `d25710d94993f05c4740978cf5d8293a8f35eac71521544804978bec471d3b7f` |

`umi-finray.placed.json` is this project's own (Apache-2.0, as the
repository): where the pad lies on the UMI fin-ray finger of
`web/vendor/umi/` (the HandUMI finger, its own notice there) and how its
tails go round it, placed by hand after the tutorial and the project page's
photo of the assembled sensor (`docs/LIBRARY_VIEW.md`, "A placed sensor").
The drawing of the pad on the finger is this project's own too; it shows
neither the laminating sheets, the polyimide tape, the silkscreen, the
extender boards nor the flat cables of the real assembly.
