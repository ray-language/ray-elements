// <ray-stat>: a metric tile — label, big value, change against a previous
// period and a note (the tiles of rayauth's dashboard).

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host { display: block; }
  .root {
    display: grid;
    gap: var(--ray-space-1);
    padding: var(--ray-space-md);
    color: var(--ray-card-foreground);
    background: var(--ray-card);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
  }
  :host([plain]) .root { padding: 0; border: 0; background: transparent; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: var(--ray-space-2); }
  .label { font-size: var(--ray-font-size-xs); font-weight: var(--ray-font-weight-semibold); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ray-muted-foreground); }
  .icon { display: inline-flex; color: var(--ray-muted-foreground); }
  ::slotted(svg) { width: 1.25rem; height: 1.25rem; }
  .line { display: flex; align-items: baseline; flex-wrap: wrap; gap: var(--ray-space-2); }
  .value { font-size: var(--ray-font-size-2xl); font-weight: var(--ray-font-weight-bold); line-height: var(--ray-line-height-tight); font-variant-numeric: tabular-nums; }
  .diff { display: inline-flex; align-items: center; gap: 0.125rem; font-size: var(--ray-font-size-sm); font-weight: var(--ray-font-weight-semibold); }
  .diff[data-trend="up"] { color: var(--ray-success); }
  .diff[data-trend="down"] { color: var(--ray-destructive); }
  .diff[data-trend="flat"] { color: var(--ray-muted-foreground); }
  :host([inverse]) .diff[data-trend="up"] { color: var(--ray-destructive); }
  :host([inverse]) .diff[data-trend="down"] { color: var(--ray-success); }
  .diff { --ray-icon-stroke: 2.5; }
  .diff svg { width: 0.875rem; height: 0.875rem; }
  .note { font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  [hidden] { display: none !important; }
`;

// Icon of each trend (from the icon registry).
const ARROWS = { up: "arrow-up-right", down: "arrow-down-right", flat: "minus" };

export class RayStat extends RayElement {
  static properties = {
    label: { type: String },
    value: { type: String },
    diff: { type: Number },
    diffUnit: { type: String, default: "%" },
    note: { type: String },
    inverse: { type: Boolean, reflect: true },
    plain: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="root" part="root">
      <div class="head"><span class="label" part="label"></span><span class="icon" part="icon"><slot name="icon"></slot></span></div>
      <div class="line"><span class="value" part="value"></span><span class="diff" part="diff" hidden></span></div>
      <div class="note" part="note" hidden></div>
      <slot></slot>
    </div>`;

  update() {
    this.$(".label").textContent = this.label ?? "";
    this.$(".value").textContent = this.value ?? "";
    const diff = this.$(".diff");
    const has = typeof this.diff === "number" && !Number.isNaN(this.diff);
    diff.hidden = !has;
    if (has) {
      const trend = this.diff > 0 ? "up" : this.diff < 0 ? "down" : "flat";
      diff.dataset.trend = trend;
      const sign = this.diff > 0 ? "+" : "";
      diff.innerHTML = `<span data-ray-icon="${ARROWS[trend]}" aria-hidden="true"></span>`;
      this.paintIcons(diff);
      diff.append(`${sign}${this.diff}${this.diffUnit ?? ""}`);
      diff.setAttribute("aria-label", `${trend === "up" ? "Up" : trend === "down" ? "Down" : "No change"} ${Math.abs(this.diff)}${this.diffUnit ?? ""}`);
    }
    const note = this.$(".note");
    note.hidden = !this.note;
    note.textContent = this.note ?? "";
  }
}

define("ray-stat", RayStat);
