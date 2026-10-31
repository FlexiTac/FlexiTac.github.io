(() => {
  "use strict";
  // Browser side of FlexiTac-Gen: form limits from the profile,
  // generation with stale-state tracking, copper-side top-view previews with
  // zoom/pan, the registered assembly, the DRC panel and build-id downloads.
  // The page CSP forbids inline scripts and eval: markup is built with DOM APIs.

  const SVG_NS = "http://www.w3.org/2000/svg";
  const BOARD_KEYS = ["row", "column"];
  const JSON_HEADERS = {"Content-Type": "application/json"};
  // A POST answered 503 E_HTTP_BUSY is retried after Retry-After; 408 E_HTTP_TIMEOUT once.
  const MAX_BUSY_ATTEMPTS = 5;
  const MAX_TIMEOUT_ATTEMPTS = 2;
  const MAX_RETRY_DELAY_S = 8;
  const LIVE_VALIDATION_DELAY_MS = 250;
  // Preview presentation only; one SVG user unit is one millimetre.
  const MAX_ZOOM = 400;
  const ZOOM_STEP = 1.5;
  const WHEEL_ZOOM_RATE = 0.0015;
  const PAN_STEP = 0.1;
  // The pin-1 ring keeps a legible screen size at any board size and zoom level.
  const PIN1_RING_PX = 9;
  const PIN1_RING_MIN_MM = 1;
  // In the stacked view the stacked tails end together (P5-diagonal-bus.md section 27.3), so the two pin-1 contacts may
  // lie side by side.  Where the two rings round their triangles would overlap (this gap apart) or one would take in
  // the other board's triangle, they move apart, away from each other (along the line through them as drawn or turned
  // off it), the least that parts them, each still holding its own triangle's centre (section 27.5).  Only where no
  // move does, a ring steps one ring diameter and this gap from its triangle, the steps tried in turn, each ring's
  // [along, across] its triangle's axis (the top FPC's, then the bottom FPC's; along +1 inward over the tail's end, -1
  // outward past the triangle; across, beside it): none; the top FPC's inward; and the bottom FPC's outward, or beside
  // its triangle where outward leaves the view or meets its caption; then the others.
  const PIN1_RING_GAP_PX = 4;
  const PIN1_STEPS = [[[0, 0], [0, 0]], [[1, 0], [0, 0]], [[1, 0], [-1, 0]], [[1, 0], [0, 1]], [[1, 0], [0, -1]], [[-1, 0], [0, 0]],
    [[0, 0], [-1, 0]], [[-1, 0], [1, 0]], [[0, 0], [1, 0]]];
  const OBLIQUE_MARGIN_PX = 16;
  // The stacked view's exploded camera (styles.css .assembly-camera): its tilt about the screen's x axis (0 straight from
  // above, 90 edge on, 180 from under the stack) and its turn in the boards' plane as the view opens.  A drag turns it
  // (across the screen) and tilts it (a drag down toward the view from above), by ORBIT_DEG_PER_PX; the arrow keys by
  // ORBIT_KEY_DEG; a double click or 0 sets it back.  The plan view keeps still.
  const ORBIT_HOME = {tilt: 57, spin: -20};
  // The board cards' oblique views turn the same way (styles.css .oblique-board), from their own rigid tilt.
  const OBLIQUE_HOME = {tilt: 56, spin: -22};
  const ORBIT_TILT_MAX_DEG = 180;
  const ORBIT_DEG_PER_PX = 0.4;
  const ORBIT_KEY_DEG = 5;
  // Arrow-key nudges for mm inputs, whose profile step is the 1e-6 mm input resolution.
  const NUDGE_MM = 0.05;
  const COARSE_NUDGE_MM = 1;
  const SIDES = ["bottom", "top", "left", "right"];
  // The engine reports these DRC rules as counts in its *_mm fields (and *_deg rules in degrees).
  const COUNT_RULES = new Set(["outline_simple", "connectivity"]);
  // engine MASK_TEMPLATES: the template whose designs may carry a field mask (matrix.mask).
  const MASK_TEMPLATE = "surface_matrix_v1";
  const OPENING_NAMES = {
    electrode_field_opening: ["merged electrode-field window", "merged electrode-field windows"],
    sensor_electrode_opening: ["electrode window", "electrode windows"],
    connector_contact_opening: ["gang contact window", "gang contact windows"],
  };

  const $ = id => document.getElementById(id);
  const form = $("designForm");
  const generateButton = $("generate");
  const controls = [...form.querySelectorAll("[data-field]")];
  const downloadButtons = [...document.querySelectorAll("[data-download], [data-export]")];
  const zoomPanes = [...document.querySelectorAll(".zoom-pane")];
  const zooms = new Map();
  const state = {
    // profile: the form template's profile record (/api/default; its row_bus: the diagonal Row bus's rule set where
    // that is another profile, the generic template's).
    design: null, limits: {}, electrodeGap: null, profile: null,
    result: null, builtText: null, busy: false,
    // serverText: the form (payload text) the server messages were computed for.
    serverMessages: new Map(), serverText: null, live: null, liveSeq: 0, liveTimer: 0,
    // CAD mode's masked field: matrix.mask of the applied proposal (row spans, net indices), or null;
    // maskIssues: the server's issues at matrix.mask for the form it last checked; maskCleared: the
    // note of the edit that cleared the mask (until a design is applied again).
    mask: null, maskIssues: [], maskCleared: "",
  };

  class RequestError extends Error {
    constructor(code, message, data = null) { super(message); this.code = code; this.data = data; }
  }

  // -- small helpers -----------------------------------------------------------

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, item] of Object.entries(props)) {
      if (item === undefined || item === null || item === false) continue;
      if (key === "className") node.className = item;
      else node.setAttribute(key, item === true ? "" : String(item));
    }
    node.append(...children.flat().filter(child => child !== null && child !== undefined && child !== false));
    return node;
  }
  function svgEl(tag, attributes, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, item]) => node.setAttribute(key, String(item)));
    node.append(...children);
    return node;
  }
  const round6 = number => Math.round(number * 1e6) / 1e6;
  const clamp = (number, low, high) => Math.min(high, Math.max(low, number));
  const plural = (count, word, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;
  const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
  const roleTitle = board => (board?.role === "rows" ? "Row FPC" : "Column FPC");
  const numbers = text => {
    const items = String(text || "").trim().split(/[\s,]+/).map(Number);
    return items.length === 4 && items.every(Number.isFinite) ? items : null;
  };
  function fixed(number) {
    // Up to the 1e-6 mm layout grid, at least three decimals.
    const [whole, fraction = ""] = round6(number).toFixed(6).replace(/0+$/, "").split(".");
    return `${whole}.${fraction.padEnd(3, "0")}`;
  }
  // The stacked view's notes: every length to the micrometre, three decimals (P5-diagonal-bus.md section 27.5).
  const micrometres = number => round6(number).toFixed(3);
  function setStatus(kind, message) { const node = $("status"); node.className = `status is-${kind}`; node.textContent = message; }
  const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

  // -- form ----------------------------------------------------------------------

  const fieldsOf = control => control.dataset.field.split(" ");
  function specOf(control) {
    // A field's limits for the form's Row traces: the template's (on the generic template those of its default, the
    // diagonal Row bus, built with CAD mode's rules), with the straight Row channel's own bounds (spec.channel:
    // shorter tails, fewer columns) while the Row traces select is the straight channel.
    const spec = state.limits[fieldsOf(control)[0]] || null;
    return spec && spec.channel && !rowBus() ? {...spec, ...spec.channel} : spec;
  }

  function value(id) {
    const element = $(id);
    if (element.type === "number") return element.value.trim() === "" ? null : Number(element.value);
    return element.type === "text" ? element.value.trim() : element.value;
  }
  function connectorSection() {
    // Nested: the connector sizes have no flat alias; empty means null (one contact per channel).
    return Object.fromEntries(
      controls.filter(control => control.dataset.field.startsWith("connector.")).map(control => [control.dataset.field.split(".")[1], value(control.id)])
    );
  }
  function payload() {
    // Flat form aliases plus the version header (so the server need not assume
    // one); validation.normalization lists the aliases it applied.
    return {
      schema_version: state.design?.schema_version, template_id: state.design?.template_id,
      name: value("name"), rows: value("rows"), columns: value("columns"),
      pitch_x_mm: value("pitchX"), pitch_y_mm: value("pitchY"),
      row_electrode_width_mm: value("rowWidth"), column_electrode_width_mm: value("columnWidth"),
      top_tail_length_mm: value("topTailLength"), bottom_tail_length_mm: value("bottomTailLength"),
      connector_side: value("connectorSide"), row_fpc_position: value("rowLayer"), scan_order: value("scanOrder"),
      trace_width_mm: value("traceWidth"), trace_space_mm: value("traceSpace"),
      connector: connectorSection()
    };
  }
  function formBody() {
    // What Generate posts: payload(), the Row traces select (routing.row_sides on every template: the
    // diagonal Row bus, both, left or right, which routes every mask; or "channel", the straight Row
    // channel, which the surface template normalizes away) and, while the template is the surface one, the
    // masked field of a CAD proposal (matrix.mask, in net indices: a rows or columns edit clears it; the
    // other edits keep it, though a pitch or trace edit can leave a mask the straight Row channel cannot
    // route, E_MASK_ROUTING).  In Rectangular mode the form builds the full field; the mask waits for CAD
    // mode (the generic template refuses matrix.mask, E_UNKNOWN_FIELD).
    const body = payload();
    if (state.mask && state.design?.template_id === MASK_TEMPLATE) body.matrix = {mask: state.mask};
    const sides = rowSides();
    if (sides) body.routing = {row_sides: sides};
    return body;
  }
  function rowSides() {
    // routing.row_sides of the form: the Row traces select (both, left, right or channel).
    return value("rowSides") || null;
  }
  function rowBus() {
    // Whether the form builds the diagonal Row bus (not the straight channel).
    const sides = rowSides();
    return Boolean(sides) && sides !== "channel";
  }
  function syncRowSides() {
    // The Row traces select is a field of every template (routing.row_sides): shown and sent in both modes; the
    // limits, badge and rules follow its choice (applyBounds, showProfile).
    $("rowSidesRow").hidden = false;
    $("rowSidesHint").hidden = false;
    $("rowSides").disabled = false;
    applyBounds();
    showProfile();
  }
  function clearMask(reason) {
    if (!state.mask) return;
    state.mask = null;
    state.maskIssues = [];
    state.maskCleared = `Masked field from Gen by Surface cleared: ${reason}, so the form now builds the full rows × columns field.`;
    showMaskNote();
  }
  function showMaskNote() {
    // The masked field the form carries (or the note that it was cleared), the server's issues at
    // matrix.mask, and the button that drops the mask ("Use the full field").
    const mask = state.mask;
    const issues = mask ? state.maskIssues : [];
    let active = 0;
    (mask || []).forEach(([first, last]) => { active += last - first + 1; });
    const shape = mask ? `${active} of ${mask.length} × ${value("columns")} taxels active` : "";
    const text = !mask ? state.maskCleared
      : state.design?.template_id !== MASK_TEMPLATE ? `Masked field from Gen by Surface (${shape}) kept for Gen by Surface: the ${state.design?.template_id} template builds the full rows × columns field.`
        : rowBus() ? `Masked field from Gen by Surface: ${shape} (the other positions read 0). Editing rows or columns clears it. The diagonal Row traces route it at any pitch and trace.`
          : `Masked field from Gen by Surface: ${shape} (the other positions read 0). Editing rows or columns clears it. The other edits keep it, but a pitch or trace edit can leave a mask the engine cannot route (E_MASK_ROUTING): then fit again in CAD mode or use the full field.`;
    $("maskNote").hidden = !text;
    $("maskNote").classList.toggle("is-invalid", issues.some(issue => issue.kind === "error"));
    $("maskText").textContent = text;
    $("maskIssues").hidden = !issues.length;
    $("maskIssues").replaceChildren(...issues.map(issue => el("li", {className: `is-${issue.kind}`}, el("code", {}, issue.code), " ", String(issue.message))));
    $("clearMask").hidden = !mask;
  }
  function maskIssuesOf(validation) {
    // The issues of a validation at matrix.mask (they belong to no form control: the note shows them).
    return [["error", validation?.errors], ["warning", validation?.warnings]].flatMap(([kind, issues]) => (Array.isArray(issues) ? issues : [])
      .filter(issue => /^matrix\.mask(\[|$)/.test(String(issue.field))).map(issue => ({kind, code: issue.code, message: issue.message})));
  }
  const payloadText = () => JSON.stringify(formBody());

  function setForm(design) {
    const matrix = design.matrix || {}; const tail = design.tail || {}; const roles = design.role_mapping || {};
    const order = design.channel_order || {}; const connector = design.connector || {}; const routing = design.routing || {};
    const values = {
      name: design.project_name, rows: matrix.rows, columns: matrix.columns, pitchX: matrix.pitch_x_mm, pitchY: matrix.pitch_y_mm,
      rowWidth: matrix.taxel_height_mm, columnWidth: matrix.taxel_width_mm,
      topTailLength: tail.top_length_mm, bottomTailLength: tail.bottom_length_mm, connectorSide: tail.row_side,
      rowLayer: roles.top === "rows" ? "top" : "bottom", scanOrder: order.rows === "descending" ? "reverse" : "forward",
      rowPins: connector.row_pins, columnPins: connector.column_pins,
      traceWidth: routing.trace_width_mm, traceSpace: routing.trace_space_mm,
      // Absent: the straight Row channel (the surface template leaves it out; the generic template always sets it).
      rowSides: routing.row_sides ?? "channel"
    };
    Object.entries(values).forEach(([id, item]) => { if (item !== undefined) $(id).value = item === null ? "" : String(item); });
  }

  function applyBounds() {
    // The number inputs' min/max/step of the form's Row traces (specOf); a Row traces edit re-applies them.
    for (const control of controls) {
      const spec = specOf(control);
      if (!spec || control.type !== "number") continue;
      ["minimum", "maximum", "step"].forEach((key, index) => {
        if (Number.isFinite(spec[key])) control.setAttribute(["min", "max", "step"][index], String(spec[key]));
      });
    }
  }
  function showProfile() {
    // The badge and the locked rules of the form's Row traces: the diagonal Row bus's rule set (profile.row_bus, on
    // the generic template) or the template's own profile.
    const profile = state.profile;
    if (!profile) return;
    const shown = rowBus() && profile.row_bus ? profile.row_bus : profile;
    $("profileBadge").textContent = shown.name;
    renderRules(shown.display_rules);
    renderTraceHint(shown.display_rules);
    if (state.result) showBundle(state.result.design);
  }
  function applyLimits(limits) {
    state.limits = limits && typeof limits === "object" ? limits : {};
    for (const control of controls) {
      const spec = specOf(control);
      if (!spec) continue;
      if (control.type === "number") {
        ["minimum", "maximum", "step"].forEach((key, index) => {
          if (Number.isFinite(spec[key])) control.setAttribute(["min", "max", "step"][index], String(spec[key]));
        });
        control.required = !spec.nullable;
        // A native spinner would move by the input resolution (1e-6 mm); the arrow keys nudge instead.
        control.classList.toggle("fine-step", Number.isFinite(spec.step) && spec.step < NUDGE_MM);
      } else if (control.tagName === "INPUT" && Number.isInteger(spec.max_length)) {
        control.maxLength = spec.max_length;
        if (Number.isInteger(spec.min_length)) control.minLength = spec.min_length;
      } else if (control.tagName === "SELECT" && control.id === "connectorSide" && Array.isArray(spec.enum)) {
        // The tail sides are the profile enum; Row FPC role and scan order use fixed form alias values.
        control.replaceChildren(...spec.enum.map(side => new Option(capitalize(side), side)));
        control.value = spec.default;
      }
      // The shared selects set several fields; only one-field inputs show the field description.
      const unit = spec.unit ? ` ${spec.unit}` : "";
      const [fine, coarse] = nudgeSizes(control);
      const keys = control.classList.contains("fine-step") ? ` Arrow keys ±${fine}${unit}, with Shift ±${coarse}${unit}.` : "";
      if (spec.description && control.tagName === "INPUT") control.title = `${spec.description}${keys}`;
      const head = control.closest(".field")?.querySelector(".field-head");
      if (head && !head.querySelector(".field-range")) head.append(el("span", {className: "field-range", id: `${control.id}Range`}));
      if (!$(`${control.id}Message`)) control.after(el("small", {className: "field-message", id: `${control.id}Message`, hidden: true}));
      control.setAttribute("aria-describedby", [`${control.id}Range`, `${control.id}Message`].filter(id => $(id)).join(" "));
    }
    const fine = controls.filter(control => control.classList.contains("fine-step")).map(specOf);
    if (fine.length) {
      const decimals = Math.round(-Math.log10(Math.min(...fine.map(spec => spec.step))));
      $("mmHint").textContent = `Millimetre fields take up to ${decimals} decimals; the arrow keys step them by ${NUDGE_MM} mm (with Shift by ${COARSE_NUDGE_MM} mm), the trace fields by 1 mil.`;
      $("mmHint").hidden = false;
    }
    // The schema's electrode-width maximum is the maximum pitch less
    // routing.min_electrode_gap_mm (engine.schema.field_specs); the same gap bounds every pitch.
    const pitch = state.limits["matrix.pitch_x_mm"]; const width = state.limits["matrix.taxel_width_mm"];
    state.electrodeGap = pitch && width && Number.isFinite(pitch.maximum - width.maximum) ? round6(pitch.maximum - width.maximum) : null;
  }

  function validNumber(id) {
    const control = $(id);
    return control && control.value.trim() !== "" && control.validity.valid ? Number(control.value) : null;
  }
  function electrodeBound(control) {
    const pitch = validNumber(control.dataset.pitch);
    return pitch === null || state.electrodeGap === null ? null : round6(pitch - state.electrodeGap);
  }
  function crossFieldAdvice(control) {
    // Cross-field rules of the profile (x-cross-field-rules) as advice: they never
    // block a request, and the server's verdict on the same form replaces them.
    const number = control.type === "number" && control.value.trim() !== "" ? Number(control.value) : null;
    if (control.dataset.pitch && number !== null) {
      const bound = electrodeBound(control);
      if (bound !== null && number > bound + 1e-9) {
        return `At most ${bound} mm at ${validNumber(control.dataset.pitch)} mm pitch (${state.electrodeGap} mm isolation between electrodes).`;
      }
    }
    if (control.dataset.channels && number !== null) {
      const channels = validNumber(control.dataset.channels);
      if (Number.isInteger(channels) && number < channels) return `At least ${channels}, one contact per channel (leave empty for exactly ${channels}).`;
    }
    return "";
  }
  function clientMessage(control) {
    // Single-field limits of the profile; these block generation.
    control.setCustomValidity(control.type === "text" && control.required && control.value.trim() === "" ? "Enter a name." : "");
    const validity = control.validity;
    const unit = specOf(control)?.unit ? ` ${specOf(control).unit}` : "";
    if (validity.valid) return "";
    if (validity.customError) return control.validationMessage;
    if (validity.valueMissing) return "Required.";
    if (validity.badInput) return "Enter a number.";
    if (validity.rangeUnderflow) return `At least ${control.min}${unit}.`;
    if (validity.rangeOverflow) return `At most ${control.max}${unit}.`;
    if (validity.stepMismatch) return control.step === "1" ? "Enter a whole number." : `Use the ${control.step}${unit} input resolution.`;
    if (validity.tooLong) return `At most ${control.maxLength} characters.`;
    if (validity.tooShort) return `At least ${control.minLength} characters.`;
    return control.validationMessage;
  }
  function validateForm({focus = false} = {}) {
    let first = null;
    for (const control of controls) {
      control.dataset.clientMessage = clientMessage(control);
      control.dataset.advice = crossFieldAdvice(control);
      if (control.dataset.clientMessage && !first) first = control;
    }
    controls.forEach(renderMessages);
    updateRanges();
    if (first && focus) first.focus();
    return !first;
  }
  function updateRanges() {
    for (const control of controls) {
      const spec = specOf(control); const node = $(`${control.id}Range`);
      if (!spec || !node) continue;
      const unit = spec.unit ? ` ${spec.unit}` : "";
      let text = "";
      if (spec.type === "string" && Number.isInteger(spec.max_length)) text = `≤ ${spec.max_length} characters`;
      else if (control.dataset.channels) {
        const channels = validNumber(control.dataset.channels);
        text = Number.isInteger(channels) ? `${channels}–${spec.maximum} · empty = ${channels}` : `≤ ${spec.maximum} · empty = channels`;
      } else if (Number.isFinite(spec.minimum) && Number.isFinite(spec.maximum)) {
        const bound = control.dataset.pitch ? electrodeBound(control) : null;
        text = `${spec.minimum}–${bound === null ? spec.maximum : Math.min(spec.maximum, bound)}${unit}`;
      }
      node.textContent = text;
    }
  }

  // -- field messages (client checks and the server's validation by field path) --

  function controlForPath(path, normalization) {
    if (typeof path !== "string" || !path) return null;
    const byField = controls.find(control => fieldsOf(control).includes(path));
    if (byField) return byField;
    // Alias-value errors sit at the alias the form sent (connector_side, row_fpc_position, scan_order).
    const byName = controls.find(control => control.name === path);
    if (byName) return byName;
    const applied = (normalization?.aliases_applied || []).find(entry => entry.alias === path);
    if (applied && applied.field !== path) return controlForPath(applied.field);
    const inSection = controls.filter(control => fieldsOf(control).some(field => field.startsWith(`${path}.`)));
    return inSection.length === 1 ? inSection[0] : null;
  }
  function applyServerMessages(validation, text) {
    // text: the payload the server checked; its messages replace client advice for that form.
    state.serverMessages = new Map();
    state.serverText = validation ? text : null;
    for (const [kind, issues] of [["error", validation?.errors], ["warning", validation?.warnings]]) {
      for (const issue of Array.isArray(issues) ? issues : []) {
        const control = controlForPath(issue.field, validation.normalization);
        if (!control) continue;
        if (!state.serverMessages.has(control.id)) state.serverMessages.set(control.id, []);
        state.serverMessages.get(control.id).push({kind, code: issue.code, message: issue.message});
      }
    }
    controls.forEach(renderMessages);
    state.maskIssues = maskIssuesOf(validation);
    showMaskNote();
  }
  function renderMessages(control) {
    const box = $(`${control.id}Message`);
    const client = control.dataset.clientMessage || "";
    const server = state.serverMessages.get(control.id) || [];
    const advice = !client && control.dataset.advice && state.serverText !== payloadText() ? control.dataset.advice : "";
    const items = client ? [el("span", {className: "is-error"}, client)] : [
      ...(advice ? [el("span", {className: "is-error"}, advice)] : []),
      ...server.map(item => el("span", {className: `is-${item.kind}`}, el("code", {}, item.code), " ", String(item.message))),
    ];
    control.setAttribute("aria-invalid", String(Boolean(client || advice) || server.some(item => item.kind === "error")));
    if (!box) return;
    box.replaceChildren(...items);
    box.hidden = !items.length;
  }
  function labelFor(path, normalization) {
    const control = controlForPath(path, normalization);
    if (control) return form.querySelector(`label[for="${control.id}"]`)?.textContent || path;
    const board = /^boards\.(row|column)\b/.exec(String(path));
    return board ? `${capitalize(board[1])} FPC DRC` : String(path || "design");
  }

  // -- requests --------------------------------------------------------------------

  async function readJSON(response) {
    if (!(response.headers.get("Content-Type") || "").includes("json")) return null;
    try { return await response.json(); } catch (error) { return null; }
  }
  function requestError(response, data) {
    if (data && typeof data.code === "string") return new RequestError(data.code, String(data.error || "Request rejected."), data);
    return new RequestError(`HTTP_${response.status}`, `HTTP ${response.status} ${response.statusText || ""} without a JSON error body.`.replace("  ", " "));
  }
  const describe = error => (error?.code ? `${error.code} — ${error.message}` : String(error?.message || error));

  async function post(path, body, label) {
    // Generation slots are limited (503 + Retry-After) and the server times out stalled requests (408).
    for (let attempt = 1; ; attempt += 1) {
      let response;
      try {
        response = await apiFetch(path, {method: "POST", headers: JSON_HEADERS, body: JSON.stringify(body)});
      } catch (error) {
        throw new RequestError("E_NETWORK", "The local server did not answer; is app.py still running?");
      }
      const busy = response.status === 503 && attempt < MAX_BUSY_ATTEMPTS;
      const timedOut = response.status === 408 && attempt < MAX_TIMEOUT_ATTEMPTS;
      if (!busy && !timedOut) return response;
      const data = await readJSON(response);
      const retryAfter = Number.parseFloat(response.headers.get("Retry-After"));
      const delay = Math.min(MAX_RETRY_DELAY_S, Math.max(Number.isFinite(retryAfter) ? retryAfter : 1, 0.5 * 2 ** (attempt - 1)));
      setStatus("neutral", `${label}: ${data?.code || `HTTP ${response.status}`}; retrying in ${delay} s (attempt ${attempt + 1} of ${busy ? MAX_BUSY_ATTEMPTS : MAX_TIMEOUT_ATTEMPTS})…`);
      await sleep(delay);
    }
  }

  // -- generation and stale state --------------------------------------------------

  function isResult(data) {
    return Boolean(data) && typeof data.ok === "boolean" && Array.isArray(data.validation?.errors) && Array.isArray(data.validation?.warnings)
      && typeof data.manifest?.build_id === "string" && data.boards && typeof data.boards === "object";
  }
  const isStale = () => Boolean(state.result) && !state.busy && payloadText() !== state.builtText;
  const downloadsReady = () => Boolean(state.result?.ok) && !state.busy && !isStale();

  async function generate() {
    if (state.busy) return;
    if (!validateForm({focus: true})) {
      setStatus("error", "Correct the highlighted fields first; nothing was generated.");
      return;
    }
    const sent = formBody();
    state.busy = true;
    clearTimeout(state.liveTimer);
    state.liveSeq += 1;
    state.live = null;
    refreshControls();
    setStatus("neutral", "Deriving paired FPC geometry and running the whole-board DRC…");
    try {
      const response = await post("/api/generate", sent, "Generation");
      const data = await readJSON(response);
      if (!response.ok) throw requestError(response, data);
      if (!isResult(data)) throw new RequestError("E_CLIENT_CONTRACT", "The server reply is not a generation result.");
      state.result = data;
      state.builtText = JSON.stringify(sent);
      showResult(data);
    } catch (error) {
      state.result = null;
      state.builtText = null;
      showFailure(error);
    } finally {
      state.busy = false;
      refreshControls();
    }
  }
  function showResult(result) {
    applyServerMessages(result.validation, state.builtText);
    showBundle(result.design);
    drawIssues(result.validation, result);
    if (BOARD_KEYS.every(key => typeof result.boards[key]?.svg === "string")) renderBoards(result);
    else clearBoards(result.ok ? "The server returned no board geometry." : "Generation blocked: no geometry was generated for this design.");
    const id = result.manifest.build_id;
    const {errors, warnings} = result.validation;
    const drcErrors = errors.filter(issue => String(issue.field).startsWith("boards.")).length;
    const maskErrors = state.maskIssues.filter(issue => issue.kind === "error").length;
    if (result.ok && !warnings.length) setStatus("ok", `Valid build ${id} is ready for review: both boards pass every whole-board check.`);
    else if (result.ok) setStatus("warning", `Valid build ${id} with ${plural(warnings.length, "warning")}; review them before ordering.`);
    else if (drcErrors) setStatus("error", `Build ${id} is blocked by ${plural(drcErrors, "design-rule violation")}; see the DRC panel.`);
    else if (maskErrors) setStatus("error", `Build ${id} is blocked: the masked field from Gen by Surface does not fit the changed form (${plural(maskErrors, "issue")} in its note under Standardized manufacturing). Undo the change, fit again in CAD mode, or use the full field.`);
    else setStatus("error", `Build ${id} is blocked: correct the ${plural(errors.length, "listed issue")} (marked in the form).`);
    document.dispatchEvent(new CustomEvent("fpc:result", {detail: result}));  // CAD mode (web/cad/main.js) maps the build onto the part
  }
  function showFailure(error) {
    applyServerMessages(null);
    clearBoards("No preview: the last generation failed.");
    $("summary").hidden = false;
    $("summary").replaceChildren(el("strong", {}, "Generation failed"), el("p", {className: "hint"}, describe(error)));
    setStatus("error", `Unable to generate: ${describe(error)}`);
  }

  function refreshControls() {
    const stale = isStale();
    $("workbench").classList.toggle("is-stale", stale);
    $("staleBanner").hidden = !stale;
    if (stale) renderStaleDetail();
    const ready = downloadsReady();
    downloadButtons.forEach(button => { button.disabled = !ready; });
    generateButton.disabled = state.busy;
    $("regenerate").disabled = state.busy;
    const id = state.result?.manifest?.build_id;
    $("downloadNote").textContent = state.busy ? "Downloads are disabled while a build is running."
      : stale ? `Downloads are disabled: the form no longer matches build ${id}. Regenerate first.`
        : ready ? `Build ${id}. Every file name starts with this build id.`
          : "Downloads are enabled only for a valid build that matches the form.";
  }
  function renderStaleDetail() {
    const id = state.result?.manifest?.build_id;
    let text = `Previews, checks and downloads below still show build ${id}.`;
    if (state.live) text += state.live.ok ? ` The changed form validates (it would become build ${state.live.buildId}).` : ` The changed form has ${plural(state.live.errors, "error")}.`;
    $("staleDetail").textContent = text;
  }
  function onFormEdit(target) {
    if (target?.dataset?.field) state.serverMessages.delete(target.id);  // it described the previous value
    if (target && ["rows", "columns"].includes(target.id)) clearMask(`${target.id} changed`);
    if (target?.id === "rowSides") showMaskNote();  // its text names the Row traces
    if (!target || target.id === "rowSides") {
      // The limits, badge and rules are those of the Row traces' rule set (a design applied: target null).
      applyBounds();
      showProfile();
    }
    validateForm();
    if (state.result && !state.busy && payloadText() === state.builtText) applyServerMessages(state.result.validation, state.builtText);
    refreshControls();
    scheduleLiveValidation();
  }
  function scheduleLiveValidation() {
    clearTimeout(state.liveTimer);
    const sequence = (state.liveSeq += 1);
    state.live = null;
    if (!isStale() || controls.some(control => control.dataset.clientMessage)) return;
    state.liveTimer = setTimeout(() => liveValidate(sequence), LIVE_VALIDATION_DELAY_MS);
  }
  async function liveValidate(sequence) {
    // Advisory: server rules for the changed form (feasibility included) before regenerating.
    try {
      const text = payloadText();
      const response = await apiFetch("/api/validate", {method: "POST", headers: JSON_HEADERS, body: text});
      const data = await readJSON(response);
      if (sequence !== state.liveSeq || !response.ok || !data?.validation) return;
      applyServerMessages(data.validation, text);
      state.live = {ok: data.ok === true, buildId: data.identity?.build_id, errors: data.validation.errors?.length || 0};
      if (isStale()) renderStaleDetail();
    } catch (error) {
      // The generate request reports problems authoritatively.
    }
  }

  // -- summary -----------------------------------------------------------------------

  function issueItem(issue, kind, normalization) {
    const control = controlForPath(issue.field, normalization);
    const board = /^boards\.(row|column)\b/.exec(String(issue.field));
    const mask = /^matrix\.mask(\[|$)/.test(String(issue.field));
    const where = control ? el("button", {type: "button", className: "field-link", "data-target": control.id}, labelFor(issue.field, normalization))
      : board ? el("a", {href: `#drc-${board[1]}`}, labelFor(issue.field))
        : mask ? el("a", {href: "#maskNote", className: "field-path"}, `Masked field (${issue.field})`)
          : el("span", {className: "field-path"}, String(issue.field || "design"));
    return el("li", {className: `is-${kind}`}, el("code", {}, String(issue.code)), " ", where, ` — ${issue.message}`);
  }
  function drcTotals(result) {
    const parts = BOARD_KEYS.map(key => {
      const checks = Object.values(result?.boards?.[key]?.verification?.checks || {});
      return checks.length ? `${roleTitle(result.boards[key])} ${checks.filter(check => check.passed).length}/${checks.length}` : null;
    }).filter(Boolean);
    const registration = result?.boards?.row?.verification?.registration;
    return parts.length ? `Whole-board checks passed: ${parts.join(", ")}${registration ? `; registration ${registration.passed ? "passed" : "failed"}` : ""}.` : "";
  }
  function maskBadge(result) {
    // A masked build: "N of R × C taxels active" (the readout keeps R × C positions; the others read 0).  A diagonal
    // Row bus records its full field's mask too: no badge when every position is a taxel.
    const registration = result?.boards?.row?.grid_registration;
    const mask = registration?.taxel_mask;
    if (!mask || !(registration.active_taxel_count < mask.rows * mask.columns)) return null;
    return el("p", {className: "mask-badge", id: "maskBadge"}, `${registration.active_taxel_count} of ${mask.rows} × ${mask.columns} taxels active (masked field; the other positions read 0)`);
  }
  function drawIssues(validation, result) {
    const summary = $("summary");
    const errors = validation.errors || []; const warnings = validation.warnings || [];
    const parts = [];
    if (!errors.length && !warnings.length) {
      parts.push(el("strong", {}, "All checks passed."));
      parts.push(el("p", {className: "hint"}, `${drcTotals(result)} The build is deterministic: the same inputs give the same build id and byte-identical files. The Gerber ZIPs still need a separate JLCPCB review before ordering.`));
    } else {
      parts.push(el("strong", {}, errors.length ? "Generation is blocked" : "Review warnings"));
      const items = [...errors.map(issue => issueItem(issue, "error", validation.normalization)), ...warnings.map(issue => issueItem(issue, "warning", validation.normalization))];
      parts.push(el("ul", {className: "issue-list"}, items));
    }
    const normalization = validation.normalization || {};
    const notes = [
      ...(normalization.values_normalized || []).map(item => `${item.field}: ${item.from} → ${item.to} (${item.reason}).`),
      ...(normalization.aliases_shadowed || []).map(item => `${item.alias} ignored for ${item.field}: ${item.by} takes precedence.`),
    ];
    if (notes.length) parts.push(el("ul", {className: "note-list"}, notes.map(note => el("li", {}, note))));
    const badge = maskBadge(result);
    if (badge) parts.splice(1, 0, badge);
    summary.replaceChildren(...parts);
    // A clean pass says so in the status line (and the design checks' line); the box shows only what needs reading.
    summary.hidden = !errors.length && !warnings.length && !notes.length && !badge;
  }

  // -- board previews ----------------------------------------------------------------

  function pin1Net(board) {
    return (board.layers?.top_copper?.pads || []).find(pad => pad.pin === 1)?.net || "n/a";
  }
  function boardSvg(board, label) {
    // The server SVG is a copper-side top view (Y flipped into screen axes) with
    // data-view="top" and data-active-region in SVG user units.
    if (typeof board?.svg !== "string") return null;
    const parsed = new DOMParser().parseFromString(board.svg, "image/svg+xml");
    const root = parsed.documentElement;
    if (!root || root.namespaceURI !== SVG_NS || root.localName !== "svg" || parsed.getElementsByTagName("parsererror").length) return null;
    const svg = document.importNode(root, true);
    svg.setAttribute("aria-label", label);
    decorateLook(svg);
    return svg;
  }
  function boardBackSvg(board) {
    // The board's other side, for the 3D views (the oblique and the stacked view, two-sided: backFace): the single-sided
    // FPC's polyimide with its copper seen through it and the stiffener on it outermost; no coverlay window, no ENIG, no
    // label.  Drawn mirrored (styles.css .board-back-face), so it lies under the copper side's features.
    if (typeof board?.svg !== "string") return null;
    const parsed = new DOMParser().parseFromString(board.svg, "image/svg+xml");
    const root = parsed.documentElement;
    if (!root || root.namespaceURI !== SVG_NS || root.localName !== "svg" || parsed.getElementsByTagName("parsererror").length) return null;
    const svg = document.importNode(root, true);
    ["role", "aria-label"].forEach(name => svg.removeAttribute(name));
    Object.assign(svg.dataset, {view: "back"});
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("board-back");
    svg.querySelectorAll("title, .opening, .view-label").forEach(node => node.remove());
    svg.querySelectorAll(".pin1-marker").forEach(node => node.setAttribute("class", "pin1-back"));
    const group = svg.querySelector(":scope > g[transform]");
    if (group) group.append(...group.querySelectorAll(":scope > .stiffener"));
    return svg;
  }
  // A coin for scale in every view of a board (the user's requests of 2026-10-30): a US quarter drawn to scale, its face
  // the US Mint's photo (web/vendor/coin), with its shadow; beside the board, never over it: in the 2D view at the bottom
  // right of its window (2026-10-31: the view's box takes the window's shape, fitScene), which grows where the board leaves
  // no room (coinSpot); in the 3D views lying on a plane below the boards' (the table), bottom right of them, its reeded
  // side as thick as the coin (coinPlane).
  const COIN = {name: "US quarter", diameter_mm: 24.26, thickness_mm: 1.75, reeds: 119, photo: "static/vendor/coin/us-quarter-obverse.jpg"};
  const COIN_INSET_MM = 0.6;     // from the view's edges
  const COIN_GAP_MM = 2;         // from the board's outline
  const COIN_MARGIN_MM = 2;      // round the coin in a 3D view's coin SVG (its shadow)
  const COIN_SIDE_LAYERS = 8;    // disks that make up a 3D view's coin side
  function coinFace(sheen, cx = 0, cy = 0) {
    // The coin's face about (cx, cy) in mm: a metal disk (all there is without the photo), the photo, a sheen over both
    // (the 3D views' coin has a gleam of its own instead, coinPlane).  Placed by coordinates, never a transform: the
    // board's group is its SVG's only <g transform> (outlineRings, decorateLook).
    const r = COIN.diameter_mm / 2;
    return [svgEl("circle", {class: "coin-body", cx, cy, r}),
      svgEl("image", {class: "coin-photo", href: COIN.photo, x: round6(cx - r), y: round6(cy - r), width: COIN.diameter_mm, height: COIN.diameter_mm,
        preserveAspectRatio: "none", "clip-path": "url(#coin-clip)"}),
      ...(sheen ? [svgEl("circle", {class: "coin-sheen", cx, cy, r})] : [])];
  }
  function coinArt(cx, cy) {
    // The 2D view's coin about (cx, cy) in mm, lying on the page: a <g> for an SVG drawn in mm, its shadow round it.
    return svgEl("g", {class: "coin-ref", "data-coin": COIN.name, "data-diameter-mm": COIN.diameter_mm},
      svgEl("g", {class: "coin-lying"}, ...coinFace(true, cx, cy)));
  }
  function outlineRings(svg) {
    // The board's outline polygons in the SVG's root user units (through its board group's transform).
    const group = svg.querySelector(":scope > g[transform]");
    const matrix = group?.transform?.baseVal?.consolidate()?.matrix;
    return [...(group?.querySelectorAll(":scope > .outline") || [])].map(polygon => {
      const values = (polygon.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number);
      const ring = [];
      for (let index = 0; index + 1 < values.length; index += 2) {
        const [x, y] = [values[index], values[index + 1]];
        ring.push(matrix ? [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f] : [x, y]);
      }
      return ring;
    }).filter(ring => ring.length >= 3);
  }
  function clearOf(rings, cx, cy, reach) {
    // Whether a disk of radius ``reach`` about (cx, cy) keeps clear of every ring (outside it and off its edges).
    for (const ring of rings) {
      let inside = false;
      for (let index = 0, prior = ring.length - 1; index < ring.length; prior = index, index += 1) {
        const [[x0, y0], [x1, y1]] = [ring[prior], ring[index]];
        if ((y1 > cy) !== (y0 > cy) && cx < x0 + (cy - y0) * (x1 - x0) / (y1 - y0)) inside = !inside;
        const [dx, dy] = [x1 - x0, y1 - y0];
        const t = Math.max(0, Math.min(1, ((cx - x0) * dx + (cy - y0) * dy) / (dx * dx + dy * dy || 1)));
        if (Math.hypot(x0 + t * dx - cx, y0 + t * dy - cy) < reach) return false;
      }
      if (inside) return false;
    }
    return true;
  }
  function coinSpot(svg, box = numbers(svg?.getAttribute("viewBox"))) {
    // Where the 2D view's coin goes in the view box ``box``: from its bottom-right corner, moved right, down or both the
    // least that keeps it COIN_GAP_MM clear of the outline, the box grown to hold it the least (relative to its size).
    if (!box || !(box[2] > 0 && box[3] > 0)) return null;
    const r = COIN.diameter_mm / 2; const rings = outlineRings(svg);
    const [x0, y0] = [box[0] + box[2] - r - COIN_INSET_MM, box[1] + box[3] - r - COIN_INSET_MM];
    let best = null;
    for (const [ux, uy] of [[1, 0], [0, 1], [1, 1]]) {
      for (let step = 0; step <= 4 * (box[2] + box[3] + 2 * r); step += 1) {
        const [cx, cy] = [x0 + ux * step / 4, y0 + uy * step / 4];
        if (!clearOf(rings, cx, cy, r + COIN_GAP_MM)) continue;
        const width = Math.max(box[0] + box[2], cx + r + COIN_INSET_MM) - box[0];
        const height = Math.max(box[1] + box[3], cy + r + COIN_INSET_MM) - box[1];
        const growth = Math.max(width / box[2], height / box[3]);
        if (!best || growth < best.growth - 1e-9) best = {cx: round6(cx), cy: round6(cy), width: round6(width), height: round6(height), growth};
        break;
      }
    }
    return best;
  }
  function addCoin(svg) {
    // The 2D view's coin: under the board, beside it, the view grown where it must be (coinSpot); fitScene moves it to
    // the window's corner once the view is on the page.  The board's own view box is kept for that (data-board-box).
    const spot = coinSpot(svg);
    if (!spot) return;
    const box = numbers(svg.getAttribute("viewBox"));
    svg.dataset.boardBox = box.join(" ");
    svg.setAttribute("viewBox", `${box[0]} ${box[1]} ${spot.width} ${spot.height}`);
    const coin = coinArt(spot.cx, spot.cy);
    const board = svg.querySelector(":scope > g[transform]");
    if (board) board.before(coin); else svg.append(coin);
  }
  function fitScene(pane) {
    // The 2D view fills its window (the user's correction of 2026-10-31: the coin at the window's bottom right, not the
    // board's): the board's own view box widened (or heightened) to the window's shape about the board's centre, so the
    // board keeps its scale, and the coin in that box's bottom-right corner, COIN_INSET_MM in.  Where the board would be
    // under the coin there, the box grows evenly about the board's centre, the least (in 0.5 % steps) that keeps the coin
    // COIN_GAP_MM clear of the outline: the coin stays in the corner, the board centred and a little smaller.  The fit
    // view (Reset) is that box; a zoomed view stays where it is.  Again whenever the window changes size or is shown.
    const svg = pane.querySelector(":scope > svg"); const zoom = zooms.get(pane.id);
    const own = numbers(svg?.dataset.boardBox); const coin = svg?.querySelector(":scope > .coin-ref");
    if (!zoom || !own || !coin) return;
    const rect = svg.getBoundingClientRect(); const style = getComputedStyle(svg);
    const width = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (!(width > 0 && height > 0)) return;  // not shown: placed when it is
    const shape = width / height;
    const [w, h] = own[2] / own[3] < shape ? [own[3] * shape, own[3]] : [own[2], own[2] / shape];
    const [mx, my] = [own[0] + own[2] / 2, own[1] + own[3] / 2];
    const r = COIN.diameter_mm / 2; const rings = outlineRings(svg);
    let fit = null;
    for (let step = 0; step <= 600 && !fit; step += 1) {
      const grow = 1 + step / 200;
      const [cx, cy] = [mx + w * grow / 2 - r - COIN_INSET_MM, my + h * grow / 2 - r - COIN_INSET_MM];
      if (clearOf(rings, cx, cy, r + COIN_GAP_MM)) fit = {grow, cx: round6(cx), cy: round6(cy)};
    }
    if (!fit) return;
    coin.querySelectorAll("circle").forEach(circle => { circle.setAttribute("cx", fit.cx); circle.setAttribute("cy", fit.cy); });
    coin.querySelectorAll("image").forEach(image => { image.setAttribute("x", round6(fit.cx - r)); image.setAttribute("y", round6(fit.cy - r)); });
    const [bw, bh] = [w * fit.grow, h * fit.grow];
    zoom.base = {x: round6(mx - bw / 2), y: round6(my - bh / 2), w: round6(bw), h: round6(bh)};
    setView(pane, zoom.view);
  }
  function coinPlane(className) {
    // A 3D view's coin, placed by the caller on a plane of its own (styles.css .coin-plane, the table): its shadow on the
    // table, its side as COIN_SIDE_LAYERS disks rising through its thickness, its face on top; each an SVG in mm
    // COIN_MARGIN_MM round the coin, raised by styles.css in the plane's width (--rise: a fraction of the thickness).
    // Over the face its gleam, the light the polished metal throws back: it keeps to the light as the view turns.
    const r = COIN.diameter_mm / 2; const span = COIN.diameter_mm + 2 * COIN_MARGIN_MM;
    const layer = (kind, rise, ...children) => {
      const svg = svgEl("svg", {class: `coin-layer coin-layer-${kind}`, viewBox: `${-r - COIN_MARGIN_MM} ${-r - COIN_MARGIN_MM} ${span} ${span}`,
        "aria-hidden": "true", focusable: "false"}, ...children);
      svg.style.setProperty("--rise", String(rise));
      return svg;
    };
    const reed = round6(Math.PI * r / COIN.reeds);
    const sides = Array.from({length: COIN_SIDE_LAYERS}, (_, index) => layer("side", round6(index / COIN_SIDE_LAYERS),
      svgEl("circle", {class: "coin-side-disk", r}), svgEl("circle", {class: "coin-side-reeds", r: round6(r - 0.08), "stroke-dasharray": `${reed} ${reed}`})));
    const plane = el("div", {className: `coin-plane ${className}`, "data-coin": COIN.name, "data-diameter-mm": COIN.diameter_mm},
      layer("cast", 0, svgEl("circle", {class: "coin-cast", r})), ...sides, layer("top", 1, ...coinFace(false)),
      el("div", {className: "coin-layer coin-layer-gleam", style: "--rise: 1.02"}));
    plane.style.setProperty("--thickness", String(round6(COIN.thickness_mm / span)));
    return plane;
  }
  function backFace(svg) {
    // The element that shows a board's other side (boardBackSvg) where the 3D view turns it away.
    return svg ? el("div", {className: "board-back-face"}, svg) : null;
  }
  // The board's thickness in the 3D views (the user's request of 2026-10-30): the stack-up of its result (board.fpc.stackup:
  // core PI, copper, coverlay adhesive and coverlay, 0.11 mm) behind the copper side, which stays where it was (the views'
  // registration and pin-1 rings are the copper side's), and the stiffener below that (0.225 mm).  To scale where that is
  // at least 2 px on screen, else drawn 2 px thick, the stiffener in proportion (styles.css --depth-px; the captions say
  // so).  Their walls are rings along the outline, its cutouts and the stiffener's edge, so the top FPC stays see-through
  // over the field; the stiffener's outer face closes it.  styles.css lays each at its depth.
  const FPC_EDGE_LAYERS = 3;
  const STIFFENER_EDGE_LAYERS = 5;
  function boardDepth(container, face, board, svg) {
    const stack = board?.fpc?.stackup; const group = svg?.querySelector(":scope > g[transform]");
    const box = numbers(svg?.getAttribute("viewBox"));
    if (!stack || !group || !box || !(box[2] > 0)) return;
    const fpc = round6(["core_polyimide_thickness_mm", "copper_thickness_mm", "coverlay_adhesive_thickness_mm", "coverlay_thickness_mm"]
      .reduce((total, key) => total + (Number(stack[key]) || 0), 0));
    const stiffener = stack.stiffener_side === "bottom" ? Number(stack.stiffener_thickness_mm) || 0 : 0;
    if (!(fpc > 0)) return;
    const shapes = selector => [...group.querySelectorAll(`:scope > :is(${selector})`)];
    const layer = (kind, depth, nodes, className) => {
      const copies = nodes.map(node => {
        const copy = svgEl(node.localName, {class: className});
        ["points", "d", "x", "y", "width", "height", "rx", "ry", "cx", "cy", "r"].forEach(name => {
          if (node.hasAttribute(name)) copy.setAttribute(name, node.getAttribute(name));
        });
        return copy;
      });
      const copy = svgEl("svg", {class: `board-edge board-edge-${kind}`, viewBox: svg.getAttribute("viewBox"),
        preserveAspectRatio: svg.getAttribute("preserveAspectRatio") || "xMidYMid meet", "aria-hidden": "true", focusable: "false"},
        svgEl("g", {transform: group.getAttribute("transform")}, ...copies));
      copy.style.setProperty("--depth-mm", String(round6(depth)));
      return copy;
    };
    const walls = shapes(".outline, .cutout"); const stiffeners = stiffener > 0 ? shapes(".stiffener") : [];
    const layers = Array.from({length: FPC_EDGE_LAYERS}, (_, index) => layer("fpc", fpc * (index + 0.5) / FPC_EDGE_LAYERS, walls, "fpc-edge-ring"));
    if (stiffeners.length) {
      layers.push(...Array.from({length: STIFFENER_EDGE_LAYERS}, (_, index) =>
        layer("stiffener", fpc + stiffener * (index + 0.5) / STIFFENER_EDGE_LAYERS, stiffeners, "fpc-stiffener-ring")));
      layers.push(layer("stiffener-face", fpc + stiffener, stiffeners, "fpc-stiffener-face"));
    }
    container.style.setProperty("--view-mm", String(round6(box[2])));
    container.style.setProperty("--fpc-mm", String(fpc));
    Object.assign(container.dataset, {fpcMm: String(fpc), stiffenerMm: String(round6(stiffener))});
    face.append(...layers);
  }

  // -- looks ------------------------------------------------------------------------------
  // The board previews and the stacked view are drawn in a look (body[data-look], styles.css): Photo (the default),
  // colours sampled from a photograph of a JLCPCB FlexiTac pad on white (the open PI under the coverlay, the copper under
  // it, the darker narrow gaps between traces, ENIG where the coverlay is open, the stiffener darkening what lies above
  // it), or Diagram (the server SVG's own colours).  The server SVG is never changed: each copy gains the look's extra
  // layers (class lk, hidden in Diagram), built from its own elements: the gaps (the copper's closing, outside the
  // windows), the traces' edges, the stiffener over the copper, the ENIG (the copper within the openings) and a grain.
  // Shared gradients and filters are in index.html's .look-defs.

  const LOOKS = ["photo", "diagram"];
  const LOOK_KEY = "fpc-customizer.look";
  // A trace edge: the copper drawn this much wider (mm) in the edge colour, under the copper.
  const LOOK_EDGE_MM = 0.05;
  let lookSerial = 0;

  function decorateLook(svg) {
    const group = svg.querySelector(":scope > g[transform]");
    const outlines = group ? [...group.querySelectorAll(":scope > .outline")] : [];
    if (!outlines.length) return;
    const openings = [...group.querySelectorAll(":scope > .opening")];
    const copper = [...group.querySelectorAll(":scope > :is(.route, .electrode, .pad)")];
    const stiffeners = [...group.querySelectorAll(":scope > .stiffener")];
    const serial = (lookSerial += 1);
    const copies = (nodes, wider = 0) => nodes.map(node => {
      const copy = node.cloneNode(false);
      copy.removeAttribute("class");
      if (wider && copy.localName === "polyline") copy.setAttribute("stroke-width", String(round6(Number(copy.getAttribute("stroke-width") || 0) + wider)));
      return copy;
    });
    const layerGroup = (className, nodes, attributes = {}) => svgEl("g", {class: `lk ${className}`, ...attributes}, ...nodes);
    // The gaps' mask: the outline less the coverlay openings (no gap within a window).
    const gapMask = `lk-mask-${serial}`; const windows = `lk-win-${serial}`; const boardClip = `lk-board-${serial}`;
    const huge = {maskUnits: "userSpaceOnUse", x: -5000, y: -5000, width: 10000, height: 10000};
    const defs = svgEl("defs", {},
      svgEl("mask", {id: gapMask, ...huge}, svgEl("g", {fill: "#fff"}, ...copies(outlines)), svgEl("g", {fill: "#000"}, ...copies(openings))),
      svgEl("clipPath", {id: windows}, ...copies(openings)),
      svgEl("clipPath", {id: boardClip}, ...copies(outlines)));
    group.prepend(defs);
    const box = outlineBox(outlines);
    const front = [
      layerGroup("lk-gap", [svgEl("g", {filter: "url(#lk-close)"}, ...copies(copper))], {mask: `url(#${gapMask})`}),
      layerGroup("lk-edge", copies(copper, LOOK_EDGE_MM)),
    ];
    const back = [
      layerGroup("lk-stiff", copies(stiffeners)),
      layerGroup("lk-gold", copies(copper), {"clip-path": `url(#${windows})`}),
      box ? layerGroup("lk-grain", [svgEl("rect", {...box, filter: "url(#lk-grain)"}), svgEl("rect", {...box, class: "lk-gloss"})], {"clip-path": `url(#${boardClip})`}) : null,
    ].filter(Boolean);
    if (copper.length) {
      copper[0].before(...front);
      copper[copper.length - 1].after(...back);
    } else {
      group.append(...front, ...back);
    }
  }
  function outlineBox(outlines) {
    // The outlines' bounding box in their own user units (from their points: the SVG need not be laid out).
    const values = outlines.flatMap(node => (node.getAttribute("points") || "").trim().split(/[\s,]+/).map(Number)).filter(Number.isFinite);
    if (values.length < 4) return null;
    const xs = values.filter((_, index) => index % 2 === 0); const ys = values.filter((_, index) => index % 2 === 1);
    const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
    return {x: round6(x0), y: round6(y0), width: round6(Math.max(...xs) - x0), height: round6(Math.max(...ys) - y0)};
  }
  function storedLook() {
    try {
      const look = window.localStorage.getItem(LOOK_KEY);
      return LOOKS.includes(look) ? look : null;
    } catch (error) {
      return null;
    }
  }
  function setLook(look, remember = true) {
    const shown = LOOKS.includes(look) ? look : LOOKS[0];
    document.body.dataset.look = shown;
    document.querySelectorAll("button[data-look]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.look === shown)));
    if (remember) {
      try {
        window.localStorage.setItem(LOOK_KEY, shown);
      } catch (error) {
        // Private windows and blocked storage keep the look for this page only.
      }
    }
    // The rings are placed again: a look changes nothing of the geometry, but the views redraw.
    document.querySelectorAll(".zoom-pane, .oblique-board").forEach(sizePin1Rings);
    if ($("stackedPreview")) sizePin1Rings($("stackedPreview"));
  }
  function addPin1Ring(svg, layer = "") {
    // A ring around the server's pin-1 triangle, which is tiny at fit-to-view scale;
    // sizePin1Rings gives it a fixed screen radius once the SVG is laid out.  In the stacked view (layer "upper" or
    // "lower") it takes its board's colour and keeps its triangle's axis, along which it steps away from the other
    // board's ring and triangle where they lie close (separatePin1Rings).
    const marker = svg.querySelector(".pin1-marker");
    const points = (marker?.getAttribute("points") || "").trim().split(/\s+/).map(point => point.split(",").map(Number));
    if (!marker || !points.length || points.some(point => point.length !== 2 || !point.every(Number.isFinite))) return;
    let matrix = new DOMMatrix();
    for (let node = marker; node && node !== svg; node = node.parentNode) {
      const transform = node.transform?.baseVal?.consolidate();
      if (transform) matrix = DOMMatrix.fromMatrix(transform.matrix).multiply(matrix);
    }
    const mean = index => points.reduce((sum, point) => sum + point[index], 0) / points.length;
    const center = new DOMPoint(mean(0), mean(1)).matrixTransform(matrix);
    const ring = svgEl("circle", {class: layer ? `pin1-ring is-${layer}` : "pin1-ring", cx: round6(center.x), cy: round6(center.y), r: PIN1_RING_MIN_MM});
    if (layer) {
      // The triangle's tip (its first point) lies toward the contact: inward is from the centre through it.
      const tip = new DOMPoint(points[0][0], points[0][1]).matrixTransform(matrix);
      const length = Math.hypot(tip.x - center.x, tip.y - center.y);
      if (length > 0) Object.assign(ring.dataset, {x: center.x, y: center.y, dx: (tip.x - center.x) / length, dy: (tip.y - center.y) / length});
    }
    svg.append(ring);
  }
  function stepPin1Ring(ring, along, across = 0) {
    // A stacked view's ring ``along`` ring diameters and gaps inward along its triangle's axis (outward when negative) and
    // ``across`` beside it (the axis turned a quarter counter-clockwise in the SVG's units).
    const scale = svgScale(ring.ownerSVGElement);
    const {x, y, dx, dy} = ring.dataset;
    if (!scale || !dx) return;
    const out = 2 * Number(ring.getAttribute("r")) + PIN1_RING_GAP_PX / scale;
    ring.setAttribute("cx", String(round6(Number(x) + (Number(dx) * along - Number(dy) * across) * out)));
    ring.setAttribute("cy", String(round6(Number(y) + (Number(dy) * along + Number(dx) * across) * out)));
    ring.dataset.step = `${along},${across}`;
  }
  function separatePin1Rings(scope) {
    // The stacked view's two rings by their boxes on screen (each view: the exploded one turns the boards in their plane,
    // then tilts them about the screen's x axis, so the two boxes are alike, each read as an ellipse along the screen's
    // axes; the ring drawn in it, drawPin1Rings, is about 1 / 1.28 of it there, so the drawn rings part by more), placed
    // the gap apart, neither taking in the other board's triangle and each nearer its own (so each marks its own pin-1 pad
    // only), both within the view and off its caption: round their triangles where that holds; else moved apart the least
    // that holds it, each still holding its own triangle's centre (below); else the first steps of PIN1_STEPS that hold
    // it; where none does, the first that keeps them apart.
    const rings = [scope.querySelector(".pin1-ring.is-upper"), scope.querySelector(".pin1-ring.is-lower")];
    if (rings.some(ring => !ring?.dataset.dx || !svgScale(ring.ownerSVGElement))) return;
    const drawn = ring => { const box = ring.getBoundingClientRect(); return {x: box.left + box.width / 2, y: box.top + box.height / 2, rx: box.width / 2, ry: box.height / 2}; };
    const views = rings.map(ring => {
      stepPin1Ring(ring, 1, 0);
      const inward = drawn(ring);
      stepPin1Ring(ring, 0, 1);
      const beside = drawn(ring);
      stepPin1Ring(ring, 0, 0);
      const home = drawn(ring);
      return {...home, along: [inward.x - home.x, inward.y - home.y], across: [beside.x - home.x, beside.y - home.y]};
    });
    if (views.some(view => !(view.rx > 0 && view.ry > 0))) return;
    const triangles = rings.map(ring => ring.ownerSVGElement.querySelector(".pin1-marker")?.getBoundingClientRect());
    const frame = scope.getBoundingClientRect();
    const caption = scope.querySelector(".assembly-caption")?.getBoundingClientRect();
    const at = (view, [along, across]) => ({...view, x: view.x + along * view.along[0] + across * view.across[0], y: view.y + along * view.along[1] + across * view.across[1]});
    // Distances with y scaled by the ellipses' aspect, where they are circles.
    const aspect = views[0].rx / views[0].ry;
    const apart = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * aspect) >= a.rx + b.rx + PIN1_RING_GAP_PX;
    const clear = (ring, box) => !box || Math.hypot(Math.min(Math.max(ring.x, box.left), box.right) - ring.x,
      (Math.min(Math.max(ring.y, box.top), box.bottom) - ring.y) * aspect) >= ring.rx + PIN1_RING_GAP_PX / 2;
    const centre = box => box && {x: box.left + box.width / 2, y: box.top + box.height / 2};
    const near = (ring, point) => Math.hypot(point.x - ring.x, (point.y - ring.y) * aspect);
    const own = (ring, mine, other) => !mine || !other || near(ring, centre(mine)) < near(ring, centre(other));
    // Within the view (it clips) and not under its caption by more than a third of the ring's radius both ways (by
    // ``slack`` px less for a ring moved apart, which lands where the rings just part: off the edge of either rule).
    const under = (low, high, from, to, radius, slack) => Math.min(high, to) - Math.max(low, from) > radius / 3 - slack;
    const shown = (ring, slack) => ring.x - ring.rx >= frame.left + slack && ring.x + ring.rx <= frame.right - slack
      && ring.y - ring.ry >= frame.top + slack && ring.y + ring.ry <= frame.bottom - slack
      && !(caption?.width && under(ring.x - ring.rx, ring.x + ring.rx, caption.left, caption.right, ring.rx, slack)
           && under(ring.y - ring.ry, ring.y + ring.ry, caption.top, caption.bottom, ring.ry, slack));
    const fits = ([upper, lower], slack = 0) => apart(upper, lower) && clear(upper, triangles[1]) && clear(lower, triangles[0])
      && own(upper, triangles[0], triangles[1]) && own(lower, triangles[1], triangles[0]) && shown(upper, slack) && shown(lower, slack);
    // Its own triangle's centre within the ring: the ring still rounds it.
    const holds = (ring, mine) => !mine || near(ring, centre(mine)) < ring.rx;
    // A move of the ring's centre on screen in its steps along and across its triangle's axis.
    const steps = (view, x, y) => {
      const [[ax, ay], [bx, by]] = [view.along, view.across];
      const det = ax * by - ay * bx;
      return Math.abs(det) > 1e-9 ? [(x * by - y * bx) / det, (ax * y - ay * x) / det].map(value => Math.round(value * 1e3) / 1e3) : null;
    };
    const placed = PIN1_STEPS.map(([top, bottom]) => [at(views[0], top), at(views[1], bottom), top, bottom]);
    const parted = ([upper, lower]) => upper && lower && apart(upper, lower) && clear(upper, triangles[1]) && clear(lower, triangles[0]);
    // Moved apart (the top FPC's ring away from the bottom FPC's by ``up`` of the move, that one by ``down``), along the
    // line through their centres or turned off it up to a right angle in 15-degree steps (y scaled): of the moves that fit
    // with each ring still holding its own triangle's centre, the one that takes either ring least far from its triangle
    // (in its radii), the line's and the even shares first.  Along the line apart() and clear() only grow as the rings
    // part (each moves away from the other's triangle), so the least move is bisected; turned, the bisection still ends
    // on a move that parts them.
    const [dx, dy] = [views[0].x - views[1].x, (views[0].y - views[1].y) * aspect];
    const length = Math.hypot(dx, dy);
    let [chosen, least] = [fits(placed[0]) ? placed[0] : null, Infinity];
    const turns = [0, -15, 15, -30, 30, -45, 45, -60, 60, -75, 75, -90, 90];
    for (const turn of chosen || !(length > 1e-6) ? [] : turns) {
      const [cos, sin] = [Math.cos(turn * Math.PI / 180), Math.sin(turn * Math.PI / 180)];
      const [ux, uy] = [(dx * cos - dy * sin) / length, (dx * sin + dy * cos) / length];
      for (const [up, down] of [[0.5, 0.5], [1, 0], [0, 1]]) {
        const moved = move => [up, -down].map((share, index) => {
          const [x, y] = [share * move * ux, share * move * uy / aspect];
          const step = steps(views[index], x, y);
          return step && {...views[index], x: views[index].x + x, y: views[index].y + y, step};
        });
        let [low, high] = [0, 2 * Math.max(views[0].rx, views[1].rx)];
        if (!parted(moved(high))) continue;
        for (let index = 0; index < 40; index += 1) {
          const middle = (low + high) / 2;
          if (parted(moved(middle))) high = middle; else low = middle;
        }
        const [upper, lower] = moved(high);
        const cost = Math.max(up * high / views[0].rx, down * high / views[1].rx);
        if (cost < least - 1e-3 && fits([upper, lower], 1) && holds(upper, triangles[0]) && holds(lower, triangles[1])) {
          [least, chosen] = [cost, [upper, lower, upper.step, lower.step]];
        }
      }
    }
    const [, , top, bottom] = chosen || placed.find(candidate => fits(candidate)) || placed.find(([upper, lower]) => apart(upper, lower)) || placed[0];
    stepPin1Ring(rings[0], ...top);
    stepPin1Ring(rings[1], ...bottom);
  }
  function svgScale(svg) {
    // Layout pixels per user unit for the SVG's current viewBox (CSS 3D transforms ignored).
    const view = numbers(svg?.getAttribute("viewBox"));
    if (!view || !(view[2] > 0 && view[3] > 0) || !svg.getClientRects().length) return null;
    const style = getComputedStyle(svg);
    const width = svg.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = svg.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (!(width > 0 && height > 0)) return null;
    return svg.getAttribute("preserveAspectRatio") === "none" ? width / view[2] : Math.min(width / view[2], height / view[3]);
  }
  function sizePin1Rings(scope) {
    scope.querySelectorAll(".pin1-ring").forEach(ring => {
      const scale = svgScale(ring.ownerSVGElement);
      if (!scale) return;
      const radius = Math.max(PIN1_RING_MIN_MM, PIN1_RING_PX / scale);
      ring.setAttribute("r", String(round6(radius)));
    });
    if (scope.querySelector(".pin1-ring.is-upper")) separatePin1Rings(scope);
    drawPin1Rings(scope);
  }
  function drawPin1Rings(scope) {
    // The stacked view draws both pin-1 rings above both boards (P5-diagonal-bus.md section 27.8: inside its board's SVG
    // the bottom FPC's ring lay under the top FPC's translucent face, its stroke breaking where it crossed the gold fingers,
    // and the top FPC's ring took its face's opacity): each ring stays in its board's SVG, placed there
    // (separatePin1Rings) and unseen, and is drawn in one overlay over the scene as it lies on screen (projectedRing), in
    // its stroke, 2 px wide in both views.  Section 27.9: not at its box on screen, which in the exploded view (the boards
    // turned in their plane, then tilted) holds the ring's turned bounding square and is about 1.28 times the ring.
    const overlay = scope.querySelector(".pin1-overlay");
    if (!overlay) return;
    // The overlay's box from the whole device pixel at or before the view's corner (an SVG's box is drawn snapped to
    // whole pixels, which moved its rings by up to a pixel), in CSS pixels.
    const frame = scope.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const [left, top] = [Math.floor(frame.left * ratio) / ratio, Math.floor(frame.top * ratio) / ratio];
    const [width, height] = [Math.ceil(frame.right * ratio) / ratio - left, Math.ceil(frame.bottom * ratio) / ratio - top];
    Object.assign(overlay.style, {left: `${round6(left - frame.left)}px`, top: `${round6(top - frame.top)}px`, width: `${round6(width)}px`, height: `${round6(height)}px`});
    overlay.setAttribute("viewBox", `0 0 ${round6(width)} ${round6(height)}`);
    overlay.replaceChildren(...[...scope.querySelectorAll(".assembly-board .pin1-ring")].map(ring => {
      const box = ring.getBoundingClientRect();
      const shape = projectedRing(ring) || {x: box.left + box.width / 2, y: box.top + box.height / 2, rx: box.width / 2, ry: box.height / 2, angle: 0};
      const [cx, cy] = [round6(shape.x - left), round6(shape.y - top)];
      const drawn = svgEl("ellipse", {class: `pin1-ring-drawn${ring.classList.contains("is-upper") ? " is-upper" : " is-lower"}`,
        cx, cy, rx: round6(shape.rx), ry: round6(shape.ry)});
      if (Math.abs(shape.angle) > 1e-6) drawn.setAttribute("transform", `rotate(${round6(shape.angle)} ${cx} ${cy})`);
      drawn.style.stroke = getComputedStyle(ring).stroke;
      return drawn;
    }));
  }
  function projectedRing(ring) {
    // A ring's circle as it lies on screen, in page pixels: its centre, its semi-axes (rx the longer) and the angle of rx
    // (degrees, clockwise from the screen's x axis).  The board's plane maps to the screen by a homography (the exploded
    // view's perspective included), found from four points of the circle, each the centre of the box on screen of a
    // probe circle a thousandth of the ring's radius in the ring's SVG; the circle's image under it is the ellipse.
    // Null where the probes are not laid out or the image is no ellipse.
    const [cx, cy, r] = ["cx", "cy", "r"].map(name => Number(ring.getAttribute(name)));
    if (![cx, cy, r].every(Number.isFinite) || !(r > 0) || !ring.parentNode) return null;
    const source = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    const probes = source.map(([u, v]) => svgEl("circle", {cx: cx + u * r, cy: cy + v * r, r: r * 1e-3, visibility: "hidden"}));
    ring.parentNode.append(...probes);
    const screen = probes.map(probe => { const box = probe.getBoundingClientRect(); return [box.left + box.width / 2, box.top + box.height / 2]; });
    probes.forEach(probe => probe.remove());
    // Screen points about their mean, in units of their mean distance from it (the solve well conditioned).
    const [mx, my] = [0, 1].map(axis => screen.reduce((sum, point) => sum + point[axis], 0) / screen.length);
    const spread = screen.reduce((sum, [x, y]) => sum + Math.hypot(x - mx, y - my), 0) / screen.length;
    if (!(spread > 1e-6)) return null;
    const q = screen.map(([x, y]) => [(x - mx) / spread, (y - my) / spread]);
    // G maps q to the ring's own frame (the circle's centre at 0, its radius 1): [u, v, 1] ~ G [qx, qy, 1], G[2][2] = 1.
    const rows = [], values = [];
    q.forEach(([x, y], index) => {
      const [u, v] = source[index];
      rows.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); values.push(u);
      rows.push([0, 0, 0, x, y, 1, -x * v, -y * v]); values.push(v);
    });
    const g = solveLinear(rows, values);
    if (!g) return null;
    const G = [[g[0], g[1], g[2]], [g[3], g[4], g[5]], [g[6], g[7], 1]];
    // The circle u^2 + v^2 - 1 = 0 in q: G^T diag(1, 1, -1) G.
    const conic = (i, j) => G[0][i] * G[0][j] + G[1][i] * G[1][j] - G[2][i] * G[2][j];
    let [a, b, c, d, e, f] = [conic(0, 0), conic(0, 1), conic(1, 1), conic(0, 2), conic(1, 2), conic(2, 2)];
    if (a + c < 0) [a, b, c, d, e, f] = [-a, -b, -c, -d, -e, -f];
    const det = a * c - b * b;
    if (!(det > 0)) return null;
    const [x0, y0] = [(b * e - c * d) / det, (b * d - a * e) / det];
    const level = -(d * x0 + e * y0 + f);
    const half = Math.hypot((a - c) / 2, b);
    const [large, small] = [(a + c) / 2 + half, (a + c) / 2 - half];
    if (!(level > 0 && small > 0)) return null;
    // The eigenvector of the larger eigenvalue lies along the shorter axis: rx (the longer) a quarter turn from it.
    let angle = 0.5 * Math.atan2(2 * b, a - c) * 180 / Math.PI + 90;
    if (angle > 90) angle -= 180;
    return {x: mx + x0 * spread, y: my + y0 * spread, rx: Math.sqrt(level / small) * spread, ry: Math.sqrt(level / large) * spread, angle};
  }
  function solveLinear(matrix, values) {
    // Gaussian elimination with partial pivoting; null for a singular system.
    const size = values.length;
    const rows = matrix.map((row, index) => [...row, values[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
      if (!(Math.abs(rows[pivot][column]) > 1e-12)) return null;
      [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
      for (let row = column + 1; row < size; row += 1) {
        const factor = rows[row][column] / rows[column][column];
        for (let k = column; k <= size; k += 1) rows[row][k] -= factor * rows[column][k];
      }
    }
    const result = new Array(size).fill(0);
    for (let row = size - 1; row >= 0; row -= 1) {
      let sum = rows[row][size];
      for (let k = row + 1; k < size; k += 1) sum -= rows[row][k] * result[k];
      result[row] = sum / rows[row][row];
    }
    return result.every(Number.isFinite) ? result : null;
  }
  function boardMeta(board) {
    const metrics = board.metrics || {}; const tail = board.tail || {};
    const pins = Number(tail.connector_pins) || Number(tail.connector_channels) || 0;
    const unused = pins - (Number(tail.connector_channels) || pins);
    const connector = `${pins}-pin connector${unused > 0 ? ` (${unused} NC)` : ""}`;
    return [
      `${String(board.physical_side || "unassigned").toUpperCase()} FPC`,
      plural(metrics.channel_count, "channel"),
      tail.fanout_lane_count ? `${plural(tail.fanout_lane_count, "lane")} → ${connector}` : connector,
      `${Number(metrics.outline_width_mm).toFixed(1)} × ${Number(metrics.outline_height_mm).toFixed(1)} mm`,
    ].join(" · ");
  }
  function legend(board) {
    const counts = new Map();
    (board.layers?.top_coverlay_openings || []).forEach(opening => counts.set(opening.kind, (counts.get(opening.kind) || 0) + 1));
    const windows = [...counts].map(([kind, count]) => {
      const [one, many] = OPENING_NAMES[kind] || [String(kind).replace(/_/g, " "), `${String(kind).replace(/_/g, " ")}s`];
      return count === 1 ? one : `${count} ${many}`;
    });
    const swatch = name => el("span", {className: `swatch swatch-${name}`, "aria-hidden": "true"});
    return [
      el("span", {}, swatch("copper"), "Top copper"),
      el("span", {}, swatch("opening"), `Coverlay: ${windows.join(" + ") || "no openings"}`),
      el("span", {}, swatch("stiffener"), "PI stiffener (bottom side)"),
      el("span", {}, swatch("pin1"), `Pin 1 (${pin1Net(board)})`),
      el("span", {}, swatch("coin"), `Coin for scale: ${COIN.name}, ${COIN.diameter_mm} mm`),
    ];
  }
  function renderBoard(key, board) {
    const pane = $(`${key}Preview`); const oblique = $(`${key}Preview3d`);
    const where = `${roleTitle(board)}, ${board.physical_side} of the stack`;
    const flat = boardSvg(board, `${where}: top view from the copper side; tail exits ${board.tail?.side}; pin 1 is ${pin1Net(board)}`);
    const tilted = boardSvg(board, `${where}: oblique view (rigid tilt of the copper-side top view)`);
    if (!flat || !tilted) {
      [pane, oblique].forEach(node => node.replaceChildren(el("p", {}, "No preview available: the board SVG could not be read.")));
      zooms.delete(pane.id);
      updateZoomReadout(pane);
    } else {
      addPin1Ring(flat);
      addPin1Ring(tilted);
      addCoin(flat);
      pane.replaceChildren(flat);
      const box = numbers(tilted.getAttribute("viewBox"));
      const tiltedBoard = el("div", {className: "oblique-board"}, tilted, backFace(boardBackSvg(board)));
      boardDepth(tiltedBoard, tiltedBoard, board, tilted);
      if (box && box[2] > 0 && box[3] > 0) {
        // The coin on the table below the tilted board, bottom right of it (its SVGs hold COIN_MARGIN_MM round the coin).
        const coin = coinPlane("oblique-coin"); const span = COIN.diameter_mm + 2 * COIN_MARGIN_MM;
        Object.assign(coin.style, {width: `${(100 * span / box[2]).toFixed(4)}%`, left: `calc(100% + ${(100 * COIN_GAP_MM / box[2]).toFixed(4)}%)`, bottom: "0"});
        tiltedBoard.append(coin);
      }
      if (box && box[2] > 0 && box[3] > 0) tiltedBoard.style.setProperty("--board-ratio", (box[2] / box[3]).toFixed(6));
      oblique.replaceChildren(tiltedBoard);
      initZoom(pane, flat);
      fitScene(pane);
      fitOblique(oblique);
    }
    $(`${key}Meta`).textContent = boardMeta(board);
    $(`${key}Legend`).replaceChildren(...legend(board));
    $(`${key}Card`).classList.toggle("has-drc-failure", board.verification?.all_checks_passed === false);
  }
  function fitOblique(panel) {
    // The rigid tilt is a CSS transform: shrink the board until its projection, with its coin's, fits the pane, then move
    // the two together to the pane's centre (the pane centres the board alone).
    const board = panel.querySelector(".oblique-board");
    if (!board || !panel.getClientRects().length) return;
    board.style.width = "";
    board.style.left = ""; board.style.top = "";
    // The coin: its plane (the table, its shadow) and its face, 1.75 mm above it.
    const parts = [board, ...board.querySelectorAll(".coin-plane, .coin-layer-top")];
    const extent = () => {
      const boxes = parts.map(part => part.getBoundingClientRect());
      return {left: Math.min(...boxes.map(box => box.left)), right: Math.max(...boxes.map(box => box.right)),
        top: Math.min(...boxes.map(box => box.top)), bottom: Math.max(...boxes.map(box => box.bottom))};
    };
    for (let pass = 0; pass < 3; pass += 1) {
      const room = panel.getBoundingClientRect(); const box = extent();
      const scale = Math.min((room.width - 2 * OBLIQUE_MARGIN_PX) / (box.right - box.left), (room.height - 2 * OBLIQUE_MARGIN_PX) / (box.bottom - box.top));
      if (!(scale < 1)) break;
      board.style.width = `${(board.offsetWidth * scale).toFixed(2)}px`;
    }
    const room = panel.getBoundingClientRect(); const box = extent();
    board.style.left = `${round6((room.left + room.right) / 2 - (box.left + box.right) / 2)}px`;
    board.style.top = `${round6((room.top + room.bottom) / 2 - (box.top + box.bottom) / 2)}px`;
    sizePin1Rings(board);
  }
  function renderBoards(result) {
    BOARD_KEYS.forEach(key => renderBoard(key, result.boards[key]));
    renderAssembly(result);
    renderDrc(result);
  }
  function clearBoards(message) {
    for (const key of BOARD_KEYS) {
      $(`${key}Preview`).replaceChildren(el("p", {}, message));
      $(`${key}Preview3d`).replaceChildren(el("p", {}, message));
      $(`${key}Meta`).textContent = "No current build";
      $(`${key}Legend`).replaceChildren();
      $(`${key}Card`).classList.remove("has-drc-failure");
      zooms.delete(`${key}Preview`);
      updateZoomReadout($(`${key}Preview`));
    }
    $("stackedPreview").replaceChildren(el("p", {}, message));
    $("assemblyHeader").textContent = "";
    $("assemblyLegend").replaceChildren();
    $("assemblyNotes").replaceChildren();
    $("drcTables").replaceChildren(el("p", {}, message));
    $("drcMeta").textContent = "";
    $("drcTotal").textContent = "";
    document.dispatchEvent(new CustomEvent("fpc:cleared"));  // CAD mode drops its overlay of the cleared build
  }

  // -- zoom and pan (viewBox in SVG user units) ----------------------------------------

  function initZoom(pane, svg) {
    const box = numbers(svg.getAttribute("viewBox"));
    if (box && box[2] > 0 && box[3] > 0) zooms.set(pane.id, {base: {x: box[0], y: box[1], w: box[2], h: box[3]}, view: null});
    else zooms.delete(pane.id);
    updateZoomReadout(pane);
    sizePin1Rings(pane);
  }
  function setView(pane, view) {
    const zoom = zooms.get(pane.id); const svg = pane.querySelector("svg");
    if (!zoom || !svg) return;
    const base = zoom.base; const next = view || base;
    // Uniform zoom between fit-to-view and MAX_ZOOM; the view centre stays on the board's view box.
    const w = clamp(next.w, base.w / MAX_ZOOM, base.w); const h = w * base.h / base.w;
    const cx = clamp(next.x + next.w / 2, base.x, base.x + base.w); const cy = clamp(next.y + next.h / 2, base.y, base.y + base.h);
    zoom.view = w >= base.w ? null : {x: cx - w / 2, y: cy - h / 2, w, h};
    const shown = zoom.view || base;
    svg.setAttribute("viewBox", [shown.x, shown.y, shown.w, shown.h].map(round6).join(" "));
    updateZoomReadout(pane);
    sizePin1Rings(pane);
  }
  function clientToUser(svg, x, y) {
    const matrix = svg.getScreenCTM();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix.inverse()) : null;
  }
  function zoomAt(pane, factor, clientX, clientY) {
    // Returns whether the zoom level changed (false at fit view or at MAX_ZOOM).
    const zoom = zooms.get(pane.id); const svg = pane.querySelector("svg");
    if (!zoom || !svg) return false;
    const view = zoom.view || zoom.base;
    const w = clamp(view.w / factor, zoom.base.w / MAX_ZOOM, zoom.base.w); const scale = w / view.w;
    if (Math.abs(scale - 1) < 1e-9) return false;
    const point = (clientX === undefined ? null : clientToUser(svg, clientX, clientY)) || {x: view.x + view.w / 2, y: view.y + view.h / 2};
    setView(pane, {x: point.x - (point.x - view.x) * scale, y: point.y - (point.y - view.y) * scale, w, h: view.h * scale});
    return true;
  }
  function panBy(pane, fractionX, fractionY) {
    const zoom = zooms.get(pane.id);
    if (!zoom) return;
    const view = zoom.view || zoom.base;
    setView(pane, {...view, x: view.x + fractionX * view.w, y: view.y + fractionY * view.h});
  }
  function updateZoomReadout(pane) {
    const tools = $(pane.dataset.zoomTools);
    const zoom = zooms.get(pane.id); const svg = pane.querySelector("svg");
    tools.querySelectorAll("button").forEach(button => { button.disabled = !zoom || !svg; });
    const output = tools.querySelector("output");
    if (!zoom || !svg) { output.textContent = "—"; return; }
    const view = zoom.view || zoom.base; const matrix = svg.getScreenCTM();
    output.textContent = `${(zoom.base.w / view.w).toFixed(1)}×${matrix ? ` · ${matrix.a.toFixed(1)} px/mm` : ""}`;
  }
  function attachZoom(pane) {
    $(pane.dataset.zoomTools).addEventListener("click", event => {
      const action = event.target.closest("[data-zoom]")?.dataset.zoom;
      if (action === "in") zoomAt(pane, ZOOM_STEP);
      else if (action === "out") zoomAt(pane, 1 / ZOOM_STEP);
      else if (action === "reset") setView(pane, null);
    });
    pane.addEventListener("wheel", event => {
      if (!zooms.get(pane.id)) return;
      const lines = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      // At a zoom limit the wheel scrolls the page; a pinch (ctrl + wheel) never zooms the page.
      if (zoomAt(pane, Math.exp(-event.deltaY * lines * WHEEL_ZOOM_RATE), event.clientX, event.clientY) || event.ctrlKey) event.preventDefault();
    }, {passive: false});
    let drag = null;
    pane.addEventListener("pointerdown", event => {
      const zoom = zooms.get(pane.id); const matrix = pane.querySelector("svg")?.getScreenCTM();
      if (!zoom || !matrix || event.button !== 0) return;
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, view: {...(zoom.view || zoom.base)}, scale: matrix.a};
      pane.setPointerCapture(event.pointerId);
      pane.classList.add("is-panning");
    });
    pane.addEventListener("pointermove", event => {
      if (!drag || event.pointerId !== drag.id) return;
      setView(pane, {...drag.view, x: drag.view.x - (event.clientX - drag.x) / drag.scale, y: drag.view.y - (event.clientY - drag.y) / drag.scale});
    });
    const stop = event => { if (drag && event.pointerId === drag.id) { drag = null; pane.classList.remove("is-panning"); } };
    pane.addEventListener("pointerup", stop);
    pane.addEventListener("pointercancel", stop);
    pane.addEventListener("dblclick", () => setView(pane, null));
    pane.addEventListener("keydown", event => {
      const actions = {
        "+": () => zoomAt(pane, ZOOM_STEP), "=": () => zoomAt(pane, ZOOM_STEP), "-": () => zoomAt(pane, 1 / ZOOM_STEP), "0": () => setView(pane, null),
        ArrowLeft: () => panBy(pane, -PAN_STEP, 0), ArrowRight: () => panBy(pane, PAN_STEP, 0), ArrowUp: () => panBy(pane, 0, -PAN_STEP), ArrowDown: () => panBy(pane, 0, PAN_STEP),
      };
      if (!actions[event.key] || !zooms.get(pane.id) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      actions[event.key]();
    });
  }

  // -- assembly ------------------------------------------------------------------------

  function turnOverAxis(board) {
    // The screen axis a board is turned over about so that its tail keeps its exit
    // side (the connector side): Y for bottom/top tails, X for left/right tails.
    return board.tail?.side === "left" || board.tail?.side === "right" ? "x" : "y";
  }
  function placement(svg, flipAxis) {
    // Registration needs the copper-side top view and its taxel field in SVG user units.
    if (svg.getAttribute("data-view") !== "top") return null;
    const box = numbers(svg.getAttribute("viewBox")); const field = numbers(svg.getAttribute("data-active-region"));
    if (!box || !field || box[2] <= 0 || box[3] <= 0 || field[2] <= 0 || field[3] <= 0) return null;
    // The board's view box in the taxel-field frame: origin at the field's top-left corner, screen axes, mm.
    let left = box[0] - field[0]; let top = box[1] - field[1];
    // Turning the board over about an axis through the field centre mirrors it about that line.
    if (flipAxis === "x") top = field[3] - (top + box[3]);
    if (flipAxis === "y") left = field[2] - (left + box[2]);
    return {left, top, width: box[2], height: box[3], field};
  }
  function renderAssembly(result) {
    const target = $("stackedPreview"); const header = $("assemblyHeader");
    const boards = BOARD_KEYS.map(key => result.boards[key]);
    const upper = boards.find(board => board.physical_side === "top"); const lower = boards.find(board => board.physical_side === "bottom");
    const message = text => { target.replaceChildren(el("p", {}, text)); header.textContent = ""; $("assemblyLegend").replaceChildren(); $("assemblyNotes").replaceChildren(); };
    if (!upper || !lower) return message("No assembly preview: the boards have no physical top/bottom assignment.");
    if (!SIDES.includes(upper.tail?.side) || !SIDES.includes(lower.tail?.side)) return message("No assembly preview: a board has no tail side.");
    if ([upper, lower].some(board => board.verification?.registration?.orthogonal === false)) {
      return message("The boards cannot be registered: their electrodes are parallel in the shared frame.");
    }
    const axis = turnOverAxis(upper);
    const upperSvg = boardSvg(upper, `${roleTitle(upper)}, top of the stack: turned over about its tail axis, copper side down, seen through from above; tail exits ${upper.tail.side}; pin 1 is ${pin1Net(upper)}`);
    const lowerSvg = boardSvg(lower, `${roleTitle(lower)}, bottom of the stack: copper side up, seen from above; tail exits ${lower.tail.side}; pin 1 is ${pin1Net(lower)}`);
    const upperPlace = upperSvg && placement(upperSvg, axis); const lowerPlace = lowerSvg && placement(lowerSvg, null);
    if (!upperPlace || !lowerPlace) return message("No assembly preview: a board SVG is not a top view with a usable viewBox and data-active-region.");
    const [fieldW, fieldH] = [lowerPlace.field[2], lowerPlace.field[3]];
    if (Math.abs(upperPlace.field[2] - fieldW) > 1e-6 || Math.abs(upperPlace.field[3] - fieldH) > 1e-6) {
      return message(`The boards cannot be registered: taxel fields ${upperPlace.field[2]} × ${upperPlace.field[3]} mm and ${fieldW} × ${fieldH} mm differ.`);
    }
    const minX = Math.min(upperPlace.left, lowerPlace.left); const minY = Math.min(upperPlace.top, lowerPlace.top);
    const boardsWidth = Math.max(upperPlace.left + upperPlace.width, lowerPlace.left + lowerPlace.width) - minX;
    const boardsHeight = Math.max(upperPlace.top + upperPlace.height, lowerPlace.top + lowerPlace.height) - minY;
    // The coin for scale on the table below the stack (styles.css: 56 px under the bottom FPC), right of the boards and
    // level with their bottom; the scene holds it (its SVGs hold COIN_MARGIN_MM round the coin).
    const coinSpan = COIN.diameter_mm + 2 * COIN_MARGIN_MM;
    const coinLeft = boardsWidth + COIN_GAP_MM; const coinTop = Math.max(0, boardsHeight - coinSpan);
    const width = coinLeft + coinSpan; const height = Math.max(boardsHeight, coinSpan);
    const percent = (number, total) => `${(100 * number / total).toFixed(6)}%`;
    const boardBox = (board, svg, place, className) => {
      svg.setAttribute("preserveAspectRatio", "none");  // the box has the view box's aspect ratio
      // The taxel crossing field, in SVG user units after the server's Y flip.
      const [x, y, w, h] = place.field;
      svg.append(svgEl("rect", {class: "taxel-field", x, y, width: w, height: h}));
      // A masked field: its crossing region P (the readout's bounding field stays dashed).
      const outline = svg.getAttribute("data-active-outline");
      if (outline) svg.append(svgEl("polygon", {class: "taxel-outline", points: outline}));
      addPin1Ring(svg, board === upper ? "upper" : "lower");
      // The legend names pin 1; tooltips of the flipped copy would duplicate it.
      svg.querySelectorAll("title").forEach(title => title.remove());
      // The other side: the polyimide, shown where the view turns the copper side away (the top FPC from above).
      const back = boardBackSvg(board);
      if (back) {
        back.setAttribute("preserveAspectRatio", "none");
        back.append(svgEl("rect", {class: "taxel-field", x, y, width: w, height: h}));
      }
      const face = el("div", {className: "assembly-face"}, svg, backFace(back));
      const box = el("div", {className: `assembly-board ${className}`, "data-physical-side": board.physical_side, "data-role": board.role}, face);
      boardDepth(box, face, board, svg);
      Object.assign(box.style, {left: percent(place.left - minX, width), top: percent(place.top - minY, height), width: percent(place.width, width), height: percent(place.height, height)});
      return box;
    };
    const coin = coinPlane("stack-coin");
    Object.assign(coin.style, {left: percent(coinLeft, width), top: percent(coinTop, height), width: percent(coinSpan, width), height: percent(coinSpan, height)});
    const scene = el("div", {className: "assembly-scene"},
      el("div", {className: "assembly-camera"}, coin, boardBox(lower, lowerSvg, lowerPlace, "is-lower"), boardBox(upper, upperSvg, upperPlace, `is-upper flip-${axis}`)));
    scene.style.setProperty("--assembly-aspect", `${width.toFixed(6)} / ${height.toFixed(6)}`);
    scene.style.setProperty("--assembly-ratio", (width / height).toFixed(6));
    const grid = upper.grid_registration || {};
    const mirrored = axis === "y" ? "left to right" : "top to bottom";
    // Both pin-1 rings are drawn over both boards (drawPin1Rings), in screen pixels.
    target.replaceChildren(scene, svgEl("svg", {class: "pin1-overlay", "aria-hidden": "true", focusable: "false"}),
      el("p", {className: "assembly-caption", "aria-hidden": "true"}));
    // The two boards' keys stay in sight; the notes are folded under "About this view" (#assemblyMore).
    $("assemblyLegend").replaceChildren(
      el("span", {className: "assembly-key upper-key"}, `Top FPC · ${roleTitle(upper)} · upper · turned over about its tail axis (${axis.toUpperCase()}) · copper faces down · tail exits ${upper.tail.side} · pin 1 ${pin1Net(upper)} (teal ring)`),
      el("span", {className: "assembly-key lower-key"}, `Bottom FPC · ${roleTitle(lower)} · lower · face up · copper faces up · tail exits ${lower.tail.side} · pin 1 ${pin1Net(lower)} (orange ring)`),
      el("span", {className: "assembly-key coin-key"}, `Coin for scale on the table below the stack: ${COIN.name}, ${COIN.diameter_mm} mm`));
    $("assemblyNotes").replaceChildren(...[
      el("span", {className: "assembly-note"}, `Registered on the ${micrometres(fieldW)} × ${micrometres(fieldH)} mm taxel field (dashed outline; ${grid.rows} × ${grid.columns} taxels). Turning the top FPC over about its tail axis keeps its tail's exit side and mirrors the board ${mirrored} as seen from above. Exploded spacing is visual only; the boards carry no alignment features. Each pin-1 ring rounds its board's triangle past the tail's end; where the two would meet or one would take in the other board's triangle, they move apart, away from each other, each still round its own triangle's centre.`),
      rowBusNote(boards)].filter(Boolean));
    header.replaceChildren(`Top FPC (${upper.role}) upper, copper down · Bottom FPC (${lower.role}) lower, copper up`);
    setAssemblyMode(target.dataset.mode || "exploded");
  }
  function rowBusNote(boards) {
    // The diagonal Row bus (routing.row_sides): one outline for both boards down to their tail roots (construction.
    // row_bus.shared_outline_below_field_mm, a registration key), both tails leave on one side, stacked (the top FPC's tail over
    // the bottom FPC's where they meet; they part to their own connectors), and with both sides the Row pins fold (the
    // board's construction.row_bus and tail.row_contact_order; the tails' overlap is a registration key).
    const row = boards.find(board => board.role === "rows");
    const bus = row?.construction?.row_bus;
    if (!bus) return null;
    const registration = row.verification?.registration || {};
    const overlap = registration.tail_overlap_width_mm;
    const [upper, lower] = row.physical_side === "top" ? ["Row", "Column"] : ["Column", "Row"];
    const where = Number.isFinite(overlap) && overlap > 0 ? `, ${micrometres(overlap)} mm of their width on each other` : " where they meet";
    // Both tails leave the shared bottom edge, so equal lengths end together, their contacts in line (CAD mode's fit gives
    // them equal lengths, P5-diagonal-bus.md section 27.3; the form's own lengths may differ).
    const column = boards.find(board => board.role === "columns");
    const lengths = [row, column].map(board => Number(board?.tail?.bounds?.height));
    const longer = lengths.every(Number.isFinite) && Math.abs(lengths[0] - lengths[1]) > 1e-6 ? (lengths[0] > lengths[1] ? "Row" : "Column") : "";
    const ends = longer ? `, the ${longer} tail ${micrometres(Math.abs(lengths[0] - lengths[1]))} mm longer` : ", ending together, their contacts in line";
    // The Row nets by pin, from the pads (the scan order numbers the pins: reversed, pin 1 is the last contact).
    const order = rowPinOrder(row);
    const pins = shortList(order);
    const sides = bus.sides === "both" ? "both sides" : `the ${bus.sides} side`;
    // Where the Row tail lies (construction.row_bus.tail_position): centred under the field in every side mode, as the
    // Column tail (diagonal-bus/10).
    const position = bus.tail_position !== "centred" ? ""
      : bus.sides === "both" ? ", meet in a funnel into the Row tail centred under the field"
      : ", fan in under the field into the Row tail centred under it";
    const shared = Number.isFinite(bus.shared_outline_below_field_mm)
      ? `Both boards share one outline down to their tail roots (${micrometres(bus.shared_outline_below_field_mm)} mm below the taxel field), so they `
        + "align by their edges; only the tails differ. " : "";
    return el("span", {className: "assembly-note", id: "assemblyRowBus", "data-row-sides": bus.sides, "data-tail-position": bus.tail_position || "",
      "data-tails": bus.tails || "", "data-shared-outline": bus.shared_outline_below_field_mm ?? ""},
      `Diagonal Row bus (${bus.kind}, ${sides}): ${shared}The Row traces run beside the field${position}, and both tails leave ${row.tail.side}, `
      + `stacked: the ${upper} tail over the ${lower} tail${where}, both centred on the field${ends}; they part to their own connectors. `
      + `Row pins 1–${order.length}: ${pins}`
      + `${bus.sides === "both" ? " (folded: the odd rows from ROW_01's side, the even rows back from the other)" : ""}.`);
  }
  function rowPinOrder(board) {
    // The Row nets by connector pin, pin 1 first, from the board's connector pads.
    return (board?.layers?.top_copper?.pads || []).filter(pad => pad.kind === "connector_pad" && /^ROW_/.test(pad.net || ""))
      .sort((a, b) => a.pin - b.pin).map(pad => pad.net);
  }
  function shortList(items) {
    // "a, b, c, …, y, z" for a long list, every item when nothing would be left out.
    return items.length > 6 ? `${items.slice(0, 3).join(", ")}, …, ${items.slice(-2).join(", ")}` : items.join(", ");
  }
  function setAssemblyMode(mode) {
    const target = $("stackedPreview");
    target.dataset.mode = mode;
    target.classList.toggle("is-plan", mode === "plan");
    document.querySelectorAll("[data-assembly-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.assemblyMode === mode)));
    const caption = target.querySelector(".assembly-caption");
    if (caption) caption.textContent = mode === "plan" ? "Plan view · upper board mirrored and translucent, as seen through from above · dashed: taxel field" : "Exploded 3D registration review · visual spacing only · thickness at least 2 px";
    $("orbitHint").hidden = mode === "plan";
    sizePin1Rings(target);
  }
  function attachOrbit(target, {home = ORBIT_HOME, active, moved, rested}) {
    // Drag to turn a 3D view from ``home``: the stacked view's exploded camera, or a board card's oblique view.  The angles
    // are custom properties of the view, so they hold across new designs; while it turns ``moved`` runs (the stacked
    // view draws its rings where the boards now lie, drawPin1Rings), and ``rested`` once it rests (the rings placed
    // again, separatePin1Rings; an oblique view fits its pane again).
    let view = {...home};
    let drag = null;
    let frame = 0;
    const turn = (next, rest) => {
      view = {tilt: Math.min(ORBIT_TILT_MAX_DEG, Math.max(0, next.tilt)), spin: ((next.spin + 180) % 360 + 360) % 360 - 180};
      target.style.setProperty("--orbit-tilt", `${round6(view.tilt)}deg`);
      target.style.setProperty("--orbit-spin", `${round6(view.spin)}deg`);
      target.dataset.orbit = `${round6(view.tilt)},${round6(view.spin)}`;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (rest ? rested : moved)(target));
    };
    target.addEventListener("pointerdown", event => {
      if (!active() || event.button !== 0) return;
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, view};
      target.setPointerCapture(event.pointerId);
      target.classList.add("is-orbiting");
    });
    target.addEventListener("pointermove", event => {
      if (!drag || event.pointerId !== drag.id) return;
      turn({tilt: drag.view.tilt - (event.clientY - drag.y) * ORBIT_DEG_PER_PX, spin: drag.view.spin - (event.clientX - drag.x) * ORBIT_DEG_PER_PX}, false);
    });
    const stop = event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag = null;
      target.classList.remove("is-orbiting");
      turn(view, true);
    };
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
    target.addEventListener("dblclick", () => { if (active()) turn(home, true); });
    target.addEventListener("keydown", event => {
      const step = {ArrowLeft: [0, 1], ArrowRight: [0, -1], ArrowUp: [1, 0], ArrowDown: [-1, 0]}[event.key];
      if (!active() || !(step || event.key === "0") || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      turn(step ? {tilt: view.tilt + step[0] * ORBIT_KEY_DEG, spin: view.spin + step[1] * ORBIT_KEY_DEG} : home, true);
    });
  }

  // -- DRC panel -------------------------------------------------------------------------

  function unitOf(rule) { return COUNT_RULES.has(rule) ? "" : /_deg$/.test(rule) ? "°" : " mm"; }
  function quantity(number, rule) { return COUNT_RULES.has(rule) ? String(Math.round(number)) : `${fixed(number)}${unitOf(rule)}`; }
  function whereText(where) {
    if (where === null || where === undefined) return "";
    if (Array.isArray(where)) return where.map(item => (Array.isArray(item) ? `(${item.map(whereText).join(", ")})` : whereText(item))).join(" · ");
    if (typeof where === "object") return Object.entries(where).map(([key, item]) => `${key.replace(/_/g, " ")} ${whereText(item)}`).join(" · ");
    return typeof where === "number" ? String(round6(where)) : String(where);
  }
  function ruleName(rule) {
    // route_pad_clearance -> "Route–pad clearance"; *_deg rules carry their unit in the values.
    const text = String(rule).replace(/_deg$/, "").replace(/^(route|pad|electrode)_(route|pad|electrode|trace)_/, "$1–$2_");
    return capitalize(text.replace(/_/g, " "));
  }
  function drcRow(record) {
    const rule = String(record.rule);
    // measured_mm null: nothing within reach of the rule (containment checks measure nothing).
    const measured = Number.isFinite(record.measured_mm) ? quantity(record.measured_mm, rule)
      : record.required_mm === null ? "—" : "no pair within reach";
    const required = record.required_mm === null ? "inside (pass/fail)"
      : Number.isFinite(record.required_mm) ? `${record.comparison === "max<=" ? "≤" : "≥"} ${quantity(record.required_mm, rule)}` : "—";
    const passed = record.passed === true;
    const where = whereText(record.where);
    // route_route_clearance also holds the pairs with a wide tail piece to their own rule (the finger section).
    const finger = record.finger_section && typeof record.finger_section === "object" ? record.finger_section : null;
    const fingerLine = (number, prefix) => (finger && Number.isFinite(number) ? el("small", {className: "drc-where"}, `${prefix}${quantity(number, rule)} tail pieces`) : null);
    return el("tr", {className: passed ? "is-pass" : "is-fail", "data-rule": rule},
      el("th", {scope: "row"}, ruleName(rule), where ? el("small", {className: "drc-where"}, where) : null),
      el("td", {className: "num"}, measured, fingerLine(finger?.measured_mm, "")),
      el("td", {className: "num"}, required, fingerLine(finger?.required_mm, "≥ ")),
      el("td", {}, el("span", {className: `drc-badge ${passed ? "pass" : "fail"}`}, passed ? "PASS" : "FAIL"),
        passed ? null : el("small", {className: "drc-where"}, plural(Number(record.violation_count) || 0, "violation"))));
  }
  function registrationRow(record) {
    const deviations = [record.active_region_size_deviation_mm, record.row_grid_deviation_mm, record.column_grid_deviation_mm].filter(Number.isFinite);
    const measured = record.orthogonal === false ? "electrodes parallel" : deviations.length ? `${fixed(Math.max(...deviations))} mm` : "—";
    return el("tr", {className: record.passed ? "is-pass" : "is-fail", "data-rule": "registration"},
      el("th", {scope: "row"}, "Cross-board registration", el("small", {className: "drc-where"}, `row electrodes along ${record.row_electrode_axis} · column electrodes along ${record.column_electrode_axis}`)),
      el("td", {className: "num"}, measured),
      el("td", {className: "num"}, Number.isFinite(record.required_mm) ? `orthogonal · ≤ ${fixed(record.required_mm)} mm` : "orthogonal"),
      el("td", {}, el("span", {className: `drc-badge ${record.passed ? "pass" : "fail"}`}, record.passed ? "PASS" : "FAIL")));
  }
  function drcTable(key, board) {
    const verification = board?.verification;
    const records = Object.values(verification?.checks || {}).filter(record => record && typeof record === "object");
    if (!records.length) return el("p", {id: `drc-${key}`}, `${capitalize(key)} FPC: no DRC record was returned.`);
    const failed = records.filter(record => record.passed !== true).length;
    const rows = records.map(drcRow);
    if (verification.registration) rows.push(registrationRow(verification.registration));
    return el("table", {className: "drc-table", id: `drc-${key}`},
      el("caption", {}, `${roleTitle(board)} (${board.physical_side} of the stack) · `,
        el("span", {className: failed ? "drc-badge fail" : "drc-badge pass"}, failed ? `${failed} of ${records.length} rules fail` : `all ${records.length} rules pass`)),
      el("thead", {}, el("tr", {}, ...["Rule", "Measured", "Required", "Result"].map(name => el("th", {scope: "col"}, name)))),
      el("tbody", {}, rows));
  }
  function renderDrc(result) {
    $("drcTables").replaceChildren(
      ...BOARD_KEYS.map(key => drcTable(key, result.boards[key])),
      el("p", {className: "drc-note"}, "Measured is the board-wide minimum for ≥ rules and the maximum for ≤ rules. “No pair within reach”: no feature pair lies within the search reach of the rule, so it cannot be violated. “Inside” rules are containment checks counted as violations."));
    const verification = result.boards.row?.verification;
    $("drcMeta").textContent = verification ? `${verification.drc_version} · numeric tolerance ${verification.numeric_epsilon_mm} mm` : "";
    // The folded panel's one line: every check passing, or how many fail.  A failing build opens it, listing only the
    // failing rules ("Show all checks" lists the rest); a passing one leaves it as the user left it.
    const counts = BOARD_KEYS.map(key => {
      const board = result.boards[key];
      const records = Object.values(board?.verification?.checks || {}).filter(record => record && typeof record === "object");
      if (board?.verification?.registration && key === "row") records.push(board.verification.registration);
      return {total: records.length, failed: records.filter(record => record.passed !== true).length};
    });
    const total = counts.reduce((sum, count) => sum + count.total, 0);
    const failed = counts.reduce((sum, count) => sum + count.failed, 0);
    const panel = $("drcPanel");
    $("drcTotal").textContent = !total ? "" : failed ? `${failed} of ${total} checks fail` : `✓ all ${total} checks pass`;
    $("drcTotal").className = `drc-total ${failed ? "is-fail" : "is-pass"}`;
    panel.classList.toggle("only-failures", failed > 0);
    $("drcShowAll").hidden = !failed;
    if (failed) panel.open = true;
  }

  // -- downloads ---------------------------------------------------------------------------

  function saveBlob(name, blob) {
    const url = URL.createObjectURL(blob);
    const anchor = el("a", {href: url, download: name, hidden: true});
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function dispositionName(header) {
    const text = String(header || "");
    const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(text);
    let name = null;
    if (encoded) { try { name = decodeURIComponent(encoded[1].trim()); } catch (error) { name = null; } }
    name = name || /filename\s*=\s*"([^"]+)"/i.exec(text)?.[1] || /filename\s*=\s*([^;\s]+)/i.exec(text)?.[1] || null;
    return name ? name.replace(/[\\/]/g, "_") : null;
  }
  function exportFallbackName(kind, result) {
    const id = result.manifest.build_id;
    if (kind === "project") return `${id}-project-review.zip`;
    if (kind === "easyeda-pro") return `${id}-easyeda-pro.zip`;
    const side = kind.split("-")[0];
    const board = Object.values(result.boards).find(item => item.physical_side === side);
    return `${id}-${side}-${board?.role || "fpc"}-direct-gerber.zip`;
  }
  function downloadDocument(kind) {
    if (!downloadsReady()) return;
    const result = state.result; const id = result.manifest.build_id;
    const documents = {
      design: [`${id}-design.json`, result.design],
      // /api/generate does not repeat derived_layout; it is {format, units, boards}.
      layout: [`${id}-derived-layout.json`, {format: result.manifest.layout_format, units: "mm", boards: result.boards}],
      manifest: [`${id}-manifest.json`, result.manifest],
    };
    const [name, body] = documents[kind];
    saveBlob(name, new Blob([`${JSON.stringify(body, null, 2)}\n`], {type: "application/json"}));
    setStatus("ok", `Saved ${name} from build ${id}.`);
  }
  async function downloadExport(kind, label) {
    if (!downloadsReady()) return;
    const result = state.result; const id = result.manifest.build_id;
    // A build generated while the export runs keeps its own status and summary.
    const shown = () => state.result?.manifest?.build_id === id;
    setStatus("neutral", `Building the ${label} for build ${id}…`);
    try {
      const response = await post(`/api/export/${kind}`, result.design, label);
      if (!response.ok) {
        const data = await readJSON(response);
        // 422 E_EXPORT_BLOCKED carries the validation of the design the server rebuilt.
        if (data?.code === "E_EXPORT_BLOCKED" && data.validation && shown()) drawIssues(data.validation, null);
        throw requestError(response, data);
      }
      const served = response.headers.get("X-Build-Id");
      const name = dispositionName(response.headers.get("Content-Disposition")) || exportFallbackName(kind, result);
      saveBlob(name, await response.blob());
      if (served && served !== id) setStatus("warning", `Saved ${name}, but the server built ${served} instead of ${id}; regenerate before using it.`);
      else if (!shown()) setStatus("warning", `Saved ${name} from the previous build ${id}; the page now shows ${state.result ? `build ${state.result.manifest.build_id}` : "no build"}.`);
      else if (kind === "easyeda-pro") setStatus("ok", `Saved ${name} from build ${id}. Import each .epro2 into EasyEDA Pro and check FPC mode, the stiffener and DRC there (README_EASYEDA.txt).`);
      else setStatus("ok", `Saved ${name} from build ${id}. Direct Gerber packages still need a separate JLCPCB review before ordering.`);
    } catch (error) {
      setStatus("error", `Export failed${shown() ? "" : ` for the previous build ${id}`}: ${describe(error)}`);
    }
  }

  // -- tabs, events and start-up -------------------------------------------------------------

  function selectTab(tabs, selected) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.getAttribute("aria-controls")).hidden = !active;
    }
    const tools = $(`${selected.dataset.board}ZoomTools`);
    if (tools) tools.classList.toggle("is-inactive", selected.dataset.mode !== "2d");
    // Ring sizes and the oblique fit need the shown panel's layout.
    const panel = $(selected.getAttribute("aria-controls"));
    if (selected.dataset.mode === "2d") { updateZoomReadout(panel); sizePin1Rings(panel); } else fitOblique(panel);
  }
  function setupTabs() {
    document.querySelectorAll('[role="tablist"]').forEach(list => {
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      tabs.forEach(tab => {
        tab.addEventListener("click", () => selectTab(tabs, tab));
        tab.addEventListener("keydown", event => {
          const index = tabs.indexOf(tab);
          const next = {ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1}[event.key];
          if (next === undefined) return;
          event.preventDefault();
          const target = tabs[(next + tabs.length) % tabs.length];
          selectTab(tabs, target);
          target.focus();
        });
      });
      selectTab(tabs, tabs.find(tab => tab.getAttribute("aria-selected") === "true") || tabs[0]);
    });
  }
  function nudgeSizes(control) {
    // [arrow, Shift+arrow] step of a fine-step input: data-nudge (the trace fields: 1 mil) or the mm defaults.
    const fine = Number(control.dataset.nudge);
    return Number.isFinite(fine) && fine > 0 ? [fine, round6(4 * fine)] : [NUDGE_MM, COARSE_NUDGE_MM];
  }
  function nudge(control, direction, size) {
    // Arrow keys move mm inputs to the next multiple of the nudge size, inside the profile limits.
    const spec = specOf(control);
    const current = control.value.trim() === "" ? Number(spec?.default) : Number(control.value);
    if (!spec || !Number.isFinite(current)) return;
    const index = direction > 0 ? Math.floor(current / size + 1e-9) + 1 : Math.ceil(current / size - 1e-9) - 1;
    const next = round6(clamp(index * size, spec.minimum, spec.maximum));
    if (next === current) return;
    control.value = String(next);
    control.dispatchEvent(new Event("input", {bubbles: true}));
    control.dispatchEvent(new Event("change", {bubbles: true}));
  }
  function renderRules(rules) {
    $("lockedRules").replaceChildren(...Object.entries(rules || {}).flatMap(([key, text]) => [el("dt", {}, key), el("dd", {"data-rule": key}, String(text))]));
  }
  function renderTraceHint(rules) {
    // JLCPCB's trace minimum and the gold-finger width, as the profile's rule text words them.
    const minimum = rules?.["JLC trace minimum"]; const fingers = rules?.["Gold-finger traces"];
    if (minimum && fingers) $("traceHint").textContent = `JLCPCB minimum: ${minimum}. Gold fingers: ${fingers}.`;
  }
  function showBundle(design) {
    // "Bundle traces" (from /api/default: the default design) follows the generated design's routing.
    const routing = design?.routing; const node = $("lockedRules").querySelector('[data-rule="Bundle traces"]');
    if (!node || !Number.isFinite(routing?.trace_width_mm) || !Number.isFinite(routing?.trace_space_mm)) return;
    const {trace_width_mm: width, trace_space_mm: space} = routing;
    node.textContent = `${fixed(width)} / ${fixed(space)} mm width / spacing (pitch ${fixed(width + space)} mm)`;
  }
  function renderOrderRequirements(requirements) {
    // The manufacturing note lists the profile's JLCPCB order options and review
    // notes, the same entries as ORDER_NOTES.txt in every ZIP; no value is written here.
    const items = Array.isArray(requirements) ? requirements : [];
    const item = entry => el("li", {"data-requirement": entry.id},
      el("strong", {}, `${entry.topic}:`), ` ${entry.requirement}`, el("span", {className: "order-why"}, String(entry.reason)));
    $("orderOptions").replaceChildren(...items.filter(entry => entry.kind === "order_option").map(item));
    $("orderNotes").replaceChildren(...items.filter(entry => entry.kind === "review_note").map(item));
    if (!items.length) $("orderOptions").replaceChildren(el("li", {}, "/api/default sent no order requirements; see ORDER_NOTES.txt in each Gerber ZIP."));
  }

  // -- design templates (CAD mode, web/cad/main.js) ----------------------------------
  // The form's template is state.design.template_id: payload() sends it, so builtText and
  // the stale check include it.  Each template has its own defaults and profile (limits,
  // badge, rules, order notes) from /api/default?template=ID; when the server does not
  // serve it, the form keeps the default profile's limits and the server checks the rest.
  // Rectangular mode always uses the default template; CAD mode the template of the last
  // design it applied.  Events on document (detail.result is set to a Promise):
  //   "fpc:mode" {mode}; "fpc:template-info" {template_id} -> {template_id, limits, name, served};
  //   "fpc:apply-design" {design} -> {ok, problems, build_id}: checks the design against its
  //   template's limits before it touches the form, then sets the form and generates.
  const templates = new Map();
  const templateState = {defaultId: null, cadId: null, mode: "rect"};
  let defaultsDone;
  const defaultsLoaded = new Promise(resolve => { defaultsDone = resolve; });

  function templateEntry(id) {
    if (!templates.has(id)) {
      templates.set(id, (async () => {
        const base = await templates.get(templateState.defaultId);
        try {
          const response = await apiFetch(`/api/default?template=${encodeURIComponent(id)}`);
          const data = await readJSON(response);
          if (response.ok && data?.design?.template_id === id && data.profile?.limits) return {design: data.design, profile: data.profile, served: true};
        } catch (error) {
          // Not served: below.
        }
        return {design: {...base.design, template_id: id}, profile: {...base.profile, name: `Template ${id} · form limits of ${base.profile.id}`}, served: false};
      })());
    }
    return templates.get(id);
  }
  function useTemplate(id, entry) {
    if (state.design?.template_id === id) return;
    const kept = controls.map(control => [control, control.value]);
    state.design = entry.design;
    state.profile = entry.profile;
    applyLimits(entry.profile.limits);
    kept.forEach(([control, item]) => { control.value = item; });  // applyLimits resets the tail-side select
    renderOrderRequirements(entry.profile.order_requirements);
    $("templateNote").hidden = entry.served;
    $("templateNote").textContent = entry.served ? "" : `The form uses template ${id}, but this server did not send that template's profile: the form checks the limits and lists the rules of ${entry.profile.id}, and the server applies ${id}'s own rules when it validates and generates.`;
    // A masked field and the Row traces stay through a mode switch (CAD -> Rectangular -> CAD): formBody sends the
    // mask on the surface template only and the Row traces on both (routing.row_sides; "channel" the straight one).
    syncRowSides();
    showMaskNote();
    validateForm();
    if (state.result && !state.busy && payloadText() === state.builtText) applyServerMessages(state.result.validation, state.builtText);
    refreshControls();
    scheduleLiveValidation();
  }
  function syncTemplate() {
    const wanted = () => (templateState.mode === "cad" && templateState.cadId) || templateState.defaultId;
    if (!wanted() || state.design?.template_id === wanted()) return;
    const id = wanted();
    templateEntry(id).then(entry => { if (wanted() === id) useTemplate(id, entry); });
  }
  function limitProblems(design, limits) {
    // The single-field limits of the template (as the form's controls apply them), by design path: the straight Row
    // channel's own bounds (spec.channel) for a design whose routing.row_sides is "channel".
    const problems = [];
    const channel = design?.routing?.row_sides === "channel";
    for (const [path, entry] of Object.entries(limits || {})) {
      const item = path.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), design);
      const spec = entry && entry.channel && channel ? {...entry, ...entry.channel} : entry;
      if (typeof item !== "number" || !spec) continue;
      if (Number.isFinite(spec.minimum) && item < spec.minimum) problems.push(`${path} is ${item}, at least ${spec.minimum}`);
      if (Number.isFinite(spec.maximum) && item > spec.maximum) problems.push(`${path} is ${item}, at most ${spec.maximum}`);
    }
    return problems;
  }
  async function applyDesign(design) {
    if (!design || typeof design !== "object" || !(await defaultsLoaded)) return {ok: false, problems: ["the form is not ready"]};
    const id = typeof design.template_id === "string" ? design.template_id : templateState.defaultId;
    const entry = await templateEntry(id);
    const problems = limitProblems(design, entry.profile.limits);
    if (problems.length) return {ok: false, problems, served: entry.served};
    while (state.busy) await sleep(0.1);
    templateState.cadId = id;
    useTemplate(id, entry);
    setForm(design);
    // After setForm: the proposal's masked field (or none) goes with the form from here on.
    state.mask = design.matrix?.mask ?? null;
    state.maskIssues = [];
    state.maskCleared = "";
    showMaskNote();
    onFormEdit(null);
    if (!validateForm({focus: true})) {
      return {ok: false, problems: controls.filter(control => control.dataset.clientMessage).map(control => `${control.id}: ${control.dataset.clientMessage}`), served: entry.served};
    }
    await generate();
    return {ok: true, problems: [], build_id: state.result?.manifest?.build_id ?? null, served: entry.served};
  }
  function templateInfo(id) {
    return defaultsLoaded.then(ready => {
      if (!ready) throw new RequestError("E_CLIENT_CONTRACT", "The defaults did not load.");
      return templateEntry(typeof id === "string" ? id : templateState.defaultId);
    }).then(entry => ({template_id: entry.design.template_id, limits: entry.profile.limits, name: entry.profile.name, served: entry.served}));
  }

  async function boot() {
    try {
      if (window.apiBackend?.mode === "browser") setStatus("neutral", "Loading the generator into this browser (about 7 MB the first time; nothing is uploaded)…");
      const response = await apiFetch("/api/default");
      const data = await readJSON(response);
      if (!response.ok) throw requestError(response, data);
      if (!data?.design || !data?.profile) throw new RequestError("E_CLIENT_CONTRACT", "/api/default did not return {design, profile}.");
      state.design = data.design;
      state.profile = data.profile;
      applyLimits(data.profile.limits);
      setForm(data.design);
      syncRowSides();
      renderOrderRequirements(data.profile.order_requirements);
      templateState.defaultId = data.design.template_id;
      templates.set(data.design.template_id, Promise.resolve({design: data.design, profile: data.profile, served: true}));
      defaultsDone(true);
      validateForm();
      setStatus("neutral", "Defaults loaded. Generating both independent FPCs…");
      await generate();
    } catch (error) {
      defaultsDone(false);
      setStatus("error", `Could not start the local generator: ${describe(error)}`);
    }
  }

  form.addEventListener("submit", event => { event.preventDefault(); generate(); });
  form.addEventListener("input", event => onFormEdit(event.target));
  form.addEventListener("change", event => onFormEdit(event.target));
  form.addEventListener("keydown", event => {
    const control = event.target;
    if (!control.classList?.contains("fine-step") || !["ArrowUp", "ArrowDown"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const [fine, coarse] = nudgeSizes(control);
    nudge(control, event.key === "ArrowUp" ? 1 : -1, event.shiftKey ? coarse : fine);
  });
  $("regenerate").addEventListener("click", generate);
  // "Use the full field": drop the masked field of a CAD proposal (the form then builds rows × columns).
  $("clearMask").addEventListener("click", () => { clearMask("you chose the full field"); onFormEdit(null); });
  // CAD mode (web/cad/main.js): see "design templates" above.
  document.addEventListener("fpc:mode", event => { templateState.mode = event.detail?.mode === "cad" ? "cad" : "rect"; syncTemplate(); });
  document.addEventListener("fpc:template-info", event => { if (event.detail) event.detail.result = templateInfo(event.detail.template_id); });
  document.addEventListener("fpc:apply-design", event => { if (event.detail) event.detail.result = applyDesign(event.detail.design); });
  $("summary").addEventListener("click", event => {
    const target = event.target.closest("[data-target]");
    if (target) $(target.dataset.target)?.focus();
  });
  document.querySelectorAll("[data-download]").forEach(button => button.addEventListener("click", () => downloadDocument(button.dataset.download)));
  document.querySelectorAll("[data-export]").forEach(button => button.addEventListener("click", () => downloadExport(button.dataset.export, button.textContent.trim())));
  document.querySelectorAll("[data-assembly-mode]").forEach(button => button.addEventListener("click", () => setAssemblyMode(button.dataset.assemblyMode)));
  document.querySelectorAll("button[data-look]").forEach(button => button.addEventListener("click", () => setLook(button.dataset.look)));
  setLook(storedLook() || LOOKS[0], false);
  attachOrbit($("stackedPreview"), {
    active: () => $("stackedPreview").dataset.mode !== "plan" && Boolean($("stackedPreview").querySelector(".assembly-camera")),
    moved: drawPin1Rings, rested: sizePin1Rings,
  });
  document.querySelectorAll(".three-d-pane").forEach(pane => attachOrbit(pane, {
    home: OBLIQUE_HOME, active: () => Boolean(pane.querySelector(".oblique-board")), moved: () => {}, rested: fitOblique,
  }));
  $("drcShowAll").addEventListener("click", () => { $("drcPanel").classList.remove("only-failures"); $("drcShowAll").hidden = true; });
  window.addEventListener("resize", () => {
    zoomPanes.forEach(pane => { fitScene(pane); updateZoomReadout(pane); sizePin1Rings(pane); });
    document.querySelectorAll(".three-d-pane").forEach(fitOblique);
    sizePin1Rings($("stackedPreview"));
  });
  // The stacked view's canvas may change size without the window (the page's layout): its rings are placed and drawn
  // again, so the ones drawn over the boards stay on them.
  if (typeof ResizeObserver === "function") new ResizeObserver(() => sizePin1Rings($("stackedPreview"))).observe($("stackedPreview"));
  // A 2D view's window changes size with the page's layout too, and has none while hidden (its tab, CAD mode before a
  // build): its scene takes the window's shape whenever it changes (fitScene).
  if (typeof ResizeObserver === "function") {
    const panes = new ResizeObserver(entries => entries.forEach(entry => fitScene(entry.target)));
    zoomPanes.forEach(pane => panes.observe(pane));
  }
  zoomPanes.forEach(pane => { attachZoom(pane); updateZoomReadout(pane); });
  setupTabs();
  boot();
})();
