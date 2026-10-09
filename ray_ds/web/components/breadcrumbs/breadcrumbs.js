// <ray-breadcrumbs> + <ray-breadcrumb>: where a page sits (Mantine's
// Breadcrumbs, the WAI-ARIA breadcrumb pattern): a labelled nav of links,
// the last one the current page (aria-current="page").
//
// separator: any text ("/", "›", "·") or "chevron" (an icon). max-items
// collapses the middle of a long path into a "…" button that expands it.

import { RayElement, css, define } from "../../core/core.js";

const trailStyles = css`
  :host { display: block; min-width: 0; }
  :host([hidden]) { display: none; }
  ol { display: flex; flex-wrap: wrap; align-items: center; gap: 0; margin: 0; padding: 0; list-style: none; }
`;

const itemStyles = css`
  :host { display: inline-flex; align-items: center; min-width: 0; font-size: var(--_fs, var(--ray-font-size-sm)); }
  :host([hidden]), :host([data-collapsed]) { display: none; }
  .sep {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--ray-space-2);
    color: var(--ray-muted-foreground);
    user-select: none;
  }
  .sep svg { width: 0.9em; height: 0.9em; }
  :host([data-first]) .sep.before { display: none; }
  .more, .after { display: none; }
  :host([data-after-more]) .more, :host([data-after-more]) .after { display: inline-flex; }
  .more {
    align-items: center;
    justify-content: center;
    min-width: 1.75rem;
    height: 1.5rem;
    padding: 0 0.25rem;
    font: inherit;
    letter-spacing: 0.1em;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .more:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .more:focus-visible, .link:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  .link {
    display: inline-flex;
    align-items: center;
    gap: var(--ray-space-1);
    min-width: 0;
    max-width: var(--ray-breadcrumb-max, 16rem);
    color: var(--ray-muted-foreground);
    text-decoration: none;
    border-radius: var(--ray-radius-xs);
    --ray-icon-size: 1em;
  }
  .text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  a.link:hover { color: var(--ray-foreground); text-decoration: underline; text-underline-offset: 0.2em; }
  :host([data-current]) .link { color: var(--ray-foreground); font-weight: var(--ray-font-weight-medium); }
`;

export class RayBreadcrumbs extends RayElement {
  static properties = {
    separator: { type: String, default: "/" },
    maxItems: { type: Number, attribute: "max-items" },
    label: { type: String, default: "Breadcrumb" },
    size: { type: String, reflect: true, default: "sm" },
  };
  static styles = [trailStyles];
  static template = `<nav part="nav"><ol part="list"><slot></slot></ol></nav>`;

  #expanded = false;

  constructor() {
    super();
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
    this.addEventListener("ray-breadcrumbs-expand", (e) => {
      e.stopPropagation();
      this.expand();
    });
  }

  /** The crumbs, in order. */
  get items() {
    return [...this.children].filter((el) => el.localName === "ray-breadcrumb");
  }

  /** Shows every crumb of a collapsed path. */
  expand() {
    this.#expanded = true;
    this.requestUpdate();
    // Focus moves to the first crumb that was hidden.
    queueMicrotask(() => this.items[1]?.focus());
  }

  update() {
    this.$("nav").setAttribute("aria-label", this.label || "Breadcrumb");
    const sizes = { xs: "var(--ray-font-size-xs)", sm: "var(--ray-font-size-sm)", md: "var(--ray-font-size-md)", lg: "var(--ray-font-size-lg)" };
    this.style.setProperty("--_fs", sizes[this.size] ?? sizes.sm);
    const items = this.items;
    const explicit = items.some((i) => i.current);
    const max = this.maxItems ?? 0;
    // Collapsed: the first crumb, "…", then the last (max - 1).
    const collapse = !this.#expanded && max >= 2 && items.length > max;
    const hiddenUntil = collapse ? items.length - (max - 1) : 0;
    items.forEach((item, i) => {
      item.toggleAttribute("data-first", i === 0);
      item.toggleAttribute("data-current", explicit ? Boolean(item.current) : i === items.length - 1);
      item.toggleAttribute("data-collapsed", collapse && i > 0 && i < hiddenUntil);
      item.toggleAttribute("data-after-more", collapse && i === hiddenUntil);
      item._setSeparator(this.separator || "/");
    });
  }
}

export class RayBreadcrumb extends RayElement {
  static properties = {
    href: { type: String, reflect: true },
    current: { type: Boolean, reflect: true },
  };
  static styles = [itemStyles];
  static delegatesFocus = true;
  static template = `<span class="sep before" part="separator" aria-hidden="true"></span><button class="more" type="button" part="more" aria-label="Show the whole path">…</button><span class="sep after" aria-hidden="true"></span><span class="slot-host"></span>`;

  #tag = "";
  #sep = "";

  static get observedAttributes() {
    return [...super.observedAttributes, "data-current"];
  }

  attributeChangedCallback(attr, old, value) {
    if (attr === "data-current") return this.requestUpdate();
    super.attributeChangedCallback(attr, old, value);
  }

  constructor() {
    super();
    this.setAttribute("role", "listitem");
    this.$(".more").addEventListener("click", () => this.dispatchEvent(new CustomEvent("ray-breadcrumbs-expand", { bubbles: true })));
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute("role", "listitem");
  }

  /** Protected: the separator the trail draws before this crumb. */
  _setSeparator(sep) {
    if (sep === this.#sep) return;
    this.#sep = sep;
    for (const el of this.shadowRoot.querySelectorAll(".sep")) {
      if (sep === "chevron") el.innerHTML = `<span data-ray-icon="chevron-right"></span>`;
      else el.textContent = sep;
    }
    this.paintIcons();
  }

  update() {
    const current = this.hasAttribute("data-current");
    // The current page and a crumb without href are text, the others links.
    const tag = this.href && !current ? "a" : "span";
    if (tag !== this.#tag) {
      this.#tag = tag;
      this.$(".slot-host").innerHTML = `<${tag} class="link" part="link"><slot name="icon"></slot><span class="text"><slot></slot></span></${tag}>`;
    }
    const link = this.$(".link");
    if (tag === "a") link.setAttribute("href", this.href);
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

define("ray-breadcrumb", RayBreadcrumb);
define("ray-breadcrumbs", RayBreadcrumbs);
