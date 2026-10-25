# Code

A block of source code: header with file name and language, copy button, line numbers, highlighted lines, diff lines, wrapping and a "show more" height. A small built-in highlighter, or any library through setHighlighter(), painted with the --ray-code-* tokens.

Import: `import "@raylang/elements/code";` · Category: Data display

## `<ray-code>` (RayCode, extends RayElement)

The code comes from the code property, a <script type="text/plain"> child (raw text: anything but a closing script tag), a <template> child (parsed as HTML: the easiest for markup, but a < that is not a tag, as in Promise<void>, breaks it), or the element's text; common indentation and blank edges are removed (not with verbatim). Built-in languages: js/ts (jsx, tsx), json, html/xml/svg/vue, css, shell, ray and diff; others show as plain text. Library classes painted with the tokens: Prism's .token.*, highlight.js's .hljs-*, and Shiki's css-variables theme.

Properties:

- `code` (property only): string. The code, from script (the most convenient in React and Vue). Wins over the content.
- `language`: string, reflects. The language: js, ts, jsx, tsx, json, html, xml, svg, vue, css, sh, ray, diff… (also shown in the header). Not lang: that is the human language of the text.
- `filename`: string. A file name or title in the header; also the scroll region's accessible name.
- `lineNumbers` (attribute `line-numbers`): boolean, reflects. Numbers each line (not copied, not selectable).
- `highlight`: string. Lines to highlight: "3, 5-7".
- `wrap`: boolean, reflects. Wraps long lines instead of scrolling sideways.
- `verbatim`: boolean, reflects. Shows and copies the text exactly as given: no common indentation or blank first and last lines removed. For data (a response body, a log) rather than code written in the page.
- `maxHeight` (attribute `max-height`): string. Height before it scrolls: px as a number, or a CSS length. A taller block gets a "Show all N lines" button.
- `expanded`: boolean, reflects. Shown whole, past max-height.
- `hideCopy` (attribute `hide-copy`): boolean, reflects. No copy button.
- `hideHeader` (attribute `hide-header`): boolean, reflects. No header bar (the copy button floats in the corner).
- `size`: `xs` | `sm` | `md`, default `sm`, reflects. Font size.
- `radius`: string, reflects. Corner radius: xs…xl, none, or a CSS length. Default: md.
- `copyLabel` (attribute `copy-label`): string, default `Copy code`. Accessible name of the copy button.
- `copiedLabel` (attribute `copied-label`): string, default `Copied`. Shown and announced after copying.

Events:

- `ray-copy` (detail `{ code: string }`): The code was copied.

Slots:

- (default): The code: text, a <template> or a <script type="text/plain">.

Parts (`::part()`):

- `frame`: The box.
- `header`: The bar with the file name, the language and the copy button.
- `copy`: The copy button.
- `scroller`: The scroll box (focusable, to scroll with the keyboard).
- `code`: The <code> with one .line per line.

Methods and properties:

- `readonly source: string`: The code shown (dedented), whatever its source.
- `copy(): Promise<boolean>`: Copies the code; resolves to true when it worked.

Exports (from `@raylang/elements/code` and `@raylang/elements`):

- `function setHighlighter(fn: ((code: string, lang: string) => string | Node | null | undefined | Promise<string | Node | null | undefined>) | null): void`: Hands every ray-code to a highlighter that returns HTML (Prism, highlight.js, Shiki…); null/undefined falls back to the built-in one. The HTML is inserted as is: pass only a trusted highlighter. null restores the built-in one.
- `function tokenize(code: string, lang?: string): [type: string, text: string][]`: The built-in highlighter: tokens of type keyword, string, number, comment, function, type, tag, attr, punctuation or text.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.8.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A file</div>
<ray-code language="ray" filename="src/main.ray" line-numbers highlight="6-8"><script type="text/plain">
import std/ui;

fn main() -> int {
    let h = ui.open("Ray Remote", "ray://app/index.html", 960, 640).unwrap();
    // The page asks; the program answers.
    for e in ui.events() {
        if let Option.Some((id, body)) = ui.as_request(e) {
            ui.reply(h, id, "pong: ${body}");
        }
    }
    0
}
</script></ray-code>

<div class="demo-caption">Languages</div>
<div class="demo-grid demo-code-grid">
  <ray-code language="html" filename="index.html"><template>
<form id="login">
  <ray-input name="email" label="Email" type="email" required></ray-input>
  <ray-password-input name="password" label="Password"></ray-password-input>
  <!-- Submits like any form -->
  <ray-button type="submit">Sign in</ray-button>
</form>
</template></ray-code>
  <ray-code language="ts" filename="app.ts"><script type="text/plain">
import { notify } from "@raylang/elements";

type Build = { id: number; ok: boolean };

export async function report(build: Build): Promise<void> {
  const color = build.ok ? "green" : "red";
  notify({ title: `Build #${build.id}`, color });
}
</script></ray-code>
  <ray-code language="css" filename="theme.css"><template>
:root {
  --ray-radius-md: 0.625rem; /* rounder */
}
ray-button::part(button):hover {
  background: color-mix(in srgb, var(--ray-primary) 90%, black);
}
</template></ray-code>
  <ray-code language="json" filename="update.json"><template>
{
  "version": "0.4.1",
  "artifacts": {
    "macos-aarch64": { "size": 4404019, "signed": true }
  }
}
</template></ray-code>
</div>

<div class="demo-caption">Terminal, diff and long code</div>
<div class="demo-grid demo-code-grid">
  <ray-code language="sh" hide-header><template>
# Build and bundle the desktop app
ray build --native --release src/main.ray
ray bundle --name "Ray Remote" -o dist
echo "done: $HOME/dist"
</template></ray-code>
  <ray-code language="diff" filename="dialog.js"><template>
@@ -68,3 +68,4 @@
-  .body { flex: 1; overflow: auto; }
+  /* Safari collapses a 0% basis under a max-height. */
+  .body { flex: 1 1 auto; min-height: 0; overflow: auto; }
   .footer { display: flex; }
</template></ray-code>
</div>
<ray-code language="js" filename="tokens.js" line-numbers max-height="12rem" wrap id="demo-long"></ray-code>

<div class="demo-caption">Data as it came</div>
<p class="demo-muted" style="margin: 0">verbatim shows and copies the text untouched: a response body or a log keeps its indentation and its blank last line.</p>
<ray-code filename="response body" line-numbers verbatim id="demo-code-verbatim"></ray-code>

<div class="demo-caption">Bring your own highlighter</div>
<p class="demo-muted" style="margin: 0">setHighlighter() hands every block to a library; its classes are painted with the ray-elements tokens, so the colors stay the same. Returning nothing falls back to the built-in one.</p>
<div class="demo-grid demo-code-grid">
  <ray-code language="js" filename="Prism"><script type="text/plain">
import Prism from "prismjs";
import { setHighlighter } from "@raylang/elements";

setHighlighter((code, lang) =>
  Prism.languages[lang] ? Prism.highlight(code, Prism.languages[lang], lang) : null);
</script></ray-code>
  <ray-code language="js" filename="highlight.js"><script type="text/plain">
import hljs from "highlight.js/lib/common";
import { setHighlighter } from "@raylang/elements";

setHighlighter((code, lang) =>
  hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : null);
</script></ray-code>
  <ray-code language="js" filename="Shiki"><script type="text/plain">
import { codeToHtml, createCssVariablesTheme } from "shiki";
import { setHighlighter } from "@raylang/elements";

// The css-variables theme: ray-code maps its variables to the tokens.
const theme = createCssVariablesTheme({ name: "ray-elements", variablePrefix: "--shiki-" });
setHighlighter((code, lang) => codeToHtml(code, { lang, theme }));
</script></ray-code>
</div>

<script type="module">
  // Code from script: the `code` property (what React and Vue use).
  document.getElementById("demo-long").code = Array.from({ length: 24 }, (_, i) =>
    `export const space${i} = "${(i * 0.25).toFixed(2)}rem"; // step ${i} of the spacing scale, used by gaps and paddings`).join("\n");
  document.getElementById("demo-code-verbatim").code = "    error: connection refused\n    retrying in 2s\n";
</script>
```
