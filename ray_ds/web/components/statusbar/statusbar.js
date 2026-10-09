// <ray-statusbar> + <ray-statusbar-item>: the bar at the bottom of an editor
// window (ray-sublime): items on the left, items on the right (slot="right").
// An item with `action` is a button; the others are plain text.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const barStyles = css`
  :host {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: var(--ray-space-4);
    min-height: 1.5rem;
    padding: 0 var(--ray-space-2);
    font-size: var(--ray-font-size-xs);
    color: var(--ray-muted-foreground);
    background: var(--ray-muted);
    border-top: 1px solid var(--ray-border);
    user-select: none;
  }
  :host([variant="accent"]) {
    color: var(--ray-primary-foreground);
    background: var(--ray-primary);
    border-top-color: transparent;
    /* Inherited by the items (no :host-context() in WebKit/Firefox). */
    --_item-hover: rgb(255 255 255 / 0.15);
    --_item-hover-color: var(--ray-primary-foreground);
  }
  .side { display: flex; align-items: stretch; gap: 0.125rem; min-width: 0; }
`;

export class RayStatusbar extends RayElement {
  static properties = {
    variant: { type: String, reflect: true, default: "default" },
  };
  static styles = [barStyles];
  static template = `<div class="side" part="left"><slot></slot></div><div class="side" part="right"><slot name="right"></slot></div>`;

  constructor() {
    super();
    this.attachInternals().role = "group";
  }

  update() {
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Status bar");
  }
}

const itemStyles = css`
  :host { display: inline-flex; min-width: 0; }
  .item {
    display: inline-flex;
    align-items: center;
    gap: var(--ray-space-1);
    min-width: 0;
    padding: 0 var(--ray-space-2);
    font: inherit;
    color: inherit;
    white-space: nowrap;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
  }
  .label { overflow: hidden; text-overflow: ellipsis; }
  button.item { cursor: pointer; }
  button.item:hover { color: var(--_item-hover-color, var(--ray-foreground)); background: var(--_item-hover, var(--ray-accent)); }
  :host([color]) .item { color: var(--_light-color); }
  .icon { display: inline-flex; }
  .icon:not([data-filled]) { display: none; }
  ::slotted(svg) { width: 0.875rem; height: 0.875rem; }
`;

export class RayStatusbarItem extends RayElement {
  static delegatesFocus = true;
  static properties = {
    action: { type: Boolean, reflect: true },
    color: { type: String, reflect: true },
    label: { type: String },
  };
  static styles = [itemStyles];

  update() {
    const tag = this.action ? "button" : "span";
    if (!this._el || this._el.localName !== tag) {
      this._el?.remove();
      const el = document.createElement(tag);
      el.className = "item focus-ring";
      el.setAttribute("part", "item");
      if (tag === "button") el.type = "button";
      el.innerHTML = `<span class="icon"><slot name="icon"></slot></span><span class="label"><slot></slot></span>`;
      const slot = el.querySelector('slot[name="icon"]');
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
      this.shadowRoot.append(el);
      this._el = el;
    }
    if (this.color) applyColor(this, this.color);
    // The label names a button whose content is only an icon or a short count.
    if (this.label) {
      this._el.setAttribute("aria-label", this.label);
      this._el.title = this.label;
    } else {
      this._el.removeAttribute("aria-label");
      this._el.removeAttribute("title");
    }
  }
}

define("ray-statusbar", RayStatusbar);
define("ray-statusbar-item", RayStatusbarItem);
