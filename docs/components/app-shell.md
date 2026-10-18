# App shell

The frame of an app (Mantine's AppShell): header, navbar, main, aside and footer on wide screens; on phones one column with a bottom bar. The main content scrolls, the bars stay.

Import: `import "@raylang/elements/app-shell";` · Category: Layout

## `<ray-app-shell>` (RayAppShell, extends RayElement)

The layout follows the shell's own width (a phone-sized frame shows the phone layout). Below breakpoint the navbar and the aside take no room (a ray-sidebar there still opens as its drawer) and the bottom slot shows. It fills the window's height (100dvh) unless sized. In a std/ui full_content window (ray-elements/core/raylang.js) the header becomes the title bar: room for the window buttons, and it drags the window; with layout="alt" or no header, the navbar and main start below it.

Properties:

- `layout`: `default` | `alt`, default `default`, reflects. default: the header across the top; alt: the navbar full height, the header beside it.
- `breakpoint`: string, default `48em`. Width (px, em or rem) below which it takes the phone layout.
- `padding`: string, reflects. Padding of the main area: xs…xl, a number (px) or a CSS length.

Events:

- `ray-breakpoint` (detail `{ mobile: boolean }`): It switched between the wide and the phone layout.

Slots:

- (default): The main content (it scrolls).
- `header`: Top bar: a ray-app-bar or a header of your own.
- `navbar`: Side navigation (a ray-sidebar). Wide screens only.
- `aside`: A panel on the other side (details, an inspector). Wide screens only.
- `footer`: Under the main content.
- `bottom`: Phones only: a ray-bottom-nav.

Parts (`::part()`):

- `shell`: The grid.
- `header`: The header area.
- `navbar`: The navbar area.
- `main`: The scrolling main area.
- `aside`: The aside area.
- `footer`: The footer area.
- `bottom`: The bottom bar area.

Methods and properties:

- `readonly scroller: HTMLElement`: The element that scrolls the main content.
- `readonly mobile: boolean`: Whether it is in the phone layout.

## In a raylang app

In a `std/ui` window opened as `full_content` (the page under a transparent title bar, macOS), with [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge), the header becomes the title bar: at least as tall, with room for the window buttons, and dragging it moves the window (buttons in it stay buttons). With `layout="alt"` or without a header, the navbar and the main content start below the title bar.

```ray
var o = ui.options(1100, 720);
o.kind = "full_content";
let h = ui.open_with("Builds", "ray://app/index.html", o)?;
```

The bridge also keeps the window's background and title bar in the theme's background, so switching to dark, resizing or reopening never flashes the other theme.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">One app, three widths</div>
<ray-group justify="space-between" class="demo-device-bar">
  <ray-segmented-control id="demo-shell-width" value="phone" size="xs" aria-label="Frame width">
    <option value="phone">Phone · 390</option>
    <option value="tablet">Tablet · 820</option>
    <option value="desktop">Desktop · full</option>
  </ray-segmented-control>
  <span class="demo-muted" id="demo-shell-mode">phone layout: app bar, content, bottom nav</span>
</ray-group>
<div class="demo-device" id="demo-device" data-size="phone">
  <iframe id="demo-shell-frame" src="../src/components/app-shell/demo.html" title="ray-app-shell demo: an app in a device"></iframe>
</div>
<p class="demo-muted">The app is a page of its own (<a href="../src/components/app-shell/demo.html" target="_blank" rel="noopener">open it</a>) in an iframe: its drawers, menus and sheets open inside the device, and the shell picks its layout from the frame's width.</p>

<script type="module">
  // Frame width: the shell inside measures itself and picks its layout.
  const device = document.getElementById("demo-device");
  const frame = document.getElementById("demo-shell-frame");
  const label = document.getElementById("demo-shell-mode");
  document.getElementById("demo-shell-width").addEventListener("change", (e) => { device.dataset.size = e.target.value; });
  const watch = () => {
    const shell = frame.contentDocument?.querySelector("ray-app-shell");
    if (!shell) return;
    const mode = () => {
      label.textContent = shell.mobile ? "phone layout: app bar, content, bottom nav" : "wide layout: header, sidebar, content, aside";
    };
    shell.addEventListener("ray-breakpoint", mode);
    frame.contentWindow.customElements.whenDefined("ray-app-shell").then(mode);
  };
  frame.addEventListener("load", watch);
  if (frame.contentDocument?.readyState === "complete") watch();
</script>
```
