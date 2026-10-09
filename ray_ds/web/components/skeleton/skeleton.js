// <ray-skeleton>: a placeholder shown while content loads (Mantine's
// Skeleton). A shimmering block, a circle, or a few text lines; with the
// `loaded` attribute it shows its slotted content instead.

import { RayElement, css, define } from "../../core/core.js";

const RADII = ["xs", "sm", "md", "lg", "xl", "full"];

const styles = css`
  :host {
    display: block;
    --_w: 100%;
    --_h: 1rem;
    --_r: var(--ray-radius-sm);
    /* Visible on the page and on cards in both schemes; the sweep moves
       toward the background color. */
    --_base: color-mix(in srgb, var(--ray-muted) 45%, var(--ray-border));
    --_shine: color-mix(in srgb, var(--_base) 45%, var(--ray-background));
  }
  :host([hidden]) { display: none; }
  :host([circle]) { --_r: 50%; --_w: 2.5rem; }
  :host([circle]) { width: max-content; }
  .bones { display: grid; gap: var(--ray-space-2); width: var(--_w); }
  .bone {
    height: var(--_h);
    border-radius: var(--_r);
    background: var(--_base);
  }
  :host([circle]) .bones { width: var(--_w); }
  :host([circle]) .bone { width: var(--_w); height: var(--_w); }
  :host([lines]) .bone:last-child:not(:first-child) { width: 70%; }
  /* animation: shimmer (default) | pulse | none. Not "animate": that would
     shadow Element.prototype.animate(). */
  :host(:not([animation])) .bone, :host([animation="shimmer"]) .bone {
    background: linear-gradient(90deg, var(--_base) 25%, var(--_shine) 50%, var(--_base) 75%) 0 0 / 300% 100%;
    animation: ray-skeleton-shine 1.6s var(--ray-easing-standard) infinite;
  }
  :host([animation="pulse"]) .bone { animation: ray-skeleton-pulse 1.6s var(--ray-easing-standard) infinite; }
  @keyframes ray-skeleton-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
  @keyframes ray-skeleton-pulse { 50% { opacity: 0.45; } }
  @media (prefers-reduced-motion: reduce) {
    .bone { animation: none !important; background: var(--_base) !important; }
  }
  .content { display: none; }
  :host([loaded]) .bones { display: none; }
  :host([loaded]) .content { display: contents; }
`;

const length = (v) => (/^-?\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : String(v));

export class RaySkeleton extends RayElement {
  static properties = {
    width: { type: String },
    height: { type: String },
    radius: { type: String, reflect: true },
    circle: { type: Boolean, reflect: true },
    lines: { type: Number, reflect: true },
    animation: { type: String, reflect: true },
    loaded: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<div class="bones" part="skeleton" aria-hidden="true"></div><div class="content"><slot></slot></div>`;

  update() {
    const s = this.style;
    // A circle's diameter: width, else height.
    const w = this.width || (this.circle ? this.height : "");
    if (w) s.setProperty("--_w", length(w));
    else s.removeProperty("--_w");
    if (this.height) s.setProperty("--_h", length(this.height));
    else s.removeProperty("--_h");
    if (this.radius && !this.circle) s.setProperty("--_r", RADII.includes(this.radius) ? `var(--ray-radius-${this.radius})` : length(this.radius));
    else s.removeProperty("--_r");
    const n = this.circle ? 1 : Math.max(1, Math.floor(this.lines || 1));
    const bones = this.$(".bones");
    if (bones.children.length !== n) {
      bones.replaceChildren(...Array.from({ length: n }, () => {
        const b = document.createElement("div");
        b.className = "bone";
        b.setAttribute("part", "bone");
        return b;
      }));
    }
    // Screen readers: busy while the placeholder stands in for the content.
    if (this.loaded) this.removeAttribute("aria-busy");
    else this.setAttribute("aria-busy", "true");
  }
}

define("ray-skeleton", RaySkeleton);
