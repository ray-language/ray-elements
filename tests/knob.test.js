// page: docs/components/all.html
//
// ray-knob in the real webview: the slider role and its text, drag (Shift
// finer), keys, wheel, double click, log and bipolar, forms, rtl.

const T = window.__rayTest;
await customElements.whenDefined("ray-knob");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const dial = (k) => k.shadowRoot.querySelector(".dial");
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));
const pointer = (el, type, y, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 3, clientX: 10, clientY: y, ...extra }));

T.test("knob: the slider role, its name and text; keys", async (T) => {
  const box = await mount(`<ray-knob label="Gain" min="-24" max="24" step="0.5" value="-6" unit=" dB" show-value></ray-knob>`);
  const k = box.firstElementChild;
  const d = dial(k);
  T.eq(d.getAttribute("role"), "slider");
  T.eq(d.getAttribute("aria-labelledby"), "label");
  T.eq(k.shadowRoot.querySelector("#label .label-text").textContent, "Gain");
  T.eq(getComputedStyle(k.shadowRoot.querySelector("#label .required")).display, "none", "the name is just the label");
  T.eq(d.getAttribute("aria-valuenow"), "-6");
  T.eq(d.getAttribute("aria-valuetext"), "-6 dB");
  T.eq(k.shadowRoot.querySelector(".value").textContent, "-6 dB");
  let inputs = 0, changes = 0;
  k.addEventListener("input", () => inputs++);
  k.addEventListener("change", () => changes++);
  key(d, "ArrowUp");
  T.eq(k.value, -5.5, "a step");
  key(d, "ArrowRight", { shiftKey: true });
  T.eq(k.value, -0.5, "Shift: ten steps");
  key(d, "PageDown");
  T.eq(k.value, -5.5, "Page Down: a tenth of the range");
  key(d, "End");
  T.eq(k.value, 24);
  key(d, "ArrowUp");
  T.eq(k.value, 24, "clamped");
  key(d, "Home");
  T.eq(k.value, -24);
  T.eq(inputs, 5, "input on every change of value");
  T.eq(changes, 6, "change on every key");
  box.remove();
});

T.test("knob: drag up and down, Shift finer, double click back, wheel", async (T) => {
  const box = await mount(`<ray-knob value="50"></ray-knob>`);
  const k = box.firstElementChild;
  const d = dial(k);
  let changes = 0;
  k.addEventListener("change", () => changes++);
  pointer(d, "pointerdown", 300);
  pointer(d, "pointermove", 200);
  T.eq(k.value, 100, "100px up: half the sweep (200px)");
  pointer(d, "pointermove", 260);
  T.eq(k.value, 70);
  pointer(d, "pointerup", 260);
  T.eq(changes, 1, "change at the end of the drag");
  pointer(d, "pointerdown", 300, { shiftKey: true });
  pointer(d, "pointermove", 200, { shiftKey: true });
  T.eq(k.value, 75, "Shift: ten times finer");
  pointer(d, "pointerup", 200);
  d.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  T.eq(k.value, 50, "a double click: back to the value attribute");
  d.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
  T.eq(k.value, 51, "the wheel up: a step");
  k.defaultValue = 10;
  d.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  T.eq(k.value, 10, "default-value wins");
  k.disabled = true;
  await T.settle();
  key(d, "ArrowUp");
  T.eq(k.value, 10, "disabled: no keys");
  T.eq(d.tabIndex, -1);
  T.eq(d.getAttribute("aria-disabled"), "true");
  box.remove();
});

T.test("knob: log scale, bipolar arc, format", async (T) => {
  const box = await mount(`<ray-knob scale="log" min="20" max="20000" value="632" step="0"></ray-knob>
    <ray-knob bipolar min="-50" max="50" value="0"></ray-knob>
    <ray-knob bipolar min="-50" max="50"></ray-knob>`);
  const [freq, pan, unset] = box.querySelectorAll("ray-knob");
  const angle = (k) => Number(k.shadowRoot.querySelector(".pointer").getAttribute("transform").match(/rotate\(([-\d.]+)/)[1]);
  T.ok(Math.abs(angle(freq)) < 1, `632 Hz is the middle of 20..20000 on a log scale (${angle(freq)}°)`);
  key(dial(freq), "ArrowUp");
  T.ok(freq.value > 632 * 1.06 && freq.value < 632 * 1.08, `a key moves a hundredth of the sweep (${freq.value})`);
  T.eq(angle(pan), 0, "pan 0 points up");
  T.eq(pan.shadowRoot.querySelector(".arc").getAttribute("d"), "", "no arc at the middle");
  key(dial(pan), "ArrowRight");
  T.ok(pan.shadowRoot.querySelector(".arc").getAttribute("d").length > 0, "the arc grows from the middle");
  T.eq(unset.value, 0, "bipolar without a value: the middle");
  pan.format = (v) => (v === 0 ? "C" : v < 0 ? `L${-v}` : `R${v}`);
  await T.settle();
  T.eq(dial(pan).getAttribute("aria-valuetext"), "R1");
  T.eq(pan.valueText, "R1");
  box.remove();
});

T.test("knob: form value, reset, aria-label, rtl keys", async (T) => {
  const box = await mount(`<form><ray-knob name="vol" value="70" aria-label="Volume"></ray-knob></form>
    <div dir="rtl"><ray-knob value="5"></ray-knob></div>`);
  const form = box.querySelector("form");
  const k = form.querySelector("ray-knob");
  T.eq(new FormData(form).get("vol"), "70");
  T.eq(dial(k).getAttribute("aria-label"), "Volume");
  key(dial(k), "ArrowUp");
  T.eq(new FormData(form).get("vol"), "71");
  form.reset();
  await T.settle();
  T.eq(k.value, 70, "reset to the value attribute");
  const r = box.querySelector("[dir=rtl] ray-knob");
  key(dial(r), "ArrowLeft");
  T.eq(r.value, 6, "rtl: ArrowLeft turns it up");
  box.remove();
});
