// The page's look, light or dark (the user's request of 2026-11-06: "做成默认白色,然后右上角github前面一个小标志可以切换黑白"):
// light for every visitor, whatever the system's light or dark setting says; dark only once the visitor turns it on with
// the header's toggle (#themeToggle, right before the GitHub card, on index.html and library.html).  web/theme.css and
// web/library.css hang their dark rules on <html data-theme="dark">; this file sets that attribute.
//
// Both pages load it in <head>, before their style sheets and without defer, so the attribute is on <html> before
// <body> is parsed and so before the first paint: a visitor who chose dark never sees a frame of the light page (the
// page's CSP allows no inline script, hence a file of its own).  The choice is kept per visitor in localStorage
// (THEME_KEY, "dark" or "light", shared by the two pages, as app.js's look is); without storage (a private window,
// blocked site data) the page opens light and the toggle still switches it for that page.  The toggle's icon (a moon
// in light, a sun in dark) follows the attribute in the style sheets; its aria-pressed and tooltip are set here.
"use strict";

(() => {
  const THEME_KEY = "fpc-customizer.theme";
  const root = document.documentElement;

  function stored() {
    try {
      return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  }
  function show(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById("themeToggle");
    if (!button) return;  // in <head>, before the header exists: DOMContentLoaded comes back for it
    button.setAttribute("aria-pressed", String(theme === "dark"));
    button.title = theme === "dark" ? "Turn dark mode off" : "Turn dark mode on";
  }

  show(stored());
  document.addEventListener("DOMContentLoaded", () => show(root.dataset.theme), {once: true});
  // Delegated, so a click before DOMContentLoaded counts too.
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element) || !event.target.closest("#themeToggle")) return;
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    show(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Private windows and blocked storage keep the choice for this page only.
    }
  });
  // The other page in another tab (the generator opens the Library in a new one), or this page back from the
  // back-forward cache, takes the choice made there; a key of null is the other tab clearing the storage (its
  // clear()), which leaves nothing stored: light, as the next reload would open.
  window.addEventListener("storage", event => {
    if (event.key === THEME_KEY || event.key === null) show(stored());
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) show(stored());
  });
})();
