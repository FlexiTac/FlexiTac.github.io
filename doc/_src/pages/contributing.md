---
title: Contributing
description: Share your robot, list your paper, improve these docs or the code, and report bugs. Where each contribution goes and what it needs.
---

FlexiTac grows through the people who build with it. Whatever you made, a mount, a fix or a whole robot, it helps the next person. Each kind of contribution goes to the project that owns it:

| You want to | Go to |
| --- | --- |
| Ask a question or show work in progress | [Discord](https://discord.gg/6gw887Vxms) |
| Show a robot you built with FlexiTac | [Share your robot](#robot) |
| List your paper or project | [Add your paper](#papers) |
| Fix a page or add what you tested | [Improve these docs](#docs) |
| Report a bug or improve the code | [Report a bug](#code) |

## Share your robot {#robot}

Built FlexiTac into your own gripper, hand or robot? Send it in with the [Share your robot](https://github.com/FlexiTac/FlexiTac.github.io/issues/new?template=share-your-robot.yml) form.

:::steps
#### Submit
The form asks for a name, two to four sentences on what you built, which sensor (the standard V2, one from FlexiTac-Gen or your own design), how far along it is, a photo or short video, and how to credit you. A landscape photo works best: it becomes your tile. Links to your project page, paper, code or CAD are optional.

#### We review
A maintainer checks every submission and may ask a question or two in the issue thread. Nothing appears on the site before it's approved.

#### Featured
Approved robots appear in the Community row under [A growing tactile ecosystem](/doc/#ecosystem) on the docs home, with credit to you and a link to your project.
:::

The submission is a public GitHub issue. To share unpublished work privately first, ask on [Discord](https://discord.gg/6gw887Vxms).

## Add your paper or project {#papers}

[Awesome FlexiTac](https://binghao-huang.github.io/Awesome-FlexiTac/) lists the papers and projects built with flexible tactile arrays. Add yours by [opening an issue or pull request](https://github.com/binghao-huang/Awesome-FlexiTac/issues), as its [contributing guide](https://github.com/binghao-huang/Awesome-FlexiTac/blob/main/CONTRIBUTING.md) describes.

## Improve these docs {#docs}

Tested a new sensor/board combination, found a step that tripped you up, or solved a problem on Discord that [Troubleshooting](/doc/get-started/troubleshooting/) doesn't cover? Every page has an **Edit page** link at the bottom. It opens the page's Markdown on GitHub, where you can propose your change as a pull request.

For bigger changes, such as a new page or images, work in a clone of [FlexiTac/FlexiTac.github.io](https://github.com/FlexiTac/FlexiTac.github.io):

:::steps
#### Edit the Markdown
The pages are in `doc/_src/pages/`. A new page also needs its slug in `NAV` at the top of `doc/_src/build.py`, which sets the sidebar order.

#### Rebuild and check
```bash
# Python 3.9+, standard library only
python3 doc/_src/build.py
# Fails on stale HTML or a broken link, anchor or image
python3 doc/_src/build.py --check
```

#### Preview
From the repository root, run `python3 -m http.server 8000` and open `http://localhost:8000/doc/`.

#### Open a pull request
Commit both the Markdown and the generated HTML.
:::

The [docs source README](https://github.com/FlexiTac/FlexiTac.github.io/blob/main/doc/_src/README.md) lists the Markdown you can use, and how to store images and videos. Three rules matter most:

- **One source of truth.** These docs cover the getting-started path and link out. Detailed procedures stay in the repository that owns them: summarize them here and link the original.
- **Only verified facts.** Version numbers, pin counts, frame sizes and prices come from a linked source or from something you tested. Say how you tested it.
- **Credit and licenses.** Keep the authors' credit and each project's license. Images need permission from whoever owns them.

## Report a bug or improve the code {#code}

Not sure where a problem comes from? Ask on [Discord](https://discord.gg/6gw887Vxms) first. Otherwise open an issue, or send a pull request, in the repository that owns the code:

| Problem with | Repository |
| --- | --- |
| Sensor design, reading board, `32_16_fast.ino`, FlexiTac-Gen | [FlexiTac/FlexiTac](https://github.com/FlexiTac/FlexiTac/issues) |
| `flexitac-*` commands, the Python API, `flexitac-flash` firmware | [WT-MM/PyFlexiTac](https://github.com/WT-MM/PyFlexiTac/issues) |
| LeFlexiTac: teleoperation and training on the SO-100/101 | [TNA001-AI/lerobot_tactile](https://github.com/TNA001-AI/lerobot_tactile/issues) |
| Touch in the Wild | [XinyueZhuXY/touch_in_the_wild](https://github.com/XinyueZhuXY/touch_in_the_wild/issues) |
| The Isaac Sim tactile simulation | [binghao-huang/FlexiTac-IsaacSim-Simulation](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation/issues) |
| These docs | [FlexiTac/FlexiTac.github.io](https://github.com/FlexiTac/FlexiTac.github.io/issues) |

A report anyone can act on includes: sensor version or geometry, reading board (32 × 16 or 32 × 32), which firmware you flashed and its settings, OS and Python version, the exact command you ran, the full output, and a photo of the connections.

## Stay in touch {#community}

- **[Discord](https://discord.gg/6gw887Vxms):** questions, help, and builds in progress.
- **WeChat:** the group's [QR code](/static/images/qr.jpg).
- **Star** [FlexiTac on GitHub](https://github.com/FlexiTac/FlexiTac) so others can find it.
