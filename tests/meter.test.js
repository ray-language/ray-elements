// page: docs/components/all.html
//
// ray-meter in the real webview: levels as CSS variables (no render), zones,
// falloff, peak hold, clip light, the meter role, horizontal and rtl.

const T = window.__rayTest;
await customElements.whenDefined("ray-meter");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const tracks = (m) => [...m.shadowRoot.querySelectorAll(".track")];
const v = (el, name) => el.style.getPropertyValue(name);

T.test("meter: channels, levels in dB as percentages, zones, the meter role", async (T) => {
  const box = await mount(`<ray-meter channels="2" min="-60" max="0" warn="-12" danger="-3" falloff="0" style="height: 200px"></ray-meter>`);
  const m = box.firstElementChild;
  const [l, r] = tracks(m);
  T.eq(tracks(m).length, 2);
  T.eq(v(l, "--_warn"), "80%", "the yellow zone starts at -12 of -60..0");
  T.eq(v(l, "--_danger"), "95%");
  m.setLevels([-30, -Infinity], [-36, -Infinity]);
  T.eq(v(l, "--_p"), "50%", "-30 dB is half way");
  T.eq(v(l, "--_r"), "40%");
  T.eq(v(r, "--_p"), "0%", "silence");
  T.ok(Math.round(l.getBoundingClientRect().height) > 150, "the bar fills the host's height");
  const role = m.shadowRoot.querySelector("[role=meter]");
  T.eq(role.getAttribute("aria-label"), "Level");
  T.eq(role.getAttribute("aria-valuenow"), "-30");
  T.eq(role.getAttribute("aria-valuetext"), "-30 dB");
  m.setLevels(-80);
  m.reset();
  T.eq(role.getAttribute("aria-valuetext"), "Silence");
  T.eq(v(r, "--_p"), "0%", "a number is every channel's");
  box.remove();
});

T.test("meter: falloff, hold, clip light", async (T) => {
  const box = await mount(`<ray-meter min="-60" max="6" falloff="20" hold="10000"></ray-meter>`);
  const m = box.firstElementChild;
  const [t] = tracks(m);
  const hold = m.shadowRoot.querySelector(".hold");
  let clips = 0;
  m.addEventListener("ray-clip", () => clips++);
  m.setLevels(-6);
  const top = parseFloat(v(t, "--_p"));
  await new Promise((r) => setTimeout(r, 100));
  m.setLevels(-60);
  const after = parseFloat(v(t, "--_p"));
  T.ok(after < top && after > top - 10, `falls slowly (${top} -> ${after})`);
  T.ok(!hold.hidden, "the hold line shows");
  T.eq(v(t, "--_h"), `${top}%`, "and keeps the peak");
  T.eq(m.clipped, false);
  m.setLevels(1);
  m.setLevels(2);
  T.eq(m.clipped, true);
  T.eq(clips, 1, "one event until the light is cleared");
  T.ok(m.hasAttribute("data-clipped"));
  m.shadowRoot.querySelector(".led").click();
  T.eq(m.clipped, false, "a click on the light clears it");
  T.ok(!m.shadowRoot.querySelector(".channel").hasAttribute("data-clipped"));
  box.remove();
});

T.test("meter: scale, marks, horizontal and rtl", async (T) => {
  const box = await mount(`<ray-meter scale min="-24" max="6" style="height: 300px"></ray-meter>
    <div style="width: 300px"><ray-meter orientation="horizontal" falloff="0"></ray-meter></div>
    <div dir="rtl" style="width: 300px"><ray-meter orientation="horizontal" falloff="0"></ray-meter></div>`);
  const [vert, h, rtl] = box.querySelectorAll("ray-meter");
  T.eq([...vert.shadowRoot.querySelectorAll(".tick")].map((t) => t.textContent).join(), "6,0,-6,-12,-24", "the scale within min and max");
  const ticks = vert.shadowRoot.querySelectorAll(".tick");
  T.ok(ticks[0].getBoundingClientRect().top < ticks[4].getBoundingClientRect().top, "louder is higher");
  vert.marks = [{ value: 0, label: "0 dB" }];
  await T.settle();
  T.eq(vert.shadowRoot.querySelector(".tick").textContent, "0 dB");
  const ht = tracks(h)[0].getBoundingClientRect();
  T.ok(ht.width > 250 && ht.height < 20, `horizontal: a wide bar (${Math.round(ht.width)}x${Math.round(ht.height)})`);
  for (const m of [h, rtl]) m.setLevels(-27);
  T.eq(v(tracks(h)[0], "--_r"), "50%", "horizontal: -27 of -60..6 is half the bar");
  T.eq(v(tracks(rtl)[0], "--_r"), "50%");
  const hl = h.shadowRoot.querySelector(".led").getBoundingClientRect();
  const rl = rtl.shadowRoot.querySelector(".led").getBoundingClientRect();
  T.ok(hl.left > tracks(h)[0].getBoundingClientRect().left, "ltr: the clip light at the right end");
  T.ok(rl.right <= tracks(rtl)[0].getBoundingClientRect().left + 1, "rtl: at the left end");
  box.remove();
});
