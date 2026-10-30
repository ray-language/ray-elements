// page: tests/pages/highlight.html
//
// `complete` on ray-input and ray-textarea: the list under the text it
// replaces, the combobox ARIA, the keys taken only while it is open,
// accepting by key or pointer, async answers (a stale one ignored).

const T = window.__rayTest;
await Promise.all(["ray-input", "ray-textarea"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const key = (el, k, opts = {}) => {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...opts });
  el.dispatchEvent(e);
  return e;
};
// Types `text` at the end, as an input event with the caret after it.
const type = async (el, text) => {
  const c = el.control;
  c.focus();
  c.value = text;
  c.setSelectionRange(text.length, text.length);
  c.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await T.settle();
  await T.settle();
};
const list = (el) => el.shadowRoot.querySelector('[part="suggestions"]');
const options = (el) => [...list(el).querySelectorAll('[role="option"]')];

const NAMES = ["host", "home", "token"];
// After an unclosed {{, the names that start with what is typed.
function variables(text, caret) {
  const open = text.lastIndexOf("{{", caret);
  if (open < 0 || text.slice(open, caret).includes("}}")) return null;
  const partial = text.slice(open + 2, caret);
  if (!/^[\w.-]*$/.test(partial)) return null;
  const items = NAMES.filter((n) => n.startsWith(partial)).map((n) => ({ value: `${n}}}`, label: n, detail: `${n} value` }));
  return { from: open + 2, to: caret, items };
}

T.test("complete: a list under the text, combobox ARIA, arrows, Enter accepts without submitting", async (T) => {
  const box = await mount(`<form><ray-input name="url" label="URL" style="width: 400px"></ray-input></form>`);
  const form = box.firstElementChild;
  const el = form.firstElementChild;
  const c = el.control;
  let submitted = 0;
  form.addEventListener("submit", (e) => { e.preventDefault(); submitted++; });
  const calls = [];
  el.complete = (text, caret) => { calls.push(`${text}@${caret}`); return variables(text, caret); };
  await T.settle();
  T.eq(c.getAttribute("role"), "combobox");
  T.eq(c.getAttribute("aria-autocomplete"), "list");
  T.eq(c.getAttribute("aria-expanded"), "false");
  await type(el, "https://{{ho");
  T.eq(calls.at(-1), "https://{{ho@12", "called with the text and the caret");
  T.eq(list(el).matches(":popover-open"), true, "open, in the top layer");
  T.eq(c.getAttribute("aria-expanded"), "true");
  T.eq(c.getAttribute("aria-controls"), list(el).id);
  T.eq(list(el).getAttribute("role"), "listbox");
  T.eq(options(el).map((o) => o.querySelector(".s-label").textContent).join(), "host,home");
  T.eq(c.getAttribute("aria-activedescendant"), options(el)[0].id, "the first is active");
  const l = list(el).getBoundingClientRect();
  const field = c.getBoundingClientRect();
  const room = innerHeight - field.bottom - 8 >= l.height + 4;
  T.ok(room ? l.top >= field.bottom - 2 : l.bottom <= field.top + 2, `below the field, or above without room (${Math.round(l.top)}–${Math.round(l.bottom)} vs ${Math.round(field.top)}–${Math.round(field.bottom)}, ${innerHeight})`);
  T.ok(l.left > field.left + 30, `under the {{, not the field's start (${l.left} vs ${field.left})`);
  T.eq(key(c, "ArrowDown").defaultPrevented, true);
  T.eq(c.getAttribute("aria-activedescendant"), options(el)[1].id, "ArrowDown moves");
  let completed = null;
  el.addEventListener("ray-complete", (e) => { completed = e.detail; });
  key(c, "Enter");
  await T.settle();
  T.eq(c.value, "https://{{home}}", "the part replaced");
  T.eq(el.value, "https://{{home}}", "an ordinary input: the value follows");
  T.eq(c.selectionStart, 16, "the caret after it");
  T.eq(completed?.item.label, "home");
  T.eq(`${completed?.from}-${completed?.to}`, "10-12");
  T.eq(list(el).matches(":popover-open"), false, "closed");
  T.eq(submitted, 0, "Enter did not submit");
  key(c, "Enter");
  await T.settle();
  T.eq(submitted, 1, "closed, Enter is the field's again");
  box.remove();
});

T.test("complete: Escape closes and stays in the field; nothing to suggest closes; blur closes", async (T) => {
  const box = await mount(`<ray-input label="URL"></ray-input>`);
  const el = box.firstElementChild;
  const c = el.control;
  el.complete = variables;
  await T.settle();
  let outside = 0;
  box.addEventListener("keydown", (e) => { if (e.key === "Escape") outside++; });
  await type(el, "{{t");
  T.eq(options(el).length, 1);
  key(c, "Escape");
  await T.settle();
  T.eq(list(el).matches(":popover-open"), false, "Escape closes");
  T.eq(outside, 0, "and does not reach a dialog around");
  key(c, "Escape");
  T.eq(outside, 1, "closed, Escape goes on");
  key(c, " ", { ctrlKey: true });
  await T.settle();
  await T.settle();
  T.eq(list(el).matches(":popover-open"), true, "Ctrl+Space asks again");
  await type(el, "{{tx");
  T.eq(list(el).matches(":popover-open"), false, "no match: closed");
  await type(el, "{{h");
  T.eq(list(el).matches(":popover-open"), true);
  c.blur();
  await T.settle();
  T.eq(list(el).matches(":popover-open"), false, "blur closes");
  box.remove();
});

T.test("complete: a click on a suggestion accepts it; async answers, a stale one ignored", async (T) => {
  const box = await mount(`<ray-textarea label="Body"></ray-textarea>`);
  const el = box.firstElementChild;
  const c = el.control;
  const pending = [];
  el.complete = (text, caret) => new Promise((resolve) => pending.push(() => resolve(variables(text, caret))));
  await T.settle();
  await type(el, "a\n{{h");
  await type(el, "a\n{{to");
  T.eq(pending.length, 2);
  pending[1]();
  await T.settle();
  await T.settle();
  T.eq(options(el).map((o) => o.querySelector(".s-label").textContent).join(), "token", "the latest answer");
  pending[0]();
  await T.settle();
  await T.settle();
  T.eq(options(el).map((o) => o.querySelector(".s-label").textContent).join(), "token", "the older one, arriving late, is ignored");
  const option = options(el)[0];
  T.eq(option.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true })), false, "pointerdown keeps the focus");
  option.click();
  await T.settle();
  T.eq(c.value, "a\n{{token}}");
  T.eq(c.getAttribute("role"), null, "a textarea keeps its textbox role");
  T.eq(c.getAttribute("aria-autocomplete"), "list");
  box.remove();
});

T.test("complete: the label in the mono font, the description in the interface's, a part each", async (T) => {
  const box = await mount(`<ray-input label="URL"></ray-input>`);
  const el = box.firstElementChild;
  el.complete = () => ({ from: 0, to: 0, items: [{ value: "a", label: "a", detail: "1", description: "From the Default environment" }] });
  await T.settle();
  await type(el, "x");
  const [o] = options(el);
  const part = (p) => o.querySelector(`[part="${p}"]`);
  T.eq(part("suggestion-label").textContent, "a", "the label alone");
  T.eq(part("suggestion-detail").textContent, "1");
  T.eq(part("suggestion-description").textContent, "From the Default environment");
  const font = (n) => getComputedStyle(n).fontFamily;
  T.ok(font(part("suggestion-description")) !== font(part("suggestion-label")), `not the label's font (${font(part("suggestion-description"))})`);
  T.eq(font(part("suggestion-description")), font(list(el)), "the list's font");
  box.remove();
});
