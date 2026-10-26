// page: docs/components/all.html
//
// App-shell pieces: ray-button-group and ray-sidebar (+ ray-sidebar-group).

const T = window.__rayTest;
await Promise.all(["ray-button-group", "ray-button", "ray-icon-button", "ray-input", "ray-sidebar", "ray-sidebar-group", "ray-nav-link"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const corners = (el) => {
  const cs = getComputedStyle(inner(el, ".button") ?? inner(el, ".box"));
  return [cs.borderStartStartRadius, cs.borderStartEndRadius, cs.borderEndStartRadius, cs.borderEndEndRadius].join(" ");
};

T.test("button group: inner corners squared, borders overlapped, vertical, fields", async (T) => {
  const box = await mount(`<ray-button-group label="Align"><ray-button variant="default">L</ray-button><ray-button variant="default">C</ray-button><ray-button variant="default">R</ray-button></ray-button-group>
    <ray-button-group orientation="vertical"><ray-button variant="default">T</ray-button><ray-button variant="default">B</ray-button></ray-button-group>
    <ray-button-group><ray-input aria-label="q"></ray-input><ray-button variant="default">Go</ray-button></ray-button-group>`);
  const [h, v, f] = box.querySelectorAll("ray-button-group");
  T.eq(h.getAttribute("role"), "group");
  T.eq(h.getAttribute("aria-label"), "Align");
  const [l, c, r] = h.children;
  const rad = getComputedStyle(inner(l, ".button")).borderStartStartRadius;
  T.ok(rad !== "0px", `outer corners keep the radius (${rad})`);
  T.eq(corners(l), `${rad} 0px ${rad} 0px`, "first: end corners square");
  T.eq(corners(c), "0px 0px 0px 0px", "middle: all square");
  T.eq(corners(r), `0px ${rad} 0px ${rad}`, "last: start corners square");
  T.eq(getComputedStyle(c).marginInlineStart, "-1px", "borders overlap");
  const [t, b] = v.children;
  T.eq(corners(t), `${rad} ${rad} 0px 0px`, "vertical first: bottom corners square");
  T.eq(corners(b), `0px 0px ${rad} ${rad}`, "vertical last: top corners square");
  T.eq(v.hasAttribute("aria-orientation"), false, "no aria-orientation on role=group");
  const [input, go] = f.children;
  T.eq(corners(input), `${rad} 0px ${rad} 0px`, "a field joins too");
  T.eq(corners(go), `0px ${rad} 0px ${rad}`);
  box.remove();
});

const SIDEBAR = (bp) => `<div style="display:flex;height:300px"><ray-sidebar breakpoint="${bp}" label="Main">
  <div slot="header">Brand</div>
  <ray-sidebar-group label="Project"><ray-nav-link label="Files" href="#x"><span slot="left">F</span></ray-nav-link><ray-nav-link label="Run" href="#y"><span slot="left">R</span></ray-nav-link></ray-sidebar-group>
</ray-sidebar><main style="flex:1">main</main></div>`;

T.test("sidebar (wide): collapses to an icon rail; toggle(); group titles", async (T) => {
  const box = await mount(SIDEBAR("1px"));
  const s = box.querySelector("ray-sidebar");
  const links = [...s.querySelectorAll("ray-nav-link")];
  const group = s.querySelector("ray-sidebar-group");
  T.eq(s.mobile, false, "wide screen");
  T.eq(s.getBoundingClientRect().width, 256, "16rem");
  T.eq(inner(s, ".content").getAttribute("aria-label"), "Main");
  T.eq(inner(group, ".label").textContent, "Project");
  let detail = null;
  s.addEventListener("ray-toggle", (e) => { detail = e.detail; });
  s.toggle();
  await T.settle();
  T.eq(s.collapsed, true, "toggle collapses");
  T.eq(detail?.collapsed, true);
  T.eq(s.getBoundingClientRect().width, 56, "3.5rem rail");
  T.ok(links.every((l) => l.iconOnly), "links show only their icon");
  T.eq(inner(links[0], ".link").getAttribute("aria-label"), "Files", "the label still names the link");
  T.eq(group.hasAttribute("collapsed"), true, "group title fades");
  s.toggle();
  await T.settle();
  T.ok(links.every((l) => !l.iconOnly), "expanded again");
  box.remove();
});

T.test("sidebar (wide): resizable by drag and keys, clamped, autosaved; mirrored at the end", async (T) => {
  try { localStorage.removeItem("ray-sidebar:test"); } catch {}
  const html = SIDEBAR("1px").replace('<ray-sidebar ', '<ray-sidebar resizable min-width="200" max-width="400" autosave="test" ');
  const box = await mount(html);
  const s = box.querySelector("ray-sidebar");
  const edge = inner(s, '[part="resizer"]');
  const width = () => Math.round(s.getBoundingClientRect().width);
  T.eq(edge.getAttribute("role"), "separator");
  T.eq(edge.getAttribute("aria-label"), "Resize sidebar");
  T.eq(getComputedStyle(edge).display, "block", "shown when resizable");
  let resized = null;
  s.addEventListener("ray-resize", (e) => { resized = e.detail.width; });
  edge.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(resized, 266, "ArrowRight widens a start sidebar by 10");
  edge.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(resized, 400, "End: max-width");
  const r = s.getBoundingClientRect();
  edge.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 3, clientX: r.right, clientY: r.top + 10 }));
  edge.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 3, clientX: r.left + 100, clientY: r.top + 10 }));
  T.eq(s.hasAttribute("data-dragging"), true, "dragging");
  edge.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 3, clientX: r.left + 300, clientY: r.top + 10 }));
  await T.settle();
  T.eq(resized, 300, "dragged");
  T.eq(edge.getAttribute("aria-valuenow"), "300");
  s.collapsed = true;
  await T.settle();
  T.eq(getComputedStyle(edge).display, "none", "no edge on the rail");
  box.remove();
  const again = await mount(html);
  T.eq(Math.round(parseFloat(again.querySelector("ray-sidebar").style.getPropertyValue("--_w"))), 300, "autosave restored");
  again.remove();
  try { localStorage.removeItem("ray-sidebar:test"); } catch {}
  const end = await mount(SIDEBAR("1px").replace('<ray-sidebar ', '<ray-sidebar resizable side="end" '));
  const e2 = end.querySelector("ray-sidebar");
  let w = null;
  e2.addEventListener("ray-resize", (e) => { w = e.detail.width; });
  inner(e2, '[part="resizer"]').dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(w, 266, "at the end, ArrowLeft widens");
  end.remove();
});

T.test("sidebar (narrow): a modal drawer; toggle opens; Escape and links close", async (T) => {
  const box = await mount(SIDEBAR("99999px"));
  const s = box.querySelector("ray-sidebar");
  T.eq(s.mobile, true, "narrow screen");
  T.eq(s.getBoundingClientRect().width, 0, "takes no room");
  T.eq(s.dialog.open, false);
  s.collapsed = true;
  await T.settle();
  T.ok([...s.querySelectorAll("ray-nav-link")].every((l) => !l.iconOnly), "no rail in drawer mode");
  s.toggle();
  await T.settle();
  T.eq(s.open, true, "toggle opens the drawer");
  T.eq(s.dialog.matches(":modal"), true, "modal");
  T.ok(s.dialog.contains(inner(s, ".panel")), "the panel is in the drawer");
  s.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  await T.settle();
  T.eq(s.open, false, "Escape closes");
  T.eq(s.dialog.open, false);
  s.open = true;
  await T.settle();
  inner(s.querySelector("ray-nav-link"), ".link").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
  await T.settle();
  T.eq(s.open, false, "following a link closes it");
  s.breakpoint = "1px";
  await T.settle();
  T.eq(s.mobile, false, "back to the wide layout");
  T.ok(!s.dialog.contains(inner(s, ".panel")), "the panel back in place");
  box.remove();
});

T.test("button: raised variant sinks while pressed (pointer and keyboard)", async (T) => {
  const box = document.createElement("div");
  box.innerHTML = `<ray-button variant="raised">Go</ray-button><ray-button variant="raised">Key</ray-button><ray-button variant="filled">Flat</ray-button><ray-button variant="raised" disabled>Off</ray-button>`;
  document.body.append(box);
  await T.settle();
  const [raised, keyed, flat, off] = [...box.children].map((b) => b.shadowRoot.querySelector(".button"));
  T.eq(raised.dataset.variant, "raised");
  T.ok(getComputedStyle(raised).boxShadow !== "none", "an edge under the face");
  T.ok(parseFloat(getComputedStyle(box.children[0]).paddingBottom) > 0, "the host reserves the edge");
  raised.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  T.ok(raised.hasAttribute("data-pressed"), "pressed on pointerdown");
  keyed.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  T.ok(keyed.hasAttribute("data-pressed"), "Enter presses it too");
  flat.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  T.ok(!flat.hasAttribute("data-pressed"), "other variants are untouched");
  off.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  T.ok(!off.hasAttribute("data-pressed"), "disabled does not press");
  T.eq(getComputedStyle(off).boxShadow, "none", "disabled sits flat");
  box.remove();
});

T.test("toggle: flips pressed, aria-pressed, events, form and reset", async (T) => {
  const box = document.createElement("div");
  box.innerHTML = `<form><ray-toggle name="bold" value="yes">B</ray-toggle><ray-toggle variant="gradient" pressed name="wrap">W</ray-toggle><ray-toggle disabled>D</ray-toggle></form>`;
  document.body.append(box);
  await T.settle();
  const form = box.querySelector("form");
  const [bold, wrap, off] = form.children;
  const inner = (t) => t.shadowRoot.querySelector(".button");
  T.eq(inner(bold).getAttribute("aria-pressed"), "false");
  T.eq(inner(bold).dataset.toggle, "subtle", "default variant");
  T.eq(inner(wrap).dataset.toggle, "subtle", "button-only variants fall back to subtle");
  const seen = [];
  bold.addEventListener("change", () => seen.push(bold.pressed));
  bold.click();
  await T.settle();
  T.ok(bold.pressed && bold.hasAttribute("pressed"), "pressed and reflected");
  T.eq(inner(bold).getAttribute("aria-pressed"), "true");
  T.eq(seen.join(), "true");
  T.eq(new FormData(form).get("bold"), "yes", "submitted while pressed");
  T.eq(new FormData(form).get("wrap"), "on", "default value");
  bold.click();
  await T.settle();
  T.eq(seen.join(), "true,false");
  T.eq(new FormData(form).get("bold"), null, "not submitted when off");
  off.click();
  await T.settle();
  T.ok(!off.pressed, "disabled does not flip");
  wrap.click();
  bold.click();
  await T.settle();
  form.reset();
  await T.settle();
  T.ok(wrap.pressed && !bold.pressed, "reset restores the initial state");
  const raised = document.createElement("ray-toggle");
  raised.variant = "raised";
  raised.pressed = true;
  box.append(raised);
  await T.settle();
  T.eq(inner(raised).dataset.variant, "raised", "raised reuses the button's key");
  T.ok(getComputedStyle(inner(raised)).transform !== "none", "on stays down");
  box.remove();
});

T.test("toggle group: single, multiple, required, inheritance, roving tab stop and form", async (T) => {
  const box = document.createElement("div");
  box.innerHTML = `<form>
    <ray-toggle-group name="align" type="single" value="left" variant="outline" color="gray">
      <ray-toggle value="left">L</ray-toggle><ray-toggle value="center">C</ray-toggle><ray-toggle value="right" variant="filled">R</ray-toggle>
    </ray-toggle-group>
    <ray-toggle-group name="style" type="multiple" value="bold">
      <ray-toggle value="bold">B</ray-toggle><ray-toggle value="italic">I</ray-toggle><ray-toggle value="underline">U</ray-toggle>
    </ray-toggle-group>
    <ray-toggle-group type="single" value="week" required>
      <ray-toggle value="day">Day</ray-toggle><ray-toggle value="week">Week</ray-toggle>
    </ray-toggle-group>
  </form>`;
  document.body.append(box);
  await T.settle();
  await T.settle();
  const form = box.querySelector("form");
  const [align, style, range] = form.querySelectorAll("ray-toggle-group");
  const [l, c, r] = align.toggles;
  T.ok(l.pressed && !c.pressed && !r.pressed, "value presses its toggle");
  T.eq(c.variant, "outline", "variant handed down");
  T.eq(r.variant, "filled", "a toggle's own variant wins");
  T.eq(c.color, "gray");
  T.eq(l.tabIndex, 0, "the selected toggle is the tab stop");
  T.eq(c.tabIndex, -1);

  const changes = [];
  form.addEventListener("change", (e) => changes.push([e.target.localName, JSON.stringify(e.target.value ?? null)]));
  c.click();
  await T.settle();
  T.eq(align.value, "center");
  T.ok(!l.pressed && c.pressed, "single: the others turn off");
  T.eq(changes.map((x) => x.join(" ")).join(" | "), 'ray-toggle-group "center"', "only the group's change leaves it");
  c.click();
  await T.settle();
  T.eq(align.values.length, 0, "single can be cleared");
  T.eq(new FormData(form).get("align"), null);
  r.click();
  await T.settle();
  T.eq(new FormData(form).get("align"), "right");

  const [b, i, u] = style.toggles;
  u.click();
  i.click();
  await T.settle();
  T.eq(JSON.stringify(style.value), '["bold","italic","underline"]', "multiple keeps toggle order");
  T.eq(new FormData(form).getAll("style").join(), "bold,italic,underline");
  b.click();
  await T.settle();
  T.eq(style.values.join(), "italic,underline");

  const [day, week] = range.toggles;
  week.click();
  await T.settle();
  T.ok(week.pressed, "required: the selected toggle stays on");
  T.eq(range.value, "week");

  // Arrow keys move the focus and the tab stop.
  style.toggles[0].focus();
  style.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
  T.eq(style.toggles[2].tabIndex, 0, "End moves the tab stop to the last toggle");

  align.value = "left";
  await T.settle();
  T.ok(l.pressed && !r.pressed, "setting value updates the toggles");
  form.reset();
  await T.settle();
  T.eq(style.values.join(), "bold", "reset restores the initial value");
  box.remove();
});
