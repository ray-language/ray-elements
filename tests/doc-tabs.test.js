// page: docs/components/all.html
//
// ray-doc-tabs + ray-doc-tab: ARIA over one shared panel, selection by click
// and keyboard, closing asked by ×, middle click and Delete, the neighbour
// selected and focused when the selected tab goes, the unsaved mark.

const T = window.__rayTest;
await Promise.all(["ray-doc-tabs", "ray-doc-tab"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const BAR = `<ray-doc-tabs panel="dt-panel" label="Open files" value="b">
  <ray-doc-tab value="a">a.ray</ray-doc-tab><ray-doc-tab value="b">b.ray</ray-doc-tab><ray-doc-tab value="c" dirty>c.ray</ray-doc-tab>
</ray-doc-tabs><div id="dt-panel"></div>`;

T.test("doc tabs: ARIA over one shared panel; click and arrows select", async (T) => {
  const box = await mount(BAR);
  const bar = box.querySelector("ray-doc-tabs");
  const [a, b, c] = bar.tabs;
  const panel = box.querySelector("#dt-panel");
  const list = bar.shadowRoot.querySelector('[part="list"]');
  T.eq(list.getAttribute("role"), "tablist");
  T.eq(list.getAttribute("aria-label"), "Open files");
  T.eq([a, b, c].map((t) => t.getAttribute("role")).join(), "tab,tab,tab");
  T.eq([a, b, c].map((t) => t.getAttribute("aria-selected")).join(), "false,true,false");
  T.eq([a, b, c].map((t) => t.tabIndex).join(), "-1,0,-1", "roving tabindex");
  T.ok([a, b, c].every((t) => t.getAttribute("aria-controls") === "dt-panel"), "all control the one panel");
  T.eq(panel.getAttribute("role"), "tabpanel");
  T.eq(panel.getAttribute("aria-labelledby"), b.id);
  T.eq(a.getAttribute("aria-keyshortcuts"), "Delete");
  let changes = 0;
  bar.addEventListener("change", () => changes++);
  a.click();
  await T.settle();
  T.eq(bar.value, "a", "click selects");
  T.eq(panel.getAttribute("aria-labelledby"), a.id, "the panel follows");
  a.focus();
  key(a, "ArrowRight");
  await T.settle();
  T.eq(bar.value, "b", "ArrowRight selects the next");
  T.eq(document.activeElement, b, "and focuses it");
  key(b, "End");
  await T.settle();
  T.eq(bar.value, "c");
  key(c, "ArrowRight");
  await T.settle();
  T.eq(bar.value, "a", "wraps around");
  T.eq(changes, 4);
  box.remove();
});

T.test("doc tabs: ×, middle click and Delete ask; the app removes; the neighbour takes over", async (T) => {
  const box = await mount(BAR);
  const bar = box.querySelector("ray-doc-tabs");
  const [a, b, c] = bar.tabs;
  const asked = [];
  bar.addEventListener("ray-request-close", (e) => {
    asked.push(`${e.detail.value}:${e.detail.source}`);
    if (e.detail.tab.dirty) return; // the app would ask first; here it keeps it
    e.detail.tab.remove();
  });
  let changes = 0;
  bar.addEventListener("change", () => changes++);
  // The × of c: c is dirty, the app keeps it.
  c.shadowRoot.querySelector('[part="close"]').click();
  await T.settle();
  T.eq(bar.tabs.length, 3, "kept: closing is the app's");
  T.eq(bar.value, "b", "the × does not select its tab");
  // Delete on the focused, selected b: removed; c takes its place and the focus.
  b.focus();
  key(b, "Delete");
  await T.settle();
  await T.settle();
  T.eq(bar.tabs.map((t) => t.value).join(), "a,c");
  T.eq(bar.value, "c", "the tab at its place");
  T.eq(document.activeElement, c, "focused, since the closed tab had the focus");
  T.eq(changes, 1, "change for the new selection");
  // Middle click on a (not selected): removed, the selection stays.
  a.dispatchEvent(new MouseEvent("auxclick", { button: 1, bubbles: true }));
  await T.settle();
  T.eq(bar.tabs.map((t) => t.value).join(), "c");
  T.eq(bar.value, "c");
  T.eq(asked.join(), "c:button,b:key,a:middle");
  // The last tab: closing it leaves nothing selected.
  c.dirty = false;
  await T.settle();
  key(c, "Backspace");
  await T.settle();
  T.eq(bar.tabs.length, 0);
  T.eq(bar.value, undefined, "nothing left");
  T.eq(box.querySelector("#dt-panel").hasAttribute("aria-labelledby"), false);
  box.remove();
});

T.test("doc tabs: the selected last tab closed selects the one before; hide-close", async (T) => {
  const box = await mount(`<ray-doc-tabs value="c"><ray-doc-tab value="a" hide-close>Home</ray-doc-tab><ray-doc-tab value="b">b</ray-doc-tab><ray-doc-tab value="c">c</ray-doc-tab></ray-doc-tabs>`);
  const bar = box.querySelector("ray-doc-tabs");
  const [a, , c] = bar.tabs;
  let asked = 0;
  bar.addEventListener("ray-request-close", () => asked++);
  c.remove();
  await T.settle();
  T.eq(bar.value, "b", "the one before");
  key(a, "Delete");
  a.dispatchEvent(new MouseEvent("auxclick", { button: 1, bubbles: true }));
  await T.settle();
  T.eq(asked, 0, "a hide-close tab is never asked to close");
  T.eq(getComputedStyle(a.shadowRoot.querySelector('[part="close"]')).display, "none", "no ×");
  T.eq(a.hasAttribute("aria-keyshortcuts"), false);
  box.remove();
});

T.test("doc tabs: the unsaved mark — a dot, named for assistive technology", async (T) => {
  const box = await mount(`<ray-doc-tabs dirty-label="sin guardar" close-label="Cerrar"><ray-doc-tab value="a" dirty>a.ray</ray-doc-tab><ray-doc-tab value="b">b.ray</ray-doc-tab></ray-doc-tabs>`);
  const [a, b] = box.querySelector("ray-doc-tabs").tabs;
  const part = (t, p) => t.shadowRoot.querySelector(`[part="${p}"]`);
  T.eq(getComputedStyle(part(a, "dot")).display, "block", "dirty: the dot");
  T.eq(getComputedStyle(part(a, "close")).visibility, "hidden", "in place of the ×");
  T.eq(getComputedStyle(part(b, "dot")).display, "none");
  T.eq(a.shadowRoot.querySelector(".sr").textContent, ", sin guardar", "heard after the name");
  T.eq(b.shadowRoot.querySelector(".sr").textContent, "");
  T.eq(part(b, "close").title, "Cerrar", "the ×'s tooltip");
  T.eq(part(a, "close").parentElement.getAttribute("aria-hidden"), "true", "the × is the pointer's only");
  T.eq(part(a, "close").tabIndex, -1, "not focusable");
  box.remove();
});

T.test("doc tabs: more tabs than width scroll sideways, marked; the end slot stays", async (T) => {
  const tabs = Array.from({ length: 10 }, (_, i) => `<ray-doc-tab value="t${i}">Request number ${i}</ray-doc-tab>`).join("");
  const box = await mount(`<ray-doc-tabs style="width: 320px" value="t0">${tabs}<button slot="end">+</button></ray-doc-tabs>`);
  const bar = box.querySelector("ray-doc-tabs");
  const list = bar.shadowRoot.querySelector('[part="list"]');
  T.eq(bar.hasAttribute("data-overflow-end"), true, "more at the end");
  const plus = box.querySelector("button").getBoundingClientRect();
  T.ok(plus.right <= bar.getBoundingClientRect().right + 1 && plus.width > 0, "the end slot stays in view");
  bar.value = "t9";
  await T.settle();
  const last = bar.tabs[9].getBoundingClientRect();
  const l = list.getBoundingClientRect();
  T.ok(last.right <= l.right + 1 && last.left >= l.left - 1, "the selected tab scrolled into view");
  T.eq(bar.hasAttribute("data-overflow-start"), true);
  box.remove();
});
