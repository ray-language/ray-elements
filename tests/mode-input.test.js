// page: tests/pages/mode-input.html
//
// <ray-mode-input>: modes from <option> children or `options`, a mode's
// attributes on the field and back, the menu of radio items, the cancelable
// ray-mode-change, the trigger's name and display, a ray-input for the rest.

const T = window.__rayTest;
await customElements.whenDefined("ray-mode-input");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const items = (el) => [...inner(el, "ray-menu").querySelectorAll("ray-menu-item")];

const PART = `<ray-mode-input label="Part" placeholder="Value" name="part">
  <option value="text" label="Text"></option>
  <option value="file" label="File" data-icon="file" data-description="A file on disk" data-set-placeholder="Path to a file" data-set-spellcheck="false"></option>
  <option value="off" label="Off" disabled></option>
</ray-mode-input>`;

T.test("mode-input: modes from options; a mode's attributes on the field, and back", async (T) => {
  const box = await mount(PART);
  const el = box.firstElementChild;
  const input = inner(el, "input");
  T.eq(el.mode, "text", "the first mode by default");
  T.eq(el.getAttribute("mode"), "text", "reflected");
  T.eq(input.placeholder, "Value", "the field's own placeholder");
  T.eq(items(el).map((i) => `${i.type}:${i.value}:${i.checked}:${Boolean(i.disabled)}`).join(), "radio:text:true:false,radio:file:false:false,radio:off:false:true", "a radio item per mode");
  T.eq(inner(el, '[part="trigger"]').getAttribute("aria-label"), "Mode: Text", "the trigger names the mode");
  T.eq(inner(el, '[part="trigger-label"]').textContent, "Text", "no icon: the label");
  el.mode = "file";
  await T.settle();
  T.eq(input.placeholder, "Path to a file", "the mode's placeholder");
  T.eq(el.getAttribute("spellcheck"), "false");
  T.eq(inner(el, '[part="trigger-label"]').textContent, "", "an icon: only the icon");
  T.ok(inner(el, '[part="trigger-icon"]').querySelector("svg"), "painted");
  T.eq(items(el).map((i) => i.checked).join(), "false,true,false", "the check follows");
  T.ok(items(el)[1].textContent.includes("A file on disk"), "the description in the item");
  el.mode = "text";
  await T.settle();
  T.eq(input.placeholder, "Value", "the field's own placeholder back");
  T.eq(el.hasAttribute("spellcheck"), false, "an attribute it did not have, removed");
  box.remove();
});

T.test("mode-input: choosing in the menu fires a cancelable ray-mode-change", async (T) => {
  const box = await mount(PART);
  const el = box.firstElementChild;
  const seen = [];
  let cancel = false;
  el.addEventListener("ray-mode-change", (e) => {
    seen.push(`${e.detail.previous}→${e.detail.mode}:${e.detail.option.label}:${el.mode}`);
    if (cancel) e.preventDefault();
  });
  const menu = inner(el, "ray-menu");
  let selects = 0;
  box.addEventListener("ray-select", () => selects++);
  items(el)[1].click();
  await T.settle();
  T.eq(el.mode, "file");
  T.eq(selects, 0, "the menu's ray-select stays inside");
  T.eq(el.shadowRoot.activeElement, inner(el, "input"), "the focus back in the field");
  cancel = true;
  items(el)[0].click();
  await T.settle();
  T.eq(el.mode, "file", "cancelled: the previous mode");
  T.eq(items(el).map((i) => i.checked).join(), "false,true,false", "and its check");
  cancel = false;
  el.choose("off");
  el.choose("file");
  el.choose("nope");
  await T.settle();
  T.eq(seen.join(" | "), "text→file:File:file | file→text:Text:text", "a disabled, current or unknown mode fires nothing");
  inner(el, "input").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(menu.open, true, "Alt+ArrowDown opens the menu");
  menu.open = false;
  box.remove();
});

T.test("mode-input: options from script, display, position, a ray-input underneath", async (T) => {
  const box = await mount(`<form><ray-mode-input name="amount" label="Amount" display="label" position="end" required></ray-mode-input></form>`);
  const form = box.firstElementChild;
  const el = form.firstElementChild;
  el.options = [
    { value: "eur", label: "Euro", hint: "€", attrs: { pattern: "\\d+" } },
    { value: "usd", label: "US dollar", hint: "$", icon: "star" },
  ];
  await T.settle();
  T.eq(el.mode, "eur");
  T.eq(inner(el, '[part="trigger-label"]').textContent, "€", "the hint, short");
  T.eq(inner(el, '[part="trigger"]').getAttribute("aria-label"), "Mode: Euro", "the name says the label");
  const input = inner(el, "input");
  const trigger = inner(el, '[part="trigger"]');
  T.ok(trigger.getBoundingClientRect().left > input.getBoundingClientRect().left, "position=end: after the text");
  el.mode = "usd";
  el.display = "both";
  await T.settle();
  T.eq(inner(el, '[part="trigger-label"]').textContent, "$");
  T.ok(inner(el, '[part="trigger-icon"]').querySelector("svg"), "both: icon and hint");
  T.eq(el.validity.valueMissing, true, "required, as a ray-input");
  input.value = "12";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await T.settle();
  T.eq(new FormData(form).get("amount"), "12", "the form gets the value");
  el.disabled = true;
  await T.settle();
  T.eq(trigger.disabled, true, "disabled with the field");
  box.remove();
});
