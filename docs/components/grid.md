# Grid

A responsive grid: a column count per width (cols="1 sm:2 lg:4") measured on the grid itself, or as many columns of a minimum width as fit. Children span columns with data-span.

Import: `import "@raylang/elements/grid";` · Category: Layout

## `<ray-grid>` (RayGrid, extends RayElement)

The widths are the grid's own (container queries: xs 36em, sm 48em, md 62em, lg 75em, xl 88em), so a grid in a narrow column or a phone frame drops to fewer columns. It needs a width from its parent: in a flex row give it one or let it grow. A child spans with data-span="2"…"12" or "full".

Properties:

- `cols`: string, default `1`, reflects. Columns: a count, then counts from a width up ("1 sm:2 lg:4").
- `minColWidth` (attribute `min-col-width`): string. Instead of cols: as many columns of at least this width as fit ("14rem", 220).
- `gap`: string, default `md`, reflects. Space between cells: xs…xl, a number (px) or a CSS length.
- `rowGap` (attribute `row-gap`): string. Space between rows when it differs from gap.
- `align`: `stretch` | `start` | `center` | `end`, default `stretch`, reflects. Vertical alignment of the cells in a row.

Slots:

- (default): The cells (data-span="2" or "full" to span).

Parts (`::part()`):

- `grid`: The grid element.

Exports (from `@raylang/elements/grid` and `@raylang/elements`):

- `function parseCols(value: string | number | undefined): { base?: number; xs?: number; sm?: number; md?: number; lg?: number; xl?: number }`: "1 sm:2 lg:4" as counts per width.
- `const BREAKPOINTS: { xs: string; sm: string; md: string; lg: string; xl: string }`: The widths of cols (36em, 48em, 62em, 75em, 88em).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Responsive to its own width: drag the corner</div>
<div class="demo-resize" id="demo-grid-resize">
  <ray-grid cols="1 xs:2 md:4" gap="sm">
    <ray-stat label="Builds" value="1,284" diff="12"></ray-stat>
    <ray-stat label="Success rate" value="98.2%" diff="0.4"></ray-stat>
    <ray-stat label="Avg. duration" value="4.1 s" diff="-8"></ray-stat>
    <ray-stat label="Deploys" value="73" diff="5"></ray-stat>
    <ray-card with-border radius="md" data-span="full" class="demo-grid-chart"><span class="demo-muted">data-span="full": a row of its own</span><span class="bars"><i style="--h: 40%"></i><i style="--h: 65%"></i><i style="--h: 52%"></i><i style="--h: 80%"></i><i style="--h: 70%"></i><i style="--h: 92%"></i><i style="--h: 60%"></i><i style="--h: 75%"></i></span></ray-card>
  </ray-grid>
  <span class="demo-resize-width" id="demo-grid-width"></span>
</div>
<p class="demo-muted">cols="1 xs:2 md:4": one column, two from 36em, four from 62em, measured on the grid (container queries), not the window.</p>

<div class="demo-caption">Spans</div>
<ray-grid cols="4" gap="xs">
  <span class="demo-cell" data-span="2">data-span="2"</span><span class="demo-cell">1</span><span class="demo-cell">1</span>
  <span class="demo-cell">1</span><span class="demo-cell" data-span="3">data-span="3"</span>
  <span class="demo-cell" data-span="full">data-span="full"</span>
</ray-grid>

<div class="demo-caption">As many as fit: min-col-width</div>
<ray-grid min-col-width="9rem" gap="sm">
  <figure class="demo-swatch" style="--c: var(--ray-blue-filled)"><span></span><figcaption>blue</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-teal-filled)"><span></span><figcaption>teal</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-violet-filled)"><span></span><figcaption>violet</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-pink-filled)"><span></span><figcaption>pink</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-orange-filled)"><span></span><figcaption>orange</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-green-filled)"><span></span><figcaption>green</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-yellow-filled)"><span></span><figcaption>yellow</figcaption></figure>
  <figure class="demo-swatch" style="--c: var(--ray-red-filled)"><span></span><figcaption>red</figcaption></figure>
</ray-grid>

<div class="demo-caption">gap, row-gap and align</div>
<ray-grid cols="3" gap="xl" row-gap="xs" align="center">
  <span class="demo-cell">gap="xl"</span><span class="demo-cell tall">align="center"</span><span class="demo-cell">row-gap="xs"</span>
  <span class="demo-cell">4</span><span class="demo-cell">5</span><span class="demo-cell tall">6</span>
</ray-grid>

<script type="module">
  // The width under the corner, as the grid sees it.
  const box = document.getElementById("demo-grid-resize");
  const out = document.getElementById("demo-grid-width");
  new ResizeObserver(() => {
    const px = box.querySelector("ray-grid").getBoundingClientRect().width;
    out.textContent = `${Math.round(px)} px · ${(px / 16).toFixed(1)} em`;
  }).observe(box);
</script>
```
