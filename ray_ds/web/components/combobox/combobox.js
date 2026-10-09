// <ray-combobox>: a select you can type in (Mantine's Select searchable,
// MultiSelect and TagsInput in one). Typing filters the options; Enter or
// a click picks one. `multiple` keeps several as chips (Backspace removes
// the last); `creatable` adds what was typed when nothing matches;
// `clearable` adds a button that clears it; `max-values` caps a multiple.
//
// Options: child <option>/<optgroup> elements or `data` (strings or
// { value, label, disabled, group }). The value is a string, or an array
// with `multiple` (the attribute: "a,b"); the form gets one entry per value.
//
// The WAI-ARIA combobox pattern with a listbox popup: focus stays in the
// text field, the active option is aria-activedescendant.

import { css, define, uid } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { place, autoUpdate } from "../../core/position.js";
import { dismissable } from "../../core/dismiss.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

const styles = css`
  .box { flex-wrap: wrap; gap: 0.25rem; padding-inline-start: calc(var(--_px) * 0.66 - 0.25rem); cursor: text; }
  :host([multiple]) .box[data-has-chips] { padding-block: 0.25rem; }
  .control { padding-inline: 0.25rem; min-width: 4rem; }
  :host([multiple]) .box[data-has-chips] .control { min-height: calc(var(--_h) - 0.5rem - 2px); }
  .chips { display: contents; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    max-width: 100%;
    height: calc(var(--_h) - 0.75rem);
    min-height: 1.375rem;
    padding: 0 0.125rem 0 0.5rem;
    font-size: calc(var(--_fs) - 0.0625rem);
    color: var(--ray-foreground);
    background: var(--ray-muted);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
    box-sizing: border-box;
  }
  .chip .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chip button, .clear {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: none;
    border: 0;
    border-radius: var(--ray-radius-xs);
    cursor: pointer;
    --ray-icon-size: 0.75rem;
  }
  .chip button:hover, .clear:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .chip button:focus-visible, .clear:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 1px; }
  .tail { display: inline-flex; align-items: center; gap: 0.125rem; margin-inline-start: auto; padding-inline-end: calc(var(--_px) * 0.5); align-self: stretch; }
  .clear { width: 1.375rem; height: 1.375rem; }
  .clear[hidden] { display: none; }
  .chevron { display: inline-flex; color: var(--ray-muted-foreground); pointer-events: none; transition: transform var(--ray-duration-fast) var(--ray-easing-standard); --ray-icon-size: 1em; }
  :host([open]) .chevron { transform: rotate(180deg); }
  .options { display: none; }

  .listbox {
    box-sizing: border-box;
    max-height: min(18rem, calc(100vh - 16px));
    overflow: auto;
    margin: 0;
    padding: var(--ray-space-1);
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    box-shadow: var(--ray-shadow-md);
    font-size: var(--_fs);
    overscroll-behavior: contain;
  }
  .listbox:popover-open { animation: ray-pop-in var(--ray-duration-fast) var(--ray-easing-out); }
  @keyframes ray-pop-in { from { opacity: 0; transform: translateY(-2px); } }
  .option {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    min-height: calc(var(--_h) - 0.25rem);
    padding: 0 var(--ray-space-2);
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
    user-select: none;
  }
  .option .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .option .text mark { color: inherit; background: none; font-weight: var(--ray-font-weight-bold, 700); }
  .option .mark { display: inline-flex; color: var(--ray-primary); visibility: hidden; --ray-icon-size: 1em; }
  .option[aria-selected="true"] .mark { visibility: visible; }
  .option[data-active] { background: var(--ray-accent); color: var(--ray-accent-foreground); }
  .option[aria-disabled="true"] { color: var(--ray-muted-foreground); cursor: not-allowed; opacity: 0.6; }
  .option.create { color: var(--ray-primary-light-color); }
  .group-label { padding: var(--ray-space-2) var(--ray-space-2) var(--ray-space-1); font-size: var(--ray-font-size-xs); font-weight: var(--ray-font-weight-medium); color: var(--ray-muted-foreground); }
  .empty, .more { padding: var(--ray-space-2); font-size: calc(var(--_fs) - 0.0625rem); color: var(--ray-muted-foreground); }
`;

/** "a, b" (an attribute) or an array, as an array of strings. */
const toList = (v) => (Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export class RayCombobox extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { attribute: false },
    data: { attribute: false },
    multiple: { type: Boolean, reflect: true },
    placeholder: { type: String },
    creatable: { type: Boolean },
    clearable: { type: Boolean },
    maxValues: { type: Number, attribute: "max-values" },
    limit: { type: Number },
    nothingFound: { type: String, attribute: "nothing-found", default: "No matches" },
    open: { type: Boolean, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, styles];
  static template = fieldTemplate(
    `<span class="chips" part="chips"></span><input id="control" class="control" part="input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="listbox" autocomplete="off" spellcheck="false">` +
      `<span class="tail"><button type="button" class="clear" part="clear" aria-label="Clear" hidden tabindex="-1"><span data-ray-icon="close"></span></button><span class="chevron" aria-hidden="true" data-ray-icon="chevron-down"></span></span>`,
    { sections: false },
  ) + `<div class="listbox" id="listbox" part="dropdown" role="listbox" popover="manual" tabindex="-1"></div><div class="options"><slot></slot></div>`;

  static get observedAttributes() {
    return [...super.observedAttributes, "value"];
  }

  attributeChangedCallback(attr, old, v) {
    if (attr === "value") {
      this.value = this.multiple || this.hasAttribute("multiple") ? toList(v) : (v ?? "");
      return;
    }
    super.attributeChangedCallback(attr, old, v);
  }

  #options = [];
  #items = [];
  #active = -1;
  #query = "";
  #filtering = false;
  #undismiss = null;
  #stopTracking = null;
  #id = uid("cbx");

  constructor() {
    super();
    this.listbox = this.$("#listbox");
  }

  wire() {
    const c = this.control;
    this._default = this.getAttribute("value");
    this._observer = new MutationObserver(() => this._readOptions());
    this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ["value", "label", "disabled", "selected"] });
    this._readOptions();
    c.addEventListener("input", () => {
      this.#query = c.value;
      this.#filtering = true;
      this.open = true;
      this._renderList();
      this._activate(this._firstEnabled());
    });
    c.addEventListener("keydown", (e) => this._key(e));
    c.addEventListener("blur", () => {
      if (this.open) return;
      this._settleText();
    });
    c.addEventListener("click", () => this.toggle(true));
    this.$(".box").addEventListener("pointerdown", (e) => {
      // A click on the box (not on a button) focuses the text field.
      if (e.target.closest?.("button")) return;
      if (e.target !== c) {
        e.preventDefault();
        c.focus();
        this.toggle(true);
      }
    });
    this.$(".clear").addEventListener("click", () => {
      this._setValue(this.multiple ? [] : "", true);
      this.#query = "";
      c.value = "";
      c.focus();
    });
    this.$(".chips").addEventListener("click", (e) => {
      const b = e.target.closest?.("button[data-value]");
      if (!b) return;
      this._remove(b.dataset.value);
      c.focus();
    });
    this.listbox.addEventListener("pointerdown", (e) => e.preventDefault());
    this.listbox.addEventListener("pointermove", (e) => {
      const i = this.#items.findIndex((it) => it.el === e.target.closest?.(".option"));
      if (i >= 0 && !this.#items[i].disabled) this._activate(i, false);
    });
    this.listbox.addEventListener("click", (e) => {
      const i = this.#items.findIndex((it) => it.el === e.target.closest?.(".option"));
      if (i >= 0) this._choose(i);
    });
    this.listbox.addEventListener("toggle", (e) => this._onToggle(e.newState === "open"));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTracking?.();
    this.#stopTracking = null;
    this.#undismiss?.();
    this.#undismiss = null;
  }

  /** The current values as an array (one or none without `multiple`). */
  get values() {
    return this.multiple ? toList(this.value) : (this.value ? [String(this.value)] : []);
  }

  update(changed) {
    if (changed.has("data")) this._readOptions();
    const c = this.control;
    c.placeholder = this.multiple && this.values.length ? "" : (this.placeholder ?? "");
    c.readOnly = false;
    this.syncField();
    c.setAttribute("aria-expanded", String(Boolean(this.open)));
    this.listbox.toggleAttribute("aria-multiselectable", Boolean(this.multiple));
    if (this.multiple) this.listbox.setAttribute("aria-multiselectable", "true");
    this._renderChips();
    if (!this.#filtering && document.activeElement !== this) this._settleText();
    this.$(".clear").hidden = !this.clearable || !this.values.length || this.effectivelyDisabled;
    this._commit();
    if (changed.has("open")) this._setOpen(Boolean(this.open));
    if (this.open) this._renderList();
  }

  /** Opens or closes the dropdown. */
  toggle(force) {
    if (this.effectivelyDisabled) return;
    this.open = force ?? !this.open;
  }

  // Options from `data`, else from the child option elements.
  _readOptions() {
    const out = [];
    if (Array.isArray(this.data)) {
      for (const d of this.data) {
        if (typeof d === "string") out.push({ value: d, label: d, disabled: false, group: "" });
        else out.push({ value: String(d.value), label: d.label ?? String(d.value), disabled: Boolean(d.disabled), group: d.group ?? "" });
      }
    } else {
      const add = (o, group) => out.push({ value: o.value, label: o.label || o.textContent.trim(), disabled: o.disabled, group });
      for (const child of this.children) {
        if (child.localName === "option") add(child, "");
        else if (child.localName === "optgroup") for (const o of child.querySelectorAll("option")) add(o, child.label);
      }
      // An option marked selected sets the first value.
      if (this.value === undefined) {
        const sel = [...this.querySelectorAll("option[selected]")].map((o) => o.value);
        if (sel.length) this.commitProperty("value", this.multiple ? sel : sel[0]);
      }
    }
    this.#options = out;
    this.requestUpdate();
  }

  _labelOf(value) {
    return this.#options.find((o) => o.value === value)?.label ?? value;
  }

  // The text field shows the chosen label (single) or nothing (multiple).
  _settleText() {
    const c = this.control;
    if (!c) return;
    this.#filtering = false;
    this.#query = "";
    if (this.multiple) {
      if (c.value) c.value = "";
    } else {
      const text = this.value ? this._labelOf(String(this.value)) : "";
      if (c.value !== text) c.value = text;
    }
  }

  _renderChips() {
    const box = this.$(".chips");
    box.replaceChildren();
    if (!this.multiple) {
      this.$(".box").removeAttribute("data-has-chips");
      return;
    }
    for (const v of this.values) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.setAttribute("part", "chip");
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = this._labelOf(v);
      const b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.dataset.value = v;
      b.setAttribute("aria-label", `Remove ${this._labelOf(v)}`);
      b.innerHTML = `<span data-ray-icon="close"></span>`;
      chip.append(t, b);
      box.append(chip);
    }
    this.paintIcons(box);
    this.$(".box").toggleAttribute("data-has-chips", this.values.length > 0);
  }

  // The options that match what was typed (all when not filtering).
  _matches() {
    const q = this.#filtering ? this.#query.trim().toLowerCase() : "";
    return q ? this.#options.filter((o) => o.label.toLowerCase().includes(q)) : this.#options.slice();
  }

  _renderList() {
    const lb = this.listbox;
    lb.replaceChildren();
    this.#items = [];
    const values = this.values;
    const full = this.multiple && this.maxValues > 0 && values.length >= this.maxValues;
    const all = this._matches();
    const shown = this.limit > 0 ? all.slice(0, this.limit) : all;
    const q = this.#filtering ? this.#query.trim() : "";
    let groupEl = null;
    let group = null;
    let n = 0;
    for (const o of shown) {
      if (o.group !== group) {
        group = o.group;
        if (group) {
          groupEl = document.createElement("div");
          groupEl.setAttribute("role", "group");
          const gl = document.createElement("div");
          gl.className = "group-label";
          gl.id = `${this.#id}-g${n}`;
          gl.textContent = group;
          groupEl.setAttribute("aria-labelledby", gl.id);
          groupEl.append(gl);
          lb.append(groupEl);
        } else {
          groupEl = null;
        }
      }
      const selected = values.includes(o.value);
      const disabled = o.disabled || (full && !selected);
      const el = document.createElement("div");
      el.className = "option";
      el.id = `${this.#id}-o${n++}`;
      el.setAttribute("role", "option");
      el.setAttribute("part", "option");
      el.setAttribute("aria-selected", String(selected));
      el.setAttribute("aria-disabled", String(disabled));
      const text = document.createElement("span");
      text.className = "text";
      // The typed part of each match in bold.
      const at = q ? o.label.toLowerCase().indexOf(q.toLowerCase()) : -1;
      if (at >= 0) {
        const mark = document.createElement("mark");
        mark.textContent = o.label.slice(at, at + q.length);
        text.append(o.label.slice(0, at), mark, o.label.slice(at + q.length));
      } else {
        text.textContent = o.label;
      }
      const check = document.createElement("span");
      check.className = "mark";
      check.setAttribute("data-ray-icon", "check");
      el.append(text, check);
      (groupEl ?? lb).append(el);
      this.#items.push({ el, value: o.value, disabled, create: false });
    }
    if (this.creatable && q && !this.#options.some((o) => o.label.toLowerCase() === q.toLowerCase()) && !full) {
      const el = document.createElement("div");
      el.className = "option create";
      el.id = `${this.#id}-create`;
      el.setAttribute("role", "option");
      el.setAttribute("aria-selected", "false");
      el.textContent = `+ Create “${q}”`;
      lb.append(el);
      this.#items.push({ el, value: q, disabled: false, create: true });
    }
    if (all.length > shown.length) {
      const more = document.createElement("div");
      more.className = "more";
      more.textContent = `${all.length - shown.length} more: keep typing`;
      lb.append(more);
    }
    if (!this.#items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = this.nothingFound ?? "No matches";
      lb.append(empty);
    }
    this.paintIcons(lb);
    if (this.#active >= this.#items.length) this.#active = -1;
    if (this.#active >= 0) this._activate(this.#active, false);
  }

  _firstEnabled() {
    return this.#items.findIndex((it) => !it.disabled);
  }

  _activate(i, scroll = true) {
    for (const it of this.#items) it.el.removeAttribute("data-active");
    this.#active = i;
    const it = this.#items[i];
    if (!it) {
      this.control.removeAttribute("aria-activedescendant");
      return;
    }
    it.el.setAttribute("data-active", "");
    this.control.setAttribute("aria-activedescendant", it.el.id);
    if (scroll) it.el.scrollIntoView({ block: "nearest" });
  }

  _step(dir) {
    const n = this.#items.length;
    if (!n) return;
    for (let k = 1; k <= n; k++) {
      const i = (this.#active + dir * k + n * 2) % n;
      if (!this.#items[i].disabled) return this._activate(i);
    }
  }

  _choose(i) {
    const it = this.#items[i];
    if (!it || it.disabled) return;
    if (it.create) {
      this.#options.push({ value: it.value, label: it.value, disabled: false, group: "" });
      this.emit("ray-create", { value: it.value });
    }
    if (this.multiple) {
      const values = this.values;
      this._setValue(values.includes(it.value) ? values.filter((v) => v !== it.value) : [...values, it.value], true);
      this.#query = "";
      this.#filtering = false;
      this.control.value = "";
      this._renderList();
      this._activate(Math.min(i, this.#items.length - 1), false);
    } else {
      this._setValue(it.value, true);
      this.open = false;
      this._settleText();
    }
  }

  _remove(value) {
    this._setValue(this.values.filter((v) => v !== value), true);
  }

  _setValue(v, user) {
    const before = JSON.stringify(this.values);
    this.commitProperty("value", v);
    const after = JSON.stringify(this.multiple ? toList(v) : (v ? [String(v)] : []));
    this.requestUpdate();
    if (user && before !== after) {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  _key(e) {
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (!this.open) {
        this.open = true;
        queueMicrotask(() => this._activate(k === "ArrowUp" ? this.#items.length - 1 : this._firstEnabled()));
        return;
      }
      this._step(k === "ArrowDown" ? 1 : -1);
    } else if (k === "Enter") {
      if (this.open && this.#active >= 0) {
        e.preventDefault();
        this._choose(this.#active);
      } else if (this.open && this.creatable && this.#query.trim()) {
        e.preventDefault();
        const i = this.#items.findIndex((it) => it.create);
        if (i >= 0) this._choose(i);
      }
    } else if (k === "Escape") {
      if (this.open) {
        e.preventDefault();
        this.open = false;
        this._settleText();
      } else if (this.clearable && this.values.length) {
        e.preventDefault();
        this._setValue(this.multiple ? [] : "", true);
      }
    } else if (k === "Backspace" && this.multiple && !this.control.value && this.values.length) {
      this._remove(this.values[this.values.length - 1]);
    } else if (k === "Tab") {
      this.open = false;
      this._settleText();
    }
  }

  _setOpen(open) {
    const lb = this.listbox;
    if (!lb.isConnected) return;
    const shown = lb.matches(":popover-open");
    if (open && !shown) {
      try {
        lb.showPopover();
      } catch {
        this.commitProperty("open", false);
        return;
      }
      this.#undismiss ??= dismissable({ panel: lb, owner: this, trigger: this.$(".box"), close: () => { this.open = false; this._settleText(); } });
    } else if (!open && shown) {
      lb.hidePopover();
    }
  }

  _onToggle(open) {
    this.control.setAttribute("aria-expanded", String(open));
    if (open) {
      const box = this.$(".box");
      const update = () => place(box.getBoundingClientRect(), this.listbox, { placement: "bottom-start", offset: 4, matchWidth: true });
      update();
      this.#stopTracking?.();
      this.#stopTracking = autoUpdate(box, this.listbox, update);
      this._renderList();
      if (this.#active < 0) {
        const sel = this.#items.findIndex((it) => this.values.includes(it.value));
        this._activate(sel >= 0 ? sel : this._firstEnabled());
      }
    } else {
      this.#stopTracking?.();
      this.#stopTracking = null;
      this.#undismiss?.();
      this.#undismiss = null;
      this._activate(-1);
      this.#filtering = false;
    }
    if (Boolean(this.open) !== open) this.commitProperty("open", open);
    this.emit(open ? "ray-open" : "ray-close");
  }

  _commit() {
    const values = this.values;
    if (this.multiple && this.name && values.length) {
      const data = new FormData();
      for (const v of values) data.append(this.name, v);
      this.internals.setFormValue(data);
    } else {
      this.internals.setFormValue(values[0] ?? null);
    }
    if (this.required && !values.length) this.internals.setValidity({ valueMissing: true }, "Please choose an option.", this.control);
    else this.internals.setValidity({});
  }

  formResetCallback() {
    this.value = this.multiple ? toList(this._default) : (this._default ?? "");
  }

  formStateRestoreCallback(state) {
    if (state instanceof FormData) this.value = state.getAll(this.name).map(String);
    else this.value = state ?? "";
  }
}

define("ray-combobox", RayCombobox);
