---
title: Stream the sensor
sidebar_label: Stream sensor
description: Flash the reading board from the Arduino IDE, then watch a live heatmap follow your finger. That's a working sensor. Then learn with it, simulate it, customize it, and share and cite what you build.
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

Don't touch the sensor for the first second: PyFlexiTac runs a **baseline calibration**, measuring each taxel's resting level. Then press with a fingertip and drag it slowly across the pad.
:::

<figure class="sample">
<video src="/doc/assets/video/first-light.mp4" poster="/doc/assets/img/first-light.webp" width="960" height="540" muted loop playsinline preload="none" data-inview aria-label="A fingertip presses and slides on a FlexiTac sensor; on the screen behind it, a bright patch in the live heatmap follows the finger while the rest of the map stays dark"></video>
<figcaption><span class="sample-tag">Working sensor</span>The live heatmap follows the press, in real time.</figcaption>
</figure>

What a working sensor shows:

- **No contact:** the whole map is dark and steady.
- **Light touch:** a small patch lights up under your fingertip.
- **Sliding:** the patch moves with your finger.
- **Release:** the map goes dark again.

**A bright spot that follows your finger across every row and column means your sensor works.** If a row or column never lights up, see [Dead rows or columns](/doc/get-started/troubleshooting/#dead-rows).

:::note[A working sensor isn't a force sensor yet]
The check above is **signal validation**: every taxel responds. The step before it is **baseline calibration**: PyFlexiTac removes each taxel's resting offset. Neither is **force calibration**, which maps readings to newtons. FlexiTac doesn't provide that, so treat readings as relative.
:::

:::tip[`Permission denied` on Linux?]
Add yourself to the `dialout` group once, then log out and back in: `sudo usermod -aG dialout "$USER"`. More in [Serial port permissions](/doc/get-started/pyflexitac/#permissions).
:::

## Your FlexiTac is ready {#next-steps}

Your sensor is now streaming tactile data. Choose what you want to do next.

:::cards
#### Develop with Python | /doc/get-started/pyflexitac/ | code
Read and record tactile frames.

#### Collect robot data | /doc/robot-learning/data-collection/ | robot
Mount it and record demonstrations.

#### Customize your sensor | /doc/get-started/customize/ | cube
Design one for another gripper.

#### Explore simulation | /doc/simulation/ | sim
Generate virtual tactile data.
:::

Something isn't working? [Troubleshooting →](/doc/get-started/troubleshooting/)

:::tip[Share your build]
Got it working? Share a short video of your sensor with us on [Discord](https://discord.gg/6gw887Vxms). Once it's on a robot, [send it in](/doc/contributing/#robot) to be featured on these docs.
:::
