// <ray-code>: a block of source code — a scroll box with an optional header
// (file name, language), a copy button, line numbers, highlighted lines,
// diff lines, wrapping and a "show more" height.
//
// The code comes from the `code` property, a <script type="text/plain">
// child (raw text: anything but "</script>"), a <template> child (parsed as
// HTML, so best for markup: a "<" that is not a tag, as in Promise<void>,
// breaks it), or the element's text; common indentation and blank edges are
// removed.
//
// The language is `language`, not `lang`: lang is HTML's attribute for the
// human language of the text (a screen reader would switch its voice).
//
// Highlighting is pluggable. The built-in highlighter is small and generic
// (comments, strings, numbers, keywords, types, functions, tags, attributes,
// punctuation for js/ts, json, html/xml, css, shell, ray and diff) and
// builds text nodes only. setHighlighter(fn) hands every block to a library
// instead (Prism, highlight.js, Shiki…): its HTML is inserted as is, and its
// classes are painted with the --ray-code-* tokens, so the palette stays
// ray-ds's.

import { RayElement, css, define } from "../../core/core.js";

// --- the built-in highlighter -------------------------------------------------

const JS_KEYWORDS = "as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of private protected public readonly return set static super switch this throw true try type typeof undefined var void while with yield";
const RAY_KEYWORDS = "as break const continue else enum false fn for from if impl import in let match pub return self spawn struct test trait true type var while";
const SH_KEYWORDS = "case do done elif else esac export fi for function if in local return then until while";
const words = (list) => new Set(list.split(" "));

/** Token rules per language: [type, sticky regex]; identifiers are classified after. */
const IDENT = /[A-Za-z_$][\w$]*/y;
const LANGS = {
  js: {
    keywords: words(JS_KEYWORDS),
    rules: [
      ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ["string", /`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
      ["number", /\b(?:0[xob][\da-f_]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?)\b/iy],
      ["punctuation", /=>|[{}()[\];,.:?!<>=+\-*/%&|^~@]+/y],
    ],
  },
  ray: {
    keywords: words(RAY_KEYWORDS),
    rules: [
      ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ["string", /`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
      ["attr", /@\w+/y],
      ["number", /\b(?:0[xob][\da-f_]+|\d[\d_]*(?:\.\d+)?)\b/iy],
      ["punctuation", /=>|->|\|>|[{}()[\];,.:?!<>=+\-*/%&|^~]+/y],
    ],
  },
  json: {
    keywords: words("true false null"),
    rules: [
      ["attr", /"(?:\\.|[^"\\\n])*"(?=\s*:)/y],
      ["string", /"(?:\\.|[^"\\\n])*"/y],
      ["number", /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/iy],
      ["punctuation", /[{}[\],:]/y],
    ],
  },
  css: {
    keywords: words("important inherit initial unset revert none auto"),
    rules: [
      ["comment", /\/\*[\s\S]*?\*\//y],
      ["string", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
      ["keyword", /@[\w-]+/y],
      ["attr", /--?[A-Za-z][\w-]*(?=\s*:)|[a-z][\w-]*(?=\s*:(?!:))/y],
      ["number", /#[\da-f]{3,8}\b|-?\b\d*\.?\d+(?:%|[a-z]+)?/iy],
      ["function", /[\w-]+(?=\()/y],
      ["tag", /[.#][A-Za-z][\w-]*|::?[\w-]+/y],
      ["punctuation", /[{}();:,>+~*=[\]]/y],
    ],
  },
  sh: {
    keywords: words(SH_KEYWORDS),
    rules: [
      ["comment", /(?:^|(?<=\s))#[^\n]*/my],
      ["string", /"(?:\\.|[^"\\])*"|'[^']*'/y],
      ["attr", /\$\{[^}]*\}|\$\w+|--?[A-Za-z][\w-]*/y],
      ["number", /\b\d+\b/y],
      ["punctuation", /[|&;<>()]+/y],
    ],
    // The first word of a command is the program.
    commands: true,
  },
};
const ALIASES = { javascript: "js", ts: "js", typescript: "js", jsx: "js", tsx: "js", mjs: "js", raylang: "ray", bash: "sh", shell: "sh", zsh: "sh", console: "sh" };

/** HTML / XML / SVG / Vue: tags, attributes, values, comments. */
function tokenizeMarkup(src) {
  const out = [];
  const re = /<!--[\s\S]*?-->|<\/?[A-Za-z][\w:.-]*(?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>|[^<]+|</y;
  let m;
  while ((m = re.exec(src))) {
    const t = m[0];
    if (t.startsWith("<!--")) out.push(["comment", t]);
    else if (t.startsWith("<") && t.length > 1) {
      const tag = /^(<\/?)([A-Za-z][\w:.-]*)([\s\S]*?)(\/?>)$/.exec(t);
      if (!tag) { out.push(["text", t]); continue; }
      out.push(["punctuation", tag[1]], ["tag", tag[2]]);
      const attrs = /(\s+)([^\s=/>]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+))?/y;
      let a;
      let last = 0;
      while ((a = attrs.exec(tag[3]))) {
        out.push(["text", a[1]], ["attr", a[2]]);
        if (a[3]) out.push(["punctuation", a[3]], ["string", a[4]]);
        last = attrs.lastIndex;
      }
      if (last < tag[3].length) out.push(["text", tag[3].slice(last)]);
      out.push(["punctuation", tag[4]]);
    } else out.push(["text", t]);
  }
  return out;
}

function tokenizeCode(src, lang) {
  const out = [];
  const { keywords, rules, commands } = lang;
  let i = 0;
  let lineStart = true;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\n" || ch === " " || ch === "\t") {
      out.push(["text", ch]);
      if (ch === "\n") lineStart = true;
      i++;
      continue;
    }
    let hit = null;
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m[0]) { hit = [type, m[0]]; break; }
    }
    if (!hit) {
      IDENT.lastIndex = i;
      const m = IDENT.exec(src);
      if (m) {
        const w = m[0];
        const next = src.slice(i + w.length).match(/^\s*(.)/)?.[1];
        let type = "text";
        if (keywords.has(w)) type = "keyword";
        else if (commands && lineStart) type = "function";
        else if (next === "(") type = "function";
        else if (/^[A-Z][a-z0-9]/.test(w) && !commands) type = "type";
        hit = [type, w];
      } else hit = ["text", ch];
    }
    out.push(hit);
    lineStart = false;
    i += hit[1].length;
  }
  return out;
}

/**
 * The built-in highlighter: code as [type, text] tokens. Types: keyword,
 * string, number, comment, function, type, tag, attr, punctuation, text.
 */
export function tokenize(code, lang = "") {
  const l = String(lang).toLowerCase();
  const key = ALIASES[l] ?? l;
  if (["html", "xml", "svg", "vue"].includes(key)) return tokenizeMarkup(code);
  if (LANGS[key]) return tokenizeCode(code, LANGS[key]);
  return [["text", code]];
}

/** The built-in highlighter's output as nodes (text only, never parsed as HTML). */
function highlightBuiltIn(code, lang) {
  const frag = document.createDocumentFragment();
  for (const [type, text] of tokenize(code, lang)) {
    if (type === "text") frag.append(text);
    else {
      const s = document.createElement("span");
      s.className = `t-${type}`;
      s.textContent = text;
      frag.append(s);
    }
  }
  return frag;
}

// --- pluggable highlighter --------------------------------------------------------

let highlighter = null;
const blocks = new Set();

/**
 * Hands every ray-code to `fn(code, lang)`, which returns HTML (a string, a
 * Node, or a Promise of either); null/undefined falls back to the built-in
 * one for that block. setHighlighter(null) restores the built-in one.
 * The HTML is inserted as is: pass only a trusted highlighter.
 */
export function setHighlighter(fn) {
  highlighter = typeof fn === "function" ? fn : null;
  for (const b of blocks) b.requestUpdate();
}

// --- lines ------------------------------------------------------------------------

// Highlighted nodes split at the newlines into one fragment per line, each
// keeping its ancestors (a span across lines is cloned on each).
function splitLines(root) {
  const lines = [document.createDocumentFragment()];
  const place = (ancestors, node) => {
    let parent = lines[lines.length - 1];
    for (const a of ancestors) {
      const last = parent.lastChild;
      if (last && last.__rayFrom === a) {
        parent = last;
      } else {
        const clone = a.cloneNode(false);
        clone.__rayFrom = a;
        parent.append(clone);
        parent = clone;
      }
    }
    parent.append(node);
  };
  const walk = (node, ancestors) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        child.data.split("\n").forEach((part, i) => {
          if (i > 0) lines.push(document.createDocumentFragment());
          if (part) place(ancestors, document.createTextNode(part));
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, [...ancestors, child]);
      }
    }
  };
  walk(root, []);
  return lines;
}

// "3, 5-7" → Set {3, 5, 6, 7}.
function parseLines(spec) {
  const set = new Set();
  for (const part of String(spec ?? "").split(/[\s,]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2] ?? m[1]);
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) set.add(n);
  }
  return set;
}

// Common indentation and blank first/last lines removed.
function dedent(text) {
  const lines = String(text).replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length), Infinity);
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join("\n");
}

// --- the element ------------------------------------------------------------------

const LABELS = { js: "JavaScript", ts: "TypeScript", tsx: "TSX", jsx: "JSX", json: "JSON", html: "HTML", xml: "XML", svg: "SVG", vue: "Vue", css: "CSS", sh: "Shell", bash: "Bash", shell: "Shell", ray: "raylang", raylang: "raylang", diff: "Diff" };

const styles = css`
  :host {
    display: block;
    --_lh: 1.65;
    --_fs: var(--ray-font-size-sm);
    /* Shiki's css-variables theme, painted with the ray-ds palette. */
    --shiki-foreground: var(--ray-code-text);
    --shiki-background: transparent;
    --shiki-token-keyword: var(--ray-code-keyword);
    --shiki-token-string: var(--ray-code-string);
    --shiki-token-string-expression: var(--ray-code-string);
    --shiki-token-constant: var(--ray-code-number);
    --shiki-token-comment: var(--ray-code-comment);
    --shiki-token-function: var(--ray-code-function);
    --shiki-token-parameter: var(--ray-code-text);
    --shiki-token-punctuation: var(--ray-code-punctuation);
    --shiki-token-link: var(--ray-code-attr);
  }
  :host([size="xs"]) { --_fs: var(--ray-font-size-xs); }
  :host([size="md"]) { --_fs: var(--ray-font-size-md); }
  .frame {
    position: relative;
    overflow: hidden;
    color: var(--ray-code-text);
    background: var(--ray-code-background);
    border: 1px solid var(--ray-border);
    border-radius: var(--_radius, var(--ray-radius-md));
  }
  .header {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    min-height: 2.5rem;
    padding: 0 var(--ray-space-2) 0 var(--ray-space-4);
    font-size: var(--ray-font-size-xs);
    color: var(--ray-muted-foreground);
    border-bottom: 1px solid var(--ray-border);
  }
  .header[hidden] { display: none; }
  .filename { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--ray-font-mono); color: var(--ray-foreground); }
  .lang { font-weight: var(--ray-font-weight-medium); letter-spacing: 0.02em; }
  .copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ray-space-1);
    height: 1.75rem;
    min-width: 1.75rem;
    padding: 0 var(--ray-space-2);
    font: inherit;
    font-size: var(--ray-font-size-xs);
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .copy:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .copy svg { width: 0.95rem; height: 0.95rem; }
  .copy .done { display: none; }
  .copy[data-copied] .idle { display: none; }
  .copy[data-copied] .done { display: inline-flex; color: var(--ray-code-added); }
  .copy-label { display: none; }
  .copy[data-copied] .copy-label { display: inline; }
  /* Without a header, the button floats in the top-end corner. */
  .copy.floating { position: absolute; z-index: 1; top: var(--ray-space-2); right: var(--ray-space-2); background: var(--ray-code-background); opacity: 0; transition: opacity var(--ray-duration-fast); }
  .frame:hover .copy.floating, .copy.floating:focus-visible, .copy.floating[data-copied] { opacity: 1; }
  @media (hover: none) { .copy.floating { opacity: 1; } }
  .copy[hidden] { display: none; }

  .scroller { overflow: auto; max-height: var(--_max, none); outline: none; }
  .scroller:focus-visible { box-shadow: inset 0 0 0 2px var(--ray-ring); }
  :host([expanded]) .scroller { max-height: none; }
  pre { margin: 0; padding: var(--ray-space-3) 0; font-family: var(--ray-font-mono); font-size: var(--_fs); line-height: var(--_lh); tab-size: 2; }
  code { display: block; min-width: max-content; font: inherit; counter-reset: line; }
  :host([wrap]) code { min-width: 0; }
  .line { display: block; padding: 0 var(--ray-space-4); white-space: pre; border-inline-start: 2px solid transparent; }
  :host([wrap]) .line { white-space: pre-wrap; overflow-wrap: anywhere; }
  .line:empty::after { content: " "; }
  :host([line-numbers]) .line { counter-increment: line; padding-left: 0; }
  :host([line-numbers]) .line::before {
    content: counter(line);
    display: inline-block;
    width: calc(var(--_digits, 2) * 1ch + var(--ray-space-6));
    padding-inline-end: var(--ray-space-4);
    box-sizing: border-box;
    text-align: right;
    color: var(--ray-code-comment);
    opacity: 0.7;
    user-select: none;
  }
  :host([line-numbers][wrap]) .line { padding-left: calc(var(--_digits, 2) * 1ch + var(--ray-space-6)); text-indent: calc((var(--_digits, 2) * 1ch + var(--ray-space-6)) * -1); }
  .line[data-highlight] { background: color-mix(in srgb, var(--ray-primary) 12%, transparent); border-inline-start-color: var(--ray-primary); }
  .line[data-diff="add"] { color: var(--ray-code-added); background: color-mix(in srgb, var(--ray-code-added) 12%, transparent); }
  .line[data-diff="remove"] { color: var(--ray-code-removed); background: color-mix(in srgb, var(--ray-code-removed) 12%, transparent); }
  .line[data-diff="meta"] { color: var(--ray-code-comment); }

  .more {
    display: flex;
    justify-content: center;
    padding: var(--ray-space-1);
    border-top: 1px solid var(--ray-border);
  }
  .more[hidden] { display: none; }
  .more button {
    padding: var(--ray-space-1) var(--ray-space-3);
    font: inherit;
    font-size: var(--ray-font-size-xs);
    color: var(--ray-primary-light-color);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .more button:hover { background: var(--ray-default-hover); }

  /* Token colors: the built-in classes, Prism's and highlight.js's. */
  .t-keyword, .token.keyword, .token.atrule, .token.important, .hljs-keyword, .hljs-selector-tag, .hljs-meta .hljs-keyword { color: var(--ray-code-keyword); }
  .t-string, .token.string, .token.attr-value, .token.char, .token.regex, .token.url, .hljs-string, .hljs-regexp, .hljs-symbol { color: var(--ray-code-string); }
  .t-number, .token.number, .token.boolean, .token.constant, .hljs-number, .hljs-literal { color: var(--ray-code-number); }
  .t-comment, .token.comment, .token.prolog, .token.doctype, .token.cdata, .hljs-comment, .hljs-quote { color: var(--ray-code-comment); font-style: italic; }
  .t-function, .token.function, .hljs-title.function_, .hljs-title, .hljs-built_in { color: var(--ray-code-function); }
  .t-type, .token.class-name, .token.builtin, .hljs-type, .hljs-title.class_ { color: var(--ray-code-type); }
  .t-tag, .token.tag, .token.selector, .hljs-tag, .hljs-name, .hljs-selector-class, .hljs-selector-id { color: var(--ray-code-tag); }
  .t-attr, .token.attr-name, .token.property, .token.variable, .hljs-attr, .hljs-attribute, .hljs-property, .hljs-variable, .hljs-params { color: var(--ray-code-attr); }
  .t-punctuation, .token.punctuation, .token.operator, .hljs-punctuation, .hljs-operator { color: var(--ray-code-punctuation); }
  .token.inserted, .hljs-addition { color: var(--ray-code-added); }
  .token.deleted, .hljs-deletion { color: var(--ray-code-removed); }
`;

export class RayCode extends RayElement {
  static properties = {
    code: { type: String, attribute: false },
    language: { type: String, reflect: true },
    filename: { type: String },
    lineNumbers: { type: Boolean, reflect: true },
    highlight: { type: String },
    wrap: { type: Boolean, reflect: true },
    maxHeight: { type: String },
    expanded: { type: Boolean, reflect: true },
    hideCopy: { type: Boolean, reflect: true },
    hideHeader: { type: Boolean, reflect: true },
    size: { type: String, reflect: true, default: "sm" },
    radius: { type: String, reflect: true },
    copyLabel: { type: String, default: "Copy code" },
    copiedLabel: { type: String, default: "Copied" },
  };
  static styles = [styles];
  static template = `
    <div class="frame" part="frame">
      <div class="header" part="header"><span class="filename" part="filename"></span><span class="lang" part="language"></span></div>
      <div class="scroller" part="scroller" tabindex="0" role="region"><pre part="pre"><code part="code"></code></pre></div>
      <div class="more" part="more" hidden><button type="button"></button></div>
      <span class="sr" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></span>
    </div>
    <slot hidden></slot>`;

  #render = 0;
  #source = "";

  constructor() {
    super();
    this.copyButton = document.createElement("button");
    const b = this.copyButton;
    b.type = "button";
    b.className = "copy focus-ring";
    b.setAttribute("part", "copy");
    b.innerHTML = `<span class="idle" data-ray-icon="copy" aria-hidden="true"></span><span class="done" data-ray-icon="check" aria-hidden="true"></span><span class="copy-label"></span>`;
    b.addEventListener("click", () => this.copy());
    this.$(".more button").addEventListener("click", () => { this.expanded = !this.expanded; });
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
    this.#observer = new MutationObserver(() => this.requestUpdate());
  }

  #observer;

  connectedCallback() {
    super.connectedCallback();
    blocks.add(this);
    this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    blocks.delete(this);
    this.#observer.disconnect();
  }

  /** The code shown (dedented), whatever its source. */
  get source() {
    return this.#source;
  }

  #readSource() {
    if (typeof this.code === "string") return dedent(this.code);
    // A <template> is parsed as HTML: perfect for markup; its serialization
    // escapes &, < and > in text, undone here.
    const tpl = this.querySelector(":scope > template");
    if (tpl) return dedent(tpl.innerHTML.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, "\u00a0").replace(/&amp;/g, "&"));
    const script = this.querySelector(':scope > script[type="text/plain"]');
    if (script) return dedent(script.textContent);
    return dedent(this.textContent);
  }

  update() {
    this.#source = this.#readSource();
    const lang = (this.language ?? "").toLowerCase();
    // Header: file name and language; the copy button goes in it or floats.
    const header = this.$(".header");
    const label = LABELS[lang] ?? (lang ? lang.toUpperCase() : "");
    this.$(".filename").textContent = this.filename ?? "";
    this.$(".lang").textContent = this.filename || !this.hideHeader ? label : "";
    const showHeader = !this.hideHeader && Boolean(this.filename || label);
    header.hidden = !showHeader;
    const b = this.copyButton;
    b.hidden = Boolean(this.hideCopy);
    b.classList.toggle("floating", !showHeader);
    if (showHeader) header.append(b);
    else this.$(".frame").append(b);
    b.setAttribute("aria-label", this.copyLabel);
    b.title = this.copyLabel;
    b.querySelector(".copy-label").textContent = this.copiedLabel;
    this.paintIcons(b);
    // The scroll box: a named region, its height and the "show more" button.
    const scroller = this.$(".scroller");
    scroller.setAttribute("aria-label", this.filename || (label ? `${label} code` : "Code"));
    const max = this.maxHeight;
    if (max) this.style.setProperty("--_max", /^\d+(\.\d+)?$/.test(max) ? `${max}px` : max);
    else this.style.removeProperty("--_max");
    const r = this.radius;
    if (r) this.style.setProperty("--_radius", ["xs", "sm", "md", "lg", "xl"].includes(r) ? `var(--ray-radius-${r})` : r === "none" ? "0" : r);
    else this.style.removeProperty("--_radius");
    this.#paint(lang);
  }

  async #paint(lang) {
    const run = ++this.#render;
    const src = this.#source;
    let html = null;
    if (highlighter && lang !== "diff") {
      try {
        html = await highlighter(src, lang);
      } catch {
        html = null;
      }
      if (run !== this.#render) return;
    }
    const holder = document.createElement("div");
    if (html === null || html === undefined) holder.append(highlightBuiltIn(src, lang === "diff" ? "" : lang));
    else if (typeof html === "string") holder.innerHTML = html;
    else holder.append(html);
    // A library's <pre><code> wrapper: keep only what is inside.
    const inner = holder.querySelector(":scope > pre code, :scope > pre, :scope > code");
    const root = inner && holder.childElementCount === 1 ? inner : holder;
    const marked = parseLines(this.highlight);
    const code = this.$("code");
    const lines = splitLines(root);
    const srcLines = src.split("\n");
    code.replaceChildren(...lines.map((frag, i) => {
      const line = document.createElement("span");
      line.className = "line";
      line.append(frag);
      if (marked.has(i + 1)) line.setAttribute("data-highlight", "");
      if (lang === "diff") {
        const first = srcLines[i]?.[0];
        const kind = first === "+" ? "add" : first === "-" ? "remove" : first === "@" ? "meta" : "";
        if (kind) line.dataset.diff = kind;
      }
      return line;
    }));
    this.style.setProperty("--_digits", String(String(lines.length).length));
    // "Show more" when a max height cuts the code.
    const more = this.$(".more");
    const scroller = this.$(".scroller");
    const cut = Boolean(this.maxHeight) && (this.expanded || scroller.scrollHeight > scroller.clientHeight + 1);
    more.hidden = !cut;
    more.firstElementChild.textContent = this.expanded ? "Show less" : `Show all ${lines.length} lines`;
    more.firstElementChild.setAttribute("aria-expanded", String(Boolean(this.expanded)));
  }

  /** Copies the code to the clipboard; resolves to true when it worked. */
  async copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(this.#source);
      ok = true;
    } catch {
      // No clipboard API (or refused): select the code and copy it.
      const sel = getSelection();
      const range = document.createRange();
      range.selectNodeContents(this.$("code"));
      sel?.removeAllRanges();
      sel?.addRange(range);
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      sel?.removeAllRanges();
    }
    if (ok) {
      const b = this.copyButton;
      b.setAttribute("data-copied", "");
      this.$(".sr").textContent = this.copiedLabel;
      clearTimeout(this._copied);
      this._copied = setTimeout(() => {
        b.removeAttribute("data-copied");
        this.$(".sr").textContent = "";
      }, 1600);
      this.emit("ray-copy", { code: this.#source });
    }
    return ok;
  }
}

define("ray-code", RayCode);
