// The Library (index.html, the site's first page since the user's decision of 2026-11-16, "是的 be first page"; library.html
// before, which forwards here now; the user's requests of 2026-11-05): sensors already fitted to open-source gripper fingers,
// laid out as the Apple Store's.  Everything comes from static/library/entries.json (tools/library_write.py): the title
// and its line (the page's own), then each gripper once (the user's request of 2026-11-06: "只有umi finger在首页而可以
// 显示重复,其他的夹爪后面就只出现一次,然后标注一下点进去我们有1-3mm customization"): the grippers' section, one card
// each, four to a row (two on a phone), each its 2 mm sensor's picture, its name and its pitches' range to choose on its
// page, then the UMI finger's shelf (SHELVED; after the grippers, the user's request of 2026-11-06: "UMI Fin-Ray Gripper.
// ... 这个section可以放在夹爪的后面"): since the user's request of 2026-11-16 ("后面这三种不是重复了吗 ... 我在这里更多想要体现umi
// 不同shape我们都可以fit") one card per finger shape, the straight finger's as a gripper's (its pitches chosen on its page)
// and then each card of its family's (the tapered tips'), side by side in a grid of three to a row (two on a phone; a
// row that scrolled sideways until the review of that day), each picture framed on the fingertip; and at #<id> a sensor's own
// page: its facts, its Pitch (every pitch of its gripper), Open in Gen by Surface (gen.html?part=<id>, where main.js builds it
// from its shipped fit) and its Top and Bottom FPC Gerber ZIPs.  No engine runs here: on the static site (its pages
// carry the flexitac-backend meta) the ZIPs were built with the site (static/library/files.json); under app.py each is
// the server's export of the sensor's design.
//
// A family (entries.json families: the UMI finger's tapered tips, the user's requests of 2026-11-05) is its cards on its
// shelf's part's shelf, after the part's own card (since 2026-11-16 one card per shape: Short taper, Convex arc tip,
// Trapezoid tip, Concave arc tip, Pointed tip; one "Tapered tips" card before), at #<family> its default sensor's page.
// A card opens its sensor's page, where segmented controls of its axes with more than one choice (Tip width, and the
// Short taper's Shape) pick the sensor of its grid in place of the pitch; its parts have no shelf or card of their own.
//
// The showcase (the user's request of 2026-11-12: "在lib最上面一栏放置flexitac+xarm gripper的原始版本的visualization;
// 这个版本是人手design的不是autogenerate"): the grid's first section is one large card, the original hand-designed
// FlexiTac sensor on the xArm gripper, from static/library/showcase.json (docs/LIBRARY_VIEW.md: its title, its label,
// one line, its pictures, its placed record); at #<its id> its own page, the 3D view of a sensor's page drawn from the
// placed record, its link to the FlexiTac hardware tutorial and its sources.  It is no entry: no pitch, no Open in Gen
// by Surface, no download of the generator's.  Without showcase.json the Library is the one of before.
//
// The window (the user's request of 2026-11-15: "after we click for all cards to details, we may not jump to a new page.
// lets bump our to a large window, and if you click the "x" of right top conrner, it will close and back show lib"):
// a sensor's page and the showcase's are drawn in a large window over the Library (#libWindow, a modal <dialog> opened
// with showModal(): the top layer, the rest of the page inert, the focus kept inside), the grid where it was under it,
// dimmed, the page not scrolling while it is open (library.css); its X, Escape and a press and release on the backdrop
// close it (closeWindow()).  The address is as before: a card's link goes to #<id> and the window opens on that route,
// so Back closes it and Forward opens it again, and ./#<id> opened directly shows the Library with the
// window over it; closing it goes back over the window's entries to the grid's (no new entry: Back after it goes where
// it went before the window opened; the review of 2026-11-15: a new entry, with Android's Back a close request while the
// window is open, had made Back close it and open it again for ever), or, opened at its own address, replaces its entry,
// the address then the grid's place of its sensor as the page's back link's was, and focuses the card that opened it.
//
// Motion as the generator's theme has it: none, but for the 3D view's drag hint (the user's request of 2026-11-15:
// "箭头能不能做成像schetchfab一样的动画"; dragHint), which sways and fades as Sketchfab's, still under reduced motion.
// Every jump is instant (the native fragment jump, scrollIntoView and scrollTo with the page's auto scrolling); no scroll
// listener (the UMI shelf's row had one for its arrows until 2026-11-16: nothing scrolls sideways now).  Every picture
// is slot(): a light 16:10 box with the sensor's picture once entries.json names one, else (or when its file does not
// load) a drawing of its field made here.  The pictures (the user's request of 2026-11-05, "卡片上的图为手指+传感器叠加":
// the cards show the finger and the sensor on it) are the generator's on-part figure, shot by the shots tool at its
// Exploded and its Assembled home on a transparent background: a gripper's card shows the Exploded one, a UMI shelf's
// card the Assembled one framed on the fingertip (2026-11-16), a sensor's page both, with a small switch between them.
"use strict";

(() => {
  // A generator's address of before opened here (./?part=<id>, ./#rect, ...; the Library is the first page since the
  // user's decision of 2026-11-16): web/forward.js, run first in <head>, is sending it on to gen.html (<html
  // data-forward>), so nothing of the Library's runs on this page (no route, no replaceState over its address).
  if (document.documentElement.hasAttribute("data-forward")) return;
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
  // The showcase's document (docs/LIBRARY_VIEW.md "The showcase's page") and the view its card shows and its page opens
  // with: the gripper as built.
  const SHOWCASE_FORMAT = "flexitac-library-showcase/v1";
  const SHOWCASE_VIEW = "assembled";
  // The parts shown with a shelf of their own (the user's request of 2026-11-06: the UMI finger alone), after the
  // grippers' section: the part's own card and its families' cards (its shapes, 2026-11-16); every other part of
  // entries.json's order is one card in the grippers' section, its pitches chosen on its sensor's page.
  const SHELVED = ["umi-finray"];
  // The view a shelf's cards show and its sensors' pages open with (the lead's review of the UMI shelf's shapes,
  // 2026-11-16): from the Exploded home the fingertip's tapered end was foreshortened under the exploded layers, so the
  // six shapes looked alike on their cards; assembled, the contact face's outline is the shape.  The grippers' cards and
  // pages keep the Exploded picture.
  const SHELF_VIEW = "assembled";
  const COUNTS = ["None", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  // index: entries.json; files: files.json (the static site); view: "grid" or "detail" (the window open); picture: the
  // view a sensor's page shows (VIEWS; kept as its pitch, shape or tip changes, the first again on each sensor's page
  // opened); gridY and opener: where the grid was and the card that opened a sensor's page (closing the window puts both
  // back); place: the grid's place of the window's sensor (where closing it goes); depth: the window's entries of this
  // visit over the grid's, the current one among them (0: none under it, the window opened at its own address); closing:
  // the place a close going back over them is for, until route() comes.
  // showcase: null, or {id, data: showcase.json, entry: what a sensor's variant is to slot(), gallery() and the 3D view}.
  const state = {index: null, showcase: null, files: null, filesError: null, filesLoad: null, view: null, picture: VIEWS[0][0], gridY: 0, opener: null, fromGrid: false,
    place: null, depth: 0, closing: null};
  history.scrollRestoration = "manual";
  // This visit (the document's life: a reload is another), named in the marks route() sets on the history's entries, so
  // an entry's depth is believed only in the visit that pushed the entries under it.
  const VISIT = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  // The page opened at an address of its own (a sensor's page shared or reloaded, a place of the grid): the grid's title,
  // tagline and footer wait for the first route (opened(), once entries.json is in, or its failure), which shows the page
  // the address names (the review of 2026-11-06: a sensor's page opened directly had first shown the grid's title over
  // the footer, 40 to 100 ms here, up to 1.9 s on a slow 3G at 390 px, then switched to the sensor's page).  From the
  // first paint: theme.js marks <html data-lib-place> in <head>, library.css hides them under it (when this deferred
  // script hid them as it ran, a frame had still been painted on 7 of 16 direct opens); marked here too should theme.js
  // not have run.
  const ROOT = document.documentElement;
  if (location.hash.length > 1) ROOT.dataset.libPlace = "";
  function opened() {
    delete ROOT.dataset.libPlace;
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
  // too (it broke as "1 / to 3 mm" at 390 px and "1 to / 3 mm" at 600 px; a card's '5.8 to 21.8 mm' too), and so is the
  // UMI shelf's range of shapes since 2026-11-16 ('straight to pointed': from 735 to 900 px it broke as "..., straight /
  // to pointed."), and its count of shapes (the review of 2026-11-16: at 390 px it broke as "Six / finger shapes,"), so
  // a heading breaks between phrases.  (Until 2026-11-16 a family's clause after the range, "and tapered tips", was one
  // unit too.)
  const keep = text => String(text).replace(/\b(\w+) finger shapes\b/g, "$1\u00a0finger\u00a0shapes")
    .replace(/(\d) mm\b/g, "$1\u00a0mm").replace(/(\d|\bstraight) to (\w)/g, "$1\u00a0to\u00a0$2");
  const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
  // A name's hyphens unbreakable (U+2011): its balanced lines never split "Fin-Ray" (the second review of 2026-11-05).
  const whole = text => String(text).replace(/-/g, "\u2011");
  const bytesText = bytes => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} kB`);
  const readerText = name => (name === "32x16" ? "32 × 16 FlexiTac" : String(name).replace("x", " × "));
  async function json(url) {
    const answer = await fetch(url);
    if (!answer.ok) throw new Error(`HTTP ${answer.status}`);
    return answer.json();
  }

  // -- the picture slot ----------------------------------------------------------------------------------------------

  function slot(variant, kind, view = VIEWS[0][0], missed = null) {
    // One box for every picture (kind: card, detail or showcase, the showcase's large card: its own card file at its own
    // size, loaded at once as the grid's first picture): 16:10 (the showcase's 4:5), light in both schemes (the generator's drawings are
    // light boxes in the dark one too; the pictures are the figure alone on a transparent ground, so the box is theirs),
    // the picture contained and centred in it (library.css).  A card shows the Exploded picture's card file, lazily (the
    // grippers' lower row and the UMI shelf below them load as they come near) and decoded off the main thread, its width
    // and height set so nothing moves as it arrives; a sensor's page shows the view asked for, at once.  The alt text is
    // entries.json's ('WidowX 250, 1 mm on the part').  Without a picture, or when its file does not load, the
    // placeholder (field()): never a broken image (missed, a sensor's page's: told which view failed).
    const box = el("div", {className: `lib-shot lib-shot-${kind}`});
    const image = variant.image;
    // A shelf's card asks for its Assembled picture (SHELF_VIEW): the 1280 x 800 file, scaled down by the browser (there
    // is no Assembled card file), lazily as every card's.
    const assembledCard = kind === "card" && view === "assembled";
    const src = kind === "detail" ? image?.[view]?.src : kind === "showcase" ? image?.card?.src
      : assembledCard ? image?.assembled?.src : image?.exploded?.card;
    if (!src) {
      box.append(field(variant));
      return box;
    }
    const [width, height] = kind === "detail" ? [image[view].width, image[view].height] : kind === "showcase" ? [image.card.width, image.card.height]
      : assembledCard ? [image.assembled.width, image.assembled.height] : CARD;
    const shown = el("img", {src: BASE + src, width, height, alt: image.alt || "", decoding: "async",
      loading: kind === "card" ? "lazy" : null});
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

  // A part's pitches' range, fine to coarse ('1 to 3 mm', '1 to 2.5 mm'; one pitch: '2 mm').
  function pitchRange(part) {
    const pitches = part.variants.map(id => state.index.variants[id].pitch_mm);
    const [low, high] = [Math.min(...pitches), Math.max(...pitches)];
    return low === high ? `${low} mm` : `${low} to ${high} mm`;
  }

  function tipShot(variant) {
    // A shelf's card's picture (the UMI finger's shapes, the review of 2026-11-16): its sensor Assembled (SHELF_VIEW),
    // framed on the fingertip (library.css .lib-shot-tip: the picture scaled about the tip inside its box), where the
    // shapes differ; the whole finger at the Assembled home had left the taper a third of the picture's width.  The same
    // file as the 3D view's home (no picture of its own); the placeholder, without one, unframed.
    const box = slot(variant, "card", SHELF_VIEW);
    box.classList.add("lib-shot-tip");
    return box;
  }

  function gripperCard(partId, shelved = false) {
    // A gripper's one card in the grippers' section (the user's request of 2026-11-06: each gripper but the UMI finger
    // once on the page, its card saying that its page offers its pitches): its default (2 mm) sensor's picture, its
    // name and two grey lines, its range ('1 to 3 mm', the part's own) and 'Pick your pitch';
    // it opens that sensor's page, whose Pitch shows the others.  Each line within a 360 px phone's card (116 px of
    // text at 14 px; the review of 2026-11-06: 'Pitch 1 to 2.5 mm', 124 px, left 'Pitch' alone on a line, and 'Pick
    // one inside' could be read as picking a gripper).  No badge line (no card here has one).  Its id is the grid's
    // address of the gripper (#gripper-<part>: a sensor's page's back link and the older #shelf-<part> come back to it).
    // A shelved part's own card (the UMI finger's, first on its shelf since 2026-11-16, where its four pitches had been
    // four cards: "后面这三种不是重复了吗，在第一个umi 1mm点进去，config就可以选择毫米数量") is the same card named by its
    // shape ('Straight finger', the part's card), no id: its place is its shelf's.  (Called with one argument where a
    // gripper's: map()'s index as ``shelved`` had taken every gripper's card but the first's id.)
    const part = state.index.parts[partId];
    const lines = [pitchRange(part), "Pick your pitch"];
    const name = shelved ? part.card || part.title : part.title;
    return el("a", {className: "lib-card", id: shelved ? null : `gripper-${partId}`, href: `#${part.default}`, "data-variant": part.default, "data-part": partId,
      "aria-label": `${shelved ? `${part.title}, ${name}` : part.title}: ${lines.join(", ").toLowerCase()}`},
      shelved ? tipShot(state.index.variants[part.default]) : slot(state.index.variants[part.default], "card"),
      el("span", {className: "lib-card-text"},
        el("span", {className: "lib-card-name"}, whole(name)),
        lines.map(line => el("span", {className: "lib-card-line"}, keep(line)))));
  }

  function shapeCard(familyId, shape) {
    // A card of a family on its shelf (one finger shape, 2026-11-16): the picture of the sensor its page opens on, its
    // title and its two lines as a gripper's card has ('5.8 to 21.8 mm', 'Pick your tip width'), a jump to that
    // sensor's page; its label for a screen reader names the gripper too.
    const shelfPart = state.index.parts[state.index.families[familyId].shelf];
    return el("a", {className: "lib-card", href: `#${shape.default}`, "data-variant": shape.default, "data-family": familyId, "data-card": shape.key,
      "aria-label": `${shelfPart.title}, ${shape.title}: ${shape.lines.join(", ").toLowerCase()}`},
      tipShot(state.index.variants[shape.default]),
      el("span", {className: "lib-card-text"},
        el("span", {className: "lib-card-name"}, shape.title),
        shape.lines.map(line => el("span", {className: "lib-card-line"}, keep(line)))));
  }

  // A shelf's or a section's heading: its bold half and its grey half, in one wording ('<Title>. <the rest>.').
  const heading = (id, title, text) => el("h3", {className: "lib-shelf-title", id: `${id}-title`}, el("strong", {}, title), " ", el("span", {}, keep(text)));

  function shelf(partId, families = []) {
    // A shelved part's shelf (the UMI finger's): its heading ('UMI Fin-Ray Gripper. Six finger shapes, straight to
    // pointed.'), then its own card and its families' cards, in their order, side by side in a grid (the review of
    // 2026-11-16: the shapes are there to be compared; in a row that scrolled sideways four were in view at 1440 px, one
    // on a phone): three to a row from 735 px, two below (library.css), nothing scrolling sideways.
    const part = state.index.parts[partId];
    const id = `shelf-${partId}`;
    return el("section", {className: "lib-shelf", id, "aria-labelledby": `${id}-title`}, heading(id, `${part.title}.`, part.shelf),
      el("div", {className: "lib-cards"}, gripperCard(partId, true),
        families.flatMap(familyId => state.index.families[familyId].cards.map(shape => shapeCard(familyId, shape)))));
  }

  // The families whose cards follow this part's own on its shelf.
  const familiesOf = part => Object.keys(state.index.families || {}).filter(familyId => state.index.families[familyId].shelf === part);
  // A part with a shelf: SHELVED's, and any part a family's cards follow (a family's sensors have no card but its cards).
  const isShelved = part => SHELVED.includes(part) || familiesOf(part).length > 0;
  // The parts with a shelf, and those with one card in the grippers' section, in entries.json's order.
  const shelvedParts = () => state.index.order.filter(isShelved);
  const carded = () => state.index.order.filter(part => !isShelved(part));
  // Where a part is on the grid: its shelf, or its card in the grippers' section.
  const placeOf = part => (isShelved(part) ? `shelf-${part}` : `gripper-${part}`);
  // The part a sensor's page is of on the grid: its own, or its family's shelf's (a tapered tip's: the UMI finger's).
  const homeOf = id => {
    const part = state.index.variants[id].part;
    const family = state.index.parts[part].family;
    return family ? state.index.families[family].shelf : part;
  };

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
      el("div", {className: "lib-cards"}, parts.map(part => gripperCard(part))));
  }

  function showcaseOf(data) {
    // showcase.json as the page uses it, or null when it is not the showcase's document: its id (the page's address),
    // and an entry that slot(), gallery() and the 3D view take as they take a sensor's variant (its pictures; no build;
    // its view the placed record; the field of its pad for the placeholder).
    if (data?.format !== SHOWCASE_FORMAT || typeof data.id !== "string" || !data.placed || !data.image || !data.tutorial?.href || !Array.isArray(data.sources)) return null;
    const [columns, rows] = [data.sensor?.columns || 1, data.sensor?.rows || 1];
    return {id: data.id, data, entry: {label: data.title, image: data.image, build_id: null, view: {scene: data.placed.scene, placed: data.placed},
      field_mm: data.sensor?.field_mm || [1, 1], columns, rows}};
  }
  // A sensor's variant by its id, or the showcase's entry by the showcase's: what a page of its own shows.
  const shown = id => (id && state.showcase?.id === id ? state.showcase.entry : state.index.variants[id]);

  function showcaseCard() {
    // The grid's first section (2026-11-12): one large card, its picture (the gripper as built, Assembled; on the left
    // since 2026-11-15) beside its label, its title, one line and Details.  Since the user's request of 2026-11-15 ("make only the image that can
    // click to the details ... a button called details") the card itself is no link: its picture and its Details pill
    // open the showcase's own page.  The picture's link repeats Details', so it is out of the Tab order and hidden from
    // assistive technology (Details is the card's one stop).  Its id is the grid's address of it (#showcase: its page's
    // back link comes back to it, its Details focused).  After Details, since the user's decisions of 2026-11-15 and
    // 2026-11-16 ("在flexitac on xarm的details 后面，多一个按钮，generate sensor by yourself with cad file", its name chosen:
    // "Design your own"): a second pill opening Gen by Surface (gen.html) in this tab, where the visitor loads their own
    // 3D model; the page's action blue (as Open in Gen by Surface, its one other use: both lead to Gen by Surface), Details'
    // size, named for where it goes.
    const {id, data, entry} = state.showcase;
    return el("section", {className: "lib-showcased", "aria-labelledby": "showcase-title"},
      el("div", {className: "lib-card lib-showcase", id: "showcase"},
        el("a", {className: "lib-showcase-pic", href: `#${id}`, tabindex: "-1", "aria-hidden": "true"}, slot(entry, "showcase", SHOWCASE_VIEW)),
        el("div", {className: "lib-card-text"},
          el("p", {className: "lib-badge"}, data.label),
          el("h3", {className: "lib-showcase-title", id: "showcase-title"}, keep(data.title)),
          el("p", {className: "lib-showcase-line"}, keep(data.text)),
          el("div", {className: "lib-pills"},
            el("a", {className: "lib-pill lib-showcase-details", href: `#${id}`, "data-showcase": id, "aria-label": `Details: ${data.title}`}, "Details"),
            el("a", {className: "lib-pill lib-design", href: "gen.html", "aria-label": "Design your own sensor in Gen by Surface"}, "Design your own")))));
  }

  function renderGrid() {
    const parts = carded();
    // The showcase's card first (2026-11-12), then the grippers' section, then the shelves (the UMI finger's; the user's
    // request of 2026-11-06): the page's order is its reading and Tab order.
    $("libShelves").replaceChildren(
      ...(state.showcase ? [showcaseCard()] : []),
      ...(parts.length ? [grippers(parts)] : []),
      ...shelvedParts().map(part => shelf(part, familiesOf(part))));
    // The card that opens a sensor's page: Back comes back to it (the showcase's: its Details, its picture's link or not).
    $("libShelves").addEventListener("click", event => {
      const opener = event.target.closest("a.lib-card, .lib-showcase");
      if (opener) state.opener = opener.querySelector(".lib-showcase-details") || opener;
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
    // replaces the address (no history entry: Back still goes to the grid; the entry's mark kept, its depth with it) and
    // the page, the same control focused.
    const control = el("fieldset", {className: "lib-seg"}, el("legend", {}, legend),
      el("div", {className: "lib-seg-track"}, choices.map(([value, label, target]) => el("label", {},
        el("input", {type: "radio", name, value, checked: value === checked, "data-target": target}),
        el("span", {}, label)))));
    control.addEventListener("change", event => {
      const target = event.target.dataset.target;
      history.replaceState(history.state, "", `#${target}`);
      renderDetail(target);
      $("libDetail").querySelector(`input[name="${name}"]:checked`)?.focus();
    });
    return control;
  }

  // A family sensor's card (the one whose grid holds it) and its choice on each of the card's axes (its grid key,
  // 'trap|13.8', split).
  const cardOf = (family, id) => family.cards.find(shape => Object.values(shape.grid).includes(id));
  const chosenOf = (shape, id) => Object.keys(shape.grid).find(key => shape.grid[key] === id).split("|");

  function familyControls(shape, id) {
    // Each axis of the sensor's card with more than one choice (Tip width; the Short taper's Shape too): its choices,
    // each the sensor of the card's grid with that choice and the others as they are.  An axis of one choice (a card's
    // own shape) is no control: the card is that shape.
    const chosen = chosenOf(shape, id);
    return shape.axes.map((axis, k) => (axis.choices.length < 2 ? null : segments(axis.label, `libAxis-${axis.key}`,
      axis.choices.map(choice => [choice.value, choice.label, shape.grid[chosen.map((value, j) => (j === k ? choice.value : value)).join("|")]]),
      chosen[k])));
  }

  function renderDetail(id) {
    const {index} = state;
    const variant = index.variants[id];
    const part = index.parts[variant.part];
    // A family's sensor: its card's axes in place of the pitch, its shelf the family's (the tapered tips': the UMI
    // finger's).
    const family = part.family ? index.families[part.family] : null;
    const shape = family ? cardOf(family, id) : null;
    const home = homeOf(id);
    // Its title its gripper's and, a family's sensor, its card's shape ('UMI Fin-Ray Gripper, concave arc tip'; the
    // review of 2026-11-16: every tip's part is 'UMI Fin-Ray Gripper, tapered tip', so a shape's page did not name it).
    const title = shape ? `${index.parts[home].title}, ${shape.title.toLowerCase()}` : part.title;
    const controls = shape ? familyControls(shape, id)
      : [segments("Pitch", "libPitch", part.variants.map(other => [other, `${index.variants[other].pitch_mm} mm`, other]), id)];
    const reader = variant.fits_reader ? `none (one tail pin per line; the tails also fit the ${readerText(variant.fits_reader)} reader)` : "none (one tail pin per line)";
    // The tapered tips' own fact: the shape and the width at the tip, over the card's taper height.
    const chosen = shape ? chosenOf(shape, id) : [];
    const picked = shape ? Object.fromEntries(shape.axes.map((axis, k) => [axis.key, axis.choices.find(item => item.value === chosen[k])])) : {};
    const tip = shape && shape.h_mm && picked.shape && picked.tip_mm
      ? [["Tip", `${picked.shape.label}, ${picked.tip_mm.label} mm at the tip, over the last ${shape.h_mm} mm`]] : [];
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
    // Closing the window goes to where its gripper is on the grid: the UMI finger's shelf, another gripper's card (the
    // page's back link's address, 2026-11-06; the window's X since 2026-11-15).
    state.place = placeOf(home);
    $("libDetail").replaceChildren(
      el("div", {className: "lib-detail-body"},
        gallery(variant),
        el("div", {className: "lib-info"},
          el("h2", {className: "lib-detail-title", id: "libDetailTitle", tabindex: "-1"}, whole(title)),
          // The separator joined to the word before it (a no-break space): a line may end with it, never start with
          // it ("convex arc tip / · UMI", the review of 2026-11-05).
          el("p", {className: "lib-detail-line"}, `${capital(part.finger)}\u00a0· ${part.maker}`),
          controls,
          el("dl", {className: "lib-facts"}, facts.map(([name, value]) => el("div", {}, el("dt", {}, name), el("dd", {}, value)))),
          el("a", {className: "lib-open", href: `gen.html?part=${encodeURIComponent(id)}`}, "Open in Gen by Surface"),
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

  function renderShowcase() {
    // The showcase's own page (2026-11-12): its picture in its frame with the Exploded | Assembled control (the 3D view
    // drawn over it from the placed record), its label, its title, its one line and its line of detail (the sensor's size
    // and fingers, 2026-11-15: the card's line no longer says them), the FlexiTac hardware tutorial for
    // its Gerbers (the showcase's own link, in showcase.json; a grey pill: the blue is Open in Gen by Surface's, which
    // this page has not) and its sources with their notices.  No pitch, no generator downloads.
    const {id, data, entry} = state.showcase;
    state.place = "showcase";
    $("libDetail").replaceChildren(
      el("div", {className: "lib-detail-body lib-detail-showcase"},
        gallery(entry),
        el("div", {className: "lib-info"},
          el("p", {className: "lib-badge"}, data.label),
          el("h2", {className: "lib-detail-title", id: "libDetailTitle", tabindex: "-1"}, whole(data.title)),
          el("p", {className: "lib-detail-line"}, keep(data.text)),
          el("p", {className: "lib-showcase-detail"}, keep(data.detail)),
          el("div", {className: "lib-pills"},
            el("a", {className: "lib-pill", href: data.tutorial.href, target: "_blank", rel: "noopener noreferrer"}, data.tutorial.label)),
          el("p", {className: "lib-provenance"}, data.sources.flatMap((source, k) => [k ? " · " : null, `${source.text} (`,
            el("a", {href: BASE + source.notice, target: "_blank", rel: "noopener"}, "notice"), ")"])))));
    document.title = `${data.title} · ${PAGE_TITLE}`;
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
  // or a lost context the picture stays, and this script logs nothing; without WebGL three.js's WebGLRenderer still says
  // why it has no context with console.error (three lines in Chromium; the verification of 2026-11-06), left as it is
  // (library_checks part_view takes them).  ?probe: <pre id="libViewState" hidden>, the view's state
  // for the checks; ?probe=shoot: the shots tool's (the drawing where the figure frames it, the stage's numbers measured).
  const PROBE = new URLSearchParams(location.search).get("probe");
  // host: the view's element (made once); view: library_view.js's (made once); load: its module; off and note: why this
  // browser has none ("unavailable"); lost: its context lost; serial: the drawing asked for last; id and its .lib-stage;
  // status: [state, note] (off, loading, drawn, failed, unavailable or lost); hint: the drag hint in the host (dragHint;
  // none on the shots tool's page); page: the gripper whose page the view is on (pageOf), and used: whether the visitor
  // has used the view there (the hint hidden).
  const live = {host: null, view: null, load: null, off: null, note: null, lost: false, serial: 0, id: null, stage: null, status: ["off", null],
    hint: null, page: null, used: false};

  function present(id) {
    // A sensor's page just drawn (renderDetail): with a view (its variant's "view") and no Save-Data, its picture's slot
    // put in .lib-stage beside the view's host, and the sensor drawn there; the control turns the view too.  (The
    // showcase's page too: its entry's view is its placed record.)
    const variant = shown(id);
    live.serial += 1;
    live.id = id;
    live.stage = null;
    // Another gripper's page (or the window opened again: rest() forgets the page) shows the drag hint again; a pitch,
    // a shape or a tip of the same page keeps it as the visitor left it.
    const page = pageOf(id);
    if (page !== live.page) {
      live.page = page;
      live.used = false;
    }
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
    // its hint (for a screen reader: the canvas is hidden from it), with the drag hint (dragHint; not on the shots tool's
    // page); the view's canvas goes in it.  The visitor's use of it (used()): a mouse's or a pen's press of its main
    // button, a key that turns it, a double click (a mouse's first click's press, a touch screen's double tap), and a
    // touch once it has turned the view (viewNews; the review of 2026-11-15: on a phone the view is the first thing in
    // the window and a vertical swipe over it scrolls the window's page, which had hidden the hint for the page, the view
    // never turned; a right or middle click, which turns nothing, had hidden it too).  The hint as the page has it
    // (present(): shown on a page anew).
    if (!live.host) {
      live.hint = PROBE === "shoot" ? null : dragHint();
      live.host = el("div", {className: "lib-live", tabindex: 0, role: "group", "aria-describedby": "libLiveHint"},
        el("span", {className: "lib-live-hint", id: "libLiveHint"}, "Drag, or use the arrow keys, to turn the sensor; 0 brings it back."),
        live.hint);
      live.host.addEventListener("pointerdown", event => {
        if (event.pointerType !== "touch" && event.button === 0) used();
      });
      live.host.addEventListener("dblclick", used);
      live.host.addEventListener("keydown", event => {
        if (TURN_KEYS.includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) used();
      });
    }
    live.host.setAttribute("aria-label", variant.image?.alt || variant.label);
    live.host.classList.toggle("is-used", live.used);
    live.hint?.classList.toggle("is-gone", live.used);
    return live.host;
  }

  // The keys that turn the view (onpart.js's; 0 brings it home, which is no turn).
  const TURN_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  // A gripper's page: the showcase's, or a part's (a family's for its tapered tips: a card's Tip width and Shape pick
  // another part of the family on the same page).
  const pageOf = id => (state.showcase?.id === id ? id : state.index.parts[state.index.variants[id].part].family || state.index.variants[id].part);

  function dragHint() {
    // The user's request of 2026-11-15 ("箭头能不能做成像schetchfab一样的动画": Sketchfab's "click & hold to rotate", in
    // place of the turn's mark of that day): a pointing hand between two arrows over "Drag to rotate", drawn here (their
    // picture is theirs), at the bottom centre of the view, swaying from side to side as a drag would (library.css
    // .lib-drag): shown once the view is drawn (never over the picture), faded in, and faded out at the visitor's first
    // use of the view on that page (used()); then its sway stopped (is-gone: nothing moves unseen).  For the eye alone
    // (the host's hint says it in words); the pointer passes through it to the view.  The arrows block arrows, each one
    // outline as the hand (since the review of 2026-11-15: one white cursor edged in ink on any part).
    const drawing = svg("svg", {viewBox: "0 0 84 44", "aria-hidden": "true", focusable: "false"});
    drawing.append(svg("path", {class: "lib-drag-arrow", d: "M22 12.6H11V8.4L3 15l8 6.6v-4.2h11ZM62 12.6h11V8.4l8 6.6-8 6.6v-4.2H62Z"}),
      svg("path", {class: "lib-drag-hand", d: "M34.5 29.5V5.2a3.1 3.1 0 0 1 6.2 0V16a2.8 2.8 0 0 1 5.6 0v1.6a2.8 2.8 0 0 1 5.6 0v2.2a2.6 2.6 0 0 1 5.2 0v8.4"
        + "c0 7.4-4.4 12.6-11 12.6h-3.4c-3.4 0-5.9-1.3-7.9-3.9l-5.6-7.3a2.75 2.75 0 0 1 4.1-3.6Z"}),
      svg("path", {class: "lib-drag-crease", d: "M40.7 16v6.4M46.3 17.6v5.6M51.9 19.8v4.6"}));
    const hint = el("span", {className: "lib-drag", "aria-hidden": "true"}, drawing, el("span", {className: "lib-drag-label"}, "Drag to rotate"));
    hint.addEventListener("transitionend", event => {
      if (event.propertyName === "opacity" && live.used) hint.classList.add("is-gone");
    });
    return hint;
  }

  function used() {
    // The visitor's first use of the drawn view on its page (liveHost's, viewNews's): the drag hint fades out
    // (library.css .lib-live.is-used) and stays hidden there, Exploded | Assembled, a pitch, a shape or a tip included,
    // until another gripper's page or the window opened again (present()).
    if (live.used || !live.stage?.classList.contains("is-live")) return;
    live.used = true;
    live.host.classList.add("is-used");
  }

  function draw() {
    // The sensor of live.id drawn in its page's .lib-stage, which is-live then shows it (the picture hidden under it).
    const serial = (live.serial += 1);
    const {id, stage} = live;
    const variant = shown(id);
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
      // The showcase: its placed record in place of a variant and its part (docs/LIBRARY_VIEW.md "A placed sensor").
      if (variant.view.placed) return live.view.show({base: BASE, id, placed: variant.view.placed, mode: state.picture});
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
      // Turned (a drag's end, a key): a use of the view, a touch's too (liveHost).
      if (!live.used && live.view?.info().moved) used();
      setLive();
    }
  }

  function rest() {
    // The grid shown: nothing drawn (the view kept for the next sensor's page), its page forgotten (the window opened
    // again shows the drag hint again).
    live.serial += 1;
    live.id = null;
    live.stage = null;
    live.page = null;
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
    const variant = live.id ? shown(live.id) : null;
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
  // '', #showcase (the showcase's card), #grippers and #gripper-<part> (a gripper's card), #shelf-<part> (a shelved
  // part's: the UMI finger's): the grid; #<the showcase's id>: its page; #<variant>: its page; #<part> and #<family>:
  // its default variant's page (the address kept); anything else: the grid with a note.  The grid's addresses before 2026-11-06 still lead somewhere: #shelf-start ("Start here.") to the
  // grid's top, #shelf-<gripper> (its shelf, its tile's jump, its pages' back link) to its card, the address replaced by
  // the new one (no history entry).  A sensor's page opens in the window (2026-11-15) at its top with its title focused,
  // the grid where it was under it; leaving it for the grid by Back or Forward, or by closing the window opened by the
  // card of its gripper (the window's place holds the card: as the page's back link did), keeps the grid where it was
  // and focuses that card; otherwise (opened from outside, or another gripper's page reached by Back) the shelf's
  // address scrolls to the shelf, a card's to the card, in the middle of the window and focused.

  // The window (2026-11-15): its dialog, opened over the grid by raise() and closed by showGrid().
  const WINDOW = $("libWindow");

  function setNote(text) {
    $("libNote").textContent = text;
    $("libNote").hidden = !text;
  }

  function showGrid(target, traversed = false) {
    const back = state.view === "detail";
    state.view = "grid";
    document.title = PAGE_TITLE;
    rest();
    if (WINDOW.open) WINDOW.close();
    // Leaving a sensor's page opened from the grid, the grid where it was and the card that opened the page focused
    // when Back or Forward comes to the grid (traversed) or the place asked for holds that card (the window closed, as
    // its back link did); else the place asked for (the review of 2026-11-06: the back link of a page reached by Back
    // focused another card).
    if (back && state.fromGrid && (traversed || !target || target.contains(state.opener))) {
      window.scrollTo(0, state.gridY);
      state.opener?.focus({preventScroll: true});
    } else if (target?.matches(".lib-card")) {
      // The card focused is the grid's place now: Back or Forward to the grid focuses it again (the showcase's card is
      // no link: its Details).
      state.opener = target.querySelector(".lib-showcase-details") || target;
      target.scrollIntoView({block: "center"});
      state.opener.focus({preventScroll: true});
    } else if (target) {
      target.scrollIntoView({block: "start"});
    } else if (back) {
      window.scrollTo(0, 0);
    }
  }

  function opening() {
    // A sensor's page about to show in the window: opened from the grid, where the grid was is kept (closing the window
    // or Back comes back to it; the grid stays shown under the window, which does not move it).
    if (state.view === "grid") {
      state.gridY = window.scrollY;
      state.fromGrid = true;
    }
    state.view = "detail";
  }

  function raise() {
    // The page just drawn in the window: the window shown (once: a pitch, Back or Forward between two pages keeps it),
    // its content at its top, its title focused (for a screen reader; no ring), the grid where it was.  The width a scroll
    // bar takes (0 for an overlay one: a phone's, a Mac's, the checks' headless browser's) is measured first: the page
    // makes it up on its right while it cannot scroll (library.css --lib-bar), so the grid under the window keeps its
    // width and its place, and the backdrop dims the whole screen (the review of 2026-11-15: the bar's room kept by
    // scrollbar-gutter had stayed bright beside the backdrop, and 100vw, the page's gutter with it, had shrunk by it).
    if (!WINDOW.open) {
      ROOT.style.setProperty("--lib-bar", `${Math.max(0, window.innerWidth - ROOT.clientWidth)}px`);
      WINDOW.showModal();
    }
    $("libWindowBody").scrollTop = 0;
    $("libDetailTitle").focus({preventScroll: true});
  }

  function showDetail(id) {
    opening();
    // Each sensor's page opened (from a card, its address or Back) shows its card's view first: a UMI shelf's sensor's
    // Assembled (SHELF_VIEW; the review of 2026-11-16: from Exploded a shape's tapered end lay under the exploded layers,
    // the shapes alike again), a gripper's Exploded; its pitch, shape and tip controls keep the view chosen (renderDetail
    // alone).
    state.picture = isShelved(homeOf(id)) ? SHELF_VIEW : VIEWS[0][0];
    setNote("");
    renderDetail(id);
    raise();
  }

  function showShowcase() {
    // The showcase's page, opened as a sensor's is (the grid's place kept for closing it), with the view its card shows.
    opening();
    state.picture = SHOWCASE_VIEW;
    setNote("");
    renderShowcase();
    raise();
  }

  function closeWindow() {
    // The window's X, Escape (and Android's Back, a close request while it is open) and a press and release on its
    // backdrop (2026-11-15).  Opened from the grid of this visit: back over the window's entries to the grid's
    // (history.go; route() closes it there, the grid where it was, the card that opened it focused, and makes that
    // entry's address the grid's place of the window's sensor, state.place: its gripper's card, the UMI finger's shelf,
    // the showcase's card, as the page's back link's was), so no new entry: Back after it goes where it went before the
    // window opened (the review of 2026-11-15: a new entry here, with Android's Back a close request while the window is
    // open, had made each Back close it and the next open it again).  Opened at its own address (a shared link, a
    // reload): its entry replaced by that place, and route() as a link's hashchange would.  Neither jumps: the grid
    // stays where it is.  Once: a close on its way (its cancel and then its close event, say) asks no second.
    if (state.view !== "detail" || state.closing) return;
    if (state.depth > 0) {
      state.closing = state.place;
      history.go(-state.depth);
      return;
    }
    history.replaceState(null, "", `#${state.place}`);
    route();
  }

  function windowEvents() {
    // Escape (the dialog's cancel) closes it as the X does; a dialog closed by the browser itself (a cancel it does not
    // ask for, as a second Escape with no press between) closes as it would have.  The backdrop: a press that begins
    // and ends outside the window's box (the dialog is the target of both), never a drag begun inside it, as a turn of
    // the 3D view released over the backdrop, nor a double-click's second click (the review of 2026-11-15: a card
    // double-clicked where the backdrop then lies, beside the window or under it, had opened it and closed it at once).
    $("libClose").addEventListener("click", closeWindow);
    WINDOW.addEventListener("cancel", event => {
      event.preventDefault();
      closeWindow();
    });
    WINDOW.addEventListener("close", () => { if (!WINDOW.open && state.view === "detail") closeWindow(); });
    const outside = event => {
      const box = WINDOW.getBoundingClientRect();
      return event.target === WINDOW && (event.clientX < box.left || event.clientX >= box.right || event.clientY < box.top || event.clientY >= box.bottom);
    };
    let pressed = false;
    WINDOW.addEventListener("pointerdown", event => { pressed = outside(event); });
    WINDOW.addEventListener("click", event => {
      if (pressed && event.detail < 2 && outside(event)) closeWindow();
      pressed = false;
    });
  }

  function route() {
    // Nor at a hash web/forward.js is sending on to gen.html (./#rect over the open Library; its hashchange listener is
    // the page's first: the review of 2026-11-16): no note of an unknown sensor, no replaceState over that address.
    if (!state.index || document.documentElement.hasAttribute("data-forward")) return;
    opened();
    // An entry of the page's history it has been at (marked below) is Back's or Forward's; any other (a link, a typed
    // address, a window closed at its own address) is marked now, with this visit and its depth (state.depth): a
    // window's entry reached from the grid 1, from a window's entry of depth n n + 1, else 0 (the window opened at its
    // own address, or reached from such a window); the grid's 0.  An entry marked in another visit (before a reload)
    // has none.
    const mark = history.state;
    const traversed = mark?.library === true;
    const closing = state.closing;
    state.closing = null;
    let id = "";
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { id = location.hash.slice(1); }
    const {variants, parts} = state.index;
    const windowed = state.showcase?.id === id || [variants, parts, state.index.families || {}].some(kind => Object.hasOwn(kind, id));
    if (closing && !windowed) {
      // A close come back over the window's entries to the grid's: its address the window's place now, and the grid
      // shown as the page's back link showed it (closeWindow(); not as Back's: a window itself reached by Back, from a
      // place of the grid typed or linked over it, focuses its own card, not that place's).
      history.replaceState(mark, "", `#${closing}`);
      id = closing;
    }
    if (!windowed) state.depth = 0;
    else if (traversed) state.depth = mark.visit === VISIT ? mark.depth || 0 : 0;
    else state.depth = state.view === "grid" ? 1 : state.view === "detail" && state.depth > 0 ? state.depth + 1 : 0;
    if (!traversed) history.replaceState({library: true, visit: VISIT, depth: state.depth}, "");
    if (state.showcase?.id === id) { showShowcase(); return; }
    if (Object.hasOwn(variants, id)) { showDetail(id); return; }
    if (Object.hasOwn(parts, id)) { showDetail(parts[id].default); return; }
    if (Object.hasOwn(state.index.families || {}, id)) { showDetail(state.index.families[id].default); return; }
    // The grid's places (a family's part has none); the older addresses replaced by their place now.
    const places = new Set([...(state.showcase ? ["showcase"] : []), "grippers", ...shelvedParts().map(part => `shelf-${part}`), ...carded().map(part => `gripper-${part}`)]);
    let place = id;
    if (id === "shelf-start") place = "";
    else if (id.startsWith("shelf-") && carded().includes(id.slice(6))) place = `gripper-${id.slice(6)}`;
    if (place !== id) history.replaceState(history.state, "", place ? `#${place}` : location.pathname + location.search);
    const known = !place || places.has(place);
    setNote(known ? "" : `No sensor in the library is named ${id}.`);
    showGrid(place && known ? $(place) : null, traversed && !closing);
    // The note is above the grid, and "Start here." was the grid's first shelf: an unknown id, or #shelf-start, typed
    // while the grid is scrolled down shows the top at once (instant; the native jump has no element of that id to go to).
    if (!known || id === "shelf-start") window.scrollTo(0, 0);
  }

  async function start() {
    try {
      // showcase.json beside entries.json; a Library without it, or with another document there, has no showcase.
      const [index, showcase] = await Promise.all([json(`${BASE}entries.json`), json(`${BASE}showcase.json`).catch(() => null)]);
      state.index = index;
      state.showcase = Object.hasOwn(index.variants, showcase?.id) || Object.hasOwn(index.parts, showcase?.id) ? null : showcaseOf(showcase);
      renderGrid();
    } catch (error) {
      state.index = null;
      $("libGrid").hidden = true;
      $("libHero").hidden = false;
      opened();
      $("libStatus").textContent = `The library could not be loaded (${error.message}). Gen by Surface and Rectangular still work.`;
      return;
    }
    windowEvents();
    window.addEventListener("hashchange", route);
    route();
  }

  start();
})();
