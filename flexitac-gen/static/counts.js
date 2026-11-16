// The FlexiTac repository's stars and forks in the header (the user's request of 2026-11-02, as flexitac.github.io
// shows them), on both pages of the static site: its build wrote recent counts into each page; they are refreshed here
// from GitHub's API (the site's CSP allows api.github.com), kept for an hour per tab (sessionStorage: the Library and
// the generator in one tab ask once).  Only the static site asks (its pages marked <meta name="flexitac-backend"
// content="browser">): app.py writes them into the page it serves (it reads them itself), and its page asks no other host.
// In web/backend.js until the review of 2026-11-16: the Library, the site's first page since that day (the user's
// decision "是的 be first page"), loads no backend.js (no engine on the Library), so the site's landing page had shown the
// build's counts, never refreshed; both pages load this file now (deferred: the header is parsed when it runs).
"use strict";

(() => {
  if (document.querySelector('meta[name="flexitac-backend"]')?.content !== "browser") return;
  // A Library being sent on to gen.html (web/forward.js) asks nothing: the next page does.
  if (document.documentElement.hasAttribute("data-forward")) return;
  const REPO = "FlexiTac/FlexiTac";
  const KEY = `gh-stats:${REPO}`;
  const fmt = n => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
  const applyCounts = counts => {
    document.querySelectorAll("[data-gh-stars]").forEach(node => { node.textContent = fmt(counts.stars); });
    document.querySelectorAll("[data-gh-forks]").forEach(node => { node.textContent = fmt(counts.forks); });
    document.querySelectorAll("[data-gh-stats]").forEach(node => { node.hidden = false; });
    document.querySelectorAll("[data-gh-badge]").forEach(node => node.setAttribute("aria-label", `FlexiTac on GitHub: ${counts.stars} stars, ${counts.forks} forks`));
  };
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
})();
