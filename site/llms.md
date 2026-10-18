ray-elements is a design system of standard web components (custom elements
with Shadow DOM, no dependencies): `<ray-button>`, `<ray-input>`,
`<ray-dialog>`… They work in plain HTML, React, Vue, a browser or any webview,
and get extras in a raylang app (a native bridge to the program). The rules
below are what this library does differently from what you may assume; the
reference of every component follows them.

## Load it

```html
<link rel="stylesheet" href="node_modules/@raylang/elements/tokens.css">  <!-- required: the components read the tokens -->
<link rel="stylesheet" href="node_modules/@raylang/elements/base.css">    <!-- optional: font, colors and margins of the document -->
<script type="module">
  import "@raylang/elements";          // registers EVERY <ray-*> element and exports the whole API
</script>
```

- The bare name (`"@raylang/elements"`) resolves with a bundler (Vite,
  esbuild…) and in a raylang app (raylang serves the package with an import
  map). A plain page without either imports the files:
  `import { notify } from "./node_modules/@raylang/elements/index.js";`
  (everything), `./node_modules/@raylang/elements/components/<name>/<name>.js`
  (one component), `./node_modules/@raylang/elements/core.js` (the API), or
  declares an import map:
  `<script type="importmap">{ "imports": { "@raylang/elements": "./node_modules/@raylang/elements/index.js" } }</script>`.

- `npm install @raylang/elements` (React: also `@raylang/react`; Vue: also
  `@raylang/vue`). With a bundler: `import "@raylang/elements/tokens.css";`.
- Only some components: `import "@raylang/elements/button";` — one entry per
  component directory (the "Import" line of each component below). Each brings
  what it uses. `import { notify } from "@raylang/elements/notification";` gets
  a component's exports with it.
- The API without registering any element: `import { setTheme } from
  "@raylang/elements/core";`. Note that `import { RayButton } from
  "@raylang/elements"` loads everything (that entry registers every element).
- Avoid a flash of unstyled tags: `<style>:not(:defined) { visibility: hidden; }</style>`.

## Rules

- **Attributes are kebab-case, properties camelCase**: `full-width` /
  `fullWidth`. Boolean attributes are present or absent (`disabled`, never
  `disabled="false"`). Properties marked "property only" have no attribute:
  set them from JS (arrays, objects, functions). The exception is `checked`
  and `value` on form controls: their attribute is the initial state (see
  Forms).
- **Shared vocabulary**: `size` = `xs` | `sm` | `md` | `lg` | `xl` (default
  `sm`); `radius` = `xs`…`xl` | `full`; `color` = a palette color (`blue`,
  `red`, `teal`, `gray`…) or any CSS color, default the primary; `variant` per
  component (button: `filled`, `light`, `outline`, `subtle`, `default`,
  `transparent`, `gradient`, `raised`). Use only the values the reference lists.
- **Slots have exact names**: an icon in a button goes in `slot="left"` or
  `slot="right"` (not `start`/`end`, not `prefix`): `<ray-button><ray-icon
  slot="left" name="plus"></ray-icon>Add</ray-button>`. Content without a
  `slot` goes to the default slot. Check the slot list of the component.
- **Never hard-code colors, spacing, radii or shadows** in your own CSS: use
  the tokens (`var(--ray-background)`, `var(--ray-foreground)`,
  `var(--ray-border)`, `var(--ray-space-md)`, `var(--ray-radius-default)`,
  `var(--ray-shadow-sm)`). They follow light and dark themes; literal colors do
  not. Prefer the semantic tokens over the palette (`--ray-blue-6`).
- **Style components from outside** with `color`/`variant`/`size`/`radius`,
  the tokens (custom properties pierce the shadow root) and `::part()` (the
  parts each lists). Do not reach into their
  `shadowRoot` or depend on its markup.
- **Layout components exist**: `ray-stack` (vertical), `ray-group`
  (horizontal), `ray-grid`, `ray-container`, `ray-center`, `ray-card`
  (a heading of your own in its `header` slot), `ray-app-shell`. Their
  `gap`/`padding` take `xs`…`xl`.
- **Icons**: `<ray-icon name="settings"></ray-icon>`, from the registry (a
  small set, listed in the reference: there is no `save` or `trash`); decorative unless it has `label`. An icon-only button is
  `<ray-icon-button label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button>`
  (`label` is required: it is the accessible name). Add or replace icons with
  `setIcons({ inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">…</svg>' })`
  (the style of the built-in set: 24×24, a 2px `currentColor` stroke) from
  your own code, never from user input. `filled` draws an icon's filled
  version for a state (`<ray-icon name="star" filled>` when it is a favorite);
  `"name:filled"` in `setIcons` adds one.
- **Overlays are in the top layer**: `ray-dialog` is a native modal
  `<dialog>`; popovers, menus, tooltips and notifications are `[popover]`
  elements. Never fight them with `z-index` or `overflow`.

## An app's frame

```html
<ray-app-shell>
  <ray-app-bar slot="header" label="Files" description="No folder chosen">
    <ray-button slot="end" variant="default" size="xs">Commands</ray-button>
    <ray-theme-toggle slot="end"></ray-theme-toggle>
  </ray-app-bar>
  <ray-sidebar slot="navbar" label="Workspace">
    <ray-nav-link label="Files" href="#files" active><ray-icon slot="left" name="folder"></ray-icon></ray-nav-link>
    <ray-nav-link label="Settings" href="#settings"><ray-icon slot="left" name="settings"></ray-icon></ray-nav-link>
  </ray-sidebar>
  <main>…</main>
</ray-app-shell>
```

`ray-app-bar` is the header on the desktop too (its `label` is the title;
several elements may share the `end` slot). On narrow screens the sidebar
becomes a drawer and the shell switches to a phone layout by itself.

## Forms

- Inputs are **form-associated**: inside a `<form>` they submit under `name`,
  validate (`required`, `pattern`, `min`…), reset with it and follow a
  disabled `<fieldset>`. Read values with `new FormData(form)` or the
  element's `.value` / `.checked`.
- The `value` / `checked` **attributes are the initial value**; the
  properties hold the current one. Set `el.value = …` to change it.
- Fields take `label`, `description` and `error` (the error text also marks it
  invalid): do not wrap them in your own `<label>`.
- Enter in a `ray-input` submits its form, as in a native field; a submit
  button is `<ray-button type="submit">`.
- As with native controls: an invalid field (`required` and empty, a wrong
  `type="email"`…) blocks the submit and the browser shows its message; an
  unchecked `ray-checkbox`/`ray-switch` and a `ray-select` with nothing chosen
  are left out of `FormData` (a select's `placeholder` shows meanwhile).

## Events

- A value change is a plain `input` (while typing) and `change` event: read
  `event.target.value`.
- Everything else is a `ray-*` custom event (bubbles, composed) with its data
  in `event.detail`: `ray-select` on a menu (`detail.value`), `ray-close` on a
  dialog (`detail.returnValue`), `ray-request-close` (cancelable). The
  reference lists each component's events and their `detail`.

## Dialogs and notifications

```html
<ray-dialog id="d" label="Rename">
  <ray-input label="Name" name="name"></ray-input>
  <ray-button slot="footer" variant="default" data-dialog-close>Cancel</ray-button>
  <ray-button slot="footer" data-dialog-close="ok">Save</ray-button>
</ray-dialog>
```

`d.show()` or the `open` attribute opens it; any slotted element with
`data-dialog-close` closes it (its value becomes `returnValue`); the close
button, Escape and the backdrop close it with `returnValue` `""` (after a
cancelable `ray-request-close`).
`await confirmDialog({ label, message, confirmLabel, cancelLabel, color: "red" })`
asks a yes/no question (every option is optional: "Are you sure?",
"Confirm", "Cancel"); `notify({ title, message, color })` shows a
notification (`message` is plain text; a `color` adds a status icon:
green a check, red an error, yellow a warning, others info).

## Theme

- The theme follows the system. Force it on the page or any subtree with
  `data-theme="light"` | `"dark"`; change the primary color with
  `data-primary="violet"` (a palette color).
- From JS: `setTheme("light" | "dark" | "system")`, `setPrimary("violet")`,
  `definePrimary("#7c3aed")` (any brand color: builds the ten shades and
  checks contrast), `onThemeChange(cb)`. `<ray-theme-toggle>` is the switch.
- App-wide defaults for a component: `configure({ defaults: { "ray-button":
  { variant: "light" } } })`.

## React and Vue

```tsx
import "@raylang/elements/tokens.css";
import { RayInput, RayMenu, RayMenuItem, RayButton } from "@raylang/react";

<RayInput label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} />
<RayMenu onRaySelect={(e) => run(e.detail.value)}>
  <RayButton slot="trigger">Actions</RayButton>
  <RayMenuItem value="rename">Rename</RayMenuItem>
</RayMenu>
```

```vue
<!-- main.ts: import RayElements from "@raylang/vue"; app.use(RayElements) -->
<RayInput v-model="name" label="Name" required />
<RayDialog v-model="open" label="Confirm" @ray-close="onClose">…</RayDialog>
```

- The wrapper of `<ray-tag-name>` is `RayTagName`. React events are `on` +
  PascalCase of the event (`onRaySelect`, `onChange`); props are set as DOM
  properties. Vue has `v-model` where the reference lists a model (`value`,
  `checked` or `open`).
- A wrapper registers only its own element: a plain `<ray-*>` tag in JSX
  needs its import (`import "@raylang/elements/badge"`).

## In a raylang app

`ray add elements` brings the raylang package `elements`: it serves
`@raylang/elements` to the app's pages by its npm name, with no npm and no
build step. The page:

```html
<link rel="stylesheet" href="/node_modules/@raylang/elements/tokens.css">
<script type="module">
  import { enableRaylang } from "@raylang/elements";
  const host = await enableRaylang();   // the native host, or null in a browser
</script>
```

The program serves the page and answers the bridge before its own events:

```ray
import std/ui;
import elements/bridge;

fn main() -> int {
    match (run()) {
        Result.Ok(code) => code,
        Result.Err(e) => {
            eprint(e);
            1
        },
    }
}

fn run() -> Result<int, string> {
    ui.mount_embed_at("", "assets")?;   // the page: assets/index.html, ray.toml [native] embed = ["assets"]
    ui.open_with("App", "ray://app/index.html", ui.options(800, 600))?;
    while (true) {
        let e = ui.next_event()?;
        if (bridge.handle(e)) {
            continue;   // a ray-elements request, already answered
        }
        if (e.kind == "closed") {
            return Result.Ok(0);
        }
        // the app's own events: e.kind == "message" (window.ray.send), e.tag…
    }
}
```

With the bridge: `<ray-file-upload native>` and `<ray-path-input>` use the
system file dialogs and give real paths, `confirmDialog()` asks with the
system dialog, `<ray-menu native>` opens a native context menu,
`<ray-command-palette native-menus>` runs the app's menu bar
(`bridge.menu`, `bridge.route`), `ray-app-shell` becomes the title bar of a
`full_content` window, and `trackEdits(form)` shows the unsaved mark. The
components that use it have an "In a raylang app" section. Without the
bridge every component keeps its web behavior.

## Check your markup

The package checks markup against this version:
`npx ray-elements check src/` (with npm), or
`node node_modules/@raylang/elements/check/cli.js check assets/` (a raylang
app). It reports unknown elements, attributes, slots and `ray-*` events,
invalid values, unregistered icons and literal colors, with the line and a
suggestion, and exits with 1 on an error. Run it after writing a page and fix
what it reports; `--format json` gives the diagnostics as JSON.

## Your own components

Extend `RayElement`, `FormControl`, `FieldControl` or `Floating` (or any
component class) from `@raylang/elements/core`; see the Extending guide.
Members whose name starts with `_` are internal.
