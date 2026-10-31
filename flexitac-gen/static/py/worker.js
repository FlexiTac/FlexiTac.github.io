// The static site's API: web/backend.js posts every request of the page here,
// and app.py's own answers (app.answer through bridge.py) are computed by
// Pyodide.  pyodide/ and engine.zip are put next to this file by
// tools/build_static_site.py.  Requests are answered one at a time, in order.
"use strict";

importScripts("pyodide/pyodide.js");

const ENGINE_DIR = "/home/pyodide/flexitac";

const ready = (async () => {
  const pyodide = await loadPyodide({indexURL: new URL("pyodide/", self.location.href).href});
  const engine = await fetch("engine.zip");
  if (!engine.ok) throw new Error(`engine.zip: HTTP ${engine.status}`);
  pyodide.unpackArchive(await engine.arrayBuffer(), "zip", {extractDir: ENGINE_DIR});
  pyodide.runPython(`import sys; sys.path.insert(0, ${JSON.stringify(ENGINE_DIR)})`);
  return pyodide.pyimport("bridge").handle;
})();
ready.then(() => self.postMessage({ready: true}), error => self.postMessage({failed: String(error?.message || error)}));

self.addEventListener("message", async ({data}) => {
  let handle;
  try {
    handle = await ready;
  } catch (error) {
    return;  // the page was told once, and answers every request itself
  }
  let status, statusText, headers, body;
  try {
    const reply = handle(data.method, data.target, data.contentType, data.body);
    try {
      [status, statusText, headers] = [reply.get(0), reply.get(1), JSON.parse(reply.get(2))];
      const bytes = reply.get(3);
      const view = bytes.getBuffer("u8");
      body = view.data.slice();
      view.release();
      bytes.destroy();
    } finally {
      reply.destroy();
    }
  } catch (error) {
    // bridge.py answers every Python exception; this is the interpreter itself failing.
    console.error(error);
    [status, statusText, headers] = [500, "Internal Server Error", [["Content-Type", "application/json; charset=utf-8"]]];
    body = new TextEncoder().encode(JSON.stringify({ok: false, code: "E_INTERNAL", error: "The in-browser generator failed; see the browser console."}));
  }
  self.postMessage({id: data.id, status, statusText, headers, body}, [body.buffer]);
});
