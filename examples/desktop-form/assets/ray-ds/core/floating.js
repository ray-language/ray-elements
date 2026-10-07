// Base class of trigger + floating panel components (popover, menu, tooltip).
//
// The panel is a [popover] element in the shadow root, so it renders in the
// top layer (above dialogs, never clipped by overflow) and, as popover=auto,
// closes on Escape and on outside clicks. The trigger is the element slotted
// into slot="trigger".

import { RayElement, css } from "./core.js";
import { place, autoUpdate } from "./position.js";

export const floatingStyles = css`
  :host { display: inline-block; }
  .panel {
    box-sizing: border-box;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    overflow: auto;
    padding: 0;
    margin: 0;
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    box-shadow: var(--ray-shadow-md);
  }
  .panel:popover-open { animation: ray-pop-in var(--ray-duration-fast) var(--ray-easing-out); }
  @keyframes ray-pop-in { from { opacity: 0; transform: scale(0.97); } }
`;

export class Floating extends RayElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    placement: { type: String, reflect: true, default: "bottom" },
    offset: { type: Number, default: 8 },
  };
  /** popover attribute of the panel: "auto" (light dismiss) or "manual". */
  static popoverMode = "auto";
  /** aria-haspopup set on the trigger (null = none). */
  static haspopup = "dialog";
  /** The slot holding the trigger. */
  static triggerSlot = 'slot[name="trigger"]';

  connectedCallback() {
    super.connectedCallback();
    if (this._wired) return;
    this._wired = true;
    this.panel = this.$(".panel");
    this.panel.setAttribute("popover", /** @type {typeof Floating} */ (this.constructor).popoverMode);
    this.panel.addEventListener("toggle", (e) => this._onToggle(e));
    // `toggle` is async: by then focus has already left a hidden panel.
    this.panel.addEventListener("beforetoggle", (e) => {
      if (e.newState === "closed") this.focusWasInside = this.contains(document.activeElement) && !this.trigger?.contains(document.activeElement);
    });
    const slot = this.$(/** @type {typeof Floating} */ (this.constructor).triggerSlot);
    slot?.addEventListener("slotchange", () => this._wireTrigger());
    this._wireTrigger();
  }

  disconnectedCallback() {
    this._stopTracking?.();
  }

  /** The element slotted as trigger, if any. */
  get trigger() {
    return this.$(/** @type {typeof Floating} */ (this.constructor).triggerSlot)?.assignedElements()[0] ?? null;
  }

  _wireTrigger() {
    const t = this.trigger;
    if (t === this._trigger) return;
    this._trigger = t;
    if (!t) return;
    const hp = this.popupKind();
    if (hp) {
      t.setAttribute("aria-haspopup", hp);
      t.setAttribute("aria-expanded", String(Boolean(this.open)));
    }
    this.wireTrigger(t);
  }

  /** aria-haspopup of the trigger for this instance (null: not a popup trigger). */
  popupKind() {
    return /** @type {typeof Floating} */ (this.constructor).haspopup;
  }

  /** Subclasses attach their trigger listeners here. */
  wireTrigger(_trigger) {}

  /** The rectangle the panel is placed against (default: the trigger). */
  anchorRect() {
    return (this.trigger ?? this).getBoundingClientRect();
  }

  show() { this.open = true; }
  hide() { this.open = false; }
  toggle() { this.open = !this.open; }

  update(changed) {
    if (changed.has("open") || !this._synced) {
      this._synced = true;
      const isOpen = this.panel.matches(":popover-open");
      if (this.open && !isOpen) {
        this.panel.showPopover();
      } else if (!this.open && isOpen) {
        this.panel.hidePopover();
      }
    }
    if (this.open) this.reposition();
  }

  reposition() {
    if (!this.panel.matches(":popover-open")) return;
    place(this.anchorRect(), this.panel, { placement: this.placement || "bottom", offset: this.offset ?? 8, ...this.placeOptions() });
  }

  /** Extra place() options for subclasses (e.g. matchWidth). */
  placeOptions() { return {}; }

  _onToggle(e) {
    const opening = e.newState === "open";
    if (this.popupKind()) this._trigger?.setAttribute("aria-expanded", String(opening));
    if (opening) {
      this.reposition();
      const anchor = this.trigger ?? this;
      this._stopTracking = autoUpdate(anchor, this.panel, () => this.reposition());
    } else {
      this._stopTracking?.();
      this._stopTracking = null;
      this._closedAt = performance.now();
    }
    // Light dismiss and Escape close the panel behind our back: sync `open`.
    if (Boolean(this.open) !== opening) this._store("open", opening);
    this.emit(opening ? "ray-open" : "ray-close");
    this.toggled(opening);
  }

  /** Hook after the panel opened/closed. */
  toggled(_open) {}

  /**
   * Whether a click on the trigger should be ignored because the same
   * pointer gesture just light-dismissed the panel (it would reopen it).
   */
  justClosed() {
    return this._closedAt !== undefined && performance.now() - this._closedAt < 250;
  }
}
