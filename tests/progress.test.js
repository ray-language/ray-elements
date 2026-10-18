// page: tests/pages/progress.html
//
// The progress indicators beyond the bar: ray-ring-progress.

const T = window.__rayTest;
await Promise.all(["ray-ring-progress"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);

T.test("ring-progress: the arc follows value of max; ARIA", async (T) => {
  const box = await mount(`<ray-ring-progress value="25" label="Round"></ray-ring-progress>`);
  const ring = box.firstElementChild;
  const bar = inner(ring, ".bar");
  T.eq(getComputedStyle(bar).strokeDasharray.replace(/px/g, "").replace(/,/g, ""), "25 100", "a quarter");
  T.eq(ring.internals.role, "progressbar");
  T.eq(ring.internals.ariaValueNow, "25");
  T.eq(ring.internals.ariaValueText, "25%");
  T.eq(ring.internals.ariaLabel, "Round");
  ring.max = 50;
  await T.settle();
  T.eq(bar.style.getPropertyValue("--_pct"), "50", "25 of 50");
  ring.value = 80;
  await T.settle();
  T.eq(bar.style.getPropertyValue("--_pct"), "100", "clamped to a full ring");
  ring.value = 0;
  ring.roundCaps = true;
  await T.settle();
  T.eq(getComputedStyle(bar).visibility, "hidden", "no cap dot at 0");
  ring.value = undefined;
  await T.settle();
  T.ok(inner(ring, "svg").hasAttribute("data-indeterminate"), "without value: indeterminate");
  T.eq(bar.style.getPropertyValue("--_pct"), "25", "a quarter arc spins");
  T.eq(ring.internals.ariaValueNow, null);
  box.remove();
});

T.test("ring-progress: size, thickness and the middle", async (T) => {
  const box = await mount(`<ray-ring-progress size="lg" value="40" show-value></ray-ring-progress><ray-ring-progress size="180px" thickness="12" value="40" show-value><b>3:00</b></ray-ring-progress>`);
  const [lg, own] = box.children;
  T.eq(Math.round(lg.getBoundingClientRect().width), 160, "lg: 10rem");
  lg.size = "xs";
  await T.settle();
  T.eq(Math.round(inner(lg, "svg").getBoundingClientRect().width), 48, "xs: the drawing is 3rem too");
  lg.size = "lg";
  await T.settle();
  T.eq(inner(lg, ".value").textContent, "40%", "show-value with an empty slot");
  T.eq(Math.round(own.getBoundingClientRect().width), 180, "a length");
  T.eq(Math.round(own.getBoundingClientRect().height), 180);
  T.eq(getComputedStyle(inner(own, ".bar")).strokeWidth, "12px", "a bare number is px");
  T.eq(Math.round(inner(own, ".track").getBBox().width), 168, "r: half the box minus half the stroke");
  T.eq(inner(own, ".value").textContent, "", "the slot wins over show-value");
  const clock = own.querySelector("b").getBoundingClientRect();
  const r = own.getBoundingClientRect();
  T.ok(Math.abs(clock.left + clock.width / 2 - (r.left + r.width / 2)) < 2, "the content is centered");
  own.querySelector("b").remove();
  await T.settle();
  T.eq(inner(own, ".value").textContent, "40%", "emptied slot: the percentage again");
  box.remove();
});
