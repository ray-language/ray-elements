// <ray-spinner>: an indeterminate loading indicator (Mantine's Loader).

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, loaderStyles, srOnlyStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    --_loader: 2.25rem;
  }
  :host([size="xs"]) { --_loader: 1.125rem; }
  :host([size="sm"]) { --_loader: 1.375rem; }
  :host([size="lg"]) { --_loader: 2.75rem; }
  :host([size="xl"]) { --_loader: 3.625rem; }
  .loader { color: var(--_filled); }
`;

export class RaySpinner extends RayElement {
  static properties = {
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    label: { type: String, default: "Loading" },
  };
  static styles = [loaderStyles, srOnlyStyles, styles];
  static template = `<span class="loader" part="spinner"></span><span class="sr-only"></span>`;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
  }

  update() {
    applyColor(this.$(".loader"), this.color);
    this.$(".sr-only").textContent = this.label;
  }
}

define("ray-spinner", RaySpinner);
