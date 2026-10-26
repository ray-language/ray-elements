// <ray-tabs> + <ray-tab> + <ray-tab-panel> (WAI-ARIA tabs pattern).
//
// Tabs and panels are light-DOM children, so their roles, ids,
// aria-controls and aria-labelledby work as plain attributes. A tab and its
// panel share a `value`.
//
// Too many tabs for the width: the list scrolls sideways, fades the edge that
// hides tabs (the host carries data-overflow-start / data-overflow-end), turns
// a vertical wheel into a sideways scroll and keeps the selected tab in view.

import { RayElement, css, define, uid } from "../../core/core.js";
import { inlineKey } from "../../core/direction.js";
import { SideScroller, sideScrollerStyles } from "../../core/scroll.js";
import { applyColor } from "../../core/styles.js";

const tabsStyles = css`
  :host { display: block; }
  /* The size scale, inherited by the ray-tab children (own names: they reach
     the panels' content too). */
  :host { --_tab-h: var(--ray-control-height-sm); --_tab-fs: var(--ray-font-size-sm); --_tab-px: var(--ray-space-4); --_tab-gap: var(--ray-space-2); }
  :host([size="xs"]) { --_tab-h: var(--ray-control-height-xs); --_tab-fs: var(--ray-font-size-xs); --_tab-px: var(--ray-space-3); --_tab-gap: var(--ray-space-1); }
  :host([size="md"]) { --_tab-h: var(--ray-control-height-md); --_tab-fs: var(--ray-font-size-md); --_tab-px: var(--ray-space-5); }
  :host([size="lg"]) { --_tab-h: var(--ray-control-height-lg); --_tab-fs: var(--ray-font-size-lg); --_tab-px: var(--ray-space-6); --_tab-gap: var(--ray-space-3); }
  :host([size="xl"]) { --_tab-h: var(--ray-control-height-xl); --_tab-fs: var(--ray-font-size-xl); --_tab-px: var(--ray-space-8); --_tab-gap: var(--ray-space-3); }
  :host([orientation="vertical"]) { display: flex; gap: var(--ray-space-4); }
  /* Too many tabs for the width: the list scrolls sideways instead of
     wrapping (a wrapped underline reads as two separate tab bars). The
     baseline is an inset shadow, so a tab's own bottom border paints over
     it without a negative margin that the scroller would clip. */
  .list {
    --_line: 2px;
    display: flex;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
    box-shadow: inset 0 calc(-1 * var(--_line)) 0 var(--ray-border);
  }
  .list::-webkit-scrollbar { display: none; }
  .list ::slotted(ray-tab) { flex: none; }
  :host([orientation="vertical"]) .list { flex-direction: column; overflow-x: visible; box-shadow: none; border-inline-end: 2px solid var(--ray-border); }
  :host([variant="outline"]) .list { --_line: 1px; }
  :host([variant="outline"][orientation="vertical"]) .list { border-inline-end-width: 1px; }
  :host([variant="pills"]) .list { gap: var(--ray-space-1); border: 0; box-shadow: none; }
  :host([grow]) .list ::slotted(ray-tab) { flex: 1 0 auto; }
  .panels { flex: 1; min-width: 0; padding-top: var(--ray-space-3); }
  :host([orientation="vertical"]) .panels { padding-top: 0; }
`;

export class RayTabs extends RayElement {
  static properties = {
    value: { type: String },
    orientation: { type: String, reflect: true, default: "horizontal" },
    variant: { type: String, reflect: true, default: "default" },
    color: { type: String, reflect: true },
    activation: { type: String, default: "auto" },
    grow: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
  };
  static styles = [sideScrollerStyles, tabsStyles];
  static template = `<div class="list" part="list" role="tablist"><slot name="tab"></slot></div><div class="panels" part="panels"><slot></slot></div>`;

  constructor() {
    super();
    this.addEventListener("click", (e) => {
      const tab = e.target.closest?.("ray-tab");
      if (tab && this.tabs.includes(tab) && !tab.disabled) this._select(tab, true);
    });
    this.addEventListener("keydown", (e) => this._key(e));
    for (const slot of this.shadowRoot.querySelectorAll("slot")) {
      slot.addEventListener("slotchange", () => this.requestUpdate());
    }
    this._scroller = new SideScroller(this, this.$(".list"), {
      active: () => this.orientation !== "vertical",
      onResize: () => this.requestUpdate(),
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this._scroller.connect();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._scroller.disconnect();
  }

  get tabs() {
    return [...this.querySelectorAll("ray-tab")].filter((t) => t.closest("ray-tabs") === this);
  }

  get panels() {
    return [...this.querySelectorAll("ray-tab-panel")].filter((p) => p.closest("ray-tabs") === this);
  }

  update() {
    const tabs = this.tabs;
    const panels = this.panels;
    if (this.value === undefined || !tabs.some((t) => t.value === this.value && !t.disabled)) {
      const first = tabs.find((t) => !t.disabled);
      if (first) this.commitProperty("value", first.value);
    }
    const vertical = this.orientation === "vertical";
    this.$(".list").setAttribute("aria-orientation", vertical ? "vertical" : "horizontal");
    applyColor(this, this.color);
    for (const tab of tabs) {
      const panel = panels.find((p) => p.value === tab.value);
      const active = tab.value === this.value;
      tab.id ||= uid("tab");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.toggleAttribute("data-active", active);
      tab.dataset.variant = this.variant || "default";
      tab.toggleAttribute("data-vertical", vertical);
      if (tab.disabled) tab.setAttribute("aria-disabled", "true");
      else tab.removeAttribute("aria-disabled");
      if (panel) {
        panel.id ||= uid("tabpanel");
        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", tab.id);
      }
    }
    for (const panel of panels) {
      panel.setAttribute("role", "tabpanel");
      panel.tabIndex = 0;
      panel.hidden = panel.value !== this.value;
    }
    // Once laid out: a list with no width yet tries again on the next update.
    if (this.value !== this._revealed && this._scroller.reveal(tabs.find((t) => t.value === this.value))) {
      this._revealed = this.value;
    }
    this._scroller.update();
  }

  _select(tab, user) {
    const changed = tab.value !== this.value;
    this.value = tab.value;
    if (user && changed) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _key(e) {
    const tab = e.target.closest?.("ray-tab");
    const tabs = this.tabs.filter((t) => !t.disabled);
    const i = tabs.indexOf(tab);
    if (i < 0) return;
    const vertical = this.orientation === "vertical";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const prev = vertical ? "ArrowUp" : "ArrowLeft";
    // Right to left, ArrowLeft is the next tab.
    const key = vertical ? e.key : inlineKey(e.key, this);
    let target = null;
    if (key === next) target = tabs[(i + 1) % tabs.length];
    else if (key === prev) target = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") target = tabs[0];
    else if (e.key === "End") target = tabs[tabs.length - 1];
    else if ((e.key === "Enter" || e.key === " ") && this.activation === "manual") {
      e.preventDefault();
      this._select(tab, true);
      return;
    }
    if (!target) return;
    e.preventDefault();
    target.focus();
    if (this.activation !== "manual") this._select(target, true);
  }
}

const tabStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--_tab-gap, var(--ray-space-2));
    min-height: var(--_tab-h, var(--ray-control-height-sm));
    padding: 0 var(--_tab-px, var(--ray-space-4));
    font-size: var(--_tab-fs, var(--ray-font-size-sm));
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-muted-foreground);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    outline: none;
    transition: color var(--ray-duration-fast) var(--ray-easing-standard), background-color var(--ray-duration-fast) var(--ray-easing-standard), border-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host(:focus-visible) { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: -2px; border-radius: var(--ray-radius-sm); }
  :host(:hover) { color: var(--ray-foreground); }
  :host([data-active]) { color: var(--ray-foreground); }
  :host([disabled]) { opacity: 0.5; cursor: not-allowed; }

  /* default: underline */
  :host([data-variant="default"]) { border-bottom: 2px solid transparent; }
  :host([data-variant="default"]:hover:not([data-active])) { border-bottom-color: var(--ray-border); background: var(--ray-muted); }
  :host([data-variant="default"][data-active]) { border-bottom-color: var(--_filled, var(--ray-primary)); }
  :host([data-variant="default"][data-vertical]) { margin: 0; margin-inline-end: -2px; justify-content: flex-start; border-bottom: 0; border-inline-end: 2px solid transparent; }
  :host([data-variant="default"][data-vertical][data-active]) { border-inline-end-color: var(--_filled, var(--ray-primary)); }

  /* outline */
  :host([data-variant="outline"]) { border: 1px solid transparent; border-radius: var(--ray-radius-default) var(--ray-radius-default) 0 0; }
  :host([data-variant="outline"][data-active]) { border-color: var(--ray-border); border-bottom-color: var(--ray-background); background: var(--ray-background); }
  :host([data-variant="outline"][data-vertical]) { margin: 0; margin-inline-end: -1px; justify-content: flex-start; border-radius: 0; border-start-start-radius: var(--ray-radius-default); border-end-start-radius: var(--ray-radius-default); }
  :host([data-variant="outline"][data-vertical][data-active]) { border-bottom-color: var(--ray-border); border-inline-end-color: var(--ray-background); }

  /* pills */
  :host([data-variant="pills"]) { border-radius: var(--ray-radius-default); }
  :host([data-variant="pills"]:hover:not([data-active])) { background: var(--ray-accent); }
  :host([data-variant="pills"][data-active]) { color: var(--_contrast, var(--ray-primary-foreground)); background: var(--_filled, var(--ray-primary)); }

  .section { display: inline-flex; }
  .section:not([data-filled]) { display: none; }
  ::slotted(svg) { width: 1rem; height: 1rem; }
  /* count: a small number after the label, lighter than a badge. */
  .count { font-size: 0.85em; font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); }
  .count:empty { display: none; }
  :host([data-active]) .count, :host(:hover) .count { color: inherit; opacity: 0.75; }
`;

export class RayTab extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    count: { type: String, reflect: true },
  };
  static styles = [tabStyles];
  static template = `<span class="section" part="left-section"><slot name="left"></slot></span><slot></slot><span class="count" part="count"></span><span class="section" part="right-section"><slot name="right"></slot></span>`;

  constructor() {
    super();
    for (const slot of this.shadowRoot.querySelectorAll("slot[name]")) {
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
    }
  }

  connectedCallback() {
    // Tabs render in the tablist of <ray-tabs>.
    if (this.slot !== "tab") this.slot = "tab";
    super.connectedCallback();
  }

  update(changed) {
    this.$(".count").textContent = this.count ?? "";
    if (changed.has("value") || changed.has("disabled")) this.closest("ray-tabs")?.requestUpdate();
  }
}

const panelStyles = css`
  :host { display: block; outline: none; }
  :host([hidden]) { display: none; }
  /* The newly selected panel fades in (display none → block restarts it). */
  :host(:not([hidden])) { animation: ray-panel-in var(--ray-duration-base) var(--ray-easing-out); }
  @keyframes ray-panel-in { from { opacity: 0; transform: translateY(2px); } }
  :host(:focus-visible) { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; border-radius: var(--ray-radius-sm); }
`;

export class RayTabPanel extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
  };
  static styles = [panelStyles];
  static template = `<slot></slot>`;
}

define("ray-tabs", RayTabs);
define("ray-tab", RayTab);
define("ray-tab-panel", RayTabPanel);
