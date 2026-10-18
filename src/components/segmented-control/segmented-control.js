// <ray-segmented-control>: one choice among a few, as a segmented button row
// with a sliding indicator (Mantine's SegmentedControl). Options from child
// <option> elements or the `data` property. Form-associated.

import { css, define } from "../../core/core.js";
import { applyColor, sizeStyles, radiusStyles } from "../../core/styles.js";
import { FormControl } from "../../core/form.js";

const styles = css`
  :host { display: inline-flex; font-size: var(--_fs); }
  :host([full-width]) { display: flex; }
  .root {
    position: relative;
    display: inline-flex;
    flex: 1;
    padding: 0.25rem;
    background: var(--ray-muted);
    border: 1px solid var(--ray-border);
    border-radius: var(--_r);
  }
  :host([orientation="vertical"]) .root { flex-direction: column; }
  .indicator {
    position: absolute;
    top: 0;
    left: 0; /* physical */
    z-index: 0;
    box-sizing: border-box;
    background: var(--ray-raised);
    border: 1px solid var(--ray-border);
    border-radius: calc(var(--_r) - 2px);
    box-shadow: var(--ray-shadow-xs);
    transition: transform var(--ray-duration-base) var(--ray-easing-standard), width var(--ray-duration-base) var(--ray-easing-standard), height var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([color]) .indicator { background: var(--_filled); border-color: var(--_filled); }
  .indicator[hidden] { display: none; }
  button {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: calc(var(--_h) - 0.5rem - 2px);
    padding: 0 var(--_px);
    font: inherit;
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-muted-foreground);
    white-space: nowrap;
    background: transparent;
    border: 0;
    border-radius: calc(var(--_r) - 2px);
    cursor: pointer;
    transition: color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  button:hover:not([aria-checked="true"]):not(:disabled) { color: var(--ray-foreground); }
  button[aria-checked="true"] { color: var(--ray-foreground); }
  :host([color]) button[aria-checked="true"] { color: var(--_contrast); }
  button:disabled { cursor: not-allowed; opacity: 0.5; }
  :host([disabled]) .root { opacity: 0.6; }
  .options { display: none; }
`;

export class RaySegmentedControl extends FormControl {
  static delegatesFocus = false;
  static properties = {
    name: { type: String, reflect: true },
    value: { type: String },
    data: { attribute: false },
    disabled: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    color: { type: String, reflect: true },
    fullWidth: { type: Boolean, reflect: true },
    orientation: { type: String, reflect: true, default: "horizontal" },
  };
  static styles = [sizeStyles, radiusStyles, styles];
  static template = `<div class="root" part="root" role="radiogroup"><span class="indicator" part="indicator" hidden></span></div><div class="options"><slot></slot></div>`;

  constructor() {
    super();
    this.root = this.$(".root");
    this.$("slot").addEventListener("slotchange", () => this._render());
    this.root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && !b.disabled) this._choose(b.dataset.value, true);
    });
    this.root.addEventListener("keydown", (e) => this._key(e));
    if (typeof ResizeObserver === "function") this._ro = new ResizeObserver(() => this._moveIndicator());
  }

  connectedCallback() {
    super.connectedCallback();
    this._ro?.observe(this.root);
    if (this._default === undefined) this._default = this.getAttribute("value");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
  }

  /** [{ value, label, disabled }] from `data` or the child options. */
  get items() {
    if (Array.isArray(this.data)) {
      return this.data.map((d) => (typeof d === "string" ? { value: d, label: d, disabled: false } : { value: d.value, label: d.label ?? d.value, disabled: Boolean(d.disabled) }));
    }
    return [...this.querySelectorAll("option")].map((o) => ({ value: o.value, label: o.textContent, disabled: o.disabled }));
  }

  update(changed) {
    if (changed.has("data") || !this._buttons) this._render();
    const items = this.items;
    if (!items.some((i) => i.value === this.value && !i.disabled)) {
      const first = items.find((i) => !i.disabled);
      if (first) this.commitProperty("value", first.value);
    }
    const disabled = this.effectivelyDisabled;
    for (const b of this._buttons) {
      const on = b.dataset.value === this.value;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on && !disabled ? 0 : -1;
      b.disabled = disabled || b.dataset.disabled === "true";
    }
    applyColor(this.root, this.color);
    this.root.setAttribute("aria-orientation", this.orientation === "vertical" ? "vertical" : "horizontal");
    const label = this.getAttribute("aria-label");
    if (label) this.root.setAttribute("aria-label", label);
    this.internals.setFormValue(this.value ?? null);
    this._moveIndicator();
  }

  _render() {
    for (const b of this._buttons ?? []) b.remove();
    this._buttons = this.items.map((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("part", "control");
      b.className = "focus-ring";
      b.dataset.value = item.value;
      b.dataset.disabled = String(item.disabled);
      b.textContent = item.label;
      this.root.append(b);
      return b;
    });
    if (this.isConnected) this.requestUpdate();
  }

  _moveIndicator() {
    const ind = this.$(".indicator");
    const b = this._buttons?.find((x) => x.dataset.value === this.value);
    if (!b || !b.offsetWidth) {
      ind.hidden = true;
      return;
    }
    ind.hidden = false;
    ind.style.width = `${b.offsetWidth}px`;
    ind.style.height = `${b.offsetHeight}px`;
    ind.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
  }

  _choose(value, user) {
    const changed = value !== this.value;
    this.value = value;
    this._buttons.find((b) => b.dataset.value === value)?.focus();
    if (user && changed) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  _key(e) {
    const enabled = this._buttons.filter((b) => !b.disabled);
    const i = enabled.findIndex((b) => b.dataset.value === this.value);
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = enabled[(i + 1) % enabled.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = enabled[(i - 1 + enabled.length) % enabled.length];
    if (!next) return;
    e.preventDefault();
    this._choose(next.dataset.value, true);
  }

  formResetCallback() {
    this.value = this._default ?? undefined;
  }

  formStateRestoreCallback(state) {
    this.value = state ?? undefined;
  }
}

define("ray-segmented-control", RaySegmentedControl);
