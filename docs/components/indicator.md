# Indicator

A dot or a small label on the edge of any element (Mantine's Indicator): "New" on an avatar, an unread count on a bell, an online dot. Nine positions, an inward offset, palette or CSS colors, a border and a live pulse.

Import: `import "@raylang/elements/indicator";` · Category: Data display

## `<ray-indicator>` (RayIndicator, extends RayElement)

Wraps its content as tight as it is (fit-content). The label is part of the element's text for assistive technology; a dot has none: describe it on the content (aria-label="Grace, online").

Properties:

- `label`: string. Text in the indicator (a word or a count). Empty: a dot.
- `position`: `top-start` | `top-center` | `top-end` | `middle-start` | `middle-center` | `middle-end` | `bottom-start` | `bottom-center` | `bottom-end`, default `top-end`, reflects. Which point of the content's box it sits on.
- `offset`: `string | number`. Moves it inward from that point: px as a number, or a CSS length. Use it on round content (an avatar), so it sits on the curve.
- `color`: string, reflects. A palette color or any CSS color. Default: the primary.
- `size`: `string | number`. Diameter of the dot (and minimum height of a label): px as a number, or a CSS length. Default: 10px.
- `radius`: string, reflects. Corner radius: xs…xl, none, or a CSS length. Default: round.
- `max`: number. A numeric label above it shows as max+ (99+).
- `inline`: boolean, reflects. inline-block, to sit within a line of text.
- `withBorder` (attribute `with-border`): boolean, reflects. A ring in the background color, to separate it from the content.
- `processing`: boolean, reflects. A pulse around it (live, recording, syncing).
- `disabled`: boolean, reflects. Hides the indicator (the content stays).

Slots:

- (default): The element the indicator sits on.

Parts (`::part()`):

- `indicator`: The dot or label.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">On anything</div>
<div class="demo-indicator-row">
  <ray-indicator label="New" size="16" offset="6"><ray-avatar name="Ray Remote" color="violet" size="xl" radius="md"></ray-avatar></ray-indicator>
  <ray-indicator label="3" color="red" with-border offset="4"><ray-icon-button variant="default" size="lg" label="Notifications, 3 unread"><ray-icon name="bell"></ray-icon></ray-icon-button></ray-indicator>
  <ray-indicator label="12" max="9" color="red"><ray-button variant="default">Inbox</ray-button></ray-indicator>
  <ray-indicator label="Beta" color="teal" position="top-start" radius="sm"><ray-card with-border padding="md"><div class="demo-indicator-card"><strong>Native builds</strong><span>ray build --native</span></div></ray-card></ray-indicator>
  <p style="margin: 0">Messages <ray-indicator inline size="8" color="red" offset="-6" position="middle-end"><span role="img" aria-label="unread">&nbsp;</span></ray-indicator></p>
</div>

<div class="demo-caption">Status</div>
<div class="demo-indicator-row">
  <ray-indicator position="bottom-end" offset="7" size="14" color="green" with-border><ray-avatar name="Grace Hopper" color="teal" size="lg" aria-label="Grace Hopper, online"></ray-avatar></ray-indicator>
  <ray-indicator position="bottom-end" offset="7" size="14" color="yellow" with-border><ray-avatar name="Alan Turing" color="blue" size="lg" aria-label="Alan Turing, away"></ray-avatar></ray-indicator>
  <ray-indicator position="bottom-end" offset="7" size="14" color="gray" with-border><ray-avatar name="Ada Lovelace" color="pink" size="lg" aria-label="Ada Lovelace, offline"></ray-avatar></ray-indicator>
  <ray-indicator label="Live" color="red" processing offset="10" position="top-start" radius="sm"><div class="demo-indicator-video">ray-remote · screen</div></ray-indicator>
  <ray-indicator processing color="green" size="10" offset="3"><ray-badge variant="outline" color="gray" normal-case>Syncing</ray-badge></ray-indicator>
</div>

<div class="demo-caption">Positions</div>
<div class="demo-scroll"><div class="demo-indicator-positions">
  <ray-indicator position="top-start" label="top-start" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="top-center" label="top-center" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="top-end" label="top-end" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="middle-start" label="middle-start" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="middle-center" label="middle-center" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="middle-end" label="middle-end" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="bottom-start" label="bottom-start" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="bottom-center" label="bottom-center" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
  <ray-indicator position="bottom-end" label="bottom-end" color="gray"><div class="demo-indicator-box"></div></ray-indicator>
</div></div>

<div class="demo-caption">Counts, colors and sizes</div>
<div class="demo-indicator-row">
  <ray-indicator id="demo-count" label="1" max="99" color="red" with-border offset="4"><ray-icon-button variant="light" size="lg" label="Messages"><ray-icon name="paperclip"></ray-icon></ray-icon-button></ray-indicator>
  <ray-button size="xs" variant="default" id="demo-count-more">+ 25</ray-button>
  <ray-button size="xs" variant="subtle" id="demo-count-clear">Mark read</ray-button>
  <span class="demo-indicator-sep"></span>
  <ray-indicator color="blue"><div class="demo-indicator-box sm"></div></ray-indicator>
  <ray-indicator color="teal" size="14"><div class="demo-indicator-box sm"></div></ray-indicator>
  <ray-indicator color="orange" size="18" with-border><div class="demo-indicator-box sm"></div></ray-indicator>
  <ray-indicator color="#db2777" label="#db2777"><div class="demo-indicator-box sm"></div></ray-indicator>
</div>

<script type="module">
  // A count that grows past max and is cleared (disabled hides it).
  const count = document.getElementById("demo-count");
  let n = 1;
  const show = () => { count.label = String(n); count.disabled = n === 0; };
  document.getElementById("demo-count-more").addEventListener("click", () => { n += 25; show(); });
  document.getElementById("demo-count-clear").addEventListener("click", () => { n = 0; show(); });
</script>
```
