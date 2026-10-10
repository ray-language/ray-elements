// Form-associated base classes.
//
// FormControl: a custom element that takes part in <form> like a native
// control (value submitted under `name`, constraint validation, reset,
// disabled by <fieldset>), through ElementInternals.
//
// FieldControl: a FormControl around one native control in its shadow root,
// with Mantine's input wrapper — label, description, error and the required
// asterisk — wired with ids and ARIA *inside* the shadow root, so the
// accessible name works (a <label for> outside cannot reach into it).

import { RayElement, css } from "./core.js";

export class FormControl extends RayElement {
  static formAssociated = true;
  static delegatesFocus = true;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  /** The <form> this control belongs to. */
  get form() { return this.internals.form; }
  get validity() { return this.internals.validity; }
  get validationMessage() { return this.internals.validationMessage; }
  get willValidate() { return this.internals.willValidate; }
  checkValidity() { return this.internals.checkValidity(); }
  reportValidity() { return this.internals.reportValidity(); }

  /** Disabled by its own attribute or by a disabled <fieldset>. */
  get effectivelyDisabled() {
    return Boolean(this.disabled) || this._fieldsetDisabled === true;
  }

  formDisabledCallback(disabled) {
    this._fieldsetDisabled = disabled;
    this.requestUpdate();
  }

  /** Re-dispatches a non-composed event (e.g. `change`) from the host. */
  forward(event) {
    this.dispatchEvent(new Event(event.type, { bubbles: true, cancelable: event.cancelable }));
  }
}

/** The field wrapper around a control: label, description, box, error. */
export const fieldStyles = css`
  :host {
    display: block;
    font-size: var(--_fs);
  }
  .label {
    display: inline-block;
    margin-bottom: var(--ray-space-1);
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-foreground);
    cursor: default;
  }
  .required { color: var(--ray-destructive); }
  .description {
    margin: calc(var(--ray-space-1) * -0.5) 0 var(--ray-space-1);
    font-size: calc(var(--_fs) - 0.125rem);
    line-height: var(--ray-line-height-sm);
    color: var(--ray-muted-foreground);
  }
  .error {
    margin-top: var(--ray-space-1);
    font-size: calc(var(--_fs) - 0.125rem);
    line-height: var(--ray-line-height-sm);
    color: var(--ray-destructive);
  }
  [hidden] { display: none !important; }
`;

/** A text-like control box: input, textarea, select. */
export const boxStyles = css`
  .box {
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--_h);
    color: var(--ray-foreground);
    background: var(--ray-background);
    border: 1px solid var(--ray-input);
    border-radius: var(--_r);
    transition: border-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host([variant="filled"]) .box { background: var(--ray-muted); border-color: transparent; }
  :host([variant="unstyled"]) .box { background: transparent; border-color: transparent; }
  .box:focus-within {
    border-color: var(--ray-primary);
    outline: var(--ray-focus-ring-width) solid var(--ray-ring);
    outline-offset: -1px;
  }
  :host([variant="unstyled"]) .box:focus-within { outline: none; }
  .box[data-invalid] { border-color: var(--ray-destructive); }
  .box[data-invalid]:focus-within { outline-color: color-mix(in srgb, var(--ray-destructive) 45%, transparent); }
  .box[data-disabled] { background: var(--ray-muted); color: var(--ray-muted-foreground); cursor: not-allowed; opacity: 0.75; }
  .control {
    flex: 1;
    min-width: 0;
    height: 100%;
    min-height: calc(var(--_h) - 2px);
    margin: 0;
    padding: 0 calc(var(--_px) * 0.66);
    font: inherit;
    font-size: var(--_fs);
    color: inherit;
    background: transparent;
    border: 0;
    outline: none;
  }
  .control::placeholder { color: var(--ray-muted-foreground); opacity: 0.8; }
  .control:disabled { cursor: not-allowed; }
  .section {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-width: var(--_h);
    height: calc(var(--_h) - 2px);
    color: var(--ray-muted-foreground);
  }
  .section:not([data-filled]) { display: none; }
  .section[data-filled] + .control, .control:has(+ .section[data-filled]) { padding-inline: 0; }
`;

/**
 * Markup of a field around `control`, whose element must carry
 * id="control" and class="control". Sections are slots "left" and "right".
 */
export function fieldTemplate(control, { sections = true } = {}) {
  const left = sections ? `<span class="section" part="left-section"><slot name="left"></slot></span>` : "";
  const right = sections ? `<span class="section" part="right-section"><slot name="right"></slot></span>` : "";
  return `
    <label class="label" part="label" for="control" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></label>
    <div class="description" part="description" id="description" hidden></div>
    <div class="box" part="wrapper">${left}${control}${right}</div>
    <div class="error" part="error" id="error" hidden></div>`;
}

/**
 * A FormControl around one native control (#control in the shadow root).
 * Subclasses declare the field properties with FieldControl.fieldProperties.
 */
export class FieldControl extends FormControl {
  static fieldProperties = {
    name: { type: String, reflect: true },
    label: { type: String },
    description: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "default" },
  };

  constructor() {
    super();
    /** The native control in the shadow root. */
    this.control = this.$("#control");
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this._wired) {
      this._wired = true;
      for (const side of ["left", "right"]) {
        const slot = this.$(`slot[name="${side}"]`);
        slot?.addEventListener("slotchange", () => {
          slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
        });
      }
      this.wire?.();
    }
  }

  /** Label, description, error, ARIA and validity. Call from update(). */
  syncField() {
    const label = this.$(".label");
    label.hidden = !this.label;
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".required").hidden = !this.required;

    const desc = this.$("#description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";
    const err = this.$("#error");
    err.hidden = !this.error;
    err.textContent = this.error ?? "";

    const c = this.control;
    const described = [this.description ? "description" : "", this.error ? "error" : ""].filter(Boolean).join(" ");
    if (described) c.setAttribute("aria-describedby", described);
    else c.removeAttribute("aria-describedby");
    if (this.error) c.setAttribute("aria-invalid", "true");
    else c.removeAttribute("aria-invalid");
    // Without a visible label, the host's aria-label names the control.
    const aria = this.getAttribute("aria-label");
    if (!this.label && aria) c.setAttribute("aria-label", aria);
    else c.removeAttribute("aria-label");

    c.required = Boolean(this.required);
    c.disabled = this.effectivelyDisabled;
    const box = this.$(".box");
    box?.toggleAttribute("data-invalid", Boolean(this.error));
    box?.toggleAttribute("data-disabled", this.effectivelyDisabled);
    this.syncValidity();
  }

  /** Mirrors the native control's validity into the form. */
  syncValidity() {
    const c = this.control;
    if (c.validity.valid) this.internals.setValidity({});
    else this.internals.setValidity(c.validity, c.validationMessage, c);
  }
}
