# Icon button

A square button for an icon (Mantine's ActionIcon). Always give it a label.

Import: `import "@raylang/elements/icon-button";` · Category: Buttons

## `<ray-icon-button>` (RayIconButton, extends RayButton)

Same properties as ray-button; variant defaults to subtle.

Properties:

- `label`: string, reflects. Accessible name and tooltip (required: the button has no text).
- `variant`: `filled` | `light` | `outline` | `subtle` | `default` | `transparent` | `gradient` | `raised`, default `subtle`, reflects. Visual style.
- `gradient`: string, reflects. With variant=gradient: "from to [deg]", palette colors or CSS colors ("teal blue 90"). Default: the --ray-gradient-* tokens.
- `color`: string. A palette color or any CSS color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Width and height.
- `disabled`: boolean. Not interactive.
- `loading`: boolean. Shows a spinner instead of the icon.

Also the properties of RayButton (`<ray-button>`): `radius`, `type`, `fullWidth`, `href`, `target`, `name`, `value`.

Slots:

- (default): The icon (an inline <svg> is sized to the button).

Parts (`::part()`):

- `button`: The inner button.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Variants × colors</div>
<div class="demo-scroll">
  <div class="demo-matrix" style="--demo-cols: 4">
    <span></span><span class="demo-matrix-head">primary</span><span class="demo-matrix-head">gray</span><span class="demo-matrix-head">red</span><span class="demo-matrix-head">teal</span>
    <span class="demo-matrix-label">subtle (default)</span><ray-icon-button label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">filled</span><ray-icon-button variant="filled" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button variant="filled" color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button variant="filled" color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button variant="filled" color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">light</span><ray-icon-button variant="light" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button variant="light" color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button variant="light" color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button variant="light" color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">outline</span><ray-icon-button variant="outline" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button variant="outline" color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button variant="outline" color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button variant="outline" color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">default</span><ray-icon-button variant="default" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><span class="demo-muted">—</span><span class="demo-muted">—</span><span class="demo-muted">—</span>
    <span class="demo-matrix-label">transparent</span><ray-icon-button variant="transparent" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button variant="transparent" color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button variant="transparent" color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button variant="transparent" color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">raised</span><ray-icon-button variant="raised" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><ray-icon-button variant="raised" color="gray" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button><ray-icon-button variant="raised" color="red" label="Close"><ray-icon name="close"></ray-icon></ray-icon-button><ray-icon-button variant="raised" color="teal" label="Done"><ray-icon name="check"></ray-icon></ray-icon-button>
    <span class="demo-matrix-label">gradient</span><ray-icon-button variant="gradient" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button><span class="demo-muted">—</span><span class="demo-muted">—</span><span class="demo-muted">—</span>
  </div>
</div>
<p class="demo-muted" style="margin: 0">subtle is the icon button's default variant. <code>label</code> is the accessible name and the tooltip.</p>

<div class="demo-caption">Sizes</div>
<div class="demo-row">
  <ray-icon-button variant="light" size="xs" label="Add"><ray-icon name="plus"></ray-icon></ray-icon-button>
  <ray-icon-button variant="light" size="sm" label="Add"><ray-icon name="plus"></ray-icon></ray-icon-button>
  <ray-icon-button variant="light" size="md" label="Add"><ray-icon name="plus"></ray-icon></ray-icon-button>
  <ray-icon-button variant="light" size="lg" label="Add"><ray-icon name="plus"></ray-icon></ray-icon-button>
  <ray-icon-button variant="light" size="xl" label="Add"><ray-icon name="plus"></ray-icon></ray-icon-button>
</div>

<div class="demo-caption">Radius</div>
<div class="demo-row">
  <ray-icon-button variant="filled" size="lg" radius="xs" label="Play"><ray-icon name="play"></ray-icon></ray-icon-button>
  <ray-icon-button variant="filled" size="lg" radius="sm" label="Play"><ray-icon name="play"></ray-icon></ray-icon-button>
  <ray-icon-button variant="filled" size="lg" radius="md" label="Play"><ray-icon name="play"></ray-icon></ray-icon-button>
  <ray-icon-button variant="filled" size="lg" radius="lg" label="Play"><ray-icon name="play"></ray-icon></ray-icon-button>
  <ray-icon-button variant="filled" size="lg" radius="full" label="Play"><ray-icon name="play"></ray-icon></ray-icon-button>
</div>

<div class="demo-caption">States and links</div>
<div class="demo-row">
  <ray-icon-button variant="default" loading label="Saving"><ray-icon name="download"></ray-icon></ray-icon-button>
  <ray-icon-button variant="filled" disabled label="Upload"><ray-icon name="upload"></ray-icon></ray-icon-button>
  <ray-icon-button variant="raised" disabled label="Pause"><ray-icon name="pause"></ray-icon></ray-icon-button>
  <ray-icon-button variant="light" href="#icon-button" label="Open link"><ray-icon name="arrow-up-right"></ray-icon></ray-icon-button>
  <ray-icon-button variant="gradient" gradient="pink orange 90" radius="full" size="lg" label="Favorite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></ray-icon-button>
</div>
```
