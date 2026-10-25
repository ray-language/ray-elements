// page: docs/components/all.html
//
// Phase 4 in the real webview: progress, slider, stat, empty state, status
// bar, nav link, split, table, command palette.

const T = window.__rayTest;
const tags = ["ray-progress", "ray-slider", "ray-stat", "ray-empty-state", "ray-statusbar", "ray-statusbar-item", "ray-nav-link", "ray-split", "ray-table", "ray-command-palette"];
await Promise.all(tags.map((t) => customElements.whenDefined(t)));
const { score } = await import("../../src/components/command-palette/command-palette.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));
const inner = (host, sel) => host.shadowRoot.querySelector(sel);

T.test("progress: progressbar values, indeterminate", async (T) => {
  const box = await mount(`<ray-progress value="25" max="50" label="Upload"></ray-progress><ray-progress></ray-progress>`);
  const [p, ind] = box.children;
  T.eq(p.internals.role, "progressbar");
  T.eq(p.internals.ariaValueNow, "25");
  T.eq(p.internals.ariaValueMax, "50");
  T.eq(p.internals.ariaValueText, "50%");
  T.eq(p.internals.ariaLabel, "Upload");
  T.eq(inner(ind, ".track").hasAttribute("data-indeterminate"), true);
  T.eq(ind.internals.ariaValueNow, null, "no value when indeterminate");
  box.remove();
});

T.test("slider: value, FormData, unit, marks, reset", async (T) => {
  const box = await mount(`<form><ray-slider name="vol" value="40" min="0" max="80" unit="%" show-value label="Volume"></ray-slider></form>`);
  const form = box.querySelector("form");
  const s = form.querySelector("ray-slider");
  T.eq(new FormData(form).get("vol"), "40");
  T.eq(s.control.getAttribute("aria-valuetext"), "40%");
  T.eq(s.control.labels[0].querySelector(".label-text").textContent, "Volume");
  let inputs = 0;
  s.addEventListener("input", () => inputs++);
  s.control.value = "60";
  s.control.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  T.eq(s.value, 60);
  T.eq(inputs, 1);
  T.eq(new FormData(form).get("vol"), "60");
  T.eq(inner(s, ".value").textContent, "60%");
  s.marks = [0, 40, { value: 80, label: "max" }];
  await T.settle();
  T.eq([...s.shadowRoot.querySelectorAll(".mark")].map((m) => m.textContent).join(), "0,40,max");
  form.reset();
  await T.settle();
  T.eq(s.value, 40, "reset");
  box.remove();
});

T.test("stat: trend, inverse, accessible diff", async (T) => {
  const box = await mount(`<ray-stat label="Users" value="10" diff="5"></ray-stat><ray-stat label="Errors" value="3" diff="-2" inverse></ray-stat>`);
  const [up, down] = box.children;
  T.eq(inner(up, ".diff").dataset.trend, "up");
  T.eq(inner(up, ".diff").getAttribute("aria-label"), "Up 5%");
  T.eq(inner(up, ".diff").textContent, "+5%");
  T.eq(inner(down, ".diff").dataset.trend, "down");
  T.eq(getComputedStyle(inner(down, ".diff")).color, getComputedStyle(inner(up, ".diff")).color, "inverse: down shown as good");
  box.remove();
});

T.test("empty state and status bar", async (T) => {
  const box = await mount(`<ray-empty-state label="Nothing"><button slot="actions">Add</button>Text</ray-empty-state>
    <ray-statusbar><ray-statusbar-item action label="2 errors">✕ 2</ray-statusbar-item><ray-statusbar-item slot="right">Ln 1</ray-statusbar-item></ray-statusbar>`);
  const es = box.querySelector("ray-empty-state");
  T.eq(inner(es, ".title").textContent, "Nothing");
  T.eq(inner(es, ".actions").hasAttribute("data-filled"), true);
  const [act, plain] = box.querySelectorAll("ray-statusbar-item");
  T.eq(inner(act, ".item").localName, "button");
  T.eq(inner(act, ".item").getAttribute("aria-label"), "2 errors");
  T.eq(inner(plain, ".item").localName, "span");
  T.eq(box.querySelector("ray-statusbar").getAttribute("aria-label"), "Status bar");
  box.remove();
});

T.test("nav link: link, aria-current, nested toggle", async (T) => {
  const box = await mount(`<ray-nav-link label="Home" href="#home" active></ray-nav-link>
    <ray-nav-link label="Settings"><ray-nav-link label="General" href="#g"></ray-nav-link></ray-nav-link>`);
  const [home, settings] = box.querySelectorAll(":scope > ray-nav-link");
  const a = inner(home, ".link");
  T.eq(a.localName, "a");
  T.eq(a.getAttribute("aria-current"), "page");
  const b = inner(settings, ".link");
  T.eq(b.localName, "button", "a parent toggles");
  T.eq(b.getAttribute("aria-expanded"), "false");
  T.ok(inner(settings, ".chevron svg"), "a parent draws its chevron");
  const kids = inner(settings, ".children");
  T.eq(kids.getBoundingClientRect().height, 0, "collapsed: no height");
  T.eq(kids.inert, true, "collapsed children are inert");
  let toggled = null;
  settings.addEventListener("ray-toggle", (e) => { toggled = e.detail.opened; });
  b.click();
  await T.settle();
  T.eq(settings.opened, true);
  T.eq(toggled, true);
  T.eq(b.getAttribute("aria-expanded"), "true");
  T.ok(kids.getBoundingClientRect().height > 0, "expanded: its children's height");
  T.eq(kids.inert, false, "expanded children are reachable");
  box.remove();
});

T.test("split: keyboard, clamping, collapse, drag, autosave", async (T) => {
  try { localStorage.removeItem("ray-split:test"); } catch {}
  const html = `<ray-split position="200" min="100" max="300" autosave="test" style="width: 600px; height: 200px"><div slot="start">a</div><div slot="end">b</div></ray-split>`;
  const box = await mount(html);
  const split = box.querySelector("ray-split");
  const d = split.divider;
  T.eq(Math.round(split.size), 200);
  T.eq(d.getAttribute("role"), "separator");
  T.eq(d.getAttribute("aria-orientation"), "vertical");
  T.eq(d.getAttribute("aria-valuenow"), "33");
  let resized = null;
  split.addEventListener("ray-resize", (e) => { resized = e.detail; });
  key(d, "ArrowRight");
  await T.settle();
  T.eq(Math.round(split.size), 210, "+10");
  key(d, "ArrowRight", { shiftKey: true });
  await T.settle();
  T.eq(Math.round(split.size), 260, "+50 with Shift");
  key(d, "End");
  await T.settle();
  T.eq(Math.round(split.size), 300, "End = max");
  key(d, "ArrowRight");
  await T.settle();
  T.eq(Math.round(split.size), 300, "clamped to max");
  key(d, "Home");
  await T.settle();
  T.eq(Math.round(split.size), 100, "Home = min");
  T.eq(resized.size, 100);
  key(d, "Enter");
  await T.settle();
  T.eq(split.collapsed, true);
  T.eq(Math.round(split.size), 0, "collapsed");
  key(d, "Enter");
  await T.settle();
  T.eq(Math.round(split.size), 100, "restored");
  // Drag with pointer events.
  const r = split.getBoundingClientRect();
  d.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 7, clientX: r.left + 100, clientY: r.top + 10 }));
  d.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 7, clientX: r.left + 180, clientY: r.top + 10 }));
  d.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 7, clientX: r.left + 240, clientY: r.top + 10 }));
  await T.settle();
  T.eq(Math.round(split.size), 240, "dragged");
  T.eq(split.hasAttribute("data-dragging"), false);
  box.remove();
  // A new split with the same autosave key comes back at the saved size.
  const again = await mount(html);
  T.eq(Math.round(again.querySelector("ray-split").size), 240, "autosave restored");
  again.remove();
  try { localStorage.removeItem("ray-split:test"); } catch {}
});

T.test("table: rows, text-only cells, nodes, sorting with aria-sort", async (T) => {
  const box = await mount(`<ray-table label="Apps"></ray-table>`);
  const t = box.firstElementChild;
  t.columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "size", label: "Size", sortable: true, align: "right" },
    { key: "tag", label: "Tag", render: (r) => { const b = document.createElement("b"); b.textContent = r.name; return b; } },
  ];
  t.data = [
    { id: "a", name: "beta", size: 10 },
    { id: "b", name: "<i>alpha</i>", size: 2 },
    { id: "c", name: "gamma", size: 100 },
  ];
  await T.settle();
  const cells = (col) => [...t.shadowRoot.querySelectorAll("tbody tr")].map((tr) => tr.children[col].textContent);
  T.eq(cells(0).join(), "beta,<i>alpha</i>,gamma", "text, never HTML");
  T.eq(t.shadowRoot.querySelector("tbody i"), null, "no <i> element created");
  T.eq(t.shadowRoot.querySelector("tbody td b").textContent, "beta", "render() may return a node");
  T.eq(t.shadowRoot.querySelector("caption").textContent, "Apps");
  const sortBtn = (k) => [...t.shadowRoot.querySelectorAll(".sort")].find((b) => b.dataset.key === k);
  const th = (k) => sortBtn(k).closest("th");
  let sorted = null;
  t.addEventListener("ray-sort", (e) => { sorted = e.detail; });
  sortBtn("size").click();
  await T.settle();
  T.eq(cells(1).join(), "2,10,100", "numeric ascending");
  T.eq(th("size").getAttribute("aria-sort"), "ascending");
  T.eq(sorted.direction, "asc");
  sortBtn("size").focus();
  sortBtn("size").click();
  await T.settle();
  T.eq(cells(1).join(), "100,10,2", "descending");
  T.eq(document.activeElement === t && t.shadowRoot.activeElement === sortBtn("size"), true, "focus kept on the sort button");
  sortBtn("size").click();
  await T.settle();
  T.eq(cells(1).join(), "10,2,100", "third click: original order");
  T.eq(th("size").getAttribute("aria-sort"), "none");
  box.remove();
});

T.test("table: selection, select all, row click and keyboard, empty slot", async (T) => {
  const box = await mount(`<ray-table selectable clickable-rows></ray-table><ray-table><span slot="empty">Nothing here</span></ray-table>`);
  const [t, empty] = box.children;
  t.columns = [{ key: "n", label: "N" }];
  t.data = [{ id: 1, n: "one" }, { id: 2, n: "two" }, { id: 3, n: "three" }];
  await T.settle();
  const rowBoxes = () => [...t.shadowRoot.querySelectorAll("tbody input")];
  const all = () => t.shadowRoot.querySelector('thead input[data-role="all"]');
  let sel = null;
  t.addEventListener("ray-selection-change", (e) => { sel = e.detail.selection; });
  rowBoxes()[1].focus();
  rowBoxes()[1].click();
  await T.settle();
  T.eq(sel.join(), "2");
  T.eq(all().indeterminate, true, "some selected");
  T.eq(t.shadowRoot.activeElement, rowBoxes()[1], "focus restored to the same checkbox");
  T.eq(t.shadowRoot.querySelectorAll('tbody tr[aria-selected="true"]').length, 1);
  all().click();
  await T.settle();
  T.eq(sel.join(), "1,2,3", "select all");
  all().click();
  await T.settle();
  T.eq(sel.join(), "", "none");
  let clicked = null;
  t.addEventListener("ray-row-click", (e) => { clicked = e.detail.row.n; });
  t.shadowRoot.querySelectorAll("tbody tr")[2].children[1].click();
  T.eq(clicked, "three", "row click");
  clicked = null;
  rowBoxes()[0].click();
  T.eq(clicked, null, "a click on the checkbox is not a row click");
  const tr0 = t.shadowRoot.querySelector("tbody tr");
  tr0.focus();
  key(tr0, "ArrowDown");
  T.eq(t.shadowRoot.activeElement, t.shadowRoot.querySelectorAll("tbody tr")[1], "ArrowDown moves between rows");
  key(t.shadowRoot.activeElement, "Enter");
  T.eq(clicked, "two", "Enter activates the row");
  empty.columns = [{ key: "x", label: "X" }];
  empty.data = [];
  await T.settle();
  const slot = empty.shadowRoot.querySelector("tbody slot");
  T.ok(slot && slot.assignedElements()[0]?.textContent === "Nothing here", "slotted empty state in the body");
  box.remove();
});

T.test("palette: scoring", (T) => {
  const open = { label: "Open file…", keywords: ["load"] };
  const fmt = { label: "Format document", description: "ray fmt" };
  T.ok(score(open, "open") > score(open, "file"), "prefix beats word start");
  T.ok(score(open, "load") > 0, "keywords");
  T.ok(score(open, "opf") > 0, "close subsequence");
  T.eq(score(fmt, "run"), 0, "scattered letters do not match");
  T.eq(score(fmt, "zzz"), 0);
  T.ok(score(fmt, "fmt") > 0, "description");
});

// The page's own palettes (the site search, the docs example) lose their
// hotkey while a test mounts its own; the returned function gives it back.
function silencePagePalettes() {
  const saved = [...document.querySelectorAll("ray-command-palette")].map((p) => [p, p.hotkey]);
  for (const [p] of saved) p.hotkey = "";
  return () => { for (const [p, hotkey] of saved) p.hotkey = hotkey; };
}

T.test("palette: the keyboard hint and the accessible name translate", async (T) => {
  const box = await mount(`<ray-command-palette hotkey="" label="Paleta de comandos" navigate-label="moverse" run-label="ejecutar"></ray-command-palette>`);
  const p = box.querySelector("ray-command-palette");
  const hint = () => p.shadowRoot.querySelector('[part="hint"]').textContent.replace(/\s+/g, " ").trim();
  T.eq(hint(), "↑↓ moverse↵ ejecutaresc close", "attributes, and the default where none is given");
  p.closeLabel = "cerrar";
  await T.settle();
  T.eq(hint(), "↑↓ moverse↵ ejecutaresc cerrar", "the property");
  T.eq(p.input.getAttribute("aria-label"), "Paleta de comandos");
  box.remove();
});

T.test("palette: hotkey, filter, combobox ARIA, run, close", async (T) => {
  // The docs page has its own palettes (the site search takes ⌘K): silence them here.
  const restore = silencePagePalettes();
  const box = await mount(`<button id="before">x</button><ray-command-palette></ray-command-palette>`);
  const p = box.querySelector("ray-command-palette");
  let ran = [];
  p.actions = [
    { id: "new", label: "New file", group: "File", shortcut: "⌘ N", onSelect: (a) => ran.push(a.id) },
    { id: "save", label: "Save", group: "File", disabled: true, onSelect: (a) => ran.push(a.id) },
    { id: "run", label: "Run program", group: "Raylang", onSelect: (a) => ran.push(a.id) },
    { id: "test", label: "Run tests", group: "Raylang", onSelect: (a) => ran.push(a.id) },
  ];
  const before = box.querySelector("#before");
  before.focus();
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(p.open, true, "hotkey opens");
  T.eq(p.dialog.matches(":modal"), true);
  T.eq(p.shadowRoot.activeElement, p.input, "focus in the search field");
  T.eq(p.input.getAttribute("role"), "combobox");
  T.eq(p.shadowRoot.querySelectorAll('[role="option"]').length, 4);
  p.input.value = "run";
  p.input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await T.settle();
  const options = () => [...p.shadowRoot.querySelectorAll('[role="option"]')];
  T.eq(options().map((o) => o.querySelector(".label").textContent).join(), "Run program,Run tests");
  T.eq(p.input.getAttribute("aria-activedescendant"), options()[0].id);
  T.eq(options()[0].querySelector("mark").textContent, "Run", "match highlighted");
  key(p.input, "ArrowDown");
  T.eq(p.input.getAttribute("aria-activedescendant"), options()[1].id);
  T.eq(options()[1].getAttribute("aria-selected"), "true");
  let selected = null;
  p.addEventListener("ray-select", (e) => { selected = e.detail.action.id; });
  key(p.input, "Enter");
  await T.settle();
  T.eq(ran.join(), "test", "onSelect called");
  T.eq(selected, "test", "ray-select fired");
  T.eq(p.open, false, "closes after running");
  T.eq(document.activeElement, before, "focus returned");
  p.show();
  await T.settle();
  T.eq(p.input.value, "run", "query kept, selected for retyping");
  p.query = "save";
  await T.settle();
  key(p.input, "Enter");
  await T.settle();
  T.eq(ran.join(), "test", "disabled action does not run");
  p.hide();
  await T.settle();
  p.hotkey = "";
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: mac, ctrlKey: !mac, bubbles: true }));
  await T.settle();
  T.eq(p.open, false, "empty hotkey disables it");
  box.remove();
  restore();
});

T.test("palette: two palettes, one hotkey: only one opens", async (T) => {
  const restore = silencePagePalettes();
  const box = await mount(`<ray-command-palette></ray-command-palette><ray-command-palette></ray-command-palette>`);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true }));
  await T.settle();
  T.eq([...box.children].filter((p) => p.open).length, 1);
  for (const p of box.children) p.hide();
  await T.settle();
  box.remove();
  restore();
});
