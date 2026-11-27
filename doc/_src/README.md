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
   description: One sentence shown under the title, in search results and in link previews.
   ---
   ```

2. Add its slug (for example `get-started/my-page`) to `NAV` at the top of `build.py`. `NAV`
   decides the sidebar order and the previous/next links. A page that should be reachable only
   through links goes in `UNLISTED` instead.

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
````

To nest one container in another, give the outer one more colons (`::::caution` … `::::`).
Icons: rocket, cpu, layers, wrench, cart, bolt, wave, lifebuoy, compass, robot, cube, book, users,
github, sim, check. Raw HTML lines also pass through unchanged.

## Writing guidelines

- **One source of truth.** These docs cover the getting-started path and link out. Detailed
  procedures belong to the repository that owns them (hardware repo, PyFlexiTac, FlexiTac-Gen,
  LeFlexiTac). Summarize them here and link the canonical page, instead of copying them.
- **Only verified facts.** Version numbers, pin counts, frame sizes and prices must come from a
  linked source, or from something you tested. Say how you tested it.
- **Credit and licenses.** Keep authors' credit and each project's license. Images need
  permission from whoever owns them.
- Store images as WebP, at most 1400 px wide, in `doc/assets/img/`.
- Draw layouts and diagrams as SVG with a transparent background, and show them with `<div class="figs drawing">`
  (no frame, a soft shadow, works in both themes). The FPC layouts on *Order parts* come from
  `tools/fpc_svg.py`, which draws them from Learn FlexiTac's Gerber-traced geometry:
  `python3 doc/_src/tools/fpc_svg.py [path/to/learn_flexitac/flexitac-anatomy/shared/data]`.
- A photo already cut out onto pure black becomes a transparent cut-out with
  `python3 doc/_src/tools/cutout_black.py in.webp out.webp` (the reading boards: `reading-board-*-cut.webp`).
