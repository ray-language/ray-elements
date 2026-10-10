// The native host: what the program around the page can do that a browser
// cannot (system file dialogs, native confirmations). Components ask for it
// and keep their web behavior when there is none, so they stay agnostic of
// the host: they never import a bridge, a bridge installs a host here.
// core/raylang.js installs the one of std/ui windows.
//
// A host is an object with `name`, `can(op)` and the operations it offers:
//
//   pickFiles({ title, multiple, directory, filters: [{ name, extensions }] })
//     -> Promise<HostFile[]>   ([] when the user cancels)
//   pickPath({ mode, title, directory, suggested, filters })
//     -> Promise<string|null>  (mode: "open", "folder" or "save"; null = cancelled)
//   confirm({ title, message, confirmLabel, cancelLabel, style })
//     -> Promise<boolean>      (style: "", "info", "warning" or "error")
//   menuItems()
//     -> Promise<[{ menu, tag, title, shortcut, enabled, checked }]>  (the app's menu bar)
//   runMenu(tag)
//     -> Promise<true>         (the program gets the item as if chosen in the menu bar)
//   popupMenu([{ title, enabled, checked, separator }])
//     -> Promise<number|null>  (a native context menu at the pointer: the index
//                               chosen, null when dismissed or replaced)
//   setEdited(edited)          (the window's "unsaved changes" mark)
//     -> Promise<true>
//   titlebar                   ({ height, inset } in px when the page runs under a
//                               transparent title bar, else null: reserve `height`
//                               at the top, `inset` at the start for the window
//                               buttons; also --ray-titlebar-height and
//                               --ray-titlebar-inset on <html>)

let current = null;
const listeners = new Set();

/** Installs the host (null removes it) and tells the listeners. */
export function setHost(host) {
  current = host ?? null;
  for (const cb of [...listeners]) cb(current);
}

/** The installed host, or null. */
export function getHost() {
  return current;
}

/** Whether the installed host offers `op` ("pick_files", "confirm"…). */
export function hostCan(op) {
  return Boolean(current && typeof current.can === "function" && current.can(op));
}

/** Calls `cb(host)` whenever the host changes; returns the unsubscribe function. */
export function onHostChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** The title bar the page runs under ({ height, inset } px), or null. */
export function titlebar() {
  const t = current?.titlebar;
  return t && t.height > 0 ? t : null;
}

// Interactive elements inside a drag handle stay clickable.
const INTERACTIVE = "button, a[href], input, select, textarea, label, summary, [contenteditable], [role=button], [role=tab], [role=link], [role=menuitem], [tabindex]:not([tabindex='-1']), [data-ray-no-drag]";

/**
 * Makes `el` drag the window when the page runs under a host's title bar
 * (titlebar() is not null): it gets data-ray-drag, the attribute the std/ui
 * shell reads. The shell looks at the event's target, which a shadow root
 * retargets to its host, so for a pointer down on anything interactive
 * inside `el` (a button in its shadow root too) the attribute steps aside
 * until the pointer is up. Returns the function that undoes it.
 */
export function dragRegion(el) {
  const guard = (e) => {
    if (!el.hasAttribute("data-ray-drag")) return;
    const path = e.composedPath();
    const end = path.indexOf(el);
    const hit = path.slice(0, end < 0 ? 0 : end).some((n) => n instanceof Element && n.matches(INTERACTIVE));
    if (!hit) return;
    el.removeAttribute("data-ray-drag");
    const back = () => {
      removeEventListener("pointerup", back, true);
      removeEventListener("pointercancel", back, true);
      if (titlebar()) el.setAttribute("data-ray-drag", "");
    };
    addEventListener("pointerup", back, true);
    addEventListener("pointercancel", back, true);
  };
  const sync = () => el.toggleAttribute("data-ray-drag", Boolean(titlebar()));
  el.addEventListener("pointerdown", guard, true);
  const stop = onHostChange(sync);
  sync();
  return () => {
    stop();
    el.removeEventListener("pointerdown", guard, true);
    el.removeAttribute("data-ray-drag");
  };
}

const formKey = (data) => JSON.stringify([...data].map(([k, v]) => [k, typeof v === "string" ? v : `${v.name}:${v.size}:${v.lastModified}`]));

/**
 * Follows whether `form` has unsaved changes: its FormData differs from the
 * one it had when tracking started (or since clean()). With a host that
 * offers "set_edited", the window shows it (the macOS close button's dot).
 * `onChange(dirty)` is called when it flips. Submit and reset make it clean.
 */
export function trackEdits(form, { onChange } = {}) {
  let saved = formKey(new FormData(form));
  let dirty = false;
  const set = (next) => {
    if (next === dirty) return;
    dirty = next;
    if (hostCan("set_edited")) current.setEdited(dirty).catch(() => {});
    onChange?.(dirty);
  };
  const compare = () => set(formKey(new FormData(form)) !== saved);
  // After the controls' own updates (form-associated elements set their
  // value in a microtask when it is assigned by code).
  const check = () => queueMicrotask(() => queueMicrotask(compare));
  const clean = () => {
    saved = formKey(new FormData(form));
    set(false);
  };
  const onReset = () => setTimeout(clean, 0);
  form.addEventListener("input", check);
  form.addEventListener("change", check);
  form.addEventListener("submit", clean);
  form.addEventListener("reset", onReset);
  return {
    get dirty() { return dirty; },
    /** Takes the current values as saved (after saving them some other way). */
    clean,
    /** Compares now (the events already do it). */
    check: compare,
    stop() {
      form.removeEventListener("input", check);
      form.removeEventListener("change", check);
      form.removeEventListener("submit", clean);
      form.removeEventListener("reset", onReset);
      set(false);
    },
  };
}

const TYPES = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  avif: "image/avif", svg: "image/svg+xml", bmp: "image/bmp", heic: "image/heic", ico: "image/x-icon",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4", flac: "audio/flac",
  txt: "text/plain", md: "text/markdown", csv: "text/csv", html: "text/html", css: "text/css",
  js: "text/javascript", xml: "text/xml", json: "application/json", pdf: "application/pdf",
  zip: "application/zip", gz: "application/gzip", tar: "application/x-tar",
};

/** The MIME type of a file name, from its extension ("" when unknown). */
export function typeOfName(name) {
  const dot = String(name).lastIndexOf(".");
  return dot < 0 ? "" : TYPES[String(name).slice(dot + 1).toLowerCase()] ?? "";
}

/** The extensions of a MIME type or pattern ("image/*", "application/pdf"). */
export function extensionsOfType(type) {
  const t = String(type).toLowerCase();
  const all = Object.keys(TYPES);
  if (t.endsWith("/*")) return all.filter((x) => TYPES[x].startsWith(t.slice(0, -1)));
  return all.filter((x) => TYPES[x] === t);
}

/**
 * The file dialog filters of an `accept` list (".png,image/*", as in
 * <input type=file>): one filter with every extension, called `name` (by
 * default the extensions). [] (any file) when a type has no known
 * extension, so the dialog never hides a file the list accepts.
 */
export function acceptFilters(accept, name = "") {
  const exts = [];
  const list = String(accept ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const a of list) {
    const more = a.startsWith(".") ? [a.slice(1)] : extensionsOfType(a);
    if (more.length === 0) return [];
    for (const x of more) if (!exts.includes(x)) exts.push(x);
  }
  if (exts.length === 0) return [];
  return [{ name: name || exts.map((x) => x.toUpperCase()).join(", "), extensions: exts }];
}

/**
 * A file the host chose: a path on the user's disk instead of the bytes of
 * a File. It has the File fields components read (name, size, type,
 * lastModified), so it lists like one; the program reads the file.
 */
export class HostFile {
  constructor({ path, name, size = 0, type, lastModified = 0 }) {
    this.path = String(path);
    this.name = name ?? this.path.split(/[\\/]/).pop();
    this.size = size >= 0 ? size : 0;
    this.type = type ?? typeOfName(this.name);
    this.lastModified = lastModified;
  }
}
