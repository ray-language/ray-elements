# Charts with ray-ds

ray-ds draws no charts. It gives charts what they need to look like the rest
of the app: a categorical palette and the chart chrome as tokens, checked at
build time, and `chartTheme()` to hand them to a chart library.

## The tokens

| Token | Use |
|---|---|
| `--ray-chart-1` … `--ray-chart-8` | series colors, **in this order** |
| `--ray-chart-grid` | grid lines, axis lines |
| `--ray-chart-axis` | tick labels |
| `--ray-chart-text` | legend, titles |
| `--ray-chart-tooltip`, `-tooltip-text`, `-tooltip-border` | tooltip box |

Every token has a light and a dark value. `ray run tools/src/main.ray tokens`
fails the build unless, in **both** schemes ([checks.chart] in `tokens.toml`):

- each series color reaches 3:1 against the background (non-text contrast,
  WCAG 1.4.11);
- any two series are at least 10 apart in OKLab (×100);

and warns when two **consecutive** series come closer than 6 under simulated
protanopia, deuteranopia or tritanopia (Machado et al. 2009). Change the
palette in `tokens.toml` and the checks tell you what breaks.

Eight colors is a ceiling, not a target: past five or six series a chart is
hard to read whatever the colors. Prefer direct labels, small multiples or
grouping into "other".

## SVG and HTML charts: use the variables

They follow the theme (light/dark, `data-primary`, `definePrimary`) by
themselves:

```html
<rect style="fill: var(--ray-chart-1)" …/>
<line style="stroke: var(--ray-chart-grid)" …/>
<text style="fill: var(--ray-chart-axis)">…</text>
```

## Canvas libraries: `chartTheme()`

Canvas does not understand `var()` nor `light-dark()`. `chartTheme(el?)`
returns the tokens resolved to plain colors for the theme of `el` (default:
the document; a subtree with its own `data-theme` or primary works too):

```js
import { chartTheme, onChartThemeChange, withAlpha } from "@ray-ds/elements";

const t = chartTheme();
// t.scheme              "light" | "dark"
// t.series              ["#228be6", "#e8590c", …]  (8 colors)
// t.grid, t.axis, t.text, t.background
// t.tooltip             { background, text, border }
// t.font                { family, size }
withAlpha(t.series[0], 0.15);   // "rgba(28, 126, 214, 0.15)" for area fills

// Redraw when the theme changes (setTheme, setPrimary, definePrimary, the system):
const stop = onChartThemeChange((t) => redraw(t));
```

The recipes below were checked against Chart.js 4.5, uPlot 1.6 and ECharts 6.1
in light and dark, switching theme at runtime.

### Chart.js

```js
function chartJsTheme(t) {
  const font = { family: t.font.family, size: t.font.size };
  const axis = { grid: { color: t.grid }, border: { color: t.grid }, ticks: { color: t.axis, font } };
  return {
    color: t.text,
    scales: { x: axis, y: axis },
    plugins: {
      legend: { labels: { color: t.text, font } },
      tooltip: {
        backgroundColor: t.tooltip.background, titleColor: t.tooltip.text, bodyColor: t.tooltip.text,
        borderColor: t.tooltip.border, borderWidth: 1,
      },
    },
  };
}

let t = chartTheme();
const chart = new Chart(canvas, {
  type: "bar",
  data: { labels, datasets: series.map((data, i) => ({ label: names[i], data, backgroundColor: t.series[i], borderColor: t.series[i] })) },
  options: { responsive: true, maintainAspectRatio: false, ...chartJsTheme(t) },
});

onChartThemeChange((t) => {
  Object.assign(chart.options, chartJsTheme(t));
  chart.data.datasets.forEach((d, i) => { d.backgroundColor = t.series[i]; d.borderColor = t.series[i]; });
  chart.update();
});
```

### uPlot

uPlot does not restyle a live chart: rebuild it.

```js
function uplotOptions(t, width) {
  const font = `${t.font.size}px ${t.font.family}`;
  const axis = { stroke: t.axis, grid: { stroke: t.grid, width: 1 }, ticks: { stroke: t.grid, width: 1 }, font };
  return {
    width, height: 220,
    scales: { x: { time: false } },            // index x values, not timestamps
    axes: [{ ...axis, values: (u, ticks) => ticks.map((i) => labels[i] ?? "") }, axis],
    series: [{}, ...series.map((_, i) => ({ label: names[i], stroke: t.series[i], fill: withAlpha(t.series[i], 0.12), width: 2 }))],
  };
}

let plot = new uPlot(uplotOptions(chartTheme(), el.clientWidth), [xs, ...series], el);
onChartThemeChange((t) => {
  plot.destroy();
  plot = new uPlot(uplotOptions(t, el.clientWidth), [xs, ...series], el);
});
```

### ECharts

```js
function echartsOption(t) {
  const axisStyle = { axisLine: { lineStyle: { color: t.grid } }, axisLabel: { color: t.axis }, splitLine: { lineStyle: { color: t.grid } } };
  return {
    color: t.series,
    backgroundColor: "transparent",
    textStyle: { color: t.text, fontFamily: t.font.family },
    tooltip: { trigger: "axis", backgroundColor: t.tooltip.background, borderColor: t.tooltip.border, textStyle: { color: t.tooltip.text } },
    legend: { textStyle: { color: t.text } },
    xAxis: { type: "category", data: labels, ...axisStyle },
    yAxis: { type: "value", ...axisStyle },
    series: series.map((data, i) => ({ name: names[i], type: "line", data })),
  };
}

const chart = echarts.init(el);
chart.setOption(echartsOption(chartTheme()));
onChartThemeChange((t) => chart.setOption(echartsOption(t)));
```

## Accessibility is the chart's job

The palette is checked, but a chart still needs: a text alternative (a title
and a one-line summary of what it shows), the data available as a table (a
`<ray-table>` next to it, or behind a toggle), legends or direct labels so
color is not the only cue, and no motion when `prefers-reduced-motion` is set
(disable the library's animation).

## Not in ray-ds (for now)

Chart components of its own — SVG primitives, or an adapter for dense
real-time series — were discussed and left out; see the roadmap in the README.
