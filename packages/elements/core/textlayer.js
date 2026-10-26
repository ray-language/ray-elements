// A layer behind a text control (the <input> of ray-input, the <textarea>
// of ray-textarea) with the same text laid out the same way, transparent,
// to paint ranges of it: `highlight` tints tokens such as {{variables}},
// and the position of any character can be measured (to place suggestions
// under the caret). The control keeps its own text, caret, selection and
// IME; the layer only paints behind it.

import { css } from "./core.js";

/** The layer's look, for the component's styles. */
export const textLayerStyles = css`
  .control { position: relative; }
  .text-layer {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    overflow: hidden;
    color: transparent;
    pointer-events: none;
  }
  .text-layer > div { flex: none; white-space: pre; }
  .text-layer.multi { display: block; }
  .text-layer.multi > div { white-space: pre-wrap; overflow-wrap: break-word; }
  .text-layer mark {
    --_tint: color-mix(in srgb, var(--ray-primary) 18%, transparent);
    color: transparent;
    background: var(--_tint);
    border-radius: 3px;
    box-shadow: 0 0 0 1.5px var(--_tint);
  }
  .text-layer mark[data-kind="error"] {
    --_tint: color-mix(in srgb, var(--ray-destructive) 16%, transparent);
    text-decoration: underline wavy var(--ray-destructive);
    text-decoration-skip-ink: none;
    text-underline-offset: 3px;
  }
`;

// Copied from the control so the layer's text falls on the same pixels.
const LAYOUT = [
  "fontFamily", "fontSize", "fontWeight", "fontStyle", "fontStretch", "fontFeatureSettings", "fontVariantLigatures",
  "letterSpacing", "wordSpacing", "lineHeight", "textTransform", "textIndent", "tabSize", "direction",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
];

/**
 * The ranges a highlight function gives, checked and sorted: within the
 * text, not overlapping (an overlapping one is dropped), start < end.
 * @param {Array<{start: number, end: number, kind?: string, title?: string}> | null | undefined} ranges
 * @param {number} length
 */
export function cleanRanges(ranges, length) {
  const out = [];
  const sorted = (Array.isArray(ranges) ? ranges : [])
    .filter((r) => r && Number.isFinite(r.start) && Number.isFinite(r.end))
    .map((r) => ({ ...r, start: Math.max(0, Math.trunc(r.start)), end: Math.min(length, Math.trunc(r.end)) }))
    .filter((r) => r.start < r.end)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let at = 0;
  for (const r of sorted) {
    if (r.start < at) continue;
    out.push(r);
    at = r.end;
  }
  return out;
}

export class TextLayer {
  /** @param {HTMLInputElement | HTMLTextAreaElement} control */
  constructor(control) {
    this.control = control;
    this.multi = control.localName === "textarea";
    this.el = document.createElement("div");
    this.el.className = "text-layer" + (this.multi ? " multi" : "");
    this.el.setAttribute("part", "text-layer");
    this.el.setAttribute("aria-hidden", "true");
    this.text = document.createElement("div");
    this.el.append(this.text);
    control.before(this.el);
    this.ranges = [];
    this._shown = null;
    control.addEventListener("scroll", () => this.scroll(), { passive: true });
    // A one-line input scrolls with the caret without a scroll event: follow
    // it while focused.
    let following = 0;
    const follow = () => {
      this.scroll();
      following = requestAnimationFrame(follow);
    };
    control.addEventListener("focus", () => {
      if (!this.multi && !following) following = requestAnimationFrame(follow);
    });
    control.addEventListener("blur", () => {
      cancelAnimationFrame(following);
      following = 0;
      this.scroll();
    });
    // Placed on the next frame: moving the layer inside the observer's
    // callback would loop it.
    if (typeof ResizeObserver === "function") new ResizeObserver(() => requestAnimationFrame(() => this.place())).observe(control);
  }

  /** Lays out the control's text with `ranges` marked. */
  paint(ranges) {
    const value = this.control.value;
    this.ranges = cleanRanges(ranges, value.length);
    const key = value + "\u0000" + JSON.stringify(this.ranges.map((r) => [r.start, r.end, r.kind ?? ""]));
    if (this._shown !== key) {
      this._shown = key;
      const nodes = [];
      let at = 0;
      for (const r of this.ranges) {
        if (r.start > at) nodes.push(value.slice(at, r.start));
        const mark = document.createElement("mark");
        mark.textContent = value.slice(r.start, r.end);
        const kind = String(r.kind ?? "").replace(/[^a-z0-9-]/gi, "");
        mark.setAttribute("part", kind ? `highlight highlight-${kind}` : "highlight");
        if (kind) mark.dataset.kind = kind;
        nodes.push(mark);
        at = r.end;
      }
      if (at < value.length) nodes.push(value.slice(at));
      // A trailing newline takes a line in a textarea but not in a <div>.
      if (this.multi && value.endsWith("\n")) nodes.push(" ");
      this.text.replaceChildren(...nodes);
    }
    this.place();
    this.scroll();
  }

  place() {
    const c = this.control;
    const cs = getComputedStyle(c);
    for (const k of LAYOUT) this.el.style[k] = cs[k];
    // offsetLeft is measured from the left, whatever the direction.
    this.el.style.left = `${c.offsetLeft}px`;
    this.el.style.top = `${c.offsetTop}px`;
    // clientWidth leaves out a scrollbar: the text wraps at the same width.
    this.el.style.width = `${this.multi ? c.clientWidth : c.offsetWidth}px`;
    this.el.style.height = `${this.multi ? c.clientHeight : c.offsetHeight}px`;
  }

  scroll() {
    const c = this.control;
    this.text.style.transform = this.multi ? `translateY(${-c.scrollTop}px)` : `translateX(${-c.scrollLeft}px)`;
  }

  /** The viewport rectangle of the character at `offset` (the end of the text: its last one's end). */
  rectAt(offset) {
    const walker = document.createTreeWalker(this.text, NodeFilter.SHOW_TEXT);
    let left = Math.max(0, offset);
    let last = null;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      last = n;
      if (left < n.length) {
        const range = document.createRange();
        range.setStart(n, left);
        range.setEnd(n, left + 1);
        const r = range.getBoundingClientRect();
        if (r.width || r.height) return r;
        break;
      }
      left -= n.length;
    }
    if (last && last.length) {
      const range = document.createRange();
      range.setStart(last, last.length - 1);
      range.setEnd(last, last.length);
      const r = range.getBoundingClientRect();
      if (r.width || r.height) return new DOMRect(r.right, r.top, 0, r.height);
    }
    const c = this.control.getBoundingClientRect();
    return new DOMRect(c.left, c.top, 0, c.height);
  }

  /** The range under a point of the viewport, or null. */
  rangeAt(x, y) {
    const marks = [...this.text.querySelectorAll("mark")];
    for (let i = 0; i < marks.length; i++) {
      for (const r of marks[i].getClientRects()) {
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return this.ranges[i];
      }
    }
    return null;
  }
}

/**
 * Paints `host.highlight(text)` behind `host.control` (ray-input,
 * ray-textarea): the layer is made the first time a highlight function is
 * set. A range's `title` becomes the field's tooltip under the pointer.
 */
export function syncHighlight(host) {
  const fn = typeof host.highlight === "function" ? host.highlight : null;
  if (!fn && !host._textLayer) return;
  host._textLayer ??= new TextLayer(host.control);
  if (!host._highlightTitles) {
    host._highlightTitles = true;
    host.control.addEventListener("pointermove", (e) => {
      const title = host._textLayer.rangeAt(e.clientX, e.clientY)?.title ?? "";
      if (host.control.title !== title) host.control.title = title;
    });
  }
  let ranges = [];
  if (fn) {
    try {
      ranges = fn(host.control.value);
    } catch (err) {
      console.error("ray-elements: highlight() threw", err);
    }
  }
  host._textLayer.paint(ranges);
}
