# Number input

A number field (Mantine's NumberInput): + and − buttons (hold to repeat), arrow keys, min, max and step, fixed decimals, a prefix and a suffix, a thousands separator. An ARIA spinbutton.

Import: `import "@raylang/elements/number-input";` · Category: Inputs

## `<ray-number-input>` (RayNumberInput, extends FieldControl)

Arrow Up/Down step (Shift: ×10), Page Up/Down ×10, Home/End go to min/max. The value is a number (undefined when empty); the form gets its plain digits; min and max are checked (rangeUnderflow, rangeOverflow). Enter submits its form, as in ray-input.

Properties:

- `value`: number. The number (undefined when empty).
- `min`: number. Minimum.
- `max`: number. Maximum.
- `step`: number, default `1`. What + and − add.
- `decimals`: number. Fixed decimals (2: 3 shows as 3.00).
- `prefix`: `string | null`. Shown before the number ("$").
- `suffix`: string. Shown after the number (" kg", "%").
- `thousandsSeparator` (attribute `thousands-separator`): string. Groups thousands in the shown text (",", ".", " ").
- `decimalSeparator` (attribute `decimal-separator`): string, default `.`. The decimal mark shown and typed ("," in many locales).
- `clamp`: `blur` | `strict` | `none`, default `blur`. When out-of-range input is clamped: on blur, while typing, or never (then it is invalid).
- `hideControls` (attribute `hide-controls`): boolean, reflects. No + and − buttons (the keys still step).
- `placeholder`: string. Shown while empty.
- `readonly`: boolean, reflects. Not editable, still submitted.

Also the properties of FieldControl: `name`, `label`, `description`, `error`, `required`, `disabled`, `size`, `radius`, `variant`, `descriptionPosition`.

Events:

- `input`: On every change of the value (typing, keys, buttons).
- `change`: When the value is committed (blur, a step).

Slots:

- `left`: Left section (an icon).
- `right`: Right section.

Parts (`::part()`):

- `input`: The text field.
- `controls`: The + and − column.
- `increment`: The + button.
- `decrement`: The − button.

Methods and properties:

- `stepBy(steps: number): void`: Adds steps (negative: subtracts), clamped; fires input and change.

Vue `v-model`: `value` (updated on input).

Exports (from `@raylang/elements/number-input` and `@raylang/elements`):

- `function parseNumber(text: string, options?: { decimal?: string; thousands?: string }): number`: The number in a text with separators, prefix or suffix (NaN if none).
- `function formatNumber(n: number, options?: { decimals?: number; thousands?: string; decimal?: string }): string`: A number as text with fixed decimals and separators.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">An order: quantity × price</div>
<div class="demo-split">
  <ray-stack gap="sm">
    <ray-number-input id="demo-ni-qty" label="Quantity" value="2" min="1" max="20" description="1 to 20 seats."></ray-number-input>
    <ray-number-input id="demo-ni-price" label="Price per seat" value="1249.5" prefix="$" decimals="2" thousands-separator="," step="50" min="0"></ray-number-input>
    <ray-number-input id="demo-ni-off" label="Discount" value="10" suffix="%" min="0" max="50" step="5"></ray-number-input>
  </ray-stack>
  <dl class="demo-summary">
    <div><dt>Subtotal</dt><dd id="demo-ni-sub"></dd></div>
    <div><dt>Discount</dt><dd id="demo-ni-disc"></dd></div>
    <div class="total"><dt>Total</dt><dd id="demo-ni-total"></dd></div>
    <p class="demo-muted">Arrows step, Shift+arrows ×10, hold + or − to repeat.</p>
  </dl>
</div>

<div class="demo-caption">Units, steps and locales</div>
<div class="demo-grid">
  <ray-number-input label="Weight" value="72.5" suffix=" kg" decimals="1" step="0.5" min="0"></ray-number-input>
  <ray-number-input label="Temperature" value="-4" suffix=" °C" min="-40" max="50"></ray-number-input>
  <ray-number-input label="Precio (es)" value="1234567.8" prefix="€ " decimals="2" thousands-separator="." decimal-separator=","></ray-number-input>
  <ray-number-input label="Port" value="8080" min="1" max="65535" hide-controls description="hide-controls: the keys still step."></ray-number-input>
</div>

<div class="demo-caption">Clamping, states and variants</div>
<div class="demo-grid">
  <ray-number-input label="clamp=&quot;blur&quot; (default)" value="5" min="0" max="10" description="Type 99, then leave the field."></ray-number-input>
  <ray-number-input label="clamp=&quot;strict&quot;" value="5" min="0" max="10" clamp="strict" description="Never above 10, even while typing."></ray-number-input>
  <ray-number-input label="clamp=&quot;none&quot;" value="12" min="0" max="10" clamp="none" error="The maximum is 10."></ray-number-input>
  <ray-number-input label="Filled, large" variant="filled" size="lg" value="3"></ray-number-input>
  <ray-number-input label="Required" required placeholder="Enter a number"></ray-number-input>
  <ray-number-input label="Disabled" value="42" disabled></ray-number-input>
</div>

<script type="module">
  // The total follows every change (input fires on each step and keystroke).
  const qty = document.getElementById("demo-ni-qty");
  const price = document.getElementById("demo-ni-price");
  const off = document.getElementById("demo-ni-off");
  const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const total = () => {
    const sub = (qty.value ?? 0) * (price.value ?? 0);
    const disc = sub * ((off.value ?? 0) / 100);
    document.getElementById("demo-ni-sub").textContent = money(sub);
    document.getElementById("demo-ni-disc").textContent = `−${money(disc)}`;
    document.getElementById("demo-ni-total").textContent = money(sub - disc);
  };
  for (const el of [qty, price, off]) el.addEventListener("input", total);
  customElements.whenDefined("ray-number-input").then(total);
</script>
```
