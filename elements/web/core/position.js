// Anchored positioning for floating elements (popovers, menus, tooltips).
//
// The floating element is position: fixed (it lives in the top layer via the
// Popover API), placed next to an anchor rectangle, flipped to the opposite
// side when it does not fit, and shifted to stay inside the viewport.
// Done in JS rather than CSS anchor positioning, which not every webview
// ships yet (WebKitGTK, older WKWebView).
//
// The sides top/bottom/left/right are sides of the screen; the alignments
// -start/-end follow the writing direction of the floating element: right to
// left, "bottom-start" lines up the right edges.

import { isRtl } from "./direction.js";

const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };

/**
 * @typedef {object} PlaceOptions
 * @property {string} [placement]  side[-align]: top|bottom|left|right, -start|-end (default "bottom");
 *   on top/bottom, -start/-end follow the writing direction
 * @property {number} [offset]     gap to the anchor in px (default 8)
 * @property {number} [padding]    minimum distance to the viewport edges (default 8)
 * @property {boolean} [flip]      try the opposite side when it does not fit (default true)
 * @property {boolean} [matchWidth] at least as wide as the anchor
 */

/**
 * Places `floating` next to `anchor` (a DOMRect-like {left, top, right, bottom, width, height}).
 * The floating element must be rendered (open) so it can be measured.
 * @param {PlaceOptions} options
 * @returns {string} the final placement, e.g. "top-start"
 */
export function place(anchor, floating, { placement = "bottom", offset = 8, padding = 8, flip = true, matchWidth = false } = {}) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  floating.style.position = "fixed";
  floating.style.inset = "auto";
  floating.style.margin = "0";
  if (matchWidth) floating.style.minWidth = `${anchor.width}px`;
  const f = floating.getBoundingClientRect();
  let [side, align = "center"] = placement.split("-");

  const fits = (s) => {
    if (s === "bottom") return anchor.bottom + offset + f.height <= vh - padding;
    if (s === "top") return anchor.top - offset - f.height >= padding;
    if (s === "right") return anchor.right + offset + f.width <= vw - padding;
    return anchor.left - offset - f.width >= padding;
  };
  if (flip && !fits(side) && fits(OPPOSITE[side])) side = OPPOSITE[side];

  let x;
  let y;
  if (side === "top" || side === "bottom") {
    y = side === "bottom" ? anchor.bottom + offset : anchor.top - offset - f.height;
    const rtl = align !== "center" && isRtl(floating);
    x = align === (rtl ? "end" : "start") ? anchor.left
      : align === (rtl ? "start" : "end") ? anchor.right - f.width
      : anchor.left + anchor.width / 2 - f.width / 2;
  } else {
    x = side === "right" ? anchor.right + offset : anchor.left - offset - f.width;
    y = align === "start" ? anchor.top
      : align === "end" ? anchor.bottom - f.height
      : anchor.top + anchor.height / 2 - f.height / 2;
  }
  // Shift into the viewport.
  x = Math.max(padding, Math.min(x, vw - f.width - padding));
  y = Math.max(padding, Math.min(y, vh - f.height - padding));
  floating.style.left = `${Math.round(x)}px`;
  floating.style.top = `${Math.round(y)}px`;
  const final = `${side}-${align}`;
  floating.dataset.placement = final;
  return final;
}

/** A zero-size rectangle at a point (context menus). */
export function pointRect(x, y) {
  return { left: x, right: x, top: y, bottom: y, width: 0, height: 0, x, y };
}

/**
 * Calls `update` whenever the layout may have moved the anchor or resized
 * the floating element: scroll (any ancestor), window resize, element resize.
 * @returns {() => void} stops watching
 */
export function autoUpdate(anchor, floating, update) {
  const onChange = () => update();
  window.addEventListener("scroll", onChange, { capture: true, passive: true });
  window.addEventListener("resize", onChange);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(onChange) : null;
  if (ro) {
    if (anchor instanceof Element) ro.observe(anchor);
    ro.observe(floating);
  }
  return () => {
    window.removeEventListener("scroll", onChange, { capture: true });
    window.removeEventListener("resize", onChange);
    ro?.disconnect();
  };
}
