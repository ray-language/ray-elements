#!/usr/bin/env node
// ray-elements check [paths…]: checks the markup of an app against this
// version of @raylang/elements (its custom-elements.json and icon set).
//
//   npx @raylang/elements check src/
//   node node_modules/@raylang/elements/check/cli.js check index.html   (no npm: a raylang app)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { checkMarkup, customValues, RULES } from "./check.js";
import { iconNames, iconAliases } from "../core/icons.js";

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
  --icons a,b          icon names your app registers (setIcons({ … }) and setIcons(X), X an
                       object of the file or imported from a local module, are found by themselves)
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
  const icons = new Set([...iconNames(), ...Object.keys(iconAliases()), ...extraIcons]);
  const filledIcons = new Set(iconNames({ filled: true }));
  for (const f of scripts) {
    const src = readFileSync(f, "utf8");
    for (const name of registeredIcons(src, f)) {
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

// The keys of setIcons({ inbox: '<svg…>', "file-text": …, "star:filled": …, "ui.remove": … }) calls,
// and of setIcons(ICONS) where ICONS is an object literal of the same file
// (const ICONS = { … }) or one it imports from a local module
// (import { ICONS } from "./icons.js" → export const ICONS = { … }, or a
// default import → export default { … }).
function registeredIcons(src, file) {
  const out = [];
  for (const call of src.matchAll(/setIcons\(\s*\{([\s\S]*?)\}\s*\)/g)) out.push(...objectKeys(call[1]));
  for (const call of src.matchAll(/setIcons\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    const body = objectNamed(src, call[1], file, new Set());
    if (body !== null) out.push(...objectKeys(body));
  }
  return out;
}

function objectKeys(body) {
  const out = [];
  for (const key of body.matchAll(/(?:^|[,{\s])(?:(["'])([A-Za-z][\w.-]*(?::filled)?)\1|([A-Za-z][\w-]*))\s*:/g)) out.push(key[2] ?? key[3]);
  return out;
}

const id = (name) => name.replace(/[$]/g, "\\$&");

// The body of the object literal bound to `name` in `src` (a const/let/var,
// or an export of a local module it imports it from), or null.
function objectNamed(src, name, file, seen) {
  const local = src.match(new RegExp(`(?:^|[\\s;])(?:export\\s+)?(?:const|let|var)\\s+${id(name)}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*(?:;|\\n|$)`));
  if (local) return local[1];
  const named = src.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*(["'])(\\.[^"']*)\\2`, "g")) ?? [];
  for (const m of named) {
    const [, names, , from] = m.match(/import\s*\{([^}]*)\}\s*from\s*(["'])(\.[^"']*)\2/);
    const spec = names.split(",").map((s) => s.trim().split(/\s+as\s+/)).find((s) => (s[1] ?? s[0]) === name);
    if (spec) return exportedObject(file, from, spec[0], seen);
  }
  const def = src.match(new RegExp(`import\\s+${id(name)}\\s+from\\s*(["'])(\\.[^"']*)\\1`));
  if (def) return exportedObject(file, def[2], "default", seen);
  return null;
}

function exportedObject(file, from, name, seen) {
  let target;
  try {
    target = resolve(dirname(file), from);
    if (seen.has(target)) return null;
    seen.add(target);
    const src = readFileSync(target, "utf8");
    if (name === "default") return src.match(/export\s+default\s*\{([\s\S]*?)\}\s*(?:;|\n|$)/)?.[1] ?? null;
    return objectNamed(src, name, target, seen);
  } catch {
    return null;
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  console.error(`ray-elements: ${e.message}`);
  process.exitCode = 2;
}
