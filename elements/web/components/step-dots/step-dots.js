// <ray-step-dots>: a row of dots, one per step: done (filled), the current
// one (a filled pill), the rest (empty). A compact progress for rounds,
// onboarding pages or a quiz. Not interactive: the carousel's dots are
// buttons, these are a progressbar.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const styles = css`
  :host {
    --_dot: 0.5rem;
    display: block;
  }
  :host([size="xs"]) { --_dot: 0.3125rem; }
  :host([size="md"]) { --_dot: 0.625rem; }
  :host([size="lg"]) { --_dot: 0.75rem; }
  :host([size="xl"]) { --_dot: 1rem; }
  .dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: var(--_justify, center);
    gap: calc(var(--_dot) * 0.75);
  }
  :host([align="start"]) { --_justify: flex-start; }
  :host([align="end"]) { --_justify: flex-end; }
  .dot {
    flex: none;
    width: var(--_dot);
    height: var(--_dot);
    box-sizing: border-box;
    border-radius: var(--ray-radius-full);
    border: 1.5px solid color-mix(in srgb, var(--ray-foreground) 28%, transparent);
    transition: width var(--ray-duration-base) var(--ray-easing-standard), background-color var(--ray-duration-base) var(--ray-easing-standard), border-color var(--ray-duration-base) var(--ray-easing-standard);
  }
  .dot[data-state="done"] { background: var(--_filled); border-color: var(--_filled); }
  .dot[data-state="current"] { width: calc(var(--_dot) * 2.5); background: var(--_filled); border-color: var(--_filled); }
`;

export class RayStepDots extends RayElement {
  static properties = {
    count: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    color: { type: String, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    align: { type: String, reflect: true, default: "center" },
    label: { type: String },
    valueText: { type: String, attribute: "value-text" },
    doneText: { type: String, attribute: "done-text" },
  };
  static styles = [styles];
  static template = `<div class="dots" part="dots" aria-hidden="true"></div>`;

  constructor() {
    super();
    this.internals = this.attachInternals();
    this.internals.role = "progressbar";
  }

  update() {
    applyColor(this, this.color);
    const count = Math.max(0, Math.floor(this.count || 0));
    // value: the current step, 0-based; count (or more) is all done.
    const value = Math.min(count, Math.max(0, Math.floor(this.value || 0)));
    const box = this.$(".dots");
    while (box.children.length < count) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("part", "dot");
      box.append(dot);
    }
    while (box.children.length > count) box.lastElementChild.remove();
    [...box.children].forEach((dot, i) => {
      dot.dataset.state = i < value ? "done" : i === value ? "current" : "todo";
    });

    // The announced text: value-text / done-text ({step}: the current one,
    // 1-based; {count}), numbers in the element's language; English otherwise.
    const lang = this.closest("[lang]")?.lang || undefined;
    const n = (x) => new Intl.NumberFormat(lang).format(x);
    const fill = (tpl) => tpl.replaceAll("{step}", n(Math.min(value + 1, count))).replaceAll("{count}", n(count));
    const done = count > 0 && value >= count;
    const text = done
      ? fill(this.doneText ?? this.valueText ?? "{count} of {count}, done")
      : fill(this.valueText ?? `${this.label || "Step"} {step} of {count}`);
    const i = this.internals;
    i.ariaLabel = this.label || this.getAttribute("aria-label") || "Steps";
    i.ariaValueMin = "0";
    i.ariaValueMax = String(count);
    i.ariaValueNow = String(value);
    i.ariaValueText = count === 0 ? null : text;
  }
}

define("ray-step-dots", RayStepDots);
