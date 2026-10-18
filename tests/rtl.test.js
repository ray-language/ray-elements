// page: docs/components/all.html
//
// Right to left: arrow keys follow the reading direction, and what JS places
// or scrolls (split, carousel, scroll-area, slider marks, indicator,
// segmented-control) mirrors.

const T = window.__rayTest;
const { isRtl, inlineKey } = await import("../../src/core/direction.js");
const tags = ["ray-tabs", "ray-tab", "ray-radio-group", "ray-radio", "ray-segmented-control", "ray-toggle-group", "ray-toggle", "ray-calendar", "ray-split", "ray-carousel", "ray-scroll-area", "ray-slider", "ray-indicator"];
await Promise.all(tags.map((t) => customElements.whenDefined(t)));

async function mount(html, dir = "rtl") {
  const box = document.createElement("div");
  box.dir = dir;
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));
const pause = (ms = 50) => new Promise((r) => setTimeout(r, ms));

T.test("rtl: isRtl and inlineKey read the direction where they are asked", async (T) => {
  const box = await mount(`<span></span><div dir="ltr"><span></span></div>`);
  const [rtl, ltr] = box.querySelectorAll("span");
  T.eq(isRtl(rtl), true);
  T.eq(isRtl(ltr), false, "a nested dir wins");
  T.eq(inlineKey("ArrowLeft", rtl), "ArrowRight", "right to left, ArrowLeft goes forward");
  T.eq(inlineKey("ArrowRight", rtl), "ArrowLeft");
  T.eq(inlineKey("ArrowLeft", ltr), "ArrowLeft");
  T.eq(inlineKey("ArrowDown", rtl), "ArrowDown", "other keys pass");
  box.remove();
});

T.test("rtl: tabs, radios, segmented control, toggle group and calendar go forward with ArrowLeft", async (T) => {
  const box = await mount(`
    <ray-tabs><ray-tab value="a">A</ray-tab><ray-tab value="b">B</ray-tab><ray-tab-panel value="a">a</ray-tab-panel><ray-tab-panel value="b">b</ray-tab-panel></ray-tabs>
    <ray-radio-group value="a"><ray-radio value="a">A</ray-radio><ray-radio value="b">B</ray-radio></ray-radio-group>
    <ray-segmented-control value="a"><option value="a">A</option><option value="b">B</option></ray-segmented-control>
    <ray-toggle-group type="single"><ray-toggle value="a">A</ray-toggle><ray-toggle value="b">B</ray-toggle><ray-toggle value="c">C</ray-toggle></ray-toggle-group>
    <ray-calendar locale="en-US" value="2026-10-06"></ray-calendar>`);
  const tabs = box.querySelector("ray-tabs");
  key(tabs.tabs[0], "ArrowLeft");
  await T.settle();
  T.eq(tabs.value, "b", "tabs: ArrowLeft, the next tab");
  key(tabs.tabs[1], "ArrowRight");
  await T.settle();
  T.eq(tabs.value, "a", "ArrowRight, the previous one");

  const group = box.querySelector("ray-radio-group");
  key(group.querySelector("ray-radio"), "ArrowLeft");
  await T.settle();
  T.eq(group.value, "b", "radio group");

  const sc = box.querySelector("ray-segmented-control");
  const buttons = [...sc.shadowRoot.querySelectorAll("button")];
  key(buttons[0], "ArrowLeft");
  await T.settle();
  T.eq(sc.value, "b", "segmented control");
  await pause();
  const ind = sc.shadowRoot.querySelector(".indicator, [part='indicator']");
  if (ind) {
    const a = ind.getBoundingClientRect();
    const b = buttons[1].getBoundingClientRect();
    T.ok(Math.abs(a.left - b.left) < 2 && Math.abs(a.width - b.width) < 2, `its indicator sits on the chosen option (${Math.round(a.left)} vs ${Math.round(b.left)})`);
    T.ok(b.left < buttons[0].getBoundingClientRect().left, "the second option is to the left");
  }

  // The roving stop moves as ArrowRight moves it left to right (the same
  // start, whether or not the webview gives the toggle focus).
  const ltr = await mount(`<ray-toggle-group type="single"><ray-toggle value="a">A</ray-toggle><ray-toggle value="b">B</ray-toggle><ray-toggle value="c">C</ray-toggle></ray-toggle-group>`, "ltr");
  const stops = (g) => g.toggles.map((t) => t.tabIndex).join();
  const tg = box.querySelector("ray-toggle-group");
  const lg = ltr.querySelector("ray-toggle-group");
  tg.toggles[1].focus();
  key(tg.toggles[1], "ArrowLeft");
  lg.toggles[1].focus();
  key(lg.toggles[1], "ArrowRight");
  await T.settle();
  T.eq(stops(tg), stops(lg), "toggle group: ArrowLeft right to left = ArrowRight left to right");
  key(tg.toggles[1], "ArrowRight");
  key(lg.toggles[1], "ArrowLeft");
  await T.settle();
  T.eq(stops(tg), stops(lg), "and the reverse");
  ltr.remove();

  const cal = box.querySelector("ray-calendar");
  const roving = () => cal.shadowRoot.querySelector('.day[tabindex="0"]');
  key(roving(), "ArrowLeft");
  await T.settle();
  T.eq(roving().dataset.date, "2026-10-07", "calendar: ArrowLeft, the next day");
  key(roving(), "ArrowRight");
  await T.settle();
  T.eq(roving().dataset.date, "2026-10-06", "ArrowRight, the day before");
  box.remove();
});

T.test("rtl: split keys and drag size the start pane, on the right", async (T) => {
  const box = await mount(`<ray-split position="200" min="100" max="400" style="width: 600px; height: 200px"><div slot="start">a</div><div slot="end">b</div></ray-split>`);
  const split = box.querySelector("ray-split");
  const d = split.divider;
  const r = split.getBoundingClientRect();
  T.ok(d.getBoundingClientRect().left > r.left + 300, "the start pane is on the right");
  key(d, "ArrowLeft");
  await T.settle();
  T.eq(Math.round(split.size), 210, "ArrowLeft grows the start pane");
  key(d, "ArrowRight");
  await T.settle();
  T.eq(Math.round(split.size), 200, "ArrowRight shrinks it");
  d.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 7, clientX: r.right - 200, clientY: r.top + 10 }));
  d.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 7, clientX: r.right - 260, clientY: r.top + 10 }));
  d.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, clientX: r.right - 300, clientY: r.top + 10 }));
  await T.settle();
  T.eq(Math.round(split.size), 300, "dragged left: 300px from the right edge");
  box.remove();
});

T.test("rtl: the carousel scrolls toward the left, its buttons and keys follow", async (T) => {
  const slides = Array.from({ length: 3 }, (_, i) => `<div style="height: 60px; background: #ddd">${i + 1}</div>`).join("");
  const box = await mount(`<ray-carousel style="width: 300px">${slides}</ray-carousel>`);
  await T.settle();
  const c = box.querySelector("ray-carousel");
  const vp = c.viewport;
  T.eq(c.count, 3, "three positions");
  const prev = c.shadowRoot.querySelector(".prev").getBoundingClientRect();
  const next = c.shadowRoot.querySelector(".next").getBoundingClientRect();
  T.ok(next.left < prev.left, "next on the left, previous on the right");
  c.goTo(1, { instant: true });
  await T.settle();
  const vr = vp.getBoundingClientRect();
  T.ok(vp.scrollLeft < -250, `scrolled toward the left (${vp.scrollLeft})`);
  T.ok(Math.abs(c.slides[1].getBoundingClientRect().right - vr.right) < 2, "the second slide starts at the right edge");
  T.eq(c.index, 1);
  const second = vp.scrollLeft;
  key(c.slides[1], "ArrowLeft");
  await T.settle();
  T.eq(c.index, 2, "ArrowLeft, the next slide");
  c.goTo(2, { instant: true });
  await T.settle();
  vp.scrollTo({ left: second, behavior: "instant" });
  vp.dispatchEvent(new Event("scroll"));
  await pause();
  await T.settle();
  T.eq(c.index, 1, "a scroll by hand is tracked");
  box.remove();
});

T.test("rtl: scroll-area edges, scrollToEnd and ray-reach-end on the left", async (T) => {
  const box = await mount(`<ray-scroll-area orientation="horizontal" style="width: 200px"><div style="width: 800px; height: 40px"></div></ray-scroll-area>`);
  const sa = box.firstElementChild;
  const shown = () => [...sa.shadowRoot.querySelectorAll(".edge[data-show]")].map((e) => e.classList[1]).join();
  T.eq(shown(), "end", "at the start: more toward the end");
  const end = sa.shadowRoot.querySelector(".edge.end").getBoundingClientRect();
  T.ok(end.left - sa.getBoundingClientRect().left < 2, "the end shadow is on the left");
  let edge = null;
  sa.addEventListener("ray-reach-end", (e) => { edge = e.detail.edge; });
  sa.scrollToEnd({ behavior: "instant" });
  sa.viewport.dispatchEvent(new Event("scroll"));
  await pause();
  T.ok(sa.viewport.scrollLeft < -500, `scrolled to the end (${sa.viewport.scrollLeft})`);
  T.eq(shown(), "start");
  T.eq(edge, "left", "the end is the left edge");
  box.remove();
});

T.test("rtl: slider marks and the indicator mirror", async (T) => {
  const box = await mount(`<ray-slider min="0" max="100" value="50" style="width: 300px"></ray-slider>
    <ray-indicator><div style="width: 100px; height: 60px"></div></ray-indicator>`);
  const slider = box.querySelector("ray-slider");
  slider.marks = [0, 100];
  await T.settle();
  const [m0, m100] = slider.shadowRoot.querySelectorAll(".mark");
  T.ok(m0.getBoundingClientRect().left > m100.getBoundingClientRect().left, "0 on the right, 100 on the left, as the native range");
  const el = box.querySelector("ray-indicator");
  const host = el.getBoundingClientRect();
  const d = el.shadowRoot.querySelector(".indicator").getBoundingClientRect();
  T.eq(Math.round(d.left + d.width / 2 - host.left), 0, "top-end: centered on the left edge");
  box.remove();
});
