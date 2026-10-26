// <ray-split>: two panes (slot="start", slot="end") with a draggable divider
// (ray-sublime's sidebar and docks). The start pane has the size; the end
// pane takes the rest.
//
// The divider is a focusable separator (WAI-ARIA window splitter): arrows
// move it (Shift: faster), Home/End go to min/max, Enter collapses the start
// pane. With `autosave="key"` the size and the collapsed state survive
// reloads (localStorage).

import { RayElement, css, define } from "../../core/core.js";
import { isRtl, inlineKey } from "../../core/direction.js";

const styles = css`
  :host {
    display: grid;
    grid-template-columns: var(--_size) 0.375rem minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    --_size: 50%;
  }
  :host([orientation="vertical"]) { grid-template-columns: none; grid-template-rows: var(--_size) 0.375rem minmax(0, 1fr); }
  .pane { min-width: 0; min-height: 0; overflow: auto; }
  :host([collapsed]) .start { visibility: hidden; }
  .divider {
    position: relative;
    z-index: 1;
    margin: 0 -0.25rem;
    cursor: col-resize;
    touch-action: none;
    outline: none;
  }
  :host([orientation="vertical"]) .divider { margin: -0.25rem 0; cursor: row-resize; }
  :host([disabled]) .divider { cursor: default; }
  .divider::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%; /* physical */
    width: 1px;
    background: var(--ray-border);
    transform: translateX(-50%);
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard), width var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host([orientation="vertical"]) .divider::before { top: 50%; bottom: auto; inset-inline: 0; width: auto; height: 1px; transform: translateY(-50%); }
  :host(:not([disabled])) .divider:hover::before,
  .divider:focus-visible::before,
  :host([data-dragging]) .divider::before { width: 3px; background: var(--ray-primary); }
  :host([orientation="vertical"]:not([disabled])) .divider:hover::before,
  :host([orientation="vertical"]) .divider:focus-visible::before,
  :host([orientation="vertical"][data-dragging]) .divider::before { width: auto; height: 3px; }
  :host([data-dragging]) { user-select: none; cursor: col-resize; }
  :host([data-dragging][orientation="vertical"]) { cursor: row-resize; }
`;

const STEP = 10;
const BIG_STEP = 50;

export class RaySplit extends RayElement {
  static properties = {
    orientation: { type: String, reflect: true, default: "horizontal" },
    position: { type: String, default: "50%" },
    min: { type: Number, default: 0 },
    max: { type: Number },
    collapsed: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    autosave: { type: String },
  };
  static styles = [styles];
  static template = `
    <div class="pane start" part="start" id="start"><slot name="start"></slot></div>
    <div class="divider" part="divider" role="separator" tabindex="0" aria-controls="start"></div>
    <div class="pane end" part="end"><slot name="end"></slot></div>`;

  constructor() {
    super();
    this._px = null;
    this.divider = this.$(".divider");
    this.divider.addEventListener("pointerdown", (e) => this._down(e));
    this.divider.addEventListener("keydown", (e) => this._key(e));
    this.divider.addEventListener("dblclick", () => this.toggle());
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._restored) return;
    this._restored = true;
    if (this.autosave) {
      try {
        const saved = Number(localStorage.getItem(`ray-split:${this.autosave}`));
        if (saved > 0) this._px = saved;
        // "1" or "0"; nothing saved keeps the markup's collapsed.
        const collapsed = localStorage.getItem(`ray-split:${this.autosave}:collapsed`);
        if (collapsed !== null) this.collapsed = collapsed === "1";
      } catch {
        // No storage: the default position is fine.
      }
    }
  }

  /** The start pane's current size in px. */
  get size() {
    return this.$(".start").getBoundingClientRect()[this._vertical() ? "height" : "width"];
  }

  /** Collapses or restores the start pane. */
  toggle() {
    this.collapsed = !this.collapsed;
    this.emit("ray-resize", { size: this.collapsed ? 0 : this.size, collapsed: this.collapsed });
  }

  update(changed) {
    // A later change of `position` wins over a dragged/restored size; the
    // first update (position from the markup) does not.
    if (changed.has("position") && this._updated) this._px = null;
    // Collapsed by the divider or by script after the first update: saved.
    if (changed.has("collapsed") && this._updated && this.autosave) {
      try {
        localStorage.setItem(`ray-split:${this.autosave}:collapsed`, this.collapsed ? "1" : "0");
      } catch {
        // Not persisted: fine.
      }
    }
    this._updated = true;
    const min = Math.max(0, this.min ?? 0);
    const max = this.max ?? null;
    let value;
    if (this._px !== null) {
      value = `${this._clamp(this._px)}px`;
    } else {
      // A bare number is px; anything else (30%, 20rem) is CSS, clamped by min/max in CSS.
      const pos = /^\d+(\.\d+)?$/.test(this.position ?? "") ? `${this.position}px` : (this.position || "50%");
      value = `clamp(${min}px, ${pos}, ${max === null ? "100%" : `${max}px`})`;
    }
    // Inline on the host (it beats any :host rule): collapsed is decided here too.
    this.style.setProperty("--_size", this.collapsed ? "0px" : value);
    const vertical = this._vertical();
    // The separator line is perpendicular to the split direction.
    this.divider.setAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
    this.divider.setAttribute("aria-label", this.getAttribute("aria-label") ?? "Resize");
    this.divider.tabIndex = this.disabled ? -1 : 0;
    if (this.disabled) this.divider.setAttribute("aria-disabled", "true");
    else this.divider.removeAttribute("aria-disabled");
    queueMicrotask(() => this._aria());
  }

  _vertical() {
    return this.orientation === "vertical";
  }

  _total() {
    const r = this.getBoundingClientRect();
    return this._vertical() ? r.height : r.width;
  }

  _clamp(px) {
    const total = this._total();
    const max = Math.min(this.max ?? Infinity, total > 0 ? total : Infinity);
    return Math.round(Math.max(this.min ?? 0, Math.min(px, max)));
  }

  _aria() {
    const total = this._total();
    const now = total > 0 ? Math.round((this.collapsed ? 0 : this.size) / total * 100) : 0;
    this.divider.setAttribute("aria-valuemin", "0");
    this.divider.setAttribute("aria-valuemax", "100");
    this.divider.setAttribute("aria-valuenow", String(now));
  }

  _resizeTo(px, commit) {
    this._px = this._clamp(px);
    if (this.collapsed) this.collapsed = false;
    this.requestUpdate();
    if (commit) {
      if (this.autosave) {
        try {
          localStorage.setItem(`ray-split:${this.autosave}`, String(this._px));
        } catch {
          // Not persisted: fine.
        }
      }
      this.emit("ray-resize", { size: this._px, collapsed: false });
    }
  }

  _down(e) {
    if (this.disabled || e.button !== 0) return;
    e.preventDefault();
    this.divider.focus();
    try {
      this.divider.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone (e.g. a canceled touch): drag without capture.
    }
    this.setAttribute("data-dragging", "");
    const rect = this.getBoundingClientRect();
    const vertical = this._vertical();
    // The start pane's size: right to left it is on the right.
    const rtl = !vertical && isRtl(this);
    const at = (ev) => (vertical ? ev.clientY - rect.top : rtl ? rect.right - ev.clientX : ev.clientX - rect.left);
    const move = (ev) => this._resizeTo(at(ev), false);
    const up = (ev) => {
      this.divider.removeEventListener("pointermove", move);
      this.divider.removeEventListener("pointerup", up);
      this.divider.removeEventListener("pointercancel", up);
      this.removeAttribute("data-dragging");
      this._resizeTo(at(ev), true);
    };
    this.divider.addEventListener("pointermove", move);
    this.divider.addEventListener("pointerup", up);
    this.divider.addEventListener("pointercancel", up);
  }

  _key(e) {
    if (this.disabled) return;
    const vertical = this._vertical();
    const step = e.shiftKey ? BIG_STEP : STEP;
    const current = this.collapsed ? 0 : this.size;
    const less = vertical ? "ArrowUp" : "ArrowLeft";
    const more = vertical ? "ArrowDown" : "ArrowRight";
    // Right to left, ArrowLeft moves the divider away from the start pane.
    const key = vertical ? e.key : inlineKey(e.key, this);
    let next = null;
    if (key === less) next = current - step;
    else if (key === more) next = current + step;
    else if (e.key === "Home") next = this.min ?? 0;
    else if (e.key === "End") next = this.max ?? this._total();
    else if (e.key === "Enter") {
      e.preventDefault();
      this.toggle();
      return;
    }
    if (next === null) return;
    e.preventDefault();
    this._resizeTo(next, true);
  }
}

define("ray-split", RaySplit);
