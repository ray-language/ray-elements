// <ray-app-shell>: the frame of an app (Mantine's AppShell): header,
// navbar, main, aside, footer, and a bottom bar for phones.
//
// Wide: the header across the top (or beside the navbar with
// layout="alt"), the navbar and the aside on the sides of the main content.
// Narrow (below `breakpoint`, the shell's own width): one column, header,
// main, footer and the `bottom` slot (a ray-bottom-nav); the navbar and the
// aside take no room (a ray-sidebar there still opens as a drawer).
//
// The main content scrolls, the bars stay: `scroller` is the element that
// scrolls (ray-app-bar and ray-bottom-nav find it on their own).

import { RayElement, css, define } from "../../core/core.js";
import { spaceValue } from "../../core/styles.js";

const styles = css`
  :host {
    display: block;
    height: 100dvh;
    min-height: 0;
    color: var(--ray-foreground);
    background: var(--ray-background);
  }
  :host([hidden]) { display: none; }
  .shell {
    display: grid;
    height: 100%;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    grid-template-areas:
      "header header header"
      "navbar main aside"
      "footer footer footer"
      "bottom bottom bottom";
  }
  :host([layout="alt"]) .shell {
    grid-template-areas:
      "navbar header aside"
      "navbar main aside"
      "navbar footer aside"
      "bottom bottom bottom";
  }
  .header { grid-area: header; min-width: 0; }
  .navbar { grid-area: navbar; display: flex; min-height: 0; }
  .aside { grid-area: aside; display: flex; min-height: 0; }
  .footer { grid-area: footer; min-width: 0; }
  .bottom { grid-area: bottom; min-width: 0; display: none; }
  .main {
    grid-area: main;
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding: var(--_p, 0);
  }
  .header:not([data-filled]), .footer:not([data-filled]), .navbar:not([data-filled]), .aside:not([data-filled]) { display: none; }

  /* Narrow: one column; the side panels take no room but stay rendered
     (a sidebar's drawer is a top-layer dialog inside them). */
  :host([data-mobile]) .shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "header" "main" "footer" "bottom";
  }
  :host([data-mobile]) .navbar, :host([data-mobile]) .aside {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
  :host([data-mobile]) .bottom[data-filled] { display: block; }
`;

/** A CSS length in px, against the element's font size for em/rem. */
function toPx(value, el) {
  const m = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)(px|em|rem)?$/);
  if (!m) return 768;
  const n = Number(m[1]);
  if (m[2] === "rem") return n * parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
  if (m[2] === "em") return n * parseFloat(getComputedStyle(el).fontSize || "16");
  return n;
}

export class RayAppShell extends RayElement {
  static properties = {
    layout: { type: String, reflect: true, default: "default" },
    breakpoint: { type: String, default: "48em" },
    padding: { type: String, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="shell" part="shell">
      <div class="header" part="header"><slot name="header"></slot></div>
      <div class="navbar" part="navbar"><slot name="navbar"></slot></div>
      <div class="main" part="main"><slot></slot></div>
      <div class="aside" part="aside"><slot name="aside"></slot></div>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
      <div class="bottom" part="bottom"><slot name="bottom"></slot></div>
    </div>`;

  #ro = null;
  #syncs = [];

  constructor() {
    super();
    for (const name of ["header", "navbar", "aside", "footer", "bottom"]) {
      const slot = this.$(`slot[name="${name}"]`);
      const sync = () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
      slot.addEventListener("slotchange", sync);
      this.#syncs.push(sync);
    }
  }

  /** The element that scrolls the main content. */
  get scroller() {
    return this.$(".main");
  }

  /** Whether the shell is in its narrow (phone) layout. */
  get mobile() {
    return this.hasAttribute("data-mobile");
  }

  connectedCallback() {
    super.connectedCallback();
    for (const sync of this.#syncs) sync();
    // The layout follows the shell's own width: right in a phone-sized
    // frame as in a full window. Measured at once too (the observer reports
    // before the next paint, and never in a page that is not rendered).
    this.#ro = new ResizeObserver(() => this._measure());
    this.#ro.observe(this);
    this._measure();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#ro?.disconnect();
    this.#ro = null;
  }

  update(changed) {
    const p = spaceValue(this.padding);
    if (p) this.style.setProperty("--_p", p);
    else this.style.removeProperty("--_p");
    if (changed.has("breakpoint")) this._measure();
  }

  _measure() {
    const mobile = this.getBoundingClientRect().width < toPx(this.breakpoint, this);
    if (mobile === this.mobile) return;
    this.toggleAttribute("data-mobile", mobile);
    this.emit("ray-breakpoint", { mobile });
  }
}

define("ray-app-shell", RayAppShell);
