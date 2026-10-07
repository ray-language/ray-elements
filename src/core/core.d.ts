// Types of the ray-ds core runtime and extension API (core.js, form.js,
// floating.js, styles.js, position.js, focus.js, icons.js). Hand-written;
// the component declarations are generated after them into ray-ds.d.ts.

export declare const PREFIX: string;
export declare const THEME_EVENT: "ray-theme-change";

export type Theme = "light" | "dark" | "system";
export interface ThemeDetail {
  theme: Theme;
  resolved: "light" | "dark";
  primary: string | null;
}

// --- styles and registration -------------------------------------------------

/** A constructable stylesheet from CSS text, shared by every user of the same text. */
export declare function css(strings: TemplateStringsArray | string, ...values: unknown[]): CSSStyleSheet;
/** The base sheet every component adopts first. */
export declare const hostStyles: CSSStyleSheet;
/** Registers a custom element unless the tag is already taken. */
export declare function define(tag: string, cls: CustomElementConstructor): void;
/** A document-unique id with the given stem. */
export declare function uid(stem?: string): string;

/**
 * App-wide settings. `defaults` apply, per tag, to elements connected afterwards,
 * for the properties their markup and code leave unset.
 */
export declare function configure(options?: { defaults?: Record<string, Record<string, unknown>> }): void;
/** The defaults configure() set for a tag. */
export declare function getDefaults(tag: string): Record<string, unknown>;

// --- theme -------------------------------------------------------------------

export declare function getTheme(el?: Element): Theme;
export declare function resolvedTheme(el?: Element): "light" | "dark";
export declare function setTheme(theme: Theme, options?: { el?: Element; persist?: boolean }): void;
export declare function getPrimary(el?: Element): string | null;
export declare function setPrimary(color: string | null, options?: { el?: Element; persist?: boolean }): void;
export declare function onThemeChange(cb: (detail: ThemeDetail) => void): () => void;
/**
 * Makes any CSS color the primary (data-primary="custom"): ten OKLCH shades,
 * white or black text by contrast; warns below WCAG AA.
 */
export declare function definePrimary(
  color: string,
  options?: { el?: Element; persist?: boolean },
): { shades: string[]; filled: string; contrast: "white" | "black"; ratio: number; aa: boolean };
/** The color last given to definePrimary() for an element, as "#rrggbb" (null if none). */
export declare function getCustomPrimary(el?: Element): string | null;

// --- icons -------------------------------------------------------------------

/** Replaces or adds icons (SVG markup or an SVGElement); repaints every component. */
export declare function setIcons(icons: Record<string, string | SVGElement>): void;
/** The SVG markup of a registered icon ("" if unknown). */
export declare function getIcon(name: string): string;
/** The registered icon names. */
export declare function iconNames(): string[];

// --- base classes ------------------------------------------------------------

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor;
  reflect?: boolean;
  attribute?: string | false;
  default?: unknown;
}

/**
 * Base class of ray-ds components. Members whose name starts with `_` or `#`
 * are internal: do not use them, and do not name your own members with `_`.
 */
export declare class RayElement extends HTMLElement {
  static properties: Record<string, PropertyOptions>;
  static styles: CSSStyleSheet[];
  static template: string;
  static delegatesFocus: boolean;
  /** Adds stylesheets to this component and its subclasses, live instances included. */
  static extendStyles(...sheets: CSSStyleSheet[]): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(attr: string, old: string | null, value: string | null): void;
  /** Schedules update() for the next microtask. */
  requestUpdate(): void;
  /** Protected: called after property changes with their previous values. */
  protected update(changed: Map<string, unknown>): void;
  /** Protected: sets a declared property without reflecting it (state changed by the user). */
  commitProperty(name: string, value: unknown): boolean;
  /** Protected: whether a declared property has its own value (not the default). */
  hasValue(name: string): boolean;
  /** Protected: fills [data-ray-icon] placeholders from the icon registry. */
  paintIcons(root?: ParentNode): void;
  /** Dispatches a bubbling, composed CustomEvent; false if a listener canceled it. */
  emit<T = unknown>(type: string, detail?: T, options?: { cancelable?: boolean }): boolean;
  /** querySelector inside the shadow root. */
  $<E extends Element = HTMLElement>(selector: string): E | null;
}

/** A form-associated ray-ds element (ElementInternals). */
export declare class FormControl extends RayElement {
  static formAssociated: true;
  readonly internals: ElementInternals;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  /** Disabled by its own attribute or by a disabled <fieldset>. */
  readonly effectivelyDisabled: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  /** Protected: re-dispatches a non-composed event (e.g. change) from the host. */
  forward(event: Event): void;
  formDisabledCallback(disabled: boolean): void;
}

/**
 * A FormControl around one native control (#control in the shadow root),
 * with label, description, error, required and their ARIA.
 */
export declare class FieldControl extends FormControl {
  /** Spread into `static properties`: name, label, description, error, required, disabled, size, radius, variant. */
  static fieldProperties: Record<string, PropertyOptions>;
  /** The native control in the shadow root. */
  readonly control: HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement;
  name: string | undefined;
  label: string | undefined;
  description: string | undefined;
  error: string | undefined;
  required: boolean | undefined;
  disabled: boolean | undefined;
  size: string;
  radius: string | undefined;
  variant: string;
  descriptionPosition: string;
  /** Protected hook: attach listeners once, on first connection. */
  wire?(): void;
  /** Protected: label, description, error, ARIA and validity (call from update). */
  syncField(): void;
  /** Protected: mirrors the native control's validity into the form. */
  syncValidity(): void;
}
/** The field wrapper markup around `control` (an element with id="control" class="control"). */
export declare function fieldTemplate(control: string, options?: { sections?: boolean }): string;
export declare const fieldStyles: CSSStyleSheet;
export declare const boxStyles: CSSStyleSheet;

/** Base of trigger + floating panel components (Popover API, anchored placement). */
export declare class Floating extends RayElement {
  /** popover attribute of the panel: "manual" (default; light dismiss and exit animation done by Floating) or "auto" (the browser's, no exit animation). */
  static popoverMode: "auto" | "manual";
  /** Close on Escape and outside presses (default true; tooltips: false). */
  static lightDismiss: boolean;
  /** aria-haspopup of the trigger (null: none). */
  static haspopup: string | null;
  /** Selector of the slot holding the trigger. */
  static triggerSlot: string;
  open: boolean | undefined;
  placement: string;
  offset: number;
  /** The [popover] panel in the shadow root (set on connection). */
  panel: HTMLElement;
  readonly trigger: Element | null;
  /** Whether focus was inside the panel when it started closing. */
  focusWasInside: boolean | undefined;
  show(): void;
  hide(): void;
  toggle(): void;
  /** Places the panel again (scroll and resize already do it). */
  reposition(): void;
  /** Protected hooks. */
  wireTrigger(trigger: Element): void;
  anchorRect(): { left: number; top: number; right: number; bottom: number; width: number; height: number };
  placeOptions(): PlaceOptions;
  popupKind(): string | null;
  toggled(open: boolean): void;
  /** Keyframes the panel leaves with (default: fade + scale 0.97). */
  exitKeyframes(): Keyframe[];
  /** Whether the same pointer gesture just light-dismissed the panel. */
  justClosed(): boolean;
}
export declare const floatingStyles: CSSStyleSheet;

// --- shared styles -----------------------------------------------------------

export declare const COLORS: string[];
export declare const VARIANT_TOKENS: string[];
/** Points an element's --_<variant> properties at a palette color, any CSS color, or the primary. */
export declare function applyColor(el: HTMLElement, color: string | undefined): void;
/** :host size scale: --_h, --_fs, --_px, --_gap by [size]. */
export declare const sizeStyles: CSSStyleSheet;
/** :host radius: --_r by [radius]. */
export declare const radiusStyles: CSSStyleSheet;
/** [data-variant] backgrounds/colors from the --_<variant> properties. */
export declare const variantStyles: CSSStyleSheet;
/** The backdrop of modal overlays: --ray-overlay and --ray-overlay-blur on dialog::backdrop. */
export declare const overlayStyles: CSSStyleSheet;
// --- motion and light dismiss ------------------------------------------------

/** A duration token in ms ("fast" | "base" | "slow"). */
export declare function duration(el: Element, name?: "fast" | "base" | "slow"): number;
/** False with reduced motion, a zero duration token or a hidden page. */
export declare function motionAllowed(el: Element, name?: "fast" | "base" | "slow"): boolean;
/** Plays keyframes (fill: forwards); resolves at once when motion is not allowed. Call cancel() after hiding. */
export declare function play(el: Element, keyframes: Keyframe[], options?: { speed?: "fast" | "base" | "slow"; ease?: "standard" | "in" | "out"; pseudoElement?: string }): { finished: Promise<void>; cancel(): void };
/** Waits for several play() results. */
export declare function playAll(list: Array<{ finished: Promise<void>; cancel(): void }>): { finished: Promise<void>; cancel(): void };
/** Fades and folds an element to zero height. */
export declare function collapseOut(el: Element, options?: { speed?: "fast" | "base" | "slow" }): { finished: Promise<void>; cancel(): void };
/** The default exit of floating panels. */
export declare const POP_OUT: Keyframe[];
/** Registers an open manual panel for Escape / outside-press dismissal; returns the unregister function. */
export declare function dismissable(entry: { panel: Element; owner: Element; trigger?: Element | null; close: (reason: "outside" | "escape" | "replaced") => void }): () => void;

/** Sets --ray-overlay-blur on an element: a number (px), a CSS length or "none"; empty removes it. */
export declare function applyOverlayBlur(el: HTMLElement, value: string | number | null | undefined): void;
/** A ring spinner: <span class="loader">. */
export declare const loaderStyles: CSSStyleSheet;
/** .sr-only: hidden but announced. */
export declare const srOnlyStyles: CSSStyleSheet;

// --- positioning and focus ---------------------------------------------------

export interface PlaceOptions {
  placement?: string;
  offset?: number;
  padding?: number;
  flip?: boolean;
  matchWidth?: boolean;
}
export declare function place(
  anchor: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  floating: HTMLElement,
  options?: PlaceOptions,
): string;
export declare function pointRect(x: number, y: number): DOMRectReadOnly;
export declare function autoUpdate(anchor: Element | object, floating: HTMLElement, update: () => void): () => void;
/** Tabbable elements under root, through shadow roots and slots. */
export declare function tabbables(root: Element | ShadowRoot, options?: { lightOnly?: boolean }): HTMLElement[];
/** Focuses the first [autofocus] or tabbable element; whether something got focus. */
export declare function focusFirst(root: Element | ShadowRoot, options?: { lightOnly?: boolean }): boolean;

// --- charts (core/charts.js) -----------------------------------------------------

/** Number of series colors (--ray-chart-1 … --ray-chart-8). */
export declare const CHART_SERIES: number;
/** The chart tokens resolved to concrete colors for the theme of an element. */
export interface ChartTheme {
  scheme: "light" | "dark";
  /** Series colors, in order (#rrggbb). */
  series: string[];
  background: string;
  grid: string;
  axis: string;
  text: string;
  tooltip: { background: string; text: string; border: string };
  font: { family: string; size: number };
}
export declare function chartTheme(el?: Element): ChartTheme;
/** Calls cb with the new chart theme whenever the theme changes; returns a stop function. */
export declare function onChartThemeChange(cb: (theme: ChartTheme) => void, el?: Element): () => void;
/** A color with an alpha, as rgba(): withAlpha("#1c7ed6", 0.2). */
export declare function withAlpha(color: string, alpha: number): string;
