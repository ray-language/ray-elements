# Input

A text field with label, description and error (Mantine's TextInput). Form-associated.

Import: `import "@raylang/elements/input";` · Category: Inputs

## `<ray-input>` (RayInput, extends FieldControl)

Also forwards placeholder, autocomplete, inputmode, pattern, min, max, step, minlength, maxlength, spellcheck, autocapitalize, enterkeyhint and list to the inner input. Enter submits its form as a native field does: through the first submit button (ray-button type="submit" included; nothing when it is disabled), or, without one, only when the form has a single text field.

Properties:

- `value`: string. Current value. The value attribute is the initial value (restored on form reset).
- `type`: `text` | `email` | `password` | `search` | `number` | `url` | `tel`, default `text`, reflects. Input type.
- `name`: string, reflects. Form field name.
- `label`: string. Visible label (also the accessible name).
- `description`: string. Help text under the label.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text; marks the field invalid (display only — does not block submit).
- `placeholder`: string. Placeholder text.
- `required`: boolean. Required for form submission; shows an asterisk.
- `disabled`: boolean. Not editable nor submitted.
- `readonly`: boolean. Not editable, still submitted.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height and font size.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius.
- `variant`: `default` | `filled` | `unstyled`, default `default`, reflects. Box style.

Attributes (forwarded to the inner element):

- `autocomplete`: Forwarded to the inner input.
- `inputmode`: Virtual keyboard hint.
- `pattern`: Validation pattern (regular expression).
- `min`: Minimum (number/date types).
- `max`: Maximum (number/date types).
- `step`: Step (number types).
- `minlength`: Minimum length.
- `maxlength`: Maximum length.
- `autocapitalize`: Mobile auto-capitalization.
- `enterkeyhint`: Label of the Enter key on virtual keyboards.
- `list`: Id of a <datalist> with suggestions.

Events:

- `input`: On every edit (value already updated).
- `change`: When an edit is committed (blur, Enter).

Slots:

- `left`: Section before the text (icon).
- `right`: Section after the text (icon, button).

Parts (`::part()`):

- `input`: The inner <input>.
- `wrapper`: The box around the input and sections.
- `label`: The label.
- `description`: The description.
- `error`: The error message.

Methods and properties:

- `select(): void`: Selects the text.

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <ray-input label="Email" type="email" name="email" placeholder="you@example.com" description="We never share it." required></ray-input>
  <ray-input label="Search" type="search" placeholder="Find files"><svg slot="left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></ray-input>
  <ray-input label="Username" value="ray" error="This username is taken"></ray-input>
  <ray-input label="Disabled" value="read only" disabled></ray-input>
  <ray-input label="Filled variant" variant="filled" placeholder="Filled"></ray-input>
  <ray-input aria-label="No visible label" placeholder="aria-label only" size="lg" radius="full"></ray-input>
</div>
```
