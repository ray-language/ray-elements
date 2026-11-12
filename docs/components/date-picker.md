# Date picker

A date field with a calendar dropdown, and the calendar on its own. Keyboard grid navigation, min/max, locale-aware. Form-associated.

Import: `import "@raylang/elements/date-picker";` · Category: Inputs

## `<ray-date-picker>` (RayDatePicker, extends FieldControl)

Values are ISO dates ("2026-10-06"), submitted as such. ArrowDown on the field opens the calendar; Escape closes it. On a touch screen the trigger opens the system's picker instead (native).

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
- `native`: `auto` | `always` | `never`, default `auto`, reflects. Which picker the trigger opens: the system's (the native date input's, the usual one on a phone) or the calendar dropdown. auto: the system's on a touch screen (pointer: coarse), else the calendar. A date picked in the system's picker is the value like one picked in the calendar.
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
- `calendar`: The <ray-calendar> in the dropdown (its day, day-selected, day-today, day-outside, day-disabled, caption, nav and grid parts are exported).
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
- `fullWidth` (attribute `full-width`): boolean, reflects. Fills the width of its container: the columns share it and the days grow square, up to --ray-calendar-max-cell (default 1.5 times the size's cell), then wider than tall. Without it the calendar takes its size's width and shrinks when its container is narrower.
- `dayState` (property only): `((date: string) => string | null | undefined) | null`. Marks days: called with each day's ISO date on every render, it returns a state name (letters, digits, - and _; not selected, today, outside nor disabled, the calendar's own parts) or nothing. The day button gets data-state and the part day-<state>, so ::part(day-taken) (or ::part(day-missed)::after for a dot) styles it from outside. Call refresh() when what it marks changed but the month did not.

Events:

- `change`: A day was selected (read `value`).

Parts (`::part()`):

- `header`: The row with the month and the navigation buttons.
- `caption`: The month and year.
- `nav`: The previous/next month buttons.
- `grid`: The day grid (role=grid).
- `day`: Each day button (data-date="YYYY-MM-DD", [data-selected], [aria-current=date], [aria-disabled], [data-outside], and with dayState data-state plus the part day-<state>). ::part() takes no attribute selector, so what the day is comes as part tokens too: day-selected, day-today, day-outside, day-disabled, combinable with day-<state> (::part(day-taken day-selected)).
- `day-selected`: The selected day (also part day).
- `day-today`: Today (also part day).
- `day-outside`: A day of the month before or after (also part day).
- `day-disabled`: A day out of min/max (also part day).

Methods and properties:

- `refresh(): void`: Renders the month again: when what dayState marks changed but the text did not.
- `focusDay(): void`: Focuses the day the keyboard is on (the selected day, else today).
- `readonly focusedDate: string`: The day the keyboard is on (ISO).

Vue `v-model`: `value` (updated on change).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.17.1.

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
<div class="demo-caption" style="margin-top: 1.5rem">Full width: the days share the width of the container</div>
<ray-calendar full-width size="md" value="2026-10-15" class="demo-calendar-wide"></ray-calendar>
<script type="module">
  document.getElementById("demo-calendar").addEventListener("change", (e) => {
    document.getElementById("demo-calendar-out").textContent = `change: ${e.currentTarget.value}`;
  });
</script>
```
