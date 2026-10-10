// ray-elements core runtime: the base class of every component, shared styles and
// the theme API. No dependencies; loads as a plain ES module (also from
// ray://app in a std/ui window).

export const PREFIX = "ray";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sheets = new Map();

/**
 * A constructable stylesheet from CSS text, shared by every instance (and every
 * component) that asks for the same text.
 * @param {TemplateStringsArray | string} strings
 * @param {...unknown} values
 * @returns {CSSStyleSheet}
 */
export function css(strings, ...values) {
  const text = typeof strings === "string"
    ? strings
    : strings.reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ""), "");
  let sheet = sheets.get(text);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    sheets.set(text, sheet);
  }
  return sheet;
}

/** Applied to every component before its own styles. */
export const hostStyles = css`
  :host { box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: inherit; }
  .focus-ring:focus-visible {
    outline: var(--ray-focus-ring-width) solid var(--ray-ring);
    outline-offset: var(--ray-focus-ring-offset);
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }
  }
`;

// ---------------------------------------------------------------------------
// Base element
// ---------------------------------------------------------------------------

/**
 * @typedef {object} PropertyOptions
 * @property {StringConstructor | NumberConstructor | BooleanConstructor} [type]
 * @property {boolean} [reflect]   write the property back to its attribute
 * @property {string | false} [attribute]  attribute name (kebab-case of the property by default); false = property only
 * @property {unknown} [default]
 */

const templates = new WeakMap();

/**
 * Base class of ray-elements components.
 *
 * Subclasses declare `static properties`, `static styles` and `static template`,
 * and implement `update(changed)`, called once per microtask after any change
 * (and once on first connection).
 */
export class RayElement extends HTMLElement {
  /** @type {Record<string, PropertyOptions>} */
  static properties = {};
  /** @type {CSSStyleSheet[]} */
  static styles = [];
  /** Shadow DOM markup, cloned per instance. */
  static template = "";
  /** Forward focus into the first focusable element of the shadow root. */
  static delegatesFocus = false;

  static #finalized = new WeakSet();

  static get observedAttributes() {
    this.finalize();
    return [...this._attrToProp.keys()];
  }

  /** Defines the accessors of `properties` once per class. */
  static finalize() {
    if (RayElement.#finalized.has(this)) return;
    RayElement.#finalized.add(this);
    /** @type {Map<string, string>} */
    this._attrToProp = new Map();
    for (const [name, opts] of Object.entries(this.properties)) {
      const attr = opts.attribute === false ? null : (opts.attribute ?? kebab(name));
      if (attr) this._attrToProp.set(attr, name);
      Object.defineProperty(this.prototype, name, {
        configurable: true,
        enumerable: true,
        get() { return this._get(name); },
        set(v) { this._set(name, v); },
      });
    }
  }

  constructor() {
    super();
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    ctor.finalize();
    /** @type {Map<string, unknown>} */
    this._values = new Map();
    /** @type {Map<string, unknown>} */
    this._changed = new Map();
    this._pending = false;
    this._reflecting = false;
    this.attachShadow({ mode: "open", delegatesFocus: ctor.delegatesFocus });
    this.shadowRoot.adoptedStyleSheets = [hostStyles, ...ctor.styles];
    if (ctor.template) {
      let tpl = templates.get(ctor);
      if (!tpl) {
        tpl = document.createElement("template");
        tpl.innerHTML = ctor.template;
        templates.set(ctor, tpl);
      }
      this.shadowRoot.append(tpl.content.cloneNode(true));
    }
  }

  connectedCallback() {
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    // A framework may have set properties before the element was defined:
    // they shadow the accessors as own properties; move them through the setters.
    for (const name of Object.keys(ctor.properties)) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const v = this[name];
        delete this[name];
        this[name] = v;
      }
    }
    this.requestUpdate();
  }

  attributeChangedCallback(attr, _old, value) {
    if (this._reflecting) return;
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    const name = ctor._attrToProp.get(attr);
    if (!name) return;
    this._store(name, fromAttribute(value, ctor.properties[name].type));
  }

  /** The stored value, or the declared default when unset (or set to undefined). */
  _get(name) {
    const v = this._values.get(name);
    if (v !== undefined) return v;
    return /** @type {typeof RayElement} */ (this.constructor).properties[name].default;
  }

  _set(name, value) {
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    const opts = ctor.properties[name];
    if (!this._store(name, value)) return;
    if (opts.reflect && opts.attribute !== false) {
      const attr = opts.attribute ?? kebab(name);
      this._reflecting = true;
      try {
        if (value === null || value === undefined || value === false) this.removeAttribute(attr);
        else this.setAttribute(attr, value === true ? "" : String(value));
      } finally {
        this._reflecting = false;
      }
    }
  }

  /** @returns {boolean} whether the value changed */
  _store(name, value) {
    const old = this._get(name);
    if (Object.is(old, value)) return false;
    this._values.set(name, value);
    if (!this._changed.has(name)) this._changed.set(name, old);
    this.requestUpdate();
    return true;
  }

  /** Schedules `update` for the next microtask (coalesces many changes). */
  requestUpdate() {
    if (this._pending) return;
    this._pending = true;
    queueMicrotask(() => {
      this._pending = false;
      if (!this.isConnected) return;
      const changed = this._changed;
      this._changed = new Map();
      this.update(changed);
    });
  }

  /**
   * Called after property changes. `changed` maps each changed property to
   * its previous value (empty on the first call after connecting).
   * @param {Map<string, unknown>} _changed
   */
  update(_changed) {}

  /**
   * Dispatches a bubbling, composed CustomEvent.
   * @returns {boolean} false if a listener called preventDefault()
   */
  emit(type, detail = undefined, { cancelable = false } = {}) {
    return this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable }));
  }

  /** querySelector inside the shadow root. */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
}

function kebab(name) {
  return name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

function fromAttribute(value, type) {
  if (type === Boolean) return value !== null;
  if (value === null) return undefined;
  if (type === Number) {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return value;
}

/**
 * Registers a custom element unless the tag is already taken (several copies
 * of a component may be loaded by different parts of an app).
 * @param {string} tag
 * @param {CustomElementConstructor} cls
 */
export function define(tag, cls) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
}

let uidCounter = 0;
/** A document-unique id with the given stem. */
export function uid(stem = "id") {
  uidCounter += 1;
  return `${PREFIX}-${stem}-${uidCounter}`;
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const THEME_KEY = "ray-elements:theme";
const PRIMARY_KEY = "ray-elements:primary";
export const THEME_EVENT = "ray-theme-change";

/** @typedef {"light" | "dark" | "system"} Theme */

function store(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode, some webviews): not persisting is fine.
  }
}

function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * The chosen theme of an element (default: the document root).
 * @returns {Theme}
 */
export function getTheme(el = document.documentElement) {
  const t = el.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

/**
 * The theme actually shown: "light" or "dark".
 * @returns {"light" | "dark"}
 */
export function resolvedTheme(el = document.documentElement) {
  const holder = el.closest("[data-theme]");
  const t = holder ? getTheme(holder) : "system";
  if (t !== "system") return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Forces a theme on an element (default: the document root) or returns it to
 * the system's. Persisted for the root unless `persist` is false.
 * @param {Theme} theme
 */
export function setTheme(theme, { el = document.documentElement, persist = el === document.documentElement } = {}) {
  if (theme === "light" || theme === "dark") el.setAttribute("data-theme", theme);
  else el.removeAttribute("data-theme");
  if (persist) store(THEME_KEY, theme === "system" ? null : theme);
  notifyTheme(el);
}

/** The primary color of an element (null = the default from tokens.toml). */
export function getPrimary(el = document.documentElement) {
  return el.getAttribute("data-primary");
}

/**
 * Switches the primary color (any palette color) of an element and its subtree.
 * @param {string | null} color
 */
export function setPrimary(color, { el = document.documentElement, persist = el === document.documentElement } = {}) {
  if (color) el.setAttribute("data-primary", color);
  else el.removeAttribute("data-primary");
  if (persist) store(PRIMARY_KEY, color);
  notifyTheme(el);
}

function notifyTheme(el) {
  el.dispatchEvent(new CustomEvent(THEME_EVENT, {
    bubbles: true,
    composed: true,
    detail: { theme: getTheme(el), resolved: resolvedTheme(el), primary: getPrimary(el) },
  }));
}

/**
 * Calls `cb` when the theme of the document changes, by setTheme/setPrimary
 * or by the system. Returns a function that stops listening.
 * @param {(detail: {theme: Theme, resolved: "light" | "dark", primary: string | null}) => void} cb
 */
export function onThemeChange(cb) {
  const onEvent = (e) => cb(e.detail);
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    const root = document.documentElement;
    cb({ theme: getTheme(root), resolved: resolvedTheme(root), primary: getPrimary(root) });
  };
  document.addEventListener(THEME_EVENT, onEvent);
  mq.addEventListener("change", onSystem);
  return () => {
    document.removeEventListener(THEME_EVENT, onEvent);
    mq.removeEventListener("change", onSystem);
  };
}

// Restore the persisted choice as soon as the runtime loads. An explicit
// data-theme / data-primary in the markup wins over the stored one.
{
  const root = document.documentElement;
  const theme = load(THEME_KEY);
  if (!root.hasAttribute("data-theme") && (theme === "light" || theme === "dark")) {
    root.setAttribute("data-theme", theme);
  }
  const primary = load(PRIMARY_KEY);
  if (!root.hasAttribute("data-primary") && primary) {
    root.setAttribute("data-primary", primary);
  }
}
