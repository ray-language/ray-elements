// The markup checker (@raylang/elements/check and `ray-elements check`),
// against the package's own manifest.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { checkMarkup, customValues } from "../../packages/elements/check/check.js";
import { iconNames } from "../../packages/elements/core/icons.js";

const pkg = new URL("../../packages/elements/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("custom-elements.json", pkg), "utf8"));
const icons = iconNames();
const rules = (src, file = "page.html", extra = {}) =>
  checkMarkup(src, { manifest, icons, file, ...extra }).map((d) => `${d.line}:${d.rule}`);

test("valid markup has no diagnostics", () => {
  const src = `<!doctype html>
<style>.box { padding: var(--ray-space-md); color: var(--ray-foreground); }</style>
<ray-app-shell>
  <ray-app-bar slot="header" label="Files"><ray-theme-toggle slot="end"></ray-theme-toggle></ray-app-bar>
  <ray-sidebar slot="navbar" label="Nav"><ray-nav-link label="Home" href="#" active><ray-icon slot="left" name="home"></ray-icon></ray-nav-link></ray-sidebar>
  <main>
    <form>
      <ray-input label="Name" name="name" required aria-describedby="x" data-id="1" onclick="f()"></ray-input>
      <ray-number-input label="Age" name="age" min="0"></ray-number-input>
      <ray-checkbox name="ok" label="OK" checked></ray-checkbox>
      <ray-radio-group name="plan"><ray-radio value="a" checked></ray-radio><ray-radio value="b"></ray-radio></ray-radio-group>
      <ray-button type="submit" variant="light" size="md"><ray-icon slot="left" name="plus"></ray-icon>Add</ray-button>
      <ray-icon-button label="Settings"><ray-icon name="settings"></ray-icon></ray-icon-button>
      <ray-menu-item value="x"><ray-icon slot="left" name="none"></ray-icon>X</ray-menu-item>
    </form>
  </main>
</ray-app-shell>
<script type="module">const ok = 1 < 2 && "<ray-bogus>";</script>`;
  assert.deepEqual(rules(src), []);
});

test("unknown elements, attributes, values and slots", () => {
  const src = [
    `<ray-buton></ray-buton>`,
    `<ray-button icon="x"></ray-button>`,
    `<ray-button variant="primary" size="medium"></ray-button>`,
    `<ray-button disabled="false"></ray-button>`,
    `<ray-button><ray-icon slot="start" name="plus"></ray-icon></ray-button>`,
    `<ray-icon name="trash"></ray-icon>`,
    `<ray-icon-button><ray-icon name="settings"></ray-icon></ray-icon-button>`,
    `<ray-table columns="a,b"></ray-table>`,
    `<div style="color: #333"></div>`,
    `<ray-icon-button label="Go" size="5.5rem"></ray-icon-button><ray-dialog size="calc(100% - 2rem)"></ray-dialog><ray-icon-button label="Go" size="huge"></ray-icon-button>`,
  ].join("\n");
  assert.deepEqual(rules(src), [
    "1:unknown-element",
    "2:unknown-attribute",
    "3:invalid-value",
    "3:invalid-value",
    "4:boolean-value",
    "5:unknown-slot",
    "6:unknown-icon",
    "7:missing-label",
    "8:property-only",
    "9:literal-color",
    "10:invalid-value",
  ]);
  const [typo] = checkMarkup(`<ray-buton></ray-buton>`, { manifest });
  assert.match(typo.message, /did you mean "ray-button"/);
  assert.equal(typo.severity, "error");
  assert.equal(checkMarkup(`<ray-icon name="trash"></ray-icon>`, { manifest, icons })[0].severity, "warning");
});

test("Vue: wrappers, bindings, events and named slots", () => {
  const src = `<template>
  <RayInput v-model="name" label="Name" :size="s" required @input="x" />
  <RayTable :columns="cols" :data="rows" clickable-rows @ray-row-click="open" />
  <RayMenu @ray-select="run"><RayButton slot="trigger">A</RayButton></RayMenu>
  <RayButton fullWidth>B</RayButton>
  <RayInput @ray-chnage="x" />
  <RayCard><template #header><h3>T</h3></template></RayCard>
  <RayBogus />
</template>
<script setup>const a = 1 < 2;</script>`;
  assert.deepEqual(rules(src, "App.vue"), ["6:unknown-event", "7:unknown-slot", "8:unknown-element"]);
});

test("JSX: wrappers, React props and generics", () => {
  const src = `export function App() {
  const ref = useRef<RayDialog>(null);
  const big = n < 3;
  return (
    <div className="x">
      Press <ray-kbd>K</ray-kbd>
      <RayButton variant="filled" fullWidth onClick={() => go(n > 1)} size={big ? "md" : "sm"}>Go</RayButton>
      <RayDialog ref={ref} label="D" onRayClose={(e) => e.detail.returnValue}><RayButton slot="footer">OK</RayButton></RayDialog>
      <RayButton onRaySelct={f} />
      <ray-badge colr="red" />
    </div>
  );
}`;
  assert.deepEqual(rules(src, "App.tsx"), ["9:unknown-event", "10:unknown-attribute"]);
});

test("an app's own variants and icons", () => {
  assert.deepEqual(customValues(`RayButton.extendStyles(css\`[data-variant="brand"] { }\`); ray-badge[size="huge"]{}`), { variant: ["brand"], size: ["huge"] });
  assert.deepEqual(rules(`<ray-button variant="brand"></ray-button>`, "a.html", { allow: { variant: ["brand"] } }), []);
  assert.deepEqual(rules(`<ray-icon name="inbox"></ray-icon>`, "a.html", { icons: [...icons, "inbox"] }), []);
});

test("the command: files, setIcons, JSON and the exit status", () => {
  const dir = mkdtempSync(join(tmpdir(), "ray-elements-check-"));
  try {
    writeFileSync(join(dir, "index.html"), `<ray-icon name="inbox"></ray-icon>\n<ray-button variant="brand"></ray-button>\n`);
    writeFileSync(join(dir, "main.js"), `setIcons({ inbox: '<svg viewBox="0 0 24 24"></svg>' });\nRayButton.extendStyles(css\`[data-variant="brand"] {}\`);\n`);
    const cli = new URL("check/cli.js", pkg).pathname;
    const ok = spawnSync(process.execPath, [cli, "check", dir], { encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /1 file checked: 0 errors, 0 warnings/);
    writeFileSync(join(dir, "bad.html"), `<ray-button size="huge"></ray-button>\n`);
    const bad = spawnSync(process.execPath, [cli, "check", dir, "--format", "json"], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    const out = JSON.parse(bad.stdout);
    assert.equal(out.errors, 1);
    assert.equal(out.diagnostics[0].rule, "invalid-value");
    const ignored = spawnSync(process.execPath, [cli, "check", dir, "--ignore", "invalid-value"], { encoding: "utf8" });
    assert.equal(ignored.status, 0);
    assert.equal(spawnSync(process.execPath, [cli, "check", "--ignore", "nope"], { encoding: "utf8" }).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
