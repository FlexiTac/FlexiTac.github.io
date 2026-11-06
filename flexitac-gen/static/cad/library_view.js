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

import {createOnPartView} from "./onpart.js";
import {buildStack} from "./drape.js";
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
  // The files kept for the next sensor: the last part's STL (a pitch of the same part), the rules, the last scene's bodies.
  const cache = {part: null, rules: null, bodies: new Map()};

  function centre() {
    // At a home not yet measured (per mode and buffer): one render without the shift, one read of its alpha, the drawing's
    // box; then half each axis's difference of its margins, toward the larger (library_shots.py centring()), as a lens
    // shift kept while the view turns.  Turned, a mode or size not measured keeps the shift it has until its home.
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
  async function sceneOf(base, path) {
    // A gripper's scene with the rules and its bodies' positions (mm), the bodies kept for its next sensor.
    if (!cache.rules) cache.rules = fetched(base + SCENES, "json").then(index => index.rules).catch(error => { cache.rules = null; throw error; });
    const [data, rules] = await Promise.all([fetched(base + file(path), "json"), cache.rules]);
    const paths = [...new Set(data.bodies.map(body => file(body.mesh)))];
    const loaded = await Promise.all(paths.map(name => (cache.bodies.has(name) ? cache.bodies.get(name)
      : fetched(base + name, "bytes").then(bytes => parseStl(bytes).positions))));
    cache.bodies = new Map(paths.map((name, k) => [name, loaded[k]]));
    return {data, rules, meshes: Object.fromEntries(cache.bodies)};
  }

  /**
   * Draw sensor `id` (variant and part: entries.json's; base: the Library's folder) in `mode`: resolves true once drawn
   * at its home, false when a later show or clear came first; rejects when a file does not load or the boards cannot be
   * laid on the fit's surface (the page keeps the picture).
   */
  async function show({base, id, variant, part, mode = current.mode}) {
    const serial = (current.serial += 1);
    current.mode = mode === "assembled" ? "assembled" : "exploded";
    current.drawn = false;
    const started = performance.now();
    const scenePath = variant.view?.scene || null;
    const [fit, positions, art, given] = await Promise.all([fetched(base + file(variant.fit), "json"), partPositions(base + file(part.mesh.file)),
      fetched(base + file(variant.view.art), "gzip"), scenePath ? sceneOf(base, scenePath) : null]);
    if (serial !== current.serial) return false;
    if (art.format !== ART_FORMAT || art.id !== id || art.build_id !== variant.build_id) throw new Error(`the art of ${art.id} (${art.build_id}) is not this sensor's`);
    const proposal = fit.reply?.proposals?.[0];
    if (proposal?.build_id !== variant.build_id) throw new Error("the fit's proposal is not this sensor's build");
    if (given && given.data.part !== variant.part) throw new Error(`the scene of ${given.data.part} is not this sensor's part`);
    const scale = UNIT_SCALES_MM[fit.reply.mesh.unit];
    const boards = {row: {outline: art.boards.row.outline}, column: {outline: art.boards.column.outline}};
    const stack = buildStack({selection: fit.reply.selection, vertices: {positions, scale}, placement: proposal.placement, arts: art, boards,
      partBox: boxOf(positions, scale)});
    if (!stack) throw new Error("the boards could not be laid on the fit's surface");
    const loaded = performance.now();
    // Each sensor opens at its home, in the mode asked for (or chosen since).
    inner.view.moved = false;
    if (figure.info().mode !== current.mode) figure.setMode(current.mode);
    const scene = given && {data: given.data, meshes: given.meshes, rules: given.rules, measure: shoot};
    const shown = await figure.show({stack, positions, scene});
    if (!shown || serial !== current.serial) return false;
    Object.assign(current, {drawn: true, id, build_id: variant.build_id, gripper: Boolean(given),
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
