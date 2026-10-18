// The generated declarations as an app uses them (checked by `tsc` with
// skipLibCheck off, so packages/*/*.d.ts are compiled, not trusted).

import { setIcons, type RayNumberInput, type RayAppBar, type IconName } from "@raylang/elements";
import "@raylang/elements/button";
import { RayButton, RayMenu, RayMenuItem } from "@raylang/react";
import RayElements, { RaySwitch } from "@raylang/vue";
import { checkMarkup, RULES, type Diagnostic } from "@raylang/elements/check";

setIcons({});

// Icon names: the default set completes, an app's own names still type-check.
const icons: IconName[] = ["star", "chevron-down", "none", "my-own-icon"];

// The markup checker.
const found: Diagnostic[] = checkMarkup("<ray-button></ray-button>", { manifest: {}, file: "a.html", allow: { variant: ["brand"] } });
const rule: keyof typeof RULES | undefined = found[0]?.rule;

// The tag map: every element is an Element (HTMLElementTagNameMap).
const input: RayNumberInput | null = document.querySelector("ray-number-input");
const prefix: string | null | undefined = input?.prefix;
const bar = document.createElement("ray-app-bar") satisfies RayAppBar;
bar.scrollBehavior = "hide";
bar.scroll(0, 0);

export const view = (
  <RayMenu onRaySelect={(e) => console.log(e.detail)}>
    <RayButton slot="trigger" variant="light">Actions</RayButton>
    <RayMenuItem value="rename">Rename</RayMenuItem>
  </RayMenu>
);

export const vue = [RayElements, RaySwitch, prefix];
