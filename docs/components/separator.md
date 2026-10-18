# Separator

A horizontal or vertical rule, optionally labeled (Mantine's Divider).

Import: `import "@raylang/elements/separator";` · Category: Layout

## `<ray-separator>` (RaySeparator, extends RayElement)

Properties:

- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Direction of the rule.
- `label`: string, reflects. Text in the middle of a horizontal rule.
- `labelPosition` (attribute `label-position`): `left` | `center` | `right`, default `center`, reflects. Where the label sits.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `xs`, reflects. Thickness (1–5px).
- `variant`: `solid` | `dashed` | `dotted`, default `solid`, reflects. Line style.

Parts (`::part()`):

- `line`: The rule without label.
- `label`: The labeled rule.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 1rem">
  <ray-separator></ray-separator>
  <ray-separator label="Or continue with"></ray-separator>
  <ray-separator label="Left" label-position="left" variant="dashed"></ray-separator>
  <div class="demo-row">Files <ray-separator orientation="vertical"></ray-separator> Edit <ray-separator orientation="vertical"></ray-separator> View</div>
</div>
```
