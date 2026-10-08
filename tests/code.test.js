// page: tests/pages/code.html
//
// <ray-code>: the built-in tokenizer, the code's sources, lines, numbers,
// highlighted and diff lines, a library highlighter (HTML split into lines),
// max height.

const T = window.__rayTest;
await customElements.whenDefined("ray-code");
const { tokenize, setHighlighter } = await import("../../src/components/code/code.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}
const lines = (el) => [...el.shadowRoot.querySelectorAll(".line")];
const types = (code, lang) => tokenize(code, lang).filter(([t]) => t !== "text").map(([t, s]) => `${t}:${s}`).join(" ");

T.test("code: the built-in tokenizer", async (T) => {
  T.eq(types(`const n = 42; // x`, "js"), "keyword:const punctuation:= number:42 punctuation:; comment:// x");
  T.eq(types(`run(Build)`, "ts"), "function:run punctuation:( type:Build punctuation:)");
  T.eq(types(`{"a": true}`, "json"), 'punctuation:{ attr:"a" punctuation:: keyword:true punctuation:}');
  T.eq(types(`<a href="/x">`, "html"), 'punctuation:< tag:a attr:href punctuation:= string:"/x" punctuation:>');
  T.eq(types(`fn main() -> int`, "ray"), "keyword:fn function:main punctuation:() punctuation:->");
  T.eq(types(`ray build --release`, "sh"), "function:ray attr:--release");
  T.eq(types(`color: #fff;`, "css"), "attr:color punctuation:: number:#fff punctuation:;");
  T.eq(tokenize("plain <b>", "cobol").length, 1, "unknown language: one text token");
});

T.test("code: sources, dedent, lines, numbers, highlight", async (T) => {
  const box = await mount(`
    <ray-code language="html" id="a"><template>
      <p class="x">a &amp; b -> c</p>
    </template></ray-code>
    <ray-code language="ts" id="b" line-numbers highlight="2"><script type="text/plain">
      let p: Promise<void>;
      let q = 1;
    </script></ray-code>`);
  const a = box.querySelector("#a");
  T.eq(a.source, `<p class="x">a & b -> c</p>`, "template: dedented, entities undone");
  const b = box.querySelector("#b");
  T.eq(b.source, "let p: Promise<void>;\nlet q = 1;", "script: raw text");
  T.eq(lines(b).length, 2);
  T.eq(lines(b)[1].hasAttribute("data-highlight"), true, "line 2 highlighted");
  T.ok(getComputedStyle(lines(b)[0], "::before").content !== "none", "line numbers shown");
  b.code = "x\ny\nz";
  await T.settle();
  T.eq(lines(b).length, 3, "the code property wins");
  T.eq(b.shadowRoot.querySelector(".scroller").getAttribute("aria-label"), "TypeScript code");
  box.remove();
});

T.test("code: diff lines, header and floating copy button", async (T) => {
  const box = await mount(`<ray-code language="diff" filename="a.js"><script type="text/plain">@@ -1 +1 @@
-old
+new
 same</script></ray-code><ray-code hide-header id="c">x</ray-code>`);
  const d = box.firstElementChild;
  T.eq(lines(d).map((l) => l.dataset.diff ?? "").join(), "meta,remove,add,");
  T.eq(d.shadowRoot.querySelector(".filename").textContent, "a.js");
  T.ok(d.shadowRoot.querySelector(".header").contains(d.copyButton), "copy in the header");
  const c = box.querySelector("#c");
  T.ok(c.copyButton.classList.contains("floating"), "no header: the button floats");
  box.remove();
});

T.test("code: a library highlighter, split into lines; null falls back", async (T) => {
  setHighlighter((code, lang) => lang === "fake" ? `<pre><code><span class="token comment">/* a\nb */</span> <span class="hljs-keyword">x</span></code></pre>` : null);
  const box = await mount(`<ray-code language="fake">ignored</ray-code><ray-code language="js" id="js">let a</ray-code>`);
  const el = box.firstElementChild;
  const ls = lines(el);
  T.eq(ls.length, 2, "a span across a newline is split");
  T.eq(ls[0].querySelector(".token.comment").textContent, "/* a");
  T.eq(ls[1].querySelector(".token.comment").textContent, "b */");
  const kw = getComputedStyle(ls[1].querySelector(".hljs-keyword")).color;
  T.ok(kw !== getComputedStyle(ls[1]).color, `library classes painted with the tokens (${kw})`);
  T.ok(box.querySelector("#js").shadowRoot.querySelector(".t-keyword"), "null: the built-in one");
  setHighlighter(null);
  box.remove();
});

T.test("code: max-height shows a show-more button", async (T) => {
  const box = await mount(`<ray-code max-height="60" id="m"></ray-code>`);
  const el = box.firstElementChild;
  el.code = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
  await T.settle();
  await T.settle();
  const more = el.shadowRoot.querySelector(".more");
  T.eq(more.hidden, false, "cut: the button shows");
  T.eq(more.textContent.trim(), "Show all 30 lines");
  more.querySelector("button").click();
  await T.settle();
  await T.settle();
  T.eq(el.expanded, true);
  T.eq(more.textContent.trim(), "Show less");
  box.remove();
});
