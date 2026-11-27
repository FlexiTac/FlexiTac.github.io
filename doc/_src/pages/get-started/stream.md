---
title: Stream the sensor
sidebar_label: Stream sensor
description: Flash the reading board from the Arduino IDE, then watch a live heatmap follow your finger. That's a working sensor.
---

The Arduino Nano on the reading board runs a small sketch that scans the sensor and streams frames over USB. Flash it once, then watch a bright spot follow your finger on a live heatmap. That's a working sensor.

## Flash the reading board {#flash}

:::steps
#### Get the sketch
Download PyFlexiTac's [firmware sketch](https://github.com/WT-MM/PyFlexiTac/blob/master/flexitac/firmware/template.ino) (**Download raw file** on that page) and open it in the [Arduino IDE](https://www.arduino.cc/en/software). Let the IDE move it into a folder of the same name. It is already set up for the V2 sensor: 12 rows, 32 columns, 2,000,000 baud.

#### Select the board and port
**Tools → Board → Arduino AVR Boards → Arduino Nano**, then pick the serial port under **Tools → Port**. If the upload fails with `not in sync`, set **Tools → Processor → ATmega328P (Old Bootloader)** and try again.

#### Upload
Click **Upload**. You only need to do this once per board.
:::

## See the first signal {#first-signal}

:::steps
#### Install PyFlexiTac
Its live heatmap shows what the sensor feels. It needs **Python 3.11 or newer**.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install "flexitac[examples]"
```

#### Find the serial port
```bash
flexitac-find-port
```

It asks you to unplug the board and reports the port that disappeared, such as `/dev/ttyUSB0` on Linux or `/dev/tty.usbserial-*` on macOS.

#### Open the live heatmap
```bash
flexitac-heatmap --port /dev/ttyUSB0
```

Don't touch the sensor for the first second, while it measures each taxel's resting level. Then press with a fingertip and drag it slowly across the pad.
:::

**A bright spot that follows your finger across every row and column means your sensor works.** If a row or column never lights up, see [Dead rows or columns](/doc/get-started/troubleshooting/#dead-rows).

:::tip[`Permission denied` on Linux?]
Add yourself to the `dialout` group once, then log out and back in: `sudo usermod -aG dialout "$USER"`. More in [Serial port permissions](/doc/get-started/pyflexitac/#permissions).
:::

## Next {#next}

:::cards
#### PyFlexiTac | /doc/get-started/pyflexitac/ | wave
Read frames in your own Python code, record datasets, run several sensors, check the signal, flash from the command line, and the wire protocol.

#### Collect tactile data | /doc/robot-learning/data-collection/ | robot
Mount the sensor on a gripper and record demonstrations with touch, then train a policy on them.

#### Troubleshooting | /doc/get-started/troubleshooting/ | lifebuoy
No port, no frames, a scrambled picture or dead rows, by symptom.
:::
