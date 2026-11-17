# Meter (also Level meter, VU meter, Peak meter)

An audio level meter (a mixer's channel strip): peak and RMS in dB, green, yellow and red zones, a peak hold line and a clip mark, one bar per channel; setLevels() on every animation frame costs no render.

Import: `import "@raylang/elements/meter";` · Category: Data display

## `<ray-meter>` (RayMeter, extends RayElement)

Levels are dB (20 * log10 of the amplitude; -Infinity for silence). A peak goes up at once and falls at falloff dB/s, so call setLevels() on every frame; the hold line keeps the highest peak for hold ms. The bars are role=meter, its value (the loudest channel) updated a few times a second. Colors: --ray-meter-low, --ray-meter-mid, --ray-meter-high; length: the host's height (--ray-meter-length, 12rem), or its width when horizontal. Beside a fader (ray-slider orientation="vertical"), give both the same height and the meter --ray-meter-inset: half the slider's thumb length (0.4375rem for thumb="cap", 0.5625rem for the round one): and the same taper: its bars then line up with the slider's marks, which carry the numbers; leave the meter's own scale off.

Properties:

- `min`: number, default `-60`. The dB at the bottom: lower levels show nothing.
- `max`: number, default `6`. The dB at the top.
- `warn`: number, default `-12`. Where the yellow zone starts (dB).
- `danger`: number, default `-3`. Where the red zone starts (dB).
- `clip`: number, default `0`. A peak at or over it (dB) marks the channel as clipped (a red band at the top of its bar) until resetClip(), reset() or a click on the bar.
- `channels`: number, default `1`. The bars: 1 (mono), 2 (stereo)…
- `orientation`: `vertical` | `horizontal`, default `vertical`, reflects. vertical: bars that rise, the scale before them (on the left, aligned against them); horizontal: bars that grow towards the inline end.
- `size`: `xs` | `sm` | `md` | `lg`, default `sm`, reflects. The thickness of each bar.
- `hold`: number, default `1500`. How long the peak hold line stays (ms); 0: no line.
- `falloff`: number, default `24`. How fast a lower level falls (dB per second); 0: at once.
- `scale`: boolean, reflects. Shows the dB scale on the left of the bars (6, 0, -6, -12, -24, -36, -48, -60 within min and max). Part of the meter, and optional: beside a fader, put the numbers on the fader (its marks) instead.
- `taper`: `linear` | `fader`, default `linear`, reflects. How the dB spread along the bar: linear, or fader (a mixing desk's curve, as ray-slider taper="fader"): beside a fader with that taper, give both the same one and the bars line up with its marks. The zones (warn, danger) and the scale follow it.
- `marks` (property only): `Array<number | { value: number; label?: string }>`. Your own scale, in dB (replaces the one of scale).
- `label`: string, default `Level` (text `meter.label`). The accessible name.

Events:

- `ray-clip` (detail `{ channel: number }`): A channel's peak reached clip (once until its mark is cleared).

Parts (`::part()`):

- `channels`: The bars (role=meter).
- `channel`: One channel (data-clipped when clipped).
- `track`: A bar's track.
- `peak`: The peak level (translucent).
- `rms`: The RMS level (solid).
- `hold`: The peak hold line.
- `scale`: The dB scale.
- `tick`: A label of the scale.

Methods and properties:

- `setLevels(peak: number | number[], rms?: number | number[]): void`: The levels now in dB, a number or one per channel; without rms, one solid bar.
- `reset(): void`: Clears the levels, the hold lines and the clip marks.
- `resetClip(): void`: Clears the clip marks.
- `readonly clipped: boolean`: A channel reached clip since the last reset.

Texts (`setStrings`; English):

- `meter.label`: Level
- `meter.value`: {value} dB
- `meter.silent`: Silence

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.23.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<style>
  .demo-mixer { display: flex; flex-wrap: wrap; gap: var(--ray-space-2); }
  .demo-strip { display: grid; justify-items: center; gap: var(--ray-space-2); padding: var(--ray-space-3) var(--ray-space-2); border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); background: var(--ray-card); }
  /* The fader and its meter: the same height; the meter's inset is half the cap (0.875rem) and both have taper="fader", so its bars line up with the fader's marks. */
  .demo-strip-pair { display: flex; align-items: flex-end; gap: var(--ray-space-1); height: 13rem; }
  .demo-strip-pair > * { height: 100%; }
  .demo-strip-pair ray-meter { --ray-meter-inset: 0.4375rem; }
  .demo-strip span { font-size: var(--ray-font-size-sm); font-weight: var(--ray-font-weight-medium); }
  .demo-strip output { font-size: var(--ray-font-size-xs); font-variant-numeric: tabular-nums; color: var(--ray-muted-foreground); }
</style>
<div class="demo-caption">A mixer: a fader with its scale and a stereo meter per track, both on a desk's curve (taper="fader"; a test signal, no audio)</div>
<div class="demo-mixer" id="demo-mixer">
  <div class="demo-strip"><output>0.0 dB</output><div class="demo-strip-pair"><ray-slider orientation="vertical" thumb="cap" taper="fader" default-value="0" aria-label="Drums" min="-60" max="6" step="0.5" value="0"></ray-slider><ray-meter taper="fader" channels="2" label="Drums level"></ray-meter></div><span>Drums</span></div>
  <div class="demo-strip"><output>-6.0 dB</output><div class="demo-strip-pair"><ray-slider orientation="vertical" thumb="cap" taper="fader" default-value="0" aria-label="Bass" min="-60" max="6" step="0.5" value="-6"></ray-slider><ray-meter taper="fader" channels="2" label="Bass level"></ray-meter></div><span>Bass</span></div>
  <div class="demo-strip"><output>-12.0 dB</output><div class="demo-strip-pair"><ray-slider orientation="vertical" thumb="cap" taper="fader" default-value="0" aria-label="Keys" min="-60" max="6" step="0.5" value="-12"></ray-slider><ray-meter taper="fader" channels="2" label="Keys level"></ray-meter></div><span>Keys</span></div>
  <div class="demo-strip"><output>4.0 dB</output><div class="demo-strip-pair"><ray-slider orientation="vertical" thumb="cap" taper="fader" default-value="0" aria-label="Master" min="-60" max="6" step="0.5" value="4"></ray-slider><ray-meter taper="fader" channels="2" size="md" label="Master level"></ray-meter></div><span>Master</span></div>
</div>

<div class="demo-caption">The meter's own scale (scale), when there is no fader</div>
<div style="display: flex; gap: var(--ray-space-6); align-items: flex-end">
  <ray-meter id="demo-solo" channels="2" scale label="Output level"></ray-meter>
</div>

<div class="demo-caption">Horizontal, with its own scale</div>
<div class="demo-stack" style="max-width: 24rem">
  <ray-meter id="demo-input" orientation="horizontal" channels="2" label="Input level"></ray-meter>
  <ray-button size="xs" variant="default" id="demo-meter-reset">Clear the clip marks</ray-button>
</div>

<script type="module">
  // A test signal: a beat and a wobble per track, scaled by its fader.
  const strips = [...document.querySelectorAll("#demo-mixer .demo-strip")];
  // The numbers live on the faders (their marks, on the left); the meters beside them have none.
  const scale = [6, 0, -6, -12, -24, -48].map((v) => ({ value: v, label: v > 0 ? `+${v}` : String(v) }));
  for (const strip of strips) {
    const fader = strip.querySelector("ray-slider");
    fader.marks = scale;
    fader.addEventListener("input", () => {
      strip.querySelector("output").textContent = `${fader.value.toFixed(1)} dB`;
    });
  }
  const solo = document.getElementById("demo-solo");
  const input = document.getElementById("demo-input");
  input.marks = [-48, -24, -12, -6, 0, 6];
  const db = (a) => (a > 0 ? 20 * Math.log10(a) : -Infinity);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame(t) {
    const s = t / 1000;
    strips.forEach((strip, i) => {
      const gain = Number(strip.querySelector("ray-slider").value);
      const beat = Math.pow(Math.max(0, Math.sin(s * Math.PI * 2 * (1 + i * 0.25))), 6);
      const peaks = [0, 1].map((ch) => db(0.25 + 0.55 * beat + 0.1 * Math.sin(s * 7 + ch + i)) + gain);
      strip.querySelector("ray-meter").setLevels(peaks, peaks.map((p) => p - 9));
    });
    const out = db(0.35 + 0.25 * Math.abs(Math.sin(s * 2.1)));
    solo.setLevels([out, out - 1.5], [out - 9, out - 10]);
    const level = db(0.3 + 0.3 * Math.abs(Math.sin(s * 1.3)));
    input.setLevels([level, level - 2], [level - 8, level - 10]);
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.getElementById("demo-meter-reset").addEventListener("click", () => {
    for (const m of document.querySelectorAll("ray-meter")) m.resetClip();
  });
</script>
```
