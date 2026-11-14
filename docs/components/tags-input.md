# Tags input (also Tag input, Chips input, TagsInput)

Free-form tags with the suggestions in view (Mantine's TagsInput; to pick from a fixed list, ray-combobox): what is typed becomes a tag on Enter, a comma or leaving the field; the suggestions are buttons under the field, filtered as you type, one click adds one. No dropdown, so on a phone nothing opens over the field when the keyboard comes up.

Import: `import "@raylang/elements/tags-input";` · Category: Inputs

## `<ray-tags-input>` (RayTagsInput, extends FieldControl)

A text field that keeps tags as chips, and its suggestions (child <option> elements or data) as buttons under it. Typing filters them, case and accents aside ("diabe" finds "Diabetes"); the ones already chosen are left out. Pressing a suggestion while typing keeps the focus in the field, so the phone's keyboard stays up. Enter, a separator (a pasted "a, b, c" adds three) or leaving the field adds what was typed, anything at all; no two tags are the same, case and accents aside. Backspace in an empty field removes the last tag, Escape clears the text. The form gets one entry per tag. For a fixed list to pick from, use ray-combobox multiple.

Properties:

- `value` (attribute `value`: the initial value only): `string[]`. The tags. The value attribute: "a,b". A string "a,b" assigned to the property is read as a list too.
- `data` (property only): `Array<string | { value: string; label?: string; disabled?: boolean }>`. Suggestions instead of child <option> elements.
- `placeholder`: string. Shown while there are no tags.
- `max`: number. At most this many tags; when reached, nothing more is added and the suggestions hide.
- `suggestionsLimit` (attribute `suggestions-limit`): number, default `6`. At most this many suggestions shown (keep typing for the rest); 0 shows them all.
- `suggestionsLabel` (attribute `suggestions-label`): string, default `Suggestions`. The accessible name of the group of suggestions.
- `separators`: string, default `,`. Characters that end a tag as they are typed or pasted (",;" for both); "" for none (Enter and leaving the field still add).

Also the properties of FieldControl: `name`, `label`, `description`, `error`, `required`, `disabled`, `size`, `radius`, `variant`, `descriptionPosition`.

Events:

- `change`: A tag was added or removed (read value).
- `input`: Same moment as change.

Slots:

- (default): <option> elements: the suggestions (the text is the tag; value, if different, is what the tag stores).

Parts (`::part()`):

- `input`: The text field.
- `tags`: The tags container.
- `tag`: A tag.
- `tag-remove`: A tag's remove button.
- `suggestions`: The group of suggestions under the field.
- `suggestion`: A suggestion button.

Methods and properties:

- `readonly tags: string[]`: The value as an array.
- `readonly suggestions: string[]`: The values of the suggestions shown now.
- `addTag(tag: string): boolean`: Adds a tag (trimmed; not when empty, already there or past max). Fires input and change. True if added.
- `removeTag(tag: string): boolean`: Removes a tag (case and accents aside). Fires input and change. True if it was there.
- `commitText(): void`: Adds what is typed in the field now, as Enter does.

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.19.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Suggestions under the field: type to filter, click to add, or type anything and press Enter</div>
<div class="demo-grid">
  <ray-tags-input id="demo-tags-conditions" label="Health conditions" placeholder="Type or pick" value="Hypertension,Lupus">
    <option>Hypertension</option>
    <option>Type 1 diabetes</option>
    <option>Type 2 diabetes</option>
    <option>High cholesterol</option>
    <option>Hypothyroidism</option>
    <option>Hyperthyroidism</option>
    <option>Asthma</option>
    <option>COPD</option>
    <option>Heart failure</option>
    <option>Atrial fibrillation</option>
    <option>Chronic kidney disease</option>
    <option>Osteoarthritis</option>
    <option>Migraine</option>
    <option>Glaucoma</option>
  </ray-tags-input>
  <ray-tags-input id="demo-tags-labels" label="Labels" placeholder="bug, docs…" separators=",; " max="5" suggestions-limit="0" description="max=&quot;5&quot;; a comma, a semicolon or a space ends a tag; every suggestion shown." size="xs" variant="filled">
    <option>bug</option>
    <option>docs</option>
    <option>good-first-issue</option>
    <option>help-wanted</option>
  </ray-tags-input>
</div>
<p class="demo-muted" id="demo-tags-out">Add or remove tags: the value shows here.</p>

<div class="demo-caption">In a form, sizes and states</div>
<form class="demo-grid" id="demo-tags-form" novalidate>
  <ray-tags-input name="allergies" label="Allergies" required placeholder="Required" size="lg" description="Paste “penicillin, latex, pollen”: three tags."></ray-tags-input>
  <ray-tags-input label="Disabled" disabled value="read-only,tags"><option>more</option></ray-tags-input>
  <div class="demo-actions"><ray-button type="submit" size="sm">Submit</ray-button><span class="demo-muted" id="demo-tags-form-out"></span></div>
</form>

<script type="module">
  const conditions = document.getElementById("demo-tags-conditions");
  const labels = document.getElementById("demo-tags-labels");
  const show = (el) => { document.getElementById("demo-tags-out").textContent = `${el.label} = [${el.value.join(", ")}]`; };
  conditions.addEventListener("change", () => show(conditions));
  labels.addEventListener("change", () => show(labels));

  // Suggestions from data.
  document.querySelector('#demo-tags-form [name="allergies"]').data = ["Penicillin", "Amoxicillin", "Aspirin", "Ibuprofen", "Latex", "Peanuts", "Tree nuts", "Shellfish", "Eggs", "Milk", "Gluten", "Pollen", "Dust mites", "Bee stings"];

  // Submit: the form data, one entry per tag.
  const form = document.getElementById("demo-tags-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const allergies = form.querySelector('[name="allergies"]');
    allergies.error = allergies.value.length ? "" : "Add at least one allergy, or “None”.";
    if (!allergies.value.length) return;
    document.getElementById("demo-tags-form-out").textContent = `allergies=${new FormData(form).getAll("allergies").join(" | ")}`;
  });
</script>
```
