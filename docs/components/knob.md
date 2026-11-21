# Knob (also Rotary, Dial, Potentiometer)

A rotary control (a mixer's gain or pan, an effect's amount): drag up or down, the wheel or the arrow keys turn it, a double click puts it back; a log scale for frequencies, a bipolar arc for pan. Form-associated.

Import: `import "@raylang/elements/knob";` · Category: Inputs

## `<ray-knob>` (RayKnob, extends FieldControl)

Drag up or down to turn it (the whole sweep is 200px; hold Shift for ten times finer), or use the wheel. Keys: arrows step it (Shift: ten steps), Page Up/Down a tenth of the sweep, Home/End the ends. A double click returns to default-value. The dial is role=slider with the value's text (format, or the value and unit). Look: --ray-knob-size, --ray-knob-track, --ray-knob-arc, --ray-knob-body, --ray-knob-pointer, and the dial, track, arc, body and pointer parts.

Properties:

- `value`: number. Current value. The value attribute is the initial one (restored on reset).
- `min`: number, default `0`. Minimum.
- `max`: number, default `100`. Maximum.
- `step`: number, default `1`. Step; 0: continuous.
- `defaultValue` (attribute `default-value`): number. What a double click returns to. Default: the value attribute; without one, min (the middle when bipolar).
- `scale`: `linear` | `log`, default `linear`, reflects. log: equal turns for equal ratios (20 Hz to 20 kHz); needs min above 0. The arrow keys then move a hundredth of the sweep.
- `bipolar`: boolean, reflects. The arc grows from 0 (from the middle when the range does not span 0): pan, a balance, a detune.
- `name`: string. Form field name.
- `label`: string. Visible label, above the dial (it names the slider).
- `description`: string. Help text.
- `error`: string. Error text.
- `disabled`: boolean. Not interactive nor submitted.
- `color`: string, reflects. The arc's color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. The dial's size (28 to 72px; --ray-knob-size for any other).
- `showValue` (attribute `show-value`): boolean, reflects. Shows the value under the dial.
- `unit`: string. Appended to the value's text (" dB", " Hz", "%").
- `format` (property only): `(value: number) => string`. The value's text, shown and spoken: (v) => v >= 1000 ? `${v / 1000} kHz` : `${v} Hz`.

Also the properties of FieldControl: `required`, `radius`, `variant`, `descriptionPosition`.

Events:

- `input`: While it turns.
- `change`: When it settles: the end of a drag, a key, a pause of the wheel, a double click.

Parts (`::part()`):

- `dial`: The dial (role=slider).
- `track`: The ring's track.
- `arc`: The arc of the value.
- `body`: The knob's body.
- `pointer`: The line that shows where it points.
- `value`: The value under the dial (show-value).

Methods and properties:

- `readonly valueText: string`: The value's text, as shown and spoken.

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.26.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<style>
  .demo-knobs { display: flex; flex-wrap: wrap; gap: var(--ray-space-5); align-items: flex-start; }
  .demo-knob-panel { display: grid; gap: var(--ray-space-3); padding: var(--ray-space-4); border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); background: var(--ray-card); }
  .demo-knob-panel h4 { margin: 0; font-size: var(--ray-font-size-xs); font-weight: var(--ray-font-weight-medium); letter-spacing: 0.04em; text-transform: uppercase; color: var(--ray-muted-foreground); }
  .demo-knob-row { display: flex; gap: var(--ray-space-4); align-items: flex-start; }
</style>
<div class="demo-caption">A channel strip: an equalizer band with a log frequency, a gain and a pan that grows from the middle</div>
<div class="demo-knobs">
  <div class="demo-knob-panel">
    <h4>Input</h4>
    <div class="demo-knob-row">
      <ray-knob label="Gain" min="-24" max="24" step="0.5" value="0" bipolar unit=" dB" show-value color="orange"></ray-knob>
      <ray-knob label="Pan" min="-50" max="50" value="0" bipolar show-value id="demo-pan"></ray-knob>
    </div>
  </div>
  <div class="demo-knob-panel">
    <h4>EQ, mid band</h4>
    <div class="demo-knob-row">
      <ray-knob label="Freq" min="20" max="20000" value="1000" scale="log" show-value id="demo-freq" color="teal"></ray-knob>
      <ray-knob label="Gain" min="-18" max="18" step="0.5" value="3" bipolar unit=" dB" show-value color="teal"></ray-knob>
      <ray-knob label="Q" min="0.1" max="10" step="0.1" value="0.7" scale="log" show-value color="teal"></ray-knob>
    </div>
  </div>
  <div class="demo-knob-panel">
    <h4>Send</h4>
    <div class="demo-knob-row">
      <ray-knob label="Reverb" value="25" unit="%" show-value color="violet"></ray-knob>
      <ray-knob label="Delay" value="10" unit="%" show-value color="violet"></ray-knob>
    </div>
  </div>
</div>
<p class="ray-muted" style="margin: var(--ray-space-3) 0 0; font-size: var(--ray-font-size-sm)">Drag up or down (Shift: finer), scroll, or focus and use the arrows; a double click puts a knob back.</p>

<div class="demo-caption">Sizes, and in a form</div>
<form class="demo-knobs" id="demo-knob-form" style="align-items: flex-end">
  <ray-knob aria-label="Extra small" size="xs" value="20"></ray-knob>
  <ray-knob aria-label="Small" size="sm" value="40"></ray-knob>
  <ray-knob aria-label="Medium" size="md" value="60"></ray-knob>
  <ray-knob aria-label="Large" size="lg" value="80"></ray-knob>
  <ray-knob label="Volume" name="volume" size="xl" value="70" unit="%" show-value description="A form field."></ray-knob>
  <ray-knob label="Disabled" value="50" disabled show-value></ray-knob>
  <div style="display: grid; gap: var(--ray-space-2)">
    <ray-button size="xs" variant="default" type="reset">Reset</ray-button>
    <output id="demo-knob-out" class="ray-muted" style="font-size: var(--ray-font-size-xs)">volume=70</output>
  </div>
</form>

<script type="module">
  // Frequencies read in Hz and kHz; pan as L / C / R.
  document.getElementById("demo-freq").format = (v) => (v >= 1000 ? `${Number((v / 1000).toFixed(1))} kHz` : `${Math.round(v)} Hz`);
  document.getElementById("demo-pan").format = (v) => (v === 0 ? "C" : v < 0 ? `L${-v}` : `R${v}`);
  const form = document.getElementById("demo-knob-form");
  const out = document.getElementById("demo-knob-out");
  const show = () => { out.textContent = `volume=${new FormData(form).get("volume")}`; };
  form.addEventListener("input", show);
  form.addEventListener("reset", () => setTimeout(show));
</script>
```
