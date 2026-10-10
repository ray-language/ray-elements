// Which element scrolls the page an element sits on, and the direction of
// its scrolling: for the bars that hide while scrolling down and come back
// on the way up (ray-app-bar, ray-bottom-nav).

/**
 * The scroller of `el`: `target` (an element or a selector) when given,
 * else the content of the ray-app-shell or ray-scroll-area around it, else
 * the window.
 * @param {Element} el
 * @param {Element | string | null | undefined} target
 * @returns {Element | Window}
 */
export function scrollerOf(el, target) {
  if (target instanceof Element) return target;
  if (typeof target === "string" && target) {
    const found = document.querySelector(target);
    if (found) return found.viewport ?? found.scroller ?? found;
  }
  for (let n = el; n; n = n.parentElement ?? n.getRootNode()?.host) {
    if (n.localName === "ray-app-shell" && n.scroller) return n.scroller;
    if (n.localName === "ray-scroll-area" && n !== el && n.viewport) return n.viewport;
  }
  return window;
}

/**
 * Calls `cb({ y, direction })` as `scroller` scrolls, once per frame;
 * direction is "down" or "up" past `tolerance` px, else unchanged.
 * Returns a function that stops listening.
 * @param {Element | Window} scroller
 * @param {(state: { y: number, direction: "up" | "down" }) => void} cb
 */
export function watchScroll(scroller, cb, { tolerance = 8 } = {}) {
  const top = () => (scroller === window ? window.scrollY : /** @type {Element} */ (scroller).scrollTop);
  let last = top();
  let direction = "up";
  let frame = 0;
  const run = () => {
    frame = 0;
    const y = Math.max(0, top());
    if (Math.abs(y - last) >= tolerance) {
      direction = y > last ? "down" : "up";
      last = y;
    }
    if (y <= 0) { direction = "up"; last = 0; }
    cb({ y, direction });
  };
  const onScroll = () => {
    // A hidden page runs no frames: no need to wait for one.
    if (document.visibilityState === "hidden") return run();
    if (!frame) frame = requestAnimationFrame(run);
  };
  scroller.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    scroller.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}
