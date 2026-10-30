# Alert

An inline message: title, text, an icon of the registry, the color variants and an optional close button.

Import: `import "@raylang/elements/alert";` · Category: Feedback

## `<ray-alert>` (RayAlert, extends RayElement)

Announced as an alert. The icon follows the color (info, circle-check, alert-triangle, circle-x) unless icon or slot=icon.

Properties:

- `label`: string. Title.
- `color`: string, reflects. A palette color or any CSS color.
- `variant`: `light` | `filled` | `outline` | `default` | `transparent`, default `light`, reflects. Visual style.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl`. Corner radius.
- `icon`: `IconName`, reflects. A registered icon name, or none.
- `closable`: boolean, reflects. A close button; closing hides the alert (cancel ray-close to keep it).
- `closeLabel` (attribute `close-label`): string, default `Dismiss`. Accessible name of the close button.

Events:

- `ray-close`: The close button was pressed; cancelable.

Slots:

- (default): Text.
- `icon`: A custom icon.

Parts (`::part()`):

- `alert`: The box.
- `close`: The close button.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 0.75rem">
  <ray-alert label="New version available" color="blue" closable>raylang 1.27.37 is out: run <code>ray upgrade</code>.</ray-alert>
  <ray-alert label="Build succeeded" color="green" variant="filled">ray-remote 0.4.1 is ready to publish.</ray-alert>
  <ray-alert label="Disk almost full" color="yellow" variant="outline">64 MB left on the build volume.</ray-alert>
  <ray-alert label="Deploy failed" color="red" variant="default" closable>The signing key was not found.</ray-alert>
  <ray-alert color="gray" variant="transparent" icon="none">A quiet note without icon nor title.</ray-alert>
</div>
```
