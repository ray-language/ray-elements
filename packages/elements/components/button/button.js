// <ray-button>: a button (or a link, with href) in Mantine's variants.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, applyGradient, sizeStyles, radiusStyles, variantStyles, loaderStyles } from "../../core/styles.js";

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
    /* Corners a ray-button-group can square off (inherited custom properties). */
    border-start-start-radius: var(--ray-group-radius-ss, var(--_r));
    border-start-end-radius: var(--ray-group-radius-se, var(--_r));
    border-end-start-radius: var(--ray-group-radius-es, var(--_r));
    border-end-end-radius: var(--ray-group-radius-ee, var(--_r));
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .button:not([data-disabled]):active { transform: translateY(1px); }

  /* variant="raised": a physical key. The face sits on a darker edge (a hard
     shadow, like ray-kbd's thick bottom border); pressing sinks the face onto
     it. The host reserves the edge's height, so the row does not jump. */
  :host([variant="raised"]) { --_depth: 4px; padding-bottom: var(--_depth); }
  :host([variant="raised"][size="xs"]), :host([variant="raised"][size="sm"]) { --_depth: 3px; }
  .button[data-variant="raised"] {
    /* Face, its text and the edge: overridable (ray-toggle's unlit key). */
    --_face: var(--_filled);
    --_face-text: var(--_contrast);
    --_edge: color-mix(in srgb, var(--_face), black 32%);
    --_rim: color-mix(in srgb, var(--_face), black 14%);
    background: var(--_face);
    color: var(--_face-text);
    border-color: var(--_rim);
    box-shadow:
      0 var(--_depth) 0 var(--_edge),
      0 calc(var(--_depth) + 1px) 6px -1px rgb(0 0 0 / 0.28),
      inset 0 1px 0 rgb(255 255 255 / 0.18);
    transition:
      transform 110ms var(--ray-easing-out),
      box-shadow 110ms var(--ray-easing-out),
      background-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .button[data-variant="raised"][data-interactive]:not([data-disabled]):hover {
    background: color-mix(in srgb, var(--_face), white 6%);
  }
  .button[data-variant="raised"]:not([data-disabled]):is(:active, [data-pressed]) {
    transform: translateY(var(--_depth));
    box-shadow: 0 0 0 var(--_edge), 0 1px 2px -1px rgb(0 0 0 / 0.3), inset 0 1px 2px rgb(0 0 0 / 0.12);
    transition-duration: 50ms;
  }
  /* Disabled or loading: pushed in and greyed. */
  .button[data-variant="raised"][data-disabled] {
    transform: translateY(var(--_depth));
    color: var(--ray-muted-foreground);
    background: var(--ray-muted);
    border-color: var(--ray-border);
    box-shadow: none;
  }
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

const PRESS_MS = 110;

// Host attributes copied to the inner <button>/<a>.
const MIRRORED_ARIA = ["aria-label", "aria-expanded", "aria-haspopup", "aria-pressed", "aria-current"];

export class RayButton extends RayElement {
  static formAssociated = true;
  static delegatesFocus = true;
  static properties = {
    variant: { type: String, reflect: true, default: "filled" },
    color: { type: String, reflect: true },
    gradient: { type: String, reflect: true },
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
    applyGradient(el, this.gradient);
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
    this._wirePress(el);
    this.shadowRoot.append(el);
    this._el = el;
    for (const slot of el.querySelectorAll("slot[name]")) {
      const sync = () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
      slot.addEventListener("slotchange", sync);
      sync();
    }
  }

  // The raised variant's press, for touch (iOS applies :active only with a
  // touch listener) and keyboard (Enter never sets :active). A press shows
  // for at least PRESS_MS, so a quick tap still visibly sinks the key.
  _wirePress(el) {
    let since = 0;
    let timer = 0;
    const down = () => {
      if (this.variant !== "raised" || el.hasAttribute("data-disabled")) return;
      clearTimeout(timer);
      since = performance.now();
      el.setAttribute("data-pressed", "");
    };
    const up = () => {
      if (!el.hasAttribute("data-pressed")) return;
      clearTimeout(timer);
      timer = setTimeout(() => el.removeAttribute("data-pressed"), Math.max(0, PRESS_MS - (performance.now() - since)));
    };
    el.addEventListener("pointerdown", down);
    for (const t of ["pointerup", "pointercancel", "pointerleave", "blur"]) el.addEventListener(t, up);
    el.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) down();
    });
    el.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.key === " ") up();
    });
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
