// <ray-checkbox>: a checkbox with label (attribute or content), description
// and error. Submits `value` (default "on") under `name` when checked.

import { css, define } from "../../core/core.js";
import { applyColor, sizeStyles, radiusStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles } from "../../core/form.js";

export const checkStyles = css`
  :host {
    display: block;
    --_s: 1.25rem;
  }
  :host([size="xs"]) { --_s: 1rem; }
  :host([size="md"]) { --_s: 1.5rem; }
  :host([size="lg"]) { --_s: 1.875rem; }
  :host([size="xl"]) { --_s: 2.25rem; }
  .root {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--_s) * 0.6);
  }
  :host([label-position="left"]) .root { flex-direction: row-reverse; justify-content: flex-end; }
  .inner {
    position: relative;
    flex: none;
    display: inline-flex;
    width: var(--_iw, var(--_s));
    height: var(--_s);
  }
  .control {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .control:disabled { cursor: not-allowed; }
  .indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--_contrast);
    background: var(--ray-background);
    border: 1px solid var(--ray-input);
    border-radius: var(--_r);
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard), border-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .control:focus-visible + .indicator {
    outline: var(--ray-focus-ring-width) solid var(--ray-ring);
    outline-offset: var(--ray-focus-ring-offset);
  }
  .control:disabled + .indicator { background: var(--ray-muted); border-color: var(--ray-border); }
  .root[data-invalid] .indicator { border-color: var(--ray-destructive); }
  .body { display: flex; flex-direction: column; justify-content: center; min-height: var(--_s); }
  .label { margin: 0; cursor: pointer; font-weight: var(--ray-font-weight-regular); line-height: var(--ray-line-height-sm); }
  .description, .error { margin: var(--ray-space-1) 0 0; }
  :host([disabled]) .label { color: var(--ray-muted-foreground); cursor: not-allowed; }
`;

const styles = css`
  :host { --_r: var(--ray-radius-sm); }
  svg { width: 65%; height: 65%; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; display: none; }
  .control:checked + .indicator,
  .control:indeterminate + .indicator { background: var(--_filled); border-color: var(--_filled); }
  .control:checked:not(:indeterminate) + .indicator .check { display: block; }
  .control:indeterminate + .indicator .dash { display: block; }
  .control:disabled:checked + .indicator,
  .control:disabled:indeterminate + .indicator { background: var(--ray-border); border-color: var(--ray-border); color: var(--ray-muted-foreground); }
`;

export function checkTemplate(indicator, inputAttrs = "") {
  return `
    <div class="root" part="root">
      <span class="inner">
        <input type="checkbox" id="control" class="control" part="input" ${inputAttrs}>
        ${indicator}
      </span>
      <span class="body">
        <label class="label" part="label" for="control" hidden><span class="label-text"></span><slot></slot><span class="required" aria-hidden="true" hidden> *</span></label>
        <div class="description" part="description" id="description" hidden></div>
        <div class="error" part="error" id="error" hidden></div>
      </span>
    </div>`;
}

export class RayCheckbox extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    checked: { type: Boolean, attribute: false },
    indeterminate: { type: Boolean, reflect: true },
    value: { type: String, reflect: true, default: "on" },
    color: { type: String, reflect: true },
    labelPosition: { type: String, reflect: true, default: "right" },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, checkStyles, styles];
  static template = checkTemplate(`<span class="indicator" part="indicator" aria-hidden="true"><svg class="check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><svg class="dash" viewBox="0 0 24 24"><path d="M6 12h12"/></svg></span>`);

  wire() {
    // The `checked` attribute is the default state, like on <input>.
    this._default = this.hasAttribute("checked");
    if (this._values.get("checked") === undefined) this._store("checked", this._default);
    this.control.addEventListener("change", (e) => {
      this._store("checked", this.control.checked);
      if (this.indeterminate) this.indeterminate = false;
      this._commit();
      this.forward(e);
    });
    const slot = this.$(".label slot");
    slot.addEventListener("slotchange", () => this.requestUpdate());
  }

  update() {
    const c = this.control;
    c.checked = Boolean(this.checked);
    c.indeterminate = Boolean(this.indeterminate);
    if (this.indeterminate) c.setAttribute("aria-checked", "mixed");
    else c.removeAttribute("aria-checked");
    applyColor(this.$(".root"), this.color);
    this.syncField();
    // The label shows for the attribute or for slotted content.
    const slotted = this.$(".label slot").assignedNodes().some((n) => n.nodeType === 1 || n.textContent.trim());
    this.$(".label").hidden = !(this.label || slotted);
    this.$(".root").toggleAttribute("data-invalid", Boolean(this.error));
    this._commit();
  }

  _commit() {
    this.internals.setFormValue(this.checked ? (this.value ?? "on") : null);
    this.syncValidity();
  }

  formResetCallback() {
    this.checked = this._default;
    this.indeterminate = false;
  }

  formStateRestoreCallback(state) {
    this.checked = state !== null && state !== undefined;
  }
}

define("ray-checkbox", RayCheckbox);
