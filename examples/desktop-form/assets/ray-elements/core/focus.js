// Focus helpers that see through shadow roots and slots (the flat tree), so
// components made of other components can find what is focusable.

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable=false])",
  "[tabindex]",
].join(",");

function visible(el) {
  if (typeof el.checkVisibility === "function") return el.checkVisibility({ visibilityProperty: true });
  return el.getClientRects().length > 0;
}

/**
 * Tabbable elements under `root` (an element or a shadow root), in tree
 * order, descending into open shadow roots and slotted content.
 * @returns {HTMLElement[]}
 */
export function tabbables(root, { lightOnly = false } = {}) {
  const out = [];
  const walk = (node) => {
    for (const child of childrenOf(node)) {
      if (!(child instanceof HTMLElement)) continue;
      if (child.matches(FOCUSABLE) && child.tabIndex >= 0 && !child.hasAttribute("inert") && visible(child)) {
        out.push(child);
      }
      if (child.hasAttribute("inert")) continue;
      walk(child);
    }
  };
  if (lightOnly) {
    // Only the root's own (slotted) content, not its shadow root.
    for (const child of root.children) {
      if (!(child instanceof HTMLElement) || child.hasAttribute("inert")) continue;
      if (child.matches(FOCUSABLE) && child.tabIndex >= 0 && visible(child)) out.push(child);
      walk(child);
    }
  } else {
    walk(root);
  }
  return out;
}

function childrenOf(node) {
  if (node instanceof HTMLSlotElement) return node.assignedElements({ flatten: true });
  if (node instanceof Element && node.shadowRoot) return [...node.shadowRoot.children];
  return [...node.children];
}

/**
 * Focuses the first [autofocus] or tabbable element; returns whether
 * something got focus. `lightOnly`: look only at a host's own content.
 */
export function focusFirst(root, { lightOnly = false } = {}) {
  const auto = root.querySelector?.("[autofocus]");
  const target = auto ?? tabbables(root, { lightOnly })[0];
  if (!target) return false;
  target.focus({ preventScroll: true });
  return true;
}
