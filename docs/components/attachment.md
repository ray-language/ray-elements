# Attachment

A file in a composer, upload list or chat: thumbnail or type icon, name, size, upload progress, error, remove and download.

Import: `import "@raylang/elements/attachment";` · Category: Data display

## `<ray-attachment>` (RayAttachment, extends RayElement)

Assign a File to `file` to fill name, size, type and an image thumbnail. Removing it (× button) fires a cancelable ray-remove and then removes the element.

Properties:

- `name`: string, reflects. File name (ellipsized; full name in the tooltip).
- `size`: number. Size in bytes, shown as "12 KB", "3.4 MB".
- `type`: string, reflects. MIME type: picks the icon (image or file) and, with the name, the extension badge.
- `src`: string. Thumbnail URL for images (falls back to the icon if it fails to load).
- `href`: string, reflects. Makes the name a download link.
- `progress`: number. Upload progress 0–100: a thin bar and "Uploading… 45%". Unset: done.
- `status`: `uploading` | `done` | `error`, reflects. Explicit state. Default: "uploading" while progress is set, else "done".
- `error`: string. Error text shown with status="error" (default "Upload failed").
- `removable`: boolean, reflects. Shows a remove (×) button.
- `removeLabel` (attribute `remove-label`): string, default `Remove {name}`. Accessible label of the remove button; {name} is replaced by the file name.
- `variant`: `row` | `card`, default `row`, reflects. row: a compact chip; card: the thumbnail on top.
- `disabled`: boolean, reflects. Dimmed, not removable, the name is not a link.

Events:

- `ray-remove` (detail `{ name: string; file: File | null }`): The remove button was pressed; cancelable (preventDefault keeps the element).

Parts (`::part()`):

- `item`: The box.
- `thumbnail`: The thumbnail or icon box.
- `badge`: The extension badge (PDF, PNG…).
- `name`: The file name (a link with href).
- `meta`: Size, upload state or error.
- `progress`: The upload progress bar.
- `remove`: The remove button.

Methods and properties:

- `file: File | null`: The File shown (fills name, size, type and a thumbnail for images).
- `readonly state: "uploading" | "done" | "error"`: The effective status.

## `<ray-attachments>` (RayAttachments, extends RayElement)

A wrapping row of ray-attachment elements.

Slots:

- (default): ray-attachment elements.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<ray-attachments>
  <ray-attachment name="screenshot.png" type="image/png" size="248320" removable
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 30'%3E%3Crect width='40' height='30' fill='%234dabf7'/%3E%3Ccircle cx='12' cy='10' r='4' fill='%23fff'/%3E%3Cpath d='M0 30 14 16l8 8 6-5 12 11z' fill='%231864ab'/%3E%3C/svg%3E"></ray-attachment>
  <ray-attachment name="release-notes-0.4.1.pdf" type="application/pdf" size="1835008" href="#attachment" removable></ray-attachment>
  <ray-attachment name="bundle-macos-arm64.zip" type="application/zip" size="8912896" progress="45" removable></ray-attachment>
  <ray-attachment name="update.json" type="application/json" size="912" status="error" error="Signature mismatch" removable></ray-attachment>
</ray-attachments>
<ray-attachments style="margin-top: 1rem">
  <ray-attachment variant="card" name="mockup.png" type="image/png" size="52224" removable
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 30'%3E%3Crect width='40' height='30' fill='%2338d9a9'/%3E%3Crect x='6' y='6' width='28' height='4' rx='2' fill='%23fff'/%3E%3Crect x='6' y='14' width='18' height='10' rx='2' fill='%230ca678'/%3E%3C/svg%3E"></ray-attachment>
  <ray-attachment variant="card" name="main.ray" type="text/plain" size="3072"></ray-attachment>
</ray-attachments>
<div style="margin-top: 1rem; display: grid; gap: 0.75rem">
  <ray-file-upload id="demo-attach-input" label="Add files" variant="compact" multiple list="none"
    drop-label="Drop files to attach"></ray-file-upload>
  <ray-attachments id="demo-attach-list"></ray-attachments>
</div>
<script type="module">
  // The upload only picks files; this list shows them (list="none" hides its own).
  const list = document.getElementById("demo-attach-list");
  const upload = document.getElementById("demo-attach-input");
  upload.addEventListener("change", () => {
    if (!upload.lastChange) return;
    for (const f of upload.lastChange.added) {
      const a = document.createElement("ray-attachment");
      a.removable = true;
      a.file = f;
      list.append(a);
    }
    upload.files = [];
  });
</script>
```
