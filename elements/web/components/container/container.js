// <ray-container>: its content centered, up to a maximum width, with side
// padding (Mantine's Container). `fluid` drops the maximum.

import { RayElement, css, define } from "../../core/core.js";
import { spaceValue } from "../../core/styles.js";

export const CONTAINER_SIZES = { xs: "33.75rem", sm: "45rem", md: "60rem", lg: "71.25rem", xl: "82.5rem" };

const styles = css`
  :host {
    --_max: ${CONTAINER_SIZES.md};
    --_px: var(--ray-space-md);
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: var(--_max);
    margin-inline: auto;
    padding-inline: var(--_px);
  }
  :host([hidden]) { display: none; }
  :host([fluid]) { max-width: none; }
`;

export class RayContainer extends RayElement {
  static properties = {
    size: { type: String, reflect: true, default: "md" },
    padding: { type: String, reflect: true, default: "md" },
    fluid: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<slot></slot>`;

  update() {
    this.style.setProperty("--_max", CONTAINER_SIZES[this.size] ?? (this.size || CONTAINER_SIZES.md));
    const px = spaceValue(this.padding);
    if (px) this.style.setProperty("--_px", px);
    else this.style.removeProperty("--_px");
  }
}

define("ray-container", RayContainer);
