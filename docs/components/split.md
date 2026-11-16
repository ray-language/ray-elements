# Split

Two panes with a draggable, keyboard-accessible divider (window splitter pattern); one pane has the size (the start one, or the end one with fixed="end": a docked inspector), which can be remembered.

Import: `import "@raylang/elements/split";` · Category: Layout

## `<ray-split>` (RaySplit, extends RayElement)

Divider keys: arrows move it (Shift: faster), Home/End go to min/max, Enter or double click collapse the sized pane. position, min, max and collapsed are the sized pane's: the start pane, or the end pane with fixed="end".

Properties:

- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. horizontal: side by side; vertical: stacked.
- `fixed`: `start` | `end`, default `start`, reflects. The pane that has the size and collapses; the other takes the rest. end: a panel docked on the end side (an inspector) that keeps its width while the start pane stretches.
- `position`: string, default `50%`. Initial size of the sized pane: px (280) or any CSS length (30%, 20rem).
- `min`: number, default `0`. Minimum size of the sized pane in px.
- `max`: number. Maximum size of the sized pane in px.
- `collapsed`: boolean, reflects. The sized pane is hidden.
- `disabled`: boolean, reflects. The divider cannot be moved.
- `autosave`: string. A key: the size and the collapsed state are saved in localStorage and restored (a saved state wins over the collapsed attribute).

Events:

- `ray-resize` (detail `{ size: number; collapsed: boolean }`): After a drag, a key or a collapse.

Slots:

- `start`: The first pane: sized (a sidebar), or the one that takes the rest with fixed="end".
- `end`: The second pane: the one that takes the rest, or sized with fixed="end" (an inspector).

Parts (`::part()`):

- `divider`: The separator.
- `start`: The start pane.
- `end`: The end pane.

Methods and properties:

- `readonly size: number`: The sized pane's size in px.
- `toggle(): void`: Collapses or restores the sized pane.

Texts (`setStrings`; English):

- `split.resize`: Resize

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.22.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">An editor: a sidebar, and a terminal docked under the code (nested splits)</div>
<div class="demo-ide">
  <div class="demo-ide-titlebar"><span class="demo-ide-lights" aria-hidden="true"><i></i><i></i><i></i></span><span>ray-remote — main.ray</span></div>
  <ray-split position="210" min="150" max="360" autosave="docs-demo" aria-label="Resize the explorer" style="flex: 1; min-height: 0">
    <nav slot="start" class="demo-ide-explorer" aria-label="Files">
      <p class="demo-ide-heading">Explorer</p>
      <ray-nav-link label="src" opened><ray-icon slot="left" name="folder"></ray-icon>
        <ray-nav-link label="main.ray" active><ray-icon slot="left" name="file"></ray-icon></ray-nav-link>
        <ray-nav-link label="server.ray"><ray-icon slot="left" name="file"></ray-icon></ray-nav-link>
      </ray-nav-link>
      <ray-nav-link label="tests"><ray-icon slot="left" name="folder"></ray-icon></ray-nav-link>
      <ray-nav-link label="ray.toml"><ray-icon slot="left" name="settings"></ray-icon></ray-nav-link>
    </nav>
    <ray-split slot="end" orientation="vertical" fixed="end" position="38%" min="70" aria-label="Resize the terminal">
      <section slot="start" class="demo-ide-editor" aria-label="Editor">
        <div class="demo-ide-tabs"><span class="demo-ide-tab" aria-current="true">main.ray</span><span class="demo-ide-tab">server.ray</span></div>
        <pre class="demo-ide-code"><code><span class="ln">1</span><span class="k">import</span> net/http;
<span class="ln">2</span>
<span class="ln">3</span><span class="k">fn</span> main() -&gt; <span class="t">int</span> {
<span class="ln">4</span>    print(<span class="s">"hello from raylang"</span>);
<span class="ln">5</span>    <span class="n">0</span>
<span class="ln">6</span>}</code></pre>
      </section>
      <section slot="end" class="demo-ide-terminal" aria-label="Terminal">
        <p class="demo-ide-heading">Terminal</p>
        <pre><span class="p">$</span> ray run
hello from raylang
<span class="ok">✓</span> exited with 0 in 41 ms</pre>
      </section>
    </ray-split>
  </ray-split>
  <ray-statusbar>
    <ray-statusbar-item><ray-icon slot="icon" name="terminal"></ray-icon>main</ray-statusbar-item>
    <ray-statusbar-item>Ln 4, Col 5</ray-statusbar-item>
    <ray-statusbar-item slot="right">Drag a divider, or focus it and use the arrows</ray-statusbar-item>
    <ray-statusbar-item slot="right">raylang</ray-statusbar-item>
  </ray-statusbar>
</div>

<div class="demo-caption">Mail: three panes, each divider with its own limits</div>
<div class="demo-ide demo-split-mail">
  <ray-split position="170" min="130" max="240" aria-label="Resize the folders" style="flex: 1; min-height: 0">
    <nav slot="start" class="demo-ide-explorer" aria-label="Mailboxes">
      <p class="demo-ide-heading">Mailboxes</p>
      <ray-nav-link label="Inbox" active><ray-icon slot="left" name="home"></ray-icon><ray-badge slot="right" size="xs">3</ray-badge></ray-nav-link>
      <ray-nav-link label="Starred"><ray-icon slot="left" name="star"></ray-icon></ray-nav-link>
      <ray-nav-link label="Attachments"><ray-icon slot="left" name="paperclip"></ray-icon></ray-nav-link>
      <ray-nav-link label="Trash"><ray-icon slot="left" name="trash"></ray-icon></ray-nav-link>
    </nav>
    <ray-split slot="end" position="44%" min="200" max="420" aria-label="Resize the message list">
      <ul slot="start" class="demo-mail-list" aria-label="Messages">
        <li aria-current="true"><b>Ana Torres</b><span>Release notes for 0.22</span><small>The knob is in, with a log scale for the EQ…</small></li>
        <li class="unread"><b>CI</b><span>release.yml passed</span><small>check ✓ · npm ✓ · three packages published</small></li>
        <li class="unread"><b>Luis Pérez</b><span>Mixer layout</span><small>Could the meter scale go next to the fader?</small></li>
        <li><b>ray-index</b><span>elements@0.22.0</span><small>Index updated from the maintainer's machine.</small></li>
      </ul>
      <article slot="end" class="demo-mail-read" aria-label="Message">
        <h3>Release notes for 0.22</h3>
        <p class="demo-mail-from">Ana Torres · today, 9:41</p>
        <p>The knob is in, with a log scale for the EQ frequency and a bipolar arc for pan. Drag the dividers: the folders stop between 130 and 240 px, the list between 200 and 420.</p>
      </article>
    </ray-split>
  </ray-split>
</div>

<div class="demo-caption">A docked inspector: fixed="end" keeps its width while the canvas stretches</div>
<div class="demo-ide demo-split-design">
  <div class="demo-ide-titlebar"><span class="demo-ide-lights" aria-hidden="true"><i></i><i></i><i></i></span><span>poster.design</span>
    <ray-icon-button id="demo-inspector-toggle" class="demo-split-titlebtn" size="xs" label="Toggle the inspector" aria-pressed="true"><ray-icon name="panel-left" style="transform: scaleX(-1)"></ray-icon></ray-icon-button>
  </div>
  <ray-split id="demo-inspector" fixed="end" position="240" min="200" max="360" aria-label="Resize the inspector" style="flex: 1; min-height: 0">
    <div slot="start" class="demo-canvas" aria-label="Canvas" role="img">
      <div class="demo-canvas-art" id="demo-canvas-art"><span>ray·elements</span></div>
    </div>
    <aside slot="end" class="demo-inspector" aria-label="Inspector">
      <p class="demo-ide-heading">Inspector</p>
      <ray-slider id="demo-radius" label="Corner radius" value="16" max="48" show-value unit=" px" size="xs"></ray-slider>
      <ray-slider id="demo-rotate" label="Rotation" value="-4" min="-30" max="30" show-value unit="°" size="xs" color="violet"></ray-slider>
      <ray-switch id="demo-shadow" label="Shadow" checked></ray-switch>
      <p class="demo-inspector-size">Width: <output id="demo-inspector-width">240 px</output></p>
    </aside>
  </ray-split>
</div>

<div class="demo-caption">Collapsed until needed: the results open when the query runs</div>
<div class="demo-ide demo-split-query">
  <ray-split id="demo-query" orientation="vertical" fixed="end" position="55%" min="80" collapsed aria-label="Resize the results" style="flex: 1; min-height: 0">
    <section slot="start" class="demo-ide-editor" aria-label="Query">
      <div class="demo-ide-tabs"><span class="demo-ide-tab" aria-current="true">medications.sql</span>
        <ray-button id="demo-query-run" class="demo-split-run" size="xs" color="green"><ray-icon slot="left" name="play"></ray-icon>Run</ray-button>
      </div>
      <pre class="demo-ide-code"><code><span class="ln">1</span><span class="k">select</span> name, dose, next_at
<span class="ln">2</span>  <span class="k">from</span> alarms
<span class="ln">3</span> <span class="k">where</span> active = <span class="n">1</span>
<span class="ln">4</span> <span class="k">order by</span> next_at;</code></pre>
    </section>
    <section slot="end" class="demo-query-results" aria-label="Results">
      <p class="demo-ide-heading">Results <span id="demo-query-meta"></span></p>
      <table>
        <thead><tr><th>name</th><th>dose</th><th>next_at</th></tr></thead>
        <tbody><tr><td>Ibuprofen</td><td>400 mg</td><td>14:00</td></tr><tr><td>Vitamin D</td><td>1000 IU</td><td>20:00</td></tr><tr><td>Omeprazole</td><td>20 mg</td><td>08:00</td></tr></tbody>
      </table>
    </section>
  </ray-split>
</div>

<style>
  .demo-split-mail, .demo-split-design { height: 20rem; }
  .demo-split-query { height: 18rem; }
  .demo-mail-list { margin: 0; padding: 0; list-style: none; height: 100%; overflow: auto; border-right: 1px solid var(--ray-border); }
  .demo-mail-list li { display: grid; gap: 2px; padding: var(--ray-space-2) var(--ray-space-3); border-bottom: 1px solid var(--ray-border); font-size: var(--ray-font-size-sm); }
  .demo-mail-list li[aria-current] { background: color-mix(in srgb, var(--ray-primary) 10%, var(--ray-card)); box-shadow: inset 3px 0 0 var(--ray-primary); }
  .demo-mail-list li.unread b { color: var(--ray-primary); }
  .demo-mail-list span { font-weight: var(--ray-font-weight-medium); }
  .demo-mail-list small, .demo-mail-from { color: var(--ray-muted-foreground); font-size: var(--ray-font-size-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .demo-mail-read { height: 100%; box-sizing: border-box; padding: var(--ray-space-4); overflow: auto; font-size: var(--ray-font-size-sm); }
  .demo-mail-read h3 { margin: 0 0 var(--ray-space-1); font-size: var(--ray-font-size-md); }
  .demo-mail-from { margin: 0 0 var(--ray-space-3); }
  .demo-split-titlebtn { position: absolute; right: 0.5rem; }
  .demo-canvas { display: grid; place-items: center; height: 100%; overflow: hidden; background-color: var(--ray-muted); background-image: radial-gradient(color-mix(in srgb, var(--ray-foreground) 18%, transparent) 1px, transparent 1px); background-size: 16px 16px; }
  .demo-canvas-art { display: grid; place-items: center; width: 11rem; aspect-ratio: 3 / 4; color: #fff; font-weight: var(--ray-font-weight-semibold); background: linear-gradient(150deg, var(--ray-violet-light-color, #7c3aed), var(--ray-primary)); transition: border-radius 0.1s, transform 0.1s, box-shadow 0.2s; }
  .demo-inspector { display: grid; align-content: start; gap: var(--ray-space-4); height: 100%; box-sizing: border-box; padding: var(--ray-space-3); overflow: auto; background: color-mix(in srgb, var(--ray-muted) 50%, var(--ray-card)); }
  .demo-inspector .demo-ide-heading { padding: 0; margin: 0; }
  .demo-inspector-size { margin: 0; font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  .demo-inspector-size output { font-variant-numeric: tabular-nums; }
  .demo-split-run { margin: auto var(--ray-space-2) auto auto; }
  .demo-query-results { height: 100%; box-sizing: border-box; padding: var(--ray-space-3) var(--ray-space-2); overflow: auto; background: color-mix(in srgb, var(--ray-muted) 35%, var(--ray-card)); }
  .demo-query-results .demo-ide-heading span { font-weight: normal; text-transform: none; letter-spacing: 0; }
  .demo-query-results table { width: 100%; border-collapse: collapse; font-family: var(--ray-font-mono); font-size: 0.75rem; }
  .demo-query-results th, .demo-query-results td { padding: 0.3rem var(--ray-space-2); text-align: start; border-bottom: 1px solid var(--ray-border); }
  .demo-query-results th { color: var(--ray-muted-foreground); font-weight: var(--ray-font-weight-medium); }
</style>

<script type="module">
  const inspector = document.getElementById("demo-inspector");
  const toggle = document.getElementById("demo-inspector-toggle");
  const width = document.getElementById("demo-inspector-width");
  const art = document.getElementById("demo-canvas-art");
  toggle.addEventListener("click", () => inspector.toggle());
  inspector.addEventListener("ray-resize", (e) => {
    toggle.setAttribute("aria-pressed", String(!e.detail.collapsed));
    if (!e.detail.collapsed) width.textContent = `${Math.round(e.detail.size)} px`;
  });
  const radius = document.getElementById("demo-radius");
  const rotate = document.getElementById("demo-rotate");
  const shadow = document.getElementById("demo-shadow");
  const paint = () => {
    art.style.borderRadius = `${radius.value}px`;
    art.style.transform = `rotate(${rotate.value}deg)`;
    art.style.boxShadow = shadow.checked ? "var(--ray-shadow-lg)" : "none";
  };
  for (const el of [radius, rotate, shadow]) el.addEventListener("input", paint);
  shadow.addEventListener("change", paint);
  paint();

  const query = document.getElementById("demo-query");
  document.getElementById("demo-query-run").addEventListener("click", () => {
    document.getElementById("demo-query-meta").textContent = `· 3 rows in ${12 + Math.round(Math.random() * 20)} ms`;
    query.collapsed = false;
  });
</script>
```
