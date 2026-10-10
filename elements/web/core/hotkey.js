// Keyboard shortcuts written as "mod+k", "shift+alt+p", "/": `mod` is ⌘ on
// macOS and Ctrl elsewhere. Shared by the command palette and ray-search.

export const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

function parse(spec) {
  const parts = String(spec ?? "").toLowerCase().trim().split("+").map((s) => s.trim());
  const key = parts.pop() ?? "";
  const want = { meta: false, ctrl: false, alt: false, shift: false };
  for (const p of parts) {
    if (p === "mod") want[IS_MAC ? "meta" : "ctrl"] = true;
    else if (p === "cmd" || p === "meta") want.meta = true;
    else if (p === "ctrl" || p === "control") want.ctrl = true;
    else if (p === "alt" || p === "option") want.alt = true;
    else if (p === "shift") want.shift = true;
  }
  return { key, want };
}

/** Whether a keydown event is the shortcut `spec` (repeats never match). */
export function matchesHotkey(e, spec) {
  const { key, want } = parse(spec);
  if (!key || e.repeat) return false;
  return e.key.toLowerCase() === key && e.metaKey === want.meta && e.ctrlKey === want.ctrl && e.altKey === want.alt && e.shiftKey === want.shift;
}

/** The shortcut as shown to the user: "⌘K" on macOS, "Ctrl K" elsewhere. */
export function formatHotkey(spec) {
  const { key, want } = parse(spec);
  if (!key) return "";
  const k = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1);
  if (IS_MAC) return `${want.ctrl ? "⌃" : ""}${want.alt ? "⌥" : ""}${want.shift ? "⇧" : ""}${want.meta ? "⌘" : ""}${k}`;
  return [want.ctrl && "Ctrl", want.alt && "Alt", want.shift && "Shift", want.meta && "Meta", k].filter(Boolean).join(" ");
}

/** True when the event comes from a place where typing is expected. */
export function isTyping(e) {
  const t = e.composedPath?.()[0] ?? e.target;
  return Boolean(t?.isContentEditable || (t?.localName === "input" && !["checkbox", "radio", "button"].includes(t.type)) || t?.localName === "textarea" || t?.localName === "select");
}
