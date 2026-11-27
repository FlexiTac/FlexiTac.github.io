# FlexiTac Docs — source

This folder is the source of <https://flexitac.github.io/doc/>. Pages are Markdown in
[`pages/`](pages/). `build.py` renders them into the static HTML under `doc/`, which
GitHub Pages serves as-is. GitHub Pages doesn't publish folders whose names start with `_`,
so this folder is only visible on GitHub.

## Edit a page

1. Edit the Markdown file in `pages/` (or click **Edit page** at the bottom of any docs page).
2. Rebuild and commit **both** the Markdown and the generated HTML:

   ```bash
   python3 doc/_src/build.py          # Python 3.9+, standard library only
   ```

3. Preview locally from the repository root, then open <http://localhost:8000/doc/>:

   ```bash
   python3 -m http.server 8000
   ```

`python3 doc/_src/build.py --check` exits non-zero if the generated HTML is stale or an
internal link, anchor or image is broken. Run it before opening a pull request.

## Add a page

1. Create `pages/<section>/<slug>.md` with front matter:

   ```markdown
   ---
   title: Page title
   sidebar_label: Short label   # optional
   status: pending              # optional: a placeholder page, tagged "Soon" in the sidebar
   description: One sentence shown under the title, in search results and in link previews.
   ---
   ```

2. Add its slug (for example `get-started/my-page`) to `NAV` at the top of `build.py`. `NAV`
   decides the sidebar order and the previous/next links. To nest pages under another one, write
   `("parent-slug", ["child-slug", ...])`, as Quickstart does with its three steps. A page that
   should be reachable only through links goes in `UNLISTED` instead.

`build.py` also writes `doc/sitemap.xml` with every page. The site's `/robots.txt` allows all
crawlers and points them to it, so search engines find the docs even without a homepage link.

## Markdown you can use

Standard Markdown (`##`/`###` headings, lists, tables, links, images, fenced code), plus:

````markdown
```bash title="Terminal"          ← optional title on a code block
pip install flexitac
```

![Alt text](/doc/assets/img/photo.webp "Caption shown under the image")

:::note[Optional title]            ← also :::tip, :::caution, :::danger
Body text.
:::

:::steps                            ← numbered steps; each #### starts one
#### First step
Text, code, images…
#### Second step
:::

:::tabs[os]                         ← tabs; tabs sharing a key ([os]) switch together
#### macOS
…
#### Linux
…
:::

:::cards                            ← link cards: #### Title | link | icon
#### FlexiTac-Gen | /flexitac-gen/ | cube
Short description.
:::

:::cards[flow]                      ← big numbered icon steps joined by arrows
#### Design | /flexitac-gen/ | grid
<p>Text under a step turns it into a small card that opens on click (the link stays as the fallback).</p>
#### Build | /doc/get-started/ | layers
:::
````

To nest one container in another, give the outer one more colons (`::::caution` … `::::`).
Icons: rocket, cpu, layers, wrench, cart, bolt, wave, lifebuoy, compass, robot, cube, book, users,
github, sim, check, grid, sliders, code, net. Raw HTML lines also pass through unchanged.

`layout: splash` in the front matter drops the "On this page" column and widens the page. Only the docs
home uses it.

`:::timeline` followed by `:::` (no body) inserts the homepage timeline: `build.py` reads it from the
`#timeline` section of `/index.html` (poster, short title, venue pill and link of each work). To add a work,
add it to the homepage timeline, then rebuild the docs; `--check` reports the docs as stale until you do.

## Feature a community robot

Visitors submit robots through the **Share your robot** issue form
([`.github/ISSUE_TEMPLATE/share-your-robot.yml`](../../.github/ISSUE_TEMPLATE/share-your-robot.yml)), linked from
the docs home. Submissions get the `community-build` label. Nothing reaches the site until a maintainer adds it:

1. **Review** the issue. Check that it's really built with FlexiTac, that both permission boxes are ticked, that the
   photo works as a tile, and that the credit is right. Ask in the thread if anything is missing.
2. **Approve** by adding the robot. Save the photo as WebP, about 800 px wide and cropped to 16:9, in
   `doc/assets/community/`. Then add a block inside `:::community` in `pages/index.md`, oldest first:

   ```markdown
   #### FlexiTac on a Robotiq 2F-85 | https://their-project.example/ | /doc/assets/community/robotiq-2f85.webp
   Jane Doe, Example Robotics Lab
   ```

   The robots appear as a "Community" row under the timeline.
3. **Publish**: rebuild, then commit with `Feature <robot> (closes #<issue>)`, so the issue closes and the
   contributor is notified.

To decline, close the issue with a short, kind note. Papers and projects that don't fit here can go to
[Awesome FlexiTac](https://github.com/binghao-huang/Awesome-FlexiTac/blob/main/CONTRIBUTING.md).

## Writing guidelines

- **One source of truth.** These docs cover the getting-started path and link out. Detailed
  procedures belong to the repository that owns them (hardware repo, PyFlexiTac, FlexiTac-Gen,
  LeFlexiTac). Summarize them here and link the canonical page, instead of copying them.
- **Only verified facts.** Version numbers, pin counts, frame sizes and prices must come from a
  linked source, or from something you tested. Say how you tested it.
- **Credit and licenses.** Keep authors' credit and each project's license. Images need
  permission from whoever owns them.
- Store images as WebP, at most 1400 px wide, in `doc/assets/img/`.
- Short clips go in `doc/assets/video/` as H.264 MP4 (keep each under about 1.5 MB), with a WebP poster in
  `doc/assets/img/`. Write them as `<video src=… poster=… muted loop playsinline preload="none" data-inview>`:
  `docs.js` plays them only while they're on screen, and shows controls instead for readers who prefer
  reduced motion. See the samples on *Data collection* (`<figure class="sample">`).
- Draw layouts and diagrams as SVG with a transparent background, and show them with `<div class="figs drawing">`
  (no frame, a soft shadow, works in both themes). The FPC layouts on *Order parts* come from
  `tools/fpc_svg.py`, which draws them from Learn FlexiTac's Gerber-traced geometry:
  `python3 doc/_src/tools/fpc_svg.py [path/to/learn_flexitac/flexitac-anatomy/shared/data]`.
- *Quickstart*'s "What you'll build" figure (the whole setup and the pad, with numbered markers) is rendered in
  Blender like the exploded view: `~/website/blender/flexitac-umi` (`system.py`, `pad.py`, then `build_web.py`,
  which rewrites the `<div class="build" id="build-figure">` block in `get-started/index.md`).
- *Tactile representation* has a point cloud viewer, `doc/assets/pcv.js`. The page loads the script itself, and
  the viewer reads `doc/assets/data/isaac-aloha.{json,bin}` and its picture atlas `isaac-aloha-rgb.webp` (the JSON
  describes the layout; each pad's points are stored column by column). They are recorded by
  `tools/isaac_sample.py` in a [FlexiTac-IsaacSim-Simulation](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation)
  environment (main branch: Isaac Sim 6.2 + Isaac Lab 3.0; see the script's docstring). It replays one bundled
  plug–socket demonstration; the pictures and the depth behind the camera points come from the env's RTX camera, and
  the cloud is cropped just above the table top. The page shows frame 94.
- *Troubleshooting* has an animation of gold fingers going into a 20-pin FFC extender, `doc/assets/ffc.js`
  (`<div class="ffc">`; the page loads the script itself). It works out which finger touches which contact from
  its own drawing, so the result it reports always matches the picture. Its clip, `trouble-ffc-short.mp4`, is
  the plot window cut from a phone video, steadied by following the heatmap from frame to frame.
  `python3 doc/_src/tools/tactile_svg.py 63 2` redraws the 2D map figure from the same data, and
  `doc/assets/img/isaac-frame.webp` is the viewer's still image for readers without JavaScript.
- A photo already cut out onto pure black becomes a transparent cut-out with
  `python3 doc/_src/tools/cutout_black.py in.webp out.webp` (the reading boards: `reading-board-*-cut.webp`).
