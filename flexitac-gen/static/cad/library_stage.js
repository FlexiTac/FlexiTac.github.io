// The Library's whole-gripper stage (docs/LIBRARY_VIEW.md; the user's requests of 2026-11-05: the grippers that are not UMI
// fingers shown whole, a sensor on both fingers, the jaws fully open; the user's decision of 2026-11-06: one stack exploded,
// the near finger see-through in both views).  library_view.js gives it to onpart.js's createOnPartView as its stage, once for the view: each
// show() then names its scene (args.scene: a gripper's, from web/library/scenes/, its bodies loaded) or none (the UMI
// finger and its tapered tips: the figure as Gen by Surface draws it, its defaults put back exactly, so a sensor drawn
// after a gripper draws as on a fresh page).  With a scene the figure becomes the whole gripper: the bodies in the part's
// grey, the other finger, a second stack on it (the same sheets and board materials, placed by the scene's mate matrix:
// a turned copy or a mirror image, whose board is then the mirror-image board; its own assembled geometries when it
// does not explode), the stacks of rules.explode_stacks exploded into
// the jaws' gap along N across the approach axis (one of them: below), the fingers the scene names see-through, the camera at the
// rules' homes (Exploded 65, Assembled 57 degrees off the face's normal, elevation 30, from the front; its up the approach
// axis, the studio rolled so the normal is up in it).  Since the user's decision of 2026-11-06 ("每一个夹爪只用爆炸一个sensor, 靠近外面的
// finger透明, 夹爪不爆炸; 靠近里面的finger不透明, 夹爪爆炸") only the stacks of rules.explode_stacks explode (["sensor"]: the far
// finger's, whose face the camera sees), the other stays assembled on its finger in both modes (its own geometries), and
// the fingers the scene's see_through lists (["mate"]: the near one) are see-through in every mode of
// rules.see_through_modes (["exploded", "assembled"]); the roles are the scene's, fixed while the view turns.  The rules are scenes.json's (each scene's camera and explode over
// them).  Its measures (a software depth raster for what covers each layer, exact distances for the clearances) run only
// when the scene asks (the shots tool's ?probe=shoot), never for a visitor; info().stage reports them as the pictures'
// records keep them (the names of docs/LIBRARY_VIEW.md).  No fetch, no global: everything comes in the show's arguments.

import * as THREE from "../vendor/three/three.module.js";
import {FOV_DEG, HOME_UP, frameView} from "./drape.js";

const FRAME_SAMPLES = 6000;
const FILM_LAMP = {aim: 1.5, out: 0.3};
const LAYERS = ["bottom", "film", "top"];
const MODES = ["exploded", "assembled"];
// The clearances' reach (mm): a field farther than this from a body or the other finger reads as this far (">12").
const REACH_MM = 12;
const CELL_MM = 6;

const m4 = rows => new THREE.Matrix4().set(...rows.flat());
const r1 = x => Math.round(x * 10) / 10;
const r3 = x => Math.round(x * 1000) / 1000;

function sample(positions, matrix, most, out) {
  const count = positions.length / 3; const step = Math.max(1, Math.ceil(count / most));
  const v = new THREE.Vector3();
  for (let k = 0; k < count; k += step) {
    v.set(positions[3 * k], positions[3 * k + 1], positions[3 * k + 2]).applyMatrix4(matrix);
    out.push(v.x, v.y, v.z);
  }
}

function sheetPoints(sheet, array, matrix, out, most = 1500, field = false) {
  // The sheet's vertices inside its outline (field: and on the part's face, the board's own field and the tails' start
  // on it, not the tails carried off the face's edge), at most ``most``, through ``matrix``.
  const chosen = [];
  for (let k = 0; k < sheet.count; k += 1) if (sheet.inside[k] && (!field || sheet.on[k])) chosen.push(k);
  const step = Math.max(1, Math.ceil(chosen.length / most));
  const v = new THREE.Vector3();
  for (let i = 0; i < chosen.length; i += step) {
    const k = chosen[i];
    v.set(array[3 * k], array[3 * k + 1], array[3 * k + 2]);
    if (matrix) v.applyMatrix4(matrix);
    out.push(v.x, v.y, v.z);
  }
}

function direction(spec, up, normal) {
  // The camera's direction (toward it): spec.elevation_deg above the plane across the approach axis, turned from the
  // gripper's front toward the gap until it lies spec.tilt_deg off the sensor's normal (asserted).
  const c = normal.clone().addScaledVector(up, -normal.dot(up)).normalize();
  const f = up.clone().cross(c).normalize().multiplyScalar(spec.front || 1);
  const e = (spec.elevation_deg * Math.PI) / 180;
  const at = a => f.clone().multiplyScalar(Math.cos(e) * Math.cos(a)).addScaledVector(c, Math.cos(e) * Math.sin(a)).addScaledVector(up, Math.sin(e)).normalize();
  const want = (spec.tilt_deg * Math.PI) / 180;
  let low = 0; let high = Math.PI / 2;
  for (let k = 0; k < 50; k += 1) {
    const mid = (low + high) / 2;
    if (at(mid).angleTo(normal) > want) low = mid; else high = mid;
  }
  const d = at((low + high) / 2);
  const reached = (d.angleTo(normal) * 180) / Math.PI;
  if (Math.abs(reached - spec.tilt_deg) > 0.01) throw new Error(`library stage: the tilt ${spec.tilt_deg} deg is out of reach at elevation ${spec.elevation_deg} (${reached.toFixed(2)})`);
  return d;
}

// -- the measures: a software depth raster (deterministic, independent of the GPU) and exact distances ----------------

function rasterizer(cam, W, H) {
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const PV = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  const blank = () => new Float32Array(W * H).fill(Infinity);
  function draw(buffer, positions, index, matrix, keep) {
    // Each triangle (index, or the positions' own triples) whose corners ``keep`` takes, its nearest view depth (mm,
    // 1/w interpolated) kept per pixel; one too small for any pixel's centre writes its centroid's pixel.
    const e = new THREE.Matrix4().multiplyMatrices(PV, matrix).elements;
    const count = positions.length / 3;
    const X = new Float32Array(count); const Y = new Float32Array(count); const IW = new Float32Array(count);
    for (let k = 0; k < count; k += 1) {
      const x = positions[3 * k]; const y = positions[3 * k + 1]; const z = positions[3 * k + 2];
      const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
      X[k] = (((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw + 1) / 2) * W;
      Y[k] = ((1 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / cw) / 2) * H;
      IW[k] = 1 / cw;
    }
    const triangles = index ? index.length / 3 : count / 3;
    for (let t = 0; t < triangles; t += 1) {
      const a = index ? index[3 * t] : 3 * t; const b = index ? index[3 * t + 1] : 3 * t + 1; const c = index ? index[3 * t + 2] : 3 * t + 2;
      if (keep && !keep(a, b, c)) continue;
      if (!(IW[a] > 0 && IW[b] > 0 && IW[c] > 0)) continue;
      const x0 = X[a]; const y0 = Y[a]; const x1 = X[b]; const y1 = Y[b]; const x2 = X[c]; const y2 = Y[c];
      const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (Math.abs(area) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))); const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))); const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
      let wrote = false;
      for (let py = minY; py <= maxY; py += 1) {
        const sy = py + 0.5;
        for (let px = minX; px <= maxX; px += 1) {
          const sx = px + 0.5;
          const w0 = ((x1 - sx) * (y2 - sy) - (x2 - sx) * (y1 - sy)) / area;
          const w1 = ((x2 - sx) * (y0 - sy) - (x0 - sx) * (y2 - sy)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const depth = 1 / (w0 * IW[a] + w1 * IW[b] + w2 * IW[c]);
          const i = py * W + px;
          if (depth < buffer[i]) buffer[i] = depth;
          wrote = true;
        }
      }
      if (!wrote) {
        const px = Math.floor((x0 + x1 + x2) / 3); const py = Math.floor((y0 + y1 + y2) / 3);
        if (px >= 0 && px < W && py >= 0 && py < H) {
          const depth = 3 / (IW[a] + IW[b] + IW[c]); const i = py * W + px;
          if (depth < buffer[i]) buffer[i] = depth;
        }
      }
    }
  }
  return {W, H, blank, draw};
}

function closest(p, a, b, c) {
  // Ericson's closest point on triangle abc to p: the squared distance.
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2], acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  const apx = p[0] - a[0], apy = p[1] - a[1], apz = p[2] - a[2];
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  const d2s = (x, y, z) => x * x + y * y + z * z;
  if (d1 <= 0 && d2 <= 0) return d2s(apx, apy, apz);
  const bpx = p[0] - b[0], bpy = p[1] - b[1], bpz = p[2] - b[2];
  const d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) return d2s(bpx, bpy, bpz);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return d2s(apx - v * abx, apy - v * aby, apz - v * abz); }
  const cpx = p[0] - c[0], cpy = p[1] - c[1], cpz = p[2] - c[2];
  const d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) return d2s(cpx, cpy, cpz);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return d2s(apx - w * acx, apy - w * acy, apz - w * acz); }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
    return d2s(bpx - w * (c[0] - b[0]), bpy - w * (c[1] - b[1]), bpz - w * (c[2] - b[2]));
  }
  const denom = 1 / (va + vb + vc); const v = vb * denom; const w = vc * denom;
  return d2s(apx - abx * v - acx * w, apy - aby * v - acy * w, apz - abz * v - acz * w);
}

function triangleGrid(list, cell) {
  // {cell key: [triangles]} of world triangles (each [a, b, c]) by the cells their boxes touch.
  const grid = new Map();
  for (const tri of list) {
    const lo = [0, 1, 2].map(i => Math.floor(Math.min(tri[0][i], tri[1][i], tri[2][i]) / cell));
    const hi = [0, 1, 2].map(i => Math.floor(Math.max(tri[0][i], tri[1][i], tri[2][i]) / cell));
    for (let x = lo[0]; x <= hi[0]; x += 1) for (let y = lo[1]; y <= hi[1]; y += 1) for (let z = lo[2]; z <= hi[2]; z += 1) {
      const key = `${x},${y},${z}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(tri);
    }
  }
  return grid;
}

function nearestTo(points, grid, cell, reach) {
  // The least exact distance (mm) of the points to the grid's triangles, reach at most (Infinity beyond it).
  let best = reach * reach;
  const seen = new Set();
  for (let k = 0; k < points.length; k += 3) {
    const p = [points[k], points[k + 1], points[k + 2]];
    const c = p.map(v => Math.floor(v / cell));
    const r = Math.ceil(reach / cell);
    seen.clear();
    for (let x = c[0] - r; x <= c[0] + r; x += 1) for (let y = c[1] - r; y <= c[1] + r; y += 1) for (let z = c[2] - r; z <= c[2] + r; z += 1) {
      const list = grid.get(`${x},${y},${z}`);
      if (!list) continue;
      for (const tri of list) {
        if (seen.has(tri)) continue;
        seen.add(tri);
        const d = closest(p, tri[0], tri[1], tri[2]);
        if (d < best) best = d;
      }
    }
  }
  return best >= reach * reach ? Infinity : Math.sqrt(best);
}

function edt1d(f, n, d, v, z) {
  // Felzenszwalb-Huttenlocher's 1D squared distance transform of f (n samples) into d.
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q += 1) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k -= 1; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k += 1; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) { while (z[k + 1] < q) k += 1; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}

function silhouetteGap(a, b, W, H) {
  // The least distance (px, exact Euclidean between pixel centres) from mask b's pixels to mask a's; 0 where
  // they overlap, null if either is empty.
  const BIG = 1e20; const n = Math.max(W, H);
  const f = new Float64Array(n); const d = new Float64Array(n); const v = new Int32Array(n); const z = new Float64Array(n + 1);
  const grid = new Float64Array(W * H);
  let any = false;
  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) { f[y] = a[y * W + x] ? 0 : BIG; if (a[y * W + x]) any = true; }
    edt1d(f, H, d, v, z);
    for (let y = 0; y < H; y += 1) grid[y * W + x] = d[y];
  }
  if (!any) return null;
  let best = Infinity;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) f[x] = grid[y * W + x];
    edt1d(f, W, d, v, z);
    for (let x = 0; x < W; x += 1) if (b[y * W + x] && d[x] < best) best = d[x];
  }
  return best === Infinity ? null : Math.round(Math.sqrt(best) * 10) / 10;
}

function worldTriangles(positions, index, matrix, out) {
  const v = new THREE.Vector3();
  const at = k => v.set(positions[3 * k], positions[3 * k + 1], positions[3 * k + 2]).applyMatrix4(matrix).toArray();
  const count = index ? index.length / 3 : positions.length / 9;
  for (let t = 0; t < count; t += 1) {
    out.push(index ? [at(index[3 * t]), at(index[3 * t + 1]), at(index[3 * t + 2])] : [at(3 * t), at(3 * t + 1), at(3 * t + 2)]);
  }
}

function assembledFace(sheet) {
  // A layer's face for the stack that does not explode: its own geometry at the assembled positions (the sheet's
  // normals, uvs and index in attributes of its own, so disposing it leaves the figure's buffers alone).
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(sheet.assembled), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(sheet.normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(sheet.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(sheet.index, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function assembledBand(band, depth) {
  // A layer's edge band for the stack that does not explode: onpart.js fitBand's vertices and normals at the
  // assembled depth (bandDepth's: the layer down to the one under it), in a geometry of its own, made once.
  if (!band?.geometry) return null;
  const top = band.surface.assembled; const n = band.normals;
  const position = new Float32Array(6 * band.count); const normal = new Float32Array(6 * band.count);
  for (let k = 0; k < band.count; k += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      position[6 * k + axis] = top[3 * k + axis];
      position[6 * k + 3 + axis] = top[3 * k + axis] - depth * n[3 * k + axis];
    }
  }
  for (const run of band.runs) {
    for (let r = 0; r < run.count; r += 1) {
      const k = run.first + r;
      const next = run.first + (run.closed ? (r + 1) % run.count : Math.min(run.count - 1, r + 1));
      const prev = run.first + (run.closed ? (r - 1 + run.count) % run.count : Math.max(0, r - 1));
      const t = [0, 1, 2].map(axis => top[3 * next + axis] - top[3 * prev + axis]);
      const side = [-(n[3 * k + 1] * t[2] - n[3 * k + 2] * t[1]), -(n[3 * k + 2] * t[0] - n[3 * k] * t[2]), -(n[3 * k] * t[1] - n[3 * k + 1] * t[0])];
      const length = Math.hypot(...side) || 1;
      for (let axis = 0; axis < 3; axis += 1) { normal[6 * k + axis] = side[axis] / length; normal[6 * k + 3 + axis] = side[axis] / length; }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(band.geometry.attributes.uv.array, 2));
  geometry.setIndex(new THREE.BufferAttribute(band.geometry.index.array, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function numbersOf(measures, info) {
  // The record's numbers (docs/LIBRARY_VIEW.md, the shots' checks; the rules' checks in scenes.json): the gap and steps,
  // the face's tilt; of the exploding stack's layers the least visible share of a field; of every layer drawn in Exploded
  // the most an opaque body or finger covers, and the most a see-through finger veils (null with none); of the still
  // stack's bottom FPC (its face toward the camera) the least share nothing opaque and no other layer hides, Exploded and
  // Assembled (near_seen: seen through the see-through finger; null when it explodes too); the same opaque cover of stack 1's top FPC
  // in Assembled; the least clearances of the fields to the bodies and to the other finger (both modes; a reach-limited
  // search, so capped at REACH_MM) and of the stacks to each other (Exploded), and their silhouettes apart on screen
  // (Exploded, px of the 1280 x 800 measure); stack 1's top FPC on the card and in the phone's 3:1 band.
  const exploded = Object.values(measures.cover.exploded);
  const moving = exploded.filter(layer => layer.exploded);
  const near = ["exploded", "assembled"].map(mode => measures.cover[mode]["stack2.bottom"]).filter(Boolean);
  const capped = value => (typeof value === "number" ? Math.min(REACH_MM, value) : REACH_MM);
  const least = keys => Math.min(...MODES.flatMap(mode => keys.map(key => capped(measures.clearance[mode][key]))));
  const ghosts = info.see_through;
  return {jaw_gap_mm: r3(info.gap_mm), step_mm: r3(info.step_mm), drape_step_mm: r3(info.drape_step_mm), face_tilt_deg: r3(info.face_tilt_deg),
    visible_min: r3(Math.min(...moving.map(layer => layer.visible))), opaque_max: r3(Math.max(...exploded.map(layer => layer.opaque))),
    assembled_opaque: r3(measures.cover.assembled["stack1.top"].opaque),
    ghost_cover: ghosts.length ? r3(Math.max(...exploded.flatMap(layer => ghosts.map(role => layer[role])))) : null,
    clearance_mm: {bodies: r1(least(["stack1_body", "stack2_body"])), other_finger: r1(least(["stack1_mate", "stack2_sensor"])),
      stacks: r1(measures.clearance.exploded.stacks)},
    card_px: measures.screen.card_px, band_css: {contain: measures.screen.band_contain_css, cover: measures.screen.band_cover_css},
    near_seen: info.explodeMate ? null : r3(Math.min(...near.map(layer => layer.visible))), stacks_apart_px: measures.screen.stacks_apart_px};
}

/**
 * The stage: (internals, figure) -> the view (onpart.js createOnPartView's stage option), the figure's own show, clear and
 * info wrapped.  show(args): args as the figure's, with args.scene {data (the part's scene, scenes/<part>.json), meshes
 * {its bodies' paths: their positions, mm}, rules (scenes.json's), measure (the shots tool's numbers)} or null.
 */
export function libraryStage() {
  return (internals, figure) => {
    const {scene, camera, controls, canvas, look, partLook, view, place, render, filmMaterial} = internals;
    // info: the scene's drawing (null without one); extras: what it added to the figure's scene; geometries: the bodies'
    // (by their positions), kept from one show to the next of the same gripper (a pitch).
    const state = {info: null, extras: null, rules: null, geometries: new Map(), lamps: {key: null}};
    const ghostLook = new THREE.MeshStandardMaterial({color: partLook.color.clone(), roughness: 0.6, metalness: 0, transparent: true,
      opacity: 1, depthWrite: false, side: THREE.DoubleSide});
    const ghostDepth = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: true, transparent: true, side: THREE.DoubleSide});

    function geometryOf(positions) {
      if (!state.geometries.has(positions)) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        state.geometries.set(positions, geometry);
      }
      return state.geometries.get(positions);
    }
    function keepGeometries(kept) {
      // The bodies' geometries no longer drawn disposed.
      for (const [positions, geometry] of state.geometries) {
        if (kept.has(positions)) continue;
        geometry.dispose();
        state.geometries.delete(positions);
      }
    }

    function defaults() {
      // The figure as createOnPartView made it: its own homes (drape.js homeDirection), the camera's up HOME_UP and
      // OrbitControls' frame of it (its constructor's: the one private access, _quat and _quatInverse).
      view.homes = null;
      state.info = null;
      camera.up.set(...HOME_UP);
      controls._quat.setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
      controls._quatInverse.copy(controls._quat).invert();
    }

    function prepare(stack, given, positions) {
      // The stack re-spaced for the jaws (along N across the approach axis), its homes the whole gripper's, the camera's
      // up the approach axis.
      const data = given.data; const base = given.rules;
      if (!base?.camera) throw new Error("library stage: no rules");
      const rules = {...base, ...(data.explode || {}),
        camera: Object.fromEntries(MODES.map(mode => [mode, {...base.camera[mode], ...(data.camera?.[mode] || {})}]))};
      state.rules = rules;
      ghostLook.opacity = rules.ghost_opacity;
      // Which stacks explode (the sensor finger's always: the figure's own stack) and the modes the listed fingers are
      // see-through in: scenes.json's rules, no default.
      const explodes = new Set(rules.explode_stacks);
      if (!Array.isArray(rules.explode_stacks) || !explodes.has("sensor") || [...explodes].some(name => name !== "sensor" && name !== "mate")
          || !Array.isArray(rules.see_through_modes) || rules.see_through_modes.some(mode => !MODES.includes(mode))) {
        throw new Error(`library stage: explode_stacks ${JSON.stringify(rules.explode_stacks)} or see_through_modes ${JSON.stringify(rules.see_through_modes)}`);
      }
      const P = new THREE.Matrix4().fromArray(stack.partMatrix);
      const s = new THREE.Vector3().setFromMatrixColumn(P, 0).length();
      const Pmm = P.clone().multiply(new THREE.Matrix4().makeScale(1 / s, 1 / s, 1 / s));
      const mate = Pmm.clone().multiply(m4(data.mate.matrix)).multiply(Pmm.clone().invert());
      const up = new THREE.Vector3(...data.approach).transformDirection(Pmm);
      const normal = new THREE.Vector3(0, 0, 1);
      const tilt = (Math.asin(Math.min(1, Math.abs(normal.dot(up)))) * 180) / Math.PI;
      const across = normal.clone().addScaledVector(up, -normal.dot(up)).normalize();
      const shift = stack.explode === "shift";
      const out = shift ? across : normal;
      // The jaws' gap G along the explode: from the bottom sheet's field (assembled) to the other finger's copy of it.
      const bottom = stack.sheets.bottom;
      let gap = Infinity;
      const p = new THREE.Vector3(); const q = new THREE.Vector3();
      for (let k = 0; k < bottom.count; k += 1) {
        if (!bottom.inside[k] || !bottom.on[k]) continue;
        p.set(bottom.assembled[3 * k], bottom.assembled[3 * k + 1], bottom.assembled[3 * k + 2]);
        q.copy(p).applyMatrix4(mate);
        gap = Math.min(gap, q.sub(p).dot(out));
      }
      const nest = stack.nest_mm;
      const old = stack.gap_mm;
      const step = Math.max(rules.min_step_mm, Math.min(old, (rules.gap_share * gap) / 3 - nest));
      for (const name of LAYERS) {
        const sheet = stack.sheets[name]; const layer = sheet.layer;
        for (let k = 0; k < sheet.count; k += 1) {
          for (let a = 0; a < 3; a += 1) {
            const i = 3 * k + a;
            sheet.positions[i] = shift ? sheet.assembled[i] + layer * step * out.getComponent(a)
              : sheet.assembled[i] + ((sheet.positions[i] - sheet.assembled[i]) * step) / old;
          }
        }
      }
      stack.gap_mm = Math.round(step * 1e6) / 1e6;
      const bodies = data.bodies.map(body => {
        const mesh = given.meshes[body.mesh];
        if (!mesh) throw new Error(`library stage: the body ${body.mesh} is not loaded`);
        return {...body, positions: mesh, world: Pmm.clone().multiply(m4(body.matrix))};
      });
      const homes = {};
      for (const mode of MODES) {
        const points = [];
        for (const body of bodies) sample(body.positions, body.world, FRAME_SAMPLES / Math.max(1, bodies.length), points);
        sample(positions, P, 3000, points);
        if (data.mate.part !== false) sample(positions, mate.clone().multiply(P), 3000, points);
        for (const name of LAYERS) {
          const sheet = stack.sheets[name]; const array = mode === "assembled" ? sheet.assembled : sheet.positions;
          sheetPoints(sheet, array, null, points);
          sheetPoints(sheet, explodes.has("mate") ? array : sheet.assembled, mate, points);
        }
        const all = new Float32Array(points);
        const low = [Infinity, Infinity, Infinity]; const high = [-Infinity, -Infinity, -Infinity];
        for (let k = 0; k < all.length; k += 3) for (let a = 0; a < 3; a += 1) { low[a] = Math.min(low[a], all[k + a]); high[a] = Math.max(high[a], all[k + a]); }
        const centre = [0, 1, 2].map(a => (low[a] + high[a]) / 2);
        let rAll = 1;
        for (let k = 0; k < all.length; k += 3) rAll = Math.max(rAll, Math.hypot(all[k] - centre[0], all[k + 1] - centre[1], all[k + 2] - centre[2]));
        homes[mode] = {centre, points: all, rAll};
      }
      stack.home = homes;
      view.homes = {exploded: direction(rules.camera.exploded, up, normal).toArray(), assembled: direction(rules.camera.assembled, up, normal).toArray()};
      camera.up.copy(up);
      controls._quat.setFromUnitVectors(camera.up, new THREE.Vector3(0, 1, 0));
      controls._quatInverse.copy(controls._quat).invert();
      state.info = {gap_mm: gap, step_mm: step, drape_step_mm: old, kind: data.mate.kind, mate, Pmm, P, bodies, up, data,
        face_tilt_deg: tilt, explode: stack.explode, see_through: data.see_through || [], numbers: null, measures: null,
        explodeMate: explodes.has("mate"), seeModes: new Set(rules.see_through_modes)};
    }

    function build(stack, given) {
      const group = new THREE.Group();
      const {mate, P, bodies, data} = state.info;
      const fingers = [];
      for (const body of bodies) {
        const mesh = new THREE.Mesh(geometryOf(body.positions), partLook);
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(body.world);
        mesh.userData.finger = body.finger;
        group.add(mesh);
        if (body.finger) fingers.push(mesh);
      }
      keepGeometries(new Set(bodies.map(body => body.positions)));
      if (data.mate.part !== false) {
        const matePart = new THREE.Mesh(view.part.geometry, partLook);
        matePart.matrixAutoUpdate = false;
        matePart.matrix.copy(mate).multiply(P);
        matePart.userData.finger = "mate";
        group.add(matePart);
        fingers.push(matePart);
      }
      view.part.userData.finger = "sensor";
      fingers.push(view.part);
      // The second stack: the first one's board materials under the mate matrix (its geometries the first one's when it
      // explodes too, else its own, assembled: below); its film its own material (its own lamp, aimed at it).
      const second = new THREE.Group();
      second.matrixAutoUpdate = false;
      second.matrix.copy(mate);
      const filmLook = {environment: look.environment, rotation: look.rotation, filmLamp: {value: new THREE.Vector3()}};
      const materials = [];
      // The second stack shares the first one's geometries only when it explodes too; else each layer's face and edge band
      // are its own, assembled (made once: it never moves), the film's face hidden (as onpart.js filmFace hides it assembled).
      const still = !state.info.explodeMate;
      const geometries = [];
      const nest = stack.nest_mm || 0.25;
      for (const layer of view.sheets.children) {
        const copy = new THREE.Group();
        copy.userData = {sheet: layer.userData.sheet};
        const sheet = layer.userData.data;
        const face = still ? assembledFace(sheet) : null;
        const band = still ? assembledBand(layer.userData.band, (sheet.art ? sheet.layer || 1 : 1) * nest) : null;
        if (face) geometries.push(face);
        if (band) geometries.push(band);
        for (const child of layer.children) {
          const film = layer.userData.sheet === "film" && !child.userData.edgeBand;
          const material = film ? filmMaterial(child.material.map, filmLook) : child.material;
          if (film) materials.push(material);
          const mesh = new THREE.Mesh(still ? (child.userData.edgeBand ? band : face) : child.geometry, material);
          mesh.userData = {edgeBand: Boolean(child.userData.edgeBand), source: child, hidden: still && film};
          copy.add(mesh);
        }
        second.add(copy);
      }
      group.add(second);
      scene.add(group);
      state.extras = {group, second, fingers, materials, geometries, filmLook, ghosts: new Map(), mateInverse: mate.clone().invert(), see: new Set(state.info.see_through)};
      state.lamps = {key: null};
      if (given.measure) {
        state.info.measures = measure(stack);
        state.info.numbers = numbersOf(state.info.measures, state.info);
      }
    }

    function measure(stack) {
      // The shot's numbers, on each board's field only: per home, each layer's share hidden by the opaque bodies, by
      // each finger, by its own stack's other layers and by the other stack (a depth raster at the picture's size from
      // the shot's own camera); stack 1's top FPC's box on screen (picture, card, the phone's 3:1 band); the exact least
      // distances (point to triangle) of each stack's field to the bodies and to the other finger, of the stacks to each
      // other, exploded and assembled.
      const t0 = performance.now();
      const {mate, P, bodies, up, data} = state.info;
      const rules = state.rules;
      const [W, H] = rules.measure_px;
      const tol = rules.depth_tol_mm;
      const roles = {body: [], sensor: [], mate: []};
      for (const body of bodies) roles[body.finger || "body"].push({positions: body.positions, index: null, matrix: body.world});
      const partPositions = view.part.geometry.attributes.position.array;
      const partIndex = view.part.geometry.index ? view.part.geometry.index.array : null;
      roles.sensor.push({positions: partPositions, index: partIndex, matrix: P});
      if (data.mate.part !== false) roles.mate.push({positions: partPositions, index: partIndex, matrix: mate.clone().multiply(P)});
      const identity = new THREE.Matrix4();
      const out = {};
      const sight = {};
      let screenApart = null;
      for (const mode of MODES) {
        const d = new THREE.Vector3(...view.homes[mode]);
        const {target, distance} = frameView(stack.home[mode], d.toArray(), W / H, up.toArray());
        const cam = new THREE.PerspectiveCamera(FOV_DEG, W / H, 1, 1e6);
        cam.up.copy(up); cam.position.set(...target).addScaledVector(d, distance); cam.lookAt(...target);
        const R = rasterizer(cam, W, H);
        const roleBuffer = {};
        for (const [role, list] of Object.entries(roles)) {
          roleBuffer[role] = R.blank();
          for (const item of list) R.draw(roleBuffer[role], item.positions, item.index, item.matrix, null);
        }
        // Each stack's layers whole (inside the outline: what covers) and its field (inside and on the face: what is measured);
        // a stack that does not explode is assembled in both modes (its film's face not drawn).
        const whole = {}; const fields = {};
        const exploding = label => mode === "exploded" && (label === "stack1" || state.info.explodeMate);
        for (const [label, matrix] of [["stack1", identity], ["stack2", mate]]) {
          for (const name of LAYERS) {
            const sheet = stack.sheets[name];
            if (!exploding(label) && name === "film") continue;  // (its face is not drawn there: onpart.js filmFace)
            const array = exploding(label) ? sheet.positions : sheet.assembled;
            const w = R.blank(); const f = R.blank();
            R.draw(w, array, sheet.index, matrix, (a, b, c) => sheet.inside[a] && sheet.inside[b] && sheet.inside[c]);
            R.draw(f, array, sheet.index, matrix, (a, b, c) => sheet.inside[a] && sheet.inside[b] && sheet.inside[c] && sheet.on[a] && sheet.on[b] && sheet.on[c]);
            whole[`${label}.${name}`] = w; fields[`${label}.${name}`] = f;
          }
        }
        const ghosted = state.info.seeModes.has(mode) ? state.extras.see : new Set();
        const layers = {};
        for (const [key, f] of Object.entries(fields)) {
          const [label] = key.split(".");
          // Assembled: stack 1's top FPC, and the still stack's bottom FPC (its face toward the camera: near_seen).
          if (mode === "assembled" && key !== "stack1.top" && !(key === "stack2.bottom" && !state.info.explodeMate)) continue;
          const own = Object.keys(whole).filter(other => other !== key && other.startsWith(label));
          const other = Object.keys(whole).filter(name => !name.startsWith(label));
          let total = 0; let visible = 0; const hidden = {body: 0, sensor: 0, mate: 0, own: 0, other: 0, opaque: 0};
          let box = [Infinity, Infinity, -Infinity, -Infinity];
          for (let i = 0; i < W * H; i += 1) {
            const depth = f[i];
            if (depth === Infinity) continue;
            total += 1;
            const x = i % W; const y = (i - x) / W;
            box = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x + 1), Math.max(box[3], y + 1)];
            const limit = depth - tol;
            let covered = false; let opaque = false;
            for (const role of ["body", "sensor", "mate"]) {
              if (roleBuffer[role][i] < limit) { hidden[role] += 1; if (!ghosted.has(role)) { covered = true; opaque = true; } }
            }
            if (opaque) hidden.opaque += 1;
            if (own.some(name => whole[name][i] < limit)) { hidden.own += 1; covered = true; }
            if (other.some(name => whole[name][i] < limit)) { hidden.other += 1; covered = true; }
            if (!covered) visible += 1;
          }
          const share = n => r3(n / Math.max(1, total));
          layers[key] = {px: total, visible: share(visible), opaque: share(hidden.opaque), body: share(hidden.body), sensor: share(hidden.sensor),
            mate: share(hidden.mate), own: share(hidden.own), other: share(hidden.other), box, exploded: exploding(label)};
        }
        out[mode] = layers;
        // The two stacks' silhouettes (their layers whole, tails included) apart on screen, Exploded: the least distance
        // in px of this measure (the picture's own size) from the exploding stack's to the other's, 0 where they overlap.
        if (mode === "exploded") {
          const maskOf = label => {
            const m = new Uint8Array(W * H);
            for (const [key, buffer] of Object.entries(whole)) if (key.startsWith(`${label}.`)) for (let i = 0; i < W * H; i += 1) if (buffer[i] !== Infinity) m[i] = 1;
            return m;
          };
          screenApart = silhouetteGap(maskOf("stack2"), maskOf("stack1"), W, H);
        }
        // Which finger is nearer the camera at this home (the roles' check): the camera's distance to each finger's field
        // (its bottom FPC's, assembled) and to each stack's drawn fields.
        const centroid = pts => { const c = [0, 0, 0]; for (let k = 0; k < pts.length; k += 3) for (let a = 0; a < 3; a += 1) c[a] += pts[k + a]; return new THREE.Vector3(...c.map(v => v / Math.max(1, pts.length / 3))); };
        const fieldOf = (label, names, matrix) => { const o = []; for (const name of names) { const sheet = stack.sheets[name]; sheetPoints(sheet, label && exploding(label) ? sheet.positions : sheet.assembled, matrix, o, 500, true); } return o; };
        const far = c => r3(cam.position.distanceTo(c));
        const f1 = far(centroid(fieldOf(null, ["bottom"], null))); const f2 = far(centroid(fieldOf(null, ["bottom"], mate)));
        sight[mode] = {sensor_field_mm: f1, mate_field_mm: f2, stack1_mm: far(centroid(fieldOf("stack1", LAYERS, null))),
          stack2_mm: far(centroid(fieldOf("stack2", LAYERS, mate))), nearer: f2 < f1 ? "mate" : "sensor"};
      }
      // Stack 1's top FPC field on screen: the picture's px, the card's (x 1/2), the phone band's (3:1, 350 x 116.7 CSS px
      // at a 390 px window): contain (the page's) and cover from the top.
      const box = out.exploded["stack1.top"].box; const size = [box[2] - box[0], box[3] - box[1]];
      const scale = k => size.map(v => Math.round(v * k));
      const screen = {top1_px: size, card_px: scale(0.5), band_contain_css: scale(116.7 / 800), band_cover_css: scale(350 / 1280), stacks_apart_px: screenApart,
        stacks_y_px: [Math.min(out.exploded["stack1.top"].box[1], out.exploded["stack2.top"].box[1]),
          Math.max(...Object.values(out.exploded).map(layer => layer.box[3]))]};
      // Exact clearances (each stack's field: its own finger left out).
      const tri = {body: [], sensor: [], mate: []};
      for (const [role, list] of Object.entries(roles)) for (const item of list) worldTriangles(item.positions, item.index, item.matrix, tri[role]);
      const grids = Object.fromEntries(Object.entries(tri).map(([role, list]) => [role, triangleGrid(list, CELL_MM)]));
      const clearance = {};
      for (const mode of MODES) {
        const stackPoints = {};
        for (const [label, matrix] of [["stack1", null], ["stack2", mate]]) {
          const points = [];
          for (const name of LAYERS) {
            const sheet = stack.sheets[name];
            const exploding = mode === "exploded" && (label === "stack1" || state.info.explodeMate);
            sheetPoints(sheet, exploding ? sheet.positions : sheet.assembled, matrix, points, 500, true);
          }
          stackPoints[label] = points;
        }
        const mm = v => (v === Infinity ? `>${REACH_MM}` : Math.round(v * 10) / 10);
        clearance[mode] = {
          stack1_body: mm(nearestTo(stackPoints.stack1, grids.body, CELL_MM, REACH_MM)), stack1_mate: mm(nearestTo(stackPoints.stack1, grids.mate, CELL_MM, REACH_MM)),
          stack2_body: mm(nearestTo(stackPoints.stack2, grids.body, CELL_MM, REACH_MM)), stack2_sensor: mm(nearestTo(stackPoints.stack2, grids.sensor, CELL_MM, REACH_MM))};
        // The stacks to each other (field points; the sheets are dense grids, a point-to-point bound).
        let best = Infinity; const a = stackPoints.stack1; const b = stackPoints.stack2;
        for (let i = 0; i < a.length; i += 3) for (let j = 0; j < b.length; j += 3) {
          const dd = (a[i] - b[j]) ** 2 + (a[i + 1] - b[j + 1]) ** 2 + (a[i + 2] - b[j + 2]) ** 2;
          if (dd < best) best = dd;
        }
        clearance[mode].stacks = Math.round(Math.sqrt(best) * 10) / 10;
      }
      return {cover: out, screen, clearance, sight, ms: Math.round(performance.now() - t0)};
    }

    function ghost(mesh) {
      if (state.extras.ghosts.has(mesh)) return state.extras.ghosts.get(mesh);
      const depth = new THREE.Mesh(mesh.geometry, ghostDepth); depth.matrixAutoUpdate = false; depth.matrix.copy(mesh.matrix); depth.renderOrder = 20;
      const colour = new THREE.Mesh(mesh.geometry, ghostLook); colour.matrixAutoUpdate = false; colour.matrix.copy(mesh.matrix); colour.renderOrder = 21;
      state.extras.group.add(depth, colour);
      const pair = [depth, colour];
      state.extras.ghosts.set(mesh, pair);
      return pair;
    }

    function lampAt(points, normal, out) {
      // onpart.js filmLampAt's recipe at the camera as it is.
      camera.updateMatrixWorld();
      const x = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const y = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const z = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
      const eye = camera.position; const distance = eye.distanceTo(controls.target);
      const count = points.length / 3; const seen = new Float64Array(points.length); const order = new Uint32Array(count);
      const v = new THREE.Vector3();
      for (let k = 0; k < count; k += 1) {
        v.set(points[3 * k], points[3 * k + 1], points[3 * k + 2]).sub(eye);
        seen[3 * k] = v.dot(x); seen[3 * k + 1] = v.dot(y); seen[3 * k + 2] = v.dot(z); order[k] = k;
      }
      order.sort((a, b) => seen[3 * b + 1] / -seen[3 * b + 2] - seen[3 * a + 1] / -seen[3 * a + 2]);
      const mean = (from, to) => { const sum = new THREE.Vector3(); const end = Math.max(from + 1, to); for (let r = from; r < end; r += 1) sum.add(v.fromArray(seen, 3 * order[r])); return sum.divideScalar(end - from); };
      const middle = mean(Math.floor((5 * count) / 12), Math.floor((7 * count) / 12)); const top = mean(0, Math.floor(count / 6));
      const aim = middle.clone().lerp(top, FILM_LAMP.aim);
      const n = new THREE.Vector3(normal.dot(x), normal.dot(y), normal.dot(z));
      const toCamera = aim.clone().negate().normalize();
      if (n.dot(toCamera) < 0) n.negate();
      const mirror = n.clone().multiplyScalar(2 * n.dot(toCamera)).sub(toCamera);
      out.copy(aim.addScaledVector(mirror, FILM_LAMP.out * distance));
    }

    // Each frame of a gripper's drawing: stack 2's layers ordered as the camera sees them (its sheets shown as stack 1's
    // are), the see-through fingers (in the rules' see_through_modes), both films' lamps (onpart.js's recipe at each film), the studio rolled
    // about the line of sight so the stack's normal is up in it, as at drape.js's homes.  Nothing without a scene.
    scene.onBeforeRender = () => {
      const extras = state.extras;
      if (!extras || !view.stack) return;
      const local = camera.position.clone().applyMatrix4(extras.mateInverse); const target = controls.target.clone().applyMatrix4(extras.mateInverse);
      const outside = local.z >= target.z;
      const order = {bottom: 1, film: 2, top: 3};
      extras.second.children.forEach(group => {
        group.renderOrder = outside ? order[group.userData.sheet] : 4 - order[group.userData.sheet];
        group.children.forEach(mesh => { mesh.visible = !mesh.userData.hidden && mesh.userData.source.visible; });
      });
      const seeing = state.info.seeModes.has(view.mode);
      for (const mesh of extras.fingers) {
        const ghosted = seeing && extras.see.has(mesh.userData.finger);
        mesh.visible = !ghosted;
        if (ghosted || extras.ghosts.has(mesh)) ghost(mesh).forEach(pair => { pair.visible = ghosted; });
      }
      const lamps = state.lamps;
      const key = `${view.mode}:${camera.position.toArray().map(a => a.toFixed(3))}`;
      if (lamps.key !== key) {
        lamps.key = key;
        const film = view.stack.sheets.film;
        const array = view.mode === "assembled" ? film.assembled : film.positions;
        const one = []; const two = [];
        sheetPoints(film, array, null, one, 4000);
        sheetPoints(film, state.info.explodeMate ? array : film.assembled, state.info.mate, two, 4000);
        lamps.one = new THREE.Vector3(); lamps.two = new THREE.Vector3();
        lampAt(one, new THREE.Vector3(0, 0, 1), lamps.one);
        lampAt(two, new THREE.Vector3(0, 0, 1).transformDirection(state.info.mate), lamps.two);
      }
      look.filmLamp.value.copy(lamps.one);
      camera.updateMatrixWorld();
      const n = new THREE.Vector3(0, 0, 1).transformDirection(camera.matrixWorldInverse);
      const roll = Math.atan2(-n.x, n.y);
      look.rotation.setFromQuaternion(camera.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll)));
      extras.filmLook.filmLamp.value.copy(lamps.two);
    };

    function clearExtras(dispose = true) {
      // What a gripper's drawing added taken down (its film materials disposed; dispose false: a lost context's, only
      // dropped, as onpart.js drops its own: webglcontextrestored).
      const extras = state.extras;
      state.extras = null;
      state.lamps = {key: null};
      if (view.part) view.part.visible = true;
      if (!extras) return;
      scene.remove(extras.group);
      if (dispose) {
        extras.materials.forEach(material => material.dispose());
        extras.geometries.forEach(geometry => geometry.dispose());
      }
    }
    // A lost context's extras and bodies dropped, never disposed, once it comes back (onpart.js's own listener first):
    // their GL objects were the lost context's.
    canvas.addEventListener("webglcontextrestored", () => {
      clearExtras(false);
      state.geometries.clear();
    });

    function report() {
      const i = state.info;
      return i && {gap_mm: r3(i.gap_mm), step_mm: r3(i.step_mm), drape_step_mm: r3(i.drape_step_mm), kind: i.kind, explode: i.explode,
        face_tilt_deg: r3(i.face_tilt_deg), see_through: i.see_through, camera: state.rules.camera, home: view.homes, numbers: i.numbers,
        explode_stacks: state.rules.explode_stacks, see_through_modes: state.rules.see_through_modes,
        measures: i.measures};
    }

    return {
      ...figure,
      async show(args) {
        clearExtras();
        if (!args.scene) {
          keepGeometries(new Set());
          defaults();
          return figure.show(args);
        }
        prepare(args.stack, args.scene, args.positions);
        const result = await figure.show(args);
        if (!result) return result;
        build(args.stack, args.scene);
        place(false);
        render();
        return result;
      },
      clear(options) {
        clearExtras();
        keepGeometries(new Set());
        defaults();
        return figure.clear(options);
      },
      info: () => ({...figure.info(), stage: report()}),
    };
  };
}
