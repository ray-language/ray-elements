# Menu

A dropdown menu (menu button pattern: arrows, Home/End, typeahead, Enter, Escape) or, with context, a context menu at the pointer.

Import: `import "@raylang/elements/menu";` · Category: Overlays

## `<ray-menu>` (RayMenu, extends Floating)

Properties:

- `open`: boolean, reflects. Shown.
- `placement`: `bottom-start` | `bottom` | `bottom-end` | `top-start` | `top` | `top-end` | `right-start` | `left-start`, default `bottom-start`, reflects. Preferred side and alignment.
- `context`: boolean, reflects. Opens on right click (contextmenu) over the trigger area, at the pointer.
- `keepOpen` (attribute `keep-open`): boolean, reflects. Choosing an item does not close the menu.
- `native`: boolean, reflects. With a native host (ray-elements/core/raylang.js in a std/ui window), opens as the system's context menu at the pointer: items and dividers, same ray-select.

Also the properties of Floating: `offset`.

Events:

- `ray-select` (detail `{ value: string; item: RayMenuItem }`): An item was chosen; detail: { value, item }.
- `ray-open`: After it opened.
- `ray-close`: After it closed.

Slots:

- `trigger`: The button that opens it, or the area for a context menu.
- (default): ray-menu-item, ray-menu-label and ray-menu-divider elements.

Parts (`::part()`):

- `dropdown`: The panel.

Methods and properties:

- `popupNative(): Promise<RayMenuItem | null>`: Opens the items as the system's context menu (needs a native host); resolves to the chosen item, or null.
- `show(): void`: Opens it.
- `hide(): void`: Closes it.
- `toggle(): void`: Opens or closes it.
- `readonly trigger: Element | null`: The trigger element.
- `readonly items: RayMenuItem[]`: The items of this menu.

Vue `v-model`: `open` (updated on ray-open, ray-close).

## `<ray-menu-item>` (RayMenuItem, extends RayElement)

Properties:

- `value`: string, reflects. Reported in ray-select (default: the text).
- `disabled`: boolean, reflects. Skipped by the keyboard, cannot be chosen.
- `color`: string, reflects. Text and hover color (e.g. red for destructive actions).

Slots:

- (default): Label.
- `left`: Icon.
- `right`: Shortcut or badge.

## `<ray-menu-label>` (RayMenuLabel, extends RayElement)

A section caption inside the menu.

## `<ray-menu-divider>` (RayMenuDivider, extends RayElement)

A separator between groups of items.

## In a raylang app

With `native` and [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge), the menu opens as the system's context menu at the pointer: its items and dividers, disabled ones greyed out. The choice fires the same `ray-select`, so the same code handles both.

```html
<ray-menu native context>
  <div slot="trigger" class="file-row">report.csv</div>
  <ray-menu-item value="open">Open</ray-menu-item>
  <ray-menu-item value="reveal">Show in Finder</ray-menu-item>
  <ray-menu-divider></ray-menu-divider>
  <ray-menu-item value="delete" color="red">Delete</ray-menu-item>
</ray-menu>
```

Labels, nested menus, icons and colors are the page menu's only. A dismissed native menu fires nothing.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Row actions</div>
<ul class="demo-files" id="demo-files">
  <li><span class="ic" style="--c: var(--ray-blue-light-color); --b: var(--ray-blue-light)"><ray-icon name="file"></ray-icon></span><span class="name">release-notes.md</span><small>12 KB · 2 h ago</small></li>
  <li><span class="ic" style="--c: var(--ray-violet-light-color); --b: var(--ray-violet-light)"><ray-icon name="image"></ray-icon></span><span class="name">screenshot-dark.png</span><small>1.8 MB · yesterday</small></li>
  <li><span class="ic" style="--c: var(--ray-teal-light-color); --b: var(--ray-teal-light)"><ray-icon name="folder"></ray-icon></span><span class="name">bundles</span><small>6 files · Oct 2</small></li>
</ul>
<template id="demo-file-menu">
  <ray-menu placement="bottom-end">
    <ray-icon-button slot="trigger" variant="subtle" size="sm" label="Actions"><ray-icon name="more-horizontal"></ray-icon></ray-icon-button>
    <ray-menu-item value="rename"><ray-icon slot="left" name="file"></ray-icon>Rename<ray-kbd slot="right" size="xs">F2</ray-kbd></ray-menu-item>
    <ray-menu-item value="duplicate"><ray-icon slot="left" name="copy"></ray-icon>Duplicate<ray-kbd slot="right" size="xs">⌘D</ray-kbd></ray-menu-item>
    <ray-menu-item value="download"><ray-icon slot="left" name="download"></ray-icon>Download</ray-menu-item>
    <ray-menu-divider></ray-menu-divider>
    <ray-menu-item value="delete" color="red"><ray-icon slot="left" name="circle-x"></ray-icon>Delete</ray-menu-item>
  </ray-menu>
</template>
<span class="demo-muted" id="demo-files-out">Use the ⋯ of a row.</span>

<div class="demo-caption">Account and view options</div>
<div class="demo-row demo-menu-row">
  <ray-menu placement="bottom-start">
    <button slot="trigger" class="demo-account" type="button"><ray-avatar name="Ada Lovelace" color="pink" size="sm"></ray-avatar><span><b>Ada Lovelace</b><small>Pro plan</small></span><ray-icon name="chevron-down"></ray-icon></button>
    <ray-menu-label>ada@ray.dev</ray-menu-label>
    <ray-menu-item value="profile"><ray-icon slot="left" name="user"></ray-icon>Profile</ray-menu-item>
    <ray-menu-item value="settings"><ray-icon slot="left" name="settings"></ray-icon>Settings<ray-kbd slot="right" size="xs">⌘,</ray-kbd></ray-menu-item>
    <ray-menu-item value="notifications"><ray-icon slot="left" name="bell"></ray-icon>Notifications<ray-badge slot="right" size="xs" color="red" variant="filled">3</ray-badge></ray-menu-item>
    <ray-menu-divider></ray-menu-divider>
    <ray-menu-label>Workspace</ray-menu-label>
    <ray-menu-item value="switch"><ray-icon slot="left" name="chevrons-right"></ray-icon>Switch workspace</ray-menu-item>
    <ray-menu-item value="invite"><ray-icon slot="left" name="plus"></ray-icon>Invite people</ray-menu-item>
    <ray-menu-divider></ray-menu-divider>
    <ray-menu-item value="signout" color="red">Sign out</ray-menu-item>
  </ray-menu>

  <ray-menu id="demo-view-menu" keep-open placement="bottom-start">
    <ray-button slot="trigger" variant="default"><ray-icon slot="left" name="eye"></ray-icon>View<ray-icon slot="right" name="chevron-down"></ray-icon></ray-button>
    <ray-menu-label>Show (keep-open)</ray-menu-label>
    <ray-menu-item value="lines" data-on><ray-icon slot="left" name="check"></ray-icon>Line numbers</ray-menu-item>
    <ray-menu-item value="minimap"><ray-icon slot="left" name="none"></ray-icon>Minimap</ray-menu-item>
    <ray-menu-item value="wrap" data-on><ray-icon slot="left" name="check"></ray-icon>Word wrap</ray-menu-item>
    <ray-menu-item value="whitespace"><ray-icon slot="left" name="none"></ray-icon>Whitespace</ray-menu-item>
  </ray-menu>
  <span class="demo-muted" id="demo-view-out">Showing: lines, wrap</span>
</div>

<div class="demo-caption">Placements</div>
<div class="demo-row">
  <ray-menu placement="bottom-start"><ray-button slot="trigger" size="xs" variant="light">bottom-start</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
  <ray-menu placement="bottom"><ray-button slot="trigger" size="xs" variant="light">bottom</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
  <ray-menu placement="bottom-end"><ray-button slot="trigger" size="xs" variant="light">bottom-end</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
  <ray-menu placement="top-start"><ray-button slot="trigger" size="xs" variant="light">top-start</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
  <ray-menu placement="right-start"><ray-button slot="trigger" size="xs" variant="light">right-start</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
  <ray-menu placement="left-start"><ray-button slot="trigger" size="xs" variant="light">left-start</ray-button><ray-menu-item>One</ray-menu-item><ray-menu-item>Two</ray-menu-item></ray-menu>
</div>

<div class="demo-caption">Context menu</div>
<ray-menu context id="demo-context">
  <div slot="trigger" class="demo-canvas">
    <span class="shape" style="--c: var(--ray-violet-light); left: 12%; top: 22%"></span>
    <span class="shape round" style="--c: var(--ray-teal-light); left: 46%; top: 38%"></span>
    <span class="shape" style="--c: var(--ray-orange-light); left: 72%; top: 18%"></span>
    <span class="hint">Right-click (or long-press) anywhere on the canvas</span>
  </div>
  <ray-menu-item value="cut">Cut<ray-kbd slot="right" size="xs">⌘X</ray-kbd></ray-menu-item>
  <ray-menu-item value="copy">Copy<ray-kbd slot="right" size="xs">⌘C</ray-kbd></ray-menu-item>
  <ray-menu-item value="paste" disabled>Paste<ray-kbd slot="right" size="xs">⌘V</ray-kbd></ray-menu-item>
  <ray-menu-divider></ray-menu-divider>
  <ray-menu-item value="front">Bring to front</ray-menu-item>
  <ray-menu-item value="back">Send to back</ray-menu-item>
</ray-menu>
<span class="demo-muted" id="demo-context-out"></span>

<script type="module">
  // Row actions: one menu per row, from a template; the choice acts on the row.
  const list = document.getElementById("demo-files");
  const say = (t) => { document.getElementById("demo-files-out").textContent = t; };
  const addMenu = (li) => {
    const menu = document.getElementById("demo-file-menu").content.firstElementChild.cloneNode(true);
    li.append(menu);
    menu.addEventListener("ray-select", (e) => {
      const name = li.querySelector(".name");
      if (e.detail.value === "rename") { name.textContent = name.textContent.replace(/(\.[^.]+)?$/, "-renamed$1"); say(`Renamed to ${name.textContent}`); }
      if (e.detail.value === "duplicate") { const copy = li.cloneNode(true); copy.querySelector("ray-menu").remove(); copy.querySelector(".name").textContent += " (copy)"; li.after(copy); addMenu(copy); say(`Duplicated ${name.textContent}`); }
      if (e.detail.value === "download") say(`Downloading ${name.textContent}…`);
      if (e.detail.value === "delete") { say(`Deleted ${name.textContent}`); li.remove(); }
    });
  };
  for (const li of list.children) addMenu(li);

  // View options: keep-open, each item toggles a check.
  const view = document.getElementById("demo-view-menu");
  view.addEventListener("ray-select", (e) => {
    const item = view.querySelector(`ray-menu-item[value="${e.detail.value}"]`);
    const on = !item.hasAttribute("data-on");
    item.toggleAttribute("data-on", on);
    item.querySelector("ray-icon").name = on ? "check" : "none";
    const shown = [...view.querySelectorAll("ray-menu-item[data-on]")].map((i) => i.getAttribute("value"));
    document.getElementById("demo-view-out").textContent = `Showing: ${shown.join(", ") || "nothing"}`;
  });

  document.getElementById("demo-context").addEventListener("ray-select", (e) => {
    document.getElementById("demo-context-out").textContent = `ray-select: ${e.detail.value}`;
  });
</script>
```
