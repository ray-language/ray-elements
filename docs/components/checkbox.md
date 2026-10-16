# Checkbox

A checkbox with label, description and error. Submits value when checked.

Import: `import "@raylang/elements/checkbox";` · Category: Inputs

## `<ray-checkbox>` (RayCheckbox, extends FieldControl)

Properties:

- `checked` (property only): boolean. Current state. The checked attribute is the initial state (restored on reset).
- `indeterminate`: boolean, reflects. Mixed state; cleared on the next user change.
- `value`: string, default `on`, reflects. Submitted value when checked.
- `name`: string. Form field name.
- `label`: string. Label text (or put the label in the content).
- `description`: string. Help text.
- `error`: string. Error text.
- `required`: boolean. Must be checked to submit.
- `disabled`: boolean. Not interactive nor submitted.
- `variant`: `filled` | `outline`, default `filled`, reflects. Checked look: filled box, or colored border and mark.
- `color`: string. A palette color or any CSS color for the checked state.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Box and font size.
- `labelPosition` (attribute `label-position`): `right` | `left`, default `right`, reflects. Side of the label.

Also the properties of FieldControl: `radius`, `descriptionPosition`.

Events:

- `change`: When the user toggles it.

Slots:

- (default): Label content.

Parts (`::part()`):

- `input`: The native checkbox (transparent, on top of the indicator).
- `indicator`: The drawn box.
- `label`: The label.

Vue `v-model`: `checked` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div style="display: grid; gap: 0.75rem">
  <ray-checkbox label="I accept the terms" name="terms" required></ray-checkbox>
  <ray-checkbox checked color="teal">Send me updates (label as content)</ray-checkbox>
  <ray-checkbox indeterminate label="Indeterminate"></ray-checkbox>
  <ray-checkbox label="With description" description="Shown under the label."></ray-checkbox>
  <ray-checkbox label="Disabled" disabled checked></ray-checkbox>
  <ray-checkbox label="Invalid" error="You must check this"></ray-checkbox>
</div>
<div class="demo-row">
  <ray-checkbox variant="outline" checked label="Outline variant"></ray-checkbox>
  <ray-checkbox variant="outline" indeterminate color="teal" label="Outline, indeterminate"></ray-checkbox>
</div>
```
