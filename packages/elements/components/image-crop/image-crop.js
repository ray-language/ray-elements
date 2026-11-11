// <ray-image-crop>: frame an image inside a fixed aspect (a rectangle or a
// circle) by dragging, pinching, the wheel or the keyboard, and export the
// framed part at a chosen size as a Blob or a data URL.
//
// The framing is kept as fractions of the image (the zoom and the image point
// at the center of the frame), so it does not depend on the size of the stage.
// The picture is decoded once into a reduced working copy (what the output
// and the stage need at max-zoom), and the full-size decode is released.

import { RayElement, css, define } from "../../core/core.js";
import "../slider/slider.js";

const styles = css`
  :host {
    display: block;
    --_inset: var(--ray-image-crop-inset, var(--ray-space-4));
    --_dim: var(--ray-image-crop-dim, rgb(0 0 0 / 0.55));
  }
  .stage {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: var(--_aspect, 1);
    max-height: var(--ray-image-crop-max-height, 70vh);
    padding: var(--_inset);
    overflow: hidden;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    border-radius: var(--ray-radius-md);
    background: var(--ray-muted);
    cursor: grab;
  }
  .stage.dragging { cursor: grabbing; }
  :host([disabled]) .stage { cursor: default; opacity: 0.6; }
  :host(:not([data-state="ready"])) .stage { cursor: default; }
  .stage:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  .image {
    position: absolute;
    top: 0; /* physical */
    left: 0; /* physical */
    transform-origin: 0 0;
    pointer-events: none;
  }
  .frame {
    position: relative;
    pointer-events: none;
    box-shadow: 0 0 0 100vmax var(--_dim);
    outline: 1px solid rgb(255 255 255 / 0.85);
  }
  :host([shape="circle"]) .frame { border-radius: 50%; }
  :host(:not([data-state="ready"])) .frame { box-shadow: none; outline: 1.5px dashed var(--ray-muted-foreground); }
  .zoom { margin-block-start: var(--ray-space-3); }
`;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const DEFAULT_STAGE = 400;

/** "1", "16/9", "4:3", "1.5" -> a positive ratio (1 when it is none of them). */
export function parseAspect(value) {
  if (typeof value === "number") return value > 0 && Number.isFinite(value) ? value : 1;
  const m = String(value ?? "").trim().match(/^(\d*\.?\d+)\s*(?:[/:]\s*(\d*\.?\d+))?$/);
  if (!m) return 1;
  const r = Number(m[1]) / (m[2] === undefined ? 1 : Number(m[2]));
  return r > 0 && Number.isFinite(r) ? r : 1;
}

/** "320" or "640x360" (or a number) -> { width, height } for an aspect. */
function parseOutputSize(value, aspect = 1) {
  const m = typeof value === "number"
    ? [null, String(Math.round(value))]
    : String(value ?? "").trim().match(/^(\d+)(?:\s*[x×]\s*(\d+))?$/i);
  const w = m ? Number(m[1]) : 0;
  if (!(w > 0)) return null;
  const h = m[2] ? Number(m[2]) : Math.max(1, Math.round(w / aspect));
  return h > 0 ? { width: w, height: h } : null;
}

/** Whether a URL needs crossOrigin to keep the canvas exportable. */
function crossOrigin(url) {
  if (/^(data|blob):/i.test(url)) return false;
  try {
    return new URL(url, document.baseURI).origin !== location.origin;
  } catch {
    return false;
  }
}

/** Decodes a URL or Blob into an <img> (EXIF orientation applied, as in an img). */
async function decode(src) {
  const img = new Image();
  let objectUrl = null;
  if (typeof src === "string") {
    if (crossOrigin(src)) img.crossOrigin = "anonymous";
    img.src = src;
  } else {
    objectUrl = URL.createObjectURL(src);
    img.src = objectUrl;
  }
  try {
    await img.decode();
  } catch {
    throw new Error("the image could not be decoded");
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
  return img;
}

export class RayImageCrop extends RayElement {
  static properties = {
    src: { type: String },
    aspect: { type: String, reflect: true, default: "1" },
    shape: { type: String, reflect: true, default: "rect" },
    zoom: { type: Number, default: 1 },
    minZoom: { type: Number, attribute: "min-zoom", default: 1 },
    maxZoom: { type: Number, attribute: "max-zoom", default: 4 },
    zoomControl: { type: Boolean, attribute: "zoom-control", reflect: true },
    outputSize: { type: String, attribute: "output-size", default: "512" },
    type: { type: String, default: "image/jpeg" },
    quality: { type: Number, default: 0.85 },
    label: { type: String, default: "Crop image" },
    zoomLabel: { type: String, attribute: "zoom-label", default: "Zoom" },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="stage" part="stage" tabindex="0" role="slider">
      <canvas class="image" part="image" hidden></canvas>
      <div class="frame" part="frame"></div>
    </div>
    <ray-slider class="zoom" part="zoom" size="sm" step="0.01" hidden></ray-slider>`;

  /** The working copy (a canvas) and the size of the original. */
  #work = null;
  #natural = { width: 0, height: 0 };
  /** The image point at the center of the frame, as fractions of the image. */
  #cx = 0.5;
  #cy = 0.5;
  /** A crop asked for before the image loaded, applied when it does. */
  #pendingCrop = null;
  #loading = 0;
  #shownSrc = undefined;
  #ready = Promise.resolve(false);
  #pointers = new Map();
  #wheelTimer = 0;
  #moved = false;
  /** Geometry of the last paint, in CSS px: frame size and offset in the stage. */
  #frame = { width: 0, height: 0, left: 0, top: 0 };

  constructor() {
    super();
    this.stage = this.$(".stage");
    this.canvas = this.$(".image");
    this.frameEl = this.$(".frame");
    this.slider = this.$(".zoom");
    this.#wire();
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("data-state")) this.setAttribute("data-state", "empty");
    if (typeof ResizeObserver === "function" && !this.resizer) {
      this.resizer = new ResizeObserver(() => this.#paint());
    }
    this.resizer?.observe(this.stage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizer?.disconnect();
    clearTimeout(this.#wheelTimer);
  }

  // --- Public API -----------------------------------------------------------

  /** Resolves (true when an image is shown) once the current src is decoded. */
  get ready() {
    this.#syncSrc();
    return this.#ready;
  }

  /** Whether an image is loaded. */
  get loaded() {
    return this.#work !== null;
  }

  get naturalWidth() {
    return this.#natural.width;
  }

  get naturalHeight() {
    return this.#natural.height;
  }

  /** The framed part, in pixels of the original image ({ x, y, width, height }). */
  get crop() {
    if (!this.#work) return this.#pendingCrop ? { ...this.#pendingCrop } : null;
    const { vw, vh } = this.#view();
    const W = this.#natural.width;
    const H = this.#natural.height;
    return {
      x: (this.#cx - vw / 2) * W,
      y: (this.#cy - vh / 2) * H,
      width: vw * W,
      height: vh * H,
    };
  }

  /** Frames a rectangle of the original (the zoom that shows all of it, centered on it). */
  set crop(rect) {
    if (!rect) return;
    if (!this.#work) {
      this.#pendingCrop = { ...rect };
      return;
    }
    this.#applyCrop(rect);
    this.#paint();
  }

  /** Zoom 1, centered. */
  reset() {
    this.#cx = 0.5;
    this.#cy = 0.5;
    this.commitProperty("zoom", clamp(1, this.#minZoom(), this.#maxZoom()));
    this.requestUpdate();
  }

  /**
   * The framed part drawn on a new canvas of the output size
   * (options: size — "320", "640x360" or a number — or width/height).
   */
  toCanvas(options = {}) {
    if (!this.#work) return null;
    const aspect = this.#aspect();
    const out = (options.width
      ? { width: Math.round(options.width), height: Math.round(options.height ?? options.width / aspect) }
      : parseOutputSize(options.size ?? this.outputSize, aspect)) ?? { width: 512, height: Math.round(512 / aspect) };
    const canvas = document.createElement("canvas");
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const { vw, vh } = this.#view();
    const w = this.#work.width;
    const h = this.#work.height;
    ctx.drawImage(this.#work, (this.#cx - vw / 2) * w, (this.#cy - vh / 2) * h, vw * w, vh * h, 0, 0, out.width, out.height);
    return canvas;
  }

  /** The framed part as a Blob (options: size, width, height, type, quality); null without an image. */
  toBlob(options = {}) {
    const canvas = this.toCanvas(options);
    if (!canvas) return Promise.resolve(null);
    const type = options.type ?? this.type ?? "image/jpeg";
    const quality = options.quality ?? this.quality;
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("the image could not be encoded"))), type, quality);
    });
  }

  /** The framed part as a data URL (same options as toBlob); "" without an image. */
  toDataURL(options = {}) {
    const canvas = this.toCanvas(options);
    if (!canvas) return "";
    return canvas.toDataURL(options.type ?? this.type ?? "image/jpeg", options.quality ?? this.quality);
  }

  // --- Rendering ------------------------------------------------------------

  update(changed) {
    const aspect = this.#aspect();
    this.style.setProperty("--_aspect", String(aspect));
    this.#syncSrc();
    const zoom = clamp(Number.isFinite(this.zoom) ? this.zoom : 1, this.#minZoom(), this.#maxZoom());
    if (zoom !== this.zoom) this.commitProperty("zoom", zoom);
    const off = this.disabled;
    this.stage.tabIndex = off ? -1 : 0;
    this.stage.setAttribute("aria-label", this.label ?? "Crop image");
    this.stage.setAttribute("aria-valuemin", String(Math.round(this.#minZoom() * 100)));
    this.stage.setAttribute("aria-valuemax", String(Math.round(this.#maxZoom() * 100)));
    this.stage.setAttribute("aria-valuenow", String(Math.round(zoom * 100)));
    this.stage.setAttribute("aria-valuetext", `${this.zoomLabel ?? "Zoom"} ${Math.round(zoom * 100)}%`);
    this.stage.toggleAttribute("aria-disabled", !!off);
    const s = this.slider;
    s.hidden = !this.zoomControl;
    s.min = this.#minZoom();
    s.max = this.#maxZoom();
    s.value = zoom;
    s.disabled = !!off || !this.#work;
    s.setAttribute("aria-label", this.zoomLabel ?? "Zoom");
    this.#paint();
  }

  /** Starts loading a new src at once, so `ready` right after assigning it waits for it. */
  #syncSrc() {
    if (this.src === this.#shownSrc) return;
    this.#shownSrc = this.src;
    this.#ready = this.#load(this.src);
  }

  #aspect() {
    return parseAspect(this.aspect);
  }

  #minZoom() {
    const v = Number(this.minZoom);
    return v >= 1 && Number.isFinite(v) ? v : 1;
  }

  #maxZoom() {
    const v = Number(this.maxZoom);
    return Math.max(this.#minZoom(), Number.isFinite(v) ? v : 4);
  }

  /** The visible part at the current zoom, as fractions of the image (vw, vh). */
  #view() {
    const w = this.#work?.width || 1;
    const h = this.#work?.height || 1;
    const a = this.#aspect();
    // At zoom 1 the image covers the frame: one side fits, the other overflows.
    const vw0 = Math.min(1, (a * h) / w);
    const vh0 = Math.min(1, w / (a * h));
    const z = clamp(this.zoom || 1, this.#minZoom(), this.#maxZoom());
    return { vw: vw0 / z, vh: vh0 / z };
  }

  /** Keeps the frame inside the image (no gap ever shows in it). */
  #clampCenter() {
    const { vw, vh } = this.#view();
    this.#cx = clamp(this.#cx, vw / 2, 1 - vw / 2);
    this.#cy = clamp(this.#cy, vh / 2, 1 - vh / 2);
  }

  /** The frame: the largest rectangle of the aspect inside the stage's padding (the inset), centered. */
  #measure() {
    const cs = getComputedStyle(this.stage);
    const px = parseFloat(cs.paddingInlineStart) || 0;
    const py = parseFloat(cs.paddingBlockStart) || 0;
    const sw = this.stage.clientWidth;
    const sh = this.stage.clientHeight;
    const a = this.#aspect();
    const aw = Math.max(0, sw - 2 * px);
    const ah = Math.max(0, sh - 2 * py);
    let width = aw;
    let height = aw / a;
    if (height > ah) {
      height = ah;
      width = ah * a;
    }
    return { width, height, left: (sw - width) / 2, top: (sh - height) / 2 };
  }

  #paint() {
    const f = this.#measure();
    this.#frame = f;
    this.frameEl.style.width = `${f.width}px`;
    this.frameEl.style.height = `${f.height}px`;
    const work = this.#work;
    this.canvas.hidden = !work;
    if (!work) return;
    this.#clampCenter();
    const { vw } = this.#view();
    const scale = f.width / (vw * work.width) || 0;
    const tx = f.left - (this.#cx - vw / 2) * work.width * scale;
    const { vh } = this.#view();
    const ty = f.top - (this.#cy - vh / 2) * work.height * scale;
    this.canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  // --- Loading --------------------------------------------------------------

  async #load(src) {
    const token = ++this.#loading;
    this.#release();
    if (src === undefined || src === null || src === "") {
      this.setAttribute("data-state", "empty");
      this.requestUpdate();
      return false;
    }
    this.setAttribute("data-state", "loading");
    try {
      if (typeof src !== "string" && !(src instanceof Blob)) {
        throw new Error("src must be a URL, a File or a Blob (a HostFile has no bytes: read it in the program and pass a URL)");
      }
      const img = await decode(src);
      if (token !== this.#loading) return false;
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      // The working copy: as many pixels as the output, or the stage at its
      // device resolution, need at max-zoom; never more than the original.
      const aspect = this.#aspect();
      const out = parseOutputSize(this.outputSize, aspect) ?? { width: 512, height: 512 };
      const stage = (this.stage.clientWidth || DEFAULT_STAGE) * Math.min(window.devicePixelRatio || 1, 2);
      const need = Math.max(out.width, out.height, stage) * this.#maxZoom();
      // The side of the image the frame spans at zoom 1.
      const span = W / H > aspect ? H * aspect : W;
      const k = Math.min(1, need / span);
      const work = document.createElement("canvas");
      work.width = Math.max(1, Math.round(W * k));
      work.height = Math.max(1, Math.round(H * k));
      const ctx = work.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, work.width, work.height);
      img.src = "";
      this.#natural = { width: W, height: H };
      this.#work = work;
      // Shown through the working copy itself: no second decode for the stage.
      this.canvas.width = work.width;
      this.canvas.height = work.height;
      this.canvas.style.width = `${work.width}px`;
      this.canvas.style.height = `${work.height}px`;
      this.canvas.getContext("2d").drawImage(work, 0, 0);
      this.#cx = 0.5;
      this.#cy = 0.5;
      if (this.#pendingCrop) {
        this.#applyCrop(this.#pendingCrop);
        this.#pendingCrop = null;
      } else if (!this.hasValue("zoom")) {
        this.commitProperty("zoom", clamp(1, this.#minZoom(), this.#maxZoom()));
      }
      this.setAttribute("data-state", "ready");
      this.requestUpdate();
      this.emit("ray-load", { width: W, height: H });
      return true;
    } catch (error) {
      if (token !== this.#loading) return false;
      this.setAttribute("data-state", "error");
      this.requestUpdate();
      this.emit("ray-error", { error });
      return false;
    }
  }

  #release() {
    if (this.#work) {
      this.#work.width = 0;
      this.#work.height = 0;
    }
    this.#work = null;
    this.#natural = { width: 0, height: 0 };
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  #applyCrop(rect) {
    const W = this.#natural.width;
    const H = this.#natural.height;
    const x = Number(rect.x) || 0;
    const y = Number(rect.y) || 0;
    const width = Number(rect.width) || W;
    const height = Number(rect.height) || H;
    this.commitProperty("zoom", 1);
    const { vw: vw1, vh: vh1 } = this.#view();
    // The largest zoom at which the whole rectangle is still in the frame.
    const z = Math.min(vw1 / (width / W), vh1 / (height / H));
    this.commitProperty("zoom", clamp(z, this.#minZoom(), this.#maxZoom()));
    this.#cx = (x + width / 2) / W;
    this.#cy = (y + height / 2) / H;
    this.#clampCenter();
  }

  // --- Interaction ----------------------------------------------------------

  /** Whether the user can move the image now. */
  #active() {
    return !!this.#work && !this.disabled;
  }

  /** Moves the image by (dx, dy) CSS px on screen. */
  #pan(dx, dy) {
    const scale = this.#scale();
    if (!scale) return;
    this.#cx -= dx / (this.#work.width * scale);
    this.#cy -= dy / (this.#work.height * scale);
    this.#clampCenter();
  }

  /** CSS px per working-copy px. */
  #scale() {
    const { vw } = this.#view();
    return this.#frame.width / (vw * this.#work.width) || 0;
  }

  /** Zooms to z keeping the image point under (px, py) — stage px — where it is. */
  #zoomAt(z, px = this.#frame.left + this.#frame.width / 2, py = this.#frame.top + this.#frame.height / 2) {
    const before = this.#scale();
    const fx = px - (this.#frame.left + this.#frame.width / 2);
    const fy = py - (this.#frame.top + this.#frame.height / 2);
    const ix = this.#cx + fx / (this.#work.width * before || 1);
    const iy = this.#cy + fy / (this.#work.height * before || 1);
    this.commitProperty("zoom", clamp(z, this.#minZoom(), this.#maxZoom()));
    const after = this.#scale();
    if (after) {
      this.#cx = ix - fx / (this.#work.width * after);
      this.#cy = iy - fy / (this.#work.height * after);
    }
    this.#clampCenter();
  }

  #changed(settled) {
    this.#paint();
    this.requestUpdate();
    this.dispatchEvent(new Event("input", { bubbles: true }));
    if (settled) this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #local(e) {
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  #wire() {
    const stage = this.stage;
    stage.addEventListener("pointerdown", (e) => {
      if (!this.#active() || (e.pointerType === "mouse" && e.button !== 0)) return;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // A synthetic or already released pointer: follow it without capture.
      }
      this.#pointers.set(e.pointerId, this.#local(e));
      this.#moved = false;
      stage.classList.add("dragging");
      if (e.pointerType !== "touch") stage.focus({ preventScroll: true });
      e.preventDefault();
    });
    stage.addEventListener("pointermove", (e) => {
      const prev = this.#pointers.get(e.pointerId);
      if (!prev || !this.#active()) return;
      const p = this.#local(e);
      if (this.#pointers.size >= 2) {
        // Pinch: the two first pointers; zoom by their spread, pan by their centroid.
        const [a, b] = [...this.#pointers.entries()].slice(0, 2);
        const other = a[0] === e.pointerId ? b[1] : a[1];
        const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
        const d1 = Math.hypot(p.x - other.x, p.y - other.y);
        const c0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
        const c1 = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 };
        if (d0 > 0) this.#zoomAt(this.zoom * (d1 / d0), c0.x, c0.y);
        this.#pan(c1.x - c0.x, c1.y - c0.y);
      } else {
        this.#pan(p.x - prev.x, p.y - prev.y);
      }
      this.#pointers.set(e.pointerId, p);
      this.#moved = true;
      this.#changed(false);
    });
    const end = (e) => {
      if (!this.#pointers.delete(e.pointerId)) return;
      if (this.#pointers.size === 0) {
        stage.classList.remove("dragging");
        if (this.#moved) this.dispatchEvent(new Event("change", { bubbles: true }));
        this.#moved = false;
      }
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("lostpointercapture", end);

    // The wheel zooms at the pointer; a trackpad pinch comes as a wheel with ctrlKey.
    // Not passive, and only on the stage: the page around it still scrolls.
    stage.addEventListener("wheel", (e) => {
      if (!this.#active()) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const factor = Math.exp((-e.deltaY * unit) * (e.ctrlKey ? 0.01 : 0.0015));
      const p = this.#local(e);
      this.#zoomAt(this.zoom * factor, p.x, p.y);
      this.#changed(false);
      clearTimeout(this.#wheelTimer);
      this.#wheelTimer = setTimeout(() => this.dispatchEvent(new Event("change", { bubbles: true })), 250);
    }, { passive: false });

    // Keyboard: arrows move the picture (Shift: 10 times as far), + and - zoom,
    // PageUp/PageDown too, Home/End: the least and the most zoom, 0: reset.
    stage.addEventListener("keydown", (e) => {
      if (!this.#active() || e.altKey || e.metaKey || e.ctrlKey) return;
      const step = (e.shiftKey ? 0.1 : 0.01) * this.#frame.width;
      const zoomStep = e.shiftKey ? 0.5 : 0.1;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        this.#pan(...moves[e.key]);
      } else if (e.key === "+" || e.key === "=" || e.key === "PageUp") {
        this.#zoomAt(this.zoom + zoomStep);
      } else if (e.key === "-" || e.key === "_" || e.key === "PageDown") {
        this.#zoomAt(this.zoom - zoomStep);
      } else if (e.key === "Home") {
        this.#zoomAt(this.#minZoom());
      } else if (e.key === "End") {
        this.#zoomAt(this.#maxZoom());
      } else if (e.key === "0") {
        this.reset();
      } else {
        return;
      }
      e.preventDefault();
      this.#changed(true);
    });

    // The zoom slider: its events are this component's, not the page's.
    this.slider.addEventListener("input", (e) => {
      e.stopPropagation();
      if (!this.#active()) return;
      this.#zoomAt(Number(this.slider.value));
      this.#changed(false);
    });
    this.slider.addEventListener("change", (e) => {
      e.stopPropagation();
      if (this.#active()) this.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
}

define("ray-image-crop", RayImageCrop);
