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
- `highlight` (property only): `((text: string) => HighlightRange[]) | null`. Marks ranges of the text, painted behind it: called with the text on every change (typed or set), it returns { start, end, kind?, title? } offsets. kind "error" is red with a wavy underline; any other kind is styled with ::part(highlight-<kind>); title is the tooltip over the range. Ranges must not overlap.
- `complete` (property only): `((text: string, caret: number) => CompletionResult | null | Promise<CompletionResult | null>) | null`. Inline suggestions: called as the user types (and on Ctrl+Space) with the text and the caret, it returns the part of the text a suggestion would replace and the suggestions ({ from, to, items }), or null for none. A list opens under that part (ArrowUp/Down, Enter or Tab to accept, Escape to close); the chosen item's value replaces from–to as an undoable edit, then ray-complete fires. The field becomes a combobox (aria-autocomplete, aria-expanded, aria-activedescendant).
- `suggestionsLabel` (attribute `suggestions-label`): string, default `Suggestions`. Accessible name of the suggestion list.

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

- `ray-complete` (detail `{ item: CompletionItem; from: number; to: number }`): A suggestion was accepted (the text already has it).
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
- `suggestions`: The suggestion list (a listbox in the top layer).
- `suggestion`: Each suggestion ([aria-selected] when active).
- `suggestion-label`: A suggestion's label (in the mono font).
- `suggestion-detail`: A suggestion's detail.
- `suggestion-description`: A suggestion's description, under its label (in the interface font).
- `highlight`: Each marked range (also highlight-<kind> for a range with a kind).
- `text-layer`: The layer behind the text that holds the marks.

Methods and properties:

- `select(): void`: Selects the text.
- `refreshHighlight(): void`: Runs highlight again, when what it marks changed but the text did not.

Vue `v-model`: `value` (updated on input).

Types:

- `{ start: number; end: number; kind?: string; title?: string }`: A range of a field's text to mark (ray-input and ray-textarea highlight): offsets into the text, end excluded.
- `{ value: string; label?: string; detail?: string; description?: string }`: A suggestion of a field's complete(): value is inserted; label (default: value) and detail are shown, description under them.
- `{ from: number; to: number; items: CompletionItem[] }`: What complete() returns: the part of the text (offsets, to excluded) a suggestion replaces, and the suggestions.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

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

<div class="demo-caption">Highlighted text</div>
<div class="demo-grid">
  <ray-input id="demo-input-vars" label="Request URL" value="https://{{host}}/v1/{{resource}}?key={{api_key}}" description="highlight marks the {{variables}}: defined ones tinted, the undefined api_key in red. Hover one; type {{ for suggestions (complete)."></ray-input>
</div>
<style>
  #demo-input-vars::part(highlight-var) { background: color-mix(in srgb, var(--ray-teal-6) 20%, transparent); }
</style>
<script type="module">
  const defined = { host: "api.example.com", resource: "releases" };
  const vars = document.getElementById("demo-input-vars");
  // After an unclosed {{: the defined names that start with what is typed.
  vars.complete = (text, caret) => {
    const open = text.lastIndexOf("{{", caret);
    const partial = open < 0 ? null : text.slice(open + 2, caret);
    if (partial === null || !/^[\w.-]*$/.test(partial)) return null;
    const items = Object.entries(defined)
      .filter(([name]) => name.startsWith(partial))
      .map(([name, value]) => ({ value: `${name}}}`, label: name, detail: value }));
    return { from: open + 2, to: caret, items };
  };
  vars.highlight = (text) =>
    [...text.matchAll(/\{\{([\w.-]+)\}\}/g)].map((m) => ({
      start: m.index,
      end: m.index + m[0].length,
      kind: m[1] in defined ? "var" : "error",
      title: m[1] in defined ? `${m[1]} = ${defined[m[1]]}` : `${m[1]} is not defined`,
    }));
</script>
```
