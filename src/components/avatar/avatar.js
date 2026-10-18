// <ray-avatar>: an image, the initials of `name`, or a placeholder icon.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, radiusStyles, variantStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    --_size: 2.375rem;
    --_r: var(--ray-radius-full);
  }
  :host([size="xs"]) { --_size: 1rem; }
  :host([size="sm"]) { --_size: 1.625rem; }
  :host([size="lg"]) { --_size: 3.5rem; }
  :host([size="xl"]) { --_size: 5.25rem; }
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_size);
    height: var(--_size);
    overflow: hidden;
    font-size: calc(var(--_size) * 0.4);
    font-weight: var(--ray-font-weight-bold);
    line-height: 1;
    user-select: none;
    border-radius: var(--_r);
  }
  img { width: 100%; height: 100%; object-fit: cover; }
  .initials svg { width: calc(var(--_size) * 0.6); height: calc(var(--_size) * 0.6); }
  [hidden] { display: none !important; }
`;

const PLACEHOLDER = `<span data-ray-icon="ui.avatar" aria-hidden="true"></span>`;

/** Up to two initials: "Ada Lovelace" -> "AL", "ray" -> "R". */
export function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = [...words[0]][0] ?? "";
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export class RayAvatar extends RayElement {
  static properties = {
    src: { type: String, reflect: true },
    alt: { type: String, reflect: true },
    name: { type: String, reflect: true },
    color: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "light" },
    size: { type: String, reflect: true, default: "md" },
    radius: { type: String, reflect: true },
  };
  static styles = [radiusStyles, variantStyles, styles];
  static template = `<span class="avatar" part="avatar"><img part="image" alt="" hidden><span class="initials" part="initials"></span><slot></slot></span>`;

  connectedCallback() {
    super.connectedCallback();
    if (!this._wired) {
      this._wired = true;
      this.$("img").addEventListener("error", () => {
        this._failed = this.src;
        this.requestUpdate();
      });
    }
  }

  update() {
    const box = this.$(".avatar");
    box.dataset.variant = this.variant || "light";
    applyColor(box, this.color);
    const img = this.$("img");
    const showImage = Boolean(this.src) && this._failed !== this.src;
    img.hidden = !showImage;
    if (showImage && img.getAttribute("src") !== this.src) img.src = this.src;
    const text = initials(this.name);
    const span = this.$(".initials");
    span.hidden = showImage;
    if (!showImage) {
      if (text) span.textContent = text;
      else {
        span.innerHTML = PLACEHOLDER;
        this.paintIcons(span);
      }
    }
    // The host carries the accessible name.
    const label = this.alt || this.name;
    this.setAttribute("role", "img");
    if (label) this.setAttribute("aria-label", label);
    else this.removeAttribute("aria-label");
  }
}

define("ray-avatar", RayAvatar);
