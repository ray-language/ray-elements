# Dialog (also Modal)

ray-elements's modal, on the native <dialog>: top layer, the rest of the page inert, focus trapped and restored, stackable. Title, description, header, body and footer; preset or free sizes. Also exports confirmDialog().

Import: `import "@raylang/elements/dialog";` · Category: Overlays

## `<ray-dialog>` (RayDialog, extends RayElement)

Any slotted element with data-dialog-close closes it (its value becomes returnValue). JS: show(), close(returnValue), confirmDialog({ label, message, confirmLabel, cancelLabel, color, native }) -> Promise<boolean>; with a native host (ray-elements/core/raylang.js in a std/ui window) it asks with the system dialog unless native is false.

Properties:

- `open`: boolean, reflects. Shown as a modal.
- `label`: string. Heading (also the dialog's accessible name).
- `description`: string. A line under the title (the dialog's accessible description).
- `size`: `"xs" | "sm" | "md" | "lg" | "xl" | "full" | (string & {})`, default `md`, reflects. Width: xs…xl, full (the whole window), or any CSS length; a percentage is of the window (70% = 70vw, at least 40rem). Never wider than the window.
- `height`: string, reflects. Fixed height (the body scrolls): any CSS length; a percentage is of the window (70% = 70dvh, at least 30rem). Never taller than the window. Default: as tall as the content, up to the window.
- `radius`: string, reflects. Corner radius: xs…xl, none, or a CSS length. Default: lg.
- `position`: `center` | `top`, default `center`, reflects. Vertical placement.
- `persistent`: boolean, reflects. Escape and backdrop clicks do not close it (the × still does; hide it with hide-close). To allow only one of them, cancel ray-request-close by its source.
- `hideClose` (attribute `hide-close`): boolean, reflects. No close button in the header.
- `overlayBlur` (attribute `overlay-blur`): string. Blur of the page behind: px ("8"), a CSS length or "none". Default: --ray-overlay-blur ([overlay] blur in tokens.toml).

Events:

- `ray-open`: After it opened.
- `ray-close` (detail `{ returnValue: string }`): After it closed; detail: { returnValue }.
- `ray-request-close` (detail `{ source: "escape" | "backdrop" | "button" }`): Escape, backdrop or close button; cancelable (preventDefault keeps it open). detail: { source }.

Slots:

- (default): Body.
- `header`: Extra header content, next to the title.
- `footer`: Actions, aligned to the end.

Parts (`::part()`):

- `dialog`: The native <dialog>.
- `title`: The heading.
- `description`: The line under the heading.
- `header`: The header: title, description, the header slot and the close button.
- `body`: The scrollable body.
- `footer`: The footer.
- `close`: The close button.

Methods and properties:

- `show(): void`: Opens it.
- `close(returnValue?: string): void`: Closes it with an optional return value.
- `returnValue: string`: The value it was closed with.

Vue `v-model`: `open` (updated on ray-open, ray-close).

Exports (from `@raylang/elements/dialog` and `@raylang/elements`):

- `function confirmDialog(options?: ConfirmOptions): Promise<boolean>`: A confirmation dialog; resolves true when confirmed. With a native host, the system dialog (native: false keeps the ray-dialog).

Types:

- `{ label?: string; message?: string; confirmLabel?: string; cancelLabel?: string; color?: string; native?: boolean }`: Options of confirmDialog().

## In a raylang app

With [the native bridge](https://elements.raylang.dev/raylang.html#using-the-bridge), `confirmDialog()` asks with the system's modal dialog instead of a `ray-dialog`, with the same answer. A red confirmation (a destructive action) gets the warning style. `native: false` keeps the page's dialog, for a question that needs more than a sentence.

```js
if (await confirmDialog({ label: "Delete 3 builds?", message: "This cannot be undone.", confirmLabel: "Delete", color: "red" })) {
  window.ray.send("delete:" + ids.join(","));
}
```

`ray-dialog` itself is always the page's: a form, a settings panel or a wizard stay in the page.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">The modal</div>
<div class="demo-modal-hero">
  <div class="demo-modal-hero-text">
    <strong>ray-dialog is the modal of ray-elements</strong>
    <span>Backdrop, inert page, trapped and restored focus, Escape, stacking. This one takes 70% of the window (<code>size="70%" height="70%"</code>) and holds a whole settings screen: vertical tabs, fields, a table, sliders, switches and a confirmation stacked on top.</span>
  </div>
  <ray-button data-open="dlg-settings"><ray-icon slot="left" name="settings"></ray-icon>Project settings</ray-button>
  <span data-out="dlg-settings"></span>
</div>

<ray-dialog id="dlg-settings" label="Project settings" description="ray-remote · desktop app · last deployed 2 hours ago" size="70%" height="70%">
  <ray-badge slot="header" variant="dot" color="green" normal-case>Live</ray-badge>
  <ray-tabs class="demo-settings" variant="outline" orientation="vertical" value="general">
    <ray-tab value="general"><ray-icon slot="left" name="settings"></ray-icon>General</ray-tab>
    <ray-tab value="members"><ray-icon slot="left" name="user"></ray-icon>Members</ray-tab>
    <ray-tab value="build"><ray-icon slot="left" name="terminal"></ray-icon>Build</ray-tab>
    <ray-tab value="notifications"><ray-icon slot="left" name="info"></ray-icon>Notifications</ray-tab>
    <ray-tab value="danger"><ray-icon slot="left" name="alert-triangle"></ray-icon>Danger zone</ray-tab>

    <ray-tab-panel value="general">
      <div class="demo-settings-section">
        <div class="demo-settings-identity">
          <ray-avatar name="Ray Remote" color="violet" size="xl" radius="md"></ray-avatar>
          <ray-file-upload variant="compact" accept="image/*" list="none" drop-label="Drop a new icon" browse-label="browse"></ray-file-upload>
        </div>
        <div class="demo-dialog-form">
          <ray-input name="name" label="Name" value="ray-remote" required></ray-input>
          <ray-input name="id" label="Bundle id" value="dev.ray.remote" description="Reverse DNS, used by the installers."></ray-input>
        </div>
        <ray-textarea name="about" label="Description" rows="2" value="Control a machine from your phone: terminal, files and screen."></ray-textarea>
        <div class="demo-dialog-form">
          <ray-select name="region" label="Update channel" value="stable">
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="nightly">Nightly</option>
          </ray-select>
          <div class="demo-field">Visibility
            <ray-segmented-control name="visibility" value="team" aria-label="Visibility"><option value="private">Private</option><option value="team">Team</option><option value="public">Public</option></ray-segmented-control>
          </div>
        </div>
      </div>
    </ray-tab-panel>

    <ray-tab-panel value="members">
      <div class="demo-settings-section">
        <div class="demo-settings-invite">
          <ray-input label="Invite by email" placeholder="name@company.com" type="email" style="flex: 1"></ray-input>
          <ray-select label="Role" value="developer" style="width: 9rem"><option value="admin">Admin</option><option value="developer">Developer</option><option value="viewer">Viewer</option></ray-select>
          <ray-button variant="light">Invite</ray-button>
        </div>
        <ray-table id="dlg-settings-members" with-border label="Members"></ray-table>
      </div>
    </ray-tab-panel>

    <ray-tab-panel value="build">
      <div class="demo-settings-section">
        <div class="demo-dialog-form">
          <ray-select label="Target" value="native"><option value="vm">VM</option><option value="native">Native (--release)</option></ray-select>
          <ray-input label="Entry" value="src/main.ray"></ray-input>
        </div>
        <ray-slider label="Parallel jobs" min="1" max="16" value="6" show-value></ray-slider>
        <ray-slider label="Cache size" min="0" max="8" step="0.5" value="2" show-value unit=" GB" color="teal"></ray-slider>
        <div class="demo-settings-toggles">
          <ray-switch label="Run tests before every build" checked></ray-switch>
          <ray-switch label="Sign the macOS bundle" checked></ray-switch>
          <ray-switch label="Publish to the update channel"></ray-switch>
        </div>
      </div>
    </ray-tab-panel>

    <ray-tab-panel value="notifications">
      <div class="demo-settings-section">
        <ray-radio-group label="Email me about" value="failures">
          <ray-radio value="all">Every build</ray-radio>
          <ray-radio value="failures">Failures only</ray-radio>
          <ray-radio value="none">Nothing</ray-radio>
        </ray-radio-group>
        <div class="demo-settings-toggles">
          <ray-checkbox label="New member joined" checked></ray-checkbox>
          <ray-checkbox label="Release published" checked></ray-checkbox>
          <ray-checkbox label="Weekly usage report"></ray-checkbox>
        </div>
      </div>
    </ray-tab-panel>

    <ray-tab-panel value="danger">
      <div class="demo-settings-section">
        <ray-alert color="red" label="Careful">These actions affect everyone in the project and cannot be undone.</ray-alert>
        <div class="demo-settings-danger">
          <div><strong>Transfer ownership</strong><span>Move ray-remote to another team.</span></div>
          <ray-button variant="default">Transfer…</ray-button>
        </div>
        <div class="demo-settings-danger">
          <div><strong>Delete project</strong><span>Removes builds, releases and the update channel.</span></div>
          <ray-button variant="light" color="red" id="dlg-settings-delete">Delete…</ray-button>
        </div>
      </div>
    </ray-tab-panel>
  </ray-tabs>
  <span slot="footer" class="demo-settings-saved">Last saved 2 minutes ago</span>
  <ray-button slot="footer" variant="default" data-dialog-close="cancel">Cancel</ray-button>
  <ray-button slot="footer" data-dialog-close="save">Save changes</ray-button>
</ray-dialog>

<div class="demo-caption">Patterns</div>
<div class="demo-launchers">
  <article class="demo-launcher" style="--c: var(--ray-blue-light-color); --bg: var(--ray-blue-light)">
    <span class="demo-launcher-icon"><ray-icon name="file"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Rename</strong><span>One field, focused on open; the button's value is the returnValue.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-rename">Open</ray-button><span data-out="dlg-rename"></span></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-red-light-color); --bg: var(--ray-red-light)">
    <span class="demo-launcher-icon"><ray-icon name="alert-triangle"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Confirm</strong><span><code>confirmDialog()</code> builds one and resolves to true or false.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" id="dlg-confirm-open">Delete…</ray-button><span data-out="dlg-confirm"></span></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-violet-light-color); --bg: var(--ray-violet-light)">
    <span class="demo-launcher-icon"><ray-icon name="plus"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Create project</strong><span>A larger form (size lg) with a header badge; read its fields on ray-close.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-create">Open</ray-button><span data-out="dlg-create"></span></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-orange-light-color); --bg: var(--ray-orange-light)">
    <span class="demo-launcher-icon"><ray-icon name="download"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Unsaved changes</strong><span>Persistent: no ×, Escape or backdrop; one of three answers.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-unsaved">Open</ray-button><span data-out="dlg-unsaved"></span></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-teal-light-color); --bg: var(--ray-teal-light)">
    <span class="demo-launcher-icon"><ray-icon name="paperclip"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Guarded draft</strong><span>ray-request-close is cancelable: closing a written note asks first.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-note">Open</ray-button><span data-out="dlg-note"></span></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-gray-light-color); --bg: var(--ray-gray-light)">
    <span class="demo-launcher-icon"><ray-icon name="settings"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Keyboard shortcuts</strong><span>Long content near the top (position top): the body scrolls, header and footer stay.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-keys">Open</ray-button></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-green-light-color); --bg: var(--ray-green-light)">
    <span class="demo-launcher-icon"><ray-icon name="terminal"></ray-icon></span>
    <div class="demo-launcher-text"><strong>Build log</strong><span>size="full" for a workspace: almost the whole window.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-log">Open</ray-button></div>
  </article>
  <article class="demo-launcher" style="--c: var(--ray-pink-light-color); --bg: var(--ray-pink-light)">
    <span class="demo-launcher-icon"><ray-icon name="star"></ray-icon></span>
    <div class="demo-launcher-text"><strong>What's new</strong><span>Small and announcement-like (size sm), with a hero and a single action.</span></div>
    <div class="demo-launcher-foot"><ray-button size="sm" variant="default" data-open="dlg-news">Open</ray-button></div>
  </article>
</div>

<ray-dialog id="dlg-rename" label="Rename file" size="sm">
  <ray-input label="New name" value="main.ray" description="Letters, digits, dots and dashes." autofocus></ray-input>
  <div slot="footer" style="display: contents">
    <ray-button variant="default" data-dialog-close="cancel">Cancel</ray-button>
    <ray-button data-dialog-close="rename">Rename</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-create" label="Create project" size="lg">
  <ray-badge slot="header" variant="light" color="violet" normal-case>raylang 1.27</ray-badge>
  <div class="demo-dialog-form">
    <ray-input name="name" label="Name" value="ray-remote" required autofocus></ray-input>
    <ray-select name="template" label="Template" value="desktop">
      <option value="desktop">Desktop app (std/ui)</option>
      <option value="web">Web server (web)</option>
      <option value="cli">Command line</option>
    </ray-select>
    <div class="demo-field">Frontend
      <ray-segmented-control name="frontend" value="html" aria-label="Frontend"><option value="html">Plain HTML</option><option value="react">React</option><option value="vue">Vue</option></ray-segmented-control>
    </div>
    <ray-switch name="git" label="Initialize a git repository" checked></ray-switch>
  </div>
  <div slot="footer" style="display: contents">
    <ray-button variant="default" data-dialog-close="cancel">Cancel</ray-button>
    <ray-button data-dialog-close="create"><ray-icon slot="left" name="plus"></ray-icon>Create</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-unsaved" label="Save changes to main.ray?" size="sm" persistent hide-close>
  <p class="demo-dialog-text">Your changes will be lost if you close without saving.</p>
  <div slot="footer" style="display: contents">
    <ray-button variant="subtle" color="red" data-dialog-close="discard" style="margin-inline-end: auto">Don't save</ray-button>
    <ray-button variant="default" data-dialog-close="cancel">Cancel</ray-button>
    <ray-button data-dialog-close="save" autofocus>Save</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-note" label="New note">
  <ray-textarea id="dlg-note-text" label="Note" placeholder="Write something, then try Escape, the × or the backdrop." rows="4" autofocus></ray-textarea>
  <div slot="footer" style="display: contents">
    <ray-button variant="default" id="dlg-note-cancel">Cancel</ray-button>
    <ray-button data-dialog-close="saved">Save note</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-keys" label="Keyboard shortcuts" position="top">
  <ray-search slot="header" size="xs" aria-label="Filter shortcuts" placeholder="Filter" id="dlg-keys-filter" style="width: 9rem"></ray-search>
  <table class="demo-keys" id="dlg-keys-table">
    <tbody>
      <tr><th colspan="2">General</th></tr>
      <tr><td>Command palette</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>K</ray-kbd></span></td></tr>
      <tr><td>Settings</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>,</ray-kbd></span></td></tr>
      <tr><td>Toggle sidebar</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>B</ray-kbd></span></td></tr>
      <tr><td>Toggle theme</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>⇧</ray-kbd><ray-kbd>L</ray-kbd></span></td></tr>
      <tr><th colspan="2">Editor</th></tr>
      <tr><td>Save</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>S</ray-kbd></span></td></tr>
      <tr><td>Find</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>F</ray-kbd></span></td></tr>
      <tr><td>Go to line</td><td><span><ray-kbd>⌃</ray-kbd><ray-kbd>G</ray-kbd></span></td></tr>
      <tr><td>Format document</td><td><span><ray-kbd>⌥</ray-kbd><ray-kbd>⇧</ray-kbd><ray-kbd>F</ray-kbd></span></td></tr>
      <tr><td>Comment line</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>/</ray-kbd></span></td></tr>
      <tr><th colspan="2">Run</th></tr>
      <tr><td>Run program</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>R</ray-kbd></span></td></tr>
      <tr><td>Run tests</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>⇧</ray-kbd><ray-kbd>T</ray-kbd></span></td></tr>
      <tr><td>Build native</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>⇧</ray-kbd><ray-kbd>B</ray-kbd></span></td></tr>
      <tr><td>Stop</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>.</ray-kbd></span></td></tr>
      <tr><th colspan="2">Navigation</th></tr>
      <tr><td>Next tab</td><td><span><ray-kbd>⌃</ray-kbd><ray-kbd>Tab</ray-kbd></span></td></tr>
      <tr><td>Previous tab</td><td><span><ray-kbd>⌃</ray-kbd><ray-kbd>⇧</ray-kbd><ray-kbd>Tab</ray-kbd></span></td></tr>
      <tr><td>Go to file</td><td><span><ray-kbd>⌘</ray-kbd><ray-kbd>P</ray-kbd></span></td></tr>
      <tr><td>Go back</td><td><span><ray-kbd>⌃</ray-kbd><ray-kbd>-</ray-kbd></span></td></tr>
    </tbody>
  </table>
  <div slot="footer" style="display: contents">
    <ray-button variant="default" data-dialog-close="done">Done</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-log" label="Build log · ray-remote 0.4.1" size="full">
  <ray-badge slot="header" variant="dot" color="green" normal-case>Passed</ray-badge>
  <pre class="demo-dialog-log"><span class="p">$</span> ray build --native --release src/main.ray
<span class="d">  compiling</span> std/ui, std/json, net 0.5.0, web 0.4.6
<span class="d">  checking </span> 42 modules · 0 warnings
<span class="d">  linking  </span> target/release/ray-remote (4.2 MB)
<span class="p">$</span> ray test
<span class="ok">  ok</span>   session: resumes after reconnect (12 ms)
<span class="ok">  ok</span>   files: upload with progress (31 ms)
<span class="ok">  ok</span>   files: rejects paths outside the root (2 ms)
<span class="ok">  ok</span>   ui: palette lists the menu commands (48 ms)
<span class="ok">  ok</span>   ui: theme follows the system (7 ms)
<span class="d">  result: </span>5 test(s), all passed ✓
<span class="p">$</span> ray bundle --name "Ray Remote" -o dist
<span class="d">  bundle   </span> dist/Ray Remote.app (ad-hoc signed)
<span class="ok">  done</span> in 18.4 s</pre>
  <div slot="footer" style="display: contents">
    <ray-button variant="default" data-dialog-close="close">Close</ray-button>
    <ray-button variant="light" data-dialog-close="reveal"><ray-icon slot="left" name="folder"></ray-icon>Show in folder</ray-button>
  </div>
</ray-dialog>

<ray-dialog id="dlg-news" label="What's new in ray·elements 0.4" size="sm">
  <div class="demo-dialog-hero"><ray-icon name="star" size="2rem"></ray-icon></div>
  <ul class="demo-dialog-list">
    <li><ray-badge variant="light" color="green">New</ray-badge> ray-toggle and ray-toggle-group</li>
    <li><ray-badge variant="light" color="green">New</ray-badge> ray-file-upload with drag and drop</li>
    <li><ray-badge variant="light" color="blue">Changed</ray-badge> every value change is a <code>change</code> event</li>
    <li><ray-badge variant="light" color="gray">Docs</ray-badge> React and Vue code for every example</li>
  </ul>
  <div slot="footer" style="display: contents">
    <ray-button full-width data-dialog-close="ok">Got it</ray-button>
  </div>
</ray-dialog>

<script type="module">
  import { confirmDialog } from "@raylang/elements/dialog";
  const out = (id, text) => { document.querySelector(`[data-out="${id}"]`).textContent = text; };

  // Project settings: members, the stacked confirmation, how it closed.
  const members = document.getElementById("dlg-settings-members");
  members.columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", sortable: true, render: (r) => {
      const b = document.createElement("ray-badge");
      b.variant = "light";
      b.color = r.role === "Admin" ? "violet" : r.role === "Developer" ? "blue" : "gray";
      b.textContent = r.role;
      return b;
    } },
  ];
  members.data = [
    { id: 1, name: "Ada Lovelace", email: "ada@ray.dev", role: "Admin" },
    { id: 2, name: "Grace Hopper", email: "grace@ray.dev", role: "Developer" },
    { id: 3, name: "Alan Turing", email: "alan@ray.dev", role: "Developer" },
    { id: 4, name: "Katherine Johnson", email: "katherine@ray.dev", role: "Viewer" },
    { id: 5, name: "Edsger Dijkstra", email: "edsger@ray.dev", role: "Viewer" },
  ];
  document.getElementById("dlg-settings-delete").addEventListener("click", async () => {
    const ok = await confirmDialog({ label: "Delete ray-remote?", message: "The project, its builds and its releases are removed for everyone.", confirmLabel: "Delete project", color: "red" });
    if (ok) document.getElementById("dlg-settings").close("deleted");
  });
  document.getElementById("dlg-settings").addEventListener("ray-close", (e) => out("dlg-settings", `returnValue: "${e.detail.returnValue}"`));
  // On a narrow window the side tabs go on top.
  const settingsTabs = document.querySelector("#dlg-settings ray-tabs");
  const narrow = matchMedia("(max-width: 40em)");
  const placeTabs = () => { settingsTabs.orientation = narrow.matches ? "horizontal" : "vertical"; };
  narrow.addEventListener("change", placeTabs);
  placeTabs();

  // Every launcher opens its dialog; most report how it closed.
  for (const button of document.querySelectorAll("[data-open]")) {
    button.addEventListener("click", () => document.getElementById(button.dataset.open).show());
  }
  for (const id of ["dlg-rename", "dlg-unsaved"]) {
    document.getElementById(id).addEventListener("ray-close", (e) => out(id, `returnValue: "${e.detail.returnValue}"`));
  }

  // Rename: show the new name when it was renamed.
  document.getElementById("dlg-rename").addEventListener("ray-close", (e) => {
    if (e.detail.returnValue === "rename") out("dlg-rename", `Renamed to ${e.currentTarget.querySelector("ray-input").value}`);
  });

  // Create: read the fields once it closes with "create".
  const create = document.getElementById("dlg-create");
  create.addEventListener("ray-close", (e) => {
    if (e.detail.returnValue !== "create") return out("dlg-create", "Cancelled");
    const field = (name) => create.querySelector(`[name="${name}"]`);
    out("dlg-create", `${field("name").value} · ${field("template").value} · ${field("frontend").value}${field("git").checked ? " · git" : ""}`);
  });

  // Confirm: a dialog built by code.
  document.getElementById("dlg-confirm-open").addEventListener("click", async () => {
    const ok = await confirmDialog({ label: "Delete project?", message: "This removes ray-remote and its history. It cannot be undone.", confirmLabel: "Delete", color: "red" });
    out("dlg-confirm", ok ? "Deleted" : "Kept");
  });

  // Guarded draft: Escape, × and backdrop ask before dropping a written note.
  const note = document.getElementById("dlg-note");
  const text = document.getElementById("dlg-note-text");
  async function leave() {
    if (!text.value.trim() || await confirmDialog({ label: "Discard the note?", message: "What you wrote will be lost.", confirmLabel: "Discard", color: "red" })) {
      text.value = "";
      note.close("discarded");
    }
  }
  note.addEventListener("ray-request-close", (e) => { e.preventDefault(); leave(); });
  document.getElementById("dlg-note-cancel").addEventListener("click", leave);
  note.addEventListener("ray-close", (e) => {
    out("dlg-note", e.detail.returnValue === "saved" ? `Saved: "${text.value.trim() || "(empty)"}"` : "Discarded");
    if (e.detail.returnValue === "saved") text.value = "";
  });

  // Shortcuts: the header's search filters the rows.
  document.getElementById("dlg-keys-filter").addEventListener("input", (e) => {
    const q = e.currentTarget.value.trim().toLowerCase();
    for (const row of document.querySelectorAll("#dlg-keys-table tr")) {
      if (row.querySelector("th")) continue;
      row.hidden = q !== "" && !row.textContent.toLowerCase().includes(q);
    }
  });
</script>
```
