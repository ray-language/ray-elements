# Avatar

An image, the initials of a name, or a placeholder icon.

Import: `import "@raylang/elements/avatar";` · Category: Data display

## `<ray-avatar>` (RayAvatar, extends RayElement)

Properties:

- `src`: string, reflects. Image URL; falls back to initials if it fails to load.
- `alt`: string, reflects. Accessible name (default: name).
- `name`: string, reflects. Person or entity name; its initials are shown without an image.
- `color`: string. A palette color or any CSS color.
- `variant`: `light` | `filled` | `outline` | `default`, default `light`, reflects. Style of the initials/placeholder.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Diameter.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius. Default: full.

Slots:

- (default): Custom content (e.g. an icon) instead of initials.

Parts (`::part()`):

- `avatar`: The box.
- `image`: The <img>.

Exports (from `@raylang/elements/avatar` and `@raylang/elements`):

- `function initials(name: string): string`: Up to two initials of a name: "Ada Lovelace" -> "AL".

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-avatar name="Ada Lovelace"></ray-avatar>
  <ray-avatar name="Grace Hopper" color="teal"></ray-avatar>
  <ray-avatar name="Linus" variant="filled" color="violet"></ray-avatar>
  <ray-avatar></ray-avatar>
  <ray-avatar src="data:image/png;base64,broken" name="Broken Image" color="orange"></ray-avatar>
  <ray-avatar name="Small" size="sm"></ray-avatar>
  <ray-avatar name="Extra Large" size="xl" radius="md"></ray-avatar>
</div>
```
