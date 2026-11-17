// The generated declarations as an app uses them (checked by `tsc` with
// skipLibCheck off, so packages/*/*.d.ts are compiled, not trusted).

import { setIcons, type RayNumberInput, type RayAppBar, type IconName } from "@raylang/elements";
import "@raylang/elements/button";
import { RayButton, RayMenu, RayMenuItem } from "@raylang/react";
import RayElements, { RaySwitch } from "@raylang/vue";
import { checkMarkup, RULES, type Diagnostic } from "@raylang/elements/check";
import { setStrings, taperPosition, taperValue, type Taper } from "@raylang/elements/core";
import es from "@raylang/elements/strings/es";
import esFile from "@raylang/elements/strings/es.js";

setIcons({});

// The catalogs of texts: an entry of their own, and the file by its name.
setStrings(es);
setStrings("es", esFile);

// A fader's curve, for an app's own control.
const taper: Taper = "fader";
const at: number = taperPosition(-12, -60, 6, taper);
const db: number = taperValue(at, -60, 6, "fader");
// @ts-expect-error: a taper is linear or fader
taperPosition(0, -60, 6, "log");
void db;

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
