# Kbd

A keyboard key: a raised keycap, or a flat chip (filled or outline) for hints in menus and buttons.

Import: `import "@raylang/elements/kbd";` · Category: Data display

## `<ray-kbd>` (RayKbd, extends RayElement)

Properties:

- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Font size.
- `variant`: `default` | `filled` | `outline`, default `default`, reflects. default: raised keycap; filled: flat muted chip; outline: flat with a border.

Slots:

- (default): The key name.

Parts (`::part()`):

- `kbd`: The inner <kbd>.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-stack">
  <div class="demo-row"><span class="demo-muted" style="width: 4.5rem">default</span><ray-kbd>⌘</ray-kbd><ray-kbd>Shift</ray-kbd><ray-kbd>P</ray-kbd></div>
  <div class="demo-row"><span class="demo-muted" style="width: 4.5rem">filled</span><ray-kbd variant="filled">⌘</ray-kbd><ray-kbd variant="filled">Shift</ray-kbd><ray-kbd variant="filled">P</ray-kbd></div>
  <div class="demo-row"><span class="demo-muted" style="width: 4.5rem">outline</span><ray-kbd variant="outline">⌘</ray-kbd><ray-kbd variant="outline">Shift</ray-kbd><ray-kbd variant="outline">P</ray-kbd></div>
</div>
<p style="margin: 0">Open the command palette with <ray-kbd>⌘</ray-kbd> + <ray-kbd>Shift</ray-kbd> + <ray-kbd>P</ray-kbd>.</p>
<div class="demo-row">
  <ray-button variant="default" size="sm">Search <ray-kbd slot="right" variant="filled" size="xs">⌘K</ray-kbd></ray-button>
  <ray-button variant="default" size="sm">Save <ray-kbd slot="right" variant="outline" size="xs">⌘S</ray-kbd></ray-button>
</div>
```
