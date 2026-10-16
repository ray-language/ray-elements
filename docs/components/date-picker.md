# Date picker

A date field with a calendar dropdown, and the calendar on its own. Keyboard grid navigation, min/max, locale-aware. Form-associated.

Import: `import "@raylang/elements/date-picker";` · Category: Inputs

## `<ray-date-picker>` (RayDatePicker, extends FieldControl)

Values are ISO dates ("2026-10-06"), submitted as such. ArrowDown on the field opens the calendar; Escape closes it.

Properties:

- `value`: string. The chosen date, ISO "YYYY-MM-DD" ("" for none). The value attribute is the initial value (restored on form reset).
- `min`: string. Earliest selectable date (ISO). Earlier days are disabled; an earlier value is invalid (rangeUnderflow).
- `max`: string. Latest selectable date (ISO).
- `placeholder`: string, default `Pick a date`. Shown while no date is chosen.
- `format`: `short` | `medium` | `long` | `full`, default `medium`. How the date is displayed (Intl dateStyle).
- `locale`: string. Locale for names and formats. Default: the nearest lang attribute, else the browser's.
- `firstDay` (attribute `first-day`): number. First day of the week, 0 (Sunday) to 6. Default: the locale's.
- `clearable`: boolean, reflects. Shows a button that clears the date.
- `open`: boolean, reflects. The calendar dropdown is shown.
- `name`: string, reflects. Form field name.
- `label`: string. Visible label (also the accessible name).
- `description`: string. Help text.
- `descriptionPosition` (attribute `description-position`): `above` | `below`, default `above`, reflects. The description before the control (help first) or after it, with the error (fields in a row stay aligned).
- `error`: string. Error text.
- `required`: boolean. Required for form submission.
- `disabled`: boolean. Not interactive nor submitted.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height and font size.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius.
- `variant`: `default` | `filled` | `unstyled`, default `default`, reflects. Box style.

Events:

- `input`: When the date changes (picked or cleared).
- `change`: When the date changes (picked or cleared).
- `ray-open`: The calendar opened.
- `ray-close`: The calendar closed.

Parts (`::part()`):

- `trigger`: The button showing the date.
- `clear`: The clear button.
- `dropdown`: The calendar panel (a popover in the top layer).
- `calendar`: The <ray-calendar> in the dropdown (its day, caption, nav and grid parts are exported).
- `input`: The hidden native <input type=date> that holds the value (the model).
- `wrapper`: The box.

Methods and properties:

- `toggle(force?: boolean): void`: Opens or closes the calendar.
- `readonly displayValue: string`: The chosen date as displayed ("" when none).

Vue `v-model`: `value` (updated on change).

## `<ray-calendar>` (RayCalendar, extends RayElement)

WAI-ARIA grid: arrows move by day and week, Home/End to the week's ends, PageUp/PageDown by month (with Shift, by year), Enter/Space select.

Properties:

- `value`: string. The selected date, ISO "YYYY-MM-DD".
- `min`: string. Earliest selectable date (ISO).
- `max`: string. Latest selectable date (ISO).
- `locale`: string. Locale for month and weekday names. Default: the nearest lang attribute, else the browser's.
- `firstDay` (attribute `first-day`): number. First day of the week, 0 (Sunday) to 6. Default: the locale's.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Day cell size and font size.

Events:

- `change`: A day was selected (read `value`).

Parts (`::part()`):

- `header`: The row with the month and the navigation buttons.
- `caption`: The month and year.
- `nav`: The previous/next month buttons.
- `grid`: The day grid (role=grid).
- `day`: Each day button ([aria-selected], [aria-current=date], [aria-disabled], [data-outside]).

Methods and properties:

- `focusDay(): void`: Focuses the day the keyboard is on (the selected day, else today).
- `readonly focusedDate: string`: The day the keyboard is on (ISO).

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-grid">
  <ray-date-picker label="Release date" description="When the update goes out." value="2026-10-06"></ray-date-picker>
  <ray-date-picker label="Deadline" placeholder="No deadline" min="2026-10-01" max="2026-12-31" format="long" clearable></ray-date-picker>
</div>
<div class="demo-row" style="margin-top: 1.5rem; align-items: flex-start">
  <ray-calendar id="demo-calendar" value="2026-10-15" min="2026-10-05"></ray-calendar>
  <span id="demo-calendar-out" style="color: var(--ray-muted-foreground); font-size: var(--ray-font-size-sm)">Pick a day.</span>
</div>
<script type="module">
  document.getElementById("demo-calendar").addEventListener("change", (e) => {
    document.getElementById("demo-calendar-out").textContent = `change: ${e.currentTarget.value}`;
  });
</script>
```
