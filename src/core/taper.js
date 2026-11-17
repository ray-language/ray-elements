// Tapers: where a value sits along a control (0 at min, 1 at max), shared by
// ray-slider and ray-meter so a meter beside a fader lines up with its marks.
//
//   linear: the values evenly spread.
//   fader:  a mixing desk's curve for dB: the position follows the fourth root
//           of the gain (10^(dB/80)), rescaled so min is the bottom. The range
//           used to mix (0 dB, -6, -12) gets most of the travel; -40…-60 a
//           sliver. With -60…+6, 0 dB sits at 81 %, -12 at 52 %, -24 at 32 %.
//
// An app that draws its own fader uses the same two functions:
//
//   import { taperPosition, taperValue } from "@raylang/elements/core";
//   taperPosition(-12, -60, 6, "fader");   // 0.52

const curve = (v) => Math.pow(10, v / 80);

/** Where `value` sits between min (0) and max (1); clamped. */
export function taperPosition(value, min, max, taper = "linear") {
  if (!(max > min)) return 0;
  if (!(value > min)) return 0;
  if (value >= max) return 1;
  if (taper === "fader") return (curve(value) - curve(min)) / (curve(max) - curve(min));
  return (value - min) / (max - min);
}

/** The value at `position` (0…1) between min and max: taperPosition's inverse. */
export function taperValue(position, min, max, taper = "linear") {
  const p = Math.min(1, Math.max(0, position));
  if (!(max > min)) return min;
  if (taper === "fader") return 80 * Math.log10(curve(min) + p * (curve(max) - curve(min)));
  return min + p * (max - min);
}
