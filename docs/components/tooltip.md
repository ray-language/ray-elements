# Tooltip

A short hint on hover and focus of its child; the label also becomes the child's accessible description.

Import: `import "@raylang/elements/tooltip";` · Category: Overlays

## `<ray-tooltip>` (RayTooltip, extends Floating)

Properties:

- `label`: string. Tooltip text.
- `placement`: `top` | `bottom` | `left` | `right` | `top-start` | `top-end` | `bottom-start` | `bottom-end`, default `top`, reflects. Preferred side.
- `openDelay` (attribute `open-delay`): number, default `300`. ms before showing.
- `closeDelay` (attribute `close-delay`): number, default `0`. ms before hiding.
- `color`: string. A palette color or any CSS color. Default: inverted foreground/background.
- `disabled`: boolean. Never shows.

Also the properties of Floating: `open`, `offset`.

Slots:

- (default): The element the tooltip describes (one element).

Parts (`::part()`):

- `tooltip`: The tooltip box.

Methods and properties:

- `show(): void`: Opens it.
- `hide(): void`: Closes it.
- `toggle(): void`: Opens or closes it.
- `readonly trigger: Element | null`: The trigger element.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">An editor toolbar</div>
<div class="demo-toolbar" role="toolbar" aria-label="Formatting">
  <ray-tooltip label="Bold · ⌘B"><ray-icon-button variant="subtle" label="Bold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z"/></svg></ray-icon-button></ray-tooltip>
  <ray-tooltip label="Italic · ⌘I"><ray-icon-button variant="subtle" label="Italic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4h8M6 20h8M14 4l-4 16"/></svg></ray-icon-button></ray-tooltip>
  <ray-tooltip label="Quote · ⌘⇧."><ray-icon-button variant="subtle" label="Quote"><ray-icon name="quote"></ray-icon></ray-icon-button></ray-tooltip>
  <span class="demo-toolbar-sep"></span>
  <ray-tooltip label="Insert image"><ray-icon-button variant="subtle" label="Insert image"><ray-icon name="image"></ray-icon></ray-icon-button></ray-tooltip>
  <ray-tooltip label="Attach a file"><ray-icon-button variant="subtle" label="Attach a file"><ray-icon name="paperclip"></ray-icon></ray-icon-button></ray-tooltip>
  <ray-tooltip label="Code block · ⌘E"><ray-icon-button variant="subtle" label="Code block"><ray-icon name="terminal"></ray-icon></ray-icon-button></ray-tooltip>
  <span class="demo-toolbar-sep"></span>
  <ray-tooltip label="You have no permission to publish" color="red"><span tabindex="0" class="demo-tip-wrap"><ray-button size="xs" disabled>Publish</ray-button></span></ray-tooltip>
</div>

<div class="demo-caption">Help, truncated text and status</div>
<div class="demo-grid">
  <div class="demo-tip-field">
    <span class="demo-tip-label">API token <ray-tooltip label="Read-only tokens can list builds but not start them." placement="right"><span class="demo-tip-help" tabindex="0" role="img" aria-label="About API tokens"><ray-icon name="info"></ray-icon></span></ray-tooltip></span>
    <ray-input aria-label="API token" value="ray_live_4f9c2e…" readonly></ray-input>
  </div>
  <ul class="demo-tip-files">
    <li><ray-tooltip label="screenshot-2026-10-08-dark-theme-components-page.png" placement="top-start"><span tabindex="0" class="truncate">screenshot-2026-10-08-dark-theme-components-page.png</span></ray-tooltip><small>1.8 MB</small></li>
    <li><ray-tooltip label="ray-remote-1.27.39-macos-arm64-signed.dmg" placement="top-start"><span tabindex="0" class="truncate">ray-remote-1.27.39-macos-arm64-signed.dmg</span></ray-tooltip><small>42 MB</small></li>
  </ul>
  <div class="demo-row">
    <ray-tooltip label="All systems operational" color="green"><span class="demo-tip-dot" style="--c: var(--ray-green-filled)" tabindex="0" role="img" aria-label="Operational"></span></ray-tooltip>
    <ray-tooltip label="Degraded: builds are slower" color="yellow"><span class="demo-tip-dot" style="--c: var(--ray-yellow-filled)" tabindex="0" role="img" aria-label="Degraded"></span></ray-tooltip>
    <ray-tooltip label="Outage: deploys paused" color="red"><span class="demo-tip-dot" style="--c: var(--ray-red-filled)" tabindex="0" role="img" aria-label="Outage"></span></ray-tooltip>
    <span class="demo-muted">Hover or focus a dot</span>
  </div>
</div>

<div class="demo-caption">Placements</div>
<div class="demo-tip-grid">
  <ray-tooltip label="top-start" placement="top-start"><ray-button size="xs" variant="default">top-start</ray-button></ray-tooltip>
  <ray-tooltip label="top" placement="top"><ray-button size="xs" variant="default">top</ray-button></ray-tooltip>
  <ray-tooltip label="top-end" placement="top-end"><ray-button size="xs" variant="default">top-end</ray-button></ray-tooltip>
  <ray-tooltip label="left" placement="left"><ray-button size="xs" variant="default">left</ray-button></ray-tooltip>
  <span></span>
  <ray-tooltip label="right" placement="right"><ray-button size="xs" variant="default">right</ray-button></ray-tooltip>
  <ray-tooltip label="bottom-start" placement="bottom-start"><ray-button size="xs" variant="default">bottom-start</ray-button></ray-tooltip>
  <ray-tooltip label="bottom" placement="bottom"><ray-button size="xs" variant="default">bottom</ray-button></ray-tooltip>
  <ray-tooltip label="bottom-end" placement="bottom-end"><ray-button size="xs" variant="default">bottom-end</ray-button></ray-tooltip>
</div>

<div class="demo-caption">Colors, delays and disabled</div>
<div class="demo-row">
  <ray-tooltip label="Default"><ray-button size="xs" variant="light">default</ray-button></ray-tooltip>
  <ray-tooltip label="Violet" color="violet"><ray-button size="xs" variant="light" color="violet">violet</ray-button></ray-tooltip>
  <ray-tooltip label="Teal" color="teal"><ray-button size="xs" variant="light" color="teal">teal</ray-button></ray-tooltip>
  <ray-tooltip label="Any CSS color" color="#db2777"><ray-button size="xs" variant="light" color="pink">#db2777</ray-button></ray-tooltip>
  <span class="demo-indicator-sep"></span>
  <ray-tooltip label="Opens at once" open-delay="0"><ray-button size="xs" variant="default">open-delay 0</ray-button></ray-tooltip>
  <ray-tooltip label="Took 800 ms" open-delay="800"><ray-button size="xs" variant="default">open-delay 800</ray-button></ray-tooltip>
  <ray-tooltip label="Stays 1 s after leaving" close-delay="1000"><ray-button size="xs" variant="default">close-delay 1000</ray-button></ray-tooltip>
  <ray-tooltip label="Never shown" id="demo-tip-off" disabled><ray-button size="xs" variant="default" id="demo-tip-toggle">disabled (click to enable)</ray-button></ray-tooltip>
</div>

<script type="module">
  // disabled: the tooltip stays quiet until enabled.
  const tip = document.getElementById("demo-tip-off");
  document.getElementById("demo-tip-toggle").addEventListener("click", () => {
    tip.disabled = !tip.disabled;
    tip.label = tip.disabled ? "Never shown" : "Enabled again";
    document.getElementById("demo-tip-toggle").textContent = tip.disabled ? "disabled (click to enable)" : "enabled (click to disable)";
  });
</script>
```
