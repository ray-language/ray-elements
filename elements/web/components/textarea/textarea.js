// <ray-textarea>: a multi-line text field, optionally growing with its content.

import { css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";
import { syncHighlight, textLayerStyles } from "../../core/textlayer.js";

const styles = css`
  .box { align-items: stretch; }
  .control {
    padding-block: calc(var(--_px) * 0.4);
    line-height: var(--ray-line-height-md);
    resize: vertical;
  }
  :host([autosize]) .control { resize: none; overflow: hidden; }
  :host([resize="none"]) .control { resize: none; }
  :host([resize="both"]) .control { resize: both; }
`;

const PASSTHROUGH = ["placeholder", "autocomplete", "minlength", "maxlength", "spellcheck", "wrap"];

export class RayTextarea extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String },
    rows: { type: Number, default: 3 },
    autosize: { type: Boolean, reflect: true },
    maxRows: { type: Number },
    readonly: { type: Boolean, reflect: true },
    highlight: { attribute: false },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, textLayerStyles, styles];
  static template = fieldTemplate(`<textarea id="control" class="control" part="textarea"></textarea>`, { sections: false });

  static get observedAttributes() {
    return [...super.observedAttributes, ...PASSTHROUGH];
  }

  attributeChangedCallback(attr, old, value) {
    if (PASSTHROUGH.includes(attr)) {
      if (value === null) this.control?.removeAttribute(attr);
      else this.control?.setAttribute(attr, value);
      return;
    }
    super.attributeChangedCallback(attr, old, value);
  }

  wire() {
    for (const attr of PASSTHROUGH) {
      const v = this.getAttribute(attr);
      if (v !== null) this.control.setAttribute(attr, v);
    }
    // Initial value: the attribute, else the element's text (like <textarea>).
    this._default = this.getAttribute("value") ?? this.textContent ?? "";
    if (this.value === undefined) this.commitProperty("value", this._default);
    this.control.addEventListener("input", () => {
      this.commitProperty("value", this.control.value);
      this._commit();
      this._fit();
    });
    this.control.addEventListener("change", (e) => this.forward(e));
  }

  update() {
    const c = this.control;
    const v = this.value ?? "";
    if (c.value !== v) c.value = v;
    c.rows = this.rows || 3;
    c.readOnly = Boolean(this.readonly);
    this.syncField();
    this._commit();
    this._fit();
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

  // Autosize: grow to the content, up to maxRows.
  _fit() {
    const c = this.control;
    if (!this.autosize) {
      c.style.removeProperty("height");
      return;
    }
    c.style.height = "auto";
    let h = c.scrollHeight;
    if (this.maxRows) {
      const line = parseFloat(getComputedStyle(c).lineHeight) || 20;
      const pad = c.offsetHeight - c.clientHeight + parseFloat(getComputedStyle(c).paddingTop) * 2;
      h = Math.min(h, line * this.maxRows + pad);
      c.style.overflowY = c.scrollHeight > h ? "auto" : "hidden";
    }
    c.style.height = `${h}px`;
  }

  formResetCallback() {
    this.value = this._default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }
}

define("ray-textarea", RayTextarea);
