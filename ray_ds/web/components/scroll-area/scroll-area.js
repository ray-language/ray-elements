// <ray-scroll-area>: a box that scrolls its content (Mantine's ScrollArea),
// with the native scrolling (wheel, touch, keyboard, momentum) and a thin
// scrollbar painted with the tokens. Edge shadows tell there is more
// content that way; ray-reach-end fires when the end comes into view (load
// the next page there).
//
// Give it a size: height / max-height (or CSS, or a flex/grid parent).

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    --_thumb: color-mix(in srgb, var(--ray-foreground) 28%, transparent);
    --_shadow: color-mix(in srgb, var(--ray-foreground) 14%, transparent);
    position: relative;
    display: block;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  :host([hidden]) { display: none; }
  .viewport {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    max-height: inherit;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--_thumb) transparent;
    outline: none;
  }
  .viewport:focus-visible { box-shadow: inset 0 0 0 var(--ray-focus-ring-width) var(--ray-ring); }
  :host([orientation="vertical"]) .viewport { overflow-x: hidden; }
  :host([orientation="horizontal"]) .viewport { overflow-y: hidden; }
  /* hover: the thumb shows while the pointer is over the area (or it scrolls). */
  :host([type="hover"]) .viewport { scrollbar-color: transparent transparent; transition: scrollbar-color var(--ray-duration-base); }
  :host([type="hover"]:hover) .viewport, :host([type="hover"][data-scrolling]) .viewport, :host([type="hover"]:focus-within) .viewport { scrollbar-color: var(--_thumb) transparent; }
  :host([type="never"]) .viewport { scrollbar-width: none; }
  :host([type="never"]) .viewport::-webkit-scrollbar { display: none; }

  .edge {
    position: absolute;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--ray-duration-fast);
  }
  .edge[data-show] { opacity: 1; }
  .top, .bottom { left: 0; right: 0; height: 0.75rem; }
  .left, .right { top: 0; bottom: 0; width: 0.75rem; }
  .top { top: 0; background: linear-gradient(var(--_shadow), transparent); }
  .bottom { bottom: 0; background: linear-gradient(transparent, var(--_shadow)); }
  .left { left: 0; background: linear-gradient(to right, var(--_shadow), transparent); }
  .right { right: 0; background: linear-gradient(to left, var(--_shadow), transparent); }
  :host([no-shadows]) .edge { display: none; }
`;

export class RayScrollArea extends RayElement {
  static properties = {
    height: { type: String },
    maxHeight: { type: String, attribute: "max-height" },
    orientation: { type: String, reflect: true, default: "vertical" },
    type: { type: String, reflect: true, default: "auto" },
    noShadows: { type: Boolean, reflect: true, attribute: "no-shadows" },
    threshold: { type: Number, default: 48 },
    label: { type: String },
  };
  static styles = [styles];
  static template = `
    <div class="viewport" part="viewport" tabindex="0"><slot></slot></div>
    <span class="edge top" part="shadow"></span><span class="edge bottom" part="shadow"></span>
    <span class="edge left" part="shadow"></span><span class="edge right" part="shadow"></span>`;

  #ro = null;
  #atEnd = false;
  #idle = 0;

  constructor() {
    super();
    /** The element that scrolls. */
    this.viewport = this.$(".viewport");
    this.viewport.addEventListener("scroll", () => this._onScroll(), { passive: true });
    // Content that grows or shrinks moves the edges too.
    this.$("slot").addEventListener("slotchange", () => {
      for (const el of this.children) this.#ro?.observe(el);
      this._edges();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.#ro = new ResizeObserver(() => this._edges());
    this.#ro.observe(this.viewport);
    for (const el of this.children) this.#ro.observe(el);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#ro?.disconnect();
    this.#ro = null;
  }

  update() {
    this.style.height = this.height ?? "";
    this.style.maxHeight = this.maxHeight ?? "";
    // Scrollable content is focusable (keyboard scrolling); name it when asked.
    if (this.label) {
      this.viewport.setAttribute("role", "region");
      this.viewport.setAttribute("aria-label", this.label);
    } else {
      this.viewport.removeAttribute("role");
      this.viewport.removeAttribute("aria-label");
    }
    this._edges();
  }

  /** Scrolls to the start (top/left). */
  scrollToStart({ behavior = "smooth" } = {}) {
    this.viewport.scrollTo({ top: 0, left: 0, behavior });
  }

  /** Scrolls to the end (bottom, or right when horizontal). */
  scrollToEnd({ behavior = "smooth" } = {}) {
    const v = this.viewport;
    if (this.orientation === "horizontal") v.scrollTo({ left: v.scrollWidth, behavior });
    else v.scrollTo({ top: v.scrollHeight, behavior });
  }

  _onScroll() {
    this.setAttribute("data-scrolling", "");
    clearTimeout(this.#idle);
    this.#idle = setTimeout(() => this.removeAttribute("data-scrolling"), 800);
    this._edges();
  }

  // The edge shadows, and ray-reach-end once per arrival at the end.
  _edges() {
    const v = this.viewport;
    if (!v) return;
    const show = (cls, on) => this.$(`.${cls}`).toggleAttribute("data-show", on);
    const maxY = v.scrollHeight - v.clientHeight;
    const maxX = v.scrollWidth - v.clientWidth;
    const x = Math.abs(v.scrollLeft);
    show("top", v.scrollTop > 1);
    show("bottom", maxY > 1 && v.scrollTop < maxY - 1);
    show("left", x > 1);
    show("right", maxX > 1 && x < maxX - 1);
    const horizontal = this.orientation === "horizontal";
    const left = horizontal ? maxX - x : maxY - v.scrollTop;
    const scrollable = horizontal ? maxX > 1 : maxY > 1;
    const atEnd = scrollable && left <= (this.threshold ?? 48);
    if (atEnd && !this.#atEnd) this.emit("ray-reach-end", { edge: horizontal ? "right" : "bottom" });
    this.#atEnd = atEnd;
  }
}

define("ray-scroll-area", RayScrollArea);
