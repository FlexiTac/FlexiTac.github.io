---
title: PyFlexiTac
sidebar_label: PyFlexiTac
description: The Python SDK for tactile sensing and data acquisition. Install it, read and record frames, run several sensors, configure custom sensors, and read the wire protocol.
---

[PyFlexiTac](https://github.com/WT-MM/PyFlexiTac) is the `flexitac` Python package (MIT-licensed, maintained by Wesley Maa). [Stream the sensor](/doc/get-started/stream/) already used it for the live heatmap. This page covers the rest. Its README is the source of truth for every option.

<ul class="jump">
<li><a href="#install"><b>Install &amp; stream</b><span>Install, check the signal</span></a></li>
<li><a href="#python"><b>Read frames in Python</b><span>Frames, fields, timing</span></a></li>
<li><a href="#record"><b>Record tactile data</b><span>A short dataset to disk</span></a></li>
<li><a href="#multiple"><b>Use multiple sensors</b><span>One port per board</span></a></li>
<li><a href="#rows"><b>Configure custom sensors</b><span>Rows, columns, firmware</span></a></li>
<li><a href="#wire-protocol"><b>Wire protocol</b><span>Write your own reader</span></a></li>
</ul>

## Install {#install}

PyFlexiTac needs **Python 3.11 or newer**.

:::tabs[pkg]
#### pip
```bash
python3 -m venv .venv && source .venv/bin/activate
# [examples] adds matplotlib for the heatmap
pip install "flexitac[examples]"
```
#### uv
```bash
uv venv && source .venv/bin/activate
uv pip install "flexitac[examples]"
```
#### From source
```bash
git clone https://github.com/WT-MM/PyFlexiTac.git
cd PyFlexiTac
uv sync --extra examples     # or: pip install -e ".[examples]"
```
:::

This installs four commands: `flexitac-find-port`, `flexitac-heatmap`, `flexitac-stream` and `flexitac-flash`.

## Check the signal {#stream}

`flexitac-stream` prints the frame rate and signal statistics. It tells you whether the board, the firmware and the reader agree.

```bash
flexitac-stream --port /dev/ttyUSB0 --frames 3000
```

```text title="Expected output"
frame=    10 fps=  85.3 raw_max=104 norm_max=0.000
frame=    20 fps=  87.1 raw_max=109 norm_max=0.123
```

:::caution[Don't touch the sensor for the first second]
On its first read, PyFlexiTac runs a **baseline calibration**: it collects 30 frames and stores each taxel's median as the baseline. If you press the sensor during it, that pressure becomes part of the "zero."
:::

| Field | Healthy | If not |
| --- | --- | --- |
| `fps` | Steady, around **100** for a 12 × 32 sensor (it depends on your computer) | `0` or `TimeoutError`: the board isn't sending FlexiTac frames at this baud rate. See [No frames](/doc/get-started/troubleshooting/#no-frames). About half the expected rate: the reader expects more rows than the firmware sends. See [Scrambled heatmap](/doc/get-started/troubleshooting/#scrambled). |
| `raw_max` | Between 0 and 255, and **changes when you press** | Stuck at 0 or 255: a wiring or connector problem, not a flashing problem. |
| `norm_max` | Near 0 at rest, rises toward **1.0** on contact | Never rises: check the Velostat and the connectors. |

If some rows seem dead, add `--per-row`. It prints each row's mean baseline once, then each row's `raw_max` every 20 frames. Press along a column and check that every row responds.

## Serial port permissions {#permissions}

:::tabs[os]
#### Linux
Add yourself to the `dialout` group once, then **log out and back in**:

```bash
sudo usermod -aG dialout "$USER"
```

As a quick, temporary workaround (until the next replug), you can loosen permissions on the device instead:

```bash
sudo chmod a+rw /dev/ttyUSB0
```
#### macOS
Serial permissions are usually handled automatically. If you still get `Permission denied`:

```bash
sudo chmod a+rw /dev/tty.usbserial-*
```
:::

## Read frames in Python {#python}

```python title="hello_flexitac.py"
from flexitac import FlexiTacSensor

# rows=12, cols=32 by default; the first read calibrates
with FlexiTacSensor("/dev/ttyUSB0") as sensor:
    for frame in sensor:
        print(frame.seq, frame.raw.max(), frame.normalized.max())
```

Each `frame` is a `FlexiTacFrame`:

| Field | Type | Meaning |
| --- | --- | --- |
| `seq` | `int` | Count of frames this reader has returned. It's kept on the host, so it doesn't reveal frames that were lost or skipped. |
| `timestamp_s` | `float` | **Host** time when PyFlexiTac finished parsing the frame (`time.time()`), not when the board sampled it. USB and buffering add latency and jitter. |
| `raw` | `uint8[rows, cols]` | Values exactly as sent by the firmware |
| `normalized` | `float32[rows, cols]` | Baseline-subtracted, thresholded and scaled to 0–1 |

Useful methods and options:

- `sensor.read()` returns the next complete frame from the receive buffer, in order. Use it when you're **recording**. It never skips a frame it has received, but it can't promise none were lost before: if your loop reads more slowly than the sensor sends, PyFlexiTac keeps only the newest 50,000 unread bytes (about 130 frames at 12 × 32).
- `sensor.read_latest()` discards queued frames and returns the newest one. Use it for **live control or visualization**, so you never lag behind the sensor.
- `sensor.calibrate()` redoes the baseline calibration, for example after mounting the sensor or changing the load at rest.
- `FlexiTacSensor(port, rows=…, cols=…, baud=…, init_frames=30, threshold=25.0, noise_scale=30.0, baseline=None)`. Pass `baseline=` with a saved array, or a scalar such as `20.0`, to skip the startup baseline calibration.

<div id="normalized"></div>

:::caution[`normalized` is scaled per frame]
When contact is detected, `normalized` divides by that frame's own peak, so the strongest taxel is always 1.0. That's ideal for visualization, but it hides how hard the contact is. For learning, record `raw` together with the baseline (`sensor.baseline`) and normalize consistently yourself. Readings aren't force-calibrated: turning them into newtons takes your own force calibration.
:::

### Record a short dataset {#record}

```python title="record.py"
import numpy as np
from flexitac import FlexiTacSensor

with FlexiTacSensor("/dev/ttyUSB0") as sensor:
    sensor.calibrate()          # don't touch the sensor here
    frames, stamps = [], []
    for _ in range(1000):       # about 10 s at ~100 fps
        f = sensor.read()       # the next frame, in order
        frames.append(f.raw)
        stamps.append(f.timestamp_s)

np.savez_compressed("tactile.npz", raw=np.stack(frames),
                    t=np.array(stamps), baseline=sensor.baseline)
```

### More than one sensor {#multiple}

Each reading board is its own USB serial device. For a two-finger gripper, open one `FlexiTacSensor` per port (find each with `flexitac-find-port`) and read them in parallel threads, or call `read_latest()` on each in your control loop.

The streams **aren't synchronized**: each board scans on its own clock, and frames reach the host with their own USB delays. To combine them, pair frames by `timestamp_s` (nearest in time) and allow for jitter.

## Flash from the command line {#flexitac-flash}

`flexitac-flash` puts the same sketch on the board as the Arduino IDE path, without opening the IDE, and can generate it for a custom sensor size.

:::steps
#### Install arduino-cli and the AVR core
`flexitac-flash` compiles and uploads with [`arduino-cli`](https://arduino.github.io/arduino-cli/latest/installation/).

:::tabs[os]
#### macOS
```bash
brew install arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:avr
```
#### Linux
```bash
curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
# the script installs into ./bin — move it onto your PATH, e.g.:
sudo mv bin/arduino-cli /usr/local/bin/
arduino-cli core update-index
arduino-cli core install arduino:avr
```
:::

#### Plug in the board and flash
With exactly one Arduino connected, `flexitac-flash` finds the port and the board type on its own:

```bash
flexitac-flash
```

The defaults are for the standard V2 sensor: `--rows 12 --cols 32 --baud 2000000 --mux-offset 4`, meaning 12 rows wired to multiplexer channels 4–15. For a custom sensor, pass its geometry:

```bash
flexitac-flash --rows 16 --cols 32 --mux-offset 0
```
:::

::::caution[Board not detected?]
Many Arduino Nano clones (CH340 USB chip) don't report a board type, so auto-detection fails with `no Arduino board detected`. Pass the port and board explicitly:

```bash
flexitac-flash --port /dev/ttyUSB0 --fqbn arduino:avr:nano

# older Nanos and many clones use the old bootloader:
flexitac-flash --port /dev/ttyUSB0 \
    --fqbn arduino:avr:nano:cpu=atmega328old
```
::::

## Match the reader to the firmware {#rows}

**The reader must use the same rows and columns as the firmware.** If they don't match, the reader splits the byte stream in the wrong places and the heatmap comes out cut off or scrambled ([what each mismatch looks like](/doc/get-started/troubleshooting/#scrambled)).

| Firmware | Frame | Read with |
| --- | --- | --- |
| PyFlexiTac's sketch, from the Arduino IDE or `flexitac-flash` (the default) | 12 × 32 | The defaults |
| A custom size: `flexitac-flash --rows R --cols C --mux-offset M` | R × C | `--rows R --cols C` |
| `32_16_fast.ino` from the [hardware repo](https://github.com/FlexiTac/FlexiTac) | 16 × 32; rows 0–3 stay near zero on a V2 sensor | `--rows 16 --cols 32` |

To build a custom size from the Arduino IDE instead, change `ROW_COUNT`, `COLUMN_COUNT` and `MUX_CHANNEL_OFFSET` at the top of the sketch before uploading. Custom sensors must fit the 32 × 16 board (up to 16 rows and 32 columns); the 32 × 32 board's firmware isn't covered by these docs yet. The hardware repo also includes `fast_32_16.py`, a standalone OpenCV viewer for `32_16_fast.ino`.

## Wire protocol {#wire-protocol}

If you're writing your own reader, for a robot middleware, a microcontroller or another language, here is the whole protocol. For every frame, the firmware sends a two-byte start marker, then selects each **row** through a 16-channel analog multiplexer, steps through each **column** with shift registers, and reads each crossing with the Nano's 10-bit ADC, scaled to one byte.

| Field | Value |
| --- | --- |
| Transport | USB serial, **2,000,000 baud**, 8N1 |
| Start marker | 2 bytes: `0xAA 0x55` |
| Payload | `rows × cols` bytes, unsigned 8-bit, row-major (row 0 first, columns 0…cols−1) |
| Value | ADC reading ÷ 4 (10-bit → 8-bit). Higher values mean more pressure. |
| Frame rate | Continuous, with no text formatting; around 100 fps for 12 × 32, depending on the host |
| Integrity | No checksum, no sequence number, no length field |

So a reader can't detect a dropped or corrupted frame. If bytes are lost, it can lock onto a `0xAA 0x55` pair inside the payload and return a misaligned frame before it finds a real marker again. Number frames and timestamp them yourself on the host.

A minimal reader with `pyserial` and NumPy:

```python title="read_raw.py"
import numpy as np
import serial

ROWS, COLS = 12, 32                 # must match the firmware you flashed
MARKER, N = b"\xaa\x55", ROWS * COLS

with serial.Serial("/dev/ttyUSB0", 2_000_000, timeout=0.05) as ser:
    buf = bytearray()
    while True:
        buf += ser.read(4096)
        i = buf.find(MARKER)
        if i < 0:
            del buf[:-1]            # keep a possible half marker
            continue
        if len(buf) < i + 2 + N:
            continue                # wait for the rest of the frame
        start = i + 2
        frame = np.frombuffer(buf[start : start + N], dtype=np.uint8)
        frame = frame.reshape(ROWS, COLS)
        del buf[: start + N]
        print(frame.max())
```

:::note
Readings are raw. Each taxel has its own resting level, so subtract a **baseline**, such as the per-taxel median of the first ~30 frames taken while nothing touches the sensor, before you threshold or normalize. `FlexiTacSensor` does this for you.
:::
