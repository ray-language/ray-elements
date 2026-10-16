# CLAUDE.md

How to work in **ray-elements**. Read CONTRIBUTING.md (workflow, releases),
RAYLANG.md (the raylang extras and the `elements` package) and EXTENDING.md
(the component contract) before changing behavior.

## What it is

ray-elements (formerly ray-ds; the local checkout may still be a directory
named `ray-ds`) is a framework-agnostic web components design system with
extras for raylang apps. Names:

| Thing | Name |
|---|---|
| Repository, prose, URLs | `ray-elements`; the wordmark is `ray·elements` |
| npm packages | `@raylang/elements`, `@raylang/react`, `@raylang/vue` |
| raylang package | `elements` (`import elements/bridge`, `elements/version`); mirror `ray-language/elements`; `ray add elements` |
| Bridge protocol key / page event | `"ray-elements": 1` / `ray-elements:menu` |
| Vue plugin | `RayElements` (`RayDs`, its 0.3.0 name, was removed in 0.5.0) |
| Site | https://elements.raylang.dev (documents `main`) |

## Layout

- `ray-elements.toml` — the project's single version and npm metadata.
- `tokens.toml` — design tokens; `src/` — components (`component.toml` +
  js/css + `example.html`) and `src/integrations/` (the React and Vue
  runtimes, and `check/`: the markup checker, `ray-elements check`).
- `tools/` — the tooling, in raylang. Run it as `tools/run.sh <cmd>` from
  anywhere: `build`, `tokens`, `docs`, `add`, `package`, `wrap`, `webtest`,
  `site`. Its tests: `cd tools && ray test`.
- `elements/` — the raylang package: `bridge.ray` (hand-written),
  `version.ray` (generated), `ray.toml`, `web/` (a copy of `packages/elements`
  served to the app's pages by its npm name). Its tests: `cd elements && ray test`.
- `examples/` — desktop-app, desktop-form, lean-app, starter (the app to
  copy), react-app, vue-app, extending.
- `site/` — the site's CSS/JS and `llms.md` (the hand-written rules of the
  generated `docs/llms.txt` and `llms-full.txt`, also in the npm package);
  `brand/` — the logos (generated) and
  `brand/manual.html` (the brand manual, hand-written); the guides are the
  `.md` files at the root.

**Generated and committed** (CI fails when they differ from the sources):
`docs/`, `packages/`, `dist/tokens.*`, `src/index.js`, `elements/` except
`bridge.ray` and `README.md`. After touching sources, run `tools/run.sh build`
and commit the output. `dist/site/` (the built site) is not committed.
`examples/extending/wrappers` is regenerated with
`tools/run.sh wrap --components examples/extending/components --out examples/extending/wrappers`.

## Checks before a pull request

```sh
tools/run.sh build                 # regenerate; then git status must be clean apart from your change
(cd tools && ray test)             # the tools
(cd elements && ray test)          # the raylang package
npm --prefix tests/packages ci && npm --prefix tests/packages run check   # bundle sizes + tsc
tools/run.sh webtest [FILTER]      # the browser tests, in a std/ui webview (optional, local)
```

One topic per pull request; commit messages in English (summary line, then
what and why); no signatures or trailers.

## How things ship (three independent rhythms)

1. **The site follows `main`.** `.github/workflows/site.yml` builds
   `tools/run.sh site --base /` and deploys GitHub Pages on every push to
   `main`. A docs change needs no release.
2. **npm ships on a tag.** `release.yml` on `vX.Y.Z`: `check` (the tag is
   `ray-elements.toml`'s version, tests, no generated drift) then `npm`
   (publishes the three packages with provenance; secret `NPM_TOKEN`).
3. **The raylang package ships from a maintainer's machine**, like the
   packages of the raylang monorepo, with no deploy key (the organization does
   not allow them) and no CI secret. At the tag:

   ```sh
   cd elements
   ray registry mirror git@github.com:ray-language/elements.git \
     --public https://github.com/ray-language/elements \
     --index git@github.com:ray-language/ray-index.git
   ```

   Versions are immutable: a tag the mirror already has is refused.

**Release**: set `version` in `ray-elements.toml` **only in the release
commit** (the site shows `main`'s version), `tools/run.sh build`, move the
changelog's `[Unreleased]` entry under the version and date, run the checks,
commit `Release X.Y.Z`, push `main`, tag, push the tag, wait for `release.yml`,
then `ray registry mirror`. Verify with `ray add elements` in a fresh project.

## Do not

- Reintroduce a deploy key or a CI job that pushes to the mirror.
- Bump the version outside the release commit.
- Hand-edit generated files (`docs/`, `packages/`, `dist/`, `elements/version.ray`,
  `elements/web/`); edit the sources and run `build`.
- Use the old names (`ray-ds`, `ray_ds`, `@ray-ds`, `RayDs`).
