// <ray-theme-toggle>: cycles the document theme system -> light -> dark.

import { RayElement, css, define, getTheme, setTheme, onThemeChange } from "../../core/core.js";

const ORDER = ["system", "light", "dark"];
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" };

// Icon of each theme (from the icon registry).
const ICONS = { system: "monitor", light: "sun", dark: "moon" };

const styles = css`
  :host {
    display: inline-flex;
    --_size: var(--ray-control-height-sm);
  }
  :host([size="xs"]) { --_size: var(--ray-control-height-xs); }
  :host([size="md"]) { --_size: var(--ray-control-height-md); }
  :host([size="lg"]) { --_size: var(--ray-control-height-lg); }
  :host([size="xl"]) { --_size: var(--ray-control-height-xl); }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_size);
    height: var(--_size);
    padding: 0;
    color: var(--ray-foreground);
    background: transparent;
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    cursor: pointer;
    transition: background var(--ray-duration-fast) var(--ray-easing-standard);
  }
  button:hover { background: var(--ray-accent); }
  .icon svg { width: calc(var(--_size) * 0.55); height: calc(var(--_size) * 0.55); }
`;

export class RayThemeToggle extends RayElement {
  static properties = {
    size: { type: String, reflect: true, default: "sm" },
  };
  static styles = [styles];
  static delegatesFocus = true;
  static template = `<button part="button" class="focus-ring" type="button"><span class="icon" data-ray-icon="monitor" aria-hidden="true"></span></button>`;

  connectedCallback() {
    super.connectedCallback();
    this._button = this.$("button");
    this._onClick = () => {
      const next = ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length];
      setTheme(next);
    };
    this._button.addEventListener("click", this._onClick);
    this._stop = onThemeChange(() => this.requestUpdate());
    this._paint();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._button.removeEventListener("click", this._onClick);
    this._stop?.();
  }

  update() {
    this._paint();
  }

  _paint() {
    const theme = getTheme();
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    this.$(".icon").setAttribute("data-ray-icon", ICONS[theme]);
    this.paintIcons(this._button);
    this._button.setAttribute("aria-label", `${LABEL[theme]} (switch to ${next})`);
    this._button.title = LABEL[theme];
  }
}

define("ray-theme-toggle", RayThemeToggle);
