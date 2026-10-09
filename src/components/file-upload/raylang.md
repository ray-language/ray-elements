In a `std/ui` window with [the native bridge](RAYLANG.md#using-the-bridge), `native` makes browsing open the system's file dialog, with the `accept` types as its filter. The files it gives are paths on the user's disk, not bytes: they list like any other file (name, size, type) and the program reads them.

```html
<form id="import">
  <ray-file-upload name="photos" native multiple accept="image/*" label="Photos"></ray-file-upload>
</form>
```

```js
upload.addEventListener("change", () => {
  window.ray.send("import:" + JSON.stringify(upload.paths));   // ["/Users/ada/Pictures/a.jpg", …]
});
```

The form submits those paths under `name`. Dropped and pasted files are still `File` objects (`upload.files` holds both; a chosen one is a `HostFile` with a `path`). Without the bridge, or in a browser, `native` changes nothing.
