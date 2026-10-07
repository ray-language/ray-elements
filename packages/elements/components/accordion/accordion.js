// <ray-accordion> + <ray-accordion-item>: collapsible sections (WAI-ARIA
// accordion pattern). One open item at a time, or several with `multiple`.
//
// value: the open item's value; with `multiple`, the property is an array and
// the attribute a comma-separated list.

import { RayElement, css, define } from "../../core/core.js";

const accordionStyles = css`
  :host { display: block; }
  :host([variant="separated"]) .items { display: grid; gap: var(--ray-space-3); }
  :host([variant="contained"]) .items { border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); overflow: hidden; }
`;

export class RayAccordion extends RayElement {
  static properties = {
    value: { type: String },
    multiple: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true, default: "default" },
    chevronPosition: { type: String, reflect: true, default: "right" },
  };
  static styles = [accordionStyles];
  static template = `<div class="items" part="items"><slot></slot></div>`;

  constructor() {
    super();
    this.addEventListener("ray-accordion-toggle", (e) => {
      const item = e.target;
      if (!this.items.includes(item)) return;
      e.stopPropagation();
      this._toggle(item.value);
    });
    this.addEventListener("keydown", (e) => this._key(e));
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
  }

  get items() {
    return [...this.querySelectorAll("ray-accordion-item")].filter((i) => i.closest("ray-accordion") === this);
  }

  /** The open values as an array, whatever the mode. */
  get openValues() {
    const v = this.value;
    if (Array.isArray(v)) return v;
    if (v === undefined || v === null || v === "") return [];
    return this.multiple ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [String(v)];
  }

  update() {
    const open = this.openValues;
    const items = this.items;
    items.forEach((item, i) => {
      item._setOpen(open.includes(item.value));
      item.dataset.variant = this.variant || "default";
      item.dataset.chevron = this.chevronPosition || "right";
      item.toggleAttribute("data-first", i === 0);
      item.toggleAttribute("data-last", i === items.length - 1);
    });
  }

  _toggle(value) {
    const open = this.openValues;
    let next;
    if (this.multiple) next = open.includes(value) ? open.filter((v) => v !== value) : [...open, value];
    else next = open.includes(value) ? undefined : value;
    this.value = next;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _key(e) {
    const item = e.composedPath().find((n) => n instanceof RayAccordionItem);
    const items = this.items.filter((i) => !i.disabled);
    const i = items.indexOf(item);
    if (i < 0 || !e.composedPath().some((n) => n.classList?.contains("control"))) return;
    let target = null;
    if (e.key === "ArrowDown") target = items[(i + 1) % items.length];
    else if (e.key === "ArrowUp") target = items[(i - 1 + items.length) % items.length];
    else if (e.key === "Home") target = items[0];
    else if (e.key === "End") target = items[items.length - 1];
    if (!target) return;
    e.preventDefault();
    target.focus();
  }
}

const itemStyles = css`
  :host { display: block; border-bottom: 1px solid var(--ray-border); }
  :host([data-variant="contained"]) { border-bottom: 1px solid var(--ray-border); }
  :host([data-variant="contained"][data-last]) { border-bottom: 0; }
  :host([data-variant="contained"][data-open]) { background: var(--ray-muted); }
  :host([data-variant="separated"]) { border: 1px solid transparent; border-radius: var(--ray-radius-default); background: var(--ray-muted); }
  :host([data-variant="separated"][data-open]) { border-color: var(--ray-border); background: var(--ray-background); }
  :host([data-variant="filled"]) { border: 0; border-radius: var(--ray-radius-default); }
  :host([data-variant="filled"][data-open]) { background: var(--ray-muted); }
  h3 { margin: 0; font: inherit; }
  .control {
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    width: 100%;
    min-height: 3rem;
    padding: 0 var(--ray-space-md);
    font: inherit;
    font-size: var(--ray-font-size-md);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-foreground);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: inherit;
    cursor: pointer;
  }
  .control:hover:not(:disabled) { background: var(--ray-accent); }
  :host([data-variant="default"]) .control:hover:not(:disabled) { background: var(--ray-muted); }
  .control:disabled { color: var(--ray-muted-foreground); cursor: not-allowed; }
  .label { flex: 1; }
  :host([data-chevron="left"]) .chevron { order: -1; }
  .chevron { display: inline-flex; color: var(--ray-muted-foreground); transition: transform var(--ray-duration-base) var(--ray-easing-standard); }
  .chevron svg { width: 1rem; height: 1rem; }
  :host([data-open]) .chevron { transform: rotate(180deg); }
  .section { display: inline-flex; color: var(--ray-muted-foreground); }
  .section:not([data-filled]) { display: none; }
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([data-open]) .panel { grid-template-rows: 1fr; }
  .inner { overflow: hidden; }
  .content { padding: 0 var(--ray-space-md) var(--ray-space-md); font-size: var(--ray-font-size-sm); }
`;

export class RayAccordionItem extends RayElement {
  static delegatesFocus = true;
  static properties = {
    value: { type: String, reflect: true },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
    headingLevel: { type: Number, default: 3 },
  };
  static styles = [itemStyles];
  static template = `
    <h3 part="heading">
      <button class="control focus-ring" id="control" part="control" type="button" aria-expanded="false" aria-controls="panel">
        <span class="section" part="left-section"><slot name="left"></slot></span>
        <span class="label" part="label"><span class="label-text"></span><slot name="label"></slot></span>
        <span class="chevron" part="chevron" aria-hidden="true" data-ray-icon="chevron-down"></span>
      </button>
    </h3>
    <div class="panel" id="panel" part="panel" role="region" aria-labelledby="control" inert>
      <div class="inner"><div class="content" part="content"><slot></slot></div></div>
    </div>`;

  constructor() {
    super();
    this._open = false;
    this.$(".control").addEventListener("click", () => {
      if (!this.disabled) this.emit("ray-accordion-toggle");
    });
    const left = this.$('slot[name="left"]');
    left.addEventListener("slotchange", () => left.parentElement.toggleAttribute("data-filled", left.assignedNodes().length > 0));
  }

  /** Whether this item is expanded (set the accordion's value to change it). */
  get open() {
    return this._open;
  }

  _setOpen(on) {
    this._open = on;
    this.toggleAttribute("data-open", on);
    this.$(".control").setAttribute("aria-expanded", String(on));
    // Closed content must not take focus nor be read.
    this.$(".panel").inert = !on;
  }

  update(changed) {
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".control").disabled = Boolean(this.disabled);
    const h = this.$("h3");
    h.setAttribute("role", "heading");
    h.setAttribute("aria-level", String(this.headingLevel || 3));
    if (changed.has("value")) this.closest("ray-accordion")?.requestUpdate();
  }
}

define("ray-accordion", RayAccordion);
define("ray-accordion-item", RayAccordionItem);
