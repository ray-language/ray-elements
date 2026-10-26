# Switch

An on/off toggle with the same API as Checkbox, announced as a switch.

Import: `import "@raylang/elements/switch";` · Category: Inputs

## `<ray-switch>` (RaySwitch, extends RayCheckbox)

Same properties and events as ray-checkbox (indeterminate does not apply).

Properties:

- `checked` (attribute `checked`: the initial value only): boolean. Current state. The checked attribute is the initial state.
- `value`: string, default `on`. Submitted value when on.
- `name`: string. Form field name.
- `label`: string. Label text (or the content).
- `description`: string. Help text.
- `error`: string. Error text.
- `labelPosition` (attribute `label-position`): `end` | `start` | `right` | `left`, default `end`, reflects. Side of the label: start/end follow the writing direction; left/right are sides of the screen.
- `color`: string. Track color when on.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Track size.
- `disabled`: boolean. Not interactive nor submitted.

Also the properties of RayCheckbox (`<ray-checkbox>`): `indeterminate`, `required`, `variant`.
Also the properties of FieldControl: `radius`, `descriptionPosition`.

Events:

- `change`: When the user toggles it.

Slots:

- (default): Label content.

Parts (`::part()`):

- `track`: The track.
- `thumb`: The thumb.

Vue `v-model`: `checked` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A settings panel</div>
<div class="demo-prefs" id="demo-prefs">
  <div class="demo-pref main">
    <div><strong>Notifications</strong><span>Pause all of them at once.</span></div>
    <ray-switch id="demo-notify-all" aria-label="Notifications" checked size="md"></ray-switch>
  </div>
  <div class="demo-pref">
    <div><strong>Email</strong><span>Mentions, replies and invitations.</span></div>
    <ray-switch data-child aria-label="Email" checked></ray-switch>
  </div>
  <div class="demo-pref">
    <div><strong>Push</strong><span>On this device, while the app is closed.</span></div>
    <ray-switch data-child aria-label="Push" checked></ray-switch>
  </div>
  <div class="demo-pref">
    <div><strong>Weekly digest</strong><span>Every Monday at 9:00.</span></div>
    <ray-switch data-child aria-label="Weekly digest"></ray-switch>
  </div>
  <p class="demo-muted" id="demo-prefs-out">On: Email, Push.</p>
</div>

<div class="demo-caption">Labels, descriptions and sides</div>
<div class="demo-grid">
  <ray-switch label="Public profile" description="Anyone with the link can see it." checked></ray-switch>
  <ray-switch label="Label before" label-position="start"></ray-switch>
  <ray-switch label="Two-factor authentication" error="Required by your organization." color="red"></ray-switch>
  <ray-switch label="Disabled, on" checked disabled></ray-switch>
</div>

<div class="demo-caption">Colors and sizes</div>
<div class="demo-row">
  <ray-switch label="xs" size="xs" checked color="blue"></ray-switch>
  <ray-switch label="sm" size="sm" checked color="teal"></ray-switch>
  <ray-switch label="md" size="md" checked color="violet"></ray-switch>
  <ray-switch label="lg" size="lg" checked color="orange"></ray-switch>
  <ray-switch label="xl" size="xl" checked color="pink"></ray-switch>
  <ray-switch label="yellow" checked color="yellow"></ray-switch>
</div>

<script type="module">
  // The main switch pauses the rest; the summary follows.
  const all = document.getElementById("demo-notify-all");
  const children = [...document.querySelectorAll("#demo-prefs [data-child]")];
  const sum = () => {
    const on = children.filter((s) => s.checked).map((s) => s.getAttribute("aria-label"));
    document.getElementById("demo-prefs-out").textContent = !all.checked ? "All notifications paused."
      : on.length ? `On: ${on.join(", ")}.` : "Every channel is off.";
  };
  all.addEventListener("change", () => {
    for (const s of children) s.disabled = !all.checked;
    sum();
  });
  for (const s of children) s.addEventListener("change", sum);
  customElements.whenDefined("ray-switch").then(sum);
</script>
```
