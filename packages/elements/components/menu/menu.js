// <ray-menu> + <ray-menu-item>, <ray-menu-label>, <ray-menu-divider>:
// a dropdown menu (WAI-ARIA menu button pattern) or, with `context`, a
// context menu opened at the pointer over the trigger area.
//
// Choosing an item fires `ray-select` ({ value, item }) on the menu and
// closes it (unless keep-open). An item of type="checkbox" toggles its
// `checked` first; one of type="radio" checks itself and unchecks the radio
// items of the menu with the same `name`.
//
// With `native` and a native host that offers "popup_menu" (core/host.js; a
// std/ui window with core/raylang.js), it opens as the system's context menu
// at the pointer instead: its items and dividers (not labels nor nested
// menus), with the same ray-select.

import { RayElement, css, define } from "../../core/core.js";
import { Floating, floatingStyles } from "../../core/floating.js";
import { applyColor } from "../../core/styles.js";
import { pointRect } from "../../core/position.js";
import { getHost, hostCan } from "../../core/host.js";

const menuStyles = css`
  .panel { min-width: 12rem; padding: var(--ray-space-1); }
  :host([context]) { display: contents; }
`;

export class RayMenu extends Floating {
  static properties = {
    ...Floating.properties,
    placement: { type: String, reflect: true, default: "bottom-start" },
    offset: { type: Number, default: 4 },
    context: { type: Boolean, reflect: true },
    keepOpen: { type: Boolean, reflect: true },
    native: { type: Boolean, reflect: true },
  };
  static styles = [floatingStyles, menuStyles];
  static haspopup = "menu";
  static template = `<slot name="trigger"></slot><div class="panel" part="dropdown" role="menu" tabindex="-1"><slot></slot></div>`;

  constructor() {
    super();
    this._typed = "";
    this.addEventListener("click", (e) => {
      const item = e.target.closest?.("ray-menu-item");
      if (item && this.items.includes(item)) this._choose(item);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this._keys) {
      this._keys = true;
      this.panel.addEventListener("keydown", (e) => this._menuKey(e));
    }
  }

  popupKind() {
    return this.context ? null : "menu";
  }

  /** The enabled and disabled items of this menu (not of nested menus). */
  get items() {
    return [...this.querySelectorAll("ray-menu-item")].filter((i) => i.closest("ray-menu") === this);
  }

  wireTrigger(t) {
    if (this.context) {
      t.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (this._native()) {
          this.popupNative();
          return;
        }
        this._point = pointRect(e.clientX, e.clientY);
        this._focusOnOpen = "first";
        const openNow = () => {
          if (this.open) this.reposition();
          else this.open = true;
        };
        // macOS/Linux fire contextmenu on press: the release that follows,
        // outside the just-opened panel, would light-dismiss it. Open after it.
        if (e.buttons & 2) {
          window.addEventListener("pointerup", () => setTimeout(openNow, 0), { once: true, capture: true });
        } else {
          openNow();
        }
      });
      return;
    }
    t.addEventListener("click", () => {
      if (this._native()) {
        this.popupNative();
        return;
      }
      if (!this.open && this.justClosed()) return;
      this._focusOnOpen = "first";
      this.toggle();
    });
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        this._focusOnOpen = e.key === "ArrowDown" ? "first" : "last";
        if (this.open) this._focus(this._focusOnOpen);
        else this.open = true;
      }
    });
  }

  _native() {
    return Boolean(this.native) && hostCan("popup_menu");
  }

  /**
   * Opens the items as the system's context menu at the pointer (needs a
   * native host); resolves to the chosen item, or null when dismissed.
   */
  async popupNative() {
    if (!hostCan("popup_menu")) return null;
    const entries = [...this.querySelectorAll("ray-menu-item, ray-menu-divider")].filter((el) => el.closest("ray-menu") === this);
    const items = entries.map((el) => (el.localName === "ray-menu-divider"
      ? { separator: true }
      : { title: itemLabel(el), enabled: !el.disabled, ...(el.checkable ? { checked: Boolean(el.checked) } : {}) }));
    const index = await getHost().popupMenu(items);
    const item = index === null || index === undefined ? null : entries[index];
    if (!item || item.localName !== "ray-menu-item") return null;
    this._choose(item);
    return item;
  }

  anchorRect() {
    return this.context && this._point ? this._point : super.anchorRect();
  }

  toggled(open) {
    if (open) {
      this._focus(this._focusOnOpen ?? "first");
    } else {
      this._point = null;
      // Focus back to the trigger when it was inside the menu.
      if (this.focusWasInside && !this.context) this.trigger?.focus();
    }
  }

  _enabled() {
    return this.items.filter((i) => !i.disabled);
  }

  _focus(which) {
    const items = this._enabled();
    if (!items.length) {
      this.panel.focus();
      return;
    }
    const current = items.indexOf(document.activeElement);
    let i;
    if (which === "first") i = 0;
    else if (which === "last") i = items.length - 1;
    else if (which === "next") i = current < 0 ? 0 : (current + 1) % items.length;
    else i = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
    items[i].focus();
  }

  _menuKey(e) {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); this._focus("next"); return;
      case "ArrowUp": e.preventDefault(); this._focus("prev"); return;
      case "Home": e.preventDefault(); this._focus("first"); return;
      case "End": e.preventDefault(); this._focus("last"); return;
      case "Tab": this.open = false; return;
      case "Enter":
      case " ": {
        const item = e.target.closest?.("ray-menu-item");
        if (item) {
          e.preventDefault();
          this._choose(item);
        }
        return;
      }
      default:
        this._typeahead(e);
    }
  }

  // Typing letters jumps to the next item starting with them.
  _typeahead(e) {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    clearTimeout(this._typedTimer);
    this._typed += e.key.toLowerCase();
    this._typedTimer = setTimeout(() => { this._typed = ""; }, 500);
    const items = this._enabled();
    const start = Math.max(0, items.indexOf(document.activeElement));
    const order = [...items.slice(start + (this._typed.length === 1 ? 1 : 0)), ...items.slice(0, start + 1)];
    const hit = order.find((i) => i.textContent.trim().toLowerCase().startsWith(this._typed));
    hit?.focus();
  }

  _choose(item) {
    if (item.disabled) return;
    if (item.type === "checkbox") item.checked = !item.checked;
    else if (item.type === "radio") {
      for (const other of this.items) {
        if (other !== item && other.type === "radio" && (other.name ?? "") === (item.name ?? "")) other.checked = false;
      }
      item.checked = true;
    }
    this.emit("ray-select", { value: item.value ?? item.textContent.trim(), item });
    if (!this.keepOpen) this.open = false;
  }
}

// The text of an item without its left and right sections (icon, shortcut).
function itemLabel(item) {
  return [...item.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !n.slot))
    .map((n) => n.textContent)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

const itemStyles = css`
  :host {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    min-height: var(--ray-control-height-xs);
    padding: 0 var(--ray-space-2);
    font-size: var(--ray-font-size-sm);
    color: var(--ray-popover-foreground);
    border-radius: var(--ray-radius-sm);
    cursor: default;
    user-select: none;
    outline: none;
  }
  :host(:hover), :host(:focus-visible), :host(:focus) { background: var(--ray-accent); color: var(--ray-accent-foreground); }
  :host([color]) { color: var(--_light-color); }
  :host([color]:hover), :host([color]:focus) { background: var(--_light); color: var(--_light-color); }
  :host([disabled]) { color: var(--ray-muted-foreground); background: transparent; cursor: not-allowed; opacity: 0.6; }
  .label { flex: 1; white-space: nowrap; }
  /* A checkbox or radio item keeps a column for its mark, checked or not. */
  .mark { display: none; flex: none; width: 1rem; height: 1rem; visibility: hidden; }
  :host([type="checkbox"]) .mark, :host([type="radio"]) .mark { display: inline-flex; }
  :host([checked]) .mark { visibility: visible; }
  .section { display: inline-flex; align-items: center; color: var(--ray-muted-foreground); }
  :host([color]) .section { color: inherit; }
  .section:not([data-filled]) { display: none; }
  .right { margin-inline-start: var(--ray-space-6); font-size: var(--ray-font-size-xs); }
  ::slotted(svg) { width: 1rem; height: 1rem; }
`;

export class RayMenuItem extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    color: { type: String, reflect: true },
    type: { type: String, reflect: true, default: "item" },
    checked: { type: Boolean, reflect: true },
    name: { type: String, reflect: true },
  };
  static styles = [itemStyles];
  static template = `<span class="mark" part="mark" aria-hidden="true" data-ray-icon="ui.checked"></span><span class="section left" part="left-section"><slot name="left"></slot></span><span class="label" part="label"><slot></slot></span><span class="section right" part="right-section"><slot name="right"></slot></span>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "menuitem";
    for (const slot of this.shadowRoot.querySelectorAll("slot[name]")) {
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
    }
  }

  /** Whether it is a checkbox or radio item. */
  get checkable() {
    return this.type === "checkbox" || this.type === "radio";
  }

  update() {
    this.tabIndex = -1;
    this.internals.role = this.type === "checkbox" ? "menuitemcheckbox" : this.type === "radio" ? "menuitemradio" : "menuitem";
    this.internals.ariaChecked = this.checkable ? String(Boolean(this.checked)) : null;
    this.internals.ariaDisabled = this.disabled ? "true" : "false";
    if (this.color) applyColor(this, this.color);
  }
}

const labelStyles = css`
  :host {
    display: block;
    padding: var(--ray-space-2) var(--ray-space-2) var(--ray-space-1);
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-muted-foreground);
  }
`;

export class RayMenuLabel extends RayElement {
  static styles = [labelStyles];
  static template = `<slot></slot>`;
  constructor() {
    super();
    this.attachInternals().role = "presentation";
  }
}

const dividerStyles = css`
  :host { display: block; height: 1px; margin: var(--ray-space-1) calc(var(--ray-space-1) * -1); background: var(--ray-border); }
`;

export class RayMenuDivider extends RayElement {
  static styles = [dividerStyles];
  constructor() {
    super();
    this.attachInternals().role = "separator";
  }
}

define("ray-menu", RayMenu);
define("ray-menu-item", RayMenuItem);
define("ray-menu-label", RayMenuLabel);
define("ray-menu-divider", RayMenuDivider);
