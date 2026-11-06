// The Library (library.html; the user's requests of 2026-11-05): sensors already fitted to open-source gripper fingers,
// laid out as the Apple Store's.  Everything comes from static/library/entries.json (tools/library_write.py): the title
// and its line (the page's own), then each gripper once (the user's request of 2026-11-06: "只有umi finger在首页而可以
// 显示重复,其他的夹爪后面就只出现一次,然后标注一下点进去我们有1-3mm customization"): the grippers' section, one card
// each, four to a row (two on a phone), each its 2 mm sensor's picture, its name and its pitches' range to choose on its
// page, then the UMI finger's shelf with its pitches, fine to coarse (SHELVED; after the grippers, the user's request of
// 2026-11-06: "UMI Fin-Ray Gripper. ... 这个section可以放在夹爪的后面"); and at #<id> a sensor's own
// page: its facts, its Pitch (every pitch of its gripper), Open in Gen by Surface (./?part=<id>, where main.js builds it
// from its shipped fit) and its Top and Bottom FPC Gerber ZIPs.  No engine runs here: on the static site (its pages
// carry the flexitac-backend meta) the ZIPs were built with the site (static/library/files.json); under app.py each is
// the server's export of the sensor's design.
//
// A family (entries.json families: the UMI finger's tapered tips, the user's requests of 2026-11-05) is one card closing
// its shelf's part, at #<family> its default sensor's page, where segmented controls of its axes (Shape, Tip width) pick
// the sensor of its grid in place of the pitch; its parts have no shelf or card of their own.
//
// Motion as the generator's theme has it: none.  Every jump is instant (the native fragment jump, scrollBy and
// scrollTo with the page's auto scrolling); the only scroll listener is the shelf's own, which only turns its arrows
// on and off.  Every picture is slot(): a light 16:10 box with the sensor's picture once entries.json names one, else
// (or when its file does not load) a drawing of its field made here.  The pictures (the user's request of 2026-11-05,
// "卡片上的图为手指+传感器叠加": the cards show the finger and the sensor on it) are the generator's on-part figure, shot
// by the shots tool at its Exploded and its Assembled home on a transparent background: a card shows the Exploded one,
// a sensor's page both, with a small switch between them.
"use strict";

(() => {
  const BASE = "static/library/";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const KINDS = [["top-gerber", "Top FPC Gerber ZIP"], ["bottom-gerber", "Bottom FPC Gerber ZIP"]];
  const PREBUILT = document.querySelector('meta[name="flexitac-backend"]')?.content === "browser";
  // The tab's title on the grid ("Library · FlexiTac-Gen"); a sensor's page puts its label before it.
  const PAGE_TITLE = document.title;
  const $ = id => document.getElementById(id);
  // The pictures' contract (2026-11-05, between this page, tools/library_write.py and the shots tool): a variant's
  // "image" is null or {exploded: {src, card, width, height}, assembled: {src, width, height}, alt}, its paths relative
  // to static/library/ as its "fit" is (shots/<id>.exploded.webp, shots/<id>.assembled.webp, 1280 x 800, and the
  // cards' shots/<id>.exploded.card.webp, 640 x 400: CARD), WebP with alpha, the figure alone.  VIEWS: the views of a
  // sensor's page, the first the one it opens with.
  const CARD = [640, 400];
  const VIEWS = [["exploded", "Exploded"], ["assembled", "Assembled"]];
  // The parts shown with a shelf of all their sensors (the user's request of 2026-11-06: the UMI finger alone), after the
  // grippers' section; every other part of entries.json's order is one card there, its pitches chosen on its sensor's
  // page.
  const SHELVED = ["umi-finray"];
  const COUNTS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // index: entries.json; files: files.json (the static site); view: "grid" or "detail"; picture: the view a sensor's
  // page shows (VIEWS; kept as its pitch, shape or tip changes, the first again on each sensor's page opened); gridY and
  // opener: where the grid was and the card that opened a sensor's page (Back puts both back); syncs: each track's arrows.
  const state = {index: null, files: null, filesError: null, filesLoad: null, view: null, picture: VIEWS[0][0], gridY: 0, opener: null, fromGrid: false, syncs: []};
  history.scrollRestoration = "manual";
  // The page opened at an address of its own (a sensor's page shared or reloaded, a place of the grid): the grid's title,
  // tagline and footer wait for the first route (opened(), once entries.json is in), which shows the page the address
  // names (the review of 2026-11-06: a sensor's page opened directly had first shown the grid's title over the footer,
  // 40 to 100 ms here, up to 1.9 s on a slow 3G at 390 px, then switched to the sensor's page).
  const FOOTER = document.querySelector(".lib-footer");
  if (location.hash.length > 1) {
    $("libHero").hidden = true;
    if (FOOTER) FOOTER.hidden = true;
  }
  function opened() {
    if (FOOTER) FOOTER.hidden = false;
  }

  // -- small helpers -------------------------------------------------------------------------------------------------

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "className") node.className = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    }
    node.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
    return node;
  }
  function svg(tag, attributes = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }
  const fmt1 = value => Number(value).toFixed(1);
  const size = variant => `${variant.rows} × ${variant.columns}`;
  const fieldText = variant => `${fmt1(variant.field_mm[0])} × ${fmt1(variant.field_mm[1])} mm`;
  // A number and its "mm" on one line (a no-break space): a heading never breaks "A 2 / mm sensor" (the review of 2026-11-05).
  // Since the shelves' one wording (the user's decision of 2026-11-05: 'Four pitches, 1 to 3 mm.') the range is one unit
  // too (it broke as "1 / to 3 mm" at 390 px and "1 to / 3 mm" at 600 px) and so is a family's clause after it ("and
  // tapered tips": at 900 px the UMI heading broke as "..., and / tapered tips."), so a heading breaks between phrases.
  const keep = text => String(text).replace(/(\d) mm\b/g, "$1\u00a0mm").replace(/(\d) to (\d)/g, "$1\u00a0to\u00a0$2")
    .replace(/, and ([^,.]+)/g, (clause, words) => `, and\u00a0${words.replace(/ /g, "\u00a0")}`);
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  // A name's hyphens unbreakable (U+2011): its balanced lines never split "Fin-Ray" (the second review of 2026-11-05).
  const whole = text => String(text).replace(/-/g, "\u2011");
  const bytesText = bytes => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`);
  const readerText = name => (name === "32x16" ? "32 × 16 FlexiTac" : String(name).replace("x", " × "));
  function chevron(direction) {
    // The arrows' and the back link's chevron, drawn in the text colour.
    const drawing = svg("svg", {viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", class: "lib-chevron"});
    drawing.append(svg("path", {d: direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5", fill: "none", stroke: "currentColor",
      "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round"}));
    return drawing;
  }
  async function json(url) {
    const answer = await fetch(url);
    if (!answer.ok) throw new Error(`HTTP ${answer.status}`);
    return answer.json();
  }

  // -- the picture slot ----------------------------------------------------------------------------------------------

  function slot(variant, kind, view = VIEWS[0][0], missed = null) {
    // One box for every picture (kind: card or detail): 16:10, light in both schemes (the generator's drawings are
    // light boxes in the dark one too; the pictures are the figure alone on a transparent ground, so the box is theirs),
    // the picture contained and centred in it (library.css).  A card shows the Exploded picture's card file, lazily (the
    // grippers' lower row and the UMI shelf below them load as they come near) and decoded off the main thread, its width
    // and height set so nothing moves as it arrives; a sensor's page shows the view asked for, at once.  The alt text is
    // entries.json's ('WidowX 250, 1 mm on the part').  Without a picture, or when its file does not load, the
    // placeholder (field()): never a broken image (missed, a sensor's page's: told which view failed).
    const box = el("div", {className: `lib-shot lib-shot-${kind}`});
    const image = variant.image;
    const src = kind === "detail" ? image?.[view]?.src : image?.exploded?.card;
    if (!src) {
      box.append(field(variant));
      return box;
    }
    const [width, height] = kind === "detail" ? [image[view].width, image[view].height] : CARD;
    const shown = el("img", {src: BASE + src, width, height, alt: image.alt || "", decoding: "async",
      loading: kind === "detail" ? null : "lazy"});
    shown.addEventListener("error", () => {
      shown.replaceWith(field(variant));
      missed?.(view);
    }, {once: true});
    box.append(shown);
    return box;
  }

  function field(variant) {
    // The placeholder: the field at its aspect (field_mm), within 70 % of the box, its columns and rows as hairlines at
    // the taxels' centres, so a shelf shows its pitches from fine to coarse.  It is decoration: the text says the rest.
    const [width, height] = variant.field_mm;
    const scale = Math.min(112 / width, 70 / height);
    const [w, h] = [width * scale, height * scale];
    const [x, y] = [(160 - w) / 2, (100 - h) / 2];
    const drawing = svg("svg", {viewBox: "0 0 160 100", "aria-hidden": "true", focusable: "false"});
    drawing.append(svg("rect", {x, y, width: w, height: h, rx: Math.min(3, w / 10, h / 10), class: "lib-field"}));
    const lines = svg("g", {class: "lib-lines"});
    for (let k = 0; k < variant.columns; k += 1) {
      const at = x + (w * (k + 0.5)) / variant.columns;
      lines.append(svg("line", {x1: at, y1: y, x2: at, y2: y + h}));
    }
    for (let k = 0; k < variant.rows; k += 1) {
      const at = y + (h * (k + 0.5)) / variant.rows;
      lines.append(svg("line", {x1: x, y1: at, x2: x + w, y2: at}));
    }
    drawing.append(lines);
    return drawing;
  }

  function gallery(variant) {
    // A sensor's page's picture in its frame: the view state.picture names and, when the sensor has both views, a small
    // segmented control under it ("Exploded | Assembled": the pitch's look, grey, never blue; radios in a fieldset, so
    // the arrow keys move between them and a screen reader names the group by its legend) that swaps the picture in
    // place, the rest of the page and the focus as they are.  A view whose file does not load shows the placeholder;
    // the control goes once both have failed (nothing is left to switch to).
    const views = VIEWS.filter(([key]) => variant.image?.[key]?.src);
    if (views.length && !views.some(([key]) => key === state.picture)) state.picture = views[0][0];
    const failed = new Set();
    let control = null;
    const missed = view => {
      failed.add(view);
      if (control && failed.size === views.length) control.remove();
    };
    let box = slot(variant, "detail", state.picture, missed);
    const frame = el("div", {className: "lib-frame"}, box);
    if (views.length < 2) return frame;
    control = el("fieldset", {className: "lib-view"}, el("legend", {}, "View"),
      el("div", {className: "lib-seg-track"}, views.map(([value, label]) => el("label", {},
        el("input", {type: "radio", name: "libView", value, checked: value === state.picture}),
        el("span", {}, label)))));
    control.addEventListener("change", event => {
      const view = event.target.value;
      state.picture = view;
      // The new picture put in once it is decoded, so the box never shows empty between the two (the one before stays
      // until then), and not at all if another view was chosen meanwhile; a file that does not load is put in as its
      // placeholder (slot()'s error listener, which runs first, has replaced it).
      const next = slot(variant, "detail", view, missed);
      const shown = next.querySelector("img");
      const swap = () => {
        if (state.picture !== view || !box.isConnected) return;
        box.replaceWith(next);
        box = next;
      };
      if (!shown) { swap(); return; }
      shown.addEventListener("load", () => shown.decode().then(swap, swap), {once: true});
      shown.addEventListener("error", swap, {once: true});
    });
    frame.append(control);
    return frame;
  }

  // -- the grid: the grippers' cards, then the UMI finger's shelf ----------------------------------------------------

  function scroller(track) {
    // A row that scrolls sideways inside itself (never the page), with two arrows under it on the right: shown only
    // while it overflows, each off at its end; a press moves it by its width less one gap, at once (the cards snap).
    const left = el("button", {type: "button", className: "lib-arrow", "aria-label": "Scroll left"}, chevron("left"));
    const right = el("button", {type: "button", className: "lib-arrow", "aria-label": "Scroll right"}, chevron("right"));
    const arrows = el("div", {className: "lib-arrows", hidden: true}, left, right);
    const step = sign => {
      const style = getComputedStyle(track);
      const inner = track.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      track.scrollBy({left: sign * (inner - (parseFloat(style.columnGap) || 0))});
    };
    const sync = () => {
      if (!track.clientWidth) return;  // hidden (a sensor's page is shown)
      arrows.hidden = track.scrollWidth <= track.clientWidth + 1;
      left.disabled = track.scrollLeft <= 1;
      right.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    };
    left.addEventListener("click", () => step(-1));
    right.addEventListener("click", () => step(1));
    track.addEventListener("scroll", sync, {passive: true});
    state.syncs.push(sync);
    return [track, arrows];
  }

  function card(id, badged = true) {
    // A sensor's card on its gripper's shelf, whose heading names the gripper: the pitch is its name, as each product's
    // own on the Apple Store's shelves (the review of 2026-11-05: four cards of one name, told apart by grey lines), the
    // size, the taxels and the field under it, and its label for a screen reader names the gripper too.  The badge's
    // line is kept, empty, on a shelf where another card has a badge (the names line up) and left out on one where none
    // has (its second review).
    const variant = state.index.variants[id];
    const lines = [`${size(variant)} · ${variant.taxels} taxels`, `${fieldText(variant)} field`];
    const named = `${variant.label}${variant.badge ? ` (${variant.badge.toLowerCase()})` : ""}: ${lines.join(", ")}`;
    return el("a", {className: "lib-card", href: `#${id}`, "data-variant": id, "aria-label": named},
      slot(variant, "card"),
      el("span", {className: "lib-card-text"},
        badged ? el("span", {className: "lib-badge"}, variant.badge || "") : null,
        el("span", {className: "lib-card-name"}, `${variant.pitch_mm} mm pitch`),
        lines.map(line => el("span", {className: "lib-card-line"}, line))));
  }

  // A part's pitches' range, fine to coarse ('1 to 3 mm', '1 to 2.5 mm'; one pitch: '2 mm').
  function pitchRange(part) {
    const pitches = part.variants.map(id => state.index.variants[id].pitch_mm);
    const [low, high] = [Math.min(...pitches), Math.max(...pitches)];
    return low === high ? `${low} mm` : `${low} to ${high} mm`;
  }

  function gripperCard(partId) {
    // A gripper's one card in the grippers' section (the user's request of 2026-11-06: each gripper but the UMI finger
    // once on the page, its card saying that its page offers its pitches): its default (2 mm) sensor's picture, its
    // name and two grey lines, as a shelf's card has, its range ('1 to 3 mm', the part's own) and 'Pick your pitch';
    // it opens that sensor's page, whose Pitch shows the others.  Each line within a 360 px phone's card (116 px of
    // text at 14 px; the review of 2026-11-06: 'Pitch 1 to 2.5 mm', 124 px, left 'Pitch' alone on a line, and 'Pick
    // one inside' could be read as picking a gripper).  No badge line (no card here has one).  Its id is the grid's
    // address of the gripper (#gripper-<part>: a sensor's page's back link and the older #shelf-<part> come back to it).
    const part = state.index.parts[partId];
    const lines = [pitchRange(part), "Pick your pitch"];
    return el("a", {className: "lib-card", id: `gripper-${partId}`, href: `#${part.default}`, "data-variant": part.default, "data-part": partId,
      "aria-label": `${part.title}: ${lines.join(", ").toLowerCase()}`},
      slot(state.index.variants[part.default], "card"),
      el("span", {className: "lib-card-text"},
        el("span", {className: "lib-card-name"}, whole(part.title)),
        lines.map(line => el("span", {className: "lib-card-line"}, keep(line)))));
  }

  function familyCard(familyId) {
    // A family's card (the tapered tips): its default sensor's picture, its title and its two lines, a jump to its page.
    const family = state.index.families[familyId];
    return el("a", {className: "lib-card", href: `#${familyId}`, "data-family": familyId},
      slot(state.index.variants[family.default], "card"),
      el("span", {className: "lib-card-text"},
        el("span", {className: "lib-badge"}, ""),
        el("span", {className: "lib-card-name"}, family.title),
        family.lines.map(line => el("span", {className: "lib-card-line"}, line))));
  }

  // A shelf's or a section's heading: its bold half and its grey half, in one wording ('<Title>. <the rest>.').
  const heading = (id, title, text) => el("h3", {className: "lib-shelf-title", id: `${id}-title`}, el("strong", {}, title), " ", el("span", {}, keep(text)));

  function shelf(id, title, text, ids, families = []) {
    const badged = ids.some(identifier => state.index.variants[identifier].badge);
    return el("section", {className: "lib-shelf", id, "aria-labelledby": `${id}-title`}, heading(id, title, text),
      scroller(el("div", {className: "lib-track"}, ids.map(identifier => card(identifier, badged)), families.map(familyCard))));
  }

  // The families whose card closes this part's shelf.
  const familiesOf = part => Object.keys(state.index.families || {}).filter(familyId => state.index.families[familyId].shelf === part);
  // A part with a shelf: SHELVED's, and any part a family's card closes (a family's sensors have no card but it).
  const isShelved = part => SHELVED.includes(part) || familiesOf(part).length > 0;
  // The parts with a shelf, and those with one card in the grippers' section, in entries.json's order.
  const shelvedParts = () => state.index.order.filter(isShelved);
  const carded = () => state.index.order.filter(part => !isShelved(part));
  // Where a part is on the grid: its shelf, or its card in the grippers' section.
  const placeOf = part => (isShelved(part) ? `shelf-${part}` : `gripper-${part}`);

  function grippers(parts) {
    // The grippers but the shelved (the user's request of 2026-11-06, "其他夹爪的话,不需要每个夹爪一row,你就每个row放4个夹爪就
    // 好了"): one section, the grid's first (the UMI shelf after it), its heading in the shelves' wording ('Grippers.
    // Seven, each fitted at four pitches.'), then a grid of one card each, four to a row from 735 px and two below
    // (library.css), never three (3 + 3 + 1); nothing scrolls sideways.  A count past COUNTS is its digits ('13'), one
    // pitch 'one pitch'.
    const word = count => COUNTS[count] || String(count);
    const counts = new Set(parts.map(part => state.index.parts[part].variants.length));
    const [count] = counts;
    const each = counts.size === 1 ? `, each fitted at ${word(count).toLowerCase()} ${count === 1 ? "pitch" : "pitches"}` : "";
    return el("section", {className: "lib-section lib-grippers", id: "grippers", "aria-labelledby": "grippers-title"},
      heading("grippers", "Grippers.", `${word(parts.length)}${each}.`),
      el("div", {className: "lib-cards"}, parts.map(gripperCard)));
  }

  function renderGrid() {
    const {index} = state;
    const parts = carded();
    // The grippers' section first, then the shelves (the UMI finger's; the user's request of 2026-11-06): the page's
    // order is its reading and Tab order.
    $("libShelves").replaceChildren(
      ...(parts.length ? [grippers(parts)] : []),
      ...shelvedParts().map(part => shelf(`shelf-${part}`, `${index.parts[part].title}.`, index.parts[part].shelf, index.parts[part].variants, familiesOf(part))));
    // The card that opens a sensor's page: Back comes back to it.
    $("libShelves").addEventListener("click", event => {
      const opener = event.target.closest("a.lib-card");
      if (opener) state.opener = opener;
    });
  }

  // -- a sensor's own page -------------------------------------------------------------------------------------------

  function source(license) {
    // "mujoco_menagerie at f3b6013": the repository and the commit the part's source URL is pinned to.
    const match = /github\.com\/[^/]+\/([^/]+)\/blob\/([0-9a-f]{40})\//.exec(license.source) || [];
    return match[1] ? `${match[1]} at ${match[2].slice(0, 7)}` : license.source;
  }

  function segments(legend, name, choices, checked) {
    // A segmented control (the mode switch's look: a grey track, the chosen one a white thumb, never blue); a change
    // replaces the address (no history entry: Back still goes to the grid) and the page, the same control focused.
    const control = el("fieldset", {className: "lib-seg"}, el("legend", {}, legend),
      el("div", {className: "lib-seg-track"}, choices.map(([value, label, target]) => el("label", {},
        el("input", {type: "radio", name, value, checked: value === checked, "data-target": target}),
        el("span", {}, label)))));
    control.addEventListener("change", event => {
      const target = event.target.dataset.target;
      history.replaceState(null, "", `#${target}`);
      renderDetail(target);
      $("libDetail").querySelector(`input[name="${name}"]:checked`)?.focus();
    });
    return control;
  }

  // A family sensor's choice on each axis (its grid key, 'trap|13.8', split).
  const chosenOf = (family, id) => Object.keys(family.grid).find(key => family.grid[key] === id).split("|");

  function familyControls(family, id) {
    // Each axis of the family (Shape, Tip width): its choices, each the sensor of the grid with that choice and the
    // others as they are.
    const chosen = chosenOf(family, id);
    return family.axes.map((axis, k) => segments(axis.label, `libAxis-${axis.key}`,
      axis.choices.map(choice => [choice.value, choice.label, family.grid[chosen.map((value, j) => (j === k ? choice.value : value)).join("|")]]),
      chosen[k]));
  }

  function renderDetail(id) {
    const {index} = state;
    const variant = index.variants[id];
    const part = index.parts[variant.part];
    // A family's sensor: its axes in place of the pitch, its shelf the family's (the tapered tips': the UMI finger's).
    const family = part.family ? index.families[part.family] : null;
    const home = family ? family.shelf : variant.part;
    const controls = family ? familyControls(family, id)
      : [segments("Pitch", "libPitch", part.variants.map(other => [other, `${index.variants[other].pitch_mm} mm`, other]), id)];
    const reader = variant.fits_reader ? `none (one tail pin per line; the tails also fit the ${readerText(variant.fits_reader)} reader)` : "none (one tail pin per line)";
    // The tapered tips' own fact: the shape and the width at the tip, over the family's taper height.
    const chosen = family ? chosenOf(family, id) : [];
    const picked = family ? Object.fromEntries(family.axes.map((axis, k) => [axis.key, axis.choices.find(item => item.value === chosen[k])])) : {};
    const tip = family && family.h_mm && picked.shape && picked.tip_mm
      ? [["Tip", `${picked.shape.label}, ${picked.tip_mm.label} mm at the tip, over the last ${family.h_mm} mm`]] : [];
    const facts = [
      ...tip,
      // Rows and columns named (the review of 2026-11-05: '26 × 27' alone did not say which was which).
      ["Sensor", `${variant.rows} rows × ${variant.columns} columns · ${variant.taxels} taxels`],
      ["Pitch", `${variant.pitch_mm} mm · fill ${variant.fill.toFixed(2)}`],
      ["Field", `${fieldText(variant)}${variant.centred ? ", centred" : ""}`],
      ["Tails", `${fmt1(variant.row_tail_mm)} mm, centred, ending together`],
      ["Reader", reader],
      ["Build", el("code", {}, variant.build_id)],
    ];
    const downloads = el("div", {className: "lib-downloads"});
    const mesh = part.mesh; const license = part.license;
    $("libDetail").replaceChildren(
      // Back to where its gripper is on the grid: the UMI finger's shelf, another gripper's card (2026-11-06).
      el("a", {className: "lib-back", href: `#${placeOf(home)}`}, chevron("left"), el("span", {}, index.parts[home].title)),
      el("div", {className: "lib-detail-body"},
        gallery(variant),
        el("div", {className: "lib-info"},
          el("h2", {className: "lib-detail-title", id: "libDetailTitle", tabindex: "-1"}, whole(part.title)),
          // The separator joined to the word before it (a no-break space): a line may end with it, never start with
          // it ("convex arc tip / · UMI", the review of 2026-11-05).
          el("p", {className: "lib-detail-line"}, `${capital(part.finger)}\u00a0· ${part.maker}`),
          controls,
          el("dl", {className: "lib-facts"}, facts.map(([name, value]) => el("div", {}, el("dt", {}, name), el("dd", {}, value)))),
          el("a", {className: "lib-open", href: `./?part=${encodeURIComponent(id)}`}, "Open in Gen by Surface"),
          downloads,
          el("p", {className: "lib-links"},
            el("a", {href: BASE + mesh.file, download: mesh.name}, `Part STL (${bytesText(mesh.bytes)})`), " · ",
            el("a", {href: BASE + license.text, target: "_blank", rel: "noopener"}, `Licence (${license.spdx})`)),
          el("p", {className: "lib-provenance"}, `${mesh.name} · ${mesh.facets} facets · ${mesh.unit} · ${license.change} · source: `,
            el("a", {href: license.source, target: "_blank", rel: "noopener noreferrer"}, source(license))),
          el("p", {className: "lib-detail-note"}, "For EasyEDA Pro projects, the project review and the taxel map, open it in Gen by Surface."))));
    // The tab names the sensor (a bookmark, the history, a shared link's preview): 'WidowX 250, 1 mm · Library · ...'.
    document.title = `${variant.label} · ${PAGE_TITLE}`;
    renderDownloads(downloads, id);
    present(id);
  }

  // -- a sensor's page in 3D -----------------------------------------------------------------------------------------
  // The user's request of 2026-11-05 ("lib 点进去具体的每个夹爪的时候, 那个图也做成可以三维旋转的"): on a sensor's page its
  // picture becomes a 3D view the visitor turns (./cad/library_view.js, docs/LIBRARY_VIEW.md: Gen by Surface's on-part
  // figure drawn from the files the Library ships; a gripper whole, a sensor on both fingers, the jaws open).  The picture
  // shows first; the view, drawn at the picture's home, goes over it in its slot (.lib-stage and its .lib-live: nothing
  // moves) and hides it; the Exploded | Assembled control drives both.  One view for the page (one WebGL context), made on
  // the first sensor's page that has one and kept, its host moved into each sensor's page; three.js loads on a sensor's
  // page only (the one dynamic import below), never on the grid.  Without WebGL, with Save-Data, a file that does not load
  // or a lost context the picture stays, and nothing is logged.  ?probe: <pre id="libViewState" hidden>, the view's state
  // for the checks; ?probe=shoot: the shots tool's (the drawing where the figure frames it, the stage's numbers measured).
  const PROBE = new URLSearchParams(location.search).get("probe");
  // host: the view's element (made once); view: library_view.js's (made once); load: its module; off and note: why this
  // browser has none ("unavailable"); lost: its context lost; serial: the drawing asked for last; id and its .lib-stage;
  // status: [state, note] (off, loading, drawn, failed, unavailable or lost).
  const live = {host: null, view: null, load: null, off: null, note: null, lost: false, serial: 0, id: null, stage: null, status: ["off", null]};

  function present(id) {
    // A sensor's page just drawn (renderDetail): with a view (its variant's "view") and no Save-Data, its picture's slot
    // put in .lib-stage beside the view's host, and the sensor drawn there; the control turns the view too.
    const variant = state.index.variants[id];
    live.serial += 1;
    live.id = id;
    live.stage = null;
    if (!variant.view || navigator.connection?.saveData || live.off) {
      live.view?.clear();
      setLive(live.off || "off", live.off ? live.note : null);
      return;
    }
    const box = $("libDetail").querySelector(".lib-shot-detail");
    const stage = el("div", {className: "lib-stage"});
    box.replaceWith(stage);
    stage.append(box, liveHost(variant));
    live.stage = stage;
    $("libDetail").querySelector(".lib-view")?.addEventListener("change", () => {
      live.view?.setMode(state.picture);
      setLive();
    });
    draw();
  }

  function liveHost(variant) {
    // The view's element, made once: a group the arrow keys and a drag turn, named by the picture's alt, described by
    // its hint (for a screen reader: the canvas is hidden from it); the view's canvas goes in it.
    if (!live.host) {
      live.host = el("div", {className: "lib-live", tabindex: 0, role: "group", "aria-describedby": "libLiveHint"},
        el("span", {className: "lib-live-hint", id: "libLiveHint"}, "Drag, or use the arrow keys, to turn the sensor; 0 brings it back."));
    }
    live.host.setAttribute("aria-label", variant.image?.alt || variant.label);
    return live.host;
  }

  function draw() {
    // The sensor of live.id drawn in its page's .lib-stage, which is-live then shows it (the picture hidden under it).
    const serial = (live.serial += 1);
    const {id, stage} = live;
    const variant = state.index.variants[id];
    if (live.lost) {
      setLive("lost", null);
      return;
    }
    setLive("loading", null);
    if (!live.load) live.load = import("./cad/library_view.js");
    live.load.then(module => {
      if (serial !== live.serial) return false;
      if (!live.view) {
        try {
          live.view = module.createLibraryView(live.host, {probe: PROBE !== null, shoot: PROBE === "shoot", onState: viewNews});
        } catch (error) {
          live.off = "unavailable";
          live.note = error.message;
          throw error;
        }
      }
      return live.view.show({base: BASE, id, variant, part: state.index.parts[variant.part], mode: state.picture});
    }).then(drawn => {
      if (!drawn || serial !== live.serial) return;
      stage.classList.add("is-live");
      setLive("drawn", null);
    }, error => {
      // The module that did not load is asked for again on the next sensor's page; a drawing that failed is taken down.
      if (!live.view && !live.off) live.load = null;
      if (serial !== live.serial) return;
      live.view?.clear();
      setLive(live.off || "failed", error.message);
    });
  }

  function viewNews(what) {
    // library_view.js's onState: its context lost (the picture shown again) or back (the sensor drawn again), or the
    // view turned or back at its home (the probe state).
    if (what === "lost") {
      live.lost = true;
      live.serial += 1;
      live.stage?.classList.remove("is-live");
      setLive("lost", null);
    } else if (what === "restored") {
      live.lost = false;
      if (live.stage?.isConnected) draw();
    } else {
      setLive();
    }
  }

  function rest() {
    // The grid shown: nothing drawn (the view kept for the next sensor's page).
    live.serial += 1;
    live.id = null;
    live.stage = null;
    live.view?.clear();
    setLive("off", null);
  }

  function setLive(status, note = null) {
    // The view's state, and with ?probe the page's read of it (docs/LIBRARY_VIEW.md "The page's reads").
    if (status) live.status = [status, note];
    if (PROBE === null) return;
    let node = $("libViewState");
    if (!node) {
      node = el("pre", {id: "libViewState", hidden: true});
      document.body.append(node);
    }
    const variant = live.id ? state.index.variants[live.id] : null;
    const [now, said] = live.status;
    const drawn = now === "drawn" ? live.view.info() : null;
    node.textContent = JSON.stringify({state: now, note: said, id: live.id, build_id: variant ? variant.build_id : null,
      mode: drawn ? drawn.mode : state.picture, drawn_mode: drawn ? drawn.drawn_mode : null, moved: drawn ? drawn.moved : false,
      gripper: drawn ? drawn.gripper : Boolean(variant?.view?.scene), offset: drawn ? drawn.offset : null, buffer: drawn ? drawn.buffer : null,
      ms: drawn ? drawn.ms : null, stage: drawn ? drawn.stage : null});
  }

  function renderDownloads(box, id) {
    // The static site: plain links to the prebuilt ZIPs (files.json, read once); under app.py: buttons that ask the
    // server for the export of the sensor's design (the fit's proposal #1), saved under the server's name.
    const variant = state.index.variants[id];
    if (!PREBUILT) {
      const note = el("p", {className: "lib-download-note", "aria-live": "polite"});
      box.replaceChildren(el("div", {className: "lib-pills"}, KINDS.map(([kind, label]) => {
        const button = el("button", {type: "button", className: "lib-pill", "data-export": kind}, label);
        button.addEventListener("click", () => exportZip(id, kind, button, note));
        return button;
      })), note);
      return;
    }
    if (!state.files && !state.filesError) {
      box.replaceChildren(el("div", {className: "lib-pills"}, KINDS.map(([kind, label]) => el("button", {type: "button", className: "lib-pill", disabled: true}, label))));
      loadFiles().then(() => { if (box.isConnected) renderDownloads(box, id); });
      return;
    }
    const record = state.files?.variants?.[id];
    if (!record || record.build_id !== variant.build_id) {
      box.replaceChildren(el("p", {className: "lib-download-note"}, "The prebuilt Gerbers were not found; open the sensor in Gen by Surface to download them."));
      return;
    }
    box.replaceChildren(el("div", {className: "lib-pills"}, KINDS.map(([kind, label]) =>
      el("a", {className: "lib-pill", href: BASE + record[kind].path, download: record[kind].name, "data-export": kind}, label))));
  }

  function loadFiles() {
    if (!state.filesLoad) {
      state.filesLoad = json(`${BASE}files.json`).then(data => { state.files = data; }, error => { state.filesError = error.message; });
    }
    return state.filesLoad;
  }

  function dispositionName(header) {
    const name = /filename\s*=\s*"([^"]+)"/i.exec(String(header || ""))?.[1];
    return name ? name.replace(/[\\/]/g, "_") : null;
  }

  async function exportZip(id, kind, button, note) {
    const variant = state.index.variants[id];
    button.disabled = true;
    note.textContent = "";
    try {
      const fit = await json(BASE + variant.fit);
      const body = JSON.stringify(fit.reply.proposals[0].design);
      let answer;
      // The server builds one design at a time (503 with Retry-After while it is busy).
      for (let attempt = 1; ; attempt += 1) {
        answer = await fetch(`api/export/${kind}`, {method: "POST", headers: {"Content-Type": "application/json"}, body});
        if (answer.status !== 503 || attempt >= 5) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.min(5, Number(answer.headers.get("Retry-After")) || 1)));
      }
      if (!answer.ok) {
        const data = await answer.json().catch(() => null);
        throw Object.assign(new Error(data?.error || answer.statusText || "the export failed"), {code: data?.code || `HTTP_${answer.status}`});
      }
      const name = dispositionName(answer.headers.get("Content-Disposition")) || `${variant.build_id}-${kind}.zip`;
      const url = URL.createObjectURL(await answer.blob());
      const anchor = el("a", {href: url, download: name, hidden: true});
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const built = answer.headers.get("X-Build-Id");
      if (built && built !== variant.build_id) {
        note.textContent = `Saved ${name}, but this server built ${built}, not ${variant.build_id}: the library is stale (run tools/library_write.py).`;
      }
    } catch (error) {
      note.textContent = `${error.code || "E_NETWORK"}: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }

  // -- routes --------------------------------------------------------------------------------------------------------
  // '', #grippers and #gripper-<part> (a gripper's card), #shelf-<part> (a shelved part's: the UMI finger's): the grid;
  // #<variant>: its page; #<part> and #<family>: its default variant's page (the address kept); anything else: the grid
  // with a note.  The grid's addresses before 2026-11-06 still lead somewhere: #shelf-start ("Start here.") to the
  // grid's top, #shelf-<gripper> (its shelf, its tile's jump, its pages' back link) to its card, the address replaced by
  // the new one (no history entry).  A sensor's page opens at the top with its title focused; leaving it for the grid
  // by Back or Forward, or by the back link of the gripper whose card opened it, puts back where the grid was and
  // focuses that card; otherwise (opened from outside, or another gripper's page reached by Back) the shelf's address
  // scrolls to the shelf, a card's to the card, in the middle of the window and focused.

  function setNote(text) {
    $("libNote").textContent = text;
    $("libNote").hidden = !text;
  }

  function showGrid(target, traversed = false) {
    const back = state.view === "detail";
    state.view = "grid";
    document.title = PAGE_TITLE;
    rest();
    $("libDetail").hidden = true;
    $("libHero").hidden = false;
    $("libGrid").hidden = false;
    state.syncs.forEach(sync => sync());
    // Leaving a sensor's page opened from the grid, the grid where it was and the card that opened the page focused
    // when Back or Forward comes to the grid (traversed) or the place asked for holds that card (its back link); else
    // the place asked for (the review of 2026-11-06: the back link of a page reached by Back focused another card).
    if (back && state.fromGrid && (traversed || !target || target.contains(state.opener))) {
      window.scrollTo(0, state.gridY);
      state.opener?.focus({preventScroll: true});
    } else if (target?.matches(".lib-card")) {
      // The card focused is the grid's place now: Back or Forward to the grid focuses it again.
      state.opener = target;
      target.scrollIntoView({block: "center"});
      target.focus({preventScroll: true});
    } else if (target) {
      target.scrollIntoView({block: "start"});
    } else if (back) {
      window.scrollTo(0, 0);
    }
  }

  function showDetail(id) {
    if (state.view === "grid") {
      state.gridY = window.scrollY;
      state.fromGrid = true;
    }
    state.view = "detail";
    // Each sensor's page opened (from a card, its address or Back) shows the Exploded picture first; its pitch, shape and
    // tip controls keep the view chosen (renderDetail alone).
    state.picture = VIEWS[0][0];
    setNote("");
    $("libHero").hidden = true;
    $("libGrid").hidden = true;
    $("libDetail").hidden = false;
    renderDetail(id);
    window.scrollTo(0, 0);
    $("libDetailTitle").focus({preventScroll: true});
  }

  function route() {
    if (!state.index) return;
    opened();
    // An entry of the page's history it has been at (marked below) is Back's or Forward's; any other (a link, a back
    // link, a typed address) is marked now.
    const traversed = history.state?.library === true;
    if (!traversed) history.replaceState({library: true}, "");
    let id = "";
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { id = location.hash.slice(1); }
    const {variants, parts} = state.index;
    if (Object.hasOwn(variants, id)) { showDetail(id); return; }
    if (Object.hasOwn(parts, id)) { showDetail(parts[id].default); return; }
    if (Object.hasOwn(state.index.families || {}, id)) { showDetail(state.index.families[id].default); return; }
    // The grid's places (a family's part has none); the older addresses replaced by their place now.
    const places = new Set(["grippers", ...shelvedParts().map(part => `shelf-${part}`), ...carded().map(part => `gripper-${part}`)]);
    let place = id;
    if (id === "shelf-start") place = "";
    else if (id.startsWith("shelf-") && carded().includes(id.slice(6))) place = `gripper-${id.slice(6)}`;
    if (place !== id) history.replaceState({library: true}, "", place ? `#${place}` : location.pathname + location.search);
    const known = !place || places.has(place);
    setNote(known ? "" : `No sensor in the library is named ${id}.`);
    showGrid(place && known ? $(place) : null, traversed);
    // The note is above the grid, and "Start here." was the grid's first shelf: an unknown id, or #shelf-start, typed
    // while the grid is scrolled down shows the top at once (instant; the native jump has no element of that id to go to).
    if (!known || id === "shelf-start") window.scrollTo(0, 0);
  }

  async function start() {
    try {
      state.index = await json(`${BASE}entries.json`);
      renderGrid();
    } catch (error) {
      state.index = null;
      $("libGrid").hidden = true;
      $("libHero").hidden = false;
      opened();
      $("libStatus").textContent = `The library could not be loaded (${error.message}). Gen by Surface and Rectangular still work.`;
      return;
    }
    window.addEventListener("hashchange", route);
    window.addEventListener("resize", () => state.syncs.forEach(sync => sync()));
    route();
  }

  start();
})();
