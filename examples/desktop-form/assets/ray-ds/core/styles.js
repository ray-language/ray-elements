// Shared component styles: sizes, radius, color variants and the loader.
// Components add the sheets they need to their `static styles`.

import { css } from "./core.js";

/** Palette colors of tokens.toml; anything else given as `color` is used as a raw CSS color. */
export const COLORS = ["dark", "gray", "red", "pink", "violet", "indigo", "blue", "cyan", "teal", "green", "yellow", "orange"];

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
 * properties of applyColor(): filled, light, outline, subtle, default, transparent.
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
  [data-variant="default"] { background: var(--ray-background); color: var(--ray-foreground); border-color: var(--ray-border); }

  [data-interactive]:not([data-disabled])[data-variant="filled"]:hover { background: var(--_filled-hover); }
  [data-interactive]:not([data-disabled])[data-variant="light"]:hover { background: var(--_light-hover); }
  [data-interactive]:not([data-disabled])[data-variant="outline"]:hover { background: var(--_outline-hover); }
  [data-interactive]:not([data-disabled])[data-variant="subtle"]:hover { background: var(--_light); }
  [data-interactive]:not([data-disabled])[data-variant="default"]:hover { background: var(--ray-accent); }

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
