# Changelog

All notable changes to ray-ds. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/): before 1.0, a minor version may
change the API.

## [0.3.0] - Unreleased

The first public release.

### Components (68)

- **Buttons:** button, button group, icon button, toggle, toggle group.
- **Inputs:** input, number input, password input, search, textarea, select,
  combobox (searchable, multiple, creatable), checkbox and checkbox group,
  radio group, switch, segmented control, slider, date picker and calendar,
  color picker and color input, file upload, path input.
- **Navigation:** tabs, nav link, sidebar, bottom nav, breadcrumbs, stepper,
  pagination.
- **Overlays:** dialog (the modal, with `confirmDialog()`), drawer, popover,
  tooltip, menu (also as a context menu), command palette.
- **Data display:** icon, badge, avatar, indicator, blockquote, code
  (pluggable highlighter), kbd, accordion, table, stat, carousel, timeline,
  attachment.
- **Feedback:** alert, spinner, progress, empty state, skeleton,
  notifications (`notify()`).
- **Layout:** app shell, app bar, stack, group, grid, container, center,
  scroll area, card, separator, split, status bar, aspect ratio.
- **Theme:** theme toggle.

### Foundations

- Design tokens in `tokens.toml` → `dist/tokens.css` and `tokens.json`:
  palette, light and dark themes, primary color, spacing, radius, shadows,
  motion, charts; contrast checked at build time (AA).
- Runtime theming: `setTheme()`, `setPrimary()`, `definePrimary()` with any
  CSS color, `chartTheme()` for chart libraries.
- `RayElement`, `FormControl`, `FieldControl` and `Floating` base classes for
  components of your own; an icon registry (`setIcons()`).

### Integrations

- `@ray-ds/elements`, `@ray-ds/react` and `@ray-ds/vue` packages (not yet on
  npm): typed (`.d.ts`), `custom-elements.json`, VS Code HTML data, React
  wrappers and Vue wrappers with `v-model`.
- Tools: `ray run tools/src/main.ray add` copies components (and what they
  need) into an app; `wrap` generates types and React/Vue wrappers for an
  app's own components.

### raylang

- A native bridge between the page and a raylang program: `ray_ds/bridge`
  (`bridge.handle(e)` in the app's event loop) and `enableRaylang()` in the
  page (`core/raylang.js`). Components ask a host registry (`core/host.js`),
  never the bridge, and keep their web behavior without one.
- With it: `ray-file-upload native` opens the system file dialog and gives
  paths (`paths`), `ray-path-input` gets a Browse… button for a file, a
  folder or a save target, `confirmDialog()` asks with the system dialog,
  `ray-menu native` opens as the system's context menu, and
  `ray-command-palette native-menus` lists and runs the app's menu bar
  (declared with `bridge.menu`; `bridge.route` gives the app the menu event).
- The window: in a `full_content` window `ray-app-shell` turns its header
  into the title bar (room for the window buttons, drags the window;
  `dragRegion()` for any element), the window's background and title bar
  follow the theme, and `trackEdits(form)` shows unsaved changes.
- An "In a raylang app" section on the pages of the components that use the
  bridge, and `examples/desktop-app`, a folder browser that uses all of it.
- The raylang package `ray_ds`: `ray_ds/assets` (generated) serves every
  component, `tokens.css` and `base.css` from the program with
  `assets.mount("ray-ds")`, under `ray run` and in a native binary;
  `examples/starter` is the smallest app with it.

### Docs site

- A page per component with live examples, their code in HTML, React and
  Vue, and the API generated from `component.toml`; a catalog with
  thumbnails, ⌘K search, guides and the foundations page.
- `ray run tools/src/main.ray site` writes the site ready to publish, with a
  404 page.

[0.3.0]: https://github.com/ray-language/ray-ds/releases/tag/v0.3.0
