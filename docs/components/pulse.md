# Pulse

An indeterminate wait indicator softer than the spinner: circles that breathe or ripple, announced as a status.

Import: `import "@raylang/elements/pulse";` · Category: Feedback

## `<ray-pulse>` (RayPulse, extends RayElement)

Four presets (variant), each a bundle of count, shape, fade and direction, which override it one by one. The rest is tuned with custom properties on the element: --ray-pulse-cycle (one cycle, default 1.6s; doubled with reduced motion), --ray-pulse-floor (opacity of the largest of concentric filled circles, 0 to 1, default 0.2), --ray-pulse-scale (where a cycle starts, 1 = full size; default per variant) and --ray-pulse-stagger (how much of the cycle separates the phases of the circles, 0 together to 1 spread evenly; default per variant).

Properties:

- `variant`: `cluster` | `breathe` | `ripple` | `dots`, default `cluster`, reflects. The figure: cluster (three concentric circles breathing out of phase), breathe (one dot over a halo), ripple (rings expanding from a dot) or dots (three in a row, in sequence).
- `count`: number, reflects. Number of circles, 1 to 5 (more are clamped). Default: the variant's.
- `shape`: `filled` | `ring`, reflects. Filled discs (concentric ones fade with size, see --ray-pulse-floor) or outlined rings. Default: the variant's.
- `fade`: `out` | `none`, reflects. Whether a cycle ends transparent; the bare attribute means out. Default: the variant's (ripple and dots fade).
- `direction`: `alternate` | `normal`, reflects. alternate goes there and back; normal goes one way and restarts (with fade: the ripple). Default: the variant's.
- `color`: string, reflects. A palette color or any CSS color. Default: the primary color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `md`, reflects. Height of the figure (the dots variant is wider).
- `label`: string, default `Loading`. Text read by screen readers.

Parts (`::part()`):

- `pulse`: The box holding the circles.
- `dot`: Each circle (the static center of ripple is also part core).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.19.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-row">
  <ray-pulse size="xs"></ray-pulse>
  <ray-pulse size="sm" variant="breathe"></ray-pulse>
  <ray-pulse variant="ripple"></ray-pulse>
  <ray-pulse size="lg" variant="dots" color="teal"></ray-pulse>
  <ray-pulse size="xl" count="5" shape="ring" color="gray" label="Connecting"></ray-pulse>
</div>
```
