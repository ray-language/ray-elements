// <ray-tooltip label="…">: a short hint shown on hover and focus of its
// child. The label also becomes the child's accessible description.

import { css, define, uid } from "../../core/core.js";
import { Floating, floatingStyles } from "../../core/floating.js";
import { applyColor } from "../../core/styles.js";

const styles = css`
  :host { display: inline-flex; }
  .panel {
    max-width: 20rem;
    padding: var(--ray-space-1) var(--ray-space-2);
    font-size: var(--ray-font-size-xs);
    line-height: var(--ray-line-height-sm);
    color: var(--ray-background);
    background: var(--ray-foreground);
    border: 0;
    border-radius: var(--ray-radius-sm);
    box-shadow: var(--ray-shadow-sm);
    pointer-events: none;
    white-space: normal;
    overflow: visible;
  }
  .panel[data-colored] { color: var(--_contrast); background: var(--_filled); }
`;

export class RayTooltip extends Floating {
  static properties = {
    ...Floating.properties,
    label: { type: String },
    placement: { type: String, reflect: true, default: "top" },
    offset: { type: Number, default: 6 },
    openDelay: { type: Number, default: 300 },
    closeDelay: { type: Number, default: 0 },
    color: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [floatingStyles, styles];
  static popoverMode = "manual";
  static lightDismiss = false;
  static haspopup = null;
  static triggerSlot = "slot:not([name])";
  static template = `<slot></slot><div class="panel" part="tooltip" role="tooltip"></div>`;

  constructor() {
    super();
    this._open = () => this._schedule(true);
    this._close = () => this._schedule(false);
    this._esc = (e) => { if (e.key === "Escape") this._schedule(false, 0); };
  }

  wireTrigger(t) {
    // The description lives in the light DOM (an unassigned, unrendered child)
    // so the trigger can reference it by id.
    if (!this._desc) {
      this._desc = document.createElement("span");
      this._desc.slot = "description";
      this._desc.id = uid("tooltip");
      this._desc.hidden = true;
      this.append(this._desc);
    }
    const ids = new Set((t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    ids.add(this._desc.id);
    t.setAttribute("aria-describedby", [...ids].join(" "));
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerenter", this._open);
    this.addEventListener("pointerleave", this._close);
    this.addEventListener("focusin", this._open);
    this.addEventListener("focusout", this._close);
    this.addEventListener("pointerdown", this._close);
    document.addEventListener("keydown", this._esc);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._esc);
    clearTimeout(this._timer);
  }

  update(changed) {
    this.panel.textContent = this.label ?? "";
    if (this._desc) this._desc.textContent = this.label ?? "";
    this.panel.toggleAttribute("data-colored", Boolean(this.color));
    if (this.color) applyColor(this.panel, this.color);
    if ((this.disabled || !this.label) && this.open) this.commitProperty("open", false);
    super.update(changed);
  }

  _schedule(open, delay = open ? this.openDelay : this.closeDelay) {
    clearTimeout(this._timer);
    if (open && (this.disabled || !this.label)) return;
    const apply = () => { this.open = open; };
    if (delay > 0) this._timer = setTimeout(apply, delay);
    else apply();
  }
}

define("ray-tooltip", RayTooltip);
