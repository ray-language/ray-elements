// page: docs/foundations.html
//
// Tokens, theme API and <ray-theme-toggle> in the real webview. The body runs
// inside an async function: `await` and dynamic import() are available.

const T = window.__rayTest;
const core = await import("../src/core/core.js");
await customElements.whenDefined("ray-theme-toggle");
const root = document.documentElement;
const toggle = document.querySelector("ray-theme-toggle");
const button = () => toggle.shadowRoot.querySelector("button");

// Start from a known state whatever a previous run persisted.
core.setTheme("light");
core.setPrimary(null);
await T.settle();

T.test("light background is white", (T) => {
  T.eq(T.computed("background: var(--ray-background)"), "rgb(255, 255, 255)");
});

T.test("toggle cycles light -> dark -> system", async (T) => {
  button().click();
  await T.settle();
  T.eq(root.dataset.theme, "dark");
  T.eq(T.computed("background: var(--ray-background)"), "rgb(20, 20, 20)", "dark background");
  T.eq(button().getAttribute("aria-label"), "Dark theme (switch to system)");
  button().click();
  await T.settle();
  T.eq(root.hasAttribute("data-theme"), false, "system removes data-theme");
  T.eq(core.getTheme(), "system");
});

T.test("theme is persisted", (T) => {
  core.setTheme("dark");
  T.eq(localStorage.getItem("ray-ds:theme"), "dark");
  core.setTheme("system");
  T.eq(localStorage.getItem("ray-ds:theme"), null);
});

T.test("subtree theme overrides the document", (T) => {
  core.setTheme("dark");
  T.eq(T.computed("background: var(--ray-background)", "background-color", 'data-theme="light"'), "rgb(255, 255, 255)");
  core.setTheme("light");
  T.eq(T.computed("background: var(--ray-background)", "background-color", 'data-theme="dark"'), "rgb(20, 20, 20)");
});

T.test("setPrimary switches every primary-derived token", (T) => {
  core.setPrimary("violet");
  T.eq(root.dataset.primary, "violet");
  T.eq(T.computed("background: var(--ray-primary)"), "rgb(103, 65, 217)", "primary = violet.8");
  T.eq(T.computed("color: var(--ray-primary-foreground)", "color"), "rgb(255, 255, 255)");
  core.setPrimary(null);
  T.eq(T.computed("background: var(--ray-primary)"), "rgb(25, 113, 194)", "back to blue.8");
});

T.test("subtree primary: dark text on yellow, white on deep teal", (T) => {
  T.eq(T.computed("background: var(--ray-primary)", "background-color", 'data-primary="yellow"'), "rgb(252, 196, 25)");
  T.eq(T.computed("color: var(--ray-primary-foreground)", "color", 'data-primary="yellow"'), "rgb(0, 0, 0)");
  T.eq(T.computed("background: var(--ray-primary)", "background-color", 'data-primary="teal"'), "rgb(8, 127, 91)", "teal.9");
  T.eq(T.computed("color: var(--ray-primary-foreground)", "color", 'data-primary="teal"'), "rgb(255, 255, 255)");
});

T.test("size attribute reflects and resizes", async (T) => {
  toggle.size = "lg";
  await T.settle();
  T.eq(toggle.getAttribute("size"), "lg");
  T.eq(getComputedStyle(button()).height, "50px");
  toggle.removeAttribute("size");
  await T.settle();
  T.eq(toggle.size, "sm", "removed attribute -> default");
  T.eq(getComputedStyle(button()).height, "36px", "default sm");
});

T.test("property set before upgrade is applied", async (T) => {
  const el = document.createElement("ray-theme-toggle-late");
  el.size = "xs";
  document.body.append(el);
  const { RayThemeToggle } = await import("../src/components/theme-toggle/theme-toggle.js");
  customElements.define("ray-theme-toggle-late", class extends RayThemeToggle {});
  await T.settle();
  T.eq(el.getAttribute("size"), "xs");
  el.remove();
});

// Leave the page as a user would find it.
T.test("cleanup", () => {
  core.setTheme("system");
  core.setPrimary(null);
});
