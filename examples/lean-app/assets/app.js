// Only what the page uses, from ray-ds/ (the raylang package's files):
// - the API from core.js, which registers no element;
// - each component from its own module (it brings what it uses:
//   ray-icon-button brings ray-button);
// - the settings dialog on first open, with import(): an app that is never
//   configured never loads it.

import { enableRaylang } from "./ray-ds/core.js";
import "./ray-ds/components/badge/badge.js";
import "./ray-ds/components/button/button.js";
import "./ray-ds/components/icon/icon.js";
import "./ray-ds/components/icon-button/icon-button.js";
import "./ray-ds/components/input/input.js";

const $ = (id) => document.getElementById(id);
const notes = ["Read the ray-ds README", "Try a native binary"];

function render() {
  $("notes").replaceChildren(...notes.map((text, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = text;
    const remove = document.createElement("ray-icon-button");
    remove.setAttribute("label", `Delete "${text}"`);
    remove.setAttribute("variant", "subtle");
    remove.setAttribute("color", "red");
    remove.innerHTML = `<ray-icon name="close"></ray-icon>`;
    remove.addEventListener("click", () => { notes.splice(i, 1); render(); });
    li.append(span, remove);
    return li;
  }));
  $("count").textContent = String(notes.length);
}

$("add").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("text").value.trim();
  if (!text) return;
  notes.push(text);
  $("text").value = "";
  render();
});

// The dialog and its switch load the first time they are needed.
let settings = null;
async function openSettings() {
  if (!settings) {
    await Promise.all([
      import("./ray-ds/components/dialog/dialog.js"),
      import("./ray-ds/components/switch/switch.js"),
    ]);
    settings = document.createElement("ray-dialog");
    settings.setAttribute("label", "Settings");
    settings.innerHTML = `
      <ray-switch id="compact" label="Compact list"></ray-switch>
      <ray-button slot="footer" data-dialog-close="done">Done</ray-button>`;
    settings.querySelector("#compact").addEventListener("change", (e) => {
      document.body.classList.toggle("compact", e.target.checked);
    });
    document.body.append(settings);
  }
  settings.open = true;
  return settings;
}
$("settings").addEventListener("click", openSettings);

render();
const host = await enableRaylang();

// For `--check` (src/main.ray): which of `tags` are defined now.
window.leanApp = {
  defined: (tags) => tags.filter((t) => customElements.get(t)),
  openSettings,
};
await customElements.whenDefined("ray-button");
window.ray?.send(`ready:${host?.name ?? "browser"}`);
