// page: tests/pages/password-input.html
//
// <ray-password-input>: hidden by default, the toggle (type, ARIA, focus,
// event), a ray-input for everything else (form value, validity, reset).

const T = window.__rayTest;
await customElements.whenDefined("ray-password-input");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);

T.test("password-input: toggle shows and hides, keeps focus, says so", async (T) => {
  const box = await mount(`<ray-password-input label="Password" value="s3cret"></ray-password-input>`);
  const el = box.firstElementChild;
  const input = inner(el, "input");
  const toggle = inner(el, ".toggle");
  T.eq(input.type, "password", "hidden by default");
  T.eq(input.autocomplete, "current-password");
  T.eq(toggle.getAttribute("aria-label"), "Show password");
  T.eq(toggle.getAttribute("aria-pressed"), "false");
  const seen = [];
  el.addEventListener("ray-visibility-change", (e) => seen.push(e.detail.visible));
  input.focus();
  toggle.click();
  await T.settle();
  T.eq(input.type, "text", "shown");
  T.eq(el.visible, true);
  T.ok(el.hasAttribute("visible"), "reflected");
  T.eq(toggle.getAttribute("aria-label"), "Hide password");
  T.eq(toggle.getAttribute("aria-pressed"), "true");
  T.eq(el.shadowRoot.activeElement, input, "focus stays in the field");
  T.eq(seen.join(), "true");
  el.type = "password";
  await T.settle();
  T.eq(input.type, "text", "type follows visible, not outside changes");
  box.remove();
});

T.test("password-input: form value, required, minlength, reset hides again", async (T) => {
  const box = await mount(`<form><ray-password-input name="pw" label="Password" required minlength="10" autocomplete="new-password"></ray-password-input></form>`);
  const form = box.firstElementChild;
  const el = form.firstElementChild;
  const input = inner(el, "input");
  T.eq(input.autocomplete, "new-password", "autocomplete passes through");
  T.eq(el.validity.valueMissing, true, "required");
  input.value = "correct horse";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await T.settle();
  T.eq(el.value, "correct horse");
  T.eq(new FormData(form).get("pw"), "correct horse");
  el.visible = true;
  await T.settle();
  form.reset();
  await T.settle();
  T.eq(el.value, "", "reset empties it");
  T.eq(input.type, "password", "and hides it again");
  box.remove();
});
