// ray-elements core runtime: the base class of every component, shared styles and
// the theme API. No dependencies; loads as a plain ES module (also from
// ray://app in a std/ui window).

import { getIcon, mirrorsInRtl, onIconsChange } from "./icons.js";
import { parseColor, shades, contrastRatio, toHex, toOklch } from "./color.js";

export { setIcons, getIcon, iconNames, iconAliases } from "./icons.js";

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

/**
 * Applied until a component's first update has been painted: it does not
 * transition into its initial state. Its styles depend on what update()
 * sets (data-variant, color variables); if the browser computed its style
 * before that (a layout read by another component while the page loads),
 * the variant would animate in from no style at all: black text and a
 * border fading out.
 */
const settlingStyles = css`*, *::before, *::after { transition: none !important; }`;

/** Applied to every component before its own styles. */
export const hostStyles = css`
  :host { box-sizing: border-box; }
  :host([hidden]) { display: none !important; }
  /* hidden always hides, whatever display a component's own rule gives. */
  [hidden] { display: none !important; }
  *, *::before, *::after { box-sizing: inherit; }
  /* Icons of the registry (paintIcons). Zero specificity: components size them. */
  :where([data-ray-icon]) { display: inline-flex; align-items: center; justify-content: center; flex: none; }
  :where([data-ray-icon]) > svg {
    width: var(--ray-icon-size, 1em);
    height: var(--ray-icon-size, 1em);
    stroke-width: var(--ray-icon-stroke, 2);
  }
  /* Right to left, the roles that point along the text. */
  :where([data-ray-icon-mirror]):dir(rtl) > svg { transform: scaleX(-1); }
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

// Per-class data kept outside the classes, so subclasses cannot clash with it.
const templates = new WeakMap();
const attrMaps = new WeakMap();
const extraStyles = new WeakMap();
/** Connected ray-elements elements (restyled by extendStyles, repainted by setIcons). */
const live = new Set();
/** Tag -> { property: value }, from configure({ defaults }). */
const componentDefaults = new Map();

/**
 * Base class of ray-elements components.
 *
 * Subclasses declare `static properties`, `static styles` and `static template`,
 * and implement `update(changed)`, called once per microtask after any change
 * (and once on first connection).
 *
 * Extension contract: the public and protected members below are stable;
 * every other member of a ray-elements class whose name starts with `_` or `#` is
 * internal and may change. Do not name your own members with a leading `_`.
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

  static get observedAttributes() {
    return [...RayElement.#attributes(this).keys()];
  }

  /** attribute -> property map of a class, built (with its accessors) once. */
  static #attributes(cls) {
    let map = attrMaps.get(cls);
    if (map) return map;
    map = new Map();
    attrMaps.set(cls, map);
    for (const [name, opts] of Object.entries(cls.properties)) {
      const attr = opts.attribute === false ? null : (opts.attribute ?? kebab(name));
      if (attr) map.set(attr, name);
      Object.defineProperty(cls.prototype, name, {
        configurable: true,
        enumerable: true,
        get() { return this.#get(name); },
        set(v) { this.#set(name, v); },
      });
    }
    return map;
  }

  /**
   * Adds stylesheets to this component (and its subclasses), also to the
   * instances already on the page: custom variants, app-wide tweaks.
   *   RayButton.extendStyles(css`[data-variant="brand"] { … }`)
   */
  static extendStyles(...sheets) {
    extraStyles.set(this, [...(extraStyles.get(this) ?? []), ...sheets]);
    for (const el of live) {
      if (el instanceof this) el.#adoptStyles();
    }
  }

  #values = new Map();
  #changed = new Map();
  #pending = false;
  #reflecting = false;
  #settled = false;

  constructor() {
    super();
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    RayElement.#attributes(ctor);
    this.attachShadow({ mode: "open", delegatesFocus: ctor.delegatesFocus });
    this.#adoptStyles();
    if (ctor.template) {
      let tpl = templates.get(ctor);
      if (!tpl) {
        tpl = document.createElement("template");
        tpl.innerHTML = ctor.template;
        templates.set(ctor, tpl);
      }
      this.shadowRoot.append(tpl.content.cloneNode(true));
      this.paintIcons();
    }
  }

  #adoptStyles() {
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    const extra = [];
    // Extensions of ancestors first, then the class's own.
    const chain = [];
    for (let c = ctor; c && c !== RayElement; c = Object.getPrototypeOf(c)) chain.unshift(c);
    for (const c of chain) extra.push(...(extraStyles.get(c) ?? []));
    this.shadowRoot.adoptedStyleSheets = [hostStyles, ...ctor.styles, ...extra, ...(this.#settled ? [] : [settlingStyles])];
  }

  connectedCallback() {
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    live.add(this);
    // A framework may have set properties before the element was defined:
    // they shadow the accessors as own properties; move them through the setters.
    for (const name of Object.keys(ctor.properties)) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const v = this[name];
        delete this[name];
        this[name] = v;
      }
    }
    // configure({ defaults }) for what the markup and the code left unset.
    const defaults = componentDefaults.get(this.localName);
    if (defaults) {
      const attrs = RayElement.#attributes(ctor);
      for (const [name, value] of Object.entries(defaults)) {
        if (!(name in ctor.properties) || this.hasValue(name)) continue;
        const attr = [...attrs].find(([, prop]) => prop === name)?.[0];
        if (attr && this.hasAttribute(attr)) continue;
        this[name] = value;
      }
    }
    this.requestUpdate();
  }

  disconnectedCallback() {
    live.delete(this);
  }

  attributeChangedCallback(attr, _old, value) {
    if (this.#reflecting) return;
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    const name = RayElement.#attributes(ctor).get(attr);
    if (!name) return;
    this.commitProperty(name, fromAttribute(value, ctor.properties[name].type));
  }

  /** The stored value, or the declared default when unset (or set to undefined). */
  #get(name) {
    const v = this.#values.get(name);
    if (v !== undefined) return v;
    return /** @type {typeof RayElement} */ (this.constructor).properties[name].default;
  }

  #set(name, value) {
    const ctor = /** @type {typeof RayElement} */ (this.constructor);
    const opts = ctor.properties[name];
    if (!this.commitProperty(name, value)) return;
    if (opts.reflect && opts.attribute !== false) {
      const attr = opts.attribute ?? kebab(name);
      this.#reflecting = true;
      try {
        if (value === null || value === undefined || value === false) this.removeAttribute(attr);
        else this.setAttribute(attr, value === true ? "" : String(value));
      } finally {
        this.#reflecting = false;
      }
    }
  }

  /**
   * Protected. Sets a declared property without reflecting it to its
   * attribute and schedules an update — for state the user changed inside
   * the component (typing, choosing). Returns whether the value changed.
   */
  commitProperty(name, value) {
    const old = this.#get(name);
    if (Object.is(old, value)) return false;
    this.#values.set(name, value);
    if (!this.#changed.has(name)) this.#changed.set(name, old);
    this.requestUpdate();
    return true;
  }

  /** Protected. Whether a declared property has a value of its own (not the default). */
  hasValue(name) {
    return this.#values.get(name) !== undefined;
  }

  /** Schedules `update` for the next microtask (coalesces many changes). */
  requestUpdate() {
    if (this.#pending) return;
    this.#pending = true;
    queueMicrotask(() => {
      this.#pending = false;
      if (!this.isConnected) return;
      const changed = this.#changed;
      this.#changed = new Map();
      this.update(changed);
      this.#settle();
    });
  }

  // After the first update: once a frame has been painted with its initial
  // state (two frames: the first may run before that state is styled),
  // transitions are allowed again.
  #settle() {
    if (this.#settled || this.#settling) return;
    this.#settling = true;
    const done = () => {
      this.#settled = true;
      this.#adoptStyles();
    };
    // A hidden page paints nothing (and runs no frames): nothing to animate.
    if (document.visibilityState === "hidden") queueMicrotask(done);
    else requestAnimationFrame(() => requestAnimationFrame(done));
  }
  #settling = false;

  /**
   * Protected. Called after property changes. `changed` maps each changed
   * property to its previous value (empty on the first call after connecting).
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

  /**
   * Protected. Fills every [data-ray-icon="name"] under `root` (default: the
   * shadow root) with that icon of the registry (setIcons). Components call
   * it for markup they create after the template. An empty name or "none"
   * (the value components use to hide an icon) leaves the slot empty;
   * data-ray-icon-filled asks for the filled version (the outline without one).
   * A role that points along the text (ui.next…) gets data-ray-icon-mirror,
   * which mirrors it under dir="rtl".
   */
  paintIcons(root = this.shadowRoot) {
    for (const slot of root.querySelectorAll("[data-ray-icon]")) {
      const name = slot.getAttribute("data-ray-icon");
      slot.innerHTML = name && name !== "none" ? getIcon(name, { filled: slot.hasAttribute("data-ray-icon-filled") }) : "";
      slot.toggleAttribute("data-ray-icon-mirror", mirrorsInRtl(name));
    }
  }
}

/**
 * App-wide settings.
 *   configure({ defaults: { "ray-button": { variant: "light", size: "md" } } })
 * Defaults apply to elements connected afterwards, to the properties their
 * markup and code leave unset (an attribute or a property set wins).
 * @param {{ defaults?: Record<string, Record<string, unknown>> }} options
 */
export function configure({ defaults } = {}) {
  if (defaults) {
    for (const [tag, values] of Object.entries(defaults)) {
      componentDefaults.set(tag, { ...(componentDefaults.get(tag) ?? {}), ...values });
    }
  }
}

/** The defaults configure() set for a tag. */
export function getDefaults(tag) {
  return { ...(componentDefaults.get(tag) ?? {}) };
}

// setIcons() repaints every connected element.
onIconsChange(() => {
  for (const el of live) el.paintIcons();
});

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
const CUSTOM_KEY = "ray-elements:primary-color";
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

// The color last given to definePrimary(), per element.
const customColors = new WeakMap();

/**
 * The color last given to definePrimary() for an element, as "#rrggbb" (null
 * if none) — what a color picker for the custom primary should show.
 */
export function getCustomPrimary(el = document.documentElement) {
  return customColors.get(el) ?? null;
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

/**
 * Makes any CSS color the primary color of an element (default: the
 * document): builds its ten shades (OKLCH, same hue), picks white or black
 * text for its filled shade by contrast, and switches to data-primary="custom".
 * The variants follow the same rules as the palette colors (tokens.toml).
 * Persisted for the document unless `persist` is false.
 * @param {string} color
 * @returns {{ shades: string[], contrast: "white" | "black", ratio: number, aa: boolean }}
 */
export function definePrimary(color, { el = document.documentElement, persist = el === document.documentElement } = {}) {
  const rgb = parseColor(color);
  if (!rgb) throw new TypeError(`definePrimary: "${color}" is not a CSS color`);
  customColors.set(el, toHex(rgb));
  const scale = shades(rgb);
  const base = toHex(rgb);
  // Filled: the color itself when white text on it reaches AA; a bright color
  // (light, AA with black text) also fills with itself, with black text, like
  // yellow in the palette; otherwise the closest darker shade that reaches AA
  // with white. What the user picked is what they see, as far as AA allows.
  const whiteOk = (hex) => contrastRatio(hex, "#ffffff") >= 4.5;
  const bright = !whiteOk(base) && toOklch(rgb).l >= 0.72 && contrastRatio(base, "#000000") >= 4.5;
  const baseIndex = scale.indexOf(base);
  let index = baseIndex;
  if (!whiteOk(base) && !bright) {
    index = scale.findIndex((hex, i) => i > baseIndex && whiteOk(hex));
    if (index < 0) index = 9;
  }
  const filled = scale[index];
  const hover = index < 9 ? scale[index + 1] : toHex({ r: rgb.r * 0.85, g: rgb.g * 0.85, b: rgb.b * 0.85 });
  const white = contrastRatio(filled, "#ffffff");
  const black = contrastRatio(filled, "#000000");
  const contrast = bright || black > white ? "black" : "white";
  const ratio = contrast === "white" ? white : black;
  scale.forEach((hex, i) => el.style.setProperty(`--ray-custom-src-${i}`, hex));
  el.style.setProperty("--ray-custom-src-contrast", contrast === "white" ? "#ffffff" : "#000000");
  el.style.setProperty("--ray-custom-src-filled", filled);
  el.style.setProperty("--ray-custom-src-filled-hover", hover);
  if (persist) store(CUSTOM_KEY, color);
  setPrimary("custom", { el, persist });
  const aa = ratio >= 4.5;
  if (!aa) console.warn(`ray-elements: definePrimary("${color}"): text on the filled shade is ${ratio.toFixed(1)}:1, below WCAG AA (4.5:1)`);
  return { shades: scale, filled, contrast, ratio, aa };
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
    // A custom primary needs its shades back, not just the attribute.
    const custom = primary === "custom" ? load(CUSTOM_KEY) : null;
    if (custom && parseColor(custom)) definePrimary(custom, { persist: false });
    else if (primary !== "custom") root.setAttribute("data-primary", primary);
  }
}
