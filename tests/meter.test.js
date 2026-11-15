// page: docs/components/all.html
//
// ray-meter in the real webview: levels as CSS variables (no render), zones,
// falloff, peak hold, the clip mark, the meter role, horizontal and rtl, inset.

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

T.test("meter: falloff, hold, clip mark", async (T) => {
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
  T.eq(clips, 1, "one event until the mark is cleared");
  T.ok(m.hasAttribute("data-clipped"));
  T.ok(m.shadowRoot.querySelector(".channel").hasAttribute("data-clipped"));
  T.eq(getComputedStyle(m.shadowRoot.querySelector(".track"), "::after").backgroundColor !== "rgba(0, 0, 0, 0)", true, "a band at the top of the bar");
  m.shadowRoot.querySelector(".track").click();
  T.eq(m.clipped, false, "a click on the bar clears it");
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
  const bar = tracks(vert)[0].getBoundingClientRect();
  T.ok(ticks[0].getBoundingClientRect().right <= bar.left + 1, "the scale is on the left of the bars");
  T.ok(Math.abs(ticks[0].getBoundingClientRect().right - ticks[4].getBoundingClientRect().right) < 1, "aligned against them: the numbers line up");
  vert.marks = [{ value: 0, label: "0 dB" }];
  await T.settle();
  T.eq(vert.shadowRoot.querySelector(".tick").textContent, "0 dB");
  const ht = tracks(h)[0].getBoundingClientRect();
  T.ok(ht.width > 250 && ht.height < 20, `horizontal: a wide bar (${Math.round(ht.width)}x${Math.round(ht.height)})`);
  for (const m of [h, rtl]) m.setLevels(-27);
  T.eq(v(tracks(h)[0], "--_r"), "50%", "horizontal: -27 of -60..6 is half the bar");
  T.eq(v(tracks(rtl)[0], "--_r"), "50%");
  box.remove();
});

T.test("meter: --ray-meter-inset lines it up with a vertical slider of the same height", async (T) => {
  const box = await mount(`<div style="display: flex; align-items: flex-end; --ray-slider-length: 200px">
    <ray-slider orientation="vertical" thumb="cap" aria-label="Fader" min="-60" max="6" style="height: 200px"></ray-slider>
    <ray-meter min="-60" max="6" style="height: 200px; --ray-meter-inset: 0.4375rem"></ray-meter></div>`);
  const slider = box.querySelector("ray-slider");
  slider.marks = [0, -60];
  await T.settle();
  const [zero, bottom] = slider.shadowRoot.querySelectorAll(".mark");
  const m = box.querySelector("ray-meter");
  const t = tracks(m)[0].getBoundingClientRect();
  const mid = (r) => (r.top + r.bottom) / 2;
  T.ok(Math.abs(mid(bottom.getBoundingClientRect()) - t.bottom) < 1.5, `-60 at the bar's bottom (${mid(bottom.getBoundingClientRect())} / ${t.bottom})`);
  const at0 = t.bottom - (60 / 66) * t.height;
  T.ok(Math.abs(mid(zero.getBoundingClientRect()) - at0) < 1.5, `0 dB level with the meter's 0 dB (${mid(zero.getBoundingClientRect())} / ${at0})`);
  box.remove();
});
