# Group

Its children in a row (Mantine's Group): spaced by the space scale, centered, wrapping when they do not fit. Toolbars, form actions, chips.

Import: `import "@raylang/elements/group";` · Category: Layout

## `<ray-group>` (RayGroup, extends RayElement)

A flex row on the host: the children are laid out directly, no wrapper.

Properties:

- `gap`: string, default `md`, reflects. Space between children: xs…xl (the space scale), a number (px) or any CSS length.
- `align`: `center` | `start` | `end` | `stretch` | `baseline`, default `center`, reflects. Cross-axis alignment.
- `justify`: `start` | `center` | `end` | `space-between` | `space-around` | `space-evenly`, default `start`, reflects. Main-axis distribution: space-between for a title on one side and actions on the other.
- `nowrap`: boolean, reflects. Keeps the children on one line.
- `grow`: boolean, reflects. The children share the width equally.

Slots:

- (default): The children.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A page header: title on one side, actions on the other</div>
<ray-group justify="space-between" class="demo-toolbar-box">
  <ray-group gap="sm">
    <ray-avatar name="Ray Remote" color="violet" radius="md"></ray-avatar>
    <ray-stack gap="0"><strong>ray-remote</strong><span class="demo-muted">Desktop app · 12 members</span></ray-stack>
  </ray-group>
  <ray-group gap="xs">
    <ray-button variant="default" size="sm"><ray-icon slot="left" name="settings"></ray-icon>Settings</ray-button>
    <ray-button size="sm"><ray-icon slot="left" name="plus"></ray-icon>New build</ray-button>
  </ray-group>
</ray-group>

<div class="demo-caption">Wrapping chips, growing buttons, one line</div>
<ray-stack gap="lg">
  <ray-group gap="xs">
    <ray-badge variant="light" normal-case size="lg">raylang</ray-badge>
    <ray-badge variant="light" color="teal" normal-case size="lg">web components</ray-badge>
    <ray-badge variant="light" color="violet" normal-case size="lg">design tokens</ray-badge>
    <ray-badge variant="light" color="orange" normal-case size="lg">accessibility</ray-badge>
    <ray-badge variant="light" color="pink" normal-case size="lg">React</ray-badge>
    <ray-badge variant="light" color="green" normal-case size="lg">Vue</ray-badge>
    <ray-badge variant="light" color="gray" normal-case size="lg">dark mode</ray-badge>
  </ray-group>
  <ray-group grow gap="sm" class="demo-narrow">
    <ray-button variant="default">Cancel</ray-button>
    <ray-button>Save changes</ray-button>
  </ray-group>
  <ray-group nowrap gap="sm" class="demo-narrow demo-clip">
    <ray-avatar name="Ada Lovelace" color="pink" size="sm"></ray-avatar>
    <span class="demo-ellipsis">nowrap keeps the row on one line; this text truncates instead of wrapping under the avatar.</span>
  </ray-group>
</ray-stack>

<div class="demo-caption">justify and align</div>
<ray-stack gap="sm">
  <ray-group justify="start" class="demo-frame"><span class="demo-block w"></span><span class="demo-block w"></span><span class="demo-block w"></span><code>start</code></ray-group>
  <ray-group justify="center" class="demo-frame"><span class="demo-block w"></span><span class="demo-block w"></span><span class="demo-block w"></span><code>center</code></ray-group>
  <ray-group justify="end" class="demo-frame"><code>end</code><span class="demo-block w"></span><span class="demo-block w"></span><span class="demo-block w"></span></ray-group>
  <ray-group justify="space-between" class="demo-frame"><span class="demo-block w"></span><span class="demo-block w"></span><span class="demo-block w"></span></ray-group>
  <ray-group align="end" class="demo-frame"><span class="demo-block w" style="height: 2.5rem"></span><span class="demo-block w"></span><span class="demo-block w" style="height: 1.75rem"></span><code>align="end"</code></ray-group>
</ray-stack>
```
