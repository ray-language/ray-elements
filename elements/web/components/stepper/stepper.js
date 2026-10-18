// <ray-stepper> + <ray-step>: a task in steps (Mantine's Stepper): a
// wizard, a checkout, an onboarding. The stepper draws the steps (number
// or icon, label, description, connector) and shows the content of the
// active one; past the last step, the `completed` slot.
//
// `active` is the index; next() and prev() move it. With
// allow-step-select the user can go back to a completed step (and forward
// to any with `linear` off): change fires. A step can be loading, in error
// or skippable (an optional label).

import { RayElement, css, define, uid } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const stepperStyles = css`
  :host { display: block; --_icon: 2.25rem; }
  :host([hidden]) { display: none; }
  :host([size="sm"]) { --_icon: 1.75rem; }
  :host([size="lg"]) { --_icon: 2.75rem; }
  .steps { display: flex; align-items: flex-start; gap: var(--ray-space-2); margin: 0; padding: 0; list-style: none; }
  :host([orientation="vertical"]) { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--ray-space-6); }
  :host([orientation="vertical"]) .steps { flex-direction: column; gap: 0; }
  .step { display: flex; flex: 1 1 0; align-items: center; gap: var(--ray-space-2); min-width: 0; }
  .step:last-child { flex: 0 0 auto; }
  :host([orientation="vertical"]) .step { flex-direction: column; align-items: stretch; flex: none; }
  .head {
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    min-width: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    border-radius: var(--ray-radius-md);
  }
  button.head { cursor: pointer; }
  button.head:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 3px; }
  .indicator {
    flex: none;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: var(--_icon);
    height: var(--_icon);
    font-size: calc(var(--_icon) * 0.4);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ray-muted-foreground);
    background: var(--ray-muted);
    border: 2px solid var(--ray-muted);
    border-radius: 50%;
    transition: background-color var(--ray-duration-base), border-color var(--ray-duration-base), color var(--ray-duration-base);
    --ray-icon-size: calc(var(--_icon) * 0.5);
    --ray-icon-stroke: 2.5;
  }
  .step[data-state="active"] .indicator { color: var(--_light-color); background: var(--ray-background); border-color: var(--_filled); }
  .step[data-state="done"] .indicator { color: var(--_contrast); background: var(--_filled); border-color: var(--_filled); }
  .step[data-error] .indicator { color: #fff; background: var(--ray-red-filled); border-color: var(--ray-red-filled); }
  .spinner { width: 50%; height: 50%; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: ray-step-spin 0.8s linear infinite; }
  @keyframes ray-step-spin { to { rotate: 1turn; } }
  .text { display: grid; min-width: 0; }
  .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--ray-font-size-sm); font-weight: var(--ray-font-weight-medium); }
  .step[data-state="todo"] .label { color: var(--ray-muted-foreground); }
  .description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  .step[data-error] .description { color: var(--ray-destructive); }
  .description:empty { display: none; }
  .connector { flex: 1; min-width: var(--ray-space-4); height: 2px; border-radius: 1px; background: var(--ray-border); transition: background-color var(--ray-duration-base); }
  .step[data-state="done"] .connector { background: var(--_filled); }
  .step:last-child .connector { display: none; }
  :host([orientation="vertical"]) .connector { flex: none; width: 2px; min-width: 0; height: auto; min-height: var(--ray-space-6); margin: var(--ray-space-1) 0 var(--ray-space-1) calc(var(--_icon) / 2 - 1px); }
  /* Narrow (labels-below or a narrow stepper): the labels under the numbers. */
  :host([icon-position="top"]) .step { align-items: flex-start; }
  :host([icon-position="top"]) .head { flex-direction: column; align-items: center; text-align: center; gap: var(--ray-space-1); }
  :host([icon-position="top"]) .connector { margin-top: calc(var(--_icon) / 2 - 1px); }
  .content { padding-top: var(--ray-space-5); min-width: 0; }
  :host([orientation="vertical"]) .content { padding-top: 0; }
  ::slotted(ray-step:not([data-active])) { display: none; }
  .completed:not([data-show]) { display: none; }
  @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2s; } }
`;

const glyph = (name) => {
  const span = document.createElement("span");
  span.setAttribute("data-ray-icon", name);
  return span;
};

export class RayStepper extends RayElement {
  static properties = {
    active: { type: Number, reflect: true, default: 0 },
    orientation: { type: String, reflect: true, default: "horizontal" },
    iconPosition: { type: String, reflect: true, attribute: "icon-position", default: "left" },
    allowStepSelect: { type: Boolean, reflect: true, attribute: "allow-step-select" },
    linear: { type: Boolean, default: true },
    size: { type: String, reflect: true, default: "md" },
    color: { type: String, reflect: true },
    label: { type: String, default: "Progress" },
  };
  static styles = [stepperStyles];
  static template = `<ol class="steps" part="steps"></ol><div class="content" part="content"><slot></slot><div class="completed" part="completed"><slot name="completed"></slot></div></div>`;

  #id = uid("stepper");

  constructor() {
    super();
    this.$("slot:not([name])").addEventListener("slotchange", () => this.requestUpdate());
    this.$(".steps").addEventListener("click", (e) => {
      const head = e.target.closest?.("button.head");
      if (head) this._select(Number(head.dataset.index));
    });
  }

  /** The steps, in order. */
  get steps() {
    return [...this.children].filter((el) => el.localName === "ray-step");
  }

  /** Moves to the next step (past the last: the completed slot). */
  next() {
    this._go(Math.min((this.active ?? 0) + 1, this.steps.length));
  }

  /** Moves to the previous step. */
  prev() {
    this._go(Math.max((this.active ?? 0) - 1, 0));
  }

  _go(i) {
    if (i === this.active) return;
    this.active = i;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  _selectable(i) {
    const steps = this.steps;
    const active = this.active ?? 0;
    if (!this.allowStepSelect || i === active || i >= steps.length || steps[i].disabled) return false;
    return i < active || this.linear === false;
  }

  _select(i) {
    if (this._selectable(i)) this._go(i);
  }

  update() {
    applyColor(this, this.color);
    const steps = this.steps;
    const active = Math.max(0, Math.min(this.active ?? 0, steps.length));
    const list = this.$(".steps");
    list.setAttribute("aria-label", this.label || "Progress");
    // The steps are redrawn: keep the focus on the same step.
    const focused = this.shadowRoot.activeElement?.closest?.(".head")?.dataset.index;
    list.replaceChildren();
    steps.forEach((step, i) => {
      const state = i < active ? "done" : i === active ? "active" : "todo";
      const li = document.createElement("li");
      li.className = "step";
      li.dataset.state = state;
      li.toggleAttribute("data-error", Boolean(step.error));
      li.setAttribute("part", `step step-${state}`);
      const selectable = this._selectable(i);
      const head = document.createElement(selectable ? "button" : "div");
      head.className = "head";
      if (selectable) head.type = "button";
      head.dataset.index = String(i);
      if (state === "active") head.setAttribute("aria-current", "step");
      const indicator = document.createElement("span");
      indicator.className = "indicator";
      indicator.setAttribute("part", "indicator");
      indicator.setAttribute("aria-hidden", "true");
      if (step.loading) indicator.innerHTML = `<span class="spinner"></span>`;
      else if (step.error) indicator.append(glyph("close"));
      else if (state === "done") indicator.append(glyph(step.completedIcon || "ui.checked"));
      else if (step.icon) indicator.append(glyph(step.icon));
      else indicator.textContent = String(i + 1);
      const text = document.createElement("span");
      text.className = "text";
      const label = document.createElement("span");
      label.className = "label";
      label.setAttribute("part", "label");
      label.textContent = step.label ?? `Step ${i + 1}`;
      const desc = document.createElement("span");
      desc.className = "description";
      desc.setAttribute("part", "description");
      desc.textContent = step.error || step.description || "";
      // Read as "Step 2 of 4: Shipping, completed".
      const sr = document.createElement("span");
      sr.className = "sr";
      sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap";
      sr.textContent = `Step ${i + 1} of ${steps.length}: `;
      const status = document.createElement("span");
      status.style.cssText = sr.style.cssText;
      status.textContent = step.error ? ", error" : state === "done" ? ", completed" : state === "active" ? ", current" : "";
      label.prepend(sr);
      label.append(status);
      text.append(label, desc);
      head.append(indicator, text);
      const connector = document.createElement("span");
      connector.className = "connector";
      connector.setAttribute("part", "connector");
      connector.setAttribute("aria-hidden", "true");
      li.append(head, connector);
      list.append(li);
      step.toggleAttribute("data-active", i === active);
      step.id ||= `${this.#id}-${i}`;
    });
    this.paintIcons(list);
    if (focused !== undefined) {
      const again = list.querySelector(`button.head[data-index="${focused}"]`) ?? list.querySelector('[aria-current="step"]')?.closest("li")?.querySelector("button.head");
      again?.focus();
    }
    this.$(".completed").toggleAttribute("data-show", active >= steps.length && steps.length > 0);
  }
}

export class RayStep extends RayElement {
  static properties = {
    label: { type: String },
    description: { type: String },
    icon: { type: String },
    completedIcon: { type: String, attribute: "completed-icon" },
    loading: { type: Boolean, reflect: true },
    error: { type: String },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [css`:host { display: block; } :host([hidden]) { display: none; }`];
  static template = `<slot></slot>`;

  update() {
    // The stepper draws the steps: tell it.
    const stepper = this.parentElement;
    if (stepper?.localName === "ray-stepper") stepper.requestUpdate();
  }
}

define("ray-step", RayStep);
define("ray-stepper", RayStepper);
