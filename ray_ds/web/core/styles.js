// Shared component styles: sizes, radius, color variants and the loader.
// Components add the sheets they need to their `static styles`.

import { css } from "./core.js";

/** Palette colors of tokens.toml; anything else given as `color` is used as a raw CSS color. */
export const COLORS = ["dark", "gray", "red", "pink", "violet", "indigo", "blue", "cyan", "teal", "green", "yellow", "orange", "custom"];

/** Named steps of the space scale (--ray-space-*). */
const SPACES = ["xs", "sm", "md", "lg", "xl"];

/**
 * A spacing value as CSS: a named step ("md") as its token, a bare number
 * as px (0 included), anything else as a CSS length ("1.5rem", "5%").
 * @param {string | number | undefined} value
 * @returns {string | null} null when empty
 */
export function spaceValue(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  if (SPACES.includes(s)) return `var(--ray-space-${s})`;
  return /^-?\d+(\.\d+)?$/.test(s) ? `${s}px` : s;
}

/** Variant tokens generated per color (tokens.toml [variants.*]). */
export const VARIANT_TOKENS = ["filled", "filled-hover", "light", "light-hover", "light-color", "outline", "outline-hover", "contrast"];

/**
 * Points the private --_<variant> custom properties of `el` at a color:
 * a palette name, a raw CSS color, or the primary color when empty.
 * @param {HTMLElement} el
 * @param {string | undefined} color
 */
export function applyColor(el, color) {
  if (!color || COLORS.includes(color) || color === "primary") {
    const base = !color || color === "primary" ? "--ray-primary" : `--ray-${color}`;
    for (const v of VARIANT_TOKENS) el.style.setProperty(`--_${v}`, `var(${base}-${v})`);
    return;
  }
  // A raw CSS color: derive the variants the way the tokens do.
  const mix = (pct, other = "transparent") => `color-mix(in srgb, ${color} ${pct}, ${other})`;
  const values = {
    "filled": color,
    "filled-hover": mix("85%", "black"),
    "light": mix("12%"),
    "light-hover": mix("18%"),
    "light-color": color,
    "outline": color,
    "outline-hover": mix("6%"),
    "contrast": "white",
  };
  for (const v of VARIANT_TOKENS) el.style.setProperty(`--_${v}`, values[v]);
}

/**
 * The gradient of variant="gradient" on `el`, from a "from to [deg]" spec:
 * palette colors (their filled shade) or any CSS colors ("teal blue 90",
 * "#7c3aed #db2777"). Empty: the --ray-gradient-* tokens.
 * @param {HTMLElement} el
 * @param {string | undefined} spec
 */
export function applyGradient(el, spec) {
  const parts = String(spec ?? "").trim().split(/\s+/).filter(Boolean);
  const color = (c) => (COLORS.includes(c) ? `var(--ray-${c}-filled)` : c);
  if (parts[0]) el.style.setProperty("--_gradient-from", color(parts[0]));
  else el.style.removeProperty("--_gradient-from");
  if (parts[1]) el.style.setProperty("--_gradient-to", color(parts[1]));
  else el.style.removeProperty("--_gradient-to");
  if (parts[2]) el.style.setProperty("--_gradient-deg", /^-?\d+(\.\d+)?$/.test(parts[2]) ? `${parts[2]}deg` : parts[2]);
  else el.style.removeProperty("--_gradient-deg");
}

/**
 * Size scale on the host: --_h (control height), --_fs (font size),
 * --_px (horizontal padding), --_gap. Default `sm`, like Mantine.
 */
export const sizeStyles = css`
  :host {
    --_h: var(--ray-control-height-sm);
    --_fs: var(--ray-font-size-sm);
    --_px: 1.125rem;
    --_gap: var(--ray-space-2);
  }
  :host([size="xs"]) { --_h: var(--ray-control-height-xs); --_fs: var(--ray-font-size-xs); --_px: 0.875rem; --_gap: var(--ray-space-1); }
  :host([size="md"]) { --_h: var(--ray-control-height-md); --_fs: var(--ray-font-size-md); --_px: 1.375rem; }
  :host([size="lg"]) { --_h: var(--ray-control-height-lg); --_fs: var(--ray-font-size-lg); --_px: 1.625rem; --_gap: var(--ray-space-3); }
  :host([size="xl"]) { --_h: var(--ray-control-height-xl); --_fs: var(--ray-font-size-xl); --_px: 2rem; --_gap: var(--ray-space-3); }
`;

/** Radius on the host: --_r. Default: the system-wide --ray-radius-default. */
export const radiusStyles = css`
  :host { --_r: var(--ray-radius-default); }
  :host([radius="xs"]) { --_r: var(--ray-radius-xs); }
  :host([radius="sm"]) { --_r: var(--ray-radius-sm); }
  :host([radius="md"]) { --_r: var(--ray-radius-md); }
  :host([radius="lg"]) { --_r: var(--ray-radius-lg); }
  :host([radius="xl"]) { --_r: var(--ray-radius-xl); }
  :host([radius="full"]) { --_r: var(--ray-radius-full); }
`;

/**
 * Color variants for an element carrying data-variant and the --_<variant>
 * properties of applyColor(): filled, light, outline, subtle, default,
 * transparent, and gradient (applyGradient / --ray-gradient-*).
 */
export const variantStyles = css`
  [data-variant] {
    border: 1px solid transparent;
    transition:
      background-color var(--ray-duration-fast) var(--ray-easing-standard),
      border-color var(--ray-duration-fast) var(--ray-easing-standard),
      color var(--ray-duration-fast) var(--ray-easing-standard);
  }
  [data-variant="filled"] { background: var(--_filled); color: var(--_contrast); }
  [data-variant="light"] { background: var(--_light); color: var(--_light-color); }
  [data-variant="outline"] { background: transparent; color: var(--_outline); border-color: var(--_outline); }
  [data-variant="subtle"] { background: transparent; color: var(--_light-color); }
  [data-variant="transparent"] { background: transparent; color: var(--_light-color); }
  [data-variant="default"] { background: var(--ray-default); color: var(--ray-foreground); border-color: var(--ray-border); }
  [data-variant="gradient"] {
    background: linear-gradient(
      var(--_gradient-deg, var(--ray-gradient-deg)),
      var(--_gradient-from, var(--ray-gradient-from)),
      var(--_gradient-to, var(--ray-gradient-to))
    );
    color: var(--ray-white);
  }

  [data-interactive]:not([data-disabled])[data-variant="filled"]:hover { background: var(--_filled-hover); }
  [data-interactive]:not([data-disabled])[data-variant="light"]:hover { background: var(--_light-hover); }
  [data-interactive]:not([data-disabled])[data-variant="outline"]:hover { background: var(--_outline-hover); }
  [data-interactive]:not([data-disabled])[data-variant="subtle"]:hover { background: var(--_light); }
  [data-interactive]:not([data-disabled])[data-variant="default"]:hover { background: var(--ray-default-hover); }
  [data-interactive]:not([data-disabled])[data-variant="gradient"]:hover { filter: brightness(0.92); }

  [data-interactive][data-disabled] {
    background: var(--ray-muted);
    color: var(--ray-muted-foreground);
    border-color: var(--ray-border);
    cursor: not-allowed;
  }
  [data-interactive][data-disabled][data-variant="subtle"],
  [data-interactive][data-disabled][data-variant="transparent"] {
    background: transparent;
    border-color: transparent;
  }
`;

/** A ring spinner: <span class="loader"></span>, sized by --_loader (default 1em). */
export const loaderStyles = css`
  .loader {
    display: inline-block;
    flex: none;
    width: var(--_loader, 1em);
    height: var(--_loader, 1em);
    border: max(2px, calc(var(--_loader, 1em) / 8)) solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: ray-spin 0.75s linear infinite;
  }
  @keyframes ray-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .loader { animation-duration: 1.5s !important; }
  }
`;

/** Visually hidden but available to assistive technology. */
export const srOnlyStyles = css`
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
`;

/**
 * The backdrop of modal overlays (dialog, drawer, command palette): the
 * --ray-overlay color and, when --ray-overlay-blur is set (tokens default:
 * [overlay] blur), the page behind blurred. ::backdrop inherits from its
 * dialog, so both follow the element, its subtree or :root.
 */
export const overlayStyles = css`
  dialog::backdrop {
    background: var(--ray-overlay);
    -webkit-backdrop-filter: blur(var(--ray-overlay-blur, 0px));
    backdrop-filter: blur(var(--ray-overlay-blur, 0px));
  }
  @media (prefers-reduced-transparency: reduce) {
    dialog::backdrop { -webkit-backdrop-filter: none; backdrop-filter: none; }
  }
`;

/**
 * The overlay-blur attribute of an overlay: a number (px), a CSS length, or
 * "none"/"0" to turn the blur off. Unset: the inherited --ray-overlay-blur.
 */
export function applyOverlayBlur(el, value) {
  if (value === undefined || value === null || value === "") {
    el.style.removeProperty("--ray-overlay-blur");
    return;
  }
  const v = String(value).trim();
  const css = v === "none" ? "0px" : /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;
  el.style.setProperty("--ray-overlay-blur", css);
}
