# Accordion

Collapsible sections (WAI-ARIA accordion pattern); one open at a time, or several with multiple.

Import: `import "@raylang/elements/accordion";` · Category: Data display

## `<ray-accordion>` (RayAccordion, extends RayElement)

Properties:

- `value`: `string | string[] | undefined`. Open item's value; with multiple, an array (attribute: comma-separated).
- `multiple`: boolean, reflects. Several items may be open.
- `variant`: `default` | `contained` | `separated` | `filled`, default `default`, reflects. Visual style.
- `chevronPosition` (attribute `chevron-position`): `right` | `left`, default `right`, reflects. Side of the chevron.

Events:

- `change`: The user opened or closed an item.

Slots:

- (default): ray-accordion-item elements.

Methods and properties:

- `readonly items: RayAccordionItem[]`: The items.
- `readonly openValues: string[]`: The open values as an array, whatever the mode.

Vue `v-model`: `value` (updated on change).

## `<ray-accordion-item>` (RayAccordionItem, extends RayElement)

Properties:

- `value`: string, reflects. Identifies the item in the accordion's value.
- `label`: string. Header text (or slot=label).
- `description`: string. A secondary line under the label, in the header.
- `disabled`: boolean, reflects. Cannot be toggled.
- `headingLevel` (attribute `heading-level`): number, default `3`. aria-level of the header.

Slots:

- (default): Panel content.
- `label`: Rich header content.
- `left`: Icon before the label.

Parts (`::part()`):

- `control`: The header button.
- `description`: The secondary line under the label.
- `panel`: The collapsible region.

Methods and properties:

- `readonly open: boolean`: Whether this item is expanded.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Variants</div>
<div class="demo-accordion-variants">
  <div class="demo-stack">
    <span class="demo-matrix-label">default</span>
    <ray-accordion value="vm">
      <ray-accordion-item value="vm" label="Does it need a runtime?">No. <code>ray build --native</code> makes a single binary; <code>ray run</code> uses the VM for quick iterations.</ray-accordion-item>
      <ray-accordion-item value="os" label="Which platforms?">macOS, Linux and Windows on the desktop; iOS and Android through <code>ray bundle</code>.</ray-accordion-item>
      <ray-accordion-item value="ui" label="Can I use React?">Yes: <code>ray new app --frontend react-ts</code>, then the <code>@raylang/react</code> wrappers.</ray-accordion-item>
    </ray-accordion>
  </div>
  <div class="demo-stack">
    <span class="demo-matrix-label">contained</span>
    <ray-accordion variant="contained" value="vm">
      <ray-accordion-item value="vm" label="Does it need a runtime?">No. <code>ray build --native</code> makes a single binary; <code>ray run</code> uses the VM for quick iterations.</ray-accordion-item>
      <ray-accordion-item value="os" label="Which platforms?">macOS, Linux and Windows on the desktop; iOS and Android through <code>ray bundle</code>.</ray-accordion-item>
      <ray-accordion-item value="ui" label="Can I use React?">Yes: <code>ray new app --frontend react-ts</code>, then the <code>@raylang/react</code> wrappers.</ray-accordion-item>
    </ray-accordion>
  </div>
  <div class="demo-stack">
    <span class="demo-matrix-label">separated</span>
    <ray-accordion variant="separated" value="vm">
      <ray-accordion-item value="vm" label="Does it need a runtime?">No. <code>ray build --native</code> makes a single binary; <code>ray run</code> uses the VM for quick iterations.</ray-accordion-item>
      <ray-accordion-item value="os" label="Which platforms?">macOS, Linux and Windows on the desktop; iOS and Android through <code>ray bundle</code>.</ray-accordion-item>
      <ray-accordion-item value="ui" label="Can I use React?">Yes: <code>ray new app --frontend react-ts</code>, then the <code>@raylang/react</code> wrappers.</ray-accordion-item>
    </ray-accordion>
  </div>
  <div class="demo-stack">
    <span class="demo-matrix-label">filled</span>
    <ray-accordion variant="filled" value="vm">
      <ray-accordion-item value="vm" label="Does it need a runtime?">No. <code>ray build --native</code> makes a single binary; <code>ray run</code> uses the VM for quick iterations.</ray-accordion-item>
      <ray-accordion-item value="os" label="Which platforms?">macOS, Linux and Windows on the desktop; iOS and Android through <code>ray bundle</code>.</ray-accordion-item>
      <ray-accordion-item value="ui" label="Can I use React?">Yes: <code>ray new app --frontend react-ts</code>, then the <code>@raylang/react</code> wrappers.</ray-accordion-item>
    </ray-accordion>
  </div>
</div>

<div class="demo-caption">Icons and descriptions</div>
<ray-accordion variant="contained" value="account" class="demo-accordion-settings">
  <ray-accordion-item value="account" label="Account" description="Name, email and avatar">
    <span slot="left" class="demo-accordion-icon" style="--c: var(--ray-blue-light-color); --bg: var(--ray-blue-light)"><ray-icon name="user"></ray-icon></span>
    <div class="demo-dialog-form">
      <ray-input label="Name" value="Ada Lovelace"></ray-input>
      <ray-input label="Email" type="email" value="ada@ray.dev"></ray-input>
    </div>
  </ray-accordion-item>
  <ray-accordion-item value="notifications" label="Notifications" description="What we email you about">
    <span slot="left" class="demo-accordion-icon" style="--c: var(--ray-orange-light-color); --bg: var(--ray-orange-light)"><ray-icon name="info"></ray-icon></span>
    <div class="demo-settings-toggles">
      <ray-switch label="Failed builds" checked></ray-switch>
      <ray-switch label="New releases" checked></ray-switch>
      <ray-switch label="Weekly summary"></ray-switch>
    </div>
  </ray-accordion-item>
  <ray-accordion-item value="appearance" label="Appearance" description="Theme and density">
    <span slot="left" class="demo-accordion-icon" style="--c: var(--ray-violet-light-color); --bg: var(--ray-violet-light)"><ray-icon name="sun"></ray-icon></span>
    <div class="demo-dialog-form">
      <div class="demo-field">Theme
        <ray-segmented-control value="system" aria-label="Theme"><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></ray-segmented-control>
      </div>
      <ray-slider label="Font size" min="12" max="20" value="14" show-value unit=" px"></ray-slider>
    </div>
  </ray-accordion-item>
  <ray-accordion-item value="security" label="Security" description="Two-step verification is off">
    <span slot="left" class="demo-accordion-icon" style="--c: var(--ray-red-light-color); --bg: var(--ray-red-light)"><ray-icon name="alert-triangle"></ray-icon></span>
    <ray-alert color="yellow" label="Protect your account">Turn on two-step verification to sign in with a code from your phone.</ray-alert>
    <div class="demo-row" style="margin-top: var(--ray-space-3)"><ray-button size="sm">Turn on</ray-button><ray-button size="sm" variant="subtle">Learn more</ray-button></div>
  </ray-accordion-item>
</ray-accordion>

<div class="demo-caption">Rich headers and content</div>
<ray-accordion variant="separated" multiple value="build" id="demo-release">
  <ray-accordion-item value="build">
    <span slot="label" class="demo-accordion-head"><span>Build</span><ray-badge variant="light" color="green" size="sm" normal-case>3 / 3</ray-badge></span>
    <ul class="demo-list">
      <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">macOS arm64</span><span class="demo-muted">4.2 MB</span></li>
      <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">Linux x86_64</span><span class="demo-muted">4.6 MB</span></li>
      <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">Windows x86_64</span><span class="demo-muted">5.1 MB</span></li>
    </ul>
  </ray-accordion-item>
  <ray-accordion-item value="tests">
    <span slot="label" class="demo-accordion-head"><span>Tests</span><ray-badge variant="light" color="yellow" size="sm" normal-case>1 flaky</ray-badge></span>
    <ray-progress value="96" label="128 of 133 passed" show-value color="yellow"></ray-progress>
    <p class="demo-muted" style="margin: var(--ray-space-3) 0 0"><code>ui: palette lists the menu commands</code> passed on retry.</p>
  </ray-accordion-item>
  <ray-accordion-item value="publish">
    <span slot="label" class="demo-accordion-head"><span>Publish</span><ray-badge variant="light" color="gray" size="sm" normal-case>Pending</ray-badge></span>
    <div class="demo-settings-toggles">
      <ray-checkbox label="Sign update.json" checked></ray-checkbox>
      <ray-checkbox label="Upload to GitHub Releases"></ray-checkbox>
      <ray-checkbox label="Announce in #releases"></ray-checkbox>
    </div>
    <div class="demo-row" style="margin-top: var(--ray-space-4)"><ray-button size="sm"><ray-icon slot="left" name="upload"></ray-icon>Publish 0.4.1</ray-button></div>
  </ray-accordion-item>
</ray-accordion>

<div class="demo-caption">Options</div>
<div class="demo-grid">
  <div class="demo-stack">
    <span class="demo-matrix-label">chevron-position="left" · multiple</span>
    <ray-accordion chevron-position="left" multiple value="a,b">
      <ray-accordion-item value="a" label="src/">main.ray, ui.ray, files.ray</ray-accordion-item>
      <ray-accordion-item value="b" label="tests/">files_test.ray, ui_test.ray</ray-accordion-item>
      <ray-accordion-item value="c" label="assets/">index.html, app.css, icon.png</ray-accordion-item>
    </ray-accordion>
  </div>
  <div class="demo-stack">
    <span class="demo-matrix-label">disabled item · value from code</span>
    <ray-accordion variant="contained" id="demo-accordion-code">
      <ray-accordion-item value="free" label="Free">Up to 3 projects and 1 GB of builds.</ray-accordion-item>
      <ray-accordion-item value="pro" label="Pro">Unlimited projects, signed releases and an update channel.</ray-accordion-item>
      <ray-accordion-item value="team" label="Team" description="Coming soon" disabled>Shared projects and roles.</ray-accordion-item>
    </ray-accordion>
    <div class="demo-row">
      <ray-button size="xs" variant="default" data-accordion-open="free">Open Free</ray-button>
      <ray-button size="xs" variant="default" data-accordion-open="pro">Open Pro</ray-button>
      <ray-button size="xs" variant="subtle" data-accordion-open="">Close all</ray-button>
      <span class="demo-muted" id="demo-accordion-out"></span>
    </div>
  </div>
</div>
<script type="module">
  const acc = document.getElementById("demo-accordion-code");
  const out = document.getElementById("demo-accordion-out");
  for (const b of document.querySelectorAll("[data-accordion-open]")) {
    b.addEventListener("click", () => { acc.value = b.dataset.accordionOpen || undefined; out.textContent = `value = ${JSON.stringify(acc.value ?? null)}`; });
  }
  acc.addEventListener("change", () => { out.textContent = `change: ${JSON.stringify(acc.value ?? null)}`; });
</script>
```
