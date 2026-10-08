// page: tests/pages/blockquote.html
//
// <ray-blockquote>: a real blockquote with cite, the mark, the attribution
// (text or slot), color and variants.

const T = window.__rayTest;
await customElements.whenDefined("ray-blockquote");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);

T.test("blockquote: semantics, attribution text, source URL", async (T) => {
  const box = await mount(`<ray-blockquote cite="— Grace Hopper" href="https://example.com/q">Quote.</ray-blockquote>`);
  const el = box.firstElementChild;
  const quote = inner(el, "blockquote");
  T.eq(quote.getAttribute("cite"), "https://example.com/q", "href is the blockquote's cite");
  T.eq(quote.querySelector("slot").assignedNodes()[0].textContent, "Quote.", "content inside the blockquote");
  T.eq(inner(el, ".cite-text").textContent, "— Grace Hopper");
  T.ok(inner(el, ".cite").hasAttribute("data-filled"));
  T.eq(inner(el, ".icon").hidden, false, "a quote mark by default");
  T.ok(inner(el, ".icon svg"), "drawn from the registry");
  el.cite = "";
  el.href = "";
  el.icon = "none";
  await T.settle();
  T.eq(getComputedStyle(inner(el, ".cite")).display, "none", "no attribution, no footer");
  T.eq(quote.hasAttribute("cite"), false);
  T.eq(inner(el, ".icon").hidden, true, "icon none");
  box.remove();
});

T.test("blockquote: rich attribution slot, color and variants", async (T) => {
  const box = await mount(`<ray-blockquote color="teal" variant="filled"><p>A.</p><p>B.</p><span slot="cite">Katherine</span></ray-blockquote>`);
  const el = box.firstElementChild;
  T.ok(inner(el, ".cite").hasAttribute("data-filled"), "the slot fills the attribution");
  T.eq(inner(el, "figure").style.getPropertyValue("--_filled"), "var(--ray-teal-filled)");
  const q = getComputedStyle(inner(el, "blockquote"));
  T.ok(q.backgroundColor !== "rgba(0, 0, 0, 0)", "filled: solid background");
  const [a, b] = el.querySelectorAll("p");
  T.eq(getComputedStyle(b).marginBottom, "0px", "last paragraph without bottom margin");
  T.ok(parseFloat(getComputedStyle(a).marginBottom) > 0, "paragraphs spaced");
  box.remove();
});

T.test("blockquote: padding and hide-edge", async (T) => {
  const box = await mount(`<ray-blockquote padding="xs">Short.</ray-blockquote>`);
  const el = box.firstElementChild;
  const q = () => getComputedStyle(el.shadowRoot.querySelector("blockquote"));
  T.eq(q().paddingTop, "10px", "xs from the spacing scale (0.625rem)");
  T.eq(q().borderInlineStartWidth, "3px", "a colored edge by default");
  el.padding = "24";
  el.hideEdge = true;
  await T.settle();
  T.eq(q().paddingTop, "24px", "a number is px");
  T.eq(q().borderInlineStartWidth, "0px", "hide-edge");
  box.remove();
});
