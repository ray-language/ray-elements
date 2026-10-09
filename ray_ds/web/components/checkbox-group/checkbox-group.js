// <ray-checkbox-group>: several choices among options (Mantine's
// Checkbox.Group), around ray-checkbox elements.
//
// The group is the form control: `value` is the array of the checked
// values, submitted as one entry each under `name` (like checkboxes that
// share a name). It stops its checkboxes' change and fires its own. `max`
// caps how many can be checked (the others are disabled meanwhile);
// `required` asks for at least one.

import { css, define } from "../../core/core.js";
import { sizeStyles } from "../../core/styles.js";
import { FormControl, fieldStyles } from "../../core/form.js";

const styles = css`
  .items { display: flex; flex-direction: column; gap: var(--ray-space-3); margin-top: var(--ray-space-2); }
  :host([orientation="horizontal"]) .items { flex-direction: row; flex-wrap: wrap; gap: var(--ray-space-3) var(--ray-space-5); }
  .label { margin-bottom: 0; }
  .count { margin-left: var(--ray-space-1); font-weight: 400; color: var(--ray-muted-foreground); font-variant-numeric: tabular-nums; }
`;

/** "a, b" (an attribute) or an array, as an array of values. */
const toList = (v) => (Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export class RayCheckboxGroup extends FormControl {
  static delegatesFocus = false;
  static properties = {
    name: { type: String, reflect: true },
    value: { attribute: false },
    label: { type: String },
    description: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    max: { type: Number },
    orientation: { type: String, reflect: true, default: "vertical" },
    size: { type: String, reflect: true },
    color: { type: String, reflect: true },
    descriptionPosition: { type: String, reflect: true, default: "above" },
  };
  static styles = [sizeStyles, fieldStyles, styles];
  static template = `
    <div class="label" part="label" id="label" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span><span class="count" hidden></span></div>
    <div class="description" part="description" id="description" hidden></div>
    <div class="items" part="items"><slot></slot></div>
    <div class="error" part="error" id="error" hidden></div>`;

  static get observedAttributes() {
    return [...super.observedAttributes, "value"];
  }

  attributeChangedCallback(attr, old, v) {
    if (attr === "value") {
      this.value = toList(v);
      return;
    }
    super.attributeChangedCallback(attr, old, v);
  }

  #default = null;
  #own = new WeakMap();

  constructor() {
    super();
    this.internals.role = "group";
    // A checkbox's own change becomes the group's.
    this.addEventListener("change", (e) => {
      const box = e.target;
      if (box === this || !this.checkboxes.includes(box)) return;
      e.stopPropagation();
      this.commitProperty("value", this.checkboxes.filter((c) => c.checked).map((c) => c.value));
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this._wired) {
      this._wired = true;
      this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
    }
  }

  /** The checkboxes of this group (direct or nested, not in a nested group). */
  get checkboxes() {
    return [...this.querySelectorAll("ray-checkbox")].filter((c) => c.closest("ray-checkbox-group") === this);
  }

  update() {
    const boxes = this.checkboxes;
    // Without a value: the checkboxes marked checked in the markup.
    if (this.value === undefined) {
      this.commitProperty("value", boxes.filter((c) => c.hasAttribute("checked")).map((c) => c.value));
    }
    const value = toList(this.value);
    this.#default ??= this.getAttribute("value") !== null ? toList(this.getAttribute("value")) : value.slice();
    const disabled = this.effectivelyDisabled;
    const full = this.max > 0 && value.length >= this.max;
    for (const c of boxes) {
      const on = value.includes(c.value);
      if (c.checked !== on) c.checked = on;
      // The group submits; the checkboxes only show.
      if (c.hasAttribute("name")) c.removeAttribute("name");
      if (this.size && !c.hasAttribute("size")) c.size = this.size;
      if (this.color && !c.hasAttribute("color")) c.color = this.color;
      // Its own disabled state, as the markup or a script set it before the group did.
      if (!this.#own.has(c)) this.#own.set(c, Boolean(c.disabled));
      const off = this.#own.get(c) || disabled || (full && !on);
      if (Boolean(c.disabled) !== off) c.disabled = off;
    }

    this.$("#label").hidden = !this.label;
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".required").hidden = !this.required;
    const count = this.$(".count");
    count.hidden = !(this.max > 0);
    count.textContent = this.max > 0 ? `${value.length} / ${this.max}` : "";
    const desc = this.$("#description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";
    const err = this.$("#error");
    err.hidden = !this.error;
    err.textContent = this.error ?? "";
    this.internals.ariaLabel = this.label || this.getAttribute("aria-label") || null;
    this.internals.ariaDisabled = disabled ? "true" : "false";
    this.internals.ariaInvalid = this.error ? "true" : "false";
    this.internals.ariaDescription = [this.description, this.error].filter(Boolean).join(". ") || null;

    if (this.name && value.length) {
      const data = new FormData();
      for (const v of value) data.append(this.name, v);
      this.internals.setFormValue(data);
    } else {
      this.internals.setFormValue(null);
    }
    if (this.required && !value.length) {
      this.internals.setValidity({ valueMissing: true }, "Please select at least one option.", boxes[0] ?? undefined);
    } else {
      this.internals.setValidity({});
    }
  }

  formResetCallback() {
    this.value = (this.#default ?? []).slice();
  }

  formStateRestoreCallback(state) {
    if (state instanceof FormData) this.value = state.getAll(this.name).map(String);
  }
}

define("ray-checkbox-group", RayCheckboxGroup);
