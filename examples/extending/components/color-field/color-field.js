// Level 2 — a new form control on FieldControl: <app-color-field> gets
// label, description, error, required, ARIA, form value, validity, reset and
// <fieldset disabled> from the base; it only wires its native control.

import { FieldControl, fieldTemplate, fieldStyles, boxStyles, sizeStyles, radiusStyles, css, define } from "@raylang/elements";

const styles = css`
  .box { gap: var(--ray-space-2); padding-left: calc(var(--_px) * 0.5); }
  input[type="color"] {
    width: calc(var(--_h) - 0.75rem);
    height: calc(var(--_h) - 0.75rem);
    padding: 0;
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
    background: none;
    cursor: pointer;
  }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  input[type="color"]::-webkit-color-swatch { border: 0; border-radius: calc(var(--ray-radius-sm) - 1px); }
  .hex { font-family: var(--ray-font-mono); font-size: var(--_fs); color: var(--ray-muted-foreground); }
`;

export class AppColorField extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String, default: "#228be6" },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, styles];
  static template = fieldTemplate(`<input id="control" class="control" type="color" part="input"><span class="hex" part="hex" aria-hidden="true"></span>`, { sections: false });

  // Protected hook: runs once, on first connection.
  wire() {
    this.initial = this.getAttribute("value") ?? this.value;
    this.control.addEventListener("input", () => {
      this.commitProperty("value", this.control.value); // the user changed it: no reflection
      this.sync();
    });
    this.control.addEventListener("change", (e) => this.forward(e));
  }

  update() {
    if (this.control.value !== this.value) this.control.value = this.value;
    this.syncField(); // label, description, error, required, disabled, ARIA
    this.sync();
  }

  sync() {
    this.shadowRoot.querySelector(".hex").textContent = this.control.value;
    this.internals.setFormValue(this.control.value);
    this.syncValidity();
  }

  formResetCallback() {
    this.value = this.initial;
  }
}

define("app-color-field", AppColorField);
