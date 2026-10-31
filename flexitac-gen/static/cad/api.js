// Client of the CAD-mode routes POST /api/surface/{inspect,select,fit,map}.
// Body (application/x-tactile-surface): 4-byte big-endian length of the JSON
// header, the header (UTF-8), then the raw mesh bytes.

export const SURFACE_CONTENT_TYPE = "application/x-tactile-surface";
// app.py MAX_SURFACE_BYTES: the limit applies to the whole framed body.
export const MAX_SURFACE_BYTES = 64 * 1024 * 1024;
const MAX_BUSY_ATTEMPTS = 5;
const MAX_RETRY_DELAY_S = 8;

export class SurfaceRequestError extends Error {
  constructor(code, message, details = null, status = 0) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

/**
 * The framed request body as a Blob.  `mesh` is a Blob made once per file:
 * composing Blobs references their data, so a request does not copy the mesh
 * again (an ArrayBuffer part would be copied into every body).
 */
export function frameBody(header, mesh) {
  const json = new TextEncoder().encode(JSON.stringify(header));
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, json.length, false);
  const size = 4 + json.length + mesh.size;
  if (size > MAX_SURFACE_BYTES) {
    throw new SurfaceRequestError("E_CLIENT_FILE_TOO_LARGE",
      `The request would be ${(size / 1048576).toFixed(2)} MiB (mesh and header); the server accepts up to ${MAX_SURFACE_BYTES / 1048576} MiB.`);
  }
  return new Blob([length, json, mesh]);
}

function sleep(seconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, seconds * 1000);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new SurfaceRequestError("E_CLIENT_ABORTED", "Superseded by a newer request.")); }, {once: true});
  });
}

/**
 * POST one surface route; resolves to the JSON reply, rejects with SurfaceRequestError
 * (code E_CLIENT_ABORTED when `signal` aborts it: a newer request of the same kind replaced it).
 */
export async function surfaceRequest(route, header, mesh, {onRetry = null, signal = null} = {}) {
  const body = frameBody(header, mesh);
  for (let attempt = 1; ; attempt += 1) {
    let response;
    try {
      response = await globalThis.apiFetch(`/api/surface/${route}`, {method: "POST", headers: {"Content-Type": SURFACE_CONTENT_TYPE}, body, signal});
    } catch (error) {
      if (signal?.aborted) throw new SurfaceRequestError("E_CLIENT_ABORTED", "Superseded by a newer request.");
      throw new SurfaceRequestError("E_NETWORK", "The local server did not answer; is app.py still running?");
    }
    let data = null;
    if ((response.headers.get("Content-Type") || "").includes("json")) {
      try { data = await response.json(); } catch (error) { data = null; }
    }
    if (signal?.aborted) throw new SurfaceRequestError("E_CLIENT_ABORTED", "Superseded by a newer request.");
    if (response.status === 503 && attempt < MAX_BUSY_ATTEMPTS) {
      // The surface routes share the generation slots with the generator.
      const retryAfter = Number.parseFloat(response.headers.get("Retry-After"));
      const delay = Math.min(MAX_RETRY_DELAY_S, Math.max(Number.isFinite(retryAfter) ? retryAfter : 1, 0.5 * 2 ** (attempt - 1)));
      if (onRetry) onRetry(delay, attempt);
      await sleep(delay, signal);
      continue;
    }
    // A 200 map reply has ok: false when a verification record fails; it is still a reply.
    if (response.ok && data) return data;
    if (data && typeof data.code === "string") throw new SurfaceRequestError(data.code, String(data.error || "Request rejected."), data.details || null, response.status);
    throw new SurfaceRequestError(`HTTP_${response.status}`, `HTTP ${response.status} without a JSON reply.`, null, response.status);
  }
}
