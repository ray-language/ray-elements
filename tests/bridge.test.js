// page: tests/pages/bridge.html
//
// The native bridge: core/host.js, core/raylang.js against the real
// elements/bridge (the runner answers with scripted dialogs: the file dialog
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

T.test("raylang: hello from elements/bridge", async (T) => {
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

// --- menus (the runner declares File: New document ⌘N, Close window
// (disabled); View: Zoom in ⌘=; its context menus choose the first enabled item)

const menuEvent = () => new Promise((resolve) => document.addEventListener("ray-test:menu", (e) => resolve(e.detail), { once: true }));

T.test("menu native: the system's context menu", async (T) => {
  const box = await mount(`
    <ray-menu native context>
      <div slot="trigger" style="width: 10rem; height: 4rem">Right-click here</div>
      <ray-menu-label>File</ray-menu-label>
      <ray-menu-item value="lock" disabled>Lock</ray-menu-item>
      <ray-menu-divider></ray-menu-divider>
      <ray-menu-item value="rename"><ray-icon slot="left" name="file"></ray-icon>Rename <ray-kbd slot="right">F2</ray-kbd></ray-menu-item>
      <ray-menu-item value="delete">Delete</ray-menu-item>
    </ray-menu>`);
  const menu = box.querySelector("ray-menu");
  const host = getHost();
  const original = host.popupMenu;
  let sent = null;
  host.popupMenu = (items) => { sent = items; return original(items); };
  const selected = new Promise((resolve) => menu.addEventListener("ray-select", (e) => resolve(e.detail.value), { once: true }));
  menu.querySelector("[slot=trigger]").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
  T.eq(await selected, "rename", "the first enabled item, chosen in the scripted menu");
  host.popupMenu = original;
  T.eq(JSON.stringify(sent), JSON.stringify([{ title: "Lock", enabled: false }, { separator: true }, { title: "Rename", enabled: true }, { title: "Delete", enabled: true }]), "items and dividers, no labels, no sections");
  T.ok(!menu.open, "the page's panel stays closed");
  box.remove();
});

T.test("menu native: a dropdown too; a newer popup settles the older", async (T) => {
  const box = await mount(`<ray-menu native><ray-button slot="trigger">Actions</ray-button><ray-menu-item value="a">A</ray-menu-item></ray-menu>`);
  const menu = box.querySelector("ray-menu");
  const host = getHost();
  const first = host.popupMenu.call(host, [{ title: "never chosen", enabled: false }]);
  const item = await menu.popupNative();
  T.eq(item?.value, "a");
  T.eq(await first, null, "the dismissed one");
  box.remove();
});

T.test("menu: without native, the page's menu even with a host", async (T) => {
  const box = await mount(`<ray-menu><ray-button slot="trigger">Actions</ray-button><ray-menu-item value="a">A</ray-menu-item></ray-menu>`);
  const menu = box.querySelector("ray-menu");
  menu.querySelector("[slot=trigger]").click();
  await T.settle();
  T.ok(menu.open, "the ray-menu panel");
  menu.open = false;
  box.remove();
});

T.test("command palette native-menus: the menu bar as commands", async (T) => {
  const box = await mount(`<ray-command-palette native-menus></ray-command-palette>`);
  const palette = box.querySelector("ray-command-palette");
  palette.actions = [{ id: "own", label: "Own command", group: "App" }];
  palette.show();
  const actions = await palette._loadMenus();
  await T.settle();
  T.eq(actions.map((a) => `${a.group}/${a.label}`).join(), "File/New document,File/Close window,View/Zoom in");
  T.ok(actions[1].disabled, "a disabled menu item");
  T.ok(actions[0].native && actions[0].id === "menu:new", "marked native");
  T.ok(/N$/.test(actions[0].shortcut) && actions[0].shortcut.length <= 8, `shortcut ${actions[0].shortcut}`);
  T.eq(palette.results.length, 4, "the app's own and the menu's");
  const got = menuEvent();
  palette.query = "new doc";
  await T.settle();
  palette.shadowRoot.querySelector(".option").click();
  T.eq(await got, "new", "the program got the menu event");
  T.ok(!palette.open, "closed");
  let error = null;
  try { await getHost().runMenu("close"); } catch (e) { error = e; }
  T.ok(error && /disabled/.test(error.message), String(error));
  box.remove();
});

T.test("command palette: without native-menus, only its actions", async (T) => {
  const box = await mount(`<ray-command-palette></ray-command-palette>`);
  const palette = box.querySelector("ray-command-palette");
  palette.actions = [{ id: "own", label: "Own command" }];
  palette.show();
  T.eq((await palette._loadMenus()).length, 0);
  T.eq(palette.results.length, 1);
  palette.hide();
  box.remove();
});

// --- the window (the runner's window calls come back as "ray-test:native")

const native = () => new Promise((resolve) => document.addEventListener("ray-test:native", (e) => resolve(e.detail), { once: true }));
const { titlebar, dragRegion, trackEdits } = await import("../../src/core/host.js");
const { setTheme, setPrimary } = await import("../../src/core/core.js");

T.test("raylang: window colors and the edited mark reach the program", async (T) => {
  const host = getHost();
  T.ok(host.can("window_colors") && host.can("set_edited"), "ops");
  let got = native();
  await host.setWindowColors({ background: "#112233" });
  T.eq(await got, "window_colors:#112233|-", "the title bar untouched");
  got = native();
  await host.setWindowColors({ background: "#112233", titlebar: "" });
  T.eq(await got, "window_colors:#112233|", "the title bar back to the system's");
  let error = null;
  try { await host.setWindowColors({ background: "blue" }); } catch (e) { error = e; }
  T.ok(error && /not a #rrggbb/.test(error.message), String(error));
  got = native();
  await host.setEdited(true);
  T.eq(await got, "set_edited:true");
  T.eq(titlebar(), null, "a document window has no title bar over the page");
});

T.test("trackEdits: dirty while the form differs from what was saved", async (T) => {
  const box = await mount(`<form><ray-input name="title" value="Draft"></ray-input></form>`);
  const form = box.querySelector("form");
  const input = form.querySelector("ray-input");
  const flips = [];
  const marks = [];
  const onNative = (e) => marks.push(e.detail);
  document.addEventListener("ray-test:native", onNative);
  const t = trackEdits(form, { onChange: (d) => flips.push(d) });
  T.ok(!t.dirty);
  const edit = async (value, type = "input") => {
    input.value = value;
    input.dispatchEvent(new Event(type, { bubbles: true }));
    await T.settle();
  };
  await edit("Draft 2");
  T.ok(t.dirty, "changed");
  await edit("Draft");
  T.ok(!t.dirty, "typed back to what was saved");
  await edit("Final", "change");
  T.ok(t.dirty);
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  T.ok(!t.dirty, "submitted: saved");
  T.eq(flips.join(), "true,false,true,false");
  await new Promise((r) => setTimeout(r, 100));
  T.eq(marks.join(), "set_edited:true,set_edited:false,set_edited:true,set_edited:false", "the window's mark follows");
  t.stop();
  document.removeEventListener("ray-test:native", onNative);
  box.remove();
});

T.test("raylang: under a title bar (full_content)", async (T) => {
  const real = getHost();
  const calls = [];
  const ray = {
    titlebar_height: 28,
    request: async (m) => {
      calls.push(m);
      return m.op === "hello" ? { ok: true, value: { ops: ["hello", "window_colors"], platform: "macos", version: "t" } } : { ok: true, value: true };
    },
  };
  const root = document.documentElement;
  try {
    const host = await enableRaylang({ ray });
    T.eq(JSON.stringify(titlebar()), JSON.stringify({ height: 28, inset: 78 }));
    T.eq(root.style.getPropertyValue("--ray-titlebar-height"), "28px");
    T.eq(root.style.getPropertyValue("--ray-titlebar-inset"), "78px");
    T.ok(root.hasAttribute("data-ray-titlebar"));
    const painted = calls.filter((c) => c.op === "window_colors");
    T.eq(painted.length, 1, "the window takes the theme's background at once");
    T.ok(/^#[0-9a-f]{6}$/.test(painted[0].background), JSON.stringify(painted[0]));
    setTheme(painted[0].background === "#ffffff" ? "dark" : "light", { persist: false });
    await T.settle();
    const again = calls.filter((c) => c.op === "window_colors");
    T.ok(again.length >= 2 && again.at(-1).background !== painted[0].background, "and follows the theme");
    setTheme("system", { persist: false });
    await T.settle();
    // Under a transparent title bar any bar color brings back the opaque bar
    // and sets the window's appearance: never sent.
    T.ok(calls.filter((c) => c.op === "window_colors").every((c) => !("titlebar" in c)), "the title bar is never touched");

    // ray-app-shell: the header is the title bar and drags the window.
    const box = await mount(`
      <ray-app-shell style="height: 300px">
        <ray-app-bar slot="header" label="Inbox"><ray-button slot="end" id="tb-new">New</ray-button></ray-app-bar>
        <p>Content</p>
      </ray-app-shell>`);
    const shell = box.querySelector("ray-app-shell");
    const bar = box.querySelector("ray-app-bar");
    T.ok(shell.hasAttribute("data-titlebar"), "the shell knows");
    T.ok(bar.hasAttribute("data-ray-drag"), "the header drags the window");
    T.eq(getComputedStyle(shell.shadowRoot.querySelector(".header")).paddingInlineStart, "78px", "room for the window buttons");
    // A button inside the bar stays a button: the attribute steps aside on pointer down.
    const inner = box.querySelector("#tb-new").shadowRoot.querySelector("button");
    inner.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    T.ok(!bar.hasAttribute("data-ray-drag"), "not while pressing a button");
    dispatchEvent(new PointerEvent("pointerup"));
    T.ok(bar.hasAttribute("data-ray-drag"), "back after");
    bar.shadowRoot.querySelector(".title").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    T.ok(bar.hasAttribute("data-ray-drag"), "the title drags");
    dispatchEvent(new PointerEvent("pointerup"));
    shell.setAttribute("layout", "alt");
    await T.settle();
    T.ok(host === getHost(), "the fake host");
    // No title bar any more: everything back.
    setHost(real);
    await T.settle();
    T.ok(!shell.hasAttribute("data-titlebar") && !bar.hasAttribute("data-ray-drag"), "undone without a title bar");
    box.remove();
  } finally {
    setHost(real);
    root.style.removeProperty("--ray-titlebar-height");
    root.style.removeProperty("--ray-titlebar-inset");
    root.removeAttribute("data-ray-titlebar");
  }
});

T.test("dragRegion: only under a title bar", async (T) => {
  const box = await mount(`<header>Toolbar</header>`);
  const el = box.firstElementChild;
  const undo = dragRegion(el);
  T.ok(!el.hasAttribute("data-ray-drag"), "the runner's window has no title bar over the page");
  undo();
  box.remove();
});

T.test("raylang: a window with its own title bar tints it only for a chosen theme", async (T) => {
  const real = getHost();
  const calls = [];
  const ray = {
    titlebar_height: 0,
    request: async (m) => {
      calls.push(m);
      return m.op === "hello" ? { ok: true, value: { ops: ["hello", "window_colors"], platform: "macos", version: "t" } } : { ok: true, value: true };
    },
  };
  try {
    await enableRaylang({ ray });
    const last = () => calls.filter((c) => c.op === "window_colors").at(-1);
    T.ok(!("titlebar" in last()), "system theme: the bar is the system's");
    setTheme("dark", { persist: false });
    await T.settle();
    T.eq(last().titlebar, last().background, "dark: the bar takes the background");
    setTheme("system", { persist: false });
    await T.settle();
    T.eq(last().titlebar, "", "back to system: the bar is given back once");
    setPrimary("#7c3aed", { persist: false });
    await T.settle();
    T.ok(!("titlebar" in last()), "and left alone afterwards");
    setPrimary(null, { persist: false });
  } finally {
    setHost(real);
  }
});
