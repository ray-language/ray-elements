# File upload

A drop zone to pick files: drag, click, keyboard or paste. Checks type, size and count as files arrive, lists them as ray-attachment rows (thumbnails, remove) and submits them with its form.

Import: `import "@raylang/elements/file-upload";` · Category: Inputs

## `<ray-file-upload>` (RayFileUpload, extends FormControl)

A drag that can only be refused turns the zone red before the drop; refused files fire ray-reject and are explained under the zone. Without multiple a new file replaces the current one. Uploading is the app's: attachmentFor(file) gives the row whose progress/status/error to set.

Properties:

- `name`: string, reflects. Form field name: every file is submitted under it.
- `label`: string. Label above the zone.
- `description`: string. Help text under the label.
- `error`: string. Error text (replaces the explanation of refused files).
- `required`: boolean, reflects. The form needs at least one file.
- `disabled`: boolean, reflects. No picking, dropping or removing.
- `accept`: string, reflects. Accepted types, as in <input type=file>: ".pdf,.png", "image/*", "application/json".
- `multiple`: boolean, reflects. Several files (else one, replaced by the next).
- `maxSize` (attribute `max-size`): `string | number`. Largest file: bytes or a size like "10 MB", "512 KB".
- `maxFiles` (attribute `max-files`): number. With multiple: the most files kept.
- `hint`: string. Small text in the zone. Default: from accept, max-size and max-files ("PNG or PDF · up to 10 MB each · max. 5 files").
- `dropLabel` (attribute `drop-label`): string, default `Drag files here`. Title of the zone, before "or browse".
- `browseLabel` (attribute `browse-label`): string, default `browse`. The link-styled word (the button text in compact).
- `activeLabel` (attribute `active-label`): string, default `Drop to add files`. Title while files are dragged over it.
- `tapLabel` (attribute `tap-label`): string, default `Choose files`. Title on touch screens (no hover), where dragging files is rare.
- `variant`: `default` | `compact`, default `default`, reflects. default: a tall centered zone; compact: one row with a Browse button.
- `list`: `rows` | `cards` | `none`, default `rows`, reflects. How chosen files show: full-width rows, thumbnail cards, or not at all (render your own on change).
- `native`: boolean, reflects. With a native host (ray-elements/core/raylang.js in a std/ui window), browsing opens the system dialog and gives paths (see `paths`); drop and paste still give Files.
- `color`: string, reflects. Accent of hover, drag and the browse link (default: primary).

Events:

- `change`: Files were added or removed (read `files`, and `lastChange` for which).
- `ray-reject` (detail `{ rejected: FileRejection[] }`): Some files were refused (type, size or count).
- `ray-error` (detail `{ error: Error }`): The native dialog failed (with `native`).

Slots:

- `icon`: Replaces the upload icon.

Parts (`::part()`):

- `dropzone`: The zone (a button).
- `icon`: The icon tile.
- `hint`: The small text in the zone.
- `files`: The list of chosen files.
- `label`: The label.
- `error`: The error text.

Methods and properties:

- `files: (File | HostFile)[]`: The chosen files (assign to replace them, without events).
- `readonly paths: string[]`: The paths of the files chosen with the native dialog (`native`), in order; they are also what the form submits for them.
- `readonly lastChange: FileUploadChange | null`: What the last change event changed: the files added and removed. null before the first one, and after assigning files.
- `open(): void`: Opens the system file picker.
- `addFiles(files: Iterable<File>): { accepted: File[]; rejected: FileRejection[] }`: Adds files as if dropped (checks them, fires the events).
- `removeFile(file: File): boolean`: Removes a file (fires change).
- `clear(): void`: Removes every file (fires change).
- `attachmentFor(file: File): RayAttachment | null`: The row of a file, to show its upload progress, status or error.

Exports (from `@raylang/elements/file-upload` and `@raylang/elements`):

- `function parseSize(value: string | number | null | undefined): number`: Bytes from a number or a size like "10 MB" (NaN if neither).
- `function matchesAccept(file: { name: string; type: string }, accept: string | null | undefined): boolean`: Whether a file passes an accept list.
- `function describeAccept(accept: string | null | undefined): string`: A short human list of an accept value ("PNG, JPG or PDF").

Types:

- `{ added: (File | HostFile)[]; removed: (File | HostFile)[] }`: The files a change added and removed.
- `{ file: File; reason: "type" | "size" | "count"; message: string }`: A refused file and why.

## In a raylang app

In a `std/ui` window with [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge), `native` makes browsing open the system's file dialog, with the `accept` types as its filter. The files it gives are paths on the user's disk, not bytes: they list like any other file (name, size, type) and the program reads them.

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

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <ray-file-upload label="Release assets" name="assets" multiple max-files="5" max-size="10 MB"
    accept=".zip,.dmg,.json,image/*" description="Bundles, the update manifest and screenshots."></ray-file-upload>
  <div class="demo-stack">
    <ray-file-upload label="Avatar" name="avatar" accept="image/png,image/jpeg" max-size="2 MB" variant="compact"
      drop-label="Drop an image" list="cards"></ray-file-upload>
    <ray-file-upload label="Signing key" accept=".pem" variant="compact" drop-label="Drop the .pem file" color="teal"></ray-file-upload>
    <ray-file-upload label="Locked" variant="compact" disabled hint="Uploads are paused during the release"></ray-file-upload>
  </div>
</div>
<ray-file-upload id="demo-upload" label="Simulated upload" multiple list="rows"
  hint="Files are not sent anywhere: the progress is simulated"></ray-file-upload>
<script type="module">
  const up = document.getElementById("demo-upload");
  up.addEventListener("change", () => {
    for (const file of up.lastChange?.added ?? []) {
      let pct = 0;
      const timer = setInterval(() => {
        const row = up.attachmentFor(file);
        if (!row) return clearInterval(timer);
        pct = Math.min(100, pct + 8 + Math.random() * 18);
        row.progress = Math.round(pct);
        if (pct >= 100) {
          clearInterval(timer);
          row.progress = undefined;
          if (/fail/i.test(file.name)) { row.status = "error"; row.error = "Server rejected the file"; }
        }
      }, 300);
    }
  });
</script>
```
