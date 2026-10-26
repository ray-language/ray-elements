// <ray-doc-tabs> + <ray-doc-tab>: the tabs of open documents (an editor's,
// a browser's), each closable and with an unsaved mark, all over one shared
// panel (WAI-ARIA tabs: `panel` is that element's id).
//
// Closing is the app's: the × (for the pointer only: a tab holds no
// focusable control), a middle click, or Delete/Backspace on the focused tab
// fire `ray-request-close` ({ value, tab, source }); the app asks if it must
// and removes the tab. When the selected tab goes, the one that takes its
// place is selected (`change`), and focused if the closed tab had the focus.
//
// Too many tabs for the width: the bar scrolls sideways like ray-tabs.

import { RayElement, css, define, uid } from "../../core/core.js";
import { inlineKey } from "../../core/direction.js";
import { SideScroller, sideScrollerStyles } from "../../core/scroll.js";

const barStyles = css`
  :host { display: flex; align-items: center; gap: var(--ray-space-1); min-width: 0; }
  .list { display: flex; flex: 0 1 auto; align-items: center; gap: 2px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
  .list::-webkit-scrollbar { display: none; }
  .list ::slotted(ray-doc-tab) { flex: none; }
  .end { display: inline-flex; flex: none; align-items: center; }
  .end:not([data-filled]) { display: none; }
`;

export class RayDocTabs extends RayElement {
  static properties = {
    value: { type: String },
    panel: { type: String },
    label: { type: String },
    closeLabel: { type: String, default: "Close" },
    dirtyLabel: { type: String, default: "Unsaved changes" },
  };
  static styles = [sideScrollerStyles, barStyles];
  static template = `<div class="list" part="list" role="tablist"><slot></slot></div><span class="end" part="end"><slot name="end"></slot></span>`;

  constructor() {
    super();
    this._order = [];
    this._focused = null;
    this.addEventListener("click", (e) => {
      const tab = this._tabOf(e);
      if (!tab) return;
      if (e.composedPath().some((n) => n.part?.contains?.("close"))) this._requestClose(tab, "button");
      else this._select(tab, true);
    });
    // The middle button closes, without the browser's autoscroll.
    this.addEventListener("mousedown", (e) => {
      if (e.button === 1 && this._tabOf(e)) e.preventDefault();
    });
    this.addEventListener("auxclick", (e) => {
      const tab = this._tabOf(e);
      if (tab && e.button === 1) this._requestClose(tab, "middle");
    });
    this.addEventListener("keydown", (e) => this._key(e));
    // Which tab has the focus, kept while it is removed (no focusout then).
    this.addEventListener("focusin", (e) => {
      this._focused = e.target.closest?.("ray-doc-tab") ?? null;
    });
    this.addEventListener("focusout", (e) => {
      if (e.relatedTarget) this._focused = null;
    });
    const end = this.$('slot[name="end"]');
    end.addEventListener("slotchange", () => end.parentElement.toggleAttribute("data-filled", end.assignedNodes().length > 0));
    this.$(".list slot").addEventListener("slotchange", () => this.requestUpdate());
    this._scroller = new SideScroller(this, this.$(".list"), { onResize: () => this.requestUpdate() });
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
    return [...this.querySelectorAll("ray-doc-tab")].filter((t) => t.closest("ray-doc-tabs") === this);
  }

  /** The shared panel (`panel` is its id), or null. */
  get panelElement() {
    return this.panel ? this.getRootNode().getElementById?.(this.panel) ?? null : null;
  }

  update() {
    const tabs = this.tabs;
    if (!tabs.some((t) => t.value === this.value)) this._replaceSelected(tabs);
    const list = this.$(".list");
    if (this.label) list.setAttribute("aria-label", this.label);
    else list.removeAttribute("aria-label");
    const panel = this.panelElement;
    for (const tab of tabs) {
      const active = tab.value === this.value;
      tab.id ||= uid("doc-tab");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.toggleAttribute("data-active", active);
      if (panel) tab.setAttribute("aria-controls", panel.id);
      else tab.removeAttribute("aria-controls");
      tab.requestUpdate();
    }
    if (panel) {
      panel.setAttribute("role", "tabpanel");
      const active = tabs.find((t) => t.value === this.value);
      if (active) panel.setAttribute("aria-labelledby", active.id);
      else panel.removeAttribute("aria-labelledby");
    }
    this._order = tabs;
    if (this.value !== this._revealed && this._scroller.reveal(tabs.find((t) => t.value === this.value))) {
      this._revealed = this.value;
    }
    this._scroller.update();
  }

  // The selected tab is gone (or none was chosen yet): the one at its place
  // takes over, else the one before it; the first when nothing was selected.
  _replaceSelected(tabs) {
    const before = this._order.findIndex((t) => t.value === this.value);
    const next = before < 0 ? tabs[0] : tabs[Math.min(before, tabs.length - 1)];
    const closed = before >= 0 ? this._order[before] : null;
    if (!next) {
      if (this.value !== undefined && before >= 0) {
        this.commitProperty("value", undefined);
        this.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    if (this.value === undefined || before < 0) {
      this.commitProperty("value", next.value);
      return;
    }
    this.commitProperty("value", next.value);
    this.dispatchEvent(new Event("change", { bubbles: true }));
    if (closed && closed === this._focused) {
      this._focused = next;
      queueMicrotask(() => next.focus());
    }
  }

  _tabOf(e) {
    const tab = e.target.closest?.("ray-doc-tab");
    return tab && tab.closest("ray-doc-tabs") === this ? tab : null;
  }

  _select(tab, user) {
    const changed = tab.value !== this.value;
    this.value = tab.value;
    if (user && changed) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _requestClose(tab, source) {
    if (tab.hideClose) return;
    this.emit("ray-request-close", { value: tab.value, tab, source });
  }

  _key(e) {
    const tab = this._tabOf(e);
    if (!tab || e.target !== tab) return;
    const tabs = this.tabs;
    const i = tabs.indexOf(tab);
    // Right to left, ArrowLeft is the next tab.
    const key = inlineKey(e.key, this);
    let target = null;
    if (key === "ArrowRight") target = tabs[(i + 1) % tabs.length];
    else if (key === "ArrowLeft") target = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === "Home") target = tabs[0];
    else if (e.key === "End") target = tabs[tabs.length - 1];
    else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this._requestClose(tab, "key");
      return;
    }
    if (!target) return;
    e.preventDefault();
    target.focus();
    this._select(target, true);
  }
}

const tabStyles = css`
  :host {
    display: inline-flex;
    align-items: center;
    gap: var(--ray-space-1);
    box-sizing: border-box;
    max-width: 14rem;
    height: var(--ray-control-height-xs);
    padding-inline: var(--ray-space-2) var(--ray-space-1);
    font-size: var(--ray-font-size-sm);
    color: var(--ray-muted-foreground);
    white-space: nowrap;
    border: 1px solid transparent;
    border-radius: var(--ray-radius-sm);
    cursor: default;
    user-select: none;
    outline: none;
    transition: color var(--ray-duration-fast) var(--ray-easing-standard), background-color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host(:hover) { color: var(--ray-foreground); background: var(--ray-muted); }
  :host([data-active]) { color: var(--ray-foreground); background: var(--ray-card); border-color: var(--ray-border); }
  :host(:focus-visible) { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: -2px; }
  .section { display: inline-flex; flex: none; align-items: center; }
  .section:not([data-filled]) { display: none; }
  ::slotted(svg) { width: 1rem; height: 1rem; }
  .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

  /* The end of the tab: the × (on hover and on the selected tab), or the
     unsaved dot, which turns into the × under the pointer. */
  .mark { position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; width: 1.125rem; height: 1.125rem; }
  .close { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--ray-muted-foreground); border-radius: var(--ray-radius-xs); visibility: hidden; }
  .close svg { width: 0.75rem; height: 0.75rem; }
  .close:hover { color: var(--ray-foreground); background: var(--ray-accent); }
  :host(:hover) .close, :host([data-active]) .close { visibility: visible; }
  .dot { position: absolute; display: none; width: 0.4375rem; height: 0.4375rem; background: var(--ray-primary); border-radius: 50%; }
  :host([dirty]) .dot { display: block; }
  :host([dirty]) .close { visibility: hidden; }
  :host([dirty]) .mark:hover .close { visibility: visible; }
  :host([dirty]) .mark:hover .dot { display: none; }
  :host([hide-close]) .close { display: none; }
  :host([hide-close]:not([dirty])) .mark { display: none; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

export class RayDocTab extends RayElement {
  static properties = {
    value: { type: String, reflect: true },
    dirty: { type: Boolean, reflect: true },
    hideClose: { type: Boolean, reflect: true },
  };
  static styles = [tabStyles];
  static template = `<span class="section" part="left-section"><slot name="left"></slot></span><span class="label" part="label"><slot></slot></span><span class="mark" aria-hidden="true"><span class="dot" part="dot"></span><span class="close" part="close" data-ray-icon="ui.close"></span></span><span class="sr"></span>`;

  constructor() {
    super();
    const slot = this.$('slot[name="left"]');
    slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
  }

  update(changed) {
    const bar = this.closest("ray-doc-tabs");
    this.$(".close").title = bar?.closeLabel ?? "Close";
    // The unsaved mark is part of the tab's name for assistive technology.
    this.$(".sr").textContent = this.dirty ? `, ${bar?.dirtyLabel ?? "Unsaved changes"}` : "";
    if (this.hideClose) this.removeAttribute("aria-keyshortcuts");
    else this.setAttribute("aria-keyshortcuts", "Delete");
    if (changed.has("value")) bar?.requestUpdate();
  }
}

define("ray-doc-tabs", RayDocTabs);
define("ray-doc-tab", RayDocTab);
