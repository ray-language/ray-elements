# Tabs

Tabs and panels (WAI-ARIA tabs pattern): arrows, Home/End, automatic or manual activation.

Import: `import "@raylang/elements/tabs";` · Category: Navigation

## `<ray-tabs>` (RayTabs, extends RayElement)

More tabs than width: the list scrolls sideways, fades the edge that hides tabs, scrolls with a vertical wheel and keeps the selected tab in view. The host then carries data-overflow-start and data-overflow-end (following the writing direction), to style it further.

Properties:

- `value`: string. Value of the active tab (default: the first enabled one).
- `variant`: `default` | `outline` | `pills`, default `default`, reflects. Tab style.
- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Tab list direction (and arrow keys).
- `color`: string, reflects. Active indicator color.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height, font size and padding of the tabs (xs for a compact bar).
- `activation`: `auto` | `manual`, default `auto`. manual: arrows move focus, Enter/Space activates.
- `grow`: boolean, reflects. Tabs share the full width.

Events:

- `change`: The user activated another tab.

Slots:

- (default): ray-tab and ray-tab-panel elements (tabs move to the tab list on their own).

Parts (`::part()`):

- `list`: The tab list (it scrolls sideways when the tabs do not fit).
- `panels`: The panel area.

Methods and properties:

- `readonly tabs: RayTab[]`: The tabs.
- `readonly panels: RayTabPanel[]`: The panels.

Vue `v-model`: `value` (updated on change).

## `<ray-tab>` (RayTab, extends RayElement)

Properties:

- `value`: string, reflects. Matches a ray-tab-panel's value.
- `disabled`: boolean, reflects. Cannot be activated.

Slots:

- `left`: Icon.
- `right`: Badge or count.

## `<ray-tab-panel>` (RayTabPanel, extends RayElement)

Properties:

- `value`: string, reflects. Matches a ray-tab's value.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Default · underline</div>
<ray-tabs value="code">
  <ray-tab value="code">Code</ray-tab>
  <ray-tab value="tests">Tests <ray-badge slot="right" size="xs" color="gray">12</ray-badge></ray-tab>
  <ray-tab value="settings">Settings</ray-tab>
  <ray-tab value="billing" disabled>Billing</ray-tab>
  <ray-tab-panel value="code">
    <div class="demo-stack">
      <div class="demo-panel-head"><strong>ray-remote</strong><span class="demo-muted">main · updated 2 hours ago</span></div>
      <ul class="demo-list">
        <li><ray-icon name="folder"></ray-icon><span class="grow">src/</span><span class="demo-muted">6 files</span></li>
        <li><ray-icon name="file"></ray-icon><span class="grow">src/main.ray</span><span class="demo-muted">4.2 KB</span></li>
        <li><ray-icon name="file"></ray-icon><span class="grow">src/server.ray</span><span class="demo-muted">11.8 KB</span></li>
        <li><ray-icon name="file"></ray-icon><span class="grow">ray.toml</span><span class="demo-muted">312 B</span></li>
      </ul>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="tests">
    <div class="demo-stack">
      <div class="demo-panel-head"><strong>12 tests, all passing</strong><span class="demo-muted">1.84 s</span></div>
      <ray-progress value="100" color="green" size="sm" label="Tests passed"></ray-progress>
      <ul class="demo-list">
        <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">server › serves the index</span><span class="demo-muted">12 ms</span></li>
        <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">server › rejects a bad token</span><span class="demo-muted">8 ms</span></li>
        <li><ray-icon name="circle-check" color="green"></ray-icon><span class="grow">sync › resumes after a drop</span><span class="demo-muted">1.2 s</span></li>
      </ul>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="settings">
    <div class="demo-stack" style="max-width: 24rem">
      <ray-input label="Project name" value="ray-remote"></ray-input>
      <ray-switch label="Run tests on every push" checked></ray-switch>
      <div class="demo-row"><ray-button size="sm">Save</ray-button><ray-button size="sm" variant="default">Reset</ray-button></div>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="billing">Billing.</ray-tab-panel>
</ray-tabs>
<div class="demo-caption">Pills</div>
<ray-tabs variant="pills" value="week" color="teal">
  <ray-tab value="day">Day</ray-tab>
  <ray-tab value="week">Week</ray-tab>
  <ray-tab value="month">Month</ray-tab>
  <ray-tab-panel value="day">
    <div class="demo-grid">
      <ray-stat label="Builds" value="18" diff="12.5" note="vs. yesterday"></ray-stat>
      <ray-stat label="Success rate" value="94%" diff="-2.1" note="vs. yesterday"></ray-stat>
      <ray-stat label="Average duration" value="1m 42s" diff="-8" note="lower is better" inverse></ray-stat>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="week">
    <div class="demo-grid">
      <ray-stat label="Builds" value="126" diff="4.3" note="vs. last week"></ray-stat>
      <ray-stat label="Success rate" value="97%" diff="1.4" note="vs. last week"></ray-stat>
      <ray-stat label="Average duration" value="1m 38s" diff="-5" note="lower is better" inverse></ray-stat>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="month">
    <div class="demo-grid">
      <ray-stat label="Builds" value="512" diff="9.8" note="vs. last month"></ray-stat>
      <ray-stat label="Success rate" value="96%" diff="0.6" note="vs. last month"></ray-stat>
      <ray-stat label="Average duration" value="1m 45s" diff="3" note="lower is better" inverse></ray-stat>
    </div>
  </ray-tab-panel>
</ray-tabs>
<div class="demo-caption">Compact · size xs</div>
<ray-tabs size="xs" value="headers">
  <ray-tab value="params">Params</ray-tab>
  <ray-tab value="headers">Headers</ray-tab>
  <ray-tab value="body">Body</ray-tab>
  <ray-tab value="auth">Auth</ray-tab>
  <ray-tab value="tests">Tests</ray-tab>
  <ray-tab value="settings">Settings</ray-tab>
</ray-tabs>

<div class="demo-caption">Outline · vertical</div>
<ray-tabs variant="outline" orientation="vertical" value="editor">
  <ray-tab value="general">General</ray-tab>
  <ray-tab value="editor">Editor</ray-tab>
  <ray-tab value="keys">Keybindings</ray-tab>
  <ray-tab-panel value="general">
    <div class="demo-stack" style="max-width: 24rem">
      <ray-input label="Display name" value="Ray Developer"></ray-input>
      <ray-select label="Language" value="en">
        <option value="en">English</option>
        <option value="es">Español</option>
      </ray-select>
      <ray-switch label="Check for updates automatically" checked></ray-switch>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="editor">
    <div class="demo-stack" style="max-width: 24rem">
      <ray-select label="Font size" value="14" description="Applies to every open editor.">
        <option value="12">12 px</option>
        <option value="14">14 px</option>
        <option value="16">16 px</option>
      </ray-select>
      <div class="demo-field"><span id="tab-size-label">Indent width</span>
      <ray-segmented-control value="4" aria-labelledby="tab-size-label">
        <option value="2">2</option>
        <option value="4">4</option>
        <option value="8">8</option>
      </ray-segmented-control></div>
      <ray-switch label="Wrap long lines" checked></ray-switch>
      <ray-switch label="Format on save"></ray-switch>
    </div>
  </ray-tab-panel>
  <ray-tab-panel value="keys">
    <ul class="demo-list" style="max-width: 28rem">
      <li><span class="grow">Command palette</span><span><ray-kbd>⌘</ray-kbd> <ray-kbd>K</ray-kbd></span></li>
      <li><span class="grow">Run tests</span><span><ray-kbd>⌘</ray-kbd> <ray-kbd>T</ray-kbd></span></li>
      <li><span class="grow">Toggle sidebar</span><span><ray-kbd>⌘</ray-kbd> <ray-kbd>B</ray-kbd></span></li>
      <li><span class="grow">Format document</span><span><ray-kbd>⇧</ray-kbd> <ray-kbd>⌥</ray-kbd> <ray-kbd>F</ray-kbd></span></li>
    </ul>
  </ray-tab-panel>
</ray-tabs>
```
