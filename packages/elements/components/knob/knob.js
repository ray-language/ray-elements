// <ray-knob>: a rotary control (a mixer's gain, pan, an effect's amount).
// Drag up or down to turn it (Shift: finer), the wheel too; the arrow keys
// step it, Page Up/Down move a tenth, Home/End go to the ends; a double click
// puts it back to its default. scale="log" for frequencies, bipolar for pan
// (the arc grows from the middle). Form-associated, like ray-slider.
//
// The dial is a role="slider" element with the value's text, so a screen
// reader hears "Gain, -6 dB".

import { css, define } from "../../core/core.js";
import { applyColor, sizeStyles } from "../../core/styles.js";
import { inlineKey } from "../../core/direction.js";
import { FieldControl, fieldStyles } from "../../core/form.js";

const styles = css`
  :host {
    display: inline-flex;
    align-items: center;
    text-align: center;
    --_d: 2.25rem;
  }
  :host([size="xs"]) { --_d: 1.75rem; }
  :host([size="md"]) { --_d: 2.75rem; }
  :host([size="lg"]) { --_d: 3.5rem; }
  :host([size="xl"]) { --_d: 4.5rem; }
  .label { align-self: center; margin-bottom: var(--ray-space-1); }
  .description { max-width: 10rem; }
  .dial {
    width: var(--ray-knob-size, var(--_d));
    height: var(--ray-knob-size, var(--_d));
    border-radius: 50%;
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }
  .dial:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  :host([disabled]) .dial { cursor: not-allowed; opacity: 0.5; }
  svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .track { fill: none; stroke: var(--ray-knob-track, var(--ray-border)); stroke-width: 3; stroke-linecap: round; }
  .arc { fill: none; stroke: var(--ray-knob-arc, var(--_filled)); stroke-width: 3; stroke-linecap: round; }
  .body { fill: var(--ray-knob-body, var(--ray-card)); stroke: var(--ray-border); stroke-width: 1; }
  .pointer { stroke: var(--ray-knob-pointer, var(--ray-foreground)); stroke-width: 2; stroke-linecap: round; }
  .value { margin-top: var(--ray-space-1); font-size: calc(var(--_fs) - 0.125rem); font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); white-space: nowrap; }
  .value[hidden] { display: none; }
`;

// The sweep: from -135° (the minimum, bottom left) to +135° (bottom right).
const A0 = -135;
const A1 = 135;
const R = 17;
const DRAG = 200; // px for the whole sweep; Shift: ten times finer

export class RayKnob extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: Number },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    /** What a double click returns to (the value attribute by default). */
    defaultValue: { type: Number, attribute: "default-value" },
    /** linear, or log (min above 0: frequencies). */
    scale: { type: String, reflect: true, default: "linear" },
    bipolar: { type: Boolean, reflect: true },
    color: { type: String, reflect: true },
    showValue: { type: Boolean, reflect: true },
    unit: { type: String },
    /** (value) => text: the shown and spoken value. */
    format: { attribute: false },
  };
  static styles = [sizeStyles, fieldStyles, styles];
  static template = `
    <label class="label" part="label" id="label" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></label>
    <div class="description" part="description" id="description" hidden></div>
    <div class="dial" part="dial" id="control" role="slider" tabindex="0">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path class="track" part="track"></path>
        <path class="arc" part="arc"></path>
        <circle class="body" part="body" cx="20" cy="20" r="12.5"></circle>
        <line class="pointer" part="pointer" x1="20" y1="20" x2="20" y2="9"></line>
      </svg>
    </div>
    <span class="value" part="value" aria-hidden="true" hidden></span>
    <div class="error" part="error" id="error" hidden></div>`;

  #drag = null;
  #wheelEnd = 0;

  wire() {
    this._default = this.getAttribute("value");
    const dial = this.control;
    dial.addEventListener("pointerdown", (e) => this.#down(e));
    dial.addEventListener("keydown", (e) => this.#key(e));
    dial.addEventListener("dblclick", () => {
      if (this.effectivelyDisabled) return;
      this.#set(this.#home(), true);
    });
    dial.addEventListener("wheel", (e) => this.#wheel(e), { passive: false });
    // The label names the dial (a <label for> reaches only native controls).
    this.$(".label").addEventListener("click", () => dial.focus());
  }

  update() {
    if (this.value === undefined) this.commitProperty("value", this.#clamp(this._default !== null && this._default !== undefined ? Number(this._default) : this.#home()));
    applyColor(this.control, this.color);
    this.syncField();
    const dial = this.control;
    if (this.label) dial.setAttribute("aria-labelledby", "label");
    else dial.removeAttribute("aria-labelledby");
    dial.tabIndex = this.effectivelyDisabled ? -1 : 0;
    if (this.effectivelyDisabled) dial.setAttribute("aria-disabled", "true");
    else dial.removeAttribute("aria-disabled");
    dial.setAttribute("aria-valuemin", String(this.min ?? 0));
    dial.setAttribute("aria-valuemax", String(this.max ?? 100));
    this.#paint();
  }

  /** The value's text: format(value), or the value (to its step's decimals) and the unit. */
  get valueText() {
    const v = this.value ?? 0;
    if (typeof this.format === "function") return String(this.format(v));
    const step = this.step ?? 1;
    const decimals = step > 0 ? Math.min(6, (String(step).split(".")[1] ?? "").length) : 2;
    return `${Number(v.toFixed(decimals))}${this.unit ?? ""}`;
  }

  #paint() {
    const p = this.#pos(this.value ?? 0);
    const angle = A0 + p * (A1 - A0);
    const origin = this.bipolar ? A0 + this.#origin() * (A1 - A0) : A0;
    this.$(".track").setAttribute("d", arc(A0, A1));
    this.$(".arc").setAttribute("d", angle >= origin ? arc(origin, angle) : arc(angle, origin));
    this.$(".pointer").setAttribute("transform", `rotate(${angle} 20 20)`);
    const text = this.valueText;
    const value = this.$(".value");
    value.hidden = !this.showValue;
    value.textContent = text;
    const dial = this.control;
    dial.setAttribute("aria-valuenow", String(this.value ?? 0));
    dial.setAttribute("aria-valuetext", text);
    this.internals.setFormValue(String(this.value ?? ""));
  }

  // FieldControl mirrors a native control's validity; the dial is not one.
  syncValidity() {
    this.internals.setValidity({});
  }

  #log() {
    return this.scale === "log" && (this.min ?? 0) > 0 && (this.max ?? 100) > (this.min ?? 0);
  }

  /** Value -> 0..1 along the sweep. */
  #pos(v) {
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    if (max <= min) return 0;
    const p = this.#log() ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
    return Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
  }

  /** 0..1 -> value, on the step. */
  #at(p) {
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    p = Math.max(0, Math.min(1, p));
    const v = this.#log() ? min * Math.pow(max / min, p) : min + p * (max - min);
    return this.#clamp(v);
  }

  #clamp(v) {
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    const step = this.step ?? 1;
    if (step > 0) v = min + Math.round((v - min) / step) * step;
    // Rounding errors of the step (0.1 + 0.2): keep its decimals.
    const decimals = step > 0 ? (String(step).split(".")[1] ?? "").length : 6;
    return Number(Math.max(min, Math.min(max, v)).toFixed(Math.min(10, decimals + 2)));
  }

  /** Where the bipolar arc starts: 0 when the range spans it, else the middle. */
  #origin() {
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    return min < 0 && max > 0 ? this.#pos(0) : 0.5;
  }

  /** What a double click (and an unset value) returns to. */
  #home() {
    if (this.defaultValue !== undefined && this.defaultValue !== null) return this.defaultValue;
    if (this._default !== null && this._default !== undefined) return Number(this._default);
    return this.bipolar ? this.#at(this.#origin()) : (this.min ?? 0);
  }

  #set(v, commit) {
    v = this.#clamp(v);
    if (v !== this.value) {
      this.commitProperty("value", v);
      this.#paint();
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    if (commit) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #down(e) {
    if (this.effectivelyDisabled || e.button !== 0) return;
    e.preventDefault();
    this.control.focus();
    try {
      this.control.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone: drag without capture.
    }
    // Shift is read as it moves, so pressing it mid-drag refines from there.
    this.#drag = { y: e.clientY, p: this.#pos(this.value ?? 0), fine: e.shiftKey, start: this.value };
    const move = (ev) => {
      const d = this.#drag;
      if (!d) return;
      if (ev.shiftKey !== d.fine) Object.assign(d, { y: ev.clientY, p: this.#pos(this.value ?? 0), fine: ev.shiftKey });
      this.#set(this.#at(d.p + (d.y - ev.clientY) / (DRAG * (d.fine ? 10 : 1))), false);
    };
    const up = () => {
      this.control.removeEventListener("pointermove", move);
      this.control.removeEventListener("pointerup", up);
      this.control.removeEventListener("pointercancel", up);
      const moved = this.#drag && this.#drag.start !== this.value;
      this.#drag = null;
      if (moved) this.dispatchEvent(new Event("change", { bubbles: true }));
    };
    this.control.addEventListener("pointermove", move);
    this.control.addEventListener("pointerup", up);
    this.control.addEventListener("pointercancel", up);
  }

  #wheel(e) {
    if (this.effectivelyDisabled) return;
    e.preventDefault();
    const notch = Math.sign(e.deltaY || e.deltaX);
    if (!notch) return;
    this.#set(this.#nudge(-notch, e.shiftKey), false);
    clearTimeout(this.#wheelEnd);
    this.#wheelEnd = setTimeout(() => this.dispatchEvent(new Event("change", { bubbles: true })), 250);
  }

  /** One step up or down: the step (linear), or a hundredth of the sweep (log); Shift: ten. */
  #nudge(dir, big) {
    const v = this.value ?? 0;
    if (this.#log()) return this.#at(this.#pos(v) + dir * (big ? 0.1 : 0.01));
    const step = (this.step ?? 1) > 0 ? this.step : ((this.max ?? 100) - (this.min ?? 0)) / 100;
    return v + dir * step * (big ? 10 : 1);
  }

  #key(e) {
    if (this.effectivelyDisabled) return;
    const v = this.value ?? 0;
    // Right to left, ArrowLeft turns it up (as a native range does).
    const key = inlineKey(e.key, this);
    let next = null;
    if (key === "ArrowUp" || key === "ArrowRight") next = this.#nudge(1, e.shiftKey);
    else if (key === "ArrowDown" || key === "ArrowLeft") next = this.#nudge(-1, e.shiftKey);
    else if (e.key === "PageUp") next = this.#at(this.#pos(v) + 0.1);
    else if (e.key === "PageDown") next = this.#at(this.#pos(v) - 0.1);
    else if (e.key === "Home") next = this.min ?? 0;
    else if (e.key === "End") next = this.max ?? 100;
    if (next === null) return;
    e.preventDefault();
    this.#set(next, true);
  }

  formResetCallback() {
    this.value = this._default === null ? undefined : Number(this._default);
  }

  formStateRestoreCallback(state) {
    this.value = Number(state);
  }
}

/** An SVG arc on the dial's ring, between two angles (0° up, clockwise). */
function arc(from, to) {
  if (Math.abs(to - from) < 0.5) return "";
  const pt = (deg) => {
    const t = ((deg - 90) * Math.PI) / 180;
    return `${(20 + R * Math.cos(t)).toFixed(3)} ${(20 + R * Math.sin(t)).toFixed(3)}`;
  };
  return `M${pt(from)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(to)}`;
}

define("ray-knob", RayKnob);
