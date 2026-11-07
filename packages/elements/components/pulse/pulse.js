// <ray-pulse>: an indeterminate wait indicator softer than ray-spinner: up to
// five circles, concentric or in a row, breathing or expanding from a point.
// Four presets (variant); count, shape, fade and direction override them.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, srOnlyStyles } from "../../core/styles.js";

export const MAX_COUNT = 5;

/**
 * The presets. `scale` is where a cycle starts (1 = the circle's full size),
 * `stagger` how much of the cycle separates one circle's phase from the next
 * (1 = spread evenly), `core` a static dot in the middle, `row` dots side by
 * side instead of concentric.
 */
export const PRESETS = {
  cluster: { count: 3, shape: "filled", fade: "none", direction: "alternate", scale: 0.7, stagger: 1 },
  breathe: { count: 2, shape: "filled", fade: "none", direction: "alternate", scale: 0.6, stagger: 0 },
  ripple: { count: 2, shape: "ring", fade: "out", direction: "normal", scale: 0.3, stagger: 1, core: true },
  dots: { count: 3, shape: "filled", fade: "out", direction: "alternate", scale: 0.6, stagger: 1, row: true },
};

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    --_pulse: 2.25rem;
    --_cycle: var(--ray-pulse-cycle, 1.6s);
    --_floor: var(--ray-pulse-floor, 0.2);
  }
  :host([size="xs"]) { --_pulse: 1.125rem; }
  :host([size="sm"]) { --_pulse: 1.375rem; }
  :host([size="lg"]) { --_pulse: 2.75rem; }
  :host([size="xl"]) { --_pulse: 3.625rem; }
  .pulse {
    display: inline-grid;
    place-items: center;
    width: var(--_pulse);
    height: var(--_pulse);
    color: var(--_filled);
  }
  .pulse.row {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--_pulse) * 0.16);
    width: auto;
  }
  .dot {
    grid-area: 1 / 1;
    display: block;
    flex: none;
    width: var(--_w);
    height: var(--_w);
    border-radius: 50%;
    background: currentColor;
    opacity: var(--_o, 1);
    animation: ray-pulse var(--_cycle) var(--_ease) infinite var(--_direction);
    /* Negative: every circle is already mid-cycle on the first frame. */
    animation-delay: calc(-1 * var(--_i) * var(--_cycle) * var(--_stagger) / var(--_n));
  }
  .ring > .dot { background: transparent; border: max(1.5px, calc(var(--_pulse) / 18)) solid currentColor; }
  /* Concentric filled circles: the larger, the fainter (else they merge into one). */
  .gradient > .dot { --_o: calc(1 - (1 - var(--_floor)) * var(--_i) / var(--_last)); }
  .core { --_w: 28%; animation: none; opacity: 1; background: currentColor; border: 0; }
  @keyframes ray-pulse {
    from { transform: scale(var(--_scale)); opacity: var(--_o, 1); }
    to { transform: scale(1); opacity: calc(var(--_o, 1) * var(--_fade-end)); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot { animation-duration: calc(var(--_cycle) * 2) !important; }
  }
`;

const clampCount = (n) => Math.max(1, Math.min(MAX_COUNT, Math.floor(n)));

export class RayPulse extends RayElement {
  static properties = {
    variant: { type: String, reflect: true, default: "cluster" },
    count: { type: Number, reflect: true },
    shape: { type: String, reflect: true },
    fade: { type: String, reflect: true },
    direction: { type: String, reflect: true },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    label: { type: String, default: "Loading" },
  };
  static styles = [srOnlyStyles, styles];
  static template = `<span class="pulse" part="pulse" aria-hidden="true"></span><span class="sr-only"></span>`;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
  }

  update() {
    const preset = PRESETS[this.variant] ?? PRESETS.cluster;
    const n = this.count > 0 ? clampCount(this.count) : preset.count;
    const shape = this.shape === "ring" || this.shape === "filled" ? this.shape : preset.shape;
    // `fade` alone (an empty attribute) means out; "none" switches a preset's off.
    const fade = this.fade == null ? preset.fade : this.fade === "none" ? "none" : "out";
    const direction = this.direction === "normal" || this.direction === "alternate" ? this.direction : preset.direction;
    const box = this.$(".pulse");
    applyColor(box, this.color);
    box.classList.toggle("row", !!preset.row);
    box.classList.toggle("ring", shape === "ring");
    box.classList.toggle("gradient", shape === "filled" && !preset.row);
    const s = box.style;
    s.setProperty("--_n", String(n));
    s.setProperty("--_last", String(Math.max(1, n - 1)));
    s.setProperty("--_scale", `var(--ray-pulse-scale, ${preset.scale})`);
    s.setProperty("--_stagger", `var(--ray-pulse-stagger, ${preset.stagger})`);
    s.setProperty("--_direction", direction);
    s.setProperty("--_fade-end", fade === "out" ? "0" : "1");
    s.setProperty("--_ease", direction === "normal" ? "cubic-bezier(0, 0.4, 0.5, 1)" : "ease-in-out");
    const key = `${n}:${preset.row ? "row" : "ring"}:${preset.core ? "core" : ""}`;
    if (box.dataset.key !== key) {
      box.dataset.key = key;
      const dots = [];
      // Largest first, so the smaller ones paint on top of it.
      for (let i = n - 1; i >= 0; i--) {
        const dot = document.createElement("i");
        dot.className = "dot";
        dot.setAttribute("part", "dot");
        dot.style.setProperty("--_i", String(i));
        dot.style.setProperty("--_w", preset.row ? "calc(var(--_pulse) * 0.28)" : `${Math.round(((i + 1) / n) * 100)}%`);
        dots.push(dot);
      }
      if (preset.core) {
        const core = document.createElement("i");
        core.className = "dot core";
        core.setAttribute("part", "dot core");
        dots.push(core);
      }
      box.replaceChildren(...dots);
    }
    this.$(".sr-only").textContent = this.label;
  }
}

define("ray-pulse", RayPulse);
