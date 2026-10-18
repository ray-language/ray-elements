// <ray-carousel>: slides in a scroll-snap viewport (Mantine's Carousel,
// shadcn's Carousel). Native scrolling does the moving — touch swipe,
// trackpads, scroll wheels — and the component adds previous/next controls,
// indicators, keyboard, loop and autoplay on top.
//
// Any child element is a slide. With several slides in view (slide-size
// "50%", "18rem"…) the positions are the distinct snap points the viewport
// can reach: `index`, the indicators and next()/prev() count those.

import { RayElement, css, define } from "../../core/core.js";
import { motionAllowed } from "../../core/motion.js";

const styles = css`
  :host {
    display: block;
    position: relative;
    /* Inside grid/flex parents: never wider than them (the slides scroll). */
    min-width: 0;
    --_size: 100%;
    --_gap: var(--ray-space-4);
  }
  :host([orientation="vertical"]) { height: 20rem; }
  .root { position: relative; display: flex; flex-direction: column; gap: var(--ray-space-3); height: 100%; }
  .stage { position: relative; flex: 1; min-width: 0; min-height: 0; }
  .viewport {
    display: flex;
    gap: var(--_gap);
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    border-radius: var(--ray-radius-default);
    outline: none;
  }
  .viewport::-webkit-scrollbar { display: none; }
  .viewport:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  :host([orientation="vertical"]) .viewport {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    overscroll-behavior-y: contain;
  }
  ::slotted(*) {
    flex: 0 0 var(--_size);
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    scroll-snap-align: start;
  }
  :host([align="center"]) ::slotted(*) { scroll-snap-align: center; }

  .control {
    position: absolute;
    top: 50%;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-full);
    box-shadow: var(--ray-shadow-sm);
    cursor: pointer;
    transform: translateY(-50%);
    transition: opacity var(--ray-duration-fast) var(--ray-easing-standard), background var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .control:hover:not(:disabled) { background: var(--ray-accent); }
  .control:disabled { opacity: 0; pointer-events: none; }
  .control svg { width: 1rem; height: 1rem; }
  .prev { left: var(--ray-space-2); }
  .next { right: var(--ray-space-2); }
  :host([orientation="vertical"]) .control { top: auto; left: 50%; transform: translateX(-50%) rotate(90deg); }
  :host([orientation="vertical"]) .prev { top: var(--ray-space-2); }
  :host([orientation="vertical"]) .next { bottom: var(--ray-space-2); }
  :host([hide-controls]) .control { display: none; }

  .footer { display: flex; align-items: center; justify-content: center; gap: var(--ray-space-2); min-height: 1.5rem; }
  .footer[hidden] { display: none; }
  .indicators { display: flex; align-items: center; gap: 0.125rem; }
  :host([hide-indicators]) .indicators { display: none; }
  .dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 24px: the minimum target (WCAG 2.5.8); the dot drawn inside is smaller. */
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: none;
    border: 0;
    border-radius: var(--ray-radius-full);
    cursor: pointer;
  }
  .dot::before {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--ray-radius-full);
    background: color-mix(in srgb, var(--ray-foreground) 25%, transparent);
    transition: width var(--ray-duration-base) var(--ray-easing-standard), background var(--ray-duration-base) var(--ray-easing-standard);
  }
  .dot:hover::before { background: color-mix(in srgb, var(--ray-foreground) 45%, transparent); }
  .dot[aria-current="true"] { width: 1.75rem; }
  .dot[aria-current="true"]::before { width: 1.25rem; background: var(--ray-primary); }
  .dot:focus-visible, .play:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 1px; }
  .play {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: none;
    border: 0;
    border-radius: var(--ray-radius-full);
    cursor: pointer;
  }
  .play:hover { color: var(--ray-foreground); background: var(--ray-accent); }
  .play[hidden] { display: none; }
  .play svg { width: 0.875rem; height: 0.875rem; }
`;

const PAUSE_ICON = `<span data-ray-icon="ui.pause" aria-hidden="true"></span>`;

const reduced = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

export class RayCarousel extends RayElement {
  static properties = {
    index: { type: Number, default: 0 },
    label: { type: String, default: "Carousel" },
    slideSize: { type: String, attribute: "slide-size" },
    slideGap: { type: String, attribute: "slide-gap" },
    align: { type: String, reflect: true, default: "start" },
    orientation: { type: String, reflect: true, default: "horizontal" },
    loop: { type: Boolean, reflect: true },
    autoplay: { type: Number, default: 0 },
    hideControls: { type: Boolean, reflect: true },
    hideIndicators: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="root" part="root" role="region" aria-roledescription="carousel">
      <div class="stage">
        <div class="viewport" part="viewport" tabindex="0" aria-live="polite"><slot></slot></div>
        <button class="control prev" part="previous" type="button" aria-label="Previous slide"><span data-ray-icon="ui.previous" aria-hidden="true"></span></button>
        <button class="control next" part="next" type="button" aria-label="Next slide"><span data-ray-icon="ui.next" aria-hidden="true"></span></button>
      </div>
      <div class="footer" part="footer">
        <button class="play" part="play" type="button" hidden></button>
        <div class="indicators" part="indicators"></div>
      </div>
    </div>`;

  #snaps = [0];
  #scrollTimer = 0;
  #autoTimer = 0;
  #hover = false;
  #focus = false;
  // Reduced motion: autoplay starts paused (the play button starts it).
  #userPaused = Boolean(reduced?.matches);
  #resize = null;

  constructor() {
    super();
    this.viewport = this.$(".viewport");
    this._slot = this.$("slot");
    this._slot.addEventListener("slotchange", () => this._measure());
    this.viewport.addEventListener("scroll", () => {
      // No rAF in some hosts: settle the position with a short timeout.
      clearTimeout(this.#scrollTimer);
      this.#scrollTimer = setTimeout(() => this._track(), 50);
    }, { passive: true });
    this.viewport.addEventListener("scrollend", () => this._track());
    this.$(".prev").addEventListener("click", () => this.prev());
    this.$(".next").addEventListener("click", () => this.next());
    this.$(".play").addEventListener("click", () => {
      this.#userPaused = !this.#userPaused;
      this._schedule();
    });
    this.$(".indicators").addEventListener("click", (e) => {
      const dot = e.target.closest?.(".dot");
      if (dot) this.goTo(Number(dot.dataset.index));
    });
    this.addEventListener("keydown", (e) => this._onKey(e));
    this.addEventListener("pointerenter", () => { this.#hover = true; this._schedule(); });
    this.addEventListener("pointerleave", () => { this.#hover = false; this._schedule(); });
    this.addEventListener("focusin", () => { this.#focus = true; this._schedule(); });
    this.addEventListener("focusout", (e) => {
      if (!this.contains(e.relatedTarget) && !this.shadowRoot.contains(e.relatedTarget)) {
        this.#focus = false;
        this._schedule();
      }
    });
    this._onVisibility = () => this._schedule();
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this._onVisibility);
    if (typeof ResizeObserver === "function" && !this.#resize) {
      this.#resize = new ResizeObserver(() => this._measure());
      this.#resize.observe(this.viewport);
    }
    queueMicrotask(() => this._measure());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this._onVisibility);
    this.#resize?.disconnect();
    this.#resize = null;
    clearTimeout(this.#autoTimer);
    clearTimeout(this.#scrollTimer);
  }

  /** The slide elements (the assigned children). */
  get slides() {
    return this._slot.assignedElements();
  }

  /** Number of positions (snap points): one per slide unless several fit in view. */
  get count() {
    return this.#snaps.length;
  }

  update(changed) {
    const root = this.$(".root");
    root.setAttribute("aria-label", this.label || "Carousel");
    if (this.slideSize) this.style.setProperty("--_size", this.slideSize);
    else this.style.removeProperty("--_size");
    if (this.slideGap) this.style.setProperty("--_gap", this.slideGap);
    else this.style.removeProperty("--_gap");
    if (changed.has("slideSize") || changed.has("slideGap") || changed.has("align") || changed.has("orientation")) {
      queueMicrotask(() => this._measure());
    }
    if (changed.has("index") && !this._tracking) this._go(this.index, false);
    if (changed.has("autoplay")) this._schedule();
    this._paint();
  }

  /** Goes to the next position (wraps with `loop`). */
  next() {
    const i = this._current();
    if (i < this.count - 1) this.goTo(i + 1);
    else if (this.loop) this.goTo(0);
  }

  /** Goes to the previous position (wraps with `loop`). */
  prev() {
    const i = this._current();
    if (i > 0) this.goTo(i - 1);
    else if (this.loop) this.goTo(this.count - 1);
  }

  /** Scrolls to position `index` (smoothly unless `instant` or reduced motion). */
  /** Moves to a position (not scrollTo(): that is Element.prototype.scrollTo). */
  goTo(index, { instant = false } = {}) {
    this._go(index, true, instant);
  }

  // --- internals ------------------------------------------------------------

  _vertical() {
    return this.orientation === "vertical";
  }

  _current() {
    return Math.min(Math.max(0, this.index ?? 0), this.count - 1);
  }

  // The snap points: each slide's aligned position, clamped to what the
  // viewport can reach, without duplicates.
  _measure() {
    const vp = this.viewport;
    const v = this._vertical();
    const slides = this.slides;
    const total = slides.length;
    slides.forEach((s, i) => {
      if (!s.hasAttribute("role")) s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      if (!s.hasAttribute("aria-label") || s.dataset.rayAutoLabel !== undefined) {
        s.setAttribute("aria-label", `${i + 1} of ${total}`);
        s.dataset.rayAutoLabel = "";
      }
    });
    const vr = vp.getBoundingClientRect();
    const size = v ? vp.clientHeight : vp.clientWidth;
    const max = Math.max(0, v ? vp.scrollHeight - vp.clientHeight : vp.scrollWidth - vp.clientWidth);
    const scroll = v ? vp.scrollTop : vp.scrollLeft;
    const snaps = [];
    for (const s of slides) {
      const r = s.getBoundingClientRect();
      const start = (v ? r.top - vr.top : r.left - vr.left) + scroll;
      const length = v ? r.height : r.width;
      const pos = this.align === "center" ? start - (size - length) / 2 : start;
      const clamped = Math.round(Math.min(max, Math.max(0, pos)));
      // A position only a sliver past the previous one (the end clamp, gaps)
      // is the same stop: keep the later, so the end stays reachable.
      if (snaps.length && clamped - snaps[snaps.length - 1] < Math.max(2, length / 3)) snaps[snaps.length - 1] = clamped;
      else snaps.push(clamped);
    }
    this.#snaps = snaps.length ? snaps : [0];
    this._renderDots();
    this._track();
  }

  _renderDots() {
    const box = this.$(".indicators");
    const n = this.count;
    if (box.children.length !== n) {
      box.replaceChildren(
        ...Array.from({ length: n }, (_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "dot";
          b.setAttribute("part", "indicator");
          b.dataset.index = String(i);
          b.setAttribute("aria-label", `Go to slide ${i + 1}`);
          return b;
        }),
      );
    }
    this.$(".footer").hidden = (n < 2 || this.hideIndicators) && !(this.autoplay > 0);
  }

  // The position closest to the current scroll offset.
  _track() {
    const vp = this.viewport;
    const scroll = this._vertical() ? vp.scrollTop : vp.scrollLeft;
    let best = 0;
    for (let i = 1; i < this.#snaps.length; i++) {
      if (Math.abs(this.#snaps[i] - scroll) < Math.abs(this.#snaps[best] - scroll)) best = i;
    }
    this._setIndex(best);
    this._paint();
  }

  _setIndex(i) {
    if (i === (this.index ?? 0)) return;
    this._tracking = true;
    this.commitProperty("index", i);
    queueMicrotask(() => { this._tracking = false; });
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _go(index, user, instant = false) {
    if (!Number.isFinite(index)) return;
    const i = Math.min(Math.max(0, Math.round(index)), this.count - 1);
    const pos = this.#snaps[i] ?? 0;
    const smooth = user && !instant && !reduced?.matches && motionAllowed(this);
    const opts = { behavior: smooth ? "smooth" : "instant" };
    if (this._vertical()) this.viewport.scrollTo({ top: pos, ...opts });
    else this.viewport.scrollTo({ left: pos, ...opts });
    this._setIndex(i);
    this._paint();
    this._schedule();
  }

  _paint() {
    const i = this._current();
    const n = this.count;
    this.$(".prev").disabled = !this.loop && i <= 0;
    this.$(".next").disabled = !this.loop && i >= n - 1;
    for (const d of this.$(".indicators").children) {
      if (Number(d.dataset.index) === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    }
    this._paintPlay();
    this.$(".footer").hidden = (n < 2 || this.hideIndicators) && !(this.autoplay > 0);
  }

  // Autoplay runs unless paused by the user (or by reduced motion), hovered,
  // focused, or the page is hidden.
  _running() {
    if (!(this.autoplay > 0) || this.count < 2 || this.#userPaused) return false;
    return !this.#hover && !this.#focus && document.visibilityState !== "hidden";
  }

  _schedule() {
    clearTimeout(this.#autoTimer);
    this._paintPlay();
    if (!this._running()) return;
    this.#autoTimer = setTimeout(() => {
      const i = this._current();
      this.goTo(i < this.count - 1 ? i + 1 : 0);
    }, this.autoplay);
  }

  // The pause/play button reflects the user's choice (hover and focus pause
  // only for a moment); the live region is off while slides move by themselves.
  _paintPlay() {
    const play = this.$(".play");
    const auto = this.autoplay > 0;
    play.hidden = !auto;
    const paused = this.#userPaused;
    if (auto && play.dataset.state !== (paused ? "paused" : "playing")) {
      play.dataset.state = paused ? "paused" : "playing";
      play.innerHTML = paused ? `<span data-ray-icon="ui.play" aria-hidden="true"></span>` : PAUSE_ICON;
      this.paintIcons(play);
      play.setAttribute("aria-label", paused ? "Start autoplay" : "Pause autoplay");
    }
    this.viewport.setAttribute("aria-live", auto && this._running() ? "off" : "polite");
  }

  _onKey(e) {
    const t = e.composedPath()[0];
    if (t && (t.isContentEditable || ["input", "textarea", "select"].includes(t.localName))) return;
    const v = this._vertical();
    const back = v ? "ArrowUp" : "ArrowLeft";
    const fwd = v ? "ArrowDown" : "ArrowRight";
    if (e.key === fwd) {
      e.preventDefault();
      this.next();
    } else if (e.key === back) {
      e.preventDefault();
      this.prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      this.goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      this.goTo(this.count - 1);
    }
  }
}

define("ray-carousel", RayCarousel);
