---
title: FlexiTac Documentation
sidebar_label: Introduction
description: Build, read and deploy low-cost, flexible tactile sensors for robots — from your first sensor to robot learning.
---

FlexiTac is an open-source, full-stack platform for tactile robotics that brings together **hardware design**, **system integration** and **robot learning**. You can design sensors for any gripper or fingertip, connect them to your robot through open reading boards and software, and use the tactile data to train robot policies, on real robots or in simulation. At its core is the FlexiTac sensor: a thin, flexible pad that measures the pressure distribution across its surface, costs a few dollars in materials and takes about three minutes to assemble.

These docs take you from zero to a **working sensor streaming live data**, then point you to the right place for whatever you build next: a custom sensor shape, a robot gripper, a learning policy or a simulation.

<figure class="figure viewer3d" data-viewer3d data-src="/doc/assets/3d/flexitac-umi.glb" data-env="/doc/assets/3d/studio.hdr" data-shadow="0" data-orbit="334deg 70deg 0.40m" data-target="-0.008m 0.048m 0.013m" data-fov="13.6deg">
<div class="v3d-stage">
<img class="v3d-poster" src="/doc/assets/img/flexitac-umi-sandwich.webp" alt="Render of a FlexiTac sensor on the orange UMI soft fin-ray finger. The outer FPC and the black Velostat film peel back from the inner FPC; both FPC tails run out flat to the side, and the clear laminating sheets peel away with the stack." width="1600" height="900">
<button class="v3d-start" type="button" data-v3d-start><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>Rotate in 3D</button>
</div>
<div class="v3d-bar" hidden>
<label class="v3d-peel"><span>Assembled</span><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Peel the layers apart" data-v3d-peel><span>Peeled</span></label>
<button class="v3d-reset" type="button" data-v3d-reset>Reset view</button>
</div>
<figcaption>FlexiTac on the UMI soft finger, peeled apart: laminating sheet, outer FPC, Velostat, inner FPC and the bottom laminating sheet (FPCs 0.2 mm, Velostat 0.1 mm), each FPC one sheet with its tail. Rendered from the real Gerber and finger CAD. Drag to rotate in 3D, and use the slider to close the sandwich.</figcaption>
</figure>

## Pick your path

### I don't have a sensor yet {#path-build}

Build one and bring it to life. Your sensor is finished when its first signal lights up a live heatmap.

:::cards[path]
#### Build the hardware | /doc/get-started/ |
Order the FPCs and the reading board (1–2 weeks to make and ship), then fabricate the sensor in a few minutes.

#### Stream the sensor | /doc/get-started/stream/ |
Flash the reading board from the Arduino IDE and watch a live heatmap follow your finger. That's a working sensor.
:::

Assembled the sensor already, but it isn't streaming yet? Start at step 2.

### I already have a sensor {#path-robot}

Put touch to work on a real robot. First [mount the sensor on your gripper](/doc/robot-learning/#mount), then choose how to collect demonstrations and train a policy:

:::cards
#### Teleoperate a low-cost arm | /doc/robot-learning/#leflexitac | robot
**LeFlexiTac**: record tactile demonstrations on an SO-100/101 arm in LeRobot, then train ACT, Diffusion Policy, Pi0.5 or SmolVLA. The best place to start.

#### Collect anywhere by hand | /doc/robot-learning/#touch-in-the-wild | wave
**Touch in the Wild**: a handheld visuo-tactile gripper, a dataset of 2,700+ demonstrations and a pretrained encoder, with policies run on an xArm.
:::

### Simulation {#path-sim}

Work with touch without hardware: simulated FlexiTac pads on a robot in NVIDIA Isaac Sim.

:::cards
#### Tactile simulation in Isaac Sim | /doc/simulation/#isaac-sim | sim
The current release. Build it, replay tactile trajectories and record bimanual demonstrations from your browser.

#### VT-Refine | /doc/simulation/#vt-refine | layers
The research behind it: fine-tune visuo-tactile policies with reinforcement learning in simulation (CoRL 2025). The released code covers pre-training and simulation.
:::

### Also useful {#path-more}

:::cards
#### Design a custom shape | /flexitac-gen/ | cube
Generate sensor FPCs for your own gripper or fingertip with **FlexiTac-Gen**, in the browser.

#### Learn the principles | /learn/ | book
**Learn FlexiTac** is an interactive course on how resistive tactile arrays sense, scan and read touch.

#### Something isn't working | /doc/get-started/troubleshooting/ | lifebuoy
Common problems by symptom: no serial port, dead rows, noisy or saturated signals.
:::

## How a FlexiTac sensor works

A FlexiTac sensor is a **piezoresistive tactile array**. Two flexible printed circuits (FPCs) carry parallel electrodes: one carries rows, the other carries columns. Between them sits a sheet of pressure-sensitive conductive film (Velostat or Linqstat). Wherever a row crosses a column there is a *taxel* (tactile pixel); pressing it lowers the film's resistance at that crossing.

A small **reading board** scans the array one row and one column at a time with a multiplexer and shift registers, digitizes each crossing with an Arduino Nano, and streams complete frames to the host over USB serial.

<ol class="pipeline">
<li><b>Sensor pad</b>Two FPCs + Velostat, sealed with polyimide</li>
<li><b>FFC cable</b>16- and 32-pin flat flexible cables</li>
<li><b>Reading board</b>Mux + shift registers + Arduino Nano</li>
<li><b>USB serial</b>2,000,000 baud, framed 8-bit values</li>
<li><b>PyFlexiTac</b>Frames as NumPy arrays, CLI heatmap</li>
<li><b>Your robot</b>Teleoperation, data collection, policies</li>
</ol>

The standard sensor, **FlexiTac-V2**, has 32 × 12 taxels on a 2 mm grid. Its two FPCs cost about $2.5 per pair when ordered in quantity.

## What's in the ecosystem

| Project | What it is for |
| --- | --- |
| [FlexiTac homepage](/) | The project: overview, papers, videos and community builds |
| [FlexiTac-Gen](/flexitac-gen/) | Generate custom sensor FPCs for your own gripper, in the browser |
| [LeFlexiTac](https://tna001-ai.github.io/LeFlexiTac/docs.html) | Tactile sensing for LeRobot: data collection and policy training |
| [Awesome FlexiTac](https://binghao-huang.github.io/Awesome-FlexiTac/) | Papers and projects built with flexible tactile arrays |
| [Interactive course](/learn/) | Learn FlexiTac: how resistive tactile arrays sense, scan and read touch |

Everything else these docs use, from the hardware repo, Fabrication Guide and PyFlexiTac to design files, papers, datasets and the simulation, is on [All resources](/doc/resources/).

## About these docs

:::note[Help improve these docs]
Every page has an **Edit page** link at the bottom. The pages are plain Markdown in [`doc/_src/pages`](https://github.com/FlexiTac/FlexiTac.github.io/tree/main/doc/_src/pages), so fixing a typo or adding a missing step is a small pull request. If a step didn't work for you, use **Report a problem**; that helps just as much.
:::

- **Questions and help:** join the [FlexiTac Discord](https://discord.gg/6gw887Vxms).
- **Bugs in code or firmware:** open an issue in the repository that owns the code (see the table above).
- **Licensing:** the FlexiTac hardware is © 2026 Columbia University, licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). PyFlexiTac is MIT-licensed. Other projects carry their own licenses.
