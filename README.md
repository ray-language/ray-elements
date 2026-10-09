# ray-ds

Web components (Shadow DOM, no dependencies) inspired by shadcn/ui (semantic
tokens, copy-the-code distribution) and Mantine (10-shade color scales, sizes
`xs`–`xl`, `color` + `variant` on every component).

**ray-ds is framework-agnostic.** The components are standard custom elements:
use them in any web app — plain HTML, React or Vue, in a browser or any
webview. Nothing in a component requires raylang.

**It comes with extras for raylang apps.** It loads as plain ES modules from
`ray://app` in a `std/ui` window with no build step, all its tooling (tokens,
contrast checks, docs, webview tests) is written in raylang in `tools/`, and
the examples are raylang apps. A native bridge (`ray_ds/bridge` in the program,
`core/raylang.js` in the page) gives the components what a browser cannot:
system file dialogs with real paths (`ray-file-upload native`,
`ray-path-input`), native confirmations (`confirmDialog()`), native context
menus (`ray-menu native`), the app's menu bar in the command palette
(`native-menus`) and the window (`ray-app-shell` under a transparent title
bar, window colors that follow the theme, `trackEdits()` for the unsaved
mark). A raylang package (`ray_ds/assets`) serves the whole design system
from the program, without npm. See [RAYLANG.md](RAYLANG.md).

## Layout

```
tokens.toml            design tokens: the single source of truth
ray-ds.toml            npm package metadata (scope, version)
src/core/core.js       RayElement base class, css``, define(), theme API
src/core/styles.js     shared sizes, radius, color variants, loader
src/core/form.js       FormControl / FieldControl (ElementInternals, label/description/error)
src/core/floating.js   base of popover/menu/tooltip (Popover API, trigger wiring)
src/core/position.js   anchored placement with flip and shift
src/core/focus.js      tabbables through shadow roots and slots
src/core/host.js       the native host registry components ask (file dialogs, confirm)
src/core/raylang.js    the page's half of the raylang bridge: enableRaylang()
src/core/base.css      optional document defaults (layer ray.base)
src/core/core.d.ts     hand-written types of the core runtime
src/integrations/      React and Vue runtime helpers (createComponent)
src/components/<name>/ <name>.js + component.toml (metadata) + example.html
src/index.js           generated: imports every component
dist/                  generated: tokens.css, tokens.json
docs/                  generated: index.html, foundations.html, components.html (the catalog), components/<component>.html (a page each, and all.html with every one), code/<component>.html (each example's code, loaded on demand)
index.html             generated: redirects the server root to docs/
tests/                 *.test.js run in the real webview + harness.js
tools/                 raylang project: the ray-ds CLI
ray_ds/                raylang package: assets.ray (generated: ray-ds served from the program), bridge.ray
packages/               generated npm packages: elements, react, vue
examples/desktop-form/ std/ui app using components copied with `add`
examples/desktop-app/  std/ui app using the raylang package and the native bridge
examples/starter/      the smallest std/ui app with the raylang package, to copy
examples/react-app/    std/ui + Vite + React app using @ray-ds/react
examples/vue-app/      std/ui + Vite + Vue app using @ray-ds/vue
examples/extending/    app components on the extension API (+ `wrap` output)
```

## Components

| Category | Tags |
|---|---|
| Buttons | `ray-button` (incl. `raised`: a physical key that sinks when pressed), `ray-icon-button`, `ray-toggle` (two-state, aria-pressed; a raised one latches down), `ray-toggle-group` (single or multiple selection, joined or spaced), `ray-button-group` |
| Inputs | `ray-input`, `ray-number-input` (+/− with hold-to-repeat, min/max/step, decimals, prefix/suffix, thousands), `ray-combobox` (a searchable select; `multiple` chips, `creatable` tags, clearable, groups), `ray-search`, `ray-textarea`, `ray-select`, `ray-checkbox` + `ray-checkbox-group` (one entry per value, max, required), `ray-switch`, `ray-radio-group` + `ray-radio`, `ray-segmented-control`, `ray-slider`, `ray-date-picker` + `ray-calendar`, `ray-color-picker` + `ray-color-input` (saturation area, hue and opacity sliders, swatches; a text field with the picker in a dropdown and an eyedropper; hex, rgb or hsl with or without alpha), `ray-file-upload` (drop zone: drag, click or paste; type/size/count checks; files listed as attachments; submitted with the form; `native`: real paths from the system dialog in a std/ui window), `ray-path-input` (a file, folder or save path; Browse… opens the system dialog in a std/ui window) |
| Navigation | `ray-tabs` + `ray-tab` + `ray-tab-panel`, `ray-nav-link`, `ray-sidebar` + `ray-sidebar-group` (icon rail on wide screens, drawer on narrow ones), `ray-bottom-nav` + `ray-bottom-nav-item` (a phone app's tab bar: icons, labels, badges, a raised action, hides on scroll), `ray-breadcrumbs` + `ray-breadcrumb` (collapsible with max-items), `ray-stepper` + `ray-step` (wizards: loading, error, revisit completed steps), `ray-pagination` |
| Overlays | `ray-dialog` (+ `confirmDialog()`), `ray-drawer` (any edge, modal or modeless), `ray-popover`, `ray-tooltip`, `ray-menu` + `ray-menu-item` / `-label` / `-divider` (also as context menu), `ray-command-palette` (⌘K) |
| Data display | `ray-timeline` + `ray-timeline-item` (reached items, icon or avatar bullets, line variants), `ray-icon`, `ray-badge`, `ray-avatar`, `ray-indicator` (a dot or label on any element), `ray-blockquote`, `ray-code` (copy, line numbers, highlighted and diff lines; a built-in highlighter or any library via `setHighlighter()`), `ray-kbd` (raised, filled or outline), `ray-accordion` + `ray-accordion-item`, `ray-table`, `ray-stat`, `ray-carousel` (scroll-snap, swipe, autoplay), `ray-attachment` + `ray-attachments` |
| Feedback | `ray-alert`, `ray-spinner`, `ray-progress`, `ray-empty-state`, `ray-skeleton`, `ray-notification` + `ray-toaster` (`notify()` with an optional action, `updateNotification()`, `hideNotification()`; a stack that spreads on hover, tap or focus, swipe to dismiss) |
| Layout | `ray-app-shell` (header, navbar, main, aside, footer; a phone layout with a bottom bar below its breakpoint, measured on itself), `ray-app-bar` (a phone screen's top bar: back, title, actions; elevates or hides on scroll), `ray-stack`, `ray-group`, `ray-grid` (columns per width of the grid itself, spans, auto-fill), `ray-container`, `ray-center`, `ray-scroll-area` (themed scrollbar, edge shadows, `ray-reach-end`), `ray-card`, `ray-separator`, `ray-split` (resizable panes), `ray-statusbar` + `ray-statusbar-item`, `ray-aspect-ratio` |

Server-rendered pages without JS get `<table class="ray-table">` (plus
`ray-table-striped`, `ray-table-bordered`) from `base.css`.
| Theme | `ray-theme-toggle` |

Shared conventions (Mantine-style): `size` = `xs`…`xl` (default `sm`), `radius`,
`color` = a palette color or any CSS color (default: primary), `variant`
(`filled`, `light`, `outline`, `subtle`, `default`…). Form controls are
form-associated: they submit under `name`, validate (`required`, `pattern`,
`type=email`…), reset with the form and follow a disabled `<fieldset>`; they
take `label`, `description` and `error` and wire the ARIA inside their shadow
root. The `value`/`checked` attributes are initial values; the properties hold
the current ones.

Overlays use the platform: `ray-dialog` is a native modal `<dialog>`; popovers,
menus, tooltips and the toaster are `[popover]` elements in the top layer
(never clipped, above everything), positioned in JS (`core/position.js`: flip +
shift) since CSS anchor positioning is not in every webview yet. Keyboard
behavior follows the WAI-ARIA patterns (menu button, tabs, accordion, radio
group). While a modal dialog is open, notifications move into it so they stay
clickable (a modal makes the rest of the page inert). Full API: `docs/components.html` (generated from each
`component.toml`).

### Variants

| Component | `variant` |
|---|---|
| button, icon-button | filled · light · outline · subtle · default · transparent · gradient |
| badge | light · filled · outline · dot · default · gradient |
| alert | light · filled · outline · default · transparent |
| avatar | light · filled · outline · default |
| card | default · filled · outline |
| checkbox, radio (group or radio) | filled · outline |
| input, textarea, select | default · filled · unstyled |
| tabs | default · outline · pills |
| accordion | default · contained · separated · filled |
| nav-link | light · filled · subtle |
| separator | solid · dashed · dotted |
| statusbar | default · accent |

Color variants take any palette color or CSS color in `color`; `gradient`
takes `gradient="from to [deg]"` (default: the `--ray-gradient-*` tokens; the
text is white, so keep both ends dark enough). Your own variants:
``RayButton.extendStyles(css`[data-variant="brand"] { … }`)`` — see
[EXTENDING.md](EXTENDING.md).

### Icons

Every icon a component draws (close, chevrons, check, search, sort…) comes
from one registry. Switch the whole set, or add names for `<ray-icon>`:

```js
import { setIcons, iconNames } from "@ray-ds/elements";
setIcons({ close: '<svg viewBox="0 0 24 24">…</svg>', "chevron-down": svgElement, logo: "…" });
```

Icons are SVG markup (or an SVGElement) drawn with `currentColor`; mounted
components repaint. `--ray-icon-size` and `--ray-icon-stroke` tune them
system-wide. In your markup: `<ray-icon name="info" label="Information">`
(decorative without `label`). Register icons from your code only — the markup
is inserted as HTML.

## Commands

Run from `ray-ds/` (or `ray-ds/tools/`):

```sh
ray run tools/src/main.ray build                 # tokens + docs + package
ray run tools/src/main.ray tokens [--check]      # tokens.toml -> dist/tokens.*, docs/foundations.html
ray run tools/src/main.ray docs                  # component.toml + *.md -> docs/ (site), src/index.js
ray run tools/src/main.ray add button input --into ../my-app/assets/ray-ds
ray run tools/src/main.ray package               # packages/{elements,react,vue}
ray run tools/src/main.ray site --base /ray-ds/  # build, then the site ready to publish in dist/site/
ray run tools/src/main.ray wrap --components DIR --out DIR   # types + wrappers for an app's components
ray run tools/src/main.ray webtest [FILTER]      # tests/*.test.js in a std/ui webview
(cd tools && ray test)                           # unit tests of the tools
```

### Brand

The mark ("Kit") is three tiles of the raylang ocean palette plus the raylang
emblem as one more piece. `docs` generates it from `tools/src/site/brand.ray`
into `brand/`: `logo.svg` (light grounds), `logo-dark.svg`, `logo-16.svg`
(without Manta's horns, per the raylang brand manual), `icon.svg` (app icon) and
`favicon.svg`. The wordmark is "ray" in ray blue, the dot in aqua, "ds" in ink.

### Viewing the docs

Serve the **ray-ds directory itself** (not `docs/`) and open the URL it prints:

```sh
cd ray-ds
ray serve . --port 0      # prints: serving . at http://127.0.0.1:<port>/
```

`http://127.0.0.1:<port>/` redirects to the site in `/docs/`: the landing, this
guide, the components, the foundations (token specimen), extending and charts —
all generated by `docs`/`tokens` from `component.toml`, `tokens.toml` and the
`.md` files, inside the layout of `tools/src/site/layout.ray.html` (a compiled
raylang template; its CSS, JS and logo live in `site/`). The pages load `../dist` and `../src`, so
served from `docs/` (or opened as `file://`, where ES modules do not load) they
show a banner saying so instead of rendering. `--port 0` picks a free port;
`--port 8123` works too if you want a fixed one.

`tokens` fails if a `[checks] aa` pair is below 4.5:1 in either scheme, and
warns for every palette color whose filled/light/outline variant text is.

### In a raylang app, from the package

`ray_ds/` is a raylang package, published to its own repository:
`ray_ds = "git+https://github.com/ray-language/ray_ds@v0.3.0"` in
`[dependencies]` (or `path:` to `ray_ds/` of a checkout), then
`assets.mount("ray-ds")` (`import ray_ds/assets;`) serves every component,
`tokens.css` and `base.css` from the program, the same under `ray run` and in
a native binary.
`examples/starter` is the smallest such app; see [RAYLANG.md](RAYLANG.md).

### Adding components to an app

`add` copies, shadcn-style: the code becomes the app's own.

```
<into>/tokens.css  base.css  core/*.js  components/<name>/…  index.js
```

It also copies what a component requires (`switch` brings `checkbox`),
regenerates `index.js` with every component present, and never replaces a
file the app has modified unless `--overwrite` (it reports it instead). `--all`
adds everything. In a std/ui app, serve the directory with
`ui.mount_dir("", "assets")` (or `ui.mount_embed` in a bundle) and load:

```html
<link rel="stylesheet" href="ray-ds/tokens.css">
<script type="module" src="ray-ds/index.js"></script>
```

See `examples/desktop-form` (`ray run src/main.ray --check` fills and submits
its form by script and checks what reaches the raylang side), and
`examples/desktop-app` for the native bridge: a folder browser under a
transparent title bar, with the system dialogs, a native context menu and the
menu bar in the command palette (`cd examples/desktop-app && ray run`, or
`ray run src/main.ray --check` to drive it with scripted dialogs).

## React and Vue

`package` generates three npm packages from the same `component.toml` files:

| Package | Contents |
|---|---|
| `@ray-ds/elements` | the components, `tokens.css`, `base.css`, `index.js` (registers every element, re-exports the API), `ray-ds.d.ts` (a class per element, `HTMLElementTagNameMap`, typed `detail` of events), `custom-elements.json`, `vscode.html-custom-data.json` |
| `@ray-ds/react` | a component per element (`RayButton`…): declared props are set as DOM properties, events are `on` + PascalCase (`onRaySelect`, `onChange`); React 18 and 19 |
| `@ray-ds/vue` | a component per element with `v-model` where it makes sense (`value`, `checked`, `open`), `app.use(RayDs)` and `GlobalComponents` types |

```tsx
// React
import "@ray-ds/elements/tokens.css";
import { RayInput, RayMenu, RayMenuItem, RayButton } from "@ray-ds/react";

<RayInput label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} />
<RayMenu onRaySelect={(e) => run(e.detail.value)}>
  <RayButton slot="trigger">Actions</RayButton>
  <RayMenuItem value="rename">Rename</RayMenuItem>
</RayMenu>
```

```vue
<!-- Vue (app.use(RayDs) in main.ts) -->
<RayInput v-model="name" label="Name" required />
<RaySwitch v-model="enabled" label="Enabled" />
<RayDialog v-model="open" label="Confirm" @ray-close="onClose">…</RayDialog>
```

Use them from an app with `file:` dependencies on `ray-ds/packages/*` and
`resolve.preserveSymlinks: true` (Vite) / `"preserveSymlinks": true` (tsconfig),
so `react`/`vue` resolve from the app and a re-run of `package` is picked up
without reinstalling. The examples are raylang apps made with
`ray new <name> --frontend react-ts|vue-ts`:

```sh
cd examples/react-app              # or examples/vue-app
npm --prefix frontend install
ray dev                            # Vite dev server (HMR) inside a std/ui window
npm --prefix frontend run typecheck  # the generated .d.ts checked by tsc / vue-tsc
npm --prefix frontend run build && ray run src/main.ray --check
```

`--check` drives the built page in the real webview like a user (typing,
choosing, submitting, the menu opening a controlled dialog) and checks both
directions: what reaches raylang through `window.ray.request`, and the
framework state rendered back into the components. The dev servers use high
ports (45173, 45174).

## Using it in a page

```html
<link rel="stylesheet" href="ray-ds/dist/tokens.css">
<link rel="stylesheet" href="ray-ds/src/core/base.css"> <!-- optional -->
<script type="module" src="ray-ds/src/index.js"></script>

<ray-input label="Email" name="email" type="email" required></ray-input>
<ray-button type="submit">Save</ray-button>
```

Style your own markup with the tokens:

```css
.panel {
  background: var(--ray-card);
  color: var(--ray-card-foreground);
  border: 1px solid var(--ray-border);
  border-radius: var(--ray-radius-default);
  padding: var(--ray-space-md);
  box-shadow: var(--ray-shadow-sm);
}
```

## Tokens

| Kind | Example | Notes |
|---|---|---|
| Palette | `--ray-blue-0` … `--ray-blue-9` | 12 colors (open-color); scheme independent |
| Variants | `--ray-blue-filled`, `-filled-hover`, `-light`, `-light-hover`, `-light-color`, `-outline`, `-outline-hover`, `-contrast` | per color, light/dark aware |
| Primary | `--ray-primary-6`, `--ray-primary-filled`, … | aliases of the primary color |
| Semantic | `--ray-background`, `--ray-foreground`, `--ray-primary`, `--ray-muted`, `--ray-border`, `--ray-ring`, … | what components and apps use |
| Scales | `--ray-space-*`, `--ray-radius-*`, `--ray-font-size-*`, `--ray-control-height-*`, `--ray-shadow-*`, `--ray-duration-*`, `--ray-z-*` | |

Breakpoints are exported to `dist/tokens.json` only (custom properties cannot
be used in `@media`).

### Charts

`--ray-chart-1…8` (series, in order), `--ray-chart-grid/-axis/-text/-tooltip…`
and `chartTheme()` for canvas libraries: recipes for Chart.js, uPlot and
ECharts in [CHARTS.md](CHARTS.md).

### Theme and primary color

- The theme follows the system by default (`color-scheme: light dark` and
  `light-dark()` values). Force it on the page or on any subtree with
  `data-theme="light"` / `data-theme="dark"`.
- Switch the primary color of the page or a subtree with
  `data-primary="violet"` (any palette color).
- From JS: `setTheme("light" | "dark" | "system")`, `setPrimary("violet")`,
  `getTheme()`, `resolvedTheme()`, `onThemeChange(cb)` from `src/core/core.js`.
  The page-level choice is persisted in `localStorage` when available and
  restored when `core.js` loads.
- **No flash on load:** `core.js` is a module, so it restores the stored
  theme after the first paint — a page whose stored choice differs from the
  system flashes the other scheme. Apply it first with an inline script in
  `<head>`, before the stylesheets, and hide components until they are
  defined:

  ```html
  <script>
    try {
      const t = localStorage.getItem("ray-ds:theme");
      if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
      const p = localStorage.getItem("ray-ds:primary");
      if (p && p !== "custom") document.documentElement.dataset.primary = p;
    } catch {}
  </script>
  <style>:not(:defined) { visibility: hidden; }</style>
  ```
- **Any brand color:** `definePrimary("#7c3aed")` (page) or
  `definePrimary(color, { el })` (subtree) builds ten shades in OKLCH, picks
  white or black text by contrast (a bright color fills with itself and black
  text, like yellow), switches to `data-primary="custom"` and returns
  `{ shades, filled, contrast, ratio, aa }`, warning below WCAG AA. Every
  variant follows the same rules as the palette colors.
- **Component defaults:** `configure({ defaults: { "ray-button": { variant: "light", size: "md" } } })`
  for whatever the markup and code leave unset.

Browser support: `light-dark()` and `color-mix()` — Safari/WebKit 17.5+,
Chrome 123+, Firefox 120+ (WebKitGTK 2.44+, current Android WebView).

### Overlay

Modal dialogs, drawers and the command palette darken the page with
`--ray-overlay` and blur it with `--ray-overlay-blur` (`[overlay] blur` in
`tokens.toml`, 4px by default; `0px` turns it off). Change it for the whole app,
a subtree or one element:

```css
:root { --ray-overlay-blur: 8px; --ray-overlay: rgb(0 0 0 / 25%); }
.settings { --ray-overlay-blur: 0px; }
```

```html
<ray-dialog overlay-blur="none" label="Plain backdrop">…</ray-dialog>
```

or as a default for every instance: `configure({ defaults: { "ray-dialog": { overlayBlur: "12" } } })`.
The blur is dropped for users who ask for reduced transparency.

## Extending

Components are classes on public bases (`RayElement`, `FormControl`,
`FieldControl`, `Floating`) and an app can build on them or on any component:
see [EXTENDING.md](EXTENDING.md) — the contract, the three levels,
`extendStyles`, `configure({ defaults })` and `wrap` (types and React/Vue
wrappers for an app's own components).

## Writing a component

```js
import { RayElement, css, define } from "../../core/core.js";

export class RayThing extends RayElement {
  static properties = { size: { type: String, reflect: true, default: "sm" } };
  static styles = [css`:host { display: inline-flex; }`];
  static template = `<span part="label"><slot></slot></span>`;
  update(changed) { /* sync the shadow DOM with the properties */ }
}
define("ray-thing", RayThing);
```

- Styling hooks: tokens (CSS custom properties pierce the shadow root),
  `::part()` and slots. Document them in `component.toml`.
- Events: a value change is a plain `change` (and `input`), read from the
  element; anything else is `this.emit("ray-something", detail)` (bubbles,
  composed). See "Events" in [EXTENDING.md](EXTENDING.md).
- Properties set before the element is defined (React/Vue) are picked up on
  connection.
- Focus rings: give the focusable element `class="focus-ring"`.
- Shared styles: `sizeStyles`, `radiusStyles`, `variantStyles` + `applyColor(el, color)`
  from `core/styles.js`; form controls extend `FieldControl` from `core/form.js`.
- Add `component.toml` (API) and `example.html`, run `build`, and cover the
  behavior in `tests/*.test.js`.

## Roadmap

0. Foundations — tokens, theme, core runtime, generator, webview tests ✅
1. Primitives — buttons, inputs, display, card, separator; `add`; component docs ✅
2. Overlays and interaction — dialog, popover, tooltip, menu, notifications, tabs, segmented control, accordion ✅
3. Integrations — generated React and Vue wrappers, `.d.ts`, `custom-elements.json`, example apps ✅
4. App composites — table, command palette, split panes, nav links, status bar, progress, slider, stat, empty state ✅
5. Adoption — pilot in ray-remote, then rayauth

Charts: ray-ds draws none (decision: option A). It provides the chart
palette (`--ray-chart-1…8` + chrome tokens, checked at build time for
contrast, separation and color blindness) and `chartTheme()` /
`onChartThemeChange()` for chart libraries — see [CHARTS.md](CHARTS.md).
Own chart components (SVG primitives; an adapter for dense real-time series)
stay open for later, when an app needs them.

## Contributing

See [CONTRIBUTING.md](https://github.com/ray-language/ray-ds/blob/main/CONTRIBUTING.md) and the [changelog](https://github.com/ray-language/ray-ds/blob/main/CHANGELOG.md).

## License

Apache License 2.0: see [LICENSE](https://github.com/ray-language/ray-ds/blob/main/LICENSE) and [NOTICE](https://github.com/ray-language/ray-ds/blob/main/NOTICE).
