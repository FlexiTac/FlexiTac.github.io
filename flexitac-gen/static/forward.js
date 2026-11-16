// The first page (the user's decisions of 2026-11-15 and 2026-11-16: "我觉得之后可以让lib作为第一次点击进入时候使用的界面",
// then "是的 be first page"): the Library is the site's first page (index.html, at ./) and the generator lives at
// gen.html (Gen by Surface at gen.html, Rectangular at gen.html#rect, a Library sensor at gen.html?part=<id>).  The
// addresses of before keep working: this file, loaded first in <head> by the Library (index.html) and by library.html
// (a forwarding page since then), sends them on with location.replace (no history entry: Back goes where it went
// before), their query and hash kept, before anything paints (the pages' CSP allows no inline script, hence a file;
// meanwhile the page is hidden, its background alone painted, and library.js does nothing on it):
// - on the Library (./), a generator's address of before: a query naming one of GEN_KEYS (./?part=<id>, ./?sample=<id>,
//   ?debug) or a hash of GEN_HASHES (#rect, Rectangular; #cad, Gen by Surface as written before 2026-10-30; the
//   generator's own anchors, its design checks' links #drc-row, #drc-column and #maskNote) goes to gen.html with the
//   same query and hash;
// - library.html (the Library's address before 2026-11-16) goes to ./ with the same query and hash (library.html#<id>
//   to ./#<id>, the Library with that sensor's window over the grid), or straight to gen.html for a generator's address.
// The Library's own addresses stay: #<id>, #<part>, #<family>, #gripper-<part>, #shelf-<part>, #showcase and #grippers
// are none of GEN_HASHES (tests/test_library.py holds entries.json's ids and the grid's places apart from them, and
// GEN_KEYS and GEN_HASHES to what the generator reads).  ?probe, the checks' reads on both pages, is the Library's at ./
// (the generator's at gen.html?probe), so it alone forwards nothing.
// The Library open already (the review of 2026-11-16): an address of before reached by its hash alone (./#rect or
// ./#cad typed over ./, an old bookmark or a link to one followed from it) is a navigation within the page, which runs
// no script again, so it showed "No sensor in the library is named rect." where Rectangular had opened before; it is
// sent on at its hashchange too (this listener is the page's first, library.js's route() does nothing on a page being
// sent on), its entry replaced as at a load.  A Library kept by the browser's back-forward cache while it was being
// sent on and shown again by Back is shown, and sent on again only if its address asks for it.
"use strict";

(() => {
  const GEN_KEYS = ["part", "sample", "debug"];
  const GEN_HASHES = ["#rect", "#cad", "#maskNote", "#drc-row", "#drc-column"];
  const root = document.documentElement;
  const page = document.querySelector('meta[name="flexitac-page"]')?.content;
  // Only the Library and the forwarding page send anything on (the generator's page would send itself on forever).
  if (page !== "library" && page !== "forward") return;
  // The page's address now: sent on (true) or left to the page (false).
  const forward = () => {
    const query = new URLSearchParams(location.search);
    const generator = GEN_KEYS.some(key => query.has(key)) || GEN_HASHES.includes(location.hash);
    const target = generator ? "gen.html" : page === "forward" ? "./" : null;
    if (target === null) return false;
    // Hidden from the first paint (the body's background, the page's grey or the dark look's black, alone painted:
    // visibility, unlike display, keeps the canvas in the page's colour) until the next page commits.
    root.dataset.forward = target;
    root.style.visibility = "hidden";
    location.replace(target + location.search + location.hash);
    return true;
  };
  forward();
  if (page !== "library") return;
  window.addEventListener("hashchange", forward);
  window.addEventListener("pageshow", event => {
    if (!event.persisted || !root.hasAttribute("data-forward")) return;
    delete root.dataset.forward;
    root.style.visibility = "";
    forward();
  });
})();
