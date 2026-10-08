// <ray-nav-link>: an item of a sidebar or navigation (Mantine's NavLink): icon,
// label, description, a badge on the right, active state, and nested
// ray-nav-links that collapse under it.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const styles = css`
  :host { display: block; }
  .link {
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    width: 100%;
    min-height: 2.25rem;
    padding: var(--ray-space-1) var(--ray-space-3);
    font: inherit;
    font-size: var(--ray-font-size-sm);
    color: var(--ray-foreground);
    text-align: left;
    text-decoration: none;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .link:hover { background: var(--ray-accent); }
  .link[data-active] { color: var(--_light-color); background: var(--_light); font-weight: var(--ray-font-weight-medium); }
  .link[data-active]:hover { background: var(--_light-hover); }
  :host([variant="filled"]) .link[data-active] { color: var(--_contrast); background: var(--_filled); }
  :host([variant="filled"]) .link[data-active]:hover { background: var(--_filled-hover); }
  :host([variant="subtle"]) .link[data-active] { background: transparent; }
  :host([disabled]) .link { color: var(--ray-muted-foreground); cursor: not-allowed; background: transparent; opacity: 0.6; }
  .body { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .description { font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .link[data-active] .description { color: inherit; opacity: 0.8; }
  .description:empty { display: none; }
  .section { display: inline-flex; flex: none; align-items: center; }
  .section:not([data-filled]) { display: none; }
  ::slotted(svg) { width: 1rem; height: 1rem; }
  .chevron { display: none; flex: none; color: var(--ray-muted-foreground); transition: transform var(--ray-duration-base) var(--ray-easing-standard); }
  .chevron svg { width: 0.875rem; height: 0.875rem; }
  :host([data-parent]) .chevron { display: inline-flex; }
  :host([opened]) .chevron { transform: rotate(90deg); }
  /* Children expand and collapse: a 0fr → 1fr grid row animates the height
     in both directions without measuring it (like the accordion). */
  .children {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition: grid-template-rows var(--ray-duration-base) var(--ray-easing-standard), opacity var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([data-parent][opened]) .children { grid-template-rows: 1fr; opacity: 1; }
  /* icon-only (a collapsed ray-sidebar): just the left section, centered;
     the label stays as the accessible name and the tooltip. */
  :host([icon-only]) .link { justify-content: center; gap: 0; padding-inline: 0; }
  :host([icon-only]) .body, :host([icon-only]) .chevron, :host([icon-only]) .section.right { display: none; }
  :host([icon-only]) .children { display: none; }
  /* 2px of room so the focus ring of a child is not clipped. */
  .children-inner { min-height: 0; overflow: hidden; margin: -2px 0; padding: 2px 0 2px var(--ray-space-5); }
`;

const INNER = `
  <span class="section" part="left-section"><slot name="left"></slot></span>
  <span class="body"><span class="label" part="label"></span><span class="description" part="description"></span></span>
  <span class="section right" part="right-section"><slot name="right"></slot></span>
  <span class="chevron" aria-hidden="true" data-ray-icon="chevron-right"></span>`;

export class RayNavLink extends RayElement {
  static delegatesFocus = true;
  static properties = {
    label: { type: String },
    description: { type: String },
    href: { type: String, reflect: true },
    active: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    opened: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true, default: "light" },
    color: { type: String, reflect: true },
    iconOnly: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<div class="children" part="children" role="group"><div class="children-inner"><slot></slot></div></div>`;

  constructor() {
    super();
    this._children = this.$(".children slot");
    this._children.addEventListener("slotchange", () => this.requestUpdate());
  }

  /** Nested ray-nav-links. */
  get links() {
    return this._children.assignedElements().filter((el) => el.localName === "ray-nav-link");
  }

  update() {
    const parent = this.links.length > 0;
    this.toggleAttribute("data-parent", parent);
    // A parent toggles its children; a leaf with href is a link.
    // A disabled link is a disabled button: an <a> without href is not a link.
    const tag = this.href && !parent && !this.disabled ? "a" : "button";
    if (!this._el || this._el.localName !== tag) this._render(tag);
    const el = this._el;
    el.querySelector(".label").textContent = this.label ?? "";
    el.querySelector(".description").textContent = this.description ?? "";
    el.toggleAttribute("data-active", Boolean(this.active));
    applyColor(el, this.color);
    if (tag === "a") {
      if (this.disabled) el.removeAttribute("href");
      else el.href = this.href;
    } else {
      el.disabled = Boolean(this.disabled);
    }
    if (this.active && !parent) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
    if (parent) el.setAttribute("aria-expanded", String(Boolean(this.opened)));
    else el.removeAttribute("aria-expanded");
    // Collapsed children: not focusable nor read (they are only 0px tall).
    this.$(".children").inert = parent && !this.opened;
    if (this.disabled) el.setAttribute("aria-disabled", "true");
    else el.removeAttribute("aria-disabled");
    // Icon only: the label (hidden) still names the link, and shows on hover.
    if (this.iconOnly && this.label) {
      el.setAttribute("aria-label", this.label);
      el.title = this.label;
    } else {
      el.removeAttribute("aria-label");
      el.removeAttribute("title");
    }
  }

  _render(tag) {
    this._el?.remove();
    const el = document.createElement(tag);
    el.className = "link focus-ring";
    el.setAttribute("part", "link");
    if (tag === "button") el.type = "button";
    el.innerHTML = INNER;
    for (const slot of el.querySelectorAll("slot[name]")) {
      const sync = () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
      slot.addEventListener("slotchange", sync);
    }
    el.addEventListener("click", (e) => {
      if (this.disabled) {
        e.preventDefault();
        return;
      }
      if (this.links.length > 0) {
        this.opened = !this.opened;
        this.emit("ray-toggle", { opened: this.opened });
      }
    });
    this.shadowRoot.prepend(el);
    this._el = el;
  }
}

define("ray-nav-link", RayNavLink);
