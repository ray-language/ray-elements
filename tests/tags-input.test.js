// page: tests/pages/tags-input.html
//
// <ray-tags-input>: free tags, suggestions under the field (filtered, case and
// accents aside), no dropdown, separators and paste, the keyboard, focus kept
// while typing, max, forms; and ray-combobox's chips after sharing their styles.

const T = window.__rayTest;
await customElements.whenDefined("ray-tags-input");
await customElements.whenDefined("ray-combobox");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const all = (el, sel) => [...el.shadowRoot.querySelectorAll(sel)];
const chips = (el) => all(el, ".chip .t").map((t) => t.textContent);
const shown = (el) => all(el, ".suggestion .t").map((t) => t.textContent);
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true }));
async function type(el, text) {
  const c = inner(el, "#control");
  c.value = text;
  c.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await T.settle();
}
const OPTIONS = ["Hipertensión", "Diabetes tipo 1", "Diabetes tipo 2", "Colesterol alto", "Hipotiroidismo", "Hipertiroidismo", "Asma", "EPOC"]
  .map((o) => `<option>${o}</option>`).join("");

T.test("tags-input: value, chips, suggestions under the field, nothing floats", async (T) => {
  const box = await mount(`<ray-tags-input label="Condiciones" value="Hipertensión,Lupus">${OPTIONS}</ray-tags-input>`);
  const el = box.firstElementChild;
  T.eq(JSON.stringify(el.value), '["Hipertensión","Lupus"]', "the value attribute is a list");
  T.eq(chips(el).join("|"), "Hipertensión|Lupus");
  T.eq(shown(el).join("|"), "Diabetes tipo 1|Diabetes tipo 2|Colesterol alto|Hipotiroidismo|Hipertiroidismo|Asma", "chosen ones left out, 6 by default");
  T.eq(inner(el, ".suggestions").getAttribute("role"), "group");
  T.eq(inner(el, ".suggestions").getAttribute("aria-label"), "Suggestions");
  T.eq(el.shadowRoot.querySelector("[popover]"), null, "no dropdown");
  inner(el, "#control").focus();
  inner(el, "#control").click();
  await T.settle();
  T.eq(el.shadowRoot.querySelector(":popover-open"), null, "focusing opens nothing");
  const sr = inner(el, ".suggestions").getBoundingClientRect();
  const br = inner(el, ".box").getBoundingClientRect();
  T.ok(sr.top >= br.bottom, `suggestions under the field (${sr.top} >= ${br.bottom})`);
  el.suggestionsLimit = 0;
  await T.settle();
  T.eq(shown(el).length, 7, "suggestions-limit=0: all");
  box.remove();
});

T.test("tags-input: typing filters (case and accents aside); Enter adds anything; no duplicates", async (T) => {
  const box = await mount(`<ray-tags-input>${OPTIONS}</ray-tags-input>`);
  const el = box.firstElementChild;
  const seen = [];
  el.addEventListener("input", () => seen.push("input"));
  el.addEventListener("change", () => seen.push("change"));
  await type(el, "HIPER");
  T.eq(shown(el).join("|"), "Hipertensión|Hipertiroidismo");
  await type(el, "tension");
  T.eq(shown(el).join("|"), "Hipertensión", "no accent needed");
  await type(el, "Fibromialgia ");
  key(inner(el, "#control"), "Enter");
  await T.settle();
  T.eq(JSON.stringify(el.value), '["Fibromialgia"]', "a tag that is not a suggestion, trimmed");
  T.eq(inner(el, "#control").value, "", "the field is emptied");
  T.eq(seen.join(), "input,change", "typing alone fires nothing: input and change mean the tags changed");
  await type(el, "fibromiálgia");
  key(inner(el, "#control"), "Enter");
  await T.settle();
  T.eq(el.value.length, 1, "the same tag again, case and accents aside: not added");
  T.eq(inner(el, "#control").value, "", "and the text goes");
  await type(el, "hipertension");
  key(inner(el, "#control"), "Enter");
  await T.settle();
  T.eq(shown(el).includes("Hipertensión"), false, "a typed tag hides its suggestion");
  const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  inner(el, "#control").dispatchEvent(enter);
  T.eq(enter.defaultPrevented, false, "Enter in an empty field is left alone (submits a form)");
  box.remove();
});

T.test("tags-input: separators, paste, Backspace, Escape, leaving the field", async (T) => {
  const box = await mount(`<button id="other">other</button><ray-tags-input>${OPTIONS}</ray-tags-input>`);
  const el = box.querySelector("ray-tags-input");
  await type(el, "penicilina, látex,polen");
  T.eq(JSON.stringify(el.value), '["penicilina","látex"]', "each complete piece is a tag");
  T.eq(inner(el, "#control").value, "polen", "the last piece stays in the field");
  await type(el, "polen,");
  T.eq(el.value.length, 3);
  const c = inner(el, "#control");
  key(c, "Backspace");
  await T.settle();
  T.eq(JSON.stringify(el.value), '["penicilina","látex"]', "Backspace in an empty field removes the last");
  await type(el, "asm");
  key(c, "Escape");
  await T.settle();
  T.eq(c.value, "", "Escape clears the text");
  T.eq(shown(el).length, 6, "and the filter");
  el.separators = "";
  await type(el, "a,b");
  T.eq(el.value.length, 2, "no separators: the comma is text");
  c.focus();
  box.querySelector("#other").focus();
  await T.settle();
  T.eq(el.value.at(-1), "a,b", "leaving the field adds what was typed");
  box.remove();
});

T.test("tags-input: a suggestion is added with a click; the field keeps the focus while typing", async (T) => {
  const box = await mount(`<ray-tags-input>${OPTIONS}</ray-tags-input>`);
  const el = box.firstElementChild;
  const c = inner(el, "#control");
  c.focus();
  await type(el, "diab");
  const b = all(el, ".suggestion")[1];
  const down = new PointerEvent("pointerdown", { bubbles: true, composed: true, cancelable: true });
  b.dispatchEvent(down);
  T.eq(down.defaultPrevented, true, "pressing a suggestion while typing does not take the focus");
  b.click();
  await T.settle();
  T.eq(JSON.stringify(el.value), '["Diabetes tipo 2"]');
  T.eq(c.value, "", "the typed text goes");
  T.eq(el.shadowRoot.activeElement, c, "focus back in the field");
  T.eq(shown(el).includes("Diabetes tipo 2"), false);
  // Keyboard: a focused suggestion, activated, passes the focus to the next one.
  all(el, ".suggestion")[0].focus();
  all(el, ".suggestion")[0].click();
  await T.settle();
  T.eq(el.value.length, 2);
  T.ok(el.shadowRoot.activeElement?.classList.contains("suggestion"), "focus stays on the suggestions");
  T.eq(el.shadowRoot.activeElement.textContent, shown(el)[0]);
  // A chip's button removes its tag.
  inner(el, ".chip button").click();
  await T.settle();
  T.eq(JSON.stringify(el.value), '["Hipertensión"]', "the first chip's × removes Diabetes tipo 2");
  box.remove();
});

T.test("tags-input: data, option values, max, addTag/removeTag, disabled", async (T) => {
  const box = await mount(`<ray-tags-input max="2"><option value="pcn">Penicilina</option><option>Látex</option><option disabled>Polen</option></ray-tags-input>`);
  const el = box.firstElementChild;
  T.eq(shown(el).join("|"), "Penicilina|Látex", "disabled options are not suggested");
  all(el, ".suggestion")[0].click();
  await T.settle();
  T.eq(JSON.stringify(el.value), '["pcn"]', "an option's value is what the tag stores");
  T.eq(chips(el)[0], "Penicilina", "its label is what it shows");
  T.eq(el.addTag("Huevo"), true);
  await T.settle();
  T.eq(shown(el).length, 0, "max reached: no suggestions");
  T.eq(inner(el, ".suggestions").hidden, true);
  T.eq(el.addTag("Maní"), false, "max reached: nothing more");
  T.eq(el.removeTag("HUEVO"), true, "removeTag, case aside");
  T.eq(el.removeTag("nope"), false);
  el.data = ["Uno", { value: "2", label: "Dos" }];
  await T.settle();
  T.eq(shown(el).join("|"), "Uno|Dos", "data replaces the options");
  el.value = "x, y";
  await T.settle();
  T.eq(JSON.stringify(el.tags), '["x","y"]', "a string value is read as a list");
  el.disabled = true;
  await T.settle();
  T.eq(inner(el, ".suggestions").hidden, true, "disabled: no suggestions");
  T.eq(inner(el, ".chip button").disabled, true, "nor removing");
  box.remove();
});

T.test("tags-input: form entries, required, reset", async (T) => {
  const box = await mount(`<form><ray-tags-input name="a" required value="x">${OPTIONS}</ray-tags-input></form>`);
  const form = box.firstElementChild;
  const el = form.firstElementChild;
  el.addTag("y");
  await T.settle();
  T.eq(new FormData(form).getAll("a").join(), "x,y", "one entry per tag");
  T.ok(el.checkValidity());
  el.value = [];
  await T.settle();
  T.eq(el.validity.valueMissing, true, "required");
  T.eq(new FormData(form).getAll("a").length, 0);
  await type(el, "half typed");
  form.reset();
  await T.settle();
  T.eq(JSON.stringify(el.value), '["x"]', "reset restores the value attribute");
  T.eq(inner(el, "#control").value, "", "and empties the field");
  box.remove();
});

T.test("combobox: chips keep their look with the shared styles", async (T) => {
  const box = await mount(`<ray-combobox multiple value="a"><option value="a">Alpha</option></ray-combobox>`);
  const cb = box.firstElementChild;
  const chip = inner(cb, ".chip");
  T.eq(getComputedStyle(chip).alignItems, "center");
  T.eq(getComputedStyle(chip).borderTopWidth, "1px");
  T.eq(getComputedStyle(chip).backgroundColor, T.computed("background: var(--ray-muted)"));
  T.eq(getComputedStyle(chip.querySelector("button")).width, "18px");
  T.eq(getComputedStyle(inner(cb, ".clear")).width, "22px", "the clear button keeps its own size");
  box.remove();
});
