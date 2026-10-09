# Contributing to ray-ds

Thanks for helping. ray-ds is web components for any app, with extras for
raylang apps. Its tools (the generator, the docs site, the test runner) are
written in raylang, so the one thing you need besides a browser is the `ray`
toolchain.

## Setup

```sh
curl -sSfL https://raylang.dev/install.sh | sh     # macOS / Linux (Windows: irm https://raylang.dev/install.ps1 | iex)
git clone https://github.com/ray-language/ray-ds && cd ray-ds
ray run tools/src/main.ray build                   # tokens, docs, packages
ray serve . --port 0                               # then open the printed URL + /docs/
```

Serve the ray-ds directory itself, not `docs/`: the pages load `../src/` and
`../dist/`.

## What is generated

Never edit these by hand; change their sources and run `build`:

| Output | Source |
|---|---|
| `dist/tokens.css`, `dist/tokens.json`, `docs/foundations.html` | `tokens.toml` |
| `docs/` (every page, the search index, the code samples) | `src/components/*/component.toml` and `example.html`, the `*.md` guides, `tools/src/site/` |
| `packages/` (`@ray-ds/elements`, `react`, `vue`) | `src/`, `ray-ds.toml` |
| `src/index.js` | the components present |
| `ray_ds/assets.ray`, the version in `ray_ds/ray.toml` | `packages/elements`, `ray-ds.toml` |
| `tools/src/ray_ds/` | `ray_ds/bridge.ray` (the tools use the bridge; see below) |
| `dist/site/` (not committed: the site to publish) | `ray run tools/src/main.ray site` |

The generated output is committed, and CI fails when it does not match what
the sources produce: run `build` and commit both.

`ray_ds/` is the raylang package for apps: `assets.ray` (generated) and
`bridge.ray` (the program's half of the native bridge, hand-written; its
`VERSION` must match `ray-ds.toml`, `build` checks it). The webview tests answer the bridge with it, but `ray run
tools/src/main.ray` from the root does not read `tools/ray.toml`, so `build`
copies its modules into `tools/src/ray_ds/`. When you change something of
`ray_ds/` that the tools use, the tools do not compile until that copy is
updated: run `cp ray_ds/*.ray tools/src/ray_ds/` once, then `build`.

## A new component

1. `src/components/<name>/<name>.js`: a class on `RayElement` (or
   `FieldControl` for a form field), defined with `define("ray-<name>", …)`.
2. `component.toml`: its category, summary, properties, events, slots, parts
   and members. The API tables, the `.d.ts`, `custom-elements.json` and the
   React/Vue wrappers come from it.
3. `example.html`: a real use case first, then the variants. Examples run on
   one page together too (`docs/components/all.html`): keep ids unique
   (`demo-<name>-…`) and their CSS in `site/site.css` (`.demo-…`). If the
   component does more in a raylang app (the native bridge), say what in
   `raylang.md`: it becomes the "In a raylang app" section of its page.
4. A thumbnail for the catalog in `tools/src/site/thumbs.ray`.
5. Tests in `tests/` (see below) and a line in the README's component table.

[EXTENDING.md](EXTENDING.md) documents the base classes. "Writing a component"
in the README has the checklist of conventions.

## Conventions

- **English** everywhere in the code: names, comments, docs, commit
  messages. User-visible demo text is English too.
- **Events:** a value change is a plain `change` (and `input` while editing),
  read from the element; anything else is `ray-<what>` with a typed `detail`.
  A container stops its parts' `change` and fires its own. See "Events" in
  EXTENDING.md.
- **Styling hooks:** tokens (custom properties), `::part()` and slots, all
  documented in `component.toml`. No global CSS from a component.
- **Accessibility:** native semantics first (a real `<button>`, `<a>`,
  `<dialog>`, form association through `ElementInternals`), the WAI-ARIA
  pattern when there is none, visible focus rings (`class="focus-ring"`),
  keyboard support, `prefers-reduced-motion`. Colors come from tokens whose
  contrast `build` checks.
- **No dependencies** at runtime: plain web components, no framework, no
  build step for the user.

## Tests

```sh
(cd tools && ray test)                      # the tools (tokens, generator, publishing) and ray_ds
(cd ray_ds && ray test)                     # ray_ds: the bridge and every file of assets.ray
(cd examples/starter && ray run src/main.ray --check)       # the package in a real window
(cd examples/desktop-app && ray run src/main.ray --check)   # the whole bridge, scripted dialogs
ray run tools/src/main.ray webtest          # tests/*.test.js in a real webview
ray run tools/src/main.ray webtest layout   # only the files whose name contains "layout"
```

The browser tests open a `std/ui` window, so run them from a graphical
session (a terminal on the desktop, not ssh). The first line of each file
names the page it runs in (`// page: tests/pages/x.html`). The window may be
hidden: tests must not wait for animation frames, timers or scroll events
there (use `T.settle()`; see `tests/harness.js`).

## Pull requests

- One topic per pull request; describe what changed and why.
- Run `build` and both test suites; include the generated output.
- New behavior comes with tests and, for a component, its example.
- Commit messages: a short summary line, then what and why.

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE), as section 5 of the license says.
