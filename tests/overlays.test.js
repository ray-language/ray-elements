// page: docs/components/all.html
//
// Phase 2 in the real webview: dialog, popover, tooltip, menu, notifications,
// tabs, segmented control, accordion.

const T = window.__rayTest;
const tags = ["ray-select", "ray-dialog", "ray-popover", "ray-tooltip", "ray-menu", "ray-menu-item", "ray-toaster", "ray-notification", "ray-tabs", "ray-tab", "ray-tab-panel", "ray-segmented-control", "ray-accordion", "ray-accordion-item"];
await Promise.all(tags.map((t) => customElements.whenDefined(t)));
const { confirmDialog } = await import("../../src/components/dialog/dialog.js");
const { notify, updateNotification, hideNotification, clearNotifications } = await import("../../src/components/notification/notification.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (el, k, extra = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true, cancelable: true, ...extra }));
const deepActive = () => {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
};

// --- dialog -----------------------------------------------------------------

T.test("dialog: opens modal, focuses content, locks scroll, restores focus", async (T) => {
  const box = await mount(`<button id="opener">open</button><ray-dialog label="Rename"><input id="name" autofocus><ray-button data-dialog-close="save">Save</ray-button></ray-dialog>`);
  const d = box.querySelector("ray-dialog");
  const opener = box.querySelector("#opener");
  opener.focus();
  let opened = 0;
  d.addEventListener("ray-open", () => opened++);
  d.show();
  await T.settle();
  T.eq(d.dialog.open, true, "native dialog open");
  T.eq(d.dialog.matches(":modal"), true, "modal");
  T.eq(opened, 1);
  T.eq(document.activeElement.id, "name", "autofocus element focused");
  T.eq(document.documentElement.style.overflow, "hidden", "scroll locked");
  T.eq(d.dialog.getAttribute("aria-labelledby"), "title");
  let closed = null;
  d.addEventListener("ray-close", (e) => { closed = e.detail.returnValue; });
  box.querySelector("ray-button").click();
  await T.settle();
  T.eq(d.open, false);
  T.eq(closed, "save", "returnValue from data-dialog-close");
  T.eq(document.activeElement, opener, "focus restored");
  T.eq(document.documentElement.style.overflow, "", "scroll unlocked");
  box.remove();
});

T.test("dialog: overlay blur from the token, a subtree and the overlay-blur attribute", async (T) => {
  const { configure } = await import("../../src/core/core.js");
  const box = await mount(`<ray-dialog label="Blur"><p>x</p></ray-dialog><div style="--ray-overlay-blur: 9px"><ray-drawer label="Side"><p>y</p></ray-drawer></div>`);
  const d = box.querySelector("ray-dialog");
  const dr = box.querySelector("ray-drawer");
  const blur = (el) => {
    const cs = getComputedStyle(el.dialog, "::backdrop");
    return cs.backdropFilter || cs.webkitBackdropFilter;
  };
  d.show();
  await T.settle();
  T.eq(blur(d), "blur(4px)", "default: [overlay] blur");
  const bg = getComputedStyle(d.dialog, "::backdrop").backgroundColor;
  T.ok(bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent", `overlay color (${bg})`);
  d.setAttribute("overlay-blur", "12");
  await T.settle();
  T.eq(blur(d), "blur(12px)", "a number is px");
  d.overlayBlur = "none";
  await T.settle();
  T.eq(blur(d), "blur(0px)", "none turns it off");
  d.removeAttribute("overlay-blur");
  d.overlayBlur = undefined;
  await T.settle();
  T.eq(blur(d), "blur(4px)", "unset: back to the inherited value");
  d.close();
  await T.settle();
  dr.show();
  await T.settle();
  T.eq(blur(dr), "blur(9px)", "the drawer follows its subtree");
  dr.close();
  await T.settle();
  configure({ defaults: { "ray-dialog": { overlayBlur: "2px" } } });
  const d2 = document.createElement("ray-dialog");
  box.append(d2);
  d2.show();
  await T.settle();
  T.eq(blur(d2), "blur(2px)", "configure() defaults");
  d2.close();
  await T.settle();
  configure({ defaults: { "ray-dialog": { overlayBlur: undefined } } });
  box.remove();
});

T.test("dialog: Escape closes; persistent and preventDefault keep it open", async (T) => {
  const box = await mount(`<ray-dialog label="X"><p>Body</p></ray-dialog>`);
  const d = box.querySelector("ray-dialog");
  const escape = () => d.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  d.show();
  await T.settle();
  T.eq(deepActive()?.classList.contains("close"), true, "no focusable content: close button focused");
  escape();
  await T.settle();
  T.eq(d.open, false, "Escape closes");
  d.persistent = true;
  d.show();
  await T.settle();
  escape();
  await T.settle();
  T.eq(d.open, true, "persistent ignores Escape");
  d.persistent = false;
  const veto = (e) => e.preventDefault();
  d.addEventListener("ray-request-close", veto);
  escape();
  await T.settle();
  T.eq(d.open, true, "ray-request-close canceled");
  d.removeEventListener("ray-request-close", veto);
  d.close("done");
  await T.settle();
  T.eq(d.returnValue, "done");
  box.remove();
});

T.test("dialog: description, free size and height, radius", async (T) => {
  const box = await mount(`<ray-dialog label="Settings" description="Project ray-remote" size="70%" height="70%" radius="none"><p>Body</p></ray-dialog>`);
  const d = box.querySelector("ray-dialog");
  d.show();
  await T.settle();
  const desc = d.shadowRoot.querySelector("#description");
  T.eq(desc.hidden, false);
  T.eq(desc.textContent, "Project ray-remote");
  T.eq(d.dialog.getAttribute("aria-describedby"), "description");
  const r = d.dialog.getBoundingClientRect();
  const want = Math.min(Math.max(innerWidth * 0.7, 640), innerWidth - 32);
  T.ok(Math.abs(r.width - want) <= 2, `width ${r.width} ≈ ${want}`);
  const wantH = Math.min(Math.max(innerHeight * 0.7, 480), innerHeight - 64);
  T.ok(Math.abs(r.height - wantH) <= 2, `height ${r.height} ≈ ${wantH}`);
  T.eq(getComputedStyle(d.dialog).borderTopLeftRadius, "0px");
  d.description = "";
  d.size = "sm";
  await T.settle();
  T.eq(desc.hidden, true);
  T.eq(d.dialog.hasAttribute("aria-describedby"), false);
  T.ok(d.dialog.getBoundingClientRect().width <= 380 + 1, "back to a preset");
  d.close();
  await T.settle();
  box.remove();
});

T.test("dialog: hide-close hides the close button", async (T) => {
  const box = await mount(`<ray-dialog label="X" hide-close><ray-button>OK</ray-button></ray-dialog>`);
  const d = box.querySelector("ray-dialog");
  d.show();
  await T.settle();
  T.eq(getComputedStyle(d.shadowRoot.querySelector(".close")).display, "none");
  d.close();
  await T.settle();
  box.remove();
});

T.test("dialog: confirmDialog resolves with the choice", async (T) => {
  const p = confirmDialog({ label: "Delete?", message: "Sure?", confirmLabel: "Delete", color: "red" });
  await T.settle();
  const d = document.querySelector("body > ray-dialog");
  T.ok(d, "dialog appended");
  T.eq(d.label, "Delete?");
  const del = [...d.querySelectorAll("ray-button")].find((b) => b.textContent === "Delete");
  T.eq(document.activeElement, del, "focus on the confirm button (rendered after the dialog opened)");
  del.click();
  T.eq(await p, true);
  T.eq(document.querySelector("body > ray-dialog"), null, "removed");
  const p2 = confirmDialog({});
  await T.settle();
  document.querySelector("body > ray-dialog").dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  T.eq(await p2, false, "Escape -> false");
});

// --- popover ----------------------------------------------------------------

T.test("popover: toggles, aria-expanded, positioned below, light dismiss syncs", async (T) => {
  const box = await mount(`<div style="position: fixed; top: 20px; left: 20px"><ray-popover><ray-button slot="trigger">Open</ray-button><p>Content</p></ray-popover></div>`);
  const pop = box.querySelector("ray-popover");
  const trigger = box.querySelector("ray-button");
  T.eq(trigger.getAttribute("aria-haspopup"), "dialog");
  T.eq(trigger.shadowRoot.querySelector("button").getAttribute("aria-haspopup"), "dialog", "mirrored to the inner button");
  trigger.click();
  await T.settle();
  T.eq(pop.open, true);
  T.eq(pop.panel.matches(":popover-open"), true);
  T.eq(trigger.getAttribute("aria-expanded"), "true");
  T.eq(trigger.shadowRoot.querySelector("button").getAttribute("aria-expanded"), "true");
  const t = trigger.getBoundingClientRect();
  const p = pop.panel.getBoundingClientRect();
  T.ok(p.top >= t.bottom, `below the trigger (${p.top} >= ${t.bottom})`);
  T.ok(p.left >= 0 && p.right <= document.documentElement.clientWidth, "inside the viewport");
  let closes = 0;
  pop.addEventListener("ray-close", () => closes++);
  pop.panel.hidePopover();  // what Escape / an outside click do
  await T.settle();
  T.eq(pop.open, false, "open synced after light dismiss");
  T.eq(trigger.getAttribute("aria-expanded"), "false");
  T.eq(closes, 1);
  box.remove();
});

T.test("popover: flips to the top when there is no room below", async (T) => {
  const box = await mount(`<div style="position: fixed; left: 20px; bottom: 4px"><ray-popover><button slot="trigger">x</button><div style="height: 200px; width: 100px">tall</div></ray-popover></div>`);
  const pop = box.querySelector("ray-popover");
  pop.open = true;
  await T.settle();
  T.eq(pop.panel.dataset.placement, "top-center");
  T.ok(pop.panel.getBoundingClientRect().bottom <= box.querySelector("button").getBoundingClientRect().top, "above");
  box.remove();
});

// --- tooltip ----------------------------------------------------------------

T.test("tooltip: describes its trigger, opens on focus, closes on Escape", async (T) => {
  const box = await mount(`<ray-tooltip label="Saves to disk" open-delay="0"><ray-button>Save</ray-button></ray-tooltip>`);
  const tip = box.querySelector("ray-tooltip");
  const btn = box.querySelector("ray-button");
  const ids = btn.getAttribute("aria-describedby").split(" ");
  const desc = document.getElementById(ids[ids.length - 1]);
  T.eq(desc?.textContent, "Saves to disk", "aria-describedby -> label text");
  const inner = btn.shadowRoot.querySelector("button");
  if ("ariaDescribedByElements" in inner) T.eq(inner.ariaDescribedByElements?.[0], desc, "inner button references it");
  T.eq(btn.hasAttribute("aria-expanded"), false, "not a popup trigger");
  btn.focus();
  await T.settle();
  T.eq(tip.open, true, "focus opens");
  T.eq(tip.panel.getAttribute("role"), "tooltip");
  T.eq(tip.panel.textContent, "Saves to disk");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await T.settle();
  T.eq(tip.open, false, "Escape closes");
  box.remove();
});

// --- menu -------------------------------------------------------------------

T.test("menu: keyboard opens, moves, skips disabled, typeahead, selects", async (T) => {
  const box = await mount(`<ray-menu>
    <ray-button slot="trigger">File</ray-button>
    <ray-menu-item value="new">New</ray-menu-item>
    <ray-menu-item value="open">Open</ray-menu-item>
    <ray-menu-item value="save" disabled>Save</ray-menu-item>
    <ray-menu-divider></ray-menu-divider>
    <ray-menu-item value="quit">Quit</ray-menu-item>
  </ray-menu>`);
  const menu = box.querySelector("ray-menu");
  const trigger = box.querySelector("ray-button");
  const items = menu.items;
  T.eq(trigger.getAttribute("aria-haspopup"), "menu");
  T.eq(items[0].internals.role, "menuitem");
  T.eq(menu.panel.getAttribute("role"), "menu");
  trigger.focus();
  key(trigger, "ArrowDown");
  await T.settle();
  T.eq(menu.open, true, "ArrowDown opens");
  T.eq(document.activeElement, items[0], "first item focused");
  key(items[0], "ArrowDown");
  T.eq(document.activeElement, items[1]);
  key(items[1], "ArrowDown");
  T.eq(document.activeElement, items[3], "disabled skipped");
  key(items[3], "ArrowDown");
  T.eq(document.activeElement, items[0], "wraps");
  key(items[0], "End");
  T.eq(document.activeElement, items[3]);
  key(items[3], "o");
  T.eq(document.activeElement, items[1], "typeahead 'o' -> Open");
  let chosen = null;
  menu.addEventListener("ray-select", (e) => { chosen = e.detail.value; });
  key(items[1], "Enter");
  await T.settle();
  T.eq(chosen, "open");
  T.eq(menu.open, false, "closes on select");
  T.eq(document.activeElement, trigger, "focus back to the trigger");
  items[2].click();
  T.eq(chosen, "open", "disabled item cannot be chosen");
  box.remove();
});

T.test("menu: context mode opens at the pointer", async (T) => {
  const box = await mount(`<div style="position: fixed; top: 20px; left: 20px"><ray-menu context><div slot="trigger" style="width: 300px; height: 100px"></div><ray-menu-item>Copy</ray-menu-item></ray-menu></div>`);
  const menu = box.querySelector("ray-menu");
  const area = box.querySelector("[slot=trigger]");
  T.eq(area.hasAttribute("aria-haspopup"), false, "the area is not a popup button");
  const r = area.getBoundingClientRect();
  const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left + 50, clientY: r.top + 30 });
  area.dispatchEvent(ev);
  await T.settle();
  T.eq(ev.defaultPrevented, true, "native menu suppressed");
  T.eq(menu.open, true);
  // The assigned position (the rect is mid scale-in animation).
  const left = parseFloat(menu.panel.style.left);
  const top = parseFloat(menu.panel.style.top);
  T.ok(Math.abs(left - (r.left + 50)) <= 1 && Math.abs(top - (r.top + 30 + 4)) <= 1, `at the pointer (${left},${top})`);
  menu.open = false;
  box.remove();
});

T.test("menu: ray-request-open comes before it opens; cancelling keeps it closed", async (T) => {
  const box = await mount(`<ray-menu><ray-button slot="trigger">Actions</ray-button><ray-menu-item value="a">A</ray-menu-item></ray-menu>`);
  const menu = box.querySelector("ray-menu");
  const trigger = menu.querySelector("[slot=trigger]");
  const seen = [];
  let cancel = true;
  menu.addEventListener("ray-request-open", (e) => {
    seen.push(`${e.detail.event.type}:${Boolean(menu.open)}`);
    if (cancel) e.preventDefault();
  });
  trigger.click();
  await T.settle();
  T.ok(!menu.open, "cancelled");
  trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
  await T.settle();
  T.ok(!menu.open, "cancelled from the keyboard too");
  cancel = false;
  trigger.click();
  await T.settle();
  T.eq(menu.open, true, "opens");
  trigger.click();
  await T.settle();
  T.ok(!menu.open, "closing asks nothing");
  T.eq(seen.join(), "click:false,keydown:false,click:false");
  box.remove();
});

// --- notifications ----------------------------------------------------------

T.test("notify: shows in a live region, updates, hides, auto-closes", async (T) => {
  clearNotifications();
  const id = notify({ title: "Saved", message: "On disk", autoClose: false });
  await T.settle();
  const toaster = document.querySelector("ray-toaster");
  T.ok(toaster, "toaster created");
  T.eq(toaster.getAttribute("aria-live"), "polite");
  T.eq(toaster.matches(":popover-open"), true, "in the top layer");
  const el = toaster.querySelector(`[data-notification-id="${id}"]`);
  T.eq(el.label, "Saved");
  T.eq(el.textContent, "On disk");
  updateNotification(id, { title: "Updated", color: "green", autoClose: false });
  await T.settle();
  T.eq(el.label, "Updated");
  T.eq(el.color, "green");
  hideNotification(id);
  T.eq(toaster.querySelector(`[data-notification-id="${id}"]`), null, "hidden");
  T.eq(toaster.matches(":popover-open"), false, "empty toaster hides");
  let closed = false;
  const id2 = notify({ message: "short", autoClose: 60, onClose: () => { closed = true; } });
  await wait(150);
  T.eq(document.querySelector(`[data-notification-id="${id2}"]`), null, "auto-closed");
  T.eq(closed, true, "onClose called");
});

T.test("notify: close button, same id updates, limit", async (T) => {
  clearNotifications();
  const id = notify({ id: "job", title: "Working", loading: true });
  notify({ id: "job", title: "Done", loading: false, autoClose: false });
  T.eq(document.querySelectorAll('[data-notification-id="job"]').length, 1, "same id updates in place");
  const el = document.querySelector('[data-notification-id="job"]');
  T.eq(el.label, "Done");
  el.shadowRoot.querySelector(".close").click();
  T.eq(document.querySelector('[data-notification-id="job"]'), null, "close button hides");
  const toaster = document.querySelector("ray-toaster");
  toaster.limit = 2;
  for (let i = 0; i < 4; i++) notify({ id: `n-${i}`, message: String(i), autoClose: false });
  T.eq([...toaster.children].map((c) => c.dataset.notificationId).join(), "n-2,n-3", "oldest dropped");
  toaster.limit = 5;
  clearNotifications();
  void id;
});

// --- tabs -------------------------------------------------------------------

T.test("tabs: ARIA wiring, click, keyboard, disabled, manual activation", async (T) => {
  const box = await mount(`<ray-tabs>
    <ray-tab value="a">A</ray-tab><ray-tab value="b">B</ray-tab><ray-tab value="c" disabled>C</ray-tab><ray-tab value="d">D</ray-tab>
    <ray-tab-panel value="a">pa</ray-tab-panel><ray-tab-panel value="b">pb</ray-tab-panel><ray-tab-panel value="c">pc</ray-tab-panel><ray-tab-panel value="d">pd</ray-tab-panel>
  </ray-tabs>`);
  const tabs = box.querySelector("ray-tabs");
  const [a, b, c, d] = tabs.tabs;
  const [pa, pb] = tabs.panels;
  T.eq(tabs.value, "a", "first tab by default");
  T.eq(a.getAttribute("role"), "tab");
  T.eq(a.getAttribute("aria-selected"), "true");
  T.eq(a.getAttribute("aria-controls"), pa.id);
  T.eq(pa.getAttribute("aria-labelledby"), a.id);
  T.eq([pa.hidden, pb.hidden].join(), "false,true");
  T.eq([a, b, c, d].map((t) => t.tabIndex).join(), "0,-1,-1,-1");
  let changes = 0;
  tabs.addEventListener("change", () => changes++);
  b.click();
  await T.settle();
  T.eq(tabs.value, "b");
  T.eq(pb.hidden, false);
  key(b, "ArrowRight");
  await T.settle();
  T.eq(tabs.value, "d", "disabled tab skipped");
  key(d, "ArrowRight");
  await T.settle();
  T.eq(tabs.value, "a", "wraps");
  key(a, "End");
  await T.settle();
  T.eq(tabs.value, "d");
  T.eq(changes, 4);
  tabs.activation = "manual";
  key(d, "Home");
  await T.settle();
  T.eq(document.activeElement, a, "manual: focus moves");
  T.eq(tabs.value, "d", "manual: not activated yet");
  key(a, "Enter");
  await T.settle();
  T.eq(tabs.value, "a", "manual: Enter activates");
  box.remove();
});

T.test("tabs: size scales the tabs; a nested tab bar keeps its own", async (T) => {
  const box = await mount(`<ray-tabs id="outer"><ray-tab value="a">A</ray-tab><ray-tab-panel value="a"><ray-tabs id="inner"><ray-tab value="x">X</ray-tab></ray-tabs></ray-tab-panel></ray-tabs>`);
  const outer = box.querySelector("#outer");
  const tabA = outer.querySelector('ray-tab[value="a"]');
  const tabX = box.querySelector('#inner ray-tab');
  const px = (v) => parseFloat(v);
  const sm = { h: px(getComputedStyle(tabA).minHeight), fs: px(getComputedStyle(tabA).fontSize), pad: px(getComputedStyle(tabA).paddingInlineStart) };
  T.eq(outer.size, "sm", "sm by default");
  outer.size = "xs";
  await T.settle();
  const xs = getComputedStyle(tabA);
  T.eq(outer.getAttribute("size"), "xs", "reflected");
  T.ok(px(xs.minHeight) < sm.h && px(xs.fontSize) < sm.fs && px(xs.paddingInlineStart) < sm.pad, `smaller (${xs.minHeight}, ${xs.fontSize}, ${xs.paddingInlineStart})`);
  T.eq(px(getComputedStyle(tabX).minHeight), sm.h, "the nested bar stays sm");
  outer.size = "lg";
  await T.settle();
  T.ok(px(getComputedStyle(tabA).minHeight) > sm.h, "lg is taller");
  box.remove();
});

// --- segmented control ------------------------------------------------------

T.test("segmented control: form value, arrows, data, reset", async (T) => {
  const box = await mount(`<form><ray-segmented-control name="view" value="grid"><option value="list">List</option><option value="grid">Grid</option><option value="board" disabled>Board</option></ray-segmented-control></form>`);
  const form = box.querySelector("form");
  const sc = form.querySelector("ray-segmented-control");
  const buttons = () => [...sc.shadowRoot.querySelectorAll("button")];
  T.eq(new FormData(form).get("view"), "grid");
  T.eq(buttons().map((b) => b.getAttribute("aria-checked")).join(), "false,true,false");
  T.eq(sc.shadowRoot.querySelector(".root").getAttribute("role"), "radiogroup");
  let changes = 0;
  sc.addEventListener("change", () => changes++);
  key(buttons()[1], "ArrowRight");
  await T.settle();
  T.eq(sc.value, "list", "disabled skipped, wraps");
  buttons()[1].click();
  await T.settle();
  T.eq(sc.value, "grid");
  T.eq(changes, 2);
  form.reset();
  await T.settle();
  T.eq(sc.value, "grid", "reset to the value attribute");
  sc.data = ["1h", { value: "24h", label: "1 day" }];
  await T.settle();
  T.eq(buttons().map((b) => b.textContent).join(), "1h,1 day");
  T.eq(sc.value, "1h", "falls back to the first option");
  box.remove();
});

// --- accordion --------------------------------------------------------------

T.test("accordion: description under the label, content spaced from the header", async (T) => {
  const box = await mount(`<ray-accordion variant="filled" value="a"><ray-accordion-item value="a" label="Account" description="Name and email">Body</ray-accordion-item></ray-accordion>`);
  const item = box.querySelector("ray-accordion-item");
  await T.settle();
  const sr = item.shadowRoot;
  T.eq(sr.querySelector(".label-text").textContent, "Account");
  T.eq(sr.querySelector(".description").textContent, "Name and email");
  const header = sr.querySelector(".control").getBoundingClientRect();
  const text = sr.querySelector(".content").getBoundingClientRect();
  T.eq(text.top - header.bottom, 0, "the content box starts under the header");
  T.ok(parseFloat(getComputedStyle(sr.querySelector(".content")).paddingTop) >= 8, "and keeps its text away from it");
  item.description = "";
  await T.settle();
  T.eq(getComputedStyle(sr.querySelector(".description")).display, "none", "no description, no line");
  box.remove();
});

T.test("accordion: single, multiple, ARIA, inert panels, keyboard", async (T) => {
  const box = await mount(`<ray-accordion value="a">
    <ray-accordion-item value="a" label="A">x</ray-accordion-item>
    <ray-accordion-item value="b" label="B">y</ray-accordion-item>
    <ray-accordion-item value="c" label="C" disabled>z</ray-accordion-item>
  </ray-accordion>`);
  const acc = box.querySelector("ray-accordion");
  const [a, b, c] = acc.items;
  const ctl = (i) => i.shadowRoot.querySelector(".control");
  const panel = (i) => i.shadowRoot.querySelector(".panel");
  T.eq(a.open, true);
  T.eq(ctl(a).getAttribute("aria-expanded"), "true");
  T.eq(panel(b).inert, true, "closed panel is inert");
  T.eq(panel(a).getAttribute("role"), "region");
  ctl(b).click();
  await T.settle();
  T.eq(acc.value, "b");
  T.eq([a.open, b.open].join(), "false,true", "single: the other closes");
  ctl(b).click();
  await T.settle();
  T.eq(acc.value, undefined, "click again closes");
  ctl(c).click();
  await T.settle();
  T.eq(c.open, false, "disabled");
  acc.multiple = true;
  acc.value = ["a"];
  await T.settle();
  ctl(b).click();
  await T.settle();
  T.eq(acc.value.join(), "a,b", "multiple keeps both");
  a.focus();
  key(ctl(a), "ArrowDown");
  T.eq(deepActive(), ctl(b), "ArrowDown moves to the next header");
  key(ctl(b), "ArrowDown");
  T.eq(deepActive(), ctl(a), "skips the disabled item, wraps");
  box.remove();
});

T.test("notify over an open modal dialog stays visible and clickable", async (T) => {
  clearNotifications();
  const box = await mount(`<ray-dialog label="Modal"><p>Body</p></ray-dialog>`);
  const d = box.querySelector("ray-dialog");
  d.show();
  await T.settle();
  notify({ id: "over-modal", message: "Above the dialog", autoClose: false });
  await T.settle();
  const el = document.querySelector('[data-notification-id="over-modal"]');
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  T.ok(hit === el || el.contains(hit), `hit-testable above the modal (got ${hit?.localName})`);
  clearNotifications();
  d.close();
  box.remove();
});

// --- drawer -------------------------------------------------------------------

T.test("drawer: modal, edge, size, focus, returnValue", async (T) => {
  await customElements.whenDefined("ray-drawer");
  const box = await mount(`<button id="drawer-opener">open</button><ray-drawer label="Settings" size="300px"><input id="drawer-first" autofocus><ray-button data-dialog-close="save">Save</ray-button></ray-drawer>`);
  const d = box.querySelector("ray-drawer");
  box.querySelector("#drawer-opener").focus();
  d.show();
  await T.settle();
  T.eq(d.dialog.matches(":modal"), true, "modal by default");
  T.eq(document.documentElement.style.overflow, "hidden", "scroll locked");
  T.eq(document.activeElement.id, "drawer-first", "focus moved in");
  // Computed position, not the rect: in a hidden window the slide-in animation does not advance.
  const cs = getComputedStyle(d.dialog);
  T.eq(cs.right, "0px", "on the right edge");
  T.eq(cs.width, "300px", "size as CSS length");
  let returned = null;
  d.addEventListener("ray-close", (e) => { returned = e.detail.returnValue; });
  box.querySelector("ray-button").click();
  await T.settle();
  T.eq(d.open, false);
  T.eq(returned, "save");
  T.eq(document.activeElement.id, "drawer-opener", "focus restored");
  d.position = "left";
  d.show();
  await T.settle();
  T.eq(getComputedStyle(d.dialog).left, "0px", "left edge");
  d.dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  await T.settle();
  T.eq(d.open, false, "Escape closes");
  box.remove();
});

T.test("drawer: modeless keeps the page interactive; Escape still closes", async (T) => {
  const box = await mount(`<button id="behind" style="position: fixed; left: 10px; bottom: 10px">behind</button><ray-drawer label="Inspector" modeless size="200px"><p>x</p></ray-drawer>`);
  const d = box.querySelector("ray-drawer");
  d.show();
  await T.settle();
  T.eq(d.dialog.open, true);
  T.eq(d.dialog.matches(":modal"), false, "not modal");
  T.eq(document.documentElement.style.overflow, "", "no scroll lock");
  const behind = box.querySelector("#behind");
  const r = behind.getBoundingClientRect();
  T.eq(document.elementFromPoint(r.left + 5, r.top + 5), behind, "the page stays hit-testable");
  // Above a sticky header (z-index --ray-z-sticky): not in the top layer, so stacked by z-index.
  const header = document.createElement("header");
  header.style.cssText = "position: fixed; top: 0; left: 0; right: 0; height: 60px; z-index: var(--ray-z-sticky); background: red";
  box.append(header);
  d.dialog.style.animation = "none"; // the entry animation does not advance in the hidden test window
  const dr = d.dialog.getBoundingClientRect();
  T.eq(document.elementFromPoint(dr.left + 10, dr.top + 10), d, "the drawer covers the sticky header");
  d.dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await T.settle();
  T.eq(d.open, false, "Escape closes the modeless drawer");
  box.remove();
});

T.test("drawer: notifications move into a modal drawer", async (T) => {
  clearNotifications();
  const box = await mount(`<ray-drawer label="D"><p>x</p></ray-drawer>`);
  const d = box.querySelector("ray-drawer");
  d.show();
  await T.settle();
  notify({ id: "in-drawer", message: "Above the drawer", autoClose: false });
  await T.settle();
  T.eq(document.querySelector("ray-toaster").parentElement, d, "toaster hosted by the drawer");
  clearNotifications();
  d.close();
  await T.settle();
  T.eq(document.querySelector("ray-toaster").parentElement, document.body, "back to body");
  box.remove();
});

// --- light dismiss (core/dismiss.js) ---------------------------------------

T.test("light dismiss: outside press, nesting, Escape over a dialog, one open at a time", async (T) => {
  const box = await mount(`<button id="out">outside</button>
    <ray-popover id="p1"><ray-button slot="trigger">One</ray-button>
      <ray-select id="inner" aria-label="Inner"><option>a</option><option>b</option></ray-select>
    </ray-popover>
    <ray-popover id="p2"><ray-button slot="trigger">Two</ray-button><p>two</p></ray-popover>
    <ray-dialog label="D"><ray-menu id="m"><ray-button slot="trigger">Menu</ray-button><ray-menu-item>x</ray-menu-item></ray-menu></ray-dialog>`);
  const [p1, p2] = [box.querySelector("#p1"), box.querySelector("#p2")];
  const sel = box.querySelector("#inner");
  const press = (el) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  const esc = () => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

  p1.show();
  await T.settle();
  T.eq(p1.panel.getAttribute("popover"), "manual", "manual popovers");
  sel.toggle(true);
  await T.settle();
  T.eq(sel.open, true);
  press(sel.listbox.querySelector('[role="option"]'));
  await T.settle();
  T.eq(p1.open && sel.open, true, "a press inside the nested dropdown closes nothing");
  esc();
  await T.settle();
  T.eq(sel.open, false, "Escape closes the topmost (the dropdown)");
  T.eq(p1.open, true, "and only it");
  p2.show();
  await T.settle();
  T.eq(p1.open, false, "opening another panel closes the first");
  press(box.querySelector("#out"));
  await T.settle();
  T.eq(p2.open, false, "an outside press closes it");

  const d = box.querySelector("ray-dialog");
  const m = box.querySelector("#m");
  d.show();
  await T.settle();
  m.show();
  await T.settle();
  const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  document.body.dispatchEvent(ev);
  await T.settle();
  T.eq(m.open, false, "Escape closes the menu");
  T.eq(ev.defaultPrevented, true, "and is consumed");
  T.eq(d.open, true, "the dialog underneath stays open");
  d.close();
  await T.settle();
  box.remove();
});

T.test("motion: off with zero durations (the test window), play resolves at once", async (T) => {
  const motion = await import("../../src/core/motion.js");
  const el = document.createElement("div");
  document.body.append(el);
  T.eq(motion.duration(el, "base"), 0, "the harness zeroes the duration tokens");
  T.eq(motion.motionAllowed(el), false);
  let done = false;
  motion.play(el, [{ opacity: 1 }, { opacity: 0 }]).finished.then(() => { done = true; });
  await Promise.resolve();
  T.eq(done, true, "resolved without animating");
  el.style.setProperty("--ray-duration-base", "250ms");
  T.eq(motion.duration(el, "base"), 250, "reads ms");
  el.style.setProperty("--ray-duration-base", "0.2s");
  T.eq(motion.duration(el, "base"), 200, "reads s");
  el.remove();
});

// --- stacked notifications --------------------------------------------------

T.test("toasts: stacked, expand on hover/focus/tap, action, swipe to dismiss", async (T) => {
  const inner = (el, sel) => el.shadowRoot.querySelector(sel);
  clearNotifications();
  await T.settle();
  let undone = 0;
  const a = notify({ title: "One", message: "first", autoClose: false });
  const b = notify({ title: "Two", message: "second", autoClose: false });
  const c = notify({ title: "Event created", message: "Sunday, December 3 at 9:00 AM", autoClose: false, action: { label: "Undo", onClick: () => undone++ } });
  await T.settle();
  const t = document.querySelector("ray-toaster");
  // The front card grows once its action button renders; a page re-places
  // the stack from a ResizeObserver, which a hidden test window may not run
  // in time (no frames), so place it explicitly before measuring.
  t.layout();
  const [front, mid, back] = t.toasts;
  T.eq(front.dataset.notificationId, c, "newest in front");
  T.ok(front.hasAttribute("data-front") && !front.hasAttribute("data-behind"));
  T.ok(mid.hasAttribute("data-behind") && back.hasAttribute("data-behind"), "older ones behind, content hidden");
  T.ok(/scale\(0\.95\)/.test(mid.style.transform) && /scale\(0\.9\)/.test(back.style.transform), `smaller behind (${mid.style.transform})`);
  T.eq(mid.style.height, `${inner(front, ".card").offsetHeight}px`, "behind ones take the front's height");
  const collapsed = t.getBoundingClientRect().height;

  t.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  await T.settle();
  T.eq(t.expanded, true, "focus inside expands");
  T.ok(!mid.hasAttribute("data-behind") && mid.style.height === "", "expanded: full toasts");
  T.ok(t.getBoundingClientRect().height > collapsed, "the region grows");
  t.expanded = false;
  await T.settle();

  // Touch: a tap on the collapsed stack expands it and is consumed.
  front.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }));
  T.eq(t.expanded, true, "a tap expands");
  const click = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
  inner(front, '[part="action"]').dispatchEvent(click);
  T.eq(undone, 0, "the expanding tap does not press the action");
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "touch" }));
  T.eq(t.expanded, false, "a tap outside collapses");

  // The action runs and closes the toast.
  inner(front, '[part="action"]').click();
  await T.settle();
  T.eq(undone, 1, "action ran");
  T.eq(document.querySelector(`[data-notification-id="${c}"]`), null, "and the toast closed");

  // Swipe: a horizontal drag beyond the threshold dismisses.
  const el = t.toasts[0];
  const down = { bubbles: true, composed: true, pointerType: "touch", clientX: 100, clientY: 100, pointerId: 7 };
  t.expanded = true;
  el.dispatchEvent(new PointerEvent("pointerdown", { ...down, button: 0 }));
  window.dispatchEvent(new PointerEvent("pointermove", { ...down, clientX: 140 }));
  window.dispatchEvent(new PointerEvent("pointermove", { ...down, clientX: 190 }));
  window.dispatchEvent(new PointerEvent("pointerup", { ...down, clientX: 190 }));
  await T.settle();
  T.eq(document.querySelector(`[data-notification-id="${el.dataset.notificationId}"]`), null, "swiped away");
  T.eq(t.toasts.length, 1);
  T.eq(t.expanded, false, "one toast left: no expanded stack");
  clearNotifications();
  await T.settle();
  void a; void b;
});

T.test("notifications: a color gets a status icon in place of the loader", async (T) => {
  const box = document.createElement("div");
  box.innerHTML = `
    <ray-notification color="green" label="ok">a</ray-notification>
    <ray-notification color="red" label="no">b</ray-notification>
    <ray-notification color="yellow" label="warn">c</ray-notification>
    <ray-notification color="blue" icon="star" label="custom">d</ray-notification>
    <ray-notification color="green" icon="none" label="bare">e</ray-notification>
    <ray-notification color="green" loading label="busy">f</ray-notification>
    <ray-notification label="plain">g</ray-notification>`;
  document.body.append(box);
  await T.settle();
  const els = [...box.children];
  const glyph = (el) => el.shadowRoot.querySelector(".glyph");
  const card = (el) => el.shadowRoot.querySelector(".card");
  T.eq(els.slice(0, 4).map((el) => glyph(el).getAttribute("data-ray-icon")).join(), "circle-check,circle-x,alert-triangle,star");
  T.ok(glyph(els[0]).querySelector("svg"), "painted from the registry");
  T.ok(getComputedStyle(glyph(els[0])).display !== "none", "shown");
  T.ok(!card(els[4]).hasAttribute("data-glyph"), "icon=none");
  T.eq(getComputedStyle(glyph(els[5])).display, "none", "the loader replaces it");
  T.ok(!card(els[6]).hasAttribute("data-glyph"), "no color, no icon");
  T.eq(getComputedStyle(card(els[0]), "::before").content, "none", "no accent bar");
  box.remove();
});
