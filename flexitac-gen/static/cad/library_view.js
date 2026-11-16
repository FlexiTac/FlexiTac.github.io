// The Library's 3D view of a sensor (docs/LIBRARY_VIEW.md; the user's request of 2026-11-05, "lib 点进去具体的每个夹爪的时候,
// 那个图也做成可以三维旋转的": each sensor's page in the Library a 3D view the visitor can turn).  library.js imports it on a
// sensor's page only and makes one for the page (one WebGL context), kept from one sensor's page to the next.  It draws
// the sensor with Gen by Surface's on-part figure (onpart.js createOnPartView: one renderer for that figure, this view and
// the Library's pictures) from the files the Library ships, with no engine and no request to the server's API: the fit
// (fits/<id>.json: the chart and proposal #1's placement), the part's STL, the generator's art of the sensor's two boards
// (art/<id>.json.gz: app.js's "fpc:board-art" in the Photo look, with the boards' outlines) and, for a gripper
// (variant.view.scene), its scene, the rules (scenes/scenes.json) and its bodies, which library_stage.js makes the whole
// gripper.  The stack is drape.js buildStack's, as main.js builds it.  At each home the drawing is moved by whole pixels
// to the middle of its pane by a lens shift (camera.setViewOffset), as the shots tool moves each picture's
// (tools/browser/library_shots.py centring()), so the view that replaces the picture shows the sensor where the picture
// did; the shots tool's own page (shoot) reads the drawing where the figure frames it and moves it itself.
// A placed sensor (docs/LIBRARY_VIEW.md "A placed sensor"; the Library's showcase, the user's request of 2026-11-12: the
// original, hand-designed FlexiTac pad, which no fit of the generator places) is drawn from a placed record instead of a
// variant's fit: show({base, id, placed, mode}), its face on the part given directly and its tails rolled round the part
// (drape.js placedStack); every sensor of entries.json is drawn as before.

import {createOnPartView} from "./onpart.js";
import {buildStack} from "./drape.js";
import {placedStack} from "./drape.js";
import {FOV_DEG, FRAME_MARGIN} from "./drape.js";
import {parseStl} from "./stl.js";
import {libraryStage} from "./library_stage.js";

// surface/mesh.py's UNIT_SCALES_MM (the fit's mesh unit to mm; a test keeps them equal).
const UNIT_SCALES_MM = {m: 1000, cm: 10, mm: 1, in: 25.4};
const SCENES = "scenes/scenes.json";
const ART_FORMAT = "flexitac-library-art/v1";

function file(path) {
  // A file of the site, relative to the Library's folder as entries.json and the scenes give them (the UMI finger's fit
  // and STL are Gen by Surface's, ../vendor/umi/): never an absolute address or another site's.
  if (typeof path !== "string" || !/^[\w.-]+(\/[\w.-]+)*$/.test(path)) throw new Error(`not a file of the site: ${path}`);
  return path;
}

async function fetched(url, kind) {
  const answer = await fetch(url);
  if (!answer.ok) throw new Error(`${url}: HTTP ${answer.status}`);
  if (kind === "json") return answer.json();
  const bytes = await answer.arrayBuffer();
  if (kind === "bytes") return bytes;
  // A .json.gz as GitHub Pages and app.py send it (gzip bytes, no Content-Encoding), or as a server that inflated it.
  const head = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  const stream = new Blob([bytes]).stream();
  const text = head[0] === 0x1f && head[1] === 0x8b ? stream.pipeThrough(new DecompressionStream("gzip")) : stream;
  return JSON.parse(await new Response(text).text());
}

function partLookOf(rules, partId, family) {
  // The look scenes.json's rules give a part without a scene (docs/LIBRARY_VIEW.md "The looks"): part_looks names it
  // by the part's id, else by its family's, as a look of the rules' looks or as the look itself; {look, smooth_deg
  // (the rules' part_smooth_deg, or null: flat facets), pad (the rules' part_pad: the assembled pad's tint, or null)},
  // or null (no rule: the part as Gen by Surface draws it).
  const named = rules?.part_looks?.[partId] ?? (family ? rules?.part_looks?.[family] : undefined);
  if (named === undefined) return null;
  const spec = typeof named === "string" ? rules.looks?.[named] : named;
  if (!spec) throw new Error(`the rules' part_looks names the look ${JSON.stringify(named)}, which is not a look of the rules`);
  return {look: spec, smooth_deg: typeof rules.part_smooth_deg === "number" ? rules.part_smooth_deg : null, pad: rules.part_pad || null};
}

function boxOf(positions, scale) {
  // The part's box in mm (main.js partBox's).
  const low = [Infinity, Infinity, Infinity]; const high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 1) {
    const axis = i % 3; const value = positions[i] * scale;
    if (value < low[axis]) low[axis] = value;
    if (value > high[axis]) high[axis] = value;
  }
  return [low, high];
}

/**
 * The view in `host` (its canvas fills it; hidden until drawn); throws without WebGL or DecompressionStream.  probe: the
 * page's checks (info() carries the times and the stage's numbers); shoot: the shots tool's (no lens shift, the stage
 * measures); onState(what): "lost" (the WebGL context: the page shows the picture), "restored" (draw the sensor again)
 * or "view" (turned, or back at its home).  Returns {show, setMode, reset, clear, info}.
 */
export function createLibraryView(host, {probe = false, shoot = false, onState = () => {}} = {}) {
  if (typeof DecompressionStream !== "function") throw new Error("this browser cannot read the sensor's art (no DecompressionStream)");
  let inner = null;
  const stage = libraryStage();
  const figure = createOnPartView(host, {
    onViewChange: () => { centre(); onState("view"); },
    onContext: restored => { offsets.clear(); current.drawn = false; onState(restored ? "restored" : "lost"); },
    stage: (internals, view) => { inner = internals; return stage(internals, view); }});
  // serial: the latest show or clear (a later one wins); drawn: the sensor shown, its id, scene and times; mode: the mode
  // asked for (kept while a sensor loads, set on the figure before it draws).
  const current = {serial: 0, drawn: false, id: null, build_id: null, gripper: false, ms: null, mode: "exploded"};
  // The drawing's move to the middle, per mode and drawing buffer ([dx, dy] device px), measured at each home.
  const offsets = new Map();
  // Turned, the lens widened to keep the drawing whole (fitLens), at every change of the camera (a drag, a key, a home).
  inner.controls.addEventListener("change", () => fitLens());
  // The files kept for the next sensor: the last part's STL (a pitch of the same part), the rules, the last scene's bodies.
  const cache = {part: null, rules: null, bodies: new Map()};

  function fitLens() {
    // Turned (a drag, the arrow keys), the drawing kept whole on the canvas (the verification of 2026-11-13: a third of a
    // turn round, the YAM's base and the Franka's fingertips left it, since a turn keeps the home's distance): the lens
    // widened just enough that every point the home frames (the stack's home, drape.js frameView's points) lies within
    // the frame's margin (FRAME_MARGIN) where the lens shift puts it; never narrower than FOV_DEG, and FOV_DEG at a home,
    // so the homes, their pictures and the shots tool's views are as they were.  The camera stays where it is (its lamp,
    // near and far, the edge bands as at the home's distance).
    const {camera, controls, view} = inner;
    const home = view.stack?.home?.[view.mode];
    let tan = Math.tan((FOV_DEG * Math.PI) / 360);
    if (home && view.moved) {
      const t = controls.target; const c = camera.position;
      const distance = Math.hypot(c.x - t.x, c.y - t.y, c.z - t.z);
      const d = [(c.x - t.x) / distance, (c.y - t.y) / distance, (c.z - t.z) / distance];
      // The camera's axes as three.js's lookAt makes them: right = up x d, up' = d x right.
      const u = [camera.up.x, camera.up.y, camera.up.z];
      let right = [u[1] * d[2] - u[2] * d[1], u[2] * d[0] - u[0] * d[2], u[0] * d[1] - u[1] * d[0]];
      const length = Math.hypot(...right);
      right = right.map(value => value / length);
      const up = [d[1] * right[2] - d[2] * right[1], d[2] * right[0] - d[0] * right[2], d[0] * right[1] - d[1] * right[0]];
      // The lens shift in the frame's halves (setViewOffset(W, H, -dx, -dy): the drawing dx px right, dy px down), and
      // each side's room: the margin less the shift toward it.
      const shift = camera.view?.enabled ? [(-2 * camera.view.offsetX) / camera.view.fullWidth, (-2 * camera.view.offsetY) / camera.view.fullHeight] : [0, 0];
      const m = 1 / FRAME_MARGIN;
      const room = {right: m - shift[0], left: m + shift[0], top: m + shift[1], bottom: m - shift[1]};
      if (length > 1e-9 && Math.min(room.right, room.left, room.top, room.bottom) > 0.05) {
        const {points} = home;
        for (let k = 0; k < points.length; k += 3) {
          const p = [points[k] - t.x, points[k + 1] - t.y, points[k + 2] - t.z];
          const depth = distance - (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]);
          if (!(depth > 0)) continue;
          const x = p[0] * right[0] + p[1] * right[1] + p[2] * right[2]; const y = p[0] * up[0] + p[1] * up[1] + p[2] * up[2];
          const across = (x > 0 ? x / room.right : -x / room.left) / camera.aspect; const high = y > 0 ? y / room.top : -y / room.bottom;
          tan = Math.max(tan, Math.max(across, high) / depth);
        }
      }
    }
    const fov = view.moved ? (360 / Math.PI) * Math.atan(tan) : FOV_DEG;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }
  function centre() {
    // At a home not yet measured (per mode and buffer): one render without the shift, one read of its alpha, the drawing's
    // box; then half each axis's difference of its margins, toward the larger (library_shots.py centring()), as a lens
    // shift kept while the view turns.  Turned, a mode or size not measured keeps the shift it has until its home.
    if (inner) fitLens();
    if (shoot || !current.drawn || !inner || inner.view.lost) return;
    const {camera, renderer, render, view} = inner;
    const gl = renderer.getContext();
    const W = gl.drawingBufferWidth; const H = gl.drawingBufferHeight;
    const key = `${view.mode}:${W}x${H}`;
    if (!offsets.has(key)) {
      if (view.moved) return;
      camera.clearViewOffset();
      render();
      const data = new Uint8Array(4 * W * H);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let [left, low, right, high] = [W, H, -1, -1];
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          if (!data[4 * (y * W + x) + 3]) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < low) low = y;
          if (y > high) high = y;
        }
      }
      // Rows bottom first (gl.readPixels): the top margin is above the highest drawn row.
      const margins = right < 0 ? [0, 0, 0, 0] : [left, H - 1 - high, W - 1 - right, low];
      offsets.set(key, [Math.floor((margins[2] - margins[0]) / 2), Math.floor((margins[3] - margins[1]) / 2)]);
    }
    const [dx, dy] = offsets.get(key);
    if (dx || dy) camera.setViewOffset(W, H, -dx, -dy, W, H);
    else camera.clearViewOffset();
    render();
  }
  // Measured again for a new size (after the figure's own observer: its buffer resized first).
  new ResizeObserver(() => centre()).observe(host);

  async function partPositions(url) {
    if (cache.part?.url !== url) cache.part = {url, positions: fetched(url, "bytes").then(bytes => parseStl(bytes).positions)};
    try {
      return await cache.part.positions;
    } catch (error) {
      if (cache.part?.url === url) cache.part = null;
      throw error;
    }
  }
  function rulesOf(base) {
    // scenes.json's rules, fetched once: the grippers' scenes are drawn by them, and they may give a part without a
    // scene its look (part_looks).
    if (!cache.rules) cache.rules = fetched(base + SCENES, "json").then(index => index.rules).catch(error => { cache.rules = null; throw error; });
    return cache.rules;
  }
  async function sceneOf(base, path) {
    // A gripper's scene with the rules and its bodies' positions (mm), the bodies kept for its next sensor.
    const [data, rules] = await Promise.all([fetched(base + file(path), "json"), rulesOf(base)]);
    const paths = [...new Set(data.bodies.map(body => file(body.mesh)))];
    const loaded = await Promise.all(paths.map(name => (cache.bodies.has(name) ? cache.bodies.get(name)
      : fetched(base + name, "bytes").then(bytes => parseStl(bytes).positions))));
    cache.bodies = new Map(paths.map((name, k) => [name, loaded[k]]));
    return {data, rules, meshes: Object.fromEntries(cache.bodies)};
  }

  /**
   * Draw sensor `id` (variant and part: entries.json's; base: the Library's folder) in `mode`: resolves true once drawn
   * at its home, false when a later show or clear came first; rejects when a file does not load or the boards cannot be
   * laid on the fit's surface (the page keeps the picture).  placed: a placed record (drape.js PLACED_FORMAT) in place
   * of variant and part: its art (of its sensor, of no build), its mesh and its scene, if any, are its own paths
   * (relative to base, as a variant's), and its face and wrap lay the boards (placedStack).
   */
  async function show({base, id, variant, part, mode = current.mode, placed = null}) {
    const serial = (current.serial += 1);
    current.mode = mode === "assembled" ? "assembled" : "exploded";
    current.drawn = false;
    const started = performance.now();
    const scenePath = (placed ? placed.scene : variant.view?.scene) || null;
    const build = placed ? null : variant.build_id;
    // (The rules' look of a part without a scene is by the part's id or family: a placed record names no part, so its
    // mesh without a scene is drawn as Gen by Surface draws it; with a scene, in the scene's part_look.)
    const [fit, positions, art, given, rules] = await Promise.all([placed ? null : fetched(base + file(variant.fit), "json"),
      partPositions(base + file(placed ? placed.mesh.file : part.mesh.file)),
      fetched(base + file(placed ? placed.art : variant.view.art), "gzip"), scenePath ? sceneOf(base, scenePath) : null,
      scenePath || placed ? null : rulesOf(base)]);
    if (serial !== current.serial) return false;
    if (art.format !== ART_FORMAT || art.id !== (placed ? placed.sensor : id) || art.build_id !== build) throw new Error(`the art of ${art.id} (${art.build_id}) is not this sensor's`);
    const proposal = placed ? null : fit.reply?.proposals?.[0];
    if (!placed && proposal?.build_id !== build) throw new Error("the fit's proposal is not this sensor's build");
    if (given && (placed ? given.data.part_mesh_sha256 !== placed.mesh.sha256 : given.data.part !== variant.part)) throw new Error(`the scene of ${given.data.part} is not this sensor's part`);
    const scale = UNIT_SCALES_MM[placed ? placed.mesh.unit : fit.reply.mesh.unit];
    // (A fit's unit is the server's own; a placed record is written by hand, and a unit this page does not know would be
    // drawn as millimetres.)
    if (placed && !(scale > 0)) throw new Error(`the placed record's mesh unit ${placed.mesh.unit} is not one of ${Object.keys(UNIT_SCALES_MM).join(", ")}`);
    const boards = {row: {outline: art.boards.row.outline}, column: {outline: art.boards.column.outline}};
    const laid = {vertices: {positions, scale}, arts: art, boards, partBox: boxOf(positions, scale)};
    const stack = placed ? placedStack({placed, ...laid}) : buildStack({selection: fit.reply.selection, placement: proposal.placement, ...laid});
    if (!stack) throw new Error(placed ? "the boards could not be laid on the placed record's face" : "the boards could not be laid on the fit's surface");
    const loaded = performance.now();
    // Each sensor opens at its home, in the mode asked for (or chosen since).
    inner.view.moved = false;
    if (figure.info().mode !== current.mode) figure.setMode(current.mode);
    const scene = given && {data: given.data, meshes: given.meshes, rules: given.rules, measure: shoot};
    const shown = await figure.show({stack, positions, scene, partLook: given || placed ? null : partLookOf(rules, variant.part, part.family)});
    if (!shown || serial !== current.serial) return false;
    Object.assign(current, {drawn: true, id, build_id: build, gripper: Boolean(given),
      ms: {load: Math.round(loaded - started), draw: Math.round(performance.now() - loaded)}});
    offsets.clear();
    centre();
    return true;
  }
  function setMode(mode) {
    current.mode = mode === "assembled" ? "assembled" : "exploded";
    figure.setMode(current.mode);
    centre();
  }
  function reset() {
    figure.reset();
    centre();
  }
  function clear() {
    // Nothing drawn (the page left for the grid): the drawing, its gripper and the part taken down.
    current.serial += 1;
    current.drawn = false;
    offsets.clear();
    inner.camera.clearViewOffset();
    figure.clear({part: true});
  }
  function info() {
    // The probe state's view fields (docs/LIBRARY_VIEW.md): the sensor drawn, its mode and the mode drawn, turned or not,
    // a gripper or not, the move to the middle at this home and buffer (null: none, or not measured), the drawing buffer,
    // the times (load, draw: ms) and the stage's numbers (probe).
    const state = figure.info();
    const gl = inner.renderer.getContext();
    const offset = current.drawn && !shoot ? offsets.get(`${state.mode}:${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`) || null : null;
    return {id: current.drawn ? current.id : null, build_id: current.drawn ? current.build_id : null, mode: state.mode, drawn_mode: current.drawn ? state.drawnMode : null,
      moved: state.moved, gripper: current.drawn && current.gripper, offset, buffer: [inner.canvas.width, inner.canvas.height],
      ms: probe && current.drawn ? current.ms : null, stage: probe && current.drawn ? state.stage : null};
  }
  return {show, setMode, reset, clear, info};
}
