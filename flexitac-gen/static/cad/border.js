// The border model of the CAD-mode border editor (claude/specs/cad-mode/BORDER-EDITOR-PLAN.md, section 6).
//
// A border is a simple counter-clockwise polygon [[u, v], ...] (at least 3 vertices, no repeated closing vertex)
// in the selection chart's uv, in millimetres: the frame of selection.outline_uv, holes_uv and sides[*].from_uv.
// Edge i runs from vertex i to vertex (i + 1) % n.  The taxels go where the border and the surface overlap; the
// border may reach beyond the surface (that part holds no taxel and is drawn hatched), and it never limits the
// routing.
//
// Pure functions: no DOM, no three.js (main.js imports this module), the arguments are never changed and every
// result is a new array.  Deterministic: the same arguments give the same numbers.  An edit that would not leave a
// valid border (see validate: simple, counter-clockwise, at least MIN_AREA_MM2, no edge under MIN_EDGE_MM)
// returns null, and so does an index out of range: the caller keeps the border it has.

/** The server's smallest border area (E_SURFACE_BORDER). */
export const MIN_AREA_MM2 = 1;
/** An edit leaving an edge shorter than this is refused (the edge would collapse). */
export const MIN_EDGE_MM = 1e-3;
/** surface/api.py SIDE_ANGLE_DEG: consecutive outline segments within this angle form one straight side. */
export const SIDE_ANGLE_DEG = 1;
/** snap's default angle tolerance: an angle within this of 90 degrees is made a right angle. */
export const RIGHT_ANGLE_DEG = 3;
/**
 * A corner turning less than this is soft (a bend, a step of a faceted arc): moveEdge moves the edge's end there with
 * the edge, and the neighbour turns about its other end, instead of extending the neighbour's line (which would meet
 * the moved edge far away, past the curve).
 */
export const SOFT_CORNER_DEG = 20;
/** createBorder merges outline corners closer than this (a flattened outline's slivers of a few nanometres). */
export const MERGE_MM = 0.01;

const TOUCH_MM = 1e-9;  // segments closer than this touch (a border whose edges touch is not simple)
const NEAR_MM = 1e-6;   // a uv point this close to a facet counts as on it
const DEG = Math.PI / 180;

// --------------------------------------------------------------------------
// Small helpers
// --------------------------------------------------------------------------

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const norm = a => Math.hypot(a[0], a[1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const finite = p => Number.isFinite(p[0]) && Number.isFinite(p[1]);
const mod = (x, m) => ((x % m) + m) % m;
const at = (poly, i) => poly[mod(i, poly.length)];
const toPoint = p => (Array.isArray(p) || ArrayBuffer.isView(p) ? [Number(p[0]), Number(p[1])] : [NaN, NaN]);
const toPoints = value => (Array.isArray(value) ? value.map(toPoint) : []);
const copy = poly => poly.map(p => [p[0], p[1]]);
const validIndex = (poly, i) => Number.isInteger(i) && i >= 0 && i < poly.length;

function dropRepeats(points, tol = TOUCH_MM) {
  const out = [];
  for (const p of points) if (!out.length || dist(out[out.length - 1], p) > tol) out.push(p);
  while (out.length > 1 && dist(out[0], out[out.length - 1]) <= tol) out.pop();
  return out;
}

/** The point of segment ab nearest p, and its parameter t in [0, 1] (the ends are returned exactly). */
function closestOnSegment(p, a, b) {
  const d = sub(b, a);
  const l2 = dot(d, d);
  const t = l2 > 0 ? dot(sub(p, a), d) / l2 : 0;
  if (!(t > 0)) return {point: [a[0], a[1]], t: 0};
  if (t >= 1) return {point: [b[0], b[1]], t: 1};
  return {point: [a[0] + t * d[0], a[1] + t * d[1]], t};
}

const segmentDistance = (p, a, b) => dist(p, closestOnSegment(p, a, b).point);

function segmentsTouch(a, b, c, d, tol) {
  const o1 = cross(sub(b, a), sub(c, a)); const o2 = cross(sub(b, a), sub(d, a));
  const o3 = cross(sub(d, c), sub(a, c)); const o4 = cross(sub(d, c), sub(b, c));
  if (((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0))) return true;
  return Math.min(segmentDistance(a, c, d), segmentDistance(b, c, d), segmentDistance(c, a, b), segmentDistance(d, a, b)) <= tol;
}

/** Whether the corner from direction u into direction v turns less than SOFT_CORNER_DEG (a zero direction: soft). */
function softCorner(u, v) {
  const lengths = norm(u) * norm(v);
  return !(lengths > 0) || dot(u, v) > Math.cos(SOFT_CORNER_DEG * DEG) * lengths;
}

/**
 * The point origin + s * direction where that line meets the line through `point` along d (null when parallel).
 */
function alongLine(origin, direction, point, d) {
  const den = cross(direction, d);
  if (!(Math.abs(den) > 1e-9 * norm(direction) * norm(d))) return null;
  const s = cross(sub(point, origin), d) / den;
  return [origin[0] + s * direction[0], origin[1] + s * direction[1]];
}

/** The rings of the surface (outline, then holes), cleaned; empty without an outline. */
function regionRings(outlineUv, holesUv) {
  const outline = dropRepeats(toPoints(outlineUv));
  if (outline.length < 3 || !outline.every(finite)) return [];
  const holes = (Array.isArray(holesUv) ? holesUv : []).map(hole => dropRepeats(toPoints(hole))).filter(hole => hole.length >= 3 && hole.every(finite));
  return [outline, ...holes];
}

/** Even-odd inside test over rings (the boundary itself is ambiguous: see insideRegion). */
function parity(p, rings) {
  let odd = false;
  for (const ring of rings) {
    for (let k = 0, m = ring.length; k < m; k += 1) {
      const a = ring[k]; const b = ring[(k + 1) % m];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < a[0] + ((p[1] - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) odd = !odd;
    }
  }
  return odd;
}

/** Whether p lies on the surface (outline minus holes), its boundary within tol included. */
function insideRegion(p, rings, tol) {
  for (const ring of rings) {
    for (let k = 0, m = ring.length; k < m; k += 1) if (segmentDistance(p, ring[k], ring[(k + 1) % m]) <= tol) return true;
  }
  return parity(p, rings);
}

// --------------------------------------------------------------------------
// Validity
// --------------------------------------------------------------------------

/** The signed area (mm²): positive for a counter-clockwise polygon. */
export function signedArea(border) {
  const poly = toPoints(border);
  let twice = 0;
  for (let i = 0, n = poly.length; i < n; i += 1) twice += cross(poly[i], poly[(i + 1) % n]);
  return twice / 2;
}

/** Whether the polygon is simple: no edge crosses or touches another except its neighbours at their shared ends. */
export function isSimple(border) {
  const poly = toPoints(border);
  const n = poly.length;
  if (n < 3 || !poly.every(finite)) return false;
  for (let i = 0; i < n; i += 1) if (dist(poly[i], poly[(i + 1) % n]) <= TOUCH_MM) return false;
  const boxes = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    return [Math.min(a[0], b[0]) - TOUCH_MM, Math.min(a[1], b[1]) - TOUCH_MM, Math.max(a[0], b[0]) + TOUCH_MM, Math.max(a[1], b[1]) + TOUCH_MM];
  });
  for (let i = 0; i < n; i += 1) {
    const a = poly[i]; const b = poly[(i + 1) % n];
    for (let j = i + 1; j < n; j += 1) {
      const c = poly[j]; const d = poly[(j + 1) % n];
      if (j === i + 1) {
        // Neighbours share b (= c): neither may fold back onto the other.
        if (segmentDistance(d, a, b) <= TOUCH_MM || segmentDistance(a, c, d) <= TOUCH_MM) return false;
        continue;
      }
      if (i === 0 && j === n - 1) {
        // Neighbours share a (= d).
        if (segmentDistance(c, a, b) <= TOUCH_MM || segmentDistance(b, c, d) <= TOUCH_MM) return false;
        continue;
      }
      const p = boxes[i]; const q = boxes[j];
      if (p[0] > q[2] || q[0] > p[2] || p[1] > q[3] || q[1] > p[3]) continue;
      if (segmentsTouch(a, b, c, d, TOUCH_MM)) return false;
    }
  }
  return true;
}

/** An edit's result is kept only when it is a valid border. */
function validEdit(poly) {
  if (poly.length < 3 || !poly.every(finite)) return false;
  for (let i = 0, n = poly.length; i < n; i += 1) if (dist(poly[i], poly[(i + 1) % n]) < MIN_EDGE_MM) return false;
  return signedArea(poly) >= MIN_AREA_MM2 && isSimple(poly);
}

/**
 * Check a border as the server does (E_SURFACE_BORDER): {ok, message}.  With an outline, the border must also
 * overlap the surface (outline minus holes).
 */
export function validate(border, outlineUv = null, holesUv = []) {
  const fail = message => ({ok: false, message});
  if (!Array.isArray(border) || border.length < 3) return fail("The border needs at least 3 vertices.");
  const poly = toPoints(border);
  if (!poly.every(finite)) return fail("Every border vertex must be a pair of finite numbers [u, v].");
  if (!isSimple(poly)) return fail("The border is not a simple polygon: its edges cross or touch.");
  for (let i = 0, n = poly.length; i < n; i += 1) {
    if (dist(poly[i], poly[(i + 1) % n]) < MIN_EDGE_MM) return fail(`Border edge ${i} is shorter than ${MIN_EDGE_MM} mm.`);
  }
  const area = signedArea(poly);
  if (Math.abs(area) < MIN_AREA_MM2) return fail(`The border's area is under ${MIN_AREA_MM2} mm².`);
  if (area < 0) return fail("The border runs clockwise; it must run counter-clockwise.");
  if (outlineUv !== null && outlineUv !== undefined && !(overlapArea(poly, outlineUv, holesUv) > 0)) {
    return fail("The border does not overlap the surface.");
  }
  return {ok: true, message: ""};
}

/** A counter-clockwise copy without repeated vertices (nor a repeated closing vertex); null under 3 vertices. */
export function normalize(border) {
  const poly = dropRepeats(toPoints(border));
  if (poly.length < 3 || !poly.every(finite)) return null;
  return signedArea(poly) < 0 ? [poly[0], ...poly.slice(1).reverse()] : poly;
}

// --------------------------------------------------------------------------
// The initial border
// --------------------------------------------------------------------------

/** The first point of every straight side of a counter-clockwise outline (surface/api.py boundary_sides). */
function sideStarts(outline) {
  const points = dropRepeats(outline);
  const count = points.length;
  if (count < 3) return points;
  const directions = points.map((a, i) => {
    const b = points[(i + 1) % count];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  });
  const limit = SIDE_ANGLE_DEG * DEG;
  const wrap = d => Math.abs(mod(d + Math.PI, 2 * Math.PI) - Math.PI);
  const turn = i => wrap(directions[i] - directions[mod(i - 1, count)]);
  let start = 0;
  for (let i = 0; i < count; i += 1) if (turn(i) > limit) { start = i; break; }
  const firsts = [];
  for (let step = 0; step < count; step += 1) {
    const i = (start + step) % count;
    if (!firsts.length || turn(i) > limit || wrap(directions[i] - directions[firsts[firsts.length - 1]]) > limit) firsts.push(i);
  }
  return firsts.map(i => [points[i][0], points[i][1]]);
}

/** Whether every side ends where the next starts (an unfiltered selection.sides). */
function chained(sides) {
  return sides.every((side, k) => {
    const next = sides[(k + 1) % sides.length];
    if (!Array.isArray(side?.from_uv) || !Array.isArray(side?.to_uv) || !Array.isArray(next?.from_uv)) return false;
    return dist(toPoint(side.to_uv), toPoint(next.from_uv)) <= 1e-6;
  });
}

/** Drop vertices on a straight line between their neighbours. */
function withoutStraightVertices(points) {
  const pts = dropRepeats(points);
  for (let i = 0; pts.length > 3 && i < pts.length;) {
    const u = sub(pts[i], at(pts, i - 1)); const v = sub(at(pts, i + 1), pts[i]);
    if (Math.abs(cross(u, v)) <= 1e-12 * norm(u) * norm(v) && dot(u, v) > 0) pts.splice(i, 1);
    else i += 1;
  }
  return pts;
}

/**
 * The surface outline simplified to its straight sides' ends, counter-clockwise: one vertex per side of
 * selection.sides (its from_uv, in order), or, when sides is missing or not a closed chain, per straight side of
 * outlineUv (the server's 1-degree rule); corners closer than MERGE_MM merged (the first kept), so a side shorter
 * than that has no edge of its own.  The reset of the border editor; null without 3 sides.
 */
export function surfaceOutline(outlineUv, sides = null) {
  let points;
  if (Array.isArray(sides) && sides.length >= 3 && chained(sides)) points = sides.map(side => toPoint(side.from_uv));
  else points = sideStarts(toPoints(outlineUv));
  points = withoutStraightVertices(dropRepeats(points, MERGE_MM));
  if (points.length < 3 || !points.every(finite)) return null;
  return signedArea(points) < 0 ? [points[0], ...points.slice(1).reverse()] : points;
}

/** The initial border of a selection: its surface outline (see surfaceOutline). */
export function createBorder(outlineUv, sides = null) {
  return surfaceOutline(outlineUv, sides);
}

// --------------------------------------------------------------------------
// Edits
// --------------------------------------------------------------------------

/** Vertex i moved to uv: any polygon (no angle kept); null when the result is not a valid border. */
export function moveVertex(border, i, uv) {
  const poly = toPoints(border);
  const point = toPoint(uv);
  if (!validIndex(poly, i) || !finite(point)) return null;
  poly[i] = point;
  return validEdit(poly) ? poly : null;
}

/**
 * Edge i moved parallel to itself onto the line through uv; its two neighbours keep their lines and are extended
 * or shortened along them.  At a soft corner (turning less than SOFT_CORNER_DEG, or a neighbour parallel to edge i),
 * and where a neighbour shorter than the move would turn round, the edge's end moves with it, square to the edge,
 * and the neighbour turns about its other end.  Null when the edge would turn round or collapse (the edge crossing
 * the opposite side, the neighbours' lines meeting before it) or the result is not a valid border.
 */
export function moveEdge(border, i, uv) {
  const poly = toPoints(border);
  const n = poly.length;
  const point = toPoint(uv);
  if (n < 3 || !validIndex(poly, i) || !finite(point)) return null;
  const j = (i + 1) % n;
  const a = poly[i]; const b = poly[j];
  const before = at(poly, i - 1); const after = at(poly, i + 2);
  const d = sub(b, a);
  const length = norm(d);
  if (!(length > 0)) return null;
  const inward = [-d[1] / length, d[0] / length];
  const offset = dot(sub(point, a), inward);
  const shift = [inward[0] * offset, inward[1] * offset];
  // A neighbour is extended only while it keeps its direction: carried past its other end (a neighbour shorter than
  // the move) it would turn round, and the end moves square to the edge instead.
  let newA = softCorner(sub(a, before), d) ? null : alongLine(a, sub(a, before), point, d);
  let newB = softCorner(d, sub(after, b)) ? null : alongLine(b, sub(after, b), point, d);
  if (newA && !(dot(sub(newA, before), sub(a, before)) > 0)) newA = null;
  if (newB && !(dot(sub(after, newB), sub(after, b)) > 0)) newB = null;
  newA ??= [a[0] + shift[0], a[1] + shift[1]];
  newB ??= [b[0] + shift[0], b[1] + shift[1]];
  if (!(dot(sub(newB, newA), d) > 0)) return null;
  poly[i] = newA;
  poly[j] = newB;
  return validEdit(poly) ? poly : null;
}

/** Edge i moved parallel to itself by mm (positive: outward), as moveEdge. */
export function moveEdgeBy(border, i, mm) {
  const poly = toPoints(border);
  const offset = Number(mm);
  if (!validIndex(poly, i) || !Number.isFinite(offset)) return null;
  const a = poly[i]; const d = sub(at(poly, i + 1), a);
  const length = norm(d);
  if (!(length > 0)) return null;
  return moveEdge(poly, i, [a[0] + (d[1] / length) * offset, a[1] - (d[0] / length) * offset]);
}

/**
 * A vertex inserted on edge i (it becomes vertex i + 1): the point of the edge nearest uv, so the shape is
 * unchanged (with {onEdge: false}, uv itself).  Null within MIN_EDGE_MM of the edge's ends or when invalid.
 */
export function insertVertex(border, i, uv, {onEdge = true} = {}) {
  const poly = toPoints(border);
  const point = toPoint(uv);
  if (!validIndex(poly, i) || !finite(point)) return null;
  const a = poly[i]; const b = at(poly, i + 1);
  const inserted = onEdge ? closestOnSegment(point, a, b).point : point;
  if (dist(inserted, a) < MIN_EDGE_MM || dist(inserted, b) < MIN_EDGE_MM) return null;
  poly.splice(i + 1, 0, inserted);
  return validEdit(poly) ? poly : null;
}

/** Vertex i removed (its neighbours joined by one edge); null under 4 vertices or when invalid. */
export function deleteVertex(border, i) {
  const poly = toPoints(border);
  if (poly.length <= 3 || !validIndex(poly, i)) return null;
  poly.splice(i, 1);
  return validEdit(poly) ? poly : null;
}

/**
 * Every edge moved inward by mm (negative: outward), the vertices where the moved edges' lines meet.  An edge
 * that would turn round (shorter than the inset can keep) is dropped and its neighbours' lines meet instead.
 * Null when nothing valid is left.
 */
export function inset(border, mm) {
  const poly = toPoints(border);
  const n = poly.length;
  const offset = Number(mm);
  if (n < 3 || !poly.every(finite) || !Number.isFinite(offset)) return null;
  const lines = poly.map((a, k) => {
    const d = sub(poly[(k + 1) % n], a);
    const length = norm(d);
    const inward = length > 0 ? [-d[1] / length, d[0] / length] : [0, 0];
    return {origin: [a[0] + inward[0] * offset, a[1] + inward[1] * offset], d};
  });
  // The corner of two moved edges: where their lines meet (a straight corner: the next edge's start).
  const corner = (prev, next) => alongLine(next.origin, next.d, prev.origin, prev.d) ?? [next.origin[0], next.origin[1]];
  let active = lines.map((_, k) => k);
  for (let round = 0; round < n && active.length >= 3; round += 1) {
    const m = active.length;
    const points = active.map((k, j) => corner(lines[active[(j - 1 + m) % m]], lines[k]));
    const flipped = new Set(active.filter((k, j) => !(dot(sub(points[(j + 1) % m], points[j]), lines[k].d) > 0)));
    if (!flipped.size) return validEdit(points) ? points : null;
    active = active.filter(k => !flipped.has(k));
  }
  return null;
}

// --------------------------------------------------------------------------
// Snapping
// --------------------------------------------------------------------------

/** The nearest outline vertex within tol, else the nearest point of an outline edge within tol, else null. */
function nearestOnRings(p, rings, tol) {
  let best = null; let bestDistance = Infinity;
  for (const ring of rings) {
    for (const q of ring) {
      const distance = dist(p, q);
      if (distance <= tol && distance < bestDistance) { best = [q[0], q[1]]; bestDistance = distance; }
    }
  }
  if (best) return best;
  for (const ring of rings) {
    for (let k = 0, m = ring.length; k < m; k += 1) {
      const {point} = closestOnSegment(p, ring[k], ring[(k + 1) % m]);
      const distance = dist(p, point);
      if (distance <= tol && distance < bestDistance) { best = point; bestDistance = distance; }
    }
  }
  return best;
}

/** Per vertex: how far its angle is from 90 degrees (radians) when within limit, else null. */
function rightAngleDeviations(poly, limit) {
  return poly.map((p, j) => {
    const u = sub(p, at(poly, j - 1)); const v = sub(at(poly, j + 1), p);
    const lu = norm(u); const lv = norm(v);
    if (!(lu > 0 && lv > 0)) return null;
    const deviation = Math.asin(Math.min(1, Math.abs(dot(u, v)) / (lu * lv)));
    return deviation <= limit ? deviation : null;
  });
}

/**
 * Where vertex i goes to make the near-right angles around it right: at its neighbours (each a line through the
 * neighbour, perpendicular to the neighbour's other edge) and at itself (Thales' circle over its neighbours).
 */
function rightAngleTarget(poly, i, deviations) {
  const n = poly.length;
  const P = poly[i];
  const A = at(poly, i - 1); const B = at(poly, i + 1);
  const lines = [];  // dot(X - point, normal) = 0
  if (deviations[mod(i - 1, n)] !== null) lines.push({point: A, normal: sub(A, at(poly, i - 2)), deviation: deviations[mod(i - 1, n)]});
  if (deviations[mod(i + 1, n)] !== null) lines.push({point: B, normal: sub(at(poly, i + 2), B), deviation: deviations[mod(i + 1, n)]});
  const own = deviations[i] !== null;
  const center = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const radius = dist(A, B) / 2;
  if (lines.length === 2) {
    const [L1, L2] = lines;
    const det = cross(L1.normal, L2.normal);
    if (Math.abs(det) > 1e-9 * norm(L1.normal) * norm(L2.normal)) {
      const c1 = dot(L1.point, L1.normal); const c2 = dot(L2.point, L2.normal);
      return [(c1 * L2.normal[1] - c2 * L1.normal[1]) / det, (L1.normal[0] * c2 - L2.normal[0] * c1) / det];
    }
    lines.sort((p, q) => p.deviation - q.deviation);
    lines.length = 1;
  }
  if (lines.length === 1) {
    const {point, normal} = lines[0];
    const length = norm(normal);
    if (!(length > 0)) return null;
    const tangent = [-normal[1] / length, normal[0] / length];
    const along = dot(sub(P, point), tangent);
    const projected = [point[0] + tangent[0] * along, point[1] + tangent[1] * along];
    if (own) {
      const foot = dot(sub(center, point), tangent);
      const footPoint = [point[0] + tangent[0] * foot, point[1] + tangent[1] * foot];
      const h = dist(center, footPoint);
      if (h <= radius) {
        const s = Math.sqrt(radius * radius - h * h);
        const first = [footPoint[0] + tangent[0] * s, footPoint[1] + tangent[1] * s];
        const second = [footPoint[0] - tangent[0] * s, footPoint[1] - tangent[1] * s];
        return dist(first, P) <= dist(second, P) ? first : second;
      }
    }
    return projected;
  }
  if (own) {
    const away = dist(P, center);
    if (!(away > 0)) return null;
    return [center[0] + ((P[0] - center[0]) * radius) / away, center[1] + ((P[1] - center[1]) * radius) / away];
  }
  return null;
}

/**
 * Snap vertices: first onto the surface outline (an outline vertex within toleranceMm, else the nearest point of an
 * outline edge within it; such a vertex then stays), then near-right angles (within options.angleDeg, default
 * RIGHT_ANGLE_DEG) onto right angles, moving the vertex with the most near-right angles around it first, each vertex
 * at most once.  options.indices limits the vertices that may move (default all); options.holesUv adds the holes'
 * boundaries to the outline.  A snap that would leave an invalid border is skipped; returns the border (unchanged
 * when nothing snaps).
 */
export function snap(border, outlineUv, toleranceMm, options = {}) {
  let poly = toPoints(border);
  const n = poly.length;
  if (n < 3 || !poly.every(finite)) return poly;
  const tol = Math.max(0, Number(toleranceMm) || 0);
  const limit = Math.max(0, Number(options.angleDeg ?? RIGHT_ANGLE_DEG) || 0) * DEG;
  const order = [...new Set((Array.isArray(options.indices) ? options.indices : poly.map((_, i) => i)).filter(i => validIndex(poly, i)))].sort((p, q) => p - q);
  const rings = outlineUv ? [dropRepeats(toPoints(outlineUv)), ...(Array.isArray(options.holesUv) ? options.holesUv.map(h => dropRepeats(toPoints(h))) : [])].filter(r => r.length >= 2 && r.every(finite)) : [];
  const done = new Set();
  if (rings.length && tol > 0) {
    for (const i of order) {
      const target = nearestOnRings(poly[i], rings, tol);
      if (!target) continue;
      done.add(i);
      const trial = copy(poly);
      trial[i] = target;
      if (validEdit(trial)) poly = trial;
    }
  }
  if (limit > 0) {
    for (let round = 0; round < order.length; round += 1) {
      const deviations = rightAngleDeviations(poly, limit);
      // Scores in nanoradians, so equal angles tie exactly and the lower index goes first.
      let pick = -1; let score = 0;
      for (const i of order) {
        if (done.has(i)) continue;
        let value = 0;
        for (const j of [i - 1, i, i + 1]) value += deviations[mod(j, n)] ?? 0;
        value = Math.round(value * 1e9);
        if (value > score) { score = value; pick = i; }
      }
      if (pick < 0) break;
      done.add(pick);
      const target = rightAngleTarget(poly, pick, deviations);
      if (!target || !finite(target)) continue;
      const trial = copy(poly);
      trial[pick] = target;
      if (validEdit(trial)) poly = trial;
    }
  }
  return poly;
}

/**
 * Snap edge i onto the surface outline: when an outline vertex lies within toleranceMm of the edge's line (and
 * alongside the edge), the edge is moved parallel through the nearest such vertex (moveEdge).  Returns the border,
 * unchanged when nothing is in reach or the move is refused.
 */
export function snapEdge(border, i, outlineUv, toleranceMm) {
  const poly = toPoints(border);
  const outline = dropRepeats(toPoints(outlineUv));
  const tol = Math.max(0, Number(toleranceMm) || 0);
  if (!validIndex(poly, i) || !outline.length || !(tol > 0)) return poly;
  const a = poly[i]; const d = sub(at(poly, i + 1), a);
  const length = norm(d);
  if (!(length > 0)) return poly;
  const t = [d[0] / length, d[1] / length]; const inward = [-t[1], t[0]];
  let best = null; let bestOffset = Infinity;
  for (const q of outline) {
    const offset = Math.abs(dot(sub(q, a), inward)); const along = dot(sub(q, a), t);
    if (offset <= tol && along >= -tol && along <= length + tol && offset < bestOffset) { best = q; bestOffset = offset; }
  }
  if (!best || bestOffset === 0) return poly;
  return moveEdge(poly, i, best) ?? poly;
}

// --------------------------------------------------------------------------
// Against the surface
// --------------------------------------------------------------------------

/**
 * The parts of the border's boundary beyond the surface (outside the outline, or inside a hole), as uv polylines
 * in the border's order.  The boundary on the outline counts as on the surface.  A border entirely beyond the
 * surface gives one closed polyline (its first vertex repeated at the end); one entirely on it gives [].
 */
export function outsideParts(border, outlineUv, holesUv = []) {
  const poly = dropRepeats(toPoints(border));
  const rings = regionRings(outlineUv, holesUv);
  const n = poly.length;
  if (n < 2 || !poly.every(finite) || !rings.length) return [];
  const pieces = [];
  for (let i = 0; i < n; i += 1) {
    const a = poly[i]; const b = poly[(i + 1) % n];
    const d = sub(b, a);
    const l2 = dot(d, d);
    const length = Math.sqrt(l2);
    const cuts = [];
    for (const ring of rings) {
      for (let k = 0, m = ring.length; k < m; k += 1) {
        const c = ring[k]; const e = ring[(k + 1) % m];
        const f = sub(e, c); const ca = sub(c, a);
        const den = cross(d, f);
        if (Math.abs(den) > 1e-12 * length * norm(f)) {
          const t = cross(ca, f) / den; const s = cross(ca, d) / den;
          if (t > 0 && t < 1 && s >= -1e-12 && s <= 1 + 1e-12) {
            cuts.push({t, point: s <= 0 ? [c[0], c[1]] : s >= 1 ? [e[0], e[1]] : [a[0] + t * d[0], a[1] + t * d[1]]});
          }
        } else if (Math.abs(cross(ca, d)) <= TOUCH_MM * length) {
          // Collinear: the ring edge's ends cut the border edge.
          for (const q of [c, e]) {
            const t = dot(sub(q, a), d) / l2;
            if (t > 0 && t < 1) cuts.push({t, point: [q[0], q[1]]});
          }
        }
      }
    }
    cuts.sort((p, q) => p.t - q.t);
    const points = [{t: 0, point: [a[0], a[1]]}];
    for (const cut of cuts) {
      if ((cut.t - points[points.length - 1].t) * length > TOUCH_MM && (1 - cut.t) * length > TOUCH_MM) points.push(cut);
    }
    points.push({t: 1, point: [b[0], b[1]]});
    for (let k = 0; k + 1 < points.length; k += 1) {
      const middle = (points[k].t + points[k + 1].t) / 2;
      const outside = !insideRegion([a[0] + middle * d[0], a[1] + middle * d[1]], rings, NEAR_MM);
      pieces.push({from: points[k].point, to: points[k + 1].point, outside});
    }
  }
  if (!pieces.some(piece => piece.outside)) return [];
  if (pieces.every(piece => piece.outside)) return [[...copy(poly), [poly[0][0], poly[0][1]]]];
  const count = pieces.length;
  let first = 0;
  while (!(pieces[first].outside && !pieces[mod(first - 1, count)].outside)) first += 1;
  const runs = [];
  let run = null;
  for (let k = 0; k < count; k += 1) {
    const piece = pieces[(first + k) % count];
    if (piece.outside) {
      if (!run) run = [piece.from];
      run.push(piece.to);
    } else if (run) {
      runs.push(run);
      run = null;
    }
  }
  if (run) runs.push(run);
  return runs;
}

/** The sorted y values where the vertical line x crosses the rings' edges, paired into inside intervals. */
function crossSection(rings, x) {
  const ys = [];
  for (const ring of rings) {
    for (let k = 0, m = ring.length; k < m; k += 1) {
      const a = ring[k]; const b = ring[(k + 1) % m];
      if ((a[0] < x) !== (b[0] < x)) ys.push(a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0]));
    }
  }
  ys.sort((p, q) => p - q);
  const intervals = [];
  for (let k = 0; k + 1 < ys.length; k += 2) intervals.push([ys[k], ys[k + 1]]);
  return intervals;
}

/**
 * The area (mm²) of the border on the surface (outline minus holes): exact, by slabs between every vertex and
 * every edge crossing, in which both cross-sections change linearly.
 */
export function overlapArea(border, outlineUv, holesUv = []) {
  const poly = dropRepeats(toPoints(border));
  const rings = regionRings(outlineUv, holesUv);
  if (poly.length < 3 || !poly.every(finite) || !rings.length) return 0;
  const xs = [];
  for (const ring of [poly, ...rings]) for (const p of ring) xs.push(p[0]);
  const n = poly.length;
  for (let i = 0; i < n; i += 1) {
    const a = poly[i]; const d = sub(poly[(i + 1) % n], a);
    for (const ring of rings) {
      for (let k = 0, m = ring.length; k < m; k += 1) {
        const c = ring[k]; const f = sub(ring[(k + 1) % m], c);
        const den = cross(d, f);
        if (den === 0) continue;
        const ca = sub(c, a);
        const t = cross(ca, f) / den; const s = cross(ca, d) / den;
        if (t >= 0 && t <= 1 && s >= 0 && s <= 1) xs.push(a[0] + t * d[0]);
      }
    }
  }
  xs.sort((p, q) => p - q);
  let total = 0;
  for (let k = 0; k + 1 < xs.length; k += 1) {
    const x0 = xs[k]; const x1 = xs[k + 1];
    if (!(x1 > x0)) continue;
    const x = (x0 + x1) / 2;
    const p = crossSection([poly], x); const q = crossSection(rings, x);
    let length = 0;
    for (let i = 0, j = 0; i < p.length && j < q.length;) {
      const low = Math.max(p[i][0], q[j][0]); const high = Math.min(p[i][1], q[j][1]);
      if (high > low) length += high - low;
      if (p[i][1] < q[j][1]) i += 1;
      else j += 1;
    }
    total += length * (x1 - x0);
  }
  return total;
}

/** The border's edges, longest first (ties: the lower index): [{index, length}] (mm). */
export function rankEdges(border) {
  const poly = toPoints(border);
  const n = poly.length;
  const edges = poly.map((p, index) => ({index, length: dist(p, poly[(index + 1) % n])}));
  const key = edge => Math.round(edge.length * 1e9);
  return edges.sort((p, q) => key(q) - key(p) || p.index - q.index);
}

/** The polyline with points added so no segment is longer than stepMm (closed: back to the first point too). */
export function densify(polyline, stepMm, closed = false) {
  const points = toPoints(polyline);
  const step = Number(stepMm);
  if (points.length < 2 || !(step > 0)) return points;
  const out = [];
  const segments = closed ? points.length : points.length - 1;
  for (let i = 0; i < segments; i += 1) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    const parts = Math.min(10000, Math.max(1, Math.ceil(dist(a, b) / step)));
    out.push([a[0], a[1]]);
    for (let k = 1; k < parts; k += 1) out.push([a[0] + ((b[0] - a[0]) * k) / parts, a[1] + ((b[1] - a[1]) * k) / parts]);
  }
  if (!closed) out.push([points[points.length - 1][0], points[points.length - 1][1]]);
  return out;
}

// --------------------------------------------------------------------------
// uv <-> xyz (barycentric in the selection's facets)
// --------------------------------------------------------------------------
//
// facetsUv: selection.facets_uv, aligned with facets (selection.facets, mesh facet ids): per facet the uv of its
// three vertices in mesh order.  vertices: the facets' 3D corners in mesh order, one of
//   - the STL positions (Float32Array or number array, 9 per facet, indexed by mesh facet id: parseStl's
//     positions), multiplied by scale (the mesh's scale_to_mm);
//   - {positions, scale}: the same with its own scale;
//   - an array indexed by mesh facet id of [[x, y, z], [x, y, z], [x, y, z]];
//   - a function (facet id) -> [[x, y, z], [x, y, z], [x, y, z]].
// facetsUv and facets are indexed once and cached by identity: treat them as read-only.

const UV_INDEX = new WeakMap();
const FACET_POSITION = new WeakMap();

function cornersOf(vertices, facet, scale = 1) {
  let source = vertices; let factor = Number(scale);
  if (source && typeof source === "object" && !Array.isArray(source) && !ArrayBuffer.isView(source) && source.positions) {
    factor = Number(source.scale ?? scale);
    source = source.positions;
  }
  if (!Number.isFinite(factor)) factor = 1;
  if (typeof source === "function") {
    const corners = source(facet);
    return Array.isArray(corners) && corners.length === 3 ? corners.map(p => [p[0] * factor, p[1] * factor, p[2] * factor]) : null;
  }
  if (ArrayBuffer.isView(source) || (Array.isArray(source) && typeof source[0] === "number")) {
    const base = 9 * facet;
    if (!(base >= 0 && base + 8 < source.length)) return null;
    return [0, 3, 6].map(k => [source[base + k] * factor, source[base + k + 1] * factor, source[base + k + 2] * factor]);
  }
  if (Array.isArray(source)) {
    const corners = source[facet];
    return Array.isArray(corners) && corners.length === 3 ? corners.map(p => [p[0] * factor, p[1] * factor, p[2] * factor]) : null;
  }
  return null;
}

function barycentric2(p, tri) {
  const a = tri[0];
  const v0 = sub(tri[1], a); const v1 = sub(tri[2], a); const v2 = sub(p, a);
  const den = cross(v0, v1);
  if (!(Math.abs(den) > 0)) return null;
  const b = cross(v2, v1) / den; const c = cross(v0, v2) / den;
  return [1 - b - c, b, c];
}

function closestOnTriangle2(p, tri) {
  const w = barycentric2(p, tri);
  if (w && Math.min(...w) >= 0) return [p[0], p[1]];
  let best = null; let bestDistance = Infinity;
  for (let k = 0; k < 3; k += 1) {
    const {point} = closestOnSegment(p, tri[k], tri[(k + 1) % 3]);
    const distance = dist(p, point);
    if (distance < bestDistance) { best = point; bestDistance = distance; }
  }
  return best;
}

function uvIndex(facetsUv) {
  let index = UV_INDEX.get(facetsUv);
  if (index) return index;
  let umin = Infinity; let vmin = Infinity; let umax = -Infinity; let vmax = -Infinity;
  for (const tri of facetsUv) {
    for (const p of tri) { umin = Math.min(umin, p[0]); vmin = Math.min(vmin, p[1]); umax = Math.max(umax, p[0]); vmax = Math.max(vmax, p[1]); }
  }
  const side = Math.max(1, Math.min(256, Math.ceil(Math.sqrt(facetsUv.length))));
  const cw = (umax - umin) / side || 1; const ch = (vmax - vmin) / side || 1;
  const cell = (value, low, size) => Math.min(side - 1, Math.max(0, Math.floor((value - low) / size)));
  const cells = Array.from({length: side * side}, () => []);
  facetsUv.forEach((tri, k) => {
    const us = tri.map(p => p[0]); const vs = tri.map(p => p[1]);
    const u0 = cell(Math.min(...us) - NEAR_MM, umin, cw); const u1 = cell(Math.max(...us) + NEAR_MM, umin, cw);
    const v0 = cell(Math.min(...vs) - NEAR_MM, vmin, ch); const v1 = cell(Math.max(...vs) + NEAR_MM, vmin, ch);
    for (let cv = v0; cv <= v1; cv += 1) for (let cu = u0; cu <= u1; cu += 1) cells[cv * side + cu].push(k);
  });
  index = {umin, vmin, umax, vmax, cw, ch, side, cells, cell};
  UV_INDEX.set(facetsUv, index);
  return index;
}

/** The facet (position k in facetsUv) holding uv, with its barycentric weights; null off every facet. */
function locate(p, facetsUv) {
  if (!Array.isArray(facetsUv) || !facetsUv.length) return null;
  const index = uvIndex(facetsUv);
  if (p[0] < index.umin - NEAR_MM || p[0] > index.umax + NEAR_MM || p[1] < index.vmin - NEAR_MM || p[1] > index.vmax + NEAR_MM) return null;
  const list = index.cells[index.cell(p[1], index.vmin, index.ch) * index.side + index.cell(p[0], index.umin, index.cw)];
  let near = null;
  for (const k of list) {
    const tri = facetsUv[k];
    const w = barycentric2(p, tri);
    if (!w) continue;
    if (Math.min(...w) >= -1e-12) return {k, w};
    const q = closestOnTriangle2(p, tri);
    const distance = dist(p, q);
    if (distance <= NEAR_MM && (!near || distance < near.distance)) near = {k, w: barycentric2(q, tri), distance};
  }
  return near;
}

const blend3 = (corners, w) => [0, 1, 2].map(axis => w[0] * corners[0][axis] + w[1] * corners[1][axis] + w[2] * corners[2][axis]);

/** The 3D point (mm) of a uv point on the selection's facets; null outside every facet. */
export function uvToXyz(uv, facetsUv, facets, vertices, scale = 1) {
  const p = toPoint(uv);
  if (!finite(p)) return null;
  const hit = locate(p, facetsUv);
  if (!hit) return null;
  const corners = cornersOf(vertices, facets[hit.k], scale);
  return corners ? blend3(corners, hit.w) : null;
}

/**
 * Like uvToXyz, but beyond the surface the uv point is carried on the plane of the facet nearest it in uv
 * (extrapolated barycentrically): {xyz, facet (mesh id), inside}.  Null without facets.
 */
export function uvToXyzNearest(uv, facetsUv, facets, vertices, scale = 1) {
  const p = toPoint(uv);
  if (!finite(p) || !Array.isArray(facetsUv) || !facetsUv.length) return null;
  const hit = locate(p, facetsUv);
  let k; let w; let inside = true;
  if (hit) {
    ({k, w} = hit);
  } else {
    inside = false;
    let bestDistance = Infinity;
    facetsUv.forEach((tri, j) => {
      if (!barycentric2(tri[0], tri)) return;
      const distance = dist(p, closestOnTriangle2(p, tri));
      if (distance < bestDistance) { bestDistance = distance; k = j; }
    });
    if (k === undefined) return null;
    w = barycentric2(p, facetsUv[k]);
  }
  const corners = cornersOf(vertices, facets[k], scale);
  return corners ? {xyz: blend3(corners, w), facet: facets[k], inside} : null;
}

function positionOf(facets, facet) {
  let positions = FACET_POSITION.get(facets);
  if (!positions) {
    positions = new Map();
    facets.forEach((id, k) => { if (!positions.has(id)) positions.set(id, k); });
    FACET_POSITION.set(facets, positions);
  }
  return positions.has(facet) ? positions.get(facet) : -1;
}

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const along3 = (a, d, s) => [a[0] + d[0] * s, a[1] + d[1] * s, a[2] + d[2] * s];

function barycentric3(p, corners) {
  const [a, b, c] = corners;
  const v0 = sub3(b, a); const v1 = sub3(c, a); const v2 = sub3(p, a);
  const d00 = dot3(v0, v0); const d01 = dot3(v0, v1); const d11 = dot3(v1, v1);
  const d20 = dot3(v2, v0); const d21 = dot3(v2, v1);
  const den = d00 * d11 - d01 * d01;
  if (!(den > 1e-18 * d00 * d11)) return null;
  const wb = (d11 * d20 - d01 * d21) / den; const wc = (d00 * d21 - d01 * d20) / den;
  return [1 - wb - wc, wb, wc];
}

/** The closest point of triangle abc to p (Ericson, Real-Time Collision Detection 5.1.5). */
function closestOnTriangle3(p, a, b, c) {
  const ab = sub3(b, a); const ac = sub3(c, a); const ap = sub3(p, a);
  const d1 = dot3(ab, ap); const d2 = dot3(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub3(p, b); const d3 = dot3(ab, bp); const d4 = dot3(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return along3(a, ab, d1 / (d1 - d3));
  const cp = sub3(p, c); const d5 = dot3(ab, cp); const d6 = dot3(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return along3(a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return along3(b, sub3(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)));
  const denom = va + vb + vc;
  return along3(along3(a, ab, vb / denom), ac, vc / denom);
}

/**
 * The uv point of a 3D point (mm) on facet facetIndex (a mesh facet id, as the viewer reports it): barycentric in
 * that facet, the point projected onto its plane; beyond the facet the facet's map is extrapolated.  With
 * facetIndex null (a drag beyond the surface) or a facet outside the selection, the selection's facet nearest the
 * point in 3D is used.  Null without facets.
 */
export function xyzToUv(xyz, facetIndex, facetsUv, facets, vertices, scale = 1) {
  const p = Array.isArray(xyz) || ArrayBuffer.isView(xyz) ? [Number(xyz[0]), Number(xyz[1]), Number(xyz[2])] : [NaN, NaN, NaN];
  if (!p.every(Number.isFinite) || !Array.isArray(facetsUv) || !facetsUv.length || !facets) return null;
  let k = facetIndex === null || facetIndex === undefined ? -1 : positionOf(facets, facetIndex);
  if (k < 0 || k >= facetsUv.length) {
    k = -1;
    let bestDistance = Infinity;
    for (let j = 0; j < facetsUv.length; j += 1) {
      const corners = cornersOf(vertices, facets[j], scale);
      if (!corners || !barycentric3(corners[0], corners)) continue;
      const q = closestOnTriangle3(p, ...corners);
      const d = sub3(p, q);
      const distance = dot3(d, d);
      if (distance < bestDistance) { bestDistance = distance; k = j; }
    }
    if (k < 0) return null;
  }
  const corners = cornersOf(vertices, facets[k], scale);
  const w = corners && barycentric3(p, corners);
  if (!w) return null;
  const tri = facetsUv[k];
  return [w[0] * tri[0][0] + w[1] * tri[1][0] + w[2] * tri[2][0], w[0] * tri[0][1] + w[1] * tri[1][1] + w[2] * tri[2][1]];
}

/**
 * A uv polyline with a point wherever it crosses a facet edge (so its 3D image follows the surface exactly) and
 * at most stepMm between points (beyond the surface, where the nearest facet's plane carries it).  closed: the
 * polyline returns to its first point (which is not repeated).
 */
export function surfacePath(polyline, facetsUv, stepMm = 1, closed = false) {
  const points = toPoints(polyline);
  if (points.length < 2) return points;
  const step = Number(stepMm) > 0 ? Number(stepMm) : Infinity;
  const index = Array.isArray(facetsUv) && facetsUv.length ? uvIndex(facetsUv) : null;
  const out = [];
  const segments = closed ? points.length : points.length - 1;
  for (let i = 0; i < segments; i += 1) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    const d = sub(b, a);
    const length = norm(d);
    const ts = [0];
    const parts = Math.min(10000, Math.max(1, Math.ceil(length / step)));
    for (let k = 1; k < parts; k += 1) ts.push(k / parts);
    if (index && length > 0) {
      const {cell, umin, vmin, cw, ch, side, cells} = index;
      const u0 = cell(Math.min(a[0], b[0]), umin, cw); const u1 = cell(Math.max(a[0], b[0]), umin, cw);
      const v0 = cell(Math.min(a[1], b[1]), vmin, ch); const v1 = cell(Math.max(a[1], b[1]), vmin, ch);
      const seen = new Set();
      for (let cv = v0; cv <= v1; cv += 1) {
        for (let cu = u0; cu <= u1; cu += 1) {
          for (const k of cells[cv * side + cu]) {
            if (seen.has(k)) continue;
            seen.add(k);
            const tri = facetsUv[k];
            for (let e = 0; e < 3; e += 1) {
              const c = tri[e]; const f = sub(tri[(e + 1) % 3], c);
              const den = cross(d, f);
              if (!(Math.abs(den) > 1e-12 * length * norm(f))) continue;
              const ca = sub(c, a);
              const t = cross(ca, f) / den; const s = cross(ca, d) / den;
              if (t > 0 && t < 1 && s >= 0 && s <= 1) ts.push(t);
            }
          }
        }
      }
    }
    ts.sort((p, q) => p - q);
    let last = -Infinity;
    for (const t of ts) {
      if ((t - last) * length <= TOUCH_MM || (t > 0 && (1 - t) * length <= TOUCH_MM)) continue;
      out.push(t === 0 ? [a[0], a[1]] : [a[0] + t * d[0], a[1] + t * d[1]]);
      last = t;
    }
  }
  if (!closed) out.push([points[points.length - 1][0], points[points.length - 1][1]]);
  return out;
}

/**
 * The border in 3D for viewer.setBorder: {loop, outsideRuns}.  loop: the border traced over the facets
 * (surfacePath, a point at least every options.stepMm, default 1) and mapped with uvToXyzNearest (not closed: the
 * viewer closes it); outsideRuns: the outsideParts against options.outlineUv (and holesUv), traced and mapped the
 * same way ([] without an outline).  options.scale: as for uvToXyz.
 */
export function borderToXyz(border, facetsUv, facets, vertices, options = {}) {
  const {stepMm = 1, scale = 1, outlineUv = null, holesUv = []} = options;
  const map = uv => uvToXyzNearest(uv, facetsUv, facets, vertices, scale)?.xyz ?? null;
  const loop = surfacePath(border, facetsUv, stepMm, true).map(map);
  const outsideRuns = outlineUv ? outsideParts(border, outlineUv, holesUv).map(run => surfacePath(run, facetsUv, stepMm, false).map(map)) : [];
  return {loop, outsideRuns};
}

/**
 * The editor's handles for viewer.setBorderHandles: a vertex handle per vertex and an edge handle at each edge's
 * middle, [{kind: "vertex" | "edge", index, uv, xyz}] (xyz by uvToXyzNearest).
 */
export function borderHandles(border, facetsUv, facets, vertices, scale = 1) {
  const poly = toPoints(border);
  const map = uv => uvToXyzNearest(uv, facetsUv, facets, vertices, scale)?.xyz ?? null;
  const vertexHandles = poly.map((p, index) => ({kind: "vertex", index, uv: [p[0], p[1]], xyz: map(p)}));
  const edgeHandles = poly.map((p, index) => {
    const q = at(poly, index + 1);
    const middle = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    return {kind: "edge", index, uv: middle, xyz: map(middle)};
  });
  return [...vertexHandles, ...edgeHandles];
}

// --------------------------------------------------------------------------
// Undo / redo
// --------------------------------------------------------------------------

const cloneState = state => (state === undefined ? null : JSON.parse(JSON.stringify(state)));
const sameState = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Undo and redo of border states (any JSON value; stored and returned as copies).  push adds a state after the
 * current one, dropping the states that could be redone, and ignores a state equal to the current one; undo and
 * redo return the state they step to, or null when there is none; at most `limit` states are kept (the oldest go).
 */
export class History {
  constructor(initial = null, {limit = 200} = {}) {
    this.limit = Math.max(1, Math.floor(Number(limit)) || 200);
    this.states = [];
    this.position = -1;
    if (initial !== null && initial !== undefined) this.push(initial);
  }

  push(state) {
    const value = cloneState(state);
    if (this.position >= 0 && sameState(this.states[this.position], value)) return false;
    this.states.splice(this.position + 1);
    this.states.push(value);
    while (this.states.length > this.limit) this.states.shift();
    this.position = this.states.length - 1;
    return true;
  }

  undo() {
    if (!this.canUndo) return null;
    this.position -= 1;
    return cloneState(this.states[this.position]);
  }

  redo() {
    if (!this.canRedo) return null;
    this.position += 1;
    return cloneState(this.states[this.position]);
  }

  reset(state = null) {
    this.states = [];
    this.position = -1;
    if (state !== null && state !== undefined) this.push(state);
  }

  get current() {
    return this.position >= 0 ? cloneState(this.states[this.position]) : null;
  }

  get canUndo() {
    return this.position > 0;
  }

  get canRedo() {
    return this.position < this.states.length - 1;
  }

  get size() {
    return this.states.length;
  }
}
