// page: tests/pages/strings.html
//
// The texts the components write themselves: English by default, a catalog
// per language with setStrings(), the element's lang (across shadow roots),
// an attribute over the catalog, live updates.

const T = window.__rayTest;
await Promise.all(["ray-dialog", "ray-pagination", "ray-file-upload", "ray-number-input", "ray-statusbar", "ray-spinner"].map((t) => customElements.whenDefined(t)));
const core = await import("../../src/core/core.js");
const { describeAccept } = await import("../../src/components/file-upload/file-upload.js");
const es = (await import("../../src/strings/es.js")).default;
const { setStrings, getString, stringKeys, langOf, defineStrings } = core;

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const closeName = (d) => inner(d, ".close").getAttribute("aria-label");

T.test("strings: English by default; values, plural forms, an unknown key", async (T) => {
  const box = await mount(`<ray-dialog label="A"></ray-dialog>`);
  const d = box.firstElementChild;
  T.eq(d.closeLabel, "Close", "the property reads the catalog");
  T.eq(closeName(d), "Close");
  T.eq(getString("pagination.page", null, { page: 3 }), "Page 3");
  T.eq(getString("file-upload.max", null, { count: 1 }), "Up to 1 file can be added.");
  T.eq(getString("file-upload.max", null, { count: 4 }), "Up to 4 files can be added.");
  T.eq(getString("pagination.page", null, {}), "Page {page}", "a missing value stays as written");
  T.eq(getString("no.such-key"), "no.such-key");
  T.eq(stringKeys()["dialog.close"], "Close");
  box.remove();
});

T.test("strings: a catalog per language, by the nearest lang; region falls back; live", async (T) => {
  const box = await mount(`<ray-dialog id="en" label="A"></ray-dialog>
    <div lang="es"><ray-dialog id="es" label="B"></ray-dialog></div>
    <div lang="es-AR"><ray-pagination id="ar" total="3" page="2"></ray-pagination></div>`);
  const en = box.querySelector("#en");
  const esd = box.querySelector("#es");
  const ar = box.querySelector("#ar");
  T.eq(closeName(esd), "Close", "English until a catalog is set");
  setStrings("es", es);
  await T.settle();
  T.eq(closeName(esd), "Cerrar", "the element on the page updated");
  T.eq(esd.closeLabel, "Cerrar");
  T.eq(closeName(en), "Close", "lang=en keeps English");
  T.eq(inner(ar, "nav").getAttribute("aria-label"), "Paginación", "es-AR uses es");
  const pages = [...ar.shadowRoot.querySelectorAll("[aria-label]")].map((b) => b.getAttribute("aria-label"));
  T.ok(pages.includes("Página 2") && pages.includes("Página siguiente"), pages.join(" | "));
  // A lang changed afterwards applies at once.
  box.querySelector('[lang="es"]').setAttribute("lang", "en");
  await T.settle();
  await T.settle();
  T.eq(closeName(esd), "Close", "lang changed to en");
  box.querySelector('[lang="en"]').setAttribute("lang", "es");
  await T.settle();
  await T.settle();
  T.eq(closeName(esd), "Cerrar", "and back");
  box.remove();
});

T.test("strings: an attribute wins over the catalog; a default name yields to the app's", async (T) => {
  const box = await mount(`<div lang="es"><ray-dialog close-label="Salir" label="A"></ray-dialog>
    <ray-statusbar id="sb1"></ray-statusbar><ray-statusbar id="sb2" aria-label="Estado"></ray-statusbar></div>`);
  const d = box.querySelector("ray-dialog");
  T.eq(closeName(d), "Salir");
  d.removeAttribute("close-label");
  await T.settle();
  T.eq(closeName(d), "Cerrar", "back to the catalog");
  T.eq(box.querySelector("#sb1").getAttribute("aria-label"), "Barra de estado");
  T.eq(box.querySelector("#sb2").getAttribute("aria-label"), "Estado", "the app's name stays");
  box.remove();
});

T.test("strings: across shadow roots; messages and validity in the element's language", async (T) => {
  const box = await mount(`<div lang="es"><div id="host"></div>
    <ray-number-input id="n" min="5" value="2"></ray-number-input>
    <ray-file-upload id="f" required accept="image/*,.pdf" max-size="1048576" multiple max-files="3"></ray-file-upload></div>`);
  const host = box.querySelector("#host");
  host.attachShadow({ mode: "open" }).innerHTML = `<ray-spinner></ray-spinner>`;
  const spinner = host.shadowRoot.querySelector("ray-spinner");
  await T.settle();
  T.eq(langOf(spinner), "es", "the host's lang, through the shadow root");
  T.eq(spinner.label, "Cargando");
  const n = box.querySelector("#n");
  T.eq(n.validationMessage, "El mínimo es 5.");
  T.eq(inner(n, ".up").getAttribute("aria-label"), "Aumentar");
  const f = box.querySelector("#f");
  T.eq(f.validationMessage, "Elige al menos un archivo.");
  T.eq(inner(f, ".hint").textContent, "imágenes o PDF · hasta 1 MB cada uno · máx. 3 archivos");
  T.eq(describeAccept("image/*,.pdf"), "images or PDF", "without an element: the page's language");
  box.remove();
});

T.test("strings: setStrings without a language applies to any; bad values throw", async (T) => {
  const box = await mount(`<ray-dialog label="A"></ray-dialog>`);
  const d = box.firstElementChild;
  setStrings({ "dialog.close": "Close dialog" });
  await T.settle();
  T.eq(closeName(d), "Close dialog", "English page, no 'en' catalog: the one for any language");
  setStrings("en", { "dialog.close": "Dismiss dialog" });
  await T.settle();
  T.eq(closeName(d), "Dismiss dialog", "a catalog for the language comes first");
  setStrings("en", { "dialog.close": "Close" });
  setStrings({ "dialog.close": "Close" });
  await T.settle();
  T.eq(closeName(d), "Close");
  let threw = false;
  try { setStrings({ "dialog.close": 3 }); } catch (e) { threw = e instanceof TypeError; }
  T.ok(threw, "a value that is not a string or plural forms");
  box.remove();
});

T.test("strings: a catalog set before its component loads; defineStrings for your own", async (T) => {
  setStrings("es", { "my-widget.empty": { one: "{count} vacío", other: "{count} vacíos" } });
  T.eq(getString("my-widget.empty"), "my-widget.empty", "not declared yet: the key");
  defineStrings({ "my-widget.empty": { one: "{count} empty", other: "{count} empties" } });
  T.eq(stringKeys()["my-widget.empty"].other, "{count} empties");
  const box = await mount(`<div lang="es"><span></span></div><span id="en"></span>`);
  T.eq(getString("my-widget.empty", box.querySelector("span"), { count: 2 }), "2 vacíos", "the catalog set earlier");
  T.eq(getString("my-widget.empty", box.querySelector("#en"), { count: 1 }), "1 empty");
  let threw = false;
  try { defineStrings({ "my-widget.bad": { one: "x" } }); } catch (e) { threw = e instanceof TypeError; }
  T.ok(threw, "plural forms need other");
  box.remove();
});

T.test("strings: the Spanish catalog has the loaded components' keys, the same {values} and forms", async (T) => {
  // The build checks every component (tools: components/meta); here, the loaded ones.
  const en = Object.fromEntries(Object.entries(stringKeys()).filter(([k]) => !k.startsWith("my-widget.")));
  const vars = (v) => JSON.stringify([...new Set(JSON.stringify(v).match(/\{\w+\}/g) ?? [])].sort());
  T.ok(Object.keys(en).length > 20, `${Object.keys(en).length} texts loaded`);
  for (const [key, text] of Object.entries(en)) {
    T.eq(typeof es[key], typeof text, `${key}: string or plural forms`);
    T.eq(vars(es[key]), vars(text), `${key}: the same {values}`);
  }
});
