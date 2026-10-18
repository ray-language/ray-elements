# Slider

A native range input (keyboard, touch and screen readers as usual) with label, value display and marks. Form-associated.

Import: `import "@raylang/elements/slider";` · Category: Inputs

## `<ray-slider>` (RaySlider, extends FieldControl)

Properties:

- `value`: number. Current value. The value attribute is the initial one (restored on reset).
- `min`: number, default `0`. Minimum.
- `max`: number, default `100`. Maximum.
- `step`: number, default `1`. Step.
- `name`: string. Form field name.
- `label`: string. Visible label.
- `description`: string. Help text.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text.
- `disabled`: boolean. Not interactive nor submitted.
- `color`: string, reflects. Track and thumb color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Track and thumb size.
- `showValue` (attribute `show-value`): boolean, reflects. Shows the value next to the label.
- `unit`: string. Appended to the shown value and its spoken text (%, px, ms…).
- `marks` (property only): `Array<number | { value: number; label?: string }>`. Labeled ticks under the track.

Also the properties of FieldControl: `required`, `radius`, `variant`.

Events:

- `input`: While dragging.
- `change`: When released.

Parts (`::part()`):

- `input`: The native range input.

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Adjust a photo</div>
<div class="demo-photo">
  <div class="demo-photo-frame" id="demo-photo" role="img" aria-label="A landscape: sun, mountains and a lake"><span class="sun"></span><span class="far"></span><span class="near"></span><span class="lake"></span></div>
  <div class="demo-stack">
    <ray-slider data-filter="brightness" label="Brightness" value="100" min="40" max="160" show-value unit="%"></ray-slider>
    <ray-slider data-filter="contrast" label="Contrast" value="100" min="40" max="160" show-value unit="%" color="violet"></ray-slider>
    <ray-slider data-filter="saturate" label="Saturation" value="100" min="0" max="200" show-value unit="%" color="pink"></ray-slider>
    <ray-slider data-filter="hue-rotate" label="Hue" value="0" min="-180" max="180" show-value unit="°" color="teal"></ray-slider>
    <div class="demo-actions"><ray-button size="xs" variant="default" id="demo-photo-reset">Reset</ray-button></div>
  </div>
</div>

<div class="demo-caption">Steps and marks</div>
<div class="demo-grid">
  <ray-slider id="demo-tempo" label="Tempo" min="60" max="180" step="5" value="120" show-value unit=" bpm" color="orange"></ray-slider>
  <ray-slider id="demo-quality" label="Export quality" min="0" max="100" step="25" value="75" description="Snaps to each mark."></ray-slider>
</div>

<div class="demo-caption">Colors, sizes and states</div>
<div class="demo-grid">
  <div class="demo-stack">
    <ray-slider aria-label="Extra small" size="xs" value="20" color="blue"></ray-slider>
    <ray-slider aria-label="Small" size="sm" value="40" color="teal"></ray-slider>
    <ray-slider aria-label="Medium" size="md" value="60" color="violet"></ray-slider>
    <ray-slider aria-label="Large" size="lg" value="80" color="orange"></ray-slider>
  </div>
  <div class="demo-stack">
    <ray-slider label="Storage" value="92" show-value unit=" GB" max="100" color="red" error="Over the 80 GB of your plan." name="storage"></ray-slider>
    <ray-slider label="Disabled" value="30" disabled></ray-slider>
  </div>
</div>

<script type="module">
  // Photo: every slider is one CSS filter.
  const photo = document.getElementById("demo-photo");
  const sliders = [...document.querySelectorAll("[data-filter]")];
  const apply = () => {
    photo.style.filter = sliders.map((s) => `${s.dataset.filter}(${s.value}${s.dataset.filter === "hue-rotate" ? "deg" : "%"})`).join(" ");
  };
  for (const s of sliders) s.addEventListener("input", apply);
  document.getElementById("demo-photo-reset").addEventListener("click", () => {
    for (const s of sliders) s.value = s.dataset.filter === "hue-rotate" ? 0 : 100;
    apply();
  });

  // Marks: numbers, or { value, label }.
  document.getElementById("demo-tempo").marks = [60, 90, 120, 150, 180];
  document.getElementById("demo-quality").marks = [
    { value: 0, label: "Draft" }, { value: 25, label: "Low" }, { value: 50, label: "Medium" }, { value: 75, label: "High" }, { value: 100, label: "Max" },
  ];
</script>
```
