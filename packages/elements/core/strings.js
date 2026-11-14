// The texts the components write themselves (button names, screen reader
// labels, messages): each component declares its own, in English, with
// defineStrings(), and an app adds catalogs for other languages with
// setStrings(). A component reads a text with this.t(key) (getString(key,
// this)): the catalog of its language (the nearest lang attribute, across
// shadow roots), then the language without its region ("es" for "es-AR"),
// then the catalog set for any language, then English. An attribute on the
// element (close-label="…") still wins over all of them.
//
// "{name}" in a text is filled from the call's values; a text that depends
// on a number is an object of plural forms ({ one, other }, and few, many…
// where the language has them), chosen by Intl.PluralRules for `count`.

/** The English texts of the components loaded, by key ("<component>.<text>"): defineStrings. */
const STRINGS = {};

/**
 * Declares texts and their English, for a component's module (each one
 * declares its own, so a bundle carries only the texts of what it imports).
 * Keys are "<component>.<text>".
 *   defineStrings({ "my-chart.empty": "No data yet" });
 * @param {Record<string, string | Record<string, string>>} texts
 */
export function defineStrings(texts) {
  for (const [key, value] of Object.entries(texts)) {
    check("defineStrings", key, value);
    STRINGS[key] = value;
  }
}

/** lang ("" for any language) -> { key: text }. */
const catalogs = new Map();
const listeners = new Set();

/** Throws unless `value` is a string or plural forms ({ other } at least). */
function check(fn, key, value) {
  const ok = typeof value === "string" ||
    (value && typeof value === "object" && typeof value.other === "string" && Object.values(value).every((v) => typeof v === "string"));
  if (!ok) throw new TypeError(`${fn}: "${key}" is not a string or { one, other… } plural forms`);
}

/**
 * Adds or replaces texts, for one language or for any (a key of a component
 * not loaded yet is kept for when it is):
 *   setStrings(es)                 // every element, whatever its lang
 *   setStrings("es", es)           // where lang="es" or "es-…" applies
 *   setStrings("en", { "dialog.close": "Close dialog" })
 * Elements already on the page update at once.
 * @param {string | Record<string, string | Record<string, string>>} lang
 * @param {Record<string, string | Record<string, string>>} [strings]
 */
export function setStrings(lang, strings) {
  if (typeof lang !== "string") { strings = lang; lang = ""; }
  const tag = lang.toLowerCase();
  const cat = { ...(catalogs.get(tag) ?? {}) };
  for (const [key, value] of Object.entries(strings ?? {})) {
    check("setStrings", key, value);
    cat[key] = value;
  }
  catalogs.set(tag, cat);
  notify();
}

/** The language of an element: its nearest lang attribute, across shadow roots ("" without one). */
export function langOf(el) {
  for (let n = el; n; ) {
    const found = n.closest?.("[lang]");
    if (found) return found.getAttribute("lang") ?? "";
    const root = n.getRootNode?.();
    n = root && root !== n && root.host ? root.host : null;
  }
  return globalThis.document?.documentElement?.getAttribute("lang") ?? "";
}

/**
 * A text in the language of `el` (the page's without one), with its
 * "{name}" filled from `values`; a plural text picks its form by `count`.
 *   getString("pagination.page", el, { page: 3 })   // "Page 3"
 * @param {string} key
 * @param {Element | null} [el]
 * @param {Record<string, unknown>} [values]
 */
export function getString(key, el = null, values = undefined) {
  const lang = (el ? langOf(el) : globalThis.document?.documentElement?.getAttribute("lang") ?? "").toLowerCase();
  const primary = lang.split("-")[0];
  let text;
  for (const tag of [lang, primary, ""]) {
    const v = catalogs.get(tag)?.[key];
    if (v !== undefined) { text = v; break; }
    if (tag === "") break;
  }
  text ??= STRINGS[key];
  if (text === undefined) return key;
  if (typeof text === "object") {
    let form = "other";
    try { form = new Intl.PluralRules(lang || undefined).select(Number(values?.count ?? 0)); } catch { /* an invalid lang tag */ }
    text = text[form] ?? text.other;
  }
  return values ? text.replace(/\{(\w+)\}/g, (m, name) => (name in values ? String(values[name]) : m)) : text;
}

/** The key and English text of every text declared so far (the components loaded); a plural one as its forms. */
export function stringKeys() {
  return structuredClone(STRINGS);
}

/** @internal Called by the core runtime to update the elements after setStrings or a change of lang. */
export function onStringsChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  for (const cb of listeners) cb();
}

// A lang attribute changed anywhere in the document (outside shadow roots):
// the elements re-read their texts.
if (typeof MutationObserver !== "undefined" && globalThis.document?.documentElement) {
  new MutationObserver(notify).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"], subtree: true });
}
