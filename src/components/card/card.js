// <ray-card>: a surface with optional header and footer.

import { RayElement, css, define } from "../../core/core.js";
import { radiusStyles } from "../../core/styles.js";

const styles = css`
  :host {
    display: block;
    --_p: var(--ray-space-md);
    --_shadow: none;
  }
  :host([padding="xs"]) { --_p: var(--ray-space-xs); }
  :host([padding="sm"]) { --_p: var(--ray-space-sm); }
  :host([padding="lg"]) { --_p: var(--ray-space-lg); }
  :host([padding="xl"]) { --_p: var(--ray-space-xl); }
  :host([padding="0"]) { --_p: 0; }
  :host([shadow="xs"]) { --_shadow: var(--ray-shadow-xs); }
  :host([shadow="sm"]) { --_shadow: var(--ray-shadow-sm); }
  :host([shadow="md"]) { --_shadow: var(--ray-shadow-md); }
  :host([shadow="lg"]) { --_shadow: var(--ray-shadow-lg); }
  :host([shadow="xl"]) { --_shadow: var(--ray-shadow-xl); }
  .card {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    color: var(--ray-card-foreground);
    background: var(--ray-card);
    border: 1px solid transparent;
    border-radius: var(--_r);
    box-shadow: var(--_shadow);
  }
  :host([with-border]) .card,
  :host([variant="outline"]) .card { border-color: var(--ray-border); }
  :host([variant="filled"]) .card { background: var(--ray-muted); }
  :host([variant="outline"]) .card { background: transparent; }
  .header, .footer { padding: var(--_p); }
  .header { padding-bottom: 0; }
  .footer { padding-top: 0; }
  .header:not([data-filled]), .footer:not([data-filled]) { display: none; }
  .body { flex: 1; padding: var(--_p); }
  ::slotted([slot="media"]) { display: block; width: 100%; }
`;

export class RayCard extends RayElement {
  static properties = {
    padding: { type: String, reflect: true },
    radius: { type: String, reflect: true },
    shadow: { type: String, reflect: true },
    withBorder: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true, default: "default" },
  };
  static styles = [radiusStyles, styles];
  static template = `
    <div class="card" part="card">
      <slot name="media"></slot>
      <div class="header" part="header"><slot name="header"></slot></div>
      <div class="body" part="body"><slot></slot></div>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
    </div>`;

  connectedCallback() {
    super.connectedCallback();
    for (const name of ["header", "footer"]) {
      const slot = this.$(`slot[name="${name}"]`);
      const sync = () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0);
      slot.addEventListener("slotchange", sync);
      sync();
    }
  }
}

define("ray-card", RayCard);
