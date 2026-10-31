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
