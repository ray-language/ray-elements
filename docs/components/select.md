# Select

A select with its own dropdown (keyboard, typeahead, groups); options from child <option> elements or the data property. Form-associated.

Import: `import "@raylang/elements/select";` · Category: Inputs

## `<ray-select>` (RaySelect, extends FieldControl)

Properties:

- `value`: string. Selected value.
- `data` (property only): `Array<string | { value: string; label?: string; disabled?: boolean }>`. Options as strings or { value, label, disabled } (instead of child options).
- `placeholder`: string. Shown while nothing is selected (with required, blocks submit).
- `open`: boolean, reflects. The dropdown is shown.
- `name`: string. Form field name.
- `label`: string. Visible label.
- `description`: string. Help text.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text.
- `required`: boolean. Required for form submission.
- `disabled`: boolean. Not interactive nor submitted.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height and font size.
- `variant`: `default` | `filled` | `unstyled`, default `default`, reflects. Box style.

Also the properties of FieldControl: `radius`.

Events:

- `input`: When the selection changes.
- `change`: When the selection changes.
- `ray-open`: The dropdown opened.
- `ray-close`: The dropdown closed.

Slots:

- (default): <option> and <optgroup> elements.

Parts (`::part()`):

- `trigger`: The combobox button showing the selected option.
- `dropdown`: The listbox panel (a popover in the top layer).
- `option`: Each option in the dropdown ([aria-selected], [data-active], [aria-disabled]).
- `select`: The hidden native <select> that holds the value (the model).
- `wrapper`: The box.

Methods and properties:

- `readonly options: HTMLOptionsCollection`: The options of the model select.
- `toggle(force?: boolean): void`: Opens or closes the dropdown.

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Dependent selects</div>
<div class="demo-split">
  <div class="demo-stack">
    <ray-select id="demo-country" label="Country" placeholder="Pick a country" name="country">
      <option value="cl">Chile</option>
      <option value="es">Spain</option>
      <option value="jp">Japan</option>
      <option value="us">United States</option>
    </ray-select>
    <ray-select id="demo-city" label="City" placeholder="Pick a country first" name="city" disabled></ray-select>
  </div>
  <div class="demo-ship" id="demo-ship"><ray-icon name="info"></ray-icon><span>Pick a country and a city to see the delivery estimate.</span></div>
</div>

<div class="demo-caption">Groups, descriptions and errors</div>
<div class="demo-grid">
  <ray-select label="Region" value="eu-central" description="Where your data lives." description-position="below">
    <optgroup label="Europe"><option value="eu-central">Frankfurt</option><option value="eu-west">London</option><option value="eu-south">Milan</option></optgroup>
    <optgroup label="America"><option value="us-east">Virginia</option><option value="sa-east">São Paulo</option></optgroup>
    <optgroup label="Asia"><option value="ap-north">Tokyo</option><option value="ap-south" disabled>Mumbai (soon)</option></optgroup>
  </ray-select>
  <ray-select label="Runtime" value="" placeholder="Pick one" error="A runtime is required to deploy." required>
    <option value="native">Native binary</option>
    <option value="wasm">WebAssembly</option>
  </ray-select>
  <ray-select id="demo-tz" label="Time zone" description="Loaded from data." value="America/Santiago"></ray-select>
</div>

<div class="demo-caption">Variants, sizes and states</div>
<div class="demo-grid">
  <ray-select label="Filled" variant="filled" value="weekly"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></ray-select>
  <ray-select label="Large" size="lg" value="pro"><option value="free">Free</option><option value="pro">Pro</option><option value="team">Team</option></ray-select>
  <ray-select label="Extra small" size="xs" value="10"><option value="10">10 per page</option><option value="25">25 per page</option><option value="50">50 per page</option></ray-select>
  <ray-select label="Disabled" value="main" disabled><option value="main">main</option></ray-select>
</div>
<div class="demo-unstyled">
  <span class="demo-muted">Sort by</span>
  <ray-select aria-label="Sort by" variant="unstyled" size="xs" value="recent"><option value="recent">Most recent</option><option value="popular">Most popular</option><option value="name">Name</option></ray-select>
</div>

<script type="module">
  // Dependent: the cities of the country, from data.
  const cities = {
    cl: ["Santiago", "Valparaíso", "Concepción", "Punta Arenas"],
    es: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
    jp: ["Tokyo", "Osaka", "Kyoto", "Sapporo"],
    us: ["New York", "San Francisco", "Chicago", "Austin"],
  };
  const days = { cl: "2–3", es: "4–6", jp: "6–8", us: "3–5" };
  const country = document.getElementById("demo-country");
  const city = document.getElementById("demo-city");
  const ship = document.getElementById("demo-ship").querySelector("span");
  country.addEventListener("change", () => {
    city.data = cities[country.value] ?? [];
    city.value = "";
    city.placeholder = "Pick a city";
    city.disabled = false;
    ship.textContent = "Now pick a city.";
  });
  city.addEventListener("change", () => {
    const name = country.querySelector(`option[value="${country.value}"]`)?.textContent;
    ship.textContent = city.value ? `Delivery to ${city.value}, ${name}: ${days[country.value]} business days.` : "Now pick a city.";
  });

  // From data: { value, label }.
  document.getElementById("demo-tz").data = [
    { value: "America/Santiago", label: "Santiago (UTC−3)" },
    { value: "America/New_York", label: "New York (UTC−4)" },
    { value: "Europe/Madrid", label: "Madrid (UTC+2)" },
    { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  ];
</script>
```
