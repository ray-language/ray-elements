// page: tests/pages/attachment.html
//
// <ray-attachment> and <ray-attachments>: formatting, icons, File input,
// upload state and ARIA, removal, links and variants.

const T = window.__rayTest;
await Promise.all(["ray-attachment", "ray-attachments"].map((t) => customElements.whenDefined(t)));
const { formatBytes, extension, iconFor } = await import("../../src/components/attachment/attachment.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);

T.test("attachment: size formatting, extension and icon", async (T) => {
  T.eq(formatBytes(0), "0 B");
  T.eq(formatBytes(912), "912 B");
  T.eq(formatBytes(12 * 1024), "12 KB");
  T.eq(formatBytes(1835008, "en"), "1.8 MB");
  T.eq(formatBytes(8912896, "en"), "8.5 MB");
  T.eq(formatBytes(-1), "", "invalid");
  T.eq(extension("report.final.pdf", "application/pdf"), "PDF");
  T.eq(extension("noext", "image/png"), "PNG", "from the MIME type");
  T.eq(extension("", ""), "");
  T.eq(iconFor("image/png", "a.png"), "image");
  T.eq(iconFor("", "photo.JPG"), "image", "by extension");
  T.eq(iconFor("application/pdf", "a.pdf"), "file");

  const box = await mount(`<ray-attachment name="release.pdf" type="application/pdf" size="1835008"></ray-attachment>`);
  const el = box.firstElementChild;
  T.eq(inner(el, ".name").textContent, "release.pdf");
  T.eq(inner(el, ".meta").textContent, formatBytes(1835008));
  T.eq(inner(el, ".badge").textContent, "PDF");
  T.eq(inner(el, ".icon").getAttribute("data-ray-icon"), "file");
  T.ok(inner(el, ".icon svg"), "icon painted from the registry");
  T.eq(inner(el, ".item").getAttribute("role"), "group");
  T.eq(inner(el, ".item").getAttribute("aria-label"), `release.pdf, ${formatBytes(1835008)}`);
  T.eq(inner(el, "img").hidden, true, "no thumbnail without src");
  T.eq(inner(el, ".remove").hidden, true, "not removable by default");
  box.remove();
});

T.test("attachment: a File fills name, size, type and an image thumbnail", async (T) => {
  const box = await mount(`<ray-attachment></ray-attachment>`);
  const el = box.firstElementChild;
  // A real 1×1 PNG: bytes that do not decode make the image fail, and a
  // failed thumbnail hides itself (a race with the assertion below).
  const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
  const file = new File([png], "a.png", { type: "image/png" });
  el.file = file;
  await T.settle();
  T.eq(el.file, file);
  T.eq(el.name, "a.png");
  T.eq(el.size, png.length);
  T.eq(el.type, "image/png");
  T.ok(String(el.src).startsWith("blob:"), "an object URL thumbnail");
  T.eq(inner(el, "img").hidden, false, "thumbnail shown");
  T.eq(inner(el, ".thumb").hasAttribute("data-image"), true);
  T.eq(inner(el, ".meta").textContent, "70 B");
  const url = el.src;
  el.file = new File(["x"], "notes.txt", { type: "text/plain" });
  await T.settle();
  T.ok(el.src !== url, "the previous object URL is released");
  T.eq(inner(el, "img").hidden, true, "no thumbnail for text");
  T.eq(inner(el, ".badge").textContent, "TXT");
  box.remove();
});

T.test("attachment: broken thumbnail falls back to the icon", async (T) => {
  const box = await mount(`<ray-attachment name="x.png" type="image/png" src="does-not-exist.png"></ray-attachment>`);
  const el = box.firstElementChild;
  // Wait for the image error.
  for (let i = 0; i < 40 && !inner(el, "img").hidden; i++) await new Promise((r) => setTimeout(r, 25));
  T.eq(inner(el, "img").hidden, true, "image hidden after the load error");
  T.eq(inner(el, ".icon").hidden, false, "icon shown instead");
  T.eq(inner(el, ".icon").getAttribute("data-ray-icon"), "image");
  box.remove();
});

T.test("attachment: upload progress, error and their ARIA", async (T) => {
  const box = await mount(`<ray-attachment name="bundle.zip" size="1024" progress="45"></ray-attachment>`);
  const el = box.firstElementChild;
  const bar = inner(el, '[part="progress"]');
  T.eq(el.state, "uploading", "progress implies uploading");
  T.eq(bar.hidden, false);
  T.eq(bar.getAttribute("role"), "progressbar");
  T.eq(bar.getAttribute("aria-valuenow"), "45");
  T.eq(inner(el, ".meta").textContent, "Uploading… 45%");
  T.eq(inner(el, ".item").hasAttribute("aria-busy"), true);
  el.progress = 120;
  await T.settle();
  T.eq(bar.getAttribute("aria-valuenow"), "100", "clamped");
  el.progress = undefined;
  await T.settle();
  T.eq(el.state, "done");
  T.eq(bar.hidden, true, "done: no bar");
  T.eq(inner(el, ".meta").textContent, "1 KB");
  el.status = "error";
  el.error = "Signature mismatch";
  await T.settle();
  T.eq(el.getAttribute("status"), "error");
  T.eq(inner(el, ".meta").textContent, "Signature mismatch");
  T.eq(inner(el, ".item").getAttribute("aria-invalid"), "true");
  T.eq(inner(el, ".icon").getAttribute("data-ray-icon"), "alert-triangle");
  const probe = document.createElement("span");
  probe.style.color = "var(--ray-destructive)";
  document.body.append(probe);
  T.eq(getComputedStyle(inner(el, ".item")).borderTopColor, getComputedStyle(probe).color, "error border");
  probe.remove();
  el.error = undefined;
  await T.settle();
  T.eq(inner(el, ".meta").textContent, "Upload failed", "default error text");
  box.remove();
});

T.test("attachment: remove button and cancelable ray-remove", async (T) => {
  const box = await mount(`<ray-attachments><ray-attachment name="a.pdf" removable></ray-attachment><ray-attachment name="b.pdf" removable remove-label="Delete {name}"></ray-attachment></ray-attachments>`);
  const [a, b] = box.querySelectorAll("ray-attachment");
  const btn = inner(a, ".remove");
  T.eq(btn.hidden, false);
  T.eq(btn.localName, "button");
  T.eq(btn.getAttribute("aria-label"), "Remove a.pdf");
  T.eq(inner(b, ".remove").getAttribute("aria-label"), "Delete b.pdf", "custom label");
  let detail = null;
  a.addEventListener("ray-remove", (e) => { detail = e.detail; e.preventDefault(); }, { once: true });
  btn.click();
  T.eq(detail?.name, "a.pdf");
  T.eq(a.isConnected, true, "preventDefault keeps it");
  btn.click();
  T.eq(a.isConnected, false, "removed otherwise");
  b.disabled = true;
  await T.settle();
  T.eq(inner(b, ".remove").disabled, true, "disabled: not removable");
  inner(b, ".remove").click();
  T.eq(b.isConnected, true);
  box.remove();
});

T.test("attachment: href link and variants", async (T) => {
  const box = await mount(`<ray-attachment name="notes.pdf" href="files/notes.pdf"></ray-attachment><ray-attachment variant="card" name="c.png" type="image/png"></ray-attachment>`);
  const [link, card] = box.querySelectorAll("ray-attachment");
  const a = inner(link, ".name");
  T.eq(a.localName, "a");
  T.ok(a.getAttribute("href").endsWith("files/notes.pdf"));
  T.eq(a.getAttribute("download"), "notes.pdf");
  link.disabled = true;
  await T.settle();
  T.eq(inner(link, ".name").localName, "span", "disabled: not a link");
  T.eq(link.variant, "row", "row by default");
  T.eq(getComputedStyle(inner(link, ".item")).flexDirection, "row");
  T.eq(getComputedStyle(inner(card, ".item")).flexDirection, "column", "card: thumbnail on top");
  T.ok(inner(card, ".item").getBoundingClientRect().width > 100, "card has width");
  box.remove();
});
