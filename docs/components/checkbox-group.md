# Checkbox group

Several choices among options (Mantine's Checkbox.Group): a label, description and error around ray-checkbox elements; the value is the array of the checked ones. max caps how many; required asks for one.

Import: `import "@raylang/elements/checkbox-group";` · Category: Inputs

## `<ray-checkbox-group>` (RayCheckboxGroup, extends FormControl)

The group is the form control: one entry per checked value under name (like checkboxes sharing a name); the checkboxes inside lose their own name. It stops their change events and fires its own. role="group" named by its label.

Properties:

- `value` (attribute `value`: the initial value only): `string[]`. The checked values. The value attribute: "a,b".
- `name`: string, reflects. Form field name.
- `label`: string. Group label (also its accessible name).
- `description`: string. Help text.
- `error`: string. Error text.
- `required`: boolean, reflects. At least one must be checked.
- `disabled`: boolean, reflects. Disables every checkbox.
- `max`: number. At most this many: the others are disabled once reached; the label shows the count.
- `orientation`: `vertical` | `horizontal`, default `vertical`, reflects. Layout of the checkboxes.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, reflects. Size of the checkboxes that set none.
- `color`: string, reflects. Color of the checkboxes that set none.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the checkboxes or after them.

Events:

- `change`: The user checked or unchecked one (read value).
- `input`: Same moment as change.

Slots:

- (default): ray-checkbox elements (also nested in other markup).

Methods and properties:

- `readonly checkboxes: HTMLElement[]`: The checkboxes of this group.

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">In a form: required, one entry per value</div>
<form class="demo-auth" id="demo-cbg-form" novalidate>
  <ray-checkbox-group id="demo-cbg-channels" name="channels" label="Send me updates by" description="Pick at least one." required value="email">
    <ray-checkbox value="email" label="Email" description="A weekly summary"></ray-checkbox>
    <ray-checkbox value="push" label="Push" description="On this device"></ray-checkbox>
    <ray-checkbox value="sms" label="SMS" description="Only for security alerts"></ray-checkbox>
    <ray-checkbox value="slack" label="Slack" description="Connect a workspace first" disabled></ray-checkbox>
  </ray-checkbox-group>
  <div class="demo-actions"><ray-button type="submit">Save</ray-button><span class="demo-muted" id="demo-cbg-out"></span></div>
</form>

<div class="demo-caption">max: up to three</div>
<ray-checkbox-group label="Interests" orientation="horizontal" max="3" color="violet" value="components,tokens">
  <ray-checkbox value="components" label="Components"></ray-checkbox>
  <ray-checkbox value="tokens" label="Design tokens"></ray-checkbox>
  <ray-checkbox value="a11y" label="Accessibility"></ray-checkbox>
  <ray-checkbox value="charts" label="Charts"></ray-checkbox>
  <ray-checkbox value="mobile" label="Mobile"></ray-checkbox>
  <ray-checkbox value="raylang" label="raylang"></ray-checkbox>
</ray-checkbox-group>

<div class="demo-caption">Select all (indeterminate)</div>
<div class="demo-cbg-all">
  <ray-checkbox id="demo-cbg-all" label="All environments"></ray-checkbox>
  <ray-checkbox-group id="demo-cbg-envs" aria-label="Environments" value="staging" class="demo-cbg-nested">
    <ray-checkbox value="dev" label="Development"></ray-checkbox>
    <ray-checkbox value="staging" label="Staging"></ray-checkbox>
    <ray-checkbox value="prod" label="Production"></ray-checkbox>
  </ray-checkbox-group>
</div>

<div class="demo-caption">Sizes, colors and disabled</div>
<div class="demo-grid">
  <ray-checkbox-group label="Small, teal" size="xs" color="teal" value="a"><ray-checkbox value="a" label="Alpha"></ray-checkbox><ray-checkbox value="b" label="Beta"></ray-checkbox></ray-checkbox-group>
  <ray-checkbox-group label="Large, orange" size="md" color="orange" value="b"><ray-checkbox value="a" label="Alpha"></ray-checkbox><ray-checkbox value="b" label="Beta"></ray-checkbox></ray-checkbox-group>
  <ray-checkbox-group label="Disabled" disabled value="a"><ray-checkbox value="a" label="Alpha"></ray-checkbox><ray-checkbox value="b" label="Beta"></ray-checkbox></ray-checkbox-group>
  <ray-checkbox-group label="With an error" error="Choose a plan feature." description-position="below" description="Billed monthly."><ray-checkbox value="a" label="Backups"></ray-checkbox><ray-checkbox value="b" label="Analytics"></ray-checkbox></ray-checkbox-group>
</div>

<script type="module">
  // Required: an error on submit until one is checked; the form data has one entry per value.
  const form = document.getElementById("demo-cbg-form");
  const channels = document.getElementById("demo-cbg-channels");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!channels.value.length) {
      channels.error = "Pick at least one channel.";
      document.getElementById("demo-cbg-out").textContent = "";
      return;
    }
    document.getElementById("demo-cbg-out").textContent = `channels = ${new FormData(form).getAll("channels").join(", ")}`;
  });
  channels.addEventListener("change", () => { channels.error = ""; });

  // Select all: checked, unchecked or indeterminate from the group.
  const all = document.getElementById("demo-cbg-all");
  const envs = document.getElementById("demo-cbg-envs");
  const values = ["dev", "staging", "prod"];
  const sync = () => {
    const n = envs.value.length;
    all.checked = n === values.length;
    all.indeterminate = n > 0 && n < values.length;
  };
  all.addEventListener("change", () => { envs.value = all.checked ? values.slice() : []; sync(); });
  envs.addEventListener("change", sync);
  customElements.whenDefined("ray-checkbox-group").then(() => queueMicrotask(sync));
</script>
```
