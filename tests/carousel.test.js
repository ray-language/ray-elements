// page: tests/pages/carousel.html
//
// ray-carousel in the real webview: ARIA, positions (snap points),
// next/prev/goTo/index, ends vs loop, indicators, keyboard, events.

const T = window.__rayTest;
await customElements.whenDefined("ray-carousel");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}

const slides = (n, extra = "") =>
  Array.from({ length: n }, (_, i) => `<div style="height: 80px; background: #ddd${extra}">${i + 1}</div>`).join("");
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));

T.test("carousel: ARIA, slides labelled, indicators", async (T) => {
  const box = await mount(`<ray-carousel label="Releases" style="width: 400px">${slides(3)}</ray-carousel>`);
  const c = box.querySelector("ray-carousel");
  const root = inner(c, '[part="root"]');
  T.eq(root.getAttribute("role"), "region");
  T.eq(root.getAttribute("aria-roledescription"), "carousel");
  T.eq(root.getAttribute("aria-label"), "Releases");
  const s = c.slides;
  T.eq(s.length, 3);
  T.eq(s[0].getAttribute("role"), "group");
  T.eq(s[0].getAttribute("aria-roledescription"), "slide");
  T.eq(s[1].getAttribute("aria-label"), "2 of 3");
  T.eq(c.count, 3, "one position per full-width slide");
  const dots = c.shadowRoot.querySelectorAll('[part="indicator"]');
  T.eq(dots.length, 3);
  T.eq(dots[2].getAttribute("aria-label"), "Go to slide 3");
  T.eq(dots[0].getAttribute("aria-current"), "true");
  T.eq(inner(c, '[part="viewport"]').getAttribute("aria-live"), "polite");
  box.remove();
});

T.test("carousel: next, prev, ends disabled, goTo, index, events", async (T) => {
  const box = await mount(`<ray-carousel style="width: 400px">${slides(3)}</ray-carousel>`);
  const c = box.querySelector("ray-carousel");
  const vp = inner(c, '[part="viewport"]');
  const prev = inner(c, '[part="previous"]');
  const next = inner(c, '[part="next"]');
  const seen = [];
  c.addEventListener("change", (e) => { if (e.target === c) seen.push(c.index); });
  T.eq(prev.disabled, true, "previous disabled at the start");
  T.eq(next.disabled, false);
  c.next();
  await T.settle();
  T.eq(c.index, 1);
  T.ok(Math.abs(vp.scrollLeft - c.slides[1].offsetLeft) <= 2 || vp.scrollLeft > 300, `scrolled to slide 2 (${vp.scrollLeft})`);
  T.eq(inner(c, '[part="indicator"][aria-current="true"]').dataset.index, "1", "indicator follows");
  c.goTo(2, { instant: true });
  await T.settle();
  T.eq(c.index, 2);
  T.eq(next.disabled, true, "next disabled at the end");
  c.next();
  await T.settle();
  T.eq(c.index, 2, "no loop: stays at the end");
  c.prev();
  await T.settle();
  T.eq(c.index, 1);
  c.index = 0;
  await T.settle();
  T.eq(vp.scrollLeft, 0, "setting index scrolls");
  T.eq(seen.join(","), "1,2,1", "change for each move (not for index set by code)");
  inner(c, '[part="indicator"][data-index="2"]').click();
  await T.settle();
  T.eq(c.index, 2, "indicator click");
  box.remove();
});

T.test("carousel: loop, keyboard, scroll tracking", async (T) => {
  const box = await mount(`<ray-carousel loop style="width: 400px">${slides(3)}</ray-carousel>`);
  const c = box.querySelector("ray-carousel");
  const vp = inner(c, '[part="viewport"]');
  T.eq(inner(c, '[part="previous"]').disabled, false, "loop: previous enabled at the start");
  c.prev();
  await T.settle();
  T.eq(c.index, 2, "loop: prev from the first goes to the last");
  c.next();
  await T.settle();
  T.eq(c.index, 0, "loop: next from the last goes to the first");
  key(c.slides[0], "ArrowRight");
  await T.settle();
  T.eq(c.index, 1, "ArrowRight");
  key(c.slides[0], "End");
  await T.settle();
  T.eq(c.index, 2, "End");
  key(c.slides[0], "Home");
  await T.settle();
  T.eq(c.index, 0, "Home");
  key(c.slides[0], "ArrowLeft");
  await T.settle();
  T.eq(c.index, 2, "ArrowLeft wraps with loop");
  // A user scroll (swipe, trackpad) moves the position too.
  vp.scrollLeft = c.slides[1].offsetLeft - c.slides[0].offsetLeft;
  vp.dispatchEvent(new Event("scroll"));
  await new Promise((r) => setTimeout(r, 1200));
  T.eq(c.index, 1, "tracks the scroll position");
  box.remove();
});

T.test("carousel: several slides in view, autoplay controls", async (T) => {
  const box = await mount(`<ray-carousel slide-size="50%" slide-gap="0px" autoplay="5000" style="width: 400px">${slides(5)}</ray-carousel>`);
  const c = box.querySelector("ray-carousel");
  T.eq(c.count, 4, "5 half-width slides: 4 reachable positions");
  T.eq(c.shadowRoot.querySelectorAll('[part="indicator"]').length, 4);
  const play = inner(c, '[part="play"]');
  T.eq(play.hidden, false, "autoplay shows a pause/play button");
  const label = play.getAttribute("aria-label");
  T.ok(label === "Pause autoplay" || label === "Start autoplay", label);
  play.click();
  await T.settle();
  T.ok(play.getAttribute("aria-label") !== label, "the button toggles");
  c.autoplay = 0;
  await T.settle();
  T.eq(play.hidden, true, "no autoplay: no button");
  box.remove();
});
