// page: tests/pages/wayfinding.html
//
// ray-breadcrumbs, ray-stepper, ray-timeline.

const T = window.__rayTest;
await Promise.all(["ray-breadcrumbs", "ray-breadcrumb", "ray-stepper", "ray-step", "ray-timeline", "ray-timeline-item"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}

T.test("breadcrumbs: labelled nav, links, the last is the current page", async (T) => {
  const box = await mount(`<ray-breadcrumbs><ray-breadcrumb href="/">Home</ray-breadcrumb><ray-breadcrumb href="/docs">Docs</ray-breadcrumb><ray-breadcrumb href="/docs/x">X</ray-breadcrumb></ray-breadcrumbs>`);
  const bc = box.firstElementChild;
  const [home, , x] = bc.items;
  T.eq(bc.shadowRoot.querySelector("nav").getAttribute("aria-label"), "Breadcrumb");
  T.eq(home.getAttribute("role"), "listitem");
  T.eq(home.shadowRoot.querySelector(".link").localName, "a");
  T.eq(x.shadowRoot.querySelector(".link").localName, "span", "the current page is not a link");
  T.eq(x.shadowRoot.querySelector(".link").getAttribute("aria-current"), "page");
  T.eq(getComputedStyle(home.shadowRoot.querySelector(".sep.before")).display, "none", "no separator before the first");
  T.eq(x.shadowRoot.querySelector(".sep.before").textContent, "/");
  bc.separator = "chevron";
  await T.settle();
  T.ok(x.shadowRoot.querySelector(".sep svg"), "chevron icon");
  box.remove();
});

T.test("breadcrumbs: max-items collapses the middle; … expands it", async (T) => {
  const crumbs = ["A", "B", "C", "D", "E", "F"].map((t) => `<ray-breadcrumb href="#${t}">${t}</ray-breadcrumb>`).join("");
  const box = await mount(`<ray-breadcrumbs max-items="3">${crumbs}</ray-breadcrumbs>`);
  const bc = box.firstElementChild;
  const shown = () => bc.items.filter((i) => getComputedStyle(i).display !== "none").map((i) => i.textContent).join();
  T.eq(shown(), "A,E,F", "first, …, last two");
  const more = bc.items[4].shadowRoot.querySelector(".more");
  T.ok(getComputedStyle(more).display !== "none", "the … button shows");
  T.eq(more.getAttribute("aria-label"), "Show the whole path");
  more.click();
  await T.settle();
  T.eq(shown(), "A,B,C,D,E,F");
  box.remove();
});

T.test("stepper: draws the steps, shows the active content, next/prev, completed", async (T) => {
  const box = await mount(`<ray-stepper><ray-step label="One" description="first">1</ray-step><ray-step label="Two">2</ray-step><ray-step label="Three" icon="bell">3</ray-step><p slot="completed">done</p></ray-stepper>`);
  const st = box.firstElementChild;
  const steps = () => [...st.shadowRoot.querySelectorAll(".step")];
  T.eq(steps().length, 3);
  T.eq(steps().map((s) => s.dataset.state).join(), "active,todo,todo");
  T.eq(steps()[0].querySelector(".head").getAttribute("aria-current"), "step");
  T.ok(steps()[0].querySelector(".label").textContent.includes("Step 1 of 3: One"), "read with its position");
  T.ok(steps()[2].querySelector(".indicator svg"), "an icon instead of the number");
  const visible = () => st.steps.filter((s) => getComputedStyle(s).display !== "none").map((s) => s.textContent).join();
  T.eq(visible(), "1", "only the active content");
  let changes = 0;
  st.addEventListener("change", () => changes++);
  st.next();
  await T.settle();
  T.eq(st.active, 1);
  T.eq(changes, 1);
  T.eq(steps()[0].dataset.state, "done");
  T.ok(steps()[0].querySelector(".indicator svg"), "done: a check");
  T.eq(visible(), "2");
  st.next();
  st.next();
  await T.settle();
  T.eq(st.active, 3);
  T.ok(st.shadowRoot.querySelector(".completed").hasAttribute("data-show"), "completed slot");
  T.eq(visible(), "");
  st.prev();
  await T.settle();
  T.eq(st.active, 2);
  box.remove();
});

T.test("stepper: allow-step-select, error and loading", async (T) => {
  const box = await mount(`<ray-stepper active="2" allow-step-select><ray-step label="A"></ray-step><ray-step label="B" error="Card declined"></ray-step><ray-step label="C" loading></ray-step><ray-step label="D"></ray-step></ray-stepper>`);
  const st = box.firstElementChild;
  const heads = () => [...st.shadowRoot.querySelectorAll(".head")];
  T.eq(heads().map((h) => h.localName).join(), "button,button,div,div", "only completed steps are buttons");
  const b = st.shadowRoot.querySelectorAll(".step")[1];
  T.ok(b.hasAttribute("data-error"));
  T.eq(b.querySelector(".description").textContent, "Card declined");
  T.ok(st.shadowRoot.querySelectorAll(".step")[2].querySelector(".spinner"), "loading");
  heads()[0].click();
  await T.settle();
  T.eq(st.active, 0, "back to a completed step");
  box.remove();
});

T.test("timeline: reached items, lines, colors, list semantics", async (T) => {
  const box = await mount(`<ray-timeline active="1"><ray-timeline-item label="A" time="1">a</ray-timeline-item><ray-timeline-item label="B" icon="check">b</ray-timeline-item><ray-timeline-item label="C" color="red">c</ray-timeline-item></ray-timeline>`);
  const tl = box.firstElementChild;
  const [a, b, c] = tl.items;
  T.eq(tl.getAttribute("role"), "list");
  T.eq(a.getAttribute("role"), "listitem");
  T.eq([a, b, c].map((i) => i.hasAttribute("data-reached")).join(), "true,true,false");
  T.eq([a, b, c].map((i) => i.hasAttribute("data-line-reached")).join(), "true,false,false", "the line up to the active one");
  T.eq(getComputedStyle(c.shadowRoot.querySelector(".line")).display, "none", "no line after the last");
  T.eq(a.shadowRoot.querySelector(".title").textContent, "A");
  T.eq(a.shadowRoot.querySelector(".time").textContent, "1");
  T.ok(b.shadowRoot.querySelector(".bullet svg"), "icon bullet");
  T.ok(c.style.getPropertyValue("--_filled").includes("red"), "its own color");
  tl.reverseActive = true;
  tl.active = 0;
  await T.settle();
  T.eq([a, b, c].map((i) => i.hasAttribute("data-reached")).join(), "false,false,true", "reverse-active: from the end");
  box.remove();
});
