// <ray-theme-toggle>: cycles the document theme system -> light -> dark.

import { RayElement, css, define, getTheme, setTheme, onThemeChange } from "../../core/core.js";

const ORDER = ["system", "light", "dark"];
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" };

const ICONS = {
  system: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
  light: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  dark: `<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>`,
};

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
  svg {
    width: 55%;
    height: 55%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export class RayThemeToggle extends RayElement {
  static properties = {
    size: { type: String, reflect: true, default: "sm" },
  };
  static styles = [styles];
  static delegatesFocus = true;
  static template = `<button part="button" class="focus-ring" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"></svg></button>`;

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
    this._button.removeEventListener("click", this._onClick);
    this._stop?.();
  }

  update() {
    this._paint();
  }

  _paint() {
    const theme = getTheme();
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    this.$("svg").innerHTML = ICONS[theme];
    this._button.setAttribute("aria-label", `${LABEL[theme]} (switch to ${next})`);
    this._button.title = LABEL[theme];
  }
}

define("ray-theme-toggle", RayThemeToggle);
