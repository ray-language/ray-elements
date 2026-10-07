// <ray-icon-button>: a square button for an icon (Mantine's ActionIcon).
// The icon goes in the default slot; `label` is its accessible name.

import { css, define } from "../../core/core.js";
import { RayButton } from "../button/button.js";

const styles = css`
  .button { width: var(--_h); padding: 0; }
  .label { font-size: calc(var(--_fs) * 1.15); }
  ::slotted(svg) { width: 1.15em; height: 1.15em; }
`;

export class RayIconButton extends RayButton {
  static properties = {
    ...RayButton.properties,
    variant: { type: String, reflect: true, default: "subtle" },
    label: { type: String, reflect: true },
  };
  static styles = [...RayButton.styles, styles];

  update() {
    super.update();
    if (this.label) {
      this._el.setAttribute("aria-label", this.label);
      this._el.title = this.label;
    }
  }
}

define("ray-icon-button", RayIconButton);
