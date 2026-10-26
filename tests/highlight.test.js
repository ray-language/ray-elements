// page: tests/pages/highlight.html
//
// `highlight` on ray-input and ray-textarea: ranges painted in a layer
// behind the text, kept in step with typing, values set from script and
// refreshHighlight(); kinds, parts, tooltips; the layer on the text.

const T = window.__rayTest;
await Promise.all(["ray-input", "ray-textarea"].map((t) => customElements.whenDefined(t)));
const { cleanRanges } = await import("../../src/core/textlayer.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const type = async (el, text) => {
  el.control.value = text;
  el.control.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await T.settle();
};
const marks = (el) => [...el.shadowRoot.querySelectorAll('[part~="highlight"]')];

// {{name}} placeholders; a name not in `known` is an error.
const known = new Set(["host"]);
function variables(text) {
  return [...text.matchAll(/\{\{([\w.-]+)\}\}/g)].map((m) => ({
    start: m.index,
    end: m.index + m[0].length,
    kind: known.has(m[1]) ? "var" : "error",
    title: known.has(m[1]) ? `${m[1]} = example.com` : `${m[1]} is not defined`,
  }));
}

T.test("highlight: cleanRanges keeps ranges in the text, sorted, without overlaps", (T) => {
  const out = cleanRanges([{ start: 8, end: 20 }, { start: 0, end: 3 }, { start: 2, end: 5 }, { start: 4, end: 4 }, null, { start: "x", end: 1 }], 10);
  T.eq(out.map((r) => `${r.start}-${r.end}`).join(), "0-3,8-10");
});

T.test("highlight: no function, no layer; ranges marked; typing and script keep it in step", async (T) => {
  const box = await mount(`<ray-input label="URL"></ray-input>`);
  const el = box.firstElementChild;
  T.eq(el.shadowRoot.querySelector('[part="text-layer"]'), null, "nothing until a highlight is set");
  el.highlight = variables;
  el.value = "https://{{host}}/{{path}}";
  await T.settle();
  T.eq(marks(el).map((m) => m.textContent).join(), "{{host}},{{path}}", "a value set from script");
  T.eq(marks(el).map((m) => m.getAttribute("part")).join(), "highlight highlight-var,highlight highlight-error");
  T.eq(el.shadowRoot.querySelector('[part="text-layer"]').getAttribute("aria-hidden"), "true");
  const err = getComputedStyle(marks(el)[1]);
  T.ok(err.textDecorationLine.includes("underline"), "error: underlined");
  T.eq(err.color, "rgba(0, 0, 0, 0)", "the layer's text is transparent: the control shows its own");
  await type(el, "{{host}}:8080");
  T.eq(marks(el).map((m) => m.textContent).join(), "{{host}}", "typing");
  known.add("path");
  el.value = "{{path}}";
  await T.settle();
  T.eq(marks(el)[0].dataset.kind, "var");
  known.delete("path");
  el.refreshHighlight();
  T.eq(marks(el)[0].dataset.kind, "error", "refreshHighlight runs it again on the same text");
  el.highlight = null;
  await T.settle();
  T.eq(marks(el).length, 0, "removed: no marks");
  box.remove();
});

T.test("highlight: the layer lies on the text; a range's title under the pointer", async (T) => {
  const box = await mount(`<ray-input label="URL" style="width: 360px"></ray-input>`);
  const el = box.firstElementChild;
  el.highlight = variables;
  el.value = "GET {{host}}/x";
  await T.settle();
  const layer = el.shadowRoot.querySelector('[part="text-layer"]');
  const c = el.control.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  T.ok(Math.abs(l.left - c.left) < 1 && Math.abs(l.top - c.top) < 1 && Math.abs(l.width - c.width) < 1, "over the control");
  T.eq(getComputedStyle(layer).fontSize, getComputedStyle(el.control).fontSize, "the same font");
  T.eq(getComputedStyle(layer).paddingLeft, getComputedStyle(el.control).paddingLeft, "and padding");
  // "GET " in the layer is as wide as in the control: measure with a canvas in the control's font.
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${getComputedStyle(el.control).fontSize} ${getComputedStyle(el.control).fontFamily}`;
  const expected = c.left + parseFloat(getComputedStyle(el.control).paddingLeft) + ctx.measureText("GET ").width;
  const m = marks(el)[0].getBoundingClientRect();
  T.ok(Math.abs(m.left - expected) < 2, `the mark starts where its text does (${m.left} ≈ ${expected})`);
  el.control.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: m.left + m.width / 2, clientY: m.top + m.height / 2 }));
  T.eq(el.control.title, "host = example.com", "the tooltip");
  el.control.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: c.right - 2, clientY: m.top + m.height / 2 }));
  T.eq(el.control.title, "", "off a range: none");
  box.remove();
});

T.test("highlight: ray-textarea, over several lines; a throwing function marks nothing", async (T) => {
  const box = await mount(`<ray-textarea label="Body" rows="4"></ray-textarea>`);
  const el = box.firstElementChild;
  el.highlight = variables;
  el.value = '{\n  "host": "{{host}}",\n  "id": "{{id}}"\n}\n';
  await T.settle();
  const [a, b] = marks(el);
  T.eq(`${a.textContent},${b.textContent}`, "{{host}},{{id}}");
  T.ok(b.getBoundingClientRect().top > a.getBoundingClientRect().top + 5, "the second on a lower line");
  const top = el.control.getBoundingClientRect().top + parseFloat(getComputedStyle(el.control).paddingTop);
  const line = parseFloat(getComputedStyle(el.control).lineHeight);
  T.ok(Math.abs(a.getBoundingClientRect().top - (top + line)) < line / 2, "on the second line, like its text");
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args[0]);
  el.highlight = () => { throw new Error("boom"); };
  await T.settle();
  console.error = original;
  T.eq(marks(el).length, 0);
  T.eq(errors.length, 1, "reported");
  box.remove();
});
