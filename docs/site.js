// The ray·ds documentation site: theme controls, the mobile menu and the
// sidebar's current-section highlight. Copied to docs/ by the docs build.

import { setPrimary, getPrimary, definePrimary, getCustomPrimary, setIcons } from "../src/core/core.js";
import { notify } from "../src/components/notification/notification.js";

const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// --- icons for the landing's showcase: the registry takes any SVG markup.
const icon = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
setIcons({
  "arrow-right": icon(`<path d="M5 12h14M13 6l6 6-6 6"/>`),
  package: icon(`<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>`),
  flask: icon(`<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>`),
  tag: icon(`<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>`),
  book: icon(`<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>`),
  layers: icon(`<path d="M12 3 2 8l10 5 10-5z"/><path d="m2 13 10 5 10-5"/>`),
  message: icon(`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>`),
  activity: icon(`<path d="M3 12h4l3-8 4 16 3-8h4"/>`),
});

// --- landing demo: a toast from the "Run app" button.
for (const b of $$("[data-demo-toast]")) {
  b.addEventListener("click", () => notify({ title: "ray run src/main.ray", message: "Listening on 127.0.0.1:45173", color: "green" }));
}

// --- primary color: palette selects ("custom" = any color) and the color
// picker, shown only for "custom" (header and drawer copies stay in sync).
const DEFAULT_CUSTOM = "#7c3aed";
const pickers = $$("[data-site-brand]");

function syncPrimaryControls() {
  const current = getPrimary() ?? "blue";
  for (const s of $$("[data-site-primary]")) s.value = current;
  for (const b of $$("[data-primary-swatch]")) b.setAttribute("aria-pressed", String(b.dataset.primarySwatch === current));
  const custom = current === "custom";
  const color = getCustomPrimary() ?? DEFAULT_CUSTOM;
  for (const p of pickers) {
    p.hidden = !custom;
    if (p.value !== color) p.value = color;
  }
}
for (const b of $$("[data-primary-swatch]")) {
  b.addEventListener("click", () => {
    const c = b.dataset.primarySwatch;
    setPrimary(c === "blue" ? null : c);
    syncPrimaryControls();
  });
}
for (const s of $$("[data-site-primary]")) {
  s.addEventListener("change", () => {
    // "custom" applies the picker's color right away: what it shows is what you get.
    if (s.value === "custom") definePrimary(getCustomPrimary() ?? DEFAULT_CUSTOM);
    else setPrimary(s.value === "blue" ? null : s.value);
    syncPrimaryControls();
  });
}
for (const p of pickers) {
  p.addEventListener("input", () => {
    definePrimary(p.value);
    syncPrimaryControls();
  });
}
syncPrimaryControls();
customElements.whenDefined("ray-select").then(syncPrimaryControls);

// --- mobile menu: a drawer with the site nav, the page's sidebar and the tools
const drawer = document.getElementById("site-menu");
document.querySelector("[data-site-menu]")?.addEventListener("click", () => drawer?.show());
drawer?.addEventListener("click", (e) => {
  if (e.target.closest?.("a[href], ray-nav-link[href]")) drawer.close();
});

// --- sidebar: the section in view is the current one
const links = $$(".sidebar ray-nav-link[href^='#'], .drawer-nav ray-nav-link[href^='#']");
const targets = [...new Set(links.map((l) => l.getAttribute("href").slice(1)))]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function current() {
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
  let best = targets[0];
  for (const t of targets) {
    if (t.getBoundingClientRect().top - offset <= 1) best = t;
  }
  // At the very bottom, the last section is the current one.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) best = targets[targets.length - 1];
  return best?.id;
}

let shown = null;
function highlight() {
  const id = current();
  if (!id || id === shown) return;
  shown = id;
  for (const l of links) {
    const on = l.getAttribute("href") === `#${id}`;
    l.active = on;
    if (on) l.setAttribute("aria-current", "location");
    else l.removeAttribute("aria-current");
  }
  // Keep the highlighted entry visible in a long sidebar.
  const inSidebar = links.find((l) => l.active && l.closest(".sidebar"));
  const box = document.querySelector(".sidebar");
  if (inSidebar && box) {
    const r = inSidebar.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (r.top < b.top + 40 || r.bottom > b.bottom - 40) box.scrollTop += r.top - b.top - b.height / 3;
  }
}
if (targets.length) {
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    setTimeout(() => { queued = false; highlight(); }, 50);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);
  customElements.whenDefined("ray-nav-link").then(highlight);
}
