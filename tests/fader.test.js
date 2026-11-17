// page: docs/components/all.html
//
// A mixing desk's fader: ray-slider thumb="cap" plays as one (no jump on a
// click, a drag from where it is, Shift finer, the wheel, a double click to
// default-value), and taper="fader" spreads dB on a desk's curve, shared with
// ray-meter so a meter beside a fader lines up with its marks.

const T = window.__rayTest;
await Promise.all(["ray-slider", "ray-meter"].map((t) => customElements.whenDefined(t)));
const { taperPosition, taperValue } = await import("../../src/core/core.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const near = (a, b, d = 0.01) => Math.abs(a - b) < d;
const pointer = (el, type, x, y, extra = {}) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 7, clientX: x, clientY: y, ...extra }));
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));

T.test("taper: linear and fader positions, and their inverse", async (T) => {
  T.eq(taperPosition(50, 0, 100), 0.5);
  T.eq(taperPosition(-70, -60, 6, "fader"), 0, "below min: the bottom");
  T.eq(taperPosition(-Infinity, -60, 6, "fader"), 0, "silence");
  T.eq(taperPosition(9, -60, 6, "fader"), 1);
  T.ok(near(taperPosition(0, -60, 6, "fader"), 0.8135, 0.001), `0 dB at 81 % (${taperPosition(0, -60, 6, "fader")})`);
  T.ok(near(taperPosition(-12, -60, 6, "fader"), 0.5245, 0.001), "-12 at 52 %");
  T.ok(near(taperPosition(-24, -60, 6, "fader"), 0.32, 0.001), "-24 at 32 %");
  for (const db of [-60, -40, -12, 0, 6]) T.ok(near(taperValue(taperPosition(db, -60, 6, "fader"), -60, 6, "fader"), db, 1e-9), `inverse at ${db}`);
  T.eq(taperValue(2, 0, 10), 10, "clamped");
});

T.test("slider taper=fader: the track, the marks, the text and the form say dB", async (T) => {
  const box = await mount(`<form><ray-slider name="gain" orientation="vertical" taper="fader" min="-60" max="6" step="0.5" value="-12" unit=" dB" style="height: 200px"></ray-slider></form>`);
  const s = box.querySelector("ray-slider");
  const input = s.shadowRoot.querySelector("input");
  T.eq(s.value, -12);
  T.ok(near(parseFloat(input.style.getPropertyValue("--_pct")), 52.45, 0.05), `the fill at 52 % (${input.style.getPropertyValue("--_pct")})`);
  T.eq(input.getAttribute("aria-valuetext"), "-12 dB");
  T.eq(new FormData(box.querySelector("form")).get("gain"), "-12");
  s.marks = [0, -60];
  await T.settle();
  const [zero] = s.shadowRoot.querySelectorAll(".mark");
  T.ok(near(parseFloat(zero.style.getPropertyValue("--_at")), 81.35, 0.05), "the 0 dB mark on the curve");
  key(input, "Home");
  T.eq(s.value, -60);
  key(input, "End");
  T.eq(s.value, 6);
  key(input, "PageDown");
  T.ok(s.value < 6 && s.value > -6, `Page Down: a tenth of the travel (${s.value})`);
  s.value = 0;
  await T.settle();
  key(input, "ArrowDown");
  T.ok(s.value < 0 && s.value >= -1.5, `an arrow: a hundredth of the travel (${s.value})`);
  // A native drag (round thumb) moves positions: the value follows the curve.
  input.value = String(Math.round(taperPosition(-24, -60, 6, "fader") * 10000));
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  T.eq(s.value, -24, "a native position reads back as dB, on a step");
  box.remove();
});

T.test("slider thumb=cap: no jump on a click, a drag from where it is, Shift finer", async (T) => {
  const box = await mount(`<ray-slider orientation="vertical" thumb="cap" aria-label="Fader" min="0" max="100" step="0.1" value="50" style="height: 300px"></ray-slider>`);
  const s = box.firstElementChild;
  const root = s.shadowRoot.querySelector(".root");
  const input = s.shadowRoot.querySelector("input");
  T.eq(getComputedStyle(input).pointerEvents, "none", "the native range never sees the pointer");
  const r = input.getBoundingClientRect();
  let inputs = 0, changes = 0;
  s.addEventListener("input", () => inputs++);
  s.addEventListener("change", () => changes++);
  // A click near the bottom of the slot: nothing moves.
  pointer(root, "pointerdown", r.left + r.width / 2, r.bottom - 5);
  pointer(root, "pointerup", r.left + r.width / 2, r.bottom - 5);
  T.eq(s.value, 50, "a click alone leaves it");
  T.eq(changes, 0, "and fires no change");
  // Grab it anywhere and pull up 30 px: it rises as much as the pointer.
  const travel = r.height - parseFloat(getComputedStyle(root).scrollMarginTop);
  pointer(root, "pointerdown", r.left + 2, r.bottom - 20);
  pointer(root, "pointermove", r.left + 2, r.bottom - 50);
  const up30 = s.value;
  T.ok(near(up30, 50 + (30 / travel) * 100, 0.2), `30 px up: +${(up30 - 50).toFixed(1)} (${((30 / travel) * 100).toFixed(1)} expected)`);
  // Shift mid-drag: ten times finer from there.
  pointer(root, "pointermove", r.left + 2, r.bottom - 80, { shiftKey: true });
  pointer(root, "pointermove", r.left + 2, r.bottom - 110, { shiftKey: true });
  T.ok(near(s.value, up30 + (30 / travel) * 10, 0.2), `Shift: 30 px is a tenth (${(s.value - up30).toFixed(2)})`);
  pointer(root, "pointerup", r.left + 2, r.bottom - 110);
  T.ok(inputs > 0, "input while dragging");
  T.eq(changes, 1, "change on release");
  box.remove();
});

T.test("slider thumb=cap: the wheel, Shift with the keys, a double click to default-value; rtl", async (T) => {
  const box = await mount(`<ray-slider orientation="vertical" thumb="cap" taper="fader" default-value="0" aria-label="Fader" min="-60" max="6" step="0.1" value="-20" style="height: 200px"></ray-slider>
    <div dir="rtl"><ray-slider thumb="cap" aria-label="Pan" min="-50" max="50" value="0" style="width: 200px"></ray-slider></div>`);
  const [s, pan] = box.querySelectorAll("ray-slider");
  const root = s.shadowRoot.querySelector(".root");
  root.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
  T.ok(s.value > -20, `the wheel up raises it (${s.value})`);
  const once = s.value;
  root.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
  T.eq(s.value, -20, "and down brings it back");
  root.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  T.eq(s.value, 0, "a double click: default-value");
  T.ok(once !== s.value);
  // Horizontal, right to left: dragging left raises it; ArrowLeft too, Shift ten steps.
  const proot = pan.shadowRoot.querySelector(".root");
  const r = pan.shadowRoot.querySelector("input").getBoundingClientRect();
  pointer(proot, "pointerdown", r.left + 100, r.top + 5);
  pointer(proot, "pointermove", r.left + 80, r.top + 5);
  pointer(proot, "pointerup", r.left + 80, r.top + 5);
  T.ok(pan.value > 0, `rtl: dragging left raises it (${pan.value})`);
  pan.value = 0;
  await T.settle();
  key(pan.shadowRoot.querySelector("input"), "ArrowLeft", { shiftKey: true });
  T.eq(pan.value, 10, "rtl ArrowLeft with Shift: ten steps up");
  box.remove();
});

T.test("slider: a round, linear slider keeps the native range (a click on the track moves it)", async (T) => {
  const box = await mount(`<ray-slider aria-label="Plain" value="40" default-value="10" style="width: 200px"></ray-slider>`);
  const s = box.firstElementChild;
  const input = s.shadowRoot.querySelector("input");
  T.eq(getComputedStyle(input).pointerEvents, "auto");
  T.eq(input.min, "0");
  T.eq(input.max, "100");
  T.eq(input.hasAttribute("aria-valuetext"), false, "no unit, not tapered: the native value speaks");
  s.shadowRoot.querySelector(".root").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  T.eq(s.value, 10, "default-value works on any slider");
  box.remove();
});

T.test("meter taper=fader: bars, zones and scale on the fader's curve, level with its marks", async (T) => {
  const box = await mount(`<div style="display: flex; align-items: flex-end">
    <ray-slider orientation="vertical" thumb="cap" taper="fader" aria-label="Fader" min="-60" max="6" style="height: 200px"></ray-slider>
    <ray-meter taper="fader" min="-60" max="6" warn="-12" falloff="0" hold="0" style="height: 200px; --ray-meter-inset: 0.4375rem"></ray-meter></div>`);
  const slider = box.querySelector("ray-slider");
  const m = box.querySelector("ray-meter");
  const track = m.shadowRoot.querySelector(".track");
  m.setLevels(-12);
  T.ok(near(parseFloat(track.style.getPropertyValue("--_p")), 52.45, 0.05), `-12 dB at 52 % (${track.style.getPropertyValue("--_p")})`);
  T.ok(near(parseFloat(track.style.getPropertyValue("--_warn")), 52.45, 0.05), "the warn zone on the curve");
  slider.marks = [-12];
  await T.settle();
  const mark = slider.shadowRoot.querySelector(".mark").getBoundingClientRect();
  const t = track.getBoundingClientRect();
  const top = t.bottom - 0.5245 * t.height;
  T.ok(Math.abs((mark.top + mark.bottom) / 2 - top) < 1.5, `the -12 bar's top level with the fader's -12 mark (${(mark.top + mark.bottom) / 2} / ${top})`);
  box.remove();
});
