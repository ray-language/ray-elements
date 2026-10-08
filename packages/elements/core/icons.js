// Icon registry: every icon a ray-ds component draws comes from here, so an
// app can switch the whole set (Lucide, Tabler, its own…) in one call:
//
//   import { setIcons } from "@ray-ds/elements";
//   setIcons({ close: '<svg viewBox="0 0 24 24">…</svg>', "chevron-down": … });
//
// setIcons() also adds new names, for <ray-icon name="…">. Icons are SVG
// markup (or an SVGElement) drawn with currentColor; components size them.
// The markup is inserted as HTML: register icons from your own code only,
// never from user input.

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** The default set (24×24, 2px stroke). */
const DEFAULTS = {
  "close": svg(`<path d="M6 6l12 12M18 6 6 18"/>`),
  "check": svg(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`),
  "minus": svg(`<path d="M6 12h12"/>`),
  "plus": svg(`<path d="M12 5v14M5 12h14"/>`),
  "chevron-down": svg(`<path d="m6 9 6 6 6-6"/>`),
  "chevron-up": svg(`<path d="m6 15 6-6 6 6"/>`),
  "chevron-right": svg(`<path d="m9 6 6 6-6 6"/>`),
  "chevron-left": svg(`<path d="m15 6-6 6 6 6"/>`),
  "chevrons-left": svg(`<path d="m11 6-6 6 6 6M18 6l-6 6 6 6"/>`),
  "chevrons-right": svg(`<path d="m13 6 6 6-6 6M6 6l6 6-6 6"/>`),
  "search": svg(`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`),
  "arrow-up-right": svg(`<path d="M7 17 17 7M8 7h9v9"/>`),
  "arrow-down-right": svg(`<path d="M7 7l10 10M17 8v9H8"/>`),
  "sun": svg(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`),
  "moon": svg(`<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>`),
  "monitor": svg(`<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`),
  "user": svg(`<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`),
  "info": svg(`<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>`),
  "circle-check": svg(`<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>`),
  "alert-triangle": svg(`<path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>`),
  "circle-x": svg(`<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>`),
  "menu": svg(`<path d="M4 6h16M4 12h16M4 18h16"/>`),
  "more-horizontal": svg(`<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>`),
  // Common in command palettes, menus and nav links.
  "file": svg(`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>`),
  "folder": svg(`<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`),
  "pause": svg(`<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>`),
  "play": svg(`<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/>`),
  "terminal": svg(`<path d="m5 7 5 5-5 5M12 17h7"/>`),
  "calendar": svg(`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`),
  "image": svg(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>`),
  "download": svg(`<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>`),
  "star": svg(`<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" stroke-linejoin="round"/>`),
  "upload": svg(`<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>`),
  "paperclip": svg(`<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L14.5 7"/>`),
  "panel-left": svg(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>`),
  "settings": svg(`<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>`),
};

const registry = new Map(Object.entries(DEFAULTS));
const listeners = new Set();
const warned = new Set();

/**
 * Replaces or adds icons. Values are SVG markup or an SVGElement.
 * @param {Record<string, string | SVGElement>} icons
 */
export function setIcons(icons) {
  for (const [name, value] of Object.entries(icons)) {
    const markup = typeof value === "string" ? value.trim() : value?.outerHTML;
    if (typeof markup !== "string" || !/^<svg[\s>]/i.test(markup)) {
      throw new TypeError(`setIcons: "${name}" is not SVG markup or an SVGElement`);
    }
    registry.set(name, markup);
  }
  for (const cb of listeners) cb();
}

/** The SVG markup of an icon ("" and one warning when it is not registered). */
export function getIcon(name) {
  const markup = registry.get(name);
  if (markup !== undefined) return markup;
  if (!warned.has(name)) {
    warned.add(name);
    console.warn(`ray-ds: no icon named "${name}" (setIcons to add it)`);
  }
  return "";
}

/** The registered icon names. */
export function iconNames() {
  return [...registry.keys()];
}

/** @internal Called by the core runtime to repaint components after setIcons. */
export function onIconsChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
