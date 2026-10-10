// The generated declarations as an app uses them (checked by `tsc` with
// skipLibCheck off, so packages/*/*.d.ts are compiled, not trusted).

import { setIcons, type RayNumberInput, type RayAppBar } from "@raylang/elements";
import "@raylang/elements/button";
import { RayButton, RayMenu, RayMenuItem } from "@raylang/react";
import RayDs, { RaySwitch } from "@raylang/vue";

setIcons({});

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

export const vue = [RayDs, RaySwitch, prefix];
