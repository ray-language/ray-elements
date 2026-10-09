// The page of examples/desktop-app: a folder browser that uses every part of
// the ray-ds native bridge. The program (src/main.ray) answers the bridge
// with ray_ds/bridge and the page's own requests ({ app: "list", dir }).

import { enableRaylang } from "./ray-ds/core/raylang.js";
import { titlebar, trackEdits } from "./ray-ds/core/host.js";
import { setTheme, resolvedTheme } from "./ray-ds/core/core.js";
import { confirmDialog } from "./ray-ds/components/dialog/dialog.js";
import { notify } from "./ray-ds/components/notification/notification.js";

const $ = (s) => document.querySelector(s);
const send = (m) => window.ray?.send(m);

const host = await enableRaylang();

// --- sections (the sidebar and the Go menu) -----------------------------------

function show(name) {
  for (const p of document.querySelectorAll("[data-section-panel]")) p.hidden = p.id !== name;
  for (const l of document.querySelectorAll("ray-nav-link[data-section]")) l.active = l.dataset.section === name;
  $("#bar").label = name === "files" ? "Files" : "Settings";
  send(`section:${name}`);
}
for (const l of document.querySelectorAll("ray-nav-link[data-section]")) {
  l.addEventListener("click", (e) => {
    e.preventDefault();
    show(l.dataset.section);
  });
}

// --- files ---------------------------------------------------------------------

const workspace = $("#workspace");
const list = $("#file-list");
let entries = [];
let target = null;

const size = (n) => (n < 0 ? "" : n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);

async function load(dir) {
  if (!dir) return;
  const hidden = new FormData($("#settings-form")).get("hidden") !== null;
  const answer = await window.ray.request({ app: "list", dir, hidden });
  if (!answer.ok) {
    workspace.error = answer.error;
    return;
  }
  workspace.error = "";
  entries = answer.entries;
  list.replaceChildren(...entries.map((f, i) => {
    const row = document.createElement("div");
    row.className = "file";
    row.setAttribute("role", "listitem");
    row.dataset.index = String(i);
    const icon = document.createElement("ray-icon");
    icon.name = f.dir ? "folder" : "file";
    const name = document.createElement("span");
    name.textContent = f.name;
    const s = document.createElement("span");
    s.className = "size";
    s.textContent = f.dir ? "" : size(f.size);
    row.append(icon, name, s);
    return row;
  }));
  $("#bar").description = dir;
  $("#files-hint").textContent = entries.length ? "Right-click a file for its native menu." : "The folder is empty.";
  send(`listed:${entries.length}`);
}
workspace.addEventListener("change", () => load(workspace.value));

// The row under the pointer is what the context menu acts on.
list.addEventListener("contextmenu", (e) => {
  for (const r of list.querySelectorAll("[data-active]")) r.removeAttribute("data-active");
  const row = e.target.closest(".file");
  target = row ? entries[Number(row.dataset.index)] : null;
  row?.setAttribute("data-active", "");
}, true);
$("#file-menu").addEventListener("ray-select", (e) => {
  if (target) send(`${e.detail.value}:${target.path}`);
});

$("#attach").addEventListener("change", (e) => send(`attach:${JSON.stringify(e.target.paths)}`));

// --- settings ------------------------------------------------------------------

const form = $("#settings-form");
const edits = trackEdits(form);
form.addEventListener("submit", (e) => {
  e.preventDefault();
  send(`settings:${JSON.stringify(Object.fromEntries(new FormData(form)))}`);
  notify({ title: "Settings saved", color: "green" });
});
$("#discard").addEventListener("click", async () => {
  if (!edits.dirty) return;
  if (await confirmDialog({ label: "Discard your changes?", message: "The settings go back to what was saved.", confirmLabel: "Discard", color: "red" })) {
    form.reset();
    send("discarded");
  }
});

// --- commands: the palette lists the app's own and the menu bar --------------------

const palette = $("#palette");
palette.actions = [
  { id: "files", label: "Go to Files", group: "Go", onSelect: () => show("files") },
  { id: "settings", label: "Go to Settings", group: "Go", onSelect: () => show("settings") },
];
$("#open-palette").addEventListener("click", () => palette.show());

// What the program asks for when a menu item runs (from the bar or the palette).
window.app = {
  show,
  browse: () => workspace.browse(),
  toggleTheme: () => setTheme(resolvedTheme() === "dark" ? "light" : "dark"),
  exportTo: () => send(`export:${JSON.stringify({ to: new FormData(form).get("export"), dir: workspace.value ?? "" })}`),
  load,
};

send(`ready:${JSON.stringify({ host: host?.name ?? null, platform: host?.platform ?? "", titlebar: titlebar() })}`);
