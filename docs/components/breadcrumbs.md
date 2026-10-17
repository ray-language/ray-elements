# Breadcrumbs

Where a page sits (Mantine's Breadcrumbs, the WAI-ARIA breadcrumb pattern): links in a labelled nav, the last one the current page. Any separator or a chevron; a long path collapses into an expandable "…".

Import: `import "@raylang/elements/breadcrumbs";` · Category: Navigation

## `<ray-breadcrumbs>` (RayBreadcrumbs, extends RayElement)

A <nav aria-label="Breadcrumb"> around a list. The last crumb is the current page (aria-current="page") unless one says current.

Properties:

- `separator`: string, default `/`. Text between crumbs ("/", "›", "·") or "chevron" (an icon).
- `maxItems` (attribute `max-items`): number. Longer paths show the first crumb, "…" (a button that expands them) and the last max-items − 1.
- `label`: string, default `Breadcrumb`. Accessible name of the nav.
- `size`: `xs` | `sm` | `md` | `lg`, default `sm`, reflects. Font size.

Slots:

- (default): ray-breadcrumb elements.

Parts (`::part()`):

- `nav`: The <nav>.
- `list`: The <ol>.

Methods and properties:

- `readonly items: RayBreadcrumb[]`: The crumbs, in order.
- `expand(): void`: Shows every crumb of a collapsed path.

## `<ray-breadcrumb>` (RayBreadcrumb, extends RayElement)

A link with href (text without, or when current).

Properties:

- `href`: string, reflects. Where it leads.
- `current`: boolean, reflects. This crumb is the current page (default: the last).

Slots:

- (default): The text.
- `icon`: An icon before the text.

Parts (`::part()`):

- `link`: The link (or the text of the current page).
- `separator`: The separator before it.
- `more`: The "…" button of a collapsed path.

Shared rules (loading, slots, forms, events, theme, React and Vue): https://elements.raylang.dev/llms.txt. This page describes ray-elements 0.5.2.

## Example

The markup of the site's live example (the `demo-*` classes are the site's, not ray-elements's).

```html
<div class="demo-caption">A page header</div>
<div class="demo-bc-header">
  <ray-breadcrumbs separator="chevron">
    <ray-breadcrumb href="#breadcrumbs"><ray-icon slot="icon" name="home"></ray-icon>Home</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">Projects</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">ray-remote</ray-breadcrumb>
    <ray-breadcrumb>Settings</ray-breadcrumb>
  </ray-breadcrumbs>
  <ray-group justify="space-between">
    <strong class="demo-title">Settings</strong>
    <ray-group gap="xs"><ray-button size="xs" variant="default">Discard</ray-button><ray-button size="xs">Save</ray-button></ray-group>
  </ray-group>
</div>

<div class="demo-caption">A deep path, collapsed: max-items</div>
<ray-stack gap="sm">
  <ray-breadcrumbs id="demo-bc-files" max-items="4" separator="›" label="Folder">
    <ray-breadcrumb href="#breadcrumbs"><ray-icon slot="icon" name="folder"></ray-icon>Drive</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">Company</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">Design</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">2026</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">Q4</ray-breadcrumb>
    <ray-breadcrumb href="#breadcrumbs">ray-elements</ray-breadcrumb>
    <ray-breadcrumb>screenshots</ray-breadcrumb>
  </ray-breadcrumbs>
  <span class="demo-muted">The “…” is a button: it shows the whole path (and focus moves into it).</span>
</ray-stack>

<div class="demo-caption">Separators and sizes</div>
<ray-stack gap="sm">
  <ray-breadcrumbs size="xs"><ray-breadcrumb href="#breadcrumbs">Docs</ray-breadcrumb><ray-breadcrumb href="#breadcrumbs">Components</ray-breadcrumb><ray-breadcrumb>Breadcrumbs</ray-breadcrumb></ray-breadcrumbs>
  <ray-breadcrumbs separator="·"><ray-breadcrumb href="#breadcrumbs">Docs</ray-breadcrumb><ray-breadcrumb href="#breadcrumbs">Components</ray-breadcrumb><ray-breadcrumb>Breadcrumbs</ray-breadcrumb></ray-breadcrumbs>
  <ray-breadcrumbs separator="→" size="md"><ray-breadcrumb href="#breadcrumbs">Cart</ray-breadcrumb><ray-breadcrumb href="#breadcrumbs">Shipping</ray-breadcrumb><ray-breadcrumb>Payment</ray-breadcrumb></ray-breadcrumbs>
  <ray-breadcrumbs separator="chevron" size="lg"><ray-breadcrumb href="#breadcrumbs">Store</ray-breadcrumb><ray-breadcrumb href="#breadcrumbs" current>Keyboards</ray-breadcrumb><ray-breadcrumb href="#breadcrumbs">Keycaps</ray-breadcrumb></ray-breadcrumbs>
</ray-stack>
<p class="demo-muted">The last crumb is the current page unless one says <code>current</code> (the last row).</p>
```
