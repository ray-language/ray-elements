# Meter (also Level meter, VU meter, Peak meter)

An audio level meter (a mixer's channel strip): peak and RMS in dB, green, yellow and red zones, a peak hold line and a clip light, one bar per channel; setLevels() on every animation frame costs no render.

Import: `import "@raylang/elements/meter";` · Category: Data display

## `<ray-meter>` (RayMeter, extends RayElement)

Levels are dB (20 * log10 of the amplitude; -Infinity for silence). A peak goes up at once and falls at falloff dB/s, so call setLevels() on every frame; the hold line keeps the highest peak for hold ms. The bars are role=meter, its value (the loudest channel) updated a few times a second. Colors: --ray-meter-low, --ray-meter-mid, --ray-meter-high; length: the host's height (--ray-meter-length, 12rem), or its width when horizontal. For a fader beside it: ray-slider orientation="vertical".

Properties:

- `min`: number, default `-60`. The dB at the bottom: lower levels show nothing.
- `max`: number, default `6`. The dB at the top.
- `warn`: number, default `-12`. Where the yellow zone starts (dB).
- `danger`: number, default `-3`. Where the red zone starts (dB).
- `clip`: number, default `0`. A peak at or over it (dB) lights the channel's clip light until resetClip(), reset() or a click on the light.
- `channels`: number, default `1`. The bars: 1 (mono), 2 (stereo)…
- `orientation`: `vertical` | `horizontal`, default `vertical`, reflects. vertical: bars that rise, the scale before them (on the left, aligned against them); horizontal: bars that grow towards the inline end.
- `size`: `xs` | `sm` | `md` | `lg`, default `sm`, reflects. The thickness of each bar.
- `hold`: number, default `1500`. How long the peak hold line stays (ms); 0: no line.
- `falloff`: number, default `24`. How fast a lower level falls (dB per second); 0: at once.
- `scale`: boolean, reflects. Shows the dB scale (6, 0, -6, -12, -24, -36, -48, -60 within min and max).
- `marks` (property only): `Array<number | { value: number; label?: string }>`. Your own scale, in dB (replaces the one of scale).
- `label`: string, default `Level` (text `meter.label`). The accessible name.

Events:

- `ray-clip` (detail `{ channel: number }`): A channel's peak reached clip (once until its light is cleared).

Parts (`::part()`):

- `channels`: The bars (role=meter).
- `channel`: One channel: its clip light and track.
- `track`: A bar's track.
- `peak`: The peak level (translucent).
- `rms`: The RMS level (solid).
- `hold`: The peak hold line.
- `clip`: The clip light (data-clipped on its channel and on the host).
- `scale`: The dB scale.
- `tick`: A label of the scale.

Methods and properties:

- `setLevels(peak: number | number[], rms?: number | number[]): void`: The levels now in dB, a number or one per channel; without rms, one solid bar.
- `reset(): void`: Clears the levels, the hold lines and the clip lights.
- `resetClip(): void`: Clears the clip lights.
- `readonly clipped: boolean`: A channel reached clip since the last reset.

Texts (`setStrings`; English):

- `meter.label`: Level
- `meter.value`: {value} dB
- `meter.silent`: Silence

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.20.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<style>
  .demo-mixer { display: flex; flex-wrap: wrap; gap: var(--ray-space-5); align-items: flex-end; }
  .demo-strip { display: flex; align-items: flex-end; gap: var(--ray-space-2); padding: var(--ray-space-3); border: 1px solid var(--ray-border); border-radius: var(--ray-radius-default); --ray-slider-length: 13rem; --ray-meter-length: 11.5rem; }
</style>
<div class="demo-caption">A mixer: a fader and a stereo meter per track (a test signal, no audio)</div>
<div class="demo-mixer" id="demo-mixer">
  <div class="demo-strip"><ray-slider orientation="vertical" label="Drums" min="-60" max="6" value="0" show-value unit=" dB"></ray-slider><ray-meter channels="2" label="Drums level"></ray-meter></div>
  <div class="demo-strip"><ray-slider orientation="vertical" label="Bass" min="-60" max="6" value="-6" show-value unit=" dB" color="violet"></ray-slider><ray-meter channels="2" label="Bass level"></ray-meter></div>
  <div class="demo-strip"><ray-slider orientation="vertical" label="Keys" min="-60" max="6" value="-12" show-value unit=" dB" color="teal"></ray-slider><ray-meter channels="2" label="Keys level"></ray-meter></div>
  <div class="demo-strip"><ray-slider orientation="vertical" label="Master" min="-60" max="6" value="4" show-value unit=" dB" color="orange"></ray-slider><ray-meter channels="2" size="md" scale label="Master level"></ray-meter></div>
</div>

<div class="demo-caption">Horizontal, with its own scale</div>
<div class="demo-stack" style="max-width: 24rem">
  <ray-meter id="demo-input" orientation="horizontal" channels="2" label="Input level"></ray-meter>
  <ray-button size="xs" variant="default" id="demo-meter-reset">Reset the clip lights</ray-button>
</div>

<script type="module">
  // A test signal: a beat and a wobble per track, scaled by its fader.
  const strips = [...document.querySelectorAll("#demo-mixer .demo-strip")];
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
