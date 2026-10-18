// page: tests/pages/fields.html
//
// ray-checkbox-group, ray-number-input, ray-combobox.

const T = window.__rayTest;
await Promise.all(["ray-checkbox", "ray-checkbox-group", "ray-number-input", "ray-combobox"].map((t) => customElements.whenDefined(t)));
const { parseNumber, formatNumber, parseDuration, formatDuration, durationText } = await import("../../src/components/number-input/number-input.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}
const key = (el, k, opts = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...opts }));
const type = async (input, text) => { input.value = text; input.dispatchEvent(new Event("input", { bubbles: true, composed: true })); await T.settle(); };

T.test("checkbox-group: value from the markup, one form entry per value, its own change", async (T) => {
  const box = await mount(`<form><ray-checkbox-group name="ch" label="Channels" required value="email"><ray-checkbox value="email" label="Email" name="x"></ray-checkbox><ray-checkbox value="push" label="Push"></ray-checkbox><ray-checkbox value="sms" label="SMS"></ray-checkbox></ray-checkbox-group></form>`);
  const form = box.querySelector("form");
  const g = form.firstElementChild;
  const [email, push, sms] = g.checkboxes;
  T.eq(g.value.join(), "email");
  T.eq(email.checked, true);
  T.eq(email.hasAttribute("name"), false, "the group submits, not the checkbox");
  const changes = [];
  form.addEventListener("change", (e) => changes.push(e.target.localName));
  push.shadowRoot.querySelector("input").click();
  await T.settle();
  T.eq(g.value.join(), "email,push");
  T.eq(changes.join(), "ray-checkbox-group", "the checkbox's change is the group's");
  T.eq(new FormData(form).getAll("ch").join(), "email,push");
  g.value = [];
  await T.settle();
  T.eq(form.checkValidity(), false, "required: at least one");
  T.eq(g.validity.valueMissing, true);
  g.value = ["sms"];
  await T.settle();
  T.eq(sms.checked && !email.checked, true, "value drives the checkboxes");
  form.reset();
  await T.settle();
  T.eq(g.value.join(), "email", "reset to the markup value");
  box.remove();
});

T.test("checkbox-group: max disables the rest; disabled; own disabled kept", async (T) => {
  const box = await mount(`<ray-checkbox-group max="2" value="a,b" label="Pick"><ray-checkbox value="a"></ray-checkbox><ray-checkbox value="b"></ray-checkbox><ray-checkbox value="c"></ray-checkbox><ray-checkbox value="d" disabled></ray-checkbox></ray-checkbox-group>`);
  const g = box.firstElementChild;
  const [a, , c, d] = g.checkboxes;
  T.eq(c.disabled, true, "full: the unchecked ones are disabled");
  T.eq(g.shadowRoot.querySelector(".count").textContent, "2 / 2");
  a.shadowRoot.querySelector("input").click();
  await T.settle();
  T.eq(c.disabled, false, "room again");
  T.eq(d.disabled, true, "its own disabled stays");
  g.disabled = true;
  await T.settle();
  T.ok(g.checkboxes.every((x) => x.disabled), "the group disables all");
  g.disabled = false;
  await T.settle();
  T.eq(d.disabled, true);
  box.remove();
});

T.test("number-input: parse and format helpers", async (T) => {
  T.eq(parseNumber("$1,234.50", { thousands: "," }), 1234.5);
  T.eq(parseNumber("€ 1.234,5", { thousands: ".", decimal: "," }), 1234.5);
  T.eq(parseNumber("-4 °C"), -4);
  T.ok(Number.isNaN(parseNumber("abc")));
  T.eq(formatNumber(1234567.891, { decimals: 2, thousands: "," }), "1,234,567.89");
  T.eq(formatNumber(1234.5, { decimals: 2, thousands: ".", decimal: "," }), "1.234,50");
});

T.test("number-input: keys and buttons step, clamp, decimals, prefix/suffix, ARIA", async (T) => {
  const box = await mount(`<form><ray-number-input name="n" label="Price" value="9.5" min="0" max="10" step="0.5" prefix="$" decimals="2"></ray-number-input></form>`);
  const form = box.querySelector("form");
  const n = form.firstElementChild;
  const input = n.control;
  T.eq(input.value, "$9.50", "prefix and decimals");
  T.eq(input.getAttribute("role"), "spinbutton");
  T.eq(input.getAttribute("aria-valuenow"), "9.5");
  T.eq(input.getAttribute("aria-valuetext"), "$9.50");
  let changes = 0;
  n.addEventListener("change", () => changes++);
  key(input, "ArrowUp");
  await T.settle();
  T.eq(n.value, 10);
  key(input, "ArrowUp");
  await T.settle();
  T.eq(n.value, 10, "clamped at max");
  T.eq(changes, 1, "no change when nothing moved");
  T.eq(n.$(".up").disabled, true, "+ disabled at max");
  key(input, "Home");
  await T.settle();
  T.eq(n.value, 0, "Home: min");
  n.stepBy(3);
  await T.settle();
  T.eq(n.value, 1.5, "0.5 steps, no float drift");
  T.eq(new FormData(form).get("n"), "1.5", "the form gets plain digits");
  await type(input, "$7.25");
  T.eq(n.value, 7.25, "typed text is parsed");
  await type(input, "42");
  input.dispatchEvent(new Event("blur"));
  await T.settle();
  T.eq(n.value, 10, "clamped on blur");
  T.eq(input.value, "$10.00");
  await type(input, "");
  T.eq(n.value, undefined, "empty");
  T.eq(new FormData(form).get("n"), null);
  box.remove();
});

T.test("number-input: shift ×10, thousands, strict clamp, required", async (T) => {
  const box = await mount(`<ray-number-input value="1000" thousands-separator="," step="10"></ray-number-input><ray-number-input max="5" clamp="strict"></ray-number-input><ray-number-input required></ray-number-input>`);
  const [a, b, c] = box.children;
  T.eq(a.control.value, "1,000");
  key(a.control, "ArrowUp", { shiftKey: true });
  await T.settle();
  T.eq(a.value, 1100);
  T.eq(a.control.value, "1,100");
  await type(b.control, "9");
  T.eq(b.value, 5, "strict: clamped while typing");
  T.eq(c.validity.valueMissing, true);
  box.remove();
});

T.test("number-input: duration helpers", async (T) => {
  T.eq(formatDuration(180), "3:00");
  T.eq(formatDuration(5), "0:05");
  T.eq(formatDuration(3725), "1:02:05", "from an hour");
  T.eq(formatDuration(65, { hours: true }), "0:01:05");
  T.eq(formatDuration(-15), "-0:15");
  T.eq(formatDuration(NaN), "");
  T.eq(parseDuration("3:00"), 180);
  T.eq(parseDuration("1:02:05"), 3725);
  T.eq(parseDuration("150"), 150, "a plain number is seconds");
  T.eq(parseDuration("3:"), 180, "while typing");
  T.eq(parseDuration(" 2 : 30 "), 150);
  T.eq(parseDuration("-0:15"), -15);
  T.ok(Number.isNaN(parseDuration("")), "empty");
  T.ok(Number.isNaN(parseDuration("3 min")), "not a duration");
  T.eq(durationText(195, "en"), "3 minutes, 15 seconds");
  T.eq(durationText(180, "en"), "3 minutes");
  T.eq(durationText(0, "en"), "0 seconds");
  T.eq(durationText(3600, "es"), "1 hora");
});

T.test("number-input: format=duration shows m:ss, steps, types, submits seconds", async (T) => {
  const box = await mount(`<form lang="en"><ray-number-input name="round" format="duration" value="180" min="15" max="600" step="15" decimals="2"></ray-number-input><ray-number-input name="long" format="duration" value="60" max="7200"></ray-number-input></form>`);
  const form = box.querySelector("form");
  const [n, long] = form.children;
  const input = n.control;
  T.eq(input.value, "3:00", "m:ss (decimals do not apply)");
  T.eq(input.inputMode, "text", "a keyboard with \":\"");
  T.eq(input.getAttribute("aria-valuenow"), "180");
  T.eq(input.getAttribute("aria-valuetext"), "3 minutes");
  T.eq(long.control.value, "0:01:00", "h:mm:ss when max reaches an hour");
  key(input, "ArrowUp");
  await T.settle();
  T.eq(n.value, 195);
  T.eq(input.value, "3:15");
  T.eq(input.getAttribute("aria-valuetext"), "3 minutes, 15 seconds");
  T.eq(new FormData(form).get("round"), "195", "the form gets seconds");
  await type(input, "2:30");
  T.eq(n.value, 150, "typed m:ss");
  await type(input, "45");
  T.eq(n.value, 45, "typed seconds");
  input.dispatchEvent(new Event("blur"));
  await T.settle();
  T.eq(input.value, "0:45", "shown as m:ss on blur");
  n.clamp = "none";
  await type(input, "11:00");
  T.eq(n.validationMessage, "The maximum is 10:00.", "limits in m:ss");
  n.format = "number";
  await T.settle();
  T.eq(input.inputMode, "decimal", "back to a number");
  box.remove();
});

T.test("combobox: filters, picks with keys, shows the label, clearable", async (T) => {
  const box = await mount(`<form><ray-combobox name="c" label="Country" clearable><optgroup label="Europe"><option value="de">Germany</option><option value="es">Spain</option></optgroup><optgroup label="Asia"><option value="jp">Japan</option></optgroup></ray-combobox></form>`);
  const form = box.querySelector("form");
  const cb = form.firstElementChild;
  const input = cb.control;
  T.eq(input.getAttribute("role"), "combobox");
  await type(input, "pa");
  T.eq(cb.open, true, "typing opens it");
  const options = () => [...cb.shadowRoot.querySelectorAll(".option")];
  T.eq(options().map((o) => o.textContent).join(), "Spain,Japan", "filtered, case-insensitive");
  T.eq(cb.shadowRoot.querySelector(".group-label").textContent, "Europe", "groups kept");
  T.eq(input.getAttribute("aria-activedescendant"), options()[0].id, "the first match is active");
  key(input, "ArrowDown");
  key(input, "Enter");
  await T.settle();
  T.eq(cb.value, "jp");
  T.eq(input.value, "Japan", "the field shows the label");
  T.eq(cb.open, false);
  T.eq(new FormData(form).get("c"), "jp");
  cb.shadowRoot.querySelector(".clear").click();
  await T.settle();
  T.eq(cb.value, "");
  T.eq(input.value, "");
  box.remove();
});

T.test("combobox: multiple chips, max-values, Backspace, creatable, form entries", async (T) => {
  const box = await mount(`<form><ray-combobox name="t" multiple creatable max-values="3" value="a,b"><option value="a">Alpha</option><option value="b">Beta</option><option value="c">Gamma</option><option value="d">Delta</option></ray-combobox></form>`);
  const form = box.querySelector("form");
  const cb = form.firstElementChild;
  const input = cb.control;
  const chips = () => [...cb.shadowRoot.querySelectorAll(".chip .t")].map((c) => c.textContent).join();
  T.eq(chips(), "Alpha,Beta");
  T.eq(cb.listbox.getAttribute("aria-multiselectable"), "true");
  let created = "";
  cb.addEventListener("ray-create", (e) => { created = e.detail.value; });
  await type(input, "zeta");
  T.ok(cb.shadowRoot.querySelector(".option.create"), "+ Create");
  key(input, "Enter");
  await T.settle();
  T.eq(created, "zeta");
  T.eq(cb.value.join(), "a,b,zeta");
  T.eq(input.value, "", "the field clears after a pick");
  cb.open = true;
  await T.settle();
  const gamma = [...cb.shadowRoot.querySelectorAll(".option")].find((o) => o.textContent === "Gamma");
  T.eq(gamma.getAttribute("aria-disabled"), "true", "max-values reached");
  T.eq(new FormData(form).getAll("t").join(), "a,b,zeta");
  key(input, "Backspace");
  await T.settle();
  T.eq(cb.value.join(), "a,b", "Backspace removes the last chip");
  cb.shadowRoot.querySelector('.chip button[data-value="a"]').click();
  await T.settle();
  T.eq(cb.value.join(), "b", "a chip's × removes it");
  key(input, "Escape");
  box.remove();
});

T.test("combobox: data, limit, nothing found, required", async (T) => {
  const box = await mount(`<ray-combobox limit="3" required nothing-found="Nada"></ray-combobox>`);
  const cb = box.firstElementChild;
  cb.data = ["one", "two", "three", "four", { value: "5", label: "five", disabled: true }];
  await T.settle();
  T.eq(cb.validity.valueMissing, true);
  cb.open = true;
  await T.settle();
  T.eq(cb.shadowRoot.querySelectorAll(".option").length, 3, "limit");
  T.ok(cb.shadowRoot.querySelector(".more").textContent.startsWith("2 more"));
  await type(cb.control, "zzz");
  T.eq(cb.shadowRoot.querySelector(".empty").textContent, "Nada");
  await type(cb.control, "fiv");
  T.eq(cb.shadowRoot.querySelector(".option").getAttribute("aria-disabled"), "true");
  key(cb.control, "Enter");
  await T.settle();
  T.eq(cb.value ?? "", "", "a disabled option cannot be picked");
  key(cb.control, "Escape");
  box.remove();
});
