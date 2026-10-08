// page: docs/components/all.html
//
// Behavior of the phase-1 components in the real webview: form association
// (FormData, validity, reset, fieldset), events, keyboard and ARIA.

const T = window.__rayTest;
const tags = ["ray-button", "ray-icon-button", "ray-input", "ray-search", "ray-textarea", "ray-select", "ray-checkbox", "ray-switch", "ray-radio-group", "ray-radio", "ray-badge", "ray-avatar", "ray-card", "ray-kbd", "ray-separator", "ray-spinner"];
await Promise.all(tags.map((t) => customElements.whenDefined(t)));
const { COLORS, VARIANT_TOKENS } = await import("../../src/core/styles.js");
const { initials } = await import("../../src/components/avatar/avatar.js");

/** Mounts markup in a fresh container; returns the container. */
async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}

const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const typeInto = (el, value) => {
  const c = el.control;
  c.value = value;
  c.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
};

T.test("styles.js colors match tokens.json", async (T) => {
  const tokens = await (await fetch("../../dist/tokens.json")).json();
  T.eq(COLORS.join(","), tokens.colors.join(","), "COLORS");
  T.eq(VARIANT_TOKENS.join(","), tokens.variants.join(","), "VARIANT_TOKENS");
});

T.test("button: submit sends the form with name=value", async (T) => {
  const box = await mount(`<form><ray-input name="q" value="hi"></ray-input><ray-button type="submit" name="action" value="save">Save</ray-button></form>`);
  const form = box.querySelector("form");
  let data = null;
  form.addEventListener("submit", (e) => { e.preventDefault(); data = new FormData(form); });
  inner(box.querySelector("ray-button"), "button").click();
  T.ok(data, "submit fired");
  T.eq(data.get("q"), "hi");
  T.eq(data.get("action"), "save");
  T.eq(form.querySelectorAll("input[type=hidden]").length, 0, "temporary field removed");
  data = null;
  box.querySelector("ray-button").click();
  T.ok(data, "host.click() submits too");
  box.remove();
});

T.test("button: disabled, loading and fieldset block submit", async (T) => {
  const box = await mount(`<form><fieldset><ray-button type="submit">Go</ray-button></fieldset></form>`);
  const form = box.querySelector("form");
  const btn = box.querySelector("ray-button");
  let n = 0;
  form.addEventListener("submit", (e) => { e.preventDefault(); n++; });
  btn.loading = true;
  await T.settle();
  inner(btn, "button").click();
  T.eq(n, 0, "loading");
  T.eq(inner(btn, "button").getAttribute("aria-busy"), "", "aria-busy");
  btn.loading = false;
  box.querySelector("fieldset").disabled = true;
  await T.settle();
  T.eq(inner(btn, "button").disabled, true, "disabled by fieldset");
  box.querySelector("fieldset").disabled = false;
  await T.settle();
  inner(btn, "button").click();
  T.eq(n, 1, "enabled again");
  box.remove();
});

T.test("button: href renders a link; raw CSS color", async (T) => {
  const box = await mount(`<ray-button href="#x" color="#8e44ad">Go</ray-button>`);
  const a = inner(box.firstElementChild, ".button");
  T.eq(a.localName, "a");
  T.eq(a.getAttribute("href"), "#x");
  T.eq(getComputedStyle(a).backgroundColor, "rgb(142, 68, 173)");
  box.firstElementChild.disabled = true;
  await T.settle();
  T.eq(a.hasAttribute("href"), false, "disabled link has no href");
  box.remove();
});

T.test("icon-button: label names the button", async (T) => {
  const box = await mount(`<ray-icon-button label="Close"><svg></svg></ray-icon-button>`);
  T.eq(inner(box.firstElementChild, "button").getAttribute("aria-label"), "Close");
  box.remove();
});

T.test("input: label, description, error wiring", async (T) => {
  const box = await mount(`<ray-input label="Email" description="Help" error="Bad"></ray-input>`);
  const el = box.firstElementChild;
  T.eq(el.control.labels[0].querySelector(".label-text").textContent, "Email", "label for the inner input");
  T.eq(el.control.getAttribute("aria-describedby"), "description error");
  T.eq(el.control.getAttribute("aria-invalid"), "true");
  el.error = "";
  await T.settle();
  T.eq(el.control.getAttribute("aria-describedby"), "description");
  T.eq(el.control.hasAttribute("aria-invalid"), false);
  box.remove();
});

T.test("input: value, events, FormData, validity and reset", async (T) => {
  const box = await mount(`<form><ray-input name="email" type="email" value="a@b.c" required></ray-input></form>`);
  const form = box.querySelector("form");
  const el = form.querySelector("ray-input");
  T.eq(new FormData(form).get("email"), "a@b.c", "initial");
  const seen = [];
  el.addEventListener("input", () => seen.push("input:" + el.value));
  el.addEventListener("change", () => seen.push("change"));
  typeInto(el, "x@y.z");
  el.control.dispatchEvent(new Event("change", { bubbles: true }));
  T.eq(seen.join(" "), "input:x@y.z change");
  T.eq(new FormData(form).get("email"), "x@y.z");
  typeInto(el, "");
  T.eq(form.checkValidity(), false, "required + empty");
  T.eq(el.validity.valueMissing, true);
  typeInto(el, "not-an-email");
  T.eq(el.validity.typeMismatch, true, "type=email");
  form.reset();
  await T.settle();
  T.eq(el.value, "a@b.c", "reset restores the value attribute");
  T.eq(el.control.value, "a@b.c");
  T.eq(form.checkValidity(), true);
  el.value = "set@prop.erty";
  await T.settle();
  T.eq(el.control.value, "set@prop.erty", "property -> inner");
  box.remove();
});

T.test("input: placeholder and other attributes pass through", async (T) => {
  const box = await mount(`<ray-input placeholder="Find" maxlength="5" inputmode="search"></ray-input>`);
  const el = box.firstElementChild;
  T.eq(el.control.placeholder, "Find");
  T.eq(el.control.maxLength, 5);
  el.setAttribute("placeholder", "Other");
  T.eq(el.control.placeholder, "Other", "attribute change");
  box.remove();
});

T.test("textarea: initial text content and FormData", async (T) => {
  const box = await mount(`<form><ray-textarea name="notes">Hello</ray-textarea></form>`);
  const form = box.querySelector("form");
  const el = form.querySelector("ray-textarea");
  T.eq(el.value, "Hello");
  T.eq(new FormData(form).get("notes"), "Hello");
  typeInto(el, "Changed");
  T.eq(new FormData(form).get("notes"), "Changed");
  form.reset();
  await T.settle();
  T.eq(el.value, "Hello");
  box.remove();
});

T.test("select: child options, data, placeholder and required", async (T) => {
  const box = await mount(`<form><ray-select name="fw" placeholder="Pick" required><option value="a">A</option><option value="b">B</option></ray-select></form>`);
  const form = box.querySelector("form");
  const el = form.querySelector("ray-select");
  T.eq(el.options.length, 3, "placeholder + 2");
  T.eq(el.value, "");
  T.eq(form.checkValidity(), false, "required placeholder");
  const seen = [];
  el.addEventListener("change", () => seen.push(el.value));
  el.control.value = "b";
  el.control.dispatchEvent(new Event("change", { bubbles: true }));
  T.eq(seen.join(), "b");
  T.eq(new FormData(form).get("fw"), "b");
  T.eq(form.checkValidity(), true);
  el.append(new Option("C", "c"));
  await T.settle();
  T.eq(el.options.length, 4, "option added later");
  T.eq(el.value, "b", "keeps the value");
  el.data = ["x", { value: "y", label: "Why" }];
  await T.settle();
  T.eq([...el.options].map((o) => o.value).join(), ",x,y", "data replaces children");
  box.remove();
});

T.test("select: options set while disabled are enabled with it", async (T) => {
  const box = await mount(`<ray-select placeholder="Pick" disabled></ray-select>`);
  const el = box.querySelector("ray-select");
  el.data = ["a", "b", { value: "c", disabled: true }];
  el.disabled = false;
  await T.settle();
  const states = [...el.shadowRoot.querySelectorAll('[role="option"]')].map((o) => o.getAttribute("aria-disabled"));
  T.eq(states.join(), "false,false,true", "only the disabled option stays disabled (the placeholder is not listed)");
  box.remove();
});

T.test("select: own dropdown — mouse, keyboard, typeahead, groups, ARIA", async (T) => {
  const box = await mount(`<form><ray-select name="region" label="Region" value="eu">
    <optgroup label="Europe"><option value="eu">Frankfurt</option><option value="uk" disabled>London</option><option value="es">Madrid</option></optgroup>
    <optgroup label="America"><option value="us">Virginia</option></optgroup>
  </ray-select></form>`);
  const el = box.querySelector("ray-select");
  const sr = el.shadowRoot;
  const trigger = sr.querySelector('[part="trigger"]');
  const lb = sr.querySelector('[part="dropdown"]');
  const opts = () => [...sr.querySelectorAll('[role="option"]')];
  const press = (k, extra = {}) => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...extra }));
  T.eq(trigger.getAttribute("role"), "combobox");
  T.eq(trigger.getAttribute("aria-labelledby"), "label value", "named by the label and the value");
  T.eq(sr.querySelector(".value").textContent, "Frankfurt");
  T.eq(opts().length, 4, "one option per real option");
  T.eq(sr.querySelectorAll('[role="group"]').length, 2, "optgroups become groups");
  T.eq(opts()[1].getAttribute("aria-disabled"), "true");
  T.eq(opts()[0].getAttribute("aria-selected"), "true");
  // The option text is vertically centered with its check mark.
  el.toggle(true);
  await T.settle();
  const textBox = opts()[0].querySelector(".text").getBoundingClientRect();
  const optBox = opts()[0].getBoundingClientRect();
  T.ok(Math.abs((textBox.top + textBox.bottom) / 2 - (optBox.top + optBox.bottom) / 2) <= 1, "text centered in its option");
  el.toggle(false);
  await T.settle();
  const changes = [];
  el.addEventListener("change", () => changes.push(el.value));

  trigger.click();
  await T.settle();
  T.eq(lb.matches(":popover-open"), true, "click opens");
  T.eq(el.open, true);
  T.eq(trigger.getAttribute("aria-expanded"), "true");
  T.eq(trigger.getAttribute("aria-activedescendant"), opts()[0].id, "starts on the selected option");
  press("ArrowDown");
  T.eq(trigger.getAttribute("aria-activedescendant"), opts()[2].id, "skips the disabled option");
  press("Enter");
  await T.settle();
  T.eq(el.value, "es");
  T.eq(changes.join(), "es", "change fired once");
  T.eq(lb.matches(":popover-open"), false, "Enter closes");
  T.eq(new FormData(box.querySelector("form")).get("region"), "es");

  press("ArrowDown");
  await T.settle();
  T.eq(el.open, true, "ArrowDown opens");
  press("End");
  T.eq(trigger.getAttribute("aria-activedescendant"), opts()[3].id, "End");
  press("Escape");
  await T.settle();
  T.eq(el.open, false, "Escape closes");
  T.eq(el.value, "es", "Escape keeps the value");

  press("v");
  T.eq(el.value, "us", "typeahead while closed selects");
  el.toggle(true);
  await T.settle();
  opts()[0].click();
  await T.settle();
  T.eq(el.value, "eu", "clicking an option selects it");
  T.eq(el.open, false);
  el.disabled = true;
  await T.settle();
  trigger.click();
  await T.settle();
  T.eq(el.open, false, "disabled does not open");
  box.remove();
});

T.test("search: clear, Escape, debounced ray-search, Enter, shortcut", async (T) => {
  const box = await mount(`<form><ray-search name="q" aria-label="Search" shortcut="\`" debounce="30"></ray-search></form><input id="other">`);
  const el = box.querySelector("ray-search");
  const input = inner(el, "input");
  const clear = inner(el, '[part="clear"]');
  const hint = inner(el, '[part="shortcut"]');
  T.eq(input.type, "search");
  T.eq(input.placeholder, "Search…", "default placeholder");
  T.eq(el.variant, "filled", "filled by default");
  T.eq(getComputedStyle(inner(el, ".box")).backgroundColor, T.computed("background: var(--ray-muted)"), "with the filled look");
  T.eq(input.getAttribute("aria-label"), "Search");
  T.eq(clear.hidden, true, "no clear button while empty");
  T.eq(hint.hidden, false, "shortcut hint while empty");
  T.eq(hint.textContent, "\`");
  const seen = [];
  el.addEventListener("ray-search", (e) => seen.push(e.detail.value));
  input.value = "ra";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.value = "ray";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  T.eq(seen.length, 0, "debounced");
  await new Promise((r) => setTimeout(r, 80));
  T.eq(seen.join("|"), "ray", "one event after the pause");
  T.eq(el.value, "ray");
  T.eq(new FormData(box.querySelector("form")).get("q"), "ray");
  T.eq(clear.hidden, false, "clear button with text");
  T.eq(hint.hidden, true, "no hint with text");
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  T.eq(seen.join("|"), "ray|ray", "Enter fires at once");
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  T.eq(el.value, "", "Escape clears");
  T.eq(seen.at(-1), "", "clearing fires ray-search");
  await T.settle();
  T.eq(clear.hidden, true);
  // A one-key shortcut focuses it, but not while typing in another field.
  // (The page has another ray-search on "/": this one uses "\`".)
  const other = box.querySelector("#other");
  other.focus();
  other.dispatchEvent(new KeyboardEvent("keydown", { key: "\`", bubbles: true, cancelable: true }));
  T.eq(document.activeElement, other, "typing elsewhere keeps the focus");
  other.blur();
  // The hidden test window does not report focus inside shadow roots
  // reliably (see RAYLANG-FINDINGS #123): check that the input is focused.
  let focusedInput = false;
  const focus = input.focus;
  input.focus = function (...a) { focusedInput = true; return focus.apply(this, a); };
  const ev = new KeyboardEvent("keydown", { key: "\`", bubbles: true, cancelable: true });
  document.body.dispatchEvent(ev);
  input.focus = focus;
  T.eq(focusedInput, true, "the shortcut focuses the input");
  T.eq(ev.defaultPrevented, true, "and consumes the key");
  el.value = "x";
  await T.settle();
  clear.click();
  T.eq(el.value, "", "the clear button empties it");
  box.remove();
});

T.test("checkbox: toggle, FormData, required, indeterminate, reset", async (T) => {
  const box = await mount(`<form><ray-checkbox name="tos" value="yes" required label="Terms"></ray-checkbox></form>`);
  const form = box.querySelector("form");
  const el = form.querySelector("ray-checkbox");
  T.eq(new FormData(form).has("tos"), false);
  T.eq(form.checkValidity(), false, "required unchecked");
  let changes = 0;
  el.addEventListener("change", () => changes++);
  el.control.click();
  T.eq(el.checked, true);
  T.eq(changes, 1, "change forwarded");
  T.eq(new FormData(form).get("tos"), "yes");
  T.eq(form.checkValidity(), true);
  el.indeterminate = true;
  await T.settle();
  T.eq(el.control.getAttribute("aria-checked"), "mixed");
  el.control.click();
  T.eq(el.indeterminate, false, "user change clears indeterminate");
  form.reset();
  await T.settle();
  T.eq(el.checked, false, "reset to unchecked");
  box.remove();
});

T.test("checkbox: checked attribute is the default; label from content", async (T) => {
  const box = await mount(`<ray-checkbox checked>Remember me</ray-checkbox>`);
  const el = box.firstElementChild;
  T.eq(el.checked, true);
  T.eq(inner(el, ".label").hidden, false, "label shows slotted text");
  box.remove();
});

T.test("switch: role switch, toggles", async (T) => {
  const box = await mount(`<form><ray-switch name="wifi" label="Wi-Fi"></ray-switch></form>`);
  const el = box.querySelector("ray-switch");
  T.eq(el.control.getAttribute("role"), "switch");
  el.control.click();
  T.eq(el.checked, true);
  T.eq(new FormData(box.querySelector("form")).get("wifi"), "on");
  box.remove();
});

T.test("radio group: value, click, keyboard, roving tabindex, form", async (T) => {
  const box = await mount(`<form><ray-radio-group name="plan" value="b" label="Plan">
    <ray-radio value="a" label="A"></ray-radio>
    <ray-radio value="b" label="B"></ray-radio>
    <ray-radio value="c" label="C" disabled></ray-radio>
    <ray-radio value="d" label="D"></ray-radio>
  </ray-radio-group></form>`);
  const form = box.querySelector("form");
  const g = form.querySelector("ray-radio-group");
  const [a, b, c, d] = g.radios;
  T.eq(b.checked, true);
  T.eq([a, b, c, d].map((r) => r.tabIndex).join(), "-1,0,-1,-1", "roving tabindex");
  T.eq(new FormData(form).get("plan"), "b");
  T.eq(g.internals.role, "radiogroup");
  T.eq(b.internals.ariaChecked, "true");

  const changes = [];
  g.addEventListener("change", () => changes.push(g.value));
  a.click();
  await T.settle();
  T.eq(g.value, "a");
  T.eq(document.activeElement, a, "focus follows");
  a.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  await T.settle();
  T.eq(g.value, "d", "ArrowUp wraps to the last enabled");
  d.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  await T.settle();
  T.eq(g.value, "a", "ArrowDown wraps to the first");
  b.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  await T.settle();
  T.eq(g.value, "d", "skips the disabled radio");
  c.click();
  await T.settle();
  T.eq(g.value, "d", "disabled radio cannot be chosen");
  T.eq(changes.join(), "a,d,a,d");

  form.reset();
  await T.settle();
  T.eq(g.value, "b", "reset");
  box.remove();
});

T.test("radio group: required, checked attribute, disabled group", async (T) => {
  const box = await mount(`<form><ray-radio-group name="x" required><ray-radio value="1"></ray-radio><ray-radio value="2" checked></ray-radio></ray-radio-group></form>`);
  const g = box.querySelector("ray-radio-group");
  T.eq(g.value, "2", "radio with checked attribute");
  T.eq(box.querySelector("form").checkValidity(), true);
  const empty = await mount(`<form><ray-radio-group name="y" required><ray-radio value="1"></ray-radio></ray-radio-group></form>`);
  T.eq(empty.querySelector("form").checkValidity(), false, "required without a value");
  T.eq(empty.querySelector("ray-radio-group").validity.valueMissing, true);
  empty.remove();
  g.disabled = true;
  await T.settle();
  T.eq(g.radios.every((r) => r.tabIndex === -1 && r.internals.ariaDisabled === "true"), true);
  box.remove();
});

T.test("no transition into the initial state; transitions after it", async (T) => {
  // Styled before its first update (a layout read while loading), a badge
  // used to fade in from black text and a border. Until its first update
  // has painted, a component carries a sheet that turns transitions off.
  // (This window runs with zero durations, so the sheet is checked, not motion.)
  const settling = (el) => el.shadowRoot.adoptedStyleSheets.some((s) => [...s.cssRules].some((r) => /transition:\s*none/.test(r.cssText)));
  const box = await mount(`<ray-badge color="teal">New</ray-badge><ray-avatar name="Ada Lovelace" color="pink"></ray-avatar>`);
  const [badge, avatar] = box.children;
  // A hidden window paints no frames: there the sheet goes at once.
  if (document.visibilityState !== "hidden") {
    T.ok(settling(badge) && settling(avatar), "no transitions right after the first update");
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));
  } else {
    await T.settle();
  }
  T.ok(!settling(badge) && !settling(avatar), "transitions back once painted");
  box.remove();
});

T.test("avatar: initials and image fallback", async (T) => {
  T.eq(initials("Ada Lovelace"), "AL");
  T.eq(initials("ray"), "R");
  T.eq(initials("  "), "");
  const box = await mount(`<ray-avatar src="missing.png" name="Grace Hopper"></ray-avatar>`);
  const el = box.firstElementChild;
  await new Promise((r) => setTimeout(r, 300));
  await T.settle();
  T.eq(inner(el, "img").hidden, true, "broken image hidden");
  T.eq(inner(el, ".initials").textContent, "GH");
  T.eq(el.getAttribute("aria-label"), "Grace Hopper");
  box.remove();
});

T.test("separator, spinner, badge: roles and parts", async (T) => {
  const box = await mount(`<ray-separator orientation="vertical"></ray-separator><ray-spinner></ray-spinner><ray-badge variant="dot" color="green">On</ray-badge>`);
  const [sep, spin, badge] = box.children;
  T.eq(sep.getAttribute("role"), "separator");
  T.eq(sep.getAttribute("aria-orientation"), "vertical");
  T.eq(spin.getAttribute("role"), "status");
  T.eq(inner(spin, ".sr-only").textContent, "Loading");
  T.ok(getComputedStyle(inner(badge, ".dot")).display !== "none", "dot visible");
  box.remove();
});
