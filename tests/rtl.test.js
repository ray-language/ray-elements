// page: docs/components/all.html
//
// Right to left: arrow keys follow the reading direction, and what JS places
// or scrolls (split, carousel, scroll-area, slider marks, indicator,
// segmented-control) mirrors, floating panels align -start/-end to the
// right, and the start/end values of the API follow the direction while
// left/right stay sides of the screen.

const T = window.__rayTest;
const { isRtl, inlineKey } = await import("../../src/core/direction.js");
const tags = ["ray-tabs", "ray-tab", "ray-radio-group", "ray-radio", "ray-segmented-control", "ray-toggle-group", "ray-toggle", "ray-calendar", "ray-split", "ray-carousel", "ray-scroll-area", "ray-slider", "ray-indicator", "ray-popover", "ray-menu", "ray-menu-item", "ray-select", "ray-checkbox", "ray-switch", "ray-accordion", "ray-accordion-item", "ray-separator", "ray-timeline", "ray-timeline-item", "ray-drawer", "ray-sidebar", "ray-toaster"];
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

T.test("rtl: -start and -end placements line up the right and the left edges", async (T) => {
  const box = await mount(`<div style="display: flex; justify-content: center; padding: 40px">
    <ray-popover placement="bottom-start"><button slot="trigger" style="width: 200px">start</button><div style="width: 80px">a</div></ray-popover>
    <ray-popover placement="bottom-end"><button slot="trigger" style="width: 200px">end</button><div style="width: 80px">b</div></ray-popover>
    <ray-menu><button slot="trigger" style="width: 200px">menu</button><ray-menu-item>Item</ray-menu-item></ray-menu>
    <ray-select style="width: 200px" value="a"><option value="a">A</option><option value="b">B</option></ray-select>
  </div>`);
  const edges = (trigger, panel) => {
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    return { left: Math.round(p.left - t.left), right: Math.round(t.right - p.right) };
  };
  const [start, end] = box.querySelectorAll("ray-popover");
  start.open = true;
  await T.settle();
  T.eq(edges(start.querySelector("button"), start.panel).right, 0, "-start: the right edges line up");
  T.ok(edges(start.querySelector("button"), start.panel).left > 0, "and the panel is narrower, so it sits right");
  T.ok(start.panel.dataset.placement.endsWith("-start"), `the placement keeps its logical name (${start.panel.dataset.placement})`);
  start.open = false;
  end.open = true;
  await T.settle();
  T.eq(edges(end.querySelector("button"), end.panel).left, 0, "-end: the left edges");
  end.open = false;
  const menu = box.querySelector("ray-menu");
  menu.open = true;
  await T.settle();
  T.eq(edges(menu.querySelector("button"), menu.panel).right, 0, "a menu (bottom-start) opens under the right edge");
  menu.open = false;
  const select = box.querySelector("ray-select");
  select.open = true;
  await T.settle();
  await pause();
  T.eq(edges(select, select.listbox).right, 0, "a select's listbox too");
  select.open = false;
  await T.settle();
  box.remove();
});

T.test("rtl: start/end values follow the direction, left/right stay sides of the screen", async (T) => {
  const html = `
    <ray-checkbox label="a"></ray-checkbox><ray-checkbox label="b" label-position="start"></ray-checkbox><ray-checkbox label="c" label-position="left"></ray-checkbox>
    <ray-switch label="d" label-position="right"></ray-switch>
    <ray-accordion value="x"><ray-accordion-item value="x" label="x">x</ray-accordion-item></ray-accordion>
    <ray-accordion chevron-position="left"><ray-accordion-item value="y" label="y">y</ray-accordion-item></ray-accordion>
    <ray-separator label="s" label-position="start"></ray-separator>
    <ray-timeline><ray-timeline-item title="t">t</ray-timeline-item></ray-timeline>
    <ray-timeline align="left"><ray-timeline-item title="u">u</ray-timeline-item></ray-timeline>
    <ray-timeline align="end"><ray-timeline-item title="v">v</ray-timeline-item></ray-timeline>
    <ray-drawer label="d1"></ray-drawer><ray-drawer label="d2" position="start"></ray-drawer><ray-drawer label="d3" position="right"></ray-drawer>
    <ray-sidebar></ray-sidebar><ray-sidebar side="end"></ray-sidebar><ray-sidebar side="left"></ray-sidebar>
    <ray-toaster></ray-toaster><ray-toaster position="top-start"></ray-toaster><ray-toaster position="bottom-left"></ray-toaster>`;
  const rtl = await mount(`<div style="width: 400px">${html}</div>`);
  const ltr = await mount(`<div style="width: 400px">${html}</div>`, "ltr");
  const x = (el) => el.getBoundingClientRect().left;
  // Whether the label sits left of the box.
  const labelLeft = (c) => x(c.shadowRoot.querySelector(".body")) < x(c.shadowRoot.querySelector(".inner"));
  const sides = (box) => [...box.querySelectorAll("ray-checkbox, ray-switch")].map(labelLeft).join();
  T.eq(sides(rtl), "true,false,true,false", "rtl labels: end (default) left, start right, left left, right right");
  T.eq(sides(ltr), "false,true,true,false", "ltr labels: end right, start left, left left, right right");
  const chevronLeft = (a) => {
    const item = a.querySelector("ray-accordion-item");
    return x(item.shadowRoot.querySelector(".chevron")) < x(item.shadowRoot.querySelector(".label"));
  };
  T.eq([...rtl.querySelectorAll("ray-accordion")].map(chevronLeft).join(), "true,true", "rtl chevron: end (default) on the left, left on the left");
  T.eq([...ltr.querySelectorAll("ray-accordion")].map(chevronLeft).join(), "false,true", "ltr chevron: end on the right, left on the left");
  const sep = (box) => {
    const el = box.querySelector("ray-separator");
    const range = document.createRange();
    range.selectNodeContents(el.shadowRoot.querySelector(".labeled"));
    const t = range.getBoundingClientRect();
    return Math.round((t.left + t.right) / 2 - el.getBoundingClientRect().left);
  };
  T.ok(sep(rtl) > 300, `rtl separator start: the label on the right (${sep(rtl)})`);
  T.ok(sep(ltr) < 100, `ltr separator start: the label on the left (${sep(ltr)})`);
  const bulletLeft = (tl) => {
    const item = tl.querySelector("ray-timeline-item");
    return x(item.shadowRoot.querySelector(".bullet-col")) < x(item.shadowRoot.querySelector(".body"));
  };
  T.eq([...rtl.querySelectorAll("ray-timeline")].map(bulletLeft).join(), "false,true,true", "rtl timeline: start right, left left, end left");
  T.eq([...ltr.querySelectorAll("ray-timeline")].map(bulletLeft).join(), "true,true,false", "ltr timeline: start left, left left, end right");
  // The closed dialog's computed insets: which edge it hangs from.
  const edge = (el) => {
    const cs = getComputedStyle(el);
    return cs.left === "auto" ? "right" : cs.right === "auto" ? "left" : "?";
  };
  const drawers = (box) => [...box.querySelectorAll("ray-drawer")].map((d) => edge(d.shadowRoot.querySelector("dialog"))).join();
  T.eq(drawers(rtl), "left,right,right", "rtl drawers: end (default) left, start right, right right");
  T.eq(drawers(ltr), "right,left,right", "ltr drawers");
  const from = (d) => getComputedStyle(d.shadowRoot.querySelector("dialog")).getPropertyValue("--_from").trim();
  T.eq(from(rtl.querySelector("ray-drawer")), "translateX(-100%)", "rtl: the default drawer slides in from the left");
  const sidebars = (box) => [...box.querySelectorAll("ray-sidebar")].map((sb) => {
    const p = getComputedStyle(sb.shadowRoot.querySelector(".panel"));
    return `${edge(sb.shadowRoot.querySelector("dialog"))}/${p.borderLeftWidth === "1px" ? "bl" : p.borderRightWidth === "1px" ? "br" : "?"}`;
  }).join();
  T.eq(sidebars(rtl), "right/bl,left/br,left/br", "rtl sidebars: start on the right, border facing the content");
  T.eq(sidebars(ltr), "left/br,right/bl,left/br", "ltr sidebars");
  const toasters = (box) => [...box.querySelectorAll("ray-toaster")].map(edge).join();
  T.eq(toasters(rtl), "left,right,left", "rtl toasters: bottom-end (default) left, top-start right, bottom-left left");
  T.eq(toasters(ltr), "right,left,left", "ltr toasters");
  rtl.remove();
  ltr.remove();
});
