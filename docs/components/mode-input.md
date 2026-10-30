# Mode input

A text field with a menu of modes on one side: choosing a mode applies its attributes to the field (type, placeholder, inputmode, pattern…), so one control says what a value is and the value — a file path or text, an amount in € or $, a search by name or ID. Everything else is ray-input.

Import: `import "@raylang/elements/mode-input";` · Category: Inputs

## `<ray-mode-input>` (RayModeInput, extends RayInput)

Declare the modes as <option> children (label, data-icon, data-hint, data-description, disabled, and data-set-<attribute> for each attribute the mode sets on the field) or with the options property. A mode's attributes replace the field's own while it is chosen and give them back after. The menu is a ray-menu of radio items in the field's shadow root; Alt+ArrowDown opens it from the field, and the trigger keeps the caret in the field.

Properties:

- `mode`: string, reflects. The chosen mode's value (default: the first). Setting it applies that mode without ray-mode-change.
- `options` (property only): `ModeOption[]`. The modes; when not set, the <option> children.
- `display`: `label` | `icon` | `both`, reflects. What the trigger shows: the mode's hint or label, its icon, or both. Default: the icon when the mode has one, else the label.
- `position`: `start` | `end`, default `start`, reflects. The side of the field the trigger sits on.
- `menuLabel` (attribute `menu-label`): string, default `Mode`. The trigger's accessible name, read with the current mode ("Mode: File").
- `nativeMenu` (attribute `native-menu`): boolean, reflects. With a native host (a std/ui window with the bridge), the system's menu (no descriptions there).

Also the properties of RayInput (`<ray-input>`): `value`, `type`, `name`, `label`, `description`, `descriptionPosition`, `error`, `placeholder`, `required`, `disabled`, `readonly`, `size`, `radius`, `variant`, `highlight`, `complete`, `suggestionsLabel`.

Events:

- `ray-mode-change` (detail `{ mode: string; previous: string | null; option: ModeOption }`): The user chose a mode (mode is already the new one); cancelable: preventDefault keeps the previous mode.

Parts (`::part()`):

- `trigger`: The button that opens the menu.
- `trigger-icon`: The current mode's icon in the trigger.
- `trigger-label`: The current mode's hint or label in the trigger.
- `menu`: The ray-menu of modes.

Methods and properties:

- `readonly modes: ModeOption[]`: The modes in use.
- `readonly currentOption: ModeOption | null`: The chosen mode.
- `choose(value: string): void`: Chooses a mode as the user would (fires ray-mode-change).

Types:

- `{ value: string; label: string; icon?: string; hint?: string; description?: string; disabled?: boolean; attrs?: Record<string, string> }`: A mode of ray-mode-input: hint is the trigger's short text ("€"), attrs the attributes it sets on the field.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-stack" style="max-width: 28rem">
  <ray-mode-input id="demo-mode-part" label="Form part" mode="text" display="both" placeholder="Value">
    <option value="text" label="Text" data-description="Sent as it is typed"></option>
    <option value="file" label="File" data-icon="file" data-description="The contents of a file on disk" data-set-placeholder="Path to a file" data-set-spellcheck="false"></option>
  </ray-mode-input>
  <ray-mode-input label="Amount" mode="eur" display="label" inputmode="decimal" placeholder="0.00">
    <option value="eur" label="Euro" data-hint="€" data-set-pattern="\d+([.,]\d{1,2})?"></option>
    <option value="usd" label="US dollar" data-hint="$" data-set-pattern="\d+(\.\d{1,2})?"></option>
    <option value="btc" label="Bitcoin" data-hint="₿" data-set-pattern="\d+(\.\d{1,8})?" data-set-placeholder="0.00000000"></option>
  </ray-mode-input>
  <ray-mode-input id="demo-mode-search" label="Find" position="end" display="label" placeholder="Name">
    <option value="name" label="Name" data-set-placeholder="Name"></option>
    <option value="id" label="ID" data-set-placeholder="Numeric ID" data-set-inputmode="numeric"></option>
    <option value="regex" label="Regex" data-set-placeholder="Pattern, e.g. ^ray" data-set-spellcheck="false"></option>
  </ray-mode-input>
  <span class="demo-muted" id="demo-mode-out">Alt+↓ opens the menu from the field.</span>
</div>

<script type="module">
  const out = document.getElementById("demo-mode-out");
  for (const el of document.querySelectorAll("#demo-mode-part, #demo-mode-search")) {
    el.addEventListener("ray-mode-change", (e) => {
      out.textContent = `${el.label}: ${e.detail.previous} → ${e.detail.mode}`;
    });
  }
</script>
```
