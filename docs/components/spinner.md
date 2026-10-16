# Spinner

An indeterminate loading indicator, announced as a status.

Import: `import "@raylang/elements/spinner";` · Category: Feedback

## `<ray-spinner>` (RaySpinner, extends RayElement)

Properties:

- `color`: string. A palette color or any CSS color. Default: the primary color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Diameter.
- `label`: string, default `Loading`. Text read by screen readers.

Parts (`::part()`):

- `spinner`: The ring.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-spinner size="xs"></ray-spinner>
  <ray-spinner size="sm"></ray-spinner>
  <ray-spinner></ray-spinner>
  <ray-spinner size="lg" color="teal"></ray-spinner>
  <ray-spinner size="xl" color="gray" label="Loading results"></ray-spinner>
</div>
```
