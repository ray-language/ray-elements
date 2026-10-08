// <ray-grid>: a responsive grid of its children.
//
// cols="1 sm:2 lg:4": a count, then counts from a width up (xs 36em,
// sm 48em, md 62em, lg 75em, xl 88em). The widths are the grid's own, not
// the window's (container queries): the same grid in a narrow column or a
// phone-sized frame drops to fewer columns.
// min-col-width="14rem": instead, as many columns of at least that width as
// fit (auto-fill).
// A child spans columns with data-span="2" (or "full"), or plain CSS.
//
// It measures its own width (an inline-size container), so it needs one
// from its parent: in a row (a ray-group, any flex row) give it a width or
// let it grow.

import { RayElement, css, define } from "../../core/core.js";
import { spaceValue } from "../../core/styles.js";

export const BREAKPOINTS = { xs: "36em", sm: "48em", md: "62em", lg: "75em", xl: "88em" };
const ORDER = ["xs", "sm", "md", "lg", "xl"];

// Each width step falls back to the step below it, then to the base count.
const fallback = (i) => ORDER.slice(0, i + 1).reduce((acc, bp) => `var(--_cols-${bp}, ${acc})`, "var(--_cols)");
const queries = ORDER.map((bp, i) => `@container ray-grid (min-width: ${BREAKPOINTS[bp]}) { .grid:not([data-auto]) { grid-template-columns: repeat(${fallback(i)}, minmax(0, 1fr)); } }`).join("\n");
const spans = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `::slotted([data-span="${n}"]) { grid-column: span ${n}; }`).join("\n");

const styles = css`
  :host {
    --_gap: var(--ray-space-md);
    --_cols: 1;
    display: block;
    container: ray-grid / inline-size;
    min-width: 0;
  }
  :host([hidden]) { display: none; }
  .grid {
    display: grid;
    gap: var(--_row-gap, var(--_gap)) var(--_gap);
    grid-template-columns: repeat(var(--_cols), minmax(0, 1fr));
    align-items: var(--_align, stretch);
  }
  .grid[data-auto] { grid-template-columns: repeat(auto-fill, minmax(min(var(--_min), 100%), 1fr)); }
  ${queries}
  ${spans}
  ::slotted([data-span="full"]) { grid-column: 1 / -1; }
`;

/**
 * "1 sm:2 lg:4" (or "3") as { base, sm: 2, lg: 4 }; invalid parts are skipped.
 * @param {string | number | undefined} value
 */
export function parseCols(value) {
  const out = {};
  for (const part of String(value ?? "").trim().split(/\s+/).filter(Boolean)) {
    const m = part.match(/^(?:(xs|sm|md|lg|xl):)?(\d+)$/);
    if (!m || Number(m[2]) < 1) continue;
    out[m[1] ?? "base"] = Number(m[2]);
  }
  return out;
}

const ALIGN = { start: "start", center: "center", end: "end", stretch: "stretch" };

export class RayGrid extends RayElement {
  static properties = {
    cols: { type: String, reflect: true, default: "1" },
    minColWidth: { type: String, attribute: "min-col-width" },
    gap: { type: String, reflect: true, default: "md" },
    rowGap: { type: String, attribute: "row-gap" },
    align: { type: String, reflect: true, default: "stretch" },
  };
  static styles = [styles];
  static template = `<div class="grid" part="grid"><slot></slot></div>`;

  update() {
    const grid = this.$(".grid");
    const cols = parseCols(this.cols);
    this.style.setProperty("--_cols", String(cols.base ?? 1));
    for (const bp of ORDER) {
      if (cols[bp]) this.style.setProperty(`--_cols-${bp}`, String(cols[bp]));
      else this.style.removeProperty(`--_cols-${bp}`);
    }
    const min = spaceValue(this.minColWidth);
    grid.toggleAttribute("data-auto", Boolean(min));
    if (min) this.style.setProperty("--_min", min);
    else this.style.removeProperty("--_min");
    const gap = spaceValue(this.gap);
    if (gap) this.style.setProperty("--_gap", gap);
    else this.style.removeProperty("--_gap");
    const row = spaceValue(this.rowGap);
    if (row) this.style.setProperty("--_row-gap", row);
    else this.style.removeProperty("--_row-gap");
    this.style.setProperty("--_align", ALIGN[this.align] ?? "stretch");
  }
}

define("ray-grid", RayGrid);
