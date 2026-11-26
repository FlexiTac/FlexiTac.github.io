---
title: All resources
description: Every repository, guide, design file, paper, dataset and tool these docs build on, in one place.
---

Everything FlexiTac and these docs draw on, grouped by what you'd use it for. Each project's own page stays the source of truth for its details.

## FlexiTac {#flexitac}

| Resource | What it is |
| --- | --- |
| [FlexiTac homepage](/) | The project page: overview, papers, videos and builds from the community |
| [FlexiTac paper](https://arxiv.org/abs/2604.28156) | *FlexiTac: A Low-Cost, Open-Source, Scalable Tactile Sensing Solution for Robotic Systems* (arXiv 2604.28156) |
| [Hardware & firmware repo](https://github.com/FlexiTac/FlexiTac) | Sensor and reading-board design files, Arduino firmware, reference Python reader |
| [Hardware Fabrication Guide](https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/edit?usp=sharing) | The canonical BOM, PCB files, and fabrication and ordering steps |
| [Fabrication video](https://www.youtube.com/watch?v=HYmMbsrwWFA) | The whole sensor build, step by step |
| [PyFlexiTac](https://github.com/WT-MM/PyFlexiTac) | The `flexitac` Python package: flashing, streaming, heatmap and Python API ([how to use it](/doc/get-started/pyflexitac/)) |
| [Firmware sketch](https://github.com/WT-MM/PyFlexiTac/blob/master/flexitac/firmware/template.ino) | The reading-board firmware the docs flash, set up for the V2 sensor |
| [FlexiTac-Gen](/flexitac-gen/) | Browser app that generates custom sensor FPCs for your gripper ([source](https://github.com/FlexiTac/FlexiTac/tree/main/flexitac-gen)) |
| [Learn FlexiTac](/learn/) | Interactive course on how resistive tactile arrays sense, scan and read touch |

## Design files {#design-files}

The V2 files, as linked from the Fabrication Guide. [Order parts](/doc/get-started/order-parts/) explains which to order and how.

| File | Contents |
| --- | --- |
| [Top FPC](/flexitac-gen/static/vendor/flexitac-v2/Gerber_Top_FPC_2026-03-02.zip) | Gerber, EasyEDA Pro export of 2026-03-02 |
| [Bottom FPC](/flexitac-gen/static/vendor/flexitac-v2/Gerber_Bottom_FPC_2026-03-02.zip) | Gerber, EasyEDA Pro export of 2026-03-02 |
| [Reading board 32 × 16](/flexitac-gen/static/vendor/flexitac-reader/FlexiTac_reading_board_32x16.zip) | Gerber, BOM and pick-and-place ([schematic](https://drive.google.com/file/d/1KEzet6f4s1i1d-GOSpwD5-4Peu2S67hL/view?usp=drive_link)) |
| [Reading board 32 × 32](/flexitac-gen/static/vendor/flexitac-reader/FlexiTac_reading_board_32x32.zip) | Gerber, BOM and pick-and-place ([schematic](https://drive.google.com/file/d/1bmmO034ZeR81Ba8OML_0MlkXvKADsflr/view?usp=drive_link)) |

The parts to buy (Velostat, laminating sheets, polyimide tape, cables, Arduino Nano), with links, are in the [bill of materials](/doc/get-started/order-parts/#bom).

## Robot learning {#robot-learning}

| Project | Links |
| --- | --- |
| **LeFlexiTac**: touch for LeRobot | [Project](https://tna001-ai.github.io/LeFlexiTac/) · [Docs](https://tna001-ai.github.io/LeFlexiTac/docs.html) · [Code](https://github.com/TNA001-AI/lerobot_tactile) |
| **Touch in the Wild** (NeurIPS 2025): handheld visuo-tactile data collection | [Project](https://binghao-huang.github.io/touch_in_the_wild/) · [Paper](https://arxiv.org/abs/2507.15062) · [Code](https://github.com/XinyueZhuXY/touch_in_the_wild) · [Data collection](https://github.com/XinyueZhuXY/touch_in_the_wild-data-collection) · [Gripper guide](https://docs.google.com/document/d/1Gxd2PzVo-sH_XbvnVw_r3eI5i3I3t0rr7JdhpN1PJMA/edit?tab=t.0#heading=h.dcjpnwh7wh40) · [Dataset](https://huggingface.co/datasets/binghaohuang-robot/touch_in_the_wild-dataset) · [Pretrained encoder](https://huggingface.co/xinyue-zhu/pretrained_mae) · [Video](https://www.youtube.com/watch?v=gMoedqqJ0Rg) |
| **3D-ViTac** (CoRL 2024): the visuo-tactile point cloud | [Project](https://binghao-huang.github.io/3D-ViTac/) · [Paper](https://arxiv.org/abs/2410.24091) · [Training code](https://github.com/binghao-huang/3d-vitac-training-code) · [Video](https://www.youtube.com/watch?v=ZN3mHMNZC7Q) |

How to use them: [Learn on a real robot](/doc/robot-learning/).

## Simulation {#simulation}

| Project | Links |
| --- | --- |
| **Tactile simulation in Isaac Sim** (current release) | [Code](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation) |
| **VT-Refine** (CoRL 2025): visuo-tactile fine-tuning in simulation | [Project](https://binghao-huang.github.io/vt_refine/) · [Paper](https://arxiv.org/abs/2510.14930) · [Code](https://github.com/NVlabs/vt-refine) · [Video](https://www.youtube.com/watch?v=AEt30ttJ9A8) |

How to use them: [Tactile simulation](/doc/simulation/).

## Community {#community}

| Resource | What it is |
| --- | --- |
| [Awesome FlexiTac](https://binghao-huang.github.io/Awesome-FlexiTac/) | Papers and projects built with flexible tactile arrays ([add yours](https://github.com/binghao-huang/Awesome-FlexiTac/blob/main/CONTRIBUTING.md)) |
| [Discord](https://discord.gg/6gw887Vxms) | Questions, help and builds |
| [WeChat](/static/images/qr.jpg) | The WeChat group's QR code |

## Third-party tools and references {#third-party}

| Tool | Used for |
| --- | --- |
| [Arduino IDE](https://www.arduino.cc/en/software) | Flashing the reading board ([Stream the sensor](/doc/get-started/stream/#flash)) |
| [arduino-cli](https://arduino.github.io/arduino-cli/latest/installation/) | Flashing from the command line ([`flexitac-flash`](/doc/get-started/pyflexitac/#flexitac-flash)) |
| [LeRobot](https://github.com/huggingface/lerobot) · [SO-101 walkthrough](https://huggingface.co/docs/lerobot/il_robots) | The robot-learning stack LeFlexiTac builds on |
| [SO-ARM100](https://github.com/TheRobotStudio/SO-ARM100) | Build guide for the SO-100/101 arms |
| [UMI](https://github.com/real-stanford/universal_manipulation_interface) | The handheld gripper and data pipeline Touch in the Wild builds on |
| [Isaac Sim 5.1.0](https://docs.isaacsim.omniverse.nvidia.com/5.1.0/installation/requirements.html) · [Isaac Lab](https://isaac-sim.github.io/IsaacLab/main/source/setup/installation/pip_installation.html) | The simulator and robot-learning framework the simulation runs on |
| [NVIDIA Warp](https://github.com/NVIDIA/warp) | The simulated pad's contact computation |

## On these pages {#credits}

- The 3D sensor on the [Introduction](/doc/) is rendered from the V2 Gerbers on the UMI soft finger from [HandUMI](https://github.com/murobotics-ai/handumi-hw) (Apache-2.0), and shown with [model-viewer](https://modelviewer.dev/) (Apache-2.0).
- The FPC drawings, the exploded view and the colours of the boards follow [Learn FlexiTac](/learn/).
- The FlexiTac hardware is © 2026 Columbia University, licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). PyFlexiTac is MIT-licensed. Other projects carry their own licenses.
