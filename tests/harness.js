// Test API injected by `ray run tools/src/main.ray webtest` into the page
// under test, before the test file. A test file registers cases with
// T.test(name, async (T) => { ... }); the runner sends the results back to the
// raylang program through window.ray.send.
(() => {
  const CASE_TIMEOUT_MS = 10000;
  const cases = [];
  const errors = [];
  window.addEventListener("error", (e) => errors.push(String(e.message || e)));
  window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason)));

  const show = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));

  // No motion: the hidden test window does not advance animations nor
  // transitions, and the tests check behavior, not motion. Zero durations
  // turn the exit animations off (core/motion.js) and make the token-driven
  // transitions instant.
  const still = document.createElement("style");
  still.textContent = ":root { --ray-duration-fast: 0s !important; --ray-duration-base: 0s !important; --ray-duration-slow: 0s !important; }";
  (document.head ?? document.documentElement).append(still);

  const T = {
    test(name, fn) {
      cases.push({ name, fn });
    },
    eq(got, want, msg = "") {
      if (!Object.is(got, want)) {
        throw new Error(`${msg ? msg + ": " : ""}got ${show(got)}, want ${show(want)}`);
      }
    },
    ok(value, msg = "expected a truthy value") {
      if (!value) throw new Error(msg);
    },
    /**
     * Resolves after pending microtasks (component updates) and a macrotask.
     * Neither requestAnimationFrame nor setTimeout: a webview window that is
     * not visible (opened by `ray run` from a non-GUI shell) never runs frame
     * callbacks, and after a few seconds WebKit runs its timers once per
     * second. A MessageChannel task is not throttled.
     */
    settle() {
      return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(0);
      });
    },
    /**
     * Computed value of `prop` on a probe element styled with `style`,
     * optionally inside a wrapper with `attrs` (e.g. 'data-theme="dark"').
     */
    computed(style, prop = "background-color", attrs = "") {
      const host = document.createElement("div");
      host.innerHTML = `<div ${attrs}><div data-probe style="${style}"></div></div>`;
      document.body.append(host);
      const v = getComputedStyle(host.querySelector("[data-probe]")).getPropertyValue(prop);
      host.remove();
      return v;
    },
    async run() {
      const results = [];
      for (const c of cases) {
        // Tells the runner which case is running (reported if the file hangs).
        window.ray?.send("ray-case:" + c.name);
        // Whatever a case appends to <body> is removed after it, passed or failed,
        // so a failing case cannot leave (say) a modal open for the next ones.
        const before = new Set(document.body.children);
        try {
          // A case that never settles fails alone instead of hanging the file.
          let timer;
          const limit = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS);
          });
          await Promise.race([c.fn(T), limit]).finally(() => clearTimeout(timer));
          results.push({ name: c.name, ok: true, error: "" });
        } catch (e) {
          results.push({ name: c.name, ok: false, error: String((e && e.message) || e) });
        }
        for (const el of [...document.body.children]) {
          if (!before.has(el)) el.remove();
        }
      }
      if (errors.length) {
        results.push({ name: "no page errors", ok: false, error: errors.join(" | ") });
      }
      return results;
    },
  };
  window.__rayTest = T;
})();
