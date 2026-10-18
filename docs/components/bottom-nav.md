# Bottom nav

The bottom navigation of a phone app (Material's navigation bar, the iOS tab bar): three to five destinations with an icon, a label and a badge, the current one marked by a pill. Links or a value; an action button in the middle; hides on scroll.

Import: `import "@raylang/elements/bottom-nav";` · Category: Navigation

## `<ray-bottom-nav>` (RayBottomNav, extends RayElement)

With href items it marks the link to this page (aria-current="page"); without, it is a control (value, change). Clear of the home indicator (safe-area inset). In a ray-app-shell, put it in the bottom slot.

Properties:

- `value`: string, reflects. The current destination (an item's value, else its href, else its label).
- `label`: string, default `Main`. Accessible name of the navigation.
- `labels`: `always` | `active` | `never`, default `always`, reflects. Which labels show (the others stay for assistive technology).
- `indicator`: `pill` | `line` | `none`, default `pill`, reflects. How the current destination is marked besides its color.
- `color`: string, reflects. A palette color or any CSS color for the current item and the action (default: primary).
- `variant`: `default` | `floating`, default `default`, reflects. default: a bar across the bottom; floating: a rounded bar off the edges.
- `hideOnScroll` (attribute `hide-on-scroll`): boolean, reflects. Slides away while the content scrolls down, back on the way up.
- `fixed`: boolean, reflects. Pinned to the bottom of the window (outside a shell).
- `scrollTarget` (attribute `scroll-target`): string. A selector of the element whose scrolling it follows (default: its shell's, else the window).

Events:

- `change`: The user picked another destination (read value).
- `ray-select` (detail `{ value: string }`): An action item was pressed.

Slots:

- (default): ray-bottom-nav-item elements (3 to 5).

Parts (`::part()`):

- `nav`: The <nav>.

Methods and properties:

- `readonly items: RayBottomNavItem[]`: The items, in order.

Vue `v-model`: `value` (updated on change).

## `<ray-bottom-nav-item>` (RayBottomNavItem, extends RayElement)

A link with href, else a button. The badge is read with the label ("Messages, 3").

Properties:

- `value`: string, reflects. Its value (default: its href, else its label).
- `label`: string. The label.
- `icon`: string. An icon of the registry (or put one in the icon slot).
- `href`: string, reflects. Makes it a link.
- `badge`: string. A count or a short text on the icon.
- `dot`: boolean, reflects. A dot on the icon (something new).
- `active`: boolean, reflects. Set by the bar: the current destination.
- `disabled`: boolean, reflects. Not interactive.
- `action`: boolean, reflects. A raised round button ("New"): it fires ray-select on the bar, it is not a destination.

Slots:

- `icon`: A custom icon (a ray-icon, an svg, an avatar).

Parts (`::part()`):

- `item`: The link or button.
- `indicator`: The pill behind the icon.
- `badge`: The badge.
- `label`: The label.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.6.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Patterns (tap the destinations; scroll the last one)</div>
<div class="demo-phones">
  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-center class="demo-phone-screen"><ray-stack align="center" gap="2"><span class="demo-phone-big" data-bn-out="demo-bn-1">Home</span><span class="demo-muted">value · change</span></ray-stack></ray-center>
        <ray-bottom-nav slot="bottom" id="demo-bn-1" value="home">
          <ray-bottom-nav-item value="home" label="Home" icon="home"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="search" label="Search" icon="search"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="messages" label="Messages" icon="message-circle" badge="3"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="profile" label="Profile" icon="user" dot></ray-bottom-nav-item>
        </ray-bottom-nav>
      </ray-app-shell>
    </div>
    <figcaption>The pill, a count and a dot</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-center class="demo-phone-screen"><ray-stack align="center" gap="2"><span class="demo-phone-big" data-bn-out="demo-bn-2">Today</span><span class="demo-muted">labels="active" · indicator="line"</span></ray-stack></ray-center>
        <ray-bottom-nav slot="bottom" id="demo-bn-2" value="today" labels="active" indicator="line" color="teal">
          <ray-bottom-nav-item value="today" label="Today" icon="calendar"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="files" label="Files" icon="folder"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="photos" label="Photos" icon="image"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="saved" label="Saved" icon="star" badge="12"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="settings" label="Settings" icon="settings"></ray-bottom-nav-item>
        </ray-bottom-nav>
      </ray-app-shell>
    </div>
    <figcaption>Five destinations, only the current label, a teal line</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-center class="demo-phone-screen"><ray-stack align="center" gap="2"><span class="demo-phone-big" data-bn-out="demo-bn-3">Feed</span><span class="demo-muted" id="demo-bn-3-act">The + fires ray-select</span></ray-stack></ray-center>
        <ray-bottom-nav slot="bottom" id="demo-bn-3" value="feed" variant="floating" color="violet">
          <ray-bottom-nav-item value="feed" label="Feed" icon="home"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="explore" label="Explore" icon="search"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="post" label="Post" icon="plus" action></ray-bottom-nav-item>
          <ray-bottom-nav-item value="inbox" label="Inbox" icon="bell" badge="9+"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="me" label="Me"><ray-avatar slot="icon" name="Ada Lovelace" color="pink" size="xs"></ray-avatar></ray-bottom-nav-item>
        </ray-bottom-nav>
      </ray-app-shell>
    </div>
    <figcaption>variant="floating", an action in the middle, an avatar as icon</figcaption>
  </figure>

  <figure class="demo-phone-fig">
    <div class="demo-phone">
      <ray-app-shell style="height: 100%">
        <ray-app-bar slot="header" label="Library" scroll-behavior="hide"></ray-app-bar>
        <ul class="demo-feed" id="demo-bn-feed"></ul>
        <ray-bottom-nav slot="bottom" value="library" hide-on-scroll labels="active">
          <ray-bottom-nav-item value="library" label="Library" icon="folder"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="search" label="Search" icon="search"></ray-bottom-nav-item>
          <ray-bottom-nav-item value="downloads" label="Downloads" icon="download"></ray-bottom-nav-item>
        </ray-bottom-nav>
      </ray-app-shell>
    </div>
    <figcaption>hide-on-scroll (with an app bar that hides too)</figcaption>
  </figure>
</div>

<script type="module">
  // Each bar shows its value on its screen.
  for (const id of ["demo-bn-1", "demo-bn-2", "demo-bn-3"]) {
    const nav = document.getElementById(id);
    nav.addEventListener("change", () => {
      const item = nav.items.find((i) => i.value === nav.value);
      document.querySelector(`[data-bn-out="${id}"]`).textContent = item?.label ?? nav.value;
    });
  }
  document.getElementById("demo-bn-3").addEventListener("ray-select", (e) => {
    document.getElementById("demo-bn-3-act").textContent = `ray-select: ${e.detail.value}`;
  });

  const feed = document.getElementById("demo-bn-feed");
  for (let i = 0; i < 20; i++) {
    const li = document.createElement("li");
    li.innerHTML = `<b>${["Design system.pdf", "Release notes.md", "Roadmap.key", "Screenshots", "Invoices", "Contracts"][i % 6]}</b><small>${(i * 1.7 + 0.4).toFixed(1)} MB</small>`;
    feed.append(li);
  }
</script>
```
