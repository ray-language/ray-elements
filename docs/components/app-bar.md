# App bar

The top bar of a phone screen (Material's top app bar, the iOS navigation bar): back or menu, a title and subtitle, actions, and an optional row under it. It elevates once the content scrolls, or hides while scrolling down.

Import: `import "@raylang/elements/app-bar";` · Category: Layout

## `<ray-app-bar>` (RayAppBar, extends RayElement)

It follows the scroller of its ray-app-shell, else scroll-target, else the window; clear of the notch (safe-area inset). The title is plain text: put a heading in the default slot when the page needs one.

Properties:

- `label`: string. The title.
- `description`: string. A line under the title.
- `center`: boolean, reflects. The title centered (iOS).
- `variant`: `default` | `filled` | `transparent`, default `default`, reflects. default: the page background; filled: the primary color; transparent: until it elevates.
- `size`: `sm` | `md` | `lg`, default `md`, reflects. Height: 48, 56 or 64 px.
- `scrollBehavior` (attribute `scroll-behavior`): `elevate` | `hide` | `none`, default `elevate`, reflects. While the content scrolls: elevate (border and shadow), hide (also slides away going down, back going up), none.
- `sticky`: boolean, reflects. Sticks to the top of the window (outside a shell).
- `scrollTarget` (attribute `scroll-target`): string. A selector of the element whose scrolling it follows (default: its shell's, else the window).

Slots:

- (default): Title content after the label (a heading, a select).
- `start`: Before the title: back or menu button.
- `end`: Actions.
- `bottom`: A row under the bar: tabs, a search field.

Parts (`::part()`):

- `bar`: The bar.
- `start`: The start area.
- `title`: The title area.
- `end`: The actions area.
- `bottom`: The row under the bar.

Methods and properties:

- `readonly concealed: boolean`: Whether scroll-behavior="hide" has slid it away.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.10.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Patterns (scroll inside each phone)</div>
<div class="demo-phones">
  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-app-bar slot="header" label="Build #482" description="ray-remote · main">
          <ray-icon-button slot="start" variant="subtle" label="Back"><ray-icon name="arrow-left"></ray-icon></ray-icon-button>
          <ray-icon-button slot="end" variant="subtle" label="Share"><ray-icon name="arrow-up-right"></ray-icon></ray-icon-button>
          <ray-icon-button slot="end" variant="subtle" label="More"><ray-icon name="more-horizontal"></ray-icon></ray-icon-button>
        </ray-app-bar>
        <ul class="demo-feed" data-feed="log"></ul>
      </ray-app-shell>
    </div>
    <figcaption>Back, title and subtitle, actions; elevates once it scrolls</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-app-bar slot="header" label="Settings" center scroll-behavior="hide">
          <ray-button slot="start" variant="subtle" size="xs">Cancel</ray-button>
          <ray-button slot="end" variant="subtle" size="xs">Done</ray-button>
        </ray-app-bar>
        <ul class="demo-feed" data-feed="settings"></ul>
      </ray-app-shell>
    </div>
    <figcaption>center (iOS) and scroll-behavior="hide": away going down, back going up</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-app-bar slot="header" label="Inbox" description="3 unread" variant="filled">
          <ray-icon-button slot="start" variant="subtle" color="white" label="Menu"><ray-icon name="menu"></ray-icon></ray-icon-button>
          <ray-avatar slot="end" name="Ada Lovelace" variant="filled" color="pink" size="sm"></ray-avatar>
          <ray-search slot="bottom" aria-label="Search mail" placeholder="Search mail" size="xs" radius="full"></ray-search>
        </ray-app-bar>
        <ul class="demo-feed" data-feed="mail"></ul>
      </ray-app-shell>
    </div>
    <figcaption>variant="filled" with a search row (the bottom slot)</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-app-bar slot="header" label="Explore" size="lg">
          <ray-icon-button slot="end" variant="subtle" label="Search"><ray-icon name="search"></ray-icon></ray-icon-button>
          <ray-segmented-control slot="bottom" full-width size="xs" aria-label="Section" value="all"><option value="all">All</option><option value="apps">Apps</option><option value="templates">Templates</option></ray-segmented-control>
        </ray-app-bar>
        <ul class="demo-feed" data-feed="cards"></ul>
      </ray-app-shell>
    </div>
    <figcaption>size="lg" with a segmented control under it</figcaption>
  </figure>
</div>

<script type="module">
  // Something to scroll in each phone.
  const rows = {
    log: (i) => [`${String(12 + Math.floor(i / 6)).padStart(2, "0")}:0${i % 6}:${String((i * 7) % 60).padStart(2, "0")}`, ["compiling module", "linking", "running tests", "bundling", "signing", "uploading"][i % 6]],
    settings: (i) => [["Wi-Fi", "Bluetooth", "Notifications", "Sounds", "Focus", "Screen time", "General", "Display", "Wallpaper", "Privacy"][i % 10], "›"],
    mail: (i) => [["Grace Hopper", "Alan Turing", "Ray CI", "Katherine Johnson"][i % 4], ["Review #482", "Docs are faster", "Build passed", "Numbers check out"][i % 4]],
    cards: (i) => [["Dashboard", "Chat", "Store", "Blog", "Docs", "Status page"][i % 6], ["Template", "App"][i % 2]],
  };
  for (const ul of document.querySelectorAll("[data-feed]")) {
    const make = rows[ul.dataset.feed];
    for (let i = 0; i < 18; i++) {
      const [a, b] = make(i);
      const li = document.createElement("li");
      li.innerHTML = "<b></b><small></small>";
      li.querySelector("b").textContent = a;
      li.querySelector("small").textContent = b;
      ul.append(li);
    }
  }
</script>
```
