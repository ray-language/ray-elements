// <ray-qr value="https://…">: a QR code, drawn as one SVG path (sharp at any
// size, in print too). The encoder is ours (encode.js, no dependencies), so
// only an app that imports ray-qr carries it.
//
// Dark on light, whatever the theme: scanners need it. A logo in the slot
// sits at the middle, and the error correction goes up to H so the code still
// reads with those modules covered.
//
//   <ray-qr value="otpauth://totp/app:ana?secret=…" label="Scan it with your authenticator app"></ray-qr>
//   const blob = await document.querySelector("ray-qr").toPNG();   // to save or share

import { RayElement, css, define, defineStrings } from "../../core/core.js";
import { COLORS } from "../../core/styles.js";

// The texts it writes, in English (setStrings translates them; one per line: the tools read them).
const STRINGS = {
  "qr.label": "QR code",
};
defineStrings(STRINGS);

const SIZES = { xs: "4rem", sm: "6rem", md: "8rem", lg: "12rem", xl: "16rem" };
const LOGO = 0.22; // the logo's side, a fraction of the code (with H, well within what it recovers)

const styles = css`
  :host {
    display: inline-block;
    position: relative;
    width: var(--_size, 8rem);
    aspect-ratio: 1;
    vertical-align: middle;
    --_fg: var(--ray-qr-color, #000);
    --_bg: var(--ray-qr-background, #fff);
  }
  :host([hidden]) { display: none; }
  :host([data-empty]) svg { visibility: hidden; }
  svg { display: block; width: 100%; height: 100%; border-radius: var(--ray-qr-radius, var(--ray-radius-sm)); }
  .bg { fill: var(--_bg); }
  .modules { fill: var(--_fg); }
  .logo {
    position: absolute;
    inset: 50% auto auto 50%; /* physical */
    display: grid;
    place-items: center;
    width: calc(var(--_code) * ${LOGO});
    aspect-ratio: 1;
    box-sizing: border-box;
    padding: calc(var(--_code) * 0.02);
    transform: translate(-50%, -50%);
    background: var(--_bg);
    border-radius: var(--ray-radius-sm);
  }
  .logo[hidden] { display: none; }
  ::slotted(*) { display: block; max-width: 100%; max-height: 100%; }
`;

export class RayQr extends RayElement {
  static properties = {
    value: { type: String },
    ecc: { type: String, reflect: true, default: "M" },
    size: { type: String, reflect: true, default: "md" },
    quietZone: { type: Number, attribute: "quiet-zone", default: 4 },
    color: { type: String },
    background: { type: String },
    label: { type: String, string: "qr.label" },
  };
  static styles = [styles];
  static template = `<svg part="code" role="img" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect class="bg" part="background" width="100%" height="100%"></rect><path class="modules" part="modules"></path></svg><div class="logo" part="logo" hidden><slot></slot></div>`;

  #matrix = null;
  #key = "";

  constructor() {
    super();
    this.$("slot").addEventListener("slotchange", () => this.requestUpdate());
  }

  /** The code drawn: version, ecc (the level used), mask, size and modules[y][x]; null when there is none. */
  get matrix() {
    return this.#matrix;
  }

  #hasLogo() {
    return this.$("slot").assignedElements().length > 0;
  }

  update() {
    const size = this.size ?? "md";
    this.style.setProperty("--_size", SIZES[size] ?? size);
    if (this.color) this.style.setProperty("--ray-qr-color", COLORS.includes(this.color) ? `var(--ray-${this.color}-filled)` : this.color);
    else this.style.removeProperty("--ray-qr-color");
    if (this.background) this.style.setProperty("--ray-qr-background", this.background);
    else this.style.removeProperty("--ray-qr-background");

    const logo = this.#hasLogo();
    const ecc = logo ? "H" : (this.ecc ?? "M");
    const quiet = Math.max(0, Math.round(this.quietZone ?? 4));
    const text = this.value ?? "";
    const key = `${ecc}\u0000${quiet}\u0000${text}`;
    if (key !== this.#key) {
      this.#key = key;
      this.#matrix = null;
      if (text) {
        try {
          this.#matrix = qrMatrix(text, { ecc });
        } catch (error) {
          this.emit("ray-error", { error });
        }
      }
      this.#draw(quiet);
    }
    const svg = this.$("svg");
    svg.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.label);
    const box = this.$(".logo");
    box.hidden = !logo || !this.#matrix;
    if (this.#matrix) {
      // The code's own width (without the quiet zone), so the logo scales with it.
      const n = this.#matrix.size;
      this.style.setProperty("--_code", `calc(100% * ${n / (n + 2 * quiet)})`);
    }
  }

  #draw(quiet) {
    const svg = this.$("svg");
    const m = this.#matrix;
    const n = m ? m.size + 2 * quiet : 1;
    svg.setAttribute("viewBox", `0 0 ${n} ${n}`);
    this.$(".modules").setAttribute("d", m ? path(m.modules, quiet) : "");
    this.toggleAttribute("data-empty", !m);
  }

  /**
   * The code as a standalone SVG document, its colors resolved (a logo
   * slotted as an <img> included).
   * @param {{ size?: number }} [options] the side in px (default: as drawn)
   */
  toSVG({ size } = {}) {
    const m = this.#matrix;
    if (!m) return "";
    const quiet = Math.max(0, Math.round(this.quietZone ?? 4));
    const n = m.size + 2 * quiet;
    const side = size ?? Math.round(this.getBoundingClientRect().width || n * 4);
    const { fg, bg } = this.#colors();
    let logo = "";
    const img = this.#logoImage();
    if (img) {
      const w = m.size * LOGO;
      const at = (n - w) / 2;
      const pad = m.size * 0.02;
      logo = `<rect x="${at}" y="${at}" width="${w}" height="${w}" fill="${bg}"/><image href="${escape(img.currentSrc || img.src)}" x="${at + pad}" y="${at + pad}" width="${w - 2 * pad}" height="${w - 2 * pad}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${side}" height="${side}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="${bg}"/><path d="${path(m.modules, quiet)}" fill="${fg}"/>${logo}</svg>`;
  }

  /**
   * The code as a PNG (a slotted <img> logo included; one from another
   * origin without CORS cannot be drawn, and the promise rejects).
   * @param {{ size?: number }} [options] the side in px (default: 8 px a module)
   * @returns {Promise<Blob>}
   */
  async toPNG({ size } = {}) {
    const m = this.#matrix;
    if (!m) throw new Error("ray-qr: nothing to draw");
    const quiet = Math.max(0, Math.round(this.quietZone ?? 4));
    const n = m.size + 2 * quiet;
    const scale = Math.max(1, Math.floor((size ?? n * 8) / n));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = n * scale;
    const ctx = canvas.getContext("2d");
    const { fg, bg } = this.#colors();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fg;
    m.modules.forEach((row, y) => row.forEach((dark, x) => dark && ctx.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale)));
    const img = this.#logoImage();
    if (img) {
      if (!img.complete) await img.decode().catch(() => {});
      const w = m.size * LOGO * scale;
      const at = (canvas.width - w) / 2;
      const pad = m.size * 0.02 * scale;
      ctx.fillStyle = bg;
      ctx.fillRect(at, at, w, w);
      const inner = w - 2 * pad;
      const ratio = Math.min(inner / (img.naturalWidth || inner), inner / (img.naturalHeight || inner));
      const iw = (img.naturalWidth || inner) * ratio;
      const ih = (img.naturalHeight || inner) * ratio;
      ctx.drawImage(img, at + pad + (inner - iw) / 2, at + pad + (inner - ih) / 2, iw, ih);
    }
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("ray-qr: the PNG could not be made"))), "image/png");
      } catch (error) {
        reject(error);
      }
    });
  }

  #logoImage() {
    const el = this.$("slot").assignedElements()[0];
    if (!el) return null;
    return el instanceof HTMLImageElement ? el : el.querySelector?.("img") ?? null;
  }

  #colors() {
    return { fg: getComputedStyle(this.$(".modules")).fill || "#000", bg: getComputedStyle(this.$(".bg")).fill || "#fff" };
  }
}

/** One subpath per run of dark modules in a row. */
function path(modules, quiet) {
  let d = "";
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let end = x;
      while (end + 1 < row.length && row[end + 1]) end++;
      d += `M${x + quiet} ${y + quiet}h${end - x + 1}v1h${x - end - 1}z`;
      x = end;
    }
  });
  return d;
}

function escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ---------------------------------------------------------------------------
// The encoder (ISO/IEC 18004): text in, a square of modules out. Versions
// 1-40, error correction L/M/Q/H, the numeric, alphanumeric and byte modes
// (UTF-8, as phones read it), the mask with the lowest penalty. The smallest
// version that fits is chosen, and the error correction raised while the text
// still fits in it. Checked module for module against python-qrcode.
//
//   import { qrMatrix } from "@raylang/elements/qr";
//   const { size, modules } = qrMatrix("https://elements.raylang.dev", { ecc: "M" });

const LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
const FORMAT = [1, 0, 3, 2]; // the format bits of L, M, Q, H

// Per level, per version (index 0 unused): error correction codewords per block, and blocks.
const ECC_PER_BLOCK = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const BLOCKS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const ALNUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
// Mode indicator, and the character count's bits for versions 1-9, 10-26, 27-40.
const MODES = {
  numeric: { bits: 0x1, count: [10, 12, 14] },
  alphanumeric: { bits: 0x2, count: [9, 11, 13] },
  byte: { bits: 0x4, count: [8, 16, 16] },
};

/** Modules that carry data (not finder, timing, alignment, format or version). */
function rawModules(ver) {
  let n = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (ver >= 7) n -= 36;
  }
  return n;
}

const dataCodewords = (ver, ecl) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * BLOCKS[ecl][ver];

/** The text as one segment, in the most compact mode it allows. */
function segment(text) {
  if (/^[0-9]*$/.test(text)) {
    const bits = [];
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      bits.push([Number(chunk), chunk.length * 3 + 1]);
    }
    return { mode: MODES.numeric, count: text.length, bits };
  }
  if ([...text].every((c) => ALNUM.includes(c))) {
    const bits = [];
    for (let i = 0; i < text.length; i += 2) {
      bits.push(i + 1 < text.length ? [ALNUM.indexOf(text[i]) * 45 + ALNUM.indexOf(text[i + 1]), 11] : [ALNUM.indexOf(text[i]), 6]);
    }
    return { mode: MODES.alphanumeric, count: text.length, bits };
  }
  const bytes = new TextEncoder().encode(text);
  return { mode: MODES.byte, count: bytes.length, bits: [...bytes].map((b) => [b, 8]) };
}

function segmentBits(seg, ver) {
  const countBits = seg.mode.count[ver < 10 ? 0 : ver < 27 ? 1 : 2];
  if (seg.count >= 1 << countBits) return Infinity;
  return 4 + countBits + seg.bits.reduce((n, [, len]) => n + len, 0);
}

// GF(256) with the polynomial 0x11D, for Reed-Solomon.
function mul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function divisor(degree) {
  const r = new Uint8Array(degree);
  r[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      r[j] = mul(r[j], root);
      if (j + 1 < degree) r[j] ^= r[j + 1];
    }
    root = mul(root, 0x02);
  }
  return r;
}

function remainder(data, div) {
  const r = new Uint8Array(div.length);
  for (const b of data) {
    const factor = b ^ r[0];
    r.copyWithin(0, 1);
    r[r.length - 1] = 0;
    for (let i = 0; i < r.length; i++) r[i] ^= mul(div[i], factor);
  }
  return r;
}

/** The data codewords split in blocks, each with its error correction, interleaved. */
function withErrorCorrection(data, ver, ecl) {
  const blocks = BLOCKS[ecl][ver];
  const eccLen = ECC_PER_BLOCK[ecl][ver];
  const raw = Math.floor(rawModules(ver) / 8);
  const short = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const div = divisor(eccLen);
  const all = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < short ? 0 : 1));
    k += dat.length;
    const block = [...dat, ...remainder(dat, div)];
    // A short block gets a placeholder, so all have one length to interleave.
    if (i < short) block.splice(shortLen - eccLen, 0, -1);
    all.push(block);
  }
  const out = [];
  for (let i = 0; i < all[0].length; i++) {
    for (let j = 0; j < all.length; j++) if (all[j][i] !== -1) out.push(all[j][i]);
  }
  return out;
}

function alignmentPositions(ver) {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
  const out = [6];
  for (let pos = ver * 4 + 17 - 7; out.length < n; pos -= step) out.splice(1, 0, pos);
  return out;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

class Grid {
  constructor(ver) {
    this.size = ver * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    this.fixed = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
  }

  set(x, y, dark) {
    this.modules[y][x] = dark;
    this.fixed[y][x] = true;
  }

  functionPatterns(ver, ecl) {
    const s = this.size;
    for (let i = 0; i < s; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    for (const [cx, cy] of [[3, 3], [s - 4, 3], [3, s - 4]]) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < s && y >= 0 && y < s) this.set(x, y, d !== 2 && d !== 4);
        }
      }
    }
    const pos = alignmentPositions(ver);
    const last = pos.length - 1;
    pos.forEach((cx, i) => {
      pos.forEach((cy, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) this.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      });
    });
    this.format(ecl, 0); // reserved now, written with the chosen mask
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const dark = ((bits >>> i) & 1) === 1;
        const a = s - 11 + (i % 3);
        const b = Math.floor(i / 3);
        this.set(a, b, dark);
        this.set(b, a, dark);
      }
    }
  }

  format(ecl, mask) {
    const s = this.size;
    const data = (FORMAT[ecl] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(i));
    this.set(8, 7, bit(6));
    this.set(8, 8, bit(7));
    this.set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) this.set(s - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) this.set(8, s - 15 + i, bit(i));
    this.set(8, s - 8, true); // the dark module
  }

  codewords(data) {
    const s = this.size;
    let i = 0;
    for (let right = s - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let v = 0; v < s; v++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const y = ((right + 1) & 2) === 0 ? s - 1 - v : v;
          if (!this.fixed[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
            i++;
          }
        }
      }
    }
  }

  mask(m) {
    const f = MASKS[m];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) if (!this.fixed[y][x] && f(x, y)) this.modules[y][x] = !this.modules[y][x];
    }
  }

  // The standard's penalty: long runs, 2x2 blocks, finder-like patterns, dark balance.
  penalty() {
    const s = this.size;
    const m = this.modules;
    let score = 0;
    const line = (get) => {
      let color = false;
      let run = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      const add = (len) => {
        if (history[0] === 0) len += s; // the light border before the line
        history.pop();
        history.unshift(len);
      };
      const finders = () => {
        const n = history[1];
        const core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
        return (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) + (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0);
      };
      for (let i = 0; i < s; i++) {
        if (get(i) === color) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score++;
        } else {
          add(run);
          if (!color) score += finders() * 40;
          color = get(i);
          run = 1;
        }
      }
      if (color) {
        add(run);
        run = 0;
      }
      add(run + s); // the light border after it
      score += finders() * 40;
    };
    for (let y = 0; y < s; y++) line((x) => m[y][x]);
    for (let x = 0; x < s; x++) line((y) => m[y][x]);
    let dark = 0;
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        if (m[y][x]) dark++;
        if (y < s - 1 && x < s - 1) {
          const c = m[y][x];
          if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
        }
      }
    }
    const total = s * s;
    score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return score;
  }
}

/**
 * The QR code of `text`: its version, error correction level, mask and
 * modules (modules[y][x], true is dark). Throws a RangeError when the text
 * does not fit in version 40 at that level.
 * @param {string} text
 * @param {{ ecc?: "L" | "M" | "Q" | "H", mask?: number }} [options]
 */
export function qrMatrix(text, { ecc = "M", mask } = {}) {
  let ecl = LEVELS[String(ecc).toUpperCase()] ?? LEVELS.M;
  const seg = segment(String(text ?? ""));
  let ver = 1;
  let used = Infinity;
  for (; ver <= 40; ver++) {
    used = segmentBits(seg, ver);
    if (used <= dataCodewords(ver, ecl) * 8) break;
  }
  if (ver > 40) throw new RangeError(`qrMatrix: the text does not fit in a QR code at level ${ecc}`);
  // A stronger level while the text still fits in this version.
  while (ecl < 3 && used <= dataCodewords(ver, ecl + 1) * 8) ecl++;

  const bits = [];
  const put = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(seg.mode.bits, 4);
  put(seg.count, seg.mode.count[ver < 10 ? 0 : ver < 27 ? 1 : 2]);
  for (const [value, len] of seg.bits) put(value, len);
  const capacity = dataCodewords(ver, ecl) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((b, bit) => (b << 1) | bit, 0));

  const grid = new Grid(ver);
  grid.functionPatterns(ver, ecl);
  grid.codewords(withErrorCorrection(data, ver, ecl));
  let chosen = Number.isInteger(mask) && mask >= 0 && mask < 8 ? mask : -1;
  if (chosen < 0) {
    let best = Infinity;
    for (let m = 0; m < 8; m++) {
      grid.mask(m);
      grid.format(ecl, m);
      const p = grid.penalty();
      if (p < best) {
        best = p;
        chosen = m;
      }
      grid.mask(m); // undone: a mask is its own inverse
    }
  }
  grid.mask(chosen);
  grid.format(ecl, chosen);
  return { version: ver, ecc: "LMQH"[ecl], mask: chosen, size: grid.size, modules: grid.modules };
}

define("ray-qr", RayQr);
