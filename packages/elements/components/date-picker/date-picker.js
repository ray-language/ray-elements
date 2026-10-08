// <ray-calendar>: a month grid to pick a day (WAI-ARIA grid pattern: roving
// tabindex, arrows by day and week, Home/End, PageUp/PageDown by month,
// Shift+PageUp/PageDown by year, Enter/Space to select).
//
// <ray-date-picker>: a form field showing the chosen date, with a calendar in
// a dropdown. A hidden native <input type="date"> (#control) stays the model:
// value, required, min/max validity and form participation work like a native
// one. The dropdown is a manual [popover] (top layer) with light dismiss
// (core/dismiss.js) and an exit animation (core/motion.js).
//
// Dates are ISO strings ("2026-10-06") handled as plain calendar days (UTC
// arithmetic), so no time zone shifts a day.

import { RayElement, css, define } from "../../core/core.js";
import { sizeStyles, radiusStyles } from "../../core/styles.js";
import { place, autoUpdate } from "../../core/position.js";
import { dismissable } from "../../core/dismiss.js";
import { play, POP_OUT } from "../../core/motion.js";
import { FieldControl, fieldStyles, boxStyles, fieldTemplate } from "../../core/form.js";

// --- plain calendar days ------------------------------------------------------

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-10-06" -> a UTC Date at midnight, or null. */
function parse(iso) {
  const m = ISO.exec(String(iso ?? ""));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

/** A UTC Date -> "2026-10-06". */
function iso(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** Same day `n` months later, clamped to the month's last day (Jan 31 + 1 = Feb 28). */
function addMonths(d, n) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
}

function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function localeOf(el) {
  return el.locale || el.closest("[lang]")?.getAttribute("lang") || navigator.language || "en";
}

/** The first day of the week for a locale (0 = Sunday … 6 = Saturday). */
function firstDayOf(locale) {
  try {
    const loc = new Intl.Locale(locale);
    const info = typeof loc.getWeekInfo === "function" ? loc.getWeekInfo() : loc.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch {
    // An invalid locale tag: fall back below.
  }
  return 1;
}

// --- ray-calendar ---------------------------------------------------------------

const calendarStyles = css`
  :host {
    display: inline-block;
    width: fit-content;
    --_cell: var(--_h);
    font-size: var(--_fs);
    color: var(--ray-foreground);
  }
  .header { display: flex; align-items: center; justify-content: space-between; gap: var(--ray-space-2); margin-bottom: var(--ray-space-2); }
  .caption { flex: 1; text-align: center; font-weight: var(--ray-font-weight-medium); white-space: nowrap; }
  .nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--_cell) * 0.85);
    height: calc(var(--_cell) * 0.85);
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .nav:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .nav svg { width: 1em; height: 1em; }
  table { border-collapse: collapse; }
  th {
    width: var(--_cell);
    height: calc(var(--_cell) * 0.8);
    padding: 0;
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-normal, 400);
    color: var(--ray-muted-foreground);
  }
  td { padding: 1px; text-align: center; }
  .day {
    width: var(--_cell);
    height: var(--_cell);
    padding: 0;
    font: inherit;
    color: inherit;
    font-variant-numeric: tabular-nums;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .day:hover:not([aria-disabled="true"]) { background: var(--ray-accent); color: var(--ray-accent-foreground); }
  .day[data-outside] { color: var(--ray-muted-foreground); }
  .day[aria-current="date"] { background: var(--ray-accent); font-weight: var(--ray-font-weight-semibold); }
  .day[aria-selected="true"],
  .day[aria-selected="true"]:hover {
    color: var(--ray-primary-foreground);
    background: var(--ray-primary);
    font-weight: var(--ray-font-weight-semibold);
  }
  .day[aria-disabled="true"] { opacity: 0.35; cursor: not-allowed; }
  .day:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 1px; }
`;

export class RayCalendar extends RayElement {
  static properties = {
    value: { type: String },
    min: { type: String },
    max: { type: String },
    locale: { type: String },
    firstDay: { type: Number },
    size: { type: String, reflect: true, default: "sm" },
  };
  static styles = [sizeStyles, calendarStyles];
  static template = `
    <div class="header" part="header">
      <button class="nav prev focus-ring" part="nav" type="button" data-ray-icon="chevron-left"></button>
      <div class="caption" part="caption" id="caption" aria-live="polite"></div>
      <button class="nav next focus-ring" part="nav" type="button" data-ray-icon="chevron-right"></button>
    </div>
    <table role="grid" aria-labelledby="caption" part="grid"><thead><tr></tr></thead><tbody></tbody></table>`;

  /** The day the keyboard focus is on (roving tabindex). */
  #focus = null;

  constructor() {
    super();
    this.$(".prev").addEventListener("click", () => this._moveFocus(addMonths(this._focusDate(), -1), false));
    this.$(".next").addEventListener("click", () => this._moveFocus(addMonths(this._focusDate(), 1), false));
    const body = this.$("tbody");
    body.addEventListener("click", (e) => {
      const b = e.target.closest?.(".day");
      if (b) this._select(b.dataset.date);
    });
    body.addEventListener("keydown", (e) => this._onKey(e));
  }

  update(changed) {
    if (changed.has("value") || !this.#focus) {
      const v = parse(this.value);
      if (v) this.#focus = v;
    }
    this._render();
  }

  /** Focuses the day the keyboard is on (the selected day, else today). */
  focusDay() {
    this._render();
    this.$('.day[tabindex="0"]')?.focus();
  }

  /** The day the keyboard is on, as ISO. */
  get focusedDate() {
    return iso(this._focusDate());
  }

  _focusDate() {
    return this.#focus ?? parse(this.value) ?? today();
  }

  _disabled(d) {
    const min = parse(this.min);
    const max = parse(this.max);
    return Boolean((min && d < min) || (max && d > max));
  }

  _render() {
    const locale = localeOf(this);
    const focus = this._focusDate();
    const year = focus.getUTCFullYear();
    const month = focus.getUTCMonth();
    const first = this.firstDay ?? firstDayOf(locale);
    this.$(".caption").textContent = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(focus);
    const monthName = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
    this.$(".prev").setAttribute("aria-label", `Previous month, ${monthName.format(addMonths(focus, -1))}`);
    this.$(".next").setAttribute("aria-label", `Next month, ${monthName.format(addMonths(focus, 1))}`);

    // Weekday headers: 2023-01-01 was a Sunday.
    const short = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    const head = this.$("thead tr");
    head.replaceChildren();
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(2023, 0, 1 + ((first + i) % 7)));
      const th = document.createElement("th");
      th.scope = "col";
      th.abbr = long.format(d);
      th.textContent = short.format(d);
      head.append(th);
    }

    // Six weeks, starting on the first day of the week on or before the 1st.
    const start = new Date(Date.UTC(year, month, 1));
    const offset = (start.getUTCDay() - first + 7) % 7;
    let day = addDays(start, -offset);
    const label = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" });
    const selected = this.value && parse(this.value) ? this.value : "";
    const now = iso(today());
    const focusIso = iso(focus);
    const body = this.$("tbody");
    body.replaceChildren();
    for (let w = 0; w < 6; w++) {
      const tr = document.createElement("tr");
      for (let i = 0; i < 7; i++) {
        const id = iso(day);
        const td = document.createElement("td");
        td.setAttribute("role", "gridcell");
        const b = document.createElement("button");
        b.type = "button";
        b.className = "day";
        b.setAttribute("part", "day");
        b.dataset.date = id;
        b.textContent = String(day.getUTCDate());
        b.setAttribute("aria-label", label.format(day));
        b.tabIndex = id === focusIso ? 0 : -1;
        if (day.getUTCMonth() !== month) b.toggleAttribute("data-outside", true);
        if (id === now) b.setAttribute("aria-current", "date");
        const sel = id === selected;
        b.setAttribute("aria-selected", String(sel));
        td.setAttribute("aria-selected", String(sel));
        if (this._disabled(day)) b.setAttribute("aria-disabled", "true");
        td.append(b);
        tr.append(td);
        day = addDays(day, 1);
      }
      body.append(tr);
    }
  }

  _moveFocus(d, focus = true) {
    this.#focus = d;
    this._render();
    if (focus) this.$('.day[tabindex="0"]')?.focus();
  }

  _onKey(e) {
    const d = this._focusDate();
    const first = this.firstDay ?? firstDayOf(localeOf(this));
    let next = null;
    switch (e.key) {
      case "ArrowLeft": next = addDays(d, -1); break;
      case "ArrowRight": next = addDays(d, 1); break;
      case "ArrowUp": next = addDays(d, -7); break;
      case "ArrowDown": next = addDays(d, 7); break;
      case "Home": next = addDays(d, -((d.getUTCDay() - first + 7) % 7)); break;
      case "End": next = addDays(d, 6 - ((d.getUTCDay() - first + 7) % 7)); break;
      case "PageUp": next = addMonths(d, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(d, e.shiftKey ? 12 : 1); break;
      case "Enter":
      case " ":
        e.preventDefault();
        this._select(iso(d));
        return;
      default:
        return;
    }
    e.preventDefault();
    this._moveFocus(next);
  }

  _select(id) {
    const d = parse(id);
    if (!d || this._disabled(d)) return;
    this.#focus = d;
    const changed = this.value !== id;
    this.commitProperty("value", id);
    this._render();
    this.$('.day[tabindex="0"]')?.focus();
    if (!changed) return;
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

define("ray-calendar", RayCalendar);

// --- ray-date-picker ------------------------------------------------------------

const pickerStyles = css`
  .native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    width: 100%;
    min-width: 0;
    text-align: left;
    color: inherit;
    background: transparent;
    border: 0;
    cursor: pointer;
  }
  .trigger:disabled { cursor: not-allowed; }
  .trigger:focus-visible { outline: none; }
  .icon { display: inline-flex; color: var(--ray-muted-foreground); }
  .icon svg { width: 1.1em; height: 1.1em; }
  .value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trigger[data-placeholder] .value { color: var(--ray-muted-foreground); }
  .clear {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: calc(var(--_h) * 0.6);
    height: calc(var(--_h) * 0.6);
    margin-right: calc(var(--_px) * 0.4);
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .clear:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .clear svg { width: 0.9em; height: 0.9em; }
  .clear[hidden] { display: none; }
  .panel {
    box-sizing: border-box;
    margin: 0;
    padding: var(--ray-space-3);
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-md);
    box-shadow: var(--ray-shadow-md);
  }
  .panel:popover-open { animation: ray-pop-in var(--ray-duration-fast) var(--ray-easing-out); }
  @keyframes ray-pop-in { from { opacity: 0; transform: translateY(-2px); } }
`;

export class RayDatePicker extends FieldControl {
  static properties = {
    ...FieldControl.fieldProperties,
    value: { type: String },
    min: { type: String },
    max: { type: String },
    placeholder: { type: String, default: "Pick a date" },
    format: { type: String, default: "medium" },
    locale: { type: String },
    firstDay: { type: Number },
    clearable: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
  };
  static styles = [sizeStyles, radiusStyles, fieldStyles, boxStyles, pickerStyles];
  static template = fieldTemplate(
    `<input id="control" class="native" part="input" type="date" tabindex="-1" aria-hidden="true">` +
      `<button type="button" id="trigger" class="control trigger" part="trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="panel">` +
      `<span class="icon" aria-hidden="true" data-ray-icon="calendar"></span><span class="value" id="value"></span></button>` +
      `<button type="button" class="clear focus-ring" part="clear" aria-label="Clear date" hidden><span data-ray-icon="close" aria-hidden="true"></span></button>`,
    { sections: false },
  ) + `<div class="panel" id="panel" part="dropdown" popover="manual" role="dialog" aria-label="Choose a date"><ray-calendar part="calendar" exportparts="day, caption, nav, grid"></ray-calendar></div>`;

  #undismiss = null;
  #exit = null;
  #stopTracking = null;

  constructor() {
    super();
    /** The button that shows the date and opens the calendar. */
    this.trigger = this.$("#trigger");
    /** The dropdown ([popover]) holding the calendar. */
    this.panel = this.$("#panel");
    /** The <ray-calendar> in the dropdown. */
    this.calendar = this.$("ray-calendar");
  }

  wire() {
    const label = this.$("label.label");
    label.id = "label";
    label.htmlFor = "trigger";
    this.trigger.addEventListener("click", () => this.toggle());
    this.trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && !this.open) {
        e.preventDefault();
        this.toggle(true);
      }
    });
    this.$(".clear").addEventListener("click", () => {
      this._set("");
      this.trigger.focus();
    });
    this.calendar.addEventListener("change", (e) => {
      // The picker reports its own change: keep the calendar's inside.
      e.stopPropagation();
      this._set(this.calendar.value);
      this.open = false;
      this.trigger.focus();
    });
    this.panel.addEventListener("toggle", (e) => this._onToggle(e.newState === "open"));
    this._default = this.getAttribute("value") ?? "";
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopTracking?.();
    this.#stopTracking = null;
    this.#undismiss?.();
    this.#undismiss = null;
  }

  update(changed) {
    const c = this.control;
    c.min = this.min ?? "";
    c.max = this.max ?? "";
    const v = this.value ?? "";
    if (c.value !== v) c.value = v;
    // An invalid ISO string leaves the native input empty: mirror that.
    if (this.value && c.value !== this.value) this.commitProperty("value", c.value);
    const cal = this.calendar;
    cal.value = c.value;
    cal.min = this.min;
    cal.max = this.max;
    cal.locale = this.locale;
    cal.firstDay = this.firstDay;
    cal.size = this.size === "xs" ? "xs" : this.size === "lg" || this.size === "xl" ? "md" : "sm";
    this.syncField();
    this._commit();
    this._paint();
    if (changed.has("open")) this._setOpen(Boolean(this.open));
  }

  /** Label, description, error and ARIA go to the button the user operates. */
  syncField() {
    super.syncField();
    const c = this.control;
    const t = this.trigger;
    for (const a of ["aria-describedby", "aria-invalid", "aria-label"]) {
      if (c.hasAttribute(a)) t.setAttribute(a, c.getAttribute(a));
      else t.removeAttribute(a);
    }
    c.removeAttribute("aria-label");
    if (this.label) t.setAttribute("aria-labelledby", "label value");
    else t.removeAttribute("aria-labelledby");
    t.disabled = this.effectivelyDisabled;
    if (t.disabled && this.open) this.open = false;
  }

  /** Validity of the model, anchored on the visible button. */
  syncValidity() {
    const c = this.control;
    if (c.validity.valid) this.internals.setValidity({});
    else this.internals.setValidity(c.validity, c.validationMessage, this.trigger ?? c);
  }

  /** The chosen date formatted for display ("" when none). */
  get displayValue() {
    const d = parse(this.control.value);
    if (!d) return "";
    const style = ["short", "medium", "long", "full"].includes(this.format) ? this.format : "medium";
    return new Intl.DateTimeFormat(localeOf(this), { dateStyle: style, timeZone: "UTC" }).format(d);
  }

  _paint() {
    const shown = this.displayValue;
    this.$(".value").textContent = shown || (this.placeholder ?? "");
    this.trigger.toggleAttribute("data-placeholder", !shown);
    this.$(".clear").hidden = !this.clearable || !shown || this.effectivelyDisabled;
  }

  _commit() {
    this.internals.setFormValue(this.control.value || null);
    this.syncValidity();
  }

  // A change made by the user: the model, then input + change.
  _set(v) {
    if (this.control.value === v) return;
    this.control.value = v;
    this.commitProperty("value", this.control.value);
    this._commit();
    this._paint();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /** Opens or closes the calendar. */
  toggle(force) {
    if (this.trigger.disabled) return;
    this.open = force ?? !this.open;
  }

  _setOpen(open) {
    const p = this.panel;
    if (!this.isConnected) return;
    const shown = p.matches(":popover-open");
    if (open) {
      // Reopened while animating out: stay open.
      this.#exit?.cancel();
      this.#exit = null;
      p.style.pointerEvents = "";
      if (!shown) {
        try {
          p.showPopover();
        } catch {
          this.commitProperty("open", false);
          return;
        }
      }
      this.#undismiss ??= dismissable({
        panel: p,
        owner: this,
        trigger: this.trigger,
        close: (reason) => {
          this.open = false;
          if (reason === "escape") this.trigger.focus();
        },
      });
    } else if (shown && !this.#exit) {
      this._leave();
    }
  }

  // Animate the dropdown out, then really hide it (unless reopened).
  async _leave() {
    const p = this.panel;
    this.#undismiss?.();
    this.#undismiss = null;
    this.trigger.setAttribute("aria-expanded", "false");
    const exit = play(p, POP_OUT, { speed: "fast" });
    this.#exit = exit;
    p.style.pointerEvents = "none";
    await exit.finished;
    p.style.pointerEvents = "";
    if (this.#exit !== exit) return;
    this.#exit = null;
    if (!this.open && p.matches(":popover-open")) p.hidePopover();
    exit.cancel();
  }

  _onToggle(open) {
    this.trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      const box = this.$(".box");
      const update = () => place(box.getBoundingClientRect(), this.panel, { placement: "bottom-start", offset: 4 });
      update();
      this.#stopTracking?.();
      this.#stopTracking = autoUpdate(box, this.panel, update);
      this.calendar.value = this.control.value;
      this.calendar.focusDay();
    } else {
      this.#stopTracking?.();
      this.#stopTracking = null;
    }
    if (Boolean(this.open) !== open) this.commitProperty("open", open);
    this.emit(open ? "ray-open" : "ray-close");
  }

  formResetCallback() {
    this.value = this._default;
  }

  formStateRestoreCallback(state) {
    this.value = String(state ?? "");
  }
}

define("ray-date-picker", RayDatePicker);
