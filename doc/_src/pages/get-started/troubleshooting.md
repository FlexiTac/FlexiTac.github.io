---
title: Troubleshooting & FAQ
sidebar_label: Troubleshooting
description: Find your symptom, then work through the checks from most to least likely.
---

Start with `flexitac-stream --port <port>`. Its output (fps, `raw_max`, `norm_max`) tells you which layer is failing: USB and serial, firmware, or the sensor itself.

## No serial port appears {#no-port}

- **Try another USB cable.** Many mini-USB cables only carry power. If the Nano's LED lights up but no port appears, the cable is the most likely cause.
- **Check the USB driver.** Many Nano clones use a CH340 USB-serial chip. Recent Linux and macOS versions include a driver. On older systems, install the CH340 driver from the chip vendor.
- **Look at the kernel log** (Linux) while you plug the board in:
  ```bash
  # expect e.g. "ch341-uart converter now attached to ttyUSB0"
  sudo dmesg -w
  ```
- On Linux, **`brltty` can grab CH340 devices.** If the port appears and immediately disappears, removing that package (`sudo apt remove brltty`) is a common fix.

## Permission denied {#permission-denied}

Your user can't open the serial device. On Linux, add yourself to `dialout` and log in again:

```bash
sudo usermod -aG dialout "$USER"
```

See [Serial port permissions](/doc/get-started/pyflexitac/#permissions) for macOS and temporary workarounds.

## Flashing fails {#flash-fails}

| Message | Fix |
| --- | --- |
| `arduino-cli not found on PATH` | Install `arduino-cli` and run `arduino-cli core install arduino:avr`. See [Flash from the command line](/doc/get-started/pyflexitac/#flexitac-flash). |
| `no Arduino board detected` | Clones often don't report a board type. Pass `--port` and `--fqbn arduino:avr:nano`. |
| `multiple boards detected` | Unplug the other boards, or pass `--port` and `--fqbn` explicitly. |
| Upload hangs or says `not in sync` | Old-bootloader Nano: use `--fqbn arduino:avr:nano:cpu=atmega328old` (in the IDE: **Processor → ATmega328P (Old Bootloader)**). |
| `Permission denied` | See [Permission denied](#permission-denied). Close the Arduino IDE serial monitor and any other program holding the port. |

## No frames, `fps=0` or `TimeoutError` {#no-frames}

The port opens, but the reader never finds a start marker (`0xAA 0x55`) followed by a full frame.

1. **Re-flash.** A board fresh from the factory, or one running another sketch, isn't sending FlexiTac frames.
2. **Check the baud rate.** Both sides must use 2,000,000 unless you changed it on purpose. At the wrong rate, the bytes arrive garbled and no marker is ever found.
3. **Check the port.** Make sure you're reading the reading board and not another serial device. `flexitac-find-port` tells you which one it is.
4. **Close other programs** that might be reading the same port (serial monitor, a second script).

## The heatmap looks scrambled or shifted {#scrambled}

Frames arrive, but the picture is wrong. This usually means a **row-count mismatch** between the firmware you flashed and the reader:

| What you see | Cause | Fix |
| --- | --- | --- |
| Normal fps, but the top 4 rows never respond and touches near one end of the sensor don't show | Firmware sends 16 rows (`32_16_fast.ino`), reader expects 12 | Read with `--rows 16`, or flash PyFlexiTac's sketch instead |
| Frame rate drops to about half, and the bottom 4 rows echo touches on the top rows | Firmware sends 12 rows, reader expects 16 | Read with the defaults (12 rows) |
| A round touch shows up as a slanted streak (each row shifted a little further sideways) | `--cols` doesn't match the firmware | Use the same `--cols` the firmware was built with (32 for V2) |

See [Match the reader to the firmware](/doc/get-started/pyflexitac/#rows) for which reader settings go with which firmware.

## Some rows or columns never respond {#dead-rows}

Run `flexitac-stream --port <port> --per-row` and press along a column. Then check:

- **Gold fingers fully and squarely seated** in each FFC connector. Re-seat both ends and both cables.
- **Cable orientation.** A cable inserted with its contacts facing the wrong way gives a whole dead side.
- **Velostat coverage.** A dead band along one edge often means the film doesn't reach that edge.
- **Lamination alignment.** If the top and bottom FPCs were offset when you stacked them, edge crossings may not overlap.
- **Expected dead rows:** with `32_16_fast.ino` on a V2 sensor, rows 0–3 are unconnected by design.
- **Swap parts to isolate the fault.** Try a spare sensor on the same board, then the same sensor on another board.

## `raw_max` is stuck at 0 or 255 {#stuck}

A value that stays flat at either end of the range points to a **wiring problem**, such as a disconnected or shorted line, not a flashing problem. Re-seat the connectors and inspect the gold fingers and cables for damage.

## Noisy or drifting at rest {#noisy}

- **Re-calibrate with nothing touching the sensor.** If the sensor was pressed during the first ~30 frames, the baseline is wrong. Call `sensor.calibrate()` or restart the stream.
- **Mounting changes the baseline.** Bending or pre-loading the sensor onto a curved finger raises its resting values. Calibrate after mounting, not before.
- **Expect small fluctuations.** `normalized` hides readings below the threshold (default 25 counts above baseline). If you work with `raw`, apply your own threshold or temporal filter. The hardware repo's `fast_32_16.py` uses an exponential filter with α = 0.2.

## The signal saturates or barely changes {#range}

- **Saturates under light touch:** the sensor may be pre-loaded by its mount, or the baseline was captured under load. Re-calibrate at rest.
- **Barely changes under firm pressure:** check that the Velostat is present and centered, and that the polyimide seal isn't holding the layers apart. Make sure you're reading the right port, and not another device.

## Low frame rate {#low-fps}

About 100+ fps is expected for 12 × 32 at 2 Mbaud. Lower rates usually come from a slow USB hub, a very busy host, or a visualizer that renders every frame. For live use, call `read_latest()` so rendering never falls behind.

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

Ask on the [FlexiTac Discord](https://discord.gg/6gw887Vxms), or open an issue in the repository that owns the problem:

| Problem with | Open an issue in |
| --- | --- |
| Sensor design, reading board, `32_16_fast.ino` | [FlexiTac/FlexiTac](https://github.com/FlexiTac/FlexiTac/issues) |
| `flexitac-*` commands, the Python API, `flexitac-flash` firmware | [WT-MM/PyFlexiTac](https://github.com/WT-MM/PyFlexiTac/issues) |
| These docs | [FlexiTac/FlexiTac.github.io](https://github.com/FlexiTac/FlexiTac.github.io/issues) |

A report anyone can act on includes: sensor version or geometry, reading board (32 × 16 or 32 × 32), which firmware you flashed and its settings, OS and Python version, the exact command you ran, the full output, and a photo of the connections.
