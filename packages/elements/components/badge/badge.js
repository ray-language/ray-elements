// <ray-badge>: a short status label.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, applyGradient, radiusStyles, variantStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    --_r: var(--ray-radius-full);
    --_h: 1.25rem;
    --_fs: 0.6875rem;
    --_px: 0.5rem;
  }
  :host([size="xs"]) { --_h: 1rem; --_fs: 0.5625rem; --_px: 0.375rem; }
  :host([size="md"]) { --_h: 1.5rem; --_fs: 0.75rem; --_px: 0.625rem; }
  :host([size="lg"]) { --_h: 1.875rem; --_fs: 0.875rem; --_px: 0.75rem; }
  :host([size="xl"]) { --_h: 2.25rem; --_fs: 1rem; --_px: 1rem; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--_px) / 2);
    height: var(--_h);
    padding: 0 var(--_px);
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-bold);
    letter-spacing: 0.25px;
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
    border-radius: var(--_r);
  }
  :host([normal-case]) .badge { text-transform: none; letter-spacing: 0; }
  .dot { display: none; width: 0.5em; height: 0.5em; border-radius: 50%; background: var(--_filled); }
  .badge[data-variant="dot"] {
    color: var(--ray-foreground);
    background: transparent;
    border-color: var(--ray-border);
  }
  .badge[data-variant="dot"] .dot { display: inline-block; }
`;

export class RayBadge extends RayElement {
  static properties = {
    variant: { type: String, reflect: true, default: "light" },
    color: { type: String, reflect: true },
    gradient: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    normalCase: { type: Boolean, reflect: true },
  };
  static styles = [radiusStyles, variantStyles, styles];
  static template = `<span class="badge" part="badge"><span class="dot" part="dot"></span><slot></slot></span>`;

  update() {
    const el = this.$(".badge");
    el.dataset.variant = this.variant || "light";
    applyColor(el, this.color);
    applyGradient(el, this.gradient);
  }
}

define("ray-badge", RayBadge);
