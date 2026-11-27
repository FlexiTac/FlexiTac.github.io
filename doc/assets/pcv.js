/* Visuo-tactile point cloud viewer (Tactile representation page).
   <div class="pcv" data-sample="/doc/assets/data/NAME" data-frame="K"> loads NAME.json + NAME.bin and shows one
   recorded demonstration: the camera's points and the pads' tactile points in 3D, the same pads as 2D maps, the
   joint positions and, if the data has them, the camera's RGB frames, all at one frame, with a time slider.

   NAME.bin, little-endian: camera points uint16 [frames][nPc][3], tactile points uint16 [frames][nTac][3] (both
   origin + value * unit, metres), readings uint8 [frames][nTac] (reading x 255), padding to 4 bytes, joints
   float32 [frames][joints]. Each pad's points are stored column by column: point i of a pad is taxel
   (row i % rows, column floor(i / rows)).
   NAME.json: frames, nPc, nTac, joints, unit, origin; optional rows/cols (default 12 x 32); optional
   camera {pos, target, fovy} (world frame, metres, degrees), which sets the starting view; optional
   rgb {src, cols, w, h}: an atlas of one tile per frame, row by row. */
(function () {
  "use strict";

  function css(el, name, fallback) {
    var v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
  }
  function rgb(c) {
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) { var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    m = /rgba?\(([^)]+)\)/.exec(c);
    if (m) { var p = m[1].split(","); return [+p[0], +p[1], +p[2]]; }
    return [128, 128, 128];
  }
  // viridis: purple for no contact, through blue and green, to yellow for the strongest reading
  var VIRIDIS = [[68, 1, 84], [71, 44, 122], [59, 81, 139], [44, 113, 142], [33, 144, 141],
                 [39, 173, 129], [92, 200, 99], [170, 220, 50], [253, 231, 37]];
  function viridis(t) {
    var x = Math.max(0, Math.min(1, t)) * (VIRIDIS.length - 1), i = Math.min(Math.floor(x), VIRIDIS.length - 2), f = x - i;
    var a = VIRIDIS[i], b = VIRIDIS[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function mount(host) {
    var src = host.dataset.sample, start = +(host.dataset.frame || 0);
    var labels = (host.dataset.pads || "Pad 1|Pad 2|Pad 3|Pad 4").split("|");
    var joints = (host.dataset.joints || "").split("|");

    // ---- DOM -------------------------------------------------------------------------------------
    var poster = host.querySelector("img");
    var stage = el("div", "pcv-stage");
    var cv = el("canvas", "pcv-3d");
    cv.tabIndex = 0;
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", host.dataset.label || "Point cloud");
    var hint = el("span", "pcv-hint", "Drag to turn");
    var legend = el("div", "pcv-legend",
      '<button type="button" class="pcv-chip" data-layer="cam" aria-pressed="true"><i class="pcv-dot cam"></i>Camera points</button>' +
      '<button type="button" class="pcv-chip" data-layer="tac" aria-pressed="true"><i class="pcv-dot tac"></i>Tactile points</button>' +
      '<button type="button" class="pcv-chip pcv-reset" hidden>Camera view</button>');
    var rgbBox = el("figure", "pcv-rgb");
    var rgbCv = el("canvas");
    rgbBox.append(rgbCv, el("figcaption", null, "Camera (RGB)"));
    rgbBox.hidden = true;
    stage.append(cv, rgbBox, hint, legend);

    var side = el("div", "pcv-side");
    var padsBox = el("div", "pcv-pads");
    var padFigs = labels.map(function (name) {
      var f = el("figure", "pcv-pad");
      var c = el("canvas");
      f.append(c, el("figcaption", null, name));
      padsBox.append(f);
      return c;
    });
    var stats = el("div", "pcv-stats");
    side.append(el("p", "pcv-h", "The same pads as 2D maps"), padsBox,
      el("p", "pcv-h", "What the policy gets: one cloud"), stats);
    var prop = el("div", "pcv-prop");
    var jointsBox = el("div", "pcv-joints");
    prop.append(el("p", "pcv-h", host.dataset.jointsTitle || "Proprioception: joint positions"), jointsBox);

    var bar = el("div", "pcv-bar");
    var play = el("button", "pcv-play");
    play.type = "button";
    play.setAttribute("aria-label", "Play");
    var range = el("input", "pcv-time");
    range.type = "range"; range.min = 0; range.step = 1;
    range.setAttribute("aria-label", "Frame");
    var tlabel = el("span", "pcv-t");
    bar.append(play, range, tlabel);

    var body = el("div", "pcv-body");
    body.append(stage, side);
    host.append(body, prop, bar);

    // ---- data -------------------------------------------------------------------------------------
    var meta, F, P, T, J, ROWS, COLS, U, O, cam, tac, rd, js, rmax = 255, atlas = null;
    // view: an orbit camera around `target`, at distance `dist`; yaw about z (up), pitch above level
    var target = [0, 0, 0], dist = 1, yaw = 0, pitch = 0.5, fovy = 35, home = null;
    var frame = 0, show = { cam: true, tac: true }, playing = false, timer = 0;

    Promise.all([
      fetch(src + ".json").then(function (r) { return r.json(); }),
      fetch(src + ".bin").then(function (r) { return r.arrayBuffer(); })
    ]).then(function (res) {
      meta = res[0];
      var buf = res[1];
      F = meta.frames; P = meta.nPc; T = meta.nTac; J = meta.joints || 16;
      ROWS = meta.rows || 12; COLS = meta.cols || 32; U = meta.unit; O = meta.origin;
      var off = 0;
      cam = new Uint16Array(buf, off, F * P * 3); off += F * P * 3 * 2;
      tac = new Uint16Array(buf, off, F * T * 3); off += F * T * 3 * 2;
      rd = new Uint8Array(buf, off, F * T); off += F * T;
      off = Math.ceil(off / 4) * 4;
      js = new Float32Array(buf, off, F * J);
      // colours run up to the strongest reading in the sample, so a simulator that peaks below 1 still shows clearly
      rmax = 1;
      for (var ri = 0; ri < rd.length; ri++) if (rd[ri] > rmax) rmax = rd[ri];
      padFigs.forEach(function (c) { c.width = COLS * 4; c.height = ROWS * 4; });

      if (meta.camera) {
        var c = meta.camera, d = [c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]];
        dist = Math.hypot(d[0], d[1], d[2]);
        home = { target: c.target.slice(), dist: dist, yaw: Math.atan2(d[1], d[0]), pitch: Math.asin(d[2] / dist), fovy: c.fovy || 45 };
        legend.querySelector(".pcv-reset").hidden = false;
      } else {
        // no camera: look at the middle of every frame's points, from data-view "yaw,pitch[,zoom]"
        var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
        [cam, tac].forEach(function (a) {
          for (var i = 0; i < a.length; i += 3) for (var k = 0; k < 3; k++) {
            if (a[i + k] < lo[k]) lo[k] = a[i + k];
            if (a[i + k] > hi[k]) hi[k] = a[i + k];
          }
        });
        var v = (host.dataset.view || "0.5,0.6,1").split(",").map(Number);
        var span = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * U;
        home = {
          target: [0, 1, 2].map(function (k) { return O[k] + (lo[k] + hi[k]) / 2 * U; }),
          dist: span * 2.4 / (v[2] || 1), yaw: v[0], pitch: v[1], fovy: 35
        };
      }
      resetView();
      if (meta.rgb) {
        atlas = new Image();
        atlas.onload = function () { rgbBox.hidden = false; drawRgb(); };
        atlas.src = meta.rgb.src;
      }
      range.max = F - 1;
      frame = Math.min(Math.max(0, start), F - 1);
      range.value = frame;
      buildJoints();
      var fmt = function (n) { return n.toLocaleString("en-US"); };
      stats.innerHTML =
        '<div class="pcv-row"><i class="pcv-dot cam"></i><span class="pcv-n">' + fmt(P) + ' ×</span><code>[x, y, z, 0, 0]</code></div>' +
        '<div class="pcv-row"><i class="pcv-dot tac"></i><span class="pcv-n">' + fmt(T) + ' ×</span><code>[x, y, z, reading, 1]</code></div>' +
        '<div class="pcv-row pcv-sum"><span class="pcv-n">= ' + fmt(P + T) + ' points</span><span>+ ' + J + ' joint positions</span></div>';
      host.classList.add("ready");
      if (poster) poster.hidden = true;
      draw();
    }).catch(function () { host.classList.add("failed"); });

    function resetView() {
      target = home.target.slice(); dist = home.dist; yaw = home.yaw; pitch = home.pitch; fovy = home.fovy;
    }

    // ---- joints panel -----------------------------------------------------------------------------
    var jrows = [];
    function buildJoints() {
      // joint names "Left arm: waist" etc. are grouped per arm (one column each) by the text before ":"
      var group = null, col = jointsBox;
      for (var j = 0; j < J; j++) {
        var name = joints[j] || "Joint " + (j + 1);
        var parts = name.split(":");
        if (parts.length > 1 && parts[0] !== group) {
          group = parts[0];
          col = el("div", "pcv-jcol");
          col.append(el("p", "pcv-jgroup", group));
          jointsBox.append(col);
        }
        var row = el("div", "pcv-j", '<span class="pcv-jn">' + (parts[1] || parts[0]).trim() + '</span><span class="pcv-jt"><i></i></span><span class="pcv-jv"></span>');
        col.append(row);
        jrows.push({ bar: row.querySelector("i"), val: row.querySelector(".pcv-jv") });
      }
    }

    // ---- drawing ----------------------------------------------------------------------------------
    function drawRgb() {
      if (!atlas || !atlas.complete || !meta.rgb) return;
      var r = meta.rgb, tw = r.w, th = r.h;
      if (rgbCv.width !== tw) { rgbCv.width = tw; rgbCv.height = th; }
      var sx = (frame % r.cols) * tw, sy = Math.floor(frame / r.cols) * th;
      rgbCv.getContext("2d").drawImage(atlas, sx, sy, tw, th, 0, 0, tw, th);
    }

    function draw() {
      if (!meta) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      }
      var g = cv.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      var camC = rgb(css(host, "--pcv-cam", "#5d6b80"));

      // camera basis: eye on a sphere around the target, z up
      var cp = Math.cos(pitch), ex = target[0] + dist * cp * Math.cos(yaw), ey = target[1] + dist * cp * Math.sin(yaw), ez = target[2] + dist * Math.sin(pitch);
      var fx = target[0] - ex, fy = target[1] - ey, fz = target[2] - ez, fl = Math.hypot(fx, fy, fz);
      fx /= fl; fy /= fl; fz /= fl;
      var rx = fy, ry = -fx, rl = Math.hypot(rx, ry) || 1;          // right = forward x up(0,0,1)
      rx /= rl; ry /= rl;
      var ux = ry * fz, uy = -rx * fz, uz = rx * fy - ry * fx;          // up = right x forward
      var foc = (h / 2) / Math.tan(fovy * Math.PI / 360);

      var pts = [];
      function push(a, i, kind, r) {
        var x = O[0] + a[i] * U - ex, y = O[1] + a[i + 1] * U - ey, z = O[2] + a[i + 2] * U - ez;
        var zc = x * fx + y * fy + z * fz;
        if (zc < 0.02) return;
        pts.push({ x: w / 2 + (x * rx + y * ry) / zc * foc, y: h / 2 - (x * ux + y * uy + z * uz) / zc * foc, d: zc, k: kind, r: r });
      }
      var b;
      if (show.cam) { b = frame * P * 3; for (var i = 0; i < P; i++) push(cam, b + i * 3, 0, 0); }
      if (show.tac) { b = frame * T * 3; for (var t = 0; t < T; t++) push(tac, b + t * 3, 1, rd[frame * T + t] / rmax); }
      pts.sort(function (p, q) { return q.d - p.d; });     // far first
      var s0 = Math.max(0.6, Math.min(1.6, foc * 0.0022));  // point size follows the zoom
      for (var n = 0; n < pts.length; n++) {
        var p = pts[n], c, a, rad, k = s0 * Math.min(1.6, Math.max(0.6, dist / p.d));
        if (p.k === 0) { c = camC; a = 0.85; rad = 1.9 * k; }
        else if (p.r > 0.02) { c = viridis(p.r); a = 1; rad = (1.7 + 1.6 * p.r) * k; }
        else { c = VIRIDIS[0]; a = 0.55; rad = 1.05 * k; }
        if (p.k !== 0) c = [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
        g.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
        g.beginPath(); g.arc(p.x, p.y, rad, 0, 6.2832); g.fill();
      }

      // 2D maps
      padFigs.forEach(function (c, k) {
        var x2 = c.getContext("2d"), cs = 4;
        for (var col = 0; col < COLS; col++) for (var row = 0; row < ROWS; row++) {
          var m = Math.min(1, rd[frame * T + k * ROWS * COLS + col * ROWS + row] / rmax);
          var vc = viridis(m);
          x2.fillStyle = "rgb(" + Math.round(vc[0]) + "," + Math.round(vc[1]) + "," + Math.round(vc[2]) + ")";
          x2.fillRect(col * cs, row * cs, cs, cs);
        }
      });

      // joints: bars centred at 0; the values are scaled to -1..1 (data-joint-scale overrides)
      var jscale = +(host.dataset.jointScale || 1);
      for (var j = 0; j < jrows.length; j++) {
        var v = js[frame * J + j], f = Math.max(-1, Math.min(1, v / jscale));
        var jb = jrows[j].bar.style;
        jb.left = (f < 0 ? 50 + f * 50 : 50) + "%";
        jb.width = Math.abs(f) * 50 + "%";
        jrows[j].val.textContent = (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);
      }
      drawRgb();
      tlabel.textContent = meta.hz ? (frame / meta.hz).toFixed(2) + " s · " + (frame + 1) + " / " + F : "Frame " + (frame + 1) + " / " + F;
    }

    // ---- interaction ------------------------------------------------------------------------------
    var drag = null;
    function turned() { host.classList.add("turned"); }
    cv.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch };
      cv.setPointerCapture(e.pointerId);
      turned();
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drag) return;
      yaw = drag.yaw - (e.clientX - drag.x) * 0.008;
      pitch = Math.max(-0.15, Math.min(1.5, drag.pitch + (e.clientY - drag.y) * 0.006));
      draw();
    });
    function end() { drag = null; }
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("dblclick", function () { resetView(); draw(); });
    cv.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key];
      if (!d) return;
      e.preventDefault();
      yaw += d[0]; pitch = Math.max(-0.15, Math.min(1.5, pitch + d[1]));
      turned();
      draw();
    });
    legend.addEventListener("click", function (e) {
      var b = e.target.closest(".pcv-chip");
      if (!b) return;
      if (b.classList.contains("pcv-reset")) { resetView(); draw(); return; }
      var on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      show[b.dataset.layer] = on;
      draw();
    });
    range.addEventListener("input", function () { frame = +range.value; draw(); });
    function setPlaying(on) {
      playing = on;
      play.classList.toggle("on", on);
      play.setAttribute("aria-label", on ? "Pause" : "Play");
      clearInterval(timer);
      if (on) timer = setInterval(function () {
        frame = (frame + 1) % F;
        range.value = frame;
        draw();
      }, +(host.dataset.interval || (meta.hz ? 1000 / meta.hz : 200)));
    }
    play.addEventListener("click", function () { if (meta) setPlaying(!playing); });
    // pause when scrolled away
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (!es[0].isIntersecting && playing) setPlaying(false); }).observe(host);
    }
    window.addEventListener("resize", draw);
    // redraw when the theme changes (the colours come from CSS)
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
  }

  function init() {
    var hosts = document.querySelectorAll(".pcv[data-sample]");
    if (!hosts.length) return;
    if (!("IntersectionObserver" in window)) { hosts.forEach(mount); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } });
    }, { rootMargin: "300px 0px" });
    hosts.forEach(function (h) { io.observe(h); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
