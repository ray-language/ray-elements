# Progress

A determinate or (without value) indeterminate progress bar, announced as a progressbar.

Import: `import "@raylang/elements/progress";` · Category: Feedback

## `<ray-progress>` (RayProgress, extends RayElement)

Properties:

- `value`: number. Progress, from 0 to max. Unset: indeterminate.
- `max`: number, default `100`. The value of a full bar.
- `color`: string, reflects. A palette color or any CSS color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Bar height.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius. Default: full.
- `striped`: boolean, reflects. Diagonal stripes.
- `animated`: boolean, reflects. Moving stripes (with striped).
- `showValue` (attribute `show-value`): boolean, reflects. Shows the percentage: inside the bar on lg and xl, beside it on smaller sizes.
- `label`: string. Accessible name (default: Progress).

Parts (`::part()`):

- `track`: The background track.
- `bar`: The filled bar.
- `value`: The percentage beside the bar (show-value on xs, sm, md).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 1rem; max-width: 28rem">
  <ray-progress value="35" label="Upload"></ray-progress>
  <ray-progress value="70" color="teal" size="lg" show-value label="Build"></ray-progress>
  <ray-progress value="55" color="violet" striped animated label="Sync"></ray-progress>
  <ray-progress size="sm" label="Waiting for the server"></ray-progress>
</div>
```
