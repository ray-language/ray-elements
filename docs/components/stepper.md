# Stepper

A task in steps (Mantine's Stepper): a wizard, a checkout, an onboarding. Numbers or icons, labels, connectors, the content of the active step; loading and error states; completed steps can be revisited.

Import: `import "@raylang/elements/stepper";` · Category: Navigation

## `<ray-stepper>` (RayStepper, extends RayElement)

The steps are a labelled list; the active one has aria-current="step" and each reads "Step 2 of 4: Shipping, completed". Only the active step's content shows; past the last step, the completed slot.

Properties:

- `active`: number, default `0`, reflects. Index of the active step (steps.length: completed).
- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Steps in a row above the content, or in a column beside it.
- `iconPosition` (attribute `icon-position`): `left` | `top`, default `left`, reflects. Label beside the number, or under it (narrow screens, many steps).
- `allowStepSelect` (attribute `allow-step-select`): boolean, reflects. Completed steps are buttons that go back to them.
- `linear`: boolean, default `true`. With allow-step-select off, false lets the user jump to any step.
- `size`: `sm` | `md` | `lg`, default `md`, reflects. Size of the numbers.
- `color`: string, reflects. A palette color or any CSS color for active and completed steps (default: primary).
- `label`: string, default `Progress`. Accessible name of the list of steps.

Events:

- `change`: active changed by the user (a step clicked, next(), prev()).

Slots:

- (default): ray-step elements.
- `completed`: Shown once every step is done.

Parts (`::part()`):

- `steps`: The list of steps.
- `step`: A step (also step-done, step-active, step-todo).
- `indicator`: A step's number or icon.
- `label`: A step's label.
- `description`: A step's description.
- `connector`: The line between steps.
- `content`: The content area.

Methods and properties:

- `readonly steps: RayStep[]`: The steps, in order.
- `next(): void`: To the next step (past the last: completed).
- `prev(): void`: To the previous step.

Vue `v-model`: `active` (updated on change).

## `<ray-step>` (RayStep, extends RayElement)

A step: its header is drawn by the stepper, its content shows while it is active.

Properties:

- `label`: string. The label.
- `description`: string. A line under the label.
- `icon`: string. An icon instead of the number.
- `completedIcon` (attribute `completed-icon`): string. The icon once done (default: check).
- `loading`: boolean, reflects. A spinner instead of the number.
- `error`: string. An error message: red step, the message as its description.
- `disabled`: boolean, reflects. Cannot be selected.

Slots:

- (default): The content shown while it is active.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A checkout</div>
<ray-card with-border radius="lg" padding="lg">
  <ray-stepper id="demo-st-checkout" active="0" allow-step-select label="Checkout">
    <ray-step label="Account" description="Who is buying">
      <ray-grid cols="1 sm:2" gap="sm">
        <ray-input label="Name" value="Ada Lovelace"></ray-input>
        <ray-input label="Email" type="email" value="ada@ray.dev"></ray-input>
      </ray-grid>
    </ray-step>
    <ray-step label="Shipping" description="Where it goes">
      <ray-stack gap="sm">
        <ray-input label="Address" placeholder="Street and number"></ray-input>
        <ray-radio-group label="Delivery" orientation="horizontal" value="standard"><ray-radio value="standard">Standard · free</ray-radio><ray-radio value="express">Express · $9</ray-radio></ray-radio-group>
      </ray-stack>
    </ray-step>
    <ray-step label="Payment" description="Card or invoice" id="demo-st-pay">
      <ray-stack gap="sm">
        <ray-segmented-control aria-label="Method" value="card"><option value="card">Card</option><option value="invoice">Invoice</option></ray-segmented-control>
        <ray-input label="Card number" placeholder="4242 4242 4242 4242"></ray-input>
      </ray-stack>
    </ray-step>
    <ray-step label="Review" description="Check and pay">
      <dl class="demo-summary"><div><dt>2 × Pro seats</dt><dd>$2,499.00</dd></div><div class="total"><dt>Total</dt><dd>$2,499.00</dd></div></dl>
    </ray-step>
    <ray-center slot="completed" class="demo-st-done">
      <ray-stack align="center" gap="xs"><span class="demo-center-icon"><ray-icon name="circle-check"></ray-icon></span><strong>Order placed</strong><span class="demo-muted">A receipt is on its way to ada@ray.dev.</span><ray-button size="xs" variant="default" id="demo-st-again">Start over</ray-button></ray-stack>
    </ray-center>
  </ray-stepper>
  <ray-group slot="footer" justify="space-between" class="demo-st-nav">
    <ray-button variant="default" size="sm" id="demo-st-back" disabled>Back</ray-button>
    <ray-group gap="xs"><ray-switch label="Card declined" size="xs" id="demo-st-fail"></ray-switch><ray-button size="sm" id="demo-st-next">Next</ray-button></ray-group>
  </ray-group>
</ray-card>

<div class="demo-caption">Vertical, with a step in progress</div>
<ray-stepper orientation="vertical" active="2" color="teal" label="Deploy">
  <ray-step label="Build" description="4.1 s" icon="terminal"><p class="demo-muted">Compiled 42 modules.</p></ray-step>
  <ray-step label="Test" description="128 passed" icon="circle-check"><p class="demo-muted">All tests passed.</p></ray-step>
  <ray-step label="Upload" description="Uploading bundles…" loading><ray-progress value="64" size="sm" label="Upload"></ray-progress><p class="demo-muted">ray-remote-1.27.39-macos-arm64.dmg · 64%</p></ray-step>
  <ray-step label="Release" description="Publish update.json" icon="download"><p class="demo-muted">Not started.</p></ray-step>
</ray-stepper>

<div class="demo-caption">Labels under the numbers, sizes, colors</div>
<ray-stack gap="xl">
  <ray-stepper active="1" icon-position="top" size="sm" label="Onboarding"><ray-step label="Sign up"></ray-step><ray-step label="Profile"></ray-step><ray-step label="Team"></ray-step><ray-step label="Done"></ray-step></ray-stepper>
  <ray-stepper active="2" size="lg" color="violet" label="Wizard"><ray-step label="One" icon="user"></ray-step><ray-step label="Two" icon="settings"></ray-step><ray-step label="Three" icon="bell"></ray-step></ray-stepper>
</ray-stack>

<script type="module">
  // Next and Back drive the stepper; a declined card is an error on its step.
  const st = document.getElementById("demo-st-checkout");
  const back = document.getElementById("demo-st-back");
  const next = document.getElementById("demo-st-next");
  const pay = document.getElementById("demo-st-pay");
  const fail = document.getElementById("demo-st-fail");
  const sync = () => {
    const n = st.steps.length;
    back.disabled = st.active === 0 || st.active >= n;
    next.disabled = st.active >= n;
    next.textContent = st.active === n - 1 ? "Place order" : "Next";
  };
  next.addEventListener("click", () => {
    if (st.active === 2 && fail.checked) { pay.error = "Card declined: try another one."; return; }
    pay.error = "";
    st.next();
  });
  back.addEventListener("click", () => st.prev());
  st.addEventListener("change", sync);
  document.getElementById("demo-st-again").addEventListener("click", () => { st.active = 0; sync(); });
  customElements.whenDefined("ray-stepper").then(sync);
</script>
```
