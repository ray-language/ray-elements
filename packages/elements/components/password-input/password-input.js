// <ray-password-input>: a password field with a button that shows or hides
// what was typed (Mantine's PasswordInput). A ray-input underneath: label,
// description, error, sizes, validation and forms work the same.
//
// The toggle keeps the caret and the focus in the field, says what it does
// (aria-label, aria-pressed) and fires ray-visibility-change.

import { css, define } from "../../core/core.js";
import { fieldTemplate } from "../../core/form.js";
import { RayInput } from "../input/input.js";

const styles = css`
  .toggle {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: max(1.5rem, calc(var(--_h) * 0.7));
    height: max(1.5rem, calc(var(--_h) * 0.7));
    margin-inline-end: calc(var(--_px) * 0.35);
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .toggle:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .toggle:disabled { cursor: not-allowed; opacity: 0.6; }
  .toggle svg { width: 1.1em; height: 1.1em; }
  /* Dots read better a little apart; typed text keeps the normal spacing. */
  .control[type="password"]:not(:placeholder-shown) { letter-spacing: 0.08em; }
`;

export class RayPasswordInput extends RayInput {
  static properties = {
    ...RayInput.properties,
    type: { type: String, reflect: false, default: "password" },
    visible: { type: Boolean, reflect: true },
    showLabel: { type: String, default: "Show password" },
    hideLabel: { type: String, default: "Hide password" },
  };
  static styles = [...RayInput.styles, styles];
  static template = fieldTemplate(
    `<input id="control" class="control" part="input" type="password" autocomplete="current-password" spellcheck="false" autocapitalize="off">` +
      `<button type="button" class="toggle focus-ring" part="toggle" aria-pressed="false"><span data-ray-icon="eye" aria-hidden="true"></span></button>`,
  );

  wire() {
    super.wire();
    const toggle = this.$(".toggle");
    // Keep the focus (and the caret) in the field when the pointer toggles.
    toggle.addEventListener("pointerdown", (e) => e.preventDefault());
    toggle.addEventListener("click", () => {
      this.visible = !this.visible;
      this.emit("ray-visibility-change", { visible: this.visible });
      if (this.shadowRoot.activeElement !== toggle) this.control.focus();
    });
  }

  update(changed) {
    // The type follows `visible` (a type set from outside is ignored).
    const want = this.visible ? "text" : "password";
    if (this.type !== want) this.commitProperty("type", want);
    super.update(changed);
    const toggle = this.$(".toggle");
    toggle.setAttribute("aria-pressed", String(Boolean(this.visible)));
    toggle.setAttribute("aria-label", this.visible ? this.hideLabel : this.showLabel);
    toggle.title = toggle.getAttribute("aria-label");
    toggle.disabled = this.effectivelyDisabled;
    const icon = toggle.firstElementChild;
    const name = this.visible ? "eye-off" : "eye";
    if (icon.dataset.rayIcon !== name) {
      icon.dataset.rayIcon = name;
      this.paintIcons(toggle);
    }
  }

  formResetCallback() {
    super.formResetCallback();
    this.visible = false;
  }
}

define("ray-password-input", RayPasswordInput);
