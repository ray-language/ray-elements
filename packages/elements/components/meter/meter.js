// <ray-meter>: an audio level meter (a mixer's channel strip): peak and RMS
// in dB, colored by zone, a peak hold line and a clip mark at the top of the
// bar, one bar per channel. Fed by setLevels() on every animation frame: it writes a few CSS
// variables and nothing else, so 60 updates a second cost no render.
//
//   const meter = document.querySelector("ray-meter");
//   function frame() {
//     meter.setLevels([peakL, peakR], [rmsL, rmsR]);   // dB: 20 * Math.log10(amplitude)
//     requestAnimationFrame(frame);
//   }

import { RayElement, css, define, defineStrings } from "../../core/core.js";

// The texts it writes, in English (setStrings translates them; one per line: the tools read them).
const STRINGS = {
  "meter.label": "Level",
  "meter.value": "{value} dB",
  "meter.silent": "Silence",
};
defineStrings(STRINGS);

const styles = css`
  :host {
    display: inline-flex;
    gap: var(--ray-space-1);
    height: var(--ray-meter-length, 12rem);
    min-height: 0;
    --_w: 0.375rem;
    --_low: var(--ray-meter-low, var(--ray-green-filled));
    --_mid: var(--ray-meter-mid, var(--ray-yellow-filled));
    --_high: var(--ray-meter-high, var(--ray-red-filled));
  }
  :host([hidden]) { display: none; }
  :host([size="xs"]) { --_w: 0.25rem; }
  :host([size="md"]) { --_w: 0.5rem; }
  :host([size="lg"]) { --_w: 0.75rem; }
  :host([orientation="horizontal"]) { display: flex; flex-direction: column; width: 100%; height: auto; }
  /* --ray-meter-inset: room at both ends of the bars, so a meter as tall as a
     vertical ray-slider lines up with its marks (half the slider's thumb). */
  .channels { display: flex; gap: 2px; min-height: 0; padding-block: var(--ray-meter-inset, 0); }
  :host([orientation="horizontal"]) .channels { flex-direction: column; padding-block: 0; padding-inline: var(--ray-meter-inset, 0); }
  .channel { display: flex; width: var(--_w); }
  :host([orientation="horizontal"]) .channel { width: auto; height: var(--_w); }
  .track {
    position: relative;
    flex: 1;
    overflow: hidden;
    border-radius: 1px;
    background: var(--ray-muted);
    --_zones: linear-gradient(to top, var(--_low) var(--_warn), var(--_mid) var(--_warn) var(--_danger), var(--_high) var(--_danger)); /* physical */
  }
  :host([orientation="horizontal"]) .track { --_zones: linear-gradient(to right, var(--_low) var(--_warn), var(--_mid) var(--_warn) var(--_danger), var(--_high) var(--_danger)); } /* physical */
  :host([orientation="horizontal"]:dir(rtl)) .track { --_zones: linear-gradient(to left, var(--_low) var(--_warn), var(--_mid) var(--_warn) var(--_danger), var(--_high) var(--_danger)); } /* physical */
  .peak, .rms { position: absolute; inset: 0; background: var(--_zones); }
  .peak { opacity: 0.45; clip-path: inset(calc(100% - var(--_p, 0%)) 0 0 0); }
  .rms { clip-path: inset(calc(100% - var(--_r, 0%)) 0 0 0); }
  :host([orientation="horizontal"]) .peak { clip-path: inset(0 calc(100% - var(--_p, 0%)) 0 0); } /* physical */
  :host([orientation="horizontal"]) .rms { clip-path: inset(0 calc(100% - var(--_r, 0%)) 0 0); } /* physical */
  :host([orientation="horizontal"]:dir(rtl)) .peak { clip-path: inset(0 0 0 calc(100% - var(--_p, 0%))); } /* physical */
  :host([orientation="horizontal"]:dir(rtl)) .rms { clip-path: inset(0 0 0 calc(100% - var(--_r, 0%))); } /* physical */
  /* Clipped: a red band at the loud end of the bar, until a click on it or resetClip(). */
  .channel[data-clipped] { cursor: pointer; }
  .channel[data-clipped] .track::after { content: ""; position: absolute; inset-inline: 0; top: 0; height: 3px; background: var(--_high); } /* physical */
  :host([orientation="horizontal"]) .channel[data-clipped] .track::after { inset-inline: auto; inset-block: 0; inset-inline-end: 0; width: 3px; height: auto; }
  .hold { position: absolute; inset-inline: 0; bottom: var(--_h, 0%); height: 2px; background: var(--ray-foreground); opacity: 0.8; } /* physical */
  .hold[hidden] { display: none; }
  :host([orientation="horizontal"]) .hold { inset-inline: auto; inset-block: 0; bottom: 0; inset-inline-start: var(--_h, 0%); width: 2px; height: auto; } /* physical */
  .scale { position: relative; min-width: 1.75rem; font-size: 0.625rem; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); }
  .scale:empty { display: none; }
  /* Vertical: the labels sit before the bars (on the left), aligned against
     them so the numbers line up, level with the bars. */
  :host(:not([orientation="horizontal"])) .scale { order: -1; margin-block: var(--ray-meter-inset, 0); }
  :host([orientation="horizontal"]) .scale { min-width: 0; height: 0.875rem; margin-inline: var(--ray-meter-inset, 0); }
  .tick { position: absolute; inset-inline-end: 0; bottom: var(--_at); transform: translateY(50%); direction: ltr; unicode-bidi: isolate; white-space: nowrap; } /* physical */
  :host([orientation="horizontal"]) .tick { bottom: auto; top: 0; inset-inline-end: auto; inset-inline-start: var(--_at); transform: translateX(-50%); }
  :host([orientation="horizontal"]:dir(rtl)) .tick { transform: translateX(50%); }
`;

const SCALE = [6, 0, -6, -12, -24, -36, -48, -60];

export class RayMeter extends RayElement {
  static properties = {
    min: { type: Number, default: -60 },
    max: { type: Number, default: 6 },
    warn: { type: Number, default: -12 },
    danger: { type: Number, default: -3 },
    clip: { type: Number, default: 0 },
    channels: { type: Number, default: 1 },
    orientation: { type: String, reflect: true, default: "vertical" },
    size: { type: String, reflect: true, default: "sm" },
    hold: { type: Number, default: 1500 },
    falloff: { type: Number, default: 24 },
    scale: { type: Boolean, reflect: true },
    marks: { attribute: false },
    label: { type: String, string: "meter.label" },
  };
  static styles = [styles];
  static template = `<div class="channels" part="channels" role="meter"></div><div class="scale" part="scale" aria-hidden="true"></div>`;

  /** Per channel: the shown peak and RMS (dB), the hold and when it was set. */
  #peak = [];
  #rms = [];
  #hold = [];
  #holdAt = [];
  #clipped = [];
  #last = 0;
  #spoken = 0;
  #bars = [];

  constructor() {
    super();
    // A clipped bar: a click clears its mark (resetClip() from script or a key).
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.closest?.(".channel[data-clipped]")) this.resetClip();
    });
  }

  /** A channel went over `clip` since the last reset. */
  get clipped() {
    return this.#clipped.some(Boolean);
  }

  /**
   * The levels now, in dB (-Infinity for silence), one per channel (a number
   * for every channel). RMS is optional: without it, one solid bar.
   * Call it on every animation frame: a lower peak falls at `falloff` dB/s.
   * @param {number | number[]} peak
   * @param {number | number[]} [rms]
   */
  setLevels(peak, rms = undefined) {
    const n = this.#channelCount();
    const at = (v, i) => (Array.isArray(v) ? v[i] ?? v[v.length - 1] : v);
    const now = performance.now();
    const dt = this.#last ? Math.min(1, (now - this.#last) / 1000) : 0;
    this.#last = now;
    const fall = (this.falloff ?? 0) * dt;
    for (let i = 0; i < n; i++) {
      const p = Number(at(peak, i) ?? -Infinity);
      const r = rms === undefined ? p : Number(at(rms, i) ?? -Infinity);
      // Ballistics: up at once, down no faster than the falloff.
      this.#peak[i] = fall > 0 && p < (this.#peak[i] ?? -Infinity) ? Math.max(p, this.#peak[i] - fall) : p;
      this.#rms[i] = fall > 0 && r < (this.#rms[i] ?? -Infinity) ? Math.max(r, this.#rms[i] - fall) : r;
      if (this.hold > 0 && (!(this.#hold[i] >= p) || now - this.#holdAt[i] > this.hold)) {
        this.#hold[i] = p;
        this.#holdAt[i] = now;
      }
      if (p >= (this.clip ?? 0) && !this.#clipped[i]) {
        this.#clipped[i] = true;
        this.toggleAttribute("data-clipped", true);
        this.emit("ray-clip", { channel: i });
      }
    }
    this.#paint();
    // The accessible value: a few times a second, not every frame.
    if (now - this.#spoken > 250) {
      this.#spoken = now;
      this.#speak();
    }
  }

  /** Clears the levels, the hold lines and the clip marks. */
  reset() {
    this.#peak = [];
    this.#rms = [];
    this.#hold = [];
    this.#holdAt = [];
    this.#last = 0;
    this.resetClip();
    this.#paint();
    this.#speak();
  }

  /** Clears the clip marks. */
  resetClip() {
    this.#clipped = [];
    this.removeAttribute("data-clipped");
    this.#paint();
  }

  update(changed) {
    const n = this.#channelCount();
    if (this.#bars.length !== n) this.#build(n);
    const min = this.min ?? -60;
    const max = this.max ?? 6;
    const box = this.$(".channels");
    for (const b of this.#bars) {
      b.track.style.setProperty("--_warn", `${this.#pct(this.warn, min, max)}%`);
      b.track.style.setProperty("--_danger", `${this.#pct(this.danger, min, max)}%`);
    }
    box.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.label);
    box.setAttribute("aria-valuemin", String(min));
    box.setAttribute("aria-valuemax", String(max));
    if (changed.has("scale") || changed.has("marks") || changed.has("min") || changed.has("max") || !this._scaled) this.#renderScale(min, max);
    this.#paint();
    this.#speak();
  }

  #channelCount() {
    return Math.max(1, Math.min(32, Math.round(this.channels ?? 1)));
  }

  #build(n) {
    const box = this.$(".channels");
    box.replaceChildren();
    this.#bars = [];
    for (let i = 0; i < n; i++) {
      const channel = document.createElement("div");
      channel.className = "channel";
      channel.setAttribute("part", "channel");
      channel.innerHTML = `<div class="track" part="track"><div class="peak" part="peak"></div><div class="rms" part="rms"></div><div class="hold" part="hold" hidden></div></div>`;
      box.append(channel);
      this.#bars.push({ channel, track: channel.querySelector(".track"), hold: channel.querySelector(".hold") });
    }
  }

  #pct(db, min, max) {
    if (!(db > min)) return 0;
    return Math.min(100, ((db - min) / (max - min || 1)) * 100);
  }

  #paint() {
    const min = this.min ?? -60;
    const max = this.max ?? 6;
    this.#bars.forEach((b, i) => {
      const s = b.track.style;
      s.setProperty("--_p", `${this.#pct(this.#peak[i], min, max)}%`);
      s.setProperty("--_r", `${this.#pct(this.#rms[i], min, max)}%`);
      const h = this.#pct(this.#hold[i], min, max);
      b.hold.hidden = !(this.hold > 0) || h <= 0;
      s.setProperty("--_h", `${h}%`);
      b.channel.toggleAttribute("data-clipped", Boolean(this.#clipped[i]));
    });
  }

  #speak() {
    const box = this.$(".channels");
    const min = this.min ?? -60;
    const max = this.max ?? 6;
    const loudest = Math.max(-Infinity, ...this.#peak.slice(0, this.#bars.length).map((v) => (Number.isNaN(v) ? -Infinity : v)));
    const now = Math.min(max, Math.max(min, loudest));
    box.setAttribute("aria-valuenow", String(Math.round(now)));
    box.setAttribute("aria-valuetext", loudest > min ? this.t("meter.value", { value: Math.round(loudest) }) : this.t("meter.silent"));
  }

  #renderScale(min, max) {
    this._scaled = true;
    const box = this.$(".scale");
    box.replaceChildren();
    const marks = Array.isArray(this.marks) ? this.marks : this.scale ? SCALE : [];
    for (const m of marks) {
      const v = typeof m === "number" ? m : m.value;
      if (v < min || v > max) continue;
      const tick = document.createElement("span");
      tick.className = "tick";
      tick.setAttribute("part", "tick");
      tick.style.setProperty("--_at", `${this.#pct(v, min, max)}%`);
      tick.textContent = typeof m === "number" ? String(m) : (m.label ?? String(m.value));
      box.append(tick);
    }
  }
}

define("ray-meter", RayMeter);
