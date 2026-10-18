// <ray-radio-group> + <ray-radio>: one choice among options.
//
// Native radios cannot group across shadow roots, so the group owns the
// state: it is the form control (value submitted under `name`), keeps one
// radio checked, and moves focus and selection with the arrow keys (roving
// tabindex), like native radios. <ray-radio-card> is a radio drawn as a
// card (a title, a detail, an icon), for choices that need more than a line:
// plans, presets, shipping methods. Both can share a group.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, sizeStyles } from "../../core/styles.js";
import { FormControl, fieldStyles } from "../../core/form.js";

/** The elements a group owns: radios and radio cards. */
const RADIOS = "ray-radio, ray-radio-card";

const groupStyles = css`
  :host { --_rs: 1.25rem; }
  :host([size="xs"]) { --_rs: 1rem; }
  :host([size="md"]) { --_rs: 1.5rem; }
  :host([size="lg"]) { --_rs: 1.875rem; }
  :host([size="xl"]) { --_rs: 2.25rem; }
  .items {
    display: flex;
    flex-direction: column;
    gap: var(--ray-space-3);
    margin-top: var(--ray-space-2);
  }
  :host([orientation="horizontal"]) .items { flex-direction: row; flex-wrap: wrap; gap: var(--ray-space-5); }
  .label { margin-bottom: 0; }
`;

export class RayRadioGroup extends FormControl {
  static delegatesFocus = false;
  static properties = {
    name: { type: String, reflect: true },
    value: { type: String },
    label: { type: String },
    description: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    orientation: { type: String, reflect: true, default: "vertical" },
    size: { type: String, reflect: true, default: "sm" },
    color: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "filled" },
    descriptionPosition: { type: String, reflect: true, default: "above" },
  };
  static styles = [sizeStyles, fieldStyles, groupStyles];
  static template = `
    <div class="label" part="label" id="label" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></div>
    <div class="description" part="description" id="description" hidden></div>
    <div class="items" part="items"><slot></slot></div>
    <div class="error" part="error" id="error" hidden></div>`;

  constructor() {
    super();
    this.internals.role = "radiogroup";
    this.addEventListener("keydown", (e) => this._keydown(e));
    this.addEventListener("click", (e) => {
      const radio = e.target.closest?.(RADIOS);
      if (radio && this.radios.includes(radio)) this._choose(radio, true);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this._wired) {
      this._wired = true;
      this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
      this._default = this.getAttribute("value");
    }
  }

  /** The radios (and radio cards) of this group (direct or nested, not in a nested group). */
  get radios() {
    return [...this.querySelectorAll(RADIOS)].filter((r) => r.closest("ray-radio-group") === this);
  }

  update() {
    const radios = this.radios;
    // A radio marked `checked` in the markup sets the initial value.
    if (this.value === undefined) {
      const marked = radios.find((r) => r.hasAttribute("checked"));
      if (marked) {
        this.commitProperty("value", marked.value);
        if (this._default === null) this._default = marked.value;
      }
    }
    const disabled = this.effectivelyDisabled;
    const current = radios.find((r) => r.value === this.value);
    const focusable = current && !current.disabled && !disabled ? current : radios.find((r) => !r.disabled);
    for (const r of radios) {
      r._setChecked(r === current);
      r._setGroupDisabled(disabled);
      r.toggleAttribute("data-outline", (r.variant || this.variant) === "outline");
      r.tabIndex = r === focusable && !disabled ? 0 : -1;
    }

    this.$("#label").hidden = !this.label;
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".required").hidden = !this.required;
    const desc = this.$("#description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";
    const err = this.$("#error");
    err.hidden = !this.error;
    err.textContent = this.error ?? "";
    this.internals.ariaLabel = this.label || this.getAttribute("aria-label") || null;
    this.internals.ariaRequired = this.required ? "true" : "false";
    this.internals.ariaDisabled = disabled ? "true" : "false";
    this.internals.ariaInvalid = this.error ? "true" : "false";
    // Inherited by the radios (custom properties cross into the light DOM children).
    applyColor(this, this.color);

    this.internals.setFormValue(this.value ?? null);
    if (this.required && !this.value) {
      this.internals.setValidity({ valueMissing: true }, "Please select one of these options.", radios[0]);
    } else {
      this.internals.setValidity({});
    }
  }

  _choose(radio, user) {
    if (radio.disabled || this.effectivelyDisabled) return;
    const changed = this.value !== radio.value;
    this.value = radio.value;
    radio.focus();
    if (user && changed) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  _keydown(e) {
    const radios = this.radios.filter((r) => !r.disabled);
    const i = radios.indexOf(e.target.closest?.(RADIOS));
    if (i < 0) return;
    let next = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = radios[(i + 1) % radios.length];
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = radios[(i - 1 + radios.length) % radios.length];
    else if (e.key === " ") next = radios[i];
    if (!next) return;
    e.preventDefault();
    this._choose(next, true);
  }

  formResetCallback() {
    this.value = this._default ?? undefined;
  }

  formStateRestoreCallback(state) {
    this.value = state ?? undefined;
  }
}

const radioStyles = css`
  :host {
    display: block;
    --_s: var(--_rs, 1.25rem);
    outline: none;
  }
  :host([size="xs"]) { --_s: 1rem; }
  :host([size="sm"]) { --_s: 1.25rem; }
  :host([size="md"]) { --_s: 1.5rem; }
  :host([size="lg"]) { --_s: 1.875rem; }
  :host([size="xl"]) { --_s: 2.25rem; }
  .root { display: flex; align-items: flex-start; gap: calc(var(--_s) * 0.6); cursor: pointer; }
  .indicator {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_s);
    height: var(--_s);
    background: var(--ray-background);
    border: 1px solid var(--ray-input);
    border-radius: 50%;
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard), border-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .dot { width: 40%; height: 40%; border-radius: 50%; background: var(--_contrast, var(--ray-primary-contrast)); transform: scale(0); transition: transform var(--ray-duration-fast) var(--ray-easing-standard); }
  :host([data-checked]) .indicator { background: var(--_filled, var(--ray-primary-filled)); border-color: var(--_filled, var(--ray-primary-filled)); }
  :host([data-checked]) .dot { transform: scale(1); }
  :host([data-outline][data-checked]) .indicator { background: var(--ray-background); }
  :host([data-outline]) .dot { background: var(--_filled, var(--ray-primary-filled)); width: 50%; height: 50%; }
  :host(:focus-visible) .indicator { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: var(--ray-focus-ring-offset); }
  :host([data-disabled]) .root { cursor: not-allowed; }
  :host([data-disabled]) .indicator { background: var(--ray-muted); border-color: var(--ray-border); }
  :host([data-disabled][data-checked]) .indicator { background: var(--ray-border); }
  :host([data-disabled]) .label { color: var(--ray-muted-foreground); }
  .body { display: flex; flex-direction: column; justify-content: center; min-height: var(--_s); }
  .label { font-size: var(--_fs, var(--ray-font-size-sm)); line-height: var(--ray-line-height-sm); }
  .description { margin-top: var(--ray-space-1); font-size: calc(var(--_fs, var(--ray-font-size-sm)) - 0.125rem); color: var(--ray-muted-foreground); }
  [hidden] { display: none !important; }
`;

export class RayRadio extends RayElement {
  static properties = {
    value: { type: String, reflect: true, default: "" },
    label: { type: String },
    description: { type: String },
    disabled: { type: Boolean, reflect: true },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true },
    variant: { type: String, reflect: true },
  };
  static styles = [radioStyles];
  static template = `
    <div class="root" part="root">
      <span class="indicator" part="indicator"><span class="dot"></span></span>
      <span class="body">
        <span class="label" part="label"><span class="label-text"></span><slot></slot></span>
        <span class="description" part="description" hidden></span>
      </span>
    </div>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "radio";
    this._checked = false;
    this._groupDisabled = false;
  }

  /** Whether this radio is the group's choice. Setting it sets the group's
   * value, like `checked` on a native radio (no events). */
  get checked() {
    return this._checked;
  }

  set checked(on) {
    on = Boolean(on);
    const group = this.closest("ray-radio-group");
    if (!group) {
      this._setChecked(on);
      return;
    }
    if (on) {
      group.value = this.value;
      for (const r of group.radios) r._setChecked(r === this);
    } else if (this._checked) {
      group.value = undefined;
      this._setChecked(false);
    }
  }

  _setChecked(on) {
    this._checked = on;
    this.toggleAttribute("data-checked", on);
    this.internals.ariaChecked = on ? "true" : "false";
  }

  _setGroupDisabled(on) {
    if (this._groupDisabled === on) return;
    this._groupDisabled = on;
    this.requestUpdate();
  }

  update(changed) {
    // The group derives checked/tabindex from values and disabled states.
    if (changed.has("value") || changed.has("disabled") || changed.has("variant")) this.closest("ray-radio-group")?.requestUpdate();
    const disabled = Boolean(this.disabled || this._groupDisabled);
    this.toggleAttribute("data-disabled", disabled);
    this.internals.ariaDisabled = disabled ? "true" : "false";
    this.$(".label-text").textContent = this.label ?? "";
    const desc = this.$(".description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";
    if (this.color) applyColor(this.$(".root"), this.color);
    if (!this.closest("ray-radio-group") && !this.hasAttribute("tabindex")) this.tabIndex = 0;
  }
}

const cardStyles = css`
  :host { --_s: var(--_rs, 1.125rem); }
  .root {
    align-items: flex-start;
    gap: var(--ray-space-3);
    height: 100%;
    box-sizing: border-box;
    padding: var(--ray-space-3) var(--ray-space-4);
    background: var(--ray-background);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard), border-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host(:not([data-disabled])) .root:hover { background: var(--ray-default-hover); }
  :host([data-checked]) .root, :host([data-checked]) .root:hover {
    background: var(--_light, var(--ray-primary-light));
    border-color: var(--_filled, var(--ray-primary-filled));
  }
  :host(:focus-visible) .root { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: var(--ray-focus-ring-offset); }
  :host(:focus-visible) .indicator { outline: none; }
  :host([data-disabled]) .root { background: var(--ray-muted); opacity: 0.6; }
  .body { flex: 1; min-width: 0; min-height: 0; }
  .label { font-weight: var(--ray-font-weight-semibold); }
  .icon { display: inline-flex; flex: none; color: var(--_filled, var(--ray-primary-filled)); font-size: 1.25rem; line-height: 1; }
  .extra { margin-top: var(--ray-space-2); font-size: var(--ray-font-size-sm); }
  :host([hide-indicator]) .indicator { display: none; }
`;

export class RayRadioCard extends RayRadio {
  static properties = {
    ...RayRadio.properties,
    hideIndicator: { type: Boolean, reflect: true, attribute: "hide-indicator" },
  };
  static styles = [radioStyles, cardStyles];
  static template = `
    <div class="root" part="root">
      <span class="icon" part="icon" hidden><slot name="icon"></slot></span>
      <span class="body">
        <span class="label" part="label"><span class="label-text"></span></span>
        <span class="description" part="description" hidden></span>
        <span class="extra" hidden><slot></slot></span>
      </span>
      <span class="indicator" part="indicator"><span class="dot"></span></span>
    </div>`;

  constructor() {
    super();
    // The icon and the extra content take room only when given.
    for (const slot of this.shadowRoot.querySelectorAll("slot")) {
      slot.addEventListener("slotchange", () => {
        const given = slot.assignedNodes().some((n) => n.nodeType === Node.ELEMENT_NODE || n.textContent.trim());
        slot.parentElement.hidden = !given;
      });
    }
  }
}

define("ray-radio-group", RayRadioGroup);
define("ray-radio", RayRadio);
define("ray-radio-card", RayRadioCard);
