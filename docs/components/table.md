# Table

A data table from columns and data: sorting (aria-sort), row selection, clickable rows, sticky header, striped, empty state. Plain HTML tables: the .ray-table class of base.css.

Import: `import "@raylang/elements/table";` · Category: Data display

## `<ray-table>` (RayTable, extends RayElement)

Cells are text (render may return a DOM node; strings are never parsed as HTML). The scroll height comes from --ray-table-max-height.

Properties:

- `columns` (property only): `TableColumn[]`. Columns: key, label, width, align, sortable, render(row, index), sort(a, b).
- `data` (property only): `any[]`. Rows (objects).
- `rowKey` (attribute `row-key`): string, default `id`. Field that identifies a row (selection).
- `selectable`: boolean, reflects. A checkbox per row and a select-all checkbox.
- `selection` (property only): `unknown[]`. Keys of the selected rows.
- `sort` (property only): `TableSort | null`. Current sort; set it, or let header clicks change it.
- `manualSort` (attribute `manual-sort`): boolean. Do not sort here: listen to ray-sort and pass sorted data.
- `clickableRows` (attribute `clickable-rows`): boolean, reflects. Rows are focusable and fire ray-row-click (Enter too; arrows move between rows).
- `striped`: boolean, reflects. Alternate row background.
- `withBorder` (attribute `with-border`): boolean, reflects. Border around the table.
- `withColumnBorders` (attribute `with-column-borders`): boolean, reflects. Borders between columns.
- `stickyHeader` (attribute `sticky-header`): boolean, reflects. The header stays visible while scrolling (with --ray-table-max-height).
- `noHover` (attribute `no-hover`): boolean, reflects. No row highlight on hover.
- `density`: `xs` | `sm` | `md` | `lg`, default `sm`, reflects. Cell padding.
- `label`: string. Caption (also the table's accessible name).
- `emptyLabel` (attribute `empty-label`): string, default `No data`. Text without rows (or put a ray-empty-state in slot=empty).

Events:

- `ray-sort` (detail `{ key: string; direction: "asc" | "desc" | null }`): A header changed the sort.
- `ray-selection-change` (detail `{ selection: unknown[] }`): The selection changed.
- `ray-row-click` (detail `{ row: any; index: number }`): A row was clicked or activated with Enter (clickable-rows).

Slots:

- `empty`: Shown instead of the empty text when there are no rows.

Parts (`::part()`):

- `table`: The <table>.
- `scroll`: The scroll container.

Methods and properties:

- `readonly rows: any[]`: The rows in display order.

Types:

- `{ key: string; label?: string; width?: number | string; align?: "left" | "center" | "right"; sortable?: boolean; render?: (row: any, index: number) => string | number | Node | null | undefined; sort?: (a: any, b: any) => number }`: A column of ray-table.
- `{ key: string; direction: "asc" | "desc" }`: The sort state of ray-table.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<ray-table id="demo-table" selectable clickable-rows striped with-border sticky-header label="Releases" style="--ray-table-max-height: 16rem"></ray-table>
<p id="demo-table-out" style="margin: 0; font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground)">Click a row, sort a column, or select rows.</p>
<ray-table id="demo-table-empty" label="Deployments" with-border>
  <ray-empty-state slot="empty" label="No deployments" compact>Deploy a release to see it here.</ray-empty-state>
</ray-table>
<table class="ray-table ray-table-bordered">
  <thead><tr><th>Plain HTML</th><th>class="ray-table"</th></tr></thead>
  <tbody><tr><td>Server-rendered</td><td>No JavaScript</td></tr><tr><td>rayauth</td><td>Users list</td></tr></tbody>
</table>
<script type="module">
  const t = document.getElementById("demo-table");
  const out = document.getElementById("demo-table-out");
  t.columns = [
    { key: "app", label: "App", sortable: true },
    { key: "version", label: "Version", sortable: true },
    { key: "size", label: "Size", align: "right", sortable: true, render: (r) => `${r.size.toFixed(1)} MB` },
    { key: "status", label: "Status", render: (r) => {
      const b = document.createElement("ray-badge");
      b.color = r.status === "live" ? "green" : r.status === "failed" ? "red" : "gray";
      b.textContent = r.status;
      return b;
    } },
  ];
  t.data = [
    { id: 1, app: "ray-remote", version: "0.4.1", size: 8.4, status: "live" },
    { id: 2, app: "ray-sublime", version: "1.9.0", size: 21.7, status: "live" },
    { id: 3, app: "rayauth", version: "0.10.2", size: 6.1, status: "failed" },
    { id: 4, app: "raymart", version: "0.3.0", size: 12.9, status: "draft" },
    { id: 5, app: "ray808", version: "2.0.0", size: 15.2, status: "live" },
    { id: 6, app: "raylb", version: "0.2.4", size: 4.8, status: "draft" },
  ];
  t.addEventListener("ray-row-click", (e) => { out.textContent = `Opened ${e.detail.row.app}`; });
  t.addEventListener("ray-selection-change", (e) => { out.textContent = `${e.detail.selection.length} selected`; });
  const empty = document.getElementById("demo-table-empty");
  empty.columns = [{ key: "app", label: "App" }, { key: "when", label: "When" }];
  empty.data = [];
</script>
```
