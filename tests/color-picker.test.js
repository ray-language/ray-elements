// page: tests/pages/color-picker.html
//
// <ray-color-picker> and <ray-color-input>: parsing and formatting, the
// keyboard, swatches, events, the text field, the dropdown and forms.

const T = window.__rayTest;
await customElements.whenDefined("ray-color-picker");
await customElements.whenDefined("ray-color-input");
const { parseColorValue, formatColor } = await import("../../src/components/color-picker/color-picker.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const key = (el, k, opts = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts }));

T.test("color: parse and format in every format", async (T) => {
  const c = parseColorValue("#7c3aed");
  T.eq(formatColor(c, "hex"), "#7c3aed");
  T.eq(formatColor(c, "rgb"), "rgb(124, 58, 237)");
  T.eq(formatColor(c, "hsl"), "hsl(262, 83%, 58%)");
  T.eq(formatColor({ ...c, a: 0.5 }, "rgba"), "rgba(124, 58, 237, 0.5)");
  T.eq(formatColor({ ...c, a: 0.5 }, "hexa"), "#7c3aed80");
  T.eq(formatColor(parseColorValue("#abc"), "hex"), "#aabbcc", "3 digits");
  T.eq(parseColorValue("fff").r, 1, "# optional");
  T.eq(parseColorValue("#11223380").a.toFixed(2), "0.50", "8 digits: alpha");
  T.eq(formatColor(parseColorValue("rgb(255 0 0 / 50%)"), "rgba"), "rgba(255, 0, 0, 0.5)", "space syntax with slash alpha");
  T.eq(formatColor(parseColorValue("hsla(120, 100%, 25%, 0.3)"), "rgba"), "rgba(0, 128, 0, 0.3)");
  T.eq(formatColor(parseColorValue("tomato"), "hex"), "#ff6347", "named colors");
  T.eq(parseColorValue("not a color"), null);
  T.eq(parseColorValue("rgb(1, 2)"), null, "too few channels");
});

T.test("color-picker: value, format, keyboard, events", async (T) => {
  const box = await mount(`<ray-color-picker value="hsl(0, 100%, 50%)" format="rgb"></ray-color-picker>`);
  const p = box.firstElementChild;
  T.eq(p.value, "rgb(255, 0, 0)", "a value is rewritten in format");
  T.eq(getComputedStyle(inner(p, ".alpha")).display, "none", "no alpha slider without an alpha format");
  const seen = [];
  p.addEventListener("input", () => seen.push("input"));
  p.addEventListener("change", () => seen.push("change:" + p.value));
  const hue = inner(p, ".hue");
  key(hue, "ArrowRight", { shiftKey: true });
  await T.settle();
  T.eq(hue.getAttribute("aria-valuenow"), "10", "Shift: 10 degrees");
  T.ok(/^input,change:rgb\(255, 4[23], 0\)$/.test(seen.join()), seen.join());
  const area = inner(p, ".area");
  key(area, "ArrowDown");
  await T.settle();
  T.eq(area.getAttribute("aria-valuetext"), "Saturation 100%, brightness 99%");
  p.format = "hexa";
  await T.settle();
  T.eq(getComputedStyle(inner(p, ".alpha")).display, "block", "alpha slider with hexa");
  key(inner(p, ".alpha"), "Home");
  await T.settle();
  T.ok(p.value.endsWith("00"), `transparent: ${p.value}`);
  box.remove();
});

T.test("color-picker: grays keep their hue; swatches; form value and reset", async (T) => {
  const box = await mount(`<form><ray-color-picker name="c" value="#ff0000" swatches="#000000, rgb(0, 128, 255), #808080"></ray-color-picker></form>`);
  const form = box.firstElementChild;
  const p = form.firstElementChild;
  const swatches = [...p.shadowRoot.querySelectorAll(".swatch")];
  T.eq(swatches.length, 3, "commas inside rgb() kept");
  swatches[0].click();
  await T.settle();
  T.eq(p.value, "#000000");
  T.eq(inner(p, ".hue").getAttribute("aria-valuenow"), "0", "black keeps the previous hue");
  T.eq(swatches[0].getAttribute("aria-pressed"), "true", "chosen swatch pressed");
  swatches[1].click();
  await T.settle();
  T.eq(new FormData(form).get("c"), "#0080ff", "submitted in format");
  form.reset();
  await T.settle();
  T.eq(p.value, "#ff0000", "reset restores the value attribute");
  box.remove();
});

T.test("color-input: typing, fix on blur, picker sync, required, reset", async (T) => {
  const box = await mount(`<form><ray-color-input name="c" label="Color" value="#7c3aed" required></ray-color-input></form>`);
  const form = box.firstElementChild;
  const el = form.firstElementChild;
  const field = inner(el, "input");
  const events = [];
  el.addEventListener("input", () => events.push("input"));
  el.addEventListener("change", () => events.push("change"));
  field.value = "rgb(0, 0, 255)";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await T.settle();
  T.eq(el.value, "#0000ff", "a valid color is the value at once, in format");
  T.eq(el.picker.value, "#0000ff", "the picker follows");
  field.value = "#00f!";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  T.eq(el.validity.valid, false, "invalid text: invalid while typing");
  field.dispatchEvent(new Event("change"));
  await T.settle();
  T.eq(field.value, "#0000ff", "leaving the field restores the value");
  T.ok(el.validity.valid, "valid again");
  T.eq(events.filter((e) => e === "change").length, 1, "one change for the new color");
  el.value = "";
  await T.settle();
  T.eq(el.validity.valueMissing, true, "required");
  el.value = "red";
  await T.settle();
  T.eq(el.value, "#ff0000", "a value set by code is rewritten in format");
  T.eq(new FormData(form).get("c"), "#ff0000");
  form.reset();
  await T.settle();
  T.eq(el.value, "#7c3aed", "reset");
  box.remove();
});

T.test("color-input: dropdown opens and closes, picker input reaches the field", async (T) => {
  const box = await mount(`<ray-color-input label="Color" value="#ff0000"></ray-color-input>`);
  const el = box.firstElementChild;
  inner(el, "input").click();
  await T.settle();
  T.eq(el.open, true, "click opens");
  T.ok(inner(el, "#panel").matches(":popover-open"));
  T.eq(inner(el, "input").getAttribute("aria-expanded"), "true");
  key(el.picker.shadowRoot.querySelector(".hue"), "End");
  await T.settle();
  T.eq(inner(el, "input").value, "#ff0000", "hue 360 is red again");
  key(el.picker.shadowRoot.querySelector(".area"), "ArrowLeft", { shiftKey: true });
  await T.settle();
  T.eq(el.value, inner(el, "input").value, "the field shows the picker's color");
  T.ok(el.value !== "#ff0000", `moved: ${el.value}`);
  el.open = false;
  await T.settle();
  T.eq(el.open, false);
  box.remove();
});
