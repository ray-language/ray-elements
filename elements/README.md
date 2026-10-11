# elements

[ray-elements](https://github.com/ray-language/ray-elements) for raylang apps: the design
system's web components, which the app's pages import by their npm name
(`@raylang/elements`) with no npm and no copied files, and the native bridge
that gives them the system's dialogs, menus and window in a `std/ui` window.
Needs raylang 1.27.44 or later.

This repository is the `elements/` directory of
[ray-language/ray-elements](https://github.com/ray-language/ray-elements), published from
it on every release (`ray registry mirror`): open issues and pull requests there.

## Install

```sh
ray add elements
```

or, pinning the tag without the index:

```toml
[dependencies]
elements = "git+https://github.com/ray-language/elements@v0.3.0"
```

## Use

```ray
import std/ui;
import elements/bridge;

fn main() -> int {
    ui.mount_embed_at("", "assets").unwrap(); // the app's own page ([native] embed)
    let h = ui.open("App", "ray://app/index.html", 960, 640).unwrap();
    for e in ui.events() {
        if (bridge.handle(e)) {
            continue;                         // a ray-elements request, answered
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
<link rel="stylesheet" href="/node_modules/@raylang/elements/tokens.css">
<link rel="stylesheet" href="/node_modules/@raylang/elements/base.css">
<script type="module">
  import { enableRaylang } from "@raylang/elements";   // every component, and the API
  await enableRaylang();   // the system dialogs, menus and window for the components
</script>
```

- `web/`: the npm package `@raylang/elements`, declared with
  `[web] package = "web"`. raylang serves it at
  `ray://app/node_modules/@raylang/elements/`, gives every page an import map
  of its `exports` (`@raylang/elements`, `@raylang/elements/core`,
  `@raylang/elements/<component>`), and links it into the app's
  `node_modules/` so the editor resolves the same imports with their types
  (add `node_modules/` to `.gitignore`).
- `elements/version`: `version.VERSION`, the version of ray-elements.
- `elements/bridge`: `bridge.handle(e)`, or `bridge.system()` +
  `bridge.route(n, e)` and `bridge.menu(n, …)` for the menu bar in the
  command palette.

The components, their pages and the bridge's protocol are documented in
[ray-elements](https://github.com/ray-language/ray-elements): see its `RAYLANG.md` and the
"In a raylang app" sections of the component pages.

## License

Apache License 2.0: see [LICENSE](LICENSE) and [NOTICE](NOTICE).
