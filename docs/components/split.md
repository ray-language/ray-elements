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

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.20.1.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
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
```
