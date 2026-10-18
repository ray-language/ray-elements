// page: tests/pages/layout.html
//
// Layout: ray-stack, ray-group, ray-grid, ray-container, ray-center,
// ray-scroll-area, ray-app-shell, ray-app-bar, ray-bottom-nav.

const T = window.__rayTest;
const tags = ["ray-stack", "ray-group", "ray-grid", "ray-container", "ray-center", "ray-scroll-area", "ray-app-shell", "ray-app-bar", "ray-bottom-nav", "ray-bottom-nav-item"];
await Promise.all(tags.map((t) => customElements.whenDefined(t)));
const { spaceValue } = await import("../../src/core/styles.js");
const { parseCols } = await import("../../src/components/grid/grid.js");

async function mount(html, width = "800px") {
  const box = document.createElement("div");
  box.style.width = width;
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const rect = (el) => el.getBoundingClientRect();
// A scroll the page would report (hidden windows dispatch none), then the
// frame the bars react in (none in a hidden window: they react at once).
const frame = () => (document.visibilityState === "hidden" ? T.settle() : new Promise((r) => requestAnimationFrame(() => r())));
const scrollTo = async (el, top) => { el.scrollTop = top; el.dispatchEvent(new Event("scroll")); await frame(); await T.settle(); };

T.test("spaceValue: named steps, px numbers, CSS lengths", async (T) => {
  T.eq(spaceValue("md"), "var(--ray-space-md)");
  T.eq(spaceValue("4"), "4px");
  T.eq(spaceValue(0), "0px");
  T.eq(spaceValue("1.5rem"), "1.5rem");
  T.eq(spaceValue(""), null);
});

T.test("stack: a column with the gap of the scale, align and justify", async (T) => {
  const box = await mount(`<ray-stack gap="lg" align="center" style="height: 200px" justify="space-between"><span style="display:block;width:40px;height:10px"></span><span style="display:block;width:20px;height:10px"></span></ray-stack>`);
  const [a, b] = box.firstElementChild.children;
  const host = rect(box.firstElementChild);
  T.eq(Math.round(rect(a).left - host.left), 380, "centered: (800 - 40) / 2");
  T.eq(Math.round(rect(b).bottom), Math.round(host.bottom), "space-between: the last at the bottom");
  box.firstElementChild.justify = "start";
  await T.settle();
  T.eq(Math.round(rect(b).top - rect(a).bottom), 20, "gap lg = 1.25rem");
  box.remove();
});

T.test("group: a wrapping row; grow shares the width; nowrap", async (T) => {
  const box = await mount(`<ray-group gap="10"><span style="display:block;width:300px">a</span><span style="display:block;width:300px">b</span><span style="display:block;width:300px">c</span></ray-group>`);
  const g = box.firstElementChild;
  const [a, b, c] = g.children;
  T.eq(Math.round(rect(b).left - rect(a).right), 10, "gap 10px");
  T.ok(rect(c).top > rect(a).top, "wraps when they do not fit");
  g.nowrap = true;
  await T.settle();
  T.eq(Math.round(rect(c).top), Math.round(rect(a).top), "nowrap: one line");
  g.nowrap = false;
  g.innerHTML = `<span>x</span><span>y</span>`;
  g.grow = true;
  await T.settle();
  T.eq(Math.round(rect(g.children[0]).width), 395, "grow: (800 - 10) / 2");
  box.remove();
});

T.test("grid: cols by its own width, spans, min-col-width", async (T) => {
  T.eq(JSON.stringify(parseCols("1 sm:2 lg:4")), JSON.stringify({ base: 1, sm: 2, lg: 4 }));
  T.eq(JSON.stringify(parseCols("3 bad 0 xl:x")), JSON.stringify({ base: 3 }));
  const cols = (g) => getComputedStyle(g.shadowRoot.querySelector(".grid")).gridTemplateColumns.split(" ").length;
  const cells = "<i></i>".repeat(8);
  const narrow = await mount(`<ray-grid cols="1 sm:2 lg:4">${cells}</ray-grid>`, "500px");
  T.eq(cols(narrow.firstElementChild), 1, "500px: base");
  const mid = await mount(`<ray-grid cols="1 sm:2 lg:4">${cells}</ray-grid>`, "900px");
  T.eq(cols(mid.firstElementChild), 2, "900px: sm (48em) applies, lg (75em) not");
  const wide = await mount(`<ray-grid cols="1 sm:2 lg:4">${cells}</ray-grid>`, "1300px");
  T.eq(cols(wide.firstElementChild), 4, "1300px: lg");
  const span = await mount(`<ray-grid cols="4" gap="0"><i data-span="3" style="display:block;height:5px"></i><i data-span="full" style="display:block;height:5px"></i></ray-grid>`);
  const [three, full] = span.firstElementChild.children;
  T.eq(Math.round(rect(three).width), 600, "data-span=3 of 4");
  T.eq(Math.round(rect(full).width), 800, "data-span=full");
  const auto = await mount(`<ray-grid min-col-width="190" gap="0">${cells}</ray-grid>`);
  T.eq(cols(auto.firstElementChild), 4, "as many 190px columns as fit in 800px");
  for (const b of [narrow, mid, wide, span, auto]) b.remove();
});

T.test("container: max width, centered, padded; fluid", async (T) => {
  const box = await mount(`<ray-container size="xs" padding="20"><p style="margin:0">x</p></ray-container>`, "1000px");
  const c = box.firstElementChild;
  T.eq(Math.round(rect(c).width), 540, "xs = 540px");
  T.eq(Math.round(rect(c).left - rect(box).left), 230, "centered");
  T.eq(Math.round(rect(c.firstElementChild).width), 500, "padded 20px each side");
  c.fluid = true;
  await T.settle();
  T.eq(Math.round(rect(c).width), 1000, "fluid: the whole width");
  box.remove();
});

T.test("center: both axes; inline", async (T) => {
  const box = await mount(`<ray-center style="height: 100px"><span style="display:block;width:20px;height:20px"></span></ray-center>`);
  const s = box.querySelector("span");
  T.eq(Math.round(rect(s).left - rect(box).left), 390);
  T.eq(Math.round(rect(s).top - rect(box).top), 40);
  box.firstElementChild.inline = true;
  await T.settle();
  T.eq(Math.round(rect(box.firstElementChild).width), 20, "inline: as wide as its content");
  box.remove();
});

T.test("scroll-area: edge shadows, ray-reach-end once per arrival, scrollToEnd", async (T) => {
  const box = await mount(`<ray-scroll-area height="100px" label="Feed"><div style="height: 400px"></div></ray-scroll-area>`);
  const sa = box.firstElementChild;
  const shown = () => [...sa.shadowRoot.querySelectorAll(".edge[data-show]")].map((e) => e.classList[1]).join();
  T.eq(shown(), "bottom", "at the top: more below");
  T.eq(sa.viewport.getAttribute("role"), "region");
  T.eq(sa.viewport.getAttribute("aria-label"), "Feed");
  T.eq(sa.viewport.tabIndex, 0, "keyboard-scrollable");
  let reached = 0;
  sa.addEventListener("ray-reach-end", () => reached++);
  await scrollTo(sa.viewport, 150);
  T.eq(shown(), "top,bottom");
  await scrollTo(sa.viewport, 290);
  await scrollTo(sa.viewport, 300);
  T.eq(reached, 1, "fires once at the end");
  T.eq(shown(), "top");
  await scrollTo(sa.viewport, 0);
  await scrollTo(sa.viewport, 300);
  T.eq(reached, 2, "and again at the next arrival");
  sa.scrollToStart({ behavior: "instant" });
  T.eq(sa.viewport.scrollTop, 0);
  box.remove();
});

const shellHtml = `<ray-app-shell style="height: 400px">
  <ray-app-bar slot="header" label="Home" scroll-behavior="hide"></ray-app-bar>
  <nav slot="navbar" style="width: 200px">nav</nav>
  <div style="height: 2000px">content</div>
  <aside slot="aside" style="width: 150px">aside</aside>
  <ray-bottom-nav slot="bottom" hide-on-scroll value="a"><ray-bottom-nav-item value="a" label="A" icon="home"></ray-bottom-nav-item><ray-bottom-nav-item value="b" label="B" icon="search" badge="3"></ray-bottom-nav-item><ray-bottom-nav-item value="n" label="New" icon="plus" action></ray-bottom-nav-item></ray-bottom-nav>
</ray-app-shell>`;

T.test("app-shell: wide and phone layouts by its own width", async (T) => {
  const wide = await mount(shellHtml, "1000px");
  const s = wide.firstElementChild;
  const part = (name) => s.shadowRoot.querySelector(`.${name}`);
  T.eq(s.mobile, false);
  T.eq(Math.round(rect(part("navbar")).width), 200, "navbar beside main");
  T.eq(Math.round(rect(part("main")).width), 650, "1000 - 200 - 150");
  T.eq(getComputedStyle(part("bottom")).display, "none", "no bottom bar on wide screens");
  const phone = await mount(shellHtml, "390px");
  const p = phone.firstElementChild;
  T.eq(p.mobile, true, "390px is below 48em");
  T.eq(Math.round(rect(p.shadowRoot.querySelector(".navbar")).width), 0, "the navbar takes no room");
  T.eq(Math.round(rect(p.shadowRoot.querySelector(".main")).width), 390);
  T.ok(rect(p.querySelector("ray-bottom-nav")).height > 40, "the bottom bar shows");
  T.eq(p.scroller, p.shadowRoot.querySelector(".main"), "scroller: the main area");
  wide.remove();
  phone.remove();
});

T.test("app-bar and bottom-nav: hide while scrolling down, back going up", async (T) => {
  const box = await mount(shellHtml, "390px");
  const shell = box.firstElementChild;
  const bar = shell.querySelector("ray-app-bar");
  const nav = shell.querySelector("ray-bottom-nav");
  await T.settle();
  await scrollTo(shell.scroller, 20);
  T.ok(bar.hasAttribute("data-elevated"), "elevated once scrolled");
  await scrollTo(shell.scroller, 400);
  T.eq(bar.concealed, true, "the bar hides going down");
  T.eq(nav.getAttribute("data-concealed"), "flow", "the bottom nav too");
  await new Promise((r) => setTimeout(r, 450));
  await scrollTo(shell.scroller, 200);
  T.eq(bar.concealed, false, "back going up");
  T.eq(nav.hasAttribute("data-concealed"), false);
  await scrollTo(shell.scroller, 0);
  T.eq(bar.hasAttribute("data-elevated"), false, "flat at the top");
  box.remove();
});

T.test("app-bar: title, subtitle, slots", async (T) => {
  const box = await mount(`<ray-app-bar label="Inbox" description="3 unread"><button slot="start">‹</button><button slot="end">⋯</button></ray-app-bar>`, "390px");
  const bar = box.firstElementChild;
  T.eq(bar.shadowRoot.querySelector(".label").textContent, "Inbox");
  T.eq(bar.shadowRoot.querySelector(".description").textContent, "3 unread");
  T.ok(bar.shadowRoot.querySelector(".start").hasAttribute("data-filled"));
  T.eq(Math.round(rect(bar).height), 57, "56px row and its border");
  box.remove();
});

T.test("bottom-nav: value and change, aria-current, badge in the name, action, links", async (T) => {
  const box = await mount(`<ray-bottom-nav label="Main"><ray-bottom-nav-item value="home" label="Home" icon="home"></ray-bottom-nav-item><ray-bottom-nav-item value="inbox" label="Inbox" icon="bell" badge="3"></ray-bottom-nav-item><ray-bottom-nav-item value="new" label="New" icon="plus" action></ray-bottom-nav-item></ray-bottom-nav>`, "390px");
  const nav = box.firstElementChild;
  const [home, inbox, add] = nav.items;
  const control = (i) => i.shadowRoot.querySelector(".item");
  T.eq(nav.value, "home", "a control starts on its first destination");
  T.eq(control(home).getAttribute("aria-current"), "page");
  T.eq(nav.shadowRoot.querySelector("nav").getAttribute("aria-label"), "Main");
  T.eq(control(inbox).getAttribute("aria-label"), "Inbox, 3", "the badge is read with the label");
  T.ok(control(home).querySelector("svg"), "icon from the registry");
  let changes = 0;
  let selected = "";
  nav.addEventListener("change", () => changes++);
  nav.addEventListener("ray-select", (e) => { selected = e.detail.value; });
  control(inbox).click();
  await T.settle();
  T.eq(nav.value, "inbox");
  T.eq(changes, 1);
  T.eq(inbox.active, true);
  T.eq(control(home).hasAttribute("aria-current"), false);
  const drawn = (i) => i.shadowRoot.querySelector(".icon svg").getAttribute("fill");
  T.eq(drawn(inbox), "currentColor", "the current item draws its icon filled");
  T.eq(drawn(home), "none", "the others, outline");
  control(add).click();
  await T.settle();
  T.eq(selected, "new", "an action fires ray-select");
  T.eq(nav.value, "inbox", "and is not a destination");
  T.eq(changes, 1);
  nav.innerHTML = `<ray-bottom-nav-item href="${location.pathname}" label="Here"></ray-bottom-nav-item><ray-bottom-nav-item href="/elsewhere" label="There"></ray-bottom-nav-item>`;
  nav.value = undefined;
  await T.settle();
  await T.settle();
  T.eq(nav.items[0].shadowRoot.querySelector(".item").localName, "a", "href: a link");
  T.eq(nav.items[0].active, true, "marks the link to this page");
  box.remove();
});
