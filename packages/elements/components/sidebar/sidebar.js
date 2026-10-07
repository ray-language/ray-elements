// <ray-sidebar>: the side navigation of an app shell (shadcn's Sidebar).
// Header, content and footer slots; on wide screens a panel that can
// collapse to an icon rail (`collapsed`); below `breakpoint` an off-canvas
// drawer (`open`): a modal <dialog> sliding in from its side, with focus
// trapped, Escape and backdrop click closing it.
//
// toggle() does the right thing for the screen: collapse/expand on wide
// screens, open/close the drawer on narrow ones — wire it to a menu button.
//
// <ray-sidebar-group label="Projects">: a titled section of nav links; the
// title hides when the sidebar collapses.

import { RayElement, css, define } from "../../core/core.js";
import { overlayStyles } from "../../core/styles.js";
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
  :host([side="right"]) .panel { border-inline-end: 0; border-inline-start: 1px solid var(--ray-border); }
  :host([variant="floating"]:not([data-mobile])) { padding: var(--ray-space-2); box-sizing: border-box; }
  :host([variant="floating"]) .panel { border: 1px solid var(--ray-border); border-radius: var(--ray-radius-lg); box-shadow: var(--ray-shadow-sm); }
  .header, .footer { flex: none; padding: var(--ray-space-2); }
  .header:not([data-filled]), .footer:not([data-filled]) { display: none; }
  .content { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: var(--ray-space-2); }

  /* Narrow screens: the panel lives in a modal dialog at the edge. */
  dialog {
    position: fixed;
    inset: 0 auto 0 0;
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
  :host([side="right"]) dialog { inset: 0 0 0 auto; }
  dialog[open] { display: block; animation: ray-sidebar-in var(--ray-duration-slow) var(--ray-easing-out); }
  dialog .panel { box-shadow: var(--ray-shadow-xl); background: var(--ray-card); }
  @keyframes ray-sidebar-in { from { transform: translateX(var(--_from, -100%)); } }
  :host([side="right"]) dialog { --_from: 100%; }
  dialog::backdrop { animation: ray-fade-in var(--ray-duration-base) var(--ray-easing-out); }
  @keyframes ray-fade-in { from { opacity: 0; } }
`;

export class RaySidebar extends RayElement {
  static properties = {
    collapsed: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    side: { type: String, reflect: true, default: "left" },
    variant: { type: String, reflect: true, default: "sidebar" },
    width: { type: String },
    collapsedWidth: { type: String },
    breakpoint: { type: String, default: "48em" },
    label: { type: String, default: "Sidebar" },
  };
  static styles = [overlayStyles, styles];
  static template = `
    <div class="panel" part="panel">
      <div class="header" part="header"><slot name="header"></slot></div>
      <nav class="content" part="content"><slot></slot></nav>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
    </div>
    <dialog part="drawer"></dialog>`;

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
  }

  connectedCallback() {
    super.connectedCallback();
    this._watch();
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
    if (this.width) this.style.setProperty("--_w", this.width);
    else this.style.removeProperty("--_w");
    if (this.collapsedWidth) this.style.setProperty("--_rail", this.collapsedWidth);
    else this.style.removeProperty("--_rail");
    this.$(".content").setAttribute("aria-label", this.label ?? "Sidebar");
    if (changed.has("breakpoint") && this.isConnected) this._watch();
    if (changed.has("collapsed")) this._syncCollapsed();
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

  _show() {
    this.dialog.showModal();
    this.emit("ray-open");
  }

  async _leave() {
    const to = this.side === "right" ? "translateX(100%)" : "translateX(-100%)";
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
    const rail = Boolean(this.collapsed) && !this.mobile;
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
