# Scroll area

A box that scrolls its content with the native scrolling and a thin themed scrollbar (Mantine's ScrollArea). Edge shadows tell there is more; ray-reach-end fires at the end (load the next page).

Import: `import "@raylang/elements/scroll-area";` · Category: Layout

## `<ray-scroll-area>` (RayScrollArea, extends RayElement)

Give it a size: height, max-height, CSS, or a flex/grid parent. The scrolling box is focusable (keyboard scrolling); name it with label when it holds a region of its own.

Properties:

- `height`: string. Height (CSS length).
- `maxHeight` (attribute `max-height`): string. Maximum height: it grows with its content up to this, then scrolls.
- `orientation`: `vertical` | `horizontal` | `both`, default `vertical`, reflects. Which ways it scrolls.
- `type`: `auto` | `hover` | `never`, default `auto`, reflects. The scrollbar: auto (when it scrolls), hover (while hovered or scrolling), never (still scrolls).
- `noShadows` (attribute `no-shadows`): boolean, reflects. No edge shadows.
- `threshold`: number, default `48`. Distance from the end (px) at which ray-reach-end fires.
- `label`: string. Accessible name: makes the scrolling box a named region.

Events:

- `ray-reach-end` (detail `{ edge: "bottom" | "right" }`): The end came within threshold (once per arrival).

Slots:

- (default): The content.

Parts (`::part()`):

- `viewport`: The scrolling box.
- `shadow`: The edge shadows.

Methods and properties:

- `readonly viewport: HTMLElement`: The scrolling element (scrollTop, scrollTo…).
- `scrollToStart(options?: { behavior?: ScrollBehavior }): void`: Scrolls to the top (left).
- `scrollToEnd(options?: { behavior?: ScrollBehavior }): void`: Scrolls to the bottom (right when horizontal).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">An endless list: ray-reach-end loads the next page</div>
<div class="demo-split">
  <ray-card with-border radius="lg" padding="0" class="demo-scroll-card">
    <ray-group slot="header" justify="space-between" class="demo-scroll-head"><strong>Notifications</strong><span class="demo-muted" id="demo-sa-count">12 loaded</span></ray-group>
    <ray-scroll-area id="demo-sa-feed" height="18rem" label="Notifications">
      <ul class="demo-sa-list" id="demo-sa-list"></ul>
      <ray-center class="demo-sa-more" id="demo-sa-more"><ray-spinner size="sm"></ray-spinner></ray-center>
    </ray-scroll-area>
  </ray-card>
  <ray-stack gap="sm">
    <span class="demo-muted">The shadows show which way there is more. Scroll to the end: ray-reach-end fires once, the next 12 load, and it fires again at the new end.</span>
    <ray-group gap="xs">
      <ray-button size="xs" variant="default" id="demo-sa-top"><ray-icon slot="left" name="chevron-up"></ray-icon>scrollToStart()</ray-button>
      <ray-button size="xs" variant="default" id="demo-sa-end"><ray-icon slot="left" name="chevron-down"></ray-icon>scrollToEnd()</ray-button>
    </ray-group>
  </ray-stack>
</div>

<div class="demo-caption">Horizontal, scrollbar on hover</div>
<ray-scroll-area orientation="horizontal" type="hover" label="Templates">
  <ray-group nowrap gap="sm" class="demo-sa-row">
    <div class="demo-sa-tile" style="--a: var(--ray-violet-light); --b: var(--ray-blue-light)"><strong>Dashboard</strong><span>Sidebar, tables, charts</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-teal-light); --b: var(--ray-green-light)"><strong>Chat</strong><span>Threads and presence</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-orange-light); --b: var(--ray-yellow-light)"><strong>Store</strong><span>Catalog, cart, checkout</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-pink-light); --b: var(--ray-violet-light)"><strong>Blog</strong><span>Posts, tags, RSS</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-blue-light); --b: var(--ray-teal-light)"><strong>Docs</strong><span>Search and a sidebar</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-green-light); --b: var(--ray-teal-light)"><strong>Mobile app</strong><span>App shell and bottom nav</span></div>
    <div class="demo-sa-tile" style="--a: var(--ray-red-light); --b: var(--ray-orange-light)"><strong>Status page</strong><span>Uptime and incidents</span></div>
  </ray-group>
</ray-scroll-area>

<div class="demo-caption">max-height: grows, then scrolls</div>
<div class="demo-split">
  <ray-scroll-area max-height="12rem" class="demo-sa-grow">
    <ul class="demo-sa-list" id="demo-sa-grow"><li><b>release-notes.md</b><small>12 KB</small></li><li><b>screenshot-dark.png</b><small>1.8 MB</small></li></ul>
  </ray-scroll-area>
  <ray-group gap="xs" align="start"><ray-button size="xs" id="demo-sa-add"><ray-icon slot="left" name="plus"></ray-icon>Add a file</ray-button><ray-button size="xs" variant="subtle" id="demo-sa-clear">Clear</ray-button></ray-group>
</div>

<script type="module">
  // Endless list: 12 at a time, on ray-reach-end.
  const kinds = [
    ["circle-check", "teal", "Build #%n passed", "ray-remote · main"],
    ["user", "violet", "Ada joined the workspace", "invited by Grace"],
    ["alert-triangle", "orange", "Build #%n is slow", "8.2 s, usually 4 s"],
    ["message-circle", "blue", "Alan replied to you", "“Looks great!”"],
  ];
  const list = document.getElementById("demo-sa-list");
  const feed = document.getElementById("demo-sa-feed");
  let n = 0;
  const more = () => {
    for (let i = 0; i < 12; i++) {
      const [icon, color, title, sub] = kinds[n % kinds.length];
      const li = document.createElement("li");
      li.innerHTML = `<span class="ic" style="--c: var(--ray-${color}-light-color); --b: var(--ray-${color}-light)"><ray-icon name="${icon}"></ray-icon></span><span><b></b><small></small></span><small class="ago"></small>`;
      li.querySelector("b").textContent = title.replace("%n", String(500 - n));
      li.querySelector("span small").textContent = sub;
      li.querySelector(".ago").textContent = `${n + 1} min`;
      list.append(li);
      n++;
    }
    document.getElementById("demo-sa-count").textContent = `${n} loaded`;
  };
  more();
  let loading = false;
  feed.addEventListener("ray-reach-end", () => {
    if (loading || n >= 60) return;
    loading = true;
    setTimeout(() => { more(); loading = false; if (n >= 60) document.getElementById("demo-sa-more").textContent = "That's all."; }, 600);
  });
  document.getElementById("demo-sa-top").addEventListener("click", () => feed.scrollToStart());
  document.getElementById("demo-sa-end").addEventListener("click", () => feed.scrollToEnd());

  // Grows up to max-height.
  const grow = document.getElementById("demo-sa-grow");
  let f = 1;
  document.getElementById("demo-sa-add").addEventListener("click", () => {
    const li = document.createElement("li");
    li.innerHTML = `<b>upload-${f++}.zip</b><small>${(f * 1.3).toFixed(1)} MB</small>`;
    grow.append(li);
    grow.closest("ray-scroll-area").scrollToEnd();
  });
  document.getElementById("demo-sa-clear").addEventListener("click", () => { grow.replaceChildren(); f = 1; });
</script>
```
