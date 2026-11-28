---
title: Troubleshooting & FAQ
sidebar_label: Troubleshooting
description: Find your symptom, then work through the checks from most to least likely.
---

## What do you see? {#symptoms}

| Area | What you see | Go to |
| --- | --- | --- |
| **USB, driver, permissions** | No serial port, `Permission denied`, a low frame rate | [No port](#no-port) · [Permission denied](#permission-denied) · [Low frame rate](#low-fps) |
| **Firmware, baud rate** | The upload fails; no frames, `fps=0` or `TimeoutError` | [Flashing fails](#flash-fails) · [No frames](#no-frames) |
| **FFC, hardware connections** | Rows with gaps, dead rows or columns, `raw_max` stuck at 0 or 255 | [Rows with gaps](#short) · [Dead rows](#dead-rows) · [Stuck at 0 or 255](#stuck) |
| **Array shape, firmware mismatch** | A scrambled, shifted or slanted picture | [Scrambled or shifted](#scrambled) |
| **Baseline, mounting, signal quality** | Saturates, barely changes, or noisy and drifting at rest | [Saturates or flat](#range) · [Noisy or drifting](#noisy) |

Not sure which? Run `flexitac-stream --port <port>`. Its output (fps, `raw_max`, `norm_max`) tells you which layer is failing:

- **Frames arrive at full rate, but some taxels are dead, stuck or light up in the wrong place:** the sensor, its connectors or its cables. See [Hardware problems](#hardware).
- **No serial port, no frames, a failed upload, or a picture that's wrong across the whole sensor:** the reading board's firmware, the USB connection or the reader settings. See [Firmware and reading problems](#firmware).

## Hardware problems {#hardware}

These stay with the sensor, a connector or a cable. If you have a spare, swapping it in moves the fault with it.

### Rows with gaps, dead rows or identical readings {#short}

<figure class="sample trouble-clip">
<video src="/doc/assets/video/trouble-ffc-short.mp4" poster="/doc/assets/img/trouble-ffc-short.webp" width="420" height="240" muted loop playsinline preload="none" data-inview aria-label="Live heatmap of a sensor with two shorted lines: each press lights up two patches, one above the other in the same column"></video>
<figcaption><span class="sample-tag">Example</span>Gold fingers that went into their extender at an angle. Each press lights up two patches in the same column instead of one.</figcaption>
</figure>

Typical signs:

- **A press lights up rows with gaps between them**, as in the video.
- **Some rows never light up.**
- **Neighboring taxels show exactly the same reading.**

The usual cause is gold fingers or a flat cable that went into an FFC extender at an angle. The extender joins each gold finger to its own wire in the cable. A crooked finger can touch two contacts, which shorts two lines into one, or miss its contact. The [20-pin extender](https://www.adafruit.com/product/5203) is wider than the sensor's 12 gold fingers and the 16-pin cable, so both can go in crooked. Push the gold fingers against one side of the opening as you slide them in; the side keeps them square.

<figure class="sample" id="ffc-insert">
<div class="ffc"><p>The animation needs JavaScript. In short: push the gold fingers in straight, against one side of the connector, so each finger touches exactly one contact.</p></div>
<figcaption>Schematic top view of the 20-pin extender, not to scale. The skew is exaggerated for clarity.</figcaption>
</figure>
<script src="/doc/assets/ffc.js?v=20261127b" defer></script>

To fix it:

1. **Unplug the USB cable** so the board is off, then **open the connector**: gently pry up its two ears and pull the gold fingers out.
2. **Insert the gold fingers against one side** of the opening, straight and all the way in, with the contacts facing up. Then push the ears back in.
3. **Check the flat cable the same way** at the other end of the extender: straight, all the way in, contacts up, and against the same side as the fingers. It is narrower than its connector too.
4. **Test.** Run `flexitac-stream --port <port>` and press one spot at a time. Each press should light up one patch.

The 32-pin gold fingers and cable go into the [40-pin extender](https://www.adafruit.com/product/4523) the same way.

### Some rows or columns never respond {#dead-rows}

Run `flexitac-stream --port <port> --per-row` and press along a column. Then check:

- **Gold fingers fully and squarely seated** in each FFC extender, pushed against one side of the opening (see [above](#short)). With the USB unplugged, re-seat both ends and both cables.
- **Cable orientation.** A cable inserted with its contacts facing the wrong way gives a whole dead side.
- **Velostat coverage.** A dead band along one edge often means the film doesn't reach that edge.
- **Lamination alignment.** If the top and bottom FPCs were offset when you stacked them, edge crossings may not overlap.
- **Expected dead rows:** with `32_16_fast.ino` on a V2 sensor, rows 0–3 are unconnected by design.
- **Swap parts to isolate the fault.** Try a spare sensor on the same board, then the same sensor on another board.

### `raw_max` is stuck at 0 or 255 {#stuck}

A value that stays flat at either end of the range usually points to a **connection problem**, such as a disconnected or [shorted](#short) line. With the USB unplugged, re-seat the connectors and inspect the gold fingers and cables for damage. If that doesn't help, the fault can also be on the board: re-flash the firmware, then try the sensor on another board to rule out the board and its Nano.

### The signal saturates or barely changes {#range}

- **Saturates under light touch:** the sensor may be pre-loaded by its mount, or the baseline was captured under load. Redo the baseline calibration at rest.
- **Barely changes under firm pressure:** check that the Velostat is present and centered, and that the polyimide seal isn't holding the layers apart. Make sure you're reading the right port, and not another device.

## Firmware and reading problems {#firmware}

These come from the reading board's firmware, the USB connection or how the reader is set up. The sensor itself is usually fine.

### No serial port appears {#no-port}

- **Try another USB cable.** Many mini-USB cables only carry power. If the Nano's LED lights up but no port appears, the cable is the most likely cause.
- **Check the USB driver.** Many Nano clones use a CH340 USB-serial chip. Recent Linux and macOS versions include a driver. On older systems, install the CH340 driver from the chip vendor.
- **Look at the kernel log** (Linux) while you plug the board in:
  ```bash
  # expect e.g. "ch341-uart converter now attached to ttyUSB0"
  sudo dmesg -w
  ```
- On Linux, **`brltty` can grab CH340 devices.** It's accessibility software for braille displays. If the port appears and immediately disappears, check `sudo dmesg` for brltty taking the device. Only if it does, and you don't use a braille display, consider removing it (`sudo apt remove brltty`).

### Permission denied {#permission-denied}

Your user can't open the serial device. On Linux, add yourself to `dialout` and log in again:

```bash
sudo usermod -aG dialout "$USER"
```

See [Serial port permissions](/doc/get-started/pyflexitac/#permissions) for macOS and temporary workarounds.

### Flashing fails {#flash-fails}

| Message | Fix |
| --- | --- |
| `arduino-cli not found on PATH` | Install `arduino-cli` and run `arduino-cli core install arduino:avr`. See [Flash from the command line](/doc/get-started/pyflexitac/#flexitac-flash). |
| `no Arduino board detected` | Clones often don't report a board type. Pass `--port` and `--fqbn arduino:avr:nano`. |
| `multiple boards detected` | Unplug the other boards, or pass `--port` and `--fqbn` explicitly. |
| Upload hangs or says `not in sync` | Old-bootloader Nano: use `--fqbn arduino:avr:nano:cpu=atmega328old` (in the IDE: **Processor → ATmega328P (Old Bootloader)**). |
| `Permission denied` | See [Permission denied](#permission-denied). Close the Arduino IDE serial monitor and any other program holding the port. |

### No frames, `fps=0` or `TimeoutError` {#no-frames}

The port opens, but the reader never finds a start marker (`0xAA 0x55`) followed by a full frame.

1. **Re-flash.** A board fresh from the factory, or one running another sketch, isn't sending FlexiTac frames.
2. **Check the baud rate.** Both sides must use 2,000,000 unless you changed it on purpose. At the wrong rate, the bytes arrive garbled and no marker is ever found.
3. **Check the port.** Make sure you're reading the reading board and not another serial device. `flexitac-find-port` tells you which one it is.
4. **Close other programs** that might be reading the same port (serial monitor, a second script).

### The heatmap looks scrambled or shifted {#scrambled}

Frames arrive, but the picture is wrong. This usually means a **row-count mismatch** between the firmware you flashed and the reader:

| What you see | Cause | Fix |
| --- | --- | --- |
| Normal fps, but the top 4 rows never respond and touches near one end of the sensor don't show | Firmware sends 16 rows (`32_16_fast.ino`), reader expects 12 | Read with `--rows 16`, or flash PyFlexiTac's sketch instead |
| Frame rate drops to about half, and the bottom 4 rows echo touches on the top rows | Firmware sends 12 rows, reader expects 16 | Read with the defaults (12 rows) |
| A round touch shows up as a slanted streak (each row shifted a little further sideways) | `--cols` doesn't match the firmware | Use the same `--cols` the firmware was built with (32 for V2) |

See [Match the reader to the firmware](/doc/get-started/pyflexitac/#rows) for which reader settings go with which firmware.

### Noisy or drifting at rest {#noisy}

- **Redo the baseline calibration with nothing touching the sensor.** If the sensor was pressed during the first ~30 frames, the baseline is wrong. Call `sensor.calibrate()` or restart the stream.
- **Mounting changes the baseline.** Bending or pre-loading the sensor onto a curved finger raises its resting values. Run the baseline calibration after mounting, not before.
- **Expect small fluctuations.** `normalized` hides readings below the threshold (default 25 counts above baseline). If you work with `raw`, apply your own threshold or temporal filter. The hardware repo's `fast_32_16.py` uses an exponential filter with α = 0.2.

### Low frame rate {#low-fps}

With PyFlexiTac's default firmware (12 × 32 frames at 2,000,000 baud), expect around 100 fps or more. That's a reference, not a pass/fail threshold: your computer, USB and visualizer change it. Much lower rates usually come from a slow USB hub, a very busy host, or a visualizer that renders every frame. For live use, call `read_latest()` so rendering never falls behind.

## FAQ {#faq}

### How long do FPC and PCB orders take?

Usually 1–2 weeks from order to delivery for the FPCs and PCBs, depending on your location and shipping method. An assembled reading board takes about one week.

### How durable is the sensor?

In the authors' experience, sensors stay consistent and can often be used for about a year without significant degradation. Some teams have collected thousands of demonstrations without breaking one.

### What if a sensor is damaged or malfunctioning?

Order a few spare sensors up front. Replacing a damaged sensor with a new one typically doesn't noticeably affect performance, so sensors are consistent across instances.

### Can I use FlexiTac commercially?

The hardware is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), which doesn't cover commercial use. Software projects in the ecosystem have their own licenses; PyFlexiTac, for example, is MIT-licensed.

## Still stuck? {#help}

Ask on the [FlexiTac Discord](https://discord.gg/6gw887Vxms), or open an issue in the repository that owns the problem. [Report a bug](/doc/contributing/#code) lists which repository owns what, and what a report anyone can act on includes.

Solved a problem that isn't on this page, on Discord or on your own? Add it as a new case, with what you saw, the cause and the fix. You describe it best, so [send the change yourself](/doc/contributing/#docs).
