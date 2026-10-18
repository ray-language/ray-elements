# Step dots

A row of dots, one per step: done, current, to do. A compact progress for rounds, onboarding pages or a quiz; announced as a progressbar ("Round 4 of 12").

Import: `import "@raylang/elements/step-dots";` · Category: Feedback

## `<ray-step-dots>` (RayStepDots, extends RayElement)

Dots before value are done (filled), the one at value is current (a filled pill), the rest are to do (empty). Not interactive: for steps the user picks, use ray-stepper (or the dots of ray-carousel). Many dots wrap onto more lines.

Properties:

- `count`: number, default `0`. Number of steps (dots).
- `value`: number, default `0`. The current step, 0-based; count means every step is done.
- `color`: string, reflects. A palette color or any CSS color for done and current dots. Default: the primary color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Size of a dot.
- `align`: `start` | `center` | `end`, default `center`, reflects. Where the row sits in its width.
- `label`: string. What a step is called: "Round" is announced "Round 4 of 12" and names the element. Default: Step (named Steps).

Parts (`::part()`):

- `dots`: The row.
- `dot`: Each dot ([data-state] done, current or todo).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Rounds of a timer</div>
<ray-stack gap="sm" align="center">
  <ray-step-dots id="demo-dots-rounds" count="12" value="3" label="Round"></ray-step-dots>
  <ray-group gap="xs">
    <ray-button size="xs" variant="default" id="demo-dots-prev">Previous</ray-button>
    <ray-button size="xs" variant="default" id="demo-dots-next">Next</ray-button>
  </ray-group>
  <span class="demo-muted" id="demo-dots-text"></span>
</ray-stack>

<div class="demo-caption">Sizes, colors and alignment</div>
<ray-stack gap="md">
  <ray-step-dots count="5" value="1" size="xs" align="start"></ray-step-dots>
  <ray-step-dots count="5" value="2" size="md" color="teal" align="start"></ray-step-dots>
  <ray-step-dots count="5" value="3" size="lg" color="orange" align="start"></ray-step-dots>
  <ray-step-dots count="5" value="5" size="xl" color="green" align="start" label="Page"></ray-step-dots>
</ray-stack>
<p class="demo-muted" style="margin: 0">value is the current step from 0; value = count: all done.</p>

<script type="module">
  const dots = document.getElementById("demo-dots-rounds");
  const text = document.getElementById("demo-dots-text");
  const paint = () => (text.textContent = dots.value >= dots.count ? "Done" : `Round ${dots.value + 1} of ${dots.count}`);
  document.getElementById("demo-dots-prev").addEventListener("click", () => { dots.value = Math.max(0, dots.value - 1); paint(); });
  document.getElementById("demo-dots-next").addEventListener("click", () => { dots.value = Math.min(dots.count, dots.value + 1); paint(); });
  paint();
</script>
```
