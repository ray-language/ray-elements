# Toggle group

ray-toggle elements with one shared value: type="single" (at most one on: alignment, view mode) or "multiple" (bold / italic / underline). Joined like a button group, or spaced; arrow keys move between toggles; submitted with its form.

Import: `import "@raylang/elements/toggle-group";` · Category: Buttons

## `<ray-toggle-group>` (RayToggleGroup, extends RayButtonGroup)

Each toggle's value (else its text) is its key. variant, color, size, radius and square reach the toggles that do not set their own. One tab stop (the selected toggle); arrows, Home and End move; Space/Enter flips.

Properties:

- `type`: `single` | `multiple`, default `single`, reflects. single: choosing one turns the others off; multiple: each toggle is independent.
- `value`: `string | string[] | undefined`. The selected key (single) or keys (multiple: an array, or a comma-separated attribute).
- `name`: string, reflects. Form field name: the value (multiple: one entry per key).
- `required`: boolean, reflects. Needs a value; with single the selected toggle cannot be turned off.
- `disabled`: boolean, reflects. Disables every toggle.
- `spaced`: boolean, reflects. Toggles apart, each with its own corners (default: joined).
- `variant`: `subtle` | `outline` | `light` | `filled` | `raised`, reflects. Variant of the toggles.
- `color`: string, reflects. Color of the toggles' on state.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, reflects. Size of the toggles.
- `radius`: string, reflects. Corner radius of the toggles.
- `square`: boolean, reflects. Square toggles, for icons.

Also the properties of RayButtonGroup (`<ray-button-group>`): `orientation`, `fullWidth`, `label`.

Events:

- `change`: The user changed the selection (read `value` or `values`; the toggles' own change events stop at the group).

Slots:

- (default): ray-toggle elements.

Methods and properties:

- `values: string[]`: The selected keys as a list, in any mode.
- `readonly toggles: RayToggle[]`: The toggles of this group.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Single · one choice, can be cleared</div>
<div class="demo-row">
  <ray-toggle-group type="single" value="left" label="Text alignment" variant="outline" color="gray" square>
    <ray-toggle value="left" label="Align left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14"/></svg></ray-toggle>
    <ray-toggle value="center" label="Align center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M5 18h14"/></svg></ray-toggle>
    <ray-toggle value="right" label="Align right"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M10 12h10M6 18h14"/></svg></ray-toggle>
  </ray-toggle-group>
  <ray-toggle-group type="single" value="week" label="Range" required spaced variant="light">
    <ray-toggle value="day">Day</ray-toggle>
    <ray-toggle value="week">Week</ray-toggle>
    <ray-toggle value="month">Month</ray-toggle>
  </ray-toggle-group>
</div>
<p class="demo-muted" style="margin: 0">The second one is <code>required</code>: the selected toggle cannot be turned off.</p>

<div class="demo-caption">Multiple · any number</div>
<div class="demo-row">
  <ray-toggle-group type="multiple" value="bold,underline" label="Text style" variant="outline" color="gray" square>
    <ray-toggle value="bold" label="Bold"><b>B</b></ray-toggle>
    <ray-toggle value="italic" label="Italic"><i>I</i></ray-toggle>
    <ray-toggle value="underline" label="Underline"><u>U</u></ray-toggle>
    <ray-toggle value="strike" label="Strikethrough"><s>S</s></ray-toggle>
  </ray-toggle-group>
  <ray-toggle-group type="multiple" value="mon,wed,fri" label="Days" spaced variant="filled" color="teal" radius="full" square>
    <ray-toggle value="mon" label="Monday">M</ray-toggle>
    <ray-toggle value="tue" label="Tuesday">T</ray-toggle>
    <ray-toggle value="wed" label="Wednesday">W</ray-toggle>
    <ray-toggle value="thu" label="Thursday">T</ray-toggle>
    <ray-toggle value="fri" label="Friday">F</ray-toggle>
    <ray-toggle value="sat" label="Saturday">S</ray-toggle>
    <ray-toggle value="sun" label="Sunday">S</ray-toggle>
  </ray-toggle-group>
</div>

<div class="demo-caption">Raised · a row of latching keys</div>
<ray-toggle-group type="single" value="2" label="Speed" variant="raised" color="teal" spaced required>
  <ray-toggle value="1">Slow</ray-toggle>
  <ray-toggle value="2">Normal</ray-toggle>
  <ray-toggle value="3">Fast</ray-toggle>
</ray-toggle-group>
<p id="demo-tg-out" class="demo-muted" style="margin: 0">Change a group to see its change event.</p>
<script type="module">
  const out = document.getElementById("demo-tg-out");
  out.closest(".example").addEventListener("change", (e) => {
    if (e.target.localName !== "ray-toggle-group") return;
    out.textContent = `change: ${e.target.label} → ${JSON.stringify(e.target.value)}`;
  });
</script>
```
