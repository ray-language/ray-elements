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
