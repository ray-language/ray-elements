// Checks markup that uses ray-elements against custom-elements.json: unknown
// elements, attributes, values, slots and events, icon names, icon buttons
// without a label, literal colors. No dependencies and no DOM, so it runs in
// Node (the `ray-elements check` command), in a browser or in an editor.
//
// It reads HTML, and the templates of Vue, Svelte and Astro files and of JSX
// (`<ray-button>` and the wrappers, `<RayButton>`). It is a scanner, not a
// parser of each language: dynamic values (`:size="s"`, `size={s}`) are not
// checked, only their names.

/** @typedef {{ file: string, line: number, column: number, severity: "error" | "warning", rule: string, message: string }} Diagnostic */

export const RULES = {
  "unknown-element": "a <ray-*> element (or a Ray* wrapper) that does not exist",
  "unknown-attribute": "an attribute the element does not have",
  "property-only": "an attribute for a property that has none (set it from JS)",
  "invalid-value": "a value outside the attribute's list",
  "boolean-value": "a boolean attribute written as \"false\" (present means true)",
  "unknown-slot": "a slot name the parent element does not have",
  "unknown-event": "a ray-* event the element does not fire",
  "unknown-icon": "an icon name that is not registered",
  "missing-label": "an icon-only button without its accessible name",
  "no-filled-icon": "filled on an icon that has no filled version (the outline one is drawn)",
  "literal-color": "a literal color in CSS instead of a token",
};

const GLOBAL = new Set([
  "accesskey", "autocapitalize", "autofocus", "class", "contenteditable", "dir", "draggable",
  "enterkeyhint", "exportparts", "hidden", "id", "inert", "inputmode", "is", "itemid", "itemprop",
  "itemref", "itemscope", "itemtype", "lang", "nonce", "part", "popover", "role", "slot",
  "spellcheck", "style", "tabindex", "title", "translate", "writingsuggestions", "xmlns",
  // ray-elements: closes the dialog it is in, with its value as returnValue
  "data-dialog-close",
]);
// Framework attributes (React, Vue, Svelte) that never reach the element.
const FRAMEWORK = new Set(["key", "ref", "classname", "htmlfor", "dangerouslysetinnerhtml", "suppresshydrationwarning", "children"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;

const indexes = new WeakMap();

/**
 * The elements of one or more manifests by tag, with what they inherit.
 * @param {object | object[]} manifests custom-elements.json, parsed
 */
function indexManifest(manifests) {
  const list = Array.isArray(manifests) ? manifests : [manifests];
  const key = list[0];
  if (list.length === 1 && indexes.has(key)) return indexes.get(key);
  const byClass = new Map();
  for (const m of list) {
    for (const mod of m.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (d.kind === "class") byClass.set(d.name, d);
      }
    }
  }
  const tags = new Map();
  const classes = new Map();
  for (const d of byClass.values()) {
    if (!d.tagName) continue;
    const el = { tag: d.tagName, className: d.name, attrs: new Map(), fields: new Set(), events: new Set(), slots: new Set() };
    for (let c = d, depth = 0; c && depth < 8; c = byClass.get(c.superclass?.name), depth++) {
      for (const a of c.attributes ?? []) if (!el.attrs.has(a.name)) el.attrs.set(a.name, attribute(a));
      for (const m of c.members ?? []) if (m.kind === "field") el.fields.add(kebab(m.name));
      for (const e of c.events ?? []) el.events.add(e.name);
      for (const s of c.slots ?? []) el.slots.add(s.name ?? "");
    }
    tags.set(el.tag, el);
    classes.set(el.className, el);
  }
  const index = { tags, classes };
  if (list.length === 1) indexes.set(key, index);
  return index;
}

// The literals of a union are its values. `(string & {})` beside them (keeps
// the literals in autocompletion) is the system's "or any CSS length" (size
// of buttons, dialogs, drawers).
function attribute(a) {
  const text = a.type?.text ?? "string";
  const parts = text.split("|").map((s) => s.trim());
  const literals = parts.filter((s) => /^"[^"]*"$/.test(s)).map((s) => s.slice(1, -1));
  const others = parts.filter((s) => !/^"[^"]*"$/.test(s) && s !== "undefined" && s !== "null");
  const length = others.length === 1 && others[0] === "(string & {})";
  // IconName (ray-icon's name, the icon of an alert, a nav item…): checked against the icons.
  const icon = others.includes("IconName");
  return { name: a.name, boolean: text === "boolean", values: literals.length > 0 && (others.length === 0 || length) ? literals : null, length, icon };
}

const LENGTH = /^(?:-?(?:\d+\.?\d*|\.\d+)(?:px|r?em|ex|ch|lh|vw|vh|vmin|vmax|dvh|svh|lvh|cm|mm|in|pt|pc|q|%)|0|(?:calc|min|max|clamp|var)\(.*\))$/i;

/** The language of a file by its extension: "html" (also Vue, Svelte, Astro) or "jsx". */
export function languageOf(file) {
  const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
  if (["jsx", "tsx", "js", "ts", "mjs", "mts"].includes(ext)) return "jsx";
  if (ext === "vue") return "vue";
  return "html";
}

/**
 * Checks one file's markup.
 * @param {string} source
 * @param {{ manifest: object | object[], icons?: string[], filledIcons?: string[], allow?: Record<string, string[]>, file?: string, lang?: "html" | "vue" | "jsx" }} options
 *   filledIcons: the names with a filled version (iconNames({ filled: true }))
 *   allow: more values of an attribute, for every element (an app's own variant: { variant: ["brand"] })
 * @returns {Diagnostic[]}
 */
export function checkMarkup(source, { manifest, icons, filledIcons, allow = {}, file = "<input>", lang } = {}) {
  const index = indexManifest(manifest);
  const language = lang ?? languageOf(file);
  const iconSet = icons ? new Set(icons) : null;
  const filledSet = filledIcons ? new Set(filledIcons) : null;
  const lines = lineStarts(source);
  const out = [];
  const report = (pos, severity, rule, message) => {
    const { line, column } = locate(lines, pos);
    out.push({ file, line, column, severity, rule, message });
  };

  const stack = [];
  for (const tok of scan(source, language)) {
    if (tok.type === "close") {
      const i = stack.findLastIndex((t) => t.name === tok.name);
      if (i >= 0) stack.length = i;
      continue;
    }
    if (tok.type === "css") {
      colors(tok.text, tok.pos, report);
      continue;
    }
    const parent = stack.at(-1);
    const el = resolve(index, tok.name, language);
    if (el === undefined && isRayName(tok.name, language)) {
      const known = /^ray-/.test(tok.name) ? [...index.tags.keys()] : [...index.classes.keys()];
      report(tok.pos, "error", "unknown-element", `<${tok.name}> is not a ray-elements element${hint(tok.name, known)}`);
    }
    for (const a of tok.attrs) {
      attributeChecks(a, tok, el, parent, language, iconSet, allow, report);
    }
    if (el?.tag === "ray-icon-button") {
      const named = tok.attrs.some((a) => ["label", "aria-label", "aria-labelledby"].includes(normalize(a.name, language).name));
      if (!named) report(tok.pos, "error", "missing-label", `<${tok.name}> needs a label: it is the button's accessible name (and its tooltip)`);
    }
    if (el?.tag === "ray-icon" && filledSet) {
      const attr = (n) => tok.attrs.find((a) => normalize(a.name, language).name === n);
      const filled = attr("filled");
      const name = attr("name");
      // Bound or not: an icon that is ever filled needs the filled version.
      if (filled && name && name.value && !name.dynamic && !normalize(name.name, language).bound && name.value !== "none" && !filledSet.has(name.value)) {
        report(filled.pos, "warning", "no-filled-icon", `"${name.value}" has no filled version: the outline icon is drawn (add one with setIcons({ "${name.value}:filled": … }))`);
      }
    }
    if (!tok.selfClosing && !(language !== "jsx" && VOID.has(tok.name.toLowerCase()))) {
      stack.push({ name: tok.name, el });
    }
  }
  return out.sort((a, b) => a.line - b.line || a.column - b.column);
}

function isRayName(name, language) {
  return /^ray-/.test(name) || (language !== "html" && /^Ray[A-Z]/.test(name));
}

function resolve(index, name, language) {
  if (/^ray-/.test(name)) return index.tags.get(name);
  if (language !== "html" && /^Ray[A-Z]/.test(name)) return index.classes.get(name);
  return null; // not ours
}

// An attribute's name as the element sees it, and how it was written.
function normalize(raw, language) {
  let name = raw;
  let bound = false;
  let event = null;
  let skip = false;
  if (name.startsWith("@") || name.startsWith("v-on:")) {
    event = name.replace(/^@|^v-on:/, "");
  } else if (name.startsWith("on:")) {
    event = name.slice(3); // Svelte
  } else if (name.startsWith("#") || name.startsWith("v-") || name.startsWith("{")) {
    skip = true; // slots, directives, spreads
  } else if (name.startsWith(":") || name.startsWith("v-bind:") || name.startsWith("bind:")) {
    name = name.replace(/^:|^v-bind:|^bind:/, "");
    bound = true;
  } else if (name.includes(":")) {
    skip = true; // class:, use:, client:, set:… (Svelte, Astro)
  } else if (/^on[A-Z]/.test(name)) {
    event = kebab(name.slice(2)); // React: onRaySelect
  }
  if (event !== null) event = event.split(".")[0];
  name = name.split(".")[0]; // Vue modifiers (.prop, .camel)
  // HTML lowercases attribute names; Vue and React 19 set a camelCase one as the property.
  if (language === "html") name = name.toLowerCase();
  else if (/[A-Z]/.test(name)) name = kebab(name);
  return { name, bound, event, skip };
}

function attributeChecks(a, tok, el, parent, language, icons, allow, report) {
  const n = normalize(a.name, language);
  if (n.skip) {
    // Vue: <template #left> passes nothing to a wrapper, which forwards only the default slot.
    const slot = a.name.match(/^(?:#|v-slot:)([\w-]+)/);
    if (slot && slot[1] !== "default" && tok.name === "template" && parent?.el) {
      report(a.pos, "error", "unknown-slot", `the Vue wrappers forward only the default slot: put slot="${slot[1]}" on the element instead of <template #${slot[1]}>`);
    }
    return;
  }
  // slot="…" on a child of one of ours.
  if (n.name === "slot" && !n.bound && a.value !== null && !a.dynamic && parent?.el && parent.el.slots.size > 0) {
    if (!parent.el.slots.has(a.value)) {
      const names = [...parent.el.slots].filter((s) => s !== "");
      report(a.pos, "error", "unknown-slot", `<${parent.name}> has no slot "${a.value}"${hint(a.value, names, "slots")}`);
    }
  }
  if (!el) return;
  if (n.event !== null) {
    if (n.event.startsWith("ray-") && !el.events.has(n.event)) {
      const own = [...el.events].filter((e) => e.startsWith("ray-"));
      report(a.pos, "error", "unknown-event", `<${tok.name}> does not fire "${n.event}"${hint(n.event, own, "events")}`);
    }
    return;
  }
  const name = n.name;
  if (GLOBAL.has(name) || FRAMEWORK.has(name.replace(/-/g, "")) || /^(aria|data)-/.test(name) || /^on[a-z]+$/.test(name)) return;
  if (name === "model-value" && language !== "html") return;
  const attr = el.attrs.get(name);
  // A wrapper, JSX (React 19) or a bound attribute can set a property too.
  const viaProperty = n.bound || a.dynamic || language === "jsx" || tok.name !== el.tag;
  if (!attr) {
    if (el.fields.has(name)) {
      if (!viaProperty) report(a.pos, "error", "property-only", `${camel(name)} of <${tok.name}> is a property only: set it from JS (el.${camel(name)} = …)`);
      return;
    }
    const known = [...el.attrs.keys(), ...(viaProperty ? el.fields : [])];
    report(a.pos, "error", "unknown-attribute", `<${tok.name}> has no attribute "${name}"${hint(name, known)}`);
    return;
  }
  if (a.value === null || a.dynamic || n.bound) return;
  if (attr.boolean && a.value === "false") {
    report(a.pos, "error", "boolean-value", `${name}="false" still means true on <${tok.name}>: a boolean attribute is present or absent`);
  } else if (attr.values && !attr.values.includes(a.value) && !allow[name]?.includes(a.value) && !(attr.length && LENGTH.test(a.value.trim()))) {
    const or = attr.length ? " or a CSS length" : "";
    report(a.pos, "error", "invalid-value", `${name}="${a.value}" is not valid on <${tok.name}>: one of ${attr.values.map((v) => `"${v}"`).join(", ")}${or}`);
  }
  // "none" (or nothing) draws no icon: a blank that keeps the alignment.
  if (attr.icon && icons && a.value !== "" && a.value !== "none" && !icons.has(a.value)) {
    report(a.pos, "warning", "unknown-icon", `no icon named "${a.value}"${hint(a.value, [...icons], "icons")} (register it with setIcons)`);
  }
}

function colors(text, pos, report) {
  for (const m of text.matchAll(COLOR)) {
    report(pos + m.index, "warning", "literal-color", `literal color ${m[0].replace(/\($/, "(…)")}: use a token (var(--ray-foreground), var(--ray-border)…) so it follows the theme`);
  }
}

// --- the scanner

/**
 * The tags of a source, in order: { type: "open", name, attrs, selfClosing, pos },
 * { type: "close", name }, and { type: "css", text, pos } for <style> and style="…".
 */
function* scan(src, language = "html") {
  const jsx = language === "jsx";
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt < 0) return;
    if (src.startsWith("<!--", lt)) {
      const end = src.indexOf("-->", lt + 4);
      i = end < 0 ? src.length : end + 3;
      continue;
    }
    if (jsx) {
      // After an identifier, `<` is a generic or a comparison (useRef<RayDialog>,
      // a < b) unless the name has a dash (text before a tag: "Press <ray-kbd>").
      let p = lt - 1;
      while (p >= 0 && /\s/.test(src[p])) p--;
      const afterIdentifier = p >= 0 && /[\w$)\]]/.test(src[p]) && !/\breturn$/.test(src.slice(Math.max(0, p - 6), p + 1));
      if (afterIdentifier && !/^<[a-z][\w]*-/.test(src.slice(lt, lt + 100))) {
        i = lt + 1;
        continue;
      }
    }
    if (src[lt + 1] === "/") {
      const m = /^<\/([A-Za-z][\w.:-]*)\s*>/.exec(src.slice(lt, lt + 200));
      if (m) yield { type: "close", name: m[1] };
      i = lt + (m ? m[0].length : 2);
      continue;
    }
    const m = /^<([A-Za-z][\w.:-]*)/.exec(src.slice(lt, lt + 200));
    if (!m || m[1].endsWith("-")) {
      i = lt + 1;
      continue;
    }
    const name = m[1];
    let j = lt + m[0].length;
    const attrs = [];
    let selfClosing = false;
    while (j < src.length) {
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === ">") { j++; break; }
      if (src[j] === "/" && src[j + 1] === ">") { selfClosing = true; j += 2; break; }
      if (src[j] === "{") { j = skipBraces(src, j); attrs.push({ name: "{", value: null, dynamic: true, pos: j }); continue; }
      const start = j;
      while (j < src.length && !/[\s=>]/.test(src[j]) && !(src[j] === "/" && src[j + 1] === ">")) j++;
      const attrName = src.slice(start, j);
      if (attrName === "") { j++; continue; }
      let value = null;
      let dynamic = false;
      let valuePos = start;
      let k = j;
      while (k < src.length && /\s/.test(src[k])) k++;
      if (src[k] === "=") {
        k++;
        while (k < src.length && /\s/.test(src[k])) k++;
        valuePos = k;
        if (src[k] === '"' || src[k] === "'") {
          const end = src.indexOf(src[k], k + 1);
          value = src.slice(k + 1, end < 0 ? src.length : end);
          j = end < 0 ? src.length : end + 1;
          valuePos = k + 1;
        } else if (src[k] === "{") {
          j = skipBraces(src, k);
          value = src.slice(k, j);
          dynamic = true;
        } else {
          let e = k;
          while (e < src.length && !/[\s>]/.test(src[e])) e++;
          value = src.slice(k, e);
          j = e;
        }
        if (/\{|\$\{/.test(value)) dynamic = true;
      }
      attrs.push({ name: attrName, value, dynamic, pos: start });
      if (attrName.toLowerCase() === "style" && value !== null && !dynamic) yield { type: "css", text: value, pos: valuePos };
    }
    yield { type: "open", name, attrs, selfClosing, pos: lt };
    const lower = name.toLowerCase();
    if (!jsx && !selfClosing && RAW.has(lower)) {
      const end = src.toLowerCase().indexOf(`</${lower}`, j);
      const stop = end < 0 ? src.length : end;
      if (lower === "style") yield { type: "css", text: src.slice(j, stop), pos: j };
      i = stop;
      continue;
    }
    i = j;
  }
}

// From an opening brace to after its match, past strings and template literals.
function skipBraces(src, i) {
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i + 1;
  }
  return src.length;
}

// --- helpers

/**
 * The values an app adds to attributes in its own CSS, as selectors
 * ([variant="brand"], [data-variant="brand"] in extendStyles):
 * { variant: ["brand"] }.
 * @param {string} src
 * @returns {Record<string, string[]>}
 */
export function customValues(src) {
  const out = {};
  for (const m of src.matchAll(/\[(?:data-)?([a-z][\w-]*)=["']([^"'\]]+)["']\]/g)) {
    (out[m[1]] ??= []).push(m[2]);
  }
  return out;
}

function lineStarts(src) {
  const out = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") out.push(i + 1);
  return out;
}

function locate(starts, pos) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= pos) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: pos - starts[lo] + 1 };
}

function kebab(s) {
  return s.replace(/[A-Z]/g, (c, i) => (i === 0 ? "" : "-") + c.toLowerCase());
}

function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// " (did you mean "x"?)", or the list when it is short.
function hint(word, candidates, what = "") {
  let best = null;
  let bestDistance = Infinity;
  for (const c of candidates) {
    const d = distance(word.toLowerCase(), String(c).toLowerCase());
    if (d < bestDistance) { best = c; bestDistance = d; }
  }
  if (best !== null && bestDistance <= Math.max(2, Math.floor(word.length / 3))) return ` (did you mean "${best}"?)`;
  if (what && candidates.length > 0 && candidates.length <= 12) return `; its ${what}: ${candidates.map((c) => `"${c}"`).join(", ")}`;
  return "";
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
