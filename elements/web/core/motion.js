// Motion helpers: exit animations (the CSS keyframes cover the entries) and
// height changes, with the Web Animations API so a component can wait for an
// animation to end before it really hides an element (dialog.close(),
// hidePopover(), remove()).
//
// Durations and easings come from the tokens (--ray-duration-*,
// --ray-easing-*). No motion — and an immediate result — when the user asks
// for reduced motion, when the duration token is 0, or when the page is not
// visible (hidden windows do not run animations).

const reduced = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

/** A duration token of `el` in milliseconds ("fast" | "base" | "slow"). */
export function duration(el, name = "base") {
  const v = getComputedStyle(el).getPropertyValue(`--ray-duration-${name}`).trim();
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : v.endsWith("ms") ? n : n * 1000;
}

/** An easing token of `el` ("standard" | "in" | "out"). */
export function easing(el, name = "in") {
  return getComputedStyle(el).getPropertyValue(`--ray-easing-${name}`).trim() || "ease";
}

/** Whether animations should run for `el` now. */
export function motionAllowed(el, name = "base") {
  return !reduced?.matches && document.visibilityState === "visible" && duration(el, name) > 0 && typeof el.animate === "function";
}

/**
 * Plays `keyframes` on `el` (optionally its ::backdrop) and resolves when it
 * ends — at once when motion is not allowed. The final frame stays applied
 * (fill: forwards) until `cancel()`: call it once the element is hidden.
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function play(el, keyframes, { speed = "base", ease = "in", pseudoElement } = {}) {
  if (!motionAllowed(el, speed)) return { finished: Promise.resolve(), cancel() {} };
  const ms = duration(el, speed);
  let anim;
  try {
    anim = el.animate(keyframes, { duration: ms, easing: easing(el, ease), fill: "forwards", ...(pseudoElement ? { pseudoElement } : {}) });
  } catch {
    return { finished: Promise.resolve(), cancel() {} };
  }
  // A throttled or suspended timeline must not keep the element open forever.
  const guard = new Promise((r) => setTimeout(r, ms + 150));
  return {
    finished: Promise.race([anim.finished.then(() => {}, () => {}), guard]),
    cancel: () => anim.cancel(),
  };
}

/** Plays several animations; resolves when all ended. */
export function playAll(list) {
  return { finished: Promise.all(list.map((a) => a.finished)).then(() => {}), cancel: () => list.forEach((a) => a.cancel()) };
}

/** Fades and shrinks an element to nothing (height, margins, padding), then resolves. */
export function collapseOut(el, { speed = "base" } = {}) {
  const cs = getComputedStyle(el);
  const h = el.getBoundingClientRect().height;
  return play(el, [
    { height: `${h}px`, opacity: 1, marginTop: cs.marginTop, marginBottom: cs.marginBottom, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, overflow: "hidden" },
    { height: "0px", opacity: 0, marginTop: "0px", marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px", overflow: "hidden" },
  ], { speed });
}

/** The exit of a floating panel (menus, popovers, dropdowns, tooltips). */
export const POP_OUT = [
  { opacity: 1, transform: "none" },
  { opacity: 0, transform: "scale(0.97)" },
];
