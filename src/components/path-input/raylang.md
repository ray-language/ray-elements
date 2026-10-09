Browse… shows only in a `std/ui` window with [the native bridge](RAYLANG.md#using-the-bridge). It opens the system's dialog for the `mode`, starting in the folder of the current path (`save` also suggests the current file name). The chosen path fills the field and fires `input` and `change`; the program gets it with the form like any other field.

```html
<ray-path-input name="workspace" label="Workspace" mode="folder"></ray-path-input>
<ray-path-input name="export" label="Export to" mode="save" accept=".csv"></ray-path-input>
```

```ray
// The program's side: ui.events() through bridge.handle, then the form arrives as usual.
for e in ui.events() {
    if (bridge.handle(e)) {
        continue;
    }
    if (e.kind == "message" && e.tag.starts_with("settings:")) {
        save_settings(e.tag.substring(9, e.tag.len()))?;
    }
}
```
