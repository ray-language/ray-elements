// <ray-app-bar>: the top bar of a phone screen (Material's top app bar, the
// iOS navigation bar): a back or menu button, the title (and a subtitle),
// actions, and an optional row under it (tabs, a search field).
//
// scroll-behavior="elevate" (default) draws its border and shadow once the content
// scrolls; scroll-behavior="hide" also slides it away while scrolling down and back
// on the way up. It follows the scroller of its ray-app-shell, else
// `scroll-target`, else the window. Clear of the notch (safe-area inset).

import { RayElement, css, define } from "../../core/core.js";
import { scrollerOf, watchScroll } from "../../core/scroll.js";

const styles = css`
  :host {
    --_h: 3.5rem;
    --_bg: var(--ray-background);
    --_fg: var(--ray-foreground);
    --_muted: var(--ray-muted-foreground);
    display: grid;
    grid-template-rows: 1fr;
    position: relative;
    z-index: 2;
    transition: grid-template-rows var(--ray-duration-base) var(--ray-easing-standard), translate var(--ray-duration-base) var(--ray-easing-standard);
  }
  /* Hidden above a scroller (in a shell): its row closes, the content takes
     the room. Over the window (sticky): it slides up. */
  :host([data-concealed="flow"]) { grid-template-rows: 0fr; clip-path: inset(0); }
  :host([data-concealed="over"]) { translate: 0 -100%; }
  :host([hidden]) { display: none; }
  :host([sticky]) { position: sticky; top: 0; }
  :host([variant="filled"]) { --_bg: var(--ray-primary-filled); --_fg: var(--ray-primary-contrast); --_muted: color-mix(in srgb, var(--ray-primary-contrast) 75%, transparent); }
  :host([variant="transparent"]) { --_bg: transparent; }
  :host([size="sm"]) { --_h: 3rem; }
  :host([size="lg"]) { --_h: 4rem; }
  /* The row that closes (no padding, no border: it can reach 0). */
  .fold { min-height: 0; }
  .bar {
    box-sizing: border-box;
    padding-top: env(safe-area-inset-top, 0px);
    color: var(--_fg);
    background: var(--_bg);
    border-bottom: 1px solid transparent;
    transition: border-color var(--ray-duration-fast), box-shadow var(--ray-duration-fast), background-color var(--ray-duration-fast);
  }
  :host([data-elevated]) .bar { border-bottom-color: var(--ray-border); box-shadow: var(--ray-shadow-sm); }
  :host([data-elevated][variant="transparent"]) .bar { background: var(--ray-background); }
  :host([variant="filled"][data-elevated]) .bar { border-bottom-color: transparent; }
  .row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--ray-space-1);
    min-height: var(--_h);
    padding-inline: max(var(--ray-space-2), env(safe-area-inset-left, 0px)) max(var(--ray-space-2), env(safe-area-inset-right, 0px));
  }
  :host([center]) .row { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
  .start, .end { display: flex; align-items: center; gap: var(--ray-space-1); }
  .end { justify-content: flex-end; }
  .title { display: grid; min-width: 0; padding-inline: var(--ray-space-2); }
  :host([center]) .title { text-align: center; }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--ray-font-size-lg);
    font-weight: var(--ray-font-weight-bold, 700);
    line-height: 1.25;
  }
  :host([size="sm"]) .label { font-size: var(--ray-font-size-md); }
  .description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--ray-font-size-xs); color: var(--_muted); }
  .label:empty, .description:empty { display: none; }
  .bottom { padding: 0 var(--ray-space-2) var(--ray-space-2); }
  .bottom:not([data-filled]), .start:not([data-filled]) { display: none; }
  :host([center]) .start:not([data-filled]) { display: flex; }
  @media (prefers-reduced-motion: reduce) { :host { transition: none; } }
`;

export class RayAppBar extends RayElement {
  static properties = {
    label: { type: String },
    description: { type: String },
    center: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true, default: "default" },
    size: { type: String, reflect: true, default: "md" },
    // Not `scroll`: that would hide the element's scroll() method.
    scrollBehavior: { type: String, attribute: "scroll-behavior", reflect: true, default: "elevate" },
    sticky: { type: Boolean, reflect: true },
    scrollTarget: { type: String, attribute: "scroll-target" },
  };
  static styles = [styles];
  static template = `
    <div class="fold"><div class="bar" part="bar">
      <div class="row">
        <div class="start" part="start"><slot name="start"></slot></div>
        <div class="title" part="title"><span class="label"></span><span class="description"></span><slot></slot></div>
        <div class="end" part="end"><slot name="end"></slot></div>
      </div>
      <div class="bottom" part="bottom"><slot name="bottom"></slot></div>
    </div></div>`;

  #stop = null;
  #lock = 0;

  constructor() {
    super();
    for (const name of ["start", "bottom"]) {
      const slot = this.$(`slot[name="${name}"]`);
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
    }
  }

  connectedCallback() {
    super.connectedCallback();
    for (const name of ["start", "bottom"]) {
      const slot = this.$(`slot[name="${name}"]`);
      slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
    }
    // The shell (or the target) may upgrade after the bar: watch once settled.
    queueMicrotask(() => this._watch());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stop?.();
    this.#stop = null;
  }

  /** Whether scroll-behavior="hide" has slid it away. */
  get concealed() {
    return this.hasAttribute("data-concealed");
  }

  update(changed) {
    this.$(".label").textContent = this.label ?? "";
    this.$(".description").textContent = this.description ?? "";
    if (changed.has("scrollBehavior") || changed.has("scrollTarget")) this._watch();
  }

  _watch() {
    this.#stop?.();
    this.#stop = null;
    this.removeAttribute("data-concealed");
    this.toggleAttribute("data-elevated", false);
    if (!this.isConnected || this.scrollBehavior === "none") return;
    const scroller = scrollerOf(this, this.scrollTarget);
    // In a shell the bar sits above the scroller: hiding gives its room to
    // the content. Over the window it slides away.
    const inFlow = scroller !== window;
    this.#stop = watchScroll(scroller, ({ y, direction }) => {
      this.toggleAttribute("data-elevated", y > 0);
      if (this.scrollBehavior !== "hide") return;
      if (y <= 0) this.removeAttribute("data-concealed");
      else this._conceal(direction === "down" && y > this.offsetHeight + 8, inFlow);
    });
  }

  _conceal(on, inFlow = true) {
    if (on === this.concealed) return;
    // Closing its row resizes the scroller, which can move the scroll
    // position (at the end of the content): ignore that for a moment.
    if (performance.now() < this.#lock) return;
    this.#lock = performance.now() + 400;
    if (on) this.setAttribute("data-concealed", inFlow ? "flow" : "over");
    else this.removeAttribute("data-concealed");
  }
}

define("ray-app-bar", RayAppBar);
