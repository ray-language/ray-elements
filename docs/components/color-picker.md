# Color picker

Pick a color: an inline picker (saturation area, hue, opacity, swatches) and a text field with the picker in a dropdown and an eyedropper. Pointer and keyboard; form-associated; hex, rgb or hsl, with or without alpha.

Import: `import "@raylang/elements/color-picker";` · Category: Inputs

## `<ray-color-picker>` (RayColorPicker, extends FormControl)

Keyboard: arrows move the area's thumb (saturation, brightness) or a slider's; Shift for 10× steps; Home/End on the sliders. The alpha slider shows when format has alpha.

Properties:

- `value`: string. The color, written in format. Any color is accepted and rewritten in format. The value attribute is the initial value (restored on form reset).
- `format`: `ColorFormat`, default `hex`, reflects. How value is written: hex, hexa, rgb, rgba, hsl or hsla. Formats ending in a show the opacity slider.
- `swatches`: `string | string[]`. Preset colors below the picker: an array, or a comma-separated list in the attribute (commas inside rgb()/hsl() are kept).
- `swatchesPerRow` (attribute `swatches-per-row`): number, default `7`. Swatches in each row.
- `swatchesOnly` (attribute `swatches-only`): boolean, reflects. Only the swatches: no area nor sliders.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Width of the picker and size of its thumbs.
- `fullWidth` (attribute `full-width`): boolean, reflects. Takes the width of its container.
- `name`: string, reflects. Form field name.
- `disabled`: boolean, reflects. Not interactive.
- `label`: string. Accessible name of the whole picker.

Events:

- `input`: The color moved (every step of a drag).
- `change`: The color settled: pointer released, a key pressed or a swatch chosen (read value).

Parts (`::part()`):

- `saturation`: The saturation/brightness area.
- `hue`: The hue slider.
- `alpha`: The opacity slider.
- `preview`: The current color.
- `swatches`: The swatches' grid.

Methods and properties:

- `readonly rgba: Rgba`: The current color as channels and alpha (0…1).

Vue `v-model`: `value` (updated on input).

## `<ray-color-input>` (RayColorInput, extends FieldControl)

Type any CSS color (it becomes the value as soon as it is valid; invalid text goes back to the value on blur), or open the picker with a click or ArrowDown. The eyedropper shows only where the browser has the EyeDropper API.

Properties:

- `value`: string. The color, written in format. The value attribute is the initial value (restored on form reset).
- `format`: `ColorFormat`, default `hex`, reflects. How value is written: hex, hexa, rgb, rgba, hsl or hsla.
- `swatches`: `string | string[]`. Preset colors in the dropdown (an array, or a comma-separated list).
- `swatchesPerRow` (attribute `swatches-per-row`): number, default `7`. Swatches in each row.
- `placeholder`: string. Shown while empty.
- `hideEyedropper` (attribute `hide-eyedropper`): boolean, reflects. Hides the eyedropper button.
- `open`: boolean, reflects. The dropdown is shown.
- `name`: string, reflects. Form field name.
- `label`: string. Label above the field.
- `description`: string. Help text.
- `error`: string. Error message; marks the field invalid.
- `required`: boolean, reflects. Must have a color.
- `disabled`: boolean, reflects. Not interactive.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Field height and font size.
- `radius`: string, reflects. Corner radius: xs…xl or a CSS length.
- `variant`: `default` | `filled` | `unstyled`, default `default`, reflects. Visual style of the field.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. Where the description goes.

Events:

- `input`: The color changed (typing a valid color, or moving the picker).
- `change`: The color settled (picker released, a swatch, the eyedropper, or the field left with a new color).
- `ray-open`: The dropdown opened.
- `ray-close`: The dropdown closed.

Parts (`::part()`):

- `input`: The text field.
- `preview`: The swatch of the current color.
- `eyedropper`: The eyedropper button.
- `dropdown`: The dropdown with the picker.

Methods and properties:

- `readonly picker: RayColorPicker`: The ray-color-picker in the dropdown.
- `toggle(force?: boolean): void`: Opens or closes the dropdown.

Vue `v-model`: `value` (updated on input).

Exports (from `@raylang/elements/color-picker` and `@raylang/elements`):

- `function parseColorValue(input: string | null | undefined): Rgba | null`: A color string (hex with 3/4/6/8 digits, rgb(a), hsl(a), or any CSS color) as channels and alpha, or null.
- `function formatColor(color: Rgba, format?: ColorFormat): string`: Channels and alpha as a string in a format (default hex).

Types:

- `"hex" | "hexa" | "rgb" | "rgba" | "hsl" | "hsla"`: How a color value is written.
- `{ r: number; g: number; b: number; a: number }`: sRGB channels and alpha, all 0…1.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Picker</div>
<div class="demo-color-row">
  <ray-color-picker id="demo-cp" value="#7c3aed" label="Accent color"></ray-color-picker>
  <div class="demo-color-card" id="demo-cp-card">
    <span class="demo-color-chip"></span>
    <div><strong id="demo-cp-value">#7c3aed</strong><span id="demo-cp-event">Drag the area or the hue, or use the arrow keys.</span></div>
  </div>
</div>

<div class="demo-caption">Formats and opacity</div>
<div class="demo-color-row">
  <div class="demo-stack"><span class="demo-matrix-label">format="rgba"</span><ray-color-picker format="rgba" value="rgba(14, 165, 233, 0.6)" size="sm" class="demo-cp-out"></ray-color-picker><code></code></div>
  <div class="demo-stack"><span class="demo-matrix-label">format="hsla"</span><ray-color-picker format="hsla" value="hsla(330, 80%, 55%, 0.8)" size="sm" class="demo-cp-out"></ray-color-picker><code></code></div>
  <div class="demo-stack"><span class="demo-matrix-label">format="hexa"</span><ray-color-picker format="hexa" value="#16a34acc" size="sm" class="demo-cp-out"></ray-color-picker><code></code></div>
</div>

<div class="demo-caption">Swatches</div>
<div class="demo-color-row">
  <div class="demo-stack">
    <span class="demo-matrix-label">picker + swatches</span>
    <ray-color-picker value="#228be6" size="sm" swatches="#25262b, #868e96, #fa5252, #e64980, #be4bdb, #7950f2, #4c6ef5, #228be6, #15aabf, #12b886, #40c057, #82c91e, #fab005, #fd7e14"></ray-color-picker>
  </div>
  <div class="demo-stack">
    <span class="demo-matrix-label">swatches-only</span>
    <ray-color-picker swatches-only value="#fd7e14" swatches-per-row="6" size="sm" swatches="#fa5252, #fd7e14, #fab005, #40c057, #12b886, #15aabf, #228be6, #4c6ef5, #7950f2, #be4bdb, #e64980, #868e96"></ray-color-picker>
  </div>
</div>

<div class="demo-caption">Color input</div>
<div class="demo-grid">
  <ray-color-input label="Brand color" description="Type any CSS color, or pick one." value="#7c3aed" swatches="#25262b, #fa5252, #e64980, #be4bdb, #7950f2, #228be6, #15aabf, #12b886, #40c057, #fab005, #fd7e14, #868e96"></ray-color-input>
  <ray-color-input label="Overlay" format="rgba" value="rgba(0, 0, 0, 0.45)" variant="filled"></ray-color-input>
  <ray-color-input label="Highlight" format="hsl" placeholder="Pick a color"></ray-color-input>
  <ray-color-input label="Invalid" value="#e11d48" error="This color fails contrast on white (3.9:1)."></ray-color-input>
</div>

<div class="demo-caption">In a form</div>
<form class="demo-color-form" id="demo-color-form">
  <ray-input name="name" label="Label name" value="bug" required></ray-input>
  <ray-color-input name="color" label="Label color" value="#d73a4a" required swatches="#d73a4a, #0075ca, #cfd3d7, #a2eeef, #7057ff, #008672, #e4e669, #d876e3"></ray-color-input>
  <div class="demo-color-preview"><ray-badge id="demo-color-badge" variant="filled" color="#d73a4a" normal-case>bug</ray-badge></div>
  <div class="demo-row"><ray-button type="submit">Save label</ray-button><ray-button type="reset" variant="default">Reset</ray-button><span class="demo-muted" id="demo-color-out"></span></div>
</form>

<script type="module">
  // Picker: show the value and which event moved it.
  const cp = document.getElementById("demo-cp");
  const card = document.getElementById("demo-cp-card");
  const show = (e) => {
    document.getElementById("demo-cp-value").textContent = cp.value;
    document.getElementById("demo-cp-event").textContent = `${e.type}: ${cp.value}`;
    card.style.setProperty("--chip", cp.value);
  };
  cp.addEventListener("input", show);
  cp.addEventListener("change", show);
  card.style.setProperty("--chip", cp.value);

  // Formats: the value under each picker.
  for (const p of document.querySelectorAll(".demo-cp-out")) {
    const code = p.nextElementSibling;
    const write = () => { code.textContent = p.value; };
    p.addEventListener("input", write);
    customElements.whenDefined("ray-color-picker").then(write);
  }

  // Form: the badge follows the fields; submit shows the FormData.
  const form = document.getElementById("demo-color-form");
  const badge = document.getElementById("demo-color-badge");
  const sync = () => {
    badge.textContent = form.elements.name.value || "label";
    badge.color = form.elements.color.value || "gray";
  };
  form.addEventListener("input", sync);
  form.addEventListener("reset", () => setTimeout(sync));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("demo-color-out").textContent = JSON.stringify(Object.fromEntries(new FormData(form)));
  });
</script>
```
