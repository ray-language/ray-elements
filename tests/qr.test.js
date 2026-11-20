// page: docs/components/all.html
//
// ray-qr in the real webview: the encoder against python-qrcode's matrices,
// version and level choice, the drawing, the logo (level H), empty and too
// long, the accessible name, toSVG and toPNG.

const T = window.__rayTest;
await customElements.whenDefined("ray-qr");
const { qrMatrix } = await import("../../src/components/qr/qr.js");

async function mount(html) {
  const box = document.createElement("div");
  box.innerHTML = html;
  document.body.append(box);
  await T.settle();
  return box;
}
const rows = (m) => m.modules.map((r) => r.map((b) => (b ? "1" : "0")).join(""));

// python-qrcode 8, the same version, level and mask, no quiet zone.
const REFERENCE = {"HELLO WORLD": ["111111100001001111111", "100000101100101000001", "101110100101101011101", "101110101111101011101", "101110101101001011101", "100000100100101000001", "111111101010101111111", "000000001101100000000", "010111101100111011010", "101111010000111101110", "001010110001001100000", "101101000101100011000", "110111111110111011111", "000000001000100101000", "111111100110011001111", "100000101010010010111", "101110101101001000111", "101110101011100010100", "101110100100001000011", "100000101110011100110", "111111100101000000010"], "https://elements.raylang.dev": ["1111111001000010101111111", "1000001011011101001000001", "1011101001110000101011101", "1011101011011110001011101", "1011101000101000001011101", "1000001010101001101000001", "1111111010101010101111111", "0000000000010010000000000", "1111101111100111110101010", "1001110111010110100100010", "1101001101000001010101011", "0110100001100011101100001", "1011101101001111111010111", "1000100110110100100101010", "1011011100101011011111011", "1001100010100000111110001", "1011001001001110111110100", "0000000010110001100011000", "1111111010001000101010111", "1000001001010010100011001", "1011101010011111111110110", "1011101011111100011011111", "1011101010000110000001101", "1000001010110001110111001", "1111111011001110011111111"]};

T.test("qr encoder: module for module as python-qrcode", async (T) => {
  const hello = qrMatrix("HELLO WORLD", { ecc: "Q", mask: 6 });
  T.eq(hello.version, 1);
  T.eq(hello.ecc, "Q");
  T.eq(rows(hello).join("\n"), REFERENCE["HELLO WORLD"].join("\n"), "alphanumeric, version 1-Q");
  const url = qrMatrix("https://elements.raylang.dev", { ecc: "L", mask: 2 });
  T.eq(url.version, 2);
  T.eq(rows(url).join("\n"), REFERENCE["https://elements.raylang.dev"].join("\n"), "bytes, version 2-L");
});

T.test("qr encoder: the smallest version, the level raised when free, modes, limits", async (T) => {
  const short = qrMatrix("12345", { ecc: "L" });
  T.eq(short.version, 1);
  T.eq(short.ecc, "H", "five digits fit version 1 even at H: raised");
  T.eq(short.size, 21);
  const big = qrMatrix("9".repeat(7089), { ecc: "L" });
  T.eq(big.version, 40, "7089 digits: version 40-L, the most there is");
  T.eq(big.size, 177);
  let threw = null;
  try {
    qrMatrix("9".repeat(7090), { ecc: "L" });
  } catch (e) {
    threw = e;
  }
  T.ok(threw instanceof RangeError, "one more digit does not fit");
  const utf8 = qrMatrix("ñandú — 💊");
  T.ok(utf8.version >= 1 && utf8.modules.length === utf8.size, "UTF-8 text");
  T.ok(qrMatrix("x", { mask: 3 }).mask === 3 && qrMatrix("x").mask >= 0, "a mask forced or chosen");
});

T.test("qr: draws the code with its quiet zone; size; the accessible name", async (T) => {
  const box = await mount(`<ray-qr value="https://elements.raylang.dev"></ray-qr><ray-qr size="xs" quiet-zone="2" value="12345" label="Scan to pay"></ray-qr><ray-qr size="200px" value="x"></ray-qr>`);
  const [a, b, c] = box.querySelectorAll("ray-qr");
  const svg = a.shadowRoot.querySelector("svg");
  const m = a.matrix;
  T.eq(svg.getAttribute("viewBox"), `0 0 ${m.size + 8} ${m.size + 8}`, "4 modules of quiet zone on each side");
  T.ok(a.shadowRoot.querySelector(".modules").getAttribute("d").startsWith("M4 4h7"), "the top left finder starts the path");
  T.eq(Math.round(a.getBoundingClientRect().width), 128, "md: 8rem");
  T.eq(Math.round(b.getBoundingClientRect().width), 64, "xs: 4rem");
  T.eq(Math.round(c.getBoundingClientRect().width), 200, "a CSS length");
  T.eq(b.shadowRoot.querySelector("svg").getAttribute("viewBox"), "0 0 25 25", "quiet-zone=2");
  T.eq(svg.getAttribute("role"), "img");
  T.eq(svg.getAttribute("aria-label"), "QR code", "the default name");
  T.eq(b.shadowRoot.querySelector("svg").getAttribute("aria-label"), "Scan to pay");
  T.eq(getComputedStyle(a.shadowRoot.querySelector(".modules")).fill, "rgb(0, 0, 0)", "black on white, whatever the theme");
  T.eq(getComputedStyle(a.shadowRoot.querySelector(".bg")).fill, "rgb(255, 255, 255)");
  a.value = "HELLO WORLD";
  a.ecc = "L";
  await T.settle();
  T.eq(a.matrix.version, 1, "a new value redraws");
  T.eq(a.matrix.ecc, "Q", "L raised to Q at no cost");
  box.remove();
});

T.test("qr: a logo forces H and sits at the middle; empty and too long draw nothing", async (T) => {
  const box = await mount(`<ray-qr size="200px" value="https://elements.raylang.dev"><img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='red'/%3E%3C/svg%3E"></ray-qr><ray-qr></ray-qr><ray-qr ecc="H"></ray-qr>`);
  const [logo, empty, long] = box.querySelectorAll("ray-qr");
  T.eq(logo.matrix.ecc, "H");
  const l = logo.shadowRoot.querySelector(".logo");
  T.eq(l.hidden, false);
  const r = l.getBoundingClientRect();
  const host = logo.getBoundingClientRect();
  T.ok(Math.abs(r.left + r.width / 2 - (host.left + host.width / 2)) < 1 && Math.abs(r.top + r.height / 2 - (host.top + host.height / 2)) < 1, "centered");
  const n = logo.matrix.size;
  T.ok(Math.abs(r.width - 200 * (n / (n + 8)) * 0.22) < 1, `22 % of the code (${r.width.toFixed(1)}px)`);
  T.eq(empty.matrix, null);
  T.ok(empty.hasAttribute("data-empty"), "no value: nothing drawn");
  let error = null;
  long.addEventListener("ray-error", (e) => (error = e.detail.error));
  long.value = "x".repeat(1300);
  await T.settle();
  T.ok(error instanceof RangeError, "too long at H: ray-error");
  T.eq(long.matrix, null);
  T.ok(long.hasAttribute("data-empty"));
  long.ecc = "L";
  await T.settle();
  T.ok(long.matrix && !long.hasAttribute("data-empty"), "fits at L");
  box.remove();
});

T.test("qr: toSVG and toPNG, colors resolved", async (T) => {
  const box = await mount(`<ray-qr color="#123456" background="#fafafa" value="HELLO WORLD"></ray-qr>`);
  const q = box.firstElementChild;
  const svg = q.toSVG({ size: 300 });
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  T.eq(doc.documentElement.getAttribute("width"), "300");
  T.eq(doc.querySelector("path").getAttribute("fill"), "rgb(18, 52, 86)");
  T.eq(doc.querySelector("rect").getAttribute("fill"), "rgb(250, 250, 250)");
  T.eq(doc.querySelector("path").getAttribute("d"), q.shadowRoot.querySelector(".modules").getAttribute("d"));
  const png = await q.toPNG({ size: 290 });
  T.eq(png.type, "image/png");
  const bitmap = await createImageBitmap(png);
  T.eq(bitmap.width, 290, "29 modules × 10 px");
  box.remove();
});
