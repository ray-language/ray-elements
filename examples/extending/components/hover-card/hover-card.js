// Level 3 — a new overlay on Floating: <app-hover-card> shows rich content
// while its trigger is hovered or focused (Mantine's HoverCard). The base
// gives it the top-layer panel, anchored placement with flip/shift, Escape,
// focus return and the open/close events.

import { Floating, floatingStyles, css, define } from "@ray-ds/elements";

const styles = css`
  .panel { padding: var(--ray-space-md); width: max-content; max-width: 20rem; }
`;

export class AppHoverCard extends Floating {
  static properties = {
    ...Floating.properties,
    openDelay: { type: Number, default: 200 },
    closeDelay: { type: Number, default: 150 },
  };
  static styles = [floatingStyles, styles];
  static popoverMode = "manual"; // hover decides, not light dismiss
  static haspopup = null;        // not a popup button
  static template = `<slot name="trigger"></slot><div class="panel" part="dropdown" role="dialog"><slot></slot></div>`;

  // Protected hook: called with the slotted trigger.
  wireTrigger(trigger) {
    const later = (open) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.open = open; }, open ? this.openDelay : this.closeDelay);
    };
    for (const el of [trigger, this]) {
      el.addEventListener("pointerenter", () => later(true));
      el.addEventListener("pointerleave", () => later(false));
    }
    trigger.addEventListener("focusin", () => later(true));
    this.addEventListener("focusout", (e) => {
      if (!this.contains(e.relatedTarget)) later(false);
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.open) {
        this.open = false;
        trigger.focus();
      }
    });
  }
}

define("app-hover-card", AppHoverCard);
