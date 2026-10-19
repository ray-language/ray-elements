# Radio group

One choice among options: ray-radio (or ray-radio-card) elements inside a ray-radio-group, which is the form control.

Import: `import "@raylang/elements/radio";` · Category: Inputs

## `<ray-radio-group>` (RayRadioGroup, extends FormControl)

Arrow keys move the selection, Tab enters and leaves the group.

Properties:

- `value`: string. Value of the checked radio. Initial: the value attribute, or a radio with the checked attribute.
- `name`: string. Form field name.
- `label`: string. Group label (also its accessible name).
- `description`: string. Help text.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text.
- `required`: boolean. A choice is needed to submit.
- `disabled`: boolean. Disables every radio.
- `orientation`: `vertical` | `horizontal`, default `vertical`, reflects. Layout of the radios.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Size of every radio.
- `color`: string. Checked color of every radio.
- `variant`: `filled` | `outline`, default `filled`, reflects. Checked look of every radio: filled circle, or colored ring and dot.

Events:

- `input`: When the user picks a radio.
- `change`: When the user picks a radio.

Slots:

- (default): ray-radio or ray-radio-card elements (may be wrapped in layout elements: a ray-grid of cards).

Methods and properties:

- `readonly radios: RayRadio[]`: The radios (and radio cards) of the group.

Vue `v-model`: `value` (updated on change).

## `<ray-radio>` (RayRadio, extends RayElement)

Properties:

- `value`: string, reflects. Value given to the group when chosen.
- `checked` (attribute `checked`: the initial value only): boolean. Whether this radio is the group's value; setting it sets the group's value. The checked attribute marks the group's initial value (when the group has no value attribute).
- `label`: string. Label text (or the content).
- `description`: string. Help text under the label.
- `disabled`: boolean. Cannot be chosen.
- `color`: string. Overrides the group color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`. Overrides the group size.
- `variant`: `filled` | `outline`, reflects. Overrides the group variant.

Slots:

- (default): Label content.

Parts (`::part()`):

- `indicator`: The circle.
- `label`: The label.

## `<ray-radio-card>` (RayRadioCard, extends RayRadio)

A radio drawn as a card: a title (label), a detail (description), an icon, more content; checked, it takes the color's border and light background. Inside a ray-radio-group like a ray-radio (arrow keys, the form, required, disabled); put the cards in a ray-grid for columns.

Properties:

- `hideIndicator` (attribute `hide-indicator`): boolean, reflects. No radio circle: the card's border and background alone show the choice.

Also the properties of RayRadio (`<ray-radio>`): `value`, `checked`, `label`, `description`, `disabled`, `color`, `size`, `variant`.

Slots:

- (default): More content under the description.
- `icon`: An icon before the title.

Parts (`::part()`):

- `root`: The card.
- `icon`: Around the icon slot.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Delivery, with a live total</div>
<div class="demo-split">
  <ray-radio-group id="demo-shipping" label="Delivery" name="shipping" value="standard" description="Prices include taxes.">
    <ray-radio value="standard" label="Standard · free" description="4–6 business days"></ray-radio>
    <ray-radio value="express" label="Express · $9.00" description="1–2 business days"></ray-radio>
    <ray-radio value="pickup" label="Pick up in store · free" description="Ready tomorrow from 10:00"></ray-radio>
    <ray-radio value="drone" label="Drone · $24.00" description="Not available at your address" disabled></ray-radio>
  </ray-radio-group>
  <dl class="demo-summary">
    <div><dt>Subtotal</dt><dd>$48.00</dd></div>
    <div><dt>Delivery</dt><dd id="demo-shipping-cost">$0.00</dd></div>
    <div class="total"><dt>Total</dt><dd id="demo-shipping-total">$48.00</dd></div>
    <p class="demo-muted" id="demo-shipping-eta">Arrives in 4–6 business days.</p>
  </dl>
</div>

<div class="demo-caption">Cards: ray-radio-card in a ray-grid</div>
<ray-radio-group id="demo-preset" label="Preset" name="preset" value="pro">
  <ray-grid cols="2" gap="sm">
    <ray-radio-card value="pro" label="Pro boxing" description="12 × 3:00 / 1:00"></ray-radio-card>
    <ray-radio-card value="amateur" label="Amateur" description="3 × 3:00 / 1:00"></ray-radio-card>
    <ray-radio-card value="mma" label="MMA" description="5 × 5:00 / 1:00"></ray-radio-card>
    <ray-radio-card value="hiit" label="HIIT" description="8 × 0:20 / 0:10"></ray-radio-card>
  </ray-grid>
</ray-radio-group>

<div class="demo-grid">
  <ray-radio-group label="Plan" name="plan" value="team" color="teal">
    <ray-radio-card value="solo" label="Solo" description="One seat, every component."><ray-icon slot="icon" name="user"></ray-icon></ray-radio-card>
    <ray-radio-card value="team" label="Team · $12/month" description="Up to 10 seats and shared themes."><ray-icon slot="icon" name="home"></ray-icon><ray-badge size="xs" variant="light" color="teal">Popular</ray-badge></ray-radio-card>
    <ray-radio-card value="enterprise" label="Enterprise" description="Contact us." disabled><ray-icon slot="icon" name="settings"></ray-icon></ray-radio-card>
  </ray-radio-group>
  <ray-radio-group label="Without the circle" value="dark" orientation="horizontal">
    <ray-radio-card value="light" label="Light" hide-indicator><ray-icon slot="icon" name="sun"></ray-icon></ray-radio-card>
    <ray-radio-card value="dark" label="Dark" hide-indicator><ray-icon slot="icon" name="moon"></ray-icon></ray-radio-card>
    <ray-radio-card value="system" label="System" hide-indicator><ray-icon slot="icon" name="monitor"></ray-icon></ray-radio-card>
  </ray-radio-group>
</div>

<div class="demo-caption">Horizontal, colors and the outline variant</div>
<div class="demo-grid">
  <ray-radio-group label="Theme" orientation="horizontal" color="violet" value="dark">
    <ray-radio value="light">Light</ray-radio>
    <ray-radio value="dark">Dark</ray-radio>
    <ray-radio value="system">System</ray-radio>
  </ray-radio-group>
  <ray-radio-group label="Backups" orientation="horizontal" variant="outline" color="teal" value="daily">
    <ray-radio value="hourly">Hourly</ray-radio>
    <ray-radio value="daily">Daily</ray-radio>
    <ray-radio value="weekly">Weekly</ray-radio>
  </ray-radio-group>
  <ray-radio-group label="Size" orientation="horizontal" color="orange" size="md" value="m">
    <ray-radio value="s">S</ray-radio>
    <ray-radio value="m">M</ray-radio>
    <ray-radio value="l">L</ray-radio>
    <ray-radio value="xl" disabled>XL</ray-radio>
  </ray-radio-group>
</div>

<div class="demo-caption">Sizes</div>
<div class="demo-row">
  <ray-radio-group aria-label="Extra small" size="xs" value="a"><ray-radio value="a">xs</ray-radio></ray-radio-group>
  <ray-radio-group aria-label="Small" size="sm" value="a"><ray-radio value="a">sm</ray-radio></ray-radio-group>
  <ray-radio-group aria-label="Medium" size="md" value="a"><ray-radio value="a">md</ray-radio></ray-radio-group>
  <ray-radio-group aria-label="Large" size="lg" value="a"><ray-radio value="a">lg</ray-radio></ray-radio-group>
  <ray-radio-group aria-label="Extra large" size="xl" value="a"><ray-radio value="a">xl</ray-radio></ray-radio-group>
</div>

<div class="demo-caption">Required, in a form</div>
<form class="demo-auth" id="demo-survey" novalidate>
  <ray-radio-group id="demo-source" name="source" label="How did you hear about ray·elements?" description-position="below" description="One answer." required>
    <ray-radio value="friend">A friend or a colleague</ray-radio>
    <ray-radio value="search">A search engine</ray-radio>
    <ray-radio value="talk">A talk or a meetup</ray-radio>
    <ray-radio value="other">Somewhere else</ray-radio>
  </ray-radio-group>
  <div class="demo-actions"><ray-button type="submit">Send</ray-button><span class="demo-muted" id="demo-survey-out"></span></div>
</form>

<script type="module">
  // Delivery: the total follows the choice.
  const prices = { standard: 0, express: 9, pickup: 0, drone: 24 };
  const eta = { standard: "Arrives in 4–6 business days.", express: "Arrives in 1–2 business days.", pickup: "Ready tomorrow from 10:00.", drone: "" };
  const shipping = document.getElementById("demo-shipping");
  const money = (n) => `$${n.toFixed(2)}`;
  shipping.addEventListener("change", () => {
    const cost = prices[shipping.value] ?? 0;
    document.getElementById("demo-shipping-cost").textContent = money(cost);
    document.getElementById("demo-shipping-total").textContent = money(48 + cost);
    document.getElementById("demo-shipping-eta").textContent = eta[shipping.value] ?? "";
  });

  // Required: the error shows on submit and goes away with an answer.
  const form = document.getElementById("demo-survey");
  const source = document.getElementById("demo-source");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!source.value) {
      source.error = "Pick one to continue.";
      document.getElementById("demo-survey-out").textContent = "";
      return;
    }
    document.getElementById("demo-survey-out").textContent = `Thanks! source=${new FormData(form).get("source")}`;
  });
  source.addEventListener("change", () => { source.error = ""; });
</script>
```
