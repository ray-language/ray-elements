# Timeline

Events in order along a line (Mantine's Timeline): activity, history, a deploy's stages. Items up to active are reached (filled bullet, colored line); a bullet is a dot, an icon or an avatar.

Import: `import "@raylang/elements/timeline";` · Category: Data display

## `<ray-timeline>` (RayTimeline, extends RayElement)

A list (role="list") of ray-timeline-item.

Properties:

- `active`: number, default `-1`, reflects. Index of the last reached item (-1: none).
- `align`: `left` | `right`, default `left`, reflects. Side of the line.
- `bulletSize` (attribute `bullet-size`): string. Bullet size: px as a number or a CSS length (default 20px).
- `lineWidth` (attribute `line-width`): number. Line width in px (default 2).
- `color`: string, reflects. A palette color or any CSS color for what is reached (default: primary).
- `reverseActive` (attribute `reverse-active`): boolean, reflects. Counts active from the end (the latest event at the top).

Slots:

- (default): ray-timeline-item elements.

Methods and properties:

- `readonly items: RayTimelineItem[]`: The items, in order.

## `<ray-timeline-item>` (RayTimelineItem, extends RayElement)

Properties:

- `label`: string. The title of the event.
- `time`: string. When ("2 h ago", a date).
- `icon`: string. An icon of the registry in the bullet.
- `color`: string, reflects. Its own color (a failed step in red).
- `lineVariant` (attribute `line-variant`): `solid` | `dashed` | `dotted`, default `solid`, reflects. The line to the next item (dashed: not happened yet).

Slots:

- (default): Details under the title.
- `bullet`: A custom bullet (an avatar, an image).

Parts (`::part()`):

- `bullet`: The bullet.
- `line`: The line to the next item.
- `body`: Title, details and time.
- `title`: The title.
- `time`: The time.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A deploy, in progress</div>
<div class="demo-split">
  <ray-timeline id="demo-tl-deploy" active="2" bullet-size="26">
    <ray-timeline-item label="Build" time="12:00:05 · 4.1 s" icon="terminal">Compiled 42 modules on runner-3.</ray-timeline-item>
    <ray-timeline-item label="Tests" time="12:00:11 · 128 passed" icon="circle-check">Unit, browser and visual tests.</ray-timeline-item>
    <ray-timeline-item label="Upload" time="12:00:14" icon="upload" line-variant="dashed">Bundles for macOS, Linux and Windows.</ray-timeline-item>
    <ray-timeline-item label="Release" time="waiting" icon="download">Publishes update.json to the stable channel.</ray-timeline-item>
  </ray-timeline>
  <ray-stack gap="sm">
    <span class="demo-muted">active is the last reached item: the bullets fill and the line colors up to it.</span>
    <ray-group gap="xs">
      <ray-button size="xs" variant="default" id="demo-tl-prev">← Back</ray-button>
      <ray-button size="xs" id="demo-tl-next">Advance →</ray-button>
      <ray-button size="xs" variant="light" color="red" id="demo-tl-fail">Fail the upload</ray-button>
    </ray-group>
  </ray-stack>
</div>

<div class="demo-caption">Activity, with avatars</div>
<ray-timeline active="3" bullet-size="28" line-width="2" color="gray" class="demo-tl-activity">
  <ray-timeline-item label="Ada merged #482" time="2 min ago"><ray-avatar slot="bullet" name="Ada Lovelace" color="pink" size="sm"></ray-avatar>“Per-page modules” into main.</ray-timeline-item>
  <ray-timeline-item label="Alan commented" time="1 h ago"><ray-avatar slot="bullet" name="Alan Turing" color="blue" size="sm"></ray-avatar><blockquote class="demo-tl-quote">The docs load in half the time now.</blockquote></ray-timeline-item>
  <ray-timeline-item label="Grace requested a review" time="yesterday"><ray-avatar slot="bullet" name="Grace Hopper" color="teal" size="sm"></ray-avatar>On <ray-badge variant="light" normal-case>#482</ray-badge></ray-timeline-item>
  <ray-timeline-item label="Katherine opened #482" time="Oct 6"><ray-avatar slot="bullet" name="Katherine Johnson" color="orange" size="sm"></ray-avatar>12 files changed.</ray-timeline-item>
</ray-timeline>

<div class="demo-caption">Right-aligned, colors, line variants</div>
<div class="demo-grid">
  <ray-timeline active="1" align="right" color="violet">
    <ray-timeline-item label="Ordered" time="Mon 10:24"></ray-timeline-item>
    <ray-timeline-item label="Shipped" time="Tue 08:02"></ray-timeline-item>
    <ray-timeline-item label="Out for delivery" time="expected Thu"></ray-timeline-item>
  </ray-timeline>
  <ray-timeline active="3" bullet-size="14">
    <ray-timeline-item label="v1.27.36" time="Sep 12" line-variant="dotted"></ray-timeline-item>
    <ray-timeline-item label="v1.27.37" time="Sep 26"></ray-timeline-item>
    <ray-timeline-item label="v1.27.38 (security fix)" time="Oct 1" color="red" icon="alert-triangle"></ray-timeline-item>
    <ray-timeline-item label="v1.27.39" time="Oct 8"></ray-timeline-item>
  </ray-timeline>
</div>

<script type="module">
  const tl = document.getElementById("demo-tl-deploy");
  const upload = tl.items[2];
  document.getElementById("demo-tl-next").addEventListener("click", () => { tl.active = Math.min(tl.active + 1, tl.items.length - 1); });
  document.getElementById("demo-tl-prev").addEventListener("click", () => { tl.active = Math.max(tl.active - 1, -1); });
  document.getElementById("demo-tl-fail").addEventListener("click", () => {
    const failed = upload.color === "red";
    upload.color = failed ? undefined : "red";
    upload.icon = failed ? "upload" : "circle-x";
    upload.time = failed ? "12:00:14" : "12:00:19 · timed out";
  });
</script>
```
