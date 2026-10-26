With `native` and [the native bridge](RAYLANG.md#using-the-bridge), the menu opens as the system's context menu at the pointer: its items and dividers, disabled ones greyed out. The choice fires the same `ray-select`, so the same code handles both.

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

The native menu reads its items the moment it opens, so items that depend on what was clicked go in `ray-request-open`, which comes first (a `contextmenu` listener of your own on the trigger may run after the menu's):

```js
menu.addEventListener("ray-request-open", (e) => {
  const row = e.detail.event.target.closest(".file-row");
  menu.replaceChildren(menu.querySelector("[slot=trigger]"), ...itemsFor(row));
});
```
