// The sensor on the part (the user's request of 2026-11-05): the geometry of the stacked card's right-hand figure in
// Gen by Surface, the part with the bottom FPC, the film and the top FPC on it, exploded outward along the sensor's
// normal.  web/cad/onpart.js draws what buildStack returns; main.js computes it from what the page already holds (no
// request of its own): the fit's chart (cad.fit.selection: the strain-limited disk's when limited, the chart the
// placement's uv refer to), the STL's corners, the placement's field frame and the build's board SVGs (app.js
// "fpc:board-art").
//
// Pure functions, as border.js: no DOM and no 3D library (main.js imports this module statically), the arguments are
// never changed, the same arguments give the same numbers.
//
// The frames, every length in mm:
//   - a board SVG's root units (sx, sy), after the server's Y flip (y down; engine/core.py _svg_for_board): its view
//     box, its taxel field R = data-active-region (Rx, Ry, Rw, Rh);
//   - the base frame (bx, by) of the placement (surface/fit.py BaseFrame): x along the base edge, y inward (away from
//     the tails), seen from outside; the field is [ox, ox + aw] x [oy, oy + ah], (ox, oy) = field_origin_base;
//   - the chart's uv: uv = F + (bx - ox) ex + (by - oy) ey (F = field_origin_uv, ex = field_x_uv, ey = field_y_uv), and
//     on to the part barycentrically on the chart's facets (border.js uvToXyz), as the map's overlay is;
//   - the figure's world frame: origin at the field's centre on the part, x the base frame's x, y its y (the tails down
//     on screen, as in the left figure), z the sensor's mean outward normal N.
// A board SVG to the base frame is surface/fit.py board_outlines_base: the bottom board (copper up, glued to the part)
// as drawn, bx = ox + (sx - Rx); the top board turned over about its tail axis (both tails are "bottom" in this mode),
// so mirrored, bx = ox + (Rx + Rw - sx); both by = oy + (Ry + Rh - sy).  Seen from outside the bottom board shows its
// copper side, the top board its polyimide (its copper faces the film).

import * as B from "./border.js";

// A board's sheet: a grid in its SVG's root units over the whole view box (the padding and the label band have no art:
// transparent), GRID_CELLS cells along its longer side, each GRID_MM in size at least and at most, and at most
// MAX_SHEET_VERTICES vertices; the film's grid as fine or finer, FILM_CELLS across the field's narrower side, over the
// field and FILM_MARGIN_MM round it.
export const GRID_CELLS = 150;
export const GRID_MM = [0.4, 2];
export const MAX_SHEET_VERTICES = 40000;
export const FILM_CELLS = 40;
export const FILM_MARGIN_MM = 0.5;
// The explode: each layer (bottom FPC 1, film 2, top FPC 3) EXPLODE_SHARE of the boards' narrower side further out than
// the one under it, clamped to EXPLODE_MM; and nested by NEST_SHARE of that side (NEST_MIN_MM at least) along the
// sheet's own normals, so the layers never meet where the surface turns away from N.  On a chart whose normals spread
// more than SPREAD_LIMIT_DEG from N a rigid shift would run the layers into the part: there each layer moves along its
// own normals instead, NORMAL_EXPLODE_SHARE of the gap at most and less where the outermost layer would stretch a cell
// of the field over a bend by more than NORMAL_STRETCH_LIMIT (or fold it, inside one); a tail round a tighter bend may
// stretch more (the soft finger's wrap of the checks bends its tails round the finger's end).
export const EXPLODE_SHARE = 0.55;
export const EXPLODE_MM = [2, 40];
export const NEST_SHARE = 0.005;
export const NEST_MIN_MM = 0.25;
export const SPREAD_LIMIT_DEG = 60;
export const NORMAL_EXPLODE_SHARE = 0.5;
export const NORMAL_STRETCH_LIMIT = 2;
// The camera as the figure opens: exploded, as the left figure opens (the user's decision of 2026-11-05, 初始角度和
// 左边的对齐): HOME_TILT_DEG off the stack's normal N and turned HOME_SPIN_DEG about it, the left figure's own two angles
// (app.js ORBIT_HOME, styles.css .assembly-camera's defaults: tests/test_surface_web.py reads all three as one).  The
// left figure lays the bottom FPC's SVG as drawn (x right, y down, the top FPC above it toward the viewer) and turns it
// rotateX(tilt) rotateZ(spin): in its axes (SVG x, SVG y, toward the viewer) the camera lies along (sin spin sin tilt,
// cos spin sin tilt, cos tilt) and the screen's up along (-sin spin cos tilt, -cos spin cos tilt, sin tilt).  Here the
// SVG's y is the world's -y (svgToBase: the bottom FPC seen from outside as drawn), so the camera lies along
// (sin spin sin tilt, -cos spin sin tilt, cos tilt) and the screen's up is N's own off the line of sight: the camera's up
// is HOME_UP (onpart.js; a drag then turns the stack about N and tilts it, as the left figure's, OrbitControls' polar
// angle the tilt and its azimuth the spin).  Assembled, the same spin, ASSEMBLED_TILT_DEG off N (the finished sensor's
// field seen nearly face-on, the part round it, 82 % of its face-on height): with the screen's up N's own the studio's
// key softbox no longer sweeps the top FPC (it had lain to its left), whose median sRGB the tilt alone lifts, 29.4 to 46
// degrees on the UMI finger (206, 115, 19 at 22 / -20 before): 198, 110, 4 at 29.4; 201, 111, 3 at 35; 204, 112, 3 at
// 42; 35 keeps red within 5 levels there (8 on the I2RT YAM's 1 mm sensor, 6 on the WidowX AI's 2 mm) and the field
// nearly face-on.  A FOV_DEG lens, framing the sheets' points (at most FRAME_POINTS of
// them) and the part's within PART_FRAME_SHARE of the sheets' radius of their centre (at most FRAME_POINTS of the part's
// corners looked at), with FRAME_MARGIN to spare (the lens's half-height that much larger than the farthest point
// needs: 6.5 % of the pane on each side of the axis that binds; 1.08 had left the tails' end 18 px off the pane, crowded
// for a picture the library's cards will reuse, the review of 2026-11-05): a finger or a gripper's tip whole (the crank's
// tip of the I2RT YAM recipe ran off the pane at 1.3, the review of 2026-11-05), a larger part cut where it reaches
// farther than that.
// Chosen among views of the default part (2026-11-05): 40 / 15, 40 / -35, 55 / 25, -30 / -50 (azimuth about the
// field's y, elevation toward the tails); then 50 / -25, from the tails' side of the stack as the left figure but from
// its other side in x (the explode up and to the left on screen), assembled 22 / -20 (29.4 degrees off N, since the
// look of 2026-11-05: its studio's key softbox sweeps the top FPC from there; 25 / -10 had left it 13 sRGB levels
// darker than the left figure's), the screen's up the world's y (which leaves the left figure's roll out of reach: 34
// degrees off it along the left's line of sight), until the user's decision above.
export const HOME_TILT_DEG = 57;
export const HOME_SPIN_DEG = -20;
export const ASSEMBLED_TILT_DEG = 35;
export const ASSEMBLED_SPIN_DEG = HOME_SPIN_DEG;
export const HOME_UP = [0, 0, 1];
export const FOV_DEG = 30;
export const FRAME_POINTS = 6000;
export const PART_FRAME_SHARE = 3;
export const FRAME_MARGIN = 1.15;
// surface/place.py DENSIFY_MM: the map's outlines are sampled this often (the checks compare with them).
export const DENSIFY_MM = 0.5;
// The checks' axes at the field's centre (centreProbes) span this share of the field's narrower side either side of it.
const CENTRE_STEP_SHARE = 0.05;
// Boundary facets thinner than this in uv (mm) do not carry the surface beyond it (a sliver's plane is ill-conditioned).
const SLIVER_MM = 1e-3;

const DEG = Math.PI / 180;
const r6 = number => Math.round(number * 1e6) / 1e6;
const pair = value => (Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))
  ? [Number(value[0]), Number(value[1])] : null);
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = a => Math.hypot(a[0], a[1], a[2]);
const unit3 = a => { const length = norm3(a); return length > 1e-12 ? scale3(a, 1 / length) : null; };
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// --------------------------------------------------------------------------
// Frames
// --------------------------------------------------------------------------

/**
 * The placement's field frame {O, F, ex, ey}: field_origin_base, field_origin_uv, field_x_uv and field_y_uv, or, where a
 * placement lacks the last three (only base_from_uv, base_inward_uv and field_origin_base are required), surface/fit.py
 * BaseFrame's axes rebuilt from base_inward_uv and base_angle_deg.  Null without them.
 */
export function fieldFrame(placement) {
  const p = placement || {};
  const O = pair(p.field_origin_base);
  if (!O) return null;
  let F = pair(p.field_origin_uv); let ex = pair(p.field_x_uv); let ey = pair(p.field_y_uv);
  if (!F || !ex || !ey) {
    const from = pair(p.base_from_uv); const inward = pair(p.base_inward_uv);
    if (!from || !inward) return null;
    const along = [inward[1], -inward[0]];
    const angle = (Number(p.base_angle_deg) || 0) * DEG; const c = Math.cos(angle); const s = Math.sin(angle);
    ex = [along[0] * c + inward[0] * s, along[1] * c + inward[1] * s];
    ey = [-along[0] * s + inward[0] * c, -along[1] * s + inward[1] * c];
    F = [from[0] + O[0] * ex[0] + O[1] * ey[0], from[1] + O[0] * ex[1] + O[1] * ey[1]];
  }
  return {O, F, ex, ey};
}

/** The chart's uv of a base-frame point. */
export function baseToUv(frame, [bx, by]) {
  const dx = bx - frame.O[0]; const dy = by - frame.O[1];
  return [frame.F[0] + dx * frame.ex[0] + dy * frame.ey[0], frame.F[1] + dx * frame.ex[1] + dy * frame.ey[1]];
}

/** The base-frame point of a chart uv (the inverse: ex and ey are orthonormal). */
export function uvToBase(frame, [u, v]) {
  const du = u - frame.F[0]; const dv = v - frame.F[1];
  return [frame.O[0] + du * frame.ex[0] + dv * frame.ex[1], frame.O[1] + du * frame.ey[0] + dv * frame.ey[1]];
}

/** Whether a board is the physical top one (turned over about its tail axis: mirrored as seen from outside). */
export const isTop = art => art?.physical_side === "top";

/** A board SVG's root point to the base frame (board_outlines_base). */
export function svgToBase(art, frame, [sx, sy]) {
  const [Rx, Ry, Rw, Rh] = art.region; const [ox, oy] = frame.O;
  const bx = isTop(art) ? ox + (Rx + Rw - sx) : ox + (sx - Rx);
  return [bx, oy + (Ry + Rh - sy)];
}

/** A base-frame point to a board SVG's root units (svgToBase's inverse). */
export function baseToSvg(art, frame, [bx, by]) {
  const [Rx, Ry, Rw, Rh] = art.region; const [ox, oy] = frame.O;
  const dx = bx - ox;
  return [isTop(art) ? Rx + Rw - dx : Rx + dx, Ry + Rh - (by - oy)];
}

/** The texture coordinate (s, t) of a board SVG's root point: its share of the view box, t up (three.js's flipY). */
export function texST(art, sx, sy) {
  const [vx, vy, vw, vh] = art.view_box;
  return [(sx - vx) / vw, 1 - (sy - vy) / vh];
}

/** A board's outline and cutouts (layout, Y up) in its SVG's root units: sy = flip - y, flip = min y + max y. */
export function outlineRings(board) {
  const points = board?.outline?.points;
  if (!Array.isArray(points) || points.length < 3) return null;
  let low = Infinity; let high = -Infinity;
  for (const point of points) { low = Math.min(low, point[1]); high = Math.max(high, point[1]); }
  const flip = low + high;
  const root = ring => ring.map(point => [Number(point[0]), flip - Number(point[1])]);
  return {outline: root(points), cutouts: (board.outline.cutouts || []).filter(ring => Array.isArray(ring) && ring.length > 2).map(root)};
}

function insideRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function insideOutline(rings, x, y) {
  return insideRing(rings.outline, x, y) && !rings.cutouts.some(ring => insideRing(ring, x, y));
}

// --------------------------------------------------------------------------
// The chart: uv to the part, and beyond it
// --------------------------------------------------------------------------

function closestOnSegment2(p, a, b) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2)) : 0;
  return [a[0] + t * dx, a[1] + t * dy];
}

/**
 * A map from the chart's uv to the part (STL mm): {xyz, on} on the facets (border.js uvToXyz, the map's barycentric
 * chart_point_to_3d), and beyond them (off the chart, in a hole, past a strain-limited disk) the point carried flat on
 * the plane of the facet of the boundary edge nearest it (the fit's advice for a board that leaves the surface: run it
 * straight off the edge), that facet's affine map in double precision; null without facets.  The boundary edges (used
 * by one facet) are found once and kept in a grid for the nearest one.
 */
export function chartMapper(selection, vertices) {
  const facetsUv = selection?.facets_uv; const facets = selection?.facets;
  if (!Array.isArray(facetsUv) || !Array.isArray(facets) || !facetsUv.length || facetsUv.length !== facets.length) return null;
  const positions = vertices.positions; const scale = Number(vertices.scale) || 1;
  const corner = (facet, k) => { const base = 9 * facet + 3 * k; return [positions[base] * scale, positions[base + 1] * scale, positions[base + 2] * scale]; };
  const key = p => `${p[0]},${p[1]}`;
  const uses = new Map();
  facetsUv.forEach((tri, k) => {
    for (let e = 0; e < 3; e += 1) {
      const a = key(tri[e]); const b = key(tri[(e + 1) % 3]);
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      const entry = uses.get(id);
      if (entry) entry.count += 1;
      else uses.set(id, {count: 1, k, e});
    }
  });
  const affine = new Map();
  const affineOf = k => {
    if (affine.has(k)) return affine.get(k);
    const [q0, q1, q2] = facetsUv[k]; const facet = facets[k];
    const P0 = corner(facet, 0); const P1 = corner(facet, 1); const P2 = corner(facet, 2);
    const d1 = [q1[0] - q0[0], q1[1] - q0[1]]; const d2 = [q2[0] - q0[0], q2[1] - q0[1]];
    const det = d1[0] * d2[1] - d1[1] * d2[0];
    const longest = Math.max(Math.hypot(...d1), Math.hypot(...d2), Math.hypot(q2[0] - q1[0], q2[1] - q1[1]));
    const map = Math.abs(det) / (longest || 1) > SLIVER_MM && [P0, P1, P2].every(p => p.every(Number.isFinite))
      ? {q0, P0, e1: sub3(P1, P0), e2: sub3(P2, P0), d1, d2, det} : null;
    affine.set(k, map);
    return map;
  };
  const edges = [];
  for (const {count, k, e} of uses.values()) {
    const tri = facetsUv[k];
    if (count === 1 && affineOf(k)) edges.push({a: tri[e], b: tri[(e + 1) % 3], k});
  }
  const index = edgeGrid(edges);
  const carry = (p, map) => {
    const dx = p[0] - map.q0[0]; const dy = p[1] - map.q0[1];
    const a = (dx * map.d2[1] - dy * map.d2[0]) / map.det; const b = (map.d1[0] * dy - map.d1[1] * dx) / map.det;
    return add3(map.P0, add3(scale3(map.e1, a), scale3(map.e2, b)));
  };
  const slots = new Map(facets.map((facet, k) => [facet, k]));
  return {
    facets: facetsUv.length, boundaryEdges: edges.length,
    /**
     * The outward unit normal of the facet holding uv (null off the chart), independent of the STL's winding: the
     * chart is oriented so that u x v is the outward normal, so the 3D cross product takes the sign of the uv area.
     */
    outward(uv) {
      const hit = B.uvToXyzNearest(uv, facetsUv, facets, vertices);
      if (!hit?.inside) return null;
      const k = slots.get(hit.facet); const [q0, q1, q2] = facetsUv[k];
      const P0 = corner(hit.facet, 0);
      const n = unit3(cross3(sub3(corner(hit.facet, 1), P0), sub3(corner(hit.facet, 2), P0)));
      const area = (q1[0] - q0[0]) * (q2[1] - q0[1]) - (q1[1] - q0[1]) * (q2[0] - q0[0]);
      return n && area ? scale3(n, Math.sign(area)) : null;
    },
    xyz(uv) {
      const on = B.uvToXyz(uv, facetsUv, facets, vertices);
      if (on) return {xyz: on, on: true};
      const edge = index.nearest(uv);
      const map = edge && affineOf(edge.k);
      return map ? {xyz: carry(uv, map), on: false} : null;
    },
  };
}

function edgeGrid(edges) {
  // The boundary edges in a uniform grid; nearest(p) searches rings of cells outward until no nearer edge can remain.
  if (!edges.length) return {nearest: () => null};
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const {a, b} of edges) {
    x0 = Math.min(x0, a[0], b[0]); y0 = Math.min(y0, a[1], b[1]); x1 = Math.max(x1, a[0], b[0]); y1 = Math.max(y1, a[1], b[1]);
  }
  const side = Math.max(1, Math.min(128, Math.ceil(Math.sqrt(edges.length))));
  const size = Math.max((x1 - x0) / side, (y1 - y0) / side, 1e-6);
  const nx = Math.max(1, Math.ceil((x1 - x0) / size)); const ny = Math.max(1, Math.ceil((y1 - y0) / size));
  const cells = new Map();
  const cellOf = (value, low, count) => Math.min(count - 1, Math.max(0, Math.floor((value - low) / size)));
  edges.forEach((edge, id) => {
    const i0 = cellOf(Math.min(edge.a[0], edge.b[0]), x0, nx); const i1 = cellOf(Math.max(edge.a[0], edge.b[0]), x0, nx);
    const j0 = cellOf(Math.min(edge.a[1], edge.b[1]), y0, ny); const j1 = cellOf(Math.max(edge.a[1], edge.b[1]), y0, ny);
    for (let j = j0; j <= j1; j += 1) for (let i = i0; i <= i1; i += 1) {
      const cell = j * nx + i;
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push(id);
    }
  });
  return {
    nearest(p) {
      const pi = Math.floor((p[0] - x0) / size); const pj = Math.floor((p[1] - y0) / size);
      // Rings beyond this one hold no cell of the grid.
      const reach = Math.max(Math.abs(pi), Math.abs(pi - (nx - 1)), Math.abs(pj), Math.abs(pj - (ny - 1)));
      let best = null; let bestDistance = Infinity;
      const seen = new Set();
      for (let ring = 0; ring <= reach; ring += 1) {
        for (let j = Math.max(0, pj - ring); j <= Math.min(ny - 1, pj + ring); j += 1) {
          for (let i = Math.max(0, pi - ring); i <= Math.min(nx - 1, pi + ring); i += 1) {
            if (Math.max(Math.abs(i - pi), Math.abs(j - pj)) !== ring) continue;
            for (const id of cells.get(j * nx + i) || []) {
              if (seen.has(id)) continue;
              seen.add(id);
              const q = closestOnSegment2(p, edges[id].a, edges[id].b);
              const distance = Math.hypot(p[0] - q[0], p[1] - q[1]);
              if (distance < bestDistance) { bestDistance = distance; best = edges[id]; }
            }
          }
        }
        // Every edge not yet seen lies in a cell of a farther ring: at least ``ring`` cells away.
        if (best && bestDistance <= ring * size) break;
      }
      return best;
    },
  };
}

// --------------------------------------------------------------------------
// The sheets
// --------------------------------------------------------------------------

function gridSize(width, height) {
  // The cell (mm): GRID_CELLS along the longer side within GRID_MM, coarser where the vertices would pass the cap.
  let h = Math.min(GRID_MM[1], Math.max(GRID_MM[0], Math.max(width, height) / GRID_CELLS));
  h = Math.max(h, Math.sqrt((width * height) / MAX_SHEET_VERTICES));
  return h;
}

/**
 * A grid sheet: vertices (i, j) at ``point(i, j)`` (a function giving {base, tex, inside}), ``nx`` x ``ny`` cells; a
 * cell is kept where one of its corners lies inside (or a neighbour's does: no thin part falls between them), its two
 * triangles wound counter-clockwise in the base frame (outward on the part: the base frame and the chart keep the
 * chart's handedness, u x v the outward normal), whatever way the grid runs.
 */
function gridSheet(nx, ny, point, mapper, frame, h) {
  const count = (nx + 1) * (ny + 1);
  const items = new Array(count);
  for (let j = 0; j <= ny; j += 1) for (let i = 0; i <= nx; i += 1) items[j * (nx + 1) + i] = point(i, j);
  const inside = items.map(item => item.inside);
  const cellIn = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny
    && (inside[j * (nx + 1) + i] || inside[j * (nx + 1) + i + 1] || inside[(j + 1) * (nx + 1) + i] || inside[(j + 1) * (nx + 1) + i + 1]);
  const kept = [];
  for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1) {
    let keep = false;
    for (let dj = -1; dj <= 1 && !keep; dj += 1) for (let di = -1; di <= 1 && !keep; di += 1) keep = cellIn(i + di, j + dj);
    if (keep) kept.push([i, j]);
  }
  // Only the vertices of kept cells are mapped.
  const slot = new Int32Array(count).fill(-1);
  const order = [];
  const use = index => { if (slot[index] < 0) { slot[index] = order.length; order.push(index); } return slot[index]; };
  const triangles = [];
  let flip = null;
  for (const [i, j] of kept) {
    const a = use(j * (nx + 1) + i); const b = use(j * (nx + 1) + i + 1); const c = use((j + 1) * (nx + 1) + i + 1); const d = use((j + 1) * (nx + 1) + i);
    if (flip === null) {
      const [pa, pb, pc] = [a, b, c].map(k => items[order[k]].base);
      flip = (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0]) < 0;
    }
    if (flip) triangles.push(a, c, b, a, d, c);
    else triangles.push(a, b, c, a, c, d);
  }
  const n = order.length;
  const q0 = new Float64Array(3 * n); const on = new Uint8Array(n); const uvs = new Float32Array(2 * n); const isIn = new Uint8Array(n);
  const base = new Float64Array(2 * n);
  for (let k = 0; k < n; k += 1) {
    const item = items[order[k]];
    const hit = mapper.xyz(baseToUv(frame, item.base));
    if (!hit) return null;
    q0.set(hit.xyz, 3 * k); on[k] = hit.on ? 1 : 0;
    uvs[2 * k] = item.tex[0]; uvs[2 * k + 1] = item.tex[1];
    base[2 * k] = item.base[0]; base[2 * k + 1] = item.base[1];
    isIn[k] = item.inside ? 1 : 0;
  }
  // Smooth normals: the area-weighted sum of the grid's own triangles at each vertex (they never tear at a crease).
  const normals = new Float64Array(3 * n);
  for (let t = 0; t < triangles.length; t += 3) {
    const [a, b, c] = [triangles[t], triangles[t + 1], triangles[t + 2]];
    const pa = [q0[3 * a], q0[3 * a + 1], q0[3 * a + 2]];
    const face = cross3(sub3([q0[3 * b], q0[3 * b + 1], q0[3 * b + 2]], pa), sub3([q0[3 * c], q0[3 * c + 1], q0[3 * c + 2]], pa));
    for (const v of [a, b, c]) for (let axis = 0; axis < 3; axis += 1) normals[3 * v + axis] += face[axis];
  }
  for (let k = 0; k < n; k += 1) {
    const length = Math.hypot(normals[3 * k], normals[3 * k + 1], normals[3 * k + 2]) || 1;
    for (let axis = 0; axis < 3; axis += 1) normals[3 * k + axis] /= length;
  }
  return {count: n, q0, normals, uvs, base, on, inside: isIn, index: Uint32Array.from(triangles), cell: h};
}

function boardSheet(art, board, frame, mapper) {
  const rings = outlineRings(board);
  if (!rings) return null;
  const [vx, vy, vw, vh] = art.view_box;
  const h = gridSize(vw, vh);
  const nx = Math.max(1, Math.ceil(vw / h)); const ny = Math.max(1, Math.ceil(vh / h));
  const sheet = gridSheet(nx, ny, (i, j) => {
    const sx = vx + (vw * i) / nx; const sy = vy + (vh * j) / ny;
    return {base: svgToBase(art, frame, [sx, sy]), tex: texST(art, sx, sy), inside: insideOutline(rings, sx, sy)};
  }, mapper, frame, Math.max(vw / nx, vh / ny));
  if (!sheet) return null;
  // The share of the outline's cells whose centre lies on the chart (the map's routing_on_surface, measured its way).
  let cells = 0; let onChart = 0;
  for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1) {
    const sx = vx + (vw * (i + 0.5)) / nx; const sy = vy + (vh * (j + 0.5)) / ny;
    if (!insideOutline(rings, sx, sy)) continue;
    cells += 1;
    if (mapper.xyz(baseToUv(frame, svgToBase(art, frame, [sx, sy])))?.on) onChart += 1;
  }
  // The cutouts in texture pixels (onpart.js punches them out of both sides' art).
  const cutouts = rings.cutouts.map(ring => ring.map(([sx, sy]) => [((sx - vx) / vw) * art.px[0], ((sy - vy) / vh) * art.px[1]]));
  return {...sheet, rings, cutouts, onSurface: cells ? onChart / cells : 0};
}

function filmPolygon(rowArt, frame) {
  // The velostat over the taxel field: the Row board's crossing region where the field is masked (or the diagonal bus
  // records one; surface/fill.py field_polygon), else its field rectangle, placed as the Row board is.
  const [Rx, Ry, Rw, Rh] = rowArt.region;
  const ring = Array.isArray(rowArt.active_outline) && rowArt.active_outline.length > 2 ? rowArt.active_outline
    : [[Rx, Ry], [Rx + Rw, Ry], [Rx + Rw, Ry + Rh], [Rx, Ry + Rh]];
  return ring.map(point => svgToBase(rowArt, frame, point));
}

function filmSheet(polygon, frame, mapper, h) {
  const [ox, oy] = frame.O;
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const [x, y] of polygon) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 = Math.min(x0, ox) - FILM_MARGIN_MM; y0 = Math.min(y0, oy) - FILM_MARGIN_MM; x1 += FILM_MARGIN_MM; y1 += FILM_MARGIN_MM;
  const step = Math.min(h, Math.min(x1 - x0, y1 - y0) / FILM_CELLS);
  const nx = Math.max(1, Math.ceil((x1 - x0) / step)); const ny = Math.max(1, Math.ceil((y1 - y0) / step));
  const ring = polygon;
  const sheet = gridSheet(nx, ny, (i, j) => {
    const bx = x0 + ((x1 - x0) * i) / nx; const by = y0 + ((y1 - y0) * j) / ny;
    return {base: [bx, by], tex: [(bx - x0) / (x1 - x0), (by - y0) / (y1 - y0)], inside: insideRing(ring, bx, by)};
  }, mapper, frame, Math.max((x1 - x0) / nx, (y1 - y0) / ny));
  return sheet && {...sheet, polygon, box: [x0, y0, x1, y1]};
}

// --------------------------------------------------------------------------
// The stack
// --------------------------------------------------------------------------

/**
 * The figure's geometry: {frame, world {c0, X, Y, N}, partMatrix (column-major 16: STL file units to world), gap_mm,
 * nest_mm, explode ("shift" | "normal"), spread_deg, normal_agrees, sheets {bottom, film, top}: each {layer, key (row |
 * column | film), art, positions (exploded) and assembled (Float32, world mm), normals, uvs, index, count, ...}, home
 * {exploded, assembled}: {target, r, rAll} (world), on_surface {row, column}}, or null when something is missing.
 * selection: cad.fit.selection; vertices: {positions, scale}; placement: the mapped build's; arts: the "fpc:board-art"
 * reply; boards: the build's boards (their outlines); partBox: the part's STL box in mm [[x0, y0, z0], [x1, y1, z1]].
 */
export function buildStack({selection, vertices, placement, arts, boards, partBox}) {
  const frame = fieldFrame(placement);
  const mapper = frame && chartMapper(selection, vertices);
  const keys = ["row", "column"];
  if (!mapper || !arts?.boards || !keys.every(key => arts.boards[key]?.region && arts.boards[key]?.view_box && boards?.[key])) return null;
  const topKey = keys.find(key => isTop(arts.boards[key])); const bottomKey = keys.find(key => !isTop(arts.boards[key]));
  if (!topKey || !bottomKey || topKey === bottomKey) return null;
  const sheets = {};
  for (const key of keys) {
    const sheet = boardSheet(arts.boards[key], boards[key], frame, mapper);
    if (!sheet) return null;
    sheets[key] = sheet;
  }
  const [ox, oy] = frame.O; const [, , aw, ah] = arts.boards.row.region;
  const film = filmSheet(filmPolygon(arts.boards.row, frame), frame, mapper, Math.min(sheets.row.cell, sheets.column.cell));
  if (!film) return null;
  // The world frame: N the area-weighted mean normal of the bottom sheet over the field; y the field's own y (from its
  // bottom edge's middle to its top edge's), made perpendicular to N; x = y x N, the base frame's x.
  const bottom = sheets[bottomKey];
  let sum = [0, 0, 0];
  for (let t = 0; t < bottom.index.length; t += 3) {
    const [a, b, c] = [bottom.index[t], bottom.index[t + 1], bottom.index[t + 2]];
    const cx = (bottom.base[2 * a] + bottom.base[2 * b] + bottom.base[2 * c]) / 3; const cy = (bottom.base[2 * a + 1] + bottom.base[2 * b + 1] + bottom.base[2 * c + 1]) / 3;
    if (cx < ox || cx > ox + aw || cy < oy || cy > oy + ah) continue;
    const p = k => [bottom.q0[3 * k], bottom.q0[3 * k + 1], bottom.q0[3 * k + 2]];
    sum = add3(sum, cross3(sub3(p(b), p(a)), sub3(p(c), p(a))));
  }
  const N = unit3(sum);
  const at = point => mapper.xyz(baseToUv(frame, point))?.xyz;
  const c0 = at([ox + aw / 2, oy + ah / 2]);
  const lowMid = at([ox + aw / 2, oy]); const highMid = at([ox + aw / 2, oy + ah]);
  if (!N || !c0 || !lowMid || !highMid) return null;
  const up = sub3(highMid, lowMid);
  let Y = unit3(sub3(up, scale3(N, dot3(up, N))));
  if (!Y) Y = unit3(Math.abs(N[0]) < 0.9 ? cross3(N, [1, 0, 0]) : cross3(N, [0, 1, 0]));
  const X = cross3(Y, N);
  const toWorld = q => { const d = sub3(q, c0); return [dot3(X, d), dot3(Y, d), dot3(N, d)]; };
  const rotate = v => [dot3(X, v), dot3(Y, v), dot3(N, v)];
  // The explode: W, the narrower side of both outlines' box in the base frame.
  let bx0 = Infinity; let by0 = Infinity; let bx1 = -Infinity; let by1 = -Infinity;
  for (const key of keys) {
    for (const point of sheets[key].rings.outline) {
      const [x, y] = svgToBase(arts.boards[key], frame, point);
      bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y);
    }
  }
  const W = Math.min(bx1 - bx0, by1 - by0);
  const gap = Math.min(EXPLODE_MM[1], Math.max(EXPLODE_MM[0], EXPLODE_SHARE * W));
  const nest = Math.max(NEST_MIN_MM, NEST_SHARE * W);
  // The spread of the bottom sheet's normals on the part (in its outline) from N.
  let spread = 0;
  for (let k = 0; k < bottom.count; k += 1) {
    if (!bottom.on[k] || !bottom.inside[k]) continue;
    const cosine = bottom.normals[3 * k] * N[0] + bottom.normals[3 * k + 1] * N[1] + bottom.normals[3 * k + 2] * N[2];
    spread = Math.max(spread, Math.acos(Math.max(-1, Math.min(1, cosine))) / DEG);
  }
  const explode = spread <= SPREAD_LIMIT_DEG ? "shift" : "normal";
  const inField = (sheet, k) => sheet.base[2 * k] >= ox && sheet.base[2 * k] <= ox + aw && sheet.base[2 * k + 1] >= oy && sheet.base[2 * k + 1] <= oy + ah;
  const step = explode === "shift" ? gap : normalStep([sheets[bottomKey], film, sheets[topKey]], nest, NORMAL_EXPLODE_SHARE * gap, inField);
  const layers = {[bottomKey]: 1, film: 2, [topKey]: 3};
  const out = {};
  for (const [key, sheet] of [[bottomKey, sheets[bottomKey]], ["film", film], [topKey, sheets[topKey]]]) {
    const layer = layers[key];
    const positions = new Float32Array(3 * sheet.count); const assembled = new Float32Array(3 * sheet.count); const normals = new Float32Array(3 * sheet.count);
    for (let k = 0; k < sheet.count; k += 1) {
      const q = [sheet.q0[3 * k], sheet.q0[3 * k + 1], sheet.q0[3 * k + 2]]; const n = [sheet.normals[3 * k], sheet.normals[3 * k + 1], sheet.normals[3 * k + 2]];
      const near = toWorld(add3(q, scale3(n, layer * nest)));
      const far = explode === "shift" ? add3(near, [0, 0, layer * gap]) : toWorld(add3(q, scale3(n, layer * (nest + step))));
      positions.set(far, 3 * k); assembled.set(near, 3 * k); normals.set(rotate(n), 3 * k);
    }
    out[layer === 2 ? "film" : layer === 1 ? "bottom" : "top"] = {...sheet, key, layer, art: key === "film" ? null : arts.boards[key], positions, assembled, normals};
  }
  // The part: STL file units to world, R (S p - c0), column-major.
  const s = Number(vertices.scale) || 1; const t = rotate(c0);
  const partMatrix = [X[0] * s, Y[0] * s, N[0] * s, 0, X[1] * s, Y[1] * s, N[1] * s, 0, X[2] * s, Y[2] * s, N[2] * s, 0, -t[0], -t[1], -t[2], 1];
  const home = {};
  const partPoints = sampledPart(vertices, toWorld);
  for (const mode of ["exploded", "assembled"]) home[mode] = framing(out, mode, partBox, toWorld, partPoints);
  return {frame, world: {c0, X, Y, N}, partMatrix, gap_mm: r6(step), nest_mm: r6(nest), explode, spread_deg: r6(spread),
    width_mm: r6(W),
    sheets: out, home, topKey, bottomKey, mapper, on_surface: {row: r6(sheets.row.onSurface), column: r6(sheets.column.onSurface)}};
}

function sampledPart(vertices, toWorld) {
  // At most FRAME_POINTS of the part's corners, in the world frame.
  const positions = vertices.positions; const scale = Number(vertices.scale) || 1;
  const corners = Math.floor(positions.length / 3);
  const step = Math.max(1, Math.ceil(corners / FRAME_POINTS));
  const out = [];
  for (let k = 0; k < corners; k += step) out.push(toWorld([positions[3 * k] * scale, positions[3 * k + 1] * scale, positions[3 * k + 2] * scale]));
  return out;
}

function normalStep(sheets, nest, most, inField) {
  // The gap per layer along the normals (at most ``most``) at which the outermost layer (3: nest and gap three times)
  // stretches no cell edge of the field (both ends in it, in an outline, on the part) by more than NORMAL_STRETCH_LIMIT,
  // nor shrinks or turns it past its inverse: bisected.
  const ok = gap => sheets.every(sheet => {
    const d = 3 * (nest + gap);
    for (let t = 0; t < sheet.index.length; t += 3) {
      for (let e = 0; e < 3; e += 1) {
        const a = sheet.index[t + e]; const b = sheet.index[t + ((e + 1) % 3)];
        if (!sheet.inside[a] || !sheet.inside[b] || !sheet.on[a] || !sheet.on[b] || !inField(sheet, a) || !inField(sheet, b)) continue;
        const edge = [0, 1, 2].map(axis => sheet.q0[3 * b + axis] - sheet.q0[3 * a + axis]);
        const moved = [0, 1, 2].map(axis => edge[axis] + d * (sheet.normals[3 * b + axis] - sheet.normals[3 * a + axis]));
        const length = norm3(edge); const ratio = norm3(moved) / (length || 1);
        if (length > 0 && (dot3(edge, moved) <= 0 || ratio > NORMAL_STRETCH_LIMIT || ratio < 1 / NORMAL_STRETCH_LIMIT)) return false;
      }
    }
    return true;
  });
  if (ok(most)) return most;
  let low = 0; let high = most;
  for (let k = 0; k < 20; k += 1) {
    const middle = (low + high) / 2;
    if (ok(middle)) low = middle;
    else high = middle;
  }
  return low;
}

function framing(sheets, mode, partBox, toWorld, partPoints = []) {
  // What the camera frames: the sheets' vertices inside their outlines (not the transparent view box), at most
  // FRAME_POINTS of them, and the part's points near them (PART_FRAME_SHARE of their radius from their centre: a large
  // part may leave the frame), world, flat; centre, the middle of the sheets' box; rAll, the farthest of the sheets'
  // points and of the part's box corners from it (the camera's near and far planes take in everything).
  const chosen = [];
  for (const sheet of Object.values(sheets)) for (let k = 0; k < sheet.count; k += 1) if (sheet.inside[k]) chosen.push([sheet, k]);
  if (!chosen.length) return null;
  const step = Math.max(1, Math.ceil(chosen.length / FRAME_POINTS));
  const points = new Float32Array(3 * Math.ceil(chosen.length / step));
  const low = [Infinity, Infinity, Infinity]; const high = [-Infinity, -Infinity, -Infinity];
  for (let n = 0, i = 0; i < chosen.length; i += step, n += 1) {
    const [sheet, k] = chosen[i];
    const array = mode === "assembled" ? sheet.assembled : sheet.positions;
    for (let axis = 0; axis < 3; axis += 1) {
      const value = array[3 * k + axis];
      points[3 * n + axis] = value;
      low[axis] = Math.min(low[axis], value); high[axis] = Math.max(high[axis], value);
    }
  }
  const centre = [0, 1, 2].map(axis => (low[axis] + high[axis]) / 2);
  const radius = Math.max(1, dist3(low, high) / 2);
  let rAll = radius;
  if (partBox) {
    for (let corner = 0; corner < 8; corner += 1) rAll = Math.max(rAll, dist3(toWorld([0, 1, 2].map(axis => partBox[(corner >> axis) & 1][axis])), centre));
  }
  const near = partPoints.filter(point => dist3(point, centre) <= PART_FRAME_SHARE * radius);
  const all = new Float32Array(points.length + 3 * near.length);
  all.set(points);
  near.forEach((point, k) => all.set(point, points.length + 3 * k));
  return {centre, points: all, rAll};
}

/**
 * The camera for a framing (framing above) seen along ``direction`` (world, unit, toward the camera) with screen-up
 * ``cameraUp``'s own off the line of sight (three.js's lookAt; HOME_UP, the camera's: the world's y until the user's
 * decision of 2026-11-05): {target, distance}, every point within the lens (FOV_DEG high, ``aspect`` wide) with
 * FRAME_MARGIN to spare.
 */
export function frameView(view, direction, aspect, cameraUp = HOME_UP) {
  const d = unit3(direction) || [0, 0, 1];
  // Looking along the up itself (a tilt of 0), any right will do: three.js's lookAt nudges the line of sight alike.
  let right = unit3(cross3(cameraUp, d));
  if (!right) right = unit3(cross3(Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], d));
  const up = cross3(d, right);
  const tanV = Math.tan((FOV_DEG * DEG) / 2) / FRAME_MARGIN; const tanH = tanV * aspect;
  // The nearest camera on the line of sight through (tx, ty) that has every point within the lens: a point (x, y, z) in
  // the camera's axes, seen from depth K along d, lies in it where |x - tx| <= (K - z) tanH, so the camera sits at
  // K = max over both axes of (max (x + z tanH) - min (x - z tanH)) / 2 tanH, and tx midway between those two (the
  // extremes then on the lens's edges of the axis that binds, the same margin on both sides: centred on the sheets'
  // box instead, the near end of the tails had come 18 px off the pane's bottom and the top FPC 31 px off its top, the
  // review of 2026-11-05).
  const {points} = view;
  let ax = -Infinity; let bx = Infinity; let ay = -Infinity; let by = Infinity; let z0 = Infinity; let z1 = -Infinity;
  for (let k = 0; k < points.length; k += 3) {
    const p = [points[k], points[k + 1], points[k + 2]];
    const x = dot3(p, right); const y = dot3(p, up); const z = dot3(p, d);
    ax = Math.max(ax, x + z * tanH); bx = Math.min(bx, x - z * tanH); ay = Math.max(ay, y + z * tanV); by = Math.min(by, y - z * tanV);
    z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  const depth = Math.max((ax - bx) / (2 * tanH), (ay - by) / (2 * tanV));
  const [tx, ty, tz] = [(ax + bx) / 2, (ay + by) / 2, (z0 + z1) / 2];
  return {target: add3(add3(scale3(right, tx), scale3(up, ty)), scale3(d, tz)), distance: Math.max(1, depth - tz)};
}

/**
 * The home direction of the camera in a mode (world, unit, toward the camera), the camera's up HOME_UP: exploded the
 * left figure's (HOME_TILT_DEG off N, turned HOME_SPIN_DEG about it), assembled ASSEMBLED_TILT_DEG and
 * ASSEMBLED_SPIN_DEG.
 */
export function homeDirection(mode = "exploded") {
  const assembled = mode === "assembled";
  const tilt = (assembled ? ASSEMBLED_TILT_DEG : HOME_TILT_DEG) * DEG; const spin = (assembled ? ASSEMBLED_SPIN_DEG : HOME_SPIN_DEG) * DEG;
  return [Math.sin(spin) * Math.sin(tilt), -Math.cos(spin) * Math.sin(tilt), Math.cos(tilt)];
}

// --------------------------------------------------------------------------
// Probes and metrics (the checks' view of the figure; main.js reports them in #cadState)
// --------------------------------------------------------------------------

/**
 * Where the map's taxels fall on each board's art: {row, column: [[s, t], ...]} in the order of map.taxels (texST of
 * the taxel's uv taken to the board's SVG), and each sheet's world point of the first taxel {bottom, top: [x, y, z]}
 * exploded and assembled, for a look at what is drawn there; and centre (centreProbes), for the camera's.
 */
export function probes(stack, taxels) {
  const out = {row: [], column: [], first: null, centre: centreProbes(stack)};
  const list = Array.isArray(taxels) ? taxels : [];
  for (const taxel of list) {
    const base = uvToBase(stack.frame, taxel.uv_mm);
    for (const key of ["row", "column"]) {
      const art = stack.sheets[key === stack.topKey ? "top" : "bottom"].art;
      const [sx, sy] = baseToSvg(art, stack.frame, base);
      out[key].push(texST(art, sx, sy));
    }
  }
  const taxel = list[0];
  const hit = taxel && stack.mapper.xyz(taxel.uv_mm);
  if (hit && Array.isArray(taxel.normal)) {
    const {c0, X, Y, N} = stack.world;
    const toWorld = q => { const d = sub3(q, c0); return [dot3(X, d), dot3(Y, d), dot3(N, d)]; };
    out.first = {};
    for (const [name, layer] of [["bottom", 1], ["top", 3]]) {
      const near = toWorld(add3(hit.xyz, scale3(taxel.normal, layer * stack.nest_mm)));
      out.first[name] = {
        assembled: near,
        // gap_mm is the step buildStack drew each layer by: the shift's, or along the normals the step normalStep chose
        // (NORMAL_EXPLODE_SHARE already in it; the review of 2026-11-05: it was applied twice here).
        exploded: stack.explode === "shift" ? add3(near, [0, 0, layer * stack.gap_mm])
          : toWorld(add3(hit.xyz, scale3(taxel.normal, layer * (stack.nest_mm + stack.gap_mm)))),
      };
    }
  }
  return out;
}

function centreProbes(stack) {
  // The field's centre as the figure draws it, for the checks' comparison with the left figure (cad_checks
  // on_part_aligned, the user's decision of 2026-11-05): {exploded, assembled}, each {centre, x0, x1, y0, y1, top}, world:
  // the bottom FPC's field centre, CENTRE_STEP_SHARE of the field's narrower side before and after it along its SVG's x
  // (the base frame's x) and its SVG's y (the base frame's -y: svgToBase), and the top FPC's field centre, each layered
  // as buildStack lays its sheet (along the facet's outward normal there); null off the chart.
  const {c0, X, Y, N} = stack.world;
  const toWorld = q => { const d = sub3(q, c0); return [dot3(X, d), dot3(Y, d), dot3(N, d)]; };
  const [ox, oy] = stack.frame.O; const [, , aw, ah] = stack.sheets.top.art.region;
  const [cx, cy] = [ox + aw / 2, oy + ah / 2]; const step = CENTRE_STEP_SHARE * Math.min(aw, ah);
  const layered = (base, layer) => {
    const uv = baseToUv(stack.frame, base);
    const hit = stack.mapper.xyz(uv);
    if (!hit) return null;
    const n = stack.mapper.outward(uv) || N;
    const near = toWorld(add3(hit.xyz, scale3(n, layer * stack.nest_mm)));
    return {assembled: near, exploded: stack.explode === "shift" ? add3(near, [0, 0, layer * stack.gap_mm])
      : toWorld(add3(hit.xyz, scale3(n, layer * (stack.nest_mm + stack.gap_mm))))};
  };
  const points = {centre: layered([cx, cy], 1), x0: layered([cx - step, cy], 1), x1: layered([cx + step, cy], 1),
    y0: layered([cx, cy + step], 1), y1: layered([cx, cy - step], 1), top: layered([cx, cy], 3)};
  if (Object.values(points).some(point => !point)) return null;
  const out = {};
  for (const mode of ["exploded", "assembled"]) out[mode] = Object.fromEntries(Object.entries(points).map(([name, point]) => [name, point[mode]]));
  return out;
}

function serverPolygon(board, points, origin, mirrored) {
  // surface/fit.py board_outlines_base and surface/fill.py field_polygon, operation for operation (the same doubles: the
  // map's samples below are then the server's own, whose number per edge a length of a whole number of steps decides).
  const grid = board.grid_registration.active_region;
  const out = points.map(([x, y]) => {
    let rx = x - grid.x; const ry = y - grid.y;
    if (mirrored) rx = grid.width - rx;
    return [rx + origin[0], ry + origin[1]];
  });
  if (mirrored) out.reverse();
  return out;
}

function serverField(boards, origin, rowMirrored) {
  // The map's overlay.field: the Row board's crossing region where it records one, else its field rectangle.
  const registration = boards.row.grid_registration;
  if (Array.isArray(registration.active_outline)) return serverPolygon(boards.row, registration.active_outline, origin, rowMirrored);
  const [x0, y0] = origin; const {width, height} = registration.active_region;
  return [[x0, y0], [x0 + width, y0], [x0 + width, y0 + height], [x0, y0 + height]];
}

function vertexDistance(a, b) {
  // The farthest vertex of either polygon from the other's nearest (base frame, mm).
  const far = (from, to) => Math.max(...from.map(p => Math.min(...to.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])))));
  return a.length && b.length ? Math.max(far(a, b), far(b, a)) : Infinity;
}

function densify(ring) {
  // surface/place.py map_polyline's samples of a closed polygon (every edge in steps of at most DENSIFY_MM; mesh.py
  // dist2's square root of the sum of squares).
  const points = [...ring, ring[0]];
  const out = [];
  for (let k = 0; k + 1 < points.length; k += 1) {
    const a = points[k]; const b = points[k + 1];
    const dx = b[0] - a[0]; const dy = b[1] - a[1];
    const steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / DENSIFY_MM));
    for (let s = 0; s < steps + (k === points.length - 2 ? 1 : 0); s += 1) out.push([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]);
  }
  return out;
}

function overlayError(samples, runs) {
  // The farthest point of the map's overlay runs from the nearest of the drape's samples on the chart (overlay to
  // drape: a point the server dropped, a one-point run, leaves nothing to compare).
  const points = (Array.isArray(runs) ? runs : []).flat().filter(point => Array.isArray(point) && point.length === 3);
  if (!points.length || !samples.length) return null;
  let worst = 0;
  for (const point of points) {
    let best = Infinity;
    for (const sample of samples) {
      const d = dist3(point, sample);
      if (d < best) { best = d; if (best < 1e-9) break; }
    }
    worst = Math.max(worst, best);
  }
  return r6(worst);
}

/**
 * How the drape agrees with the map (mm): outline_error_mm {row, column}, the larger of each sheet's outline (its SVG to
 * the base frame, as drawn) against the server's (surface/fit.py board_outlines_base) and of the map's overlay[row |
 * column] against the server's outline sampled as the map samples it and carried by the drape's chart; field_error_mm,
 * the same of the film's polygon and of each board's own field outline (each through its own mapping) against the
 * server's field and overlay.field; taxel_error_mm, the drape of each taxel's uv against its xyz_mm; normal_agrees,
 * whether N (the figure's z) is on the outer side of the map's taxels (their facets' normals summed); front_out, the share
 * of the sheets' triangles over the field (on the part) wound outward, against their facet's own outward normal
 * (chartMapper.outward: not the drape's winding rule); max_stretch, the longest 3D edge of a draped grid cell in
 * an outline over the cell's size (a tear, a fan beyond the surface); min_clearance_mm, the exploded bottom FPC's least
 * height over the part along its normal.  boards: the build's (their layout outlines and active regions).
 */
export function metrics(stack, map, boards) {
  const onSamples = ring => densify(ring).map(point => stack.mapper.xyz(baseToUv(stack.frame, point))).filter(hit => hit?.on).map(hit => hit.xyz);
  const origin = stack.frame.O;
  const outline_error_mm = {};
  for (const key of ["row", "column"]) {
    const sheet = stack.sheets[key === stack.topKey ? "top" : "bottom"];
    const server = serverPolygon(boards[key], boards[key].outline.points, origin, key === stack.topKey);
    const drawn = sheet.rings.outline.map(point => svgToBase(sheet.art, stack.frame, point));
    const sampled = overlayError(onSamples(server), map?.overlay?.[key]);
    outline_error_mm[key] = sampled === null ? null : r6(Math.max(vertexDistance(drawn, server), sampled));
  }
  const field = serverField(boards, origin, stack.topKey === "row");
  const fieldErrors = [overlayError(onSamples(field), map?.overlay?.field), vertexDistance(stack.sheets.film.polygon, field)];
  for (const name of ["top", "bottom"]) fieldErrors.push(vertexDistance(filmPolygon(stack.sheets[name].art, stack.frame), field));
  const field_error_mm = fieldErrors.some(value => value === null) ? null : Math.max(...fieldErrors);
  let taxel = 0; let taxels = 0; let normals = [0, 0, 0];
  for (const item of map?.taxels || []) {
    if (Array.isArray(item.normal)) normals = add3(normals, item.normal);
    const hit = stack.mapper.xyz(item.uv_mm);
    if (!hit || !Array.isArray(item.xyz_mm)) continue;
    taxel = Math.max(taxel, dist3(hit.xyz, item.xyz_mm)); taxels += 1;
  }
  // Over the field on the part, every sheet's triangles wound outward; the cells' edges.
  const [ox, oy] = stack.frame.O; const [, , aw, ah] = stack.sheets.top.art.region;
  let facing = 0; let total = 0; let stretch = 0;
  for (const sheet of Object.values(stack.sheets)) {
    const q = k => [sheet.q0[3 * k], sheet.q0[3 * k + 1], sheet.q0[3 * k + 2]];
    for (let t = 0; t < sheet.index.length; t += 3) {
      const [a, b, c] = [sheet.index[t], sheet.index[t + 1], sheet.index[t + 2]];
      if (sheet.inside[a] && sheet.inside[b] && sheet.inside[c]) {
        // The triangle's two grid edges on the part (its diagonal apart) against the cell.
        const edges = [dist3(q(a), q(b)), dist3(q(b), q(c)), dist3(q(c), q(a))].sort((x, y) => x - y);
        stretch = Math.max(stretch, edges[1] / sheet.cell);
      }
      const cx = (sheet.base[2 * a] + sheet.base[2 * b] + sheet.base[2 * c]) / 3; const cy = (sheet.base[2 * a + 1] + sheet.base[2 * b + 1] + sheet.base[2 * c + 1]) / 3;
      if (cx < ox || cx > ox + aw || cy < oy || cy > oy + ah || !sheet.on[a] || !sheet.on[b] || !sheet.on[c]) continue;
      const outward = stack.mapper.outward(baseToUv(stack.frame, [cx, cy]));
      if (!outward) continue;
      total += 1;
      if (dot3(cross3(sub3(q(b), q(a)), sub3(q(c), q(a))), outward) > 0) facing += 1;
    }
  }
  // The exploded bottom FPC over the part, along its own normal, where it lies on the chart in its outline.
  const bottom = stack.sheets.bottom; const {c0, X, Y, N} = stack.world;
  let clearance = Infinity;
  for (let k = 0; k < bottom.count; k += 1) {
    if (!bottom.on[k] || !bottom.inside[k]) continue;
    const world = [bottom.positions[3 * k], bottom.positions[3 * k + 1], bottom.positions[3 * k + 2]];
    const q = add3(c0, add3(add3(scale3(X, world[0]), scale3(Y, world[1])), scale3(N, world[2])));
    const lift = sub3(q, [bottom.q0[3 * k], bottom.q0[3 * k + 1], bottom.q0[3 * k + 2]]);
    clearance = Math.min(clearance, dot3(lift, rotateBack(stack.world, [bottom.normals[3 * k], bottom.normals[3 * k + 1], bottom.normals[3 * k + 2]])));
  }
  return {outline_error_mm, field_error_mm: field_error_mm === null ? null : r6(field_error_mm), taxel_error_mm: taxels ? r6(taxel) : null,
    normal_agrees: dot3(normals, stack.world.N) > 0, front_out: total ? r6(facing / total) : null, max_stretch: r6(stretch), min_clearance_mm: Number.isFinite(clearance) ? r6(clearance) : null};
}

function rotateBack({X, Y, N}, v) {
  // A world vector back to the STL frame.
  return add3(add3(scale3(X, v[0]), scale3(Y, v[1])), scale3(N, v[2]));
}
