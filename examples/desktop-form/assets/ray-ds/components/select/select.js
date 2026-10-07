// <ray-select>: a native select in the field wrapper. Options come from
// child <option>/<optgroup> elements or from the `data` property
// (["a", "b"] or [{ value, label, disabled }]).

import { css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

const styles = css`
  .control {
    appearance: none;
    -webkit-appearance: none;
    padding-right: calc(var(--_h) * 0.8);
    cursor: pointer;
  }
  .control:has(option[data-placeholder]:checked) { color: var(--ray-muted-foreground); }
  .chevron {
    position: absolute;
    right: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--_h) * 0.8);
    height: 100%;
    color: var(--ray-muted-foreground);
    pointer-events: none;
  }
  .chevron svg { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .options { display: none; }
`;

const CHEVRON = `<span class="chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span>`;

export class RaySelect extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String },
    placeholder: { type: String },
    data: { attribute: false },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, styles];
  static template = fieldTemplate(`<select id="control" class="control" part="select"></select>${CHEVRON}`, { sections: false })
    + `<div class="options"><slot></slot></div>`;

  wire() {
    // Option changes only: the host's own attributes do not affect the list.
    this._observer = new MutationObserver((records) => {
      if (records.some((r) => !(r.type === "attributes" && r.target === this))) this._renderOptions();
    });
    this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.control.addEventListener("change", (e) => {
      this._store("value", this.control.value);
      this._commit();
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.forward(e);
    });
    this._renderOptions();
    this._default = this.getAttribute("value") ?? this.control.value;
  }

  update(changed) {
    if (changed.has("data") || changed.has("placeholder")) this._renderOptions();
    const c = this.control;
    if (this.value !== undefined && c.value !== this.value) c.value = this.value;
    this.syncField();
    this._commit();
  }

  // Rebuilds the inner <select> from `data` or the light-DOM options.
  _renderOptions() {
    const c = this.control;
    const keep = this.value ?? c.value;
    c.replaceChildren();
    if (this.placeholder) {
      const p = new Option(this.placeholder, "");
      p.disabled = true;
      p.hidden = true;
      p.dataset.placeholder = "";
      c.append(p);
    }
    if (Array.isArray(this.data)) {
      for (const item of this.data) {
        const o = typeof item === "string" ? new Option(item, item) : new Option(item.label ?? item.value, item.value);
        if (typeof item === "object" && item.disabled) o.disabled = true;
        c.append(o);
      }
    } else {
      for (const child of this.children) {
        if (child.localName === "option" || child.localName === "optgroup") c.append(child.cloneNode(true));
      }
    }
    // Keep the current value, else the placeholder (if any) or a selected child.
    if (keep !== undefined && [...c.options].some((o) => o.value === keep && !o.dataset.placeholder)) {
      c.value = keep;
    } else if (this.placeholder && ![...this.children].some((o) => o.selected && o.hasAttribute("selected"))) {
      c.value = "";
    }
    if (this.value === undefined || c.value !== this.value) this._store("value", c.value);
    this._commit();
  }

  _commit() {
    this.internals.setFormValue(this.control.value || null);
    this.syncValidity();
  }

  /** The option objects of the inner select. */
  get options() {
    return this.control.options;
  }

  formResetCallback() {
    this.value = this._default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }
}

define("ray-select", RaySelect);
