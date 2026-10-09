// page: tests/pages/bridge.html
//
// The native bridge: core/host.js, core/raylang.js against the real
// ray_ds/bridge (the runner answers with scripted dialogs: the file dialog
// returns the paths of its title, a confirmation says yes when its title
// starts with "yes"), confirmDialog() and ray-file-upload in native mode.

const T = window.__rayTest;
await customElements.whenDefined("ray-file-upload");
const { setHost, getHost, hostCan, onHostChange, HostFile, typeOfName, extensionsOfType, acceptFilters } = await import("../../src/core/host.js");
const { enableRaylang, PROTOCOL } = await import("../../src/core/raylang.js");
const { confirmDialog } = await import("../../src/components/dialog/dialog.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const changed = (el) => new Promise((resolve) => el.addEventListener("change", resolve, { once: true }));

T.test("host: registry and file types", async (T) => {
  setHost(null);
  const seen = [];
  const stop = onHostChange((h) => seen.push(h?.name ?? null));
  T.ok(!hostCan("confirm"), "no host");
  setHost({ name: "fake", can: (op) => op === "confirm" });
  T.ok(hostCan("confirm") && !hostCan("pick_files"), "what the host offers");
  T.eq(getHost().name, "fake");
  setHost(null);
  stop();
  setHost(null);
  T.eq(seen.join(","), "fake,");
  T.eq(typeOfName("a.PNG"), "image/png");
  T.eq(typeOfName("Makefile"), "");
  T.ok(extensionsOfType("image/*").includes("webp"), "wildcard");
  T.eq(extensionsOfType("application/pdf").join(), "pdf");
  const f = new HostFile({ path: "C:\\docs\\plan.md", size: -1 });
  T.eq(f.name, "plan.md");
  T.eq(f.size, 0, "unknown size");
  T.eq(f.type, "text/markdown");
});

T.test("path-input: a text field without a host", async (T) => {
  const { dirName, baseName } = await import("../../src/components/path-input/path-input.js");
  T.eq(dirName("/Users/ada/notes/plan.md"), "/Users/ada/notes");
  T.eq(dirName("C:\\docs\\a.txt"), "C:\\docs");
  T.eq(dirName("/plan.md"), "/");
  T.eq(dirName("plan.md"), "");
  T.eq(baseName("C:\\docs\\a.txt"), "a.txt");
  const box = await mount(`<form><ray-path-input name="out" label="Output" value="/tmp/x"></ray-path-input></form>`);
  const el = box.querySelector("ray-path-input");
  T.ok(!el.canBrowse, "no host");
  T.ok(el.shadowRoot.querySelector(".browse").hidden, "no Browse…");
  T.eq(await el.browse(), null);
  T.eq(new FormData(box.querySelector("form")).get("out"), "/tmp/x");
  box.remove();
});

T.test("raylang: no bridge, no host", async (T) => {
  T.eq(await enableRaylang({ ray: {} }), null, "no window.ray.request");
  const silent = { request: () => new Promise(() => {}) };
  T.eq(await enableRaylang({ ray: silent, timeout: 50 }), null, "the program never answers");
  const other = { request: async () => "pong" };
  T.eq(await enableRaylang({ ray: other }), null, "an answer that is not the bridge's");
  T.eq(getHost(), null);
});

T.test("raylang: hello from ray_ds/bridge", async (T) => {
  const host = await enableRaylang();
  T.ok(host, "the runner answers");
  T.eq(host.name, "raylang");
  T.eq(PROTOCOL, 1);
  T.ok(["macos", "linux", "windows"].includes(host.platform), host.platform);
  T.ok(host.version.length > 0, "version");
  T.ok(host.can("pick_files") && host.can("confirm") && !host.can("fly"), "ops");
  T.eq(getHost(), host, "installed");
  T.eq(await enableRaylang(), host, "once");
  T.eq(document.documentElement.getAttribute("data-ray-host"), "raylang");
});

T.test("raylang: confirmDialog asks the program", async (T) => {
  T.eq(await confirmDialog({ label: "yes, delete it?", color: "red" }), true);
  T.eq(await confirmDialog({ label: "Delete it?" }), false);
  T.eq(document.querySelector("ray-dialog"), null, "no ray-dialog");
  // native: false keeps the page's dialog.
  const answer = confirmDialog({ label: "yes?", native: false });
  await T.settle();
  const d = document.querySelector("ray-dialog");
  T.ok(d && d.open, "a ray-dialog");
  d.querySelector("[data-dialog-close=confirm]").click();
  T.eq(await answer, true);
});

T.test("raylang: errors of the program reject", async (T) => {
  let error = null;
  try {
    await getHost().confirm({ title: "x", style: "loud" });
  } catch (e) {
    error = e;
  }
  T.ok(error && /unknown style 'loud'/.test(error.message), String(error));
});

T.test("host: accept to dialog filters", async (T) => {
  T.eq(JSON.stringify(acceptFilters(".png,image/jpeg")), JSON.stringify([{ name: "PNG, JPG, JPEG", extensions: ["png", "jpg", "jpeg"] }]));
  T.eq(acceptFilters(".md", "Notes")[0].name, "Notes");
  T.eq(acceptFilters("").length, 0, "any file");
  T.eq(acceptFilters(".png,application/x-thing").length, 0, "an unknown type: any file");
});

T.test("file-upload native: the dialog gives paths", async (T) => {
  const box = await mount(`<form><ray-file-upload name="docs" native multiple accept=".md,.toml" label="README.md,tokens.toml"></ray-file-upload></form>`);
  const up = box.querySelector("ray-file-upload");
  const next = changed(up);
  up.shadowRoot.querySelector(".zone").click();
  await next;
  T.eq(up.paths.length, 2);
  T.ok(up.paths[0].endsWith("/README.md") && up.paths[1].endsWith("/tokens.toml"), up.paths.join());
  const [readme] = up.files;
  T.ok(readme instanceof HostFile, "a HostFile");
  T.eq(readme.name, "README.md");
  T.eq(readme.type, "text/markdown");
  T.ok(readme.size > 1000, `a real size: ${readme.size}`);
  T.eq(up.lastChange.added.length, 2);
  await T.settle();
  const row = up.attachmentFor(readme);
  T.eq(row.name, "README.md");
  T.eq(new FormData(box.querySelector("form")).getAll("docs").join(), up.paths.join(), "the form submits the paths");
  box.remove();
});

T.test("file-upload native: accept still checks; cancel adds nothing", async (T) => {
  const box = await mount(`<ray-file-upload native multiple accept=".md" label="README.md,tokens.toml"></ray-file-upload>`);
  const up = box.querySelector("ray-file-upload");
  const refused = new Promise((resolve) => up.addEventListener("ray-reject", (e) => resolve(e.detail.rejected), { once: true }));
  up.open();
  const rejected = await refused;
  T.eq(rejected.length, 1);
  T.eq(rejected[0].file.name, "tokens.toml");
  T.eq(up.paths.length, 1);
  // An empty title: the scripted dialog is cancelled.
  up.label = "";
  let changes = 0;
  up.addEventListener("change", () => changes++);
  up.open();
  await new Promise((r) => setTimeout(r, 30));
  T.eq(changes, 0);
  T.eq(up.paths.length, 1);
  box.remove();
});

T.test("file-upload: without native, the web picker even with a host", async (T) => {
  const box = await mount(`<ray-file-upload label="README.md"></ray-file-upload>`);
  const up = box.querySelector("ray-file-upload");
  let clicked = 0;
  up.shadowRoot.querySelector("input").click = () => clicked++;
  up.open();
  T.eq(clicked, 1);
  T.eq(up.paths.length, 0);
  box.remove();
});

T.test("path-input: Browse… asks the program", async (T) => {
  const box = await mount(`<form><ray-path-input name="out" label="Export to" mode="save" accept=".json,.toml" value="/Users/ada/report.json"></ray-path-input></form>`);
  const el = box.querySelector("ray-path-input");
  const btn = el.shadowRoot.querySelector(".browse");
  T.ok(el.canBrowse && !btn.hidden, "Browse… with the raylang host");
  T.eq(btn.textContent.trim(), "Browse…");
  const events = [];
  el.addEventListener("input", () => events.push("input"));
  el.addEventListener("change", () => events.push("change"));
  const done = new Promise((r) => el.addEventListener("change", r, { once: true }));
  btn.click();
  await done;
  // The scripted dialog describes what it was asked: mode, folder, suggested name, filters.
  T.eq(el.value, "save:/Users/ada|report.json|1");
  T.eq(events.join(), "input,change");
  T.eq(new FormData(box.querySelector("form")).get("out"), el.value);
  el.mode = "folder";
  el.value = "/Users/ada";
  T.eq(await el.browse(), "folder:/Users/ada||0", "a folder starts at the path itself, without filters");
  // Cancelled (an empty title): nothing changes.
  el.label = "";
  T.eq(await el.browse(), null);
  T.eq(el.value, "folder:/Users/ada||0");
  el.disabled = true;
  await T.settle();
  T.ok(btn.disabled, "disabled");
  T.eq(await el.browse(), null);
  box.remove();
});

T.test("path-input: Browse… follows the host", async (T) => {
  const host = getHost();
  const box = await mount(`<ray-path-input label="x"></ray-path-input>`);
  const el = box.querySelector("ray-path-input");
  const btn = el.shadowRoot.querySelector(".browse");
  T.ok(!btn.hidden);
  setHost(null);
  await T.settle();
  T.ok(btn.hidden, "hidden once the host goes");
  setHost(host);
  await T.settle();
  T.ok(!btn.hidden, "back");
  box.remove();
});
