// Which element scrolls the page an element sits on, and the direction of
// its scrolling: for the bars that hide while scrolling down and come back
// on the way up (ray-app-bar, ray-bottom-nav); and rows that scroll sideways.

import { css } from "./core.js";
import { isRtl } from "./direction.js";

/**
 * The scroller of `el`: `target` (an element or a selector) when given,
 * else the content of the ray-app-shell or ray-scroll-area around it, else
 * the window.
 * @param {Element} el
 * @param {Element | string | null | undefined} target
 * @returns {Element | Window}
 */
export function scrollerOf(el, target) {
  if (target instanceof Element) return target;
  if (typeof target === "string" && target) {
    const found = document.querySelector(target);
    if (found) return found.viewport ?? found.scroller ?? found;
  }
  for (let n = el; n; n = n.parentElement ?? n.getRootNode()?.host) {
    if (n.localName === "ray-app-shell" && n.scroller) return n.scroller;
    if (n.localName === "ray-scroll-area" && n !== el && n.viewport) return n.viewport;
  }
  return window;
}

/**
 * Calls `cb({ y, direction })` as `scroller` scrolls, once per frame;
 * direction is "down" or "up" past `tolerance` px, else unchanged.
 * Returns a function that stops listening.
 * @param {Element | Window} scroller
 * @param {(state: { y: number, direction: "up" | "down" }) => void} cb
 */
export function watchScroll(scroller, cb, { tolerance = 8 } = {}) {
  const top = () => (scroller === window ? window.scrollY : /** @type {Element} */ (scroller).scrollTop);
  let last = top();
  let direction = "up";
  let frame = 0;
  const run = () => {
    frame = 0;
    const y = Math.max(0, top());
    if (Math.abs(y - last) >= tolerance) {
      direction = y > last ? "down" : "up";
      last = y;
    }
    if (y <= 0) { direction = "up"; last = 0; }
    cb({ y, direction });
  };
  const onScroll = () => {
    // A hidden page runs no frames: no need to wait for one.
    if (document.visibilityState === "hidden") return run();
    if (!frame) frame = requestAnimationFrame(run);
  };
  scroller.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    scroller.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}

// --- a row that scrolls sideways (tab bars) -----------------------------------

/**
 * The look of a SideScroller's row (class "list"): the edge that hides items
 * fades out, following the writing direction.
 */
export const sideScrollerStyles = css`
  .list { --_fade-start: 0px; --_fade-end: 0px; --_fade-dir: to right; }
  .list:dir(rtl) { --_fade-dir: to left; }
  :host([data-overflow-start]) .list { --_fade-start: 2.5rem; }
  :host([data-overflow-end]) .list { --_fade-end: 2.5rem; }
  :host([data-overflow-start]) .list, :host([data-overflow-end]) .list {
    -webkit-mask-image: linear-gradient(var(--_fade-dir), transparent, #000 var(--_fade-start), #000 calc(100% - var(--_fade-end)), transparent);
    mask-image: linear-gradient(var(--_fade-dir), transparent, #000 var(--_fade-start), #000 calc(100% - var(--_fade-end)), transparent);
  }
`;

/**
 * A row of items that scrolls sideways (ray-tabs, ray-doc-tabs): it marks
 * `host` with data-overflow-start / data-overflow-end (following the writing
 * direction), turns a vertical wheel into a sideways scroll while the row
 * can move (at its ends the page scrolls), and scrolls an item into view,
 * moving the row only. `active()` false (a vertical tab list) turns it off;
 * `onResize` runs when the row's size changes.
 */
export class SideScroller {
  constructor(host, row, { active = () => true, onResize = () => {} } = {}) {
    this.host = host;
    this.row = row;
    this.active = active;
    row.addEventListener("scroll", () => this.update(), { passive: true });
    row.addEventListener("wheel", (e) => this.#wheel(e), { passive: false });
    this.ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => onResize()) : null;
  }

  connect() {
    this.ro?.observe(this.row);
  }

  disconnect() {
    this.ro?.disconnect();
  }

  /** How far the row is scrolled from its start, and how much is left to its end. */
  scrolled() {
    // Right to left, scrollLeft runs from 0 to negative.
    const start = Math.abs(this.row.scrollLeft);
    return { start, end: this.row.scrollWidth - this.row.clientWidth - start };
  }

  /** Sets the host's overflow marks. */
  update() {
    const on = this.active();
    const { start, end } = this.scrolled();
    this.host.toggleAttribute("data-overflow-start", on && start > 1);
    this.host.toggleAttribute("data-overflow-end", on && end > 1);
  }

  /** Scrolls the row to show `el`; false before layout (try again later). */
  reveal(el) {
    if (!el || !this.active()) return true;
    const r = this.row.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    if (!r.width) return false;
    if (e.left < r.left) this.row.scrollLeft -= r.left - e.left;
    else if (e.right > r.right) this.row.scrollLeft += e.right - r.right;
    return true;
  }

  #wheel(e) {
    if (!this.active() || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const forward = e.deltaY > 0;
    const { start, end } = this.scrolled();
    if (forward ? end <= 1 : start <= 1) return;
    e.preventDefault();
    const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    this.row.scrollLeft += isRtl(this.host) ? -step : step;
    this.update();
  }
}
