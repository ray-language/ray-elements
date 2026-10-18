// <ray-ring-progress>: progress as a ring (Mantine's RingProgress), with
// room in the middle for content (a countdown's clock, a percentage).
//
// The arc is a stroke-dasharray on a circle with pathLength=100, drawn from
// 12 o'clock clockwise; r is a CSS length (half the box minus half the
// stroke), so any size and thickness need no viewBox arithmetic.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const SIZES = { xs: "3rem", sm: "5rem", md: "7.5rem", lg: "10rem", xl: "12.5rem" };

const styles = css`
  :host {
    --_d: 7.5rem;
    --_t: calc(var(--_d) / 10);
    position: relative;
    display: inline-grid;
    vertical-align: middle;
    width: var(--_d);
    height: var(--_d);
    flex: none;
  }
  svg {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    overflow: visible;
    transform: rotate(-90deg);
  }
  circle {
    cx: 50%;
    cy: 50%;
    r: calc(50% - var(--_t) / 2);
    fill: none;
    stroke-width: var(--_t);
  }
  .track { stroke: var(--ray-muted); }
  .bar {
    stroke: var(--_filled);
    stroke-dasharray: var(--_pct, 0) 100;
    transition: stroke-dasharray var(--ray-duration-slow) var(--ray-easing-standard);
  }
  :host([round-caps]) .bar { stroke-linecap: round; }
  /* A round cap draws a dot at 0. */
  .bar[data-empty] { visibility: hidden; }
  svg[data-indeterminate] { animation: ray-ring-spin 1.2s linear infinite; }
  svg[data-indeterminate] .bar { --_pct: 25; transition: none; }
  @keyframes ray-ring-spin { from { transform: rotate(-90deg); } to { transform: rotate(270deg); } }
  .center {
    grid-area: 1 / 1;
    display: grid;
    place-items: center;
    padding: calc(var(--_t) * 1.5);
    min-width: 0;
    text-align: center;
    font-size: max(var(--ray-font-size-xs), calc(var(--_d) * 0.16));
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .value { font-weight: var(--ray-font-weight-semibold); }
  .value:empty { display: none; }
`;

export class RayRingProgress extends RayElement {
  static properties = {
    value: { type: Number },
    max: { type: Number, default: 100 },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    thickness: { type: String, reflect: true },
    roundCaps: { type: Boolean, reflect: true, attribute: "round-caps" },
    showValue: { type: Boolean, reflect: true, attribute: "show-value" },
    label: { type: String },
  };
  static styles = [styles];
  static template = `<svg aria-hidden="true"><circle class="track" part="track" pathLength="100"></circle><circle class="bar" part="bar" pathLength="100"></circle></svg><div class="center" part="center"><slot></slot><span class="value" aria-hidden="true"></span></div>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "progressbar";
  }

  update() {
    const svg = this.$("svg");
    const bar = this.$(".bar");
    applyColor(svg, this.color);
    // size: xs…xl or a length; thickness: a length (a bare number is px).
    const d = SIZES[this.size] ?? this.size ?? "";
    if (d) this.style.setProperty("--_d", d);
    else this.style.removeProperty("--_d");
    const t = this.thickness ? (/^\d*\.?\d+$/.test(this.thickness) ? `${this.thickness}px` : this.thickness) : "";
    if (t) this.style.setProperty("--_t", t);
    else this.style.removeProperty("--_t");

    const max = this.max > 0 ? this.max : 100;
    const indeterminate = this.value === undefined || this.value === null || Number.isNaN(this.value);
    svg.toggleAttribute("data-indeterminate", indeterminate);
    const pct = indeterminate ? 0 : Math.min(100, Math.max(0, (this.value / max) * 100));
    bar.style.setProperty("--_pct", String(pct));
    bar.toggleAttribute("data-empty", !indeterminate && pct === 0);
    // The percentage in the middle only when the app puts nothing there.
    const empty = this.$("slot").assignedNodes().every((n) => n.nodeType === Node.TEXT_NODE && !n.textContent.trim());
    this.$(".value").textContent = this.showValue && !indeterminate && empty ? `${Math.round(pct)}%` : "";

    const i = this.internals;
    i.ariaValueMin = "0";
    i.ariaValueMax = String(max);
    i.ariaValueNow = indeterminate ? null : String(this.value);
    i.ariaValueText = indeterminate ? null : `${Math.round(pct)}%`;
    i.ariaLabel = this.label || this.getAttribute("aria-label") || "Progress";
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this._wired) {
      this._wired = true;
      this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
    }
  }
}

define("ray-ring-progress", RayRingProgress);
