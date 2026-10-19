# Status bar

The bar at the bottom of an app window: items on the left and on the right; items with action are buttons.

Import: `import "@raylang/elements/statusbar";` · Category: Layout

## `<ray-statusbar>` (RayStatusbar, extends RayElement)

Properties:

- `variant`: `default` | `accent`, default `default`, reflects. accent: the primary color (e.g. while debugging).

Slots:

- (default): Items on the left.
- `right`: Items on the right.

## `<ray-statusbar-item>` (RayStatusbarItem, extends RayElement)

Properties:

- `action`: boolean, reflects. A button (listen to click).
- `color`: string, reflects. Text color (red for errors…).
- `label`: string. Accessible name and tooltip (for icon-only or terse items).

Slots:

- (default): Text.
- `icon`: Icon.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 1rem">
  <ray-statusbar>
    <ray-statusbar-item action label="Branch main">⎇ main</ray-statusbar-item>
    <ray-statusbar-item action color="red" label="2 errors">✕ 2</ray-statusbar-item>
    <ray-statusbar-item action color="yellow" label="1 warning">⚠ 1</ray-statusbar-item>
    <ray-statusbar-item slot="right">Ln 12, Col 5</ray-statusbar-item>
    <ray-statusbar-item slot="right" action>Spaces: 4</ray-statusbar-item>
    <ray-statusbar-item slot="right" action>raylang</ray-statusbar-item>
  </ray-statusbar>
  <ray-statusbar variant="accent">
    <ray-statusbar-item action>Debugging: server.ray</ray-statusbar-item>
    <ray-statusbar-item slot="right">VM · fibers on</ray-statusbar-item>
  </ray-statusbar>
</div>
```
