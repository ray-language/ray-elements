# Contributing to ray-elements

Thanks for helping. ray-elements is web components for any app, with extras for
raylang apps. Its tools (the generator, the docs site, the test runner) are
written in raylang, so the one thing you need besides a browser is the `ray`
toolchain.

## Setup

```sh
curl -sSfL https://raylang.dev/install.sh | sh     # macOS / Linux (Windows: irm https://raylang.dev/install.ps1 | iex)
git clone https://github.com/ray-language/ray-elements && cd ray-elements
tools/run.sh build                                 # tokens, docs, packages
ray serve . --port 0                               # then open the printed URL + /docs/
```

Serve the ray-elements directory itself, not `docs/`: the pages load `../src/` and
`../dist/`.

## What is generated

Never edit these by hand; change their sources and run `build`:

| Output | Source |
|---|---|
| `dist/tokens.css`, `dist/tokens.json`, `docs/foundations.html` | `tokens.toml` |
| `docs/` (every page, the search index, the code samples) | `src/components/*/component.toml` and `example.html`, the `*.md` guides, `tools/src/site/` |
| `packages/` (`@raylang/elements`, `react`, `vue`) | `src/`, `ray-elements.toml` |
| `src/index.js` | the components present |
| `elements/web/` (a copy of `packages/elements`), `elements/version.ray`, the version in `elements/ray.toml` and in the install line of `elements/README.md`, `elements/LICENSE`, `elements/NOTICE` | `packages/elements`, `ray-elements.toml`, `LICENSE`, `NOTICE` |
| `dist/site/` (not committed: the site to publish) | `tools/run.sh site` |

The generated output is committed, and CI fails when it does not match what
the sources produce: run `build` and commit both.

`elements/` is the raylang package for apps, the whole of it: `bridge.ray` (the
program's half of the native bridge) and `README.md` are hand-written, the rest
is generated. Its repository, `github.com/ray-language/elements`, is this
directory split out with its history on every release.

The tools run from `tools/` (`tools/run.sh` does the `cd`): its `ray.toml`
brings `elements` as a path dependency (the webview tests answer the bridge with
it), and `ray run` only reads the `ray.toml` of the directory it runs in.
Paths you give the tools (`--into`, `--components`, `wrap --out`) are relative
to where you are. Without a POSIX shell: `cd tools && ray run src/main.ray
<command>`.

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
(cd tools && ray test)                      # the tools (tokens, generator, publishing)
(cd elements && ray test)                     # elements: the bridge and every file of assets.ray
(cd examples/starter && ray run src/main.ray --check)       # the package in a real window
(cd examples/lean-app && ray run src/main.ray --check)      # only the components it imports are defined
(cd examples/desktop-app && ray run src/main.ray --check)   # the whole bridge, scripted dialogs
npm --prefix tests/packages ci && npm --prefix tests/packages run check   # small bundles take only what they use; the .d.ts compile
tools/run.sh webtest          # tests/*.test.js in a real webview
tools/run.sh webtest layout   # only the files whose name contains "layout"
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

## Releases

1. Set the version in `ray-elements.toml`, run `build`, move the changelog's
   "Unreleased" entry under the version and date.
2. Commit, then tag `vX.Y.Z` and push the tag.
3. The `release` workflow checks that the tag is `ray-elements.toml`'s version, runs
   the tests and checks the generated output, then:
   - **raylang**: pushes `git subtree split --prefix elements` to `main` of
     `github.com/ray-language/elements` and gives it the same tag. It needs the
     secret `RAY_ELEMENTS_DEPLOY_KEY` (a deploy key of `elements` with write access).
   - **npm**: publishes `@raylang/elements`, then `@raylang/react` and
     `@raylang/vue`. A version already on npm is skipped, so a failed run can
     be run again; a prerelease (`0.4.0-rc.1`) goes to the `next` dist-tag.
     It authenticates with the secret `NPM_TOKEN` when it is set, and
     otherwise with npm's trusted publishing (each package trusts
     `ray-language/ray-elements` and `release.yml` on npmjs.com, which needs the
     package to exist: the first release uses the token).
   - **site**: deploys the site to GitHub Pages when the variable
     `PAGES_DEPLOY` is `true` (the `github-pages` environment must allow `v*`
     tags).

   Run it by hand for a dry run: the same jobs, with nothing pushed,
   published or deployed.
4. The raylang index (`ray registry publish`) is a manual step for now.

## License

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE), as section 5 of the license says.
