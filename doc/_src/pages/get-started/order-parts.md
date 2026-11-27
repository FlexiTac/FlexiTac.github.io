---
title: Order parts
description: Design files, the bill of materials, and the manufacturer settings for the FPCs and the reading board.
---

You need three things for a FlexiTac-V2 setup: the **two sensor FPCs** and the **reading board** from a PCB manufacturer, plus a few **off-the-shelf parts** (Arduino Nano, cables, consumables). Fabrication takes 1–2 weeks including shipping, so order everything at once.

:::note[Source of truth]
This page summarizes the [FlexiTac Hardware Fabrication Guide](https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/edit?usp=sharing) (March 2026). If anything here disagrees with the guide, follow the guide, and please [report it](https://github.com/FlexiTac/FlexiTac.github.io/issues/new?title=Docs:+Order+parts&labels=documentation) so we can fix this page.
:::

## Design files {#design-files}

| Part | Files | Download |
| --- | --- | --- |
| **Top FPC** (V2 sensor) | Gerber, EasyEDA Pro export of 2026-03-02 | [Gerber_Top_FPC_2026-03-02.zip](/flexitac-gen/static/vendor/flexitac-v2/Gerber_Top_FPC_2026-03-02.zip) |
| **Bottom FPC** (V2 sensor) | Gerber, EasyEDA Pro export of 2026-03-02 | [Gerber_Bottom_FPC_2026-03-02.zip](/flexitac-gen/static/vendor/flexitac-v2/Gerber_Bottom_FPC_2026-03-02.zip) |
| **Reading board 32 × 16** (recommended) | Gerber, BOM, pick-and-place | [FlexiTac_reading_board_32x16.zip](/flexitac-gen/static/vendor/flexitac-reader/FlexiTac_reading_board_32x16.zip) · [schematic (PDF)](https://drive.google.com/file/d/1KEzet6f4s1i1d-GOSpwD5-4Peu2S67hL/view?usp=drive_link) |
| **Reading board 32 × 32** (development) | Gerber, BOM, pick-and-place | [FlexiTac_reading_board_32x32.zip](/flexitac-gen/static/vendor/flexitac-reader/FlexiTac_reading_board_32x32.zip) · [schematic (PDF)](https://drive.google.com/file/d/1bmmO034ZeR81Ba8OML_0MlkXvKADsflr/view?usp=drive_link) |

The downloads are unchanged copies of the files linked from the guide's "PCB Related Files" table, served from FlexiTac-Gen. Each reading-board ZIP bundles that board's Gerber ZIP, BOM and pick-and-place file; unzip it and upload the inner `Gerber_*.zip` as the Gerber.

<div class="figs drawing">
<figure><a class="zoom" href="/doc/assets/img/v2-fpc-top.svg"><img src="/doc/assets/img/v2-fpc-top.svg" alt="Top FPC layout of the FlexiTac-V2 sensor: 12 column electrodes with slots between them, and a tail to the gold fingers" loading="lazy"></a><figcaption>Top FPC</figcaption></figure>
<figure><a class="zoom" href="/doc/assets/img/v2-fpc-bottom.svg"><img src="/doc/assets/img/v2-fpc-bottom.svg" alt="Bottom FPC layout of the FlexiTac-V2 sensor: 32 row electrodes with slots between them, and an A-shaped tail to the gold fingers" loading="lazy"></a><figcaption>Bottom FPC</figcaption></figure>
</div>

### Which reading board? {#which-board}

Order the **32 × 16 board**. According to the Fabrication Guide, this board is enough to read the V2 sensor, and the firmware and PyFlexiTac support it out of the box.

<div class="figs drawing">
<figure><a class="zoom" href="/doc/assets/img/reading-board-32x16-cut.webp"><img src="/doc/assets/img/reading-board-32x16-cut.webp" alt="FlexiTac 32 × 16 reading board with an Arduino Nano and two FFC connectors" loading="lazy"></a><figcaption>32 × 16 reading board (use this one)</figcaption></figure>
<figure><a class="zoom" href="/doc/assets/img/reading-board-32x32-cut.webp"><img src="/doc/assets/img/reading-board-32x32-cut.webp" alt="FlexiTac 32 × 32 reading board" loading="lazy"></a><figcaption>32 × 32 reading board (development)</figcaption></figure>
</div>

| Board | Reads | Connectors | Use it for |
| --- | --- | --- | --- |
| **32 × 16** | Up to 32 lines on one side and 16 on the other | 32-pin + 16-pin FFC | FlexiTac-V2, and custom sensors that fit within 32 × 16 |
| **32 × 32** | Up to 32 lines on each side | 32-pin + 32-pin FFC | Larger custom sensors and development. Its firmware isn't covered by these docs yet. |

If you designed a custom sensor with [FlexiTac-Gen](/flexitac-gen/), the app tells you which board fits it.

:::tip[Order spares]
FPCs are cheap at quantity: about **$2.57 per top + bottom pair at 100 units**. Order a few extra sensors. Spares let you swap out a damaged sensor in seconds and tell a bad sensor from a bad board.
:::

## Bill of materials {#bom}

Prices and links are the ones in the Fabrication Guide. A quantity like 0.05 means one roll or sheet covers about 20 sensors.

### Sensor: about $4 each

| # | Part | Qty per sensor | Price | Where |
| ---: | --- | ---: | ---: | --- |
| 1 | **Top and bottom FPC** (key component) | 1 pair | $2.5 | PCB manufacturer, [see below](#order-the-fpcs) |
| 2 | Polyimide tape (4 in × 108 ft) | 0.01 | $21.98 | [Amazon](https://www.amazon.com/dp/B07N4QTXWS) |
| 3 | Pressure-sensitive conductive sheet (Velostat / Linqstat) | 0.05 | $4.95 | [Adafruit 1361](https://www.adafruit.com/product/1361) |
| 4 | Adhesive laminating sheets | 0.01 | $6.29 | [Amazon](https://a.co/d/02y7MDdy) |

### Reading board: about $30

| # | Part | Qty | Price | Where |
| ---: | --- | ---: | ---: | --- |
| 5 | **Reading board PCB** (key component) | 1 | $5 | PCB manufacturer, [see below](#order-the-reading-board) |
| 6 | Arduino Nano | 1 | $25.10 | [Amazon](https://www.amazon.com/dp/B0097AU5OU) |

### Cables and connectors: about $10

| # | Part | Qty | Price | Where |
| ---: | --- | ---: | ---: | --- |
| 7 | Flexible flat cable, 32-pin | 1 | $5.09 (5-pack) | [Amazon](https://a.co/d/0aJnyShh) |
| 8 | Flexible flat cable, 16-pin | 1 | $6.09 (5-pack) | [Amazon](https://www.amazon.com/dp/B07RWF5D83) |
| 9 | Mini-USB cable (must carry data) | 1 | $11.99 (2-pack) | [Amazon](https://www.amazon.com/dp/B091SQKMQK) |
| 10 | 20-pin FFC extender | 1 | $0.95 | [Adafruit 5203](https://www.adafruit.com/product/5203) |
| 11 | 40-pin FFC extender | 1 | $0.95 | [Adafruit 4523](https://www.adafruit.com/product/4523) |
| 12 | FFC extender, easy-install alternative to #10–11 | 2 | $0.55–0.88 | [AliExpress](https://www.aliexpress.us/item/3256801662408481.html) |

:::note[Which FFC extenders?]
The Adafruit extenders (#10, #11) used in the video are compact but need careful alignment and some practice to install. The AliExpress extenders (#12) are easier to install, although bulkier. On AliExpress, select the **16-pin** and **32-pin** variants.
:::

## Order the FPCs {#order-the-fpcs}

The guide's screenshots use JLCPCB's online quote. Order the top and bottom FPCs as two separate designs.

:::steps
#### Upload the Gerber and choose Flex
Upload `Gerber_Top_FPC_2026-03-02.zip`. Set **Base Material** to **Flex**, keep 2 layers and choose your quantity.

![PCB quote form with Flex selected as the base material](/doc/assets/img/order-fpc-flex.webp "Base material: Flex, 2 layers.")

#### Set the thickness to 0.2 mm
Under **PCB Specifications**, set **PCB Thickness** to **0.2 mm**. You can leave the other options at their defaults, as in the screenshot (yellow coverlay, ENIG finish).

![PCB specifications with 0.2 mm thickness selected](/doc/assets/img/order-fpc-specs.webp "PCB Thickness: 0.2 mm.")

#### Enable gold fingers
Under **High-spec Options**, set **Gold Fingers: Yes** and **Gold Fingers Thickness: 0.3 mm**. The gold fingers are the ends that plug into the FFC connectors. The V2 Gerbers include a stiffener layer under them, which the quote form picks up automatically ("Based on EasyEDA Stiffener Layer").

![High-spec options with Gold Fingers set to Yes and thickness 0.3 mm highlighted](/doc/assets/img/order-fpc-goldfinger.webp "Gold Fingers: Yes, thickness 0.3 mm.")

#### Repeat for the bottom FPC
Repeat steps 1–3 with `Gerber_Bottom_FPC_2026-03-02.zip`. The bottom FPC needs the same thickness and gold fingers. At a 100-unit scale, a top + bottom pair costs about $2.57.
:::

## Order the reading board {#order-the-reading-board}

Have the manufacturer assemble the board (PCBA) so the components arrive already soldered.

:::steps
#### Upload the Gerber and enable assembly
Upload the reading board's Gerber (`Gerber_16_32.zip` for the 32 × 16 board). Keep **FR-4**, 2 layers, then enable **PCB Assembly** with the assembly side set as in the guide (**Bottom**).

![Quote form for the 32 × 16 reading board on FR-4](/doc/assets/img/order-pcba.webp "The 32 × 16 reading board in the quote form.")

#### Upload the BOM and pick-and-place files
Upload `BOM_05mm_FFC_16_32_1mux_4sr_2025-11-01.csv` and `PickAndPlace_PCB_05mm_FFC_16_32_1mux_4sr_2025-11-01.csv`. Check that every component is in stock. If a part is out of stock, choose an equivalent before you continue.

![BOM and pick-and-place upload fields](/doc/assets/img/order-pcba-bom.webp "Upload the BOM and the pick-and-place (CPL) file.")

#### Review the placement
Check the assembly draft and the 3D render: every part should sit on its footprint and face the right way.

![3D render of the assembled reading board](/doc/assets/img/order-pcba-review.webp "Review the 3D render before you order.")

#### Place the order
The quoted price covers 5 boards. Delivery takes about one week.
:::

:::note[Licensing]
The FlexiTac hardware is © 2026 Columbia University, licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). You may build, share and adapt it for non-commercial purposes, with attribution. The license doesn't cover commercial use.
:::

## Next

When the parts arrive, continue to [Fabricate a sensor](/doc/get-started/fabricate/).
