// page: tests/pages/image-crop.html
//
// <ray-image-crop>: loading (Blob, errors), the framing as a rectangle of
// the original, the keyboard, pointer drags, the zoom slider, export, and
// the events.

const T = window.__rayTest;
await customElements.whenDefined("ray-image-crop");
const { parseAspect } = await import("../../src/components/image-crop/image-crop.js");

// A 400×200 picture: the left half red, the right half blue.
function picture(width = 400, height = 200) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const g = c.getContext("2d");
  g.fillStyle = "#ff0000";
  g.fillRect(0, 0, width / 2, height);
  g.fillStyle = "#0000ff";
  g.fillRect(width / 2, 0, width / 2, height);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

async function mount(html, src) {
  const box = document.createElement("div");
  box.style.width = "240px";
  box.innerHTML = html;
  document.body.append(box);
  const el = box.firstElementChild;
  if (src !== undefined) el.src = src;
  await T.settle();
  await el.ready;
  await T.settle();
  return el;
}
const inner = (el, sel) => el.shadowRoot.querySelector(sel);
const key = (el, k, opts = {}) => inner(el, ".stage").dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
const round = (r) => r && { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
const rectText = (r) => JSON.stringify(round(r));
const pixel = (canvas, x, y) => [...canvas.getContext("2d").getImageData(x, y, 1, 1).data.slice(0, 3)];

T.test("image-crop: parseAspect", async (T) => {
  T.eq(parseAspect("1"), 1);
  T.eq(parseAspect("16/9"), 16 / 9);
  T.eq(parseAspect("4:3"), 4 / 3);
  T.eq(parseAspect("1.5"), 1.5);
  T.eq(parseAspect(2), 2);
  T.eq(parseAspect("wide"), 1, "anything else is 1");
  T.eq(parseAspect("0/3"), 1, "not a positive ratio");
});

T.test("image-crop: a Blob loads; at zoom 1 the frame covers the short side, centered", async (T) => {
  const loads = [];
  const el = await mount(`<ray-image-crop></ray-image-crop>`);
  T.eq(el.getAttribute("data-state"), "empty");
  T.eq(el.crop, null, "no crop without an image");
  T.eq(el.toDataURL(), "", "nothing to export");
  el.addEventListener("ray-load", (e) => loads.push(e.detail));
  el.src = await picture();
  T.eq(await el.ready, true, "ready right after assigning src waits for that image");
  await T.settle();
  T.eq(el.getAttribute("data-state"), "ready");
  T.eq(el.loaded, true);
  T.eq(JSON.stringify(loads), '[{"width":400,"height":200}]', "ray-load with the original size");
  T.eq(el.naturalWidth, 400);
  T.eq(rectText(el.crop), '{"x":100,"y":0,"width":200,"height":200}');
  const stage = inner(el, ".stage");
  T.eq(stage.getAttribute("role"), "slider");
  T.eq(stage.getAttribute("aria-valuetext"), "Zoom 100%");
  T.eq(stage.getAttribute("aria-label"), "Crop image");
  el.parentElement.remove();
});

T.test("image-crop: aspect 2 frames the width of a tall image", async (T) => {
  const el = await mount(`<ray-image-crop aspect="2"></ray-image-crop>`, await picture(200, 400));
  T.eq(rectText(el.crop), '{"x":0,"y":150,"width":200,"height":100}');
  el.parentElement.remove();
});

T.test("image-crop: crop set before loading frames that rectangle; it is clamped to the image", async (T) => {
  const box = document.createElement("div");
  box.style.width = "240px";
  box.innerHTML = `<ray-image-crop></ray-image-crop>`;
  document.body.append(box);
  const el = box.firstElementChild;
  el.crop = { x: 0, y: 0, width: 100, height: 100 };
  el.src = await picture();
  await T.settle();
  await el.ready;
  await T.settle();
  T.eq(rectText(el.crop), '{"x":0,"y":0,"width":100,"height":100}');
  T.eq(el.zoom, 2);
  el.crop = { x: 380, y: 150, width: 100, height: 100 };
  T.eq(rectText(el.crop), '{"x":300,"y":100,"width":100,"height":100}', "no gap in the frame");
  el.crop = { x: 0, y: 0, width: 10, height: 10 };
  T.eq(el.zoom, 4, "kept at max-zoom");
  box.remove();
});

T.test("image-crop: keyboard moves and zooms, with input then change", async (T) => {
  const el = await mount(`<ray-image-crop></ray-image-crop>`, await picture());
  const seen = [];
  el.addEventListener("input", () => seen.push("input"));
  el.addEventListener("change", () => seen.push("change"));
  const x0 = el.crop.x;
  key(el, "ArrowRight", { shiftKey: true });
  await T.settle();
  T.ok(el.crop.x < x0, `the picture moved right: x ${el.crop.x} < ${x0}`);
  T.eq(seen.join(), "input,change");
  key(el, "+");
  await T.settle();
  T.eq(Math.round(el.zoom * 100), 110, "+ zooms 10%");
  key(el, "End");
  await T.settle();
  T.eq(el.zoom, 4);
  T.eq(inner(el, ".stage").getAttribute("aria-valuenow"), "400");
  key(el, "-");
  await T.settle();
  T.eq(Math.round(el.zoom * 100), 390);
  key(el, "0");
  await T.settle();
  T.eq(rectText(el.crop), '{"x":100,"y":0,"width":200,"height":200}', "0 resets");
  el.disabled = true;
  await T.settle();
  key(el, "End");
  await T.settle();
  T.eq(el.zoom, 1, "disabled: no zoom");
  T.eq(inner(el, ".stage").tabIndex, -1);
  el.parentElement.remove();
});

T.test("image-crop: a pointer drag moves the picture and fires change on release", async (T) => {
  const el = await mount(`<ray-image-crop></ray-image-crop>`, await picture());
  const stage = inner(el, ".stage");
  const r = stage.getBoundingClientRect();
  const seen = [];
  el.addEventListener("input", () => seen.push("input"));
  el.addEventListener("change", () => seen.push("change"));
  const at = (type, dx) => stage.dispatchEvent(new PointerEvent(type, {
    pointerId: 7, pointerType: "mouse", button: 0, buttons: 1, bubbles: true, cancelable: true,
    clientX: r.left + r.width / 2 + dx, clientY: r.top + r.height / 2,
  }));
  const x0 = el.crop.x;
  at("pointerdown", 0);
  at("pointermove", 20);
  at("pointermove", 40);
  at("pointerup", 40);
  await T.settle();
  T.ok(el.crop.x < x0, `dragged right: x ${el.crop.x} < ${x0}`);
  T.eq(seen.join(), "input,input,change");
  el.parentElement.remove();
});

T.test("image-crop: the zoom slider zooms; its own events stay inside", async (T) => {
  const el = await mount(`<ray-image-crop zoom-control max-zoom="3" zoom-label="Acercar"></ray-image-crop>`, await picture());
  const slider = inner(el, ".zoom");
  T.eq(slider.hidden, false);
  T.eq(slider.getAttribute("aria-label"), "Acercar");
  T.eq(inner(el, ".stage").getAttribute("aria-valuetext"), "Acercar 100%");
  const targets = [];
  el.addEventListener("input", (e) => targets.push(e.target.localName));
  const range = slider.shadowRoot.querySelector("input");
  range.value = "2";
  range.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await T.settle();
  T.eq(el.zoom, 2);
  T.eq(targets.join(), "ray-image-crop", "one input, from the crop");
  T.eq(Math.round(el.crop.width), 100);
  el.parentElement.remove();
});

T.test("image-crop: export at the output size, format and part", async (T) => {
  const el = await mount(`<ray-image-crop output-size="64"></ray-image-crop>`, await picture());
  el.crop = { x: 0, y: 0, width: 200, height: 200 };
  const c = el.toCanvas();
  T.eq(`${c.width}x${c.height}`, "64x64");
  T.eq(pixel(c, 32, 32).join(), "255,0,0", "the left half: red");
  el.crop = { x: 200, y: 0, width: 200, height: 200 };
  T.eq(pixel(el.toCanvas({ size: 10 }), 5, 5).join(), "0,0,255", "the right half: blue");
  const png = await el.toBlob({ type: "image/png" });
  T.eq(png.type, "image/png");
  const jpeg = await el.toBlob();
  T.eq(jpeg.type, "image/jpeg", "jpeg by default");
  T.ok(el.toDataURL().startsWith("data:image/jpeg"), "data URL");
  el.aspect = "2";
  el.outputSize = "100";
  await T.settle();
  const wide = el.toCanvas();
  T.eq(`${wide.width}x${wide.height}`, "100x50", "height from the aspect");
  T.eq(`${el.toCanvas({ size: "30x20" }).width}x${el.toCanvas({ size: "30x20" }).height}`, "30x20");
  el.parentElement.remove();
});

T.test("image-crop: the working copy stays small for a large original", async (T) => {
  const el = await mount(`<ray-image-crop output-size="100" max-zoom="2"></ray-image-crop>`, await picture(4000, 2000));
  const canvas = inner(el, ".image");
  T.eq(el.naturalWidth, 4000, "the original size is reported");
  T.ok(canvas.height < 2000, `working copy ${canvas.width}x${canvas.height}`);
  T.eq(rectText(el.crop), '{"x":1000,"y":0,"width":2000,"height":2000}', "the crop in original pixels");
  el.parentElement.remove();
});

T.test("image-crop: what cannot load fires ray-error", async (T) => {
  const errors = [];
  const el = await mount(`<ray-image-crop></ray-image-crop>`);
  el.addEventListener("ray-error", (e) => errors.push(e.detail.error.message));
  el.src = { path: "/tmp/a.png", name: "a.png" };
  await T.settle();
  T.eq(await el.ready, false);
  T.eq(el.getAttribute("data-state"), "error");
  T.ok(/HostFile/.test(errors[0]), errors[0]);
  el.src = new Blob(["not an image"], { type: "image/png" });
  await T.settle();
  T.eq(await el.ready, false);
  T.eq(errors.length, 2);
  el.src = await picture();
  await T.settle();
  T.eq(await el.ready, true, "a good src after a bad one");
  el.src = "";
  await T.settle();
  T.eq(el.getAttribute("data-state"), "empty");
  T.eq(el.crop, null);
  el.parentElement.remove();
});

T.test("image-crop: a pinch zooms by the spread of two pointers; the wheel zooms too", async (T) => {
  const el = await mount(`<ray-image-crop></ray-image-crop>`, await picture());
  const stage = inner(el, ".stage");
  const r = stage.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const at = (type, id, dx) => stage.dispatchEvent(new PointerEvent(type, {
    pointerId: id, pointerType: "touch", isPrimary: id === 1, bubbles: true, cancelable: true, clientX: cx + dx, clientY: cy,
  }));
  at("pointerdown", 1, -20);
  at("pointerdown", 2, 20);
  at("pointermove", 2, 60);   // spread 40 -> 80: twice as close
  at("pointerup", 2, 60);
  at("pointerup", 1, -20);
  await T.settle();
  T.ok(Math.abs(el.zoom - 2) < 0.01, `zoom ${el.zoom}`);
  const wheel = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true, clientX: cx, clientY: cy });
  stage.dispatchEvent(wheel);
  await T.settle();
  T.ok(el.zoom > 2, `wheel up zooms in: ${el.zoom}`);
  T.ok(wheel.defaultPrevented, "the page does not scroll under the stage");
  el.parentElement.remove();
});
