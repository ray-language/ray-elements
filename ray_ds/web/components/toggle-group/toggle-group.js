// <ray-toggle-group>: a set of <ray-toggle> with one shared value (shadcn's
// ToggleGroup). type="single": at most one on (text alignment, a view mode);
// type="multiple": any number (bold / italic / underline).
//
// A ray-button-group, so the toggles are joined (corners squared, borders
// overlapped); `spaced` keeps them apart. variant, color, size and square on
// the group reach every toggle that does not set its own. Arrow keys move
// between toggles (one tab stop, the selected one); Space/Enter flips the
// focused one. Each toggle's `value` (else its text) is its key.
//
//   <ray-toggle-group type="single" value="left" label="Alignment">
//     <ray-toggle value="left">Left</ray-toggle> …
//   </ray-toggle-group>

import { css, define } from "../../core/core.js";
import { RayButtonGroup } from "../button-group/button-group.js";
import "../toggle/toggle.js";

const styles = css`
  /* spaced: apart, each toggle with its own corners. */
  :host([spaced]) { gap: var(--ray-space-1); flex-wrap: wrap; }
  /* !important: the joined rules of ray-button-group are more specific. */
  :host([spaced]) ::slotted(*) {
    margin: 0 !important;
    --ray-group-radius-ss: initial !important;
    --ray-group-radius-se: initial !important;
    --ray-group-radius-es: initial !important;
    --ray-group-radius-ee: initial !important;
  }
`;

// Group properties handed down to toggles that do not set their own.
const INHERITED = ["variant", "color", "size", "square", "radius"];

export class RayToggleGroup extends RayButtonGroup {
  static formAssociated = true;
  static properties = {
    ...RayButtonGroup.properties,
    type: { type: String, reflect: true, default: "single" },
    value: { type: String },
    name: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    spaced: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true },
    radius: { type: String, reflect: true },
    square: { type: Boolean, reflect: true },
  };
  static styles = [...RayButtonGroup.styles, styles];

  /** What the group set on each toggle (so the toggle's own attributes win). */
  #handed = new WeakMap();
  #initial = null;
  #fieldsetDisabled = false;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
    // A toggle flipped itself: apply the group's rule, then announce the
    // group's value. The toggles' own change events stop here.
    this.addEventListener("change", (e) => {
      const t = e.target;
      if (t === this) return;
      e.stopPropagation();
      if (t.localName === "ray-toggle" && t.closest("ray-toggle-group") === this) this.#flipped(t);
    });
    this.addEventListener("keydown", (e) => this.#key(e));
    this.addEventListener("focusin", (e) => {
      const t = e.composedPath().find((n) => n.localName === "ray-toggle");
      if (t && this.toggles.includes(t)) this.#rove(t);
    });
  }

  connectedCallback() {
    this.#initial ??= this.getAttribute("value");
    super.connectedCallback();
  }

  formDisabledCallback(disabled) {
    this.#fieldsetDisabled = disabled;
    this.requestUpdate();
  }

  formResetCallback() {
    this.value = this.#initial ?? undefined;
  }

  /** The toggles of this group (not of a nested one). */
  get toggles() {
    return [...this.querySelectorAll("ray-toggle")].filter((t) => t.closest("ray-toggle-group") === this);
  }

  get #multiple() {
    return this.type === "multiple";
  }

  /** The selected values as a list (single: zero or one). */
  get values() {
    const v = this.value;
    if (Array.isArray(v)) return [...v];
    if (v === null || v === undefined || v === "") return [];
    return this.#multiple ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [String(v)];
  }

  set values(list) {
    this.value = this.#multiple ? [...(list ?? [])] : (list?.[0] ?? undefined);
  }

  #key(e) {
    const vertical = this.orientation === "vertical";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    if (![next, prev, "Home", "End"].includes(e.key)) return;
    const items = this.toggles.filter((t) => !t.disabled);
    if (items.length === 0) return;
    const current = items.findIndex((t) => t.matches(":focus-within"));
    let i = current;
    if (e.key === "Home") i = 0;
    else if (e.key === "End") i = items.length - 1;
    else if (e.key === next) i = (current + 1) % items.length;
    else i = (current - 1 + items.length) % items.length;
    e.preventDefault();
    this.#rove(items[i]);
    items[i].focus();
  }

  // One tab stop: the given toggle gets tabindex 0, the others -1 (a host
  // with a negative tabindex takes its shadow button out of the tab order).
  #rove(target) {
    for (const t of this.toggles) t.tabIndex = t === target ? 0 : -1;
  }

  #keyOf(t) {
    return t.value ?? t.textContent.trim();
  }

  #flipped(t) {
    const key = this.#keyOf(t);
    const before = this.values;
    let next;
    if (this.#multiple) {
      next = t.pressed ? [...before.filter((v) => v !== key), key] : before.filter((v) => v !== key);
      // Keep the order of the toggles, not of the clicks.
      const order = this.toggles.map((x) => this.#keyOf(x));
      next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    } else if (t.pressed) {
      next = [key];
    } else {
      // Single and required: the selected toggle cannot be turned off.
      next = this.required ? [key] : [];
    }
    this.values = next;
    this.#sync();
    if (next.join("\n") !== before.join("\n")) {
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Pressed states, handed-down properties and tab stops from the value.
  #sync() {
    const selected = this.values;
    const toggles = this.toggles;
    const disabled = Boolean(this.disabled) || this.#fieldsetDisabled;
    for (const t of toggles) {
      t.pressed = selected.includes(this.#keyOf(t));
      let handed = this.#handed.get(t);
      if (!handed) this.#handed.set(t, (handed = new Set()));
      for (const prop of [...INHERITED, "disabled"]) {
        const groupValue = prop === "disabled" ? (disabled || undefined) : this[prop];
        const attr = prop;
        if (t.hasAttribute(attr) && !handed.has(prop)) continue;
        if (groupValue === undefined || groupValue === null || groupValue === false) {
          if (handed.has(prop)) {
            t[prop] = prop === "square" || prop === "disabled" ? false : undefined;
            handed.delete(prop);
          }
        } else {
          t[prop] = groupValue;
          handed.add(prop);
        }
      }
    }
    const stop = toggles.find((t) => t.pressed && !t.disabled) ?? toggles.find((t) => !t.disabled);
    if (!toggles.some((t) => t.matches(":focus-within"))) this.#rove(stop);
  }

  update(changed) {
    super.update(changed);
    // A single group never keeps more than one value.
    if (!this.#multiple && this.values.length > 1) this.commitProperty("value", this.values[0]);
    this.#sync();
    const values = this.values;
    if (this.name && values.length) {
      if (this.#multiple) {
        const data = new FormData();
        for (const v of values) data.append(this.name, v);
        this.internals.setFormValue(data);
      } else {
        this.internals.setFormValue(values[0]);
      }
    } else {
      this.internals.setFormValue(null);
    }
    const first = this.toggles[0];
    if (this.required && values.length === 0) {
      this.internals.setValidity({ valueMissing: true }, "Select an option.", first?._el ?? undefined);
    } else {
      this.internals.setValidity({});
    }
  }
}

define("ray-toggle-group", RayToggleGroup);
