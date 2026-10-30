# Toggle

A two-state button (aria-pressed): bold in a toolbar, mute, favorite. The variant is how "on" looks; "off" is always neutral, so the states differ by more than color. Has everything ray-button has and joins a ray-button-group.

Import: `import "@raylang/elements/toggle";` · Category: Buttons

## `<ray-toggle>` (RayToggle, extends RayButton)

Click, Enter or Space flips pressed and fires change. In a form it is submitted like a checkbox: value (default "on") under name while pressed; reset restores the initial pressed attribute.

Properties:

- `pressed`: boolean, reflects. On.
- `variant`: `subtle` | `outline` | `light` | `filled` | `raised`, default `subtle`, reflects. Look of "on": subtle (tint), outline (colored border + tint), light (muted → tint), filled (surface → solid color), raised (a key that latches down, lit). ray-button's default, transparent and gradient are left out: no distinct on state, or only a color change.
- `square`: boolean, reflects. Square, for an icon alone (give it a label).
- `label`: string, reflects. Accessible name and tooltip, for icon-only toggles.

Also the properties of RayButton (`<ray-button>`): `gradient`, `color`, `size`, `radius`, `type`, `disabled`, `loading`, `fullWidth`, `href`, `target`, `name`, `value`.

Events:

- `change`: The user flipped it (read `pressed`).

Slots:

- (default): Text or an icon.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Variants · off and on</div>
<div class="demo-scroll">
  <div class="demo-matrix" style="--demo-cols: 3">
    <span></span><span class="demo-matrix-head">off</span><span class="demo-matrix-head">on</span><span class="demo-matrix-head">on · teal</span>
    <span class="demo-matrix-label">subtle (default)</span><ray-toggle><ray-icon slot="left" name="star"></ray-icon>Favorite</ray-toggle><ray-toggle pressed><ray-icon slot="left" name="star"></ray-icon>Favorite</ray-toggle><ray-toggle pressed color="teal"><ray-icon slot="left" name="star"></ray-icon>Favorite</ray-toggle>
    <span class="demo-matrix-label">outline</span><ray-toggle variant="outline">Wrap lines</ray-toggle><ray-toggle variant="outline" pressed>Wrap lines</ray-toggle><ray-toggle variant="outline" pressed color="teal">Wrap lines</ray-toggle>
    <span class="demo-matrix-label">light</span><ray-toggle variant="light">Mute</ray-toggle><ray-toggle variant="light" pressed>Mute</ray-toggle><ray-toggle variant="light" pressed color="teal">Mute</ray-toggle>
    <span class="demo-matrix-label">filled</span><ray-toggle variant="filled">Live</ray-toggle><ray-toggle variant="filled" pressed>Live</ray-toggle><ray-toggle variant="filled" pressed color="teal">Live</ray-toggle>
    <span class="demo-matrix-label">raised</span><ray-toggle variant="raised">Power</ray-toggle><ray-toggle variant="raised" pressed>Power</ray-toggle><ray-toggle variant="raised" pressed color="teal">Power</ray-toggle>
  </div>
</div>
<p class="demo-muted" style="margin: 0">Click any of them. Off is always neutral, so on differs by more than color. ray-button's default, transparent and gradient are not toggle variants.</p>

<div class="demo-caption">Icon toggles</div>
<div class="demo-row">
  <ray-toggle square label="Show sidebar" pressed><ray-icon name="panel-left"></ray-icon></ray-toggle>
  <ray-toggle square label="Terminal"><ray-icon name="terminal"></ray-icon></ray-toggle>
  <ray-toggle square variant="outline" label="Favorite" color="yellow"><ray-icon name="star"></ray-icon></ray-toggle>
</div>
<p class="demo-muted" style="margin: 0">For toolbars where toggles share one value (bold / italic, alignment), see ray-toggle-group.</p>

<div class="demo-caption">Sizes and states</div>
<div class="demo-row">
  <ray-toggle variant="outline" size="xs" pressed>xs</ray-toggle>
  <ray-toggle variant="outline" size="sm" pressed>sm</ray-toggle>
  <ray-toggle variant="outline" size="md" pressed>md</ray-toggle>
  <ray-toggle variant="outline" size="lg" pressed>lg</ray-toggle>
  <ray-toggle variant="filled" disabled pressed>Disabled on</ray-toggle>
  <ray-toggle variant="filled" disabled>Disabled off</ray-toggle>
</div>
<p id="demo-toggle-out" class="demo-muted" style="margin: 0">Flip a toggle to see its change event.</p>
<script type="module">
  const out = document.getElementById("demo-toggle-out");
  out.closest(".example").addEventListener("change", (e) => {
    if (e.target.localName !== "ray-toggle") return;
    const name = e.target.label || e.target.textContent.trim();
    out.textContent = `change: ${name} → pressed = ${e.target.pressed}`;
  });
</script>
```
