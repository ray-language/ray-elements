// <ray-dialog>: ray-elements's modal (Mantine's Modal, shadcn's Dialog) on the
// native <dialog>: top layer, the rest of the page inert, focus trapped and
// restored, Escape to close. Stacks: a dialog opened from another one goes
// on top of it.
//
// `label` is the heading (not `title`, which would show the browser tooltip
// over the whole dialog). Any slotted element with data-dialog-close closes
// it, with that attribute's value as returnValue. A <form method="dialog">
// in the light DOM cannot reach the shadow <dialog>: use data-dialog-close.
//
// slot="overlay" renders inside the modal <dialog>, so it is not made inert:
// <ray-toaster> moves itself there while a dialog is open.

import { RayElement, css, define } from "../../core/core.js";
import { focusFirst } from "../../core/focus.js";
import { getHost, hostCan } from "../../core/host.js";
import { overlayStyles, applyOverlayBlur } from "../../core/styles.js";
import { play, playAll } from "../../core/motion.js";
import "../button/button.js";

const styles = css`
  :host { display: contents; --_w: 27.5rem; }
  :host([size="xs"]) { --_w: 20rem; }
  :host([size="sm"]) { --_w: 23.75rem; }
  :host([size="lg"]) { --_w: 38.75rem; }
  :host([size="xl"]) { --_w: 48.75rem; }
  :host([size="full"]) { --_w: 100%; }
  dialog {
    box-sizing: border-box;
    width: min(var(--_w), calc(100vw - 2rem));
    max-height: calc(100dvh - 4rem);
    padding: 0;
    overflow: hidden;
    color: var(--ray-card-foreground);
    background: var(--ray-card);
    border: 1px solid var(--ray-overlay-border);
    background-clip: padding-box;
    border-radius: var(--_radius, var(--ray-radius-lg));
    box-shadow: var(--ray-shadow-xl);
  }
  /* Without height it is as tall as its content; with it, fixed (the body scrolls). */
  :host([height]) dialog { height: min(var(--_h), calc(100dvh - 4rem)); }
  :host([size="full"]) dialog { width: calc(100vw - 2rem); height: calc(100dvh - 2rem); max-height: none; }
  dialog[open] { display: flex; flex-direction: column; animation: ray-dialog-in var(--ray-duration-base) var(--ray-easing-out); }
  dialog::backdrop { animation: ray-fade-in var(--ray-duration-base) var(--ray-easing-out); }
  :host([position="top"]) dialog { margin-top: 5vh; }
  @keyframes ray-dialog-in { from { opacity: 0; transform: translateY(-0.5rem) scale(0.98); } }
  @keyframes ray-fade-in { from { opacity: 0; } }
  .header {
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    padding: var(--ray-space-md) var(--ray-space-md) 0;
  }
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
    margin-left: auto;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .close:hover { background: var(--ray-accent); color: var(--ray-foreground); }
  .close svg { width: 1rem; height: 1rem; }
  /* flex-basis auto: Safari collapses a 0% basis under a max-height only. */
  .body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: var(--ray-space-md); }
  .footer { display: flex; justify-content: flex-end; gap: var(--ray-space-2); padding: 0 var(--ray-space-md) var(--ray-space-md); }
  .footer:not([data-filled]) { display: none; }
`;

let scrollLocks = 0;
function lockScroll(on) {
  scrollLocks += on ? 1 : -1;
  document.documentElement.style.overflow = scrollLocks > 0 ? "hidden" : "";
}

export class RayDialog extends RayElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
    size: { type: String, reflect: true, default: "md" },
    position: { type: String, reflect: true, default: "center" },
    persistent: { type: Boolean, reflect: true },
    hideClose: { type: Boolean, reflect: true },
    overlayBlur: { type: String },
    description: { type: String },
    height: { type: String, reflect: true },
    radius: { type: String, reflect: true },
  };
  static styles = [overlayStyles, styles];
  static template = `
    <dialog part="dialog" aria-labelledby="title">
      <header class="header" part="header">
        <div class="heading"><h2 class="title" id="title" part="title"></h2><p class="description" id="description" part="description" hidden></p></div>
        <div class="actions"><slot name="header"></slot><button class="close focus-ring" part="close" type="button" aria-label="Close"><span data-ray-icon="close" aria-hidden="true"></span></button></div>
      </header>
      <div class="body" part="body"><slot></slot></div>
      <footer class="footer" part="footer"><slot name="footer"></slot></footer>
      <slot name="overlay"></slot>
    </dialog>`;

  constructor() {
    super();
    this.returnValue = "";
    this.dialog = this.$("dialog");
    this.dialog.addEventListener("cancel", (e) => {
      // Escape: always handled here (persistent / cancelable request).
      e.preventDefault();
      this._request("escape");
    });
    this.dialog.addEventListener("close", () => this._closed());
    // A non-modal <dialog> fires no `cancel` on Escape: do it here.
    this.dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.dialog.matches(":modal")) {
        e.preventDefault();
        this._request("escape");
      }
    });
    this.dialog.addEventListener("click", (e) => {
      if (e.target === this.dialog && this._outside(e)) this._request("backdrop");
    });
    this.$(".close").addEventListener("click", () => this._request("button"));
    this.addEventListener("click", (e) => {
      const closer = e.target.closest?.("[data-dialog-close]");
      if (closer && this.contains(closer)) this.close(closer.getAttribute("data-dialog-close") ?? "");
    });
    const footer = this.$('slot[name="footer"]');
    footer.addEventListener("slotchange", () => {
      footer.parentElement.toggleAttribute("data-filled", footer.assignedNodes().length > 0);
    });
  }

  show() { this.open = true; }

  /** Protected hook: modal (backdrop, page inert, scroll locked) or not. */
  isModal() {
    return true;
  }

  /** Closes with an optional return value (available as `returnValue` and in ray-close). */
  close(returnValue = "") {
    this.returnValue = returnValue;
    this.open = false;
  }

  update(changed) {
    if (changed.has("overlayBlur")) applyOverlayBlur(this, this.overlayBlur);
    this.$("#title").textContent = this.label ?? "";
    const description = this.$("#description");
    if (description) {
      description.textContent = this.description ?? "";
      description.hidden = !this.description;
      if (this.description) this.dialog.setAttribute("aria-describedby", "description");
      else this.dialog.removeAttribute("aria-describedby");
    }
    this._dimensions();
    this.$(".close").hidden = Boolean(this.hideClose);
    this.$(".header").toggleAttribute("data-empty", !this.label && this.hideClose && !this.querySelector('[slot="header"]'));
    if (this.label) this.dialog.setAttribute("aria-labelledby", "title");
    else this.dialog.removeAttribute("aria-labelledby");
    if (changed.has("open") || this._first === undefined) {
      this._first = false;
      if (this.open && this._exit) {
        // Reopened while animating out: stay open.
        this._exit.cancel();
        this._exit = null;
      } else if (this.open && !this.dialog.open) {
        this._show();
      } else if (!this.open && this.dialog.open && !this._exit) {
        this._leave();
      }
    }
  }

  // size beyond the presets, height and radius: any CSS length. A percentage
  // is of the window (70% wide = 70vw, 70% high = 70dvh), but never smaller
  // than a comfortable minimum (40rem × 30rem), so on a phone it fills it.
  _dimensions() {
    const length = (v, unit, floor) => (/^\d+(\.\d+)?%$/.test(v) ? `max(${v.replace("%", unit)}, ${floor})` : v);
    const custom = this.size && !["xs", "sm", "md", "lg", "xl", "full"].includes(this.size);
    if (custom && this.localName === "ray-dialog") this.style.setProperty("--_w", length(this.size, "vw", "40rem"));
    else if (this.localName === "ray-dialog") this.style.removeProperty("--_w");
    if (this.height) this.style.setProperty("--_h", length(this.height, "dvh", "30rem"));
    else this.style.removeProperty("--_h");
    const r = this.radius;
    if (r) this.style.setProperty("--_radius", ["xs", "sm", "md", "lg", "xl"].includes(r) ? `var(--ray-radius-${r})` : r === "none" ? "0" : r);
    else this.style.removeProperty("--_radius");
  }

  /** Protected hook: the keyframes the dialog leaves with. */
  exitKeyframes() {
    return [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateY(-0.25rem) scale(0.98)" },
    ];
  }

  // Animate the dialog and its backdrop out, then really close it.
  async _leave() {
    const exit = playAll([
      play(this.dialog, this.exitKeyframes()),
      play(this.dialog, [{ opacity: 1 }, { opacity: 0 }], { pseudoElement: "::backdrop" }),
    ]);
    this._exit = exit;
    await exit.finished;
    if (this._exit !== exit) return;
    this._exit = null;
    if (!this.open && this.dialog.open) this.dialog.close(this.returnValue);
    exit.cancel();
  }

  _show() {
    this._returnFocus = document.activeElement;
    this.returnValue = "";
    this._locked = this.isModal();
    if (this._locked) {
      this.dialog.showModal();
      lockScroll(true);
    } else {
      this.dialog.show();
    }
    // Focus the content's first focusable (or [autofocus]); else the close
    // button. Content created along with the dialog (confirmDialog) renders
    // its own focusable parts a microtask later: try again then.
    const focusContent = () => focusFirst(this, { lightOnly: true });
    if (!focusContent()) this.$(".close").focus();
    queueMicrotask(() => {
      const inside = this.contains(document.activeElement) && document.activeElement !== this;
      if (this.open && !inside) focusContent();
    });
    this.emit("ray-open");
  }

  _closed() {
    if (this._locked) lockScroll(false);
    this._locked = false;
    if (this.open) this.commitProperty("open", false);
    const back = this._returnFocus;
    this._returnFocus = null;
    if (back && typeof back.focus === "function" && back.isConnected) back.focus({ preventScroll: true });
    this.emit("ray-close", { returnValue: this.returnValue });
  }

  _request(source) {
    if (this.persistent && source !== "button") return;
    if (!this.emit("ray-request-close", { source }, { cancelable: true })) return;
    this.close("");
  }

  _outside(e) {
    const r = this.dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Removed while open: no `close` event reaches a disconnected element,
    // so undo here what opening did.
    if (this.dialog.open) this.dialog.close();
    if (this._locked) {
      lockScroll(false);
      this._locked = false;
    }
    const toaster = this.querySelector(":scope > ray-toaster");
    if (toaster) {
      toaster.removeAttribute("slot");
      document.body.append(toaster);
      toaster.raise?.();
    }
  }
}

define("ray-dialog", RayDialog);

/**
 * A confirmation dialog. Resolves true when confirmed, false otherwise.
 * @param {{ label?: string, message?: string, confirmLabel?: string, cancelLabel?: string, color?: string }} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ label = "Are you sure?", message = "", confirmLabel = "Confirm", cancelLabel = "Cancel", color = "", native = true } = {}) {
  // With a native host (core/host.js), the system's modal asks instead; a
  // red confirmation (a destructive action) gets the warning style.
  if (native && hostCan("confirm")) {
    const style = color === "red" ? "warning" : "";
    return getHost().confirm({ title: label, message, confirmLabel, cancelLabel, style });
  }
  return new Promise((resolve) => {
    const d = document.createElement("ray-dialog");
    d.label = label;
    d.size = "sm";
    const p = document.createElement("p");
    p.style.margin = "0";
    p.textContent = message;
    const footer = document.createElement("div");
    footer.slot = "footer";
    footer.style.display = "contents";
    const cancel = document.createElement("ray-button");
    cancel.variant = "default";
    cancel.textContent = cancelLabel;
    cancel.setAttribute("data-dialog-close", "cancel");
    const ok = document.createElement("ray-button");
    if (color) ok.color = color;
    ok.textContent = confirmLabel;
    ok.setAttribute("data-dialog-close", "confirm");
    ok.setAttribute("autofocus", "");
    footer.append(cancel, ok);
    d.append(p, footer);
    d.addEventListener("ray-close", (e) => {
      d.remove();
      resolve(e.detail.returnValue === "confirm");
    }, { once: true });
    document.body.append(d);
    d.open = true;
  });
}
