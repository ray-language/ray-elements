# Icon

An icon of the registry: the whole set (the components' too) changes with setIcons().

Import: `import "@raylang/elements/icon";` · Category: Data display

## `<ray-icon>` (RayIcon, extends RayElement)

setIcons({ name: '<svg…>' }) replaces or adds icons (SVG markup or an SVGElement, drawn with currentColor); iconNames() lists them. An icon may have a filled version for a state (filled; "<name>:filled" in setIcons; iconNames({ filled: true }) lists them). The components draw roles ("ui.close", "ui.remove", "ui.expand"…; iconAliases()), each its glyph until the app registers the role: setIcons({ "ui.remove": … }) changes only the chips' ×. Sizes follow the font unless size; --ray-icon-size and --ray-icon-stroke tune the whole system.

Properties:

- `name`: `IconName`, reflects. Registered icon name (iconNames()); "none" draws nothing, a blank that keeps the alignment (a menu item without its check).
- `filled`: boolean, reflects. The filled version, for a state (active, selected, favorite, unread); the outline icon when there is none. Built in: user, info, circle-check, alert-triangle, circle-x, folder, bell, star, settings, home, message-circle.
- `mirror`: boolean, reflects. Mirrored in a right-to-left context (dir="rtl"), for an icon that points along the text: back, forward, send, undo. The roles that do (ui.next, ui.previous, ui.first, ui.last, ui.disclosure, ui.separator) mirror by themselves.
- `size`: string, reflects. xs…xl or any CSS length. Default: 1em.
- `label`: string. Accessible name; without it the icon is decorative (hidden from screen readers).
- `color`: string, reflects. A palette color or any CSS color. Default: the text color.
- `stroke`: number. Stroke width for stroke icons (default: --ray-icon-stroke, 2).

Parts (`::part()`):

- `icon`: The icon box.

Types:

- `"close" | "check" | "minus" | "plus" | "chevron-down" | "chevron-up" | "chevron-right" | "chevron-left" | "chevrons-left" | "chevrons-right" | "search" | "arrow-up-right" | "arrow-down-right" | "sun" | "moon" | "monitor" | "user" | "info" | "circle-check" | "alert-triangle" | "circle-x" | "menu" | "more-horizontal" | "file" | "folder" | "pause" | "play" | "terminal" | "calendar" | "image" | "download" | "eye" | "eye-off" | "bell" | "copy" | "quote" | "pipette" | "star" | "upload" | "paperclip" | "panel-left" | "settings" | "home" | "arrow-left" | "message-circle" | "none" | (string & {})`: An icon name: one of the default set, or any name an app registers with setIcons().

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Registered icons</div>
<div class="demo-panel-head">
  <ray-search id="demo-icon-filter" aria-label="Filter icons" placeholder="Filter icons (favorite, warning…)" size="sm" style="width: min(18rem, 100%)"></ray-search>
  <span class="demo-muted" id="demo-icon-count"></span>
</div>
<div class="demo-icon-grid" id="demo-icon-grid"></div>
<p class="demo-muted" style="margin: 0">Click an icon to copy its markup. The same registry draws the components' own icons (dialog close, select chevron, alert status…).</p>

<div class="demo-caption">Sizes</div>
<div class="demo-row demo-icon-scale">
  <span><ray-icon name="star" size="xs"></ray-icon><small>xs</small></span>
  <span><ray-icon name="star" size="sm"></ray-icon><small>sm</small></span>
  <span><ray-icon name="star" size="md"></ray-icon><small>md</small></span>
  <span><ray-icon name="star" size="lg"></ray-icon><small>lg</small></span>
  <span><ray-icon name="star" size="xl"></ray-icon><small>xl</small></span>
  <span><ray-icon name="star" size="2.5rem"></ray-icon><small>2.5rem</small></span>
</div>

<div class="demo-caption">Stroke</div>
<div class="demo-row demo-icon-scale">
  <span><ray-icon name="folder" size="2rem" stroke="1"></ray-icon><small>1</small></span>
  <span><ray-icon name="folder" size="2rem" stroke="1.5"></ray-icon><small>1.5</small></span>
  <span><ray-icon name="folder" size="2rem" stroke="2"></ray-icon><small>2 (default)</small></span>
  <span><ray-icon name="folder" size="2rem" stroke="2.5"></ray-icon><small>2.5</small></span>
</div>

<div class="demo-caption">Filled: a state</div>
<div class="demo-row demo-icon-scale" id="demo-icon-filled"></div>
<div class="demo-row">
  <ray-toggle id="demo-icon-fav" variant="outline" square label="Favorite"><ray-icon name="star" color="yellow"></ray-icon></ray-toggle>
  <span class="demo-muted">Outline at rest, filled when on: <code>&lt;ray-icon name="star" filled&gt;</code>. The current tab of a <code>ray-bottom-nav</code> draws its icon filled.</span>
</div>

<div class="demo-caption">Colors</div>
<div class="demo-row demo-icon-scale">
  <span><ray-icon name="info" size="lg" color="blue" label="Information"></ray-icon><small>blue</small></span>
  <span><ray-icon name="circle-check" size="lg" color="green" label="Passed"></ray-icon><small>green</small></span>
  <span><ray-icon name="alert-triangle" size="lg" color="yellow" label="Warning"></ray-icon><small>yellow</small></span>
  <span><ray-icon name="circle-x" size="lg" color="red" label="Failed"></ray-icon><small>red</small></span>
  <span><ray-icon name="star" size="lg" color="violet"></ray-icon><small>violet</small></span>
  <span><ray-icon name="user" size="lg" color="#0ea5e9"></ray-icon><small>#0ea5e9</small></span>
</div>

<div class="demo-caption">In context</div>
<div class="demo-row">
  <ray-button><ray-icon slot="left" name="plus"></ray-icon>New project</ray-button>
  <ray-button variant="default"><ray-icon slot="left" name="download"></ray-icon>Export<ray-icon slot="right" name="chevron-down"></ray-icon></ray-button>
  <ray-icon-button variant="default" label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button>
  <ray-badge variant="light" color="green" normal-case><ray-icon name="check"></ray-icon> Passing</ray-badge>
</div>
<p style="margin: 0">Inline with text, an icon follows the font: <ray-icon name="terminal"></ray-icon> run <code>ray test</code>, then open <ray-icon name="file"></ray-icon> report.html.</p>

<div class="demo-caption">Swap the set</div>
<div class="demo-row">
  <ray-toggle id="demo-icons-swap" variant="outline">Filled set</ray-toggle>
  <ray-alert color="blue" label="setIcons()" style="flex: 1; min-width: min(18rem, 100%)">Replaces icons app-wide: the gallery above and every component follow.</ray-alert>
</div>

<script type="module">
  import { setIcons, getIcon, iconNames } from "@raylang/elements/core";
  import { notify } from "@raylang/elements/notification";

  const grid = document.getElementById("demo-icon-grid");
  const filter = document.getElementById("demo-icon-filter");
  const count = document.getElementById("demo-icon-count");
  const names = iconNames();
  // What people search for: the filter matches a name or one of its words.
  const keywords = {
    "close": "x cancel dismiss remove exit", "check": "tick done ok confirm yes", "minus": "remove subtract less collapse",
    "plus": "add new create more expand", "chevron-down": "arrow caret expand open dropdown", "chevron-up": "arrow caret collapse",
    "chevron-right": "arrow caret next forward", "chevron-left": "arrow caret previous back", "chevrons-left": "first rewind start",
    "chevrons-right": "last fast-forward end", "search": "find magnifier lookup zoom", "arrow-up-right": "external link open trend up increase",
    "arrow-down-right": "trend down decrease", "sun": "light theme day bright", "moon": "dark theme night", "monitor": "system screen desktop display computer",
    "user": "person profile account avatar people", "info": "information help about details", "circle-check": "success done passed ok valid",
    "alert-triangle": "warning caution danger error attention", "circle-x": "error failed invalid cancel", "menu": "hamburger navigation list",
    "more-horizontal": "ellipsis dots overflow options actions", "file": "document page paper", "folder": "directory files project",
    "pause": "stop hold media", "play": "start run media resume", "terminal": "console shell command prompt code",
    "calendar": "date day schedule event", "image": "picture photo media gallery", "download": "save export get",
    "eye": "view show visible preview watch", "eye-off": "hide hidden invisible private", "bell": "notification alert alarm reminder",
    "copy": "duplicate clipboard clone", "quote": "blockquote citation", "pipette": "eyedropper color picker",
    "star": "favorite bookmark rating like", "upload": "import send share", "paperclip": "attachment attach clip",
    "panel-left": "sidebar layout drawer", "settings": "preferences options sliders adjust filter", "home": "house start dashboard",
    "arrow-left": "back previous return", "message-circle": "chat comment conversation bubble",
  };
  for (const name of names) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "demo-icon-tile";
    tile.dataset.name = name;
    tile.dataset.words = `${name} ${keywords[name] ?? ""}`;
    tile.title = `<ray-icon name="${name}">`;
    tile.innerHTML = `<ray-icon name="${name}" size="1.5rem"></ray-icon><span></span>`;
    tile.querySelector("span").textContent = name;
    grid.append(tile);
  }
  const show = () => {
    const q = (filter.value ?? "").trim().toLowerCase();
    let shown = 0;
    for (const tile of grid.children) {
      const hit = !q || tile.dataset.words.split(" ").some((w) => w.startsWith(q)) || tile.dataset.name.includes(q);
      tile.hidden = !hit;
      if (hit) shown++;
    }
    count.textContent = q ? (shown ? `${shown} of ${names.length}` : "None: add yours with setIcons()") : `${names.length} icons`;
  };
  filter.addEventListener("input", show);
  show();
  grid.addEventListener("click", async (e) => {
    const tile = e.target.closest(".demo-icon-tile");
    if (!tile) return;
    const markup = `<ray-icon name="${tile.dataset.name}"></ray-icon>`;
    try {
      await navigator.clipboard.writeText(markup);
      notify({ message: `Copied ${markup}`, color: "green", autoClose: 2000 });
    } catch {
      notify({ message: markup, title: "Copy this markup", autoClose: 4000 });
    }
  });

  // Each outline icon and its filled version, side by side.
  const pairs = document.getElementById("demo-icon-filled");
  for (const name of iconNames({ filled: true })) {
    pairs.insertAdjacentHTML("beforeend", `<span><span class="demo-icon-pair"><ray-icon name="${name}" size="xl"></ray-icon><ray-icon name="${name}" size="xl" filled></ray-icon></span><small>${name}</small></span>`);
  }
  const fav = document.getElementById("demo-icon-fav");
  fav.addEventListener("change", () => fav.querySelector("ray-icon").toggleAttribute("filled", fav.pressed));

  // The whole set swapped for the filled versions (setIcons on the outline
  // names): the gallery and the components (alert status…) follow; off restores.
  const filled = Object.fromEntries(iconNames({ filled: true }).map((n) => [n, getIcon(n, { filled: true })]));
  const original = Object.fromEntries(Object.keys(filled).map((n) => [n, getIcon(n)]));
  document.getElementById("demo-icons-swap").addEventListener("change", (e) => {
    setIcons(e.currentTarget.pressed ? filled : original);
  });
</script>
```
