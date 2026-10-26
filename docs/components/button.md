# Button

A button, or a link styled as one with href. Submits or resets its form with type.

Import: `import "@raylang/elements/button";` · Category: Buttons

## `<ray-button>` (RayButton, extends RayElement)

Properties:

- `variant`: `filled` | `light` | `outline` | `subtle` | `default` | `transparent` | `gradient` | `raised`, default `filled`, reflects. Visual style. raised: a physical key on a darker edge that sinks when pressed (mouse, touch or keyboard).
- `gradient`: string, reflects. With variant=gradient: "from to [deg]", palette colors or CSS colors ("teal blue 90"). Default: the --ray-gradient-* tokens.
- `color`: string. A palette color (blue, red…) or any CSS color. Default: the primary color.
- `size`: `"xs" | "sm" | "md" | "lg" | "xl" | (string & {})`, default `sm`, reflects. Height, padding and font size: xs…xl or any CSS length (the padding and the font follow).
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius. Default: --ray-radius-default.
- `type`: `button` | `submit` | `reset`, default `button`. submit/reset act on the enclosing form.
- `disabled`: boolean. Not interactive (also when inside a disabled fieldset).
- `loading`: boolean. Shows a spinner over the content and blocks clicks.
- `fullWidth` (attribute `full-width`): boolean. Takes the whole width of its container.
- `href`: string. Renders a link instead of a button.
- `target`: string. Link target, with href.
- `name`: string. With type=submit: submitted as name=value.
- `value`: string. With type=submit: the submitted value.

Slots:

- (default): The label.
- `left`: Icon or content before the label.
- `right`: Icon or content after the label.

Parts (`::part()`):

- `button`: The inner <button> or <a>.
- `label`: The label wrapper.

Methods and properties:

- `readonly form: HTMLFormElement | null`: The form a submit/reset button acts on.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Variants × colors</div>
<div class="demo-scroll">
  <div class="demo-matrix" style="--demo-cols: 4" id="demo-raised">
    <span></span><span class="demo-matrix-head">primary</span><span class="demo-matrix-head">gray</span><span class="demo-matrix-head">red</span><span class="demo-matrix-head">teal</span>
    <span class="demo-matrix-label">filled</span><ray-button>Button</ray-button><ray-button color="gray">Button</ray-button><ray-button color="red">Button</ray-button><ray-button color="teal">Button</ray-button>
    <span class="demo-matrix-label">light</span><ray-button variant="light">Button</ray-button><ray-button variant="light" color="gray">Button</ray-button><ray-button variant="light" color="red">Button</ray-button><ray-button variant="light" color="teal">Button</ray-button>
    <span class="demo-matrix-label">outline</span><ray-button variant="outline">Button</ray-button><ray-button variant="outline" color="gray">Button</ray-button><ray-button variant="outline" color="red">Button</ray-button><ray-button variant="outline" color="teal">Button</ray-button>
    <span class="demo-matrix-label">subtle</span><ray-button variant="subtle">Button</ray-button><ray-button variant="subtle" color="gray">Button</ray-button><ray-button variant="subtle" color="red">Button</ray-button><ray-button variant="subtle" color="teal">Button</ray-button>
    <span class="demo-matrix-label">default</span><ray-button variant="default">Button</ray-button><span class="demo-muted">—</span><span class="demo-muted">—</span><span class="demo-muted">—</span>
    <span class="demo-matrix-label">transparent</span><ray-button variant="transparent">Button</ray-button><ray-button variant="transparent" color="gray">Button</ray-button><ray-button variant="transparent" color="red">Button</ray-button><ray-button variant="transparent" color="teal">Button</ray-button>
    <span class="demo-matrix-label">raised</span><ray-button variant="raised">Button</ray-button><ray-button variant="raised" color="gray">Button</ray-button><ray-button variant="raised" color="red">Button</ray-button><ray-button variant="raised" color="teal">Button</ray-button>
  </div>
</div>
<p class="demo-muted" style="margin: 0">default is the neutral surface and ignores color. Any palette name or CSS color works: <code>color="#8e44ad"</code>.</p>

<div class="demo-caption">Gradient</div>
<div class="demo-row">
  <ray-button variant="gradient">Theme gradient</ray-button>
  <ray-button variant="gradient" gradient="pink orange 90">pink → orange</ray-button>
  <ray-button variant="gradient" gradient="#0f766e #1d4ed8 135">Raw colors</ray-button>
</div>

<div class="demo-caption">Sizes</div>
<div class="demo-row">
  <ray-button size="xs">Extra small</ray-button>
  <ray-button size="sm">Small</ray-button>
  <ray-button size="md">Medium</ray-button>
  <ray-button size="lg">Large</ray-button>
  <ray-button size="xl">Extra large</ray-button>
</div>

<div class="demo-caption">Radius</div>
<div class="demo-row">
  <ray-button variant="light" radius="xs">xs</ray-button>
  <ray-button variant="light" radius="sm">sm</ray-button>
  <ray-button variant="light" radius="md">md</ray-button>
  <ray-button variant="light" radius="lg">lg</ray-button>
  <ray-button variant="light" radius="full">full</ray-button>
</div>

<div class="demo-caption">Icons, states and links</div>
<div class="demo-row">
  <ray-button variant="default"><ray-icon slot="left" name="plus"></ray-icon>New file</ray-button>
  <ray-button>Continue<ray-icon slot="right" name="chevron-right"></ray-icon></ray-button>
  <ray-icon-button variant="light" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button>
  <ray-button loading>Saving</ray-button>
  <ray-button disabled>Disabled</ray-button>
  <ray-button href="#button" variant="subtle">Link<ray-icon slot="right" name="arrow-up-right"></ray-icon></ray-button>
</div>
<ray-button full-width variant="raised" color="teal">Full width</ray-button>
```
