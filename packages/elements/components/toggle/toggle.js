// <ray-toggle>: a two-state button (aria-pressed), like shadcn's Toggle — bold
// in a toolbar, "mute", "favorite". A RayButton, so sizes, radius, color,
// icons in the left/right slots and ray-button-group all work.
//
// The variant describes how "on" looks; "off" is always neutral, so the two
// states differ by more than color (WCAG 1.4.1):
//   subtle  — off: transparent; on: tinted fill (default)
//   outline — off: neutral border; on: colored border + tint
//   light   — off: muted fill; on: colored tint
//   filled  — off: neutral surface with border; on: solid color
//   raised  — off: a neutral key standing up; on: latched down and lit
// Button variants left out: default (no "on" look of its own), transparent
// (would change only the text color) and gradient (a second filled).

import { css, define } from "../../core/core.js";
import { RayButton } from "../button/button.js";

const styles = css`
  :host([square]) .button { width: var(--_h); padding: 0; }
  :host([square]) .label { font-size: calc(var(--_fs) * 1.15); }
  ::slotted(svg) { width: 1.15em; height: 1.15em; }

  /* Base of the drawn variants, at the specificity of one class so each
     variant's own off look below wins. */
  .button:where([data-toggle]:not([data-toggle="raised"])) { color: var(--ray-foreground); background: transparent; }
  .button[data-toggle] ::slotted(ray-icon), .button[data-toggle] ::slotted(svg) { opacity: 0.85; }
  .button[data-toggle][aria-pressed="true"] ::slotted(*) { opacity: 1; }

  /* subtle */
  .button[data-toggle="subtle"]:not([data-disabled]):hover { background: var(--ray-default-hover); }
  .button[data-toggle="subtle"][aria-pressed="true"] { background: var(--_light); color: var(--_light-color); }
  .button[data-toggle="subtle"][aria-pressed="true"]:not([data-disabled]):hover { background: var(--_light-hover); }

  /* outline */
  .button[data-toggle="outline"] { border-color: var(--ray-border); }
  .button[data-toggle="outline"]:not([data-disabled]):hover { background: var(--ray-default-hover); }
  .button[data-toggle="outline"][aria-pressed="true"] { border-color: color-mix(in srgb, var(--_outline) 65%, var(--ray-border)); background: var(--_light); color: var(--_light-color); }
  .button[data-toggle="outline"][aria-pressed="true"]:not([data-disabled]):hover { background: var(--_light-hover); }

  /* light */
  .button[data-toggle="light"] { background: var(--ray-muted); }
  .button[data-toggle="light"]:not([data-disabled]):hover { background: var(--ray-default-hover); }
  .button[data-toggle="light"][aria-pressed="true"] { background: var(--_light); color: var(--_light-color); }
  .button[data-toggle="light"][aria-pressed="true"]:not([data-disabled]):hover { background: var(--_light-hover); }

  /* filled */
  .button[data-toggle="filled"] { background: var(--ray-default); border-color: var(--ray-border); }
  .button[data-toggle="filled"]:not([data-disabled]):hover { background: var(--ray-default-hover); }
  .button[data-toggle="filled"][aria-pressed="true"] { background: var(--_filled); color: var(--_contrast); border-color: transparent; }
  .button[data-toggle="filled"][aria-pressed="true"]:not([data-disabled]):hover { background: var(--_filled-hover); }

  /* Disabled keeps showing its state, dimmed. */
  .button[data-toggle][data-disabled]:not([data-toggle="raised"]) { opacity: 0.5; }

  /* raised: off is an unlit neutral key (ray-kbd's colors) ... */
  .button[data-toggle="raised"]:not([aria-pressed="true"]) {
    --_face: var(--ray-raised);
    --_face-text: var(--ray-foreground);
    --_rim: light-dark(color-mix(in srgb, var(--_face), black 12%), color-mix(in srgb, var(--_face) 82%, var(--ray-background)));
    --_edge: light-dark(color-mix(in srgb, var(--_face), black 24%), color-mix(in srgb, var(--_face) 62%, var(--ray-background)));
    /* ray-kbd's top highlight: a strong one reads as an edge on top in dark. */
    box-shadow:
      0 var(--_depth) 0 var(--_edge),
      0 calc(var(--_depth) + 1px) 6px -1px rgb(0 0 0 / 0.28),
      inset 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.07));
  }
  /* ... and on stays down, lit in its color, like a latching switch. */
  .button[data-toggle="raised"][aria-pressed="true"]:not([data-disabled]) {
    transform: translateY(var(--_depth));
    /* Sunk: shaded under the top rim. In dark a touch deeper (a light
       shadow does not show on the color there); light keeps the original. */
    box-shadow:
      0 0 0 var(--_edge),
      inset 0 1px 3px light-dark(rgb(0 0 0 / 0.28), rgb(0 0 0 / 0.4));
    border-top-color: light-dark(var(--_rim), color-mix(in srgb, var(--_face), black 24%));
  }
`;

const VARIANTS = ["subtle", "outline", "light", "filled", "raised"];

export class RayToggle extends RayButton {
  static properties = {
    ...RayButton.properties,
    variant: { type: String, reflect: true, default: "subtle" },
    pressed: { type: Boolean, reflect: true },
    square: { type: Boolean, reflect: true },
    label: { type: String, reflect: true },
  };
  static styles = [...RayButton.styles, styles];

  #initial = null;

  constructor() {
    super();
    // Clicks reach the host after the inner button's own handler, which stops
    // them while disabled or loading.
    this.addEventListener("click", () => {
      if (this.disabled || this.loading || this._fieldsetDisabled) return;
      this.pressed = !this.pressed;
      this.emit("ray-change", { pressed: this.pressed });
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  connectedCallback() {
    this.#initial ??= this.hasAttribute("pressed");
    super.connectedCallback();
  }

  formResetCallback() {
    this.pressed = this.#initial ?? false;
  }

  update() {
    super.update();
    const el = this._el;
    const variant = VARIANTS.includes(this.variant) ? this.variant : "subtle";
    // raised reuses ray-button's key; the others are drawn here.
    el.dataset.variant = variant === "raised" ? "raised" : "toggle";
    el.dataset.toggle = variant;
    el.setAttribute("aria-pressed", String(Boolean(this.pressed)));
    if (this.label) {
      el.setAttribute("aria-label", this.label);
      el.title = this.label;
    }
    // Submitted like a checkbox: value (default "on") under name while pressed.
    this.internals.setFormValue(this.pressed && this.name ? (this.value ?? "on") : null);
  }
}

define("ray-toggle", RayToggle);
