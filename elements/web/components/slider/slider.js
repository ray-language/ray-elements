// <ray-slider>: a range input (native, so keyboard, touch and screen readers
// work as usual) with label, description, value display and marks.
// Form-associated. orientation="vertical" stands it up (a mixer's fader):
// the minimum at the bottom, the marks on its inline-start side (the left),
// aligned against the track so their numbers line up.

import { css, define } from "../../core/core.js";
import { applyColor, sizeStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles } from "../../core/form.js";

const styles = css`
  /* The thumb: --_ta across the track, --_tl along it; its look from the
     --ray-slider-thumb-* variables, over the defaults of its shape (round, or
     thumb="cap": a mixing desk's fader cap). */
  :host {
    --_track: 0.375rem;
    --_thumb: 1.125rem;
    --_ta: var(--ray-slider-thumb-size, var(--_thumb));
    --_tl: var(--ray-slider-thumb-length, var(--_thumb));
    --_tbg: var(--ray-slider-thumb-background, var(--ray-white));
    --_tborder: var(--ray-slider-thumb-border, 3px solid var(--_filled));
    --_tradius: var(--ray-slider-thumb-radius, 50%);
    --_tshadow: var(--ray-slider-thumb-shadow, var(--ray-shadow-xs));
  }
  :host([size="xs"]) { --_track: 0.25rem; --_thumb: 0.875rem; }
  :host([size="md"]) { --_track: 0.5rem; --_thumb: 1.375rem; }
  :host([size="lg"]) { --_track: 0.625rem; --_thumb: 1.625rem; }
  :host([size="xl"]) { --_track: 0.75rem; --_thumb: 1.875rem; }
  /* A fader cap: a short, wide block across a thin slot, a line at its middle. */
  :host([thumb="cap"]) {
    --_track: 0.25rem;
    --_ta: var(--ray-slider-thumb-size, 1.5rem);
    --_tl: var(--ray-slider-thumb-length, 0.875rem);
    --_tbg: var(--ray-slider-thumb-background, linear-gradient(to right, transparent calc(50% - 0.5px), var(--ray-foreground) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)) center / 100% calc(100% - 6px) no-repeat, linear-gradient(var(--ray-card), var(--ray-muted))); /* physical */
    --_tborder: var(--ray-slider-thumb-border, 1px solid var(--ray-border));
    --_tradius: var(--ray-slider-thumb-radius, 3px);
    --_tshadow: var(--ray-slider-thumb-shadow, 0 1px 2px rgb(0 0 0 / 0.4));
  }
  :host([thumb="cap"][orientation="vertical"]) {
    --_tbg: var(--ray-slider-thumb-background, linear-gradient(to bottom, transparent calc(50% - 0.5px), var(--ray-foreground) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)) center / calc(100% - 6px) 100% no-repeat, linear-gradient(var(--ray-card), var(--ray-muted))); /* physical */
  }
  .head[hidden] { display: none; }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--ray-space-2); }
  .value { font-size: calc(var(--_fs) - 0.0625rem); font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); }
  .value[hidden] { display: none; }
  .root { position: relative; padding: calc((var(--_ta) - var(--_track)) / 2) 0; }
  input {
    display: block;
    width: 100%;
    height: var(--_ta);
    margin: calc((var(--_track) - var(--_ta)) / 2) 0;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  input:disabled { cursor: not-allowed; }
  input::-webkit-slider-runnable-track {
    height: var(--_track);
    border-radius: var(--ray-radius-full);
    background: linear-gradient(to right, var(--_filled) var(--_pct), var(--ray-muted) var(--_pct)); /* physical */
    box-shadow: inset 0 0 0 1px var(--ray-border);
  }
  /* Right to left the native range runs from the right: so does its fill. */
  input:dir(rtl)::-webkit-slider-runnable-track { background: linear-gradient(to left, var(--_filled) var(--_pct), var(--ray-muted) var(--_pct)); } /* physical */
  input::-moz-range-track { height: var(--_track); border-radius: var(--ray-radius-full); background: var(--ray-muted); }
  input::-moz-range-progress { height: var(--_track); border-radius: var(--ray-radius-full); background: var(--_filled); }
  input::-webkit-slider-thumb {
    -webkit-appearance: none;
    box-sizing: border-box;
    width: var(--_tl);
    height: var(--_ta);
    margin-top: calc((var(--_track) - var(--_ta)) / 2);
    background: var(--_tbg);
    border: var(--_tborder);
    border-radius: var(--_tradius);
    box-shadow: var(--_tshadow);
  }
  input::-moz-range-thumb {
    box-sizing: border-box;
    width: var(--_tl);
    height: var(--_ta);
    background: var(--_tbg);
    border: var(--_tborder);
    border-radius: var(--_tradius);
    box-shadow: var(--_tshadow);
  }
  input:focus-visible { outline: none; }
  input:focus-visible::-webkit-slider-thumb { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  input:focus-visible::-moz-range-thumb { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  input:disabled { --_filled: var(--ray-border); }
  .marks { position: relative; height: 1.25rem; margin: var(--ray-space-1) calc(var(--_tl) / 2) 0; font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  .marks:empty { display: none; }
  .mark { position: absolute; inset-inline-start: var(--_at); transform: translateX(-50%); white-space: nowrap; }
  .mark:dir(rtl) { transform: translateX(50%); }
  .mark::before { content: ""; display: block; width: 1px; height: 0.25rem; margin: 0 auto 0.125rem; background: var(--ray-border); }

  /* Vertical: the track stands between the label (above) and the error; the
     marks run before it (on the left), aligned against it, so numbers line
     up. The length is the host's height. */
  :host([orientation="vertical"]) {
    display: inline-grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas: "head head" "description description" "marks root" "error error";
    justify-content: center;
    height: var(--ray-slider-length, 12rem);
    min-height: 0;
  }
  :host([orientation="vertical"][description-position="below"]) {
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    grid-template-areas: "head head" "marks root" "description description" "error error";
  }
  :host([orientation="vertical"]) .head { grid-area: head; flex-direction: column; align-items: center; gap: 0; margin-bottom: var(--ray-space-1); }
  :host([orientation="vertical"]) .label { align-self: center; margin-bottom: 0; }
  :host([orientation="vertical"]) .description { grid-area: description; text-align: center; }
  :host([orientation="vertical"]) .error { grid-area: error; text-align: center; }
  :host([orientation="vertical"]) .root { grid-area: root; justify-self: center; min-height: 0; padding: 0 calc((var(--_ta) - var(--_track)) / 2); }
  :host([orientation="vertical"]) input {
    writing-mode: vertical-lr;
    direction: rtl;
    width: var(--_ta);
    height: 100%;
    margin: 0 calc((var(--_track) - var(--_ta)) / 2);
  }
  :host([orientation="vertical"]) input::-webkit-slider-runnable-track {
    width: var(--_track);
    height: 100%;
    background: linear-gradient(to top, var(--_filled) var(--_pct), var(--ray-muted) var(--_pct)); /* physical */
  }
  :host([orientation="vertical"]) input::-webkit-slider-thumb { width: var(--_ta); height: var(--_tl); margin-top: 0; margin-left: calc((var(--_track) - var(--_ta)) / 2); } /* physical */
  :host([orientation="vertical"]) input::-moz-range-thumb { width: var(--_ta); height: var(--_tl); }
  :host([orientation="vertical"]) input::-moz-range-track { width: var(--_track); height: 100%; }
  :host([orientation="vertical"]) input::-moz-range-progress { width: var(--_track); height: auto; }
  :host([orientation="vertical"]) .marks { grid-area: marks; position: relative; height: auto; min-width: 1.5rem; margin: calc(var(--_tl) / 2) 0; margin-inline-end: var(--ray-space-1); font-variant-numeric: tabular-nums; }
  :host([orientation="vertical"]) .mark { inset-inline-start: auto; inset-inline-end: 0; bottom: var(--_at); display: flex; flex-direction: row-reverse; align-items: center; line-height: 1; transform: translateY(50%); } /* physical */
  :host([orientation="vertical"]) .mark::before { width: 0.25rem; height: 1px; margin: 0; margin-inline-start: 0.125rem; }
  /* thumb="cap": a plain slot, as on a desk (the cap shows the value). */
  :host([thumb="cap"]) input::-webkit-slider-runnable-track { background: var(--ray-muted); }
  :host([thumb="cap"]) input::-moz-range-progress { background: transparent; }
`;

export class RaySlider extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: Number },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    color: { type: String, reflect: true },
    showValue: { type: Boolean, reflect: true },
    unit: { type: String },
    marks: { attribute: false },
    /** horizontal, or vertical: a fader, the minimum at the bottom. */
    orientation: { type: String, reflect: true, default: "horizontal" },
    /** round, or cap: a mixing desk's fader cap. */
    thumb: { type: String, reflect: true, default: "round" },
  };
  static styles = [sizeStyles, fieldStyles, styles];
  static template = `
    <div class="head">
      <label class="label" part="label" for="control" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></label>
      <span class="value" part="value" aria-hidden="true" hidden></span>
    </div>
    <div class="description" part="description" id="description" hidden></div>
    <div class="root" part="root"><input id="control" type="range" part="input"></div>
    <div class="marks" part="marks"></div>
    <div class="error" part="error" id="error" hidden></div>`;

  wire() {
    this._default = this.getAttribute("value");
    this.control.addEventListener("input", () => {
      this.commitProperty("value", Number(this.control.value));
      this._commit();
    });
    this.control.addEventListener("change", (e) => this.forward(e));
  }

  update(changed) {
    const c = this.control;
    c.min = String(this.min ?? 0);
    c.max = String(this.max ?? 100);
    c.step = String(this.step ?? 1);
    if (this.value === undefined) this.commitProperty("value", Number(c.value));
    if (Number(c.value) !== this.value) c.value = String(this.value);
    applyColor(this.$(".root"), this.color);
    c.setAttribute("aria-orientation", this.orientation === "vertical" ? "vertical" : "horizontal");
    this.syncField();
    if (changed.has("marks") || changed.has("min") || changed.has("max") || !this._marked) this._renderMarks();
    this._commit();
  }

  _commit() {
    const c = this.control;
    const min = Number(c.min);
    const max = Number(c.max);
    const pct = max > min ? ((Number(c.value) - min) / (max - min)) * 100 : 0;
    c.style.setProperty("--_pct", `${pct}%`);
    const text = `${c.value}${this.unit ?? ""}`;
    const value = this.$(".value");
    value.hidden = !this.showValue;
    // Without a label or a shown value, no head: the track starts at the top.
    this.$(".head").hidden = !this.label && !this.showValue;
    value.textContent = text;
    if (this.unit) c.setAttribute("aria-valuetext", text);
    else c.removeAttribute("aria-valuetext");
    this.internals.setFormValue(c.value);
    this.syncValidity();
  }

  _renderMarks() {
    this._marked = true;
    const box = this.$(".marks");
    box.replaceChildren();
    if (!Array.isArray(this.marks)) return;
    const min = this.min ?? 0;
    const max = this.max ?? 100;
    for (const m of this.marks) {
      const v = typeof m === "number" ? m : m.value;
      const span = document.createElement("span");
      span.className = "mark";
      span.style.setProperty("--_at", `${((v - min) / (max - min || 1)) * 100}%`);
      span.textContent = typeof m === "number" ? String(m) : (m.label ?? String(m.value));
      box.append(span);
    }
  }

  formResetCallback() {
    this.value = this._default === null ? undefined : Number(this._default);
  }

  formStateRestoreCallback(state) {
    this.value = Number(state);
  }
}

define("ray-slider", RaySlider);
