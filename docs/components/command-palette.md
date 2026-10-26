# Command palette

Search and run actions from the keyboard (Mantine's Spotlight): fuzzy search, groups, shortcuts, ⌘K / Ctrl+K; combobox + listbox pattern in a modal dialog.

Import: `import "@raylang/elements/command-palette";` · Category: Overlays

## `<ray-command-palette>` (RayCommandPalette, extends RayElement)

Running an action fires ray-select and calls its onSelect. The best matches come first, grouped.

Properties:

- `open`: boolean, reflects. Shown.
- `actions` (property only): `CommandAction[]`. The actions.
- `query`: string. The search text.
- `placeholder`: string, default `Search commands…`. Placeholder of the search field.
- `hotkey`: string, default `mod+k`. Toggle shortcut (mod = ⌘ on macOS, Ctrl elsewhere); empty to disable.
- `limit`: number, default `50`. Maximum results.
- `emptyLabel` (attribute `empty-label`): string, default `Nothing found`. Text without results.
- `label`: string, default `Command palette`. Accessible name.
- `hideHint` (attribute `hide-hint`): boolean, reflects. No keyboard hint at the bottom.
- `navigateLabel` (attribute `navigate-label`): string, default `navigate`. The keyboard hint's word for ↑↓.
- `runLabel` (attribute `run-label`): string, default `run`. The keyboard hint's word for ↵.
- `closeLabel` (attribute `close-label`): string, default `close`. The keyboard hint's word for esc.
- `nativeMenus` (attribute `native-menus`): boolean, reflects. With a native host (ray-elements/core/raylang.js in a std/ui window, menus declared with elements/bridge), also lists the app's menu bar, grouped by menu with its shortcuts; running one gives the program the menu's own event.
- `overlayBlur` (attribute `overlay-blur`): string. Blur of the page behind: px ("8"), a CSS length or "none". Default: --ray-overlay-blur ([overlay] blur in tokens.toml).

Events:

- `ray-select` (detail `{ action: CommandAction }`): An action was run.
- `ray-open`: After it opened.
- `ray-close`: After it closed.

Parts (`::part()`):

- `dialog`: The dialog.
- `input`: The search field.
- `option`: Each result.

Methods and properties:

- `show(): void`: Opens it.
- `hide(): void`: Closes it.
- `toggle(): void`: Opens or closes it.
- `readonly results: CommandAction[]`: The actions matching the query, in display order.

Vue `v-model`: `open` (updated on ray-open, ray-close).

Exports (from `@raylang/elements/command-palette` and `@raylang/elements`):

- `function score(action: CommandAction, query: string): number`: How well an action matches a query (0 = not at all).

Types:

- `{ id?: string; label: string; description?: string; group?: string; keywords?: string | string[]; shortcut?: string; icon?: string | Node; prefix?: string | Node; disabled?: boolean; native?: boolean; tag?: string; onSelect?: (action: CommandAction) => void }`: An action of ray-command-palette. icon is a 1.25rem square (a registered icon name, text or a Node); prefix is content of any width before the label (text or a Node, e.g. a ray-badge with an HTTP method), not searched.

## In a raylang app

With `native-menus` and [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge), the palette also lists the app's menu bar: every item, grouped by its menu, with its shortcut, the disabled ones greyed out. Running one gives the program the same `"menu"` event as choosing it in the menu bar, so the program handles it in one place.

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

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-button id="demo-palette-open" variant="default">Open command palette</ray-button>
  <span id="demo-palette-out" style="color: var(--ray-muted-foreground); font-size: var(--ray-font-size-sm)"></span>
</div>
<ray-command-palette id="demo-palette" hotkey=""></ray-command-palette>
<p class="demo-muted" style="margin: 0">On this site <ray-kbd size="xs">⌘K</ray-kbd> belongs to the docs search in the header — another <code>ray-command-palette</code>, over the components and guides. This one has <code>hotkey=""</code> and opens with the button.</p>
<script type="module">
  const palette = document.getElementById("demo-palette");
  const say = (text) => { document.getElementById("demo-palette-out").textContent = text; };
  palette.actions = [
    { id: "new", label: "New file", group: "File", icon: "file", shortcut: "⌘ N", onSelect: () => say("New file") },
    { id: "open", label: "Open file…", group: "File", icon: "folder", shortcut: "⌘ O", keywords: ["load"], onSelect: () => say("Open file") },
    { id: "save", label: "Save", group: "File", icon: "check", shortcut: "⌘ S", disabled: true },
    { id: "run", label: "Run program", description: "ray run src/main.ray", group: "Raylang", icon: "play", onSelect: () => say("ray run") },
    { id: "test", label: "Run tests", description: "ray test", group: "Raylang", icon: "circle-check", onSelect: () => say("ray test") },
    { id: "fmt", label: "Format document", description: "ray fmt", group: "Raylang", icon: "terminal", keywords: ["prettier", "style"], onSelect: () => say("ray fmt") },
    { id: "theme", label: "Toggle theme", group: "View", icon: "moon", onSelect: () => say("Theme") },
    // prefix: content of any width before the label, here a colored method.
    { id: "list", label: "List releases", description: "/repos/ray/releases", group: "Requests", prefix: method("GET", "green"), onSelect: () => say("GET") },
    { id: "create", label: "Create release", description: "/repos/ray/releases", group: "Requests", prefix: method("POST", "blue"), onSelect: () => say("POST") },
  ];
  function method(name, color) {
    const badge = document.createElement("ray-badge");
    Object.assign(badge, { size: "xs", color, variant: "light" });
    badge.textContent = name;
    badge.style.minWidth = "3rem";
    return badge;
  }
  document.getElementById("demo-palette-open").addEventListener("click", () => palette.show());
</script>
```
