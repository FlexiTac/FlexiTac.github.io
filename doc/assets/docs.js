/* FlexiTac Docs — page behaviour. No dependencies; every feature degrades to plain links. */
(function () {
  "use strict";
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* Theme: auto -> light -> dark -> auto ---------------------------------------------------- */
  var themeBtn = document.querySelector("[data-theme-toggle]");
  function applyTheme(t) {
    if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
    if (themeBtn) {
      var label = "Theme: " + (t || "auto") + " (click to change)";
      themeBtn.setAttribute("aria-label", label);
      themeBtn.title = label;
    }
  }
  applyTheme(store.get("ft-docs-theme"));
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var cur = root.dataset.theme || "auto";
    var next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    store.set("ft-docs-theme", next);
    applyTheme(next === "auto" ? null : next);
  });

  /* Mobile sidebar --------------------------------------------------------------------------- */
  var menuBtn = document.querySelector("[data-menu]");
  var scrim = document.querySelector("[data-scrim]");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (scrim) scrim.hidden = !open;
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setNav(false); if (menuBtn) menuBtn.focus(); }
  });
  var current = document.querySelector('.sidebar [aria-current="page"]');
  if (current && current.scrollIntoView) {
    var sb = document.querySelector(".sidebar");
    var r = current.getBoundingClientRect();
    if (sb && r.bottom > window.innerHeight - 40) sb.scrollTop = r.top - window.innerHeight / 2;
  }

  /* Copy buttons ----------------------------------------------------------------------------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.parentNode.querySelector("pre code");
      if (!code) return;
      var text = code.innerText.replace(/\n$/, "");
      var done = function () {
        btn.classList.add("done");
        btn.setAttribute("aria-label", "Copied");
        setTimeout(function () { btn.classList.remove("done"); btn.setAttribute("aria-label", "Copy code"); }, 1600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  });
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Tabs (synced by data-sync + label, remembered per sync key) ----------------------------- */
  var tabSets = Array.prototype.slice.call(document.querySelectorAll(".tabs"));
  function selectTab(set, idx, focus) {
    var tabs = set.querySelectorAll(':scope > [role="tablist"] > [role="tab"]');
    var panels = set.querySelectorAll(':scope > [role="tabpanel"]');
    tabs.forEach(function (t, i) {
      var on = i === idx;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
      if (on && focus) t.focus();
    });
  }
  function selectByLabel(sync, label, except) {
    tabSets.forEach(function (set) {
      if (set === except || set.dataset.sync !== sync) return;
      var tabs = set.querySelectorAll(':scope > [role="tablist"] > [role="tab"]');
      tabs.forEach(function (t, i) { if (t.dataset.label === label) selectTab(set, i, false); });
    });
  }
  tabSets.forEach(function (set) {
    var tabs = Array.prototype.slice.call(set.querySelectorAll(':scope > [role="tablist"] > [role="tab"]'));
    var sync = set.dataset.sync;
    if (sync) {
      var saved = store.get("ft-docs-tab:" + sync);
      tabs.forEach(function (t, i) { if (t.dataset.label === saved) selectTab(set, i, false); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        var top = t.getBoundingClientRect().top;
        selectTab(set, i, false);
        if (sync) {
          store.set("ft-docs-tab:" + sync, t.dataset.label);
          selectByLabel(sync, t.dataset.label, set);
          window.scrollBy(0, t.getBoundingClientRect().top - top); /* keep the clicked tab still */
        }
      });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = tabs.length, j = null;
        if (k === "ArrowRight") j = (i + 1) % n;
        else if (k === "ArrowLeft") j = (i - 1 + n) % n;
        else if (k === "Home") j = 0;
        else if (k === "End") j = n - 1;
        if (j !== null) { e.preventDefault(); selectTab(set, j, true); tabs[j].click(); }
      });
    });
  });

  /* On-this-page scrollspy ------------------------------------------------------------------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a, .mtoc a"));
  var mtocCur = document.querySelector(".mtoc-cur");
  var mtoc = document.querySelector(".mtoc");
  var targets = [];
  var seen = {};
  tocLinks.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (seen[id]) return;
    var el = document.getElementById(id);
    if (el) { targets.push({ id: id, el: el, text: a.textContent }); seen[id] = 1; }
  });
  function spy() {
    if (!targets.length) return;
    var offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 80;
    var active = targets[0];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].el.getBoundingClientRect().top - offset - 24 <= 0) active = targets[i]; else break;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = targets[targets.length - 1];
    tocLinks.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + active.id;
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    if (mtocCur) mtocCur.textContent = active.text;
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { spy(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();
  if (mtoc) mtoc.addEventListener("click", function (e) { if (e.target.tagName === "A") mtoc.open = false; });

  /* Lightbox for figures ---------------------------------------------------------------------- */
  var lb = null;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.zoom");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || typeof HTMLDialogElement === "undefined") return;
    e.preventDefault();
    if (!lb) {
      lb = document.createElement("dialog");
      lb.className = "lightbox";
      lb.innerHTML = '<img alt=""><p></p>';
      lb.addEventListener("click", function () { lb.close(); });
      document.body.appendChild(lb);
    }
    var img = a.querySelector("img");
    var cap = a.parentNode.querySelector("figcaption");
    lb.querySelector("img").src = a.getAttribute("href");
    lb.querySelector("img").alt = img ? img.alt : "";
    lb.querySelector("p").textContent = cap ? cap.textContent : "";
    lb.showModal();
  });

  /* Search ------------------------------------------------------------------------------------ */
  var dlg = document.querySelector("[data-search]");
  var input = document.querySelector("[data-search-input]");
  var list = document.querySelector("[data-search-results]");
  var kbd = document.querySelector("[data-kbd]");
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (kbd) kbd.textContent = isMac ? "⌘K" : "Ctrl K";
  var index = null, loading = null, results = [], sel = 0;
  var cssLink = document.querySelector('link[rel="stylesheet"][href*="docs.css"]');
  var base = cssLink ? cssLink.getAttribute("href").replace(/docs\.css.*$/, "") : "/doc/assets/";

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) loading = fetch(base + "search-index.json").then(function (r) { return r.json(); })
      .then(function (d) {
        index = d.map(function (e) {
          return { p: e.p, h: e.h, u: e.u, x: e.x, lp: e.p.toLowerCase(), lh: (e.h || "").toLowerCase(), lx: e.x.toLowerCase() };
        });
        return index;
      }).catch(function () { loading = null; return []; });
    return loading;
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mark(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      out = out.replace(/(<[^>]*>)|([^<]+)/g, function (m, tag, txt) { return tag || txt.replace(re, "<mark>$1</mark>"); });
    });
    return out;
  }
  function snippet(x, terms) {
    var lx = x.toLowerCase(), pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = lx.indexOf(terms[i]);
    if (pos < 0) return x.slice(0, 160);
    var start = Math.max(0, pos - 50);
    return (start > 0 ? "…" : "") + x.slice(start, start + 170) + (start + 170 < x.length ? "…" : "");
  }
  function run(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results = []; render(terms, q); return; }
    load().then(function (idx) {
      var scored = [];
      idx.forEach(function (e) {
        var score = 0, all = true;
        terms.forEach(function (t) {
          var s = 0;
          if (e.lh.indexOf(t) >= 0) s += e.lh.indexOf(t) === 0 ? 12 : 8;
          if (e.lp.indexOf(t) >= 0) s += 4;
          if (e.lx.indexOf(t) >= 0) s += 2 + Math.min(3, e.lx.split(t).length - 1) * .5;
          if (!s) all = false;
          score += s;
        });
        if (all && score) scored.push({ e: e, s: score + (e.h ? 0 : 1) });
      });
      scored.sort(function (a, b) { return b.s - a.s; });
      results = scored.slice(0, 12).map(function (r) { return r.e; });
      sel = 0;
      render(terms, q);
    });
  }
  function render(terms, q) {
    if (!q.trim()) { list.innerHTML = ""; return; }
    if (!results.length) {
      list.innerHTML = '<li class="empty">No results for “' + escapeHtml(q) + '”. Try another word, or ask on <a href="https://discord.gg/6gw887Vxms" target="_blank" rel="noopener">Discord</a>.</li>';
      return;
    }
    list.innerHTML = results.map(function (e, i) {
      return '<li><a role="option" id="sr-' + i + '" href="' + e.u + '" aria-selected="' + (i === sel) + '">' +
        '<span class="r-page">' + escapeHtml(e.p) + '</span>' +
        '<span class="r-head">' + mark(e.h || e.p, terms) + '</span>' +
        '<span class="r-text">' + mark(snippet(e.x, terms), terms) + '</span></a></li>';
    }).join("");
  }
  function move(d) {
    if (!results.length) return;
    sel = (sel + d + results.length) % results.length;
    list.querySelectorAll("a").forEach(function (a, i) { a.setAttribute("aria-selected", i === sel ? "true" : "false"); });
    var el = document.getElementById("sr-" + sel);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function openSearch() {
    if (!dlg || typeof dlg.showModal !== "function") return;
    if (!dlg.open) dlg.showModal();
    load();
    input.select();
  }
  document.querySelectorAll("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  var closeBtn = document.querySelector("[data-search-close]");
  if (closeBtn) closeBtn.addEventListener("click", function () { dlg.close(); });
  if (dlg) {
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) dlg.close(); });
  }
  if (input) {
    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter" && results[sel]) { e.preventDefault(); dlg.close(); location.href = results[sel].u; }
    });
  }
  /* 3D viewer: <model-viewer> is loaded only when the reader asks for it --------------------------- */
  var mvLoading = null;
  function loadModelViewer() {
    if (window.customElements && customElements.get("model-viewer")) return Promise.resolve();
    if (!mvLoading) mvLoading = new Promise(function (resolve, reject) {
      var sc = document.createElement("script");
      sc.type = "module";
      sc.src = base + "vendor/model-viewer/model-viewer-4.4.0.min.js";
      sc.onload = function () { customElements.whenDefined("model-viewer").then(resolve); };
      sc.onerror = function () { mvLoading = null; reject(new Error("model-viewer failed to load")); };
      document.head.appendChild(sc);
    });
    return mvLoading;
  }
  document.querySelectorAll("[data-viewer3d]").forEach(function (fig) {
    var start = fig.querySelector("[data-v3d-start]");
    var stage = fig.querySelector(".v3d-stage");
    var poster = fig.querySelector(".v3d-poster");
    var bar = fig.querySelector(".v3d-bar");
    var peel = fig.querySelector("[data-v3d-peel]");
    var reset = fig.querySelector("[data-v3d-reset]");
    if (!start || !window.customElements || !("noModule" in HTMLScriptElement.prototype)) { if (start) start.hidden = true; return; }
    var label = start.lastChild;
    var mv = null;
    function seek(v) {
      if (!mv || !mv.duration) return;
      mv.pause();
      mv.currentTime = Math.min(v, 0.999) * mv.duration;     // the very end would wrap back to the start
      // the light is baked: the laminating film is smoky where its flap is lifted (as in the still), so thin it as
      // the sandwich closes; and fade in the outer FPC's assembled-pose bake (an overlay at alpha 0 when peeled)
      var mats = (mv.model && mv.model.materials) || [];
      mats.forEach(function (m) {
        if (/^Laminate/.test(m.name)) m.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0.35 + 0.65 * v]);
        else if (/assembled/.test(m.name)) m.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 1 - v]);
      });
    }
    function view() {
      mv.cameraOrbit = fig.dataset.orbit; mv.cameraTarget = fig.dataset.target; mv.fieldOfView = fig.dataset.fov;
    }
    start.addEventListener("click", function () {
      start.disabled = true; start.classList.add("loading"); label.textContent = "Loading 3D…";
      loadModelViewer().then(function () {
        mv = document.createElement("model-viewer");
        var a = {
          src: fig.dataset.src, poster: poster.getAttribute("src"), alt: poster.alt,
          "camera-controls": "", "touch-action": "pan-y", "interaction-prompt": "none",
          "camera-orbit": fig.dataset.orbit, "camera-target": fig.dataset.target, "field-of-view": fig.dataset.fov,
          "min-field-of-view": "5deg", "max-field-of-view": "30deg",
          "min-camera-orbit": "auto auto 0.15m", "max-camera-orbit": "auto auto 1m",
          "shadow-intensity": fig.dataset.shadow || "0.8", "shadow-softness": "1", "tone-mapping": "neutral",
          "environment-image": fig.dataset.env || "neutral", exposure: "1", loading: "eager", reveal: "auto",
          "animation-name": fig.dataset.anim || "FlexiTac"
        };
        Object.keys(a).forEach(function (k) { mv.setAttribute(k, a[k]); });
        mv.addEventListener("load", function () {
          poster.hidden = true; start.hidden = true; bar.hidden = false;
          // the clip is ready a few frames after "load": pose it (while paused) once it has a duration
          var tries = 0;
          (function pose() {
            if (mv.duration > 0) { seek(+peel.value); return; }
            if (++tries < 240) requestAnimationFrame(pose);
          })();
          mv.focus && mv.focus();
        });
        mv.addEventListener("error", function () {
          if (mv) mv.remove(); mv = null; poster.hidden = false;
          start.disabled = false; start.classList.remove("loading"); label.textContent = "3D view unavailable — retry";
        });
        stage.appendChild(mv);
      }, function () {
        start.disabled = false; start.classList.remove("loading"); label.textContent = "3D view unavailable — retry";
      });
    });
    if (peel) peel.addEventListener("input", function () { seek(+peel.value); });
    if (reset) reset.addEventListener("click", function () { if (mv) view(); });
  });

  /* GitHub card: refresh the FlexiTac repo's star and fork counts, exactly as the homepage does (same cache key,
     so a tab coming from the homepage reuses its numbers). The page ships with the homepage's counts. ---------- */
  (function () {
    var REPO = "FlexiTac/FlexiTac", KEY = "gh-stats:" + REPO, TTL = 60 * 60 * 1000;
    if (!document.querySelector("[data-gh-badge]")) return;
    function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n); }
    function apply(s) {
      document.querySelectorAll("[data-gh-stars]").forEach(function (el) { el.textContent = fmt(s.stars); });
      document.querySelectorAll("[data-gh-forks]").forEach(function (el) { el.textContent = fmt(s.forks); });
      document.querySelectorAll("[data-gh-badge]").forEach(function (el) {
        el.setAttribute("aria-label", "FlexiTac on GitHub: " + s.stars + " stars, " + s.forks + " forks");
      });
    }
    try {
      var cached = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (cached && Date.now() - cached.at < TTL) { apply(cached); return; }
    } catch (e) {}
    if (!window.fetch) return;
    fetch("https://api.github.com/repos/" + REPO, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || typeof d.stargazers_count !== "number") return;
        var s = { stars: d.stargazers_count, forks: d.forks_count, at: Date.now() };
        apply(s);
        try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
      })
      .catch(function () {});
  })();

  /* Flow steps with a card: the click opens the card (its caret on the step's icon) instead of the link -------- */
  document.querySelectorAll(".flow a[data-flow-card]").forEach(function (a) {
    var card = document.getElementById(a.getAttribute("aria-controls"));
    var li = a.parentNode, row = li.parentNode;
    if (!card) return;
    function place() {
      var lr = li.getBoundingClientRect(), rr = row.getBoundingClientRect();
      var w = card.offsetWidth, mid = lr.left + lr.width / 2;
      var left = Math.max(rr.left, Math.min(mid - w / 2, rr.right - w));
      card.style.left = (left - lr.left) + "px";
      card.style.setProperty("--caret", (mid - left) + "px");
    }
    function show(on) {
      card.hidden = !on;
      a.setAttribute("aria-expanded", on ? "true" : "false");
      if (on) place();
    }
    a.addEventListener("click", function (e) { e.preventDefault(); show(card.hidden); });
    card.querySelector(".flow-card-close").addEventListener("click", function () { show(false); a.focus(); });
    document.addEventListener("click", function (e) {
      if (!card.hidden && !card.contains(e.target) && !a.contains(e.target)) show(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !card.hidden) { show(false); a.focus(); }
    });
    window.addEventListener("resize", function () { if (!card.hidden) place(); });
  });

  /* Timeline lanes: edge fades and the ‹ › buttons appear only while a lane has more to scroll ---------- */
  document.querySelectorAll(".tl-row").forEach(function (row) {
    var lane = row.querySelector(".tl-lane"), nav = row.querySelector(".tl-nav");
    if (!lane) return;
    var btns = nav ? nav.querySelectorAll("button") : [];
    function update() {
      var max = lane.scrollWidth - lane.clientWidth, x = lane.scrollLeft;
      lane.classList.toggle("fade-l", x > 4);
      lane.classList.toggle("fade-r", x < max - 4);
      if (nav) {
        nav.hidden = max <= 4;
        btns[0].disabled = x <= 4;
        btns[1].disabled = x >= max - 4;
      }
    }
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        lane.scrollBy({ left: +b.dataset.dir * lane.clientWidth * 0.8, behavior: "smooth" });
      });
    });
    lane.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  // Sample clips (<video data-inview>): muted loops that play only while on screen. With reduced
  // motion, or if the browser refuses to autoplay, they show their controls instead.
  var clips = document.querySelectorAll("video[data-inview]");
  if (clips.length) {
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(clips, function (v) { v.controls = true; });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) {
            var p = v.play();
            if (p && p.catch) p.catch(function () { v.controls = true; });
          } else if (!v.paused) v.pause();
        });
      }, { rootMargin: "120px 0px" });
      Array.prototype.forEach.call(clips, function (v) { io.observe(v); });
    }
  }

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch(); }
    else if (e.key === "/" && !typing) { e.preventDefault(); openSearch(); }
  });
})();
