// The page's half of the ray-ds native bridge for std/ui windows (raylang);
// the program's half is the raylang module ray_ds/bridge.
//
//   import { enableRaylang } from "ray-ds/core/raylang.js";
//   await enableRaylang();   // the host, or null in a browser
//
// It detects window.ray, asks the program what it offers ("hello") and
// installs a host (core/host.js), so the components that use one get the
// system dialogs. Requests travel through window.ray.request as JSON objects
// tagged "ray-ds", which bridge.handle answers and the app's own protocol
// never sees. In a browser, or when the program does not answer (its loop
// does not call bridge.handle), it resolves to null and nothing changes.

import { setHost, HostFile } from "./host.js";
import { chartTheme, onChartThemeChange } from "./charts.js";
import { getTheme } from "./core.js";
import { parseColor, toHex } from "./color.js";

/** The version of the protocol this page speaks. */
export const PROTOCOL = 1;

let enabling = null;

// The width macOS keeps for the window buttons at the start of the title bar.
const MAC_BUTTONS = 78;

/**
 * Installs the raylang host once the program answers. `timeout` (ms) is how
 * long to wait for that answer; `ray` replaces window.ray (tests).
 * `windowColors` (default true) keeps the window's background in the
 * theme's background color, so a resize or a reopen never shows the other
 * theme. The title bar is tinted too only when the window has its own bar
 * (not full_content) and the theme is light or dark: with "system" it stays
 * the system's, so the page keeps following the system.
 */
export function enableRaylang({ timeout = 2000, ray = globalThis.ray, windowColors = true } = {}) {
  if (ray !== globalThis.ray) return connect(ray, timeout, windowColors);
  enabling ??= connect(ray, timeout, windowColors);
  return enabling;
}

async function connect(ray, timeout, windowColors) {
  if (typeof ray?.request !== "function") return null;
  const call = (op, args = {}) => request(ray, op, args);
  let hello;
  try {
    hello = await within(call("hello"), timeout);
  } catch {
    return null;
  }
  const ops = new Set(hello?.ops ?? []);
  // Context menus: the choice comes back as a "ray-ds:menu" event pushed by
  // the program ({ id, index }); a dismissed menu sends nothing, so opening
  // the next one settles the previous with null.
  let popups = 0;
  let pending = null;
  document.addEventListener("ray-ds:menu", (e) => {
    if (pending && e.detail?.id === pending.id) {
      pending.resolve(e.detail.index);
      pending = null;
    }
  });
  const host = {
    name: "raylang",
    platform: hello.platform ?? "",
    version: hello.version ?? "",
    can: (op) => ops.has(op),
    async pickFiles({ title = "", multiple = false, directory = "", filters = [] } = {}) {
      const picked = await call("pick_files", { title, multiple, directory, filters });
      return (picked ?? []).map((f) => new HostFile(f));
    },
    async pickPath({ mode = "open", title = "", directory = "", suggested = "", filters = [] } = {}) {
      return (await call("pick_path", { mode, title, directory, suggested, filters })) ?? null;
    },
    menuItems() {
      return call("menu_items");
    },
    runMenu(tag) {
      return call("run_menu", { tag });
    },
    async popupMenu(items) {
      pending?.resolve(null);
      const id = ++popups;
      const chosen = new Promise((resolve) => { pending = { id, resolve }; });
      try {
        await call("popup_menu", { id, items });
      } catch (e) {
        if (pending?.id === id) pending = null;
        throw e;
      }
      return chosen;
    },
    setEdited(edited) {
      return call("set_edited", { edited: Boolean(edited) });
    },
    setWindowColors({ background = "", titlebar } = {}) {
      return call("window_colors", titlebar === undefined ? { background } : { background, titlebar });
    },
    async confirm({ title = "Are you sure?", message = "", confirmLabel = "Confirm", cancelLabel = "Cancel", style = "" } = {}) {
      return Boolean(await call("confirm", { title, message, confirmLabel, cancelLabel, style }));
    },
  };
  // Under a transparent title bar (a full_content window): what to reserve.
  const height = Number(ray.titlebar_height) || 0;
  host.titlebar = height > 0 ? { height, inset: host.platform === "macos" ? MAC_BUTTONS : 0 } : null;
  const root = document.documentElement;
  if (host.titlebar) {
    root.style.setProperty("--ray-titlebar-height", `${height}px`);
    root.style.setProperty("--ray-titlebar-inset", `${host.titlebar.inset}px`);
    root.setAttribute("data-ray-titlebar", "");
  }
  setHost(host);
  root.setAttribute("data-ray-host", "raylang");
  if (windowColors && ops.has("window_colors")) {
    // A title bar color also sets the window's appearance (macOS picks light
    // or dark by its luminance), which the page's prefers-color-scheme
    // follows, and in a full_content window it brings back the opaque bar.
    // So the bar is tinted only in a window with its own bar and a chosen
    // theme (light or dark), and given back to the system once after that.
    let tinted = false;
    const paint = (theme) => {
      const background = hex(theme.background);
      if (!background) return;
      const colors = { background };
      if (!host.titlebar) {
        if (getTheme() !== "system") {
          colors.titlebar = background;
          tinted = true;
        } else if (tinted) {
          colors.titlebar = "";
          tinted = false;
        }
      }
      host.setWindowColors(colors).catch(() => {});
    };
    paint(chartTheme());
    onChartThemeChange(paint);
  }
  return host;
}

// "#rrggbb" of a CSS color, "" when it cannot be read.
function hex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color ?? "")) return color.toLowerCase();
  try {
    const rgb = parseColor(String(color ?? ""));
    return rgb ? toHex(rgb).slice(0, 7).toLowerCase() : "";
  } catch {
    return "";
  }
}

async function request(ray, op, args) {
  const answer = await ray.request({ "ray-ds": PROTOCOL, op, ...args });
  if (!answer || typeof answer !== "object" || !("ok" in answer)) {
    throw new Error(`ray-ds bridge: unexpected answer to '${op}'`);
  }
  if (!answer.ok) throw new Error(`ray-ds bridge: ${answer.error}`);
  return answer.value;
}

function within(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ray-ds bridge: no answer")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
