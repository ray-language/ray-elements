// <ray-timeline> + <ray-timeline-item>: events in order along a line
// (Mantine's Timeline): activity, history, a deploy's stages. Items up to
// `active` are reached: a filled bullet and a colored line. A bullet is a
// dot, an icon, or anything in the bullet slot (an avatar).

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const timelineStyles = css`
  :host { display: block; --_bullet: 1.25rem; --_line: 2px; }
  :host([hidden]) { display: none; }
  .list { display: flex; flex-direction: column; }
`;

const itemStyles = css`
  :host {
    position: relative;
    display: grid;
    grid-template-columns: var(--_bullet) minmax(0, 1fr);
    column-gap: var(--ray-space-3);
    padding-bottom: var(--ray-space-6);
  }
  :host([hidden]) { display: none; }
  :host([data-last]) { padding-bottom: 0; }
  /* The line at the end: end, or left/right as sides of the screen (the
     grid's columns follow the writing direction). */
  :host([data-align="end"]), :host([data-align="right"]:dir(ltr)), :host([data-align="left"]:dir(rtl)) {
    grid-template-columns: minmax(0, 1fr) var(--_bullet);
    text-align: end;
  }
  :host([data-align="end"]) .bullet-col, :host([data-align="right"]:dir(ltr)) .bullet-col, :host([data-align="left"]:dir(rtl)) .bullet-col { grid-column: 2; grid-row: 1; }
  :host([data-align="end"]) .body, :host([data-align="right"]:dir(ltr)) .body, :host([data-align="left"]:dir(rtl)) .body { grid-column: 1; grid-row: 1; }
  .bullet-col { position: relative; display: flex; justify-content: center; }
  .bullet {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: var(--_bullet);
    height: var(--_bullet);
    color: var(--ray-muted-foreground);
    background: var(--ray-background);
    border: var(--_line) solid var(--ray-border);
    border-radius: 50%;
    --ray-icon-size: calc(var(--_bullet) * 0.6);
    --ray-icon-stroke: 2.25;
  }
  :host([data-reached]) .bullet { color: var(--_contrast); background: var(--_filled); border-color: var(--_filled); }
  :host([data-has-bullet]) .bullet { border: 0; background: none; overflow: visible; }
  .line {
    position: absolute;
    top: var(--_bullet);
    bottom: calc(-1 * var(--ray-space-6));
    left: calc(50% - var(--_line) / 2); /* physical */
    width: 0;
    border-left: var(--_line) var(--_line-style, solid) var(--ray-border); /* physical */
  }
  :host([data-last]) .line { display: none; }
  :host([data-line-reached]) .line { border-left-color: var(--_filled); } /* physical */
  :host([line-variant="dashed"]) .line { --_line-style: dashed; }
  :host([line-variant="dotted"]) .line { --_line-style: dotted; }
  .body { min-width: 0; padding-top: calc((var(--_bullet) - 1.4em) / 2); }
  .title { display: block; font-weight: var(--ray-font-weight-medium); line-height: 1.4; }
  .title:empty { display: none; }
  .content { font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); }
  .content ::slotted(*) { margin-block: var(--ray-space-1) 0; }
  .time { display: block; margin-top: var(--ray-space-1); font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); opacity: 0.85; }
  .time:empty { display: none; }
`;

export class RayTimeline extends RayElement {
  static properties = {
    active: { type: Number, reflect: true, default: -1 },
    align: { type: String, reflect: true, default: "start" },
    bulletSize: { type: String, attribute: "bullet-size" },
    lineWidth: { type: Number, attribute: "line-width" },
    color: { type: String, reflect: true },
    reverseActive: { type: Boolean, reflect: true, attribute: "reverse-active" },
  };
  static styles = [timelineStyles];
  static template = `<div class="list" part="list"><slot></slot></div>`;

  constructor() {
    super();
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "list");
  }

  /** The items, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === "ray-timeline-item");
  }

  update() {
    const items = this.items;
    const n = items.length;
    const active = this.active ?? -1;
    if (this.bulletSize) this.style.setProperty("--_bullet", /^\d+(\.\d+)?$/.test(this.bulletSize) ? `${this.bulletSize}px` : this.bulletSize);
    else this.style.removeProperty("--_bullet");
    if (this.lineWidth) this.style.setProperty("--_line", `${this.lineWidth}px`);
    else this.style.removeProperty("--_line");
    applyColor(this, this.color);
    items.forEach((item, i) => {
      // reverse-active: reached from the end (the latest event at the top).
      const k = this.reverseActive ? n - 1 - i : i;
      item.toggleAttribute("data-reached", active >= 0 && k <= active);
      item.toggleAttribute("data-line-reached", active >= 0 && (this.reverseActive ? k <= active && k > 0 : k < active));
      item.toggleAttribute("data-last", i === n - 1);
      item.setAttribute("data-align", ["end", "left", "right"].includes(this.align) ? this.align : "start");
    });
  }
}

export class RayTimelineItem extends RayElement {
  static properties = {
    label: { type: String },
    time: { type: String },
    icon: { type: String },
    color: { type: String, reflect: true },
    lineVariant: { type: String, reflect: true, attribute: "line-variant", default: "solid" },
  };
  static styles = [itemStyles];
  static template = `
    <div class="bullet-col"><span class="bullet" part="bullet"><span class="icon" data-ray-icon=""></span><slot name="bullet"></slot></span><span class="line" part="line"></span></div>
    <div class="body" part="body"><span class="title" part="title"></span><div class="content"><slot></slot></div><span class="time" part="time"></span></div>`;

  constructor() {
    super();
    const slot = this.$('slot[name="bullet"]');
    slot.addEventListener("slotchange", () => this.toggleAttribute("data-has-bullet", slot.assignedElements().length > 0));
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "listitem");
  }

  update() {
    this.$(".title").textContent = this.label ?? "";
    this.$(".time").textContent = this.time ?? "";
    this.$(".icon").setAttribute("data-ray-icon", this.icon ?? "");
    this.paintIcons();
    // Its own color, else the timeline's (inherited custom properties).
    if (this.color) applyColor(this, this.color);
    else for (const p of [...this.style]) if (p.startsWith("--_")) this.style.removeProperty(p);
  }
}

define("ray-timeline-item", RayTimelineItem);
define("ray-timeline", RayTimeline);
