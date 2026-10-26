// <ray-mode-input>: a text field with a menu of modes on one side, like
// ray-password-input's toggle but with any number of choices. Choosing a
// mode applies its attributes to the field (type, placeholder, inputmode,
// pattern… whatever a ray-input takes), so one control says both what a
// value is and the value: "a file at this path", "text", "an amount in €".
//
// A ray-input underneath: label, description, error, sizes, forms, the
// left/right slots and validation work the same.
//
//   <ray-mode-input mode="text">
//     <option value="text" label="Text"></option>
//     <option value="file" label="File" data-icon="file" data-set-placeholder="Path to a file"></option>
//   </ray-mode-input>
//
// or from script: `el.options = [{ value, label, icon, hint, description,
// disabled, attrs: { placeholder: "…" } }]`.
//
// Choosing fires a cancelable ray-mode-change ({ mode, previous, option });
// cancelling it keeps the previous mode. Alt+ArrowDown in the field opens
// the menu. The menu is a ray-menu of radio items, native with native-menu.

import { css, define } from "../../core/core.js";
import { fieldTemplate } from "../../core/form.js";
import { RayInput } from "../input/input.js";
import "../menu/menu.js";

const styles = css`
  .mode-menu { display: contents; }
  .trigger {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.25em;
    height: max(1.5rem, calc(var(--_h) * 0.7));
    min-width: max(1.5rem, calc(var(--_h) * 0.7));
    margin-inline: calc(var(--_px) * 0.35);
    padding: 0 0.35em;
    font: inherit;
    font-size: var(--_fs);
    color: var(--ray-muted-foreground);
    white-space: nowrap;
    background: transparent;
    border: 0;
    border-radius: var(--ray-radius-sm);
    cursor: pointer;
  }
  .trigger:hover, .trigger[aria-expanded="true"] { color: var(--ray-foreground); background: var(--ray-default-hover); }
  .trigger:disabled { cursor: not-allowed; opacity: 0.6; }
  .trigger [data-ray-icon] svg { width: 1.1em; height: 1.1em; }
  .trigger .chevron svg { width: 0.85em; height: 0.85em; }
  .trigger .text:empty, .trigger .icon:empty { display: none; }
  /* At the start unless position="end". */
  :host(:not([position="end"])) .mode-box { order: -1; }
  .item-description { display: block; font-size: 0.85em; color: var(--ray-muted-foreground); }
`;

// An option from an <option> child: label, data-icon, data-hint,
// data-description, disabled, and every data-set-<attr> as an attribute
// for the field.
function optionOf(node) {
  const attrs = {};
  for (const a of node.attributes) {
    if (a.name.startsWith("data-set-")) attrs[a.name.slice(9)] = a.value;
  }
  return {
    value: node.value,
    label: node.getAttribute("label") ?? node.textContent.trim(),
    icon: node.dataset.icon || "",
    hint: node.dataset.hint || "",
    description: node.dataset.description || "",
    disabled: node.disabled,
    attrs,
  };
}

export class RayModeInput extends RayInput {
  static properties = {
    ...RayInput.properties,
    mode: { type: String, reflect: true },
    options: { attribute: false },
    display: { type: String, reflect: true },
    position: { type: String, reflect: true, default: "start" },
    menuLabel: { type: String, default: "Mode" },
    nativeMenu: { type: Boolean, reflect: true },
  };
  static styles = [...RayInput.styles, styles];
  static template = fieldTemplate(
    `<input id="control" class="control" part="input">` +
      `<span class="mode-box"><ray-menu class="mode-menu" placement="bottom-start" part="menu">` +
      `<button type="button" slot="trigger" class="trigger focus-ring" part="trigger">` +
      `<span class="icon" part="trigger-icon"></span><span class="text" part="trigger-label"></span>` +
      `<span class="chevron" data-ray-icon="ui.expand" aria-hidden="true"></span>` +
      `</button></ray-menu></span>`,
  );

  // The field's own value of each attribute a mode changed, to give it back.
  #saved = new Map();
  #applied = null;

  /** The modes in use: the `options` property, else the <option> children. */
  get modes() {
    if (Array.isArray(this.options)) return this.options.map((o) => ({ attrs: {}, ...o, value: String(o.value) }));
    return [...this.querySelectorAll(":scope > option")].map(optionOf);
  }

  /** The chosen mode (the first when `mode` names none). */
  get currentOption() {
    const all = this.modes;
    return all.find((o) => o.value === this.mode) ?? all[0] ?? null;
  }

  wire() {
    super.wire();
    const menu = this.$(".mode-menu");
    // Keep the caret in the field while the pointer opens the menu.
    this.$(".trigger").addEventListener("pointerdown", (e) => e.preventDefault());
    menu.addEventListener("ray-select", (e) => {
      e.stopPropagation();
      this.choose(e.detail.value);
      this.control.focus();
    });
    this.control.addEventListener("keydown", (e) => {
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        if (menu.native) menu.popupNative();
        else menu.open = true;
      }
    });
    // <option> children may come, go or change (the field's own attributes are not modes).
    new MutationObserver((records) => {
      if (records.some((r) => r.type === "childList" || r.target !== this)) this.requestUpdate();
    }).observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  /** Switches to the mode `value` as the user would: fires ray-mode-change, which may cancel it. */
  choose(value) {
    const option = this.modes.find((o) => o.value === value);
    const previous = this.currentOption;
    if (!option || option.disabled || option.value === previous?.value) {
      this.requestUpdate();
      return;
    }
    this.mode = value;
    const go = this.emit("ray-mode-change", { mode: value, previous: previous?.value ?? null, option }, { cancelable: true });
    if (!go) this.mode = previous?.value;
  }

  // The chosen mode's attributes on the field; the previous mode's taken back.
  #apply(option) {
    if (option && this.#applied === option.value) return;
    for (const [name, value] of this.#saved) {
      if (value === null) this.removeAttribute(name);
      else this.setAttribute(name, value);
    }
    this.#saved.clear();
    for (const [name, value] of Object.entries(option?.attrs ?? {})) {
      this.#saved.set(name, this.getAttribute(name));
      this.setAttribute(name, value);
    }
    this.#applied = option?.value ?? null;
  }

  update(changed) {
    const option = this.currentOption;
    // The setter, so the mode is reflected (CSS can read [mode="file"]).
    if (option && this.mode !== option.value) this.mode = option.value;
    this.#apply(option);
    super.update(changed);
    this.#renderMenu(option);
  }

  #renderMenu(option) {
    const menu = this.$(".mode-menu");
    const trigger = this.$(".trigger");
    menu.native = Boolean(this.nativeMenu);
    menu.placement = this.position === "end" ? "bottom-end" : "bottom-start";
    const display = this.display || (option?.icon ? "icon" : "label");
    trigger.querySelector(".text").textContent = display === "icon" || !option ? "" : option.hint || option.label;
    const icon = trigger.querySelector(".icon");
    const iconName = display === "label" || !option?.icon ? "" : option.icon;
    if ((icon.dataset.rayIcon ?? "") !== iconName) {
      icon.replaceChildren();
      if (iconName) icon.dataset.rayIcon = iconName;
      else delete icon.dataset.rayIcon;
    }
    // The trigger is named with the current mode: "Mode: File".
    const name = option ? `${this.menuLabel ?? "Mode"}: ${option.label}` : this.menuLabel ?? "Mode";
    trigger.setAttribute("aria-label", name);
    trigger.title = name;
    trigger.disabled = this.effectivelyDisabled || Boolean(this.readonly);

    // The menu: one radio item per mode, the current one checked.
    const all = this.modes;
    // A native menu takes the item's whole text as its title: no description there.
    const describe = !this.nativeMenu;
    const key = JSON.stringify([describe, all.map((o) => [o.value, o.label, o.description, Boolean(o.disabled)])]);
    if (menu.dataset.key !== key) {
      menu.dataset.key = key;
      for (const old of menu.querySelectorAll("ray-menu-item")) old.remove();
      for (const o of all) {
        const item = document.createElement("ray-menu-item");
        item.type = "radio";
        item.name = "mode";
        item.value = o.value;
        item.disabled = Boolean(o.disabled);
        item.append(o.label);
        if (o.description && describe) {
          const d = document.createElement("span");
          d.className = "item-description";
          d.textContent = o.description;
          item.append(d);
        }
        menu.append(item);
      }
    }
    for (const item of menu.querySelectorAll("ray-menu-item")) item.checked = item.value === option?.value;
    this.paintIcons(this.shadowRoot);
  }
}

define("ray-mode-input", RayModeInput);
