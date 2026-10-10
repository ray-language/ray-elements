// <ray-button>: a button (or a link, with href) in Mantine's variants.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, sizeStyles, radiusStyles, variantStyles, loaderStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }
  :host([full-width]) { display: flex; width: 100%; }
  .button {
    position: relative;
    display: inline-flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: var(--_gap);
    height: var(--_h);
    padding: 0 var(--_px);
    font: inherit;
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-semibold);
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    border-radius: var(--_r);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .button:not([data-disabled]):active { transform: translateY(1px); }
  .section { display: inline-flex; align-items: center; }
  .section:not([data-filled]) { display: none; }
  .label { display: inline-flex; align-items: center; overflow: hidden; text-overflow: ellipsis; }
  .overlay {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    --_loader: calc(var(--_fs) * 1.15);
  }
  :host([loading]) .overlay { display: flex; }
  :host([loading]) .content { visibility: hidden; }
  .content { display: contents; }
  :host([loading]) .button[data-disabled] { cursor: progress; }
  :host([loading]) .button[data-variant="filled"][data-disabled] {
    background: var(--_filled);
    color: var(--_contrast);
    border-color: transparent;
    opacity: 0.75;
  }
`;

const INNER = `
  <span class="content">
    <span class="section" part="left-section"><slot name="left"></slot></span>
    <span class="label" part="label"><slot></slot></span>
    <span class="section" part="right-section"><slot name="right"></slot></span>
  </span>
  <span class="overlay" aria-hidden="true"><span class="loader"></span></span>`;

// Host attributes copied to the inner <button>/<a>.
const MIRRORED_ARIA = ["aria-label", "aria-expanded", "aria-haspopup", "aria-pressed", "aria-current"];

export class RayButton extends RayElement {
  static formAssociated = true;
  static delegatesFocus = true;
  static properties = {
    variant: { type: String, reflect: true, default: "filled" },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    type: { type: String, reflect: true, default: "button" },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, reflect: true },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    name: { type: String, reflect: true },
    value: { type: String, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, variantStyles, loaderStyles, styles];

  static get observedAttributes() {
    return [...super.observedAttributes, ...MIRRORED_ARIA, "aria-describedby"];
  }

  attributeChangedCallback(attr, old, value) {
    if (attr.startsWith("aria-")) {
      this.requestUpdate();
      return;
    }
    super.attributeChangedCallback(attr, old, value);
  }

  constructor() {
    super();
    this.internals = this.attachInternals();
    this._onClick = (e) => this._click(e);
  }

  get form() { return this.internals.form; }

  formDisabledCallback(disabled) {
    this._fieldsetDisabled = disabled;
    this.requestUpdate();
  }

  /** Clicks the inner button (host.click() alone would not reach it). */
  click() {
    if (this._el) this._el.click();
    else super.click();
  }

  update() {
    // The inner element is a <button>, or an <a> when href is set.
    const tag = this.href ? "a" : "button";
    if (!this._el || this._el.localName !== tag) this._render(tag);
    const el = this._el;
    const disabled = Boolean(this.disabled || this.loading || this._fieldsetDisabled);

    el.dataset.variant = this.variant || "filled";
    el.toggleAttribute("data-disabled", disabled);
    applyColor(el, this.color);
    if (tag === "button") {
      el.disabled = Boolean(this.disabled || this._fieldsetDisabled);
      el.setAttribute("aria-disabled", String(disabled));
    } else {
      el.href = this.href;
      if (this.target) el.target = this.target;
      else el.removeAttribute("target");
      if (disabled) {
        el.setAttribute("aria-disabled", "true");
        el.removeAttribute("href");
      } else {
        el.removeAttribute("aria-disabled");
      }
    }
    el.toggleAttribute("aria-busy", Boolean(this.loading));
    // ARIA put on the host (by the app, a popover, a menu…) belongs to the inner button.
    for (const attr of MIRRORED_ARIA) {
      const v = this.getAttribute(attr);
      if (v !== null) el.setAttribute(attr, v);
      else el.removeAttribute(attr);
    }
    // aria-describedby ids live in the document: reference the elements
    // themselves (element reflection may point out of the shadow root).
    const ids = (this.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if ("ariaDescribedByElements" in el) {
      el.ariaDescribedByElements = ids.length ? ids.map((id) => this.getRootNode().getElementById?.(id) ?? document.getElementById(id)).filter(Boolean) : null;
    }
  }

  _render(tag) {
    this._el?.remove();
    const el = document.createElement(tag);
    el.className = "button focus-ring";
    el.setAttribute("part", "button");
    el.setAttribute("data-interactive", "");
    if (tag === "button") el.type = "button";
    el.innerHTML = INNER;
    el.addEventListener("click", this._onClick);
    this.shadowRoot.append(el);
    this._el = el;
    for (const slot of el.querySelectorAll("slot[name]")) {
      const sync = () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
      slot.addEventListener("slotchange", sync);
      sync();
    }
  }

  _click(e) {
    if (this.loading || this.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    const form = this.internals.form;
    if (!form || this.href) return;
    if (this.type === "submit") {
      // Submit with this button as the submitter-equivalent: name/value travel
      // as a hidden field for the duration of the submit.
      let extra = null;
      if (this.name) {
        extra = document.createElement("input");
        extra.type = "hidden";
        extra.name = this.name;
        extra.value = this.value ?? "";
        form.append(extra);
      }
      try {
        form.requestSubmit();
      } finally {
        extra?.remove();
      }
    } else if (this.type === "reset") {
      form.reset();
    }
  }
}

define("ray-button", RayButton);
