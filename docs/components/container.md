# Container

Its content centered, up to a maximum width, with side padding (Mantine's Container): the column of a page.

Import: `import "@raylang/elements/container";` · Category: Layout

## `<ray-container>` (RayContainer, extends RayElement)

Properties:

- `size`: string, default `md`, reflects. Maximum width: xs 540px, sm 720px, md 960px, lg 1140px, xl 1320px, or any CSS length.
- `padding`: string, default `md`, reflects. Side padding: xs…xl, a number (px) or a CSS length.
- `fluid`: boolean, reflects. No maximum width: the whole width, still padded.

Slots:

- (default): The content.

Exports (from `@raylang/elements/container` and `@raylang/elements`):

- `const CONTAINER_SIZES: { xs: string; sm: string; md: string; lg: string; xl: string }`: The maximum widths of size.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">The column of a page</div>
<div class="demo-page">
  <div class="demo-page-bar"><ray-container size="sm"><ray-group justify="space-between"><strong>ray·blog</strong><ray-group gap="sm"><a href="#container">Posts</a><a href="#container">About</a></ray-group></ray-group></ray-container></div>
  <ray-container size="sm">
    <ray-stack gap="sm" class="demo-page-body">
      <span class="demo-muted">October 8, 2026</span>
      <strong class="demo-title">Shipping per-page modules</strong>
      <p>Every docs page now loads only the components it shows. The column stays readable at any window width: ray-container size="sm" caps it at 720px and pads it on phones.</p>
    </ray-stack>
  </ray-container>
</div>

<div class="demo-caption">Sizes</div>
<div class="demo-containers">
  <ray-container size="xs"><span class="demo-cell">xs · 540px</span></ray-container>
  <ray-container size="sm"><span class="demo-cell">sm · 720px</span></ray-container>
  <ray-container size="md"><span class="demo-cell">md · 960px (default)</span></ray-container>
  <ray-container size="lg"><span class="demo-cell">lg · 1140px</span></ray-container>
  <ray-container size="30rem" padding="xl"><span class="demo-cell">size="30rem" padding="xl"</span></ray-container>
  <ray-container fluid><span class="demo-cell">fluid: the whole width, still padded</span></ray-container>
</div>
```
