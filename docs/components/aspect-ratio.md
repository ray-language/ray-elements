# Aspect ratio

A box with a fixed width/height ratio; its image, video or iframe fills it.

Import: `import "@raylang/elements/aspect-ratio";` · Category: Layout

## `<ray-aspect-ratio>` (RayAspectRatio, extends RayElement)

Properties:

- `ratio`: string, default `16/9`, reflects. Width/height: "16/9", "4:3", "1" or a number.
- `fit`: `cover` | `contain`, default `cover`, reflects. How the media fills the box (object-fit).
- `radius`: string, reflects. Corner radius: xs…xl, full or a CSS length.

Slots:

- (default): The media (img, video, iframe or any element); it fills the box.

Exports (from `@raylang/elements/aspect-ratio` and `@raylang/elements`):

- `function parseRatio(value: string | number): string | null`: A ratio ("16/9", "4:3", 1.5) as a CSS aspect-ratio value, or null.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <ray-aspect-ratio ratio="16/9" radius="md">
    <div style="background: linear-gradient(135deg, var(--ray-chart-1), var(--ray-chart-3)); display: grid; place-items: center; color: white; font-weight: 600">16 / 9</div>
  </ray-aspect-ratio>
  <ray-aspect-ratio ratio="1" radius="lg" style="max-width: 12rem">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-label="Square"><rect width="100" height="100" fill="var(--ray-violet-6)"/><circle cx="50" cy="50" r="28" fill="var(--ray-violet-2)"/></svg>
  </ray-aspect-ratio>
  <ray-aspect-ratio ratio="4:3" fit="contain" style="background: var(--ray-muted); border-radius: var(--ray-radius-md)">
    <svg viewBox="0 0 120 40" aria-label="Contained"><rect width="120" height="40" rx="6" fill="var(--ray-orange-6)"/></svg>
  </ray-aspect-ratio>
</div>
```
