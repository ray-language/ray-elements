# ray_ds

[ray-ds](https://github.com/ray-language/ray-ds) for raylang apps: the design
system's web components, which the app's pages import by their npm name
(`@ray-ds/elements`) with no npm and no copied files, and the native bridge
that gives them the system's dialogs, menus and window in a `std/ui` window.
Needs raylang 1.27.44 or later.

This repository is the `ray_ds/` directory of
[ray-language/ray-ds](https://github.com/ray-language/ray-ds), split out with
its history on every release: open issues and pull requests there.

## Install

```toml
[dependencies]
ray_ds = "git+https://github.com/ray-language/ray_ds@v0.3.0"
```

## Use

```ray
import std/ui;
import ray_ds/bridge;

fn main() -> int {
    ui.mount_embed_at("", "assets").unwrap(); // the app's own page ([native] embed)
    let h = ui.open("App", "ray://app/index.html", 960, 640).unwrap();
    for e in ui.events() {
        if (bridge.handle(e)) {
            continue;                         // a ray-ds request, answered
        }
        if (e.kind == "closed") {
            break;
        }
        // the app's own events
    }
    0
}
```

```html
<link rel="stylesheet" href="/node_modules/@ray-ds/elements/tokens.css">
<link rel="stylesheet" href="/node_modules/@ray-ds/elements/base.css">
<script type="module">
  import { enableRaylang } from "@ray-ds/elements";   // every component, and the API
  await enableRaylang();   // the system dialogs, menus and window for the components
</script>
```

- `web/`: the npm package `@ray-ds/elements`, declared with
  `[web] package = "web"`. raylang serves it at
  `ray://app/node_modules/@ray-ds/elements/`, gives every page an import map
  of its `exports` (`@ray-ds/elements`, `@ray-ds/elements/core`,
  `@ray-ds/elements/<component>`), and links it into the app's
  `node_modules/` so the editor resolves the same imports with their types
  (add `node_modules/` to `.gitignore`).
- `ray_ds/version`: `version.VERSION`, the version of ray-ds.
- `ray_ds/bridge`: `bridge.handle(e)`, or `bridge.system()` +
  `bridge.route(n, e)` and `bridge.menu(n, …)` for the menu bar in the
  command palette.

The components, their pages and the bridge's protocol are documented in
[ray-ds](https://github.com/ray-language/ray-ds): see its `RAYLANG.md` and the
"In a raylang app" sections of the component pages.

## License

Apache License 2.0: see [LICENSE](LICENSE) and [NOTICE](NOTICE).
