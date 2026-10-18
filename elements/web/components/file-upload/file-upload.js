// <ray-file-upload>: a drop zone to pick files (shadcn/Mantine Dropzone).
// Drag files onto it, click it, press Enter/Space on it or paste into it;
// the chosen files are listed below as <ray-attachment> rows (image
// thumbnails, size, remove button) and submitted with its <form>.
//
// `accept`, `max-size` and `max-files` are checked as files arrive: a drag
// that can only be refused turns the zone red before the drop, and refused
// files fire ray-reject and are explained under the zone. Without `multiple`
// a new file replaces the current one.
//
// Uploading is the app's job: attachmentFor(file) returns the row of a file,
// whose `progress`, `status` and `error` show how its upload goes.
//
//   upload.addEventListener("change", () => {
//     for (const file of upload.lastChange.added) send(file, (pct) => { upload.attachmentFor(file).progress = pct; });
//   });
//
// With `native` and a native host (core/host.js, as in a std/ui window with
// core/raylang.js), browsing opens the system dialog and gives paths instead
// of bytes: those files are HostFile objects, listed in `paths` and submitted
// as their path, for the program to read. Drop and paste keep giving Files.

import { css, define } from "../../core/core.js";
import { FormControl, fieldStyles } from "../../core/form.js";
import { applyColor } from "../../core/styles.js";
import { collapseOut } from "../../core/motion.js";
import { formatBytes } from "../attachment/attachment.js";
import { getHost, hostCan, acceptFilters, HostFile } from "../../core/host.js";

const styles = css`
  :host {
    --_fs: var(--ray-font-size-sm);
    --_zone-bg: color-mix(in srgb, var(--ray-muted) 45%, var(--ray-background));
    --_dash: color-mix(in srgb, var(--ray-muted-foreground) 40%, var(--ray-border));
  }
  .zone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--ray-space-3);
    width: 100%;
    min-height: 11rem;
    margin: 0;
    padding: var(--ray-space-6) var(--ray-space-4);
    font: inherit;
    font-size: var(--_fs);
    line-height: var(--ray-line-height-sm);
    color: var(--ray-foreground);
    text-align: center;
    background: var(--_zone-bg);
    border: 1.5px dashed var(--_dash);
    border-radius: var(--ray-radius-lg);
    cursor: pointer;
    transition:
      border-color var(--ray-duration-fast) var(--ray-easing-standard),
      background var(--ray-duration-fast) var(--ray-easing-standard),
      transform var(--ray-duration-base) var(--ray-easing-out);
  }
  .zone:hover { border-color: color-mix(in srgb, var(--_filled) 55%, var(--ray-border)); background: color-mix(in srgb, var(--_filled) 4%, var(--_zone-bg)); }
  .zone:focus-visible { outline: var(--ray-focus-ring-width) solid var(--ray-ring); outline-offset: 2px; }
  .zone:disabled { cursor: not-allowed; opacity: 0.6; }
  .zone:disabled:hover { border-color: var(--_dash); background: var(--_zone-bg); }
  .zone[data-invalid] { border-color: var(--ray-destructive); }

  /* The icon sits on a small raised tile that lifts on hover. */
  .glyph {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 3rem;
    height: 3rem;
    color: var(--ray-muted-foreground);
    background: var(--ray-raised);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-md);
    box-shadow: var(--ray-shadow-xs);
    --ray-icon-size: 1.25rem;
    transition:
      transform var(--ray-duration-base) var(--ray-easing-out),
      color var(--ray-duration-fast) var(--ray-easing-standard),
      background var(--ray-duration-fast) var(--ray-easing-standard);
  }
  .glyph ::slotted(*) { --ray-icon-size: 1.25rem; }
  .zone:not(:disabled):hover .glyph { transform: translateY(-2px); color: var(--_light-color); }
  .copy { display: grid; gap: var(--ray-space-1); min-width: 0; }
  .title { font-weight: var(--ray-font-weight-medium); }
  .browse {
    color: var(--_light-color);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
    text-underline-offset: 3px;
  }
  .zone:hover .browse { text-decoration-color: currentColor; }
  .hint { font-size: var(--ray-font-size-xs); color: var(--ray-muted-foreground); }
  /* Touch screens rarely drag files: the title says what a tap does. */
  .tap { display: none; }
  @media (hover: none) and (pointer: coarse) {
    .drop, .browse-or { display: none; }
    .tap { display: inline; }
  }
  .hint:empty { display: none; }
  .button { display: none; }

  /* Files dragged over it: solid accent border, the tile fills and bobs. */
  :host([data-dragging]) .zone {
    border-style: solid;
    border-color: var(--_filled);
    background: color-mix(in srgb, var(--_filled) 8%, var(--ray-background));
    transform: scale(1.01);
  }
  :host([data-dragging]) .glyph {
    color: var(--_contrast);
    background: var(--_filled);
    border-color: transparent;
    animation: ray-upload-bob 0.9s var(--ray-easing-standard) infinite alternate;
  }
  :host([data-dragging][data-reject]) .zone {
    border-color: var(--ray-destructive);
    background: color-mix(in srgb, var(--ray-destructive) 7%, var(--ray-background));
  }
  :host([data-dragging][data-reject]) .glyph { color: var(--ray-destructive-foreground); background: var(--ray-destructive); animation: none; }
  :host([data-dragging][data-reject]) .title { color: var(--ray-destructive); }
  @keyframes ray-upload-bob { from { transform: translateY(0); } to { transform: translateY(-4px); } }

  /* variant="compact": one row — tile, text and a Browse button. */
  :host([variant="compact"]) .zone {
    flex-direction: row;
    justify-content: flex-start;
    min-height: 0;
    padding: var(--ray-space-3);
    text-align: start;
    border-radius: var(--ray-radius-md);
  }
  :host([variant="compact"][data-dragging]) .zone { transform: none; }
  :host([variant="compact"]) .glyph { width: 2.5rem; height: 2.5rem; border-radius: var(--ray-radius-default); }
  :host([variant="compact"]) .copy { flex: 1; }
  :host([variant="compact"]) .browse-or { display: none; }
  :host([variant="compact"]) .button {
    display: inline-flex;
    align-items: center;
    flex: none;
    height: var(--ray-control-height-xs);
    padding: 0 var(--ray-space-3);
    font-size: var(--ray-font-size-xs);
    font-weight: var(--ray-font-weight-medium);
    background: var(--ray-default);
    border: 1px solid var(--ray-border);
    border-radius: var(--ray-radius-default);
    transition: background var(--ray-duration-fast) var(--ray-easing-standard);
  }
  :host([variant="compact"]) .zone:not(:disabled):hover .button { background: var(--ray-default-hover); }

  .files { display: grid; gap: var(--ray-space-2); margin-top: var(--ray-space-3); }
  .files:empty { display: none; }
  .files > ray-attachment { display: flex; animation: ray-upload-in var(--ray-duration-base) var(--ray-easing-out); }
  .files > ray-attachment::part(item) { width: 100%; }
  :host([list="cards"]) .files { display: flex; flex-wrap: wrap; }
  :host([list="cards"]) .files > ray-attachment::part(item) { width: 9rem; }
  :host([list="none"]) .files { display: none; }
  @keyframes ray-upload-in { from { opacity: 0; transform: translateY(-4px); } }
`;

const SIZE = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?\s*$/i;
const UNITS = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };

/** Bytes from a number or a size like "10 MB", "512kb"; NaN if neither. */
export function parseSize(v) {
  if (v === null || v === undefined || v === "") return NaN;
  if (typeof v === "number") return v;
  const m = SIZE.exec(String(v));
  return m ? Math.round(Number(m[1]) * UNITS[(m[2] ?? "b").toLowerCase()]) : NaN;
}

const acceptList = (accept) => String(accept ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const matchesType = (type, pattern) =>
  pattern.endsWith("/*") ? type.startsWith(pattern.slice(0, -1)) : type === pattern;

/** Whether a file passes an `accept` list (".pdf", "image/*", "application/json"). */
export function matchesAccept(file, accept) {
  const list = acceptList(accept);
  if (list.length === 0) return true;
  const name = String(file.name ?? "").toLowerCase();
  const type = String(file.type ?? "").toLowerCase();
  return list.some((a) => (a.startsWith(".") ? name.endsWith(a) : matchesType(type, a)));
}


const KINDS = { image: "Images", video: "Videos", audio: "Audio", text: "Text files" };

/** A short human list of an `accept` value: "PNG, JPG or PDF", "Images". */
export function describeAccept(accept) {
  const names = [];
  for (const a of acceptList(accept)) {
    let n;
    if (a.startsWith(".")) n = a.slice(1).toUpperCase();
    else if (a.endsWith("/*")) n = KINDS[a.slice(0, -2)] ?? a;
    else n = a.split("/")[1]?.replace(/^x-/, "").split(/[+.]/).pop()?.toUpperCase() ?? a;
    if (!names.includes(n)) names.push(n);
  }
  if (names.length < 2) return names[0] ?? "";
  // "PNG or images", not "PNG or Images".
  for (const [i, n] of names.entries()) if (Object.values(KINDS).includes(n)) names[i] = n.toLowerCase();
  return `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
}

export class RayFileUpload extends FormControl {
  static properties = {
    name: { type: String, reflect: true },
    label: { type: String },
    description: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    accept: { type: String, reflect: true },
    multiple: { type: Boolean, reflect: true },
    native: { type: Boolean, reflect: true },
    maxSize: { type: String, attribute: "max-size" },
    maxFiles: { type: Number, attribute: "max-files" },
    hint: { type: String },
    dropLabel: { type: String, attribute: "drop-label", default: "Drag files here" },
    browseLabel: { type: String, attribute: "browse-label", default: "browse" },
    activeLabel: { type: String, attribute: "active-label", default: "Drop to add files" },
    tapLabel: { type: String, attribute: "tap-label", default: "Choose files" },
    variant: { type: String, reflect: true, default: "default" },
    list: { type: String, reflect: true, default: "rows" },
    color: { type: String, reflect: true },
  };
  static styles = [fieldStyles, styles];
  static template = `
    <span class="label" part="label" id="label" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></span>
    <div class="description" part="description" id="description" hidden></div>
    <button type="button" class="zone" part="dropzone" aria-labelledby="label title hint pill" aria-describedby="description error">
      <span class="glyph" part="icon"><slot name="icon"><span data-ray-icon="ui.upload"></span></slot></span>
      <span class="copy">
        <span class="title" id="title"></span>
        <span class="hint" id="hint" part="hint"></span>
      </span>
      <span class="button" id="pill"></span>
    </button>
    <input type="file" tabindex="-1" aria-hidden="true" hidden>
    <div class="error" part="error" id="error" aria-live="polite" hidden></div>
    <div class="files" part="files" role="list"></div>`;

  /** @type {File[]} */
  #files = [];
  #lastChange = null;
  /** @type {Map<File, HTMLElement>} */
  #rows = new Map();
  #rejected = "";
  #refusal = "";
  #depth = 0;

  constructor() {
    super();
    this.zone = this.$(".zone");
    this.input = this.$("input");
    this.zone.addEventListener("click", () => this.open());
    this.input.addEventListener("change", () => {
      this.#take([...this.input.files]);
      this.input.value = "";
    });
    this.zone.addEventListener("paste", (e) => {
      const files = [...(e.clipboardData?.files ?? [])];
      if (files.length === 0 || this.disabled) return;
      e.preventDefault();
      this.#take(files);
    });
    // The whole host is the drop target, so a drag over the list counts too.
    this.addEventListener("dragenter", (e) => this.#dragEnter(e));
    this.addEventListener("dragover", (e) => this.#dragOver(e));
    this.addEventListener("dragleave", () => {
      if (--this.#depth <= 0) this.#dragEnd();
    });
    this.addEventListener("drop", (e) => {
      if (!this.#hasFiles(e)) return;
      e.preventDefault();
      this.#dragEnd();
      if (!this.effectivelyDisabled) this.#take([...e.dataTransfer.files]);
    });
    // A row's × removes its file (with a collapse) instead of just the row.
    this.$(".files").addEventListener("ray-remove", (e) => {
      e.preventDefault();
      const file = e.detail?.file;
      if (file) this.removeFile(file);
    });
  }

  /** The chosen files, in the order they were added. */
  get files() {
    return [...this.#files];
  }

  /** The paths of the files the native dialog chose (see `native`). */
  get paths() {
    return this.#files.filter((f) => f instanceof HostFile).map((f) => f.path);
  }

  /**
   * What the last change event changed: { added, removed }. null before the
   * first one, and after assigning `files` (which fires nothing).
   */
  get lastChange() {
    return this.#lastChange;
  }

  set files(list) {
    const next = [...(list ?? [])];
    this.#lastChange = null;
    for (const f of this.#files) if (!next.includes(f)) this.#dropRow(f, false);
    this.#files = next;
    this.#rejected = "";
    this.#renderRows();
    this.requestUpdate();
  }

  /** Opens the system file picker (the native dialog with `native` and a host). */
  open() {
    if (this.effectivelyDisabled) return;
    if (this.native && hostCan("pick_files")) {
      this.#pickNative();
      return;
    }
    this.input.click();
  }

  async #pickNative() {
    try {
      const files = await getHost().pickFiles({
        title: this.label ?? "",
        multiple: Boolean(this.multiple),
        filters: acceptFilters(this.accept, describeAccept(this.accept)),
      });
      if (files.length) this.#take(files);
    } catch (e) {
      this.emit("ray-error", { error: e });
    }
  }

  /**
   * Adds files as if they were dropped: checks them, fires ray-reject for the
   * refused ones and change for the rest. Returns both lists.
   */
  addFiles(list) {
    return this.#take([...(list ?? [])]);
  }

  /** Removes a file (fires change). */
  removeFile(file) {
    const i = this.#files.indexOf(file);
    if (i < 0) return false;
    this.#files.splice(i, 1);
    this.#dropRow(file, true);
    this.#rejected = "";
    this.requestUpdate();
    this.#changed([], [file]);
    return true;
  }

  /** Removes every file (fires change if there were any). */
  clear() {
    const removed = this.#files;
    if (removed.length === 0) return;
    this.#files = [];
    for (const f of removed) this.#dropRow(f, false);
    this.#rejected = "";
    this.requestUpdate();
    this.#changed([], removed);
  }

  /** The <ray-attachment> row of a file: set its progress, status and error. */
  attachmentFor(file) {
    return this.#rows.get(file) ?? null;
  }

  formResetCallback() {
    this.files = [];
  }

  /** Effective limit of files: 1 without `multiple`. */
  get #limit() {
    if (!this.multiple) return 1;
    return this.maxFiles > 0 ? Math.floor(this.maxFiles) : Infinity;
  }

  #take(incoming) {
    const accepted = [];
    const rejected = [];
    const max = parseSize(this.maxSize);
    for (const file of incoming) {
      if (!matchesAccept(file, this.accept)) {
        rejected.push({ file, reason: "type", message: `${file.name} isn't an accepted file type.` });
      } else if (max > 0 && file.size > max) {
        rejected.push({ file, reason: "size", message: `${file.name} is larger than ${formatBytes(max)}.` });
      } else {
        accepted.push(file);
      }
    }
    const removed = [];
    if (!this.multiple) {
      // One file: the newest valid one replaces what was there.
      accepted.splice(0, accepted.length - 1).forEach((file) =>
        rejected.push({ file, reason: "count", message: "Only one file can be added." }));
      if (accepted.length) removed.push(...this.#files);
    } else {
      const room = this.#limit - this.#files.length;
      if (accepted.length > room) {
        const n = this.#limit;
        for (const file of accepted.splice(Math.max(0, room))) {
          rejected.push({ file, reason: "count", message: `Up to ${n} ${n === 1 ? "file" : "files"} can be added.` });
        }
      }
    }
    for (const f of removed) this.#dropRow(f, false);
    this.#files = this.#files.filter((f) => !removed.includes(f)).concat(accepted);
    // Explain refusals, one sentence per reason.
    this.#rejected = [...new Set(rejected.map((r) => r.message))].join(" ");
    if (rejected.length) this.emit("ray-reject", { rejected });
    this.#renderRows();
    this.requestUpdate();
    if (accepted.length || removed.length) this.#changed(accepted, removed);
    return { accepted, rejected };
  }

  #changed(added, removed) {
    this.#lastChange = { added, removed };
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #renderRows() {
    const box = this.$(".files");
    for (const file of this.#files) {
      if (this.#rows.has(file)) continue;
      const row = document.createElement("ray-attachment");
      row.setAttribute("role", "listitem");
      row.removable = true;
      row.file = file;
      if (this.list === "cards") row.variant = "card";
      this.#rows.set(file, row);
      box.append(row);
    }
  }

  async #dropRow(file, animate) {
    const row = this.#rows.get(file);
    if (!row) return;
    this.#rows.delete(file);
    if (animate) {
      const out = collapseOut(row);
      await out.finished;
    }
    row.remove();
  }

  #hasFiles(e) {
    return [...(e.dataTransfer?.types ?? [])].includes("Files");
  }

  #dragEnter(e) {
    if (!this.#hasFiles(e) || this.effectivelyDisabled) return;
    e.preventDefault();
    this.#depth++;
    this.setAttribute("data-dragging", "");
    this.#refusal = this.#wouldReject(e.dataTransfer);
    this.toggleAttribute("data-reject", Boolean(this.#refusal));
    this.requestUpdate();
  }

  #dragOver(e) {
    if (!this.#hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = this.effectivelyDisabled || this.hasAttribute("data-reject") ? "none" : "copy";
  }

  #dragEnd() {
    this.#depth = 0;
    this.removeAttribute("data-dragging");
    this.removeAttribute("data-reject");
    this.requestUpdate();
  }

  // During a drag only the MIME types and the count are known (no names or
  // sizes): refuse early only what is certainly refused. Returns the title
  // to show, "" when the drop may go through.
  #wouldReject(dt) {
    const items = [...(dt?.items ?? [])].filter((i) => i.kind === "file");
    if (items.length === 0) return "";
    if (this.multiple && items.length > this.#limit - this.#files.length) {
      const room = Math.max(0, this.#limit - this.#files.length);
      return room === 0 ? "No more files can be added" : `Only ${room} more ${room === 1 ? "file" : "files"}`;
    }
    const list = acceptList(this.accept);
    if (list.length === 0 || list.some((a) => a.startsWith("."))) return "";
    const refused = items.every((i) => i.type && !list.some((a) => matchesType(i.type.toLowerCase(), a)));
    return refused ? "File type not allowed" : "";
  }

  #autoHint() {
    const parts = [];
    const types = describeAccept(this.accept);
    if (types) parts.push(types);
    const max = parseSize(this.maxSize);
    if (max > 0) parts.push(`up to ${formatBytes(max)}${this.multiple ? " each" : ""}`);
    if (this.multiple && this.maxFiles > 0) parts.push(`max. ${Math.floor(this.maxFiles)} files`);
    return parts.join(" · ");
  }

  update() {
    applyColor(this, this.color);
    const label = this.$(".label");
    label.hidden = !this.label;
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".required").hidden = !this.required;
    const desc = this.$("#description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";

    // Title: "Drag files here or browse"; while dragging, what a drop does.
    const title = this.$(".title");
    const dragging = this.hasAttribute("data-dragging");
    const refused = dragging && this.hasAttribute("data-reject");
    if (refused) {
      title.textContent = this.#refusal || "File type not allowed";
    } else if (dragging) {
      title.textContent = this.activeLabel;
    } else {
      const or = document.createElement("span");
      or.className = "browse-or";
      or.append(" or ");
      const browse = document.createElement("span");
      browse.className = "browse";
      browse.textContent = this.browseLabel;
      or.append(browse);
      const drop = document.createElement("span");
      drop.className = "drop";
      drop.textContent = this.dropLabel;
      const tap = document.createElement("span");
      tap.className = "tap";
      tap.textContent = this.tapLabel;
      title.replaceChildren(drop, or, tap);
    }
    this.$(".hint").textContent = this.hint ?? this.#autoHint();
    const word = this.browseLabel ?? "browse";
    this.$(".button").textContent = word.charAt(0).toUpperCase() + word.slice(1);

    const input = this.input;
    input.multiple = Boolean(this.multiple);
    if (this.accept) input.accept = this.accept;
    else input.removeAttribute("accept");
    if (this.name) input.name = this.name;

    const disabled = this.effectivelyDisabled;
    this.zone.disabled = disabled;
    for (const row of this.#rows.values()) row.disabled = disabled;

    // The app's error wins over the explanation of refused files.
    const message = this.error || this.#rejected;
    const err = this.$("#error");
    err.hidden = !message;
    err.textContent = message;
    this.zone.toggleAttribute("data-invalid", Boolean(message));
    if (message) this.zone.setAttribute("aria-invalid", "true");
    else this.zone.removeAttribute("aria-invalid");
    // Without a visible label, the host's aria-label names the zone.
    const aria = this.getAttribute("aria-label");
    // The name holds every visible word of the zone (WCAG 2.5.3, label in name).
    this.zone.setAttribute("aria-labelledby", this.label ? "label title hint pill" : "title hint pill");
    if (!this.label && aria) this.zone.setAttribute("aria-label", aria);
    else this.zone.removeAttribute("aria-label");

    // Form value: every file under `name`.
    if (this.name && this.#files.length) {
      const data = new FormData();
      for (const f of this.#files) data.append(this.name, f instanceof HostFile ? f.path : f);
      this.internals.setFormValue(data);
    } else {
      this.internals.setFormValue(null);
    }
    if (this.required && this.#files.length === 0) {
      this.internals.setValidity({ valueMissing: true }, "Select at least one file.", this.zone);
    } else {
      this.internals.setValidity({});
    }
  }
}

define("ray-file-upload", RayFileUpload);
