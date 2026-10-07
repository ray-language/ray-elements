// <ray-alert>: an inline message (Mantine's Alert) — title, text, an icon
// from the registry, the color variants, and an optional close button.

import { RayElement, css, define } from "../../core/core.js";
import { motionAllowed, collapseOut } from "../../core/motion.js";
import { applyColor, radiusStyles, variantStyles } from "../../core/styles.js";

// The icon a color gets when `icon` is not set (any registered name works).
const ICON_BY_COLOR = { blue: "info", cyan: "info", indigo: "info", green: "circle-check", teal: "circle-check", yellow: "alert-triangle", orange: "alert-triangle", red: "circle-x", pink: "circle-x" };

const styles = css`
  :host { display: block; }
  .alert {
    position: relative;
    display: flex;
    gap: var(--ray-space-3);
    padding: var(--ray-space-3) var(--ray-space-4);
    font-size: var(--ray-font-size-sm);
    border-radius: var(--_r);
  }
  .icon { flex: none; display: inline-flex; margin-top: 0.0625rem; }
  .icon svg { width: 1.25rem; height: 1.25rem; }
  .icon[hidden] { display: none; }
  .body { flex: 1; min-width: 0; }
  .title { margin: 0 0 0.125rem; font-weight: var(--ray-font-weight-bold); }
  .title:empty { display: none; }
  .text { color: inherit; line-height: var(--ray-line-height-sm); }
  [data-variant="light"] .text, [data-variant="outline"] .text, [data-variant="transparent"] .text { color: var(--ray-foreground); }
  [data-variant="default"] .icon { color: var(--_light-color); }
  .close {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    margin: -0.125rem -0.375rem 0 0;
    padding: 0;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
    opacity: 0.8;
  }
  .close:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
  .close svg { width: 1rem; height: 1rem; }
  .close[hidden] { display: none; }
`;

export class RayAlert extends RayElement {
  static properties = {
    label: { type: String },
    color: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "light" },
    radius: { type: String, reflect: true },
    icon: { type: String, reflect: true },
    closable: { type: Boolean, reflect: true },
    closeLabel: { type: String, default: "Dismiss" },
  };
  static styles = [radiusStyles, variantStyles, styles];
  static template = `
    <div class="alert" part="alert">
      <span class="icon" part="icon" aria-hidden="true"><slot name="icon"><span class="default-icon" data-ray-icon=""></span></slot></span>
      <div class="body">
        <p class="title" part="title"></p>
        <div class="text" part="text"><slot></slot></div>
      </div>
      <button class="close focus-ring" part="close" type="button" hidden><span data-ray-icon="close" aria-hidden="true"></span></button>
    </div>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "alert";
    this.$(".close").addEventListener("click", () => {
      if (!this.emit("ray-close", undefined, { cancelable: true })) return;
      if (!motionAllowed(this)) {
        this.hidden = true;
        return;
      }
      // Fade and fold away, then hide (content below moves up smoothly).
      const exit = collapseOut(this);
      exit.finished.then(() => {
        this.hidden = true;
        exit.cancel();
      });
    });
  }

  update() {
    const box = this.$(".alert");
    box.dataset.variant = this.variant || "light";
    applyColor(box, this.color);
    this.$(".title").textContent = this.label ?? "";
    const name = this.icon ?? ICON_BY_COLOR[this.color] ?? "info";
    const slotted = this.$('slot[name="icon"]').assignedNodes().length > 0;
    const def = this.$(".default-icon");
    if (def.getAttribute("data-ray-icon") !== name) {
      def.setAttribute("data-ray-icon", name);
      this.paintIcons(box);
    }
    // icon="none" hides it.
    this.$(".icon").hidden = this.icon === "none" && !slotted;
    const close = this.$(".close");
    close.hidden = !this.closable;
    close.setAttribute("aria-label", this.closeLabel ?? "Dismiss");
    this.internals.ariaLabel = this.label || null;
  }
}

define("ray-alert", RayAlert);
