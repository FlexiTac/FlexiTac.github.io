// The CAD-mode 3D view (three.js 0.186.1, vendored): the part, the selected
// facets, the selection outline and base edge, the user's border with its drag
// handles, and the sensor overlay mapped by /api/surface/map.  Loaded by main.js
// on the first entry to CAD mode only.
// Display coordinates are millimetres re-centred on the bounding-box centre;
// every point passed in or out of this module is in the STL frame in mm.

import * as THREE from "../vendor/three/three.module.js";
import {OrbitControls} from "../vendor/three/OrbitControls.js";

const CLICK_PX = 4;
const SIDE_PICK_PX = 14;
// Near a corner (several runs within TIE_PX of the nearest on screen) the longer run wins.
const TIE_PX = 2;
// A point counts as visible when the first surface on the camera's ray to it lies no more than
// max(SIGHT_TOLERANCE_MM, SIGHT_TOLERANCE_REL x the part's radius) in front of it.
const SIGHT_TOLERANCE_MM = 0.01;
const SIGHT_TOLERANCE_REL = 0.002;
// Border handles: drawn radius (px, constant on screen) and the grab distance (px).
const HANDLE_PX = {vertex: 6, edge: 5};
const HANDLE_PICK_PX = 12;
// A press this close to a border edge's line (in sight, no handle under it) drags the edge.
const EDGE_PICK_PX = 8;
// Handles closer on screen than this many times the sum of their radii overlap: the later in the list is not drawn.
const HANDLE_GAP = 1.4;
// Beyond the surface a drag follows the nearest facet's plane unless that plane is seen almost edge-on
// (the hit would run away): then the plane through the handle facing the camera.
const DRAG_REACH_RADII = 8;
const TAXEL_LIFT_MM = 0.05;
const COLORS = {
  base: [0.8, 0.82, 0.83], hidden: [0.42, 0.45, 0.48], selected: [0.97, 0.55, 0.16], rejected: [0.86, 0.3, 0.3],
  outline: 0x0b3d91, side: 0xc2185b, row: 0xd7771f, column: 0x087e8b, field: 0x132033, taxel: 0x1a7f3c, stale: 0x9aa5aa,
  leave: 0x5b1a8f, hover: 0xff4fa3, border: 0x1e88e5, borderOutside: 0x546e7a, handle: 0xffffff, handleRing: 0x0d47a1,
  handleHot: 0xffb300, handleSelected: 0xe53935,
};
const VIEWS = {"-x": [-1, 0, 0], "+x": [1, 0, 0], "-y": [0, -1, 0], "+y": [0, 1, 0], "-z": [0, 0, -1], "+z": [0, 0, 1], iso: [-0.62, -0.55, 0.56]};

function dispose(object) {
  object?.traverse?.(node => {
    node.geometry?.dispose();
    (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material?.dispose());
  });
}

const isPoint = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const distance3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Polylines (lists of STL points) from a run, a list of runs, or a loop: a list of points is closed
 * (its last point joined to its first) unless `closed` is false; null entries cut a run (a gap), and a
 * loop with gaps is read from the point after a gap.  Runs of fewer than two points are dropped.
 */
function polylines(value, {closed = false} = {}) {
  if (!Array.isArray(value) || !value.length) return [];
  const flat = value.some(isPoint) || value.every(item => item === null);
  if (!flat) return value.flatMap(run => polylines(run, {closed: false}));
  // Repeated points are dropped (a loop may or may not repeat its first point at its end).
  let points = value.map(item => (isPoint(item) ? item : null))
    .filter((point, i, all) => !(point && i > 0 && all[i - 1] && distance3(point, all[i - 1]) < 1e-9));
  const gap = points.indexOf(null);
  if (gap >= 0 && closed) points = [...points.slice(gap + 1), ...points.slice(0, gap + 1)];
  else if (closed && points.length > 2 && distance3(points[0], points[points.length - 1]) >= 1e-9) points = [...points, points[0]];
  const runs = [[]];
  for (const point of points) {
    if (point) runs[runs.length - 1].push(point);
    else if (runs[runs.length - 1].length) runs.push([]);
  }
  return runs.filter(run => run.length > 1);
}

/**
 * Tubes along polylines (display coordinates, THREE.Vector3): instanced cylinders, one per segment
 * (or per dash with `dash` = [dash, gap] in mm), and spheres where a run turns, so corners stay sharp.
 */
function tubes(runs, radius, color, {opacity = 1, dash = null} = {}) {
  const pieces = [];
  const joints = [];
  for (const run of runs) {
    if (dash) {
      // Dash k covers [k (dash + gap), k (dash + gap) + dash] of the distance along the run; each segment
      // draws its share of the dashes it spans (an integer walk: it always ends).
      const period = dash[0] + dash[1];
      let along = 0;
      for (let i = 0; i + 1 < run.length; i += 1) {
        const a = run[i]; const b = run[i + 1]; const length = a.distanceTo(b);
        if (!(length > 1e-9)) continue;
        for (let k = Math.floor(along / period); k * period < along + length; k += 1) {
          const start = Math.max(0, k * period - along); const end = Math.min(length, k * period + dash[0] - along);
          if (end - start > 1e-6) pieces.push([a.clone().lerp(b, start / length), a.clone().lerp(b, end / length)]);
        }
        along += length;
      }
      continue;
    }
    for (let i = 0; i + 1 < run.length; i += 1) if (run[i].distanceToSquared(run[i + 1]) > 1e-12) pieces.push([run[i], run[i + 1]]);
    const closed = run.length > 2 && run[0].distanceToSquared(run[run.length - 1]) < 1e-12;
    for (let i = closed ? 0 : 1; i < run.length - 1; i += 1) {
      const before = run[i].clone().sub(run[i === 0 ? run.length - 2 : i - 1]);
      const after = run[i + 1].clone().sub(run[i]);
      // A sphere only where the run turns by more than about 3 degrees (a densified curve needs none).
      if (before.lengthSq() > 0 && after.lengthSq() > 0 && before.angleTo(after) > 0.05) joints.push(run[i]);
    }
  }
  const material = new THREE.MeshBasicMaterial({color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1});
  const group = new THREE.Group();
  const matrix = new THREE.Matrix4(); const rotation = new THREE.Quaternion(); const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0); const middle = new THREE.Vector3(); const direction = new THREE.Vector3();
  if (pieces.length) {
    const cylinders = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, false), material, pieces.length);
    pieces.forEach(([a, b], index) => {
      direction.subVectors(b, a);
      const length = direction.length();
      rotation.setFromUnitVectors(yAxis, direction.divideScalar(length));
      cylinders.setMatrixAt(index, matrix.compose(middle.addVectors(a, b).multiplyScalar(0.5), rotation, scale.set(radius, length, radius)));
    });
    cylinders.instanceMatrix.needsUpdate = true;
    cylinders.computeBoundingSphere();
    group.add(cylinders);
  }
  if (joints.length) {
    const spheres = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), material, joints.length);
    rotation.identity();
    joints.forEach((point, index) => spheres.setMatrixAt(index, matrix.compose(point, rotation, scale.set(radius, radius, radius))));
    spheres.instanceMatrix.needsUpdate = true;
    spheres.computeBoundingSphere();
    group.add(spheres);
  }
  group.userData.segments = pieces.length;
  return group;
}

/** Create the viewer in `host`; throws when WebGL is unavailable. */
export function createViewer(host, {onClick = null} = {}) {
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = "cad-canvas";
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2f5f6);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  camera.up.set(0, 0, 1);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(0.3, 0.6, 1);
  camera.add(sun);
  scene.add(camera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.listenToKeyEvents(host);  // arrow keys pan while the view has the focus
  const raycaster = new THREE.Raycaster();
  const sightRay = new THREE.Raycaster();  // occlusion tests (near/far set per test)
  const dragRay = new THREE.Raycaster();
  const groups = {mesh: null, outline: null, side: null, overlay: null, axes: null, hover: null, border: null, handles: null};
  const model = {center: [0, 0, 0], radius: 1, facets: 0, hidden: new Set(), selection: [], rejected: false};
  // The border editor: the handles (STL points), the one under the pointer or held ("kind:index"),
  // whether editing is on, the drag in progress and its listener; the selection's facets as a mesh
  // of their own for the drag's ray (built on demand).
  // and the border's edges on the part (runs of STL points by edge, or a function giving them) for a press on a line;
  // shown: the handles drawn at the last render (in sight, not overlapping a handle before them in the list)
  const border = {handles: [], hot: null, editing: false, drag: null, onDrag: null, surface: null, edges: null, shown: null};
  let pending = false;
  let overlayStale = false;

  function render() {
    placeHandles();
    renderer.render(scene, camera);
  }
  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; render(); });
  }
  controls.addEventListener("change", requestRender);

  function resize() {
    const width = host.clientWidth; const height = host.clientHeight;
    if (!(width > 0 && height > 0)) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  }
  new ResizeObserver(resize).observe(host);

  const local = point => new THREE.Vector3(point[0] - model.center[0], point[1] - model.center[1], point[2] - model.center[2]);
  function replace(key, object) {
    if (groups[key]) { scene.remove(groups[key]); dispose(groups[key]); }
    groups[key] = object;
    if (object) scene.add(object);
    requestRender();
  }

  function paint() {
    const mesh = groups.mesh;
    if (!mesh) return;
    const colors = mesh.geometry.getAttribute("color");
    const array = colors.array;
    const fill = (facet, rgb) => { for (let j = 0; j < 9; j += 3) { array[9 * facet + j] = rgb[0]; array[9 * facet + j + 1] = rgb[1]; array[9 * facet + j + 2] = rgb[2]; } };
    for (let facet = 0; facet < model.facets; facet += 1) fill(facet, model.hidden.has(facet) ? COLORS.hidden : COLORS.base);
    const chosen = model.rejected ? COLORS.rejected : COLORS.selected;
    for (const facet of model.selection) if (facet >= 0 && facet < model.facets) fill(facet, chosen);
    colors.needsUpdate = true;
    requestRender();
  }

  /** Show a mesh: positions in file units (9 floats per facet), scaled to mm. */
  function setMesh(positions, scaleToMm, hiddenFacets = []) {
    const facets = positions.length / 9;
    if (!(facets >= 1)) throw new Error("setMesh needs at least one facet.");
    const low = [Infinity, Infinity, Infinity]; const high = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 1) {
      const value = positions[i] * scaleToMm; const axis = i % 3;
      if (value < low[axis]) low[axis] = value;
      if (value > high[axis]) high[axis] = value;
    }
    model.center = [0, 1, 2].map(axis => 0.5 * (low[axis] + high[axis]));
    model.radius = Math.max(1e-3, 0.5 * Math.hypot(high[0] - low[0], high[1] - low[1], high[2] - low[2]));
    model.facets = facets;
    model.hidden = new Set(hiddenFacets);
    model.selection = [];
    model.rejected = false;
    const display = new Float32Array(positions.length);
    const normals = new Float32Array(positions.length);
    for (let facet = 0; facet < facets; facet += 1) {
      const p = [];
      for (let k = 0; k < 9; k += 1) { p.push(positions[9 * facet + k] * scaleToMm); display[9 * facet + k] = p[k] - model.center[k % 3]; }
      // Flat normals from the winding (stored STL normals may be zero).
      const ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2], vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length; ny /= length; nz /= length;
      for (let j = 0; j < 9; j += 3) { normals[9 * facet + j] = nx; normals[9 * facet + j + 1] = ny; normals[9 * facet + j + 2] = nz; }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(display, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(display.length), 3));
    geometry.computeBoundingSphere();
    // Non-indexed and in file order: the raycaster's faceIndex is the STL facet id.
    const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
      vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }));
    endDrag();
    ["outline", "side", "overlay", "hover", "border", "handles"].forEach(key => replace(key, null));
    border.handles = [];
    border.hot = null;
    replace("mesh", mesh);
    forgetSurface();
    const axes = new THREE.AxesHelper(model.radius * 0.25);
    axes.position.copy(local(low));
    replace("axes", axes);
    paint();
    view("iso");
  }

  /** Remove the mesh and everything drawn on it (a file the server refused). */
  function clear() {
    endDrag();
    ["mesh", "outline", "side", "overlay", "axes", "hover", "border", "handles"].forEach(key => replace(key, null));
    model.facets = 0;
    model.hidden = new Set();
    model.selection = [];
    model.rejected = false;
    border.handles = [];
    border.hot = null;
    forgetSurface();
  }

  function setSelection(facets, {rejected = false} = {}) {
    model.selection = Array.isArray(facets) ? facets : [];
    model.rejected = rejected;
    forgetSurface();
    paint();
  }

  function polyline(points, color, closed = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(local));
    const material = new THREE.LineBasicMaterial({color});
    return closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
  }

  /** The selection's outer boundary (a loop of STL points in mm). */
  function setOutline(loop) {
    replace("outline", Array.isArray(loop) && loop.length > 1 ? polyline(loop, COLORS.outline, true) : null);
  }

  /**
   * Highlight the tail exit with tubes: one run of STL points in mm, a list of runs, or none; `outsideRuns`
   * (runs of STL points: a border edge's parts beyond the surface) are dashed in the same colour.
   */
  function setSide(points, {outsideRuns = null} = {}) {
    const runs = (Array.isArray(points?.[0]?.[0]) ? points : [points]).filter(run => Array.isArray(run) && run.length > 1);
    const outside = polylines(outsideRuns).map(run => run.map(local));
    if (!runs.length && !outside.length) { replace("side", null); return; }
    const radius = Math.max(0.15, model.radius * 0.006);
    const material = new THREE.MeshBasicMaterial({color: COLORS.side});
    const group = new THREE.Group();
    for (const run of runs) {
      const path = new THREE.CurvePath();
      for (let i = 0; i + 1 < run.length; i += 1) path.add(new THREE.LineCurve3(local(run[i]), local(run[i + 1])));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(1, run.length - 1) * 4, radius, 8, false), material));
    }
    // Dashed like the border beyond the surface (setBorder), at the exit's thickness (over the border's dashes).
    const dash = Math.max(0.5, model.radius * 0.025);
    const dashed = outside.length ? tubes(outside, radius, COLORS.side, {dash: [dash, 0.7 * dash]}) : null;
    if (dashed) group.add(dashed);
    group.userData = {segments: runs.reduce((total, run) => total + run.length - 1, 0), outsideSegments: dashed?.userData.segments || 0};
    replace("side", group);
  }

  function segments(runs) {
    const points = [];
    for (const run of Array.isArray(runs) ? runs : []) {
      for (let i = 0; i + 1 < run.length; i += 1) points.push(local(run[i]), local(run[i + 1]));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  function edgeEnds(runs) {
    // The ends of a board's mapped outline runs that meet no other run's end: where the board leaves the
    // surface (a closed run, or two runs joined at the outline's first point, has none).
    const ends = [];
    for (const run of Array.isArray(runs) ? runs : []) if (Array.isArray(run) && run.length > 1) ends.push(run[0], run[run.length - 1]);
    const same = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-6;
    return ends.filter((point, index) => !ends.some((other, k) => k !== index && same(point, other)));
  }

  /** The mapped sensor: overlay runs, markers where a board leaves the surface, and taxel discs; null clears it. */
  function setOverlay(map, {taxelRadiusMm = 0.5} = {}) {
    if (!map) { replace("overlay", null); return; }
    const group = new THREE.Group();
    for (const key of ["row", "column", "field"]) {
      const material = new THREE.LineBasicMaterial({color: COLORS[key], transparent: true});
      material.userData.color = COLORS[key];
      group.add(new THREE.LineSegments(segments(map.overlay?.[key]), material));
    }
    let markers = 0;
    for (const key of ["row", "column"]) {
      const ends = edgeEnds(map.overlay?.[key]);
      if (!ends.length) continue;
      // Large and in one dark colour of their own, so that they stand out against the board's line where it leaves.
      const marker = new THREE.SphereGeometry(Math.max(0.6, model.radius * 0.02), 16, 10);
      const material = new THREE.MeshBasicMaterial({color: COLORS.leave, transparent: true});
      material.userData.color = COLORS.leave;
      const instances = new THREE.InstancedMesh(marker, material, ends.length);
      const matrix = new THREE.Matrix4();
      ends.forEach((point, index) => instances.setMatrixAt(index, matrix.makeTranslation(local(point))));
      instances.instanceMatrix.needsUpdate = true;
      group.add(instances);
      markers += ends.length;
    }
    group.userData.markers = markers;
    const taxels = Array.isArray(map.taxels) ? map.taxels : [];
    if (taxels.length) {
      const disc = new THREE.CircleGeometry(Math.max(0.05, taxelRadiusMm), 16);
      const material = new THREE.MeshBasicMaterial({color: COLORS.taxel, side: THREE.DoubleSide, transparent: true});
      material.userData.color = COLORS.taxel;
      const instances = new THREE.InstancedMesh(disc, material, taxels.length);
      const matrix = new THREE.Matrix4(); const rotation = new THREE.Quaternion(); const unit = new THREE.Vector3(1, 1, 1);
      const zAxis = new THREE.Vector3(0, 0, 1);
      taxels.forEach((taxel, index) => {
        const normal = new THREE.Vector3(...taxel.normal).normalize();
        rotation.setFromUnitVectors(zAxis, normal);
        const position = local(taxel.xyz_mm).addScaledVector(normal, TAXEL_LIFT_MM);
        instances.setMatrixAt(index, matrix.compose(position, rotation, unit));
      });
      instances.instanceMatrix.needsUpdate = true;
      group.add(instances);
    }
    group.userData.taxels = taxels.length;
    replace("overlay", group);
    setOverlayStale(overlayStale);
  }

  /** Grey the overlay while the form no longer matches the mapped build. */
  function setOverlayStale(stale) {
    overlayStale = Boolean(stale);
    groups.overlay?.traverse(node => {
      if (!node.material?.userData?.color) return;
      node.material.color.setHex(overlayStale ? COLORS.stale : node.material.userData.color);
      node.material.opacity = overlayStale ? 0.45 : 1;
    });
    requestRender();
  }

  // The bands of the view its tools cover (CSS px: `top` at its top and bottom, `side` at its left and right), kept clear
  // when the camera frames the part or a selection (setClearance; main.js measures them).
  let clearance = {top: 0, side: 0};
  function setClearance(next = {}) { clearance = {top: Math.max(0, next.top || 0), side: Math.max(0, next.side || 0)}; }
  function room(bands) {
    // The half size a framed sphere may take: the view's smaller half less the tools' bands (a third of it at least).
    const rect = renderer.domElement.getBoundingClientRect();
    const [halfW, halfH] = [Math.max(rect.width, 1) / 2, Math.max(rect.height, 1) / 2];
    return {halfH, basis: Math.min(halfH, halfW), room: Math.max(Math.min(halfH - bands.top, halfW - bands.side), Math.min(halfH, halfW) / 3)};
  }

  function view(direction, bands = clearance) {
    const d = VIEWS[direction] || VIEWS.iso;
    const length = Math.hypot(...d);
    controls.target.set(0, 0, 0);
    camera.up.set(0, 0, 1);
    if (direction === "+z" || direction === "-z") camera.up.set(0, 1, 0);
    // 3.4 radii away, farther by as much as the tools' bands take from the view.
    const space = room({top: bands.top || 0, side: bands.side || 0});
    const distance = model.radius * 3.4 * space.basis / space.room;
    camera.position.set(d[0] / length * distance, d[1] / length * distance, d[2] / length * distance);
    camera.near = model.radius * 0.01;
    camera.far = model.radius * 40;
    camera.updateProjectionMatrix();
    controls.update();
    requestRender();
  }

  /** Look at a point along a normal (both STL frame), framing a sphere of `radius` mm around it, centred and clear of
   *  `bands` (CSS px of the view covered by tools: `top` at its top and bottom, `side` at its left and right). */
  function lookAt(point, normal, radius = model.radius, bands = clearance) {
    const target = local(point);
    const n = new THREE.Vector3(...normal);
    if (!(n.length() > 0)) return;
    n.normalize();
    controls.target.copy(target);
    camera.up.set(0, 0, 1);
    if (Math.abs(n.z) > 0.9) camera.up.set(0, 1, 0);
    // A length r at distance d spans r / (d tan(fov / 2)) of the half height; the sphere keeps to the room the tools
    // leave (without any, the half of the smaller side, as before).
    const space = room({top: bands.top || 0, side: bands.side || 0});
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.copy(target).addScaledVector(n, Math.max(radius, 0.5) * 1.15 * space.halfH / (space.room * tan));
    controls.update();
    requestRender();
  }

  function ndc(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  }

  /** The facet under a screen point: {facet, point (STL mm)} or null. */
  function pick(clientX, clientY) {
    if (!groups.mesh) return null;
    raycaster.setFromCamera(ndc(clientX, clientY), camera);
    const hit = raycaster.intersectObject(groups.mesh, false)[0];
    if (!hit) return null;
    return {facet: hit.faceIndex, point: [hit.point.x + model.center[0], hit.point.y + model.center[1], hit.point.z + model.center[2]]};
  }

  /** Screen position (client px) of an STL point in mm, or null behind the camera. */
  function project(point) {
    const v = local(point).project(camera);
    if (v.z > 1) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    return [rect.left + (v.x + 1) / 2 * rect.width, rect.top + (1 - v.y) / 2 * rect.height];
  }

  /**
   * The point of the runs (side polylines, STL mm) nearest a screen point within SIDE_PICK_PX:
   * {index (of the run), point (STL mm, interpolated on the nearest segment)}, or null.
   */
  function nearestPoint(runs, clientX, clientY) {
    let best = null;
    runs.forEach((run, index) => {
      for (let i = 0; i + 1 < run.length; i += 1) {
        const a = project(run[i]); const b = project(run[i + 1]);
        if (!a || !b) continue;
        const dx = b[0] - a[0]; const dy = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((clientX - a[0]) * dx + (clientY - a[1]) * dy) / (dx * dx + dy * dy || 1)));
        const distance = Math.hypot(clientX - a[0] - t * dx, clientY - a[1] - t * dy);
        if (!best || distance < best.distance) best = {index, distance, point: [0, 1, 2].map(k => run[i][k] + t * (run[i + 1][k] - run[i][k]))};
      }
    });
    return best && best.distance <= SIDE_PICK_PX ? {index: best.index, point: best.point} : null;
  }
  /** Index of the run nearest a screen point within SIDE_PICK_PX, or null. */
  function nearestRun(runs, clientX, clientY) {
    return nearestPoint(runs, clientX, clientY)?.index ?? null;
  }

  // -- occlusion-aware picking ----------------------------------------------------------------

  const toStl = v => [v.x + model.center[0], v.y + model.center[1], v.z + model.center[2]];
  const sightTolerance = () => Math.max(SIGHT_TOLERANCE_MM, SIGHT_TOLERANCE_REL * model.radius);
  function eye() {
    camera.updateMatrixWorld();
    return new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
  }

  /** Client px and clip w (the depth along the view) of an STL point, or null behind the camera (current matrices). */
  function screenOf(point, rect = renderer.domElement.getBoundingClientRect()) {
    const v = local(point).applyMatrix4(camera.matrixWorldInverse);
    const w = -v.z;
    if (!(w > 0)) return null;
    v.applyMatrix4(camera.projectionMatrix);
    if (v.z > 1) return null;
    return {x: rect.left + (v.x + 1) / 2 * rect.width, y: rect.top + (1 - v.y) / 2 * rect.height, w};
  }

  /**
   * Whether the part hides an STL point from the camera: the camera's ray to the point meets the mesh more
   * than the sight tolerance plus `slackMm` before it.  A point on the mesh's surface facing the camera, or
   * on a silhouette, is visible.
   */
  function occluded(point, slackMm = 0) {
    if (!groups.mesh || !isPoint(point)) return false;
    const origin = eye();
    const direction = local(point).sub(origin);
    const distance = direction.length();
    const tolerance = sightTolerance() + slackMm;
    if (!(distance > tolerance)) return false;
    sightRay.set(origin, direction.divideScalar(distance));
    sightRay.near = 0;
    sightRay.far = distance - tolerance;
    return sightRay.intersectObject(groups.mesh, false).length > 0;
  }
  /** Whether an STL point (mm) is in sight of the camera (not hidden by the part). */
  function isVisible(point) {
    return isPoint(point) && !occluded(point);
  }

  /**
   * nearestPoint for points in sight only: the point of the runs (STL mm) nearest a screen point within
   * SIDE_PICK_PX that the part does not hide, {index (of the run), point (STL mm, on the segment under
   * the cursor's projection, perspective-correct), distance (px)}, or null.  A side behind the part never
   * wins over the visible side under the cursor.  Near a corner (runs within `tiePx` of the nearest) the
   * longest run wins; {tiePx: 0} keeps the nearest.
   */
  function nearestVisiblePoint(runs, clientX, clientY, {tiePx = TIE_PX} = {}) {
    camera.updateMatrixWorld();
    const rect = renderer.domElement.getBoundingClientRect();
    const candidates = []; const lengths = [];
    (Array.isArray(runs) ? runs : []).forEach((run, index) => {
      lengths[index] = 0;
      if (!Array.isArray(run)) return;
      for (let i = 0; i + 1 < run.length; i += 1) {
        if (!isPoint(run[i]) || !isPoint(run[i + 1])) continue;
        lengths[index] += distance3(run[i], run[i + 1]);
        const a = screenOf(run[i], rect); const b = screenOf(run[i + 1], rect);
        if (!a || !b) continue;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((clientX - a.x) * dx + (clientY - a.y) * dy) / (dx * dx + dy * dy || 1)));
        const distance = Math.hypot(clientX - a.x - t * dx, clientY - a.y - t * dy);
        if (distance > SIDE_PICK_PX) continue;
        // The screen parameter t back on the 3D segment: s = t wA / ((1 - t) wB + t wA).
        const s = t * a.w / ((1 - t) * b.w + t * a.w);
        candidates.push({index, distance, point: [0, 1, 2].map(k => run[i][k] + s * (run[i + 1][k] - run[i][k]))});
      }
    });
    candidates.sort((p, q) => p.distance - q.distance || p.index - q.index);
    const inSight = new Map();
    let best = null;
    for (const candidate of candidates) {
      if (best && candidate.distance > best.distance + tiePx) break;
      if (inSight.has(candidate.index) || occluded(candidate.point)) continue;
      inSight.set(candidate.index, candidate);
      best ??= candidate;
    }
    if (!best) return null;
    let chosen = best;
    for (const candidate of inSight.values()) if (lengths[candidate.index] > lengths[chosen.index] + 1e-9) chosen = candidate;
    return {index: chosen.index, point: chosen.point, distance: chosen.distance};
  }

  const sideRadius = () => Math.max(0.15, model.radius * 0.006);
  /** Highlight the side under the cursor (a run of STL points, a list of runs, or null), around the exit's tube. */
  function setHoverRun(run) {
    const runs = polylines(run).map(points => points.map(local));
    replace("hover", runs.length ? tubes(runs, 1.6 * sideRadius(), COLORS.hover, {opacity: 0.55}) : null);
  }

  // -- the border ------------------------------------------------------------------------------

  /**
   * The user's border on the part: `loop` is its points on the surface (STL mm; a closed loop, null
   * entries where it leaves the surface; or a list of open runs) drawn as a solid tube, and
   * `outsideRuns` its parts beyond the surface (runs of STL points), dashed: no taxels there.
   * null (and no outside runs) removes it.
   */
  function setBorder(loop, {outsideRuns = null} = {}) {
    const inside = polylines(loop, {closed: true}).map(run => run.map(local));
    const outside = polylines(outsideRuns).map(run => run.map(local));
    if (!inside.length && !outside.length) { replace("border", null); return; }
    const group = new THREE.Group();
    const radius = Math.max(0.1, model.radius * 0.004);
    const solid = inside.length ? tubes(inside, radius, COLORS.border) : null;
    const dash = Math.max(0.5, model.radius * 0.025);
    const dashed = outside.length ? tubes(outside, radius, COLORS.borderOutside, {dash: [dash, 0.7 * dash]}) : null;
    [solid, dashed].forEach(part => part && group.add(part));
    group.userData = {segments: solid?.userData.segments || 0, outsideSegments: dashed?.userData.segments || 0};
    replace("border", group);
  }

  /** The handle's drawn radius in mm at its distance from the camera (HANDLE_PX on screen). */
  function handleSize(position, kind, from = eye()) {
    const height = renderer.domElement.clientHeight || 1;
    const perPixel = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / height;
    return Math.max(1e-6, from.distanceTo(position) * perPixel * HANDLE_PX[kind]);
  }

  /**
   * The border's drag handles: [{kind: "vertex"|"edge", index, xyz (STL mm), selected (drawn red)}] or null; shown while
   * editing.  The list's order is the priority where handles overlap on screen (the selected and the hot one first).
   * `edges`: the border's edges on the part, by edge index (runs of STL points, or a function returning them when a
   * press needs them), so a press on an edge's line drags it.
   */
  function setBorderHandles(list, {edges = null} = {}) {
    border.edges = edges;
    border.shown = null;
    border.handles = (Array.isArray(list) ? list : [])
      .filter(handle => handle && (handle.kind === "vertex" || handle.kind === "edge") && Number.isInteger(handle.index) && isPoint(handle.xyz))
      .map(handle => ({kind: handle.kind, index: handle.index, xyz: handle.xyz.slice(), selected: Boolean(handle.selected)}));
    if (!border.handles.length) { replace("handles", null); return; }
    const group = new THREE.Group();
    const shapes = {vertex: new THREE.SphereGeometry(1, 16, 12), edge: new THREE.OctahedronGeometry(1.2)};
    for (const handle of border.handles) {
      // Drawn over the part (a handle half inside the surface stays whole); a handle the part hides is not drawn.
      const node = new THREE.Group();
      node.position.copy(local(handle.xyz));
      node.userData = {kind: handle.kind, key: `${handle.kind}:${handle.index}`, xyz: handle.xyz, selected: handle.selected};
      const ring = new THREE.Mesh(shapes[handle.kind], new THREE.MeshBasicMaterial({color: COLORS.handleRing, side: THREE.BackSide, depthTest: false, transparent: true}));
      const core = new THREE.Mesh(shapes[handle.kind], new THREE.MeshBasicMaterial({color: COLORS.handle, depthTest: false, transparent: true}));
      ring.scale.setScalar(1.4);
      ring.renderOrder = 20;
      core.renderOrder = 21;
      node.add(ring, core);
      group.add(node);
    }
    group.visible = border.editing;
    replace("handles", group);
    placeHandles();
    paintHandles();
  }
  function paintHandles() {
    groups.handles?.children.forEach(node => node.children[1].material.color.setHex(node.userData.key === border.hot ? COLORS.handleHot : node.userData.selected ? COLORS.handleSelected : COLORS.handle));
    requestRender();
  }
  function setHot(key) {
    if (border.hot === key) return;
    border.hot = key;
    paintHandles();
  }
  // Before each render: the handles' size on screen, and the ones the part hides or that overlap a handle before them
  // (a faceted arc's many short edges) left out; zooming in brings them back.
  function placeHandles() {
    const group = groups.handles;
    if (!group || !group.visible) return;
    const from = eye();
    const rect = renderer.domElement.getBoundingClientRect();
    const placed = [];
    border.shown = new Set();
    const first = node => (node.userData.selected ? 0 : node.userData.key === border.hot ? 1 : 2);
    const nodes = group.children.map((node, order) => ({node, order})).sort((a, b) => first(a.node) - first(b.node) || a.order - b.order);
    for (const {node} of nodes) {
      const hot = node.userData.key === border.hot;
      const size = handleSize(node.position, node.userData.kind, from) * (hot ? 1.3 : 1);
      node.scale.setScalar(size);
      const at = occluded(node.userData.xyz, size) ? null : screenOf(node.userData.xyz, rect);
      const radius = HANDLE_PX[node.userData.kind] * (hot ? 1.3 : 1);
      node.visible = Boolean(at) && !placed.some(p => Math.hypot(p.x - at.x, p.y - at.y) < HANDLE_GAP * (p.radius + radius));
      if (!node.visible) continue;
      placed.push({x: at.x, y: at.y, radius});
      border.shown.add(node.userData.key);
    }
  }

  /** The handle under a screen point (within HANDLE_PICK_PX, in sight; a vertex wins a near tie): {kind, index, xyz} or null. */
  function pickHandle(clientX, clientY) {
    if (!border.handles.length) return null;
    camera.updateMatrixWorld();
    const rect = renderer.domElement.getBoundingClientRect();
    const from = eye();
    const near = [];
    for (const handle of border.handles) {
      if (border.shown && !border.shown.has(`${handle.kind}:${handle.index}`)) continue;  // not drawn: overlapped
      const at = screenOf(handle.xyz, rect);
      const distance = at ? Math.hypot(at.x - clientX, at.y - clientY) : Infinity;
      if (distance <= HANDLE_PICK_PX) near.push({handle, rank: distance - (handle.kind === "vertex" ? TIE_PX : 0)});
    }
    near.sort((a, b) => a.rank - b.rank);
    const found = near.find(({handle}) => !occluded(handle.xyz, handleSize(local(handle.xyz), handle.kind, from)));
    return found ? {kind: found.handle.kind, index: found.handle.index, xyz: found.handle.xyz.slice()} : null;
  }
  /** The border edge whose line (in sight) passes within EDGE_PICK_PX of a screen point: {kind: "edge", index, xyz, line: true} or null. */
  function pickEdgeLine(clientX, clientY) {
    const edges = typeof border.edges === "function" ? border.edges() : border.edges;
    if (!Array.isArray(edges) || !edges.length) return null;
    const near = nearestVisiblePoint(edges, clientX, clientY, {tiePx: 0});
    return near && near.distance <= EDGE_PICK_PX ? {kind: "edge", index: near.index, xyz: near.point.slice(), line: true} : null;
  }
  /** What a press at a screen point grabs while editing: a handle, else an edge's line, else null. */
  function pickBorder(clientX, clientY) {
    return pickHandle(clientX, clientY) ?? pickEdgeLine(clientX, clientY);
  }

  // The selection's facets as a mesh of their own (display coordinates) for the drag's ray, and their
  // triangles for the nearest-facet search beyond the surface; slots[k] is the position in the selection.
  function selectionSurface() {
    if (border.surface) return border.surface;
    const mesh = groups.mesh;
    if (!mesh || model.rejected) return null;
    const source = mesh.geometry.getAttribute("position").array;
    const slots = [];
    model.selection.forEach((facet, slot) => { if (Number.isInteger(facet) && facet >= 0 && facet < model.facets) slots.push(slot); });
    if (!slots.length) return null;
    const positions = new Float32Array(9 * slots.length);
    slots.forEach((slot, k) => positions.set(source.subarray(9 * model.selection[slot], 9 * model.selection[slot] + 9), 9 * k));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const surface = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide}));
    surface.updateMatrixWorld(true);
    border.surface = {mesh: surface, slots, triangles: null};
    return border.surface;
  }
  function forgetSurface() {
    if (border.surface) dispose(border.surface.mesh);
    border.surface = null;
  }
  /** The selection's facet nearest a display point: {k (in the surface mesh), triangle, distance (mm)} or null. */
  function nearestFacet(surface, point) {
    if (!surface.triangles) {
      const p = surface.mesh.geometry.getAttribute("position").array;
      surface.triangles = surface.slots.map((slot, k) => {
        const o = 9 * k;
        const triangle = new THREE.Triangle(new THREE.Vector3(p[o], p[o + 1], p[o + 2]), new THREE.Vector3(p[o + 3], p[o + 4], p[o + 5]), new THREE.Vector3(p[o + 6], p[o + 7], p[o + 8]));
        return triangle.getArea() > 1e-12 ? triangle : null;  // a degenerate facet has no plane
      });
    }
    const closest = new THREE.Vector3();
    let best = null;
    surface.triangles.forEach((triangle, k) => {
      if (!triangle) return;
      const distance = triangle.closestPointToPoint(point, closest).distanceTo(point);
      if (!best || distance < best.distance) best = {k, triangle, distance};
    });
    return best;
  }

  /**
   * The drag's point under a screen point: the ray's first hit on the selection's facets ({xyz, facet,
   * selectionIndex}), or beyond them its hit on the plane of the selection's facet nearest `last` (the
   * handle's position, STL mm; facet null).  A plane seen edge-on, or no selection: the plane through `last`
   * facing the camera.
   */
  function dragPoint(clientX, clientY, last) {
    camera.updateMatrixWorld();
    dragRay.setFromCamera(ndc(clientX, clientY), camera);
    const surface = selectionSurface();
    if (surface) {
      const hit = dragRay.intersectObject(surface.mesh, false)[0];
      if (hit) {
        const slot = surface.slots[hit.faceIndex];
        return {xyz: toStl(hit.point), facet: model.selection[slot], selectionIndex: slot};
      }
    }
    const anchor = local(last);
    const target = new THREE.Vector3();
    const nearest = surface ? nearestFacet(surface, anchor) : null;
    if (nearest) {
      const plane = nearest.triangle.getPlane(new THREE.Plane());
      if (dragRay.ray.intersectPlane(plane, target) && target.distanceTo(anchor) <= DRAG_REACH_RADII * model.radius) {
        return {xyz: toStl(target), facet: null, selectionIndex: null};
      }
    }
    const facing = new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), anchor);
    return dragRay.ray.intersectPlane(facing, target) ? {xyz: toStl(target), facet: null, selectionIndex: null} : null;
  }

  function emitDrag(phase, drag = border.drag) {
    border.onDrag?.({kind: drag.kind, index: drag.index, phase, xyz: drag.last.slice(), facet: drag.facet, selectionIndex: drag.selectionIndex});
  }
  function startDrag(event, handle) {
    // The handle keeps its offset from the pointer: it does not jump to the pointer on the first move.
    const at = screenOf(handle.xyz);
    let facet = null; let selectionIndex = null;
    const surface = selectionSurface();
    const nearest = surface ? nearestFacet(surface, local(handle.xyz)) : null;
    if (nearest && nearest.distance <= sightTolerance()) {
      selectionIndex = surface.slots[nearest.k];
      facet = model.selection[selectionIndex];
    }
    border.drag = {kind: handle.kind, index: handle.index, pointerId: event.pointerId, offset: at ? [at.x - event.clientX, at.y - event.clientY] : [0, 0],
      last: handle.xyz.slice(), facet, selectionIndex, controls: controls.enabled, press: [event.clientX, event.clientY], moved: false};
    controls.enabled = false;
    setHot(`${handle.kind}:${handle.index}`);
    renderer.domElement.style.cursor = "grabbing";
    emitDrag("start");
  }
  function endDrag() {
    const drag = border.drag;
    if (!drag) return;
    border.drag = null;
    controls.enabled = drag.controls;
    try {
      if (renderer.domElement.hasPointerCapture?.(drag.pointerId)) renderer.domElement.releasePointerCapture(drag.pointerId);
    } catch (error) { /* the pointer is gone */ }
    renderer.domElement.style.cursor = "";
    emitDrag("end", drag);
  }

  /** callback({kind, index, phase: "start"|"move"|"end", xyz, facet, selectionIndex}) while a handle is dragged; null removes it. */
  function onBorderDrag(callback) {
    border.onDrag = typeof callback === "function" ? callback : null;
  }
  /** Editing on: the handles are shown and a left press on one drags it (no orbit); off: hidden, click and orbit as before. */
  function setBorderEditing(on) {
    border.editing = Boolean(on);
    if (!border.editing) {
      endDrag();
      setHot(null);
      renderer.domElement.style.cursor = "";
    }
    if (groups.handles) groups.handles.visible = border.editing;
    placeHandles();
    requestRender();
  }

  // While editing, a left press on a handle drags it.  These listeners sit on the host in the capture
  // phase, so they run before the orbit controls' and the click's listeners on the canvas, which then
  // never see the press, the moves or the release of a handle drag.
  const canvas = renderer.domElement;
  host.addEventListener("pointerdown", event => {
    if (event.target !== canvas || !border.editing || border.drag || event.button !== 0) return;
    const handle = pickBorder(event.clientX, event.clientY);
    if (!handle) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); } catch (error) { /* not an active pointer */ }
    startDrag(event, handle);
  }, {capture: true});
  host.addEventListener("pointermove", event => {
    const drag = border.drag;
    if (drag) {
      if (event.pointerId !== drag.pointerId) return;
      event.stopImmediatePropagation();
      if (Math.hypot(event.clientX - drag.press[0], event.clientY - drag.press[1]) >= CLICK_PX) drag.moved = true;
      const point = dragPoint(event.clientX + drag.offset[0], event.clientY + drag.offset[1], drag.last);
      if (!point) return;
      Object.assign(drag, {last: point.xyz, facet: point.facet, selectionIndex: point.selectionIndex});
      emitDrag("move");
      return;
    }
    if (!border.editing || event.target !== canvas || event.buttons !== 0) return;
    const handle = pickBorder(event.clientX, event.clientY);
    setHot(handle ? `${handle.kind}:${handle.index}` : null);
    canvas.style.cursor = handle ? "grab" : "";
  }, {capture: true});
  const release = event => {
    const drag = border.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopImmediatePropagation();
    endDrag();
    // A press on an edge that did not move is a click (the Base edge tool picks that edge).
    if (event.type === "pointerup" && drag.kind === "edge" && !drag.moved && onClick) {
      onClick({clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey, altKey: event.altKey});
    }
    const handle = event.type === "pointerup" ? pickBorder(event.clientX, event.clientY) : null;
    setHot(handle ? `${handle.kind}:${handle.index}` : null);
    if (handle) canvas.style.cursor = "grab";
  };
  host.addEventListener("pointerup", release, {capture: true});
  host.addEventListener("pointercancel", release, {capture: true});
  canvas.addEventListener("lostpointercapture", event => { if (border.drag && event.pointerId === border.drag.pointerId) endDrag(); });

  // A press that moves less than CLICK_PX is a click; a longer drag orbits.
  let press = null;
  renderer.domElement.addEventListener("pointerdown", event => {
    press = event.button === 0 ? {x: event.clientX, y: event.clientY} : null;
  });
  renderer.domElement.addEventListener("pointerup", event => {
    if (!press || event.button !== 0) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    press = null;
    if (moved < CLICK_PX && onClick) onClick({clientX: event.clientX, clientY: event.clientY, shiftKey: event.shiftKey, altKey: event.altKey});
  });

  const gl = renderer.getContext();
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  const info = {renderer: String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)), three: THREE.REVISION};
  resize();
  return {
    setMesh, clear, setSelection, setOutline, setSide, setOverlay, setOverlayStale, view, lookAt, setClearance, pick, project, nearestRun, nearestPoint, resize,
    nearestVisiblePoint, isVisible, setHoverRun, setBorder, setBorderHandles, pickHandle, pickBorder, onBorderDrag, setBorderEditing,
    info: () => ({...info, overlayTaxels: groups.overlay?.userData.taxels || 0, overlayMarkers: groups.overlay?.userData.markers || 0,
      hoverRun: Boolean(groups.hover), sideSegments: groups.side?.userData.segments || 0, sideOutsideSegments: groups.side?.userData.outsideSegments || 0, borderSegments: groups.border?.userData.segments || 0, borderOutsideSegments: groups.border?.userData.outsideSegments || 0,
      borderHandles: border.handles.length, borderHandlesShown: border.shown ? border.shown.size : null, borderEditing: border.editing, borderDragging: border.drag ? `${border.drag.kind}:${border.drag.index}` : null}),
  };
}
