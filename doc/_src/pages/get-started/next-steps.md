---
title: Next steps
description: Learn on a real robot or in simulation, customize the sensor, and share and cite what you build.
---

You have a sensor streaming data. What comes next depends on your goal. Each section below points to the page or project that owns that part of the ecosystem.

## Learn with touch {#learn}

:::cards
#### Collect tactile data | /doc/robot-learning/data-collection/ | robot
Mount the sensor and record visuo-tactile demonstrations, with LeFlexiTac on a low-cost arm or Touch in the Wild with a handheld gripper.

#### Tactile simulation | /doc/simulation/ | sim
Build the FlexiTac simulation in Isaac Sim, replay tactile trajectories and record demonstrations in the browser. Plus VT-Refine.
:::

## Customize the sensor {#customize}

:::cards
#### FlexiTac-Gen | /flexitac-gen/ | cube
Generate the two FPCs of a FlexiTac sensor for your own gripper, fingertip or hand, in the browser. Pick a preset or fit to a surface of your STL part, choose the resolution, and download manufacturing files. The [source and docs](https://github.com/FlexiTac/FlexiTac/tree/main/flexitac-gen) are in the hardware repo.

#### Learn FlexiTac | /learn/ | book
An interactive course on how a resistive tactile array senses, how it's scanned, and what the numbers mean. Useful before you change the hardware.
:::

## Share what you build {#share}

FlexiTac grows through the people who build with it. Whatever you made, a mount, a fix or a whole robot, it helps the next person.

- **Fix or extend these docs.** Every page has an **Edit page** link. Tested a new sensor/board combination, or found a step that tripped you up? Send a pull request.
- **Add your paper or project** to [Awesome FlexiTac](https://binghao-huang.github.io/Awesome-FlexiTac/) by [opening an issue or PR](https://github.com/binghao-huang/Awesome-FlexiTac/issues) (see its [contributing guide](https://github.com/binghao-huang/Awesome-FlexiTac/blob/main/CONTRIBUTING.md)).
- **Show your build** on the [Discord](https://discord.gg/6gw887Vxms): photos, CAD for your mount, firmware settings and what didn't work are all welcome.
- **Report bugs** in the repository that owns the code (see [Still stuck?](/doc/get-started/troubleshooting/#help)).
- **Star** [FlexiTac on GitHub](https://github.com/FlexiTac/FlexiTac) so others can find it.

## Cite FlexiTac {#cite}

If FlexiTac helps your research, please cite:

```bibtex title="flexitac.bib"
@article{huang2026flexitac,
  title   = {FlexiTac: A Low-Cost, Open-Source, Scalable Tactile Sensing Solution for Robotic Systems},
  author  = {Huang, Binghao and Li, Yunzhu},
  journal = {arXiv preprint arXiv:2604.28156},
  year    = {2026}
}
```

If you use PyFlexiTac or LeFlexiTac, please also cite those projects. Their citations are in their READMEs.
