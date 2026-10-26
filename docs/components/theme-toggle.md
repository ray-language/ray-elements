# Theme toggle

Icon button that cycles the document theme: system, light, dark.

Import: `import "@raylang/elements/theme-toggle";` · Category: Theme

## `<ray-theme-toggle>` (RayThemeToggle, extends RayElement)

Properties:

- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Control height.

Events:

- `ray-theme-change` (detail `{ theme: "light" | "dark" | "system"; resolved: "light" | "dark"; primary: string | null }`): Fired on the document root by setTheme(); detail: { theme, resolved, primary }.

Parts (`::part()`):

- `button`: The inner button.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-theme-toggle size="xs"></ray-theme-toggle>
  <ray-theme-toggle></ray-theme-toggle>
  <ray-theme-toggle size="lg"></ray-theme-toggle>
</div>
```
