# Avatar picker (also Profile picture, Photo picker)

A profile picture field: a ray-avatar (the initials of display-name without a picture), Choose photo / Change photo and Remove photo, and a sheet with a ray-image-crop to frame the chosen image in a circle before it is kept. A bottom drawer on a narrow screen, a dialog otherwise. The value is the framed picture as a data URL, or a Blob with output="blob"; it takes part in a <form>.

Import: `import "@raylang/elements/avatar-picker";` · Category: Inputs

## `<ray-avatar-picker>` (RayAvatarPicker, extends FormControl)

Choose photo opens the system picker (on a phone, the camera or the photo library); the chosen image opens in the sheet, framed in a circle, and Use photo makes the framed part, at output-size, the value. Cancel or a picture that cannot be decoded leaves the value as it was (the latter shows failed-label and fires ray-error). edit(file) opens the sheet on an image from elsewhere (a drop, a paste). Styling: the parts, and ::part(crop) for --ray-image-crop-* .

Properties:

- `name`: string, reflects. Form field name. The value is submitted as a string (data URL) or, with output="blob", as a file named <name>.jpg (.png, .webp).
- `value`: `string | Blob | null`. The picture: a URL or data URL (the value attribute: the initial picture, and what a form reset goes back to), or a Blob. null without one.
- `output`: `dataurl` | `blob`, default `dataurl`, reflects. What Use photo makes the value: a data URL (easy to keep in JSON) or a Blob (to upload).
- `label`: string. Label above the avatar and the buttons.
- `description`: string. Help text under the label.
- `error`: string. Error message; marks the field invalid.
- `required`: boolean, reflects. A picture is required to submit the form.
- `disabled`: boolean, reflects. No choosing, removing nor preview (also inside a disabled <fieldset>).
- `readonly`: boolean, reflects. The picture cannot be changed: the buttons are hidden, the preview still works. Not validated (required does not apply), as a native readonly field.
- `displayName` (attribute `display-name`): string. The person's name: the avatar shows its initials without a picture (name is the form field).
- `accept`: string, default `image/*`. File types the picker offers.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `xl`, reflects. Size of the avatar.
- `color`: string. Color of the avatar's initials (a palette color or any CSS color).
- `variant`: `light` | `filled` | `outline` | `default`, default `light`. Style of the avatar's initials.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius of the avatar. Default: full (the crop frames a circle either way; the picture is square).
- `buttonSize` (attribute `button-size`): `xs` | `sm` | `md` | `lg` | `xl`, default `sm`. Size of the buttons.
- `layout`: `stack` | `inline`, default `stack`, reflects. The buttons one under the other, beside the avatar, or in a row.
- `sheet`: `auto` | `drawer` | `dialog`, default `auto`, reflects. Where the crop opens: auto is a bottom drawer on a narrow screen (up to 40em) and a dialog otherwise.
- `outputSize` (attribute `output-size`): `string | number`, default `320`. Side of the square picture kept, in pixels.
- `type`: `"image/jpeg" | "image/png" | "image/webp" | (string & {})`, default `image/jpeg`. Format of the picture kept (PNG where the browser cannot encode it).
- `quality`: number, default `0.85`. 0…1, for image/jpeg and image/webp.
- `maxZoom` (attribute `max-zoom`): number, default `4`. The most zoom of the crop.
- `pickLabel` (attribute `pick-label`): string, default `Choose photo` (text `avatar-picker.pick`). The button without a picture.
- `changeLabel` (attribute `change-label`): string, default `Change photo` (text `avatar-picker.change`). The same button with a picture.
- `removeLabel` (attribute `remove-label`): string, default `Remove photo` (text `avatar-picker.remove`). The button that removes the picture.
- `sheetLabel` (attribute `sheet-label`): string, default `Adjust the photo` (text `avatar-picker.sheet`). Title of the crop sheet.
- `useLabel` (attribute `use-label`): string, default `Use photo` (text `avatar-picker.use`). The sheet's button that keeps the framed picture.
- `cancelLabel` (attribute `cancel-label`): string, default `Cancel` (text `avatar-picker.cancel`). The sheet's button that leaves the value as it was.
- `cropLabel` (attribute `crop-label`): string, default `Photo framing` (text `avatar-picker.crop`). Accessible name of the crop area.
- `zoomLabel` (attribute `zoom-label`): string, default `Zoom` (text `avatar-picker.zoom`). Name of the zoom slider.
- `preview`: boolean, reflects. With a picture, the avatar is a button (click, Enter, Space): it fires ray-preview and, unless that is canceled, shows the picture large in a dialog. Also with readonly; not while disabled.
- `previewLabel` (attribute `preview-label`): string, default `View photo` (text `avatar-picker.preview`). Accessible name of the avatar button and title of the preview dialog.
- `requiredLabel` (attribute `required-label`): string, default `Please choose a photo.` (text `avatar-picker.required`). Validation message of required without a picture.
- `failedLabel` (attribute `failed-label`): string, default `That image could not be opened.` (text `avatar-picker.failed`). Shown under the field when the chosen file cannot be decoded, or the framed picture encoded (until the next picture).

Events:

- `input`: The value changed (fired with change).
- `change`: A picture was kept (Use photo) or removed. Read value.
- `ray-preview` (detail `{ value: string | Blob }`): The avatar was pressed (with preview and a picture). Cancelable: preventDefault() to do something else than the preview dialog (a menu, an app's own viewer).
- `ray-error` (detail `{ error: Error }`): The chosen file could not be decoded, or the framed picture encoded; the value is unchanged.

Parts (`::part()`):

- `label`: The label.
- `description`: The description.
- `row`: The avatar and the buttons (role group, named by the label).
- `view`: Around the avatar; a button with preview and a picture.
- `avatar`: The ray-avatar.
- `actions`: The buttons' column (or row).
- `pick`: The Choose photo / Change photo ray-button.
- `remove`: The Remove photo ray-button.
- `error`: The error message.
- `sheet`: The ray-drawer or ray-dialog of the crop.
- `crop`: The ray-image-crop.
- `preview`: The ray-dialog of the preview.
- `preview-image`: The picture in the preview dialog.
- `cancel`: The sheet's Cancel ray-button.
- `use`: The sheet's Use photo ray-button.

Methods and properties:

- `pick(): void`: Opens the system picker (what Choose photo does).
- `edit(src: Blob | string): void`: Opens the crop sheet on an image (a File, Blob or URL); Use photo makes it the value.
- `showPreview(): void`: Shows the picture large in a dialog (nothing without one, or while disabled).
- `clear(): void`: Removes the picture (fires input and change when there was one).
- `toBlob(): Promise<Blob | null>`: The value as a Blob whatever output is (null without a picture). A URL value is fetched: a cross-origin one needs CORS, and a data URL needs a Content-Security-Policy whose connect-src allows data:.

Vue `v-model`: `value` (updated on change).

Texts (`setStrings`; English):

- `avatar-picker.pick`: Choose photo
- `avatar-picker.change`: Change photo
- `avatar-picker.remove`: Remove photo
- `avatar-picker.sheet`: Adjust the photo
- `avatar-picker.use`: Use photo
- `avatar-picker.cancel`: Cancel
- `avatar-picker.crop`: Photo framing
- `avatar-picker.zoom`: Zoom
- `avatar-picker.preview`: View photo
- `avatar-picker.required`: Please choose a photo.
- `avatar-picker.failed`: That image could not be opened.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.19.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Choose a picture, frame it in the circle, use it: the value is a small square JPEG</div>
<div class="demo-grid">
  <ray-avatar-picker id="demo-avatar-picker" label="Profile picture" display-name="Ada Lovelace" color="teal" variant="filled" preview description="Drag to frame it; pinch, the wheel or the slider to zoom. preview: click the picture to see it large."></ray-avatar-picker>
  <ray-avatar-picker id="demo-avatar-picker-logo" label="Team logo" display-name="Ray Labs" preview size="lg" layout="inline" output="blob" output-size="256" type="image/png" pick-label="Upload logo" change-label="Replace" remove-label="Remove" sheet="dialog"></ray-avatar-picker>
</div>
<p class="demo-muted" id="demo-avatar-picker-out">Choose a picture: its size shows here.</p>

<div class="demo-caption">In a form, and disabled</div>
<form class="demo-grid" id="demo-avatar-picker-form" novalidate>
  <ray-avatar-picker name="photo" label="Photo" required display-name="Grace Hopper" size="md" button-size="xs"></ray-avatar-picker>
  <ray-avatar-picker label="Disabled" disabled display-name="Alan Turing" size="md" button-size="xs"></ray-avatar-picker>
  <ray-avatar-picker id="demo-avatar-picker-readonly" label="Read-only" readonly preview display-name="Alan Turing" size="md"></ray-avatar-picker>
  <div class="demo-actions"><ray-button type="submit" size="sm">Submit</ray-button><ray-button type="reset" size="sm" variant="default">Reset</ray-button><span class="demo-muted" id="demo-avatar-picker-form-out"></span></div>
</form>

<script type="module">
  const out = document.getElementById("demo-avatar-picker-out");
  for (const picker of document.querySelectorAll("ray-avatar-picker")) {
    picker.addEventListener("change", () => {
      const v = picker.value;
      out.textContent = !v ? `${picker.label}: removed`
        : typeof v === "string" ? `${picker.label}: a data URL of ${Math.round(v.length / 1024)} KB`
        : `${picker.label}: a ${v.type} Blob of ${Math.round(v.size / 1024)} KB`;
    });
  }

  // An app's own action instead of the preview dialog.
  document.getElementById("demo-avatar-picker-logo").addEventListener("ray-preview", (e) => {
    e.preventDefault();
    out.textContent = "Team logo: ray-preview, handled by the page (preventDefault): no dialog";
  });

  // A picture to look at: readonly keeps the preview.
  {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 160, 160);
    gr.addColorStop(0, "#f59e0b");
    gr.addColorStop(1, "#0ea5e9");
    g.fillStyle = gr;
    g.fillRect(0, 0, 160, 160);
    document.getElementById("demo-avatar-picker-readonly").value = c.toDataURL("image/jpeg", 0.85);
  }

  const form = document.getElementById("demo-avatar-picker-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const photo = form.querySelector('[name="photo"]');
    photo.error = photo.value ? "" : "Choose a photo.";
    if (!photo.value) return;
    const v = new FormData(form).get("photo");
    document.getElementById("demo-avatar-picker-form-out").textContent = `photo=${String(v).slice(0, 32)}…`;
  });
  form.addEventListener("reset", () => {
    form.querySelector('[name="photo"]').error = "";
  });
</script>
```
