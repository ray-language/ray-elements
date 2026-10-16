# Nav link

A sidebar/navigation item: icon, label, description, badge, active state, and nested nav links that collapse under it.

Import: `import "@raylang/elements/nav-link";` · Category: Navigation

## `<ray-nav-link>` (RayNavLink, extends RayElement)

A link with href (aria-current=page when active), or a button that toggles its nested links.

Properties:

- `label`: string. Text.
- `description`: string. Second line.
- `href`: string, reflects. Makes it a link (ignored when it has nested links).
- `active`: boolean, reflects. The current page or section.
- `opened`: boolean, reflects. Nested links are shown.
- `disabled`: boolean, reflects. Not interactive.
- `variant`: `light` | `filled` | `subtle`, default `light`, reflects. Style of the active state.
- `color`: string, reflects. Active color.
- `iconOnly` (attribute `icon-only`): boolean, reflects. Only the icon (left section), centered; the label becomes its accessible name and tooltip. A collapsed ray-sidebar sets it.

Events:

- `ray-toggle` (detail `{ opened: boolean }`): Nested links were shown or hidden.

Slots:

- (default): Nested ray-nav-link elements.
- `left`: Icon.
- `right`: Badge or count.

Parts (`::part()`):

- `link`: The inner <a> or <button>.
- `children`: The nested links.

Methods and properties:

- `readonly links: RayNavLink[]`: The nested nav links.

Vue `v-model`: `opened` (updated on ray-toggle).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<nav style="width: 16rem; display: grid; gap: 0.125rem">
  <ray-nav-link label="Dashboard" href="#nav-link" active>
    <svg slot="left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
  </ray-nav-link>
  <ray-nav-link label="Builds" description="3 running" href="#nav-link">
    <ray-badge slot="right" size="xs" color="teal">3</ray-badge>
  </ray-nav-link>
  <ray-nav-link label="Settings" opened>
    <ray-nav-link label="General" href="#nav-link"></ray-nav-link>
    <ray-nav-link label="Security" href="#nav-link"></ray-nav-link>
    <ray-nav-link label="Billing" href="#nav-link" disabled></ray-nav-link>
  </ray-nav-link>
  <ray-nav-link label="Filled variant" variant="filled" active href="#nav-link"></ray-nav-link>
</nav>
```
