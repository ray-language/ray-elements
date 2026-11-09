// Base class of trigger + floating panel components (popover, menu, tooltip).
//
// The panel is a [popover] element in the shadow root, so it renders in the
// top layer (above dialogs, never clipped by overflow). It is a manual
// popover with light dismiss done in core/dismiss.js (Escape, outside
// clicks, one open at a time): closing is always ours, so it can animate
// out. The trigger is the element slotted into slot="trigger".

import { RayElement, css } from "./core.js";
import { place, autoUpdate } from "./position.js";
import { dismissable } from "./dismiss.js";
import { play, POP_OUT } from "./motion.js";

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
    anchor: { attribute: false },
  };
  /** popover attribute of the panel ("manual": closing is handled here). */
  static popoverMode = "manual";
  /** Close on Escape and outside clicks (tooltips: false). */
  static lightDismiss = true;
  /** aria-haspopup set on the trigger (null = none). */
  static haspopup = "dialog";
  /** The slot holding the trigger. */
  static triggerSlot = 'slot[name="trigger"]';

  #wired = false;
  #synced = false;
  #trigger = null;
  #stopTracking = null;
  #closedAt = undefined;
  #undismiss = null;
  #exit = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.#wired) return;
    this.#wired = true;
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
    super.disconnectedCallback();
    this.#stopTracking?.();
    this.#undismiss?.();
    this.#undismiss = null;
  }

  /** The element slotted as trigger, if any. */
  get trigger() {
    return this.$(/** @type {typeof Floating} */ (this.constructor).triggerSlot)?.assignedElements()[0] ?? null;
  }

  _wireTrigger() {
    const t = this.trigger;
    if (t === this.#trigger) return;
    this.#trigger = t;
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

  /**
   * The rectangle the panel is placed against: `anchor` when set (an element,
   * a DOMRect or a function returning one: a text range, the pointer), else
   * the trigger.
   */
  anchorRect() {
    const a = typeof this.anchor === "function" ? this.anchor() : this.anchor;
    if (a instanceof Element) return a.getBoundingClientRect();
    if (a && typeof a.left === "number") return a;
    return (this.trigger ?? this).getBoundingClientRect();
  }

  show() { this.open = true; }
  hide() { this.open = false; }
  toggle() { this.open = !this.open; }

  update(changed) {
    if (changed.has("open") || !this.#synced) {
      this.#synced = true;
      const isOpen = this.panel.matches(":popover-open");
      if (this.open) {
        // Reopened while animating out: stay open.
        this.#exit?.cancel();
        this.#exit = null;
        this.panel.style.pointerEvents = "";
        if (!isOpen) this.panel.showPopover();
        this._dismissable();
      } else if (isOpen && !this.#exit) {
        this._closePanel();
      }
    }
    if (this.open) this.reposition();
  }

  _dismissable() {
    const ctor = /** @type {typeof Floating} */ (this.constructor);
    if (this.#undismiss || !ctor.lightDismiss || ctor.popoverMode !== "manual") return;
    // When the trigger dismisses, so does the rest of the host's light DOM
    // (the area is a child of the host): only the panel is inside then.
    const area = this.triggerDismisses();
    this.#undismiss = dismissable({ panel: this.panel, owner: area ? this.panel : this, trigger: area ? null : this.trigger, close: () => { this.open = false; } });
  }

  /**
   * Whether a press on the trigger counts as outside and closes the panel.
   * Default false: a button that toggles the panel handles its own click
   * (closing it there too would reopen it). A context menu's trigger is the
   * whole area it serves, so there it is true.
   */
  triggerDismisses() {
    return false;
  }

  /** The keyframes the panel leaves with (subclasses may change them). */
  exitKeyframes() {
    return POP_OUT;
  }

  // Animate out, then really hide (unless reopened meanwhile).
  async _closePanel() {
    this.#undismiss?.();
    this.#undismiss = null;
    const exit = play(this.panel, this.exitKeyframes(), { speed: "fast" });
    this.#exit = exit;
    // Leaving: no more clicks on it (focus stays where it is until hidden).
    this.panel.style.pointerEvents = "none";
    await exit.finished;
    this.panel.style.pointerEvents = "";
    if (this.#exit !== exit) return;
    this.#exit = null;
    if (!this.open && this.panel.matches(":popover-open")) this.panel.hidePopover();
    exit.cancel();
  }

  reposition() {
    if (!this.panel.matches(":popover-open")) return;
    place(this.anchorRect(), this.panel, { placement: this.placement || "bottom", offset: this.offset ?? 8, ...this.placeOptions() });
  }

  /** Extra place() options for subclasses (e.g. matchWidth). */
  placeOptions() { return {}; }

  _onToggle(e) {
    const opening = e.newState === "open";
    // `toggle` is a task: `open` may have changed again since the state it
    // reports. An open that a later `open = false` is already animating out,
    // or a close that a later `open = true` re-showed, must not win over
    // that newer value; only the pair of events is still emitted.
    const stale = opening ? !this.open && Boolean(this.#exit) : Boolean(this.open) && this.panel.matches(":popover-open");
    if (stale) {
      this.emit(opening ? "ray-open" : "ray-close");
      return;
    }
    if (this.popupKind()) this.#trigger?.setAttribute("aria-expanded", String(opening));
    if (opening) {
      this.reposition();
      const anchor = this.trigger ?? this;
      this.#stopTracking = autoUpdate(anchor, this.panel, () => this.reposition());
    } else {
      this.#stopTracking?.();
      this.#stopTracking = null;
      this.#closedAt = performance.now();
    }
    // Light dismiss and Escape close the panel behind our back: sync `open`.
    if (Boolean(this.open) !== opening) this.commitProperty("open", opening);
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
    return this.#closedAt !== undefined && performance.now() - this.#closedAt < 250;
  }
}
