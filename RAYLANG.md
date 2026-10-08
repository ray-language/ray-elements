# ray-ds and raylang

ray-ds is framework-agnostic: the components are standard custom elements with
no dependencies, and they work in any page, in React, in Vue, in a browser or
in any webview. Nothing in a component requires raylang.

raylang is where ray-ds comes from and where it gets extras. This page says
what those extras are today and the plan for the ones that make a raylang app
better than any other host: a bridge to the native side, and a raylang package
that brings the whole design system without npm.

## Today

- **Tooling in raylang.** Tokens, contrast checks, docs, the npm packages and
  the browser tests are generated and run by `tools/` (`ray run
  tools/src/main.ray build`).
- **Made for the `std/ui` webview.** No build step: the elements load as ES
  modules from `ray://app`, and form fields are form-associated, so a
  `FormData` reaches the program through `window.ray.send` or
  `window.ray.request` as it is.
- **Examples.** `examples/desktop-form` (plain HTML), `examples/react-app` and
  `examples/vue-app` (made with `ray new --frontend react-ts|vue-ts`) drive the
  page in the real webview and check what reaches raylang.

## Principles

- **The components stay agnostic.** No component imports the bridge. Without
  it, every component behaves exactly as it does today, in any host.
- **Opt-in and detectable.** The bridge is one module, enabled by the app, and
  only active when `window.ray` exists. A page shared between a browser and a
  `std/ui` window works in both.
- **One source of truth.** The package, its assets and its types are generated
  by the same `build` that writes the npm packages, from the same
  `component.toml` files.

## Plan 1: the native bridge

A small protocol between the page and the program, with two halves:

- **Page:** `ray-ds/raylang.js` (in `@ray-ds/elements` and in the raylang
  package). `enableRaylang()` detects `window.ray`, asks the program for its
  capabilities once, and tells the components that opted in.
- **Program:** a raylang module, `ray_ds/bridge`, with one entry point for the
  app's event loop:

```ray
import std/ui;
import ray_ds/bridge;

for e in ui.events() {
    if (bridge.handle(e)) {
        continue;   // a ray-ds request, already answered
    }
    // the app's own events
}
```

Requests travel through `window.ray.request` as JSON (`{"ray-ds": 1, "op":
"pick_files", …}`) and `bridge.handle` answers them with `ui.reply_json`.
Anything else passes through untouched, so the bridge coexists with the app's
own protocol.

### What the components get

| Component | With the bridge | raylang API |
|---|---|---|
| `ray-file-upload` | "browse" opens the native dialog with filters built from `accept` and returns real **paths** (`paths` property, read on `change`); drop and paste keep working with `File` objects | `ui.pick_files`, `ui.file_options`, `ui.filter` |
| `ray-path-input` (new) | a field with a "Browse…" button for a file, a folder or a save target, showing the chosen path; without the bridge it is a plain text field | `ui.pick_file_with`, `ui.pick_folder_with`, `ui.save_file_with` |
| `ray-command-palette` | lists the app's native menu items next to its own commands, with their shortcuts; running one emits the same `menu` event as the menu | `ui.menu` (recorded through `bridge.menu`) |
| `ray-menu` | `native` attribute: opens as a native context menu at the pointer; the choice arrives as `ray-select` | `ui.popup_menu` |
| `confirmDialog()` | asks with the native, modal dialog instead of a `ray-dialog` | `ui.confirm`, `ui.message_styled` |
| `ray-sidebar`, app header | in a `full_content` window, reserve `window.ray.titlebar_height` and mark the header as the drag handle (`data-ray-drag`), so the page runs under a transparent macOS title bar | window kind `full_content` |
| Theme | when the user picks light, dark or a primary color, the window background and title bar follow, so a resize or reopen never flashes the other theme | `ui.set_background`, `ui.set_titlebar_color` |
| Forms | optional `edited` tracking: a dirty form marks the window as edited (the macOS dot) | `ui.set_edited` |
| Attachments | "open" and "show in folder" for an attachment with a path | `ui.open_path`, `ui.reveal` |

### Milestones

1. **Protocol and loop.** `raylang.js` and `ray_ds/bridge` with capability
   negotiation, `pick_files` and `confirm`. Tests: a fake
   `window.ray` in the webview tests and a raylang test of `bridge.handle`.
2. **Files.** `ray-file-upload` in bridge mode and the new `ray-path-input`,
   with its React/Vue wrappers and types.
3. **Menus.** `bridge.menu`, the palette listing native items, `ray-menu
   native`.
4. **Window.** `full_content` support in the app header and sidebar, theme to
   window colors, `edited` tracking.
5. **Docs and example.** A "raylang" section in each affected component's
   docs and an `examples/desktop-app` that uses all of it, driven by `--check`
   like the other examples.

Each milestone ships on its own and keeps the components working without the
bridge.

## Plan 2: the raylang package

A Tier-2 package, `ray-ds`, so a raylang app gets the design system with `ray
add ray-ds`, with no npm, no Node and no copied files.

```ray
import std/ui;
import ray_ds;

fn main() -> int {
    ray_ds.mount("ray-ds")?;      // serves ray://app/ray-ds/… from the binary
    let h = ui.open("App", "ray://app/index.html", 960, 640)?;
    …
}
```

```html
<link rel="stylesheet" href="ray-ds/tokens.css">
<script type="module" src="ray-ds/index.js"></script>
```

### Contents

- `ray_ds.mount(prefix)`: mounts the elements, `tokens.css`, `base.css` and
  `raylang.js` in the app's `ray://app` tree.
- `ray_ds/bridge` (plan 1).
- The version of the package is the version in `ray-ds.toml`; `build` writes
  the package next to the npm ones (`packages/raylang/`).

### How the assets travel

The package must work in `ray run`, in a native build and in a bundle, where
the app runs with `cwd=/` and only embedded assets exist. Two routes, to be
decided by a spike:

1. **The package embeds them** (`[native] embed` in the package's own
   `ray.toml`, mounted with `ui.mount_embed_at`). The raylang docs do not say
   whether a dependency's `embed` reaches the app's binary. If it does not,
   that goes to `RAYLANG-FINDINGS.md`.
2. **Generated module.** `build` writes the assets as constants of a raylang
   module and `mount` serves them with `ui.mount_bytes`. It works with what the
   docs describe today; the spike measures the compile time and binary size.

### Starting a project

`ray new --frontend` takes `npm create vite` templates, so it cannot start a
ray-ds app without npm. Until raylang offers templates from a repository
(another candidate finding), the package docs start from a minimal app
(`ray.toml`, `src/main.ray`, `assets/index.html`) that is also kept as
`examples/starter` and tested by the build.

### Milestones

1. **Spike** on the two asset routes; pick one.
2. **Package** in `packages/raylang/`, generated by `build`, with `mount` and
   a raylang test that serves every file.
3. **Starter** example and its `--check`.
4. **Publish** in the index (`github.com/ray-language/ray-index`) and document
   `ray add ray-ds` in the README.

## Later ideas

- **Typed HTML from raylang.** From the same `component.toml`, generate a
  raylang module for compiled `.ray.html` templates with typed attributes
  (`variant` as an enum), so a misspelled variant fails at compile time. Since
  raylang 1.27.39 the compiled templates are documented and report clear
  errors (findings #126, #127 and #131 are resolved), so this no longer waits
  on raylang; it is the next candidate after plans 1 and 2.
- **Tokens in raylang.** A generated `tokens.ray`, so charts drawn by the
  program, icons, the `Info.plist` colors or a native shell use the same
  palette as the UI.
- **UI tests for apps.** The webview harness of `tools/` as a utility: an app
  that uses ray-ds drives its own pages in the real webview from `ray test`.
- **System notifications.** `ray-notification` could fall back to an OS
  notification when the window is not focused, but `std/ui` has no
  notification API today.
