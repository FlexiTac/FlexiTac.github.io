# The FlexiTac reading boards (32 x 16 and 32 x 32)

The Library's windows and Gen by Surface's step 3 offer each sensor the
FlexiTac reading board its lines fit (the user's request of 2026-11-17):
the 32 x 16 board for a sensor of at most 32 lines on its larger side and
16 on its smaller, else the 32 x 32 board for at most 32 on each; in
step 3, a design whose tails were sized to a reader's connectors gets the
board with those connectors (16 and 32 pins, 32 and 32), or none
(`web/boards.js`).  The boards were laid out by hand in EasyEDA (the
32 x 16 board's Gerbers are EasyEDA v6.5.51 exports of 2026-04-03, the
32 x 32 board's EasyEDA Pro v3.2.109 exports of 2026-04-02, as their
headers say); nothing in this folder was made by the generator's engine.
The files are served from this folder so the app stays offline and keeps
its Content Security Policy (`default-src 'self'`).

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
  folder are therefore **not** under this repository's Apache-2.0 licence:
  they are Creative Commons Attribution-NonCommercial 4.0 International
  material of Columbia University, used here with attribution, unchanged
  (each bundle only puts a board's three files in one ZIP).
- The source: the public hardware tutorial, "FlexiTac Hardware Fabrication
  Guide"
  (`https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/`,
  its table "PCB Related Files": "Reading Board 32x16", "This one is
  enough for reading above sensor", and "Reading Board 32x32", "Develop
  purpose"), each file downloaded from the Google Drive link the table
  gives on 2026-11-17.  Of each board the Gerber ZIP, the BOM and the
  pick-and-place file are here; the schematic is not.

## Files

Each bundle is written by `tools/flexitac_downloads.py` from the files
below, stored (not compressed) in name order with fixed metadata, so its
bytes depend on theirs alone; `--check` re-derives each bundle from the
members it holds and compares the served bytes (the site build runs the
same check).

| File | Holds (unchanged) | Licence and holder | SHA-256 |
| --- | --- | --- | --- |
| `FlexiTac_reading_board_32x16.zip` (50,257 bytes) | `Gerber_16_32.zip` (46,875 bytes, SHA-256 `53f9f9014d84066678e2b69d501b885ad4680ca8e9ee2d180887078db43416a0`), `BOM_05mm_FFC_16_32_1mux_4sr_2025-11-01.csv` (1,116 bytes, SHA-256 `fe735edb181e4945091afa5095ae9263d9c42355f01f84ae753a34e075762349`), `PickAndPlace_PCB_05mm_FFC_16_32_1mux_4sr_2025-11-01.csv` (1,790 bytes, SHA-256 `e72a32b9ed10d738f2fb837612f19c8dfec1fa6d7d3899207b731cac0ab4b228`) | CC BY-NC 4.0, Columbia University (FlexiTac, Binghao Huang and Yunzhu Li) | `af488c7f85845d8b03daf58327a6cd0209268a47a97c748dbf09e05867e889a5` |
| `FlexiTac_reading_board_32x32.zip` (92,579 bytes) | `Gerber_32_32.zip` (80,128 bytes, SHA-256 `07cee864e337fddbbf488b52f03c7c46d0753b5bed8953306dde035ca4f2180d`), `BOM_32_32.xlsx` (5,819 bytes, SHA-256 `6836d7a8fed496a1d761e6ac19bc0128a96b6db8a7b4931299c70ed22ab21b13`), `PickAndPlace_32_32.xlsx` (6,276 bytes, SHA-256 `300d2076fd740d85d8500a97bb7561bc1c57a5f408e703993e98d73d8dee23f8`) | CC BY-NC 4.0, Columbia University (FlexiTac, Binghao Huang and Yunzhu Li) | `5e8fa8ed642346b943077272a72509bb622e4dc8de60f7bfef88cbbf98194aba` |
