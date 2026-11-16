# Slider (also Range, Fader)

A native range input (keyboard, touch and screen readers as usual) with label, value display and marks; horizontal or vertical (a fader), with a round thumb or a mixing desk's cap. Form-associated.

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
- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. vertical: a fader, the minimum at the bottom and the marks before the track (on the left, aligned against it); its length is the host's height (--ray-slider-length, 12rem by default). The arrow keys work as on a horizontal one (ArrowUp raises it).
- `thumb`: `round` | `cap`, default `round`, reflects. The thumb: round, or cap (a mixing desk's fader cap: a short, wide block with a line at its middle, over a plain slot). Any other look: the --ray-slider-thumb-size (across the track), -length (along it), -background, -border, -radius and -shadow variables.

Also the properties of FieldControl: `required`, `radius`, `variant`.

Events:

- `input`: While dragging.
- `change`: When released.

Parts (`::part()`):

- `input`: The native range input.

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.22.1.

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

<style>
  .demo-eq { display: flex; flex-wrap: wrap; gap: var(--ray-space-3); align-items: flex-end; --ray-slider-length: 10rem; }
  .demo-console { display: flex; flex-wrap: wrap; gap: var(--ray-space-2); }
  .demo-console-strip { display: grid; justify-items: center; gap: var(--ray-space-2); padding: var(--ray-space-3) var(--ray-space-2); border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); background: var(--ray-card); }
  .demo-console-strip output { font-size: var(--ray-font-size-xs); font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); }
  .demo-console-strip span { font-size: var(--ray-font-size-sm); font-weight: var(--ray-font-weight-medium); }
  .demo-thumbs { display: flex; flex-wrap: wrap; gap: var(--ray-space-6); align-items: flex-end; --ray-slider-length: 9rem; }
  .demo-thumb-square { --ray-slider-thumb-radius: 4px; --ray-slider-thumb-size: 1.25rem; --ray-slider-thumb-length: 1.25rem; }
  .demo-thumb-pill { --ray-slider-thumb-size: 1.75rem; --ray-slider-thumb-length: 0.75rem; --ray-slider-thumb-radius: 999px; --ray-slider-thumb-background: var(--ray-teal-filled); --ray-slider-thumb-border: 2px solid var(--ray-white); }
</style>
<div class="demo-caption">Vertical: a graphic equalizer (-12 to +12 dB a band)</div>
<div class="demo-eq" id="demo-eq">
  <ray-slider orientation="vertical" label="60" min="-12" max="12" value="4" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="150" min="-12" max="12" value="2" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="400" min="-12" max="12" value="-1" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="1k" min="-12" max="12" value="-3" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="2.4k" min="-12" max="12" value="0" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="6k" min="-12" max="12" value="3" size="xs" color="teal"></ray-slider>
  <ray-slider orientation="vertical" label="15k" min="-12" max="12" value="5" size="xs" color="teal"></ray-slider>
  <ray-button size="xs" variant="default" id="demo-eq-flat">Flat</ray-button>
</div>

<div class="demo-caption">A console: fader caps (thumb="cap"), the scale on the first fader</div>
<div class="demo-console" id="demo-console">
  <div class="demo-console-strip"><output>0.0 dB</output><ray-slider orientation="vertical" thumb="cap" aria-label="Vocals" min="-60" max="6" step="0.5" value="0" style="height: 13rem"></ray-slider><span>Vocals</span></div>
  <div class="demo-console-strip"><output>-4.5 dB</output><ray-slider orientation="vertical" thumb="cap" aria-label="Guitar" min="-60" max="6" step="0.5" value="-4.5" style="height: 13rem"></ray-slider><span>Guitar</span></div>
  <div class="demo-console-strip"><output>-9.0 dB</output><ray-slider orientation="vertical" thumb="cap" aria-label="Bass" min="-60" max="6" step="0.5" value="-9" style="height: 13rem"></ray-slider><span>Bass</span></div>
  <div class="demo-console-strip"><output>-2.0 dB</output><ray-slider orientation="vertical" thumb="cap" aria-label="Drums" min="-60" max="6" step="0.5" value="-2" style="height: 13rem"></ray-slider><span>Drums</span></div>
</div>

<div class="demo-caption">Your own thumb: the --ray-slider-thumb-* variables</div>
<div class="demo-thumbs">
  <ray-slider orientation="vertical" label="Square" value="60" class="demo-thumb-square"></ray-slider>
  <ray-slider orientation="vertical" label="Pill" value="35" class="demo-thumb-pill" color="teal"></ray-slider>
  <ray-slider label="Cap, horizontal" thumb="cap" value="70" style="width: 14rem"></ray-slider>
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
  // Vertical: the equalizer's 0 dB line, the console's scale on its first fader.
  const eq = [...document.querySelectorAll("#demo-eq ray-slider")];
  eq[0].marks = [12, 6, 0, -6, -12].map((v) => ({ value: v, label: v > 0 ? `+${v}` : String(v) }));
  document.getElementById("demo-eq-flat").addEventListener("click", () => {
    for (const s of eq) s.value = 0;
  });
  const faders = [...document.querySelectorAll("#demo-console ray-slider")];
  faders[0].marks = [6, 0, -6, -12, -24, -36, -60].map((v) => ({ value: v, label: v > 0 ? `+${v}` : String(v) }));
  for (const f of faders) {
    f.addEventListener("input", () => {
      f.closest(".demo-console-strip").querySelector("output").textContent = `${f.value.toFixed(1)} dB`;
    });
  }
  document.getElementById("demo-tempo").marks = [60, 90, 120, 150, 180];
  document.getElementById("demo-quality").marks = [
    { value: 0, label: "Draft" }, { value: 25, label: "Low" }, { value: 50, label: "Medium" }, { value: 75, label: "High" }, { value: 100, label: "Max" },
  ];
</script>
```
