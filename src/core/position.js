// Anchored positioning for floating elements (popovers, menus, tooltips).
//
// The floating element is position: fixed (it lives in the top layer via the
// Popover API), placed next to an anchor rectangle, flipped to the opposite
// side when it does not fit, and shifted to stay inside the viewport.
// "The viewport" is the part of the page the user sees: the visual viewport
// (smaller than the window while a phone's on-screen keyboard is up) minus
// the safe areas (the notch, the status bar, the home indicator). When
// neither side has room, the floating element takes the roomier one and its
// height is capped to that room (it scrolls).
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

let insetProbe = null;

/** The safe-area insets of the screen, in px (env(safe-area-inset-*)). */
function safeAreaInsets() {
  if (!document.body) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (!insetProbe || !insetProbe.isConnected) {
    insetProbe = document.createElement("div");
    insetProbe.setAttribute("aria-hidden", "true");
    insetProbe.style.cssText =
      "position: fixed; top: 0; left: 0; width: 0; height: 0; visibility: hidden; pointer-events: none;" +
      "padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);";
    document.body.append(insetProbe);
  }
  const cs = getComputedStyle(insetProbe);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0, /* physical */
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0, /* physical */
  };
}

/**
 * The visible area, in the coordinates of position: fixed (the layout
 * viewport): the visual viewport where there is one, minus the safe areas.
 * @returns {{ left: number, top: number, right: number, bottom: number }}
 */
export function visibleArea() {
  const layoutWidth = document.documentElement.clientWidth;
  const layoutHeight = window.innerHeight;
  const vv = window.visualViewport;
  let left = 0;
  let top = 0;
  let right = layoutWidth;
  let bottom = layoutHeight;
  if (vv && vv.width > 0 && vv.height > 0) {
    left = vv.offsetLeft;
    top = vv.offsetTop;
    right = Math.min(layoutWidth, vv.offsetLeft + vv.width);
    bottom = Math.min(layoutHeight, vv.offsetTop + vv.height);
  }
  const inset = safeAreaInsets();
  return {
    left: Math.max(left, inset.left),
    top: Math.max(top, inset.top),
    right: Math.min(right, layoutWidth - inset.right),
    bottom: Math.min(bottom, layoutHeight - inset.bottom),
  };
}

/**
 * Places `floating` next to `anchor` (a DOMRect-like {left, top, right, bottom, width, height}).
 * The floating element must be rendered (open) so it can be measured.
 * @param {PlaceOptions} options
 * @returns {string} the final placement, e.g. "top-start"
 */
export function place(anchor, floating, { placement = "bottom", offset = 8, padding = 8, flip = true, matchWidth = false } = {}) {
  const area = visibleArea();
  const minX = area.left + padding;
  const maxX = area.right - padding;
  const minY = area.top + padding;
  const maxY = area.bottom - padding;
  floating.style.position = "fixed";
  floating.style.inset = "auto";
  floating.style.margin = "0";
  if (matchWidth) floating.style.minWidth = `${anchor.width}px`;
  // Measure at the height its own CSS gives it (drop a cap from a previous place()).
  // (data-capped keeps the inline values it replaced, restored here.)
  if (floating.dataset.capped !== undefined) {
    const [maxHeight = "", overflowY = ""] = JSON.parse(floating.dataset.capped || "[]");
    floating.style.maxHeight = maxHeight;
    floating.style.overflowY = overflowY;
    delete floating.dataset.capped;
  }
  let f = floating.getBoundingClientRect();
  let [side, align = "center"] = placement.split("-");

  /** The room on a side of the anchor, inside the visible area. */
  const room = (s) => {
    if (s === "bottom") return maxY - (anchor.bottom + offset);
    if (s === "top") return anchor.top - offset - minY;
    if (s === "right") return maxX - (anchor.right + offset);
    return anchor.left - offset - minX;
  };
  const need = (s) => (s === "top" || s === "bottom" ? f.height : f.width);
  const fits = (s) => need(s) <= room(s);
  if (flip && !fits(side)) {
    const other = OPPOSITE[side];
    // The other side if it fits, or (neither does) the roomier one.
    if (fits(other) || room(other) > room(side)) side = other;
  }
  // Above or below without room enough: as tall as the room, scrolling.
  if ((side === "top" || side === "bottom") && !fits(side)) {
    const cap = Math.max(0, Math.floor(room(side)));
    floating.dataset.capped = JSON.stringify([floating.style.maxHeight, floating.style.overflowY]);
    floating.style.maxHeight = `${cap}px`;
    floating.style.overflowY = "auto";
    f = floating.getBoundingClientRect();
  }

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
  // Shift into the visible area.
  x = Math.max(minX, Math.min(x, maxX - f.width));
  y = Math.max(minY, Math.min(y, maxY - f.height));
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
  // An on-screen keyboard resizes and scrolls the visual viewport, not the window.
  const vv = window.visualViewport;
  vv?.addEventListener("resize", onChange);
  vv?.addEventListener("scroll", onChange);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(onChange) : null;
  if (ro) {
    if (anchor instanceof Element) ro.observe(anchor);
    ro.observe(floating);
  }
  return () => {
    window.removeEventListener("scroll", onChange, { capture: true });
    window.removeEventListener("resize", onChange);
    vv?.removeEventListener("resize", onChange);
    vv?.removeEventListener("scroll", onChange);
    ro?.disconnect();
  };
}
