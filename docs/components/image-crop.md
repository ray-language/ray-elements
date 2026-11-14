# Image crop

Frame an image in a rectangle or a circle of a fixed aspect, by dragging, pinching, the wheel or the keyboard, and export the framed part at a chosen size as a Blob or a data URL. The piece between ray-file-upload (or an <input type=file>) and ray-avatar.

Import: `import "@raylang/elements/image-crop";` · Category: Inputs

## `<ray-image-crop>` (RayImageCrop, extends RayElement)

The image always covers the frame: at zoom 1 it fits the frame's short side, and it cannot be moved so far that a gap shows. The framing is read and set as crop, a rectangle in pixels of the original, so it can be saved, reopened or applied elsewhere. The image is decoded once into a reduced working copy (as many pixels as the output, or the stage on screen, need at max-zoom) and the full-size decode is released; toBlob and toDataURL draw from that copy. EXIF orientation is applied, as in an <img>. Styling: --ray-image-crop-inset (the dimmed margin around the frame, default --ray-space-4), --ray-image-crop-dim (its color) and --ray-image-crop-max-height (default 70vh).

Properties:

- `src`: `string | Blob | null`. The image: a URL, or (as a property) a File or Blob, such as the one an <input type=file> gives. A cross-origin URL needs CORS to be exportable. A HostFile (the paths of ray-file-upload native) has no bytes: read it in the program and pass a URL.
- `aspect`: string, default `1`, reflects. Width / height of the frame and of the output: "1", "16/9", "4:3", "1.5".
- `shape`: `rect` | `circle`, default `rect`, reflects. The frame's mask. circle (an ellipse when the aspect is not 1) only masks: the output is still the rectangle, for ray-avatar to round.
- `zoom`: number, default `1`. 1: the image covers the frame; 2: twice as close. Kept between min-zoom and max-zoom; the user changes it.
- `minZoom` (attribute `min-zoom`): number, default `1`. The least zoom (1 or more: the image always covers the frame).
- `maxZoom` (attribute `max-zoom`): number, default `4`. The most zoom. It also sets how many pixels the working copy keeps.
- `zoomControl` (attribute `zoom-control`): boolean, reflects. A zoom slider under the image (the wheel, pinch and + / - zoom in any case).
- `outputSize` (attribute `output-size`): `string | number`, default `512`. Size of the exported image: a width ("320", the height from the aspect) or "640x360".
- `type`: `"image/jpeg" | "image/png" | "image/webp" | (string & {})`, default `image/jpeg`. Format of toBlob/toDataURL. A browser that cannot encode it gives PNG (Safari has no WebP encoder).
- `quality`: number, default `0.85`. 0…1, for image/jpeg and image/webp.
- `label`: string, default `Crop image`. Accessible name of the image area.
- `zoomLabel` (attribute `zoom-label`): string, default `Zoom`. Name of the zoom slider, and the word of the announced zoom ("Zoom 150%").
- `disabled`: boolean, reflects. No moving nor zooming.

Events:

- `input`: The framing moved (every step of a drag, pinch, wheel or the slider).
- `change`: The framing settled: pointer released, a key pressed, the slider released or the wheel stopped (read crop, zoom).
- `ray-load` (detail `{ width: number; height: number }`): The image loaded (its original size).
- `ray-error` (detail `{ error: Error }`): The image could not be loaded or decoded.

Parts (`::part()`):

- `stage`: The image area (focusable; role slider for the zoom).
- `image`: The image (a canvas of the working copy).
- `frame`: The frame; what lies outside it is dimmed.
- `zoom`: The zoom ray-slider (with zoom-control).

Methods and properties:

- `crop: CropRect | null`: The framed part in pixels of the original (null without an image). Assign it, even before the image loads, to frame a rectangle: the zoom that shows all of it, centered on it.
- `readonly ready: Promise<boolean>`: Resolves when the current src has loaded (true) or failed (false).
- `readonly loaded: boolean`: An image is shown.
- `readonly naturalWidth: number`: Width of the original (0 without an image).
- `readonly naturalHeight: number`: Height of the original (0 without an image).
- `toBlob(options?: CropOutputOptions): Promise<Blob | null>`: The framed part at the output size and format (null without an image).
- `toDataURL(options?: CropOutputOptions): string`: The same as a data URL ("" without an image).
- `toCanvas(options?: CropOutputOptions): HTMLCanvasElement | null`: The framed part drawn on a new canvas of the output size.
- `reset(): void`: Back to the least zoom, centered (no events).

Vue `v-model`: `zoom` (updated on input).

Exports (from `@raylang/elements/image-crop` and `@raylang/elements`):

- `function parseAspect(value: string | number | null | undefined): number`: A ratio from "16/9", "4:3", "1.5" or a number (1 when it is none of them).

Types:

- `{ x: number; y: number; width: number; height: number }`: A rectangle in pixels of the original image.
- `{ size?: string | number; width?: number; height?: number; type?: string; quality?: number }`: Overrides output-size (size, or width and height), type and quality for one export.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.19.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A profile photo</div>
<div class="demo-crop-profile">
  <ray-avatar id="demo-crop-avatar" name="Ada Lovelace" size="xl"></ray-avatar>
  <div class="demo-crop-profile-text">
    <strong>Ada Lovelace</strong>
    <div class="demo-crop-actions">
      <ray-button size="sm" variant="default" id="demo-crop-choose">Choose photo</ray-button>
      <ray-button size="sm" variant="subtle" id="demo-crop-sample">Use a sample</ray-button>
      <ray-button size="sm" variant="subtle" color="red" id="demo-crop-remove" hidden>Remove photo</ray-button>
    </div>
  </div>
  <input type="file" accept="image/*" id="demo-crop-file" hidden>
</div>

<ray-drawer id="demo-crop-sheet" label="Adjust the photo" description="Drag to move it, pinch or scroll to zoom." position="bottom" size="content">
  <ray-image-crop id="demo-crop" shape="circle" zoom-control output-size="320" label="Profile photo"></ray-image-crop>
  <ray-button slot="footer" variant="default" id="demo-crop-cancel">Cancel</ray-button>
  <ray-button slot="footer" id="demo-crop-use">Use photo</ray-button>
</ray-drawer>

<div class="demo-caption">A cover in 16:9, with the framing read back</div>
<div class="demo-crop-cover">
  <ray-image-crop id="demo-crop-wide" aspect="16/9" zoom-control max-zoom="3" output-size="1280x720" type="image/webp" label="Cover image"></ray-image-crop>
  <code id="demo-crop-rect">—</code>
</div>

<script type="module">
  // A picture to crop without a download: a landscape drawn on a canvas.
  function sample(width = 1600, height = 1200) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const g = c.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#7dd3fc");
    sky.addColorStop(1, "#fde68a");
    g.fillStyle = sky;
    g.fillRect(0, 0, width, height);
    g.fillStyle = "#f97316";
    g.beginPath();
    g.arc(width * 0.68, height * 0.36, height * 0.12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#6d28d9";
    g.beginPath();
    g.moveTo(0, height * 0.75);
    g.lineTo(width * 0.3, height * 0.42);
    g.lineTo(width * 0.55, height * 0.7);
    g.lineTo(width * 0.8, height * 0.5);
    g.lineTo(width, height * 0.72);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.fill();
    g.fillStyle = "#0e7490";
    g.fillRect(0, height * 0.82, width, height * 0.18);
    return new Promise((resolve) => c.toBlob(resolve, "image/png"));
  }

  const avatar = document.getElementById("demo-crop-avatar");
  const sheet = document.getElementById("demo-crop-sheet");
  const crop = document.getElementById("demo-crop");
  const file = document.getElementById("demo-crop-file");
  const remove = document.getElementById("demo-crop-remove");
  const choose = document.getElementById("demo-crop-choose");

  const edit = (blob) => {
    crop.src = blob;
    sheet.open = true;
  };
  choose.addEventListener("click", () => file.click());
  file.addEventListener("change", () => {
    if (file.files[0]) edit(file.files[0]);
    file.value = "";
  });
  document.getElementById("demo-crop-sample").addEventListener("click", async () => edit(await sample()));
  document.getElementById("demo-crop-cancel").addEventListener("click", () => (sheet.open = false));
  document.getElementById("demo-crop-use").addEventListener("click", () => {
    avatar.src = crop.toDataURL();
    remove.hidden = false;
    choose.textContent = "Change photo";
    sheet.open = false;
  });
  remove.addEventListener("click", () => {
    avatar.src = "";
    remove.hidden = true;
    choose.textContent = "Choose photo";
  });

  // The framing is a rectangle of the original: save it, set it back later.
  const wide = document.getElementById("demo-crop-wide");
  const rect = document.getElementById("demo-crop-rect");
  const show = () => {
    const r = wide.crop;
    rect.textContent = r ? `crop = { x: ${Math.round(r.x)}, y: ${Math.round(r.y)}, width: ${Math.round(r.width)}, height: ${Math.round(r.height)} }` : "—";
  };
  wide.addEventListener("input", show);
  wide.addEventListener("ray-load", show);
  sample(2400, 1600).then((blob) => {
    wide.crop = { x: 1200, y: 300, width: 1000, height: 562 };
    wide.src = blob;
  });
</script>
```
