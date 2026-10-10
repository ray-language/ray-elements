// <ray-select>: a select with its own dropdown. Options come from child
// <option>/<optgroup> elements or from the `data` property
// (["a", "b"] or [{ value, label, disabled }]).
//
// A hidden native <select> (#control) stays the model: value, required,
// validity and form participation work exactly like a native one. What the
// user sees and operates is a combobox button and a listbox in a [popover]
// (top layer: above dialogs, never clipped), following the WAI-ARIA
// select-only combobox pattern: focus stays on the button, the active option
// is aria-activedescendant.

import { css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { place, autoUpdate } from "../../core/position.js";
import { dismissable } from "../../core/dismiss.js";
import { play, POP_OUT } from "../../core/motion.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

const styles = css`
  .native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
  }
  .trigger {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    padding-right: calc(var(--_h) * 0.8);
    text-align: left;
    color: inherit;
    background: transparent;
    border: 0;
    cursor: pointer;
  }
  .trigger:disabled { cursor: not-allowed; }
  .trigger:focus-visible { outline: none; }
  .value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trigger[data-placeholder] .value { color: var(--ray-muted-foreground); }
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
    transition: transform var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .trigger[aria-expanded="true"] ~ .chevron { transform: rotate(180deg); }
  .chevron svg { width: 1em; height: 1em; }
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
  /* Not .label: that class is the field's own label (fieldStyles). */
  .option .text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .option .mark { display: inline-flex; width: 1em; height: 1em; color: var(--_filled, var(--ray-primary)); visibility: hidden; }
  .option .mark svg { width: 1em; height: 1em; }
  .option[aria-selected="true"] { font-weight: var(--ray-font-weight-medium); }
  .option[aria-selected="true"] .mark { visibility: visible; }
  .option[data-active] { background: var(--ray-accent); color: var(--ray-accent-foreground); }
  .option[aria-disabled="true"] { color: var(--ray-muted-foreground); cursor: not-allowed; opacity: 0.6; }
  .group-label {
    padding: var(--ray-space-2) var(--ray-space-2) var(--ray-space-1);
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-muted-foreground);
  }
  .group + .group { margin-top: var(--ray-space-1); padding-top: var(--ray-space-1); border-top: 1px solid var(--ray-border); }
  .empty { padding: var(--ray-space-2); color: var(--ray-muted-foreground); }
`;

const CHEVRON = `<span class="chevron" aria-hidden="true" data-ray-icon="chevron-down"></span>`;

export class RaySelect extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String },
    placeholder: { type: String },
    data: { attribute: false },
    open: { type: Boolean, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, styles];
  static template = fieldTemplate(
    `<select id="control" class="native" part="select" tabindex="-1" aria-hidden="true"></select>` +
      `<button type="button" id="trigger" class="control trigger" part="trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="listbox"><span class="value"></span></button>${CHEVRON}`,
    { sections: false },
  ) + `<div class="listbox" id="listbox" part="dropdown" role="listbox" popover="manual" tabindex="-1"></div><div class="options"><slot></slot></div>`;

  #active = -1;
  #items = [];
  #stopTracking = null;
  #typed = "";
  #typedAt = 0;
  #undismiss = null;
  #exit = null;

  constructor() {
    super();
    /** The combobox button the user operates. */
    this.trigger = this.$("#trigger");
    /** The dropdown ([popover] listbox). */
    this.listbox = this.$("#listbox");
  }

  wire() {
    const label = this.$("label.label");
    label.id = "label";
    label.htmlFor = "trigger";
    this.$(".value").id = "value";

    // Option changes only: the host's own attributes do not affect the list.
    this._observer = new MutationObserver((records) => {
      if (records.some((r) => !(r.type === "attributes" && r.target === this))) this._renderOptions();
    });
    this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    // The model's own change (also what tests and scripts can drive).
    this.control.addEventListener("change", () => this._changed());

    this.trigger.addEventListener("click", () => this.toggle());
    this.trigger.addEventListener("keydown", (e) => this._onKey(e));
    this.listbox.addEventListener("toggle", (e) => this._onToggle(e.newState === "open"));
    this.listbox.addEventListener("pointermove", (e) => {
      const i = this.#items.findIndex((o) => o.el === e.target.closest?.(".option"));
      if (i >= 0 && !this.#items[i].disabled) this._activate(i, false);
    });
    this.listbox.addEventListener("click", (e) => {
      const i = this.#items.findIndex((o) => o.el === e.target.closest?.(".option"));
      if (i >= 0) this._choose(i);
    });
    // Clicks on the option list must not steal focus from the button.
    this.listbox.addEventListener("pointerdown", (e) => e.preventDefault());

    this._renderOptions();
    this._default = this.getAttribute("value") ?? this.control.value;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTracking?.();
    this.#stopTracking = null;
    this.#undismiss?.();
    this.#undismiss = null;
  }

  update(changed) {
    if (changed.has("data") || changed.has("placeholder")) this._renderOptions();
    const c = this.control;
    if (this.value !== undefined && c.value !== this.value) c.value = this.value;
    this.syncField();
    this._commit();
    this._paintValue();
    if (changed.has("open")) this._setOpen(Boolean(this.open));
  }

  /** Label, description, error and ARIA go to the button the user operates. */
  syncField() {
    super.syncField();
    const c = this.control;
    const t = this.trigger;
    for (const a of ["aria-describedby", "aria-invalid", "aria-label"]) {
      if (c.hasAttribute(a)) t.setAttribute(a, c.getAttribute(a));
      else t.removeAttribute(a);
    }
    c.removeAttribute("aria-label");
    if (this.label) t.setAttribute("aria-labelledby", "label value");
    else t.removeAttribute("aria-labelledby");
    t.setAttribute("aria-required", String(Boolean(this.required)));
    t.disabled = this.effectivelyDisabled;
    if (t.disabled && this.open) this.open = false;
  }

  /** Validity of the model, anchored on the visible button. */
  syncValidity() {
    const c = this.control;
    if (c.validity.valid) this.internals.setValidity({});
    else this.internals.setValidity(c.validity, c.validationMessage, this.trigger ?? c);
  }

  // Rebuilds the model <select> from `data` or the light-DOM options, then the listbox.
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
    if (keep !== undefined && [...c.options].some((o) => o.value === keep && o.dataset.placeholder === undefined)) {
      c.value = keep;
    } else if (this.placeholder && ![...this.children].some((o) => o.selected && o.hasAttribute("selected"))) {
      c.value = "";
    }
    if (this.value === undefined || c.value !== this.value) this.commitProperty("value", c.value);
    this._commit();
    this._renderList();
    this._paintValue();
  }

  // The listbox mirrors the model: one .option per real option, grouped by optgroup.
  _renderList() {
    const lb = this.listbox;
    if (!lb) return;
    lb.replaceChildren();
    this.#items = [];
    let n = 0;
    const optionEl = (o) => {
      const el = document.createElement("div");
      el.className = "option";
      el.id = `option-${n++}`;
      el.setAttribute("role", "option");
      el.setAttribute("part", "option");
      // A disabled optgroup disables its options; the model <select> itself
      // is disabled while the host is, which must not stick to the options.
      const group = o.parentElement?.localName === "optgroup" ? o.parentElement : null;
      const disabled = o.disabled || Boolean(group?.disabled);
      el.setAttribute("aria-disabled", String(disabled));
      el.innerHTML = `<span class="text"></span><span class="mark" aria-hidden="true" data-ray-icon="check"></span>`;
      el.firstChild.textContent = o.label || o.text;
      this.#items.push({ el, value: o.value, disabled, text: (o.label || o.text).trim().toLowerCase() });
      return el;
    };
    for (const child of this.control.children) {
      if (child.localName === "optgroup") {
        const group = document.createElement("div");
        group.className = "group";
        group.setAttribute("role", "group");
        const gl = document.createElement("div");
        gl.className = "group-label";
        gl.id = `group-${n}`;
        gl.textContent = child.label;
        group.setAttribute("aria-labelledby", gl.id);
        group.append(gl, ...[...child.children].map(optionEl));
        lb.append(group);
      } else if (child.dataset.placeholder === undefined) {
        lb.append(optionEl(child));
      }
    }
    if (!this.#items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "No options";
      lb.append(empty);
    }
    this.paintIcons(lb);
    this._paintSelected();
  }

  _paintSelected() {
    const v = this.control.value;
    const placeholder = this.control.selectedOptions[0]?.dataset.placeholder !== undefined;
    for (const it of this.#items) it.el.setAttribute("aria-selected", String(!placeholder && it.value === v));
  }

  _paintValue() {
    const t = this.trigger;
    if (!t) return;
    const o = this.control.selectedOptions[0];
    const isPlaceholder = !o || o.dataset.placeholder !== undefined;
    this.$(".value").textContent = o ? o.label || o.text : this.placeholder ?? "";
    t.toggleAttribute("data-placeholder", isPlaceholder);
    this._paintSelected();
  }

  _commit() {
    this.internals.setFormValue(this.control.value || null);
    this.syncValidity();
  }

  // After the model changed by the user (listbox, typeahead) or a script.
  _changed() {
    this.commitProperty("value", this.control.value);
    this._commit();
    this._paintValue();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _choose(i) {
    const it = this.#items[i];
    if (!it || it.disabled) return;
    this.open = false;
    if (this.control.value !== it.value) {
      this.control.value = it.value;
      this._changed();
    }
    this.trigger.focus();
  }

  _activate(i, scroll = true) {
    this.#items[this.#active]?.el.removeAttribute("data-active");
    this.#active = i;
    const it = this.#items[i];
    if (!it) {
      this.trigger.removeAttribute("aria-activedescendant");
      return;
    }
    it.el.setAttribute("data-active", "");
    this.trigger.setAttribute("aria-activedescendant", it.el.id);
    if (scroll) it.el.scrollIntoView({ block: "nearest" });
  }

  // The next enabled option from `from` in direction `dir` (clamped at the ends).
  _step(from, dir) {
    for (let i = from + dir; i >= 0 && i < this.#items.length; i += dir) {
      if (!this.#items[i].disabled) return i;
    }
    return from;
  }

  _edge(dir) {
    return dir > 0 ? this._step(-1, 1) : this._step(this.#items.length, -1);
  }

  _selectedIndex() {
    return this.#items.findIndex((it) => it.value === this.control.value && it.el.getAttribute("aria-selected") === "true");
  }

  // Typeahead: the next option starting with what was typed in the last 500 ms.
  _typeahead(ch) {
    const now = Date.now();
    this.#typed = now - this.#typedAt > 500 ? ch : this.#typed + ch;
    this.#typedAt = now;
    const start = this.open ? this.#active : this._selectedIndex();
    const n = this.#items.length;
    const same = this.#typed.split("").every((c) => c === this.#typed[0]);
    const query = same ? this.#typed[0] : this.#typed;
    for (let k = 1; k <= n; k++) {
      const i = (Math.max(start, 0) + (same || this.#typed.length === 1 ? k : k - 1)) % n;
      const it = this.#items[i];
      if (!it.disabled && it.text.startsWith(query)) return i;
    }
    return -1;
  }

  _onKey(e) {
    if (this.trigger.disabled) return;
    const open = Boolean(this.open);
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        this.open = true;
        const sel = this._selectedIndex();
        this._activate(sel >= 0 ? sel : this._edge(k === "ArrowUp" ? -1 : 1));
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Closed: typing selects, like a native select.
        const i = this._typeahead(k.toLowerCase());
        if (i >= 0 && this.#items[i].value !== this.control.value) {
          this.control.value = this.#items[i].value;
          this._changed();
        }
      }
      return;
    }
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (e.altKey && k === "ArrowUp") return this._choose(this.#active);
      this._activate(this.#active < 0 ? this._edge(k === "ArrowDown" ? 1 : -1) : this._step(this.#active, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" || k === "End" || k === "PageUp" || k === "PageDown") {
      e.preventDefault();
      this._activate(this._edge(k === "Home" || k === "PageUp" ? 1 : -1));
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      this._choose(this.#active);
    } else if (k === "Escape") {
      e.preventDefault();
      this.open = false;
    } else if (k === "Tab") {
      this.open = false;
    } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const i = this._typeahead(k.toLowerCase());
      if (i >= 0) this._activate(i);
    }
  }

  /** Opens or closes the dropdown. */
  toggle(force) {
    if (this.trigger.disabled) return;
    this.open = force ?? !this.open;
  }

  _setOpen(open) {
    const lb = this.listbox;
    if (!lb || !this.isConnected) return;
    const shown = lb.matches(":popover-open");
    if (open) {
      // Reopened while animating out: stay open.
      this.#exit?.cancel();
      this.#exit = null;
      lb.style.pointerEvents = "";
      if (!shown) {
        try {
          lb.showPopover();
        } catch {
          this.commitProperty("open", false);
          return;
        }
      }
      this.#undismiss ??= dismissable({ panel: lb, owner: this, trigger: this.trigger, close: () => { this.open = false; } });
    } else if (shown && !this.#exit) {
      this._leave();
    }
  }

  // Animate the dropdown out, then really hide it (unless reopened).
  async _leave() {
    const lb = this.listbox;
    this.#undismiss?.();
    this.#undismiss = null;
    this.trigger.setAttribute("aria-expanded", "false");
    const exit = play(lb, POP_OUT, { speed: "fast" });
    this.#exit = exit;
    lb.style.pointerEvents = "none";
    await exit.finished;
    lb.style.pointerEvents = "";
    if (this.#exit !== exit) return;
    this.#exit = null;
    if (!this.open && lb.matches(":popover-open")) lb.hidePopover();
    exit.cancel();
  }

  _onToggle(open) {
    this.trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      const box = this.$(".box");
      const update = () => place(box.getBoundingClientRect(), this.listbox, { placement: "bottom-start", offset: 4, matchWidth: true });
      update();
      this.#stopTracking?.();
      this.#stopTracking = autoUpdate(box, this.listbox, update);
      if (this.#active < 0) {
        const sel = this._selectedIndex();
        this._activate(sel >= 0 ? sel : this._edge(1));
      } else {
        this.#items[this.#active]?.el.scrollIntoView({ block: "nearest" });
      }
    } else {
      this.#stopTracking?.();
      this.#stopTracking = null;
      this._activate(-1);
    }
    if (Boolean(this.open) !== open) this.commitProperty("open", open);
    this.dispatchEvent(new CustomEvent(open ? "ray-open" : "ray-close", { bubbles: true, composed: true }));
  }

  /** The option objects of the model select. */
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
