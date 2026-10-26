# Stack

Its children in a column, spaced by the space scale (Mantine's Stack): forms, panels, anything stacked.

Import: `import "@raylang/elements/stack";` · Category: Layout

## `<ray-stack>` (RayStack, extends RayElement)

A flex column on the host: the children are laid out directly, no wrapper.

Properties:

- `gap`: string, default `md`, reflects. Space between children: xs…xl (the space scale), a number (px) or any CSS length.
- `align`: `stretch` | `start` | `center` | `end` | `baseline`, default `stretch`, reflects. Cross-axis alignment: stretch fills the width.
- `justify`: `start` | `center` | `end` | `space-between` | `space-around` | `space-evenly`, default `start`, reflects. Main-axis distribution (with a height to distribute).

Slots:

- (default): The children.

Exports (from `@raylang/elements/stack` and `@raylang/elements`):

- `function applyFlex(el: HTMLElement, options: { gap?: string; align?: string; justify?: string }, alignDefault: string): void`: Gap, align and justify of a stack or group onto an element's custom properties (for a layout component of your own).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A form, stacked</div>
<ray-card with-border radius="lg" padding="lg" class="demo-narrow">
  <ray-stack gap="lg">
    <ray-stack gap="2">
      <strong class="demo-title">Create a workspace</strong>
      <span class="demo-muted">Everyone you invite joins it.</span>
    </ray-stack>
    <ray-stack gap="sm">
      <ray-input label="Name" placeholder="Acme Labs"></ray-input>
      <ray-input label="URL" placeholder="acme" description="ray.dev/acme"></ray-input>
    </ray-stack>
    <ray-button full-width>Create</ray-button>
  </ray-stack>
</ray-card>

<div class="demo-caption">gap: the space scale</div>
<div class="demo-layout-row">
  <figure class="demo-gap"><ray-stack gap="xs"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>xs</figcaption></figure>
  <figure class="demo-gap"><ray-stack gap="sm"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>sm</figcaption></figure>
  <figure class="demo-gap"><ray-stack gap="md"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>md</figcaption></figure>
  <figure class="demo-gap"><ray-stack gap="lg"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>lg</figcaption></figure>
  <figure class="demo-gap"><ray-stack gap="xl"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>xl</figcaption></figure>
  <figure class="demo-gap"><ray-stack gap="2"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>2 (px)</figcaption></figure>
</div>

<div class="demo-caption">align and justify</div>
<div class="demo-layout-row">
  <figure class="demo-gap"><ray-stack align="start" class="demo-frame"><span class="demo-block" style="width: 60%"></span><span class="demo-block" style="width: 35%"></span><span class="demo-block" style="width: 80%"></span></ray-stack><figcaption>align="start"</figcaption></figure>
  <figure class="demo-gap"><ray-stack align="center" class="demo-frame"><span class="demo-block" style="width: 60%"></span><span class="demo-block" style="width: 35%"></span><span class="demo-block" style="width: 80%"></span></ray-stack><figcaption>align="center"</figcaption></figure>
  <figure class="demo-gap"><ray-stack align="end" class="demo-frame"><span class="demo-block" style="width: 60%"></span><span class="demo-block" style="width: 35%"></span><span class="demo-block" style="width: 80%"></span></ray-stack><figcaption>align="end"</figcaption></figure>
  <figure class="demo-gap"><ray-stack justify="space-between" class="demo-frame tall"><span class="demo-block"></span><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>justify="space-between"</figcaption></figure>
  <figure class="demo-gap"><ray-stack justify="center" gap="xs" class="demo-frame tall"><span class="demo-block"></span><span class="demo-block"></span></ray-stack><figcaption>justify="center"</figcaption></figure>
</div>
```
