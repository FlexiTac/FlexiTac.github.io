// The Library's touch panel (the user's request of 2026-11-26: "在robo三维旋转图下方 ... 做一个robot finger的正视图，然后
// 显示你可以用鼠标来touch,同时并排放置heatmap图 ... 这个增加的visualization可以让人感知到sensor resolution不同之间的区别"):
// under a sensor's 3D view, two panes of one size and one scale, side by side: the finger's front view (its STL seen
// along the sensor's outward normal, tip up and tails down as the boards' frame has them, with the boards and their
// electrodes on it), which the visitor presses with the pointer (or the keys), and the sensor's readings as a heatmap
// (viridis, as FlexiTac's tools draw them), each taxel a cell where it lies.  The same press shown on every pitch of a
// gripper (the panes framed by the part's face, not the field, so a pitch changes only the sensor) shows what each
// resolution resolves.
//
// Everything comes from the files the Library already ships for the 3D view, with no engine: the fit (fits/<id>.json:
// the chart of the face, proposal #1's placement, its matrix and the boards' outlines in the chart), the part's STL and,
// for a gripper, its scene's part look.  The frames (docs/LIBRARY_VIEW.md; drape.js):
//   - the field frame (x, y) in mm: the matrix's field box, x along the base edge, y away from the tails, seen from
//     outside; mask row i is the field's row R - 1 - i, its spans 1-based columns; taxel (r, c) the box
//     [(c - 1) px, (c - 1) px + w] x [r py, r py + h] (every Library fit checked, 2026-11-26);
//   - the chart's uv: uv = F + x ex + y ey (field_origin_uv, field_x_uv, field_y_uv), on to the part barycentrically
//     (border.js uvToXyzNearest);
//   - the view: the least-squares plane of the chart's corners, P0 + U u + V v, its axes the field's (ex U + ey V,
//     orthonormalised; x times y is the outward normal on every Library part) and its depth along that normal.
// The contact: a ball of radius RHO pressed DEPTH into the surface under it: at a point at distance d from the ball's
// axis and height z the indentation is max(0, z + sqrt(RHO^2 - d^2) - top + DEPTH), top the first contact (the paper's
// indentation oracle on a flat face), each taxel's reading the mean over its crossing and a thin margin of soft skin.
import {parseStl} from "./stl.js";
import {uvToXyzNearest} from "./border.js";

const UNIT_SCALES_MM = {m: 1000, cm: 10, mm: 1, in: 25.4};
// matplotlib's viridis at eleven even stops, interpolated.
const VIRIDIS = ["#440154", "#482475", "#414487", "#355f8d", "#2a788e", "#21918c", "#22a884", "#44bf70", "#7ad151", "#bddf26", "#fde725"];
const LUT = (() => {
  const stops = VIRIDIS.map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)));
  return Array.from({length: 256}, (_, i) => {
    const t = (i / 255) * (stops.length - 1); const k = Math.min(stops.length - 2, Math.floor(t)); const f = t - k;
    const [r, g, b] = [0, 1, 2].map(j => Math.round(stops[k][j] + (stops[k + 1][j] - stops[k][j]) * f));
    return `rgb(${r},${g},${b})`;
  });
})();
// The ball: RHO_SHARE of the narrower side of the gripper's fields, within RHO_MM; pressed DEPTH_SHARE of RHO (a
// contact radius of 0.66 RHO), resting at REST_SHARE of that between presses; a reading of 1 at READING_SHARE of the
// full press, concave below it (to the power RESPONSE: a piezoresistive taxel is most sensitive to a light touch, and
// the rim of the contact stays apart from viridis' untouched purple); each taxel
// sampled SAMPLES x SAMPLES over its crossing and SKIN_MM round it; the cells GAP_SHARE of the pitch apart.
const RHO_SHARE = 0.18;
const RHO_MM = [3, 8];
const DEPTH_SHARE = 0.25;
const REST_SHARE = 0.6;
const READING_SHARE = 0.8;
const RESPONSE = 0.6;
const SAMPLES = 4;
const SKIN_MM = 0.3;
const GAP_SHARE = 0.14;
// The finger drawn at SUPERSAMPLE x SUPERSAMPLE samples a pixel.
const SUPERSAMPLE = 2;
// The panes: the box of the gripper's fields (every pitch's: a pitch changes only the sensor), MARGIN_SHARE of its
// larger side round it and the ball's radius at least; the press eased in PRESS_MS, out RELEASE_MS.
const MARGIN_SHARE = 0.08;
const PRESS_MS = 70;
const RELEASE_MS = 140;
// The look: the part as the 3D view has it (its scene's part look, else the rules' part_looks, else Gen by Surface's
// grey), the boards amber as the pictures', the row electrodes copper, the columns darker.
const PART_GREY = "#c7c7cc";
const BOARD = "#b4600c";
const ROW_COPPER = "#dd9238";
const COLUMN_COPPER = "#8f4a08";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scaled = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
function normalise(a) {
  const length = Math.hypot(a[0], a[1], a[2]);
  return length > 0 ? scaled(a, 1 / length) : a;
}
// The key light: from the upper left and the front, in the view's frame.
const LIGHT = normalise([-0.35, 0.5, 1]);

function file(path) {
  // A file of the site, relative to the Library's folder (library_view.js's rule: the UMI finger's are ../vendor/umi/).
  if (typeof path !== "string" || !/^[\w.-]+(\/[\w.-]+)*$/.test(path)) throw new Error(`not a file of the site: ${path}`);
  return path;
}

// The files and the parts' panes kept for the page's life: a pitch of the same part reuses its STL, its finger's
// drawing and the place of its press.
const cache = {files: new Map(), parts: new Map(), probes: new Map()};
function fetched(url, kind) {
  if (!cache.files.has(url)) {
    const load = fetch(url).then(answer => {
      if (!answer.ok) throw new Error(`${url}: HTTP ${answer.status}`);
      return kind === "json" ? answer.json() : answer.arrayBuffer().then(bytes => parseStl(bytes).positions);
    });
    load.catch(() => cache.files.delete(url));
    cache.files.set(url, load);
  }
  return cache.files.get(url);
}

function solve3(m, b) {
  // m x = b by Cramer's rule (the normal equations of the plane's fit: 3 x 3, well conditioned on a chart).
  const det = a => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det(m);
  return [0, 1, 2].map(i => det(m.map((row, r) => row.map((value, c) => (c === i ? b[r] : value)))) / d);
}

function viewOf(selection, placement, positions, scale) {
  // The view's frame: the least-squares plane of the chart's corners (xyz = P0 + U u + V v), its x and y the field's
  // axes on it, orthonormalised, z their cross product (outward).
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  selection.facets.forEach((facet, k) => {
    for (let j = 0; j < 3; j += 1) {
      const [u, v] = selection.facets_uv[k][j];
      const basis = [1, u, v];
      const p = [0, 1, 2].map(c => positions[9 * facet + 3 * j + c] * scale);
      for (let a = 0; a < 3; a += 1) {
        for (let c = 0; c < 3; c += 1) { S[a][c] += basis[a] * basis[c]; R[c][a] += basis[a] * p[c]; }
      }
    }
  });
  const coef = [0, 1, 2].map(c => solve3(S, R[c]));
  const P0 = coef.map(c => c[0]); const U = coef.map(c => c[1]); const V = coef.map(c => c[2]);
  const [ex, ey] = [placement.field_x_uv, placement.field_y_uv];
  const X = normalise([0, 1, 2].map(c => U[c] * ex[0] + V[c] * ex[1]));
  const Y0 = [0, 1, 2].map(c => U[c] * ey[0] + V[c] * ey[1]);
  const Y = normalise(sub(Y0, scaled(X, dot(Y0, X))));
  return {P0, X, Y, Z: cross(X, Y)};
}

function fingerOf(positions, scale, view, color) {
  // The part's facets in the view: each corner's (x, y, depth) and the facet's shade of the part's colour, both sides
  // (a facet wound inward faces the viewer from behind; the depth buffer keeps whatever is nearest), each lit as if it
  // faced the viewer (a key light from the upper left and the front).  Facets seen edge-on are left out.
  const base = [1, 3, 5].map(k => parseInt(color.slice(k, k + 2), 16));
  const count = positions.length / 9;
  const corners = new Float32Array(9 * count);
  const rgb = new Uint8Array(3 * count);
  let kept = 0;
  for (let f = 0; f < count; f += 1) {
    const p = [0, 3, 6].map(o => sub([positions[9 * f + o] * scale, positions[9 * f + o + 1] * scale, positions[9 * f + o + 2] * scale], view.P0));
    const n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
    const sign = dot(n, view.Z) < 0 ? -1 : 1;
    const facing = sign * dot(n, view.Z);
    const length = Math.hypot(n[0], n[1], n[2]);
    if (!(facing > 1e-6 * length)) continue;
    const lit = Math.max(0, (sign * (dot(n, view.X) * LIGHT[0] + dot(n, view.Y) * LIGHT[1]) + facing * LIGHT[2]) / length);
    const shade = 0.42 + 0.58 * lit;
    p.forEach((q, j) => { corners[9 * kept + 3 * j] = dot(q, view.X); corners[9 * kept + 3 * j + 1] = dot(q, view.Y); corners[9 * kept + 3 * j + 2] = dot(q, view.Z); });
    for (let c = 0; c < 3; c += 1) rgb[3 * kept + c] = Math.round(base[c] * shade);
    kept += 1;
  }
  return {corners: corners.subarray(0, 9 * kept), rgb: rgb.subarray(0, 3 * kept)};
}

function rasterise(finger, g, W, H) {
  // The finger at SUPERSAMPLE times the panes' pixels with a depth buffer (the nearest facet wins at each pixel's centre,
  // whatever the facets' order or winding), then filtered down: its picture, and its coverage as the heatmap's ground.
  const w = W * SUPERSAMPLE; const h = H * SUPERSAMPLE;
  const colour = new Uint8ClampedArray(4 * w * h); const ground = new Uint8ClampedArray(4 * w * h);
  const depth = new Float32Array(w * h).fill(-Infinity);
  const {corners, rgb} = finger;
  for (let t = 0; t < rgb.length / 3; t += 1) {
    const o = 9 * t;
    const [X0, Y0] = g.toPx(corners[o], corners[o + 1]); const [X1, Y1] = g.toPx(corners[o + 3], corners[o + 4]); const [X2, Y2] = g.toPx(corners[o + 6], corners[o + 7]);
    const x0 = X0 * SUPERSAMPLE; const y0 = Y0 * SUPERSAMPLE; const x1 = X1 * SUPERSAMPLE; const y1 = Y1 * SUPERSAMPLE; const x2 = X2 * SUPERSAMPLE; const y2 = Y2 * SUPERSAMPLE;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (!(Math.abs(area) > 1e-12)) continue;
    const left = Math.max(0, Math.floor(Math.min(x0, x1, x2))); const right = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
    const top = Math.max(0, Math.floor(Math.min(y0, y1, y2))); const bottom = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (left > right || top > bottom) continue;
    const z0 = corners[o + 2]; const z1 = corners[o + 5]; const z2 = corners[o + 8];
    const r = rgb[3 * t]; const gr = rgb[3 * t + 1]; const b = rgb[3 * t + 2];
    for (let y = top; y <= bottom; y += 1) {
      const py = y + 0.5;
      for (let x = left; x <= right; x += 1) {
        const px = x + 0.5;
        const a0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) / area;
        if (a0 < 0) continue;
        const a1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) / area;
        const a2 = 1 - a0 - a1;
        if (a1 < 0 || a2 < 0) continue;
        const z = a0 * z0 + a1 * z1 + a2 * z2;
        const i = y * w + x;
        if (z <= depth[i]) continue;
        depth[i] = z;
        colour[4 * i] = r; colour[4 * i + 1] = gr; colour[4 * i + 2] = b; colour[4 * i + 3] = 255;
        ground[4 * i] = 227; ground[4 * i + 1] = 227; ground[4 * i + 2] = 232; ground[4 * i + 3] = 255;
      }
    }
  }
  const down = data => {
    const big = document.createElement("canvas");
    big.width = w; big.height = h;
    big.getContext("2d").putImageData(new ImageData(data, w, h), 0, 0);
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(big, 0, 0, W, H);
    return out;
  };
  return {finger: down(colour), ground: down(ground)};
}

function sensorOf(fit, positions, scale, view) {
  // The sensor in the view: each active taxel's centre (x, y, depth) and its field-to-view Jacobian (per mm of the
  // field's x and y), the face's outline and the boards' outlines, all projected.
  const {selection} = fit.reply;
  const proposal = fit.reply.proposals[0];
  const {placement} = proposal;
  const matrix = proposal.design.matrix;
  const F = placement.field_origin_uv; const ex = placement.field_x_uv; const ey = placement.field_y_uv;
  const toUv = (x, y) => [F[0] + x * ex[0] + y * ey[0], F[1] + x * ex[1] + y * ey[1]];
  const project = xyz => { const d = sub(xyz, view.P0); return [dot(d, view.X), dot(d, view.Y), dot(d, view.Z)]; };
  const onPart = uv => uvToXyzNearest(uv, selection.facets_uv, selection.facets, positions, scale)?.xyz ?? null;
  const at = uv => { const xyz = onPart(uv); return xyz ? project(xyz) : null; };
  const {rows, columns, pitch_x_mm: px, pitch_y_mm: py, taxel_width_mm: w, taxel_height_mm: h} = matrix;
  const taxels = [];
  for (let i = 0; i < rows; i += 1) {
    const [a, b] = Array.isArray(matrix.mask) ? matrix.mask[i] : [1, columns];
    const row = rows - 1 - i;
    for (let c = a; c <= b; c += 1) {
      const x = (c - 1) * px + w / 2; const y = row * py + h / 2;
      const centre = at(toUv(x, y)); const alongX = at(toUv(x + 1, y)); const alongY = at(toUv(x, y + 1));
      if (!centre || !alongX || !alongY) continue;
      taxels.push({row, column: c - 1, x: centre[0], y: centre[1], z: centre[2],
        jx: [alongX[0] - centre[0], alongX[1] - centre[1]], jy: [alongY[0] - centre[0], alongY[1] - centre[1]]});
    }
  }
  // (The fit's xyz are in mm whatever the file's unit: Unitree Dex1's file is in metres.)
  const outline = (selection.outline_xyz || []).map(p => project(p).slice(0, 2));
  const boards = ["column", "row"].map(key => (proposal.outlines_uv?.[key] || []).map(uv => at(uv)).filter(Boolean).map(p => p.slice(0, 2)));
  const xs = outline.map(p => p[0]); const ys = outline.map(p => p[1]);
  const face = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return {taxels, outline, boards, face, pitch: [px, py], cell: [w, h], rows, columns};
}

/**
 * The touch panel in `front` and `heat` (two boxes of one size; a canvas is put in each).  onUse(): the visitor's first
 * press; onDraw(info()): after each drawing (the page's ?probe read).  Returns {show, clear, info}.
 */
export function createTouchView(front, heat, {onUse = () => {}, onDraw = null} = {}) {
  const canvases = [front, heat].map(box => {
    const canvas = document.createElement("canvas");
    canvas.className = "lib-touch-canvas";
    box.prepend(canvas);
    return canvas;
  });
  // shown: the drawn sensor {id, part, kept (its part's view, finger and raster), sensor, box (the panes' frame in the
  // view, mm), rho, full}; probe: the press [x, y] in the view (mm); depth: the
  // press now (mm), target: where it goes; hover: the pointer over the front pane, unpressed; pressing: a pointer or key
  // down; used: the visitor has pressed.
  const state = {serial: 0, shown: null, probe: null, depth: 0, target: 0, hover: null, pressing: null, used: false, frame: 0, readings: null, size: [0, 0], ratio: 1};

  function geometry() {
    // The panes' transform: the gripper's box, centred, y up, the same in both panes.
    const {box} = state.shown;
    const [W, H] = state.size;
    const s = Math.min(W / (box[2] - box[0]), H / (box[3] - box[1]));
    const cx = (box[0] + box[2]) / 2; const cy = (box[1] + box[3]) / 2;
    return {s, toPx: (x, y) => [W / 2 + s * (x - cx), H / 2 - s * (y - cy)], toMm: (X, Y) => [cx + (X - W / 2) / s, cy - (Y - H / 2) / s]};
  }

  function readings() {
    // Each taxel's reading (0..1) for the ball at state.probe pressed state.depth.
    const {sensor, rho, full} = state.shown;
    const [qx, qy] = state.probe;
    const out = new Float32Array(sensor.taxels.length);
    if (!(state.depth > 1e-4)) return out;
    const [w, h] = sensor.cell;
    const reach = rho + Math.hypot(sensor.pitch[0], sensor.pitch[1]);
    const near = [];
    let top = -Infinity;
    let nearest = null;
    sensor.taxels.forEach((t, k) => {
      const dx = t.x - qx; const dy = t.y - qy;
      if (!nearest || dx * dx + dy * dy < nearest.d) nearest = {d: dx * dx + dy * dy, z: t.z};
      if (Math.abs(dx) > reach || Math.abs(dy) > reach) return;
      const samples = [];
      for (let a = 0; a < SAMPLES; a += 1) {
        for (let b = 0; b < SAMPLES; b += 1) {
          const ox = ((a + 0.5) / SAMPLES - 0.5) * (w + 2 * SKIN_MM); const oy = ((b + 0.5) / SAMPLES - 0.5) * (h + 2 * SKIN_MM);
          const x = t.x + t.jx[0] * ox + t.jy[0] * oy; const y = t.y + t.jx[1] * ox + t.jy[1] * oy;
          const d2 = (x - qx) ** 2 + (y - qy) ** 2;
          if (d2 >= rho * rho) { samples.push(null); continue; }
          const lift = t.z + Math.sqrt(rho * rho - d2);
          if (lift > top) top = lift;
          samples.push(lift);
        }
      }
      near.push([k, samples]);
    });
    // The face under the ball's axis meets it first when the ball is over the face between or beside the taxels.
    if (nearest && inside([qx, qy], sensor.outline) && nearest.z + rho > top) top = nearest.z + rho;
    for (const [k, samples] of near) {
      let sum = 0;
      for (const lift of samples) if (lift !== null) sum += Math.max(0, lift - top + state.depth);
      out[k] = Math.min(1, sum / samples.length / (READING_SHARE * full)) ** RESPONSE;
    }
    return out;
  }

  function fit(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.max(1, Math.round(canvas.clientWidth * ratio)); const H = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    return [W, H, ratio];
  }

  function partLayers(g) {
    // The finger's picture and the heatmap's ground, once per part and size (kept with the part: its pitches share them).
    const key = state.size.join("x");
    const kept = state.shown.kept;
    if (kept.raster?.key !== key) kept.raster = {key, ...rasterise(kept.finger, g, state.size[0], state.size[1])};
    return kept.raster;
  }

  function fingerLayer(g) {
    // The finger with the boards and their electrodes on it, once per sensor and size (an offscreen canvas).
    const key = `${state.shown.id}:${state.size.join("x")}`;
    if (state.shown.layer?.key === key) return state.shown.layer.canvas;
    const [W, H] = state.size;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(partLayers(g).finger, 0, 0);
    const {sensor} = state.shown;
    const path = list => { ctx.beginPath(); list.forEach((p, k) => { const [x, y] = g.toPx(p[0], p[1]); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.closePath(); };
    ctx.save();
    if (sensor.outline.length > 2) { path(sensor.outline); ctx.clip(); }
    ctx.fillStyle = BOARD;
    sensor.boards.forEach(list => { if (list.length > 2) { path(list); ctx.fill(); } });
    // The electrodes: the columns' strips under the rows', each strip a cell's pitch long along it, so they run on
    // through the gaps between the crossings.
    const [px, py] = sensor.pitch; const [w, h] = sensor.cell;
    const quad = (t, x0, x1, y0, y1) => {
      const p = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([ox, oy]) => g.toPx(t.x + t.jx[0] * ox + t.jy[0] * oy, t.y + t.jx[1] * ox + t.jy[1] * oy));
      ctx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach(q => ctx.lineTo(q[0], q[1])); ctx.closePath();
    };
    const span = (list, key) => list.reduce((range, t) => [Math.min(range[0], t[key]), Math.max(range[1], t[key])], [Infinity, -Infinity]);
    const byColumn = new Map(); const byRow = new Map();
    sensor.taxels.forEach(t => {
      if (!byColumn.has(t.column)) byColumn.set(t.column, []);
      if (!byRow.has(t.row)) byRow.set(t.row, []);
      byColumn.get(t.column).push(t); byRow.get(t.row).push(t);
    });
    ctx.fillStyle = COLUMN_COPPER;
    ctx.beginPath();
    byColumn.forEach(list => {
      const [lo, hi] = span(list, "row");
      list.forEach(t => quad(t, -w / 2, w / 2, t.row === lo ? -h / 2 : -py / 2, t.row === hi ? h / 2 : py / 2));
    });
    ctx.fill();
    ctx.fillStyle = ROW_COPPER;
    ctx.beginPath();
    byRow.forEach(list => {
      const [lo, hi] = span(list, "column");
      list.forEach(t => quad(t, t.column === lo ? -w / 2 : -px / 2, t.column === hi ? w / 2 : px / 2, -h / 2, h / 2));
    });
    ctx.fill();
    ctx.restore();
    state.shown.layer = {key, canvas};
    return canvas;
  }

  function contactRadius() {
    const {rho} = state.shown; const d = state.depth;
    return d > 0 ? Math.sqrt(Math.max(0, 2 * rho * d - d * d)) : 0;
  }

  function render() {
    state.frame = 0;
    if (!state.shown) return;
    const [W, H, ratio] = fit(canvases[0]);
    fit(canvases[1]);
    state.size = [W, H]; state.ratio = ratio;
    const g = geometry();
    const {rho, sensor} = state.shown;
    // The front pane: the finger and sensor, the ball where it presses (or would, under the pointer).
    const ctx = canvases[0].getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(fingerLayer(g), 0, 0);
    const ball = (x, y, ghost) => {
      const [X, Y] = g.toPx(x, y); const R = rho * g.s;
      if (ghost) {
        ctx.setLineDash([4 * ratio, 4 * ratio]); ctx.lineWidth = 1.25 * ratio; ctx.strokeStyle = "rgba(29,29,31,.55)";
        ctx.beginPath(); ctx.arc(X, Y, R, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
        return;
      }
      const shine = ctx.createRadialGradient(X - 0.35 * R, Y - 0.4 * R, 0.05 * R, X, Y, R);
      shine.addColorStop(0, "rgba(255,255,255,.92)"); shine.addColorStop(0.55, "rgba(236,236,240,.55)"); shine.addColorStop(1, "rgba(190,190,198,.5)");
      ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(X, Y, R, 0, 2 * Math.PI); ctx.fill();
      ctx.lineWidth = ratio; ctx.strokeStyle = "rgba(29,29,31,.45)"; ctx.stroke();
      const a = contactRadius() * g.s;
      if (a > 0.5) {
        ctx.lineWidth = 1.5 * ratio; ctx.strokeStyle = "rgba(29,29,31,.7)";
        ctx.beginPath(); ctx.arc(X, Y, a, 0, 2 * Math.PI); ctx.stroke();
      }
    };
    if (state.probe) ball(state.probe[0], state.probe[1], false);
    if (state.hover && !state.pressing) ball(state.hover[0], state.hover[1], true);
    // The heatmap pane: the finger faint, each taxel's cell in its reading's colour, the true contact as a ring.
    const heatCtx = canvases[1].getContext("2d");
    heatCtx.clearRect(0, 0, W, H);
    heatCtx.drawImage(partLayers(g).ground, 0, 0);
    state.readings = readings();
    const [px, py] = sensor.pitch;
    const gx = px * (1 - GAP_SHARE) / 2; const gy = py * (1 - GAP_SHARE) / 2;
    sensor.taxels.forEach((t, k) => {
      const p = [[-gx, -gy], [gx, -gy], [gx, gy], [-gx, gy]].map(([ox, oy]) => g.toPx(t.x + t.jx[0] * ox + t.jy[0] * oy, t.y + t.jx[1] * ox + t.jy[1] * oy));
      heatCtx.fillStyle = LUT[Math.round(255 * state.readings[k])];
      heatCtx.beginPath(); heatCtx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach(q => heatCtx.lineTo(q[0], q[1])); heatCtx.closePath(); heatCtx.fill();
    });
    const a = contactRadius() * g.s;
    if (state.probe && a > 0.5) {
      const [X, Y] = g.toPx(state.probe[0], state.probe[1]);
      heatCtx.lineWidth = 1.25 * ratio; heatCtx.strokeStyle = "rgba(255,255,255,.8)";
      heatCtx.beginPath(); heatCtx.arc(X, Y, a, 0, 2 * Math.PI); heatCtx.stroke();
    }
    onDraw?.(info());
  }

  function schedule() {
    if (!state.frame) state.frame = requestAnimationFrame(step);
  }
  let last = 0;
  function step(now) {
    // The press eased toward its target (in PRESS_MS, out RELEASE_MS); drawn each frame until it is there.
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const tau = state.target > state.depth ? PRESS_MS : RELEASE_MS;
    state.depth += (state.target - state.depth) * (1 - Math.exp(-dt / tau));
    if (Math.abs(state.target - state.depth) < 1e-3 * (state.shown?.full || 1)) state.depth = state.target;
    render();
    if (state.depth !== state.target) state.frame = requestAnimationFrame(step);
    else last = 0;
  }

  function press(on) {
    if (!state.shown) return;
    state.target = on ? state.shown.full : REST_SHARE * state.shown.full;
    if (on && !state.used) { state.used = true; onUse(); }
    schedule();
  }
  function moveTo(point) {
    if (!state.shown) return;
    const {box} = state.shown;
    state.probe = [Math.min(box[2], Math.max(box[0], point[0])), Math.min(box[3], Math.max(box[1], point[1]))];
    cache.probes.set(state.shown.part, state.probe);
    schedule();
  }
  const pointerMm = event => {
    const box = canvases[0].getBoundingClientRect();
    return geometry().toMm((event.clientX - box.left) * state.ratio, (event.clientY - box.top) * state.ratio);
  };
  const target = front;
  target.addEventListener("pointerdown", event => {
    if (!state.shown || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    target.setPointerCapture?.(event.pointerId);
    state.pressing = event.pointerId;
    state.hover = null;
    moveTo(pointerMm(event));
    press(true);
  });
  target.addEventListener("pointermove", event => {
    if (!state.shown) return;
    if (state.pressing === event.pointerId) moveTo(pointerMm(event));
    else if (event.pointerType === "mouse") { state.hover = pointerMm(event); schedule(); }
  });
  const release = event => {
    if (state.pressing !== event.pointerId) return;
    state.pressing = null;
    press(false);
  };
  target.addEventListener("pointerup", release);
  target.addEventListener("pointercancel", release);
  target.addEventListener("pointerleave", () => { if (state.hover) { state.hover = null; schedule(); } });
  target.addEventListener("keydown", event => {
    if (!state.shown || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 5 : 1;
    const moves = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step]};
    if (moves[event.key]) {
      event.preventDefault();
      moveTo([state.probe[0] + moves[event.key][0], state.probe[1] + moves[event.key][1]]);
    } else if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      state.pressing = "key";
      press(true);
    }
  });
  target.addEventListener("keyup", event => {
    if ((event.key === " " || event.key === "Enter") && state.pressing === "key") { state.pressing = null; press(false); }
  });
  new ResizeObserver(() => { if (state.shown) render(); }).observe(front);

  /**
   * Draw sensor `id` (variant and part: entries.json's; siblings: the variants of its part, every pitch, for the panes'
   * frame; base: the Library's folder; scene: its gripper's scene path, if any; rules: scenes.json's path): resolves
   * true once drawn, false when a later show or clear came first; rejects when a file does not load.
   */
  async function show({base, id, variant, part, siblings = [variant], scene = null, rules = null}) {
    const serial = (state.serial += 1);
    const [fitData, positions, sceneData, rulesData] = await Promise.all([fetched(base + file(variant.fit), "json"), fetched(base + file(part.mesh.file), "stl"),
      scene ? fetched(base + file(scene), "json") : null, scene || !rules ? null : fetched(base + file(rules), "json")]);
    if (serial !== state.serial) return false;
    const proposal = fitData.reply?.proposals?.[0];
    if (proposal?.build_id !== variant.build_id) throw new Error("the fit's proposal is not this sensor's build");
    const scale = UNIT_SCALES_MM[fitData.reply.mesh.unit];
    let look = null;
    if (sceneData) look = sceneData.looks?.[sceneData.part_look]?.color ?? null;
    else if (rulesData) {
      const named = rulesData.rules?.part_looks?.[variant.part] ?? (part.family ? rulesData.rules?.part_looks?.[part.family] : undefined);
      look = (typeof named === "string" ? rulesData.rules?.looks?.[named] : named)?.color ?? null;
    }
    let kept = cache.parts.get(variant.part);
    if (!kept || kept.positions !== positions) {
      const view = viewOf(fitData.reply.selection, proposal.placement, positions, scale);
      kept = {positions, view, finger: fingerOf(positions, scale, view, /^#[0-9a-f]{6}$/i.test(look || "") ? look : PART_GREY)};
      cache.parts.set(variant.part, kept);
    }
    const sensor = sensorOf(fitData, positions, scale, kept.view);
    if (!sensor.taxels.length || sensor.outline.length < 3) throw new Error("the sensor could not be laid on the fit's face");
    if (!kept.frame) {
      // The gripper's frame: the union of its pitches' fields as they lie in the view (each taxel's cell), once; a
      // pitch whose fit does not load is left out of it.
      const fields = [fieldBox(sensor)];
      const others = await Promise.all(siblings.filter(other => other !== variant).map(other => fetched(base + file(other.fit), "json")
        .then(data => fieldBox(sensorOf(data, positions, scale, kept.view)), () => null)));
      if (serial !== state.serial) return false;
      const all = [...fields, ...others].filter(Boolean);
      const field = [Math.min(...all.map(b => b[0])), Math.min(...all.map(b => b[1])), Math.max(...all.map(b => b[2])), Math.max(...all.map(b => b[3]))];
      const rho = Math.min(RHO_MM[1], Math.max(RHO_MM[0], RHO_SHARE * Math.min(field[2] - field[0], field[3] - field[1])));
      const margin = Math.max(MARGIN_SHARE * Math.max(field[2] - field[0], field[3] - field[1]), rho);
      kept.frame = {rho, box: [field[0] - margin, field[1] - margin, field[2] + margin, field[3] + margin]};
    }
    const {rho, box} = kept.frame;
    state.shown = {id, part: variant.part, kept, sensor, box, rho, full: DEPTH_SHARE * rho};
    // The press of this part kept from its last pitch, else the field's middle, resting.
    const middle = sensor.taxels.reduce((sum, t) => [sum[0] + t.x / sensor.taxels.length, sum[1] + t.y / sensor.taxels.length], [0, 0]);
    state.probe = cache.probes.get(variant.part) || middle;
    state.pressing = null; state.hover = null;
    state.target = REST_SHARE * state.shown.full;
    state.depth = state.target;
    render();
    return true;
  }
  function clear() {
    state.serial += 1;
    state.shown = null;
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
  }
  function info() {
    // For the checks: the sensor drawn, its taxels, the press and how many taxels read more than 0.05.
    const lit = state.readings ? state.readings.reduce((n, value) => n + (value > 0.05), 0) : 0;
    return {id: state.shown?.id ?? null, taxels: state.shown?.sensor.taxels.length ?? 0, probe: state.probe, depth: state.depth, rho: state.shown?.rho ?? null,
      lit, peak: state.readings ? Math.max(0, ...state.readings) : 0, used: state.used};
  }
  return {show, clear, info};
}

function fieldBox(sensor) {
  // A sensor's field in the view: the box of its taxels' cells (a pitch round each centre, along the field's axes).
  const [px, py] = sensor.pitch;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const t of sensor.taxels) {
    for (const [ox, oy] of [[-px / 2, -py / 2], [px / 2, -py / 2], [px / 2, py / 2], [-px / 2, py / 2]]) {
      const x = t.x + t.jx[0] * ox + t.jy[0] * oy; const y = t.y + t.jx[1] * ox + t.jy[1] * oy;
      box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y);
    }
  }
  return box;
}

function inside(point, polygon) {
  const [x, y] = point;
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
