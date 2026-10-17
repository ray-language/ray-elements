# Search

A search box: icon, clear button, an optional shortcut that focuses it, and a debounced ray-search event. A RayInput, so it has a label and takes part in forms.

Import: `import "@raylang/elements/search";` · Category: Inputs

## `<ray-search>` (RaySearch, extends FieldControl)

Escape clears it (when it has text); Enter fires ray-search at once. JS: clear(), focus().

Properties:

- `value`: string. Current text.
- `placeholder`: string, default `Search…`. Placeholder text.
- `shortcut`: string. Keyboard shortcut that focuses it ("mod+k", "/"; mod = ⌘ on macOS, Ctrl elsewhere). Shown as a hint while empty.
- `debounce`: number, default `200`. Milliseconds of quiet typing before ray-search fires (0: on every keystroke).
- `name`: string, reflects. Form field name.
- `label`: string. Visible label (also the accessible name). Without it, use aria-label.
- `disabled`: boolean. Not editable nor submitted.
- `size`: `xs` | `sm` | `md` | `lg` | `xl`, default `sm`, reflects. Height and font size.
- `radius`: `xs` | `sm` | `md` | `lg` | `xl` | `full`. Corner radius.
- `variant`: `default` | `filled` | `unstyled`, default `filled`, reflects. Box style.

Also the properties of FieldControl: `description`, `error`, `required`, `descriptionPosition`.

Events:

- `input`: On every edit (value already updated).
- `ray-search` (detail `{ value: string }`): After `debounce` ms without typing, on Enter, and when cleared.

Parts (`::part()`):

- `input`: The inner <input type=search>.
- `icon`: The search icon.
- `clear`: The clear button.
- `shortcut`: The shortcut hint.
- `wrapper`: The box.

Methods and properties:

- `clear(): void`: Empties the box (fires input and ray-search).

Vue `v-model`: `value` (updated on input).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Filter a list as you type</div>
<div class="demo-filter">
  <div class="demo-filter-bar">
    <ray-search id="demo-pkg-search" aria-label="Search packages" placeholder="Search packages…" shortcut="/" debounce="0"></ray-search>
    <span class="demo-muted" id="demo-pkg-count">8 packages</span>
  </div>
  <ul class="demo-pkg-list" id="demo-pkg-list">
    <li data-keywords="http server router middleware"><strong>web</strong><span>The Express-style framework: routes, middleware, sessions.</span></li>
    <li data-keywords="http server client tls websocket"><strong>net</strong><span>Production HTTP server and client, TLS, WebSocket.</span></li>
    <li data-keywords="api calls typed"><strong>rpc</strong><span>Typed calls between a backend and its clients.</span></li>
    <li data-keywords="sql postgres sqlite migrations"><strong>db</strong><span>SQL with migrations: SQLite and Postgres.</span></li>
    <li data-keywords="components web design ui"><strong>ray-elements</strong><span>This design system: web components with raylang extras.</span></li>
    <li data-keywords="test browser webview"><strong>webtest</strong><span>Browser tests that run in the real webview.</span></li>
    <li data-keywords="queue jobs background cron"><strong>jobs</strong><span>Background jobs and schedules.</span></li>
    <li data-keywords="log metrics tracing"><strong>observe</strong><span>Logs, metrics and traces.</span></li>
  </ul>
  <p class="demo-pkg-empty" id="demo-pkg-empty" hidden>No package matches <b id="demo-pkg-query"></b>.</p>
</div>

<div class="demo-caption">ray-search: once the typing pauses</div>
<div class="demo-split">
  <div class="demo-stack">
    <ray-search id="demo-search" label="Search the docs" placeholder="Try “dialog” or “tokens”"></ray-search>
    <span class="demo-muted">ray-search fires 200 ms after the last key (debounce); input fires on every key.</span>
  </div>
  <ol class="demo-log" id="demo-search-log"><li class="demo-muted">Queries appear here.</li></ol>
</div>

<div class="demo-caption">Variants, sizes and radius</div>
<div class="demo-grid">
  <ray-search label="Filled (the default)" placeholder="Name or file"></ray-search>
  <ray-search label="Bordered" variant="default" placeholder="Name or file"></ray-search>
  <ray-search label="Large, round" size="lg" radius="full" placeholder="Search everything"></ray-search>
  <ray-search label="Extra small" size="xs" placeholder="Filter"></ray-search>
  <ray-search label="With a value" value="ray-dialog"></ray-search>
  <ray-search label="Disabled" placeholder="Offline" disabled></ray-search>
</div>
<div class="demo-unstyled">
  <ray-search aria-label="Search in the toolbar" variant="unstyled" placeholder="Unstyled: for a toolbar or a header"></ray-search>
</div>

<script type="module">
  // Filter: name and keywords, on every key (debounce="0").
  const search = document.getElementById("demo-pkg-search");
  const items = [...document.querySelectorAll("#demo-pkg-list li")];
  search.addEventListener("input", () => {
    const q = (search.value ?? "").trim().toLowerCase();
    let shown = 0;
    for (const li of items) {
      const hit = !q || li.textContent.toLowerCase().includes(q) || li.dataset.keywords.includes(q);
      li.hidden = !hit;
      shown += hit;
    }
    document.getElementById("demo-pkg-count").textContent = `${shown} package${shown === 1 ? "" : "s"}`;
    document.getElementById("demo-pkg-empty").hidden = shown > 0;
    document.getElementById("demo-pkg-query").textContent = `“${q}”`;
  });

  // The debounced event: the last five queries.
  const log = document.getElementById("demo-search-log");
  document.getElementById("demo-search").addEventListener("ray-search", (e) => {
    log.querySelector(".demo-muted")?.remove();
    const li = document.createElement("li");
    li.textContent = e.detail.value ? `“${e.detail.value}”` : "cleared";
    log.prepend(li);
    while (log.children.length > 5) log.lastElementChild.remove();
  });
</script>
```
