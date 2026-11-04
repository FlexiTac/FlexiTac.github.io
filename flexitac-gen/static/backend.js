// The page's one door to the API: apiFetch(path, init) answers like fetch().
// Served by app.py it is fetch() itself.  The static site
// (tools/build_static_site.py) marks its page with
// <meta name="flexitac-backend" content="browser">: there app.py's own answers
// (app.answer) are computed in this browser, by Pyodide in a Web Worker
// (static/py/worker.js), and no design or mesh leaves the computer.
"use strict";

(() => {
  const browser = document.querySelector('meta[name="flexitac-backend"]')?.content === "browser";
  if (!browser) {
    window.apiBackend = {mode: "server", ready: Promise.resolve(true)};
    window.apiFetch = (path, init) => fetch(path, init);
    return;
  }

  // The FlexiTac repository's stars and forks in the header (the user's request of 2026-11-02, as flexitac.github.io
  // shows them): the build wrote recent counts into the page; they are refreshed from GitHub's API (its CSP allows
  // api.github.com), kept for an hour per tab.  Only the static site asks: app.py writes them into the page it serves
  // (it reads them itself), and its page asks no other host.
  const REPO = "FlexiTac/FlexiTac";
  const KEY = `gh-stats:${REPO}`;
  const fmt = n => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
  const applyCounts = counts => {
    document.querySelectorAll("[data-gh-stars]").forEach(node => { node.textContent = fmt(counts.stars); });
    document.querySelectorAll("[data-gh-forks]").forEach(node => { node.textContent = fmt(counts.forks); });
    document.querySelectorAll("[data-gh-stats]").forEach(node => { node.hidden = false; });
    document.querySelectorAll("[data-gh-badge]").forEach(node => node.setAttribute("aria-label", `FlexiTac on GitHub: ${counts.stars} stars, ${counts.forks} forks`));
  };
  const refreshCounts = () => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (cached && Date.now() - cached.at < 3600000) { applyCounts(cached); return; }
    } catch (error) { /* no storage: ask */ }
    fetch(`https://api.github.com/repos/${REPO}`, {headers: {Accept: "application/vnd.github+json"}})
      .then(reply => (reply.ok ? reply.json() : null))
      .then(data => {
        if (!data || typeof data.stargazers_count !== "number") return;
        const counts = {stars: data.stargazers_count, forks: data.forks_count, at: Date.now()};
        applyCounts(counts);
        try { sessionStorage.setItem(KEY, JSON.stringify(counts)); } catch (error) { /* kept for this page only */ }
      })
      .catch(() => { /* the built-in counts stay */ });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refreshCounts, {once: true});
  else refreshCounts();

  const pending = new Map();
  let nextId = 1;
  let failure = null;
  let readyDone;
  const ready = new Promise(resolve => { readyDone = resolve; });
  window.apiBackend = {mode: "browser", ready};

  // The engine's failure to load, answered as the server answers an internal error.
  function failed(message) {
    const body = JSON.stringify({ok: false, code: "E_BROWSER_ENGINE", error: `The in-browser generator did not load: ${message}`});
    return new Response(body, {status: 500, headers: {"Content-Type": "application/json; charset=utf-8"}});
  }
  function fail(message) {
    if (failure !== null) return;
    failure = message;
    readyDone(false);
    for (const {resolve} of pending.values()) resolve(failed(message));
    pending.clear();
  }

  const worker = new Worker(new URL("py/worker.js", document.currentScript.src));
  worker.addEventListener("error", event => fail(event.message || "the worker stopped"));
  worker.addEventListener("message", ({data}) => {
    if (data.ready) { readyDone(true); return; }
    if (data.failed) { fail(data.failed); return; }
    const request = pending.get(data.id);
    if (!request) return;  // aborted meanwhile
    pending.delete(data.id);
    request.resolve(new Response(data.body, {status: data.status, statusText: data.statusText, headers: data.headers}));
  });

  window.apiFetch = async (path, init = {}) => {
    const {signal = null} = init;
    if (signal?.aborted) throw new DOMException("The request was aborted.", "AbortError");
    if (failure !== null) return failed(failure);
    const body = new Uint8Array(init.body == null ? 0 : await new Response(init.body).arrayBuffer());
    const message = {
      method: String(init.method || "GET").toUpperCase(),
      target: String(path),
      contentType: new Headers(init.headers || {}).get("Content-Type") || "",
      body,
    };
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, {resolve});
      // The worker still finishes the request; its answer is dropped.
      signal?.addEventListener("abort", () => {
        if (pending.delete(id)) reject(new DOMException("The request was aborted.", "AbortError"));
      }, {once: true});
      worker.postMessage({id, ...message}, [body.buffer]);
    });
  };
})();
