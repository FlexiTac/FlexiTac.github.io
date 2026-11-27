/* Gold fingers in an FFC extender (Troubleshooting page).
   <div class="ffc"></div> becomes a schematic top view: the sensor's 12 gold fingers go into a 20-pin, 0.5 mm
   pitch extender, which carries each contact straight across to a 16-pin cable. Two buttons replay the
   insertion straight and against one side of the opening, or skewed. Which finger touches which contact is
   worked out from the drawing's own geometry, so the result shown always matches the picture.
   Units are millimetres; x runs in the direction of insertion, y across the pins. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var P = 0.5, N = 20, C = 0.15, NF = 12, NW = 16;      // pitch, contacts, wall clearance, fingers, cable wires
  var OPEN = N * P + 2 * C, WF = NF * P + 2 * C, WC = NW * P + 2 * C;
  var DEPTH = 3.2, FRONT = 2.9, TOUCH = [0.95, 1.05];    // connector depth, seated front edge, spring contact point
  var PAD = [-3.0, -0.15], PADW = 0.32, CONW = 0.2, TAIL = 16;
  var BOARD = 9.6, BOARD_H = 16.6;                       // Adafruit 5203: 16.6 x 9.6 mm
  var SKEW = 16, SKEW_D = 0.44;                          // exaggerated for clarity
  var VB = [-8.6, -4.1, 26.2, 18.6];

  function yc(i) { return C + (i + 0.5) * P; }           // contact i, and cable wire i, from the top wall
  function vf(j) { return C + (j + 0.5) * P - WF / 2; }  // finger j, across the finger from its centre line
  function s(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function ease(t) { t = Math.max(0, Math.min(1, t)); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function seated(mode) {
    if (mode === "skew") {
      var a = SKEW * Math.PI / 180;
      return { x: FRONT - Math.abs(WF / 2 * Math.sin(a)), y: WF / 2 + SKEW_D, a: SKEW };
    }
    return { x: FRONT, y: WF / 2, a: 0 };
  }

  // Which contacts each finger touches at a pose: sample each spring's contact point in the finger's frame.
  function contacts(pose) {
    var a = pose.a * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), tol = (PADW + CONW) / 2;
    var byFinger = [], byContact = [];
    for (var j = 0; j < NF; j++) byFinger.push([]);
    for (var i = 0; i < N; i++) {
      byContact.push([]);
      for (var k = 0; k <= 20; k++) {
        var dx = TOUCH[0] + (TOUCH[1] - TOUCH[0]) * k / 20 - pose.x, dy = yc(i) - pose.y;
        var u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
        if (u < PAD[0] || u > PAD[1]) continue;
        for (j = 0; j < NF; j++) {
          if (Math.abs(v - vf(j)) < tol && byContact[i].indexOf(j) < 0) { byContact[i].push(j); byFinger[j].push(i); }
        }
      }
    }
    // fingers joined through a shared contact are one electrical node
    var group = []; for (j = 0; j < NF; j++) group.push(j);
    function root(j) { while (group[j] !== j) j = group[j]; return j; }
    byContact.forEach(function (fs) { for (var m = 1; m < fs.length; m++) group[root(fs[m])] = root(fs[0]); });
    var size = {}; for (j = 0; j < NF; j++) size[root(j)] = (size[root(j)] || 0) + 1;
    return { byFinger: byFinger, byContact: byContact, root: root, size: size };
  }

  function list(nums) {
    nums = nums.map(function (n) { return n + 1; });
    return nums.length < 3 ? nums.join(" and ") : nums.slice(0, -1).join(", ") + " and " + nums[nums.length - 1];
  }

  function describe(r) {
    var out = [], shorts = [], open = [], moved = [];
    var seen = {};
    for (var j = 0; j < NF; j++) {
      var g = r.root(j);
      if (r.size[g] > 1 && !seen[g]) {
        seen[g] = 1;
        var fs = [], shared = [];
        for (var k = 0; k < NF; k++) if (r.root(k) === g) fs.push(k);
        r.byContact.forEach(function (f, i) { if (f.length > 1 && r.root(f[0]) === g) shared.push(i); });
        shorts.push({ fs: fs, shared: shared });
      } else if (!r.byFinger[j].length) open.push(j);
      else if (r.size[g] === 1 && (r.byFinger[j].length > 1 || r.byFinger[j][0] !== j)) moved.push(j);
    }
    if (!shorts.length && !open.length && !moved.length) {
      return { ok: true, text: "Each of the 12 gold fingers rests on its own contact, and the extender carries each one " +
        "straight across to its own wire in the cable: 12 lines, one path each." };
    }
    shorts.forEach(function (sh) {
      out.push("Fingers " + list(sh.fs) + " both touch contact " + list(sh.shared) + ", so lines " + list(sh.fs) +
        " are shorted: a press on either line shows up on both, like the two patches in the video.");
    });
    if (moved.length) out.push("Finger" + (moved.length > 1 ? "s " : " ") + list(moved) + " land" + (moved.length > 1 ? "" : "s") + " on the wrong contact.");
    if (open.length) out.push("Finger" + (open.length > 1 ? "s " : " ") + list(open) + " touch" + (open.length > 1 ? "" : "es") + " no contact, so " + (open.length > 1 ? "those lines read" : "that line reads") + " nothing.");
    return { ok: false, text: out.join(" ") };
  }

  function mount(host) {
    host.textContent = "";
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    var bar = document.createElement("div"); bar.className = "ffc-bar";
    var modes = document.createElement("div"); modes.className = "ffc-modes";
    modes.setAttribute("role", "group"); modes.setAttribute("aria-label", "How the gold fingers go in");
    var btn = {};
    [["edge", "Straight, against one side"], ["skew", "Skewed"]].forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = m[1]; b.dataset.mode = m[0];
      b.addEventListener("click", function () { play(m[0]); });
      modes.appendChild(b); btn[m[0]] = b;
    });
    var replay = document.createElement("button");
    replay.type = "button"; replay.className = "ffc-replay"; replay.textContent = "Replay";
    replay.addEventListener("click", function () { play(mode); });
    bar.appendChild(modes); bar.appendChild(replay);

    var stage = document.createElement("div"); stage.className = "ffc-stage";
    var svg = s("svg", { viewBox: VB.join(" "), role: "img", "aria-label":
      "Top view of the sensor's 12 gold fingers going into a 20-pin extender, whose contacts run straight across to a 16-pin cable" });
    stage.appendChild(svg);

    // board, cable and connectors
    var by = OPEN / 2 - BOARD_H / 2;
    s("rect", { x: 0, y: by, width: BOARD, height: BOARD_H, rx: .5, "class": "ffc-board" }, svg);
    var traces = [], wires = [], cons = [], dots = [], rcons = [];
    for (var i = 0; i < N; i++) traces.push(s("line", { x1: DEPTH - .2, x2: BOARD - DEPTH + .2, y1: yc(i), y2: yc(i), "class": "ffc-trace" }, svg));
    var cable = s("g", { "class": "ffc-cable" }, svg);
    s("rect", { x: BOARD - FRONT, y: 0, width: VB[0] + VB[2] - BOARD + FRONT + 1, height: WC, "class": "ffc-cable-base" }, cable);
    for (i = 0; i < NW; i++) wires.push(s("line", { x1: BOARD - FRONT + .15, x2: VB[0] + VB[2] + 1, y1: yc(i), y2: yc(i), "class": "ffc-wire" }, cable));
    [0, BOARD - DEPTH].forEach(function (x0, side) {
      s("rect", { x: x0, y: -.7, width: DEPTH, height: OPEN + 1.4, rx: .2, "class": "ffc-housing" }, svg);
      s("rect", { x: x0 + .5, y: -1.25, width: DEPTH - 1, height: .55, rx: .12, "class": "ffc-ear" }, svg);
      s("rect", { x: x0 + .5, y: OPEN + .7, width: DEPTH - 1, height: .55, rx: .12, "class": "ffc-ear" }, svg);
    });
    var finger = s("g", { "class": "ffc-finger" }, svg);
    s("rect", { x: -TAIL, y: -WF / 2, width: TAIL, height: WF, rx: .15, "class": "ffc-fpc" }, finger);
    var pads = [];
    for (var j = 0; j < NF; j++) {
      s("line", { x1: -TAIL, x2: PAD[0], y1: vf(j), y2: vf(j), "class": "ffc-fpc-trace" }, finger);
      pads.push(s("rect", { x: PAD[0], y: vf(j) - PADW / 2, width: PAD[1] - PAD[0], height: PADW, rx: .05, "class": "ffc-pad" }, finger));
    }
    // springs sit above the fingers (contacts face up)
    for (i = 0; i < N; i++) {
      cons.push(s("line", { x1: .45, x2: DEPTH - .2, y1: yc(i), y2: yc(i), "class": "ffc-con" }, svg));
      rcons.push(s("line", { x1: BOARD - DEPTH + .2, x2: BOARD - .45, y1: yc(i), y2: yc(i), "class": "ffc-con" }, svg));
      dots.push(s("circle", { cx: (TOUCH[0] + TOUCH[1]) / 2, cy: yc(i), r: .13, "class": "ffc-dot" }, svg));
    }
    var wall = s("line", { x1: 0, x2: DEPTH, y1: 0, y2: 0, "class": "ffc-wall" }, svg);
    var guide = s("line", { x1: -7.6, x2: 0, y1: 0, y2: 0, "class": "ffc-guide" }, svg);
    var guideText = s("text", { x: -7.6, y: -.55, "class": "ffc-note" }, svg);
    guideText.textContent = "Against this side";
    var rings = s("g", { "class": "ffc-rings" }, svg);
    var shortText = s("text", { x: -.2, y: OPEN + 2.55, "class": "ffc-note bad", "text-anchor": "end" }, svg);
    shortText.textContent = "Short";

    var labels = document.createElement("div"); labels.className = "ffc-labels";
    labels.innerHTML = "<span>Sensor: 12 gold fingers</span><span>20-pin extender</span><span>16-pin cable to the reading board</span>";
    labels.style.gridTemplateColumns = (0 - VB[0]) + "fr " + BOARD + "fr " + (VB[0] + VB[2] - BOARD) + "fr";
    var status = document.createElement("p"); status.className = "ffc-status"; status.setAttribute("aria-live", "polite");

    host.appendChild(bar); host.appendChild(stage); host.appendChild(labels); host.appendChild(status);

    function setPose(p) { finger.setAttribute("transform", "translate(" + p.x.toFixed(3) + " " + p.y.toFixed(3) + ") rotate(" + p.a.toFixed(2) + ")"); }

    function light(r) {
      var res = describe(r);
      while (rings.firstChild) rings.removeChild(rings.firstChild);
      var bad = false;
      for (var i = 0; i < N; i++) {
        var fs = r.byContact[i], st = !fs.length ? "" : r.size[r.root(fs[0])] > 1 ? "bad" : "ok";
        [cons[i], rcons[i], traces[i], dots[i]].concat(i < NW ? [wires[i]] : []).forEach(function (e) {
          e.classList.toggle("ok", st === "ok"); e.classList.toggle("bad", st === "bad");
        });
        if (fs.length > 1) {
          bad = true;
          s("circle", { cx: (TOUCH[0] + TOUCH[1]) / 2, cy: yc(i), r: .55, "class": "ffc-ring" }, rings);
          s("line", { x1: (TOUCH[0] + TOUCH[1]) / 2 - .3, y1: yc(i) + .45, x2: -.1, y2: OPEN + 1.95, "class": "ffc-lead" }, rings);
        }
      }
      for (var j = 0; j < NF; j++) {
        pads[j].classList.toggle("bad", r.size[r.root(j)] > 1);
        pads[j].classList.toggle("open", !r.byFinger[j].length);
      }
      shortText.style.display = bad ? "" : "none";
      host.classList.add("lit");
      status.textContent = res.text;
      status.classList.toggle("bad", !res.ok);
    }

    var mode = "edge", raf = 0;
    function play(m) {
      mode = m;
      Object.keys(btn).forEach(function (k) { btn[k].setAttribute("aria-pressed", String(k === m)); });
      host.classList.remove("lit");
      host.classList.toggle("is-skew", m === "skew");
      while (rings.firstChild) rings.removeChild(rings.firstChild);
      shortText.style.display = "none";
      pads.forEach(function (p) { p.classList.remove("bad", "open"); });
      status.classList.remove("bad");
      status.textContent = m === "edge" ? "Line the fingers up with one side of the opening, then push them straight in…"
                                        : "The fingers go in at an angle…";
      cancelAnimationFrame(raf);
      var end = seated(m), a = end.a * Math.PI / 180, back = 4.6;
      var from = m === "skew" ? { x: end.x - back * Math.cos(a), y: end.y - back * Math.sin(a), a: end.a }
                              : { x: FRONT - back, y: end.y + 1.5, a: 0 };
      wall.classList.toggle("on", m === "edge"); guide.classList.toggle("on", m === "edge"); guideText.classList.toggle("on", m === "edge");
      if (reduce) { setPose(end); light(contacts(end)); return; }
      // straight: slide across against the side, then push in; skewed: push in along the finger's own axis
      var t0 = performance.now(), slide = m === "edge" ? 550 : 0, push = 900;
      (function step(now) {
        var t = Math.max(0, now - t0), p;     // a frame's timestamp can be a little older than t0
        if (m === "edge") {
          p = t < slide ? { x: from.x, y: from.y + (end.y - from.y) * ease(t / slide), a: 0 }
                        : { x: from.x + (end.x - from.x) * ease((t - slide) / push), y: end.y, a: 0 };
        } else {
          var k = ease(t / push);
          p = { x: from.x + (end.x - from.x) * k, y: from.y + (end.y - from.y) * k, a: end.a };
        }
        setPose(p);
        if (t < slide + push) raf = requestAnimationFrame(step);
        else light(contacts(end));
      })(t0);
    }

    // start seated and straight; the first time it scrolls into view, play the straight insertion
    setPose(seated("edge"));
    btn.edge.setAttribute("aria-pressed", "true"); btn.skew.setAttribute("aria-pressed", "false");
    wall.classList.add("on"); guide.classList.add("on"); guideText.classList.add("on");
    light(contacts(seated("edge")));
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); play("edge"); }
      }, { threshold: .6 });
      io.observe(stage);
    }
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll(".ffc"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
