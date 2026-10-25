# Changelog

All notable changes to ray-elements. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/): before 1.0, a minor version may
change the API.

## [Unreleased]

### Added

- `ray-menu` fires a cancelable `ray-request-open` (`{ event }`) before its
  trigger opens it, ahead of reading the items: the place to fill items that
  depend on what was clicked. A native context menu read them in the same
  `contextmenu` as the app's own listener, so it could show the previous
  click's items.

## [0.8.0] - 2026-10-19

### Added

- Icons with a direction: under `dir="rtl"` the roles that point along the
  text (`ui.next`, `ui.previous`, `ui.first`, `ui.last`, `ui.disclosure`,
  `ui.separator`) are drawn mirrored, the built-in glyph or the app's own
  (pagination, date-picker, breadcrumbs, nav-link, whose open chevron turns
  the other way). `<ray-icon mirror>` does it for an icon of yours (a back
  arrow).
- Keyboard and pointer right to left. Arrow keys follow the reading
  direction (ArrowLeft is forward under `dir="rtl"`) in tabs, radio groups,
  the segmented control, toggle groups, the calendar, the carousel and the
  split. The split drags and sizes its start pane on the right, the carousel
  scrolls toward the left with its next button there, `ray-scroll-area`'s
  shadows, `scrollToEnd()` and `ray-reach-end` (`edge: "left"`) follow, and
  the slider's fill and marks and `ray-indicator`'s `start`/`end` positions
  mirror. The
  color picker stays as it is: a color space is a picture, not text.
- `isRtl(el)` and `inlineKey(key, el)`, for components of your own.
- Right to left in the docs: a README section and the `llms.txt` rules,
  and an **RTL** button on the site that shows every example with
  `dir="rtl"` (remembered; the site around them stays left to right).
- `start`/`end` values for the attributes that name a side, following the
  writing direction: `ray-checkbox`/`ray-switch` `label-position`,
  `ray-accordion` `chevron-position`, `ray-separator` `label-position`,
  `ray-timeline` `align`, `ray-drawer` `position`, `ray-sidebar` `side`
  (its border and its narrow-screen drawer) and `ray-toaster` `position`
  (`top-start`, `bottom-end`…). `left` and `right` stay sides of the
  screen, whatever the direction; `ray-stepper` `icon-position` is now
  `start` (`left` still works).

### Changed

- The components' CSS uses logical properties (`inset-inline-start`,
  `padding-inline-end`, `text-align: start`…) instead of left and right, the
  first step toward right-to-left support: under `dir="rtl"` paddings,
  labels, the switch's thumb, vertical tabs, select and search adornments and
  the like mirror. Nothing changes left to right. Still physical: the
  `left`/`right` values of the attributes that name a side (see the
  `start`/`end` values below) and the color picker. `ray-code` always lays
  code out left to right.
- Floating panels align `-start`/`-end` with the writing direction: under
  `dir="rtl"` a `bottom-start` popover, menu, select, combobox or
  date-picker panel lines up with the right edge of its trigger, and a
  context menu opens to the left of the pointer. The sides (`top`, `bottom`,
  `left`, `right`) stay sides of the screen; nothing changes left to right.
- The defaults that named a side are logical: `end` for `label-position`,
  `chevron-position` and `ray-drawer` `position`, `start` for
  `ray-sidebar` `side`, `ray-timeline` `align` and `ray-stepper`
  `icon-position`, `bottom-end` for `ray-toaster`. Left to right they look
  the same; code that read the default (`drawer.position === "right"`) sees
  the new name. Right to left, a drawer opens from the left, notifications
  stack bottom left and a sidebar's drawer slides in from the right.
- `build` rejects physical CSS in the components unless the line is marked
  `/* physical */`, gradients toward a side included.

### Fixed

- A parent `ray-nav-link` draws its chevron (the icon was never
  painted into the link, rendered after the template).

## [0.7.0] - 2026-10-18

### Added

- `IconName`, the type of icon names: the default set (and `"none"`) for
  completion, any other name still valid. `ray-icon`'s `name` and the `icon`
  of `ray-alert`, `ray-blockquote`, `ray-bottom-nav-item`, `ray-notification`
  and `ray-timeline-item` take it, in TypeScript and in the React and Vue
  wrappers; the VS Code data suggests the names (and the scale of an open
  `size`). The list is generated from the registry, so it cannot drift.
- Filled icons, for a state: `<ray-icon name="star" filled>` draws the
  filled version, or the outline one when there is none. Built in for `user`,
  `info`, `circle-check`, `alert-triangle`, `circle-x`, `folder`, `bell`,
  `star`, `settings`, `home` and `message-circle`; an app adds its own with
  `setIcons({ "name:filled": … })`. `getIcon(name, { filled })`,
  `iconNames({ filled: true })`, and `data-ray-icon-filled` for
  `paintIcons()` in your own components. The current item of a
  `ray-bottom-nav` draws its icon filled.
- `ray-step-dots` `value-text` and `done-text`: the announced text in the
  page's language (`value-text="Asalto {step} de {count}"`), numbers formatted
  with Intl; it was always English ("Round 4 of 12").
- The icon gallery finds icons by what they are for ("favorite" finds `star`,
  "warning" `alert-triangle`), and `llms.txt` lists the icons with a filled
  version (and now `quote`, which it missed).
- Icon roles: the components draw `ui.close`, `ui.remove`, `ui.clear`,
  `ui.expand`, `ui.next`, `ui.checked`… instead of glyph names. Each role
  draws its glyph until the app registers the role, so `setIcons({ close: … })`
  still changes every × and `setIcons({ "ui.remove": … })` only the chips'.
  `iconAliases()` lists them; `llms.txt` too.
- `ray-elements check` warns (`no-filled-icon`) when `filled` is on an icon
  without a filled version; it reads `"name:filled"` keys in `setIcons()`.

### Changed

- `ray-elements check` reports an unregistered icon (`unknown-icon`) in every
  attribute that takes an icon name, not only in `ray-icon`'s `name`.

## [0.6.0] - 2026-10-17

### Added

- `size` of `ray-button`, `ray-icon-button` and `ray-toggle` takes any CSS
  length besides xs…xl; the font, the padding and the icon follow.
  `<ray-icon-button size="5.5rem" radius="full" variant="gradient">` is the big
  main action of a phone screen (start, pause, record).
- `ray-number-input format="duration"`: the value is seconds, shown and typed
  as m:ss (h:mm:ss when min or max reaches an hour; a plain number is
  seconds), with an `aria-valuetext` such as "3 minutes, 15 seconds" in the
  page's language. The form still gets the seconds. `formatDuration`,
  `parseDuration` and `durationText` are exported beside `formatNumber`.
- `ray-ring-progress`: progress as a ring, with the default slot in the
  middle (a countdown's clock, a goal). `value` of `max`, `color`, `size`
  (xs…xl or a length: the diameter), `thickness`, `round-caps`, `show-value`;
  indeterminate without a value; announced as a progressbar.
- `ray-radio-card`: a radio drawn as a card (title, detail, icon, more
  content), in a `ray-radio-group` like a `ray-radio`: arrow keys, the form,
  `required` and `disabled` come from the group, and cards and radios can be
  mixed. Put the cards in a `ray-grid` for columns; `hide-indicator` leaves
  the border and the background alone to show the choice.
- `ray-step-dots`: a row of dots, one per step (done, current, to do), for
  rounds, onboarding pages or a quiz. `count` and `value` (the current step,
  0-based), `color`, `size`, `align`; announced as a progressbar with
  `label` as the step's name ("Round 4 of 12").

## [0.5.2] - 2026-10-17

### Added

- `ray-elements check`, a checker of the markup that uses ray-elements, in
  `@raylang/elements` (`npx ray-elements check src/`; in a raylang app, `node
  node_modules/@raylang/elements/check/cli.js check assets/`) and as
  `@raylang/elements/check` (`checkMarkup()`). It reads HTML, Vue, Svelte,
  Astro, JSX and TSX against the installed version's `custom-elements.json`
  and icons, and reports unknown elements, attributes, slots and events,
  invalid values, `disabled="false"`, unregistered icons, icon buttons
  without a label and literal colors, with a suggestion; JSON output for
  tools and agents. `llms.txt` tells agents to run it.

### Fixed

- `custom-elements.json` and `vscode.html-custom-data.json` list the
  attributes a component inherits from `FieldControl` and `Floating`
  (`ray-number-input` lacked `label`, `name`, `required`…), as the types
  already did.
- They also list the attributes that only set the initial value: `checked`
  on `ray-checkbox` and `ray-switch`, `value` on `ray-checkbox-group` and
  `ray-combobox` (marked `initial = true` in `component.toml`); the API pages
  and `llms-full.txt` say so instead of "property only".
- `ray-radio`: `checked` can be set, as on a native radio (`radio.checked =
  true` makes it the group's value, without events); it was read-only, so
  `<RayRadio checked>` in React 19 threw. Its `checked` attribute, which marks
  the group's initial value, is in the manifests too.
- The bottom navigation's example: its app bar hid on scroll with
  `scroll-behavior="hide"`, not `scroll="hide"` (found by `ray-elements
  check`). The `ray-icon` reference says that `name="none"` draws a blank.

## [0.5.1] - 2026-10-16

### Added

- Docs for AI agents: `llms.txt` (the rules for using the components, and a
  link to each one's API as Markdown, `components/<name>.md`) and
  `llms-full.txt` (the whole reference in one file: components, tokens, icon
  names, the core's types), on the site and in `@raylang/elements` (so also in
  a raylang app's `node_modules/`). Generated from `site/llms.md` and the
  components' metadata.

## [0.5.0] - 2026-10-12

### Removed

- `@raylang/vue`: the `RayDs` alias of the plugin (deprecated in 0.4.0); use
  `RayElements`.

### Changed

- The `elements` raylang package, the tools and `examples/starter`,
  `desktop-app` and `lean-app` need raylang 1.27.48.
- `enableRaylang()` tints the title bar for a chosen theme (light or dark) in
  a `full_content` window too, so the window's appearance follows the theme.
  Before 1.27.48 a title bar color made that bar opaque.

## [0.4.1] - 2026-10-12

### Fixed

- `ray-input` (and `ray-password-input`, `ray-search`) and `ray-number-input`:
  Enter submits the form, as in a native field. Their `<input>` lives in a
  shadow root, so the browser's implicit submission never reached the form.
  The HTML rule: a click on the first submit button (`ray-button
  type="submit"` included; nothing when it is disabled), or, without one, a
  submit when the form has a single text field.
- `base.css` defines `.ray-muted` (secondary text), which the starter already
  used.
- `examples/starter`, `desktop-app` and `lean-app` ask for raylang 1.27.44,
  the first with `[web] package`; `lean-app`'s Add button shows its icon
  (`slot="left"`, not `start`).

## [0.4.0] - 2026-10-11

### Changed

- `@raylang/vue`: the plugin is `RayElements` (`import RayElements from
  "@raylang/vue"; app.use(RayElements)`). `RayDs`, the 0.3.0 name, stays as a
  deprecated alias until 0.5.0.

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
