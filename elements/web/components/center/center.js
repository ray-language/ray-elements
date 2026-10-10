// <ray-center>: its content centered on both axes (Mantine's Center). It
// fills its parent's width; give it a height (or let a flex/grid parent
// stretch it) to center vertically. `inline` makes it as wide as its content.

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }
  :host([inline]) { display: inline-flex; }
  :host([hidden]) { display: none; }
`;

export class RayCenter extends RayElement {
  static properties = {
    inline: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `<slot></slot>`;
}

define("ray-center", RayCenter);
