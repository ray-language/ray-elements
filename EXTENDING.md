# Extending ray-ds

Every ray-ds component is a class built on a few public base classes, and an
app can use the same ones. Three levels, from least to most code:

| Level | What | Gets |
|---|---|---|
| 0 — style | tokens, `::part()`, `Component.extendStyles()` | looks, custom variants |
| 1 — extend a component | `class X extends RayButton` | everything that component does |
| 2 — a new component on a base | `RayElement`, `FieldControl`, `Floating` | properties, form, ARIA, overlay… |

Working examples of levels 1 and 2 (written only against the public API) are
in [`examples/extending`](examples/extending), tested in the real webview by
`tests/extending.test.js`.

## The contract

Stable (public or protected): everything documented here and in
`ray-ds.d.ts`. Internal: any member of a ray-ds class whose name starts with
`_` or `#`. The core keeps its own state in `#private` fields, so a subclass
cannot break it by accident — but **do not name your own members with a
leading `_`**: component internals (`_el`, `_default`…) still use it.

### RayElement (core.js)

| Member | |
|---|---|
| `static properties` | `{ name: { type, reflect, attribute, default } }` → accessors, observed attributes, reflection |
| `static styles` / `static template` | constructable sheets / shadow markup (cloned per instance) |
| `static delegatesFocus` | focus goes to the first focusable inside |
| `static extendStyles(...sheets)` | adds CSS to the component and its subclasses, live instances included |
| `update(changed)` | **protected**: render; `changed` maps changed properties to their previous values |
| `commitProperty(name, value)` | **protected**: set a property without reflecting it (state the user changed) |
| `hasValue(name)` | **protected**: the property has its own value (not the default) |
| `requestUpdate()` | schedule `update` |
| `emit(type, detail, { cancelable })` | bubbling, composed CustomEvent |
| `$(selector)` | `shadowRoot.querySelector` |
| `paintIcons(root)` | **protected**: fill `[data-ray-icon="name"]` placeholders from the icon registry |

Call `super.connectedCallback()` / `super.disconnectedCallback()` when you
override them.

### FormControl and FieldControl (form.js)

`FormControl` = `RayElement` + ElementInternals: `form`, `validity`,
`checkValidity()`, `reportValidity()`, `effectivelyDisabled` (own attribute
or a disabled `<fieldset>`), `forward(event)` (re-dispatch a non-composed
event such as `change` from the host).

`FieldControl` = a FormControl around **one native control** with
`id="control"` in its template:

| Member | |
|---|---|
| `static fieldProperties` | spread into `properties`: name, label, description, error, required, disabled, size, radius, variant |
| `fieldTemplate(controlHtml, { sections })` | label + description + box + error markup around your control |
| `fieldStyles`, `boxStyles`, `sizeStyles`, `radiusStyles` | the shared look |
| `control` | the native control |
| `wire()` | **protected hook**: attach listeners once |
| `syncField()` | **protected**: label, description, error, required, disabled and their ARIA; call it from `update` |
| `syncValidity()` | **protected**: mirror the control's validity into the form |

You still call `this.internals.setFormValue(…)` and implement
`formResetCallback()`. See `examples/extending/components/color-field`.

### Floating (floating.js)

A trigger (slot `trigger` by default) and a `[popover]` panel (`.panel` in
your template) in the top layer, placed with flip and shift.

| Member | |
|---|---|
| `static popoverMode` | `"manual"` (default: Floating closes it — Escape, outside press, one open at a time — and animates the exit) or `"auto"` (the browser's light dismiss, no exit animation) |
| `static lightDismiss` | `false` for panels that must not close on Escape/outside press (tooltips) |
| `exitKeyframes()` | **protected hook**: the keyframes the panel leaves with |
| `static haspopup` / `popupKind()` | `aria-haspopup` of the trigger (`null`: none) |
| `static triggerSlot` | selector of the trigger slot |
| `open`, `placement`, `offset`, `show()`, `hide()`, `toggle()` | |
| `wireTrigger(trigger)` | **protected hook**: your trigger listeners |
| `anchorRect()`, `placeOptions()` | **protected**: what to anchor to, extra `place()` options |
| `toggled(open)` | **protected hook**: after opening/closing |
| `focusWasInside`, `justClosed()` | focus return, light-dismiss vs. trigger click |

See `examples/extending/components/hover-card`.

### Helpers

`css`, `define`, `uid`, `applyColor(el, color)` + `variantStyles` (the
filled/light/outline/subtle/default variants on `[data-variant]`),
`loaderStyles`, `srOnlyStyles`, `place()`, `autoUpdate()`, `tabbables()`,
`focusFirst()`, `setIcons()` / `getIcon()`, `configure()`.

**Motion** (`core/motion.js`): `play(el, keyframes, { speed, ease })` runs an
animation with the duration/easing tokens and resolves when it ends — at
once with reduced motion, a zero duration or a hidden page — so a component
can hide an element only after its exit (`await play(...).finished; el.hidden
= true`). `collapseOut(el)` folds an element away; `POP_OUT` is the exit of
floating panels. RayDialog (and so RayDrawer) has an `exitKeyframes()` hook too.
**Light dismiss** (`core/dismiss.js`): `dismissable({ panel, owner, trigger,
close })` gives a manual popover Escape and outside-press closing, nested
panels included. **Shortcuts** (`core/hotkey.js`): `matchesHotkey(e, "mod+k")`,
`formatHotkey("mod+k")` (⌘K / Ctrl K).

## Level 0: styling without a new component

```js
import { RayButton, css } from "@ray-ds/elements";

// A custom variant: <ray-button variant="brand">
RayButton.extendStyles(css`
  [data-variant="brand"] { background: #7c3aed; color: white; }
  [data-interactive]:not([data-disabled])[data-variant="brand"]:hover { background: #6d28d9; }
`);
```

From a plain stylesheet, `::part()` works too:
`ray-button[variant="brand"]::part(button) { … }`.

App-wide defaults for properties left unset:

```js
import { configure } from "@ray-ds/elements";
configure({ defaults: { "ray-button": { variant: "light", size: "md" } } });
```

## Level 1: extend a component

```js
import { RayButton, css, define } from "@ray-ds/elements";

export class AppSaveButton extends RayButton {
  static properties = { ...RayButton.properties, dirty: { type: Boolean, reflect: true } };
  static styles = [...RayButton.styles, css`:host([dirty]) { … }`];
  update(changed) {
    super.update(changed);   // everything ray-button does
    // …your additions
  }
}
define("app-save-button", AppSaveButton);
```

## Types, manifest and React/Vue wrappers for your components

Describe each component in a `component.toml` (same format as ray-ds's, any
`category`, `extends` naming its parent class) next to its JS, then:

```sh
ray run tools/src/main.ray wrap --components ../my-app/src/components --out ../my-app/src/ray-wrappers
```

It writes `index.js` (registers your components, re-exports ray-ds),
`index.d.ts` (classes extending ray-ds's, `HTMLElementTagNameMap`),
`react.js`/`react.d.ts` and `vue.js`/`vue.d.ts` (made with `createComponent`
from `@ray-ds/react` / `@ray-ds/vue`, inheriting the parent's props: an
`extends = "FieldControl"` component gets `label`, `required`… typed) and
`custom-elements.json`. To wrap a component by hand instead:

```js
import { createComponent } from "@ray-ds/react";
export const AppSaveButton = createComponent("app-save-button", {
  properties: ["dirty", "variant"], events: { onRaySelect: "ray-select" },
});
```
