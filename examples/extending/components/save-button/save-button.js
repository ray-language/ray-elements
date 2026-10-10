// Level 1 — extend a component: <app-save-button> is a ray-button (variants,
// sizes, loading, form submit, ARIA…) with a `dirty` state of its own.

import { RayButton, css, define } from "@raylang/elements";

const styles = css`
  .dot {
    display: none;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--ray-warning);
  }
  :host([dirty]) .dot { display: inline-block; }
`;

export class AppSaveButton extends RayButton {
  static properties = {
    ...RayButton.properties,
    dirty: { type: Boolean, reflect: true },
  };
  static styles = [...RayButton.styles, styles];

  update(changed) {
    super.update(changed); // everything ray-button does
    // The inner button is (re)built by ray-button: add the dot once per element.
    const button = this.shadowRoot.querySelector('[part="button"]');
    if (!button.querySelector(".dot")) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("aria-hidden", "true");
      button.prepend(dot);
    }
    if (this.dirty) button.setAttribute("aria-description", "Unsaved changes");
    else button.removeAttribute("aria-description");
  }
}

define("app-save-button", AppSaveButton);
