# QR code (also QR, Barcode, 2D code)

A QR code of a text or a link (to open on a phone, pair a device, set up two-step sign-in), drawn as one SVG path: sharp at any size and in print. Its own encoder, no dependencies (about 3 KB gzip, only where imported); a logo at the middle; toSVG() and toPNG() to save or share it.

Import: `import "@raylang/elements/qr";` · Category: Data display

## `<ray-qr>` (RayQr, extends RayElement)

Dark on light whatever the theme (scanners need it): --ray-qr-color and --ray-qr-background (or color and background) change them, keep the modules darker. The smallest version that holds the text is used, and the error correction raised while it still fits (a stronger code, same size). Text: UTF-8, as phones read it. The encoder alone: import { qrMatrix } from "@raylang/elements/qr".

Properties:

- `value`: string. The text or link to encode. Empty: nothing is drawn.
- `ecc`: `L` | `M` | `Q` | `H`, default `M`, reflects. Error correction, the least used (raised when it costs no size): L recovers 7 % of the code, M 15 %, Q 25 %, H 30 %. With a logo, always H.
- `size`: `"xs" | "sm" | "md" | "lg" | "xl" | (string & {})`, default `md`, reflects. The side, quiet zone included: xs (4rem), sm (6rem), md (8rem), lg (12rem), xl (16rem), or any CSS length.
- `quietZone` (attribute `quiet-zone`): number, default `4`. The light margin around the code, in modules (the standard asks for 4; 2 reads well on a plain background).
- `color`: string. The modules' color: a palette color or any CSS color (default black). Keep it dark.
- `background`: string. The background, any CSS color (default white). Keep it light.
- `label`: string. Its accessible name (default "QR code", translated). Say what it is for ("Scan to open on your phone"), and show the link or code as text too: not everyone can scan.

Events:

- `ray-error` (detail `{ error: Error }`): The value does not fit in a QR code (over about 2,900 bytes at L); nothing is drawn.

Slots:

- (default): A logo for the middle (an <img> or an <svg>), on the background color, 22 % of the code's side.

Parts (`::part()`):

- `code`: The <svg>.
- `background`: The background rectangle.
- `modules`: The path of the dark modules.
- `logo`: The logo's box.

Methods and properties:

- `readonly matrix: { version: number; ecc: "L" | "M" | "Q" | "H"; mask: number; size: number; modules: boolean[][] } | null`: The code drawn: its version, the level used, the mask and modules[y][x] (true: dark); null when nothing is drawn.
- `toSVG(options?: { size?: number }): string`: A standalone SVG document, colors resolved, an <img> logo included; size in px (default: as drawn).
- `toPNG(options?: { size?: number }): Promise<Blob>`: A PNG (an <img> logo included; one from another origin without CORS rejects it); size in px (default 8 px a module).

Exports (from `@raylang/elements/qr` and `@raylang/elements`):

- `function qrMatrix(text: string, options?: { ecc?: "L" | "M" | "Q" | "H"; mask?: number }): { version: number; ecc: "L" | "M" | "Q" | "H"; mask: number; size: number; modules: boolean[][] }`: The encoder alone: the QR code of a text (modules[y][x], true: dark), for a canvas, a printer or a server. Throws a RangeError when the text does not fit.

Texts (`setStrings`; English):

- `qr.label`: QR code

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.27.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<style>
  .demo-qr-row { display: flex; flex-wrap: wrap; gap: var(--ray-space-6); align-items: center; }
  .demo-qr-share { display: grid; grid-template-columns: auto minmax(0, 18rem); justify-content: start; gap: var(--ray-space-5); align-items: center; }
  .demo-qr-share p { margin: 0; font-size: var(--ray-font-size-sm); color: var(--ray-muted-foreground); }
  .demo-qr-secret { font-family: var(--ray-font-mono); font-size: var(--ray-font-size-sm); letter-spacing: 0.08em; overflow-wrap: anywhere; }
  .demo-qr-sizes { display: flex; flex-wrap: wrap; gap: var(--ray-space-4); align-items: flex-end; }
  @media (max-width: 40em) { .demo-qr-share { grid-template-columns: 1fr; } }
</style>

<div class="demo-caption">Open on your phone: type a link, the code follows</div>
<div class="demo-qr-share">
  <ray-qr id="demo-qr-link" size="lg" value="https://elements.raylang.dev" label="Scan to open the link on your phone"></ray-qr>
  <div class="demo-stack">
    <ray-input id="demo-qr-input" label="Link" value="https://elements.raylang.dev"></ray-input>
    <p id="demo-qr-info"></p>
    <div class="demo-actions">
      <ray-button size="xs" variant="default" id="demo-qr-png">Download PNG</ray-button>
      <ray-button size="xs" variant="default" id="demo-qr-svg">Download SVG</ray-button>
    </div>
  </div>
</div>

<div class="demo-caption">Two-step sign-in: the code, and the key as text for who cannot scan</div>
<div class="demo-qr-share">
  <ray-qr size="md" quiet-zone="2" value="otpauth://totp/rayvault:ana@example.com?secret=JBSWY3DPEHPK3PXP&amp;issuer=rayvault" label="Scan with your authenticator app"></ray-qr>
  <div class="demo-stack">
    <p>Scan it with your authenticator app, or type this key:</p>
    <span class="demo-qr-secret">JBSW Y3DP EHPK 3PXP</span>
  </div>
</div>

<div class="demo-caption">A logo at the middle (the error correction goes up to H), colors, sizes</div>
<div class="demo-qr-sizes">
  <ray-qr size="lg" value="https://github.com/ray-language/ray-elements" label="ray-elements on GitHub">
    <img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='9' height='9' rx='2' fill='%231c7ed6'/%3E%3Crect x='13' y='2' width='9' height='9' rx='2' fill='%2374c0fc'/%3E%3Crect x='2' y='13' width='9' height='9' rx='2' fill='%2374c0fc'/%3E%3Crect x='13' y='13' width='9' height='9' rx='2' fill='%231c7ed6'/%3E%3C/svg%3E">
  </ray-qr>
  <ray-qr size="md" color="indigo" value="https://elements.raylang.dev/components/qr.html" label="This page"></ray-qr>
  <ray-qr size="sm" value="WIFI:T:WPA;S:Studio;P:correct horse battery staple;;" label="Join the studio's Wi-Fi"></ray-qr>
  <ray-qr size="xs" value="https://raylang.dev" label="raylang.dev"></ray-qr>
</div>

<script type="module">
  const qr = document.getElementById("demo-qr-link");
  const input = document.getElementById("demo-qr-input");
  const info = document.getElementById("demo-qr-info");
  const describe = () => {
    const m = qr.matrix;
    info.textContent = m ? `Version ${m.version} (${m.size} × ${m.size} modules), error correction ${m.ecc}.` : "Type something to encode.";
  };
  input.addEventListener("input", async () => {
    qr.value = input.value;
    await new Promise(requestAnimationFrame);
    describe();
  });
  qr.addEventListener("ray-error", () => (info.textContent = "Too long for a QR code."));
  customElements.whenDefined("ray-qr").then(() => requestAnimationFrame(describe));
  const save = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  document.getElementById("demo-qr-png").addEventListener("click", async () => save(await qr.toPNG({ size: 512 }), "link.png"));
  document.getElementById("demo-qr-svg").addEventListener("click", () => save(new Blob([qr.toSVG({ size: 512 })], { type: "image/svg+xml" }), "link.svg"));
</script>
```
