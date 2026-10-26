# Pagination

Page navigation: previous/next, optional first/last, page numbers with ellipses; the number of items stays constant so it does not jump.

Import: `import "@raylang/elements/pagination";` · Category: Navigation

## `<ray-pagination>` (RayPagination, extends RayElement)

JS: setPage(n), next(), previous(), first(), last(); page (clamped value).

Properties:

- `total`: number, default `1`. Number of pages.
- `value`: number, default `1`. Current page (1-based).
- `siblings`: number, default `1`. Pages shown on each side of the current one.
- `boundaries`: number, default `1`. Pages always shown at the start and the end.
- `withEdges` (attribute `with-edges`): boolean, reflects. Adds first/last page buttons.
- `hideControls` (attribute `hide-controls`): boolean, reflects. Hides the previous/next (and first/last) buttons.
- `color`: string, reflects. Color of the current page: a palette color or any CSS color. Default: the primary color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Item size.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius of the items.
- `disabled`: boolean, reflects. Not interactive.
- `label`: string, default `Pagination`. Accessible name of the navigation landmark.

Events:

- `change`: The user went to another page (read `value`).

Parts (`::part()`):

- `root`: The <nav> landmark.
- `list`: The list of items.
- `item`: Every button (pages and controls).
- `active`: The current page button.
- `control`: Previous/next/first/last buttons.
- `dots`: An ellipsis.

Methods and properties:

- `readonly page: number`: The current page clamped to 1…total.
- `setPage(page: number): void`: Goes to a page (fires change).
- `next(): void`: Next page.
- `previous(): void`: Previous page.
- `first(): void`: First page.
- `last(): void`: Last page.

Vue `v-model`: `value` (updated on change).

Exports (from `@raylang/elements/pagination` and `@raylang/elements`):

- `function paginationRange(total: number, value: number, siblings?: number, boundaries?: number): Array<number | "dots">`: The items a pagination shows for a page (numbers and "dots").

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 1rem">
  <ray-pagination id="demo-pagination" total="20" value="10"></ray-pagination>
  <ray-pagination total="5" value="2" color="teal" radius="full" size="xs"></ray-pagination>
  <ray-pagination total="50" value="1" siblings="2" with-edges></ray-pagination>
  <ray-pagination total="8" value="3" disabled></ray-pagination>
</div>
<p id="demo-pagination-out" style="margin: 0.75rem 0 0; color: var(--ray-muted-foreground); font-size: var(--ray-font-size-sm)">Page 10 of 20</p>
<script type="module">
  const p = document.getElementById("demo-pagination");
  p.addEventListener("change", () => {
    document.getElementById("demo-pagination-out").textContent = `Page ${p.value} of 20`;
  });
</script>
```
