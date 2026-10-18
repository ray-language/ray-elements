// The writing direction, for what CSS does not mirror by itself: arrow keys
// and pointer or scroll coordinates. Read when used (not cached), so a
// change of dir takes effect at once.

/** Whether `el` lays out right to left (dir="rtl" on it or an ancestor). */
export function isRtl(el) {
  return getComputedStyle(el).direction === "rtl";
}

/**
 * An arrow key as the reading direction sees it. Right to left, ArrowLeft
 * moves forward, so it comes back as "ArrowRight", and ArrowRight as
 * "ArrowLeft"; any other key as it is.
 *   if (inlineKey(e.key, this) === "ArrowRight") this.next();
 */
export function inlineKey(key, el) {
  if ((key === "ArrowLeft" || key === "ArrowRight") && isRtl(el)) return key === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
  return key;
}
