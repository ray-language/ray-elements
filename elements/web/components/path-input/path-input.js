// <ray-path-input>: a field for a path on the user's disk: a file to open, a
// folder, or where to save. A ray-input underneath: label, description,
// error, sizes, validation and forms work the same, and the path can always
// be typed or pasted.
//
// With a native host that offers "pick_path" (core/host.js; a std/ui window
// with core/raylang.js), a Browse… button opens the system dialog, starting
// where the current path points; the choice fills the field and fires input
// and change. Without one (a browser), it is a plain text field: a page
// cannot read paths from a browser's file picker.

import { css, define } from "../../core/core.js";
import { fieldTemplate } from "../../core/form.js";
import { getHost, hostCan, onHostChange, acceptFilters } from "../../core/host.js";
import { RayInput } from "../input/input.js";

const styles = css`
  .control { font-variant-ligatures: none; }
  .browse {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.35em;
    height: calc(var(--_h) - 0.5rem);
    margin-inline-end: 0.25rem;
    padding: 0 0.6em;
    font: inherit;
    font-size: 0.9em;
    font-weight: 500;
    color: var(--ray-foreground);
    white-space: nowrap;
    background: var(--ray-default-hover);
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .browse:hover { background: color-mix(in srgb, var(--ray-foreground) 12%, var(--ray-default-hover)); }
  .browse:disabled { cursor: not-allowed; opacity: 0.6; }
  .browse[hidden] { display: none; }
  .browse svg { width: 1.05em; height: 1.05em; }
`;

const ICONS = { open: "file", folder: "folder", save: "file" };

/** The folder part of a path ("" when it has none), with / or \ separators. */
export function dirName(path) {
  const p = String(path ?? "");
  const cut = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return cut <= 0 ? (cut === 0 ? p.slice(0, 1) : "") : p.slice(0, cut);
}

/** The last part of a path. */
export function baseName(path) {
  return String(path ?? "").split(/[\\/]/).pop();
}

export class RayPathInput extends RayInput {
  static properties = {
    ...RayInput.properties,
    mode: { type: String, reflect: true, default: "open" },
    accept: { type: String, reflect: true },
    browseLabel: { type: String, attribute: "browse-label", default: "Browse…" },
    dialogTitle: { type: String, attribute: "dialog-title" },
  };
  static styles = [...RayInput.styles, styles];
  static template = fieldTemplate(
    `<input id="control" class="control" part="input" spellcheck="false" autocapitalize="off" autocomplete="off">` +
      `<button type="button" class="browse focus-ring" part="browse" hidden><span data-ray-icon="file" aria-hidden="true"></span><span class="browse-text"></span></button>`,
  );

  #stop = null;

  wire() {
    super.wire();
    this.$(".browse").addEventListener("click", () => this.browse());
  }

  connectedCallback() {
    super.connectedCallback();
    this.#stop ??= onHostChange(() => this.requestUpdate());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stop?.();
    this.#stop = null;
  }

  /** Whether Browse… is available (a native host offers "pick_path"). */
  get canBrowse() {
    return hostCan("pick_path");
  }

  /**
   * Opens the system dialog for `mode`; resolves to the chosen path, or null
   * when the user cancels or there is no native host.
   */
  async browse() {
    if (this.effectivelyDisabled || this.readonly || !this.canBrowse) return null;
    const current = this.value ?? "";
    let path;
    try {
      path = await getHost().pickPath({
        mode: this.mode || "open",
        title: this.dialogTitle ?? this.label ?? "",
        directory: this.mode === "folder" ? current : dirName(current),
        suggested: this.mode === "save" ? baseName(current) : "",
        filters: this.mode === "folder" ? [] : acceptFilters(this.accept),
      });
    } catch (e) {
      this.emit("ray-error", { error: e });
      return null;
    }
    if (path === null || path === undefined) return null;
    this.value = path;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
    this.control.focus();
    return path;
  }

  update(changed) {
    super.update(changed);
    const btn = this.$(".browse");
    btn.hidden = !this.canBrowse;
    btn.disabled = this.effectivelyDisabled || Boolean(this.readonly);
    this.$(".browse-text").textContent = this.browseLabel;
    const icon = btn.firstElementChild;
    const name = ICONS[this.mode] ?? "file";
    if (icon.dataset.rayIcon !== name || !icon.firstChild) {
      icon.dataset.rayIcon = name;
      this.paintIcons(btn);
    }
  }
}

define("ray-path-input", RayPathInput);
