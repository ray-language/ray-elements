# Document tabs

The tabs of open documents (an editor's, a browser's): closable, with an unsaved mark, all over one shared panel; WAI-ARIA tabs with arrows, Home/End and Delete to close. The app closes them: ray-request-close asks.

Import: `import "@raylang/elements/doc-tabs";` · Category: Navigation

## `<ray-doc-tabs>` (RayDocTabs, extends RayElement)

Unlike ray-tabs, a tab has no panel of its own: they all control the element named by panel, whose content the app fills for the selected one. Closing is the app's: the ×, a middle click or Delete/Backspace fire ray-request-close, and the app removes the tab (after asking about unsaved changes, if it must). When the selected tab is removed, the one at its place is selected (change) and, if the closed tab had the focus, focused. More tabs than width: the bar scrolls sideways, fades the edge that hides tabs (data-overflow-start / data-overflow-end on the host), scrolls with a vertical wheel and keeps the selected tab in view.

Properties:

- `value`: string. Value of the selected tab (default: the first).
- `panel`: string. The id of the shared panel: it gets role=tabpanel and aria-labelledby the selected tab; the tabs get aria-controls.
- `label`: string. Accessible name of the tab list ("Open requests").
- `closeLabel` (attribute `close-label`): string, default `Close`. Tooltip of the ×.
- `dirtyLabel` (attribute `dirty-label`): string, default `Unsaved changes`. What assistive technology hears after the name of a dirty tab.

Events:

- `change`: The selected tab changed: a click, the arrow keys, or the selected tab removed.
- `ray-request-close` (detail `{ value: string; tab: RayDocTab; source: "button" | "middle" | "key" }`): The × was clicked, the tab middle-clicked, or Delete/Backspace pressed on it: remove the tab to close it (not fired for hide-close tabs).

Slots:

- (default): ray-doc-tab elements.
- `end`: After the tabs, outside the scrolling list: a new-tab button.

Parts (`::part()`):

- `list`: The tab list (it scrolls sideways when the tabs do not fit).
- `end`: The end slot's box.

Methods and properties:

- `readonly tabs: RayDocTab[]`: Its tabs, in order.
- `readonly panelElement: HTMLElement | null`: The shared panel, found by the panel id.

## `<ray-doc-tab>` (RayDocTab, extends RayElement)

A document's tab: an icon or tag (slot left), its name (cut with an ellipsis; give the full one in title), and the × or the unsaved dot.

Properties:

- `value`: string, reflects. Identifies the document (ray-doc-tabs value).
- `dirty`: boolean, reflects. Unsaved changes: a dot in place of the ×, which comes back under the pointer.
- `hideClose` (attribute `hide-close`): boolean, reflects. Cannot be closed: no ×, no middle click, no Delete.

Slots:

- (default): The document's name.
- `left`: An icon or a tag (a file type, an HTTP method).

Parts (`::part()`):

- `label`: The name.
- `left-section`: The left slot's box.
- `close`: The × (pointer only: it is not focusable).
- `dot`: The unsaved mark.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-doc-tabs">
  <ray-doc-tabs id="demo-doc-tabs" panel="demo-doc-tabs-panel" label="Open requests" value="releases">
    <ray-doc-tab value="releases" title="GET /repos/ray/releases"><span slot="left" class="demo-method" data-method="GET">GET</span>List releases</ray-doc-tab>
    <ray-doc-tab value="create" title="POST /repos/ray/releases" dirty><span slot="left" class="demo-method" data-method="POST">POST</span>Create release</ray-doc-tab>
    <ray-doc-tab value="asset" title="DELETE /repos/ray/releases/assets/7"><span slot="left" class="demo-method" data-method="DELETE">DELETE</span>Delete asset</ray-doc-tab>
    <ray-icon-button slot="end" id="demo-doc-tabs-new" size="xs" label="New request"><ray-icon name="plus"></ray-icon></ray-icon-button>
  </ray-doc-tabs>
  <div id="demo-doc-tabs-panel" class="demo-doc-tabs-panel"></div>
</div>
<p class="demo-muted" style="margin: 0">Click a tab or use ←/→; × (or a middle click, or Delete on the focused tab) closes it. Closing the unsaved one asks first. The tabs share one panel, filled for the selected request.</p>

<script type="module">
  import { confirmDialog } from "@raylang/elements/dialog";

  const tabs = document.getElementById("demo-doc-tabs");
  const panel = document.getElementById("demo-doc-tabs-panel");
  const show = () => {
    const tab = tabs.tabs.find((t) => t.value === tabs.value);
    panel.textContent = tab ? tab.title : "No open requests.";
  };
  tabs.addEventListener("change", show);
  // The app closes the tab: after asking, when it has unsaved changes.
  tabs.addEventListener("ray-request-close", async (e) => {
    const { tab } = e.detail;
    if (tab.dirty && !(await confirmDialog({ label: "Discard changes?", message: `${tab.textContent.trim()} has unsaved changes.`, confirmLabel: "Discard", color: "red" }))) return;
    tab.remove();
  });
  let n = 0;
  document.getElementById("demo-doc-tabs-new").addEventListener("click", () => {
    const tab = document.createElement("ray-doc-tab");
    tab.value = `new-${++n}`;
    tab.title = "GET (new request)";
    tab.innerHTML = `<span slot="left" class="demo-method" data-method="GET">GET</span>New request ${n}`;
    tabs.querySelector('[slot="end"]').before(tab);
    tabs.value = tab.value;
    show();
  });
  show();
</script>
```
