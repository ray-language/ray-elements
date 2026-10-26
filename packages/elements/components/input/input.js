// <ray-input>: a text field with label, description and error (Mantine's
// TextInput). Takes part in <form> under `name`.

import { css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";
import { syncHighlight, textLayerStyles } from "../../core/textlayer.js";

const styles = css`
  .control[type="search"]::-webkit-search-cancel-button { cursor: pointer; }
  .control[type="number"] { font-variant-numeric: tabular-nums; }
`;

// Attributes copied as-is to the inner <input>.
const PASSTHROUGH = ["placeholder", "autocomplete", "inputmode", "pattern", "min", "max", "step", "minlength", "maxlength", "spellcheck", "autocapitalize", "enterkeyhint", "list"];

export class RayInput extends FieldControl {
  /** Enter submits the form (core/form.js). */
  static implicitSubmission = true;
  static properties = {
    ...FieldControl.fieldProperties,
    type: { type: String, reflect: true, default: "text" },
    value: { type: String },
    placeholder: { type: String },
    readonly: { type: Boolean, reflect: true },
    autofocus: { type: Boolean },
    highlight: { attribute: false },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, textLayerStyles, styles];
  static template = fieldTemplate(`<input id="control" class="control" part="input">`);

  static get observedAttributes() {
    return [...super.observedAttributes, ...PASSTHROUGH];
  }

  attributeChangedCallback(attr, old, value) {
    if (PASSTHROUGH.includes(attr)) {
      if (value === null) this.control?.removeAttribute(attr);
      else this.control?.setAttribute(attr, value);
      this.requestUpdate();
      return;
    }
    super.attributeChangedCallback(attr, old, value);
  }

  wire() {
    for (const attr of PASSTHROUGH) {
      const v = this.getAttribute(attr);
      if (v !== null) this.control.setAttribute(attr, v);
    }
    this._default = this.getAttribute("value") ?? "";
    this.control.addEventListener("input", () => {
      this.commitProperty("value", this.control.value);
      this._commit();
    });
    this.control.addEventListener("change", (e) => this.forward(e));
    this.submitOnEnter(this.control);
    if (this.autofocus) queueMicrotask(() => this.control.focus());
  }

  update() {
    const c = this.control;
    if (c.type !== (this.type || "text")) c.type = this.type || "text";
    const v = this.value ?? "";
    if (c.value !== v) c.value = v;
    c.readOnly = Boolean(this.readonly);
    this.syncField();
    this._commit();
    syncHighlight(this);
  }

  /** Runs `highlight` again (what it marks changed, not the text). */
  refreshHighlight() {
    syncHighlight(this);
  }

  _commit() {
    this.internals.setFormValue(this.value ?? "");
    this.syncValidity();
  }

  formResetCallback() {
    this.value = this._default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }

  /** Selects the text, like HTMLInputElement.select(). */
  select() {
    this.control.select();
  }
}

define("ray-input", RayInput);
