# Path input (also File path, Folder picker)

A field for a path on disk: a file to open, a folder, or where to save. In a std/ui window (with ray-elements/core/raylang.js) a Browse… button opens the system dialog; in a browser it is a plain text field. Everything else is ray-input.

Import: `import "@raylang/elements/path-input";` · Category: Inputs

## `<ray-path-input>` (RayPathInput, extends RayInput)

Browse… shows only with a native host that offers pick_path (see core/host.js); the dialog starts in the folder of the current path. The path can always be typed or pasted.

Properties:

- `mode`: `open` | `folder` | `save`, default `open`, reflects. What the dialog chooses: an existing file, a folder, or a file to save (the current name is suggested).
- `accept`: string, reflects. File types the dialog offers, as in <input type=file>: ".json,.toml", "image/*" (ignored for folders).
- `browseLabel` (attribute `browse-label`): string, default `Browse…`. Text of the button.
- `dialogTitle` (attribute `dialog-title`): string. Title of the system dialog (default: the label).

Also the properties of RayInput (`<ray-input>`): `value`, `type`, `name`, `label`, `description`, `descriptionPosition`, `error`, `placeholder`, `required`, `disabled`, `readonly`, `size`, `radius`, `variant`, `highlight`, `complete`, `suggestionsLabel`.

Events:

- `change`: The path changed: typed and committed, or chosen in the dialog.
- `ray-error` (detail `{ error: Error }`): The system dialog failed.

Parts (`::part()`):

- `browse`: The Browse… button.

Methods and properties:

- `readonly canBrowse: boolean`: Whether Browse… is available (a native host offers pick_path).
- `browse(): Promise<string | null>`: Opens the system dialog; resolves to the chosen path (also set as value, with input and change), or null.

Exports (from `@raylang/elements/path-input` and `@raylang/elements`):

- `function dirName(path: string): string`: The folder part of a path ("" when it has none), with / or \ separators.
- `function baseName(path: string): string`: The last part of a path.

## In a raylang app

Browse… shows only in a `std/ui` window with [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge). It opens the system's dialog for the `mode`, starting in the folder of the current path (`save` also suggests the current file name). The chosen path fills the field and fires `input` and `change`; the program gets it with the form like any other field.

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

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A project's paths, in a std/ui window</div>
<div class="demo-path">
  <div class="demo-path-bar">
    <ray-switch id="demo-path-simulate" label="Simulate a std/ui window" description="Installs a stand-in for the raylang host, so Browse… shows here."></ray-switch>
  </div>
  <form class="demo-path-form" id="demo-path-form">
    <ray-path-input name="workspace" label="Workspace" mode="folder" value="/Users/ada/Projects/ray-elements" required></ray-path-input>
    <ray-path-input name="config" label="Tokens file" accept=".toml" value="/Users/ada/Projects/ray-elements/tokens.toml" description="The palette, spacing and radii the build reads."></ray-path-input>
    <ray-path-input name="export" label="Export the theme to" mode="save" accept=".css,.json" value="/Users/ada/Desktop/theme.css"></ray-path-input>
    <div class="demo-row"><ray-button type="submit">Save settings</ray-button><span class="demo-muted" id="demo-path-out">In a browser these are plain text fields.</span></div>
  </form>
</div>

<div class="demo-caption">Sizes and states</div>
<div class="demo-grid">
  <ray-path-input label="Small (default)" placeholder="/path/to/file"></ray-path-input>
  <ray-path-input label="Large, filled" size="lg" variant="filled" mode="folder" placeholder="Choose a folder"></ray-path-input>
  <ray-path-input label="Error" value="/Users/ada/missing.toml" error="The file does not exist."></ray-path-input>
  <ray-path-input label="Disabled" value="/etc/hosts" disabled></ray-path-input>
</div>

<script type="module">
  import { getHost, setHost } from "@raylang/elements";

  const baseName = (p) => p.split(/[\\/]/).pop();
  const dirName = (p) => p.slice(0, Math.max(0, p.lastIndexOf("/")));

  // A stand-in for core/raylang.js: in a std/ui window the program answers
  // with the system dialog; here a choice is made up from what was asked.
  const stand = {
    name: "simulated",
    can: (op) => op === "pick_path",
    async pickPath({ mode, directory, suggested }) {
      const dir = directory || "/Users/ada/Projects";
      if (mode === "folder") return `${dirName(dir) || dir}/ray-apps`;
      if (mode === "save") return `/Users/ada/Documents/${suggested || "untitled"}`;
      return `${dir}/${baseName(dir) === "ray-elements" ? "" : "ray-elements/"}tokens.dark.toml`;
    },
  };
  const toggle = document.getElementById("demo-path-simulate");
  toggle.addEventListener("change", () => {
    if (toggle.checked && !getHost()) setHost(stand);
    else if (!toggle.checked && getHost() === stand) setHost(null);
  });

  const form = document.getElementById("demo-path-form");
  const out = document.getElementById("demo-path-out");
  form.addEventListener("change", (e) => {
    if (e.target.localName === "ray-path-input") out.textContent = `${e.target.label}: ${e.target.value}`;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    out.textContent = `Saved: ${[...new FormData(form).values()].map(baseName).join(", ")}`;
  });
</script>
```
