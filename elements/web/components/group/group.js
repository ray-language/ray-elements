// <ray-group>: its children in a row (Mantine's Group): spaced by the space
// scale, centered on the cross axis, wrapping when they do not fit. `grow`
// shares the width among them; `nowrap` keeps them on one line.

import { RayElement, css, define } from "../../core/core.js";
import { applyFlex } from "../stack/stack.js";

const styles = css`
  :host {
    --_gap: var(--ray-space-md);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--_gap);
    align-items: var(--_align, center);
    justify-content: var(--_justify, flex-start);
    min-width: 0;
  }
  :host([hidden]) { display: none; }
  :host([nowrap]) { flex-wrap: nowrap; }
  :host([grow]) ::slotted(*) { flex: 1 1 0; min-width: 0; }
`;

export class RayGroup extends RayElement {
  static properties = {
    gap: { type: String, reflect: true, default: "md" },
    align: { type: String, reflect: true, default: "center" },
    justify: { type: String, reflect: true, default: "start" },
    nowrap: { type: Boolean, reflect: true },
    grow: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<slot></slot>`;

  update() {
    applyFlex(this, this, "center");
  }
}

define("ray-group", RayGroup);
