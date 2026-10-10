// Light dismiss for floating panels shown as popover="manual": what
// popover="auto" does (outside click, Escape, one open at a time unless
// nested), done here so the component decides how to close — and can
// animate the exit, which an automatic close would not allow.
//
//   const stop = dismissable({ panel, owner: this, trigger, close: (reason) => … });
//   stop();  // when the panel closed
//
// Escape closes the topmost panel and is consumed (preventDefault), so a
// dialog underneath stays open. A pointer press outside a panel (and its
// owner and trigger) closes it and every panel above it.

const stack = [];

/** Whether `node` is inside `container`, crossing shadow roots and slots. */
function within(container, node) {
  for (let n = node; n; n = n.assignedSlot ?? n.parentNode ?? n.host) {
    if (n === container) return true;
  }
  return false;
}

function inside(entry, path) {
  return path.some((n) => n === entry.panel || n === entry.owner || (entry.trigger && n === entry.trigger));
}

function onPointer(e) {
  if (!stack.length) return;
  const path = e.composedPath();
  let keep = -1;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (inside(stack[i], path)) {
      keep = i;
      break;
    }
  }
  for (let i = stack.length - 1; i > keep; i--) stack[i].close("outside");
}

function onKey(e) {
  if (e.key !== "Escape" || !stack.length || e.defaultPrevented) return;
  e.preventDefault();
  stack[stack.length - 1].close("escape");
}

/**
 * Registers an open panel. Panels that do not contain the new one's owner
 * close (one open at a time, nested ones excepted).
 * @param {{ panel: Element, owner: Element, trigger?: Element | null, close: (reason: "outside" | "escape" | "replaced") => void }} entry
 * @returns {() => void} unregisters it
 */
export function dismissable(entry) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (!within(stack[i].panel, entry.owner)) stack[i].close("replaced");
  }
  if (!stack.length) {
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
  }
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
    if (!stack.length) {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    }
  };
}
