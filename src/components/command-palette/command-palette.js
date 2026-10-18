// <ray-command-palette>: search and run actions from the keyboard (Mantine's
// Spotlight, ray-sublime's palette). A modal <dialog> with the WAI-ARIA
// combobox + listbox pattern: focus stays in the search field, arrows move
// the active option (aria-activedescendant), Enter runs it, Escape closes.
//
//   palette.actions = [
//     { id: "open", label: "Open file…", group: "File", shortcut: "⌘O", keywords: ["load"],
//       onSelect: () => openFile() },
//   ];
//
// Running an action fires ray-select ({ action }) and calls action.onSelect.
// `hotkey` ("mod+k" by default; mod = ⌘ on macOS, Ctrl elsewhere) toggles it.
//
// With `native-menus` and a native host that offers "menu_items" (a std/ui
// window with core/raylang.js), it also lists the app's menu bar, grouped by
// menu, with their shortcuts; running one gives the program the same event
// as the menu (action.native is true, action.id is "menu:<tag>").

import { RayElement, css, define, getIcon } from "../../core/core.js";
import { matchesHotkey, formatHotkey } from "../../core/hotkey.js";
import { getHost, hostCan } from "../../core/host.js";
import { play, playAll } from "../../core/motion.js";
import { overlayStyles, applyOverlayBlur } from "../../core/styles.js";

const styles = css`
  :host { display: contents; }
  dialog {
    box-sizing: border-box;
    width: min(37.5rem, calc(100vw - 2rem));
    max-height: min(32rem, calc(100dvh - 14vh - 1rem));
    margin: 12vh auto auto;
    padding: 0;
    overflow: hidden;
    color: var(--ray-popover-foreground);
    background: var(--ray-popover);
    border: 1px solid var(--ray-overlay-border);
    background-clip: padding-box;
    border-radius: var(--ray-radius-lg);
    box-shadow: var(--ray-shadow-xl);
  }
  dialog[open] { display: flex; flex-direction: column; animation: ray-palette-in var(--ray-duration-base) var(--ray-easing-out); }
  @keyframes ray-palette-in { from { opacity: 0; transform: translateY(-0.5rem) scale(0.98); } }
  /* The search field: a filled, inset box (the look of <ray-search>). */
  .search {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ray-space-2);
    height: 2.75rem;
    margin: var(--ray-space-2);
    padding: 0 var(--ray-space-3);
    background: var(--ray-muted);
    /* Concentric with the dialog: its radius minus the margin. */
    border-radius: calc(var(--ray-radius-lg) - var(--ray-space-2));
  }
  .search svg { width: 1rem; height: 1rem; color: var(--ray-muted-foreground); }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    font: inherit;
    font-size: var(--ray-font-size-sm);
    color: inherit;
    background: transparent;
    border: 0;
    outline: none;
  }
  input::placeholder { color: var(--ray-muted-foreground); }
  /* flex-basis auto: with only a max-height on the dialog, Safari resolves
     a 0% basis to zero and the list collapses. */
  .list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 0 var(--ray-space-2) var(--ray-space-2); scroll-padding: var(--ray-space-2); }
  .group-label { padding: var(--ray-space-2) var(--ray-space-2) var(--ray-space-1); font-size: var(--ray-font-size-xs); font-weight: var(--ray-font-weight-medium); color: var(--ray-muted-foreground); }
  .option {
    display: flex;
    align-items: center;
    gap: var(--ray-space-2);
    min-height: 2.5rem;
    padding: var(--ray-space-1) var(--ray-space-3);
    border-radius: var(--ray-radius-md);
    cursor: pointer;
    user-select: none;
  }
  .option[aria-selected="true"] { background: var(--ray-accent); color: var(--ray-accent-foreground); }
  .option[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
  .icon { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem; color: var(--ray-muted-foreground); }
  .option[aria-selected="true"] .icon { color: inherit; }
  .icon svg { width: 1rem; height: 1rem; }
  .text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
  .label, .description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .label { font-size: var(--ray-font-size-sm); }
  .description { font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  mark { color: inherit; background: none; font-weight: var(--ray-font-weight-bold); text-decoration: underline; text-decoration-color: var(--ray-primary); text-underline-offset: 2px; }
  .shortcut { flex: none; display: inline-flex; gap: 0.125rem; }
  .shortcut span {
    min-width: 1.25rem;
    padding: 0 0.3rem;
    font-family: var(--ray-font-mono);
    font-size: 0.6875rem;
    line-height: 1.25rem;
    text-align: center;
    color: var(--ray-muted-foreground);
    background: var(--ray-background);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
  }
  .empty { padding: var(--ray-space-8) var(--ray-space-4); text-align: center; font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); }
  .empty[hidden] { display: none; }
  .hint { display: flex; gap: var(--ray-space-4); padding: var(--ray-space-2) var(--ray-space-4); font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); border-top: 1px solid var(--ray-border); }
  .hint b {
    display: inline-block;
    min-width: 1.25rem;
    margin-inline-end: var(--ray-space-1);
    padding: 0 0.3rem;
    font-family: var(--ray-font-mono);
    font-size: 0.6875rem;
    font-weight: var(--ray-font-weight-medium);
    line-height: 1.125rem;
    text-align: center;
    color: var(--ray-foreground);
    background: var(--ray-muted);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-sm);
  }
`;

const SEARCH_ICON = `<span data-ray-icon="ui.search" aria-hidden="true"></span>`;

/**
 * How well `action` matches `query` (0 = not at all). Every word of the query
 * must appear in order in the action's text; prefixes and word starts of the
 * label score higher.
 */
export function score(action, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const label = String(action.label ?? "").toLowerCase();
  const extra = [action.description, action.group, ...(Array.isArray(action.keywords) ? action.keywords : [action.keywords])]
    .filter(Boolean).join(" ").toLowerCase();
  let total = 0;
  for (const word of q.split(/\s+/)) {
    let s = 0;
    if (label.startsWith(word)) s = 8;
    else if (new RegExp(`(^|[\\s\\-_./])${escapeRe(word)}`).test(label)) s = 6;
    else if (label.includes(word)) s = 4;
    else if (extra.includes(word)) s = 3;
    else if (subsequence(word, label)) s = 1;
    else return 0;
    total += s;
  }
  return total;
}

/**
 * Whether `needle`'s letters appear in order in `hay`, close together
 * (within twice the needle's length): "opf" matches "open file" but "run"
 * does not match "format document".
 */
function subsequence(needle, hay) {
  if (needle.length < 2) return false;
  for (let start = hay.indexOf(needle[0]); start >= 0; start = hay.indexOf(needle[0], start + 1)) {
    let i = 1;
    let end = start;
    for (let j = start + 1; j < hay.length && i < needle.length; j++) {
      if (hay[j] === needle[i]) {
        i++;
        end = j;
      }
    }
    if (i === needle.length && end - start + 1 <= needle.length * 2) return true;
  }
  return false;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class RayCommandPalette extends RayElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    actions: { attribute: false },
    query: { type: String, default: "" },
    placeholder: { type: String, default: "Search commands…" },
    hotkey: { type: String, default: "mod+k" },
    limit: { type: Number, default: 50 },
    emptyLabel: { type: String, default: "Nothing found" },
    label: { type: String, default: "Command palette" },
    hideHint: { type: Boolean, reflect: true },
    overlayBlur: { type: String },
    nativeMenus: { type: Boolean, attribute: "native-menus", reflect: true },
  };
  static styles = [overlayStyles, styles];
  static template = `
    <dialog part="dialog">
      <div class="search" part="search">${SEARCH_ICON}<input id="input" part="input" role="combobox" aria-expanded="true" aria-controls="list" aria-autocomplete="list" autocomplete="off" spellcheck="false"></div>
      <div class="list" id="list" role="listbox" part="list"></div>
      <div class="empty" part="empty" hidden></div>
      <div class="hint" part="hint"><span><b>↑↓</b> navigate</span><span><b>↵</b> run</span><span><b>esc</b> close</span></div>
      <slot name="overlay"></slot>
    </dialog>`;

  constructor() {
    super();
    this.dialog = this.$("dialog");
    this.input = this.$("input");
    this.list = this.$(".list");
    this._active = 0;
    this._shown = [];
    this._menuActions = [];
    this.input.addEventListener("input", () => {
      this.commitProperty("query", this.input.value);
      this._active = 0;
    });
    this.input.addEventListener("keydown", (e) => this._key(e));
    this.list.addEventListener("click", (e) => {
      const opt = e.target.closest(".option");
      if (opt) this._run(Number(opt.dataset.index));
    });
    this.list.addEventListener("pointermove", (e) => {
      const opt = e.target.closest(".option");
      if (opt && Number(opt.dataset.index) !== this._active) {
        this._active = Number(opt.dataset.index);
        this._paintActive();
      }
    });
    this.dialog.addEventListener("close", () => {
      if (this.open) this.commitProperty("open", false);
      this._returnFocus?.focus?.({ preventScroll: true });
      this._returnFocus = null;
      this.emit("ray-close");
    });
    this.dialog.addEventListener("click", (e) => {
      if (e.target !== this.dialog) return;
      const r = this.dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.hide();
    });
    this._onHotkey = (e) => {
      // Another palette with the same hotkey already took it: one opens, not all.
      if (e.defaultPrevented) return;
      if (this._matchesHotkey(e)) {
        e.preventDefault();
        this.toggle();
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onHotkey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onHotkey);
    if (this.dialog.open) this.dialog.close();
  }

  show() { this.open = true; }
  hide() { this.open = false; }
  toggle() { this.open = !this.open; }

  /** The actions matching the current query, best first, grouped. */
  get results() {
    const all = (Array.isArray(this.actions) ? this.actions : []).concat(this._menuActions);
    const scored = all
      .map((action, i) => ({ action, i, s: score(action, this.query ?? "") }))
      .filter((x) => x.s > 0);
    if ((this.query ?? "").trim()) scored.sort((a, b) => b.s - a.s || a.i - b.i);
    const limited = scored.slice(0, this.limit ?? 50).map((x) => x.action);
    // Keep groups together, in the order their best match appears.
    const order = [];
    for (const a of limited) if (!order.includes(a.group ?? "")) order.push(a.group ?? "");
    return order.flatMap((g) => limited.filter((a) => (a.group ?? "") === g));
  }

  update(changed) {
    if (changed.has("overlayBlur")) applyOverlayBlur(this, this.overlayBlur);
    this.input.placeholder = this.placeholder ?? "";
    this.input.setAttribute("aria-label", this.label ?? "Command palette");
    this.dialog.setAttribute("aria-label", this.label ?? "Command palette");
    if (this.input.value !== (this.query ?? "")) this.input.value = this.query ?? "";
    this.$(".hint").hidden = Boolean(this.hideHint);
    this._render();
    if (changed.has("open") || this._first === undefined) {
      this._first = false;
      if (this.open && this._exit) {
        // Reopened while animating out.
        this._exit.cancel();
        this._exit = null;
      } else if (this.open && !this.dialog.open) {
        this._returnFocus = document.activeElement;
        this.dialog.showModal();
        this.input.focus();
        this.input.select();
        this._loadMenus();
        this.emit("ray-open");
      } else if (!this.open && this.dialog.open && !this._exit) {
        this._leave();
      }
    }
  }

  /** Refreshes the native menu items (with `native-menus`); resolves to them. */
  async _loadMenus() {
    if (!this.nativeMenus || !hostCan("menu_items")) {
      if (this._menuActions.length) {
        this._menuActions = [];
        this.requestUpdate();
      }
      return [];
    }
    const host = getHost();
    let items = [];
    try {
      items = await host.menuItems();
    } catch {
      items = [];
    }
    this._menuActions = items.map((m) => ({
      id: `menu:${m.tag}`,
      label: m.title,
      group: m.menu,
      shortcut: m.shortcut ? formatHotkey(m.shortcut.replace(/\bcmd\b/i, "mod")) : "",
      disabled: !m.enabled,
      native: true,
      tag: m.tag,
      onSelect: () => host.runMenu(m.tag),
    }));
    this.requestUpdate();
    return this._menuActions;
  }

  // Animate out (panel and backdrop), then really close.
  async _leave() {
    const exit = playAll([
      play(this.dialog, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-0.25rem) scale(0.98)" }], { speed: "fast" }),
      play(this.dialog, [{ opacity: 1 }, { opacity: 0 }], { speed: "fast", pseudoElement: "::backdrop" }),
    ]);
    this._exit = exit;
    await exit.finished;
    if (this._exit !== exit) return;
    this._exit = null;
    if (!this.open && this.dialog.open) this.dialog.close();
    exit.cancel();
  }

  _render() {
    const results = this.results;
    this._shown = results;
    if (this._active >= results.length) this._active = Math.max(0, results.length - 1);
    const frag = document.createDocumentFragment();
    let group = null;
    let container = frag;
    results.forEach((a, index) => {
      const g = a.group ?? "";
      if (g !== group) {
        group = g;
        if (g) {
          const box = document.createElement("div");
          box.setAttribute("role", "group");
          const label = document.createElement("div");
          label.className = "group-label";
          label.id = `group-${index}`;
          label.setAttribute("role", "presentation");
          label.textContent = g;
          box.setAttribute("aria-labelledby", label.id);
          box.append(label);
          frag.append(box);
          container = box;
        } else {
          container = frag;
        }
      }
      container.append(this._option(a, index));
    });
    this.list.replaceChildren(frag);
    const empty = this.$(".empty");
    empty.hidden = results.length > 0;
    empty.textContent = this.emptyLabel ?? "Nothing found";
    this._paintActive();
  }

  _option(a, index) {
    const opt = document.createElement("div");
    opt.className = "option";
    opt.id = `option-${index}`;
    opt.dataset.index = String(index);
    opt.setAttribute("role", "option");
    opt.setAttribute("part", "option");
    if (a.disabled) opt.setAttribute("aria-disabled", "true");
    if (a.icon) {
      const icon = document.createElement("span");
      icon.className = "icon";
      icon.setAttribute("aria-hidden", "true");
      // A Node, a registered icon name ("file", "search"…) or any text (an emoji, "▶").
      if (a.icon instanceof Node) icon.append(a.icon);
      else if (getIcon(String(a.icon))) icon.innerHTML = getIcon(String(a.icon));
      else icon.textContent = String(a.icon);
      opt.append(icon);
    }
    const text = document.createElement("span");
    text.className = "text";
    const label = document.createElement("span");
    label.className = "label";
    appendHighlighted(label, String(a.label ?? ""), this.query ?? "");
    text.append(label);
    if (a.description) {
      const d = document.createElement("span");
      d.className = "description";
      d.textContent = a.description;
      text.append(d);
    }
    opt.append(text);
    if (a.shortcut) {
      const sc = document.createElement("span");
      sc.className = "shortcut";
      sc.setAttribute("aria-label", `Shortcut ${a.shortcut}`);
      for (const k of String(a.shortcut).split(/\s*\+\s*|\s+/).filter(Boolean)) {
        const key = document.createElement("span");
        key.textContent = k;
        sc.append(key);
      }
      opt.append(sc);
    }
    return opt;
  }

  _paintActive() {
    const opts = this.list.querySelectorAll(".option");
    opts.forEach((o) => o.setAttribute("aria-selected", String(Number(o.dataset.index) === this._active)));
    const active = this.list.querySelector(`.option[data-index="${this._active}"]`);
    if (active) {
      this.input.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    } else {
      this.input.removeAttribute("aria-activedescendant");
    }
  }

  _key(e) {
    const n = this._shown.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!n) return;
      this._active = (this._active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      this._paintActive();
    } else if (e.key === "Home" && e.ctrlKey) {
      this._active = 0;
      this._paintActive();
    } else if (e.key === "End" && e.ctrlKey) {
      this._active = Math.max(0, n - 1);
      this._paintActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this._run(this._active);
    }
  }

  _run(index) {
    const action = this._shown[index];
    if (!action || action.disabled) return;
    this.hide();
    this.emit("ray-select", { action });
    if (typeof action.onSelect === "function") action.onSelect(action);
  }

  _matchesHotkey(e) {
    return matchesHotkey(e, this.hotkey);
  }

}

/** Appends `text` to `el`, wrapping the query words found in it in <mark>. */
function appendHighlighted(el, text, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    el.textContent = text;
    return;
  }
  const lower = text.toLowerCase();
  const marks = new Array(text.length).fill(false);
  for (const w of words) {
    const at = lower.indexOf(w);
    if (at >= 0) for (let i = at; i < at + w.length; i++) marks[i] = true;
  }
  let run = "";
  let on = marks[0];
  const flush = () => {
    if (!run) return;
    if (on) {
      const m = document.createElement("mark");
      m.textContent = run;
      el.append(m);
    } else {
      el.append(run);
    }
    run = "";
  };
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== on) {
      flush();
      on = marks[i];
    }
    run += text[i];
  }
  flush();
}

define("ray-command-palette", RayCommandPalette);
