// <ray-button-group>: buttons (and fields, menus…) joined into one control
// (Mantine's Button.Group, shadcn's ButtonGroup). The group squares off the
// inner corners of its children through inherited custom properties
// (--ray-group-radius-*, read by ray-button, ray-icon-button and the field
// boxes) and overlaps their borders.

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host { display: inline-flex; vertical-align: middle; isolation: isolate; }
  :host([orientation="vertical"]) { flex-direction: column; }
  :host([full-width]) { display: flex; }
  :host([full-width]) ::slotted(*) { flex: 1; }
  ::slotted(*) { position: relative; }
  /* The hovered or focused child on top: its whole border shows. */
  ::slotted(:hover) { z-index: 1; }
  /* A pressed toggle's colored border must not hide under its neighbors,
     nor flicker as the pointer moves over them. */
  ::slotted([pressed]) { z-index: 2; }
  ::slotted(:focus-within), ::slotted(:focus) { z-index: 3; }

  /* Horizontal: square the inside corners, overlap the 1px borders. */
  :host(:not([orientation="vertical"])) ::slotted(:not(:first-child)) {
    margin-inline-start: -1px;
    --ray-group-radius-ss: 0px;
    --ray-group-radius-es: 0px;
  }
  :host(:not([orientation="vertical"])) ::slotted(:not(:last-child)) {
    --ray-group-radius-se: 0px;
    --ray-group-radius-ee: 0px;
  }
  /* Vertical: the same on the block axis. */
  :host([orientation="vertical"]) ::slotted(:not(:first-child)) {
    margin-block-start: -1px;
    --ray-group-radius-ss: 0px;
    --ray-group-radius-se: 0px;
  }
  :host([orientation="vertical"]) ::slotted(:not(:last-child)) {
    --ray-group-radius-es: 0px;
    --ray-group-radius-ee: 0px;
  }
  /* Filled buttons have no border to overlap: a thin divider instead. */
  :host(:not([orientation="vertical"])) ::slotted(ray-button[variant="filled"]:not(:first-child)),
  :host(:not([orientation="vertical"])) ::slotted(ray-button:not([variant]):not(:first-child)),
  :host(:not([orientation="vertical"])) ::slotted(ray-menu:not(:first-child)) {
    box-shadow: -1px 0 0 0 color-mix(in srgb, var(--ray-background) 35%, transparent);
  }
`;

export class RayButtonGroup extends RayElement {
  static properties = {
    orientation: { type: String, reflect: true, default: "horizontal" },
    fullWidth: { type: Boolean, reflect: true },
    label: { type: String },
  };
  static styles = [styles];
  static template = `<slot></slot>`;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  update() {
    if (this.label) this.setAttribute("aria-label", this.label);
    // role=group takes no aria-orientation (ARIA allows it on toolbars,
    // sliders, separators…): the orientation shows, it is not announced.
    this.removeAttribute("aria-orientation");
  }
}

define("ray-button-group", RayButtonGroup);
