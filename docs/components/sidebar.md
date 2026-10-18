# Sidebar

The side navigation of an app shell: header, content and footer; on wide screens it collapses to an icon rail, below a breakpoint it becomes an off-canvas drawer. toggle() does the right thing for the screen.

Import: `import "@raylang/elements/sidebar";` · Category: Navigation

## `<ray-sidebar>` (RaySidebar, extends RayElement)

Put ray-sidebar-group + ray-nav-link (with an icon in slot=left) inside. Collapsed, nav links show only their icon (the label becomes the tooltip) and the host has the collapsed attribute, so your own header/footer content can hide with CSS (ray-sidebar[collapsed] .brand-name { display: none }).

Properties:

- `collapsed`: boolean, reflects. Wide screens: an icon rail instead of the full panel.
- `open`: boolean, reflects. Narrow screens: the drawer is shown (modal, focus trapped; Escape, backdrop click or a followed link close it).
- `side`: `left` | `right`, default `left`, reflects. The edge it sits on.
- `variant`: `sidebar` | `floating`, default `sidebar`, reflects. A panel against the edge, or a floating card with a margin.
- `width`: string. Width when expanded (CSS length). Default 16rem.
- `collapsedWidth` (attribute `collapsed-width`): string. Width of the icon rail. Default 3.5rem.
- `breakpoint`: string, default `48em`. At this viewport width and below, it becomes a drawer.
- `label`: string, default `Sidebar`. Accessible name of its navigation.

Events:

- `ray-toggle` (detail `{ collapsed: boolean; open: boolean; mobile: boolean }`): After toggle().
- `ray-open`: The drawer opened (narrow screens).
- `ray-close`: The drawer closed (narrow screens).

Slots:

- (default): The navigation: ray-sidebar-group and ray-nav-link elements.
- `header`: Top area (brand, workspace switcher).
- `footer`: Bottom area (user, settings).

Parts (`::part()`):

- `panel`: The panel (in the drawer on narrow screens).
- `header`: The header area.
- `content`: The scrolling <nav>.
- `footer`: The footer area.
- `drawer`: The <dialog> used on narrow screens.

Methods and properties:

- `toggle(): void`: Collapses/expands on wide screens; opens/closes the drawer on narrow ones.
- `readonly mobile: boolean`: Whether it is in drawer mode (at or below the breakpoint).

## `<ray-sidebar-group>` (RaySidebarGroup, extends RayElement)

A titled section of nav links; the title fades out (keeping its height) when the sidebar collapses.

Properties:

- `label`: string. Section title.

Slots:

- (default): ray-nav-link elements.

Parts (`::part()`):

- `label`: The title.
- `items`: The links container.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="sidebar-demo" style="display: flex; height: 24rem; overflow: hidden; border: 1px solid var(--ray-border); border-radius: var(--ray-radius-md); background: var(--ray-background)">
  <ray-sidebar id="demo-sidebar" label="Project">
    <div slot="header" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.5rem; height: 2.25rem; overflow: hidden">
      <ray-avatar name="ray remote" size="sm" color="blue" radius="md" variant="filled"></ray-avatar>
      <strong class="demo-sidebar-name" style="white-space: nowrap; font-size: var(--ray-font-size-sm)">ray-remote</strong>
    </div>
    <ray-sidebar-group label="Project">
      <ray-nav-link label="Files" href="#sidebar" active><ray-icon slot="left" name="file"></ray-icon></ray-nav-link>
      <ray-nav-link label="Terminal" href="#sidebar"><ray-icon slot="left" name="terminal"></ray-icon></ray-nav-link>
      <ray-nav-link label="Run" href="#sidebar"><ray-icon slot="left" name="play"></ray-icon><ray-badge slot="right" size="xs" color="green">3</ray-badge></ray-nav-link>
    </ray-sidebar-group>
    <ray-sidebar-group label="Workspace">
      <ray-nav-link label="Folders" href="#sidebar"><ray-icon slot="left" name="folder"></ray-icon></ray-nav-link>
      <ray-nav-link label="Calendar" href="#sidebar"><ray-icon slot="left" name="calendar"></ray-icon></ray-nav-link>
    </ray-sidebar-group>
    <ray-nav-link slot="footer" label="Settings" href="#sidebar"><ray-icon slot="left" name="settings"></ray-icon></ray-nav-link>
  </ray-sidebar>
  <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-bottom: 1px solid var(--ray-border)">
      <ray-icon-button id="demo-sidebar-toggle" variant="subtle" label="Toggle sidebar"><ray-icon name="panel-left"></ray-icon></ray-icon-button>
      <span style="font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground)">Files</span>
    </div>
    <div style="padding: 1rem; color: var(--ray-muted-foreground); font-size: var(--ray-font-size-sm)">The button collapses the sidebar to icons; on a narrow screen it opens it as a drawer.</div>
  </div>
</div>
<style>
  ray-sidebar[collapsed] .demo-sidebar-name { display: none; }
</style>
<script type="module">
  const sidebar = document.getElementById("demo-sidebar");
  document.getElementById("demo-sidebar-toggle").addEventListener("click", () => sidebar.toggle());
</script>
```
