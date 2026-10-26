// <ray-sidebar>: the side navigation of an app shell (shadcn's Sidebar).
// Header, content and footer slots; on wide screens a panel that can
// collapse (`collapsed`) to an icon rail, or out of view with
// collapse="offcanvas"; below `breakpoint` an off-canvas
// drawer (`open`): a modal <dialog> sliding in from its side, with focus
// trapped, Escape and backdrop click closing it.
//
// toggle() does the right thing for the screen: collapse/expand on wide
// screens, open/close the drawer on narrow ones — wire it to a menu button.
//
// With `resizable`, its inner edge is a separator (WAI-ARIA window splitter)
// that drags or arrow-keys the width between min-width and max-width;
// `autosave="key"` keeps it (localStorage).
//
// <ray-sidebar-group label="Projects">: a titled section of nav links; the
// title hides when the sidebar collapses.

import { RayElement, css, define } from "../../core/core.js";
import { overlayStyles } from "../../core/styles.js";
import { isRtl } from "../../core/direction.js";
import { play, playAll } from "../../core/motion.js";

const styles = css`
  :host {
    --_w: 16rem;
    --_rail: 3.5rem;
    display: block;
    flex: none;
    width: var(--_w);
    height: 100%;
    min-height: 0;
    transition: width var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([collapsed]:not([data-mobile])) { width: var(--_rail); }
  /* offcanvas: collapsed is out of view, and out of the tab order once the
     width has animated to 0 (visibility waits for it; showing does not). */
  :host([collapse="offcanvas"][collapsed]:not([data-mobile])) { width: 0; padding: 0; }
  :host([collapse="offcanvas"][collapsed]:not([data-mobile])) .panel { visibility: hidden; transition: visibility 0s var(--ray-duration-base); }
  :host([data-mobile]) { width: 0; }
  .panel {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: var(--ray-foreground);
    background: var(--ray-sidebar, color-mix(in srgb, var(--ray-muted) 70%, var(--ray-background)));
    border-inline-end: 1px solid var(--ray-border);
  }
  /* side: start/end follow the writing direction, left/right are sides of
     the screen; the border faces the content. */
  :host([side="end"]) .panel { border-inline-end: 0; border-inline-start: 1px solid var(--ray-border); }
  :host([side="left"]) .panel { border: 0; border-right: 1px solid var(--ray-border); } /* physical */
  :host([side="right"]) .panel { border: 0; border-left: 1px solid var(--ray-border); } /* physical */
  :host([variant="floating"]:not([data-mobile])) { padding: var(--ray-space-2); box-sizing: border-box; }
  :host([variant="floating"]) .panel { border: 1px solid var(--ray-border); border-radius: var(--ray-radius-lg); box-shadow: var(--ray-shadow-sm); }
  .header, .footer { flex: none; padding: var(--ray-space-2); }
  .header:not([data-filled]), .footer:not([data-filled]) { display: none; }
  .content { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: var(--ray-space-2); }

  /* Narrow screens: the panel lives in a modal dialog at the edge. */
  dialog {
    --_from: -100%;
    position: fixed;
    inset-block: 0;
    inset-inline: 0 auto;
    box-sizing: border-box;
    width: min(var(--_w), calc(100vw - 3rem));
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
  }
  dialog:dir(rtl) { --_from: 100%; }
  :host([side="end"]) dialog { inset-inline: auto 0; --_from: 100%; }
  :host([side="end"]) dialog:dir(rtl) { --_from: -100%; }
  :host([side="left"]) dialog { inset: 0 auto 0 0; --_from: -100%; } /* physical */
  :host([side="right"]) dialog { inset: 0 0 0 auto; --_from: 100%; } /* physical */
  dialog[open] { display: block; animation: ray-sidebar-in var(--ray-duration-slow) var(--ray-easing-out); }
  dialog .panel { box-shadow: var(--ray-shadow-xl); background: var(--ray-card); }
  @keyframes ray-sidebar-in { from { transform: translateX(var(--_from)); } }
  dialog::backdrop { animation: ray-fade-in var(--ray-duration-base) var(--ray-easing-out); }
  @keyframes ray-fade-in { from { opacity: 0; } }

  /* resizable: a separator on the edge that faces the content. */
  :host { position: relative; }
  .resizer { display: none; position: absolute; z-index: 1; inset-block: 0; inset-inline-end: -0.25rem; width: 0.5rem; cursor: col-resize; touch-action: none; outline: none; }
  :host([resizable]:not([collapsed]):not([data-mobile])) .resizer { display: block; }
  :host([side="end"]) .resizer { inset-inline-end: auto; inset-inline-start: -0.25rem; }
  :host([side="left"]) .resizer { inset-inline: auto; right: -0.25rem; } /* physical */
  :host([side="right"]) .resizer { inset-inline: auto; left: -0.25rem; } /* physical */
  .resizer::before {
    content: "";
    position: absolute;
    inset-block: 0;
    left: 50%; /* physical */
    width: 3px;
    background: transparent;
    transform: translateX(-50%);
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .resizer:hover::before, .resizer:focus-visible::before, :host([data-dragging]) .resizer::before { background: var(--ray-primary); }
  :host([data-dragging]) { transition: none; user-select: none; cursor: col-resize; }
`;

const STEP = 10;
const BIG_STEP = 50;

export class RaySidebar extends RayElement {
  static properties = {
    collapsed: { type: Boolean, reflect: true },
    collapse: { type: String, reflect: true, default: "icon" },
    open: { type: Boolean, reflect: true },
    side: { type: String, reflect: true, default: "start" },
    variant: { type: String, reflect: true, default: "sidebar" },
    width: { type: String },
    collapsedWidth: { type: String },
    breakpoint: { type: String, default: "48em" },
    label: { type: String, default: "Sidebar" },
    resizable: { type: Boolean, reflect: true },
    minWidth: { type: Number, default: 192 },
    maxWidth: { type: Number, default: 480 },
    autosave: { type: String },
    resizeLabel: { type: String, default: "Resize sidebar" },
  };
  static styles = [overlayStyles, styles];
  static template = `
    <div class="panel" part="panel">
      <div class="header" part="header"><slot name="header"></slot></div>
      <nav class="content" part="content"><slot></slot></nav>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
    </div>
    <dialog part="drawer"></dialog>
    <div class="resizer" part="resizer" role="separator" tabindex="0" aria-orientation="vertical"></div>`;

  #mq = null;
  #exit = null;

  constructor() {
    super();
    this.panel = this.$(".panel");
    this.dialog = this.$("dialog");
    for (const name of ["header", "footer"]) {
      const slot = this.$(`slot[name="${name}"]`);
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
    }
    this.dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.open = false;
    });
    this.dialog.addEventListener("close", () => {
      if (this.open) this.commitProperty("open", false);
    });
    // A click on the backdrop (outside the panel) closes the drawer.
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog) this.open = false;
    });
    // Following a link closes the drawer.
    this.addEventListener("click", (e) => {
      if (!this.mobile || !this.open) return;
      const link = e.composedPath().find((n) => n.localName === "a" && n.href);
      if (link) this.open = false;
    });
    // New nav links and groups pick up the collapsed state.
    this.$(".content slot").addEventListener("slotchange", () => this._syncCollapsed());
    this._px = null;
    this.resizer = this.$(".resizer");
    this.resizer.addEventListener("pointerdown", (e) => this._down(e));
    this.resizer.addEventListener("keydown", (e) => this._resizeKey(e));
  }

  connectedCallback() {
    super.connectedCallback();
    this._watch();
    if (this.autosave && !this._restored) {
      this._restored = true;
      try {
        const saved = Number(localStorage.getItem(`ray-sidebar:${this.autosave}`));
        if (saved > 0) {
          this._px = saved;
          this.requestUpdate();
        }
      } catch {
        // No storage: the default width is fine.
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#mq?.removeEventListener("change", this._onMedia);
    this.#mq = null;
    if (this.dialog.open) this.dialog.close();
  }

  /** Whether the sidebar is in its narrow-screen (drawer) mode. */
  get mobile() {
    return this.hasAttribute("data-mobile");
  }

  /** Collapses/expands on wide screens; opens/closes the drawer on narrow ones. */
  toggle() {
    if (this.mobile) this.open = !this.open;
    else this.collapsed = !this.collapsed;
    this.emit("ray-toggle", { collapsed: Boolean(this.collapsed), open: Boolean(this.open), mobile: this.mobile });
  }

  _watch() {
    this.#mq?.removeEventListener("change", this._onMedia);
    this.#mq = matchMedia(`(max-width: ${this.breakpoint || "48em"})`);
    this._onMedia = () => this._setMobile(this.#mq.matches);
    this.#mq.addEventListener("change", this._onMedia);
    this._setMobile(this.#mq.matches);
  }

  _setMobile(on) {
    this.toggleAttribute("data-mobile", on);
    if (on) {
      if (this.panel.parentNode !== this.dialog) this.dialog.append(this.panel);
      if (this.open && !this.dialog.open) this._show();
    } else {
      if (this.dialog.open) this.dialog.close();
      if (this.panel.parentNode !== this.shadowRoot) this.shadowRoot.prepend(this.panel);
      if (this.open) this.commitProperty("open", false);
    }
    this._syncCollapsed();
  }

  update(changed) {
    // A later change of `width` wins over a dragged or restored one.
    if (changed.has("width") && this._updated) this._px = null;
    this._updated = true;
    if (this._px !== null) this.style.setProperty("--_w", `${this._clamp(this._px)}px`);
    else if (this.width) this.style.setProperty("--_w", this.width);
    else this.style.removeProperty("--_w");
    this.resizer.setAttribute("aria-label", this.resizeLabel ?? "Resize sidebar");
    this.resizer.setAttribute("aria-valuemin", String(this.minWidth ?? 0));
    this.resizer.setAttribute("aria-valuemax", String(this.maxWidth ?? 0));
    queueMicrotask(() => this.resizer.setAttribute("aria-valuenow", String(Math.round(this._width()))));
    if (this.collapsedWidth) this.style.setProperty("--_rail", this.collapsedWidth);
    else this.style.removeProperty("--_rail");
    this.$(".content").setAttribute("aria-label", this.label ?? "Sidebar");
    if (changed.has("breakpoint") && this.isConnected) this._watch();
    if (changed.has("collapsed") || changed.has("collapse")) this._syncCollapsed();
    if (changed.has("open") && this.mobile) {
      if (this.open && this.#exit) {
        this.#exit.cancel();
        this.#exit = null;
      } else if (this.open && !this.dialog.open) {
        this._show();
      } else if (!this.open && this.dialog.open && !this.#exit) {
        this._leave();
      }
    }
  }

  /** The expanded width in px (not mid-transition when it was set here). */
  _width() {
    return this._px !== null ? this._clamp(this._px) : this.getBoundingClientRect().width;
  }

  _clamp(px) {
    return Math.round(Math.max(this.minWidth ?? 0, Math.min(px, this.maxWidth ?? Infinity)));
  }

  /** The screen side it sits on: start and end follow the writing direction. */
  _onLeft() {
    if (this.side === "left" || this.side === "right") return this.side === "left";
    return (this.side === "end") === isRtl(this);
  }

  _resizeTo(px, commit) {
    this._px = this._clamp(px);
    this.requestUpdate();
    if (!commit) return;
    if (this.autosave) {
      try {
        localStorage.setItem(`ray-sidebar:${this.autosave}`, String(this._px));
      } catch {
        // Not persisted: fine.
      }
    }
    this.emit("ray-resize", { width: this._px });
  }

  _down(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this.resizer.focus();
    try {
      this.resizer.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone: drag without capture.
    }
    this.setAttribute("data-dragging", "");
    const rect = this.getBoundingClientRect();
    const left = this._onLeft();
    const at = (ev) => (left ? ev.clientX - rect.left : rect.right - ev.clientX);
    const move = (ev) => this._resizeTo(at(ev), false);
    const up = (ev) => {
      this.resizer.removeEventListener("pointermove", move);
      this.resizer.removeEventListener("pointerup", up);
      this.resizer.removeEventListener("pointercancel", up);
      this.removeAttribute("data-dragging");
      this._resizeTo(at(ev), true);
    };
    this.resizer.addEventListener("pointermove", move);
    this.resizer.addEventListener("pointerup", up);
    this.resizer.addEventListener("pointercancel", up);
  }

  // Arrows move the edge on screen: toward the content widens it.
  _resizeKey(e) {
    const step = e.shiftKey ? BIG_STEP : STEP;
    const current = this._width();
    const wider = this._onLeft() ? "ArrowRight" : "ArrowLeft";
    const narrower = this._onLeft() ? "ArrowLeft" : "ArrowRight";
    let next = null;
    if (e.key === wider) next = current + step;
    else if (e.key === narrower) next = current - step;
    else if (e.key === "Home") next = this.minWidth ?? 0;
    else if (e.key === "End") next = this.maxWidth ?? current;
    if (next === null) return;
    e.preventDefault();
    this._resizeTo(next, true);
  }

  _show() {
    this.dialog.showModal();
    this.emit("ray-open");
  }

  async _leave() {
    const to = `translateX(${getComputedStyle(this.dialog).getPropertyValue("--_from").trim() || "-100%"})`;
    const exit = playAll([
      play(this.dialog, [{ transform: "none" }, { transform: to }]),
      play(this.dialog, [{ opacity: 1 }, { opacity: 0 }], { pseudoElement: "::backdrop" }),
    ]);
    this.#exit = exit;
    await exit.finished;
    if (this.#exit !== exit) return;
    this.#exit = null;
    if (!this.open && this.dialog.open) this.dialog.close();
    exit.cancel();
    this.emit("ray-close");
  }

  // The rail shows icons only: nav links and group titles follow.
  _syncCollapsed() {
    const rail = Boolean(this.collapsed) && !this.mobile && this.collapse !== "offcanvas";
    for (const el of this.querySelectorAll("ray-nav-link")) el.iconOnly = rail;
    for (const el of this.querySelectorAll("ray-sidebar-group")) el.toggleAttribute("collapsed", rail);
  }
}

const groupStyles = css`
  :host { display: block; }
  :host(:not(:first-child)) { margin-top: var(--ray-space-3); }
  .label {
    display: block;
    height: 1.75rem;
    padding: 0 var(--ray-space-3);
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium);
    line-height: 1.75rem;
    color: var(--ray-muted-foreground);
    white-space: nowrap;
    overflow: hidden;
    transition: opacity var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .label:empty { display: none; }
  /* Collapsed: the title fades but keeps its height, so icons do not jump. */
  :host([collapsed]) .label { opacity: 0; }
  .items { display: grid; gap: 2px; }
`;

export class RaySidebarGroup extends RayElement {
  static properties = {
    label: { type: String },
  };
  static styles = [groupStyles];
  static template = `<div class="label" part="label" id="label"></div><div class="items" part="items" role="group" aria-labelledby="label"><slot></slot></div>`;

  update() {
    this.$(".label").textContent = this.label ?? "";
  }
}

define("ray-sidebar", RaySidebar);
define("ray-sidebar-group", RaySidebarGroup);
