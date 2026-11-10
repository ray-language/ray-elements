// <ray-notification>: a message card (title, text, status icon, loader, close).
// <ray-toaster>: the stack notify() shows them in — a polite live region in
// the top layer (Popover API), so toasts stay visible above dialogs.
//
// API (Mantine's notifications):
//   const id = notify({ title, message, color, icon, loading, autoClose, closable, action: { label, icon, onClick }, actions: [...], id })
//   updateNotification(id, { … })   hideNotification(id)   clearNotifications()

import { RayElement, css, define } from "../../core/core.js";
import { motionAllowed, play } from "../../core/motion.js";
import { applyColor, variantStyles } from "../../core/styles.js";

const notificationStyles = css`
  :host { display: block; }
  .card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: var(--ray-space-3);
    padding: var(--ray-space-3);
    padding-inline-start: var(--ray-space-4);
    overflow: hidden;
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid transparent;
    border-radius: var(--ray-radius-lg);
    box-shadow: var(--ray-shadow-lg);
  }
  :host([with-border]) .card { border-color: var(--ray-border); }
  /* Behind the front toast of a collapsed stack: only its edge shows. */
  .card > * { transition: opacity var(--ray-duration-base) var(--ray-easing-standard); }
  :host([data-behind]) .card > * { opacity: 0; }
  /* Its box is clipped to the front toast's height: the card follows, so its
     border and corners show instead of being cut. */
  :host([data-behind]) .card { height: 100%; }
  .card[data-icon], .card[data-loading], .card[data-glyph] { padding-inline-start: var(--ray-space-3); }
  .icon {
    display: none;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    color: var(--_contrast);
    background: var(--_filled);
    border-radius: 50%;
  }
  .card[data-icon] .icon { display: inline-flex; }
  /* The loader: an SVG ring drawn like the status icons' circle (r 9 of the
     same 24 grid, same stroke), so it is not larger or heavier than a check
     or a cross. A CSS border could not match: browsers round its width. */
  .loader {
    display: none;
    flex: none;
    color: var(--_light-color);
    --ray-icon-size: var(--ray-notification-icon-size, 1.5rem);
    --ray-icon-stroke: var(--ray-notification-icon-stroke, 1.5);
  }
  .loader svg {
    width: var(--ray-icon-size);
    height: var(--ray-icon-size);
    fill: none;
    stroke: currentColor;
    stroke-width: var(--ray-icon-stroke);
    stroke-linecap: round;
    animation: ray-spin 0.75s linear infinite;
  }
  @keyframes ray-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .loader svg { animation-duration: 1.5s; }
  }
  /* A colored notification's status icon, where the loader goes. The
     light-color shade: legible on the card in both schemes (yellow too).
     Larger and thinner than inline icons; tuned with --ray-notification-icon-size
     and --ray-notification-icon-stroke. */
  .glyph {
    display: none;
    flex: none;
    color: var(--_light-color);
    --ray-icon-size: var(--ray-notification-icon-size, 1.5rem);
    --ray-icon-stroke: var(--ray-notification-icon-stroke, 1.5);
  }
  .card[data-glyph] .glyph { display: inline-flex; }
  .card[data-loading] .glyph, .card[data-icon] .glyph { display: none !important; }
  .card[data-loading] .loader { display: inline-flex; }
  .card[data-loading] .icon { display: none; }
  ::slotted(svg) { width: 1rem; height: 1rem; }
  .body { flex: 1; min-width: 0; }
  .title { margin: 0 0 0.125rem; font-size: var(--ray-font-size-sm); font-weight: var(--ray-font-weight-semibold); }
  .title:empty { display: none; }
  .message { font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); overflow-wrap: anywhere; }
  .title:empty + .message { color: var(--ray-popover-foreground); }
  .close {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .close:hover { background: var(--ray-accent); color: var(--ray-foreground); }
  .actions { display: flex; flex: none; flex-wrap: wrap; gap: var(--ray-space-2); align-self: center; justify-content: flex-end; }
  .card:not([data-actions]) .actions { display: none; }
  .action {
    display: inline-flex;
    align-items: center;
    gap: var(--ray-space-1);
    flex: none;
    height: 1.75rem;
    padding: 0 var(--ray-space-3);
    font: inherit;
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium);
    border-radius: var(--ray-radius-default);
    cursor: pointer;
  }
  .action-icon { display: inline-flex; --ray-icon-size: 1rem; }
  .card[data-actions] .close { align-self: center; }
  .close svg { width: 1rem; height: 1rem; }
  [hidden] { display: none !important; }
`;

/** The status icon of a color: success, error, warning, else info. */
export function statusIcon(color) {
  if (color === "green" || color === "teal") return "circle-check";
  if (color === "red" || color === "pink") return "circle-x";
  if (color === "yellow" || color === "orange") return "alert-triangle";
  return "info";
}

export class RayNotification extends RayElement {
  static properties = {
    label: { type: String },
    color: { type: String, reflect: true },
    loading: { type: Boolean, reflect: true },
    hideClose: { type: Boolean, reflect: true },
    withBorder: { type: Boolean, reflect: true },
    actionLabel: { type: String, attribute: "action-label" },
    actionIcon: { attribute: false },
    actions: { attribute: false },
    icon: { type: String },
  };
  static styles = [variantStyles, notificationStyles];
  static template = `
    <div class="card" part="card">
      <span class="icon" part="icon"><slot name="icon"></slot></span>
      <span class="loader" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-dasharray="42.4 14.1"/></svg></span>
      <span class="glyph" part="status-icon" aria-hidden="true"></span>
      <div class="body">
        <p class="title" part="title"></p>
        <div class="message" part="message"><slot></slot></div>
      </div>
      <span class="actions" part="actions"><slot name="action"></slot></span>
      <button class="close focus-ring" part="close" type="button" aria-label="Close notification"><span data-ray-icon="ui.close" aria-hidden="true"></span></button>
    </div>`;

  constructor() {
    super();
    this.$(".close").addEventListener("click", () => this.emit("ray-close"));
    // Buttons are rebuilt only when the actions change: a pulse inside keeps running.
    this.$(".actions").addEventListener("click", (e) => {
      const b = e.target.closest?.("button.action");
      if (b && this.$(".actions").contains(b)) this.emit("ray-action", { index: Number(b.dataset.index) });
    });
    const own = this.$('slot[name="action"]');
    own.addEventListener("slotchange", () => this._paintActions());
    const icon = this.$('slot[name="icon"]');
    icon.addEventListener("slotchange", () => this.$(".card").toggleAttribute("data-icon", icon.assignedNodes().length > 0));
  }

  update(changed) {
    const card = this.$(".card");
    applyColor(card, this.color);
    card.toggleAttribute("data-loading", Boolean(this.loading));
    // Status icon: the `icon` given, else one that fits the color.
    const glyph = this.icon === "none" ? "" : (this.icon || (this.color ? statusIcon(this.color) : ""));
    card.toggleAttribute("data-glyph", Boolean(glyph));
    const g = this.$(".glyph");
    if (glyph && g.getAttribute("data-ray-icon") !== glyph) {
      g.setAttribute("data-ray-icon", glyph);
      this.paintIcons(card);
    }
    this.$(".title").textContent = this.label ?? "";
    this.$(".close").hidden = Boolean(this.hideClose);
    if (changed.has("actions") || changed.has("actionLabel") || changed.has("actionIcon")) this._renderActions();
    this._paintActions();
  }

  /**
   * The action buttons: `actions`, else one from actionLabel and actionIcon.
   * Each is part "action action-<index>" (and "action-<name>" with a name),
   * in its variant (default "default") and color (default the card's).
   */
  _renderActions() {
    const list = Array.isArray(this.actions) ? this.actions : this.actionLabel ? [{ label: this.actionLabel, icon: this.actionIcon }] : [];
    const box = this.$(".actions");
    for (const b of box.querySelectorAll("button.action")) b.remove();
    const slot = box.querySelector("slot");
    list.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "action focus-ring";
      const name = typeof a?.name === "string" && /^[\w-]+$/.test(a.name) ? ` action-${a.name}` : "";
      b.setAttribute("part", `action action-${i}${name}`);
      b.dataset.index = String(i);
      b.dataset.variant = a?.variant || "default";
      b.toggleAttribute("data-interactive", true);
      if (a?.color) applyColor(b, a.color);
      const icon = a?.icon;
      if (icon) {
        const span = document.createElement("span");
        span.className = "action-icon";
        span.setAttribute("aria-hidden", "true");
        if (icon instanceof Node) span.append(icon);
        else span.setAttribute("data-ray-icon", String(icon));
        b.append(span);
      }
      b.append(a?.label ?? "");
      box.insertBefore(b, slot);
    });
    this.paintIcons(box);
  }

  _paintActions() {
    const box = this.$(".actions");
    const own = box.querySelector("slot").assignedElements().length > 0;
    this.$(".card").toggleAttribute("data-actions", own || Boolean(box.querySelector("button.action")));
  }
}

const toasterStyles = css`
  :host {
    position: fixed;
    inset: auto;
    z-index: var(--ray-z-toast);
    box-sizing: content-box;
    display: block;
    width: min(24rem, calc(100vw - 2rem));
    margin: 0;
    padding: var(--ray-space-4);
    overflow: visible;
    color: inherit;
    background: transparent;
    border: 0;
    pointer-events: none;
    transition: height var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host(:not(:popover-open)) { display: none; }
  /* Clear of the notch and the home indicator (safe-area insets). */
  :host([position^="top"]) { top: env(safe-area-inset-top, 0px); }
  :host([position^="bottom"]), :host(:not([position])) { bottom: env(safe-area-inset-bottom, 0px); }
  /* -start/-end follow the writing direction; -left/-right are sides of the screen. */
  :host([position$="-end"]), :host(:not([position])) { inset-inline-end: 0; }
  :host([position$="-start"]) { inset-inline-start: 0; }
  :host([position$="right"]) { right: 0; } /* physical */
  :host([position$="left"]) { left: 0; } /* physical */
  :host([position$="center"]) { left: 50%; transform: translateX(-50%); } /* physical */
  /* Toasts are placed by layout(): absolute, stacked from the edge. */
  ::slotted(*) {
    position: absolute;
    inset-inline: var(--ray-space-4);
    pointer-events: auto;
    touch-action: pan-y;
    transform-origin: 50% 100%;
    transition:
      transform var(--ray-duration-base) var(--ray-easing-standard),
      opacity var(--ray-duration-base) var(--ray-easing-standard),
      height var(--ray-duration-base) var(--ray-easing-standard);
  }
  :host([position^="bottom"]) ::slotted(*), :host(:not([position])) ::slotted(*) { bottom: var(--ray-space-4); }
  :host([position^="top"]) ::slotted(*) { top: var(--ray-space-4); transform-origin: 50% 0; }
  ::slotted([data-swiping]) { transition: none; }
  /* Phones: full width at the bottom (or top), wherever the desktop position is. */
  @media (max-width: 40em) {
    :host { width: auto; inset-inline: 0; transform: none; padding: var(--ray-space-3); }
    /* Same specificity as the -center rule above, which would keep left: 50%. */
    :host([position$="center"]) { left: 0; right: 0; transform: none; } /* physical */
    :host([position^="top"]) { top: env(safe-area-inset-top, 0px); bottom: auto; }
    :host(:not([position^="top"])) { bottom: env(safe-area-inset-bottom, 0px); top: auto; }
    ::slotted(*) { inset-inline: var(--ray-space-3); }
    :host(:not([position^="top"])) ::slotted(*) { bottom: var(--ray-space-3); }
    :host([position^="top"]) ::slotted(*) { top: var(--ray-space-3); }
  }
  @media (prefers-reduced-motion: reduce) {
    :host, ::slotted(*) { transition: none; }
  }
`;

// A modal <dialog> makes everything outside it inert, toasts included. While
// modal ray-elements overlays are open, the toaster lives in the topmost one (its
// "overlay" slot renders inside the <dialog>), and goes back to <body> after.
const openDialogs = [];
// Any modal ray-elements overlay with an "overlay" slot (dialog, drawer, palette).
const hostsToasts = (el) => Boolean(el.shadowRoot?.querySelector('slot[name="overlay"]') && el.dialog?.matches?.(":modal"));
document.addEventListener("ray-open", (e) => {
  if (hostsToasts(e.target) && !openDialogs.includes(e.target)) {
    openDialogs.push(e.target);
    rehome();
  }
});
document.addEventListener("ray-close", (e) => {
  const i = openDialogs.indexOf(e.target);
  if (i >= 0) openDialogs.splice(i, 1);
  // Also when the closing overlay was not the one listed: never stay inside
  // an overlay that is no longer open.
  rehome();
});

function rehome() {
  const t = document.querySelector("ray-toaster");
  if (!t) return;
  for (let i = openDialogs.length - 1; i >= 0; i--) {
    const d = openDialogs[i];
    if (!d.isConnected || !d.dialog?.open) openDialogs.splice(i, 1);
  }
  const host = openDialogs.at(-1) ?? document.body;
  if (t.parentElement === host) return;
  if (host === document.body) t.removeAttribute("slot");
  else t.slot = "overlay";
  host.append(t);
  t.raise();
}

// Collapsed stack: how much of each toast behind the front one shows, and
// how much smaller it gets.
const PEEK = 14;
const SHRINK = 0.05;

export class RayToaster extends RayElement {
  static properties = {
    position: { type: String, reflect: true, default: "bottom-end" },
    limit: { type: Number, default: 5 },
    // Toasts visible in the collapsed stack (the rest wait, invisible).
    visible: { type: Number, default: 3 },
    // Always expanded: a list instead of a stack.
    expand: { type: Boolean, reflect: true },
    gap: { type: Number, default: 12 },
  };
  static styles = [toasterStyles];
  static template = `<slot></slot>`;

  #expanded = false;
  #ro = null;
  #swipe = null;

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("popover", "manual");
    this.setAttribute("role", "region");
    this.setAttribute("aria-label", this.getAttribute("aria-label") ?? "Notifications");
    this.setAttribute("aria-live", "polite");
    // Every time: moving into an overlay and back disconnects and reconnects it.
    this._outside ??= (e) => {
      if (this.#expanded && e.pointerType !== "mouse" && !e.composedPath().includes(this)) this.expanded = false;
    };
    document.addEventListener("pointerdown", this._outside, true);
    if (this._wired) return;
    this._wired = true;
    // Mouse: expand while hovered. Keyboard: while focus is inside.
    this.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") this.expanded = true; });
    this.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && !this.contains(document.activeElement)) this.expanded = false; });
    this.addEventListener("focusin", () => { this.expanded = true; });
    this.addEventListener("focusout", (e) => { if (!this.contains(e.relatedTarget) && !this.matches(":hover")) this.expanded = false; });
    // Touch (no hover): a tap on the collapsed stack expands it — the tap is
    // consumed so it does not press the front toast's buttons —, a tap
    // outside collapses it. A horizontal swipe dismisses a toast.
    this.addEventListener("pointerdown", (e) => this._pointerDown(e));
    this.addEventListener("click", (e) => {
      if (this._consumeClick) {
        this._consumeClick = false;
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    // Next frame: layout() resizes the cards behind (they fill their clipped
    // box), which inside the observer's callback would be a resize loop.
    this.#ro = new ResizeObserver(() => {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        this.layout();
      });
    });
    this.shadowRoot.querySelector("slot").addEventListener("slotchange", () => {
      // Observe each card (its natural height): the host's height is set by
      // layout() for toasts behind, and observing it would loop.
      for (const el of this.children) {
        const card = el.shadowRoot?.querySelector(".card");
        if (card) this.#ro.observe(card);
      }
      this.layout();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this._outside, true);
  }

  /** Whether the stack is spread out (hover, focus, tap, or the expand attribute). */
  get expanded() {
    return this.#expanded || Boolean(this.expand);
  }

  set expanded(on) {
    on = Boolean(on);
    if (on === this.#expanded) return;
    this.#expanded = on;
    this.toggleAttribute("data-expanded", on);
    pauseAll(this, on);
    this.layout();
  }

  update() {
    this.layout();
  }

  /** The toasts, newest first. */
  get toasts() {
    return [...this.children].filter((el) => el.localName === "ray-notification" && !el._leaving).reverse();
  }

  /** Places every toast: a stack (collapsed) or a list (expanded). */
  layout() {
    const toasts = this.toasts;
    const top = (this.position ?? "bottom-end").startsWith("top");
    const dir = top ? 1 : -1;
    const open = this.expanded;
    // Before measuring: a card behind fills its clipped box, so only the
    // front's height (collapsed) or no one's (expanded) is clipped.
    toasts.forEach((el, i) => {
      el.toggleAttribute("data-behind", !open && i > 0);
      el.toggleAttribute("data-front", i === 0);
    });
    const heights = toasts.map((el) => el.shadowRoot?.querySelector(".card")?.offsetHeight || el.offsetHeight || 0);
    const front = heights[0] ?? 0;
    const shown = Math.min(toasts.length, Math.max(1, this.visible ?? 3));
    let offset = 0;
    toasts.forEach((el, i) => {
      el.style.zIndex = String(toasts.length - i);
      const swiping = el === this.#swipe?.el;
      const swipe = swiping ? ` translateX(${this.#swipe.dx}px)` : "";
      if (open) {
        el.style.transform = `translateY(${dir * offset}px)${swipe}`;
        if (!swiping) el.style.opacity = "";
        offset += heights[i] + (this.gap ?? 12);
      } else {
        const scale = 1 - i * SHRINK;
        // Behind toasts: the front one's height, so the stack edges line up.
        el.style.transform = `translateY(${dir * i * PEEK}px) scale(${scale})${swipe}`;
        if (!swiping) el.style.opacity = i < shown ? "" : "0";
      }
      el.style.height = !open && i > 0 && front ? `${front}px` : "";
      el.style.overflow = !open && i > 0 ? "hidden" : "";
      el.inert = !open && i >= shown;
    });
    const total = open ? Math.max(0, offset - (this.gap ?? 12)) : front + (shown - 1) * PEEK;
    this.style.height = `${Math.max(0, total)}px`;
  }

  _pointerDown(e) {
    if (e.pointerType !== "mouse" && !this.expanded && this.toasts.length > 1) {
      this.expanded = true;
      this._consumeClick = true;
      return;
    }
    const el = e.target.closest?.("ray-notification");
    if (!el || e.button > 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let moving = false;
    const move = (ev) => {
      const dx = ev.clientX - start.x;
      if (!moving) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(ev.clientY - start.y)) return;
        moving = true;
        el.setAttribute("data-swiping", "");
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          // Not an active pointer (synthetic events): the window listeners still track it.
        }
      }
      this.#swipe = { el, dx };
      el.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 240));
      this.layout();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeAttribute("data-swiping");
      const dx = this.#swipe?.el === el ? this.#swipe.dx : 0;
      this.#swipe = null;
      if (moving) this._consumeClick = true;
      if (Math.abs(dx) > 64) {
        el._swipeOut = Math.sign(dx);
        hideNotification(el.dataset.notificationId);
      } else {
        el.style.opacity = "";
        this.layout();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  /** Brings the stack above everything else in the top layer (e.g. a dialog opened later). */
  raise() {
    if (this.matches(":popover-open")) this.hidePopover();
    if (this.children.length) this.showPopover();
    this.layout();
  }
}

define("ray-notification", RayNotification);
define("ray-toaster", RayToaster);

// --- notify() ---------------------------------------------------------------

let counter = 0;
const timers = new Map();

function toaster() {
  let t = document.querySelector("ray-toaster");
  if (!t) {
    t = document.createElement("ray-toaster");
    document.body.append(t);
    rehome();
  }
  return t;
}

function find(id) {
  return document.querySelector(`ray-notification[data-notification-id="${CSS.escape(id)}"]`);
}

function apply(el, o) {
  if ("action" in o) {
    el.actions = o.action ? [o.action] : undefined;
    el._onActions = o.action ? [o.action] : [];
  }
  if ("actions" in o) {
    el.actions = o.actions ?? undefined;
    el._onActions = o.actions ?? [];
  }
  if ("title" in o) el.label = o.title ?? "";
  if ("message" in o) setMessage(el, o.message);
  if ("color" in o) el.color = o.color || undefined;
  if ("icon" in o) el.icon = o.icon || undefined;
  if ("loading" in o) el.loading = Boolean(o.loading);
  if ("closable" in o) el.hideClose = o.closable === false;
  if ("withBorder" in o) el.withBorder = Boolean(o.withBorder);
}

/** The message: replaces the default slot's content, keeps slotted icon and action nodes. */
function setMessage(el, text) {
  for (const n of [...el.childNodes]) if (!(n instanceof Element && n.hasAttribute("slot"))) n.remove();
  if (text) el.prepend(String(text));
}

function schedule(id, ms) {
  clearTimeout(timers.get(id)?.handle);
  if (!ms) {
    timers.delete(id);
    return;
  }
  const entry = { remaining: ms, start: Date.now(), handle: setTimeout(() => hideNotification(id), ms) };
  timers.set(id, entry);
}

function pauseAll(t, pause) {
  for (const el of t.querySelectorAll("ray-notification[data-notification-id]")) {
    const id = el.dataset.notificationId;
    const entry = timers.get(id);
    if (!entry) continue;
    if (pause) {
      clearTimeout(entry.handle);
      entry.remaining -= Date.now() - entry.start;
    } else {
      schedule(id, Math.max(entry.remaining, 1000));
    }
  }
}

/**
 * Shows a notification. Returns its id.
 * @param {{ id?: string, title?: string, message?: string, color?: string, loading?: boolean,
 *           autoClose?: number | false, closable?: boolean, withBorder?: boolean,
 *           action?: NotifyAction, actions?: NotifyAction[], onClose?: () => void }} options
 *   autoClose: ms (default 4000; false = stays). action: a button (e.g. "Undo") that runs onClick and closes it;
 *   actions: several. A NotifyAction is { label, icon?, variant?, color?, name?, onClick? }; icon: a name or a
 *   node (a <ray-pulse>); variant: a button variant (default "default"), e.g. "filled" for the main answer;
 *   name: adds the part "action-<name>". message replaces the text only: slotted icon and action nodes stay.
 */
export function notify(options = {}) {
  const id = options.id ?? `n${++counter}`;
  if (find(id)) {
    updateNotification(id, options);
    return id;
  }
  const t = toaster();
  const el = document.createElement("ray-notification");
  el.dataset.notificationId = id;
  apply(el, { closable: true, withBorder: true, ...options });
  el.addEventListener("ray-close", () => hideNotification(id));
  el.addEventListener("ray-action", (e) => {
    el._onActions?.[e.detail?.index ?? 0]?.onClick?.();
    hideNotification(id);
  });
  el._onClose = options.onClose;
  t.append(el);
  // Enter from the edge: start off-screen, then let layout() transition it in.
  const top = (t.position ?? "bottom-end").startsWith("top");
  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.transform = `translateY(${top ? -100 : 100}%)`;
  el.getBoundingClientRect();
  el.style.transition = "";
  el.style.opacity = "";
  // Over the limit: drop the oldest.
  const all = t.querySelectorAll("ray-notification[data-notification-id]");
  for (let i = 0; i < all.length - (t.limit ?? 5); i++) hideNotification(all[i].dataset.notificationId);
  t.raise();
  schedule(id, options.loading ? 0 : (options.autoClose ?? 4000));
  return id;
}

/** Changes a shown notification (e.g. loading -> done). Restarts its auto-close. */
export function updateNotification(id, options = {}) {
  const el = find(id);
  if (!el) return false;
  apply(el, options);
  if ("onClose" in options) el._onClose = options.onClose;
  const loading = "loading" in options ? options.loading : el.loading;
  schedule(id, loading ? 0 : (options.autoClose ?? 4000));
  return true;
}

export function hideNotification(id) {
  const el = find(id);
  schedule(id, 0);
  if (!el || el._leaving) return Boolean(el);
  const t = el.parentElement;
  const done = () => {
    el.remove();
    el._onClose?.();
    if (t instanceof RayToaster) {
      if (!t.children.length && t.matches(":popover-open")) t.hidePopover();
      if (t.toasts.length < 2) t.expanded = false;
      t.layout();
    }
  };
  if (!motionAllowed(el)) {
    done();
    return true;
  }
  // Leave (sideways after a swipe, else towards the edge) while the others
  // move into place.
  el._leaving = true;
  el.style.pointerEvents = "none";
  if (t instanceof RayToaster) t.layout();
  const from = el.style.transform || "none";
  const top = t instanceof RayToaster && (t.position ?? "").startsWith("top");
  const to = el._swipeOut ? `${from} translateX(${el._swipeOut * 110}%)` : `${from} translateY(${top ? -40 : 40}%)`;
  const exit = play(el, [{ opacity: Number(el.style.opacity || 1), transform: from }, { opacity: 0, transform: to }], { speed: "fast" });
  exit.finished.then(done);
  return true;
}

export function clearNotifications() {
  for (const el of document.querySelectorAll("ray-notification[data-notification-id]")) hideNotification(el.dataset.notificationId);
}
