# Segmented control

One choice among a few, as a segmented row with a sliding indicator. Options from child <option> elements or data. Form-associated.

Import: `import "@raylang/elements/segmented-control";` · Category: Inputs

## `<ray-segmented-control>` (RaySegmentedControl, extends FormControl)

Properties:

- `value`: string. Selected value (default: the first enabled option).
- `data` (property only): `Array<string | { value: string; label?: string; disabled?: boolean }>`. Options as strings or { value, label, disabled }.
- `name`: string. Form field name.
- `color`: string, reflects. Indicator color (default: a raised neutral segment).
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height and font size.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius.
- `fullWidth` (attribute `full-width`): boolean. Takes the whole width.
- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Direction.
- `disabled`: boolean. Not interactive nor submitted.

Events:

- `input`: The user picked another option.
- `change`: The user picked another option.

Slots:

- (default): <option> elements.

Parts (`::part()`):

- `root`: The row.
- `indicator`: The sliding highlight.
- `control`: Each option button.

Methods and properties:

- `readonly items: Array<{ value: string; label: string; disabled: boolean }>`: The options, from data or the child options.

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Billing period</div>
<div class="demo-pricing">
  <ray-segmented-control id="demo-billing" radius="full" value="monthly" aria-label="Billing period">
    <option value="monthly">Monthly</option>
    <option value="yearly">Yearly · save 20%</option>
  </ray-segmented-control>
  <div class="demo-price-cards">
    <div class="demo-price-card"><span>Hobby</span><strong data-monthly="0" data-yearly="0">$0</strong><small>Free forever</small></div>
    <div class="demo-price-card featured"><span>Pro</span><strong data-monthly="12" data-yearly="115">$12</strong><small data-unit>per month</small></div>
    <div class="demo-price-card"><span>Team</span><strong data-monthly="32" data-yearly="307">$32</strong><small data-unit>per month</small></div>
  </div>
</div>

<div class="demo-caption">Switch the view</div>
<div class="demo-views">
  <ray-segmented-control id="demo-view" size="xs" value="grid" aria-label="View">
    <option value="list">List</option>
    <option value="grid">Grid</option>
  </ray-segmented-control>
  <ul class="demo-view-items" id="demo-view-items" data-view="grid">
    <li><span class="sw" style="--c: var(--ray-blue-light-color)"></span>Release notes<small>12 KB</small></li>
    <li><span class="sw" style="--c: var(--ray-teal-light-color)"></span>Roadmap<small>8 KB</small></li>
    <li><span class="sw" style="--c: var(--ray-violet-light-color)"></span>Brand kit<small>2.4 MB</small></li>
    <li><span class="sw" style="--c: var(--ray-orange-light-color)"></span>Invoices<small>640 KB</small></li>
    <li><span class="sw" style="--c: var(--ray-pink-light-color)"></span>Screenshots<small>18 MB</small></li>
    <li><span class="sw" style="--c: var(--ray-green-light-color)"></span>Contracts<small>1.1 MB</small></li>
  </ul>
</div>

<div class="demo-caption">Colors, sizes and radius</div>
<div class="demo-stack demo-start">
  <ray-segmented-control color="teal" size="xs" radius="full" aria-label="Range">
    <option>1h</option><option>24h</option><option>7d</option><option disabled>30d</option>
  </ray-segmented-control>
  <ray-segmented-control color="violet" aria-label="Alignment" value="center">
    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
  </ray-segmented-control>
  <ray-segmented-control color="orange" size="lg" radius="xs" aria-label="Mode">
    <option>Design</option><option>Prototype</option><option>Inspect</option>
  </ray-segmented-control>
  <ray-segmented-control disabled aria-label="Disabled">
    <option>Disabled</option><option>as a whole</option>
  </ray-segmented-control>
</div>

<div class="demo-caption">Vertical, full width, and from data</div>
<div class="demo-grid">
  <ray-segmented-control orientation="vertical" aria-label="Section" value="profile">
    <option value="profile">Profile</option><option value="security">Security</option><option value="billing">Billing</option>
  </ray-segmented-control>
  <div class="demo-stack">
    <ray-segmented-control full-width size="md" aria-label="Platform">
      <option>macOS</option><option>Linux</option><option>Windows</option>
    </ray-segmented-control>
    <ray-segmented-control id="demo-seg-data" full-width aria-label="Status"></ray-segmented-control>
  </div>
</div>

<script type="module">
  // Billing: the prices follow the period.
  const billing = document.getElementById("demo-billing");
  billing.addEventListener("change", () => {
    const yearly = billing.value === "yearly";
    for (const el of document.querySelectorAll(".demo-price-card strong")) el.textContent = `$${yearly ? el.dataset.yearly : el.dataset.monthly}`;
    for (const el of document.querySelectorAll(".demo-price-card [data-unit]")) el.textContent = yearly ? "per year" : "per month";
  });

  // View: list or grid.
  const view = document.getElementById("demo-view");
  view.addEventListener("change", () => { document.getElementById("demo-view-items").dataset.view = view.value; });

  // From data: strings or { value, label, disabled }.
  const status = document.getElementById("demo-seg-data");
  status.data = [{ value: "open", label: "Open" }, { value: "review", label: "In review" }, { value: "done", label: "Done" }, { value: "archived", label: "Archived", disabled: true }];
  status.value = "review";
</script>
```
