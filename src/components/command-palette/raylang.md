With `native-menus` and [the native bridge](RAYLANG.md#using-the-bridge), the palette also lists the app's menu bar: every item, grouped by its menu, with its shortcut, the disabled ones greyed out. Running one gives the program the same `"menu"` event as choosing it in the menu bar, so the program handles it in one place.

```ray
let n = bridge.system();
bridge.menu(n, "File", [ui.item("new", "New window", "cmd+n"), ui.item("open", "Open…", "cmd+o")])?;
for raw in ui.events() {
    let e = match (bridge.route(n, raw)) {
        Option.Some(e) => e,
        Option.None => continue,
    };
    if (e.kind == "menu" && e.tag == "new") {
        new_window()?;
    }
}
```

```html
<ray-command-palette native-menus></ray-command-palette>
```

Declare the menus with `bridge.menu` (and change them with `bridge.replace_menu` and `bridge.set_menu_item`) so the palette knows them.
