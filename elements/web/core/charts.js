// Chart theming: ray-elements draws no charts; this hands the chart tokens
// (--ray-chart-*, tokens.toml) to a chart library.
//
// SVG/HTML charts can use the CSS variables directly (fill: var(--ray-chart-1))
// and follow the theme by themselves. Canvas libraries (Chart.js, uPlot,
// ECharts…) need concrete colors: chartTheme() resolves them for the
// current theme of an element, and onChartThemeChange() tells when to redraw.

import { onThemeChange, resolvedTheme } from "./core.js";

/** Number of series colors (--ray-chart-1 … --ray-chart-8). */
export const CHART_SERIES = 8;

let ctx = null;

/**
 * A computed CSS color as "#rrggbb" (opaque) or "rgba(r, g, b, a)" — what every
 * canvas accepts. Computed values come as rgb()/rgba() or, for color-mix() and
 * friends, as color(srgb r g b / a), which WebKit's canvas does not take:
 * parsed here rather than trusted to the canvas.
 */
function normalize(color) {
  const c = String(color).trim();
  let rgba = null;
  const srgb = c.match(/^color\(srgb\s+([^)]+)\)$/i);
  const fn = c.match(/^rgba?\(([^)]+)\)$/i);
  if (srgb) {
    const [chan, alpha] = srgb[1].split("/");
    const [r, g, b] = chan.trim().split(/\s+/).map((x) => Number(x) * 255);
    rgba = [r, g, b, alpha === undefined ? 1 : Number(alpha)];
  } else if (fn) {
    const parts = fn[1].replace("/", " ").split(/[\s,]+/).filter(Boolean).map(Number);
    rgba = [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  if (!rgba || rgba.some((x) => Number.isNaN(x))) {
    // Anything else (a named color, hex): let the canvas serialize it.
    ctx ??= document.createElement("canvas").getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillStyle = c;
    return ctx.fillStyle;
  }
  const [r, g, b, a] = rgba.map((x, i) => (i < 3 ? Math.round(Math.min(255, Math.max(0, x))) : x));
  if (a >= 1) return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * A color with an alpha, for area fills and highlights: withAlpha("#1c7ed6", 0.2).
 * @returns {string} rgba(...)
 */
export function withAlpha(color, alpha) {
  const c = normalize(color);
  const hex = c.startsWith("#") ? c : null;
  let r, g, b;
  if (hex) {
    const n = parseInt(hex.slice(1), 16);
    [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else {
    [r, g, b] = c.match(/[\d.]+/g).map(Number);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The chart tokens resolved for the theme of `el` (default: the document):
 * its color scheme, data-primary and any token overrides apply.
 * @param {Element} [el]
 */
export function chartTheme(el = document.documentElement) {
  const host = el === document.documentElement ? document.body ?? el : el;
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden";
  host.append(probe);
  const color = (name) => {
    probe.style.color = `var(--ray-${name})`;
    return normalize(getComputedStyle(probe).color);
  };
  try {
    const series = [];
    for (let i = 1; i <= CHART_SERIES; i++) series.push(color(`chart-${i}`));
    probe.style.fontFamily = "var(--ray-font-sans)";
    probe.style.fontSize = "var(--ray-font-size-xs)";
    const cs = getComputedStyle(probe);
    return {
      scheme: resolvedTheme(el),
      series,
      background: color("background"),
      grid: color("chart-grid"),
      axis: color("chart-axis"),
      text: color("chart-text"),
      tooltip: { background: color("chart-tooltip"), text: color("chart-tooltip-text"), border: color("chart-tooltip-border") },
      font: { family: cs.fontFamily, size: parseFloat(cs.fontSize) },
    };
  } finally {
    probe.remove();
  }
}

/**
 * Calls `cb(chartTheme(el))` whenever the theme changes (setTheme,
 * setPrimary, definePrimary, the system scheme). Returns a function that stops.
 * @param {(theme: ReturnType<typeof chartTheme>) => void} cb
 */
export function onChartThemeChange(cb, el = document.documentElement) {
  // After the change has applied (attributes and styles are set synchronously).
  return onThemeChange(() => queueMicrotask(() => cb(chartTheme(el))));
}
