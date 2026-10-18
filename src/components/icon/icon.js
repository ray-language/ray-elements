// <ray-icon name="…">: an icon of the registry (setIcons), so the app's own
// markup uses the same set as the components. Decorative unless `label`.
// `filled` draws the icon's filled version (a state: active, selected,
// favorite), or the outline one when it has none.

import { RayElement, css, define } from "../../core/core.js";

const SIZES = { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.25rem", xl: "1.5rem" };

const styles = css`
  /* --_size is set here, not only read: private custom properties inherit
     through shadow roots, and an ancestor's own --_size (ray-split's pane
     size) must not reach the icon. size= overrides it inline. */
  :host { --_size: 1em; display: inline-flex; vertical-align: -0.125em; line-height: 1; }
  .icon svg { width: var(--_size); height: var(--_size); }
`;

export class RayIcon extends RayElement {
  static properties = {
    name: { type: String, reflect: true },
    size: { type: String, reflect: true },
    label: { type: String },
    color: { type: String, reflect: true },
    stroke: { type: Number },
    filled: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<span class="icon" part="icon" data-ray-icon=""></span>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  update() {
    const icon = this.$(".icon");
    const filled = Boolean(this.filled);
    if (icon.getAttribute("data-ray-icon") !== (this.name ?? "") || icon.hasAttribute("data-ray-icon-filled") !== filled) {
      icon.setAttribute("data-ray-icon", this.name ?? "");
      icon.toggleAttribute("data-ray-icon-filled", filled);
      this.paintIcons();
    }
    // xs…xl from the scale, or any CSS length.
    const size = this.size ? (SIZES[this.size] ?? this.size) : "";
    if (size) this.style.setProperty("--_size", size);
    else this.style.removeProperty("--_size");
    // A palette color (red), the primary, or any CSS color.
    if (this.color) {
      const value = /^[a-z]+$/.test(this.color) && this.color !== "currentcolor" ? `var(--ray-${this.color}-light-color, ${this.color})` : this.color;
      this.style.color = value;
    } else {
      this.style.removeProperty("color");
    }
    if (this.stroke) this.style.setProperty("--ray-icon-stroke", String(this.stroke));
    else this.style.removeProperty("--ray-icon-stroke");
    // Named: an image; otherwise hidden from assistive technology.
    this.internals.role = this.label ? "img" : null;
    this.internals.ariaLabel = this.label || null;
    this.internals.ariaHidden = this.label ? null : "true";
  }
}

define("ray-icon", RayIcon);
