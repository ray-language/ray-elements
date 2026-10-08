// <ray-stack>: its children in a column, spaced by the space scale
// (Mantine's Stack). <ray-group>: the same in a row.

import { RayElement, css, define } from "../../core/core.js";
import { spaceValue } from "../../core/styles.js";

const ALIGN = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch", baseline: "baseline" };
const JUSTIFY = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between", "space-around": "space-around", "space-evenly": "space-evenly" };

const styles = css`
  :host {
    --_gap: var(--ray-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--_gap);
    align-items: var(--_align, stretch);
    justify-content: var(--_justify, flex-start);
    min-width: 0;
  }
  :host([hidden]) { display: none; }
`;

/** Gap, align and justify onto the host's custom properties. */
export function applyFlex(el, { gap, align, justify }, alignDefault) {
  const g = spaceValue(gap);
  if (g) el.style.setProperty("--_gap", g);
  else el.style.removeProperty("--_gap");
  el.style.setProperty("--_align", ALIGN[align] ?? alignDefault);
  el.style.setProperty("--_justify", JUSTIFY[justify] ?? "flex-start");
}

export class RayStack extends RayElement {
  static properties = {
    gap: { type: String, reflect: true, default: "md" },
    align: { type: String, reflect: true, default: "stretch" },
    justify: { type: String, reflect: true, default: "start" },
  };
  static styles = [styles];
  static template = `<slot></slot>`;

  update() {
    applyFlex(this, this, "stretch");
  }
}

define("ray-stack", RayStack);
