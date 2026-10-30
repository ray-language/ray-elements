# Stat

A metric tile: label, value, change against a previous period, note.

Import: `import "@raylang/elements/stat";` · Category: Data display

## `<ray-stat>` (RayStat, extends RayElement)

Properties:

- `label`: string. What is measured.
- `value`: string. The figure, already formatted.
- `diff`: number. Change (positive is shown as good, in green; see inverse).
- `diffUnit` (attribute `diff-unit`): string, default `%`. Unit of diff.
- `note`: string. A line under the value (compared to…).
- `inverse`: boolean, reflects. Lower is better (errors, latency): negative diffs are green.
- `plain`: boolean, reflects. Without the card around.

Slots:

- `icon`: Icon next to the label.
- (default): Extra content (e.g. a ray-progress).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <ray-stat label="Active users" value="12,480" diff="8.2" note="vs. last week"></ray-stat>
  <ray-stat label="p95 latency" value="182 ms" diff="-12" note="lower is better" inverse></ray-stat>
  <ray-stat label="Failed logins" value="37" diff="14" diff-unit="" inverse note="last 24 h"></ray-stat>
  <ray-stat label="Disk" value="64%"><ray-progress value="64" size="sm" label="Disk usage" style="margin-top: 0.5rem"></ray-progress></ray-stat>
</div>
```
