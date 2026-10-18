// <ray-color-picker>: an inline color picker (Mantine's ColorPicker): a
// saturation/brightness area, a hue slider, an alpha slider when the format
// has one, a preview and optional swatches. Every part works with the
// pointer and the keyboard (arrows; Shift for bigger steps).
//
// <ray-color-input>: a text field for a color (Mantine's ColorInput): type
// any CSS color, or pick it in a dropdown with a ray-color-picker; a preview
// swatch on the left and, where the browser has one, an eyedropper.
//
// Both are form-associated and fire `input` while the color moves and
// `change` when it settles (pointer released, key pressed, swatch chosen).
// `value` is a string in `format`: hex (#7c3aed), hexa (#7c3aedcc), rgb,
// rgba, hsl or hsla.

import { css, define } from "../../core/core.js";
import { FormControl, FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { parseColor } from "../../core/color.js";
import { place, autoUpdate } from "../../core/position.js";
import { dismissable } from "../../core/dismiss.js";
import { play, POP_OUT } from "../../core/motion.js";

// --- color model ----------------------------------------------------------------

const FORMATS = ["hex", "hexa", "rgb", "rgba", "hsl", "hsla"];
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

/** Whether a format carries alpha. */
const hasAlpha = (format) => /a$/.test(format);

function rgbToHsv({ r, g, b }) {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToRgb({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return { r: f(5), g: f(3), b: f(1) };
}

function rgbToHsl({ r, g, b }) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h: rgbToHsv({ r, g, b }).h, s, l };
}

function hslToRgb({ h, s, l }) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

// "50%" → 0.5 of `scale`; "128" → 128 / scale.
function channel(token, scale) {
  const t = String(token).trim();
  if (t.endsWith("%")) return clamp(parseFloat(t) / 100);
  return clamp(parseFloat(t) / scale);
}

function alphaOf(token) {
  if (token === undefined || token === "") return 1;
  const t = String(token).trim();
  return clamp(t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t));
}

/**
 * A color string as sRGB channels and alpha, all 0…1, or null. Reads hex
 * (3, 4, 6 or 8 digits, # optional), rgb()/rgba(), hsl()/hsla() (commas or
 * spaces, alpha after a slash or a fourth value) and any other CSS color the
 * browser knows (named colors, oklch()…; alpha 1).
 */
export function parseColorValue(input) {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return null;
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(s);
  if (fn) {
    const [main, slash] = fn[2].split("/");
    const parts = main.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3 || parts.some((p) => Number.isNaN(parseFloat(p)))) return null;
    const a = alphaOf(slash ?? parts[3]);
    if (Number.isNaN(a)) return null;
    if (fn[1].startsWith("rgb")) return { r: channel(parts[0], 255), g: channel(parts[1], 255), b: channel(parts[2], 255), a };
    const h = ((parseFloat(parts[0]) % 360) + 360) % 360;
    return { ...hslToRgb({ h, s: channel(parts[1], 100), l: channel(parts[2], 100) }), a };
  }
  const rgb = parseColor(s);
  return rgb ? { ...rgb, a: 1 } : null;
}

const round = (x, d = 0) => Number(x.toFixed(d));

/** sRGB channels and alpha (0…1) as a string in `format`. */
export function formatColor({ r, g, b, a = 1 }, format = "hex") {
  const byte = (x) => Math.round(clamp(x) * 255);
  const hex2 = (x) => byte(x).toString(16).padStart(2, "0");
  const alpha = round(clamp(a), 2);
  switch (format) {
    case "hexa": return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a)}`;
    case "rgb": return `rgb(${byte(r)}, ${byte(g)}, ${byte(b)})`;
    case "rgba": return `rgba(${byte(r)}, ${byte(g)}, ${byte(b)}, ${alpha})`;
    case "hsl":
    case "hsla": {
      const { h, s, l } = rgbToHsl({ r, g, b });
      const body = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
      return format === "hsl" ? `hsl(${body})` : `hsla(${body}, ${alpha})`;
    }
    default: return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  }
}

// "#fff, rgb(1, 2, 3), red" → three colors (commas inside parentheses kept).
function splitColors(list) {
  if (Array.isArray(list)) return list.map(String);
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of String(list ?? "")) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

// --- ray-color-picker ------------------------------------------------------------

const CHECKER = "repeating-conic-gradient(#c8c8c8 0 25%, #fff 0 50%) 0 0 / 8px 8px";

const pickerStyles = css`
  :host { display: inline-block; --_w: 15rem; --_thumb: 0.875rem; --_bar: 0.75rem; }
  :host([size="xs"]) { --_w: 11rem; --_thumb: 0.75rem; --_bar: 0.625rem; }
  :host([size="sm"]) { --_w: 13rem; }
  :host([size="lg"]) { --_w: 17.5rem; --_thumb: 1rem; --_bar: 0.875rem; }
  :host([size="xl"]) { --_w: 20rem; --_thumb: 1.125rem; --_bar: 1rem; }
  :host([full-width]) { display: block; --_w: 100%; }
  :host([disabled]) { opacity: 0.5; pointer-events: none; }
  .picker { display: grid; gap: var(--ray-space-2); width: var(--_w); }
  :host([swatches-only]) .area, :host([swatches-only]) .row { display: none; }

  .area {
    position: relative;
    height: calc(var(--_w) * 0.62);
    background:
      linear-gradient(to top, #000, transparent),
      linear-gradient(to right, #fff, hsl(var(--_hue) 100% 50%));
    border-radius: var(--ray-radius-sm);
    cursor: crosshair;
    touch-action: none;
  }
  :host([full-width]) .area { height: auto; aspect-ratio: 5 / 3; }
  .area-thumb {
    position: absolute;
    left: var(--_s); /* physical */
    top: calc(100% - var(--_v));
    width: var(--_thumb);
    height: var(--_thumb);
    box-sizing: border-box;
    background: var(--_solid);
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 3px rgb(0 0 0 / 0.35);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .row { display: flex; align-items: center; gap: var(--ray-space-2); }
  .sliders { display: grid; flex: 1; gap: var(--ray-space-2); min-width: 0; }
  .slider {
    position: relative;
    height: var(--_bar);
    margin-inline: calc(var(--_thumb) / 2);
    border-radius: 999px;
    cursor: pointer;
    touch-action: none;
  }
  .slider::before {
    content: "";
    position: absolute;
    inset: 0 calc(var(--_thumb) / -2);
    border-radius: inherit;
  }
  .hue::before { background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); }
  .alpha::before { background: linear-gradient(to right, transparent, var(--_solid)), ${CHECKER}; }
  :host(:not([data-alpha])) .alpha { display: none; }
  .slider-thumb {
    position: absolute;
    top: 50%;
    left: var(--_pos); /* physical */
    width: var(--_thumb);
    height: var(--_thumb);
    box-sizing: border-box;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 3px rgb(0 0 0 / 0.35);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .hue .slider-thumb { --_pos: calc(var(--_hue) / 360 * 100%); background: hsl(var(--_hue) 100% 50%); }
  .alpha .slider-thumb { --_pos: var(--_alpha); background: linear-gradient(var(--_color), var(--_color)), ${CHECKER}; }

  .preview {
    flex: none;
    width: calc(var(--_bar) * 2 + var(--ray-space-2));
    aspect-ratio: 1;
    background: linear-gradient(var(--_color), var(--_color)), ${CHECKER};
    border-radius: var(--ray-radius-sm);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
  }
  :host(:not([data-alpha])) .preview { width: calc(var(--_bar) * 1.75); }

  .swatches { display: grid; grid-template-columns: repeat(var(--_per-row, 7), minmax(0, 1fr)); gap: var(--ray-space-1); }
  .swatches:empty { display: none; }
  .swatch {
    aspect-ratio: 1;
    padding: 0;
    background: linear-gradient(var(--_c), var(--_c)), ${CHECKER};
    border: 0;
    border-radius: var(--ray-radius-sm);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
    cursor: pointer;
  }
  .swatch[aria-pressed="true"] { box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12), 0 0 0 2px var(--ray-background), 0 0 0 4px var(--_c); }

  .area:focus-visible, .slider:focus-visible, .swatch:focus-visible {
    outline: var(--ray-focus-ring-width) solid var(--ray-ring);
    outline-offset: 2px;
  }
`;

export class RayColorPicker extends FormControl {
  static properties = {
    value: { type: String },
    format: { type: String, reflect: true, default: "hex" },
    swatches: { type: String },
    swatchesPerRow: { type: Number, default: 7 },
    swatchesOnly: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    fullWidth: { type: Boolean, reflect: true },
    name: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
  };
  static styles = [pickerStyles];
  static template = `
    <div class="picker" part="picker">
      <div class="area" part="saturation" tabindex="0" role="slider" aria-label="Saturation and brightness"><div class="area-thumb"></div></div>
      <div class="row">
        <div class="sliders">
          <div class="slider hue" part="hue" tabindex="0" role="slider" aria-label="Hue" aria-valuemin="0" aria-valuemax="360"><div class="slider-thumb"></div></div>
          <div class="slider alpha" part="alpha" tabindex="0" role="slider" aria-label="Opacity" aria-valuemin="0" aria-valuemax="100"><div class="slider-thumb"></div></div>
        </div>
        <div class="preview" part="preview" aria-hidden="true"></div>
      </div>
      <div class="swatches" part="swatches" role="group" aria-label="Swatches"></div>
    </div>`;

  /** h 0…360, s/v/a 0…1: kept apart from value so hue survives grays. */
  #hsva = { h: 0, s: 0, v: 0, a: 1 };
  #shown = null;
  #default = "";
  #dragged = false;

  constructor() {
    super();
    this.area = this.$(".area");
    this.hue = this.$(".hue");
    this.alpha = this.$(".alpha");
    this.#drag(this.area, (x, y) => ({ s: x, v: 1 - y }));
    this.#drag(this.hue, (x) => ({ h: x * 360 }));
    this.#drag(this.alpha, (x) => ({ a: x }));
    this.area.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      const moves = { ArrowLeft: { s: -step }, ArrowRight: { s: step }, ArrowDown: { v: -step }, ArrowUp: { v: step } };
      this.#key(e, moves[e.key]);
    });
    this.hue.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 1;
      const moves = { ArrowLeft: { h: -step }, ArrowDown: { h: -step }, ArrowRight: { h: step }, ArrowUp: { h: step }, Home: { h: -360 }, End: { h: 360 } };
      this.#key(e, moves[e.key]);
    });
    this.alpha.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      const moves = { ArrowLeft: { a: -step }, ArrowDown: { a: -step }, ArrowRight: { a: step }, ArrowUp: { a: step }, Home: { a: -1 }, End: { a: 1 } };
      this.#key(e, moves[e.key]);
    });
    this.$(".swatches").addEventListener("click", (e) => {
      const swatch = e.target.closest(".swatch");
      if (!swatch) return;
      const rgba = parseColorValue(swatch.dataset.color);
      if (!rgba) return;
      this.#setRgba(rgba);
      this.#emit(true);
    });
  }

  connectedCallback() {
    this.#default = this.getAttribute("value") ?? "";
    super.connectedCallback();
  }

  /** The current color as sRGB channels and alpha (0…1). */
  get rgba() {
    return { ...hsvToRgb(this.#hsva), a: this.#hsva.a };
  }

  update(changed) {
    const format = FORMATS.includes(this.format) ? this.format : "hex";
    this.toggleAttribute("data-alpha", hasAlpha(format));
    // A value from outside: read it, unless it is what we just wrote.
    if (this.value !== this.#shown) {
      const rgba = parseColorValue(this.value);
      if (rgba) this.#setRgba(rgba);
      this.#shown = this.value;
    }
    if (changed.has("format") && this.value) this.#write();
    this.#paint();
    this.#swatches();
    this.style.setProperty("--_per-row", String(this.swatchesPerRow || 7));
    const off = this.disabled || this.effectivelyDisabled;
    for (const el of [this.area, this.hue, this.alpha]) el.tabIndex = off ? -1 : 0;
    if (this.label) this.$(".picker").setAttribute("aria-label", this.label);
    this.$(".picker").setAttribute("role", "group");
    this.internals.setFormValue(this.name && this.value ? this.value : null);
  }

  #setRgba(rgba) {
    const hsv = rgbToHsv(rgba);
    // A gray has no hue and black no saturation: keep the previous ones.
    this.#hsva = {
      h: hsv.s === 0 || hsv.v === 0 ? this.#hsva.h : hsv.h,
      s: hsv.v === 0 ? this.#hsva.s : hsv.s,
      v: hsv.v,
      a: rgba.a,
    };
  }

  #write() {
    const format = FORMATS.includes(this.format) ? this.format : "hex";
    const v = formatColor(this.rgba, format);
    this.#shown = v;
    this.commitProperty("value", v);
    this.internals.setFormValue(this.name ? v : null);
  }

  #paint() {
    const { h, s, v, a } = this.#hsva;
    const rgb = hsvToRgb(this.#hsva);
    const solid = formatColor(rgb, "rgb");
    const st = this.style;
    st.setProperty("--_hue", String(Math.round(h * 10) / 10));
    st.setProperty("--_s", `${s * 100}%`);
    st.setProperty("--_v", `${v * 100}%`);
    st.setProperty("--_alpha", `${a * 100}%`);
    st.setProperty("--_solid", solid);
    st.setProperty("--_color", formatColor({ ...rgb, a }, "rgba"));
    this.area.setAttribute("aria-valuetext", `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`);
    this.area.setAttribute("aria-valuenow", String(Math.round(s * 100)));
    this.hue.setAttribute("aria-valuenow", String(Math.round(h)));
    this.hue.setAttribute("aria-valuetext", `${Math.round(h)} degrees`);
    this.alpha.setAttribute("aria-valuenow", String(Math.round(a * 100)));
    this.alpha.setAttribute("aria-valuetext", `${Math.round(a * 100)}%`);
    const current = (this.value ?? "").toLowerCase();
    for (const sw of this.$$swatches()) {
      const c = parseColorValue(sw.dataset.color);
      sw.setAttribute("aria-pressed", String(Boolean(c) && formatColor(c, "hexa") === formatColor(this.rgba, "hexa") && current !== ""));
    }
  }

  $$swatches() {
    return [...this.$(".swatches").children];
  }

  #swatches() {
    const list = splitColors(this.swatches);
    const box = this.$(".swatches");
    if (box.dataset.list === list.join("|")) return;
    box.dataset.list = list.join("|");
    box.replaceChildren(...list.map((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.dataset.color = c;
      b.style.setProperty("--_c", c);
      b.setAttribute("aria-label", c);
      b.title = c;
      return b;
    }));
    this.#paint();
  }

  // Pointer drags over an area or a slider: `map` turns the pointer's
  // position (0…1 on each axis) into channel values.
  #drag(el, map) {
    const at = (e) => {
      const r = el.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width);
      const y = clamp((e.clientY - r.top) / r.height);
      Object.assign(this.#hsva, map(x, y));
      this.#emit(false);
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || this.disabled) return;
      e.preventDefault();
      el.focus({ preventScroll: true });
      el.setPointerCapture(e.pointerId);
      this.#dragged = true;
      at(e);
    });
    el.addEventListener("pointermove", (e) => {
      if (el.hasPointerCapture(e.pointerId)) at(e);
    });
    const end = (e) => {
      if (!el.hasPointerCapture?.(e.pointerId) && !this.#dragged) return;
      this.#dragged = false;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("lostpointercapture", (e) => { if (this.#dragged) end(e); });
  }

  #key(e, move) {
    if (!move) return;
    e.preventDefault();
    const c = this.#hsva;
    if ("h" in move) c.h = clamp(c.h + move.h, 0, 360);
    if ("s" in move) c.s = clamp(c.s + move.s);
    if ("v" in move) c.v = clamp(c.v + move.v);
    if ("a" in move) c.a = clamp(c.a + move.a);
    this.#emit(true);
  }

  // The color moved: write value, repaint, tell (input; change when settled).
  #emit(settled) {
    this.#write();
    this.#paint();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    if (settled) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  formResetCallback() {
    this.value = this.#default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }
}

define("ray-color-picker", RayColorPicker);

// --- ray-color-input --------------------------------------------------------------

const inputStyles = css`
  .preview {
    flex: none;
    width: calc(var(--_h) * 0.55);
    height: calc(var(--_h) * 0.55);
    margin-inline-start: calc(var(--_px) * 0.6);
    padding: 0;
    background: linear-gradient(var(--_color, transparent), var(--_color, transparent)), ${CHECKER};
    border: 0;
    border-radius: calc(var(--_r) * 0.6);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
    cursor: pointer;
  }
  .control { font-variant-numeric: tabular-nums; }
  .dropper {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: max(1.5rem, calc(var(--_h) * 0.65));
    height: max(1.5rem, calc(var(--_h) * 0.65));
    margin-inline-end: calc(var(--_px) * 0.4);
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .dropper:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .dropper svg { width: 1em; height: 1em; }
  .panel {
    box-sizing: border-box;
    margin: 0;
    padding: var(--ray-space-3);
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-md);
    box-shadow: var(--ray-shadow-md);
  }
  .panel:popover-open { animation: ray-pop-in var(--ray-duration-fast) var(--ray-easing-out); }
  @keyframes ray-pop-in { from { opacity: 0; transform: translateY(-2px); } }
`;

export class RayColorInput extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String },
    format: { type: String, reflect: true, default: "hex" },
    swatches: { type: String },
    swatchesPerRow: { type: Number, default: 7 },
    placeholder: { type: String },
    hideEyedropper: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, inputStyles];
  static template = fieldTemplate(
    `<button type="button" class="preview" part="preview" tabindex="-1" aria-hidden="true"></button>` +
      `<input id="control" class="control" part="input" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="none" aria-haspopup="dialog" aria-expanded="false" aria-controls="panel">` +
      `<button type="button" class="dropper focus-ring" part="eyedropper" aria-label="Pick a color from the screen" hidden><span data-ray-icon="ui.eyedropper" aria-hidden="true"></span></button>`,
    { sections: false },
  ) + `<div class="panel" id="panel" part="dropdown" popover="manual" role="dialog" aria-label="Choose a color"><ray-color-picker part="picker"></ray-color-picker></div>`;

  #undismiss = null;
  #exit = null;
  #stopTracking = null;
  #default = "";
  /** The value at the last change event: change fires only when it moved. */
  #settled = "";

  constructor() {
    super();
    /** The dropdown ([popover]) holding the picker. */
    this.panel = this.$("#panel");
    /** The <ray-color-picker> in the dropdown. */
    this.picker = this.$("ray-color-picker");
  }

  wire() {
    this.#default = this.getAttribute("value") ?? "";
    this.#settled = this.#default;
    const c = this.control;
    c.addEventListener("click", () => this.toggle(true));
    this.$(".preview").addEventListener("click", () => { c.focus(); this.toggle(); });
    c.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && !this.open) {
        e.preventDefault();
        this.toggle(true);
      } else if (e.key === "Enter") {
        this.#fix();
        this.open = false;
      }
    });
    // Typing: a valid color is the value at once; the text is fixed on blur.
    c.addEventListener("input", () => {
      const rgba = parseColorValue(c.value);
      c.setCustomValidity(c.value && !rgba ? "Enter a valid color." : "");
      if (rgba) {
        this.commitProperty("value", formatColor(rgba, this.#format()));
        this.picker.value = this.value;
      } else if (!c.value) {
        this.commitProperty("value", "");
      }
      this._commit();
      this.#paint();
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    c.addEventListener("change", () => this.#fix());
    c.addEventListener("blur", () => this.#fix());
    this.picker.addEventListener("input", (e) => {
      e.stopPropagation();
      this.commitProperty("value", this.picker.value);
      c.value = this.value;
      c.setCustomValidity("");
      this._commit();
      this.#paint();
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    this.picker.addEventListener("change", (e) => {
      e.stopPropagation();
      this.#settle();
    });
    const dropper = this.$(".dropper");
    dropper.hidden = !("EyeDropper" in window);
    dropper.addEventListener("click", async () => {
      try {
        const { sRGBHex } = await new window.EyeDropper().open();
        this.#userSet(sRGBHex);
      } catch {
        // Cancelled (Escape) or refused: nothing to do.
      }
    });
    this.panel.addEventListener("toggle", (e) => this.#onToggle(e.newState === "open"));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTracking?.();
    this.#stopTracking = null;
    this.#undismiss?.();
    this.#undismiss = null;
  }

  #format() {
    return FORMATS.includes(this.format) ? this.format : "hex";
  }

  update(changed) {
    const c = this.control;
    c.placeholder = this.placeholder ?? "";
    // A value from outside, in the field's format.
    if (changed.has("value") || changed.has("format")) {
      const rgba = parseColorValue(this.value);
      const v = rgba ? formatColor(rgba, this.#format()) : (this.value ?? "");
      if (v !== this.value) this.commitProperty("value", v);
      if (this.shadowRoot.activeElement !== c || !c.value) c.value = v;
      c.setCustomValidity("");
    }
    const p = this.picker;
    p.format = this.#format();
    p.swatches = this.swatches;
    p.swatchesPerRow = this.swatchesPerRow;
    p.size = this.size === "xs" ? "xs" : this.size === "lg" || this.size === "xl" ? "md" : "sm";
    if (this.value && p.value !== this.value) p.value = this.value;
    const dropper = this.$(".dropper");
    if (this.hideEyedropper || !("EyeDropper" in window)) dropper.hidden = true;
    else dropper.hidden = false;
    dropper.disabled = this.effectivelyDisabled;
    this.syncField();
    this._commit();
    this.#paint();
    if (changed.has("open")) this.#setOpen(Boolean(this.open));
  }

  _commit() {
    this.internals.setFormValue(this.value || null);
    this.syncValidity();
  }

  #paint() {
    const rgba = parseColorValue(this.value);
    if (rgba) this.style.setProperty("--_color", formatColor(rgba, "rgba"));
    else this.style.removeProperty("--_color");
  }

  // Leaving the field: invalid or partial text goes back to the value.
  #fix() {
    const c = this.control;
    if (c.value !== (this.value ?? "")) c.value = this.value ?? "";
    c.setCustomValidity("");
    this._commit();
    this.#settle();
  }

  #settle() {
    if ((this.value ?? "") === this.#settled) return;
    this.#settled = this.value ?? "";
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // A color chosen by the user outside the text: value, field, picker, events.
  #userSet(color) {
    const rgba = parseColorValue(color);
    if (!rgba) return;
    this.value = formatColor(rgba, this.#format());
    this.control.value = this.value;
    this.picker.value = this.value;
    this._commit();
    this.#paint();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.#settle();
  }

  /** Opens or closes the dropdown. */
  toggle(force) {
    if (this.effectivelyDisabled) return;
    this.open = force ?? !this.open;
  }

  #setOpen(open) {
    const p = this.panel;
    if (!this.isConnected) return;
    const shown = p.matches(":popover-open");
    if (open) {
      this.#exit?.cancel();
      this.#exit = null;
      p.style.pointerEvents = "";
      if (!shown) {
        try {
          p.showPopover();
        } catch {
          this.commitProperty("open", false);
          return;
        }
      }
      this.#undismiss ??= dismissable({
        panel: p,
        owner: this,
        trigger: this.$(".box"),
        close: (reason) => {
          this.open = false;
          if (reason === "escape") this.control.focus();
        },
      });
    } else if (shown && !this.#exit) {
      this.#leave();
    }
  }

  async #leave() {
    const p = this.panel;
    this.#undismiss?.();
    this.#undismiss = null;
    this.control.setAttribute("aria-expanded", "false");
    const exit = play(p, POP_OUT, { speed: "fast" });
    this.#exit = exit;
    p.style.pointerEvents = "none";
    await exit.finished;
    p.style.pointerEvents = "";
    if (this.#exit !== exit) return;
    this.#exit = null;
    if (!this.open && p.matches(":popover-open")) p.hidePopover();
    exit.cancel();
  }

  #onToggle(open) {
    this.control.setAttribute("aria-expanded", String(open));
    if (open) {
      const box = this.$(".box");
      const update = () => place(box.getBoundingClientRect(), this.panel, { placement: "bottom-start", offset: 4 });
      update();
      this.#stopTracking?.();
      this.#stopTracking = autoUpdate(box, this.panel, update);
    } else {
      this.#stopTracking?.();
      this.#stopTracking = null;
    }
    if (Boolean(this.open) !== open) this.commitProperty("open", open);
    this.emit(open ? "ray-open" : "ray-close");
  }

  formResetCallback() {
    this.value = this.#default;
    this.#settled = this.#default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }
}

define("ray-color-input", RayColorInput);
