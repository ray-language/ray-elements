// page: tests/pages/narrow.html
//
// ray-segmented-control and ray-button in containers narrower than their
// labels: they stay inside, end their text in an ellipsis, stack (the
// segmented control's orientation="auto") or wrap (the button's wrap).

const T = window.__rayTest;
await Promise.all(["ray-button", "ray-segmented-control"].map((t) => customElements.whenDefined(t)));

async function mount(html, width) {
  const box = document.createElement("div");
  box.style.width = `${width}px`;
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  await T.settle();
  return box;
}
const inside = (el, box, msg) => {
  const r = el.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  T.ok(r.left >= b.left - 0.5 && r.right <= b.right + 0.5, `${msg}: ${Math.round(r.left - b.left)}..${Math.round(r.right - b.left)} in ${Math.round(b.width)}`);
};
const OPTIONS = `<option>Normal</option><option>Grande</option><option>Muy grande</option>`;

T.test("segmented: full-width in a narrow box shrinks its options and ends labels in an ellipsis", async (T) => {
  const box = await mount(`<ray-segmented-control full-width size="md" value="Muy grande">${OPTIONS}</ray-segmented-control>`, 200);
  const sc = box.firstElementChild;
  const root = sc.shadowRoot.querySelector(".root");
  inside(root, box, "the row");
  const labels = [...sc.shadowRoot.querySelectorAll(".label")];
  const chosen = sc.shadowRoot.querySelector('[aria-checked="true"]');
  inside(chosen, box, "the chosen option");
  T.ok(labels.some((l) => l.scrollWidth > l.clientWidth + 1), "some label is cut");
  T.eq(getComputedStyle(labels[0]).textOverflow, "ellipsis");
  T.eq(chosen.textContent, "Muy grande", "the accessible name keeps the whole label");
  box.remove();
});

T.test("segmented: without full-width it also stays inside a narrow box", async (T) => {
  const box = await mount(`<ray-segmented-control size="md">${OPTIONS}</ray-segmented-control>`, 180);
  inside(box.firstElementChild.shadowRoot.querySelector(".root"), box, "the row");
  box.remove();
});

T.test("segmented: control-selected and label parts", async (T) => {
  const box = await mount(`<ray-segmented-control value="Muy grande">${OPTIONS}</ray-segmented-control>`, 400);
  const sc = box.firstElementChild;
  const buttons = [...sc.shadowRoot.querySelectorAll("button")];
  T.eq(buttons.map((b) => b.getAttribute("part")).join("|"), "control|control|control control-selected");
  T.eq(buttons[0].querySelector(".label").getAttribute("part"), "label");
  sc.value = "Normal";
  await T.settle();
  T.eq(buttons[0].getAttribute("part"), "control control-selected", "the part follows the value");
  T.eq(buttons[2].getAttribute("part"), "control");
  box.remove();
});

T.test("segmented: orientation=auto stacks when the options do not fit, and goes back to a row", async (T) => {
  const box = await mount(`<ray-segmented-control orientation="auto" full-width size="md">${OPTIONS}</ray-segmented-control>`, 420);
  const sc = box.firstElementChild;
  const root = sc.shadowRoot.querySelector(".root");
  T.eq(sc.hasAttribute("data-stacked"), false, "room enough: a row");
  T.eq(root.getAttribute("aria-orientation"), "horizontal");
  box.style.width = "180px";
  sc._layout();   // what the ResizeObserver does (no frames in a hidden window)
  await T.settle();
  T.eq(sc.hasAttribute("data-stacked"), true, "narrow: stacked");
  T.eq(root.getAttribute("aria-orientation"), "vertical");
  T.eq(getComputedStyle(root).flexDirection, "column");
  const labels = [...sc.shadowRoot.querySelectorAll(".label")];
  T.ok(labels.every((l) => l.scrollWidth <= l.clientWidth + 1), "stacked: no label is cut");
  inside(root, box, "the stack");
  box.style.width = "420px";
  sc._layout();
  await T.settle();
  T.eq(sc.hasAttribute("data-stacked"), false, "wide again: a row");
  box.remove();
});

T.test("button: a long label in a narrow box ends in an ellipsis; wrap breaks it into lines", async (T) => {
  const text = "Otra pauta (p. ej. otra dosis el fin de semana)";
  const box = await mount(`<ray-button>${text}</ray-button><ray-button full-width>${text}</ray-button><ray-button wrap full-width>${text}</ray-button>`, 200);
  const [plain, full, wrapped] = box.children;
  for (const [b, name] of [[plain, "plain"], [full, "full-width"], [wrapped, "wrap"]]) {
    inside(b.shadowRoot.querySelector(".button"), box, name);
  }
  const slot = full.shadowRoot.querySelector(".label > slot");
  T.eq(getComputedStyle(slot).textOverflow, "ellipsis");
  T.ok(slot.scrollWidth > slot.clientWidth + 1, "cut");
  const h = (b) => b.shadowRoot.querySelector(".button").getBoundingClientRect().height;
  T.eq(Math.round(h(full)), Math.round(h(plain)), "one line keeps the size's height");
  T.ok(h(wrapped) > h(full) + 8, `wrap grows to several lines: ${h(wrapped)} > ${h(full)}`);
  T.ok(h(wrapped) >= h(full), "never below the size's height");
  T.eq(wrapped.getAttribute("wrap"), "", "reflected");
  box.remove();
});

T.test("button: a short label, an icon and wrap keep the usual height and centering", async (T) => {
  const box = await mount(`<ray-button>Save</ray-button><ray-button wrap>Save</ray-button>`, 400);
  const [a, b] = box.children;
  const h = (x) => Math.round(x.shadowRoot.querySelector(".button").getBoundingClientRect().height);
  T.eq(h(b), h(a), "wrap does not change a one-line button");
  const slot = a.shadowRoot.querySelector(".label > slot");
  T.ok(slot.scrollWidth <= slot.clientWidth + 1, "not cut when it fits");
  box.remove();
});

T.test("segmented: with room, no label is cut, whatever their lengths", async (T) => {
  const box = await mount(`<ray-segmented-control value="m"><option value="m">Monthly</option><option value="y">Yearly · save 20%</option></ray-segmented-control>` +
    `<ray-segmented-control full-width value="a"><option value="a">A</option><option value="b">A much longer option</option><option value="c">C</option></ray-segmented-control>`, 500);
  for (const sc of box.children) {
    T.eq(sc.hasAttribute("data-tight"), false, "not tight");
    const labels = [...sc.shadowRoot.querySelectorAll(".label")];
    T.ok(labels.every((l) => l.scrollWidth <= l.clientWidth + 1), labels.map((l) => `${l.scrollWidth}/${l.clientWidth}`).join(" "));
  }
  box.remove();
});

T.test("grid and flex parents shrink them too (min-width: 0)", async (T) => {
  for (const display of ["grid", "flex"]) {
    const box = await mount(
      `<ray-segmented-control full-width size="md" value="Muy grande">${OPTIONS}</ray-segmented-control>` +
      `<ray-button full-width>Otra pauta (p. ej. otra dosis el fin de semana)</ray-button>` +
      `<ray-button>Agregar medicamento</ray-button>`, 200);
    box.style.display = display;
    box.style.flexDirection = "column";
    box.style.alignItems = "start";
    const [sc, full, plain] = box.children;
    sc._layout();
    await T.settle();
    inside(sc.shadowRoot.querySelector(".root"), box, `${display}: the segmented row`);
    inside(full.shadowRoot.querySelector(".button"), box, `${display}: the full-width button`);
    inside(plain.shadowRoot.querySelector(".button"), box, `${display}: the button`);
    box.remove();
  }
});
