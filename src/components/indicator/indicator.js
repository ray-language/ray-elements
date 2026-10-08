// <ray-indicator>: a dot or a small label on the edge of any element
// (Mantine's Indicator): "New" on an avatar, an unread count on a bell, an
// online dot on a profile picture.
//
//   <ray-indicator label="New" offset="7"><ray-avatar …></ray-avatar></ray-indicator>
//
// It wraps its content as tight as it is (width: fit-content; inline for
// inline content) and places the indicator on one of nine points of its
// box, `offset` pixels inward. A numeric label over `max` shows "max+".

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const POSITIONS = ["top-start", "top-center", "top-end", "middle-start", "middle-center", "middle-end", "bottom-start", "bottom-center", "bottom-end"];
const RADII = ["xs", "sm", "md", "lg", "xl"];

const styles = css`
  :host { position: relative; display: block; width: fit-content; --_size: 10px; --_offset: 0px; }
  :host([inline]) { display: inline-block; vertical-align: middle; }
  .indicator {
    position: absolute;
    z-index: 1;
    top: var(--_top);
    left: var(--_left);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: var(--_size);
    height: var(--_size);
    color: var(--_contrast);
    background: var(--_filled);
    border-radius: var(--_radius, 999px);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .indicator[data-label] {
    height: auto;
    min-height: var(--_size);
    padding: 0.1875rem 0.4375rem;
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-semibold);
    line-height: 1;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  :host([with-border]) .indicator { box-shadow: 0 0 0 2px var(--ray-background); }
  :host([disabled]) .indicator { display: none; }
  /* processing: a ring that grows and fades, like a live signal. */
  :host([processing]) .indicator::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--_filled);
    animation: ray-indicator-pulse 1.4s var(--ray-easing-out) infinite;
    z-index: -1;
  }
  @keyframes ray-indicator-pulse {
    from { opacity: 0.6; transform: scale(1); }
    to { opacity: 0; transform: scale(2.6); }
  }
  @media (prefers-reduced-motion: reduce) {
    :host([processing]) .indicator::before { animation-duration: 2.8s; }
  }
`;

export class RayIndicator extends RayElement {
  static properties = {
    label: { type: String },
    position: { type: String, reflect: true, default: "top-end" },
    offset: { type: String },
    color: { type: String, reflect: true },
    size: { type: String },
    radius: { type: String, reflect: true },
    max: { type: Number },
    inline: { type: Boolean, reflect: true },
    withBorder: { type: Boolean, reflect: true },
    processing: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<slot></slot><span class="indicator" part="indicator"></span>`;

  update() {
    const dot = this.$(".indicator");
    applyColor(dot, this.color);
    // The label: text, or a count capped at max ("99+").
    let text = this.label ?? "";
    const n = Number(text);
    if (text !== "" && Number.isFinite(n) && this.max !== undefined && this.max !== null && n > this.max) text = `${this.max}+`;
    dot.textContent = text;
    dot.toggleAttribute("data-label", text !== "");
    // Where: one of nine points of the box, `offset` inward.
    const [v, h] = (POSITIONS.includes(this.position) ? this.position : "top-end").split("-");
    const off = "var(--_offset)";
    this.style.setProperty("--_top", v === "top" ? off : v === "middle" ? "50%" : `calc(100% - ${off})`);
    this.style.setProperty("--_left", h === "start" ? off : h === "center" ? "50%" : `calc(100% - ${off})`);
    const length = (x) => (x === undefined || x === null || x === "" ? null : /^-?\d+(\.\d+)?$/.test(String(x)) ? `${x}px` : String(x));
    const offset = length(this.offset);
    if (offset) this.style.setProperty("--_offset", offset);
    else this.style.removeProperty("--_offset");
    const size = length(this.size);
    if (size) this.style.setProperty("--_size", size);
    else this.style.removeProperty("--_size");
    const r = this.radius;
    if (r) dot.style.setProperty("--_radius", RADII.includes(r) ? `var(--ray-radius-${r})` : r === "none" ? "0" : r);
    else dot.style.removeProperty("--_radius");
  }
}

define("ray-indicator", RayIndicator);
