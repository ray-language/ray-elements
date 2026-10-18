// page: docs/components/all.html
//
// System-wide features: the icon registry, theming (definePrimary, component
// defaults) and the variants.

const T = window.__rayTest;
const core = await import("../../src/core/core.js");
await Promise.all(["ray-icon", "ray-dialog", "ray-select", "ray-checkbox", "ray-button", "ray-search", "ray-attachment"].map((t) => customElements.whenDefined(t)));

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const inner = (host, sel) => host.shadowRoot.querySelector(sel);

// --- icons --------------------------------------------------------------------

T.test("icons: default set, ray-icon, accessibility", async (T) => {
  for (const name of ["close", "check", "minus", "chevron-down", "search", "sun", "moon", "monitor", "user", "info"]) {
    T.ok(core.getIcon(name).startsWith("<svg"), `default icon ${name}`);
  }
  const box = await mount(`<ray-icon name="info" label="Information"></ray-icon><ray-icon name="search"></ray-icon>`);
  const [named, deco] = box.children;
  T.ok(inner(named, ".icon svg"), "drawn from the registry");
  T.eq(named.internals.role, "img");
  T.eq(named.internals.ariaLabel, "Information");
  T.eq(deco.internals.ariaHidden, "true", "decorative without a label");
  named.name = "check";
  await T.settle();
  T.eq(inner(named, ".icon path").getAttribute("d"), "M5 12.5l4.5 4.5L19 7.5", "name change repaints");
  box.remove();
});

T.test("icons: setIcons repaints live components and adds names", async (T) => {
  const saved = { close: core.getIcon("close"), "chevron-down": core.getIcon("chevron-down"), check: core.getIcon("check") };
  const box = await mount(`<ray-dialog label="X"></ray-dialog><ray-select><option>a</option></ray-select><ray-checkbox checked label="c"></ray-checkbox><ray-icon name="brand-logo"></ray-icon>`);
  const [dialog, select, checkbox, logo] = box.children;
  const mark = (id) => `<svg data-test="${id}" viewBox="0 0 24 24" fill="currentColor"><rect width="24" height="24"/></svg>`;
  core.setIcons({ "close": mark("close"), "chevron-down": mark("chevron"), "check": mark("check"), "brand-logo": mark("logo") });
  T.ok(inner(dialog, '.close [data-test="close"]'), "dialog close icon replaced");
  T.ok(inner(select, '.chevron [data-test="chevron"]'), "select chevron replaced");
  T.ok(inner(checkbox, '.check [data-test="check"]'), "checkbox check replaced");
  T.ok(inner(logo, '[data-test="logo"]'), "a new name, available to ray-icon");
  T.ok(core.iconNames().includes("brand-logo"));
  const fill = getComputedStyle(inner(checkbox, '.check svg')).fill;
  T.ok(fill !== "none", `a filled icon keeps its fill (${fill})`);
  core.setIcons(saved);
  T.ok(!inner(dialog, '[data-test]'), "restored");
  box.remove();
});

T.test("icons: filled versions, ray-icon filled, the outline as fallback", async (T) => {
  const filledNames = core.iconNames({ filled: true });
  for (const name of ["star", "bell", "home", "user", "circle-check", "info"]) T.ok(filledNames.includes(name), `${name} has a filled version`);
  T.ok(!core.iconNames().some((n) => n.includes(":")), "iconNames() lists the base names");
  T.ok(core.getIcon("star", { filled: true }) !== core.getIcon("star"), "a different drawing");
  T.eq(core.getIcon("search", { filled: true }), core.getIcon("search"), "none: the outline one");
  const box = await mount(`<ray-icon name="star"></ray-icon><ray-icon name="search" filled></ray-icon>`);
  const [star, search] = box.children;
  const fill = (el) => inner(el, ".icon svg").getAttribute("fill");
  T.eq(fill(star), "none", "outline at rest");
  star.filled = true;
  await T.settle();
  T.eq(fill(star), "currentColor", "filled repaints");
  T.ok(star.hasAttribute("filled"), "reflected");
  T.eq(fill(search), "none", "no filled version: the outline");
  core.setIcons({ "search:filled": `<svg data-test="solid-search" viewBox="0 0 24 24"><rect width="24" height="24"/></svg>` });
  T.ok(inner(search, '[data-test="solid-search"]'), "setIcons adds a filled version, live");
  T.ok(core.iconNames({ filled: true }).includes("search"));
  star.filled = false;
  await T.settle();
  T.eq(fill(star), "none", "back to the outline");
  box.remove();
});

T.test("icons: roles draw their glyph; a registered role wins, only for it", async (T) => {
  await Promise.all(["ray-search", "ray-attachment"].map((t) => customElements.whenDefined(t)));
  const aliases = core.iconAliases();
  T.eq(aliases["ui.close"], "close");
  T.eq(aliases["ui.remove"], "close");
  T.eq(core.getIcon("ui.close"), core.getIcon("close"), "a role draws its glyph");
  T.ok(!core.iconNames().includes("ui.close"), "roles are not glyph names");
  const box = await mount(`<ray-dialog label="X"></ray-dialog><ray-search value="q"></ray-search><ray-attachment name="a.txt" removable></ray-attachment>`);
  const [dialog, search, attachment] = box.children;
  const drawn = (el, sel) => inner(el, `${sel} svg`)?.getAttribute("data-test") ?? "default";
  const saved = core.getIcon("close");
  const mark = (id) => `<svg data-test="${id}" viewBox="0 0 24 24"><rect width="24" height="24"/></svg>`;
  core.setIcons({ "ui.remove": mark("remove") });
  T.eq(drawn(attachment, ".remove"), "remove", "the role registered: the attachment's ×");
  T.eq(drawn(dialog, ".close"), "default", "the dialog's × keeps the glyph");
  T.eq(drawn(search, ".clear"), "default", "and the field's");
  core.setIcons({ close: mark("glyph") });
  T.eq(drawn(dialog, ".close"), "glyph", "a glyph registered: every role that uses it");
  T.eq(drawn(search, ".clear"), "glyph");
  T.eq(drawn(attachment, ".remove"), "remove", "except a role registered itself");
  core.setIcons({ close: saved, "ui.remove": saved });
  T.ok(core.getIcon("ui.close", { filled: true }).startsWith("<svg"), "filled on a role: its glyph's version or outline");
  box.remove();
});

T.test("icons: right to left, the roles that point along the text mirror", async (T) => {
  await Promise.all(["ray-pagination", "ray-carousel", "ray-nav-link"].map((t) => customElements.whenDefined(t)));
  const box = await mount(`
    <div dir="rtl">
      <ray-icon name="ui.next"></ray-icon><ray-icon name="arrow-left" mirror></ray-icon><ray-icon name="arrow-left"></ray-icon>
      <ray-pagination total="5" value="2"></ray-pagination>
      <ray-carousel><div>1</div><div>2</div></ray-carousel>
      <ray-nav-link label="Parent" opened><ray-nav-link label="Child" href="#"></ray-nav-link></ray-nav-link>
    </div>
    <div dir="ltr"><ray-icon name="ui.next"></ray-icon><ray-icon name="arrow-left" mirror></ray-icon></div>`);
  await T.settle();
  const [rtl, ltr] = box.children;
  const MIRRORED = "matrix(-1, 0, 0, 1, 0, 0)";
  const transform = (el) => (el ? getComputedStyle(el).transform : "missing");
  const [role, asked, plain] = rtl.querySelectorAll("ray-icon");
  T.eq(transform(inner(role, ".icon svg")), MIRRORED, "a role with a direction");
  T.eq(transform(inner(asked, ".icon svg")), MIRRORED, "ray-icon mirror");
  T.eq(transform(inner(plain, ".icon svg")), "none", "a plain glyph keeps its drawing");
  for (const icon of ltr.querySelectorAll("ray-icon")) T.eq(transform(inner(icon, ".icon svg")), "none", `left to right: ${icon.name}`);
  role.name = "star";
  await T.settle();
  T.eq(transform(inner(role, ".icon svg")), "none", "renamed to a glyph without a direction");
  const pagination = rtl.querySelector("ray-pagination");
  T.eq(transform(pagination.shadowRoot.querySelector('[data-ray-icon="ui.next"] svg')), MIRRORED, "pagination's next arrow");
  const carousel = rtl.querySelector("ray-carousel");
  T.eq(transform(carousel.shadowRoot.querySelector('[data-ray-icon="ui.next"] svg')), MIRRORED, "the carousel's next arrow");
  const chevron = inner(rtl.querySelector("ray-nav-link"), ".chevron");
  const [a, b] = new DOMMatrix(transform(chevron)).toFloat32Array();
  T.ok(Math.abs(a) < 1e-6 && b < 0, `an open nav-link turns its mirrored chevron the other way (${transform(chevron)})`);
  T.eq(transform(chevron.querySelector("svg")), MIRRORED, "its chevron is mirrored");
  box.remove();
});

T.test("icons: invalid input and unknown names", (T) => {
  let threw = false;
  try { core.setIcons({ bad: "<div>not svg</div>" }); } catch (e) { threw = e instanceof TypeError; }
  T.eq(threw, true, "non-SVG markup is rejected");
  T.eq(core.getIcon("does-not-exist"), "", "unknown name: empty");
});

// --- variants -----------------------------------------------------------------

T.test("variants: gradient from tokens and from the gradient attribute", async (T) => {
  await Promise.all(["ray-badge", "ray-alert", "ray-card", "ray-radio-group"].map((t) => customElements.whenDefined(t)));
  const box = await mount(`<ray-button variant="gradient">A</ray-button><ray-button variant="gradient" gradient="teal #123456 90">B</ray-button><ray-badge variant="gradient">C</ray-badge>`);
  const [a, b, c] = box.children;
  const bg = (el) => getComputedStyle(inner(el, "[data-variant]")).backgroundImage;
  T.ok(bg(a).startsWith("linear-gradient"), `tokens gradient (${bg(a)})`);
  T.ok(bg(b).includes("90deg") && bg(b).includes("rgb(18, 52, 86)"), `attribute gradient (${bg(b)})`);
  T.ok(bg(c).startsWith("linear-gradient"), "badge too");
  T.eq(getComputedStyle(inner(a, "[data-variant]")).color, "rgb(255, 255, 255)", "white text");
  box.remove();
});

T.test("variants: checkbox and radio outline, card variants", async (T) => {
  const box = await mount(`<ray-checkbox variant="outline" checked></ray-checkbox>
    <ray-radio-group variant="outline" value="a"><ray-radio value="a">A</ray-radio><ray-radio value="b" variant="filled">B</ray-radio></ray-radio-group>
    <ray-card variant="filled">x</ray-card><ray-card variant="outline">y</ray-card>`);
  const cb = box.querySelector("ray-checkbox");
  const bgOf = (el) => getComputedStyle(el).backgroundColor;
  T.eq(bgOf(inner(cb, ".indicator")), T.computed("background: var(--ray-background)"), "outline checkbox: background fill");
  const [ra, rb] = box.querySelectorAll("ray-radio");
  T.eq(ra.hasAttribute("data-outline"), true, "group variant reaches the radios");
  T.eq(rb.hasAttribute("data-outline"), false, "a radio's own variant wins");
  const [filled, outline] = box.querySelectorAll("ray-card");
  T.eq(bgOf(inner(filled, ".card")), T.computed("background: var(--ray-muted)"), "filled card");
  T.eq(bgOf(inner(outline, ".card")), "rgba(0, 0, 0, 0)", "outline card: no fill");
  T.eq(getComputedStyle(inner(outline, ".card")).borderTopColor, T.computed("color: var(--ray-border)", "color"), "outline card: border");
  box.remove();
});

T.test("alert: role, icon by color, closable", async (T) => {
  const box = await mount(`<ray-alert label="Saved" color="green" closable>Done.</ray-alert><ray-alert color="red" icon="none">x</ray-alert>`);
  const [ok, plain] = box.children;
  T.eq(ok.internals.role, "alert");
  T.eq(ok.internals.ariaLabel, "Saved");
  T.eq(inner(ok, ".default-icon").getAttribute("data-ray-icon"), "circle-check", "icon follows the color");
  T.eq(inner(plain, ".icon").hidden, true, "icon=none");
  const veto = (e) => e.preventDefault();
  ok.addEventListener("ray-close", veto);
  inner(ok, ".close").click();
  T.eq(ok.hidden, false, "canceled ray-close keeps it");
  ok.removeEventListener("ray-close", veto);
  inner(ok, ".close").click();
  T.eq(ok.hidden, true, "closed");
  T.eq(inner(ok, ".close").getAttribute("aria-label"), "Dismiss");
  box.remove();
});

// --- theming: definePrimary ---------------------------------------------------

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

T.test("definePrimary: shades, primary and text color on the document", async (T) => {
  const r = core.definePrimary("#7c3aed", { persist: false });
  T.eq(r.shades.length, 10);
  T.ok(r.shades.every((s) => /^#[0-9a-f]{6}$/.test(s)), "hex shades");
  T.ok(r.shades.includes("#7c3aed"), "the base color is one of them");
  T.eq(document.documentElement.dataset.primary, "custom");
  T.eq(r.contrast, "white");
  T.eq(r.aa, true, `AA (${r.ratio.toFixed(2)}:1)`);
  T.eq(r.filled, "#7c3aed", "AA with white text: fills with the color itself");
  T.eq(T.computed("background: var(--ray-primary)"), hexToRgb("#7c3aed"), "primary = the picked color");
  T.eq(T.computed("color: var(--ray-primary-foreground)", "color"), "rgb(255, 255, 255)");
  T.eq(T.computed("background: var(--ray-primary)", "background-color", 'data-theme="dark"'), hexToRgb("#7c3aed"), "dark scheme too");
  // Lightness decreases from shade 0 to 9.
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
  T.ok(r.shades.every((s, i) => i === 0 || lum(s) <= lum(r.shades[i - 1]) + 1), "monotonic lightness");
  // White fails on this orange (3.6:1) and it is not bright: the closest darker shade that reaches AA.
  const { contrastRatio } = await import("../../src/core/color.js");
  const o = core.definePrimary("#e8590c", { persist: false });
  const i = o.shades.indexOf(o.filled);
  T.ok(i > o.shades.indexOf("#e8590c"), "a darker shade");
  T.ok(contrastRatio(o.filled, "#ffffff") >= 4.5, `AA with white (${o.ratio.toFixed(2)}:1)`);
  T.ok(contrastRatio(o.shades[i - 1], "#ffffff") < 4.5, "the closest one that passes");
  core.setPrimary(null, { persist: false });
  T.eq(T.computed("background: var(--ray-primary)"), "rgb(25, 113, 194)", "back to blue");
});

T.test("definePrimary: light colors get black text; subtrees; invalid input", async (T) => {
  const y = core.definePrimary("#facc15", { persist: false });
  T.eq(core.getCustomPrimary(), "#facc15", "getCustomPrimary: the color given");
  T.eq(y.contrast, "black", "black text on yellow");
  T.eq(y.filled, "#facc15", "a bright color fills with itself");
  T.eq(T.computed("background: var(--ray-primary)"), hexToRgb("#facc15"));
  T.eq(T.computed("color: var(--ray-primary-foreground)", "color"), "rgb(0, 0, 0)");
  core.setPrimary(null, { persist: false });
  // Buttons rendered after the color is set: in a hidden window a running
  // background transition would not advance past its first frame.
  const box = await mount(`<div id="brand-zone"></div>`);
  const zone = box.querySelector("#brand-zone");
  const z = core.definePrimary("rgb(225, 29, 72)", { el: zone });
  zone.innerHTML = `<ray-button>In</ray-button>`;
  box.insertAdjacentHTML("beforeend", `<ray-button>Out</ray-button>`);
  await T.settle();
  const [inBtn, outBtn] = box.querySelectorAll("ray-button");
  T.eq(getComputedStyle(inner(inBtn, '[part="button"]')).backgroundColor, hexToRgb(z.filled), "inside the subtree");
  T.eq(getComputedStyle(inner(outBtn, '[part="button"]')).backgroundColor, "rgb(25, 113, 194)", "outside unchanged");
  T.eq(document.documentElement.dataset.primary, undefined, "the document is untouched");
  let threw = false;
  try { core.definePrimary("not-a-color"); } catch (e) { threw = e instanceof TypeError; }
  T.eq(threw, true, "invalid color");
  const warned = [];
  const orig = console.warn;
  console.warn = (m) => warned.push(String(m));
  try { core.definePrimary("#999999", { el: zone }); } finally { console.warn = orig; }
  T.ok(warned.some((m) => m.includes("below WCAG AA")) || core.definePrimary("#999999", { el: zone }).aa, "warns below AA");
  box.remove();
});

// --- charts: palette and chartTheme ---------------------------------------------

T.test("chartTheme: resolved colors per theme, withAlpha, change events", async (T) => {
  const charts = await import("../../src/core/charts.js");
  core.setTheme("light", { persist: false });
  const light = charts.chartTheme();
  T.eq(light.series.length, charts.CHART_SERIES);
  T.ok(light.series.every((c) => /^#[0-9a-f]{6}$/.test(c)), "concrete hex colors (color-mix resolved)");
  T.eq(new Set(light.series).size, light.series.length, "all different");
  T.eq(light.scheme, "light");
  T.eq(light.background, "#ffffff");
  T.ok(light.font.size > 0 && light.font.family.length > 0, "font");
  const box = await mount(`<div data-theme="dark"><span>x</span></div>`);
  const dark = charts.chartTheme(box.firstElementChild);
  T.eq(dark.scheme, "dark", "a dark subtree");
  T.ok(dark.series[0] !== light.series[0], "dark series differ");
  T.eq(charts.withAlpha("#1c7ed6", 0.2), "rgba(28, 126, 214, 0.2)");
  let got = null;
  const stop = charts.onChartThemeChange((t) => { got = t; });
  core.setTheme("dark", { persist: false });
  await T.settle();
  T.eq(got?.scheme, "dark", "redraw callback with the new theme");
  T.eq(got.series[0], dark.series[0]);
  stop();
  core.setTheme("system", { persist: false });
  box.remove();
});
