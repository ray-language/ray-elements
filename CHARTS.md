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

Live, in the current theme (switch it in the header):

```demo
<div class="chart-palette">
  <span style="--c: var(--ray-chart-1)">chart-1</span>
  <span style="--c: var(--ray-chart-2)">chart-2</span>
  <span style="--c: var(--ray-chart-3)">chart-3</span>
  <span style="--c: var(--ray-chart-4)">chart-4</span>
  <span style="--c: var(--ray-chart-5)">chart-5</span>
  <span style="--c: var(--ray-chart-6)">chart-6</span>
  <span style="--c: var(--ray-chart-7)">chart-7</span>
  <span style="--c: var(--ray-chart-8)">chart-8</span>
</div>
```

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

A grouped bar chart drawn as SVG from data: the colors are `var()`, so a theme
or primary change repaints it with no code. The same data is one click away as
a table (see "Accessibility is the chart's job" below).

```demo
<figure class="chart-card">
  <div class="chart-card-head">
    <div><strong id="builds-title">Builds per month</strong><span id="builds-summary">macOS leads every month; all three platforms peak in August.</span></div>
    <ray-segmented-control id="builds-view" size="xs" value="chart" aria-label="View"><option value="chart">Chart</option><option value="table">Table</option></ray-segmented-control>
  </div>
  <svg id="builds-chart" role="img" aria-labelledby="builds-title builds-summary"></svg>
  <div id="builds-legend" class="chart-legend"></div>
  <table id="builds-table" class="ray-table" hidden></table>
</figure>
<script type="module">
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const series = [
    { name: "macOS", data: [42, 51, 47, 63, 55, 49] },
    { name: "Linux", data: [31, 36, 40, 52, 44, 38] },
    { name: "Windows", data: [18, 22, 25, 34, 27, 24] },
  ];
  const chart = document.getElementById("builds-chart");
  // Drawn at the element's own width, so the labels keep their size on a phone.
  function draw() {
    const W = chart.clientWidth || 560, H = 230, left = 32, bottom = 24, top = 8, max = 70;
    const y = (v) => top + (H - top - bottom) * (1 - v / max);
    const band = (W - left) / months.length, bar = Math.min(14, (band - 10) / series.length - 2);
    let svg = "";
    for (let v = 0; v <= max; v += 10) {
      svg += `<line x1="${left}" x2="${W}" y1="${y(v)}" y2="${y(v)}" style="stroke: var(--ray-chart-grid)"/>`;
      svg += `<text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" style="fill: var(--ray-chart-axis)">${v}</text>`;
    }
    months.forEach((m, i) => {
      const x0 = left + i * band + (band - (bar + 2) * series.length) / 2;
      series.forEach((s, j) => {
        const v = s.data[i];
        svg += `<rect x="${x0 + j * (bar + 2)}" y="${y(v)}" width="${bar}" height="${y(0) - y(v)}" rx="2" style="fill: var(--ray-chart-${j + 1})"><title>${s.name}, ${m}: ${v}</title></rect>`;
      });
      svg += `<text x="${left + i * band + band / 2}" y="${H - 6}" text-anchor="middle" style="fill: var(--ray-chart-axis)">${m}</text>`;
    });
    chart.setAttribute("viewBox", `0 0 ${W} ${H}`);
    chart.innerHTML = svg;
  }
  new ResizeObserver(draw).observe(chart);
  draw();
  document.getElementById("builds-legend").innerHTML = series
    .map((s, j) => `<span><i style="background: var(--ray-chart-${j + 1})"></i>${s.name}</span>`).join("");
  const table = document.getElementById("builds-table");
  table.innerHTML = `<thead><tr><th>Month</th>${series.map((s) => `<th>${s.name}</th>`).join("")}</tr></thead>` +
    `<tbody>${months.map((m, i) => `<tr><td>${m}</td>${series.map((s) => `<td>${s.data[i]}</td>`).join("")}</tr>`).join("")}</tbody>`;
  document.getElementById("builds-view").addEventListener("ray-change", (e) => {
    const asTable = e.detail.value === "table";
    table.hidden = !asTable;
    chart.style.display = asTable ? "none" : "";
    document.getElementById("builds-legend").hidden = asTable;
  });
</script>
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

Live: a line chart drawn on a canvas by hand, with no library. It reads the
colors with `chartTheme(card)` and redraws on `onChartThemeChange`. The card
has its own `data-theme`, so it can differ from the page:

```demo
<figure class="chart-card" id="latency-card">
  <div class="chart-card-head">
    <div><strong>p95 latency (ms)</strong><span>Last 24 hours, three regions</span></div>
    <ray-segmented-control id="latency-theme" size="xs" value="page" aria-label="Theme of this card"><option value="page">Page</option><option value="light">Light</option><option value="dark">Dark</option></ray-segmented-control>
  </div>
  <canvas id="latency-chart" role="img" aria-label="p95 latency by region over the last 24 hours: eu-west stays lowest; us-east spikes at 14:00."></canvas>
  <div id="latency-legend" class="chart-legend"></div>
</figure>
<script type="module">
  import { chartTheme, onChartThemeChange, withAlpha } from "@ray-ds/elements";
  const card = document.getElementById("latency-card");
  const canvas = document.getElementById("latency-chart");
  const regions = ["eu-west", "us-east", "ap-south"];
  const hours = Array.from({ length: 25 }, (_, h) => h);
  const wave = (base, amp, phase, spike) => hours.map((h) => Math.round(base + amp * Math.sin((h + phase) / 3.5) + (h === spike ? 70 : 0)));
  const data = [wave(48, 8, 0, -1), wave(74, 12, 2, 14), wave(96, 10, 5, -1)];
  const max = 180;

  function draw() {
    const t = chartTheme(card);
    const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = 220;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.height = h + "px";
    const g = canvas.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const left = 36, bottom = 22, top = 8;
    const x = (i) => left + (w - left - 24) * (i / (hours.length - 1));
    const y = (v) => top + (h - top - bottom) * (1 - v / max);
    g.font = `${t.font.size}px ${t.font.family}`;
    g.lineWidth = 1;
    for (let v = 0; v <= max; v += 60) {
      g.strokeStyle = t.grid; g.beginPath(); g.moveTo(left, y(v)); g.lineTo(w, y(v)); g.stroke();
      g.fillStyle = t.axis; g.textAlign = "right"; g.fillText(String(v), left - 8, y(v) + 4);
    }
    g.textAlign = "center";
    for (let i = 0; i < hours.length; i += 6) g.fillText(`${String(hours[i]).padStart(2, "0")}:00`, x(i), h - 6);
    data.forEach((d, s) => {
      g.beginPath();
      d.forEach((v, i) => (i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v))));
      g.strokeStyle = t.series[s]; g.lineWidth = 2; g.stroke();
      g.lineTo(x(d.length - 1), y(0)); g.lineTo(x(0), y(0)); g.closePath();
      g.fillStyle = withAlpha(t.series[s], 0.06); g.fill();
    });
    document.getElementById("latency-legend").innerHTML = regions
      .map((r, s) => `<span><i style="background: ${t.series[s]}"></i>${r}</span>`).join("");
  }
  document.getElementById("latency-theme").addEventListener("ray-change", (e) => {
    if (e.detail.value === "page") card.removeAttribute("data-theme");
    else card.setAttribute("data-theme", e.detail.value);
    draw();
  });
  onChartThemeChange(draw);
  new ResizeObserver(draw).observe(canvas);
  draw();
</script>
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
