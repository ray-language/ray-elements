// page: tests/pages/file-upload.html
//
// <ray-file-upload>: helpers, adding and refusing files, single vs multiple,
// removing, form value and validity, disabled, drag and drop.

const T = window.__rayTest;
await customElements.whenDefined("ray-file-upload");
const { parseSize, matchesAccept, describeAccept } = await import("../../src/components/file-upload/file-upload.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const file = (name, size = 10, type = "") => new File([new Uint8Array(size)], name, { type });

T.test("file-upload: size, accept and hint helpers", async (T) => {
  T.eq(parseSize("10 MB"), 10 * 1024 * 1024);
  T.eq(parseSize("512kb"), 512 * 1024);
  T.eq(parseSize(2048), 2048);
  T.ok(Number.isNaN(parseSize("big")), "not a size");
  T.ok(matchesAccept(file("a.PNG"), ".png,.jpg"), "extension, any case");
  T.ok(matchesAccept(file("a", 1, "image/webp"), "image/*"), "wildcard");
  T.ok(!matchesAccept(file("a.exe", 1, "application/x-msdownload"), ".png,image/*"), "refused");
  T.ok(matchesAccept(file("x.bin"), ""), "no accept: anything");
  T.eq(describeAccept(".png,.jpg,application/pdf"), "PNG, JPG or PDF");
  T.eq(describeAccept("image/*"), "Images");
  T.eq(describeAccept(".zip,image/*"), "ZIP or images");

  const box = await mount(`<ray-file-upload multiple accept=".png,.pdf" max-size="2 MB" max-files="3"></ray-file-upload>`);
  T.eq(inner(box.firstElementChild, ".hint").textContent, "PNG or PDF · up to 2 MB each · max. 3 files");
  box.remove();
});

T.test("file-upload: adds, refuses, explains and fires events", async (T) => {
  const box = await mount(`<ray-file-upload multiple accept=".png,.json" max-size="1 KB" max-files="3"></ray-file-upload>`);
  const el = box.firstElementChild;
  const changes = [];
  const rejects = [];
  T.eq(el.lastChange, null, "no change yet");
  el.addEventListener("change", () => changes.push(el.lastChange));
  el.addEventListener("ray-reject", (e) => rejects.push(e.detail));
  const ok1 = file("a.png", 100, "image/png");
  const ok2 = file("b.json", 100, "application/json");
  const { accepted, rejected } = el.addFiles([ok1, file("c.exe"), file("big.png", 4096, "image/png"), ok2]);
  await T.settle();
  T.eq(accepted.length, 2);
  T.eq(rejected.map((r) => r.reason).join(), "type,size");
  T.eq(el.files.length, 2);
  T.eq(changes.length, 1);
  T.eq(changes[0].added.length, 2);
  T.eq(rejects[0].rejected.length, 2);
  const err = inner(el, "#error");
  T.ok(!err.hidden, "refusals explained");
  T.ok(err.textContent.includes("c.exe") && err.textContent.includes("big.png"), err.textContent);
  T.eq(inner(el, ".zone").getAttribute("aria-invalid"), "true");
  T.eq(inner(el, ".files").querySelectorAll("ray-attachment").length, 2, "one row per file");
  T.eq(el.attachmentFor(ok1).name, "a.png");

  // Count: room for one more.
  el.addFiles([file("d.png", 10, "image/png"), file("e.png", 10, "image/png")]);
  await T.settle();
  T.eq(el.files.length, 3);
  T.ok(inner(el, "#error").textContent.includes("Up to 3 files"), inner(el, "#error").textContent);
  T.eq(el.lastChange.added.length, 1, "lastChange: the files the last change added");
  el.files = [];
  T.eq(el.lastChange, null, "assigning files fires nothing and clears lastChange");
  box.remove();
});

T.test("file-upload: without multiple a new file replaces the old one", async (T) => {
  const box = await mount(`<ray-file-upload></ray-file-upload>`);
  const el = box.firstElementChild;
  const a = file("a.txt");
  const b = file("b.txt");
  el.addFiles([a]);
  el.addFiles([b]);
  await T.settle();
  T.eq(el.files.length, 1);
  T.eq(el.files[0], b);
  T.eq(inner(el, ".files").querySelectorAll("ray-attachment").length, 1);
  T.ok(!inner(el, "input").multiple);
  box.remove();
});

T.test("file-upload: the row's remove button removes the file", async (T) => {
  const box = await mount(`<ray-file-upload multiple></ray-file-upload>`);
  const el = box.firstElementChild;
  const a = file("a.txt");
  el.addFiles([a, file("b.txt")]);
  await T.settle();
  let removed = null;
  el.addEventListener("change", () => { removed = el.lastChange.removed; });
  el.attachmentFor(a).shadowRoot.querySelector(".remove").click();
  await T.settle();
  await T.settle();
  T.eq(el.files.length, 1);
  T.eq(removed?.[0], a);
  T.eq(el.attachmentFor(a), null);
  T.eq(inner(el, ".files").querySelectorAll("ray-attachment").length, 1, "row gone");
  el.clear();
  await T.settle();
  T.eq(el.files.length, 0);
  box.remove();
});

T.test("file-upload: form value, required and reset", async (T) => {
  const box = await mount(`<form><ray-file-upload name="docs" multiple required></ray-file-upload></form>`);
  const form = box.querySelector("form");
  const el = form.firstElementChild;
  T.ok(!el.checkValidity(), "required and empty");
  T.ok(el.validity.valueMissing);
  el.addFiles([file("a.txt", 3), file("b.txt", 4)]);
  await T.settle();
  T.ok(el.checkValidity(), "valid with files");
  const data = new FormData(form).getAll("docs");
  T.eq(data.length, 2);
  T.eq(data[1].name, "b.txt");
  form.reset();
  await T.settle();
  T.eq(el.files.length, 0, "reset clears");
  T.eq(new FormData(form).getAll("docs").length, 0);
  box.remove();
});

T.test("file-upload: disabled and labels", async (T) => {
  const box = await mount(`<ray-file-upload label="Assets" description="Zip files" disabled></ray-file-upload>`);
  const el = box.firstElementChild;
  const zone = inner(el, ".zone");
  T.ok(zone.disabled);
  T.eq(zone.localName, "button", "keyboard reachable");
  T.eq(zone.getAttribute("aria-labelledby"), "label title");
  T.ok(zone.getAttribute("aria-describedby").includes("description"));
  let clicked = false;
  inner(el, "input").addEventListener("click", () => { clicked = true; });
  el.open();
  T.ok(!clicked, "no picker while disabled");
  el.disabled = false;
  await T.settle();
  el.open();
  T.ok(clicked, "open() clicks the hidden input");
  T.eq(inner(el, ".title .drop").textContent, "Drag files here");
  T.eq(inner(el, ".title .browse").textContent, "browse");
  box.remove();
});

T.test("file-upload: drag over and drop", async (T) => {
  const dt = new DataTransfer();
  dt.items.add(file("a.png", 10, "image/png"));
  const box = await mount(`<ray-file-upload multiple accept="image/*"></ray-file-upload>`);
  const el = box.firstElementChild;
  const zone = inner(el, ".zone");
  zone.dispatchEvent(new DragEvent("dragenter", { bubbles: true, composed: true, cancelable: true, dataTransfer: dt }));
  await T.settle();
  T.ok(el.hasAttribute("data-dragging"));
  T.ok(!el.hasAttribute("data-reject"));
  T.eq(inner(el, ".title").textContent, "Drop to add files");
  zone.dispatchEvent(new DragEvent("drop", { bubbles: true, composed: true, cancelable: true, dataTransfer: dt }));
  await T.settle();
  T.ok(!el.hasAttribute("data-dragging"));
  T.eq(el.files.length, 1);

  const bad = new DataTransfer();
  bad.items.add(file("a.pdf", 10, "application/pdf"));
  zone.dispatchEvent(new DragEvent("dragenter", { bubbles: true, composed: true, cancelable: true, dataTransfer: bad }));
  await T.settle();
  T.ok(el.hasAttribute("data-reject"), "refused before the drop");
  T.eq(inner(el, ".title").textContent, "File type not allowed");
  zone.dispatchEvent(new DragEvent("dragleave", { bubbles: true, composed: true }));
  await T.settle();
  T.ok(!el.hasAttribute("data-dragging"));
  box.remove();
});
