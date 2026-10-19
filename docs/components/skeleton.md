# Skeleton

A placeholder while content loads: a shimmering block, a circle or text lines; with loaded it shows its content.

Import: `import "@raylang/elements/skeleton";` · Category: Feedback

## `<ray-skeleton>` (RaySkeleton, extends RayElement)

aria-busy="true" on the host while loading; the placeholder is aria-hidden.

Properties:

- `width`: string. Width (CSS length, a number is px). Default: 100% (a circle: 2.5rem).
- `height`: string. Height of a block or of each line (CSS length, a number is px). Default: 1rem.
- `circle`: boolean, reflects. A circle (avatar placeholder): its diameter is width, else height.
- `lines`: number, reflects. Number of text lines (the last one is shorter).
- `radius`: string, reflects. Corner radius: xs…xl, full or a CSS length. Default: sm.
- `animation`: `shimmer` | `pulse` | `none`, default `shimmer`, reflects. The loading effect (always none with reduced motion).
- `loaded`: boolean, reflects. Shows the slotted content instead of the placeholder.

Slots:

- (default): The real content, shown with loaded.

Parts (`::part()`):

- `skeleton`: The placeholder container.
- `bone`: Each block or line.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <div style="display: flex; gap: 0.75rem; align-items: flex-start">
    <ray-skeleton circle width="2.75rem"></ray-skeleton>
    <div style="flex: 1; display: grid; gap: 0.5rem">
      <ray-skeleton height="0.875rem" width="40%"></ray-skeleton>
      <ray-skeleton lines="3" height="0.625rem"></ray-skeleton>
    </div>
  </div>
  <div style="display: grid; gap: 0.75rem">
    <ray-skeleton height="7rem" radius="md"></ray-skeleton>
    <ray-skeleton id="demo-skeleton" height="1.25rem" width="60%">
      <strong>ray-remote 0.4.1 is ready.</strong>
    </ray-skeleton>
    <ray-button size="xs" variant="default" id="demo-skeleton-toggle" style="justify-self: start">Toggle loaded</ray-button>
  </div>
</div>
<script type="module">
  const s = document.getElementById("demo-skeleton");
  document.getElementById("demo-skeleton-toggle").addEventListener("click", () => { s.loaded = !s.loaded; });
</script>
```
