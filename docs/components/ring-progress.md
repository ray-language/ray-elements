# Ring progress

Progress as a ring (Mantine's RingProgress), with content in the middle: a countdown, a goal, an upload. Announced as a progressbar.

Import: `import "@raylang/elements/ring-progress";` · Category: Feedback

## `<ray-ring-progress>` (RayRingProgress, extends RayElement)

The arc starts at 12 o'clock and runs clockwise; a countdown is a value that goes down. Without value it spins (indeterminate). The middle holds the default slot (a clock), or the percentage with show-value.

Properties:

- `value`: number. Progress, from 0 to max. Unset: indeterminate (a spinning arc).
- `max`: number, default `100`. The value of a full ring.
- `color`: string, reflects. A palette color or any CSS color. Default: the primary color.
- `size`: `"xs" | "sm" | "md" | "lg" | "xl" | (string & {})`, default `md`, reflects. Diameter: xs…xl (3, 5, 7.5, 10, 12.5rem) or any CSS length.
- `thickness`: string, reflects. Width of the ring: a CSS length (a bare number is px). Default: a tenth of the diameter.
- `roundCaps` (attribute `round-caps`): boolean, reflects. Rounded ends of the arc.
- `showValue` (attribute `show-value`): boolean, reflects. Shows the percentage in the middle (when the default slot is empty).
- `label`: string. Accessible name (default: Progress).

Slots:

- (default): The middle of the ring (a clock, a figure, an icon); its font scales with size.

Parts (`::part()`):

- `track`: The background circle.
- `bar`: The arc.
- `center`: The middle, around the default slot.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A countdown: the value goes down</div>
<div class="demo-row" style="align-items: center; gap: var(--ray-space-6)">
  <ray-ring-progress id="demo-ring-timer" size="12rem" thickness="12" round-caps value="100" label="Round time left">
    <div><div id="demo-ring-clock" style="font-size: 2.25em; font-weight: 600">3:00</div><div class="demo-muted" style="font-size: 0.5em">Round 4 / 12</div></div>
  </ray-ring-progress>
  <ray-stack gap="xs">
    <ray-button id="demo-ring-go" size="sm" variant="light">Start</ray-button>
    <p class="demo-muted" style="margin: 0">value from 100 to 0; the clock is the default slot.</p>
  </ray-stack>
</div>

<div class="demo-caption">Sizes, colors and the percentage</div>
<div class="demo-row" style="align-items: center">
  <ray-ring-progress size="xs" value="30"></ray-ring-progress>
  <ray-ring-progress size="sm" value="45" color="teal" show-value></ray-ring-progress>
  <ray-ring-progress size="md" value="60" color="violet" show-value round-caps></ray-ring-progress>
  <ray-ring-progress size="lg" value="75" color="orange" thickness="6" show-value round-caps></ray-ring-progress>
  <ray-ring-progress size="md" label="Loading"></ray-ring-progress>
</div>
<p class="demo-muted" style="margin: 0">Without <code>value</code> the arc spins (indeterminate).</p>

<div class="demo-caption">A goal: value of max</div>
<div class="demo-row" style="align-items: center">
  <ray-ring-progress size="lg" value="6400" max="10000" color="green" round-caps label="Steps today">
    <div><div style="font-weight: 600">6,400</div><div class="demo-muted" style="font-size: 0.6em">of 10,000 steps</div></div>
  </ray-ring-progress>
</div>

<script type="module">
  // Three seconds per demo "minute": the ring drains while the clock counts down.
  const ring = document.getElementById("demo-ring-timer");
  const clock = document.getElementById("demo-ring-clock");
  const go = document.getElementById("demo-ring-go");
  const total = 180;
  let left = total;
  let timer = 0;
  const paint = () => {
    ring.value = (left / total) * 100;
    clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  };
  go.addEventListener("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = 0;
      go.textContent = "Start";
      return;
    }
    if (left === 0) left = total;
    go.textContent = "Pause";
    timer = setInterval(() => {
      left = Math.max(0, left - 5);
      paint();
      if (left === 0) {
        clearInterval(timer);
        timer = 0;
        go.textContent = "Start";
      }
    }, 250);
  });
  paint();
</script>
```
