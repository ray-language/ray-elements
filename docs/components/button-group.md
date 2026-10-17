# Button group

Buttons joined into one control: inner corners squared, borders overlapped. Works with ray-button, ray-icon-button, menus with a button trigger and fields (ray-input, ray-select, ray-search).

Import: `import "@raylang/elements/button-group";` · Category: Buttons

## `<ray-button-group>` (RayButtonGroup, extends RayElement)

role=group; give it a label. The corners come from the --ray-group-radius-* custom properties, which your own components can read too.

Properties:

- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Direction of the group.
- `fullWidth` (attribute `full-width`): boolean, reflects. Fills its container; the children share the width.
- `label`: string. Accessible name (aria-label).

Slots:

- (default): The buttons, fields or menus to join.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-button-group label="Text alignment">
    <ray-button variant="default">Left</ray-button>
    <ray-button variant="default">Center</ray-button>
    <ray-button variant="default">Right</ray-button>
  </ray-button-group>
  <ray-button-group label="Deploy">
    <ray-button>Deploy</ray-button>
    <ray-menu placement="bottom-end">
      <ray-icon-button slot="trigger" variant="filled" label="More deploy options"><ray-icon name="chevron-down"></ray-icon></ray-icon-button>
      <ray-menu-item value="staging">Deploy to staging</ray-menu-item>
      <ray-menu-item value="schedule">Schedule…</ray-menu-item>
    </ray-menu>
  </ray-button-group>
  <ray-button-group label="Zoom">
    <ray-icon-button variant="default" label="Zoom out"><ray-icon name="minus"></ray-icon></ray-icon-button>
    <ray-button variant="default">100%</ray-button>
    <ray-icon-button variant="default" label="Zoom in"><ray-icon name="plus"></ray-icon></ray-icon-button>
  </ray-button-group>
</div>
<div class="demo-row" style="margin-top: 1rem; align-items: flex-start">
  <ray-button-group label="Search packages" style="width: 22rem">
    <ray-input aria-label="Package name" placeholder="Package name" style="flex: 1"></ray-input>
    <ray-button variant="default">Search</ray-button>
  </ray-button-group>
  <ray-button-group orientation="vertical" label="Layout">
    <ray-button variant="default">Top</ray-button>
    <ray-button variant="default">Middle</ray-button>
    <ray-button variant="default">Bottom</ray-button>
  </ray-button-group>
</div>
```
