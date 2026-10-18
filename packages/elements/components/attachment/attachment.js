// <ray-attachment>: a file in a message composer, an upload list or a chat
// (shadcn's AI attachment, upload items). Thumbnail or type icon, name, size
// and an extension badge; optional upload progress, error, remove button and
// download link. <ray-attachments> lays several out in a wrapping row.
//
//   el.file = input.files[0];   // fills name, size, type and an image thumbnail

import { RayElement, css, define } from "../../core/core.js";

const styles = css`
  :host {
    display: inline-flex;
    vertical-align: top;
    max-width: 100%;
    font-size: var(--ray-font-size-sm);
    --_thumb: 2.75rem;
  }
  :host([hidden]) { display: none; }
  .item {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--ray-space-3);
    box-sizing: border-box;
    width: 16rem;
    max-width: 100%;
    padding: var(--ray-space-2);
    padding-inline-end: var(--ray-space-3);
    color: var(--ray-foreground);
    background: var(--ray-card);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    overflow: hidden;
  }
  :host([status="error"]) .item { border-color: var(--ray-destructive); }
  :host([disabled]) .item { opacity: 0.6; }
  .thumb {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--_thumb);
    height: var(--_thumb);
    overflow: hidden;
    color: var(--ray-muted-foreground);
    background: var(--ray-muted);
    border-radius: calc(var(--ray-radius-default) - 2px);
  }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }
  .thumb [data-ray-icon] { --ray-icon-size: 1.25rem; }
  :host([status="error"]) .thumb { color: var(--ray-destructive); }
  .badge {
    position: absolute;
    bottom: 3px;
    left: 50%; /* physical */
    transform: translateX(-50%);
    padding: 0 0.25rem;
    font-size: 0.5625rem;
    font-weight: var(--ray-font-weight-bold);
    line-height: 0.875rem;
    letter-spacing: 0.02em;
    color: var(--ray-muted-foreground);
    background: var(--ray-card);
    border-radius: var(--ray-radius-xs);
  }
  .thumb[data-image] .badge { display: none; }
  .text { display: grid; flex: 1; min-width: 0; gap: 1px; }
  .name-box { display: block; min-width: 0; }
  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--ray-font-weight-medium);
    color: inherit;
    text-decoration: none;
  }
  a.name:hover { text-decoration: underline; }
  a.name:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; border-radius: var(--ray-radius-xs); }
  .meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); font-variant-numeric: tabular-nums; }
  :host([status="error"]) .meta { color: var(--ray-destructive); }
  .bar {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 2px;
    background: var(--ray-muted);
  }
  .bar span {
    display: block;
    height: 100%;
    width: var(--_pct, 0%);
    background: var(--ray-primary);
    transition: width var(--ray-duration-base) var(--ray-easing-standard);
  }
  .remove {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    color: var(--ray-muted-foreground);
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--ray-duration-fast) var(--ray-easing-standard), background var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .item:hover .remove, .remove:focus-visible { opacity: 1; }
  .remove:hover { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .remove:disabled { cursor: not-allowed; }
  .remove [data-ray-icon] { --ray-icon-size: 0.875rem; }

  /* variant="card": the thumbnail on top, square-ish. */
  :host([variant="card"]) .item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--ray-space-2);
    width: 10rem;
    padding: var(--ray-space-2);
  }
  :host([variant="card"]) .thumb { width: 100%; height: auto; aspect-ratio: 4 / 3; }
  :host([variant="card"]) .thumb [data-ray-icon] { --ray-icon-size: 1.75rem; }
  :host([variant="card"]) .badge { bottom: 6px; font-size: 0.625rem; }
  :host([variant="card"]) .text { padding: 0 var(--ray-space-1) var(--ray-space-1); }
  :host([variant="card"]) .remove {
    position: absolute;
    top: calc(var(--ray-space-2) + 4px);
    inset-inline-end: calc(var(--ray-space-2) + 4px);
    background: var(--ray-card);
    box-shadow: var(--ray-shadow-xs);
    opacity: 1;
  }
  [hidden] { display: none !important; }
`;

const IMAGE = /^image\//;

/** 12 KB, 3.4 MB… (base 1024, like file managers). */
export function formatBytes(bytes, locale) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 || v >= 10 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v)} ${units[i]}`;
}

/** "report.final.pdf" -> "PDF"; else from the MIME type ("image/png" -> "PNG"). */
export function extension(name, type) {
  const m = /\.([a-z0-9]{1,5})$/i.exec(String(name ?? ""));
  if (m) return m[1].toUpperCase();
  const sub = String(type ?? "").split("/")[1];
  return sub ? sub.split(/[+;.-]/)[0].slice(0, 5).toUpperCase() : "";
}

/** The registry icon for a file: "image" for images, "file" otherwise. */
export function iconFor(type, name) {
  const t = String(type ?? "");
  if (IMAGE.test(t) || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(String(name ?? ""))) return "image";
  return "file";
}

export class RayAttachment extends RayElement {
  static properties = {
    name: { type: String, reflect: true },
    size: { type: Number },
    type: { type: String, reflect: true },
    src: { type: String },
    href: { type: String, reflect: true },
    progress: { type: Number },
    status: { type: String, reflect: true },
    error: { type: String },
    removable: { type: Boolean, reflect: true },
    removeLabel: { type: String },
    variant: { type: String, reflect: true, default: "row" },
    disabled: { type: Boolean, reflect: true },
  };
  static styles = [styles];
  static template = `
    <div class="item" part="item" role="group">
      <span class="thumb" part="thumbnail"><img alt="" hidden><span class="icon" aria-hidden="true"></span><span class="badge" part="badge" aria-hidden="true"></span></span>
      <span class="text"><span class="name-box"></span><span class="meta" part="meta"></span></span>
      <button class="remove focus-ring" part="remove" type="button" hidden><span data-ray-icon="ui.remove" aria-hidden="true"></span></button>
      <span class="bar" part="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" hidden><span></span></span>
    </div>`;

  #file = null;
  #objectUrl = null;
  #failed = null;

  constructor() {
    super();
    this.$("img").addEventListener("error", () => {
      this.#failed = this.$("img").getAttribute("src");
      this.requestUpdate();
    });
    this.$(".remove").addEventListener("click", () => {
      if (this.disabled) return;
      if (this.emit("ray-remove", { name: this.name ?? "", file: this.#file }, { cancelable: true })) this.remove();
    });
  }

  /** A File to show: fills name, size, type and, for images, a thumbnail. */
  get file() {
    return this.#file;
  }

  set file(f) {
    this.#revoke();
    this.#file = f ?? null;
    if (f) {
      this.name = f.name;
      this.size = f.size;
      this.type = f.type;
      // A Blob has bytes to show; a file the host chose (HostFile) is only a path.
      if (IMAGE.test(f.type) && f instanceof Blob && typeof URL.createObjectURL === "function") {
        this.#objectUrl = URL.createObjectURL(f);
        this.src = this.#objectUrl;
      }
    }
    this.requestUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#revoke();
  }

  #revoke() {
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      if (this.src === this.#objectUrl) this.src = undefined;
      this.#objectUrl = null;
    }
  }

  /** The effective status: an explicit one, else "uploading" while progress is set. */
  get state() {
    if (this.status) return this.status;
    return this.progress === undefined || this.progress === null || Number.isNaN(this.progress) ? "done" : "uploading";
  }

  update() {
    const name = this.name ?? "";
    const size = formatBytes(this.size);
    const state = this.state;

    // Thumbnail (images with a working src) or the type icon + extension badge.
    const thumb = this.$(".thumb");
    const img = this.$("img");
    const showImage = Boolean(this.src) && this.#failed !== this.src && iconFor(this.type, name) === "image";
    img.hidden = !showImage;
    if (showImage && img.getAttribute("src") !== this.src) img.src = this.src;
    thumb.toggleAttribute("data-image", showImage);
    const icon = this.$(".icon");
    icon.hidden = showImage;
    const iconName = state === "error" ? "alert-triangle" : iconFor(this.type, name);
    if (icon.getAttribute("data-ray-icon") !== iconName) {
      icon.setAttribute("data-ray-icon", iconName);
      this.paintIcons(thumb);
    }
    this.$(".badge").textContent = extension(name, this.type);

    // Name: a link with href, plain text otherwise.
    const box = this.$(".name-box");
    const tag = this.href && !this.disabled ? "a" : "span";
    let el = box.firstElementChild;
    if (!el || el.localName !== tag) {
      el = document.createElement(tag);
      el.className = "name";
      el.setAttribute("part", "name");
      box.replaceChildren(el);
    }
    el.textContent = name;
    el.title = name;
    if (tag === "a") {
      el.href = this.href;
      el.setAttribute("download", name);
    }

    // Meta line: size, upload state or error.
    const pct = Math.max(0, Math.min(100, Math.round(Number(this.progress) || 0)));
    let meta = size;
    if (state === "uploading") meta = this.progress === undefined || this.progress === null ? "Uploading…" : `Uploading… ${pct}%`;
    else if (state === "error") meta = this.error || "Upload failed";
    this.$(".meta").textContent = meta;

    const bar = this.$(".bar");
    const uploading = state === "uploading" && this.progress !== undefined && this.progress !== null;
    bar.hidden = !uploading;
    if (uploading) {
      bar.style.setProperty("--_pct", `${pct}%`);
      bar.setAttribute("aria-valuenow", String(pct));
      bar.setAttribute("aria-label", `Uploading ${name}`);
    }

    const remove = this.$(".remove");
    remove.hidden = !this.removable;
    remove.disabled = Boolean(this.disabled);
    remove.setAttribute("aria-label", (this.removeLabel || "Remove {name}").replace("{name}", name));

    const item = this.$(".item");
    item.setAttribute("aria-label", [name, size].filter(Boolean).join(", "));
    item.toggleAttribute("aria-busy", state === "uploading");
    if (state === "error") item.setAttribute("aria-invalid", "true");
    else item.removeAttribute("aria-invalid");
  }
}

const listStyles = css`
  :host { display: flex; flex-wrap: wrap; gap: var(--ray-space-2); align-items: flex-start; }
  :host([hidden]) { display: none; }
`;

/** A wrapping row of attachments (layout only). */
export class RayAttachments extends RayElement {
  static styles = [listStyles];
  static template = `<slot></slot>`;
}

define("ray-attachment", RayAttachment);
define("ray-attachments", RayAttachments);
