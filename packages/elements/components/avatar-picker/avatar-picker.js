// <ray-avatar-picker>: a profile picture field. A ray-avatar (the initials of
// display-name without a picture), "Choose photo" / "Change photo" and
// "Remove photo", and a sheet (a bottom drawer on a narrow screen, a dialog
// otherwise) with a ray-image-crop to frame the chosen image in a circle
// before it is kept.
//
// The value is the framed picture: a data URL (the default, easy to keep in
// JSON) or, with output="blob", a Blob (to upload). It takes part in a <form>
// under `name`.

import { css, define } from "../../core/core.js";
import { FormControl, fieldStyles } from "../../core/form.js";
import "../avatar/avatar.js";
import "../button/button.js";
import "../image-crop/image-crop.js";
import "../drawer/drawer.js";
import "../dialog/dialog.js";

const styles = css`
  :host { display: flex; flex-direction: column; }
  .row {
    display: flex;
    align-items: center;
    gap: var(--ray-space-4);
  }
  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ray-space-2);
  }
  :host([layout="inline"]) .actions { flex-direction: row; flex-wrap: wrap; }
  .crop { width: 100%; max-width: 28rem; margin-inline: auto; --ray-image-crop-inset: var(--ray-space-3); }
  .footer { display: contents; }
`;

// A narrow screen frames the picture in a bottom sheet.
const NARROW = "(max-width: 40em)";

/** The extension of a picture's MIME type, for the file name in a form. */
const extension = (type) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[type] ?? "img";

export class RayAvatarPicker extends FormControl {
  static properties = {
    name: { type: String, reflect: true },
    value: { type: String },
    output: { type: String, reflect: true, default: "dataurl" },
    label: { type: String },
    description: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    displayName: { type: String, attribute: "display-name" },
    accept: { type: String, default: "image/*" },
    size: { type: String, reflect: true, default: "xl" },
    color: { type: String },
    variant: { type: String, default: "light" },
    radius: { type: String },
    buttonSize: { type: String, attribute: "button-size", default: "sm" },
    layout: { type: String, reflect: true, default: "stack" },
    sheet: { type: String, reflect: true, default: "auto" },
    outputSize: { type: String, attribute: "output-size", default: "320" },
    type: { type: String, default: "image/jpeg" },
    quality: { type: Number, default: 0.85 },
    maxZoom: { type: Number, attribute: "max-zoom", default: 4 },
    pickLabel: { type: String, attribute: "pick-label", default: "Choose photo" },
    changeLabel: { type: String, attribute: "change-label", default: "Change photo" },
    removeLabel: { type: String, attribute: "remove-label", default: "Remove photo" },
    sheetLabel: { type: String, attribute: "sheet-label", default: "Adjust the photo" },
    useLabel: { type: String, attribute: "use-label", default: "Use photo" },
    cancelLabel: { type: String, attribute: "cancel-label", default: "Cancel" },
    cropLabel: { type: String, attribute: "crop-label", default: "Photo framing" },
    zoomLabel: { type: String, attribute: "zoom-label", default: "Zoom" },
    failedLabel: { type: String, attribute: "failed-label", default: "That image could not be opened." },
  };
  static styles = [fieldStyles, styles];
  static template = `
    <span class="label" part="label" id="label" hidden><span class="label-text"></span><span class="required" aria-hidden="true" hidden> *</span></span>
    <div class="description" part="description" id="description" hidden></div>
    <div class="row" part="row" role="group" aria-labelledby="label" aria-describedby="description error">
      <ray-avatar class="avatar" part="avatar"></ray-avatar>
      <div class="actions" part="actions">
        <ray-button class="pick" part="pick" variant="light"><span slot="left" data-ray-icon="ui.photo" aria-hidden="true"></span><span class="pick-text"></span></ray-button>
        <ray-button class="remove" part="remove" variant="subtle" color="red" hidden><span slot="left" data-ray-icon="ui.delete" aria-hidden="true"></span><span class="remove-text"></span></ray-button>
      </div>
    </div>
    <input type="file" tabindex="-1" aria-hidden="true" hidden>
    <div class="error" part="error" id="error" aria-live="polite" hidden></div>`;

  #objectUrl = "";
  #objectFor = null;
  #failed = "";
  #sheet = null;
  #crop = null;

  constructor() {
    super();
    this.input = this.$("input");
    this.$(".pick").addEventListener("click", () => this.pick());
    this.$(".remove").addEventListener("click", () => {
      this.clear();
      this.$(".pick").focus();
    });
    this.input.addEventListener("change", () => {
      const file = this.input.files?.[0];
      this.input.value = "";
      if (file) this.edit(file);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#revoke();
  }

  /** Opens the system picker for a new picture (then the crop sheet). */
  pick() {
    if (this.effectivelyDisabled) return;
    // The same file chosen twice still fires change.
    this.input.value = "";
    this.input.click();
  }

  /**
   * Opens the crop sheet on an image (a File, Blob or URL): one dropped,
   * pasted or taken some other way. "Use photo" makes it the value.
   */
  edit(src) {
    if (this.effectivelyDisabled || !src) return;
    this.#failed = "";
    const sheet = this.#ensureSheet();
    const crop = this.#crop;
    crop.reset();
    crop.src = src;
    this.requestUpdate();
    sheet.show();
  }

  /** Removes the picture (fires change when there was one). */
  clear() {
    if (!this.value) return;
    this.#setValue(null);
  }

  /** The value as a Blob (whatever `output` is), or null without a picture. */
  async toBlob() {
    const v = this.value;
    if (!v) return null;
    if (v instanceof Blob) return v;
    return (await fetch(v)).blob();
  }

  update(changed) {
    super.update?.(changed);
    const has = Boolean(this.value);
    const disabled = this.effectivelyDisabled;

    const label = this.$(".label");
    label.hidden = !this.label;
    this.$(".label-text").textContent = this.label ?? "";
    this.$(".required").hidden = !this.required;
    const desc = this.$("#description");
    desc.hidden = !this.description;
    desc.textContent = this.description ?? "";
    const message = this.#failed || this.error || "";
    const err = this.$("#error");
    err.hidden = !message;
    err.textContent = message;

    const row = this.$(".row");
    const aria = this.getAttribute("aria-label");
    if (this.label) row.setAttribute("aria-labelledby", "label");
    else row.removeAttribute("aria-labelledby");
    if (!this.label && aria) row.setAttribute("aria-label", aria);
    else row.removeAttribute("aria-label");
    const described = [this.description ? "description" : "", message ? "error" : ""].filter(Boolean).join(" ");
    if (described) row.setAttribute("aria-describedby", described);
    else row.removeAttribute("aria-describedby");

    const avatar = this.$(".avatar");
    avatar.name = this.displayName ?? "";
    avatar.size = this.size;
    avatar.variant = this.variant;
    if (this.color) avatar.color = this.color;
    else avatar.removeAttribute("color");
    if (this.radius) avatar.radius = this.radius;
    else avatar.removeAttribute("radius");
    const src = this.#src();
    if (src) avatar.src = src;
    else avatar.removeAttribute("src");

    const pick = this.$(".pick");
    const remove = this.$(".remove");
    this.$(".pick-text").textContent = has ? this.changeLabel : this.pickLabel;
    this.$(".remove-text").textContent = this.removeLabel;
    remove.hidden = !has;
    for (const b of [pick, remove]) {
      b.size = this.buttonSize;
      b.disabled = disabled;
      if (this.error) b.setAttribute("aria-invalid", "true");
      else b.removeAttribute("aria-invalid");
    }
    this.input.accept = this.accept ?? "";

    this.#syncSheet();
    this.#commit();
  }

  /** The URL the avatar shows: the data URL, or an object URL of the Blob. */
  #src() {
    const v = this.value;
    if (!v) {
      this.#revoke();
      return "";
    }
    if (typeof v === "string") {
      this.#revoke();
      return v;
    }
    if (this.#objectFor !== v) {
      this.#revoke();
      this.#objectUrl = URL.createObjectURL(v);
      this.#objectFor = v;
    }
    return this.#objectUrl;
  }

  #revoke() {
    if (this.#objectUrl) URL.revokeObjectURL(this.#objectUrl);
    this.#objectUrl = "";
    this.#objectFor = null;
  }

  #setValue(value) {
    this.commitProperty("value", value);
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // The sheet is made the first time it is needed: a drawer from the bottom
  // on a narrow screen (or sheet="drawer"), else a dialog.
  #ensureSheet() {
    const tag = this.sheet === "drawer" || (this.sheet !== "dialog" && matchMedia(NARROW).matches)
      ? "ray-drawer" : "ray-dialog";
    if (this.#sheet?.localName === tag) return this.#sheet;
    const crop = this.#crop ?? this.#makeCrop();
    this.#sheet?.remove();
    const sheet = document.createElement(tag);
    sheet.className = "sheet";
    sheet.setAttribute("part", "sheet");
    if (tag === "ray-drawer") {
      sheet.position = "bottom";
      sheet.size = "content";
    } else {
      sheet.size = "sm";
    }
    const footer = document.createElement("div");
    footer.className = "footer";
    footer.slot = "footer";
    const cancel = document.createElement("ray-button");
    cancel.className = "cancel";
    cancel.setAttribute("part", "cancel");
    cancel.variant = "default";
    cancel.setAttribute("data-dialog-close", "cancel");
    const use = document.createElement("ray-button");
    use.className = "use";
    use.setAttribute("part", "use");
    use.innerHTML = `<span slot="left" data-ray-icon="ui.confirm" aria-hidden="true"></span><span class="use-text"></span>`;
    use.addEventListener("click", () => this.#use());
    footer.append(cancel, use);
    sheet.append(crop, footer);
    // The sheet's and the crop's own events are details of this component.
    for (const type of ["ray-open", "ray-close", "ray-request-close", "ray-load"]) {
      sheet.addEventListener(type, (e) => e.stopPropagation());
    }
    // Closed: release the working copy (unless it was reopened during the exit).
    sheet.addEventListener("ray-close", () => {
      if (!sheet.open) this.#crop.src = null;
    });
    this.shadowRoot.append(sheet);
    this.#sheet = sheet;
    this.#syncSheet();
    this.paintIcons(sheet);
    return sheet;
  }

  #makeCrop() {
    const crop = document.createElement("ray-image-crop");
    crop.className = "crop";
    crop.setAttribute("part", "crop");
    crop.shape = "circle";
    crop.aspect = "1";
    crop.zoomControl = true;
    crop.addEventListener("ray-error", (e) => {
      e.stopPropagation();
      this.#failed = this.failedLabel;
      this.requestUpdate();
      this.#sheet?.close("error");
      this.emit("ray-error", { error: e.detail?.error });
    });
    this.#crop = crop;
    return crop;
  }

  #syncSheet() {
    const sheet = this.#sheet;
    if (!sheet) return;
    const crop = this.#crop;
    sheet.label = this.sheetLabel;
    crop.outputSize = this.outputSize;
    crop.type = this.type;
    crop.quality = this.quality;
    crop.maxZoom = this.maxZoom;
    crop.label = this.cropLabel;
    crop.zoomLabel = this.zoomLabel;
    sheet.querySelector(".cancel").textContent = this.cancelLabel;
    sheet.querySelector(".use-text").textContent = this.useLabel;
  }

  async #use() {
    const crop = this.#crop;
    if (!(await crop.ready) || !crop.loaded) return;
    const value = this.output === "blob" ? await crop.toBlob() : crop.toDataURL();
    if (!value) return;
    this.#failed = "";
    this.#sheet.close("use");
    this.#setValue(value);
    this.$(".pick").focus();
  }

  #commit() {
    const v = this.value;
    if (!this.name || !v) this.internals.setFormValue(null);
    else if (typeof v === "string") this.internals.setFormValue(v);
    else {
      const type = v.type || this.type;
      const file = v instanceof File ? v : new File([v], `${this.name}.${extension(type)}`, { type });
      const data = new FormData();
      data.append(this.name, file);
      this.internals.setFormValue(data);
    }
    if (this.required && !v) this.internals.setValidity({ valueMissing: true }, "Please choose a photo.", this.$(".pick"));
    else this.internals.setValidity({});
  }

  formResetCallback() {
    this.#failed = "";
    this.value = this.getAttribute("value") || null;
  }

  formStateRestoreCallback(state) {
    this.value = state instanceof FormData ? (state.get(this.name) || null) : (state || null);
  }
}

define("ray-avatar-picker", RayAvatarPicker);
