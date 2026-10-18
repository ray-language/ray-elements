// <ray-bottom-nav>: the bottom navigation bar of a phone app (Material's
// navigation bar, the iOS tab bar): three to five destinations, an icon and
// a label each, the current one marked by a pill behind its icon.
//
// Links (<ray-bottom-nav-item href>) mark the page they lead to
// (aria-current="page"); without href it is a control: `value` and
// `change`, like a segmented control. An item with `action` is a button
// (a prominent "New" in the middle): it fires ray-select, it is not a
// destination.
//
// hide-on-scroll slides it away while the content scrolls down (the
// scroller of its ray-app-shell, `scroll-target` or the window); `fixed`
// pins it to the bottom of the window. Clear of the home indicator
// (safe-area inset).

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";
import { scrollerOf, watchScroll } from "../../core/scroll.js";

// An item's value: its own, else its href, else its label.
const valueOf = (item) => item.value ?? item.href ?? item.label;

const navStyles = css`
  :host {
    display: grid;
    grid-template-rows: 1fr;
    position: relative;
    z-index: 2;
    transition: grid-template-rows var(--ray-duration-base) var(--ray-easing-standard), translate var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([hidden]) { display: none; }
  :host([fixed]) { position: fixed; inset: auto 0 0 0; }
  /* Its border, padding and raised action would still show: clip them. */
  :host([data-concealed="flow"]) { grid-template-rows: 0fr; clip-path: inset(0); }
  :host([data-concealed="over"]) { translate: 0 100%; }
  .fold { min-height: 0; }
  nav {
    box-sizing: border-box;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    align-items: stretch;
    padding: var(--ray-space-1) max(var(--ray-space-1), env(safe-area-inset-right, 0px)) max(var(--ray-space-1), env(safe-area-inset-bottom, 0px)) max(var(--ray-space-1), env(safe-area-inset-left, 0px));
    background: var(--ray-bottom-nav, var(--ray-background));
    border-top: 1px solid var(--ray-border);
  }
  :host([variant="floating"]) { padding: 0 var(--ray-space-3) max(var(--ray-space-3), env(safe-area-inset-bottom, 0px)); }
  :host([variant="floating"][data-concealed="flow"]) { padding-bottom: 0; }
  :host([variant="floating"]) nav { padding-bottom: var(--ray-space-1); border: 1px solid var(--ray-border); border-radius: var(--ray-radius-xl); box-shadow: var(--ray-shadow-lg); overflow: visible; }
  @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
`;

const itemStyles = css`
  :host {
    display: block;
    min-width: 0;
  }
  :host([hidden]) { display: none; }
  .slot-host { display: contents; }
  .item {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    width: 100%;
    min-height: 3.5rem;
    padding: 0.375rem 0.25rem;
    margin: 0;
    font: inherit;
    color: var(--ray-muted-foreground);
    text-decoration: none;
    background: none;
    border: 0;
    border-radius: var(--ray-radius-md);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: color var(--ray-duration-fast);
  }
  .item:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: -2px; }
  .item:hover { color: var(--ray-foreground); }
  :host([active]) .item { color: var(--_light-color); }
  :host([disabled]) .item { opacity: 0.45; cursor: not-allowed; }
  .icon-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 3.5rem;
    height: 2rem;
    border-radius: var(--ray-radius-full);
    --ray-icon-size: 1.375rem;
    --ray-icon-stroke: 1.75;
  }
  .pill {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--_light);
    opacity: 0;
    scale: 0.6 1;
    transition: opacity var(--ray-duration-fast), scale var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([active]) .pill { opacity: 1; scale: 1; }
  :host([data-indicator="none"]) .pill { display: none; }
  :host([data-indicator="line"]) .pill { inset: auto 1rem -0.25rem; height: 0.1875rem; background: var(--_filled); }
  .icon, ::slotted([slot="icon"]) { position: relative; }
  .icon:empty { display: none; }
  .badge {
    position: absolute;
    top: 0;
    left: calc(50% + 0.375rem);
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.25rem;
    box-sizing: border-box;
    font-size: 0.625rem;
    font-weight: 700;
    line-height: 1rem;
    text-align: center;
    color: #fff;
    background: var(--ray-red-filled);
    border: 2px solid var(--ray-bottom-nav, var(--ray-background));
    border-radius: var(--ray-radius-full);
    box-sizing: content-box;
  }
  .badge:empty:not([data-dot]) { display: none; }
  .badge[data-dot] { min-width: 0; width: 0.5rem; height: 0.5rem; padding: 0; top: 0.25rem; left: calc(50% + 0.5rem); }
  .label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium, 500);
    line-height: 1.2;
  }
  :host([active]) .label { font-weight: 700; }
  :host([data-labels="active"]:not([active])) .label, :host([data-labels="never"]) .label {
    position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  /* action: a raised round button in the bar. */
  :host([action]) .icon-wrap {
    width: 3.25rem;
    height: 3.25rem;
    margin-top: -1.25rem;
    color: var(--_contrast);
    background: var(--_filled);
    box-shadow: var(--ray-shadow-md);
    transition: scale var(--ray-duration-fast);
    --ray-icon-size: 1.5rem;
    --ray-icon-stroke: 2;
  }
  :host([action]) .item:active .icon-wrap { scale: 0.94; }
  :host([action]) .pill { display: none; }
  :host([action]) .item { color: var(--ray-foreground); }
  @media (prefers-reduced-motion: reduce) { .pill { transition: none; } }
`;

export class RayBottomNavItem extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
    label: { type: String },
    icon: { type: String },
    href: { type: String, reflect: true },
    badge: { type: String },
    dot: { type: Boolean, reflect: true },
    active: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    action: { type: Boolean, reflect: true },
  };
  static styles = [itemStyles];
  static delegatesFocus = true;
  static template = `<span class="slot-host"></span>`;

  #tag = "";

  update() {
    // A link for a destination with href, a button otherwise.
    const tag = this.href && !this.action ? "a" : "button";
    if (tag !== this.#tag) {
      this.#tag = tag;
      const host = this.$(".slot-host");
      host.innerHTML = `<${tag} class="item" part="item"><span class="icon-wrap"><span class="pill" part="indicator"></span><span class="icon" data-ray-icon=""></span><slot name="icon"></slot><span class="badge" part="badge"></span></span><span class="label" part="label"></span></${tag}>`;
      if (tag === "button") host.firstElementChild.type = "button";
    }
    const item = this.$(".item");
    if (tag === "a") {
      if (this.disabled) item.removeAttribute("href");
      else item.setAttribute("href", this.href);
    } else {
      item.disabled = Boolean(this.disabled);
    }
    if (this.active && !this.action) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
    // The current destination draws its icon filled (when it has a filled version).
    const icon = this.$(".icon");
    icon.setAttribute("data-ray-icon", this.icon ?? "");
    icon.toggleAttribute("data-ray-icon-filled", Boolean(this.active && !this.action));
    this.paintIcons();
    this.$(".label").textContent = this.label ?? "";
    const badge = this.$(".badge");
    badge.textContent = this.dot ? "" : (this.badge ?? "");
    badge.toggleAttribute("data-dot", Boolean(this.dot));
    // The badge is read with the label ("Messages, 3").
    if (this.badge && !this.dot) item.setAttribute("aria-label", `${this.label ?? ""}, ${this.badge}`);
    else if (this.dot) item.setAttribute("aria-label", `${this.label ?? ""}, new`);
    else item.removeAttribute("aria-label");
  }
}

export class RayBottomNav extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
    label: { type: String, default: "Main" },
    labels: { type: String, reflect: true, default: "always" },
    indicator: { type: String, reflect: true, default: "pill" },
    color: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "default" },
    hideOnScroll: { type: Boolean, reflect: true, attribute: "hide-on-scroll" },
    fixed: { type: Boolean, reflect: true },
    scrollTarget: { type: String, attribute: "scroll-target" },
  };
  static styles = [navStyles];
  // The row that closes is .fold (no padding, no border: it can reach 0).
  static template = `<div class="fold"><nav part="nav"><slot></slot></nav></div>`;

  #stop = null;
  #lock = 0;

  constructor() {
    super();
    this.$("slot").addEventListener("slotchange", () => this._sync());
    this.addEventListener("click", (e) => {
      const item = e.target.closest?.("ray-bottom-nav-item");
      if (!item || item.parentElement !== this || item.disabled) return;
      if (item.action) {
        this.emit("ray-select", { value: valueOf(item) ?? "" });
        return;
      }
      const value = valueOf(item);
      if (value !== undefined && value !== this.value) {
        this.commitProperty("value", value);
        this.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  /** The destinations and actions, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === "ray-bottom-nav-item");
  }

  connectedCallback() {
    super.connectedCallback();
    queueMicrotask(() => this._watch());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stop?.();
    this.#stop = null;
  }

  update(changed) {
    this.$("nav").setAttribute("aria-label", this.label || "Main");
    this._sync();
    if (changed.has("hideOnScroll") || changed.has("scrollTarget") || changed.has("fixed")) this._watch();
  }

  // Marks the current item. Without a value: the link to this page, or
  // the first destination of a control.
  _sync() {
    const items = this.items;
    if (this.value === undefined) {
      const here = items.find((i) => i.href && !i.action && new URL(i.href, document.baseURI).pathname === location.pathname);
      if (here) this.commitProperty("value", valueOf(here));
      // A control (no links) starts on its first destination.
      else if (items.length && !items.some((i) => i.href)) {
        const first = items.find((i) => !i.action && !i.disabled);
        if (first) this.commitProperty("value", valueOf(first));
      }
    }
    for (const item of items) {
      item.active = !item.action && valueOf(item) !== undefined && valueOf(item) === this.value;
      item.setAttribute("data-labels", this.labels || "always");
      item.setAttribute("data-indicator", this.indicator || "pill");
      applyColor(item, this.color);
    }
  }

  _watch() {
    this.#stop?.();
    this.#stop = null;
    this.removeAttribute("data-concealed");
    if (!this.isConnected || !this.hideOnScroll) return;
    const scroller = scrollerOf(this, this.scrollTarget);
    const mode = this.fixed || scroller === window ? "over" : "flow";
    this.#stop = watchScroll(scroller, ({ y, direction }) => {
      const on = direction === "down" && y > 24;
      if (y <= 0) { this.removeAttribute("data-concealed"); return; }
      if (on === this.hasAttribute("data-concealed") || performance.now() < this.#lock) return;
      this.#lock = performance.now() + 400;
      if (on) this.setAttribute("data-concealed", mode);
      else this.removeAttribute("data-concealed");
    });
  }
}

define("ray-bottom-nav-item", RayBottomNavItem);
define("ray-bottom-nav", RayBottomNav);
