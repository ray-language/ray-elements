// page: tests/pages/avatar-picker.html
//
// <ray-avatar-picker>: initials without a picture, the crop sheet (dialog or
// drawer), Use photo / Cancel, data URL and Blob output, forms (value,
// required, reset), remove, an undecodable file, disabled, and the inner
// events kept inside.

const T = window.__rayTest;
await customElements.whenDefined("ray-avatar-picker");

// A 400×200 picture: the left half red, the right half blue.
function picture(width = 400, height = 200) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");
  g.fillStyle = "#ff0000";
  g.fillRect(0, 0, width / 2, height);
  g.fillStyle = "#0000ff";
  g.fillRect(width / 2, 0, width / 2, height);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const sheetOf = (el) => inner(el, ".sheet");
const cropOf = (el) => inner(el, "ray-image-crop");
async function until(test, ms = 3000) {
  const end = performance.now() + ms;
  while (!test()) {
    if (performance.now() > end) return false;
    await new Promise((r) => setTimeout(r, 20));
  }
  return true;
}
// Closed for good: the native dialog too, and its close event delivered.
async function closed(sheet) {
  const ok = await until(() => !sheet.open && !sheet.dialog.open);
  await new Promise((r) => setTimeout(r, 30));
  return ok;
}
async function open(el, src) {
  el.edit(src ?? await picture());
  await T.settle();
  await cropOf(el).ready;
  await T.settle();
}

T.test("avatar-picker: without a picture, the initials and Choose photo; a named group", async (T) => {
  const box = await mount(`<ray-avatar-picker label="Profile picture" display-name="Ada Lovelace"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  T.eq(el.value ?? null, null);
  T.eq(inner(el, ".avatar").name, "Ada Lovelace");
  T.ok(!inner(el, ".avatar").hasAttribute("src"), "no src");
  T.eq(inner(el, ".pick-text").textContent, "Choose photo");
  T.ok(inner(el, ".remove").hidden, "nothing to remove");
  const row = inner(el, ".row");
  T.eq(row.getAttribute("role"), "group");
  T.eq(row.getAttribute("aria-labelledby"), "label");
  T.eq(inner(el, ".label-text").textContent, "Profile picture");
  T.eq(inner(el, "input[type=file]").accept, "image/*");
  T.eq(sheetOf(el), null, "the sheet is made when needed");
  box.remove();
});

T.test("avatar-picker: Use photo keeps the framed picture as a data URL", async (T) => {
  const box = await mount(`<form><ray-avatar-picker name="photo" sheet="dialog" output-size="64" type="image/png"></ray-avatar-picker></form>`);
  const el = box.querySelector("ray-avatar-picker");
  const seen = [];
  for (const t of ["input", "change", "ray-open", "ray-close", "ray-load", "ray-request-close"]) {
    box.addEventListener(t, () => seen.push(t));
  }
  await open(el);
  const sheet = sheetOf(el);
  T.eq(sheet.localName, "ray-dialog", "sheet=dialog");
  T.eq(sheet.open, true, "the sheet is open");
  T.eq(sheet.label, "Adjust the photo");
  T.eq(cropOf(el).shape, "circle");
  T.eq(cropOf(el).aspect, "1");
  T.eq(inner(el, ".use-text").textContent, "Use photo");
  inner(el, ".use").click();
  T.ok(await until(() => Boolean(el.value)), "a value after Use photo");
  await T.settle();
  T.ok(el.value.startsWith("data:image/png;base64,"), "a PNG data URL");
  T.eq(JSON.stringify(seen), '["input","change"]', "input and change; the sheet's and the crop's events stay inside");
  T.ok(await closed(sheet), "the sheet closed");
  T.eq(inner(el, ".avatar").src, el.value, "the avatar shows it");
  T.eq(inner(el, ".pick-text").textContent, "Change photo");
  T.ok(!inner(el, ".remove").hidden, "Remove photo shown");
  T.eq(new FormData(box.querySelector("form")).get("photo"), el.value, "submitted as the data URL");
  // The picture is the 64 px square of the center (the left half red, the right blue).
  const img = new Image();
  img.src = el.value;
  await img.decode();
  T.eq(`${img.naturalWidth}x${img.naturalHeight}`, "64x64", "output-size");
  box.remove();
});

T.test("avatar-picker: Cancel leaves the value; output=blob gives a Blob, submitted as a file", async (T) => {
  const box = await mount(`<form><ray-avatar-picker name="logo" sheet="drawer" output="blob" output-size="32"></ray-avatar-picker></form>`);
  const el = box.querySelector("ray-avatar-picker");
  let changes = 0;
  el.addEventListener("change", () => changes++);
  await open(el);
  const sheet = sheetOf(el);
  T.eq(sheet.localName, "ray-drawer", "sheet=drawer");
  T.eq(sheet.position, "bottom");
  sheet.querySelector(".cancel").click();
  T.ok(await closed(sheet), "Cancel closes it");
  T.eq(el.value ?? null, null, "no value");
  T.eq(changes, 0, "no change");
  await open(el);
  inner(el, ".use").click();
  T.ok(await until(() => el.value instanceof Blob), "a Blob");
  T.eq(el.value.type, "image/jpeg");
  T.eq(changes, 1);
  T.ok(inner(el, ".avatar").src.startsWith("blob:"), "shown through an object URL");
  const file = new FormData(box.querySelector("form")).get("logo");
  T.ok(file instanceof File, "a File in the form");
  T.eq(file.name, "logo.jpg");
  T.eq((await el.toBlob()) === el.value, true, "toBlob gives the Blob");
  box.remove();
});

T.test("avatar-picker: remove, required, reset to the value attribute", async (T) => {
  const url = await new Promise((resolve) => {
    const r = new FileReader();
    picture(8, 8).then((b) => { r.onload = () => resolve(r.result); r.readAsDataURL(b); });
  });
  const box = await mount(`<form><ray-avatar-picker name="photo" required></ray-avatar-picker></form>`);
  const el = box.querySelector("ray-avatar-picker");
  T.eq(el.validity.valueMissing, true, "required without a picture");
  T.eq(el.checkValidity(), false);
  el.setAttribute("value", url);
  await T.settle();
  T.eq(el.value, url, "the value attribute");
  T.eq(el.validity.valid, true);
  T.eq(await el.toBlob() instanceof Blob, true, "toBlob from a data URL");
  const seen = [];
  el.addEventListener("input", () => seen.push("input"));
  el.addEventListener("change", () => seen.push("change"));
  inner(el, ".remove").click();
  await T.settle();
  T.eq(el.value, null, "removed");
  T.eq(seen.join(","), "input,change");
  T.eq(el.shadowRoot.activeElement, inner(el, ".pick"), "focus to Choose photo");
  T.eq(el.validity.valueMissing, true);
  T.eq(new FormData(box.querySelector("form")).has("photo"), false, "nothing submitted");
  box.querySelector("form").reset();
  await T.settle();
  T.eq(el.value, url, "reset: back to the value attribute");
  el.clear();
  el.clear();
  await T.settle();
  T.eq(seen.join(","), "input,change,input,change", "clear twice: one change");
  box.remove();
});

T.test("avatar-picker: a file that is not an image shows failed-label and keeps the value", async (T) => {
  const box = await mount(`<ray-avatar-picker sheet="dialog" failed-label="No pude abrir esa imagen"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  const errors = [];
  box.addEventListener("ray-error", (e) => errors.push(e.target === el && e.detail?.error instanceof Error));
  let changes = 0;
  el.addEventListener("change", () => changes++);
  el.edit(new Blob(["not a picture"], { type: "image/png" }));
  T.ok(await until(() => errors.length > 0), "ray-error");
  await T.settle();
  T.eq(JSON.stringify(errors), "[true]", "once, from the picker, with the error");
  T.eq(inner(el, "#error").hidden, false);
  T.eq(inner(el, "#error").textContent, "No pude abrir esa imagen");
  T.ok(await closed(sheetOf(el)), "the sheet closed");
  T.eq(changes, 0);
  T.eq(el.value ?? null, null);
  await open(el);
  T.eq(inner(el, "#error").hidden, true, "the next picture clears it");
  sheetOf(el).close();
  box.remove();
});

T.test("avatar-picker: disabled; labels; layout inline", async (T) => {
  const box = await mount(`<ray-avatar-picker disabled layout="inline" pick-label="Elegir foto" change-label="Cambiar foto" remove-label="Quitar foto" button-size="xs"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  T.eq(inner(el, ".pick").disabled, true);
  T.eq(inner(el, ".pick").size, "xs");
  T.eq(inner(el, ".pick-text").textContent, "Elegir foto");
  el.edit(await picture());
  await T.settle();
  T.eq(sheetOf(el), null, "edit does nothing while disabled");
  T.eq(getComputedStyle(inner(el, ".actions")).flexDirection, "row", "inline: the buttons in a row");
  el.disabled = false;
  el.value = "data:image/png;base64,iVBORw0KGgo=";
  await T.settle();
  T.eq(inner(el, ".pick-text").textContent, "Cambiar foto");
  T.eq(inner(el, ".remove-text").textContent, "Quitar foto");
  T.eq(inner(el, ".pick").disabled, false);
  box.remove();
});

T.test("avatar-picker: preview — the avatar of a picture is a button; ray-preview, then the dialog", async (T) => {
  const url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  const box = await mount(`<ray-avatar-picker display-name="Ada"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  const view = inner(el, ".view");
  el.value = url;
  await T.settle();
  T.eq(view.getAttribute("role"), null, "without preview: not a button");
  view.click();
  await T.settle();
  T.eq(inner(el, ".preview"), null, "nothing opens");
  el.preview = true;
  el.value = null;
  await T.settle();
  T.eq(view.getAttribute("role"), null, "without a picture: not a button");
  el.value = url;
  el.disabled = true;
  await T.settle();
  T.eq(view.getAttribute("role"), null, "disabled: not a button");
  view.click();
  await T.settle();
  T.eq(inner(el, ".preview"), null, "disabled: no preview");
  el.disabled = false;
  el.readonly = true;
  await T.settle();
  T.eq(view.getAttribute("role"), "button", "readonly: still a button");
  T.eq(view.tabIndex, 0);
  T.eq(view.getAttribute("aria-label"), "View photo");
  const seen = [];
  box.addEventListener("ray-preview", (e) => seen.push(e.detail.value === url));
  for (const t of ["ray-open", "ray-close"]) box.addEventListener(t, () => seen.push(t));
  view.click();
  await T.settle();
  const dialog = inner(el, ".preview");
  T.eq(JSON.stringify(seen), "[true]", "ray-preview with the value; the dialog's events stay inside");
  T.eq(dialog?.open, true, "the preview opens (readonly too)");
  T.eq(dialog.label, "View photo");
  T.eq(dialog.querySelector("img").src, url);
  T.eq(dialog.querySelector("img").alt, "Ada");
  dialog.close();
  T.ok(await closed(dialog), "closed");
  // The app takes it.
  box.addEventListener("ray-preview", (e) => e.preventDefault(), { once: true });
  view.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(seen.length, 2, "Enter fires ray-preview");
  T.eq(dialog.open, false, "canceled: no dialog");
  view.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
  view.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(dialog.open, true, "Space opens it");
  dialog.close();
  box.remove();
});

T.test("avatar-picker: after Use photo the focus is on Change photo, even with preview", async (T) => {
  const box = await mount(`<ray-avatar-picker preview sheet="dialog" output-size="16"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  inner(el, ".pick").focus();
  await open(el);
  const sheet = sheetOf(el);
  inner(el, ".use").click();
  T.ok(await until(() => Boolean(el.value)), "a value");
  T.ok(await closed(sheet), "closed");
  await T.settle();
  T.eq(inner(el, ".view").getAttribute("role"), "button", "the avatar is a button now");
  T.eq(el.shadowRoot.activeElement, inner(el, ".pick"), "focus on Change photo, not the avatar");
  box.remove();
});

T.test("avatar-picker: Use photo twice commits once; canceled while encoding commits nothing", async (T) => {
  const box = await mount(`<ray-avatar-picker sheet="dialog" output="blob" output-size="16"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  let changes = 0;
  el.addEventListener("change", () => changes++);
  await open(el);
  const use = inner(el, ".use");
  use.click();
  use.click();
  T.ok(await until(() => Boolean(el.value)), "a value");
  await closed(sheetOf(el));
  T.eq(changes, 1, "one change for a double click");

  // Encoding that waits: cancel before it ends.
  await open(el);
  const crop = cropOf(el);
  let finish;
  crop.toBlob = () => new Promise((resolve) => { finish = resolve; });
  const before = el.value;
  use.click();
  T.ok(await until(() => typeof finish === "function"), "encoding started");
  T.eq(use.loading, true, "Use photo shows it is busy");
  sheetOf(el).close("cancel");
  finish(new Blob(["x"], { type: "image/jpeg" }));
  await closed(sheetOf(el));
  T.eq(el.value, before, "canceled: the value is unchanged");
  T.eq(changes, 1, "no change");
  T.eq(use.loading, false);
  delete crop.toBlob;
  box.remove();
});

T.test("avatar-picker: an encoding error shows failed-label and fires ray-error", async (T) => {
  const box = await mount(`<ray-avatar-picker sheet="dialog"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  const errors = [];
  box.addEventListener("ray-error", (e) => errors.push(e.detail.error?.message));
  await open(el);
  cropOf(el).toDataURL = () => { throw new Error("the image could not be encoded"); };
  inner(el, ".use").click();
  T.ok(await until(() => errors.length > 0), "ray-error");
  T.eq(errors.join(), "the image could not be encoded");
  T.ok(await closed(sheetOf(el)), "the sheet closed");
  T.eq(inner(el, "#error").textContent, "That image could not be opened.");
  T.eq(el.value ?? null, null);
  delete cropOf(el).toDataURL;
  box.remove();
});

T.test("avatar-picker: required-label, a late aria-label, Space on keyup, the file extension", async (T) => {
  const box = await mount(`<form><ray-avatar-picker name="photo" required required-label="Elige una foto." preview></ray-avatar-picker></form>`);
  const el = box.querySelector("ray-avatar-picker");
  T.eq(el.validationMessage, "Elige una foto.");
  el.setAttribute("aria-label", "Foto de perfil");
  await T.settle();
  T.eq(inner(el, ".row").getAttribute("aria-label"), "Foto de perfil", "aria-label set after the first render");
  el.value = new Blob(["x"], { type: "image/webp" });
  await T.settle();
  T.eq(new FormData(box.querySelector("form")).get("photo").name, "photo.webp");
  const view = inner(el, ".view");
  const k = (type, key) => view.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
  let previews = 0;
  el.addEventListener("ray-preview", (e) => { previews++; e.preventDefault(); });
  k("keydown", " ");
  T.eq(previews, 0, "Space: nothing on keydown");
  k("keyup", " ");
  T.eq(previews, 1, "Space: on keyup");
  k("keydown", "Enter");
  T.eq(previews, 2, "Enter: on keydown");
  box.remove();
});

T.test("avatar-picker: readonly hides the buttons, opens no sheet and is not validated; a disabled fieldset turns preview off", async (T) => {
  const box = await mount(`<form><fieldset><ray-avatar-picker name="photo" required readonly preview></ray-avatar-picker></fieldset></form>`);
  const el = box.querySelector("ray-avatar-picker");
  T.eq(getComputedStyle(inner(el, ".actions")).display, "none", "no buttons");
  T.eq(el.validity.valid, true, "readonly: required does not apply");
  el.edit(await picture());
  await T.settle();
  T.eq(sheetOf(el), null, "edit does nothing");
  el.value = "data:image/png;base64,iVBORw0KGgo=";
  await T.settle();
  T.eq(inner(el, ".view").getAttribute("role"), "button");
  box.querySelector("fieldset").disabled = true;
  await T.settle();
  T.eq(inner(el, ".view").getAttribute("role"), null, "disabled fieldset: no preview");
  el.readonly = false;
  el.value = null;
  box.querySelector("fieldset").disabled = false;
  await T.settle();
  T.eq(el.validity.valueMissing, true, "not readonly: required again");
  box.remove();
});

T.test("avatar-picker: made disabled or readonly while framing: the sheet closes, nothing is kept", async (T) => {
  for (const state of ["disabled", "readonly"]) {
    const box = await mount(`<ray-avatar-picker sheet="dialog" output-size="16"></ray-avatar-picker>`);
    const el = box.firstElementChild;
    let changes = 0;
    el.addEventListener("change", () => changes++);
    await open(el);
    const sheet = sheetOf(el);
    el[state] = true;
    await T.settle();
    T.ok(await closed(sheet), `${state}: the sheet closed`);
    inner(el, ".use").click();
    await new Promise((r) => setTimeout(r, 100));
    T.eq(changes, 0, `${state}: no change`);
    T.eq(el.value ?? null, null);
    box.remove();
  }
});

T.test("avatar-picker: a new value clears failed-label; aria-invalid with it; readonly hides the asterisk", async (T) => {
  const box = await mount(`<ray-avatar-picker sheet="dialog" label="Photo" required></ray-avatar-picker>`);
  const el = box.firstElementChild;
  el.edit(new Blob(["not a picture"], { type: "image/png" }));
  T.ok(await until(() => !inner(el, "#error").hidden), "failed-label shown");
  await closed(sheetOf(el));
  T.eq(inner(el, ".pick").getAttribute("aria-invalid"), "true", "the button is marked invalid");
  el.value = "data:image/png;base64,iVBORw0KGgo=";
  await T.settle();
  T.eq(inner(el, "#error").hidden, true, "a new value clears it");
  T.eq(inner(el, ".pick").hasAttribute("aria-invalid"), false);
  T.eq(inner(el, ".required").hidden, false, "the asterisk");
  el.readonly = true;
  await T.settle();
  T.eq(inner(el, ".required").hidden, true, "readonly: no asterisk");
  box.remove();
});

T.test("avatar-picker: showPreview does nothing while disabled or detached; Space must be pressed on the avatar", async (T) => {
  const url = "data:image/png;base64,iVBORw0KGgo=";
  const box = await mount(`<ray-avatar-picker preview disabled></ray-avatar-picker>`);
  const el = box.firstElementChild;
  el.value = url;
  await T.settle();
  el.showPreview();
  await T.settle();
  T.eq(inner(el, ".preview"), null, "disabled: no preview");
  el.disabled = false;
  await T.settle();
  let previews = 0;
  el.addEventListener("ray-preview", (e) => { previews++; e.preventDefault(); });
  const view = inner(el, ".view");
  view.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true, cancelable: true }));
  T.eq(previews, 0, "a keyup without its keydown here does nothing");
  box.remove();
  el.showPreview();
  T.eq(inner(el, ".preview"), null, "detached: no preview");
});

T.test("avatar-picker: the open sheet is kept when the screen crosses the breakpoint", async (T) => {
  const box = await mount(`<ray-avatar-picker sheet="dialog"></ray-avatar-picker>`);
  const el = box.firstElementChild;
  await open(el);
  const first = sheetOf(el);
  el.sheet = "drawer";
  await T.settle();
  await open(el);
  T.eq(sheetOf(el), first, "the same, still open sheet");
  T.eq(first.open, true);
  first.close();
  await closed(first);
  await open(el);
  T.eq(sheetOf(el).localName, "ray-drawer", "the next one follows sheet");
  sheetOf(el).close();
  box.remove();
});
