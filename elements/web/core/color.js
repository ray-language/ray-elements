// Color math for definePrimary(): parse any CSS color, build a ten-shade
// scale in OKLCH (perceptually even lightness, same hue), and measure WCAG
// contrast. OKLab from Björn Ottosson (https://bottosson.github.io/posts/oklab/).

/** Target lightness (OKLab L) of shades 0…9, like the open-color scales. */
const LIGHTNESS = [0.97, 0.93, 0.87, 0.8, 0.73, 0.67, 0.61, 0.55, 0.49, 0.43];
/** Chroma of each shade relative to the base color's (pale ends are less saturated). */
const CHROMA = [0.12, 0.25, 0.45, 0.65, 0.8, 0.92, 1, 1, 0.95, 0.88];

let ctx = null;

/**
 * Any CSS color the browser understands ("#7c3aed", "rebeccapurple",
 * "oklch(60% 0.2 280)") as sRGB channels 0…1, or null if it is not a color.
 */
export function parseColor(input) {
  if (typeof input !== "string" || !input.trim()) return null;
  ctx ??= document.createElement("canvas").getContext("2d");
  // A sentinel tells an invalid color (fillStyle keeps the previous value) apart.
  for (const sentinel of ["#010203", "#040506"]) {
    ctx.fillStyle = sentinel;
    ctx.fillStyle = input.trim();
    const v = ctx.fillStyle;
    if (v !== sentinel) return fromCanvas(v);
  }
  // Both sentinels survived: the input is one of them, or invalid.
  const t = input.trim().toLowerCase();
  return t === "#010203" || t === "#040506" ? fromCanvas(t) : null;
}

function fromCanvas(v) {
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b] = m[1].split(",").map((x) => Number(x.trim()) / 255);
  return { r, g, b };
}

export function toHex({ r, g, b }) {
  const h = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function toOklch({ r, g, b }) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

export function fromOklch({ l: L, c, h }) {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

const inGamut = ({ r, g, b }) => [r, g, b].every((x) => x >= -0.0005 && x <= 1.0005);

/** The color with chroma reduced until it fits in sRGB. */
function fit(lch) {
  let c = lch.c;
  let rgb = fromOklch({ ...lch, c });
  for (let i = 0; i < 60 && !inGamut(rgb); i++) {
    c *= 0.95;
    rgb = fromOklch({ ...lch, c });
  }
  return rgb;
}

/**
 * Ten shades (0 = lightest) around `rgb`: the base color itself sits at the
 * shade whose lightness is closest to its own; the others keep its hue.
 * @returns {string[]} hex colors
 */
export function shades(rgb) {
  const base = toOklch(rgb);
  let closest = 0;
  LIGHTNESS.forEach((l, i) => {
    if (Math.abs(l - base.l) < Math.abs(LIGHTNESS[closest] - base.l)) closest = i;
  });
  return LIGHTNESS.map((l, i) => (i === closest ? toHex(rgb) : toHex(fit({ l, c: base.c * CHROMA[i], h: base.h }))));
}

function luminance(hex) {
  const { r, g, b } = fromCanvas(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio of two hex colors (1…21). */
export function contrastRatio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
