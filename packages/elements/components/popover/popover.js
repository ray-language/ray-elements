// <ray-popover>: a floating panel anchored to a trigger (slot="trigger"),
// toggled by clicking it; closes on Escape and outside clicks.

import { css, define } from "../../core/core.js";
import { Floating, floatingStyles } from "../../core/floating.js";
import { focusFirst, tabbables } from "../../core/focus.js";

const styles = css`
  /* Defaults on the host, so an ancestor's private --_p / --_width do not leak in. */
  :host { --_p: var(--ray-space-md); --_width: max-content; }
  .panel { padding: var(--_p); width: var(--_width); }
  :host([padding="0"]) { --_p: 0; }
  :host([padding="xs"]) { --_p: var(--ray-space-xs); }
  :host([padding="sm"]) { --_p: var(--ray-space-sm); }
  :host([padding="lg"]) { --_p: var(--ray-space-lg); }
`;

export class RayPopover extends Floating {
  static properties = {
    ...Floating.properties,
    width: { type: String },
    padding: { type: String, reflect: true },
    matchWidth: { type: Boolean, reflect: true },
    trapFocus: { type: Boolean, reflect: true },
  };
  static styles = [floatingStyles, styles];
  static template = `<slot name="trigger"></slot><div class="panel" part="dropdown" role="dialog"><slot></slot></div>`;

  wireTrigger(t) {
    t.addEventListener("click", () => {
      if (!this.open && this.justClosed()) return;
      this.toggle();
    });
  }

  update(changed) {
    if (this.width) this.style.setProperty("--_width", /^\d+$/.test(this.width) ? `${this.width}px` : this.width);
    else this.style.removeProperty("--_width");
    const label = this.getAttribute("aria-label");
    if (label) this.panel.setAttribute("aria-label", label);
    super.update(changed);
  }

  placeOptions() {
    return { matchWidth: Boolean(this.matchWidth) };
  }

  toggled(open) {
    if (open) {
      if (this.trapFocus) focusFirst(this, { lightOnly: true });
      this._onKey = (e) => this._keydown(e);
      this.panel.addEventListener("keydown", this._onKey);
    } else {
      this.panel.removeEventListener("keydown", this._onKey);
      // Return focus to the trigger if it was inside the panel.
      if (this.focusWasInside) this.trigger?.focus();
    }
  }

  // With trap-focus, Tab cycles inside the panel.
  _keydown(e) {
    if (e.key !== "Tab" || !this.trapFocus) return;
    const items = tabbables(this, { lightOnly: true }).filter((el) => el !== this.trigger && !this.trigger?.contains(el));
    if (!items.length) return;
    const active = deepActive();
    const first = items[0];
    const last = items[items.length - 1];
    const at = (el) => el === active || el.shadowRoot?.contains(active) || el.contains(active);
    if (e.shiftKey && at(first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at(last)) {
      e.preventDefault();
      first.focus();
    }
  }
}

function deepActive() {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

define("ray-popover", RayPopover);
