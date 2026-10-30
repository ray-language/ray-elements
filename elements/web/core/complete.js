// Inline suggestions for a text field (ray-input, ray-textarea): while the
// user types, `host.complete(text, caret)` says which part of the text a
// suggestion would replace and with what ({ from, to, items }, or null);
// a listbox opens under that part, in the top layer, and the chosen item
// replaces it as an edit (undoable, an ordinary input event).
//
// The combobox pattern: the control gets aria-autocomplete, aria-expanded,
// aria-controls and aria-activedescendant; the listbox lives in the same
// shadow root, so the ids work. ArrowUp/Down move, Enter or Tab accept,
// Escape closes, Ctrl+Space asks; the keys are taken before the control's
// own (Enter submitting, Escape closing a dialog) only while the list is
// open.

import { css, uid } from "./core.js";
import { TextLayer, syncHighlight } from "./textlayer.js";

export const completeStyles = css`
  .suggestions {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    min-width: 12rem;
    max-width: min(28rem, calc(100vw - 16px));
    max-height: 14rem;
    margin: 0;
    padding: var(--ray-space-1);
    overflow-y: auto;
    font-size: var(--ray-font-size-sm);
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    box-shadow: var(--ray-shadow-md);
  }
  .suggestion {
    display: flex;
    align-items: baseline;
    gap: var(--ray-space-3);
    padding: var(--ray-space-1) var(--ray-space-2);
    border-radius: var(--ray-radius-sm);
    cursor: default;
    white-space: nowrap;
  }
  .suggestion[aria-selected="true"] { color: var(--ray-accent-foreground); background: var(--ray-accent); }
  .suggestion .s-main { flex: none; }
  .suggestion .s-label { font-family: var(--ray-font-mono); }
  .suggestion .s-detail { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--ray-muted-foreground); }
  .suggestion .s-description { display: block; font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
`;

/** The layer of a field, made once (shared with highlight). */
export function layerOf(host) {
  host._textLayer ??= new TextLayer(host.control);
  return host._textLayer;
}

class Completer {
  constructor(host) {
    this.host = host;
    const c = (this.control = host.control);
    this.list = document.createElement("div");
    this.list.className = "suggestions";
    this.list.id = uid("suggestions");
    this.list.setAttribute("part", "suggestions");
    this.list.setAttribute("role", "listbox");
    this.list.popover = "manual";
    host.shadowRoot.append(this.list);
    this.open = null; // { items, index, from, to }
    this.asked = 0;
    this.inserting = false;
    c.setAttribute("aria-autocomplete", "list");
    c.setAttribute("aria-expanded", "false");
    c.setAttribute("aria-controls", this.list.id);
    if (c.localName === "input") c.setAttribute("role", "combobox");
    // Choosing with the pointer keeps the focus (and the caret) in the field.
    this.list.addEventListener("pointerdown", (e) => e.preventDefault());
    this.list.addEventListener("click", (e) => {
      const option = e.target.closest(".suggestion");
      if (option) this.accept(Number(option.dataset.index));
    });
    c.addEventListener("input", () => {
      if (!this.inserting) this.ask();
    });
    c.addEventListener("click", () => this.open && this.ask());
    c.addEventListener("blur", () => this.close());
    // The caret moved along the text (on keyup it has landed): ask where it is now.
    c.addEventListener("keyup", (e) => {
      if (this.open && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) this.ask();
    });
    // Captured on the host: before the control's Enter and a dialog's Escape.
    host.addEventListener("keydown", (e) => this.key(e), { capture: true });
  }

  /** Calls complete() for the text and caret now; shows or closes the list. */
  async ask() {
    const c = this.control;
    const fn = this.host.complete;
    if (typeof fn !== "function" || c.selectionStart !== c.selectionEnd || c.readOnly || c.disabled) {
      this.close();
      return;
    }
    const n = ++this.asked;
    let result = null;
    try {
      result = await fn(c.value, c.selectionStart);
    } catch (err) {
      console.error("ray-elements: complete() threw", err);
    }
    // A later keystroke asked again, or the field lost the focus meanwhile.
    if (n !== this.asked || this.host.shadowRoot.activeElement !== c) return;
    const items = Array.isArray(result?.items) ? result.items.filter((i) => i && i.value !== undefined) : [];
    if (!items.length) {
      this.close();
      return;
    }
    const length = c.value.length;
    const from = Math.max(0, Math.min(length, Math.trunc(result.from ?? c.selectionStart)));
    const to = Math.max(from, Math.min(length, Math.trunc(result.to ?? c.selectionStart)));
    this.show(items, from, to);
  }

  show(items, from, to) {
    this.list.setAttribute("aria-label", this.host.suggestionsLabel ?? "Suggestions");
    this.list.replaceChildren(...items.map((item, i) => {
      const option = document.createElement("div");
      option.className = "suggestion";
      option.id = `${this.list.id}-${i}`;
      option.dataset.index = String(i);
      option.setAttribute("role", "option");
      option.setAttribute("part", "suggestion");
      // The label (code, in the mono font) with the description (prose)
      // under it, then the detail.
      const main = document.createElement("span");
      main.className = "s-main";
      const label = document.createElement("span");
      label.className = "s-label";
      label.setAttribute("part", "suggestion-label");
      label.textContent = item.label ?? String(item.value);
      main.append(label);
      if (item.description) {
        const d = document.createElement("span");
        d.className = "s-description";
        d.setAttribute("part", "suggestion-description");
        d.textContent = item.description;
        main.append(d);
      }
      option.append(main);
      if (item.detail) {
        const detail = document.createElement("span");
        detail.className = "s-detail";
        detail.setAttribute("part", "suggestion-detail");
        detail.textContent = item.detail;
        option.append(detail);
      }
      return option;
    }));
    const keep = this.open ? this.open.items[this.open.index]?.value : undefined;
    const index = Math.max(0, items.findIndex((i) => i.value === keep));
    this.open = { items, index, from, to };
    if (!this.list.matches(":popover-open")) this.list.showPopover();
    this.control.setAttribute("aria-expanded", "true");
    this.select(index);
    this.place();
  }

  // Under the text it would replace; above it when there is no room below.
  place() {
    const at = layerOf(this.host);
    // The layer's text as it is now (it is otherwise repainted on update).
    syncHighlight(this.host);
    const r = at.rectAt(this.open.from);
    // A one-line field: below its box, not inside it; a textarea: below the line.
    const box = at.multi ? r : this.control.parentElement.getBoundingClientRect();
    const w = this.list.offsetWidth;
    const h = this.list.offsetHeight;
    const gap = 4;
    const left = Math.max(8, Math.min(r.left, innerWidth - w - 8));
    const below = box.bottom + gap;
    const top = below + h <= innerHeight - 8 ? below : Math.max(8, box.top - gap - h);
    this.list.style.left = `${left}px`;
    this.list.style.top = `${top}px`;
  }

  select(index) {
    this.open.index = index;
    const options = [...this.list.children];
    options.forEach((o, i) => o.setAttribute("aria-selected", String(i === index)));
    const current = options[index];
    if (!current) return;
    this.control.setAttribute("aria-activedescendant", current.id);
    const top = current.offsetTop;
    if (top < this.list.scrollTop) this.list.scrollTop = top;
    else if (top + current.offsetHeight > this.list.scrollTop + this.list.clientHeight) this.list.scrollTop = top + current.offsetHeight - this.list.clientHeight;
  }

  close() {
    this.asked++;
    if (!this.open) return;
    this.open = null;
    this.control.setAttribute("aria-expanded", "false");
    this.control.removeAttribute("aria-activedescendant");
    if (this.list.matches(":popover-open")) this.list.hidePopover();
  }

  /** Replaces from–to with the item's value, as an edit. */
  accept(index) {
    const { items, from, to } = this.open ?? {};
    const item = items?.[index];
    this.close();
    if (!item) return;
    const c = this.control;
    const text = String(item.value);
    c.focus();
    c.setSelectionRange(from, to);
    this.inserting = true;
    try {
      // execCommand edits the focused element and keeps undo; without the
      // focus (a window in the background) it may do nothing: set it then.
      const focused = this.host.shadowRoot.activeElement === c;
      if (!focused || !document.execCommand("insertText", false, text) || c.value.slice(from, from + text.length) !== text) {
        c.value = c.value.slice(0, from) + text + c.value.slice(to);
        c.setSelectionRange(from + text.length, from + text.length);
        c.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }
    } finally {
      this.inserting = false;
    }
    this.host.emit("ray-complete", { item, from, to });
  }

  key(e) {
    if (e.composedPath()[0] !== this.control) return;
    if (e.key === " " && e.ctrlKey) {
      e.preventDefault();
      this.ask();
      return;
    }
    if (!this.open) return;
    const n = this.open.items.length;
    const take = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    switch (e.key) {
      case "ArrowDown": take(); this.select((this.open.index + 1) % n); break;
      case "ArrowUp": take(); this.select((this.open.index - 1 + n) % n); break;
      case "Enter":
      case "Tab": take(); this.accept(this.open.index); break;
      case "Escape": take(); this.close(); break;
    }
  }
}

/**
 * Sets up inline suggestions on `host` (ray-input, ray-textarea) the first
 * time it has a `complete` function; closes the list when it is removed.
 */
export function syncComplete(host) {
  if (typeof host.complete === "function") host._completer ??= new Completer(host);
  else host._completer?.close();
}
