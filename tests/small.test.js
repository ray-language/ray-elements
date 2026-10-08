// page: tests/pages/small.html
//
// Pagination, skeleton and aspect ratio in the real webview.

const T = window.__rayTest;
await Promise.all(["ray-pagination", "ray-skeleton", "ray-aspect-ratio"].map((t) => customElements.whenDefined(t)));
const { paginationRange } = await import("../../src/components/pagination/pagination.js");
const { parseRatio } = await import("../../src/components/aspect-ratio/aspect-ratio.js");

async function mount(html) {
  const box = document.createElement("div");
  box.style.width = "600px";
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const all = (el, sel) => [...el.shadowRoot.querySelectorAll(sel)];
const show = (r) => r.map((x) => (x === "dots" ? "…" : x)).join(" ");

T.test("pagination: range algorithm keeps a constant length", (T) => {
  T.eq(show(paginationRange(20, 10)), "1 … 9 10 11 … 20");
  T.eq(show(paginationRange(20, 1)), "1 2 3 4 5 … 20");
  T.eq(show(paginationRange(20, 20)), "1 … 16 17 18 19 20");
  T.eq(show(paginationRange(20, 4)), "1 2 3 4 5 … 20");
  T.eq(show(paginationRange(20, 5)), "1 … 4 5 6 … 20");
  T.eq(show(paginationRange(5, 3)), "1 2 3 4 5", "no ellipsis when everything fits");
  T.eq(show(paginationRange(7, 4)), "1 2 3 4 5 6 7");
  T.eq(show(paginationRange(50, 25, 2, 2)), "1 2 … 23 24 25 26 27 … 49 50");
  T.eq(paginationRange(0, 1).length, 0);
  for (let v = 1; v <= 30; v++) T.eq(paginationRange(30, v).length, 7, `constant length at ${v}`);
});

T.test("pagination: ARIA, clicks, events, disabled ends", async (T) => {
  const box = await mount(`<ray-pagination total="20" value="10" label="Releases"></ray-pagination>`);
  const p = box.querySelector("ray-pagination");
  T.eq(inner(p, "nav").getAttribute("aria-label"), "Releases");
  const pages = () => all(p, "button[data-number]");
  T.eq(pages().map((b) => b.textContent).join(" "), "1 9 10 11 20");
  T.eq(all(p, ".dots").length, 2, "two ellipses, not focusable");
  T.eq(all(p, ".dots").every((d) => d.getAttribute("aria-hidden") === "true"), true);
  const current = inner(p, '[aria-current="page"]');
  T.eq(current.textContent, "10");
  T.eq(current.getAttribute("aria-label"), "Page 10");
  T.eq(current.dataset.variant, "filled", "current page is filled");
  const seen = [];
  let changes = 0;
  p.addEventListener("change", () => { seen.push(p.value); changes++; });
  pages().find((b) => b.textContent === "11").click();
  await T.settle();
  T.eq(p.value, 11);
  T.eq(seen.join(), "11");
  T.eq(changes, 1);
  inner(p, '[data-role="next"]').click();
  await T.settle();
  T.eq(p.value, 12, "next");
  inner(p, '[data-role="previous"]').click();
  await T.settle();
  T.eq(p.value, 11, "previous");
  inner(p, '[aria-current="page"]').click();
  await T.settle();
  T.eq(seen.length, 3, "clicking the current page fires nothing");
  p.value = 1;
  await T.settle();
  T.eq(inner(p, '[data-role="previous"]').disabled, true, "previous disabled on page 1");
  T.eq(inner(p, '[data-role="next"]').disabled, false);
  p.last();
  await T.settle();
  T.eq(p.value, 20, "last()");
  T.eq(inner(p, '[data-role="next"]').disabled, true, "next disabled on the last page");
  p.value = 99;
  await T.settle();
  T.eq(p.page, 20, "value clamped");
  T.eq(inner(p, '[aria-current="page"]').textContent, "20");
  p.withEdges = true;
  await T.settle();
  T.ok(inner(p, '[data-role="first"]') && inner(p, '[data-role="last"]'), "first/last buttons");
  p.disabled = true;
  await T.settle();
  T.ok(all(p, "button").every((b) => b.disabled), "disabled: every button");
  p.hideControls = true;
  await T.settle();
  T.eq(all(p, "[data-role]").length, 0, "hide-controls");
  box.remove();
});

T.test("skeleton: size, circle, lines, loaded swap, aria", async (T) => {
  const box = await mount(`<ray-skeleton id="a" width="200" height="1.5rem" radius="lg"></ray-skeleton>
    <ray-skeleton id="c" circle width="40"></ray-skeleton>
    <ray-skeleton id="l" lines="3" height="10"></ray-skeleton>
    <ray-skeleton id="s"><b id="real">Loaded</b></ray-skeleton>`);
  const [a, c, l, s] = ["a", "c", "l", "s"].map((id) => box.querySelector("#" + id));
  const bone = (el) => inner(el, ".bone");
  let r = bone(a).getBoundingClientRect();
  T.eq(Math.round(r.width), 200, "width");
  T.eq(Math.round(r.height), 24, "height");
  T.eq(getComputedStyle(bone(a)).borderTopLeftRadius, "16px", "radius token (lg = 1rem)");
  r = bone(c).getBoundingClientRect();
  T.eq(Math.round(r.width), 40);
  T.eq(Math.round(r.height), 40, "circle: square");
  T.eq(getComputedStyle(bone(c)).borderTopLeftRadius, "50%");
  const lines = all(l, ".bone");
  T.eq(lines.length, 3, "three lines");
  T.ok(lines[2].getBoundingClientRect().width < lines[0].getBoundingClientRect().width, "last line shorter");
  T.eq(Math.round(lines[0].getBoundingClientRect().height), 10);
  T.eq(inner(s, ".bones").getAttribute("aria-hidden"), "true");
  T.eq(s.getAttribute("aria-busy"), "true", "busy while loading");
  const real = box.querySelector("#real");
  T.eq(real.getBoundingClientRect().height, 0, "content hidden while loading");
  s.loaded = true;
  await T.settle();
  T.eq(s.hasAttribute("aria-busy"), false, "not busy once loaded");
  T.ok(real.getBoundingClientRect().height > 0, "content shown");
  T.eq(inner(s, ".bones").getBoundingClientRect().height, 0, "placeholder gone");
  l.lines = 1;
  await T.settle();
  T.eq(all(l, ".bone").length, 1);
  box.remove();
});

T.test("aspect ratio: ratio parsing, box size, the media fills it", async (T) => {
  T.eq(parseRatio("16/9"), "16 / 9");
  T.eq(parseRatio("4:3"), "4 / 3");
  T.eq(parseRatio("1"), "1");
  T.eq(parseRatio(1.5), "1.5");
  T.eq(parseRatio("x"), null);
  T.eq(parseRatio("1/0"), null);
  const box = await mount(`<ray-aspect-ratio id="w" style="width: 320px"><div id="m" style="background: red"></div></ray-aspect-ratio>
    <ray-aspect-ratio id="sq" ratio="1" fit="contain" style="width: 100px"><img id="i" alt=""></ray-aspect-ratio>`);
  const w = box.querySelector("#w");
  T.eq(Math.round(w.getBoundingClientRect().height), 180, "16/9 by default");
  const m = box.querySelector("#m").getBoundingClientRect();
  T.eq(Math.round(m.width), 320, "child fills the width");
  T.eq(Math.round(m.height), 180, "and the height");
  const sq = box.querySelector("#sq");
  T.eq(Math.round(sq.getBoundingClientRect().height), 100, "ratio 1");
  T.eq(getComputedStyle(box.querySelector("#i")).objectFit, "contain", "fit=contain");
  w.ratio = "4:3";
  await T.settle();
  T.eq(Math.round(w.getBoundingClientRect().height), 240, "ratio changes");
  box.remove();
});
