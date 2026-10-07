// <ray-aspect-ratio>: a box with a fixed width/height ratio; its media
// (img, video, iframe, any element) fills it.

import { RayElement, css, define } from "../../core/core.js";

const RADII = ["xs", "sm", "md", "lg", "xl", "full"];

const styles = css`
  /* Defaults set on the host: an ancestor's private --_r (a card's or a
     button's radius) would otherwise inherit into it. */
  :host {
    --_ratio: 16 / 9;
    --_r: 0;
    display: block;
    position: relative;
    overflow: hidden;
    aspect-ratio: var(--_ratio);
    border-radius: var(--_r);
  }
  :host([hidden]) { display: none; }
  ::slotted(*) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  :host([fit="contain"]) ::slotted(*) { object-fit: contain; }
`;

/** "16/9", "16:9", "1.5", 2 -> a CSS aspect-ratio value ("16 / 9"); null if invalid. */
export function parseRatio(value) {
  const s = String(value ?? "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)$/);
  if (m && Number(m[2]) > 0) return `${Number(m[1])} / ${Number(m[2])}`;
  const n = Number(s);
  return s && Number.isFinite(n) && n > 0 ? String(n) : null;
}

export class RayAspectRatio extends RayElement {
  static properties = {
    ratio: { type: String, reflect: true, default: "16/9" },
    fit: { type: String, reflect: true, default: "cover" },
    radius: { type: String, reflect: true },
  };
  static styles = [styles];
  static template = `<slot></slot>`;

  update() {
    const r = parseRatio(this.ratio);
    if (r) this.style.setProperty("--_ratio", r);
    else this.style.removeProperty("--_ratio");
    const rad = this.radius;
    if (rad) this.style.setProperty("--_r", RADII.includes(rad) ? `var(--ray-radius-${rad})` : rad);
    else this.style.removeProperty("--_r");
  }
}

define("ray-aspect-ratio", RayAspectRatio);
