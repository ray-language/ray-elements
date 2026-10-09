With [the native bridge](RAYLANG.md#using-the-bridge), `confirmDialog()` asks with the system's modal dialog instead of a `ray-dialog`, with the same answer. A red confirmation (a destructive action) gets the warning style. `native: false` keeps the page's dialog, for a question that needs more than a sentence.

```js
if (await confirmDialog({ label: "Delete 3 builds?", message: "This cannot be undone.", confirmLabel: "Delete", color: "red" })) {
  window.ray.send("delete:" + ids.join(","));
}
```

`ray-dialog` itself is always the page's: a form, a settings panel or a wizard stay in the page.
