// <ray-number-input>: a number field (Mantine's NumberInput): + and −
// buttons (hold to repeat), the arrow keys (Shift: ×10), min/max/step,
// a fixed number of decimals, a prefix and a suffix ("$", " kg") and a
// thousands separator in the shown text. The value is a number (or empty);
// the form gets its plain digits.
//
// An ARIA spinbutton: aria-valuenow/min/max/valuetext on the text field.

import { css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

const styles = css`
  .control { font-variant-numeric: tabular-nums; }
  .steppers {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    flex: none;
    width: calc(var(--_h) * 0.75);
    border-inline-start: 1px solid var(--ray-input);
  }
  :host([hide-controls]) .steppers { display: none; }
  :host([variant="filled"]) .steppers, :host([variant="unstyled"]) .steppers { border-color: transparent; }
  .step {
    display: grid;
    place-items: center;
    flex: 1;
    margin: 0;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    cursor: pointer;
    --ray-icon-size: 0.8em;
  }
  .step + .step { border-top: 1px solid var(--ray-input); }
  :host([variant="filled"]) .step + .step, :host([variant="unstyled"]) .step + .step { border-color: transparent; }
  .step:hover:not(:disabled) { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .step:disabled { cursor: not-allowed; opacity: 0.4; }
  .up { border-start-end-radius: calc(var(--_r) - 1px); }
  .down { border-end-end-radius: calc(var(--_r) - 1px); }
`;

/** A number from text with a prefix/suffix and separators; NaN if none. */
export function parseNumber(text, { decimal = ".", thousands = "" } = {}) {
  let s = String(text ?? "");
  if (thousands) s = s.split(thousands).join("");
  if (decimal !== ".") s = s.split(decimal).join(".");
  const m = s.match(/-?\d*\.?\d+(?:e[+-]?\d+)?|-?\d+\.?/i);
  return m ? Number(m[0]) : NaN;
}

/** A number as text with `decimals`, a thousands separator and a decimal mark. */
export function formatNumber(n, { decimals, thousands = "", decimal = "." } = {}) {
  if (!Number.isFinite(n)) return "";
  let s = decimals !== undefined && decimals !== null ? n.toFixed(decimals) : String(n);
  let [int, frac] = s.split(".");
  if (thousands) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  return frac !== undefined ? `${int}${decimal}${frac}` : int;
}

export class RayNumberInput extends FieldControl {
  /** Enter submits the form (core/form.js). */
  static implicitSubmission = true;
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number, default: 1 },
    decimals: { type: Number },
    // Shadows Element.prefix (the namespace prefix): null when unset, like it.
    prefix: { type: String, default: null },
    suffix: { type: String },
    thousandsSeparator: { type: String, attribute: "thousands-separator" },
    decimalSeparator: { type: String, attribute: "decimal-separator", default: "." },
    placeholder: { type: String },
    hideControls: { type: Boolean, reflect: true, attribute: "hide-controls" },
    clamp: { type: String, default: "blur" },
    readonly: { type: Boolean, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, styles];
  static template = fieldTemplate(
    `<input id="control" class="control" part="input" role="spinbutton" inputmode="decimal" autocomplete="off" spellcheck="false">` +
      `<span class="steppers" part="controls"><button type="button" class="step up" part="increment" tabindex="-1" aria-label="Increment"><span data-ray-icon="chevron-up"></span></button><button type="button" class="step down" part="decrement" tabindex="-1" aria-label="Decrement"><span data-ray-icon="chevron-down"></span></button></span>`,
  );

  #typing = false;
  #repeat = 0;

  wire() {
    this._default = this.getAttribute("value") !== null ? Number(this.getAttribute("value")) : undefined;
    const c = this.control;
    c.addEventListener("input", () => {
      this.#typing = true;
      const n = this._parse(c.value);
      this.commitProperty("value", Number.isFinite(n) ? (this.clamp === "strict" ? this._clamp(n) : n) : undefined);
      this._commit();
      this._aria();
    });
    c.addEventListener("blur", () => {
      this.#typing = false;
      if (this.value !== undefined && this.clamp !== "none") this._set(this._clamp(this.value), false);
      this._paint();
    });
    c.addEventListener("change", (e) => this.forward(e));
    c.addEventListener("keydown", (e) => this._key(e));
    this.submitOnEnter(c);
    // + and −: a press steps once; held, it repeats faster and faster.
    for (const [sel, dir] of [[".up", 1], [".down", -1]]) {
      const b = this.$(sel);
      b.addEventListener("pointerdown", (e) => {
        if (b.disabled || e.button !== 0) return;
        e.preventDefault();
        c.focus();
        this.stepBy(dir);
        let delay = 400;
        const again = () => {
          this.stepBy(dir);
          delay = Math.max(40, delay * 0.8);
          this.#repeat = setTimeout(again, delay);
        };
        this.#repeat = setTimeout(again, delay);
      });
      for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => clearTimeout(this.#repeat));
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#repeat);
  }

  update() {
    const c = this.control;
    c.readOnly = Boolean(this.readonly);
    if (this.placeholder !== undefined) c.placeholder = this.placeholder;
    if (!this.#typing) this._paint();
    this.syncField();
    this._aria();
    this._commit();
  }

  /** Adds `dir` steps (negative: down) from the current value, clamped; fires input and change. */
  stepBy(dir) {
    if (this.effectivelyDisabled || this.readonly) return;
    const step = this.step || 1;
    const base = this.value ?? (dir > 0 ? (this.min ?? 0) - step : (this.max ?? 0) + step);
    // Round to the step's precision (0.1 + 0.2 stays 0.3).
    const places = Math.max(this._places(step), this._places(base), this.decimals ?? 0);
    const next = Number((base + dir * step).toFixed(places));
    this._set(this._clamp(next), true);
  }

  _places(n) {
    const s = String(n);
    return s.includes(".") ? s.split(".")[1].length : 0;
  }

  _clamp(n) {
    let v = n;
    if (this.min !== undefined && this.min !== null && v < this.min) v = this.min;
    if (this.max !== undefined && this.max !== null && v > this.max) v = this.max;
    return this.decimals !== undefined && this.decimals !== null ? Number(v.toFixed(this.decimals)) : v;
  }

  _parse(text) {
    let s = String(text ?? "");
    if (this.prefix) s = s.split(this.prefix).join("");
    if (this.suffix) s = s.split(this.suffix).join("");
    return parseNumber(s, { decimal: this.decimalSeparator || ".", thousands: this.thousandsSeparator || "" });
  }

  _set(n, user) {
    const changed = n !== this.value;
    this.commitProperty("value", n);
    this._paint();
    this._commit();
    this._aria();
    if (user && changed) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // The shown text: prefix, separators, decimals, suffix.
  _text() {
    if (this.value === undefined || this.value === null || !Number.isFinite(this.value)) return "";
    const num = formatNumber(this.value, { decimals: this.decimals, thousands: this.thousandsSeparator || "", decimal: this.decimalSeparator || "." });
    return `${this.prefix ?? ""}${num}${this.suffix ?? ""}`;
  }

  _paint() {
    const t = this._text();
    if (this.control.value !== t) this.control.value = t;
    const v = this.value;
    const off = this.effectivelyDisabled || this.readonly;
    this.$(".up").disabled = off || (v !== undefined && this.max !== undefined && v >= this.max);
    this.$(".down").disabled = off || (v !== undefined && this.min !== undefined && v <= this.min);
  }

  _aria() {
    const c = this.control;
    const set = (a, v) => (v === undefined || v === null || Number.isNaN(v) ? c.removeAttribute(a) : c.setAttribute(a, String(v)));
    set("aria-valuenow", this.value);
    set("aria-valuemin", this.min);
    set("aria-valuemax", this.max);
    if (this.prefix || this.suffix || this.thousandsSeparator) set("aria-valuetext", this._text() || undefined);
    else c.removeAttribute("aria-valuetext");
  }

  _key(e) {
    const big = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowUp") { e.preventDefault(); this.stepBy(big); }
    else if (e.key === "ArrowDown") { e.preventDefault(); this.stepBy(-big); }
    else if (e.key === "PageUp") { e.preventDefault(); this.stepBy(10); }
    else if (e.key === "PageDown") { e.preventDefault(); this.stepBy(-10); }
    else if (e.key === "Home" && this.min !== undefined) { e.preventDefault(); this._set(this.min, true); }
    else if (e.key === "End" && this.max !== undefined) { e.preventDefault(); this._set(this.max, true); }
  }

  _commit() {
    this.internals.setFormValue(this.value === undefined || this.value === null || !Number.isFinite(this.value) ? null : String(this.value));
    const c = this.control;
    let msg = "";
    if (this.required && (this.value === undefined || this.value === null)) msg = "Please enter a number.";
    else if (this.value !== undefined && this.min !== undefined && this.value < this.min) msg = `The minimum is ${this.min}.`;
    else if (this.value !== undefined && this.max !== undefined && this.value > this.max) msg = `The maximum is ${this.max}.`;
    if (msg) this.internals.setValidity(this.value === undefined ? { valueMissing: true } : this.value < (this.min ?? -Infinity) ? { rangeUnderflow: true } : { rangeOverflow: true }, msg, c);
    else this.internals.setValidity({});
  }

  formResetCallback() {
    this.value = this._default;
  }

  formStateRestoreCallback(state) {
    const n = Number(state);
    this.value = state === null || state === "" || !Number.isFinite(n) ? undefined : n;
  }
}

define("ray-number-input", RayNumberInput);
