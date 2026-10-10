// <ray-kbd>: a keyboard key. variant="default" is a raised keycap (thicker
// bottom edge); "filled" a flat muted chip and "outline" a flat chip with a
// border (shadcn's Kbd) — both lighter, for hints inside menus and buttons.

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    display: inline-block;
    vertical-align: baseline;
    --_fs: var(--ray-font-size-xs);
  }
  :host([size="xs"]) { --_fs: 0.625rem; }
  :host([size="md"]) { --_fs: var(--ray-font-size-sm); }
  :host([size="lg"]) { --_fs: var(--ray-font-size-md); }
  :host([size="xl"]) { --_fs: var(--ray-font-size-lg); }
  kbd {
    display: inline-block;
    min-width: 1.6em;
    padding: 0.125em 0.4em;
    font-family: var(--ray-font-mono);
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-bold);
    line-height: var(--ray-line-height-md);
    text-align: center;
    color: var(--ray-foreground);
    /* A keycap lit from above: the face, a slightly darker rim and a much
       darker bottom edge (its shadow) — in both schemes. In dark the face
       is the raised surface, lighter than the page, and the edge sits
       between the two: darker than the key, still visible on the page. */
    --_face: light-dark(var(--ray-muted), var(--ray-raised));
    background: var(--_face);
    border: 1px solid light-dark(color-mix(in srgb, var(--_face), black 12%), color-mix(in srgb, var(--_face) 82%, var(--ray-background)));
    border-bottom: 3px solid light-dark(color-mix(in srgb, var(--_face), black 24%), color-mix(in srgb, var(--_face) 62%, var(--ray-background)));
    border-radius: var(--ray-radius-sm);
    box-shadow: inset 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(255 255 255 / 0.08));
  }
  /* Flat variants: the same box height, quieter text. */
  :host([variant="filled"]) kbd, :host([variant="outline"]) kbd {
    padding: 0.125em 0.45em;
    font-family: var(--ray-font-sans);
    font-weight: var(--ray-font-weight-medium);
    color: var(--ray-muted-foreground);
    border-bottom-width: 1px;
    box-shadow: none;
  }
  :host([variant="filled"]) kbd { background: var(--ray-muted); border-color: transparent; }
  :host([variant="outline"]) kbd { background: transparent; border-color: var(--ray-border); }
`;

export class RayKbd extends RayElement {
  static properties = {
    size: { type: String, reflect: true, default: "sm" },
    variant: { type: String, reflect: true, default: "default" },
  };
  static styles = [styles];
  static template = `<kbd part="kbd"><slot></slot></kbd>`;
}

define("ray-kbd", RayKbd);
