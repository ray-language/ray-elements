# Changelog

All notable changes to ray-elements. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/): before 1.0, a minor version may
change the API.

## [0.3.0] - 2026-10-11

The first public release, under its final name: the project is **ray-elements**
(formerly ray-ds), the npm packages are `@raylang/elements`, `@raylang/react` and
`@raylang/vue`, and the raylang package is `elements` (`elements/bridge`). The
bridge protocol key and the page event are `ray-elements` and
`ray-elements:menu`.

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

- `@raylang/elements`, `@raylang/react` and `@raylang/vue` packages (not yet on
  npm): typed (`.d.ts`), `custom-elements.json`, VS Code HTML data, React
  wrappers and Vue wrappers with `v-model`. Each names its source (repository,
  directory, issues) and publishes with public access; the repository's
  `repository` and `homepage` live in `ray-elements.toml`.
- Only what you use: `@raylang/elements/<name>` (one component and what it
  uses) and `@raylang/elements/core` (the API alone); `@raylang/react` and
  `@raylang/vue` are a module per component with `sideEffects: false`, so a
  bundle keeps the wrappers it imports and their elements (a button with an
  icon: 9.5 KB gzip instead of 94 KB). `examples/lean-app` does it in a raylang
  app: per-component modules, and a dialog loaded on first open. `tests/packages` checks it with esbuild,
  and compiles the generated declarations with `tsc`.
- The `release` workflow, on a version tag: the raylang package to its
  repository (`git subtree split`), the npm packages (`NPM_TOKEN` or trusted
  publishing, with provenance from a public repository) and the site.
- Tools: `tools/run.sh add` copies components (and what they
  need) into an app; `wrap` generates types and React/Vue wrappers for an
  app's own components.

### raylang

- A native bridge between the page and a raylang program: `elements/bridge`
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
- The raylang package `elements` (raylang 1.27.44 or later): it carries
  `@raylang/elements` as published (`elements/web`, `[web] package`), and the
  app's pages import it by its npm name, as with a bundler
  (`import "@raylang/elements/button"`): raylang serves it at
  `ray://app/node_modules/@raylang/elements/` with an import map, under
  `ray run` and in a native binary, and links it into the app's
  `node_modules/` so the editor resolves the imports with their types;
  `examples/starter` is the smallest app with it. It is published to its own
  repository, `github.com/ray-language/elements` (`git+https://…/elements@v0.3.0`),
  split out of `elements/` with its history on every version tag.

### Docs site

- A page per component with live examples, their code in HTML, React and
  Vue, and the API generated from `component.toml`; a catalog with
  thumbnails, ⌘K search, guides and the foundations page.
- `tools/run.sh site` writes the site ready to publish, with a
  404 page.

[0.3.0]: https://github.com/ray-language/ray-elements/releases/tag/v0.3.0
