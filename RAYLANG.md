# ray-ds and raylang

ray-ds is framework-agnostic: the components are standard custom elements with
no dependencies, and they work in any page, in React, in Vue, in a browser or
in any webview. Nothing in a component requires raylang.

raylang is where ray-ds comes from and where it gets extras. This page says
what those extras are: a bridge to the native side (plan 1), and a raylang
package that brings the whole design system without npm (plan 2).

## Today

- **Tooling in raylang.** Tokens, contrast checks, docs, the npm packages and
  the browser tests are generated and run by `tools/` (`tools/run.sh
  build`).
- **Made for the `std/ui` webview.** No build step: the elements load as ES
  modules from `ray://app`, and form fields are form-associated, so a
  `FormData` reaches the program through `window.ray.send` or
  `window.ray.request` as it is.
- **Examples.** `examples/desktop-form` (plain HTML), `examples/react-app` and
  `examples/vue-app` (made with `ray new --frontend react-ts|vue-ts`) drive the
  page in the real webview and check what reaches raylang.
- **The raylang package** (plan 2): `ray_ds/assets` serves the whole design
  system from the program, with no npm and no copied files;
  `examples/starter` is the app to copy. It is published to its own
  repository, `github.com/ray-language/ray_ds`.
- **The native bridge** (plan 1, done): system file dialogs with
  real paths (`ray-file-upload native`, `ray-path-input`), native
  confirmations (`confirmDialog()`), native context menus (`ray-menu native`),
  the app's menu bar in the command palette (`native-menus`), and the window:
  `ray-app-shell` under a transparent title bar, window colors that follow
  the theme, and the "unsaved changes" mark (`trackEdits`). See below, the
  "In a raylang app" section of each component's page, and
  `examples/desktop-app`.

## Using the bridge

In the program, answer the bridge before the app's own events
(`ray_ds = "path:…/ray-ds/ray_ds"` in `[dependencies]` until the package is
published):

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

In the page, once:

```js
import { enableRaylang } from "ray-ds/core/raylang.js";   // or from "@ray-ds/elements"
await enableRaylang();   // the host, or null in a browser
```

```html
<ray-file-upload native multiple accept=".png,.jpg" label="Photos"></ray-file-upload>
<ray-path-input name="out" label="Export to" mode="save" accept=".csv"></ray-path-input>
```

`ray-file-upload native` lists the chosen files as `HostFile`s (name, size,
type and `path`), gives their paths in `paths` and submits the paths with its
form; drop and paste still give `File`s. `ray-path-input` shows Browse… only
with the host. `confirmDialog()` asks with the system dialog unless
`native: false`. In a browser all of them behave as before.

For menus, keep one `Native` for the whole loop, declare the menus through it
and use `route()`, which turns an item run from the palette into the same
`"menu"` event the menu bar sends:

```ray
let n = bridge.system();
bridge.menu(n, "File", [ui.item("new", "New", "cmd+n"), ui.item("open", "Open…", "cmd+o")])?;
for raw in ui.events() {
    let e = match (bridge.route(n, raw)) {
        Option.Some(e) => e,      // for the app
        Option.None => continue,  // answered by the bridge
    };
    if (e.kind == "menu") { … }   // from the menu bar or from the palette
}
```

```html
<ray-command-palette native-menus></ray-command-palette>
<ray-menu native context>
  <div slot="trigger">…</div>
  <ray-menu-item value="rename">Rename</ray-menu-item>
</ray-menu>
```

`bridge.menu_at`, `replace_menu` and `set_menu_item` keep the record up to
date the same way (`bridge.record` records a menu without touching the bar).

The window: open it with `o.kind = "full_content"` and `enableRaylang()` sets
`--ray-titlebar-height` and `--ray-titlebar-inset` (the room for the macOS
window buttons) on `<html>`; a `ray-app-shell` then makes its header the title
bar (taller, indented, dragging the window) or, with `layout="alt"` or no
header, starts its navbar and main below it. `dragRegion(el)` does the same
for any element of your own. `enableRaylang()` also keeps the window's
background and title bar in the theme's background color (`windowColors:
false` to opt out), and `trackEdits(form)` marks the window as edited while
the form differs from what was saved:

```js
import { enableRaylang, trackEdits } from "@ray-ds/elements";
await enableRaylang();
const edits = trackEdits(document.querySelector("form"));   // edits.dirty, edits.clean()
```

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

- **Page:** `core/raylang.js` (in `@ray-ds/elements`, also re-exported from
  its index). `enableRaylang()` detects `window.ray`, asks the program for its
  capabilities once ("hello") and installs a host in `core/host.js`, the
  registry the components ask; they never import the bridge.
- **Program:** a raylang module, `ray_ds/bridge` (the `ray_ds/` directory of
  this repo), with one entry point for the app's event loop:

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
"pick_files", …}`) and `bridge.handle` answers them with `ui.reply_json`:
`{"ok": true, "value": …}` or `{"ok": false, "error": "…"}`. Anything else
passes through untouched, so the bridge coexists with the app's own protocol.
The dialogs sit behind a `Native` struct (`bridge.system()`); `handle_with(e,
n)` takes another one, which is how the webview tests answer with scripted
dialogs.

| Operation | Asks for | Answers |
|---|---|---|
| `hello` | | `{protocol, version, platform, ops}` |
| `pick_files` | `title`, `directory`, `multiple`, `filters` | `[{path, name, size}]`, `[]` if cancelled |
| `pick_path` | `mode` (`open`, `folder`, `save`), `title`, `directory`, `suggested`, `filters` | the path, or `null` |
| `confirm` | `title`, `message`, `confirmLabel`, `cancelLabel`, `style` | `true` / `false` |
| `menu_items` | | `[{menu, tag, title, shortcut, enabled, checked}]` (no separators, no `role:*`) |
| `run_menu` | `tag` | `true`; `route()` gives the app the `"menu"` event |
| `popup_menu` | `id`, `items` (`title`, `enabled`, `checked`, `separator`) | `true` once shown; the choice comes later as the page event `ray-ds:menu` (`{id, index}`), nothing when dismissed |
| `window_colors` | `background`, `titlebar` (`#rrggbb`, `""` = system) | `true` |
| `set_edited` | `edited` | `true` |

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

1. ✅ **Protocol and loop.** `core/raylang.js` and `ray_ds/bridge` with
   capability negotiation, `pick_files` and `confirm`. Tests: the raylang
   tests of `bridge.answer`, and `tests/bridge.test.js`, where the page talks
   to the real bridge in the webview runner (scripted dialogs).
2. ✅ **Files.** `ray-file-upload native` and the new `ray-path-input`
   (`pick_path`), with their React/Vue wrappers and types.
3. ✅ **Menus.** `bridge.menu` (and `menu_at`, `replace_menu`,
   `set_menu_item`), `route()`, the palette listing native items
   (`native-menus`), `ray-menu native`.
4. ✅ **Window.** `full_content` support in `ray-app-shell` (header as the
   title bar, `dragRegion`), theme to window colors, `trackEdits`. The drag
   handle works around finding #138 (the shell's `data-ray-drag` does not see
   shadow DOM).
5. ✅ **Docs and example.** An "In a raylang app" section on the pages of
   file upload, path input, dialog, menu, command palette and app shell (from
   each component's `raylang.md`), and `examples/desktop-app`, which uses all
   of it: `ray run src/main.ray --check` drives it in a real `full_content`
   window with scripted dialogs (the system's dialogs and menus cannot be
   clicked by a script; try them with `ray run`).

Each milestone ships on its own and keeps the components working without the
bridge.

## Plan 2: the raylang package

The `ray_ds/` directory of this repo is a raylang package: a raylang app gets
the whole design system from it, with no npm, no Node and no copied files.

```toml
[dependencies]
ray_ds = "git+https://github.com/ray-language/ray_ds@v0.3.0"
# or, next to a checkout of this repository: ray_ds = "path:../ray-ds/ray_ds"
```

```ray
import std/ui;
import ray_ds/assets;
import ray_ds/bridge;

fn main() -> int {
    assets.mount("ray-ds").unwrap();   // ray://app/ray-ds/index.js, tokens.css, base.css…
    ui.mount_embed_at("", "assets").unwrap();
    let h = ui.open("App", "ray://app/index.html", 960, 640).unwrap();
    for e in ui.events() {
        if (bridge.handle(e)) {
            continue;
        }
        // the app's own events
    }
    0
}
```

```html
<link rel="stylesheet" href="ray-ds/tokens.css">
<link rel="stylesheet" href="ray-ds/base.css">
<script type="module" src="ray-ds/index.js"></script>
```

`examples/starter` is that app, ready to copy (`ray new --frontend` takes
`npm create vite` templates, so it cannot start one without npm).
`examples/desktop-app` uses the package and the whole bridge.

### Contents

- `ray_ds/assets` (generated by `build`): the files of `@ray-ds/elements` —
  `index.js` (every component, and the API: `enableRaylang`, `notify`,
  `confirmDialog`…), `core/`, `components/`, `tokens.css`, `base.css` — as
  constants. `assets.mount(prefix)` serves them with `ui.mount_bytes`;
  `assets.files()` and `assets.read(path)` list and read them. Its test
  checks every file byte for byte.
- `ray_ds/version` (generated): `version.VERSION`, the version of
  `ray-ds.toml`; the bridge's `hello` answers with it. The other modules
  import it as `ray_ds/version`, the only form that also works from an app
  (finding #142).
- `ray_ds/bridge` (plan 1, hand-written).
- `ray_ds/README.md` (hand-written), `LICENSE` and `NOTICE` (copies of the
  repository's): the package is the whole directory. `build` keeps the
  version of `ray.toml` and of the README's install line.
- No `mod.ray`: it would make the other modules internal to the capsule, so
  the package is `import ray_ds/assets;` and `import ray_ds/bridge;`.

### How the assets travel: decided by the spike

The package must work under `ray run`, in a native binary and in a bundle,
where the app runs from any directory and only what was baked in exists.

1. **The package embeds them** (its own `[native] embed`): **does not work.**
   A dependency's `embed` is ignored, under `ray run` and in a native binary:
   `std/embed` only has the app's own files, also when the package reads it
   (finding #139).
2. **Generated module** (chosen): `build` writes the 86 files (about 690 KB of
   source) as string constants of `ray_ds/assets.ray`. Measured on macOS with
   raylang 1.27.39: generating it takes under half a second, a native build
   of `examples/desktop-app` takes 7.5 s and weighs 2.5 MB, and the files
   arrive byte for byte under `ray run` and in the native binary (its
   `--check` passes with the binary).

The cost is a ~700 KB generated file in the repository, rewritten when a
component changes (git stores the difference).

### Milestones

1. ✅ **Spike** on the two asset routes: the generated module.
2. ✅ **Package** in `ray_ds/`, generated by `build`, with `mount` and a raylang
   test that checks every file.
3. ✅ **Starter** example and its `--check`.
4. ✅ **Publish** (to its repository; the index waits for the repositories to
   be public). What the spike found about dependencies decided how:
   - a `git+` dependency puts the **root** of the repository in
     `.ray-deps/<key>` and imports it by the key; there is no way to point at
     a subdirectory (finding #140), and the packages of the index are one
     repository each, with the modules at the root (`greeting`, for
     instance). So `ray_ds/` cannot be installed from this repository as it
     is: `git+https://github.com/ray-language/ray-ds` would give the docs
     site's repository, not the package.
   - So the package has a repository of its own, `ray-language/ray_ds`:
     `git subtree split --prefix ray_ds`, with the history of the directory.
     The `release` workflow pushes it on every version tag of this
     repository and gives it the same tag. An app installs it with
     `git+https://…/ray_ds@v0.3.0` (checked with a copy of
     `examples/starter` outside this repository).
   - Left: `ray registry publish` once both repositories are public, so
     that `ray add ray_ds` works too. A manual command until then; later a
     last step of the release job, with a deploy key on `ray-index`.

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
