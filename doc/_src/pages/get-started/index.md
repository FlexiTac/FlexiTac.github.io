---
title: Quickstart
description: The whole path from ordering parts to a live tactile heatmap, with time, cost and the commands you'll run.
---

This guide walks you through building one **FlexiTac-V2** sensor (32 × 12 taxels), connecting it to a **32 × 16 reading board**, and streaming it live to a heatmap on your computer. This is the standard setup: the fabrication guide, the firmware and PyFlexiTac all default to it. Each step links to a detailed page.

:::tip[Need a different shape or size?]
Generate the two FPCs for your own gripper or fingertip with [FlexiTac-Gen](/flexitac-gen/). It also tells you which reading board fits your design. Ordering and fabrication work the same way. Flash and read it with your sensor's rows and columns, as described in [Match the reader to the firmware](/doc/get-started/pyflexitac/#rows). Designs that need the 32 × 32 board aren't covered by these docs yet.
:::

![Assembled FlexiTac sensor with reading board and Arduino Nano (left) and the 32 × 12 sensor pad (right)](/doc/assets/img/v2-assembly-overview.webp "What you'll build: (a) an assembled sensor on a soft gripper, wired to the 32 × 16 reading board; (b) the 32 × 12 sensor pad.")

## At a glance

<div class="stats">
<div class="stat"><b>&lt; 3 min</b><span>to fabricate one sensor</span></div>
<div class="stat"><b>~$4</b><span>materials per sensor</span></div>
<div class="stat"><b>~$30</b><span>reading board + Arduino Nano</span></div>
<div class="stat"><b>1–2 weeks</b><span>FPC / PCB lead time</span></div>
</div>

Costs are the estimates from the [Hardware Fabrication Guide](https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/edit?usp=sharing) (March 2026). Cables, connectors and consumables add roughly $10.

### What you need

- **A computer** running Linux or macOS (the platforms the existing guides document), with **Python 3.11 or newer**.
- **An Arduino Nano** and a USB cable that carries data, not just power.
- **Two FPCs and one reading board**, ordered from a PCB manufacturer using the open design files (step 1).
- **Consumables:** pressure-sensitive conductive film (Velostat or Linqstat), adhesive laminating sheets and polyimide tape.
- **Flat flexible cables and FFC extenders** (16-pin and 32-pin) to connect the sensor to the board.

No soldering is needed to fabricate the sensor itself. You can have the reading board assembled by the manufacturer (PCBA) when you order it.

## Steps

:::steps
#### Order the parts
Upload the Gerber files for the top FPC, the bottom FPC and the reading board to a PCB manufacturer, and order the consumables from the bill of materials. Order a few spare sensors: they're cheap, and spares make debugging easier.

[Bill of materials and ordering settings →](/doc/get-started/order-parts/)

#### Fabricate the sensor
Laminate each FPC onto an adhesive sheet, put Velostat between them, seal the edges with polyimide tape and plug the gold fingers into the connectors. This takes under three minutes.

[Step-by-step fabrication with photos →](/doc/get-started/fabricate/)

#### Stream the sensor
Open PyFlexiTac's firmware sketch in the Arduino IDE and upload it to the reading board's Arduino Nano. Then install PyFlexiTac, find the serial port and open a live heatmap:

```bash
pip install "flexitac[examples]"
flexitac-find-port
flexitac-heatmap --port /dev/ttyUSB0
```

[Stream the sensor →](/doc/get-started/stream/)
:::

## Already have an assembled sensor?

If someone handed you a working sensor and reading board, these four commands are the entire setup:

```bash title="Terminal"
pip install "flexitac[examples]"      # Python 3.11+
flexitac-flash                        # needs arduino-cli; or use the Arduino IDE
flexitac-find-port                    # which /dev/tty* is the sensor
flexitac-heatmap --port /dev/ttyUSB0  # press the pad
```

## You're done when…

- [ ] `flexitac-stream` ([Check the signal](/doc/get-started/pyflexitac/#stream)) reports a steady frame rate (about **100+ fps** for a 32 × 12 sensor).
- [ ] `raw_max` changes when you press the sensor, and isn't stuck at 0 or 255.
- [ ] A bright spot in `flexitac-heatmap` follows your fingertip across **every** row and column.

:::tip[Stuck?]
Most first-time problems are a serial permission, a cable that only charges, or firmware and reader disagreeing on the number of rows. [Troubleshooting](/doc/get-started/troubleshooting/) covers each of these by symptom. You can also ask on the [Discord](https://discord.gg/6gw887Vxms).
:::
