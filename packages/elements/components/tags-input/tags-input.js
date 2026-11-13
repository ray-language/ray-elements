// <ray-tags-input>: a field of free-form tags with its suggestions in view.
// What is typed becomes a tag on Enter, on a separator (a comma by default;
// a pasted "a, b, c" adds three) or when the field is left. The suggestions
// (child <option> elements or `data`) are buttons under the field, filtered
// by what is typed, case and accents aside; one click adds it. There is no
// dropdown: focusing the field opens nothing, so on a phone the keyboard and
// the suggestions share the screen without anything floating over the field.
//
// The value is an array of strings (the attribute: "a,b"); the form gets one
// entry per tag. No two tags are the same, case and accents aside.

import { css, define, uid } from "../../core/core.js";
import { sizeStyles, radiusStyles, chipStyles } from "../../core/styles.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

const styles = css`
  .box { flex-wrap: wrap; gap: 0.25rem; padding-inline: calc(var(--_px) * 0.66 - 0.25rem); cursor: text; }
  .box[data-has-chips] { padding-block: 0.25rem; }
  .control { flex: 1; padding-inline: 0.25rem; min-width: 4rem; }
  .box[data-has-chips] .control { min-height: calc(var(--_h) - 0.5rem - 2px); }
  .options { display: none; }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ray-space-1);
    order: 3;
    margin-top: var(--ray-space-1);
  }
  .suggestions[hidden] { display: none; }
  .suggestion {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 100%;
    min-height: calc(var(--_h) - 0.5rem);
    margin: 0;
    padding-block: 0.125rem;
    padding-inline: calc(var(--_px) * 0.5) calc(var(--_px) * 0.66);
    font: inherit;
    font-size: calc(var(--_fs) - 0.0625rem);
    font-weight: var(--ray-font-weight-medium);
    line-height: 1.25;
    text-align: start;
    color: var(--ray-foreground);
    background: var(--ray-muted);
    border: 0;
    border-radius: var(--_r);
    box-sizing: border-box;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background-color var(--ray-duration-fast) var(--ray-easing-standard);
    --ray-icon-size: 0.875em;
  }
  .suggestion:hover { background: var(--ray-default-hover); }
  .suggestion:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 1px; }
  .suggestion .icon { display: inline-flex; flex: none; color: var(--ray-muted-foreground); }
  .suggestion .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

/** "a, b" (an attribute) or an array, as an array of strings. */
const toList = (v) => (Array.isArray(v) ? v.map(String) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean));

/** Text compared without case or accents: "Diabétes" matches "diabe". */
export const fold = (t) => String(t).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export class RayTagsInput extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { attribute: false },
    data: { attribute: false },
    placeholder: { type: String },
    max: { type: Number },
    suggestionsLimit: { type: Number, attribute: "suggestions-limit", default: 6 },
    suggestionsLabel: { type: String, attribute: "suggestions-label", default: "Suggestions" },
    separators: { type: String, default: "," },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, chipStyles, styles];
  static template = fieldTemplate(
    `<span class="chips" part="tags"></span><input id="control" class="control" part="input" autocomplete="off" spellcheck="false" enterkeyhint="done">`,
    { sections: false },
  ) + `<div class="suggestions" part="suggestions" role="group" hidden></div><div class="options"><slot></slot></div>`;

  static get observedAttributes() {
    return [...super.observedAttributes, "value"];
  }

  attributeChangedCallback(attr, old, v) {
    if (attr === "value") {
      this.value = toList(v);
      return;
    }
    super.attributeChangedCallback(attr, old, v);
  }

  #options = [];
  #id = uid("tags");

  wire() {
    const c = this.control;
    this._default = this.getAttribute("value");
    this._observer = new MutationObserver(() => this._readOptions());
    this._observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ["value", "label", "disabled"] });
    this._readOptions();
    c.addEventListener("input", (e) => {
      // The text being typed is not the value: input and change from the
      // host mean the tags changed.
      e.stopPropagation();
      this._split();
      this._renderSuggestions();
    });
    c.addEventListener("keydown", (e) => this._key(e));
    // Leaving the field keeps what was typed: a Save button tapped before
    // Enter still gets it.
    c.addEventListener("blur", () => this.commitText());
    this.$(".box").addEventListener("pointerdown", (e) => {
      // A press on the box (not on a chip's button) focuses the text field.
      if (e.target.closest?.("button") || e.target === c) return;
      e.preventDefault();
      c.focus();
    });
    this.$(".chips").addEventListener("click", (e) => {
      const b = e.target.closest?.("button[data-value]");
      if (!b) return;
      this.removeTag(b.dataset.value);
      c.focus();
    });
    const list = this.$(".suggestions");
    // While typing, a suggestion is pressed without taking the focus from
    // the field: the phone's keyboard stays up.
    list.addEventListener("pointerdown", (e) => {
      if (e.target.closest?.(".suggestion") && this.shadowRoot.activeElement === c) e.preventDefault();
    });
    list.addEventListener("click", (e) => {
      const b = e.target.closest?.(".suggestion");
      if (!b) return;
      const typing = this.shadowRoot.activeElement === c;
      if (this.addTag(b.dataset.value)) c.value = "";
      this._renderSuggestions();
      if (typing) c.focus();
      else this.$(".suggestion")?.focus();
    });
  }

  /** The tags as an array, whatever `value` was set to ("a,b" or an array). */
  get tags() {
    return toList(this.value ?? []);
  }

  /** Adds a tag (trimmed; ignored when empty, already there or past `max`); true if added. */
  addTag(tag) {
    const t = String(tag ?? "").trim();
    if (!t || this._full() || this._has(t)) return false;
    this._setValue([...this.tags, t]);
    return true;
  }

  /** Removes a tag; true if it was there. */
  removeTag(tag) {
    const k = fold(tag);
    const next = this.tags.filter((v) => fold(v) !== k);
    if (next.length === this.tags.length) return false;
    this._setValue(next);
    return true;
  }

  /** Turns what is typed in the field into a tag now (what Enter does). */
  commitText() {
    const c = this.control;
    if (!c.value.trim()) return;
    this.addTag(c.value);
    c.value = "";
    this._renderSuggestions();
  }

  update(changed) {
    if (changed.has("data")) this._readOptions();
    const c = this.control;
    c.placeholder = this.tags.length ? "" : (this.placeholder ?? "");
    this.syncField();
    this._renderChips();
    this._renderSuggestions();
    this._commit();
  }

  // Suggestions from `data`, else from the child option elements.
  _readOptions() {
    const out = [];
    if (Array.isArray(this.data)) {
      for (const d of this.data) {
        if (typeof d === "string") out.push({ value: d, label: d, disabled: false });
        else out.push({ value: String(d.value), label: d.label ?? String(d.value), disabled: Boolean(d.disabled) });
      }
    } else {
      for (const o of this.querySelectorAll("option")) out.push({ value: o.value, label: o.label || o.textContent.trim(), disabled: o.disabled });
    }
    this.#options = out;
    this.requestUpdate();
  }

  _labelOf(value) {
    return this.#options.find((o) => o.value === value)?.label ?? value;
  }

  _has(tag) {
    const k = fold(tag);
    return this.tags.some((v) => fold(v) === k);
  }

  _full() {
    return this.max > 0 && this.tags.length >= this.max;
  }

  // Separators typed or pasted: each complete piece becomes a tag, the rest
  // stays in the field.
  _split() {
    const seps = [...(this.separators ?? "")];
    const c = this.control;
    if (!seps.length || !seps.some((s) => c.value.includes(s))) return;
    const pieces = c.value.split(new RegExp(`[${seps.map((s) => s.replace(/[\\\]^-]/g, "\\$&")).join("")}]`));
    const rest = pieces.pop();
    for (const p of pieces) this.addTag(p);
    c.value = rest.trimStart();
  }

  _key(e) {
    const c = this.control;
    if (e.isComposing) return;
    if (e.key === "Enter") {
      if (!c.value.trim()) return;
      e.preventDefault();
      this.commitText();
    } else if (e.key === "Backspace" && !c.value && this.tags.length && c.selectionStart === 0) {
      this.removeTag(this.tags[this.tags.length - 1]);
    } else if (e.key === "Escape" && c.value) {
      e.preventDefault();
      c.value = "";
      this._renderSuggestions();
    }
  }

  _renderChips() {
    const box = this.$(".chips");
    box.replaceChildren();
    for (const v of this.tags) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.setAttribute("part", "tag");
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = this._labelOf(v);
      const b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.dataset.value = v;
      b.setAttribute("part", "tag-remove");
      b.setAttribute("aria-label", `Remove ${this._labelOf(v)}`);
      b.disabled = this.effectivelyDisabled;
      b.innerHTML = `<span data-ray-icon="ui.remove"></span>`;
      chip.append(t, b);
      box.append(chip);
    }
    this.paintIcons(box);
    this.$(".box").toggleAttribute("data-has-chips", this.tags.length > 0);
  }

  /** The suggestions shown now: not chosen yet, matching what is typed, at most `suggestions-limit`. */
  get suggestions() {
    if (this.effectivelyDisabled || this._full()) return [];
    const q = fold(this.control.value.trim());
    const all = this.#options.filter((o) => !o.disabled && !this._has(o.value) && !this._has(o.label) && (!q || fold(o.label).includes(q)));
    const limit = this.suggestionsLimit ?? 6;
    return (limit > 0 ? all.slice(0, limit) : all).map((o) => o.value);
  }

  _renderSuggestions() {
    const list = this.$(".suggestions");
    const values = this.suggestions;
    list.setAttribute("aria-label", this.suggestionsLabel ?? "Suggestions");
    // The focused suggestion keeps the focus if it is still there after the
    // change; else the focus moves to the next one (a keyboard user adding several).
    const focused = this.shadowRoot.activeElement?.closest?.(".suggestion");
    const focusAt = focused ? [...list.children].indexOf(focused) : -1;
    list.replaceChildren();
    for (const v of values) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "suggestion";
      b.setAttribute("part", "suggestion");
      b.dataset.value = v;
      const icon = document.createElement("span");
      icon.className = "icon";
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("data-ray-icon", "ui.add");
      const t = document.createElement("span");
      t.className = "t";
      t.textContent = this._labelOf(v);
      b.append(icon, t);
      list.append(b);
    }
    this.paintIcons(list);
    list.hidden = !values.length;
    if (focusAt >= 0 && !list.contains(this.shadowRoot.activeElement)) {
      (list.children[Math.min(focusAt, list.children.length - 1)] ?? this.control).focus();
    }
  }

  _setValue(list) {
    this.commitProperty("value", list);
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _commit() {
    const values = this.tags;
    if (this.name && values.length) {
      const data = new FormData();
      for (const v of values) data.append(this.name, v);
      this.internals.setFormValue(data);
    } else {
      this.internals.setFormValue(null);
    }
    if (this.required && !values.length) this.internals.setValidity({ valueMissing: true }, "Please add at least one.", this.control);
    else this.internals.setValidity({});
  }

  formResetCallback() {
    this.control.value = "";
    this.value = toList(this._default);
  }

  formStateRestoreCallback(state) {
    this.value = state instanceof FormData ? state.getAll(this.name).map(String) : toList(state);
  }
}

define("ray-tags-input", RayTagsInput);
