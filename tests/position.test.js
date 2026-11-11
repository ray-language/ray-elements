// page: tests/pages/position.html
//
// core/position.js against the visible area: the visual viewport (what an
// on-screen keyboard leaves), flipping to the roomier side, capping the
// height to the room, and autoUpdate on visual viewport changes. A fake
// visualViewport stands in for the keyboard. Also ray-combobox's chevron.

const T = window.__rayTest;
await customElements.whenDefined("ray-combobox");
const { place, visibleArea, autoUpdate } = await import("../../src/core/position.js");

/** Runs fn with window.visualViewport replaced by a fake (an EventTarget with its geometry). */
async function withViewport(geometry, fn) {
  const fake = Object.assign(new EventTarget(), { scale: 1, offsetLeft: 0, width: document.documentElement.clientWidth, ...geometry });
  Object.defineProperty(window, "visualViewport", { value: fake, configurable: true });
  try {
    return await fn(fake);
  } finally {
    delete window.visualViewport;
  }
}

function floating(height) {
  const el = document.createElement("div");
  el.style.cssText = "position: fixed; width: 200px; background: #888;";
  el.innerHTML = `<div style="height: ${height}px"></div>`;
  document.body.append(el);
  return el;
}
const rect = (top, height, left = 20, width = 200) => ({ left, right: left + width, top, bottom: top + height, width, height });

T.test("position: the visible area is the visual viewport when there is one", async (T) => {
  const full = visibleArea();
  T.eq(full.top, 0);
  T.eq(full.bottom, window.innerHeight, "no visual viewport offset: the window");
  await withViewport({ offsetTop: 100, height: 300 }, () => {
    const a = visibleArea();
    T.eq(a.top, 100, "scrolled: the visible part starts lower");
    T.eq(a.bottom, 400, "the keyboard takes the rest");
  });
});

T.test("position: with the keyboard up, a list that does not fit below opens above, inside the visible area", async (T) => {
  const el = floating(200);
  await withViewport({ offsetTop: 100, height: 300 }, () => {
    const side = place(rect(350, 30), el, { placement: "bottom-start", offset: 4 });
    T.eq(side, "top-start");
    const r = el.getBoundingClientRect();
    T.eq(Math.round(r.bottom), 346, "right above the field");
    T.ok(r.top >= 108, `inside the visible area: ${r.top}`);
    T.eq(el.style.maxHeight, "", "fits: not capped");
  });
  el.remove();
});

T.test("position: when neither side fits, the roomier one, with the height capped to its room", async (T) => {
  const el = floating(280);
  await withViewport({ offsetTop: 100, height: 300 }, () => {
    // Below: 400 - 8 - (230 + 4) = 158; above: 200 - 4 - 108 = 88.
    const side = place(rect(200, 30), el, { placement: "bottom-start", offset: 4 });
    T.eq(side, "bottom-start");
    T.eq(el.style.maxHeight, "158px");
    T.eq(el.style.overflowY, "auto", "it scrolls");
    const r = el.getBoundingClientRect();
    T.eq(Math.round(r.top), 234, "not over the field");
    T.ok(r.bottom <= 392.5, `above the keyboard: ${r.bottom}`);
    // Above is roomier when the field is low.
    const up = place(rect(330, 30), el, { placement: "bottom-start", offset: 4 });
    T.eq(up, "top-start");
    T.eq(el.style.maxHeight, `${330 - 4 - 108}px`);
    T.eq(Math.round(el.getBoundingClientRect().bottom), 326);
  });
  // With room again (keyboard down), the cap goes away.
  place(rect(200, 30), el, { placement: "bottom-start", offset: 4 });
  T.eq(el.style.maxHeight, "", "uncapped");
  T.eq(el.dataset.capped, undefined);
  // An inline max-height of the page's own is restored, not lost.
  el.style.maxHeight = "250px";
  await withViewport({ offsetTop: 100, height: 300 }, () => place(rect(200, 30), el, { placement: "bottom-start", offset: 4 }));
  T.eq(el.style.maxHeight, "158px", "capped below its own");
  place(rect(200, 30), el, { placement: "bottom-start", offset: 4 });
  T.eq(el.style.maxHeight, "250px", "its own back");
  el.remove();
});

T.test("position: autoUpdate follows the visual viewport (the keyboard opening, the page scrolling under it)", async (T) => {
  const el = floating(50);
  const anchor = document.createElement("div");
  document.body.append(anchor);
  await withViewport({ offsetTop: 0, height: 500 }, (vv) => {
    let calls = 0;
    const stop = autoUpdate(anchor, el, () => calls++);
    vv.dispatchEvent(new Event("resize"));
    vv.dispatchEvent(new Event("scroll"));
    T.eq(calls, 2, "resize and scroll of the visual viewport");
    stop();
    vv.dispatchEvent(new Event("resize"));
    T.eq(calls, 2, "stopped");
  });
  el.remove();
  anchor.remove();
});

T.test("combobox: no expand arrow when there is nothing to pick from", async (T) => {
  const box = document.createElement("div");
  box.innerHTML = `<ray-combobox multiple creatable label="Allergies"></ray-combobox><ray-combobox label="Fruit"><option>Apple</option></ray-combobox>`;
  document.body.append(box);
  await T.settle();
  const [tags, fruit] = box.children;
  T.eq(tags.shadowRoot.querySelector(".chevron").hidden, true, "a creatable tag field without options");
  T.eq(fruit.shadowRoot.querySelector(".chevron").hidden, false, "with options");
  tags.data = ["Pollen"];
  await T.settle();
  T.eq(tags.shadowRoot.querySelector(".chevron").hidden, false, "options added later");
  box.remove();
});
