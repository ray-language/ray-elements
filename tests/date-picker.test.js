// page: tests/pages/date-picker.html
//
// ray-calendar (month grid, keyboard, min/max) and ray-date-picker (field,
// dropdown, form value, validity, clear).

const T = window.__rayTest;
await Promise.all(["ray-calendar", "ray-date-picker"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));
const days = (cal) => [...cal.shadowRoot.querySelectorAll(".day")];
const roving = (cal) => cal.shadowRoot.querySelector('.day[tabindex="0"]');

T.test("calendar: a known month — caption, first-day offset, 31 days, selection", async (T) => {
  const box = await mount(`<ray-calendar locale="en-US" first-day="1" value="2026-10-06"></ray-calendar>`);
  const cal = box.querySelector("ray-calendar");
  const sr = cal.shadowRoot;
  T.eq(sr.querySelector(".caption").textContent, "October 2026");
  const all = days(cal);
  T.eq(all.length, 42, "six weeks");
  T.eq(all[0].dataset.date, "2026-09-28", "Oct 1 2026 is a Thursday: the Monday before");
  T.eq(all.filter((d) => !d.hasAttribute("data-outside")).length, 31, "31 days in October");
  T.eq(sr.querySelector("th").textContent, "Mon", "weeks start on Monday");
  T.eq(sr.querySelector("table").getAttribute("role"), "grid");
  const sel = all.filter((d) => d.getAttribute("aria-selected") === "true");
  T.eq(sel.length, 1);
  T.eq(sel[0].dataset.date, "2026-10-06");
  T.eq(roving(cal).dataset.date, "2026-10-06", "roving tabindex on the selected day");
  T.eq(all.filter((d) => d.tabIndex === 0).length, 1, "one tab stop");
  cal.firstDay = 0;
  await T.settle();
  T.eq(days(cal)[0].dataset.date, "2026-09-27", "first-day=0 starts on Sunday");
  box.remove();
});

T.test("calendar: keyboard — days, weeks, week ends, months, years, Enter", async (T) => {
  const box = await mount(`<ray-calendar locale="en-US" first-day="1" value="2026-10-06"></ray-calendar>`);
  const cal = box.querySelector("ray-calendar");
  const at = () => roving(cal).dataset.date;
  const k = (name, extra) => key(roving(cal), name, extra);
  k("ArrowRight"); T.eq(at(), "2026-10-07");
  k("ArrowDown"); T.eq(at(), "2026-10-14");
  k("ArrowLeft"); T.eq(at(), "2026-10-13");
  k("ArrowUp"); T.eq(at(), "2026-10-06");
  k("Home"); T.eq(at(), "2026-10-05", "Monday");
  k("End"); T.eq(at(), "2026-10-11", "Sunday");
  k("PageDown"); T.eq(at(), "2026-11-11", "next month");
  T.eq(cal.shadowRoot.querySelector(".caption").textContent, "November 2026");
  k("PageUp", { shiftKey: true }); T.eq(at(), "2025-11-11", "previous year");
  const seen = [];
  cal.addEventListener("ray-change", (e) => seen.push(e.detail.value));
  let changes = 0;
  cal.addEventListener("change", () => changes++);
  k("Enter");
  T.eq(cal.value, "2025-11-11");
  T.eq(seen.join(), "2025-11-11", "ray-change with the value");
  T.eq(changes, 1, "change too");
  // Month boundaries clamp: Jan 31 + 1 month = Feb 28.
  cal.value = "2026-01-31";
  await T.settle();
  k("PageDown"); T.eq(at(), "2026-02-28");
  // The navigation buttons move the month.
  cal.shadowRoot.querySelector(".next").click();
  T.eq(cal.shadowRoot.querySelector(".caption").textContent, "March 2026");
  box.remove();
});

T.test("calendar: min/max disable days and block selection", async (T) => {
  const box = await mount(`<ray-calendar locale="en-US" first-day="1" value="2026-10-15" min="2026-10-05" max="2026-10-20"></ray-calendar>`);
  const cal = box.querySelector("ray-calendar");
  const byDate = (d) => cal.shadowRoot.querySelector(`.day[data-date="${d}"]`);
  T.eq(byDate("2026-10-04").getAttribute("aria-disabled"), "true", "before min");
  T.eq(byDate("2026-10-21").getAttribute("aria-disabled"), "true", "after max");
  T.eq(byDate("2026-10-05").hasAttribute("aria-disabled"), false, "min itself is selectable");
  let fired = 0;
  cal.addEventListener("ray-change", () => fired++);
  byDate("2026-10-04").click();
  T.eq(cal.value, "2026-10-15", "a disabled day is not selected");
  T.eq(fired, 0);
  byDate("2026-10-20").click();
  T.eq(cal.value, "2026-10-20");
  T.eq(fired, 1);
  box.remove();
});

T.test("date picker: display, form value, required, min, reset", async (T) => {
  const box = await mount(`<form><ray-date-picker name="when" label="When" locale="en-US" required min="2026-01-01"></ray-date-picker></form>`);
  const form = box.querySelector("form");
  const el = form.querySelector("ray-date-picker");
  const sr = el.shadowRoot;
  const trigger = sr.querySelector('[part="trigger"]');
  T.eq(sr.querySelector(".value").textContent, "Pick a date", "placeholder");
  T.ok(trigger.hasAttribute("data-placeholder"));
  T.eq(trigger.getAttribute("aria-labelledby"), "label value");
  T.eq(trigger.getAttribute("aria-haspopup"), "dialog");
  T.eq(form.checkValidity(), false, "required and empty");
  el.value = "2025-06-01";
  await T.settle();
  T.eq(form.checkValidity(), false, "before min: rangeUnderflow");
  T.eq(el.validity.rangeUnderflow, true);
  el.value = "2026-10-06";
  await T.settle();
  T.eq(form.checkValidity(), true);
  T.eq(new FormData(form).get("when"), "2026-10-06", "submitted as ISO");
  T.eq(sr.querySelector(".value").textContent, "Oct 6, 2026", "medium format");
  el.format = "long";
  await T.settle();
  T.eq(el.displayValue, "October 6, 2026");
  el.value = "not-a-date";
  await T.settle();
  T.eq(el.value, "", "an invalid date is dropped");
  form.reset();
  await T.settle();
  T.eq(el.value, "", "reset to the initial value");
  box.remove();
});

T.test("date picker: open, pick, Escape, clear", async (T) => {
  const box = await mount(`<ray-date-picker label="When" locale="en-US" first-day="1" value="2026-10-06" clearable></ray-date-picker><button id="out">out</button>`);
  const el = box.querySelector("ray-date-picker");
  const sr = el.shadowRoot;
  const trigger = sr.querySelector('[part="trigger"]');
  const panel = sr.querySelector('[part="dropdown"]');
  const cal = sr.querySelector("ray-calendar");
  const changes = [];
  el.addEventListener("change", () => changes.push(el.value));
  let leaked = 0;
  box.addEventListener("ray-change", () => leaked++);

  trigger.click();
  await T.settle();
  T.eq(panel.matches(":popover-open"), true, "click opens");
  T.eq(el.open, true);
  T.eq(trigger.getAttribute("aria-expanded"), "true");
  T.eq(panel.getAttribute("popover"), "manual");
  T.eq(cal.value, "2026-10-06", "the calendar shows the value");
  T.eq(roving(cal).dataset.date, "2026-10-06", "keyboard starts on the value");
  key(roving(cal), "ArrowRight");
  key(roving(cal), "Enter");
  await T.settle();
  T.eq(el.value, "2026-10-07", "picked");
  T.eq(changes.join(), "2026-10-07", "one change");
  T.eq(leaked, 0, "the calendar's ray-change stays inside");
  T.eq(el.open, false, "picking closes");
  T.eq(panel.matches(":popover-open"), false);

  key(trigger, "ArrowDown");
  await T.settle();
  T.eq(el.open, true, "ArrowDown opens");
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(el.open, false, "Escape closes");
  T.eq(el.value, "2026-10-07", "and keeps the value");

  trigger.click();
  await T.settle();
  box.querySelector("#out").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  await T.settle();
  T.eq(el.open, false, "an outside press closes");

  const clear = sr.querySelector('[part="clear"]');
  T.eq(clear.hidden, false, "clear button with a value");
  clear.click();
  await T.settle();
  T.eq(el.value, "");
  T.eq(changes.at(-1), "", "clearing fires change");
  T.eq(clear.hidden, true);
  T.eq(sr.querySelector(".value").textContent, "Pick a date");

  el.disabled = true;
  await T.settle();
  trigger.click();
  await T.settle();
  T.eq(el.open, false, "disabled does not open");
  box.remove();
});
