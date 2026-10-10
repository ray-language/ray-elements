// <ray-separator>: a horizontal or vertical rule, optionally with a label
// (Mantine's Divider).

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    display: block;
    --_color: var(--ray-border);
    --_w: 1px;
    --_style: solid;
  }
  :host([size="sm"]) { --_w: 2px; }
  :host([size="md"]) { --_w: 3px; }
  :host([size="lg"]) { --_w: 4px; }
  :host([size="xl"]) { --_w: 5px; }
  :host([variant="dashed"]) { --_style: dashed; }
  :host([variant="dotted"]) { --_style: dotted; }
  :host([orientation="vertical"]) { display: inline-block; align-self: stretch; height: auto; min-height: 1em; vertical-align: middle; }
  .line { border-top: var(--_w) var(--_style) var(--_color); }
  :host([orientation="vertical"]) .line { height: 100%; border-top: 0; border-left: var(--_w) var(--_style) var(--_color); }
  .labeled {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    font-size: var(--ray-font-size-xs);
    color: var(--ray-muted-foreground);
  }
  .labeled::before, .labeled::after { content: ""; flex: 1; border-top: var(--_w) var(--_style) var(--_color); }
  :host([label-position="left"]) .labeled::before { flex: 0 0 var(--ray-space-3); }
  :host([label-position="right"]) .labeled::after { flex: 0 0 var(--ray-space-3); }
  [hidden] { display: none !important; }
`;

export class RaySeparator extends RayElement {
  static properties = {
    orientation: { type: String, reflect: true, default: "horizontal" },
    label: { type: String, reflect: true },
    labelPosition: { type: String, reflect: true, default: "center" },
    size: { type: String, reflect: true, default: "xs" },
    variant: { type: String, reflect: true, default: "solid" },
  };
  static styles = [styles];
  static template = `<div class="line" part="line"></div><div class="labeled" part="label" hidden></div>`;

  update() {
    const vertical = this.orientation === "vertical";
    this.setAttribute("role", "separator");
    this.setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
    const labeled = this.$(".labeled");
    const showLabel = Boolean(this.label) && !vertical;
    labeled.hidden = !showLabel;
    labeled.textContent = this.label ?? "";
    this.$(".line").hidden = showLabel;
  }
}

define("ray-separator", RaySeparator);
