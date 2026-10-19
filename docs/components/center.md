# Center

Its content centered on both axes (Mantine's Center): empty states, loaders, a sign-in card.

Import: `import "@raylang/elements/center";` · Category: Layout

## `<ray-center>` (RayCenter, extends RayElement)

It fills its parent's width; give it a height (or a flex or grid parent that stretches it) to center vertically.

Properties:

- `inline`: boolean, reflects. As wide as its content (inline-flex): an icon beside text.

Slots:

- (default): The content.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Empty state, loading and sign-in</div>
<ray-grid cols="1 sm:3" gap="sm">
  <ray-center class="demo-center-box">
    <ray-stack align="center" gap="xs">
      <span class="demo-center-icon"><ray-icon name="folder"></ray-icon></span>
      <strong>No files yet</strong>
      <span class="demo-muted">Drop files here to upload them.</span>
    </ray-stack>
  </ray-center>
  <ray-center class="demo-center-box">
    <ray-stack align="center" gap="sm"><ray-spinner></ray-spinner><span class="demo-muted">Loading builds…</span></ray-stack>
  </ray-center>
  <ray-center class="demo-center-box demo-center-pattern">
    <ray-card with-border shadow="sm" radius="lg" class="demo-center-card">
      <ray-stack gap="sm">
        <strong>Sign in</strong>
        <ray-input aria-label="Email" placeholder="you@ray.dev" size="xs"></ray-input>
        <ray-button size="xs" full-width>Continue</ray-button>
      </ray-stack>
    </ray-card>
  </ray-center>
</ray-grid>

<div class="demo-caption">inline: beside text</div>
<p class="demo-center-text">
  Builds run on
  <ray-center inline class="demo-center-chip"><ray-icon name="terminal"></ray-icon></ray-center>
  ray runners and report to
  <ray-center inline class="demo-center-chip"><ray-icon name="bell"></ray-icon></ray-center>
  your notifications.
</p>
```
