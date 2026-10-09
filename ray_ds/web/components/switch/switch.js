// <ray-switch>: an on/off toggle. Same API as <ray-checkbox> (checked,
// value, name, label…); announced as a switch.

import { css, define } from "../../core/core.js";
import { RayCheckbox, checkTemplate } from "../checkbox/checkbox.js";

const styles = css`
  :host {
    --_r: var(--ray-radius-full);
    --_iw: calc(var(--_s) * 1.9);
  }
  .indicator {
    position: relative;
    justify-content: flex-start;
    background: var(--ray-muted);
    border-color: var(--ray-input);
  }
  .thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    width: calc(var(--_s) - 6px);
    height: calc(var(--_s) - 6px);
    background: var(--ray-white);
    border: 1px solid var(--ray-border);
    border-radius: var(--_r);
    box-shadow: var(--ray-shadow-xs);
    transform: translateY(-50%);
    transition: left var(--ray-duration-base) var(--ray-easing-standard);
  }
  .control:checked + .indicator { background: var(--_filled); border-color: var(--_filled); }
  /* The thumb takes the text color of the filled shade: white on dark fills,
     black on light ones (yellow, or "dark" in the dark scheme). */
  .control:checked + .indicator .thumb { left: calc(100% - var(--_s) + 4px); border-color: transparent; background: var(--_contrast); }
  /* Disabled: a muted track (gray when on, like a disabled checkbox) and a
     plain thumb that stays visible on it, on its side. */
  .control:disabled + .indicator .thumb { background: var(--ray-background); border-color: var(--ray-border); box-shadow: none; }
`;

export class RaySwitch extends RayCheckbox {
  static styles = [...RayCheckbox.styles, styles];
  static template = checkTemplate(`<span class="indicator" part="track" aria-hidden="true"><span class="thumb" part="thumb"></span></span>`, `role="switch"`);
}

define("ray-switch", RaySwitch);
