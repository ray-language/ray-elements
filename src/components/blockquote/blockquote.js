// <ray-blockquote>: a quotation set apart from the text (Mantine's
// Blockquote): a colored edge, a quote mark on it and the attribution
// below. The content goes into a real <blockquote>, so it is announced as
// one; `href` (the source's URL) becomes its cite attribute.
//
//   <ray-blockquote cite="— Grace Hopper" color="teal">
//     The most dangerous phrase in the language is "We've always done it this way."
//   </ray-blockquote>
//
// Variants: light (tinted, the default), outline (the edge only) and
// filled (solid color, for a pull quote in a dark band).

import { RayElement, css, define } from "../../core/core.js";
import { applyColor } from "../../core/styles.js";

const RADII = ["xs", "sm", "md", "lg", "xl"];

const styles = css`
  :host { display: block; --_fs: var(--ray-font-size-md); --_icon: 1.75rem; --_p: var(--ray-space-md); --_edge: 3px; }
  :host([size="sm"]) { --_fs: var(--ray-font-size-sm); --_icon: 1.5rem; }
  :host([size="lg"]) { --_fs: var(--ray-font-size-lg); --_icon: 2.25rem; }
  :host([hide-edge]) { --_edge: 0px; }
  figure { position: relative; margin: 0; }
  /* Room for the mark, so it does not cover what is above or beside. */
  :host([data-icon]) figure { padding-block-start: calc(var(--_icon) / 2); padding-inline-start: calc(var(--_icon) / 2); }
  blockquote {
    margin: 0;
    padding: var(--_p) calc(var(--_p) * 1.25);
    font-size: var(--_fs);
    line-height: var(--ray-line-height-lg, 1.6);
    color: var(--ray-foreground);
    background: var(--_light);
    border-inline-start: var(--_edge) solid var(--_filled);
    border-radius: var(--_radius, var(--ray-radius-md));
  }
  :host([variant="outline"]) blockquote { background: transparent; border: 1px solid var(--ray-border); border-inline-start: var(--_edge) solid var(--_filled); }
  :host([variant="outline"][hide-edge]) blockquote { border-inline-start-width: 1px; border-inline-start-color: var(--ray-border); }
  :host([variant="filled"]) blockquote { color: var(--_contrast); background: var(--_filled); border-inline-start-color: transparent; }
  ::slotted(p) { margin: 0 0 var(--ray-space-2); }
  ::slotted(p:last-of-type) { margin-bottom: 0; }

  /* The quote mark: a disc on the box's top-start corner. */
  .icon {
    position: absolute;
    top: 0;
    inset-inline-start: 0;
    display: grid;
    place-items: center;
    width: var(--_icon);
    height: var(--_icon);
    color: var(--_filled);
    background: var(--ray-background);
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--ray-border);
    --ray-icon-size: calc(var(--_icon) * 0.5);
  }
  .icon[hidden] { display: none; }

  .cite {
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    margin-top: var(--ray-space-2);
    padding-inline-start: calc(var(--_edge) + var(--_p) * 1.25);
    font-size: var(--ray-font-size-sm);
    font-style: normal;
    color: var(--ray-muted-foreground);
  }
  .cite:not([data-filled]) { display: none; }
`;

export class RayBlockquote extends RayElement {
  static properties = {
    cite: { type: String },
    href: { type: String },
    color: { type: String, reflect: true },
    variant: { type: String, reflect: true, default: "light" },
    icon: { type: String, default: "quote" },
    padding: { type: String, reflect: true },
    hideEdge: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "md" },
    radius: { type: String, reflect: true },
  };
  static styles = [styles];
  static template = `
    <figure part="figure">
      <span class="icon" part="icon" aria-hidden="true"><slot name="icon"><span data-ray-icon="quote"></span></slot></span>
      <blockquote part="quote"><slot></slot></blockquote>
      <figcaption class="cite" part="cite"><slot name="cite"><cite class="cite-text"></cite></slot></figcaption>
    </figure>`;

  constructor() {
    super();
    for (const name of ["cite", "icon"]) {
      this.$(`slot[name="${name}"]`).addEventListener("slotchange", () => this.requestUpdate());
    }
  }

  update() {
    applyColor(this.$("figure"), this.color);
    const quote = this.$("blockquote");
    if (this.href) quote.setAttribute("cite", this.href);
    else quote.removeAttribute("cite");
    // The quote mark: the icon slot, a registry name, or none.
    const slotted = this.querySelector(':scope > [slot="icon"]');
    const name = this.icon === "none" ? "" : this.icon || "quote";
    const mark = this.$('slot[name="icon"] > span');
    if (mark.dataset.rayIcon !== name) {
      mark.dataset.rayIcon = name;
      this.paintIcons(this.$(".icon"));
    }
    const shown = Boolean(slotted || name);
    this.$(".icon").hidden = !shown;
    this.toggleAttribute("data-icon", shown);
    // The attribution: the cite slot, else the cite text.
    this.$(".cite-text").textContent = this.cite ?? "";
    const hasCite = Boolean(this.querySelector(':scope > [slot="cite"]') || this.cite);
    this.$(".cite").toggleAttribute("data-filled", hasCite);
    const pad = this.padding;
    if (pad) this.style.setProperty("--_p", RADII.includes(pad) ? `var(--ray-space-${pad})` : /^\d+(\.\d+)?$/.test(pad) ? `${pad}px` : pad);
    else this.style.removeProperty("--_p");
    const r = this.radius;
    if (r) this.style.setProperty("--_radius", RADII.includes(r) ? `var(--ray-radius-${r})` : r === "none" ? "0" : r);
    else this.style.removeProperty("--_radius");
  }
}

define("ray-blockquote", RayBlockquote);
