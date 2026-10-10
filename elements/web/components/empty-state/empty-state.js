// <ray-empty-state>: what a list, table or pane shows when there is nothing
// in it: an icon, a title, a line of text and the action that fills it.

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host { display: block; }
  .root {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ray-space-2);
    padding: var(--ray-space-8) var(--ray-space-4);
    text-align: center;
  }
  :host([compact]) .root { padding: var(--ray-space-4); }
  :host([with-border]) .root { border: 1px dashed var(--ray-border); border-radius: var(--ray-radius-default); }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    margin-bottom: var(--ray-space-1);
    color: var(--ray-muted-foreground);
    background: var(--ray-muted);
    border-radius: var(--ray-radius-full);
  }
  .icon:not([data-filled]) { display: none; }
  ::slotted(svg) { width: 1.5rem; height: 1.5rem; }
  .title { margin: 0; font-size: var(--ray-font-size-md); font-weight: var(--ray-font-weight-semibold); color: var(--ray-foreground); }
  .title:empty { display: none; }
  .text { max-width: 28rem; font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); }
  .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--ray-space-2); margin-top: var(--ray-space-2); }
  .actions:not([data-filled]) { display: none; }
`;

export class RayEmptyState extends RayElement {
  static properties = {
    label: { type: String },
    compact: { type: Boolean, reflect: true },
    withBorder: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="root" part="root">
      <span class="icon" part="icon"><slot name="icon"></slot></span>
      <p class="title" part="title"></p>
      <div class="text" part="text"><slot></slot></div>
      <div class="actions" part="actions"><slot name="actions"></slot></div>
    </div>`;

  constructor() {
    super();
    for (const name of ["icon", "actions"]) {
      const slot = this.$(`slot[name="${name}"]`);
      slot.addEventListener("slotchange", () => slot.parentElement.toggleAttribute("data-filled", slot.assignedNodes().length > 0));
    }
  }

  update() {
    this.$(".title").textContent = this.label ?? "";
  }
}

define("ray-empty-state", RayEmptyState);
