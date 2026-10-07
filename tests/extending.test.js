// page: examples/extending/index.html
//
// The extension API from an app's point of view: components built only on
// the public API of @ray-ds/elements (the page maps it to packages/elements).

const T = window.__rayTest;
const ds = await import("@ray-ds/elements");
await Promise.all(["app-save-button", "app-color-field", "app-hover-card", "ray-button", "ray-badge"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (host, sel) => host.shadowRoot.querySelector(sel);

T.test("level 1: app-save-button is a ray-button with a dirty state", async (T) => {
  const box = await mount(`<form><app-save-button type="submit" variant="light" dirty>Save</app-save-button></form>`);
  const b = box.querySelector("app-save-button");
  T.ok(b instanceof ds.RayButton, "instanceof RayButton");
  const button = inner(b, '[part="button"]');
  T.eq(button.dataset.variant, "light", "ray-button variants");
  T.ok(getComputedStyle(inner(b, ".dot")).display !== "none", "own styles");
  T.eq(button.getAttribute("aria-description"), "Unsaved changes");
  let submitted = false;
  box.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); submitted = true; });
  b.click();
  T.eq(submitted, true, "ray-button's form submit");
  b.dirty = false;
  await T.settle();
  T.eq(getComputedStyle(inner(b, ".dot")).display, "none");
  box.remove();
});

T.test("level 2: app-color-field gets the whole field from FieldControl", async (T) => {
  const box = await mount(`<form><fieldset><app-color-field name="accent" label="Accent" description="Links" value="#112233" required></app-color-field></fieldset></form>`);
  const form = box.querySelector("form");
  const f = form.querySelector("app-color-field");
  T.ok(f instanceof ds.FieldControl, "instanceof FieldControl");
  T.eq(f.control.labels[0].querySelector(".label-text").textContent, "Accent", "label wired");
  T.eq(f.control.getAttribute("aria-describedby"), "description");
  T.eq(inner(f, ".required").hidden, false, "required asterisk");
  T.eq(new FormData(form).get("accent"), "#112233", "form value");
  f.control.value = "#ff0000";
  f.control.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  T.eq(f.value, "#ff0000");
  T.eq(f.hasAttribute("value"), true, "the user's change is not reflected…");
  T.eq(f.getAttribute("value"), "#112233", "…the attribute stays the initial value");
  T.eq(new FormData(form).get("accent"), "#ff0000");
  f.error = "Too bright";
  await T.settle();
  T.eq(f.control.getAttribute("aria-invalid"), "true");
  form.reset();
  await T.settle();
  T.eq(f.value, "#112233", "reset");
  box.querySelector("fieldset").disabled = true;
  await T.settle();
  T.eq(f.control.disabled, true, "disabled by the fieldset");
  T.eq(new FormData(form).has("accent"), false, "not submitted while disabled");
  box.remove();
});

T.test("level 3: app-hover-card gets the overlay from Floating", async (T) => {
  const box = await mount(`<div style="position: fixed; top: 20px; left: 20px"><app-hover-card open-delay="0" close-delay="0"><a slot="trigger" href="#x">@ray</a><p>Card</p></app-hover-card></div>`);
  const card = box.querySelector("app-hover-card");
  const link = box.querySelector("a");
  T.ok(card instanceof ds.Floating, "instanceof Floating");
  T.eq(link.hasAttribute("aria-haspopup"), false, "haspopup = null");
  let opened = 0;
  card.addEventListener("ray-open", () => opened++);
  link.focus();
  await new Promise((r) => setTimeout(r, 20));
  await T.settle();
  T.eq(card.open, true, "focus opens it");
  T.eq(card.panel.matches(":popover-open"), true, "in the top layer");
  T.eq(opened, 1, "Floating's ray-open");
  T.ok(card.panel.getBoundingClientRect().top >= link.getBoundingClientRect().bottom, "placed below the trigger");
  link.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
  await T.settle();
  T.eq(card.open, false, "Escape closes");
  box.remove();
});

T.test("extendStyles reaches live instances and subclasses", async (T) => {
  const box = await mount(`<ray-button variant="brand">A</ray-button><app-save-button variant="brand">B</app-save-button>`);
  const [a, b] = box.children;
  // (no transition: the computed value is read at once)
  ds.RayButton.extendStyles(ds.css`[data-variant="brand"] { background: rgb(1, 2, 3); color: rgb(250, 250, 250); transition: none; }`);
  T.eq(getComputedStyle(inner(a, '[part="button"]')).backgroundColor, "rgb(1, 2, 3)", "live ray-button");
  T.eq(getComputedStyle(inner(b, '[part="button"]')).backgroundColor, "rgb(1, 2, 3)", "live subclass");
  const later = await mount(`<ray-button variant="brand">C</ray-button>`);
  T.eq(getComputedStyle(inner(later.firstElementChild, '[part="button"]')).backgroundColor, "rgb(1, 2, 3)", "new instance");
  box.remove();
  later.remove();
});

T.test("configure({ defaults }): unset properties only", async (T) => {
  ds.configure({ defaults: { "ray-badge": { variant: "filled", color: "teal" } } });
  const box = await mount(`<ray-badge>A</ray-badge><ray-badge variant="outline">B</ray-badge>`);
  const [a, b] = box.children;
  T.eq(a.getAttribute("variant"), "filled", "default applied and reflected");
  T.eq(a.color, "teal");
  T.eq(b.variant, "outline", "an attribute wins");
  T.eq(b.color, "teal", "other defaults still apply");
  T.eq(ds.getDefaults("ray-badge").variant, "filled");
  ds.configure({ defaults: { "ray-badge": { variant: undefined, color: undefined } } });
  box.remove();
});

T.test("subclass members named like old internals do not break properties", async (T) => {
  class Clashing extends ds.RayButton {
    _values = "mine";
    _changed = "mine";
    _set() { return "mine"; }
    _get() { return "mine"; }
    _store() { return "mine"; }
  }
  ds.define("app-clashing-button", Clashing);
  const box = await mount(`<app-clashing-button variant="outline">X</app-clashing-button>`);
  const el = box.firstElementChild;
  T.eq(el.variant, "outline", "attribute -> property");
  el.size = "lg";
  await T.settle();
  T.eq(el.getAttribute("size"), "lg", "property -> attribute");
  T.eq(inner(el, '[part="button"]').dataset.variant, "outline", "rendered");
  T.eq(el._values, "mine", "its own member is its own");
  box.remove();
});
