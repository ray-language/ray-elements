// <ray-pagination>: page navigation (Mantine's Pagination). Previous/next,
// optional first/last, page numbers with ellipses. The number of items stays
// the same while moving through the pages, so the control does not jump.

import { RayElement, css, define } from "../../core/core.js";
import { applyColor, sizeStyles, radiusStyles, variantStyles } from "../../core/styles.js";

const styles = css`
  :host { display: block; }
  :host([hidden]) { display: none; }
  .list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ray-space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--_h);
    height: var(--_h);
    padding: 0 calc(var(--_px) * 0.35);
    font: inherit;
    font-size: var(--_fs);
    font-weight: var(--ray-font-weight-medium);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    border-radius: var(--_r);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .item:not([data-disabled]):active { transform: translateY(1px); }
  /* Disabled: the current page keeps its fill, dimmed. */
  .item[aria-current="page"]:disabled { opacity: 0.6; cursor: not-allowed; }
  .item svg { width: 1em; height: 1em; }
  .dots {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--_h);
    height: var(--_h);
    color: var(--ray-muted-foreground);
    font-size: var(--_fs);
  }
  .dots svg { width: 1em; height: 1em; }
`;

/**
 * The items to show: page numbers and "dots", Mantine's algorithm. Always
 * siblings * 2 + 3 + boundaries * 2 items when there are more pages than that.
 * @returns {(number | "dots")[]}
 */
export function paginationRange(total, value, siblings = 1, boundaries = 1) {
  total = Math.max(0, Math.floor(total || 0));
  if (total === 0) return [];
  const active = Math.min(Math.max(1, Math.floor(value || 1)), total);
  const range = (a, b) => (b < a ? [] : Array.from({ length: b - a + 1 }, (_, i) => a + i));
  const count = siblings * 2 + 3 + boundaries * 2;
  if (count >= total) return range(1, total);
  const left = Math.max(active - siblings, boundaries);
  const right = Math.min(active + siblings, total - boundaries);
  const leftDots = left > boundaries + 2;
  const rightDots = right < total - (boundaries + 1);
  if (!leftDots && rightDots) {
    const n = siblings * 2 + boundaries + 2;
    return [...range(1, n), "dots", ...range(total - boundaries + 1, total)];
  }
  if (leftDots && !rightDots) {
    const n = boundaries + 1 + siblings * 2;
    return [...range(1, boundaries), "dots", ...range(total - n, total)];
  }
  return [...range(1, boundaries), "dots", ...range(left, right), "dots", ...range(total - boundaries + 1, total)];
}

export class RayPagination extends RayElement {
  static properties = {
    total: { type: Number, default: 1 },
    value: { type: Number, default: 1 },
    siblings: { type: Number, default: 1 },
    boundaries: { type: Number, default: 1 },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    color: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    withEdges: { type: Boolean, reflect: true },
    hideControls: { type: Boolean, reflect: true },
    label: { type: String, default: "Pagination" },
  };
  static styles = [sizeStyles, radiusStyles, variantStyles, styles];
  static template = `<nav part="root"><ul class="list" part="list"></ul></nav>`;

  constructor() {
    super();
    this.$(".list").addEventListener("click", (e) => {
      const b = e.target.closest?.("button[data-page]");
      if (!b || b.disabled) return;
      this._go(Number(b.dataset.page));
    });
  }

  /** The current page, clamped to 1…total. */
  get page() {
    const total = Math.max(1, this.total || 1);
    return Math.min(Math.max(1, this.value || 1), total);
  }

  /** Goes to a page (clamped), firing change when it changes. */
  setPage(page) {
    this._go(page);
  }

  next() { this._go(this.page + 1); }
  previous() { this._go(this.page - 1); }
  first() { this._go(1); }
  last() { this._go(Math.max(1, this.total || 1)); }

  _go(page) {
    const total = Math.max(1, this.total || 1);
    const p = Math.min(Math.max(1, page), total);
    if (p === this.page || this.disabled) return;
    this.commitProperty("value", p);
    this.requestUpdate();
    this.dispatchEvent(new Event("change", { bubbles: true }));
    // Keep the focus on the activated page (the list is rebuilt).
    queueMicrotask(() => this.$(`button[data-page="${p}"][data-number]`)?.focus());
  }

  update() {
    this.$("nav").setAttribute("aria-label", this.label || "Pagination");
    const total = Math.max(0, this.total || 0);
    const page = this.page;
    const list = this.$(".list");
    const focused = this.shadowRoot.activeElement?.dataset?.role;
    const items = [];
    const control = (role, target, icon, label, off) => ({ kind: "control", role, target, icon, label, off });
    if (!this.hideControls) {
      if (this.withEdges) items.push(control("first", 1, "ui.first", "First page", page <= 1));
      items.push(control("previous", page - 1, "ui.previous", "Previous page", page <= 1));
    }
    for (const it of paginationRange(total, page, this.siblings ?? 1, this.boundaries ?? 1)) {
      items.push(it === "dots" ? { kind: "dots" } : { kind: "page", target: it });
    }
    if (!this.hideControls) {
      items.push(control("next", page + 1, "ui.next", "Next page", page >= total));
      if (this.withEdges) items.push(control("last", total, "ui.last", "Last page", page >= total));
    }
    list.replaceChildren(...items.map((it) => this._item(it, page)));
    this.paintIcons(list);
    // Prev/next keep the focus across re-renders (e.g. holding Enter).
    if (focused) this.$(`button[data-role="${focused}"]`)?.focus();
  }

  _item(it, page) {
    const li = document.createElement("li");
    if (it.kind === "dots") {
      li.innerHTML = `<span class="dots" part="dots" aria-hidden="true">…</span>`;
      return li;
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "item focus-ring";
    b.dataset.page = String(it.target);
    applyColor(b, this.color);
    if (it.kind === "page") {
      const active = it.target === page;
      b.dataset.number = "";
      b.setAttribute("part", active ? "item active" : "item");
      b.dataset.variant = active ? "filled" : "default";
      b.textContent = String(it.target);
      b.setAttribute("aria-label", `Page ${it.target}`);
      if (active) b.setAttribute("aria-current", "page");
      b.disabled = Boolean(this.disabled);
      if (!(active && b.disabled)) b.setAttribute("data-interactive", "");
    } else {
      b.dataset.role = it.role;
      b.setAttribute("part", `item control ${it.role}`);
      b.dataset.variant = "default";
      b.setAttribute("aria-label", it.label);
      b.innerHTML = `<span data-ray-icon="${it.icon}" aria-hidden="true"></span>`;
      b.disabled = Boolean(this.disabled || it.off);
      b.setAttribute("data-interactive", "");
    }
    b.toggleAttribute("data-disabled", b.disabled);
    li.append(b);
    return li;
  }
}

define("ray-pagination", RayPagination);
