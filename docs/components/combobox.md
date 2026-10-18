# Combobox (also Multi select)

A select you can type in, an autocomplete (Mantine's searchable Select, MultiSelect and TagsInput): typing filters the options; multiple keeps chips; creatable adds new values; clearable, max-values, groups, a result limit.

Import: `import "@raylang/elements/combobox";` · Category: Inputs

## `<ray-combobox>` (RayCombobox, extends FieldControl)

The WAI-ARIA combobox pattern (a text field with a listbox popup; the active option is aria-activedescendant). Arrows move, Enter picks, Escape closes (then clears with clearable), Backspace in an empty field removes the last chip. The form gets one entry per value.

Properties:

- `value` (attribute `value`: the initial value only): `string | string[]`. The chosen value; an array with multiple. The value attribute: "a,b" with multiple.
- `data` (property only): `Array<string | { value: string; label?: string; disabled?: boolean; group?: string }>`. Options instead of child <option>/<optgroup> elements.
- `multiple`: boolean, reflects. Several values, shown as chips.
- `placeholder`: string. Shown while empty.
- `creatable`: boolean. What was typed can be added when no option matches it ("+ Create …"); fires ray-create.
- `clearable`: boolean. A button that clears the value.
- `maxValues` (attribute `max-values`): number. With multiple: at most this many.
- `limit`: number. At most this many options shown (large lists: keep typing).
- `nothingFound` (attribute `nothing-found`): string, default `No matches`. Shown when nothing matches.
- `open`: boolean, reflects. The dropdown is shown.

Also the properties of FieldControl: `name`, `label`, `description`, `error`, `required`, `disabled`, `size`, `radius`, `variant`, `descriptionPosition`.

Events:

- `change`: The value changed (read value).
- `input`: Same moment as change.
- `ray-create` (detail `{ value: string }`): A new value was created from the typed text.
- `ray-open`: The dropdown opened.
- `ray-close`: The dropdown closed.

Slots:

- (default): <option> and <optgroup> elements.

Parts (`::part()`):

- `input`: The text field.
- `chips`: The chips container.
- `chip`: A chip.
- `clear`: The clear button.
- `dropdown`: The listbox.
- `option`: An option.

Methods and properties:

- `readonly values: string[]`: The value as an array (with or without multiple).
- `toggle(force?: boolean): void`: Opens or closes the dropdown.

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.7.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Search a long list, with groups</div>
<div class="demo-grid">
  <ray-combobox id="demo-cb-country" label="Country" placeholder="Type to search" clearable value="cl">
    <optgroup label="South America"><option value="ar">Argentina</option><option value="br">Brazil</option><option value="cl">Chile</option><option value="co">Colombia</option><option value="pe">Peru</option><option value="uy">Uruguay</option></optgroup>
    <optgroup label="Europe"><option value="de">Germany</option><option value="es">Spain</option><option value="fr">France</option><option value="it">Italy</option><option value="pt">Portugal</option><option value="uk">United Kingdom</option></optgroup>
    <optgroup label="Asia"><option value="jp">Japan</option><option value="kr">South Korea</option><option value="in">India</option><option value="sg">Singapore</option></optgroup>
  </ray-combobox>
  <ray-combobox id="demo-cb-big" label="Package" placeholder="500 packages: try “net”" limit="8" description="limit=&quot;8&quot;: the first 8 matches, keep typing for the rest."></ray-combobox>
</div>

<div class="demo-caption">multiple: chips, max-values</div>
<div class="demo-grid">
  <ray-combobox id="demo-cb-team" label="Reviewers" multiple max-values="3" placeholder="Add reviewers" value="ada,grace" clearable description="Up to 3. Backspace removes the last.">
    <option value="ada">Ada Lovelace</option>
    <option value="alan">Alan Turing</option>
    <option value="grace">Grace Hopper</option>
    <option value="katherine">Katherine Johnson</option>
    <option value="linus">Linus Torvalds</option>
    <option value="margaret">Margaret Hamilton</option>
  </ray-combobox>
  <ray-combobox id="demo-cb-tags" label="Tags" multiple creatable placeholder="Type a tag and press Enter" value="raylang,ui" description="creatable: a tags input; new tags fire ray-create.">
    <option value="raylang">raylang</option>
    <option value="ui">ui</option>
    <option value="web-components">web-components</option>
    <option value="tokens">tokens</option>
  </ray-combobox>
</div>
<p class="demo-muted" id="demo-cb-out">Pick, type or remove: the values show here.</p>

<div class="demo-caption">In a form, variants and states</div>
<form class="demo-grid" id="demo-cb-form" novalidate>
  <ray-combobox name="runtime" label="Runtime" required placeholder="Required" variant="filled">
    <option value="native">Native binary</option><option value="wasm">WebAssembly</option><option value="node">Node compatible</option>
  </ray-combobox>
  <ray-combobox name="stack" label="Stack" multiple placeholder="Frameworks" size="lg">
    <option value="react">React</option><option value="vue">Vue</option><option value="svelte">Svelte</option><option value="solid">Solid</option><option value="lit">Lit</option>
  </ray-combobox>
  <ray-combobox label="Disabled" disabled value="b"><option value="a">Alpha</option><option value="b">Beta</option></ray-combobox>
  <div class="demo-actions"><ray-button type="submit" size="sm">Submit</ray-button><span class="demo-muted" id="demo-cb-form-out"></span></div>
</form>

<script type="module">
  // 500 options from data.
  const names = ["net", "web", "rpc", "db", "json", "http", "auth", "cache", "queue", "mail", "log", "test", "cli", "ui", "fs", "crypto", "time", "csv", "img", "pdf"];
  const big = [];
  for (let i = 0; i < 500; i++) big.push({ value: `pkg-${i}`, label: `${names[i % names.length]}-${["core", "kit", "plus", "lite", "x"][i % 5]}${i >= 100 ? `-${i}` : ""}` });
  document.getElementById("demo-cb-big").data = big;

  // The values of the multiple ones.
  const team = document.getElementById("demo-cb-team");
  const tags = document.getElementById("demo-cb-tags");
  const show = (text) => { document.getElementById("demo-cb-out").textContent = text; };
  team.addEventListener("change", () => show(`reviewers = [${team.value.join(", ")}]`));
  tags.addEventListener("change", () => show(`tags = [${tags.value.join(", ")}]`));
  tags.addEventListener("ray-create", (e) => show(`ray-create: “${e.detail.value}” · tags = [${tags.value.join(", ")}]`));

  // Submit: the form data, one entry per value.
  const form = document.getElementById("demo-cb-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const runtime = form.querySelector('[name="runtime"]');
    runtime.error = runtime.value ? "" : "Choose a runtime.";
    if (!runtime.value) return;
    const data = new FormData(form);
    document.getElementById("demo-cb-form-out").textContent = `runtime=${data.get("runtime")} stack=${data.getAll("stack").join(",") || "–"}`;
  });
</script>
```
