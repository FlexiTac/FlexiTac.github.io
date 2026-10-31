// CAD mode ("Gen by Surface" on the page) of FlexiTac-Gen: the mode switch, the CAD workspace
// steps (file, surface, base edge, configure, proposals, generate, mapping,
// downloads) and the calls to /api/surface/*.  three.js is loaded only by
// viewer.js, imported on the first entry to CAD mode.
//
// Generate never calls the generator itself: it hands the chosen design to the
// form with the "fpc:apply-design" event; web/app.js checks it against the
// limits of the design's template, sets the form (and its template) and runs
// the regular generator, then dispatches "fpc:result" / "fpc:cleared" on
// document, and the build is mapped onto the part.  "fpc:mode" tells app.js
// the mode (Rectangular always uses the default template), "fpc:template-info"
// asks it for a template's form limits.
//
// The border (claude/specs/cad-mode/BORDER-EDITOR-PLAN.md, section 6; docs/CAD_BORDER.md): after a selection the
// surface outline is drawn as the border; Edit border drags its corners and edges in the 3D view (border.js holds
// the polygon in the selection chart's uv).  While the border is the untouched outline the fit is sent as before
// (no border; its sides and arc exits); once edited it is sent as "border" with its edges as the exits.

import {parseStl} from "./stl.js";
import {MAX_SURFACE_BYTES, surfaceRequest} from "./api.js";
import * as B from "./border.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// select.PRESETS of surface/select.py: [theta_d_deg, theta_c_deg, min_radius_mm].
const PRESETS = {flat: [10, 4, 0], surface: [30, 180, 4], smooth: [30, 180, 0]};
// CAD mode builds on the surface template (surface/fit.py's CAD_ONLY: the field follows the selected area; the generic
// template and rectangular fields are the Rectangular mode's, P5-diagonal-bus.md section 26.16).
const SURFACE_TEMPLATE_ID = "surface_matrix_v1";
// surface/fit.py: the fit's caps, and the arc exits around a point on a rounded edge.
const FIT_MAX_ROWS = 64;
const FIT_MAX_COLUMNS = 64;
// The user's defaults of 2026-10-30: the app opens in CAD mode (Rectangular at #rect) with the UMI fin-ray finger
// loaded until a file is chosen (web/vendor/umi, the HandUMI mesh) and its sensor already generated (buildDefaultSensor)
// on a border of its contact face: 65 mm from the tip (side 2; side 0 is the mount end), the face's full width, the
// exit Auto; its fit is shipped (default-fit.json: the request and the reply, written by
// tools/browser/write_default_fit.py and checked against the engine by tests/test_surface_web.py), so the sensor shows
// at once.  The fit takes at most 32 rows and 32 columns (Max rows / columns; the template allows more).
const DEFAULT_PART = {url: "static/vendor/umi/UMI-Soft-Gripper-Finger.stl", name: "UMI-Soft-Gripper-Finger.stl",
  fit: "static/vendor/umi/default-fit.json", tipSide: 2, borderMm: 65};
const FIT_DEFAULT_MAX = 32;
const ARC_HALF_LENGTH_MM = 15;
const ARC_WHEN_SIDES_SHORTER_MM = 20;
// Sides shorter than this are not listed as base edges (the automatic choice ignores them too).
const MIN_LISTED_SIDE_MM = 3;
// surface/border.py MIN_EDGE_MM and MAX_VERTICES: a border edge shorter than this is no tail exit (border.js's
// MIN_EDGE_MM is its collapse threshold, another thing), and a border has at most this many vertices.
const EXIT_MIN_MM = 3;
const BORDER_MAX_VERTICES = 2048;
// The border traced on the part: a point at least every this share of the selection's size (beyond the surface; on
// it the trace follows the facets exactly).  Snapping while dragging: within this share of the size, clamped (mm).
const BORDER_STEP_SHARE = 0.01;
const SNAP_SHARE = 0.015;
const SNAP_MM = [0.25, 3];
// Room kept for the JSON header of the largest request (map: placement and design).
const HEADER_RESERVE_BYTES = 256 * 1024;
// Inspect failures after which the dropped file is not drawn (size, format: it may be anything).
const NOT_DRAWN = /^(E_SURFACE_MESH_|E_HTTP_BODY_TOO_LARGE$|HTTP_413$|E_CLIENT_)/;

const $ = id => document.getElementById(id);

const cad = {
  mode: "rect",
  // The default part (DEFAULT_PART): idle until CAD mode first shows without a part, then loading, loaded, skipped (a
  // file came first) or failed; its sensor (buildDefaultSensor): idle, pending (the part on its way), running, done or
  // stopped (something else came first, or a step failed).
  defaultPart: "idle", defaultBuild: "idle",
  // The default part's shipped fit ({request, reply}) and where the last fit came from (the server or that file).
  defaultFit: null, fitSource: null,
  // Whether CAD mode generated a build this session: until then its results below (a rectangular build) stay hidden.
  generated: false,
  verifyOpen: false,  // the user's choice for the folded checks on the part
  viewer: null, viewerLoad: null, viewerError: null,
  fileName: "", defaultFile: false, mesh: null, parsed: null, inspect: null, hidden: new Set(), facetMismatch: false,
  // ops: the selection operations; opsHistory: the ops before each change of them (Undo goes back one).
  ops: [], opsHistory: [], selection: null, selectionError: null, runs: [],
  side: "auto",
  // The border of the selection (newBorder) or null; editing: the Edit border mode; hover: the edge under the
  // pointer with the Base edge tool (or a hovered list row).
  border: null, editing: false, hover: null,
  fit: null, chosen: null, preview: null, fitRequest: null,
  map: null, mapError: null, lastResult: null, pendingBuild: null,
  formLimits: null, limitsSync: null,
  stale: false, busy: new Map(), controllers: new Map(), error: null, retries: 0,
  seq: {load: 0, inspect: 0, select: 0, fit: 0, preview: 0, map: 0},
};

// -- small helpers -------------------------------------------------------------

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
const fmt = (number, digits = 2) => (Number.isFinite(number) ? Number(number).toFixed(digits) : "—");
const trim = number => (Number.isFinite(number) ? String(Math.round(number * 1e6) / 1e6) : "—");
const round6 = number => Math.round(number * 1e6) / 1e6;
const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;
const describe = error => (error?.code ? `${error.code}: ${error.message}` : String(error?.message || error));
const radioValue = name => document.querySelector(`input[name="${name}"]:checked`)?.value;
const aborted = error => error?.code === "E_CLIENT_ABORTED";
const isPoint = side => Boolean(side) && typeof side === "object" && Array.isArray(side.point_xyz);

function setStatus(kind, message) {
  const node = $("cadStatus");
  node.className = `cad-status is-${kind}`;
  node.textContent = message;
}
function fail(error, prefix) {
  cad.error = error?.code || "E_CLIENT";
  setStatus("error", `${prefix}: ${describe(error)}`);
  renderState();
}
function header(extra = {}) {
  const unit = $("cadUnit").value;
  return {name: cad.fileName.slice(0, 200), ...(unit === "auto" ? {} : {unit}), ...extra};
}
async function request(kind, route, extra) {
  // One request per kind: a newer one aborts the older (its reply would be dropped anyway).
  cad.controllers.get(kind)?.abort();
  const controller = new AbortController();
  cad.controllers.set(kind, controller);
  cad.busy.set(kind, (cad.busy.get(kind) || 0) + 1);
  renderState();
  try {
    return await surfaceRequest(route, header(extra), cad.mesh, {
      signal: controller.signal, onRetry: delay => { cad.retries += 1; setStatus("neutral", `The server is busy; retrying in ${delay} s…`); },
    });
  } finally {
    const left = (cad.busy.get(kind) || 1) - 1;
    if (left > 0) cad.busy.set(kind, left);
    else cad.busy.delete(kind);
    if (cad.controllers.get(kind) === controller) cad.controllers.delete(kind);
    renderState();
  }
}
function abortRequests(...kinds) {
  kinds.forEach(kind => cad.controllers.get(kind)?.abort());
}
function askApp(type, detail) {
  // web/app.js answers by setting detail.result to a Promise.
  document.dispatchEvent(new CustomEvent(type, {detail}));
  return detail.result || Promise.reject(new Error(`the form did not answer "${type}" (web/app.js without the Gen by Surface hook)`));
}

// -- state output (deterministic, for the browser checks) -----------------------

function renderState() {
  const mesh = cad.inspect?.mesh;
  const proposal = chosenProposal();
  const verification = cad.map?.verification || [];
  const state = {
    mode: cad.mode,
    webgl: cad.viewer ? "ok" : cad.viewerError ? "unavailable" : "not loaded",
    mesh: mesh ? {name: mesh.name, facets: mesh.facets, unit: mesh.unit, format: mesh.format, watertight: mesh.watertight, browser_facets: cad.parsed?.facets ?? null} : null,
    default_part: cad.defaultPart,
    default_build: cad.defaultBuild,
    facet_mismatch: cad.facetMismatch,
    ops: cad.ops.length,
    selection: cad.selection ? {facets: cad.selection.facets.length, area_mm2: cad.selection.area_mm2, kind: cad.selection.kind, sides: cad.selection.sides.length} : null,
    side: cad.side,
    // The border (renderState of the border editor), the candidate exit edges as listed (ranked), the default edge
    // shown under Auto, the edge under the pointer, and whether the last fit carried the border.
    border: borderState(),
    edges: listedEdges().map(edge => edge.index),
    default_edge: defaultEdge(),
    hover_edge: cad.hover,
    fit_border: Boolean(cad.fit?.request?.border),
    max_columns: Number($("cadMaxColumns").max),
    limits_served: cad.formLimits ? cad.formLimits.served : null,
    proposals: cad.fit?.proposals?.length || 0,
    fit_options: cad.fitOptions ?? null,
    fit_source: cad.fitSource,
    fit_stale: fitStale(),
    proposal: proposal ? {rank: proposal.rank, build_id: proposal.build_id, rows: proposal.metrics.rows, columns: proposal.metrics.columns, base_side: proposal.placement.base_side,
      base_kind: proposal.placement.base_kind ?? null, border_area_mm2: proposal.metrics.border_area_mm2 ?? null,
      border_on_surface: proposal.metrics.border_on_surface_share ?? null,
      template_id: proposal.design.template_id, taxels: proposal.metrics.taxels, positions: proposal.metrics.positions ?? proposal.metrics.rows * proposal.metrics.columns,
      masked: Boolean(proposal.design.matrix?.mask), field_points: proposal.outlines_uv?.field?.length ?? null, reader: proposal.metrics.reader ?? null,
      containment: containmentOf(proposal), row_sides: proposal.design.routing?.row_sides ?? null, taxel_height_mm: proposal.design.matrix?.taxel_height_mm ?? null,
      tip_mm: proposal.metrics.row_bus?.tip_width_mm ?? null, band_mm: proposal.metrics.row_bus?.band_mm ?? null,
      row_pin_order: proposal.metrics.row_bus?.row_pin_order ?? null, tail_reach_mm: proposal.metrics.tail_reach_mm ?? null,
      tail_position: proposal.metrics.row_bus?.tail_position ?? null, tails: proposal.metrics.row_bus?.tails ?? null,
      shared_outline_mm: proposal.metrics.row_bus?.shared_outline_below_field_mm ?? null,
      row_tail_mm: proposal.metrics.row_tail_mm ?? null, column_tail_mm: proposal.metrics.column_tail_mm ?? null,
      overhang: overhangOf(proposal.metrics.routing_on_surface),
      symmetry: proposal.metrics.symmetry ?? null,
      on_surface: onSurface(proposal.metrics.routing_on_surface)} : null,
    preview_taxels: cad.preview?.taxel_count ?? null,
    overlay: cad.map ? {source: "build", build_id: cad.map.build_id, taxels: cad.map.taxels.length, edge_markers: cad.viewer?.info().overlayMarkers ?? null}
      : cad.preview ? {source: "proposal", build_id: cad.preview.build_id, taxels: cad.preview.taxels.length, edge_markers: cad.viewer?.info().overlayMarkers ?? null} : null,
    map_routing: cad.map ? onSurface(cad.map.routing_on_surface) : null,
    map_row_contact_order: cad.map?.readout?.row_contact_order?.length ?? null,
    map_row_pin_order: cad.map?.readout?.row_pin_order ?? null,
    map_warnings: cad.map?.routing_on_surface ? (cad.map.routing_on_surface.warnings || []).map(item => item.code) : null,
    generated_build_id: cad.lastResult?.manifest?.build_id ?? null,
    generated_template_id: cad.lastResult?.design?.template_id ?? null,
    generated_row_sides: cad.lastResult?.design?.routing?.row_sides ?? null,
    pending_build: cad.pendingBuild,
    verification: cad.map ? {ok: cad.map.ok === true, passed: verification.filter(record => record.passed).length, total: verification.length} : null,
    map_error: cad.mapError?.code ?? null,
    stale: cad.stale,
    downloads: downloadsReady(),
    placement_build_id: placementDocument()?.build_id ?? null,
    busy: [...cad.busy.keys()].sort(),
    retries: cad.retries,
    error: cad.error,
    // The server's candidate surfaces (seed facets, best first; diagnostics pickSurface) and the guide's steps.
    candidates: Object.fromEntries(["flat", "surface", "smooth"].map(kind => [kind, (cad.inspect?.candidates?.[kind] || []).map(item => item.seed_facet)])),
    guide: renderGuide(),
  };
  $("cadState").textContent = JSON.stringify(state);
}

function renderGuide() {
  // The order of work (index.html #cadGuide, the page's left column in Gen by Surface): each step done, the first one
  // not done next (markGuideHere marks the one in view).
  const done = [Boolean(cad.selection), Boolean(cad.fit?.proposals?.length), Boolean(cad.map?.ok && downloadsReady()), false];
  const next = done.indexOf(false);
  document.querySelectorAll("#cadGuide .flow-step").forEach((step, index) => {
    step.classList.toggle("is-done", done[index]);
    step.classList.toggle("is-next", index === next);
    if (index === next) step.setAttribute("aria-current", "step"); else step.removeAttribute("aria-current");
  });
  markGuideHere();
  return done.map((value, index) => (value ? "done" : index === next ? "next" : "todo"));
}

function markGuideHere() {
  // The step whose part of the page is in view: the last one whose part starts above a third of the window (the last
  // one at the page's end, whose part may not reach so high).
  const steps = [...document.querySelectorAll("#cadGuide .flow-step")];
  const line = window.innerHeight / 3;
  const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  let here = 0;
  steps.forEach((step, index) => {
    const target = $(step.querySelector("[data-go]")?.dataset.go || "");
    if (target?.getClientRects().length && (target.getBoundingClientRect().top <= line || atEnd)) here = index;
  });
  steps.forEach((step, index) => step.classList.toggle("is-here", index === here));
}

// The proposal's containment (metrics.containment of a field-only proposal; the whole board otherwise).
const containmentOf = proposal => proposal?.metrics?.containment || proposal?.placement?.options?.containment || "board";
// {row, column}: each board's share of its area on the surface (routing_on_surface of a field-only fit or map).
function onSurface(report) {
  return report?.row && report?.column ? {row: report.row.on_surface, column: report.column.on_surface} : null;
}
function overhangOf(report) {
  return report?.row && report?.column ? {row: report.row.overhang_mm, column: report.column.overhang_mm} : null;
}
// "a, b, c, …, y, z" for a long list, every item when nothing would be left out.
const shortList = items => (items.length > 6 ? `${items.slice(0, 3).join(", ")}, …, ${items.slice(-2).join(", ")}` : items.join(", "));

// -- mode switch ---------------------------------------------------------------

function syncResults() {
  // CAD mode shows the shared results (status, previews, checks, downloads) once they are a CAD build: its own Generate
  // this session or a surface-template build; a rectangular build is the Rectangular mode's.
  const shown = cad.generated || cad.lastResult?.design?.template_id === SURFACE_TEMPLATE_ID;
  document.body.classList.toggle("cad-no-build", cad.mode === "cad" && !shown);
}

function setMode(mode, {fromHash = false} = {}) {
  cad.mode = mode === "cad" ? "cad" : "rect";
  document.body.dataset.mode = cad.mode;
  syncResults();
  $("cadWorkspace").hidden = cad.mode !== "cad";
  $(cad.mode === "cad" ? "modeCad" : "modeRect").checked = true;
  if (!fromHash) {
    const url = `${location.pathname}${location.search}${cad.mode === "rect" ? "#rect" : ""}`;
    history.replaceState(null, "", url);
  }
  // app.js: Rectangular mode uses the default template, CAD mode the template of its last Generate.
  document.dispatchEvent(new CustomEvent("fpc:mode", {detail: {mode: cad.mode}}));
  if (cad.mode === "cad") {
    ensureViewer();
    loadDefaultPart();
    if (!cad.limitsSync) syncFitLimits();
    // A build generated in the other mode is mapped now (or reported as a mismatch).
    if (chosenProposal() && cad.lastResult?.ok && cad.lastResult.manifest.build_id !== cad.map?.build_id) mapBuild(cad.lastResult);
  }
  renderState();
}

function ensureViewer() {
  if (cad.viewer || cad.viewerError) return Promise.resolve(cad.viewer);
  if (!cad.viewerLoad) {
    cad.viewerLoad = import("./viewer.js").then(module => {
      try {
        cad.viewer = module.createViewer($("cadView"), {onClick: onViewClick});
      } catch (error) {
        throw new Error(`WebGL unavailable: ${error?.message || error}`);
      }
      cad.viewer.onBorderDrag(onBorderDrag);
      viewClear();
      if (cad.parsed && cad.inspect) showMesh();
      renderState();
      return cad.viewer;
    }).catch(error => {
      cad.viewerError = String(error?.message || error);
      if (!cad.viewerError.startsWith("WebGL unavailable")) cad.viewerError = `WebGL unavailable: ${cad.viewerError}`;
      $("cadView").classList.add("is-unavailable");
      $("cadDrop").replaceChildren(el("p", {}, el("strong", {}, cad.viewerError)),
        el("p", {}, "The 3D view is off; the candidate list, fitting, Generate and downloads still work."));
      $("cadDrop").hidden = false;
      setStatus("warning", cad.viewerError);
      renderState();
      return null;
    });
  }
  return cad.viewerLoad;
}

// The form limits of the surface template (app.js gets them from the server): Max rows / columns
// cannot exceed them, so every proposal can pass through the form.
function syncFitLimits() {
  const id = SURFACE_TEMPLATE_ID;
  cad.limitsSync = askApp("fpc:template-info", {template_id: id}).catch(() => null).then(info => {
    cad.formLimits = info;
    const spec = info?.limits?.["matrix.columns"]; const rowSpec = info?.limits?.["matrix.rows"];
    const maxColumns = Math.min(FIT_MAX_COLUMNS, Number.isFinite(spec?.maximum) ? spec.maximum : 32);
    const maxRows = Math.min(FIT_MAX_ROWS, Number.isFinite(rowSpec?.maximum) ? rowSpec.maximum : FIT_MAX_ROWS);
    for (const [control, maximum] of [[$("cadMaxColumns"), maxColumns], [$("cadMaxRows"), maxRows]]) {
      control.max = String(maximum);
      // Until the user sets it, the cap is FIT_DEFAULT_MAX within the template's maximum.
      if (!control.dataset.edited || !(Number(control.value) <= maximum)) control.value = String(Math.min(FIT_DEFAULT_MAX, maximum));
    }
    const note = $("cadLimitsNote");
    note.hidden = !info || info.served;
    note.textContent = info && !info.served
      ? `Max columns stops at ${maxColumns}: this server did not send the limits of ${id}, so the form keeps those of the default template. The surface template itself allows up to 64 columns.`
      : "";
    renderState();
  });
  return cad.limitsSync;
}

// -- 1. file ----------------------------------------------------------------------

async function loadDefaultPart() {
  // CAD mode's part until the user chooses one (DEFAULT_PART): fetched once, and dropped when a file came meanwhile.
  if (cad.defaultPart !== "idle" || cad.mesh) return;
  cad.defaultPart = "loading";
  cad.defaultBuild = "pending";
  const ticket = cad.seq.load;
  try {
    // The shipped fit is optional: without it the default part's fit asks the server.
    const [reply, shipped] = await Promise.all([fetch(DEFAULT_PART.url),
      fetch(DEFAULT_PART.fit).then(answer => (answer.ok ? answer.json() : null)).catch(() => null)]);
    if (!reply.ok) throw new Error(`HTTP ${reply.status}`);
    cad.defaultFit = shipped?.request && shipped?.reply ? shipped : null;
    const bytes = await reply.blob();
    if (ticket !== cad.seq.load || cad.mesh) cad.defaultPart = "skipped";
    else {
      cad.defaultPart = "loaded";
      await loadFile(new File([bytes], DEFAULT_PART.name, {type: "model/stl"}), {isDefault: true});
      await buildDefaultSensor();
    }
  } catch (error) {
    cad.defaultPart = "failed";
    if (ticket === cad.seq.load && !cad.mesh) setStatus("warning", `The default part (${DEFAULT_PART.name}) was not loaded (${error.message}): drop an STL file on the view or choose one.`);
  }
  if (cad.defaultBuild === "pending" || cad.defaultBuild === "running") cad.defaultBuild = "stopped";
  renderState();
}

function defaultBorder() {
  // The default part's border: DEFAULT_PART.borderMm of the face from its tip side toward the mount end (side 0, the
  // opposite one), the face's full width; its edge 0 crosses the face, edge 2 is the tip (as when dragged in the editor).
  const sides = cad.selection?.sides || [];
  const tip = sides[DEFAULT_PART.tipSide]; const mount = sides[(DEFAULT_PART.tipSide + 2) % 4];
  if (sides.length !== 4 || !tip || !mount) return null;
  const [dx, dy] = [mount.from_uv[0] - tip.to_uv[0], mount.from_uv[1] - tip.to_uv[1]];
  const length = Math.hypot(dx, dy);
  if (!(length > DEFAULT_PART.borderMm)) return null;
  const step = [dx * DEFAULT_PART.borderMm / length, dy * DEFAULT_PART.borderMm / length];
  const along = point => [round6(point[0] + step[0]), round6(point[1] + step[1])];
  return [along(tip.to_uv), along(tip.from_uv), [...tip.from_uv], [...tip.to_uv]];
}

function canonical(value) {
  // JSON with sorted keys: a fit request compared with the shipped one.
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

async function buildDefaultSensor() {
  // The default part's sensor, as if clicked: its first flat candidate (the finger's contact face), Fit with the options
  // as they are (Max rows / columns FIT_DEFAULT_MAX) and Generate of the first proposal.  Another file, selection, fit,
  // option or the Rectangular mode on the way stops it.
  const face = cad.inspect?.candidates?.flat?.[0];
  const load = cad.seq.load;
  const ours = () => cad.defaultFile && cad.seq.load === load && cad.mode === "cad";
  if (!ours() || !face) return;
  cad.defaultBuild = "running";
  renderState();
  Object.assign(cad, {ops: [{op: "grow", mode: "add", seed_facet: face.seed_facet, preset: face.preset}], opsHistory: []});
  await runSelect({look: true});
  const select = cad.seq.select;
  if (!ours() || !cad.selection || cad.selectionError) return;
  const border = defaultBorder();
  if (border) commitBorder(border, {side: "auto"});
  await runFit();
  const fit = cad.seq.fit;
  if (!ours() || cad.seq.select !== select || !chosenProposal() || fitStale()) return;
  await generate();
  if (ours() && cad.seq.fit === fit) cad.defaultBuild = "done";
}

async function loadFile(file, {isDefault = false} = {}) {
  if (!file) return;
  if (file.size + 4 + HEADER_RESERVE_BYTES > MAX_SURFACE_BYTES) {
    const limit = (MAX_SURFACE_BYTES - HEADER_RESERVE_BYTES) / 1048576;
    fail({code: "E_CLIENT_FILE_TOO_LARGE", message: `${file.name} is ${(file.size / 1048576).toFixed(1)} MiB; files of up to ${limit.toFixed(2)} MiB are accepted (64 MiB per request, with the request header).`}, "Not loaded");
    return;
  }
  const ticket = (cad.seq.load += 1);
  setStatus("neutral", `Reading ${file.name}…`);
  let parsed;
  let mesh;
  try {
    const bytes = await file.arrayBuffer();
    if (ticket !== cad.seq.load) return;  // a later file was dropped meanwhile
    parsed = parseStl(bytes);
    // One Blob per file; each request references it (and the File may change on disk later).
    mesh = new Blob([bytes]);
  } catch (error) {
    if (ticket === cad.seq.load) fail({code: "E_CLIENT_STL", message: error.message}, `${file.name} was not loaded`);
    return;
  }
  abortRequests("inspect", "select", "fit", "preview", "map");
  Object.assign(cad, {fileName: file.name, defaultFile: isDefault, mesh, parsed, inspect: null, facetMismatch: false, ops: [], opsHistory: [], selection: null, selectionError: null, runs: [], side: "auto", error: null});
  resetBorder();
  resetFit();
  $("cadUnit").value = "auto";
  await inspectMesh();
}

async function inspectMesh() {
  if (!cad.mesh) return;
  const sequence = (cad.seq.inspect += 1);
  setStatus("neutral", `Inspecting ${cad.fileName} on the local server…`);
  let reply;
  try {
    reply = await request("inspect", "inspect", {});
  } catch (error) {
    if (sequence !== cad.seq.inspect || aborted(error)) return;
    cad.inspect = null;
    cad.facetMismatch = false;
    renderMeshFacts();
    renderSelection();
    fail(error, `${cad.fileName} was rejected`);
    if (await ensureViewer()) {
      if (NOT_DRAWN.test(error.code || "")) {
        // Refused for its size or format: not drawn.
        cad.viewer.clear();
        $("cadDrop").hidden = false;
      } else {
        // Still show what was dropped (unit guessed as on the server: an extent under 2 means metres).
        cad.viewer.setMesh(cad.parsed.positions, guessScale(cad.parsed.positions), []);
        $("cadDrop").hidden = true;
      }
    }
    return;
  }
  if (sequence !== cad.seq.inspect) return;
  cad.inspect = reply;
  cad.hidden = new Set(reply.hidden_facets);
  // Sticky until another file or unit: the facet ids of a click would not be the server's.
  cad.facetMismatch = reply.mesh.facets !== cad.parsed.facets;
  cad.error = null;
  renderMeshFacts();
  await ensureViewer();
  showMesh();
  if (cad.ops.length) await runSelect();
  else {
    renderSelection();
    setStatus("ok", `${cad.fileName}: ${plural(reply.mesh.facets, "facet")}. Pick a candidate surface or click the part.`);
  }
  if (cad.facetMismatch) {
    cad.error = "E_CLIENT_FACET_ORDER";
    setStatus("warning", `Facet mismatch: the browser read ${cad.parsed.facets} facets, the server ${reply.mesh.facets}; clicking on the part to select is off (the candidate list and the Base edge tool still work).`);
  }
  renderState();
}

function guessScale(positions) {
  const low = [Infinity, Infinity, Infinity]; const high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 1) {
    const axis = i % 3;
    if (positions[i] < low[axis]) low[axis] = positions[i];
    if (positions[i] > high[axis]) high[axis] = positions[i];
  }
  return Math.max(...[0, 1, 2].map(axis => high[axis] - low[axis])) < 2 ? 1000 : 1;
}

function showMesh() {
  if (!cad.viewer || !cad.parsed || !cad.inspect) return;
  cad.viewer.setMesh(cad.parsed.positions, cad.inspect.mesh.scale_to_mm, cad.facetMismatch ? [] : cad.inspect.hidden_facets);
  $("cadDrop").hidden = true;
  paintSelection();
}

function renderMeshFacts() {
  const mesh = cad.inspect?.mesh;
  const facts = $("cadMeshFacts");
  const note = $("cadFileNote");
  note.hidden = !cad.fileName;
  note.textContent = !cad.fileName ? "" : cad.defaultFile
    ? `Loaded: the UMI fin-ray finger (${DEFAULT_PART.name}, HandUMI), the default part. Choose a file or drop one on the view to replace it.`
    : `Loaded: ${cad.fileName}.`;
  if (!mesh) { facts.replaceChildren(el("dt", {}, "Mesh"), el("dd", {}, cad.fileName ? `${cad.fileName} (not inspected)` : "none loaded")); return; }
  const unit = mesh.unit === mesh.unit_guess ? `${mesh.unit} (guessed)` : `${mesh.unit} (set; guess ${mesh.unit_guess})`;
  const rows = [
    ["File", `${mesh.name || cad.fileName} · ${mesh.format} STL`],
    ["Unit", `${unit} · ×${trim(mesh.scale_to_mm)} to mm`],
    ["Extent", `${mesh.extent_mm.map(value => fmt(value, 1)).join(" × ")} mm`],
    ["Box min", `${mesh.bbox_mm.slice(0, 3).map(value => fmt(value, 1)).join(", ")} mm`],
    ["Facets", `${mesh.facets.toLocaleString("en-US")} · ${plural(mesh.shells, "shell")}`],
    ["Watertight", mesh.watertight ? "yes" : `no (${mesh.boundary_edges} open, ${mesh.nonmanifold_edges} non-manifold edges)`],
    ["Hidden facets", mesh.hidden_facets ? `${mesh.hidden_facets} (inside, where shells touch; not selectable)` : "none"],
    ["Area", `${fmt(mesh.area_mm2, 1)} mm²`],
  ];
  const repairs = [
    mesh.duplicate_facets ? plural(mesh.duplicate_facets, "repeated facet") + " ignored" : "",
    mesh.t_junction_links ? plural(mesh.t_junction_links, "crack") + " (T-junctions) bridged" : "",
    mesh.reversed_facets ? plural(mesh.reversed_facets, "facet") + " turned outward" : "",
  ].filter(Boolean);
  if (repairs.length) rows.push(["Repaired", repairs.join(" · ")]);
  if (mesh.orientation_ambiguous_shells) rows.push(["Outside", `${plural(mesh.orientation_ambiguous_shells, "open sheet")} enclose nothing: the file's winding decides their outside`]);
  if (mesh.warning) rows.push(["Warning", String(mesh.warning)]);
  if (cad.facetMismatch) rows.push(["Clicks", `off: the browser read ${cad.parsed.facets.toLocaleString("en-US")} facets, the server ${mesh.facets.toLocaleString("en-US")}`]);
  facts.replaceChildren(...rows.flatMap(([key, value]) => [el("dt", {}, key), el("dd", {}, value)]));
}

// -- 2. surface ----------------------------------------------------------------------

function presetValues() {
  const preset = $("cadPreset").value;
  return preset === "custom" ? [Number($("cadThetaD").value), Number($("cadThetaC").value), Number($("cadMinRadius").value) || 0] : PRESETS[preset];
}
function syncAngles() {
  const preset = $("cadPreset").value;
  if (preset !== "custom") [$("cadThetaD").value, $("cadThetaC").value, $("cadMinRadius").value] = PRESETS[preset].map(String);
  $("cadThetaDValue").textContent = `${$("cadThetaD").value}°`;
  $("cadThetaCValue").textContent = `${$("cadThetaC").value}°`;
}
function growOp(seed, mode, preset = $("cadPreset").value) {
  if (preset === "custom") {
    // Every value explicit: the server's default preset would add its own blend radius.
    const [thetaD, thetaC, minRadius] = presetValues();
    return {op: "grow", mode, seed_facet: seed, theta_d_deg: thetaD, theta_c_deg: thetaC, min_radius_mm: minRadius};
  }
  return {op: "grow", mode, seed_facet: seed, preset};
}
// A click selects (the user's request of 2026-10-30, in place of an Add / Subtract switch): on a facet outside the
// selection it adds that surface; on one inside it removes the surface that added the facet (``added``: an add
// operation's facets new to the selection then), or else subtracts the clicked surface.
const facetSets = new WeakMap();
const added = new WeakMap();
function facetSet(selection) {
  if (!selection) return new Set();
  if (!facetSets.has(selection)) facetSets.set(selection, new Set(selection.facets || []));
  return facetSets.get(selection);
}
const isSelected = facet => facetSet(cad.selection).has(facet);
function toggleSurface(facet, op) {
  if (!isSelected(facet)) return applyOp({...op, mode: "add"}, {look: true});
  const index = cad.ops.findLastIndex(entry => added.get(entry)?.has(facet));
  if (index < 0) return applyOp({...op, mode: "subtract"});
  setOps(cad.ops.filter((_, position) => position !== index));
  return runSelect();
}
function setOps(next) {
  cad.opsHistory.push(cad.ops);
  cad.ops = next;
}

function pickSurface(text) {
  // Diagnostics (the browser checks): a click on the surface of a seed facet, "facet" or "facet:preset" (the server's
  // candidate surfaces carry both; there is no candidate list on the page since 2026-10-30).
  const [facet, preset = "flat"] = String(text).split(":").map(part => part.trim());
  const seed = Number(facet);
  if (!cad.inspect || !Number.isInteger(seed)) return;
  toggleSurface(seed, {op: "grow", seed_facet: seed, preset});
}

function applyOp(op, options = {}) {
  setOps([...cad.ops, op]);
  return runSelect({...options, adding: true});
}

async function runSelect({look = false, adding = false} = {}) {
  // ``adding``: the last operation is new (applyOp); refused, it is dropped and the selection stays as it was.
  const before = facetSet(cad.selection);
  resetFit();
  cad.side = "auto";
  // A new selection starts from its own outline (the edits and their history belong to the old one).
  resetBorder();
  if (!cad.ops.length) {
    abortRequests("select");
    cad.seq.select += 1;
    cad.selection = null;
    cad.selectionError = null;
    cad.runs = [];
    renderSelection();
    paintSelection();
    setStatus("neutral", "Selection cleared.");
    renderState();
    return;
  }
  const sequence = (cad.seq.select += 1);
  setStatus("neutral", `Selecting (${plural(cad.ops.length, "operation")})…`);
  try {
    const reply = await request("select", "select", {selection: {ops: cad.ops}});
    if (sequence !== cad.seq.select) return;
    const last = cad.ops.at(-1);
    // The surface a new add operation brought (a click on it removes the operation again).
    if (last.mode === "add" && !added.has(last)) added.set(last, new Set(reply.selection.facets.filter(facet => !before.has(facet))));
    cad.selection = reply.selection;
    cad.selectionError = null;
    cad.runs = sideRuns(reply.selection);
    cad.border = newBorder(reply.selection);
    cad.error = cad.facetMismatch ? "E_CLIENT_FACET_ORDER" : null;
    const s = reply.selection;
    const shown = defaultEdge();
    setStatus("ok", `Selected ${fmt(s.area_mm2, 1)} mm² (${plural(s.facets.length, "facet")}, ${s.kind}). The border is the surface's outline (Edit border to change it); `
      + `${shown === null ? "Auto exit" : `Auto exit, first tried: ${edgeName(shown)} (magenta)`}. Choose the base edge, then Fit.`);
  } catch (error) {
    if (sequence !== cad.seq.select || aborted(error)) return;
    // Deselecting the last selected surface leaves nothing: the selection is cleared.
    if (error.code === "E_SURFACE_SELECTION_EMPTY" && cad.ops.at(-1)?.mode === "subtract") {
      cad.ops = [];
      await runSelect({look});
      return;
    }
    // A click or candidate refused (a surface apart from the selection, say): it is dropped, the selection kept.
    if (adding) {
      cad.ops = cad.opsHistory.pop() ?? cad.ops.slice(0, -1);
      await runSelect();
      if (sequence + 1 === cad.seq.select) fail(error, "Not added; the selection is kept");
      return;
    }
    // The last operation is kept so a following one can repair the selection; Undo drops it.
    cad.selectionError = error;
    fail(error, "The selection cannot be used (Undo the last operation or add to it)");
  }
  renderSelection();
  paintSelection();
  if (look && cad.selection) lookAtSelection();
  renderState();
}

function sideRuns(selection) {
  // Each side as its run of outline points (outline_xyz and the side ends share the 1e-6 mm rounding).
  const loop = selection.outline_xyz || [];
  const count = loop.length;
  const first = new Map();
  loop.forEach((point, index) => { const key = point.join(","); if (!first.has(key)) first.set(key, index); });
  return (selection.sides || []).map(side => {
    const start = first.get(side.from_xyz.join(",")); const end = first.get(side.to_xyz.join(","));
    if (start === undefined || end === undefined || !count) return [side.from_xyz, side.to_xyz];
    const run = [loop[start]];
    let index = start;
    do { index = (index + 1) % count; run.push(loop[index]); } while (index !== end && run.length <= count);
    return run;
  });
}

const distance3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lerp3 = (a, b, t) => [0, 1, 2].map(k => a[k] + t * (b[k] - a[k]));

function arcRun(loop, point, half) {
  // The outline within `half` mm (along the outline) of its point nearest `point`: what the
  // server's {point_xyz} base uses on a rounded edge (surface/fit.py arc_at_point; drawn only).
  const n = loop.length;
  if (n < 2) return null;
  let best = null;
  for (let i = 0; i < n; i += 1) {
    const a = loop[i]; const b = loop[(i + 1) % n];
    const ab = [0, 1, 2].map(k => b[k] - a[k]); const length2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
    const t = length2 ? Math.max(0, Math.min(1, ((point[0] - a[0]) * ab[0] + (point[1] - a[1]) * ab[1] + (point[2] - a[2]) * ab[2]) / length2)) : 0;
    const d = distance3(point, lerp3(a, b, t));
    if (!best || d < best.d) best = {i, t, d};
  }
  const at = lerp3(loop[best.i], loop[(best.i + 1) % n], best.t);
  const walk = (index, step) => {
    const points = []; let left = half; let previous = at;
    for (let k = 0; k < n && left > 0; k += 1) {
      const next = loop[index]; const length = distance3(previous, next);
      if (length >= left) { points.push(lerp3(previous, next, length ? left / length : 0)); break; }
      points.push(next); left -= length; previous = next; index = (index + step + n) % n;
    }
    return points;
  };
  return [...walk(best.i, -1).reverse(), at, ...walk((best.i + 1) % n, 1)];
}

function exitRuns(proposal) {
  // The outline segments the proposal's tails may cross (placement.exit_edges index the fit chart's outline).
  const loop = cad.fit?.selection?.outline_xyz || [];
  const n = loop.length;
  const edges = proposal?.placement?.exit_edges;
  if (!Array.isArray(edges) || !edges.length || !n) return null;
  const set = new Set(edges);
  const starts = edges.filter(edge => !set.has((edge - 1 + n) % n));
  return (starts.length ? starts : [edges[0]]).map(start => {
    const run = [loop[start]];
    for (let edge = start; set.has(edge) && run.length <= n; edge = (edge + 1) % n) run.push(loop[(edge + 1) % n]);
    return run;
  });
}

function paintSelection() {
  if (!cad.viewer) return;
  // With a facet mismatch the server's facet ids are not the drawn facets: only the outline is drawn.
  const facets = cad.selectionError?.details?.facets;
  if (cad.facetMismatch) cad.viewer.setSelection([]);
  else if (Array.isArray(facets)) cad.viewer.setSelection(facets, {rejected: true});
  else cad.viewer.setSelection(cad.selection?.facets || []);
  cad.viewer.setOutline(cad.selection?.outline_xyz || null);
  if (cad.editing && !borderReady()) setEditing(false, {quiet: true});
  paintBorder();
  paintSide();
  renderBorderBar();
}
function paintSide() {
  // The exit in use (the default edge under Auto), in magenta; a border edge dashed where it lies beyond the surface.
  if (!cad.viewer) return;
  const exit = shownExit();
  if (exit && !Array.isArray(exit)) cad.viewer.setSide(exit.runs, {outsideRuns: exit.outsideRuns});
  else cad.viewer.setSide(exit);
}
function shownExit() {
  // A run (or runs) of STL points, {runs, outsideRuns} for an edge of an edited border, or null.  After an edit of the
  // border the proposals are stale: the exit shown is then the one the next fit takes (as the candidate list says).
  const proposal = chosenProposal();
  if (proposal && !borderStale()) {
    // A fit with a border: its exit is the border's edge (exit_edges are where the tails leave the surface beyond it).
    const fitted = cad.fit?.request?.border?.uv;
    if (proposal.placement.base_kind === "border" && Array.isArray(fitted)) return uvSegmentParts(fitted, proposal.placement.base_side);
    return exitRuns(proposal) || (Number.isInteger(proposal.placement.base_side) ? cad.runs[proposal.placement.base_side] : null);
  }
  if (isPoint(cad.side) && cad.selection) return arcRun(cad.selection.outline_xyz || [], cad.side.point_xyz, ARC_HALF_LENGTH_MM);
  const index = Number.isInteger(cad.side) ? cad.side : defaultEdge();
  if (index === null) return null;
  return borderEdited() ? uvSegmentParts(cad.border.uv, index) : edgeRuns()[index] || null;
}
function viewClear() {
  // The bands of the 3D view its tools cover (index.html .cad-view-tools on the left, .cad-views on the top right): a
  // framed selection keeps clear of them.
  const view = $("cadView").getBoundingClientRect();
  const tools = $("cadViewTools").getBoundingClientRect(); const camera = document.querySelector(".cad-views")?.getBoundingClientRect();
  const clear = {top: camera && camera.height ? camera.bottom - view.top + 8 : 0, side: tools.width ? tools.right - view.left + 8 : 0};
  cad.viewer?.setClearance(clear);  // the viewer's own framings (a new mesh's) keep clear of them too
  return clear;
}

function lookAtTaxels(taxels) {
  // The mapped sensor: its centroid, seen along the taxels' mean normal.
  const center = [0, 1, 2].map(k => taxels.reduce((total, taxel) => total + taxel.xyz_mm[k], 0) / taxels.length);
  const normal = [0, 1, 2].map(k => taxels.reduce((total, taxel) => total + taxel.normal[k], 0));
  if (Math.hypot(...normal) < 0.3 * taxels.length) return false;
  const reach = Math.max(...taxels.map(taxel => Math.hypot(...[0, 1, 2].map(k => taxel.xyz_mm[k] - center[k]))));
  cad.viewer.lookAt(center, normal, 1.2 * reach, viewClear());
  return true;
}

function lookAtSelection() {
  if (!cad.viewer || !cad.selection || !cad.parsed) return;
  const taxels = (cad.map || cad.preview)?.taxels;
  if (Array.isArray(taxels) && taxels.length && lookAtTaxels(taxels)) return;
  if (cad.facetMismatch) {
    // The outline (server coordinates) along the selection's normal.
    const loop = cad.selection.outline_xyz || [];
    if (!loop.length) return;
    const center = [0, 1, 2].map(k => loop.reduce((total, point) => total + point[k], 0) / loop.length);
    cad.viewer.lookAt(center, cad.selection.normal, Math.max(...loop.map(point => distance3(point, center))), viewClear());
    return;
  }
  // The area-weighted centroid of the selected facets, seen from the direction that sees most
  // of their area: the mean normal on a flat face, a side view of a band that wraps around.
  const scale = cad.inspect.mesh.scale_to_mm; const p = cad.parsed.positions;
  const sum = [0, 0, 0]; const mean = [0, 0, 0]; const facets = []; let total = 0;
  for (const facet of cad.selection.facets) {
    const o = 9 * facet;
    const u = [p[o + 3] - p[o], p[o + 4] - p[o + 1], p[o + 5] - p[o + 2]]; const v = [p[o + 6] - p[o], p[o + 7] - p[o + 1], p[o + 8] - p[o + 2]];
    const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const area = 0.5 * Math.hypot(...cross);
    for (let k = 0; k < 3; k += 1) { sum[k] += area * (p[o + k] + p[o + 3 + k] + p[o + 6 + k]) / 3; mean[k] += 0.5 * cross[k]; }
    facets.push(cross.map(value => 0.5 * value));
    total += area;
  }
  if (!(total > 0)) return;
  const directions = [mean, cad.selection.normal];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) directions.push([x, y, z]);
  const seen = d => {
    const length = Math.hypot(...d);
    return length > 0 ? facets.reduce((area, n) => area + Math.max(0, (n[0] * d[0] + n[1] * d[1] + n[2] * d[2]) / length), 0) : -1;
  };
  const direction = directions.reduce((best, d) => (seen(d) > seen(best) + 1e-9 ? d : best));
  const center = sum.map(value => value / total);
  let reach = 0;
  for (const facet of cad.selection.facets) {
    for (let k = 9 * facet; k < 9 * facet + 9; k += 3) reach = Math.max(reach, Math.hypot(p[k] - center[0], p[k + 1] - center[1], p[k + 2] - center[2]));
  }
  cad.viewer.lookAt(center.map(value => value * scale), direction, reach * scale, viewClear());
}

function renderSelection() {
  const s = cad.selection;
  const facts = $("cadSelectionFacts");
  $("cadUndo").disabled = !cad.opsHistory.length;
  $("cadClear").disabled = !cad.ops.length;
  if (!s) {
    facts.replaceChildren(el("dt", {}, "Selection"), el("dd", {}, cad.selectionError ? `rejected: ${cad.selectionError.code}` : "none"));
  } else {
    const stats = s.stats || {};
    const strain = Number.isFinite(stats.strain_max) ? `max ${fmt(100 * stats.strain_max, 3)} % · p95 ${fmt(100 * (stats.strain_p95 || 0), 3)} %` : "—";
    const rows = [
      ["Area", `${fmt(s.area_mm2, 1)} mm² · ${plural(s.facets.length, "facet")}`],
      ["Kind", `${s.kind} (${s.method})`],
      ["Strain", strain],
      ["Normal", `(${s.normal.map(value => fmt(value, 3)).join(", ")})`],
      ["Boundary", `${plural(s.sides.length, "side")}${s.holes_uv?.length ? ` · ${plural(s.holes_uv.length, "hole")}` : ""}`],
    ];
    if (cad.selectionError) rows.push(["Last operation", `rejected: ${cad.selectionError.code}`]);
    facts.replaceChildren(...rows.flatMap(([key, value]) => [el("dt", {}, key), el("dd", {}, value)]));
  }
  renderSides();
  renderBorderBar();
  $("cadFit").disabled = !s || Boolean(cad.selectionError);
}

function renderSides() {
  const box = $("cadSides");
  const legend = el("legend", {}, "Tail exit edge");
  const sides = cad.selection?.sides || [];
  renderBorderNote();
  if (!sides.length) { box.replaceChildren(legend, el("p", {className: "hint"}, "Select a surface first.")); return; }
  const edited = borderEdited();
  const option = (value, text, title, edge = null) => {
    const ends = edge?.run ? [edge.run[0], edge.run[edge.run.length - 1]] : [null, null];
    const input = el("input", {type: "radio", name: "cadSide", value, "data-from": ends[0]?.join(","), "data-to": ends[1]?.join(","), "data-length": edge ? round6(edge.length) : null});
    input.checked = value === "point" ? isPoint(cad.side) : String(cad.side) === value;
    const label = el("label", {className: "cad-side", title}, input, el("span", {}, text));
    if (edge) {
      // Pointer or keyboard focus on an edge highlights it on the part (as the Base edge tool's hover does).
      const show = () => hoverEdge(edge.index); const hide = () => hoverEdge(null);
      label.addEventListener("mouseenter", show);
      label.addEventListener("mouseleave", hide);
      input.addEventListener("focus", show);
      input.addEventListener("blur", hide);
    }
    return label;
  };
  // The candidate exits, longest first: the sides while the border is the surface outline (a side too short for the
  // tails, the tessellation of a rounded edge, is left out: a click on such an edge with the Base edge tool uses an
  // arc around the clicked point), the border's edges once it is edited (an exit is at least EXIT_MIN_MM long).
  const listed = listedEdges();
  const short = exitEdges().length - listed.length;
  const first = defaultEdge();
  const fitted = chosenProposal() && !borderStale() && cad.side === "auto" && first !== null;
  // Auto names its edge only (the user's request of 2026-10-30); how it chooses is its tooltip.
  const autoText = first === null ? "Auto" : `Auto (${edgeName(first)})`;
  const autoTitle = `${edited ? "The fit tries the border's longer edges and prefers the narrow tip" : "The fit tries the longer straight sides, arcs on rounded outlines"}`
    + `${first === null ? "" : `; ${fitted ? "chosen" : "first tried"}: ${edgeName(first)}, drawn in magenta on the part`}.`;
  const point = isPoint(cad.side)
    ? option("point", `At the picked point (${cad.side.point_xyz.map(value => fmt(value, 1)).join(", ")}) · the boundary within about ${ARC_HALF_LENGTH_MM} mm`, "picked with the Base edge tool")
    : null;
  const shortText = edited
    ? `${plural(short, "shorter border edge")} (under ${EXIT_MIN_MM} mm) not listed: the tails need an edge of at least ${EXIT_MIN_MM} mm.`
    : `${plural(short, "shorter side")} (under ${MIN_LISTED_SIDE_MM} mm) not listed. On a rounded edge, click the edge with the Base edge tool: the tails then cross the boundary within about ${ARC_HALF_LENGTH_MM} mm of that point.`;
  const none = edited && !listed.length
    ? el("p", {className: "cad-error cad-side-none"}, `No edge of the border is ${EXIT_MIN_MM} mm or longer, so the tails have no exit: drag an edge longer or delete corners.`) : null;
  box.replaceChildren(...[legend, option("auto", autoText, autoTitle), point,
    listed.length ? el("div", {className: "cad-side-list"}, listed.map(edge => option(String(edge.index),
      `${edgeName(edge.index)} · ${fmt(edge.length, 1)} mm${edge.straight ? "" : ` (chord ${fmt(edge.chord, 1)} mm)`}`,
      edited ? "an edge of your border" : edge.straight ? "straight side" : "curved side: the tails cross its chord", edge))) : null,
    none, short ? el("p", {className: "hint cad-side-short"}, shortText) : null].filter(Boolean));
}

function chooseSide(value) {
  if (value === "point") return;  // the picked point stays the base
  cad.side = value === "auto" ? "auto" : Number(value);
  resetFit();
  renderSides();
  paintSide();
  const edge = exitEdges()[cad.side];
  setStatus("ok", cad.side === "auto" ? `Base edge: auto (the fit tries the longer ${borderEdited() ? "border edges" : "straight sides"}).`
    : `Base edge: ${edgeName(cad.side).toLowerCase()} (${fmt(edge?.length, 1)} mm).`);
  renderState();
}
function choosePoint(point) {
  cad.side = {point_xyz: point.map(round6)};
  resetFit();
  renderSides();
  paintSide();
  setStatus("ok", `Base edge: the boundary within about ${ARC_HALF_LENGTH_MM} mm of the picked point (${cad.side.point_xyz.map(value => fmt(value, 1)).join(", ")} mm).`);
  renderState();
}

function onViewClick({clientX, clientY}) {
  if (!cad.viewer || !cad.inspect) return;
  const tool = radioValue("cadTool");
  if (tool === "edge") {
    // The outline comes from the server: this works even with a facet mismatch.  Only the edges in sight count
    // (an edge behind the part never wins over the one under the cursor); near a corner the longer edge wins.
    if (!cad.selection) { setStatus("warning", "Select a surface first; the base edge is one of its sides."); return; }
    const near = cad.viewer.nearestVisiblePoint(edgeRuns(), clientX, clientY);
    if (!near) { setStatus("warning", `Click closer to an edge of the border (the blue line) where you can see it.`); return; }
    const edge = exitEdges()[near.index];
    if (borderEdited()) {
      // With a border the exit is one of its edges (no arc).
      if (edge && edge.length >= EXIT_MIN_MM) chooseSide(String(near.index));
      else setStatus("warning", `${edgeName(near.index)} is ${fmt(edge?.length, 1)} mm long; the tails need an edge of at least ${EXIT_MIN_MM} mm.`);
      return;
    }
    // A long side is the base edge; on a rounded edge (short sides) the base is an arc around the point.
    if (edge && edge.chord >= ARC_WHEN_SIDES_SHORTER_MM) chooseSide(String(near.index));
    else choosePoint(near.point);
    return;
  }
  if (cad.editing) {
    // While the border is edited a click on the part selects nothing (a double click adds a corner).
    if (cad.border?.selected !== null && cad.border?.selected !== undefined) { cad.border.selected = null; paintBorder(); renderBorderBar(); renderState(); }
    return;
  }
  if (cad.facetMismatch) { setStatus("warning", "Clicking on the part to select is off for this file (facet mismatch); use the candidate list."); return; }
  const hit = cad.viewer.pick(clientX, clientY);
  if (!hit) return;
  if (cad.hidden.has(hit.facet)) { setStatus("warning", `Facet ${hit.facet} is hidden inside the part (where two shells touch); it cannot be selected.`); return; }
  // No Disk tool (the user's decision of 2026-10-30; the API's disk operation stays).
  toggleSurface(hit.facet, growOp(hit.facet, "add"));
}

// -- 3. the border and its edges (border.js; docs/CAD_BORDER.md) ------------------------------------
//
// cad.border: {outline (the untouched border: the outline's straight sides, createBorder), uv (the border now, a
// counter-clockwise polygon in the /select chart's uv, replaced on every change), aligned (outline vertex k is side
// k's start, so edge k of the untouched border is side k), sideOf / edgeOf (edge e of the untouched border is side
// sideOf[e], side k its edge edgeOf[k], where their ends agree: createBorder merges a side under B.MERGE_MM into its
// neighbours and drops a straight side's inner corner), history (border.js History of uv), selected (the corner
// picked for Delete), drag, size (mm), step (mm), runs (the edges on the part, for runsFor), handles, outside (parts
// beyond the surface), metrics ({area, overlap} mm²)}.  The border is always mapped with cad.selection.facets_uv (a
// strain-limited fit's chart is another one).

const copyUv = list => list.map(point => [point[0], point[1]]);
const sameBorder = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((p, k) => p[0] === b[k][0] && p[1] === b[k][1]);
const clamp = (value, [low, high]) => Math.min(high, Math.max(low, value));

function newBorder(selection) {
  const outline = B.createBorder(selection.outline_uv, selection.sides);
  if (!outline) return null;
  const sides = selection.sides || [];
  const aligned = outline.length === sides.length && outline.every((p, k) => p[0] === sides[k].from_uv[0] && p[1] === sides[k].from_uv[1]);
  const near = (p, q) => Array.isArray(q) && Math.hypot(p[0] - q[0], p[1] - q[1]) <= B.MERGE_MM;
  const sideOf = outline.map((p, e) => {
    const k = sides.findIndex(side => near(p, side.from_uv) && near(outline[(e + 1) % outline.length], side.to_uv));
    return k >= 0 ? k : null;
  });
  const edgeOf = sides.map((_, k) => { const e = sideOf.indexOf(k); return e >= 0 ? e : null; });
  let [u0, u1, v0, v1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [u, v] of selection.outline_uv) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const size = Math.hypot(u1 - u0, v1 - v0) || 1;
  const border = {outline, uv: copyUv(outline), aligned, sideOf, edgeOf, history: new B.History(outline), selected: null, drag: null, size,
    step: Math.max(0.2, BORDER_STEP_SHARE * size), runs: null, runsFor: null, handles: [], outside: 0, metrics: null};
  border.metrics = borderMetrics(border.uv, selection);
  return border;
}
function borderMetrics(uv, selection) {
  return {area: B.signedArea(uv), overlap: B.overlapArea(uv, selection.outline_uv, selection.holes_uv || [])};
}
function resetBorder() {
  cad.border = null;
  setEditing(false, {quiet: true});
  hoverEdge(null);
  syncBorderRules();
  paintBorder();
  renderBorderBar();
}
function borderReady() {
  // The border can be drawn and edited: a usable selection with its facets' uv, the part drawn with the server's
  // facet ids (not after a facet mismatch, nor while the last selection operation is rejected).
  const s = cad.selection;
  return Boolean(cad.border && cad.viewer && cad.parsed && cad.inspect && !cad.facetMismatch && !cad.selectionError
    && Array.isArray(s?.facets_uv) && s.facets_uv.length === s.facets.length);
}
function borderEdited() {
  // Edited: no longer the surface outline.  Only then is it sent (the fit is the same, with the sides' arcs, without it).
  return Boolean(cad.border) && !sameBorder(cad.border.uv, cad.border.outline);
}
function vertices() {
  return {positions: cad.parsed.positions, scale: cad.inspect.mesh.scale_to_mm};
}
const edgeName = index => `${borderEdited() ? "Border edge" : "Side"} ${index}`;

function uvSegmentRun(uv, index) {
  // Edge `index` of a uv polygon on the part (STL mm): over the facets, beyond them on the nearest facet's plane.
  const s = cad.selection;
  if (!Array.isArray(s?.facets_uv) || !cad.parsed || !cad.inspect || cad.facetMismatch || !Array.isArray(uv) || !uv[index]) return null;
  const v = vertices();
  const points = B.surfacePath([uv[index], uv[(index + 1) % uv.length]], s.facets_uv, cad.border?.step || 1, false)
    .map(point => B.uvToXyzNearest(point, s.facets_uv, s.facets, v)?.xyz).filter(Boolean);
  return points.length > 1 ? points : null;
}
function uvSegmentParts(uv, index) {
  // Edge `index` of a uv polygon on the part, split where it leaves the surface: {runs (on the facets), outsideRuns
  // (beyond them, on the nearest facet's plane)} (STL mm).  surfacePath puts a point on every facet edge it crosses, so
  // each piece between two points lies on one facet or off every facet: its middle tells which.
  const s = cad.selection;
  if (!Array.isArray(s?.facets_uv) || !cad.parsed || !cad.inspect || cad.facetMismatch || !Array.isArray(uv) || !uv[index]) return null;
  const v = vertices();
  const path = B.surfacePath([uv[index], uv[(index + 1) % uv.length]], s.facets_uv, cad.border?.step || 1, false);
  const xyz = path.map(point => B.uvToXyzNearest(point, s.facets_uv, s.facets, v)?.xyz ?? null);
  const parts = {runs: [], outsideRuns: []};
  let run = null; let side = null;
  for (let k = 0; k + 1 < path.length; k += 1) {
    if (!xyz[k] || !xyz[k + 1]) { run = null; continue; }
    const middle = [(path[k][0] + path[k + 1][0]) / 2, (path[k][1] + path[k + 1][1]) / 2];
    const on = B.uvToXyz(middle, s.facets_uv, s.facets, v) !== null;
    if (!run || on !== side) {
      run = [xyz[k]];
      side = on;
      (on ? parts.runs : parts.outsideRuns).push(run);
    }
    run.push(xyz[k + 1]);
  }
  return parts.runs.length || parts.outsideRuns.length ? parts : null;
}
function edgeRuns() {
  // The candidate exits on the part, by index: the sides' runs of the outline, or the border's edges once edited.
  if (!borderEdited()) return cad.runs;
  const border = cad.border;
  if (border.runsFor !== border.uv) {
    border.runs = border.uv.map((_, index) => uvSegmentRun(border.uv, index) || []);
    border.runsFor = border.uv;
  }
  return border.runs;
}
function exitEdges() {
  // Every candidate exit, by index: [{index, length, chord, straight, run}].
  if (!cad.selection) return [];
  const runs = edgeRuns();
  if (!borderEdited()) {
    return (cad.selection.sides || []).map((side, index) => ({index, length: side.length_mm, chord: side.chord_mm, straight: side.straight, run: runs[index]}));
  }
  const uv = cad.border.uv;
  return uv.map((point, index) => {
    const length = Math.hypot(uv[(index + 1) % uv.length][0] - point[0], uv[(index + 1) % uv.length][1] - point[1]);
    return {index, length, chord: length, straight: true, run: runs[index]};
  });
}
function listedEdges() {
  // The exits the list offers, longest first (ties: the lower index): the sides of at least MIN_LISTED_SIDE_MM
  // (chord), or the border's edges of at least EXIT_MIN_MM (border.js rankEdges).
  const edges = exitEdges();
  if (borderEdited()) return B.rankEdges(cad.border.uv).filter(edge => edge.length >= EXIT_MIN_MM).map(edge => edges[edge.index]);
  const key = edge => Math.round(edge.length * 1e9);
  return edges.filter(edge => edge.chord >= MIN_LISTED_SIDE_MM).sort((a, b) => key(b) - key(a) || a.index - b.index);
}
function defaultEdge() {
  // The exit Auto stands for: after a fit the chosen proposal's edge (when it is an edge of the border shown now), before
  // it the longest listed edge (the first the fit tries; it prefers the narrow tip among the longer ones).  Null when
  // there is none (a rounded outline: arcs) or the proposal's exit is an arc.  After an edit of the border (stale
  // proposals) the edge the next fit tries first.
  if (!cad.selection) return null;
  const proposal = chosenProposal();
  if (proposal && cad.side === "auto" && !borderStale()) {
    const placement = proposal.placement;
    const fitted = cad.fit?.request?.border?.uv;
    if (placement.base_kind === "arc") return null;
    if (Number.isInteger(placement.base_side)) {
      if (placement.base_kind === "border" && fitted && sameBorder(fitted, cad.border?.uv)) return placement.base_side;
      if (placement.base_kind !== "border" && !fitted && !borderEdited() && !cad.fit.selection?.strain_limited) return placement.base_side;
    }
  }
  const listed = listedEdges();
  return listed.length ? listed[0].index : null;
}

let borderFrame = 0;
function paintBorder() {
  // The border on the part (solid on the surface, dashed beyond it: no taxels there) and, while editing, its handles.
  if (!cad.viewer) return;
  const border = cad.border;
  if (!borderReady()) {
    cad.viewer.setBorder(null);
    cad.viewer.setBorderHandles(null);
    if (border) { border.handles = []; border.outside = 0; }
    return;
  }
  const s = cad.selection; const v = vertices();
  // uvToXyz is null off the facets: the loop has gaps where the border leaves the surface (the cross-check's A1).
  const loop = B.surfacePath(border.uv, s.facets_uv, border.step, true).map(uv => B.uvToXyz(uv, s.facets_uv, s.facets, v));
  const outside = B.outsideParts(border.uv, s.outline_uv, s.holes_uv || []);
  const outsideRuns = outside.map(run => B.surfacePath(run, s.facets_uv, border.step, false).map(uv => B.uvToXyzNearest(uv, s.facets_uv, s.facets, v)?.xyz ?? null));
  border.outside = outside.length;
  cad.viewer.setBorder(loop, {outsideRuns});
  border.handles = cad.editing
    ? handlePriority(B.borderHandles(border.uv, s.facets_uv, s.facets, v).filter(handle => handle.xyz), border.uv)
      .map(handle => ({kind: handle.kind, index: handle.index, xyz: handle.xyz, selected: handle.kind === "vertex" && handle.index === border.selected}))
    : [];
  cad.viewer.setBorderHandles(border.handles.length ? border.handles : null, {edges: borderEdgeRuns});
}
function handlePriority(handles, uv) {
  // The handles in the order the viewer keeps them where they overlap on screen: the corners (turning at least
  // B.SOFT_CORNER_DEG, sharpest first), the edges (longest first), then the soft corners (a faceted arc's steps).
  const n = uv.length;
  const turn = k => {
    const a = uv[(k + n - 1) % n]; const b = uv[k]; const c = uv[(k + 1) % n];
    const u = [b[0] - a[0], b[1] - a[1]]; const w = [c[0] - b[0], c[1] - b[1]];
    return Math.abs(Math.atan2(u[0] * w[1] - u[1] * w[0], u[0] * w[0] + u[1] * w[1])) * 180 / Math.PI;
  };
  const length = k => Math.hypot(uv[(k + 1) % n][0] - uv[k][0], uv[(k + 1) % n][1] - uv[k][1]);
  const key = handle => {
    if (handle.kind === "edge") return [1, -length(handle.index)];
    const degrees = turn(handle.index);
    return [degrees >= B.SOFT_CORNER_DEG ? 0 : 2, -degrees];
  };
  return handles.map(handle => ({handle, key: key(handle)}))
    .sort((p, q) => p.key[0] - q.key[0] || p.key[1] - q.key[1] || p.handle.index - q.handle.index)
    .map(item => item.handle);
}
function borderEdgeRuns() {
  // The border's edges on the part by edge index (STL mm), for a press on an edge's line; cached per border.
  const border = cad.border;
  if (!border) return [];
  if (border.edgeRunsFor !== border.uv) {
    border.edgeRuns = border.uv.map((_, index) => uvSegmentRun(border.uv, index) || []);
    border.edgeRunsFor = border.uv;
  }
  return border.edgeRuns;
}
function schedulePaint() {
  // During a drag: one repaint per frame.
  if (borderFrame) return;
  borderFrame = requestAnimationFrame(() => { borderFrame = 0; paintBorder(); paintSide(); renderState(); });
}

function hoverEdge(index, at = null) {
  // The edge under the pointer (Base edge tool) or a hovered list row: highlighted on the part, named with its length.
  const edge = index === null || index === undefined ? null : exitEdges()[index] || null;
  const shown = edge ? edge.index : null;
  if (cad.hover !== shown) {
    cad.hover = shown;
    cad.viewer?.setHoverRun(edge?.run || null);
    renderState();
  }
  const label = $("cadHoverLabel");
  if (!edge || !at) { label.hidden = true; return; }
  const arc = !borderEdited() && edge.chord < ARC_WHEN_SIDES_SHORTER_MM;
  const short = borderEdited() && edge.length < EXIT_MIN_MM;
  label.textContent = `${edgeName(edge.index)} · ${fmt(edge.length, 1)} mm${arc ? " · the boundary around this point" : short ? " · too short for the tails" : ""}`;
  const rect = $("cadView").getBoundingClientRect();
  label.hidden = false;
  const left = Math.min(at.x - rect.left + 14, rect.width - label.offsetWidth - 6);
  const top = at.y - rect.top + (at.y - rect.top > rect.height - 40 ? -30 : 14);
  label.style.left = `${Math.max(4, left)}px`;
  label.style.top = `${Math.max(4, top)}px`;
}
let hoverFrame = 0;
let hoverAt = null;
function onViewPointerMove(event) {
  // The viewer swallows the moves of a handle drag; an orbit (a button held) shows no hover.
  hoverAt = {x: event.clientX, y: event.clientY, buttons: event.buttons};
  if (hoverFrame) return;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = 0;
    const at = hoverAt;
    if (!at || at.buttons || radioValue("cadTool") !== "edge" || !cad.viewer || !cad.selection) { hoverEdge(null); return; }
    const near = cad.viewer.nearestVisiblePoint(edgeRuns(), at.x, at.y);
    hoverEdge(near ? near.index : null, near ? at : null);
  });
}

function borderSummary() {
  const border = cad.border;
  if (!border?.metrics) return "";
  const {area, overlap} = border.metrics;
  const share = area > 0 ? Math.min(1, overlap / area) : 0;
  return `Border: ${plural(border.uv.length, "corner")}, ${fmt(area, 1)} mm², ${fmt(100 * share, 0)} % on the surface${border.outside ? " (dashed beyond it: no taxels there)" : ""}.`;
}
function borderState() {
  const border = cad.border;
  if (!border) return null;
  const info = cad.viewer?.info() || {};
  const r4 = value => Math.round(value * 1e4) / 1e4;
  return {
    vertices: border.uv.length, edited: borderEdited(), ready: borderReady(), editing: cad.editing, aligned: border.aligned,
    selected_vertex: border.selected, can_undo: border.history.canUndo, can_redo: border.history.canRedo,
    uv: border.uv.map(point => point.map(round6)), outline_vertices: border.outline.length, outside_parts: border.outside,
    area_mm2: border.metrics ? round6(border.metrics.area) : null, on_surface_mm2: border.metrics ? round6(border.metrics.overlap) : null,
    drawn: {segments: info.borderSegments ?? 0, outside_segments: info.borderOutsideSegments ?? 0, handles: info.borderHandles ?? 0, shown: info.borderHandlesShown ?? null,
      editing: info.borderEditing ?? false, dragging: info.borderDragging ?? null, hover: info.hoverRun ?? false,
      exit_segments: info.sideSegments ?? 0, exit_outside_segments: info.sideOutsideSegments ?? 0},
    handles: cad.editing ? border.handles.map(handle => ({kind: handle.kind, index: handle.index, xyz: handle.xyz.map(r4)})) : null,
  };
}
function renderBorderNote() {
  const note = $("cadBorderNote");
  const border = cad.border;
  if (!cad.selection || !border) { note.hidden = true; return; }
  note.hidden = false;
  if (!borderReady() && !borderEdited()) {
    note.textContent = cad.facetMismatch ? "The border cannot be drawn for this file (facet mismatch): the fit uses the whole surface, as its outline."
      : "Border: the surface outline (the fit uses the whole surface).";
    return;
  }
  note.textContent = borderEdited()
    ? `${borderSummary()} The taxels lie inside your border; the tails leave across one of its edges; the routing may leave it. Containment is Field only while it is used.`
    : "Border: the surface outline (blue on the part). Edit border, left in the view, drags its corners and edges: the taxels then lie inside it.";
}
function renderBorderBar() {
  const ready = borderReady();
  const button = $("cadEditBorder");
  button.disabled = !ready;
  button.setAttribute("aria-pressed", String(cad.editing));
  button.textContent = cad.editing ? "Done editing" : "Edit border";
  button.title = ready ? "Drag the border's corners and edges on the part; the taxels lie inside it"
    : cad.facetMismatch ? "Off for this file: the browser's facets do not match the server's" : "Select a surface first";
  $("cadBorderBar").hidden = !cad.editing;
  const border = cad.border;
  const selected = border && border.selected !== null;
  $("cadBorderDelete").disabled = !cad.editing || !selected || border.uv.length <= 3;
  $("cadBorderUndo").disabled = !cad.editing || !border?.history.canUndo;
  $("cadBorderRedo").disabled = !cad.editing || !border?.history.canRedo;
  $("cadBorderReset").disabled = !cad.editing || !borderEdited();
  ["cadBorderInset", "cadBorderInsetMm", "cadBorderSnap"].forEach(id => { $(id).disabled = !cad.editing; });
  $("cadView").classList.toggle("is-editing", cad.editing);
}

let defaultHelp = "";
const EDIT_HELP = "Editing the border: drag a corner (any shape) or an edge by its diamond or its line (it moves parallel, its neighbours extended) · "
  + "double-click an edge: add a corner · click a corner, then Delete: remove it · Ctrl+Z / Ctrl+Shift+Z: undo / redo · "
  + "beyond the surface the border is dashed (no taxels there) · drag elsewhere: rotate.";
function setEditing(on, {quiet = false} = {}) {
  const next = Boolean(on) && borderReady();
  const changed = next !== cad.editing;
  cad.editing = next;
  if (cad.border && !next) cad.border.selected = null;
  // Off: ends a drag in progress (its "end" commits it).
  cad.viewer?.setBorderEditing(next);
  paintBorder();
  renderBorderBar();
  $("cadHelp").textContent = next ? EDIT_HELP : defaultHelp;
  if (changed && !quiet) {
    setStatus("ok", next ? `Editing the border. ${borderSummary()} Clicks on the part select nothing until Done editing.`
      : `${borderEdited() ? borderSummary() : "Border: the surface outline."} ${cad.fit && fitStale() ? "Fit again to update the proposals." : ""}`.trim());
  }
  renderState();
}

function afterBorderChange(before) {
  // Every change of the border: the exit kept where it still names the same edge, the fit rules, the drawing, the list,
  // and the proposals stale (Generate waits for a new fit, as for the other settings).
  const border = cad.border;
  if (!border) return;
  const edited = borderEdited();
  const wasEdited = Array.isArray(before) && !sameBorder(before, border.outline);
  const count = edited ? border.uv.length : (cad.selection?.sides || []).length;
  if (isPoint(cad.side) && edited) cad.side = "auto";  // a picked point's arc is an exit of the outline only
  // The outline's side k is the untouched border's edge edgeOf[k] (and back on a reset or an undo to the outline).
  if (Number.isInteger(cad.side) && edited !== wasEdited) cad.side = (edited ? border.edgeOf : border.sideOf)[cad.side] ?? "auto";
  if (Number.isInteger(cad.side) && cad.side >= count) cad.side = "auto";
  if (border.selected !== null && border.selected >= border.uv.length) border.selected = null;
  border.metrics = borderMetrics(border.uv, cad.selection);
  syncBorderRules();
  paintBorder();
  renderSides();
  paintSide();
  renderBorderBar();
  onConfigChange();
  renderState();
}
function commitBorder(next, {side = cad.side, selected = null, message = ""} = {}) {
  const border = cad.border;
  if (!border || !next) return false;
  if (next.length > BORDER_MAX_VERTICES) { setStatus("warning", `A border has at most ${BORDER_MAX_VERTICES} corners.`); return false; }
  const before = border.uv;
  if (sameBorder(before, next)) { if (message) setStatus("ok", `${message}: no change.`); return false; }
  border.uv = next;
  border.selected = selected;
  cad.side = side;
  border.history.push(next);
  afterBorderChange(before);
  if (message) setStatus("ok", `${message}. ${borderSummary()}${cad.fit ? " Fit again to update the proposals." : ""}`);
  return true;
}
function snapTolerance() {
  return clamp(SNAP_SHARE * (cad.border?.size || 1), SNAP_MM);
}

function onBorderDrag(event) {
  // viewer.onBorderDrag: a handle dragged on the part ({kind, index, phase, xyz, facet}); facet null beyond the surface.
  const border = cad.border;
  if (!border || !borderReady()) return;
  const {kind, index, phase} = event;
  if (phase === "start") {
    border.drag = {kind, index, start: border.uv, moved: false};
    if (kind === "vertex") border.selected = index;
    // The viewer cancels the press on a handle (no orbit): the view takes the focus here, for Delete and Ctrl+Z.
    $("cadView").focus({preventScroll: true});
    paintBorder();
    renderBorderBar();
    renderState();
    return;
  }
  const drag = border.drag;
  if (!drag || drag.kind !== kind || drag.index !== index) return;
  if (phase === "move") {
    const s = cad.selection;
    const uv = B.xyzToUv(event.xyz, event.facet, s.facets_uv, s.facets, vertices());
    if (!uv) return;
    // Every move from the border the drag started with: the result depends on the pointer only.  Null: refused
    // (an edge turned round, a crossing): the border stays as it is.
    let next = kind === "vertex" ? B.moveVertex(drag.start, index, uv) : B.moveEdge(drag.start, index, uv);
    if (!next) return;
    if ($("cadBorderSnap").checked) {
      next = kind === "vertex" ? B.snap(next, s.outline_uv, snapTolerance(), {indices: [index], holesUv: s.holes_uv || []})
        : B.snapEdge(next, index, s.outline_uv, snapTolerance());
    }
    if (sameBorder(next, border.uv)) return;
    border.uv = next;
    drag.moved = true;
    schedulePaint();
    return;
  }
  if (phase === "end") {
    border.drag = null;
    if (drag.moved && !sameBorder(drag.start, border.uv)) {
      border.history.push(border.uv);
      afterBorderChange(drag.start);
      setStatus("ok", `${kind === "vertex" ? `Corner ${index}` : `Edge ${index}`} moved. ${borderSummary()}${cad.fit ? " Fit again to update the proposals." : ""}`);
    } else {
      border.uv = drag.start;
      paintBorder();
      renderBorderBar();
      if (kind === "vertex") setStatus("neutral", `Corner ${index} selected: Delete removes it (the border keeps at least 3 corners).`);
      renderState();
    }
  }
}

function borderAction(action) {
  const border = cad.border;
  if (!border || !cad.editing) return;
  const s = cad.selection;
  if (action === "reset") {
    commitBorder(copyUv(border.outline), {side: "auto", message: "Border reset to the surface outline"});
  } else if (action === "inset") {
    const mm = Number($("cadBorderInsetMm").value);
    if (!Number.isFinite(mm) || !$("cadBorderInsetMm").validity.valid) { setStatus("error", "Enter the inset in mm (negative: outward)."); return; }
    const next = B.inset(border.uv, mm);
    if (!next) { setStatus("warning", `An inset of ${fmt(mm, 1)} mm leaves no border.`); return; }
    commitBorder(next, {side: next.length === border.uv.length ? cad.side : "auto", message: `Border inset by ${fmt(mm, 1)} mm`});
  } else if (action === "delete") {
    const i = border.selected;
    if (i === null) return;
    const next = B.deleteVertex(border.uv, i);
    if (!next) { setStatus("warning", `Corner ${i} cannot be removed: the border keeps at least 3 corners and must stay simple.`); return; }
    const n = next.length;
    // Edges i - 1 and i become one (edge i - 1); the later ones move down by one.
    const remap = j => (j < i ? j : j === i ? (i - 1 + n) % n : j - 1);
    commitBorder(next, {side: Number.isInteger(cad.side) ? remap(cad.side) : cad.side, message: `Corner ${i} removed`});
  } else if (action === "undo" || action === "redo") {
    const before = border.uv;
    const state = action === "undo" ? border.history.undo() : border.history.redo();
    if (!state) return;
    border.uv = state;
    border.selected = null;
    if (Number.isInteger(cad.side) && state.length !== before.length) cad.side = "auto";
    afterBorderChange(before);
    setStatus("ok", `${action === "undo" ? "Undone" : "Redone"}. ${borderEdited() ? borderSummary() : "Border: the surface outline."}`);
  }
}
function insertCorner(index, uv) {
  const border = cad.border;
  const next = B.insertVertex(border.uv, index, uv);
  if (!next) { setStatus("warning", "No corner added there (too close to a corner)."); return; }
  // Edge index splits into index and index + 1; the later ones move up by one.
  const side = Number.isInteger(cad.side) && cad.side > index ? cad.side + 1 : cad.side;
  commitBorder(next, {side, selected: index + 1, message: `Corner ${index + 1} added on edge ${index}`});
}
function onViewDoubleClick(event) {
  // While editing: a double click on an edge (its diamond or its line, where it is in sight) adds a corner there.
  if (!cad.editing || !borderReady()) return;
  const s = cad.selection;
  const handle = cad.viewer.pickHandle(event.clientX, event.clientY);
  if (handle?.kind === "vertex") return;
  if (handle?.kind === "edge") {
    const uv = cad.border.uv; const a = uv[handle.index]; const b = uv[(handle.index + 1) % uv.length];
    insertCorner(handle.index, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    return;
  }
  const near = cad.viewer.nearestVisiblePoint(borderEdgeRuns(), event.clientX, event.clientY, {tiePx: 0});
  if (!near) return;
  const uv = B.xyzToUv(near.point, null, s.facets_uv, s.facets, vertices());
  if (uv) insertCorner(near.index, uv);
}
function onViewKey(event) {
  if (!cad.editing || !cad.border) return;
  const key = event.key; const command = event.ctrlKey || event.metaKey;
  if ((key === "Delete" || key === "Backspace") && cad.border.selected !== null) borderAction("delete");
  else if (command && key.toLowerCase() === "z") borderAction(event.shiftKey ? "redo" : "undo");
  else if (command && key.toLowerCase() === "y") borderAction("redo");
  else if (key === "Escape") {
    if (cad.border.selected !== null) { cad.border.selected = null; paintBorder(); renderBorderBar(); renderState(); } else setEditing(false);
  } else return;
  event.preventDefault();
}

function syncBorderRules() {
  // A border constrains the taxels only (field-only containment; the server refuses Whole board with one, the
  // cross-check's A2): while it is used, Containment shows Field only, disabled (syncContainment); the choice made
  // before comes back when it is the outline again.
  syncContainment();
}

// -- 4./5. fit and proposals ----------------------------------------------------------

function readOptions() {
  // The fit options of the configure step (a disabled control sends nothing), and the inputs out of range.
  const options = {};
  const invalid = [];
  for (const control of $("cadConfig").querySelectorAll("[data-option]")) {
    if (control.disabled) continue;
    if (control.tagName === "SELECT") { options[control.dataset.option] = control.value; continue; }
    const value = Number(control.value);
    if (control.value.trim() === "" || !control.validity.valid || !Number.isFinite(value)) invalid.push(control);
    else options[control.dataset.option] = control.step === "1" ? Math.round(value) : value;
  }
  // With a border (syncBorderRules disables Containment): field-only containment, sent.
  if (borderEdited()) options.containment = "field";
  return {options, invalid};
}
function borderPayload() {
  // The border the fit gets: the edited border (full precision), else none (the untouched outline: the same fit).
  return borderEdited() ? {uv: copyUv(cad.border.uv)} : null;
}
function basePayload(border) {
  // With a border its edge ({border_edge}; its edge k is side k while it is the outline), else a side or a point.
  if (cad.side === "auto") return "auto";
  if (border) return {border_edge: cad.side};
  return isPoint(cad.side) ? {point_xyz: cad.side.point_xyz} : {side: cad.side};
}
function fitOptions() {
  const {options, invalid} = readOptions();
  $("cadConfig").querySelectorAll("input[data-option]").forEach(control => control.setAttribute("aria-invalid", String(invalid.includes(control))));
  return invalid.length ? {invalid} : {options};
}
function fitStale() {
  // The settings differ from the ones the shown proposals were fitted with: Generate would build the old settings
  // (a proposal carries its own options), so it waits for a new fit.  An edit of the border counts as well.
  if (!cad.fit || !cad.fitOptions) return false;
  if (borderStale()) return true;
  const {options, invalid} = readOptions();
  const keys = new Set([...Object.keys(options), ...Object.keys(cad.fitOptions)]);
  return invalid.length > 0 || [...keys].some(key => options[key] !== cad.fitOptions[key]);
}
function borderStale() {
  // The border or the exit differs from the fitted ones (an edit of the border after the fit).
  if (!cad.fit || !cad.fitRequest) return false;
  const border = borderPayload();
  return JSON.stringify(border) !== JSON.stringify(cad.fitRequest.border) || JSON.stringify(basePayload(border)) !== JSON.stringify(cad.fitRequest.base);
}
function staleText() {
  return borderStale() ? "The border changed: fit again to update the proposals (Generate waits for the new fit)."
    : "Settings changed: fit again to update the proposals (Generate waits for the new fit).";
}
function onConfigChange() {
  if (!cad.fit) return;
  $("cadFitNote").textContent = fitStale() ? staleText() : "";
  $("cadFitFacts").textContent = fitNote();
  renderGenerate();
  renderState();
}
function syncObjective() {
  const fixed = $("cadObjective").value === "fixed_pitch";
  $("cadPitch").disabled = !fixed;
  $("cadMinPitch").disabled = fixed;
}
function syncContainment() {
  // The field follows the selected area (CAD mode has no rectangle shape and no board rules to choose: section 26.16);
  // Row traces apply to Field only.  A border (syncBorderRules) holds Containment at Field only, disabled, with the
  // Row traces free: the hold is released first (the rules below run as without it) and taken again after them; the
  // choice made before the border comes back when it is the outline again.
  const containment = $("cadContainment");
  const held = borderEdited();
  if ("borderValue" in containment.dataset) {
    containment.disabled = false;
    if (!held) { containment.value = containment.dataset.borderValue; delete containment.dataset.borderValue; }
  }
  if (held) {
    if (!("borderValue" in containment.dataset)) containment.dataset.borderValue = containment.value;
    containment.value = "field";
  }
  // Under Whole board the Row traces are the straight channel beside the field: the select says so (its
  // "channel" option, never sent) and gets the Field-only choice back.
  const sides = $("cadRowSides");
  const channel = containment.value !== "field";
  if (channel && !sides.disabled) {
    sides.dataset.fieldValue = sides.value;
    sides.value = "channel";
  } else if (!channel && sides.disabled) {
    sides.value = sides.dataset.fieldValue || "both";
  }
  sides.disabled = channel;
  if (held) containment.disabled = true;
  const corners = " At the field's four corners its 0.5 mm margin may leave the surface by up to 0.5 mm; the taxels never do.";
  const border = held
    ? " Your border keeps the taxels inside it and never limits the routing, so while it is used Containment is Field only (Surface outline, in the border editor, brings your choice back)." : "";
  $("cadConfigHint").textContent = containment.value === "field"
    ? `Only the taxel field stays on the surface: the Row traces beside it, the Column fan-out and both tails may leave it, beyond its sides and the base edge.${corners}${border} Left and right are seen from outside, looking at the part with the tails down (the Row FPC preview shows its copper side, so there they appear mirrored).`
    : "Everything above the tail roots stays on the surface; only the tails leave it, across the base edge. The Row traces run in a straight channel beside the field.";
}

function resetFit() {
  abortRequests("fit", "preview", "map");
  cad.seq.fit += 1; cad.seq.preview += 1; cad.seq.map += 1;
  cad.fit = null; cad.chosen = null; cad.preview = null; cad.map = null; cad.mapError = null;
  renderProposals();
  renderVerification();
  cad.viewer?.setOverlay(null);
  paintSide();
}

function keepViewInSight() {
  // After a fit the proposal is drawn on the part: bring the view back if it is mostly scrolled away.
  const view = $("cadView");
  const rect = view.getBoundingClientRect();
  const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  if (rect.height > 0 && visible < 0.3 * rect.height) {
    const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    view.scrollIntoView({block: "nearest", behavior: smooth ? "smooth" : "auto"});
  }
}

async function runFit() {
  if (!cad.selection) return;
  if (cad.limitsSync) await cad.limitsSync;
  const {options, invalid} = fitOptions();
  if (invalid) {
    const names = invalid.map(control => document.querySelector(`label[for="${control.id}"]`)?.textContent || control.id);
    fail({code: "E_CLIENT_OPTIONS", message: `check ${names.join(", ")} (out of range).`}, "Not fitted");
    invalid[0].focus();
    return;
  }
  const border = borderPayload();
  if (border) {
    const s = cad.selection;
    const check = B.validate(border.uv, s.outline_uv, s.holes_uv || []);
    if (!check.ok) { fail({code: "E_CLIENT_BORDER", message: `${check.message} Edit the border (or Surface outline) and fit again.`}, "Not fitted"); return; }
    if (!listedEdges().length) { fail({code: "E_CLIENT_BORDER", message: `no edge of the border is ${EXIT_MIN_MM} mm or longer: the tails have no exit.`}, "Not fitted"); return; }
    if (border.uv.length > BORDER_MAX_VERTICES) { fail({code: "E_CLIENT_BORDER", message: `the border has ${border.uv.length} corners; at most ${BORDER_MAX_VERTICES} (delete corners, or Surface outline).`}, "Not fitted"); return; }
  }
  resetFit();
  cad.fitOptions = options;  // the options of the last fit request (the state dump shows them)
  const base = basePayload(border);
  cad.fitRequest = {border, base};
  const sequence = cad.seq.fit;
  setStatus("neutral", `Fitting the sensor${border ? " inside your border" : ""}: searching rows, columns, routing and role mapping on the surface…`);
  $("cadFit").disabled = true;
  try {
    const extra = {selection: {ops: cad.ops}, base, options, ...(border ? {border} : {})};
    // The default part's fit is shipped (DEFAULT_PART.fit) when the request is that one; any other asks the server.
    const shipped = cad.defaultFile && cad.defaultFit && canonical(header(extra)) === canonical(cad.defaultFit.request);
    const reply = shipped ? structuredClone(cad.defaultFit.reply) : await request("fit", "fit", extra);
    if (sequence !== cad.seq.fit) return;
    cad.fitSource = shipped ? "shipped" : "server";
    cad.fit = reply;
    cad.error = cad.facetMismatch ? "E_CLIENT_FACET_ORDER" : null;
    const count = reply.proposals.length;
    if (count) setStatus("ok", `${plural(count, "proposal")}${border ? " inside your border" : ""}; #1 has ${reply.proposals[0].metrics.taxels} taxels. Check it on the part, then Generate.`);
    else setStatus("warning", "No proposal: change the settings or the selection.");
    renderProposals();
    if (count) {
      chooseProposal(0, {look: true});
      keepViewInSight();
    }
    // Auto names the edge it chose.
    renderSides();
  } catch (error) {
    if (sequence !== cad.seq.fit || aborted(error)) return;
    // E_SURFACE_NO_FIT details: {rejected: [{reason, count}], bases}.
    const reasons = error.details?.rejected || error.details?.reasons;
    fail(error, "No fit");
    if (Array.isArray(reasons) && reasons.length) {
      const text = reasons.map(reason => (typeof reason === "string" ? reason : `${reason.count ?? ""} ${reason.reason || JSON.stringify(reason)}`.trim()));
      $("cadFitNote").textContent = `Rejected candidates: ${text.join("; ")}. Try a smaller pitch, a smaller edge margin, another base edge${border ? ", a larger border" : ""} or a larger selection.`;
    } else if (error.code === "E_SURFACE_BORDER") {
      $("cadFitNote").textContent = "The border was refused: pick another exit edge (one with surface beyond it, at least 3 mm long), or edit the border.";
    }
  } finally {
    $("cadFit").disabled = !cad.selection || Boolean(cad.selectionError);
    renderState();
  }
}

function chosenProposal() {
  return Number.isInteger(cad.chosen) ? cad.fit?.proposals?.[cad.chosen] || null : null;
}

const roleText = role => (role === "rows_top" ? "Row FPC" : role === "columns_top" ? "Column FPC" : String(role));

function renderGenerate() {
  const proposal = chosenProposal();
  const button = $("cadGenerate");
  const stale = fitStale();
  button.disabled = !proposal || Boolean(cad.pendingBuild) || stale;
  button.textContent = !proposal ? "Generate & validate the chosen proposal"
    : stale ? `Fit again first: the ${borderStale() ? "border" : "settings"} changed since these proposals`
      : `Generate & validate proposal #${proposal.rank} (${taxelText(proposal.metrics)})`;
}

// "N of R × C" for a masked field (the readout keeps R × C positions), "R × C" for a rectangle.
function taxelText(m) {
  const positions = m.positions ?? m.rows * m.columns;
  return m.taxels < positions ? `${m.taxels} of ${m.rows} × ${m.columns}` : `${m.rows} × ${m.columns}`;
}
const readerText = name => (name ? (name === "32x16" ? "32 × 16 FlexiTac" : name.replace("x", " × ")) : "none");

function renderProposals() {
  const wrap = $("cadProposalWrap");
  const proposals = cad.fit?.proposals || [];
  renderGenerate();
  renderCard();
  if (!cad.fit) {
    wrap.replaceChildren(el("p", {className: "hint"}, cad.selection ? "Fit the sensor to list ranked proposals." : "Select a surface, then fit the sensor."));
    $("cadFitNote").textContent = "";
    $("cadFitFacts").textContent = "";
    $("cadFlatFigure").hidden = true;
    $("cadViewNote").hidden = true;
    return;
  }
  // "cad-opt" columns are dropped when the table is narrow (styles.css container query).
  const head = [["", ""], ["#", ""], ["Readout rows × columns", ""], ["Pitch (mm)", ""], ["Taxels", ""], ["Sampled", "cad-opt"], ["Coverage", ""], ["Angle", "cad-opt"],
    ["Stack width", "cad-opt"], ["Tip", "cad-opt"], ["Tails row / column", ""], ["Traces", "cad-opt"], ["Reader", "cad-opt"], ["On top", ""]];
  const rows = proposals.map((proposal, index) => {
    const m = proposal.metrics; const routing = proposal.design.routing;
    const pitch = m.pitch_x_mm === m.pitch_y_mm ? fmt(m.pitch_x_mm) : `${fmt(m.pitch_x_mm)} × ${fmt(m.pitch_y_mm)}`;
    const input = el("input", {type: "radio", name: "cadProposal", value: index, "aria-label": `Proposal ${proposal.rank}`});
    input.checked = index === cad.chosen;
    input.addEventListener("change", () => chooseProposal(index));
    const row = el("tr", {className: index === cad.chosen ? "is-chosen" : "", "data-rank": proposal.rank},
      el("td", {}, input), el("th", {scope: "row"}, String(proposal.rank)),
      el("td", {}, `${m.rows} × ${m.columns}`), el("td", {className: "num"}, pitch), el("td", {className: "num", "data-taxels": m.taxels}, taxelText(m) === `${m.rows} × ${m.columns}` ? String(m.taxels) : taxelText(m)),
      el("td", {className: "num cad-opt"}, `${fmt(100 * (m.sampled ?? 1), 0)} %`),
      el("td", {className: "num"}, `${fmt(100 * m.field_coverage, 1)} %`), el("td", {className: "num cad-opt"}, `${fmt(m.angle_deg ?? proposal.placement.base_angle_deg ?? 0, 0)}°`),
      el("td", {className: "num cad-opt"}, `${fmt(m.stack_width_mm, 1)} mm`),
      el("td", {className: "num cad-opt", "data-tip": m.row_bus?.tip_width_mm ?? null}, m.row_bus ? `${fmt(m.row_bus.tip_width_mm, 1)} mm` : "—"),
      el("td", {className: "num"}, `${fmt(m.row_tail_mm, 1)} / ${fmt(m.column_tail_mm, 1)} mm`),
      el("td", {className: "cad-opt"}, `${m.routing} ${trim(routing.trace_width_mm)}/${trim(routing.trace_space_mm)}`), el("td", {className: "cad-opt"}, readerText(m.reader)),
      el("td", {}, roleText(m.role_mapping)));
    row.addEventListener("click", event => { if (event.target !== input) { input.checked = true; chooseProposal(index); } });
    return row;
  });
  wrap.replaceChildren(el("table", {className: "cad-table", id: "cadProposals"},
    el("caption", {}, `${plural(proposals.length, "proposal")}, best first`),
    el("thead", {}, el("tr", {}, head.map(([text, className]) => el("th", {scope: "col", className: className || null}, text)))), el("tbody", {}, rows)));
  $("cadFitNote").textContent = fitStale() ? staleText() : "";
  $("cadFitFacts").textContent = fitNote();
}

function fitNote() {
  // The base edges tried, why there are fewer proposals than asked for, the rejected candidates and the obstacles.
  const bySide = new Map();
  for (const base of cad.fit.bases || []) {
    const entry = bySide.get(base.side) || {angles: new Set(), candidates: 0};
    if (Number.isFinite(base.angle_deg)) entry.angles.add(Math.abs(base.angle_deg));
    entry.candidates += base.candidates || 0;
    bySide.set(base.side, entry);
  }
  // With a border the bases are its edges (reply.bases[].side holds border edge indices).
  const word = cad.fit.request?.border ? "border edge" : "side";
  const tried = [...bySide].map(([side, entry]) => {
    const turn = Math.max(0, ...entry.angles);
    return `${Number.isInteger(side) ? `${word} ${side}` : String(side)}${turn ? ` (0° to ±${fmt(turn, 0)}°)` : ""}`;
  }).join(", ");
  const count = cad.fit.proposals.length; const asked = cad.fitOptions?.proposals;
  const field = cad.fit.proposals.some(proposal => containmentOf(proposal) === "field");
  const short = Number.isInteger(asked) && count < asked
    ? `${count} of the ${asked} proposals asked for: ${field ? "the field-only search keeps the best readout and the others within 3 % of it, and " : ""}a field that repeats a readout, or has no more taxels than an earlier proposal on as large a readout, is not proposed.` : "";
  const rejected = (cad.fit.rejected || []).map(item => `${item.count} ${item.reason}`).join(", ");
  const obstacles = Object.entries(cad.fit.obstacles || {}).filter(([, number]) => number).map(([key, number]) => `${number} ${key}`).join(", ");
  const border = cad.fit.request?.border ? `Inside your border (${plural(cad.fit.request.border.uv.length, "corner")}): every taxel lies in it.` : "";
  return [border, tried && `Base edges tried: ${tried}.`, short, rejected && `Rejected candidates: ${rejected}.`, `Obstacles: ${obstacles || "none"}.`].filter(Boolean).join(" ");
}

const sidesText = sides => (sides === "both" ? "both sides (alternate rows)" : `${sides} side`);
// Where the Row tail lies (construction.row_bus.tail_position): centred under the field in every side mode, as the
// Column tail (diagonal-bus/10); with both the two sides meet in a funnel into it, one side fans in under the field.
const tailPosition = bus => (bus.tail_position !== "centred" ? ""
  : bus.sides === "both" ? "a funnel into the Row tail centred under the field" : "fanning in under the field into the Row tail centred under it");
const share = value => (Number.isFinite(value) ? `${fmt(100 * value, 0)} %` : "—");

function renderCard() {
  // The chosen proposal: its containment, the Row traces (the diagonal bus's tip and bands), and how much of
  // each board lies on the surface and how far it overhangs it (metrics.row_bus, metrics.routing_on_surface).
  const card = $("cadProposalCard");
  const proposal = chosenProposal();
  if (!proposal) { card.hidden = true; return; }
  const m = proposal.metrics; const bus = m.row_bus; const report = m.routing_on_surface;
  const field = containmentOf(proposal) === "field";
  $("cadProposalCardTitle").textContent = `Proposal #${proposal.rank} · ${taxelText(m)}${m.taxels < (m.positions ?? m.rows * m.columns) ? ` (${m.taxels} taxels)` : ` = ${m.taxels} taxels`}`;
  const facts = [
    ["Containment", field ? `field only: the taxel field on the surface (${fmt(m.min_clearance_mm)} mm clear); the routing may leave it`
      : "whole board: everything above the tail roots on the surface"],
    ["Row traces", bus ? `diagonal bus, ${sidesText(bus.sides)}${tailPosition(bus) ? `: ${tailPosition(bus)}` : ""}`
      : "straight Row channel beside the field"],
  ];
  if (proposal.placement.border) {
    // A fit with a border (surface/border.py): the metrics' border area and share on the surface; the exit is its edge.
    facts.splice(1, 0, ["Border", `${plural(proposal.placement.border.uv.length, "corner")}, ${fmt(m.border_area_mm2, 1)} mm², ${share(m.border_on_surface_share)} on the surface: `
      + `every taxel inside it (the routing may leave it); the tails leave across border edge ${proposal.placement.base_side}`]);
  }
  if (bus) {
    const band = bus.band_mm || {};
    const bands = bus.sides === "both" ? [`${fmt(band.near)} mm on ROW_01's side`, `${fmt(band.far)} mm on the other side`]
      : [`${fmt(band.near)} mm on the ${bus.sides} side (none on the other)`];
    if (Number.isFinite(bus.shared_outline_below_field_mm)) {
      // One outline for both FPCs down to their tail roots (construction.row_bus.shared_outline_below_field_mm).
      facts.push(["Outline", `one outline for both FPCs down to their tail roots (${fmt(bus.shared_outline_below_field_mm, 1)} mm below the taxel `
        + "field), so they align by their edges; only the tails differ, each leaving the shared bottom edge"]);
    }
    facts.push(["Tip", `${fmt(bus.tip_width_mm)} mm wide at ROW_01 (${fmt(bus.tip_excess_mm)} mm more than the field there)`]);
    facts.push(["Bands", `${bands.join(" · ")} beyond the field; widest ${fmt(bus.widest_mm, 1)} mm`]);
    const order = bus.row_pin_order || bus.row_contact_order || [];
    if (order.length) facts.push(["Row pins", `${bus.sides === "both" ? "folded" : "in turn"}, pin 1 first: ${shortList(order)}`]);
  }
  if (Number.isFinite(m.tail_reach_mm)) {
    const asked = proposal.placement.options?.tail_extension_mm;
    // Stacked tails (construction.row_bus.tails): the top FPC's tail over the bottom FPC's, both centred on the field
    // (diagonal-bus/10), ending together on the nearest line across the boards on which each tail is at least the
    // shortest tail long and ends at least the extension past the base edge under it (P5-diagonal-bus.md section 27.3,
    // surface/fieldfit.py tail_lengths): the nearer end tail_reach_mm past the edge under it.  Where the extension sets
    // the line the nearer end lies just that far; farther, the shortest tail sets it (the shorter tail is the shortest),
    // its root that tail's length less the reach above the edge (past it when negative; equal lengths, one root level).
    const shortest = Math.min(m.row_tail_mm, m.column_tail_mm);
    const farther = Number.isFinite(asked) && m.tail_reach_mm > asked + 0.0015;
    const root = shortest - m.tail_reach_mm;
    const roots = m.row_tail_mm !== m.column_tail_mm ? ""
      : root < 0 ? `, and the tail roots already lie ${fmt(-root, 1)} mm past the base edge` : `, and the tail roots lie only ${fmt(root, 1)} mm above the base edge`;
    const why = farther ? ` (asked ${fmt(asked, 1)} mm: a tail is at least ${fmt(shortest, 1)} mm long, which sets the line${roots})` : "";
    const [upper, lower] = m.role_mapping === "columns_top" ? ["Column", "Row"] : ["Row", "Column"];
    const stacked = bus?.tails === "stacked"
      ? `stacked: the ${upper} tail over the ${lower} tail, both centred on the field; they part to their own connectors; ` : "";
    const together = bus?.tails === "stacked" && m.row_tail_mm === m.column_tail_mm ? "both end together, their contacts in line, " : "both end ";
    facts.push(["Tails", `${stacked}${together}${fmt(m.tail_reach_mm, 1)} mm or more past the base edge${why}; Row ${fmt(m.row_tail_mm, 1)} mm, Column ${fmt(m.column_tail_mm, 1)} mm long`]);
  }
  if (report) {
    facts.push(["On the surface", `Row FPC ${share(report.row.on_surface)} · Column FPC ${share(report.column.on_surface)} of its area`]);
    const overhang = key => { const o = report[key].overhang_mm || {}; return `${fmt(o.left, 1)} left · ${fmt(o.right, 1)} right of the surface, ${fmt(o.exit, 1)} past the base edge above its tail`; };
    facts.push(["Overhang", `Row FPC ${overhang("row")}; Column FPC ${overhang("column")} (mm, the farthest the board reaches off the surface above its tail root; the tails do not count)`]);
  } else {
    facts.push(["On the surface", "both boards above their tail roots (only the tails cross the base edge)"]);
  }
  const symmetry = m.symmetry;
  if (symmetry?.face) {
    // Symmetric faces (P5-diagonal-bus.md section 22): the field's every row mirrored about the face's axis, or not.
    facts.push(["Symmetry", symmetry.field
      ? "symmetric: the face is mirror-symmetric about the line through the base edge's middle, and so is every row of the field"
      : `the face is mirror-symmetric about the line through the base edge's middle; this field is not (its centre ${fmt(Math.abs(symmetry.field_offset_mm), 2)} mm off that line)`]);
  }
  $("cadProposalFacts").replaceChildren(...facts.flatMap(([key, value]) => [el("dt", {}, key), el("dd", {"data-fact": key.toLowerCase().replace(/ /g, "-")}, value)]));
  card.hidden = false;
}

function chooseProposal(index, {look = false} = {}) {
  cad.chosen = index;
  abortRequests("map");
  cad.seq.map += 1;
  cad.map = null; cad.mapError = null; cad.preview = null;
  const proposal = chosenProposal();
  renderProposals();
  renderVerification();
  renderFlat();
  paintSide();
  renderSides();
  // The shown build may already be this proposal's (it was generated before): its map draws the proposal too.
  // One map request at a time (the server takes one CAD request at a time): the build's, else the preview.
  if (cad.lastResult?.ok && cad.lastResult.manifest.build_id === proposal.build_id) mapBuild(cad.lastResult, {look});
  else previewProposal({look});
  renderState();
}

async function previewProposal({look = false} = {}) {
  const proposal = chosenProposal();
  if (!proposal) return;
  const sequence = (cad.seq.preview += 1);
  try {
    const reply = await request("preview", "map", {selection: {ops: cad.ops}, placement: proposal.placement, design: proposal.design, options: proposal.placement.options});
    if (sequence !== cad.seq.preview) return;
    cad.preview = reply;
    if (!cad.map) drawOverlay(reply, proposal.design);
    if (look) lookAtSelection();
    renderFlat();
  } catch (error) {
    if (sequence !== cad.seq.preview || aborted(error)) return;
    fail(error, "Preview of the proposal on the part failed");
  }
  renderState();
}

function drawOverlay(map, design) {
  if (!cad.viewer) return;
  const matrix = design?.matrix || {};
  const radius = 0.5 * Math.min(matrix.taxel_width_mm || 1, matrix.taxel_height_mm || 1);
  cad.viewer.setOverlay(map, {taxelRadiusMm: radius});
  cad.viewer.setOverlayStale(cad.stale && map === cad.map);
}

function renderViewNote(proposal) {
  // What the 3D overlay leaves out: it draws the boards where they lie on the surface, markers where they leave it.
  const note = $("cadViewNote");
  const report = proposal?.metrics?.routing_on_surface;
  if (!proposal) { note.hidden = true; return; }
  const off = key => `${fmt(100 * (1 - report[key].on_surface), 0)} %`;
  note.textContent = report
    ? `On the part the boards are drawn where they lie on the surface; the dark purple dots mark where a board leaves it. Off the surface (not drawn in 3D, dotted in the flat view under Proposals): ${off("row")} of the Row FPC (its bands beside the field, where they overhang, and the bus and tail past the base edge) and ${off("column")} of the Column FPC (its fan-out and tail).`
    : "On the part the boards are drawn where they lie on the surface; the dark purple dots mark where the tails leave it across the base edge (the tails are dotted in the flat view under Proposals).";
  note.hidden = false;
}

function renderFlat() {
  const proposal = chosenProposal();
  const figure = $("cadFlatFigure");
  const node = $("cadFlat");
  renderViewNote(cad.fit?.selection ? proposal : null);
  if (!proposal || !cad.fit?.selection) { figure.hidden = true; return; }
  const selection = cad.fit.selection;
  const outlines = proposal.outlines_uv || {};
  const placement = proposal.placement;
  // Drawn in the boards' frame (field_x_uv, field_y_uv: tails down, seen from outside), like the 2D previews.
  const [ox, oy] = placement.field_origin_uv || [0, 0];
  const [ax, ay] = placement.field_x_uv || [1, 0];
  const [bx, by] = placement.field_y_uv || [0, 1];
  const frame = ([u, v]) => [(u - ox) * ax + (v - oy) * ay, (u - ox) * bx + (v - oy) * by];
  // The fit's border (in the /select chart: drawn only where the fit's chart is that one, not on a strain-limited disk).
  const border = !selection.strain_limited && Array.isArray(placement.border?.uv) ? placement.border.uv : null;
  const shapes = {surface: selection.outline_uv, row: outlines.row, column: outlines.column, field: outlines.field, border};
  const framed = Object.fromEntries(Object.entries(shapes).map(([key, list]) => [key, Array.isArray(list) ? list.map(frame) : null]));
  const all = Object.values(framed).filter(Array.isArray).flat();
  const xs = all.map(point => point[0]); const ys = all.map(point => point[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const pad = 0.04 * Math.max(x1 - x0, y1 - y0, 1);
  // The frame has y up; the SVG flips it.
  node.setAttribute("viewBox", [x0 - pad, -(y1 + pad), x1 - x0 + 2 * pad, y1 - y0 + 2 * pad].map(value => value.toFixed(4)).join(" "));
  const points = list => list.map(point => `${point[0].toFixed(4)},${(-point[1]).toFixed(4)}`).join(" ");
  const shape = (list, className, extra = {}) => (Array.isArray(list) && list.length > 2 ? svg("polygon", {points: points(list), class: className, ...extra}) : null);
  // Each board twice: dotted and faint everywhere, then solid where it lies on the surface (clipped to the
  // outline less the holes), so the parts off the surface (the Row bands, fan-out and tails of a field-only
  // proposal, the tails past the base edge) stay dotted.
  const holes = (selection.holes_uv || []).map(hole => hole.map(frame));
  const rings = [framed.surface, ...holes].filter(ring => Array.isArray(ring) && ring.length > 2);
  const clip = svg("clipPath", {id: "cadFlatOn"});
  clip.append(svg("path", {d: rings.map(ring => `M${points(ring).replace(/ /g, "L")}Z`).join(""), "clip-rule": "evenodd"}));
  const board = (list, className) => [shape(list, `${className} is-off`), shape(list, className, {"clip-path": "url(#cadFlatOn)"})];
  // The border: its outline in blue, hatched where it lies beyond the surface (masked by everything but the surface).
  const span = Math.max(x1 - x0, y1 - y0, 1);
  const box = {x: (x0 - pad).toFixed(4), y: (-(y1 + pad)).toFixed(4), width: (x1 - x0 + 2 * pad).toFixed(4), height: (y1 - y0 + 2 * pad).toFixed(4)};
  const gap = (0.025 * span).toFixed(4);
  const hatch = svg("pattern", {id: "cadFlatHatch", patternUnits: "userSpaceOnUse", width: gap, height: gap, patternTransform: "rotate(45)"});
  hatch.append(svg("line", {x1: 0, y1: 0, x2: 0, y2: gap, class: "flat-hatch"}));
  const off = svg("mask", {id: "cadFlatOff", maskUnits: "userSpaceOnUse", ...box});
  off.append(svg("rect", {...box, fill: "#fff"}), svg("path", {d: rings.map(ring => `M${points(ring).replace(/ /g, "L")}Z`).join(""), "fill-rule": "evenodd", fill: "#000"}));
  const parts = [svg("defs"), shape(framed.surface, "flat-surface"), ...holes.map(hole => shape(hole, "flat-hole")),
    shape(framed.border, "flat-border-out", {mask: "url(#cadFlatOff)"}),
    ...board(framed.column, "flat-column"), ...board(framed.row, "flat-row"), shape(framed.field, "flat-field"), shape(framed.border, "flat-border")];
  parts[0].append(clip, hatch, off);
  if (placement.base_from_uv && placement.base_to_uv) {
    const [a, b] = [frame(placement.base_from_uv), frame(placement.base_to_uv)];
    parts.push(svg("line", {x1: a[0].toFixed(4), y1: (-a[1]).toFixed(4), x2: b[0].toFixed(4), y2: (-b[1]).toFixed(4), class: "flat-base"}));
  }
  const shown = [cad.preview, cad.map].find(map => map?.build_id === proposal.build_id);
  const taxels = shown ? shown.taxels : [];
  const dot = 0.3 * Math.min(proposal.metrics.pitch_x_mm, proposal.metrics.pitch_y_mm);
  const group = svg("g", {class: "flat-taxels"});
  taxels.forEach(taxel => {
    const [x, y] = frame(taxel.uv_mm);
    group.append(svg("circle", {cx: x.toFixed(4), cy: (-y).toFixed(4), r: dot.toFixed(4)}));
  });
  node.replaceChildren(...parts.filter(Boolean), group);
  figure.hidden = false;
  const m = proposal.metrics;
  const positions = m.positions ?? m.rows * m.columns;
  const field = m.taxels < positions ? `taxel field (dashed: ${m.taxels} of ${m.rows} × ${m.columns} positions, ${fmt(100 * m.sampled, 0)} % sampled, in ${fmt(m.field_mm[0], 1)} × ${fmt(m.field_mm[1], 1)} mm)`
    : `taxel field (dashed, ${m.rows} × ${m.columns} positions, ${fmt(m.field_mm[0], 1)} × ${fmt(m.field_mm[1], 1)} mm)`;
  const dotted = containmentOf(proposal) === "field" ? "dotted where they leave the surface (the field alone must lie on it)" : "dotted past the base edge";
  const exit = placement.base_kind === "arc" ? "tail exit chord" : placement.base_kind === "border" ? `border edge ${placement.base_side} (the tail exit)` : "base edge";
  const fenced = border ? ", your border (blue; hatched beyond the surface: no taxels there)" : "";
  $("cadFlatCaption").textContent = `Proposal #${proposal.rank} flattened, in the boards' frame (tails down), seen from outside: surface (sand)${fenced}, Row FPC (copper), Column FPC (teal), the boards ${dotted}, ${field}, ${exit} (magenta)${taxels.length ? `, ${taxels.length} taxels` : ""}.`;
}

// -- 6. generate (through the existing form) --------------------------------------------

async function generate() {
  const proposal = chosenProposal();
  if (!proposal || cad.pendingBuild) return;
  cad.pendingBuild = proposal.build_id;
  cad.generated = true;
  syncResults();
  abortRequests("map");
  cad.seq.map += 1;
  cad.map = null; cad.mapError = null;
  renderGenerate();
  renderVerification();
  // The published state shows the pending build at once (it kept the last map's error until the form answered).
  renderState();
  setStatus("neutral", `Generating proposal #${proposal.rank} (expected build ${proposal.build_id}) with the regular generator…`);
  try {
    // app.js checks the design against its template's limits before it writes the form.
    const outcome = await askApp("fpc:apply-design", {design: proposal.design});
    if (!outcome.ok) {
      const hint = outcome.served === false ? " (this server did not send the template's own limits; the form keeps the default template's)" : "";
      throw new Error(`the form did not take proposal #${proposal.rank}: ${outcome.problems.join("; ")}${hint}. The form was left as it was; lower Max rows / Max columns and fit again.`);
    }
  } catch (error) {
    fail({code: "E_CLIENT_FORM", message: error.message}, "Generate failed");
  } finally {
    // The build's events cleared it; anything else (a refusal) clears it here.
    if (cad.pendingBuild === proposal.build_id) cad.pendingBuild = null;
    renderGenerate();
    renderVerification();
    renderState();
  }
}

// -- 7. the generated build on the part ------------------------------------------------------

function onResult(event) {
  const result = event.detail;
  cad.lastResult = result && typeof result === "object" ? result : null;
  syncResults();
  const proposal = chosenProposal();
  const pending = cad.pendingBuild;
  cad.pendingBuild = null;
  renderGenerate();
  if (!proposal || !cad.lastResult) { renderState(); return; }
  if (!cad.lastResult.ok) {
    abortRequests("map");
    cad.seq.map += 1;
    cad.map = null; cad.mapError = null;
    renderVerification();
    if (pending && cad.mode === "cad") setStatus("error", `Build ${cad.lastResult.manifest?.build_id} is blocked; see the summary and the DRC panel below.`);
    if (cad.preview) drawOverlay(cad.preview, proposal.design);
    renderState();
    return;
  }
  if (cad.mode === "cad") mapBuild(cad.lastResult);
  renderState();
}

function onCleared() {
  // Followed by "fpc:result" for a blocked build; alone after a failed request.
  if (cad.pendingBuild && cad.mode === "cad") setStatus("error", "The generation failed or was blocked; see the status below.");
  cad.pendingBuild = null;
  cad.lastResult = null;
  abortRequests("map");
  cad.seq.map += 1;
  cad.map = null; cad.mapError = null;
  renderGenerate();
  renderVerification();
  const proposal = chosenProposal();
  if (cad.viewer) {
    if (cad.preview && proposal) drawOverlay(cad.preview, proposal.design);
    else cad.viewer.setOverlay(null);
  }
  renderState();
}

async function mapBuild(result, {look = false} = {}) {
  const proposal = chosenProposal();
  if (!proposal || !cad.mesh) return;
  const sequence = (cad.seq.map += 1);
  const fitted = proposal.design.template_id; const built = result.design?.template_id;
  if (fitted !== built) {
    // Another template than the fitted one (a build of the Rectangular mode; the map would not see it: it compares the
    // geometry inputs).
    abortRequests("map");
    cad.map = null;
    cad.mapError = {code: "E_CLIENT_TEMPLATE_MISMATCH", message: `build ${result.manifest.build_id} uses template ${built}; proposal #${proposal.rank} was fitted for ${fitted}.`};
    cad.error = cad.mapError.code;
    setStatus("warning", `The shown build ${result.manifest.build_id} was generated with template ${built}, not with the proposal's ${fitted}: press Generate (step 3) to build the proposal.`);
    if (cad.preview) drawOverlay(cad.preview, proposal.design);
    renderVerification();
    renderState();
    return;
  }
  setStatus("neutral", `Mapping build ${result.manifest.build_id} onto the part…`);
  try {
    const reply = await request("map", "map", {selection: {ops: cad.ops}, placement: proposal.placement, design: result.design, options: proposal.placement.options});
    if (sequence !== cad.seq.map) return;
    cad.map = reply;
    cad.mapError = null;
    cad.error = cad.facetMismatch ? "E_CLIENT_FACET_ORDER" : null;
    cad.stale = $("workbench").classList.contains("is-stale");
    drawOverlay(reply, result.design);
    if (look) lookAtSelection();
    renderFlat();
    const passed = reply.verification.filter(record => record.passed).length;
    setStatus(reply.ok ? "ok" : "error", `Build ${reply.build_id} on the part: ${reply.taxel_count} taxels, ${passed} of ${reply.verification.length} checks pass.${reply.ok ? " Downloads are ready." : ""}`);
  } catch (error) {
    if (sequence !== cad.seq.map || aborted(error)) return;
    cad.map = null;
    cad.mapError = error;
    if (error.code === "E_SURFACE_PLACEMENT_MISMATCH") {
      cad.error = error.code;
      setStatus("warning", `The form differs from the fitted design; fit again. (${error.message})`);
    } else {
      fail(error, "Mapping the build onto the part failed");
    }
    // The proposal stays drawn: its preview, or (chosen with its build already shown) a preview asked for now.
    if (cad.preview) drawOverlay(cad.preview, proposal.design);
    else previewProposal();
  }
  renderVerification();
  renderState();
}

function verificationValue(value, unit) {
  if (value === null || value === undefined) return "—";
  if (unit === "count") return String(Math.round(value));
  if (unit === "ratio") return `${fmt(100 * value, 3)} %`;
  return `${trim(value)} ${unit}`;
}
function stackNote(stack) {
  const top = roleText(stack.top_board === "rows" ? "rows_top" : "columns_top");
  const glued = stack.glued_to_part === "rows" ? "Row" : "Column";
  const offset = Number.isFinite(stack.contact_offset_mm)
    ? `The taxel positions are on the part's surface; the sensor's outer surface is about ${trim(stack.contact_offset_mm)} mm further out along the normal.`
    : String(stack.note || "");
  return `${top} on top; the ${glued} FPC is glued to the part. ${offset}`;
}
function renderVerification() {
  const box = $("cadVerify");
  if (cad.mapError) {
    const code = cad.mapError.code;
    const text = code === "E_SURFACE_PLACEMENT_MISMATCH" ? "The form differs from the fitted design; fit again."
      : code === "E_CLIENT_TEMPLATE_MISMATCH" ? "The shown build uses another template than the proposal; Generate the proposal (step 3)." : describe(cad.mapError);
    const detail = code === "E_SURFACE_PLACEMENT_MISMATCH" || code === "E_CLIENT_TEMPLATE_MISMATCH" ? el("small", {}, ` ${cad.mapError.message}`) : null;
    box.replaceChildren(el("p", {className: "cad-error"}, text, detail));
  } else if (!cad.map) {
    const text = cad.pendingBuild ? "Generating… the build is mapped onto the part when it is ready."
      : chosenProposal() ? "Generate the chosen proposal to map its build onto the part and check it here." : "After Generate, the build is mapped onto the part and checked here.";
    box.replaceChildren(el("p", {className: "hint"}, text));
  } else {
    const records = cad.map.verification;
    const passed = records.filter(record => record.passed).length;
    const rows = records.map(record => el("tr", {className: record.passed ? "is-pass" : "is-fail", "data-rule": record.rule},
      el("th", {scope: "row"}, record.rule.replace(/_/g, " "), el("small", {className: "drc-where"}, String(record.what || ""))),
      el("td", {className: "num"}, verificationValue(record.measured, record.unit)),
      el("td", {className: "num"}, `${record.comparison === "max<=" ? "≤" : "≥"} ${verificationValue(record.required, record.unit)}`),
      el("td", {}, el("span", {className: `drc-badge ${record.passed ? "pass" : "fail"}`}, record.passed ? "PASS" : "FAIL"))));
    const stack = cad.map.stack || {};
    const routing = cad.map.routing_on_surface;
    const warnings = routing?.warnings || [];
    const routingNote = routing ? el("div", {className: "hint", id: "cadRoutingNote"},
      el("p", {}, `Routing on the surface (reported, not checked): Row FPC ${share(routing.row?.on_surface)}, Column FPC ${share(routing.column?.on_surface)} of its area${warnings.length ? "; advice:" : "; nothing to watch."}`),
      warnings.length ? el("ul", {className: "cad-advice"}, warnings.map(item => el("li", {"data-code": item.code}, `${item.message || "see the taxel map JSON"} `, el("small", {}, `(${item.code})`)))) : null) : null;
    const order = cad.map.readout?.row_pin_order || cad.map.readout?.row_contact_order;
    const orderNote = Array.isArray(order) && order.length ? el("p", {className: "hint", id: "cadRowOrderNote"},
      `Row pins 1–${order.length} (from the pads, as the taxel CSV's row_pin): ${shortList(order)}.`) : null;
    // One line in sight; the checks and notes folded (open where a check fails, or as the user left them).
    const verdict = cad.map.ok ? `✓ all ${records.length} checks pass` : `${records.length - passed} of ${records.length} checks fail`;
    const details = el("details", {className: "cad-more cad-verify-more", id: "cadVerifyMore"},
      el("summary", {}, "Check details"),
      ...[el("table", {className: "drc-table cad-verify-table", id: "cadVerifyTable"},
        el("caption", {}, `Build ${cad.map.build_id} · ${cad.map.taxel_count} taxels · `,
          el("span", {className: `drc-badge ${cad.map.ok ? "pass" : "fail"}`}, cad.map.ok ? `all ${records.length} checks pass` : `${records.length - passed} of ${records.length} checks fail`)),
        el("thead", {}, el("tr", {}, ["Rule", "Measured", "Required", "Result"].map(text => el("th", {scope: "col"}, text)))),
        el("tbody", {}, rows)),
      stack.top_board ? el("p", {className: "hint"}, stackNote(stack)) : null, routingNote, orderNote].filter(Boolean));
    details.open = !cad.map.ok || cad.verifyOpen;
    details.addEventListener("toggle", () => { if (cad.map?.ok) cad.verifyOpen = details.open; });
    box.replaceChildren(el("p", {className: `cad-verify-line ${cad.map.ok ? "is-pass" : "is-fail"}`, id: "cadVerifyLine"},
      `Build ${cad.map.build_id} · ${cad.map.taxel_count} taxels on the part · ${verdict}`), details);
  }
  renderDownloads();
}

function onStaleChange() {
  const stale = $("workbench").classList.contains("is-stale");
  if (stale === cad.stale) return;
  cad.stale = stale;
  if (cad.viewer && cad.map) cad.viewer.setOverlayStale(stale);
  $("cadVerify").classList.toggle("is-stale", stale);
  renderDownloads();
  renderState();
}

// -- 8. downloads --------------------------------------------------------------------------

function downloadsReady() {
  return Boolean(cad.map) && !cad.stale && cad.lastResult?.ok === true && cad.lastResult.manifest.build_id === cad.map.build_id;
}
function placementDocument() {
  // The placement of the mapped build: the map's (its design and build id, e.g. after a tail edit),
  // else the proposal's when it is the same build.
  const map = cad.map;
  if (!map) return null;
  if (map.placement && map.placement.build_id === map.build_id) return map.placement;
  const proposal = chosenProposal();
  return proposal && proposal.build_id === map.build_id ? proposal.placement : null;
}
function renderDownloads() {
  const ready = downloadsReady();
  ["cadSaveMap", "cadSaveCsv", "cadSaveWrap"].forEach(id => { $(id).disabled = !ready; });
  $("cadSavePlacement").disabled = !ready || !placementDocument();
  $("cadDownloadNote").textContent = ready ? `Build ${cad.map.build_id}: every file name starts with the build id.${placementDocument() ? "" : " No placement document describes this build: fit again to save one."}`
    : cad.map && cad.stale ? `Disabled: the form no longer matches build ${cad.map.build_id}. Regenerate first.`
      : "Downloads are enabled for a mapped build that matches the form.";
}
function saveBlob(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const anchor = el("a", {href: url, download: name, hidden: true});
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("ok", `Saved ${name}.`);
}
function csvText(map) {
  const reader = map.taxels.some(taxel => taxel.reader);
  const head = ["row", "column", "row_net", "column_net", "row_pin", "column_pin", "x", "y", "z", "nx", "ny", "nz", "facet"];
  if (reader) head.push("sense_line", "drive_line", "frame_index");
  const cell = value => (value === null || value === undefined ? "" : /[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value));
  const row = taxel => [taxel.row, taxel.column, taxel.row_net, taxel.column_net, taxel.row_pin, taxel.column_pin,
    ...(taxel.xyz_mm || ["", "", ""]), ...(taxel.normal || ["", "", ""]), taxel.facet,
    ...(reader ? [taxel.reader?.sense_line, taxel.reader?.drive_line, taxel.reader?.frame_index] : [])];
  // A full field (a diagonal Row bus records its readout too) lists its taxels only, as before.
  if (!map.readout || !(map.readout.active < map.readout.positions)) return `${[head.join(","), ...map.taxels.map(taxel => row(taxel).map(cell).join(","))].join("\n")}\n`;
  // A masked field: every position of the R × C readout, active 1 (a taxel) or 0 (no crossing: it always reads 0),
  // with its pins and reader lines; the geometry only for the taxels.
  const byPosition = new Map(map.taxels.map(taxel => [`${taxel.row},${taxel.column}`, taxel]));
  const rowPins = new Map(map.taxels.map(taxel => [taxel.row, taxel.row_pin]));
  const columnPins = new Map(map.taxels.map(taxel => [taxel.column, taxel.column_pin]));
  const lines = [];
  for (let r = 1; r <= map.readout.rows; r += 1) {
    for (let c = 1; c <= map.readout.columns; c += 1) {
      const taxel = byPosition.get(`${r},${c}`);
      if (taxel) { lines.push([...row(taxel), 1].map(cell).join(",")); continue; }
      const pins = [rowPins.get(r), columnPins.get(c)];
      const reading = map.reader && pins.every(Number.isInteger) ? readerLines(map.reader, pins[0], pins[1]) : null;
      const blank = {row: r, column: c, row_net: `ROW_${String(r).padStart(2, "0")}`, column_net: `COL_${String(c).padStart(2, "0")}`,
        row_pin: pins[0], column_pin: pins[1], facet: "", reader: reading};
      lines.push([...row(blank), 0].map(cell).join(","));
    }
  }
  return `${[[...head, "active"].join(","), ...lines].join("\n")}\n`;
}
// surface/reader.py lines(): the reader's sense and drive lines and frame index of a readout position.
function readerLines(reader, rowPin, columnPin) {
  const [sense, drive] = reader.sense_board === "row" ? [rowPin, columnPin] : [columnPin, rowPin];
  return {sense_line: `SR${sense}`, drive_line: `SC${drive}`, frame_index: (drive - 1) * reader.sense_lines + (sense - 1)};
}
function download(kind) {
  if (!downloadsReady()) return;
  const map = cad.map; const id = map.build_id;
  if (kind === "placement") {
    const placement = placementDocument();
    if (placement) saveBlob(`${id}-surface-placement.json`, `${JSON.stringify(placement, null, 2)}\n`, "application/json");
  } else if (kind === "map") {
    const {wrap_svg: _wrap, ...body} = map;
    saveBlob(`${id}-taxel-map.json`, `${JSON.stringify(body, null, 2)}\n`, "application/json");
  } else if (kind === "csv") saveBlob(`${id}-taxel-map.csv`, csvText(map), "text/csv");
  else if (kind === "wrap") saveBlob(`${id}-wrap-template.svg`, map.wrap_svg, "image/svg+xml");
}

// -- diagnostics ----------------------------------------------------------------------------

function updateProbe() {
  const values = $("cadProbe").value.split(",").map(text => Number(text.trim()));
  const point = values.length === 3 && values.every(Number.isFinite) ? cad.viewer?.project(values) : null;
  $("cadProbeOut").textContent = point ? point.map(value => value.toFixed(1)).join(",") : "";
}

// -- wiring ------------------------------------------------------------------------------------

function wire() {
  document.querySelectorAll('input[name="appMode"]').forEach(input => input.addEventListener("change", () => setMode(input.value)));
  window.addEventListener("hashchange", () => setMode(location.hash === "#rect" ? "rect" : "cad", {fromHash: true}));
  $("cadFile").addEventListener("change", event => { loadFile(event.target.files[0]); event.target.value = ""; });
  const view = $("cadView");
  // The Base edge tool's hover, the border editor's double click (a corner added) and keys (Delete, undo / redo).
  view.addEventListener("pointermove", onViewPointerMove);
  view.addEventListener("pointerleave", () => { hoverAt = null; hoverEdge(null); });
  view.addEventListener("dblclick", onViewDoubleClick);
  view.addEventListener("keydown", onViewKey);
  document.querySelectorAll('input[name="cadTool"]').forEach(input => input.addEventListener("change", () => hoverEdge(null)));
  defaultHelp = $("cadHelp").textContent;
  $("cadEditBorder").addEventListener("click", () => setEditing(!cad.editing));
  [["cadBorderReset", "reset"], ["cadBorderInset", "inset"], ["cadBorderDelete", "delete"],
    ["cadBorderUndo", "undo"], ["cadBorderRedo", "redo"]].forEach(([id, action]) => $(id).addEventListener("click", () => borderAction(action)));
  $("cadBorderInsetMm").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); borderAction("inset"); } });
  view.addEventListener("dragover", event => { event.preventDefault(); view.classList.add("is-dropping"); });
  view.addEventListener("dragleave", () => view.classList.remove("is-dropping"));
  view.addEventListener("drop", event => {
    event.preventDefault();
    view.classList.remove("is-dropping");
    loadFile(event.dataTransfer?.files?.[0]);
  });
  $("cadUnit").addEventListener("change", () => { cad.facetMismatch = false; resetFit(); inspectMesh(); });
  $("cadPreset").addEventListener("change", syncAngles);
  ["cadThetaD", "cadThetaC", "cadMinRadius"].forEach(id => $(id).addEventListener("input", () => { $("cadPreset").value = "custom"; syncAngles(); }));
  $("cadUndo").addEventListener("click", () => { if (cad.opsHistory.length) { cad.ops = cad.opsHistory.pop(); runSelect(); } });
  $("cadClear").addEventListener("click", () => { setOps([]); runSelect(); });
  $("cadSides").addEventListener("change", event => { if (event.target.name === "cadSide") chooseSide(event.target.value); });
  $("cadObjective").addEventListener("change", syncObjective);
  $("cadContainment").addEventListener("change", syncContainment);
  ["cadMaxColumns", "cadMaxRows"].forEach(id => $(id).addEventListener("input", () => { $(id).dataset.edited = "true"; }));
  $("cadConfig").addEventListener("change", onConfigChange);
  $("cadConfig").addEventListener("input", onConfigChange);
  $("cadFit").addEventListener("click", runFit);
  $("cadGenerate").addEventListener("click", generate);
  document.querySelectorAll("[data-cad-view]").forEach(button => button.addEventListener("click", () => {
    if (!cad.viewer || !cad.inspect) return;
    if (button.dataset.cadView === "selection") lookAtSelection();
    else cad.viewer.view(button.dataset.cadView, viewClear());
  }));
  $("cadSavePlacement").addEventListener("click", () => download("placement"));
  $("cadSaveMap").addEventListener("click", () => download("map"));
  $("cadSaveCsv").addEventListener("click", () => download("csv"));
  $("cadSaveWrap").addEventListener("click", () => download("wrap"));
  $("cadProbe").addEventListener("input", updateProbe);
  $("cadPick").addEventListener("change", event => pickSurface(event.target.value));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () =>
    $(button.dataset.go)?.scrollIntoView({behavior: "smooth", block: "start"})));
  let guideFrame = 0;
  const followScroll = () => { if (!guideFrame) guideFrame = requestAnimationFrame(() => { guideFrame = 0; markGuideHere(); }); };
  window.addEventListener("scroll", followScroll, {passive: true});
  window.addEventListener("resize", followScroll);
  document.addEventListener("fpc:result", onResult);
  document.addEventListener("fpc:cleared", onCleared);
  new MutationObserver(onStaleChange).observe($("workbench"), {attributes: true, attributeFilter: ["class"]});
  // The state dump is for the browser checks and debugging (?debug shows it).
  $("cadState").hidden = !new URLSearchParams(location.search).has("debug");
}

wire();
syncAngles();
syncObjective();
syncContainment();
renderBorderBar();
setMode(location.hash === "#rect" ? "rect" : "cad", {fromHash: true});
