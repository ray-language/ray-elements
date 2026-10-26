# Carousel

Slides in a scroll-snap viewport: native swipe and scrolling, previous/next controls, indicators, keyboard, loop and autoplay with a pause button.

Import: `import "@raylang/elements/carousel";` · Category: Data display

## `<ray-carousel>` (RayCarousel, extends RayElement)

Any child is a slide. With several slides in view, positions are the snap points the viewport can reach. ArrowLeft/Right (Up/Down when vertical), Home and End move it.

Properties:

- `index`: number, default `0`. Current position (0-based). Setting it scrolls there.
- `label`: string, default `Carousel`. Accessible name of the carousel region.
- `slideSize` (attribute `slide-size`): string. Size of each slide along the scroll axis ("100%" by default; "50%", "18rem"…).
- `slideGap` (attribute `slide-gap`): string. Space between slides (default var(--ray-space-4)).
- `align`: `start` | `center`, default `start`, reflects. Where a slide snaps in the viewport.
- `orientation`: `horizontal` | `vertical`, default `horizontal`, reflects. Scroll axis (vertical needs a height; 20rem by default).
- `loop`: boolean, reflects. next() on the last position goes to the first, prev() on the first to the last.
- `autoplay`: number, default `0`. Milliseconds between automatic moves (0: off). Pauses on hover, focus and when the page is hidden; starts paused with reduced motion. Shows a pause/play button.
- `hideControls` (attribute `hide-controls`): boolean, reflects. No previous/next buttons.
- `hideIndicators` (attribute `hide-indicators`): boolean, reflects. No indicator dots.

Events:

- `change`: The current position changed (read `index`) by the user or a method (controls, indicators, keyboard, swipe, scroll, next/prev/goTo, autoplay) — not when `index` is set by code.

Slots:

- (default): The slides.

Parts (`::part()`):

- `viewport`: The scrolling viewport.
- `previous`: The previous button.
- `next`: The next button.
- `indicators`: The row of indicator dots.
- `indicator`: Each indicator dot ([aria-current] on the active one).
- `play`: The pause/play button (with autoplay).

Methods and properties:

- `next(): void`: Goes to the next position.
- `prev(): void`: Goes to the previous position.
- `goTo(index: number, options?: { instant?: boolean }): void`: Scrolls to a position (smoothly unless instant or reduced motion).
- `readonly count: number`: Number of positions.
- `readonly slides: Element[]`: The slide elements.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.9.0.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<style>
  .demo-slide { display: grid; place-items: center; height: 10rem; border-radius: var(--ray-radius-default); font-size: 2.5rem; font-weight: var(--ray-font-weight-bold); }
</style>
<div style="display: grid; gap: 2rem">
  <ray-carousel label="Releases">
    <div class="demo-slide" style="background: var(--ray-blue-light); color: var(--ray-blue-light-color)">1</div>
    <div class="demo-slide" style="background: var(--ray-teal-light); color: var(--ray-teal-light-color)">2</div>
    <div class="demo-slide" style="background: var(--ray-violet-light); color: var(--ray-violet-light-color)">3</div>
    <div class="demo-slide" style="background: var(--ray-orange-light); color: var(--ray-orange-light-color)">4</div>
  </ray-carousel>
  <ray-carousel label="Two at a time" slide-size="50%" loop>
    <div class="demo-slide" style="background: var(--ray-pink-light); color: var(--ray-pink-light-color)">A</div>
    <div class="demo-slide" style="background: var(--ray-indigo-light); color: var(--ray-indigo-light-color)">B</div>
    <div class="demo-slide" style="background: var(--ray-cyan-light); color: var(--ray-cyan-light-color)">C</div>
    <div class="demo-slide" style="background: var(--ray-green-light); color: var(--ray-green-light-color)">D</div>
    <div class="demo-slide" style="background: var(--ray-yellow-light); color: var(--ray-yellow-light-color)">E</div>
  </ray-carousel>
  <ray-carousel label="Autoplay" autoplay="3000" loop hide-controls>
    <div class="demo-slide" style="background: var(--ray-muted)">Every</div>
    <div class="demo-slide" style="background: var(--ray-muted)">3 seconds</div>
    <div class="demo-slide" style="background: var(--ray-muted)">(hover pauses)</div>
  </ray-carousel>
</div>
```
