// Compile-time checks of the wrappers `wrap` generated for these components.
// Each @ts-expect-error must hit a real error, or tsc fails.
import { AppColorField, AppSaveButton, AppHoverCard } from "./wrappers/react.js";
import { AppColorField as VueColorField, AppComponents } from "./wrappers/vue.js";
import type { AppColorField as ColorFieldElement } from "./wrappers/index.js";

export const react = [
  // Inherited from FieldControl: label, required, size…
  <AppColorField label="Accent" required size="md" value="#ff0000" onInput={(e) => void e} />,
  // @ts-expect-error size comes from FieldControl's union
  <AppColorField size="huge" />,
  // Inherited from RayButton: variant, color, type…
  <AppSaveButton dirty variant="light" type="submit" color="teal">Save</AppSaveButton>,
  // @ts-expect-error not a ray-button variant
  <AppSaveButton variant="neon" />,
  // Inherited from Floating: placement, open; and its typed events.
  <AppHoverCard placement="right" openDelay={100} onRayOpen={(e) => void e.detail} />,
];

const el: HTMLElementTagNameMap["app-color-field"] = document.createElement("app-color-field");
const typed: ColorFieldElement = el;
typed.label = "Accent";
typed.checkValidity();
// @ts-expect-error value is a string
typed.value = 3;

export const vue = [VueColorField, AppComponents];
