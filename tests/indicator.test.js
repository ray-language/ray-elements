// page: tests/pages/indicator.html
//
// <ray-indicator>: dot or label, positions and offset, max, color, disabled.

const T = window.__rayTest;
await customElements.whenDefined("ray-indicator");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const dot = (el) => el.shadowRoot.querySelector(".indicator");

T.test("indicator: wraps its content, sits on its corner, offset inward", async (T) => {
  const box = await mount(`<ray-indicator><div style="width: 100px; height: 60px"></div></ray-indicator>`);
  const el = box.firstElementChild;
  const host = el.getBoundingClientRect();
  T.eq(Math.round(host.width), 100, "fit-content");
  let d = dot(el).getBoundingClientRect();
  T.eq(Math.round(d.left + d.width / 2 - host.left), 100, "top-end: centered on the right edge");
  T.eq(Math.round(d.top + d.height / 2 - host.top), 0, "and on the top edge");
  T.eq(Math.round(d.width), 10, "a 10px dot");
  el.position = "bottom-start";
  el.offset = 8;
  await T.settle();
  d = dot(el).getBoundingClientRect();
  T.eq(Math.round(d.left + d.width / 2 - host.left), 8, "offset inward from the left");
  T.eq(Math.round(d.top + d.height / 2 - host.top), 52, "and from the bottom");
  el.position = "middle-center";
  await T.settle();
  d = dot(el).getBoundingClientRect();
  T.eq(Math.round(d.left + d.width / 2 - host.left), 50);
  T.eq(Math.round(d.top + d.height / 2 - host.top), 30);
  box.remove();
});

T.test("indicator: label, max, color, size, disabled", async (T) => {
  const box = await mount(`<ray-indicator label="120" max="99" color="red" size="16"><span>Inbox</span></ray-indicator>`);
  const el = box.firstElementChild;
  T.eq(dot(el).textContent, "99+", "count capped");
  T.ok(dot(el).hasAttribute("data-label"));
  el.label = "7";
  await T.settle();
  T.eq(dot(el).textContent, "7");
  T.eq(dot(el).style.getPropertyValue("--_filled"), "var(--ray-red-filled)", "palette color");
  T.ok(dot(el).getBoundingClientRect().height >= 16, "size is the minimum height");
  el.label = "";
  await T.settle();
  T.eq(dot(el).hasAttribute("data-label"), false, "no label: a dot");
  el.disabled = true;
  await T.settle();
  T.eq(getComputedStyle(dot(el)).display, "none", "disabled hides it");
  box.remove();
});
