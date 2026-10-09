// Bundles small uses of the generated packages (packages/*) with esbuild and
// checks that each takes only what it uses: the elements it should define
// and none other, within a size budget (minified + gzip).
//
//   npm --prefix tests/bundle ci && npm --prefix tests/bundle run check
//
// The packages resolve as installed ones (through their package.json
// "exports" and "sideEffects"), from a temporary node_modules that links to
// packages/. react and vue stay external: only ray-ds's code is measured.

import * as esbuild from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// name, source, the tags it must define, budget in KB (gzip).
const CASES = [
  ["elements: button + icon", `import "@ray-ds/elements/button"; import "@ray-ds/elements/icon";`, ["ray-button", "ray-icon"], 12],
  ["elements: icon-button", `import "@ray-ds/elements/icon-button";`, ["ray-icon-button", "ray-button"], 12],
  ["elements: core (setIcons)", `import { setIcons } from "@ray-ds/elements/core"; setIcons({});`, [], 10],
  ["react: RayButton", `import { RayButton } from "@ray-ds/react"; console.log(RayButton);`, ["ray-button"], 13],
  ["vue: RaySwitch", `import { RaySwitch } from "@ray-ds/vue"; console.log(RaySwitch);`, ["ray-switch", "ray-checkbox"], 13], // a switch is a checkbox
  // The whole set, to show the difference (no budget: it is everything).
  ["elements: everything", `import "@ray-ds/elements";`, null, Infinity],
];

const allTags = [...fs.readFileSync(path.join(root, "packages/elements/index.js"), "utf8").matchAll(/from "\.\/components\/([^/]+)\//g)].map((m) => m[1]);
const defines = (code) => new Set([...code.matchAll(/["'](ray-[a-z-]+)["']/g)].map((m) => m[1]));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ray-ds-bundle-"));
let failed = 0;
try {
  const scope = path.join(tmp, "node_modules/@ray-ds");
  fs.mkdirSync(scope, { recursive: true });
  for (const p of ["elements", "react", "vue"]) fs.symlinkSync(path.join(root, "packages", p), path.join(scope, p), "dir");

  for (const [name, source, tags, budget] of CASES) {
    const entry = path.join(tmp, "entry.js");
    fs.writeFileSync(entry, source);
    const out = await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: "esm",
      write: false,
      external: ["react", "vue"],
      // As installed: @ray-ds/react finds @ray-ds/elements next to it.
      preserveSymlinks: true,
      logLevel: "silent",
    });
    const code = out.outputFiles[0].text;
    const kb = zlib.gzipSync(code).length / 1024;
    const problems = [];
    if (kb > budget) problems.push(`${kb.toFixed(1)} KB gzip, over the budget of ${budget} KB`);
    if (tags) {
      const found = defines(code);
      for (const t of tags) if (!found.has(t)) problems.push(`does not define <${t}>`);
      // A component directory whose tag is in the bundle but was not asked for.
      const extra = allTags.filter((dir) => found.has(`ray-${dir}`) && !tags.includes(`ray-${dir}`));
      if (extra.length) problems.push(`also takes ${extra.map((d) => `<ray-${d}>`).join(", ")}`);
    }
    console.log(`${problems.length ? "FAIL" : "ok  "} ${name}: ${(code.length / 1024).toFixed(1)} KB min, ${kb.toFixed(1)} KB gzip`);
    for (const p of problems) console.log(`       ${p}`);
    failed += problems.length ? 1 : 0;
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
