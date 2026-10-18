#!/usr/bin/env node
// ray-elements check [paths…]: checks the markup of an app against this
// version of @raylang/elements (its custom-elements.json and icon set).
//
//   npx @raylang/elements check src/
//   node node_modules/@raylang/elements/check/cli.js check index.html   (no npm: a raylang app)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { checkMarkup, customValues, RULES } from "./check.js";
import { iconNames } from "../core/icons.js";

const EXTENSIONS = new Set(["html", "htm", "vue", "svelte", "astro", "jsx", "tsx"]);
// Read for what an app adds: setIcons({ … }) and its own variants in CSS.
const SCRIPTS = new Set(["js", "mjs", "ts", "mts", "jsx", "tsx", "vue", "svelte", "astro", "html", "htm", "css", "scss", "less"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", "target", ".next", ".nuxt", ".svelte-kit"]);

const USAGE = `Usage: ray-elements check [paths…] [options]

Checks the <ray-*> markup (and the Ray* wrappers) of HTML, Vue, Svelte, Astro,
JSX and TSX files against @raylang/elements ${version()}. A directory is walked
(not node_modules, dist…); without paths, the current directory.

Options:
  --format json        the diagnostics as JSON
  --icons a,b          icon names your app registers (setIcons calls are found by themselves)
  --allow attr=v,…     more values of an attribute: your own variant=brand (selectors such as
                       [variant="brand"] in your CSS and extendStyles are found by themselves)
  --manifest FILE      another custom-elements.json (your own components)
  --ignore RULE,…      rules to skip
  --rules              list the rules

Exit status: 1 when there is an error, 0 otherwise (warnings included).`;

function version() {
  try {
    return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
  } catch {
    return "";
  }
}

function main(argv) {
  const [command, ...rest] = argv;
  if (command === undefined || command === "--help" || command === "-h" || command === "help") {
    console.log(USAGE);
    return command === undefined ? 2 : 0;
  }
  if (command !== "check") {
    console.error(`ray-elements: unknown command "${command}"\n\n${USAGE}`);
    return 2;
  }
  const paths = [];
  const manifests = [JSON.parse(readFileSync(new URL("../custom-elements.json", import.meta.url), "utf8"))];
  const extraIcons = [];
  const ignore = new Set();
  const allow = {};
  const allowValue = (attr, v) => (allow[attr] ??= []).push(v);
  let format = "text";
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      if (i + 1 >= rest.length) throw new Error(`${arg} needs a value`);
      return rest[++i];
    };
    if (arg === "--format") format = value();
    else if (arg === "--icons") extraIcons.push(...value().split(",").map((s) => s.trim()).filter(Boolean));
    else if (arg === "--allow") {
      for (const pair of value().split(",")) {
        const [attr, v] = pair.split("=").map((s) => s.trim());
        if (!attr || v === undefined) throw new Error(`--allow takes attr=value (variant=brand)`);
        allowValue(attr, v);
      }
    } else if (arg === "--manifest") manifests.push(JSON.parse(readFileSync(value(), "utf8")));
    else if (arg === "--ignore") value().split(",").forEach((r) => ignore.add(r.trim()));
    else if (arg === "--rules") {
      for (const [rule, what] of Object.entries(RULES)) console.log(`${rule.padEnd(18)} ${what}`);
      return 0;
    } else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      return 0;
    } else if (arg.startsWith("--")) throw new Error(`unknown option ${arg}`);
    else paths.push(arg);
  }
  if (format !== "text" && format !== "json") throw new Error(`--format is "text" or "json"`);
  for (const r of ignore) if (!(r in RULES)) throw new Error(`unknown rule "${r}" (see --rules)`);

  const files = [];
  const scripts = [];
  for (const p of paths.length > 0 ? paths : ["."]) collect(p, files, scripts, true);
  const icons = new Set([...iconNames(), ...extraIcons]);
  const filledIcons = new Set(iconNames({ filled: true }));
  for (const f of scripts) {
    const src = readFileSync(f, "utf8");
    for (const name of registeredIcons(src)) {
      if (name.endsWith(":filled")) filledIcons.add(name.slice(0, -":filled".length));
      else icons.add(name);
    }
    for (const [attr, values] of Object.entries(customValues(src))) values.forEach((v) => allowValue(attr, v));
  }

  const diagnostics = [];
  for (const f of files) {
    const source = readFileSync(f, "utf8");
    const file = relative(process.cwd(), f) || f;
    for (const d of checkMarkup(source, { manifest: manifests, icons: [...icons], filledIcons: [...filledIcons], allow, file })) {
      if (!ignore.has(d.rule)) diagnostics.push(d);
    }
  }
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  if (format === "json") {
    console.log(JSON.stringify({ files: files.length, errors, warnings: diagnostics.length - errors, diagnostics }, null, 2));
  } else {
    for (const d of diagnostics) console.log(`${d.file}:${d.line}:${d.column}: ${d.severity}: ${d.message} [${d.rule}]`);
    const warnings = diagnostics.length - errors;
    console.log(`${files.length} file${files.length === 1 ? "" : "s"} checked: ${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}`);
  }
  return errors > 0 ? 1 : 0;
}

function collect(path, files, scripts, explicit) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path).sort()) {
      if (SKIP.has(name) || name.startsWith(".")) continue;
      collect(join(path, name), files, scripts, false);
    }
    return;
  }
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  if (explicit || EXTENSIONS.has(ext)) files.push(path);
  if (SCRIPTS.has(ext)) scripts.push(path);
}

// The keys of setIcons({ inbox: '<svg…>', "file-text": …, "star:filled": … }) calls.
function registeredIcons(src) {
  const out = [];
  for (const call of src.matchAll(/setIcons\(\s*\{([\s\S]*?)\}\s*\)/g)) {
    for (const key of call[1].matchAll(/(?:^|[,{\s])(?:(["'])([A-Za-z][\w-]*(?::filled)?)\1|([A-Za-z][\w-]*))\s*:/g)) out.push(key[2] ?? key[3]);
  }
  return out;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  console.error(`ray-elements: ${e.message}`);
  process.exitCode = 2;
}
