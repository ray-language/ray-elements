# Blockquote

A quotation set apart from the text (Mantine's Blockquote): a colored edge, a quote mark on it and the attribution below. A real <blockquote> inside, with the source's URL as its cite.

Import: `import "@raylang/elements/blockquote";` · Category: Data display

## `<ray-blockquote>` (RayBlockquote, extends RayElement)

Paragraphs in it are spaced and the last one has no bottom margin. The attribution is text (cite) or rich content (slot="cite": an avatar, a name, a role).

Properties:

- `cite`: string. Who said it, shown below the quote ("— Grace Hopper").
- `href`: string. URL of the source: the inner blockquote's cite attribute.
- `color`: string, reflects. A palette color or any CSS color, for the edge, the mark and the tint. Default: the primary.
- `variant`: `light` | `outline` | `filled`, default `light`, reflects. light: tinted background; outline: border and edge only; filled: solid color (a pull quote).
- `icon`: string, default `quote`. Registry icon of the mark, or none. The icon slot replaces it.
- `size`: `sm` | `md` | `lg`, default `md`, reflects. Text size (lg for a pull quote).
- `padding`: string, reflects. Inner spacing: xs…xl (the spacing scale), px as a number, or a CSS length. Default: md.
- `hideEdge` (attribute `hide-edge`): boolean, reflects. No colored edge on the start side (the tint, border and mark stay).
- `radius`: string, reflects. Corner radius: xs…xl, none, or a CSS length. Default: md.

Slots:

- (default): The quotation (text or paragraphs).
- `cite`: Rich attribution, instead of cite.
- `icon`: A custom mark, instead of icon.

Parts (`::part()`):

- `quote`: The <blockquote>.
- `icon`: The disc with the mark.
- `cite`: The attribution (a <figcaption>).

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">Default</div>
<ray-blockquote cite="— Grace Hopper" href="https://en.wikipedia.org/wiki/Grace_Hopper">
  The most dangerous phrase in the language is "We've always done it this way."
</ray-blockquote>

<div class="demo-caption">Variants and colors</div>
<div class="demo-grid demo-quotes">
  <ray-blockquote color="teal" cite="— Edsger Dijkstra">Simplicity is prerequisite for reliability.</ray-blockquote>
  <ray-blockquote variant="outline" color="orange" cite="— Alan Kay">The best way to predict the future is to invent it.</ray-blockquote>
  <ray-blockquote variant="filled" color="violet" cite="— Ada Lovelace" radius="lg">The more I study, the more insatiable do I feel my genius for it to be.</ray-blockquote>
  <ray-blockquote color="red" icon="alert-triangle" cite="— The raylang manual">A closure stored in a variable cannot cross a fiber boundary in a native build.</ray-blockquote>
</div>

<div class="demo-caption">Spacing and edge</div>
<div class="demo-grid demo-quotes">
  <ray-blockquote padding="xs" size="sm" cite="padding=&quot;xs&quot;">Compact, for dense panels and sidebars.</ray-blockquote>
  <ray-blockquote padding="lg" cite="padding=&quot;lg&quot;">Roomy, for a quote that leads a section.</ray-blockquote>
  <ray-blockquote hide-edge color="teal" cite="hide-edge">Only the tint and the mark, no colored edge.</ray-blockquote>
  <ray-blockquote hide-edge icon="none" variant="outline" color="gray" cite="hide-edge · icon=&quot;none&quot; · outline">The plainest one: a bordered box.</ray-blockquote>
</div>

<div class="demo-caption">A testimonial</div>
<ray-blockquote color="blue" size="lg" variant="outline" radius="xl">
  <p>We moved our desktop tools to raylang and ray-elements in a week. The components looked right on day one, in light and dark, and the forms just worked.</p>
  <div slot="cite" class="demo-quote-author">
    <ray-avatar name="Katherine Johnson" color="blue"></ray-avatar>
    <div><strong>Katherine Johnson</strong><span>Engineering lead, Orbit Labs</span></div>
    <ray-badge variant="light" color="green" normal-case style="margin-inline-start: auto">Verified customer</ray-badge>
  </div>
</ray-blockquote>

<div class="demo-caption">In an article</div>
<article class="demo-article">
  <h3>Why the web components are form-associated</h3>
  <p>Every field of ray-elements takes part in its <code>&lt;form&gt;</code> like a native control: it is submitted under its name, validated, reset and disabled by a fieldset.</p>
  <ray-blockquote size="sm" icon="none" variant="outline" color="gray" cite="— WHATWG HTML Living Standard" href="https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements">
    Form-associated custom elements enable web authors to define and create custom elements which participate in form submission.
  </ray-blockquote>
  <p>That is why a <code>FormData</code> built from a form full of ray-elements fields has every value in it, with no glue code.</p>
</article>
```
