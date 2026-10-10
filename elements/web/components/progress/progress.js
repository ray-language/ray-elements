// <ray-progress>: a determinate or indeterminate progress bar.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, radiusStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: block;
    --_h: 0.5rem;
    --_r: var(--ray-radius-full);
  }
  :host([size="xs"]) { --_h: 0.1875rem; }
  :host([size="sm"]) { --_h: 0.3125rem; }
  :host([size="lg"]) { --_h: 0.75rem; }
  :host([size="xl"]) { --_h: 1rem; }
  .row { display: flex; align-items: center; gap: var(--ray-space-2); }
  .track {
    flex: 1;
    position: relative;
    height: var(--_h);
    overflow: hidden;
    background: var(--ray-muted);
    border-radius: var(--_r);
    box-shadow: inset 0 0 0 1px var(--ray-border);
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: var(--_pct, 0%);
    background: var(--_filled);
    border-radius: var(--_r);
    color: var(--_contrast);
    font-size: max(0.625rem, calc(var(--_h) * 0.7));
    font-weight: var(--ray-font-weight-semibold);
    line-height: 1;
    white-space: nowrap;
    transition: width var(--ray-duration-slow) var(--ray-easing-standard);
  }
  /* show-value on small bars: the value beside the track, not squeezed inside it. */
  .value {
    flex: none;
    min-width: 2.75em;
    text-align: right;
    font-size: var(--ray-font-size-xs);
    font-variant-numeric: tabular-nums;
    color: var(--ray-muted-foreground);
  }
  .value:empty { display: none; }
  :host([striped]) .bar {
    background-image: linear-gradient(45deg, rgb(255 255 255 / 0.18) 25%, transparent 25%, transparent 50%, rgb(255 255 255 / 0.18) 50%, rgb(255 255 255 / 0.18) 75%, transparent 75%);
    background-size: 1rem 1rem;
  }
  :host([animated]) .bar { animation: ray-stripes 1s linear infinite; }
  @keyframes ray-stripes { from { background-position: 1rem 0; } to { background-position: 0 0; } }
  .track[data-indeterminate] .bar {
    position: absolute;
    width: 40%;
    animation: ray-indeterminate 1.4s var(--ray-easing-standard) infinite;
  }
  @keyframes ray-indeterminate { from { left: -40%; } to { left: 100%; } }
`;

export class RayProgress extends RayElement {
  static properties = {
    value: { type: Number },
    max: { type: Number, default: 100 },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    radius: { type: String, reflect: true },
    striped: { type: Boolean, reflect: true },
    animated: { type: Boolean, reflect: true },
    label: { type: String },
    showValue: { type: Boolean, reflect: true },
  };
  static styles = [radiusStyles, styles];
  static template = `<div class="row"><div class="track" part="track"><div class="bar" part="bar"></div></div><span class="value" part="value" aria-hidden="true"></span></div>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "progressbar";
  }

  update() {
    const track = this.$(".track");
    const bar = this.$(".bar");
    applyColor(track, this.color);
    const max = this.max > 0 ? this.max : 100;
    const indeterminate = this.value === undefined || this.value === null || Number.isNaN(this.value);
    track.toggleAttribute("data-indeterminate", indeterminate);
    const pct = indeterminate ? 0 : Math.min(100, Math.max(0, (this.value / max) * 100));
    track.style.setProperty("--_pct", `${pct}%`);
    const text = this.showValue && !indeterminate ? `${Math.round(pct)}%` : "";
    // Inside the bar only when it is tall enough to hold text (lg, xl).
    const inside = this.size === "lg" || this.size === "xl";
    bar.textContent = inside ? text : "";
    this.$(".value").textContent = inside ? "" : text;
    const i = this.internals;
    i.ariaValueMin = "0";
    i.ariaValueMax = String(max);
    i.ariaValueNow = indeterminate ? null : String(this.value);
    i.ariaValueText = indeterminate ? null : `${Math.round(pct)}%`;
    i.ariaLabel = this.label || this.getAttribute("aria-label") || "Progress";
  }
}

define("ray-progress", RayProgress);
