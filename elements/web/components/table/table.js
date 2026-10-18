// <ray-table>: a data table rendered from `columns` and `data`.
//
//   table.columns = [
//     { key: "name", label: "Name", sortable: true },
//     { key: "size", label: "Size", align: "right", render: (row) => `${row.size} KB` },
//   ];
//   table.data = [{ id: 1, name: "main.ray", size: 4 }, …];
//
// Cells are text (render() may also return a DOM node; strings are never
// parsed as HTML). Sorting cycles asc -> desc -> none per column and is done
// here unless `manual-sort` (then listen to ray-sort and pass sorted data).
// With `selectable`, rows get checkboxes and `selection` holds their keys.
// For plain server-rendered tables there is the .ray-table class in base.css.

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    display: block;
    --_py: var(--ray-space-2);
    --_px: var(--ray-space-3);
    font-size: var(--ray-font-size-sm);
  }
  :host([density="xs"]) { --_py: 0.25rem; --_px: var(--ray-space-2); }
  :host([density="md"]) { --_py: var(--ray-space-3); }
  :host([density="lg"]) { --_py: var(--ray-space-4); --_px: var(--ray-space-4); }
  .scroll { max-height: var(--ray-table-max-height, none); overflow: auto; }
  :host([with-border]) .scroll { border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); }
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums; }
  caption { padding: var(--_py) var(--_px); text-align: start; font-weight: var(--ray-font-weight-semibold); }
  th, td { padding: var(--_py) var(--_px); text-align: start; vertical-align: middle; border-bottom: 1px solid var(--ray-border); }
  :host([with-column-borders]) th + th, :host([with-column-borders]) td + td { border-inline-start: 1px solid var(--ray-border); }
  tbody tr:last-child td { border-bottom: 0; }
  :host(:not([with-border])) tbody tr:last-child td { border-bottom: 1px solid var(--ray-border); }
  th { font-size: var(--ray-font-size-xs); font-weight: var(--ray-font-weight-semibold); color: var(--ray-muted-foreground); white-space: nowrap; background: var(--ray-background); }
  :host([sticky-header]) thead th { position: sticky; top: 0; z-index: 1; box-shadow: 0 1px 0 var(--ray-border); }
  [data-align="right"] { text-align: right; } /* physical */
  [data-align="center"] { text-align: center; }
  :host([striped]) tbody tr:nth-child(even) td { background: color-mix(in srgb, var(--ray-muted) 60%, transparent); }
  tbody tr:hover td { background: var(--ray-default-hover); }
  :host([no-hover]) tbody tr:hover td { background: inherit; }
  tbody tr[aria-selected="true"] td { background: var(--ray-primary-light); }
  tbody tr[data-clickable] { cursor: pointer; }
  tbody tr:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: -2px; }
  .sort {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin: -0.25rem -0.375rem;
    padding: 0.25rem 0.375rem;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .sort:hover { color: var(--ray-foreground); background: var(--ray-accent); }
  .sort { --ray-icon-stroke: 2.5; }
  .sort svg { width: 0.75rem; height: 0.75rem; opacity: 0.35; }
  th[aria-sort="ascending"] .sort, th[aria-sort="descending"] .sort { color: var(--ray-foreground); }
  th[aria-sort="ascending"] .sort svg, th[aria-sort="descending"] .sort svg { opacity: 1; }
  th[aria-sort="descending"] .sort svg { transform: rotate(180deg); }
  .check { width: 1%; padding-inline-end: 0; }
  .check input { width: 1rem; height: 1rem; margin: 0; accent-color: var(--ray-primary); cursor: pointer; vertical-align: middle; }
  .empty td { padding: var(--ray-space-8) var(--_px); text-align: center; color: var(--ray-muted-foreground); }
  .empty:hover td { background: inherit; }
`;

const SORT_ICON = `<span data-ray-icon="ui.sort" aria-hidden="true"></span>`;

export class RayTable extends RayElement {
  static properties = {
    columns: { attribute: false },
    data: { attribute: false },
    rowKey: { type: String, default: "id" },
    selectable: { type: Boolean, reflect: true },
    selection: { attribute: false },
    sort: { attribute: false },
    manualSort: { type: Boolean },
    clickableRows: { type: Boolean, reflect: true },
    striped: { type: Boolean, reflect: true },
    withBorder: { type: Boolean, reflect: true },
    withColumnBorders: { type: Boolean, reflect: true },
    stickyHeader: { type: Boolean, reflect: true },
    noHover: { type: Boolean, reflect: true },
    density: { type: String, reflect: true, default: "sm" },
    label: { type: String },
    emptyLabel: { type: String, default: "No data" },
  };
  static styles = [styles];
  static template = `<div class="scroll" part="scroll"><table part="table"><caption hidden></caption><thead part="head"></thead><tbody part="body"></tbody></table></div><slot name="empty" hidden></slot>`;

  constructor() {
    super();
    this.$("thead").addEventListener("click", (e) => this._headClick(e));
    this.$("thead").addEventListener("change", (e) => this._headChange(e));
    this.$("tbody").addEventListener("change", (e) => this._rowCheck(e));
    this.$("tbody").addEventListener("click", (e) => this._rowClick(e));
    this.$("tbody").addEventListener("keydown", (e) => this._rowKey(e));
  }

  /** The rows in display order (sorted unless manual-sort). */
  get rows() {
    const data = Array.isArray(this.data) ? this.data : [];
    const s = this.sort;
    if (!s || !s.key || !s.direction || this.manualSort) return data;
    const col = (this.columns ?? []).find((c) => c.key === s.key);
    const cmp = col?.sort ?? ((a, b) => compare(a[s.key], b[s.key]));
    const sorted = [...data].sort(cmp);
    return s.direction === "desc" ? sorted.reverse() : sorted;
  }

  _key(row, index) {
    const k = row?.[this.rowKey ?? "id"];
    return k === undefined ? index : k;
  }

  update() {
    // The table is rebuilt: remember what had focus to give it back after.
    const focus = this._focusKey();
    const columns = Array.isArray(this.columns) ? this.columns : [];
    const rows = this.rows;
    const selection = new Set(Array.isArray(this.selection) ? this.selection : []);

    const caption = this.$("caption");
    caption.hidden = !this.label;
    caption.textContent = this.label ?? "";
    this.$("table").setAttribute("aria-label", this.label || this.getAttribute("aria-label") || "");
    if (!this.label && !this.getAttribute("aria-label")) this.$("table").removeAttribute("aria-label");
    // No aria-multiselectable: a plain table takes none (that is for
    // role=grid); each row's checkbox says what is selected.

    // Head
    const head = document.createElement("tr");
    if (this.selectable) {
      const th = document.createElement("th");
      th.className = "check";
      const all = document.createElement("input");
      all.type = "checkbox";
      all.className = "focus-ring";
      all.dataset.role = "all";
      all.setAttribute("aria-label", "Select all rows");
      const keys = rows.map((r, i) => this._key(r, i));
      const picked = keys.filter((k) => selection.has(k)).length;
      all.checked = keys.length > 0 && picked === keys.length;
      all.indeterminate = picked > 0 && picked < keys.length;
      th.append(all);
      head.append(th);
    }
    for (const col of columns) {
      const th = document.createElement("th");
      th.scope = "col";
      if (col.align) th.dataset.align = col.align;
      if (col.width) th.style.width = typeof col.width === "number" ? `${col.width}px` : col.width;
      const label = col.label ?? col.key;
      if (col.sortable) {
        const s = this.sort;
        const dir = s && s.key === col.key ? s.direction : null;
        th.setAttribute("aria-sort", dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none");
        const b = document.createElement("button");
        b.type = "button";
        b.className = "sort focus-ring";
        b.dataset.key = col.key;
        b.append(label);
        b.insertAdjacentHTML("beforeend", SORT_ICON);
        th.append(b);
      } else {
        th.append(label);
      }
      head.append(th);
    }
    this.$("thead").replaceChildren(head);
    this.paintIcons(this.$("thead"));

    // Body
    const body = this.$("tbody");
    const out = [];
    rows.forEach((row, index) => {
      const key = this._key(row, index);
      const tr = document.createElement("tr");
      tr.dataset.index = String(index);
      if (this.selectable) {
        tr.setAttribute("aria-selected", String(selection.has(key)));
        const td = document.createElement("td");
        td.className = "check";
        const box = document.createElement("input");
        box.type = "checkbox";
        box.className = "focus-ring";
        box.checked = selection.has(key);
        box.setAttribute("aria-label", `Select row ${index + 1}`);
        td.append(box);
        tr.append(td);
      }
      if (this.clickableRows) {
        tr.tabIndex = 0;
        tr.dataset.clickable = "";
      }
      for (const col of columns) {
        const td = document.createElement("td");
        if (col.align) td.dataset.align = col.align;
        const v = typeof col.render === "function" ? col.render(row, index) : row?.[col.key];
        if (v instanceof Node) td.append(v);
        else td.textContent = v === undefined || v === null ? "" : String(v);
        tr.append(td);
      }
      out.push(tr);
    });
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.className = "empty";
      const td = document.createElement("td");
      td.colSpan = Math.max(1, columns.length + (this.selectable ? 1 : 0));
      // A slotted empty state wins over the text.
      const slot = this.$('slot[name="empty"]');
      if (slot.assignedElements().length) {
        slot.hidden = false;
        td.append(slot);
      } else {
        td.textContent = this.emptyLabel ?? "No data";
      }
      tr.append(td);
      out.push(tr);
    } else {
      const slot = this.$('slot[name="empty"]');
      if (slot.parentElement !== this.shadowRoot) {
        slot.hidden = true;
        this.shadowRoot.append(slot);
      }
    }
    body.replaceChildren(...out);
    this._restoreFocus(focus);
  }

  _focusKey() {
    const a = this.shadowRoot.activeElement;
    if (!a) return null;
    if (a.dataset?.role === "all") return { kind: "all" };
    if (a.classList?.contains("sort")) return { kind: "sort", key: a.dataset.key };
    const tr = a.closest?.("tbody tr");
    if (!tr) return null;
    return { kind: a === tr ? "row" : "check", index: tr.dataset.index };
  }

  _restoreFocus(f) {
    if (!f) return;
    let el = null;
    if (f.kind === "all") el = this.$('thead input[data-role="all"]');
    else if (f.kind === "sort") el = [...this.shadowRoot.querySelectorAll("thead .sort")].find((b) => b.dataset.key === f.key);
    else {
      const tr = this.$(`tbody tr[data-index="${f.index}"]`);
      el = f.kind === "row" ? tr : tr?.querySelector("input");
    }
    el?.focus({ preventScroll: true });
  }

  _rowOf(target) {
    const tr = target.closest?.("tbody tr");
    if (!tr || tr.classList.contains("empty")) return null;
    const index = Number(tr.dataset.index);
    return { tr, index, row: this.rows[index] };
  }

  _headClick(e) {
    const b = e.target.closest?.(".sort");
    if (!b) return;
    const key = b.dataset.key;
    const s = this.sort;
    const dir = s && s.key === key ? s.direction : null;
    const next = dir === null ? "asc" : dir === "asc" ? "desc" : null;
    this.sort = next ? { key, direction: next } : null;
    this.emit("ray-sort", { key, direction: next });
  }

  _headChange(e) {
    if (e.target.dataset.role !== "all") return;
    const keys = this.rows.map((r, i) => this._key(r, i));
    this._select(e.target.checked ? keys : []);
  }

  _rowCheck(e) {
    const hit = this._rowOf(e.target);
    if (!hit || e.target.type !== "checkbox") return;
    const key = this._key(hit.row, hit.index);
    const set = new Set(Array.isArray(this.selection) ? this.selection : []);
    if (e.target.checked) set.add(key);
    else set.delete(key);
    this._select([...set]);
  }

  _select(keys) {
    this.selection = keys;
    this.emit("ray-selection-change", { selection: keys });
  }

  _rowClick(e) {
    if (!this.clickableRows) return;
    // Clicks on controls inside the row are theirs.
    if (e.target.closest?.("input, button, a, select, textarea, label")) return;
    const hit = this._rowOf(e.target);
    if (hit) this.emit("ray-row-click", { row: hit.row, index: hit.index });
  }

  _rowKey(e) {
    if (!this.clickableRows || e.target.localName !== "tr") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const hit = this._rowOf(e.target);
      if (hit) this.emit("ray-row-click", { row: hit.row, index: hit.index });
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? e.target.nextElementSibling : e.target.previousElementSibling;
      next?.focus();
    }
  }
}

/** Numbers numerically, everything else as text with natural ordering; empty last. */
function compare(a, b) {
  const ea = a === undefined || a === null || a === "";
  const eb = b === undefined || b === null || b === "";
  if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

define("ray-table", RayTable);
