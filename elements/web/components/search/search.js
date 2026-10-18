// <ray-search>: a search box (shadcn's command input, Mantine's Spotlight
// field). A RayInput — label, form value, validity — with the search icon,
// a clear button, an optional keyboard shortcut that focuses it (shown as a
// hint while empty) and a debounced ray-search event.

import { css, define } from "../../core/core.js";
import { RayInput } from "../input/input.js";
import { fieldTemplate } from "../../core/form.js";
import { matchesHotkey, formatHotkey, isTyping } from "../../core/hotkey.js";

const styles = css`
  .box { gap: 0; }
  /* variant="filled" is the default here (defaults are not reflected as attributes). */
  :host(:not([variant])) .box { background: var(--ray-muted); border-color: transparent; }
  .lead {
    display: inline-flex;
    padding-left: calc(var(--_px) * 0.66);
    color: var(--ray-muted-foreground);
    pointer-events: none;
  }
  .lead svg { width: 1.1em; height: 1.1em; }
  .control { padding-left: calc(var(--_px) * 0.5); }
  .control::-webkit-search-cancel-button, .control::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
  .tail { display: inline-flex; align-items: center; gap: var(--ray-space-1); padding-right: calc(var(--_px) * 0.4); }
  .clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--_h) * 0.6);
    height: calc(var(--_h) * 0.6);
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .clear:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .clear svg { width: 0.9em; height: 0.9em; }
  .clear[hidden], .shortcut[hidden] { display: none; }
  .shortcut {
    padding: 0 0.375rem;
    font-family: var(--ray-font-mono);
    font-size: 0.6875rem;
    line-height: 1.25rem;
    color: var(--ray-muted-foreground);
    background: var(--ray-background);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
    white-space: nowrap;
  }
`;

export class RaySearch extends RayInput {
  static properties = {
    ...RayInput.properties,
    type: { type: String, reflect: true, default: "search" },
    variant: { type: String, reflect: true, default: "filled" },
    placeholder: { type: String, default: "Search…" },
    shortcut: { type: String },
    debounce: { type: Number, default: 200 },
  };
  static styles = [...RayInput.styles, styles];
  static template = fieldTemplate(
    `<span class="lead" part="icon" aria-hidden="true" data-ray-icon="ui.search"></span>` +
      `<input id="control" class="control" part="input" type="search" enterkeyhint="search" autocomplete="off" spellcheck="false">` +
      `<span class="tail"><button class="clear focus-ring" part="clear" type="button" aria-label="Clear search" tabindex="-1" hidden><span data-ray-icon="ui.clear" aria-hidden="true"></span></button>` +
      `<kbd class="shortcut" part="shortcut" aria-hidden="true" hidden></kbd></span>`,
  );

  #timer = 0;

  constructor() {
    super();
    this._onHotkey = (e) => {
      if (!this.shortcut || e.defaultPrevented || !matchesHotkey(e, this.shortcut)) return;
      // A one-key shortcut ("/") must not fire while typing elsewhere.
      if (!/[+]/.test(this.shortcut) && isTyping(e)) return;
      e.preventDefault();
      this.control.focus();
      this.control.select();
    };
  }

  wire() {
    super.wire();
    this.control.addEventListener("input", () => this._schedule());
    this.control.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.control.value) {
        e.preventDefault();
        e.stopPropagation();
        this.clear();
      } else if (e.key === "Enter") {
        this._emit();
      }
    });
    this.control.addEventListener("focus", () => this._paintTail());
    this.control.addEventListener("blur", () => this._paintTail());
    this.$(".clear").addEventListener("click", () => {
      this.clear();
      this.control.focus();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onHotkey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onHotkey);
    clearTimeout(this.#timer);
  }

  update(changed) {
    super.update(changed);
    // The placeholder attribute (forwarded by RayInput) wins over the default.
    const ph = this.getAttribute("placeholder") ?? this.placeholder ?? "";
    if (this.control.placeholder !== ph) this.control.placeholder = ph;
    this.$(".shortcut").textContent = this.shortcut ? formatHotkey(this.shortcut) : "";
    this._paintTail();
  }

  /** Empties the box: fires input, then ray-search with "". */
  clear() {
    if (!this.control.value) return;
    this.control.value = "";
    this.commitProperty("value", "");
    this._commit();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this._emit();
  }

  // Clear button while there is text; the shortcut hint while empty and unfocused.
  _paintTail() {
    const has = Boolean(this.control.value);
    this.$(".clear").hidden = !has || this.effectivelyDisabled || Boolean(this.readonly);
    const focused = this.shadowRoot.activeElement === this.control;
    this.$(".shortcut").hidden = !this.shortcut || has || focused;
  }

  _schedule() {
    this._paintTail();
    clearTimeout(this.#timer);
    const wait = Math.max(0, Number(this.debounce) || 0);
    if (wait === 0) this._emit();
    else this.#timer = setTimeout(() => this._emit(), wait);
  }

  _emit() {
    clearTimeout(this.#timer);
    this.dispatchEvent(new CustomEvent("ray-search", { bubbles: true, composed: true, detail: { value: this.control.value } }));
  }
}

define("ray-search", RaySearch);
