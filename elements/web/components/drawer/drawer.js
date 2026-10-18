// <ray-drawer>: a panel that slides in from an edge (Mantine's Drawer).
//
// It is a RayDialog with another look: the same native <dialog>, focus
// handling, Escape, persistent, data-dialog-close, returnValue, scroll lock
// and toasts slot. `modeless` makes it a side panel that leaves the page
// interactive (no backdrop, no scroll lock; Escape still closes it).

import { css, define } from "../../core/core.js";
import { RayDialog } from "../dialog/dialog.js";
import { overlayStyles } from "../../core/styles.js";

const SIZES = { xs: "20rem", sm: "23.75rem", md: "27.5rem", lg: "38.75rem", xl: "48.75rem", full: "100%" };

const styles = css`
  :host { display: contents; --_size: 27.5rem; --_inset: 0px; --_r: 0px; }
  :host([floating]) { --_inset: var(--ray-space-3); --_r: var(--ray-radius-lg); }
  dialog {
    position: fixed;
    box-sizing: border-box;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    color: var(--ray-card-foreground);
    background: var(--ray-card);
    border: 0 solid var(--ray-overlay-border);
    background-clip: padding-box;
    border-radius: var(--_r);
    box-shadow: var(--ray-shadow-xl);
  }
  dialog[open] { display: flex; flex-direction: column; }
  dialog::backdrop { animation: ray-fade-in var(--ray-duration-base) var(--ray-easing-out); }

  :host(:not([position])) dialog, :host([position="right"]) dialog {
    inset: var(--_inset) var(--_inset) var(--_inset) auto; /* physical */
    width: min(var(--_size), calc(100vw - 2 * var(--_inset)));
    height: calc(100dvh - 2 * var(--_inset));
    border-left-width: 1px; /* physical */
    --_from: translateX(100%);
  }
  :host([position="left"]) dialog {
    inset: var(--_inset) auto var(--_inset) var(--_inset); /* physical */
    width: min(var(--_size), calc(100vw - 2 * var(--_inset)));
    height: calc(100dvh - 2 * var(--_inset));
    border-right-width: 1px; /* physical */
    --_from: translateX(-100%);
  }
  :host([position="top"]) dialog {
    inset: var(--_inset) var(--_inset) auto var(--_inset);
    width: calc(100vw - 2 * var(--_inset));
    height: min(var(--_size), calc(100dvh - 2 * var(--_inset)));
    border-bottom-width: 1px;
    --_from: translateY(-100%);
  }
  :host([position="bottom"]) dialog {
    inset: auto var(--_inset) var(--_inset) var(--_inset);
    width: calc(100vw - 2 * var(--_inset));
    height: min(var(--_size), calc(100dvh - 2 * var(--_inset)));
    border-top-width: 1px;
    --_from: translateY(100%);
  }
  :host([floating]) dialog { border-width: 1px; }
  /* A modeless dialog is not in the top layer: stack it above sticky headers
     and dropdowns (an ancestor with transform/filter would still clip it). */
  dialog:not(:modal) { z-index: var(--ray-z-overlay); }
  dialog[open] { animation: ray-drawer-in var(--ray-duration-slow) var(--ray-easing-out); }
  @keyframes ray-drawer-in { from { transform: var(--_from); } }
  @keyframes ray-fade-in { from { opacity: 0; } }

  .header { display: flex; align-items: center; gap: var(--ray-space-3); padding: var(--ray-space-md); border-bottom: 1px solid var(--ray-border); }
  .header[data-empty] { display: none; }
  .header:has(.description:not([hidden])) { align-items: flex-start; }
  /* The header slot and the close button, centered on the title's line
     whether or not a description follows it. */
  .actions { display: flex; flex: none; align-items: center; gap: var(--ray-space-3); height: calc(var(--ray-font-size-lg) * var(--ray-line-height-heading)); }
  .heading { display: grid; flex: 1; gap: var(--ray-space-1); min-width: 0; }
  .title { margin: 0; font-size: var(--ray-font-size-lg); font-weight: var(--ray-font-weight-semibold); line-height: var(--ray-line-height-heading); }
  .description { margin: 0; font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); }
  .close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ray-control-height-xs);
    height: var(--ray-control-height-xs);
    margin-inline-start: auto;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .close:hover { background: var(--ray-accent); color: var(--ray-foreground); }
  .close svg { width: 1rem; height: 1rem; }
  .body { flex: 1; overflow: auto; padding: var(--ray-space-md); }
  .footer { display: flex; justify-content: flex-end; gap: var(--ray-space-2); padding: var(--ray-space-md); border-top: 1px solid var(--ray-border); }
  .footer:not([data-filled]) { display: none; }
`;

export class RayDrawer extends RayDialog {
  static properties = {
    ...RayDialog.properties,
    position: { type: String, reflect: true, default: "right" },
    size: { type: String, reflect: true, default: "md" },
    modeless: { type: Boolean, reflect: true },
    floating: { type: Boolean, reflect: true },
  };
  static styles = [overlayStyles, styles];
  static template = `
    <dialog part="drawer" aria-labelledby="title">
      <header class="header" part="header">
        <div class="heading"><h2 class="title" id="title" part="title"></h2><p class="description" id="description" part="description" hidden></p></div>
        <div class="actions"><slot name="header"></slot><button class="close focus-ring" part="close" type="button" aria-label="Close"><span data-ray-icon="ui.close" aria-hidden="true"></span></button></div>
      </header>
      <div class="body" part="body"><slot></slot></div>
      <footer class="footer" part="footer"><slot name="footer"></slot></footer>
      <slot name="overlay"></slot>
    </dialog>`;

  isModal() {
    return !this.modeless;
  }

  /** Leaves through the edge it came from (the --_from of its entry). */
  exitKeyframes() {
    const to = getComputedStyle(this.dialog).getPropertyValue("--_from").trim() || "translateX(100%)";
    return [{ transform: "none" }, { transform: to }];
  }

  update(changed) {
    // xs…xl, full, or any CSS length.
    const size = SIZES[this.size] ?? this.size;
    if (size) this.style.setProperty("--_size", size);
    super.update(changed);
  }
}

define("ray-drawer", RayDrawer);
